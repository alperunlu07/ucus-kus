import * as THREE from 'three';import {createTrain,updateTrain} from './trainModel.js';
const R=new THREE.WebGLRenderer({antialias:true});R.setPixelRatio(Math.min(devicePixelRatio,2));R.setSize(innerWidth,innerHeight);R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;R.outputColorSpace=THREE.SRGBColorSpace;document.body.prepend(R.domElement);
const S=new THREE.Scene();S.background=new THREE.Color('#efe8da');
S.add(new THREE.HemisphereLight('#fffaf0','#c3b59b',1.15));const sun=new THREE.DirectionalLight('#fff4e5',1.8);sun.position.set(6,12,5);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.radius=8;sun.shadow.intensity=.5;sun.shadow.bias=-.0003;sun.shadow.normalBias=.018;Object.assign(sun.shadow.camera,{left:-14,right:14,top:14,bottom:-14,near:.5,far:60});S.add(sun);
const c=document.createElement('canvas');c.width=c.height=512;const g=c.getContext('2d');g.fillStyle='#9cc26a';g.fillRect(0,0,512,512);
for(let i=0;i<5000;i++){g.fillStyle=Math.random()<.5?`rgba(70,110,40,${Math.random()*.08})`:`rgba(240,250,200,${Math.random()*.08})`;g.fillRect(Math.random()*512,Math.random()*512,2+Math.random()*3,2);}
g.strokeStyle='rgba(60,90,40,.16)';g.lineWidth=2;for(let i=0;i<=512;i+=128){g.beginPath();g.moveTo(i,0);g.lineTo(i,512);g.moveTo(0,i);g.lineTo(512,i);g.stroke();}
const tex=new THREE.CanvasTexture(c);tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=8;
const sh=new THREE.Shape();for(let i=0;i<=90;i++){const a=i/90*Math.PI*2,r=1+Math.sin(a*7)*.015+Math.sin(a*23)*.01;const x=Math.sign(Math.cos(a))*Math.pow(Math.abs(Math.cos(a)),.35)*15*r,y=Math.sign(Math.sin(a))*Math.pow(Math.abs(Math.sin(a)),.35)*8*r;i?sh.lineTo(x,y):sh.moveTo(x,y);}
const gg=new THREE.ExtrudeGeometry(sh,{depth:.4,bevelEnabled:true,bevelSize:.15,bevelThickness:.1,bevelSegments:2});gg.rotateX(-Math.PI/2);gg.translate(0,-.4,0);
const uv=gg.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)/5,uv.getY(i)/5);
const ground=new THREE.Mesh(gg,new THREE.MeshLambertMaterial({map:tex}));ground.receiveShadow=true;S.add(ground);
// short paper track
const TL=26;const trk=new THREE.Group();S.add(trk);
const bs=new THREE.Shape();bs.moveTo(-1.05,0);bs.lineTo(-.87,.12);bs.lineTo(.87,.12);bs.lineTo(1.05,0);bs.closePath();const bg=new THREE.ExtrudeGeometry(bs,{depth:TL,bevelEnabled:false});bg.rotateY(-Math.PI/2);bg.translate(TL/2,0,0);const bal=new THREE.Mesh(bg,new THREE.MeshLambertMaterial({color:'#b7a58a',flatShading:true}));bal.receiveShadow=true;trk.add(bal);
for(let x=-TL/2+.3;x<TL/2;x+=.7){const s=new THREE.Mesh(new THREE.BoxGeometry(.3,.08,1.6),new THREE.MeshLambertMaterial({color:'#a58a6c'}));s.position.set(x,.16,0);s.receiveShadow=s.castShadow=true;trk.add(s);}
for(const z of [-.5,.5]){const r=new THREE.Mesh(new THREE.BoxGeometry(TL,.1,.08),new THREE.MeshLambertMaterial({color:'#625f59'}));r.position.set(0,.25,z);r.castShadow=true;trk.add(r);}
// Torn stone-paper shoulder chips, batched to keep the workshop lightweight.
const chips=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,0),new THREE.MeshLambertMaterial({color:'#bcae96',flatShading:true}),180);const dummy=new THREE.Object3D();for(let i=0;i<180;i++){const x=-12.9+(i/180)*25.8,z=(i%2?1:-1)*(.78+(i*37%17)/100);dummy.position.set(x,.12,z);dummy.rotation.set(i*.3,i*.7,i*.15);dummy.scale.set(.035+(i%3)*.015,.025,.05);dummy.updateMatrix();chips.setMatrixAt(i,dummy.matrix);}chips.receiveShadow=true;trk.add(chips);
for(const z of[-.5,.5]){const cap=new THREE.Mesh(new THREE.BoxGeometry(TL,.018,.09),new THREE.MeshLambertMaterial({color:'#b4afa0'}));cap.position.set(0,.291,z);cap.receiveShadow=true;trk.add(cap);const foot=new THREE.Mesh(new THREE.BoxGeometry(TL,.018,.16),new THREE.MeshLambertMaterial({color:'#68645c'}));foot.position.set(0,.21,z);trk.add(foot);}
const train=createTrain({wagons:3});S.add(train);train.position.y=.3;
let act='run';document.querySelectorAll('#acts button').forEach(b=>b.onclick=()=>{act=b.dataset.a;document.querySelectorAll('#acts button').forEach(x=>x.classList.toggle('on',x===b));});
const cam=new THREE.OrthographicCamera(-1,1,1,-1,.1,200);let view=1;
const VIEWS=[[0,30,.01,6],[14,14,16,5.6],[0,3.2,20,6.3],[4.5,2.8,5.5,2.5]];
function setView(v){view=v;document.querySelectorAll('#views button').forEach(x=>x.classList.toggle('on',+x.dataset.v===v));}
document.querySelectorAll('#views button').forEach(b=>b.onclick=()=>setView(+b.dataset.v));
addEventListener('resize',()=>R.setSize(innerWidth,innerHeight));
const q=new URLSearchParams(location.search);if(q.has('v'))setView(+q.get('v'));if(q.has('a')&&['idle','run','fast'].includes(q.get('a')))act=q.get('a');document.querySelectorAll('#acts button').forEach(b=>b.classList.toggle('on',b.dataset.a===act));
let spd=act==="idle"?0:act==="fast"?3.2:1.4,last=performance.now(),px=0;
function frame(now){const dt=Math.min(.05,(now-last)/1000);last=now;const target=act==='idle'?0:act==='fast'?3.2:1.4;spd+=(target-spd)*Math.min(1,dt*1.2);
 px+=spd*dt;const span=TL-4+train.userData.length;let x=((px+span/2)%span)-span/2+train.userData.length/2;// loco front
 if(view===3)x=Math.min(x,6);train.position.x=x-1.6;updateTrain(train,dt,spd);
 const vv=VIEWS[view];const tgt=view===3?new THREE.Vector3(train.position.x,1,0):new THREE.Vector3(0,view===2?1.4:0,0);
 cam.position.set(tgt.x+vv[0],tgt.y+vv[1],tgt.z+vv[2]);cam.lookAt(tgt);const a=innerWidth/innerHeight,z=vv[3]*(a<1?1.6:1);cam.left=-z*a;cam.right=z*a;cam.top=z;cam.bottom=-z;cam.updateProjectionMatrix();
 R.render(S,cam);requestAnimationFrame(frame);}
requestAnimationFrame(frame);window.__train=train;
