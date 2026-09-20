export const DURATION=9;
export const AUTO_DURATION=35;
export const ease=t=>{t=Math.max(0,Math.min(1,t));return t*t*t*(t*(t*6-15)+10);};
export const progressAt=(time,part)=>ease((time-part.animation_delay)/part.animation_duration);
export function componentPose(time,part,distance=1){
 const t=progressAt(time,part),axial=/^(SC|AX)-/.test(part.part_id),lateral=axial?ease((t-.3)/.7):t;
 const position=part.home_position.map((v,i)=>v+(part.exploded_position[i]-v)*(i===2?t:lateral)*distance);
 if(!axial)position[0]+=Math.sin(Math.PI*t)*.18*(part.assembly_order%2?1:-1);
 return {position,rotation:part.home_rotation.map((v,i)=>v+(part.exploded_rotation[i]-v)*t)};
}
export function autoPose(t){
 if(t<4)return {time:0,stage:'完整機芯 · ALIVE',view:'angle'};
 if(t<13)return {time:t-4,stage:'逐層展開 · EXPLODING',view:'angle'};
 if(t<20)return {time:DURATION,stage:'爆炸結構 · FROZEN STUDY',view:'angle'};
 if(t<23)return {time:DURATION,stage:'機械細節巡覽',view:'front'};
 if(t<32)return {time:32-t,stage:'逐件對位 · ASSEMBLING',view:'angle'};
 return {time:0,stage:'完整機芯 · ALIVE',view:'angle'};
}
export class Simulation{
 constructor(){this.reset();}
 reset(){this.time=0;this.direction=0;this.paused=false;this.auto=false;this.autoTime=0;this.autoLead=false;this.speed=1;this.stage='完整機芯 · ALIVE';this.view='angle';this.drive=1;this.mechanicalTime=0;}
 setExplosionProgress(progress){if(!Number.isFinite(progress))throw new TypeError("Progress must be finite");this.time=Math.max(0,Math.min(1,progress))*DURATION;this.direction=0;this.auto=false;this.autoLead=false;this.drive=this.time===0?1:0;this.stage=this.time===0?'完整機芯 · ALIVE':this.time===DURATION?'爆炸結構 · FROZEN STUDY':'逐件拆解 · PROGRESS STUDY';}
 command(direction){this.auto=false;this.autoLead=false;this.direction=direction;this.paused=false;}
 startAuto(){this.auto=true;this.autoTime=0;this.autoLead=this.time>0;this.direction=0;this.paused=false;this.view='angle';}
 tick(dt){
  if(this.paused)return;dt=Math.min(dt,.1);const step=dt*this.speed;
  if(this.auto){
   if(this.autoLead){this.time=Math.max(0,this.time-step);this.stage='自動展示準備 · 逐件合攏';if(this.time===0)this.autoLead=false;}
   else{this.autoTime=Math.min(AUTO_DURATION,this.autoTime+step);const pose=autoPose(this.autoTime);this.time=pose.time;this.stage=pose.stage;this.view=pose.view;if(this.autoTime===AUTO_DURATION)this.auto=false;}
  }else{
   this.time=Math.max(0,Math.min(DURATION,this.time+step*this.direction));if(this.time===0||this.time===DURATION)this.direction=0;
   this.stage=this.time===0?'完整機芯 · ALIVE':this.time===DURATION?'爆炸結構 · FROZEN STUDY':this.direction<0?'逐件對位 · ASSEMBLING':'逐層展開 · EXPLODING';
  }
  // Stop the visual escapement before the gear train lifts. Resume only at home.
  const target=this.time===0?1:0;this.drive+=(target-this.drive)*(1-Math.exp(-dt*3));if(this.drive<.0001)this.drive=0;
  this.mechanicalTime+=dt*this.drive;
 }
}
export function motionAngle(motion,time){
 if(motion.type==='hand')return motion.offset+time*motion.speed;
 if(motion.type==='balance')return Math.sin(time*Math.PI*2*motion.speed)*.48;
 if(motion.type==='pallet')return Math.sin(time*Math.PI*2*motion.speed)*.11;
 if(motion.type==='escape'){const t=time*3,step=Math.floor(t),f=t-step;return -(step+ease(Math.min(1,f*4)))*Math.PI/15;}
 return time*motion.speed;
}
