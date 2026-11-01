/* Payments ↔ Financial Integrity v50: one ledger, explicit expense reconciliation */
(function(){
"use strict";
const amt=x=>Math.round((Number(x)||0)*100)/100;
const rupee=x=>"₹"+(Number(x)||0).toLocaleString("en-IN",{maximumFractionDigits:2});
const ledger=()=>state.data.cashLedger||[];
const expense=id=>(state.data.expenses||[]).find(e=>e.id===id);
const refund=p=>p.direction==="refund"||p.type==="Refund / Return";
const spending=p=>p.type==="Recorded payment"||p.type==="Emergency spend"||p.type==="Refund / Return"||p.appliedToExpense===true;
const isLinked=p=>!!p.linkedExpense&&!!expense(p.linkedExpense);
function checkUTR(ref,except){
 const key=String(ref||"").trim().toLowerCase();
 if(key&&ledger().some(p=>p.id!==except&&String(p.reference||"").trim().toLowerCase()===key))throw Error("This UTR/reference is already recorded.");
}
function setPaid(ex,paid){
 if(!ex)throw Error("Expense missing");
 if(!Number.isFinite(paid)||paid<0)throw Error("Expense paid cannot be negative.");
 const x=amt(paid);ex.paid=x;
 for(const s of state.data.shopping||[])if(shoppingExpenseId(s)===ex.id)s.paid=x;
 if((state.data.familyClothing||[]).some(r=>r.expenseId===ex.id))distributeToFamily(ex.id,"paid",x);
 if(ex.id==="jewellery"&&(state.data.jewelleryRegister||[]).length===1)state.data.jewelleryRegister[0].paid=x;
 for(const v of state.data.vendors||[])if(vendorExpenseId(v)===ex.id){v.paid=x;v.balance=Math.max(0,(+ex.actual||+ex.expected||0)-x)}
 return x;
}
async function post({date,type,description,amount,mode,reference,expenseId,kind}){
 const value=Number(amount),n=amt(value),ex=expenseId?expense(expenseId):null;
 if(!String(description||"").trim())throw Error("Description is required.");
 if(!Number.isFinite(value)||value<=0||n<=0)throw Error("Enter a valid positive amount.");
 if(type==="Recorded payment"&&!ex)throw Error("Select the linked expense for a recorded payment.");
 if(expenseId&&!ex)throw Error("Selected expense does not exist.");
 checkUTR(reference);
 const direction=kind==="refund"?"refund":"payment",delta=direction==="refund"?-n:n;
 const old=ex?+ex.paid||0:0,limit=ex?Math.max(+ex.expected||0,+ex.actual||0):0;
 if(ex&&old+delta<0)throw Error("Refund exceeds the expense's paid balance.");
 if(ex&&delta>0&&old+delta>limit+.005)throw Error("Payment exceeds the expense commitment. Update the commitment before recording.");
 const row={id:uid("pay"),date:date||new Date().toISOString().slice(0,10),type:direction==="refund"?"Refund / Return":type,
  description:String(description).trim(),amount:n,mode:mode||"Unconfirmed",reference:String(reference||"").trim(),
  linkedExpense:ex?.id||"",appliedToExpense:!!ex,direction,createdAt:new Date().toISOString(),source:"payment-bridge-v50"};
 state.data.cashLedger.unshift(row);
 if(ex)setPaid(ex,old+delta);
 try{audit("Payments",row.description,"create","",JSON.stringify(row));await save(ex?"Linked payment recorded":"Cash entry saved");}
 catch(e){state.data.cashLedger=ledger().filter(p=>p!==row);if(ex)setPaid(ex,old);throw e;}
 return row;
}
async function matchExisting(row,expenseId,alreadyPaid){
 if(!row||!spending(row)||isLinked(row))throw Error("This payment is already linked or is not an expense.");
 const ex=expense(expenseId);if(!ex)throw Error("Choose an expense.");
 const delta=refund(row)?-amt(row.amount):amt(row.amount),old=+ex.paid||0;
 if(!alreadyPaid&&(old+delta<0||delta>0&&old+delta>Math.max(+ex.expected||0,+ex.actual||0)+.005))
  throw Error("Payment cannot fit the expense balance. Adjust the commitment or mark as already included.");
 const prior={linkedExpense:row.linkedExpense,appliedToExpense:row.appliedToExpense,direction:row.direction,reconciledAsExisting:row.reconciledAsExisting};
 Object.assign(row,{linkedExpense:ex.id,appliedToExpense:true,direction:refund(row)?"refund":"payment",reconciledAsExisting:!!alreadyPaid});
 if(!alreadyPaid)setPaid(ex,old+delta);
 try{audit("Payments",row.description,"reconcile",prior.linkedExpense||"Unlinked",ex.id,alreadyPaid?"Already included":"Applied to Paid balance");await save("Payment reconciled");}
 catch(e){Object.assign(row,prior);if(!alreadyPaid)setPaid(ex,old);throw e;}
}
function expenseOptions(el,unlinkedText){
 el.replaceChildren();el.add(new Option(unlinkedText,""));
 for(const e of state.data.expenses||[])el.add(new Option(e.item+" • "+rupee(e.paid)+" paid",e.id));
}
window.bridgeSetupPayments=function(){
 const form=document.getElementById("paymentForm");if(!form)return;
 const submit=form.querySelector('button:not([type]),button[type="submit"]');
 const wrapper=document.createElement("div");wrapper.className="payment-link-fields span2";
 wrapper.innerHTML='<div class="field"><label>Linked expense / booking</label><select name="linkedExpense" aria-label="Linked expense"></select><small>Mandatory for Recorded payment. Cash received, withdrawal and shagun can remain unlinked.</small></div>'+
 '<div class="field"><label>UTR / receipt reference (optional)</label><input name="reference" maxlength="140" placeholder="UPI / cheque / invoice number"></div>'+
 '<div class="note">Link a payment to update Expenses, Vendors, Shopping and Financial Integrity together. Existing unlinked entries can be reconciled from Financial Integrity.</div>';
 submit.before(wrapper);
 const select=form.elements.namedItem("linkedExpense"),type=form.elements.namedItem("type");
 expenseOptions(select,"No expense — cash / shagun only");
 const setRequired=()=>select.required=type.value==="Recorded payment";
 type.addEventListener("change",setRequired);setRequired();
 form.addEventListener("submit",async ev=>{
  ev.preventDefault();const btn=submit;btn.disabled=true;
  try{const f=new FormData(form);await post({date:f.get("date"),type:f.get("type"),description:f.get("description"),amount:f.get("amount"),mode:f.get("mode"),reference:f.get("reference"),expenseId:f.get("linkedExpense")});
   form.reset();expenseOptions(select,"No expense — cash / shagun only");setRequired();renderPayments();updateKpis();
  }catch(err){alert(err.message||String(err))}finally{btn.disabled=false}
 });
};
window.bridgeSetupFinance=function(){
 const form=document.getElementById("postWeddingPayment");if(!form)return;
 const select=form.elements.namedItem("expense");expenseOptions(select,"Choose expense…");
 const date=form.elements.namedItem("date");date.value=new Date().toISOString().slice(0,10);
 function draw(){
  const result=window.weddingFinancialSummary(),unlinked=ledger().filter(p=>spending(p)&&!isLinked(p));
  for(const [id,val] of [["moneyExpected",result.expected],["moneyTotal",result.total],["moneyPaid",result.paid]])document.getElementById(id).textContent=rupee(val);
  document.getElementById("moneyIssues").textContent=result.issues.length+unlinked.length;
  const findings=document.getElementById("moneyFindings");findings.replaceChildren();
  if(unlinked.length){const note=document.createElement("div");note.className="alert";note.textContent=unlinked.length+" payment(s) require linking. Choose an expense below. If the expense already includes this payment, tick 'Already counted' to prevent duplicate counting.";findings.append(note)}
  for(const x of result.issues){const item=document.createElement("div");item.className="finance-finding";const b=document.createElement("b"),s=document.createElement("span");b.textContent=x.level.toUpperCase()+" • "+x.name;s.textContent=x.detail;item.append(b,s);findings.append(item)}
  if(!unlinked.length&&!result.issues.length)findings.innerHTML='<div class="alert good">No unlinked payments or detected discrepancies.</div>';
  const body=document.getElementById("moneyLedger");body.replaceChildren();
  for(const p of ledger()){
   const tr=document.createElement("tr"),ex=expense(p.linkedExpense),need=spending(p)&&!ex;
   for(const v of [p.date||"—",p.type+" • "+(p.description||""),rupee(p.amount),ex?.item||"—",need?"Needs linking":ex?"Linked":"Cash / shagun",(p.mode||"Unconfirmed")+" • "+(p.reference||"No UTR")]){
    const td=document.createElement("td");td.textContent=v;tr.append(td);
   }
   const action=document.createElement("td");
   if(need){
    const choice=document.createElement("select");choice.setAttribute("aria-label","Expense for "+p.description);choice.add(new Option("Choose expense…",""));
    for(const x of state.data.expenses||[])choice.add(new Option(x.item,x.id));
    const check=document.createElement("input");check.type="checkbox";
    const label=document.createElement("label");label.className="finance-already";label.append(check,document.createTextNode(" Already counted"));
    const button=document.createElement("button");button.type="button";button.className="btn green";button.textContent="Link payment";
    button.onclick=async()=>{
      if(!choice.value){alert("Choose the expense for this payment.");return}
      if(check.checked&&!confirm("Confirm: this payment is already in the selected expense's Paid amount. Link without adding it again?"))return;
      button.disabled=true;
      try{await matchExisting(p,choice.value,check.checked);draw();updateKpis()}
      catch(e){alert(e.message||String(e));button.disabled=false}
    };
    action.append(choice,label,button);
   }else{const note=document.createElement("small");note.textContent=ex?(p.reconciledAsExisting?"Already counted":"In Expenses"):"Not an expense";action.append(note)}
   tr.append(action);body.append(tr);
  }
 }
 form.onsubmit=async ev=>{
  ev.preventDefault();const button=form.querySelector('[type="submit"]');button.disabled=true;
  try{const f=new FormData(form),ex=expense(f.get("expense"));if(!ex)throw Error("Choose an expense.");
   const kind=f.get("kind");await post({type:"Recorded payment",kind,description:(kind==="refund"?"Refund: ":"Payment: ")+ex.item,
    amount:f.get("amount"),mode:f.get("mode"),reference:f.get("reference"),date:f.get("date"),expenseId:ex.id});
   form.reset();date.value=new Date().toISOString().slice(0,10);draw();updateKpis();
  }catch(e){alert(e.message||String(e))}finally{button.disabled=false}
 };
 document.getElementById("moneyRescan").onclick=draw;draw();
};
window.paymentBridgeTest={post,matchExisting,setPaid,isLinked,spending,ledger,expense};
})();