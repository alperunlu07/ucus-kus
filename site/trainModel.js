import * as THREE from 'three';
const M={};const lam=c=>M[c]||(M[c]=new THREE.MeshLambertMaterial({color:c,flatShading:true}));
export const TRAIN_COLORS={loco:'#3d4f7a',boiler:'#2f3640',wag:['#c9573f','#e9b35d','#5f8f6a','#7aa6c2']};
function box(g,w,h,d,c,x,y,z){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),lam(c));m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;g.add(m);return m;}
function cyl(g,r1,r2,h,c,x,y,z,axis='y',seg=16){const ge=new THREE.CylinderGeometry(r1,r2,h,seg);if(axis==='x')ge.rotateZ(Math.PI/2);if(axis==='z')ge.rotateX(Math.PI/2);const m=new THREE.Mesh(ge,lam(c));m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;g.add(m);return m;}
function wheel(g,r,x,z,list,spokes=8){const w=new THREE.Group();w.position.set(x,r,z);g.add(w);
 const tire=new THREE.Mesh(new THREE.CylinderGeometry(r,r,.1,24).rotateX(Math.PI/2),lam('#2b2f38'));tire.castShadow=true;w.add(tire);
 const hub=new THREE.Mesh(new THREE.CylinderGeometry(r*.82,r*.82,.12,24).rotateX(Math.PI/2),lam('#c9573f'));w.add(hub);
 const n=spokes/2;for(let i=0;i<n;i++){const s=new THREE.Mesh(new THREE.BoxGeometry(r*1.62,r*.13,.15),lam('#2b2f38'));s.rotation.z=i/n*Math.PI;w.add(s);}
 const cap=new THREE.Mesh(new THREE.CylinderGeometry(r*.22,r*.22,.16,12).rotateX(Math.PI/2),lam('#e9b35d'));w.add(cap);
 list.push({m:w,r});return w;}
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
 for(const bx of[-.3,.25,.85])cyl(g,.475,.475,.05,'#e9b35d',bx,1.1,0,'x',20);// brass boiler bands
 cyl(g,.17,.2,.24,C.loco,.45,1.58,0);{const d=new THREE.Mesh(new THREE.SphereGeometry(.17,16,8,0,Math.PI*2,0,Math.PI/2),lam('#e9b35d'));d.position.set(.45,1.7,0);d.castShadow=true;g.add(d);}// steam dome
 cyl(g,.13,.15,.16,C.loco,-.15,1.56,0);{const d=new THREE.Mesh(new THREE.SphereGeometry(.13,14,8,0,Math.PI*2,0,Math.PI/2),lam(C.loco));d.position.set(-.15,1.64,0);g.add(d);}// sand dome
 for(const z of[-.6,.6]){box(g,1.95,.05,.22,'#2b2f38',.55,.9,z);box(g,1.9,.03,.03,'#e9b35d',.5,1.32,z*.84);}// running boards + handrails
 cyl(g,.06,.06,.05,'#e9b35d',.45,1.88,0);// whistle
 cyl(g,.48,.48,.08,'#1f2430',1.52,1.1,0,'x',20);cyl(g,.34,.34,.04,'#e9b35d',1.57,1.1,0,'x',20);// smokebox door
 {const cc=new THREE.Shape();cc.moveTo(0,.06);cc.lineTo(.52,.06);cc.lineTo(0,.56);cc.closePath();const cg=new THREE.ExtrudeGeometry(cc,{depth:.9,bevelEnabled:false});cg.translate(0,0,-.45);const cw=new THREE.Mesh(cg,lam('#c9573f'));cw.position.set(1.6,0,0);cw.castShadow=true;g.add(cw);
  for(let i=-3;i<=3;i++){const bar=box(g,.7,.05,.05,'#8a3a2a',1.86,.31,i*.14);bar.rotation.z=-.765;bar.position.z=i*.14*(1)+0;}// slatted pilot
  box(g,.12,.16,1.15,'#2b2f38',1.6,.62,0);}// buffer beam
 box(g,.22,.24,.22,'#2b2f38',1.42,1.68,0);cyl(g,.09,.09,.04,'#fff1b8',1.54,1.68,0,'x',14);// headlamp
 for(const z of[-.52,.52]){wheel(g,.42,.75,z,W);wheel(g,.42,-.15,z,W);wheel(g,.24,1.45,z,W,6);wheel(g,.3,-1.15,z,W,6);}
 for(const z of[-.62,.62]){const ph=z>0?0:Math.PI/2;
  cyl(g,.15,.15,.42,'#2f3640',1.3,.45,z*.98,'x',14);cyl(g,.16,.16,.04,'#e9b35d',1.52,.45,z*.98,'x',14);// piston cylinder
  const side=box(g,1.02,.08,.05,'#efe6d2',0,0,z*1.06);const main=box(g,.8,.08,.05,'#cfc6b2',0,0,z*1.06+.06*Math.sign(z));const xh=box(g,.16,.12,.07,'#efe6d2',0,.45,z*1.06+.06*Math.sign(z));
  RD.push({side,main,xh,ph,ax:.75,bx:-.15,cr:.2,y:.42});}
 box(g,.12,.1,.1,'#2b2f38',-1.64,.55,0);cyl(g,.035,.035,.2,'#8a8478',-1.75,.55,0,'x',8);// rear coupler
 return g;}
function shade(c,k){return '#'+new THREE.Color(c).multiplyScalar(k).getHexString();}
function wagon(c,W,kind=0){const g=new THREE.Group();box(g,2.2,.16,.9,'#2b2f38',0,.55,0);box(g,2.28,.1,1.06,shade(c,.62),0,.66,0);// underframe + sill
 for(const z of[-.5,.5])for(const x of[-.65,.65]){wheel(g,.26,x,z,W,6);box(g,.14,.12,.05,'#2b2f38',x,.26,z*1.16);}// wheels + axle boxes
 for(const sx of[-1,1]){box(g,.12,.1,.1,'#2b2f38',sx*1.16,.55,0);cyl(g,.035,.035,.18,'#8a8478',sx*1.26,.55,0,'x',8);for(const z of[-.33,.33])cyl(g,.07,.07,.06,'#8a8478',sx*1.17,.62,z,'x',10);}// couplers + buffers
 if(kind===0){box(g,2.1,.78,.98,c,0,1.1,0);for(let x=-.84;x<=.85;x+=.42)for(const z of[-.495,.495])box(g,.03,.76,.012,shade(c,.78),x,1.1,z);box(g,.62,.66,1.0,shade(c,.85),0,1.08,0);box(g,2.32,.07,1.14,shade(c,.55),0,1.53,0);box(g,2.0,.1,.9,shade(c,.7),0,1.6,0);}// boxcar
 else if(kind===1){for(const z of[-.46,.46])box(g,2.1,.5,.06,c,0,.96,z);for(const x of[-1.02,1.02])box(g,.06,.5,.98,c,x,.96,0);box(g,1.96,.06,.86,shade(c,.6),0,.74,0);
  for(let i=0;i<5;i++)cyl(g,.11,.11,.84,['#8a5a3a','#a8734a','#7a4e32'][i%3],-.8+i*.4,.9+(i%2)*.08,0,'z',8);for(let x=-.7;x<=.71;x+=.7)for(const z of[-.5,.5])box(g,.05,.52,.02,shade(c,.7),x,.96,z);}// gondola with logs
 else{box(g,2.1,.86,.98,c,0,1.14,0);box(g,2.12,.08,1.0,'#f3e6c8',0,.98,0);for(let x=-.7;x<=.71;x+=.46)for(const z of[-.5,.5]){box(g,.3,.28,.02,'#f3e6c8',x,1.3,z);box(g,.22,.2,.024,'#26303f',x,1.3,z);}
  const sp=new THREE.Shape();for(let i=0;i<=12;i++){const u=-.6+1.2*i/12;sp[i?'lineTo':'moveTo'](u,.14*(1-(u/.6)**2));}for(let i=12;i>=0;i--){const u=-.6+1.2*i/12;sp.lineTo(u,.14*(1-(u/.6)**2)+.06);}
  const rg=new THREE.ExtrudeGeometry(sp,{depth:2.3,bevelEnabled:false});rg.rotateY(-Math.PI/2);rg.center();const roof=new THREE.Mesh(rg,lam(shade(c,.6)));roof.position.y=1.63;roof.castShadow=true;g.add(roof);}// coach
 return g;}
export function createTrain({wagons=3}={}){const t=new THREE.Group();const cars=[],W=[];const RD=[];const L=locomotive(W,RD);t.add(L);cars.push({g:L,len:3.2});
 let x=-1.6;for(let i=0;i<wagons;i++){const w=wagon(TRAIN_COLORS.wag[i%4],W,i%3);x-=.5+1.1;w.position.x=x;x-=1.1;t.add(w);cars.push({g:w,len:2.2});}
 t.userData={cars,wheels:W,rods:RD,ang:0,t:0,length:-x};return t;}
const PUFF_G=new THREE.IcosahedronGeometry(1,1);const PUFF_C=['#f4efe4','#e6e0d4','#d9d3c8'];
function puff(t,u,big){const root=u.smokeRoot||t.parent;if(!root)return;let p=u.pool.find(q=>!q.visible);
 if(!p){p=new THREE.Mesh(PUFF_G,new THREE.MeshLambertMaterial({color:PUFF_C[u.pool.length%3],flatShading:true,transparent:true,depthWrite:false}));p.castShadow=true;root.add(p);u.pool.push(p);}
 const L=u.cars[0].g;const v=new THREE.Vector3(1.15,2.25,0);L.localToWorld(v);root.worldToLocal(v);p.position.copy(v);p.visible=true;
 p.userData={age:0,life:(big?2.0:1.5)+Math.random()*.5,s0:big?.16:.12,vx:(Math.random()-.5)*.2-u.spd*.45,vz:(Math.random()-.5)*.3,spin:(Math.random()-.5)*2};p.rotation.set(Math.random()*6,Math.random()*6,0);}
export function updateTrain(t,dt,speed=1){const u=t.userData;u.pool||(u.pool=[]);u.spd=speed;
 // body motion: chuff-synced bob on loco, lagged rock & sway on each wagon
 u.cars.forEach((c,i)=>{const ph=u.ang*(i?1.3:2)+i*1.7,a=Math.min(1,speed);c.g.position.y=Math.abs(Math.sin(ph))*.018*a;c.g.rotation.x=Math.sin(ph*.5+i)*.012*a;c.g.rotation.z=Math.sin(ph*.7)*.006*a;});u.t+=dt*speed;for(const w of u.wheels)w.m.rotation.z-=dt*speed/w.r;u.ang-=dt*speed/.42;
 for(const r of u.rods){const a=u.ang+r.ph,cx=Math.cos(a)*r.cr,cy=Math.sin(a)*r.cr;r.side.position.set((r.ax+r.bx)/2+cx,r.y+cy,r.side.position.z);
  const px=r.ax+cx,py=r.y+cy,hx=1.05+cx*.0+Math.sqrt(.8*.8-cy*cy)*0+cx*.9;r.xh.position.x=1.12+cx*.6;const dx=r.xh.position.x-px,dy=.45-py;r.main.position.set((px+r.xh.position.x)/2,(py+.45)/2,r.main.position.z);r.main.rotation.z=Math.atan2(dy,dx);r.main.scale.x=Math.hypot(dx,dy)/.8;}
 const ch=Math.floor(-u.ang*3/Math.PI);if(ch!==u.chuff){u.chuff=ch;if(speed>.05)puff(t,u,speed<1.6);}u.idleT=(u.idleT||0)+dt;if(speed<.05&&u.idleT>.9){u.idleT=0;puff(t,u,false);}
 for(const p of u.pool){if(!p.visible)continue;const d=p.userData;d.age+=dt;const k=d.age/d.life;if(k>=1){p.visible=false;continue;}
  p.position.x+=d.vx*dt*(1-k*.5);p.position.z+=d.vz*dt;p.position.y+=dt*(.85-k*.55);p.rotation.y+=d.spin*dt;p.scale.setScalar(d.s0+Math.sqrt(k)*.34);p.material.opacity=k<.1?k*10*.95:.95*(1-Math.pow((k-.1)/.9,2));}}
