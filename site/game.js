import * as THREE from 'three';
const SET=Object.assign({vol:.8,sens:1,ghost:true,fastDay:false,invY:false},JSON.parse(localStorage.getItem('kk_set')||'{}'));
const LOWP=['low','calm'].includes(JSON.parse(localStorage.getItem('kk_set')||'{}').gfx);
let PROPK=(JSON.parse(localStorage.getItem('kk_set')||'{}').gfx==='calm')?.5:1;
const saveSet=()=>localStorage.setItem('kk_set',JSON.stringify(SET));
const TODAY=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Istanbul'}).format(new Date());
const BK='kk_best_'+TODAY,PK='kk_path_'+TODAY;let allBest=Math.max(+localStorage.getItem('kk_best_all')||0,+localStorage.getItem('kk_best')||0);
for(let i=localStorage.length-1;i>=0;i--){const k=localStorage.key(i);if(k&&(k.startsWith('kk_path_')&&k!==PK||k==='kk_path'))localStorage.removeItem(k);}
function saveBest(){localStorage.setItem(BK,Math.floor(best));if(best>allBest){allBest=best;}localStorage.setItem('kk_best_all',Math.floor(allBest));}
const SEED=[...TODAY].reduce((h,c)=>(h*31+c.charCodeAt(0))%1000003,7);const DAYNUM=Math.floor(Date.parse(TODAY)/864e5);
// ---------- noise ----------
function hash(x,z){const s=Math.sin(x*127.1+z*311.7)*43758.5453;return s-Math.floor(s);}
function vnoise(x,z){const xi=Math.floor(x),zi=Math.floor(z),xf=x-xi,zf=z-zi;const u=xf*xf*(3-2*xf),v=zf*zf*(3-2*zf);
 const a=hash(xi,zi),b=hash(xi+1,zi),c=hash(xi,zi+1),d=hash(xi+1,zi+1);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;}
function fbm(x,z){return vnoise(x,z)*.55+vnoise(x*2.1,z*2.1)*.28+vnoise(x*4.3,z*4.3)*.17;}
const TS=(SEED%9973)/9973,NOX=TS*517.3,NOZ=TS*331.9,RPH=TS*6.283,RAMP=14+TS*8,BOFF=Math.floor(TS*6)+TS;
setTimeout(()=>URV.value.set(RPH,RAMP,Math.sin(RPH)*RAMP+Math.sin(RPH*2)*6),0);
const riverX=z=>Math.sin(z*0.012+RPH)*RAMP+Math.sin(z*0.031+RPH*2)*6-Math.sin(RPH)*RAMP-Math.sin(RPH*2)*6;
function height(x,z){const dx=x-riverX(z);const side=Math.max(0,Math.abs(dx)-14);
 let h=fbm(x*.03+NOX,z*.03+NOZ)*(6+TS*3)+Math.pow(side/(20+TS*5),2)*9+fbm(x*.08+NOZ,z*.08+NOX)*side*.08;
 const riv=Math.max(0,1-Math.abs(dx)/8);h-=riv*.9;const q=biomeAt(z);const sea=SEA[q.a]*(1-q.k)+SEA[q.b]*q.k;
 const des=(q.a==4?1-q.k:0)+(q.b==4?q.k:0);if(des>0){h+=des*(Math.sin(x*.12+z*.05)*1.6+Math.sin(z*.09-x*.03)*1.1+1.5);}
 h=h>0?h*.3:h;if(sea>0){h=THREE.MathUtils.lerp(h,-.6,sea*THREE.MathUtils.smoothstep(-dx,2,10));}return h;}
const BL=420;function biomeAt(z){const p=((-z/BL+BOFF)%6+6)%6;const i=Math.floor(p),f=p-i;const k=THREE.MathUtils.smoothstep(f,.8,1);return {a:i,b:(i+1)%6,k};}
const biome=z=>{const q=biomeAt(z);return q.k>.5?q.b:q.a;};
const C=(h)=>new THREE.Color(h);
const pal=[{g1:C('#6cb37a'),g2:C('#5aa56f'),acc:C('#5fb3c4'),tree:[C('#f2a7c3'),C('#f6b9cf'),C('#5f9f62')]},
           {g1:C('#5f9e45'),g2:C('#6fae4a'),acc:C('#8fbf4f'),tree:[C('#ef8f3e'),C('#f2c14e'),C('#3f7f3a')]},
           {g1:C('#93c84a'),g2:C('#a2d057'),acc:C('#b4da6a'),tree:[C('#4f8f3e'),C('#5f9f45'),C('#6faf4f')]},
           {g1:C('#9fcf7a'),g2:C('#e9dcaa'),acc:C('#b9dd8a'),tree:[C('#4f9a62'),C('#6fb37a'),C('#4f8f52')]},
           {g1:C('#d9a94a'),g2:C('#cf9a3f'),acc:C('#e3b95a'),tree:[C('#5f8a3a'),C('#6f9a42'),C('#4f7a32')]},
           {g1:C('#3f9a3a'),g2:C('#35903a'),acc:C('#f2d53a'),tree:[C('#2f6f32'),C('#3a7f3a'),C('#2a5f2a')]}];
const ACC=new THREE.Color();const BW=[0,0,0];
const SEA=[0,0,0,1,0,0];
function groundColor(x,z,h,out){const q=biomeAt(z);const n=fbm(x*.05+9,z*.05);
 const a=pal[q.a],c=pal[q.b];const g=a.g1.clone().lerp(a.g2,n).lerp(c.g1.clone().lerp(c.g2,n),q.k);ACC.copy(a.acc).lerp(c.acc,q.k);BW[0]=(q.a===0?1-q.k:0)+(q.b===0?q.k:0);BW[2]=(q.a===1?1-q.k:0)+(q.b===1?q.k:0);BW[1]=SEA[q.a]*(1-q.k)+SEA[q.b]*q.k;
 if(h<-1.2){out.set('#3f78c0');ACC.copy(out);return out;}
 if(h<-.4){out.copy(g).lerp(C('#e6d7a6'),.75);ACC.copy(out);return out;}
 if(h>9){g.lerp(C('#c7b8a6'),Math.min(1,(h-9)/5));} if(h>14)g.lerp(C('#fbf8f2'),Math.min(1,(h-14)/3));
 out.copy(g);return out;}
// ---------- renderer ----------
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;document.body.prepend(renderer.domElement);
const scene=new THREE.Scene();const SKY=new THREE.Color('#f6e6cf');scene.background=new THREE.Color('#fbf8f1');scene.fog=new THREE.Fog(SKY,60,190);
const VIEWH=()=>innerWidth<innerHeight?78:58;function orthoFit(){const h=VIEWH(),w=h*innerWidth/innerHeight;cam.left=-w/2;cam.right=w/2;cam.top=h/2;cam.bottom=-h/2;cam.updateProjectionMatrix();}
const cam=new THREE.OrthographicCamera(-1,1,1,-1,1,400);cam.up.set(0,0,-1);orthoFit();
const hemi=new THREE.HemisphereLight('#fff4e0','#9fb08a',1.6);scene.add(hemi);
const DAY=[{sky:C('#f6e6cf'),sun:C('#fff1d6'),si:1.7,hi:1.05,hs:C('#fff4e0')},{sky:C('#e4eef0'),sun:C('#fffaf0'),si:1.8,hi:1.1,hs:C('#f4fbff')},{sky:C('#f8d2a0'),sun:C('#ffd9a8'),si:1.6,hi:1.0,hs:C('#ffe8cc')},{sky:C('#d6a6bf'),sun:C('#f4a1a0'),si:1.1,hi:1.05,hs:C('#d9c2e8')}];
const DAYLEN=300;let dusk=0;
const BN=['Pirinç tarlaları · İlkbahar','Nehir vadisi · Sonbahar','Pampa · Uçsuz yeşil','Kıyı · Deniz meltemi','Savan · Kurak mevsim','Hardal tarlaları · Kış sonu'];let capB=-1;function capTick(){const b=biome(birdPos.z);if(b!==capB){capB=b;const c=document.getElementById('cap');if(c)c.innerHTML='<b>'+BN[b]+'</b><span>'+TODAY.split('-').reverse().join('.')+' · Kağıt Kuş</span>';}}
function dayCycle(tt){capTick();const p=(tt/DAYLEN*4)%4,i=Math.floor(p),f=THREE.MathUtils.smoothstep(p-i,.6,1),a=DAY[i],b=DAY[(i+1)%4];
 SKY.copy(a.sky).lerp(b.sky,f);scene.fog.color.copy(SKY);sun.color.copy(a.sun).lerp(b.sun,f);sun.intensity=a.si+(b.si-a.si)*f;hemi.intensity=a.hi+(b.hi-a.hi)*f;hemi.color.copy(a.hs).lerp(b.hs,f);
 dusk=(i===3?1-f:0)+(i===2?f:0);}
const sun=new THREE.DirectionalLight('#fff1d6',2.2);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);
Object.assign(sun.shadow.camera,{left:-55,right:55,top:55,bottom:-55,near:1,far:240});sun.shadow.radius=2;sun.shadow.intensity=.55;sun.shadow.bias=-.0008;
scene.add(sun,sun.target);
// cloud shadow shader injection
const U={uTime:{value:0}};const URV={value:new THREE.Vector3()};
function cloudify(m){m.onBeforeCompile=s=>{s.uniforms.uTime=U.uTime;
 s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vW;').replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvW=(modelMatrix*vec4(transformed,1.)).xyz;');
 s.fragmentShader=s.fragmentShader.replace('#include <common>',`#include <common>
 varying vec3 vW;uniform float uTime;
 float h2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5);} 
 float n2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h2(i),h2(i+vec2(1,0)),f.x),mix(h2(i+vec2(0,1)),h2(i+vec2(1,1)),f.x),f.y);}`)
 .replace('#include <dithering_fragment>',`#include <dithering_fragment>
 vec2 cp=vW.xz*.018+vec2(uTime*.04,uTime*.015);float cs=n2(cp)*.65+n2(cp*2.1)*.35;cs=smoothstep(.56,.68,cs);
 gl_FragColor.rgb*=1.-cs*.2;`);};return m;}
const groundMat=cloudify(new THREE.MeshLambertMaterial({vertexColors:true}));
{const ob=groundMat.onBeforeCompile;groundMat.onBeforeCompile=sh=>{ob(sh);sh.uniforms.uRv=URV;sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nattribute vec3 acc;varying vec3 vAcc;attribute vec3 bw;varying vec3 vBw;').replace('#include <begin_vertex>','#include <begin_vertex>\nvAcc=acc;vBw=bw;');
 sh.fragmentShader=sh.fragmentShader.replace('uniform float uTime;','uniform float uTime;uniform vec3 uRv;varying vec3 vAcc;varying vec3 vBw;').replace('#include <color_fragment>',`#include <color_fragment>
 {float rx=sin(vW.z*.012+uRv.x)*uRv.y+sin(vW.z*.031+uRv.x*2.)*6.-uRv.z;float dxr=vW.x-rx;
  vec2 wp=vW.xz/17.;wp+=vec2(n2(vW.xz*.045),n2(vW.xz*.045+9.))*1.5;
  vec2 ip=floor(wp),fp=fract(wp);float d1=9.,d2=9.;vec2 id=vec2(0.);
  for(int j=-1;j<=1;j++)for(int i=-1;i<=1;i++){vec2 o=vec2(float(i),float(j));vec2 pt=vec2(h2(ip+o),h2(ip+o+3.1))*.8+.1;float d=length(o+pt-fp);if(d<d1){d2=d1;d1=d;id=ip+o;}else if(d<d2)d2=d;}
  float hv=h2(id+7.);float edge=(d2-d1)*17.;
  float away=smoothstep(6.5,8.,abs(dxr));vec3 base=diffuseColor.rgb;
  float br=n2(vW.xz*.5)*.05+n2(vW.xz*1.7)*.03-.04;
  vec3 fc=mix(base,vAcc,step(.42,hv))*mix(.93,1.07,h2(id+1.3));fc*=1.+br;
  fc=mix(base*.88,fc,smoothstep(.7,1.6,edge));
  diffuseColor.rgb=mix(base*(1.+br),fc,away);
  float road=1.-smoothstep(.9,1.3,abs(dxr+24.));diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.6,.57,.52),road*away);
  float bank=1.-smoothstep(4.6,5.4,abs(dxr));diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.7,.62,.36),bank*.8);float rv=1.-smoothstep(3.7,4.1,abs(dxr));vec3 wc=mix(vec3(.03,.11,.38),vec3(.07,.21,.52),smoothstep(2.2,3.8,abs(dxr))*.6+n2(vW.xz*vec2(.3,.05)+vec2(0.,uTime*.3))*.25);wc+=(step(.992,h2(floor(vW.xz*1.6)+floor(uTime*1.5)*.37))*smoothstep(.45,.1,length(fract(vW.xz*1.6)-.5)))*.3;diffuseColor.rgb=mix(diffuseColor.rgb,wc,rv);
  {float aw=smoothstep(.4,.6,vBw.z)*away;if(aw>.01){float seg=floor((vW.z+vW.x*.18)/70.);float zz=fract((vW.z+vW.x*.18)/70.)*70.-35.;float hs=h2(vec2(seg,4.));
   float side=hs>.5?1.:-1.;float len=18.+hs*40.;float off=dxr*side;float sr=(1.-smoothstep(.55,.85,abs(zz)))*step(5.5,off)*step(off,len);
   float car=step(.9,fract((dxr*side+uTime*1.6+hs*30.)/14.))*(1.-smoothstep(.15,.3,abs(zz)))*sr;
   vec3 rc=mix(vec3(.42,.42,.42),vec3(.05,.05,.06),car);diffuseColor.rgb=mix(diffuseColor.rgb,rc,sr*aw);
   float mr=(1.-smoothstep(.9,1.3,abs(dxr+24.)));float car2=step(.93,fract((vW.z*.08+uTime*.25)))*mr;diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.42,.42,.42),mr*aw*.8);diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.7,.15,.1),car2*aw);}}
  {float pw=smoothstep(.35,.65,vBw.x)*away*(1.-bank);if(pw>.01){vec2 pq=vec2(vW.x,vW.z+floor(vW.x/9.)*2.3);vec2 pc=floor(pq/vec2(9.,6.));vec2 pf=fract(pq/vec2(9.,6.));
   float lev=min(min(pf.x,1.-pf.x)*9.,min(pf.y,1.-pf.y)*6.);float ph=h2(pc+2.7);
   vec3 pcol=ph<.4?vec3(.05,.3,.5):ph<.7?vec3(.08,.38,.33):ph<.9?vec3(.04,.22,.5):vec3(.2,.44,.12);pcol*=.96+n2(vW.xz*.8)*.06;
   {vec2 gc=vW.xz*2.;pcol+=step(.994,h2(floor(gc)+floor(uTime)*.41))*smoothstep(.45,.1,length(fract(gc)-.5))*.2;}vec3 levc=vec3(.22,.55,.12);
   vec3 paddy=mix(levc,pcol,smoothstep(.25,.5,lev));float road2=1.-smoothstep(.5,.8,abs(fract(vW.z/54.)*54.-27.));paddy=mix(paddy,vec3(.6,.57,.52),road2*.9);
   diffuseColor.rgb=mix(diffuseColor.rgb,paddy,pw);}}
  {float sw=smoothstep(.3,.7,vBw.y);if(sw>.01){float shore=-11.-n2(vec2(vW.z*.03,1.))*7.;float sd=dxr-shore;
   vec3 sea=mix(vec3(.03,.11,.38),vec3(.08,.24,.55),smoothstep(-1.,-6.,sd)*0.+smoothstep(-4.,0.,sd)*.5)+n2(vW.xz*vec2(.08,.2)+uTime*.05)*.04;
   {vec2 gc=vW.xz*1.6;sea+=step(.993,h2(floor(gc)+floor(uTime*1.5)*.37))*smoothstep(.45,.1,length(fract(gc)-.5))*.25;}float foam=(1.-smoothstep(0.,.25,abs(sd+.35+sin(vW.z*.2+uTime*1.2)*.15)))*.55;sea=mix(sea,vec3(.95),foam);
   vec3 sand=vec3(.78,.68,.4);vec3 cc=sd<0.?sea:mix(sand,diffuseColor.rgb,smoothstep(.3,1.,sd));diffuseColor.rgb=mix(diffuseColor.rgb,cc,sw);}}}`);};}
const lam=c=>cloudify(new THREE.MeshLambertMaterial({color:c}));
// ---------- shared geoms ----------
const G={cone:new THREE.ConeGeometry(1,2.4,6),ball:new THREE.IcosahedronGeometry(1.25,2),trunk:new THREE.CylinderGeometry(.18,.25,1,5),
 box:new THREE.BoxGeometry(1,1,1),roof:new THREE.ConeGeometry(.85,.7,4),sheep:new THREE.IcosahedronGeometry(.55,0),head:new THREE.BoxGeometry(.3,.3,.35),
 spark:new THREE.IcosahedronGeometry(.34,1),card:new THREE.BoxGeometry(1.6,1.1,.08),cloud:new THREE.IcosahedronGeometry(1,2),beam:new THREE.ConeGeometry(3,18,16,1,true),cap:new THREE.SphereGeometry(.5,7,4,0,Math.PI*2,0,Math.PI/2),fern:new THREE.ConeGeometry(.35,1,4),cact:new THREE.CylinderGeometry(.3,.35,2.2,6),lhSeg:new THREE.CylinderGeometry(.75,.9,1.6,8),mill:new THREE.CylinderGeometry(.7,1.1,4,6),blade:new THREE.BoxGeometry(.35,2.6,.06),arch:new THREE.BoxGeometry(18,.35,2.2),balloon:new THREE.IcosahedronGeometry(2,1),gw:new THREE.BoxGeometry(.7,.04,.18),gb:new THREE.IcosahedronGeometry(.18,0),sail:new THREE.ConeGeometry(.7,1.8,3),snowB:new THREE.IcosahedronGeometry(.6,1),nose:new THREE.ConeGeometry(.08,.35,4),flower:new THREE.IcosahedronGeometry(.18,0),leaf:new THREE.CircleGeometry(.35,5)};
G.trunk.translate(0,.5,0);G.fern.translate(0,.5,0);G.cact.translate(0,1.1,0);G.mill.translate(0,2,0);G.blade.translate(0,1.3,0);G.gw.translate(.35,0,0);G.cone.translate(0,1.2+.8,0);G.ball.translate(0,1.8,0);G.box.translate(0,.5,0);
const M={trunk:lam('#9a7458'),wall:lam('#fbf3e4'),roofs:['#e07a5f','#7aa6c2','#e9b35d'].map(lam),wool:lam('#fffaf2'),dark:lam('#4a3f39'),
 cow:lam('#4a3a2e'),hay:lam('#e2c77a'),cact:lam('#7fb685'),sandrock:lam('#e0a979'),inst:lam('#ffffff'),rock:lam('#b9b2a8'),fl1:lam('#f7b2c8'),fl2:lam('#fff0a0'),fox:lam('#ef8f4a'),
 spark:new THREE.MeshBasicMaterial({color:'#fffbe6'}),card:new THREE.MeshLambertMaterial({color:'#fffdf6'}),stamp:new THREE.MeshBasicMaterial({color:'#e8766b'}),
 cloud:new THREE.MeshBasicMaterial({color:'#ffffff',transparent:true,opacity:.88,depthWrite:false})};
const glowTex=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');const g=x.createRadialGradient(32,32,0,32,32,32);
 g.addColorStop(0,'rgba(255,250,210,1)');g.addColorStop(.35,'rgba(255,230,150,.55)');g.addColorStop(1,'rgba(255,220,140,0)');x.fillStyle=g;x.fillRect(0,0,64,64);return new THREE.CanvasTexture(c);})();
const glowMat=new THREE.SpriteMaterial({map:glowTex,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,fog:false});
const FLC=[C('#f7b2c8'),C('#fff0a0'),C('#ffffff')];
const beamMat=new THREE.MeshBasicMaterial({color:'#ffe9b0',transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,fog:false});
const treeMats=[...pal[0].tree,...pal[1].tree].map(c=>lam(c));
// ---------- chunks ----------
const CW=150,CL=60,NCH=5,SEG_X=50,SEG_Z=20;
const chunks=[];const dynamic=[];// interactive objects
const SPOTS=[];const ISLG=lam('#8fbf7a');function spotFree(x,z,rad){for(const q of SPOTS)if(Math.hypot(q[0]-x,q[1]-z)<q[2]+rad)return false;SPOTS.push([x,z,rad]);return true;}
function rnd(seed){let s=seed;return()=>{s=(s*16807)%2147483647;return s/2147483647;};}
function buildChunk(ch,idx){
 ch.idx=idx;const z0=-idx*CL;ch.z0=z0;
 if(ch.group){scene.remove(ch.group);ch.group.traverse(o=>{if(o.material&&o.material.userData&&o.material.userData.own)o.material.dispose();if(o.isInstancedMesh)o.dispose();else if(o.isMesh&&o.geometry.userData.own)o.geometry.dispose();});}
 for(let i=dynamic.length-1;i>=0;i--)if(dynamic[i].chunk===ch)dynamic.splice(i,1);
 const g=new THREE.Group();ch.group=g;
 const geo=new THREE.PlaneGeometry(CW,CL,SEG_X,SEG_Z);geo.rotateX(-Math.PI/2);geo.userData.own=true;
 const p=geo.attributes.position,cols=new Float32Array(p.count*3),accs=new Float32Array(p.count*3),bws=new Float32Array(p.count*3),col=new THREE.Color();
 for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i)+z0-CL/2;const h=height(x,z);p.setY(i,h);p.setZ(i,z);
  groundColor(x,z,h,col);cols.set([col.r,col.g,col.b],i*3);accs.set([ACC.r,ACC.g,ACC.b],i*3);bws.set(BW,i*3);}
 geo.setAttribute('color',new THREE.BufferAttribute(cols,3));geo.setAttribute('acc',new THREE.BufferAttribute(accs,3));geo.setAttribute('bw',new THREE.BufferAttribute(bws,3));geo.computeVertexNormals();
 const ng=geo;ng.userData.own=true;
 const mesh=new THREE.Mesh(ng,groundMat);mesh.receiveShadow=true;g.add(mesh);
 // water plane
 const wgeo=new THREE.PlaneGeometry(CW,CL,30,12);wgeo.rotateX(-Math.PI/2);
 const water=new THREE.Mesh(wgeo,waterMat);water.visible=false;water.position.set(0,-1.35,z0-CL/2);g.add(water);
 const r=rnd((idx*9301+49297+SEED*7919)%2147483646+1);
 // trees
 SPOTS.length=0;const SP=[];const mkSpark=()=>{const o=new THREE.Group();SP.push(o);return o;};
 const TB=[];const addTree=(x,h,z,sx,sy,ry,kind,col,birds)=>{const o=new THREE.Object3D();o.position.set(x,h,z);o.scale.set(sx,sy,sx);o.rotation.y=ry;o.updateMatrix();const rec={o,kind,col};TB.push(rec);
  dynamic.push({type:'tree',o,rec,chunk:ch,ph:r()*6,sway:0,hasBirds:birds});};
 const forest=biome(z0-30)===5;
 const CLU=[];const autumn=biome(z0-30)===1;for(let k=0;k<(forest?9:autumn?10:5);k++)if(!(biome(z0-30)===3&&k<2))CLU.push([(r()-.5)*CW*.8,z0-r()*CL,2.5+r()*4]);
 for(let i=0;i<(forest?60:autumn?60:30)*PROPK;i++){const cc=CLU[i%CLU.length];const x=cc[0]+(r()-.5)*cc[2]*2,z=cc[1]+(r()-.5)*cc[2]*2;const h=height(x,z);if(h<-.2||h>12)continue;
  if(Math.abs(x-riverX(z))<7&&r()<.7)continue;
  if(biome(z)===4){if(r()<.8)continue;const cc=new THREE.Group();const cb=new THREE.Mesh(G.cact,M.cact);cb.castShadow=true;cc.add(cb);for(const sd of[-1,1])if(r()<.7){const arm=new THREE.Mesh(G.cact,M.cact);arm.scale.set(.6,.4,.6);arm.position.set(sd*.45,.9+r()*.5,0);cc.add(arm);}cc.position.set(x,h,z);cc.scale.setScalar(.8+r()*.6);g.add(cc);dynamic.push({type:'wobble',o:cc,chunk:ch,w:0});continue;}
  const bz=biome(z);const s=.7+r()*.8;const col=pal[bz].tree[Math.floor(r()*3)];const tall=bz===5?1.3+r()*.9:1;
  addTree(x,h,z,s,s*tall,r()*6,2,col,r()<.25);}
 // village
 const coastV=biome(z0-30)===3;for(let vc=0;vc<1;vc++)if(r()<(coastV?1:.6)){const vx=riverX(z0-30)+(coastV?1:(r()<.5?-1:1))*(16+r()*10),vz=z0-15-r()*30;
  for(let i=0;i<2+r()*3;i++){const x=vx+(r()-.5)*9,z=vz+(r()-.5)*9,h=height(x,z);if(h<-.3)continue;
   const house=new THREE.Group();const w=new THREE.Mesh(G.box,M.wall);w.scale.set(1.4,1.1,1.2);
   const rf=new THREE.Mesh(G.roof,M.roofs[Math.floor(r()*3)]);rf.position.y=1.45;rf.rotation.y=Math.PI/4;rf.scale.set(1.25,1,1.1);
   w.castShadow=rf.castShadow=true;house.add(w,rf);house.position.set(x,h-.05,z);house.rotation.y=r()*6;house.scale.setScalar(1.2);g.add(house);
   dynamic.push({type:'house',o:house,chunk:ch,base:1.2,pop:0});}}
 // animals: instanced crowds (sheep, cows, deer, rabbits, ducks, land birds)
 {const bz0=biome(z0-30);const nh=2+Math.floor(r()*3);
  const TBL={0:['pduck','pduck','bird'],1:['deer','deer','bird','rabbit'],2:['sheep','sheep','sheep','cow','rabbit'],3:['bird','duck'],4:['cow','cow','bird'],5:['sheep','rabbit','bird']};
  for(let k=0;k<nh;k++){const hx=riverX(z0)+(r()<.5?-1:1)*(8+r()*16),hz=z0-r()*CL,bi=biome(hz);const L=TBL[bi];const kind=L[Math.floor(r()*L.length)];
   if(kind==='sheep'&&r()<.6)addFence(g,hx,hz,r);
   addCrowd(g,ch,kind,hx,hz,r);}
  if(r()<.7){const dz=z0-r()*CL;addCrowd(g,ch,'duck',riverX(dz)+(r()-.5)*3,dz,r);}}
 // biome props
 for(let i=0;i<6*PROPK;i++){const x=(r()-.5)*CW*.8,z=z0-r()*CL,h=height(x,z);const bi=biome(z);
  if(bi===3){if(h>-1.6&&h<-.3&&r()<.6){const rk=new THREE.Mesh(G.ball,M.rock);rk.scale.set(.8+r(),.5+r()*.5,.8+r());rk.position.set(x,h-1.6,z);rk.castShadow=true;g.add(rk);}
   else if(h<-1.5&&r()<.25&&height(x+2,z)<-1.4&&height(x-2,z)<-1.4&&spotFree(x,z,2.6)){const bt=new THREE.Group();const hull=new THREE.Mesh(G.box,M.roofs[Math.floor(r()*3)]);hull.scale.set(1,.5,2.4);const sail=new THREE.Mesh(G.sail,M.wool);sail.position.set(0,1.6,0);bt.add(hull,sail);bt.position.set(x,-1.5,z);bt.rotation.y=r()*6;hull.castShadow=sail.castShadow=true;g.add(bt);dynamic.push({type:'boat',o:bt,chunk:ch,ph:r()*6,rock:0});}
   else if(h>-.4&&h<.6&&r()<.15){const pier=new THREE.Group();const dk=new THREE.Mesh(G.box,M.trunk);dk.scale.set(7,.25,1.4);dk.position.x=3.5;pier.add(dk);for(const px of[1.5,4,6.5]){const pl=new THREE.Mesh(G.trunk,M.trunk);pl.position.set(px,-1.5,.6);pl.scale.set(.6,1.6,.6);pier.add(pl);}const dir=Math.sign(riverX(z)-x)||1;pier.rotation.y=dir>0?0:Math.PI;pier.position.set(x,-.7,z);dk.castShadow=true;g.add(pier);}}
  else if(h<-.3||h>12)continue;
  else if(bi===2){if(r()<.6){const sm=new THREE.Group();const b1=new THREE.Mesh(G.snowB,M.hay),b2=new THREE.Mesh(G.snowB,M.hay),nose=new THREE.Mesh(G.nose,M.fox);
    b1.position.y=.6;b2.position.y=1.45;b2.scale.setScalar(.65);nose.position.set(0,1.5,.42);nose.rotation.x=Math.PI/2;b1.castShadow=b2.castShadow=true;sm.add(b1,b2,nose);sm.position.set(x,h,z);sm.rotation.y=r()*6;g.add(sm);dynamic.push({type:'wobble',o:sm,chunk:ch,w:0});}
   else {if(r()<.5)addTree(x,h,z,.8,.8,r()*6,2,pal[2].tree[Math.floor(r()*3)],false);}}
  else if(bi===5){if(r()<.45){const mu=new THREE.Group();const st=new THREE.Mesh(G.trunk,M.wool);st.scale.set(.8,.5,.8);const cap=new THREE.Mesh(G.cap,r()<.6?M.roofs[0]:M.fl2);cap.position.y=.55;cap.castShadow=true;mu.add(st,cap);mu.position.set(x,h,z);mu.scale.setScalar(.8+r()*.8);g.add(mu);dynamic.push({type:'wobble',o:mu,chunk:ch,w:0});}
   else{const im=new THREE.InstancedMesh(G.fern,M.inst,6);const mm=new THREE.Matrix4(),qq=new THREE.Quaternion(),ee=new THREE.Euler();for(let j=0;j<6;j++){const px=(r()-.5)*2.5,pz=(r()-.5)*2.5;ee.set(0,r()*6,0);qq.setFromEuler(ee);mm.compose(new THREE.Vector3(px,height(x+px,z+pz)-h,pz),qq,new THREE.Vector3(1,.7+r()*.6,1));im.setMatrixAt(j,mm);im.setColorAt(j,pal[5].tree[j%3]);}const pt=new THREE.Group();pt.add(im);pt.position.set(x,h,z);g.add(pt);dynamic.push({type:'flowers',o:pt,chunk:ch,ph:r()*6,sway:0});}}
  else if(bi===4){if(r()<.5){const rk=new THREE.Mesh(G.ball,M.sandrock);rk.scale.set(1+r()*1.5,.6+r()*.8,1+r());rk.position.set(x,h-1.4,z);rk.castShadow=true;g.add(rk);}}
  else if(bi===0){const im=new THREE.InstancedMesh(G.flower,M.inst,9);const mm=new THREE.Matrix4();for(let j=0;j<9;j++){const px=(r()-.5)*3,pz=(r()-.5)*3;mm.makeTranslation(px,height(x+px,z+pz)-h+.35,pz);im.setMatrixAt(j,mm);im.setColorAt(j,FLC[j%3]);}
   const patch=new THREE.Group();patch.add(im);patch.position.set(x,h,z);g.add(patch);dynamic.push({type:'flowers',o:patch,chunk:ch,ph:r()*6,sway:0});}
  else{const patch=new THREE.Group();const mats=bi===1?[treeMats[3],treeMats[4],treeMats[5]]:[M.fl1,M.fl2,M.wool];
   for(let j=0;j<7;j++){const f=new THREE.Mesh(bi===1?G.leaf:G.flower,mats[j%3]);const px=(r()-.5)*3,pz=(r()-.5)*3;f.position.set(px,height(x+px,z+pz)-h+(bi===1?.05:.35),pz);if(bi===1)f.rotation.set(-Math.PI/2,0,r()*6);patch.add(f);}
   patch.position.set(x,h,z);g.add(patch);if(bi===0)dynamic.push({type:'flowers',o:patch,chunk:ch,ph:r()*6,sway:0});}}
 addHuman(g,ch,z0,r);addPlots(g,z0,r);
 {let dirty=0;for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i);let dry=0;for(const t of TOWNS){const rr=t[2]*1.05;if(Math.hypot(x-t[0],z-t[1])<rr){dry=1;bws[i*3+2]=0;}}if(RAILZ!==null&&Math.abs(z-RAILZ)<3.4)dry=1;if(dry&&bws[i*3]>0){bws[i*3]=0;dirty=1;}}if(dirty)geo.attributes.bw.needsUpdate=true;}
 for(const rec of TB){const p=rec.o.position;if(TOWNS.some(t=>Math.hypot(t[0]-p.x,t[1]-p.z)<t[2]*.75)||(RAILZ!==null&&Math.abs(p.z-RAILZ)<2.5)){rec.o.scale.setScalar(.001);rec.o.updateMatrix();rec.hid=1;}}
 // build tree instances
 {const n=TB.length;if(n){const mk=(geo,cnt)=>{const im=new THREE.InstancedMesh(geo,M.inst,Math.max(1,cnt));im.castShadow=true;im.count=0;g.add(im);return im;};
  const trI=mk(G.trunk,n),coI=mk(G.cone,n),baI=mk(G.ball,n);trI.instanceColor=null;const brown=C('#9a7458');
  for(const rec of TB){rec.tr=trI;rec.ti=trI.count++;trI.setMatrixAt(rec.ti,rec.o.matrix);trI.setColorAt(rec.ti,brown);const top=rec.kind===1?coI:baI;rec.top=top;rec.pi=top.count++;top.setMatrixAt(rec.pi,rec.o.matrix);top.setColorAt(rec.pi,rec.col);}
  for(const im of[trI,coI,baI]){im.instanceMatrix.needsUpdate=true;if(im.instanceColor)im.instanceColor.needsUpdate=true;im.computeBoundingSphere();}}}
 {const bz=biome(z0-30);if(bz!==3&&r()<.5){const z=z0-r()*CL,x=riverX(z)+(r()<.5?-1:1)*(14+r()*14);if(height(x,z)>-.2)addAct(g,ch,r()<.5?'kite':'ball',x,z,r);}
  const fz=z0-r()*CL,fs=(bz===3||r()<.5)?1:-1,fx=riverX(fz)+fs*(bz===3?-13:9.5);if(r()<.6&&height(fx,fz)>-.4){const fd=addAct(g,ch,'fish',fx,fz,r);fd.o.rotation.y=fs>0?0:Math.PI;}}
 // coast extras
 if(biome(z0-30)===3){for(let k=0;k<5*PROPK;k++){const z=z0-r()*CL,x=riverX(z)-15-r()*16;
   if(r()<.45){if(!spotFree(x,z,4.5))continue;const isl=new THREE.Group();const rk=new THREE.Mesh(G.ball,M.sandrock);rk.scale.set(1.5+r()*2,.5,1.2+r()*1.5);rk.position.y=-2.1;const gr=new THREE.Mesh(G.ball,ISLG);gr.scale.set(rk.scale.x*.6,.4,rk.scale.z*.6);gr.position.y=-1.75;isl.add(rk,gr);if(r()<.6){const tr=new THREE.Mesh(G.ball,M.cact);tr.scale.setScalar(.35);tr.position.set(.3,-1.0,0);isl.add(tr);}isl.position.set(x,0,z);rk.castShadow=true;g.add(isl);}
   else{if(height(x,z)>-1.3||!spotFree(x,z,2.6))continue;const bt=new THREE.Group();const hull=new THREE.Mesh(G.box,M.roofs[Math.floor(r()*3)]);hull.scale.set(1,.5,2.4);const sail=new THREE.Mesh(G.sail,M.wool);sail.position.set(0,1.6,0);bt.add(hull,sail);bt.position.set(x,-.8,z);bt.rotation.y=r()*6;hull.castShadow=sail.castShadow=true;g.add(bt);dynamic.push({type:'boat',o:bt,chunk:ch,ph:r()*6,rock:0});}}
for(let k=0;k<3;k++){const gc=new THREE.Vector3((r()-.5)*60,6+r()*5,z0-r()*CL);const gl=new THREE.Group();const gs=[];
   for(let i=0;i<6;i++){const gb=makeGull();gl.add(gb);gs.push({m:gb,a:r()*6,rad:3+r()*4,sp:.6+r()*.5});}gl.position.copy(gc);g.add(gl);dynamic.push({type:'gulls',o:gl,chunk:ch,gs,scat:0});}
  if(r()<.4){const lx=riverX(z0-30)-26-r()*6,lz=z0-30,lh=Math.max(height(lx,lz),-.5);const lt=new THREE.Group();
   for(let i=0;i<4;i++){const seg=new THREE.Mesh(G.lhSeg,i%2?M.roofs[0]:M.wall);seg.position.y=i*1.6+.8;seg.scale.setScalar(1-i*.1);seg.castShadow=true;lt.add(seg);}
   const cap=new THREE.Mesh(G.roof,M.roofs[0]);cap.position.y=7.2;cap.scale.set(1.2,1.2,1.2);lt.add(cap);const lamp=new THREE.Sprite(glowMat.clone());lamp.scale.setScalar(5);lamp.position.y=6.6;lt.add(lamp);
   const piv=new THREE.Group();piv.position.y=6.6;const cone=new THREE.Mesh(G.beam,beamMat);cone.rotation.z=Math.PI/2;cone.position.x=9;piv.add(cone);lt.add(piv);
   lt.position.set(lx,lh,lz);g.add(lt);dynamic.push({type:'lighthouse',o:lt,chunk:ch,lamp,piv});}}
 // windmills / bridge
 if(r()<.35&&biome(z0-30)!==3){const wx=(r()<.5?-1:1)*(22+r()*14)+riverX(z0-20),wz=z0-20-r()*20,wh=height(wx,wz);if(wh>-.2&&wh<9){const wm=new THREE.Group();
   const tw=new THREE.Mesh(G.mill,M.wall);tw.castShadow=true;const cp=new THREE.Mesh(G.roof,M.roofs[2]);cp.position.y=4.3;cp.rotation.y=Math.PI/4;const hub=new THREE.Group();hub.position.set(0,3.6,.9);
   for(let i=0;i<4;i++){const bl=new THREE.Mesh(G.blade,M.card);bl.rotation.z=i*Math.PI/2;bl.castShadow=true;hub.add(bl);}wm.add(tw,cp,hub);wm.position.set(wx,wh,wz);wm.rotation.y=r()*1-.5;g.add(wm);dynamic.push({type:'mill',o:wm,chunk:ch,hub,sp:1});}}
 const _bz=z0-10-r()*40;if(r()<.5&&biome(_bz)!==3&&biome(_bz-10)!==3&&biome(_bz+10)!==3&&height(riverX(_bz)-24,_bz)>-.2&&height(riverX(_bz)+30,_bz)>-.2){const bz=_bz,bx=riverX(bz);const br=new THREE.Group();const deck=new THREE.Mesh(G.arch,M.trunk);deck.castShadow=true;br.add(deck);
   br.position.set(bx,Math.max(height(bx-8,bz),height(bx+8,bz),-1)-.3,bz);br.rotation.y=Math.atan(riverX(bz+.5)-riverX(bz-.5));g.add(br);roadSeg(g,bx-9,bz,bx-24,bz);roadSeg(g,bx+9,bz,bx+30,bz);}
 // wow set piece every ~800m: hot-air balloons + sparkle ring
 if(idx>0&&idx%13===0){const cz=z0-30,cx=riverX(cz);for(let i=0;i<5;i++){const bl=new THREE.Group();const env=new THREE.Mesh(G.balloon,[M.roofs[0],M.roofs[1],M.roofs[2],M.fl1,M.fl2][i]);env.scale.set(1,1.2,1);
   const bs=new THREE.Mesh(G.box,M.trunk);bs.scale.set(.7,.5,.7);bs.position.y=-2.6;env.castShadow=true;bl.add(env,bs);bl.position.set(cx+(i-2)*9,height(cx,cz)+12+r()*8,cz-r()*20);g.add(bl);dynamic.push({type:'balloon',o:bl,chunk:ch,ph:r()*6,y0:bl.position.y,push:0});}
  const ry=Math.max(height(cx,cz),0)+10;for(let i=0;i<12;i++){const a=i/12*Math.PI*2;const sp=mkSpark();const gl=new THREE.Sprite(glowMat.clone());gl.scale.setScalar(1.15);sp.add(gl);sp.position.set(cx+Math.cos(a)*4,ry+Math.sin(a)*4,cz);g.add(sp);dynamic.push({type:'spark',o:sp,chunk:ch,taken:false,t:0});}
  ch.wow=true;}else ch.wow=false;
 // sparkles (trail line)
 const sx=(r()-.5)*40,sz=z0-10-r()*30;const sy=height(sx,sz)+5+r()*8;const dir=(r()-.5)*.6;
 for(let i=0;i<6;i++){const s=mkSpark();const gl=new THREE.Sprite(glowMat.clone());gl.scale.setScalar(1.15);s.add(gl);s.position.set(sx+i*dir*6,sy+Math.sin(i*.8)*1.5,sz-i*4);g.add(s);
  dynamic.push({type:'spark',o:s,chunk:ch,taken:false,t:0});}
 // postcard
 if(r()<.45){const x=(r()-.5)*50,z=z0-r()*CL;const c=new THREE.Group();const card=new THREE.Mesh(G.card,M.card);
  const st=new THREE.Mesh(new THREE.PlaneGeometry(.35,.4),M.stamp);st.position.set(.5,.25,.05);const gl2=new THREE.Sprite(glowMat.clone());gl2.scale.setScalar(4.5);c.add(card,st,gl2);
  c.position.set(x,Math.max(height(x,z),0)+7+r()*6,z);g.add(c);dynamic.push({type:'card',o:c,chunk:ch,taken:false,t:0});}
 // clouds
 for(let i=0;i<3;i++){const cl=new THREE.Group();const x=(r()-.5)*90,z=z0-r()*CL,y=30+r()*25;
  const cm=M.cloud.clone();cm.userData.own=1;const np=4+Math.floor(r()*3);for(let j=0;j<np;j++){const m=new THREE.Mesh(G.cloud,cm);const a2=j/np*6.28;m.position.set(Math.cos(a2)*1.4+(r()-.5),r()*.8+(j===0?.8:0),Math.sin(a2)*1.1);m.scale.setScalar(j===0?2:1.1+r()*.8);cl.add(m);}
  cl.position.set(x,y,z);cl.scale.setScalar(.85+r()*.5);cl.traverse(o=>{if(o.isMesh)o.castShadow=true;});g.add(cl);dynamic.push({type:'cloud',o:cl,chunk:ch,ph:r()*6,cm});}
 if(SP.length){const im=new THREE.InstancedMesh(G.spark,M.spark,SP.length);im.frustumCulled=false;g.add(im);let k=0;for(const d of dynamic)if(d.chunk===ch&&d.type==='spark'){d.im=im;d.ii=k;d.o.updateMatrix();im.setMatrixAt(k++,d.o.matrix);}im.count=k;}
 scene.add(g);}
const CR={sheep:{n:[12,22],c:'#f4efe4',s:[.46,.32,.62],head:1,sp:4,sc:12,toast:'Koyun sürüsü dağıldı 🐑'},cow:{n:[4,7],c:'#5a4434',s:[.6,.38,.95],head:1,sp:3,sc:12,toast:'İnekler şaşırdı 🐄'},
 deer:{n:[3,6],c:'#a0623a',s:[.36,.32,.75],head:1,sp:10,sc:6,hop:1,toast:'Geyikler sıçradı 🦌'},rabbit:{n:[4,8],c:'#d9c7a8',s:[.22,.2,.3],head:1,sp:9,sc:4,hop:1,toast:'Tavşanlar kaçıştı 🐇'},
 pduck:{n:[5,9],c:'#fffaf0',s:[.26,.18,.4],sp:5,sc:6,paddy:1,head:1,toast:'Ördekler tarlada kanat çırptı 🦆'},duck:{n:[4,8],c:'#fffaf0',s:[.26,.18,.4],sp:5,sc:5,water:1,head:1,toast:'Ördekler suya daldı 🦆'},bird:{n:[8,14],c:'#2f2a28',s:[.3,.12,.3],sp:12,sc:6,fly:1,toast:'Kuş sürüsü havalandı 🐦'}};
const crowdGeo=new THREE.IcosahedronGeometry(1,1),birdGeo=(()=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([0,0,.6, -1.2,0,-.3, 0,0,-.1, 0,0,.6, 0,0,-.1, 1.2,0,-.3],3));g.computeVertexNormals();return g;})();
const crowdMat=cloudify(new THREE.MeshLambertMaterial({color:'#ffffff',side:THREE.DoubleSide}));const seenCrowd={};let crowdToastT=0;
function addCrowd(g,ch,kind,hx,hz,r){const c=CR[kind];const n=c.n[0]+Math.floor(r()*(c.n[1]-c.n[0]+1));
 const im=new THREE.InstancedMesh(c.fly?birdGeo:crowdGeo,crowdMat,n);im.castShadow=!c.fly;const col=C(c.c);const ms=[];
 for(let i=0;i<n;i++){const x=hx+(r()-.5)*c.sc,z=hz+(r()-.5)*c.sc;if(!c.water&&!c.paddy&&!c.fly&&isWet(x,z)){ms.push(null);continue;}ms.push({x,z,y:0,vx:0,vz:0,ph:r()*6,yaw:r()*6,hop:0});
  im.setColorAt(i,kind==='sheep'&&r()<.1?C('#3b332e'):kind==='cow'&&r()<.4?C('#f1ebe0'):col.clone().offsetHSL(0,0,(r()-.5)*.1));}
 let hm=null;if(c.head){hm=new THREE.InstancedMesh(crowdGeo,crowdMat,n);hm.frustumCulled=false;const hc=C(kind==='sheep'?'#3a312b':kind.includes('duck')?'#3f7d4e':c.c);for(let i=0;i<n;i++)hm.setColorAt(i,hc);g.add(hm);}
 im.frustumCulled=false;g.add(im);const d={hm,type:'crowd',o:im,chunk:ch,kind,c,ms,cx:hx,cz:hz,scared:0,wx:(r()-.5),wz:(r()-.5),cool:0,init:0};crowdSet(d,0);dynamic.push(d);}
const _m4=new THREE.Matrix4(),_q=new THREE.Quaternion(),_e=new THREE.Euler(),_v=new THREE.Vector3(),_s=new THREE.Vector3();
function isWet(x,z){const dx=x-riverX(z);return Math.abs(dx)<9.5||(biome(z)===3&&dx<-10)||height(x,z)<-.3;}
function gH(m){if(m.gx===undefined||Math.abs(m.gx-m.x)+Math.abs(m.gz-m.z)>.4){m.gx=m.x;m.gz=m.z;m.gh=height(m.x,m.z);}return m.gh;}
function crowdSet(d,t){const c=d.c;for(let i=0;i<d.ms.length;i++){const m=d.ms[i];if(!m){_m4.makeScale(0,0,0);d.o.setMatrixAt(i,_m4);if(d.hm)d.hm.setMatrixAt(i,_m4);continue;}
 let y;if(c.paddy)y=Math.max(gH(m),-1.3)+.12+Math.sin(t*2+m.ph)*.04;else if(c.water)y=-1.45+Math.sin(t*2+m.ph)*.05;else if(c.fly)y=Math.max(gH(m),-1.3)+.15+m.y;else y=gH(m)+c.s[1]*.8+Math.abs(Math.sin(m.hop))*(c.hop?.9:.25);
 _e.set(0,m.yaw,c.fly&&m.y>.5?Math.sin(t*14+m.ph)*.6:0);_q.setFromEuler(_e);_s.set(c.s[0]*1.2,c.s[1]*1.2,c.s[2]*1.2);if(c.fly){const f=m.y>.5?1:.6;_s.set(.8*f,1,.8*f);if(m.y>.5)_s.x*=.6+Math.abs(Math.sin(t*14+m.ph))*.6;}
 _m4.compose(_v.set(m.x,y,m.z),_q,_s);d.o.setMatrixAt(i,_m4);if(d.hm){const hs=c.s[1]*.75*1.2;_v.set(m.x+Math.sin(m.yaw)*c.s[2]*1.2*.95,y+c.s[1]*(m.gr&&d.scared<=0?.05:.5),m.z+Math.cos(m.yaw)*c.s[2]*1.2*(m.gr&&d.scared<=0?1.05:.95));_s.set(hs,hs,hs*1.2);_m4.compose(_v,_q,_s);d.hm.setMatrixAt(i,_m4);}}if(d.hm){d.hm.instanceMatrix.needsUpdate=true;if(!d.init&&d.hm.instanceColor)d.hm.instanceColor.needsUpdate=true;}d.o.instanceMatrix.needsUpdate=true;if(!d.init&&d.o.instanceColor){d.o.instanceColor.needsUpdate=true;d.init=1;}}
function crowdTick(d,dt,t){const c=d.c;const dx0=d.cx-birdPos.x,dz0=d.cz-birdPos.z;const dist2=dx0*dx0+dz0*dz0;if(dist2>9000&&d.scared<=0)return;
 d.cool-=dt;const low=birdPos.y-height(d.cx,d.cz)<16;
 if(dist2<(c.fly?260:180)&&low&&d.scared<=0&&d.cool<=0){d.scared=c.fly?4:2.5;d.cool=6;chime(c.fly?1.4:.9);
  if(!seenCrowd[d.kind]){seenCrowd[d.kind]=1;sparks+=2;toast(c.toast+' +2 ✦');}else if(crowdToastT<=0&&Math.random()<.35){toast(c.toast);crowdToastT=6;}
  for(const m of d.ms)if(m){let ax=m.x-birdPos.x,az=m.z-birdPos.z;const l=Math.hypot(ax,az)||1;const sp=c.sp*(c.fly?.9:.4)*(.7+Math.random()*.6);m.vx=ax/l*sp+(Math.random()-.5)*2;m.vz=az/l*sp+(Math.random()-.5)*2;}}
 const sc=d.scared>0;if(sc)d.scared-=dt;let sx=0,sz=0,k=0;for(const m of d.ms)if(m){sx+=m.x;sz+=m.z;k++;}if(!k)return;sx/=k;sz/=k;d.cx=sx;d.cz=sz;
 for(const m of d.ms){if(!m)continue;
  if(sc){m.x+=m.vx*dt;m.z+=m.vz*dt;m.vx*=1-dt*.7;m.vz*=1-dt*.7;m.yaw=Math.atan2(m.vx,m.vz);m.hop+=dt*(c.hop?6:4);if(c.fly){m.y=Math.min(m.y+dt*6,9+Math.sin(m.ph)*2);}}
  else{const tx=sx+d.wx*2+Math.sin(t*.07+m.ph)*c.sc*.3-m.x,tz=sz+d.wz*2+Math.cos(t*.06+m.ph)*c.sc*.3-m.z;const graze=Math.sin(t*.25+m.ph*3)>.2?.15:1;m.gr=graze<1?1:0;if(c.fly&&m.y<.3&&Math.sin(t*1.7+m.ph*5)>.85)m.hop+=dt*6;m.vx+=(tx*.025*graze-m.vx)*dt;m.vz+=(tz*.025*graze-m.vz)*dt;m.x+=(m.vx+d.wx*.05)*dt;m.z+=(m.vz+d.wz*.05)*dt;
   if(Math.hypot(m.vx,m.vz)>.05)m.yaw+=(Math.atan2(m.vx,m.vz)-m.yaw)*dt*.3;m.hop*=1-dt*2;if(c.fly)m.y=Math.max(0,m.y-dt*3);}
  if(!c.water&&!c.paddy&&!c.fly&&Math.abs(m.x-riverX(m.z))<9.5){m.vx*=-1;m.vz*=-1;m.x+=m.vx*dt*2;m.z+=m.vz*dt*2;}}
 crowdSet(d,t);}
const fenceGeo=new THREE.BoxGeometry(.12,.5,.12),railGeo=new THREE.BoxGeometry(.06,.06,1);
function addFence(g,hx,hz,r){const R0=9+r()*3,n=22,im=new THREE.InstancedMesh(fenceGeo,M.trunk,n),rl=new THREE.InstancedMesh(railGeo,M.trunk,n);const gap=Math.floor(r()*n);
 for(let i=0;i<n;i++){const a=i/n*Math.PI*2,x=hx+Math.cos(a)*R0*1.3,z=hz+Math.sin(a)*R0,h=height(x,z);const a2=(i+1)/n*Math.PI*2,x2=hx+Math.cos(a2)*R0*1.3,z2=hz+Math.sin(a2)*R0;
  const mx=(x+x2)/2,mz=(z+z2)/2;const ok=i!==gap&&!isWet(x,z)&&!isWet(x2,z2)&&!isWet(mx,mz)&&Math.abs(mx-riverX(mz))>11&&height(x2,z2)>-.3;_m4.compose(_v.set(x,h+.25,z),_q.identity(),_s.set(ok?1:0,ok?1:0,ok?1:0));im.setMatrixAt(i,_m4);
  const L=Math.hypot(x2-x,z2-z);_e.set(0,Math.atan2(x2-x,z2-z),0);_q.setFromEuler(_e);_m4.compose(_v.set((x+x2)/2,h+.4,(z+z2)/2),_q,_s.set(ok?1:0,ok?1:0,ok?L:0));rl.setMatrixAt(i,_m4);}
 im.castShadow=true;g.add(im,rl);}
// ---------- human: rail+train, ships, villages/towns ----------
const SMOKET=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');const g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.55,'rgba(250,248,242,.75)');g.addColorStop(1,'rgba(245,242,235,0)');x.fillStyle=g;x.fillRect(0,0,64,64);return new THREE.CanvasTexture(c);})();
const HM={puffD:null,emb:lam('#b39a74'),xing:lam('#8d8a84'),rail:lam('#6b5a4e'),bridge:lam('#cbb89a'),girder:lam('#8a4f3a'),sleeper:lam('#a58a6c'),loco:lam('#3d4f7a'),boiler:lam('#2f3640'),wag:['#c9573f','#e9b35d','#5f8f6a','#7aa6c2'].map(lam),smoke:new THREE.MeshLambertMaterial({color:'#f4f1ea',transparent:true,opacity:.85}),plaza:lam('#e8dcc2'),road:lam('#cfc3aa'),hull:lam('#b5533c'),wake:new THREE.MeshBasicMaterial({color:'#ffffff',transparent:true,opacity:.55,depthWrite:false}),cont:['#d9785a','#e9b35d','#5fb3b8','#7aa6c2'].map(lam)};
const seenHuman={};function humanToast(k,msg){if(seenHuman[k])return;seenHuman[k]=1;sparks+=3;toast(msg+' +3 ✦');chime(1.2);}
function trainY(d,x){const f=(x+CW/2)/1.2,i=Math.max(0,Math.min(d.prof.length-2,Math.floor(f))),u=THREE.MathUtils.clamp(f-i,0,1);return d.prof[i]+(d.prof[i+1]-d.prof[i])*u;}
function railY(x,z){return Math.max(height(x,z),.2)+.12;}
function addHuman(g,ch,z0,r){const bz=biome(z0-30);let railZ=null;TOWNS.length=0;RAILZ=null;
 // railway across chunk
 if(bz!==3&&biome(z0)!==3&&biome(z0-CL)!==3&&r()<.45){const zr=z0-10-r()*40;railZ=zr;RAILZ=zr;const n=Math.ceil(CW/1.2),sl=new THREE.InstancedMesh(G.box,HM.sleeper,n),rl=new THREE.InstancedMesh(G.box,HM.rail,n*2);
  const prof=[],wet=[];for(let i=0;i<n;i++){const x=-CW/2+i*1.2;const dx=x-riverX(zr);wet.push(Math.abs(dx)<6.2||height(x,zr)<-.25);prof.push(railY(x,zr));}
  for(let i=0;i<n;i++){let dmin=99;for(let j=Math.max(0,i-8);j<Math.min(n,i+9);j++)if(wet[j])dmin=Math.min(dmin,Math.abs(j-i));if(dmin<99){const k=1-Math.max(0,dmin-1)/7;prof[i]=Math.max(prof[i],THREE.MathUtils.lerp(prof[i],2.3,THREE.MathUtils.smoothstep(k,0,1)));}}
  for(let i=0;i<n;i++){const x=-CW/2+i*1.2;const y=prof[i];_m4.compose(_v.set(x,y-.12,zr),_q.identity(),_s.set(.28,.12,1.6));sl.setMatrixAt(i,_m4);
   for(const sd of[-.5,.5]){_m4.compose(_v.set(x,y,zr+sd),_q.identity(),_s.set(1.25,.14,.18));rl.setMatrixAt(i*2+(sd>0?1:0),_m4);}}
  sl.receiveShadow=true;g.add(sl,rl);
  {const em=new THREE.InstancedMesh(G.box,HM.emb,n);let ek=0;for(let i=0;i<n;i++){if(wet[i])continue;const x=-CW/2+i*1.2,gh=height(x,zr),top=prof[i]-.2;if(top-gh<.15)continue;const w=2.2+Math.min(2,(top-gh)*.8);_m4.compose(_v.set(x,gh-.1,zr),_q.identity(),_s.set(1.25,top-gh+.1,w));em.setMatrixAt(ek++,_m4);}em.count=ek;em.receiveShadow=true;g.add(em);}
  {const xc=riverX(zr)-24,ic=Math.round((xc+CW/2)/1.2);if(ic>0&&ic<n&&!wet[ic]){const y=prof[ic];const pl=new THREE.Mesh(G.box,HM.xing);pl.scale.set(2.8,.06,3.2);pl.position.set(xc,y-.02,zr);pl.receiveShadow=true;g.add(pl);for(const sd of[-1,1])for(let q=0;q<3;q++){const st=new THREE.Mesh(G.box,q%2?M.wall:M.roofs[0]);st.scale.set(.5,.08,.22);st.position.set(xc+sd*1.8+(q-1)*.5*sd,y,zr+sd*2.1);g.add(st);}for(const sd of[-1,1]){const po=new THREE.Mesh(G.box,M.wall);po.scale.set(.18,1,.18);po.position.set(xc-sd*1.6,height(xc-sd*1.6,zr+sd*2.1),zr+sd*2.1);po.castShadow=true;g.add(po);}}}
  // bridges: deck + girders + piers over every wet span
  {let i=0;while(i<n){if(!wet[i]){i++;continue;}let j=i;while(j<n&&wet[j])j++;const x0=-CW/2+(i-.8)*1.2,x1=-CW/2+(j-.2)*1.2,L=x1-x0,cxB=(x0+x1)/2,yB=2.3;
    const deck=new THREE.Mesh(G.box,HM.bridge);deck.scale.set(L,.35,2.6);deck.position.set(cxB,yB-.5,zr);deck.castShadow=true;g.add(deck);
    for(const sd of[-1.25,1.25]){const gd=new THREE.Mesh(G.box,HM.girder);gd.scale.set(L,.5,.18);gd.position.set(cxB,yB-.1,zr+sd);gd.castShadow=true;g.add(gd);}
    const np=Math.max(2,Math.round(L/6));for(let k=0;k<=np;k++){const px=x0+L*k/np;const pr=new THREE.Mesh(G.box,HM.bridge);const base=Math.min(height(px,zr),-1);pr.scale.set(.7,yB-.5-base,1.8);pr.position.set(px,base,zr);g.add(pr);}
    i=j;}}
  const tr=new THREE.Group();const cars=[];const dir=r()<.5?1:-1;
  const loco=new THREE.Group();const lb=new THREE.Mesh(G.box,HM.loco);lb.scale.set(3,1,1.2);const bo=new THREE.Mesh(G.trunk,HM.boiler);bo.scale.set(1.6,.6,1.6);bo.position.set(dir*.9,1,0);const cab=new THREE.Mesh(G.box,HM.wag[0]);cab.scale.set(.9,.7,1.25);cab.position.set(-dir*1,1,0);loco.add(lb,bo,cab);lb.castShadow=true;tr.add(loco);cars.push(loco);
  const nw=3+Math.floor(r()*3);for(let i=0;i<nw;i++){const w=new THREE.Mesh(G.box,HM.wag[Math.floor(r()*4)]);w.scale.set(2.8,1,1.2);w.castShadow=true;tr.add(w);cars.push(w);}
  const puffs=[];for(let i=0;i<7;i++){const sm=new THREE.SpriteMaterial({map:SMOKET,color:'#cfc8bc',transparent:true,depthWrite:false,opacity:.5});sm.userData.own=1;const p=new THREE.Sprite(sm);p.renderOrder=5;p.visible=false;tr.add(p);puffs.push({m:p,t:9});}
  g.add(tr);dynamic.push({type:'train',o:tr,chunk:ch,prof,cars,puffs,zr,dir,x:(r()-.5)*60,sp:4+r()*2,pt:0});}
 // ships on river
 if(r()<.55){const sh=makeShip(r,bz===3?0:1);const sz=z0-r()*CL;sh.position.set(riverX(sz),-.75,sz);g.add(sh);dynamic.push({type:'ship',o:sh,chunk:ch,river:1,z:sz,sp:(r()<.5?-1:1)*(1+r()*1.5),ph:r()*6});}
 if(bz===3)for(let k=0;k<2;k++){if(r()<.6){const sh=makeShip(r,r()<.5?0:2);const sz=z0-r()*CL,sx=riverX(sz)-22-r()*14;if(height(sx,sz)>-1.2||!spotFree(sx,sz,7))continue;sh.position.set(sx,-.7,sz);sh.rotation.y=r()*6;g.add(sh);dynamic.push({type:'ship',o:sh,chunk:ch,river:0,sp:.8+r(),ph:r()*6});}}
 // settlement
 if(r()<(bz===0||bz===4?.35:.55)){const town=r()<.35;const side=r()<.5?-1:1;const cz=z0-15-r()*30,cx=riverX(cz)+side*(bz===3?24:16+r()*10);if(height(cx,cz)>-.2)addTown(g,ch,cx,cz,town,r,bz,railZ);}}
const WAKET=(()=>{const c=document.createElement('canvas');c.width=64;c.height=128;const x=c.getContext('2d');x.lineCap='round';for(let i=0;i<14;i++){const f=i/14;x.strokeStyle='rgba(255,255,255,'+(.75*(1-f))+')';x.lineWidth=5-f*3;x.beginPath();const y0=4+f*112,y1=y0+9,w0=4+f*26,w1=4+(f+1/14)*26;x.moveTo(32-w0,y0);x.lineTo(32-w1,y1);x.moveTo(32+w0,y0);x.lineTo(32+w1,y1);x.stroke();}const gr=x.createLinearGradient(0,0,0,40);gr.addColorStop(0,'rgba(255,255,255,.55)');gr.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=gr;x.fillRect(24,0,16,40);return new THREE.CanvasTexture(c);})();
const WAKEG=new THREE.PlaneGeometry(1,1).rotateX(-Math.PI/2);const WAKEM=new THREE.MeshBasicMaterial({map:WAKET,transparent:true,depthWrite:false,opacity:.7});
function makeShip(r,kind){const s=new THREE.Group();const L=kind===2?5:kind===1?4:6;const hull=new THREE.Mesh(G.box,kind===2?M.wall:HM.hull);hull.scale.set(1.5,.6,L);hull.castShadow=true;
 const bow=new THREE.Mesh(G.roof,hull.material);bow.rotation.y=Math.PI/4;bow.scale.set(1.05,.85,1.05);bow.position.set(0,.3,-L/2);bow.rotation.x=0;s.add(hull,bow);
 if(kind===2){const deck=new THREE.Mesh(G.box,M.wall);deck.scale.set(1.2,.6,2.6);deck.position.y=.6;const fun=new THREE.Mesh(G.trunk,M.roofs[0]);fun.scale.set(1.3,.7,1.3);fun.position.set(0,1.2,.6);s.add(deck,fun);deck.castShadow=true;}
 else{const nc=kind===1?3:5;for(let i=0;i<nc;i++){const c=new THREE.Mesh(G.box,HM.cont[Math.floor(r()*4)]);c.scale.set(1.2,.5,.8);c.position.set(0,.6,-L/2+1+i*.85);c.castShadow=true;s.add(c);}const br=new THREE.Mesh(G.box,M.wall);br.scale.set(1.2,.9,.7);br.position.set(0,.6,L/2-.5);s.add(br);}
 const deckS=new THREE.Mesh(G.box,M.wall);deckS.scale.set(.5,.08,L*.8);deckS.position.y=.62;s.add(deckS);
 {const wk=new THREE.Mesh(WAKEG,WAKEM);wk.scale.set(2.6,1,L*.75);wk.position.set(0,.06,L/2+L*.36);wk.renderOrder=2;s.add(wk);}
 s.scale.setScalar(1.6);return s;}
const TOWNS=[];let RAILZ=null;function roadSeg(g,x0,z0,x1,z1){const n=Math.ceil(Math.hypot(x1-x0,z1-z0)/1.5);const im=new THREE.InstancedMesh(G.box,HM.road,n);im.receiveShadow=true;let k=0;const ang=Math.atan2(x1-x0,z1-z0);_e.set(0,ang,0);_q.setFromEuler(_e);
 for(let i=0;i<n;i++){const f=(i+.5)/n,x=x0+(x1-x0)*f,z=z0+(z1-z0)*f;if(Math.abs(x-riverX(z))<10)continue;const h=height(x,z);if(h<-.2)continue;_m4.compose(_v.set(x,h+.01,z),_q,_s.set(1.3,.07,1.6));im.setMatrixAt(k++,_m4);}im.count=k;g.add(im);}
function addTown(g,ch,cx,cz,town,r,bz,railZ){TOWNS.push([cx,cz,town?24:15]);const N=town?22+Math.floor(r()*10):7+Math.floor(r()*5);const R0=town?14:8;
 const pl=new THREE.Mesh(G.cap,HM.plaza);pl.scale.set(town?5:3,.05,town?5:3);pl.position.set(cx,height(cx,cz)+.02,cz);pl.receiveShadow=true;g.add(pl);
 if(town){roadSeg(g,cx-R0*1.2,cz,cx+R0*1.2,cz);roadSeg(g,cx,cz-R0*1.2,cx,cz+R0*1.2);}
 if(railZ!==null&&Math.abs(railZ-cz)<40){roadSeg(g,cx,cz,cx,railZ+1.5);const sx=cx,sz=railZ+2.6,sh=Math.max(height(sx,sz),.2);const st=new THREE.Group();const b=new THREE.Mesh(G.box,M.wall);b.scale.set(5,1.3,1.6);const rf=new THREE.Mesh(G.box,M.roofs[0]);rf.scale.set(5.6,.25,2.2);rf.position.y=1.35;const pf=new THREE.Mesh(G.box,HM.plaza);pf.scale.set(8,.2,1);pf.position.z=-1.2;b.castShadow=rf.castShadow=true;st.add(b,rf,pf);st.position.set(sx,sh,sz);g.add(st);}
 const W=new THREE.InstancedMesh(G.box,M.inst,N),Rf=new THREE.InstancedMesh(G.roof,M.inst,N);W.castShadow=Rf.castShadow=true;
 const wallC=bz===4?['#f2d9b0','#ead0a4']:bz===2?['#ffffff','#f3f3f3']:['#fbf3e4','#f4e6cf'];const roofC=bz===3?['#7aa6c2','#ffffff','#e07a5f']:bz===1?['#c9573f','#9a5a3c','#e9b35d']:bz===4?['#d9a066','#c98d4e','#e07a5f']:['#e07a5f','#7aa6c2','#e9b35d'];
 let k=0;for(let i=0;i<N*3&&k<N;i++){let x,z,rot;if(town){const ring=2+Math.floor(r()*3);const a=r()*Math.PI*2;x=cx+Math.cos(a)*ring*R0/4;z=cz+Math.sin(a)*ring*R0/4;if(Math.abs(x-cx)<1.8||Math.abs(z-cz)<1.8)continue;rot=Math.round(r()*2)*Math.PI/2;}
  else{const a=r()*Math.PI*2,d=3+r()*R0;x=cx+Math.cos(a)*d;z=cz+Math.sin(a)*d;rot=-a;}
  const h=height(x,z);if(h<-.2||Math.abs(x-riverX(z))<11||Math.abs(x-riverX(z)+24)<2.6)continue;if(town&&(Math.abs(x-cx)<1.6||Math.abs(z-cz)<1.6))continue;if(railZ!==null&&Math.abs(z-railZ)<3.5)continue;const big=(town&&r()<.3?1.6:1)*1.35;const sx=1.3*big,sy=(town?1.1+r()*.9:1)*big*.9,sz=1.1;
  _e.set(0,rot,0);_q.setFromEuler(_e);_m4.compose(_v.set(x,h-.05,z),_q,_s.set(sx,sy,sz));W.setMatrixAt(k,_m4);W.setColorAt(k,C(wallC[k%2]));
  _e.set(0,rot+Math.PI/4,0);_q.setFromEuler(_e);_m4.compose(_v.set(x,h-.05+sy+.33*big,z),_q,_s.set(sx*.95,.9*big,sz*1.05*big));Rf.setMatrixAt(k,_m4);Rf.setColorAt(k,C(roofC[Math.floor(r()*3)]));k++;}
 W.count=Rf.count=k;g.add(W,Rf);
 if(town){const tw=new THREE.Group();const b=new THREE.Mesh(G.box,M.wall);b.scale.set(1.4,4,1.4);const sp=new THREE.Mesh(G.roof,M.roofs[0]);sp.scale.set(1.3,2.2,1.3);sp.position.y=4.7;sp.rotation.y=Math.PI/4;b.castShadow=sp.castShadow=true;tw.add(b,sp);tw.position.set(cx+2.6,height(cx,cz),cz+2.6);g.add(tw);}
 const mk=new THREE.Object3D();mk.position.set(cx,0,cz);dynamic.push({type:'town',o:mk,chunk:ch,town});
 const ak=['ball','ring','tag','kite'];const na=town?2:1;for(let i=0;i<na;i++){const a=r()*6,dd2=(town?R0+5:R0+4);const ax=cx+Math.cos(a)*dd2,az=cz+Math.sin(a)*dd2;if(height(ax,az)>-.2)addAct(g,ch,ak[Math.floor(r()*4)],ax,az,r);}
 {const w1=addAct(g,ch,'walk',cx+.6,cz+.6,r);w1.ang=0;w1.len=town?R0*2:R0*1.4;if(town){const w2=addAct(g,ch,'walk',cx-.6,cz-.6,r);w2.ang=Math.PI/2;w2.len=R0*2;}}}
// ---------- people & kids ----------
const PG={body:new THREE.CylinderGeometry(.16,.24,.55,6).translate(0,.28,0),head:new THREE.IcosahedronGeometry(.19,1),ball:new THREE.IcosahedronGeometry(.13,1),kite:new THREE.OctahedronGeometry(.6,0),rod:new THREE.BoxGeometry(.04,.04,2.2).translate(0,0,-1.1)};
const SHIRT=['#e07a5f','#7aa6c2','#e9b35d','#5fb3b8','#f2a7c3','#8fb36b','#ffffff'].map(lam),SKIN=lam('#f0cfa8'),HAIR=['#3b2a20','#7a4a2a','#e0b35a'].map(lam),BALL=lam('#ffffff'),KITE=['#e8766b','#ffd27a','#7aa6c2'].map(lam);
function person(r,kid){const p=new THREE.Group();const b=new THREE.Mesh(PG.body,SHIRT[Math.floor(r()*SHIRT.length)]);const h=new THREE.Mesh(PG.head,SKIN);h.position.y=.7;b.castShadow=!LOWP;p.add(b,h);if(!LOWP){const hr=new THREE.Mesh(G.cap,HAIR[Math.floor(r()*3)]);hr.scale.setScalar(.42);hr.position.y=.74;p.add(hr);}p.scale.setScalar(kid?1.6:2.2);p.userData.h=h;return p;}
const ACT={ball:'Çocuklar top oynuyor ⚽',ring:'Çocuklar halka oyununda 🎶',kite:'Uçurtma uçuran çocuk 🪁',tag:'Çocuklar kovalamaca oynuyor 🏃',walk:'Köylüler yolda yürüyor 🚶',fish:'Balıkçı oltasını attı 🎣'};
function addAct(g,ch,kind,x,z,r){if(kind!=='fish'&&kind!=='walk'){const dx=x-riverX(z);if(Math.abs(dx)<14||isWet(x,z)||(biome(z)===3&&dx<-6))return {o:new THREE.Object3D()};}const grp=new THREE.Group();grp.position.set(x,height(x,z),z);grp.scale.setScalar(kind==='walk'?1.4:1.75);const P=[];const n=kind==='ball'?6:kind==='ring'?7:kind==='tag'?4:kind==='walk'?2+Math.floor(r()*2):1;
 for(let i=0;i<n;i++){const p=person(r,kind!=='walk'&&kind!=='fish');grp.add(p);P.push({m:p,a:i/n*Math.PI*2,x:(r()-.5)*4,z:(r()-.5)*4,tx:0,tz:0,ph:r()*6});}
 const d={type:'act',o:grp,chunk:ch,kind,P,t:0,ph:r()*6};if(kind!=='walk')grp.scale.setScalar(kind==='fish'?1.1:1.3);
 if(kind==='ball'){P.forEach((q,i)=>{q.x=(i%2?2.2:-2.2)+(r()-.5)*1.5;q.z=(Math.floor(i/2)-1)*1.6;q.hx=q.x;q.hz=q.z;});const b=new THREE.Mesh(PG.ball,BALL);b.castShadow=true;grp.add(b);d.ball=b;d.bf=P[0];d.bt=P[1];d.bp=0;
  for(const sx of[-3.6,3.6]){const gl=new THREE.Mesh(G.box,M.wool);gl.scale.set(.12,.6,1.4);gl.position.set(sx,0,0);grp.add(gl);}}
 if(kind==='kite'){const k=new THREE.Mesh(PG.kite,KITE[Math.floor(r()*3)]);k.scale.set(.8,.08,1.1);k.castShadow=true;grp.add(k);d.kite=k;const tl=[];for(let i=0;i<4;i++){const s2=new THREE.Mesh(PG.ball,KITE[i%3]);s2.scale.setScalar(.6);grp.add(s2);tl.push(s2);}d.tl=tl;}
 if(kind==='fish'){const rod=new THREE.Mesh(PG.rod,M.trunk);rod.position.y=1;rod.rotation.x=.4;P[0].m.add(rod);const bob=new THREE.Mesh(PG.ball,M.roofs[0]);grp.add(bob);d.bob=bob;}
 if(kind==='walk'){d.dir=r()<.5?1:-1;d.len=8+r()*8;d.ang=r()*Math.PI;}
 g.add(grp);dynamic.push(d);return d;}
function actTick(d,dt,t,dd){d.t+=dt;const P=d.P;const o=d.o;
 if(dd<230&&running&&!seenHuman['k_'+d.kind]){seenHuman['k_'+d.kind]=1;sparks+=2;toast(ACT[d.kind]+' +2 ✦');chime(1.3);}
 if(dd>3000)return;
 if(d.kind==='ball'){d.bp+=dt*.55;if(d.bp>=1){d.bp=0;d.bf=d.bt;let n;do{n=P[Math.floor(Math.random()*P.length)];}while(n===d.bf);d.bt=n;}
  const f=d.bf.m.position,to=d.bt.m.position,k=d.bp;d.ball.position.set(f.x+(to.x-f.x)*k,.12+Math.sin(k*Math.PI)*.9,f.z+(to.z-f.z)*k);
  for(const q of P){const tx=q===d.bt?to.x:q.hx+(d.ball.position.x-q.hx)*.15,tz=q===d.bt?to.z:q.hz+(d.ball.position.z-q.hz)*.15;q.x+=(tx-q.x)*dt*.8;q.z+=(tz-q.z)*dt*.8;q.m.position.set(q.x,Math.abs(Math.sin(t*5+q.ph))*.06,q.z);q.m.rotation.y=Math.atan2(d.ball.position.x-q.x,d.ball.position.z-q.z);}}
 else if(d.kind==='ring'){for(const q of P){q.a+=dt*.35;const R=1.8+Math.sin(t*.8)*.25;q.m.position.set(Math.cos(q.a)*R,Math.abs(Math.sin(t*3+q.a*3))*.08,Math.sin(q.a)*R);q.m.rotation.y=-q.a;}}
 else if(d.kind==='tag'){const ch2=P[0];for(let i=1;i<P.length;i++){const q=P[i];q.a+=dt*(.25+i*.04);q.x=Math.cos(q.a+i*2)*(2.5+i*.5);q.z=Math.sin(q.a*1.3+i)*(2+i*.4);q.m.position.set(q.x,Math.abs(Math.sin(t*6+i))*.08,q.z);}
  const tg=P[1+Math.floor(t/6)%(P.length-1)].m.position;ch2.x+=(tg.x-ch2.x)*dt*.5;ch2.z+=(tg.z-ch2.z)*dt*.5;ch2.m.position.set(ch2.x,Math.abs(Math.sin(t*7))*.08,ch2.z);ch2.m.rotation.y=Math.atan2(tg.x-ch2.x,tg.z-ch2.z);}
 else if(d.kind==='kite'){const q=P[0];q.x=Math.sin(t*.15+d.ph)*3;q.m.position.set(q.x,0,0);const kx=q.x+3+Math.sin(t*.7)*1.2,ky=7+Math.sin(t*1.1)*.8,kz=-4+Math.cos(t*.6)*1;d.kite.position.set(kx,ky,kz);d.kite.rotation.y=Math.sin(t*.9)*.4;
  d.tl.forEach((s2,i)=>s2.position.set(kx+.3*(i+1)+Math.sin(t*2+i)*.2,ky-.5*(i+1),kz+.5*(i+1)));q.m.rotation.y=Math.atan2(kx-q.x,kz);}
 else if(d.kind==='walk'){P.forEach((q,i)=>{const s2=((t*.18+d.ph)%2);const u=(s2<1?s2:2-s2)*d.len-d.len/2-i*.9;const x=Math.cos(d.ang)*u,z=Math.sin(d.ang)*u;q.m.position.set(x+i*.4,height(o.position.x+x,o.position.z+z)-o.position.y+Math.abs(Math.sin(t*4+i))*.05,z);q.m.rotation.y=Math.atan2(Math.cos(d.ang),Math.sin(d.ang))+(s2<1?0:Math.PI);q.m.rotation.z=Math.sin(t*4+i)*.06;});}
 else if(d.kind==='fish'){const q=P[0];q.m.rotation.y=-Math.PI/2;q.m.position.y=Math.sin(t*.5)*.02;d.bob.position.set(-2.4,-.9+Math.sin(t*2)*.05+(Math.sin(t*.3+d.ph)>.95?-.15:0),0);}}
const PLOTC={1:['#b9733f','#8f5a36','#d9a066'],2:['#5f9a3e','#7db552','#4e8a3a'],4:['#b98a4e','#a8743f'],5:['#c9b23a','#8fae3f','#e0c64a']};
function addPlots(g,z0,r){const bz=biome(z0-30);const pc=PLOTC[bz];if(!pc)return;const np=Math.round((2+r()*3)*PROPK);
 for(let k=0;k<np;k++){const z=z0-r()*CL,x=riverX(z)+(r()<.5?-1:1)*(12+r()*20);const W=6+r()*6,L=8+r()*8,rows=Math.floor(W/.9);const ang=r()*Math.PI;
  let ok=!(RAILZ!==null&&Math.abs(z-RAILZ)<W/2+3)&&!TOWNS.some(t=>Math.hypot(t[0]-x,t[1]-z)<t[2]+L/2);for(const [a,b] of[[-1,-1],[1,1],[1,-1],[-1,1]])if(height(x+a*L/2,z+b*W/2)<-.1)ok=false;if(!ok)continue;
  const im=new THREE.InstancedMesh(G.box,M.inst,rows);im.receiveShadow=true;const col=C(pc[Math.floor(r()*pc.length)]);const ca=Math.cos(ang),sa=Math.sin(ang);
  for(let i=0;i<rows;i++){const off=(i-(rows-1)/2)*.9;const px=x-sa*off,pz=z-ca*off;_e.set(0,ang,0);_q.setFromEuler(_e);_m4.compose(_v.set(px,height(px,pz)-.05,pz),_q,_s.set(L,.18,.45));im.setMatrixAt(i,_m4);im.setColorAt(i,col);}
  g.add(im);}}
function makeGull(){const b=new THREE.Group();const bd=new THREE.Mesh(G.gb,M.wool);bd.scale.set(1,.8,2);const l=new THREE.Mesh(G.gw,M.wool),r2=new THREE.Mesh(G.gw,M.wool);r2.scale.x=-1;b.add(bd,l,r2);b.userData.w=[l,r2];return b;}
const waterMat=cloudify(new THREE.MeshLambertMaterial({color:'#3f78c0',emissive:'#10284a'}));
{const ob=waterMat.onBeforeCompile;waterMat.onBeforeCompile=sh=>{ob(sh);sh.vertexShader=sh.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
 {vec4 wp=modelMatrix*vec4(transformed,1.);transformed.y+=sin(wp.x*.35+uTime*1.6)*.12+sin(wp.z*.27-uTime*1.2)*.12;}`).replace('#include <common>','#include <common>\nuniform float uTime;');
 sh.fragmentShader=sh.fragmentShader.replace('gl_FragColor.rgb*=1.-cs*.22;','gl_FragColor.rgb*=1.-cs*.22;float fo=smoothstep(.82,1.,sin(vW.x*.5+vW.z*.3+uTime*1.4)*.5+.5);gl_FragColor.rgb=mix(gl_FragColor.rgb,vec3(.5,.68,.92),fo*.18);float gli=(step(.992,h2(floor(vW.xz*1.6)+floor(uTime*1.5)*.37))*smoothstep(.45,.1,length(fract(vW.xz*1.6)-.5)));gl_FragColor.rgb+=gli*.35;');};}
for(let i=0;i<NCH;i++){const ch={};chunks.push(ch);buildChunk(ch,i);}
// ---------- bird ----------
const bird=new THREE.Group();
const bMat=lam('#ffffff'),wMat=lam('#ffffff'),beakMat=lam('#f29e4c');
const polyG=(c,pts)=>{const v=[];for(let i=0;i<pts.length;i++){const a=pts[i],b=pts[(i+1)%pts.length];v.push(...c,...a,...b);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));g.computeVertexNormals();return g;};
// BP: body stations [z, halfWidth, top, bottom]
const BP={st:[[1.0,.06,.08,.02],[.45,.22,.22,.1],[-.1,.3,.3,.16],[-.6,.2,.24,.12],[-.75,.12,.2,.1],[-.98,.25,.28,.12],[-1.2,.21,.24,.1],[-1.34,.08,.13,.06],[-1.62,0,.05,.03]],
 wingRoot:[-.4,.3],wing:[[0,.04,-.6],[.5,.12,-.55],[1.25,.18,-.62],[2.2,.12,-.25],[3.2,0,.3],[2.55,0,.34],[2.25,0,.5],[1.85,0,.34],[1.5,0,.52],[1.1,0,.32],[.6,0,.45],[.2,0,.5],[0,.04,.45]],wingC:[1.0,.3,-.05],wingX:.1,wingY:.12,
 tail:[[-.2,0,-.35],[.2,0,-.35],[.45,0,.5],[.6,0,.85],[.3,0,.7],[0,0,.82],[-.3,0,.7],[-.6,0,.85],[-.45,0,.5]],tailC:[0,.08,-.1],tailZ:.75,flap:.2};
function bodyGeo(st){const v=[];const ring=s=>[[0,s[2],s[0]],[s[1],s[2]*.35,s[0]],[0,-s[3],s[0]],[-s[1],s[2]*.35,s[0]]];
 for(let i=0;i<st.length-1;i++){const A=ring(st[i]),B=ring(st[i+1]);for(let k=0;k<4;k++){const a0=A[k],a1=A[(k+1)%4],b0=B[k],b1=B[(k+1)%4];v.push(...a0,...b0,...a1,...a1,...b0,...b1);}}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));g.computeVertexNormals();return g;}
const bodyG=bodyGeo(BP.st);const bBody=new THREE.Mesh(bodyG,bMat);const bHead=new THREE.Group();const beak=new THREE.Group(),e1=new THREE.Group(),e2=new THREE.Group();
const tail=new THREE.Mesh(polyG(BP.tailC,BP.tail),wMat);tail.position.set(0,BP.wingY,BP.tailZ);
const wingG=polyG(BP.wingC,BP.wing);
wMat.side=bMat.side=THREE.DoubleSide;wMat.flatShading=bMat.flatShading=true;
const wL=new THREE.Mesh(wingG,wMat),wR=new THREE.Mesh(wingG,wMat);wL.position.set(BP.wingX,BP.wingY,BP.wingRoot[0]+.4);wR.position.copy(wL.position);wR.position.x*=-1;wR.scale.x=-1;
[bBody,wL,wR,tail].forEach(m=>m.castShadow=true);
bird.add(bBody,bHead,beak,e1,e2,tail,wL,wR);bird.scale.setScalar(2.1);scene.add(bird);
wMat.emissive=new THREE.Color('#1e1a14');bMat.emissive=new THREE.Color('#1a1712');
// ---------- bird types (paper species) + prop plane ----------
const BT=[
 {n:'Kağıt Kuş',e:'🕊️',st:BP.st,fr:1,in:[[0,.04,-.6],[.5,.12,-.55],[1.25,.18,-.62],[1.6,.15,-.5],[1.6,0,.42],[1.1,0,.32],[.6,0,.45],[.2,0,.5],[0,.04,.45]],inC:[.8,.25,-.05],
  out:[[0,.15,-.5],[.6,.12,-.25],[1.6,0,.3],[1.1,0,.34],[.8,0,.5],[.4,0,.34],[0,0,.42]],outC:[.6,.15,0],tail:BP.tail,tz:BP.tailZ},
 {n:'Kırlangıç',e:'🐦',fr:1.45,st:BP.st.map(q=>[q[0],q[1]*.8,q[2]*.9,q[3]]),in:[[0,.04,-.5],[1.2,.14,-.45],[1.2,0,.15],[0,.04,.35]],inC:[.6,.18,-.1],
  out:[[0,.14,-.45],[1.2,.06,-.12],[2.6,0,.75],[1.0,0,.22],[0,0,.15]],outC:[.8,.1,.05],tail:[[-.15,0,-.3],[.15,0,-.3],[.3,0,.4],[.75,0,1.6],[.15,0,.55],[-.15,0,.55],[-.75,0,1.6],[-.3,0,.4]],tz:.7},
 {n:'Martı',e:'🌊',fr:.7,st:BP.st,in:[[0,.04,-.42],[1.6,.1,-.36],[1.6,0,.24],[0,.04,.36]],inC:[.8,.16,-.04],
  out:[[0,.1,-.36],[1.4,.05,-.22],[2.2,0,.02],[1.3,0,.24],[0,0,.24]],outC:[.8,.08,0],tail:[[-.22,0,-.2],[.22,0,-.2],[.36,0,.45],[0,0,.55],[-.36,0,.45]],tz:.75,tip:1},
 {n:'Baykuş',e:'🦉',fr:.8,st:[[.7,.1,.1,.05],[.3,.32,.3,.15],[-.2,.38,.34,.18],[-.6,.34,.32,.16],[-.92,.42,.38,.15],[-1.22,.34,.32,.12],[-1.42,.1,.14,.06]],in:[[0,.04,-.62],[1.3,.12,-.68],[1.3,0,.58],[0,.04,.52]],inC:[.65,.22,-.05],
  out:[[0,.12,-.68],[.7,.08,-.6],[1.15,0,-.25],[1.25,0,.18],[.95,0,.5],[.5,0,.62],[0,0,.58]],outC:[.55,.12,0],tail:[[-.3,0,-.2],[.3,0,-.2],[.34,0,.45],[-.34,0,.45]],tz:.6},
 {n:'Pervaneli Uçak',e:'✈️',plane:1}];
const wLo=new THREE.Mesh(wingG,wMat),wRo=new THREE.Mesh(wingG,wMat);wL.add(wLo);wR.add(wRo);wLo.castShadow=wRo.castShadow=true;
const tipMat=lam('#4a4a52');tipMat.side=THREE.DoubleSide;tipMat.flatShading=true;const tipL=new THREE.Mesh(wingG,tipMat),tipR=new THREE.Mesh(wingG,tipMat);wLo.add(tipL);wRo.add(tipR);
const plane=new THREE.Group();{const pm=lam('#fbf6ec'),pa=lam('#e8766b');for(const m of[pm,pa]){m.flatShading=true;}
 const fu=new THREE.Mesh(new THREE.CylinderGeometry(.32,.18,3.2,6),pm);fu.rotation.x=Math.PI/2;fu.position.y=.3;
 const nose=new THREE.Mesh(new THREE.ConeGeometry(.33,.5,6),pa);nose.rotation.x=-Math.PI/2;nose.position.set(0,.3,-1.85);
 const wing=new THREE.Mesh(G.box,pm);wing.scale.set(5.6,.08,.85);wing.position.set(0,.18,-.35);const st1=new THREE.Mesh(G.box,pa);st1.scale.set(5.62,.09,.2);st1.position.set(0,.19,-.62);
 const tp=new THREE.Mesh(G.box,pm);tp.scale.set(2,.06,.5);tp.position.set(0,.3,1.35);const fin=new THREE.Mesh(G.box,pa);fin.scale.set(.06,.7,.55);fin.position.set(0,.3,1.4);
 const cock=new THREE.Mesh(new THREE.SphereGeometry(.24,8,5,0,Math.PI*2,0,Math.PI/2),lam('#7aa6c2'));cock.scale.set(1,.8,1.6);cock.position.set(0,.55,-.5);
 const prop=new THREE.Group();prop.position.set(0,.3,-2.12);for(let i=0;i<2;i++){const bl=new THREE.Mesh(G.box,lam('#5d4b3a'));bl.scale.set(1.7,.05,.12);bl.position.y=-.025;bl.rotation.y=i*Math.PI;prop.add(bl);}
 const disc=new THREE.Mesh(new THREE.CircleGeometry(.9,20),new THREE.MeshBasicMaterial({color:'#ffffff',transparent:true,opacity:.18,depthWrite:false,side:THREE.DoubleSide}));disc.material.opacity=.1;prop.add(disc);
 [fu,wing,tp,fin,nose].forEach(m=>m.castShadow=true);plane.add(fu,nose,wing,st1,tp,fin,cock,prop);plane.userData.prop=prop;plane.visible=false;bird.add(plane);}
let btype=+localStorage.getItem('kk_type')||0,oF=0;
function applyType(i){const T=BT[i];btype=i;localStorage.setItem('kk_type',i);const isP=!!T.plane;plane.visible=isP;[bBody,tail,wL,wR].forEach(m=>m.visible=!isP);
 if(!isP){bBody.geometry=bodyGeo(T.st);wL.geometry=wR.geometry=polyG(T.inC,T.in);const xo=T.in.reduce((a,p)=>Math.max(a,p[0]),0);const og=polyG(T.outC,T.out);wLo.geometry=wRo.geometry=og;wLo.position.set(xo,0,0);wRo.position.set(xo,0,0);
  tail.geometry=polyG(BP.tailC,T.tail);tail.position.z=T.tz;tipL.visible=tipR.visible=!!T.tip;if(T.tip){const tg=polyG([1.8,.03,.08],[[1.5,.01,-.18],[2.25,.01,.02],[1.4,.01,.26]]);tipL.geometry=tipR.geometry=tg;}}
 if(typeof scarf!=='undefined'){scarf.visible=tailS.visible=!isP&&skin===1;hat.visible=!isP&&skin===2;}renderTypes();}
function renderTypes(){const el=document.getElementById('btypes');if(!el)return;el.innerHTML='';BT.forEach((T,i)=>{const b=document.createElement('button');b.className='sk'+(i===btype?' on':'');b.textContent=T.e+' '+T.n;b.onclick=e=>{e.stopPropagation();applyType(i);toast(T.n+' seçildi');};el.appendChild(b);});}

const birdPos=new THREE.Vector3(0,10,0);let yaw=0,bank=0,pitch=0,vy=0;
// flock helpers (birds flushed from trees)
const flock=[];const fG=new THREE.TetrahedronGeometry(.25);
function flush(p){for(let i=0;i<5;i++){const m=new THREE.Mesh(fG,M.dark);m.position.copy(p).add(new THREE.Vector3((Math.random()-.5)*1.5,2.5,(Math.random()-.5)*1.5));
 scene.add(m);flock.push({m,v:new THREE.Vector3((Math.random()-.5)*6,4+Math.random()*3,(Math.random()-.5)*6),t:0});}}
// burst particles
const bursts=[];function burst(p,color){const mat=new THREE.MeshBasicMaterial({color,transparent:true});
 for(let i=0;i<10;i++){const m=new THREE.Mesh(fG,mat);m.position.copy(p);scene.add(m);bursts.push({m,v:new THREE.Vector3().randomDirection().multiplyScalar(5+Math.random()*4),t:0});}}
// ---------- input ----------
let loftT=0,boostT=0,boostCd=0;const baseFov=innerWidth<innerHeight?62:50;function buzz(p){if(SET.hap!==false&&navigator.vibrate)try{navigator.vibrate(p);}catch(e){}}
let revT=0;function reveal(i){const m=cardMsgs[i];const r=document.getElementById('reveal');document.getElementById('revCard').innerHTML='<span class="stamp big">YENİ</span><h3>✉ '+m[0]+'</h3><p>'+m[1]+'</p><small>dokun · albüme eklendi</small>';r.classList.remove('show');void r.offsetWidth;r.classList.add('show');r.style.display='flex';clearTimeout(revT);revT=setTimeout(()=>r.style.display='none',4200);}
function boost(){if(boostT>0)return;boostT=1.2;buzz(30);toast('Hızlan!');whoosh();for(let i=0;i<6;i++)burst(birdPos,'#ffffff');}
let sIx=0,sIy=0;const tilt={x:0,y:0,on:false};let tx=0,ty=0,active=false,sx=0,sy=0,bx=0,by=0;
const el=renderer.domElement;
let lastTap=0;function down(x,y){if(running&&x>innerWidth-90&&y>innerHeight-200)dimSoon();const nt=performance.now();if(running&&nt-lastTap<300)boost();lastTap=nt;if(AC&&AC.state!=='running')AC.resume();active=true;sx=x;sy=y;bx=tx;by=ty;hideHint();}
function move(x,y){if(!active)return;const s=Math.min(innerWidth,innerHeight)*.28/SET.sens;tx=THREE.MathUtils.clamp(bx+(x-sx)/s,-1,1);ty=THREE.MathUtils.clamp(by-(SET.invY?-1:1)*(y-sy)/s,-1,1);}
function up(){active=false;}
el.addEventListener('pointerdown',e=>{if(e.isPrimary===false){boost();return;}el.setPointerCapture(e.pointerId);down(e.clientX,e.clientY);});
el.addEventListener('pointermove',e=>move(e.clientX,e.clientY));
el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);
const keys={};addEventListener('keydown',e=>keys[e.key]=1);addEventListener('keyup',e=>keys[e.key]=0);
document.addEventListener('touchmove',e=>e.preventDefault(),{passive:false});
let hinted=false;function dimSoon(){const b=document.getElementById('btns');b.classList.remove('dim');clearTimeout(window.__dt);window.__dt=setTimeout(()=>b.classList.add('dim'),3000);}
function hideHint(){document.getElementById('hint').style.opacity=0;if(!hinted){hinted=true;setTimeout(()=>document.getElementById('hint').style.opacity=0,1800);}}
// ---------- UI ----------
let dist=0,sparks=0,cards=0,running=false;const $=id=>document.getElementById(id);
let toastT=0;const TQ=[];function toast(s){if(toastT>.6&&$('toast').textContent!==s){if(!TQ.includes(s)){TQ.push(s);if(TQ.length>3)TQ.shift();}return;}const t=$('toast');t.textContent=s;t.style.opacity=1;toastT=2.2;}
const cardMsgs=[
['Vadi Sabahı','Selamlar vadiden! Sis daha kalkmadı, koyunlar hâlâ uykulu.'],['Köy Fırını','Burası mis gibi ekmek kokuyor. Bacadan çıkan duman bize el sallıyor.'],
['Nehir Pikniği','Nehir kenarında piknik; köprünün altından kayıklar geçiyor.'],['Bulut Geçidi','Bulutların arasından geçtik, tüylerim pamuk gibi oldu.'],
['Sonbahar Rüzgârı','Sonbahar geldi! Yapraklar turuncu bir halı gibi.',1],['Saman Balyaları','Pampada saman balyaları güneşte ısınıyor.',2],
['İskele','İskelede gün batımı. Martılar akşam yemeğini arıyor.',3],['Çiçek Tarlası','Bahar tarlasında arılar ve pembe çiçekler.',0],
['Martı Selamı','Martılar selam söylüyor; deniz tuzlu, rüzgâr serin.',3],['Zirve','Dağların zirvesinden bütün dünya bir oyuncak gibi görünüyor.'],
['Yel Değirmeni','Değirmenin kanatları biz geçince hızlandı!'],['Deniz Feneri','Fener ışığı gece yolunu kaybedenlere göz kırpıyor.',3],
['Balon Festivali','Gökyüzü rengârenk balonlarla doldu; hepsi bize yol verdi.'],['Ay Işığı','Uzun bir yolculuk; bir gün ayı da ziyaret edeceğiz.'],
['Orman Fısıltısı','Çamların arasında mantarlar bize göz kırptı.',5],['Ateş Böcekleri','Ormanda akşam: minik fenerler etrafımızda dans ediyor.',5],
['Kum Tepeleri','Çölde kaktüsler sıcaktan şapka istiyor.',4],['Serap','Ufukta bir göl gördük… yoksa serap mıydı?',4],
['Uçsuz Ova','Pampa o kadar geniş ki rüzgâr bile yoruluyor.',2],['Deniz Kabuğu','Sahilde dalgalar bize bir kabuk bıraktı.',3],['Arı Vızıltısı','Bahar sabahı: arılar çiçekten çiçeğe koşturuyor.',0],['Yaprak Dansı','Rüzgâr esti, sonbahar yaprakları bizimle uçtu.',1]];
$('go').onclick=()=>{$('hint').style.display='';setTimeout(()=>{$('hint').style.opacity=0;hinted=true;},4000);dimSoon();initAudio();runZ0=birdPos.z;placeGhost();runT=0;recPath=[];if(!localStorage.getItem('kk_tut'))showTut();$('start').style.display='none';running=true;try{document.documentElement.requestFullscreen?.().catch(()=>{});}catch(e){}};
// ---------- loop ----------
const trailMat=new THREE.SpriteMaterial({map:glowTex,color:'#ffffff',transparent:true,opacity:.35,depthWrite:false});
const pts=[];const snowM=new THREE.MeshBasicMaterial({color:'#ffffff'}),leafM=['#f0a35e','#e5c45a','#d9785a'].map(c=>new THREE.MeshBasicMaterial({color:c,side:THREE.DoubleSide}));const ptG=new THREE.PlaneGeometry(.22,.22);
for(let i=0;i<70;i++){const p=new THREE.Mesh(ptG,snowM);p.visible=false;p.userData.t=0;scene.add(p);pts.push(p);}let ptI=0,ptT=0;
const trail=[];for(let i=0;i<40;i++){const p=new THREE.Sprite(trailMat);p.visible=false;p.userData.t=0;scene.add(p);trail.push(p);}let qMode=localStorage.getItem('kk_q')||'auto',lowSec=0;
const GFX={calm:{pr:1,sh:false,map:512,fog:.62,ff:8,st:60,pk:.5},low:{pr:1,sh:false,map:512,fog:.8,ff:15,st:120},mid:{pr:1.5,sh:true,map:512,fog:1,ff:30,st:250},high:{pr:2,sh:true,map:1024,fog:1.1,ff:50,st:400}};let calmTold=false;let FOGK=1;
function applyGfx(k,quiet){SET.gfx=k;saveSet();const g=GFX[k];lowQ=k==='low'||k==='calm';PROPK=g.pk||1;renderer.setPixelRatio(Math.min(devicePixelRatio,g.pr));sun.castShadow=g.sh;renderer.shadowMap.enabled=g.sh;
 if(sun.shadow.mapSize.x!==g.map){sun.shadow.mapSize.set(g.map,g.map);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null;}}FOGK=g.fog;
 if(typeof ffs!=='undefined'){ffs.forEach((f,i)=>f.userData.off.y=i<g.ff?f.userData.off.y:-999);stars.geometry.setDrawRange(0,g.st);}
 scene.traverse(o=>{if(o.material)o.material.needsUpdate=true;});document.getElementById('qual').textContent=k==='calm'?'🍃':k==='low'?'◐':k==='mid'?'◑':'✨';document.querySelectorAll('.gfx').forEach(b=>b.classList.toggle('on',b.dataset.g===k));}
function setQ(low){applyGfx(low?'low':'high');return;lowQ=low;renderer.setPixelRatio(low?1:Math.min(devicePixelRatio,2));sun.castShadow=!low;renderer.shadowMap.enabled=!low;scene.traverse(o=>{if(o.material)o.material.needsUpdate=true;});document.getElementById('qual').textContent=low?'◐':'✨';}
let ALT=10,trailI=0,trailT=0,fpsAcc=0,fpsN=0,lowQ=false;
let best=+localStorage.getItem(BK)||0;$('best').textContent=(best?'Bugün en iyi: '+Math.floor(best)+' m':'')+(allBest?(best?' · ':'')+'Tüm zamanlar: '+Math.floor(allBest)+' m':'');
addEventListener('pagehide',()=>{saveBest();if(newBestRun)savePath();});
// audio
let MASTER=null;let AC=null,muted=localStorage.getItem('kk_mute')==='1',windG=null,windF=null,lastFlap=0;
function initAudio(){if(AC)return;AC=new (window.AudioContext||window.webkitAudioContext)();MASTER=AC.createGain();MASTER.gain.value=SET.vol;MASTER.connect(AC.destination);const n=AC.sampleRate*2,buf=AC.createBuffer(1,n,AC.sampleRate),d=buf.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;
 const src=AC.createBufferSource();src.buffer=buf;src.loop=true;windF=AC.createBiquadFilter();windF.type='bandpass';windF.frequency.value=500;windF.Q.value=.7;windG=AC.createGain();windG.gain.value=0;
 src.connect(windF).connect(windG).connect(MASTER);src.start();window.__noise=buf;}
let bedS=null,bedF=null,bedG=null,padG=null,padO=[];
function initBeds(){const s2=AC.createBufferSource();s2.buffer=window.__noise;s2.loop=true;bedF=AC.createBiquadFilter();bedG=AC.createGain();bedG.gain.value=0;s2.connect(bedF).connect(bedG).connect(MASTER);s2.start(0,.7);
 padG=AC.createGain();padG.gain.value=0;const lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.value=700;padG.connect(lp).connect(MASTER);for(const f of[196,246.9,293.7]){const o=AC.createOscillator();o.type='triangle';o.frequency.value=f;o.detune.value=(Math.random()-.5)*10;o.connect(padG);o.start();padO.push(o);}}
let rainSG=null;function beds(){if(!bedG)initBeds();if(!rainSG){const s3=AC.createBufferSource();s3.buffer=window.__noise;s3.loop=true;const hp=AC.createBiquadFilter();hp.type='highpass';hp.frequency.value=1800;const lp2=AC.createBiquadFilter();lp2.type='lowpass';lp2.frequency.value=6000;rainSG=AC.createGain();rainSG.gain.value=0;s3.connect(hp).connect(lp2).connect(rainSG).connect(MASTER);s3.start(0,1.3);}
 rainSG.gain.setTargetAtTime(muted?0:wRain*.07,AC.currentTime,.8);const n=AC.currentTime,b=biome(birdPos.z);let gv=0,ft='bandpass',fq=800,q=.8;
 if(b===5){gv=.035*(.6+.4*Math.sin(t*1.7)*Math.sin(t*.6));ft='highpass';fq=3200;}else if(b===3){gv=.06*(.5+.5*Math.sin(t*.9));ft='lowpass';fq=380;}else if(b===4){gv=.03;ft='bandpass';fq=1500;q=2;}
 bedF.type=ft;bedF.frequency.setTargetAtTime(fq,n,.5);bedF.Q.value=q;bedG.gain.setTargetAtTime(muted?0:gv*(1-dusk*.4),n,.6);padG.gain.setTargetAtTime(muted?0:dusk*.012,n,1.5);}
let musLP=null,musFl={r:0,w:'triangle'},musG=null,musNext=0,musStep=0;const PENT=[0,2,4,7,9,12,14,16];
function music(){if(!musG){musG=AC.createGain();musG.gain.value=0;musLP=AC.createBiquadFilter();musLP.type='lowpass';musLP.frequency.value=2200;musG.connect(musLP).connect(MASTER);musNext=AC.currentTime+.5;}
 musG.gain.setTargetAtTime(muted?0:.05,AC.currentTime,.5);const n=AC.currentTime;if(n<musNext-.1)return;
 const beat=.55+dusk*.25;const FL=[{r:0,w:'triangle',lp:2200},{r:-2,w:'triangle',lp:1700},{r:5,w:'sine',lp:3200},{r:2,w:'sine',lp:2800},{r:-4,w:'sawtooth',lp:900},{r:-5,w:'sine',lp:1300}];const fl=FL[biome(birdPos.z)]||FL[0];if(musStep%8===0)musFl=fl;musLP.frequency.setTargetAtTime(fl.lp*(1-dusk*.3),n,2);const root=(dusk>.5?57:62)+musFl.r;const chordRoot=[0,5,7,3][Math.floor(musStep/8)%4];
 if(musStep%8===0){for(const iv of[0,4,7]){const o=AC.createOscillator(),g=AC.createGain();o.type='sine';o.frequency.value=440*Math.pow(2,(root-12+chordRoot+iv-69)/12);g.gain.setValueAtTime(.0001,musNext);g.gain.linearRampToValueAtTime(.12,musNext+.8);g.gain.linearRampToValueAtTime(.0001,musNext+beat*8);o.connect(g).connect(musG);o.start(musNext);o.stop(musNext+beat*8+.1);}}
 if(Math.random()<(dusk>.5?.35:.6)){const o=AC.createOscillator(),g=AC.createGain();o.type=dusk>.5?'sine':musFl.w;const note=root+chordRoot+PENT[Math.floor(Math.random()*PENT.length)];o.frequency.value=440*Math.pow(2,(note-69)/12);
  g.gain.setValueAtTime(.0001,musNext);g.gain.exponentialRampToValueAtTime(.14*(1-dusk*.4),musNext+.02);g.gain.exponentialRampToValueAtTime(.0001,musNext+beat*1.8);o.connect(g).connect(musG);o.start(musNext);o.stop(musNext+beat*2);}
 musStep++;musNext+=beat;}
function wind(spd,vy){if(!AC)return;beds();music();const g=muted?0:(.04+Math.min(.05,Math.abs(vy)*.01))*(1-dusk*.35);windG.gain.setTargetAtTime(g,AC.currentTime,.3);windF.frequency.setTargetAtTime(400+Math.abs(vy)*80,AC.currentTime,.3);
 const ph=Math.sin(t*(vy>1.5?15:8));if(ph>.95&&t-lastFlap>.25&&!muted&&running){lastFlap=t;const s=AC.createBufferSource();s.buffer=window.__noise;const f=AC.createBiquadFilter();f.type='lowpass';f.frequency.value=900;const g2=AC.createGain();
  g2.gain.setValueAtTime(.0001,AC.currentTime);g2.gain.linearRampToValueAtTime(.06,AC.currentTime+.04);g2.gain.exponentialRampToValueAtTime(.0001,AC.currentTime+.22);s.connect(f).connect(g2).connect(MASTER);s.start();s.stop(AC.currentTime+.3);}}
function whoosh(){if(!AC||muted)return;const s=AC.createBufferSource();s.buffer=window.__noise;const f=AC.createBiquadFilter();f.type='bandpass';f.Q.value=1.2;const n=AC.currentTime;f.frequency.setValueAtTime(300,n);f.frequency.exponentialRampToValueAtTime(1800,n+.5);const g=AC.createGain();g.gain.setValueAtTime(.0001,n);g.gain.linearRampToValueAtTime(.18,n+.1);g.gain.exponentialRampToValueAtTime(.0001,n+.8);s.connect(f).connect(g).connect(MASTER);s.start();s.stop(n+.9);}
function chime(m){if(!AC||muted)return;const now=AC.currentTime;for(const [mul,v] of [[1,.12],[2,.04]]){const o=AC.createOscillator(),g=AC.createGain();o.type='sine';o.frequency.value=880*m*mul;
 g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(v,now+.01);g.gain.exponentialRampToValueAtTime(.0001,now+.6);o.connect(g).connect(MASTER);o.start(now);o.stop(now+.7);}}
function setMute(){$('mute').textContent=muted?'🔇':'🔊';}setMute();
$('mute').onclick=()=>{muted=!muted;localStorage.setItem('kk_mute',muted?'1':'0');setMute();initAudio();};
function warmFlash(){const f=$('flash');f.style.background='radial-gradient(circle,transparent 40%,rgba(255,190,110,.55))';f.style.transition='none';f.style.opacity=1;requestAnimationFrame(()=>{f.style.transition='opacity 1.4s';f.style.opacity=0;});setTimeout(()=>f.style.background='',1500);}
function cardFlash(){const f=$('flash');f.style.transition='none';f.style.opacity=.7;requestAnimationFrame(()=>{f.style.transition='opacity .8s';f.style.opacity=0;});const p=$('post');p.style.transform='scale(1.4)';setTimeout(()=>p.style.transform='',300);}
// tilt
let tilt0=null;function onOri(e){if(e.gamma==null)return;if(!tilt0)tilt0={g:e.gamma,b:e.beta};tilt.x=THREE.MathUtils.clamp((e.gamma-tilt0.g)/25,-1,1);tilt.y=THREE.MathUtils.clamp(-(e.beta-tilt0.b)/25,-1,1);}
$('tilt').onclick=async()=>{if(tilt.on){tilt.on=false;removeEventListener('deviceorientation',onOri);tilt.x=tilt.y=0;$('tilt').style.opacity=.5;return;}
 try{if(window.DeviceOrientationEvent?.requestPermission){if(await DeviceOrientationEvent.requestPermission()!=='granted')return;}}catch(e){return;}
 tilt.on=true;tilt0=null;addEventListener('deviceorientation',onOri);$('tilt').style.opacity=1;toast('Eğme kontrolü açık');};
if(!window.DeviceOrientationEvent)$('tilt').style.display='none';
$('qual').onclick=()=>{const order=['calm','low','mid','high'];const k=order[(order.indexOf(SET.gfx||'high')+1)%3];qMode='manual';localStorage.setItem('kk_q','manual');applyGfx(k);toast('Grafik: '+{calm:'Sakin',low:'Düşük',mid:'Orta',high:'Yüksek'}[k]);};
document.querySelectorAll('.gfx').forEach(b=>b.onclick=e=>{e.stopPropagation();qMode='manual';localStorage.setItem('kk_q','manual');applyGfx(b.dataset.g);});
// album
const unlocked=new Set(JSON.parse(localStorage.getItem('kk_cards')||'[]'));const runCards=[];const newCards=new Set();
const TABS=[['Genel',undefined],['Pirinç',0],['Sonbahar',1],['Pampa',2],['Sahil',3],['Savan',4],['Hardal',5]];let albTab=0;
function renderTabs(){const el=$('albTabs');el.innerHTML='';TABS.forEach((tb,k)=>{const ids=cardMsgs.map((m,i)=>i).filter(i=>cardMsgs[i][2]===tb[1]);const got=ids.filter(i=>unlocked.has(i)).length;const b=document.createElement('button');b.className='tab'+(k===albTab?' on':'');b.textContent=tb[0]+' '+got+'/'+ids.length;b.onclick=e=>{e.stopPropagation();albTab=k;openAlbum();};el.appendChild(b);});}
function openAlbum(){renderTabs();const l=$('albumList');l.innerHTML='';cardMsgs.forEach((m,i)=>{if(m[2]!==TABS[albTab][1])return;const d=document.createElement('div');const got=unlocked.has(i);d.className='ac'+(got?'':' lock');
 d.innerHTML=got?('<b>✉ '+m[0]+(newCards.has(i)?' <span class="stamp">YENİ</span>':'')+'</b><span>'+m[1]+'</span>'+(runCards.includes(i)?'<small>bu uçuşta</small>':'')):'<b>? ? ?</b><small>henüz bulunmadı</small>';l.appendChild(d);});
 $('albumCount').textContent=unlocked.size+' / '+cardMsgs.length+' kartpostal · bu uçuşta '+runCards.length;$('album').style.display='flex';}
$('albumBtn').onclick=$('albumBtn2').onclick=e=>{e.stopPropagation();openAlbum();};$('albumClose').onclick=()=>$('album').style.display='none';
const goals=[{t:'5 parıltı topla',ok:()=>sparks>=5},{t:'500 m uç',ok:()=>dist>=500},{t:'1 kartpostal bul',ok:()=>cards>=1},{t:'Pampa ovasına ulaş',ok:()=>biome(birdPos.z)===2},
 {t:'Çift dokun: hızlan',ok:()=>boostT>0},{t:'20 parıltı topla',ok:()=>sparks>=20},{t:'Sahile ulaş',ok:()=>biome(birdPos.z)===3},{t:'3 kartpostal bul',ok:()=>cards>=3},{t:'Balon festivalini bul',ok:()=>wowSeen},{t:'2000 m uç',ok:()=>dist>=2000}];
const doneG=new Set(JSON.parse(localStorage.getItem('kk_goals')||'[]'));const DQ=[{t:'Bugün 20 parıltı topla',ok:()=>DS.s>=20,p:()=>Math.min(20,DS.s)+'/20'},{t:'Bugün sahile ulaş',ok:()=>biome(birdPos.z)===3},{t:'Bugün 2 kartpostal bul',ok:()=>DS.c>=2,p:()=>Math.min(2,DS.c)+'/2'},{t:'Bugün 1500 m uç',ok:()=>DS.m>=1500,p:()=>Math.floor(Math.min(1500,DS.m))+'/1500 m'},{t:'Bugün ormana ulaş',ok:()=>biome(birdPos.z)===5},{t:'Bugün çöle ulaş',ok:()=>biome(birdPos.z)===4},{t:'Bugün 10 yıldız tozu topla',ok:()=>(DS.x||0)>=10,p:()=>Math.min(10,DS.x||0)+'/10 ✧'}];
const DS=(()=>{const o=JSON.parse(localStorage.getItem('kk_dq')||'{}');return o.d===TODAY?o:{d:TODAY,s:0,m:0,c:0};})();let lD=0,lS=0,lM=0,lC=0,dsT=0;
function dailyAcc(dt){if(sparks>lS)DS.s+=sparks-lS;if(dist>lM)DS.m+=dist-lM;if(cards>lC)DS.c+=cards-lC;if(dustN>lD)DS.x=(DS.x||0)+dustN-lD;lD=dustN;lS=sparks;lM=dist;lC=cards;dsT-=dt;if(dsT<=0){dsT=2;localStorage.setItem('kk_dq',JSON.stringify(DS));}}
const dq=DQ[((DAYNUM%DQ.length)+DQ.length)%DQ.length];let dqDone=localStorage.getItem('kk_daily')===TODAY;
document.getElementById('daily').innerHTML='Bugünün dünyası · '+TODAY.split('-').reverse().join('.')+'<br>🌞 '+dq.t+(dqDone?' ✓':(dq.p?' ('+dq.p()+')':''));
function checkDaily(){if(!dqDone&&dq.ok()){dqDone=true;localStorage.setItem('kk_daily',TODAY);setTimeout(()=>{toast('Günlük görev tamam! 🌞 +10 ✦');sparks+=10;chime(1);setTimeout(()=>chime(1.5),150);setTimeout(()=>chime(2),300);for(let i=0;i<4;i++)burst(birdPos,'#ffd27a');},2000);}}
let gi=0,wowSeen=false;const nextG=()=>{gi=0;while(gi<goals.length&&doneG.has(gi))gi++;};nextG();function showGoal(){const ge=document.getElementById('goal');ge.classList.remove('ghost');clearTimeout(window.__gt);window.__gt=setTimeout(()=>ge.classList.add('ghost'),5000);$('goal').textContent=gi<goals.length?'🎯 '+goals[gi].t:'🎯 Keşfetmeye devam!';}showGoal();
function checkGoal(){if(gi<goals.length&&goals[gi].ok()){toast('Hedef tamam: '+goals[gi].t+' ✦');for(let i=0;i<3;i++)burst(birdPos,['#fff1a0','#e8766b','#9fdbe6'][i]);chime(1);setTimeout(()=>chime(1.33),130);setTimeout(()=>chime(1.6),260);sparks+=3;doneG.add(gi);goalsRun++;localStorage.setItem('kk_goals',JSON.stringify([...doneG]));nextG();setTimeout(showGoal,1600);}}
let flyT=0,sumShown=false,goalsRun=0;
function showSummary(auto){const prevBest=+localStorage.getItem(BK)||0;saveBest();
 $('sumTitle').textContent=auto?'2000 m! Harika uçuş':'Konaklama molası';
 $('sumBody').innerHTML='<div>Mesafe <b>'+Math.floor(dist)+' m</b></div><div>Parıltı <b>✦ '+sparks+'</b></div><div>Kartpostal <b>✉ '+cards+'</b></div><div>Yıldız tozu <b>✧ '+dustN+'</b></div><div>Hedef <b>🎯 '+goalsRun+'</b></div><div>En iyi <b>'+Math.floor(best)+' m</b>'+(dist>=prevBest-1&&dist>50?' <span class="stamp">REKOR</span>':'')+'</div>'+
 '<ul class="gl">'+goals.map((g,i)=>'<li>'+(doneG.has(i)?'<b style="color:#6fbf73">✓</b>':'○')+' '+g.t+'</li>').join('')+'</ul>';$('summary').style.display='flex';}
$('stop').onclick=()=>showSummary(false);$('sumGo').onclick=()=>{$('summary').style.display='none';dist=0;sparks=0;cards=0;goalsRun=0;runCards.length=0;sumShown=false;boostT=0;birdPos.y+=3;toast('Yeni uçuş!');dustN=0;$('dust').style.display='none';if(newBestRun){savePath();gPath=recPath;}newBestRun=false;recPath=[];runT=0;runZ0=birdPos.z;placeGhost();};
$('share').onclick=async()=>{const txt='Kağıt Kuş ile '+Math.floor(dist)+' m uçtum! ✦ '+sparks+' parıltı, ✉ '+cards+' kartpostal topladım. En iyi: '+Math.floor(best)+' m 🕊️ '+location.href;
 try{if(navigator.share){await navigator.share({text:txt});return;}await navigator.clipboard.writeText(txt);toast('Panoya kopyalandı ✓');}catch(e){toast('Paylaşılamadı');}};
const ALPH='23456789ABCDEFGHJKLMNPQRSTUVWXYZ';function enc(n,len){let o='';for(let i=0;i<len;i++){o=ALPH[n%32]+o;n=Math.floor(n/32);}return o;}function dec(str){let n=0;for(const c of str){const v=ALPH.indexOf(c);if(v<0)return NaN;n=n*32+v;}return n;}
function makeCode(){const b=Math.min(32767,Math.floor(best)),c=Math.min(31,unlocked.size),d=((DAYNUM%1024)+1024)%1024;const ck=(b*7+c*13+d*3)%32;return 'KK-'+enc(b,3)+enc(c,1)+enc(d,2)+enc(ck,1);}
function readCode(code){code=code.trim().toUpperCase().replace(/^KK-?/,'');if(code.length!==7)return null;const b=dec(code.slice(0,3)),c=dec(code.slice(3,4)),d=dec(code.slice(4,6)),ck=dec(code.slice(6));if([b,c,d,ck].some(isNaN)||(b*7+c*13+d*3)%32!==ck)return null;if(b<=0)return {zero:true};return {b,c,d};}
$('codeCopy').onclick=async()=>{const c=makeCode();try{await navigator.clipboard.writeText(c);toast('Kod kopyalandı: '+c);}catch(e){openCode(c);}};
function openCode(mine){$('codeMine').textContent='Senin kodun: '+(mine||makeCode());$('codeRes').innerHTML='';$('codeTxt').value='';$('codeM').style.display='flex';}
$('codeIn').onclick=e=>{e.stopPropagation();openCode();};$('codeClose').onclick=e=>{e.stopPropagation();$('codeM').style.display='none';};
$('codeM').onclick=e=>e.stopPropagation();
$('codeGo').onclick=e=>{e.stopPropagation();const raw=$('codeTxt').value;const m=raw.toUpperCase().match(/KK-?[2-9A-HJ-NP-Z]{7}/);const r=m&&readCode(m[0]);
 if(r&&r.zero){$('codeRes').innerHTML='<p class="bad">Bu kodda hiç uçuş yok (0 m). Arkadaşın önce biraz uçsun! 🕊️</p>';return;}
 if(!r){$('codeRes').innerHTML='<p class="bad">Kod geçersiz. KK- ile başlayan 7 haneli kodu yapıştır.</p>';return;}
 const today=((DAYNUM%1024)+1024)%1024===r.d;const me=Math.floor(best),win=me>=r.b;
 $('codeRes').innerHTML='<div class="cmp"><div><small>Sen</small><b>'+me+' m</b><small>✉ '+unlocked.size+'</small></div><div class="vs">'+(win?'🏆':'🕊️')+'</div><div><small>Arkadaş</small><b>'+r.b+' m</b><small>✉ '+r.c+'</small></div></div><p>'+(today?'Aynı günün dünyası!':'Farklı bir günün kodu')+' · '+(win?'Öndesin!':'Hadi yakala!')+'</p>';};
$('sumCont').onclick=()=>$('summary').style.display='none';
function syncSet(){$('sVol').value=SET.vol;$('sSens').value=SET.sens;$('sGhost').checked=SET.ghost;$('sFast').checked=SET.fastDay;$('sInv').checked=SET.invY;$('sHap').checked=SET.hap!==false;}
$('setBtn').onclick=e=>{e.stopPropagation();syncSet();$('settings').style.display='flex';};$('setClose').onclick=()=>$('settings').style.display='none';
$('sVol').oninput=e=>{SET.vol=+e.target.value;if(MASTER)MASTER.gain.value=SET.vol;saveSet();};$('sSens').oninput=e=>{SET.sens=+e.target.value;saveSet();};
$('sGhost').onchange=e=>{SET.ghost=e.target.checked;saveSet();};$('sFast').onchange=e=>{SET.fastDay=e.target.checked;saveSet();};$('sInv').onchange=e=>{SET.invY=e.target.checked;saveSet();};
$('reveal').onclick=e=>{e.stopPropagation();$('reveal').style.display='none';};
$('sHap').onchange=e=>{SET.hap=e.target.checked;saveSet();if(SET.hap)buzz(20);};
$('menuBtn').onclick=e=>{e.stopPropagation();const m=$('menu');m.classList.toggle('open');$('menuBtn').textContent=m.classList.contains('open')?'✕':'☰';};
$('boostBtn').onclick=e=>{e.stopPropagation();initAudio();boost();};
// costumes
const TABN={0:'Pirinç',1:'Sonbahar',2:'Pampa',3:'Sahil',4:'Savan',5:'Hardal'};function tabDone(b){const ids=cardMsgs.map((m,i)=>i).filter(i=>cardMsgs[i][2]===b);return ids.length&&ids.every(i=>unlocked.has(i));}
const isLk=i=>SKINS[i].tab!==undefined?!tabDone(SKINS[i].tab):unlocked.size<SKINS[i].need;
const SKINS=[{n:'Kağıt',b:'#f6efe2',w:'#ffffff',need:0},{n:'Gün Batımı',b:'#ffd9c2',w:'#e8766b',need:3},{n:'Gece Mavisi',b:'#cfe0f5',w:'#5f7fb8',need:7},{n:'Bahar Pembesi',b:'#ffe3ee',w:'#f2a7c3',tab:0},{n:'Sonbahar',b:'#fbe2c4',w:'#d9785a',tab:1},{n:'Kar Beyazı',b:'#ffffff',w:'#9fc3dd',tab:2},{n:'Deniz Köpüğü',b:'#e4f6f6',w:'#5fb3b8',tab:3},{n:'Çöl Kumu',b:'#f7e3be',w:'#c98d4e',tab:4},{n:'Orman Yeşili',b:'#e3f1df',w:'#4f9a72',tab:5}];
let skin=+localStorage.getItem('kk_skin')||0;const scarf=new THREE.Mesh(new THREE.TorusGeometry(.38,.1,5,10),lam('#e8766b'));scarf.rotation.x=Math.PI/2.4;scarf.position.set(0,.12,-.75);scarf.scale.set(.62,.62,.7);const tailS=new THREE.Mesh(new THREE.BoxGeometry(.14,.05,.5),scarf.material);tailS.position.set(.2,.15,-.45);tailS.rotation.y=.4;
const hat=new THREE.Group();{const brim=new THREE.Mesh(new THREE.CylinderGeometry(.32,.32,.05,8),lam('#3d4f7a'));const top2=new THREE.Mesh(new THREE.ConeGeometry(.2,.42,6),brim.material);top2.position.y=.22;const crest=new THREE.Mesh(new THREE.OctahedronGeometry(.08),lam('#ffe27a'));crest.position.y=.46;hat.add(brim,top2,crest);hat.position.set(0,.3,-1.0);hat.scale.setScalar(.8);hat.rotation.x=-.2;}
bird.add(scarf,tailS,hat);
function applySkin(i){if(isLk(i))return;const isP=!!BT[btype].plane;scarf.visible=tailS.visible=!isP&&i===1;hat.visible=!isP&&i===2;skin=i;localStorage.setItem('kk_skin',i);bMat.color.set(SKINS[i].b);wMat.color.set(SKINS[i].w);renderSkins();}
$('wardBtn').onclick=e=>{e.stopPropagation();renderSkins();$('ward').style.display='flex';};$('wardClose').onclick=e=>{e.stopPropagation();$('ward').style.display='none';};
function renderSkins(){$('wardName').textContent=SKINS[skin].n;$('wardDot').style.background=SKINS[skin].b;$('wardDot').style.borderColor=SKINS[skin].w;const el=$('skins');el.innerHTML='';SKINS.forEach((s2,i)=>{const b=document.createElement('button');const lk=isLk(i);b.className='sk'+(i===skin?' on':'')+(lk?' lk':'');
 b.innerHTML='<i style="background:'+s2.b+';border-color:'+s2.w+'"></i>'+(lk?'🔒 '+(s2.tab!==undefined?TABN[s2.tab]+' albümü':s2.need+' ✉'):s2.n);b.onclick=e=>{e.stopPropagation();applySkin(i);};el.appendChild(b);});}
if(!SKINS[skin]||isLk(skin))skin=0;applySkin(skin);if(!BT[btype])btype=0;applyType(btype);
const ffMat=new THREE.SpriteMaterial({map:glowTex,color:'#e9ff9a',blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,opacity:0});
const ffs=[];for(let i=0;i<50;i++){const f=new THREE.Sprite(ffMat);f.scale.setScalar(.9);f.userData={ph:Math.random()*6,off:new THREE.Vector3((Math.random()-.5)*50,Math.random()*8,-Math.random()*50)};scene.add(f);ffs.push(f);}
const stG=new THREE.BufferGeometry();{const a=[];for(let i=0;i<400;i++){const v=new THREE.Vector3().randomDirection();v.y=Math.abs(v.y)*.8+.1;v.normalize().multiplyScalar(240);a.push(v.x,v.y,v.z);}stG.setAttribute('position',new THREE.Float32BufferAttribute(a,3));}
const stM=new THREE.PointsMaterial({color:'#fffbe8',size:1.6,sizeAttenuation:false,transparent:true,opacity:0,fog:false,depthWrite:false});const stars=new THREE.Points(stG,stM);scene.add(stars);
let qMode2=0;

const moon=new THREE.Group();{const md=new THREE.Mesh(new THREE.CircleGeometry(7,24),new THREE.MeshBasicMaterial({color:'#fff8e6',transparent:true,opacity:0,fog:false,depthWrite:false}));const mg=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:'#fff1d0',transparent:true,opacity:0,fog:false,depthWrite:false}));mg.scale.setScalar(45);moon.add(mg,md);moon.userData={md,mg};scene.add(moon);}
function nightFx(){stars.visible=false;moon.visible=false;if(0)moon.visible=dusk>.02;cam.getWorldDirection(tmp);tmp.y=0;tmp.normalize();moon.position.copy(cam.position).addScaledVector(tmp,230).add(new THREE.Vector3(-30,cam.position.y*0+14,0));moon.lookAt(cam.position);moon.userData.md.material.opacity=dusk;moon.userData.mg.material.opacity=dusk*.5;const fb=biome(birdPos.z)===5?1:.3;ffMat.opacity=dusk*fb*.9;stM.opacity=dusk*.85;stars.position.copy(cam.position);
 for(const f of ffs){f.visible=dusk>.05;if(!f.visible)continue;const u=f.userData;let p=f.position.copy(birdPos).add(u.off);u.off.z+=0;
  if(u.off.z+((birdPos.z%50))>10){}const wz=Math.floor((birdPos.z+u.off.z)/50);f.position.set(u.off.x+birdPos.x*.2+Math.sin(t*.7+u.ph)*2,height(u.off.x,birdPos.z+u.off.z)+1+u.off.y*.5+Math.sin(t*1.3+u.ph)*.6,birdPos.z+u.off.z+(((-birdPos.z)%50)-25)*0);
  f.material.opacity;}}
// ghost record marker
const ghost=new THREE.Group();{const gm=new THREE.MeshBasicMaterial({color:'#ffffff',transparent:true,opacity:.45,depthWrite:false});const b1=new THREE.Mesh(bodyG,gm);b1.scale.set(.85,.8,1.35);const w1=new THREE.Mesh(wingG,gm),w2=new THREE.Mesh(wingG,gm);w2.scale.x=-1;ghost.add(b1,w1,w2);ghost.userData.w=[w1,w2];
 const rib=new THREE.Mesh(new THREE.TorusGeometry(5,.25,6,24,Math.PI),new THREE.MeshBasicMaterial({color:'#f6a96b',transparent:true,opacity:.55}));rib.position.y=-3;ghost.add(rib);ghost.userData.rib=rib;}
scene.add(ghost);let runZ0=0,ghostPassed=false,newBestRun=false;function placeGhost(){const z=runZ0-best;ghost.visible=best>50;ghost.position.set(riverX(z),Math.max(height(riverX(z),z),0)+9,z);ghostPassed=false;}
const gbird=new THREE.Group();{const gm=new THREE.MeshBasicMaterial({color:'#dfe9ff',transparent:true,opacity:.5,depthWrite:false,side:THREE.DoubleSide});const b1=new THREE.Mesh(bodyG,gm);const w1=new THREE.Mesh(wingG,gm),w2=new THREE.Mesh(wingG,gm);w1.position.copy(wL.position);w2.position.copy(wR.position);w2.scale.x=-1;const t1=new THREE.Mesh(tail.geometry,gm);t1.position.copy(tail.position);gbird.add(b1,w1,w2,t1);gbird.scale.setScalar(2.1);gbird.userData.w=[w1,w2];gbird.visible=false;scene.add(gbird);}
let gPath=JSON.parse(localStorage.getItem(PK)||'null'),recPath=[],recT=0,runT=0;
function recTick(dt){if(!running)return;runT+=dt;recT-=dt;if(recT<=0&&recPath.length<2400){recT=.25;recPath.push([+(birdPos.x).toFixed(2),+(birdPos.y).toFixed(2),+(birdPos.z-runZ0).toFixed(2),+bank.toFixed(2)]);}
 if(gPath&&gPath.length>1){const fi=runT/.25,i=Math.floor(fi);if(i<gPath.length-1){const a=gPath[i],b=gPath[i+1],f=fi-i;gbird.visible=SET.ghost;gbird.position.set(a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f,runZ0+a[2]+(b[2]-a[2])*f);gbird.position.y=Math.max(gbird.position.y,Math.max(height(gbird.position.x,gbird.position.z),-1.3)+2);gbird.rotation.set(0,0,a[3]+(b[3]-a[3])*f);
  const fl=Math.sin(t*9)*.6;gbird.userData.w[0].rotation.z=fl;gbird.userData.w[1].rotation.z=-fl;const gd=gbird.position.distanceTo(birdPos);gbird.children[0].material.opacity=THREE.MathUtils.clamp(.55-(gd-20)/150,.08,.55);}else gbird.visible=false;}}
function savePath(){if(recPath.length>8)localStorage.setItem(PK,JSON.stringify(recPath));}
function ghostTick(){ghost.visible=SET.ghost&&best>50;if(!ghost.visible)return;{const gd=ghost.position.distanceTo(birdPos);const k=THREE.MathUtils.clamp(1-(gd-30)/140,0,1);ghost.userData.rib.material.opacity=.12+k*.5;ghost.scale.setScalar(.6+k*.4);}const f=Math.sin(t*8)*.6;ghost.userData.w[0].rotation.z=f;ghost.userData.w[1].rotation.z=-f;ghost.position.y+=Math.sin(t*2)*.01;
 if(!ghostPassed&&running&&birdPos.z<ghost.position.z){ghostPassed=true;toast('Rekor izini geçtin! 🏆');chime(1);setTimeout(()=>chime(1.5),150);for(let i=0;i<3;i++)burst(ghost.position,'#f6a96b');}}
applyGfx(SET.gfx||(localStorage.getItem('kk_q')==='low'?'low':'high'));
// weather (seeded by day+chunk)
function weatherAt(idx){const r=rnd((idx*7717+SEED*31+3)%2147483646+1);r();const v=r(),b=biome(-idx*CL-30);if((b===0||b===3)&&v<.28)return 'rain';if(v>.86)return 'fog';
 if(b===3&&idx>0&&weatherAt2(idx-1)==='rain')return 'rainbow';return '';}
function weatherAt2(idx){const r=rnd((idx*7717+SEED*31+3)%2147483646+1);r();const v=r(),b=biome(-idx*CL-30);return (b===0||b===3)&&v<.28?'rain':'';}
const rainG=new THREE.BufferGeometry();const RN=260;{const a=new Float32Array(RN*6);for(let i=0;i<RN;i++){const x=(Math.random()-.5)*40,y=Math.random()*25,z=-Math.random()*40;a.set([x,y,z,x+.1,y-.9,z],i*6);}rainG.setAttribute('position',new THREE.BufferAttribute(a,3));}
const rainM=new THREE.LineBasicMaterial({color:'#a9c6d8',transparent:true,opacity:0,depthWrite:false});const rain=new THREE.LineSegments(rainG,rainM);rain.frustumCulled=false;scene.add(rain);
const rainbow=new THREE.Group();['#f7a8a8','#f9cf9a','#fbf1a6','#bfe3a8','#a8d3ef','#c9b3ea'].forEach((c,i)=>{const m=new THREE.Mesh(new THREE.TorusGeometry(40-i*1.4,.7,4,40,Math.PI),new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:0,depthWrite:false,fog:false}));rainbow.add(m);});scene.add(rainbow);
let wRain=0,wFog=0,wBow=0,lastW='';
function weatherTick(dt){const idx=Math.floor(-birdPos.z/CL);const w=weatherAt(idx);if(w!==lastW){lastW=w;if(w==='rain')toast('Hafif bir yağmur 🌧️');if(w==='rainbow')toast('Gökkuşağı! 🌈');if(w==='fog')toast('Sis bankası 🌫️');}
 wRain+=((w==='rain'?1:0)-wRain)*dt*.8;wFog+=((w==='fog'?1:0)-wFog)*dt*.6;wBow+=((w==='rainbow'?1:0)-wBow)*dt*.5;
 rain.visible=wRain>.02;rainM.opacity=wRain*.55;if(rain.visible){rain.position.set(birdPos.x,birdPos.y-12+(-(t*30)%25+25)%25*0,birdPos.z-4);const p=rainG.attributes.position.array;for(let i=0;i<RN;i++){p[i*6+1]-=dt*28;p[i*6+4]-=dt*28;if(p[i*6+1]<-6){p[i*6+1]+=31;p[i*6+4]+=31;}}rainG.attributes.position.needsUpdate=true;}
 rainbow.visible=wBow>.02;if(rainbow.visible){rainbow.position.set(birdPos.x+10,Math.max(height(birdPos.x,birdPos.z-150),0)-5,birdPos.z-150);rainbow.children.forEach(m=>m.material.opacity=wBow*.5);}}
// stardust
const dustMat=new THREE.SpriteMaterial({map:glowTex,color:'#bcd4ff',blending:THREE.AdditiveBlending,transparent:true,depthWrite:false});const dusts=[];let dustN=0,dustT=0;
for(let i=0;i<24;i++){const s2=new THREE.Sprite(dustMat);s2.scale.setScalar(1.3);s2.visible=false;scene.add(s2);dusts.push(s2);}
function dustTick(dt){dustT-=dt;if(dusk>.4&&running&&dustT<=0){dustT=.7;const s2=dusts.find(d=>!d.visible);if(s2){s2.visible=true;s2.position.set(birdPos.x+(Math.random()-.5)*26,birdPos.y+(Math.random()-.5)*6,birdPos.z-40-Math.random()*30);}}
 dustMat.opacity=Math.min(1,dusk*1.4)*(.6+Math.sin(t*4)*.3);for(const d of dusts){if(!d.visible)continue;d.position.y+=Math.sin(t*2+d.position.x)*.01;if(d.position.z>birdPos.z+15||dusk<.2){d.visible=false;continue;}
  if(d.position.distanceTo(birdPos)<2.6){d.visible=false;dustN++;chime(1.8);buzz(6);burst(d.position,'#bcd4ff');const el=$('dust');el.style.display='';el.textContent='✧ '+dustN;}}}
if('serviceWorker' in navigator)addEventListener('load',()=>{navigator.serviceWorker.register('./sw.js').then(reg=>{const watch=w=>w&&w.addEventListener('statechange',()=>{if(w.state==='installed'&&navigator.serviceWorker.controller){$('upd').style.display='flex';$('updGo').onclick=()=>w.postMessage('skip');}});if(reg.waiting&&navigator.serviceWorker.controller){$('upd').style.display='flex';$('updGo').onclick=()=>reg.waiting.postMessage('skip');}reg.addEventListener('updatefound',()=>watch(reg.installing));}).catch(()=>{});let rl=false;navigator.serviceWorker.addEventListener('controllerchange',()=>{if(rl)return;rl=true;location.reload();});});
let deferredI=null;addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredI=e;$('install').style.display='';});
$('install').onclick=async e=>{e.stopPropagation();if(deferredI){deferredI.prompt();deferredI=null;$('install').style.display='none';}};
{const ios=/iphone|ipad|ipod/i.test(navigator.userAgent),sa=navigator.standalone||matchMedia('(display-mode: fullscreen)').matches||matchMedia('(display-mode: standalone)').matches;
 if(ios&&!sa&&!localStorage.getItem('kk_iostip')){$('iostip').style.display='';localStorage.setItem('kk_iostip','1');}}
window.__biome=biome;window.__setFly=v=>flyT=v;window.__dyn=dynamic;window.__R=renderer;window.__S=scene;
const TUT=[['☝️','Parmakla yönlendir','Ekranı sürükle: sağa-sola döner, yukarı-aşağı yükselir.'],['💨','Hızlan','Çift dokun ya da 💨 düğmesine bas.'],['✦ ✉','Topla','Parıltılardan ve kartpostallardan geç; albümünü doldur.']];let tutI=0;
function showTut(){tutI=0;renderTut();$('tut').style.display='flex';}function renderTut(){const c=TUT[tutI];$('tutCard').innerHTML='<div class="ti">'+c[0]+'</div><h3>'+c[1]+'</h3><p>'+c[2]+'</p><small>'+(tutI+1)+' / 3 · dokun</small>';}
$('tut').onclick=e=>{e.stopPropagation();tutI++;if(tutI>=TUT.length){$('tut').style.display='none';localStorage.setItem('kk_tut','1');}else renderTut();};$('tutSkip').onclick=e=>{e.stopPropagation();$('tut').style.display='none';localStorage.setItem('kk_tut','1');};
// share image
$('shareImg').onclick=async()=>{const c=document.createElement('canvas');c.width=1080;c.height=1350;const x=c.getContext('2d');const gr=x.createLinearGradient(0,0,0,1350);gr.addColorStop(0,'#f8d6a8');gr.addColorStop(.55,'#f6e6cf');gr.addColorStop(1,'#a8d58a');x.fillStyle=gr;x.fillRect(0,0,1080,1350);
 x.fillStyle='#fffaf0';x.beginPath();x.roundRect(90,150,900,1050,40);x.fill();x.strokeStyle='#e8766b';x.setLineDash([18,14]);x.lineWidth=6;x.strokeRect(120,180,840,990);x.setLineDash([]);
 x.fillStyle='#5d4b3a';x.textAlign='center';x.font='bold 96px sans-serif';x.fillText('Kağıt Kuş',540,330);x.font='60px sans-serif';x.fillText('🕊️',540,430);
 x.font='bold 120px sans-serif';x.fillStyle='#d9874b';x.fillText(Math.floor(dist)+' m',540,620);x.fillStyle='#5d4b3a';x.font='56px sans-serif';
 x.fillText('✦ '+sparks+' parıltı',540,760);x.fillText('✉ '+cards+' kartpostal',540,850);x.fillText('En iyi: '+Math.floor(best)+' m',540,960);x.font='34px sans-serif';x.fillStyle='#9a8a78';x.fillText('alperunlu07.github.io/ucus-kus',540,1110);
 const blob=await new Promise(r=>c.toBlob(r,'image/png'));const file=new File([blob],'kagit-kus.png',{type:'image/png'});
 try{if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file],text:'Kağıt Kuş ile '+Math.floor(dist)+' m uçtum!'});return;}}catch(e){}
 const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='kagit-kus.png';a.click();toast('Görsel indirildi ✓');};
const SHT=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');const g=x.createRadialGradient(32,32,4,32,32,32);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.6,'rgba(255,255,255,.6)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,64,64);return new THREE.CanvasTexture(c);})();const blob=new THREE.Mesh(new THREE.CircleGeometry(1,20),new THREE.MeshBasicMaterial({map:SHT,color:'#2c2218',transparent:true,depthWrite:false,opacity:.25}));blob.rotation.x=-Math.PI/2;blob.renderOrder=1;scene.add(blob);
const clock=new THREE.Clock();const tmp=new THREE.Vector3();let fogBoost=0,t=0;
const camPos=new THREE.Vector3(0,16,14);
function frame(){requestAnimationFrame(frame);const dt=Math.min(clock.getDelta(),.05);t+=dt;U.uTime.value=t;
 boostT=Math.max(0,boostT-dt);const spd=(running?14:6)*(1+boostT*.6)*(1-fogBoost*.3);{const alt=birdPos.y-Math.max(height(birdPos.x,birdPos.z),-1.3);const k=THREE.MathUtils.clamp((alt-2)/18,0,1);ALT=alt;const zt=(1.5-k*.78)*(1-boostT*.04);if(Math.abs(cam.zoom-zt)>.001){cam.zoom+=(zt-cam.zoom)*(1-Math.exp(-dt*2.2));cam.updateProjectionMatrix();}bird.scale.setScalar(2.1*Math.pow(cam.zoom,-.6));}
 let ix=tx,iy=ty;if(keys.ArrowLeft||keys.a)ix=-1;if(keys.ArrowRight||keys.d)ix=1;if(keys.ArrowUp||keys.w)iy=1;if(keys.ArrowDown||keys.s)iy=-1;
 if(!active&&!keys.ArrowLeft&&!keys.ArrowRight){tx*=Math.exp(-dt*1.2);}if(!active){ty*=Math.exp(-dt*1.2);}
 ix+=tilt.x;iy+=tilt.y;sIx+=(THREE.MathUtils.clamp(ix,-1,1)-sIx)*(1-Math.exp(-dt*5));sIy+=(THREE.MathUtils.clamp(iy,-1,1)-sIy)*(1-Math.exp(-dt*4));ix=sIx;iy=sIy;
 // steering: finger offset -> lateral speed & target altitude above ground
 const latV=ix*13;birdPos.x+=latV*dt;birdPos.z-=spd*dt;
 yaw+=((-ix*.3)-yaw)*dt*2;bank+=((-ix*.6)-bank)*(1-Math.exp(-dt*2.5));
 const gh=Math.max(height(birdPos.x,birdPos.z),-1.3),ahead=Math.max(height(birdPos.x,birdPos.z-8),-1.3);
 loftT=Math.max(0,loftT-dt);const tgt=Math.max(gh,ahead)+10+iy*8.5+loftT*9;vy+=((tgt-birdPos.y)*1.6-vy)*dt*2.5;birdPos.y+=vy*dt+Math.sin(t*2)*.008;
 pitch+=((THREE.MathUtils.clamp(vy*.06,-.4,.4))-pitch)*dt*4;
 if(birdPos.y<gh+1.4){birdPos.y=gh+1.4;vy=6;if(toastT<=0)toast("Hop!");}
 const lim=riverX(birdPos.z);birdPos.x=THREE.MathUtils.clamp(birdPos.x,lim-34,lim+34);
 if(running)dist+=spd*dt;
 bird.position.copy(birdPos);bird.rotation.set(pitch,yaw,bank,'YXZ');
 const dive=THREE.MathUtils.clamp(-vy*.08,0,.6);const FR=BT[btype].fr||1;const flap=(Math.sin(t*(vy>1.5||boostT>0?14:5)*FR)*(BP.flap+Math.min(.5,Math.max(0,vy)*.1)+boostT*.3)*(1-dive))*(running?1:.7)-dive*.5;wL.rotation.z=flap;wR.rotation.z=-flap;oF+=(flap-oF)*(1-Math.exp(-dt*7));wLo.rotation.z=(oF-flap)*1.4+flap*.35;wRo.rotation.z=-wLo.rotation.z;if(plane.visible){plane.userData.prop.rotation.z+=dt*(running?40:18);plane.rotation.z=Math.sin(t*1.3)*.03;}wL.rotation.y=dive*.6;wR.rotation.y=-dive*.6;
 tailS.rotation.z=Math.sin(t*12)*.3;
 // camera chase
 tmp.set(birdPos.x*.75,150,birdPos.z-VIEWH()*.18);camPos.x+=(tmp.x-camPos.x)*(1-Math.exp(-dt*2));camPos.z=tmp.z;camPos.y=150;cam.position.copy(camPos);
 cam.up.set(Math.sin(bank*.04),0,-Math.cos(bank*.04));cam.lookAt(camPos.x,0,camPos.z);
 const sa=flyT/DAYLEN*Math.PI*2*.25;tmp.set(camPos.x,0,camPos.z);sun.position.copy(tmp).add(new THREE.Vector3(-38+Math.sin(sa)*6,90,-30));sun.target.position.copy(tmp);{const ext=Math.min(66,50/cam.zoom);if(Math.abs(sun.shadow.camera.right-ext)>.5){Object.assign(sun.shadow.camera,{left:-ext,right:ext,top:ext,bottom:-ext});sun.shadow.camera.updateProjectionMatrix();}}
 {const gy=Math.max(height(birdPos.x,birdPos.z),-1.3);const al=birdPos.y-gy;blob.position.set(birdPos.x+1.2,gy+.12,birdPos.z+1);const bs=bird.scale.x*(plane.visible?1.6:.7)*(1+al*.015);blob.scale.set(bs*(plane.visible?1.6:1),bs,1);blob.material.opacity=(plane.visible?.34:.22)*THREE.MathUtils.clamp(1.2-al/40,.35,1);}
 // chunk recycle
 const cur=Math.floor(-birdPos.z/CL);for(const ch of chunks){if(ch.idx<cur-1){buildChunk(ch,ch.idx+NCH);}}
 // dynamic objects
 let inCloud=false;
 for(const d of dynamic){const o=d.o;const dx=o.position.x-birdPos.x,dz=o.position.z-birdPos.z;const dd=dx*dx+dz*dz;
  if(d.type==='tree'){const near=dd<36&&birdPos.y-o.position.y<10;if(near&&d.sway<.5){d.sway=1.4;if(d.hasBirds){flush(o.position);d.hasBirds=false;}}
   d.sway*=1-dt*1.2;if(dd<2500){o.rotation.z=Math.sin(t*1.5+d.ph)*.03+Math.sin(t*9)*d.sway*.12;o.updateMatrix();const q=d.rec;q.tr.setMatrixAt(q.ti,o.matrix);q.top.setMatrixAt(q.pi,o.matrix);q.tr.instanceMatrix.needsUpdate=true;q.top.instanceMatrix.needsUpdate=true;}}
  else if(d.type==='crowd'){crowdTick(d,dt,t);}
  else if(d.type==='act'){actTick(d,dt,t,dd);}
  else if(d.type==='town'){if(dd<200&&running)humanToast(d.town?'town':'village',d.town?'Kasabanın üstünden geçtin 🏘️':'Köy selamladı 🏡');}
  else if(d.type==='ship'){if(d.river){d.z+=d.sp*dt;o.position.set(riverX(d.z),Math.max(height(riverX(d.z),d.z),-1.4)+.02+Math.sin(t*1.2+d.ph)*.05,d.z);o.rotation.y=Math.atan2(riverX(d.z+1)-riverX(d.z),1)*(d.sp>0?1:1)+(d.sp>0?Math.PI:0);}else{o.translateZ(-d.sp*dt);o.position.y=-.6+Math.sin(t*1.1+d.ph)*.06;}o.rotation.z=Math.sin(t*1.3+d.ph)*.03;if(dd<120&&running)humanToast('ship','Gemi düdük çaldı ⛴️');}
  else if(d.type==='train'){d.x+=d.dir*d.sp*dt;if(d.x>45)d.x=-45;if(d.x<-45)d.x=45;let px=d.x;for(let i=0;i<d.cars.length;i++){const c=d.cars[i];c.position.set(px,trainY(d,px),d.zr);px-=d.dir*(i===0?3.3:3.1);}
   d.pt-=dt;if(d.pt<=0){d.pt=.45;const p=d.puffs.find(q=>q.t>=2.6)||d.puffs[0];p.t=0;p.m.visible=true;p.m.position.set(d.x+d.dir*.9,trainY(d,d.x)+1.8,d.zr);}
   for(const p of d.puffs){if(p.t<2.6){p.t+=dt;p.m.position.y+=dt*1.2;p.m.position.x-=d.dir*dt*1.5;p.m.position.z+=dt*.6;p.m.scale.setScalar(1.6+p.t*2.2);p.m.material.color.setRGB(.8+p.t*.03,.77+p.t*.03,.72+p.t*.03);p.m.material.opacity=.42*(1-p.t/2.6);}else p.m.visible=false;}
   const tx=d.x-birdPos.x,tz=d.zr-birdPos.z;if(tx*tx+tz*tz<220&&running)humanToast('train','Tren düdük çaldı 🚂');}
  else if(d.type==='house'){if(dd<50&&d.pop<=0){d.pop=1;burst(tmp.copy(o.position).add(new THREE.Vector3(0,3,0)),'#ffffff');}
   if(d.pop>0){d.pop-=dt*1.5;o.scale.set(d.base*(1+Math.sin(d.pop*12)*d.pop*.08),d.base*(1+Math.sin(d.pop*12+1)*d.pop*.12),d.base);}}
  else if(d.type==='spark'||d.type==='card'){
   if(!d.taken){const gs=o.children[o.children.length-1];const fd=Math.sqrt(dd);gs.material.opacity=.07;o.rotation.y+=dt*(d.type==='card'?1:3);o.scale.setScalar(1+Math.sin(t*5+o.position.z)*.15);o.position.y+=Math.sin(t*3+o.position.z)*.01;
    if(o.position.distanceTo(birdPos)<(d.type==='card'?2.6:2)){d.taken=true;
     if(d.type==='spark'){sparks++;burst(o.position,'#fff1a0');buzz(8);chime(1+sparks%6*.12);}else{cards++;burst(o.position,'#e8766b');burst(o.position,'#fff1a0');chime(.8);setTimeout(()=>chime(1.2),120);setTimeout(()=>chime(1.5),240);cardFlash();const bNow=biome(birdPos.z);let lockd=cardMsgs.map((_,i)=>i).filter(i=>!unlocked.has(i));const themed=lockd.filter(i=>cardMsgs[i][2]===bNow);const plain=lockd.filter(i=>cardMsgs[i][2]===undefined);lockd=themed.length?themed:plain.length?plain:lockd;const ci=lockd.length?lockd[Math.floor(Math.random()*lockd.length)]:Math.floor(Math.random()*cardMsgs.length);const isNew=!unlocked.has(ci);if(isNew)reveal(ci);else toast('✉ '+cardMsgs[ci][0]);buzz([20,40,20]);if(isNew){newCards.add(ci);SKINS.forEach(k=>{if(k.need&&unlocked.size+1===k.need)setTimeout(()=>toast('Yeni kostüm: '+k.n+'!'),1800);});}runCards.push(ci);unlocked.add(ci);localStorage.setItem('kk_cards',JSON.stringify([...unlocked]));{const tb=cardMsgs[ci][2];if(isNew&&tb!==undefined&&tabDone(tb)){const sk=SKINS.find(k=>k.tab===tb);setTimeout(()=>{toast(TABN[tb]+' albümü tamam! Yeni renk: '+sk.n+' 🎨');renderSkins();},4600);}}}}}
   else{d.t+=dt;o.scale.setScalar(Math.max(0,1-d.t*3));o.position.y+=dt*6;}
   if(d.im&&(dd<10000)&&(!d.taken||d.t<.5)){o.updateMatrix();d.im.setMatrixAt(d.ii,o.matrix);d.im.instanceMatrix.needsUpdate=true;}}
  else if(d.type==='boat'){if(dd<64&&d.rock<.3)d.rock=1;d.rock*=1-dt*.7;o.rotation.z=Math.sin(t*1.3+d.ph)*.05+Math.sin(t*5)*d.rock*.25;o.position.y=-.8+Math.sin(t*1.1+d.ph)*.08;}
  else if(d.type==='wobble'){if(dd<49&&d.w<.3){d.w=1;burst(tmp.copy(o.position).add(new THREE.Vector3(0,1.5,0)),'#ffffff');}d.w*=1-dt*1.2;o.rotation.z=Math.sin(t*10)*d.w*.25;o.rotation.x=Math.cos(t*8)*d.w*.15;}
  else if(d.type==='flowers'){if(dd<36&&d.sway<.3)d.sway=1;d.sway*=1-dt;o.rotation.z=Math.sin(t*2+d.ph)*.05+Math.sin(t*9)*d.sway*.15;}
  else if(d.type==='gulls'){if(dd<120&&d.scat<.3){d.scat=1;}d.scat*=1-dt*.4;for(const q of d.gs){q.a+=dt*q.sp*(1+d.scat*2);const rr=q.rad+d.scat*10;q.m.position.set(Math.cos(q.a)*rr,Math.sin(q.a*2)*.6+d.scat*5,Math.sin(q.a)*rr);q.m.rotation.y=-q.a;const f=Math.sin(t*(8+d.scat*8)+q.a)*.6;q.m.userData.w[0].rotation.z=f;q.m.userData.w[1].rotation.z=-f;}}
  else if(d.type==='lighthouse'){d.piv.rotation.y=t*.6;beamMat.opacity=dusk*.18;if(!d.rew&&dusk>.3&&o.position.distanceTo(birdPos)<16){d.rew=true;sparks+=5;warmFlash();chime(.9);setTimeout(()=>chime(1.35),140);setTimeout(()=>chime(1.8),280);for(let i=0;i<3;i++)burst(tmp.copy(o.position).add(new THREE.Vector3(0,6.6,0)),'#ffd27a');toast('Fener ışığında süzüldün! +5 ✦');}d.lamp.material.opacity=(.35+dusk*.6)*(.6+Math.sin(t*2)*.4);d.lamp.scale.setScalar(5+dusk*5);}
  else if(d.type==='mill'){d.sp+=((dd<150?6:1)-d.sp)*dt;d.hub.rotation.z+=d.sp*dt;}
  else if(d.type==='balloon'){if(o.position.distanceTo(birdPos)<5.5&&d.push<.3){d.push=1;chime(.7);loftT=1.2;toast('Balon seni yukarı itti! 🎈');}d.push*=1-dt*.8;o.position.y=d.y0+Math.sin(t*.7+d.ph)*.8+d.push*2;o.rotation.z=Math.sin(t*.9+d.ph)*.05+Math.sin(t*6)*d.push*.1;}
  else if(d.type==='cloud'){o.position.x+=dt*1.2;{const hd=Math.hypot(o.position.x-birdPos.x,o.position.z-birdPos.z-2);const tg=o.position.y>birdPos.y?.88*THREE.MathUtils.smoothstep(hd,7,20):.88;d.cm.opacity+=(tg-d.cm.opacity)*(1-Math.exp(-dt*4));}const dy=birdPos.y-o.position.y;if(dd<30&&Math.abs(dy)<3)inCloud=true;}}
 fogBoost+=((inCloud?1:0)-fogBoost)*dt*3;scene.fog.near=1e4;scene.fog.far=2e4;
 for(let i=flock.length-1;i>=0;i--){const f=flock[i];f.t+=dt;f.m.position.addScaledVector(f.v,dt);f.m.rotation.x+=dt*20;if(f.t>3){scene.remove(f.m);flock.splice(i,1);}}
 for(let i=bursts.length-1;i>=0;i--){const b=bursts[i];b.t+=dt;b.m.position.addScaledVector(b.v,dt);b.v.multiplyScalar(1-dt*3);b.m.scale.setScalar(Math.max(0,1-b.t*1.5));if(b.t>.8){scene.remove(b.m);bursts.splice(i,1);}}
 trailT-=dt;if(false){trailT=.06;for(const w of[1,-1]){const p=trail[trailI++%trail.length];p.position.copy(birdPos).add(tmp.set(w*1.3*Math.cos(bank),-.1+w*Math.sin(-bank)*1.3,.6));p.userData.t=0;p.visible=true;}}
 for(const p of trail)if(p.visible){p.userData.t+=dt;p.material.opacity;p.scale.setScalar(.6+p.userData.t*1.5);if(p.userData.t>1)p.visible=false;}
 const bq=biome(birdPos.z);ptT-=dt;if(running&&bq===1&&ptT<=0){ptT=.08;const p=pts[ptI++%pts.length];p.material=bq===2?snowM:leafM[ptI%3];p.position.set(birdPos.x+(Math.random()-.5)*24,birdPos.y+6+Math.random()*6,birdPos.z-6-Math.random()*20);p.userData.t=0;p.userData.s=bq;p.visible=true;}
 for(const p of pts)if(p.visible){p.userData.t+=dt;p.position.y-=dt*(p.userData.s===2?2:1.4);p.position.x+=Math.sin(t*2+p.id)*dt*1.5;p.rotation.x+=dt*3;p.rotation.y+=dt*2;if(p.userData.t>5)p.visible=false;}
 if(running&&qMode==='auto'){fpsAcc+=dt;fpsN++;if(fpsAcc>1){const f=fpsN/fpsAcc;fpsAcc=0;fpsN=0;lowSec=f<35?lowSec+1:0;if(lowSec>=5&&SET.gfx==='low'&&!calmTold){calmTold=true;toast('Telefon zorlanıyor: ⚙️ Sakin mod önerilir 🍃');}
 if(lowSec>=4&&SET.gfx!=='low'&&SET.gfx!=='calm'){const nk=SET.gfx==='mid'?'low':'mid';applyGfx(nk);lowSec=0;toast('Grafik otomatik: '+(nk==='low'?'Düşük':'Orta'));}}}
 recTick(dt);if(running&&dist>best){best=dist;newBestRun=true;if(Math.floor(dist)%20==0){saveBest();savePath();}}
 wind(spd,vy);
 if(running){for(const ch of chunks)if(ch.wow&&Math.abs(ch.z0-30-birdPos.z)<40)wowSeen=true;checkGoal();dailyAcc(dt);checkDaily();}
 weatherTick(dt);dustTick(dt);fogBoost=Math.max(fogBoost,wFog*.55);
 flyT+=running?dt:0;dayCycle(SET.fastDay?flyT*6+80:flyT+80);nightFx();ghostTick();
 if(running&&dist>=2000&&!sumShown){sumShown=true;setTimeout(()=>showSummary(true),1200);}
 crowdToastT-=dt;if(toastT>0){toastT-=dt;if(toastT<=.35)$('toast').style.opacity=0;if(toastT<=0&&TQ.length){toast(TQ.shift());}}
 $('dist').textContent=Math.floor(dist)+' m';$('coll').textContent='✦ '+sparks;$('post').textContent='✉ '+cards;
 renderer.render(scene,cam);}
addEventListener('resize',()=>{renderer.setSize(innerWidth,innerHeight);orthoFit();});
frame();window.__dyn=dynamic;window.__R=renderer;window.__S=scene;window.__hum=()=>dynamic.filter(d=>['train','ship','town','act'].includes(d.type)).map(d=>[d.type,Math.round(d.o.position.x||d.x||0),Math.round(d.zr||d.o.position.z)]);window.__cr=()=>dynamic.filter(d=>d.type==='crowd');window.__crowds=()=>dynamic.filter(d=>d.type==='crowd').map(d=>d.kind);window.__game={birdPos,get sparks(){return sparks}};
