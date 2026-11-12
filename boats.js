import * as THREE from 'three';
import {createBoat,updateBoat,createPier,createBoatyard,BOAT_PALETTES} from './boatModel.js';
const q=new URLSearchParams(location.search);let view=Math.max(0,Math.min(3,Number(q.get('v')||1))),type=Math.max(0,Math.min(3,Number(q.get('t')||0))),pal=Math.max(0,Math.min(3,Number(q.get('b')||0))),life=q.get('a')!=='0'&&q.get('a')!==null?true:q.get('a')===null;
const leftover=new URLSearchParams(q);for(const k of ['v','t','b','a'])leftover.delete(k);document.querySelector('#back').href='./'+(leftover.size?'?'+leftover:'');
const R=new THREE.WebGLRenderer({antialias:true});R.setPixelRatio(Math.min(devicePixelRatio,2));R.setSize(innerWidth,innerHeight);R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;R.outputColorSpace=THREE.SRGBColorSpace;document.body.prepend(R.domElement);
const S=new THREE.Scene();S.background=new THREE.Color('#efe8da');S.add(new THREE.HemisphereLight('#fff9ed','#98a38e',1.8));const sun=new THREE.DirectionalLight('#fff7ed',1.75);sun.position.set(-8,18,12);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-10,right:10,top:10,bottom:-10,near:1,far:65});sun.shadow.bias=-.00025;sun.shadow.normalBias=.012;sun.shadow.radius=3;S.add(sun);
function paperTex(base,dots,lines,seed,rep){const c=document.createElement('canvas');c.width=c.height=512;const x=c.getContext('2d');x.fillStyle=base;x.fillRect(0,0,512,512);let sd=seed;const rnd=()=>((sd=Math.imul(sd,1664525)+1013904223>>>0)/4294967296);for(let i=0;i<14000;i++){x.fillStyle=rnd()<.5?dots[0]:dots[1];x.fillRect(rnd()*512,rnd()*512,2,1);}if(lines){x.strokeStyle=lines;for(let i=0;i<=512;i+=64){x.beginPath();x.moveTo(i,0);x.lineTo(i,512);x.moveTo(0,i);x.lineTo(512,i);x.stroke();}}const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(...rep);t.colorSpace=THREE.SRGBColorSpace;return [t,x,c];}
const [tex]=paperTex('#a5b98c',['#6d89570d','#fff7cf14'],'#5c77492b',11,[12.5,12]);
const ground=new THREE.Mesh(new THREE.BoxGeometry(90,.16,90),new THREE.MeshLambertMaterial({map:tex}));ground.position.y=-.09-0.0;ground.receiveShadow=true;S.add(ground);
// paper water: shallow cut-out pool, top at y=0 so boats sit at their waterline
const [wt,wx]=paperTex('#8fb9c0',['#5f8f9a12','#ffffff18'],null,5,[3,3]);wx.strokeStyle='#ffffff40';wx.lineWidth=3;for(let i=0;i<26;i++){const y=(i*37)%512,x0=(i*91)%460;wx.beginPath();wx.moveTo(x0,y);wx.quadraticCurveTo(x0+20,y-6,x0+44,y);wx.stroke();}wt.needsUpdate=true;
const waterMat=new THREE.MeshLambertMaterial({map:wt});const water=new THREE.Mesh(new THREE.BoxGeometry(1,.1,1),waterMat);water.receiveShadow=true;S.add(water);
const rim=new THREE.Mesh(new THREE.BoxGeometry(1,.06,1),new THREE.MeshLambertMaterial({color:'#e6d6b4'}));S.add(rim);
const cc=document.createElement('canvas');cc.width=cc.height=128;const cx=cc.getContext('2d'),grad=cx.createRadialGradient(64,64,10,64,64,64);grad.addColorStop(0,'rgba(30,55,60,.3)');grad.addColorStop(.6,'rgba(30,55,60,.14)');grad.addColorStop(1,'rgba(30,55,60,0)');cx.fillStyle=grad;cx.fillRect(0,0,128,128);const contactMat=new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(cc),transparent:true,depthWrite:false});
const ripMat=new THREE.MeshBasicMaterial({color:'#e9f2ef',transparent:true,opacity:.55,depthWrite:false});function ripple(parent,l,w){for(const [k,o] of [[1,.55],[1.25,.3]]){const r=new THREE.Mesh(new THREE.RingGeometry(.93,1,48),ripMat.clone());r.material.opacity=o;r.rotation.x=-Math.PI/2;r.scale.set(w*.56*k,l*.52*k,1);r.position.y=.008;parent.add(r);}}
function contact(parent,w,d,x=0,z=0){const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),contactMat);m.rotation.x=-Math.PI/2;m.position.set(x,.006,z);m.renderOrder=1;parent.add(m);}
let fitBox=new THREE.Box3(),obj,boats=[],fitR=2,center=new THREE.Vector3();
function build(){if(obj){S.remove(obj);obj.traverse(m=>{if(m.isMesh&&m.material!==contactMat)m.geometry.dispose();});}boats=[];
 if(type===0||type===3){obj=new THREE.Group();const b=createBoat({seed:2,kind:type===3?'skiff':'sail',palette:pal});b.rotation.y=-.5;obj.add(b);boats.push(b);contact(obj,1.6,2.9);const rp=new THREE.Group();rp.rotation.y=b.rotation.y;ripple(rp,b.userData.length,b.userData.width);obj.add(rp);}
 else if(type===1){obj=createPier({seed:3});obj.position.z=-obj.userData.length/2;}
 else{obj=createBoatyard({seed:2,palette:pal});obj.position.z=-obj.userData.length/2;boats.push(obj.userData.boat);contact(obj.userData.boat,1.5,2.8);const bt=obj.userData.boat,rp=new THREE.Group();rp.position.copy(bt.position);rp.rotation.y=bt.rotation.y;ripple(rp,bt.userData.length,bt.userData.width);obj.add(rp);}
 S.add(obj);const bb=new THREE.Box3().setFromObject(obj);bb.getCenter(center);const sz=bb.getSize(new THREE.Vector3());
 if(type===1||type===2){const L=type===2?obj.userData.length:obj.userData.length,x0=bb.min.x-.9,x1=bb.max.x+1.1,z0=-L/2+L*.3,z1=L/2+1.1;water.scale.set(x1-x0,1,z1-z0);water.position.set((x0+x1)/2,-.05,(z0+z1)/2);}else{water.scale.set(3.6,1,4);water.position.set(0,-.05,0);}
 water.visible=rim.visible=true;rim.scale.set(water.scale.x+.16,1,water.scale.z+.16);rim.position.set(water.position.x,-.04,water.position.z);
 center.y=Math.max(.4,Math.min(center.y,sz.y*.42));const vis=new THREE.Box3().setFromObject(obj);vis.min.y=Math.max(vis.min.y,0);fitR=vis.getBoundingSphere(new THREE.Sphere()).radius;fitBox=vis;buttons();}
function buttons(){for(const [sel,key,val] of [['#views','v',view],['#types','t',type],['#palette','b',pal],['#life','a',+life]])document.querySelectorAll(sel+' button').forEach(b=>{const on=+b.dataset[key]===val;b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on));});}
for(const [i,p] of BOAT_PALETTES.entries()){const b=document.createElement('button');b.textContent=p.name;b.dataset.b=i;document.querySelector('#palette').append(b);b.onclick=()=>{pal=i;build();};}
document.querySelectorAll('[data-v]').forEach(b=>b.onclick=()=>{view=+b.dataset.v;buttons();});document.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{type=+b.dataset.t;build();});document.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>{life=!!+b.dataset.a;buttons();});
addEventListener('keydown',e=>{if(e.key>='1'&&e.key<='4'){view=+e.key-1;buttons();}});build();
const camera=new THREE.OrthographicCamera(-1,1,1,-1,.1,150);let last=performance.now(),n=0;
function frame(now){const dt=Math.min(.05,(now-last)/1000);last=now;for(const b of boats)updateBoat(b,dt,life?1:0);
 const vectors=[[0,35,.001],[22,23,28],[24,2.5,0],[8,5,10]];const v=vectors[view];const tgt=center.clone();if(view===0)tgt.y=0;camera.position.set(tgt.x+v[0],tgt.y+v[1],tgt.z+v[2]);camera.lookAt(tgt);
 // frame the real projected bounds inside the area left free by the HUD (top) and controls (bottom)
 camera.updateMatrixWorld();const inv=camera.matrixWorldInverse;let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;for(let i=0;i<8;i++){const p=new THREE.Vector3(i&1?fitBox.max.x:fitBox.min.x,i&2?fitBox.max.y:fitBox.min.y,i&4?fitBox.max.z:fitBox.min.z).applyMatrix4(inv);x0=Math.min(x0,p.x);x1=Math.max(x1,p.x);y0=Math.min(y0,p.y);y1=Math.max(y1,p.y);}
 const W=innerWidth,Hh=innerHeight,asp=W/Hh,mob=W<600;const top=mob?130:110,bot=mob?(document.querySelector('#controls').offsetHeight+24):130,side=mob?16:110;const zoom=view===3?(type===1||type===2?.62:.8):1;
 const uw=(W-2*side)/W,uh=(Hh-top-bot)/Hh;let h=Math.max((y1-y0)/2/uh,(x1-x0)/2/asp/uw)*1.06*zoom;const cxp=(x0+x1)/2,cyp=(y0+y1)/2,shift=(bot-top)/Hh*h;
 camera.left=cxp-h*asp;camera.right=cxp+h*asp;camera.top=cyp+h-shift;camera.bottom=cyp-h-shift;camera.updateProjectionMatrix();
 R.render(S,camera);if(++n===3)window.__boatReady=true;requestAnimationFrame(frame);}
addEventListener('resize',()=>R.setSize(innerWidth,innerHeight));requestAnimationFrame(frame);
