
(function(){
"use strict";
const $=id=>document.getElementById(id);
const opts=['Unassigned','Mummy','Nidhi / Bhabhi','Priyanka','Neetu'];
const money=n=>'₹'+(Number(n)||0).toLocaleString('en-IN',{maximumFractionDigits:2});
function redraw(){
 const all=state.data.shopping||[];
 const gifts=all.filter(x=>x.sareeType==='gifting'&&x.id!=='s-1');
 const family=all.filter(x=>x.sareeType==='family');
 const count=16+gifts.reduce((n,x)=>n+(+x.completedQty||0),0);
 $('sareeSummary').textContent=count+' gifting sarees purchased (including the original 16 at ₹300), '+family.length+' family saree group(s)';
 $('sareeLegacyWarning').textContent=state.meta?.sareeNeedsBatchReview?'Old gifting batches contain a saree above ₹350. Review its linked payment before moving it; existing evidence is preserved.':'';
 const gb=$('giftingSareeRows');gb.replaceChildren();
 for(const x of gifts){const tr=gb.insertRow();for(const v of ['₹'+x.unitPrice,x.completedQty+' / '+x.targetQty,money((+x.unitPrice||0)*(+x.completedQty||0))])tr.insertCell().textContent=v}
 if(!gifts.length)gb.innerHTML='<tr><td colspan="3">No additional gifting batches entered yet.</td></tr>';
 const fb=$('familySareeRows');fb.replaceChildren();
 for(const x of family){
  const tr=fb.insertRow(),select=document.createElement('select');
  for(const p of opts){const option=new Option(p,p);select.add(option)}
  select.value=x.recipient||'Unassigned';
  select.onchange=async()=>{
   x.recipient=select.value;
   x.name='Family saree — '+(x.recipient==='Unassigned'?'recipient to assign':x.recipient)+(x.sareeOccasion?' — '+x.sareeOccasion:'');
   const e=expenseById(shoppingExpenseId(x));if(e)e.item=x.name;
   await save('Family saree recipient updated');renderShopping();redraw();
  };
  tr.insertCell().append(select);
  const expense=expenseById(shoppingExpenseId(x));
  for(const v of [x.sareeOccasion||'Not specified',x.completedQty+' / '+x.targetQty,money(expense?.actual),money(expense?.paid)])tr.insertCell().textContent=v;
 }
 if(!family.length)fb.innerHTML='<tr><td colspan="5">No family sarees recorded.</td></tr>';
}
function valid(q){return Number.isSafeInteger(q)&&q>0}
async function gift(ev){
 ev.preventDefault();const f=ev.target,rate=+f.elements.rate.value,q=+f.elements.qty.value,done=f.elements.purchased.checked;
 if(![250,300,350].includes(rate)||!valid(q)){alert('Gifting sarees allow ₹250, ₹300 or ₹350 and whole numbers only.');return}
 state.data.shopping.push({id:uid('gift-saree'),name:'Gifting sarees @ ₹'+rate,sareeType:'gifting',
 targetQty:q,completedQty:done?q:0,unit:'pcs',unitPrice:rate,actualUnitPrice:rate,paid:0,
 status:done?'Purchased':'Pending',autoCalc:true,expenseCategory:'Jewellery & Gifts',event:'Gifting',market:''});
 await save('Gifting sarees added');renderShopping();f.reset();redraw();
}
async function family(ev){
 ev.preventDefault();const f=ev.target,recipient=f.elements.recipient.value,q=+f.elements.qty.value,price=+f.elements.price.value,done=f.elements.purchased.checked;
 if(!opts.includes(recipient)||!valid(q)||!Number.isFinite(price)||price<0){alert('Enter a valid price, recipient and quantity.');return}
 const occasion=String(f.elements.occasion.value||'').trim().slice(0,90);
 state.data.shopping.push({id:uid('family-saree'),name:'Family saree — '+(recipient==='Unassigned'?'recipient to assign':recipient)+(occasion?' — '+occasion:''),
 sareeType:'family',recipient,sareeOccasion:occasion,targetQty:q,completedQty:done?q:0,unit:'pcs',
 unitPrice:price,actualUnitPrice:price,paid:0,status:done?'Purchased':'Pending',
 autoCalc:true,expenseCategory:'Clothing',event:'Family Sarees',market:''});
 await save('Family saree added');renderShopping();f.reset();redraw();
}
window.setupSareeSections=function(){
 if(!$('saree-sections'))return;
 $('addGiftSarees').addEventListener('submit',gift);
 $('addFamilySarees').addEventListener('submit',family);
 redraw();
};
})();
