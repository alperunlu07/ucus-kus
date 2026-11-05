import * as THREE from 'three';import {buildPlane} from './planeModel.js';
const R=new THREE.WebGLRenderer({antialias:true});R.setPixelRatio(Math.min(devicePixelRatio,2));R.setSize(innerWidth,innerHeight);R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;R.outputColorSpace=THREE.SRGBColorSpace;document.body.prepend(R.domElement);
const S=new THREE.Scene();S.background=new THREE.Color('#efe8da');
S.add(new THREE.HemisphereLight('#fffaf0','#cfc3ad',1.6));const sun=new THREE.DirectionalLight('#fff3dc',1.6);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.radius=6;sun.shadow.bias=-.0006;
Object.assign(sun.shadow.camera,{left:-8,right:8,top:8,bottom:-8,near:.5,far:80});S.add(sun,sun.target);
// paper grid
const c=document.createElement('canvas');c.width=c.height=512;const g=c.getContext('2d');g.fillStyle='#f3ecdf';g.fillRect(0,0,512,512);
for(let i=0;i<4000;i++){g.fillStyle=`rgba(120,100,70,${Math.random()*.035})`;g.fillRect(Math.random()*512,Math.random()*512,2,2);}
g.strokeStyle='rgba(150,130,105,.22)';g.lineWidth=1;for(let i=0;i<=512;i+=64){g.beginPath();g.moveTo(i,0);g.lineTo(i,512);g.moveTo(0,i);g.lineTo(512,i);g.stroke();}
g.strokeStyle='rgba(140,118,92,.45)';g.lineWidth=3;g.strokeRect(0,0,512,512);
const tex=new THREE.CanvasTexture(c);tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.repeat.set(100,100);tex.anisotropy=8;tex.colorSpace=THREE.SRGBColorSpace;
const ground=new THREE.Mesh(new THREE.PlaneGeometry(800,800),new THREE.MeshLambertMaterial({map:tex}));ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;S.add(ground);// 1 cell = 8u, thin lines 1u
// contact blob shadow
const bc=document.createElement('canvas');bc.width=bc.height=128;const bg=bc.getContext('2d');const gr=bg.createRadialGradient(64,64,4,64,64,62);gr.addColorStop(0,'rgba(60,45,35,.55)');gr.addColorStop(1,'rgba(60,45,35,0)');bg.fillStyle=gr;bg.fillRect(0,0,128,128);
const blob=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(bc),transparent:true,depthWrite:false}));blob.rotation.x=-Math.PI/2;S.add(blob);
const plane=buildPlane();plane.traverse(o=>{if(o.isMesh)o.castShadow=!o.material.transparent||o.material.map;});plane.userData.blur.parent.children.forEach(o=>{if(o.material&&o.material.isMeshBasicMaterial)o.castShadow=false;});const holder=new THREE.Group();holder.add(plane);S.add(holder);
const cam=new THREE.OrthographicCamera(-1,1,1,-1,.1,300);
const st={x:0,z:0,y:3,head:0,vy:0,steer:0,climb:0,view:0,auto:true,speed:6};window.__pl=st;
const keys={};addEventListener('keydown',e=>{keys[e.key]=1;if(e.key==='v'||e.key==='V')st.view=(st.view+1)%3;st.auto=false;});addEventListener('keyup',e=>keys[e.key]=0);
let drag=null;addEventListener('pointerdown',e=>{if(e.target.tagName==='BUTTON'||e.target.tagName==='A')return;drag={x:e.clientX,y:e.clientY};st.auto=false;});addEventListener('pointermove',e=>{if(!drag)return;const s=Math.min(innerWidth,innerHeight)*.25;st.steer=THREE.MathUtils.clamp((e.clientX-drag.x)/s,-1,1);st.climb=THREE.MathUtils.clamp(-(e.clientY-drag.y)/s,-1,1);});addEventListener('pointerup',()=>{drag=null;st.steer=0;st.climb=0;});
document.querySelectorAll('#views button').forEach(b=>b.onclick=()=>{st.view=+b.dataset.v;});
let vh=10;function fit(){const w=vh*innerWidth/innerHeight;cam.left=-w/2;cam.right=w/2;cam.top=vh/2;cam.bottom=-vh/2;cam.updateProjectionMatrix();}
addEventListener('resize',()=>{R.setSize(innerWidth,innerHeight);fit();});
const clk=new THREE.Clock();let t=0;const altEl=document.getElementById('alt');
function frame(){requestAnimationFrame(frame);const dt=Math.min(clk.getDelta(),.05);t+=dt;
 let steer=st.steer,climb=st.climb;if(keys.ArrowLeft||keys.a)steer=-1;if(keys.ArrowRight||keys.d)steer=1;if(keys.ArrowUp||keys.w)climb=1;if(keys.ArrowDown||keys.s)climb=-1;
 if(st.auto&&!drag){steer=Math.sin(t*.35)*.6;climb=Math.sin(t*.22)*.5;}
 if(st.force){steer=st.force.steer;climb=st.force.climb;}
 st.head-=steer*dt*.9;st.vy+=(climb*3-st.vy)*(1-Math.exp(-dt*3));st.y=THREE.MathUtils.clamp(st.y+st.vy*dt,1.2,30);if(st.y<=1.2||st.y>=30)st.vy*=.5;
 st.x+=-Math.sin(st.head)*st.speed*dt;st.z+=-Math.cos(st.head)*st.speed*dt;
 holder.position.set(st.x,st.y,st.z);holder.rotation.y=st.head;plane.userData.tick(dt,{steer,climb:THREE.MathUtils.clamp(st.vy/3,-1,1),spin:1});
 // shadow: blob grows & fades with altitude
 const a=st.y;blob.position.set(st.x+a*.12,.01,st.z+a*.08);blob.scale.setScalar(3.2+a*.35);blob.material.opacity=THREE.MathUtils.clamp(1.05-a/22,.15,.9);
 sun.position.set(st.x+3,st.y+30,st.z+2);sun.target.position.set(st.x,0,st.z);
 // camera: altitude-linked ortho zoom; slight 3/4 tilt when low
 vh=THREE.MathUtils.lerp(vh,st.view===2?7:7.5+a*.9,1-Math.exp(-dt*3));fit();
 const tgt=new THREE.Vector3(st.x,a*.5,st.z);
 if(st.view===0){const tilt=THREE.MathUtils.clamp(.35-a*.012,.05,.35);cam.position.set(st.x,a+60,st.z+60*tilt);cam.up.set(0,0,-1);}
 else if(st.view===1){cam.position.set(st.x+40,a+45,st.z+40);cam.up.set(0,1,0);}
 else {cam.position.set(st.x+60*Math.cos(st.head),a+4,st.z-60*Math.sin(st.head));cam.up.set(0,1,0);tgt.y=a;}
 cam.lookAt(tgt);altEl.textContent='✈ Uçak atölyesi · irtifa '+a.toFixed(1);
 R.render(S,cam);}
fit();frame();
