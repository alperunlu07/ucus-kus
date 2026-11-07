// Paper adults. +Y up, facing +Z; resting soles at y=0. All options deterministic.
import * as THREE from 'three';
const palette=[['#cf8268','#526d78','#e2af84','#544334'],['#e0b658','#647965','#ad7756','#3e3933'],['#70a3a4','#a47c63','#eac19b','#725443']];
const materials=new Map();
function mat(color){if(materials.has(color))return materials.get(color);const m=new THREE.MeshLambertMaterial({color});m.onBeforeCompile=s=>{s.vertexShader='varying vec3 vPaper;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvPaper=position;');s.fragmentShader='varying vec3 vPaper;\n'+s.fragmentShader;s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
float g=fract(sin(dot(floor(vPaper*190.),vec3(12.9898,78.233,37.719)))*43758.5453)-.5;
float aa=1.-smoothstep(.2,1.5,length(fwidth(vPaper*190.)));
diffuseColor.rgb*=1.+g*.075*aa;`);};m.customProgramCacheKey=()=> 'adult-paper-1';materials.set(color,m);return m;}
function mesh(p,g,c,x=0,y=0,z=0){const o=new THREE.Mesh(g,typeof c==='string'?mat(c):c);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;p.add(o);return o;}
function box(p,c,x,y,z,w,h,d){return mesh(p,new THREE.BoxGeometry(w,h,d),c,x,y,z);}
function cut(p,points,depth,c,x=0,y=0,z=0,bevel=.018){const shape=new THREE.Shape();points.forEach(([a,b],i)=>i?shape.lineTo(a,b):shape.moveTo(a,b));shape.closePath();const g=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:bevel>0,bevelThickness:bevel,bevelSize:bevel,bevelSegments:1,steps:1});g.translate(0,0,-depth/2);return mesh(p,g,c,x,y,z);}
function rod(p,c,a,b,r=.018){const d=new THREE.Vector3(...b).sub(new THREE.Vector3(...a));const o=mesh(p,new THREE.CylinderGeometry(r*.8,r,d.length(),6),c,...a);o.position.addScaledVector(d,.5);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());return o;}
function limb(p,x,y,len,width,c,skin,leg=false){const pivot=new THREE.Group();pivot.position.set(x,y,0);p.add(pivot);cut(pivot,[[-width/2,0],[width/2,0],[width*.45,-len],[-width*.45,-len]],width*.85,c);const end=new THREE.Group();end.position.y=-len;pivot.add(end);cut(end,[[-width*.44,.015],[width*.44,.015],[width*.36,-len*.86],[-width*.36,-len*.86]],width*.77,leg?c:skin);if(leg){const foot=cut(end,[[-width*.51,-len*.88],[width*.51,-len*.88],[width*.57,-len*1.04],[-width*.57,-len*1.04]],width*1.7,'#574b3e',0,0,.06);foot.position.y=.015;}return {pivot,end,len};}
export function createPerson({seed=0,kind='walker',scale=1}={}){const p=palette[((seed%3)+3)%3],root=new THREE.Group(),rig=new THREE.Group();root.add(rig);const shirt=kind==='fisher'?'#769589':p[0],pants=kind==='fisher'?'#596773':p[1];
cut(rig,[[-.27,1.12],[.27,1.12],[.29,1.71],[.19,1.83],[-.19,1.83],[-.29,1.71]],.32,shirt);
box(rig,pants,0,1.1,0,.45,.24,.30);box(rig,p[2],0,1.87,0,.16,.18,.16);
const head=new THREE.Group();head.position.set(0,2.14,.015);rig.add(head);
cut(head,[[-.17,-.25],[.17,-.25],[.245,-.13],[.235,.18],[.12,.27],[-.13,.27],[-.24,.15],[-.245,-.12]],.33,p[2],0,0,0,.06);
cut(head,[[-.245,-.02],[-.245,.19],[-.13,.29],[.13,.29],[.25,.17],[.235,.05],[.08,.16],[-.1,.12],[-.18,.02]],.46,p[3],0,.035,-.018,.018);
for(const s of [-1,1]){box(head,p[2],s*.26,-.045,0,.065,.12,.12);box(head,'#493f38',s*.086,-.005,.24,.025,.035,.012);}
cut(head,[[-.024,-.02],[.027,-.02],[.034,-.083],[-.027,-.083]],.038,p[2],0,0,.25,.005);
for(const sign of [-1,1])rod(head,p[3],[sign*.086-.033,.065,.24],[sign*.086+.033,.071,.24],.008);
const smile=new THREE.QuadraticBezierCurve3(new THREE.Vector3(-.052,-.13,.24),new THREE.Vector3(0,-.17,.245),new THREE.Vector3(.052,-.13,.24));mesh(head,new THREE.TubeGeometry(smile,8,.007,3,false),'#865e4a');
// Pass 8: intentional rear hair, mature silver temples and folded shoe soles.
cut(head,[[-.23,.18],[.23,.18],[.22,-.12],[.12,-.17],[-.14,-.17],[-.23,-.10]],.02,p[3],0,0,-.226,.01);
if(kind==='fisher'){for(const sign of [-1,1])box(head,'#b8ae94',sign*.246,.025,.02,.026,.13,.21);}

const arms=[limb(rig,-.345,1.72,.33,.16,shirt,p[2]),limb(rig,.345,1.72,.33,.16,shirt,p[2])],legs=[limb(rig,-.14,.9822,.48,.18,pants,p[2],true),limb(rig,.14,.9822,.48,.18,pants,p[2],true)];
// Pass 2: tailored lapels and warm paper shirt placket.
for(const sign of [-1,1])cut(rig,[[sign*.025,1.84],[sign*.18,1.79],[sign*.08,1.65]],.014,'#eadcbd',0,0,.18,.003);
box(rig,'#b7a98c',0,1.46,.181,.016,.34,.01);
for(let j=0;j<3;j++)box(rig,'#eee0c4',0,1.59-j*.105,.195,.027,.027,.012);
// Pass 4: stitched work pocket, belt and sleeve hems.
box(rig,shirt,.15,1.53,.192,.13,.15,.024);box(rig,'#eadcbd',.15,1.59,.21,.12,.018,.01);
box(rig,'#78654e',0,1.14,.17,.48,.047,.025);box(rig,'#d4bd87',.025,1.14,.19,.065,.06,.014);
for(const leg of legs){box(leg.end,'#d3c4a0',0,-.48,.06,.21,.025,.33);for(let j=0;j<2;j++)box(leg.end,'#b7a88b',0,-.406,.12+j*.05,.10,.012,.014);}
for(const arm of arms)box(arm.pivot,'#d8c9a6',0,-.31,0,.17,.045,.15);
rod(rig,'#8c8870',[-.23,1.65,-.183],[.23,1.65,-.183],.006);
for(const sign of [-1,1])rod(rig,'#8c8870',[sign*.21,1.2,-.183],[sign*.24,1.37,-.183],.005);
// Pass 5: one market basket, attached to the animated wrist.
if(kind==='walker'&&seed%3===1){const basket=new THREE.Group();basket.position.set(-.12,-.47,.04);arms[0].end.add(basket);
box(basket,'#ae8552',0,-.18,0,.37,.04,.26);
for(const z of [-.14,.14])box(basket,'#c49d64',0,-.08,z,.4,.23,.025);
for(const x of [-.19,.19])box(basket,'#b58a55',x,-.08,0,.025,.23,.28);
for(let j=0;j<3;j++)for(const z of [-.156,.156])box(basket,'#967447',0,-.15+j*.065,z,.40,.012,.012);
const curve=new THREE.QuadraticBezierCurve3(new THREE.Vector3(-.18,.04,0),new THREE.Vector3(0,.40,0),new THREE.Vector3(.18,.04,0));mesh(basket,new THREE.TubeGeometry(curve,12,.018,4,false),'#937248');}
// Pass 10: low-contrast folded shirt facets, exact resting soles, two-tone float.
cut(rig,[[.08,1.21],[.24,1.22],[.25,1.44]],.003,new THREE.MeshLambertMaterial({color:new THREE.Color(shirt).multiplyScalar(.94)}),0,0,.18,0);
root.userData.person={rig,head,arms,legs,seed,kind,time:0,p,shirt,pants};root.scale.setScalar(scale);
if(kind==='fisher'){
const hat=mesh(head,new THREE.CylinderGeometry(.34,.35,.045,9),'#d2b575',0,.31,0);mesh(head,new THREE.CylinderGeometry(.22,.26,.19,8),'#d8be82',0,.42,-.01);
mesh(head,new THREE.CylinderGeometry(.235,.26,.043,8),'#967653',0,.35,-.01);
const fishing=new THREE.Group();fishing.position.set(.04,1.30,.32);rig.add(fishing);rod(fishing,'#806349',[0,0,0],[.07,1.6,1.34],.022);
rod(fishing,'#c8a16a',[0,-.10,-.084],[.012,.26,.218],.035);
const reel=mesh(fishing,new THREE.CylinderGeometry(.065,.065,.065,8),'#6b7163',-.05,.08,.065);reel.rotation.z=Math.PI/2;rod(fishing,'#ddc28e',[-.09,.08,.065],[-.09,.08,.15],.014);
const bobber=mesh(root,new THREE.CylinderGeometry(.05,.04,.13,6),'#d48264',.41,.045,2.2);mesh(bobber,new THREE.CylinderGeometry(.051,.051,.035,6),'#efe2bb',0,.043,0);rod(bobber,'#785f43',[0,.06,0],[0,.13,0],.008);const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3(),new THREE.Vector3()]),new THREE.LineBasicMaterial({color:'#695f4d'}));root.add(line);root.userData.person.fishing=fishing;root.userData.person.bobber=bobber;root.userData.person.line=line;
}
updatePerson(root,0,'stop');return root;}
export function createWalkers({seed=0,count=3,scale=1}={}){const g=new THREE.Group();for(let i=0;i<count;i++){const o=createPerson({seed:seed+i,scale});o.position.set((i-(count-1)/2)*1.35,0,(i%2)*.48);o.rotation.y=-.32+(i%2)*.52;o.userData.person.home=o.position.clone();g.add(o);}return g;}
export function createFisher({seed=2,scale=1}={}){return createPerson({seed,kind:'fisher',scale});}
// Two-bone paper fold solver, with a forward knee and planted stance foot.
function aimFold(limb,target,lower){const delta=target.clone().sub(limb.pivot.position),distance=Math.min(delta.length(),limb.len+lower-.002),dir=delta.normalize(),a=(limb.len**2-lower**2+distance**2)/(2*distance),bend=new THREE.Vector3(0,0,1).addScaledVector(dir,-dir.z).normalize(),elbow=dir.clone().multiplyScalar(a).addScaledVector(bend,Math.sqrt(Math.max(0,limb.len**2-a*a)));limb.pivot.quaternion.setFromUnitVectors(new THREE.Vector3(0,-1,0),elbow.clone().normalize());const forearm=dir.multiplyScalar(distance).sub(elbow).normalize().applyQuaternion(limb.pivot.quaternion.clone().invert());limb.end.quaternion.setFromUnitVectors(new THREE.Vector3(0,-1,0),forearm);}
export function updatePerson(obj,dt=0,action='walk'){const d=obj.userData.person;if(!d)return;const active=action==='walk'||action===1;if(active)d.time+=Math.min(dt,.05);const t=d.time,q=t*4.1+d.seed*1.8;
d.rig.position.y=0;d.rig.rotation.z=active?Math.sin(q)*.015:0;
for(let i=0;i<2;i++){const wave=Math.sin(q+i*Math.PI),L=d.legs[i],A=d.arms[i];L.pivot.rotation.x=active&&d.kind==='walker'?wave*.38:0;L.end.rotation.x=active&&d.kind==='walker'?Math.max(0,-wave)*.45:0;A.pivot.rotation.set(active?-wave*.27:0,0,(i?1:-1)*.10);A.end.rotation.x=-.14;}
// Pass 6: step cycle has a planted stance and an elevated recovery, not sliding rods.
if(active&&d.kind==='walker'){d.rig.position.y=-.055;for(let i=0;i<2;i++){const phase=((q+i*Math.PI)%(Math.PI*2)+Math.PI*2)%(Math.PI*2),u=(phase%Math.PI)/Math.PI,stance=phase<Math.PI;aimFold(d.legs[i],new THREE.Vector3(d.legs[i].pivot.position.x,.08+(stance?0:Math.sin(u*Math.PI)*.16),(stance?1-2*u:-1+2*u)*.24),.48);}}
if(d.kind==='fisher'){aimFold(d.arms[1],new THREE.Vector3(.044,1.39,.395),.284);aimFold(d.arms[0],new THREE.Vector3(-.02,1.34,.29),.284);d.rig.rotation.z=active?Math.sin(t*1.4)*.018:0;d.bobber.position.y=.045+(active?Math.sin(t*2)*.018:0);obj.updateMatrixWorld(true);const tip=obj.worldToLocal(d.fishing.localToWorld(new THREE.Vector3(.07,1.6,1.34))),b=d.bobber.position,attr=d.line.geometry.attributes.position;attr.setXYZ(0,tip.x,tip.y,tip.z);attr.setXYZ(1,(tip.x+b.x)/2,(tip.y+b.y)/2-.07,(tip.z+b.z)/2);attr.setXYZ(2,b.x,b.y+.07,b.z);attr.needsUpdate=true;d.line.geometry.computeBoundingSphere();}}
export function updatePeople(obj,dt=0,action='walk'){obj.traverse(o=>{if(o.userData.person){updatePerson(o,dt,action);const d=o.userData.person;if(d.home&&(action==='walk'||action===1)){const u=d.time*.35+d.seed*.10-Math.PI/2;o.position.x=d.home.x+.16*Math.sin(u);o.position.z=d.home.z+.28*Math.cos(u);o.rotation.y=Math.atan2(.16*Math.cos(u),-.28*Math.sin(u));}}});}
