
const DBNAME='PankajWeddingManager',STORE='state',MEDIASTORE='media',VERSION=3;let state=null,dbMode='IndexedDB';

const SHOP_LINK={'s-1':'saree33','s-2':'groomWedding','s-3':'groomOther','s-4':'mother','s-5':'brothers','s-bhabhi':'bhabhi','s-sister':'sister','s-baby':'babyClothes','s-7':'footwear','s-8':'groomAccessories','s-9':'giftPacking','s-10':'homeDecor'};
const VENDOR_LINK={'v-video':'video','v-jay1':'jay1','v-jay2':'jay2','v-tent':'tent','v-orch':'orchestra','v-trans':'transport'};

function clone(x){return JSON.parse(JSON.stringify(x))}
function money(n){return new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(Number(n)||0)}
function uid(p){return p+'-'+Date.now()+'-'+Math.random().toString(36).slice(2,7)}
function initial(){return{data:clone(window.DEFAULT_DATA),checks:{},meta:{updatedAt:null,schemaVersion:10}}}
function openDB(){return new Promise(res=>{if(!('indexedDB'in window)){dbMode='LocalStorage';res(null);return}const r=indexedDB.open(DBNAME,VERSION);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(STORE))r.result.createObjectStore(STORE);if(!r.result.objectStoreNames.contains(MEDIASTORE))r.result.createObjectStore(MEDIASTORE);if(!r.result.objectStoreNames.contains('snapshots'))r.result.createObjectStore('snapshots')};r.onsuccess=()=>res(r.result);r.onerror=()=>{dbMode='LocalStorage';res(null)}})}
async function save(msg='Saved',touch=true){state.meta=state.meta||{};linkReconcile();sareePolicy();if(touch)state.meta.updatedAt=new Date().toISOString();const db=await openDB();if(db){await new Promise(resolve=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(state,'state');tx.oncomplete=resolve;tx.onerror=resolve})}else localStorage.setItem(DBNAME,JSON.stringify(state));if(msg)toast(msg)}
function toast(m){const t=document.querySelector('.toast');if(!t)return;t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1200)}
function setDb(){document.querySelectorAll('[data-db]').forEach(x=>x.textContent=dbMode+' • state retained')}
function expenseById(id){return state.data.expenses.find(x=>x.id===id)}
function audit(module,record,field,oldVal,newVal,note=''){if(String(oldVal)===String(newVal))return;state.data.history=state.data.history||[];state.data.history.unshift({id:uid('h'),at:new Date().toISOString(),module,record,field,oldValue:oldVal,newValue:newVal,note});if(state.data.history.length>500)state.data.history.length=500}
function setField(obj,key,val,module,record,note=''){const old=obj[key];obj[key]=val;audit(module,record,key,old,val,note)}

const TASK_GROUPS=[
['Planning & Budget','2026-11-05','Family','High',['Review ₹11L hard budget cap and category allocations','Confirm jewellery bill final amount and payment status','Review every booked vendor total, advance and balance','Create wedding payment calendar by due date','Keep ₹50,000 emergency reserve separate','Assign family owner for food / ration','Assign family owner for tent / electricity / water','Assign family owner for accommodation / guest rooms','Assign family owner for bride-side coordination','Prepare master wedding contact list']],
['Guests','2026-11-20','Family','High',['Prepare groom-side guest list','Mark outstation guests separately','Identify elderly guests needing easier room access','Identify families needing pickup / drop','Finalize Tilak guest estimate','Finalize Shadi / baraat headcount','Finalize Bahubhoj guest estimate','Prepare Khora reception guest list','Confirm room / bedding requirement','Reconfirm arrival date with key outstation relatives']],
['Invitations','2026-11-15','Family','High',['Verify invitation names, dates and phone numbers','Finalize printed invitation quantity','Complete invitation card printing','Prepare envelopes and recipient names','Distribute local wedding cards','Courier cards to outstation relatives','Share digital invitation','Send reminder message to important guests','Prepare Khora reception invitation list / message','Verify reception date on every invitation version']],
['Shopping','2026-11-15','Family','High',['Complete gifting sarees purchase','Finalize groom wedding outfit','Finalize groom Tilak outfit','Finalize groom Matkor outfit','Finalize groom Bahubhoj outfit','Finalize groom reception outfit','Buy groom wedding footwear / mojari','Buy sehra, kalgi, safa and groom accessories','Complete Mother outfits shopping','Complete brothers / male family shopping','Complete Bhabhi outfits shopping','Complete Sister outfits shopping','Complete Baby outfits shopping','Check alterations / fitting','Buy winter shawls / warm layers','Finalize bride gifting clothes and accessories','Buy gift bags / saree bags / trays / wrapping','Buy shagun envelopes','Buy home decoration items for Bihar','Buy medicines / emergency tailoring / toiletries','Prepare luggage tags, locks and garment covers','Pack gifting sarees person-wise']],
['Rituals','2026-12-01','Family','High',['Get final puja-samagri list from Pandit','Separate ritual items to buy in Delhi vs Bihar','Buy reusable puja items / decorative thalis','Arrange Tilak thali, roli, rice, sweets and shagun','Arrange Matkor earthen pots / soop / local ritual items','Arrange wedding havan, janeu, mauli, sindoor and ritual cloth','Arrange bride griha-pravesh items','Assign one person to keep all puja material together']],
['Food','2026-11-28','Food Team','High',['Finalize food budget within ₹2.25L cap','Confirm halwai / cooking labour','Finalize Tilak menu','Finalize Matkor food / tea plan','Finalize Shadi / baraat menu','Finalize Bahubhoj menu','Prepare ration quantity list','Arrange dry ration in Bihar','Book fresh vegetable / paneer supply','Book milk / curd supply','Order sweets event-wise','Arrange tea / biscuits / namkeen','Arrange drinking water jars / bottles','Confirm disposables or caterer supply','Confirm serving staff and timings','Check LPG / cooking fuel and utensils','Plan leftover food handling']],
['Vendors','2026-11-25','Family','High',['Verify videography package and deliverables','Verify both Jaymala / Fiber set inclusions','Verify tent / sound package to avoid duplicate purchase','Reconfirm orchestra timing and performers','Reconfirm baraat vehicle capacity','Prepare vendor contact sheet','Reconfirm vendor arrival times','Prepare balance-payment envelope for every vendor','Keep all vendor receipts in one folder','Assign person to verify vendor work before final payment']],
['Home & Accommodation','2026-12-01','Family','High',['Deep-clean main house and guest areas','Prepare groom room','Prepare guest sleeping rooms / spaces','Arrange mattresses, pillows, sheets and blankets','Check bathrooms, buckets, mugs, soap and handwash','Check water tank / pump and backup','Test generator / inverter / emergency lights','Check charging points and extension boards','Put artificial garlands / torans / décor','Arrange Swagat / Shubh Vivah signage','Set up family photo wall','Arrange garbage bags and cleaning supplies','Arrange mosquito repellent','Create secure place for jewellery / cash / documents','Plan vehicle parking area']],
['Baraat & Transport','2026-12-04','Transport Team','High',['Finalize baraat headcount','Prepare vehicle allocation list','Confirm baraat departure time with bride side','Share bride venue route with drivers','Collect driver phone numbers','Arrange water and snacks for baraat','Reserve comfortable seats for elders','Confirm bride return / vidai vehicle','Assign person for groom luggage','Assign person for gifts / shagun received']],
['Delhi → Bihar Travel','2026-11-24','Family','High',['Complete car service / long-drive check','Check RC, insurance, PUC and driving licence','Top up FASTag','Check tyre pressure and stepney','Pack inflator, jack, puncture kit, jumper and tow rope','Download offline maps','Prepare journey water, snacks and ORS','Prepare baby travel bag','Pack baby diapers, wipes, spare clothes and blanket','Pack baby feeding supplies / thermos','Pack medicines / first aid in cabin','Pack jewellery and cash in personal bag','Pack groom clothes separately','Count and label all luggage','Check gas, taps, appliances and locks before leaving']],
['Tilak','2026-12-02','Family','High',['Complete Tilak area setup','Keep Tilak puja thali ready','Keep food / serving team ready','Arrange gift / cash receiving and recording']],
['Matkor','2026-12-04','Family','High',['Prepare Matkor ritual area','Keep Matkor ritual material ready','Confirm participating family members']],
['Shadi','2026-12-05','Family','High',['Iron groom wedding clothes and keep set together','Keep sehra / kalgi / safa / mojari together','Charge phones / powerbanks','Keep vendor payment envelopes with handler','Reconfirm orchestra, transport, video and Jaymala','Keep groom emergency kit in wedding vehicle','Check baraati vehicles before departure','Confirm bride-side contact person','Secure received jewellery / gifts after return']],
['Bahubhoj','2026-12-06','Family','High',['Prepare griha-pravesh setup','Confirm Bahubhoj food quantity','Arrange seating / serving flow','Assign cleanup team']],
['Khora Reception','2026-12-09','Family','High',['Confirm final Khora reception date','Finalize Khora reception venue','Finalize reception guest count','Book reception caterer','Finalize reception menu','Arrange simple stage / backdrop','Confirm reception photography / video','Finalize bride reception outfit','Finalize groom reception outfit','Plan reception parking / entry flow','Arrange gift / cash receiving desk','Prepare reception vendor envelopes','Assign cleanup / leftover handling']],
['Post-Wedding','2026-12-12','Family','High',['Settle remaining Bihar vendor balances after verification','Confirm photo / video delivery timeline','Return rented / borrowed items','Record gifts / shagun received if desired','Reconcile Bihar actual expenses','Pack valuables and documents for Delhi return','Check luggage count before return','Settle Khora reception balances','Update final actual wedding spend and reserve']]
];


function ensureExpenseSeeds(){
 state.data.expenses=state.data.expenses||[];
 state.meta=state.meta||{};
 state.meta.deletedSeedExpenseIds=state.meta.deletedSeedExpenseIds||[];
 const deleted=new Set(state.meta.deletedSeedExpenseIds);
 const existing=new Set(state.data.expenses.map(x=>x.id));
 (window.DEFAULT_DATA?.expenses||[]).forEach(seed=>{
  if(!seed?.id||deleted.has(seed.id)||existing.has(seed.id))return;
  state.data.expenses.push(clone(seed));
  existing.add(seed.id);
 });
}

function alignKnownExpenseAdvances(){
 state.meta=state.meta||{};
 if(state.meta.expenseAdvanceAlignmentV24)return;
 const knownIds=new Set(['video','jay1','jay2','tent','orchestra','transport','jewellery','saree16','sareeGood']);
 const defaults=new Map((window.DEFAULT_DATA?.expenses||[]).filter(x=>knownIds.has(x.id)).map(x=>[x.id,x]));
 const hist=state.data.history||[];
 const userTouched=(row,field)=>hist.some(h=>h.record===row.item&&h.field===field&&['Expenses','Vendors','Shopping','Jewellery'].includes(h.module));
 for(const row of state.data.expenses||[]){
  const def=defaults.get(row.id);if(!def)continue;
  if((row.expected==null||+row.expected===0)&&+def.expected>0&&!userTouched(row,'expected'))row.expected=+def.expected;
  if((row.actual==null||+row.actual===0)&&+def.actual>0&&!userTouched(row,'actual'))row.actual=+def.actual;
  if((row.paid==null||+row.paid===0)&&+def.paid>0&&!userTouched(row,'paid'))row.paid=+def.paid;
  if((!row.status||row.status==='Pending')&&def.status&&!userTouched(row,'status'))row.status=def.status;
  if(!row.notes&&def.notes)row.notes=def.notes;
 }
 // Cash ledger is also authoritative for known recorded advances. Use it only to fill a missing paid value.
 for(const p of state.data.cashLedger||[]){
  if(p.type!=='Recorded payment'||!p.linkedExpense)continue;
  const row=state.data.expenses.find(x=>x.id===p.linkedExpense);if(!row||userTouched(row,'paid'))continue;
  const total=(state.data.cashLedger||[]).filter(x=>x.type==='Recorded payment'&&x.linkedExpense===row.id).reduce((s,x)=>s+(+x.amount||0),0);
  if((row.paid==null||+row.paid===0)&&total>0)row.paid=total;
 }
 state.meta.expenseAdvanceAlignmentV24=true;
}

const TASK_ALIAS_GROUPS=[
 ['prepare balance-payment envelope for every vendor','prepare vendor balance payment envelopes','prepare vendor balance-payment envelopes'],
 ['finalize baraat headcount','finalize shadi / baraat headcount'],
 ['complete gifting sarees purchase','finalize remaining 33 gifting sarees']
];
const TASK_ALIAS_MAP=(()=>{const m=new Map();TASK_ALIAS_GROUPS.forEach(g=>{const canonical=String(g[0]||'').trim().replace(/\s+/g,' ').toLowerCase();g.forEach(x=>m.set(String(x||'').trim().replace(/\s+/g,' ').toLowerCase(),canonical))});return m})();

function taskTitleKey(v){return String(v||'').trim().replace(/\s+/g,' ').toLowerCase()}
function canonicalTaskKey(v){const k=taskTitleKey(v);return TASK_ALIAS_MAP.get(k)||k}
function seedTaskById(id){
 const m=String(id||'').match(/^seed-(\d+)-(\d+)$/);if(!m)return null;
 const g=TASK_GROUPS[+m[1]],title=g?.[4]?.[+m[2]];if(!g||!title)return null;
 return{id:String(id),title,category:g[0],due:g[1],owner:g[2],priority:g[3]};
}
function seedTaskTitleKeys(){const out=new Set();TASK_GROUPS.forEach(g=>(g[4]||[]).forEach(title=>out.add(canonicalTaskKey(title))));return out}
function markDeletedSeedTask(t){
 if(!t)return;state.meta=state.meta||{};
 const key=canonicalTaskKey(t.title),seedKeys=seedTaskTitleKeys();
 if(seedKeys.has(key)){
  const deleted=new Set((state.meta.deletedSeedTaskTitles||[]).map(canonicalTaskKey));deleted.add(key);state.meta.deletedSeedTaskTitles=[...deleted];
 }
 const id=String(t.id||'');
 if(id.startsWith('seed-')){
  const ids=new Set([...(state.meta.deletedSeedTaskIds||[]),...((state.data&&state.data.deletedTaskSeedIds)||[])]);ids.add(id);
  state.meta.deletedSeedTaskIds=[...ids];
 }
}
function clearDeletedTaskSuppression(title){
 state.meta=state.meta||{};const key=canonicalTaskKey(title);if(!key)return;
 state.meta.deletedSeedTaskTitles=(state.meta.deletedSeedTaskTitles||[]).filter(x=>canonicalTaskKey(x)!==key);
 const keepId=id=>{const seed=seedTaskById(id);return !seed||canonicalTaskKey(seed.title)!==key};
 state.meta.deletedSeedTaskIds=(state.meta.deletedSeedTaskIds||[]).filter(keepId);
 if(state.data)state.data.deletedTaskSeedIds=(state.data.deletedTaskSeedIds||[]).filter(keepId);
}
function taskProgressScore(status){
 const s=String(status||'');
 const scores={'Done':100,'Not Required':95,'In Progress':85,'Waiting on Vendor':75,'Waiting on Family':74,'Blocked':70,'Pending':20};
 return Object.prototype.hasOwnProperty.call(scores,s)?scores[s]:(s?60:0);
}
function taskHistoryInfo(title){
 const key=taskTitleKey(title);let latest=0,edits=0;
 (state.data.history||[]).forEach(h=>{
  const mod=String(h.module||'').toLowerCase();
  if((mod!=='task'&&mod!=='tasks')||taskTitleKey(h.record)!==key||String(h.field||'').toLowerCase()==='delete')return;
  const at=Date.parse(h.at||'')||0;if(at>latest)latest=at;edits++;
 });
 return{latest,edits};
}
function taskKeepRank(t){
 const h=taskHistoryInfo(t.title),nonSeed=String(t.id||'').startsWith('seed-')?0:1;
 const exactCanonical=taskTitleKey(t.title)===canonicalTaskKey(t.title)?1:0;
 const complete=['due','category','owner','priority','status'].reduce((n,f)=>n+((t[f]!=null&&t[f]!=='')?1:0),0);
 return[nonSeed,taskProgressScore(t.status),h.latest,h.edits,exactCanonical,complete];
}
function taskRankGreater(a,b){
 for(let i=0;i<Math.max(a.length,b.length);i++){const av=a[i]||0,bv=b[i]||0;if(av!==bv)return av>bv}
 return false;
}
function reconcileDeletedTasksFromHistory(){
 state.meta=state.meta||{};state.data.tasks=state.data.tasks||[];state.data.history=state.data.history||[];
 if(state.meta.taskHistoryDeleteReconcileV26)return;
 const seedKeys=seedTaskTitleKeys(),latest=new Map();
 state.data.history.forEach(h=>{
  const mod=String(h.module||'').toLowerCase(),field=String(h.field||'').toLowerCase();
  if((mod!=='task'&&mod!=='tasks')||(field!=='delete'&&field!=='create'))return;
  const key=canonicalTaskKey(h.record);if(!key||!seedKeys.has(key))return;
  const at=Date.parse(h.at||'')||0;let deletedId='';
  if(field==='delete'){try{deletedId=String(JSON.parse(h.oldValue||'{}').id||'')}catch(e){}}
  const prev=latest.get(key);if(!prev||at>prev.at)latest.set(key,{field,at,deletedId,title:h.record||''});
 });
 const deletedTitles=new Set((state.meta.deletedSeedTaskTitles||[]).map(canonicalTaskKey));
 let removed=[];
 latest.forEach((v,key)=>{
  if(v.field==='create'){deletedTitles.delete(key);return}
  deletedTitles.add(key);
  const seedOnly=String(v.deletedId||'').startsWith('seed-')||!v.deletedId;
  const drop=state.data.tasks.filter(t=>canonicalTaskKey(t.title)===key&&(!seedOnly||String(t.id||'').startsWith('seed-')));
  if(drop.length){removed.push(...drop);state.data.tasks=state.data.tasks.filter(t=>!drop.includes(t))}
 });
 state.meta.deletedSeedTaskTitles=[...deletedTitles];
 state.meta.taskHistoryDeleteReconcileV26=true;
 if(removed.length){
  state.data.history.unshift({id:'task-delete-reconcile-'+Date.now(),at:new Date().toISOString(),module:'Data Cleanup',record:'Tasks',field:'deleted-task-resurrection',oldValue:removed.map(x=>(x.title||'(untitled)')+' ['+(x.id||'no-id')+']').join('; '),newValue:'Removed '+removed.length+' resurrected deleted task row(s)',note:'Existing task deletion history was respected; generated copies will not be re-added'});
 }
}
function dedupeTasks(){
 state.data.tasks=state.data.tasks||[];
 const out=[],byKey=new Map(),removed=[];
 state.data.tasks.forEach(t=>{
  const titleKey=canonicalTaskKey(t.title),idKey=String(t.id||'').trim();
  const key=titleKey?'title:'+titleKey:(idKey?'id:'+idKey:'');
  if(!key){out.push(t);return}
  if(!byKey.has(key)){byKey.set(key,out.length);out.push(t);return}
  const idx=byKey.get(key),current=out[idx];
  const keep=taskRankGreater(taskKeepRank(t),taskKeepRank(current))?t:current;
  const drop=keep===t?current:t;
  ['due','category','owner','priority','status'].forEach(f=>{if((keep[f]==null||keep[f]==='')&&drop[f]!=null&&drop[f]!=='')keep[f]=drop[f]});
  out[idx]=keep;removed.push(drop);
 });
 if(removed.length){
  state.data.tasks=out;
  state.data.history=state.data.history||[];
  state.data.history.unshift({id:'task-dedupe-v26-'+Date.now(),at:new Date().toISOString(),module:'Data Cleanup',record:'Tasks',field:'duplicates',oldValue:removed.map(x=>(x.title||'(untitled)')+' ['+(x.id||'no-id')+']').join('; '),newValue:'Removed '+removed.length+' duplicate task row(s)',note:'Preserved user-owned records, progressed/custom statuses and edited task data over generated seed copies'});
 }
}
function ensureTaskSeeds(){
 state.data.tasks=state.data.tasks||[];state.meta=state.meta||{};
 const deletedIds=new Set([...(state.meta.deletedSeedTaskIds||[]),...((state.data&&state.data.deletedTaskSeedIds)||[])]);
 const deleted=new Set((state.meta.deletedSeedTaskTitles||[]).map(canonicalTaskKey));
 deletedIds.forEach(id=>{const seed=seedTaskById(id);if(seed)deleted.add(canonicalTaskKey(seed.title))});
 const titles=new Set(state.data.tasks.map(x=>canonicalTaskKey(x.title)).filter(Boolean));
 const ids=new Set(state.data.tasks.map(x=>String(x.id||'')).filter(Boolean));
 TASK_GROUPS.forEach((g,gi)=>g[4].forEach((title,i)=>{
  const id='seed-'+gi+'-'+i,k=canonicalTaskKey(title);
  if(!k||ids.has(id)||titles.has(k)||deleted.has(k)||deletedIds.has(id))return;
  state.data.tasks.push({id,title,category:g[0],due:g[1],status:'Pending',owner:g[2],priority:g[3]});
  ids.add(id);titles.add(k);
 }));
}

function ensureExtras(){
 const d=state.data;
 const shoppingTargets={'s-1':50,'s-2':1,'s-3':3,'s-4':4,'s-5':1,'s-bhabhi':1,'s-sister':1,'s-baby':3,'s-7':1,'s-8':1,'s-9':1,'s-10':1};
 (d.shopping||[]).forEach(s=>{
  if(s.id==='s-1'&&(s.name==='Remaining gifting sarees'||s.name==='Gifting sarees')){s.name='Gifting sarees';if(s.qty==='33')s.qty=''}
  if(s.targetQty==null)s.targetQty=shoppingTargets[s.id]??1;
  if(s.completedQty==null)s.completedQty=s.id==='s-1'?16:(s.status==='Purchased'?s.targetQty:0);
  s.targetQty=Math.max(0,+s.targetQty||0);s.completedQty=Math.max(0,+s.completedQty||0);
  if(s.status!=='Skipped')s.status=s.targetQty>0?(s.completedQty>=s.targetQty?'Purchased':s.completedQty>0?'Partially Purchased':'Pending'):(s.status||'Pending');
 });
 const sareeBudget=expenseById('saree33');if(sareeBudget&&sareeBudget.item==='Remaining 33 gifting sarees')sareeBudget.item='Gifting sarees purchase budget';
 (d.tasks||[]).forEach(t=>{if(t.title==='Finalize remaining 33 gifting sarees'||t.title==='Complete gifting sarees purchase')t.title='Complete gifting sarees purchase'});

 d.contacts=d.contacts||[
 {id:'c-groom',name:'Pankaj Kumar',role:'Groom',phone:'',address:'Bagauchha, Post Pipra, Thana Maharajganj, District Siwan, Bihar',status:'Confirmed'},
 {id:'c-bride',name:'Neetu',role:'Bride / bride-side contact',phone:'',address:'Somvarsha, Post Somvarsha, Thana Barauni, District Gopalganj, Bihar',status:'Confirmed'},
 {id:'c-pandit',name:'Pandit Braj Bihari Pandey',role:'Pandit',phone:'',address:'Bagauchha / Pipra / Maharajganj / Siwan',status:'Needs Confirmation'}
 ];
 d.gifting=d.gifting||[
 {id:'g1',name:'Bua',relation:'Bua',gift:'Gifting saree',packed:false,handed:false,status:'Needs Confirmation'},
 {id:'g2',name:'Durgawati',relation:'Relative / confirm',gift:'Gifting saree',packed:false,handed:false,status:'Needs Confirmation'},
 {id:'g3',name:'Prabhawati',relation:'Relative / confirm',gift:'Gifting saree',packed:false,handed:false,status:'Needs Confirmation'},
 {id:'g4',name:'Rajmuni',relation:'Relative / confirm',gift:'Gifting saree',packed:false,handed:false,status:'Needs Confirmation'},
 {id:'g5',name:'Sita',relation:'Relative / confirm',gift:'Gifting saree',packed:false,handed:false,status:'Needs Confirmation'},
 {id:'g6',name:'Gita',relation:'Relative / confirm',gift:'Gifting saree',packed:false,handed:false,status:'Needs Confirmation'},
 {id:'g7',name:'Seema',relation:'Relative / confirm',gift:'Gifting saree',packed:false,handed:false,status:'Needs Confirmation'}
 ];
 d.jewelleryRegister=d.jewelleryRegister||[{id:'jr1',item:'Jewellery receipt aggregate',recipient:'Bride / Wedding',amount:193900,paid:0,custody:'Not set',invoice:'Receipt available',status:'Needs Confirmation',notes:'Item-level breakup can be added later'}];
 d.cashLedger=d.cashLedger||[
 {id:'pay-video',date:'',type:'Recorded payment',description:'Baba Videography advance',amount:1000,mode:'Unconfirmed',linkedExpense:'video'},
 {id:'pay-jay1',date:'',type:'Recorded payment',description:'Jaymala / Fiber Set #1 advance',amount:500,mode:'Unconfirmed',linkedExpense:'jay1'},
 {id:'pay-jay2',date:'',type:'Recorded payment',description:'Jaymala / Fiber Set #2 advance',amount:500,mode:'Unconfirmed',linkedExpense:'jay2'},
 {id:'pay-tent',date:'',type:'Recorded payment',description:'Tent + Sound advance',amount:2001,mode:'Unconfirmed',linkedExpense:'tent'},
 {id:'pay-orch',date:'',type:'Recorded payment',description:'Orchestra advance',amount:5000,mode:'Unconfirmed',linkedExpense:'orchestra'},
 {id:'pay-trans',date:'',type:'Recorded payment',description:'Baraat transport advance',amount:3000,mode:'Unconfirmed',linkedExpense:'transport'},
 {id:'pay-saree16',date:'',type:'Recorded payment',description:'16 gifting sarees',amount:4800,mode:'Unconfirmed',linkedExpense:'saree16'},
 {id:'pay-sareegood',date:'',type:'Recorded payment',description:'1 better saree',amount:1500,mode:'Unconfirmed',linkedExpense:'sareeGood'}
 ];
 d.inventory=d.inventory||[
 {id:'i1',category:'Gifts',item:'Bulk gifting sarees',required:50,bought:16,packed:0,loaded:0,location:'Delhi',status:'In Progress'},
 {id:'i2',category:'Gifts',item:'Better saree',required:1,bought:1,packed:0,loaded:0,location:'Delhi',status:'Bought'},
 {id:'i3',category:'Groom',item:'Wedding outfit',required:1,bought:0,packed:0,loaded:0,location:'Delhi',status:'Pending'},
 {id:'i4',category:'Groom',item:'Sehra / Kalgi / Safa set',required:1,bought:0,packed:0,loaded:0,location:'Delhi',status:'Pending'},
 {id:'i5',category:'Puja',item:'Puja / ritual bag',required:1,bought:0,packed:0,loaded:0,location:'Delhi/Bihar',status:'Pending'},
 {id:'i6',category:'Baby',item:'Baby travel bag',required:1,bought:0,packed:0,loaded:0,location:'Delhi',status:'Pending'},
 {id:'i7',category:'Emergency',item:'Medicine / first-aid bag',required:1,bought:0,packed:0,loaded:0,location:'Delhi',status:'Pending'},
 {id:'i8',category:'Documents',item:'Vendor receipt folder',required:1,bought:0,packed:0,loaded:0,location:'Delhi',status:'Pending'}
 ];
 d.vendorScopes=d.vendorScopes||[
 {id:'vs1',vendorId:'v-tent',vendor:'Dildar Sound Service + Tent House',scope:'Tent / sound / setup package from receipt',warning:'Verify package before buying or renting chairs, tables, lighting, bedding or setup items separately',verified:false},
 {id:'vs2',vendorId:'v-jay1',vendor:'Pritam Jaymala / Fiber Set #1',scope:'Jaymala / fiber decoration set',warning:'Verify included décor before duplicate purchase',verified:false},
 {id:'vs3',vendorId:'v-jay2',vendor:'Pritam Jaymala / Fiber Set #2',scope:'Second Jaymala / fiber decoration set',warning:'Verify included décor before duplicate purchase',verified:false},
 {id:'vs4',vendorId:'v-video',vendor:'Baba Videography',scope:'Photography / videography package',warning:'Confirm deliverables, event coverage and final media delivery',verified:false}
 ];
 d.rooms=d.rooms||[];
 d.foodPlan=d.foodPlan||{eventCounts:{tilak:0,matkor:0,shadi:0,bahubhoj:0,reception:0},assumptions:{rice:0.18,atta:0.12,dal:0.06,vegetables:0.18,paneer:0.08,waterLitres:2,sweetsPieces:2}};
 d.foodPlan.eventCounts=Object.assign({tilak:0,matkor:0,shadi:0,bahubhoj:0,reception:0},d.foodPlan.eventCounts||{});
 d.foodPlan.assumptions=Object.assign({rice:0.18,atta:0.12,dal:0.06,vegetables:0.18,paneer:0.08,waterLitres:2,sweetsPieces:2},d.foodPlan.assumptions||{});
 d.foodPlan.stayDays=Array.isArray(d.foodPlan.stayDays)?d.foodPlan.stayDays:[];
 d.foodPlan.stayAssumptions=Object.assign({
   breakfastAtta:0.10,breakfastMilk:0.20,lunchRice:0.14,lunchDal:0.05,lunchVegetables:0.16,
   teaMilk:0.12,teaLeaves:0.004,teaSugar:0.015,teaSnacks:0.06,
   dinnerAtta:0.11,dinnerRice:0.08,dinnerDal:0.04,dinnerVegetables:0.14,
   oilPerMeal:0.015,waterLitres:2.5,bufferPct:10
 },d.foodPlan.stayAssumptions||{});
 d.foodPlan.stayItems=Array.isArray(d.foodPlan.stayItems)?d.foodPlan.stayItems:[];
 d.foodPlan.stayItems.forEach(function(x){if(x.unitPrice==null)x.unitPrice=0;if(x.shoppingEnabled==null)x.shoppingEnabled=true});
 d.eventCommands=d.eventCommands||[
 {id:'ec1',event:'Tilak',date:'2026-12-02',startTime:'',owner:'Family',vendorArrival:'',paymentDue:'',notes:''},
 {id:'ec2',event:'Matkor',date:'2026-12-04',startTime:'',owner:'Family',vendorArrival:'',paymentDue:'',notes:''},
 {id:'ec3',event:'Shadi',date:'2026-12-05',startTime:'',owner:'Family',vendorArrival:'',paymentDue:'Vendor balances as applicable',notes:'Baraat departure time to confirm'},
 {id:'ec4',event:'Bahubhoj',date:'2026-12-06',startTime:'',owner:'Family',vendorArrival:'',paymentDue:'',notes:''},
 {id:'ec5',event:'Khora Reception',date:'2026-12-10',startTime:'',owner:'Family',vendorArrival:'',paymentDue:'Reception vendor balances',notes:'Date tentative — confirm before invitations'}
 ];
 d.calendar=d.calendar||[
 {id:'cal1',date:'2026-11-25',title:'Leave begins',type:'Leave',status:'Confirmed in leave draft'},
 {id:'cal3',date:'2026-12-02',title:'Tilak',type:'Function',status:'Confirmed'},
 {id:'cal4',date:'2026-12-04',title:'Matkor',type:'Function',status:'Confirmed'},
 {id:'cal5',date:'2026-12-05',title:'Shadi',type:'Function',status:'Confirmed'},
 {id:'cal6',date:'2026-12-06',title:'Bahubhoj',type:'Function',status:'Confirmed'},
 {id:'cal7',date:'2026-12-10',title:'Khora Reception',type:'Function',status:'Needs Confirmation'},
 {id:'cal8',date:'2026-12-10',title:'Leave ends',type:'Leave',status:'Confirmed in leave draft'},
 ];
 d.documents=d.documents||[
 {id:'doc1',title:'Vendor receipts folder',type:'Receipts',status:'Collecting',reference:'Videography, Jaymala, tent/sound, orchestra, transport'},
 {id:'doc2',title:'Jewellery bill',type:'Invoice',status:'Available / payment to confirm',reference:'₹1,93,900 provisional'},
 {id:'doc3',title:'Final invitation master copy',type:'Invitation',status:'Needs final verification',reference:'Hindi + English'},
 {id:'doc4',title:'Pandit puja-samagri list',type:'Ritual',status:'Pending',reference:''},
 {id:'doc5',title:'Guest list',type:'Operations',status:'In app',reference:'Guests module'},
 {id:'doc6',title:'Baraat vehicle list',type:'Transport',status:'Pending',reference:''},
 {id:'doc7',title:'IDs / vehicle documents',type:'Travel',status:'Prepare',reference:'DL, RC, Insurance, PUC'},
 {id:'doc8',title:'Leave approval / intimation',type:'Work',status:'Applied / verify',reference:'25 Nov–10 Dec'}
 ];
 d.invitations=d.invitations||[
 {id:'inv1',section:'Cover Page',language:'Hindi / English',status:'Prepared',verified:false},
 {id:'inv2',section:'Groom & Bride Introduction',language:'Hindi / English',status:'Prepared',verified:false},
 {id:'inv3',section:'Baraat Yatra',language:'Hindi / English',status:'Prepared',verified:false},
 {id:'inv4',section:'Wedding Day Programme',language:'Hindi / English',status:'Prepared',verified:false},
 {id:'inv5',section:'Shubh Vivah',language:'Hindi / English',status:'Prepared',verified:false},
 {id:'inv6',section:'Bidai',language:'Hindi / English',status:'Prepared',verified:false},
 {id:'inv7',section:'Bahubhoj',language:'Hindi / English',status:'Prepared',verified:false},
 {id:'inv8',section:'Darshanabhilashi',language:'Hindi / English',status:'Prepared',verified:false},
 {id:'inv9',section:'Closing / Blessings',language:'Hindi / English',status:'Prepared',verified:false},
 {id:'inv10',section:'Khora Reception Invite',language:'Hindi / English',status:'Needs Confirmation',verified:false}
 ];
 d.familyClothing=d.familyClothing||[
 {id:'fc1',person:'Groom',event:'Shadi',item:'Wedding outfit',expected:25000,actual:0,paid:0,fitting:'Pending',packed:false,expenseId:'groomWedding'},
 {id:'fc2',person:'Groom',event:'Tilak / Matkor / Bahubhoj',item:'Other function outfits',expected:15000,actual:0,paid:0,fitting:'Pending',packed:false,expenseId:'groomOther'},
 {id:'fc3',person:'Mother',event:'Multiple',item:'Function sarees / outfits',expected:20000,actual:0,paid:0,fitting:'Pending',packed:false,expenseId:'mother'},
 {id:'fc4',person:'Brothers',event:'Multiple',item:'Male family clothes',expected:25000,actual:0,paid:0,fitting:'Pending',packed:false,expenseId:'brothers'},
 {id:'fc5',person:'Bhabhi',event:'Multiple',item:'Outfits',expected:10000,actual:0,paid:0,fitting:'Pending',packed:false,expenseId:'bhabhi'},
 {id:'fc6',person:'Sister',event:'Multiple',item:'Outfits',expected:8000,actual:0,paid:0,fitting:'Pending',packed:false,expenseId:'sister'},
 {id:'fc7',person:'Baby',event:'Multiple',item:'2–3 comfortable sets',expected:2000,actual:0,paid:0,fitting:'N/A',packed:false,expenseId:'babyClothes'},
 {id:'fc8',person:'Family',event:'Multiple',item:'Footwear / accessories / alterations',expected:2500,actual:0,paid:0,fitting:'Pending',packed:false,expenseId:'footwear'},
 {id:'fc9',person:'Groom',event:'Shadi',item:'Sehra / Kalgi / accessories',expected:2500,actual:0,paid:0,fitting:'N/A',packed:false,expenseId:'groomAccessories'}
 ];
 d.brideGifts=d.brideGifts||[
 {id:'bg1',item:'Bride sarees / suits',expected:0,actual:0,packed:false,status:'Needs Estimate'},
 {id:'bg2',item:'Bride footwear',expected:0,actual:0,packed:false,status:'Optional / Confirm'},
 {id:'bg3',item:'Cosmetics / toiletries',expected:0,actual:0,packed:false,status:'Needs Estimate'},
 {id:'bg4',item:'Purse / handbag',expected:0,actual:0,packed:false,status:'Optional / Confirm'},
 {id:'bg5',item:'Gift suitcase',expected:0,actual:0,packed:false,status:'Needs Estimate'},
 {id:'bg6',item:'Bangles / accessories',expected:0,actual:0,packed:false,status:'Needs Estimate'},
 {id:'bg7',item:'Bichhiya / payal if family custom',expected:0,actual:0,packed:false,status:'Confirm Custom'},
 {id:'bg8',item:'Bride parents clothes / shagun',expected:0,actual:0,packed:false,status:'Confirm Custom'},
 {id:'bg9',item:'Close-relative gifts',expected:0,actual:0,packed:false,status:'Confirm Custom'}
 ];
 d.settings=d.settings||{};if(d.settings.reserveTarget==null)d.settings.reserveTarget=50000;d.settings.dashboardSlideshow=d.settings.dashboardSlideshow||{enabled:true,intervalSeconds:5,mediaIds:[]};
 if(!expenseById('brideGiftsOther'))d.expenses.push({id:'brideGiftsOther',category:'Jewellery & Gifts',item:'Bride-side gifts (non-jewellery)',event:'Gifting',expected:0,actual:0,paid:0,status:'Needs Estimate',notes:'Auto-calculated from Bride Gifts register'});
 d.mediaMeta=d.mediaMeta||[];d.memories=d.memories||[];d.history=d.history||[];
 reconcileDeletedTasksFromHistory();
 integrityDedupeTasks();
 ensureTaskSeeds();
 syncAllLinked();
}

function syncFamilyToExpense(expenseId){const rows=state.data.familyClothing.filter(x=>x.expenseId===expenseId),e=expenseById(expenseId);if(!e||!rows.length)return;e.expected=rows.reduce((s,x)=>s+(+x.expected||0),0);e.actual=rows.reduce((s,x)=>s+(+x.actual||0),0);e.paid=rows.reduce((s,x)=>s+(+x.paid||0),0)}
function distributeToFamily(expenseId,field,total){const rows=state.data.familyClothing.filter(x=>x.expenseId===expenseId);if(!rows.length)return;const base=rows.reduce((s,x)=>s+(+x[field]||0),0)||rows.reduce((s,x)=>s+(+x.expected||0),0)||rows.length;let used=0;rows.forEach((r,i)=>{let v=i===rows.length-1?total-used:Math.round(total*((+r[field]||+r.expected||1)/base));r[field]=Math.max(0,v);used+=v})}
function syncJewelleryToExpense(){const e=expenseById('jewellery');if(!e)return;e.actual=state.data.jewelleryRegister.reduce((s,x)=>s+(+x.amount||0),0);if(!e.expected)e.expected=e.actual;e.paid=state.data.jewelleryRegister.reduce((s,x)=>s+(+x.paid||0),0)}
function syncBrideGifts(){const e=expenseById('brideGiftsOther');if(!e)return;e.expected=state.data.brideGifts.reduce((s,x)=>s+(+x.expected||0),0);e.actual=state.data.brideGifts.reduce((s,x)=>s+(+x.actual||0),0);e.status=e.expected?'Estimated':'Needs Estimate'}
function syncAllLinked(){state.data.shopping.forEach(s=>{const id=SHOP_LINK[s.id],e=id&&expenseById(id);if(e){s.expected=e.expected;s.actual=e.actual;s.status=e.status==='Purchased'?'Purchased':s.status||'Pending'}});state.data.vendors.forEach(v=>{const id=VENDOR_LINK[v.id],e=id&&expenseById(id);if(e){v.total=e.actual||e.expected;v.paid=e.paid;v.balance=Math.max(0,(e.actual||e.expected)-e.paid);v.status=e.status}});state.data.familyClothing.forEach(r=>{const e=expenseById(r.expenseId);if(e&&state.meta.schemaVersion<9){r.expected=e.expected;r.actual=e.actual;r.paid=e.paid}});syncJewelleryToExpense();syncBrideGifts()}


function cleanupSeededNoise(){
 const d=state.data,m=state.meta=state.meta||{};
 if(m.cleanupV15Applied)return;
 let cleaned=0,changes=[];

 // Remove only untouched generic room examples. User-edited rooms are preserved.
 const genericRooms={
  r1:{name:'Groom Room',capacity:2,assigned:'Groom / essentials',mattresses:1,blankets:2,status:'Planned'},
  r2:{name:'Guest Room 1',capacity:4,assigned:'',mattresses:4,blankets:4,status:'Planned'},
  r3:{name:'Guest Room 2 / Hall',capacity:6,assigned:'',mattresses:6,blankets:6,status:'Planned'}
 };
 if(Array.isArray(d.rooms)){
  const before=d.rooms.length;
  d.rooms=d.rooms.filter(r=>{
    const x=genericRooms[r.id];if(!x)return true;
    const untouched=Object.keys(x).every(k=>String(r[k]??'')===String(x[k]??''));
    return !untouched;
  });
  const n=before-d.rooms.length;if(n){cleaned+=n;changes.push(n+' generic room placeholder(s)')}
 }

 // Remove speculative calendar entries that were assistant assumptions, only if untouched.
 if(Array.isArray(d.calendar)){
  const removeCalendar=new Set();
  d.calendar.forEach(x=>{
   if(x.id==='cal2'&&x.date==='2026-11-25'&&x.title==='Delhi / Ghaziabad → Bihar departure'&&x.status==='Needs Confirmation')removeCalendar.add(x.id);
   if(x.id==='cal9'&&x.date==='2026-12-11'&&x.title==='Return to work / verify'&&x.status==='Needs Confirmation')removeCalendar.add(x.id);
  });
  if(removeCalendar.size){d.calendar=d.calendar.filter(x=>!removeCalendar.has(x.id));cleaned+=removeCalendar.size;changes.push(removeCalendar.size+' speculative calendar item(s)')}
 }

 // The advance amounts are real, but 2026-10-01 was a generated placeholder date. Clear it unless changed.
 const seededPayIds=new Set(['pay-video','pay-jay1','pay-jay2','pay-tent','pay-orch','pay-trans','pay-saree16','pay-sareegood']);
 if(Array.isArray(d.cashLedger)){
  let n=0;d.cashLedger.forEach(x=>{if(seededPayIds.has(x.id)&&x.date==='2026-10-01'){x.date='';n++}});
  if(n){cleaned+=n;changes.push(n+' placeholder payment date(s) cleared')}
 }

 // Replace the unestablished seeded owner only on app-generated tasks.
 if(Array.isArray(d.tasks)){
  let n=0;d.tasks.forEach(t=>{
   const generated=String(t.id||'').startsWith('seed-')||t.id==='t5';
   if(generated&&(t.owner==='Ravi'||t.owner==='Ravi / Family')){t.owner='Family';n++}
  });
  if(n){cleaned+=n;changes.push(n+' generated task owner(s) corrected')}
 }

 if(!m.cleanupV16Applied){
  let n=0;
  (d.inventory||[]).forEach(x=>{
   if(x.id==='i6'&&x.item==='Baby travel bag'&&x.bought===1&&x.packed===0&&x.loaded===0&&x.status==='Prepare'){x.bought=0;x.status='Pending';n++}
   if(x.id==='i8'&&x.item==='Vendor receipt folder'&&x.bought===1&&x.packed===0&&x.loaded===0&&x.status==='Prepare'){x.bought=0;x.status='Pending';n++}
  });
  m.cleanupV16Applied=true;
  if(n){d.history=d.history||[];d.history.unshift({id:'cleanup-v16-'+Date.now(),at:new Date().toISOString(),module:'Data Cleanup',record:'Unconfirmed inventory defaults',field:'bought/status',oldValue:'Assumed purchased',newValue:'Pending / 0 bought',note:'Only untouched generated rows were corrected'});}
 }
 m.cleanupV15Applied=true;
 m.schemaVersion=Math.max(+m.schemaVersion||0,15);
 if(cleaned){
  d.history=d.history||[];
  d.history.unshift({id:'cleanup-v15-'+Date.now(),at:new Date().toISOString(),module:'Data Cleanup',record:'Seeded placeholders',field:'cleanup',oldValue:'Generated/sample values',newValue:changes.join('; '),note:'Confirmed/user-entered records were preserved'});
 }
}

function migrate(){
 if(!state||!state.data)state=initial();
 state.data.expenses=state.data.expenses||[];state.data.vendors=state.data.vendors||[];state.data.shopping=state.data.shopping||[];state.data.tasks=state.data.tasks||[];state.data.guests=state.data.guests||[];
 state.meta=state.meta||{};
 ensureExpenseSeeds();
 ensureExtras();
 alignKnownExpenseAdvances();
 cleanupSeededNoise();
 integrityCleanSafe();
 linkReconcile();
 sareePolicy();
 state.meta.schemaVersion=31;
}

async function load(){const db=await openDB();if(db){state=await new Promise(resolve=>{const tx=db.transaction(STORE,'readonly'),q=tx.objectStore(STORE).get('state');q.onsuccess=()=>resolve(q.result||initial());q.onerror=()=>resolve(initial())})}else{try{state=JSON.parse(localStorage.getItem(DBNAME))||initial()}catch{state=initial()}}if(window.beforePlannerMigration)await window.beforePlannerMigration(state);migrate();await save(false,false);setDb()}

function totals(){
 const t=linkLedgerTotals(),expected=t.expected,actual=t.actual,paid=t.paid;
 const headroom=(+state.data.meta.hardCap||0)-expected,reserve=+state.data.settings.reserveTarget||0;
 return{expected,actual,paid,balance:Math.max(0,actual-paid),headroom,reserve,afterReserve:headroom-reserve};
}
function updateKpis(){const t=totals();['expected','actual','paid','balance','headroom','reserve','afterReserve'].forEach(k=>document.querySelectorAll('[data-kpi="'+k+'"]').forEach(x=>x.textContent=money(t[k])));document.querySelectorAll('[data-cap]').forEach(x=>x.textContent=money(state.data.meta.hardCap))}
function updateCountdown(){const target=new Date(state.data.meta.weddingDate+'T00:00:00+05:30'),now=new Date(),d=Math.max(0,target-now);document.querySelectorAll('[data-days]').forEach(x=>x.textContent=Math.floor(d/86400000));document.querySelectorAll('[data-hours]').forEach(x=>x.textContent=Math.floor((d%86400000)/3600000));document.querySelectorAll('[data-mins]').forEach(x=>x.textContent=Math.floor((d%3600000)/60000))}
function checkKey(g,i){return g+'::'+i}
function allChecklistKeys(){const out=[];Object.entries(state.data.checklists||{}).forEach(([g,a])=>a.forEach((_,i)=>out.push(checkKey(g,i))));Object.entries(state.data.travelChecklist||{}).forEach(([g,a])=>a.forEach((_,i)=>out.push('travel::'+checkKey(g,i))));return out}
function updateProgress(){const ks=allChecklistKeys(),done=ks.filter(k=>state.checks[k]).length,p=ks.length?Math.round(done/ks.length*100):0;document.querySelectorAll('[data-progress-text]').forEach(x=>x.textContent=done+' / '+ks.length+' checklist items');document.querySelectorAll('[data-progress-pct]').forEach(x=>x.textContent=p+'%');document.querySelectorAll('[data-progress-bar]').forEach(x=>x.style.width=p+'%')}
function statusBadge(s){const cls=(s==='Booked'||s==='Purchased'||s==='Done'||s==='Completed'||s==='Confirmed')?'ok':(s||'').includes('Needs')||s==='Provisional'?'pending':'info';return '<span class="badge '+cls+'">'+(s||'')+'</span>'}
function progressPct(done,target){target=Math.max(0,+target||0);done=Math.max(0,+done||0);return target?Math.min(100,Math.round(done/target*100)):0}

function hEsc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function selectMarkup(key,current,attrs='',extras=[]){
 const base=(window.APP_OPTIONS&&window.APP_OPTIONS[key])||[];
 const vals=[...new Set([...base,...extras].filter(v=>v!==undefined&&v!==null&&String(v)!==''))];
 if(current!==undefined&&current!==null&&String(current)!==''&&!vals.includes(current))vals.unshift(current);
 return '<select '+attrs+'>'+vals.map(v=>'<option value="'+hEsc(v)+'" '+(String(v)===String(current)?'selected':'')+'>'+hEsc(v)+'</option>').join('')+'</select>';
}


const ACTION_FIELDS={
 task:[['title','Task','text'],['due','Due','date'],['category','Category','select','taskCategories'],['owner','Owner','select','owners'],['priority','Priority','select','priorities'],['status','Status','select','taskStatuses']],
 expense:[['item','Item','text'],['category','Category','select','expenseCategories'],['event','Event','select','events'],['expected','Expected ₹','number'],['actual','Actual ₹','number'],['paid','Paid ₹','number'],['status','Status','select','expenseStatuses'],['notes','Notes','textarea']],
 vendor:[['name','Vendor name','text'],['category','Category','select','vendorCategories'],['event','Event','select','events'],['phone','Phone','text'],['total','Total ₹','number'],['paid','Paid ₹','number'],['status','Status','select','vendorStatuses'],['notes','Notes','textarea']],
 shopping:[['name','Item','text'],['market','Market','select','markets'],['targetQty','Target quantity','number'],['completedQty','Completed quantity','number'],['expected','Expected ₹','number'],['actual','Actual ₹','number'],['paid','Paid ₹','number'],['status','Status','select','expenseStatuses']],
 clothing:[['person','Person','text'],['item','Item','text'],['event','Event','select','events'],['expected','Expected ₹','number'],['actual','Actual ₹','number'],['paid','Paid ₹','number'],['fitting','Fitting','select','fittingStatuses'],['packed','Packed','checkbox']],
 gift:[['name','Name','text'],['relation','Relation','select','relations'],['gift','Gift','select','giftTypes'],['packed','Packed','checkbox'],['handed','Handed over','checkbox'],['status','Status','select','confirmationStatuses']],
 jewellery:[['item','Item','text'],['recipient','Recipient','select','jewelleryRecipients'],['amount','Amount ₹','number'],['paid','Paid ₹','number'],['custody','Custody','select','custody'],['invoice','Invoice / receipt','text'],['status','Status','select','confirmationStatuses'],['notes','Notes','textarea']],
 brideGift:[['item','Item','text'],['expected','Expected ₹','number'],['actual','Actual ₹','number'],['packed','Packed','checkbox'],['status','Status','select','brideGiftStatuses']],
 payment:[['date','Date','date'],['type','Type','select','paymentTypes'],['description','Description','text'],['amount','Amount ₹','number'],['mode','Mode','select','paymentModes']],
 contact:[['name','Name','text'],['role','Role','select','contactRoles'],['phone','Phone','text'],['address','Address / Area','text'],['status','Status','select','confirmationStatuses']],
 inventory:[['category','Category','select','inventoryCategories'],['item','Item','text'],['required','Required','number'],['bought','Bought','number'],['packed','Packed','number'],['loaded','Loaded','number'],['location','Location','select','storageLocations']],
 guest:[['name','Name / Family','text'],['side','Side','select','guestSides'],['count','People','number'],['city','City','text'],['arrival','Arrival','date'],['room','Room / Area','select','__rooms'],['transport','Transport / Pickup','select','pickupTypes']],
 room:[['name','Room / Area','text'],['capacity','Capacity','number'],['assigned','Assigned','text'],['mattresses','Mattresses','number'],['blankets','Blankets','number'],['status','Status','select','roomStatuses']],
 event:[['event','Event','select','events'],['date','Date','date'],['startTime','Start time','time'],['owner','Owner','select','owners'],['vendorArrival','Vendor arrival','select','__vendorArrival'],['paymentDue','Payment due','select','__paymentDue'],['notes','Notes','textarea']],
 calendar:[['date','Date','date'],['title','Milestone','text'],['type','Type','select','calendarTypes'],['status','Status','select','calendarStatuses']],
 invitation:[['section','Section','text'],['language','Language','select','invitationLanguages'],['status','Status','select','invitationStatuses'],['verified','Final verified','checkbox']],
 document:[['title','Document','text'],['type','Type','select','documentTypes'],['status','Status','select','documentStatuses'],['reference','Reference / location','text']]
};
function actionRecord(module,id){const map={task:'tasks',expense:'expenses',vendor:'vendors',shopping:'shopping',clothing:'familyClothing',gift:'gifting',jewellery:'jewelleryRegister',brideGift:'brideGifts',payment:'cashLedger',contact:'contacts',inventory:'inventory',guest:'guests',room:'rooms',event:'eventCommands',calendar:'calendar',invitation:'invitations',document:'documents'};return(state.data[map[module]]||[]).find(x=>x.id===id)||null}
function actionLabel(module,r){return r?.title||r?.item||r?.name||r?.description||r?.event||r?.section||r?.date||r?.id||module}
function actionEvidenceRef(module,r){if(module==='expense')return['expense',r.id];if(module==='vendor')return['vendor',r.id];if(module==='shopping')return['shopping','shop:'+r.id];if(module==='clothing')return['shopping','cloth:'+r.id];if(module==='gift')return['gift','gift:'+r.id];if(module==='jewellery')return['gift','jewel:'+r.id];if(module==='brideGift')return['gift','bridegift:'+r.id];if(module==='payment')return['payment',r.id];if(module==='contact')return['contact',r.id];if(module==='inventory')return['inventory',r.id];if(module==='guest')return['guest',r.id];if(module==='event')return['event',r.id];if(module==='document')return['document',r.id];return null}
function actionEditModel(module,r){const m={...r};if(module==='vendor'){const e=expenseById(vendorExpenseId(r));if(e){m.total=+e.actual||+e.expected||0;m.paid=+e.paid||0;m.status=e.status}}if(module==='shopping'){const e=expenseById(SHOP_LINK[r.id]);if(e){m.expected=+e.expected||0;m.actual=+e.actual||0;m.paid=+e.paid||0;m.status=e.status}}return m}
function actionOptions(key,current){let vals=[];if(key==='__rooms')vals=['Not assigned',...(state.data.rooms||[]).map(x=>x.name)];else if(key==='__vendorArrival')vals=['To confirm','2 hours before','1 hour before','30 minutes before','Morning','Afternoon','Evening','On call'];else if(key==='__paymentDue')vals=['No payment due','Advance already paid','Balance before event','Balance after setup','Balance after function','Final payment after verification','To confirm'];else vals=(window.APP_OPTIONS&&window.APP_OPTIONS[key])||[];if(key==='vendorStatuses')vals=[...vals,...((window.APP_OPTIONS&&window.APP_OPTIONS.expenseStatuses)||[])];if(key==='confirmationStatuses')vals=[...vals,'Planned','Packed','Handed Over','Completed','Part-Paid','Paid'];vals=[...new Set(vals.filter(Boolean))];if(current&&!vals.includes(current))vals.unshift(current);return vals}
function expenseDeleteOwner(x){const v=Object.entries(VENDOR_LINK||{}).find(([,eid])=>eid===x.id);if(v)return'Vendors';const s=Object.entries(SHOP_LINK||{}).find(([,eid])=>eid===x.id);if(s)return'Shopping';if((state.data.familyClothing||[]).some(r=>r.expenseId===x.id))return'Family Clothing';if(x.id==='jewellery')return'Jewellery';if(x.id==='brideGiftsOther')return'Bride Gifts';return''}
function preserveActionEvidence(module,r){const ref=actionEvidenceRef(module,r);if(!ref)return;(state.data.mediaMeta||[]).forEach(m=>{if(m.entityType===ref[0]&&m.entityId===ref[1]){m.entityType='general';m.entityId='deleted:'+module+':'+r.id;m.entityLabel='Deleted '+module+' • '+actionLabel(module,r)}})}
function ensureActionDrawer(){let b=document.getElementById('recordActionBackdrop');if(b)return b;b=document.createElement('div');b.id='recordActionBackdrop';b.className='record-action-backdrop';b.innerHTML='<aside class="record-action-drawer"><div class="record-action-head"><div><span id="recordActionModule"></span><h2 id="recordActionTitle"></h2></div><button class="record-action-close" type="button">×</button></div><div id="recordActionBody" class="record-action-body"></div><div id="recordActionFooter" class="record-action-footer"></div></aside>';document.body.appendChild(b);b.addEventListener('click',e=>{if(e.target===b)closeRecordActions()});b.querySelector('.record-action-close').onclick=closeRecordActions;return b}
function closeRecordActions(){document.getElementById('recordActionBackdrop')?.classList.remove('open')}
function actionRefresh(module){if(module==='task'){setupTaskFilters();renderTasks()}else if(module==='expense'){renderExpenses();updateKpis()}else if(module==='vendor'){renderVendors();renderContacts();updateKpis()}else if(module==='shopping'){renderShopping();updateKpis()}else if(module==='clothing'){renderFamilyClothing();updateKpis()}else if(module==='gift')renderGiftingDirectory();else if(module==='jewellery'){renderJewellery();updateKpis()}else if(module==='brideGift'){renderBrideGifts();updateKpis()}else if(module==='payment'){renderPayments();updateKpis()}else if(module==='contact')renderContacts();else if(module==='inventory')renderInventory();else if(module==='guest')renderGuests();else if(module==='room')renderRooms();else if(module==='event')renderEvents();else if(module==='calendar')renderCalendar();else if(module==='invitation')renderInvitations();else if(module==='document')renderDocuments()}
function actionInput(field,value){const[key,label,type,opt]=field;if(type==='select')return'<select data-action-field="'+hEsc(key)+'">'+actionOptions(opt,value).map(x=>'<option value="'+hEsc(x)+'" '+(String(x)===String(value)?'selected':'')+'>'+hEsc(x)+'</option>').join('')+'</select>';if(type==='textarea')return'<textarea data-action-field="'+hEsc(key)+'" rows="4">'+hEsc(value||'')+'</textarea>';if(type==='checkbox')return'<input data-action-field="'+hEsc(key)+'" type="checkbox" '+(value?'checked':'')+'>';return'<input data-action-field="'+hEsc(key)+'" type="'+type+'" '+(type==='number'?'min="0" step="any" ':'')+'value="'+hEsc(value??'')+'">'}
function renderActionView(module,id){const r=actionRecord(module,id);if(!r)return;const m=actionEditModel(module,r),fields=ACTION_FIELDS[module]||[],drawer=ensureActionDrawer(),body=drawer.querySelector('#recordActionBody'),footer=drawer.querySelector('#recordActionFooter'),ref=actionEvidenceRef(module,r),count=ref?(state.data.mediaMeta||[]).filter(x=>x.entityType===ref[0]&&x.entityId===ref[1]).length:0;body.innerHTML='<div class="record-detail-grid">'+fields.map(f=>'<div class="record-detail"><span>'+hEsc(f[1])+'</span><b>'+hEsc(f[2]==='checkbox'?(m[f[0]]?'Yes':'No'):(m[f[0]]??'—'))+'</b></div>').join('')+(ref?'<div class="record-detail"><span>Evidence</span><b>'+count+' file'+(count===1?'':'s')+'</b></div>':'')+'</div>';footer.innerHTML=(module==='vendor'?'<button class="btn green" data-vendor-pay>Add payment</button>':'')+'<button class="btn alt" data-edit-action>Edit / Update</button><button class="btn warn" data-delete-action>Delete</button><button class="btn" data-close-action>Close</button>';const payBtn=footer.querySelector('[data-vendor-pay]');if(payBtn)payBtn.onclick=()=>addVendorPaymentFromActions(id);footer.querySelector('[data-edit-action]').onclick=()=>renderActionEdit(module,id);footer.querySelector('[data-delete-action]').onclick=()=>deleteActionRecord(module,id);footer.querySelector('[data-close-action]').onclick=closeRecordActions}
async function addVendorPaymentFromActions(id){
 const v=actionRecord('vendor',id);if(!v)return;
 const e=expenseById(vendorExpenseId(v));if(!e){alert('No linked expense found for this vendor.');return}
 const raw=prompt('Add payment amount',0);if(raw===null)return;
 const amt=Math.max(0,+raw||0);if(!amt)return;
 const old=+e.paid||0;e.paid=old+amt;
 audit('Vendors',v.name,'paid',old,e.paid,'Payment added from Actions');
 state.data.cashLedger.unshift({id:uid('pay'),date:new Date().toISOString().slice(0,10),type:'Recorded payment',description:v.name+' payment',amount:amt,mode:'Unconfirmed',linkedExpense:e.id,appliedToExpense:true,direction:'payment',source:'vendor-action'});
 await save('Vendor payment added');renderVendors();updateKpis();openRecordActions('vendor',id);
}

function renderActionEdit(module,id){const r=actionRecord(module,id);if(!r)return;const m=actionEditModel(module,r),fields=ACTION_FIELDS[module]||[],drawer=ensureActionDrawer(),body=drawer.querySelector('#recordActionBody'),footer=drawer.querySelector('#recordActionFooter');body.innerHTML='<div class="record-action-form">'+fields.map(f=>'<label><span>'+hEsc(f[1])+'</span>'+actionInput(f,m[f[0]])+'</label>').join('')+'</div>';footer.innerHTML='<button class="btn green" data-save-action>Save changes</button><button class="btn alt" data-cancel-action>Cancel</button>';footer.querySelector('[data-save-action]').onclick=()=>saveActionEdit(module,id);footer.querySelector('[data-cancel-action]').onclick=()=>renderActionView(module,id)}
async function saveActionEdit(module,id){
 const r=actionRecord(module,id);if(!r)return;const fields=ACTION_FIELDS[module]||[],oldPaymentAmount=+r.amount||0,oldPaymentType=r.type||'';
 for(const f of fields){const[key,label,type]=f,el=ensureActionDrawer().querySelector('[data-action-field="'+key+'"]');if(!el)continue;const v=type==='checkbox'?el.checked:type==='number'?Math.max(0,+el.value||0):el.value;
  if(module==='vendor'&&['total','paid','status'].includes(key)){const e=expenseById(vendorExpenseId(r));if(e){if(key==='total'){setField(e,'actual',v,'Vendors',r.name);if(!e.expected)e.expected=v}else setField(e,key,v,'Vendors',r.name)}else setField(r,key,v,'Vendors',r.name)}
  else if(module==='shopping'&&['expected','actual','paid','status'].includes(key)){const e=expenseById(SHOP_LINK[r.id]);if(e)setField(e,key,v,'Shopping',r.name);if(key==='status'||!e)setField(r,key,v,'Shopping',r.name)}
  else setField(r,key,v,module,actionLabel(module,r));
 }
 if(module==='expense'){if((state.data.familyClothing||[]).some(x=>x.expenseId===r.id)){distributeToFamily(r.id,'expected',r.expected);distributeToFamily(r.id,'actual',r.actual);distributeToFamily(r.id,'paid',r.paid)}if(r.id==='jewellery'&&state.data.jewelleryRegister.length===1){state.data.jewelleryRegister[0].amount=r.actual;state.data.jewelleryRegister[0].paid=r.paid}}
 if(module==='shopping'){const e=expenseById(SHOP_LINK[r.id]);r.targetQty=Math.max(0,+r.targetQty||0);r.completedQty=Math.max(0,+r.completedQty||0);if(r.status!=='Skipped')r.status=r.targetQty?(r.completedQty>=r.targetQty?'Purchased':r.completedQty>0?'Partially Purchased':'Pending'):'Pending';if(e)e.status=r.status}
 if(module==='clothing')syncFamilyToExpense(r.expenseId);if(module==='jewellery')syncJewelleryToExpense();if(module==='brideGift')syncBrideGifts();if(module==='inventory')r.status=r.loaded>=r.required?'Loaded':r.packed>=r.required?'Packed':r.bought>=r.required?'Bought':'In Progress';
 if(module==='payment'&&r.linkedExpense){const e=expenseById(r.linkedExpense);if(e&&!r.reconciledAsExisting){const prev=oldPaymentType==='Refund / Return'?-oldPaymentAmount:(oldPaymentType==='Recorded payment'||r.appliedToExpense?oldPaymentAmount:0),next=r.type==='Refund / Return'?-(+r.amount||0):(r.type==='Recorded payment'||r.appliedToExpense?(+r.amount||0):0);window.paymentBridgeTest?.setPaid(e,Math.max(0,(+e.paid||0)+next-prev))}}
 await save(actionLabel(module,r)+' updated');actionRefresh(module);openRecordActions(module,id);
}
async function deleteActionRecord(module,id){
 const r=actionRecord(module,id);if(!r)return;if(module==='expense'){const owner=expenseDeleteOwner(r);if(owner){alert('This expense is managed by '+owner+'. Delete it from that module so linked records stay consistent.');return}}
 let note='';if(module==='vendor'&&expenseById(vendorExpenseId(r)))note='\n\nThe linked expense and payment history will be kept.';if(module==='shopping'&&expenseById(SHOP_LINK[r.id]))note='\n\nThe linked financial expense will be kept.';
 if(!confirm('Delete "'+actionLabel(module,r)+'"?'+note+'\n\nLinked photos/PDF evidence will be kept in the Media Library.'))return;preserveActionEvidence(module,r);
 if(module==='task'){linkPreventTaskReseed(r);markDeletedSeedTask(r);state.data.tasks=state.data.tasks.filter(x=>x.id!==id)}
 else if(module==='expense'){if((window.DEFAULT_DATA?.expenses||[]).some(x=>x.id===r.id)){state.meta=state.meta||{};state.meta.deletedSeedExpenseIds=state.meta.deletedSeedExpenseIds||[];if(!state.meta.deletedSeedExpenseIds.includes(r.id))state.meta.deletedSeedExpenseIds.push(r.id)}state.data.expenses=state.data.expenses.filter(x=>x.id!==id);(state.data.cashLedger||[]).forEach(p=>{if(p.linkedExpense===id)p.linkedExpense=''})}
 else if(module==='vendor')state.data.vendors=state.data.vendors.filter(x=>x.id!==id);else if(module==='shopping')state.data.shopping=state.data.shopping.filter(x=>x.id!==id);else if(module==='clothing'){state.data.familyClothing=state.data.familyClothing.filter(x=>x.id!==id);syncFamilyToExpense(r.expenseId)}else if(module==='gift')state.data.gifting=state.data.gifting.filter(x=>x.id!==id);else if(module==='jewellery'){state.data.jewelleryRegister=state.data.jewelleryRegister.filter(x=>x.id!==id);syncJewelleryToExpense()}else if(module==='brideGift'){state.data.brideGifts=state.data.brideGifts.filter(x=>x.id!==id);syncBrideGifts()}else if(module==='payment'){const e=r.linkedExpense?expenseById(r.linkedExpense):null;if(e&&!r.reconciledAsExisting&&(r.appliedToExpense||r.type==='Recorded payment')){const delta=r.type==='Refund / Return'?(+r.amount||0):-(+r.amount||0);window.paymentBridgeTest?.setPaid(e,Math.max(0,(+e.paid||0)+delta))}state.data.cashLedger=state.data.cashLedger.filter(x=>x.id!==id)}else if(module==='contact')state.data.contacts=state.data.contacts.filter(x=>x.id!==id);else if(module==='inventory')state.data.inventory=state.data.inventory.filter(x=>x.id!==id);else if(module==='guest')state.data.guests=state.data.guests.filter(x=>x.id!==id);else if(module==='room'){state.data.rooms=state.data.rooms.filter(x=>x.id!==id);(state.data.guests||[]).forEach(g=>{if(g.room===r.name)g.room=''})}else if(module==='event')state.data.eventCommands=state.data.eventCommands.filter(x=>x.id!==id);else if(module==='calendar')state.data.calendar=state.data.calendar.filter(x=>x.id!==id);else if(module==='invitation')state.data.invitations=state.data.invitations.filter(x=>x.id!==id);else if(module==='document')state.data.documents=state.data.documents.filter(x=>x.id!==id);
 audit(module,actionLabel(module,r),'delete',JSON.stringify(r),'','Deleted through Actions');await save(actionLabel(module,r)+' deleted');closeRecordActions();actionRefresh(module);
}
function openRecordActions(module,id){const r=actionRecord(module,id);if(!r){toast('Record not found');return}const drawer=ensureActionDrawer();drawer.querySelector('#recordActionModule').textContent=module;drawer.querySelector('#recordActionTitle').textContent=actionLabel(module,r);drawer.classList.add('open');renderActionView(module,id)}

function semNorm(v){return String(v??'').trim().toLowerCase()}
function semHash(v){let h=0;for(const ch of String(v||''))h=((h<<5)-h)+ch.charCodeAt(0);return Math.abs(h)%8}
function semStatusTone(v){const x=semNorm(v);if(!x)return'';if(/blocked|overdue|failed|rejected|cancelled|canceled|urgent|critical/.test(x))return'danger';if(/needs confirmation|needs estimate|needs verification|pending|waiting|unconfirmed|provisional|to confirm|to buy|collecting|prepare$|cleaning pending|trial pending|alteration needed/.test(x))return'warning';if(/in progress|partially|part-paid|estimated|planned|quoted|negotiating|booked|advance paid|reserved|tentative|inquiry/.test(x))return'info';if(/done|completed|confirmed|purchased|ready|loaded|paid|available|prepared|verified|approved|received|packed|handed over|shared|printed/.test(x))return'success';if(/skipped|not required|n\/a|archived|released/.test(x))return'muted';return'info'}
function semPriorityTone(v){const x=semNorm(v);if(/critical|urgent|highest|high/.test(x))return'danger';if(/medium|normal/.test(x))return'warning';if(/low/.test(x))return'success';return'info'}
function semOptionSet(keys){const o=window.APP_OPTIONS||{},s=new Set();keys.forEach(k=>(o[k]||[]).forEach(v=>s.add(semNorm(v))));return s}
function clearSem(el){[...el.classList].filter(c=>c.startsWith('tone-')).forEach(c=>el.classList.remove(c))}
function decorateSemanticRow(tr){
 if(!tr)return;
 const prioritySet=semOptionSet(['priorities']);
 const statusSet=semOptionSet(['taskStatuses','expenseStatuses','vendorStatuses','confirmationStatuses','documentStatuses','invitationStatuses','calendarStatuses','brideGiftStatuses','fittingStatuses','roomStatuses','inventoryStatuses']);
 const categorySet=semOptionSet(['taskCategories','expenseCategories','vendorCategories','inventoryCategories','documentTypes','calendarTypes','giftTypes','contactRoles','relations','guestSides','events','paymentTypes','pickupTypes','storageLocations','jewelleryRecipients']);
 const head=[...(tr.closest('table')?.querySelectorAll('thead th')||[])];
 let best='',bestRank=0;const rank={danger:5,warning:4,info:3,success:2,muted:1,'':0};clearSem(tr);
 [...tr.children].forEach((td,i)=>{clearSem(td);const header=semNorm(head[i]?.textContent||'');const sel=td.querySelector('select');const badge=td.querySelector('.badge');let value=sel?.value||badge?.textContent?.trim()||td.textContent.trim();const nv=semNorm(value);let kind='';
  if(header.includes('priority')||prioritySet.has(nv))kind='priority';
  else if(header.includes('status')||header.includes('fitting')||statusSet.has(nv))kind='status';
  else if(header.includes('category')||header==='type'||header.includes('relation')||header.includes('side')||header.includes('role')||header.includes('event')||categorySet.has(nv))kind='category';
  if(!kind&&td.querySelector('.mini')){const first=td.querySelector('.mini').textContent.split('•')[0].trim();if(categorySet.has(semNorm(first))){kind='category';value=first}}
  if(kind==='category'){const c='tone-cat-'+semHash(value);td.classList.add('tone-category-cell',c);if(sel){clearSem(sel);sel.classList.add('tone-chip','tone-category',c)}}
  else if(kind==='priority'){const tone=semPriorityTone(value);td.classList.add('tone-priority-cell','tone-'+tone);if(sel){clearSem(sel);sel.classList.add('tone-chip','tone-priority','tone-'+tone)}if(rank[tone]>bestRank){best=tone;bestRank=rank[tone]}}
  else if(kind==='status'){const tone=semStatusTone(value);td.classList.add('tone-status-cell','tone-'+tone);if(sel){clearSem(sel);sel.classList.add('tone-chip','tone-status','tone-'+tone)}if(badge){clearSem(badge);badge.classList.add('tone-chip','tone-status','tone-'+tone)}if(rank[tone]>bestRank){best=tone;bestRank=rank[tone]}}
 });
 if(best)tr.classList.add('tone-row-'+best);
}
function normalizeActionHeader(tr,actionCell){
 const head=tr.closest('table')?.querySelector('thead tr');if(!head||!actionCell)return;
 [...head.children].filter(th=>th.dataset.actionsHead==='1'||semNorm(th.textContent)==='actions').forEach(th=>th.remove());
 while(head.children.length>tr.children.length){const blanks=[...head.children].filter(th=>!th.textContent.trim());if(!blanks.length)break;blanks[blanks.length-1].remove()}
 while(head.children.length<tr.children.length)head.appendChild(document.createElement('th'));
 const idx=[...tr.children].indexOf(actionCell),th=head.children[idx]||head.appendChild(document.createElement('th'));th.textContent='Actions';th.dataset.actionsHead='1';
}
function addRowActions(tr,module,id){
 if(!tr)return;
 let buttons=[...tr.querySelectorAll('button')].filter(b=>b.dataset.rowActions==='1'||semNorm(b.textContent)==='actions'),primary=buttons[0]||null;
 buttons.slice(1).forEach(b=>{const c=b.closest('td');b.remove();if(c&&!c.children.length&&!c.textContent.trim())c.remove()});
 let actionCell=primary?.closest('td')||null;
 const legacy=tr.querySelector('[data-del]');if(!actionCell&&legacy){actionCell=legacy.closest('td');legacy.remove()}
 const pay=tr.querySelector('[data-pay]');if(!actionCell&&pay)actionCell=pay.closest('td');
 if(!actionCell){
  const last=tr.lastElementChild;
  if(last&&last.tagName==='TD'&&!last.hasAttribute('data-evidence')&&!last.textContent.trim()&&!last.children.length)actionCell=last;
 }
 if(!actionCell){actionCell=document.createElement('td');tr.appendChild(actionCell)}
 actionCell.classList.add('action-cell');
 if(!primary){primary=document.createElement('button');primary.type='button';primary.className='btn alt action-button';primary.textContent='Actions';primary.dataset.rowActions='1';actionCell.appendChild(primary)}
 primary.dataset.rowActions='1';primary.classList.add('action-button');primary.onclick=()=>openRecordActions(module,id);
 if(pay&&pay.closest('td')!==actionCell){const old=pay.closest('td');actionCell.insertBefore(pay,primary);if(old&&!old.children.length&&!old.textContent.trim())old.remove()}
 [...tr.querySelectorAll('button')].filter(b=>b!==primary&&semNorm(b.textContent)==='actions').forEach(b=>{const c=b.closest('td');b.remove();if(c&&!c.children.length&&!c.textContent.trim())c.remove()});
 if(actionCell.hasAttribute('data-evidence')){const fresh=document.createElement('td');tr.appendChild(fresh);fresh.classList.add('action-cell');fresh.appendChild(primary);actionCell=fresh}normalizeActionHeader(tr,actionCell);decorateSemanticRow(tr);
}

if(!window.__semanticTableListener){window.__semanticTableListener=true;document.addEventListener('change',e=>{const tr=e.target.closest?.('tbody tr');if(tr)setTimeout(()=>decorateSemanticRow(tr),0)});}
function addCardActions(card,module,id){if(!card||card.querySelector('[data-card-actions]'))return;const d=document.createElement('div'),b=document.createElement('button');d.className='card-actions';b.type='button';b.className='btn alt';b.textContent='Actions';b.dataset.cardActions='1';b.onclick=()=>openRecordActions(module,id);d.appendChild(b);card.appendChild(d)}

function renderDashboard(){updateKpis();updateCountdown();updateProgress();const box=document.querySelector('#dashboardAlerts');if(box){const alerts=[];if((expenseById('jewellery')?.status||'').includes('Provisional'))alerts.push('Jewellery payment status still needs confirmation.');if(state.data.calendar.find(x=>x.id==='cal7')?.status.includes('Needs'))alerts.push('Khora reception date is still tentative — verify before final invitations.');if(state.data.contacts.find(x=>x.id==='c-pandit')?.status.includes('Needs'))alerts.push('Pandit phone number is marked for confirmation.');if(totals().afterReserve<0)alerts.push('Expected budget is eating into the ₹50,000 emergency reserve.');box.innerHTML=alerts.map(x=>'<div class="alert">'+x+'</div>').join('')||'<div class="alert good">No critical confirmation warnings.</div>'}
 const ev=document.querySelector('#eventCostSummary');if(ev){const buckets=eventCostBuckets();ev.innerHTML=Object.entries(buckets).map(([k,v])=>'<div class="mini-card"><span>'+k+'</span><b>'+money(v.expected)+'</b><small>Actual '+money(v.actual)+'</small></div>').join('')}
}
function eventCostBuckets(){const out={Tilak:{expected:0,actual:0},Matkor:{expected:0,actual:0},Shadi:{expected:0,actual:0},Bahubhoj:{expected:0,actual:0},Reception:{expected:0,actual:0},'Common / Gifting / Travel':{expected:0,actual:0}};state.data.expenses.filter(e=>!e.financialDetailOnly).forEach(e=>{const s=(e.event||'').toLowerCase();let k='Common / Gifting / Travel';if(s.includes('tilak'))k='Tilak';else if(s.includes('matkor'))k='Matkor';else if(s.includes('shadi'))k='Shadi';else if(s.includes('bahubhoj'))k='Bahubhoj';else if(s.includes('10 dec')||s.includes('reception'))k='Reception';out[k].expected+=+e.expected||0;out[k].actual+=+e.actual||0});
 const childTotals=new Map();
 for(const e of state.data.expenses.filter(x=>x.financialDetailOnly&&x.rolledIntoExpenseId)){
   const c=childTotals.get(e.rolledIntoExpenseId)||{expected:0,actual:0};
   c.expected+=linkAmount(e.expected);c.actual+=linkAmount(e.actual);childTotals.set(e.rolledIntoExpenseId,c);
 }
 for(const [parentId,c] of childTotals){
   const p=state.data.expenses.find(e=>e.id===parentId);if(!p)continue;
   out['Common / Gifting / Travel'].expected+=Math.max(0,c.expected-linkAmount(p.expected));
   out['Common / Gifting / Travel'].actual+=Math.max(0,c.actual-linkAmount(p.actual));
 }
 return out}


function setupExpenseFilters(){
 const cat=document.querySelector('#expenseCat'),search=document.querySelector('#expenseSearch');
 if(cat){
  const current=cat.value||'All';
  const categories=['All',...new Set((state.data.expenses||[]).map(x=>x.category).filter(Boolean)),...((window.APP_OPTIONS&&window.APP_OPTIONS.expenseCategories)||[])];
  cat.innerHTML='';
  [...new Set(categories)].forEach(v=>cat.add(new Option(v,v)));
  cat.value=[...cat.options].some(o=>o.value===current)?current:'All';
  cat.onchange=renderExpenses;
 }
 if(search)search.oninput=renderExpenses;
}

function renderExpenses(){
 const body=document.querySelector('#expenseBody');if(!body)return;const q=(document.querySelector('#expenseSearch')?.value||'').toLowerCase(),cat=document.querySelector('#expenseCat')?.value||'All';body.innerHTML='';
 state.data.expenses.filter(x=>(cat==='All'||x.category===cat)&&(!q||(x.item+' '+x.category+' '+x.event+' '+x.status).toLowerCase().includes(q))).forEach(x=>{
  const tr=document.createElement('tr');
  tr.innerHTML='<td><b>'+hEsc(x.item)+'</b><div class="mini">'+hEsc(x.category)+' • '+hEsc(x.event)+(x.financialDetailOnly?' • Itemized within grouped budget':'')+'</div></td><td><input type="number" min="0" data-k="expected" value="'+x.expected+'"></td><td><input type="number" min="0" data-k="actual" value="'+x.actual+'"></td><td><input type="number" min="0" data-k="paid" value="'+x.paid+'"></td><td class="money">'+money(Math.max(0,(+x.actual||0)-(+x.paid||0)))+'</td><td>'+selectMarkup('expenseStatuses',x.status,'data-status')+'</td><td data-evidence></td>';
  tr.querySelectorAll('input').forEach(inp=>{if(x.sourceType==='familyWearables'&&inp.dataset.k!=='paid'){inp.disabled=true;inp.title='Edit amount from Family Checklist';}inp.addEventListener('change',async()=>{const val=Math.max(0,+inp.value||0);setField(x,inp.dataset.k,val,'Expenses',x.item);if(state.data.familyClothing.some(r=>r.expenseId===x.id))distributeToFamily(x.id,inp.dataset.k,val);if(x.id==='jewellery'&&inp.dataset.k!=='expected'&&state.data.jewelleryRegister.length===1)state.data.jewelleryRegister[0][inp.dataset.k==='actual'?'amount':'paid']=val;await save();renderExpenses();updateKpis()})});
  tr.querySelector('[data-status]').addEventListener('change',async e=>{setField(x,'status',e.target.value,'Expenses',x.item);await save();renderExpenses()});
  body.appendChild(tr);addRowActions(tr,'expense',x.id);window.renderRowEvidenceCell?.(tr.querySelector('[data-evidence]'),'expense',x.id,x.item);
 });updateKpis();
}

function addExpenseFromForm(){const f=document.querySelector('#addExpenseForm');if(!f)return;f.addEventListener('submit',async e=>{e.preventDefault();const fd=new FormData(f),r={id:uid('e'),category:fd.get('category')||'Miscellaneous',item:fd.get('item')||'New item',event:fd.get('event')||'',expected:+fd.get('expected')||0,actual:+fd.get('actual')||0,paid:+fd.get('paid')||0,status:fd.get('status')||'Pending',notes:fd.get('notes')||''};state.data.expenses.push(r);audit('Expenses',r.item,'create','',JSON.stringify(r));await save('Expense added');f.reset();renderExpenses()})}

function vendorExpenseId(v){
  if(!v)return null;
  if(VENDOR_LINK[v.id])return VENDOR_LINK[v.id];
  if(v.expenseId)return v.expenseId;
  const e=(state.data.expenses||[]).find(x=>x.category==='Booked Vendors'&&x.item===v.name&&(x.notes||'').includes('Added from Vendors'));
  if(e){v.expenseId=e.id;return e.id}
  return null;
}
function renderVendors(){
 const body=document.querySelector('#vendorBody');if(!body)return;body.innerHTML='';
 state.data.vendors.forEach(v=>{
  const e=expenseById(vendorExpenseId(v)),total=e?(+e.actual||+e.expected||0):(+v.total||0),paid=e?(+e.paid||0):(+v.paid||0),status=e?e.status:v.status;
  const tr=document.createElement('tr');
  tr.innerHTML='<td><b>'+hEsc(v.name)+'</b><div class="mini">'+selectMarkup('vendorCategories',v.category,'data-vk="category"')+'</div></td><td>'+selectMarkup('events',v.event,'data-vk="event"')+'</td><td><input type="number" data-total value="'+total+'"></td><td><input type="number" data-paid value="'+paid+'"></td><td class="money">'+money(Math.max(0,total-paid))+'</td><td>'+selectMarkup('expenseStatuses',status,'data-vk="status"',window.APP_OPTIONS?.vendorStatuses||[])+'</td><td data-evidence></td>';
  tr.querySelectorAll('select[data-vk]').forEach(s=>s.addEventListener('change',async()=>{if(s.dataset.vk==='status'){if(e)setField(e,'status',s.value,'Vendors',v.name);else setField(v,'status',s.value,'Vendors',v.name)}else setField(v,s.dataset.vk,s.value,'Vendors',v.name);await save();renderVendors()}));
  tr.querySelector('[data-total]').addEventListener('change',async ev=>{const val=Math.max(0,+ev.target.value||0);if(e){setField(e,'actual',val,'Vendors',v.name);if(!e.expected)e.expected=val}else v.total=val;await save();renderVendors();updateKpis()});
  tr.querySelector('[data-paid]').addEventListener('change',async ev=>{const val=Math.max(0,+ev.target.value||0);if(e)setField(e,'paid',val,'Vendors',v.name);else v.paid=val;await save();renderVendors();updateKpis()});
  body.appendChild(tr);addRowActions(tr,'vendor',v.id);window.renderRowEvidenceCell?.(tr.querySelector('[data-evidence]'),'vendor',v.id,v.name);
 });renderVendorScopes();
}

function renderVendorScopes(){const root=document.querySelector('#vendorScopes');if(!root)return;root.innerHTML=state.data.vendorScopes.map(v=>'<div class="scope-card"><b>'+v.vendor+'</b><p>'+v.scope+'</p><small>⚠ '+v.warning+'</small><label><input type="checkbox" data-scope="'+v.id+'" '+(v.verified?'checked':'')+'> Scope verified</label></div>').join('');root.querySelectorAll('[data-scope]').forEach(i=>i.addEventListener('change',async()=>{const v=state.data.vendorScopes.find(x=>x.id===i.dataset.scope);setField(v,'verified',i.checked,'Vendor Scope',v.vendor);await save()}))}
function addVendorForm(){const f=document.querySelector('#addVendorForm');if(!f)return;f.addEventListener('submit',async e=>{e.preventDefault();const fd=new FormData(f),total=+fd.get('total')||0,paid=+fd.get('paid')||0,id=uid('v'),expId=uid('vendor-exp');state.data.vendors.push({id,expenseId:expId,name:fd.get('name'),category:fd.get('category'),total,paid,balance:total-paid,status:'Booked',phone:fd.get('phone')||'',event:fd.get('event')||'',notes:''});state.data.expenses.push({id:expId,category:'Booked Vendors',item:fd.get('name'),event:fd.get('event')||'',expected:total,actual:total,paid,status:'Booked',notes:'Added from Vendors'});await save('Vendor added');f.reset();renderVendors()})}


function shoppingExpenseId(s){
 if(!s)return null;
 if(s.expenseId)return s.expenseId;
 if(typeof SHOP_LINK!=='undefined'&&SHOP_LINK[s.id])return SHOP_LINK[s.id];
 const e=(state.data.expenses||[]).find(x=>(x.notes||'').includes('Shopping item ID: '+s.id));
 if(e){s.expenseId=e.id;return e.id}
 return null;
}
function syncShoppingExpense(s){
 if(!s)return null;
 let eid=shoppingExpenseId(s),e=eid?expenseById(eid):null;
 if(!e){
   eid='shop-exp-'+s.id;
   e={id:eid,category:s.expenseCategory||'Food & Shopping',item:s.name||'Shopping item',event:s.event||'Wedding stay',expected:0,actual:0,paid:0,status:s.status||'Pending',notes:'Auto-linked from Shopping • Shopping item ID: '+s.id};
   state.data.expenses.push(e);s.expenseId=eid;
 }
 if(s.purchaseBatchesEnabled){
   const batchList=Array.isArray(s.purchaseBatches)?s.purchaseBatches:[];
   let purchased=0,total=0;
   for(const b of batchList){
     const q=Math.max(0,Number(b.quantity)||0),price=Math.max(0,Number(b.unitPrice)||0);
     const rowTotal=b.legacy?Math.max(0,Number(b.amount)||0):Math.round(q*price*100)/100;
     purchased+=q;total+=rowTotal;
     if(b.paymentId){
       const payment=(state.data.cashLedger||[]).find(p=>p.id===b.paymentId);
       b.paid=payment&&payment.type==='Recorded payment'?Math.max(0,Number(payment.amount)||0):0;
     }
   }
   s.completedQty=normalizeShoppingQty(purchased,s.unit);
   e.actual=Math.round(total*100)/100;
   if(s.autoCalc)e.expected=Math.round(Math.max(0,Number(s.targetQty)||0)*Math.max(0,Number(s.unitPrice)||0)*100)/100;
   s.paid=Math.max(0,Number(e.paid)||0);
   if(s.status!=='Skipped')s.status=s.targetQty>0?(s.completedQty>=s.targetQty?'Purchased':s.completedQty>0?'Partially Purchased':'Pending'):'Pending';
   e.status=s.status||e.status;e.item=s.name||e.item;e.category=s.expenseCategory||e.category;e.event=s.event||e.event;
   return e;
 }
 if(s.autoCalc){
   const target=Math.max(0,+s.targetQty||0),done=Math.max(0,+s.completedQty||0),planPrice=Math.max(0,+s.unitPrice||0),actualPrice=Math.max(0,+(s.actualUnitPrice||s.unitPrice)||0);
   e.expected=Math.round(target*planPrice*100)/100;
   e.actual=Math.round(done*actualPrice*100)/100;
   e.paid=Math.max(0,+s.paid||0);
   e.status=s.status||'Pending';
   e.item=s.name||e.item;
   e.category=s.expenseCategory||e.category||'Food & Shopping';
   e.event=s.event||e.event||'Wedding stay';
 }
 return e;
}
function syncFoodShoppingItems(){
 const fp=state.data.foodPlan||{},buf=1+foodNum((fp.stayAssumptions||{}).bufferPct)/100;
 (fp.stayItems||[]).forEach(item=>{
   if(item.shoppingEnabled===false)return;
   const qty=stayFoodBasisCount(item.basis)*foodNum(item.rate)*buf;
   let s=item.shoppingId?(state.data.shopping||[]).find(x=>x.id===item.shoppingId):null;
   if(!s){
     s={id:uid('shop-food'),name:item.item,market:item.market||'Local / wholesale market',targetQty:Math.round(qty*100)/100,completedQty:0,unit:item.unit,unitPrice:foodNum(item.unitPrice),actualUnitPrice:foodNum(item.unitPrice),paid:0,status:'Pending',autoCalc:true,expenseCategory:'Bihar Food',event:'Daily guest stay',source:'foodPlan',sourceId:item.id};
     state.data.shopping.push(s);item.shoppingId=s.id;
   }
   s.name=item.item;s.targetQty=Math.round(qty*100)/100;s.unit=item.unit;s.unitPrice=foodNum(item.unitPrice);s.autoCalc=true;s.expenseCategory='Bihar Food';s.event='Daily guest stay';s.source='foodPlan';s.sourceId=item.id;
   syncShoppingExpense(s);
   item.expenseId=s.expenseId;
 });
}

function shoppingCategoryOptions(current){
 const preset=[
  'Booked Vendors','Bihar Food','Food & Shopping','Clothing','Jewellery & Gifts','Bride Gifts',
  'Decoration & Flowers','Tent / Furniture / Setup','Photography & Videography','Entertainment / Music',
  'Rituals / Puja','Invitations / Printing','Transport / Baraat','Travel / Fuel / Tolls',
  'Accommodation / Rooms','Guest Supplies / Hospitality','Kitchen / Catering Supplies',
  'Household / Daily Stay','Disposable / Serving Items','Electrical / Lighting / Generator',
  'Cleaning / Toiletries','Medical / Emergency','Groom Essentials','Bride Essentials',
  'Family Essentials','Gifts / Shagun / Return Gifts','Operations / Labour','Miscellaneous'
 ];
 const existing=(state.data.expenses||[]).map(x=>x.category).filter(Boolean);
 const shoppingExisting=(state.data.shopping||[]).map(x=>x.expenseCategory).filter(Boolean);
 const vals=[...new Set([...preset,...existing,...shoppingExisting])];
 if(current&&!vals.includes(current))vals.unshift(current);
 return vals;
}
function shoppingEventOptions(current){
 const preset=['Pre-wedding','Wedding stay','Daily guest stay','Tilak','Matkor','Shadi','Baraat','Bahubhoj','Khora Reception','Bihar functions','All functions','Gifting','Travel','Post-wedding','Home setup','Common / General'];
 const fromCommands=(state.data.eventCommands||[]).map(x=>x.event).filter(Boolean);
 const fromCalendar=(state.data.calendar||[]).filter(x=>String(x.type||'').toLowerCase()==='function').map(x=>x.title).filter(Boolean);
 const expenseEvents=(state.data.expenses||[]).map(x=>x.event).filter(Boolean);
 const vals=[...new Set([...preset,...fromCommands,...fromCalendar,...expenseEvents])];
 if(current&&!vals.includes(current))vals.unshift(current);
 return vals;
}
function shoppingSelectOptions(vals,current,customLabel){
 return vals.map(v=>'<option value="'+hEsc(v)+'" '+(String(v)===String(current)?'selected':'')+'>'+hEsc(v)+'</option>').join('')+
   '<option value="__custom__">'+hEsc(customLabel||'Other / Custom')+'</option>';
}

function shoppingProfile(category){
 const c=String(category||'').toLowerCase();
 const base={qtyLabel:'Required quantity',boughtLabel:'Purchased quantity',planPriceLabel:'Planned ₹ / unit',actualPriceLabel:'Actual ₹ / unit',marketLabel:'Shop / market',units:['pcs','pack','box','set','kg','L','dozen','bag'],defaultUnit:'pcs',itemPlaceholder:'Item name'};
 if(c.includes('jewellery')||c.includes('bride gifts')||c.includes('gifts / shagun')){
   return {...base,qtyLabel:'Items / pieces required',boughtLabel:'Items / pieces purchased',planPriceLabel:'Planned ₹ / item',actualPriceLabel:'Actual ₹ / item',marketLabel:'Jeweller / shop',units:['pcs','set','pair','g'],defaultUnit:'pcs',itemPlaceholder:'e.g. Mangal Sutra, ring, chain'};
 }
 if(c.includes('clothing')||c.includes('groom essentials')||c.includes('bride essentials')||c.includes('family essentials')){
   return {...base,qtyLabel:'Pieces / sets required',boughtLabel:'Pieces / sets purchased',planPriceLabel:'Planned ₹ / piece',actualPriceLabel:'Actual ₹ / piece',marketLabel:'Shop / tailor',units:['pcs','set','pair'],defaultUnit:'pcs',itemPlaceholder:'e.g. Sherwani, saree, kurta set'};
 }
 if(c.includes('food')||c.includes('kitchen')||c.includes('household / daily stay')){
   return {...base,qtyLabel:'Required food quantity',boughtLabel:'Purchased food quantity',planPriceLabel:'Planned ₹ / unit',actualPriceLabel:'Actual ₹ / unit',marketLabel:'Grocery / wholesale shop',units:['kg','L','pcs','pack','box','dozen','bag'],defaultUnit:'kg',itemPlaceholder:'e.g. Rice, atta, milk, tea'};
 }
 if(c.includes('disposable')||c.includes('guest supplies')||c.includes('cleaning')){
   return {...base,qtyLabel:'Required count / packs',boughtLabel:'Purchased count / packs',planPriceLabel:'Planned ₹ / pack or item',actualPriceLabel:'Actual ₹ / pack or item',marketLabel:'Shop / wholesaler',units:['pcs','pack','box','set','dozen','bag'],defaultUnit:'pack',itemPlaceholder:'e.g. Plates, glasses, toiletries'};
 }
 if(c.includes('decoration')||c.includes('tent / furniture')){
   return {...base,qtyLabel:'Required sets / quantity',boughtLabel:'Booked / purchased quantity',planPriceLabel:'Planned ₹ / set or unit',actualPriceLabel:'Actual ₹ / set or unit',marketLabel:'Decorator / rental shop',units:['set','pcs','ft','m','kg','lot','day'],defaultUnit:'set',itemPlaceholder:'e.g. Flower set, chair covers, backdrop'};
 }
 if(c.includes('invitation')||c.includes('printing')){
   return {...base,qtyLabel:'Cards / copies required',boughtLabel:'Cards / copies printed',planPriceLabel:'Planned ₹ / card or copy',actualPriceLabel:'Actual ₹ / card or copy',marketLabel:'Printer / card shop',units:['pcs','copy','card','box','pack'],defaultUnit:'pcs',itemPlaceholder:'e.g. Invitation card, envelope, banner'};
 }
 if(c.includes('accommodation')||c.includes('rooms')){
   return {...base,qtyLabel:'Room-nights required',boughtLabel:'Room-nights booked',planPriceLabel:'Planned ₹ / room-night',actualPriceLabel:'Actual ₹ / room-night',marketLabel:'Hotel / property',units:['room-night','room','night'],defaultUnit:'room-night',itemPlaceholder:'e.g. Guest rooms, lodge booking'};
 }
 if(c.includes('transport')||c.includes('baraat')){
   return {...base,qtyLabel:'Vehicles / trips required',boughtLabel:'Vehicles / trips booked',planPriceLabel:'Planned ₹ / vehicle or trip',actualPriceLabel:'Actual ₹ / vehicle or trip',marketLabel:'Transport provider',units:['vehicle','trip','bus','car','tempo','day'],defaultUnit:'vehicle',itemPlaceholder:'e.g. Bus, car, tempo traveller'};
 }
 if(c.includes('travel')||c.includes('fuel')||c.includes('tolls')){
   return {...base,qtyLabel:'Trips / distance / fuel quantity',boughtLabel:'Used / purchased quantity',planPriceLabel:'Planned ₹ / selected unit',actualPriceLabel:'Actual ₹ / selected unit',marketLabel:'Fuel station / travel provider',units:['trip','km','L','vehicle','day'],defaultUnit:'trip',itemPlaceholder:'e.g. Diesel, tolls, outstation trip'};
 }
 if(c.includes('photography')||c.includes('entertainment')||c.includes('operations / labour')||c.includes('electrical')||c.includes('booked vendors')){
   return {...base,qtyLabel:'Packages / days required',boughtLabel:'Packages / days booked',planPriceLabel:'Planned ₹ / package or day',actualPriceLabel:'Actual ₹ / package or day',marketLabel:'Vendor / service provider',units:['package','day','job','set','hour'],defaultUnit:'package',itemPlaceholder:'e.g. DJ package, generator, photography'};
 }
 if(c.includes('rituals')||c.includes('puja')){
   return {...base,qtyLabel:'Required quantity / sets',boughtLabel:'Purchased quantity / sets',planPriceLabel:'Planned ₹ / unit or set',actualPriceLabel:'Actual ₹ / unit or set',marketLabel:'Puja shop / market',units:['set','pcs','pack','kg','L'],defaultUnit:'set',itemPlaceholder:'e.g. Puja samagri, kalash, ghee'};
 }
 if(c.includes('medical')){
   return {...base,qtyLabel:'Required packs / items',boughtLabel:'Purchased packs / items',planPriceLabel:'Planned ₹ / pack or item',actualPriceLabel:'Actual ₹ / pack or item',marketLabel:'Pharmacy / medical shop',units:['pack','pcs','box','kit'],defaultUnit:'pack',itemPlaceholder:'e.g. First-aid kit, medicines'};
 }
 return base;
}

function shoppingQtyStep(unit){return 1;}
function normalizeShoppingQty(value,unit){
 // Preserve historical fractional entries until explicitly corrected by the user.
 // Only NEW edits must be whole numbers; never round archived quantities silently.
 return Math.max(0,Number(value)||0);
}
function displayShoppingQty(value,unit){return String(normalizeShoppingQty(value,unit));}
function checkWholeShoppingQty(raw,field='Quantity'){
 const v=Number(raw);
 if(String(raw??'').trim()===''||!Number.isFinite(v)||v<0||!Number.isSafeInteger(v)){
  alert(field+' must be a whole number: 0, 1, 2, 3… (no decimals).');
  return false;
 }
 return true;
}
function normalizeLegacyShoppingQuantities(s){
 if(!s)return false;
 const p=shoppingProfile(s.expenseCategory||''),unit=s.unit||p.defaultUnit;
 let changed=false;
 if(!s.unit){s.unit=unit;changed=true}
 const tq=normalizeShoppingQty(s.targetQty,unit),cq=normalizeShoppingQty(s.completedQty,unit);
 if(+s.targetQty!==tq){s.targetQty=tq;changed=true}
 if(+s.completedQty!==cq){s.completedQty=cq;changed=true}
 return changed;
}
function updateShoppingFormProfile(){
 const f=document.querySelector('#addShoppingForm');if(!f)return;
 const cat=f.querySelector('[name="category"]');
 const category=cat&&cat.value!=='__custom__'?cat.value:'';
 const p=shoppingProfile(category);
 const map={targetQty:p.qtyLabel,completedQty:p.boughtLabel,unitPrice:p.planPriceLabel,actualUnitPrice:p.actualPriceLabel,market:p.marketLabel};
 Object.entries(map).forEach(([name,label])=>{
   const el=f.querySelector('[name="'+name+'"]');if(!el)return;
   const lab=el.closest('.field')?.querySelector('label');if(lab)lab.textContent=label;
 });
 const item=f.querySelector('[name="name"]');if(item)item.placeholder=p.itemPlaceholder;
 const unit=f.querySelector('[name="unit"]');
 if(unit){
   const prev=unit.value;
   unit.innerHTML=p.units.map(x=>'<option value="'+hEsc(x)+'">'+hEsc(x)+'</option>').join('');
   unit.value=p.units.includes(prev)?prev:p.defaultUnit;
   const applyQtyStep=()=>{
     const step=shoppingQtyStep(unit.value);
     ['targetQty','completedQty'].forEach(name=>{const el=f.querySelector('[name="'+name+'"]');if(el){el.step='1';el.min='0';el.inputMode='numeric';}});
   };
   unit.onchange=applyQtyStep;
   applyQtyStep();
 }
}
function setupShoppingFormSelectors(){
 const f=document.querySelector('#addShoppingForm');if(!f)return;
 const cat=f.querySelector('[name="category"]'),evt=f.querySelector('[name="event"]');
 const customCat=f.querySelector('[name="customCategory"]'),customEvt=f.querySelector('[name="customEvent"]');
 if(cat){
   cat.innerHTML='<option value="">Choose category…</option>'+shoppingSelectOptions(shoppingCategoryOptions(''),'','Other / Custom category');
   cat.onchange=()=>{if(customCat)customCat.hidden=cat.value!=='__custom__';updateShoppingFormProfile()};
 }
 if(evt){
   evt.innerHTML='<option value="">Choose event / purpose…</option>'+shoppingSelectOptions(shoppingEventOptions(''),'','Other / Custom event');
   evt.onchange=()=>{if(customEvt)customEvt.hidden=evt.value!=='__custom__'};
 }
 updateShoppingFormProfile();
}
function renderShopping(){
 const root=document.querySelector('#shoppingGrid');if(!root)return;root.innerHTML='';
 state.data.shopping.forEach(s=>{
  const guessedCategory=s.expenseCategory||expenseById(shoppingExpenseId(s))?.category||'';
  if(!s.expenseCategory&&guessedCategory)s.expenseCategory=guessedCategory;
  normalizeLegacyShoppingQuantities(s);
  const e=syncShoppingExpense(s),expected=e?+e.expected||0:+s.expected||0,actual=e?+e.actual||0:+s.actual||0,paid=e?+e.paid||0:+s.paid||0,p=shoppingProfile(s.expenseCategory||e?.category||'');
  const qstep=shoppingQtyStep(s.unit),target=normalizeShoppingQty(s.targetQty,s.unit),done=normalizeShoppingQty(s.completedQty,s.unit),pending=Math.max(0,target-done),pct=progressPct(done,target);
  const c=document.createElement('div');c.className='cost-card';
  c.innerHTML='<h3>'+hEsc(s.name)+'</h3><div class="mini">'+hEsc(s.market||'')+(s.source==='foodPlan'?' • Auto from Food Planner':'')+'</div>'+
   '<div class="partial-grid"><label>Category<select data-shop-meta="expenseCategory">'+shoppingSelectOptions(shoppingCategoryOptions(s.expenseCategory||e?.category||''),s.expenseCategory||e?.category||'','Other / Custom')+'</select></label><label>Event / Purpose<select data-shop-meta="event">'+shoppingSelectOptions(shoppingEventOptions(s.event||e?.event||''),s.event||e?.event||'','Other / Custom')+'</select></label><label>Unit<b>'+hEsc(s.unit||'')+'</b></label></div>'+
   '<div class="partial-grid"><label>'+hEsc(p.qtyLabel)+'<input type="number" min="0" step="'+qstep+'" data-q="targetQty" value="'+displayShoppingQty(target,s.unit)+'"></label><label>'+hEsc(p.boughtLabel)+'<input type="number" min="0" step="'+qstep+'" data-q="completedQty" value="'+displayShoppingQty(done,s.unit)+'"></label><label>Pending<b>'+displayShoppingQty(pending,s.unit)+' '+hEsc(s.unit||'')+'</b></label></div>'+
   '<div class="mini-progress"><span style="width:'+pct+'%"></span></div><div class="mini">'+displayShoppingQty(done,s.unit)+' / '+displayShoppingQty(target,s.unit)+' '+hEsc(s.unit||'')+' purchased • '+pct+'%</div>'+
   (s.autoCalc?'<div class="costrow"><span>'+hEsc(p.planPriceLabel)+'</span><span>₹</span><input type="number" min="0" step="0.01" data-shop-price="unitPrice" value="'+Math.max(0,+s.unitPrice||0)+'"></div>'+
   '<div class="costrow"><span>'+hEsc(p.actualPriceLabel)+'</span><span>₹</span><input type="number" min="0" step="0.01" data-shop-price="actualUnitPrice" value="'+Math.max(0,+(s.actualUnitPrice||s.unitPrice)||0)+'"></div>':'')+
   '<div class="costrow"><span>Expected</span><span>₹</span><input type="number" '+(s.autoCalc?'readonly':'data-k="expected"')+' value="'+expected+'"></div>'+
   '<div class="costrow"><span>Actual</span><span>₹</span><input type="number" '+(s.autoCalc?'readonly':'data-k="actual"')+' value="'+actual+'"></div>'+
   '<div class="costrow"><span>Paid</span><span>₹</span><input type="number" data-paid value="'+paid+'"></div>'+
   '<div class="statline"><span>Status</span><select data-status><option>Pending</option><option>Partially Purchased</option><option>Purchased</option><option>Skipped</option></select></div>'+
   '<div class="card-evidence"><span>Evidence</span><div data-evidence></div></div>';
  c.querySelector('[data-status]').value=s.status||'Pending';
  c.querySelectorAll('input[data-k]').forEach(i=>i.addEventListener('change',async()=>{const val=Math.max(0,+i.value||0);if(e)setField(e,i.dataset.k,val,'Shopping',s.name);else s[i.dataset.k]=val;await save();renderShopping();updateKpis()}));
  c.querySelectorAll('input[data-q]').forEach(i=>i.addEventListener('change',async()=>{
    if(!checkWholeShoppingQty(i.value,i.dataset.q==='targetQty'?'Required quantity':'Purchased quantity')){i.focus();return;}
    setField(s,i.dataset.q,normalizeShoppingQty(i.value,s.unit),'Shopping',s.name);
    if(s.status!=='Skipped')s.status=s.targetQty>0?(s.completedQty>=s.targetQty?'Purchased':s.completedQty>0?'Partially Purchased':'Pending'):'Pending';
    syncShoppingExpense(s);await save();renderShopping();updateKpis();
  }));
  c.querySelectorAll('[data-shop-meta]').forEach(sel=>sel.addEventListener('change',async()=>{
    let val=sel.value;
    if(val==='__custom__'){
      val=prompt(sel.dataset.shopMeta==='expenseCategory'?'Enter custom shopping category':'Enter custom event / purpose', '')||'';
      if(!val){renderShopping();return}
    }
    setField(s,sel.dataset.shopMeta,val,'Shopping',s.name);
    if(sel.dataset.shopMeta==='expenseCategory'){
      const np=shoppingProfile(val);
      if(!np.units.includes(s.unit))s.unit=np.defaultUnit;
      s.targetQty=normalizeShoppingQty(s.targetQty,s.unit);
      s.completedQty=normalizeShoppingQty(s.completedQty,s.unit);
    }
    syncShoppingExpense(s);await save('Shopping classification updated');renderShopping();updateKpis();
  }));
  c.querySelectorAll('[data-shop-price]').forEach(i=>i.addEventListener('change',async()=>{
    const rate=Math.max(0,+i.value||0);
    if((s.id==='s-1'||s.sareeType==='gifting')&&![250,300,350].includes(rate)){
      alert('Gifting sarees must cost ₹250, ₹300 or ₹350. Use Family Sarees for other prices.');
      renderShopping();return;
    }
    setField(s,i.dataset.shopPrice,rate,'Shopping',s.name);
    syncShoppingExpense(s);await save('Shopping cost recalculated');renderShopping();updateKpis();
  }));
  c.querySelector('[data-paid]').addEventListener('change',async ev=>{setField(s,'paid',Math.max(0,+ev.target.value||0),'Shopping',s.name);syncShoppingExpense(s);await save();renderShopping();updateKpis()});
  c.querySelector('[data-status]').addEventListener('change',async ev=>{setField(s,'status',ev.target.value,'Shopping',s.name);syncShoppingExpense(s);await save();renderShopping();updateKpis()});
  root.appendChild(c);
  if(s.purchaseBatchesEnabled){
   c.querySelectorAll('[data-q="completedQty"],[data-shop-price="actualUnitPrice"],[data-paid]').forEach(input=>{input.readOnly=true;input.title='Calculated from purchase batches or linked payments';});
   c.querySelectorAll('[data-k="actual"]').forEach(input=>{input.readOnly=true;});
  }
  window.renderShoppingBatches?.(c,s);
  addCardActions(c,'shopping',s.id);window.renderRowEvidenceCell?.(c.querySelector('[data-evidence]'),'shopping','shop:'+s.id,s.name);
 });
 renderFamilyClothing();
}

function addShoppingForm(){
 const f=document.querySelector('#addShoppingForm');if(!f||f.dataset.bound)return;f.dataset.bound='1';
 setupShoppingFormSelectors();
 f.addEventListener('submit',async e=>{
   e.preventDefault();const fd=new FormData(f);
   let category=String(fd.get('category')||''),event=String(fd.get('event')||'');
   if(category==='__custom__')category=String(fd.get('customCategory')||'').trim();
   if(event==='__custom__')event=String(fd.get('customEvent')||'').trim();
   if(!category){alert('Choose a shopping category.');return}
   if(!event){alert('Choose an event / purpose.');return}
   const chosenUnit=fd.get('unit')||'pcs';
   if(!checkWholeShoppingQty(fd.get('targetQty')??'0','Required quantity')||!checkWholeShoppingQty(fd.get('completedQty')??'0','Purchased quantity'))return;
   const s={id:uid('shop'),name:fd.get('name')||'Shopping item',market:fd.get('market')||'',targetQty:normalizeShoppingQty(fd.get('targetQty'),chosenUnit),completedQty:normalizeShoppingQty(fd.get('completedQty'),chosenUnit),unit:chosenUnit,unitPrice:Math.max(0,+fd.get('unitPrice')||0),actualUnitPrice:Math.max(0,+fd.get('actualUnitPrice')||+fd.get('unitPrice')||0),paid:Math.max(0,+fd.get('paid')||0),status:'Pending',autoCalc:true,expenseCategory:category,event:event};
   s.status=s.targetQty>0?(s.completedQty>=s.targetQty?'Purchased':s.completedQty>0?'Partially Purchased':'Pending'):'Pending';
   state.data.shopping.push(s);syncShoppingExpense(s);audit('Shopping',s.name,'create','',JSON.stringify(s));
   await save('Shopping item added and expense calculated');f.reset();setupShoppingFormSelectors();renderShopping();updateKpis();window.shoppingUX?.onAdded(s.id);
 });
}

function renderFamilyClothing(){
 const body=document.querySelector('#clothingBody');if(!body)return;body.innerHTML='';
 state.data.familyClothing.forEach(r=>{
  const tr=document.createElement('tr');
  tr.innerHTML='<td><b>'+hEsc(r.person)+'</b><div class="mini">'+hEsc(r.event)+'</div></td><td>'+hEsc(r.item)+'</td><td><input type="number" data-k="expected" value="'+r.expected+'"></td><td><input type="number" data-k="actual" value="'+r.actual+'"></td><td><input type="number" data-k="paid" value="'+r.paid+'"></td><td><select data-fit><option>Pending</option><option>Trial Pending</option><option>Alteration Needed</option><option>Ready</option><option>Done</option><option>N/A</option></select></td><td><input type="checkbox" data-pack '+(r.packed?'checked':'')+'></td><td data-evidence></td>';
  tr.querySelector('[data-fit]').value=r.fitting;
  tr.querySelectorAll('input[type=number]').forEach(i=>i.addEventListener('change',async()=>{const old=r[i.dataset.k],val=Math.max(0,+i.value||0);r[i.dataset.k]=val;audit('Family Clothing',r.person+' '+r.item,i.dataset.k,old,val);syncFamilyToExpense(r.expenseId);await save();renderFamilyClothing();updateKpis()}));
  tr.querySelector('[data-fit]').addEventListener('change',async e=>{setField(r,'fitting',e.target.value,'Family Clothing',r.person+' '+r.item);await save()});
  tr.querySelector('[data-pack]').addEventListener('change',async e=>{setField(r,'packed',e.target.checked,'Family Clothing',r.person+' '+r.item);await save()});
  body.appendChild(tr);addRowActions(tr,'clothing',r.id);window.renderRowEvidenceCell?.(tr.querySelector('[data-evidence]'),'shopping','cloth:'+r.id,r.person+' • '+r.item);
 });
}


function setupTaskFilters(){
 const cat=document.querySelector('#taskCat'),status=document.querySelector('#taskStatus'),search=document.querySelector('#taskSearch');
 if(cat){
  const current=cat.value||'All';
  const cats=['All',...new Set((state.data.tasks||[]).map(t=>t.category).filter(Boolean)),...((window.APP_OPTIONS&&window.APP_OPTIONS.taskCategories)||[])];
  cat.innerHTML='';[...new Set(cats)].forEach(v=>cat.add(new Option(v,v)));cat.value=[...cat.options].some(o=>o.value===current)?current:'All';
  cat.onchange=renderTasks;
 }
 if(status){
  const current=status.value||'All';
  const sts=['All',...((window.APP_OPTIONS&&window.APP_OPTIONS.taskStatuses)||['Pending','In Progress','Waiting on Vendor','Waiting on Family','Blocked','Done','Not Required'])];
  status.innerHTML='';[...new Set(sts)].forEach(v=>status.add(new Option(v,v)));status.value=[...status.options].some(o=>o.value===current)?current:'All';
  status.onchange=renderTasks;
 }
 if(search)search.oninput=renderTasks;
}
function renderTasks(){
 const body=document.querySelector('#taskBody');if(!body)return;
 const q=(document.querySelector('#taskSearch')?.value||'').trim().toLowerCase();
 const cat=document.querySelector('#taskCat')?.value||'All';
 const st=document.querySelector('#taskStatus')?.value||'All';
 body.innerHTML='';
 const rows=(state.data.tasks||[]).filter(t=>
   (cat==='All'||t.category===cat)&&
   (st==='All'||t.status===st)&&
   (!q||(String(t.title||'')+' '+String(t.category||'')+' '+String(t.owner||'')+' '+String(t.priority||'')+' '+String(t.status||'')).toLowerCase().includes(q))
 ).sort((a,b)=>{
   const ad=a.status==='Done'||a.status==='Not Required',bd=b.status==='Done'||b.status==='Not Required';
   return Number(ad)-Number(bd)||String(a.due||'').localeCompare(String(b.due||''))||String(a.title||'').localeCompare(String(b.title||''));
 });
 rows.forEach(t=>{
  const overdue=t.status!=='Done'&&t.status!=='Not Required'&&t.due&&new Date(t.due+'T23:59:59')<new Date();
  const tr=document.createElement('tr');
  tr.innerHTML='<td><b>'+hEsc(t.title||'')+'</b>'+(overdue?'<div class="mini danger">OVERDUE</div>':'')+'</td>'+
   '<td><input type="date" data-k="due" value="'+hEsc(t.due||'')+'"></td>'+
   '<td>'+selectMarkup('taskCategories',t.category,'data-k="category"')+'</td>'+
   '<td>'+selectMarkup('owners',t.owner,'data-k="owner"',['Other / Custom'])+'</td>'+
   '<td>'+selectMarkup('priorities',t.priority,'data-k="priority"')+'</td>'+
   '<td>'+selectMarkup('taskStatuses',t.status,'data-k="status"')+'</td>'+
   '<td><button class="btn warn" data-del>Delete</button></td>';
  tr.querySelectorAll('[data-k]').forEach(el=>el.addEventListener('change',async()=>{
    setField(t,el.dataset.k,el.value,'Tasks',t.title);
    await save('Task updated');
    setupTaskFilters();
    renderTasks();
  }));
  tr.querySelector('[data-del]').addEventListener('click',async()=>{
    if(!confirm('Delete this task?'))return;
    audit('Tasks',t.title,'delete',JSON.stringify(t),'');
    linkPreventTaskReseed(t);
    markDeletedSeedTask(t);
    state.data.tasks=state.data.tasks.filter(x=>x.id!==t.id);
    await save('Task deleted');
    setupTaskFilters();
    renderTasks();
  });
  body.appendChild(tr);addRowActions(tr,'task',t.id);
 });
 const count=document.querySelector('[data-task-count]');
 if(count)count.textContent=(state.data.tasks||[]).filter(x=>x.status!=='Done'&&x.status!=='Not Required').length;
 if(!rows.length)body.innerHTML='<tr><td colspan="7"><div class="empty-state">No tasks match the current filters.</div></td></tr>';
}

function addTaskForm(){
 const f=document.querySelector('#addTaskForm');if(!f)return;
 f.addEventListener('submit',async e=>{
  e.preventDefault();const fd=new FormData(f),title=String(fd.get('title')||'').trim(),k=canonicalTaskKey(title);if(!k)return;
  if((state.data.tasks||[]).some(x=>canonicalTaskKey(x.title)===k)){toast('Task already exists');return}
  clearDeletedTaskSuppression(title);
  const r={id:uid('t'),title,category:fd.get('category'),due:fd.get('due'),status:'Pending',owner:fd.get('owner')||'',priority:fd.get('priority')||'Medium'};
  state.data.tasks.push(r);audit('Tasks',r.title,'create','',JSON.stringify(r));await save('Task added');f.reset();setupTaskFilters();renderTasks();
 });
}

function renderGuests(){
 const body=document.querySelector('#guestBody');if(!body)return;body.innerHTML='';
 const roomNames=(state.data.rooms||[]).map(r=>r.name);
 state.data.guests.forEach(g=>{
  const tr=document.createElement('tr');
  tr.innerHTML='<td><b>'+hEsc(g.name)+'</b></td><td>'+selectMarkup('guestSides',g.side,'data-gk="side"')+'</td><td>'+g.count+'</td><td>'+hEsc(g.city||'')+'</td><td>'+hEsc(g.arrival||'')+'</td><td>'+selectMarkup('',g.room,'data-gk="room"',roomNames.length?roomNames:['Not assigned'])+'</td><td>'+selectMarkup('pickupTypes',g.transport,'data-gk="transport"')+'</td><td><button class="btn warn" data-del>Delete</button></td>';
  tr.querySelectorAll('select[data-gk]').forEach(s=>s.addEventListener('change',async()=>{setField(g,s.dataset.gk,s.value,'Guests',g.name);await save();renderGuests()}));
  tr.querySelector('[data-del]').addEventListener('click',async()=>{audit('Guests',g.name,'delete',JSON.stringify(g),'');state.data.guests=state.data.guests.filter(x=>x.id!==g.id);await save();renderGuests()});body.appendChild(tr);addRowActions(tr,'guest',g.id);
 });
 document.querySelector('[data-guest-count]')&&(document.querySelector('[data-guest-count]').textContent=state.data.guests.reduce((s,g)=>s+(+g.count||0),0));renderRooms();
}
function addGuestForm(){const f=document.querySelector('#addGuestForm');if(!f)return;f.addEventListener('submit',async e=>{e.preventDefault();const fd=new FormData(f),r={id:uid('g'),name:fd.get('name'),side:fd.get('side'),count:+fd.get('count')||1,city:fd.get('city')||'',arrival:fd.get('arrival')||'',room:fd.get('room')||'',transport:fd.get('transport')||''};state.data.guests.push(r);audit('Guests',r.name,'create','',JSON.stringify(r));await save('Guest added');f.reset();renderGuests()})}
function renderRooms(){const body=document.querySelector('#roomBody');if(!body)return;body.innerHTML='';state.data.rooms.forEach(r=>{const tr=document.createElement('tr');tr.innerHTML='<td>'+r.name+'</td><td><input type="number" min="0" step="1" inputmode="numeric" data-k="capacity" value="'+r.capacity+'"></td><td><input type="text" data-k="assigned" value="'+r.assigned+'"></td><td><input type="number" min="0" step="1" inputmode="numeric" data-k="mattresses" value="'+r.mattresses+'"></td><td><input type="number" min="0" step="1" inputmode="numeric" data-k="blankets" value="'+r.blankets+'"></td><td><select data-k="status"><option>Planned</option><option>Ready</option><option>Occupied</option></select></td>';tr.querySelector('[data-k="status"]').value=r.status;tr.querySelectorAll('input,select').forEach(i=>i.addEventListener('change',async()=>{if(i.type==='number'&&!checkWholeShoppingQty(i.value,i.dataset.k+' quantity')){i.focus();return;}const val=i.type==='number'?Math.max(0,+i.value||0):i.value;setField(r,i.dataset.k,val,'Accommodation',r.name);await save()}));body.appendChild(tr);addRowActions(tr,'room',r.id)})}

function renderChecklists(rootSel,obj,prefix=''){const root=document.querySelector(rootSel);if(!root)return;root.innerHTML='';Object.entries(obj).forEach(([g,a])=>{const box=document.createElement('section');box.className='check-group';const done=a.filter((_,i)=>state.checks[prefix+checkKey(g,i)]).length;box.innerHTML='<div class="check-head"><span>'+g+'</span><span class="mini">'+done+'/'+a.length+' done</span></div>';a.forEach((txt,i)=>{const k=prefix+checkKey(g,i),lab=document.createElement('label');lab.className='check'+(state.checks[k]?' done':'');lab.innerHTML='<input type="checkbox" '+(state.checks[k]?'checked':'')+'><span class="txt">'+txt+'</span>';lab.querySelector('input').addEventListener('change',async e=>{state.checks[k]=e.target.checked;audit('Checklist',g,txt,!e.target.checked,e.target.checked);await save();renderChecklists(rootSel,obj,prefix);updateProgress()});box.appendChild(lab)});root.appendChild(box)})}


function addRoomForm(){
 const f=document.querySelector('#addRoomForm');if(!f)return;
 f.addEventListener('submit',async e=>{
  e.preventDefault();const fd=new FormData(f);
  if(['capacity','mattresses','blankets'].some(name=>!checkWholeShoppingQty(fd.get(name)||'0',name)))return;
  const r={id:uid('room'),name:fd.get('name')||'Room / Area',capacity:Math.max(0,+fd.get('capacity')||0),assigned:'',mattresses:Math.max(0,+fd.get('mattresses')||0),blankets:Math.max(0,+fd.get('blankets')||0),status:fd.get('status')||'Planned'};
  state.data.rooms=state.data.rooms||[];state.data.rooms.push(r);audit('Accommodation',r.name,'create','',JSON.stringify(r));await save('Room / area added');f.reset();renderRooms();
 });
}

function renderGifts(){renderGiftingDirectory();renderJewellery();renderBrideGifts()}
function renderGiftingDirectory(){
 const body=document.querySelector('#giftBody');if(!body)return;body.innerHTML='';
 state.data.gifting.forEach(g=>{const tr=document.createElement('tr');tr.innerHTML='<td><input type="text" data-k="name" value="'+hEsc(g.name)+'"></td><td>'+selectMarkup('relations',g.relation,'data-k="relation"')+'</td><td>'+selectMarkup('giftTypes',g.gift,'data-k="gift"')+'</td><td><input type="checkbox" data-k="packed" '+(g.packed?'checked':'')+'></td><td><input type="checkbox" data-k="handed" '+(g.handed?'checked':'')+'></td><td>'+statusBadge(g.status)+'</td><td data-evidence></td>';tr.querySelectorAll('input,select').forEach(i=>i.addEventListener('change',async()=>{const val=i.type==='checkbox'?i.checked:i.value;setField(g,i.dataset.k,val,'Gifting',g.name);await save();renderGiftingDirectory()}));body.appendChild(tr);addRowActions(tr,'gift',g.id);window.renderRowEvidenceCell?.(tr.querySelector('[data-evidence]'),'gift','gift:'+g.id,g.name+' • '+g.gift)})}


function addGiftRecipient(){const f=document.querySelector('#giftForm');if(!f)return;f.addEventListener('submit',async e=>{e.preventDefault();const fd=new FormData(f),r={id:uid('gift'),name:fd.get('name'),relation:fd.get('relation')||'',gift:fd.get('gift')||'Gifting saree',packed:false,handed:false,status:'Planned'};state.data.gifting.push(r);audit('Gifting',r.name,'create','',JSON.stringify(r));await save();f.reset();renderGiftingDirectory()})}
function renderJewellery(){
 const body=document.querySelector('#jewelBody');if(!body)return;body.innerHTML='';
 state.data.jewelleryRegister.forEach(j=>{const tr=document.createElement('tr');tr.innerHTML='<td><input data-k="item" value="'+hEsc(j.item)+'"></td><td>'+selectMarkup('jewelleryRecipients',j.recipient,'data-k="recipient"')+'</td><td><input type="number" data-k="amount" value="'+j.amount+'"></td><td><input type="number" data-k="paid" value="'+j.paid+'"></td><td>'+selectMarkup('custody',j.custody,'data-k="custody"')+'</td><td>'+selectMarkup('confirmationStatuses',j.status,'data-k="status"',['Part-Paid','Paid','Handed Over'])+'</td><td data-evidence></td>';tr.querySelectorAll('input,select').forEach(i=>i.addEventListener('change',async()=>{const val=i.type==='number'?Math.max(0,+i.value||0):i.value;setField(j,i.dataset.k,val,'Jewellery',j.item);syncJewelleryToExpense();await save();renderJewellery();updateKpis()}));body.appendChild(tr);addRowActions(tr,'jewellery',j.id);window.renderRowEvidenceCell?.(tr.querySelector('[data-evidence]'),'gift','jewel:'+j.id,j.item)})}


function addJewellery(){const f=document.querySelector('#jewelForm');if(!f)return;f.addEventListener('submit',async e=>{e.preventDefault();const fd=new FormData(f),r={id:uid('jr'),item:fd.get('item'),recipient:fd.get('recipient')||'',amount:+fd.get('amount')||0,paid:+fd.get('paid')||0,custody:'Not set',invoice:'',status:'Needs Confirmation',notes:''};state.data.jewelleryRegister.push(r);syncJewelleryToExpense();audit('Jewellery',r.item,'create','',JSON.stringify(r));await save();f.reset();renderJewellery();updateKpis()})}
function renderBrideGifts(){
 const body=document.querySelector('#brideGiftBody');if(!body)return;body.innerHTML='';
 state.data.brideGifts.forEach(g=>{const tr=document.createElement('tr');tr.innerHTML='<td>'+hEsc(g.item)+'</td><td><input type="number" data-k="expected" value="'+g.expected+'"></td><td><input type="number" data-k="actual" value="'+g.actual+'"></td><td><input type="checkbox" data-k="packed" '+(g.packed?'checked':'')+'></td><td>'+selectMarkup('brideGiftStatuses',g.status,'data-k="status"')+'</td><td data-evidence></td>';tr.querySelectorAll('input,select').forEach(i=>i.addEventListener('change',async()=>{const val=i.type==='checkbox'?i.checked:i.type==='number'?Math.max(0,+i.value||0):i.value;setField(g,i.dataset.k,val,'Bride Gifts',g.item);syncBrideGifts();await save();renderBrideGifts();updateKpis()}));body.appendChild(tr);addRowActions(tr,'brideGift',g.id);window.renderRowEvidenceCell?.(tr.querySelector('[data-evidence]'),'gift','bridegift:'+g.id,g.item)})}


function renderPayments(){
 const body=document.querySelector('#paymentBody');if(!body)return;body.innerHTML='';
 state.data.cashLedger.forEach(p=>{const tr=document.createElement('tr');tr.innerHTML='<td>'+hEsc(p.date||'')+'</td><td>'+hEsc(p.type)+'</td><td>'+hEsc(p.description)+'</td><td class="money">'+money(p.amount)+'</td><td>'+selectMarkup('paymentModes',p.mode,'data-mode')+'</td><td data-evidence></td>';tr.querySelector('[data-mode]').addEventListener('change',async e=>{setField(p,'mode',e.target.value,'Payments',p.description);await save()});body.appendChild(tr);addRowActions(tr,'payment',p.id);window.renderRowEvidenceCell?.(tr.querySelector('[data-evidence]'),'payment',p.id,p.description)});
 const cashIn=state.data.cashLedger.filter(x=>x.type==='Cash withdrawal'||x.type==='Cash received').reduce((s,x)=>s+(+x.amount||0),0),cashOut=state.data.cashLedger.filter(x=>x.mode==='Cash'&&x.type!=='Cash withdrawal'&&x.type!=='Cash received').reduce((s,x)=>s+(+x.amount||0),0);
 document.querySelector('[data-cash-in]')&&(document.querySelector('[data-cash-in]').textContent=money(cashIn));document.querySelector('[data-cash-out]')&&(document.querySelector('[data-cash-out]').textContent=money(cashOut));document.querySelector('[data-cash-balance]')&&(document.querySelector('[data-cash-balance]').textContent=money(cashIn-cashOut));document.querySelector('[data-recorded-payments]')&&(document.querySelector('[data-recorded-payments]').textContent=money(state.data.cashLedger.filter(x=>x.type==='Recorded payment').reduce((s,x)=>s+(+x.amount||0),0)));
}

function addPayment(){const f=document.querySelector('#paymentForm');if(!f)return;f.addEventListener('submit',async e=>{e.preventDefault();const fd=new FormData(f),r={id:uid('pay'),date:fd.get('date')||new Date().toISOString().slice(0,10),type:fd.get('type'),description:fd.get('description'),amount:+fd.get('amount')||0,mode:fd.get('mode')||'Cash',linkedExpense:''};state.data.cashLedger.unshift(r);audit('Payments',r.description,'create','',JSON.stringify(r));await save();f.reset();renderPayments()})}

function renderContacts(){
 const body=document.querySelector('#contactBody');if(!body)return;body.innerHTML='';
 state.data.contacts.forEach(c=>{
  const tr=document.createElement('tr');
  tr.innerHTML='<td><input data-k="name" value="'+hEsc(c.name)+'"></td><td>'+selectMarkup('contactRoles',c.role,'data-k="role"')+'</td><td><input data-k="phone" value="'+hEsc(c.phone)+'"></td><td><input data-k="address" value="'+hEsc(c.address)+'"></td><td>'+selectMarkup('confirmationStatuses',c.status,'data-k="status"')+'</td>';
  tr.querySelectorAll('input,select').forEach(i=>i.addEventListener('change',async()=>{setField(c,i.dataset.k,i.value,'Contacts',c.name);await save()}));body.appendChild(tr);addRowActions(tr,'contact',c.id);
 });
 const vb=document.querySelector('#vendorContactBody');if(vb){vb.innerHTML='';state.data.vendors.forEach(v=>{const tr=document.createElement('tr');tr.innerHTML='<td>'+hEsc(v.name)+'</td><td>'+hEsc(v.category)+'</td><td><input data-phone value="'+hEsc(v.phone||'')+'"></td><td>'+hEsc(v.event)+'</td>';tr.querySelector('[data-phone]').addEventListener('change',async e=>{setField(v,'phone',e.target.value,'Contacts',v.name);await save()});vb.appendChild(tr);addRowActions(tr,'vendor',v.id)})}
}
function addContact(){const f=document.querySelector('#contactForm');if(!f)return;f.addEventListener('submit',async e=>{e.preventDefault();const fd=new FormData(f),r={id:uid('c'),name:fd.get('name'),role:fd.get('role')||'',phone:fd.get('phone')||'',address:fd.get('address')||'',status:'Confirmed'};state.data.contacts.push(r);audit('Contacts',r.name,'create','',JSON.stringify(r));await save();f.reset();renderContacts()})}

function renderInventory(){
 const body=document.querySelector('#inventoryBody');if(!body)return;body.innerHTML='';
 state.data.inventory.forEach(x=>{const tr=document.createElement('tr');tr.innerHTML='<td>'+selectMarkup('inventoryCategories',x.category,'data-k="category"')+'</td><td><b>'+hEsc(x.item)+'</b></td><td><input type="number" min="0" step="1" inputmode="numeric" data-k="required" value="'+x.required+'"></td><td><input type="number" min="0" step="1" inputmode="numeric" data-k="bought" value="'+x.bought+'"></td><td><input type="number" min="0" step="1" inputmode="numeric" data-k="packed" value="'+x.packed+'"></td><td><input type="number" min="0" step="1" inputmode="numeric" data-k="loaded" value="'+x.loaded+'"></td><td>'+selectMarkup('storageLocations',x.location,'data-k="location"')+'</td><td>'+statusBadge(x.status)+'</td><td data-evidence></td>';tr.querySelectorAll('input,select').forEach(i=>i.addEventListener('change',async()=>{if(i.type==='number'&&!checkWholeShoppingQty(i.value,i.dataset.k+' quantity')){i.focus();return;}const val=i.type==='number'?Math.max(0,+i.value||0):i.value;setField(x,i.dataset.k,val,'Inventory',x.item);x.status=x.loaded>=x.required?'Loaded':x.packed>=x.required?'Packed':x.bought>=x.required?'Bought':'In Progress';await save();renderInventory()}));body.appendChild(tr);addRowActions(tr,'inventory',x.id);window.renderRowEvidenceCell?.(tr.querySelector('[data-evidence]'),'inventory',x.id,x.item)})}


function addInventory(){const f=document.querySelector('#inventoryForm');if(!f)return;f.addEventListener('submit',async e=>{e.preventDefault();const fd=new FormData(f);if(!checkWholeShoppingQty(fd.get('required'),'Required quantity'))return;const r={id:uid('i'),category:fd.get('category')||'Other',item:fd.get('item'),required:+fd.get('required')||1,bought:0,packed:0,loaded:0,location:fd.get('location')||'',status:'Pending'};state.data.inventory.push(r);audit('Inventory',r.item,'create','',JSON.stringify(r));await save();f.reset();renderInventory()})}

function foodNum(v){return Math.max(0,+v||0)}
function foodFmt(v,unit){return (Math.round((+v||0)*10)/10).toFixed(1)+' '+unit}
function stayFoodTotals(){
 const p=state.data.foodPlan||{},a=p.stayAssumptions||{},days=p.stayDays||[];
 const t={atta:0,rice:0,dal:0,vegetables:0,milk:0,teaLeaves:0,sugar:0,snacks:0,oil:0,water:0,personDays:0,meals:0};
 days.forEach(d=>{
   const people=foodNum(d.people),b=foodNum(d.breakfast),l=foodNum(d.lunch),tea=foodNum(d.tea),dn=foodNum(d.dinner);
   t.personDays+=people;t.meals+=b+l+tea+dn;
   t.atta+=b*foodNum(a.breakfastAtta)+dn*foodNum(a.dinnerAtta);
   t.rice+=l*foodNum(a.lunchRice)+dn*foodNum(a.dinnerRice);
   t.dal+=l*foodNum(a.lunchDal)+dn*foodNum(a.dinnerDal);
   t.vegetables+=l*foodNum(a.lunchVegetables)+dn*foodNum(a.dinnerVegetables);
   t.milk+=b*foodNum(a.breakfastMilk)+tea*foodNum(a.teaMilk);
   t.teaLeaves+=tea*foodNum(a.teaLeaves);
   t.sugar+=tea*foodNum(a.teaSugar);
   t.snacks+=tea*foodNum(a.teaSnacks);
   t.oil+=(b+l+dn)*foodNum(a.oilPerMeal);
   t.water+=people*foodNum(a.waterLitres);
 });
 return t;
}
function stayFunctionDates(){
 const s=new Set();
 (state.data.eventCommands||[]).forEach(x=>{if(x&&x.date)s.add(String(x.date))});
 return s;
}
function stayFoodBasisOptions(){
 return {personDay:'Person-days',breakfast:'Breakfast servings',lunch:'Lunch servings',tea:'Tea / snack servings',dinner:'Dinner servings',mainMeals:'Lunch + dinner servings',rotiMeals:'Breakfast + dinner servings',breakfastTea:'Breakfast + tea servings',cookedMeals:'Breakfast + lunch + dinner servings',allMeals:'All meal servings'};
}
function stayFoodCatalog(){
 return [
  {key:'atta',group:'Staples',name:'Atta / wheat flour',unit:'kg',rate:0.105,basis:'rotiMeals'},
  {key:'rice',group:'Staples',name:'Rice',unit:'kg',rate:0.11,basis:'mainMeals'},
  {key:'dal',group:'Staples',name:'Dal / pulses',unit:'kg',rate:0.045,basis:'mainMeals'},
  {key:'poha',group:'Breakfast',name:'Poha / chura',unit:'kg',rate:0.08,basis:'breakfast'},
  {key:'suji',group:'Breakfast',name:'Suji / semolina',unit:'kg',rate:0.07,basis:'breakfast'},
  {key:'bread',group:'Breakfast',name:'Bread',unit:'slices',rate:2.5,basis:'breakfast'},
  {key:'eggs',group:'Breakfast',name:'Eggs',unit:'pcs',rate:1.5,basis:'breakfast'},
  {key:'banana',group:'Breakfast',name:'Banana / fruit',unit:'pcs',rate:1,basis:'breakfast'},
  {key:'vegetables',group:'Vegetables',name:'Mixed vegetables',unit:'kg',rate:0.15,basis:'mainMeals'},
  {key:'potato',group:'Vegetables',name:'Potato',unit:'kg',rate:0.10,basis:'mainMeals'},
  {key:'onion',group:'Vegetables',name:'Onion',unit:'kg',rate:0.04,basis:'cookedMeals'},
  {key:'tomato',group:'Vegetables',name:'Tomato',unit:'kg',rate:0.05,basis:'cookedMeals'},
  {key:'paneer',group:'Protein & Dairy',name:'Paneer',unit:'kg',rate:0.08,basis:'mainMeals'},
  {key:'curd',group:'Protein & Dairy',name:'Curd / dahi',unit:'kg',rate:0.10,basis:'mainMeals'},
  {key:'milk',group:'Protein & Dairy',name:'Milk',unit:'L',rate:0.16,basis:'breakfastTea'},
  {key:'teaLeaves',group:'Tea & Snacks',name:'Tea leaves',unit:'kg',rate:0.004,basis:'tea'},
  {key:'sugar',group:'Tea & Snacks',name:'Sugar',unit:'kg',rate:0.015,basis:'tea'},
  {key:'biscuits',group:'Tea & Snacks',name:'Biscuits',unit:'kg',rate:0.04,basis:'tea'},
  {key:'namkeen',group:'Tea & Snacks',name:'Namkeen / snacks',unit:'kg',rate:0.05,basis:'tea'},
  {key:'oil',group:'Cooking',name:'Cooking oil',unit:'kg',rate:0.015,basis:'cookedMeals'},
  {key:'ghee',group:'Cooking',name:'Ghee',unit:'kg',rate:0.01,basis:'cookedMeals'},
  {key:'salt',group:'Cooking',name:'Salt',unit:'kg',rate:0.012,basis:'cookedMeals'},
  {key:'spices',group:'Cooking',name:'Mixed spices / masala',unit:'kg',rate:0.01,basis:'cookedMeals'},
  {key:'pickle',group:'Cooking',name:'Pickle / chutney',unit:'kg',rate:0.01,basis:'mainMeals'},
  {key:'water',group:'Drinks',name:'Drinking water',unit:'L',rate:2.5,basis:'personDay'},
  {key:'sweets',group:'Extras',name:'Sweets',unit:'pcs',rate:1.5,basis:'personDay'}
 ];
}
function stayFoodBasisCount(basis){
 const days=((state.data.foodPlan||{}).stayDays||[]);
 return days.reduce((sum,d)=>{
   const people=foodNum(d.people),b=foodNum(d.breakfast),l=foodNum(d.lunch),t=foodNum(d.tea),dn=foodNum(d.dinner);
   if(basis==='breakfast')return sum+b;if(basis==='lunch')return sum+l;if(basis==='tea')return sum+t;if(basis==='dinner')return sum+dn;
   if(basis==='mainMeals')return sum+l+dn;if(basis==='rotiMeals')return sum+b+dn;if(basis==='breakfastTea')return sum+b+t;
   if(basis==='cookedMeals')return sum+b+l+dn;if(basis==='allMeals')return sum+b+l+t+dn;
   return sum+people;
 },0);
}
function stayFoodCatalogOptions(selected){
 const catalog=stayFoodCatalog(),groups={};
 catalog.forEach(x=>{(groups[x.group]=groups[x.group]||[]).push(x)});
 return Object.entries(groups).map(([g,items])=>'<optgroup label="'+hEsc(g)+'">'+items.map(x=>'<option value="'+hEsc(x.key)+'" '+(selected===x.key?'selected':'')+'>'+hEsc(x.name)+'</option>').join('')+'</optgroup>').join('');
}
function renderFood(){
 const fp=state.data.foodPlan,events={tilak:'Tilak',matkor:'Matkor',shadi:'Shadi',bahubhoj:'Bahubhoj',reception:'Khora Reception'};
 const root=document.querySelector('#foodCounts');
 if(root){
   root.innerHTML=Object.entries(events).map(([k,n])=>'<div class="field"><label>'+n+' guests</label><input type="number" min="0" step="1" inputmode="numeric" data-food-count="'+k+'" value="'+foodNum(fp.eventCounts[k])+'"></div>').join('');
   root.querySelectorAll('[data-food-count]').forEach(i=>i.addEventListener('change',async()=>{if(!checkWholeShoppingQty(i.value,'Guest count'))return;setField(fp.eventCounts,i.dataset.foodCount,foodNum(i.value),'Food Plan',i.dataset.foodCount);syncFoodShoppingItems();await save();renderFood()}))
 }
 const a=document.querySelector('#foodAssumptions');
 if(a){
   a.innerHTML=Object.entries(fp.assumptions).map(([k,v])=>'<div class="field"><label>'+k+' per person</label><input type="number" step="0.01" min="0" data-food-assumption="'+k+'" value="'+v+'"></div>').join('');
   a.querySelectorAll('[data-food-assumption]').forEach(i=>i.addEventListener('change',async()=>{setField(fp.assumptions,i.dataset.foodAssumption,foodNum(i.value),'Food Plan','assumption '+i.dataset.foodAssumption);syncFoodShoppingItems();await save();renderFood()}))
 }
 const tb=document.querySelector('#foodQtyBody');
 if(tb){
   tb.innerHTML='';
   Object.entries(events).forEach(([k,n])=>{
     const c=foodNum(fp.eventCounts[k]),as=fp.assumptions,tr=document.createElement('tr');
     tr.innerHTML='<td>'+n+'</td><td>'+c+'</td><td>'+foodFmt(c*as.rice,'kg')+'</td><td>'+foodFmt(c*as.atta,'kg')+'</td><td>'+foodFmt(c*as.dal,'kg')+'</td><td>'+foodFmt(c*as.vegetables,'kg')+'</td><td>'+foodFmt(c*as.paneer,'kg')+'</td><td>'+Math.ceil(c*as.waterLitres)+' L</td><td>'+Math.ceil(c*as.sweetsPieces)+'</td>';
     tb.appendChild(tr)
   })
 }
 const labels={
   breakfastAtta:'Breakfast atta (kg / serving)',breakfastMilk:'Breakfast milk (L / serving)',
   lunchRice:'Lunch rice (kg / serving)',lunchDal:'Lunch dal (kg / serving)',lunchVegetables:'Lunch vegetables (kg / serving)',
   teaMilk:'Tea milk (L / serving)',teaLeaves:'Tea leaves (kg / serving)',teaSugar:'Sugar (kg / tea serving)',teaSnacks:'Tea/snacks (kg / serving)',
   dinnerAtta:'Dinner atta (kg / serving)',dinnerRice:'Dinner rice (kg / serving)',dinnerDal:'Dinner dal (kg / serving)',dinnerVegetables:'Dinner vegetables (kg / serving)',
   oilPerMeal:'Cooking oil (kg / breakfast/lunch/dinner serving)',waterLitres:'Drinking water (L / staying person / day)',bufferPct:'Procurement buffer (%)'
 };
 const stayA=document.querySelector('#stayFoodAssumptions');
 if(stayA){
   stayA.innerHTML=Object.entries(labels).map(([k,label])=>'<div class="field"><label>'+label+'</label><input type="number" min="0" step="'+(k==='bufferPct'?'1':'0.001')+'" data-stay-assumption="'+k+'" value="'+foodNum(fp.stayAssumptions[k])+'"></div>').join('');
   stayA.querySelectorAll('[data-stay-assumption]').forEach(i=>i.addEventListener('change',async()=>{setField(fp.stayAssumptions,i.dataset.stayAssumption,foodNum(i.value),'Stay Food','assumption '+i.dataset.stayAssumption);syncFoodShoppingItems();await save();renderFood()}))
 }
 const stayBody=document.querySelector('#stayFoodBody');
 if(stayBody){
   stayBody.innerHTML='';
   [...fp.stayDays].sort((x,y)=>String(x.date).localeCompare(String(y.date))).forEach(d=>{
     const tr=document.createElement('tr'),water=foodNum(d.people)*foodNum(fp.stayAssumptions.waterLitres);
     tr.innerHTML='<td><input type="date" data-k="date" value="'+hEsc(d.date||'')+'"></td>'+
       '<td><input type="number" min="0" step="1" inputmode="numeric" data-k="people" value="'+foodNum(d.people)+'"></td>'+
       '<td><input type="number" min="0" step="1" inputmode="numeric" data-k="breakfast" value="'+foodNum(d.breakfast)+'"></td>'+
       '<td><input type="number" min="0" step="1" inputmode="numeric" data-k="lunch" value="'+foodNum(d.lunch)+'"></td>'+
       '<td><input type="number" min="0" step="1" inputmode="numeric" data-k="tea" value="'+foodNum(d.tea)+'"></td>'+
       '<td><input type="number" min="0" step="1" inputmode="numeric" data-k="dinner" value="'+foodNum(d.dinner)+'"></td>'+
       '<td>'+foodFmt(water,'L')+'</td>'+
       '<td><input data-k="notes" value="'+hEsc(d.notes||'')+'" placeholder="Who is staying / special meal note"></td>'+
       '<td><button type="button" class="btn warn" data-delete-stay>Delete</button></td>';
     tr.querySelectorAll('input[data-k]').forEach(i=>i.addEventListener('change',async()=>{
       const k=i.dataset.k,v=(k==='date'||k==='notes')?i.value:foodNum(i.value);
       setField(d,k,v,'Stay Food',d.date||d.id);syncFoodShoppingItems();await save();renderFood();
     }));
     tr.querySelector('[data-delete-stay]').addEventListener('click',async()=>{
       if(!confirm('Delete this stay-food day?'))return;
       fp.stayDays=fp.stayDays.filter(x=>x.id!==d.id);
       audit('Stay Food',d.date||d.id,'delete',JSON.stringify(d),'');
       syncFoodShoppingItems();await save();renderFood();
     });
     stayBody.appendChild(tr);
   });
 }
 const totals=stayFoodTotals(),buf=1+foodNum(fp.stayAssumptions.bufferPct)/100;
 const kpi=document.querySelector('#stayFoodKpis');
 if(kpi){
   kpi.innerHTML='<div class="card"><span>Stay days planned</span><b>'+fp.stayDays.length+'</b></div>'+
     '<div class="card"><span>Person-days</span><b>'+Math.round(totals.personDays)+'</b></div>'+
     '<div class="card"><span>Meal servings</span><b>'+Math.round(totals.meals)+'</b></div>'+
     '<div class="card"><span>Water estimate</span><b>'+Math.ceil(totals.water)+' L</b></div>';
 }
 const supplies=document.querySelector('#stayFoodSupplyBody');
 if(supplies){
   const rows=[['Atta',totals.atta,'kg'],['Rice',totals.rice,'kg'],['Dal',totals.dal,'kg'],['Vegetables',totals.vegetables,'kg'],['Milk',totals.milk,'L'],['Tea leaves',totals.teaLeaves,'kg'],['Sugar',totals.sugar,'kg'],['Tea / snacks',totals.snacks,'kg'],['Cooking oil',totals.oil,'kg'],['Drinking water',totals.water,'L']];
   supplies.innerHTML=rows.map(([name,base,unit])=>'<tr><td>'+name+'</td><td>'+foodFmt(base,unit)+'</td><td>'+foodNum(fp.stayAssumptions.bufferPct)+'%</td><td><b>'+foodFmt(base*buf,unit)+'</b></td></tr>').join('');
 }
 const itemSelect=document.querySelector('#stayFoodItemSelect');
 if(itemSelect){
   const current=itemSelect.value;
   itemSelect.innerHTML='<option value="">Choose an item…</option>'+stayFoodCatalogOptions(current);
   if(current)itemSelect.value=current;
 }
 const itemBody=document.querySelector('#stayFoodItemBody');
 if(itemBody){
   const basisLabels=stayFoodBasisOptions(),bufferRate=1+foodNum(fp.stayAssumptions.bufferPct)/100;
   itemBody.innerHTML='';
   (fp.stayItems||[]).forEach(item=>{
     const servings=stayFoodBasisCount(item.basis),raw=servings*foodNum(item.rate),planned=raw*bufferRate,tr=document.createElement('tr');
     tr.innerHTML='<td><b>'+hEsc(item.item)+'</b></td>'+
       '<td><select data-item-k="basis">'+Object.entries(basisLabels).map(([k,n])=>'<option value="'+k+'" '+(item.basis===k?'selected':'')+'>'+hEsc(n)+'</option>').join('')+'</select></td>'+
       '<td>'+Math.round(servings)+'</td>'+
       '<td><input type="number" min="0" step="0.001" data-item-k="rate" value="'+foodNum(item.rate)+'"></td>'+
       '<td>'+hEsc(item.unit)+'</td>'+
       '<td><b>'+foodFmt(raw,item.unit)+'</b></td>'+
       '<td>'+foodNum(fp.stayAssumptions.bufferPct)+'%</td>'+
       '<td><b>'+foodFmt(planned,item.unit)+'</b></td>'+
       '<td><input type="number" min="0" step="0.01" data-item-k="unitPrice" value="'+foodNum(item.unitPrice)+'" placeholder="₹ / '+hEsc(item.unit)+'"></td>'+
       '<td><span class="badge">Shopping + Expense auto</span></td>'+
       '<td><button type="button" class="btn warn" data-delete-stay-item>Delete</button></td>';
     tr.querySelectorAll('[data-item-k]').forEach(el=>el.addEventListener('change',async()=>{
       const k=el.dataset.itemK,v=(k==='rate'||k==='unitPrice')?foodNum(el.value):el.value;
       setField(item,k,v,'Stay Food Item',item.item);syncFoodShoppingItems();syncFoodShoppingItems();await save();renderFood();
     }));
     tr.querySelector('[data-delete-stay-item]').addEventListener('click',async()=>{
       if(!confirm('Remove '+item.item+' from the consumption planner?'))return;
       fp.stayItems=fp.stayItems.filter(x=>x.id!==item.id);
       audit('Stay Food Item',item.item,'delete',JSON.stringify(item),'');
       syncFoodShoppingItems();await save();renderFood();
     });
     itemBody.appendChild(tr);
   });
 }
 const itemForm=document.querySelector('#stayFoodItemForm');
 if(itemForm&&!itemForm.dataset.bound){
   itemForm.dataset.bound='1';
   itemForm.addEventListener('submit',async e=>{
     e.preventDefault();
     const fd=new FormData(itemForm),key=String(fd.get('item')||''),preset=stayFoodCatalog().find(x=>x.key===key);
     if(!preset){alert('Choose an item first.');return}
     if((fp.stayItems||[]).some(x=>x.catalogKey===key)){alert(preset.name+' is already in the planner.');return}
     const r={id:uid('fooditem'),catalogKey:preset.key,item:preset.name,unit:preset.unit,rate:preset.rate,basis:preset.basis,unitPrice:0,shoppingEnabled:true};
     fp.stayItems.push(r);audit('Stay Food Item',r.item,'create','',JSON.stringify(r));syncFoodShoppingItems();
     await save(r.item+' added to consumption + shopping planner');itemForm.reset();renderFood();
   });
 }

 const form=document.querySelector('#stayFoodRangeForm');
 if(form&&!form.dataset.bound){
   form.dataset.bound='1';
   form.addEventListener('submit',async e=>{
     e.preventDefault();
     const fd=new FormData(form),start=String(fd.get('start')||''),end=String(fd.get('end')||''),people=foodNum(fd.get('people')),skip=!!fd.get('skipFunctions');
     if(!start||!end){alert('Choose start and end dates.');return}
     if(end<start){alert('End date must be on or after start date.');return}
     const functionDates=stayFunctionDates(),existing=new Set(fp.stayDays.map(x=>x.date)),created=[];
     let cur=new Date(start+'T00:00:00'),last=new Date(end+'T00:00:00');
     while(cur<=last){
       const date=cur.toISOString().slice(0,10);
       if(!existing.has(date)&&(!skip||!functionDates.has(date))){
         const r={id:uid('foodstay'),date,people,breakfast:people,lunch:people,tea:people,dinner:people,notes:''};
         fp.stayDays.push(r);created.push(r);existing.add(date);
       }
       cur.setDate(cur.getDate()+1);
     }
     audit('Stay Food','Generated stay dates','create','',created.length+' day(s)');
     syncFoodShoppingItems();await save(created.length+' stay-food day'+(created.length===1?'':'s')+' added');
     renderFood();
   });
 }
}

function renderEvents(){
 renderChecklists('#eventLists',state.data.checklists);updateProgress();
 const body=document.querySelector('#commandBody');if(body){body.innerHTML='';state.data.eventCommands.forEach(c=>{const tr=document.createElement('tr');tr.innerHTML='<td><b>'+hEsc(c.event)+'</b><div class="mini">'+hEsc(c.date)+'</div></td><td><input type="time" data-k="startTime" value="'+hEsc(c.startTime)+'"></td><td>'+selectMarkup('owners',c.owner,'data-k="owner"',['Other / Custom'])+'</td><td>'+selectMarkup('',c.vendorArrival,'data-k="vendorArrival"',['To confirm','2 hours before','1 hour before','30 minutes before','Morning','Afternoon','Evening','On call'])+'</td><td>'+selectMarkup('',c.paymentDue,'data-k="paymentDue"',['No payment due','Advance already paid','Balance before event','Balance after setup','Balance after function','Final payment after verification','To confirm'])+'</td><td><input data-k="notes" value="'+hEsc(c.notes)+'"></td><td data-evidence></td>';tr.querySelectorAll('input,select').forEach(i=>i.addEventListener('change',async()=>{setField(c,i.dataset.k,i.value,'Event Command',c.event);await save()}));body.appendChild(tr);addRowActions(tr,'event',c.id);window.renderRowEvidenceCell?.(tr.querySelector('[data-evidence]'),'event',c.id,c.event)})}
 const cs=document.querySelector('#eventCostBody');if(cs){cs.innerHTML='';Object.entries(eventCostBuckets()).forEach(([k,v])=>{const tr=document.createElement('tr');tr.innerHTML='<td>'+hEsc(k)+'</td><td class="money">'+money(v.expected)+'</td><td class="money">'+money(v.actual)+'</td><td class="money">'+money(v.actual-v.expected)+'</td>';cs.appendChild(tr)})}
}

function renderCalendar(){
 const body=document.querySelector('#calendarBody');if(!body)return;body.innerHTML='';
 state.data.calendar.sort((a,b)=>String(a.date).localeCompare(String(b.date))).forEach(c=>{
  const tr=document.createElement('tr');
  tr.innerHTML='<td><input type="date" data-k="date" value="'+hEsc(c.date)+'"></td><td><input data-k="title" value="'+hEsc(c.title)+'"></td><td>'+selectMarkup('calendarTypes',c.type,'data-k="type"')+'</td><td>'+selectMarkup('calendarStatuses',c.status,'data-k="status"')+'</td>';
  tr.querySelectorAll('input,select').forEach(i=>i.addEventListener('change',async()=>{setField(c,i.dataset.k,i.value,'Calendar',c.title);await save()}));body.appendChild(tr);addRowActions(tr,'calendar',c.id);
 });
}
function addCalendar(){const f=document.querySelector('#calendarForm');if(!f)return;f.addEventListener('submit',async e=>{e.preventDefault();const fd=new FormData(f),r={id:uid('cal'),date:fd.get('date'),title:fd.get('title'),type:fd.get('type')||'Other',status:'Planned'};state.data.calendar.push(r);audit('Calendar',r.title,'create','',JSON.stringify(r));await save();f.reset();renderCalendar()})}

function renderInvitations(){
 const body=document.querySelector('#inviteBody');if(!body)return;body.innerHTML='';
 state.data.invitations.forEach(x=>{
  const tr=document.createElement('tr');
  tr.innerHTML='<td>'+hEsc(x.section)+'</td><td>'+selectMarkup('invitationLanguages',x.language,'data-lang')+'</td><td>'+selectMarkup('invitationStatuses',x.status,'data-status')+'</td><td><input type="checkbox" data-verify '+(x.verified?'checked':'')+'></td>';
  tr.querySelector('[data-lang]').addEventListener('change',async e=>{setField(x,'language',e.target.value,'Invitations',x.section);await save()});
  tr.querySelector('[data-status]').addEventListener('change',async e=>{setField(x,'status',e.target.value,'Invitations',x.section);await save()});
  tr.querySelector('[data-verify]').addEventListener('change',async e=>{setField(x,'verified',e.target.checked,'Invitations',x.section);await save()});body.appendChild(tr);addRowActions(tr,'invitation',x.id);
 });
 const warn=document.querySelector('#inviteWarning');if(warn){warn.textContent=state.data.calendar.find(x=>x.id==='cal7')?.status.includes('Needs')?'Khora reception date is tentative. Do not finalize/print that date until confirmed.':'Reception date currently marked confirmed.'}
}
function renderDocuments(){
 const body=document.querySelector('#docBody');if(!body)return;body.innerHTML='';
 state.data.documents.forEach(d=>{const tr=document.createElement('tr');tr.innerHTML='<td><b>'+hEsc(d.title)+'</b></td><td>'+selectMarkup('documentTypes',d.type,'data-k="type"')+'</td><td>'+selectMarkup('documentStatuses',d.status,'data-k="status"')+'</td><td><input data-k="reference" value="'+hEsc(d.reference)+'"></td><td data-evidence></td>';tr.querySelectorAll('input,select').forEach(i=>i.addEventListener('change',async()=>{setField(d,i.dataset.k,i.value,'Documents',d.title);await save();renderDocuments()}));body.appendChild(tr);addRowActions(tr,'document',d.id);window.renderRowEvidenceCell?.(tr.querySelector('[data-evidence]'),'document',d.id,d.title)})}


function addDocument(){const f=document.querySelector('#docForm');if(!f)return;f.addEventListener('submit',async e=>{e.preventDefault();const fd=new FormData(f),r={id:uid('doc'),title:fd.get('title'),type:fd.get('type')||'Other',status:fd.get('status')||'Pending',reference:fd.get('reference')||''};state.data.documents.push(r);audit('Documents',r.title,'create','',JSON.stringify(r));await save();f.reset();renderDocuments()})}

function renderHistory(){const body=document.querySelector('#historyBody');if(!body)return;const q=(document.querySelector('#historySearch')?.value||'').toLowerCase();body.innerHTML='';state.data.history.filter(h=>!q||(h.module+' '+h.record+' '+h.field).toLowerCase().includes(q)).slice(0,300).forEach(h=>{const tr=document.createElement('tr');tr.innerHTML='<td>'+new Date(h.at).toLocaleString('en-IN')+'</td><td>'+h.module+'</td><td>'+h.record+'</td><td>'+h.field+'</td><td class="mini">'+String(h.oldValue??'')+'</td><td class="mini">'+String(h.newValue??'')+'</td>';body.appendChild(tr)})}

function backupSetup(){document.querySelector('#exportBtn')?.addEventListener('click',()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='pankaj-wedding-manager-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)});document.querySelector('#importInput')?.addEventListener('change',e=>{const file=e.target.files?.[0];if(!file)return;const r=new FileReader();r.onload=async()=>{try{state=JSON.parse(r.result);migrate();await save('Backup restored');location.reload()}catch{alert('Invalid backup file')}};r.readAsText(file)});document.querySelector('#resetBtn')?.addEventListener('click',async()=>{if(confirm('Reset entire application to defaults?')){state=initial();migrate();await save('Reset');location.reload()}});const cap=document.querySelector('#hardCap'),res=document.querySelector('#reserveTarget');if(cap)cap.value=state.data.meta.hardCap;if(res)res.value=state.data.settings.reserveTarget;document.querySelector('#saveSettings')?.addEventListener('click',async()=>{setField(state.data.meta,'hardCap',Math.max(0,+cap.value||0),'Settings','Budget cap');setField(state.data.settings,'reserveTarget',Math.max(0,+res.value||0),'Settings','Emergency reserve');await save('Settings saved');updateKpis()})}

(function(){
  var CFG='PWM_SUPABASE_CONFIG';
  var SES='PWM_SUPABASE_SESSION';
  var REC='PWM_LEGACY_RECOVERY_V2';
  var SHARED_TABLE='wedding_shared_state';
  var DEFAULT_KEY='pankaj-neetu-2026';
  var DEFAULT_URL='https://acnmdjldpacwgetfsjnp.supabase.co';
  var baseLoad=window.load;
  var baseSave=window.save;
  var hydrated=false;
  var cloudPollTimer=null;
  var cloudPollBusy=false;
  var cloudWriteChain=Promise.resolve();

  var SQL=[
    'create table if not exists public.wedding_shared_state (',
    '  wedding_key text primary key,',
    '  state jsonb not null,',
    '  updated_at timestamptz not null default now()',
    ');',
    '',
    'alter table public.wedding_shared_state enable row level security;',
    '',
    'drop policy if exists wedding_shared_select on public.wedding_shared_state;',
    'drop policy if exists wedding_shared_insert on public.wedding_shared_state;',
    'drop policy if exists wedding_shared_update on public.wedding_shared_state;',
    '',
    "create policy wedding_shared_select on public.wedding_shared_state for select to anon using (wedding_key = 'pankaj-neetu-2026');",
    "create policy wedding_shared_insert on public.wedding_shared_state for insert to anon with check (wedding_key = 'pankaj-neetu-2026');",
    "create policy wedding_shared_update on public.wedding_shared_state for update to anon using (wedding_key = 'pankaj-neetu-2026') with check (wedding_key = 'pankaj-neetu-2026');",
    '',
    "grant select, insert, update on public.wedding_shared_state to anon;"
  ].join('\n');

  function parse(key){try{return JSON.parse(localStorage.getItem(key)||'null')}catch(e){return null}}
  function config(){return localStorage.getItem('PWM_PRIVATE_ACTIVE')==='1'?null:parse(CFG)}
  function legacySession(){return parse(SES)}
  function cleanUrl(v){return String(v||'').trim().replace(/\/+$/,'')}
  function sharedKey(){var c=config();return (c&&c.weddingKey)||DEFAULT_KEY}
  function shortHash(v){var h=2166136261;v=String(v||'');for(var i=0;i<v.length;i++){h^=v.charCodeAt(i);h=Math.imul(h,16777619)}return('000000'+(h>>>0).toString(36).toUpperCase()).slice(-6)}
  function workspaceId(){var c=config();return c&&c.url&&c.anonKey?('WS-'+shortHash(cleanUrl(c.url)+'|'+sharedKey())):''}
  function anonHeaders(){
    var c=config();if(!c)return {};
    return {'apikey':c.anonKey,'Content-Type':'application/json'};
  }
  function stat(m,good){
    var el=document.getElementById('cloudStatus');if(el){el.textContent=m;el.className='alert'+(good?' good':'')}
    document.querySelectorAll('[data-db]').forEach(function(x){
      var ws=workspaceId(),suffix=ws?(' • '+ws):'';
      if(good)x.textContent='Shared DB • synced'+suffix;
      else if(config()&&config().url&&config().anonKey)x.textContent='Shared DB • sync issue'+suffix;
      else x.textContent='Shared DB • not configured';
    });
  }

  async function readShared(){
    var c=config();if(!c||!c.url||!c.anonKey)return null;
    var wk=encodeURIComponent(sharedKey());
    var r=await fetch(cleanUrl(c.url)+'/rest/v1/'+SHARED_TABLE+'?wedding_key=eq.'+wk+'&select=state,updated_at,wedding_key',{headers:anonHeaders()});
    if(!r.ok){
      if(r.status===404||r.status===400)throw new Error('Shared DB table is not ready. Run the SQL from Settings once.');
      throw new Error('Shared DB read failed ('+r.status+').');
    }
    var rows=await r.json();return rows[0]||null;
  }

  function reconcileStates(localState,cloudState,preferCloud){
    var l=clone(localState||{}),r=clone(cloudState||{}),base=preferCloud?r:l,other=preferCloud?l:r;
    base.data=base.data||{};other.data=other.data||{};
    var keys=['expenses','vendors','shopping','tasks','guests','contacts','gifting','jewelleryRegister','cashLedger','inventory','vendorScopes','rooms','familyClothing','brideGifts','calendar','invitations','documents','mediaMeta','memories','eventCommands','history'];
    var added=0;
    keys.forEach(function(k){
      var a=Array.isArray(base.data[k])?base.data[k]:[],b=Array.isArray(other.data[k])?other.data[k]:[];
      var seen=new Set(a.map(function(x){return x&&x.id}).filter(Boolean));
      b.forEach(function(x){if(x&&x.id&&!seen.has(x.id)){a.push(clone(x));seen.add(x.id);added++}});
      base.data[k]=a;
    });
    integrityMergeTombstones(base,other);
    base.checks=Object.assign({},other.checks||{},base.checks||{});
    var bfp=base.data.foodPlan||{},ofp=other.data.foodPlan||{};
    var bsd=Array.isArray(bfp.stayDays)?bfp.stayDays:[],osd=Array.isArray(ofp.stayDays)?ofp.stayDays:[];
    var staySeen=new Set(bsd.map(function(x){return x&&x.id}).filter(Boolean));
    osd.forEach(function(x){if(x&&x.id&&!staySeen.has(x.id)){bsd.push(clone(x));staySeen.add(x.id);added++}});
    base.data.foodPlan=Object.assign({},ofp,bfp);
    base.data.foodPlan.eventCounts=Object.assign({},ofp.eventCounts||{},bfp.eventCounts||{});
    base.data.foodPlan.assumptions=Object.assign({},ofp.assumptions||{},bfp.assumptions||{});
    base.data.foodPlan.stayAssumptions=Object.assign({},ofp.stayAssumptions||{},bfp.stayAssumptions||{});
    base.data.foodPlan.stayDays=bsd;
    var bsi=Array.isArray(bfp.stayItems)?bfp.stayItems:[],osi=Array.isArray(ofp.stayItems)?ofp.stayItems:[];
    var itemSeen=new Set(bsi.map(function(x){return x&&x.id}).filter(Boolean));
    osi.forEach(function(x){if(x&&x.id&&!itemSeen.has(x.id)){bsi.push(clone(x));itemSeen.add(x.id);added++}});
    base.data.foodPlan.stayItems=bsi;
    base.data.settings=Object.assign({},other.data.settings||{},base.data.settings||{});
    base.data.meta=Object.assign({},other.data.meta||{},base.data.meta||{});
    base.meta=Object.assign({},other.meta||{},base.meta||{});
    return {state:base,added:added};
  }

  function verifySnapshotInCloud(snapshot,row){
    if(!row||!row.state)return {ok:false,reason:'Shared DB row missing after save'};
    var keys=['vendors','expenses','tasks','shopping','guests','contacts','gifting','cashLedger','inventory','rooms','familyClothing','brideGifts','calendar','documents','eventCommands'];
    var missing=[];
    keys.forEach(function(k){
      var want=((snapshot.data||{})[k]||[]).map(function(x){return x&&x.id}).filter(Boolean);
      var got=new Set((((row.state||{}).data||{})[k]||[]).map(function(x){return x&&x.id}).filter(Boolean));
      want.forEach(function(id){if(!got.has(id))missing.push(k+':'+id)});
    });
    var wantStay=((((snapshot||{}).data||{}).foodPlan||{}).stayDays||[]).map(function(x){return x&&x.id}).filter(Boolean);
    var gotStay=new Set((((((row.state||{}).data||{}).foodPlan||{}).stayDays)||[]).map(function(x){return x&&x.id}).filter(Boolean));
    wantStay.forEach(function(id){if(!gotStay.has(id))missing.push('foodPlan.stayDays:'+id)});
    var wantItems=((((snapshot||{}).data||{}).foodPlan||{}).stayItems||[]).map(function(x){return x&&x.id}).filter(Boolean);
    var gotItems=new Set((((((row.state||{}).data||{}).foodPlan||{}).stayItems)||[]).map(function(x){return x&&x.id}).filter(Boolean));
    wantItems.forEach(function(id){if(!gotItems.has(id))missing.push('foodPlan.stayItems:'+id)});
    return {ok:missing.length===0,reason:missing.length?('Shared DB verification missing '+missing.slice(0,3).join(', ')+(missing.length>3?'…':'')):'ok'};
  }

  async function pushShared(){
    var c=config();if(!c||!c.url||!c.anonKey||!state)return false;
    state.meta=state.meta||{};
    var now=state.meta.updatedAt||new Date().toISOString();
    state.meta.updatedAt=now;
    var snapshot=clone(state);snapshot.meta=snapshot.meta||{};snapshot.meta.updatedAt=now;
    var body={wedding_key:sharedKey(),state:snapshot,updated_at:now};
    var r=await fetch(cleanUrl(c.url)+'/rest/v1/'+SHARED_TABLE+'?on_conflict=wedding_key',{
      method:'POST',
      headers:Object.assign(anonHeaders(),{'Prefer':'resolution=merge-duplicates,return=minimal'}),
      body:JSON.stringify(body)
    });
    if(!r.ok){
      if(r.status===404||r.status===400)throw new Error('Shared DB table is not ready. Run the SQL from Settings once.');
      throw new Error('Shared DB save failed ('+r.status+').');
    }
    var row=await readShared(),check=verifySnapshotInCloud(snapshot,row);
    if(!check.ok)throw new Error(check.reason);
    localStorage.setItem('PWM_LAST_CLOUD_SYNC',now);
    stat('Shared DB save verified • '+workspaceId()+' • '+((snapshot.data||{}).vendors||[]).length+' vendors • '+new Date(now).toLocaleString(),true);
    return true;
  }

  async function refreshLegacySession(){
    var c=config(),s=legacySession();if(!c||!s)return null;
    var now=Math.floor(Date.now()/1000);
    if((s.expires_at||0)>now+60)return s;
    if(!s.refresh_token)return null;
    var r=await fetch(cleanUrl(c.url)+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{'apikey':c.anonKey,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:s.refresh_token})});
    if(!r.ok)return null;
    s=await r.json();s.expires_at=now+(s.expires_in||3600);localStorage.setItem(SES,JSON.stringify(s));return s;
  }

  async function readLegacyAccountState(){
    try{
      var c=config(),s=await refreshLegacySession();if(!c||!s)return null;
      var wk=encodeURIComponent(sharedKey());
      var r=await fetch(cleanUrl(c.url)+'/rest/v1/wedding_state?wedding_key=eq.'+wk+'&select=state,updated_at',{headers:{'apikey':c.anonKey,'Authorization':'Bearer '+s.access_token,'Content-Type':'application/json'}});
      if(!r.ok)return null;
      var rows=await r.json();return rows[0]||null;
    }catch(e){return null}
  }

  async function hydrate(){
    var c=config();
    if(!c||!c.url||!c.anonKey){hydrated=true;stat('Shared DB is not configured. Add Supabase URL + anon key in Settings.',false);return false}
    var row=await readShared();
    if(!row){
      var old=await readLegacyAccountState();
      if(old&&old.state){
        var recOld=reconcileStates(state,old.state,Date.parse(old.updated_at||0)>Date.parse((state.meta||{}).updatedAt||0));
        state=recOld.state;migrate();
      }
      state.meta=state.meta||{};state.meta.updatedAt=new Date().toISOString();
      await baseSave(false,false);
      hydrated=true;await pushShared();return true;
    }
    var lt=Date.parse((state&&state.meta&&state.meta.updatedAt)||0)||0;
    var ct=Date.parse(row.updated_at||0)||0;
    var rec=reconcileStates(state,row.state,ct>lt);
    state=rec.state;migrate();
    if(rec.added>0||(Date.parse(state.meta?.integrityCleanupAt||0)>ct)){
      state.meta=state.meta||{};state.meta.updatedAt=new Date().toISOString();
      await baseSave(false,false);hydrated=true;await pushShared();
      stat('Shared DB reconciled '+rec.added+' missing record'+(rec.added===1?'':'s')+'.',true);
    }else{
      if(ct>=lt){state.meta=state.meta||{};state.meta.updatedAt=row.updated_at||state.meta.updatedAt}
      await baseSave(false,false);hydrated=true;
      if(lt>ct)await pushShared();else stat('Shared DB is in sync • '+workspaceId(),true);
    }
    return true;
  }


  function refreshActivePageFromState(){
    try{
      var page=(location.pathname.split('/').pop()||'index.html').toLowerCase();
      if(page===''||page==='index.html'){if(typeof renderDashboard==='function')renderDashboard()}
      else if(page==='tasks.html'){if(typeof renderTasks==='function')renderTasks()}
      else if(page==='expenses.html'){if(typeof renderExpenses==='function')renderExpenses()}
      else if(page==='vendors.html'){if(typeof renderVendors==='function')renderVendors()}
      else if(page==='shopping.html'){if(typeof renderShopping==='function')renderShopping()}
      else if(page==='guests.html'){if(typeof renderGuests==='function')renderGuests();if(typeof renderRooms==='function')renderRooms()}
      else if(page==='gifts.html'){if(typeof renderGifts==='function')renderGifts()}
      else if(page==='payments.html'){if(typeof renderPayments==='function')renderPayments()}
      else if(page==='contacts.html'){if(typeof renderContacts==='function')renderContacts()}
      else if(page==='inventory.html'){if(typeof renderInventory==='function')renderInventory()}
      else if(page==='food.html'){if(typeof renderFood==='function')renderFood()}
      else if(page==='events.html'){if(typeof renderEvents==='function')renderEvents()}
      else if(page==='calendar.html'){if(typeof renderCalendar==='function')renderCalendar()}
      else if(page==='documents.html'){if(typeof renderDocuments==='function')renderDocuments()}
      else if(page==='history.html'){if(typeof renderHistory==='function')renderHistory()}
      else if(page==='travel.html'){if(typeof renderChecklists==='function')renderChecklists()}
      if(typeof updateKpis==='function')updateKpis();
      window.dispatchEvent(new CustomEvent('planner:remote-update',{detail:{page:page}}));
    }catch(e){console.warn('In-place shared DB refresh failed',e)}
  }

  async function checkSharedForNewer(){
    if(cloudPollBusy||!hydrated||!config()||document.visibilityState==='hidden')return false;
    cloudPollBusy=true;
    try{
      var row=await readShared();if(!row)return false;
      var lt=Date.parse((state&&state.meta&&state.meta.updatedAt)||0)||0,ct=Date.parse(row.updated_at||0)||0;
      if(ct>lt){
        var rec=reconcileStates(state,row.state,true);state=rec.state;migrate();
        if(rec.added>0||(Date.parse(state.meta?.integrityCleanupAt||0)>ct)){state.meta=state.meta||{};state.meta.updatedAt=new Date().toISOString();await baseSave(false,false);await pushShared()}
        else{state.meta=state.meta||{};state.meta.updatedAt=row.updated_at||state.meta.updatedAt;await baseSave(false,false)}
        stat('Newer shared DB data loaded • '+workspaceId(),true);
        refreshActivePageFromState();
        return true;
      }
      return false;
    }catch(e){stat('Shared DB sync check failed: '+e.message,false);return false}
    finally{cloudPollBusy=false}
  }

  function pushThrough(){
    var c=config();
    if(!hydrated||!c||!c.url||!c.anonKey){
      stat('Saved locally, but Shared DB is not configured on this device.',false);
      return Promise.resolve(false);
    }
    cloudWriteChain=cloudWriteChain.catch(function(){return false}).then(function(){return pushShared()});
    return cloudWriteChain.catch(function(e){stat('Local save succeeded, but Shared DB save failed: '+e.message,false);return false});
  }

  function startCloudPolling(){
    if(cloudPollTimer)clearInterval(cloudPollTimer);
    cloudPollTimer=setInterval(function(){checkSharedForNewer()},60000);
    window.addEventListener('focus',function(){checkSharedForNewer()});
    window.addEventListener('online',function(){checkSharedForNewer().then(function(changed){if(!changed)pushThrough()})});
    document.addEventListener('visibilitychange',function(){if(document.visibilityState==='visible')checkSharedForNewer()});
  }

  async function legacy(){
    var total=0;state.data.legacyRecovered=state.data.legacyRecovered||{};
    ['pankaj-wedding-planner-v2','pankaj-wedding-roadtrip-checklist-v1'].forEach(function(k){try{var v=JSON.parse(localStorage.getItem(k)||'null');if(v){state.data.legacyRecovered[k]=v;total+=Object.keys((v&&v.checks)||v||{}).length}}catch(e){}});
    if(indexedDB.databases){
      try{
        var dbs=await indexedDB.databases();
        if(dbs.some(function(d){return d.name==='pankajWeddingPlanner'})){
          var old=await new Promise(function(resolve){var r=indexedDB.open('pankajWeddingPlanner');r.onerror=function(){resolve(null)};r.onsuccess=function(){var db=r.result;if(!db.objectStoreNames.contains('planner')){db.close();resolve(null);return}var q=db.transaction('planner','readonly').objectStore('planner').get('state');q.onsuccess=function(){var v=q.result||null;db.close();resolve(v)};q.onerror=function(){db.close();resolve(null)}}});
          if(old){state.data.legacyRecovered.pankajWeddingPlanner=old;total+=Object.keys(old.checks||{}).length}
        }
      }catch(e){}
    }
    localStorage.setItem(REC,JSON.stringify({at:new Date().toISOString(),recovered:total}));
    if(total)await baseSave(false,false);
    return total;
  }

  window.load=async function(){
    await baseLoad();
    if(!localStorage.getItem(REC))await legacy();
    try{await hydrate()}catch(e){hydrated=true;stat('Shared DB load failed: '+e.message,false)}
    startCloudPolling();
    return state;
  };

  window.save=async function(msg){
    if(arguments.length===0)msg='Saved';
    await baseSave(msg,true);
    return await pushThrough();
  };

  window.cloudSettingsInit=function(){
    var c=config()||{};
    var url=document.getElementById('supabaseUrl'),key=document.getElementById('supabaseAnonKey'),wk=document.getElementById('weddingKey'),sql=document.getElementById('supabaseSql');
    if(url)url.value=c.url||DEFAULT_URL;if(key)key.value=c.anonKey||'';if(wk)wk.value=c.weddingKey||DEFAULT_KEY;if(sql)sql.value=SQL;
    stat(c.url&&c.anonKey?('Shared DB configured • '+workspaceId()+'. No account/login required.'): 'Shared DB is NOT configured. Add Project URL + anon key and run the SQL once.',!!(c.url&&c.anonKey));
    var saveBtn=document.getElementById('saveCloudConfig'),syncBtn=document.getElementById('syncNow'),pullBtn=document.getElementById('pullCloud'),disconnectBtn=document.getElementById('disconnectCloud');
    if(saveBtn)saveBtn.onclick=async function(){
      localStorage.setItem(CFG,JSON.stringify({url:cleanUrl(url.value),anonKey:key.value.trim(),weddingKey:(wk.value||DEFAULT_KEY).trim()}));
      try{await hydrate();stat('Shared DB connected • '+workspaceId()+'. No login required.',true)}catch(e){stat(e.message,false)}
    };
    if(syncBtn)syncBtn.onclick=async function(){try{await pushShared()}catch(e){stat(e.message,false)}};
    if(pullBtn)pullBtn.onclick=async function(){try{await hydrate();location.reload()}catch(e){stat(e.message,false)}};
    if(disconnectBtn)disconnectBtn.onclick=function(){localStorage.removeItem(CFG);stat('Shared DB disconnected. Local data was kept.',false)};
    var rec=parse(REC),le=document.getElementById('legacyStatus');if(le)le.textContent=rec?('Last recovery scan: '+rec.recovered+' entries • '+new Date(rec.at).toLocaleString()):'Legacy recovery has not run yet.';
    var recover=document.getElementById('recoverLegacy');if(recover)recover.onclick=async function(){var n=await legacy();alert(n?('Recovered '+n+' legacy entries.'):('No same-origin legacy data found.'));location.reload()};
    var copy=document.getElementById('copySql');if(copy)copy.onclick=async function(){try{await navigator.clipboard.writeText(SQL);toast('SQL copied')}catch(e){sql.select();document.execCommand('copy')}};
  };
})();

(function(){
 const MAX=25*1024*1024,BUCKET='wedding-evidence',CFG='PWM_SUPABASE_CONFIG',SES='PWM_SUPABASE_SESSION';
 function ensure(){if(state&&state.data){state.data.mediaMeta=state.data.mediaMeta||[];state.data.memories=state.data.memories||[]}}
 function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
 function bytes(n){n=+n||0;return n<1024?n+' B':n<1048576?(n/1024).toFixed(1)+' KB':(n/1048576).toFixed(1)+' MB'}
 function cfg(){try{return JSON.parse(localStorage.getItem(localStorage.getItem('PWM_PRIVATE_ACTIVE')==='1'?'PWM_PRIVATE_CONF':CFG)||'null')}catch(e){return null}}
 function ses(){try{return JSON.parse(localStorage.getItem(localStorage.getItem('PWM_PRIVATE_ACTIVE')==='1'?'PWM_PRIVATE_AUTH':SES)||'null')}catch(e){return null}}
 function setSes(v){if(v)localStorage.setItem(SES,JSON.stringify(v));else localStorage.removeItem(SES)}
 function jwt(t){try{let p=(t.split('.')[1]||'').replace(/-/g,'+').replace(/_/g,'/');while(p.length%4)p+='=';return JSON.parse(atob(p))}catch(e){return null}}
 async function refresh(){let c=cfg(),s=ses();if(!c||!s)return null;let now=Math.floor(Date.now()/1000);if((s.expires_at||0)>now+60)return s;if(!s.refresh_token)return null;let r=await fetch(c.url+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{apikey:c.anonKey,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:s.refresh_token})});if(!r.ok){setSes(null);return null}s=await r.json();s.expires_at=now+(s.expires_in||3600);setSes(s);return s}
 async function db(){let d=await openDB();if(!d||!d.objectStoreNames.contains(MEDIASTORE))throw new Error('Media storage unavailable');return d}
 async function put(id,file){let d=await db();return new Promise(res=>{let tx=d.transaction(MEDIASTORE,'readwrite');tx.objectStore(MEDIASTORE).put({id,blob:file,name:file.name,type:file.type,size:file.size,storedAt:new Date().toISOString()},id);tx.oncomplete=()=>res(true);tx.onerror=()=>res(false)})}
 async function get(id){let d=await db();return new Promise(res=>{let q=d.transaction(MEDIASTORE,'readonly').objectStore(MEDIASTORE).get(id);q.onsuccess=()=>res(q.result||null);q.onerror=()=>res(null)})}
 async function delLocal(id){let d=await db();return new Promise(res=>{let tx=d.transaction(MEDIASTORE,'readwrite');tx.objectStore(MEDIASTORE).delete(id);tx.oncomplete=()=>res(true);tx.onerror=()=>res(false)})}
 async function allLocal(){let d=await db();return new Promise(res=>{let q=d.transaction(MEDIASTORE,'readonly').objectStore(MEDIASTORE).getAll();q.onsuccess=()=>res(q.result||[]);q.onerror=()=>res([])})}
 function rows(type){
   if(type==='contact')return (state.data.contacts||[]).map(x=>({id:x.id,label:x.name+' • '+x.role}));
   if(type==='guest')return (state.data.guests||[]).map(x=>({id:x.id,label:x.name+' • '+(x.city||x.side)}));
   if(type==='vendor')return (state.data.vendors||[]).map(x=>({id:x.id,label:x.name+' • '+x.category}));
   if(type==='shopping')return [
     ...(state.data.shopping||[]).map(x=>({id:'shop:'+x.id,label:x.name+' • '+(x.market||'Shopping')})),
     ...(state.data.familyClothing||[]).map(x=>({id:'cloth:'+x.id,label:x.person+' • '+x.item}))
   ];
   if(type==='gift')return [
     ...(state.data.gifting||[]).map(x=>({id:'gift:'+x.id,label:x.name+' • '+x.gift})),
     ...(state.data.brideGifts||[]).map(x=>({id:'bridegift:'+x.id,label:'Bride gift • '+x.item})),
     ...(state.data.jewelleryRegister||[]).map(x=>({id:'jewel:'+x.id,label:'Jewellery • '+x.item+' • '+x.recipient}))
   ];
   if(type==='payment')return (state.data.cashLedger||[]).map(x=>({id:x.id,label:x.date+' • '+x.description+' • '+money(x.amount)}));
   if(type==='inventory')return (state.data.inventory||[]).map(x=>({id:x.id,label:x.category+' • '+x.item}));
   if(type==='event')return (state.data.eventCommands||[]).map(x=>({id:x.id,label:x.event+' • '+x.date}));
   if(type==='travel')return Object.keys(state.data.travelChecklist||{}).map(x=>({id:'travel:'+x,label:x}));
   if(type==='expense')return (state.data.expenses||[]).map(x=>({id:x.id,label:x.item+' • '+x.category}));
   if(type==='document')return (state.data.documents||[]).map(x=>({id:x.id,label:x.title+' • '+x.type}));
   if(type==='memory')return (state.data.memories||[]).map(x=>({id:x.id,label:x.title+' • '+x.date}));
   return [{id:'general',label:'General wedding evidence'}];
 }
 async function cloudUpload(meta,file){
   let c=cfg(),s=await refresh();if(!c||!s)return null;let u=jwt(s.access_token);if(!u?.sub)return null;
   let safe=(file.name||'evidence').replace(/[^a-zA-Z0-9._-]+/g,'_'),path=u.sub+'/'+meta.id+'/'+safe;
   let r=await fetch(c.url+'/storage/v1/object/'+BUCKET+'/'+path.split('/').map(encodeURIComponent).join('/'),{method:'POST',headers:{apikey:c.anonKey,Authorization:'Bearer '+s.access_token,'x-upsert':'true','Content-Type':file.type||'application/octet-stream'},body:file});
   return r.ok?path:null;
 }
 async function signed(path){
   let c=cfg(),s=await refresh();if(!c||!s||!path)return null;
   let r=await fetch(c.url+'/storage/v1/object/sign/'+BUCKET+'/'+path.split('/').map(encodeURIComponent).join('/'),{method:'POST',headers:{apikey:c.anonKey,Authorization:'Bearer '+s.access_token,'Content-Type':'application/json'},body:JSON.stringify({expiresIn:3600})});
   if(!r.ok)return null;let j=await r.json(),v=j.signedURL||j.signedUrl;return v?(v.startsWith('http')?v:c.url+'/storage/v1'+v):null;
 }
 async function mediaUrl(m){let l=await get(m.id).catch(()=>null);if(l?.blob)return URL.createObjectURL(l.blob);return m.cloudPath?await signed(m.cloudPath):null}
 async function upload(files,ctx={}){
   ensure();let n=0;
   for(const file of [...files]){
     let img=(file.type||'').startsWith('image/'),pdf=file.type==='application/pdf'||/\.pdf$/i.test(file.name||'');
     if(!img&&!pdf){toast('Only images and PDFs are supported');continue}if(file.size>MAX){toast((file.name||'File')+' exceeds 25 MB');continue}
     let id=uid('media'),m={id,name:file.name||id,type:file.type||(pdf?'application/pdf':'image/jpeg'),size:file.size,createdAt:new Date().toISOString(),date:ctx.date||new Date().toISOString().slice(0,10),caption:ctx.caption||'',entityType:ctx.entityType||'general',entityId:ctx.entityId||'general',entityLabel:ctx.entityLabel||'',event:ctx.event||'',tags:ctx.tags||'',favorite:false,cover:false,profile:false,cloudPath:null,cloudBacked:false};
     if(!(await put(id,file)))continue;
     try{let p=await cloudUpload(m,file);if(p){m.cloudPath=p;m.cloudBacked=true}}catch(e){}
     state.data.mediaMeta.unshift(m);n++;
   }
   if(n){audit('Media','Evidence Library','add','',n+' file(s)');await save(n+' evidence file'+(n===1?'':'s')+' saved')}
   return n;
 }
 window.receiptEvidenceStore=async function(file,shopping,receiptId){
   const before=new Set((state.data.mediaMeta||[]).map(m=>m.id));
   const count=await upload([file],{entityType:'shopping',entityId:'shop:'+shopping.id,
     entityLabel:shopping.name,caption:'Receipt scan • '+receiptId,tags:'receipt,ocr'});
   const added=count?(state.data.mediaMeta||[]).find(m=>!before.has(m.id)):null;
   if(added){added.receiptImportId=receiptId;await save(false)}
   return added?.id||null;
 };
 window.receiptEvidenceUrl=async id=>{const m=(state.data.mediaMeta||[]).find(x=>x.id===id);return m?mediaUrl(m):null};
 async function remove(id){let m=state.data.mediaMeta.find(x=>x.id===id);if(!m||!confirm('Delete this image/PDF from the app?'))return;await delLocal(id).catch(()=>{});state.data.mediaMeta=state.data.mediaMeta.filter(x=>x.id!==id);(state.data.memories||[]).forEach(x=>x.mediaIds=(x.mediaIds||[]).filter(v=>v!==id));await save('Evidence deleted')}
 async function setCover(id){state.data.mediaMeta.forEach(x=>x.cover=x.id===id);await save('Dashboard cover updated');renderFeaturedMemory()}
 async function setProfile(id){let m=state.data.mediaMeta.find(x=>x.id===id);if(!m)return;state.data.mediaMeta.forEach(x=>{if(x.entityType===m.entityType&&x.entityId===m.entityId)x.profile=x.id===id});await save('Profile photo updated');decorateContactRows();decorateGuestRows()}
 async function card(m,rerender){
   let u=await mediaUrl(m),img=(m.type||'').startsWith('image/'),el=document.createElement('article');el.className='media-card';
   el.innerHTML='<div class="media-visual">'+(img&&u?'<img src="'+u+'" alt="">':'<div class="pdf-tile">'+(img?'IMAGE':'PDF')+'<small>'+esc(m.name)+'</small></div>')+'</div><div class="media-info"><b>'+esc(m.caption||m.name)+'</b><span>'+esc((m.entityType||'general')+': '+(m.entityLabel||''))+'</span><small>'+esc(m.date||'')+' • '+bytes(m.size)+' • '+(m.cloudBacked?'☁ Cloud backed':'📱 Local')+'</small><div class="media-actions"></div></div>';
   let a=el.querySelector('.media-actions');
   let open=document.createElement('button');open.className='btn alt';open.textContent='Open';open.onclick=async()=>{let x=await mediaUrl(m);if(x)window.open(x,'_blank')};a.append(open);
   if(img){let b=document.createElement('button');b.className='btn';b.textContent=m.cover?'Cover ✓':'Set cover';b.onclick=()=>setCover(m.id);a.append(b)}
   if(img&&['contact','guest'].includes(m.entityType)){let b=document.createElement('button');b.className='btn alt';b.textContent=m.profile?'Profile ✓':'Set profile';b.onclick=()=>setProfile(m.id);a.append(b)}
   let d=document.createElement('button');d.className='btn warn';d.textContent='Delete';d.onclick=async()=>{await remove(m.id);rerender&&rerender()};a.append(d);return el;
 }
 async function render(root,filter,empty='No evidence uploaded yet.'){if(!root)return;root.innerHTML='';let list=(state.data.mediaMeta||[]).filter(filter||(()=>true));if(!list.length){root.innerHTML='<div class="empty-state">'+esc(empty)+'</div>';return}for(const m of list)root.append(await card(m,()=>render(root,filter,empty)))}
 function fill(typeSel,recordSel){if(!typeSel||!recordSel)return;recordSel.innerHTML='';rows(typeSel.value).forEach(x=>recordSel.add(new Option(x.label,x.id)))}
 window.setupMediaLibraryPage=function(){
   ensure();let t=document.getElementById('mediaTargetType'),r=document.getElementById('mediaTargetRecord'),f=document.getElementById('mediaFiles'),c=document.getElementById('mediaCamera');fill(t,r);t.onchange=()=>fill(t,r);
   async function go(input){if(!input.files?.length)return;await upload(input.files,{entityType:t.value,entityId:r.value,entityLabel:r.options[r.selectedIndex]?.text||'',event:document.getElementById('mediaEvent')?.value||'',caption:document.getElementById('mediaCaption')?.value||''});input.value='';renderMediaLibrary();updateMediaStats()}
   f.onchange=()=>go(f);c.onchange=()=>go(c);document.getElementById('mediaSearch').oninput=renderMediaLibrary;document.getElementById('mediaFilter').onchange=renderMediaLibrary;renderMediaLibrary();updateMediaStats();
 };
 window.renderMediaLibrary=async function(){let root=document.getElementById('mediaGrid');if(!root)return;let q=(document.getElementById('mediaSearch')?.value||'').toLowerCase(),f=document.getElementById('mediaFilter')?.value||'All';await render(root,m=>(f==='All'||m.entityType===f)&&(!q||(m.name+' '+m.caption+' '+m.entityLabel+' '+m.event).toLowerCase().includes(q)))};
 window.updateMediaStats=function(){ensure();let a=state.data.mediaMeta||[],size=a.reduce((s,x)=>s+(+x.size||0),0);document.querySelectorAll('[data-media-count]').forEach(x=>x.textContent=a.length);document.querySelectorAll('[data-media-images]').forEach(x=>x.textContent=a.filter(v=>(v.type||'').startsWith('image/')).length);document.querySelectorAll('[data-media-pdfs]').forEach(x=>x.textContent=a.filter(v=>v.type==='application/pdf').length);document.querySelectorAll('[data-media-cloud]').forEach(x=>x.textContent=a.filter(v=>v.cloudBacked).length);document.querySelectorAll('[data-media-size]').forEach(x=>x.textContent=bytes(size))};
 window.setupEntityMedia=function(type,selId,fileId,camId,gridId){let s=document.getElementById(selId),f=document.getElementById(fileId),c=document.getElementById(camId),g=document.getElementById(gridId);s.innerHTML='';rows(type).forEach(x=>s.add(new Option(x.label,x.id)));async function show(){await render(g,m=>m.entityType===type&&m.entityId===s.value,'No photos/PDFs linked here yet.')}s.onchange=show;async function go(i){if(!i.files?.length)return;await upload(i.files,{entityType:type,entityId:s.value,entityLabel:s.options[s.selectedIndex]?.text||''});i.value='';show();decorateContactRows();decorateGuestRows()}f.onchange=()=>go(f);c.onchange=()=>go(c);show()};
 window.renderRowEvidenceCell=async function(host,type,id,label){
  if(!host)return;ensure();
  let list=(state.data.mediaMeta||[]).filter(m=>m.entityType===type&&m.entityId===id);
  host.classList.add('row-evidence');host.innerHTML='<div class="row-evidence-preview"></div><div class="row-evidence-actions"></div>';
  let preview=host.querySelector('.row-evidence-preview'),actions=host.querySelector('.row-evidence-actions');
  if(list.length){
   let first=list[0],u=await mediaUrl(first),btn=document.createElement('button');btn.type='button';btn.className='evidence-thumb';
   btn.innerHTML=(first.type||'').startsWith('image/')&&u?'<img src="'+u+'" alt="">':'<span>PDF</span>';
   btn.title='Open evidence';btn.onclick=async()=>{let x=await mediaUrl(first);if(x)window.open(x,'_blank')};preview.appendChild(btn);
   let count=document.createElement('span');count.className='evidence-count';count.textContent=list.length;preview.appendChild(count);
  }else preview.innerHTML='<div class="evidence-empty">No proof</div>';
  let input=document.createElement('input');input.type='file';input.accept='image/*,application/pdf';input.multiple=true;input.hidden=true;
  let add=document.createElement('button');add.type='button';add.className='evidence-add';add.textContent='+ Add';add.onclick=()=>input.click();
  input.onchange=async()=>{if(!input.files?.length)return;await upload(input.files,{entityType:type,entityId:id,entityLabel:label||id,caption:label||''});input.value='';await window.renderRowEvidenceCell(host,type,id,label)};
  actions.append(add,input);
 };

 async function avatar(type,id,td){let m=(state.data.mediaMeta||[]).find(x=>x.entityType===type&&x.entityId===id&&x.profile&&(x.type||'').startsWith('image/'))||(state.data.mediaMeta||[]).find(x=>x.entityType===type&&x.entityId===id&&(x.type||'').startsWith('image/'));td.innerHTML='';if(!m){td.innerHTML='<div class="avatar-placeholder">+</div>';return}let u=await mediaUrl(m);td.innerHTML=u?'<img class="avatar-img" src="'+u+'" alt="">':'<div class="avatar-placeholder">?</div>'}
 window.decorateContactRows=function(){[...document.querySelectorAll('#contactBody tr')].forEach((tr,i)=>{let x=state.data.contacts?.[i];if(!x)return;let td=tr.querySelector('.avatar-cell');if(!td){td=document.createElement('td');td.className='avatar-cell';tr.prepend(td)}avatar('contact',x.id,td)})};
 window.decorateGuestRows=function(){[...document.querySelectorAll('#guestBody tr')].forEach((tr,i)=>{let x=state.data.guests?.[i];if(!x)return;let td=tr.querySelector('.avatar-cell');if(!td){td=document.createElement('td');td.className='avatar-cell';tr.prepend(td)}avatar('guest',x.id,td)})};
 let rc=window.renderContacts;if(typeof rc==='function')window.renderContacts=function(){let v=rc.apply(this,arguments);decorateContactRows();return v};
 let rg=window.renderGuests;if(typeof rg==='function')window.renderGuests=function(){let v=rg.apply(this,arguments);decorateGuestRows();return v};
 window.renderFeaturedMemory=async function(){
  let root=document.getElementById('featuredMemory');if(!root)return;ensure();
  if(window.__weddingCarouselTimer){clearInterval(window.__weddingCarouselTimer);window.__weddingCarouselTimer=null}
  if(window.__weddingCarouselUrls){window.__weddingCarouselUrls.forEach(u=>{if(String(u).startsWith('blob:'))try{URL.revokeObjectURL(u)}catch(e){}})}
  let cfg=state.data.settings.dashboardSlideshow||{enabled:true,intervalSeconds:5,mediaIds:[]};
  let images=(state.data.mediaMeta||[]).filter(x=>(x.type||'').startsWith('image/'));
  let ordered=(cfg.mediaIds||[]).map(id=>images.find(x=>x.id===id)).filter(Boolean);
  if(!ordered.length){
    let cover=images.find(x=>x.cover);
    if(cover)ordered=[cover];
  }
  if(!ordered.length){
    root.innerHTML='<div class="cover-empty"><div class="mark big">श्री</div><h2>Your wedding slideshow starts here</h2><p>Upload real family/wedding photos, then choose the dashboard images from Settings.</p><div class="toolbar"><a class="btn" href="/media.html">Add photos</a><a class="btn alt" href="/settings.html#dashboard-slideshow">Manage slideshow</a></div></div>';
    return;
  }
  let slides=[];
  for(const m of ordered){let u=await mediaUrl(m);if(u)slides.push({m,u})}
  if(!slides.length){root.innerHTML='<div class="cover-empty"><h2>Slideshow photos are unavailable offline.</h2><a class="btn" href="/settings.html#dashboard-slideshow">Manage slideshow</a></div>';return}
  window.__weddingCarouselUrls=slides.map(x=>x.u);
  root.innerHTML='<div class="carousel-stage"></div><button class="carousel-arrow prev" aria-label="Previous photo">‹</button><button class="carousel-arrow next" aria-label="Next photo">›</button><div class="carousel-bottom"><div class="carousel-dots"></div><button class="carousel-toggle" type="button" aria-label="Pause slideshow">❚❚</button><a class="carousel-manage" href="/settings.html#dashboard-slideshow">Manage</a></div>';
  let stage=root.querySelector('.carousel-stage'),dots=root.querySelector('.carousel-dots'),idx=0,paused=!cfg.enabled;
  slides.forEach((x,i)=>{
    let s=document.createElement('div');s.className='carousel-slide'+(i===0?' active':'');s.setAttribute('aria-hidden',i===0?'false':'true');
    s.innerHTML='<img src="'+x.u+'" alt=""><div class="photo-text"><div class="eyebrow">Our real wedding story</div><h1>Pankaj Kumar & Neetu</h1><div>'+esc(x.m.caption||x.m.entityLabel||x.m.name||'Wedding memory')+'</div></div>';
    stage.appendChild(s);
    let b=document.createElement('button');b.className='carousel-dot'+(i===0?' active':'');b.setAttribute('aria-label','Show photo '+(i+1));b.onclick=()=>show(i,true);dots.appendChild(b);
  });
  let slideEls=[...stage.children],dotEls=[...dots.children],toggle=root.querySelector('.carousel-toggle');
  function show(n,user){
    idx=(n+slides.length)%slides.length;
    slideEls.forEach((el,i)=>{el.classList.toggle('active',i===idx);el.setAttribute('aria-hidden',i===idx?'false':'true')});
    dotEls.forEach((el,i)=>el.classList.toggle('active',i===idx));
    if(user)restart();
  }
  function interval(){return Math.max(3,Math.min(30,+cfg.intervalSeconds||5))*1000}
  function startAuto(){if(slides.length<2||paused)return;clearInterval(window.__weddingCarouselTimer);window.__weddingCarouselTimer=setInterval(()=>show(idx+1,false),interval())}
  function restart(){clearInterval(window.__weddingCarouselTimer);window.__weddingCarouselTimer=null;startAuto()}
  root.querySelector('.prev').onclick=()=>show(idx-1,true);
  root.querySelector('.next').onclick=()=>show(idx+1,true);
  toggle.textContent=paused?'▶':'❚❚';toggle.setAttribute('aria-label',paused?'Play slideshow':'Pause slideshow');
  toggle.onclick=()=>{paused=!paused;toggle.textContent=paused?'▶':'❚❚';toggle.setAttribute('aria-label',paused?'Play slideshow':'Pause slideshow');if(paused){clearInterval(window.__weddingCarouselTimer);window.__weddingCarouselTimer=null}else startAuto()};
  root.addEventListener('mouseenter',()=>{if(!paused){clearInterval(window.__weddingCarouselTimer);window.__weddingCarouselTimer=null}});
  root.addEventListener('mouseleave',()=>{if(!paused)startAuto()});
  let touchX=null;root.addEventListener('touchstart',e=>{touchX=e.touches?.[0]?.clientX??null},{passive:true});root.addEventListener('touchend',e=>{if(touchX==null)return;let x=e.changedTouches?.[0]?.clientX??touchX,d=x-touchX;touchX=null;if(Math.abs(d)>45)show(idx+(d<0?1:-1),true)},{passive:true});
  if(slides.length===1){root.querySelector('.prev').hidden=true;root.querySelector('.next').hidden=true;toggle.hidden=true}
  startAuto();
};

window.setupDashboardSlideshowSettings=async function(){
  ensure();
  let cfg=state.data.settings.dashboardSlideshow||(state.data.settings.dashboardSlideshow={enabled:true,intervalSeconds:5,mediaIds:[]});
  let valid=new Set((state.data.mediaMeta||[]).filter(x=>(x.type||'').startsWith('image/')).map(x=>x.id));
  cfg.mediaIds=(cfg.mediaIds||[]).filter(id=>valid.has(id));
  let enabled=document.getElementById('slideshowEnabled'),seconds=document.getElementById('slideshowInterval'),grid=document.getElementById('slideshowImageManager'),files=document.getElementById('slideshowFiles'),camera=document.getElementById('slideshowCamera');
  if(!grid)return;
  enabled.checked=cfg.enabled!==false;seconds.value=String(Math.max(3,Math.min(30,+cfg.intervalSeconds||5)));
  async function persist(msg){cfg.enabled=enabled.checked;cfg.intervalSeconds=Math.max(3,Math.min(30,+seconds.value||5));await save(msg||'Slideshow settings saved')}
  enabled.onchange=()=>persist();seconds.onchange=()=>persist();
  document.getElementById('slideshowUseAll').onclick=async()=>{cfg.mediaIds=(state.data.mediaMeta||[]).filter(x=>(x.type||'').startsWith('image/')).map(x=>x.id);await persist('All photos added to slideshow');await draw()};
  document.getElementById('slideshowClear').onclick=async()=>{cfg.mediaIds=[];await persist('Slideshow selection cleared');await draw()};
  async function addNew(input){
    if(!input.files?.length)return;
    let before=new Set((state.data.mediaMeta||[]).map(x=>x.id));
    await upload(input.files,{entityType:'general',entityId:'dashboard-slideshow',entityLabel:'Dashboard Slideshow',caption:'Dashboard slideshow photo'});
    let added=(state.data.mediaMeta||[]).filter(x=>!before.has(x.id)&&(x.type||'').startsWith('image/')).map(x=>x.id);
    cfg.mediaIds=[...cfg.mediaIds,...added.filter(id=>!cfg.mediaIds.includes(id))];
    await persist(added.length+' slideshow photo'+(added.length===1?'':'s')+' added');input.value='';await draw();
  }
  files.onchange=()=>addNew(files);camera.onchange=()=>addNew(camera);
  async function draw(){
    let images=(state.data.mediaMeta||[]).filter(x=>(x.type||'').startsWith('image/'));
    let selected=cfg.mediaIds.map(id=>images.find(x=>x.id===id)).filter(Boolean);
    let rest=images.filter(x=>!cfg.mediaIds.includes(x.id)).sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)));
    let list=[...selected,...rest];grid.innerHTML='';
    let count=document.getElementById('slideshowSelectedCount');if(count)count.textContent=selected.length;
    if(!list.length){grid.innerHTML='<div class="empty-state">No photos in the media library yet. Use Add slideshow photos above.</div>';return}
    for(const m of list){
      let u=await mediaUrl(m),chosen=cfg.mediaIds.includes(m.id),pos=cfg.mediaIds.indexOf(m.id);
      let card=document.createElement('div');card.className='slide-manager-card'+(chosen?' selected':'');
      card.innerHTML='<div class="slide-manager-thumb">'+(u?'<img src="'+u+'" alt="">':'<div class="avatar-placeholder">?</div>')+'</div><div class="slide-manager-info"><b>'+esc(m.caption||m.name||'Photo')+'</b><small>'+esc(m.entityLabel||m.entityType||'Media')+'</small><label class="slide-check"><input type="checkbox" '+(chosen?'checked':'')+'> Show on dashboard</label><div class="media-actions"></div></div>';
      let check=card.querySelector('input'),actions=card.querySelector('.media-actions');
      check.onchange=async()=>{if(check.checked){if(!cfg.mediaIds.includes(m.id))cfg.mediaIds.push(m.id)}else cfg.mediaIds=cfg.mediaIds.filter(id=>id!==m.id);await persist('Slideshow selection updated');await draw()};
      if(chosen){
        let first=document.createElement('button');first.className='btn alt';first.textContent=pos===0?'First ✓':'Set first';first.onclick=async()=>{cfg.mediaIds=[m.id,...cfg.mediaIds.filter(id=>id!==m.id)];await persist('First slideshow photo updated');await draw()};actions.append(first);
        let up=document.createElement('button');up.className='btn alt';up.textContent='↑';up.disabled=pos<=0;up.onclick=async()=>{let a=cfg.mediaIds,i=a.indexOf(m.id);if(i>0){[a[i-1],a[i]]=[a[i],a[i-1]];await persist('Slideshow order updated');await draw()}};actions.append(up);
        let down=document.createElement('button');down.className='btn alt';down.textContent='↓';down.disabled=pos<0||pos>=cfg.mediaIds.length-1;down.onclick=async()=>{let a=cfg.mediaIds,i=a.indexOf(m.id);if(i>=0&&i<a.length-1){[a[i+1],a[i]]=[a[i],a[i+1]];await persist('Slideshow order updated');await draw()}};actions.append(down);
      }
      grid.appendChild(card);
    }
  }
  await draw();
}; window.setupDiary=function(){ensure();let form=document.getElementById('memoryForm'),cam=document.getElementById('memoryCamera'),date=document.getElementById('memoryDate');if(date&&!date.value)date.value=new Date().toISOString().slice(0,10);form.onsubmit=async e=>{e.preventDefault();let fd=new FormData(form),m={id:uid('mem'),date:fd.get('date')||new Date().toISOString().slice(0,10),title:fd.get('title')||'Wedding memory',category:fd.get('category')||'Preparation',event:fd.get('event')||'',people:fd.get('people')||'',location:fd.get('location')||'',note:fd.get('note')||'',favorite:false,createdAt:new Date().toISOString(),mediaIds:[]};state.data.memories.unshift(m);let files=document.getElementById('memoryFiles').files;if(files.length){let before=new Set(state.data.mediaMeta.map(x=>x.id));await upload(files,{entityType:'memory',entityId:m.id,entityLabel:m.title,date:m.date,event:m.event,caption:m.title});m.mediaIds=state.data.mediaMeta.filter(x=>!before.has(x.id)&&x.entityId===m.id).map(x=>x.id)}await save('Memory saved');form.reset();date.value=new Date().toISOString().slice(0,10);renderMemoryDiary()};cam.onchange=async()=>{if(!cam.files?.length)return;let m={id:uid('mem'),date:new Date().toISOString().slice(0,10),title:'Captured memory',category:'Candid',event:'',people:'',location:'',note:'',favorite:false,createdAt:new Date().toISOString(),mediaIds:[]};state.data.memories.unshift(m);await upload(cam.files,{entityType:'memory',entityId:m.id,entityLabel:m.title,date:m.date,caption:m.title});await save('Memory captured');cam.value='';renderMemoryDiary()};document.getElementById('memorySearch').oninput=renderMemoryDiary;renderMemoryDiary()};
 window.renderMemoryDiary=async function(){let root=document.getElementById('memoryTimeline');if(!root)return;let q=(document.getElementById('memorySearch')?.value||'').toLowerCase(),list=(state.data.memories||[]).filter(x=>!q||(x.title+' '+x.note+' '+x.people+' '+x.event+' '+x.category).toLowerCase().includes(q)).sort((a,b)=>String(b.date).localeCompare(String(a.date)));root.innerHTML='';if(!list.length){root.innerHTML='<div class="empty-state">No memories yet. Save preparation moments too—not only wedding-day photos.</div>';return}for(const m of list){let el=document.createElement('article');el.className='memory-card';el.innerHTML='<div class="memory-date">'+esc(m.date)+'</div><div class="memory-main"><div class="memory-head"><div><span class="badge info">'+esc(m.category)+'</span><h3>'+esc(m.title)+'</h3></div></div><p>'+esc(m.note||'')+'</p><div class="memory-meta">'+[m.event,m.people,m.location].filter(Boolean).map(esc).join(' • ')+'</div><div class="memory-media"></div><div class="media-actions"><button class="btn warn">Delete memory</button></div></div>';el.querySelector('.btn.warn').onclick=async()=>{if(confirm('Delete this diary entry? Media remains in the Media Library.')){state.data.memories=state.data.memories.filter(x=>x.id!==m.id);await save('Memory deleted');renderMemoryDiary()}};let mr=el.querySelector('.memory-media');for(const mm of state.data.mediaMeta.filter(x=>x.entityType==='memory'&&x.entityId===m.id)){let u=await mediaUrl(mm),b=document.createElement('button');b.className='memory-thumb';b.innerHTML=(mm.type||'').startsWith('image/')&&u?'<img src="'+u+'" alt="">':'<span>PDF</span>';b.onclick=async()=>{let x=await mediaUrl(mm);if(x)window.open(x,'_blank')};mr.append(b)}root.append(el)}};
 window.renderRecentMemories=function(){let root=document.getElementById('recentMemories');if(!root)return;let list=(state.data.memories||[]).slice().sort((a,b)=>String(b.date).localeCompare(String(a.date))).slice(0,3);root.innerHTML=list.length?list.map(m=>'<a class="mini-card" href="/diary.html"><span>'+esc(m.date)+'</span><b>'+esc(m.title)+'</b><small>'+esc(m.category)+(m.people?' • '+esc(m.people):'')+'</small></a>').join(''):'<div class="empty-state">Start the memory diary with preparation days, family stories and blessings.</div>'};
 window.setupDocumentEvidence=function(){setupEntityMedia('document','documentMediaEntity','documentMediaFiles','documentCamera','documentMediaGrid')};
 function toData(blob){return new Promise((res,rej)=>{let r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(blob)})}
 function fromData(v){let p=v.split(','),mime=(p[0].match(/data:(.*?);/)||[])[1]||'application/octet-stream',bin=atob(p[1]),a=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)a[i]=bin.charCodeAt(i);return new Blob([a],{type:mime})}
 window.exportFullEvidenceBackup=async function(){let local=await allLocal(),arr=[];for(const r of local)arr.push({id:r.id,name:r.name,type:r.type,size:r.size,data:await toData(r.blob)});let blob=new Blob([JSON.stringify({format:'PankajWeddingFullBackup',version:1,exportedAt:new Date().toISOString(),state,media:arr})],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='pankaj-wedding-full-evidence-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)};
 window.importFullEvidenceBackup=async function(file){let p=JSON.parse(await file.text());if(p.format!=='PankajWeddingFullBackup'||!p.state)throw new Error('Invalid full backup');state=p.state;migrate();ensure();let d=await db();await new Promise(res=>{let tx=d.transaction(MEDIASTORE,'readwrite');tx.objectStore(MEDIASTORE).clear();tx.oncomplete=res;tx.onerror=res});for(const f of p.media||[]){let b=fromData(f.data);await put(f.id,new File([b],f.name||'evidence',{type:f.type||b.type}))}await save('Full evidence backup restored')};
 window.setupFullEvidenceBackup=function(){document.getElementById('exportFullBackup').onclick=()=>exportFullEvidenceBackup().catch(e=>alert(e.message));document.getElementById('importFullBackup').onchange=async e=>{let f=e.target.files?.[0];if(!f)return;if(confirm('Replace current local planner/media with this full backup?')){try{await importFullEvidenceBackup(f);location.reload()}catch(x){alert(x.message)}}};let sql=document.getElementById('mediaStorageSql');if(sql)sql.value=["insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)","values ('wedding-evidence','wedding-evidence',false,26214400,array['image/jpeg','image/png','image/webp','application/pdf'])","on conflict (id) do nothing;","","drop policy if exists wedding_evidence_select on storage.objects;","create policy wedding_evidence_select on storage.objects for select to authenticated using (bucket_id='wedding-evidence' and (storage.foldername(name))[1]=auth.uid()::text);","drop policy if exists wedding_evidence_insert on storage.objects;","create policy wedding_evidence_insert on storage.objects for insert to authenticated with check (bucket_id='wedding-evidence' and (storage.foldername(name))[1]=auth.uid()::text);","drop policy if exists wedding_evidence_update on storage.objects;","create policy wedding_evidence_update on storage.objects for update to authenticated using (bucket_id='wedding-evidence' and (storage.foldername(name))[1]=auth.uid()::text);","drop policy if exists wedding_evidence_delete on storage.objects;","create policy wedding_evidence_delete on storage.objects for delete to authenticated using (bucket_id='wedding-evidence' and (storage.foldername(name))[1]=auth.uid()::text);"].join('\\n');if(document.getElementById('copyMediaSql'))document.getElementById('copyMediaSql').onclick=async()=>{try{await navigator.clipboard.writeText(sql.value);toast('Storage SQL copied')}catch(e){sql.select();document.execCommand('copy')}}};
 ensure();
})();

/* ===== Unified table row actions: View / Edit / Delete ===== */


/* Safe duplicate cleanup / cross-module review v29 */
const dedupeModules=['tasks','events','expenses','vendors','shopping','guests','contacts','gifting','jewelleryRegister','cashLedger','inventory','vendorScopes','rooms','familyClothing','brideGifts','calendar','invitations','documents','mediaMeta','memories','eventCommands','foodPlan.stayDays','foodPlan.stayItems','receiptImports'];
const dedupeWhitelist=new Set(['contacts','rooms','documents','calendar','invitations','eventCommands','vendorScopes']);
function deArr(source,k){let v=source?.data;for(const p of k.split('.'))v=v?.[p];return Array.isArray(v)?v:[]}
function deAssign(k,a){let v=state.data,p=k.split('.');for(let i=0;i<p.length-1;i++){v[p[i]]=v[p[i]]||{};v=v[p[i]]}v[p[p.length-1]]=a}
function deNorm(v){return String(v??'').trim().toLowerCase().replace(/[\u2010-\u2015]/g,'-').replace(/[^a-z0-9\u0900-\u097f]+/g,' ').replace(/\s+/g,' ').trim()}
function deName(k,r){
 if(k==='tasks')return deNorm(canonicalTaskKey(r.title));
 const fields={events:['name','date','place'],receiptImports:['hash','fileName'],expenses:['item','event'],vendors:['name','event'],shopping:['name','event'],guests:['name','city','side'],contacts:['name','phone'],gifting:['name','relation','gift'],jewelleryRegister:['item','recipient'],cashLedger:['description','type','date','amount'],inventory:['item','category','location'],vendorScopes:['vendorId','scope'],rooms:['name'],familyClothing:['person','item'],brideGifts:['item'],calendar:['title','date'],invitations:['section','language'],documents:['title','type'],mediaMeta:['name','size','entityId'],memories:['title','date'],eventCommands:['event','date'],'foodPlan.stayDays':['date','event'],'foodPlan.stayItems':['name','category']};
 return (fields[k]||[]).map(f=>deNorm(r[f])).join('|');
}
function deSignature(r){return JSON.stringify(Object.keys(r||{}).filter(k=>!['id','createdAt','updatedAt','modifiedAt'].includes(k)).sort().map(k=>[k,r[k]]))}
function deTaskSafe(a,b){
 const userA=!String(a.id||'').startsWith('seed-'),userB=!String(b.id||'').startsWith('seed-');
 // Related titles aren't duplicates when assigned to different events.
 if(a.event&&b.event&&deNorm(a.event)!==deNorm(b.event))return false;
 // Two user-created tasks can be recurring or belong to different people.
 if(userA&&userB){
  for(const key of ['due','category','owner','assignee']){
   if(a[key]&&b[key]&&deNorm(a[key])!==deNorm(b[key]))return false;
  }
 }
 return true;
}
function deCandidates(){
 const list=[];
 for(const k of dedupeModules){
  const a=deArr(state,k),ids=new Map(),names=new Map();
  a.forEach((r,i)=>{
   if(!r||typeof r!=='object')return;
   let id=String(r.id||''),name=deName(k,r);
   if(id&&ids.has(id)){let j=ids.get(id),same=deSignature(r)===deSignature(a[j]);list.push({k,i,j,safe:same,why:same?'Identical record ID':'Conflicting values for same record ID'})}
   else if(id)ids.set(id,i);
   if(!name||!name.replace(/[|0]/g,'').trim())return;
   const found=names.get(name)||[];
   for(const j of found){
    if(String(a[j]?.id||'')===id)continue;
    const same=deSignature(a[j])===deSignature(r);
    list.push({k,i,j,safe:k==='tasks'?deTaskSafe(a[j],r):dedupeWhitelist.has(k)&&same,why:k==='tasks'&&!deTaskSafe(a[j],r)?'Possibly recurring task (different date/category)':same?'Identical content':'Same name with different details'});
   }
   found.push(i);names.set(name,found);
  });
 }
 return list;
}
function deArchive(k,loser,winner){
 state.data.integrityArchive=state.data.integrityArchive||[];
 state.data.integrityArchive.push({at:new Date().toISOString(),module:k,record:clone(loser),keptId:winner.id,reason:'Duplicate cleanup'});
 const old=String(loser.id||''),now=String(winner.id||'');
 if(old&&now&&old!==now){
  state.meta.integrityTombstones=state.meta.integrityTombstones||{};
  state.meta.integrityTombstones[k]=[...new Set([...(state.meta.integrityTombstones[k]||[]),old])];
  let singular={tasks:'task',expenses:'expense',vendors:'vendor',contacts:'contact',guests:'guest',documents:'document',memories:'memory'}[k]||k;
  for(const m of state.data.mediaMeta||[])if(m.entityId===old&&(m.entityType===singular||m.entityType===k))m.entityId=now;
  for(const x of state.data.cashLedger||[])if(k==='expenses'&&x.linkedExpense===old)x.linkedExpense=now;
 }
}
function integrityDedupeTasks(){
 const old=state.data.tasks||[],out=[],keys=new Map();let removed=0;
 for(const row of old){
  if(!row||!row.title){out.push(row);continue}
  const k=deName('tasks',row),indices=keys.get(k)||[];
  const pos=indices.find(i=>deTaskSafe(out[i],row));
  if(pos===undefined){out.push(row);indices.push(out.length-1);keys.set(k,indices);continue}
  const prev=out[pos],winner=taskRankGreater(taskKeepRank(row),taskKeepRank(prev))?row:prev,loser=winner===row?prev:row;
  if(taskProgressScore(loser.status)>taskProgressScore(winner.status))winner.status=loser.status;
  for(const field of ['notes','description','owner','due','priority','category','event','assignee','reminder'])if((winner[field]==null||winner[field]==='')&&loser[field]!=null&&loser[field]!=='')winner[field]=loser[field];
  deArchive('tasks',loser,winner);out[pos]=winner;removed++;
 }
 if(removed){state.data.tasks=out;state.meta.integrityCleanupAt=new Date().toISOString();state.data.history.unshift({id:'task-dedupe-v29-'+Date.now(),at:new Date().toISOString(),module:'Data Cleanup',record:'Tasks',field:'duplicates',oldValue:'',newValue:'Archived '+removed+' repeated tasks',note:'Progress, notes and survivor preserved'})}
 return removed;
}
function integrityExactCleanup(){
 let removed=0;
 for(const k of dedupeModules){
  if(k==='tasks')continue;
  const old=deArr(state,k),keep=[],byId=new Map(),byName=new Map();
  for(const r of old){
   if(!r||typeof r!=='object'){keep.push(r);continue}
   const id=String(r.id||''),key=deName(k,r);
   let duplicate=null;
   if(id&&byId.has(id)&&deSignature(byId.get(id))===deSignature(r))duplicate=byId.get(id);
   if(!duplicate&&dedupeWhitelist.has(k)&&key&&key.replace(/[|0]/g,'').trim()&&byName.has(key)&&deSignature(byName.get(key))===deSignature(r))duplicate=byName.get(key);
   if(duplicate){deArchive(k,r,duplicate);removed++;continue}
   keep.push(r);if(id&&!byId.has(id))byId.set(id,r);if(key&&!byName.has(key))byName.set(key,r);
  }
  if(keep.length!==old.length)deAssign(k,keep);
 }
 if(removed){state.meta.integrityCleanupAt=new Date().toISOString();state.data.history.unshift({id:'integrity-v29-'+Date.now(),at:new Date().toISOString(),module:'Data Cleanup',record:'All modules',field:'identical',oldValue:'',newValue:'Archived '+removed+' strictly identical entries',note:'Distinct transactions and media preserved'})}
 return removed;
}

/* v74: only a repeated batch ID with byte-identical content can be archived.
   Two visits with the same item/price/qty remain two real purchases. */
function integrityBatchCandidates(){
 const findings=[];
 for(const shopping of state.data.shopping||[]){
  const batches=shopping.purchaseBatches||[],ids=new Map(),imports=new Map();
  batches.forEach((b,i)=>{
   if(!b||typeof b!=='object')return;
   const id=String(b.id||'');
   if(id&&ids.has(id)){
    const j=ids.get(id),same=deSignature(batches[j])===deSignature(b);
    findings.push({shopId:shopping.id,shopName:shopping.name,i,j,safe:same,
      why:same?'Exact duplicate batch ID':'Same batch ID with conflicting details'});
   }else if(id)ids.set(id,i);
   if(b.importId){
    const key=[b.importId,deNorm(b.item),String(b.quantity),String(b.unitPrice)].join('|');
    const j=imports.get(key);
    if(j!==undefined&&batches[j].id!==id){
      findings.push({shopId:shopping.id,shopName:shopping.name,i,j,safe:false,
        why:'Same receipt and item values; could be distinct purchases'});
    }else if(j===undefined)imports.set(key,i);
   }
  });
 }
 return findings;
}
function integrityCleanDuplicateBatches(){
 let count=0;
 for(const shopping of state.data.shopping||[]){
  if(!Array.isArray(shopping.purchaseBatches))continue;
  const seen=new Map(),unique=[];
  for(const batch of shopping.purchaseBatches){
   if(!batch||typeof batch!=='object'){unique.push(batch);continue}
   const id=String(batch.id||''),older=id?seen.get(id):null;
   if(older&&deSignature(older)===deSignature(batch)){
    state.data.integrityArchive=state.data.integrityArchive||[];
    state.data.integrityArchive.push({at:new Date().toISOString(),module:'shopping.purchaseBatches',
      parentId:shopping.id,record:clone(batch),keptId:older.id,reason:'Exact duplicate batch ID'});
    count++;continue;
   }
   unique.push(batch);if(id&&!seen.has(id))seen.set(id,batch);
  }
  if(unique.length!==shopping.purchaseBatches.length){
    shopping.purchaseBatches=unique;
    if(shopping.purchaseBatchesEnabled)syncShoppingExpense(shopping);
  }
 }
 if(count){
  state.data.history=state.data.history||[];
  state.data.history.unshift({id:'batch-dedupe-v74-'+Date.now(),at:new Date().toISOString(),
   module:'Data Cleanup',record:'Shopping batches',field:'exact duplicate IDs',
   oldValue:'',newValue:'Archived '+count+' duplicate batch(s)',
   note:'Different legitimate purchases retained'});
 }
 return count;
}
function integrityCleanSafe(){if(!state?.data)return {tasks:0,other:0,batches:0};return {tasks:integrityDedupeTasks(),other:integrityExactCleanup(),batches:integrityCleanDuplicateBatches()}}
function integrityMergeTombstones(base,other){
 const result={},all=new Set([...Object.keys(base.meta?.integrityTombstones||{}),...Object.keys(other.meta?.integrityTombstones||{})]);
 for(const k of all){let s=new Set([...(base.meta?.integrityTombstones?.[k]||[]),...(other.meta?.integrityTombstones?.[k]||[])]);if(s.size)result[k]=[...s]}
 base.meta=base.meta||{};base.meta.integrityTombstones=result;
 for(const [k,ids] of Object.entries(result)){
  let x=base.data||{},p=k.split('.');for(let i=0;i<p.length-1;i++)x=x?.[p[i]];
  const last=p[p.length-1];if(x&&Array.isArray(x[last]))x[last]=x[last].filter(v=>!new Set(ids).has(String(v?.id||'')));
 }
 const m=new Map();for(const x of [...(other.data?.integrityArchive||[]),...(base.data?.integrityArchive||[])])m.set(x.module+'|'+x.record?.id+'|'+x.at,x);
 base.data.integrityArchive=[...m.values()];
 const dates=[base.meta.integrityCleanupAt,other.meta?.integrityCleanupAt].filter(Boolean).sort();if(dates.length)base.meta.integrityCleanupAt=dates[dates.length-1];
}

window.integrityRenderAudit=function(){
 const root=document.getElementById('integrityAuditResults');if(!root)return;
 const candidates=deCandidates(),batchIssues=integrityBatchCandidates();
 const safe=[...candidates.filter(x=>x.safe),...batchIssues.filter(x=>x.safe)].length;
 const pending=candidates.length+batchIssues.length-safe;
 const archived=state.data.integrityArchive?.length||0;
 root.replaceChildren();
 const strip=document.createElement('div');strip.className='stat-strip';
 for(const [label,value] of [['Safe duplicates',safe],['Needs review',pending],['Archived originals',archived]]){
  const box=document.createElement('div');box.className='statbox';
  const name=document.createElement('span');name.textContent=label;
  const number=document.createElement('b');number.textContent=value;
  box.append(name,number);strip.append(box);
 }
 root.append(strip);
 if(!candidates.length&&!batchIssues.length){
  const good=document.createElement('div');good.className='alert good';
  good.textContent='No duplicate candidates remain in the loaded wedding data.';root.append(good);
 }
 const makeTable=(title,records,rowValues)=>{
  if(!records.length)return;
  const head=document.createElement('h3');head.textContent=title;root.append(head);
  const wrap=document.createElement('div');wrap.className='table-wrap';
  const table=document.createElement('table'),body=document.createElement('tbody'),thead=document.createElement('thead');
  const header=document.createElement('tr');
  for(const label of ['Module','Original','Possible copy','Assessment','Action']){
   const cell=document.createElement('th');cell.textContent=label;header.append(cell);
  }
  thead.append(header);table.append(thead);
  records.slice(0,120).forEach(info=>{
   const row=document.createElement('tr');
   const values=rowValues(info);
   for(const text of values.slice(0,4)){
    const cell=document.createElement('td');cell.textContent=String(text??'');row.append(cell);
   }
   const actions=document.createElement('td');
   if(info.k==='tasks'&&!info.safe){
    const btn=document.createElement('button');btn.type='button';btn.className='btn alt';btn.textContent='Review';
    btn.addEventListener('click',()=>window.integrityReviewTaskPair(info));
    actions.append(btn);
   }else{
    const note=document.createElement('small');note.textContent=info.safe?'Safe to archive':'Keep / investigate';actions.append(note);
   }
   row.append(actions);body.append(row);
  });
  table.append(body);wrap.append(table);root.append(wrap);
 };
 makeTable('Cross-module possible duplicates',candidates,info=>{
  const a=deArr(state,info.k),get=x=>x?.title||x?.name||x?.item||x?.description||x?.section||x?.id||'(unnamed)';
  return [info.k,get(a[info.j]),get(a[info.i]),info.why+(info.safe?' • Safe':' • Review')];
 });
 makeTable('Shopping purchase batches',batchIssues.map(x=>({...x,k:'shopping.purchaseBatches'})),info=>{
  const shopping=(state.data.shopping||[]).find(x=>x.id===info.shopId);
  const arr=shopping?.purchaseBatches||[];
  return ['shopping',info.shopName,arr[info.i]?.item||arr[info.i]?.id||'(batch)',info.why];
 });
 const note=document.createElement('p');note.className='mini';
 note.textContent='Scanned '+dedupeModules.length+' modules plus nested purchase batches on this device. Exact matches are archived, not permanently erased. Distinct payments, bookings, guests and legitimate repeated purchases stay separate. Use Recovery Snapshots to restore if needed.';
 root.append(note);
};
window.integrityReviewTaskPair=async function(info){
 const tasks=state.data.tasks||[];
 const a=tasks[info.j],b=tasks[info.i];
 if(!a||!b||!String(a.title||'').trim()||canonicalTaskKey(a.title)!==canonicalTaskKey(b.title)){
  alert('Records changed. Please rescan before reviewing.');return;
 }
 const details=x=>(x.title||'Task')+'\\nOwner: '+(x.owner||'—')+' • Due: '+(x.due||'—')+' • Category: '+(x.category||'—')+' • Status: '+(x.status||'—')+' • ID: '+x.id;
 const choice=prompt('POSSIBLE DUPLICATE TASKS\\n\\n1. '+details(a)+'\\n\\n2. '+details(b)+'\\n\\nEnter 1 to KEEP the first task, 2 to KEEP the second task, or Cancel to preserve both.','');
 if(choice!=='1'&&choice!=='2')return;
 const winner=choice==='1'?a:b,loser=choice==='1'?b:a;
 if(!confirm('Archive task "'+loser.title+'" ('+(loser.id||'unknown ID')+')? Its original record will remain in the cleanup archive. Only do this when both entries represent the SAME assignment.'))return;
 try{
  if(typeof window.integritySafetySnapshot!=='function')throw Error('Safety snapshots unavailable');
  await window.integritySafetySnapshot();
  for(const field of ['notes','description','priority','event','reminder']){
   if(!winner[field]&&loser[field])winner[field]=loser[field];
  }
  deArchive('tasks',loser,winner);
  state.data.tasks=state.data.tasks.filter(x=>x!==loser);
  state.data.history=state.data.history||[];
  state.data.history.unshift({id:uid('task-merge'),at:new Date().toISOString(),
   module:'Data Cleanup',record:winner.title,field:'manual task review',
   oldValue:loser.id,newValue:winner.id,note:'User explicitly selected survivor'});
  await save('Duplicate task archived');
  integrityRenderAudit();
 }catch(err){alert('Review canceled: '+(err.message||err))}
};
window.integritySetupAudit=function(){
 document.getElementById('integrityScan')?.addEventListener('click',integrityRenderAudit);
 document.getElementById('integrityCleanup')?.addEventListener('click',async()=>{
  const safe=deCandidates().filter(x=>x.safe).length+integrityBatchCandidates().filter(x=>x.safe).length;
  if(!safe){integrityRenderAudit();return}
  if(!confirm('Archive '+safe+' exact / safe duplicate records? A recovery snapshot will be created first. Payments, separate vendor bookings and genuine repeat purchases remain untouched.'))return;
  try{
   if(typeof window.integritySafetySnapshot!=='function')throw Error('Safety snapshots unavailable');
   await window.integritySafetySnapshot();
   const result=integrityCleanSafe();
   await save('Safe duplicates consolidated');
   integrityRenderAudit();
   alert('Archived '+(result.tasks+result.other+result.batches)+' confirmed duplicate record(s). Originals are stored in the cleanup archive.');
  }catch(error){alert('Cleanup canceled: '+(error.message||error))}
 });
 integrityRenderAudit();
};


(function(){
const KEY='PWM_PRIVATE_',ACTIVE=KEY+'ACTIVE',CONF=KEY+'CONF',AUTH=KEY+'AUTH',ACK=KEY+'ACK',DIRTY=KEY+'DIRTY',CONFLICT=KEY+'CONFLICT';
const TABLE='wedding_private_state',origLoad=window.load,origSave=window.save;
let busy=false,timer=null,scanTimer=null;
const SQL=[
'create table if not exists public.wedding_private_state (',
' user_id uuid primary key references auth.users(id) on delete cascade,',
' revision bigint not null default 1,',
' state jsonb not null,',
' updated_at timestamptz not null default now()',
');',
'alter table public.wedding_private_state enable row level security;',
'revoke all on public.wedding_private_state from anon;',
'grant select, insert, update on public.wedding_private_state to authenticated;',
'drop policy if exists wedding_private_read on public.wedding_private_state;',
'drop policy if exists wedding_private_create on public.wedding_private_state;',
'drop policy if exists wedding_private_edit on public.wedding_private_state;',
'create policy wedding_private_read on public.wedding_private_state for select to authenticated using ((select auth.uid())=user_id);',
'create policy wedding_private_create on public.wedding_private_state for insert to authenticated with check ((select auth.uid())=user_id);',
'create policy wedding_private_edit on public.wedding_private_state for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);',
'-- To close the OLD anonymous shared table after migrating:',
'-- revoke all on public.wedding_shared_state from anon;',
'-- drop policy if exists wedding_shared_select on public.wedding_shared_state;',
'-- drop policy if exists wedding_shared_insert on public.wedding_shared_state;',
'-- drop policy if exists wedding_shared_update on public.wedding_shared_state;'
].join('\n');
function read(k){try{return JSON.parse(localStorage.getItem(k)||'null')}catch{return null}}
function put(k,v){if(v===null)localStorage.removeItem(k);else localStorage.setItem(k,JSON.stringify(v))}
function enabled(){return localStorage.getItem(ACTIVE)==='1'}
function pending(){return localStorage.getItem(DIRTY)==='1'}
function setPending(v){localStorage.setItem(DIRTY,v?'1':'0');const el=document.getElementById('privatePending');if(el)el.textContent=v?'Local changes not yet backed up':'No pending local changes'}
function alertState(s,ok=false){const el=document.getElementById('privateFeedback');if(el){el.textContent=s;el.className='alert'+(ok?' good':'')}if(enabled())document.querySelectorAll('[data-db]').forEach(x=>x.textContent='Private cloud • '+(ok?'verified':'local only / needs action'))}
function uidFrom(s){try{let p=s.access_token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');p+='='.repeat((4-p.length%4)%4);return JSON.parse(atob(p)).sub}catch{return null}}
function headers(s){return {apikey:read(CONF).anonKey,Authorization:'Bearer '+s.access_token,'Content-Type':'application/json'}}
async function session(){
  const c=read(CONF);let s=read(AUTH);if(!c||!s)return null;
  if((s.expires_at||0)>Date.now()/1000+60)return s;
  const r=await fetch(c.url+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{apikey:c.anonKey,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:s.refresh_token})});
  if(!r.ok){put(AUTH,null);return null}
  s=await r.json();s.expires_at=Math.floor(Date.now()/1000)+(s.expires_in||3600);put(AUTH,s);return s;
}
async function sign(email,password,register){
 const c=read(CONF);if(!c)throw Error('First save Supabase Project URL and publishable key.');
 const r=await fetch(c.url+(register?'/auth/v1/signup':'/auth/v1/token?grant_type=password'),{method:'POST',headers:{apikey:c.anonKey,'Content-Type':'application/json'},body:JSON.stringify({email,password})});
 const j=await r.json().catch(()=>({}));if(!r.ok)throw Error(j.error_description||j.msg||j.message||'Sign-in error');
 const s=j.access_token?j:j.session;
 if(!s){alertState('Sign-up created; verify your email then sign in.',true);return}
 s.expires_at=Math.floor(Date.now()/1000)+(s.expires_in||3600);put(AUTH,s);
 alertState('Signed in. Checking for existing cloud data.',true);await sync();
}
async function cloud(){
 const c=read(CONF),s=await session();if(!c||!s)throw Error('Sign in to your private Supabase account first.');
 const uid=uidFrom(s);if(!uid)throw Error('Invalid login session');
 const r=await fetch(c.url+'/rest/v1/'+TABLE+'?user_id=eq.'+uid+'&select=state,revision,updated_at',{headers:headers(s)});
 if(!r.ok)throw Error('Private table unavailable (HTTP '+r.status+'). Run the Private Cloud SQL first.');
 return {row:(await r.json())[0]||null,c,s,uid};
}
async function checkpoint(reason,data){
 const db=await openDB();if(!db||!db.objectStoreNames.contains('snapshots'))throw Error('IndexedDB recovery snapshots unavailable');
 const entry={at:new Date().toISOString(),reason,state:clone(data||state)},key=entry.at+'-'+Math.random().toString(36).slice(2);
 await new Promise((resolve,reject)=>{const tx=db.transaction('snapshots','readwrite');tx.objectStore('snapshots').put(entry,key);tx.oncomplete=resolve;tx.onerror=()=>reject(Error('Snapshot failed'))});
 const keys=await new Promise(resolve=>{const q=db.transaction('snapshots','readonly').objectStore('snapshots').getAllKeys();q.onsuccess=()=>resolve(q.result||[]);q.onerror=()=>resolve([])});
 if(keys.length>8)await new Promise(resolve=>{const tx=db.transaction('snapshots','readwrite');keys.sort().slice(0,keys.length-8).forEach(k=>tx.objectStore('snapshots').delete(k));tx.oncomplete=resolve;tx.onerror=resolve});
 return true;
}
window.integritySafetySnapshot=async function(){return checkpoint('Before manual duplicate cleanup v74')};
window.beforePlannerMigration=async function(v){
 if(!v?.data||localStorage.getItem('PWM_DUPLICATE_CHECKPOINT_V74'))return;
 try{await checkpoint('Before safe duplicate cleanup v74',v);localStorage.setItem('PWM_DUPLICATE_CHECKPOINT_V74','1')}catch(e){console.warn('Duplicate cleanup snapshot unavailable',e)}
};
async function restoreRemote(info){
 await checkpoint('Before pulling private cloud data');
 state=clone(info.row.state);migrate();await origSave(false,false);
 put(ACK,{uid:info.uid,revision:info.row.revision});setPending(false);put(CONFLICT,null);
 alertState('Cloud version loaded; old local copy saved as snapshot.',true);
}
async function createCloud(info){
 const r=await fetch(info.c.url+'/rest/v1/'+TABLE,{method:'POST',headers:{...headers(info.s),Prefer:'return=representation'},body:JSON.stringify({user_id:info.uid,revision:1,state:clone(state),updated_at:new Date().toISOString()})});
 if(!r.ok)throw Error('Cloud setup/write rejected (HTTP '+r.status+').');
 const body=await r.json();if(body.length!==1)throw Error('Cloud write did not verify');
 put(ACK,{uid:info.uid,revision:1});put(CONFLICT,null);setPending(false);alertState('Private cloud backup created, revision 1.',true);
}
async function updateCloud(info,revision){
 const r=await fetch(info.c.url+'/rest/v1/'+TABLE+'?user_id=eq.'+info.uid+'&revision=eq.'+revision+'&select=revision',{
 method:'PATCH',headers:{...headers(info.s),Prefer:'return=representation'},body:JSON.stringify({state:clone(state),revision:revision+1,updated_at:new Date().toISOString()})});
 if(!r.ok)throw Error('Cloud write rejected (HTTP '+r.status+'); local changes retained.');
 const rows=await r.json();if(rows.length!==1){put(CONFLICT,{reason:'Another device saved a new revision'});throw Error('Conflict: cloud updated from another device. Choose which copy to keep.')}
 put(ACK,{uid:info.uid,revision:revision+1});put(CONFLICT,null);setPending(false);alertState('Private cloud saved and verified (revision '+(revision+1)+').',true);
}
function conflictUI(){const e=document.getElementById('privateConflict');if(!e)return;const info=read(CONFLICT);e.hidden=!info;if(info)document.getElementById('privateConflictReason').textContent=info.reason+'; local data has NOT been deleted.'}
async function sync(){
 if(!enabled()||busy)return false;busy=true;
 try{
  if(!navigator.onLine){alertState('Offline. All changes stay on this device until you reconnect.');return false}
  const info=await cloud(),ack=read(ACK);
  if(ack?.uid&&ack.uid!==info.uid){put(CONFLICT,{reason:'Another account was previously connected'});throw Error('Different account. Resolve before syncing.')}
  if(!info.row){
   if(ack){put(CONFLICT,{reason:'Previous cloud row is missing'});throw Error('Previously synced cloud row missing; no overwrite performed.')}
   await checkpoint('Before first cloud upload');await createCloud(info);
  }else if(!ack){
   put(CONFLICT,{reason:'A cloud copy already exists on this account'});throw Error('Cloud data exists. Choose Use Cloud or Keep Local in Settings.');
  }else if(+info.row.revision!==+ack.revision){
   if(pending()){put(CONFLICT,{reason:'Cloud and local copies have both changed'});throw Error('Conflict requires manual review.')}
   await restoreRemote(info);
  }else if(pending())await updateCloud(info,+ack.revision);
  else alertState('Private cloud verified, revision '+ack.revision+'.',true);
  return true;
 }catch(e){alertState(e.message);return false}
 finally{busy=false;conflictUI()}
}
async function resolveConflict(choice){
 const info=await cloud();await checkpoint('Before resolving cloud conflict');
 if(choice==='cloud'){
  if(!info.row)throw Error('No cloud data available');await restoreRemote(info);location.reload();
 }else{
  if(!info.row)await createCloud(info);
  else await updateCloud(info,+info.row.revision);
 }
 conflictUI();
}
window.recoverySnapshots=async function(){
 const box=document.getElementById('snapshotList');if(!box)return;
 const db=await openDB();if(!db?.objectStoreNames.contains('snapshots')){box.textContent='Snapshots unavailable';return}
 const rows=await new Promise(resolve=>{const q=db.transaction('snapshots','readonly').objectStore('snapshots').getAll();q.onsuccess=()=>resolve(q.result||[]);q.onerror=()=>resolve([])});
 box.innerHTML='';rows.sort((a,b)=>b.at.localeCompare(a.at)).forEach(s=>{
  const row=document.createElement('div');row.className='snapshot-line';const lab=document.createElement('span');lab.textContent=new Date(s.at).toLocaleString('en-IN')+' • '+s.reason;
  const btn=document.createElement('button');btn.className='btn alt';btn.textContent='Restore';btn.onclick=async()=>{
   if(!confirm('Restore this planner snapshot? Media files remain in the separate evidence store.'))return;
   await checkpoint('Before manually restoring snapshot');state=clone(s.state);migrate();setPending(true);await origSave('Planner restored locally',true);location.reload();
  };row.append(lab,btn);box.append(row)
 });
};
window.privateCloudSetup=function(){
 const url=document.getElementById('prUrl'),key=document.getElementById('prKey'),mail=document.getElementById('prMail'),pwd=document.getElementById('prPass');
 if(!url)return;
 const c=read(CONF)||read('PWM_SUPABASE_CONFIG')||{};url.value=c.url||'';key.value=c.anonKey||'';
 document.getElementById('prSql').value=SQL;
 document.getElementById('prMode').textContent=enabled()?'Private cloud selected':'Local or legacy mode';
 document.getElementById('prConnect').onclick=async()=>{
  if(!/^https:\/\/[\w-]+\.supabase\.co\/?$/i.test(url.value.trim())){alert('Enter a valid Supabase project URL');return}
  if(key.value.trim().length<15){alert('Enter your publishable key; never use a service-role key.');return}
  if(!confirm('Switch to private cloud? Your local wedding records will be snapshotted first.'))return;
  try{await checkpoint('Before enabling private cloud');put(CONF,{url:url.value.trim().replace(/\/+$/,''),anonKey:key.value.trim()});
   localStorage.setItem(ACTIVE,'1');put(AUTH,null);put(ACK,null);put(CONFLICT,null);setPending(true);location.reload();
  }catch(e){alert('Could not create safety snapshot: '+e.message)}
 };
 document.getElementById('prSignup').onclick=async()=>{try{await sign(mail.value.trim(),pwd.value,true)}catch(e){alertState(e.message)}pwd.value=''};
 document.getElementById('prLogin').onclick=async()=>{try{await sign(mail.value.trim(),pwd.value,false)}catch(e){alertState(e.message)}pwd.value=''};
 document.getElementById('prSync').onclick=sync;
 document.getElementById('prLocal').onclick=async()=>{if(!confirm('Return to local/legacy mode? Current local records stay unchanged.'))return;await checkpoint('Before leaving private sync');localStorage.removeItem(ACTIVE);location.reload()};
 document.getElementById('prLogout').onclick=()=>{put(AUTH,null);alertState('Signed out; local records retained.')};
 document.getElementById('prCopy').onclick=()=>navigator.clipboard.writeText(SQL).then(()=>alertState('SQL copied.',true)).catch(()=>{document.getElementById('prSql').select()});
 document.getElementById('prCloud').onclick=async()=>{if(!confirm('Use cloud copy? A local recovery snapshot will be saved.'))return;try{await resolveConflict('cloud')}catch(e){alertState(e.message)}};
 document.getElementById('prKeep').onclick=async()=>{if(!confirm('Overwrite cloud copy with your local records?'))return;try{await resolveConflict('local')}catch(e){alertState(e.message)}};
 document.getElementById('prSnapshot').onclick=async()=>{try{await checkpoint('Manual safety snapshot');recoverySnapshots();alertState('Recovery snapshot saved.',true)}catch(e){alertState(e.message)}};
 if(enabled())alertState(read(AUTH)?'Account configured; synchronizing':'Private cloud selected. Sign in to finish.');
 else alertState('Private mode is not yet enabled; current records remain local.');
 document.getElementById('prPending').textContent=pending()?'Pending local changes':'No pending edits';
 conflictUI();recoverySnapshots();
};
window.load=async function(){await origLoad();if(enabled()){if(read(AUTH))await sync();if(!scanTimer)scanTimer=setInterval(()=>{if(document.visibilityState==='visible')sync()},90000)}return state};
window.save=async function(msg,touch){if(enabled()&&msg!==false)setPending(true);const outcome=await origSave(msg,touch);
 if(msg!==false&&Date.now()-(Number(localStorage.getItem('PWM_LAST_SNAPSHOT'))||0)>1800000){
  checkpoint('Periodic saved-state checkpoint').then(()=>localStorage.setItem('PWM_LAST_SNAPSHOT',String(Date.now()))).catch(console.warn)
 }
 if(enabled()){clearTimeout(timer);timer=setTimeout(sync,1800)}return outcome;
};
window.addEventListener('online',()=>{if(enabled()&&pending())sync()});
})();


(function(){
 function summary(){
  const d=state.data,expenses=d.expenses||[],payments=d.cashLedger||[],issues=[],ids=new Set(expenses.map(x=>x.id));
  function warn(level,name,detail){issues.push({level,name,detail})}
  const linked=new Map();
  for(const p of payments)if(p.appliedToExpense){
    if(!ids.has(p.linkedExpense))warn('critical',p.description,'Linked expense missing.');
    linked.set(p.linkedExpense,(linked.get(p.linkedExpense)||0)+(p.direction==='refund'?-1:1)*(+p.amount||0));
  }
  for(const e of expenses){
    const paid=+e.paid||0,actual=+e.actual||0,expected=+e.expected||0,applied=linked.get(e.id)||0;
    if(expected<0||actual<0||paid<0)warn('critical',e.item,'Negative financial amount.');
    if(paid>Math.max(expected,actual)+0.01)warn('review',e.item,'Paid exceeds expected and actual/committed amount.');
    if(actual>expected&&expected>0)warn('review',e.item,'Over budget by '+money(actual-expected)+'.');
    if(applied>paid+0.01)warn('critical',e.item,'New linked payments exceed paid amount.');
    if(paid>0&&!payments.some(p=>p.linkedExpense===e.id))warn('review',e.item,'Existing paid balance has no linked receipt (could be historical advance).');
  }
  for(const v of d.vendors||[]){const id=vendorExpenseId(v);if(id&&!ids.has(id))warn('critical',v.name,'Vendor expense missing.')}
  const adjusted=linkLedgerTotals();return{issues,total:adjusted.actual,paid:adjusted.paid,expected:adjusted.expected};
 }
 window.weddingFinancialSummary=summary;
 window.weddingFinancePage=function(){
  const form=document.getElementById('postWeddingPayment');if(!form)return;
  const select=form.querySelector('[name=expense]');select.innerHTML='<option value="">Choose expense…</option>';
  state.data.expenses.forEach(e=>select.add(new Option(e.item+' • '+money(e.paid)+' paid',e.id)));
  form.querySelector('[name=date]').value=new Date().toISOString().slice(0,10);
  const render=()=>{
   const result=summary();document.getElementById('moneyTotal').textContent=money(result.total);
   document.getElementById('moneyPaid').textContent=money(result.paid);
   document.getElementById('moneyExpected').textContent=money(result.expected);
   document.getElementById('moneyIssues').textContent=result.issues.length;
   const root=document.getElementById('moneyFindings');root.innerHTML='';
   if(!result.issues.length)root.innerHTML='<div class="alert good">No anomalies detected in loaded financial records.</div>';
   result.issues.forEach(x=>{const el=document.createElement('div');el.className='finance-finding';
    const b=document.createElement('b');b.textContent=x.level.toUpperCase()+' • '+x.name;
    const s=document.createElement('span');s.textContent=x.detail;el.append(b,s);root.append(el)});
   const body=document.getElementById('moneyLedger');body.innerHTML='';
   state.data.cashLedger.filter(x=>x.appliedToExpense).slice(0,100).forEach(p=>{
    const tr=document.createElement('tr');[p.date,p.description,money(p.amount),p.mode,p.reference||'—'].forEach(v=>{const c=document.createElement('td');c.textContent=v;tr.append(c)});body.append(tr);
   });
  };
  form.onsubmit=async e=>{
   e.preventDefault();const btn=form.querySelector('[type=submit]');btn.disabled=true;
   try{
    const f=new FormData(form),ex=state.data.expenses.find(e=>e.id===f.get('expense')),amt=Number(f.get('amount')),kind=f.get('kind'),reference=String(f.get('reference')||'').trim();
    if(!ex||!Number.isFinite(amt)||amt<=0)throw Error('Choose an expense and positive amount.');
    if(reference&&state.data.cashLedger.some(p=>p.appliedToExpense&&p.linkedExpense===ex.id&&String(p.reference||'').trim().toLowerCase()===reference.toLowerCase()))throw Error('Receipt/UTR already posted to this expense.');
    const paid=+ex.paid||0,delta=kind==='refund'?-amt:amt,next=Math.round((paid+delta)*100)/100;
    if(next<0)throw Error('Refund exceeds paid amount.');
    if(next>Math.max(+ex.actual||0,+ex.expected||0)+0.005)throw Error('Payment exceeds commitment. Update expense first.');
    const row={id:uid('posted'),date:f.get('date')||new Date().toISOString().slice(0,10),type:kind==='refund'?'Refund / Return':'Recorded payment',description:(kind==='refund'?'Refund: ':'Payment: ')+ex.item,amount:amt,mode:f.get('mode'),reference,linkedExpense:ex.id,appliedToExpense:true,direction:kind,createdAt:new Date().toISOString()};
    state.data.cashLedger.unshift(row);ex.paid=next;ex.status=next===0?'Pending':next>=Math.max(+ex.actual||0,+ex.expected||0)?'Paid':'Part-Paid';
    audit('Payments',ex.item,kind,paid,next,'Reference '+(reference||'not provided'));
    await save('Linked payment recorded');form.reset();form.querySelector('[name=date]').value=new Date().toISOString().slice(0,10);render();
   }catch(err){alert(err.message)}
   finally{btn.disabled=false}
  };
  document.getElementById('moneyRescan').onclick=render;render();
 };
})();


/* Cross-module integrity v84: stable expenses, linked tasks, and no implied payments. */
function linkAmount(n){return Math.round(Math.max(0,Number(n)||0)*100)/100}
function linkParent(r){
 const p=String(r.person||'').toLowerCase(),c=String(r.category||'').toLowerCase(),n=String(r.name||'').toLowerCase();
 if(c.includes('jewel'))return null;
 if(/footwear|accessor|supplies|tailoring/.test(c))return 'footwear';
 if(c==='clothing')return {mummy:'mother',nidhi:'bhabhi',priyanka:'sister',mukesh:'brothers',naimish:'babyClothes'}[p]||(/pintu|ravi/.test(p)?'brothers':null);
 if(p==='pankaj')return c==='wedding & baraat'?(/sehra|kalgi|safa|mala|stole|mojari|kamarband|watch|handkerchief/.test(n)?'groomAccessories':'groomWedding'):'groomOther';
 return null;
}
function linkExpenses(){
 const ex=state.data.expenses||(state.data.expenses=[]);
 for(const s of state.data.shopping||[])if(s&&(s.autoCalc||s.purchaseBatchesEnabled||s.expenseId||SHOP_LINK[s.id]))syncShoppingExpense(s);
 for(const v of state.data.vendors||[]){
  if(!v?.id)continue;const eId=vendorExpenseId(v);
  if(eId&&ex.some(e=>e.id===eId))continue;
  const value=linkAmount(v.total),paid=linkAmount(v.paid);
  if(!value&&!paid)continue;
  const id='vendor-auto-'+v.id;
  if(!ex.some(e=>e.id===id))ex.push({id,item:v.name||'Vendor',category:'Booked Vendors',event:v.event||'',expected:value,actual:value,paid,status:v.status||'Booked',notes:'Vendor '+v.id,sourceId:v.id});
  v.expenseId=id;
 }
 for(const r of state.data.familyWearables||[]){
  if(!r?.id)continue;const id='wearable-exp-'+r.id;
  let e=ex.find(x=>x.id===id);
  const price=String(r.price??'').trim(),priced=price!==''&&Number.isFinite(Number(price))&&Number(price)>=0;
  const qty=parseFloat(String(r.quantity||'1'))||0,amount=priced?linkAmount(qty*Number(price)):0;
  const status=String(r.status||'pending').toLowerCase(),bought=status==='purchased'||status==='packed';
  if(!e&&!priced&&!bought)continue;
  if(!e){e={id,sourceType:'familyWearables',sourceId:r.id,paid:0,notes:'Family Checklist '+r.id};ex.push(e)}
  r.expenseId=e.id;e.item=r.person+' • '+r.name;e.category=/jewel/i.test(r.category)?'Jewellery & Gifts':'Clothing';e.event=r.category||'Family Shopping';
  e.expected=amount;e.actual=bought?amount:0;e.paid=linkAmount(e.paid);
  e.status=bought?(priced?'Purchased':'Needs Estimate'):status==='not required'?'Skipped':priced?'Planned':'Needs Estimate';
  const parent=linkParent(r);e.rolledIntoExpenseId=parent&&ex.some(x=>x.id===parent)?parent:null;
  e.financialDetailOnly=!!e.rolledIntoExpenseId;
 }
}
function linkTaskStates(){
 const tasks=state.data.tasks||(state.data.tasks=[]);
 for(const r of state.data.familyWearables||[]){
  if(!r?.id)continue;
  const status=String(r.status||'pending').toLowerCase(),buy=status==='purchased'||status==='packed',partial=status==='partially purchased';
  let t=tasks.find(x=>x.linkType==='familyWearables'&&x.linkId===r.id);
  if(!t&&(buy||partial)&&!r.linkTaskDisabled){
   const title='Buy '+r.name+' for '+r.person;
   t=tasks.find(x=>!x.linkType&&canonicalTaskKey(x.title)===canonicalTaskKey(title));
   if(t){t.linkType='familyWearables';t.linkId=r.id}
   else t={id:'linked-wearable-'+r.id,title:'Buy '+r.name+' for '+r.person,category:'Shopping',
     owner:r.person,priority:'Medium',due:'',status:buy?'Done':'In Progress',linkType:'familyWearables',linkId:r.id};if(!tasks.includes(t))tasks.push(t);
  }
  if(!t)continue;
  const changed=r._linkedStatus===undefined||r._linkedStatus!==r.status,taskChanged=t._linkedStatus!==undefined&&t._linkedStatus!==t.status;
  if(taskChanged&&!changed)r.status=t.status==='Done'?'purchased':t.status==='In Progress'?'partially purchased':t.status==='Not Required'?'not required':'pending';
  else if(changed||t._linkedStatus===undefined)t.status=buy?'Done':partial?'In Progress':status==='not required'?'Not Required':'Pending';
  r._linkedStatus=r.status;t._linkedStatus=t.status;
 }
 const snap=state.meta.linkedChecklistSnapshot||(state.meta.linkedChecklistSnapshot={}),entries=[],checks=state.checks||(state.checks={});
 for(const [g,arr] of Object.entries(state.data.checklists||{}))arr.forEach((title,i)=>entries.push({key:checkKey(g,i),name:String(title),g}));
 for(const [g,arr] of Object.entries(state.data.travelChecklist||{}))arr.forEach((title,i)=>entries.push({key:'travel::'+checkKey(g,i),name:String(title),g:'Travel'}));
 const occurrences=new Map();entries.forEach(r=>{const k=canonicalTaskKey(r.name);occurrences.set(k,(occurrences.get(k)||0)+1)});
 for(const r of entries){
  let t=tasks.find(x=>x.linkType==='checklist'&&x.linkId===r.key);
  if(!t&&occurrences.get(canonicalTaskKey(r.name))===1)t=tasks.find(x=>!x.linkType&&canonicalTaskKey(x.title)===canonicalTaskKey(r.name));
  const checked=!!checks[r.key],previous=snap[r.key];
  if(!previous){snap[r.key]={checked,taskStatus:t?.status||null};continue}
  const checkboxChanged=checked!==previous.checked,taskChanged=!!t&&t.status!==previous.taskStatus;
  if(checkboxChanged){
   if(!t&&checked){t={id:'linked-check-'+r.key,title:r.name,category:r.g,owner:'Family',priority:'Medium',due:'',
      status:'Done',linkType:'checklist',linkId:r.key};tasks.push(t)}
   else if(t){t.status=checked?'Done':'Pending';if(!t.linkType){t.linkType='checklist';t.linkId=r.key}}
  }else if(taskChanged&&t)checks[r.key]=t.status==='Done';
  snap[r.key]={checked:!!checks[r.key],taskStatus:t?.status||null};
 }
}
function linkReconcile(){if(!state?.data)return;linkTaskStates();linkOtherBooleanTasks();linkExpenses()}
function linkLedgerTotals(){
 const ex=state.data.expenses||[],visible=ex.filter(e=>!e.financialDetailOnly),totals={expected:0,actual:0,paid:0};
 for(const k of Object.keys(totals))totals[k]=visible.reduce((s,x)=>s+linkAmount(x[k]),0);
 const grouped=new Map();
 for(const e of ex.filter(e=>e.financialDetailOnly&&e.rolledIntoExpenseId)){
  const g=grouped.get(e.rolledIntoExpenseId)||{expected:0,actual:0,paid:0};
  for(const k of Object.keys(totals))g[k]+=linkAmount(e[k]);grouped.set(e.rolledIntoExpenseId,g);
 }
 for(const [id,items] of grouped){
  const p=ex.find(x=>x.id===id);if(!p)continue;
  for(const k of Object.keys(totals))totals[k]+=Math.max(0,items[k]-linkAmount(p[k]));
 }
 return totals;
}


/* Mirrors explicitly checked packing, gifting and vendor-scope controls to linked Tasks. */
function linkOtherBooleanTasks(){
 const tasks=state.data.tasks||(state.data.tasks=[]);
 const specs=[
   ['familyClothing','packed','Shopping',r=>'Pack '+r.item+' for '+r.person],
   ['gifting','packed','Gifting',r=>'Pack '+r.gift+' for '+r.name],
   ['gifting','handed','Gifting',r=>'Hand over '+r.gift+' to '+r.name],
   ['brideGifts','packed','Gifting',r=>'Pack bride gift: '+r.item],
   ['vendorScopes','verified','Vendors',r=>'Verify vendor scope: '+r.vendor]
 ];
 for(const [collection,field,category,title] of specs){
  for(const row of state.data[collection]||[]){
   if(!row?.id)continue;
   const key=collection+':'+field;
   let t=tasks.find(x=>x.linkType===key&&x.linkId===row.id);
   if(!t&&row[field]&&!row.linkTaskDisabled){
    t=tasks.find(x=>!x.linkType&&canonicalTaskKey(x.title)===canonicalTaskKey(title(row)));
    if(t){t.linkType=key;t.linkId=row.id}
    else t={id:'linked-'+key+'-'+row.id,title:title(row),category,owner:'Family',priority:'Medium',due:'',
      status:'Done',linkType:key,linkId:row.id};if(!tasks.includes(t))tasks.push(t);
   }
   if(!t)continue;
   const snapshotKey='_linkedTask_'+field;
   const rowChanged=row[snapshotKey]===undefined||row[snapshotKey]!==!!row[field];
   const taskChanged=t._linkedStatus!==undefined&&t._linkedStatus!==t.status;
   if(taskChanged&&!rowChanged)row[field]=t.status==='Done';
   else if(rowChanged||t._linkedStatus===undefined)t.status=row[field]?'Done':'Pending';
   row[snapshotKey]=!!row[field];t._linkedStatus=t.status;
  }
 }
}

/* User-deleted linked tasks must not reappear on the next save. */
function linkPreventTaskReseed(task){
 if(!task||!task.linkType)return;
 const type=String(task.linkType);
 if(type==='familyWearables'){
   const row=(state.data.familyWearables||[]).find(x=>x.id===task.linkId);
   if(row)row.linkTaskDisabled=true;
 }else if(type.includes(':')){
   const collection=type.split(':')[0];
   const row=(state.data[collection]||[]).find(x=>x.id===task.linkId);
   if(row)row.linkTaskDisabled=true;
 }
}


/* Sarees v86: gift tiers separate from family purchases. */
function sareePolicy(){
 const d=state?.data;if(!d)return;
 const es=d.expenses||[],ss=d.shopping||[],m=state.meta=state.meta||{};
 const expense=id=>es.find(x=>x.id===id);
 const good=expense('sareeGood'),gift=ss.find(x=>x.id==='s-1'),budget=expense('saree33');
 if(!m.sareePolicyV86){
  if(good){
   if(good.item==='1 better saree'||good.item==='Premium gifting saree')good.item='Family saree — recipient to assign';
   if(good.category==='Jewellery & Gifts'&&good.event==='Gifting'){good.category='Clothing';good.event='Family Sarees'}
   if(!ss.some(s=>s.id==='s-family-original'))ss.push({id:'s-family-original',name:good.item,
    sareeType:'family',recipient:'Unassigned',expenseId:good.id,expenseCategory:'Clothing',event:'Family Sarees',
    targetQty:1,completedQty:Number(good.actual)>0?1:0,unit:'pcs',unitPrice:Number(good.expected)||1500,
    actualUnitPrice:Number(good.actual)||1500,paid:Number(good.paid)||0,status:'Purchased',
    autoCalc:false,market:'',notes:'Original family saree. Recipient pending.'});
  }
  for(const i of d.inventory||[])if(i.id==='i2'&&/better saree|premium gifting/i.test(i.item||'')){
   i.item='Family saree — recipient to assign';i.category='Clothing';
  }
  if(gift){gift.name='Gifting sarees (₹250, ₹300, ₹350)';gift.sareeType='gifting'}
  if(budget&&Number(budget.expected)===18700&&Number(budget.actual||0)===0&&Number(budget.paid||0)===0
   &&Number(gift?.targetQty)===50&&Number(gift?.completedQty)===16){
   budget.expected=11900;budget.notes='34 remaining × ₹350 maximum. Price tiers ₹250, ₹300, ₹350. Prior default was ₹18,700.';
  }
  m.sareePolicyV86=true;
 }
 const parent={'Mummy':'mother','Nidhi / Bhabhi':'bhabhi','Priyanka':'sister'};
 for(const s of ss){
  if(!s?.sareeType||s.id==='s-1')continue;
  const exp=s.expenseId?expense(s.expenseId):expense('shop-exp-'+s.id);
  if(!exp)continue;
  const aggregate=s.sareeType==='gifting'?budget:expense(parent[s.recipient]);
  exp.financialDetailOnly=!!aggregate;exp.rolledIntoExpenseId=aggregate?.id||null;
  exp.category=s.sareeType==='gifting'?'Jewellery & Gifts':'Clothing';
  exp.event=s.sareeType==='gifting'?'Gifting':'Family Sarees';
 }
 if(gift?.purchaseBatchesEnabled&&Array.isArray(gift.purchaseBatches)){
  const found=gift.purchaseBatches.filter(b=>Number(b.quantity)===1&&Number(b.unitPrice)===1500&&
   /premium|better/i.test(String(b.item||'')+' '+String(b.notes||'')));
  const family=ss.find(s=>s.id==='s-family-original');
  if(found.length===1&&family){
   const b=found[0];
   if(!b.paymentId&&!(Number(b.paid)>0)){
    gift.purchaseBatches=gift.purchaseBatches.filter(x=>x!==b);
    if(!family.purchaseBatchesEnabled){family.purchaseBatchesEnabled=true;family.purchaseBatches=[]}
    if(!family.purchaseBatches.some(x=>x.id===b.id))
     family.purchaseBatches.push({...b,item:'Family saree — recipient to assign',
      notes:String(b.notes||'')+' • Original batch moved from gifting'});
    syncShoppingExpense(gift);syncShoppingExpense(family);
    m.sareePremiumBatchMoved=true;
   }else m.sareeNeedsBatchReview=true;
  }
  // The original 16 × ₹300 are already booked in the separate saree16 expense.
  const already=expense('saree16'),remaining=expense('saree33');
  if(already&&Number(already.actual)>=4800&&remaining&&
    gift.purchaseBatches.some(b=>Number(b.quantity)===16&&Number(b.unitPrice)===300)){
    const sum=gift.purchaseBatches.reduce((n,b)=>n+Number(b.legacy?b.amount:((+b.unitPrice||0)*(+b.quantity||0))),0);
    remaining.actual=Math.max(0,Math.round((sum-4800)*100)/100);
  }
 }

 const postBudget=expense('saree33');
 if(postBudget&&Number(postBudget.expected)===18700&&Number(postBudget.actual||0)===0&&Number(postBudget.paid||0)===0
   &&Number(gift?.targetQty)===50&&Number(gift?.completedQty)===16){
   postBudget.expected=11900;
   postBudget.notes='Remaining 34 gifting sarees; ₹250/₹300/₹350 only. Maximum remaining estimate ₹11,900.';
 }
 if(gift?.purchaseBatches?.some(b=>Number(b.unitPrice)>350))m.sareeNeedsBatchReview=true;
 else if(m.sareePremiumBatchMoved)m.sareeNeedsBatchReview=false;
}
