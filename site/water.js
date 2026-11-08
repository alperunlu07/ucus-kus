import * as THREE from 'three';
import {createWater,updateWater,WATER_KINDS} from './waterModel.js';
const KINDS=[...WATER_KINDS,'mix'];
const q=new URLSearchParams(location.search);let view=Math.max(0,Math.min(3,Number(q.get('v')??1)|0)),kind=KINDS.includes(q.get('k'))?q.get('k'):'mix',ripple=q.get('a')==='1';
const leftover=new URLSearchParams(q);for(const k of ['v','k','a'])leftover.delete(k);document.querySelector('#back').href='./'+(leftover.size?'?'+leftover:'');
const R=new THREE.WebGLRenderer({antialias:true});R.setPixelRatio(Math.min(devicePixelRatio,2));R.setSize(innerWidth,innerHeight);R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;R.outputColorSpace=THREE.SRGBColorSpace;document.body.prepend(R.domElement);
const S=new THREE.Scene();S.background=new THREE.Color('#efe8da');S.add(new THREE.HemisphereLight('#fff9ed','#98a38e',1.8));const sun=new THREE.DirectionalLight('#fff7ed',1.75);sun.position.set(-8,18,12);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-10,right:10,top:10,bottom:-10,near:1,far:65});sun.shadow.bias=-.00025;sun.shadow.normalBias=.012;sun.shadow.radius=3;S.add(sun);
const c=document.createElement('canvas');c.width=c.height=512;const ctx=c.getContext('2d');ctx.fillStyle='#a5b98c';ctx.fillRect(0,0,512,512);let sd=11;const rnd=()=>((sd=Math.imul(sd,1664525)+1013904223>>>0)/4294967296);for(let i=0;i<14000;i++){ctx.fillStyle=rnd()<.5?'#6d89570d':'#fff7cf14';ctx.fillRect(rnd()*512,rnd()*512,2,1);}ctx.strokeStyle='#5c77492b';for(let i=0;i<=512;i+=64){ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i,512);ctx.moveTo(0,i);ctx.lineTo(512,i);ctx.stroke();}const tex=new THREE.CanvasTexture(c);tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.colorSpace=THREE.SRGBColorSpace;
const groundMat=new THREE.MeshLambertMaterial({map:tex});tex.repeat.set(12/90,12/90);
// green grid ground (90 x .16 x 90, top y=0) with holes cut where the water basins sit
function makeGround(holes){const sh=new THREE.Shape();sh.moveTo(-45,-45);sh.lineTo(45,-45);sh.lineTo(45,45);sh.lineTo(-45,45);sh.closePath();
 for(const pts of holes){const h=new THREE.Path();pts.forEach(([x,z],i)=>i?h.lineTo(x,-z):h.moveTo(x,-z));h.closePath();sh.holes.push(h);}
 const g=new THREE.ExtrudeGeometry(sh,{depth:.16,bevelEnabled:false});g.rotateX(-Math.PI/2);g.translate(0,-.16,0);const m=new THREE.Mesh(g,groundMat);m.receiveShadow=true;return m;}
let ground,items=[],root=new THREE.Group();S.add(root);
function build(){root.clear();items=[];if(ground){S.remove(ground);ground.geometry.dispose();}
 const list=kind==='mix'?[['river',-3.4,.55],['sea',3.4,.6]]:[[kind,0,1]];const holes=[];
 for(const [k,x,s] of list){const w=createWater({kind:k,seed:3,scale:s});w.position.x=x;updateWater(w,1,ripple?'ripple':'calm');root.add(w);items.push(w);holes.push(w.userData.outline.map(([px,pz])=>[px+x,pz]));}
 ground=makeGround(holes);S.add(ground);buttons();}
function sync(){const u=new URLSearchParams(location.search);u.set('v',view);u.set('k',kind);u.set('a',+ripple);history.replaceState(null,'','?'+u);}
function buttons(){for(const [sel,key,val] of [['#views','v',String(view)],['#kinds','k',kind],['#life','a',String(+ripple)]])document.querySelectorAll(sel+' button').forEach(b=>{const on=b.dataset[key]===val;b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on));});sync();}
document.querySelectorAll('[data-v]').forEach(b=>b.onclick=()=>{view=+b.dataset.v;buttons();});document.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{kind=b.dataset.k;build();});document.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>{ripple=b.dataset.a==='1';buttons();});
addEventListener('keydown',e=>{if(e.key>='1'&&e.key<='4'){view=+e.key-1;buttons();}});build();
const camera=new THREE.OrthographicCamera(-1,1,1,-1,.1,150);
function hudFree(){const W=innerWidth,Hh=innerHeight,top=Math.max(...[...document.querySelectorAll('#hud div,#views')].map(e=>{const r=e.getBoundingClientRect();return r.top<Hh/2?r.bottom:0;}))+8,bot=Math.min(...[...document.querySelectorAll('#controls,#views')].map(e=>{const r=e.getBoundingClientRect();return r.bottom>Hh/2&&r.top>Hh/2?r.top:Hh;}))-8;return{top,bot,W,Hh};}
let last=performance.now(),frames=0;function frame(now){const dt=Math.min(.05,(now-last)/1000);last=now;for(const w of items)updateWater(w,dt,ripple?'ripple':'calm');
 const vectors=[[0,35,.001],[16,17,22],[0,5,22],[5,4,7]];const v=vectors[view];
 const mix=kind==='mix',sea=kind==='sea';
 const target=view===3?(sea?new THREE.Vector3(0,0,3.2):mix?new THREE.Vector3(3.4,0,1.9):new THREE.Vector3(.6,0,0)):new THREE.Vector3(0,view===2?.1:0,0);
 camera.position.set(target.x+v[0],target.y+v[1],target.z+v[2]);camera.lookAt(target);
 const span=view===3?1.3:view===2?1.2:mix?3.6:3.4;const wide=view===3?2.2:mix?6.6:view===2?4.8:4;
 const {top,bot,W,Hh}=hudFree();const freeH=Math.max(120,bot-top),aspect=W/Hh;let half=span*Hh/freeH;if(half*aspect<wide)half=wide/aspect;
 const off=((Hh/2)-(top+bot)/2)/Hh*2*half;
 camera.left=-half*aspect;camera.right=half*aspect;camera.top=half+off;camera.bottom=-half+off;camera.updateProjectionMatrix();
 R.render(S,camera);if(++frames===3)window.__waterReady=true;requestAnimationFrame(frame);}
addEventListener('resize',()=>R.setSize(innerWidth,innerHeight));requestAnimationFrame(frame);
