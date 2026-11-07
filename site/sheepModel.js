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
  s.fragmentShader=s.fragmentShader.replace('#include <lights_lambert_pars_fragment>',THREE.ShaderChunk.lights_lambert_pars_fragment.replace('saturate( dot( geometryNormal, directLight.direction ) )','clamp( (dot( geometryNormal, directLight.direction ) + '+(dark?'.16':'.5')+') / '+(dark?'1.16':'1.5')+', 0.0, 1.0 )'));
  s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
vec3 fp = vFeltPosition * 155.0;
// Fade the fibre octave when subpixel; no shimmer at flock distances.
float fibreAA = 1.0-smoothstep(0.35,1.8,length(fwidth(fp)));
float fibres = feltNoise(fp) - 0.5;
float mottling = feltNoise(vFeltPosition*27.0)-0.5;
float feltAA = 1.0-smoothstep(0.2,1.4,length(fwidth(vFeltPosition*62.0)));
float nap = feltNoise(vFeltPosition*62.0 + vec3(mottling*0.8))-0.5;
diffuseColor.rgb *= 0.987 + mottling*0.052 + nap*${dark?'0.025':'0.085'}*feltAA + fibres*${dark?'0.07':'0.14'}*fibreAA;
`);
 };
 m.customProgramCacheKey=()=> 'sheep-felt-v47-'+dark;
 return m;
}
// Merge with baked clump contact occlusion and subtle warm/cool variation.
export function merge(parts){let n=0;const gs=parts.map(([g,c,ctr])=>{const x=g.index?g.toNonIndexed():g;n+=x.attributes.position.count;return[x,c,ctr];});
 const P=new Float32Array(n*3),N=new Float32Array(n*3),Cc=new Float32Array(n*3);let o=0;
 for(let j=0;j<gs.length;j++){const[g,c,ctr]=gs[j],k=g.attributes.position.count;P.set(g.attributes.position.array,o*3);N.set(g.attributes.normal.array,o*3);const col=new THREE.Color(c&&c!=='attr'?c:'#fff'),nn=g.attributes.normal.array;
  const tint=rng(j*37+19)(),out=new THREE.Vector3(...(ctr||[0,.5,0])).sub(new THREE.Vector3(0,.5,0));out.y*=.65;out.normalize();
  const ca=c==='attr'?g.attributes.color.array:null;for(let i=0;i<k;i++){if(ca){Cc.set(ca.subarray(i*3,i*3+3),(o+i)*3);}else if(c)col.toArray(Cc,(o+i)*3);else{const nx=nn[i*3],ny=nn[i*3+1],nz=nn[i*3+2];
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
// FUSED wool: one watertight star-shaped hull. Clumps are ellipsoid SDF blobs
// combined with a smooth-min, so they become hills/valleys of ONE surface (no
// sphere outlines or intersection rings). Rays from the body centre are solved
// by bisection, normals are averaged on the shared index, and valley AO is baked
// from discrete mean curvature into vertex colours.
function smin(a,b,k){const h=Math.max(k-Math.abs(a-b),0)/k;return Math.min(a,b)-h*h*k*.25;}
function blobSdf(bl,x,y,z){let d=1e9;for(const q of bl){const dx=(x-q[0])/q[3],dy=(y-q[1])/q[4],dz=(z-q[2])/q[5];const m=Math.min(q[3],q[4],q[5]);d=smin(d,(Math.sqrt(dx*dx+dy*dy+dz*dz)-1)*m,q[6]);}return d;}
function fbm(x,y,z,ph){const wx=x+.3*Math.sin(y*7+ph),wy=y+.3*Math.sin(z*6-ph),wz=z+.3*Math.sin(x*7.5+ph);
 return .55*Math.sin(wx*13+ph)*Math.cos(wy*11-ph)*Math.sin(wz*12+1.3)+.3*Math.sin(wx*23+wy*9+ph)*Math.cos(wz*21-ph)+.15*Math.cos(wy*41+wz*33+ph);}
export function woolGeo(seed=1,max=16,lamb=false,legs=null,det=3,withTail=false){const R=rng(seed*977+3);const{cy,rx,ry,rz}=BODY;const bl=[];
 // Tighter cotton-nub hills, fused well below the surface. The low bean core
 // remains the silhouette; none of these contributors is a separate mesh.
 const K=.058;bl.push([0,cy,0,rx*.94,ry*.95,rz*.94,.075]);
 const n=Math.min(max+6,22+Math.floor(R()*3));
 for(let i=0;i<n;i++){const a=i/n*Math.PI*2+(R()-.5)*.19,up=-.35+R()*.62;const r=.115+R()*.05;const e=Math.sqrt(1-up*up*.45);
  bl.push([Math.cos(a)*rx*.86*e,cy+up*ry,Math.sin(a)*rz*.85*e,r*(.92+R()*.14),r*(.73+R()*.12),r*(.95+R()*.14),K]);}
 // Final polish: irregular equal-area cap avoids rows and a broad hat-like
 // crown. These smaller hills are still fused into the low oval silhouette.
 for(let i=0;i<32;i++){
  const u=.22+.76*(i+.5)/32,a=i*2.399963+(R()-.5)*.24,e=Math.sqrt(1-u*u);
  const x=Math.cos(a)*rx*e*.88,z=Math.sin(a)*rz*e*.88;
  const r=.102+R()*.025;bl.push([x,cy+u*ry*.85,z,r*(.93+R()*.12),r*(.69+R()*.12),r*(.96+R()*.15),.048]);}
 // Forelock and tapered cheek/chest grow from the hull, not a hat rim.
 bl.push([0,cy+.105,rz*.83,.143,.09,.145,.085]);
 for(const side of[-1,1])bl.push([side*.112,cy-.04,rz*.8,.095,.14,.115,.07]);
 if(withTail){
  // Broad buried root, tapering to a short folded tip; same watertight hull.
  bl.push([0,cy+.015,-rz*.91,.13,.10,.145,.085]);
  bl.push([0,cy+.035,-rz*1.08,.078,.065,.102,.07]);
 }
 if(lamb)for(const q of bl){q[0]*=.95;q[1]=(q[1]-cy)*1.05+cy;q[2]*=.88;q[3]*=.95;q[4]*=1.05;q[5]*=.88;}
 const res=Math.max(10,det>=3?44:det>=2?22:16);
 const g0=new THREE.IcosahedronGeometry(1,res);const pp=g0.attributes.position;const vmap=new Map(),idx=[],V=[];
 for(let i=0;i<pp.count;i++){const k=[pp.getX(i),pp.getY(i),pp.getZ(i)].map(x=>Math.round(x*1e5)).join(',');let j=vmap.get(k);if(j===undefined){j=V.length/3;vmap.set(k,j);V.push(pp.getX(i),pp.getY(i),pp.getZ(i));}idx.push(j);}
 const puffs=[];{const Q=rng(seed*131+7);for(let i=0;i<260;i++){const u=Q()*2-1,a=Q()*6.28,w=Math.sqrt(1-u*u);const sg=.0025+Q()*.004;puffs.push([w*Math.cos(a),u,w*Math.sin(a),.028+Q()*.035,sg]);}}
 const nv=V.length/3,P=new Float32Array(nv*3),ph=seed*1.37;
 for(let j=0;j<nv;j++){let dx=V[j*3],dy=V[j*3+1],dz=V[j*3+2];let lo=0,hi=1.3;
  for(let it=0;it<26;it++){const m=(lo+hi)/2;if(blobSdf(bl,dx*m,cy+dy*m,dz*m)<0)lo=m;else hi=m;}
  let r=lo,bump=0;for(const q of puffs){const dd=dx*q[0]+dy*q[1]+dz*q[2];if(dd>.9){const a2=(1-dd)*2;bump+=q[3]*Math.exp(-a2/q[4]);}}r*=1+Math.min(.065,bump)+.004*fbm(dx,dy,dz,ph);P[j*3]=dx*r;P[j*3+1]=cy+dy*r;P[j*3+2]=dz*r;}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(P,3));g.setIndex(idx);g.computeVertexNormals();
 // curvature: offset of vertex from its neighbour average along the normal
 const nb=new Float32Array(nv*3),cnt=new Float32Array(nv);for(let t=0;t<idx.length;t+=3)for(let e=0;e<3;e++){const a=idx[t+e],b=idx[t+(e+1)%3];for(let c=0;c<3;c++){nb[a*3+c]+=P[b*3+c];nb[b*3+c]+=P[a*3+c];}cnt[a]++;cnt[b]++;}
 const N=g.attributes.normal.array,cv=new Float32Array(nv);
 for(let j=0;j<nv;j++){let d=0;for(let c=0;c<3;c++)d+=(P[j*3+c]-nb[j*3+c]/cnt[j])*N[j*3+c];cv[j]=d;}
 // blur curvature twice so AO reads as soft folds
 for(let pass=0;pass<3;pass++){const s2=new Float32Array(nv),c2=new Float32Array(nv);for(let t=0;t<idx.length;t+=3)for(let e=0;e<3;e++){const a=idx[t+e],b=idx[t+(e+1)%3];s2[a]+=cv[b];s2[b]+=cv[a];c2[a]++;c2[b]++;}for(let j=0;j<nv;j++)cv[j]=cv[j]*.4+.6*s2[j]/c2[j];}
 const sc=1/(.0033*44/res);const C=new Float32Array(nv*3);
 for(let j=0;j<nv;j++){const k=Math.max(-1,Math.min(1,cv[j]*sc));const ny=N[j*3+1];
  const v=.955+.045*Math.max(0,k)-.20*Math.max(0,-k)-.075*Math.max(0,-ny);
  C[j*3]=v*(1+.012*Math.max(0,k)-.018*Math.max(0,-k));C[j*3+1]=v*.99;C[j*3+2]=v*(.97+.012*Math.max(0,-k));}
 g.setAttribute('color',new THREE.BufferAttribute(C,3));
 const parts=[[g.toNonIndexed(),'attr']];
 if(legs)for(const q of LEGS){const l=LEG.clone();l.translate(...q);parts.push([l,legs]);}
 return merge(parts);}
// Workshop tail wag is a local deformation of the same continuous hull.
// The buried root has zero weight, so there is no moving seam or glued-on ball.
function addTailMorph(g){const p=g.attributes.position,t=p.clone();
 for(let i=0;i<p.count;i++){const z=p.getZ(i),w=sm((-z-.47)/.28);t.setX(i,p.getX(i)+(-z-.47)*w*.8);}
 const ng=g.clone();ng.setAttribute('position',t);smoothNormals(ng);
 g.morphAttributes.position=[t];g.morphAttributes.normal=[ng.attributes.normal.clone()];ng.dispose();return g;}
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
const _wg={};export function sharedWool(seed,lamb){const k=seed+'_'+lamb;return _wg[k]||(_wg[k]=addTailMorph(woolGeo(seed,16,lamb,null,3,true)));}
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
 const head=new THREE.Group();head.position.set(...HEAD_PIVOT);head.add(new THREE.Mesh(sharedHead(face),dark));body.add(head);
 const lg=legGeo(face);const legs=LEGS.map(p=>{const l=new THREE.Mesh(lg,dark);l.position.set(...p);body.add(l);return l;});
 g.traverse(m=>{if(m.isMesh){m.castShadow=true;m.receiveShadow=true;}});
 const sc=(o.scale||1)*(o.isLamb?.66:1);g.scale.setScalar(sc);if(o.isLamb){head.scale.setScalar(1.32);}
 g.userData={body,fluff,head,legs,wool,woolMat,u:newPoseState(seed+Math.random()*9),state:'idle'};return g;}
export function setWool(sh,c){sh.userData.woolMat.color.set(c);}
// state: idle | graze | walk | hop
export function updateSheep(sh,state,dt,speed=1){const d=sh.userData;d.state=state;const P=solvePose(d.u,state,dt,speed);
 d.body.position.y=P.y;d.body.rotation.set(P.pitch,0,P.roll);d.fluff.scale.set(P.sx,P.sy,P.sx);
 d.head.position.set(HEAD_PIVOT[0],HEAD_PIVOT[1]*P.sy+P.hy,HEAD_PIVOT[2]+P.hz);d.head.rotation.set(P.hp,P.hyaw,P.hroll,'YXZ');
 d.wool.morphTargetInfluences[0]=P.tail;
 d.legs.forEach((l,i)=>{l.rotation.x=P.legs[i];l.scale.y=Math.max(.6,1+Math.min(0,P.y)/.3)*(1-P.tuck*.25);});
 return P;}
