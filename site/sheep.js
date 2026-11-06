import * as THREE from 'three';import {createSheep,updateSheep,setWool,WOOL} from './sheepModel.js';
const R=new THREE.WebGLRenderer({antialias:true});R.setPixelRatio(Math.min(devicePixelRatio,2));R.setSize(innerWidth,innerHeight);R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;R.outputColorSpace=THREE.SRGBColorSpace;document.body.prepend(R.domElement);
const S=new THREE.Scene();S.background=new THREE.Color('#efe8da');
S.add(new THREE.HemisphereLight('#fffaf0','#a9b98a',1.7));const sun=new THREE.DirectionalLight('#fff1d6',1.7);sun.position.set(6,12,5);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.radius=10;sun.shadow.intensity=.55;sun.shadow.bias=-.0008;Object.assign(sun.shadow.camera,{left:-12,right:12,top:12,bottom:-12,near:.5,far:60});S.add(sun);
const c=document.createElement('canvas');c.width=c.height=512;const g=c.getContext('2d');g.fillStyle='#9cc26a';g.fillRect(0,0,512,512);
for(let i=0;i<5000;i++){g.fillStyle=Math.random()<.5?`rgba(70,110,40,${Math.random()*.08})`:`rgba(240,250,200,${Math.random()*.08})`;g.fillRect(Math.random()*512,Math.random()*512,2+Math.random()*3,2);}
for(let i=0;i<40;i++){g.fillStyle='rgba(236,200,90,.55)';g.fillRect(Math.random()*512,Math.random()*512,2,2);}
g.strokeStyle='rgba(60,90,40,.16)';g.lineWidth=2;for(let i=0;i<=512;i+=128){g.beginPath();g.moveTo(i,0);g.lineTo(i,512);g.moveTo(0,i);g.lineTo(512,i);g.stroke();}
const tex=new THREE.CanvasTexture(c);tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.repeat.set(6,6);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=8;
// torn-edge paper patch
const sh=new THREE.Shape();for(let i=0;i<=90;i++){const a=i/90*Math.PI*2,r=1+Math.sin(a*7)*.015+Math.sin(a*23)*.01;const x=Math.sign(Math.cos(a))*Math.pow(Math.abs(Math.cos(a)),.35)*13*r,y=Math.sign(Math.sin(a))*Math.pow(Math.abs(Math.sin(a)),.35)*10*r;i?sh.lineTo(x,y):sh.moveTo(x,y);}
const gg=new THREE.ExtrudeGeometry(sh,{depth:.4,bevelEnabled:true,bevelSize:.15,bevelThickness:.1,bevelSegments:2});gg.rotateX(-Math.PI/2);gg.translate(0,-.4,0);
const uv=gg.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)/26,uv.getY(i)/26);
const ground=new THREE.Mesh(gg,new THREE.MeshLambertMaterial({map:tex}));ground.receiveShadow=true;S.add(ground);
// contact shadow
const bc=document.createElement('canvas');bc.width=bc.height=128;const bg=bc.getContext('2d');const gr=bg.createRadialGradient(64,64,4,64,64,62);gr.addColorStop(0,'rgba(40,55,25,.28)');gr.addColorStop(1,'rgba(40,55,25,0)');bg.fillStyle=gr;bg.fillRect(0,0,128,128);
const blobM=new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(bc),transparent:true,depthWrite:false});const blobG=new THREE.PlaneGeometry(1.15,1.55);blobG.rotateX(-Math.PI/2);
const flock=[];function add(o,x,z,auto=true){const s=createSheep(o);s.position.set(x,0,z);s.rotation.y=Math.random()*6;const b=new THREE.Mesh(blobG,blobM);b.position.y=.02;S.add(s,b);flock.push({s,b,auto,st:'graze',tt:Math.random()*4,yaw:s.rotation.y});return s;}
const hero=add({woolColor:WOOL.krem,seed:1},0,0,false);hero.rotation.y=1.1;
const V=[[WOOL.krem,2,-4,-3],[WOOL.beyaz,3,4,-4],[WOOL.kara,4,-6,2],[WOOL.krem,5,5,3],[WOOL.pembe,0,-2,5],[WOOL.kahve,1,7,-1],[WOOL.beyaz,2,-8,-4],[WOOL.krem,3,2,7]];
V.forEach(([w,sd,x,z])=>add({woolColor:w,seed:sd},x,z));add({woolColor:WOOL.beyaz,seed:4,isLamb:true},-3.2,4.2);add({woolColor:WOOL.krem,seed:5,isLamb:true},1.4,1.6);
let act='idle';document.querySelectorAll('#acts button').forEach(b=>b.onclick=()=>{act=b.dataset.a;document.querySelectorAll('#acts button').forEach(x=>x.classList.toggle('on',x===b));});
const sw=document.getElementById('sw');Object.entries(WOOL).forEach(([k,v])=>{const b=document.createElement('button');b.style.background=v;b.title=k;b.onclick=()=>setWool(hero,v);sw.appendChild(b);});
const cam=new THREE.OrthographicCamera(-1,1,1,-1,.1,200);let view=1,zoom=9,tgt=new THREE.Vector3();
const VIEWS=[[0,30,.01,7],[14,14,16,6],[0,2.2,20,6],[3.2,2.6,4.2,1.9]];
function setView(v){view=v;document.querySelectorAll('#views button').forEach(x=>x.classList.toggle('on',+x.dataset.v===v));}
document.querySelectorAll('#views button').forEach(b=>b.onclick=()=>setView(+b.dataset.v));
function resize(){R.setSize(innerWidth,innerHeight);}addEventListener('resize',resize);
const q=new URLSearchParams(location.search);if(q.has('v'))setView(+q.get('v'));if(q.has('a'))act=q.get('a');
let last=performance.now();function frame(now){const dt=Math.min(.05,(now-last)/1000);last=now;
 for(const f of flock){const s=f.s;let st;if(!f.auto){st=act;if(act==='walk'){s.position.x+=Math.sin(s.rotation.y)*dt*.6;s.position.z+=Math.cos(s.rotation.y)*dt*.6;s.rotation.y+=dt*.25;}}
  else{f.tt-=dt;if(f.tt<0){f.st=Math.random()<.55?'graze':Math.random()<.7?'walk':'idle';f.tt=2+Math.random()*4;f.yaw+=(Math.random()-.5)*2;}st=f.st;
   if(Math.hypot(s.position.x,s.position.z)>9)f.yaw=Math.atan2(-s.position.x,-s.position.z);
   s.rotation.y+=(f.yaw-s.rotation.y)*dt*1.5;if(st==='walk'){s.position.x+=Math.sin(s.rotation.y)*dt*.55;s.position.z+=Math.cos(s.rotation.y)*dt*.55;}}
  updateSheep(s,st,dt,st==='walk'?.8:1);f.b.position.x=s.position.x;f.b.position.z=s.position.z;f.b.rotation.y=s.rotation.y;const hy=s.userData.body.position.y;f.b.scale.setScalar(s.scale.x*(1-Math.max(0,hy)*.9));}
 const vv=VIEWS[view];if(view===3)tgt.copy(hero.position).add(new THREE.Vector3(0,.5,0));else tgt.set(0,0,0);
 cam.position.set(tgt.x+vv[0],tgt.y+vv[1],tgt.z+vv[2]);cam.lookAt(tgt);const a=innerWidth/innerHeight,z=vv[3]*(a<1?1.6:1);cam.left=-z*a;cam.right=z*a;cam.top=z;cam.bottom=-z;cam.updateProjectionMatrix();
 R.render(S,cam);requestAnimationFrame(frame);}
requestAnimationFrame(frame);window.__flock=flock;
