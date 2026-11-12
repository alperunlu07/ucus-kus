import * as THREE from 'three';
import {createPlot,createFlowerPatch,createHayBale,createForestFloor,updateField,FIELD_KINDS} from './fieldModel.js';
const q=new URLSearchParams(location.search);let view=Math.max(0,Math.min(3,Number(q.get('v')??1))),kind=q.get('k')||'rice',life=q.get('a')!=='0',focus=q.get('focus')||'';
if(kind!=='mix'&&!FIELD_KINDS.includes(kind))kind='rice';
const R=new THREE.WebGLRenderer({antialias:true});R.setPixelRatio(Math.min(devicePixelRatio,2));R.setSize(innerWidth,innerHeight);R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;R.outputColorSpace=THREE.SRGBColorSpace;document.body.prepend(R.domElement);
const S=new THREE.Scene();S.background=new THREE.Color('#efe8da');S.add(new THREE.HemisphereLight('#fff9ed','#8f9a84',1.6));const sun=new THREE.DirectionalLight('#fff5e6',1.95);sun.position.set(-9,16,11);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-14,right:14,top:14,bottom:-14,near:1,far:65});sun.shadow.bias=-.00025;sun.shadow.normalBias=.012;sun.shadow.radius=3;S.add(sun);
const c=document.createElement('canvas');c.width=c.height=512;const ctx=c.getContext('2d');ctx.fillStyle='#a5b98c';ctx.fillRect(0,0,512,512);let sd=11;const rnd=()=>((sd=Math.imul(sd,1664525)+1013904223>>>0)/4294967296);for(let i=0;i<14000;i++){ctx.fillStyle=rnd()<.5?'#6d89570d':'#fff7cf14';ctx.fillRect(rnd()*512,rnd()*512,2,1);}ctx.strokeStyle='#5c77492b';for(let i=0;i<=512;i+=64){ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i,512);ctx.moveTo(0,i);ctx.lineTo(512,i);ctx.stroke();}const tex=new THREE.CanvasTexture(c);tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.repeat.set(12,12);tex.colorSpace=THREE.SRGBColorSpace;
const ground=new THREE.Mesh(new THREE.BoxGeometry(90,.16,90),new THREE.MeshLambertMaterial({map:tex}));ground.position.y=-.08;ground.receiveShadow=true;S.add(ground);
let root;const make=k=>k==='flowers'?createFlowerPatch({seed:4,w:4.6,d:3.4}):k==='forest'?createForestFloor({seed:6,w:4.6,d:3.4}):k==='hay'?createHayBale({group:3}):createPlot({kind:k,seed:3});
function build(){if(root){S.remove(root);root.traverse(m=>{if(m.isMesh)m.geometry.dispose();});}root=new THREE.Group();
 if(kind==='mix'){const L=[['rice',-7,-4.6],['autumn',0,-4.6],['mustard',7,-4.6],['pampa',-7.5,1.6],['savanna',0,1.6],['flowers',6.2,1.4],['forest',6.2,5.8]];for(const [k,x,z] of L){const o=k==='flowers'?createFlowerPatch({seed:4,w:4.4,d:3.2}):k==='forest'?createForestFloor({seed:6,w:4.4,d:3}):createPlot({kind:k,seed:x*3+z|0});o.position.set(x,0,z);root.add(o);}}
 else if(focus==='hay'){root.add(createHayBale({group:3}));}else root.add(make(kind));S.add(root);
 document.querySelectorAll('[data-k]').forEach(b=>b.classList.toggle('on',b.dataset.k===kind&&!focus));document.querySelectorAll('[data-v]').forEach(b=>b.classList.toggle('on',+b.dataset.v===view));document.querySelectorAll('[data-a]').forEach(b=>b.classList.toggle('on',(b.dataset.a==='1')===life));}
build();
const sync=()=>{const u=new URLSearchParams();u.set('v',view);u.set('k',kind);u.set('a',life?1:0);if(focus)u.set('focus',focus);history.replaceState(null,'','?'+u);};
document.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{kind=b.dataset.k;focus='';build();sync();});document.querySelectorAll('[data-v]').forEach(b=>b.onclick=()=>{view=+b.dataset.v;build();sync();});document.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>{life=b.dataset.a==='1';build();sync();});
addEventListener('keydown',e=>{if('1234'.includes(e.key)&&e.key){view=+e.key-1;build();sync();}});
const camera=new THREE.OrthographicCamera(-1,1,1,-1,.1,200);addEventListener('resize',()=>R.setSize(innerWidth,innerHeight));
let t=0,last=performance.now();
function frame(now){const dt=Math.min(.05,(now-last)/1000);last=now;if(life)t+=dt;updateField(root,t,life?1:0);
 const mix=kind==='mix',hay=focus==='hay';const target=new THREE.Vector3(0,view>=2?(hay?.4:.2):0,mix?1.2:(kind==='pampa'&&!hay?0:0));if(kind==='pampa'&&!hay){target.x=view===3?1.3:.9;target.z=view===3?.4:0;}
 const vectors=[[0,35,.001],[20,21,26],[14,1.4,0],[5,3.6,6.5]];const v=vectors[view];camera.position.set(target.x+v[0],target.y+v[1],target.z+v[2]);camera.lookAt(target);
 const a=innerWidth/innerHeight;const base=mix?(view===3?6:view===0?10:8.6):hay?(view===3?1.6:2.2):view===3?2.3:view===2?2.2:4.4;const span=base*Math.max(1,(mix?1.05:.95)/a)*(a<.7?.82:1);camera.left=-span*a;camera.right=span*a;camera.top=span;camera.bottom=-span;camera.updateProjectionMatrix();
 R.render(S,camera);window.__fieldReady=true;requestAnimationFrame(frame);}requestAnimationFrame(frame);
