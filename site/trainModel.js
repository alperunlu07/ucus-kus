import * as THREE from 'three';
// Shared, deterministic paper stock: subtle printed fibres, not a wool/cloud shader.
let paperMap;function paperTexture(){if(paperMap)return paperMap;const c=document.createElement('canvas');c.width=c.height=128;const p=c.getContext('2d');p.fillStyle='#fcfaf5';p.fillRect(0,0,128,128);let seed=7301;const rand=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);for(let i=0;i<1900;i++){const k=239+Math.floor(rand()*16);p.fillStyle=`rgba(${k},${k},${k},.38)`;p.fillRect(rand()*128,rand()*128,1,1);}p.strokeStyle='rgba(144,128,108,.055)';for(let i=0;i<150;i++){const x=rand()*128,y=rand()*128;p.beginPath();p.moveTo(x,y);p.lineTo(x+2+rand()*6,y+rand()*1.5);p.stroke();}paperMap=new THREE.CanvasTexture(c);paperMap.colorSpace=THREE.SRGBColorSpace;paperMap.wrapS=paperMap.wrapT=THREE.RepeatWrapping;paperMap.anisotropy=4;return paperMap;}
const M={};const lam=c=>M[c]||(M[c]=new THREE.MeshLambertMaterial({color:c,map:paperTexture(),flatShading:true}));
export const TRAIN_COLORS={loco:'#3d4f7a',boiler:'#2f3640',wag:['#c9573f','#e9b35d','#5f8f6a','#7aa6c2']};
function paperBox(w,h,d){const geo=new THREE.BoxGeometry(w,h,d);const uv=geo.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*Math.max(w,d),uv.getY(i)*Math.max(h,.3));return geo;}
function box(g,w,h,d,c,x,y,z){const m=new THREE.Mesh(paperBox(w,h,d),lam(c));m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;g.add(m);return m;}
function cyl(g,r1,r2,h,c,x,y,z,axis='y',seg=16){const ge=new THREE.CylinderGeometry(r1,r2,h,seg);if(axis==='x')ge.rotateZ(Math.PI/2);if(axis==='z')ge.rotateX(Math.PI/2);const m=new THREE.Mesh(ge,lam(c));m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;g.add(m);return m;}
function wheel(g,r,x,z,list,spokes=8){const w=new THREE.Group();w.position.set(x,r,z);g.add(w);
 const tire=new THREE.Mesh(new THREE.CylinderGeometry(r,r,.1,24).rotateX(Math.PI/2),lam('#2b2f38'));tire.castShadow=true;w.add(tire);
 const hub=new THREE.Mesh(new THREE.CylinderGeometry(r*.82,r*.82,.12,24).rotateX(Math.PI/2),lam('#c9573f'));w.add(hub);
 const n=spokes/2;for(let i=0;i<n;i++){const s=new THREE.Mesh(new THREE.BoxGeometry(r*1.62,r*.13,.15),lam('#2b2f38'));s.rotation.z=i/n*Math.PI;w.add(s);}
 const cap=new THREE.Mesh(new THREE.CylinderGeometry(r*.22,r*.22,.16,12).rotateX(Math.PI/2),lam('#e9b35d'));w.add(cap);
 if(r===.42){const ph=z<0?Math.PI/2:0;w.rotation.z=ph;const pin=new THREE.Mesh(new THREE.CylinderGeometry(.045,.045,.19,10).rotateX(Math.PI/2),lam('#ead7ad'));pin.position.x=.2;w.add(pin);}
 list.push({m:w,r});return w;}
function label(g,text,w,h,x,y,z,bg='#f3e6c8',ink='#354354'){const c=document.createElement('canvas');c.width=256;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,256,128);ctx.strokeStyle=ink;ctx.lineWidth=5;ctx.strokeRect(10,10,236,108);ctx.fillStyle=ink;ctx.font='bold 78px Georgia';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,128,68);const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshLambertMaterial({map}));m.position.set(x,y,z);if(z<0)m.rotation.y=Math.PI;g.add(m);return m;}
function locomotive(W,RD){const g=new THREE.Group();const C=TRAIN_COLORS;
 box(g,3.2,.22,.95,'#2b2f38',0,.62,0);// frame
 cyl(g,.46,.46,2.1,C.loco,.45,1.1,0,'x',14);// boiler
 box(g,1.0,.62,1.2,C.loco,-.95,1.04,0);// cab lower
 for(const z of[-.56,.56]){box(g,.16,.7,.08,C.loco,-.53,1.7,z);box(g,.16,.7,.08,C.loco,-1.37,1.7,z);box(g,1.0,.1,.1,'#f3e6c8',-.95,1.38,z);}// pillars + sill
 box(g,.08,.7,1.2,C.loco,-.47,1.7,0);box(g,.06,.7,1.2,'#1f2430',-1.42,1.7,0);// front wall, rear
 for(const z of[-.33,.33]){const f=cyl(g,.17,.17,.04,'#f3e6c8',-.44,1.78,z,'x',16);cyl(g,.12,.12,.05,'#26303f',-.43,1.78,z,'x',16);}// round front windows
 {const sp=new THREE.Shape();const N=16;for(let i=0;i<=N;i++){const u=-.74+1.48*i/N;sp[i?'lineTo':'moveTo'](u,.16*(1-(u/.74)**2));}for(let i=N;i>=0;i--){const u=-.74+1.48*i/N;sp.lineTo(u,.16*(1-(u/.74)**2)+.07);}
  const rg=new THREE.ExtrudeGeometry(sp,{depth:1.24,bevelEnabled:false});rg.rotateY(-Math.PI/2);rg.center();const roof=new THREE.Mesh(rg,lam('#c9573f'));roof.position.set(-.95,2.12,0);roof.castShadow=true;g.add(roof);}
 box(g,.9,.04,1.05,'#3a2e28',-.95,1.36,0);// cab floor/interior shadow
 cyl(g,.13,.16,.42,C.boiler,1.15,1.66,0);cyl(g,.27,.13,.32,C.boiler,1.15,2.0,0);cyl(g,.29,.29,.06,'#e9b35d',1.15,2.17,0);// flared chimney + brass rim
 cyl(g,.235,.235,.009,'#1c2229',1.15,2.206,0,'y',16); // dark hollow opening, readable in flight
 for(const bx of[-.3,.25,.85])cyl(g,.475,.475,.05,'#e9b35d',bx,1.1,0,'x',20);// brass boiler bands
 cyl(g,.17,.2,.24,C.loco,.45,1.58,0);{const d=new THREE.Mesh(new THREE.SphereGeometry(.17,16,8,0,Math.PI*2,0,Math.PI/2),lam('#e9b35d'));d.position.set(.45,1.7,0);d.castShadow=true;g.add(d);}// steam dome
 cyl(g,.13,.15,.16,C.loco,-.15,1.56,0);{const d=new THREE.Mesh(new THREE.SphereGeometry(.13,14,8,0,Math.PI*2,0,Math.PI/2),lam(C.loco));d.position.set(-.15,1.64,0);g.add(d);}// sand dome
 for(const z of[-.6,.6]){box(g,1.95,.05,.22,'#2b2f38',.55,.9,z);box(g,1.9,.03,.03,'#e9b35d',.5,1.32,z*.84);}// running boards + handrails
 cyl(g,.06,.06,.05,'#e9b35d',.45,1.88,0);// whistle
 cyl(g,.48,.48,.08,'#1f2430',1.52,1.1,0,'x',20);cyl(g,.34,.34,.04,'#e9b35d',1.57,1.1,0,'x',20);// smokebox door
 cyl(g,.055,.055,.045,'#36404a',1.61,1.1,0,'x',10);box(g,.03,.035,.28,'#36404a',1.635,1.1,0);for(const y of[.92,1.28])box(g,.035,.065,.09,'#43494b',1.605,y,-.25);
 {const cc=new THREE.Shape();cc.moveTo(0,.06);cc.lineTo(.52,.06);cc.lineTo(0,.56);cc.closePath();const cg=new THREE.ExtrudeGeometry(cc,{depth:.9,bevelEnabled:false});cg.translate(0,0,-.45);const cw=new THREE.Mesh(cg,lam('#c9573f'));cw.position.set(1.6,0,0);cw.castShadow=true;g.add(cw);
  for(let i=-3;i<=3;i++){const bar=box(g,.7,.05,.05,'#8a3a2a',1.86,.31,i*.14);bar.rotation.z=-.765;bar.position.z=i*.14*(1)+0;}// slatted pilot
  box(g,.12,.16,1.15,'#2b2f38',1.6,.62,0);}// buffer beam
 box(g,.22,.24,.22,'#2b2f38',1.42,1.68,0);cyl(g,.09,.09,.04,'#fff1b8',1.54,1.68,0,'x',14);// headlamp
 for(const z of[-.52,.52]){wheel(g,.42,.75,z,W);wheel(g,.42,-.15,z,W);wheel(g,.24,1.45,z,W,6);wheel(g,.3,-1.15,z,W,6);}
 for(const z of[-.62,.62]){const ph=z>0?0:Math.PI/2;
  cyl(g,.15,.15,.42,'#2f3640',1.3,.45,z*.98,'x',14);cyl(g,.16,.16,.04,'#e9b35d',1.52,.45,z*.98,'x',14);// piston cylinder
  for(const yy of[.35,.55])box(g,.72,.025,.04,'#8a8478',.83,yy,z*1.06+.06*Math.sign(z));
  const piston=box(g,.45,.035,.035,'#ead7ad',1,.45,z*1.06+.06*Math.sign(z));
  const side=box(g,.9,.08,.05,'#efe6d2',0,0,z*1.06);const main=box(g,1,.08,.05,'#cfc6b2',0,0,z*1.06+.06*Math.sign(z));const xh=box(g,.16,.12,.07,'#efe6d2',0,.45,z*1.06+.06*Math.sign(z));
  RD.push({side,main,xh,piston,ph,ax:.75,bx:-.15,cr:.2,y:.42,length:1});}
 for(const z of[-.33,.33]){cyl(g,.075,.075,.09,'#8a8478',-1.66,.62,z,'x',10);}box(g,.12,.1,.1,'#2b2f38',-1.64,.55,0);cyl(g,.035,.035,.2,'#8a8478',-1.75,.55,0,'x',8);// rear coupler
 // Fold lines and rail stanchions retain the broad paper silhouette from above.
 box(g,1.24,.012,.025,'#cf654d',-.95,2.24,0);for(const z of[-.735,.735])box(g,1.24,.012,.025,'#b5503b',-.95,2.079,z);
 for(const z of[-.504,.504])for(const x of[-.25,.45,1.1])box(g,.023,.15,.023,'#c4a46a',x,1.25,z);
 // A visible, inhabited cab without glazing or a driver figure.
 box(g,.07,.43,.64,'#242a32',-.57,1.62,0);
 for(const z of[-.23,.23]){cyl(g,.085,.085,.026,'#e9b35d',-.62,1.8,z,'x',12);cyl(g,.062,.062,.03,'#f3e6c8',-.64,1.8,z,'x',12);box(g,.035,.2,.035,'#e9b35d',-.72,1.6,z);box(g,.11,.035,.035,'#c9573f',-.72,1.7,z);}
 box(g,.035,.16,.31,'#111822',-.62,1.46,0);box(g,.038,.018,.21,'#d68545',-.645,1.47,0);
 for(const z of[-.34,.34]){box(g,.26,.065,.26,'#a8734a',-1.16,1.49,z);cyl(g,.035,.035,.18,'#2b2f38',-1.16,1.38,z);box(g,.4,.06,.22,'#343b49',-1.05,.85,z>0?.67:-.67);label(g,'07',.34,.19,-.98,1.08,Math.sign(z)*.608);}
 splitBody(g,.85);return g;}
// Running gear stays on the rail plane; only the sprung paper shell moves.
function splitBody(g,height){const body=new THREE.Group();for(const m of [...g.children])if(m.isMesh&&m.position.y>=height)body.add(m);g.add(body);g.userData.body=body;}
function shade(c,k){return '#'+new THREE.Color(c).multiplyScalar(k).getHexString();}
function beam(g,a,b,r,c){const m=cyl(g,r,r,a.distanceTo(b),c,0,0,0,'y',6);m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),b.clone().sub(a).normalize());return m;}
function foldedRoof(g,length,width,y,c,rise=.18){const sp=new THREE.Shape();sp.moveTo(-width/2,0);sp.lineTo(0,rise);sp.lineTo(width/2,0);sp.lineTo(width/2,-.045);sp.lineTo(0,rise-.045);sp.lineTo(-width/2,-.045);sp.closePath();const geo=new THREE.ExtrudeGeometry(sp,{depth:length,bevelEnabled:false});geo.rotateY(-Math.PI/2);geo.translate(length/2,0,0);const roof=new THREE.Mesh(geo,lam(c));roof.position.y=y;roof.castShadow=roof.receiveShadow=true;g.add(roof);box(g,length,.018,.035,shade(c,1.12),0,y+rise,0);return roof;}
function wagon(c,W,kind=0){const g=new THREE.Group();box(g,2.2,.16,.9,'#2b2f38',0,.55,0);box(g,2.28,.1,1.06,shade(c,.62),0,.66,0);// underframe + sill
 for(const z of[-.5,.5])for(const x of[-.65,.65]){wheel(g,.26,x,z,W,6);box(g,.14,.12,.05,'#2b2f38',x,.26,z*1.16);}// wheels + axle boxes
 for(const x of[-.65,.65]){cyl(g,.045,.045,1,'#343b40',x,.26,0,'z',10);for(const z of[-.58,.58])for(let i=0;i<3;i++)box(g,.38-i*.07,.022,.04,'#5c6060',x,.4+i*.024,z);}
 for(const sx of[-1,1]){box(g,.12,.1,.1,'#2b2f38',sx*1.16,.55,0);cyl(g,.035,.035,.18,'#8a8478',sx*1.26,.55,0,'x',8);for(const z of[-.33,.33])cyl(g,.07,.07,.06,'#8a8478',sx*1.17,.62,z,'x',10);}// couplers + buffers
 if(kind===0){box(g,2.1,.78,.98,c,0,1.1,0);for(let x=-.84;x<=.85;x+=.42)for(const z of[-.495,.495])box(g,.03,.76,.012,shade(c,.78),x,1.1,z);box(g,.62,.66,1.0,shade(c,.85),0,1.08,0);foldedRoof(g,2.32,1.14,1.52,shade(c,.78));for(const z of[-.513,.513]){for(let yy=.82;yy<1.48;yy+=.125)box(g,2.06,.012,.012,shade(c,.72),0,yy,z);box(g,.025,.14,.025,'#e9b35d',.22,1.1,z*1.035);box(g,.74,.025,.025,'#2b2f38',0,1.43,z);for(const x of[-.28,.28])box(g,.027,.61,.02,shade(c,.65),x,1.08,z);const brace=box(g,.7,.028,.023,shade(c,.65),0,1.08,z*1.01);brace.rotation.z=.72;}}// boxcar
 else if(kind===1){for(const z of[-.46,.46])box(g,2.1,.5,.06,c,0,.96,z);for(const x of[-1.02,1.02])box(g,.06,.5,.98,c,x,.96,0);box(g,1.96,.06,.86,shade(c,.6),0,.74,0);
  for(const z of[-.495,.495])for(const yy of[.89,1.06])box(g,2.04,.013,.015,shade(c,.77),0,yy,z);
  for(let x=-.84;x<.9;x+=.22)box(g,.012,.008,.84,shade(c,.42),x,.776,0);
  const log=(x,y,len,tone)=>{cyl(g,.105,.12,len,tone,x,y,0,'z',8);for(const sign of[-1,1]){cyl(g,.098,.098,.012,'#d1ac76',x,y,sign*(len/2+.004),'z',8);const ring=new THREE.Mesh(new THREE.TorusGeometry(.06,.006,3,12),lam('#a47b4c'));ring.position.set(x,y,sign*(len/2+.012));g.add(ring);cyl(g,.018,.018,.017,'#a47b4c',x+.008,y-.004,sign*(len/2+.012),'z',6);}};
  for(let i=0;i<5;i++)log(-.8+i*.4,1.04,.83+(i%2)*.04,['#8a5a3a','#a8734a','#7a4e32'][i%3]);for(const x of[-.6,.6])log(x,1.23,.86,'#96633e');
  for(let x=-.7;x<=.71;x+=.7)for(const z of[-.5,.5])box(g,.05,.52,.02,shade(c,.7),x,.96,z);
  for(const z of[-.25,.25]){const pts=[[-1,1.12],[-.8,1.3],[-.6,1.355],[.6,1.355],[.8,1.3],[1,1.12]];for(let i=1;i<pts.length;i++)beam(g,new THREE.Vector3(pts[i-1][0],pts[i-1][1],z),new THREE.Vector3(pts[i][0],pts[i][1],z),.014,'#d6c098');}
 }// gondola with logs
 else{box(g,2.1,.86,.98,c,0,1.14,0);box(g,2.12,.08,1.0,'#f3e6c8',0,.98,0);for(let x=-.7;x<=.71;x+=.46)for(const z of[-.5,.5]){box(g,.3,.28,.02,'#f3e6c8',x,1.3,z);box(g,.22,.2,.024,'#26303f',x,1.3,z);}
  const sp=new THREE.Shape();for(let i=0;i<=12;i++){const u=-.6+1.2*i/12;sp[i?'lineTo':'moveTo'](u,.14*(1-(u/.6)**2));}for(let i=12;i>=0;i--){const u=-.6+1.2*i/12;sp.lineTo(u,.14*(1-(u/.6)**2)+.06);}
  const rg=new THREE.ExtrudeGeometry(sp,{depth:2.3,bevelEnabled:false});rg.rotateY(-Math.PI/2);rg.center();const roof=new THREE.Mesh(rg,lam(shade(c,.6)));roof.position.y=1.63;roof.castShadow=true;g.add(roof);
  for(const x of[-.78,0,.78])for(let i=0;i<10;i++){const z1=-.6+i*.12,z2=z1+.12;beam(g,new THREE.Vector3(x,1.593+.14*(1-(z1/.6)**2),z1),new THREE.Vector3(x,1.593+.14*(1-(z2/.6)**2),z2),.009,shade(c,.78));}
  for(const x of[-.48,.48]){cyl(g,.065,.065,.08,'#404b45',x,1.77,0);cyl(g,.105,.105,.025,shade(c,.8),x,1.82,0);}
  for(const z of[-.517,.517]){for(let x=-.7;x<=.71;x+=.46){box(g,.012,.19,.012,'#d1c5a4',x,1.3,z);box(g,.18,.018,.014,'#6a8590',x,1.36,z*.995);}label(g,'03',.26,.15,0,.83,z);}
  for(const sign of[-1,1]){const x=sign*1.065;box(g,.016,.62,.37,shade(c,.7),x,1.1,0);box(g,.022,.22,.24,'#e3d7b7',x*1.005,1.28,0);box(g,.025,.15,.17,'#354752',x*1.01,1.28,0);box(g,.22,.045,.68,'#343b38',sign*1.12,.73,0);for(const z of[-.38,.38]){beam(g,new THREE.Vector3(sign*1.14,.76,z),new THREE.Vector3(sign*1.14,1.25,z),.014,'#e3d7b7');}}
 }// coach
 splitBody(g,.66);return g;}
export function createTrain({wagons=3}={}){const t=new THREE.Group();const cars=[],W=[];const RD=[];const L=locomotive(W,RD);t.add(L);cars.push({g:L,len:3.2});
 let x=-1.6;for(let i=0;i<wagons;i++){const w=wagon(TRAIN_COLORS.wag[i%4],W,i%3);x-=.5+1.1;w.position.x=x;x-=1.1;t.add(w);cars.push({g:w,len:2.2});}
 for(let i=1;i<cars.length;i++){const a=cars[i-1],b=cars[i],x1=a.g.position.x-a.len/2-.13,x2=b.g.position.x+b.len/2+.13;beam(t,new THREE.Vector3(x1,.55,0),new THREE.Vector3(x2,.55,0),.026,'#706c61');const link=new THREE.Mesh(new THREE.TorusGeometry(.065,.014,4,10),lam('#b3a58b'));link.position.set((x1+x2)/2,.51,.07);link.scale.x=1.5;t.add(link);}
 t.userData={cars,wheels:W,rods:RD,ang:0,t:0,length:-x};return t;}
const PUFF_G=new THREE.IcosahedronGeometry(1,1);const puffColors=[];for(let i=0;i<PUFF_G.attributes.position.count;i++){const k=.88+.12*((Math.floor(i/3)*17%23)/22);puffColors.push(k,k*.985,k*.95);}PUFF_G.setAttribute('color',new THREE.Float32BufferAttribute(puffColors,3));const PUFF_C=['#fffdf5','#f7f4ed','#f2eee6'];
function puff(t,u,big){const root=u.smokeRoot||t.parent;if(!root)return;let p=u.pool.find(q=>!q.visible);
 if(!p){p=new THREE.Mesh(PUFF_G,new THREE.MeshBasicMaterial({color:PUFF_C[u.pool.length%3],vertexColors:true}));p.castShadow=false;root.add(p);u.pool.push(p);}
 const L=u.cars[0].g;const v=new THREE.Vector3(1.15,2.25,0);(L.userData.body||L).localToWorld(v);root.worldToLocal(v);p.position.copy(v);p.visible=true;
 p.userData={age:0,life:(big?1.65:1.3)+Math.random()*.25,s0:big?.13:.1,vx:(Math.random()-.5)*.2-u.spd*.45,vz:(Math.random()-.5)*.3,spin:(Math.random()-.5)*2};p.rotation.set(Math.random()*6,Math.random()*6,0);}
export function updateTrain(t,dt,speed=1){const u=t.userData;u.pool||(u.pool=[]);u.spd=speed;
 // body motion: chuff-synced bob on loco, lagged rock & sway on each wagon
 u.cars.forEach((c,i)=>{const ph=u.ang*(i?1.3:2)+i*1.7,a=Math.min(1,speed);const b=c.g.userData.body;b.position.y=Math.abs(Math.sin(ph))*.012*a;b.rotation.x=Math.sin(ph*.5+i)*.008*a;b.rotation.z=Math.sin(ph*.7)*.004*a;});u.t+=dt*speed;for(const w of u.wheels)w.m.rotation.z-=dt*speed/w.r;u.ang-=dt*speed/.42;
 for(const r of u.rods){const a=u.ang+r.ph,cx=Math.cos(a)*r.cr,cy=Math.sin(a)*r.cr;r.side.position.set((r.ax+r.bx)/2+cx,r.y+cy,r.side.position.z);
  // Exact slider-crank closure, on a fixed piston axis, with quartered drivers.
  const px=r.bx+cx,py=r.y+cy,dy=.45-py,hx=px+Math.sqrt(r.length*r.length-dy*dy);r.xh.position.x=hx;
  r.main.position.set((px+hx)/2,(py+.45)/2,r.main.position.z);r.main.rotation.z=Math.atan2(dy,hx-px);
  r.piston.position.x=(hx+1.3)/2;r.piston.scale.x=(1.3-hx)/.45;}

 const ch=Math.floor(-u.ang*3/Math.PI);if(ch!==u.chuff){u.chuff=ch;if(speed>.05)puff(t,u,speed<1.6);}u.idleT=(u.idleT||0)+dt;if(speed<.05&&u.idleT>.9){u.idleT=0;puff(t,u,false);}
 for(const p of u.pool){if(!p.visible)continue;const d=p.userData;d.age+=dt;const k=d.age/d.life;if(k>=1){p.visible=false;continue;}
  p.position.x+=d.vx*dt*(1-k*.5);p.position.z+=d.vz*dt;p.position.y+=dt*(.85-k*.55);p.rotation.y+=d.spin*dt;const scale=(d.s0+Math.sqrt(k)*.25)*Math.min(1,k*12)*Math.min(1,(1-k)*5);p.scale.set(scale*1.12,scale*.87,scale); /* Opaque neutral facets shrink away: no grass-tinted alpha edges. */}}
