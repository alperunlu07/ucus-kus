// Kağıt Kuş — keçe/pamuk yumağı koyun (ön +Z, yukarı +Y, ayak tabanı y=0)
import * as THREE from 'three';
export const WOOL={krem:'#f6f1e6',beyaz:'#fbf7ee',kahve:'#6e5646',kara:'#3a322d',pembe:'#efc4c8'};
function rng(s){s=(s>>>0)||1;return()=>((s=Math.imul(s^s>>>15,1|s)+0x6d2b79f5|0,((s^s>>>14)>>>0)/4294967296));}
// One matte felt material for both scene-graph and instanced sheep. All grain is
// sampled BEFORE instance/world transforms: it stays sewn onto walking wool.
export function makeFeltMaterial(color='#ffffff',dark=false){
 const m=new THREE.MeshLambertMaterial({color,vertexColors:true});
 m.onBeforeCompile=s=>{
  s.vertexShader='varying vec3 vFeltPosition;\n'+s.vertexShader;
  s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvFeltPosition = position;');
  s.fragmentShader=`varying vec3 vFeltPosition;
float feltHash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
float feltNoise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
return mix(mix(mix(feltHash(i),feltHash(i+vec3(1,0,0)),f.x),mix(feltHash(i+vec3(0,1,0)),feltHash(i+vec3(1,1,0)),f.x),f.y),mix(mix(feltHash(i+vec3(0,0,1)),feltHash(i+vec3(1,0,1)),f.x),mix(feltHash(i+vec3(0,1,1)),feltHash(i+vec3(1,1,1)),f.x),f.y),f.z);}
`+s.fragmentShader;
  s.fragmentShader=s.fragmentShader.replace('#include <lights_lambert_pars_fragment>',THREE.ShaderChunk.lights_lambert_pars_fragment.replace('saturate( dot( geometryNormal, directLight.direction ) )','clamp( (dot( geometryNormal, directLight.direction ) + '+(dark?'.16':'.32')+') / '+(dark?'1.16':'1.32')+', 0.0, 1.0 )'));
  s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
vec3 fp = vFeltPosition * 155.0;
// Fade the fibre octave when subpixel; no shimmer at flock distances.
float fibreAA = 1.0-smoothstep(0.35,1.8,length(fwidth(fp)));
float fibres = feltNoise(fp) - 0.5;
float mottling = feltNoise(vFeltPosition*27.0)-0.5;
diffuseColor.rgb *= 0.985 + mottling*0.065 + fibres*${dark?'0.07':'0.15'}*fibreAA;
`);
 };
 m.customProgramCacheKey=()=> 'sheep-felt-v45-'+dark;
 return m;
}
// Merge with baked clump contact occlusion and subtle warm/cool variation.
export function merge(parts){let n=0;const gs=parts.map(([g,c,ctr])=>{const x=g.index?g.toNonIndexed():g;n+=x.attributes.position.count;return[x,c,ctr];});
 const P=new Float32Array(n*3),N=new Float32Array(n*3),Cc=new Float32Array(n*3);let o=0;
 for(let j=0;j<gs.length;j++){const[g,c,ctr]=gs[j],k=g.attributes.position.count;P.set(g.attributes.position.array,o*3);N.set(g.attributes.normal.array,o*3);const col=new THREE.Color(c||'#fff'),nn=g.attributes.normal.array;
  const tint=rng(j*37+19)(),out=new THREE.Vector3(...(ctr||[0,.5,0])).sub(new THREE.Vector3(0,.5,0));out.y*=.65;out.normalize();
  for(let i=0;i<k;i++){if(c)col.toArray(Cc,(o+i)*3);else{const nx=nn[i*3],ny=nn[i*3+1],nz=nn[i*3+2];
   const inward=Math.max(0,-(nx*out.x+ny*out.y+nz*out.z));
   const v=.98-.105*Math.max(0,-ny)-.115*inward+(tint-.5)*.035;
   Cc[(o+i)*3]=v;Cc[(o+i)*3+1]=v*(.992+tint*.006);Cc[(o+i)*3+2]=v*(.972+tint*.018);}}o+=k;}
 const m=new THREE.BufferGeometry();m.setAttribute('position',new THREE.BufferAttribute(P,3));m.setAttribute('normal',new THREE.BufferAttribute(N,3));m.setAttribute('color',new THREE.BufferAttribute(Cc,3));m.computeBoundingSphere();return m;}
// Smooth domain-warped displacement rather than random per-vertex spikes.
// IcosahedronGeometry is triangle soup: average normals across coincident
// vertices after computing the displaced surface, otherwise seams stay faceted.
function smoothNormals(g){g.computeVertexNormals();const p=g.attributes.position,n=g.attributes.normal,map=new Map(),keys=[];
 for(let i=0;i<p.count;i++){const key=[p.getX(i),p.getY(i),p.getZ(i)].map(x=>Math.round(x*1e5)).join(',');keys.push(key);let v=map.get(key);if(!v){v=new THREE.Vector3();map.set(key,v);}v.x+=n.getX(i);v.y+=n.getY(i);v.z+=n.getZ(i);}
 for(const v of map.values())v.normalize();for(let i=0;i<p.count;i++){const v=map.get(keys[i]);n.setXYZ(i,v.x,v.y,v.z);}return g;}
function lumpy(r,seed,det=3,amt=.14){const g=new THREE.IcosahedronGeometry(r,det),p=g.attributes.position;
 const ph=seed*1.731;for(let i=0;i<p.count;i++){const x=p.getX(i)/r,y=p.getY(i)/r,z=p.getZ(i)/r;
  const wx=x+.19*Math.sin(y*3+ph),wy=y+.16*Math.sin(z*3.7-ph),wz=z+.18*Math.sin(x*3.2+ph);
  const noise=.62*Math.sin(wx*3.1+ph)*Math.cos(wy*2.7-ph)*Math.sin(wz*2.9+1.3)+.27*Math.sin(wx*6.3+wy*3+ph)*Math.cos(wz*5.7-ph)+.11*Math.cos(wy*10.2+wz*8.1+ph);
  const f=1+amt*noise;p.setXYZ(i,x*r*f,y*r*f,z*r*f);}
 return smoothNormals(g);}
// compact flattened bean: low core + ring of irregular clumps around the equator & underside, few small flat ones on top
export const BODY={cy:.5,rx:.44,ry:.24,rz:.58};
export function woolGeo(seed=1,max=16,lamb=false,legs=null,det=3,withTail=false){const R=rng(seed*977+3);const parts=[];const{cy,rx,ry,rz}=BODY;
 const core=lumpy(1,seed,det,.08);core.scale(rx,ry,rz);core.translate(0,cy,0);parts.push([core]);
 const n=Math.min(max,13+Math.floor(R()*4));
 for(let i=0;i<n;i++){const a=i/n*Math.PI*2+(R()-.5)*.35,up=-.45+R()*.85;const r=.13+R()*.11;const e=Math.sqrt(1-up*up*.45);
  if(Math.sin(a)>.8&&up>.1)continue;// keep the brow clear for the face
  const g=lumpy(r,seed*31+i,det);g.scale(.88+R()*.28,.64+R()*.25,.88+R()*.3);g.rotateX((R()-.5)*.6);g.rotateZ((R()-.5)*.6);g.rotateY(R()*6.28);const ctr=[Math.cos(a)*rx*.8*e,cy+up*ry*.95,Math.sin(a)*rz*.8*e];g.translate(...ctr);parts.push([g,null,ctr]);}
 for(let i=0;i<4;i++){const g=lumpy(.17+R()*.05,seed*7+i,det);g.scale(.9+R()*.25,.5+R()*.15,1);g.rotateY(R()*6.28);g.rotateZ((R()-.5)*.3);const ctr=[(R()-.5)*.36,cy+ry*.78,(i-1.5)*.24+(R()-.5)*.06];g.translate(...ctr);parts.push([g,null,ctr]);}
 const t=lumpy(.13,seed+5,det);t.scale(1.15,.7,1);t.translate(0,cy+.13,rz*.86);parts.push([t]);// forelock overhang
 if(withTail){const tl=lumpy(.1,9,det);tl.scale(1,.9,1.2);tl.translate(TAIL_POS[0],TAIL_POS[1],TAIL_POS[2]-.04);parts.push([tl]);}
 if(lamb){for(const[g]of parts){g.translate(0,-cy,0);g.scale(.95,1.05,.88);g.translate(0,cy,0);}}
 if(legs)for(const q of LEGS){const g=LEG.clone();g.translate(...q);parts.push([g,legs]);}
 return merge(parts);}
export const TAIL_POS=[0,.56,-.66];
export const tailGeo=(()=>{const g=lumpy(.1,9,3);g.scale(1,.9,1.2);g.translate(0,0,-.04);return merge([[g]]);})();
// short sturdy legs, pivot at hip
export const LEG=(()=>{const g=new THREE.CylinderGeometry(.066,.052,.3,12,3);const p=g.attributes.position;
 for(let i=0;i<p.count;i++){const y=p.getY(i),f=1+.035*Math.sin(y*21);p.setX(i,p.getX(i)*f);p.setZ(i,p.getZ(i)*f);}g.translate(0,-.15,0);return smoothNormals(g);})();
export const LEGS=[[.2,.3,.3],[-.2,.3,.3],[.2,.3,-.3],[-.2,.3,-.3]];// FL FR BL BR
export const legGeo=(c='#2d2724')=>{const hoof=lumpy(1,8,2,.025);hoof.scale(.057,.037,.067);hoof.translate(0,-.275,.012);return merge([[LEG.clone(),c],[hoof,'#211e1c']]);};
// head: pivot at neck, pushed forward so the black muzzle peeks out past the wool from above
export const HEAD_PIVOT=[0,.55,.5];
export function headGeo(face='#2d2724'){const parts=[];
 const oval=(sc,pos,c,seed=77)=>{const g=lumpy(1,seed,3,.045);g.scale(...sc);g.translate(...pos);parts.push([g,c]);};
 // Brow, cheek/jaw and two softly divided muzzle pads, not a single blob.
 oval([.143,.152,.195],[0,-.015,.214],face);
 oval([.109,.101,.139],[0,-.068,.32],face,42);
 for(const side of[-1,1]){
  oval([.059,.06,.075],[side*.047,-.06,.393],face,32);
  // Flattened teardrop ear with a recessed warm inner felt panel.
  const e=lumpy(1,51,3,.06),p=e.attributes.position;
  for(let i=0;i<p.count;i++){const x=p.getX(i),t=(x+1)*.5;p.setXYZ(i,x*.143,p.getY(i)*.032*(.65+.35*Math.sin(t*Math.PI)),p.getZ(i)*.068*(.55+.45*Math.sin(t*Math.PI)));}
  smoothNormals(e);e.rotateZ(-side*.3);e.translate(side*.19,.055,.17);parts.push([e,face]);
  oval([.081,.009,.033],[side*.205,.079,.176],'#463c36',12);
  // Socket rims make the pale eyes sit within, rather than on top of, the face.
  oval([.034,.036,.026],[side*.091,.045,.337],'#201d1b',2);
  oval([.021,.024,.016],[side*.094,.049,.354],'#e9dfc9',4);
  oval([.009,.007,.004],[side*.052,-.033,.457],'#171614',6);
 }
 oval([.005,.027,.003],[0,-.08,.46],'#1d1a18',7);
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
 const woolMat=makeFeltMaterial(o.woolColor||WOOL.krem);const dark=makeFeltMaterial('#ffffff',true);
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
