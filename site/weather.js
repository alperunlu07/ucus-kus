import * as THREE from 'three';
import {createWeather,updateWeather,WEATHER_KINDS} from './weatherModel.js';
const KINDS=[...WEATHER_KINDS,'mix'];
const q=new URLSearchParams(location.search);let view=Math.max(0,Math.min(3,Number(q.get('v')??1)|0)),kind=KINDS.includes(q.get('k'))?q.get('k'):'rain',swell=q.get('a')==='1';
const leftover=new URLSearchParams(q);for(const k of ['v','k','a'])leftover.delete(k);document.querySelector('#back').href='./'+(leftover.size?'?'+leftover:'');
const R=new THREE.WebGLRenderer({antialias:true});R.setPixelRatio(Math.min(devicePixelRatio,2));R.setSize(innerWidth,innerHeight);R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;R.outputColorSpace=THREE.SRGBColorSpace;document.body.prepend(R.domElement);
const S=new THREE.Scene();const hemi=new THREE.HemisphereLight('#fff9ed','#98a38e',1.8);S.add(hemi);const sun=new THREE.DirectionalLight('#fff7ed',1.6);sun.position.set(-8,18,12);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-20,right:20,top:12,bottom:-12,near:1,far:70});sun.shadow.bias=-.00025;sun.shadow.normalBias=.012;S.add(sun);
const c=document.createElement('canvas');c.width=c.height=512;const ctx=c.getContext('2d');ctx.fillStyle='#a5b98c';ctx.fillRect(0,0,512,512);let sd=11;const rnd=()=>((sd=Math.imul(sd,1664525)+1013904223>>>0)/4294967296);for(let i=0;i<14000;i++){ctx.fillStyle=rnd()<.5?'#6d89570d':'#fff7cf14';ctx.fillRect(rnd()*512,rnd()*512,2,1);}ctx.strokeStyle='#5c77492b';for(let i=0;i<=512;i+=64){ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i,512);ctx.moveTo(0,i);ctx.lineTo(512,i);ctx.stroke();}const tex=new THREE.CanvasTexture(c);tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.repeat.set(12,12);tex.colorSpace=THREE.SRGBColorSpace;
const ground=new THREE.Mesh(new THREE.BoxGeometry(1,.16,1),new THREE.MeshLambertMaterial({map:tex}));ground.position.y=-.09;ground.receiveShadow=true;S.add(ground);
// per-kind paper backdrops: sky colour, ground tint, light
const LOOK={rain:['#e6e4dc','#c9cfc0',1.5,1.2],fog:['#d9d8e0','#b9bdb6',1.6,.7],rainbow:['#efe8da','#ffffff',1.8,1.6],night:['#1e2433','#3a4560',.8,.3],mix:['#e2dccf','#e6e6dd',1.6,1.3]};
const SPACING=8.4,CARD={rain:'#d8dbd8',fog:'#cfcfda',rainbow:'#f5eedf',night:'#1e2433'};
let root;function build(){if(root){S.remove(root);root.traverse(m=>{if(m.isMesh){m.geometry.dispose();}});}
 root=new THREE.Group();const list=kind==='mix'?WEATHER_KINDS:[kind];
 list.forEach((k,i)=>{const w=createWeather({kind:k,seed:3});w.position.x=kind==='mix'?(i-1.5)*SPACING:0;root.add(w);
  if(kind==='mix'){const card=new THREE.Mesh(new THREE.PlaneGeometry(7.8,6.6),new THREE.MeshBasicMaterial({color:CARD[k]}));card.position.set(w.position.x,3.2,-2.6);root.add(card);
   const cd=new THREE.Mesh(new THREE.BoxGeometry(7.8,.04,5),new THREE.MeshLambertMaterial({color:k==='night'?'#3a4560':CARD[k]}));cd.position.set(w.position.x,.0,0);cd.receiveShadow=true;root.add(cd);}});
 S.add(root);ground.scale.set(kind==='mix'?36:9,1,kind==='mix'?7:6.5);tex.repeat.set(ground.scale.x/3,ground.scale.z/3);const L=LOOK[kind];S.background=new THREE.Color(L[0]);ground.material.color.set(L[1]);hemi.intensity=L[2];sun.intensity=L[3];buttons();}
function sync(){const u=new URLSearchParams(location.search);u.set('v',view);u.set('k',kind);u.set('a',+swell);history.replaceState(null,'','?'+u);}
function buttons(){for(const [sel,key,val] of [['#views','v',String(view)],['#kinds','k',kind],['#life','a',String(+swell)]])document.querySelectorAll(sel+' button').forEach(b=>{const on=b.dataset[key]===val;b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on));});sync();}
document.querySelectorAll('[data-v]').forEach(b=>b.onclick=()=>{view=+b.dataset.v;buttons();});document.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{kind=b.dataset.k;build();});document.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>{swell=b.dataset.a==='1';buttons();});
addEventListener('keydown',e=>{if(e.key>='1'&&e.key<='4'){view=+e.key-1;buttons();}});build();
const camera=new THREE.OrthographicCamera(-1,1,1,-1,.1,200);
function hudFree(){const W=innerWidth,Hh=innerHeight,top=Math.max(...[...document.querySelectorAll('#hud div,#views')].map(e=>{const r=e.getBoundingClientRect();return r.top<Hh/2?r.bottom:0;}))+8,bot=Math.min(...[...document.querySelectorAll('#controls,#views')].map(e=>{const r=e.getBoundingClientRect();return r.bottom>Hh/2&&r.top>Hh/2?r.top:Hh;}))-8;return{top,bot,W,Hh};}
let last=performance.now(),frames=0;function frame(now){const dt=Math.min(.05,(now-last)/1000);last=now;for(const w of root.children)if(w.userData.kind)updateWeather(w,dt,swell?'swell':'idle');
 const mix=kind==='mix',vectors=[[0,40,.001],[14,12,22],[0,1.2,30],[6,2.5,14]],v=vectors[view];
 // close view: moon for night, near drops for rain, stitches for rainbow
 const closeT={rain:[0,1.4,0],fog:[0,.6,0],rainbow:[-2.6,2.6,0],night:[1.6,4.2,-1.6],mix:[0,2.6,0]}[kind];
 const target=view===3?new THREE.Vector3(...closeT):new THREE.Vector3(0,view===0?0:2.6,0);
 camera.position.set(target.x+v[0],target.y+v[1],target.z+v[2]);camera.lookAt(target);
 const span=view===3?(mix?3.4:1.7):view===0?(mix?5:3.4):(mix?4.6:3.6);const wide=view===3?span*1.5:mix?17.5:4.2;
 const {top,bot,W,Hh}=hudFree();const freeH=Math.max(120,bot-top),aspect=W/Hh;let half=span*Hh/freeH;if(half*aspect<wide)half=wide/aspect;
 const off=((Hh/2)-(top+bot)/2)/Hh*2*half;camera.left=-half*aspect;camera.right=half*aspect;camera.top=half+off;camera.bottom=-half+off;camera.updateProjectionMatrix();
 R.render(S,camera);if(++frames===4)window.__weatherReady=true;requestAnimationFrame(frame);}
addEventListener('resize',()=>R.setSize(innerWidth,innerHeight));requestAnimationFrame(frame);
