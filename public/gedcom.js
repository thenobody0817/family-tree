'use strict';
// GEDCOM 5.5.1 core interchange. Unsupported tags are skipped on import.
const GED_MONTHS=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
function toGedDate(value){
  const p=String(value||'').split('/');
  if(p.length===1)return /^\d{4}$/.test(p[0])?p[0]:'';
  if(p.length===2){const m=+p[0];return m>=1&&m<=12?`${GED_MONTHS[m-1]} ${p[1]}`:'';}
  const m=+p[1];return m>=1&&m<=12?`${+p[0]} ${GED_MONTHS[m-1]} ${p[2]}`:'';
}
function fromGedDate(value){
  const s=String(value||'').trim().toUpperCase();
  if(/^\d{4}$/.test(s))return s;
  const parts=s.split(/\s+/),m=GED_MONTHS.indexOf(parts[parts.length-2]);
  if(parts.length===3&&m>=0&&/^\d{4}$/.test(parts[2]))return`${parts[0].padStart(2,'0')}/${String(m+1).padStart(2,'0')}/${parts[2]}`;
  const month=GED_MONTHS.indexOf(parts[0]);
  if(parts.length===2&&month>=0&&/^\d{4}$/.test(parts[1]))return`${String(month+1).padStart(2,'0')}/${parts[1]}`;
  return s;
}
function parseGEDCOM(raw){
  const records=[],lines=raw.replace(/^\uFEFF/,'').split(/\r?\n/);
  let record=null,block='',note=false;
  for(const line of lines){
    const m=line.match(/^(\d+)\s+(?:(@[^@]+@)\s+)?([A-Z0-9_]+)(?:\s+(.*))?$/i);
    if(!m)continue;
    const level=+m[1],xref=m[2],tag=m[3].toUpperCase(),value=m[4]||'';
    if(level===0){if(record)records.push(record);record={xref,tag,fields:{},events:{},children:[]};block='';note=false;continue;}
    if(!record)continue;
    if(level===1){block=tag;note=tag==='NOTE';
      if(['MARR','DIV','BIRT','DEAT'].includes(tag))record.events[tag]??={};
      if(tag==='CHIL')record.children.push(value);
      else if(['HUSB','WIFE','NAME','SEX','OCCU','NOTE','FAMC','FAMS'].includes(tag)){
        if(['FAMC','FAMS'].includes(tag)){(record.fields[tag]??=[]).push(value);}else record.fields[tag]=value;
      }
    }else if(level===2){
      if(['DATE','PLAC'].includes(tag)){(record.events[block]??={})[tag]=value;}
      else if(note&&tag==='CONT')record.fields.NOTE+='\n'+value;
      else if(note&&tag==='CONC')record.fields.NOTE+=value;
    }
  }
  if(record)records.push(record);
  const identifiers=new Map(),persons=[];
  for(const rec of records.filter(r=>r.tag==='INDI')){
    const name=rec.fields.NAME||'',match=name.match(/^(.*?)\s*\/([^/]*)\/(.*)$/);
    const first=match?(match[1]+match[3]).trim():name.trim(),last=match?match[2].trim():'';
    const p={id:uid(),first_name:first,last_name:last,gender:{M:'male',F:'female'}[rec.fields.SEX]||null,
      birth_date:fromGedDate(rec.events.BIRT?.DATE||''),birth_place:rec.events.BIRT?.PLAC||'',
      death_date:fromGedDate(rec.events.DEAT?.DATE||''),death_place:rec.events.DEAT?.PLAC||'',
      occupation:rec.fields.OCCU||'',notes:rec.fields.NOTE||'',canvas_x:null,canvas_y:null};
    persons.push(p);identifiers.set(rec.xref,p.id);
  }
  if(!persons.length)throw new Error('No GEDCOM people found');
  const couples=[],parent_child=[],seen=new Set();
  for(const rec of records.filter(r=>r.tag==='FAM')){
    const p1=identifiers.get(rec.fields.HUSB),p2=identifiers.get(rec.fields.WIFE);
    let couple=null;
    if(p1&&p2){couple={id:uid(),person1_id:p1,person2_id:p2,rel_type:rec.events.MARR?'married':'unmarried',
      start_date:fromGedDate(rec.events.MARR?.DATE||''),start_place:rec.events.MARR?.PLAC||'',
      status:rec.events.DIV?'divorced':'active',end_date:fromGedDate(rec.events.DIV?.DATE||''),end_place:rec.events.DIV?.PLAC||'',line_color:'#426b5b'};
      couples.push(couple);
    }
    for(const childRef of rec.children){
      const child=identifiers.get(childRef),parent=p1||p2;
      if(!parent||!child||child===parent||seen.has(parent+'|'+child))continue;
      seen.add(parent+'|'+child);
      parent_child.push({id:uid(),parent_id:parent,child_id:child,couple_id:couple?.id||null});
    }
  }
  return {format:'family-tree',version:1,persons,couples,parent_child};
}
async function exportGEDCOM(){
  try{
    const data=await api('all'),people=data.persons||[],couples=data.couples||[],links=data.parent_child||[];
    const personRef=new Map(people.map((p,i)=>[p.id,`@I${i+1}@`]));
    const out=['0 HEAD','1 SOUR FamilyTreeResearch','1 GEDC','2 VERS 5.5.1','2 FORM LINEAGE-LINKED','1 CHAR UTF-8'];
    const event=(tag,date,place)=>{if(!date&&!place)return;out.push('1 '+tag);if(date)out.push('2 DATE '+toGedDate(date));if(place)out.push('2 PLAC '+place.replace(/[\r\n]+/g,', '));};
    people.forEach(p=>{
      out.push(`0 ${personRef.get(p.id)} INDI`,`1 NAME ${(p.first_name||'').replace(/[\/\r\n]/g,' ')} /${(p.last_name||'').replace(/[\/\r\n]/g,' ')}/`);
      if(p.gender)out.push('1 SEX '+({male:'M',female:'F',other:'U'}[p.gender]||'U'));
      event('BIRT',p.birth_date,p.birth_place);event('DEAT',p.death_date,p.death_place);
      if(p.occupation)out.push('1 OCCU '+p.occupation.replace(/[\r\n]+/g,' '));
      if(p.notes){const notes=p.notes.split(/\r?\n/);out.push('1 NOTE '+notes[0]);notes.slice(1).forEach(n=>out.push('2 CONT '+n));}
    });
    const families=couples.map((c,i)=>({id:c.id,ref:`@F${i+1}@`,p1:c.person1_id,p2:c.person2_id,c,children:[]}));
    links.forEach(pc=>{
      let family=families.find(f=>f.id===pc.couple_id);
      if(!family){family=families.find(f=>!f.p2&&f.p1===pc.parent_id);
        if(!family){family={ref:`@F${families.length+1}@`,p1:pc.parent_id,p2:null,children:[]};families.push(family);}
      }
      if(!family.children.includes(pc.child_id))family.children.push(pc.child_id);
    });
    families.forEach(f=>{
      out.push(`0 ${f.ref} FAM`);
      if(personRef.has(f.p1))out.push('1 HUSB '+personRef.get(f.p1));
      if(personRef.has(f.p2))out.push('1 WIFE '+personRef.get(f.p2));
      f.children.forEach(id=>{if(personRef.has(id))out.push('1 CHIL '+personRef.get(id));});
      if(f.c?.rel_type==='married'){if(!f.c.start_date&&!f.c.start_place)out.push('1 MARR Y');else event('MARR',f.c.start_date,f.c.start_place);}
      if(f.c?.status==='divorced'){if(!f.c.end_date&&!f.c.end_place)out.push('1 DIV Y');else event('DIV',f.c.end_date,f.c.end_place);}
    });
    out.push('0 TRLR');downloadFile('family-tree.ged',out.join('\n')+'\n','text/plain;charset=utf-8');showToast('GEDCOM exported');
  }catch(e){showToast('GEDCOM export failed: '+e.message);}
}
