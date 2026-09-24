'use strict';
// Workspace controls use the existing API and data maps in index.html.
const view={zoom:1,selected:null,section:'tree',filter:'all',pan:null,history:[],historyIndex:-1,replaying:false,historyBatch:false};
const $=id=>document.getElementById(id);
const personName=p=>[p.first_name,p.last_name].filter(Boolean).join(' ')||'Unnamed person';
function setTheme(choice){
  choice={light:'botanical',dark:'midnight'}[choice]||choice;
  localStorage.setItem('ft_theme',choice);
  const effective=choice==='system'?(window.matchMedia?.('(prefers-color-scheme: dark)').matches?'midnight':'botanical'):choice;
  document.documentElement.dataset.theme=effective;
  $('theme-choice').value=choice;
  const bg=$('canvas-bg');
  if(['#f5f0e8','#f8faf6','#1c2521','#f7f3e9','#eef2f7'].includes(bg.value)){
    bg.value={botanical:'#f8faf6',archive:'#f7f3e9',slate:'#eef2f7',midnight:'#1c2521'}[effective];
    applyCanvasBg();
  }
  $('theme-menu').hidden=true;
  $('theme-button').title='Theme: '+effective;
}
function toggleThemeMenu(){$('theme-menu').hidden=!$('theme-menu').hidden;}
function setCardDensity(choice){
  document.documentElement.dataset.density=choice;
  localStorage.setItem('ft_density',choice);
  $('density-choice').value=choice;
  refreshAllCards();draw();
}
const year=s=>String(s||'').match(/\d{4}$/)?.[0]||'';
const lifespan=p=>[year(p.birth_date)||'?',year(p.death_date)].join('–');
const people=()=>[...D.persons.values()].sort((a,b)=>personName(a).localeCompare(personName(b)));
const originalApi=api;
api=async function(resource,method='GET',body=null,id=''){
  const result=await originalApi(resource,method,body,id);
  if(CFG.mode==='local' && method!=='GET' && !view.replaying && !view.historyBatch) queueMicrotask(recordHistory);
  return result;
};
function recordHistory(){
  if(CFG.mode!=='local'||view.replaying||view.historyBatch)return;
  const snapshot=JSON.stringify(lread());
  if(view.history[view.historyIndex]===snapshot)return;
  view.history=view.history.slice(0,view.historyIndex+1);
  view.history.push(snapshot);
  if(view.history.length>40)view.history.shift();
  view.historyIndex=view.history.length-1;
  updateHistoryButtons();
}
function updateHistoryButtons(){
  $('undo-btn').disabled=CFG.mode!=='local'||view.historyIndex<=0;
  $('redo-btn').disabled=CFG.mode!=='local'||view.historyIndex>=view.history.length-1;
  $('undo-btn').title=CFG.mode==='local'?'Undo':'Undo is available in Local mode';
}
async function historyStep(direction){
  const next=view.historyIndex+direction;
  if(CFG.mode!=='local'||next<0||next>=view.history.length)return;
  view.replaying=true;
  try{
    const target=JSON.parse(view.history[next]);
    await originalApi('import','POST',target);
    view.historyIndex=next;
    await loadAll();
    updateHistoryButtons();
    showToast(direction<0?'Undone':'Redone');
  }catch(e){showToast('History failed: '+e.message);}finally{view.replaying=false;}
}
function refreshWorkspace(){
  if(view.mode!==CFG.mode){view.mode=CFG.mode;view.history=[];view.historyIndex=-1;}
  ensureCanvasBounds();
  $('empty-state').hidden=D.persons.size!==0;
  $('empty-sample').hidden=CFG.mode!=='local';
  if(view.selected&&!D.persons.has(view.selected))view.selected=null;
  if(view.selected)renderInspector();
  renderView();
  updateSearch();
  if(view.history.length===0)recordHistory();
  updateHistoryButtons();
}
window.refreshWorkspace=refreshWorkspace;
function ensureCanvasBounds(){
  const placed=[...D.persons.values()].filter(p=>p.canvas_x!=null);
  if(!placed.length)return;
  const right=Math.max(...placed.map(p=>+p.canvas_x+320));
  const bottom=Math.max(...placed.map(p=>+p.canvas_y+260));
  if(right>UI.canvasW||bottom>UI.canvasH){
    $('cw').value=Math.max(UI.canvasW,Math.ceil(right/400)*400);
    $('ch').value=Math.max(UI.canvasH,Math.ceil(bottom/400)*400);
    applyCanvasSize();updateStage();
  }
}
function updateStage(){
  $('cinner').style.transform=`scale(${view.zoom})`;
  $('stage').style.width=(UI.canvasW*view.zoom)+'px';
  $('stage').style.height=(UI.canvasH*view.zoom)+'px';
  $('zoom-readout').textContent=Math.round(view.zoom*100)+'%';
}
function setZoom(next,anchorX=null,anchorY=null){
  const wrap=$('cwrap'),old=view.zoom;
  next=Math.max(.25,Math.min(2.5,Math.round(next*100)/100));
  const x=anchorX??wrap.clientWidth/2,y=anchorY??wrap.clientHeight/2;
  const contentX=(wrap.scrollLeft+x)/old,contentY=(wrap.scrollTop+y)/old;
  view.zoom=next;updateStage();
  wrap.scrollLeft=contentX*next-x;wrap.scrollTop=contentY*next-y;
}
function centerPerson(id){
  const p=D.persons.get(id);if(!p||p.canvas_x==null)return;
  const wrap=$('cwrap');
  wrap.scrollTo({left:(+p.canvas_x+96)*view.zoom-wrap.clientWidth/2,top:(+p.canvas_y+48)*view.zoom-wrap.clientHeight/2,behavior:'smooth'});
}
function fitTree(){
  const placed=[...D.persons.values()].filter(p=>p.canvas_x!=null);
  if(!placed.length)return;
  const minX=Math.min(...placed.map(p=>+p.canvas_x)),minY=Math.min(...placed.map(p=>+p.canvas_y));
  const maxX=Math.max(...placed.map(p=>+p.canvas_x+220)),maxY=Math.max(...placed.map(p=>+p.canvas_y+125));
  const wrap=$('cwrap');
  setZoom(Math.min(1.25,(wrap.clientWidth-80)/(maxX-minX+40),(wrap.clientHeight-90)/(maxY-minY+40)));
  wrap.scrollTo({left:Math.max(0,(minX+maxX)/2*view.zoom-wrap.clientWidth/2),top:Math.max(0,(minY+maxY)/2*view.zoom-wrap.clientHeight/2),behavior:'smooth'});
}
function selectPerson(id){
  view.selected=id;
  $('inspector').hidden=!id;
  document.querySelectorAll('.pc').forEach(el=>el.classList.remove('selected','dim'));
  if(!id)return;
  $('pc-'+id)?.classList.add('selected');
  showView('tree');renderInspector();centerPerson(id);
}
async function placeAndSelect(id){await placeOnCanvas(id);selectPerson(id);}
function relatives(id){
  const parents=[],children=[],partners=[],siblings=[];
  D.parentChild.forEach(pc=>{
    const couple=D.couples.get(pc.couple_id),other=couple?(couple.person1_id===pc.parent_id?couple.person2_id:couple.person1_id):null;
    if(pc.child_id===id){parents.push(pc.parent_id);if(other)parents.push(other);}
    if(pc.parent_id===id||other===id)children.push(pc.child_id);
  });
  D.couples.forEach(c=>{if(c.person1_id===id)partners.push(c.person2_id);if(c.person2_id===id)partners.push(c.person1_id);});
  D.parentChild.forEach(pc=>{if(parents.includes(pc.parent_id)&&pc.child_id!==id)siblings.push(pc.child_id);});
  return {parents:[...new Set(parents)],children:[...new Set(children)],partners:[...new Set(partners)],siblings:[...new Set(siblings)]};
}
function ancestorDepths(id){
  const distances=new Map([[id,0]]),queue=[id];
  for(let i=0;i<queue.length;i++){
    const current=queue[i],depth=distances.get(current);
    if(depth>D.persons.size)break;
    for(const parent of relatives(current).parents)if(!distances.has(parent)){distances.set(parent,depth+1);queue.push(parent);}
  }
  return distances;
}
function relationshipBetween(a,b){
  if(a===b)return 'Same person';
  if(relatives(a).partners.includes(b))return 'Partners';
  const aa=ancestorDepths(a),bb=ancestorDepths(b);
  const common=[...aa.keys()].filter(id=>bb.has(id)).sort((x,y)=>aa.get(x)+bb.get(x)-aa.get(y)-bb.get(y))[0];
  if(!common)return 'No family connection recorded';
  const da=aa.get(common),db=bb.get(common);
  const prefix=n=>n===2?'Grand':n>2?'Great-'.repeat(n-2)+'grand':'';
  if(da===0)return prefix(db)+'parent';
  if(db===0)return prefix(da)+'child';
  if(da===1&&db===1)return 'Siblings';
  if(da===1)return (db>2?'Great-'.repeat(db-2):'')+'aunt / uncle';
  if(db===1)return (da>2?'Great-'.repeat(da-2):'')+'niece / nephew';
  const n=Math.min(da,db)-1;
  const ordinal=n%100>=11&&n%100<=13?'th':({1:'st',2:'nd',3:'rd'}[n%10]||'th');
  const removal=Math.abs(da-db);
  return `${n}${ordinal} cousins${removal?`, ${removal} generation${removal===1?'':'s'} removed`:''}`;
}
function showRelationship(id){
  const p=D.persons.get(view.selected),other=D.persons.get(id),el=$('relationship-result');
  if(!el)return;
  if(!other){el.textContent='';return;}
  const label=relationshipBetween(p.id,other.id);
  el.textContent=label.includes('cousin')||['Partners','Siblings','No family connection recorded'].includes(label)?
    `${personName(p)} and ${personName(other)}: ${label}`:
    `${personName(p)} is ${label.toLowerCase()} of ${personName(other)}`;
}
function focusPerson(){
  if(!view.selected)return;
  const rel=relatives(view.selected);
  const visible=new Set([view.selected,...rel.parents,...rel.children,...rel.partners,...rel.siblings]);
  document.querySelectorAll('.pc').forEach(el=>el.classList.toggle('dim',!visible.has(el.id.slice(3))));
  showToast('Immediate family highlighted');
}
function renderInspector(){
  const p=D.persons.get(view.selected);if(!p)return;
  const rel=relatives(p.id),detail=(label,v)=>v?`<p><b>${label}</b>${esc(v)}</p>`:'';
  const related=(label,ids)=>ids.length?`<div class="ins-section"><h3>${label}</h3>${ids.map(id=>{const person=D.persons.get(id);return person?`<button class="relation" onclick="selectPerson('${id}')">${esc(personName(person))} →</button>`:''}).join('')}</div>`:'';
  $('inspector').innerHTML=`<button class="ins-close" onclick="selectPerson(null)" aria-label="Close details">×</button>${portraitMarkup(p,'ins-avatar')}<div class="inspector-name">${esc(personName(p))}</div><p class="inspector-life">${esc(lifespan(p))}</p><div class="inspector-actions"><button onclick="openEditPerson('${p.id}')">Edit details</button>${p.canvas_x==null?`<button onclick="placeAndSelect('${p.id}')">Place on tree</button>`:'<button onclick="focusPerson()">Focus family</button>'}</div><div class="ins-section"><h3>Life</h3>${detail('Birth', [p.birth_date,p.birth_place].filter(Boolean).join(' · '))}${detail('Death',[p.death_date,p.death_place].filter(Boolean).join(' · '))}${detail('Birth name',p.maiden_name)}${detail('Occupation',p.occupation)}${detail('Education',p.education)}${detail('Eye color',p.eye_color)}${detail('Hair color',p.hair_color)}${detail('Gender',p.gender)}${detail('Notes',p.notes)}</div>${related('Parents',rel.parents)}${related('Partners',rel.partners)}${related('Children',rel.children)}${related('Siblings',rel.siblings)}<div class="ins-section"><h3>Relationship lookup</h3><select class="relationship-select" aria-label="Compare person" onchange="showRelationship(this.value)"><option value="">Compare with…</option>${people().filter(other=>other.id!==p.id).map(other=>`<option value="${other.id}">${esc(personName(other))}</option>`).join('')}</select><p id="relationship-result"></p></div><div class="ins-section"><h3>Add relationship</h3><div class="inspector-actions"><button onclick="startCouple('${p.id}','married',event)">Spouse</button><button onclick="startCouple('${p.id}','unmarried',event)">Partner</button><button onclick="startSolo('${p.id}',event)">Child</button></div></div><div class="ins-section"><button onclick="deletePersonDirect('${p.id}')">Delete person</button></div>`;
}
function showView(section){
  view.section=section;
  document.querySelectorAll('.rail-btn').forEach(el=>el.classList.toggle('active',el.dataset.view===section));
  $('sidebar').classList.toggle('open',section==='settings');
  $('content-panel').hidden=section==='tree'||section==='settings';
  $('zoom-controls').classList.toggle('is-hidden',section!=='tree'&&section!=='settings');
  renderView();
}
function renderView(){
  if(!['people','timeline','research'].includes(view.section))return;
  $('view-eyebrow').textContent={people:'DIRECTORY',timeline:'FAMILY HISTORY',research:'RESEARCH DESK'}[view.section];
  $('view-title').textContent={people:'People',timeline:'Timeline',research:'Research overview'}[view.section];
  if(view.section==='people')renderPeople();
  if(view.section==='timeline')renderTimeline();
  if(view.section==='research')renderResearch();
}
function renderPeople(){
  const all=people(),unplaced=all.filter(p=>p.canvas_x==null),incomplete=all.filter(p=>!p.birth_date||!p.birth_place);
  const filters=[['all','All',all.length],['unplaced','Unplaced',unplaced.length],['incomplete','Incomplete',incomplete.length]];
  const list=view.filter==='unplaced'?unplaced:view.filter==='incomplete'?incomplete:all;
  $('content-body').innerHTML=`<div class="filter-row">${filters.map(([key,label,n])=>`<button class="${view.filter===key?'active':''}" onclick="view.filter='${key}';renderPeople()">${label} · ${n}</button>`).join('')}</div><div class="people-grid">${list.map(p=>`<button class="person-list-card" onclick="selectPerson('${p.id}')">${portraitMarkup(p,'list-avatar')}<strong>${esc(personName(p))}</strong><span>${esc(lifespan(p))} ${p.canvas_x==null?'· Unplaced':''}</span><small>${esc(p.birth_place||p.occupation||'No place recorded')}</small></button>`).join('')}</div>${!list.length?'<p>No people in this view.</p>':''}`;
}
function renderTimeline(){
  const events=[];
  people().forEach(p=>{[['Birth',p.birth_date,p.birth_place],['Death',p.death_date,p.death_place]].forEach(([type,date,place])=>{if(year(date))events.push({type,date,place,p});});});
  D.couples.forEach(c=>{if(year(c.start_date))events.push({type:c.rel_type==='married'?'Marriage':'Partnership',date:c.start_date,place:c.start_place,p:D.persons.get(c.person1_id),partner:D.persons.get(c.person2_id)});});
  events.sort((a,b)=>+year(a.date)- +year(b.date)||a.date.localeCompare(b.date));
  $('content-body').innerHTML=events.length?events.map(e=>`<div class="timeline-row"><time>${esc(year(e.date))}</time><div><strong>${esc(e.type)} · ${esc(e.p?personName(e.p):'Unknown')}${e.partner?' & '+esc(personName(e.partner)):''}</strong><p>${esc([e.date,e.place].filter(Boolean).join(' · '))}</p></div></div>`).join(''):'<p>Add dates to see family events here.</p>';
}
function renderResearch(){
  const all=people();const counts=[['People',all.length],['Missing birth dates',all.filter(p=>!p.birth_date).length],['Missing birthplaces',all.filter(p=>!p.birth_place).length],['Unplaced',all.filter(p=>p.canvas_x==null).length],['No recorded parents',all.filter(p=>![...D.parentChild.values()].some(pc=>pc.child_id===p.id)).length]];
  const incomplete=all.filter(p=>!p.birth_date||!p.birth_place);
  $('content-body').innerHTML=`<div class="summary-grid">${counts.map(([label,n])=>`<div class="summary-card"><b>${n}</b><p>${label}</p></div>`).join('')}</div><div class="ins-section" style="margin-top:28px"><h3>Next records to complete</h3>${incomplete.length?`<div class="people-grid">${incomplete.slice(0,16).map(p=>`<button class="person-list-card" onclick="selectPerson('${p.id}');openEditPerson('${p.id}')"><strong>${esc(personName(p))}</strong><small>${!p.birth_date?'Missing birth date':'Missing birth place'}</small></button>`).join('')}</div>`:'<p>All people have a recorded birth date and birthplace.</p>'}</div>`;
}
function updateSearch(){
  const term=$('person-search').value.trim().toLocaleLowerCase();
  const matches=term?people().filter(p=>[p.first_name,p.last_name,p.maiden_name,p.birth_place].some(v=>String(v||'').toLocaleLowerCase().includes(term))).slice(0,10):[];
  $('search-results').innerHTML=matches.map(p=>`<button class="result-row" role="option" onclick="selectPerson('${p.id}');$('person-search').value='';updateSearch()">${esc(personName(p))}<small>${esc(lifespan(p))}${p.birth_place?' · '+esc(p.birth_place):''}</small></button>`).join('')||'<div class="result-row">No matches</div>';
  $('search-results').classList.toggle('visible',!!term);
}
async function arrangeTree(){
  const all=people();if(!all.length)return;
  const generation=new Map(all.map(p=>[p.id,0]));
  // Longest parent chain; capped to avoid cycles from invalid imported data.
  for(let pass=0;pass<all.length;pass++){
    let changed=false;
    D.parentChild.forEach(pc=>{if(generation.has(pc.parent_id)&&generation.has(pc.child_id)){
      const next=Math.min(all.length,generation.get(pc.parent_id)+1);
      if(next>generation.get(pc.child_id)){generation.set(pc.child_id,next);changed=true;}
    }});
    if(!changed)break;
  }
  D.couples.forEach(c=>{if(generation.has(c.person1_id)&&generation.has(c.person2_id)){
    const g=Math.max(generation.get(c.person1_id),generation.get(c.person2_id));generation.set(c.person1_id,g);generation.set(c.person2_id,g);
  }});
  const rows=new Map();all.forEach(p=>{const g=generation.get(p.id);if(!rows.has(g))rows.set(g,[]);rows.get(g).push(p);});
  const positions=[];[...rows].sort((a,b)=>a[0]-b[0]).forEach(([g,row])=>{
    row.sort((a,b)=>{
      const parentX=id=>[...D.parentChild.values()].filter(pc=>pc.child_id===id).map(pc=>D.persons.get(pc.parent_id)?.canvas_x).find(x=>x!=null)??0;
      return parentX(a.id)-parentX(b.id)||personName(a).localeCompare(personName(b));
    });
    row.forEach((p,i)=>positions.push({p,x:160+i*250,y:150+g*235}));
  });
  try{
    clearInterval(UI.pollTimer);
    view.historyBatch=true;
    for(const {p,x,y} of positions){await api('persons','PUT',{canvas_x:x,canvas_y:y},p.id);p.canvas_x=x;p.canvas_y=y; if($('pc-'+p.id))refreshCard(p.id);else mountCard(p);}
    view.historyBatch=false;
    ensureCanvasBounds();draw();renderUnassigned();recordHistory();refreshWorkspace();fitTree();showToast('Tree arranged');
  }catch(e){await loadAll();showToast('Arrangement stopped: '+e.message);}finally{view.historyBatch=false;if(CFG.mode==='server')startPolling();}
}
function exportSVG(){
  const placed=[...D.persons.values()].filter(p=>p.canvas_x!=null);if(!placed.length)return showToast('No cards to export');
  const cards=placed.map(p=>({p,g:cardGeom(p.id)})).filter(({g})=>g);
  const minX=Math.max(0,Math.min(...cards.map(({g})=>g.x))-60),minY=Math.max(0,Math.min(...cards.map(({g})=>g.y))-60);
  const maxX=Math.max(...cards.map(({g})=>g.x+g.w+60)),maxY=Math.max(...cards.map(({g})=>g.y+g.h+60));
  const svg=svgN('svg',{xmlns:'http://www.w3.org/2000/svg',width:maxX-minX,height:maxY-minY,viewBox:`${minX} ${minY} ${maxX-minX} ${maxY-minY}`});
  svg.appendChild(svgN('rect',{x:minX,y:minY,width:maxX-minX,height:maxY-minY,fill:getComputedStyle($('cinner')).backgroundColor}));
  const lines=svgN('g');[...$('lsvg').children].forEach(child=>lines.appendChild(child.cloneNode(true)));svg.appendChild(lines);
  cards.forEach(({p,g})=>{
    const x=g.x,y=g.y;
    svg.appendChild(svgN('rect',{x,y,width:g.w,height:g.h,rx:13,fill:getComputedStyle($('pc-'+p.id)).backgroundColor,stroke:getComputedStyle($('pc-'+p.id)).borderColor}));
    svg.appendChild(svgN('circle',{cx:x+30,cy:y+34,r:18,fill:'#dcebe1'}));
    const initial=svgN('text',{x:x+30,y:y+40,'text-anchor':'middle','font-family':'serif','font-size':20,fill:'#426b5b'});initial.textContent=(p.first_name||p.last_name||'?')[0].toUpperCase();svg.appendChild(initial);
    const name=svgN('text',{x:x+58,y:y+30,'font-family':'sans-serif','font-size':13,'font-weight':600,fill:getComputedStyle($('pc-'+p.id)).color});name.textContent=personName(p).slice(0,23);svg.appendChild(name);
    const dates=svgN('text',{x:x+58,y:y+49,'font-family':'sans-serif','font-size':11,fill:getComputedStyle($('pc-'+p.id).querySelector('.pc-lifespan')).color});dates.textContent=lifespan(p);svg.appendChild(dates);
    const place=svgN('text',{x:x+13,y:y+Math.min(g.h-10,76),'font-family':'sans-serif','font-size':10,fill:getComputedStyle($('pc-'+p.id).querySelector('.pc-secondary')||$('pc-'+p.id)).color});place.textContent=String(p.birth_place||p.occupation||'').slice(0,32);svg.appendChild(place);
  });
  downloadFile('family-tree.svg',new XMLSerializer().serializeToString(svg),'image/svg+xml');showToast('SVG exported');
}
(function initWorkspace(){
  setTheme(localStorage.getItem('ft_theme')||'system');
  setCardDensity(localStorage.getItem('ft_density')||'standard');
  document.querySelectorAll('.rail-btn').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.view)));
  $('person-search').addEventListener('input',updateSearch);
  $('person-search').addEventListener('keydown',e=>{if(e.key==='Enter')$('search-results').querySelector('button')?.click();});
  const wrap=$('cwrap');updateStage();
  wrap.addEventListener('wheel',e=>{e.preventDefault();const r=wrap.getBoundingClientRect();setZoom(view.zoom*(e.deltaY<0?1.12:1/1.12),e.clientX-r.left,e.clientY-r.top);}, {passive:false});
  wrap.addEventListener('mousedown',e=>{if(e.button===0&&(e.target===wrap||e.target===$('stage')||e.target===$('cinner')))view.pan={x:e.clientX,y:e.clientY,left:wrap.scrollLeft,top:wrap.scrollTop};});
  window.addEventListener('mousemove',e=>{if(!view.pan)return;wrap.classList.add('panning');wrap.scrollLeft=view.pan.left+view.pan.x-e.clientX;wrap.scrollTop=view.pan.top+view.pan.y-e.clientY;});
  window.addEventListener('mouseup',()=>{view.pan=null;wrap.classList.remove('panning');});
  document.addEventListener('keydown',e=>{
    if(e.target.closest('input,textarea,select')||document.querySelector('.mov.on'))return;
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();historyStep(e.shiftKey?1:-1);}
    else if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='y'){e.preventDefault();historyStep(1);}
    else if(e.key.toLowerCase()==='f'){e.preventDefault();$('person-search').focus();}
    else if(e.key.toLowerCase()==='a'){openAddPerson();}
    else if(e.key.toLowerCase()==='e'&&view.selected){openEditPerson(view.selected);}
    else if(e.key==='0'){fitTree();}
    else if(e.key==='Escape'){if(view.section!=='tree')showView('tree');else selectPerson(null);}
  });
  const exportGroup=document.querySelector('.exp-row');
  const svgButton=document.createElement('button');svgButton.className='bexp ejson';svgButton.textContent='SVG';svgButton.onclick=exportSVG;exportGroup.appendChild(svgButton);
  const gedButton=document.createElement('button');gedButton.className='bexp ejson';gedButton.textContent='GEDCOM';gedButton.onclick=exportGEDCOM;document.querySelectorAll('.exp-row')[1].appendChild(gedButton);
  updateHistoryButtons();
  refreshWorkspace();
})();
