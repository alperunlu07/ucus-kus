// A composed settlement. Factory-local ground contact is preserved at y=0.
import * as THREE from 'three';
import {createHouse} from './townModel.js';
import {createRoad} from './roadModel.js';
import {createFence} from './fenceModel.js';
import {createPerson,createFisher,updatePerson} from './peopleModel.js';
import {createKidActivityGroup,updateKidActivityGroup} from './kidModel.js';
import {createTree,updateTree} from './treeModel.js';
import {createPlot,createFlowerPatch,createHayBale,updateField} from './fieldModel.js';
import {createSheep,updateSheep,newPoseState} from './sheepModel.js';
import {createCow,updateCow} from './cowModel.js';
import {createWindmill,updateWindmill} from './landmarkModel.js';
import {createRiver,updateWater} from './waterModel.js';
import {createDuck,updateFauna} from './faunaModel.js';
import {createBird,updateBird} from './birdModel.js';

export function createVillage({seed=1,scale=1}={}) {
 const g=new THREE.Group();g.name='Dere köyü';
 const d={seed,time:0,trees:[],sheep:[],cows:[],people:[],ducks:[],birds:[],waters:[],fields:[],outlines:[],districts:{all:[-2,0,-14],square:[-2,0,0],houses:[-3,0,0],fields:[-2,0,-24],paddock:[5.2,0,7.7],river:[12.6,0,1]}};g.userData=d;
 const place=(obj,x,z,rot=0,y=0)=>{obj.position.set(x,y,z);obj.rotation.y=rot;g.add(obj);return obj;};
 const road=(kind,length,x,z,rot=0,sx=1,sz=1)=>{const o=createRoad({kind,length,seed:seed+7});o.scale.set(sx,1,sz);return place(o,x,z,rot,.026);};
 // The cross is the square; narrow lanes lead out through three distinct districts.
 road('cross',7,-2,0,0,1,1.25);
 road('path',12.5,-11.75,0);road('path',7,4.9,0);
 road('ribbon',5,-2,-6.7,Math.PI/2,.94,.85);
 road('path',4,-2,5.5,Math.PI/2,1,.8);
 place(createFlowerPatch({w:2.5,d:1.4,seed:seed+40}),-2.1,8.3);
 const homes=[[-11,-3.4,0,2.3,1.85],[-6.4,-3.5,0,2.15,1.9],[2.5,-3.5,0,2.35,1.9],[7,-3.6,0,2.0,1.8],[-10.4,3.9,Math.PI,2.35,1.9],[-5.7,4.1,Math.PI,2.1,1.8],[.9,4.0,Math.PI,2.15,1.8]];
 d.houses=homes.map(([x,z,r,w,dep],i)=>{
  const o=place(createHouse({biome:0,seed:seed+i+2,width:w,depth:dep,height:1.55+(i%3)*.12,roofIndex:i%3}),x,z,r);
  // Small footpaths go from the threshold to the main lane, not through the building.
  const sign=z<0?1:-1,front=z+sign*(dep/2+.2),end=sign*1.0;
  road('path',4,x,(front+end)/2,Math.PI/2,Math.abs(front-end)/4,.36);
  if(i===0||i===4||i===2){place(createFlowerPatch({w:1.3,d:.7,seed:seed+i}),x+.85,z+sign*1.35);const fence=place(createFence({kind:'run',length:2.2,seed:seed+i,scale:.85}),x-1.7,z,Math.PI/2);d.fields.push(fence);}
  return o;
 });
 d.kids=place(createKidActivityGroup('ball',{seed:seed+2}),-2,.05,0,.04);d.kids.scale.setScalar(.58);d.kids.userData.activity.kids.forEach(k=>k.scale.multiplyScalar(.8));
 for(const [i,x,z,axis] of [[0,-7,.25,'x'],[1,4,.2,'x'],[2,-2,-5.3,'z']]){
  const p=place(createPerson({seed:seed+i,scale:.51}),x,z);d.people.push({obj:p,x,z,axis,phase:i*2.1});
 }
 const paddock=place(createFence({kind:'paddock',seed:seed+5,length:9.5}),5.3,8.0,Math.PI);d.paddock=paddock;
 road('ribbon',4,5.3,2.75,Math.PI/2,.81,.65);
 for(const [i,x,z,r] of [[0,3.4,7.4,.5],[1,4.5,9.3,2.2],[2,6.4,9.9,-.7],[3,3.5,9.5,1.3]]) {
  const s=place(createSheep({seed:seed+i,scale:i===3?.65:.85,isLamb:i===3}),x,z,r);s.userData.u=newPoseState(seed+i);d.sheep.push(s);
 }
 for(const [i,x,z,r] of [[0,6.8,6.8,-.9],[1,7.5,8.9,2.2]]){const c=createCow({seed:seed+i,variant:i?'brown':'patched'});c.scale.setScalar(.73);d.cows.push(place(c,x,z,r));}
 d.fields.push(place(createPlot({kind:'mustard',w:6,d:4.4,seed}),-10,-9.4,.03),place(createPlot({kind:'rice',w:4.2,d:4.2,seed:seed+1}),-4,-10,-.04));
 d.mill=place(createWindmill({scale:.87}),2,-9.4,-.12);
 road('path',4.2,.1,-7.45,0,1,.5);
 place(createHayBale({seed,group:3,scale:.9}),.4,-6.0);place(createHayBale({seed:seed+1,group:2,scale:.8}),7.1,11.8);
 // Farm lanes continue south of the mill plots; long strip fields follow those tracks.
 road('path',31,-2,-24.7,Math.PI/2,.92,.75);
 road('path',26,-10,-27,Math.PI/2,.9,.72);
 road('path',24,6,-28,Math.PI/2,.9,.72);
 road('path',16,-2,-27,0,.95,.7);
 road('path',16,-2,-39,0,.95,.7);
 const strips=[['mustard',-13.5,-20.8],['rice',-6.5,-20.8],['mustard',2.5,-20.8],['rice',9.5,-20.8],['rice',-13.5,-33.2],['mustard',-6.5,-33.2],['rice',2.5,-33.2],['mustard',9.5,-33.2]];
 strips.forEach(([kind,x,z],i)=>d.fields.push(place(createPlot({kind,w:2.8,d:10,seed:seed+20+i}),x,z,i%2?-.02:.02)));
 place(createHayBale({seed:seed+4,group:2,scale:.85}),-8.2,-27.2);
 place(createHayBale({seed:seed+5,group:3,scale:.8}),3.4,-39);
 place(createFlowerPatch({w:1.8,d:1.2,seed:seed+41}),-2.1,-15.6);
 place(createFlowerPatch({w:1.6,d:1.1,seed:seed+42}),6.2,-26.8);
 d.footprint={minX:-16,maxX:17,minZ:-42,maxZ:14};
 // River cut-section reaches both edges of the paper board; no isolated blue clip.
 const river=place(createRiver({seed:3}),12.8,0);river.scale.z=2.5;d.waters.push(river);
 d.outlines.push(river.userData.outline.map(([x,z])=>[x+12.8,z*2.5]));
 d.outline=d.outlines; // plural rings, local to this composed root
 const riverX=z=>{const j=Math.round((z/30+.5)*40),o=river.userData.outline;return 12.8+(o[j][0]+o[81-j][0])/2;};
 for(const [i,z,r] of [[0,1.2,.3],[1,3.3,2.5]]){const duck=place(createDuck({seed:seed+i}),riverX(z)+(i?.25:-.2),z,r,-.11);duck.scale.setScalar(.65);d.ducks.push(duck);}
 d.fisher=place(createFisher({seed:2,scale:.52}),12.8+river.userData.outline[22][0]-.5,1.5,Math.PI/2,.18);
 // Deliberately uneven: garden shade, a lane rhythm, and a loose riverbank grove.
 const treeSpots=[[-14,-5.8,1.15],[-12.8,-12.6,.9],[-7.1,-12.6,.85],[-.6,-12.9,1], [6.4,-13.2,1.1],[7.5,-8.6,.85],[-13,3.1,.85],[-12.2,7.1,1.1],[-8.6,7.5,.85],[-5.6,8.1,1.05],[-3.8,5.9,.7],[-.2,8.5,.9],[8.7,3.2,.8],[9.4,-6.7,1.05],[9.7,10.8,.9],[15.7,-7.2,.9],[16.2,-3.8,.75],[16,6.2,1.05],[-8.2,-2.0,.65],[.1,-2.3,.7],[-14,-40,1],[-2,-41.2,.95],[8.2,-40.4,1.05],[11.7,-31.5,.85],[-14.2,-26.5,.8]];
 treeSpots.forEach(([x,z,s],i)=>d.trees.push(place(createTree({kind:i%6===0?'cicekli':'yuvarlak',seed:seed+i,scale:s}),x,z,i*.9)));
 for(const [i,x,y,z] of [[0,-4,4.5,-4],[1,7,4.2,-5]]){const b=place(createBird({species:'swallow',small:true,scale:.16,phase:i}),x,z,.4,y);d.birds.push(b);}
 g.scale.setScalar(scale);return g;
}
export function updateVillage(village,dt,action='idle') {
 const d=village.userData,live=action==='life'||action==='gun';dt=Math.max(0,Math.min(.05,dt));if(!live)return;
 d.time+=dt;const t=d.time;
 updateKidActivityGroup(d.kids,dt);
 for(const p of d.people){const u=t*.24+p.phase,move=Math.sin(u)*1.1;p.obj.position.set(p.x+(p.axis==='x'?move:0),.032,p.z+(p.axis==='z'?move:0));p.obj.rotation.y=p.axis==='x'?(Math.cos(u)>0?Math.PI/2:-Math.PI/2):(Math.cos(u)>0?0:Math.PI);updatePerson(p.obj,dt,'walk');}
 updatePerson(d.fisher,dt,'walk');
 d.sheep.forEach((s,i)=>updateSheep(s,(Math.floor(t/7)+i)%3?'graze':'idle',dt,.55));
 d.cows.forEach((c,i)=>updateCow(c,(Math.floor(t/9)+i)%2?'graze':'idle',dt,.6));
 d.trees.forEach(tr=>updateTree(tr,dt,.3));updateWindmill(d.mill,dt,'idle');
 d.waters.forEach(w=>updateWater(w,dt,'calm'));d.ducks.forEach((o,i)=>{updateFauna(o,'paddle',dt);o.position.z=(i?3.3:1.2)+Math.sin(t*.2+i)*.25;});
 d.birds.forEach((b,i)=>updateBird(b,'flap',dt,.7));updateField(null,t,.3);
}
