import * as T from 'three';
const TAU=Math.PI*2;
function finishMap(circular=false){
 const size=128,data=new Uint8Array(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){const d=circular?Math.hypot(x-64,y-64):y,v=165+Math.sin(d*5.7)*19+Math.sin(d*2.4)*10+Math.sin(x*13.7+y*9.1)*4,i=(y*size+x)*4;data[i]=data[i+1]=data[i+2]=v;data[i+3]=255;}
 const tex=new T.DataTexture(data,size,size);tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.magFilter=T.LinearFilter;tex.minFilter=T.LinearMipmapLinearFilter;tex.generateMipmaps=true;tex.needsUpdate=true;return tex;
}
export function createMovement(){
 const root=new T.Group(),parts=[],moving=[],linear=finishMap(),circular=finishMap(true);
 const materials={
 brushed:new T.MeshStandardMaterial({name:'Brushed steel',color:0x7e8c93,metalness:1,roughness:.55,roughnessMap:linear,bumpMap:linear,bumpScale:.012}),
 polished:new T.MeshStandardMaterial({name:'Polished steel',color:0xb4c1c5,metalness:1,roughness:.19}),
 gold:new T.MeshStandardMaterial({name:'Champagne gold',color:0xc4ad72,metalness:.96,roughness:.29}),
 brass:new T.MeshStandardMaterial({name:'Brass gear',color:0xa57a38,metalness:.94,roughness:.46,roughnessMap:circular,bumpMap:circular,bumpScale:.007}),
 dark:new T.MeshStandardMaterial({name:'Dark steel',color:0x263238,metalness:.93,roughness:.42}),
 blue:new T.MeshStandardMaterial({name:'Blued steel',color:0x1f4266,metalness:.92,roughness:.24}),
 ruby:new T.MeshPhysicalMaterial({name:'Ruby jewel',color:0x990b41,metalness:.15,roughness:.14,clearcoat:1,clearcoatRoughness:.08}),
 glass:new T.MeshPhysicalMaterial({name:'Crystal',color:0xb9d8e3,metalness:.1,roughness:.08,transparent:true,opacity:.24,depthWrite:false,clearcoat:1})};
 // One tiny atlas contains all calendar printing. Mesh/transform tests also run without a DOM.
 let calendarTexture;
 if(typeof document!=='undefined'){
  const c=document.createElement('canvas');c.width=1024;c.height=32;const ctx=c.getContext('2d');ctx.fillStyle='#e1dcc7';ctx.fillRect(0,0,1024,32);ctx.fillStyle='#142329';ctx.font='bold 26px Georgia';ctx.textAlign='center';ctx.textBaseline='middle';
  for(let i=0;i<31;i++)ctx.fillText(String(i+1),(i+.5)*1024/31,17);calendarTexture=new T.CanvasTexture(c);calendarTexture.colorSpace=T.SRGBColorSpace;
 }else{calendarTexture=new T.DataTexture(new Uint8Array([225,220,199,255]),1,1);calendarTexture.needsUpdate=true;}
 materials.calendar=new T.MeshStandardMaterial({name:'Calendar enamel',color:0xffffff,map:calendarTexture,metalness:.05,roughness:.65});
 materials.lume=new T.MeshStandardMaterial({name:'Ivory lume',color:0xd9e1c8,metalness:.08,roughness:.38,emissive:0x18201c,emissiveIntensity:.2});
 materials.glass.opacity=.055;materials.glass.roughness=.075;materials.glass.metalness=0;
 materials.crystalEdge=new T.MeshPhysicalMaterial({name:'Sapphire edge',color:0x93bec9,metalness:.15,roughness:.09,transparent:true,opacity:.36,depthWrite:false,clearcoat:1});
 let primitiveCount=0,gearCount=0;
 const disk=(r,h,n=32)=>{const geo=new T.CylinderGeometry(r,r,h,n);geo.rotateX(Math.PI/2);return geo;};
 const torus=(r,t,n=48)=>new T.TorusGeometry(r,t,5,n);
 function mesh(g,geo,mat,x=0,y=0,z=0,a=0){const m=new T.Mesh(geo,materials[mat]);m.position.set(x,y,z);m.rotation.z=a;g.add(m);primitiveCount++;return m;}
 function shapeGeo(s,d=.12,bevel=.014){return new T.ExtrudeGeometry(s,{depth:d,steps:1,bevelEnabled:true,bevelSegments:1,bevelSize:bevel,bevelThickness:bevel,curveSegments:20});}
 function circle(r){const s=new T.Shape();s.absarc(0,0,r,0,TAU,false);return s;}
 function hole(s,x,y,r){const p=new T.Path();p.absarc(x,y,r,0,TAU,true);s.holes.push(p);}
 function annulus(r,inner,h=.08){const s=circle(r);hole(s,0,0,inner);return shapeGeo(s,h,.008);}
 function bar(g,a,b,width,z,mat='brushed',h=.11){const dx=b[0]-a[0],dy=b[1]-a[1];mesh(g,new T.BoxGeometry(Math.hypot(dx,dy),width,h),mat,(a[0]+b[0])/2,(a[1]+b[1])/2,z,Math.atan2(dy,dx));}
 function bearing(g,x,y,z,r=.11){mesh(g,disk(r*1.55,.06,20),'gold',x,y,z);mesh(g,disk(r,.068,20),'ruby',x,y,z+.03);mesh(g,torus(r*.6,.018,20),'polished',x,y,z+.075);mesh(g,disk(.028,.08,12),'dark',x,y,z+.08);}
 function screw(g,x,y,z,r=.092,angle=.5){mesh(g,disk(r,.065,16),'blue',x,y,z);mesh(g,new T.BoxGeometry(r*1.52,.025,.009),'dark',x,y,z+.037,angle);mesh(g,torus(r*.92,.009,16),'polished',x,y,z+.03);}
 function pin(g,x,y,z,h=.36,r=.046){const start=g.children.length;mesh(g,disk(r,h,16),'polished',x,y,z);mesh(g,disk(r*1.8,.055,20),'gold',x,y,z-h*.3);g.children.slice(start).forEach(m=>m.userData.kind='shaft');}
 function add(id,name,category,pos,exploded,delay,build,motion=null){
  const p=new T.Group(),body=new T.Group();p.name=id;body.name=id+'-body';p.add(body);const start=primitiveCount;build(body);p.position.fromArray(pos);
  p.userData={part_id:id,name,category,home_position:pos,home_rotation:[0,0,0],home_scale:[1,1,1],exploded_position:exploded,exploded_rotation:[parts.length%2?.045:-.035,.035,parts.length%2?.08:-.07],assembly_order:Math.round((6.5-delay)*10),animation_delay:delay,animation_duration:2.35,interactive:true,highlightable:true,visual_primitives:primitiveCount-start,source:'procedural',motion:motion?.type||null};
  if(motion)moving.push({node:body,part:p,...motion});root.add(p);parts.push(p);return p;
 }
 add('MP-001','Skeleton mainplate','Foundation',[0,0,-.24],[0,0,-3.9],6.05,g=>{
  mesh(g,annulus(3.04,2.62,.18),'dark');mesh(g,torus(2.96,.026,80),'polished',0,0,.2);
  const s=circle(2.68);for(const [x,y,r] of [[-1.38,1.06,.76],[.04,.77,.59],[1.45,1.3,.62],[-1.67,-.55,.54],[.68,-.53,.64],[-.64,-1.68,.73],[1.83,-1.23,.48]])hole(s,x,y,r);mesh(g,shapeGeo(s,.13,.012),'dark');
  for(let i=0;i<16;i++){const a=i*TAU/16;screw(g,2.8*Math.cos(a),2.8*Math.sin(a),.22,.066,a);}
  for(let i=0;i<12;i++){const a=i*2.4;mesh(g,torus(.14,.01,24),'polished',Math.cos(a)*2.45,Math.sin(a)*2.45,.16);}
 });
 add('CR-001','Double movement surround','Perimeter chassis',[0,0,-.12],[0,0,-2.6],5.65,g=>{
  mesh(g,annulus(3.24,3.07,.24),'brushed');mesh(g,torus(3.23,.038,96),'polished',0,0,.25);mesh(g,torus(3.08,.025,96),'gold',0,0,.25);
  for(let i=0;i<72;i++){const a=i*TAU/72;mesh(g,new T.BoxGeometry(i%6===0?.12:.048,.023,.025),'gold',3.155*Math.cos(a),3.155*Math.sin(a),.265,a);}
  for(let i=0;i<8;i++){const a=i*TAU/8;mesh(g,new T.BoxGeometry(.14,.22,.21),'dark',3.23*Math.cos(a),3.23*Math.sin(a),.05,a);}
 });
 add('SF-001','Lower wheel carrier','Lower structural layer',[0,0,.05],[.4,.45,-1.25],5.3,g=>{
  for(const [a,b] of [[[-2.35,.8],[1.9,1.7]],[[1.9,1.7],[2,-1.8]],[[2,-1.8],[-2,-1.5]],[[-2,-1.5],[-2.35,.8]]])bar(g,a,b,.16,0,'dark');
  for(const [x,y] of [[-2.2,.9],[1.9,1.65],[1.94,-1.7],[-1.92,-1.44],[-.1,.6]]){pin(g,x,y,.20,.5,.075);bearing(g,x,y,.47,.08);}
 });
 function gear(g,r,teeth,mat='brass',spokes=5){
  const start=g.children.length;gearCount++;
  const s=new T.Shape();for(let i=0;i<teeth*4;i++){const a=i*TAU/(teeth*4),rad=(i%4===1||i%4===2)?r:r-.058,x=Math.cos(a)*rad,y=Math.sin(a)*rad;i?s.lineTo(x,y):s.moveTo(x,y);}s.closePath();hole(s,0,0,r*.72);mesh(g,shapeGeo(s,.065,.007),mat);mesh(g,disk(r*.18,.1,24),mat,0,0,.04);
  for(let i=0;i<spokes;i++){const a=i*TAU/spokes;bar(g,[.05*Math.cos(a),.05*Math.sin(a)],[r*.77*Math.cos(a),r*.77*Math.sin(a)],.055,.04,mat,.055);}
  mesh(g,torus(r*.81,.012,48),'gold',0,0,.083);pin(g,0,0,.10,.43,.05);mesh(g,disk(r*.17,.14,16),'polished',0,0,.18);g.children.slice(start).forEach(m=>m.userData.wheel=gearCount);
  for(let i=0;i<10;i++){const a=i*TAU/10;mesh(g,new T.BoxGeometry(.035,.032,.12),'polished',r*.17*Math.cos(a),r*.17*Math.sin(a),.18,a);}bearing(g,0,0,.30,.055);
 }
 const gears=[[-1.32,1,.84,48,.34,.11],[.09,.64,.65,36,.50,-.15],[1.17,1.54,.67,38,.40,.10],[-1.65,-.43,.62,34,.53,-.17],[-.47,-.51,.58,32,.68,.20],[.62,-.72,.54,30,.55,-.22],[1.56,.25,.48,28,.74,.24],[.18,1.86,.29,20,.88,-.30]];
 gears.forEach(([x,y,r,teeth,z,speed],i)=>add(`GR-00${i+1}`,['Centre wheel','Third wheel','Ratchet wheel','Intermediate wheel','Fourth wheel','Escape wheel','Winding wheel','Reduction pinion'][i],i===5?'Escapement':'Gear train',[x,y,z],[x*1.65,y*1.45,2.9+(i%4)*.82],2.15+i*.18,g=>gear(g,r,teeth,i===2?'polished':'brass',i%2?5:6),{type:i===5?'escape':'gear',speed}));
 add('MB-001','Open mainspring barrel','Energy assembly',[1.65,-1.38,.36],[3.7,-2.2,-.1],4.65,g=>{
  mesh(g,annulus(.76,.60,.25),'brass');mesh(g,torus(.70,.033),'gold',0,0,.29);
  const pts=[];for(let i=0;i<210;i++){const a=i/209*TAU*6,r=.10+i/209*.47;pts.push(new T.Vector3(Math.cos(a)*r,Math.sin(a)*r,.19));}mesh(g,new T.TubeGeometry(new T.CatmullRomCurve3(pts),220,.015,4,false),'brushed');
  for(let i=0;i<32;i++){const a=i*TAU/32;mesh(g,new T.BoxGeometry(.07,.042,.24),'brass',.76*Math.cos(a),.76*Math.sin(a),.125,a);}pin(g,0,0,.24,.5,.07);bearing(g,0,0,.49,.075);bar(g,[-.65,0],[.65,0],.09,.36,'polished',.06);
 });
 add('BW-001','Free sprung balance','Oscillating assembly',[-.69,-1.76,.76],[-2.8,-2.55,.65],4.10,g=>{
  mesh(g,annulus(.84,.74,.058),'gold');mesh(g,torus(.80,.023,64),'polished',0,0,.08);
  for(let i=0;i<3;i++){const a=i*TAU/3;bar(g,[.05*Math.cos(a),.05*Math.sin(a)],[.78*Math.cos(a),.78*Math.sin(a)],.065,.028,'gold',.06);}
  const pts=[];for(let i=0;i<200;i++){const a=i/199*TAU*5.5,r=.1+i/199*.5;pts.push(new T.Vector3(Math.cos(a)*r,Math.sin(a)*r,.10+i/199*.16));}mesh(g,new T.TubeGeometry(new T.CatmullRomCurve3(pts),200,.014,5,false),'blue');
  for(let i=0;i<12;i++){const a=i*TAU/12;screw(g,.795*Math.cos(a),.795*Math.sin(a),.09,.043,a);}pin(g,0,0,.12,.38,.065);bearing(g,0,0,.31,.078);
 },{type:'balance',speed:1.25});
 add('EF-001','Pallet fork and impulse lever','Escapement',[.1,-1.23,.87],[.2,-2.4,5.5],1.75,g=>{
  bar(g,[-.48,-.12],[.36,.21],.072,0,'polished',.09);bar(g,[.26,.16],[.5,.48],.055,0,'polished');bar(g,[.26,.16],[.60,-.04],.055,0,'polished');mesh(g,new T.BoxGeometry(.08,.13,.09),'ruby',.5,.44,.02);mesh(g,new T.BoxGeometry(.08,.13,.09),'ruby',.57,-.04,.02);bearing(g,0,0,.12,.07);
 },{type:'pallet',speed:1.25});
 add('WR-001','Winding works','Setting mechanism',[-2.19,-.96,.74],[-3.25,-1.2,4.6],1.95,g=>{gear(g,.29,18,'polished',4);bar(g,[0,.05],[.17,-.70],.14,.08,'brushed');bar(g,[.1,-.48],[.55,-.78],.08,.13,'polished');screw(g,.16,-.55,.2,.07);});
 function bridge(g,points,width=.18){
  for(let i=0;i<points.length-1;i++){const a=points[i],b=points[i+1],dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy),ang=Math.atan2(dy,dx),s=new T.Shape();s.moveTo(-l/2,-width/2);s.lineTo(l/2,-width/2);s.quadraticCurveTo(l/2+.12,0,l/2,width/2);s.lineTo(-l/2,width/2);s.quadraticCurveTo(-l/2-.12,0,-l/2,-width/2);mesh(g,shapeGeo(s,.12,.018),'brushed',(a[0]+b[0])/2,(a[1]+b[1])/2,0,ang);bar(g,[a[0]-Math.sin(ang)*width*.42,a[1]+Math.cos(ang)*width*.42],[b[0]-Math.sin(ang)*width*.42,b[1]+Math.cos(ang)*width*.42],.018,.135,'polished',.014);}
  for(const [x,y] of points){mesh(g,annulus(.21,.107,.13),'brushed',x,y);bearing(g,x,y,.145,.095);}
 }
 add('BR-001','Pierced train bridge','Upper bridge',[-.1,.25,1.12],[-1.2,1.3,6.7],.9,g=>{bridge(g,[[-2.28,1.12],[-1.22,.75],[.19,.39],[1.68,.70]],.19);bar(g,[-2.28,1.12],[-1.7,1.7],.17,.05);screw(g,-1.7,1.7,.18,.095);for(let i=0;i<7;i++)mesh(g,new T.BoxGeometry(.008,.11,.004),'dark',-1+i*.08,.72-i*.021,.145,-.26);});
 add('BR-002','Barrel arc bridge','Upper bridge',[1.62,-1.38,1.03],[2.6,-1.7,7.3],1.1,g=>{const s=new T.Shape();s.absarc(0,0,.79,-.5,2.65,false);s.absarc(0,0,.55,2.65,-.5,true);s.closePath();mesh(g,shapeGeo(s,.13,.018),'brushed');mesh(g,new T.TorusGeometry(.76,.014,4,40,3.15),'polished',0,0,.15,-.5);bar(g,[-.62,.37],[0,0],.15,.01);bearing(g,0,0,.16,.11);screw(g,.63,-.25,.19,.095);});
 add('BR-003','Upper ratchet carrier','Upper bridge',[.9,1.8,1.04],[1.45,2.5,7.9],1.3,g=>{bridge(g,[[-.72,.04],[.27,-.26],[1.01,-.10]],.18);bar(g,[.27,-.26],[.2,.62],.15,.025);screw(g,.2,.62,.19,.09);});
 add('BC-001','Balance cock and regulator','Regulator',[-.69,-1.76,1.27],[-2.1,-2,6.1],1.5,g=>{bridge(g,[[-.97,.3],[-.42,.42],[0,0]],.12);bearing(g,0,0,.17,.12);mesh(g,disk(.083,.018,24),'glass',0,0,.275);bar(g,[.02,.02],[.33,.4],.045,.23,'polished',.04);screw(g,-.91,.28,.18,.08);mesh(g,new T.TorusGeometry(.42,.014,4,30,2.3),'polished',0,0,.21,.15);});
 [[-2.39,1.38,1.35],[1.12,2.42,1.29],[2.25,-1.63,1.29],[-1.61,-1.48,1.53],[-1.82,1.96,1.4],[2,.93,1.4]].forEach(([x,y,z],i)=>add(`SC-00${i+1}`,'Bridge fixing screw '+(i+1),'Fastener',[x,y,z],[x*1.6,y*1.45,8.6+i*.28],i*.075,g=>{mesh(g,disk(.048,.34,16),'polished',0,0,-.13);screw(g,0,0,.055,.12,i*.4);for(let j=0;j<4;j++)mesh(g,torus(.05,.007,16),'dark',0,0,-.06-j*.05);}));
 add('CW-001','Knurled crown with signed end cap','Winding assembly',[3.66,0,.32],[4.15,0,-9.55],0,g=>{
  const axial=(r,h,x,mat)=>{const geo=disk(r,h,48);geo.rotateY(Math.PI/2);geo.scale(1,1,1/.44);mesh(g,geo,mat,x);};
  axial(.18,.38,.15,'polished');axial(.39,.46,.52,'brushed');axial(.35,.09,.78,'polished');axial(.27,.012,.835,'blue');
  for(let i=0;i<40;i++){const a=i*TAU/40;const geo=new T.BoxGeometry(.37,.035,.035);geo.rotateX(a);geo.scale(1,1,1/.44);mesh(g,geo,'polished',.51,.39*Math.cos(a),.39*Math.sin(a)/.44);}
 });
 // ROUND 2: the original movement becomes the middle of a complete watch stack.
 // These are real model-space layers, not a camera illusion or explosion-only spacing.
 const layers=[
  {id:1,name:'Front crystal / bezel',z:2.69,explodedZ:14.0},
  {id:2,name:'Hands / central stack',z:2.21,explodedZ:11.0},
  {id:3,name:'Dial structure / hour indices',z:1.95,explodedZ:8.7},
  {id:4,name:'Calendar mechanism',z:1.61,explodedZ:6.4},
  {id:5,name:'Upper bridges',z:1.04,explodedZ:4.2},
  {id:6,name:'Upper gear train',z:.69,explodedZ:1.8},
  {id:7,name:'Main gear train',z:.22,explodedZ:-.5},
  {id:8,name:'Balance / escapement',z:-.06,explodedZ:-2.9},
  {id:9,name:'Main plate',z:-.48,explodedZ:-5.1},
  {id:10,name:'Lower mechanics',z:-.86,explodedZ:-7.2},
  {id:11,name:'Caseback / rear crystal',z:-1.2,explodedZ:-12.0},
 ];
 function at(g,x,y,z,build,scale=1){const start=g.children.length;build(g);for(const m of g.children.slice(start)){m.geometry.scale(scale,scale,scale);m.position.multiplyScalar(scale).add(new T.Vector3(x,y,z));}}
 function arcShape(outer,inner,a,b){const s=new T.Shape();s.absarc(0,0,outer,a,b,false);s.absarc(0,0,inner,b,a,true);s.closePath();return s;}
 function rounded(w,h,r=.06){const s=new T.Shape(),x=-w/2,y=-h/2;s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s;}
 add('MC-001','Sculpted steel case and swept lugs','Case wall / lugs',[0,0,.35],[0,0,-9.6],0,g=>{
  const profile=[[3.28,-1.50],[3.47,-1.42],[3.66,-1.12],[3.75,-.65],[3.78,.05],[3.74,.65],[3.60,1.40],[3.45,1.78],[3.29,1.78],[3.28,-1.50]];
  const geo=new T.LatheGeometry(profile.map(p=>new T.Vector2(...p)),96);geo.rotateX(Math.PI/2);mesh(g,geo,'brushed');
  for(const [r,z] of [[3.47,-1.40],[3.76,-.56],[3.61,1.38]])mesh(g,torus(r,.035,96),'polished',0,0,z);
  mesh(g,annulus(3.48,3.27,.12),'polished',0,0,1.67);
  for(const sx of [-1,1])for(const sy of [-1,1]){
   const shape=new T.Shape();shape.moveTo(1.65,2.64);shape.bezierCurveTo(1.77,3.1,1.89,3.94,1.87,4.57);shape.lineTo(2.36,4.57);shape.bezierCurveTo(2.73,3.95,2.93,3.2,2.69,2.56);shape.closePath();
   const lug=shapeGeo(shape,1.02,.11),a=lug.attributes.position;for(let i=0;i<a.count;i++){const y=a.getY(i);a.setXYZ(i,a.getX(i)*sx,y*sy,a.getZ(i)-Math.max(0,y-2.5)*.52-.18);}lug.computeVertexNormals();mesh(g,lug,'brushed');
   bar(g,[sx*2.54,sy*2.86],[sx*2.26,sy*4.35],.07,-.01,'polished',.11);
   const bore=disk(.065,.42,16);bore.rotateY(Math.PI/2);bore.scale(1,1,1/.44);mesh(g,bore,'dark',sx*2.20,sy*4.30,-.44);
  }
  const tube=annulus(.23,.10,.42);tube.rotateY(Math.PI/2);tube.scale(1,1,1/.44);mesh(g,tube,'polished',3.62,0,.05);
 });
 add('BZ-001','Recessed sapphire-seat bezel','Front bezel',[0,0,2.37],[0,0,13.2],0,g=>{
  const profile=[[3.18,-.15],[3.70,-.15],[3.77,-.02],[3.72,.15],[3.57,.30],[3.28,.30],[3.20,.20],[3.18,.04],[3.18,-.15]];
  const geo=new T.LatheGeometry(profile.map(p=>new T.Vector2(...p)),96);geo.rotateX(Math.PI/2);mesh(g,geo,'polished');
  mesh(g,annulus(3.59,3.34,.012),'dark',0,0,.31);mesh(g,torus(3.23,.021,96),'polished',0,0,.20);
  for(let i=0;i<60;i++){const a=i*TAU/60;mesh(g,new T.BoxGeometry(i%5===0?.12:.05,.021,.016),'gold',3.47*Math.cos(a),3.47*Math.sin(a),.33,a);}
 });
 add('FC-001','Low domed sapphire','Front crystal',[0,0,2.70],[0,0,14.65],0,g=>{
  const points=[];for(let i=0;i<=24;i++){const r=i/24*3.205;points.push(new T.Vector2(r,.30*(1-(r/3.205)**2)));}for(let i=24;i>=0;i--){const r=i/24*3.205;points.push(new T.Vector2(r,.30*(1-(r/3.205)**2)-.035));}
  const geo=new T.LatheGeometry(points,96);geo.rotateX(Math.PI/2);mesh(g,geo,'glass');mesh(g,torus(3.205,.012,96),'crystalEdge');
 });
 add('DS-001','Open dial and applied indices','Dial structure',[0,0,1.95],[0,0,8.7],0,g=>{
  mesh(g,shapeGeo(arcShape(2.75,2.14,.16,TAU-.16),.065,.012),'dark',0,0,-.08);
  mesh(g,annulus(3.17,2.83,.14),'dark');mesh(g,torus(2.83,.026,96),'polished',0,0,.14);mesh(g,torus(3.16,.020,96),'gold',0,0,.15);
  for(let i=0;i<12;i++){const a=i*TAU/12,x=2.96*Math.sin(a),y=2.96*Math.cos(a);mesh(g,shapeGeo(rounded(i===0?.16:.105,.31,.015),.075,.01),'polished',x,y,.16,-a);mesh(g,new T.BoxGeometry(.047,.20,.014),'lume',x,y,.25,-a);}
  for(let i=0;i<60;i++){const a=i*TAU/60;mesh(g,new T.BoxGeometry(.018,i%5===0?.11:.055,.014),'gold',3.07*Math.sin(a),3.07*Math.cos(a),.17,-a);}
  for(let i=0;i<3;i++){const a=i*TAU/3+.4;bar(g,[2.80*Math.cos(a),2.80*Math.sin(a)],[2.49*Math.cos(a),2.49*Math.sin(a)],.07,.03,'dark',.15);}
 });
 function hand(g,length,width){
  const s=new T.Shape();s.moveTo(-width*.6,-.30);s.lineTo(-width,.28);s.lineTo(-width*.44,length-.24);s.lineTo(0,length);s.lineTo(width*.44,length-.24);s.lineTo(width,.28);s.lineTo(width*.6,-.30);s.closePath();mesh(g,shapeGeo(s,.045,.009),'polished');
  const inlay=new T.Shape();inlay.moveTo(-width*.55,.25);inlay.lineTo(-width*.21,length-.28);inlay.lineTo(0,length-.12);inlay.lineTo(width*.21,length-.28);inlay.lineTo(width*.55,.25);inlay.closePath();mesh(g,shapeGeo(inlay,.015,.002),'blue',0,0,.055);
  bar(g,[0,.45],[0,length-.4],width*.25,.08,'lume',.008);
 }
 add('HH-001','Sculpted hour hand','Hands',[0,0,2.13],[0,0,10.65],0,g=>hand(g,1.65,.205),{type:'hand',speed:-.0001454,offset:Math.PI/3});
 add('HM-001','Sculpted minute hand','Hands',[0,0,2.25],[0,0,11.15],0,g=>hand(g,2.38,.13),{type:'hand',speed:-.0017453,offset:-Math.PI/3});
 add('HS-001','Sweeping seconds hand','Hands',[0,0,2.37],[0,0,11.7],0,g=>{bar(g,[0,-.60],[0,2.65],.048,0,'blue',.028);mesh(g,annulus(.13,.085,.023),'polished',0,-.45,.01);mesh(g,new T.BoxGeometry(.034,.29,.025),'blue',0,2.43,.015);},{type:'hand',speed:-Math.PI/30,offset:Math.PI});
 add('HC-001','Central pinion and hand cap','Hand stack',[0,0,2.43],[0,0,12.15],0,g=>{pin(g,0,0,-.27,.70,.08);mesh(g,disk(.18,.075,40),'polished');mesh(g,disk(.108,.09,32),'blue',0,0,.035);mesh(g,torus(.16,.015,40),'gold',0,0,.042);});
 add('DW-001','31-position printed date wheel','Calendar',[0,0,1.60],[0,0,6.40],0,g=>{
  mesh(g,annulus(2.69,2.21,.075),'dark');mesh(g,torus(2.68,.021,80),'gold',0,0,.08);
  for(let i=0;i<31;i++){const a=(i-27)*TAU/31,geo=new T.PlaneGeometry(.45,.26),uv=geo.getAttribute('uv');for(let n=0;n<uv.count;n++)uv.setX(n,(i+uv.getX(n))/31);mesh(g,geo,'calendar',2.45*Math.cos(a),2.45*Math.sin(a),.086,a);}
  for(let i=0;i<62;i++){const a=i*TAU/62;mesh(g,new T.BoxGeometry(.042,.032,.04),'brass',2.20*Math.cos(a),2.20*Math.sin(a),.03,a);}
 });
 add('DT-001','Framed date aperture · 28','Calendar window',[2.45,0,1.90],[2.45,0,7.35],0,g=>{
  const s=rounded(.85,.64,.07),h=new T.Path();h.moveTo(-.29,-.19);h.lineTo(-.29,.19);h.lineTo(.29,.19);h.lineTo(.29,-.19);h.closePath();s.holes.push(h);mesh(g,shapeGeo(s,.11,.017),'polished');
  for(const sign of [-1,1]){bar(g,[-.29,sign*.205],[.29,sign*.205],.018,.13,'gold',.014);bar(g,[sign*.306,-.2],[sign*.306,.2],.018,.13,'gold',.014);}
  pin(g,-.36,-.23,-.12,.28,.025);pin(g,.36,.23,-.12,.28,.025);
 });
 add('CG-001','Calendar drive pinion','Calendar drive',[1.74,1.75,1.48],[1.85,1.86,6.85],0,g=>gear(g,.30,20,'brass',4),{type:'gear',speed:-.08});
 add('CJ-001','Date jumper spring','Calendar jumper',[2.54,-.65,1.61],[2.68,-.7,6.95],0,g=>{bar(g,[-.22,-.25],[.18,.29],.046,0,'polished',.038);bar(g,[.18,.29],[-.12,.37],.065,0,'polished',.045);screw(g,-.22,-.25,.065,.06);mesh(g,new T.BoxGeometry(.08,.1,.06),'ruby',-.11,.36,.03);});
 add('CB-001','Screw-down exhibition caseback','Caseback ring',[0,0,-1.20],[0,0,-11.8],0,g=>{mesh(g,annulus(3.63,2.80,.18),'brushed');mesh(g,torus(3.59,.04,96),'polished',0,0,-.01);mesh(g,torus(2.81,.027,80),'gold',0,0,.02);for(let i=0;i<8;i++){const a=i*TAU/8;screw(g,3.35*Math.cos(a),3.35*Math.sin(a),-.04,.10,a);}});
 add('RC-001','Rear exhibition sapphire','Rear crystal',[0,0,-1.22],[0,0,-12.35],0,g=>{mesh(g,disk(2.83,.028,80),'glass');mesh(g,torus(2.81,.015,80),'crystalEdge');});
 add('LG-001','Lower compound wheel cassette','Lower movement',[0,0,-.91],[0,0,-7.35],0,g=>{
  at(g,-.60,.50,0,b=>gear(b,.78,42,'brass',6),.85);at(g,.72,.20,.10,b=>gear(b,.68,36,'polished',5),.85);
  bar(g,[-1.65,.68],[1.48,-.10],.16,-.16,'dark',.18);bar(g,[-.6,.5],[-.6,-1.35],.16,-.20,'brushed',.16);bearing(g,-.6,-1.30,-.08,.10);
 });
 add('PN-001','Compound pinion cluster','Lower upper-train details',[-1.4,.10,.49],[-1.47,.10,1.55],0,g=>{
  at(g,0,0,0,b=>gear(b,.30,18,'polished',4));at(g,.48,.22,-.18,b=>gear(b,.23,16,'brass',4));at(g,-.38,.43,.21,b=>gear(b,.24,16,'brass',4));
  bar(g,[-.5,.50],[.58,.18],.12,-.25,'dark',.12);pin(g,-.4,.43,.02,.85,.038);
 });
 const balance=parts.find(p=>p.name==='BW-001');
 const spring=balance.children[0].children.find(m=>m.geometry.type==='TubeGeometry');
 add('HR-001','Balance hairspring','Oscillating assembly',[-.69,-1.76,-.06],[-.714,-1.822,-1.95],0,g=>{balance.children[0].remove(spring);g.add(spring);},{type:'balance',speed:1.25});
 // Recessed upper bridges with substantial side walls and support columns.
 for(const id of ['BR-001','BR-002','BR-003','BC-001']){
  const p=parts.find(p=>p.name===id),body=p.children[0],before=primitiveCount;
  const feet=id==='BR-001'?[[-2.28,1.12],[1.68,.70]]:id==='BR-003'?[[-.72,.04],[1.01,-.10]]:id==='BC-001'?[[-.97,.30]]:[[.63,-.25],[-.62,.37]];
  for(const [x,y]of feet){mesh(body,annulus(.13,.054,.055),'polished',x,y,-.03);pin(body,x,y,-.31,.63,.070);}
  // Bake extra bridge thickness; support posts remain true geometry after merging.
  for(const m of body.children){m.geometry.scale(1,1,1.65);m.position.z*=1.65;}
  p.userData.visual_primitives+=primitiveCount-before;
 }
 const placement={
  'HR-001':[8,-.06],'MP-001':[9,-.48],'CR-001':[9,-.36],'SF-001':[10,-.86],
  'GR-001':[7,.22],'GR-002':[6,.65],'GR-003':[6,.71],'GR-004':[7,.28],'GR-005':[7,.36],'GR-006':[8,.14],'GR-007':[6,.78],'GR-008':[6,.85],
  'MB-001':[7,.12],'BW-001':[8,-.06],'EF-001':[8,.29],'WR-001':[7,.39],
  'BR-001':[5,1.02],'BR-002':[5,1.05],'BR-003':[5,1.14],'BC-001':[8,.50],
  'SC-001':[5,1.44],'SC-002':[5,1.56],'SC-003':[5,1.49],'SC-004':[8,.94],'SC-005':[5,1.46],'SC-006':[5,1.45],
  'CW-001':[10,.32],'MC-001':[10,.35],'BZ-001':[1,2.37],'FC-001':[1,2.70],'DS-001':[3,1.95],
  'HH-001':[2,2.13],'HM-001':[2,2.25],'HS-001':[2,2.37],'HC-001':[2,2.43],
  'DW-001':[4,1.60],'DT-001':[4,1.90],'CG-001':[4,1.48],'CJ-001':[4,1.61],
  'CB-001':[11,-1.20],'RC-001':[11,-1.22],'LG-001':[10,-.91],'PN-001':[6,.49],
 };
 const newIds=new Set(['HR-001','MC-001','BZ-001','FC-001','DS-001','HH-001','HM-001','HS-001','HC-001','DW-001','DT-001','CG-001','CJ-001','CB-001','RC-001','LG-001','PN-001']);
 for(const p of parts){
  const d=p.userData,[layerId,z]=placement[p.name],layer=layers[layerId-1];d.home_position[2]=z;
  if(p.name==='CW-001'){d.home_position[0]=3.66;d.home_position[1]=0;}
  if(!newIds.has(p.name))d.exploded_position=[d.home_position[0]*1.035,d.home_position[1]*1.035,layer.explodedZ+(z-layer.z)*.65];
  if(p.name==='CW-001')d.exploded_position=[4.15,0,-9.55];
  d.layer_id=layerId;d.layer_name=layer.name;d.assembly_order=12-layerId;
  // Top-down separation, bottom-up assembly. Small offsets sequence peers in each tier.
  d.animation_delay=(layerId-1)*.53+(p.name==='FC-001'?0:(parts.indexOf(p)%3)*.07);d.animation_duration=2.4;
  if(p.name==='MC-001')d.animation_delay=5.20;
  d.exploded_rotation=[0,0,p.name.startsWith('SC')?.12:0];p.position.fromArray(d.home_position);
  d.asset_slot=['Upper bridge','Regulator','Case wall / lugs','Foundation'].includes(d.category)?'replaceable-static-body':null;
  d.visual_primitives=p.children[0].children.length;
 }
 // Bring the regulator inside the open dial so the hairspring remains readable when assembled.
 for(const p of parts.filter(p=>['BW-001','HR-001','BC-001','SC-004'].includes(p.name))){p.userData.home_position[1]+=.40;p.position.y=p.userData.home_position[1];p.userData.exploded_position[1]+=.40;}
 // Compress the assembled stack to wristwatch proportions; exploded tier spacing stays independent.
 for(const p of parts){p.userData.home_position[2]*=.44;p.position.z=p.userData.home_position[2];for(const m of p.children[0].children){m.geometry.scale(1,1,.44);m.position.z*=.44;}}
 // Split existing geometry before material batching. Rebase each child about its
 // own inspection pivot; assembled world geometry remains exactly unchanged.
 function extract(donor,id,name,category,children){
  const source=parts.find(p=>p.name===donor),body=source.children[0];
  if(!children.length)throw new Error('Empty component '+id);
  const box=new T.Box3();children.forEach(m=>{m.updateMatrixWorld(true);box.expandByObject(m);});
  const pivot=box.getCenter(new T.Vector3()).sub(source.position);
  const home=source.position.clone().add(pivot).toArray();
  const p=add(id,name,category,home,home.slice(),0,g=>{for(const m of children){body.remove(m);m.position.sub(pivot);g.add(m);}});
  Object.assign(p.userData,{layer_id:source.userData.layer_id,layer_name:source.userData.layer_name,home_position:home,visual_primitives:children.length});
  source.userData.visual_primitives=body.children.length;
  return p;
 }
 root.updateMatrixWorld(true);
 let wi=9;
 for(const id of ['LG-001','PN-001','WR-001']){
  const body=parts.find(p=>p.name===id).children[0];
  for(const wheel of new Set(body.children.map(m=>m.userData.wheel).filter(Boolean))){
   extract(id,'GR-'+String(wi).padStart(3,'0'),wi>=11?'Reduction pinion '+(wi-10):'Lower train wheel '+(wi-8),'Gear train',body.children.filter(m=>m.userData.wheel===wheel));wi++;
  }
 }
 for(let i=1;i<=3;i++){
  const id='GR-00'+i,body=parts.find(p=>p.name===id).children[0];
  extract(id,'AX-00'+i,'Wheel arbor '+i,'Shaft',body.children.filter(m=>m.userData.kind==='shaft'));
  const bridge=parts.find(p=>p.name==='BR-00'+i).children[0];
  extract('BR-00'+i,'SP-00'+i,'Bridge support post '+i,'Support',bridge.children.filter(m=>m.userData.kind==='shaft').slice(0,2));
 }
 extract('MB-001','AX-004','Barrel arbor','Shaft',parts.find(p=>p.name==='MB-001').children[0].children.filter(m=>m.userData.kind==='shaft'));
 extract('CW-001','ST-001','Crown stem','Winding stem',parts.find(p=>p.name==='CW-001').children[0].children.slice(0,1));
 extract('DS-001','CH-001','Chapter ring and applied hour markers','Dial structure',parts.find(p=>p.name==='DS-001').children[0].children.slice(1));
 parts.find(p=>p.name==='LG-001').userData.name='Lower train support';
 parts.find(p=>p.name==='PN-001').userData.name='Pinion carrier';
 parts.find(p=>p.name==='WR-001').userData.name='Winding lever';
 parts.find(p=>p.name==='CW-001').userData.name='Knurled crown';
 parts.find(p=>p.name==='DS-001').userData.name='Open inner dial';
 // Twelve stages. The perimeter forms a quiet, rearward cradle; the exposed
 // train fans into a central volume with individual depth and lateral lanes.
 const exterior={
  'FC-001':[-7,3,-3],'BZ-001':[-7,3,-4.1],'MC-001':[-7,-4,-5],
  'CB-001':[-7,-4,-7],'RC-001':[-7,-4,-8],
  'DS-001':[7,3,-4],'CH-001':[7,3,-5.3],'DW-001':[7,-3.6,-3.8],
  'MP-001':[-7,3,-6.5],'CR-001':[-7,-4,-6.1]
 };
 const stageFor=p=>{const k=p.name.split('-')[0];if(['FC','BZ'].includes(k))return 0;if(['HH','HM','HS','HC'].includes(k))return 1;if(['DS','CH'].includes(k))return 2;if(['DW','DT','CG','CJ'].includes(k))return 3;if(k==='SC')return 4;if(['BR','SP'].includes(k))return 5;if(p.name==='GR-003'||k==='MB'||p.name==='AX-004')return 7;if(p.name==='GR-006'||k==='EF')return 8;if(['BW','BC','HR'].includes(k))return 9;if(['CB','RC'].includes(k))return 11;if(['MP','CR','SF','LG','MC'].includes(k))return 10;return 6;};
 const wheels=parts.filter(p=>p.name.startsWith('GR'));
 const lanes=[[-2.8,2.5,2.2],[0,2.9,3.0],[3,3,2],[-3.7,.1,1.1],[-.8,.1,1.7],[1.7,-2.1,1.4],[2.5,.6,2.7],[.3,1.2,4.6],[-2,-2.4,-.3],[.5,-2.8,-1.2],[-3.6,1.5,-1.8],[2.6,-.6,-1.4],[3.8,2,-.5],[.2,3.8,.1]];
 for(const p of parts){
  const d=p.userData,k=p.name.split('-')[0],stage=stageFor(p),i=parts.indexOf(p),[x,y,z]=d.home_position;
  d.explosion_stage=stage+1;d.assembly_order=12-stage;d.animation_delay=stage*.52+(i%4)*.10;d.animation_duration=2.2;
  d.exploded_position=[x*1.6,y*1.6,1+(10-d.layer_id)*.65];
  if(exterior[p.name])d.exploded_position=exterior[p.name];
  if(k==='GR')d.exploded_position=lanes[wheels.indexOf(p)];
  if(k==='SC')d.exploded_position=[x*1.6,y*1.6,7+(i%3)*.5];
  if(k==='AX')d.exploded_position=[x*1.5,y*1.5,5.3+(i%3)*.5];
  if(k==='SP')d.exploded_position=[x*1.6,y*1.6,4.8+(i%3)*.7];
  const positions={'BR-001':[-1.3,2.5,6.4],'BR-002':[3.3,-1.2,5.1],'BR-003':[1.9,3.4,6.2],
   'BW-001':[-2,-3.5,1.5],'HR-001':[-2,-3.5,3.2],'BC-001':[-2.4,-3.5,4.7],
   'MB-001':[3.7,-2.8,1.6],'EF-001':[.3,-3,3.6],'CW-001':[7,-.5,0],'ST-001':[5.4,-.5,1],
   'HH-001':[0,0,7.2],'HM-001':[0,0,8.2],'HS-001':[0,0,9.2],'HC-001':[0,0,10.1],
   'DT-001':[4.7,1,5.1],'CG-001':[4.4,2.4,3.9],'CJ-001':[4.8,-.8,4.1],
   'SF-001':[0,0,-4.3],'LG-001':[0,0,-2.9],'PN-001':[-3,0,-3],'WR-001':[-4,-1,3]};
  if(positions[p.name])d.exploded_position=positions[p.name];
  d.exploded_position[2]*=.78;
  d.exploded_rotation=['SC','AX','SP'].includes(k)?[0,0,.10]:exterior[p.name]?[-.9,.1,-.05]:[(i%3-1)*.09,(i%2?1:-1)*.10,(i%3-1)*.10];
 }
 for(const l of layers)l.z*=.44;
 // Merge within each assembly and material. Keep independent motion pivots.
 let drawCalls=0,triangles=0;
 for(const p of parts){const body=p.children[0],buckets=new Map();for(const m of [...body.children]){m.updateMatrix();const geo=m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone();geo.applyMatrix4(m.matrix);if(!buckets.has(m.material))buckets.set(m.material,[]);buckets.get(m.material).push(geo);m.geometry.dispose();body.remove(m);}for(const [mat,geos] of buckets){const merged=new T.BufferGeometry();for(const key of ['position','normal','uv']){const attrs=geos.map(g=>g.getAttribute(key)),data=new Float32Array(attrs.reduce((s,a)=>s+a.array.length,0));let offset=0;for(const a of attrs){data.set(a.array,offset);offset+=a.array.length;}merged.setAttribute(key,new T.BufferAttribute(data,attrs[0].itemSize));}merged.computeBoundingSphere();const m=new T.Mesh(merged,mat.clone());m.userData.part_id=p.name;body.add(m);drawCalls++;triangles+=merged.attributes.position.count/3;geos.forEach(g=>g.dispose());}}
 root.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(root),depth=bounds.max.z-bounds.min.z;
 return {root,parts,moving,materials,layers,metrics:{mainParts:parts.length,visualPrimitives:primitiveCount,secondaryPrimitives:primitiveCount-parts.length,layerCount:layers.length,watchTotalDepth:Number(depth.toFixed(3)),watchDepthRange:[bounds.min.z,bounds.max.z],caseDiameter:7.56,caseThicknessRatio:Number((depth/7.56).toFixed(3)),crystalDomeRatio:.132/7.56,gearCount,triangles,drawCalls,dynamicGears:moving.filter(m=>m.type==='gear'||m.type==='escape').length,movingHands:moving.filter(m=>m.type==='hand').length,calendarComponents:4,balanceMovement:true,textureBytes:128*128*4*2+1024*32*4}};
}
