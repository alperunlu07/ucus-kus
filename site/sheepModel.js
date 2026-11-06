// Kağıt Kuş — keçe/pamuk yumağı koyun (ön +Z, yukarı +Y, ayak tabanı y=0)
import * as THREE from 'three';
export const WOOL={krem:'#f6f1e6',beyaz:'#fbf7ee',kahve:'#6e5646',kara:'#3a322d',pembe:'#efc4c8'};
function rng(s){s=(s>>>0)||1;return()=>((s=Math.imul(s^s>>>15,1|s)+0x6d2b79f5|0,((s^s>>>14)>>>0)/4294967296));}
// merge non-indexed geometries; colour per part; wool parts (c==null) get soft felt shading (darker undersides = crease between clumps)
export function merge(parts){let n=0;const gs=parts.map(([g,c,ctr])=>{const x=g.index?g.toNonIndexed():g;n+=x.attributes.position.count;return[x,c,ctr];});
 const P=new Float32Array(n*3),N=new Float32Array(n*3),Cc=new Float32Array(n*3);let o=0;
 for(const[g,c,ctr]of gs){const k=g.attributes.position.count;P.set(g.attributes.position.array,o*3);N.set(g.attributes.normal.array,o*3);const col=new THREE.Color(c||'#fff');const nn=g.attributes.normal.array;
  for(let i=0;i<k;i++){if(c)col.toArray(Cc,(o+i)*3);else{const ny=nn[i*3+1];const v=.8+.2*Math.min(1,Math.max(0,ny*.6+.6));Cc[(o+i)*3]=v;Cc[(o+i)*3+1]=v*.985;Cc[(o+i)*3+2]=v*.96;}}o+=k;}
 const m=new THREE.BufferGeometry();m.setAttribute('position',new THREE.BufferAttribute(P,3));m.setAttribute('normal',new THREE.BufferAttribute(N,3));m.setAttribute('color',new THREE.BufferAttribute(Cc,3));m.computeBoundingSphere();return m;}
function lumpy(r,seed,det=2,amt=.14){const g=new THREE.IcosahedronGeometry(r,det);const p=g.attributes.position,R=rng(seed);const cache={};
 for(let i=0;i<p.count;i++){const k=p.getX(i).toFixed(3)+p.getY(i).toFixed(3)+p.getZ(i).toFixed(3);const f=cache[k]??(cache[k]=1-amt/2+R()*amt);p.setXYZ(i,p.getX(i)*f,p.getY(i)*f,p.getZ(i)*f);}
 const nn=g.attributes.normal;for(let i=0;i<p.count;i++){const v=new THREE.Vector3(p.getX(i),p.getY(i),p.getZ(i)).normalize();nn.setXYZ(i,v.x,v.y,v.z);}return g;}
// compact flattened bean: low core + ring of irregular clumps around the equator & underside, few small flat ones on top
export const BODY={cy:.5,rx:.44,ry:.24,rz:.58};
export function woolGeo(seed=1,max=16,lamb=false,legs=null,det=2,withTail=false){const R=rng(seed*977+3);const parts=[];const{cy,rx,ry,rz}=BODY;
 const core=lumpy(1,seed,det,.08);core.scale(rx,ry,rz);core.translate(0,cy,0);parts.push([core]);
 const n=Math.min(max,13+Math.floor(R()*4));
 for(let i=0;i<n;i++){const a=i/n*Math.PI*2+(R()-.5)*.35,up=-.45+R()*.85;const r=.13+R()*.11;const e=Math.sqrt(1-up*up*.45);
  if(Math.sin(a)>.8&&up>.1)continue;// keep the brow clear for the face
  const g=lumpy(r,seed*31+i,det);g.scale(1,.72,1);g.translate(Math.cos(a)*rx*.86*e,cy+up*ry*.95,Math.sin(a)*rz*.86*e);parts.push([g]);}
 for(let i=0;i<4;i++){const g=lumpy(.17+R()*.05,seed*7+i,det);g.scale(1,.55,1);g.translate((R()-.5)*.36,cy+ry*.78,(i-1.5)*.24+(R()-.5)*.06);parts.push([g]);}
 const t=lumpy(.13,seed+5,det);t.scale(1.15,.7,1);t.translate(0,cy+.13,rz*.86);parts.push([t]);// forelock overhang
 if(withTail){const tl=lumpy(.1,9,det);tl.scale(1,.9,1.2);tl.translate(TAIL_POS[0],TAIL_POS[1],TAIL_POS[2]-.04);parts.push([tl]);}
 if(lamb){for(const[g]of parts){g.translate(0,-cy,0);g.scale(.95,1.05,.88);g.translate(0,cy,0);}}
 if(legs)for(const q of LEGS){const g=LEG.clone();g.translate(...q);parts.push([g,legs]);}
 return merge(parts);}
export const TAIL_POS=[0,.56,-.66];
export const tailGeo=(()=>{const g=lumpy(.1,9,2);g.scale(1,.9,1.2);g.translate(0,0,-.04);return merge([[g]]);})();
// short sturdy legs, pivot at hip
export const LEG=(()=>{const g=new THREE.CylinderGeometry(.068,.056,.3,8);g.translate(0,-.15,0);return g;})();
export const LEGS=[[.2,.3,.3],[-.2,.3,.3],[.2,.3,-.3],[-.2,.3,-.3]];// FL FR BL BR
export const legGeo=(c='#2d2724')=>merge([[LEG.clone(),c]]);
// head: pivot at neck, pushed forward so the black muzzle peeks out past the wool from above
export const HEAD_PIVOT=[0,.55,.5];
export function headGeo(face='#2d2724'){const parts=[];
 const h=lumpy(1,77,2,.06);h.scale(.15,.15,.21);h.translate(0,-.02,.22);parts.push([h,face]);
 const mz=new THREE.IcosahedronGeometry(1,2);mz.scale(.105,.095,.1);mz.translate(0,-.06,.38);parts.push([mz,face]);
 for(const s of[-1,1]){const e=new THREE.IcosahedronGeometry(1,2);e.scale(.13,.035,.065);e.rotateZ(s*-.4);e.translate(s*.17,.06,.16);parts.push([e,face]);
  const ey=new THREE.IcosahedronGeometry(.03,1);ey.translate(s*.08,.05,.34);parts.push([ey,'#f3ead8']);}
 return merge(parts);}
export function legsGeo(face='#2d2724'){return merge(LEGS.map(p=>{const g=LEG.clone();g.translate(...p);return[g,face];}));}
const _hg={};export function sharedHead(face){return _hg[face]||(_hg[face]=headGeo(face));}
const _wg={};export function sharedWool(seed,lamb){const k=seed+'_'+lamb;return _wg[k]||(_wg[k]=woolGeo(seed,16,lamb));}
// ---- shared pose solver (workshop + game). u keeps blend weights & phases; returns pose P
const ST=['idle','graze','walk','hop'];const sm=x=>x<=0?0:x>=1?1:x*x*(3-2*x);
export function newPoseState(seed=0){return{t:seed*3.7,w:{idle:1,graze:0,walk:0,hop:0},wp:seed,hp:0,P:{y:0,roll:0,pitch:0,sx:1,sy:1,hx:0,hy:0,hz:0,hp:0,hyaw:0,hroll:0,legs:[0,0,0,0],tuck:0,tail:0},seed};}
export function solvePose(u,state,dt,speed=1){u.t+=dt;const t=u.t,s=u.seed;const W=u.w,k=Math.min(1,dt/.3);
 for(const n of ST)W[n]+=((n===state?1:0)-W[n])*k;
 u.wp+=dt*7*speed;const w=u.wp;
 if(state==='hop'||W.hop>.05)u.hp+=dt*1.25;else u.hp=0;
 const P=u.P;P.y=P.roll=P.pitch=P.hx=P.hy=P.hz=P.hp=P.hyaw=P.hroll=P.tuck=P.tail=0;P.sx=P.sy=1;for(let i=0;i<4;i++)P.legs[i]=0;
 const add=(wt,o)=>{for(const key in o){if(key==='legs')for(let i=0;i<4;i++)P.legs[i]+=o.legs[i]*wt;else if(key==='sy'||key==='sx')P[key]+=(o[key]-1)*wt;else P[key]+=o[key]*wt;}};
 // idle: breathe, settle, occasional glance & ear flick
 if(W.idle>.001){const br=Math.sin(t*1.5+s);const gl=sm((Math.sin(t*.31+s*2)-.55)/.35)*(Math.sin(s*5)>0?1:-1);const fl=Math.max(0,Math.sin(t*2.3+s)-.97)*12;
  add(W.idle,{sy:1+br*.015,sx:1-br*.006,hp:-.04+Math.sin(t*.5+s)*.05,hyaw:gl*.45,hroll:Math.sin(t*40)*fl*.08,tail:Math.sin(t*.9)*.08});}
 // graze: neck arcs down until muzzle at grass, chewing, slight forward pitch
 if(W.graze>.001){const ch=Math.sin(t*.8+s)>-.3?1:0;add(W.graze,{hp:1.05+Math.sin(t*11)*.05*ch,hy:-.08,hz:.05,pitch:.06,sy:1+Math.sin(t*1.3+s)*.012,hyaw:Math.sin(t*.4+s)*.15,tail:Math.sin(t*1.7)*.12});}
 // walk: diagonal pairs FL+BR / FR+BL, waddle, head bob, delayed wool jiggle, tail wag
 if(W.walk>.001){const a=Math.sin(w);add(W.walk,{legs:[a*.5,-a*.5,-a*.5,a*.5],y:Math.abs(Math.cos(w))*.035,roll:a*.07,pitch:.02,hp:.12+Math.sin(w*2+.6)*.06,hy:Math.sin(w*2+.6)*.012,sy:1+Math.sin(w*2-1.1)*.03,sx:1-Math.sin(w*2-1.1)*.015,tail:Math.sin(w*2)*.35,hyaw:a*.06});}
 // hop: crouch squash → launch stretch → airborne tuck → land squash → settle
 if(W.hop>.001){const p=u.hp%1;let y=0,sy=1,tu=0,pi=0;
  if(p<.2){const q=sm(p/.2);sy=1-.16*q;y=-.035*q;pi=.08*q;}
  else if(p<.3){const q=sm((p-.2)/.1);sy=.84+.3*q;y=-.035+.1*q;tu=.3*q;pi=.08-.25*q;}
  else if(p<.7){const q=(p-.3)/.4;y=.065+Math.sin(q*Math.PI)*.5;sy=1.14-.14*sm(q*2)+.06*sm((q-.7)/.3);tu=1-sm((q-.75)/.25)*.7;pi=-.17+.3*q;}
  else if(p<.82){const q=sm((p-.7)/.12);sy=1.06-.24*q;y=.065*(1-q)-.03*q;tu=.3*(1-q);pi=.13-.05*q;}
  else{const q=sm((p-.82)/.18);sy=.82+.18*q+Math.sin(q*Math.PI)*.04;y=-.03*(1-q);pi=.08*(1-q);}
  add(W.hop,{y,sy,sx:1+(1-sy)*.5,tuck:tu,pitch:-pi*.5,hp:-.1+pi,tail:tu*.4,legs:[-.7*tu,-.7*tu,.7*tu,.7*tu]});}
 return P;}
// ---- workshop sheep (scene graph)
export function createSheep(o={}){const seed=o.seed??1,face=o.faceColor||'#2d2724';
 const woolMat=new THREE.MeshLambertMaterial({color:o.woolColor||WOOL.krem,vertexColors:true});const dark=new THREE.MeshLambertMaterial({vertexColors:true});
 const g=new THREE.Group(),body=new THREE.Group();g.add(body);const fluff=new THREE.Group();body.add(fluff);
 const wool=new THREE.Mesh(sharedWool(seed%6,!!o.isLamb),woolMat);fluff.add(wool);
 const tail=new THREE.Mesh(tailGeo,woolMat);tail.position.set(...TAIL_POS);fluff.add(tail);
 const head=new THREE.Group();head.position.set(...HEAD_PIVOT);head.add(new THREE.Mesh(sharedHead(face),dark));body.add(head);
 const lg=legGeo(face);const legs=LEGS.map(p=>{const l=new THREE.Mesh(lg,dark);l.position.set(...p);body.add(l);return l;});
 g.traverse(m=>{if(m.isMesh){m.castShadow=true;m.receiveShadow=true;}});
 const sc=(o.scale||1)*(o.isLamb?.66:1);g.scale.setScalar(sc);if(o.isLamb){head.scale.setScalar(1.32);}
 g.userData={body,fluff,head,legs,tail,wool,woolMat,u:newPoseState(seed+Math.random()*9),state:'idle'};return g;}
export function setWool(sh,c){sh.userData.woolMat.color.set(c);}
// state: idle | graze | walk | hop
export function updateSheep(sh,state,dt,speed=1){const d=sh.userData;d.state=state;const P=solvePose(d.u,state,dt,speed);
 d.body.position.y=P.y;d.body.rotation.set(P.pitch,0,P.roll);d.fluff.scale.set(P.sx,P.sy,P.sx);
 d.head.position.set(HEAD_PIVOT[0],HEAD_PIVOT[1]*P.sy+P.hy,HEAD_PIVOT[2]+P.hz);d.head.rotation.set(P.hp,P.hyaw,P.hroll,'YXZ');
 d.tail.rotation.set(0,P.tail,0);
 d.legs.forEach((l,i)=>{l.rotation.x=P.legs[i];l.scale.y=Math.max(.6,1+Math.min(0,P.y)/.3)*(1-P.tuck*.25);});
 return P;}
