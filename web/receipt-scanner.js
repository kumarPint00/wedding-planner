
(function(){
"use strict";
let file=null,hash=null,rows=[],raw="",meta={merchant:"",date:"",total:0},working=false;
const $=id=>document.getElementById(id),INR=n=>"₹"+(Number(n)||0).toLocaleString("en-IN",{maximumFractionDigits:2});
const n=x=>Number.isFinite(+x)?Math.max(0,+x):0,round=x=>Math.round(n(x)*100)/100;
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const uidLocal=()=>Date.now().toString(36)+Math.random().toString(36).slice(2);
const imports=()=>{state.data.receiptImports=state.data.receiptImports||[];return state.data.receiptImports};
const known=()=>state.data.shopping||[];
function categoryFor(s){if(/saree|sari|कपड|साड़ी|sherwani|kurta|shirt|shoe|dress/i.test(s))return ["Clothing & Sarees","Gifting"];if(/jewel|payal|silver|gold|सोना|पायल/i.test(s))return ["Jewellery & Gifts","Gifting"];if(/rice|flour|atta|oil|dal|आटा|दाल|चावल/i.test(s))return ["Food & Catering","Bahubhoj"];if(/light|decor|flower/i.test(s))return ["Decoration & Ceremony","Wedding"];return ["Other Shopping","Wedding"];}
function guess(s){
 const tokens=String(s||"").toLowerCase().split(/[^a-z0-9\u0900-\u097f]+/).filter(x=>x.length>=3);
 let best="__new__",score=0;
 for(const g of known()){
  const v=(g.name+" "+(g.expenseCategory||"")).toLowerCase();
  const k=tokens.filter(t=>v.includes(t)).length;
  if(k>=1&&k/tokens.length>score){best=g.id;score=k/tokens.length}
 }
 return score>=.3?best:"__new__";
}
function asciiNumbers(v){return String(v).replace(/[०-९]/g,d=>String("०१२३४५६७८९".indexOf(d)))}
function parseLine(value){
 let line=asciiNumbers(value).replace(/(?<=\d),(?=\d{3}\b)/g,"").replace(/₹|\b(?:rs|inr)\.?\b/gi," ").replace(/\s+/g," ").trim();
 if(!line||/^(?:grand total|sub.?total|total|tax|gst|cgst|sgst|invoice|bill|date|time|amount|rate|qty|paid|balance|discount|round off|thank)\b/i.test(line)||/^(?:कुल|योग|जोड़|जोड|राशि|दिनांक|बिल|रसीद|मात्रा|छूट|भुगतान|बकाया)(?:\s|$)/u.test(line))return null;
 let item="",qty=1,price=0,uncertain=false;
 let m=line.match(/^(.+?)\s+(\d+(?:\.\d+)?)\s*[x×*@]\s*(\d+(?:\.\d+)?)(?:\s+\d+(?:\.\d+)?)?$/i);
 if(m){item=m[1];qty=+m[2];price=+m[3]}
 else {
  m=line.match(/^(.+?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)$/);
  if(m){item=m[1];const a=+m[2],b=+m[3],total=+m[4];if(Math.abs(a*b-total)<=Math.max(1,total*.02)){qty=Math.min(a,b);price=Math.max(a,b)}else{price=total;uncertain=true}}
  else{
   m=line.match(/^(.+?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)$/);
   if(m){item=m[1];qty=Math.min(+m[2],+m[3]);price=Math.max(+m[2],+m[3]);uncertain=true}
   else{m=line.match(/^(.+?)\s+(\d+(?:\.\d+)?)$/);if(!m)return null;item=m[1];price=+m[2];uncertain=true}
  }
 }
 item=item.replace(/^\d{1,3}[).#-]\s*/,"").replace(/[-:]$/,"").trim();
 if(!/[\p{L}]/u.test(item)||item.length<2||item.length>110||qty<=0||qty>5000||price<=0||price>1e7)return null;
 return {id:uidLocal(),item,price:round(price),quantity:qty,target:guess(item),include:true,uncertain};
}
function parse(text){
 const source=String(text||"").split(/\r?\n/).map(s=>s.trim()).filter(Boolean),result=[];
 for(const line of source){const entry=parseLine(line);if(entry)result.push(entry)}
 let total=0,date="",merchant="";
 for(const lineRaw of source){
  const line=asciiNumbers(lineRaw);
  const t=line.replace(/,/g,"").match(/(?:grand\s*total|net\s*amount|invoice\s*total|total|कुल\s*राशि|कुल|योग)\s*[:=\s₹rs.]*?(\d+(?:\.\d+)?)/i);
  if(t)total=+t[1];
  const d=line.match(/\b(\d{1,2})[/-](\d{1,2})[/-](20\d{2}|\d{2})\b/);
  if(d&&!date){date=(d[3].length===2?"20"+d[3]:d[3])+"-"+d[2].padStart(2,"0")+"-"+d[1].padStart(2,"0")}
 }
 merchant=source.find(s=>s.length>=4&&/[\p{L}]/u.test(s)&&!/^(bill|invoice|date|gst|receipt|phone)/i.test(s))?.slice(0,90)||"";
 return {rows:result,meta:{total,date,merchant}};
}
function ui(){
 const d=document.createElement("div");d.id="receiptScanner";d.hidden=true;d.className="rs-root";
 d.innerHTML=[
 '<div class="rs-mask" data-close></div><section class="rs-dialog" role="dialog" aria-modal="true" aria-labelledby="rsTitle">',
 '<header><div><small>SMART RECEIPT IMPORT</small><h2 id="rsTitle">Scan & review receipt</h2><p>Review each item before it updates Shopping and linked Expenses.</p></div><button type="button" data-close aria-label="Close scanner">✕</button></header>',
 '<div class="rs-body"><div class="rs-upload"><label class="btn green">📷 Take photo<input id="rsCamera" type="file" accept="image/*" capture="environment" hidden></label>',
 '<label class="btn alt">Upload photo or PDF<input id="rsFile" type="file" accept="image/*,application/pdf" hidden></label><small id="rsName">No receipt selected</small></div>',
 '<div class="rs-meta"><label>Shop<input id="rsShop" placeholder="Market / shop"></label><label>Date<input id="rsDate" type="date"></label><label>Receipt total ₹<input id="rsTotal" type="number" min="0" step=".01"></label></div>',
 '<div class="rs-controls"><button id="rsScan" class="btn green" type="button">Read receipt (OCR)</button><button id="rsManual" class="btn alt" type="button">Enter receipt text</button><small id="rsStatus" role="status">Free OCR runs on your device; first use needs internet.</small></div>',
 '<div id="rsRawWrap" hidden><label>Recognized text (editable)<textarea id="rsRaw" rows="5" placeholder="Regular saree 16 x 300 4800"></textarea></label><button type="button" class="btn alt" id="rsParse">Extract items from text</button></div>',
 '<div id="rsReview" hidden><div class="rs-review-title"><div><h3>Confirm purchased items</h3><p>Correct names, prices, quantities and destination.</p></div><button id="rsAdd" class="btn alt" type="button">+ Add row</button></div><div id="rsRows"></div>',
 '<div class="rs-summary"><span id="rsCount">0 items</span><strong id="rsSum">₹0</strong></div><div id="rsMismatch" class="rs-note"></div>',
 '<p class="rs-note">Imported batches update existing Expenses only once. Payments are not automatically posted: record paid amounts separately to avoid duplicates. The original file is saved as evidence when available.</p>',
 '<button id="rsSave" class="btn green" type="button">Approve & import selected items</button></div></div></section>'
 ].join("");
 document.body.append(d);
 d.querySelectorAll("[data-close]").forEach(x=>x.onclick=close);
 $("rsFile").onchange=e=>choose(e.target.files?.[0]);
 $("rsCamera").onchange=e=>choose(e.target.files?.[0]);
 $("rsScan").onclick=scan;$("rsManual").onclick=()=>{$("rsRawWrap").hidden=false;$("rsRaw").focus()};
 $("rsParse").onclick=()=>parseText($("rsRaw").value);
 $("rsAdd").onclick=()=>{rows.push({id:uidLocal(),item:"",price:0,quantity:1,target:"__new__",include:true});paint()};
 $("rsSave").onclick=commit;
 d.addEventListener("input",e=>{
  const row=e.target.closest("[data-id]");if(!row)return;
  const m=rows.find(x=>x.id===row.dataset.id);if(!m)return;
  const key=e.target.dataset.field;if(!key)return;
  if(key==="include")m.include=e.target.checked;else m[key]=e.target.value;
  if(key==="price"||key==="quantity")row.querySelector("[data-subtotal]").textContent=INR(round(n(m.price)*n(m.quantity)));
  sum();
 });
 d.addEventListener("change",e=>{const row=e.target.closest("[data-id]");if(!row)return;const m=rows.find(x=>x.id===row.dataset.id);if(m&&e.target.dataset.field==="target")m.target=e.target.value});
 d.addEventListener("click",e=>{if(!e.target.matches("[data-remove]"))return;rows=rows.filter(x=>x.id!==e.target.closest("[data-id]").dataset.id);paint()});
}
function open(){if(!$("receiptScanner"))ui();$("receiptScanner").hidden=false;document.body.classList.add("rs-open");$("rsDate").value=meta.date||new Date().toISOString().slice(0,10)}
function close(){if(working)return;$("receiptScanner").hidden=true;document.body.classList.remove("rs-open")}
function status(s,bad=false){$("rsStatus").textContent=s;$("rsStatus").classList.toggle("rs-bad",bad)}
async function choose(f){
 if(!f)return;
 if(!((f.type||"").startsWith("image/")||f.type==="application/pdf"||/\.pdf$/i.test(f.name))||f.size>15*1024*1024){status("Choose an image or PDF of at most 15 MB.",true);return}
 file=f;rows=[];hash=null;meta={merchant:"",date:"",total:0};$("rsName").textContent=f.name;
 $("rsReview").hidden=true;$("rsRawWrap").hidden=true;
 try{if(crypto?.subtle){const b=await crypto.subtle.digest("SHA-256",await f.arrayBuffer());hash=[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("")}}
 catch(e){status("File selected; duplicate fingerprint unavailable.",true)}
 if(hash&&imports().some(x=>x.hash===hash))status("This exact receipt was already imported. Duplicate blocked.",true);
 else status("Ready to scan. OCR may need an internet connection.");
}
async function script(url,name){
 if(window[name])return;
 await new Promise((resolve,reject)=>{const el=document.createElement("script");el.src=url;el.onload=resolve;el.onerror=()=>reject(Error("OCR library failed to load; use Enter receipt text."));document.head.append(el)});
 if(!window[name])throw Error("OCR library unavailable");
}
async function recognize(){
 await script("https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js","Tesseract");
 const mode=document.getElementById("rsLanguages")?.value||"mixed";
 const codes=mode==="mixed"?["eng","hin"]:[mode];
 status("Loading "+(mode==="mixed"?"Hindi + English":mode)+" OCR models…");
 const worker=await Tesseract.createWorker(codes,1,{logger:x=>{if(x.status==="recognizing text")status("OCR "+Math.round((x.progress||0)*100)+"%")}});
 try{
  if(file.type==="application/pdf"||/\.pdf$/i.test(file.name)){
   await script("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js","pdfjsLib");
   pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
   const doc=await pdfjsLib.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise;
   const texts=[];
   for(let i=1;i<=Math.min(4,doc.numPages);i++){
    status("Reading PDF page "+i);
    const page=await doc.getPage(i),data=await page.getTextContent();
    const lineMap=new Map();
    for(const item of data.items){
      const xy=item.transform||[],y=Math.round((xy[5]||0)/3)*3;
      if(!lineMap.has(y))lineMap.set(y,[]);
      lineMap.get(y).push({x:xy[4]||0,text:item.str||""});
    }
    const extracted=[...lineMap].sort((a,b)=>b[0]-a[0]).map(([,items])=>items.sort((a,b)=>a.x-b.x).map(i=>i.text).join(" ")).join("\n");
    if(extracted.length>60){texts.push(extracted);continue}
    const view=page.getViewport({scale:1.65}),canvas=document.createElement("canvas");
    canvas.width=Math.ceil(view.width);canvas.height=Math.ceil(view.height);
    await page.render({canvasContext:canvas.getContext("2d"),viewport:view}).promise;
    const r=await worker.recognize(canvas);texts.push(r.data.text||"");canvas.width=canvas.height=0;
   }
   return texts.join("\n");
  }
  return (await worker.recognize(file)).data.text||"";
 }finally{await worker.terminate()}
}
async function scan(){
 if(working)return;
 if(!file){status("Choose a receipt first.",true);return}
 if(hash&&imports().some(x=>x.hash===hash)){status("This exact receipt was already imported.",true);return}
 working=true;$("rsScan").disabled=true;
 try{status("Starting private on-device OCR…");const text=await recognize();$("rsRaw").value=text;$("rsRawWrap").hidden=false;parseText(text);status("Review all extracted details before saving.")}
 catch(e){status(e.message||"OCR failed. Enter rows manually.",true);$("rsRawWrap").hidden=false}
 finally{working=false;$("rsScan").disabled=false}
}
function parseText(text){
 const result=parse(text);rows=result.rows;meta={...meta,...result.meta};
 $("rsShop").value=meta.merchant;$("rsDate").value=meta.date||new Date().toISOString().slice(0,10);$("rsTotal").value=meta.total||"";
 $("rsReview").hidden=false;paint();
 status(rows.length?rows.length+" possible item(s) extracted.":"No clear line items found. Use Add row and type the items.",!rows.length);
}
function paint(){
 const root=$("rsRows");root.replaceChildren();
 for(const r of rows){
  const line=document.createElement("div");line.className="rs-line";line.dataset.id=r.id;
  const groups=known().map(s=>'<option value="'+esc(s.id)+'" '+(r.target===s.id?"selected":"")+'>'+esc(s.name)+'</option>').join("");
  line.innerHTML='<label><input data-field="include" type="checkbox" '+(r.include?"checked":"")+'></label>'+
  '<label>Item<input data-field="item" maxlength="140" value="'+esc(r.item)+'"></label>'+
  '<label>Price<input data-field="price" type="number" min="0" step=".01" value="'+esc(r.price)+'"></label>'+
  '<label>Qty<input data-field="quantity" type="number" min="1" step="1" inputmode="numeric" value="'+esc(r.quantity)+'"></label>'+
  '<div class="rs-subtotal">Total<b data-subtotal>'+INR(round(n(r.price)*n(r.quantity)))+'</b></div>'+
  '<label class="rs-dest">Destination<select data-field="target"><option value="__new__" '+(r.target==="__new__"?"selected":"")+'>Create a new shopping group</option>'+groups+'</select></label>'+
  '<button class="rs-remove" data-remove type="button" aria-label="Remove row">✕</button>'+
  (r.uncertain?'<small class="rs-uncertain">OCR guess — verify values</small>':'');
  root.append(line);
 }
 sum();
}
function sum(){
 const chosen=rows.filter(x=>x.include),total=round(chosen.reduce((a,x)=>a+n(x.price)*n(x.quantity),0));
 $("rsCount").textContent=chosen.length+" selected";$("rsSum").textContent=INR(total);
 const receiptTotal=n($("rsTotal").value);
 $("rsMismatch").textContent=receiptTotal&&Math.abs(total-receiptTotal)>1?"Receipt total "+INR(receiptTotal)+" differs from items by "+INR(Math.abs(total-receiptTotal))+". Check missing items, taxes or discounts.":"";
}
async function commit(){
 if(working)return;
 const selected=rows.filter(r=>r.include),clean=[],fresh=new Set();
 if(!selected.length){status("Select at least one row to import.",true);return}
 if(hash&&imports().some(x=>x.hash===hash)){status("Receipt already imported. Duplicate blocked.",true);return}
 for(const r of selected){
  const item=String(r.item||"").trim(),p=Number(r.price),q=Number(r.quantity),group=known().find(s=>s.id===r.target);
  if(!item||item.length>140||!Number.isFinite(p)||p<0||!Number.isSafeInteger(q)||q<=0){status("Every selected item needs a valid price and a whole-number quantity (1, 2, 3…).",true);return}
  if(r.target!=="__new__"&&!group){status("Choose a valid destination for "+item,true);return}
  if(group&&Number(shoppingQtyStep(group.unit||"pcs"))===1&&!Number.isInteger(q)){status("Whole-number quantity required for "+group.name,true);return}
  if(r.target==="__new__"&&(fresh.has(item.toLowerCase())||known().some(s=>s.name.toLowerCase()===item.toLowerCase()))){status("The group "+item+" already exists. Choose the existing destination.",true);return}
  if(r.target==="__new__")fresh.add(item.toLowerCase());
  clean.push({item,price:round(p),quantity:q,target:r.target});
 }
 const total=round(clean.reduce((a,x)=>a+x.price*x.quantity,0)),declared=n($("rsTotal").value);
 if(declared&&Math.abs(total-declared)>1&&!confirm("Receipt total differs from selected items. Import anyway?"))return;
 if(!confirm("Import "+clean.length+" item(s) totaling "+INR(total)+"? Payments will NOT be added automatically."))return;
 working=true;$("rsSave").disabled=true;
 const clone=x=>JSON.parse(JSON.stringify(x));
 const prior={shopping:clone(state.data.shopping),expenses:clone(state.data.expenses),history:clone(state.data.history||[]),imports:clone(imports())};
 const id=uid("receipt"),merchant=$("rsShop").value.trim(),date=$("rsDate").value||new Date().toISOString().slice(0,10);
 const touched=new Map(),links=[];
 try{
  for(const x of clean){
   let s=x.target==="__new__"?null:known().find(g=>g.id===x.target);
   if(!s){
    const [category,event]=categoryFor(x.item);
    s={id:uid("shop"),name:x.item,expenseCategory:category,event,targetQty:x.quantity,completedQty:0,unit:"pcs",
     unitPrice:x.price,actualUnitPrice:x.price,market:merchant,paid:0,autoCalc:true,status:"Pending",
     purchaseBatchesEnabled:true,purchaseBatches:[],notes:"Created from reviewed receipt"};
    state.data.shopping.push(s);
   }else if(!s.purchaseBatchesEnabled){
    const opening=window.shoppingBatchTests?.opening;
    if(typeof opening!=="function")throw Error("Purchase batch helper is unavailable.");
    s.purchaseBatches=opening(s);s.purchaseBatchesEnabled=true;
   }
   s.purchaseBatches=s.purchaseBatches||[];
   const batch={id:uid("batch"),item:x.item,unitPrice:x.price,quantity:x.quantity,amount:round(x.price*x.quantity),
    paid:0,legacy:false,importId:id,receiptMediaId:null,date,market:merchant,createdAt:new Date().toISOString(),
    notes:"Scanned receipt "+id,reference:""};
   s.purchaseBatches.push(batch);touched.set(s.id,s);links.push({shoppingId:s.id,batchId:batch.id});
  }
  for(const s of touched.values())syncShoppingExpense(s);
  imports().push({id,hash:hash||"manual-"+uidLocal(),createdAt:new Date().toISOString(),date,merchant,
   fileName:file?.name||"Manual entry",declaredTotal:declared,actualTotal:total,links,mediaId:null});
  audit("Shopping","Receipt "+id,"import","",clean.length+" line(s) • "+INR(total));
  await save("Scanned receipt items saved");
  let message=clean.length+" line(s) imported into "+touched.size+" shopping group(s).";
  if(file&&window.receiptEvidenceStore){
   try{
    const first=touched.values().next().value,mediaId=await window.receiptEvidenceStore(file,first,id);
    if(mediaId){
     imports().find(r=>r.id===id).mediaId=mediaId;
     for(const link of links){const s=known().find(g=>g.id===link.shoppingId);const b=s?.purchaseBatches.find(x=>x.id===link.batchId);if(b)b.receiptMediaId=mediaId}
     await save(false);message+=" Receipt attached.";
    }else message+=" Evidence upload failed; attach it manually.";
   }catch(e){message+=" Evidence failed: "+e.message}
  }
  working=false;close();window.renderShopping();updateKpis();alert(message);
 }catch(e){Object.assign(state.data,{shopping:prior.shopping,expenses:prior.expenses,receiptImports:prior.imports,history:prior.history});status("Import failed: "+(e.message||e),true)}
 finally{working=false;$("rsSave").disabled=false}
}
function init(){
 if(!$("receiptScanner"))ui();
 const parent=document.querySelector(".ps-hero-actions")||document.querySelector(".studio-intro");
 if(parent&&!$("rsOpen")){const b=document.createElement("button");b.id="rsOpen";b.type="button";b.className="btn green";b.textContent="📷 Scan receipt";b.onclick=open;parent.prepend(b)}
 if(location.hash==="#scan-receipt")open();
}
window.receiptScannerSetAIReview=function(incoming,metadata){rows=incoming;meta={...meta,...metadata};$("rsShop").value=meta.merchant||"";$("rsDate").value=meta.date||new Date().toISOString().slice(0,10);$("rsTotal").value=meta.total||"";$("rsReview").hidden=false;paint();status(rows.length+" AI-assisted row(s) ready. Review before saving.");$("rsReview").scrollIntoView({behavior:"smooth",block:"start"})};
window.setupReceiptScanner=init;
window.receiptScannerPure={parse,parseLine,categoryFor};
})();
