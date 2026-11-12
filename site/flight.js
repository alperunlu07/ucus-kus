import * as THREE from 'three';import {buildPlane} from './planeModel.js';
import {createVillage,updateVillage} from './villageModel.js';
import {createTree,updateTree} from './treeModel.js';
import {createFlowerPatch,createHayBale,createPlot,createForestFloor} from './fieldModel.js';
import {createTown,updateTown} from './townModel.js';
import {createTrain,updateTrain} from './trainModel.js';
import {createTrack} from './railModel.js';
import {createShip,updateShip} from './shipModel.js';
import {createBoat,updateBoat,createPier} from './boatModel.js';
import {createBalloon,updateBalloon} from './balloonModel.js';
import {createGullFlock,updateGullFlock} from './gullModel.js';
import {createCloud,updateCloud} from './cloudModel.js';
import {createLighthouse,updateLighthouse,createWindmill,updateWindmill} from './landmarkModel.js';
import {createIsland,createRock} from './islandModel.js';

// ---------- renderer / lights ----------
const R=new THREE.WebGLRenderer({antialias:true});R.setPixelRatio(Math.min(devicePixelRatio,2));R.setSize(innerWidth,innerHeight);R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;R.outputColorSpace=THREE.SRGBColorSpace;document.body.prepend(R.domElement);
const S=new THREE.Scene();S.background=new THREE.Color('#efe8da');
S.add(new THREE.HemisphereLight('#fff9ed','#98a38e',1.7));const sun=new THREE.DirectionalLight('#fff3dc',1.7);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.bias=-.0004;sun.shadow.normalBias=.03;sun.shadow.radius=3;
Object.assign(sun.shadow.camera,{left:-110,right:110,top:110,bottom:-110,near:1,far:400});S.add(sun,sun.target);
let sd=20261112;const r=()=>((sd=Math.imul(sd,1664525)+1013904223>>>0)/4294967296);
const ss=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t);};

// ---------- layout (x east, -z north) ----------
const VIL={x:-100,z:30,s:3};                       // Dere village
const VR={x0:VIL.x-19*VIL.s,x1:VIL.x+19*VIL.s,z0:VIL.z-120*VIL.s,z1:VIL.z+16*VIL.s}; // village ground slab rect
const RUN={x:0,z0:-110,z1:70,w:16};                // grass airstrip
const RAILZ=-470,SHORE=230,SEA_Y=-.55;
const TOWN={x:95,z:-270},HAM={x:-20,z:-560};
const LH={x:SHORE+18,z:-190},MILL={x:-235,z:-150};
const inRect=(x,z,b,m=0)=>x>b.x0-m&&x<b.x1+m&&z>b.z0-m&&z<b.z1+m;
const RUNR={x0:RUN.x-RUN.w/2,x1:RUN.x+RUN.w/2,z0:RUN.z0,z1:RUN.z1};
function flatK(x,z){let k=1;const d=(cx,cz,rr,f)=>{const q=Math.hypot(x-cx,z-cz);k=Math.min(k,ss(rr,rr+f,q));};
 if(inRect(x,z,VR,10))k=0;if(inRect(x,z,RUNR,40))k=0;d(TOWN.x,TOWN.z,50,40);d(HAM.x,HAM.z,30,30);k=Math.min(k,ss(14,50,Math.abs(z-RAILZ)));return k;}
function H(x,z){
 if(inRect(x,z,VR))return -3;                                       // under the village slab
 const k=flatK(x,z);
 let h=1.1*Math.sin(x*.021+1.3)*Math.sin(z*.017)*k+.6*Math.sin(x*.05)*Math.cos(z*.043)*k;
 const hill=ss(-160,-330,x)*k;                                      // western hills
 h+=hill*(16+9*Math.sin(z*.011+.7)*Math.cos(x*.013)+4*Math.sin(z*.031));
 const mk=Math.max(0,1-Math.hypot(x-MILL.x,z-MILL.z)/40);h+=mk*mk*6*k;   // windmill knoll
 let sea=ss(SHORE-30,SHORE+25,x+6*Math.sin(z*.02));
 const head=Math.max(0,1-Math.hypot(x-LH.x,z-LH.z)/38);sea*=1-Math.min(1,head*1.6); // lighthouse headland
 h=h*(1-sea)-sea*7+head*head*2.5;
 return h;}

// ---------- felt ground ----------
function feltTex(base,dots){const c=document.createElement('canvas');c.width=c.height=512;const g=c.getContext('2d');g.fillStyle=base;g.fillRect(0,0,512,512);for(let i=0;i<16000;i++){g.fillStyle=dots[i%dots.length];g.fillRect(r()*512,r()*512,2+r()*2,1);}const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t;}
const gTex=feltTex('#ffffff',['#00000008','#ffffff10','#5a4a300a']);gTex.repeat.set(60,60);
const SIZE=1700,SEG=170,CX=0,CZ=-250;
const gg=new THREE.PlaneGeometry(SIZE,SIZE,SEG,SEG);gg.rotateX(-Math.PI/2);gg.translate(CX,0,CZ);
const P=gg.attributes.position,col=new Float32Array(P.count*3),C=new THREE.Color(),C2=new THREE.Color();
const MEAD=new THREE.Color('#9dbb79'),MEAD2=new THREE.Color('#87a868'),HILL=new THREE.Color('#6f9156'),HILLT=new THREE.Color('#a9b98a'),SAND=new THREE.Color('#e6d5a8'),WET=new THREE.Color('#bfae86');
for(let i=0;i<P.count;i++){const x=P.getX(i),z=P.getZ(i),h=H(x,z);P.setY(i,h);
 const n=.5+.5*Math.sin(x*.031+Math.sin(z*.02)*2)*Math.cos(z*.027);C.copy(MEAD).lerp(MEAD2,n);
 if(h>3)C.lerp(HILL,ss(3,12,h));if(h>18)C.lerp(HILLT,ss(18,26,h)*.6);
 {const sm=ss(SHORE-34,SHORE-8,x+6*Math.sin(z*.02));if(sm>0){C.lerp(SAND,sm*ss(2,.6,h));if(h<SEA_Y)C.copy(WET);}}
 col[i*3]=C.r;col[i*3+1]=C.g;col[i*3+2]=C.b;}
gg.setAttribute('color',new THREE.BufferAttribute(col,3));gg.computeVertexNormals();
const ground=new THREE.Mesh(gg,new THREE.MeshLambertMaterial({map:gTex,vertexColors:true}));ground.receiveShadow=true;S.add(ground);
// sea
const sea=new THREE.Mesh(new THREE.PlaneGeometry(900,SIZE),new THREE.MeshLambertMaterial({color:'#6f9ec3',map:feltTex('#ffffff',['#2a4a6a0c','#ffffff14']),transparent:true,opacity:.92}));
sea.material.map.repeat.set(30,50);sea.rotation.x=-Math.PI/2;sea.position.set(SHORE+430,SEA_Y,CZ);sea.receiveShadow=true;S.add(sea);
// village + its own ground slab (holes for the creek)
const village=createVillage({seed:8,scale:VIL.s});village.position.set(VIL.x,0,VIL.z);S.add(village);
{const sh=new THREE.Shape(),m=12/VIL.s;sh.moveTo(-19-m,-16-m);sh.lineTo(19+m,-16-m);sh.lineTo(19+m,120+m);sh.lineTo(-19-m,120+m);sh.closePath();
 for(const pts of village.userData.outlines){const hole=new THREE.Path();pts.forEach(([x,z],i)=>i?hole.lineTo(x,-z):hole.moveTo(x,-z));hole.closePath();sh.holes.push(hole);}
 const geo=new THREE.ExtrudeGeometry(sh,{depth:.16,bevelEnabled:false});geo.rotateX(-Math.PI/2);geo.translate(0,-.16,0);
 const vt=feltTex('#9dbb79',['#6d89570d','#fff7cf14']);vt.repeat.set(1/8,1/8);
 const slab=new THREE.Mesh(geo,new THREE.MeshLambertMaterial({map:vt}));slab.scale.setScalar(VIL.s);slab.position.set(VIL.x,0,VIL.z);slab.receiveShadow=true;S.add(slab);}
// airstrip
{const rt=feltTex('#d9c9a0',['#7a603a10','#ffffff12']);rt.repeat.set(2,20);
 const L=RUN.z1-RUN.z0;const strip=new THREE.Mesh(new THREE.BoxGeometry(RUN.w,.12,L),new THREE.MeshLambertMaterial({map:rt}));strip.position.set(RUN.x,.06,(RUN.z0+RUN.z1)/2);strip.receiveShadow=true;S.add(strip);
 const wm=new THREE.MeshLambertMaterial({color:'#fbf6ea'});
 for(let z=RUN.z1-14;z>RUN.z0+10;z-=12){const d=new THREE.Mesh(new THREE.BoxGeometry(.8,.05,5),wm);d.position.set(RUN.x,.14,z);S.add(d);}
 for(const zz of [RUN.z1-4,RUN.z0+4])for(let i=-2;i<=2;i++){if(!i)continue;const b=new THREE.Mesh(new THREE.BoxGeometry(1.2,.05,5),wm);b.position.set(RUN.x+i*2.6,.14,zz);S.add(b);}
 // windsock
 const pole=new THREE.Mesh(new THREE.CylinderGeometry(.12,.14,5,8),new THREE.MeshLambertMaterial({color:'#7a6650'}));pole.position.set(RUN.x+14,2.5,RUN.z1-20);pole.castShadow=true;S.add(pole);
 const sock=new THREE.Mesh(new THREE.ConeGeometry(.7,3,10,1,true),new THREE.MeshLambertMaterial({color:'#e8766b',side:THREE.DoubleSide}));sock.rotation.z=Math.PI/2;sock.position.set(RUN.x+15.6,4.6,RUN.z1-20);sock.castShadow=true;S.add(sock);
 // edge markers
 const cm=new THREE.MeshLambertMaterial({color:'#f2b35a'});for(let z=RUN.z1-2;z>RUN.z0;z-=20)for(const s of [-1,1]){const c=new THREE.Mesh(new THREE.ConeGeometry(.45,1,8),cm);c.position.set(RUN.x+s*(RUN.w/2+1.2),.5,z);c.castShadow=true;S.add(c);}}

// ---------- props ----------
const dyn=[];const add=(o,x,z,y=null,ry=0,kind='static',extra={})=>{o.position.set(x,y??H(x,z),z);o.rotation.y=ry;o.traverse(m=>{if(m.isMesh){m.castShadow=true;m.receiveShadow=true;}});S.add(o);const d={o,kind,...extra};dyn.push(d);return d;};
const busy=(x,z,m=8)=>inRect(x,z,VR,m)||inRect(x,z,RUNR,m+12)||Math.hypot(x-TOWN.x,z-TOWN.z)<50+m||Math.hypot(x-HAM.x,z-HAM.z)<26+m||Math.abs(z-RAILZ)<10+m||Math.hypot(x-MILL.x,z-MILL.z)<14+m||Math.hypot(x-LH.x,z-LH.z)<16+m;
// towns
add(createTown({town:true,biome:0,seed:41,station:false}),TOWN.x,TOWN.z,0,.0,'town').o.scale.setScalar(2.4);
add(createTown({town:false,biome:2,seed:17,station:true}),HAM.x,HAM.z,0,.3,'town').o.scale.setScalar(2.4);
// fields around the town and runway
const crops=['mustard','rice','flowers','pampa','autumn'];
for(let i=0;i<14;i++){const x=40+(i%4)*34+r()*6,z=-150-Math.floor(i/4)*44-r()*6;if(busy(x,z,4))continue;const p=createPlot({kind:crops[i%crops.length],w:26,d:16,seed:300+i});p.scale.setScalar(1);add(p,x,z,null,(r()-.5)*.15);}
for(let i=0;i<10;i++){const x=40+r()*150,z=-40-r()*70;if(busy(x,z,6)||x>SHORE-50)continue;add(createFlowerPatch({seed:500+i,w:6+r()*4,d:4+r()*3}),x,z).o.scale.setScalar(2);}
for(let i=0;i<8;i++){const x=30+r()*140,z=20-r()*110;if(busy(x,z,6)||x>SHORE-50)continue;add(createHayBale({seed:600+i,group:1+Math.floor(r()*3)}),x,z,null,r()*6).o.scale.setScalar(2.6);}
// forest on the western hills + scattered trees
const trees=[];
for(let i=0;i<190;i++){const x=-170-r()*500,z=150-r()*900;if(busy(x,z,6))continue;const h=H(x,z);const kind=h>14?'cam':r()<.3?'sonbahar':'yuvarlak';const d=add(createTree({kind,seed:900+i,scale:2.6+r()*1.4}),x,z,h,r()*6,'tree');trees.push(d);}
for(let i=0;i<70;i++){const x=-160+r()*(SHORE-200),z=160-r()*820;if(busy(x,z,10)||H(x,z)<.2)continue;const d=add(createTree({kind:r()<.25?'cicekli':'yuvarlak',seed:1500+i,scale:2.4+r()*1.2}),x,z,null,r()*6,'tree');trees.push(d);}
for(let i=0;i<16;i++){const x=-180-r()*200,z=60-r()*600;if(busy(x,z,6))continue;add(createForestFloor({seed:700+i,w:3.2,d:2.4}),x,z).o.scale.setScalar(3);}
// windmill on its knoll, lighthouse on the headland
add(createWindmill({seed:11,scale:3}),MILL.x,MILL.z,null,.6,'mill');
add(createLighthouse({seed:9,scale:3}),LH.x,LH.z,null,-Math.PI/2,'lh');
// railway with a train (east-west, north of the village)
for(let x=-760;x<SHORE-20;x+=30){const t=createTrack({seed:3+((x/30)|0),length:10,scale:1});t.scale.setScalar(3);add(t,x+15,RAILZ,Math.max(H(x+15,RAILZ),0)+.02);}
const train=add(createTrain({wagons:4}),-300,RAILZ,null,0,'train',{sp:14});train.o.scale.setScalar(3);
// coast: pier, boats, islands, rocks, ship, gulls
add(createPier({seed:5,length:7}),SHORE+6,40,SEA_Y+.05,-Math.PI/2).o.scale.setScalar(3);
for(const [x,z,s,k] of [[SHORE+120,-80,4,'islet'],[SHORE+190,-330,3.4,'islet'],[SHORE+80,-470,2.8,'islet']]) add(createIsland({kind:k,seed:(x*7+z)|0,scale:s}),x,z,SEA_Y+.05,r()*6);
for(let i=0;i<9;i++){const x=SHORE+30+r()*220,z=100-r()*650;add(createRock({kind:'coastRock',seed:80+i,scale:2+r()*2}),x,z,SEA_Y,r()*6);}
const boats=[];for(let i=0;i<5;i++){const b=add(createBoat({kind:'sail',seed:40+i,scale:2.4}),0,0,SEA_Y+.1,0,'boat',{cx:SHORE+60+r()*200,cz:60-r()*520,rad:20+r()*30,ph:r()*6,w:(.05+r()*.05)*(r()<.5?-1:1)});boats.push(b);}
const ship=add(createShip({kind:0}),SHORE+160,200,SEA_Y+.15,0,'ship',{sp:7});ship.o.scale.setScalar(3.4);
for(let i=0;i<3;i++)add(createGullFlock({count:6,seed:70+i,scale:.6}),SHORE+40+r()*160,-r()*500,14+r()*10,0,'gulls',{cx:0,cz:0,ph:r()*6});
// balloons and clouds
for(let i=0;i<5;i++)add(createBalloon({seed:20+i,color:i,scale:3}),-150+r()*360,-r()*620,26+r()*30,0,'balloon',{vx:1.5+r(),vz:(r()-.5)*1.2});
for(let i=0;i<11;i++){const d=add(createCloud({kind:['bank','puff','wide'][i%3],seed:30+i,scale:6+r()*4}),-500+r()*1000,180-r()*900,48+r()*18,r()*6,'cloud',{vx:2+r()*1.5});d.o.traverse(m=>{if(m.isMesh)m.castShadow=false;});}
dyn.forEach(d=>{if(d.kind==='static')return;});

// ---------- plane (same controls as the plane workshop, scaled up for open sky) ----------
const bc=document.createElement('canvas');bc.width=bc.height=128;const bgc=bc.getContext('2d');const gr=bgc.createRadialGradient(64,64,4,64,64,62);gr.addColorStop(0,'rgba(60,45,35,.55)');gr.addColorStop(1,'rgba(60,45,35,0)');bgc.fillStyle=gr;bgc.fillRect(0,0,128,128);
const plane=buildPlane({canopy:true});const holder=new THREE.Group();holder.add(plane);S.add(holder);
plane.traverse(o=>{o.castShadow=false;o.layers.enable(1);});
const SRT=new THREE.WebGLRenderTarget(256,256);const SW=8;const scam=new THREE.OrthographicCamera(-SW/2,SW/2,SW/2,-SW/2,.1,200);scam.up.set(0,0,-1);scam.layers.set(1);
const sMat=new THREE.MeshBasicMaterial({color:'#ffffff'});
const shQ=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{map:{value:SRT.texture},blur:{value:0},op:{value:.5}},
 vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
 fragmentShader:'uniform sampler2D map;uniform float blur,op;varying vec2 vUv;void main(){float a=0.,w=0.;for(int i=-3;i<=3;i++)for(int j=-3;j<=3;j++){vec2 o=vec2(float(i),float(j))*blur;float k=1.-length(vec2(i,j))/4.5;if(k>0.){a+=texture2D(map,vUv+o).r*k;w+=k;}}gl_FragColor=vec4(.24,.18,.13,a/w*op);}'}));
shQ.rotation.x=-Math.PI/2;S.add(shQ);
const black=new THREE.Color(0);
function shadowTick(gy){const a=st.y-gy;scam.position.set(st.x,st.y+20,st.z);scam.lookAt(st.x,st.y-10,st.z);const ov=S.overrideMaterial,bg=S.background;S.overrideMaterial=sMat;S.background=black;R.setRenderTarget(SRT);R.render(S,scam);R.setRenderTarget(null);S.overrideMaterial=ov;S.background=bg;
 const h=Math.max(0,a-.2);const k=1/(1+h*.035);shQ.scale.setScalar(SW*k);shQ.position.set(st.x+h*.35,gy+.2,st.z+h*.22);
 shQ.material.uniforms.blur.value=.0015+h*.0006;shQ.material.uniforms.op.value=THREE.MathUtils.clamp(.62-h*.012,.1,.62);}
const cam=new THREE.PerspectiveCamera(30,innerWidth/innerHeight,.5,3000);const TF=Math.tan(15*Math.PI/180);
const HOME={x:RUN.x,z:RUN.z1-12};
const st={x:HOME.x,z:HOME.z,y:.22,head:0,vy:0,steer:0,climb:0,view:1,auto:false,speed:0,thr:0,park:true};window.__pl=st;
const keys={};addEventListener('keydown',e=>{keys[e.key]=1;if(st.park&&/^Arrow|^[wasd]$/.test(e.key))togFly();if(e.key==='v'||e.key==='V')st.view=(st.view+1)%3;if(e.key==='c'||e.key==='C')togCan();if(e.key==='f'||e.key==='F')togFly();if(e.key==='+'||e.key==='e')st.thr=Math.min(1,st.thr+.1);if(e.key==='-'||e.key==='q')st.thr=Math.max(.15,st.thr-.1);});addEventListener('keyup',e=>keys[e.key]=0);
const pad={};document.querySelectorAll('#pad button').forEach(b=>{const k=b.dataset.k;const on=e=>{e.preventDefault();e.stopPropagation();pad[k]=1;b.classList.add('on');if(st.park)togFly();};const off=()=>{pad[k]=0;b.classList.remove('on');};b.addEventListener('pointerdown',on);b.addEventListener('pointerup',off);b.addEventListener('pointercancel',off);b.addEventListener('pointerleave',off);});
const thrEl=document.getElementById('thr');thrEl.addEventListener('input',()=>{st.thr=thrEl.value/100;});
let drag=null;addEventListener('pointerdown',e=>{if(e.target.closest('button,a,input,#thrW'))return;if(st.park)togFly();drag={x:e.clientX,y:e.clientY};});addEventListener('pointermove',e=>{if(!drag)return;const s=Math.min(innerWidth,innerHeight)*.25;st.steer=THREE.MathUtils.clamp((e.clientX-drag.x)/s,-1,1);st.climb=THREE.MathUtils.clamp(-(e.clientY-drag.y)/s,-1,1);});const up=()=>{drag=null;st.steer=0;st.climb=0;};addEventListener('pointercancel',up);addEventListener('pointerup',up);
const U=plane.userData;U.canopyOpen=true;function togCan(){U.canopyOpen=!U.canopyOpen;}
function togFly(){st.park=!st.park;if(st.park){U.canopyOpen=true;st.thr=0;}else{U.canopyOpen=false;st.thr=Math.max(st.thr,thrEl.value/100,.3);st.vy=3;}}
function goHome(){Object.assign(st,{x:HOME.x,z:HOME.z,y:.22,head:0,vy:0,speed:0,park:true,thr:0});U.canopyOpen=true;}
window.__tog={togCan,togFly,goHome};
document.getElementById('bCan').onclick=togCan;document.getElementById('bFly').onclick=togFly;document.getElementById('bHome').onclick=goHome;
document.querySelectorAll('#views button[data-v]').forEach(b=>b.onclick=()=>{st.view=+b.dataset.v;});
// wingtip trails
const TN=60;const trails=U.tips.map(()=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(TN*2*3),3));g.setAttribute('a',new THREE.BufferAttribute(new Float32Array(TN*2),1));const ix=[];for(let i=0;i<TN-1;i++){const a=i*2;ix.push(a,a+1,a+2,a+1,a+3,a+2);}g.setIndex(ix);
 const m=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,uniforms:{op:{value:0}},vertexShader:'attribute float a;varying float va;void main(){va=a;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform float op;varying float va;void main(){gl_FragColor=vec4(1.,1.,1.,va*op);}'});
 const me=new THREE.Mesh(g,m);me.frustumCulled=false;S.add(me);return {g,m,pts:[]};});
const _v=new THREE.Vector3();function trailTick(spd){const sk=THREE.MathUtils.smoothstep(spd,8,26);const n=Math.round(10+sk*(TN-10));
 U.tips.forEach((tp,k)=>{const T=trails[k];tp.getWorldPosition(_v);T.pts.unshift(_v.clone());if(T.pts.length>TN)T.pts.pop();T.m.uniforms.op.value=.75*sk;
  const PP=T.g.attributes.position,A=T.g.attributes.a;for(let i=0;i<TN;i++){const q=T.pts[Math.min(i,T.pts.length-1)];const w=(.03*(1-i/TN)+.006)*Math.max(1,vh/9);PP.setXYZ(i*2,q.x-w,q.y,q.z);PP.setXYZ(i*2+1,q.x+w,q.y,q.z);const al=i<n?(1-i/n):0;A.setX(i*2,al);A.setX(i*2+1,al);}PP.needsUpdate=A.needsUpdate=true;});}
let vh=14;function camDist(){return (innerWidth<innerHeight?vh*1.7:vh)/2/TF;}function fit(){cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix();}
addEventListener('resize',()=>{R.setSize(innerWidth,innerHeight);fit();});
// place caption
const placeEl=document.getElementById('place');
function placeName(x,z){if(inRect(x,z,VR,10))return 'Dere köyü';if(inRect(x,z,RUNR,25))return 'Çayır pisti';if(x>SHORE+5)return Math.hypot(x-LH.x,z-LH.z)<60?'Fener burnu':'Kıyı ve adalar';if(Math.hypot(x-LH.x,z-LH.z)<60)return 'Fener burnu';if(Math.hypot(x-TOWN.x,z-TOWN.z)<70)return 'Tarla kasabası';if(Math.abs(z-RAILZ)<40)return 'Demiryolu';if(Math.hypot(x-HAM.x,z-HAM.z)<50)return 'İstasyon mezrası';if(Math.hypot(x-MILL.x,z-MILL.z)<60)return 'Yel değirmeni tepesi';if(x<-170)return 'Ormanlı tepeler';return 'Çayırlar';}
const clk=new THREE.Clock();let t=0;const altEl=document.getElementById('alt');const tmp=new THREE.Vector3();
function frame(){requestAnimationFrame(frame);const dt=Math.min(clk.getDelta(),.05);t+=dt;
 let steer=st.steer,climb=st.climb;if(pad.L)steer=-1;if(pad.R)steer=1;if(pad.U)climb=1;if(pad.D)climb=-1;if(keys.ArrowLeft||keys.a)steer=-1;if(keys.ArrowRight||keys.d)steer=1;if(keys.ArrowUp||keys.w)climb=1;if(keys.ArrowDown||keys.s)climb=-1;
 if(st.park){steer=0;climb=0;}
 if(st.force){steer=st.force.steer;climb=st.force.climb;}
 // keep inside the map: gently turn back toward the middle near the edge
 const ex=Math.abs(st.x-CX)>SIZE/2-140||Math.abs(st.z-CZ)>SIZE/2-140;if(ex&&!st.park){const want=Math.atan2(-(CX-st.x),-(CZ-st.z));let dh=want-st.head;dh=Math.atan2(Math.sin(dh),Math.cos(dh));steer=THREE.MathUtils.clamp(-dh*2,-1,1);}
 st.speed+=((st.park?0:10+st.thr*26)-st.speed)*(1-Math.exp(-dt*1.2));
 const gy=Math.max(H(st.x,st.z),SEA_Y);const floor=gy+1.2;
 st.head-=steer*dt*.75*Math.min(1,st.speed/8);st.vy+=(climb*8-st.vy)*(1-Math.exp(-dt*2.5));
 if(st.park)st.y=THREE.MathUtils.lerp(st.y,gy+.22,1-Math.exp(-dt*2));else{st.y=THREE.MathUtils.clamp(st.y+st.vy*dt,floor,95);if(st.y<=floor+.01||st.y>=95)st.vy*=.5;}
 st.x+=-Math.sin(st.head)*st.speed*dt;st.z+=-Math.cos(st.head)*st.speed*dt;
 holder.position.set(st.x,st.y,st.z);holder.rotation.y=st.head;plane.userData.tick(dt,{steer,climb:THREE.MathUtils.clamp(st.vy/8,-1,1),throttle:st.park?0:st.thr,input:climb});trailTick(st.speed);plane.traverse(o=>{if(o.isSprite){o.userData.s0??=o.scale.x;o.scale.setScalar(o.userData.s0*Math.max(1,vh/10));}});
 shadowTick(gy);
 sun.position.set(st.x-40,st.y+120,st.z+50);sun.target.position.set(st.x,gy,st.z);
 // world life
 updateVillage(village,dt,'life');
 for(const d of dyn){const o=d.o;
  if(d.kind==='tree'){const dd=Math.hypot(o.position.x-st.x,o.position.z-st.z);updateTree(o,dt,dd<30&&st.y-o.position.y<15?1.2:.35);}
  else if(d.kind==='town')updateTown(o,dt);
  else if(d.kind==='mill')updateWindmill(o,dt,'spin');
  else if(d.kind==='lh')updateLighthouse(o,dt,'spin');
  else if(d.kind==='train'){o.position.x+=d.sp*dt;if(o.position.x>SHORE-40)o.position.x=-760;o.position.y=Math.max(H(o.position.x,RAILZ),0)+.05;updateTrain(o,dt,1);}
  else if(d.kind==='boat'){d.ph+=d.w*dt;o.position.set(d.cx+Math.cos(d.ph)*d.rad,SEA_Y+.1,d.cz+Math.sin(d.ph)*d.rad);o.rotation.y=-d.ph+(d.w>0?Math.PI:0);updateBoat(o,dt,1);}
  else if(d.kind==='ship'){o.position.z-=d.sp*dt;if(o.position.z<-760)o.position.z=200;updateShip(o,'sail',dt);}
  else if(d.kind==='gulls'){d.ph+=dt*.15;o.position.x+=Math.cos(d.ph)*4*dt;o.position.z+=Math.sin(d.ph)*4*dt;updateGullFlock(o,dt,Math.hypot(o.position.x-st.x,o.position.z-st.z)<14&&Math.abs(o.position.y-st.y)<8?'scatter':'glide');}
  else if(d.kind==='balloon'){o.position.x+=d.vx*dt;o.position.z+=d.vz*dt;if(o.position.x>420)o.position.x=-260;updateBalloon(o,dt);}
  else if(d.kind==='cloud'){o.position.x+=d.vx*dt;if(o.position.x>620)o.position.x=-620;const near=Math.hypot(o.position.x-st.x,o.position.z-st.z)<Math.max(34,vh*.75)&&o.position.y>st.y-4;updateCloud(o,dt,near?'part':'drift');}}
 // camera
 const a=st.y-gy;U.pilotOn=!st.park;vh=st.view===0?15:st.view===2?16:13;const D=camDist();
 const tgt=tmp.set(st.x,st.y,st.z);
 if(st.view===0){const k=D/Math.hypot(1,.35);cam.position.set(st.x,st.y+k,st.z+k*.35);cam.up.set(0,0,-1);}
 else if(st.view===1){const k=D/Math.hypot(1,1.15,1);cam.position.set(st.x+k,st.y+k*1.15,st.z+k);if(st.park)tgt.set(st.x,gy+.6,st.z-.3);cam.up.set(0,1,0);}
 else {cam.position.set(st.x+D*Math.cos(st.head),st.y+D*.08,st.z-D*Math.sin(st.head));cam.up.set(0,1,0);}
 cam.lookAt(tgt);
 altEl.textContent='✈ '+(st.park?'Pistte · kanopi '+(U.canopyOpen?'açık':'kapalı'):'irtifa '+Math.round(a)+' m · hız '+Math.round(st.speed*3.6)+' km/s · gaz '+Math.round(st.thr*100)+'%');
 placeEl.textContent=placeName(st.x,st.z);
 R.render(S,cam);}
fit();frame();window.__flight={S,R,cam,st,H,dyn};
