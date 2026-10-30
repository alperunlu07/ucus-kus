import * as THREE from 'three';
const SET=Object.assign({vol:.8,sens:1,ghost:true,fastDay:false,invY:false},JSON.parse(localStorage.getItem('kk_set')||'{}'));
const saveSet=()=>localStorage.setItem('kk_set',JSON.stringify(SET));
const TODAY=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Istanbul'}).format(new Date());
const SEED=[...TODAY].reduce((h,c)=>(h*31+c.charCodeAt(0))%1000003,7);const DAYNUM=Math.floor(Date.parse(TODAY)/864e5);
// ---------- noise ----------
function hash(x,z){const s=Math.sin(x*127.1+z*311.7)*43758.5453;return s-Math.floor(s);}
function vnoise(x,z){const xi=Math.floor(x),zi=Math.floor(z),xf=x-xi,zf=z-zi;const u=xf*xf*(3-2*xf),v=zf*zf*(3-2*zf);
 const a=hash(xi,zi),b=hash(xi+1,zi),c=hash(xi,zi+1),d=hash(xi+1,zi+1);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;}
function fbm(x,z){return vnoise(x,z)*.55+vnoise(x*2.1,z*2.1)*.28+vnoise(x*4.3,z*4.3)*.17;}
const riverX=z=>Math.sin(z*0.012)*18+Math.sin(z*0.031)*6;
function height(x,z){const dx=x-riverX(z);const side=Math.max(0,Math.abs(dx)-14);
 let h=fbm(x*.03,z*.03)*7+Math.pow(side/22,2)*9+fbm(x*.08,z*.08)*side*.08;
 const riv=Math.max(0,1-Math.abs(dx)/6);h-=riv*riv*3.2;const q=biomeAt(z);const sea=SEA[q.a]*(1-q.k)+SEA[q.b]*q.k;
 const des=(q.a==4?1-q.k:0)+(q.b==4?q.k:0);if(des>0){h+=des*(Math.sin(x*.12+z*.05)*1.6+Math.sin(z*.09-x*.03)*1.1+1.5);}
 if(sea>0){const cx=dx<0?Math.max(0,-dx-4):0;h-=sea*(3+cx*.25);}return h;}
const BL=420;function biomeAt(z){const p=((-z/BL)%6+6)%6;const i=Math.floor(p),f=p-i;const k=THREE.MathUtils.smoothstep(f,.8,1);return {a:i,b:(i+1)%6,k};}
const biome=z=>{const q=biomeAt(z);return q.k>.5?q.b:q.a;};
const C=(h)=>new THREE.Color(h);
const pal=[{g1:C('#a8d58a'),g2:C('#7cc08a'),tree:[C('#6fbf73'),C('#8fd18a'),C('#f2a7c3')]},
           {g1:C('#e8c98a'),g2:C('#d7a86e'),tree:[C('#f0a35e'),C('#e5c45a'),C('#d9785a')]},
           {g1:C('#eef3f6'),g2:C('#d6e2ea'),tree:[C('#5f9c86'),C('#7fb5a2'),C('#e9f2f2')]},
           {g1:C('#bfe0a0'),g2:C('#f1e3b6'),tree:[C('#7cc49a'),C('#9ad47e'),C('#f6c28b')]},
           {g1:C('#f4d9a6'),g2:C('#eabf86'),tree:[C('#8fbf7a'),C('#a5c98a'),C('#f2a7c3')]},
           {g1:C('#8cc48a'),g2:C('#6aa982'),tree:[C('#4f9a72'),C('#68b07a'),C('#86c27e')]}];
const SEA=[0,0,0,1,0,0];
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
const hemi=new THREE.HemisphereLight('#fff4e0','#9fb08a',1.6);scene.add(hemi);
const DAY=[{sky:C('#f6e6cf'),sun:C('#fff1d6'),si:2.2,hi:1.6,hs:C('#fff4e0')},{sky:C('#e4eef0'),sun:C('#ffffff'),si:2.5,hi:1.7,hs:C('#f4fbff')},{sky:C('#f8d2a0'),sun:C('#ffc98a'),si:2.0,hi:1.4,hs:C('#ffe2bd')},{sky:C('#d6a6bf'),sun:C('#f4a1a0'),si:1.1,hi:1.05,hs:C('#d9c2e8')}];
const DAYLEN=300;let dusk=0;
function dayCycle(tt){const p=(tt/DAYLEN*4)%4,i=Math.floor(p),f=THREE.MathUtils.smoothstep(p-i,.6,1),a=DAY[i],b=DAY[(i+1)%4];
 SKY.copy(a.sky).lerp(b.sky,f);scene.fog.color.copy(SKY);sun.color.copy(a.sun).lerp(b.sun,f);sun.intensity=a.si+(b.si-a.si)*f;hemi.intensity=a.hi+(b.hi-a.hi)*f;hemi.color.copy(a.hs).lerp(b.hs,f);
 dusk=(i===3?1-f:0)+(i===2?f:0);document.body.style.background='#'+SKY.getHexString();}
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
 spark:new THREE.OctahedronGeometry(.6,0),card:new THREE.BoxGeometry(1.6,1.1,.08),cloud:new THREE.IcosahedronGeometry(1,1),beam:new THREE.ConeGeometry(3,18,16,1,true),cap:new THREE.SphereGeometry(.5,7,4,0,Math.PI*2,0,Math.PI/2),fern:new THREE.ConeGeometry(.35,1,4),cact:new THREE.CylinderGeometry(.3,.35,2.2,6),lhSeg:new THREE.CylinderGeometry(.75,.9,1.6,8),mill:new THREE.CylinderGeometry(.7,1.1,4,6),blade:new THREE.BoxGeometry(.35,2.6,.06),arch:new THREE.BoxGeometry(18,.35,2.2),balloon:new THREE.IcosahedronGeometry(2,1),gw:new THREE.BoxGeometry(.7,.04,.18),gb:new THREE.IcosahedronGeometry(.18,0),sail:new THREE.ConeGeometry(.7,1.8,3),snowB:new THREE.IcosahedronGeometry(.6,1),nose:new THREE.ConeGeometry(.08,.35,4),flower:new THREE.IcosahedronGeometry(.18,0),leaf:new THREE.CircleGeometry(.35,5)};
G.trunk.translate(0,.5,0);G.fern.translate(0,.5,0);G.cact.translate(0,1.1,0);G.mill.translate(0,2,0);G.blade.translate(0,1.3,0);G.gw.translate(.35,0,0);G.cone.translate(0,1.2+.8,0);G.ball.translate(0,1.8,0);G.box.translate(0,.5,0);
const M={trunk:lam('#9a7458'),wall:lam('#fbf3e4'),roofs:['#e07a5f','#7aa6c2','#e9b35d'].map(lam),wool:lam('#fffaf2'),dark:lam('#4a3f39'),
 cow:lam('#f2e6d6'),cact:lam('#7fb685'),sandrock:lam('#e0a979'),inst:lam('#ffffff'),rock:lam('#b9b2a8'),fl1:lam('#f7b2c8'),fl2:lam('#fff0a0'),fox:lam('#ef8f4a'),
 spark:new THREE.MeshBasicMaterial({color:'#fff3a8'}),card:new THREE.MeshLambertMaterial({color:'#fffdf6'}),stamp:new THREE.MeshBasicMaterial({color:'#e8766b'}),
 cloud:new THREE.MeshLambertMaterial({color:'#ffffff',transparent:true,opacity:.92,flatShading:true})};
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
 const p=geo.attributes.position,cols=new Float32Array(p.count*3),col=new THREE.Color();
 for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i)+z0-CL/2;const h=height(x,z);p.setY(i,h);p.setZ(i,z);
  groundColor(x,z,h,col);cols.set([col.r,col.g,col.b],i*3);}
 geo.setAttribute('color',new THREE.BufferAttribute(cols,3));geo.computeVertexNormals();
 const ng=geo.toNonIndexed();ng.userData.own=true;geo.dispose();ng.computeVertexNormals();
 const mesh=new THREE.Mesh(ng,groundMat);mesh.receiveShadow=true;g.add(mesh);
 // water plane
 const wgeo=new THREE.PlaneGeometry(CW,CL,30,12);wgeo.rotateX(-Math.PI/2);
 const water=new THREE.Mesh(wgeo,waterMat);water.position.set(0,-1.35,z0-CL/2);g.add(water);
 const r=rnd((idx*9301+49297+SEED*7919)%2147483646+1);
 // trees
 const SP=[];const mkSpark=()=>{const o=new THREE.Group();SP.push(o);return o;};
 const TB=[];const addTree=(x,h,z,sx,sy,ry,kind,col,birds)=>{const o=new THREE.Object3D();o.position.set(x,h,z);o.scale.set(sx,sy,sx);o.rotation.y=ry;o.updateMatrix();const rec={o,kind,col};TB.push(rec);
  dynamic.push({type:'tree',o,rec,chunk:ch,ph:r()*6,sway:0,hasBirds:birds});};
 const forest=biome(z0-30)===5;
 for(let i=0;i<(forest?150:70);i++){const x=(r()-.5)*CW*.9,z=z0-r()*CL;const h=height(x,z);if(h<-.2||h>12)continue;
  if(Math.abs(x-riverX(z))<7&&r()<.7)continue;
  if(biome(z)===4){if(r()<.8)continue;const cc=new THREE.Group();const cb=new THREE.Mesh(G.cact,M.cact);cb.castShadow=true;cc.add(cb);for(const sd of[-1,1])if(r()<.7){const arm=new THREE.Mesh(G.cact,M.cact);arm.scale.set(.6,.4,.6);arm.position.set(sd*.45,.9+r()*.5,0);cc.add(arm);}cc.position.set(x,h,z);cc.scale.setScalar(.8+r()*.6);g.add(cc);dynamic.push({type:'wobble',o:cc,chunk:ch,w:0});continue;}
  const bz=biome(z);const s=.7+r()*.8;const col=pal[bz].tree[Math.floor(r()*3)];const tall=bz===5?1.3+r()*.9:1;
  addTree(x,h,z,s,s*tall,r()*6,(bz===5?r()<.7:r()<.5)?1:2,col,r()<.25);}
 // village
 for(let vc=0;vc<2;vc++)if(r()<(vc?.45:.85)){const vx=riverX(z0-30)+(r()<.5?-1:1)*(16+r()*10),vz=z0-15-r()*30;
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
   else if(h>-.4&&h<.6&&r()<.15){const pier=new THREE.Group();const dk=new THREE.Mesh(G.box,M.trunk);dk.scale.set(7,.25,1.4);dk.position.x=3.5;pier.add(dk);for(const px of[1.5,4,6.5]){const pl=new THREE.Mesh(G.trunk,M.trunk);pl.position.set(px,-1.5,.6);pl.scale.set(.6,1.6,.6);pier.add(pl);}const dir=Math.sign(riverX(z)-x)||1;pier.rotation.y=dir>0?0:Math.PI;pier.position.set(x,-.7,z);dk.castShadow=true;g.add(pier);}}
  else if(h<-.3||h>12)continue;
  else if(bi===2){if(r()<.6){const sm=new THREE.Group();const b1=new THREE.Mesh(G.snowB,M.wool),b2=new THREE.Mesh(G.snowB,M.wool),nose=new THREE.Mesh(G.nose,M.fox);
    b1.position.y=.6;b2.position.y=1.45;b2.scale.setScalar(.65);nose.position.set(0,1.5,.42);nose.rotation.x=Math.PI/2;b1.castShadow=b2.castShadow=true;sm.add(b1,b2,nose);sm.position.set(x,h,z);sm.rotation.y=r()*6;g.add(sm);dynamic.push({type:'wobble',o:sm,chunk:ch,w:0});}
   else addTree(x,h,z,.7,1+r()*.6,r()*6,1,pal[2].tree[Math.floor(r()*2)],false);}
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
   br.position.set(bx,Math.max(height(bx-8,bz),height(bx+8,bz),-1)-.3,bz);br.rotation.y=Math.atan(Math.cos(bz*.012)*18*.012+Math.cos(bz*.031)*6*.031);g.add(br);}
 // wow set piece every ~800m: hot-air balloons + sparkle ring
 if(idx>0&&idx%13===0){const cz=z0-30,cx=riverX(cz);for(let i=0;i<5;i++){const bl=new THREE.Group();const env=new THREE.Mesh(G.balloon,[M.roofs[0],M.roofs[1],M.roofs[2],M.fl1,M.fl2][i]);env.scale.set(1,1.2,1);
   const bs=new THREE.Mesh(G.box,M.trunk);bs.scale.set(.7,.5,.7);bs.position.y=-2.6;env.castShadow=true;bl.add(env,bs);bl.position.set(cx+(i-2)*9,height(cx,cz)+12+r()*8,cz-r()*20);g.add(bl);dynamic.push({type:'balloon',o:bl,chunk:ch,ph:r()*6,y0:bl.position.y,push:0});}
  const ry=Math.max(height(cx,cz),0)+10;for(let i=0;i<12;i++){const a=i/12*Math.PI*2;const sp=mkSpark();const gl=new THREE.Sprite(glowMat.clone());gl.scale.setScalar(3.2);sp.add(gl);sp.position.set(cx+Math.cos(a)*4,ry+Math.sin(a)*4,cz);g.add(sp);dynamic.push({type:'spark',o:sp,chunk:ch,taken:false,t:0});}
  ch.wow=true;}else ch.wow=false;
 // sparkles (trail line)
 const sx=(r()-.5)*40,sz=z0-10-r()*30;const sy=height(sx,sz)+5+r()*8;const dir=(r()-.5)*.6;
 for(let i=0;i<6;i++){const s=mkSpark();const gl=new THREE.Sprite(glowMat.clone());gl.scale.setScalar(3.2);s.add(gl);s.position.set(sx+i*dir*6,sy+Math.sin(i*.8)*1.5,sz-i*4);g.add(s);
  dynamic.push({type:'spark',o:s,chunk:ch,taken:false,t:0});}
 // postcard
 if(r()<.45){const x=(r()-.5)*50,z=z0-r()*CL;const c=new THREE.Group();const card=new THREE.Mesh(G.card,M.card);
  const st=new THREE.Mesh(new THREE.PlaneGeometry(.35,.4),M.stamp);st.position.set(.5,.25,.05);const gl2=new THREE.Sprite(glowMat.clone());gl2.scale.setScalar(4.5);c.add(card,st,gl2);
  c.position.set(x,Math.max(height(x,z),0)+7+r()*6,z);g.add(c);dynamic.push({type:'card',o:c,chunk:ch,taken:false,t:0});}
 // clouds
 for(let i=0;i<2;i++){const cl=new THREE.Group();const x=(r()-.5)*90,z=z0-r()*CL,y=17+r()*8;
  for(let j=0;j<5;j++){const m=new THREE.Mesh(G.cloud,M.cloud);m.position.set((j-2)*1.8+r(),r()*1.2,(r()-.5)*2);m.scale.setScalar(1.6+r()*1.6);cl.add(m);}
  cl.position.set(x,y,z);g.add(cl);dynamic.push({type:'cloud',o:cl,chunk:ch,ph:r()*6});}
 if(SP.length){const im=new THREE.InstancedMesh(G.spark,M.spark,SP.length);im.frustumCulled=false;g.add(im);let k=0;for(const d of dynamic)if(d.chunk===ch&&d.type==='spark'){d.im=im;d.ii=k;d.o.updateMatrix();im.setMatrixAt(k++,d.o.matrix);}im.count=k;}
 scene.add(g);}
function makeGull(){const b=new THREE.Group();const bd=new THREE.Mesh(G.gb,M.wool);bd.scale.set(1,.8,2);const l=new THREE.Mesh(G.gw,M.wool),r2=new THREE.Mesh(G.gw,M.wool);r2.scale.x=-1;b.add(bd,l,r2);b.userData.w=[l,r2];return b;}
const waterMat=cloudify(new THREE.MeshLambertMaterial({color:'#9fdbe6',transparent:true,opacity:.78,flatShading:true}));
{const ob=waterMat.onBeforeCompile;waterMat.onBeforeCompile=sh=>{ob(sh);sh.vertexShader=sh.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
 {vec4 wp=modelMatrix*vec4(transformed,1.);transformed.y+=sin(wp.x*.35+uTime*1.6)*.12+sin(wp.z*.27-uTime*1.2)*.12;}`).replace('#include <common>','#include <common>\nuniform float uTime;');
 sh.fragmentShader=sh.fragmentShader.replace('gl_FragColor.rgb*=1.-cs*.22;','gl_FragColor.rgb*=1.-cs*.22;float fo=smoothstep(.82,1.,sin(vW.x*.5+vW.z*.3+uTime*1.4)*.5+.5);gl_FragColor.rgb=mix(gl_FragColor.rgb,vec3(1.),fo*.35);');};}
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
let loftT=0,boostT=0,boostCd=0;const baseFov=innerWidth<innerHeight?62:50;function boost(){if(boostT>0)return;boostT=1.2;toast('Hızlan!');whoosh();for(let i=0;i<6;i++)burst(birdPos,'#ffffff');}
let sIx=0,sIy=0;const tilt={x:0,y:0,on:false};let tx=0,ty=0,active=false,sx=0,sy=0,bx=0,by=0;
const el=renderer.domElement;
let lastTap=0;function down(x,y){const nt=performance.now();if(running&&nt-lastTap<300)boost();lastTap=nt;if(AC&&AC.state!=='running')AC.resume();active=true;sx=x;sy=y;bx=tx;by=ty;hideHint();}
function move(x,y){if(!active)return;const s=Math.min(innerWidth,innerHeight)*.28/SET.sens;tx=THREE.MathUtils.clamp(bx+(x-sx)/s,-1,1);ty=THREE.MathUtils.clamp(by-(SET.invY?-1:1)*(y-sy)/s,-1,1);}
function up(){active=false;}
el.addEventListener('pointerdown',e=>{if(e.isPrimary===false){boost();return;}el.setPointerCapture(e.pointerId);down(e.clientX,e.clientY);});
el.addEventListener('pointermove',e=>move(e.clientX,e.clientY));
el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);
const keys={};addEventListener('keydown',e=>keys[e.key]=1);addEventListener('keyup',e=>keys[e.key]=0);
document.addEventListener('touchmove',e=>e.preventDefault(),{passive:false});
let hinted=false;function hideHint(){if(!hinted){hinted=true;setTimeout(()=>document.getElementById('hint').style.opacity=0,1800);}}
// ---------- UI ----------
let dist=0,sparks=0,cards=0,running=false;const $=id=>document.getElementById(id);
let toastT=0;function toast(s){const t=$('toast');t.textContent=s;t.style.opacity=1;toastT=1.6;}
const cardMsgs=[
['Vadi Sabahı','Selamlar vadiden! Sis daha kalkmadı, koyunlar hâlâ uykulu.'],['Köy Fırını','Burası mis gibi ekmek kokuyor. Bacadan çıkan duman bize el sallıyor.'],
['Nehir Pikniği','Nehir kenarında piknik; köprünün altından kayıklar geçiyor.'],['Bulut Geçidi','Bulutların arasından geçtik, tüylerim pamuk gibi oldu.'],
['Sonbahar Rüzgârı','Sonbahar geldi! Yapraklar turuncu bir halı gibi.'],['Kardan Adamlar','Karlı tepede kardan adamlar el sallıyor, burunları havuçtan.'],
['İskele','İskelede gün batımı. Martılar akşam yemeğini arıyor.'],['Çiçek Tarlası','Bahar tarlasında arılar ve pembe çiçekler.'],
['Martı Selamı','Martılar selam söylüyor; deniz tuzlu, rüzgâr serin.'],['Zirve','Dağların zirvesinden bütün dünya bir oyuncak gibi görünüyor.'],
['Yel Değirmeni','Değirmenin kanatları biz geçince hızlandı!'],['Deniz Feneri','Fener ışığı gece yolunu kaybedenlere göz kırpıyor.'],
['Balon Festivali','Gökyüzü rengârenk balonlarla doldu; hepsi bize yol verdi.'],['Ay Işığı','Uzun bir yolculuk; bir gün ayı da ziyaret edeceğiz.'],
['Orman Fısıltısı','Çamların arasında mantarlar bize göz kırptı.',5],['Ateş Böcekleri','Ormanda akşam: minik fenerler etrafımızda dans ediyor.',5],
['Kum Tepeleri','Çölde kaktüsler sıcaktan şapka istiyor.',4],['Serap','Ufukta bir göl gördük… yoksa serap mıydı?',4],
['Kar Tanesi','Her kar tanesi farklıymış; biri gagama kondu.',2],['Deniz Kabuğu','Sahilde dalgalar bize bir kabuk bıraktı.',3]];
$('go').onclick=()=>{initAudio();runZ0=birdPos.z;placeGhost();runT=0;recPath=[];if(!localStorage.getItem('kk_tut'))showTut();$('start').style.display='none';running=true;try{document.documentElement.requestFullscreen?.().catch(()=>{});}catch(e){}};
// ---------- loop ----------
const trailMat=new THREE.SpriteMaterial({map:glowTex,color:'#ffffff',transparent:true,opacity:.35,depthWrite:false});
const pts=[];const snowM=new THREE.MeshBasicMaterial({color:'#ffffff'}),leafM=['#f0a35e','#e5c45a','#d9785a'].map(c=>new THREE.MeshBasicMaterial({color:c,side:THREE.DoubleSide}));const ptG=new THREE.PlaneGeometry(.22,.22);
for(let i=0;i<70;i++){const p=new THREE.Mesh(ptG,snowM);p.visible=false;p.userData.t=0;scene.add(p);pts.push(p);}let ptI=0,ptT=0;
const trail=[];for(let i=0;i<40;i++){const p=new THREE.Sprite(trailMat);p.visible=false;p.userData.t=0;scene.add(p);trail.push(p);}let qMode=localStorage.getItem('kk_q')||'auto',lowSec=0;
function setQ(low){lowQ=low;renderer.setPixelRatio(low?1:Math.min(devicePixelRatio,2));sun.castShadow=!low;renderer.shadowMap.enabled=!low;scene.traverse(o=>{if(o.material)o.material.needsUpdate=true;});document.getElementById('qual').textContent=low?'◐':'✨';}
let trailI=0,trailT=0,fpsAcc=0,fpsN=0,lowQ=false;
let best=+localStorage.getItem('kk_best')||0;$('best').textContent=best?('En iyi: '+Math.floor(best)+' m'):'';
addEventListener('pagehide',()=>{localStorage.setItem('kk_best',Math.floor(best));if(newBestRun)savePath();});
// audio
let MASTER=null;let AC=null,muted=localStorage.getItem('kk_mute')==='1',windG=null,windF=null,lastFlap=0;
function initAudio(){if(AC)return;AC=new (window.AudioContext||window.webkitAudioContext)();MASTER=AC.createGain();MASTER.gain.value=SET.vol;MASTER.connect(AC.destination);const n=AC.sampleRate*2,buf=AC.createBuffer(1,n,AC.sampleRate),d=buf.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;
 const src=AC.createBufferSource();src.buffer=buf;src.loop=true;windF=AC.createBiquadFilter();windF.type='bandpass';windF.frequency.value=500;windF.Q.value=.7;windG=AC.createGain();windG.gain.value=0;
 src.connect(windF).connect(windG).connect(MASTER);src.start();window.__noise=buf;}
let bedS=null,bedF=null,bedG=null,padG=null,padO=[];
function initBeds(){const s2=AC.createBufferSource();s2.buffer=window.__noise;s2.loop=true;bedF=AC.createBiquadFilter();bedG=AC.createGain();bedG.gain.value=0;s2.connect(bedF).connect(bedG).connect(MASTER);s2.start(0,.7);
 padG=AC.createGain();padG.gain.value=0;const lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.value=700;padG.connect(lp).connect(MASTER);for(const f of[196,246.9,293.7]){const o=AC.createOscillator();o.type='triangle';o.frequency.value=f;o.detune.value=(Math.random()-.5)*10;o.connect(padG);o.start();padO.push(o);}}
function beds(){if(!bedG)initBeds();const n=AC.currentTime,b=biome(birdPos.z);let gv=0,ft='bandpass',fq=800,q=.8;
 if(b===5){gv=.035*(.6+.4*Math.sin(t*1.7)*Math.sin(t*.6));ft='highpass';fq=3200;}else if(b===3){gv=.06*(.5+.5*Math.sin(t*.9));ft='lowpass';fq=380;}else if(b===4){gv=.03;ft='bandpass';fq=1500;q=2;}
 bedF.type=ft;bedF.frequency.setTargetAtTime(fq,n,.5);bedF.Q.value=q;bedG.gain.setTargetAtTime(muted?0:gv*(1-dusk*.4),n,.6);padG.gain.setTargetAtTime(muted?0:dusk*.012,n,1.5);}
function wind(spd,vy){if(!AC)return;beds();const g=muted?0:(.04+Math.min(.05,Math.abs(vy)*.01))*(1-dusk*.35);windG.gain.setTargetAtTime(g,AC.currentTime,.3);windF.frequency.setTargetAtTime(400+Math.abs(vy)*80,AC.currentTime,.3);
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
$('qual').onclick=()=>{qMode=lowQ?'high':'low';localStorage.setItem('kk_q',qMode);setQ(qMode==='low');};if(qMode==='low')setQ(true);
// album
const unlocked=new Set(JSON.parse(localStorage.getItem('kk_cards')||'[]'));const runCards=[];const newCards=new Set();
function openAlbum(){const l=$('albumList');l.innerHTML='';cardMsgs.forEach((m,i)=>{const d=document.createElement('div');const got=unlocked.has(i);d.className='ac'+(got?'':' lock');
 d.innerHTML=got?('<b>✉ '+m[0]+(newCards.has(i)?' <span class="stamp">YENİ</span>':'')+'</b><span>'+m[1]+'</span>'+(runCards.includes(i)?'<small>bu uçuşta</small>':'')):'<b>? ? ?</b><small>henüz bulunmadı</small>';l.appendChild(d);});
 $('albumCount').textContent=unlocked.size+' / '+cardMsgs.length+' kartpostal · bu uçuşta '+runCards.length;$('album').style.display='flex';}
$('albumBtn').onclick=$('albumBtn2').onclick=e=>{e.stopPropagation();openAlbum();};$('albumClose').onclick=()=>$('album').style.display='none';
const goals=[{t:'5 parıltı topla',ok:()=>sparks>=5},{t:'500 m uç',ok:()=>dist>=500},{t:'1 kartpostal bul',ok:()=>cards>=1},{t:'Karlı tepelere ulaş',ok:()=>biome(birdPos.z)===2},
 {t:'Çift dokun: hızlan',ok:()=>boostT>0},{t:'20 parıltı topla',ok:()=>sparks>=20},{t:'Sahile ulaş',ok:()=>biome(birdPos.z)===3},{t:'3 kartpostal bul',ok:()=>cards>=3},{t:'Balon festivalini bul',ok:()=>wowSeen},{t:'2000 m uç',ok:()=>dist>=2000}];
const doneG=new Set(JSON.parse(localStorage.getItem('kk_goals')||'[]'));const DQ=[{t:'Bugün 20 parıltı topla',ok:()=>sparks>=20},{t:'Bugün sahile ulaş',ok:()=>biome(birdPos.z)===3},{t:'Bugün 2 kartpostal bul',ok:()=>cards>=2},{t:'Bugün 1500 m uç',ok:()=>dist>=1500},{t:'Bugün ormana ulaş',ok:()=>biome(birdPos.z)===5},{t:'Bugün çöle ulaş',ok:()=>biome(birdPos.z)===4}];
const dq=DQ[((DAYNUM%DQ.length)+DQ.length)%DQ.length];let dqDone=localStorage.getItem('kk_daily')===TODAY;
document.getElementById('daily').innerHTML='Bugünün dünyası · '+TODAY.split('-').reverse().join('.')+'<br>🌞 '+dq.t+(dqDone?' ✓':'');
function checkDaily(){if(!dqDone&&dq.ok()){dqDone=true;localStorage.setItem('kk_daily',TODAY);setTimeout(()=>{toast('Günlük görev tamam! 🌞 +10 ✦');sparks+=10;chime(1);setTimeout(()=>chime(1.5),150);setTimeout(()=>chime(2),300);for(let i=0;i<4;i++)burst(birdPos,'#ffd27a');},2000);}}
let gi=0,wowSeen=false;const nextG=()=>{gi=0;while(gi<goals.length&&doneG.has(gi))gi++;};nextG();function showGoal(){$('goal').textContent=gi<goals.length?'🎯 '+goals[gi].t:'🎯 Keşfetmeye devam!';}showGoal();
function checkGoal(){if(gi<goals.length&&goals[gi].ok()){toast('Hedef tamam: '+goals[gi].t+' ✦');for(let i=0;i<3;i++)burst(birdPos,['#fff1a0','#e8766b','#9fdbe6'][i]);chime(1);setTimeout(()=>chime(1.33),130);setTimeout(()=>chime(1.6),260);sparks+=3;doneG.add(gi);goalsRun++;localStorage.setItem('kk_goals',JSON.stringify([...doneG]));nextG();setTimeout(showGoal,1600);}}
let flyT=0,sumShown=false,goalsRun=0;
function showSummary(auto){const prevBest=+localStorage.getItem('kk_best')||0;localStorage.setItem('kk_best',Math.floor(best));
 $('sumTitle').textContent=auto?'2000 m! Harika uçuş':'Konaklama molası';
 $('sumBody').innerHTML='<div>Mesafe <b>'+Math.floor(dist)+' m</b></div><div>Parıltı <b>✦ '+sparks+'</b></div><div>Kartpostal <b>✉ '+cards+'</b></div><div>Hedef <b>🎯 '+goalsRun+'</b></div><div>En iyi <b>'+Math.floor(best)+' m</b>'+(dist>=prevBest-1&&dist>50?' <span class="stamp">REKOR</span>':'')+'</div>'+
 '<ul class="gl">'+goals.map((g,i)=>'<li>'+(doneG.has(i)?'<b style="color:#6fbf73">✓</b>':'○')+' '+g.t+'</li>').join('')+'</ul>';$('summary').style.display='flex';}
$('stop').onclick=()=>showSummary(false);$('sumGo').onclick=()=>{$('summary').style.display='none';dist=0;sparks=0;cards=0;goalsRun=0;runCards.length=0;sumShown=false;boostT=0;birdPos.y+=3;toast('Yeni uçuş!');if(newBestRun){savePath();gPath=recPath;}newBestRun=false;recPath=[];runT=0;runZ0=birdPos.z;placeGhost();};
$('share').onclick=async()=>{const txt='Kağıt Kuş ile '+Math.floor(dist)+' m uçtum! ✦ '+sparks+' parıltı, ✉ '+cards+' kartpostal topladım. En iyi: '+Math.floor(best)+' m 🕊️ '+location.href;
 try{if(navigator.share){await navigator.share({text:txt});return;}await navigator.clipboard.writeText(txt);toast('Panoya kopyalandı ✓');}catch(e){toast('Paylaşılamadı');}};
$('sumCont').onclick=()=>$('summary').style.display='none';
function syncSet(){$('sVol').value=SET.vol;$('sSens').value=SET.sens;$('sGhost').checked=SET.ghost;$('sFast').checked=SET.fastDay;$('sInv').checked=SET.invY;}
$('setBtn').onclick=e=>{e.stopPropagation();syncSet();$('settings').style.display='flex';};$('setClose').onclick=()=>$('settings').style.display='none';
$('sVol').oninput=e=>{SET.vol=+e.target.value;if(MASTER)MASTER.gain.value=SET.vol;saveSet();};$('sSens').oninput=e=>{SET.sens=+e.target.value;saveSet();};
$('sGhost').onchange=e=>{SET.ghost=e.target.checked;saveSet();};$('sFast').onchange=e=>{SET.fastDay=e.target.checked;saveSet();};$('sInv').onchange=e=>{SET.invY=e.target.checked;saveSet();};
$('menuBtn').onclick=e=>{e.stopPropagation();const m=$('menu');m.classList.toggle('open');$('menuBtn').textContent=m.classList.contains('open')?'✕':'☰';};
$('boostBtn').onclick=e=>{e.stopPropagation();initAudio();boost();};
// costumes
const SKINS=[{n:'Kağıt',b:'#fdf6ea',w:'#f6c28b',need:0},{n:'Gün Batımı',b:'#ffd9c2',w:'#e8766b',need:3},{n:'Gece Mavisi',b:'#cfe0f5',w:'#5f7fb8',need:7}];
let skin=+localStorage.getItem('kk_skin')||0;const scarf=new THREE.Mesh(new THREE.TorusGeometry(.38,.1,5,10),lam('#e8766b'));scarf.rotation.x=Math.PI/2.4;scarf.position.set(0,.18,-.62);const tailS=new THREE.Mesh(new THREE.BoxGeometry(.14,.05,.5),scarf.material);tailS.position.set(.18,.1,-.25);tailS.rotation.y=.4;
const hat=new THREE.Group();{const brim=new THREE.Mesh(new THREE.CylinderGeometry(.32,.32,.05,8),lam('#3d4f7a'));const top2=new THREE.Mesh(new THREE.ConeGeometry(.2,.42,6),brim.material);top2.position.y=.22;const crest=new THREE.Mesh(new THREE.OctahedronGeometry(.08),lam('#ffe27a'));crest.position.y=.46;hat.add(brim,top2,crest);hat.position.set(0,.76,-.72);hat.rotation.x=-.2;}
bird.add(scarf,tailS,hat);
function applySkin(i){if(unlocked.size<SKINS[i].need)return;scarf.visible=tailS.visible=i===1;hat.visible=i===2;skin=i;localStorage.setItem('kk_skin',i);bMat.color.set(SKINS[i].b);wMat.color.set(SKINS[i].w);renderSkins();}
function renderSkins(){const el=$('skins');el.innerHTML='';SKINS.forEach((s2,i)=>{const b=document.createElement('button');const lk=unlocked.size<s2.need;b.className='sk'+(i===skin?' on':'')+(lk?' lk':'');
 b.innerHTML='<i style="background:'+s2.b+';border-color:'+s2.w+'"></i>'+(lk?'🔒 '+s2.need+' ✉':s2.n);b.onclick=e=>{e.stopPropagation();applySkin(i);};el.appendChild(b);});}
if(unlocked.size<SKINS[skin].need)skin=0;applySkin(skin);
const ffMat=new THREE.SpriteMaterial({map:glowTex,color:'#e9ff9a',blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,opacity:0});
const ffs=[];for(let i=0;i<50;i++){const f=new THREE.Sprite(ffMat);f.scale.setScalar(.9);f.userData={ph:Math.random()*6,off:new THREE.Vector3((Math.random()-.5)*50,Math.random()*8,-Math.random()*50)};scene.add(f);ffs.push(f);}
const stG=new THREE.BufferGeometry();{const a=[];for(let i=0;i<400;i++){const v=new THREE.Vector3().randomDirection();v.y=Math.abs(v.y)*.8+.1;v.normalize().multiplyScalar(240);a.push(v.x,v.y,v.z);}stG.setAttribute('position',new THREE.Float32BufferAttribute(a,3));}
const stM=new THREE.PointsMaterial({color:'#fffbe8',size:1.6,sizeAttenuation:false,transparent:true,opacity:0,fog:false,depthWrite:false});const stars=new THREE.Points(stG,stM);scene.add(stars);
cam.far=520;cam.updateProjectionMatrix();
const moon=new THREE.Group();{const md=new THREE.Mesh(new THREE.CircleGeometry(7,24),new THREE.MeshBasicMaterial({color:'#fff8e6',transparent:true,opacity:0,fog:false,depthWrite:false}));const mg=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:'#fff1d0',transparent:true,opacity:0,fog:false,depthWrite:false}));mg.scale.setScalar(45);moon.add(mg,md);moon.userData={md,mg};scene.add(moon);}
function nightFx(){moon.visible=dusk>.02;moon.position.copy(cam.position).add(tmp.set(-90,110,-200));moon.lookAt(cam.position);moon.userData.md.material.opacity=dusk;moon.userData.mg.material.opacity=dusk*.5;const fb=biome(birdPos.z)===5?1:.3;ffMat.opacity=dusk*fb*.9;stM.opacity=dusk*.85;stars.position.copy(cam.position);stars.visible=dusk>.02;
 for(const f of ffs){f.visible=dusk>.05;if(!f.visible)continue;const u=f.userData;let p=f.position.copy(birdPos).add(u.off);u.off.z+=0;
  if(u.off.z+((birdPos.z%50))>10){}const wz=Math.floor((birdPos.z+u.off.z)/50);f.position.set(u.off.x+birdPos.x*.2+Math.sin(t*.7+u.ph)*2,height(u.off.x,birdPos.z+u.off.z)+1+u.off.y*.5+Math.sin(t*1.3+u.ph)*.6,birdPos.z+u.off.z+(((-birdPos.z)%50)-25)*0);
  f.material.opacity;}}
// ghost record marker
const ghost=new THREE.Group();{const gm=new THREE.MeshBasicMaterial({color:'#ffffff',transparent:true,opacity:.45,depthWrite:false});const b1=new THREE.Mesh(bodyG,gm);b1.scale.set(.85,.8,1.35);const w1=new THREE.Mesh(wingG,gm),w2=new THREE.Mesh(wingG,gm);w2.scale.x=-1;ghost.add(b1,w1,w2);ghost.userData.w=[w1,w2];
 const rib=new THREE.Mesh(new THREE.TorusGeometry(5,.25,6,24,Math.PI),new THREE.MeshBasicMaterial({color:'#f6a96b',transparent:true,opacity:.55}));rib.position.y=-3;ghost.add(rib);ghost.userData.rib=rib;}
scene.add(ghost);let runZ0=0,ghostPassed=false,newBestRun=false;function placeGhost(){const z=runZ0-best;ghost.visible=best>50;ghost.position.set(riverX(z),Math.max(height(riverX(z),z),0)+9,z);ghostPassed=false;}
const gbird=new THREE.Group();{const gm=new THREE.MeshBasicMaterial({color:'#dfe9ff',transparent:true,opacity:.5,depthWrite:false});const b1=new THREE.Mesh(bodyG,gm);b1.scale.set(.85,.8,1.35);const h1=new THREE.Mesh(new THREE.IcosahedronGeometry(.42,1),gm);h1.position.set(0,.35,-.7);const w1=new THREE.Mesh(wingG,gm),w2=new THREE.Mesh(wingG,gm);w1.position.x=.35;w2.position.x=-.35;w2.scale.x=-1;gbird.add(b1,h1,w1,w2);gbird.userData.w=[w1,w2];gbird.visible=false;scene.add(gbird);}
let gPath=JSON.parse(localStorage.getItem('kk_path')||'null'),recPath=[],recT=0,runT=0;
function recTick(dt){if(!running)return;runT+=dt;recT-=dt;if(recT<=0&&recPath.length<2400){recT=.25;recPath.push([+(birdPos.x).toFixed(2),+(birdPos.y).toFixed(2),+(birdPos.z-runZ0).toFixed(2),+bank.toFixed(2)]);}
 if(gPath&&gPath.length>1){const fi=runT/.25,i=Math.floor(fi);if(i<gPath.length-1){const a=gPath[i],b=gPath[i+1],f=fi-i;gbird.visible=SET.ghost;gbird.position.set(a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f,runZ0+a[2]+(b[2]-a[2])*f);gbird.position.y=Math.max(gbird.position.y,Math.max(height(gbird.position.x,gbird.position.z),-1.3)+2);gbird.rotation.set(0,0,a[3]+(b[3]-a[3])*f);
  const fl=Math.sin(t*9)*.6;gbird.userData.w[0].rotation.z=fl;gbird.userData.w[1].rotation.z=-fl;const gd=gbird.position.distanceTo(birdPos);gbird.children[0].material.opacity=THREE.MathUtils.clamp(.55-(gd-20)/150,.08,.55);}else gbird.visible=false;}}
function savePath(){if(recPath.length>8)localStorage.setItem('kk_path',JSON.stringify(recPath));}
function ghostTick(){ghost.visible=SET.ghost&&best>50;if(!ghost.visible)return;{const gd=ghost.position.distanceTo(birdPos);const k=THREE.MathUtils.clamp(1-(gd-30)/140,0,1);ghost.userData.rib.material.opacity=.12+k*.5;ghost.scale.setScalar(.6+k*.4);}const f=Math.sin(t*8)*.6;ghost.userData.w[0].rotation.z=f;ghost.userData.w[1].rotation.z=-f;ghost.position.y+=Math.sin(t*2)*.01;
 if(!ghostPassed&&running&&birdPos.z<ghost.position.z){ghostPassed=true;toast('Rekor izini geçtin! 🏆');chime(1);setTimeout(()=>chime(1.5),150);for(let i=0;i<3;i++)burst(ghost.position,'#f6a96b');}}
window.__setFly=v=>flyT=v;window.__dyn=dynamic;
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
 boostT=Math.max(0,boostT-dt);const spd=(running?14:6)*(1+boostT*.6)*(1-fogBoost*.3);cam.fov+=((baseFov+boostT*10)-cam.fov)*dt*4;cam.updateProjectionMatrix();
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
 tmp.set(birdPos.x,birdPos.y+8.5,birdPos.z+12);camPos.lerp(tmp,1-Math.exp(-dt*2.2));cam.position.copy(camPos);
 tmp.set(birdPos.x,birdPos.y-2,birdPos.z-10);cam.lookAt(tmp);
 const sa=flyT/DAYLEN*Math.PI*2*.25;sun.position.copy(birdPos).add(new THREE.Vector3(Math.cos(sa)*40,60,20+Math.sin(sa)*25));sun.target.position.copy(birdPos);
 // chunk recycle
 const cur=Math.floor(-birdPos.z/CL);for(const ch of chunks){if(ch.idx<cur-1){buildChunk(ch,ch.idx+NCH);}}
 // dynamic objects
 let inCloud=false;
 for(const d of dynamic){const o=d.o;const dx=o.position.x-birdPos.x,dz=o.position.z-birdPos.z;const dd=dx*dx+dz*dz;
  if(d.type==='tree'){const near=dd<36&&birdPos.y-o.position.y<10;if(near&&d.sway<.5){d.sway=1.4;if(d.hasBirds){flush(o.position);d.hasBirds=false;}}
   d.sway*=1-dt*1.2;if(dd<2500){o.rotation.z=Math.sin(t*1.5+d.ph)*.03+Math.sin(t*9)*d.sway*.12;o.updateMatrix();const q=d.rec;q.tr.setMatrixAt(q.ti,o.matrix);q.top.setMatrixAt(q.pi,o.matrix);q.tr.instanceMatrix.needsUpdate=true;q.top.instanceMatrix.needsUpdate=true;}}
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
     if(d.type==='spark'){sparks++;burst(o.position,'#fff1a0');chime(1+sparks%6*.12);}else{cards++;burst(o.position,'#e8766b');burst(o.position,'#fff1a0');chime(.8);setTimeout(()=>chime(1.2),120);setTimeout(()=>chime(1.5),240);cardFlash();const bNow=biome(birdPos.z);let lockd=cardMsgs.map((_,i)=>i).filter(i=>!unlocked.has(i));const themed=lockd.filter(i=>cardMsgs[i][2]===bNow);const plain=lockd.filter(i=>cardMsgs[i][2]===undefined);lockd=themed.length?themed:plain.length?plain:lockd;const ci=lockd.length?lockd[Math.floor(Math.random()*lockd.length)]:Math.floor(Math.random()*cardMsgs.length);const isNew=!unlocked.has(ci);toast((isNew?'Yeni kartpostal: ':'✉ ')+cardMsgs[ci][0]);if(isNew){newCards.add(ci);SKINS.forEach(k=>{if(k.need&&unlocked.size+1===k.need)setTimeout(()=>toast('Yeni kostüm: '+k.n+'!'),1800);});}runCards.push(ci);unlocked.add(ci);localStorage.setItem('kk_cards',JSON.stringify([...unlocked]));}}}
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
 fogBoost+=((inCloud?1:0)-fogBoost)*dt*3;scene.fog.near=60-fogBoost*55;scene.fog.far=190-fogBoost*160;
 for(let i=flock.length-1;i>=0;i--){const f=flock[i];f.t+=dt;f.m.position.addScaledVector(f.v,dt);f.m.rotation.x+=dt*20;if(f.t>3){scene.remove(f.m);flock.splice(i,1);}}
 for(let i=bursts.length-1;i>=0;i--){const b=bursts[i];b.t+=dt;b.m.position.addScaledVector(b.v,dt);b.v.multiplyScalar(1-dt*3);b.m.scale.setScalar(Math.max(0,1-b.t*1.5));if(b.t>.8){scene.remove(b.m);bursts.splice(i,1);}}
 trailT-=dt;if(running&&trailT<=0){trailT=.06;for(const w of[1,-1]){const p=trail[trailI++%trail.length];p.position.copy(birdPos).add(tmp.set(w*1.3*Math.cos(bank),-.1+w*Math.sin(-bank)*1.3,.6));p.userData.t=0;p.visible=true;}}
 for(const p of trail)if(p.visible){p.userData.t+=dt;p.material.opacity;p.scale.setScalar(.6+p.userData.t*1.5);if(p.userData.t>1)p.visible=false;}
 const bq=biome(birdPos.z);ptT-=dt;if(running&&(bq===1||bq===2)&&ptT<=0){ptT=.08;const p=pts[ptI++%pts.length];p.material=bq===2?snowM:leafM[ptI%3];p.position.set(birdPos.x+(Math.random()-.5)*24,birdPos.y+6+Math.random()*6,birdPos.z-6-Math.random()*20);p.userData.t=0;p.userData.s=bq;p.visible=true;}
 for(const p of pts)if(p.visible){p.userData.t+=dt;p.position.y-=dt*(p.userData.s===2?2:1.4);p.position.x+=Math.sin(t*2+p.id)*dt*1.5;p.rotation.x+=dt*3;p.rotation.y+=dt*2;if(p.userData.t>5)p.visible=false;}
 if(running&&qMode==='auto'){fpsAcc+=dt;fpsN++;if(fpsAcc>1){const f=fpsN/fpsAcc;fpsAcc=0;fpsN=0;lowSec=f<35?lowSec+1:0;if(lowSec>=4&&!lowQ){setQ(true);toast('Kalite düşürüldü ◐');}}}
 recTick(dt);if(running&&dist>best){best=dist;newBestRun=true;if(Math.floor(dist)%20==0){localStorage.setItem('kk_best',Math.floor(best));savePath();}}
 wind(spd,vy);
 if(running){for(const ch of chunks)if(ch.wow&&Math.abs(ch.z0-30-birdPos.z)<40)wowSeen=true;checkGoal();checkDaily();}
 flyT+=running?dt:0;dayCycle(SET.fastDay?flyT*6+30:flyT+30);nightFx();ghostTick();
 if(running&&dist>=2000&&!sumShown){sumShown=true;setTimeout(()=>showSummary(true),1200);}
 if(toastT>0){toastT-=dt;if(toastT<=0)$('toast').style.opacity=0;}
 $('dist').textContent=Math.floor(dist)+' m';$('coll').textContent='✦ '+sparks;$('post').textContent='✉ '+cards;
 renderer.render(scene,cam);}
addEventListener('resize',()=>{renderer.setSize(innerWidth,innerHeight);cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix();});
frame();window.__game={birdPos,get sparks(){return sparks}};
