// Kağıt Kuş — tarla, çiçek yaması, saman balyası, orman tabanı (kağıt/keçe).
// Orijin: zemin teması y=0, merkez (0,0). +Y yukarı. opts: {kind|biome, scale, seed, w, d}
import * as THREE from 'three';
import {makeFeltMaterial} from './sheepModel.js';
export const FIELD_KINDS=['rice','autumn','pampa','savanna','mustard','flowers','forest'];
export const BIOME_KIND=['rice','autumn','pampa','savanna','mustard','forest'];
export const FIELD_PALETTES={
 rice:{soil:'#8a7458',berm:'#9b8562',water:'#8fb3a8',crop:['#9ccb62','#b2d873','#88bb56']},
 autumn:{soil:'#9a6f4a',berm:'#a98058',crop:['#e6b452','#d79a40','#efc76a'],furrow:'#93684a'},
 pampa:{soil:'#7d7048',berm:'#8f8256',crop:['#86b558','#97c463','#78a84c'],hay:['#e3c27a','#d6b061','#ecd08e']},
 savanna:{soil:'#a7865a',berm:'#b49468',crop:['#d8bf78','#ccb064','#e3cc8a'],seed:'#d9bd7c'},
 mustard:{soil:'#87714f',berm:'#97825e',crop:['#7fa24a','#8cb052'],bloom:['#f2cf3a','#f6db58','#e8bf2a']},
 flowers:{soil:'#7f9a5a',berm:'#8aa462',crop:['#7fae55','#6c9a48'],bloom:['#f2a7b5','#f7ead2','#f4d35e','#eb8fa3']},
 forest:{soil:'#6f6a48',berm:'#7c7550',crop:['#6f9e4c','#5c8c42','#82ad58'],cap:['#c8573f','#d9a26a','#b9653f'],stem:'#f1e6cf',gill:'#e8d4b4'}
};
export function rng(s){s=(s>>>0)||1;return()=>((s=Math.imul(s^s>>>15,1|s)+0x6d2b79f5|0,((s^s>>>14)>>>0)/4294967296));}
export const fieldUniforms={uTime:{value:0},uWind:{value:1}};
const kindOf=o=>o.kind||BIOME_KIND[Math.max(0,Math.min(5,o.biome??0))];
const mats={};
function swayMat(key,amp=1,dark=false){
 if(mats[key])return mats[key];const m=makeFeltMaterial('#ffffff',dark);m.side=THREE.DoubleSide;const prev=m.onBeforeCompile;
 m.onBeforeCompile=s=>{prev(s);s.uniforms.uTime=fieldUniforms.uTime;s.uniforms.uWind=fieldUniforms.uWind;
  s.vertexShader='uniform float uTime;uniform float uWind;\n'+s.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
#ifdef USE_INSTANCING
 vec2 wp=instanceMatrix[3].xz;
#else
 vec2 wp=modelMatrix[3].xz;
#endif
 float h=max(position.y,0.0);float ph=uTime*1.7+wp.x*.55+wp.y*.38;
 transformed.x+=(sin(ph)*.6+sin(ph*2.3+1.)*.25)*h*h*${(0.35*amp).toFixed(3)}*uWind;
 transformed.z+=cos(ph*.8)*h*h*${(0.18*amp).toFixed(3)}*uWind;`);};
 m.customProgramCacheKey=()=> 'field-sway-'+key+dark;return mats[key]=m;}
function paperMat(key,dark=false){if(!mats[key]){mats[key]=makeFeltMaterial('#ffffff',dark);}return mats[key];}
// --- tiny geometry helpers (non-indexed merge with vertex colours)
function paint(g,c){g=g.index?g.toNonIndexed():g;const col=new THREE.Color(c),n=g.attributes.position.count,a=new Float32Array(n*3);for(let i=0;i<n;i++)col.toArray(a,i*3);g.setAttribute('color',new THREE.BufferAttribute(a,3));g.deleteAttribute('uv');return g;}
function merge(list){let n=0;for(const g of list)n+=g.attributes.position.count;const p=new Float32Array(n*3),no=new Float32Array(n*3),c=new Float32Array(n*3);let o=0;for(const g of list){p.set(g.attributes.position.array,o*3);no.set(g.attributes.normal.array,o*3);c.set(g.attributes.color.array,o*3);o+=g.attributes.position.count;}const r=new THREE.BufferGeometry();r.setAttribute('position',new THREE.BufferAttribute(p,3));r.setAttribute('normal',new THREE.BufferAttribute(no,3));r.setAttribute('color',new THREE.BufferAttribute(c,3));return r;}
// Folded paper blade: a thin tapered V-crease, base y=0.
function blade(h,w,lean,rot,c,tip){const g=new THREE.BufferGeometry(),v=[0,0,-w,0,0,w,lean,h,0, 0,0,-w,0,.0,0,lean,h,0];
 const p=[-w,0,0, 0,0,w*.6, lean*.8,h,0, 0,0,w*.6, w,0,0, lean*.8,h,0];g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.computeVertexNormals();const cs=[];const a=new THREE.Color(c),b=new THREE.Color(tip||c);for(const k of [0,0,1,0,0,1]){(k?b:a).toArray(cs,cs.length);}g.setAttribute('color',new THREE.Float32BufferAttribute(cs,3));g.rotateY(rot);return g;}
function tuft(n,h,w,c,tip,seed=3){const r=rng(seed),l=[];for(let i=0;i<n;i++){const rot=i/n*Math.PI*2+r()*.5;l.push(blade(h*(.75+r()*.4),w,h*(.18+r()*.2),rot,c,tip));}return merge(l);}
// Fused cut-paper blossom: one flat star-petal sheet + raised centre button.
const petalCache={};
function blossomGeo(petals=5,rad=.12,center='#f3c745',petal='#ffffff'){const k=petals+rad+center+petal;if(petalCache[k])return petalCache[k];const sh=new THREE.Shape();const N=petals*16;for(let i=0;i<=N;i++){const a=i/N*Math.PI*2,f=Math.abs(Math.sin(a*petals/2));const rr=rad*(.42+.58*Math.pow(f,.6));const x=Math.cos(a)*rr,y=Math.sin(a)*rr;i?sh.lineTo(x,y):sh.moveTo(x,y);}
 const pg=new THREE.ExtrudeGeometry(sh,{depth:.008,bevelEnabled:false,curveSegments:2});pg.rotateX(-Math.PI/2);
 // cup the petals slightly
 const pp=pg.attributes.position;for(let i=0;i<pp.count;i++){const x=pp.getX(i),z=pp.getZ(i);pp.setY(i,pp.getY(i)+(x*x+z*z)/(rad*rad)*rad*.35);}pg.computeVertexNormals();
 const cg=new THREE.SphereGeometry(rad*.3,8,4,0,Math.PI*2,0,Math.PI/2);cg.scale(1,.55,1);cg.translate(0,.01,0);
 const stem=new THREE.CylinderGeometry(.006,.009,1,4,1,true);stem.translate(0,-.5,0);
 return petalCache[k]=[merge([paint(pg,petal)]),merge([paint(cg,center),paint(stem,'#6f9a48')])];}
function inst(geo,mat,n){const m=new THREE.InstancedMesh(geo,mat,n);m.castShadow=true;m.receiveShadow=true;return m;}
const _o=new THREE.Object3D();
function put(m,i,x,y,z,s=1,ry=0,c){_o.position.set(x,y,z);_o.rotation.set(0,ry,0);_o.scale.setScalar(s);_o.updateMatrix();m.setMatrixAt(i,_o.matrix);if(c)m.setColorAt(i,new THREE.Color(c));}
// Contact shadow
let contactTex;function contact(w,d,op=.2){if(!contactTex){const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d'),g=x.createRadialGradient(64,64,10,64,64,64);g.addColorStop(0,'rgba(40,46,30,1)');g.addColorStop(.6,'rgba(40,46,30,.55)');g.addColorStop(1,'rgba(40,46,30,0)');x.fillStyle=g;x.fillRect(0,0,128,128);contactTex=new THREE.CanvasTexture(c);}const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),new THREE.MeshBasicMaterial({map:contactTex,transparent:true,opacity:op,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.y=.004;m.renderOrder=-1;return m;}
// Low rounded dirt berm frame
function berm(w,d,c,h=.12){const l=[];const ridge=(len,x,z,ry)=>{const g=new THREE.CylinderGeometry(h,h*1.25,len,8,1,false,0,Math.PI);g.rotateZ(Math.PI/2);g.rotateX(0);g.scale(1,1,1);g.rotateY(ry);g.translate(x,0,z);return paint(g,c);};
 // half-cylinders lying flat (dome up)
 const mk=(len,x,z,ry)=>{const g=new THREE.CylinderGeometry(h*1.3,h*1.3,len,10,1,false,-Math.PI/2,Math.PI);g.rotateZ(Math.PI/2);g.scale(1,.7,1);g.rotateY(ry);g.translate(x,0,z);return paint(g,c);};
 l.push(mk(w+h*2,0,-d/2,0),mk(w+h*2,0,d/2,0),mk(d,-w/2,0,Math.PI/2),mk(d,w/2,0,Math.PI/2));
 const m=new THREE.Mesh(merge(l),paperMat('paper'));m.castShadow=m.receiveShadow=true;return m;}
function bed(w,d,c,y=.03){const g=new THREE.BoxGeometry(w,y*2,d,1,1,1);const m=new THREE.Mesh(paint(g,c),paperMat('paper'));m.receiveShadow=true;return m;}
// ---------- PLOT
export function createPlot(opts={}){const kind=kindOf(opts),P=FIELD_PALETTES[kind],r=rng(opts.seed??7),w=opts.w??6,d=opts.d??4.4,G=new THREE.Group();G.name='plot-'+kind;G.userData={kind,width:w,depth:d,height:.6};
 G.add(contact(w*1.25,d*1.35,.3));if(kind!=='rice')G.add(berm(w,d,P.berm));
 if(kind==='flowers'||kind==='forest'){const inner=kind==='flowers'?createFlowerPatch({...opts,w,d,scale:1,noBase:1}):createForestFloor({...opts,w,d,scale:1,noBase:1});G.add(bed(w,d,P.soil,.025),inner);}
 else if(kind==='rice'){// three stepped, flooded paddies (terraces), each with its own dyke
  const n=3,pd=d/n,watM=new THREE.MeshLambertMaterial({color:P.water,transparent:true,opacity:.9});const cols=Math.floor(w/.26),rows=Math.max(2,Math.floor(pd/.3)),geo=tuft(5,.24,.02,'#a8b29a','#ffffff',11),m=inst(geo,swayMat('rice',.8),rows*cols*n);let i=0;
  for(let t=0;t<n;t++){const y0=(n-1-t)*.11,z0=-d/2+pd*(t+.5),T=new THREE.Group();T.position.set(0,y0,z0);
   if(y0>0){const wall=new THREE.Mesh(paint(new THREE.BoxGeometry(w+.2,y0,pd+.1),P.soil),paperMat('paper'));wall.position.y=-y0/2;wall.castShadow=wall.receiveShadow=true;T.add(wall);}
   T.add(berm(w,pd,P.berm,.09));const wat=new THREE.Mesh(new THREE.PlaneGeometry(w,pd),watM);wat.rotation.x=-Math.PI/2;wat.position.y=.04;wat.receiveShadow=true;T.add(wat);T.add(bed(w,pd,P.soil,.015));G.add(T);
   for(let a=0;a<rows;a++)for(let b=0;b<cols;b++)put(m,i++,-w/2+.2+b*(w-.4)/(cols-1)+(r()-.5)*.03,y0+.03,z0-pd/2+.18+a*(pd-.36)/(rows-1),.85+r()*.3,r()*6,P.crop[i%3]);}
  G.add(m);G.userData.height=.6;}
 else{G.add(bed(w,d,P.soil,.03));const rowsN=Math.floor(d/.42);const furrow=[];for(let a=0;a<rowsN;a++){const z=-d/2+.25+a*(d-.5)/(rowsN-1);const g=new THREE.CylinderGeometry(.09,.09,w-.25,6,1,false,-Math.PI/2,Math.PI);g.rotateZ(Math.PI/2);g.scale(1,.6,1);g.translate(0,.05,z);furrow.push(paint(g,P.furrow||P.soil));}const fm=new THREE.Mesh(merge(furrow),paperMat('paper'));fm.receiveShadow=fm.castShadow=true;G.add(fm);
  const spec={autumn:[4,.2,.03,'#b8a890','#ffffff'],pampa:[7,.42,.026,'#a8b29a','#ffffff'],savanna:[5,.55,.02,'#c0b49c','#ffffff'],mustard:[6,.36,.026,'#a8b29a','#ffffff']}[kind];
  const per=Math.floor(w/(kind==='autumn'?.11:.24)),geo=tuft(spec[0],spec[1],spec[2],spec[3],spec[4],5),m=inst(geo,swayMat(kind,kind==='autumn'?.2:1),rowsN*per);let i=0;const pos=[];
  for(let a=0;a<rowsN;a++)for(let b=0;b<per;b++){const x=-w/2+.2+b*(w-.4)/(per-1)+(r()-.5)*.06,z=-d/2+.25+a*(d-.5)/(rowsN-1)+(r()-.5)*.05;pos.push([x,z]);put(m,i++,x,.07,z,.8+r()*.45,r()*6,P.crop[Math.floor(r()*P.crop.length)]);}G.add(m);
  if(kind==='savanna'){const sg=new THREE.CapsuleGeometry(.012,.09,2,4);sg.rotateZ(-.5);sg.translate(.03,.6,0);const st=new THREE.CylinderGeometry(.004,.006,.6,3,1,true);st.translate(0,.3,0);st.rotateZ(-.08);const sm=inst(merge([paint(sg,P.seed),paint(st,'#c9ad6a')]),swayMat('savanna',1),pos.length);pos.forEach((p,j)=>put(sm,j,p[0],.07,p[1],.85+r()*.3,r()*6));G.add(sm);}
  if(kind==='mustard'){const bm=inst(mustardHead(),swayMat('mustardhead',1),pos.length);pos.forEach((p,j)=>put(bm,j,p[0],.07,p[1],.8+r()*.4,r()*6,P.bloom[j%3]));G.add(bm);}
  if(kind==='autumn'){const st=inst(stookGeo(),paperMat('paper'),6);for(let j=0;j<6;j++)put(st,j,-w/2+.8+(j%3)*(w-1.6)/2+(r()-.5)*.3,.05,(j<3?-1:1)*d*.22,.9+r()*.25,r()*6);G.add(st);}
  if(kind==='pampa'&&opts.hay!==false){const h=createHayBale({seed:(opts.seed??7)+3,group:3});h.position.set(w*.5+.9,0,d*.15);G.add(h);}}
 G.scale.setScalar(opts.scale??1);return G;}
function stookGeo(){// four tied sheaves leaning into a tent, cut-paper ears on top
 const l=[];for(let i=0;i<4;i++){const a=i/4*Math.PI*2+.4;const g=new THREE.CylinderGeometry(.05,.065,.38,7,1);g.translate(0,.19,0);g.rotateZ(.28);g.translate(-.02,0,0);g.rotateY(a);l.push(paint(g,i%2?'#e2bb62':'#d3a650'));
  const e=new THREE.ConeGeometry(.07,.12,7);e.translate(0,.42,0);e.rotateZ(.28);e.rotateY(a);l.push(paint(e,'#efd07e'));
  const t=new THREE.TorusGeometry(.055,.01,3,10);t.rotateX(Math.PI/2);t.translate(0,.27,0);t.rotateZ(.28);t.rotateY(a);l.push(paint(t,'#9a6b3c'));}
 return merge(l);}
function mustardHead(){const l=[];const r=rng(4);for(let i=0;i<5;i++){const a=i/5*Math.PI*2,rr=i?0.05:0;const s=new THREE.SphereGeometry(.035,6,3,0,Math.PI*2,0,Math.PI/2);s.scale(1.25,.5,1.25);s.translate(Math.cos(a)*rr*1.3,.38+r()*.04-(i?0.02:0),Math.sin(a)*rr*1.3);l.push(paint(s,'#ffffff'));}
 return merge(l);}
// ---------- FLOWERS
export function createFlowerPatch(opts={}){const r=rng(opts.seed??9),w=opts.w??3.2,d=opts.d??2.4,P=FIELD_PALETTES.flowers,G=new THREE.Group();G.name='flower-patch';G.userData={kind:'flowers',width:w,depth:d,height:.4};
 if(!opts.noBase){G.add(contact(w*1.2,d*1.2,.16));}
 const ell=()=>{let x,z;do{x=r()-.5;z=r()-.5;}while(x*x+z*z>.2);return[x*w*.95,z*d*.95];};const n=Math.round(w*d*7),grass=inst(tuft(6,.22,.024,'#a8b29a','#ffffff',8),swayMat('fgrass',1),Math.round(n*1.3));for(let i=0;i<grass.count;i++){const e=ell();put(grass,i,e[0],0.02,e[1],.7+r()*.5,r()*6,P.crop[i%2]);}G.add(grass);
 const [geo,cgeo]=blossomGeo(5,.1,'#f2c13c','#ffffff'),m=inst(geo,swayMat('bloom',1),n),cm=inst(cgeo,swayMat('bloom',1),n);for(let i=0;i<n;i++){const y=.2+r()*.14,e=ell();_o.position.set(e[0]*.92,y,e[1]*.92);_o.rotation.set((r()-.5)*.4,r()*6,(r()-.5)*.4);_o.scale.set(1,y,1).multiplyScalar(1);_o.scale.set(.9+r()*.4,y*1.0,.9+r()*.4);_o.updateMatrix();m.setMatrixAt(i,_o.matrix);cm.setMatrixAt(i,_o.matrix);m.setColorAt(i,new THREE.Color(P.bloom[Math.floor(r()*P.bloom.length)]));}G.add(m,cm);
 G.add(bedPatch(w,d,P.soil));
 G.scale.setScalar(opts.scale??1);return G;}
function bedPatch(w,d,c){const g=new THREE.CircleGeometry(.5,28);g.rotateX(-Math.PI/2);const p=g.attributes.position,r=rng(21);for(let i=1;i<p.count;i++){const k=.95+.05*Math.sin(i*.7+r()*.6);p.setX(i,p.getX(i)*w*k);p.setZ(i,p.getZ(i)*d*k);}const m=new THREE.Mesh(paint(g,c),paperMat('paper'));m.position.y=.012;m.receiveShadow=true;return m;}
// ---------- HAY BALES
export function createHayBale(opts={}){const r=rng(opts.seed??5),P=FIELD_PALETTES.pampa,n=opts.group??1,G=new THREE.Group();G.name='hay';
 const round=()=>{const R=.42,L=.62,l=[];const body=new THREE.CylinderGeometry(R,R,L,20,6);body.rotateZ(Math.PI/2);l.push(paint(body,P.hay[0]));
  // rolled face rings
  for(const s of [-1,1])for(let k=0;k<4;k++){const t=new THREE.TorusGeometry(R*(.2+k*.2),.012,3,20);t.rotateY(Math.PI/2);t.translate(s*(L/2+.003),0,0);l.push(paint(t,k%2?P.hay[1]:'#c99f52'));}
  for(const x of [-.17,.17]){const b=new THREE.TorusGeometry(R+.006,.014,3,24);b.rotateY(Math.PI/2);b.translate(x,0,0);l.push(paint(b,'#9a6b3c'));}
  const g=merge(l);g.translate(0,R,0);return g;};
 const square=()=>{const l=[],W=.78,H=.4,D=.46;const b=new THREE.BoxGeometry(W,H,D,6,3,3);const p=b.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);const k=1-.08*Math.pow(Math.abs(y)/(H/2),4)-.05*Math.pow(Math.abs(z)/(D/2),4);p.setXYZ(i,x*(1-.03*Math.pow(Math.abs(y/(H/2)),3)),y*k,z*k);}b.computeVertexNormals();l.push(paint(b,P.hay[2]));
  for(const x of [-.2,.2]){const t=new THREE.BoxGeometry(.022,H+.012,D+.012);t.translate(x,0,0);l.push(paint(t,'#9a6b3c'));}
  // straw ends: cut-paper fringe on the two short faces
  for(const sx of [-1,1])for(let k=0;k<9;k++){const f=new THREE.PlaneGeometry(.05,H*.8);f.rotateY(Math.PI/2+(k%2?.25:-.25));f.translate(sx*(W/2+.004),0,-D/2+.06+k*(D-.12)/8);l.push(paint(f,P.hay[1]));}
  const g=merge(l);g.translate(0,H/2,0);return g;};
 const geos=[round(),round(),square()],mat=paperMat('paper');for(let i=0;i<n;i++){const geo=opts.square?geos[2]:geos[i%3];const m=new THREE.Mesh(geo,mat);m.castShadow=m.receiveShadow=true;const L=[[-.5,-.1,.15],[.55,-.55,-.25],[.15,.8,1.25]][i%3];m.position.set(L[0],0,L[1]);m.rotation.y=L[2]+(r()-.5)*.2;G.add(m);}
 G.add(contact(2,1.8,.25));G.userData={kind:'hay',width:1.6,depth:1.4,height:.84};G.scale.setScalar(opts.scale??1);return G;}
// ---------- FOREST FLOOR
function frondGeo(len=.5){const l=[];const segs=11;for(let s=0;s<segs;s++){const t=s/segs,t2=(s+1)/segs;const wd=Math.sin(Math.PI*(t*.85+.1))*.075;const y=f=>Math.sin(f*Math.PI*.8)*len*.45,z=f=>f*len;
  for(const side of [-1,1]){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([0,y(t),z(t), side*wd,y(t)+.02,z(t)+len/segs*.9, 0,y(t2),z(t2)],3));g.computeVertexNormals();l.push(paint(g,s%2?'#d6e0c8':'#ffffff'));}}
 return merge(l);}
export function createForestFloor(opts={}){const r=rng(opts.seed??13),w=opts.w??3.4,d=opts.d??2.6,P=FIELD_PALETTES.forest,G=new THREE.Group();G.name='forest-floor';G.userData={kind:'forest',width:w,depth:d,height:.45};
 if(!opts.noBase)G.add(contact(w*1.2,d*1.2,.18));
 const fern=(()=>{const l=[],f=frondGeo(.5);for(let i=0;i<7;i++){const g=f.clone();g.rotateY(i/7*Math.PI*2);l.push(g);}return merge(l);})();
 const nf=Math.round(w*d*1.2),fm=inst(fern,swayMat('fern',.6),nf);const ell=()=>{let x,z;do{x=r()-.5;z=r()-.5;}while(x*x+z*z>.16);return[x*w,z*d];};for(let i=0;i<nf;i++){const e=ell();put(fm,i,e[0],0,e[1],.6+r()*.5,r()*6,P.crop[i%3]);}G.add(fm);
 const [capG,ribG,stemG0]=mushGeo(),stemG=merge([stemG0,ribG]),nm=Math.round(w*d*.8),mm=inst(capG,paperMat('paper'),nm),ms=inst(stemG,paperMat('paper'),nm);for(let i=0;i<nm;i++){const cc=[[-.22,-.12],[.18,.1],[-.05,.22],[.25,-.18]][i%4],e=[cc[0]*w+(r()-.5)*.5,cc[1]*d+(r()-.5)*.4],cl=e[0],cz=e[1],sc=.6+r()*.7,ry=r()*6;put(mm,i,cl,0,cz,sc,ry,P.cap[i%3]);put(ms,i,cl,0,cz,sc,ry);}G.add(mm,ms);
 if(!opts.noBase)G.add(bedPatch(w,d,'#7d8a52'));
 {const lg=new THREE.CircleGeometry(.06,5);lg.scale(1,.55,1);lg.rotateX(-Math.PI/2);const nl=Math.round(w*d*6),lm=inst(paint(lg,'#ffffff'),paperMat('paper'),nl);const LC=['#b9824a','#a5703f','#c99a55','#8c8a4a'];for(let i=0;i<nl;i++){const e=ell();put(lm,i,e[0]*1.1,.016+i*1e-5,e[1]*1.1,.7+r()*.6,r()*6,LC[i%4]);}lm.castShadow=false;G.add(lm);}
 G.scale.setScalar(opts.scale??1);return G;}
function mushGeo(){const stem=new THREE.LatheGeometry([new THREE.Vector2(.035,0),new THREE.Vector2(.03,.1),new THREE.Vector2(.026,.16)],8);
 const cap=new THREE.LatheGeometry([new THREE.Vector2(.03,.15),new THREE.Vector2(.11,.15),new THREE.Vector2(.115,.17),new THREE.Vector2(.08,.23),new THREE.Vector2(0,.25)],12);
 const gills=new THREE.LatheGeometry([new THREE.Vector2(.028,.152),new THREE.Vector2(.108,.152)],24);
 // stem/gills fixed cream (white vertex colour * instance colour => tint) — keep cap white so instance colour tints only cap? use darker baked values.
 const ribs=[];for(let k=0;k<12;k++){const g=new THREE.BoxGeometry(.075,.012,.004);g.translate(.068,.145,0);g.rotateY(k/12*Math.PI*2);ribs.push(paint(g,'#b89a72'));}
 return [merge([paint(cap,'#ffffff')]),merge(ribs),merge([paint(stem,P_STEM),paint(gills,P_GILL)])];}
const P_STEM='#f1e6cf',P_GILL='#d9c09a';
export const createField=createPlot;
export function updateField(obj,t,wind=1){fieldUniforms.uTime.value=t;fieldUniforms.uWind.value=wind;}
export const updatePlot=updateField,updateFlowerPatch=updateField,updateForestFloor=updateField;
