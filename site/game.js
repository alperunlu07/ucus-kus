import * as THREE from 'three';
const SET=Object.assign({vol:.8,sens:1,ghost:true,fastDay:false,invY:false},JSON.parse(localStorage.getItem('kk_set')||'{}'));
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
const ACC=new THREE.Color();const BW=[0,0];
const SEA=[0,0,0,1,0,0];
function groundColor(x,z,h,out){const q=biomeAt(z);const n=fbm(x*.05+9,z*.05);
 const a=pal[q.a],c=pal[q.b];const g=a.g1.clone().lerp(a.g2,n).lerp(c.g1.clone().lerp(c.g2,n),q.k);ACC.copy(a.acc).lerp(c.acc,q.k);BW[0]=(q.a===0?1-q.k:0)+(q.b===0?q.k:0);BW[1]=SEA[q.a]*(1-q.k)+SEA[q.b]*q.k;
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
Object.assign(sun.shadow.camera,{left:-55,right:55,top:55,bottom:-55,near:1,far:240});sun.shadow.radius=2;sun.shadow.intensity=.45;sun.shadow.bias=-.0008;
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
{const ob=groundMat.onBeforeCompile;groundMat.onBeforeCompile=sh=>{ob(sh);sh.uniforms.uRv=URV;sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nattribute vec3 acc;varying vec3 vAcc;attribute vec2 bw;varying vec2 vBw;').replace('#include <begin_vertex>','#include <begin_vertex>\nvAcc=acc;vBw=bw;');
 sh.fragmentShader=sh.fragmentShader.replace('uniform float uTime;','uniform float uTime;uniform vec3 uRv;varying vec3 vAcc;varying vec2 vBw;').replace('#include <color_fragment>',`#include <color_fragment>
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
  float bank=1.-smoothstep(4.6,5.4,abs(dxr));diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.7,.62,.36),bank*.8);float rv=1.-smoothstep(3.7,4.1,abs(dxr));vec3 wc=mix(vec3(.03,.11,.38),vec3(.07,.21,.52),smoothstep(2.2,3.8,abs(dxr))*.6+n2(vW.xz*vec2(.3,.05)+vec2(0.,uTime*.3))*.25);wc+=step(.992,h2(floor(vW.xz*1.6)+floor(uTime*1.5)*.37))*.3;diffuseColor.rgb=mix(diffuseColor.rgb,wc,rv);
  {float pw=smoothstep(.35,.65,vBw.x)*away*(1.-bank);if(pw>.01){vec2 pq=vec2(vW.x,vW.z+floor(vW.x/9.)*2.3);vec2 pc=floor(pq/vec2(9.,6.));vec2 pf=fract(pq/vec2(9.,6.));
   float lev=min(min(pf.x,1.-pf.x)*9.,min(pf.y,1.-pf.y)*6.);float ph=h2(pc+2.7);
   vec3 pcol=ph<.4?vec3(.05,.3,.5):ph<.7?vec3(.08,.38,.33):ph<.9?vec3(.04,.22,.5):vec3(.2,.44,.12);pcol*=.96+n2(vW.xz*.8)*.06;
   pcol+=step(.994,h2(floor(vW.xz*2.)+floor(uTime)*.41))*.25;vec3 levc=vec3(.22,.55,.12);
   vec3 paddy=mix(levc,pcol,smoothstep(.25,.5,lev));float road2=1.-smoothstep(.5,.8,abs(fract(vW.z/54.)*54.-27.));paddy=mix(paddy,vec3(.6,.57,.52),road2*.9);
   diffuseColor.rgb=mix(diffuseColor.rgb,paddy,pw);}}
  {float sw=smoothstep(.3,.7,vBw.y);if(sw>.01){float shore=-11.-n2(vec2(vW.z*.03,1.))*7.;float sd=dxr-shore;
   vec3 sea=mix(vec3(.03,.11,.38),vec3(.08,.24,.55),smoothstep(-1.,-6.,sd)*0.+smoothstep(-4.,0.,sd)*.5)+n2(vW.xz*vec2(.08,.2)+uTime*.05)*.04;
   sea+=step(.993,h2(floor(vW.xz*1.6)+floor(uTime*1.5)*.37))*.3;float foam=(1.-smoothstep(0.,.25,abs(sd+.35+sin(vW.z*.2+uTime*1.2)*.15)))*.55;sea=mix(sea,vec3(.95),foam);
   vec3 sand=vec3(.78,.68,.4);vec3 cc=sd<0.?sea:mix(sand,diffuseColor.rgb,smoothstep(.3,1.,sd));diffuseColor.rgb=mix(diffuseColor.rgb,cc,sw);}}}`);};}
const lam=c=>cloudify(new THREE.MeshLambertMaterial({color:c}));
// ---------- shared geoms ----------
const G={cone:new THREE.ConeGeometry(1,2.4,6),ball:new THREE.IcosahedronGeometry(1.25,2),trunk:new THREE.CylinderGeometry(.18,.25,1,5),
 box:new THREE.BoxGeometry(1,1,1),roof:new THREE.ConeGeometry(.85,.7,4),sheep:new THREE.IcosahedronGeometry(.55,0),head:new THREE.BoxGeometry(.3,.3,.35),
 spark:new THREE.OctahedronGeometry(.6,0),card:new THREE.BoxGeometry(1.6,1.1,.08),cloud:new THREE.IcosahedronGeometry(1,2),beam:new THREE.ConeGeometry(3,18,16,1,true),cap:new THREE.SphereGeometry(.5,7,4,0,Math.PI*2,0,Math.PI/2),fern:new THREE.ConeGeometry(.35,1,4),cact:new THREE.CylinderGeometry(.3,.35,2.2,6),lhSeg:new THREE.CylinderGeometry(.75,.9,1.6,8),mill:new THREE.CylinderGeometry(.7,1.1,4,6),blade:new THREE.BoxGeometry(.35,2.6,.06),arch:new THREE.BoxGeometry(18,.35,2.2),balloon:new THREE.IcosahedronGeometry(2,1),gw:new THREE.BoxGeometry(.7,.04,.18),gb:new THREE.IcosahedronGeometry(.18,0),sail:new THREE.ConeGeometry(.7,1.8,3),snowB:new THREE.IcosahedronGeometry(.6,1),nose:new THREE.ConeGeometry(.08,.35,4),flower:new THREE.IcosahedronGeometry(.18,0),leaf:new THREE.CircleGeometry(.35,5)};
G.trunk.translate(0,.5,0);G.fern.translate(0,.5,0);G.cact.translate(0,1.1,0);G.mill.translate(0,2,0);G.blade.translate(0,1.3,0);G.gw.translate(.35,0,0);G.cone.translate(0,1.2+.8,0);G.ball.translate(0,1.8,0);G.box.translate(0,.5,0);
const M={trunk:lam('#9a7458'),wall:lam('#fbf3e4'),roofs:['#e07a5f','#7aa6c2','#e9b35d'].map(lam),wool:lam('#fffaf2'),dark:lam('#4a3f39'),
 cow:lam('#4a3a2e'),hay:lam('#e2c77a'),cact:lam('#7fb685'),sandrock:lam('#e0a979'),inst:lam('#ffffff'),rock:lam('#b9b2a8'),fl1:lam('#f7b2c8'),fl2:lam('#fff0a0'),fox:lam('#ef8f4a'),
 spark:new THREE.MeshBasicMaterial({color:'#fff3a8'}),card:new THREE.MeshLambertMaterial({color:'#fffdf6'}),stamp:new THREE.MeshBasicMaterial({color:'#e8766b'}),
 cloud:new THREE.MeshBasicMaterial({color:'#ffffff'})};
const glowTex=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');const g=x.createRadialGradient(32,32,0,32,32,32);
 g.addColorStop(0,'rgba(255,250,210,1)');g.addColorStop(.35,'rgba(255,230,150,.55)');g.addColorStop(1,'rgba(255,220,140,0)');x.fillStyle=g;x.fillRect(0,0,64,64);return new THREE.CanvasTexture(c);})();
const glowMat=new THREE.SpriteMaterial({map:glowTex,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,fog:false});
const FLC=[C('#f7b2c8'),C('#fff0a0'),C('#ffffff')];
const beamMat=new THREE.MeshBasicMaterial({color:'#ffe9b0',transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,fog:false});
const treeMats=[...pal[0].tree,...pal[1].tree].map(c=>lam(c));
// ---------- chunks ----------
const CW=150,CL=60,NCH=5,SEG_X=50,SEG_Z=20;
const chunks=[];const dynamic=[];// interactive objects
function rnd(seed){let s=seed;return()=>{s=(s*16807)%2147483647;return s/2147483647;};}
function buildChunk(ch,idx){
 ch.idx=idx;const z0=-idx*CL;ch.z0=z0;
 if(ch.group){scene.remove(ch.group);ch.group.traverse(o=>{if(o.isInstancedMesh)o.dispose();else if(o.isMesh&&o.geometry.userData.own)o.geometry.dispose();});}
 for(let i=dynamic.length-1;i>=0;i--)if(dynamic[i].chunk===ch)dynamic.splice(i,1);
 const g=new THREE.Group();ch.group=g;
 const geo=new THREE.PlaneGeometry(CW,CL,SEG_X,SEG_Z);geo.rotateX(-Math.PI/2);geo.userData.own=true;
 const p=geo.attributes.position,cols=new Float32Array(p.count*3),accs=new Float32Array(p.count*3),bws=new Float32Array(p.count*2),col=new THREE.Color();
 for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i)+z0-CL/2;const h=height(x,z);p.setY(i,h);p.setZ(i,z);
  groundColor(x,z,h,col);cols.set([col.r,col.g,col.b],i*3);accs.set([ACC.r,ACC.g,ACC.b],i*3);bws.set(BW,i*2);}
 geo.setAttribute('color',new THREE.BufferAttribute(cols,3));geo.setAttribute('acc',new THREE.BufferAttribute(accs,3));geo.setAttribute('bw',new THREE.BufferAttribute(bws,2));geo.computeVertexNormals();
 const ng=geo;ng.userData.own=true;
 const mesh=new THREE.Mesh(ng,groundMat);mesh.receiveShadow=true;g.add(mesh);
 // water plane
 const wgeo=new THREE.PlaneGeometry(CW,CL,30,12);wgeo.rotateX(-Math.PI/2);
 const water=new THREE.Mesh(wgeo,waterMat);water.visible=false;water.position.set(0,-1.35,z0-CL/2);g.add(water);
 const r=rnd((idx*9301+49297+SEED*7919)%2147483646+1);
 // trees
 const SP=[];const mkSpark=()=>{const o=new THREE.Group();SP.push(o);return o;};
 const TB=[];const addTree=(x,h,z,sx,sy,ry,kind,col,birds)=>{const o=new THREE.Object3D();o.position.set(x,h,z);o.scale.set(sx,sy,sx);o.rotation.y=ry;o.updateMatrix();const rec={o,kind,col};TB.push(rec);
  dynamic.push({type:'tree',o,rec,chunk:ch,ph:r()*6,sway:0,hasBirds:birds});};
 const forest=biome(z0-30)===5;
 const CLU=[];const autumn=biome(z0-30)===1;for(let k=0;k<(forest?9:autumn?10:5);k++)CLU.push([(r()-.5)*CW*.8,z0-r()*CL,2.5+r()*4]);
 for(let i=0;i<(forest?60:autumn?60:30)*PROPK;i++){const cc=CLU[i%CLU.length];const x=cc[0]+(r()-.5)*cc[2]*2,z=cc[1]+(r()-.5)*cc[2]*2;const h=height(x,z);if(h<-.2||h>12)continue;
  if(Math.abs(x-riverX(z))<7&&r()<.7)continue;
  if(biome(z)===4){if(r()<.8)continue;const cc=new THREE.Group();const cb=new THREE.Mesh(G.cact,M.cact);cb.castShadow=true;cc.add(cb);for(const sd of[-1,1])if(r()<.7){const arm=new THREE.Mesh(G.cact,M.cact);arm.scale.set(.6,.4,.6);arm.position.set(sd*.45,.9+r()*.5,0);cc.add(arm);}cc.position.set(x,h,z);cc.scale.setScalar(.8+r()*.6);g.add(cc);dynamic.push({type:'wobble',o:cc,chunk:ch,w:0});continue;}
  const bz=biome(z);const s=.7+r()*.8;const col=pal[bz].tree[Math.floor(r()*3)];const tall=bz===5?1.3+r()*.9:1;
  addTree(x,h,z,s,s*tall,r()*6,2,col,r()<.25);}
 // village
 for(let vc=0;vc<1;vc++)if(r()<.6){const vx=riverX(z0-30)+(r()<.5?-1:1)*(16+r()*10),vz=z0-15-r()*30;
  for(let i=0;i<2+r()*3;i++){const x=vx+(r()-.5)*9,z=vz+(r()-.5)*9,h=height(x,z);if(h<-.3)continue;
   const house=new THREE.Group();const w=new THREE.Mesh(G.box,M.wall);w.scale.set(1.4,1.1,1.2);
   const rf=new THREE.Mesh(G.roof,M.roofs[Math.floor(r()*3)]);rf.position.y=1.45;rf.rotation.y=Math.PI/4;rf.scale.set(1.25,1,1.1);
   w.castShadow=rf.castShadow=true;house.add(w,rf);house.position.set(x,h-.05,z);house.rotation.y=r()*6;house.scale.setScalar(1.2);g.add(house);
   dynamic.push({type:'house',o:house,chunk:ch,base:1.2,pop:0});}}
 // animals
 const herd=1+Math.floor(r()*3);
 for(let k=0;k<herd;k++){const hx=(r()-.5)*70,hz=z0-r()*CL;const kind=r();
  for(let i=0;i<3+r()*4;i++){const x=hx+(r()-.5)*8,z=hz+(r()-.5)*8,h=height(x,z);if(h<-.3||h>10)continue;
   const a=new THREE.Group();const bzA=biome(hz);const body=new THREE.Mesh(G.sheep,(bzA===4||bzA===2||kind>.6)?M.cow:M.wool);
   body.position.y=.55;body.scale.set(1,.85,1.25);const hd=new THREE.Mesh(G.head,M.dark);hd.position.set(0,.75,.6);
   body.castShadow=true;a.add(body,hd);a.position.set(x,h,z);a.rotation.y=r()*6;a.scale.setScalar(.5);g.add(a);
   dynamic.push({type:'animal',o:a,chunk:ch,head:hd,vel:new THREE.Vector3(),hop:0,scared:0,ph:r()*6});}}
 // biome props
 for(let i=0;i<6*PROPK;i++){const x=(r()-.5)*CW*.8,z=z0-r()*CL,h=height(x,z);const bi=biome(z);
  if(bi===3){if(h>-1.6&&h<-.3&&r()<.6){const rk=new THREE.Mesh(G.ball,M.rock);rk.scale.set(.8+r(),.5+r()*.5,.8+r());rk.position.set(x,h-1.6,z);rk.castShadow=true;g.add(rk);}
   else if(h<-1.5&&r()<.25){const bt=new THREE.Group();const hull=new THREE.Mesh(G.box,M.roofs[Math.floor(r()*3)]);hull.scale.set(1,.5,2.4);const sail=new THREE.Mesh(G.sail,M.wool);sail.position.set(0,1.6,0);bt.add(hull,sail);bt.position.set(x,-1.5,z);bt.rotation.y=r()*6;hull.castShadow=sail.castShadow=true;g.add(bt);dynamic.push({type:'boat',o:bt,chunk:ch,ph:r()*6,rock:0});}
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
 // build tree instances
 {const n=TB.length;if(n){const mk=(geo,cnt)=>{const im=new THREE.InstancedMesh(geo,M.inst,Math.max(1,cnt));im.castShadow=true;im.count=0;g.add(im);return im;};
  const trI=mk(G.trunk,n),coI=mk(G.cone,n),baI=mk(G.ball,n);trI.instanceColor=null;const brown=C('#9a7458');
  for(const rec of TB){rec.tr=trI;rec.ti=trI.count++;trI.setMatrixAt(rec.ti,rec.o.matrix);trI.setColorAt(rec.ti,brown);const top=rec.kind===1?coI:baI;rec.top=top;rec.pi=top.count++;top.setMatrixAt(rec.pi,rec.o.matrix);top.setColorAt(rec.pi,rec.col);}
  for(const im of[trI,coI,baI]){im.instanceMatrix.needsUpdate=true;if(im.instanceColor)im.instanceColor.needsUpdate=true;im.computeBoundingSphere();}}}
 // coast extras
 if(biome(z0-30)===3){for(let k=0;k<2;k++){const gc=new THREE.Vector3((r()-.5)*60,6+r()*5,z0-r()*CL);const gl=new THREE.Group();const gs=[];
   for(let i=0;i<4;i++){const gb=makeGull();gl.add(gb);gs.push({m:gb,a:r()*6,rad:3+r()*4,sp:.6+r()*.5});}gl.position.copy(gc);g.add(gl);dynamic.push({type:'gulls',o:gl,chunk:ch,gs,scat:0});}
  if(r()<.4){const lx=riverX(z0-30)-26-r()*6,lz=z0-30,lh=Math.max(height(lx,lz),-.5);const lt=new THREE.Group();
   for(let i=0;i<4;i++){const seg=new THREE.Mesh(G.lhSeg,i%2?M.roofs[0]:M.wall);seg.position.y=i*1.6+.8;seg.scale.setScalar(1-i*.1);seg.castShadow=true;lt.add(seg);}
   const cap=new THREE.Mesh(G.roof,M.roofs[0]);cap.position.y=7.2;cap.scale.set(1.2,1.2,1.2);lt.add(cap);const lamp=new THREE.Sprite(glowMat.clone());lamp.scale.setScalar(5);lamp.position.y=6.6;lt.add(lamp);
   const piv=new THREE.Group();piv.position.y=6.6;const cone=new THREE.Mesh(G.beam,beamMat);cone.rotation.z=Math.PI/2;cone.position.x=9;piv.add(cone);lt.add(piv);
   lt.position.set(lx,lh,lz);g.add(lt);dynamic.push({type:'lighthouse',o:lt,chunk:ch,lamp,piv});}}
 // windmills / bridge
 if(r()<.35&&biome(z0-30)!==3){const wx=(r()<.5?-1:1)*(22+r()*14)+riverX(z0-20),wz=z0-20-r()*20,wh=height(wx,wz);if(wh>-.2&&wh<9){const wm=new THREE.Group();
   const tw=new THREE.Mesh(G.mill,M.wall);tw.castShadow=true;const cp=new THREE.Mesh(G.roof,M.roofs[2]);cp.position.y=4.3;cp.rotation.y=Math.PI/4;const hub=new THREE.Group();hub.position.set(0,3.6,.9);
   for(let i=0;i<4;i++){const bl=new THREE.Mesh(G.blade,M.card);bl.rotation.z=i*Math.PI/2;bl.castShadow=true;hub.add(bl);}wm.add(tw,cp,hub);wm.position.set(wx,wh,wz);wm.rotation.y=r()*1-.5;g.add(wm);dynamic.push({type:'mill',o:wm,chunk:ch,hub,sp:1});}}
 if(r()<.5){const bz=z0-10-r()*40,bx=riverX(bz);const br=new THREE.Group();const deck=new THREE.Mesh(G.arch,M.trunk);deck.castShadow=true;br.add(deck);
   br.position.set(bx,Math.max(height(bx-8,bz),height(bx+8,bz),-1)-.3,bz);br.rotation.y=Math.atan(riverX(bz+.5)-riverX(bz-.5));g.add(br);}
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
  const np=4+Math.floor(r()*3);for(let j=0;j<np;j++){const m=new THREE.Mesh(G.cloud,M.cloud);const a2=j/np*6.28;m.position.set(Math.cos(a2)*1.4+(r()-.5),r()*.8+(j===0?.8:0),Math.sin(a2)*1.1);m.scale.setScalar(j===0?2:1.1+r()*.8);cl.add(m);}
  cl.position.set(x,y,z);cl.scale.setScalar(.85+r()*.5);cl.traverse(o=>{if(o.isMesh)o.castShadow=true;});g.add(cl);dynamic.push({type:'cloud',o:cl,chunk:ch,ph:r()*6});}
 if(SP.length){const im=new THREE.InstancedMesh(G.spark,M.spark,SP.length);im.frustumCulled=false;g.add(im);let k=0;for(const d of dynamic)if(d.chunk===ch&&d.type==='spark'){d.im=im;d.ii=k;d.o.updateMatrix();im.setMatrixAt(k++,d.o.matrix);}im.count=k;}
 scene.add(g);}
function makeGull(){const b=new THREE.Group();const bd=new THREE.Mesh(G.gb,M.wool);bd.scale.set(1,.8,2);const l=new THREE.Mesh(G.gw,M.wool),r2=new THREE.Mesh(G.gw,M.wool);r2.scale.x=-1;b.add(bd,l,r2);b.userData.w=[l,r2];return b;}
const waterMat=cloudify(new THREE.MeshLambertMaterial({color:'#3f78c0',emissive:'#10284a'}));
{const ob=waterMat.onBeforeCompile;waterMat.onBeforeCompile=sh=>{ob(sh);sh.vertexShader=sh.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
 {vec4 wp=modelMatrix*vec4(transformed,1.);transformed.y+=sin(wp.x*.35+uTime*1.6)*.12+sin(wp.z*.27-uTime*1.2)*.12;}`).replace('#include <common>','#include <common>\nuniform float uTime;');
 sh.fragmentShader=sh.fragmentShader.replace('gl_FragColor.rgb*=1.-cs*.22;','gl_FragColor.rgb*=1.-cs*.22;float fo=smoothstep(.82,1.,sin(vW.x*.5+vW.z*.3+uTime*1.4)*.5+.5);gl_FragColor.rgb=mix(gl_FragColor.rgb,vec3(.5,.68,.92),fo*.18);float gli=step(.992,h2(floor(vW.xz*1.6)+floor(uTime*1.5)*.37));gl_FragColor.rgb+=gli*.35;');};}
for(let i=0;i<NCH;i++){const ch={};chunks.push(ch);buildChunk(ch,i);}
// ---------- bird ----------
const bird=new THREE.Group();
const bMat=lam('#ffffff'),wMat=lam('#ffffff'),beakMat=lam('#f29e4c');
const bodyG=new THREE.IcosahedronGeometry(.6,1);const bBody=new THREE.Mesh(bodyG,bMat);bBody.scale.set(.55,.5,1.5);
const bHead=new THREE.Mesh(new THREE.IcosahedronGeometry(.42,1),bMat);bHead.position.set(0,.35,-.7);
const beak=new THREE.Mesh(new THREE.ConeGeometry(.12,.35,4),beakMat);beak.rotation.x=-Math.PI/2;beak.position.set(0,.3,-1.15);
const eyeG=new THREE.SphereGeometry(.06,6,4);const e1=new THREE.Mesh(eyeG,M.dark),e2=e1.clone();e1.position.set(.25,.45,-.95);e2.position.set(-.25,.45,-.95);
const tail=new THREE.Mesh(new THREE.ConeGeometry(.3,.7,4),wMat);tail.rotation.x=Math.PI/2;tail.position.set(0,.1,.95);tail.scale.set(1.3,1,.3);
const wingG=new THREE.BoxGeometry(2.9,.05,.36);{const pp=wingG.attributes.position;for(let i=0;i<pp.count;i++){if(pp.getX(i)>0)pp.setZ(i,pp.getZ(i)*.5+.15);}}wingG.translate(1.15,0,0);
const wL=new THREE.Mesh(wingG,wMat),wR=new THREE.Mesh(wingG,wMat);wL.position.set(.35,.15,-.1);wR.position.set(-.35,.15,-.1);wR.scale.x=-1;
[bBody,bHead,wL,wR,tail].forEach(m=>m.castShadow=true);
bird.add(bBody,bHead,beak,e1,e2,tail,wL,wR);bird.scale.setScalar(2.1);scene.add(bird);
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
let toastT=0;function toast(s){const t=$('toast');t.textContent=s;t.style.opacity=1;toastT=1.6;}
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
let trailI=0,trailT=0,fpsAcc=0,fpsN=0,lowQ=false;
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
const SKINS=[{n:'Kağıt',b:'#ffffff',w:'#ffffff',need:0},{n:'Gün Batımı',b:'#ffd9c2',w:'#e8766b',need:3},{n:'Gece Mavisi',b:'#cfe0f5',w:'#5f7fb8',need:7},{n:'Bahar Pembesi',b:'#ffe3ee',w:'#f2a7c3',tab:0},{n:'Sonbahar',b:'#fbe2c4',w:'#d9785a',tab:1},{n:'Kar Beyazı',b:'#ffffff',w:'#9fc3dd',tab:2},{n:'Deniz Köpüğü',b:'#e4f6f6',w:'#5fb3b8',tab:3},{n:'Çöl Kumu',b:'#f7e3be',w:'#c98d4e',tab:4},{n:'Orman Yeşili',b:'#e3f1df',w:'#4f9a72',tab:5}];
let skin=+localStorage.getItem('kk_skin')||0;const scarf=new THREE.Mesh(new THREE.TorusGeometry(.38,.1,5,10),lam('#e8766b'));scarf.rotation.x=Math.PI/2.4;scarf.position.set(0,.18,-.62);const tailS=new THREE.Mesh(new THREE.BoxGeometry(.14,.05,.5),scarf.material);tailS.position.set(.18,.1,-.25);tailS.rotation.y=.4;
const hat=new THREE.Group();{const brim=new THREE.Mesh(new THREE.CylinderGeometry(.32,.32,.05,8),lam('#3d4f7a'));const top2=new THREE.Mesh(new THREE.ConeGeometry(.2,.42,6),brim.material);top2.position.y=.22;const crest=new THREE.Mesh(new THREE.OctahedronGeometry(.08),lam('#ffe27a'));crest.position.y=.46;hat.add(brim,top2,crest);hat.position.set(0,.76,-.72);hat.rotation.x=-.2;}
bird.add(scarf,tailS,hat);
function applySkin(i){if(isLk(i))return;scarf.visible=tailS.visible=i===1;hat.visible=i===2;skin=i;localStorage.setItem('kk_skin',i);bMat.color.set(SKINS[i].b);wMat.color.set(SKINS[i].w);renderSkins();}
$('wardBtn').onclick=e=>{e.stopPropagation();renderSkins();$('ward').style.display='flex';};$('wardClose').onclick=e=>{e.stopPropagation();$('ward').style.display='none';};
function renderSkins(){$('wardName').textContent=SKINS[skin].n;$('wardDot').style.background=SKINS[skin].b;$('wardDot').style.borderColor=SKINS[skin].w;const el=$('skins');el.innerHTML='';SKINS.forEach((s2,i)=>{const b=document.createElement('button');const lk=isLk(i);b.className='sk'+(i===skin?' on':'')+(lk?' lk':'');
 b.innerHTML='<i style="background:'+s2.b+';border-color:'+s2.w+'"></i>'+(lk?'🔒 '+(s2.tab!==undefined?TABN[s2.tab]+' albümü':s2.need+' ✉'):s2.n);b.onclick=e=>{e.stopPropagation();applySkin(i);};el.appendChild(b);});}
if(!SKINS[skin]||isLk(skin))skin=0;applySkin(skin);
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
const gbird=new THREE.Group();{const gm=new THREE.MeshBasicMaterial({color:'#dfe9ff',transparent:true,opacity:.5,depthWrite:false});const b1=new THREE.Mesh(bodyG,gm);b1.scale.set(.85,.8,1.35);const h1=new THREE.Mesh(new THREE.IcosahedronGeometry(.42,1),gm);h1.position.set(0,.35,-.7);const w1=new THREE.Mesh(wingG,gm),w2=new THREE.Mesh(wingG,gm);w1.position.x=.35;w2.position.x=-.35;w2.scale.x=-1;gbird.add(b1,h1,w1,w2);gbird.userData.w=[w1,w2];gbird.visible=false;scene.add(gbird);}
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
window.__biome=biome;window.__setFly=v=>flyT=v;window.__dyn=dynamic;
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
const clock=new THREE.Clock();const tmp=new THREE.Vector3();let fogBoost=0,t=0;
const camPos=new THREE.Vector3(0,16,14);
function frame(){requestAnimationFrame(frame);const dt=Math.min(clock.getDelta(),.05);t+=dt;U.uTime.value=t;
 boostT=Math.max(0,boostT-dt);const spd=(running?14:6)*(1+boostT*.6)*(1-fogBoost*.3);{const zt=1-boostT*.04;if(Math.abs(cam.zoom-zt)>.001){cam.zoom+=(zt-cam.zoom)*dt*4;cam.updateProjectionMatrix();}}
 let ix=tx,iy=ty;if(keys.ArrowLeft||keys.a)ix=-1;if(keys.ArrowRight||keys.d)ix=1;if(keys.ArrowUp||keys.w)iy=1;if(keys.ArrowDown||keys.s)iy=-1;
 if(!active&&!keys.ArrowLeft&&!keys.ArrowRight){tx*=Math.exp(-dt*1.2);}if(!active){ty*=Math.exp(-dt*1.2);}
 ix+=tilt.x;iy+=tilt.y;sIx+=(THREE.MathUtils.clamp(ix,-1,1)-sIx)*(1-Math.exp(-dt*5));sIy+=(THREE.MathUtils.clamp(iy,-1,1)-sIy)*(1-Math.exp(-dt*4));ix=sIx;iy=sIy;
 // steering: finger offset -> lateral speed & target altitude above ground
 const latV=ix*13;birdPos.x+=latV*dt;birdPos.z-=spd*dt;
 yaw+=((-ix*.3)-yaw)*dt*2;bank+=((-ix*.6)-bank)*(1-Math.exp(-dt*2.5));
 const gh=Math.max(height(birdPos.x,birdPos.z),-1.3),ahead=Math.max(height(birdPos.x,birdPos.z-8),-1.3);
 loftT=Math.max(0,loftT-dt);const tgt=Math.max(gh,ahead)+9+iy*6+loftT*9;vy+=((tgt-birdPos.y)*1.6-vy)*dt*2.5;birdPos.y+=vy*dt+Math.sin(t*2)*.008;
 pitch+=((THREE.MathUtils.clamp(vy*.06,-.4,.4))-pitch)*dt*4;
 if(birdPos.y<gh+1.4){birdPos.y=gh+1.4;vy=6;if(toastT<=0)toast("Hop!");}
 const lim=riverX(birdPos.z);birdPos.x=THREE.MathUtils.clamp(birdPos.x,lim-34,lim+34);
 if(running)dist+=spd*dt;
 bird.position.copy(birdPos);bird.rotation.set(pitch,yaw,bank,'YXZ');
 const dive=THREE.MathUtils.clamp(-vy*.08,0,.6);const flap=(Math.sin(t*(vy>1.5||boostT>0?16:8))*(.55+Math.min(.5,Math.max(0,vy)*.1)+boostT*.3)*(1-dive))*(running?1:.7)-dive*.5;wL.rotation.z=flap;wR.rotation.z=-flap;wL.rotation.y=dive*.6;wR.rotation.y=-dive*.6;
 bBody.position.y=Math.sin(t*9)*.04;tailS.rotation.z=Math.sin(t*12)*.3;
 // camera chase
 tmp.set(birdPos.x*.75,150,birdPos.z-VIEWH()*.18);camPos.x+=(tmp.x-camPos.x)*(1-Math.exp(-dt*2));camPos.z=tmp.z;camPos.y=150;cam.position.copy(camPos);
 cam.up.set(Math.sin(bank*.04),0,-Math.cos(bank*.04));cam.lookAt(camPos.x,0,camPos.z);
 const sa=flyT/DAYLEN*Math.PI*2*.25;tmp.set(camPos.x,0,camPos.z);sun.position.copy(tmp).add(new THREE.Vector3(-38+Math.sin(sa)*6,90,-30));sun.target.position.copy(tmp);
 // chunk recycle
 const cur=Math.floor(-birdPos.z/CL);for(const ch of chunks){if(ch.idx<cur-1){buildChunk(ch,ch.idx+NCH);}}
 // dynamic objects
 let inCloud=false;
 for(const d of dynamic){const o=d.o;const dx=o.position.x-birdPos.x,dz=o.position.z-birdPos.z;const dd=dx*dx+dz*dz;
  if(d.type==='tree'){const near=dd<36&&birdPos.y-o.position.y<10;if(near&&d.sway<.5){d.sway=1.4;if(d.hasBirds){flush(o.position);d.hasBirds=false;}}
   d.sway*=1-dt*1.2;if(dd<2500){o.rotation.z=Math.sin(t*1.5+d.ph)*.03+Math.sin(t*9)*d.sway*.12;o.updateMatrix();const q=d.rec;q.tr.setMatrixAt(q.ti,o.matrix);q.top.setMatrixAt(q.pi,o.matrix);q.tr.instanceMatrix.needsUpdate=true;q.top.instanceMatrix.needsUpdate=true;}}
  else if(d.type==='animal'){if(dd>4900&&d.scared<=0){continue;}const near=dd<100&&birdPos.y-o.position.y<12;
   if(near&&d.scared<=0){d.scared=2.5;const l=Math.sqrt(dd)||1;d.vel.set(-dx/l,0,-dz/l).multiplyScalar(5);o.rotation.y=Math.atan2(-dx,-dz);}
   if(d.scared>0){d.scared-=dt;o.position.addScaledVector(d.vel,dt);d.vel.multiplyScalar(1-dt*.8);d.hop+=dt*14;
    o.position.y=height(o.position.x,o.position.z)+Math.abs(Math.sin(d.hop))*.6;d.head.position.y=.95;}
   else{d.head.position.y=.6+Math.sin(t*2+d.ph)*.1;o.position.y=height(o.position.x,o.position.z);}}
  else if(d.type==='house'){if(dd<50&&d.pop<=0){d.pop=1;burst(tmp.copy(o.position).add(new THREE.Vector3(0,3,0)),'#ffffff');}
   if(d.pop>0){d.pop-=dt*1.5;o.scale.set(d.base*(1+Math.sin(d.pop*12)*d.pop*.08),d.base*(1+Math.sin(d.pop*12+1)*d.pop*.12),d.base);}}
  else if(d.type==='spark'||d.type==='card'){
   if(!d.taken){const gs=o.children[o.children.length-1];const fd=Math.sqrt(dd);gs.material.opacity=.28;o.rotation.y+=dt*(d.type==='card'?1:3);o.scale.setScalar(1+Math.sin(t*5+o.position.z)*.15);o.position.y+=Math.sin(t*3+o.position.z)*.01;
    if(o.position.distanceTo(birdPos)<(d.type==='card'?2.6:2)){d.taken=true;
     if(d.type==='spark'){sparks++;burst(o.position,'#fff1a0');buzz(8);chime(1+sparks%6*.12);}else{cards++;burst(o.position,'#e8766b');burst(o.position,'#fff1a0');chime(.8);setTimeout(()=>chime(1.2),120);setTimeout(()=>chime(1.5),240);cardFlash();const bNow=biome(birdPos.z);let lockd=cardMsgs.map((_,i)=>i).filter(i=>!unlocked.has(i));const themed=lockd.filter(i=>cardMsgs[i][2]===bNow);const plain=lockd.filter(i=>cardMsgs[i][2]===undefined);lockd=themed.length?themed:plain.length?plain:lockd;const ci=lockd.length?lockd[Math.floor(Math.random()*lockd.length)]:Math.floor(Math.random()*cardMsgs.length);const isNew=!unlocked.has(ci);if(isNew)reveal(ci);else toast('✉ '+cardMsgs[ci][0]);buzz([20,40,20]);if(isNew){newCards.add(ci);SKINS.forEach(k=>{if(k.need&&unlocked.size+1===k.need)setTimeout(()=>toast('Yeni kostüm: '+k.n+'!'),1800);});}runCards.push(ci);unlocked.add(ci);localStorage.setItem('kk_cards',JSON.stringify([...unlocked]));{const tb=cardMsgs[ci][2];if(isNew&&tb!==undefined&&tabDone(tb)){const sk=SKINS.find(k=>k.tab===tb);setTimeout(()=>{toast(TABN[tb]+' albümü tamam! Yeni renk: '+sk.n+' 🎨');renderSkins();},4600);}}}}}
   else{d.t+=dt;o.scale.setScalar(Math.max(0,1-d.t*3));o.position.y+=dt*6;}
   if(d.im&&(dd<10000)&&(!d.taken||d.t<.5)){o.updateMatrix();d.im.setMatrixAt(d.ii,o.matrix);d.im.instanceMatrix.needsUpdate=true;}}
  else if(d.type==='boat'){if(dd<64&&d.rock<.3)d.rock=1;d.rock*=1-dt*.7;o.rotation.z=Math.sin(t*1.3+d.ph)*.05+Math.sin(t*5)*d.rock*.25;o.position.y=-1.5+Math.sin(t*1.1+d.ph)*.08;}
  else if(d.type==='wobble'){if(dd<49&&d.w<.3){d.w=1;burst(tmp.copy(o.position).add(new THREE.Vector3(0,1.5,0)),'#ffffff');}d.w*=1-dt*1.2;o.rotation.z=Math.sin(t*10)*d.w*.25;o.rotation.x=Math.cos(t*8)*d.w*.15;}
  else if(d.type==='flowers'){if(dd<36&&d.sway<.3)d.sway=1;d.sway*=1-dt;o.rotation.z=Math.sin(t*2+d.ph)*.05+Math.sin(t*9)*d.sway*.15;}
  else if(d.type==='gulls'){if(dd<120&&d.scat<.3){d.scat=1;}d.scat*=1-dt*.4;for(const q of d.gs){q.a+=dt*q.sp*(1+d.scat*2);const rr=q.rad+d.scat*10;q.m.position.set(Math.cos(q.a)*rr,Math.sin(q.a*2)*.6+d.scat*5,Math.sin(q.a)*rr);q.m.rotation.y=-q.a;const f=Math.sin(t*(8+d.scat*8)+q.a)*.6;q.m.userData.w[0].rotation.z=f;q.m.userData.w[1].rotation.z=-f;}}
  else if(d.type==='lighthouse'){d.piv.rotation.y=t*.6;beamMat.opacity=dusk*.18;if(!d.rew&&dusk>.3&&o.position.distanceTo(birdPos)<16){d.rew=true;sparks+=5;warmFlash();chime(.9);setTimeout(()=>chime(1.35),140);setTimeout(()=>chime(1.8),280);for(let i=0;i<3;i++)burst(tmp.copy(o.position).add(new THREE.Vector3(0,6.6,0)),'#ffd27a');toast('Fener ışığında süzüldün! +5 ✦');}d.lamp.material.opacity=(.35+dusk*.6)*(.6+Math.sin(t*2)*.4);d.lamp.scale.setScalar(5+dusk*5);}
  else if(d.type==='mill'){d.sp+=((dd<150?6:1)-d.sp)*dt;d.hub.rotation.z+=d.sp*dt;}
  else if(d.type==='balloon'){if(o.position.distanceTo(birdPos)<5.5&&d.push<.3){d.push=1;chime(.7);loftT=1.2;toast('Balon seni yukarı itti! 🎈');}d.push*=1-dt*.8;o.position.y=d.y0+Math.sin(t*.7+d.ph)*.8+d.push*2;o.rotation.z=Math.sin(t*.9+d.ph)*.05+Math.sin(t*6)*d.push*.1;}
  else if(d.type==='cloud'){o.position.x+=dt*1.2;const dy=birdPos.y-o.position.y;if(dd<30&&Math.abs(dy)<3)inCloud=true;}}
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
 if(toastT>0){toastT-=dt;if(toastT<=0)$('toast').style.opacity=0;}
 $('dist').textContent=Math.floor(dist)+' m';$('coll').textContent='✦ '+sparks;$('post').textContent='✉ '+cards;
 renderer.render(scene,cam);}
addEventListener('resize',()=>{renderer.setSize(innerWidth,innerHeight);orthoFit();});
frame();window.__game={birdPos,get sparks(){return sparks}};
