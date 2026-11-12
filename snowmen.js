import * as THREE from 'three';
import {createSnowman,updateSnowman,SNOWMAN_KINDS} from './snowmanModel.js';
import {makeFeltMaterial} from './sheepModel.js';
const q=new URLSearchParams(location.search);let view=Math.max(0,Math.min(3,Number(q.get('v')??1)|0)),kind=['mix','pair',...SNOWMAN_KINDS].includes(q.get('k'))?q.get('k'):'mix',act=q.get('a')==='wobble'?'wobble':'idle';
const R=new THREE.WebGLRenderer({antialias:true});R.setPixelRatio(Math.min(devicePixelRatio,2));R.setSize(innerWidth,innerHeight);R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;R.outputColorSpace=THREE.SRGBColorSpace;document.body.prepend(R.domElement);
const S=new THREE.Scene();S.background=new THREE.Color('#efe8da');S.add(new THREE.HemisphereLight('#fff9ed','#98a38e',1.7));const sun=new THREE.DirectionalLight('#fff7ed',1.8);sun.position.set(-8,18,12);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-6,right:6,top:6,bottom:-6,near:1,far:60});sun.shadow.bias=-.0003;sun.shadow.normalBias=.015;S.add(sun);
const c=document.createElement('canvas');c.width=c.height=512;const x=c.getContext('2d');x.fillStyle='#a5b98c';x.fillRect(0,0,512,512);let sd=11;const rnd=()=>((sd=Math.imul(sd,1664525)+1013904223>>>0)/4294967296);for(let i=0;i<14000;i++){x.fillStyle=rnd()<.5?'#6d89570d':'#fff7cf14';x.fillRect(rnd()*512,rnd()*512,2,1);}x.strokeStyle='#5c77492b';for(let i=0;i<=512;i+=64){x.beginPath();x.moveTo(i,0);x.lineTo(i,512);x.moveTo(0,i);x.lineTo(512,i);x.stroke();}
const tex=new THREE.CanvasTexture(c);tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.repeat.set(12,12);tex.colorSpace=THREE.SRGBColorSpace;
const ground=new THREE.Mesh(new THREE.BoxGeometry(90,.16,90),new THREE.MeshLambertMaterial({map:tex}));ground.position.y=-.08;ground.receiveShadow=true;S.add(ground);
// modest worn snow patch (felt), irregular edge
function patch(rad,seed){const sh=new THREE.Shape(),n=28,r=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);for(let i=0;i<=n;i++){const a=i/n*Math.PI*2,rr=rad*(.85+r()*.22);i?sh.lineTo(Math.cos(a)*rr,Math.sin(a)*rr):sh.moveTo(rr,0);}
 const g=new THREE.ExtrudeGeometry(sh,{depth:.03,bevelEnabled:true,bevelSize:.05,bevelThickness:.02,bevelSegments:2});g.rotateX(-Math.PI/2);const n2=g.attributes.position.count,col=new Float32Array(n2*3).fill(.97);g.setAttribute('color',new THREE.BufferAttribute(col,3));const m=new THREE.Mesh(g,makeFeltMaterial('#f4efe4'));m.receiveShadow=true;return m;}
let group;function build(){if(group)S.remove(group);group=new THREE.Group();
 const list=kind==='mix'?[['two',1,1,-1.05],['three',2,1,1.05]]:kind==='pair'?[['two',3,1,-.75],['two',6,.6,.75]]:[[kind,kind==='two'?1:2,1,0]];
 for(const[k,s,sc,px]of list){const sm=createSnowman({kind:k,seed:s,scale:sc});sm.position.x=px;group.add(sm);}
 const p=patch(list.length>1?1.45:.9,7);group.add(p);S.add(group);buttons();}
function sync(){const u=new URLSearchParams(location.search);u.set('v',view);u.set('k',kind);u.set('a',act);history.replaceState(null,'','?'+u);}
function buttons(){for(const[sel,key,val]of[['#views','v',String(view)],['#kinds','k',kind],['#acts','a',act]])document.querySelectorAll(sel+' button').forEach(b=>b.classList.toggle('on',b.dataset[key]===val));sync();}
document.querySelectorAll('[data-v]').forEach(b=>b.onclick=()=>{view=+b.dataset.v;buttons();});document.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{kind=b.dataset.k;build();});document.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>{act=b.dataset.a;buttons();});
addEventListener('keydown',e=>{if(e.key>='1'&&e.key<='4'){view=+e.key-1;buttons();}});build();
const camera=new THREE.OrthographicCamera(-1,1,1,-1,.1,150);
function hudFree(){const Hh=innerHeight,top=document.querySelector('#hud').getBoundingClientRect().bottom+8,bot=document.querySelector('#kinds').getBoundingClientRect().top-8;return{top,bot,W:innerWidth,Hh};}
let last=performance.now(),frames=0;function frame(now){const dt=Math.min(.05,(now-last)/1000);last=now;group.children.forEach(o=>{if(o.userData.root)updateSnowman(o,dt,act);});
 const multi=group.children.length>2,tall=kind==='three'||kind==='mix'?2.05:1.8;
 const v=[[0,35,.001],[14,12,20],[20,1.2,.001],[3,1.2,10]][view];
 const target=view===3?new THREE.Vector3(multi?-1.05:0,tall*.78,0):new THREE.Vector3(0,view===0?0:tall*.5,0);
 camera.position.set(target.x+v[0],target.y+v[1],target.z+v[2]);camera.lookAt(target);
 const span=view===3?.55:view===0?(multi?2.1:1.2):tall*.62+.15;
 const{top,bot,W,Hh}=hudFree();const freeH=Math.max(120,bot-top),aspect=W/Hh;let half=span*Hh/freeH;const wide=view===3?.9:multi?2.6:1.2;if(half*aspect<wide)half=wide/aspect;
 const off=((Hh/2)-(top+bot)/2)/Hh*2*half;camera.left=-half*aspect;camera.right=half*aspect;camera.top=half+off;camera.bottom=-half+off;camera.updateProjectionMatrix();
 R.render(S,camera);if(++frames===4)window.__snowmanReady=true;requestAnimationFrame(frame);}
addEventListener('resize',()=>R.setSize(innerWidth,innerHeight));requestAnimationFrame(frame);
