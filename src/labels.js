import * as T from 'three';
import {DURATION} from './simulation.js';

// A small, camera-dependent selection of semantic labels. All entry points
// pass the original assembly to the same explorer state machine.
export function createLabels({parts,camera,canvas,sim,explorer}){
 const toggle=document.createElement('button');toggle.id='part-labels';toggle.textContent='零件標示 PART LABELS';toggle.setAttribute('aria-pressed','false');document.querySelector('.controls').prepend(toggle);
 const overlay=document.createElement('div');overlay.className='part-labels';document.getElementById('viewer').append(overlay);
 let enabled=false;toggle.onclick=()=>{enabled=!enabled;toggle.setAttribute('aria-pressed',String(enabled));};
 const priority=['BW-001','MB-001','GR-002','GR-006','EF-001','BR-001','BR-002','HR-001','CG-001','CJ-001','GR-009','GR-010','AX-001','DW-001','SP-002','GR-004','GR-005','BR-003'];
 const nodes=priority.map(id=>{const part=parts.find(p=>p.name===id),button=document.createElement('button'),line=document.createElement('i');button.textContent=part.userData.name_en;button.title=id+' · '+part.userData.name_zh;button.onclick=()=>explorer.enter(part);overlay.append(line,button);return {part,button,line};});
 const box=new T.Box3(),v=new T.Vector3();
 return {update(){overlay.hidden=!enabled||sim.time!==DURATION||explorer.active||sim.auto;if(overlay.hidden)return;
  const w=canvas.clientWidth,h=canvas.clientHeight,occupied=[];let count=0;
  const candidates=nodes.map(n=>{box.setFromObject(n.part);box.getCenter(v);const distance=v.distanceTo(camera.position);v.project(camera);return {...n,x:(v.x+1)*w/2,y:(1-v.y)*h/2,z:v.z,distance};}).sort((a,b)=>a.distance-b.distance);
  for(const n of candidates){n.button.hidden=n.line.hidden=true;if(count>=10||n.z<0||n.z>1||n.x<10||n.x>w-10||n.y<15||n.y>h-25)continue;
   const width=Math.min(160,w*.38),height=25,side=n.x>w*.5?1:-1;let placed=null;
   for(const dy of [-32,2,-64,34,66]){const x=Math.max(8,Math.min(w-width-8,n.x+side*36-(side<0?width:0))),y=Math.max(8,Math.min(h-height-12,n.y+dy));if(!occupied.some(r=>x<r.x+r.w+6&&x+width+6>r.x&&y<r.y+r.h+5&&y+height+5>r.y)){placed={x,y,w:width,h:height};break;}}
   if(!placed)continue;occupied.push(placed);count++;const {x,y}=placed;n.button.hidden=n.line.hidden=false;Object.assign(n.button.style,{left:x+'px',top:y+'px',width:width+'px'});const endX=side<0?x+width:x,endY=y+height/2,dx=endX-n.x,dy=endY-n.y;Object.assign(n.line.style,{left:n.x+'px',top:n.y+'px',width:Math.hypot(dx,dy)+'px',transform:`rotate(${Math.atan2(dy,dx)}rad)`});
  }
 }};
}
