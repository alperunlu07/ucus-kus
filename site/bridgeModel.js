import * as THREE from 'three';
import {makeFeltMaterial} from './sheepModel.js';
// All models run along X. Origin: centre of water surface y=0.
// Decks are above water; foundations sink to y=-.22. End abutments meet banks.
// span is the nominal abutment-to-abutment distance; scale uniformly scales all axes.
export const BRIDGE_KINDS=Object.freeze(['road','rail','both']);
const POLISH=10;
const palette={stone:'#d8bea0',edge:'#e9d6b5',mortar:'#a68d73',road:'#ae9477',green:'#526f61',steel:'#3f5b53',rust:'#ba8360',water:'#86b6b3',foam:'#d2e1cf',wood:'#8c6a50',rail:'#53605c',bank:'#a5b98c'};
const mats=new Map();function mat(c){if(!mats.has(c)){const m=makeFeltMaterial(c);m.vertexColors=false;mats.set(c,m);}return mats.get(c);}
function mesh(g,geo,c,x=0,y=0,z=0){const m=new THREE.Mesh(geo,mat(c));m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;g.add(m);return m;}
function box(g,w,h,d,c,x=0,y=0,z=0){return mesh(g,new THREE.BoxGeometry(w,h,d),c,x,y,z);}
function beam(g,a,b,w,d,c){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),m=box(g,w,av.distanceTo(bv),d,c);m.position.copy(av.add(bv).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),bv.sub(new THREE.Vector3(...a)).normalize());return m;}
function shapeMesh(g,pts,depth,c,z){const s=new THREE.Shape();pts.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath();return mesh(g,new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:false,curveSegments:16}),c,0,0,z);}
function base(kind,seed,scale,span){const g=new THREE.Group();g.name=kind+'-bridge';g.userData={kind,seed,span,time:0,ripples:[]};
 box(g,9,.18,5.7,palette.water,0,-.09,0);
 for(const side of[-1,1]){box(g,3.0,.36,5.7,palette.bank,side*5.8,-.1,0);box(g,3,.07,5.7,'#c1cba2',side*5.8,.095,0);}
 if(POLISH>=6){for(const side of[-1,1]){box(g,.075,.09,5.7,'#cbbf9c',side*4.32,.018,0);box(g,.16,.012,5.7,'#78a9a7',side*4.2,.009,0);for(const z of[-2.32,2.3]){for(let j=0;j<4;j++){const x=side*(4.64+j*.11);shapeMesh(g,[[x-.055,.12],[x+.025,.12],[x+.05,.42+(j%3)*.1]],.025,j%2?'#718c62':'#8fa376',z+j*.055);}}}
 for(const z of[-2.78,2.78])box(g,8.55,.018,.035,'#a7cdbe',0,.008,z);}
 for(let i=0;i<14;i++){const x=Math.sin(i*4.1+seed)*3.8,z=((i*1.71)%5.2)-2.6;const r=box(g,.35+(i%3)*.19,.012,.042,palette.foam,x,.017,z);g.userData.ripples.push(r);}
 g.children.forEach(m=>m.userData.context=true);g.scale.setScalar(scale);g.scale.x*=span/11;return g;}
export function createRoadBridge({seed=17,scale=1,span=11}={}){const g=base('road',seed,scale,span);const D=2.42;
 // Three genuine open arch barrels: solid spandrel above a polygonal arch intrados.
 for(const cx of[-3.3,0,3.3]){const pts=[[cx-1.5,D],[cx+1.5,D],[cx+1.5,.54]];for(let j=1;j<=24;j++){const a=j/24*Math.PI;pts.push([cx+1.5*Math.cos(a),.54+1.43*Math.sin(a)]);}shapeMesh(g,pts,2.35,palette.stone,-1.175);}
 if(POLISH>=2){for(const z of[-1.245,1.175])for(const cx of[-3.3,0,3.3]){for(let i=0;i<13;i++){const a=i/13*Math.PI+.013,b=(i+1)/13*Math.PI-.013;const point=(t,r)=>[cx+(1.5+r)*Math.cos(t),.54+(1.43+r)*Math.sin(t)];shapeMesh(g,[point(a,0),point(b,0),point(b,.235),point(a,.235)],.07,i%3===0?'#cbb08d':palette.edge,z);}box(g,3.05,.017,.012,palette.mortar,cx,2.28,z+.035);for(let i=0;i<5;i++)box(g,.017,.12,.014,palette.mortar,cx-1.2+i*.6,2.35,z+.035);}
 for(const x of[-4.95,-1.65,1.65,4.95])for(const z of[-1.31,1.3])for(const y of[.22,.55,.88])box(g,.47,.018,.012,palette.mortar,x,y,z);}
 for(const x of[-4.95,-1.65,1.65,4.95]){box(g,.48,1.45,2.6,palette.stone,x,.52,0);box(g,.72,.2,2.85,palette.mortar,x,-.12,0);}
 box(g,11.3,.24,2.75,palette.edge,0,D+.05,0);box(g,12.9,.09,2.18,palette.road,0,D+.215,0);
 for(const side of[-1,1]){box(g,11.5,.12,.13,palette.mortar,0,D+.92,side*1.32);for(let x=-5.4;x<=5.4;x+=.9)box(g,.11,.67,.12,palette.edge,x,D+.56,side*1.32);}
 if(POLISH>=9){for(const side of[-1,1]){box(g,11.25,.025,.022,palette.mortar,0,D-.035,side*1.381);for(let x=-5.2;x<5.3;x+=.36)box(g,.065,.018,.026,palette.edge,x,D-.035,side*1.398);}}
 if(POLISH>=7){for(const side of[-1,1]){for(const x of[-5.5,5.5]){for(const y of[.35,.85,1.35,1.85])box(g,1.14,.018,.014,palette.mortar,x,y,side*1.406);for(const y of[.6,1.1,1.6,2.1])box(g,.018,.46,.014,palette.mortar,x+(y>1?.22:-.22),y,side*1.407);box(g,.28,.83,.28,palette.stone,x,D+.52,side*1.32);box(g,.37,.09,.36,palette.edge,x,D+.98,side*1.32);}
 for(const x of[-1.65,1.65]){const foot=new THREE.Shape();foot.moveTo(x-.24,-side*1.29);foot.lineTo(x+.24,-side*1.29);foot.lineTo(x,-side*1.86);foot.closePath();const f=mesh(g,new THREE.ExtrudeGeometry(foot,{depth:.77,bevelEnabled:false}),palette.stone,0,.015,0);f.rotation.x=-Math.PI/2;}}
 box(g,.5,.18,.045,palette.green,0,2.26,1.258);for(const x of[-.16,0,.16])box(g,.055,.018,.012,palette.edge,x,2.26,1.286);}
 if(POLISH>=3){for(const side of[-1,1]){box(g,11.8,.07,.26,palette.edge,0,D+.24,side*1.1);for(let x=-5.7;x<5.8;x+=.48)box(g,.016,.012,.22,palette.mortar,x,D+.28,side*1.1);}
 for(let x=-5.75;x<6;x+=1.05)box(g,.43,.009,.065,'#e5d6b4',x,D+.264,0);
 for(const [x,z] of[[-4.95,-1.29],[4.95,1.29]]){box(g,.25,.16,.25,palette.mortar,x,D+.32,z);box(g,.065,1.38,.065,palette.steel,x,D+1,z);box(g,.24,.31,.24,'#ead79e',x,D+1.8,z);for(const a of[-1,1])for(const b of[-1,1])box(g,.025,.34,.025,palette.steel,x+a*.117,D+1.8,z+b*.117);const roof=mesh(g,new THREE.ConeGeometry(.225,.15,4),palette.green,x,D+2.03,z);roof.rotation.y=Math.PI/4;box(g,.29,.045,.29,palette.steel,x,D+1.62,z);}}
 for(const x of[-5.5,5.5])box(g,1.15,2.56,2.8,palette.stone,x,1.06,0);
 return g;}
export function createRailBridge({seed=31,scale=1,span=11}={}){const g=base('rail',seed,scale,span),D=2.45;
 for(const x of[-4.9,0,4.9]){shapeMesh(g,[[x-.52,-.22],[x+.52,-.22],[x+.33,2.25],[x-.33,2.25]],2.15,palette.mortar,-1.075);box(g,.92,.2,2.45,palette.edge,x,2.24,0);box(g,1.05,.2,2.6,palette.stone,x,-.13,0);}
 box(g,11.6,.22,2.65,palette.green,0,D-.1,0);
 for(const side of[-1,1]){box(g,11.5,.16,.16,palette.steel,0,D+.07,side*1.13);box(g,11.5,.15,.17,palette.green,0,D+1.35,side*1.13);for(let x=-5.5;x<5.5;x+=1.1){beam(g,[x,D+.1,side*1.13],[x+1.1,D+1.32,side*1.13],.11,.12,palette.green);beam(g,[x,D+.1,side*1.13],[x,D+1.35,side*1.13],.1,.12,palette.green);}}
 if(POLISH>=4){for(const side of[-1,1]){for(const y of[D-.29,D-.08])box(g,11.65,.065,.29,palette.green,0,y,side*1.15);box(g,11.5,.16,.07,palette.steel,0,D-.18,side*1.15);
 for(let x=-5.5;x<=5.51;x+=1.1){for(const y of[D+.13,D+1.28]){shapeMesh(g,[[x-.16,y-.1],[x+.16,y-.1],[x,y+.18]],.035,palette.steel,side>0?1.2:-1.235);const rivet=mesh(g,new THREE.CylinderGeometry(.025,.025,.012,6),palette.rust,x,y,side*1.245);rivet.rotation.x=Math.PI/2;}}}
 for(let x=-5.5;x<5.6;x+=1.1)box(g,.15,.18,2.65,palette.steel,x,D-.32,0);}
 for(let x=-5.5;x<=5.5;x+=.34)box(g,.13,.1,1.85,palette.wood,x,D+.07,0);
 for(const z of[-.57,.57])box(g,11.8,.14,.085,palette.rail,0,D+.17,z);
 if(POLISH>=10){for(const x of[-5.65,5.65])for(const side of[-1,1]){for(const y of[.45,.95,1.45,1.95])box(g,1.09,.017,.014,palette.mortar,x,y,side*1.358);box(g,.34,.34,.055,'#d9b776',x,2.02,side*1.4);for(const dx of[-.075,.075]){const stripe=box(g,.045,.29,.015,palette.steel,x+dx,2.02,side*1.436);stripe.rotation.z=-.38;}}}
 if(POLISH>=5){for(const z of[-.57,.57]){box(g,11.8,.04,.17,'#9ca8a0',0,D+.25,z);box(g,11.8,.03,.15,palette.steel,0,D+.105,z);}
 for(const x of[-4.9,0,4.9]){for(const z of[-.93,.93]){box(g,.42,.12,.36,palette.steel,x,2.37,z);box(g,.52,.045,.45,palette.rust,x,2.29,z);}for(const y of[.36,.85,1.34,1.83])box(g,.72+(2.25-y)*.12,.022,2.168,'#927e68',x,y,0);}
 for(const side of[-1,1]){box(g,11.7,.055,.2,palette.wood,0,D+.035,side*1.38);for(let x=-5.5;x<5.6;x+=.55)box(g,.017,.012,.2,palette.mortar,x,D+.068,side*1.38);}}
 for(const x of[-5.65,5.65])box(g,1.1,2.4,2.7,palette.stone,x,1.0,0);
 return g;}
export function createBridges(options={}){const g=new THREE.Group(),a=createRoadBridge(options),b=createRailBridge(options);a.position.z=3.55;b.position.z=-3.55;g.add(a,b);return g;}
export function updateBridge(obj,dt,action=false){if(!action)return;obj.traverse(g=>{if(!g.userData.ripples)return;g.userData.time+=Math.min(dt,.1);for(let i=0;i<g.userData.ripples.length;i++)g.userData.ripples[i].scale.x=1+.12*Math.sin(g.userData.time*.7+i);});}
