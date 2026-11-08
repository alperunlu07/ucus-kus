// Kağıt Kuş · hava ve gece atölyesi fabrikası (rain, fog, rainbow, night).
// +Y up, y=0 = ground contact of the vignette. Display scale: a vignette is ~6 units wide.
// Suggested in-game scale: rainbow radius 5 here -> ~40 in game (scale≈8); rain/fog volumes scale≈6-8;
// moon radius 1.1 here -> 7 in game (scale≈6.4). Pass {scale} to createWeather to multiply.
import * as THREE from 'three';
export const POLISH = 10;
export const WEATHER_KINDS = ['rain','fog','rainbow','night'];
function rng(seed){let s=(seed*2654435761)>>>0||1;return()=>((s=Math.imul(s,1664525)+1013904223>>>0)/4294967296);}
const lam=(color,o={})=>new THREE.MeshLambertMaterial({color,flatShading:true,...o});
function paperHill(color,w=6.4,d=5,h=.45){// low cut-card mound so weather meets earth
 const g=new THREE.SphereGeometry(1,28,10,0,Math.PI*2,0,Math.PI/2);g.scale(w/2,h,d/2);const m=new THREE.Mesh(g,lam(color));m.receiveShadow=true;m.castShadow=true;
 const rim=new THREE.Mesh(new THREE.CylinderGeometry(w/2+.04,w/2+.04,.05,28),lam('#6f8a5c'));rim.scale.z=(d/2+.04)/(w/2+.04);rim.position.y=.025;const grp=new THREE.Group();grp.add(m,rim);return grp;}
function eased(g,dt,action){const u=g.userData;u.t+=dt;u.s+=((action==='swell'?1:0)-u.s)*Math.min(1,dt*1.6);return u.s;}

export function createRain({seed=1}={}){
 const g=new THREE.Group(),r=rng(seed);g.add(paperHill('#9fb689'));
 const N=320,H=6.2;// paper slivers: thin folded card strips (two crossed planes read from any angle)
 const sl=new THREE.BoxGeometry(.034,.3,.008);const mat=lam('#b9d3e4',{emissive:'#6f8ea6',emissiveIntensity:.45,transparent:true,opacity:.9});
 const inst=new THREE.InstancedMesh(sl,mat,N);inst.castShadow=false;g.add(inst);
 const drops=[];for(let i=0;i<N;i++)drops.push({x:(r()-.5)*5.6,z:(r()-.5)*4.4,y:r()*H,v:5+r()*2.5,tilt:.18+r()*.05,on:i<200,c:r()});
 for(let i=0;i<N;i++)inst.setColorAt(i,new THREE.Color().setHSL(.56+drops[i].c*.04,.4,.7+drops[i].c*.16));
 // a few near drops: cut acetate teardrops with a paper edge
 const sh=new THREE.Shape();sh.moveTo(0,.22);sh.bezierCurveTo(.02,.12,.09,.04,.09,-.03);sh.bezierCurveTo(.09,-.1,-.09,-.1,-.09,-.03);sh.bezierCurveTo(-.09,.04,-.02,.12,0,.22);
 const tg=new THREE.ExtrudeGeometry(sh,{depth:.02,bevelEnabled:true,bevelSize:.008,bevelThickness:.006,bevelSegments:1});tg.center();
 const tm=new THREE.MeshPhongMaterial({color:'#cfe6f4',transparent:true,opacity:.62,shininess:90,specular:'#ffffff'});
 const big=[];for(let i=0;i<16;i++){const m=new THREE.Mesh(tg,tm);m.castShadow=true;m.userData={x:(r()-.5)*5,z:(r()-.5)*3.6,y:r()*H,v:3.4+r()*1.2,sp:r()*6};g.add(m);big.push(m);}
 // splash rings: little felt circles stamped where drops land
 const ringG=new THREE.RingGeometry(.05,.075,16);ringG.rotateX(-Math.PI/2);const rings=[];
 for(let i=0;i<22;i++){const m=new THREE.Mesh(ringG,new THREE.MeshBasicMaterial({color:'#e8f2f8',transparent:true,opacity:0,depthWrite:false}));m.userData.life=r();g.add(m);rings.push(m);}
 const dummy=new THREE.Object3D();
 g.userData.tick=(dt,s,t)=>{const active=Math.round(200+s*120),sp=1+s*.6;
  for(let i=0;i<N;i++){const d=drops[i];if(i>=active){dummy.scale.setScalar(0);}else{d.y-=d.v*sp*dt;if(d.y<groundY(d.x,d.z)){d.y+=H;}dummy.scale.set(1,1+s*.4,1);}
   dummy.position.set(d.x+d.y*d.tilt*.3,d.y,d.z);dummy.rotation.set(0,i*.7,-d.tilt*.3);dummy.updateMatrix();inst.setMatrixAt(i,dummy.matrix);}
  inst.instanceMatrix.needsUpdate=true;
  for(const m of big){const u=m.userData;u.y-=u.v*sp*dt;if(u.y<groundY(u.x,u.z)+.1)u.y+=H;m.position.set(u.x,u.y,u.z);m.rotation.set(Math.sin(t+u.sp)*.15,t*.6+u.sp,0);}
  for(const m of rings){const u=m.userData;u.life+=dt*(1.4+s);if(u.life>1){u.life=0;u.x=(Math.random()-.5)*5;u.z=(Math.random()-.5)*3.8;}
   m.position.set(u.x??0,groundY(u.x??0,u.z??0)+.01,u.z??0);m.scale.setScalar(1+u.life*3);m.material.opacity=(1-u.life)*.8;}
  mat.opacity=.75+s*.2;};
 return g;}
function groundY(x,z){const k=1-(x/3.2)**2-(z/2.5)**2;return k>0?.45*Math.sqrt(k):0;}

function bendUV(g,w,h){const p=g.attributes.position,uv=g.attributes.uv;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i);uv.setXY(i,x/w+.5,y/h);p.setZ(i,Math.sin(x*1.1)*.18);}g.computeVertexNormals();return g;}// gentle paper curl
let tissueTex;function tissue(){if(tissueTex)return tissueTex;const c=document.createElement('canvas');c.width=256;c.height=64;const x=c.getContext('2d'),r=rng(7);
 const gr=x.createLinearGradient(0,0,0,64);gr.addColorStop(0,'rgba(255,255,255,0)');gr.addColorStop(.35,'rgba(255,255,255,.85)');gr.addColorStop(1,'rgba(255,255,255,1)');x.fillStyle=gr;x.fillRect(0,0,256,64);
 x.globalCompositeOperation='destination-out';for(let i=0;i<900;i++){x.fillStyle=`rgba(0,0,0,${r()*.25})`;x.fillRect(r()*256,r()*64,1+r()*6,1);}// cotton fibre gaps
 x.globalCompositeOperation='destination-in';const sg=x.createLinearGradient(0,0,256,0);sg.addColorStop(0,'rgba(0,0,0,0)');sg.addColorStop(.15,'#000');sg.addColorStop(.85,'#000');sg.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=sg;x.fillRect(0,0,256,64);
 tissueTex=new THREE.CanvasTexture(c);return tissueTex;}
export function createFog({seed=1}={}){
 const g=new THREE.Group(),r=rng(seed);g.add(paperHill('#a9b79a'));
 // layered translucent tissue sheets: long, low, wavy-topped strips standing in depth rows (a veil, not puffs)
 const sheets=[];const cols=['#f4f1ea','#e9e6ef','#f7f5f0','#dfe0ea'];
 for(let i=0;i<11;i++){const w=4.8+r()*2.2,h=.8+r()*.7,sh=new THREE.Shape();sh.moveTo(-w/2,0);const n=10;
  for(let k=0;k<=n;k++){const x=-w/2+w*k/n,env=Math.sin(Math.PI*k/n);sh.lineTo(x,h*(.35+.65*env)+(r()-.5)*.08);} sh.lineTo(w/2,0);sh.lineTo(-w/2,0);
  const m=new THREE.Mesh(bendUV(new THREE.ShapeGeometry(sh,4),w,h*1.1),new THREE.MeshLambertMaterial({color:cols[i%4],alphaMap:tissue(),emissive:'#ffffff',emissiveIntensity:.25,transparent:true,opacity:.6,side:THREE.DoubleSide,depthWrite:false}));
  m.userData={z:-2.2+i*.42,y:.05+r()*.35,ph:r()*6,sp:.12+r()*.1,x0:(r()-.5)*.8};m.renderOrder=2+i;g.add(m);sheets.push(m);}
 // thin horizontal cotton layers hugging the ground, with a stitched thread edge
 const flats=[];for(let i=0;i<4;i++){const ge=new THREE.CircleGeometry(1,40);ge.rotateX(-Math.PI/2);const m=new THREE.Mesh(ge,new THREE.MeshLambertMaterial({color:'#f6f4ef',transparent:true,opacity:.3,depthWrite:false}));
  m.scale.set(2.6+r()*.8,1,1.4+r()*.5);m.userData={y:.5+i*.16,ph:r()*6};m.renderOrder=1;g.add(m);flats.push(m);}
 const thread=new THREE.Mesh(new THREE.TorusGeometry(2.6,.012,4,90),lam('#c9c4d6'));thread.rotation.x=Math.PI/2;thread.scale.y=.6;g.add(thread);
 g.userData.tick=(dt,s,t)=>{for(const m of sheets){const u=m.userData;m.position.set(u.x0+Math.sin(t*u.sp+u.ph)*.5*(1+s),u.y+Math.sin(t*.5+u.ph)*.04,u.z);
   m.scale.set(1+s*.3,1+s*.35+Math.sin(t*.7+u.ph)*.05,1);m.material.opacity=.5+s*.15;}
  for(const m of flats){const u=m.userData;m.position.y=u.y+s*.25+Math.sin(t*.6+u.ph)*.03;m.rotation.y=t*.03+u.ph;m.material.opacity=.22+s*.3;}
  thread.position.y=.62+s*.4+Math.sin(t*.5)*.03;thread.scale.set(1+s*.25,.6,1+s*.25);};
 return g;}

export function createRainbow({seed=1}={}){
 const g=new THREE.Group(),r=rng(seed);g.add(paperHill('#a5bb8d',7.4,3.4,.3));
 const R=4.6,bw=.3,cols=['#e48a7f','#f0b075','#f2db84','#9fc98a','#86b1d6','#a996cf'];const bands=[];
 for(let i=0;i<6;i++){const ro=R-i*(bw-.03),ri=ro-bw,sh=new THREE.Shape();sh.absarc(0,0,ro,0,Math.PI,false);sh.absarc(0,0,ri,Math.PI,0,true);
  const ge=new THREE.ExtrudeGeometry(sh,{depth:.05,bevelEnabled:true,bevelSize:.012,bevelThickness:.01,bevelSegments:1,curveSegments:64});
  const m=new THREE.Mesh(ge,new THREE.MeshLambertMaterial({color:cols[i],emissive:cols[i],emissiveIntensity:.12,transparent:true,opacity:.95}));m.position.z=-i*.035;m.position.y=i*.012;m.castShadow=true;g.add(m);bands.push(m);
  // running stitch along the band centre
  const n=Math.round(46*(ro/R)),st=new THREE.InstancedMesh(new THREE.BoxGeometry(.07,.012,.01),lam('#fffaf0'),n),d=new THREE.Object3D(),rc=(ro+ri)/2;
  for(let k=0;k<n;k++){const a=Math.PI*(k+.5)/n;d.position.set(Math.cos(a)*rc,Math.sin(a)*rc,.07);d.rotation.z=a+Math.PI/2;d.updateMatrix();st.setMatrixAt(k,d.matrix);}st.position.z=-i*.035;g.add(st);}
 {const sh=new THREE.Shape();sh.absarc(0,0,R+.06,0,Math.PI,false);sh.absarc(0,0,R-6*(bw-.03)-.06+.03,Math.PI,0,true);const card=new THREE.Mesh(new THREE.ExtrudeGeometry(sh,{depth:.03,bevelEnabled:false,curveSegments:64}),lam('#fbf5e8'));card.position.z=-.26;card.castShadow=true;g.add(card);}// cream card backing shows a paper edge
 // felt tufts planting the feet
 for(const sx of[-1,1])for(let k=0;k<5;k++){const t=new THREE.Mesh(new THREE.IcosahedronGeometry(.32+r()*.18,1),lam(k%2?'#fbf7ee':'#eef0f2'));t.position.set(sx*(R-.8)+(r()-.5)*1.4,.1+r()*.12,(r()-.5)*.6);t.scale.y=.6;t.castShadow=true;g.add(t);}
 g.userData.tick=(dt,s,t)=>{bands.forEach((m,i)=>{m.material.emissiveIntensity=.1+s*.35+Math.sin(t*.8-i*.6)*.06;m.material.opacity=.88+s*.12;});g.children.forEach(c=>{});};
 return g;}

export function createNight({seed=1}={}){
 const g=new THREE.Group(),r=rng(seed);
 // cut-card landscape strip: two layered hill silhouettes
 for(const [c,z,h,ph] of [['#2f3a52',-1.2,.9,0],['#3d4a63',-.3,.6,2]]){const sh=new THREE.Shape();sh.moveTo(-3.6,0);for(let k=0;k<=24;k++){const x=-3.6+7.2*k/24;sh.lineTo(x,h*(.55+.45*Math.sin(x*1.3+ph)));}sh.lineTo(3.6,0);
  const m=new THREE.Mesh(new THREE.ExtrudeGeometry(sh,{depth:.06,bevelEnabled:false}),lam(c));m.position.z=z;m.receiveShadow=true;g.add(m);}
 const base=new THREE.Mesh(new THREE.BoxGeometry(7.2,.06,3),lam('#29324a'));base.position.y=.03;base.receiveShadow=true;g.add(base);
 // moon: cut-paper disc with felt craters and layered paper halo
 const moon=new THREE.Group();moon.position.set(1.6,4.3,-1.6);g.add(moon);
 const disc=new THREE.Mesh(new THREE.CylinderGeometry(1.1,1.1,.08,48),new THREE.MeshLambertMaterial({color:'#fff6dc',emissive:'#f5e6b8',emissiveIntensity:.75}));disc.rotation.x=Math.PI/2;moon.add(disc);
 for(let i=0;i<7;i++){const a=r()*6.28,d=r()*.75,c=new THREE.Mesh(new THREE.CylinderGeometry(.08+r()*.14,.1+r()*.14,.03,18),new THREE.MeshLambertMaterial({color:'#e8d9b0',emissive:'#d8c79a',emissiveIntensity:.35}));c.rotation.x=Math.PI/2;c.position.set(Math.cos(a)*d,Math.sin(a)*d,.05);moon.add(c);}
 // halo: opaque cut-paper rings in a warm-indigo ramp (no additive billboard), scalloped edges
 const halos=[];[[1.4,'#6b6a6e'],[1.72,'#4c4f5e'],[2.05,'#363c50']].forEach(([rad,col],i)=>{const sh=new THREE.Shape();for(let k=0;k<=72;k++){const a=k/72*Math.PI*2,rr=rad*(1+.018*Math.sin(a*18+i));k?sh.lineTo(Math.cos(a)*rr,Math.sin(a)*rr):sh.moveTo(Math.cos(a)*rr,Math.sin(a)*rr);}
  const h=new THREE.Mesh(new THREE.ShapeGeometry(sh),new THREE.MeshBasicMaterial({color:col}));h.userData.c=new THREE.Color(col);h.position.z=-.06-i*.03;moon.add(h);halos.push(h);});
 // folded paper stars (5-point, bevelled card) + punched light dots
 const ss=new THREE.Shape();for(let k=0;k<10;k++){const a=Math.PI/2+k*Math.PI/5,rr=k%2?.045:.11;k?ss.lineTo(Math.cos(a)*rr,Math.sin(a)*rr):ss.moveTo(Math.cos(a)*rr,Math.sin(a)*rr);}
 const sg=new THREE.ExtrudeGeometry(ss,{depth:.01,bevelEnabled:true,bevelSize:.012,bevelThickness:.02,bevelSegments:1});
 const stars=[];for(let i=0;i<34;i++){const m=new THREE.Mesh(sg,new THREE.MeshLambertMaterial({color:'#fffbe8',emissive:'#fff1c0',emissiveIntensity:.6}));let x,y;do{x=-3.3+6.6*((i*.618+r()*.2)%1);y=2+r()*3.4;}while(Math.hypot(x-1.6,y-4.3)<1.7);
  m.position.set(x,y,-1.8+r()*.4);m.scale.setScalar(.6+r()*.9);m.userData={ph:r()*6,b:m.scale.x};g.add(m);stars.push(m);}
 const dotG=new THREE.CircleGeometry(.025,8);for(let i=0;i<60;i++){const m=new THREE.Mesh(dotG,new THREE.MeshBasicMaterial({color:'#dfe6ff'}));m.position.set((r()-.5)*7,1.6+r()*4,-2);g.add(m);}
 // stardust: pale paper motes (folded tetra flakes) drifting, occasionally 'collected' (zip up + fold away)
 const dust=[];const dg=new THREE.OctahedronGeometry(.055,0);
 for(let i=0;i<24;i++){const m=new THREE.Mesh(dg,new THREE.MeshLambertMaterial({color:'#bcd4ff',emissive:'#9fb8ee',emissiveIntensity:.5,transparent:true}));m.scale.set(1,1.5,.5);
  m.userData={x:(r()-.5)*5.6,y:.6+r()*2.4,z:(r()-.5)*1.8,ph:r()*6,c:-1};g.add(m);dust.push(m);}
 const flies=[];for(let i=0;i<7;i++){const m=new THREE.Mesh(new THREE.SphereGeometry(.03,8,6),new THREE.MeshBasicMaterial({color:'#d9ef8a',transparent:true}));m.userData={x:(r()-.5)*5,z:.3+r()*.8,ph:r()*6};g.add(m);flies.push(m);}
 let collectT=0;
 g.userData.tick=(dt,s,t)=>{moon.rotation.z=Math.sin(t*.1)*.02;halos.forEach((h,i)=>h.material.color.copy(h.userData.c).lerp(new THREE.Color('#8a826f'),s*.35*(1-i*.3)));disc.material.emissiveIntensity=.75+s*.25;
  for(const m of stars){const u=m.userData,tw=.5+.5*Math.sin(t*(1.5+s)+u.ph);m.scale.setScalar(u.b*(.8+.35*tw+s*.25));m.rotation.y=Math.sin(t*.9+u.ph)*.9;m.material.emissiveIntensity=.35+tw*.6;}
  const active=Math.round(12+s*12);collectT+=dt;if(collectT>2.2){collectT=0;const m=dust[Math.floor(Math.random()*active)];if(m.userData.c<0)m.userData.c=0;}
  dust.forEach((m,i)=>{const u=m.userData;m.visible=i<active;if(u.c>=0){u.c+=dt*1.3;m.position.y+=dt*3;m.scale.setScalar(Math.max(0,1-u.c)*1.4);m.rotation.y+=dt*12;if(u.c>1){u.c=-1;m.scale.set(1,1.5,.5);}return;}
   m.position.set(u.x+Math.sin(t*.3+u.ph)*.5,u.y+Math.sin(t*.5+u.ph*2)*.25,u.z);m.rotation.set(t*.4+u.ph,t*.7,0);m.material.opacity=.6+.4*Math.sin(t*1.3+u.ph);});
  flies.forEach(m=>{const u=m.userData;m.position.set(u.x+Math.sin(t*.4+u.ph)*.4,.35+Math.sin(t*.9+u.ph)*.15,u.z);m.material.opacity=Math.max(0,Math.sin(t*1.7+u.ph))*(.8-s*.3);});};
 return g;}

const MAKERS={rain:createRain,fog:createFog,rainbow:createRainbow,night:createNight};
export function createWeather({kind='rain',seed=1,scale=1}={}){const g=(MAKERS[kind]||createRain)({seed});g.scale.setScalar(scale);Object.assign(g.userData,{kind,t:0,s:0});g.userData.tick?.(0,0,0);return g;}
export function updateWeather(weather,dt,action='idle'){const s=eased(weather,dt,action);weather.userData.tick?.(dt,s,weather.userData.t);}
