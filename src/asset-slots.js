import * as T from 'three';
// Accepts the scene from a future GLTFLoader result. Assembly transforms, identity,
// animation timing and exploded positions are owned by the parent and stay intact.
export function mountGeneratedAsset(part,asset,{position=[0,0,0],rotation=[0,0,0],scale=[1,1,1],source,license}={}){
 if(!part?.userData.asset_slot)throw new Error('Part is not a replaceable static asset slot');
 if(!asset?.isObject3D||!source||!license)throw new Error('Object3D, source and license are required');
 const oldBody=part.children[0],body=new T.Group();body.name=part.name+'-body';body.position.fromArray(position);body.rotation.fromArray(rotation);body.scale.fromArray(scale);body.add(asset);
 part.remove(oldBody);part.add(body);part.userData.asset_provenance={source,license};
 return ()=>{part.remove(body);part.add(oldBody);delete part.userData.asset_provenance;};
}
