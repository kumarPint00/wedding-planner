/* Shopping Quick Add & Context Return • v77
   Presentation only. Saves still go through the existing validated form and batch handlers. */
(function(){
"use strict";
let mounted=false,opener=null,recent="",busy=false;
const $=id=>document.getElementById(id);
const reduced=()=>window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches??false;
const findCard=id=>[...document.querySelectorAll("#shoppingGrid .ps-item")].find(el=>el.dataset.shoppingId===id);
function close(restore){
 const panel=$("psAddPanel");if(!panel||panel.hidden)return;
 panel.hidden=true;document.body.classList.remove("ps-dialog-open");
 if(restore&&opener?.isConnected)opener.focus({preventScroll:true});
}
function open(){
 const panel=$("psAddPanel");if(!panel)return;
 opener=document.activeElement;
 panel.hidden=false;document.body.classList.add("ps-dialog-open");
 window.setTimeout(()=>panel.querySelector('[name="name"]')?.focus({preventScroll:true}),40);
}
function clearFilters(){
 const search=$("psSearch"),category=$("psCategory"),allTab=document.querySelector('.ps-tabs [data-tab="all"]');
 if(search&&search.value){search.value="";search.dispatchEvent(new Event("input",{bubbles:true}))}
 if(category&&category.value!=="all"){category.value="all";category.dispatchEvent(new Event("change",{bubbles:true}))}
 if(allTab&&!allTab.classList.contains("active"))allTab.click();
}
function focusRecord(id,options={}){
 if(!id)return;
 if(options.added){close(false);clearFilters();}
 recent=id;
 window.renderShopping();
 const row=findCard(id);
 if(!row)return;
 const grid=$("shoppingGrid");
 // A newly created purchase should appear at the top, not disappear into a long sorted list.
 if(options.added&&grid?.firstElementChild!==row)grid.prepend(row);
 const details=row.querySelector(".ps-details");
 if(options.details&&details)details.open=true;
 const batch=options.batchId?[...row.querySelectorAll(".batch-row")].find(b=>b.dataset.batchId===options.batchId):null;
 const destination=batch||row;
 row.classList.add("ps-new-record");
 destination.setAttribute("tabindex","-1");
 window.requestAnimationFrame(()=>{
  destination.scrollIntoView({behavior:reduced()?"auto":"smooth",block:"center"});
  destination.focus({preventScroll:true});
 });
 window.setTimeout(()=>{row.classList.remove("ps-new-record");recent="";},4000);
}
function openPurchase(id){
 const row=findCard(id);if(!row)return;
 const details=row.querySelector(".ps-details");if(!details)return;
 details.open=true;
 const s=(state.data.shopping||[]).find(x=>x.id===id);
 const slot=row.querySelector(".shopping-batch-panel");
 const addBatch=slot?.querySelector("[data-add]");
 if(s?.purchaseBatchesEnabled&&addBatch){
  addBatch.click();
  return;
 }
 const enable=slot?.querySelector("button");
 if(!s?.purchaseBatchesEnabled&&enable){
  // Prompt is supplied by existing batch migration logic: purchase totals/payments are preserved.
  enable.click();return;
 }
 details.scrollIntoView({behavior:reduced()?"auto":"smooth",block:"center"});
 row.querySelector('[data-q="completedQty"]')?.focus({preventScroll:true});
}
function mount(){
 if(mounted||!$("psAddPanel")||!$("addShoppingForm")||!$("shoppingGrid"))return;
 mounted=true;
 const panel=$("psAddPanel");panel.classList.add("ps-dialog");
 panel.setAttribute("role","dialog");panel.setAttribute("aria-modal","true");panel.setAttribute("aria-labelledby","psAddDialogHeading");
 const heading=panel.querySelector("h2");if(heading)heading.id="psAddDialogHeading";
 const sheet=document.createElement("div");sheet.className="ps-dialog-sheet";
 const backdrop=document.createElement("div");backdrop.className="ps-dialog-backdrop";
 backdrop.setAttribute("aria-hidden","true");backdrop.addEventListener("click",()=>close(true));
 while(panel.firstChild)sheet.append(panel.firstChild);
 panel.append(backdrop,sheet);
 const trigger=$("psAddButton");if(trigger)trigger.onclick=open;
 const dismiss=$("psAddClose");if(dismiss)dismiss.onclick=()=>close(true);
 const float=document.createElement("button");float.type="button";float.id="psQuickAdd";float.className="ps-quick-add";
 float.textContent="+ Add item";float.setAttribute("aria-label","Add shopping item without scrolling");
 float.onclick=open;document.body.append(float);
 panel.addEventListener("keydown",e=>{
  if(e.key==="Escape"){e.preventDefault();close(true);return}
  if(e.key!=="Tab")return;
  const focusable=[...sheet.querySelectorAll('input:not([disabled]),select:not([disabled]),textarea:not([disabled]),button:not([disabled])')]
   .filter(el=>el.getClientRects().length>0);
  const first=focusable[0],last=focusable[focusable.length-1];
  if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
  if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
 });
}
const original=window.renderShopping;
window.renderShopping=function(){
 original();
 mount();
 if(!mounted)return;
 const grid=$("shoppingGrid");
 for(const row of grid.querySelectorAll(".ps-item")){
  const id=row.dataset.shoppingId;
  if(!id)continue;
  const buy=row.querySelector("[data-buy]");
  if(buy){buy.onclick=()=>openPurchase(id);buy.textContent="Record purchase";}
  const edit=row.querySelector("[data-edit]");
  if(edit)edit.onclick=()=>{
   const details=row.querySelector(".ps-details");if(!details)return;
   details.open=!details.open;
   if(details.open){
    details.scrollIntoView({behavior:reduced()?"auto":"smooth",block:"nearest"});
    window.setTimeout(()=>row.querySelector(".cost-card input, .cost-card select")?.focus({preventScroll:true}),50);
   }
  };
 }
};
window.shoppingUX={
 onAdded:id=>focusRecord(id,{added:true}),
 onBatchSaved:(id,batchId)=>focusRecord(id,{details:true,batchId}),
 onBatchesEnabled:id=>{
  focusRecord(id,{details:true});
  window.setTimeout(()=>openPurchase(id),220);
 }
};
})();
