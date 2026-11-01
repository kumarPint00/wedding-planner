/* Wedding Manager: local/private railway ticket register and evidence importer */
(function(){
 'use strict';
 const FORMAT='PankajWeddingTrainTicketsV1';
 const STORE='media';
 const rupee=n=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'}).format(Number(n)||0);
 const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const dateFmt=s=>{if(!s)return '—';const [d,time]=String(s).split('T');const [y,m,day]=(d||'').split('-');return y&&m&&day?day+'/'+m+'/'+y+(time?' · '+time:''):s};
 const ticketId=p=>'train-'+p;
 const expenseId=p=>'trainFare-'+p;
 const evidenceId=p=>'train-screenshot-'+p;
 function ensure(){
   state.data.trainTickets=state.data.trainTickets||[];
   state.data.mediaMeta=state.data.mediaMeta||[];
   state.data.expenses=state.data.expenses||[];
   state.data.documents=state.data.documents||[];
 }
 function notice(msg,good=false){const el=document.getElementById('railMessage');if(el){el.textContent=msg;el.className=good?'alert good':'alert'}}
 async function mediaDB(){
   const db=await openDB();
   if(!db||!db.objectStoreNames.contains(STORE))throw Error('Browser image storage is unavailable. Use Chrome and allow site storage.');
   return db;
 }
 async function putEvidence(id,blob,name,type){
   const db=await mediaDB();
   await new Promise((resolve,reject)=>{
     const tx=db.transaction(STORE,'readwrite');
     tx.objectStore(STORE).put({id,blob,name,type,size:blob.size,storedAt:new Date().toISOString()},id);
     tx.oncomplete=resolve;tx.onerror=()=>reject(Error('Could not save image evidence'));
   });
 }
 async function getEvidence(id){
   try{const db=await mediaDB();return await new Promise(resolve=>{
     const q=db.transaction(STORE,'readonly').objectStore(STORE).get(id);
     q.onsuccess=()=>resolve(q.result||null);q.onerror=()=>resolve(null);
   })}catch{return null}
 }
 function fromBase64(text,mime){
   if(typeof text!=='string'||text.length>12000000)throw Error('Invalid/oversized evidence');
   const binary=atob(text),a=new Uint8Array(binary.length);
   for(let i=0;i<binary.length;i++)a[i]=binary.charCodeAt(i);
   return new Blob([a],{type:mime||'image/jpeg'});
 }
 function validate(obj){
   if(obj?.format!==FORMAT||!Array.isArray(obj.tickets)||obj.tickets.length<1||obj.tickets.length>100)throw Error('Choose the wedding train-ticket import JSON, not a general planner backup.');
   const seen=new Set();
   for(const t of obj.tickets){
     if(!/^\d{10}$/.test(String(t.pnr||'')))throw Error('Invalid ten-digit PNR in the import file');
     if(seen.has(t.pnr))throw Error('Duplicate PNR inside file: '+t.pnr);
     seen.add(t.pnr);
     if(!Number.isFinite(+t.fare)||+t.fare<0||+t.fare>500000)throw Error('Invalid fare for '+t.pnr);
     if(!Array.isArray(t.passengers)||t.passengers.length>8)throw Error('Invalid passengers for '+t.pnr);
     if(!Array.isArray(t.evidence))throw Error('Missing evidence list for '+t.pnr);
     for(const f of t.evidence){if(!/^image\/(jpeg|png|webp)$|^application\/pdf$/.test(f.mime||''))throw Error('Unsupported evidence type');if((f.data||'').length>12000000)throw Error('File too large')}
   }
   return obj.tickets;
 }
 function findLedgerMatch(t){
   const rows=state.data.expenses;
   const p=String(t.pnr);
   let match=rows.find(x=>x.id===expenseId(p));
   if(match)return {row:match,kind:'pnr'};
   match=rows.find(x=>String(x.item||'').includes(p)||String(x.notes||'').includes(p));
   if(match)return {row:match,kind:'pnr'};
   const value=Number(t.fare)||0;
   match=rows.find(x=>(/train|railway|irctc|rail ticket|train ticket|confirmtkt/i.test([x.item,x.category,x.notes].join(' '))) &&
     [x.actual,x.paid].some(n=>Math.abs((+n||0)-value)<0.01) &&
     (!x.trainPNR||x.trainPNR===p));
   if(match)return {row:match,kind:'amount'};
   return null;
 }
 function postFareOnce(t){
   const existing=findLedgerMatch(t);
   if(existing){t.expenseId=existing.row.id;t.farePosting=existing.kind==='pnr'?'Existing expense linked':'Similar existing railway expense linked';return {added:false,existing:true}}
   const e={id:expenseId(t.pnr),category:'Travel',item:'Train ticket '+t.trainNumber+' ('+t.fromCode+' → '+t.toCode+')',
     event:'Travel',expected:+t.fare,actual:+t.fare,paid:+t.fare,status:'Purchased',
     notes:'PNR '+t.pnr+' • '+t.passengers.length+' passenger(s) • Fare includes ticket charges. Recorded once per PNR.',
     trainPNR:t.pnr};
   state.data.expenses.push(e);t.expenseId=e.id;t.farePosting='Posted once to Expenses';
   return {added:true,existing:false};
 }
 function cfg(){try{return JSON.parse(localStorage.getItem('PWM_SUPABASE_CONFIG')||'null')}catch{return null}}
 function session(){try{return JSON.parse(localStorage.getItem('PWM_SUPABASE_SESSION')||'null')}catch{return null}}
 async function uploadPrivate(meta,file){
   const c=cfg(),s=session();if(!c?.url||!c?.anonKey||!s?.access_token)return null;
   try{
     const part=s.access_token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');
     const jwt=JSON.parse(atob(part+'='.repeat((4-part.length%4)%4)));
     if(!jwt.sub||((jwt.exp||0)<Date.now()/1000+30))return null;
     const path=jwt.sub+'/'+meta.id+'/'+(file.name||meta.name).replace(/[^a-zA-Z0-9._-]/g,'_');
     const r=await fetch(c.url+'/storage/v1/object/wedding-evidence/'+path.split('/').map(encodeURIComponent).join('/'),{
       method:'POST',headers:{apikey:c.anonKey,Authorization:'Bearer '+s.access_token,'x-upsert':'true','Content-Type':file.type||'application/octet-stream'},
       body:file
     });
     return r.ok?path:null;
   }catch{return null}
 }
 async function addEvidence(t,pnr,f,i){
   const id=i===0?evidenceId(pnr):evidenceId(pnr)+'-'+i;
   const existing=state.data.mediaMeta.find(x=>x.id===id);
   const blob=fromBase64(f.data,f.mime),name=f.name||('ticket-'+pnr+'.jpg');
   const old=await getEvidence(id);
   if(!old)await putEvidence(id,blob,name,f.mime);
   if(existing)return {added:false,cloud:existing.cloudBacked};
   const meta={id,name,type:f.mime,size:blob.size,createdAt:new Date().toISOString(),
      date:String(t.depart||'').slice(0,10),caption:'Railway booking screenshot • '+t.trainNumber+' • PNR '+pnr,
      entityType:'travel',entityId:'ticket:'+pnr,entityLabel:t.fromCode+' → '+t.toCode,
      event:'Train journey',tags:'train, PNR, IRCTC',favorite:false,cover:false,profile:false,cloudPath:null,cloudBacked:false};
   try{const path=await uploadPrivate(meta,new File([blob],name,{type:f.mime}));if(path){meta.cloudPath=path;meta.cloudBacked=true}}catch{}
   state.data.mediaMeta.push(meta);
   return {added:true,cloud:meta.cloudBacked};
 }
 async function addFromFile(file){
   if(!file||file.size>16000000)throw Error('The import file is too large.');
   const obj=JSON.parse(await file.text());const tickets=validate(obj);
   ensure();
   let inserted=0,updated=0,newExpenses=0,filesAdded=0,cloudFiles=0;
   for(const incoming of tickets){
     const p=incoming.pnr,old=state.data.trainTickets.find(x=>x.pnr===p);
     const data={...incoming};
     delete data.evidence;
     data.id=ticketId(p);data.passengers=(incoming.passengers||[]).map(x=>({...x}));
     data.updatedAt=old?.updatedAt||new Date().toISOString();
     data.evidenceIds=[...(old?.evidenceIds||[])];
     // Preserve more recent manually edited IRCTC statuses and travel notes on repeat imports.
     if(old){for(const field of ['currentStatus','notes','liveStatusChecked','paymentStatus','farePosting']){
       if(old[field]!==undefined)data[field]=old[field]
     }}
     const posted=postFareOnce(data);if(posted.added)newExpenses++;
     if(old){Object.assign(old,data);updated++}else{state.data.trainTickets.push(data);inserted++}
     for(let i=0;i<incoming.evidence.length;i++){
       const em=await addEvidence(data,p,incoming.evidence[i],i);
       filesAdded+=Number(em.added);cloudFiles+=Number(em.cloud);
       const id=i===0?evidenceId(p):evidenceId(p)+'-'+i;
       if(!data.evidenceIds.includes(id))data.evidenceIds.push(id);
     }
     audit('Train Travel',p,'import',old?'existing PNR':'new','ticket bundle','Import evidence; '+(posted.added?'fare posted':data.farePosting));
   }
   await save('Train tickets imported');
   render();
   notice(inserted+' ticket(s) added, '+updated+' updated; '+filesAdded+' screenshot(s) saved locally; '+newExpenses+' new Expenses entry/entries. Total fare: '+rupee(tickets.reduce((a,x)=>a+(+x.fare||0),0))+'.',true);
 }
 function makeTag(text){return '<span class="badge info">'+safe(text)+'</span>'}
 async function evidenceHtml(t,host){
   host.innerHTML='';
   const ids=[...new Set(t.evidenceIds||[])];
   if(!ids.length){host.innerHTML='<span class="mini">No evidence attached yet.</span>';return}
   for(const id of ids){
     const m=state.data.mediaMeta.find(x=>x.id===id),rec=await getEvidence(id);
     const b=document.createElement('button');b.type='button';b.className='rail-evidence-thumb';
     let objectUrl=null;
     if(rec?.blob){objectUrl=URL.createObjectURL(rec.blob)}
     if(objectUrl&&(m?.type||rec.type||'').startsWith('image/')){
       const img=document.createElement('img');img.src=objectUrl;img.alt='Ticket screenshot';b.appendChild(img);
     }else b.innerHTML='<span>'+(m?.type==='application/pdf'?'PDF':'Evidence')+'</span>';
     b.title=m?.cloudBacked?'Cloud backed and stored locally':'Local device evidence';
     b.onclick=()=>{if(objectUrl)window.open(objectUrl,'_blank');else alert('Evidence is not on this device. Connect cloud storage or import the ticket bundle again.')};
     host.appendChild(b);
   }
 }
 function statusTone(t){
   const s=String(t.currentStatus||'').toUpperCase();
   return s.includes('RAC')?'<span class="badge pending">'+safe(t.currentStatus)+'</span>':
        s.includes('CNF')?'<span class="badge ok">'+safe(t.currentStatus)+'</span>':makeTag(t.currentStatus||'Unknown');
 }
 async function render(){
   const root=document.getElementById('railTicketCards');
   if(!root)return;ensure();
   const list=[...state.data.trainTickets].sort((a,b)=>String(a.depart||'').localeCompare(String(b.depart||'')));
   const sum=list.reduce((s,t)=>s+(+t.fare||0),0);
   document.getElementById('railSummary').textContent=list.length+' booking(s) • '+list.reduce((s,t)=>s+(t.passengers||[]).length,0)+' passenger reservations • '+rupee(sum)+' total fares';
   root.innerHTML='';
   if(!list.length){root.innerHTML='<div class="empty-state">No train tickets imported yet. Use the private ticket bundle to add bookings and screenshot evidence.</div>';return}
   for(const t of list){
     const box=document.createElement('article');box.className='panel rail-ticket';
     const pax=(t.passengers||[]).map((p,i)=>'<tr><td>'+(i+1)+'. '+safe(p.name)+'</td><td>'+safe(p.age)+' / '+safe(p.gender)+'</td><td>'+safe(p.currentStatus||p.bookingStatus||'—')+'</td></tr>').join('');
     box.innerHTML='<div class="rail-head"><div><h3>'+safe(t.trainNumber)+' • '+safe(t.trainName)+'</h3><div class="mini">'+safe(t.fromStation)+' ('+safe(t.fromCode)+') → '+safe(t.toStation)+' ('+safe(t.toCode)+')</div></div>'+statusTone(t)+'</div>'+
      '<div class="rail-facts"><div><small>Departure</small><b>'+dateFmt(t.depart)+'</b></div><div><small>Arrival</small><b>'+dateFmt(t.arrive)+'</b></div><div><small>PNR</small><b>'+safe(t.pnr)+'</b></div><div><small>Class</small><b>'+safe(t.class)+'</b></div><div><small>Total fare</small><b>'+rupee(t.fare)+'</b></div></div>'+
      '<div class="mini">Current status is from the supplied ticket screenshot, not a live PNR lookup.</div>'+
      '<details><summary>Passengers & berth details ('+(t.passengers||[]).length+')</summary><div class="table-wrap"><table><thead><tr><th>Name</th><th>Age / gender</th><th>Ticket status / berth</th></tr></thead><tbody>'+pax+'</tbody></table></div></details>'+
      '<div class="rail-evidence"></div><div class="rail-controls"><div class="mini">'+safe(t.farePosting||'Fare reconciliation pending')+'</div><label class="btn alt">Add screenshots / PDFs<input type="file" accept="image/*,application/pdf" multiple hidden></label><a class="btn alt" href="/expenses.html">Expenses</a></div>';
     const ev=box.querySelector('.rail-evidence');await evidenceHtml(t,ev);
     box.querySelector('input[type=file]').onchange=async e=>{
       const files=[...e.target.files];let count=0;
       for(const f of files){
         if(!(f.type||'').startsWith('image/')&&f.type!=='application/pdf')continue;
         if(f.size>25*1024*1024){alert('Each file must be 25 MB or less.');continue}
         const id='rail-manual-'+t.pnr+'-'+Date.now()+'-'+count;
         await putEvidence(id,f,f.name,f.type);
         const meta={id,name:f.name,type:f.type,size:f.size,createdAt:new Date().toISOString(),date:String(t.depart).slice(0,10),caption:'Train ticket evidence • '+t.pnr,entityType:'travel',entityId:'ticket:'+t.pnr,entityLabel:t.fromCode+' → '+t.toCode,event:'Train journey',tags:'train',favorite:false,cover:false,profile:false,cloudPath:null,cloudBacked:false};
         const path=await uploadPrivate(meta,f);if(path){meta.cloudPath=path;meta.cloudBacked=true}
         state.data.mediaMeta.push(meta);t.evidenceIds=t.evidenceIds||[];t.evidenceIds.push(id);count++;
       }
       if(count){await save('Evidence attached');render()}
     };
     root.appendChild(box);
   }
 }
 window.initWeddingRailTickets=function(){
   ensure();
   const input=document.getElementById('railTicketImport');
   input.addEventListener('change',async e=>{
      const f=e.target.files?.[0];if(!f)return;
      const btn=document.getElementById('railImportLabel');if(btn)btn.textContent='Importing…';
      try{await addFromFile(f)}catch(err){notice('Import failed: '+err.message)}
      finally{e.target.value='';if(btn)btn.textContent='Import private ticket bundle'}
   });
   render();
 };
 window.renderWeddingRailTickets=render;
})();