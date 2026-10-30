import * as THREE from 'three';
// ---------- noise ----------
function hash(x,z){const s=Math.sin(x*127.1+z*311.7)*43758.5453;return s-Math.floor(s);}
function vnoise(x,z){const xi=Math.floor(x),zi=Math.floor(z),xf=x-xi,zf=z-zi;const u=xf*xf*(3-2*xf),v=zf*zf*(3-2*zf);
 const a=hash(xi,zi),b=hash(xi+1,zi),c=hash(xi,zi+1),d=hash(xi+1,zi+1);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;}
function fbm(x,z){return vnoise(x,z)*.55+vnoise(x*2.1,z*2.1)*.28+vnoise(x*4.3,z*4.3)*.17;}
const riverX=z=>Math.sin(z*0.012)*18+Math.sin(z*0.031)*6;
function height(x,z){const dx=x-riverX(z);const side=Math.max(0,Math.abs(dx)-14);
 let h=fbm(x*.03,z*.03)*7+Math.pow(side/22,2)*9+fbm(x*.08,z*.08)*side*.08;
 const riv=Math.max(0,1-Math.abs(dx)/6);h-=riv*riv*3.2;const q=biomeAt(z);const sea=SEA[q.a]*(1-q.k)+SEA[q.b]*q.k;
 if(sea>0){const cx=dx<0?Math.max(0,-dx-4):0;h-=sea*(3+cx*.25);}return h;}
const BL=420;function biomeAt(z){const p=((-z/BL)%4+4)%4;const i=Math.floor(p),f=p-i;const k=THREE.MathUtils.smoothstep(f,.8,1);return {a:i,b:(i+1)%4,k};}
const biome=z=>{const q=biomeAt(z);return q.k>.5?q.b:q.a;};
const C=(h)=>new THREE.Color(h);
const pal=[{g1:C('#a8d58a'),g2:C('#7cc08a'),tree:[C('#6fbf73'),C('#8fd18a'),C('#f2a7c3')]},
           {g1:C('#e8c98a'),g2:C('#d7a86e'),tree:[C('#f0a35e'),C('#e5c45a'),C('#d9785a')]},
           {g1:C('#eef3f6'),g2:C('#d6e2ea'),tree:[C('#5f9c86'),C('#7fb5a2'),C('#e9f2f2')]},
           {g1:C('#bfe0a0'),g2:C('#f1e3b6'),tree:[C('#7cc49a'),C('#9ad47e'),C('#f6c28b')]}];
const SEA=[0,0,0,1];
function groundColor(x,z,h,out){const q=biomeAt(z);const n=fbm(x*.05+9,z*.05);
 const a=pal[q.a],c=pal[q.b];const g=a.g1.clone().lerp(a.g2,n).lerp(c.g1.clone().lerp(c.g2,n),q.k);
 const snow=(q.a==2?1-q.k:0)+(q.b==2?q.k:0);if(snow<.5&&h>5&&fbm(x*.2,z*.2)>.62)g.lerp(C('#fbfbf7'),.8);
 if(h<-1.2){out.set('#8fd3e0').lerp(C('#bfe9ee'),n);return out;}
 if(h<-.4){out.set('#efe0b5');return out;}
 if(h>9){g.lerp(C('#c7b8a6'),Math.min(1,(h-9)/5));} if(h>14)g.lerp(C('#fbf8f2'),Math.min(1,(h-14)/3));
 out.copy(g);return out;}
// ---------- renderer ----------
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;document.body.prepend(renderer.domElement);
const scene=new THREE.Scene();const SKY=new THREE.Color('#f6e6cf');scene.background=SKY;scene.fog=new THREE.Fog(SKY,60,190);
const cam=new THREE.PerspectiveCamera(innerWidth<innerHeight?62:50,innerWidth/innerHeight,.5,260);
scene.add(new THREE.HemisphereLight('#fff4e0','#9fb08a',1.6));
const sun=new THREE.DirectionalLight('#fff1d6',2.2);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);
Object.assign(sun.shadow.camera,{left:-45,right:45,top:45,bottom:-45,near:1,far:160});sun.shadow.radius=4;sun.shadow.bias=-.0008;
scene.add(sun,sun.target);
// cloud shadow shader injection
const U={uTime:{value:0}};
function cloudify(m){m.onBeforeCompile=s=>{s.uniforms.uTime=U.uTime;
 s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vW;').replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvW=(modelMatrix*vec4(transformed,1.)).xyz;');
 s.fragmentShader=s.fragmentShader.replace('#include <common>',`#include <common>
 varying vec3 vW;uniform float uTime;
 float h2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5);} 
 float n2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h2(i),h2(i+vec2(1,0)),f.x),mix(h2(i+vec2(0,1)),h2(i+vec2(1,1)),f.x),f.y);}`)
 .replace('#include <dithering_fragment>',`#include <dithering_fragment>
 vec2 cp=vW.xz*.028+vec2(uTime*.05,uTime*.02);float cs=n2(cp)*.6+n2(cp*2.3)*.4;cs=smoothstep(.55,.72,cs);
 gl_FragColor.rgb*=1.-cs*.22;`);};return m;}
const groundMat=cloudify(new THREE.MeshLambertMaterial({vertexColors:true,flatShading:true}));
const lam=c=>cloudify(new THREE.MeshLambertMaterial({color:c,flatShading:true}));
// ---------- shared geoms ----------
const G={cone:new THREE.ConeGeometry(1,2.4,6),ball:new THREE.IcosahedronGeometry(1,0),trunk:new THREE.CylinderGeometry(.18,.25,1,5),
 box:new THREE.BoxGeometry(1,1,1),roof:new THREE.ConeGeometry(.85,.7,4),sheep:new THREE.IcosahedronGeometry(.55,0),head:new THREE.BoxGeometry(.3,.3,.35),
 spark:new THREE.OctahedronGeometry(.6,0),card:new THREE.BoxGeometry(1.6,1.1,.08),cloud:new THREE.IcosahedronGeometry(1,1),sail:new THREE.ConeGeometry(.7,1.8,3),snowB:new THREE.IcosahedronGeometry(.6,1),nose:new THREE.ConeGeometry(.08,.35,4),flower:new THREE.IcosahedronGeometry(.18,0),leaf:new THREE.CircleGeometry(.35,5)};
G.trunk.translate(0,.5,0);G.cone.translate(0,1.2+.8,0);G.ball.translate(0,1.8,0);G.box.translate(0,.5,0);
const M={trunk:lam('#9a7458'),wall:lam('#fbf3e4'),roofs:['#e07a5f','#7aa6c2','#e9b35d'].map(lam),wool:lam('#fffaf2'),dark:lam('#4a3f39'),
 cow:lam('#f2e6d6'),rock:lam('#b9b2a8'),fl1:lam('#f7b2c8'),fl2:lam('#fff0a0'),fox:lam('#ef8f4a'),
 spark:new THREE.MeshBasicMaterial({color:'#fff3a8'}),card:new THREE.MeshLambertMaterial({color:'#fffdf6'}),stamp:new THREE.MeshBasicMaterial({color:'#e8766b'}),
 cloud:new THREE.MeshLambertMaterial({color:'#ffffff',transparent:true,opacity:.92,flatShading:true})};
const glowTex=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');const g=x.createRadialGradient(32,32,0,32,32,32);
 g.addColorStop(0,'rgba(255,250,210,1)');g.addColorStop(.35,'rgba(255,230,150,.55)');g.addColorStop(1,'rgba(255,220,140,0)');x.fillStyle=g;x.fillRect(0,0,64,64);return new THREE.CanvasTexture(c);})();
const glowMat=new THREE.SpriteMaterial({map:glowTex,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,fog:false});
const treeMats=[...pal[0].tree,...pal[1].tree].map(c=>lam(c));
// ---------- chunks ----------
const CW=150,CL=60,NCH=5,SEG_X=50,SEG_Z=20;
const chunks=[];const dynamic=[];// interactive objects
function rnd(seed){let s=seed;return()=>{s=(s*16807)%2147483647;return s/2147483647;};}
function buildChunk(ch,idx){
 ch.idx=idx;const z0=-idx*CL;ch.z0=z0;
 if(ch.group){scene.remove(ch.group);ch.group.traverse(o=>{if(o.isMesh&&o.geometry.userData.own)o.geometry.dispose();});}
 for(let i=dynamic.length-1;i>=0;i--)if(dynamic[i].chunk===ch)dynamic.splice(i,1);
 const g=new THREE.Group();ch.group=g;
 const geo=new THREE.PlaneGeometry(CW,CL,SEG_X,SEG_Z);geo.rotateX(-Math.PI/2);geo.userData.own=true;
 const p=geo.attributes.position,cols=new Float32Array(p.count*3),col=new THREE.Color();
 for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i)+z0-CL/2;const h=height(x,z);p.setY(i,h);p.setZ(i,z);
  groundColor(x,z,h,col);cols.set([col.r,col.g,col.b],i*3);}
 geo.setAttribute('color',new THREE.BufferAttribute(cols,3));geo.computeVertexNormals();
 const ng=geo.toNonIndexed();ng.userData.own=true;geo.dispose();ng.computeVertexNormals();
 const mesh=new THREE.Mesh(ng,groundMat);mesh.receiveShadow=true;g.add(mesh);
 // water plane
 const wgeo=new THREE.PlaneGeometry(CW,CL);wgeo.rotateX(-Math.PI/2);
 const water=new THREE.Mesh(wgeo,waterMat);water.position.set(0,-1.35,z0-CL/2);g.add(water);
 const r=rnd(idx*9301+49297+1);
 // trees
 for(let i=0;i<70;i++){const x=(r()-.5)*CW*.9,z=z0-r()*CL;const h=height(x,z);if(h<-.2||h>12)continue;
  if(Math.abs(x-riverX(z))<7&&r()<.7)continue;
  const t=new THREE.Group();const tr=new THREE.Mesh(G.trunk,M.trunk);const s=.7+r()*.8;
  const fm=treeMats[biome(z)*3+Math.floor(r()*3)];const top=new THREE.Mesh(r()<.5?G.cone:G.ball,fm);
  tr.castShadow=top.castShadow=true;t.add(tr,top);t.position.set(x,h,z);t.scale.setScalar(s);t.rotation.y=r()*6;g.add(t);
  dynamic.push({type:'tree',o:t,chunk:ch,ph:r()*6,sway:0,hasBirds:r()<.25});}
 // village
 if(r()<.8){const vx=riverX(z0-30)+(r()<.5?-1:1)*(16+r()*10),vz=z0-15-r()*30;
  for(let i=0;i<3+r()*4;i++){const x=vx+(r()-.5)*14,z=vz+(r()-.5)*14,h=height(x,z);if(h<-.3)continue;
   const house=new THREE.Group();const w=new THREE.Mesh(G.box,M.wall);w.scale.set(1.4,1.1,1.2);
   const rf=new THREE.Mesh(G.roof,M.roofs[Math.floor(r()*3)]);rf.position.y=1.45;rf.rotation.y=Math.PI/4;rf.scale.set(1.25,1,1.1);
   w.castShadow=rf.castShadow=true;house.add(w,rf);house.position.set(x,h-.05,z);house.rotation.y=r()*6;house.scale.setScalar(1.2);g.add(house);
   dynamic.push({type:'house',o:house,chunk:ch,base:1.2,pop:0});}}
 // animals
 const herd=2+Math.floor(r()*3);
 for(let k=0;k<herd;k++){const hx=(r()-.5)*70,hz=z0-r()*CL;const kind=r();
  for(let i=0;i<3+r()*4;i++){const x=hx+(r()-.5)*8,z=hz+(r()-.5)*8,h=height(x,z);if(h<-.3||h>10)continue;
   const a=new THREE.Group();const body=new THREE.Mesh(G.sheep,kind<.5?M.wool:kind<.8?M.cow:M.fox);
   body.position.y=.55;body.scale.set(1,.85,1.25);const hd=new THREE.Mesh(G.head,M.dark);hd.position.set(0,.75,.6);
   body.castShadow=true;a.add(body,hd);a.position.set(x,h,z);a.rotation.y=r()*6;a.scale.setScalar(kind<.8?1:.7);g.add(a);
   dynamic.push({type:'animal',o:a,chunk:ch,head:hd,vel:new THREE.Vector3(),hop:0,scared:0,ph:r()*6});}}
 // biome props
 for(let i=0;i<14;i++){const x=(r()-.5)*CW*.8,z=z0-r()*CL,h=height(x,z);const bi=biome(z);
  if(bi===3){if(h>-1.6&&h<-.3&&r()<.6){const rk=new THREE.Mesh(G.ball,M.rock);rk.scale.set(.8+r(),.5+r()*.5,.8+r());rk.position.set(x,h-1.6,z);rk.castShadow=true;g.add(rk);}
   else if(h<-1.5&&r()<.25){const bt=new THREE.Group();const hull=new THREE.Mesh(G.box,M.roofs[Math.floor(r()*3)]);hull.scale.set(1,.5,2.4);const sail=new THREE.Mesh(G.sail,M.wool);sail.position.set(0,1.6,0);bt.add(hull,sail);bt.position.set(x,-1.5,z);bt.rotation.y=r()*6;hull.castShadow=sail.castShadow=true;g.add(bt);dynamic.push({type:'boat',o:bt,chunk:ch,ph:r()*6,rock:0});}
   else if(h>-.4&&h<.6&&r()<.15){const pier=new THREE.Mesh(G.box,M.trunk);pier.scale.set(1.4,.25,7);const xs=dx=>x;pier.position.set(x,-.9,z);pier.rotation.y=Math.PI/2*(x<riverX(z)?1:-1)*.0;g.add(pier);}}
  else if(h<-.3||h>12)continue;
  else if(bi===2){if(r()<.6){const sm=new THREE.Group();const b1=new THREE.Mesh(G.snowB,M.wool),b2=new THREE.Mesh(G.snowB,M.wool),nose=new THREE.Mesh(G.nose,M.fox);
    b1.position.y=.6;b2.position.y=1.45;b2.scale.setScalar(.65);nose.position.set(0,1.5,.42);nose.rotation.x=Math.PI/2;b1.castShadow=b2.castShadow=true;sm.add(b1,b2,nose);sm.position.set(x,h,z);sm.rotation.y=r()*6;g.add(sm);dynamic.push({type:'wobble',o:sm,chunk:ch,w:0});}
   else{const t=new THREE.Group();const tr=new THREE.Mesh(G.trunk,M.trunk),top=new THREE.Mesh(G.cone,treeMats[6+Math.floor(r()*2)]);tr.castShadow=top.castShadow=true;t.add(tr,top);t.position.set(x,h,z);t.scale.set(.7,1+r()*.6,.7);g.add(t);dynamic.push({type:'tree',o:t,chunk:ch,ph:r()*6,sway:0,hasBirds:false});}}
  else{const patch=new THREE.Group();const mats=bi===1?[treeMats[3],treeMats[4],treeMats[5]]:[M.fl1,M.fl2,M.wool];
   for(let j=0;j<7;j++){const f=new THREE.Mesh(bi===1?G.leaf:G.flower,mats[j%3]);const px=(r()-.5)*3,pz=(r()-.5)*3;f.position.set(px,height(x+px,z+pz)-h+(bi===1?.05:.35),pz);if(bi===1)f.rotation.set(-Math.PI/2,0,r()*6);patch.add(f);}
   patch.position.set(x,h,z);g.add(patch);if(bi===0)dynamic.push({type:'flowers',o:patch,chunk:ch,ph:r()*6,sway:0});}}
 // sparkles (trail line)
 const sx=(r()-.5)*40,sz=z0-10-r()*30;const sy=height(sx,sz)+5+r()*8;const dir=(r()-.5)*.6;
 for(let i=0;i<6;i++){const s=new THREE.Mesh(G.spark,M.spark);const gl=new THREE.Sprite(glowMat.clone());gl.scale.setScalar(3.2);s.add(gl);s.position.set(sx+i*dir*6,sy+Math.sin(i*.8)*1.5,sz-i*4);g.add(s);
  dynamic.push({type:'spark',o:s,chunk:ch,taken:false,t:0});}
 // postcard
 if(r()<.45){const x=(r()-.5)*50,z=z0-r()*CL;const c=new THREE.Group();const card=new THREE.Mesh(G.card,M.card);
  const st=new THREE.Mesh(new THREE.PlaneGeometry(.35,.4),M.stamp);st.position.set(.5,.25,.05);const gl2=new THREE.Sprite(glowMat.clone());gl2.scale.setScalar(4.5);c.add(card,st,gl2);
  c.position.set(x,Math.max(height(x,z),0)+7+r()*6,z);g.add(c);dynamic.push({type:'card',o:c,chunk:ch,taken:false,t:0});}
 // clouds
 for(let i=0;i<2;i++){const cl=new THREE.Group();const x=(r()-.5)*90,z=z0-r()*CL,y=17+r()*8;
  for(let j=0;j<5;j++){const m=new THREE.Mesh(G.cloud,M.cloud);m.position.set((j-2)*1.8+r(),r()*1.2,(r()-.5)*2);m.scale.setScalar(1.6+r()*1.6);cl.add(m);}
  cl.position.set(x,y,z);g.add(cl);dynamic.push({type:'cloud',o:cl,chunk:ch,ph:r()*6});}
 scene.add(g);}
const waterMat=cloudify(new THREE.MeshLambertMaterial({color:'#9fdbe6',transparent:true,opacity:.75}));
for(let i=0;i<NCH;i++){const ch={};chunks.push(ch);buildChunk(ch,i);}
// ---------- bird ----------
const bird=new THREE.Group();
const bMat=lam('#fdf6ea'),wMat=lam('#f6c28b'),beakMat=lam('#f29e4c');
const bodyG=new THREE.IcosahedronGeometry(.6,1);const bBody=new THREE.Mesh(bodyG,bMat);bBody.scale.set(.85,.8,1.35);
const bHead=new THREE.Mesh(new THREE.IcosahedronGeometry(.42,1),bMat);bHead.position.set(0,.35,-.7);
const beak=new THREE.Mesh(new THREE.ConeGeometry(.12,.35,4),beakMat);beak.rotation.x=-Math.PI/2;beak.position.set(0,.3,-1.15);
const eyeG=new THREE.SphereGeometry(.06,6,4);const e1=new THREE.Mesh(eyeG,M.dark),e2=e1.clone();e1.position.set(.25,.45,-.95);e2.position.set(-.25,.45,-.95);
const tail=new THREE.Mesh(new THREE.ConeGeometry(.3,.7,4),wMat);tail.rotation.x=Math.PI/2;tail.position.set(0,.1,.95);tail.scale.set(1.3,1,.3);
const wingG=new THREE.BoxGeometry(1.5,.08,.7);wingG.translate(.75,0,0);
const wL=new THREE.Mesh(wingG,wMat),wR=new THREE.Mesh(wingG,wMat);wL.position.set(.35,.15,-.1);wR.position.set(-.35,.15,-.1);wR.scale.x=-1;
[bBody,bHead,wL,wR,tail].forEach(m=>m.castShadow=true);
bird.add(bBody,bHead,beak,e1,e2,tail,wL,wR);scene.add(bird);
const birdPos=new THREE.Vector3(0,10,0);let yaw=0,bank=0,pitch=0,vy=0;
// flock helpers (birds flushed from trees)
const flock=[];const fG=new THREE.TetrahedronGeometry(.25);
function flush(p){for(let i=0;i<5;i++){const m=new THREE.Mesh(fG,M.dark);m.position.copy(p).add(new THREE.Vector3((Math.random()-.5)*1.5,2.5,(Math.random()-.5)*1.5));
 scene.add(m);flock.push({m,v:new THREE.Vector3((Math.random()-.5)*6,4+Math.random()*3,(Math.random()-.5)*6),t:0});}}
// burst particles
const bursts=[];function burst(p,color){const mat=new THREE.MeshBasicMaterial({color,transparent:true});
 for(let i=0;i<10;i++){const m=new THREE.Mesh(fG,mat);m.position.copy(p);scene.add(m);bursts.push({m,v:new THREE.Vector3().randomDirection().multiplyScalar(5+Math.random()*4),t:0});}}
// ---------- input ----------
let sIx=0,sIy=0;const tilt={x:0,y:0,on:false};let tx=0,ty=0,active=false,sx=0,sy=0,bx=0,by=0;
const el=renderer.domElement;
function down(x,y){active=true;sx=x;sy=y;bx=tx;by=ty;hideHint();}
function move(x,y){if(!active)return;const s=Math.min(innerWidth,innerHeight)*.28;tx=THREE.MathUtils.clamp(bx+(x-sx)/s,-1,1);ty=THREE.MathUtils.clamp(by-(y-sy)/s,-1,1);}
function up(){active=false;}
el.addEventListener('pointerdown',e=>{el.setPointerCapture(e.pointerId);down(e.clientX,e.clientY);});
el.addEventListener('pointermove',e=>move(e.clientX,e.clientY));
el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);
const keys={};addEventListener('keydown',e=>keys[e.key]=1);addEventListener('keyup',e=>keys[e.key]=0);
document.addEventListener('touchmove',e=>e.preventDefault(),{passive:false});
let hinted=false;function hideHint(){if(!hinted){hinted=true;setTimeout(()=>document.getElementById('hint').style.opacity=0,1800);}}
// ---------- UI ----------
let dist=0,sparks=0,cards=0,running=false;const $=id=>document.getElementById(id);
let toastT=0;function toast(s){const t=$('toast');t.textContent=s;t.style.opacity=1;toastT=1.6;}
const cardMsgs=['Kartpostal: Selamlar vadiden!','Kartpostal: Köy fırını burada!','Kartpostal: Nehir kenarında piknik','Kartpostal: Bulutların arasından','Kartpostal: Sonbahar geldi!','Kartpostal: Kardan adamlar el sallıyor','Kartpostal: İskelede gün batımı','Kartpostal: Çiçek tarlasında bahar','Kartpostal: Martılar selam söylüyor','Kartpostal: Dağların zirvesinden'];
$('go').onclick=()=>{initAudio();$('start').style.display='none';running=true;try{document.documentElement.requestFullscreen?.().catch(()=>{});}catch(e){}};
// ---------- loop ----------
const trailMat=new THREE.SpriteMaterial({map:glowTex,color:'#ffffff',transparent:true,opacity:.35,depthWrite:false});
const pts=[];const snowM=new THREE.MeshBasicMaterial({color:'#ffffff'}),leafM=['#f0a35e','#e5c45a','#d9785a'].map(c=>new THREE.MeshBasicMaterial({color:c,side:THREE.DoubleSide}));const ptG=new THREE.PlaneGeometry(.22,.22);
for(let i=0;i<70;i++){const p=new THREE.Mesh(ptG,snowM);p.visible=false;p.userData.t=0;scene.add(p);pts.push(p);}let ptI=0,ptT=0;
const trail=[];for(let i=0;i<40;i++){const p=new THREE.Sprite(trailMat);p.visible=false;p.userData.t=0;scene.add(p);trail.push(p);}let qMode=localStorage.getItem('kk_q')||'auto',lowSec=0;
function setQ(low){lowQ=low;renderer.setPixelRatio(low?1:Math.min(devicePixelRatio,2));sun.castShadow=!low;renderer.shadowMap.enabled=!low;scene.traverse(o=>{if(o.material)o.material.needsUpdate=true;});document.getElementById('qual').textContent=low?'◐':'✨';}
let trailI=0,trailT=0,fpsAcc=0,fpsN=0,lowQ=false;
let best=+localStorage.getItem('kk_best')||0;$('best').textContent=best?('En iyi: '+Math.floor(best)+' m'):'';
addEventListener('pagehide',()=>localStorage.setItem('kk_best',Math.floor(best)));
// audio
let AC=null,muted=localStorage.getItem('kk_mute')==='1',windG=null,windF=null,lastFlap=0;
function initAudio(){if(AC)return;AC=new (window.AudioContext||window.webkitAudioContext)();const n=AC.sampleRate*2,buf=AC.createBuffer(1,n,AC.sampleRate),d=buf.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;
 const src=AC.createBufferSource();src.buffer=buf;src.loop=true;windF=AC.createBiquadFilter();windF.type='bandpass';windF.frequency.value=500;windF.Q.value=.7;windG=AC.createGain();windG.gain.value=0;
 src.connect(windF).connect(windG).connect(AC.destination);src.start();window.__noise=buf;}
function wind(spd,vy){if(!AC)return;const g=muted?0:.05+Math.min(.05,Math.abs(vy)*.01);windG.gain.setTargetAtTime(g,AC.currentTime,.3);windF.frequency.setTargetAtTime(400+Math.abs(vy)*80,AC.currentTime,.3);
 const ph=Math.sin(t*(vy>1.5?15:8));if(ph>.95&&t-lastFlap>.25&&!muted&&running){lastFlap=t;const s=AC.createBufferSource();s.buffer=window.__noise;const f=AC.createBiquadFilter();f.type='lowpass';f.frequency.value=900;const g2=AC.createGain();
  g2.gain.setValueAtTime(.0001,AC.currentTime);g2.gain.linearRampToValueAtTime(.06,AC.currentTime+.04);g2.gain.exponentialRampToValueAtTime(.0001,AC.currentTime+.22);s.connect(f).connect(g2).connect(AC.destination);s.start();s.stop(AC.currentTime+.3);}}
function chime(m){if(!AC||muted)return;const now=AC.currentTime;for(const [mul,v] of [[1,.12],[2,.04]]){const o=AC.createOscillator(),g=AC.createGain();o.type='sine';o.frequency.value=880*m*mul;
 g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(v,now+.01);g.gain.exponentialRampToValueAtTime(.0001,now+.6);o.connect(g).connect(AC.destination);o.start(now);o.stop(now+.7);}}
function setMute(){$('mute').textContent=muted?'🔇':'🔊';}setMute();
$('mute').onclick=()=>{muted=!muted;localStorage.setItem('kk_mute',muted?'1':'0');setMute();initAudio();};
function cardFlash(){const f=$('flash');f.style.transition='none';f.style.opacity=.7;requestAnimationFrame(()=>{f.style.transition='opacity .8s';f.style.opacity=0;});const p=$('post');p.style.transform='scale(1.4)';setTimeout(()=>p.style.transform='',300);}
// tilt
let tilt0=null;function onOri(e){if(e.gamma==null)return;if(!tilt0)tilt0={g:e.gamma,b:e.beta};tilt.x=THREE.MathUtils.clamp((e.gamma-tilt0.g)/25,-1,1);tilt.y=THREE.MathUtils.clamp(-(e.beta-tilt0.b)/25,-1,1);}
$('tilt').onclick=async()=>{if(tilt.on){tilt.on=false;removeEventListener('deviceorientation',onOri);tilt.x=tilt.y=0;$('tilt').style.opacity=.5;return;}
 try{if(window.DeviceOrientationEvent?.requestPermission){if(await DeviceOrientationEvent.requestPermission()!=='granted')return;}}catch(e){return;}
 tilt.on=true;tilt0=null;addEventListener('deviceorientation',onOri);$('tilt').style.opacity=1;toast('Eğme kontrolü açık');};
if(!window.DeviceOrientationEvent)$('tilt').style.display='none';
$('qual').onclick=()=>{qMode=lowQ?'high':'low';localStorage.setItem('kk_q',qMode);setQ(qMode==='low');};if(qMode==='low')setQ(true);
// album
const unlocked=new Set(JSON.parse(localStorage.getItem('kk_cards')||'[]'));const runCards=[];
function openAlbum(){const l=$('albumList');l.innerHTML='';cardMsgs.forEach((m,i)=>{const d=document.createElement('div');const got=unlocked.has(i);d.className='ac'+(got?'':' lock');
 d.innerHTML=got?('<b>✉ '+m.replace('Kartpostal: ','')+'</b>'+(runCards.includes(i)?'<small>bu uçuşta</small>':'')):'<b>? ? ?</b><small>henüz bulunmadı</small>';l.appendChild(d);});
 $('albumCount').textContent=unlocked.size+' / '+cardMsgs.length+' kartpostal · bu uçuşta '+runCards.length;$('album').style.display='flex';}
$('albumBtn').onclick=$('albumBtn2').onclick=e=>{e.stopPropagation();openAlbum();};$('albumClose').onclick=()=>$('album').style.display='none';
const clock=new THREE.Clock();const tmp=new THREE.Vector3();let fogBoost=0,t=0;
const camPos=new THREE.Vector3(0,16,14);
function frame(){requestAnimationFrame(frame);const dt=Math.min(clock.getDelta(),.05);t+=dt;U.uTime.value=t;
 const spd=running?14:6;
 let ix=tx,iy=ty;if(keys.ArrowLeft||keys.a)ix=-1;if(keys.ArrowRight||keys.d)ix=1;if(keys.ArrowUp||keys.w)iy=1;if(keys.ArrowDown||keys.s)iy=-1;
 if(!active&&!keys.ArrowLeft&&!keys.ArrowRight){tx*=Math.exp(-dt*1.2);}if(!active){ty*=Math.exp(-dt*1.2);}
 ix+=tilt.x;iy+=tilt.y;sIx+=(THREE.MathUtils.clamp(ix,-1,1)-sIx)*(1-Math.exp(-dt*5));sIy+=(THREE.MathUtils.clamp(iy,-1,1)-sIy)*(1-Math.exp(-dt*4));ix=sIx;iy=sIy;
 // steering: finger offset -> lateral speed & target altitude above ground
 const latV=ix*13;birdPos.x+=latV*dt;birdPos.z-=spd*dt;
 yaw+=((-ix*.3)-yaw)*dt*2;bank+=((-ix*.6)-bank)*(1-Math.exp(-dt*2.5));
 const gh=Math.max(height(birdPos.x,birdPos.z),-1.3),ahead=Math.max(height(birdPos.x,birdPos.z-8),-1.3);
 const tgt=Math.max(gh,ahead)+9+iy*6;vy+=((tgt-birdPos.y)*1.6-vy)*dt*2.5;birdPos.y+=vy*dt+Math.sin(t*2)*.008;
 pitch+=((THREE.MathUtils.clamp(vy*.06,-.4,.4))-pitch)*dt*4;
 if(birdPos.y<gh+1.4){birdPos.y=gh+1.4;vy=6;if(toastT<=0)toast("Hop!");}
 const lim=riverX(birdPos.z);birdPos.x=THREE.MathUtils.clamp(birdPos.x,lim-34,lim+34);
 if(running)dist+=spd*dt;
 bird.position.copy(birdPos);bird.rotation.set(pitch,yaw,bank,'YXZ');
 const flap=Math.sin(t*(vy>1.5?15:8))*(.55+Math.min(.4,Math.max(0,vy)*.08))*(running?1:.7);wL.rotation.z=flap;wR.rotation.z=-flap;
 bBody.position.y=Math.sin(t*9)*.04;
 // camera chase
 tmp.set(birdPos.x,birdPos.y+8.5,birdPos.z+12);camPos.lerp(tmp,1-Math.exp(-dt*3));cam.position.copy(camPos);
 tmp.set(birdPos.x,birdPos.y-2,birdPos.z-10);cam.lookAt(tmp);
 sun.position.copy(birdPos).add(new THREE.Vector3(30,60,20));sun.target.position.copy(birdPos);
 // chunk recycle
 const cur=Math.floor(-birdPos.z/CL);for(const ch of chunks){if(ch.idx<cur-1){buildChunk(ch,ch.idx+NCH);}}
 // dynamic objects
 let inCloud=false;
 for(const d of dynamic){const o=d.o;const dx=o.position.x-birdPos.x,dz=o.position.z-birdPos.z;const dd=dx*dx+dz*dz;
  if(d.type==='tree'){const near=dd<36&&birdPos.y-o.position.y<10;if(near&&d.sway<.5){d.sway=1.4;if(d.hasBirds){flush(o.position);d.hasBirds=false;}}
   d.sway*=1-dt*1.2;o.rotation.z=Math.sin(t*1.5+d.ph)*.03+Math.sin(t*9)*d.sway*.12;}
  else if(d.type==='animal'){const near=dd<100&&birdPos.y-o.position.y<12;
   if(near&&d.scared<=0){d.scared=2.5;const l=Math.sqrt(dd)||1;d.vel.set(-dx/l,0,-dz/l).multiplyScalar(5);o.rotation.y=Math.atan2(-dx,-dz);}
   if(d.scared>0){d.scared-=dt;o.position.addScaledVector(d.vel,dt);d.vel.multiplyScalar(1-dt*.8);d.hop+=dt*14;
    o.position.y=height(o.position.x,o.position.z)+Math.abs(Math.sin(d.hop))*.6;d.head.position.y=.95;}
   else{d.head.position.y=.6+Math.sin(t*2+d.ph)*.1;o.position.y=height(o.position.x,o.position.z);}}
  else if(d.type==='house'){if(dd<50&&d.pop<=0){d.pop=1;burst(tmp.copy(o.position).add(new THREE.Vector3(0,3,0)),'#ffffff');}
   if(d.pop>0){d.pop-=dt*1.5;o.scale.set(d.base*(1+Math.sin(d.pop*12)*d.pop*.08),d.base*(1+Math.sin(d.pop*12+1)*d.pop*.12),d.base);}}
  else if(d.type==='spark'||d.type==='card'){
   if(!d.taken){const gs=o.children[o.children.length-1];const fd=Math.sqrt(dd);gs.material.opacity=THREE.MathUtils.clamp(1-(fd-scene.fog.near*.5)/(scene.fog.far*.55-scene.fog.near*.5),0,1)*.95;o.rotation.y+=dt*(d.type==='card'?1:3);o.scale.setScalar(1+Math.sin(t*5+o.position.z)*.15);o.position.y+=Math.sin(t*3+o.position.z)*.01;
    if(o.position.distanceTo(birdPos)<(d.type==='card'?2.6:2)){d.taken=true;
     if(d.type==='spark'){sparks++;burst(o.position,'#fff1a0');chime(1+sparks%6*.12);}else{cards++;burst(o.position,'#e8766b');burst(o.position,'#fff1a0');chime(.8);setTimeout(()=>chime(1.2),120);setTimeout(()=>chime(1.5),240);cardFlash();const ci=cards%cardMsgs.length;toast(cardMsgs[ci]);runCards.push(ci);unlocked.add(ci);localStorage.setItem('kk_cards',JSON.stringify([...unlocked]));}}}
   else{d.t+=dt;o.scale.setScalar(Math.max(0,1-d.t*3));o.position.y+=dt*6;}}
  else if(d.type==='boat'){if(dd<64&&d.rock<.3)d.rock=1;d.rock*=1-dt*.7;o.rotation.z=Math.sin(t*1.3+d.ph)*.05+Math.sin(t*5)*d.rock*.25;o.position.y=-1.5+Math.sin(t*1.1+d.ph)*.08;}
  else if(d.type==='wobble'){if(dd<49&&d.w<.3){d.w=1;burst(tmp.copy(o.position).add(new THREE.Vector3(0,1.5,0)),'#ffffff');}d.w*=1-dt*1.2;o.rotation.z=Math.sin(t*10)*d.w*.25;o.rotation.x=Math.cos(t*8)*d.w*.15;}
  else if(d.type==='flowers'){if(dd<36&&d.sway<.3)d.sway=1;d.sway*=1-dt;o.rotation.z=Math.sin(t*2+d.ph)*.05+Math.sin(t*9)*d.sway*.15;}
  else if(d.type==='cloud'){o.position.x+=dt*1.2;const dy=birdPos.y-o.position.y;if(dd<30&&Math.abs(dy)<3)inCloud=true;}}
 fogBoost+=((inCloud?1:0)-fogBoost)*dt*3;scene.fog.near=60-fogBoost*55;scene.fog.far=190-fogBoost*160;
 for(let i=flock.length-1;i>=0;i--){const f=flock[i];f.t+=dt;f.m.position.addScaledVector(f.v,dt);f.m.rotation.x+=dt*20;if(f.t>3){scene.remove(f.m);flock.splice(i,1);}}
 for(let i=bursts.length-1;i>=0;i--){const b=bursts[i];b.t+=dt;b.m.position.addScaledVector(b.v,dt);b.v.multiplyScalar(1-dt*3);b.m.scale.setScalar(Math.max(0,1-b.t*1.5));if(b.t>.8){scene.remove(b.m);bursts.splice(i,1);}}
 trailT-=dt;if(running&&trailT<=0){trailT=.06;for(const w of[1,-1]){const p=trail[trailI++%trail.length];p.position.copy(birdPos).add(tmp.set(w*1.3*Math.cos(bank),-.1+w*Math.sin(-bank)*1.3,.6));p.userData.t=0;p.visible=true;}}
 for(const p of trail)if(p.visible){p.userData.t+=dt;p.material.opacity;p.scale.setScalar(.6+p.userData.t*1.5);if(p.userData.t>1)p.visible=false;}
 const bq=biome(birdPos.z);ptT-=dt;if(running&&(bq===1||bq===2)&&ptT<=0){ptT=.08;const p=pts[ptI++%pts.length];p.material=bq===2?snowM:leafM[ptI%3];p.position.set(birdPos.x+(Math.random()-.5)*24,birdPos.y+6+Math.random()*6,birdPos.z-6-Math.random()*20);p.userData.t=0;p.userData.s=bq;p.visible=true;}
 for(const p of pts)if(p.visible){p.userData.t+=dt;p.position.y-=dt*(p.userData.s===2?2:1.4);p.position.x+=Math.sin(t*2+p.id)*dt*1.5;p.rotation.x+=dt*3;p.rotation.y+=dt*2;if(p.userData.t>5)p.visible=false;}
 if(running&&qMode==='auto'){fpsAcc+=dt;fpsN++;if(fpsAcc>1){const f=fpsN/fpsAcc;fpsAcc=0;fpsN=0;lowSec=f<35?lowSec+1:0;if(lowSec>=4&&!lowQ){setQ(true);toast('Kalite düşürüldü ◐');}}}
 if(running&&dist>best){best=dist;if(Math.floor(dist)%20==0)localStorage.setItem('kk_best',Math.floor(best));}
 wind(spd,vy);
 if(toastT>0){toastT-=dt;if(toastT<=0)$('toast').style.opacity=0;}
 $('dist').textContent=Math.floor(dist)+' m';$('coll').textContent='✦ '+sparks;$('post').textContent='✉ '+cards;
 renderer.render(scene,cam);}
addEventListener('resize',()=>{renderer.setSize(innerWidth,innerHeight);cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix();});
frame();window.__game={birdPos,get sparks(){return sparks}};
