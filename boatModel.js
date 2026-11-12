// Kağıt Kuş · small coastal boats and wooden piers (paper/felt craft).
// Origins: boat waterline at y=0 (keel dips below), bow points +z.
// Pier: deck top at y=opts.deck (default .62), pilings extend down to y=-1.1; pier runs along +z from z=0 (shore end).
// Compose: createBoatyard(opts) returns a Group with a pier and a boat moored alongside (userData.boat, userData.pier).
import * as THREE from 'three';
import {makeFeltMaterial} from './sheepModel.js';
export const BOAT_PALETTES=[
 {name:'Mercan',hull:'#e98a72',stripe:'#fbf3e3',bottom:'#5d7a86',inner:'#d9c4a2',sail:'#fbf4e6',pennant:'#3f6f8f',wood:'#b8916a'},
 {name:'Krem-mavi',hull:'#f4ecdb',stripe:'#4f86a8',bottom:'#b65f4c',inner:'#cdb38c',sail:'#f6eedd',pennant:'#e1785f',wood:'#a98461'},
 {name:'Deniz',wear:.06,hull:'#6fa3a6',stripe:'#f3e7cf',bottom:'#3f4f5a',inner:'#d4bd98',sail:'#f9efdc',pennant:'#f0b84f',wood:'#b48b63'},
 {name:'Yıpranmış',wear:.28,hull:'#a78d72',stripe:'#d9cdb6',bottom:'#59534c',inner:'#c2a883',sail:'#ece0c8',pennant:'#c96a55',wood:'#9b7b5c'}];
const rng=s=>()=>((s=Math.imul(s^s>>>15,2246822519)+3266489917>>>0)/4294967296);
const col=new THREE.Color();
// parts: [geometry, colorHex, jitter]
function merge(parts){const pos=[],nor=[],cl=[];for(const [g0,c,j=0] of parts){const g=g0.index?g0.toNonIndexed():g0;if(!g.attributes.normal)g.computeVertexNormals();const p=g.attributes.position,n=g.attributes.normal,fc=g.attributes.color;for(let i=0;i<p.count;i++){pos.push(p.getX(i),p.getY(i),p.getZ(i));nor.push(n.getX(i),n.getY(i),n.getZ(i));if(fc)cl.push(fc.getX(i),fc.getY(i),fc.getZ(i));else{col.set(c);cl.push(col.r,col.g,col.b);}}}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));g.setAttribute('color',new THREE.Float32BufferAttribute(cl,3));return g;}
const mats={};function felt(side=THREE.FrontSide,dark=false){const k=side+'_'+dark;if(!mats[k]){const m=makeFeltMaterial('#ffffff',dark);m.side=side;mats[k]=m;}return mats[k];}
const box=(w,h,d,x,y,z,rx=0,ry=0,rz=0)=>{const g=new THREE.BoxGeometry(w,h,d);g.rotateX(rx);g.rotateZ(rz);g.rotateY(ry);g.translate(x,y,z);return g;};
const cyl=(r1,r2,h,seg,a,b)=>{const g=new THREE.CylinderGeometry(r1,r2,h,seg);const A=new THREE.Vector3(...a),B=new THREE.Vector3(...b),d=B.clone().sub(A);g.scale(1,d.length()/h,1);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.clone().normalize()));g.translate((A.x+B.x)/2,(A.y+B.y)/2,(A.z+B.z)/2);return g;};
const shade=(hex,k)=>'#'+new THREE.Color(hex).multiplyScalar(k).getHexString();
// --- hull loft ---------------------------------------------------------
function hullShape(kind){const L=kind==='skiff'?2.15:2.4,W=kind==='skiff'?.6:.55;
 const hw=t=>t>=0?W*Math.pow(Math.max(0,1-t*t),.55)+.012:W*(1-.42*t*t);
 const sheer=t=>.36+.14*t*t+.05*t;
 const keel=t=>t>=0?-.2+.34*Math.pow(t,2.4):-.2+.08*t*t;
 return {L,W,hw,sheer,keel,zt:t=>t*L/2};}
function sect(H,t,u){const a=u*Math.PI/2,s=Math.sin(a);const x=H.hw(t)*Math.sign(s)*Math.pow(Math.abs(s),.75);const k=H.keel(t),sh=H.sheer(t);const y=k+(sh-k)*(1-Math.cos(a))*(t<0?1:1);return new THREE.Vector3(x,y,H.zt(t));}
function hullGeo(H,P,R){const T=[];for(let i=0;i<=28;i++){const v=i/28;T.push(-1+2*v);}
 // strakes across u with thin dark seams (plank gaps)
 const U=[];const strakes=5;for(let s=0;s<strakes;s++){const a=s/strakes,b=(s+1)/strakes;U.push([a,a+.012,'seam',s],[a+.012,b,'plank',s]);}
 const pos=[],cl=[];const put=(v,c)=>{pos.push(v.x,v.y,v.z);cl.push(c.r,c.g,c.b);};
 for(const side of [-1,1])for(const [u0,u1,typ,s] of U)for(let i=0;i<T.length-1;i++){const t0=T[i],t1=T[i+1];
  const a=sect(H,t0,side*u0),b=sect(H,t1,side*u0),c=sect(H,t1,side*u1),d=sect(H,t0,side*u1);
  const cy=(a.y+b.y+c.y+d.y)/4;let hex=s===strakes-1?P.stripe:(cy<.03?P.bottom:P.hull);col.set(hex);
  const wear=P.wear||0;const j=.97+R()*.05-(R()<wear?.12:0);col.multiplyScalar(typ==='seam'?.72:j*(s%2?.98:1.02));
  if(side>0){put(a,col);put(b,col);put(c,col);put(a,col);put(c,col);put(d,col);}else{put(a,col);put(c,col);put(b,col);put(a,col);put(d,col);put(c,col);}}
 // transom
 col.set(P.hull).multiplyScalar(.92);const c0=sect(H,-1,0);const N=12;for(let k=0;k<N;k++){const p=sect(H,-1,-1+2*k/N),q=sect(H,-1,-1+2*(k+1)/N);const ctr=new THREE.Vector3(0,H.sheer(-1),H.zt(-1));const cc=(p.y+q.y)/2<.03?new THREE.Color(P.bottom).multiplyScalar(.9):col;put(ctr,cc);put(q,cc);put(p,cc);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(cl,3));g.computeVertexNormals();return g;}
function rail(H,side,r,lift=0){const pts=[];for(let i=0;i<=20;i++){const t=-1+i/10;const p=sect(H,Math.max(-1,Math.min(.985,t)),side);p.y+=lift;pts.push(p);}return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),40,r,6,false);}
export function createBoat(opts={}){const seed=opts.seed??1,R=rng(seed*733+11),kind=opts.kind||'sail';const P=typeof opts.palette==='number'?BOAT_PALETTES[opts.palette%BOAT_PALETTES.length]:(opts.palette||BOAT_PALETTES[seed%BOAT_PALETTES.length]);
 const H=hullShape(kind);const g=new THREE.Group();g.name='boat';const wood=P.wood;
 const hull=new THREE.Mesh(hullGeo(H,P,R),felt(THREE.BackSide));hull.castShadow=hull.receiveShadow=true;
 // inner lining: same loft seen from inside, in bare-wood colour with darker strake seams
 const ig=hullGeo(H,{...P,hull:P.inner,stripe:shade(P.inner,.93),bottom:shade(P.inner,.85),wear:0},rng(seed+5));ig.scale(.965,1,.975);ig.translate(0,-.004,0);const lining=new THREE.Mesh(ig,felt());lining.receiveShadow=true;g.add(lining);
 const parts=[];
 for(const s of [-1,1])parts.push([rail(H,s,.032,.012),shade(wood,.9)]);
 parts.push([cyl(.03,.03,1,6,[0,H.sheer(1)-.02,H.zt(1)-.05],[0,H.sheer(1)+.07,H.zt(1)+.03]),shade(wood,.85)]);// stem post
 for(const sd of [-1,1]){const p=sect(H,.8,sd*.8);parts.push([new THREE.CircleGeometry(.035,10).rotateY(sd*Math.PI/2*.85).translate(p.x+sd*.012,p.y,p.z),P.pennant]);}
 // floorboards
 for(let k=-2;k<=2;k++)parts.push([box(.1,.025,H.L*.62,k*.115,-.06+Math.abs(k)*.02,-.08),shade(P.inner,k%2?.94:1.03)]);
 // thwarts
 const thw=(t,w)=>{const z=H.zt(t),y=H.sheer(t)-.1;parts.push([box(H.hw(t)*2-.04,.04,.17,0,y,z),shade(wood,1.08)]);};thw(-.05);thw(-.6);if(kind==='sail'){thw(.42);parts.push([box(.1,.06,.1,0,-.06,H.zt(.42)),shade(wood,.8)]);}if(kind==='skiff')thw(.4);
 // stern seat knees
 // rudder + tiller
 const tz=H.zt(-1);if(kind==='sail'){parts.push([box(.035,.34,.18,0,.0,tz-.1)],[box(.07,.03,.05,0,.14,tz-.02),'#6a5e52'],[box(.07,.03,.05,0,-.05,tz-.02),'#6a5e52',shade(wood,.8)],[box(.04,.035,.62,0,H.sheer(-1)+.06,tz+.24,-.08),shade(wood,1.1)]);}
 // rope coil
 const coil=new THREE.TorusGeometry(.085,.022,6,16);coil.rotateX(Math.PI/2);coil.translate(.14,-.02,-.9);const coil2=new THREE.TorusGeometry(.055,.02,6,14);coil2.rotateX(Math.PI/2);coil2.translate(.14,.01,-.9);parts.push([coil,'#d8c49c'],[coil2,'#cbb58b']);
 // oars
 const oar=(x,y,z,ang,yaw=0)=>{const a=[x-Math.sin(yaw)*.62,y,z-Math.cos(yaw)*.62],b=[x+Math.sin(yaw)*.5,y+.03,z+Math.cos(yaw)*.5];parts.push([cyl(.018,.018,1,6,a,b),shade(wood,1.12)]);const bl=box(.1,.012,.34,0,0,0);bl.rotateY(yaw);bl.translate(b[0]+Math.sin(yaw)*.12,b[1],b[2]+Math.cos(yaw)*.12);parts.push([bl,shade(wood,1.05)]);};
 if(kind==='skiff'){oar(-.22,.14,-.1,0,.05);oar(.22,.14,-.1,0,-.05);parts.push([box(.32,.16,.24,0,.0,-.75),'#c79a63'],[box(.28,.02,.2,0,.09,-.75),'#9fbcc4']);}else oar(-.2,.06,-.2,0,.03);
 // oarlocks
 for(const s of [-1,1])parts.push([box(.03,.07,.03,s*(H.hw(-.05)+.005),H.sheer(-.05)+.06,H.zt(-.05)),'#6a5e52']);
 const deco=new THREE.Mesh(merge(parts),felt());deco.castShadow=deco.receiveShadow=true;
 g.add(hull,deco);
 if(kind==='sail'){const rig=new THREE.Group();rig.name='rig';const mz=H.zt(.42),base=-.04;const mh=2.05;const rp=[];
  rp.push([cyl(.032,.022,1,8,[0,base,mz],[0,mh,mz]),shade(wood,.92)]);
  rp.push([cyl(.022,.02,1,8,[0,.5,mz],[0,.5,mz-1.15]),shade(wood,.86)]);
  // pennant
  const pn=new THREE.BufferGeometry();pn.setAttribute('position',new THREE.Float32BufferAttribute([0,mh-.02,mz, 0,mh-.14,mz, .02,mh-.09,mz-.3],3));pn.translate(0,0,-mz);pn.computeVertexNormals();const pen=new THREE.Mesh(merge([[pn,P.pennant]]),felt(THREE.DoubleSide));pen.name='pennant';pen.position.z=mz;pen.castShadow=true;rig.add(pen);
  rp.push([new THREE.SphereGeometry(.035,8,6).translate(0,mh+.02,mz),'#e9dcc0']);
  // stays
  rp.push([cyl(.006,.006,1,4,[0,mh-.05,mz],[0,H.sheer(1)+.06,H.zt(1)]),'#7c6f60']);
  for(const s of [-1,1])rp.push([cyl(.006,.006,1,4,[0,mh*.8,mz],[s*(H.hw(.42)-.02),H.sheer(.42),mz-.05]),'#7c6f60']);
  const rigM=new THREE.Mesh(merge(rp),felt());rigM.castShadow=true;rig.add(rigM);
  // folded sail: two panels meeting at a crease, slight belly
  const head=[0,mh-.12,mz-.04],tack=[0,.56,mz-.05],clew=[0,.56,mz-1.08],crease=[.07,1.0,mz-.42];
  const sv=[...head,...tack,...crease, ...head,...crease,...clew, ...tack,...clew,...crease];
  const sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.Float32BufferAttribute(sv,3));const sc=[];const c1=new THREE.Color(P.sail),c2=new THREE.Color(P.sail).multiplyScalar(.9),c3=new THREE.Color(P.sail).multiplyScalar(.95);for(const c of [c1,c1,c1,c2,c2,c2,c3,c3,c3])sc.push(c.r,c.g,c.b);sg.setAttribute('color',new THREE.Float32BufferAttribute(sc,3));sg.computeVertexNormals();
  const hem=[[head,tack],[tack,clew],[clew,head]].map(([a,b])=>[cyl(.011,.011,1,5,a,b),shade(P.sail,.8)]);
  const L3=(a,b,f)=>a.map((v,i)=>v+(b[i]-v)*f);
  for(const f of [.3,.6]){const A=L3(tack,head,f),B=L3(clew,head,f),C=L3(crease,head,f);for(const k of [.007,-.007]){hem.push([cyl(.0045,.0045,1,4,[A[0]+k,A[1],A[2]],[C[0]+k,C[1],C[2]]),shade(P.sail,.86)],[cyl(.0045,.0045,1,4,[C[0]+k,C[1],C[2]],[B[0]+k,B[1],B[2]]),shade(P.sail,.86)]);}}
  hem.push([box(.05,.05,.05,0,tack[1]-.02,tack[2]+.02),'#6a5e52']);
  const sail=new THREE.Mesh(merge([[sg,P.sail],...hem]),felt(THREE.DoubleSide));sail.castShadow=true;rig.add(sail);g.add(rig);}
 const s=opts.scale??1;g.scale.setScalar(s);g.userData={kind,length:H.L*s,width:H.W*2*s,height:(kind==='sail'?2.1:.6)*s,phase:R()*6.28,t:0,rest:0};return g;}
export function updateBoat(b,dt,action=1){const u=b.userData;if(!action){u.rest=Math.max(0,u.rest-dt*1.5);}else u.rest=Math.min(1,u.rest+dt*1.5);u.t+=dt;const t=u.t+u.phase,k=u.rest;
 b.rotation.z=Math.sin(t*1.3)*.07*k;b.rotation.x=Math.sin(t*.9+1)*.03*k;const rs=u.rockScale??1;b.rotation.z*=rs;b.rotation.x*=rs;b.position.y=(u.baseY??0)+Math.sin(t*1.1)*.025*k*b.scale.y*rs;
 const pen=b.getObjectByName('pennant');if(pen)pen.rotation.y=Math.sin(t*5.3)*.35*k+Math.sin(t*2.1)*.1;const rig=b.getObjectByName('rig');if(rig)rig.rotation.z=Math.sin(t*1.3-.5)*.012*k;}
export function createPier(opts={}){const seed=opts.seed??3,R=rng(seed*911+5),len=opts.length??6,w=opts.width??1.5,deck=opts.deck??.62;const wood=opts.wood||['#b28d68','#a88566','#9c8a74'][seed%3];
 const parts=[];const pitch=.22,gap=.035;
 for(let z=0;z+pitch<=len+.001;z+=pitch){const c=shade(wood,.9+R()*.18),dw=w+(R()-.5)*.06;const g=box(dw,.06,pitch-gap,(R()-.5)*.03,deck-.03+(R()-.5)*.008,z+pitch/2,0,(R()-.5)*.03);parts.push([g,c]);
  for(const s of [-1,1])parts.push([cyl(.008,.008,1,4,[s*(w/2-.1),deck+.002,z+pitch/2-.05],[s*(w/2-.1),deck+.002,z+pitch/2-.04]),'#5a4d42']);}
 // fascia boards hide stringer ends; ladder down to the water at the seaward end
 for(const sd of [-1,1])parts.push([box(.035,.1,len,sd*(w/2+.005),deck-.09,len/2),shade(wood,.8)]);
 parts.push([box(w+.04,.1,.035,0,deck-.09,len+.01),shade(wood,.8)]);
 for(const x of [-.18,.18])parts.push([box(.04,1.1,.04,x+w*.18,deck-.45,len+.07,-.12),shade(wood,.74)]);
 for(let k=0;k<4;k++)parts.push([box(.4,.03,.05,w*.18,deck-.12-k*.24,len+.08+k*.03),shade(wood,.95)]);
 // stringers
 for(const x of [-w/2+.12,0,w/2-.12])parts.push([box(.09,.12,len,x,deck-.12,len/2),shade(wood,.72)]);
 // pilings + braces
 const step=1.5,P=[];for(let z=.25;z<=len;z+=step)P.push(z);if(len-P[P.length-1]>.3)P.push(len-.15);
 P.forEach((z,i)=>{const lean=(R()-.5)*.03;for(const s of [-1,1]){const x=s*(w/2+.02);const top=deck+(i===P.length-1?.28:.12);parts.push([cyl(.085,.095,1,9,[x,-1.1,z],[x+lean,top,z]),shade(wood,.78+R()*.1)]);parts.push([new THREE.ConeGeometry(.1,.09,9).translate(x+lean,top+.045,z),shade(wood,.62)]);
   parts.push([cyl(.09,.09,.05,9,[x,-.02,z],[x,.06,z]),'#7f8f80']);}// algae ring at waterline
  parts.push([box(w+.1,.1,.08,0,deck-.2,z),shade(wood,.75)]);// cap beam
  const br=cyl(.03,.03,1,5,[-w/2,deck-.22,z],[w/2,-.55,z]);parts.push([br,shade(wood,.7)]);
  if(i<P.length-1)for(const s of [-1,1])parts.push([cyl(.028,.028,1,5,[s*(w/2+.02),deck-.22,z],[s*(w/2+.02),-.55,P[i+1]]),shade(wood,.7)]);});
 // cleats
 const cleat=(x,z)=>{parts.push([box(.05,.06,.07,x,deck+.03,z),'#4f4a45'],[box(.06,.035,.24,x,deck+.075,z),'#5d5751']);};
 const cz=[len*.4,len-.5];for(const z of cz)cleat(w/2-.12,z);
 // bench + crates
 parts.push([box(.32,.05,.9,-w/2+.25,deck+.3,len*.55),shade(wood,1.08)],[box(.05,.3,.05,-w/2+.25,deck+.15,len*.55-.35),shade(wood,.8)],[box(.05,.3,.05,-w/2+.25,deck+.15,len*.55+.35),shade(wood,.8)]);
 const crate=(x,y,z,s,ry)=>{parts.push([box(s,s*.8,s,x,y+s*.4,z,0,ry),'#c79a63']);for(const yy of [.12,.88])parts.push([box(s*1.03,s*.09,s*1.03,x,y+s*.8*yy,z,0,ry),'#a47a4c']);};crate(-w/2+.3,deck,len*.2,.36,.2);crate(-w/2+.3,deck+.29,len*.2,.24,-.25);
 // bench backrest + bucket
 parts.push([box(.04,.2,.9,-w/2+.1,deck+.45,len*.55),shade(wood,1.02)]);
 parts.push([cyl(.08,.065,.18,10,[w/2-.3,deck,len*.55],[w/2-.3,deck+.18,len*.55]),'#6f97a3'],[new THREE.TorusGeometry(.08,.008,4,12).rotateX(Math.PI/2).translate(w/2-.3,deck+.18,len*.55),'#4e6f78']);
 // rope fenders hung on boat-side pilings, rope wraps on cleats, shore abutment
 for(const z of P.slice(1))parts.push([new THREE.CapsuleGeometry(.07,.16,4,8).translate(w/2+.12,deck-.32,z),'#e8dcc0'],[cyl(.008,.008,1,4,[w/2+.1,deck-.2,z],[w/2+.12,deck+.08,z]),'#bfa77c']);
 for(const z of cz)parts.push([new THREE.TorusGeometry(.045,.014,5,10).rotateY(Math.PI/2).translate(w/2-.12,deck+.075,z),'#d8c49c']);
 parts.push([box(w+.5,.36,.5,0,deck-.2,-.15),'#c9b48e'],[box(w+.6,.08,.6,0,deck-.4,-.15),'#b9a27c']);
 const coil=new THREE.TorusGeometry(.1,.025,6,16).rotateX(Math.PI/2).translate(w/2-.3,deck+.03,len-.9);parts.push([coil,'#d8c49c']);
 // lantern post at end
 parts.push([cyl(.025,.025,1,6,[-w/2+.1,deck,len-.15],[-w/2+.1,deck+.9,len-.15]),'#5d5751'],[box(.13,.16,.13,-w/2+.1,deck+.98,len-.15),'#f2d38b'],[new THREE.ConeGeometry(.11,.08,4).rotateY(Math.PI/4).translate(-w/2+.1,deck+1.1,len-.15),'#5d5751']);
 const m=new THREE.Mesh(merge(parts),felt());m.castShadow=m.receiveShadow=true;const g=new THREE.Group();g.name='pier';g.add(m);const s=opts.scale??1;g.scale.setScalar(s);
 g.userData={length:len*s,width:w*s,deck:deck*s,cleats:cz.map(z=>new THREE.Vector3(w/2-.12,deck+.08,z).multiplyScalar(s))};return g;}
export function updatePier(){/* pier stays planted */}
export function createBoatyard(opts={}){const s=opts.scale??1,g=new THREE.Group();g.name='boatyard';const pier=createPier({...opts,scale:1});const boat=createBoat({...opts,scale:1,palette:opts.palette});
 const W=pier.userData.width;boat.position.set(W/2+.1+boat.userData.width/2+.2,0,pier.userData.length*.62);boat.rotation.y=Math.PI+.05;boat.userData.baseY=0;boat.userData.rockScale=.45;
 // mooring line: cleat -> bow ring with slack
 const L2=boat.userData.length/2;const ends=[[pier.userData.cleats[0],new THREE.Vector3(boat.position.x-.02,.5,boat.position.z-L2+.08)],[pier.userData.cleats[1],new THREE.Vector3(boat.position.x,.36,boat.position.z+L2-.05)]];
 const lp=[];for(const [a,b] of ends){const mid=a.clone().lerp(b,.5);mid.y-=.2;lp.push([new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(a,mid,b),16,.013,5),'#d8c49c']);}const line=new THREE.Mesh(merge(lp),felt());line.castShadow=true;
 g.add(pier,boat,line);g.scale.setScalar(s);g.userData={pier,boat,line,length:pier.userData.length*s};return g;}
