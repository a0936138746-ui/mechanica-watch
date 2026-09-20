// Presentation only: no component transforms or camera ownership changes.
export function createPresentation({sim,explorer,parts}){
 const $=id=>document.getElementById(id),viewer=$('viewer');
 const help=document.createElement('aside');help.id='interaction-help';help.setAttribute('aria-label','3D 操作提示');
 help.innerHTML='<button aria-label="關閉操作提示">×</button><strong>這顆腕錶，由你操作。</strong><p class="input-help"></p><p>展開 EXPLODE：拆解機芯<br>展開後點選零件：名稱、功能與獨立 360° 檢視</p>';
 viewer.append(help);
 const hint=document.createElement('div');hint.id='explore-hint';hint.hidden=true;hint.setAttribute('role','status');viewer.append(hint);
 const helpButton=document.createElement('button');helpButton.id='show-help';helpButton.textContent='? 操作提示';helpButton.onclick=()=>showHelp();document.querySelector('.viewer-top').append(helpButton);
 let timer,hintTimer,lastMode='',tourPart=null;
 const coarse=matchMedia('(pointer: coarse)');
 function deviceText(){const touch=coarse.matches;help.querySelector('.input-help').textContent=touch?'單指拖曳：360° 旋轉 · 雙指捏合：縮放':'拖曳：360° 旋轉 · 滾輪：放大／縮小';document.querySelector('.gesture').textContent=touch?'單指旋轉 · 雙指縮放':'拖曳旋轉 · 滾輪縮放';const tip=document.querySelector('.detail-gesture');if(tip)tip.textContent=touch?'單指旋轉零件 · 雙指縮放':'拖曳旋轉零件 · 滾輪縮放';}
 function dismiss(){help.hidden=true;clearTimeout(timer);}
 function showHelp(){help.hidden=false;clearTimeout(timer);timer=setTimeout(dismiss,8500);}
 help.querySelector('button').onclick=dismiss;help.addEventListener('focusin',()=>clearTimeout(timer));
 $('scene').addEventListener('pointerdown',dismiss);coarse.addEventListener('change',deviceText);deviceText();showHelp();
 const labelToggle=$('part-labels');document.querySelector('.viewer-actions').append(labelToggle);
 const tourOriginals=new Map();
 function clearTour(){for(const [m,color] of tourOriginals)m.material.emissive.copy(color);tourOriginals.clear();if(tourPart)hint.hidden=true;tourPart=null;}
 return {update(){
  const mode=explorer.state||(sim.time===0?'ASSEMBLED':sim.time===9?'EXPLODED':sim.direction<0||sim.auto&&sim.autoTime>=23?'ASSEMBLING':'EXPLODING');
  const names={ASSEMBLED:'完整腕錶',EXPLODED:'爆炸模式',PART_SELECTED:'選取零件',PART_DETAIL:'零件檢視',PART_RETURNING:'返回爆炸圖',ASSEMBLING:'逐件合攏',EXPLODING:'逐層展開'};
  $('state').textContent=names[mode]+' · '+mode;
  $('explode').classList.toggle('primary',mode==='ASSEMBLED'||mode==='EXPLODING');$('assemble').classList.toggle('primary',mode==='EXPLODED'||mode==='ASSEMBLING');
  labelToggle.hidden=mode!=='EXPLODED'||sim.auto;
  if(mode!==lastMode){
   clearTimeout(hintTimer);hint.hidden=true;
   if(mode==='EXPLODED'&&!sim.auto&&lastMode!=='PART_RETURNING'){dismiss();hint.textContent='點選任一零件查看詳細資訊 · Tap any component to explore';hint.hidden=false;hintTimer=setTimeout(()=>hint.hidden=true,6500);}
   if(explorer.active)dismiss();lastMode=mode;
  }
  const id=sim.auto&&!sim.autoLead&&sim.time===9?['MB-001','GR-004','BW-001'][Math.min(2,Math.floor((sim.autoTime-13)/3.34))]:null;
  const next=id?parts.find(p=>p.name===id):null;
  if(next!==tourPart){clearTour();tourPart=next;if(next)next.traverse(m=>{if(m.isMesh){tourOriginals.set(m,m.material.emissive.clone());m.material.emissive.set(0x61451b);}});}
  if(tourPart){hint.hidden=false;hint.textContent='自動展示 · '+tourPart.userData.name_zh+' / '+tourPart.userData.name_en;}
 }};
}
