import * as THREE from 'three';
import {createFence,updateFence,FENCE_KINDS} from './fenceModel.js';
const q=new URLSearchParams(location.search);let view=Math.max(0,Math.min(3,Number(q.get('v')??1)|0)),kind=FENCE_KINDS.includes(q.get('k'))?q.get('k'):'run',open=q.get('a')==='1';
const leftover=new URLSearchParams(q);for(const k of ['v','k','a'])leftover.delete(k);document.querySelector('#back').href='./'+(leftover.size?'?'+leftover:'');
const R=new THREE.WebGLRenderer({antialias:true});R.setPixelRatio(Math.min(devicePixelRatio,2));R.setSize(innerWidth,innerHeight);R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;R.outputColorSpace=THREE.SRGBColorSpace;document.body.prepend(R.domElement);
const S=new THREE.Scene();S.background=new THREE.Color('#efe8da');S.add(new THREE.HemisphereLight('#fff9ed','#98a38e',1.8));const sun=new THREE.DirectionalLight('#fff7ed',1.75);sun.position.set(-8,18,12);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-10,right:10,top:10,bottom:-10,near:1,far:65});sun.shadow.bias=-.00025;sun.shadow.normalBias=.012;sun.shadow.radius=3;S.add(sun);
const c=document.createElement('canvas');c.width=c.height=512;const ctx=c.getContext('2d');ctx.fillStyle='#a5b98c';ctx.fillRect(0,0,512,512);let sd=11;const rnd=()=>((sd=Math.imul(sd,1664525)+1013904223>>>0)/4294967296);for(let i=0;i<14000;i++){ctx.fillStyle=rnd()<.5?'#6d89570d':'#fff7cf14';ctx.fillRect(rnd()*512,rnd()*512,2,1);}ctx.strokeStyle='#5c77492b';for(let i=0;i<=512;i+=64){ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i,512);ctx.moveTo(0,i);ctx.lineTo(512,i);ctx.stroke();}const tex=new THREE.CanvasTexture(c);tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.repeat.set(12,12);tex.colorSpace=THREE.SRGBColorSpace;
const ground=new THREE.Mesh(new THREE.BoxGeometry(90,.16,90),new THREE.MeshLambertMaterial({map:tex}));ground.position.y=-.08;ground.receiveShadow=true;S.add(ground);
let fence;function build(){if(fence){S.remove(fence);fence.traverse(m=>{if(m.isMesh)m.geometry.dispose();});fence.userData.ownedMaterial.dispose();}
 fence=createFence({kind,seed:3,length:kind==='paddock'?7:6});if(open){fence.userData.open=1;}updateFence(fence,1,open?'open':'stop');S.add(fence);buttons();}
function sync(){const u=new URLSearchParams(location.search);u.set('v',view);u.set('k',kind);u.set('a',+open);history.replaceState(null,'','?'+u);}
function buttons(){for(const [sel,key,val] of [['#views','v',String(view)],['#kinds','k',kind],['#life','a',String(+open)]])document.querySelectorAll(sel+' button').forEach(b=>{const on=b.dataset[key]===val;b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on));});sync();}
document.querySelectorAll('[data-v]').forEach(b=>b.onclick=()=>{view=+b.dataset.v;buttons();});document.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{kind=b.dataset.k;build();});document.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>{open=b.dataset.a==='1';buttons();});
addEventListener('keydown',e=>{if(e.key>='1'&&e.key<='4'){view=+e.key-1;buttons();}});build();
const camera=new THREE.OrthographicCamera(-1,1,1,-1,.1,150);
function hudFree(){// screen rect free of HUD, in px
 const W=innerWidth,Hh=innerHeight,top=Math.max(...[...document.querySelectorAll('#hud div,#views')].map(e=>{const r=e.getBoundingClientRect();return r.top<Hh/2?r.bottom:0;}))+8,bot=Math.min(...[...document.querySelectorAll('#controls,#views')].map(e=>{const r=e.getBoundingClientRect();return r.bottom>Hh/2&&r.top>Hh/2?r.top:Hh;}))-8;return{top,bot,W,Hh};}
let last=performance.now(),frames=0;function frame(now){const dt=Math.min(.05,(now-last)/1000);last=now;updateFence(fence,dt,open?'open':'stop');
 const paddock=kind==='paddock',rad=fence.userData.radius||3;
 const vectors=[[0,35,.001],[16,17,22],[0,2.2,14],[5,3.2,7]];const v=vectors[view];
 const target=view===3?(paddock?new THREE.Vector3(0,.35,rad):new THREE.Vector3(kind==='gate'?0:-1.1,.35,0)):new THREE.Vector3(0,view===2?.4:0,view===0?0:0);
 if(view===3&&paddock){v[0]=4;v[2]=8.5;}
 camera.position.set(target.x+v[0],target.y+v[1],target.z+v[2]);camera.lookAt(target);
 const span=view===3?(paddock?1.1:.95):paddock?rad*(view===2?.62:.95)+.3:(view===2?1.6:1.9);// half-extent to fit
 const {top,bot,W,Hh}=hudFree();const freeH=Math.max(120,bot-top),aspect=W/Hh;let half=span*Hh/freeH;const wide=view===2?3.4*(paddock?rad/2.7:1):span*(view===3?1.25:paddock?1.12:1.5);if(half*aspect<wide)half=wide/aspect;
 const off=((Hh/2)-(top+bot)/2)/Hh*2*half;// shift frustum so model centres in free band
 camera.left=-half*aspect;camera.right=half*aspect;camera.top=half+off;camera.bottom=-half+off;camera.updateProjectionMatrix();
 R.render(S,camera);if(++frames===3)window.__fenceReady=true;requestAnimationFrame(frame);}
addEventListener('resize',()=>R.setSize(innerWidth,innerHeight));requestAnimationFrame(frame);
