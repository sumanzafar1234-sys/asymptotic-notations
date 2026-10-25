const $ = (id) => document.getElementById(id);
const initialRecords = [
  {id: 105, name: "Ahmed"}, {id: 101, name: "Sara"},
  {id: 108, name: "Ali"}, {id: 102, name: "Hina"}
];
let records = initialRecords.map(x => ({...x}));
let fileMode = "heap";
let treeMode = "btree";
let hashKeys = [];
let currentQuestion = 0;
let selectedAnswers = {};
let quizFinished = false;

const quiz = [
 {q:"Which of the following is volatile storage?",o:["SSD","HDD","RAM","Optical disc"],a:2,e:"RAM is volatile: its contents are normally lost when power is removed."},
 {q:"What is a database page or block?",o:["A single field only","A unit of data transfer that can contain multiple records","A hash function","A CPU instruction"],a:1,e:"DBMS commonly reads and writes data in pages or blocks."},
 {q:"Which file organization does not maintain a particular search-key order?",o:["Heap","Ordered","Sequential","Sorted"],a:0,e:"Heap files do not maintain a particular ordering by search key."},
 {q:"A file is ordered by Student ID. An index is built on Department. In the lecture's traditional terminology, it is a…",o:["Primary index","Secondary index","Collision","Sparse page"],a:1,e:"Department is not the ordering key, so this is a secondary index."},
 {q:"A sparse index usually contains…",o:["An entry for every record","Only selected index entries","No keys","Only duplicate keys"],a:1,e:"A sparse index contains selected entries and is commonly used with ordered files."},
 {q:"What is 143 mod 10?",o:["1","3","4","5"],a:1,e:"143 = 14 × 10 + 3, so the remainder is 3."},
 {q:"What is a hash collision?",o:["A deleted record","Different keys mapping to the same bucket","Sorting records","A full database page"],a:1,e:"A collision happens when different keys map to the same hash location."},
 {q:"Which collision method probes for another available table slot?",o:["Chaining","Open addressing","Heap organization","Sparse indexing"],a:1,e:"Open addressing follows a probing rule to find another available slot."},
 {q:"Which tree commonly has linked leaf nodes that help with range queries?",o:["B+ Tree","Heap file","Hash bucket","RAM"],a:0,e:"B+ Tree leaves are commonly linked, supporting ordered traversal and range queries."},
 {q:"Which structure is naturally suited to ordered range queries?",o:["Hashing alone","B+ Tree index","Unordered heap alone","One hash bucket"],a:1,e:"A B+ Tree maintains ordered keys and supports traversal through leaf entries."}
];

function navigate(page) {
  document.querySelectorAll(".page").forEach(p => p.classList.toggle("active", p.id === `page-${page}`));
  document.querySelectorAll(".nav").forEach(b => b.classList.toggle("active", b.dataset.page === page));
  const names = {overview:"Overview",files:"File Organization",indexing:"Indexing & Trees",hashing:"Hashing Playground",quiz:"Quiz Center"};
  $("currentCrumb").textContent = names[page] || "Overview";
  window.scrollTo({top:0,behavior:"smooth"});
}
document.querySelectorAll("[data-page]").forEach(b => b.addEventListener("click", () => navigate(b.dataset.page)));
document.querySelectorAll("[data-goto]").forEach(b => b.addEventListener("click", () => navigate(b.dataset.goto)));

function renderRecords() {
  const body = $("recordsBody");
  let shown = [...records];
  if (fileMode === "ordered") shown.sort((a,b)=>a.id-b.id);
  if (fileMode === "hash") shown.sort((a,b)=>(a.id%10)-(b.id%10) || a.id-b.id);
  body.innerHTML = shown.map((r,i) => {
    let position = fileMode === "hash" ? `Bucket ${r.id%10}` : `Position ${i+1}`;
    let note = fileMode === "heap" ? "Unordered storage" : fileMode === "ordered" ? "Sorted by ID" : `h(${r.id}) = ${r.id%10}`;
    return `<tr><td>${position}</td><td>${r.id}</td><td>${escapeHtml(r.name)}</td><td>${note}</td></tr>`;
  }).join("");
  $("recordCount").textContent = `${records.length} RECORD${records.length===1?"":"S"}`;
  const messages = {
    heap:"Heap view: records are not arranged by Student ID. In a simple scan, the DBMS may need to check multiple records to find a key.",
    ordered:"Ordered view: records are shown in ascending Student ID order. Maintaining this order can make ordered traversal useful, but insertions may need extra work.",
    hash:"Hash view: each key maps to bucket ID mod 10. Different IDs can map to the same bucket, which is a collision."
  };
  $("fileInsight").textContent = messages[fileMode];
}
document.querySelectorAll("#fileTabs [data-mode]").forEach(b=>b.addEventListener("click",()=>{
  fileMode=b.dataset.mode;
  document.querySelectorAll("#fileTabs .tab").forEach(t=>t.classList.toggle("active",t===b));
  renderRecords();
}));
$("addRecord").addEventListener("click",()=>{
  const id=Number($("studentId").value), name=$("studentName").value.trim();
  if(!Number.isInteger(id)||id<1||!name){alert("Please enter a valid positive Student ID and student name.");return;}
  if(records.some(r=>r.id===id)){alert("That Student ID already exists. Please use a unique ID.");return;}
  records.push({id,name}); $("studentId").value=""; $("studentName").value=""; renderRecords();
});
$("searchRecord").addEventListener("click",()=>{
  const id=Number($("searchId").value);
  if(!$("searchId").value){$("searchResult").className="result-box muted";$("searchResult").textContent="Enter a Student ID to search.";return;}
  const r=records.find(x=>x.id===id);
  $("searchResult").className="result-box "+(r?"":"muted");
  $("searchResult").textContent = r ? `Record found: Student ID ${r.id}, Name ${r.name}. In ${fileMode} view, ${fileMode === "hash" ? "the calculated bucket is " + (r.id % 10) : "the record is shown in the current file arrangement."}` : "No student with that ID was found in the current dataset.";
});
function renderIndex() {
 const type=$("indexType").value, visual=$("indexVisual"), ex=$("indexExplanation");
 const entries = {
 dense:{chips:["101 → R1","102 → R2","103 → R3","104 → R4"],text:"Dense index: an entry exists for every search-key value or record, depending on index design. It can make direct lookup convenient but usually needs more storage."},
 sparse:{chips:["101 → Page 1","103 → Page 2"],text:"Sparse index: only selected entries are stored. In an ordered file, the DBMS can use an index entry to find the relevant page and continue searching there."},
 primary:{chips:["101 → Page 1","102 → Page 2","103 → Page 3"],text:"Traditional primary index: built on the ordering key of a physically ordered data file. Here, Student ID is the file's ordering key."},
 secondary:{chips:["CS → Records 101, 103","IT → Record 102","SE → Record 104"],text:"Secondary index: built on an attribute that is not the file's physical ordering key. Here, Department can help locate matching students."}
 }[type];
 visual.innerHTML=entries.chips.map(c=>`<div class="index-chip">${c}</div>`).join("");
 ex.textContent=entries.text;
}
$("indexType").addEventListener("change",renderIndex);
document.querySelectorAll("[data-tree]").forEach(b=>b.addEventListener("click",()=>{treeMode=b.dataset.tree;document.querySelectorAll("[data-tree]").forEach(t=>t.classList.toggle("active",t===b));renderTree();}));
$("treeKey").addEventListener("change",renderTree);
function renderTree(){
 const key=Number($("treeKey").value), visual=$("treeVisual");
 const found=[20,40,50,70].includes(key);
 const leafGroups=[[10,20],[30,40,50],[60,70,80]];
 const selectedLeaf=key<=20?0:key<=50?1:2;
 const rootKeys=[30,60];
 visual.innerHTML=`<div class="tree-caption">${treeMode==="btree"?"B-Tree simplified search path":"B+ Tree: internal keys guide the search; data entries are at leaves"}</div>
 <div class="tree-node">${rootKeys.map(k=>`<span class="tree-key ${(!treeMode || (key===k && found))?"hit":""}">${k}</span>`).join("")}</div>
 <div class="tree-children">${leafGroups.map((group,i)=>`<div class="tree-leaf">${group.map(k=>`<span class="tree-key ${found&&k===key?"hit":""}">${k}</span>`).join("")}</div>`).join("")}</div>
 <div class="tree-caption">${found?`Key ${key} is highlighted in the conceptual tree.`:`Key ${key} is not present in this example. A search would follow the relevant branch and report not found.`}</div>`;
 $("treeExplanation").textContent=treeMode==="btree"?
  `B-Tree concept: compare ${key} with the root separators 30 and 60, then inspect the relevant child. In a B-Tree, associated record information may occur in internal or leaf nodes. ${found?"The key is present in the example.":"The selected key is not present in the example."}`:
  `B+ Tree concept: internal keys guide the search to a leaf. Data entries are at leaf level in the common textbook model, and linked leaves help with ordered traversal. ${found?"The key is present in the example.":"The selected key is not present in the example."}`;
}
function renderBuckets(){
 const mode=$("collisionMode").value, grid=$("bucketGrid");
 let slots=Array.from({length:10},()=>[]);
 if(mode==="chain"){
   hashKeys.forEach(k=>slots[k%10].push(k));
 }else{
   hashKeys.forEach(k=>{let idx=k%10, tries=0;while(slots[idx].length && tries<10){idx=(idx+1)%10;tries++;}if(tries<10)slots[idx].push(k);});
 }
 grid.innerHTML=slots.map((arr,i)=>`<div class="bucket"><div class="bucket-head"><span>BUCKET</span><b>${i}</b></div><div class="bucket-keys">${arr.length?arr.map(k=>`<span class="key-pill ${mode==="chain"&&arr.length>1?"collision":""}">${k}</span>`).join(""):'<span class="tree-caption">Empty</span>'}</div></div>`).join("");
 const collisions=mode==="chain"?slots.filter(s=>s.length>1).length:hashKeys.length-new Set(hashKeys.map(k=>{let idx=k%10,tries=0;while(hashKeys.slice(0,hashKeys.indexOf(k)).some(prev=>{let p=prev%10;while(slots[p].length&&p!==idx){p=(p+1)%10;}return p===idx;})){idx=(idx+1)%10;tries++;if(tries>10)break;}return idx;})).size;
 $("hashInsight").textContent=mode==="chain"?
  `Chaining view: ${hashKeys.length} key(s) inserted. ${collisions} bucket(s) currently contain more than one key. Keys that hash to the same bucket are grouped together.`:
  "Open addressing view: each key starts at k mod 10; if occupied, linear probing checks the next slot until it finds space. This is a simplified linear-probing demonstration.";
}
$("insertHash").addEventListener("click",()=>{
 const raw=$("hashKey").value, key=Number(raw);
 if(raw===""||!Number.isInteger(key)||key<0){alert("Enter a non-negative integer key.");return;}
 if(hashKeys.includes(key)){alert("That key is already inserted. Try a different key.");return;}
 if(hashKeys.length>=10){alert("The demo has 10 buckets. Reset it to try another set of keys.");return;}
 const bucket=key%10;
 $("calcExplainer"); 
 hashKeys.push(key);
 $("hashCalculation").innerHTML=`<b>Calculation:</b> ${key} mod 10 = <b>${bucket}</b>. ${hashKeys.length>1&&hashKeys.slice(0,-1).some(k=>k%10===bucket)?"<b>Collision:</b> another inserted key maps to this bucket.":"The key maps to bucket "+bucket+"."}`;
 renderBuckets(); $("hashKey").value="";
});
$("resetHash").addEventListener("click",()=>{hashKeys=[];$("hashCalculation").textContent="Try inserting 123, 143 and 153 to see a collision.";renderBuckets();});
$("collisionMode").addEventListener("change",()=>{renderBuckets();});
function escapeHtml(s){return s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}

function renderQuestion(){
 const q=quiz[currentQuestion], picked=selectedAnswers[currentQuestion];
 $("quizCounter").textContent=`QUESTION ${String(currentQuestion+1).padStart(2,"0")} / ${quiz.length}`;
 $("quizProgress").style.width=`${((currentQuestion+1)/quiz.length)*100}%`;
 $("quizScoreLabel").textContent=quizFinished?`Score: ${quiz.filter((x,i)=>selectedAnswers[i]===x.a).length}/${quiz.length}`:"Practice mode";
 $("quizQuestion").innerHTML=`<div class="question-title">${q.q}</div><div class="options">${q.o.map((opt,i)=>`<button class="option ${picked===i?"selected":""} ${picked!==undefined&&i===q.a?"correct":""} ${picked===i&&picked!==q.a?"wrong":""}" data-answer="${i}" ${picked!==undefined?"disabled":""}><span class="letter">${String.fromCharCode(65+i)}</span><span>${opt}</span></button>`).join("")}</div>`;
 document.querySelectorAll("[data-answer]").forEach(b=>b.addEventListener("click",()=>{
   if(selectedAnswers[currentQuestion]!==undefined)return;
   selectedAnswers[currentQuestion]=Number(b.dataset.answer);
   $("quizFeedback").classList.remove("hidden");
   const correct=selectedAnswers[currentQuestion]===q.a;
   $("quizFeedback").classList.toggle("bad",!correct);
   $("quizFeedback").textContent=(correct?"Correct! ":"Not quite. Correct answer: "+q.o[q.a]+". ")+q.e;
   if(currentQuestion===quiz.length-1 && Object.keys(selectedAnswers).length===quiz.length){quizFinished=true;}
   renderQuestion();
 }));
 if(picked!==undefined){
   $("quizFeedback").classList.remove("hidden");
   const correct=picked===q.a;
   $("quizFeedback").classList.toggle("bad",!correct);
   $("quizFeedback").textContent=(correct?"Correct! ":"Correct answer: "+q.o[q.a]+". ")+q.e;
 }else{$("quizFeedback").classList.add("hidden");$("quizFeedback").textContent="";}
 $("prevQuestion").disabled=currentQuestion===0;
 $("nextQuestion").textContent=currentQuestion===quiz.length-1?(Object.keys(selectedAnswers).length===quiz.length?"View results":"Finish later"):"Next question →";
}
$("prevQuestion").addEventListener("click",()=>{if(currentQuestion>0){currentQuestion--;renderQuestion();}});
$("nextQuestion").addEventListener("click",()=>{
 if(currentQuestion<quiz.length-1){currentQuestion++;renderQuestion();return;}
 if(Object.keys(selectedAnswers).length===quiz.length){
   const score=quiz.filter((q,i)=>selectedAnswers[i]===q.a).length;
   $("quizQuestion").innerHTML=`<div class="module-icon ${score>=6?"green":"orange"}">${score>=6?"✓":"↻"}</div><div class="question-title">You scored ${score} out of ${quiz.length}</div><p>${score>=8?"Excellent work! You have a strong grasp of these concepts.":score>=6?"Good progress. Review the explanations for the questions you missed.":"Keep practicing. Revisit the modules, then try again."}</p><div class="insight">Your result is based on the answers selected in this practice quiz. Use the explanations to revise before your class quiz.</div>`;
   $("quizFeedback").classList.add("hidden");$("quizActions");$("nextQuestion").textContent="Review first question";$("nextQuestion").onclick=()=>{currentQuestion=0;renderQuestion();$("nextQuestion").onclick=null;};
 }else{
   const first=quiz.findIndex((q,i)=>selectedAnswers[i]===undefined);
   currentQuestion=first<0?0:first;renderQuestion();
 }
});
$("restartQuiz").addEventListener("click",()=>{currentQuestion=0;selectedAnswers={};quizFinished=false;$("nextQuestion").onclick=null;renderQuestion();});
renderRecords();renderIndex();renderTree();renderBuckets();renderQuestion();
