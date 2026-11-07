// Kağıt Kuş · reusable paper children. +Y up, face +Z, soles at zero.
import * as THREE from 'three';
const TAU=Math.PI*2;
const palette=[['#e78b61','#455f72','#edbe91','#463a32'],['#e2bd59','#66755b','#a86b49','#302c2a'],['#7babb1','#ac7865','#e5ad82','#5c3d2e'],['#b18faa','#6d7884','#c68d63','#382d27'],['#91a76e','#ba715b','#f1c9a0','#a36c38'],['#dd937c','#517b82','#865339','#252c29']];
const mat=c=>{const m=new THREE.MeshLambertMaterial({color:c});m.onBeforeCompile=s=>{s.vertexShader='varying vec3 vPaper;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvPaper=position;');s.fragmentShader='varying vec3 vPaper;\n'+s.fragmentShader;s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
 float grain=fract(sin(dot(floor(vPaper*240.0),vec3(12.9898,78.233,37.719)))*43758.5453)-.5;
 float aa=1.0-smoothstep(.2,1.5,length(fwidth(vPaper*240.0)));
 diffuseColor.rgb*=1.0+grain*.065*aa;`);};m.customProgramCacheKey=()=> 'kid-paper-5';return m;};
function mesh(parent,g,m,x=0,y=0,z=0){const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;parent.add(o);return o;}
function oval(parent,m,x,y,z,sx,sy,sz,detail=1){const o=mesh(parent,new THREE.IcosahedronGeometry(1,detail),m,x,y,z);o.scale.set(sx,sy,sz);return o;}
function box(parent,m,x,y,z,w,h,d){return mesh(parent,new THREE.BoxGeometry(w,h,d),m,x,y,z);}
function rod(parent,m,a,b,r=.025){const d=new THREE.Vector3(...b).sub(new THREE.Vector3(...a));const o=mesh(parent,new THREE.CylinderGeometry(r,r,d.length(),6),m,...a);o.position.addScaledVector(d,.5);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());return o;}
function limb(parent,x,y,upper,lower,width,cloth,skin,isLeg=false){const pivot=new THREE.Group();pivot.position.set(x,y,0);parent.add(pivot);const top=mesh(pivot,new THREE.CylinderGeometry(width,width*.88,upper,7),cloth,0,-upper*.5,0);const joint=new THREE.Group();joint.position.y=-upper;pivot.add(joint);mesh(joint,new THREE.CylinderGeometry(width*.85,width*.7,lower,7),skin,0,-lower*.5,0);let tip;if(isLeg){tip=new THREE.Group();tip.position.set(0,-lower,.065);joint.add(tip);oval(tip,mat('#ede2c7'),0,0,0,.12,.065,.19);}else tip=oval(joint,skin,0,-lower,0,.078,.095,.07);return {pivot,joint,tip,top,upper,lower};}
export function createKid(options={}){const id=options.seed??0,p=palette[((id%palette.length)+palette.length)%palette.length];const root=new THREE.Group(),rig=new THREE.Group();root.add(rig);const skin=mat(options.skin||p[2]),shirt=mat(options.shirt||p[0]),pants=mat(p[1]),hair=mat(p[3]);
 const body=mesh(rig,new THREE.CylinderGeometry(.235,.31,.58,7),shirt,0,1.12,0);body.scale.z=.67;
 box(rig,pants,0,.78,0,.43,.25,.29);
 const head=new THREE.Group();head.position.set(0,1.72,.015);rig.add(head);oval(head,skin,0,0,0,.32,.345,.285,2);oval(head,skin,-.315,-.015,0,.065,.093,.062);oval(head,skin,.315,-.015,0,.065,.093,.062);
 mesh(rig,new THREE.CylinderGeometry(.10,.11,.15,7),skin,0,1.46,0);
 const arms=[limb(rig,-.295,1.36,.27,.25,.082,shirt,skin),limb(rig,.295,1.36,.27,.25,.082,shirt,skin)];
 const legs=[limb(rig,-.14,.70,.32,.31,.094,pants,skin,true),limb(rig,.14,.70,.32,.31,.094,pants,skin,true)];
 const d={rig,head,body,arms,legs,id,p,skin,shirt,pants,hair,phase:id*1.7};root.userData.kid=d;decorateKid(root,d);root.scale.setScalar(options.scale??1.16);return root;
}
function decorateKid(k,d){
 // 02 · layered cut-paper face: tiny eyes, cheeks, nose, open friendly smile.
 const ink=mat('#493c36'),blush=mat('#dc9778');
 for(const side of [-1,1]){oval(d.head,ink,side*.108,.035,.268,.023,.034,.012,1);oval(d.head,blush,side*.171,-.065,.235,.049,.027,.009,1);}
 oval(d.head,d.skin,0,-.023,.285,.039,.048,.035,1);
 const smile=new THREE.QuadraticBezierCurve3(new THREE.Vector3(-.072,-.085,.272),new THREE.Vector3(0,-.143,.293),new THREE.Vector3(.072,-.085,.272));mesh(d.head,new THREE.TubeGeometry(smile,12,.009,4,false),ink);
 // 03 · folded fringe, curly crown, or tied paper pigtails; no generic cap.
 const cap=mesh(d.head,new THREE.SphereGeometry(.333,10,6,0,TAU,0,1.43),d.hair,0,.008,-.017);cap.scale.set(1,1.08,.9);
 const style=d.id%3;
 for(let j=0;j<4;j++){const x=(j-1.5)*.115;const lock=oval(d.head,d.hair,x,.192-Math.abs(x)*.13,.213,.093,.108,.046,0);lock.rotation.z=-.35+(j*.12);}
 if(style===1)for(let j=0;j<5;j++)oval(d.head,d.hair,Math.sin(j*1.3)*.22,.29+Math.cos(j*1.3)*.04,Math.cos(j*1.3)*.14,.105,.11,.10,1);
 if(style===2)for(const side of [-1,1]){oval(d.head,d.hair,side*.326,.005,-.10,.12,.165,.115,1);oval(d.head,mat('#e9b54e'),side*.318,.036,-.035,.065,.034,.066,0);}
 // 04 · connected shoulder/elbow/knee pivots, mitten thumbs, shoe uppers.
 for(const A of d.arms){oval(A.pivot,d.shirt,0,-.025,0,.088,.085,.085,1);oval(A.joint,d.skin,0,0,0,.071,.073,.071,1);oval(A.joint,d.skin,.052,-A.lower+.025,.028,.032,.049,.036,1);}
 for(const L of d.legs){oval(L.joint,d.skin,0,0,0,.079,.08,.079,1);oval(L.tip,mat(d.p[1]),0,.012,-.012,.106,.062,.154,1);}
 // 05 · folded paper collar, appliqué pocket, sleeve cuffs and shirt creases.
 const cream=mat('#f2e4c7'),edge=mat(new THREE.Color(d.p[0]).multiplyScalar(.86));
 for(const side of [-1,1]){const shape=new THREE.Shape();shape.moveTo(side*.035,1.44);shape.lineTo(side*.155,1.395);shape.lineTo(side*.075,1.30);shape.closePath();mesh(d.rig,new THREE.ShapeGeometry(shape),cream,0,0,.157);}
 box(d.rig,edge,.117,1.12,.171,.108,.118,.014);box(d.rig,d.shirt,.117,1.13,.184,.088,.093,.014);
 for(const side of [-1,1])rod(d.rig,edge,[side*.18,.87,.16],[side*.20,.98,.14],.007);
 for(const A of d.arms)mesh(A.pivot,new THREE.CylinderGeometry(.083,.084,.035,7),edge,0,-A.upper+.012,0);
 for(const L of d.legs)mesh(L.pivot,new THREE.CylinderGeometry(.092,.093,.028,7),d.pants,0,-L.upper+.01,0);
 // POLISH DETAILS
}
export function updateKid(k,activity='idle',dt=0,time){const d=k.userData.kid;if(!d)return;d.time=time??((d.time||0)+dt);const t=d.time,q=t*6.3+d.phase;let run=activity==='run'||activity==='tag',walk=run||activity==='walk'||activity==='ring';
 d.rig.rotation.x=0;d.body.rotation.x=run?.08:0;d.rig.position.y=walk?Math.abs(Math.sin(q))*(run?.075:.025):Math.sin(t*2+d.phase)*.007;d.rig.rotation.z=run?.04*Math.sin(q):0;d.head.rotation.set(0,Math.sin(t*.8+d.phase)*.10,Math.sin(t*1.5+d.phase)*.035);
 for(let i=0;i<2;i++){const s=i?1:-1,A=d.arms[i],L=d.legs[i],swing=Math.sin(q+i*Math.PI);A.pivot.rotation.set(walk?-swing*(run?.9:.5):.05,0,s*.10);A.joint.rotation.set(run?-1.05:-.12,0,0);L.pivot.rotation.set(walk?swing*(run?.8:.44):0,0,0);L.joint.rotation.set(walk?Math.max(0,-swing)*(run?1.1:.6):.02,0,0);L.tip.rotation.set(0,0,0);}
 if(activity==='ball'){d.arms[0].pivot.rotation.x=-.35;d.arms[1].pivot.rotation.x=-.5;d.legs[1].pivot.rotation.x=-Math.max(0,Math.sin(t*2.5))*.8;}
 if(activity==='ring')for(let i=0;i<2;i++){d.arms[i].pivot.rotation.z=(i?1:-1)*1.2;d.arms[i].joint.rotation.x=-.1;}
 if(activity==='kite'){d.arms[1].pivot.rotation.x=-1.5;d.arms[1].joint.rotation.x=-.45;d.arms[0].pivot.rotation.x=-.5;}
 // 04 · feet fold naturally below the shin; elbows never behave as rigid bars.
 for(const L of d.legs)L.tip.rotation.x=walk?-.18*Math.sin(q):0;
 // 06 · foot strike coincides with the pass endpoint; watcher claps, no foot sliding.
 if(activity==='ball'){const kick=d.ballKick||0;if(d.ballRole!==1){const foot=d.ballRole===2?0:1;d.legs[foot].pivot.rotation.x=-kick*.95;d.legs[foot].joint.rotation.x=.08+kick*.14;d.arms[1-foot].pivot.rotation.x=kick*.3;d.rig.rotation.x=-kick*.07;}else{for(let i=0;i<2;i++){d.arms[i].pivot.rotation.x=-1.05;d.arms[i].pivot.rotation.z=(i?1:-1)*-.35;d.arms[i].joint.rotation.x=-.9-.2*Math.sin(t*5);}}}
 // 07 · ring dancers side-step rather than running forwards into the circle.
 if(activity==='ring'){d.rig.rotation.z=.035*Math.sin(q);for(let i=0;i<2;i++){d.legs[i].pivot.rotation.x=.08;d.legs[i].pivot.rotation.z=.17*Math.sin(q+i*Math.PI);d.legs[i].joint.rotation.x=.12+Math.max(0,Math.sin(q+i*Math.PI))*.2;}}
 // 08 · planted stance / lifted recovery, stride tied to chase path speed.
 if(run){d.rig.position.y=-.07+.025*Math.abs(Math.sin(q));d.rig.rotation.z=0;const stride=(d.pathSpeed||.95)/(4*1.16);for(let i=0;i<2;i++){const L=d.legs[i],phase=((q+i*Math.PI)%TAU+TAU)%TAU,stance=phase<Math.PI,u=(phase%Math.PI)/Math.PI,z=(stance?1-2*u:-1+2*u)*stride,y=.065-d.rig.position.y+(stance?0:Math.sin(u*Math.PI)*.15);aimArm(L,new THREE.Vector3(L.pivot.position.x,y,z));L.tip.quaternion.copy(L.pivot.quaternion).multiply(L.joint.quaternion).invert();}d.head.rotation.y+=d.id%2?-.18:.16;}
 // MOTION POLISH
}
function ball(){const g=new THREE.Group(),geo=new THREE.IcosahedronGeometry(.24,1),p=geo.attributes.position,colors=[];const shades=['#edb85b','#f7e9ca','#629ca6'];for(let i=0;i<p.count;i++){const c=new THREE.Color(shades[Math.floor(i/3)%3]);colors.push(c.r,c.g,c.b);}geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));const m=mat('#ffffff');m.vertexColors=true;mesh(g,geo,m);return g;}
export function createKidActivityGroup(activity='ball',options={}){const g=new THREE.Group(),kids=[],props=new THREE.Group();g.add(props);let n=activity==='ring'?6:activity==='tag'?2:activity==='kite'?1:3;for(let i=0;i<n;i++){const k=createKid({seed:i+(options.seed||0)});g.add(k);kids.push(k);}const d={activity,kids,props,time:0};g.userData.activity=d;
 if(activity==='ball'){d.ball=ball();props.add(d.ball);}
 if(activity==='kite'){
 const kite=new THREE.Group(),corners=[[0,.8,0],[.55,0,0],[0,-.65,0],[-.55,0,0]],colors=['#e7a052','#e7c567','#76a4a4','#d28066'];
 for(let i=0;i<4;i++){const geo=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,.055),new THREE.Vector3(...corners[i]),new THREE.Vector3(...corners[(i+1)%4])]);geo.computeVertexNormals();const m=mat(colors[i]);m.side=THREE.DoubleSide;mesh(kite,geo,m);}
 const bamboo=mat('#eedbb5');rod(kite,bamboo,[0,.8,.016],[0,-.65,.016],.012);rod(kite,bamboo,[-.55,0,.016],[.55,0,.016],.010);
 const tail=new THREE.Line(new THREE.BufferGeometry().setFromPoints(Array.from({length:20},(_,i)=>new THREE.Vector3(0,-.65-i*.065,0))),new THREE.LineBasicMaterial({color:'#9e7962'}));kite.add(tail);d.tail=tail;d.bows=[];
 for(let i=0;i<4;i++){const bow=new THREE.Group();for(const sign of [-1,1]){const shape=new THREE.Shape();shape.moveTo(0,0);shape.lineTo(sign*.105,.06);shape.lineTo(sign*.105,-.06);shape.closePath();const m=mat(colors[i]);m.side=THREE.DoubleSide;mesh(bow,new THREE.ShapeGeometry(shape),m);}kite.add(bow);d.bows.push(bow);}
 props.add(kite);d.kite=kite;const geo=new THREE.BufferGeometry().setFromPoints(Array.from({length:25},()=>new THREE.Vector3()));d.string=new THREE.Line(geo,new THREE.LineBasicMaterial({color:'#79654a'}));props.add(d.string);
 d.spool=new THREE.Group();const reel=mesh(d.spool,new THREE.CylinderGeometry(.075,.075,.17,8),mat('#c99461'));reel.rotation.z=Math.PI/2;for(const x of [-.09,.09]){const end=mesh(d.spool,new THREE.CylinderGeometry(.095,.095,.025,8),bamboo,x,0,0);end.rotation.z=Math.PI/2;}props.add(d.spool);
 }
 updateKidActivityGroup(g,0,0);return g;
}
export function updateKidActivityGroup(g,dt,time){const d=g.userData.activity;if(!d)return;d.time=time??d.time+dt;const t=d.time;
 d.kids.forEach((k,i)=>{if(d.activity==='ring'){const a=i/d.kids.length*TAU+t*.3;k.position.set(Math.sin(a)*1.62,0,Math.cos(a)*1.62);k.rotation.y=a+Math.PI;}
 else if(d.activity==='tag'){const a=t*.6+i*1.3;k.userData.kid.pathSpeed=.6*Math.hypot(Math.cos(a)*1.9,Math.sin(a)*1.2);k.position.set(Math.sin(a)*1.9,0,Math.cos(a)*1.2);k.rotation.y=Math.atan2(Math.cos(a)*1.9,-Math.sin(a)*1.2);}
 else if(d.activity==='ball'){k.position.set(i===1?.8:(i-1)*1.5,0,i===1?1.65:0);k.rotation.y=i===0?1.1:i===2?-1.1:Math.PI;const contact=((t-(i===2?1.6:0))%3.2+3.2)%3.2;k.userData.kid.ballKick=i===1?0:Math.exp(-Math.pow(Math.min(contact,3.2-contact)/.19,2));k.userData.kid.ballRole=i;}
 else{k.position.set(0,0,0);k.rotation.y=-.3;}
 updateKid(k,d.activity==='tag'?'run':d.activity,dt,t);});
 if(d.ball){const phase=((t%3.2)+3.2)%3.2/1.6,u=phase%1;d.ball.position.set((phase<1?-1:1)*(1.04-2.08*u),.24+Math.sin(u*Math.PI)*.22,.20);d.ball.rotation.set(t*1.8,0,-t*2.8);}
 if(d.kite){
 d.kite.position.set(1.5+Math.sin(t)*.2,4.4+Math.sin(t*1.3)*.17,-.5);d.kite.rotation.set(.08*Math.sin(t),.2,.18*Math.sin(t*1.3));
 const kid=d.kids[0],rig=kid.userData.kid;aimArm(rig.arms[1],new THREE.Vector3(.27,1.65+Math.sin(t*1.3)*.05,.40));aimArm(rig.arms[0],new THREE.Vector3(-.06,1.3,.40));rig.head.rotation.x=-.14;
 g.updateMatrixWorld(true);const h=g.worldToLocal(rig.arms[1].tip.getWorldPosition(new THREE.Vector3())),end=d.kite.position.clone(),control=h.clone().lerp(end,.5).add(new THREE.Vector3(.06,-.24,.18)),curve=new THREE.QuadraticBezierCurve3(h,control,end),p=d.string.geometry.attributes.position;
 for(let i=0;i<p.count;i++){const v=curve.getPoint(i/(p.count-1));p.setXYZ(i,v.x,v.y,v.z);}p.needsUpdate=true;d.string.geometry.computeBoundingSphere();d.spool.position.copy(g.worldToLocal(rig.arms[0].tip.getWorldPosition(new THREE.Vector3())));
 const tp=d.tail.geometry.attributes.position;for(let i=0;i<tp.count;i++){const u=i/(tp.count-1);tp.setXYZ(i,Math.sin(t*3-u*5)*u*.18,-.65-u*1.25,Math.sin(t*2-u*3)*u*.08);}tp.needsUpdate=true;d.tail.geometry.computeBoundingSphere();d.bows.forEach((bow,i)=>{const u=(i+1)/4;bow.position.set(Math.sin(t*3-u*5)*u*.18,-.65-u*1.25,Math.sin(t*2-u*3)*u*.08);bow.rotation.z=Math.cos(t*3-u*5)*.18;});
 }
 // 07 · two-bone arm solve: neighboring paper hands really meet while dancing.
 if(d.activity==='ring'){g.updateMatrixWorld(true);d.kids.forEach((k,i)=>{for(let arm=0;arm<2;arm++){const next=d.kids[(i+(arm===0?1:-1)+d.kids.length)%d.kids.length],target=k.position.clone().add(next.position).multiplyScalar(.5);target.y=1.43+Math.sin(t*2)*.025;g.localToWorld(target);k.userData.kid.rig.worldToLocal(target);aimArm(k.userData.kid.arms[arm],target);}});}
 // GROUP POLISH
}

// Analytic local-space arm IK, useful to consumers for grasping props too.
export function aimArm(arm,target){const shoulder=arm.pivot.position,delta=target.clone().sub(shoulder),distance=Math.min(delta.length(),arm.upper+arm.lower-.004);const dir=delta.normalize(),a=(arm.upper*arm.upper-arm.lower*arm.lower+distance*distance)/(2*distance);const bend=new THREE.Vector3(0,-1,.25).addScaledVector(dir,-new THREE.Vector3(0,-1,.25).dot(dir)).normalize();const elbow=dir.clone().multiplyScalar(a).addScaledVector(bend,Math.sqrt(Math.max(0,arm.upper*arm.upper-a*a)));arm.pivot.quaternion.setFromUnitVectors(new THREE.Vector3(0,-1,0),elbow.clone().normalize());const lower=dir.multiplyScalar(distance).sub(elbow).normalize().applyQuaternion(arm.pivot.quaternion.clone().invert());arm.joint.quaternion.setFromUnitVectors(new THREE.Vector3(0,-1,0),lower);}
