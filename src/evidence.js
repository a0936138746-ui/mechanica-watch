// Local ?gate=1 QA route. Records the same renderer and explorer used by the product.
export function createEvidenceRunner({canvas,sim,camera,controls,reset,command,preset,pauseLabel,snapshot,explorer,parts}){
 const panel=document.createElement('div');panel.id='gate-tools';panel.style.cssText='position:fixed;left:8px;bottom:8px;z-index:30;background:#152624;padding:8px;display:flex;gap:10px;font-size:10px';document.body.append(panel);
 function button(label,fn){const b=document.createElement('button');b.textContent=label;b.onclick=fn;panel.append(b);return b;}
 button('QA 日期',()=>preset('date'));button('QA 側面',()=>preset('side'));
 button('QA 半展開',()=>{command(1);sim.time=4.5;sim.stage='半展開 · EXPLODED 50%';sim.paused=true;pauseLabel();});
 const status=document.createElement('span');status.id='gate-status';status.textContent='QA READY';panel.append(status);
 const output=document.createElement('canvas');output.width=1440;output.height=900;const ctx=output.getContext('2d');let active=false,elapsed=0,steps=new Set(),samples=[],lastSample=0,recorder,chunks=[];
 const save=async(name,blob)=>{const r=await fetch('/__evidence/'+name,{method:'POST',body:blob});if(!r.ok)throw Error(r.status);};
 const rec=button('錄製 PART EXPLORER',()=>{if(active)return;reset();preset('angle',true);elapsed=0;steps.clear();samples=[];chunks=[];lastSample=0;const mime=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'].find(m=>MediaRecorder.isTypeSupported(m));recorder=new MediaRecorder(output.captureStream(30),{mimeType:mime,videoBitsPerSecond:5000000});recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};recorder.onstop=async()=>{try{await save('05_INTERACTION.webm',new Blob(chunks,{type:mime}));await save('browser-evidence.json',new Blob([JSON.stringify({duration:elapsed,sequence:['EXPLODE','SELECT GEAR','ROTATE GEAR','RETURN','SELECT BALANCE','ROTATE BALANCE','RETURN','ASSEMBLE'],samples},null,2)]));status.textContent='QA SAVED';}catch(e){status.textContent='QA FAILED '+e.message;}rec.disabled=false;};recorder.start(500);active=true;rec.disabled=true;});
 function step(id,t,fn){if(elapsed>=t&&!steps.has(id)){steps.add(id);fn();}}
 return {frame(dt,state){if(!active)return;elapsed+=dt;
  if((elapsed>14&&elapsed<18)||(elapsed>24&&elapsed<28)){const p=explorer.selected;if(p&&explorer.state==='PART_DETAIL'){p.rotateY(dt*1.4);p.rotateX(dt*.35);}}
  ctx.fillStyle='#0b1112';ctx.fillRect(0,0,1440,900);const scale=Math.min(1440/canvas.width,740/canvas.height);ctx.drawImage(canvas,(1440-canvas.width*scale)/2,70,canvas.width*scale,canvas.height*scale);
  ctx.fillStyle='#c4ad7b';ctx.font='24px Georgia';ctx.fillText('M E C H A N I C A',48,45);ctx.font='13px Arial';ctx.fillText('PHASE 1 · ROUND 2 · REAL-TIME WEBGL',990,45);ctx.fillStyle='#d1dbd4';ctx.fillText(state.animationState+' · '+elapsed.toFixed(1)+'s',48,847);
  const p=explorer.selected;if(p){const d=p.userData;ctx.font='24px Georgia';ctx.fillText(d.name_en,48,180);ctx.font='13px Arial';[d.part_id,d.category_en,d.material,d.function_en].forEach((v,i)=>ctx.fillText(v,48,220+i*28,390));ctx.fillText('INDEPENDENT ASSEMBLY ROTATION',48,360);}
  if(elapsed-lastSample>.20){lastSample=elapsed;samples.push({elapsed,...state});}
  step('explode',2,()=>command(1));step('gear',12,()=>explorer.enter(parts.find(p=>p.name==='GR-001')));step('return1',19,()=>explorer.leave());step('balance',22,()=>explorer.enter(parts.find(p=>p.name==='BW-001')));step('return2',29,()=>explorer.leave());step('assemble',32,()=>command(-1));step('stop',44,()=>{active=false;recorder.stop();recorder.stream.getTracks().forEach(t=>t.stop());status.textContent='QA SAVING';});
 }};
}
