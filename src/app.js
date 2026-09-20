import * as T from 'three';
import {OrbitControls} from '../vendor/OrbitControls.js';
import {RoomEnvironment} from '../vendor/RoomEnvironment.js';
import {enrichMetadata} from './metadata.js';
import {createLabels} from './labels.js';
import {createExplorer} from './explorer.js';
import {fitBox} from './framing.js';
import {createMovement} from './model.js';
import {Simulation,componentPose,progressAt,motionAngle,DURATION,AUTO_DURATION,ease} from './simulation.js';
const $=id=>document.getElementById(id),canvas=$('scene');
let renderer,contextLost=false;
try{renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'});}catch(error){$('loading').textContent='無法啟用 WebGL 2，請使用支援 3D 的瀏覽器。';throw error;}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setClearColor(0x000000,0);renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.82;
const scene=new T.Scene(),camera=new T.PerspectiveCamera(34,1,.1,150);camera.up.set(0,1,0);
const controls=new OrbitControls(camera,canvas);controls.enableDamping=true;controls.dampingFactor=.09;controls.enablePan=false;controls.minDistance=.5;controls.maxDistance=100;controls.minPolarAngle=.015;controls.maxPolarAngle=Math.PI-.015;
const pmrem=new T.PMREMGenerator(renderer),room=new RoomEnvironment(),env=pmrem.fromScene(room,.035);scene.environment=env.texture;scene.environmentIntensity=.55;room.dispose();pmrem.dispose();
const fill=new T.HemisphereLight(0xd6e8ed,0x101820,.25);scene.add(fill);
const key=new T.DirectionalLight(0xffeed3,3);key.position.set(-4,6,8);scene.add(key);
const rim=new T.DirectionalLight(0x91bcc8,3);rim.position.set(6,-3,2);scene.add(rim);
const {root,parts,moving,metrics}=createMovement();enrichMetadata(parts);scene.add(root);const axes=new T.AxesHelper(4);axes.visible=false;scene.add(axes);
renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;key.castShadow=true;key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-5,right:5,top:5,bottom:-5,near:.5,far:24});key.shadow.bias=-.0005;key.shadow.normalBias=.025;
root.traverse(m=>{if(m.isMesh&&!m.material.transparent){m.receiveShadow=true;m.castShadow=/^(BR|BC|DS|BZ|MC|HH|HM|MB|MP)/.test(m.userData.part_id);}});
const sim=new Simulation();let distance=1,autoRotate=false,rotation=.6,selected=null,userOrbit=false,cameraTween=null,fitTween=null,lastAutoView='angle',lastDirection=0,expandedFrame=false;
let fitEnabled=true,fitRemaining=2.5,viewName='angle',cameraOwner='SYSTEM';const fitBounds=new T.Box3(),partBounds=parts.map(()=>new T.Box3());
const mobile=()=>innerWidth<=760;
function desiredRadius(expanded,name='angle'){
 const aspect=canvas.clientWidth/canvas.clientHeight;
 // Mobile uses a centered, dedicated stage, with horizontal fit as the limiting axis.
 const base=expanded?(mobile()?49:43):(mobile()?17.8:16.3);return base*(mobile()?Math.max(1,1/aspect*.85):1)*(name==='close'?.45:name==='date'?.29:name==='side'?1.15:1)*(expanded?1+(distance-1)*.55:1);
}
function resize(){const r=$('viewer').getBoundingClientRect();renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.clearViewOffset();camera.updateProjectionMatrix();camera.setViewOffset(r.width,r.height,mobile()?0:-r.width*.14,r.height*(mobile()?.095:.02),r.width,r.height);}
function frameFit(expanded,instant=false,name='angle'){
 cameraOwner='SYSTEM';fitRemaining=sim.direction||sim.auto?10:2.5;document.body.classList.toggle('exploded-view',expanded);const w=canvas.clientWidth,h=canvas.clientHeight;camera.setViewOffset(w,h,expanded?0:mobile()?0:-w*.14,h*(mobile()?.095:.02),w,h);
 if(expanded){expandedFrame=true;fitEnabled=true;fitTween=null;return;}
 expandedFrame=expanded;const target=!expanded&&name==='close'?new T.Vector3(-.69,-1.12,.2):!expanded&&name==='date'?new T.Vector3(2.45,0,1.75):new T.Vector3(0,0,expanded?1.2:.65),radius=desiredRadius(expanded,name);
 if(instant){const dir=camera.position.clone().sub(controls.target).normalize();controls.target.copy(target);camera.position.copy(target).addScaledVector(dir,radius);fitTween=null;}
 else fitTween={fromTarget:controls.target.clone(),target,fromRadius:camera.position.distanceTo(controls.target),radius,t:0};
}
function preset(name,instant=false){
 cameraOwner='SYSTEM';fitRemaining=2.5;viewName=name;fitEnabled=!['close','date'].includes(name);
 document.body.classList.toggle('focus-view',['close','date'].includes(name));
 if(explorer?.active){explorer.leave(()=>preset(name,instant));return;}
 const directions={front:[.015,-.01,1],angle:sim.time>0?[.32,-.35,1]:[.62,-.62,1],close:[.06,-.1,1],date:[.04,-.08,1],side:[.12,-1,.18]},dir=new T.Vector3(...directions[name]).normalize();
 document.querySelectorAll('[data-camera]').forEach(b=>b.classList.toggle('active',b.dataset.camera===name));
 if(instant){controls.target.set(0,0,sim.time>0?1.2:.65);camera.position.copy(controls.target).addScaledVector(dir,desiredRadius(sim.time>0,name));cameraTween=null;fitTween=null;controls.update();}
 else{cameraTween={from:camera.position.clone().sub(controls.target).normalize(),to:dir,t:0};frameFit(sim.time>0,false,name);}
}
let explorer=null;camera.position.set(6,-7,14);resize();preset('angle',true);
addEventListener('resize',()=>{resize();if(!explorer.active){fitEnabled=true;frameFit(sim.time>0);}});
function claimCamera(){cameraOwner='USER_CAMERA_OVERRIDE';fitEnabled=false;fitRemaining=0;cameraTween=null;fitTween=null;}
controls.addEventListener('start',()=>{claimCamera();userOrbit=true;document.querySelectorAll('[data-camera]').forEach(b=>b.classList.remove('active'));});controls.addEventListener('end',()=>userOrbit=false);
canvas.addEventListener('wheel',claimCamera,{passive:true});
canvas.addEventListener('pointerdown',claimCamera);
document.querySelectorAll('[data-camera]').forEach(b=>b.onclick=()=>preset(b.dataset.camera));
function pauseLabel(){$('pause').textContent=sim.paused?'▷ 繼續':'Ⅱ 暫停';$('pause').setAttribute('aria-pressed',String(sim.paused));}
function command(d){if(explorer?.active){explorer.leave(()=>command(d));return;}sim.command(d);fitEnabled=true;viewName='angle';document.body.classList.remove('focus-view');frameFit(d>0);if(d>0)cameraTween={from:camera.position.clone().sub(controls.target).normalize(),to:new T.Vector3(.32,-.35,1).normalize(),t:0};lastDirection=d;pauseLabel();}
$('explode').onclick=()=>command(1);$('assemble').onclick=()=>command(-1);
$('auto').onclick=()=>{if(explorer?.active){explorer.leave(()=>$('auto').onclick());return;}sim.startAuto();lastAutoView='angle';preset('angle');pauseLabel();};$('pause').onclick=()=>{sim.paused=!sim.paused;pauseLabel();};
const baseColors=new Map();root.traverse(m=>{if(m.isMesh)baseColors.set(m,m.material.color.clone());});
function select(part){selected=part;$('part-card').hidden=!part;if(part){$('part-name').textContent=part.userData.name;$('part-id').textContent='PART '+part.name;$('part-category').textContent=part.userData.category;}for(const p of parts)p.traverse(m=>{if(m.isMesh){m.material.emissive.set(p===part?0x342208:0);m.material.color.copy(baseColors.get(m));if(part&&p!==part)m.material.color.multiplyScalar(.48);}});}
$('close-part').onclick=()=>select(null);
function light(value){key.intensity=3*value;rim.intensity=3*value;scene.environmentIntensity=.55*value;}
function reset(){if(explorer?.active){explorer.leave(reset);return;}sim.reset();document.body.classList.remove('exploded-view');distance=1;rotation=.6;autoRotate=false;axes.visible=false;expandedFrame=false;lastDirection=0;for(const [id,v] of [['distance',1],['speed',1],['rotation',.6],['light',1]]){$(id).value=v;$(id+'-value').textContent=Number(v).toFixed(1)+'×';}$('rotate').checked=false;$('axes').checked=false;light(1);select(null);preset('angle');pauseLabel();}
$('reset').onclick=reset;
function showPanel(show){$('panel').hidden=!show;$('panel-toggle').setAttribute('aria-expanded',String(show));}
$('panel-toggle').onclick=()=>showPanel($('panel').hidden);$('panel-close').onclick=()=>showPanel(false);
for(const id of ['distance','speed','rotation','light'])$(id).oninput=e=>{const v=Number(e.target.value);$(id+'-value').textContent=v.toFixed(2)+'×';if(id==='distance'){distance=v;if(sim.time>0)frameFit(true);}if(id==='speed')sim.speed=v;if(id==='rotation')rotation=v;if(id==='light')light(v);};
$('rotate').onchange=e=>autoRotate=e.target.checked;$('axes').onchange=e=>axes.visible=e.target.checked;
$('export').onclick=()=>{const a=document.createElement('a'),url=URL.createObjectURL(new Blob([JSON.stringify(parts.map(p=>p.userData),null,2)],{type:'application/json'}));a.href=url;a.download='mechanica-parts.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
const ray=new T.Raycaster(),pointer=new T.Vector2();let down=null;
canvas.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY,id:e.pointerId};});
canvas.addEventListener('pointerup',e=>{if(!down||e.pointerId!==down.id||Math.hypot(e.clientX-down.x,e.clientY-down.y)>5){down=null;return;}down=null;const r=canvas.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,camera);if(explorer.active)return;let hit=ray.intersectObjects(root.children,true)[0]?.object;while(hit&&hit.parent!==root)hit=hit.parent;if(hit&&sim.time===DURATION&&!sim.auto)explorer.enter(hit);});canvas.addEventListener('pointercancel',()=>down=null);
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(explorer.active)explorer.leave();else select(null);showPanel(false);}if(e.target===canvas&&e.code==='Space'){e.preventDefault();sim.paused=!sim.paused;pauseLabel();}});
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();contextLost=true;$('loading').hidden=false;$('loading').textContent='3D 繪圖暫時中斷，正在等待瀏覽器恢復；若未恢復請重新整理。';});
canvas.addEventListener('webglcontextrestored',()=>{contextLost=false;last=performance.now();fitEnabled=true;});
explorer=createExplorer({getCameraMode:()=>cameraOwner,restoreCameraMode:mode=>{cameraOwner=mode;fitEnabled=false;fitRemaining=0;},parts,camera,controls,canvas,sim,onClear:()=>{select(null);cameraTween=null;fitTween=null;fitEnabled=false;}});
const scrub=document.createElement('label');scrub.className='explosion-scrub';scrub.innerHTML='Explosion Progress <output id=explosion-value>0%</output><input id=explosion-progress aria-label="Explosion Progress" type=range min=0 max=1 step=0.01 value=0>';document.querySelector('.controls').prepend(scrub);$('explosion-progress').oninput=e=>{if(explorer.active)return;sim.setExplosionProgress(Number(e.target.value));sim.paused=true;pauseLabel();frameFit(sim.time>0);};
const labels=createLabels({parts,camera,canvas,sim,explorer});
document.querySelector('.viewer-note').textContent=parts.length+' INDEPENDENT COMPONENTS · DRAG TO ROTATE · PINCH TO ZOOM';
let last=performance.now(),diagnosticAt=0,evidence=null;
function snapshot(){root.updateMatrixWorld(true);camera.updateMatrixWorld(true);const projected=parts.map(p=>{const b=new T.Box3().setFromObject(p),points=[];for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z])points.push(new T.Vector3(x,y,z).project(camera));return {id:p.name,minX:Math.min(...points.map(v=>v.x)),maxX:Math.max(...points.map(v=>v.x)),minY:Math.min(...points.map(v=>v.y)),maxY:Math.max(...points.map(v=>v.y)),visible:p.children[0].children.some(m=>m.visible&&m.material.opacity>0)};});return {...metrics,url:location.pathname+location.search,fitEnabled,projected,interactionState:explorer.state||(sim.time===0?'ASSEMBLED':sim.time===DURATION?'EXPLODED':sim.direction<0?'ASSEMBLING':'EXPLODING'),explorer:explorer.snapshot(),animationState:explorer.state||(sim.paused?'PAUSED':sim.time===0?'ALIVE':sim.time===DURATION?'FROZEN':sim.direction<0?'ASSEMBLING':'EXPLODING'),time:sim.time,auto:sim.auto,paused:sim.paused,mechanicalTime:sim.mechanicalTime,drive:sim.drive,camera:camera.position.toArray(),cameraState:{position:camera.position.toArray(),quaternion:camera.quaternion.toArray(),target:controls.target.toArray(),distance:camera.position.distanceTo(controls.target),zoom:camera.zoom,fov:camera.fov,mode:cameraOwner},drawCallsActual:renderer.info.render.calls,trianglesActual:renderer.info.render.triangles,parts:parts.map(p=>({id:p.name,position:p.position.toArray(),rotation:p.rotation.toArray().slice(0,3),home:p.userData.home_position,exploded:p.userData.exploded_position})),motion:moving.map(m=>({id:m.part.name,type:m.type,angle:m.node.rotation.z}))};}
function frame(now){
 if(contextLost){last=now;requestAnimationFrame(frame);return;}
 const dt=Math.min((now-last)/1000,.08);last=now;sim.tick(dt);
 if(sim.auto){const expanding=sim.time>0;if(expanding!==expandedFrame)frameFit(expanding);if(sim.view!==lastAutoView){lastAutoView=sim.view;if(!userOrbit&&cameraOwner!=='USER_CAMERA_OVERRIDE')preset(sim.view);}}
 for(const p of parts){if(p===explorer.selected)continue;const pose=componentPose(sim.time,p.userData,distance);p.position.fromArray(pose.position);p.rotation.fromArray(pose.rotation);}
 for(const m of moving)m.node.rotation.z=motionAngle(m,sim.mechanicalTime);
 if(!explorer.active){
  let dir=camera.position.clone().sub(controls.target).normalize(),radius=camera.position.distanceTo(controls.target);
  if(cameraTween){cameraTween.t+=dt;const t=ease(cameraTween.t/1.6);dir.lerpVectors(cameraTween.from,cameraTween.to,t).normalize();if(t>=1)cameraTween=null;}
  if(fitTween){fitTween.t+=dt;const t=ease(fitTween.t/2.1);radius=T.MathUtils.lerp(fitTween.fromRadius,fitTween.radius,t);controls.target.lerpVectors(fitTween.fromTarget,fitTween.target,t);if(t>=1)fitTween=null;}
  camera.position.copy(controls.target).addScaledVector(dir,radius);
 }
 explorer.frame(dt);

 controls.autoRotate=!explorer.active&&(autoRotate||sim.auto)&&cameraOwner!=='USER_CAMERA_OVERRIDE'&&!sim.paused&&!cameraTween&&!userOrbit;controls.autoRotateSpeed=rotation;controls.update(dt);
 if(!explorer.active&&fitEnabled&&cameraOwner==='SYSTEM'&&fitRemaining>0){fitRemaining-=dt;root.updateMatrixWorld(true);fitBounds.makeEmpty();parts.forEach((p,i)=>{partBounds[i].setFromObject(p);fitBounds.union(partBounds[i]);});const center=fitBounds.getCenter(new T.Vector3());controls.target.lerp(center,1-Math.exp(-dt*6));const dir=camera.position.clone().sub(controls.target).normalize();const needed=Math.max(...partBounds.map(b=>fitBox(b,camera,controls.target,dir,{horizontal:mobile()?.82:sim.time>0?.90:.64,vertical:mobile()?.67:.82})));const old=camera.position.distanceTo(controls.target),radius=Math.max(needed,T.MathUtils.lerp(old,needed,1-Math.exp(-dt*5)));camera.position.copy(controls.target).addScaledVector(dir,radius);camera.far=Math.max(150,radius+fitBounds.getSize(new T.Vector3()).length()*2);camera.updateProjectionMatrix();camera.lookAt(controls.target);}

 $('explosion-progress').disabled=explorer.active;$('explosion-progress').value=sim.time/DURATION;$('explosion-value').textContent=Math.round(sim.time/DURATION*100)+'%';labels.update();renderer.render(scene,camera);
 if($('pause').getAttribute('aria-pressed')!==String(sim.paused))pauseLabel();
 $('state').textContent=explorer.state|| (sim.paused?'已暫停 · ':'')+sim.stage;$('progress').style.width=(sim.time/DURATION*100)+'%';$('auto').classList.toggle('active',sim.auto);$('explode').classList.toggle('active',sim.time===DURATION);$('assemble').classList.toggle('active',sim.time===0);$('loading').hidden=true;
 $('motion-state').textContent=sim.paused?'PAUSED':sim.drive>.1?'● MOVEMENT ALIVE':'○ FROZEN STUDY';
 if(now-diagnosticAt>250){diagnosticAt=now;$('diagnostics').textContent=JSON.stringify(snapshot());}
 if(evidence)evidence.frame(dt,snapshot());
 requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
// Evidence runner is available only in the explicit local QA route, never the product UI.
if(new URLSearchParams(location.search).has('gate')){
 const {createEvidenceRunner}=await import('./evidence.js');
 evidence=createEvidenceRunner({canvas,sim,controls,camera,reset,command,preset,pauseLabel,snapshot,explorer,parts});
}
