// Kağıt Kuş — paper/felt railway track and level crossing. +Y up.
// Origin: y=0 is ground contact at the base of the earth embankment; track runs along X, centred on x=0.
// Stack: embankment (0..EMB) → felt ballast (EMB..BAL) → sleepers (BAL..SLP) → rails on top (SLP..RAIL).
import * as THREE from 'three';
import {makeFeltMaterial} from './sheepModel.js';
export const RAIL_DIMS={EMB:.22,BAL:.36,SLP:.43,RAIL:.55,GAUGE:.9};
const {EMB,BAL,SLP,RAIL,GAUGE}=RAIL_DIMS;
const C={earth:'#a98d68',earthDark:'#8f7656',ballast:'#b9ab95',stone:['#9d9284','#b9ad9c','#888073','#cfc4b2'],sleeper:'#a58a6c',sleeperEnd:'#c4a988',bolt:'#5a4c42',rail:'#73625a',railHead:'#aa9d90',plate:'#b8aa92',road:'#9c958a',roadEdge:'#d8cfbd',red:'#c8553f',white:'#fbf5e8',post:'#efe6d4',postDark:'#5a4f46',lamp:'#d24b3a',seam:'#7c6650'};
const mats=new Map();
function material(c){if(!mats.has(c))mats.set(c,Object.assign(makeFeltMaterial(c),{vertexColors:false}));return mats.get(c);}
function rng(s){return()=>((s=Math.imul(s,1664525)+1013904223>>>0)/4294967296);}
function mesh(g,c,p,x=0,y=0,z=0){const m=new THREE.Mesh(g,material(c));m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;p.add(m);return m;}
function box(p,c,w,h,d,x=0,y=0,z=0){return mesh(new THREE.BoxGeometry(w,h,d),c,p,x,y,z);}
// Trapezoid prism extruded along X (length L), cross-section in z/y.
function prism(p,c,L,bot,top,y0,y1){const s=new THREE.Shape();s.moveTo(-bot/2,y0);s.lineTo(bot/2,y0);s.lineTo(top/2,y1);s.lineTo(-top/2,y1);s.closePath();const g=new THREE.ExtrudeGeometry(s,{depth:L,bevelEnabled:false});g.rotateY(Math.PI/2);g.translate(-L/2,0,0);return mesh(g,c,p);}
// Rail profile: foot flange, thin web, rounded head.
function railGeo(L){const s=new THREE.Shape();const f=.075,w=.016,hf=.018,hw=.07,hh=.042,hb=.032;s.moveTo(-f,0);s.lineTo(f,0);s.lineTo(f,hf*.6);s.lineTo(w,hf);s.lineTo(w,hw);s.lineTo(hb,hw+.008);s.lineTo(hb,hw+hh-.008);s.quadraticCurveTo(hb,hw+hh,hb-.01,hw+hh);s.lineTo(-hb+.01,hw+hh);s.quadraticCurveTo(-hb,hw+hh,-hb,hw+hh-.008);s.lineTo(-hb,hw+.008);s.lineTo(-w,hw);s.lineTo(-w,hf);s.lineTo(-f,hf*.6);s.closePath();const g=new THREE.ExtrudeGeometry(s,{depth:L,bevelEnabled:false});g.rotateY(Math.PI/2);g.translate(-L/2,0,0);return g;}
function inst(p,geo,c,n,fn){const m=new THREE.InstancedMesh(geo,material(c),n);const o=new THREE.Object3D();for(let i=0;i<n;i++){fn(o,i);o.updateMatrix();m.setMatrixAt(i,o.matrix);}m.castShadow=m.receiveShadow=true;p.add(m);return m;}
function bed(g,L,r,{skip=null}={}){
 // Earth embankment with a darker cut-felt toe seam.
 prism(g,C.earth,L,2.9,2.2,0,EMB);prism(g,C.earthDark,L,3.0,2.92,0,.03);
 // Cut-felt seam band halfway up the bank, and grass tufts along the toe.
 prism(g,C.seam,L,2.58,2.555,EMB*.5-.006,EMB*.5+.006);
 const tuft=new THREE.ConeGeometry(.05,.14,5);for(const tc of['#7f9a63','#93a86f'])inst(g,tuft,tc,Math.round(L*3),(o)=>{const sd=r()<.5?-1:1;o.position.set((r()-.5)*L,.06,sd*(1.45+r()*.15));o.rotation.set((r()-.5)*.6,r()*6,(r()-.5)*.6);const k=.6+r()*.8;o.scale.set(k*1.3,k*.55,k);});
 // Pale folded crease where the bank meets the ballast.
 prism(g,'#cdb894',L,2.24,2.2,EMB-.004,EMB+.008);
 // Ballast shoulder.
 prism(g,C.ballast,L,2.1,1.62,EMB,BAL);
 // Felt gravel pebbles scattered on the shoulder and between sleepers.
 const peb=new THREE.DodecahedronGeometry(.045,0);
 C.stone.forEach((col,k)=>{const n=Math.round(L*60);inst(g,peb,col,n,(o)=>{let x,z,y;do{x=(r()-.5)*L;z=(r()-.5)*1.95;}while(skip&&skip(x));const az=Math.abs(z);y=az<.81?BAL:BAL-(az-.81)/.24*(BAL-EMB)*.9;y=Math.max(EMB,y);o.position.set(x,y+.005,z);o.rotation.set(r()*6,r()*6,r()*6);const s=.45+r()*.6;o.scale.set(s,s*.6,s);});});
}
export function createTrack({seed=1,length=10,scale=1}={}){
 const r=rng(seed*7919+11);const root=new THREE.Group();root.name='track';const g=new THREE.Group();root.add(g);root.scale.setScalar(scale);
 bed(g,length,r);addRails(g,length,r);
 root.userData={kind:'track',length,width:2.9,height:RAIL,dims:RAIL_DIMS};return root;
}
function addRails(g,L,r,skip=null){
 const pitch=.36,n=Math.floor(L/pitch);const xs=[];for(let i=0;i<n;i++){const x=-L/2+pitch*(i+.5);if(!skip||!skip(x))xs.push(x);}
 const sl=new THREE.BoxGeometry(.2,SLP-BAL,1.42);
 const tilt=xs.map(()=>[(r()-.5)*.05,(r()-.5)*.012]);
 inst(g,sl,C.sleeper,xs.length,(o,i)=>{o.position.set(xs[i]+tilt[i][1],(BAL+SLP)/2,0);o.rotation.set(0,tilt[i][0],0);});
 // Pale end-grain caps and a grain seam on top.
 const cap=new THREE.BoxGeometry(.19,SLP-BAL-.006,.012);
 inst(g,cap,C.sleeperEnd,xs.length*2,(o,i)=>{const k=i>>1,s=i&1?1:-1;o.position.set(xs[k]+tilt[k][1]+Math.sin(tilt[k][0])*-s*.71,(BAL+SLP)/2,s*.713);o.rotation.y=tilt[k][0];});
 const grain=new THREE.BoxGeometry(.012,.004,1.2);
 inst(g,grain,C.seam,xs.length,(o,i)=>{o.position.set(xs[i]+tilt[i][1]+.035,SLP+.001,0);o.rotation.y=tilt[i][0];});
 // Base plates + bolts under each rail.
 const tp=new THREE.BoxGeometry(.17,.014,.2),bolt=new THREE.CylinderGeometry(.016,.016,.03,6);
 inst(g,tp,C.bolt,xs.length*2,(o,i)=>{const k=i>>1;o.position.set(xs[k],SLP+.007,(i&1?1:-1)*GAUGE/2);});
 inst(g,bolt,C.postDark,xs.length*4,(o,i)=>{const k=i>>2,side=i&1?1:-1,f=i&2?1:-1;o.position.set(xs[k]+f*.055,SLP+.015,side*GAUGE/2+f*.075);});
 const rg=railGeo(L);for(const s of[-1,1]){mesh(rg,C.rail,g,0,SLP+.014,s*GAUGE/2);const head=box(g,C.railHead,L,.006,.06,0,SLP+.014+.112+.003,s*GAUGE/2);head.castShadow=false;}
 // Fishplate joints every ~3 units.
 for(let x=-L/2+3;x<L/2-.5;x+=3)for(const s of[-1,1])for(const t of[-1,1])box(g,C.postDark,.3,.04,.012,x,SLP+.06,s*GAUGE/2+t*.022);
}
function stripedArm(len){const a=new THREE.Group();const seg=len/7;for(let i=0;i<7;i++){box(a,i%2?C.white:C.red,seg+.002,.09,.06,seg*(i+.5),0,0);}
 box(a,C.postDark,.14,.12,.09,-.05,0,0);// counterweight
 const tip=box(a,C.red,.05,.12,.06,len,0,0);a.userData.len=len;return a;}
function crossbuck(p,x,z,face){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=face;p.add(g);
 box(g,C.post,.07,1.35,.07,0,.675,0);for(let i=0;i<6;i++)box(g,i%2?C.white:C.postDark,.075,.06,.075,0,.12+i*.12,0);
 for(const s of[-1,1]){const b=new THREE.Group();b.position.set(0,1.2,.05);b.rotation.z=s*.55;g.add(b);const n=5;for(let i=0;i<n;i++)box(b,i%2?C.red:C.white,.7/n+.001,.1,.02,-.35+.7/n*(i+.5),0,s*.006);box(b,C.red,.74,.12,.012,0,0,-.012*s-.004);}
 // Warning lamps.
 const head=box(g,C.postDark,.36,.14,.06,0,.86,.03);for(const s of[-1,1]){const l=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,.03,14),new THREE.MeshBasicMaterial({color:'#7d3a30'}));l.rotation.x=Math.PI/2;l.position.set(s*.11,.86,.07);g.add(l);g.userData['lamp'+(s>0?'R':'L')]=l;
  const hood=box(g,C.postDark,.12,.015,.06,s*.11,.92,.09);}
 return g;}
export function createCrossing({seed=1,scale=1,length=4.2,road=1.7}={}){
 const r=rng(seed*104729+3);const root=new THREE.Group();root.name='crossing';root.scale.setScalar(scale);const g=new THREE.Group();root.add(g);
 const gap=x=>Math.abs(x)<road/2+.05;
 bed(g,length,r,{skip:gap});addRails(g,length,r,gap);
 buildCrossingDeck(g,road,r);
 const barriers=addBarriers(g,road);root.userData={kind:'crossing',length,width:6.4,height:1.4,barriers,lamps:g.userData.lamps,t:0,phase:1,dims:RAIL_DIMS};return root;
}
function buildCrossingDeck(g,road,r){
 // Road runs along Z across the rails; ramps descend the embankment to ground.
 const top=SLP+.02;const deck=box(g,C.plate,road,.06,2.1,0,top-.03,0);
 for(let i=0;i<5;i++)box(g,C.seam,.008,.003,2.08,-road/2+road/5*(i+.5)+road/10,top+.002,0);
 for(const s of[-1,1])box(g,C.sleeper,road+.08,.07,.09,0,top-.025,s*1.03);// timber deck edges
 // Paper ramps.
 for(const s of[-1,1]){const ramp=new THREE.Shape();ramp.moveTo(0,0);ramp.lineTo(1.25,0);ramp.lineTo(0,top);ramp.closePath();const geo=new THREE.ExtrudeGeometry(ramp,{depth:road,bevelEnabled:false});geo.translate(0,0,-road/2);geo.rotateY(-Math.PI/2);const m=mesh(geo,C.road,g,0,0,s*1.05);m.scale.z=s;
  const flat=box(g,C.road,road,.03,2.4,0,.015,s*(1.05+1.25+1.2));
  for(const e of[-1,1])box(g,C.roadEdge,.05,.032,2.4,e*(road/2-.08),.017,s*(1.05+1.25+1.2));
  for(let k=0;k<3;k++)box(g,C.white,.06,.034,.32,0,.017,s*(2.7+k*.6));}
 // Flangeway gaps: dark strips inside each rail.
 for(const s of[-1,1])box(g,C.postDark,road,.004,.035,0,top+.002,s*(GAUGE/2-.05));
 for(const s of[-1,1]){const r2=railGeo(road+.1);mesh(r2,C.railHead,g,0,top-.07,s*GAUGE/2).scale.y=.7;}
}
function addBarriers(g,road){const out=[];
 for(const s of[-1,1]){const x=s*(road/2+.25),z=s*1.75;
  const post=box(g,C.post,.12,.7,.12,x,.35,z);box(g,C.postDark,.18,.06,.18,x,.03,z);
  const pivot=new THREE.Group();pivot.position.set(x,.62,z);g.add(pivot);const arm=stripedArm(road+.15);arm.rotation.y=s>0?Math.PI:0;pivot.add(arm);
  // Arm hinges about Z axis: raised = vertical.
  pivot.userData.sign=s;out.push(pivot);
  const fork=box(g,C.postDark,.05,.5,.05,-x,.25,z);box(g,C.postDark,.1,.04,.1,-x,.5,z);
  crossbuck(g,s*(road/2+.95),s*2.6,s>0?Math.PI:0);}
 g.userData.lamps=[];g.traverse(o=>{if(o.userData.lampL)g.userData.lamps.push(o.userData.lampL,o.userData.lampR);});
 return out;}
export function createRailway({seed=3,length=16,scale=1}={}){const root=new THREE.Group();root.name='railway';root.scale.setScalar(scale);
 const r=rng(seed*31+7);const cross=createCrossing({seed});root.add(cross);
 const side=(length-cross.userData.length)/2;for(const s of[-1,1]){const t=createTrack({seed:seed+(s>0?1:2),length:side});t.position.x=s*(cross.userData.length/2+side/2);root.add(t);}
 root.userData={kind:'railway',length,width:6.4,height:1.4,crossing:cross};return root;}
// action: 'down' | true lowers barriers and blinks lamps; anything else raises them.
export function updateRailway(obj,dt,action){const c=obj.userData.crossing||(obj.userData.kind==='crossing'?obj:null);if(!c)return;const u=c.userData;const down=action==='down'||action===true||action===1;
 u.phase+=((down?0:1)-u.phase)*Math.min(1,dt*2.2);if(Math.abs(u.phase-(down?0:1))<.002)u.phase=down?0:1;u.t+=dt;
 for(const p of u.barriers){const a=u.phase*Math.PI*.47;p.rotation.z=p.userData.sign>0?-a:a;}
 const on=down||u.phase<.98;u.lamps.forEach((l,i)=>{const lit=on&&((Math.floor(u.t*2.4)+i)%2===0);l.material.color.set(lit?'#ff5a3c':'#7d3a30');});}
