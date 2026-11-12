// Kağıt Kuş — kağıt/keçe çitler.
// Origin: y=0 is ground contact at the bottoms of the posts. Runs lie along +X,
// centred on x=0 (gate runs: gate opening centred at x=0). Paddocks are centred
// on the origin with the gateway facing +Z. Units match the game (~1 = sheep length).
import * as THREE from 'three';
import {makeFeltMaterial,merge} from './sheepModel.js';
export const FENCE_KINDS=['run','gate','paddock'];
const COL={post:'#b08a63',postDark:'#957253',cap:'#c9a47a',rail:'#b99169',railDark:'#9c7755',end:'#e2c9a2',lash:'#b9614f',twine:'#e9dcbf',iron:'#4b4a45',soil:'#7d6a4f',gate:'#ebe0c6',gateBrace:'#cbb48c'};
function rng(s){s=(s>>>0)||1;return()=>((s=Math.imul(s^s>>>15,1|s)+0x6d2b79f5|0,((s^s>>>14)>>>0)/4294967296));}
const P=[];// part collector helpers
function box(parts,w,h,d,x,y,z,c,ry=0,rz=0,rx=0){const g=new THREE.BoxGeometry(w,h,d);g.rotateX(rx);g.rotateZ(rz);g.rotateY(ry);g.translate(x,y,z);parts.push([g,c]);}
// Folded-paper post: square prism with chamfered (8-sided, uneven) corners, pyramid cap, soil collar.
function post(parts,x,z,h,r,R,ry=0){const w=.085*(1+(R()-.5)*.12);const tilt=(R()-.5)*.05;
 const g=new THREE.CylinderGeometry(w*.96,w,h,8,1);// octagon = square with folded chamfers
 const p=g.attributes.position;for(let i=0;i<p.count;i++){const a=Math.atan2(p.getZ(i),p.getX(i));const k=(Math.round(a/(Math.PI/4))%2===0)?.72:1.0;p.setX(i,p.getX(i)*k);p.setZ(i,p.getZ(i)*k);}
 g.rotateY(Math.PI/8+ry);g.rotateZ(tilt);g.translate(x,h/2,z);parts.push([g,R()<.5?COL.post:COL.postDark]);
 const cap=new THREE.ConeGeometry(w*1.18,.09,4,1);cap.rotateY(Math.PI/4+ry);cap.translate(x+Math.sin(-tilt)*h,h+.045,z);parts.push([cap,COL.cap]);
 const cap2=new THREE.BoxGeometry(w*1.7,.025,w*1.7);cap2.rotateY(ry);cap2.translate(x+Math.sin(-tilt)*h,h+.005,z);parts.push([cap2,COL.postDark]);
 for(const f of [0,Math.PI/2]){const sm=new THREE.BoxGeometry(.018,h*.9,.03);sm.translate(w*.93,0,0);sm.rotateY(ry+f+Math.PI/4);sm.rotateZ(tilt);sm.translate(x,h/2,z);parts.push([sm,'#d3b48c']);}
 const col=new THREE.CylinderGeometry(w*1.25,w*1.5,.035,7);col.translate(x,.02,z);parts.push([col,COL.soil]);}
// Rail between two points: plank with lighter end-grain tabs + felt lashing at each post.
function rail(parts,a,b,y,R,over=.07,lash=true){const dx=b.x-a.x,dz=b.z-a.z,L=Math.hypot(dx,dz),ry=-Math.atan2(dz,dx);const sag=(R()-.5)*.02;
 const mx=(a.x+b.x)/2,mz=(a.z+b.z)/2,t=.034,hh=.075;box(parts,L+over*2,hh,t,mx,y+sag,mz,R()<.5?COL.rail:COL.railDark,ry,sag*.3);
 for(const sd of [-1,1]){const gx=Math.sin(ry)*sd*(t/2+.002),gz=Math.cos(ry)*sd*(t/2+.002);box(parts,L*.8,.008,.004,mx+gx,y+sag+hh*.12,mz+gz,'#8a6749',ry,sag*.3);}
 for(const s of [-1,1]){const ex=mx+Math.cos(ry)*s*(L/2+over),ez=mz-Math.sin(ry)*s*(L/2+over);box(parts,.012,hh*.92,t*1.08,ex,y+sag,ez,COL.end,ry);}
 if(lash)for(const q of [a]){// felt lashing: two crossed wrapped bands hugging the post
  for(const k of [-1,1]){const band=new THREE.BoxGeometry(.165,.02,.15);band.rotateZ(k*.28);band.rotateY(ry);band.translate(q.x,y,q.z);parts.push([band,COL.lash]);}}}
function wire(parts,a,b,y){const dx=b.x-a.x,dz=b.z-a.z,L=Math.hypot(dx,dz),ry=-Math.atan2(dz,dx);const g=new THREE.CylinderGeometry(.008,.008,L,4);g.rotateZ(Math.PI/2);g.translate(0,0,0);g.rotateY(ry);g.translate((a.x+b.x)/2,y-.012,(a.z+b.z)/2);parts.push([g,COL.twine]);}
const H=.64,RAILS=[.2,.42],TOP=.58;
function segment(parts,a,b,R){for(const y of RAILS)rail(parts,a,b,y,R,.07,true);rail(parts,a,b,TOP,R,.04,false);wire(parts,a,b,.31);}
// Hinged gate panel. Local frame: hinge at x=0, panel extends +X by width w.
function gatePanel(w,R){const parts=[];const ys=[.16,.32,.48];for(const y of ys)box(parts,w-.04,.075,.04,w/2,y,0,COL.gate);
 box(parts,.06,.46,.035,.04,.32,0,COL.gateBrace);box(parts,.06,.46,.035,w-.04,.32,0,COL.gateBrace);
 const d=Math.hypot(w-.1,.32),ang=Math.atan2(.32,w-.1);box(parts,d,.05,.026,w/2,.32,.022,COL.gateBrace,0,ang);
 for(const y of [.18,.46])box(parts,.16,.03,.045,.08,y,0,COL.iron);// hinge straps
 box(parts,.1,.025,.05,w+.02,.4,0,COL.iron);// latch bar
 const ring=new THREE.TorusGeometry(.035,.009,4,8);ring.translate(w-.03,.4,.035);parts.push([ring,COL.iron]);
 return merge(parts);}
function makeGate(mat,w,R){const g=new THREE.Group();g.name='gate';const m=new THREE.Mesh(gatePanel(w,R),mat);m.castShadow=true;m.receiveShadow=true;g.add(m);g.userData.width=w;return g;}
export function createFence({kind='run',seed=1,scale=1,length=6}={}){const R=rng(seed*7919+11),root=new THREE.Group();root.name='fence';root.userData.kind=kind;
 const mat=makeFeltMaterial('#ffffff');const parts=[],gw=1.1;let gates=[];
 const pts=[];// post positions
 if(kind==='paddock'){const r=Math.max(1.6,length/2.6),n=Math.max(10,Math.round(Math.PI*2*r/1.0));const gap=gw/r;// gateway centred at +Z
  const start=Math.PI/2+gap/2,span=Math.PI*2-gap;for(let i=0;i<=n;i++){const a=start+span*i/n,rr=r*(1+(R()-.5)*.03);pts.push({x:Math.cos(a)*rr,z:Math.sin(a)*rr});}
  for(let i=0;i<pts.length;i++){const q=pts[i];post(parts,q.x,q.z,(i===0||i===pts.length-1)?H+.1:H+(R()-.5)*.05,0,R,-Math.atan2(q.z,q.x));}
  for(let i=0;i<pts.length-1;i++)segment(parts,pts[i],pts[i+1],R);
  {const pad=new THREE.CircleGeometry(.75,14);pad.scale(1,.6,1);pad.rotateX(-Math.PI/2);pad.translate(0,.006,r);parts.push([pad,'#9a8a62']);}// trodden gateway earth
  const hinge=pts[pts.length-1],latch=pts[0];{const dx=hinge.x-latch.x,dz=hinge.z-latch.z,l=Math.hypot(dx,dz),ry=-Math.atan2(dz,dx);box(parts,.05,.07,.12,latch.x+dx/l*.075,.4,latch.z+dz/l*.075,COL.iron,ry);}const gate=makeGate(mat,Math.hypot(latch.x-hinge.x,latch.z-hinge.z)-.1,R);gate.position.set(hinge.x+.05,0,hinge.z);gate.rotation.y=-Math.atan2(latch.z-hinge.z,latch.x-hinge.x);gate.userData.base=gate.rotation.y;gate.userData.dir=-1;gates.push(gate);root.userData.radius=r;}
 else{const L=Math.max(2,length),n=Math.max(2,Math.round(L/1.1));const step=L/n;
  for(let i=0;i<=n;i++)pts.push({x:-L/2+i*step,z:(R()-.5)*.04});
  if(kind==='gate'){// open the middle: shift posts around a gateway at x=0
   const left=pts.filter(p=>p.x<-gw/2-.05),right=pts.filter(p=>p.x>gw/2+.05);left.push({x:-gw/2,z:0});right.unshift({x:gw/2,z:0});
   for(const side of [left,right]){side.forEach((q,i)=>post(parts,q.x,q.z,(Math.abs(q.x)===gw/2)?H+.1:H+(R()-.5)*.05,0,R));for(let i=0;i<side.length-1;i++)segment(parts,side[i],side[i+1],R);}
   {const pad=new THREE.CircleGeometry(.7,14);pad.scale(1,.55,1);pad.rotateX(-Math.PI/2);pad.translate(0,.006,0);parts.push([pad,'#9a8a62']);}
   box(parts,.05,.07,.12,gw/2-.075,.4,0,COL.iron);box(parts,.03,.03,.14,gw/2-.11,.44,0,COL.iron);// latch keeper on latch post
   const gate=makeGate(mat,gw-.1,R);gate.position.set(-gw/2+.05,0,0);gate.userData.base=0;gate.userData.dir=-1;gates.push(gate);}
  else{pts.forEach(q=>post(parts,q.x,q.z,H+(R()-.5)*.05,0,R));for(let i=0;i<pts.length-1;i++)segment(parts,pts[i],pts[i+1],R);}
  root.userData.width=L;root.userData.depth=.4;}
 const body=new THREE.Mesh(merge(parts),mat);body.name='posts';body.castShadow=body.receiveShadow=true;root.add(body,...gates);
 Object.assign(root.userData,{gates,open:0,height:H+.1,ownedMaterial:mat});root.scale.setScalar(scale);return root;}
// action: 'open' | 'stop' (or truthy open flag). Gate swings ~100°, eased; posts never move.
export function updateFence(fence,dt,action='stop'){const want=(action==='open'||action===true||action===1)?1:0;const u=fence.userData;
 u.open+=(want-u.open)*Math.min(1,dt*3.2);if(Math.abs(want-u.open)<1e-3)u.open=want;
 const e=u.open*u.open*(3-2*u.open);for(const g of u.gates){g.rotation.y=g.userData.base+g.userData.dir*e*1.75;}return fence;}
