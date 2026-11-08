// Kağıt Kuş · snowman factory — fused felt snow (smooth-min SDF lathe) + cut-felt details.
import * as THREE from 'three';
import {makeFeltMaterial} from './sheepModel.js';
export const POLISH = 10;
export const SNOWMAN_KINDS = ['two','three'];
const SCARVES = ['#d8574f','#4f86b8','#e3a43b','#6f9d57','#9a6bb0'];
const SNOW = '#f8f3e9', COAL = '#2f2b2e', CARROT = '#ef8f4a', TWIG = '#7a5a40';
function rng(s){let a=(s*2654435761)>>>0||1;return()=>{a^=a<<13;a^=a>>>17;a^=a<<5;return(a>>>0)/4294967296;};}
// Spheres along Y: [centerY, radius]. y=0 is the sole.
const BODIES = { two:[[.6,.62],[1.39,.41]], three:[[.54,.58],[1.24,.43],[1.80,.30]] };
const K = .14; // smooth-min blend width (the waist fillet)
function smin(a,b,k){const h=Math.max(k-Math.abs(a-b),0)/k;return Math.min(a,b)-h*h*k*.25;}
function sdf(r,y,sp){let d=1e9;for(const[c,R]of sp)d=smin(d,Math.hypot(r,y-c)-R,K);return d;}
function radiusAt(y,sp){if(sdf(0,y,sp)>0)return 0;let lo=0,hi=1.2;for(let i=0;i<30;i++){const m=(lo+hi)/2;sdf(m,y,sp)<0?lo=m:hi=m;}return lo;}
function bodyGeo(sp,seed){
 const top=sp[sp.length-1][0]+sp[sp.length-1][1]+.03, pts=[], N=90;
 let y0=0;// trim sole flat: start at y where body begins
 pts.push(new THREE.Vector2(0,y0));
 for(let i=0;i<=N;i++){const t=i/N,y=y0+.012+(top-.012)*(1-Math.cos(t*Math.PI))/2;const r=radiusAt(y,sp);if(r>0||i===N)pts.push(new THREE.Vector2(Math.max(r,1e-4),y));}
 pts.push(new THREE.Vector2(0,pts[pts.length-1].y+.001));
 const g=new THREE.LatheGeometry(pts,64);
 const p=g.attributes.position,R=rng(seed*131+7),ph=[R()*6,R()*6,R()*6],col=new Float32Array(p.count*3),base=new THREE.Color(SNOW),v=new THREE.Vector3();
 for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);const a=Math.atan2(v.z,v.x),r=Math.hypot(v.x,v.z);
  // packed-snow lumps: low-frequency, scaled by local radius so poles stay closed
  const n=Math.sin(a*3+ph[0]+v.y*4)*.5+Math.sin(a*5-ph[1]+v.y*7)*.3+Math.sin(v.y*11+ph[2])*.2;
  const s=1+n*.022*Math.min(1,r*3);p.setXYZ(i,v.x*s,v.y,v.z*s);
  // valley shading: how far the fused surface exceeds the largest single sphere (the fillet)
  let single=0;for(const[c,Rr]of sp){const q=Rr*Rr-(v.y-c)**2;if(q>0)single=Math.max(single,Math.sqrt(q));}
  const valley=Math.min(1,Math.max(0,(r-single))/.07), ground=Math.max(0,1-v.y/.18);
  const k=1-valley*.22-ground*.12+n*.02;const c=base.clone().multiplyScalar(k);c.b*=1+valley*.05;c.toArray(col,i*3);}
 g.setAttribute('color',new THREE.BufferAttribute(col,3));g.computeVertexNormals();return g;}
const tint=(g,c)=>{const n=g.attributes.position.count,a=new Float32Array(n*3),cc=new THREE.Color(c);for(let i=0;i<n;i++)cc.toArray(a,i*3);g.setAttribute('color',new THREE.BufferAttribute(a,3));return g;};
// place on body surface: angle around Y (0=+Z), height y
function surf(sp,y,ang,out=0){const r=radiusAt(y,sp)+out;return new THREE.Vector3(Math.sin(ang)*r,y,Math.cos(ang)*r);}
function coal(sz){const g=new THREE.IcosahedronGeometry(sz,1);g.scale(1,1,.55);return tint(g,'#ffffff');}
const _cache=new Map();
export function createSnowman({kind='two',seed=1,scale=1}={}){
 if(!BODIES[kind])kind='two';const sp=BODIES[kind],R=rng(seed*977+13);
 const snowMat=makeFeltMaterial('#ffffff'),dark=makeFeltMaterial(COAL,true);
 const scarfC=SCARVES[Math.floor(R()*SCARVES.length)];const scarfMat=makeFeltMaterial(scarfC);
 const paper=new THREE.MeshLambertMaterial({color:TWIG,flatShading:true});const carrotMat=makeFeltMaterial(CARROT);
 const g=new THREE.Group(),root=new THREE.Group(),body=new THREE.Group();g.add(root);root.add(body);
 const key=kind+(seed%4);if(!_cache.has(key))_cache.set(key,bodyGeo(sp,seed%4));
 body.add(new THREE.Mesh(_cache.get(key),snowMat));
 const head=sp[sp.length-1],hc=head[0],hr=head[1];
 // neck = narrowest point between head and the ball below
 const below=sp[sp.length-2];let ny=hc,nr=9;for(let y=below[0];y<hc;y+=.005){const r=radiusAt(y,sp);if(r<nr){nr=r;ny=y;}}
 // face: two coal eyes under slight brow, dotted smile
 const face=new THREE.Group();body.add(face);
 for(const s of[-1,1]){const e=new THREE.Mesh(coal(hr*.115),dark);const ang=s*.36,y=hc+hr*.2;e.position.copy(surf(sp,y,ang,-.006));e.lookAt(e.position.clone().multiplyScalar(2).setY(y+.02));face.add(e);}
 const nd=5;for(let i=0;i<nd;i++){const t=i/(nd-1)-.5,ang=t*.95,y=hc-hr*.36+Math.abs(t)**2*hr*.5;const m=new THREE.Mesh(coal(hr*.065),dark);m.position.copy(surf(sp,y,ang,-.004));m.lookAt(m.position.clone().multiplyScalar(2).setY(y));face.add(m);}
 // carrot nose, +Z, slight droop & seed tilt
 // felt carrot: lathe with gentle ridges, tip toward +Z
 const cp=[];for(let i=0;i<=8;i++){const t=i/8;cp.push(new THREE.Vector2(Math.max(.004,hr*.135*(1-t)**.85*(1+.07*Math.sin(t*22))),t*hr*.95));}
 const cg=new THREE.LatheGeometry(cp,9);cg.computeVertexNormals();
 const nose=new THREE.Mesh(tint(cg,'#ffffff'),carrotMat);nose.position.copy(surf(sp,hc-.01,0,-.04));nose.rotation.set(Math.PI/2-.1,0,0);nose.rotateY((R()-.5)*.3);face.add(nose);
 // buttons on front of lower/middle balls
 const nb=2+(R()<.5?1:0),by0=kind==='three'?sp[1][0]+.2:sp[0][0]+.34,bstep=kind==='three'?.2:.2;
 for(let i=0;i<nb;i++){const y=by0-i*bstep;const b=new THREE.Mesh(coal(.045),dark);b.position.copy(surf(sp,y,0,-.008));b.lookAt(b.position.clone().multiplyScalar(2).setY(y));body.add(b);}
 // twig arms: folded paper sticks with a forked tip
 const armY=kind==='three'?sp[1][0]+.12:sp[0][0]+.36,arms=[];
 for(const s of[-1,1]){const pivot=new THREE.Group();pivot.position.copy(surf(sp,armY,s*Math.PI/2,-.06));body.add(pivot);
  const up=.25+R()*.55*(s>0?1:.6);pivot.rotation.set(0,(R()-.5)*.5,s*up);
  const L=.62,stick=new THREE.Mesh(new THREE.CylinderGeometry(.018,.026,L,5),paper);stick.rotation.z=-s*Math.PI/2;stick.position.x=s*L/2;pivot.add(stick);
  for(const[f,a,l]of[[.72,.7,.17],[.92,-.6,.14],[1,.25,.12]]){const tw=new THREE.Mesh(new THREE.CylinderGeometry(.01,.014,l,4),paper);tw.position.set(s*(L*f+Math.cos(a)*l*.4),Math.sin(a)*l*.45,0);tw.rotation.z=-s*(Math.PI/2-a);pivot.add(tw);}
  arms.push(pivot);}
 // folded paper scarf: band + two hanging tails with fringe
 const scarf=new THREE.Group();scarf.position.y=ny;body.add(scarf);
 const band=new THREE.Mesh(tint(new THREE.TorusGeometry(nr+.03,.058,6,28),'#ffffff'),scarfMat);band.rotation.x=Math.PI/2;band.scale.set(1,1,.9);scarf.add(band);
 const tails=[];for(const[s,len,rz]of[[1,.36,.22],[1,.28,-.05]]){const piv=new THREE.Group();piv.position.set(.07+(rz<0?-.07:0),-.03,nr+.07);
  const tg=new THREE.BoxGeometry(.13,len,.025,1,4,1);tg.translate(0,-len/2,0);const t=new THREE.Mesh(tint(tg,'#ffffff'),scarfMat);piv.add(t);
  const stripe=new THREE.Mesh(new THREE.BoxGeometry(.134,.03,.03),makeFeltMaterial('#fff7ea'));stripe.position.y=-len*.72;piv.add(stripe);
  for(let i=0;i<4;i++){const fr=new THREE.Mesh(new THREE.BoxGeometry(.016,.05,.02),scarfMat);fr.position.set(-.05+i*.033,-len-.02,0);piv.add(fr);}
  piv.rotation.set(.12,0,rz);scarf.add(piv);tails.push(piv);}
 // hat: paper bucket (three, or odd seeds) else small felt cap
 const hat=new THREE.Group();hat.position.set(0,hc+hr*.82,-.02);hat.rotation.set(-.12,0,(R()-.5)*.35);body.add(hat);
 if(kind==='three'||seed%2){const bm=makeFeltMaterial(R()<.5?'#7e8b96':'#b8503f');const bk=new THREE.Mesh(tint(new THREE.CylinderGeometry(hr*.5,hr*.62,hr*.62,12,1,true),'#ffffff'),bm);bk.position.y=hr*.31;bm.side=THREE.DoubleSide;hat.add(bk);
  const lid=new THREE.Mesh(tint(new THREE.CircleGeometry(hr*.5,12),'#ffffff'),bm);lid.rotation.x=-Math.PI/2;lid.position.y=hr*.62;hat.add(lid);
  const rim=new THREE.Mesh(tint(new THREE.TorusGeometry(hr*.62,.018,5,16),'#ffffff'),bm);rim.rotation.x=Math.PI/2;hat.add(rim);
  const hd=new THREE.Mesh(new THREE.TorusGeometry(hr*.5,.008,4,16,Math.PI),paper);hd.position.y=hr*.5;hd.rotation.y=Math.PI/2;hat.add(hd);}
 else{const cap=new THREE.Mesh(tint(new THREE.SphereGeometry(hr*.62,14,8,0,Math.PI*2,0,Math.PI/2),'#ffffff'),scarfMat);cap.scale.y=.75;hat.add(cap);hat.position.y=hc+hr*.68;
  const brim=new THREE.Mesh(tint(new THREE.TorusGeometry(hr*.6,.04,6,20),'#ffffff'),makeFeltMaterial('#fff7ea'));brim.rotation.x=Math.PI/2;hat.add(brim);
  const pom=new THREE.Mesh(tint(new THREE.IcosahedronGeometry(.07,1),'#ffffff'),makeFeltMaterial('#fff7ea'));pom.position.y=hr*.5;hat.add(pom);}
 g.traverse(m=>{if(m.isMesh){m.castShadow=true;m.receiveShadow=true;}});
 root.rotation.y=(R()-.5)*.3;body.rotation.z=(R()-.5)*.05;
 g.scale.setScalar(scale*(kind==='three'?.92:1));
 g.userData={kind,root,body,arms,tails,scarf,t:R()*10,lean:0,lv:0,wob:2.2,height:(sp[sp.length-1][0]+hr)};
 return g;}
export function updateSnowman(sm,dt,action='idle'){const d=sm.userData;d.t+=dt;const t=d.t;
 const br=Math.sin(t*1.7);d.body.scale.set(1-br*.006,1+br*.011,1-br*.006);
 // wobble: periodic friendly push, damped spring recovery
 if(action==='wobble'){d.wob+=dt;if(d.wob>2.4){d.wob=0;d.lv+=3.4;}}else d.wob=2.2;
 d.lv+=(-d.lean*30-d.lv*2.2)*dt;d.lean+=d.lv*dt;
 d.root.rotation.z=d.lean*.5;d.root.rotation.x=d.lean*.08;
 // pivot lean on the sole edge: shift so the base edge stays grounded
 d.root.position.x=-Math.sin(d.lean*.5)*.3;d.root.position.y=Math.abs(d.lean)*.03;
 d.tails.forEach((p,i)=>{p.rotation.x=.12+Math.sin(t*2.3+i)*.07+Math.abs(d.lv)*.15;p.rotation.z=(i?-.05:.22)+Math.sin(t*1.9+i*2)*.05-d.lean*.4;});
 d.arms.forEach((a,i)=>{a.rotation.x=Math.sin(t*1.3+i)*.04+(i?1:-1)*d.lean*.2;});}
