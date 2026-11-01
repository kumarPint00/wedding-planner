/* Pankaj ki Shadi · Reminder Center v79
 * Local scheduled reminders + notifications while app is running.
 * No background push claims: OS Calendar (.ics) export for closed-app alarms.
 * All times are interpreted as Asia/Kolkata (fixed UTC+05:30). */
(function(){
"use strict";
const DAY=86400000,HOUR=3600000,STORAGE="pankaj-reminder-device-v79";
const $=id=>document.getElementById(id);
const todayIST=()=>new Date(Date.now()+330*60000).toISOString().slice(0,10);
const clockIST=()=>new Date(Date.now()+330*60000).toISOString().slice(11,16);
const parseIST=(date,time="09:00")=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(String(date)))return NaN;const t=/^\d{2}:\d{2}$/.test(String(time))?time:"09:00";return Date.parse(date+"T"+t+":00+05:30")};
const isoLocal=timestamp=>new Date(timestamp+330*60000).toISOString().slice(0,10);
const timeLocal=timestamp=>new Date(timestamp+330*60000).toISOString().slice(11,16);
const nice=timestamp=>new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",day:"numeric",month:"short",hour:"numeric",minute:"2-digit",hour12:true}).format(new Date(timestamp));
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const eid=()=>Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,9);
const prefsDefault={nativeEnabled:false,taskEnabled:true,calendarEnabled:true,quiet:true,leadDays:1,taskTime:"09:00",calendarTime:"09:00"};
let data={prefs:{...prefsDefault},dismissed:{},delivered:{},read:{},snoozes:{}};
let loaded=false,booted=false,opened=false,busy=false,lastCheck=0;
const safeState=()=>{try{return typeof state!=="undefined"&&state?.data?.tasks&&state?.data?.calendar?state:null}catch{return null}};
function loadLocal(){
 try{const old=JSON.parse(localStorage.getItem(STORAGE)||"{}");
 if(old&&typeof old==="object"){
  data.prefs={...prefsDefault,...(old.prefs||{})};
  for(const field of ["dismissed","delivered","read","snoozes"])data[field]=old[field]&&typeof old[field]==="object"?old[field]:{};
 }}catch(e){/* No storage / private mode */}loaded=true;
}
function persistLocal(){
 const now=Date.now();
 for(const field of ["dismissed","delivered","read","snoozes"]){
  const entries=Object.entries(data[field]);
  for(const [key,value] of entries){
   if(field==="snoozes"){if(Number(value)<now-3*DAY)delete data[field][key];continue}
   if(field==="delivered"&&Number(value)<now-45*DAY)delete data[field][key];
  }
  const trimmed=Object.entries(data[field]);if(trimmed.length>1200)
   for(const [key] of trimmed.slice(0,trimmed.length-1200))delete data[field][key];
 }
 try{localStorage.setItem(STORAGE,JSON.stringify(data))}catch(e){}
}
function reminderRows(store,now=Date.now()){
 if(!store?.data)return [];
 const alerts=[];
 const add=(kind,id,title,description,at,date,url,extra={})=>{
  if(!Number.isFinite(at)||at<now-14*DAY||at>now+45*DAY)return;
  const key=kind+":"+String(id)+":"+date;
  const snoozed=Number(data.snoozes[key]||0);
  alerts.push({key,kind,id:String(id),title:String(title||"Reminder"),description:String(description||""),
   date,at:snoozed>at?snoozed:at,originalAt:at,url, ...extra});
 };
 if(data.prefs.taskEnabled)for(const t of store.data.tasks||[]){
  if(!t||!t.due||["done","not required","cancelled","skipped","completed"].includes(String(t.status||"").trim().toLowerCase()))continue;
  const time=data.prefs.taskTime;
  const at=parseIST(t.due,time)-Math.max(0,Math.min(7,+data.prefs.leadDays||0))*DAY;
  add("task",t.id,"Task: "+(t.title||"Wedding task"),
   [t.owner?"For "+t.owner:"",t.due?"Due "+t.due:""].filter(Boolean).join(" • "),at,t.due,"/tasks.html",
   {priority:t.priority||""});
 }
 if(data.prefs.calendarEnabled)for(const c of store.data.calendar||[]){
  if(!c||!c.date||["done","completed","cancelled","canceled","not required"].includes(String(c.status||"").toLowerCase()))continue;
  const at=parseIST(c.date,data.prefs.calendarTime)-Math.max(0,Math.min(7,+data.prefs.leadDays||0))*DAY;
  add("calendar",c.id,"Calendar: "+(c.title||"Wedding event"),
   [c.type,c.status].filter(Boolean).join(" • "),at,c.date,"/calendar.html");
 }
 for(const r of store.data.reminders||[]){
  if(!r||!r.id||!r.date||r.disabled)continue;
  const base=parseIST(r.date,r.time||"09:00");if(!Number.isFinite(base))continue;
  const repeat=["daily","weekly"].includes(r.repeat)?r.repeat:"once";
  const step=repeat==="daily"?DAY:repeat==="weekly"?7*DAY:0;
  if(!step){add("custom",r.id,r.title,r.notes||"",base,r.date,r.url||"/calendar.html",{repeat:"once"});continue}
  const nearest=Math.max(0,Math.floor((now-base)/step));
  // Previous occurrence may still be due. Next two are useful upcoming reminders.
  for(let index=Math.max(0,nearest-1);index<=nearest+2;index++){
   const at=base+index*step;
   add("custom",r.id,r.title,r.notes||"",at,isoLocal(at),r.url||"/calendar.html",{repeat});
  }
 }
 const unique=new Map();
 for(const a of alerts)if(!unique.has(a.key))unique.set(a.key,a);
 return [...unique.values()].filter(a=>!data.dismissed[a.key]).sort((a,b)=>a.at-b.at);
}
function viewRows(now=Date.now()){
 const items=reminderRows(safeState(),now);
 return {due:items.filter(x=>x.at<=now),upcoming:items.filter(x=>x.at>now&&x.at<=now+14*DAY)};
}
function signal(){
 const bell=$("reminderBell");if(!bell)return;
 const {due}=viewRows();
 const unread=due.filter(x=>!data.read[x.key]).length;
 const badge=$("reminderBadge");
 if(badge){badge.textContent=unread>99?"99+":String(unread);badge.hidden=!unread}
 bell.setAttribute("aria-label","Reminders"+(unread?" — "+unread+" new":""));
}
function panelHTML(){
 const supported=typeof Notification!=="undefined"&&typeof Notification.requestPermission==="function";
 const perm=supported?Notification.permission:"unsupported";
 return '<div class="rc-head"><div><small>शादी की तैयारी</small><h2 id="reminderTitle">Reminders & notifications</h2><p>Tasks, functions and your personal reminders • All times IST</p></div><button type="button" id="rcClose" aria-label="Close reminders">✕</button></div>'+
 '<div class="rc-content">'+
 '<section class="rc-settings"><div><strong>Device alerts</strong><small id="rcPermissionText">'+
 (perm==="granted"?(data.prefs.nativeEnabled?"Enabled while app is running":"Permission allowed • alerts off"):perm==="denied"?"Blocked in browser settings":perm==="unsupported"?"Not supported in this app/browser":"Permission not requested")+
 '</small></div><button type="button" class="btn green" id="rcEnable">'+(data.prefs.nativeEnabled?"Disable alerts":"Enable alerts")+'</button></section>'+
 '<p class="rc-note">In-app reminders work here even without permission. Device notifications appear only when supported and the app is running. For closed-app reminders, export to your phone calendar below.</p>'+
 '<div class="rc-tools"><button type="button" class="btn alt" id="rcCreate">+ New reminder</button><button type="button" class="btn alt" id="rcCalendarExport">Export phone alarms (.ics)</button><button type="button" class="btn alt" id="rcTest">Test device notification</button></div>'+
 '<form id="rcCreateForm" class="rc-create-form" hidden>'+
 '<label>What to remember?<input name="title" maxlength="120" required placeholder="Pay tent advance / Collect sarees"></label>'+
 '<div class="rc-two"><label>Date<input name="date" type="date" required value="'+todayIST()+'"></label><label>Time (IST)<input name="time" type="time" required value="09:00"></label></div>'+
 '<div class="rc-two"><label>Repeat<select name="repeat"><option value="once">Once</option><option value="daily">Daily</option><option value="weekly">Weekly</option></select></label><label>Category<select name="category"><option>General</option><option>Payment</option><option>Shopping</option><option>Travel</option><option>Function</option><option>Family</option></select></label></div>'+
 '<label>Notes (optional)<textarea name="notes" rows="2" maxlength="400" placeholder="Vendor name, amount, or details"></textarea></label>'+
 '<div class="rc-form-actions"><button class="btn green" type="submit">Save reminder</button><button class="btn alt" type="button" id="rcCancelForm">Cancel</button></div></form>'+
 '<details class="rc-preferences"><summary>Reminder preferences</summary><div class="rc-pref-fields">'+
 '<label><input type="checkbox" id="rcTasks" '+(data.prefs.taskEnabled?"checked":"")+'> Task due reminders</label>'+
 '<label><input type="checkbox" id="rcCalendar" '+(data.prefs.calendarEnabled?"checked":"")+'> Calendar event reminders</label>'+
 '<label><input type="checkbox" id="rcQuiet" '+(data.prefs.quiet?"checked":"")+'> Quiet hours: 10 PM–7 AM IST</label>'+
 '<label>Remind before due date<select id="rcLead">'+[0,1,2,3,7].map(n=>'<option value="'+n+'" '+(Number(data.prefs.leadDays)===n?"selected":"")+'>'+ (n===0?"Same day":n+" day"+(n===1?"":"s")+" before")+'</option>').join("")+'</select></label>'+
 '<label>Task reminder time<input id="rcTaskTime" type="time" value="'+esc(data.prefs.taskTime)+'"></label>'+
 '<label>Calendar reminder time<input id="rcCalendarTime" type="time" value="'+esc(data.prefs.calendarTime)+'"></label></div></details>'+
 '<div class="rc-section-title"><h3>Due & overdue</h3><button type="button" id="rcReadAll" class="rc-text-button">Mark as read</button></div><div id="rcDueList"></div>'+
 '<div class="rc-section-title"><h3>Upcoming (next 14 days)</h3></div><div id="rcUpcomingList"></div>'+
 '<div class="rc-section-title"><h3>My saved reminders</h3></div><div id="rcCustomList"></div>'+
 '<p class="rc-foot">No paid notification API is used. Background push to a closed Android APK requires separate native setup.</p></div>';
}
function showRows(){
 const root=$("rcDueList");if(!root)return;
 const {due,upcoming}=viewRows();
 const render=(items,mode)=>items.slice(0,40).map(r=>
  '<article class="rc-item '+(mode==="due"&&!data.read[r.key]?"rc-unread":"")+'">'+
  '<div class="rc-item-text"><span class="rc-type">'+esc(r.kind)+(r.priority?" • "+esc(r.priority):"")+'</span>'+
  '<b>'+esc(r.title)+'</b><small>'+esc(r.description||"")+'</small>'+
  '<time>'+nice(r.at)+(mode==="due"?" • Due":"")+'</time></div>'+
  '<div class="rc-item-actions"><a href="'+esc(r.url)+'" class="rc-mini-link">Open</a>'+
  (mode==="due"?'<button type="button" data-snooze="'+esc(r.key)+'" title="Remind again in one hour">+1h</button>':'')+
  '<button type="button" data-dismiss="'+esc(r.key)+'" title="Dismiss reminder">Dismiss</button></div></article>').join("");
 root.innerHTML=due.length?render(due,"due"):'<p class="rc-empty">No reminders due right now.</p>';
 const upcomingNode=$("rcUpcomingList");upcomingNode.innerHTML=upcoming.length?render(upcoming,"upcoming"):'<p class="rc-empty">Nothing scheduled for the next 14 days.</p>';
 const list=safeState()?.data?.reminders||[];
 $("rcCustomList").innerHTML=list.length?list.slice().sort((a,b)=>String(a.date).localeCompare(String(b.date))).map(r=>
  '<article class="rc-saved"><div><strong>'+esc(r.title)+'</strong><small>'+esc(r.date)+' '+esc(r.time||"09:00")+' IST'+(r.repeat&&r.repeat!=="once"?" · "+esc(r.repeat):"")+'</small></div><button type="button" data-delete-custom="'+esc(r.id)+'">Delete</button></article>').join(""):
  '<p class="rc-empty">Add a reminder for vendor payments, shopping, travel or family work.</p>';
}
function display(){
 const panel=$("reminderPanel");if(!panel)return;
 const form=panel.querySelector("#rcCreateForm");
 const editing=form&&!form.hidden;
 if(!editing){panel.innerHTML=panelHTML();wirePanel();}
 showRows();signal();
}
async function notify(title,body,url="/calendar.html",key="manual-"+eid()){
 if(typeof Notification==="undefined"||Notification.permission!=="granted")return false;
 if(!("serviceWorker"in navigator))return false;
 try{
  // Register only if not already registered; mobile browsers need showNotification.
  const reg=await navigator.serviceWorker.getRegistration("/")||await navigator.serviceWorker.register("/sw.js",{scope:"/"});
  await reg.showNotification(title,{
   body:String(body||"").slice(0,170),tag:"pankaj-"+key,
   icon:"/icon-192.svg",badge:"/icon-192.svg",
   data:{url:String(url||"/calendar.html")},renotify:false
  });
  return true;
 }catch(err){console.warn("Device reminder unavailable:",err);return false;}
}
function quietNow(){
 const hour=Number(clockIST().slice(0,2));
 return data.prefs.quiet&&(hour>=22||hour<7);
}
async function check(force=false){
 if(busy)return;
 if(!safeState()){signal();return}
 const now=Date.now();
 if(!force&&now-lastCheck<45000)return;
 lastCheck=now;signal();
 if(opened&&!$("rcCreateForm")?.hidden)return;
 if(opened)display();
 if(!data.prefs.nativeEnabled||typeof Notification==="undefined"||Notification.permission!=="granted"||quietNow())return;
 const due=viewRows(now).due.filter(r=>r.originalAt>=now-12*HOUR&&r.at<=now&&!data.delivered[r.key]);
 if(!due.length)return;
 busy=true;
 try{
  const title=due.length===1?due[0].title:due.length+" wedding reminders due";
  const body=due.length===1?(due[0].description||"Open Pankaj ki Shadi to see details"):
   due.slice(0,3).map(r=>r.title.replace(/^Task: |^Calendar: /,"")).join(" • ")+(due.length>3?" and more":"");
  const shown=await notify(title,body,due.length===1?due[0].url:"/calendar.html",due.length===1?due[0].key:"summary-"+todayIST());
  if(shown){for(const r of due)data.delivered[r.key]=now;persistLocal();}
 }finally{busy=false}
}
async function allow(){
 if(data.prefs.nativeEnabled){data.prefs.nativeEnabled=false;persistLocal();display();return}
 if(typeof Notification==="undefined"||typeof Notification.requestPermission!=="function"){
  alert("This browser or Android WebView does not support website notifications. In-app reminders and the phone calendar export are still available.");return
 }
 let permission;
 try{permission=await Notification.requestPermission()}catch(e){permission="denied"}
 if(permission!=="granted"){data.prefs.nativeEnabled=false;persistLocal();display();return}
 data.prefs.nativeEnabled=true;persistLocal();display();await check(true);
}
function updatePref(field,value){data.prefs[field]=value;persistLocal();display();check(true)}
function wirePanel(){
 $("rcClose").onclick=close;
 $("rcEnable").onclick=allow;
 $("rcTest").onclick=async()=>{
  if(!data.prefs.nativeEnabled||typeof Notification==="undefined"||Notification.permission!=="granted"){
   alert("First tap Enable alerts and allow notifications in your browser.");return
  }
  const ok=await notify("Pankaj ki Shadi reminder test","Device notifications are enabled while the app is running.","/calendar.html","test-"+eid());
  if(!ok)alert("Device notification couldn't be shown. Try Chrome/PWA or export reminders to your phone calendar.");
 };
 $("rcCreate").onclick=()=>{const f=$("rcCreateForm");f.hidden=!f.hidden;if(!f.hidden)f.elements.title.focus()};
 $("rcCancelForm").onclick=()=>{$("rcCreateForm").hidden=true};
 $("rcCreateForm").onsubmit=async e=>{
  e.preventDefault();const f=e.currentTarget,v=Object.fromEntries(new FormData(f).entries());
  const name=String(v.title||"").trim();const time=v.time||"09:00";
  if(!name||!Number.isFinite(parseIST(v.date,time))){alert("Add a title, valid date and time.");return}
  const st=safeState();if(!st)return;
  st.data.reminders=st.data.reminders||[];
  const existing=st.data.reminders.find(r=>r.title.toLowerCase()===name.toLowerCase()&&r.date===v.date&&r.time===time&&r.repeat===v.repeat);
  if(existing){alert("This reminder already exists. No duplicate was added.");return}
  st.data.reminders.push({id:"rem-"+eid(),title:name,date:v.date,time,repeat:v.repeat||"once",
    category:v.category||"General",notes:String(v.notes||"").trim(),createdAt:new Date().toISOString()});
  await save("Reminder saved");f.reset();display();check(true);
 };
 $("rcCalendarExport").onclick=exportICS;
 $("rcReadAll").onclick=()=>{for(const r of viewRows().due)data.read[r.key]=Date.now();persistLocal();display()};
 for(const [id,field,kind] of [["rcTasks","taskEnabled","checked"],["rcCalendar","calendarEnabled","checked"],["rcQuiet","quiet","checked"],
   ["rcLead","leadDays","value"],["rcTaskTime","taskTime","value"],["rcCalendarTime","calendarTime","value"]]){
  const el=$(id);if(el)el.onchange=()=>updatePref(field,kind==="checked"?el.checked:kind==="value"&&field==="leadDays"?Number(el.value):el.value);
 }
 $("reminderPanel").querySelectorAll("[data-snooze]").forEach(el=>el.onclick=()=>{const key=el.dataset.snooze;data.snoozes[key]=Date.now()+HOUR;data.read[key]=Date.now();persistLocal();display()});
 $("reminderPanel").querySelectorAll("[data-dismiss]").forEach(el=>el.onclick=()=>{data.dismissed[el.dataset.dismiss]=Date.now();persistLocal();display()});
 $("reminderPanel").querySelectorAll("[data-delete-custom]").forEach(el=>el.onclick=async()=>{
  const st=safeState();if(!st)return;
  const old=(st.data.reminders||[]).find(x=>x.id===el.dataset.deleteCustom);if(!old)return;
  if(!confirm('Delete reminder "'+old.title+'"?'))return;
  st.data.reminders=st.data.reminders.filter(x=>x.id!==old.id);
  await save("Reminder deleted");display();
 });
}
function open(){
 const box=$("reminderBackdrop");if(!box)return;
 opened=true;box.hidden=false;document.body.classList.add("rc-open");
 display();
 const panel=$("reminderPanel");
 panel?.querySelector("#rcClose")?.focus({preventScroll:true});
}
function close(){
 opened=false;const box=$("reminderBackdrop");if(box)box.hidden=true;
 document.body.classList.remove("rc-open");
 $("reminderBell")?.focus({preventScroll:true});
}
function attach(){
 if(booted)return;booted=true;
 const bell=document.createElement("button");bell.type="button";bell.id="reminderBell";bell.className="rc-bell";
 bell.setAttribute("aria-label","Open reminders");bell.innerHTML='<span aria-hidden="true">🔔</span><span id="reminderBadge" hidden></span>';
 bell.onclick=open;
 const header=document.querySelector(".top .header")||document.querySelector("header")||document.body;
 header.append(bell);
 const root=document.createElement("div");root.id="reminderBackdrop";root.className="rc-layer";root.hidden=true;
 root.innerHTML='<div class="rc-mask"></div><aside id="reminderPanel" role="dialog" aria-modal="true" aria-labelledby="reminderTitle" tabindex="-1"></aside>';
 document.body.append(root);root.querySelector(".rc-mask").onclick=close;
 root.addEventListener("keydown",e=>{
  if(e.key==="Escape"){e.preventDefault();close();return}
  if(e.key!=="Tab")return;
  const focusable=[...root.querySelectorAll("button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled])")].filter(el=>el.getClientRects().length);
  if(!focusable.length)return;
  if(e.shiftKey&&document.activeElement===focusable[0]){e.preventDefault();focusable[focusable.length-1].focus()}
  else if(!e.shiftKey&&document.activeElement===focusable[focusable.length-1]){e.preventDefault();focusable[0].focus()}
 });
 document.addEventListener("visibilitychange",()=>{if(!document.hidden)check(true)});
 window.addEventListener("focus",()=>check(true));
 window.addEventListener("storage",e=>{if(e.key===STORAGE){loadLocal();if(opened)display();else signal()}});
 setInterval(()=>check(),60000);
 const poll=setInterval(()=>{if(safeState()){clearInterval(poll);check(true)}},400);
 window.setTimeout(()=>clearInterval(poll),30000);
 check(true);
}
function escapeICS(value){return String(value||"").replace(/\\/g,"\\\\").replace(/\r?\n/g,"\\n").replace(/,/g,"\\,").replace(/;/g,"\\;")}
function utcICS(at){return new Date(at).toISOString().replace(/[-:]/g,"").replace(/\.\d{3}Z$/,"Z")}
function generateICS(rows){
 const sorted=rows.filter(x=>Number.isFinite(x.at)).sort((a,b)=>a.at-b.at);
 const lines=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Pankaj ki Shadi//Wedding Reminders//EN","CALSCALE:GREGORIAN","METHOD:PUBLISH","X-WR-CALNAME:Pankaj ki Shadi Reminders"];
 const usedRepeat=new Set();
 for(const item of sorted){
  const repeat=item.kind==="custom"&&item.repeat&&item.repeat!=="once";
  if(repeat&&usedRepeat.has(item.id))continue;
  if(repeat)usedRepeat.add(item.id);
  lines.push("BEGIN:VEVENT","UID:"+String(item.key).replace(/[^a-zA-Z0-9:-]/g,"-")+"@pankaj-ki-shadi",
   "DTSTAMP:"+utcICS(Date.now()),"DTSTART:"+utcICS(item.originalAt),"DTEND:"+utcICS(item.originalAt+15*60000),
   "SUMMARY:"+escapeICS(item.title),"DESCRIPTION:"+escapeICS(item.description||"Wedding reminder"),
   "URL:https://pankaj-wedding-roadtrip-checklist.vercel.app"+item.url);
  if(repeat)lines.push("RRULE:FREQ="+item.repeat.toUpperCase());
  lines.push("BEGIN:VALARM","TRIGGER:-PT0M","ACTION:DISPLAY","DESCRIPTION:"+escapeICS(item.title),"END:VALARM","END:VEVENT");
 }
 lines.push("END:VCALENDAR");
 return lines.join("\r\n")+"\r\n";
}
function exportICS(){
 const now=Date.now(),items=reminderRows(safeState(),now).filter(x=>x.originalAt>=now-2*DAY&&x.originalAt<=now+45*DAY);
 if(!items.length){alert("No upcoming reminders to export. Add one, or create a task or calendar event.");return}
 const content=generateICS(items),file=new Blob([content],{type:"text/calendar;charset=utf-8"});
 const url=URL.createObjectURL(file),a=document.createElement("a");a.href=url;a.download="pankaj-ki-shadi-reminders.ics";
 document.body.append(a);a.click();a.remove();window.setTimeout(()=>URL.revokeObjectURL(url),60000);
 alert("Calendar file downloaded. Open/import it in your phone's calendar app and allow calendar notifications. The export is a snapshot; repeat after changing reminder dates.");
}
loadLocal();
function bootstrap(){
 const stylesheet=document.createElement("link");stylesheet.rel="stylesheet";stylesheet.href="/reminder-center.css";document.head.append(stylesheet);
 attach();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",bootstrap,{once:true});else bootstrap();
window.reminderCenterPure={parseIST,isoLocal,reminderRows,generateICS,budgetTestClock:clockIST};
})();
