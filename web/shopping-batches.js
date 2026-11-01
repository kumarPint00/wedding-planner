/* Multi-price purchase batches v56. No migration without an explicit user action. */
(function(){
"use strict";
const num=x=>Number.isFinite(+x)?Math.max(0,+x):0;
const round=x=>Math.round(num(x)*100)/100;
const money=x=>"₹"+num(x).toLocaleString("en-IN",{maximumFractionDigits:2});
const esc=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const expense=s=>expenseById(shoppingExpenseId(s));
const batches=s=>Array.isArray(s.purchaseBatches)?s.purchaseBatches:[];
const total=b=>b.legacy?round(b.amount):round(num(b.quantity)*num(b.unitPrice));
const today=()=>new Date().toISOString().slice(0,10);
const makeid=prefix=>uid(prefix);
const cap=(s,unit)=>1;
function validate(s,v,ignoreId){
  const item=String(v.item||"").trim();if(!item)throw Error("Enter the specific item name.");
  const q=Number(v.quantity),rate=Number(v.unitPrice),paid=Number(v.paid);
  if(!Number.isFinite(q)||q<=0)throw Error("Quantity must be greater than zero.");
  if(!Number.isSafeInteger(q))throw Error("Quantity must be a whole number (1, 2, 3…). Decimal quantities are not accepted.");
  if(!Number.isFinite(rate)||rate<0)throw Error("Enter a valid, non-negative unit price.");
  if(!Number.isFinite(paid)||paid<0)throw Error("Paid amount cannot be negative.");
  if((s.id==="s-1"||s.sareeType==="gifting")&&![250,300,350].includes(rate))throw Error("Gifting sarees are priced at ₹250, ₹300 or ₹350. Use Family Sarees for other rates.");
  const due=round(q*rate);
  if(paid>due+.005)throw Error("Payment exceeds this batch's total. Record an advance from Payments instead.");
  if(v.reference&&state.data.cashLedger.some(p=>p.id!==batches(s).find(b=>b.id===ignoreId)?.paymentId&&String(p.reference||"").trim().toLowerCase()===String(v.reference).trim().toLowerCase()))throw Error("This receipt / UTR already exists in the payment ledger.");
  return {item,quantity:q,unitPrice:rate,paid:round(paid),amount:due};
}
function opening(s){
 const e=expense(s),qty=num(s.completedQty),amount=round(e?.actual??s.actual);
 const list=[];
 if(qty>0||amount>0)list.push({id:makeid("batch"),item:s.name||"Existing purchase",date:"",quantity:qty,unitPrice:qty?Math.round(amount/qty*1000000)/1000000:0,amount,paid:0,market:s.market||"",reference:"",notes:"Opening balance from the existing shopping record; edit to split purchases by price.",legacy:true,createdAt:today()});
 return list;
}
async function enable(s){
 if(s.purchaseBatchesEnabled)return;
 const e=syncShoppingExpense(s);
 const oldPaid=round(e?.paid);
 const existing=opening(s);
 if(!confirm("Switch "+s.name+" to separate purchase batches? Existing quantities and recorded totals will be copied into an opening line, and all paid amounts will be preserved. You can edit or split that line."))return;
 s.purchaseBatchesEnabled=true;s.purchaseBatches=existing;s.paid=oldPaid;
 syncShoppingExpense(s);
 audit("Shopping",s.name,"purchaseBatchesEnabled","Bulk only",existing.length+" opening batch(es)");
 await save("Purchase batches enabled");
 renderShopping();updateKpis();window.shoppingUX?.onBatchesEnabled(s.id);
}
function changePayment(e,s,b,oldPaid,values){
 let row=b.paymentId?(state.data.cashLedger||[]).find(p=>p.id===b.paymentId):null;
 if(row){
  if(values.paid>0){row.amount=values.paid;row.reference=values.reference||"";row.date=values.date||row.date;row.mode=values.mode||row.mode;row.description="Batch payment: "+(values.item||s.name);}
  else{const count=(state.data.mediaMeta||[]).filter(m=>m.entityType==="payment"&&m.entityId===row.id).length;
   if(count)throw Error("This payment has attached proof. Edit it from Payments instead of removing it here.");
   state.data.cashLedger=state.data.cashLedger.filter(p=>p.id!==row.id);b.paymentId="";}
 }else if(values.paid>0){
  const id=makeid("batchpay");b.paymentId=id;
  state.data.cashLedger.unshift({id,date:values.date||today(),type:"Recorded payment",description:"Batch payment: "+(values.item||s.name),amount:values.paid,mode:values.mode||"Unconfirmed",reference:values.reference||"",linkedExpense:e.id,appliedToExpense:true,direction:"payment",source:"shopping-batch"});
 }
 e.paid=round(num(e.paid)+values.paid-oldPaid);
 s.paid=e.paid;
}
async function persist(s,old,values,editor){
 const e=syncShoppingExpense(s);
 const v=validate(s,values,old?.id);
 const oldBatch=old?JSON.parse(JSON.stringify(old)):null;
 const oldExpense={...e},oldList=[...(state.data.cashLedger||[])].map(x=>({...x}));
 const oldValue=old?round(old.paid):0;
 if(!old){old={id:makeid("batch"),legacy:false,createdAt:today()};s.purchaseBatches.push(old);}
 const originalList=JSON.parse(JSON.stringify(s.purchaseBatches));
 try{
  const qtyCost=round(v.quantity*v.unitPrice);
  const replacing={item:v.item,quantity:v.quantity,unitPrice:v.unitPrice,date:values.date||"",market:values.market||"",notes:values.notes||"",paid:v.paid,amount:qtyCost,legacy:false,reference:values.reference||"",mode:values.mode||"Unconfirmed"};
  const futureTotal=round(batches(s).reduce((sum,b)=>sum+(b===old?qtyCost:total(b)),0));
  const paid=round(num(e.paid)+v.paid-oldValue);
  const commitment=Math.max(num(e.expected),futureTotal);
  if(paid>commitment+.005)throw Error("Total paid would exceed the purchase commitment. Increase the planned budget or correct an earlier payment first.");
  changePayment(e,s,old,oldValue,replacing);
  Object.assign(old,replacing);
  syncShoppingExpense(s);
  audit("Shopping",s.name,oldBatch?"batch updated":"batch added",oldBatch?JSON.stringify(oldBatch):"",JSON.stringify(old));
  await save("Purchase batch saved");
  renderShopping();updateKpis();window.shoppingUX?.onBatchSaved(s.id,old.id);
 }catch(err){
  state.data.cashLedger=oldList;
  Object.assign(e,oldExpense);
  if(oldBatch)Object.assign(old,oldBatch);
  else s.purchaseBatches=s.purchaseBatches.filter(b=>b!==old);
  s.paid=num(e.paid);
  throw err;
 }
}
function editor(s,b,card){
 const area=card.querySelector("[data-batch-form]");area.hidden=false;
 const qty=b?num(b.quantity):1,rate=b?num(b.unitPrice):num(s.actualUnitPrice||s.unitPrice),paid=b?num(b.paid):0;
 const m=b?.mode||"Unconfirmed",date=b?.date||today(),market=b?.market||s.market||"",item=b?.item||s.name||"";
 area.innerHTML='<form class="batch-form"><div class="batch-title">'+(b?"Edit purchase batch":"Add purchase batch")+'</div>'+
 '<label class="batch-item-input">Item<input name="item" required maxlength="140" value="'+esc(item)+'" placeholder="Regular saree, premium saree…"></label>'+
 '<label>Date<input name="date" type="date" value="'+esc(date)+'"></label>'+
 '<label>Price ₹<input name="unitPrice" type="number" step=".01" min="0" required value="'+rate+'"></label>'+
 '<label>Quantity ('+esc(s.unit||"pcs")+')<input name="quantity" type="number" min="1" step="1" inputmode="numeric" required value="'+qty+'"></label>'+
 '<label>Market / shop<input name="market" value="'+esc(market)+'" maxlength="120"></label>'+
 '<label>Paid for this batch ₹<input name="paid" type="number" step=".01" min="0" value="'+paid+'"></label>'+
 '<label>Payment mode<select name="mode">'+["Unconfirmed","Cash","UPI","Bank Transfer","Credit Card","Debit Card","Cheque"].map(x=>'<option '+(m===x?"selected":"")+'>'+x+'</option>').join("")+'</select></label>'+
 '<label>UTR / bill reference<input name="reference" value="'+esc(b?.reference||"")+'" maxlength="120"></label>'+
 '<label class="batch-notes">Notes<textarea name="notes" maxlength="300">'+esc(b?.notes||"")+'</textarea></label>'+
 '<div class="batch-estimate">Batch total <strong data-preview>'+money(qty*rate)+'</strong></div>'+
 '<div class="batch-form-actions"><button class="btn green" type="submit">Save batch</button><button type="button" class="btn alt" data-cancel>Cancel</button></div>'+
 '<div class="batch-error" role="alert"></div></form>';
 const form=area.querySelector("form");
 form.elements.namedItem("quantity").addEventListener("input",()=>{
  area.querySelector("[data-preview]").textContent=money(num(form.elements.namedItem("quantity").value)*num(form.elements.namedItem("unitPrice").value));
 });
 form.elements.namedItem("unitPrice").addEventListener("input",()=>{
  area.querySelector("[data-preview]").textContent=money(num(form.elements.namedItem("quantity").value)*num(form.elements.namedItem("unitPrice").value));
 });
 form.querySelector("[data-cancel]").onclick=()=>{area.hidden=true;area.replaceChildren()};
 form.onsubmit=async ev=>{
  ev.preventDefault();const btn=form.querySelector('[type="submit"]');btn.disabled=true;
  try{
   const values=Object.fromEntries(new FormData(form).entries());
   await persist(s,b,values,card);
  }catch(err){area.querySelector(".batch-error").textContent=err.message||String(err);btn.disabled=false}
 };
 area.scrollIntoView({behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"center"});
 setTimeout(()=>form.elements.namedItem("item").focus({preventScroll:true}),50);
}
async function remove(s,b){
 if(num(b.paid)>0||b.paymentId){alert("This batch has a recorded payment. Change or refund that payment first to preserve your financial history.");return}
 if(!confirm("Delete this unpaid purchase batch? The item and other batches will be kept."))return;
 const previous=[...s.purchaseBatches];s.purchaseBatches=s.purchaseBatches.filter(x=>x.id!==b.id);
 try{syncShoppingExpense(s);audit("Shopping",s.name,"batch deleted",JSON.stringify(b),"");await save("Purchase batch deleted");renderShopping();updateKpis()}
 catch(err){s.purchaseBatches=previous;syncShoppingExpense(s);alert(err.message)}
}
async function sareeSplit(s){alert('16 × ₹300 are gifting sarees; the known ₹1,500 saree belongs in Family Sarees.');}

function draw(card,s){
 const main=document.createElement("section");main.className="shopping-batch-panel";
 if(!s.purchaseBatchesEnabled){
  main.innerHTML='<h4>Purchases at different prices</h4><p>Track each visit or purchase separately instead of changing one bulk price. Existing totals are preserved.</p><button type="button" class="btn alt">Enable purchase batches</button>';
  main.querySelector("button").onclick=()=>enable(s);card.append(main);return;
 }
 const e=expense(s),lines=batches(s),amount=round(lines.reduce((sum,b)=>sum+total(b),0)),quantity=round(lines.reduce((sum,b)=>sum+num(b.quantity),0));
 const assignedPaid=round(lines.reduce((sum,b)=>sum+num(b.paid),0));
 main.innerHTML='<div class="batch-heading"><div><h4>Purchase batches <span>'+lines.length+'</span></h4><p>'+quantity+" "+esc(s.unit||"pcs")+' • '+money(amount)+' purchase value • '+money(e?.paid||0)+' paid</p></div><button type="button" data-add class="btn green">+ Add batch</button></div>'+
 '<div class="batch-grid-scroll"><div class="batch-grid-heading"><span>Item</span><span>Price</span><span>Quantity</span><span>Total</span></div><div class="batch-lines"></div>'+
 '<div class="batch-grid-footer"><span>Grand total</span><span></span><span>'+quantity+' '+esc(s.unit||"pcs")+'</span><strong>'+money(amount)+'</strong></div></div><div class="batch-info">'+(num(e?.paid)>assignedPaid?'Additional advances / payments outside batches: <b>'+money(num(e.paid)-assignedPaid)+'</b>':'Each batch price is recorded separately. Unpaid amounts stay in the expense balance.')+'</div>'+
 '<div data-batch-form hidden></div>';
 const formSlot=main.querySelector("[data-batch-form]");
 main.querySelector(".batch-heading").after(formSlot);
 const root=main.querySelector(".batch-lines");
 for(const b of lines){
  const row=document.createElement("div");row.className="batch-row";row.dataset.batchId=b.id;
  row.innerHTML='<div class="batch-row-item"><strong>'+esc(b.item||s.name||"Shopping item")+'</strong><small>'+esc(b.date||"Date not set")+' · '+esc(b.market||"Market not set")+'</small></div>'+
   '<div class="batch-row-price">'+money(b.unitPrice)+'</div>'+
   '<div class="batch-row-quantity">'+num(b.quantity)+'</div>'+
   '<div class="batch-row-total"><b>'+money(total(b))+'</b><small>'+money(b.paid||0)+' paid</small></div>'+
   '<div class="batch-row-actions"><button class="btn alt" type="button" data-edit>Edit</button><button class="btn alt" type="button" data-remove>Delete</button></div>';
  row.querySelector("[data-edit]").onclick=()=>editor(s,b,main);
  row.querySelector("[data-remove]").onclick=()=>remove(s,b);
  if(b.receiptMediaId&&window.receiptEvidenceUrl){
    const view=document.createElement("button");
    view.type="button";view.className="btn alt";view.textContent="View receipt";
    view.onclick=async()=>{const url=await window.receiptEvidenceUrl(b.receiptMediaId);
      if(url)window.open(url,"_blank");else alert("Receipt evidence unavailable on this device. Check Media Library or cloud sync.")};
    row.querySelector(".batch-row-actions").append(view);
  }
  root.append(row);
 }
 main.querySelector("[data-add]").onclick=()=>editor(s,null,main);
 if(s.id==="s-1"&&lines.length<=1&&
    ((quantity===16&&amount===0)||(quantity===16&&amount===4800)||(quantity===17&&amount===6300))){
  const split=document.createElement("button");split.type="button";split.className="btn alt";split.textContent="Review known saree purchases";split.onclick=()=>sareeSplit(s);
  main.append(split);
 }
 card.append(main);
}
window.renderShoppingBatches=draw;
window.shoppingBatchTests={total,opening,validate};
})();