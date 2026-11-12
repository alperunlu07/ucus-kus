// Kağıt Kuş — kağıt/keçe su yüzeyi (nehir + deniz). +Y yukarı, +Z ileri.
// CONVENTION: y = 0 is the MEAN WATER SURFACE. Waves displace a few mm around it;
// the depth skirt hangs below (to y≈-0.4) and banks / sand lip rise above y=0.
// group.userData.footprint = [minX,minZ,maxX,maxZ] of the recessed basin, so a host
// can cut/lower its ground there (ground top is also y=0 → avoid z-fight).
// Animation is driven only by uniforms updated in updateWater (no world-xz sampling).
import * as THREE from 'three';
import {makeFeltMaterial} from './sheepModel.js';
const POLISH = 10;
export const WATER_KINDS=['river','sea'];
function rng(s){s=(s>>>0)||1;return()=>((s=Math.imul(s^s>>>15,1|s)+0x6d2b79f5|0,((s^s>>>14)>>>0)/4294967296));}
const PAL={
 river:{deep:'#2f6f7a',mid:'#4f9797',shallow:'#8cc2b4',thread:'#e9f3e6'},
 sea:{deep:'#245f86',mid:'#2f7493',shallow:'#6fb0b4',thread:'#eef3f6'}};
// ---- paper-pulp water material (local-space grain, uniform-driven ripples) ----
function makeWaterMaterial(kind){
 const p=PAL[kind];
 const m=new THREE.MeshLambertMaterial({color:'#ffffff',vertexColors:true});
 const U={uTime:{value:0},uAmp:{value:.15},uDeep:{value:new THREE.Color(p.deep)},uMid:{value:new THREE.Color(p.mid)},uShallow:{value:new THREE.Color(p.shallow)},uThread:{value:new THREE.Color(p.thread)},uFlow:{value:kind==='river'?1:0}};
 m.userData.uniforms=U;
 m.onBeforeCompile=s=>{Object.assign(s.uniforms,U);
  s.vertexShader=`uniform float uTime,uAmp,uFlow;attribute vec2 aFlow;varying vec3 vLP;varying vec2 vFl;varying vec3 vVD;varying float vWave;
`+s.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
 vLP=position;vFl=aFlow;
 // aFlow.x = along-stream coord, aFlow.y = 0 edge .. 1 centre (shore distance)
 float t=uTime, shore=smoothstep(0.0,0.35,aFlow.y);
 float a=aFlow.x*(uFlow>0.5?2.3:1.6)-t*1.3;
 float w=sin(a)*.6+sin(position.x*2.9+position.z*1.7-t*.9)*.4+sin(position.z*4.1-position.x*1.3+t*1.7)*.22;
 vWave=w;transformed.y+=w*uAmp*uAmp*.08*shore;
 objectNormal=normalize(vec3(-cos(a)*uAmp*.08*shore*(uFlow>0.5?0.0:1.0),1.0,-cos(a)*uAmp*.08*shore));`).replace('#include <defaultnormal_vertex>',`#include <defaultnormal_vertex>`).replace('#include <project_vertex>',`#include <project_vertex>
 vVD=normalize(-mvPosition.xyz);`);
  s.fragmentShader=`uniform float uTime,uAmp,uFlow;uniform vec3 uDeep,uMid,uShallow,uThread;varying vec3 vLP;varying vec2 vFl;varying vec3 vVD;varying float vWave;
float wH(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float wN(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(wH(i),wH(i+vec2(1,0)),f.x),mix(wH(i+vec2(0,1)),wH(i+vec2(1,1)),f.x),f.y);}
`+s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
 vec2 q=vLP.xz;
 // layered pulp: three sheets torn at noisy contour lines (stepped, not smooth)
 float d=vFl.y + (wN(q*1.3)-.5)*.35 + (wN(q*5.)-.5)*.08;
 float soft=.035+.03*wN(q*2.3);float s1=smoothstep(.2-soft,.2+soft,d), s2=smoothstep(.55-soft,.55+soft,d);
 vec3 col=mix(uShallow,uMid,s1); col=mix(col,uDeep,s2*.85);
 // edge darkening of each torn sheet (pulp thickness ridge)
 float ridge=(smoothstep(.17,.205,d)-smoothstep(.205,.24,d))*.5+(smoothstep(.52,.555,d)-smoothstep(.555,.59,d))*.6;
 col=mix(col,col*.86,ridge*.6);
 // ripple: paper-sheet facets catch light — visible in a still frame
 col*=1.+vWave*uAmp*uAmp*.16;
 // paper fibre grain, AA-faded
 vec2 fp=q*90.;float aa=1.-smoothstep(.4,1.6,length(fwidth(fp)));
 float fib=wN(fp*vec2(1.,.25))-.5, mot=wN(q*9.)-.5, pulp=wN(q*30.)-.5;
 col*=.97+mot*.08+pulp*.07+fib*.12*aa;
 // sewn mica thread: thin stitched lines along flow, brighten only at grazing light/view
 float along=vFl.x*(uFlow>.5?6.:3.)-uTime*.25*uAmp*4.;
 float lane=fract(vFl.y*(uFlow>.5?9.:14.)+wN(q*.7)*1.5+vWave*.04*uAmp);
 float stitch=step(.5,fract(along*2.6+floor(vFl.y*14.)*.37));
 float thread=smoothstep(.47,.5,lane)*(1.-smoothstep(.5,.53,lane))*stitch*smoothstep(.12,.3,vFl.y);
 float aniso=pow(clamp(1.-abs(vVD.y-.55)*1.6,0.,1.),2.)*.55+.25;
 col=mix(col,uThread,thread*aniso*(.5+uAmp*.4)*aa);
 diffuseColor.rgb*=col;`);
 };
 m.customProgramCacheKey=()=> 'kk-water-v10-'+kind;
 return m;}
// ---- helpers ----
function colAttr(g,hex,jit,r){const c=new THREE.Color(hex),n=g.attributes.position.count,a=new Float32Array(n*3);for(let i=0;i<n;i++){const k=1+(r()-.5)*jit;a[i*3]=c.r*k;a[i*3+1]=c.g*k;a[i*3+2]=c.b*k;}g.setAttribute('color',new THREE.BufferAttribute(a,3));return g;}
// ribbon grid along a centreline: rows across (u in [-1,1]), cols along
function ribbon(nz,nu,fn){const pos=[],flow=[],idx=[];for(let j=0;j<=nz;j++)for(let i=0;i<=nu;i++){const v=j/nz,u=i/nu*2-1;const [x,y,z,f,e]=fn(v,u);pos.push(x,y,z);flow.push(f,e);}
 for(let j=0;j<nz;j++)for(let i=0;i<nu;i++){const a=j*(nu+1)+i,b=a+1,c=a+nu+1,d=c+1;idx.push(a,c,b,b,c,d);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('aFlow',new THREE.Float32BufferAttribute(flow,2));g.setIndex(idx);g.computeVertexNormals();return g;}
function feltLump(r,seed,R,flat=.6){const g=new THREE.IcosahedronGeometry(r,2);const p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);const k=1+Math.sin(x*9+seed)*.08+Math.sin(z*11+seed*2)*.07;p.setXYZ(i,x*k,Math.max(y*k*flat,-r*.15),z*k);}g.computeVertexNormals();return g;}
// folded paper bank: cross-section [waterEdge→ slope crease → crest → flat top], faceted
function bankGeo(len,nz,side,center,halfW,out,h,colors,r){
 const prof=[[0,-.32],[.0,-.02],[.1,h*.5],[.2,h],[.3,h*.97],[out*.55,h*.75],[out,.004]];// [dist from edge, y]
 const pos=[],col=[],idx=[];const cs=colors.map(c=>new THREE.Color(c));
 for(let j=0;j<=nz;j++){const v=j/nz,z=(v-.5)*len,cx=center(v),hw=halfW(v);const wob=(r()-.5)*.03;
  prof.forEach(([d,y],k)=>{const jag=k===3?Math.sin(j*1.9)*.02+(r()-.5)*.02:0;pos.push(cx+side*(hw+d+wob*(k>0?1:0)),y+jag,z);const c=cs[Math.min(k,cs.length-1)];const t=.94+r()*.1;col.push(c.r*t,c.g*t,c.b*t);});}
 const P=prof.length;for(let j=0;j<nz;j++)for(let k=0;k<P-1;k++){const a=j*P+k,b=a+1,c=a+P,d=c+1;if(side<0)idx.push(a,b,c,b,d,c);else idx.push(a,c,b,b,c,d);}
 let g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.setIndex(idx);g=g.toNonIndexed();g.computeVertexNormals();return g;}
function skirt(len,nz,center,halfW,depth,hex){// dark under-water walls + floor = depth tint
 const pos=[],idx=[];for(let j=0;j<=nz;j++){const v=j/nz,z=(v-.5)*len,cx=center(v),hw=halfW(v);pos.push(cx-hw,-depth,z,cx+hw,-depth,z);}
 for(let j=0;j<nz;j++){const a=j*2;idx.push(a,a+2,a+1,a+1,a+2,a+3);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();
 return new THREE.Mesh(g,new THREE.MeshLambertMaterial({color:hex}));}
// cut-felt foam ribbon: zig-zag torn edge strip lying just over the surface
function foamStrip(pts,width,y,r,layer,thick=.018){const pos=[],idx=[],col=[];const c=new THREE.Color(layer?'#dfeeee':'#fbfaf4');
 pts.forEach(([x,z,nx,nz],i)=>{const tear=width*(.6+r()*.5)*(i%3?1:.75)+Math.sin(i*.37)*width*.15;pos.push(x,y,z,x+nx*tear,y,z+nz*tear);for(let k=0;k<2;k++){const t=.95+r()*.08;col.push(c.r*t,c.g*t,c.b*t);}});
 for(let i=0;i<pts.length-1;i++){const a=i*2;idx.push(a,a+1,a+2,a+1,a+3,a+2);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.setIndex(idx);g.computeVertexNormals();
 // thicken: extrude down a hair so it reads as a cut sheet in side view
 const n=pos.length/3,p2=pos.slice();for(let i=0;i<n;i++)p2[i*3+1]-=thick;const all=pos.concat(p2),idx2=idx.slice();
 for(let i=0;i<idx.length;i+=3)idx2.push(idx[i]+n,idx[i+2]+n,idx[i+1]+n);
 for(let i=0;i<pts.length-1;i++){const a=i*2+1,b=a+2;idx2.push(a,a+n,b,b,a+n,b+n);}
 const g2=new THREE.BufferGeometry();g2.setAttribute('position',new THREE.Float32BufferAttribute(all,3));g2.setAttribute('color',new THREE.Float32BufferAttribute(col.concat(col.map(v=>v*.82)),3));g2.setIndex(idx2);g2.computeVertexNormals();
 // keep the top sheet facing up whatever the strip direction
 let up=0;const nn=g2.attributes.normal;for(let i=0;i<n;i++)up+=nn.getY(i);if(up<0){const I=g2.index.array;for(let i=0;i<I.length;i+=3){const t=I[i+1];I[i+1]=I[i+2];I[i+2]=t;}g2.computeVertexNormals();}
 return g2;}
// ---- river ----
export function createRiver({seed=1,scale=1}={}){const r=rng(seed*7919+11),G=new THREE.Group();G.name='water-river';
 const len=12,nz=96,amp=.9+r()*.3,ph=r()*6;const center=v=>Math.sin(v*Math.PI*1.6+ph)*amp*.8+Math.sin(v*Math.PI*3.7+ph*2)*amp*.15;
 const halfW=v=>1.0+Math.sin(v*9+ph)*.12+Math.sin(v*23)*.04;
 const mat=makeWaterMaterial('river');
 const surf=new THREE.Mesh(ribbon(nz,16,(v,u)=>{const z=(v-.5)*len;return[center(v)+u*halfW(v),0,z,v*len,1-Math.abs(u)];}),mat);colAttr(surf.geometry,'#ffffff',0,r);surf.receiveShadow=true;G.add(surf);
 G.add(skirt(len,nz,center,halfW,.4,'#173c43'));
 const felt=makeFeltMaterial('#ffffff');
 for(const side of[-1,1]){const b=new THREE.Mesh(bankGeo(len,nz,side,center,halfW,1.6,.2,['#2f4a3e','#5d6b4a','#8f7c58','#c2ae7e','#9fb07a','#a3b788','#a5b98c'],r),felt);b.castShadow=b.receiveShadow=true;G.add(b);
  // thin wet-line felt strip at the waterline (cut edge)
  const pts=[];for(let j=0;j<=nz;j++){const v=j/nz;pts.push([center(v)+side*(halfW(v)-.02),(v-.5)*len,side,0]);}
  const wl=new THREE.Mesh(foamStrip(pts,-.07,.012,r,1),felt);G.add(wl);}
 // felt pebbles and reeds as sparse edge dressing
 for(let i=0;i<22;i++){const v=r(),side=r()<.5?-1:1;const g=feltLump(.05+r()*.06,i,r);colAttr(g,['#8c8478','#a39886','#6f6a60','#b9ad97'][i%4],.12,r);const m=new THREE.Mesh(g,felt);m.position.set(center(v)+side*(halfW(v)-.04+r()*.12),.01,(v-.5)*len);m.rotation.y=r()*6;m.castShadow=true;G.add(m);}
 const reedG=new THREE.CylinderGeometry(.008,.014,1,5);reedG.translate(0,.5,0);colAttr(reedG,'#6f8a4c',.2,r);
 const headG=new THREE.CapsuleGeometry(.022,.09,3,6);colAttr(headG,'#7a5a3e',.1,r);
 for(let c=0;c<5;c++){const v=.1+r()*.8,side=r()<.5?-1:1;const bx=center(v)+side*(halfW(v)+.06),bz=(v-.5)*len;
  for(let i=0;i<7;i++){const h=.25+r()*.25,m=new THREE.Mesh(reedG,felt);m.scale.set(1,h,1);m.position.set(bx+(r()-.5)*.18,0,bz+(r()-.5)*.25);m.rotation.set((r()-.5)*.25,0,(r()-.5)*.25);m.castShadow=true;G.add(m);
   if(i%2===0){const hd=new THREE.Mesh(headG,felt);hd.position.set(0,1-.06/h,0);hd.scale.set(1,1/h,1);m.add(hd);}}}
// pass 9: paper cut-section caps at both ends: strata earth + water depth face + white cut line
 for(const end of[0,1]){const v=end,zE=(v-.5)*len,cx=center(v),hw=halfW(v),dir=end?1:-1;
  const prof=[[0,-.02],[.1,.1],[.2,.2],[.3,.194],[.88,.15],[1.6,.004]];
  const sh=new THREE.Shape();sh.moveTo(cx-hw-1.6,-.42);[...prof].reverse().forEach(([d,y])=>sh.lineTo(cx-hw-d,y));sh.lineTo(cx-hw,-.02);sh.lineTo(cx-hw+.15,-.36);sh.lineTo(cx+hw-.15,-.36);sh.lineTo(cx+hw,-.02);prof.forEach(([d,y])=>sh.lineTo(cx+hw+d,y));sh.lineTo(cx+hw+1.6,-.42);sh.closePath();
  const g=new THREE.ShapeGeometry(sh,4);const P=g.attributes.position,cc=[];const strata=[new THREE.Color('#5e4c3a'),new THREE.Color('#7f6a4d'),new THREE.Color('#a48e64'),new THREE.Color('#8fa070')];
  for(let i=0;i<P.count;i++){const y=P.getY(i);const k=y<-.24?0:y<-.1?1:y<.12?2:3;const t=.95+r()*.08;cc.push(strata[k].r*t,strata[k].g*t,strata[k].b*t);}
  g.setAttribute('color',new THREE.Float32BufferAttribute(cc,3));if(!end){const I=g.index.array;for(let i=0;i<I.length;i+=3){const t=I[i+1];I[i+1]=I[i+2];I[i+2]=t;}}g.computeVertexNormals();
  const capMat=makeFeltMaterial('#ffffff');capMat.side=THREE.DoubleSide;const cap=new THREE.Mesh(g,capMat);cap.position.z=zE;G.add(cap);
  const ws=new THREE.Shape();ws.moveTo(cx-hw,0);ws.lineTo(cx+hw,0);ws.lineTo(cx+hw-.15,-.36);ws.lineTo(cx-hw+.15,-.36);ws.closePath();
  const wg=new THREE.ShapeGeometry(ws);const wc=[];const WP=wg.attributes.position;for(let i=0;i<WP.count;i++){const c=new THREE.Color(WP.getY(i)>-.05?'#4f9797':'#173c43');wc.push(c.r,c.g,c.b);}wg.setAttribute('color',new THREE.Float32BufferAttribute(wc,3));
  const wm=new THREE.Mesh(wg,new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide}));wm.position.z=zE+dir*.004;G.add(wm);
  const lip=new THREE.Mesh(new THREE.BoxGeometry(hw*2,.03,.03),new THREE.MeshLambertMaterial({color:'#f4efe2'}));lip.position.set(cx,-.005,zE+dir*.01);G.add(lip);}
 G.scale.setScalar(scale);let mnx=1e9,mxx=-1e9;for(let j=0;j<=20;j++){const v=j/20;mnx=Math.min(mnx,center(v)-halfW(v));mxx=Math.max(mxx,center(v)+halfW(v));}
 const outline=[];for(let j=0;j<=40;j++){const v=j/40;outline.push([(center(v)-halfW(v)-.05)*scale,(v-.5)*len*scale]);}for(let j=40;j>=0;j--){const v=j/40;outline.push([(center(v)+halfW(v)+.05)*scale,(v-.5)*len*scale]);}
 G.userData={kind:'river',mat,outline,footprint:[mnx*scale-.05,-len/2*scale,mxx*scale+.05,len/2*scale],size:[mxx-mnx+3.2,len],time:0,amp:.15};return G;}
// ---- sea ----
export function createSea({seed=1,scale=1}={}){const r=rng(seed*104729+5),G=new THREE.Group();G.name='water-sea';
 const W=9,D=9,shoreZ=v=>0;const coast=x=>D/2-.9+Math.sin(x*1.3+seed)*.35+Math.sin(x*3.1)*.12;// sand toward +Z
 const mat=makeWaterMaterial('sea');
 // surface: u across x, v from far sea (-Z) to shoreline; flow.y = distance from shore (0 shore .. 1 open sea)
 const ex=z=>W/2+Math.sin(z*1.7+seed)*.28+Math.sin(z*4.3)*.08,ez=x=>-D/2+Math.sin(x*1.5+seed*2)*.3+Math.sin(x*3.7)*.1;// paper-cut open edges
 const sx=(u,z)=>u*(u<0?ex(z+3.1):ex(z));
 const surf=new THREE.Mesh(ribbon(64,64,(v,u)=>{const x0=u*W/2,zc=coast(x0),z0=ez(x0),z=z0+v*(zc-z0),x=sx(u,z);const edge=Math.min(1,1-Math.abs(u))*4;return[x,0,z,x,Math.min(1,(1-v)*1.6,edge+.15)];}),mat);colAttr(surf.geometry,'#ffffff',0,r);surf.receiveShadow=true;G.add(surf);
 const deep=new THREE.Mesh(new THREE.BoxGeometry(W,.01,D),new THREE.MeshLambertMaterial({color:'#0f2c47'}));deep.position.set(0,-.45,0);G.add(deep);
 // side skirts (depth tint visible in Yan view)
 const sk=new THREE.MeshLambertMaterial({color:'#163b5a'});for(const [w,d,x,z] of [[W,.45,0,-D/2],[.01,.45,-W/2,0],[.01,.45,W/2,0]]){const m=new THREE.Mesh(new THREE.BoxGeometry(w===.01?.02:W,.45,w===.01?D:.02),sk);m.position.set(x*.93,-.26,z*.93);G.add(m);}
 const felt=makeFeltMaterial('#ffffff');
 // pass 7: no boxy rim; open sides get a low felt mud→grass lip traced along the cut edge
 {const edge=[];const zl=coast(-W/2)-.1,zr=coast(W/2)-.1;
  for(let i=0;i<=40;i++){const z=zl+(ez(-W/2)-zl)*i/40;edge.push([sx(-1,z),z,-1,0]);}
  for(let i=0;i<=60;i++){const x0=(i/60-.5)*W;edge.push([x0,ez(x0),0,-1]);}
  for(let i=0;i<=40;i++){const z=ez(W/2)+(zr-ez(W/2))*i/40;edge.push([sx(1,z),z,1,0]);}
  const pos=[],col=[],cs=['#1f4a5a','#55634a','#8f9a6c','#a5b98c'].map(c=>new THREE.Color(c)),pr=[[-.04,-.05],[.04,.01],[.18,.03],[.42,.003]];
  edge.forEach(([x,z,nx,nz])=>pr.forEach(([d,y],k)=>{const j=(r()-.5)*.03;pos.push(x+nx*(d+j),y,z+nz*(d+j));const t=.94+r()*.1;col.push(cs[k].r*t,cs[k].g*t,cs[k].b*t);}));
  const idx=[];for(let i=0;i<edge.length-1;i++)for(let k=0;k<3;k++){const a=i*4+k,b=a+1,c=a+4,d=c+1;idx.push(a,b,c,b,d,c);}
  let g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.setIndex(idx);g=g.toNonIndexed();g.computeVertexNormals();
  const n=g.attributes.normal;let up=0;for(let i=0;i<n.count;i++)up+=n.getY(i);if(up<0){const p2=g.attributes.position,c2=g.attributes.color;for(let i=0;i<p2.count;i+=3)for(const A of[p2,c2]){const t=[A.getX(i+1),A.getY(i+1),A.getZ(i+1)];A.setXYZ(i+1,A.getX(i+2),A.getY(i+2),A.getZ(i+2));A.setXYZ(i+2,...t);}g.computeVertexNormals();}
  const m=new THREE.Mesh(g,felt);m.receiveShadow=true;G.add(m);}
 // sand lip: folded felt terrace from coastline to +Z edge
 const N=72,pos=[],col=[];const sc=[new THREE.Color('#d9c393'),new THREE.Color('#e6d4a7'),new THREE.Color('#cdb683')];
 const prof=[[-.06,-.3],[0,.0],[.25,.05],[.5,.12],[1,.14]];
 for(let i=0;i<=N;i++){const x=(i/N-.5)*W,zc=coast(x);prof.forEach(([f,y],k)=>{const z=k<2?zc+f:zc+(D/2+.6-zc)*f;pos.push(x,y+(k===3?(r()-.5)*.015:0),z);const c=sc[k%3],t=.95+r()*.08;col.push(c.r*t,c.g*t,c.b*t);});}
 const idx=[];const P=prof.length;for(let i=0;i<N;i++)for(let k=0;k<P-1;k++){const a=i*P+k,b=a+1,c=a+P,d=c+1;idx.push(a,b,c,b,d,c);}
 let sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));sg.setAttribute('color',new THREE.Float32BufferAttribute(col,3));sg.setIndex(idx);sg=sg.toNonIndexed();sg.computeVertexNormals();
 const sand=new THREE.Mesh(sg,felt);sand.receiveShadow=sand.castShadow=true;G.add(sand);
 // three cut-felt foam bands, layered and offset seaward, torn zig-zag edges
 const foams=[];for(let L=0;L<3;L++){const pts=[];const off=.02+L*.3;for(let i=0;i<=90;i++){const x=(i/90-.5)*W*.98;pts.push([x,coast(x)-off,0,-1]);}
  const m=new THREE.Mesh(foamStrip(pts,.26-L*.05,.05-L*.012,r,L>1,.035-L*.006),felt);m.userData.base=off;m.receiveShadow=true;if(L===0)m.castShadow=true;G.add(m);foams.push(m);}
 // a few loose torn foam flecks offshore
 for(let i=0;i<9;i++){const x=(r()-.5)*W*.8,z=-D/2+.8+r()*(D*.55);const pts=[];const n=5+(r()*4|0);for(let k=0;k<=n;k++)pts.push([x+k*.09,z+Math.sin(k)*.03,0,-1]);const m=new THREE.Mesh(foamStrip(pts,.05,.008,r,1),felt);G.add(m);foams.push(m);}
 G.scale.setScalar(scale);G.userData={kind:'sea',mat,outline:(()=>{const o=[],zl=coast(-W/2)+.2,zr=coast(W/2)+.2;for(let i=0;i<=30;i++){const z=zl+(ez(-W/2)+.05-zl)*i/30;o.push([(sx(-1,z)+.05)*scale,z*scale]);}for(let i=1;i<40;i++){const x=(i/40-.5)*W;o.push([x*scale,(ez(x)+.05)*scale]);}for(let i=0;i<=30;i++){const z=ez(W/2)+.05+(zr-ez(W/2)-.05)*i/30;o.push([(sx(1,z)-.05)*scale,z*scale]);}return o;})(),foams,footprint:[-W/2*scale,-D/2*scale,W/2*scale,(D/2-.4)*scale],size:[W,D+1.2],time:0,amp:.15};return G;}
export function createWater({kind='river',seed=1,scale=1}={}){return kind==='sea'?createSea({seed,scale}):createRiver({seed,scale});}
export function updateWater(water,dt,action='calm'){const u=water.userData;if(!u||!u.mat)return;const target=action==='ripple'?1:.12;u.amp+=(target-u.amp)*Math.min(1,dt*2.5);u.time+=dt*(.35+u.amp*.65);
 const U=u.mat.userData.uniforms;U.uTime.value=u.time;U.uAmp.value=u.amp;
 if(u.foams)u.foams.forEach((f,i)=>{if(i>=3)return;const ph=Math.sin(u.time*.9-i*.8);f.position.z=ph*.13*u.amp;f.position.y=Math.max(0,ph)*.02*u.amp;f.rotation.x=ph*.012*u.amp;});}
