
(function(){
  if('serviceWorker'in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js',{scope:'/'}).catch(()=>{}))}
  function removeInstallUi(){document.getElementById('installApp')?.remove();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',removeInstallUi,{once:true});else removeInstallUi();

  const O={
    events:['Tilak','Matkor','Shadi','Bahubhoj','Khora Reception','Bihar functions','Wedding','Gifting','Multiple','Before wedding','2–6 Dec','Travel','Delhi → Bihar Travel','Post-Wedding','Common / General'],
    taskCategories:['Planning & Budget','Guests','Invitations','Shopping','Rituals','Food','Vendors','Home & Accommodation','Baraat & Transport','Delhi → Bihar Travel','Tilak','Matkor','Shadi','Bahubhoj','Khora Reception','Post-Wedding','Finance','Jewellery','Gifting','Baby','Medical & Emergency','Documents','Electricity & Water','Cleaning','Bride-side Coordination'],
    owners:['Pankaj','Mother','Bhabhi','Sister','Family','Pankaj / Family','Food Team','Transport Team','Accommodation Team','Bride-side Coordinator','Vendor Coordinator','Puja Coordinator','Cash / Payment Handler','Guest Coordinator','Groom-side Family','Driver / Transport Lead','Pandit','Photographer / Videographer','Caterer / Halwai','Reception Team'],
    priorities:['Critical','High','Medium','Low'],
    taskStatuses:['Pending','In Progress','Waiting on Vendor','Waiting on Family','Blocked','Done','Not Required'],
    expenseCategories:['Booked Vendors','Jewellery & Gifts','Clothing','Bihar Food','Rituals','Invitations','Operations','Miscellaneous','Khora Reception','Travel','Home & Accommodation','Medical & Emergency','Baby','Documents','Transport','Food & Catering','Decoration'],
    expenseStatuses:['Needs Estimate','Needs Confirmation','Estimated','Planned','Pending','Quoted','Negotiating','Booked','Advance Paid','Part-Paid','Paid','Partially Purchased','Purchased','Completed','Provisional','Buffer','Skipped','Cancelled'],
    vendorCategories:['Photography','Videography','Photography / Videography','Tent / Shamiana','Sound / DJ','Decoration','Jaymala / Fiber Set','Orchestra / Entertainment','Transport','Catering / Halwai','Sweets','Water Supply','Generator','Electrician','Flowers / Garland','Pandit / Puja','Accommodation / Bedding','Printing / Invitation','Tailor / Alteration','Makeup / Salon','Jewellery','Cleaning / Helpers','Other'],
    vendorStatuses:['Inquiry','Quoted','Negotiating','Booked','Advance Paid','Part-Paid','Completed','Paid in Full','Cancelled'],
    relations:['Bua','Fufa','Mama','Mami','Mausa','Mausi','Chacha','Chachi','Tau','Tai','Dada','Dadi','Nana','Nani','Brother','Sister','Bhabhi','Jija','Cousin','Family Friend','Neighbour','Bride-side Relative','Groom-side Relative','VIP / Elder','Other'],
    giftTypes:['Gifting saree','Good saree','Suit / Dress Material','Kurta-Pajama','Shawl','Gamcha','Shagun Envelope','Jewellery','Bangles / Accessories','Cosmetics / Toiletries','Footwear','Purse / Handbag','Suitcase','Sweet Box','Return Gift','Bride Gift','Parents Gift','Close-relative Gift','Other'],
    jewelleryRecipients:['Bride','Groom','Mother','Bhabhi','Sister','Bride Mother','Bride Father','Wedding / Shared','Other'],
    custody:['With Family Coordinator','With Mother','With Groom','With Bhabhi','Locked at Home','Bank Locker','Carried Personally','Bride-side Handover','Vendor / Jeweller','Not Set'],
    confirmationStatuses:['Confirmed','Needs Confirmation','Pending Verification','Not Required'],
    brideGiftStatuses:['Needs Estimate','Planned','To Buy','Purchased','Packed','Handed Over','Optional / Confirm','Confirm Custom','Not Required'],
    paymentTypes:['Cash withdrawal','Cash received','Shagun / Neg','Recorded payment','Vendor Advance','Vendor Balance','Shopping Payment','Emergency Spend','Refund / Return','Gift / Shagun Received'],
    paymentModes:['Cash','UPI','Credit Card','Debit Card','Bank Transfer','Cheque','Wallet','Unconfirmed'],
    contactRoles:['Groom','Bride','Bride-side Contact','Groom-side Contact','Pandit','Photographer / Videographer','Tent Vendor','Decorator','Sound Vendor','Orchestra / Entertainment','Transport Vendor','Halwai / Caterer','Sweet Vendor','Water Supplier','Generator / Electrician','Accommodation Lead','Food Lead','Transport Lead','Guest Coordinator','Cash / Payment Handler','Emergency Contact','Family Member','Other'],
    inventoryCategories:['Groom','Mother','Brothers','Bhabhi','Sister','Baby','Bride Gifts','Gifts','Jewellery','Puja','Home Décor','Documents','Medicines','Emergency','Food / Snacks','Electronics','Travel','Footwear','Cash / Shagun','Vendor Material','Other'],
    storageLocations:['Delhi Home','Car Cabin','Car Boot','Groom Bag','Jewellery Bag','Gift Bag / Box','Puja Bag','Baby Bag','Emergency Bag','Documents Folder','Family Suitcase','Bihar Home','Guest Room','Locked Cupboard','With Family Coordinator','With Mother','With Groom','Vendor / Local Purchase','Not Assigned'],
    inventoryStatuses:['Pending','In Progress','Bought','Packed','Loaded','At Bihar','Used / Handed Over','Returned','Not Required'],
    guestSides:['Groom','Bride','Local','Friend / Colleague','Vendor / Staff'],
    pickupTypes:['No Pickup Needed','Own Vehicle','Car Pickup','Auto / E-rickshaw','Railway Station Pickup','Bus Stand Pickup','Airport Pickup','Baraat Vehicle','Drop Only','Pickup + Drop','To Confirm'],
    roomStatuses:['Planned','Cleaning Pending','Ready','Reserved','Occupied','Full','Released / Free'],
    fittingStatuses:['Pending','Trial Pending','Alteration Needed','Ready','Done','N/A'],
    calendarTypes:['Leave','Travel','Function','Shopping','Payment Due','Vendor Follow-up','Guest Arrival','Work','Deadline','Puja / Ritual','Reception','Post-Wedding','Other'],
    calendarStatuses:['Confirmed','Planned','Needs Confirmation','Confirmed in leave draft','Tentative','Completed','Cancelled'],
    invitationLanguages:['Hindi','English','Hindi / English'],
    invitationStatuses:['Draft','Prepared','Needs Review','Needs Confirmation','Final Verified','Printed','Shared Digitally','Distributed','Reminder Sent','Not Required'],
    documentTypes:['Receipts','Invoice','Invitation','Ritual','Operations','Transport','Travel','Work','Guest List','Vendor Contract','Jewellery','Payment Proof','ID / KYC','Medical','Food / Menu','Accommodation','Photo / Scan','Other'],
    documentStatuses:['Pending','Collecting','Prepare','Prepared','Available','Needs Verification','Final Verified','Shared','Printed','Completed','Archived'],
    markets:['Nai Sarak / Maliwara','Gandhi Nagar','Kinari Bazaar','Sadar Bazaar','Chandni Chowk','Local Market','Bihar Local Purchase','Online','Already Bought','Not Applicable']
  };
  window.APP_OPTIONS=O;

  function addOptions(sel,options){
    if(!sel)return sel;
    const current=sel.value,existing=new Set([...sel.options].map(o=>o.value));
    options.filter(Boolean).forEach(v=>{if(!existing.has(v))sel.add(new Option(v,v))});
    if(current&&!existing.has(current))sel.add(new Option(current,current));
    if(current)sel.value=current;
    return sel;
  }
  function replaceWithSelect(el,options,blankLabel){
    if(!el)return null;
    if(el.tagName==='SELECT')return addOptions(el,options);
    const current=el.value||'',s=document.createElement('select');
    [...el.attributes].forEach(a=>{if(!['type','list','autocomplete','placeholder'].includes(a.name))s.setAttribute(a.name,a.value)});
    if(blankLabel)s.add(new Option(blankLabel,''));
    [...new Set(options.filter(Boolean))].forEach(v=>s.add(new Option(v,v)));
    if(current&&![...s.options].some(o=>o.value===current))s.add(new Option(current,current));
    s.value=current||'';
    el.replaceWith(s);return s;
  }
  function enhanceForms(){
    const p=location.pathname,one=(sel)=>document.querySelector(sel);
    if(p.endsWith('/tasks.html')){
      replaceWithSelect(one('#addTaskForm [name=category]'),O.taskCategories,'Select category');
      replaceWithSelect(one('#addTaskForm [name=owner]'),[...O.owners,'Other / Custom'],'Select owner');
      addOptions(one('#addTaskForm [name=priority]'),O.priorities);
    }
    if(p.endsWith('/expenses.html')){
      replaceWithSelect(one('#addExpenseForm [name=category]'),O.expenseCategories,'Select category');
      replaceWithSelect(one('#addExpenseForm [name=event]'),O.events,'Select event');
      replaceWithSelect(one('#addExpenseForm [name=status]'),O.expenseStatuses,'Select status');
    }
    if(p.endsWith('/vendors.html')){
      replaceWithSelect(one('#addVendorForm [name=category]'),O.vendorCategories,'Select category');
      replaceWithSelect(one('#addVendorForm [name=event]'),O.events,'Select event');
    }
    if(p.endsWith('/gifts.html')){
      replaceWithSelect(one('#giftForm [name=relation]'),O.relations,'Select relation');
      replaceWithSelect(one('#giftForm [name=gift]'),O.giftTypes,'Select gift');
      replaceWithSelect(one('#jewelForm [name=recipient]'),O.jewelleryRecipients,'Select recipient');
    }
    if(p.endsWith('/payments.html')){
      addOptions(one('#paymentForm [name=type]'),O.paymentTypes);addOptions(one('#paymentForm [name=mode]'),O.paymentModes);
    }
    if(p.endsWith('/contacts.html'))replaceWithSelect(one('#contactForm [name=role]'),O.contactRoles,'Select role');
    if(p.endsWith('/inventory.html')){
      replaceWithSelect(one('#inventoryForm [name=category]'),O.inventoryCategories,'Select category');
      replaceWithSelect(one('#inventoryForm [name=location]'),O.storageLocations,'Select location');
    }
    if(p.endsWith('/guests.html')){
      addOptions(one('#addGuestForm [name=side]'),O.guestSides);
      const rooms=(state?.data?.rooms||[]).map(r=>r.name);replaceWithSelect(one('#addGuestForm [name=room]'),rooms,'Not assigned');
      replaceWithSelect(one('#addGuestForm [name=transport]'),O.pickupTypes,'Select transport');
      addOptions(one('#addRoomForm [name=status]'),O.roomStatuses);
    }
    if(p.endsWith('/calendar.html'))replaceWithSelect(one('#calendarForm [name=type]'),O.calendarTypes,'Select type');
    if(p.endsWith('/documents.html')){
      replaceWithSelect(one('#docForm [name=type]'),O.documentTypes,'Select type');
      replaceWithSelect(one('#docForm [name=status]'),O.documentStatuses,'Select status');
    }
    if(p.endsWith('/diary.html'))replaceWithSelect(one('#memoryForm [name=event]'),O.events,'Select event');
    if(p.endsWith('/media.html'))replaceWithSelect(one('#mediaEvent'),O.events,'Select event');
  }
  function wrap(name,after){
    const orig=window[name];if(typeof orig!=='function'||orig.__dropdownWrapped)return;
    const fn=function(){const r=orig.apply(this,arguments);after();return r};fn.__dropdownWrapped=true;window[name]=fn;
  }
  function enhanceTasks(){enhanceForms()}
  function enhanceExpenses(){enhanceForms()}
  function enhanceVendors(){enhanceForms()}
  function enhanceShopping(){document.querySelectorAll('#clothingBody select[data-fit]').forEach(s=>addOptions(s,O.fittingStatuses))}
  function enhanceGuests(){enhanceForms();document.querySelectorAll('#roomBody select[data-k=status]').forEach(s=>addOptions(s,O.roomStatuses))}
  function enhanceGifts(){enhanceForms()}
  function enhancePayments(){enhanceForms()}
  function enhanceContacts(){enhanceForms()}
  function enhanceInventory(){enhanceForms()}
  function enhanceEvents(){}
  function enhanceCalendar(){enhanceForms()}
  function enhanceInvites(){}
  function enhanceDocuments(){enhanceForms()}
  function enhanceFamilyClothing(){document.querySelectorAll('#clothingBody select[data-fit]').forEach(s=>addOptions(s,O.fittingStatuses))}
  wrap('renderTasks',enhanceTasks);
  wrap('renderExpenses',enhanceExpenses);
  wrap('renderVendors',enhanceVendors);
  wrap('renderShopping',()=>{enhanceShopping();enhanceFamilyClothing()});
  wrap('renderFamilyClothing',enhanceFamilyClothing);
  wrap('renderGuests',enhanceGuests);
  wrap('renderRooms',enhanceGuests);
  wrap('renderGifts',enhanceGifts);
  wrap('renderGiftingDirectory',enhanceGifts);
  wrap('renderJewellery',enhanceGifts);
  wrap('renderBrideGifts',enhanceGifts);
  wrap('renderPayments',enhancePayments);
  wrap('renderContacts',enhanceContacts);
  wrap('renderInventory',enhanceInventory);
  wrap('renderEvents',enhanceEvents);
  wrap('renderCalendar',enhanceCalendar);
  wrap('renderDocuments',enhanceDocuments);

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enhanceForms,{once:true});else enhanceForms();
})();
(function(){
 function addMemoryNav(){
  const nav=document.querySelector('.nav');if(!nav)return;
  const docs=[...nav.querySelectorAll('a')].find(a=>a.getAttribute('href')==='/documents.html');
  if(docs&&!nav.querySelector('a[href="/media.html"]')){const m=document.createElement('a');m.href='/media.html';m.textContent='Media';docs.before(m)}
  if(docs&&!nav.querySelector('a[href="/diary.html"]')){const d=document.createElement('a');d.href='/diary.html';d.textContent='Memories';docs.before(d)}
  const brand=document.querySelector('.brand>div:last-child');if(brand){const b=brand.querySelector('b'),s=brand.querySelector('small');if(b)b.textContent='Pankaj & Neetu Wedding';if(s)s.textContent='Planner • Evidence • Memory Diary'}
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',addMemoryNav);else addMemoryNav();
})();

(function(){function x(){document.querySelectorAll('a[href="/invitations.html"],a[href="invitations.html"]').forEach(a=>a.remove())}document.readyState==='loading'?document.addEventListener('DOMContentLoaded',x,{once:true}):x()})();


(function(){
  let exportTimer=null,activeExport=null;

  function cleanExportText(v){
    return String(v??'').replace(/\u00a0/g,' ').replace(/\s+/g,' ').trim();
  }
  function htmlEscape(v){
    return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function csvEscape(v){
    const s=String(v??'');
    return /[",\r\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;
  }
  function visibleRows(table){
    return [...table.querySelectorAll('tbody tr')].filter(tr=>{
      if(tr.hidden)return false;
      const st=getComputedStyle(tr);
      return st.display!=='none'&&st.visibility!=='hidden';
    });
  }
  function cellValue(cell){
    const controls=[...cell.querySelectorAll('input,select,textarea')].filter(x=>x.type!=='button'&&x.type!=='submit');
    if(controls.length){
      return controls.map(x=>{
        if(x.type==='checkbox')return x.checked?'Yes':'No';
        if(x.tagName==='SELECT'){
          const o=x.options[x.selectedIndex];
          return cleanExportText(o?o.text:x.value);
        }
        return cleanExportText(x.value);
      }).join(' | ');
    }
    const clone=cell.cloneNode(true);
    clone.querySelectorAll('button,.btn,.action-button,[data-row-actions]').forEach(x=>x.remove());
    return cleanExportText(clone.textContent);
  }
  function tableTitle(table,index){
    const wrap=table.closest('.table-wrap')||table;
    let el=wrap.previousElementSibling;
    for(let i=0;el&&i<5;i++,el=el.previousElementSibling){
      const h=el.matches?.('h1,h2,h3')?el:el.querySelector?.('h1,h2,h3');
      if(h&&cleanExportText(h.textContent))return cleanExportText(h.textContent);
    }
    const page=cleanExportText(document.querySelector('main h1')?.textContent||document.title||location.pathname.split('/').pop().replace('.html','')||'Wedding Planner');
    return document.querySelectorAll('table').length>1?page+' Table '+(index+1):page;
  }
  function safeFilename(v){
    return cleanExportText(v).replace(/[^\w\- ]+/g,'').replace(/\s+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'').toLowerCase()||'wedding-data';
  }
  function tableData(table,index){
    const headers=[...table.querySelectorAll('thead th')];
    const keep=headers.map((th,i)=>({i,label:cleanExportText(th.textContent)}))
      .filter(x=>x.label.toLowerCase()!=='actions');
    const rows=visibleRows(table).map(tr=>{
      const cells=[...tr.children];
      return keep.map(x=>cells[x.i]?cellValue(cells[x.i]):'');
    });
    return {title:tableTitle(table,index),headers:keep.map(x=>x.label),rows};
  }
  function downloadBlob(content,type,filename){
    const blob=content instanceof Blob?content:new Blob([content],{type});
    const url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1200);
  }
  function exportCSV(data){
    const lines=[data.headers.map(csvEscape).join(',')];
    data.rows.forEach(r=>lines.push(r.map(csvEscape).join(',')));
    downloadBlob('\uFEFF'+lines.join('\r\n'),'text/csv;charset=utf-8',safeFilename(data.title)+'-'+new Date().toISOString().slice(0,10)+'.csv');
  }
  function htmlTable(data){
    return '<table><thead><tr>'+data.headers.map(h=>'<th>'+htmlEscape(h)+'</th>').join('')+'</tr></thead><tbody>'+
      data.rows.map(r=>'<tr>'+r.map(v=>'<td>'+htmlEscape(v)+'</td>').join('')+'</tr>').join('')+
      '</tbody></table>';
  }
  function exportExcel(data){
    const html='<!doctype html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"><style>table{border-collapse:collapse}th,td{border:1px solid #999;padding:6px 8px}th{font-weight:bold;background:#eee}</style></head><body><h2>'+htmlEscape(data.title)+'</h2>'+htmlTable(data)+'</body></html>';
    downloadBlob('\uFEFF'+html,'application/vnd.ms-excel;charset=utf-8',safeFilename(data.title)+'-'+new Date().toISOString().slice(0,10)+'.xls');
  }
  function exportWord(data){
    const html='<!doctype html><html><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif}table{border-collapse:collapse;width:100%}th,td{border:1px solid #999;padding:7px}th{background:#eee}</style></head><body><h2>'+htmlEscape(data.title)+'</h2>'+htmlTable(data)+'</body></html>';
    downloadBlob('\uFEFF'+html,'application/msword;charset=utf-8',safeFilename(data.title)+'-'+new Date().toISOString().slice(0,10)+'.doc');
  }
  function exportJSON(data){
    const arr=data.rows.map(row=>Object.fromEntries(data.headers.map((h,i)=>[h,row[i]??''])));
    downloadBlob(JSON.stringify({title:data.title,exportedAt:new Date().toISOString(),rows:arr},null,2),'application/json;charset=utf-8',safeFilename(data.title)+'-'+new Date().toISOString().slice(0,10)+'.json');
  }
  function exportPrint(data){
    const w=window.open('','_blank');
    if(!w){alert('Please allow pop-ups to print or save as PDF.');return}
    w.document.write('<!doctype html><html><head><title>'+htmlEscape(data.title)+'</title><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;padding:24px;color:#222}h1{font-size:20px}p{font-size:11px;color:#666}table{border-collapse:collapse;width:100%;font-size:11px}th,td{border:1px solid #bbb;padding:6px;vertical-align:top}th{background:#eee;text-align:left}@page{size:landscape;margin:12mm}</style></head><body><h1>'+htmlEscape(data.title)+'</h1><p>Exported '+new Date().toLocaleString()+'</p>'+htmlTable(data)+'</body></html>');
    w.document.close();
    w.focus();
    setTimeout(()=>w.print(),250);
  }

  function ensureExportDialog(){
    let overlay=document.getElementById('tableExportDialog');
    if(overlay)return overlay;
    overlay=document.createElement('div');
    overlay.id='tableExportDialog';
    overlay.className='export-format-backdrop';
    overlay.innerHTML='<div class="export-format-dialog" role="dialog" aria-modal="true" aria-labelledby="exportFormatTitle">'+
      '<div class="export-format-head"><div><h3 id="exportFormatTitle">Export table</h3><p data-export-subtitle>Select a file format</p></div><button type="button" class="export-format-close" aria-label="Close">×</button></div>'+
      '<div class="export-format-grid">'+
        '<button type="button" data-format="csv"><b>CSV</b><span>Spreadsheet / universal</span></button>'+
        '<button type="button" data-format="excel"><b>Excel</b><span>.xls spreadsheet</span></button>'+
        '<button type="button" data-format="word"><b>Word</b><span>.doc document</span></button>'+
        '<button type="button" data-format="json"><b>JSON</b><span>Structured data</span></button>'+
        '<button type="button" data-format="pdf"><b>PDF</b><span>Print / Save as PDF</span></button>'+
      '</div>'+
    '</div>';
    document.body.appendChild(overlay);
    const close=()=>{overlay.classList.remove('open');activeExport=null};
    overlay.querySelector('.export-format-close').onclick=close;
    overlay.addEventListener('click',e=>{if(e.target===overlay)close()});
    overlay.querySelectorAll('[data-format]').forEach(btn=>btn.addEventListener('click',()=>{
      if(!activeExport)return;
      const data=activeExport.data,fmt=btn.dataset.format;
      if(fmt==='csv')exportCSV(data);
      else if(fmt==='excel')exportExcel(data);
      else if(fmt==='word')exportWord(data);
      else if(fmt==='json')exportJSON(data);
      else if(fmt==='pdf')exportPrint(data);
      const n=data.rows.length;
      close();
      if(window.toast)toast('Exported '+n+' row'+(n===1?'':'s')+' as '+fmt.toUpperCase());
    }));
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&overlay.classList.contains('open'))close()});
    return overlay;
  }

  function openExportChooser(table,index){
    const data=tableData(table,index);
    if(!data.headers.length){alert('This table has no exportable columns.');return}
    activeExport={table,index,data};
    const overlay=ensureExportDialog();
    overlay.querySelector('[data-export-subtitle]').textContent=data.title+' • '+data.rows.length+' visible row'+(data.rows.length===1?'':'s');
    overlay.classList.add('open');
  }

  function attachTableExport(table,index){
    if(table.dataset.exportReady==='1')return;
    table.dataset.exportReady='1';
    const anchor=table.closest('.table-wrap')||table,bar=document.createElement('div'),meta=document.createElement('span'),button=document.createElement('button');
    bar.className='table-export-bar';bar.dataset.tableExport='1';meta.className='table-export-meta';
    button.type='button';button.className='btn alt table-export-button';button.innerHTML='<span aria-hidden="true">⇩</span> Export';
    button.addEventListener('click',()=>openExportChooser(table,index));
    const update=()=>{const n=visibleRows(table).length;meta.textContent=n+' visible row'+(n===1?'':'s')};
    bar.append(meta,button);anchor.parentNode.insertBefore(bar,anchor);update();
    new MutationObserver(update).observe(table,{childList:true,subtree:true,attributes:true,attributeFilter:['style','hidden','class']});
    table.addEventListener('change',update);
  }
  function installTableExports(){
    [...document.querySelectorAll('table')].forEach((table,index)=>attachTableExport(table,index));
  }
  function scheduleExports(){
    clearTimeout(exportTimer);
    exportTimer=setTimeout(installTableExports,50);
  }
  new MutationObserver(scheduleExports).observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installTableExports,{once:true});
  else installTableExports();
})();

(function(){
 function add(){const n=document.querySelector('.nav');if(!n||n.querySelector('a[href="/finance.html"]'))return;
 const a=document.createElement('a');a.href='/finance.html';a.textContent='Financial Integrity';
 const target=n.querySelector('a[href="/payments.html"]');if(target)target.after(a);else n.append(a)}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',add);else add();
})();


/* Wedding Studio navigation & page composition: no business data changes. */
(function(){
'use strict';
const paths=[
 ["WORKSPACE",[["Dashboard","/","home"],["Tasks","/tasks.html","check"],["Calendar","/calendar.html","cal"],["Functions","/events.html","star"]]],
 ["FINANCE & SUPPLIERS",[["Expenses","/expenses.html","wallet"],["Financial Integrity","/finance.html","shield"],["Vendors","/vendors.html","shop"],["Shopping","/shopping.html","bag"],["Cash & Payments","/payments.html","receipt"],["Gifts","/gifts.html","gift"],["Inventory","/inventory.html","box"],["Food & Catering","/food.html","food"]]],
 ["PEOPLE & LOGISTICS",[["Guests & Rooms","/guests.html","people"],["Contacts","/contacts.html","contact"],["Travel","/travel.html","train"],["Invitations","/invitations.html","mail"]]],
 ["MEMORIES & RECORDS",[["Media Library","/media.html","image"],["Memory Diary","/diary.html","book"],["Documents","/documents.html","file"],["History","/history.html","history"],["Settings","/settings.html","settings"]]]
];
const pages={
 "": ["Wedding overview","Your celebrations, tasks, finances and memories in one organized space.","Add a memory","/diary.html","OVERVIEW"],
 "tasks.html":["Tasks & priorities","Preparation checklists, owners and upcoming deadlines.","View calendar","/calendar.html","OPERATIONS"],
 "expenses.html":["Expense planning","Understand budgets, commitments, spending and remaining amounts.","Financial integrity","/finance.html","FINANCE"],
 "finance.html":["Financial integrity","Reconcile payments, review discrepancies and record transactions.","Payments","/payments.html","FINANCE"],
 "vendors.html":["Vendor management","Bookings, contacts, delivery commitments and vendor balances.","Expenses","/expenses.html","OPERATIONS"],
 "shopping.html":["Shopping & purchases","Track planned and completed purchases, suppliers and evidence.","Inventory","/inventory.html","OPERATIONS"],
 "gifts.html":["Gifts & handovers","Plan and track gifts, recipients and distribution.","Shopping","/shopping.html","OPERATIONS"],
 "payments.html":["Cash & payments","Payment entries, advances, refunds and cash records.","Integrity report","/finance.html","FINANCE"],
 "contacts.html":["People & contacts","A central directory of family members and wedding vendors.","Guests","/guests.html","PEOPLE"],
 "guests.html":["Guests & accommodation","Manage arrivals, households, rooms and guest records.","Contacts","/contacts.html","PEOPLE"],
 "inventory.html":["Inventory & packing","Supplies, packing lists and responsibilities in one place.","Shopping","/shopping.html","OPERATIONS"],
 "food.html":["Food & catering","Menus and meal arrangements across wedding ceremonies.","Guests","/guests.html","OPERATIONS"],
 "events.html":["Functions & rituals","Timelines, celebrations and responsibilities for each event.","Calendar","/calendar.html","EVENTS"],
 "calendar.html":["Wedding calendar","Important dates, deadlines and ceremony schedules.","Tasks","/tasks.html","EVENTS"],
 "invitations.html":["Invitations","Invitation progress, versions and delivery confirmation.","Guest list","/guests.html","EVENTS"],
 "travel.html":["Travel & bookings","Train tickets, passengers, journeys and transportation evidence.","Documents","/documents.html","LOGISTICS"],
 "media.html":["Photos & evidence","Your real images, receipts and attached PDFs in one library.","Memory diary","/diary.html","MEMORIES"],
 "diary.html":["Wedding memory diary","Capture the people, moments and stories you want to keep.","Media library","/media.html","MEMORIES"],
 "documents.html":["Document vault","Receipts, confirmations and important wedding documents.","Media library","/media.html","RECORDS"],
 "history.html":["Activity history","A trace of important wedding planning changes.","Settings","/settings.html","RECORDS"],
 "settings.html":["Workspace settings","Backups, cloud synchronization, privacy and recovery.","Dashboard","/","SYSTEM"]
};
const icons={
 home:'<rect x="3" y="3" width="8" height="8" rx="1.4"/><rect x="13" y="3" width="8" height="5" rx="1.4"/><rect x="13" y="10" width="8" height="11" rx="1.4"/><rect x="3" y="13" width="8" height="8" rx="1.4"/>',
 check:'<path d="M8 3h12v18H4V3h2M8 11l3 3 5-5M8 3v3h8V3z"/>',
 cal:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/>',
 star:'<path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5L12 2z"/>',
 wallet:'<rect x="3" y="6" width="18" height="15" rx="2"/><path d="M3 10h18M16 15h2M6 6V4h12"/>',
 shield:'<path d="M12 2 20 6v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6l8-4zM9 12l2 2 4-4"/>',
 shop:'<path d="M3 10h18l-2-6H5l-2 6zM5 10v11h14V10M9 21v-7h6v7"/>',
 bag:'<path d="M4 8h16l-1 13H5L4 8zM9 9V6a3 3 0 0 1 6 0v3"/>',
 receipt:'<path d="M5 3h14v19l-3-2-4 2-4-2-3 2V3zM8 8h8M8 12h8M8 16h4"/>',
 gift:'<rect x="3" y="9" width="18" height="12" rx="1"/><path d="M12 9v12M3 13h18M12 9H6a3 3 0 1 1 3-3c0 2 3 3 3 3zm0 0h6a3 3 0 1 0-3-3c0 2-3 3-3 3z"/>',
 box:'<path d="M3 7 12 2l9 5v10l-9 5-9-5V7zM3 7l9 5 9-5M12 12v10"/>',
 food:'<path d="M4 2v8a4 4 0 0 0 8 0V2M8 2v20M19 2c-4 4-4 9 0 11v9"/>',
 people:'<circle cx="9" cy="8" r="3"/><path d="M3 21v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6M18 16a5 5 0 0 1 3 5"/>',
 contact:'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="12" cy="9" r="3"/><path d="M7 18c0-3 2-5 5-5s5 2 5 5"/>',
 train:'<rect x="5" y="3" width="14" height="15" rx="3"/><path d="M5 10h14M8 18l-2 4M16 18l2 4M8 22h8"/><circle cx="9" cy="15" r="1"/><circle cx="15" cy="15" r="1"/>',
 mail:'<rect x="2" y="5" width="20" height="14" rx="2"/><path d="m3 7 9 7 9-7"/>',
 image:'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8" cy="8" r="2"/><path d="m4 18 5-5 4 4 3-3 4 4"/>',
 book:'<path d="M12 6c-3-3-6-3-10-2v15c4-1 7-1 10 2 3-3 6-3 10-2V4c-4-1-7-1-10 2zM12 6v15"/>',
 file:'<path d="M6 2h8l5 5v15H6V2zM14 2v6h5M9 13h7M9 17h7"/>',
 history:'<path d="M3 12a9 9 0 1 0 3-7M3 3v6h6M12 7v5l3 2"/>',
 settings:'<circle cx="12" cy="12" r="3"/><path d="M10 2h4l1 3 3 1 3-1 2 4-2 2v3l2 2-2 4-3-1-3 1-1 3h-4l-1-3-3-1-3 1-2-4 2-2v-3L1 9l2-4 3 1 3-1 1-3z"/>',
 menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',
 close:'<path d="M6 6l12 12M18 6 6 18"/>',
 arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>'
};
function icon(name){return '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+(icons[name]||icons.file)+'</svg>'}
function init(){
 const top=document.querySelector('.top'),head=top?.querySelector('.header'),nav=top?.querySelector('.nav'),main=document.querySelector('main.wrap');
 if(!top||!head||!nav||!main||document.body.classList.contains('wedding-studio'))return;
 document.body.classList.add('wedding-studio');
 let route=location.pathname.split('/').pop()||'';if(route==='index.html')route='';
 const page=pages[route]||pages[''];
 const brand=head.querySelector('.brand');
 if(brand){let bold=brand.querySelector('b'),small=brand.querySelector('small');if(bold)bold.textContent='Pankaj ki Shadi';if(small)small.textContent='Wedding workspace'}
 nav.setAttribute('aria-label','Main navigation');
 nav.innerHTML=paths.map(([group,links])=>'<span class="studio-group">'+group+'</span>'+links.map(([text,url,shape])=>{const r=url==='/'?'':url.slice(1),active=r===route;return '<a href="'+url+'"'+(active?' class="active" aria-current="page"':'')+'>'+icon(shape)+'<span>'+text+'</span></a>'}).join('')).join('');
 const foot=document.createElement('div');foot.className='studio-sidebar-foot';foot.innerHTML='<i class="studio-status-dot" aria-hidden="true"></i><span>5 December 2026 · Wedding workspace</span>';top.appendChild(foot);
 const menu=document.createElement('button');menu.className='studio-menu-btn';menu.type='button';menu.setAttribute('aria-label','Open navigation');menu.setAttribute('aria-expanded','false');menu.innerHTML=icon('menu');head.appendChild(menu);
 const scrim=document.createElement('div');scrim.className='studio-scrim';document.body.append(scrim);
 const close=document.createElement('button');close.type='button';close.className='studio-close-btn';close.setAttribute('aria-label','Close navigation');close.innerHTML=icon('close');document.body.append(close);
 const toggle=open=>{let active=typeof open==='boolean'?open:!document.body.classList.contains('studio-open');document.body.classList.toggle('studio-open',active);menu.setAttribute('aria-expanded',String(active));if(active)close.focus({preventScroll:true});else menu.focus({preventScroll:true})};
 menu.addEventListener('click',()=>toggle());scrim.addEventListener('click',()=>toggle(false));close.addEventListener('click',()=>toggle(false));
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.body.classList.contains('studio-open'))toggle(false)});
 const introduction=document.createElement('section');introduction.className='studio-intro';introduction.innerHTML='<div><div class="studio-overline">'+page[4]+' / PANKAJ & NEETU</div><h1>'+page[0]+'</h1><p>'+page[1]+'</p></div><a class="studio-action" href="'+page[3]+'">'+page[2]+icon('arrow')+'</a>';
 main.prepend(introduction);
 const bottom=document.createElement('nav');bottom.className='studio-bottom-bar';bottom.setAttribute('aria-label','Mobile primary navigation');
 const quick=[['Home','/','home'],['Tasks','/tasks.html','check'],['Expenses','/expenses.html','wallet'],['Memories','/diary.html','book']];
 bottom.innerHTML=quick.map(([label,url,shape])=>{const r=url==='/'?'':url.slice(1),active=r===route;return '<a href="'+url+'"'+(active?' class="active" aria-current="page"':'')+'>'+icon(shape)+'<span>'+label+'</span></a>'}).join('');
 const more=document.createElement('button');more.type='button';more.setAttribute('aria-label','More sections');more.innerHTML=icon('menu')+'<span>More</span>';more.addEventListener('click',()=>toggle(true));
 if(!quick.some(x=>(x[1]==='/'?'':x[1].slice(1))===route))more.classList.add('active');
 bottom.append(more);document.body.append(bottom);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();


/* Integer count policy v75: enforce UI and events without coercing stored history. */
(function(){
 "use strict";
 const countNames=new Set(["targetQty","completedQty","quantity","qty","required","bought","packed","loaded",
  "capacity","mattresses","blankets","people","breakfast","lunch","tea","dinner","guests",
  "guestCount","guestcount","headcount","count","adults","children","members"]);
 const dataCounts=new Set(["targetQty","completedQty","quantity","required","bought","packed","loaded",
  "capacity","mattresses","blankets","people","breakfast","lunch","tea","dinner","count"]);
 function isCount(el){
  if(!el||el.tagName!=="INPUT"||el.type!=="number")return false;
  if(el.hasAttribute("data-food-count")||el.hasAttribute("data-q"))return true;
  if(el.dataset.field==="quantity"||el.dataset.actionField==="targetQty"||el.dataset.actionField==="completedQty")return true;
  if(countNames.has(el.name)||dataCounts.has(el.dataset.k)||dataCounts.has(el.dataset.actionField))return true;
  return false;
 }
 function apply(el){
  if(!isCount(el))return;
  el.step="1";el.inputMode="numeric";
  const min=el.name==="quantity"||el.dataset.field==="quantity"?1:0;
  el.min=String(min);el.dataset.integerQuantity="1";
  if(!el.title)el.title="Whole numbers only (increment 1; no decimal point)";
 }
 function valid(el){
  const value=el.value.trim();
  if(!value)return !el.required;
  const n=Number(value);
  return Number.isSafeInteger(n)&&n>=Number(el.min||0);
 }
 function notify(el){
  const message="Quantity must be a whole number (0, 1, 2, 3…) with increments of 1; decimal points are not accepted.";
  el.setCustomValidity(message);
  el.reportValidity();
 }
 document.addEventListener("focusin",e=>apply(e.target),true);
 document.addEventListener("beforeinput",e=>{
  if(!isCount(e.target))return;
  if(e.data&&/[.,eE]/.test(e.data))e.preventDefault();
 },true);
 document.addEventListener("keydown",e=>{
  if(isCount(e.target)&&[".",",","e","E"].includes(e.key))e.preventDefault();
 },true);
 document.addEventListener("input",e=>{
  const el=e.target;if(!isCount(el))return;
  apply(el);el.setCustomValidity(valid(el)?"":"Quantity must be a whole number; decimals are not allowed.");
 },true);
 document.addEventListener("change",e=>{
  const el=e.target;if(!isCount(el))return;
  apply(el);
  if(!valid(el)){e.preventDefault();e.stopImmediatePropagation();notify(el)}
  else el.setCustomValidity("");
 },true);
 document.addEventListener("submit",e=>{
  const form=e.target;
  if(!form?.querySelectorAll)return;
  for(const el of form.querySelectorAll('input[type="number"]')){
   if(!isCount(el))continue;
   apply(el);
   if(!valid(el)){e.preventDefault();e.stopImmediatePropagation();notify(el);return}
  }
 },true);
 function init(){
  document.querySelectorAll('input[type="number"]').forEach(apply);
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
 else init();
 window.quantityIntegerPolicy={isCount,valid,apply};
})();

;(()=>{const src=document.createElement('script');src.src='/reminder-center.js';src.async=true;document.head.appendChild(src);})();


/* Mobile feature discovery and non-destructive PWA update check v81.
 * Never clears WebView cookies, IndexedDB, localStorage, or evidence storage. */
;(() => {
  function mount() {
    const nav=document.querySelector('.nav');
    if(!nav) return;
    if(!nav.querySelector('a[href="/family-checklist.html"]')){
      const shopping=[...nav.querySelectorAll('a')].find(a=>a.getAttribute('href')==='/shopping.html');
      const link=document.createElement('a');
      link.href='/family-checklist.html';link.textContent='Family Checklist';
      if(location.pathname==='/family-checklist.html')link.classList.add('active');
      if(shopping)shopping.after(link);else nav.append(link);
    }
    if(!document.getElementById('safeUpdateApp')){
      const button=document.createElement('button');
      button.id='safeUpdateApp';button.type='button';button.textContent='Check updates';
      button.className='pwa-install';
      button.hidden=false;
      button.style.display='inline-flex';button.style.alignItems='center';button.style.justifyContent='center';
      button.setAttribute('aria-label','Check for latest app features');
      button.addEventListener('click', async () => {
        if(!navigator.onLine){alert('Connect to the internet before checking for new features.');return}
        button.disabled=true;button.textContent='Checking…';
        try{
          if('serviceWorker' in navigator){
            const reg=await navigator.serviceWorker.getRegistration('/');
            if(reg)await reg.update();
            await navigator.serviceWorker.ready;
          }
          const check=await fetch('/family-checklist.js?v='+Date.now(),{cache:'no-store'});
          if(!check.ok)throw new Error('Latest files not available: '+check.status);
          const url=new URL(location.href);
          url.searchParams.set('appUpdated',String(Date.now()));
          location.replace(url.href);
        }catch(err){
          button.disabled=false;button.textContent='Check updates';
          alert('Could not refresh the app: '+(err.message||err)+'. Check your internet connection.');
        }
      });
      nav.appendChild(button);
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});
  else mount();
})();
