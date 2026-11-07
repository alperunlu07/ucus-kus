// Kağıt Kuş — standalone folded-paper architecture. +Y up; bases at y=0.
import * as THREE from 'three';
import {makeFeltMaterial} from './sheepModel.js';
export const TOWN_VARIANTS={Koy:false,Kasaba:true};
export const TOWN_PALETTES=[
 {name:'Klasik',walls:['#ead9b9','#f2e5ca','#dec9a8'],roofs:['#bb6950','#567f7a','#c39c52'],trim:'#f7edda'},
 {name:'Sahil',walls:['#f2eee0','#d5e6e4','#f6e1cc'],roofs:['#638e9e','#cd8171','#7babb3'],trim:'#fff5e2'},
 {name:'Sonbahar',walls:['#ead2aa','#e3bf98','#eedfbd'],roofs:['#a95844','#bd7b48','#846758'],trim:'#f5dfb6'},
 {name:'Savana',walls:['#d9bb86','#ead2a0','#cfab79'],roofs:['#a57448','#b29059','#887a53'],trim:'#f0ddb0'},
 {name:'Pampa',walls:['#f2eee1','#eae3d1','#eee1c7'],roofs:['#7f9694','#b77960','#a28c5f'],trim:'#fff3df'},
 {name:'Orman',walls:['#e0d5b5','#ede2c9','#d3c6a8'],roofs:['#687f69','#9e7555','#8e9c79'],trim:'#f3e8d0'}
];
// Each palette owns paving, timber and glazing as well as walls/roofs.
const accents=[
 ['#d7c59f','#a99b82','#8b6b4e','#506a6b'],['#e2d9bb','#aab8af','#6e8c91','#507b8a'],['#d0b28c','#a28d77','#906148','#655f58'],
 ['#cfb481','#ad946d','#8e754e','#6d755f'],['#ded2b3','#b6ac95','#84918b','#5d7b7a'],['#c9bea0','#9f9b7e','#73806c','#4f6962']
];TOWN_PALETTES.forEach((p,i)=>{[p.path,p.base,p.wood,p.glass]=accents[i];});
const mats=new Map();
function material(c){if(!mats.has(c))mats.set(c,Object.assign(makeFeltMaterial(c),{vertexColors:false}));return mats.get(c);}
function mesh(g,c,parent,x=0,y=0,z=0){const m=new THREE.Mesh(g,material(c));m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;parent.add(m);return m;}
function box(parent,c,w,h,d,x=0,y=0,z=0){return mesh(new THREE.BoxGeometry(w,h,d),c,parent,x,y,z);}
function gable(parent,c,w,rise,d,y){const s=new THREE.Shape();s.moveTo(-w/2,0);s.lineTo(w/2,0);s.lineTo(0,rise);s.closePath();const g=new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:false});return mesh(g,c,parent,0,y,-d/2);}
function roof(parent,c,w,d,y,rise){const half=w/2,len=Math.hypot(half,rise),a=Math.atan2(rise,half);for(const sign of[-1,1]){const m=box(parent,c,len,.085,d,sign*w/4,y+rise/2,0);m.rotation.z=-sign*a;
 // Overlapping rectangular paper shingles retain the roof's single folded silhouette.
 for(let row=0;row<4;row++)for(let col=0;col<6;col++){const t=(row+.5)/4;const tint=new THREE.Color(c).multiplyScalar(1+((row+col)%3-1)*.025);const tile=box(parent,'#'+tint.getHexString(),len/4+.025,.026,d/6-.018,sign*half*t,y+rise*(1-t)+.06,-d/2+(col+.5)*d/6);tile.rotation.z=-sign*a;tile.castShadow=false;}
 }box(parent,c,.14,.13,d+.08,0,y+rise+.065,0);}
// Batch immutable card pieces per building/material; keep articulated nodes intact.
function compact(root){root.updateMatrixWorld(true);const inv=root.matrixWorld.clone().invert(),buckets=new Map(),source=[];
 root.traverse(m=>{if(!m.isMesh)return;for(let p=m.parent;p&&p!==root;p=p.parent)if(p.userData.sway)return;const key=m.material.uuid+'/'+m.castShadow+'/'+m.receiveShadow;if(!buckets.has(key))buckets.set(key,{material:m.material,cast:m.castShadow,receive:m.receiveShadow,parts:[]});const g=m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone();g.applyMatrix4(inv.clone().multiply(m.matrixWorld));buckets.get(key).parts.push(g);source.push(m);});
 for(const m of source){m.removeFromParent();m.geometry.dispose();}
 for(const b of buckets.values()){const g=new THREE.BufferGeometry();for(const name of ['position','normal','uv']){const size=name==='uv'?2:3,n=b.parts.reduce((n,p)=>n+p.attributes[name].array.length,0),a=new Float32Array(n);let at=0;for(const p of b.parts){a.set(p.attributes[name].array,at);at+=p.attributes[name].array.length;}g.setAttribute(name,new THREE.BufferAttribute(a,size));}g.computeBoundingSphere();const m=new THREE.Mesh(g,b.material);m.castShadow=b.cast;m.receiveShadow=b.receive;root.add(m);b.parts.forEach(p=>p.dispose());}return root;
}
export function createHouse({biome=0,seed=1,width=2.4,depth=2,height=1.75,roofIndex=seed%3}={}){
 const p=TOWN_PALETTES[biome]||TOWN_PALETTES[0],o=new THREE.Group();o.name='Paper house';const w=width,d=depth,h=height,r=.85;
 box(o,p.base,w+.12,.14,d+.12,0,.07,0);
 box(o,p.walls[seed%3],w,h-.14,d,0,(h+.14)/2,0);gable(o,p.walls[seed%3],w,r,d,h);
 roof(o,p.roofs[roofIndex%3],w+.36,d+.4,h-.18*r/(w/2),r*(w+.36)/w);
 box(o,'#c2ab8e',.28,.95,.3,w*.27,h+r-.15,-d*.2);box(o,'#e7d8ba',.38,.12,.4,w*.27,h+r+.31,-d*.2);box(o,'#6d6256',.22,.012,.24,w*.27,h+r+.375,-d*.2);
 // Doors and glazing are layered card, with visible dark inset reveals.
 const trim=p.trim,wood=p.wood,glass=p.glass;
 box(o,wood,.54,.98,.06,0,.63,d/2+.035);box(o,'#bb9870',.41,.85,.035,0,.63,d/2+.075);
 for(let i=0;i<4;i++)box(o,'#9b7a58',.012,.79,.012,-.15+i*.1,.63,d/2+.1);
 mesh(new THREE.SphereGeometry(.028,8,6),'#e9c37b',o,.13,.61,d/2+.13);
 box(o,trim,.68,.1,.12,0,1.16,d/2+.05);for(const x of[-.3,.3])box(o,trim,.08,1.03,.13,x,.64,d/2+.05);
 box(o,'#b9ab90',.85,.1,.55,0,.05,d/2+.24);box(o,'#d6c6a8',.69,.12,.3,0,.14,d/2+.12);
 function windowAt(parent,x,y,z){const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);box(g,wood,.63,.7,.055);box(g,glass,.49,.54,.022,0,0,.035);for(const sx of[-.29,.29])box(g,trim,.07,.7,.08,sx,0,.04);for(const sy of[-.31,0,.31])box(g,trim,.63,.055,.08,0,sy,.045);box(g,trim,.045,.62,.08,0,0,.05);box(g,trim,.75,.065,.2,0,-.37,.06);
 for(const side of[-1,1]){box(g,p.roofs[1],.14,.62,.045,side*.41,0,0);for(let i=0;i<4;i++)box(g,trim,.12,.018,.014,side*.41,-.22+i*.145,.03);}
 return g;}
 for(const x of[-w*.32,w*.32])windowAt(o,x,1.04,d/2+.04);
 for(const side of[-1,1])for(const z of[-d*.27,d*.27]){const g=new THREE.Group();g.position.set(side*(w/2+.04),1.04,z);g.rotation.y=side*Math.PI/2;o.add(g);windowAt(g,0,0,0);}
 for(const x of[-w/2+.04,w/2-.04])box(o,trim,.09,h-.15,.07,x,(h+.15)/2,d/2+.04);
 // Gable fascia and small loft opening, both readable from low flight.
 const a=Math.atan2(r,w/2),len=Math.hypot(w/2,r);for(const sign of[-1,1]){const m=box(o,trim,len+.1,.075,.095,sign*w/4,h+r/2+.015,d/2+.065);m.rotation.z=-sign*a;}
 const loft=new THREE.Group();loft.position.set(0,h+.33,d/2+.035);o.add(loft);box(loft,trim,.36,.4,.065);box(loft,glass,.24,.28,.03,0,0,.045);box(loft,trim,.035,.28,.04,0,0,.07);
// The rear is designed too, so inward-facing settlements have no blank box backs.
 const rear=new THREE.Group();rear.position.z=-d/2-.04;rear.rotation.y=Math.PI;o.add(rear);for(const x of[-w*.28,w*.28])windowAt(rear,x,1.04,0);
 if(h>2.2){for(const x of[-w*.28,w*.28]){windowAt(o,x,h-.49,d/2+.04);windowAt(rear,x,h-.49,0);}}
 box(rear,trim,w,.055,.06,0,h+.025,0);
 for(const x of[-w*.32,w*.32]){box(o,p.wood,.68,.16,.24,x,.53,d/2+.18);box(o,'#556f4f',.57,.035,.16,x,.62,d/2+.19);for(let i=0;i<3;i++){const xx=x+(i-1)*.18;box(o,'#708552',.018,.12,.018,xx,.69,d/2+.2);const flower=mesh(new THREE.CircleGeometry(.055,5),i%2?'#d6907f':'#e8ca84',o,xx,.76,d/2+.23);flower.rotation.x=-.35;}}
 if(seed%4===1){const lean=new THREE.Group();lean.position.set(-w/2-.38,0,-.2);o.add(lean);box(lean,p.walls[0],.65,1,.95,0,.5,0);const cap=box(lean,p.roofs[0],.83,.075,1.12,0,1.07,0);cap.rotation.z=.2;box(lean,p.wood,.27,.69,.03,0,.36,.49);}
 o.userData={kind:'house',seed,width:w,depth:d,height:h};return compact(o);
}
// A four-faced clock tower: folded square spire, belfry and layered buttresses.
function createTower(biome=0){const p=TOWN_PALETTES[biome]||TOWN_PALETTES[0],o=new THREE.Group();o.name='tower';
 box(o,'#b4a287',2.15,.18,2.15,0,.09,0);box(o,p.walls[0],1.65,4.35,1.65,0,2.3,0);
 for(const x of[-.87,.87])for(const z of[-.87,.87]){box(o,'#c8b596',.26,2.2,.26,x,1.2,z);box(o,p.trim,.32,.12,.32,x,2.33,z);}
 for(const y of[.3,3.05,4.42,5.25])box(o,p.trim,1.9,.14,1.9,0,y,0);
 box(o,p.walls[1],1.6,.75,1.6,0,4.86,0);
 for(let k=0;k<4;k++){const f=new THREE.Group();f.rotation.y=k*Math.PI/2;o.add(f);
 box(f,'#75644e',.48,1.03,.05,0,.85,.84);box(f,p.trim,.62,.1,.08,0,1.43,.88);
 box(f,'#645c50',.78,.47,.04,0,4.83,.82);for(let j=0;j<4;j++)box(f,'#9a8a6d',.74,.045,.045,0,4.65+j*.115,.85);
 const ring=mesh(new THREE.CylinderGeometry(.43,.43,.065,24),p.roofs[1],f,0,3.7,.86);ring.rotation.x=Math.PI/2;const face=mesh(new THREE.CylinderGeometry(.355,.355,.075,24),p.trim,f,0,3.7,.89);face.rotation.x=Math.PI/2;
 for(let j=0;j<12;j++){const a=j/12*Math.PI*2;const tick=box(f,'#6a6255',.028,.07,.018,Math.sin(a)*.29,3.7+Math.cos(a)*.29,.94);tick.rotation.z=-a;}
 box(f,'#5c5e53',.035,.22,.024,0,3.8,.955);const hand=box(f,'#5c5e53',.19,.035,.025,.07,3.7,.96);hand.rotation.z=.25;
 }
 const spire=mesh(new THREE.ConeGeometry(1.48,1.9,4),p.roofs[1],o,0,6.23,0);spire.rotation.y=Math.PI/4;
 box(o,p.roofs[1],2.12,.12,2.12,0,5.31,0);mesh(new THREE.SphereGeometry(.09,8,6),'#d5b875',o,0,7.25,0);
 o.userData={kind:'tower',height:7.4};return compact(o);
}
function createStation(biome=0){const p=TOWN_PALETTES[biome]||TOWN_PALETTES[0],o=new THREE.Group();o.name='station';o.userData={kind:'station',height:3.3};
 box(o,'#b3a68e',6.8,.18,3.8,0,.09,.7);box(o,p.trim,6.9,.055,.16,0,.2,2.54);for(let i=0;i<13;i++)box(o,'#c5b89b',.022,.015,3.6,-3.12+i*.52,.19,.7);
 const building=createHouse({biome,seed:1,width:4.8,depth:1.8,height:1.7,roofIndex:1});building.position.y=.18;o.add(building);
 const canopy=box(o,p.roofs[1],5.8,.1,1.45,0,1.83,1.52);canopy.rotation.x=.08;box(o,p.trim,5.85,.13,.09,0,1.74,2.23);
 for(const x of[-2.55,0,2.55]){box(o,'#8d7e61',.095,1.5,.095,x,.94,2.08);const brace=box(o,p.trim,.07,.5,.075,x+(.15*(x<=0?1:-1)),1.59,2.08);brace.rotation.z=x<=0?-.6:.6;}
 for(const x of[-1.45,1.45]){box(o,'#b48b59',1.05,.075,.33,x,.56,1.7);box(o,'#b48b59',1.05,.27,.06,x,.74,1.57);for(const dx of[-.4,.4])box(o,'#766e58',.06,.35,.23,x+dx,.37,1.7);}
 const sign=new THREE.Group();sign.position.set(0,1.7,2.29);sign.userData.sway=true;o.add(sign);box(sign,'#f3e4c5',1.22,.35,.07,0,-.16,0);
 if(typeof document!=='undefined'){const c=document.createElement('canvas');c.width=512;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle='#f3e4c5';ctx.fillRect(0,0,512,128);ctx.fillStyle='#596e67';ctx.font='bold 58px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('İSTASYON',256,67);const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;const m=new THREE.Mesh(new THREE.PlaneGeometry(1.18,.295),new THREE.MeshLambertMaterial({map:tex}));m.material.userData.owned=true;m.position.set(0,-.16,.039);sign.add(m);}
 return compact(o);
}
function path(parent,x1,z1,x2,z2,w=1,c='#d7c59d'){const len=Math.hypot(x2-x1,z2-z1);const m=box(parent,c,w,.035,len+.08,(x1+x2)/2,.022,(z1+z2)/2);m.rotation.y=Math.atan2(x2-x1,z2-z1);return m;}
export function createTown({town=false,biome=0,seed=1,station=true}={}){const o=new THREE.Group();o.name=town?'Kasaba':'Koy';o.userData={kind:'town',town,biome,seed,time:0};const palette=TOWN_PALETTES[biome]||TOWN_PALETTES[0];
 if(!town){const yard=mesh(new THREE.CylinderGeometry(2.25,2.3,.045,12),palette.path,o,0,.025,0);
 const count=7;for(let i=0;i<count;i++){const a=i/count*Math.PI*2+.16,r=4.75+(i%2)*.3,x=Math.sin(a)*r,z=Math.cos(a)*r;const house=createHouse({biome,seed:seed+i,width:2.05+(i%3)*.18,depth:1.8,height:1.55+(i%2)*.25});house.position.set(x,0,z);house.rotation.y=a+Math.PI;o.add(house);path(o,x*.48,z*.48,x*.77,z*.77,.66,palette.path);}

 }else{
 // Four compact blocks flank crossing roads; back lanes serve the second row.
 path(o,-13,0,13,0,1.6,palette.path);path(o,0,-11.6,0,11.6,1.6,palette.path);
 for(const sign of[-1,1])path(o,-11.6,sign*5.1,11.6,sign*5.1,.72,'#c9ba97');
 box(o,palette.base,4.9,.055,4.9,0,.03,0);box(o,'#e0d0ae',4.6,.035,4.6,0,.075,0);
 for(let x=-2;x<=2;x++)for(let z=-2;z<=2;z++)box(o,(x+z)%2?'#d4c3a3':'#dcccc0',.84,.014,.84,x*.9,.1,z*.9);
 let i=0;for(const sx of[-1,1])for(const sz of[-1,1])for(let col=0;col<3;col++)for(let row=0;row<2;row++){
 const x=sx*(3.5+col*3.4),z=sz*(3.1+row*4);if(sx===-1&&sz===-1&&col===0&&row===0){const t=createTower(biome);t.position.set(x,0,z);o.add(t);path(o,x,z+1.2,x,-.8,.8);i++;continue;}const large=(i%5===0),h=createHouse({biome,seed:seed+i,width:large?2.6:2.1,depth:1.9,height:large?2.55:1.6+(i%3)*.16});h.position.set(x,0,z);h.rotation.y=sz>0?Math.PI:0;o.add(h);path(o,x,z-sz*1.05,x,z-sz*(row?1.85:2.3),.6,palette.path);i++;}
 }
 if(town&&station){const st=createStation(biome);st.position.set(0,0,-10.5);o.add(st);}
if(!town){for(const x of[-1.8,1.8]){box(o,palette.base,2.35,.42,.18,x,.21,6.65);box(o,palette.trim,2.48,.08,.26,x,.46,6.65);for(const end of[-1,1])box(o,palette.trim,.3,.56,.3,x+end*1.1,.28,6.65);}}
 return o;
}
export function updateHouse(o,dt){o.userData.time=(o.userData.time||0)+Math.max(0,Math.min(dt,.1));}
export function updateTown(o,dt){o.userData.time=(o.userData.time||0)+Math.max(0,Math.min(dt,.1));o.traverse(c=>{if(c.userData.sway)c.rotation.z=Math.sin(o.userData.time*.8)*.018;});}
