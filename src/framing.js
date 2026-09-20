import * as T from 'three';
// Fit the actual world-space box to a safe part of the canvas, including view offsets.
export function fitBox(box,camera,target,direction,{horizontal=.64,vertical=.72}={}){
 const forward=direction.clone().normalize(),right=new T.Vector3().crossVectors(camera.up,forward).normalize(),up=new T.Vector3().crossVectors(forward,right).normalize();
 const tanV=Math.tan(T.MathUtils.degToRad(camera.fov/2)),tanH=tanV*camera.aspect;let radius=1;
 for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){const p=new T.Vector3(x,y,z).sub(target),depth=p.dot(forward);radius=Math.max(radius,depth+Math.abs(p.dot(right))/(tanH*horizontal),depth+Math.abs(p.dot(up))/(tanV*vertical));}
 return radius+.25;
}
