
/* Optional ChatGPT Plus assisted receipt import. No API key or automatic uploads. */
(function(){
"use strict";
const $=id=>document.getElementById(id);
const digits=s=>String(s??"").replace(/[०-९]/g,d=>String("०१२३४५६७८९".indexOf(d)));
function number(s){
 if(s===null||s===undefined||s==="")return NaN;
 const v=digits(s).replace(/[₹,\s]/g,"");
 return v?Number(v):NaN;
}
const prompt=[
 "Read the attached receipt photo carefully. It may be handwritten in Hindi, English or Hinglish.",
 "Identify EACH purchased item separately, including repeated items at different rates.",
 "Return ONLY a valid JSON object (no markdown or explanation) in exactly this structure:",
 '{"merchant":"","date":"YYYY-MM-DD or empty","receipt_total":null,"items":[{"item":"original Hindi or English item name","quantity":null,"unit_price":null,"total":null,"uncertain":true}]}',
 "Use numbers for prices/quantities, without currency symbols.",
 "Never invent unclear words, amounts or quantities. Use null for unreadable values and uncertain: true.",
 "When quantity and line total are legible, derive unit_price = total / quantity; mark uncertain if it is inferred.",
 "Do not combine prices from different batches. Do not include GST, discounts, taxes, advances or payments as purchased items.",
 "Check that each line quantity × unit_price equals total, and cross-check the receipt total.",
 "This is a draft for human verification before anything is saved."
].join("\n");
function bestTarget(item){
 const names=(typeof state!=="undefined"&&state?.data?.shopping)||[];
 if(!names.length)return "__new__";
 const synonyms=[
  [/साड़|साड़|saree|sari/i,/saree|sari/i],
  [/पायल|बिछिया|चांदी|चाँदी|सोना/i,/jewel|silver|gold|payal|bich/i],
  [/चावल|आटा|दाल|तेल|चीनी/i,/food|cater|ration|grocery|rice|atta/i],
  [/जूता|चप्पल/i,/footwear|shoe|sandal/i],
  [/गिफ्ट|उपहार|लिफाफा/i,/gift|packing/i]
 ];
 for(const [source,target] of synonyms){
  if(source.test(String(item||""))){const matching=names.find(group=>target.test(String(group.name||"")+" "+String(group.expenseCategory||"")));if(matching)return matching.id}
 }
 const words=String(item||"").toLowerCase().split(/[^a-z0-9\u0900-\u097f]+/).filter(x=>x.length>=4);
 let best="__new__",score=0;
 for(const group of names){
  const name=String(group.name||"").toLowerCase();
  const count=words.filter(w=>name.includes(w)).length;
  if(count>score){score=count;best=group.id;}
 }
 return score?best:"__new__";
}
function parseAI(raw){
 if(typeof raw!=="string"||raw.length>140000)return null;
 let source=raw.trim();
 const fenced=source.match(/\x60{3}(?:json)?\s*([\s\S]*?)\x60{3}/i);
 if(fenced)source=fenced[1].trim();
 if(!/^[{\[]/.test(source)){
  const start=source.search(/[{\[]/),end=Math.max(source.lastIndexOf("}"),source.lastIndexOf("]"));
  if(start<0||end<=start)return null;
  source=source.slice(start,end+1);
 }
 let value;try{value=JSON.parse(source)}catch{return null}
 if(!value||typeof value!=="object")return null;
 const list=Array.isArray(value)?value:(value.items||value.rows||value.line_items);
 if(!Array.isArray(list)||list.length>200)return null;
 const rows=[];let skipped=0;
 for(const row of list){
  if(!row||typeof row!=="object"){skipped++;continue}
  const item=String(row.item??row.item_name??row.name??row.description??row.वस्तु??row.सामान??"").trim().slice(0,140);
  const qty=number(row.quantity??row.qty??row.मात्रा??row.संख्या);
  const total=number(row.total??row.amount??row.line_total??row.कुल);
  const fromRate=row.unit_price??row.unitPrice??row.price??row.rate??row.कीमत??row.रेट;
  const price=fromRate==null||fromRate===""?(qty>0?total/qty:NaN):number(fromRate);
  if(!item||!Number.isFinite(qty)||qty<=0||qty>100000||!Number.isFinite(price)||price<0||price>1e8){skipped++;continue}
  const differs=Number.isFinite(total)&&Math.abs(qty*price-total)>Math.max(1,total*.02);
  rows.push({id:"chatgpt-"+Date.now()+"-"+rows.length,item,quantity:qty,price:Math.round(price*100)/100,target:bestTarget(item),include:true,uncertain:!!(row.uncertain||row.needs_review||differs||(fromRate==null&&Number.isFinite(total)))});
 }
 const info=Array.isArray(value)?{}:value,meta=info.metadata||info.receipt||{};
 const merchant=String(info.merchant??info.shop??info.vendor??meta.merchant??"").slice(0,90);
 const rawDate=String(info.date??info.purchase_date??meta.date??"");
 const date=/^\d{4}-\d{2}-\d{2}$/.test(rawDate)?rawDate:"";
 const declared=number(info.receipt_total??info.grand_total??info.declared_total??meta.total);
 return {rows,skipped,metadata:{merchant,date,total:Number.isFinite(declared)?declared:0}};
}
function showMessage(message){$("rsAssistStatus").textContent=message}
async function copyPrompt(){
 try{
  if(!navigator.clipboard?.writeText)throw Error("Clipboard unavailable");
  await navigator.clipboard.writeText(prompt);
  showMessage("Prompt copied. Open ChatGPT, attach the SAME receipt photo, and paste the prompt. Copy the JSON result back here.");
 }catch(err){
  const el=$("rsPromptCopy");el.hidden=false;el.value=prompt;el.focus();el.select();
  showMessage("Your browser blocked automatic copying. Copy the selected text from the prompt box.");
 }
}
function importResponse(){
 const result=parseAI($("rsAssistantJSON").value);
 if(!result){showMessage("Invalid JSON. Ask ChatGPT to reply with ONLY valid JSON containing an items array.");return}
 if(!result.rows.length){showMessage("No complete items found. Recheck the photo or add unclear items manually.");return}
 if(typeof window.receiptScannerSetAIReview!=="function"){showMessage("Reload Shopping once to enable receipt review.");return}
 window.receiptScannerSetAIReview(result.rows,result.metadata);
 showMessage(result.rows.length+" item(s) transferred to review"+(result.skipped?"; "+result.skipped+" unreadable row(s) skipped. Add them manually.":".")+" No records were saved.");
}
function decorate(){
 const old=window.setupReceiptScanner;
 if(typeof old!=="function")return;
 window.setupReceiptScanner=function(){
  old();
  if($("rsChatGPT"))return;
  const controls=document.querySelector("#receiptScanner .rs-controls");
  if(!controls)return;
  const lang=document.createElement("label");lang.className="rs-language";lang.textContent="OCR language";
  const selector=document.createElement("select");selector.id="rsLanguages";
  selector.setAttribute("aria-label","OCR language");
  for(const [value,label] of [["mixed","Hindi + English"],["eng","English only"],["hin","Hindi only"]])selector.add(new Option(label,value));
  lang.append(selector);controls.prepend(lang);
  const details=document.createElement("details");details.id="rsChatGPT";details.className="rs-plus-assist";
  details.innerHTML=[
   '<summary>✦ Use ChatGPT Plus for handwritten Hindi receipts</summary>',
   '<div class="rs-plus-body">',
   '<p>For difficult handwriting, upload your receipt to your own ChatGPT conversation. Your wedding app does not upload photos to ChatGPT or connect to your ChatGPT account automatically.</p>',
   '<div class="rs-plus-actions"><button type="button" id="rsPromptButton" class="btn alt">1. Copy prompt</button><a class="btn alt" href="https://chatgpt.com/" target="_blank" rel="noopener noreferrer">2. Open ChatGPT</a></div>',
   '<textarea id="rsPromptCopy" hidden rows="5" aria-label="Copyable ChatGPT prompt"></textarea>',
   '<label for="rsAssistantJSON">3. Paste ChatGPT JSON result</label>',
   '<textarea id="rsAssistantJSON" rows="6" spellcheck="false" placeholder="Paste the JSON response with items, quantity, unit_price and total"></textarea>',
   '<button type="button" class="btn green" id="rsAssistantReview">Review extracted items</button>',
   '<p id="rsAssistStatus" role="status">Attach the receipt photo in ChatGPT first. All returned rows must be checked before saving.</p>',
   '</div>'
  ].join("");
  controls.after(details);
  $("rsPromptButton").onclick=copyPrompt;
  $("rsAssistantReview").onclick=importResponse;
 };
}
decorate();
window.receiptAssistantTest={parseAI,prompt};
})();