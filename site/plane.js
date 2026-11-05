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
const plane=buildPlane({canopy:true});plane.traverse(o=>{if(o.isMesh)o.castShadow=!o.material.transparent||o.material.map;});plane.userData.blur.parent.children.forEach(o=>{if(o.material&&o.material.isMeshBasicMaterial)o.castShadow=false;});const holder=new THREE.Group();holder.add(plane);S.add(holder);
const cam=new THREE.OrthographicCamera(-1,1,1,-1,.1,300);
const st={x:0,z:0,y:3,head:0,vy:0,steer:0,climb:0,view:0,auto:true,speed:0,thr:.0,park:true};window.__pl=st;
const keys={};addEventListener('keydown',e=>{keys[e.key]=1;if(st.park&&/^Arrow|^[wasd]$/.test(e.key))togFly();if(e.key==='v'||e.key==='V')st.view=(st.view+1)%3;if(e.key==='c'||e.key==='C')togCan();if(e.key==='f'||e.key==='F')togFly();if(e.key==='+'||e.key==='e')st.thr=Math.min(1,st.thr+.1);if(e.key==='-'||e.key==='q')st.thr=Math.max(.15,st.thr-.1);st.auto=false;});addEventListener('keyup',e=>keys[e.key]=0);
const pad={};document.querySelectorAll('#pad button').forEach(b=>{const k=b.dataset.k;const on=e=>{e.preventDefault();e.stopPropagation();pad[k]=1;b.classList.add('on');st.auto=false;if(st.park)togFly();};const off=e=>{pad[k]=0;b.classList.remove('on');};b.addEventListener('pointerdown',on);b.addEventListener('pointerup',off);b.addEventListener('pointercancel',off);b.addEventListener('pointerleave',off);});
const thrEl=document.getElementById('thr');thrEl.addEventListener('input',()=>{st.thr=thrEl.value/100;st.auto=false;});
let drag=null;addEventListener('pointerdown',e=>{if(e.target.closest('button,a,input,#thrW'))return;if(st.park)togFly();drag={x:e.clientX,y:e.clientY};st.auto=false;});addEventListener('pointermove',e=>{if(!drag)return;const s=Math.min(innerWidth,innerHeight)*.25;st.steer=THREE.MathUtils.clamp((e.clientX-drag.x)/s,-1,1);st.climb=THREE.MathUtils.clamp(-(e.clientY-drag.y)/s,-1,1);});addEventListener('pointercancel',()=>{drag=null;st.steer=0;st.climb=0;});addEventListener('pointerup',()=>{drag=null;st.steer=0;st.climb=0;});
const U=plane.userData;function togCan(){U.canopyOpen=!U.canopyOpen;}
function togFly(){st.park=!st.park;if(st.park){U.canopyOpen=true;st.thr=0;}else{U.canopyOpen=false;st.thr=Math.max(st.thr,thrEl?thrEl.value/100:.7,.3);st.vy=2.5;}}window.__tog={togCan,togFly};
document.getElementById('bCan').onclick=togCan;document.getElementById('bFly').onclick=togFly;
// wingtip trails: fading ribbons in world space
const TN=60;const trails=U.tips.map(()=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(TN*2*3),3));g.setAttribute('a',new THREE.BufferAttribute(new Float32Array(TN*2),1));const ix=[];for(let i=0;i<TN-1;i++){const a=i*2;ix.push(a,a+1,a+2,a+1,a+3,a+2);}g.setIndex(ix);
 const m=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,uniforms:{op:{value:0}},vertexShader:'attribute float a;varying float va;void main(){va=a;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform float op;varying float va;void main(){gl_FragColor=vec4(1.,1.,1.,va*op);}'});
 const me=new THREE.Mesh(g,m);me.frustumCulled=false;S.add(me);return {g,m,pts:[]};});
const _v=new THREE.Vector3();function trailTick(spd){const sk=THREE.MathUtils.smoothstep(spd,3,10);const n=Math.round(10+sk*(TN-10));
 U.tips.forEach((tp,k)=>{const T=trails[k];tp.getWorldPosition(_v);T.pts.unshift(_v.clone());if(T.pts.length>TN)T.pts.pop();T.m.uniforms.op.value=.75*sk;
  const P=T.g.attributes.position,A=T.g.attributes.a;for(let i=0;i<TN;i++){const q=T.pts[Math.min(i,T.pts.length-1)];const w=(.03*(1-i/TN)+.006)*Math.max(1,vh/9);P.setXYZ(i*2,q.x-w,q.y,q.z);P.setXYZ(i*2+1,q.x+w,q.y,q.z);const al=i<n?(1-i/n):0;A.setX(i*2,al);A.setX(i*2+1,al);}P.needsUpdate=A.needsUpdate=true;});}
document.querySelectorAll('#views button[data-v]').forEach(b=>b.onclick=()=>{st.view=+b.dataset.v;});
let vh=10;function fit(){const w=vh*innerWidth/innerHeight;cam.left=-w/2;cam.right=w/2;cam.top=vh/2;cam.bottom=-vh/2;cam.updateProjectionMatrix();}
addEventListener('resize',()=>{R.setSize(innerWidth,innerHeight);fit();});
const clk=new THREE.Clock();let t=0;const altEl=document.getElementById('alt');
function frame(){requestAnimationFrame(frame);const dt=Math.min(clk.getDelta(),.05);t+=dt;
 let steer=st.steer,climb=st.climb;if(pad.L)steer=-1;if(pad.R)steer=1;if(pad.U)climb=1;if(pad.D)climb=-1;if(keys.ArrowLeft||keys.a)steer=-1;if(keys.ArrowRight||keys.d)steer=1;if(keys.ArrowUp||keys.w)climb=1;if(keys.ArrowDown||keys.s)climb=-1;
 if(st.park){steer=0;climb=0;}else if(st.auto&&!drag&&!pad.L&&!pad.R&&!pad.U&&!pad.D){steer=Math.sin(t*.35)*.7;climb=THREE.MathUtils.clamp((3.5+Math.sin(t*.25)*1.5-st.y)*.5,-1,1);}
 if(st.force){steer=st.force.steer;climb=st.force.climb;}
 st.speed+=((st.park?0:3+st.thr*9)-st.speed)*(1-Math.exp(-dt*1.5));
 st.head-=steer*dt*.9*Math.min(1,st.speed/4);st.vy+=(climb*3-st.vy)*(1-Math.exp(-dt*3));st.y=st.park?THREE.MathUtils.lerp(st.y,.22,1-Math.exp(-dt*2)):THREE.MathUtils.clamp(st.y+st.vy*dt,1.2,30);if(st.y<=1.2||st.y>=30)st.vy*=.5;
 st.x+=-Math.sin(st.head)*st.speed*dt;st.z+=-Math.cos(st.head)*st.speed*dt;
 holder.position.set(st.x,st.y,st.z);holder.rotation.y=st.head;plane.userData.tick(dt,{steer,climb:THREE.MathUtils.clamp(st.vy/3,-1,1),throttle:st.park?0:st.thr,input:climb});trailTick(st.speed);plane.traverse(o=>{if(o.isSprite){o.userData.s0??=o.scale.x;o.scale.setScalar(o.userData.s0*Math.max(1,vh/10));}});
 // shadow: blob grows & fades with altitude
 const a=st.y;blob.position.set(st.x+a*.12,.01,st.z+a*.08);blob.scale.setScalar(3.2+a*.35);blob.material.opacity=THREE.MathUtils.clamp(1.05-a/22,.15,.9);
 sun.position.set(st.x+3,st.y+30,st.z+2);sun.target.position.set(st.x,0,st.z);
 // camera: altitude-linked ortho zoom; slight 3/4 tilt when low
 U.pilotOn=!st.park;vh=THREE.MathUtils.lerp(vh,st.park?(st.view===0?6:4.2):st.view===2?7:7.5+a*.9,1-Math.exp(-dt*3));fit();
 const tgt=new THREE.Vector3(st.x,a*.5,st.z);
 if(st.view===0){const tilt=THREE.MathUtils.clamp(.35-a*.012,.05,.35);cam.position.set(st.x,a+60,st.z+60*tilt);cam.up.set(0,0,-1);}
 else if(st.view===1){cam.position.set(st.x+40,a+(st.park?55:45),st.z+40);if(st.park)tgt.set(st.x,.6,st.z-.3);cam.up.set(0,1,0);}
 else {cam.position.set(st.x+60*Math.cos(st.head),a+4,st.z-60*Math.sin(st.head));cam.up.set(0,1,0);tgt.y=a;}
 cam.lookAt(tgt);altEl.textContent='✈ '+(st.park?'Hangarda · kanopi '+(U.canopyOpen?'açık':'kapalı'):'irtifa '+a.toFixed(1)+' · gaz '+Math.round(st.thr*100)+'%');
 R.render(S,cam);}
fit();frame();
