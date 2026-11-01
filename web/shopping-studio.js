
(function(){
"use strict";
let q="",cat="all",tab="all",sort="attention",ready=false;
const INR=n=>"₹"+(+n||0).toLocaleString("en-IN",{maximumFractionDigits:2});
const balanceINR=n=>n<0?"−"+INR(Math.abs(n)):INR(n);
const moneyRound=n=>Math.round((Number.isFinite(Number(n))?Math.max(0,Number(n)):0)*100)/100;
function budgetMath(allocated,purchased,paid){
 const expected=moneyRound(allocated),actual=moneyRound(purchased),payments=moneyRound(paid);
 const remaining=Math.round((expected-actual)*100)/100;
 return {expected,actual,paid:payments,remaining,
         overspent:Math.max(0,-remaining),unpaid:Math.max(0,Math.round((actual-payments)*100)/100),
         excessAdvance:Math.max(0,Math.round((payments-actual)*100)/100)};
}
window.shoppingBudgetMath=budgetMath;
const h=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const type=s=>{const k=String(s.status||"Pending").toLowerCase();return k==="skipped"?"skipped":k==="purchased"?"purchased":k.includes("partial")?"partial":"pending";};
const info=s=>{
 const key=shoppingExpenseId(s),e=key?expenseById(key):null;
 const amounts=budgetMath(e?.expected??s.expected,e?.actual??s.actual,e?.paid??s.paid);
 return {...amounts,target:+s.targetQty||0,bought:+s.completedQty||0,category:s.expenseCategory||e?.category||"Uncategorized"};
};
function render(){
 if(!ready)return;
 const all=state.data.shopping||[],sums={expected:0,actual:0,paid:0,remaining:0,overspent:0,unpaid:0,excessAdvance:0},
       counts={all:all.length,pending:0,partial:0,purchased:0,skipped:0};
 for(const s of all){const x=info(s);counts[type(s)]++;for(const key in sums)sums[key]+=x[key];}
 for(const [id,k] of [["psBudget","expected"],["psSpent","actual"],["psPaid","paid"]])document.getElementById(id).textContent=INR(moneyRound(sums[k]));
 const remaining=Math.round(sums.remaining*100)/100,remainingNode=document.getElementById("psDue");
 remainingNode.textContent=balanceINR(remaining);
 remainingNode.closest("article")?.classList.toggle("ps-overbudget",remaining<0);
 const remainingNote=document.getElementById("psDueNote");
 if(remainingNote)remainingNote.textContent=remaining<0
  ?"Over budget by "+INR(Math.abs(remaining))+" (across all shopping)"
  :sums.overspent>0?"Unspent overall · "+INR(sums.overspent)+" over allocation in individual items":"Allocated budget minus purchase value";
 const payNote=document.getElementById("psPayNote");
 if(payNote)payNote.textContent="Unpaid on purchased items: "+INR(sums.unpaid);
 for(const [id,k] of [["psAll","all"],["psToBuy","pending"],["psPartial","partial"],["psPurchased","purchased"],["psSkipped","skipped"]])document.getElementById(id).textContent=counts[k];
 const active=all.length-counts.skipped,progress=active?Math.round(counts.purchased/active*100):0;
 document.getElementById("psProgressText").textContent=counts.purchased+" of "+active+" groups purchased";
 document.getElementById("psPending").textContent=(counts.pending+counts.partial)+" need attention";
 document.getElementById("psProgressValue").style.width=progress+"%";
 const sel=document.getElementById("psCategory"),categoryList=["all",...new Set(all.map(s=>info(s).category))];
 sel.replaceChildren();
 categoryList.forEach((x,i)=>sel.add(new Option(i?" "+x:"All categories",x)));
 if(!categoryList.includes(cat))cat="all";sel.value=cat;
 let visible=all.filter(s=>{
  const v=info(s);
  return (tab==="all"||type(s)===tab)&&(cat==="all"||cat===v.category)&&(!q||[s.name,s.market,s.event,s.owner,v.category].some(x=>String(x||"").toLowerCase().includes(q)));
 });
 const order={partial:0,pending:1,purchased:2,skipped:3};
 visible.sort((a,b)=>sort==="name"?String(a.name).localeCompare(String(b.name)):sort==="budget"?info(b).expected-info(a).expected:sort==="balance"?info(a).remaining-info(b).remaining:order[type(a)]-order[type(b)]||info(b).expected-info(a).expected);
 document.getElementById("psResultCount").textContent="Showing "+visible.length+" of "+all.length+" item groups";
 const root=document.getElementById("shoppingGrid"),originalCards=[...root.children].filter(x=>x.classList.contains("cost-card")),byId=new Map(all.map((s,i)=>[s.id,originalCards[i]]));
 root.replaceChildren();
 if(!visible.length){root.innerHTML='<div class="ps-empty"><h3>No matching items</h3><p>Adjust the filters or add your next purchase.</p></div>';return;}
 for(const s of visible){
  const v=info(s),k=type(s),unit=s.unit||"pcs",percent=v.target?Math.min(100,Math.round(v.bought/v.target*100)):(k==="purchased"?100:0);
  const base=byId.get(s.id);if(!base)continue;
  const row=document.createElement("article");row.className="ps-item";row.dataset.shoppingId=s.id;
  row.innerHTML='<div class="ps-item-header"><div><span class="ps-category-label">'+h(v.category)+" · "+h(s.event||"General")+'</span><h3>'+h(s.name||"Shopping item")+'</h3><small>'+h(s.market||"Shop not set")+'</small></div><span class="ps-state '+k+'">'+({pending:"To buy",partial:"In progress",purchased:"Purchased",skipped:"Skipped"})[k]+'</span></div>'+
  '<div class="ps-money"><div><span>Budget</span><b>'+INR(v.expected)+'</b></div><div><span>Purchase</span><b>'+INR(v.actual)+'</b></div><div class="'+(v.remaining<0?'ps-overbudget':'')+'"><span>Budget left</span><b>'+balanceINR(v.remaining)+'</b>'+(v.remaining<0?'<small>Over budget by '+INR(v.overspent)+'</small>':'')+'</div></div>'+
  '<div class="ps-payment-note">'+(v.excessAdvance>0?'Advance above recorded purchases: ':'Unpaid on purchases: ')+'<b>'+INR(v.excessAdvance>0?v.excessAdvance:v.unpaid)+'</b></div>'+
  '<div class="ps-qty"><span>'+(v.target?displayShoppingQty(v.bought,unit)+" / "+displayShoppingQty(v.target,unit)+" "+h(unit):"Budget-based purchase")+'</span><span>'+percent+'%</span></div><div class="ps-line"><i style="width:'+percent+'%"></i></div>'+
  '<div class="ps-buttons"><button type="button" class="btn green" data-buy>Record purchase</button><button type="button" class="btn alt" data-edit>View / edit details</button></div><details class="ps-details"><summary>Quantity, unit price, payment & evidence <span>Expand</span></summary><div class="ps-cost-slot"></div></details>';
  const details=row.querySelector("details");
  row.querySelector("[data-buy]").onclick=()=>{details.open=true;details.scrollIntoView({behavior:"smooth",block:"nearest"});setTimeout(()=>base.querySelector('[data-q="completedQty"]')?.focus({preventScroll:true}),80);};
  row.querySelector("[data-edit]").onclick=()=>{details.open=!details.open;if(details.open)setTimeout(()=>base.querySelector("input,select")?.focus({preventScroll:true}),80);};
  row.querySelector(".ps-cost-slot").append(base);
  root.append(row);
 }
}
function mount(){
 if(ready)return;
 const main=document.querySelector("main.wrap"),grid=document.getElementById("shoppingGrid"),form=document.getElementById("addShoppingForm"),
 clothes=document.getElementById("clothingBody").closest(".table-wrap"),media=document.querySelector(".evidence-upload"),mediaGrid=document.getElementById("shoppingMediaGrid");
 if(!main||!grid||!form)return;ready=true;main.classList.add("ps-workspace");
 main.innerHTML='<section class="ps-hero"><div><small>WEDDING PROCUREMENT</small><h1>Shopping & purchases</h1><p>Make every purchase easier to plan, track and account for.</p></div><div class="ps-hero-actions"><button id="psAddButton" type="button" class="btn green">+ Add item</button><a class="btn alt" href="/finance.html">Finance report</a></div></section>'+
 '<section class="ps-dashboard"><article><span>Allocated budget</span><strong id="psBudget">—</strong><small>Original purchase plan</small></article><article><span>Purchase value</span><strong id="psSpent">—</strong><small>Recorded purchases</small></article><article><span>Paid / advance</span><strong id="psPaid">—</strong><small id="psPayNote">Unpaid on purchases: —</small></article><article><span>Budget remaining</span><strong id="psDue">—</strong><small id="psDueNote">Budget minus purchases</small></article></section>'+
 '<div class="ps-progress"><div><b id="psProgressText">Progress</b><span id="psPending"></span></div><div class="ps-progress-track"><i id="psProgressValue"></i></div></div>'+
 '<section class="ps-layout"><div class="ps-main"><div class="ps-controls"><div class="ps-search"><label for="psSearch">Search</label><input id="psSearch" type="search" placeholder="Item, market, category, function…"></div><div><label for="psCategory">Category</label><select id="psCategory"></select></div><div><label for="psSort">Sort</label><select id="psSort"><option value="attention">Needs attention</option><option value="name">A–Z</option><option value="budget">Largest budget</option><option value="balance">Lowest budget remaining</option></select></div></div>'+
 '<nav class="ps-tabs" aria-label="Purchase filters"><button type="button" data-tab="all" class="active">All <b id="psAll"></b></button><button type="button" data-tab="pending">To buy <b id="psToBuy"></b></button><button type="button" data-tab="partial">In progress <b id="psPartial"></b></button><button type="button" data-tab="purchased">Purchased <b id="psPurchased"></b></button><button type="button" data-tab="skipped">Skipped <b id="psSkipped"></b></button></nav>'+
 '<div class="ps-list-head"><div><b>Purchase register</b><small id="psResultCount"></small></div><a href="/expenses.html">Linked expenses ↗</a></div><div id="psGridTarget"></div></div>'+
 '<aside class="ps-guidance"><article><span class="ps-symbol">₹</span><h3>One connected budget</h3><p>These records link to Expenses; they are not counted twice.</p><a href="/expenses.html">Explore expenses →</a></article><article><h3>Record purchases in 4 steps</h3><ol><li>Add items with quantities</li><li>Update purchased units and rates</li><li>Record payments and advances</li><li>Attach receipts and photos</li></ol></article></aside></section>'+
 '<section id="psAddPanel" class="ps-add-panel" hidden><div class="ps-add-head"><div><h2>Add shopping item</h2><p>Dynamic category fields and automatic expense calculation</p></div><button id="psAddClose" type="button" class="btn alt">Cancel</button></div><div id="psFormTarget"></div></section>'+
 '<section class="ps-below"><details><summary><span><b>Family clothing & fitting</b><small>Tailoring, fittings, packing and receipts</small></span><span>Expand →</span></summary><div id="psClothesTarget"></div></details><details><summary><span><b>Photos, bills & purchase proof</b><small>Images, PDFs and trials linked to shopping records</small></span><span>Expand →</span></summary><div id="psMediaTarget"></div><div id="psMediaGridTarget"></div></details></section>';
 document.getElementById("psGridTarget").append(grid);grid.className="ps-list";
 document.getElementById("psFormTarget").append(form);
 document.getElementById("psClothesTarget").append(clothes);
 document.getElementById("psMediaTarget").append(media);
 document.getElementById("psMediaGridTarget").append(mediaGrid);
 document.getElementById("psAddButton").onclick=()=>{const target=document.getElementById("psAddPanel");target.hidden=false;target.scrollIntoView({behavior:"smooth",block:"start"});setTimeout(()=>form.querySelector('[name="name"]').focus({preventScroll:true}),80);};
 document.getElementById("psAddClose").onclick=()=>document.getElementById("psAddPanel").hidden=true;
 document.getElementById("psSearch").oninput=e=>{q=e.target.value.toLowerCase().trim();window.renderShopping();};
 document.getElementById("psCategory").onchange=e=>{cat=e.target.value;window.renderShopping();};
 document.getElementById("psSort").onchange=e=>{sort=e.target.value;window.renderShopping();};
 document.querySelectorAll(".ps-tabs button").forEach(b=>b.onclick=()=>{tab=b.dataset.tab;document.querySelectorAll(".ps-tabs button").forEach(x=>x.classList.toggle("active",x===b));window.renderShopping();});
}
const original=window.renderShopping;
window.renderShopping=function(){mount();original();render();};
})();