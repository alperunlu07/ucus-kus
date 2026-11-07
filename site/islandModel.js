// Kağıt Kuş · ada ve kaya modelleri. Origin: y=0 is the waterline (islet) or ground contact (rocks).
// Every body is ONE sculpted polar mesh (no stacked spheres): rock, sand rim and felt grass cap are
// colour/height bands on the same fused surface; pebble nubs are displacement bumps, not extra meshes.
import * as THREE from 'three';
import {makeFeltMaterial} from './sheepModel.js';
export const ISLAND_KINDS={islet:'islet',coastRock:'coastRock',savannaRock:'savannaRock'};
function rng(seed){let s=(seed*2654435761)>>>0||1;return()=>((s=Math.imul(s,1664525)+1013904223>>>0)/4294967296);}
const PAL={
 islet:{wet:'#6f7470',rock:'#9a958a',rockW:'#b4a58d',groutC:'#5f6b6e',groutW:'#7d6650',sand:'#e7d3a6',grass:'#7f9f5c',grassD:'#66844a',moss:'#93ad67'},
 coastRock:{wet:'#5e6566',rock:'#8f9291',rockW:'#aeaba2',groutC:'#56606a',groutW:'#77695a'},
 savannaRock:{wet:'#b07a52',rock:'#e0a979',rockW:'#ebbd8e',groutC:'#9a6e5a',groutW:'#a8603c'}
};
const SHAPE={
 islet:{R:2.2,H:1.05,N:26,M:80,harm:[[2,.13],[3,.09],[5,.06],[7,.035]],terr:.16,terrMix:.35,dome:1.6,below:.22},
 coastRock:{R:.72,H:.85,N:8,M:13,harm:[[2,.2],[3,.12],[5,.07]],terr:.14,terrMix:.55,dome:.9,below:.03},
 savannaRock:{R:.8,H:1.2,N:12,M:16,harm:[[2,.22],[3,.1],[4,.08]],terr:.2,terrMix:0,dome:4,below:.03}
};
const hash=(a,b,c)=>{const x=Math.sin(a*127.1+b*311.7+c*74.7)*43758.5;return x-Math.floor(x);};
const _c=new THREE.Color(),_d=new THREE.Color();
function sculpt(kind,seed){
 const r=rng(seed),sh=SHAPE[kind],pal=PAL[kind];const ph=sh.harm.map(()=>r()*6.283);
 const nub=[];for(let i=0;i<(kind==='islet'?26:kind==='coastRock'?6:0);i++){const beach=kind==='islet'&&i>5;nub.push([r()*6.283,beach?.84+r()*.12:.55+r()*.3,beach?.01+r()*.012:.025+r()*.035,beach?.004:.018]);}
 const lean=kind==='savannaRock'?(r()-.5)*.25:0;
 const RAD=th=>{let k=1;sh.harm.forEach(([n,a],i)=>k+=a*Math.sin(n*th+ph[i]));return sh.R*k;};
 const N=sh.N||18,M=sh.M||64,pts=[],grid=[];
 for(let i=0;i<=N+2;i++){grid.push([]);for(let j=0;j<M;j++){const th=j/M*6.283,R=RAD(th);let rho,y;
  if(i<=N){rho=i/N;let prof;
   if(kind==='savannaRock'){prof=rho<.5?1-.06*rho:rho<.62?1-1.9*(rho-.5):rho<.78?.72-.1*(rho-.62)/.16:.62*Math.pow(Math.max(0,1-(rho-.78)/.22),.35);} // steep sides, flat-ish top
   else prof=Math.pow(Math.max(0,1-rho*rho),.75)*(1-.12*Math.max(0,rho-.82)/.18);
   y=sh.H*prof*(1+.12*Math.sin(3*th+ph[0])*rho);
   // fused pebble nubs
   for(const [a,rr,h,wd] of nub){const da=Math.atan2(Math.sin(th-a),Math.cos(th-a))*R,dr=(rho-rr)*R;y+=h*sh.H*4*Math.exp(-(da*da+dr*dr)/wd);}
   const t=Math.round(y/sh.terr)*sh.terr;y+= (t-y)*sh.terrMix*Math.min(1,rho*1.6);
   if(i==N)y=0.02;
  }else{rho=i==N+1?1.03:.97;y=i==N+1?-.06:-sh.below;}
  const jit=(kind!=='islet'&&i>0&&i<N&&(kind==='coastRock'||i/N>.6))?(hash(i,j,seed)-.5)*.16*sh.R:0;const rr=rho*R+jit;if(kind==='coastRock'&&i>0&&i<N)y+=(hash(j,i,seed+3)-.5)*.1*sh.H;grid[i].push(new THREE.Vector3(Math.cos(th)*rr+lean*y,y,Math.sin(th)*rr));}}
 const pos=[],col=[];
 const shade=(p0,n,ring)=>{const p=ring.qa,y=p.y,rho=Math.hypot(p.x,p.z)/RAD(Math.atan2(p.z,p.x));const v=hash(Math.round(p.x*9),Math.round(p.z*9),Math.round(p.y*9));
  if(y<(kind==='coastRock'?.2:.09)*sh.H||y<.07)_c.set(pal.wet).lerp(_d.set(pal.rock),Math.min(1,y/(.2*sh.H))*.35);
  else if(kind==='islet'&&n.y>.62&&y>.34*sh.H){const lf=.5+.5*Math.sin(p.x*2.3+Math.cos(p.z*1.7)*1.4)*Math.cos(p.z*2.1-p.x*.6);_c.set(pal.grass).lerp(_d.set(pal.grassD),lf*.55+v*.08);if(lf<.18)_c.lerp(_d.set(pal.moss),.6);}
  else if(kind==='islet'&&y<.26*sh.H&&n.y>.35)_c.set(pal.sand).offsetHSL(0,0,(v-.5)*.04);
  else{_c.set(n.x<0?pal.rockW:pal.rock);_d.set(n.z>.15?pal.groutW:pal.groutC);_c.lerp(_d,Math.max(0,.5-n.y)*.75+v*.1);
   if(kind==='savannaRock'){const lvl=Math.floor(y/(sh.H*.14));_c.offsetHSL((lvl%2)*.012,0,(lvl%2?.035:-.02)+(n.y>.8?.05:0));}}
  return _c;};
 const tri=(a,b,c,ring)=>{const n=new THREE.Vector3().subVectors(b,a).cross(new THREE.Vector3().subVectors(c,a)).normalize();const p=a.clone().add(b).add(c).multiplyScalar(1/3);const C=shade(p,n,ring);for(const q of [a,b,c]){pos.push(q.x,q.y,q.z);col.push(C.r,C.g,C.b);}};
 for(let i=0;i<N+2;i++)for(let j=0;j<M;j++){const j2=(j+1)%M,a=grid[i][j],b=grid[i][j2],c=grid[i+1][j],d=grid[i+1][j2];const qa=a.clone().add(b).add(c).add(d).multiplyScalar(.25);if(i>0)tri(a,b,c,{i,qa});tri(b,d,c,{i,qa});}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.computeVertexNormals();
 return {geo:g,RAD,sh};
}
function felt(color){const m=new THREE.MeshLambertMaterial({color});m.flatShading=true;return m;}
let MAT;function mat(){if(!MAT){MAT=makeFeltMaterial('#ffffff');MAT.flatShading=true;}return MAT;}
function shrub(r){const g=new THREE.Group();const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.03,.045,.28,5),felt('#8a6a4a'));trunk.position.y=.14;g.add(trunk);
 const lm=felt('#5f8a4a');for(let k=0;k<3;k++){const c=new THREE.Mesh(new THREE.ConeGeometry(.26-k*.06,.3,6),lm);c.position.y=.3+k*.17;c.rotation.y=r()*3;c.castShadow=true;g.add(c);}return g;}
function tuft(r,color){const g=new THREE.Group(),m=felt(color);for(let k=0;k<5;k++){const b=new THREE.Mesh(new THREE.ConeGeometry(.025,.16+r()*.08,3),m);const a=k*1.26;b.position.set(Math.cos(a)*.04,.08,Math.sin(a)*.04);b.rotation.set(Math.sin(a)*.35,0,-Math.cos(a)*.35);g.add(b);}return g;}
function surfaceY(mesh,x,z){const rc=new THREE.Raycaster(new THREE.Vector3(x,9,z),new THREE.Vector3(0,-1,0));const h=rc.intersectObject(mesh)[0];return h?h.point.y:0;}
function waterRing(RAD,pad){const sh=new THREE.Shape();for(let j=0;j<=64;j++){const th=j/64*6.283,R=RAD(th)*pad;j?sh.lineTo(Math.cos(th)*R,Math.sin(th)*R):sh.moveTo(Math.cos(th)*R,Math.sin(th)*R);}return new THREE.ShapeGeometry(sh);}
let CT;function contactBlob(w,strength=.3){if(!CT&&typeof document!=='undefined'){const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d'),gr=x.createRadialGradient(64,64,10,64,64,64);gr.addColorStop(0,'rgba(38,52,50,1)');gr.addColorStop(.6,'rgba(38,52,50,.45)');gr.addColorStop(1,'rgba(38,52,50,0)');x.fillStyle=gr;x.fillRect(0,0,128,128);CT=new THREE.CanvasTexture(c);}
 const m=new THREE.Mesh(new THREE.PlaneGeometry(w,w),new THREE.MeshBasicMaterial({map:CT,transparent:true,opacity:strength,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.y=.006;m.renderOrder=1;return m;}
export function createIsland(opts={}){
 const kind=opts.kind||'islet';if(kind!=='islet')return createRock(opts);
 const seed=opts.seed??1,r=rng(seed+99),g=new THREE.Group();g.name='islet';
 const {geo,RAD,sh}=sculpt('islet',seed);const body=new THREE.Mesh(geo,mat());body.castShadow=body.receiveShadow=true;g.add(body);
 if(opts.water!==false){
  const w=new THREE.Mesh(waterRing(RAD,opts.waterPad||1.7),new THREE.MeshLambertMaterial({color:'#9fc3c4'}));w.rotation.x=-Math.PI/2;w.position.y=-.035;w.receiveShadow=true;g.add(w);
  const sh2=new THREE.Mesh(waterRing(RAD,1.16),new THREE.MeshBasicMaterial({color:'#6f9a9c',transparent:true,opacity:.55,depthWrite:false}));sh2.rotation.x=-Math.PI/2;sh2.position.y=-.03;g.add(sh2);const lip=new THREE.Mesh(waterRing(RAD,1.05),new THREE.MeshBasicMaterial({color:'#4f7476',transparent:true,opacity:.5,depthWrite:false}));lip.rotation.x=-Math.PI/2;lip.position.y=-.025;lip.renderOrder=1;g.add(lip);
 }
 body.updateMatrixWorld();
 const sx=Math.cos(.7)*.55,sz=Math.sin(.7)*.55;const s=shrub(r);s.position.set(sx,surfaceY(body,sx,sz)-.03,sz);g.add(s);
 for(let k=0;k<9;k++){const a=r()*6.283,rr=(.25+r()*.45)*sh.R*.8,x=Math.cos(a)*rr,z=Math.sin(a)*rr,y=surfaceY(body,x,z);if(y<.4)continue;const t=tuft(r,k%2?'#6b8d4c':'#86a660');t.position.set(x,y-.02,z);g.add(t);}
 g.scale.setScalar(opts.scale??1);g.userData={kind,width:sh.R*2,height:sh.H};return g;}
export function createRock(opts={}){
 const kind=opts.kind==='savannaRock'?'savannaRock':'coastRock',seed=opts.seed??1;const g=new THREE.Group();g.name=kind;
 const {geo,sh}=sculpt(kind,seed);const m=new THREE.Mesh(geo,mat());m.castShadow=m.receiveShadow=true;g.add(m);if(opts.contact!==false)g.add(contactBlob(sh.R*3.1,kind==='coastRock'?.42:.32));
 g.scale.setScalar(opts.scale??1);g.userData={kind,width:sh.R*2,height:sh.H};return g;}
export function createIslandCluster(opts={}){const g=new THREE.Group(),s=opts.seed??3;const i=createIsland({seed:s,waterPad:2.15});g.add(i);
 [[2.75,.9,.85,0],[3.35,.15,.42,1],[1.9,-2.2,.55,2],[-2.75,1.3,.5,3],[-2.35,1.95,.28,4]].forEach(([x,z,sc,k])=>{const r=createRock({kind:'coastRock',seed:s+k*7,scale:sc});r.position.set(x,-.06,z);r.rotation.y=k;g.add(r);});
 g.scale.setScalar(opts.scale??1);g.userData={kind:'cluster',width:7,height:1.1};return g;}
export function updateIsland(){/* islands are static */}
