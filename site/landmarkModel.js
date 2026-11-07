import * as THREE from 'three';
// Kağıt Kuş landmarks: paper/felt lighthouse + windmill. Bases sit on y=0.
export const LANDMARK_POLISH=10;
const lam=(c,o={})=>new THREE.MeshLambertMaterial({color:c,flatShading:true,...o});
function M(){return{red:lam('#d8645a'),cream:lam('#f4ead6'),dark:lam('#4c483e'),roof:lam('#b9524a'),glass:new THREE.MeshLambertMaterial({color:'#fff1b8',emissive:'#ffc85a',emissiveIntensity:.55,transparent:true,opacity:.82}),rock:lam('#a9a497'),rock2:lam('#8f8b80'),grass:lam('#9fb985'),wood:lam('#b98a5c'),wood2:lam('#8b6440'),plaster:lam('#efe3c8'),sail:lam('#fbf5e8',{side:THREE.DoubleSide,emissive:'#4a4232'}),blue:lam('#7a9cb4'),stone:lam('#d7cdb8')};}
const mesh=(g,m,p=[0,0,0],sh=true)=>{const o=new THREE.Mesh(g,m);o.position.set(...p);o.castShadow=sh;o.receiveShadow=true;return o;};
function glowTex(){const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),r=g.createRadialGradient(32,32,2,32,32,31);r.addColorStop(0,'rgba(255,248,210,1)');r.addColorStop(.35,'rgba(255,214,120,.55)');r.addColorStop(1,'rgba(255,200,90,0)');g.fillStyle=r;g.fillRect(0,0,64,64);return new THREE.CanvasTexture(c);}
function beamTex(){const c=document.createElement('canvas');c.width=128;c.height=32;const g=c.getContext('2d');const l=g.createLinearGradient(0,0,128,0);l.addColorStop(0,'rgba(255,240,190,.75)');l.addColorStop(1,'rgba(255,240,190,0)');g.fillStyle=l;g.fillRect(0,0,128,32);const v=g.createLinearGradient(0,0,0,32);v.addColorStop(0,'rgba(0,0,0,1)');v.addColorStop(.5,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,1)');g.globalCompositeOperation='destination-out';g.fillStyle=v;g.fillRect(0,0,128,32);return new THREE.CanvasTexture(c);}

export function createLighthouse(opts={}){
 const m=M(),root=new THREE.Group();root.userData={kind:'lighthouse',t:0,seed:opts.seed||1};
 // iter8: rock base + stone plinth + steps
 let sd=opts.seed||3;const rnd=()=>{sd=(sd*1664525+1013904223)>>>0;return sd/4294967296;};
 root.add(mesh(new THREE.CylinderGeometry(1.55,1.75,.22,12),m.grass,[0,.11,0]));
 for(let i=0;i<11;i++){const a=i/11*Math.PI*2+rnd()*.3;const r=1.35+rnd()*.3,s=.16+rnd()*.16;if(Math.abs(Math.atan2(Math.cos(a),Math.sin(a)))<.45)continue;const rk=mesh(new THREE.DodecahedronGeometry(s,0),rnd()<.5?m.rock:m.rock2,[Math.cos(a)*r,.2+s*.2,Math.sin(a)*r]);rk.scale.y=.75;rk.rotation.set(rnd()*3,rnd()*3,0);root.add(rk);}
 root.add(mesh(new THREE.CylinderGeometry(1.05,1.15,.28,16),m.stone,[0,.36,0]));
 for(let i=0;i<3;i++)root.add(mesh(new THREE.BoxGeometry(.56-i*.04,.1,.2),m.stone,[0,.25+i*.08,1.42-i*.14]));
 // iter1-2: tapered tower in painted paper bands (polygonal = folded paper)
 const H=3.2,r0=.82,r1=.52,bands=5,y0=.5;
 for(let i=0;i<bands;i++){const a=i/bands,b=(i+1)/bands;const g=new THREE.CylinderGeometry(r0+(r1-r0)*b,r0+(r1-r0)*a,H/bands,12);root.add(mesh(g,i%2?m.red:m.cream,[0,y0+H*(a+b)/2,0]));}
 const top=y0+H;
 // door + windows
 const door=mesh(new THREE.BoxGeometry(.3,.46,.06),m.wood,[0,y0+.23,r0-.01]);door.rotation.x=-Math.atan((r0-r1)/H);root.add(door);
 root.add(mesh(new THREE.CylinderGeometry(.15,.15,.06,10,1,false,0,Math.PI),m.wood,[0,y0+.46,r0-.06]).rotateX(Math.PI/2).rotateY(0));
 for(const [f,ang] of [[.38,0.4],[.62,2.6],[.82,-.4]]){const r=r0+(r1-r0)*f+.0;const w=mesh(new THREE.BoxGeometry(.17,.26,.05),m.dark,[Math.sin(ang)*r,y0+H*f,Math.cos(ang)*r]);w.rotation.y=ang;root.add(w);const sl=mesh(new THREE.BoxGeometry(.19,.035,.08),m.cream,[Math.sin(ang)*(r+.01),y0+H*f-.12,Math.cos(ang)*(r+.01)]);sl.rotation.y=ang;root.add(sl);}
 // iter3: gallery deck, rail, lantern
 root.add(mesh(new THREE.CylinderGeometry(.78,.62,.14,14),m.dark,[0,top+.07,0]));
 const rail=new THREE.Group();rail.add(mesh(new THREE.TorusGeometry(.74,.025,4,24),m.dark,[0,.32,0]).rotateX(Math.PI/2));
 for(let i=0;i<16;i++){const a=i/16*Math.PI*2;rail.add(mesh(new THREE.BoxGeometry(.03,.3,.03),m.dark,[Math.cos(a)*.74,.17,Math.sin(a)*.74]));}
 rail.position.y=top+.14;root.add(rail);
 root.add(mesh(new THREE.CylinderGeometry(.46,.46,.12,10),m.red,[0,top+.2,0]));
 const glass=mesh(new THREE.CylinderGeometry(.4,.4,.5,8,1,true),m.glass,[0,top+.51,0],false);root.add(glass);
 for(let i=0;i<8;i++){const a=i/8*Math.PI*2+Math.PI/8;root.add(mesh(new THREE.BoxGeometry(.035,.52,.035),m.dark,[Math.cos(a)*.41,top+.51,Math.sin(a)*.41]));}
 const lampMat=new THREE.MeshBasicMaterial({color:'#fff6c8'});const lamp=mesh(new THREE.SphereGeometry(.16,10,8),lampMat,[0,top+.5,0],false);root.add(lamp);
 root.add(mesh(new THREE.ConeGeometry(.52,.5,10),m.roof,[0,top+1.01,0]));
 root.add(mesh(new THREE.SphereGeometry(.07,8,6),m.dark,[0,top+1.3,0]));
 root.add(mesh(new THREE.ConeGeometry(.02,.25,4),m.dark,[0,top+1.45,0]));
 const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex(),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:.7}));halo.position.y=top+.5;halo.scale.setScalar(1.3);root.add(halo);
 // iter4: soft paper beam (two flat fading blades, not an opaque cone)
 const pivot=new THREE.Group();pivot.position.y=top+.5;const bt=beamTex();
 for(const s of [1,-1]){const g=new THREE.PlaneGeometry(3.6,.8);g.translate(1.8+.3,0,0);const bm=new THREE.MeshBasicMaterial({map:bt,transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,opacity:.0});const b1=new THREE.Mesh(g,bm);b1.rotation.y=s>0?0:Math.PI;const b2=b1.clone();b2.rotation.x=Math.PI/2;pivot.add(b1,b2);}
 root.add(pivot);
 Object.assign(root.userData,{lamp,lampMat,halo,pivot,glass,height:top+1.5});
 if(opts.scale)root.scale.setScalar(opts.scale);return root;
}
export function updateLighthouse(o,dt,action='idle'){const u=o.userData;u.t+=dt;const on=action==='spin';const pulse=.5+.5*Math.sin(u.t*2.2);u.on=THREE.MathUtils.damp(u.on||0,on?1:0,4,dt);
 u.pivot.rotation.y+=dt*(.25+1.15*u.on);u.lampMat.color.setHSL(.13,1,.82+.12*pulse);
 u.halo.material.opacity=.45+.25*pulse+.3*u.on;u.halo.scale.setScalar(1.1+.25*pulse+.9*u.on);
 u.glass.material.emissiveIntensity=.45+.2*pulse+.6*u.on;
 u.pivot.children.forEach(b=>b.material.opacity=.06+.42*u.on);}

export function createWindmill(opts={}){
 const m=M(),root=new THREE.Group();root.userData={kind:'mill',t:0};
 // iter8: low stone base + threshold
 root.add(mesh(new THREE.CylinderGeometry(1.05,1.15,.18,10),m.stone,[0,.09,0]));
 root.add(mesh(new THREE.BoxGeometry(.5,.07,.22),m.rock,[0,.2,.98]));
 for(let i=0;i<3;i++){const st=mesh(new THREE.CylinderGeometry(.16-.02*i,.18-.02*i,.05,7),m.rock,[(i%2?.08:-.06),.025,1.35+i*.38]);st.rotation.y=i;root.add(st);}
 // iter5: tapered octagonal plaster tower with wood bands
 const H=2.6,y0=.18;const tw=mesh(new THREE.CylinderGeometry(.62,.92,H,8),m.plaster,[0,y0+H/2,0]);root.add(tw);
 for(const f of [.02,.55])root.add(mesh(new THREE.CylinderGeometry(.92-(.3*f)+.03,.92-.3*f+.03,.07,8),m.wood2,[0,y0+H*f+.04,0]));
 const door=mesh(new THREE.BoxGeometry(.34,.56,.08),m.wood,[0,y0+.28,.86]);door.rotation.x=-.11;root.add(door);
 root.add(mesh(new THREE.BoxGeometry(.04,.5,.09),m.wood2,[0,y0+.28,.87]));
 for(const [f,a] of [[.5,0],[.62,1.9],[.45,-2],[.75,3.1]]){const r=.92-.3*f;const w=mesh(new THREE.BoxGeometry(.16,.22,.06),m.dark,[Math.sin(a)*r,y0+H*f,Math.cos(a)*r]);w.rotation.y=a;root.add(w);const s=mesh(new THREE.BoxGeometry(.22,.04,.08),m.wood,[Math.sin(a)*(r+.02),y0+H*f-.13,Math.cos(a)*(r+.02)]);s.rotation.y=a;root.add(s);}
 const ow=mesh(new THREE.CylinderGeometry(.11,.11,.06,12),m.dark,[0,y0+1.0,.78]);ow.rotation.x=Math.PI/2-.11;root.add(ow);root.add(mesh(new THREE.TorusGeometry(.12,.025,4,14),m.wood,[0,y0+1.0,.79]).rotateX(-.11));
 root.add(mesh(new THREE.BoxGeometry(.5,.06,.22),m.roof,[0,y0+.62,.9]).rotateX(.35));
 // cap (rotatable cap holds sails + tail)
 const cap=new THREE.Group();cap.position.y=y0+H;root.add(cap);
 cap.add(mesh(new THREE.CylinderGeometry(.7,.7,.1,10),m.wood2,[0,.05,0]));
 const roof=mesh(new THREE.ConeGeometry(.74,.85,10),m.roof,[0,.52,0]);roof.scale.z=1.1;cap.add(roof);
 cap.add(mesh(new THREE.SphereGeometry(.08,8,6),m.wood2,[0,.98,0]));
 cap.add(mesh(new THREE.CylinderGeometry(.015,.015,.4,4),m.dark,[0,1.18,0]));const flag=mesh(new THREE.ConeGeometry(.1,.32,3),m.red,[0,1.3,-.17]);flag.rotation.x=-Math.PI/2;flag.scale.x=.25;cap.add(flag);
 // iter6: shaft, hub, four framed paper sails
 const shaft=mesh(new THREE.CylinderGeometry(.07,.09,.75,8),m.wood2,[0,.35,.55]);shaft.rotation.x=Math.PI/2-.12;cap.add(shaft);
 const hub=new THREE.Group();hub.position.set(0,.4,.95);hub.rotation.x=-.12;cap.add(hub);
 hub.add(mesh(new THREE.CylinderGeometry(.14,.14,.14,10),m.red,[0,0,0]).rotateX(Math.PI/2));
 hub.add(mesh(new THREE.SphereGeometry(.07,8,6),m.wood2,[0,0,.08]));
 const sails=new THREE.Group();hub.add(sails);
 for(let i=0;i<4;i++){const arm=new THREE.Group();arm.rotation.z=i*Math.PI/2+.4;sails.add(arm);
  arm.add(mesh(new THREE.BoxGeometry(.07,1.85,.06),m.wood2,[0,.98,0]));
  const L=1.45,W=.42,st=.38;arm.add(mesh(new THREE.PlaneGeometry(W,L),m.sail,[W/2+.04,st+L/2,-.02]));
  for(let k=0;k<=5;k++)arm.add(mesh(new THREE.BoxGeometry(W+.04,.025,.03),m.wood,[W/2+.04,st+k*L/5,.01]));
  arm.add(mesh(new THREE.PlaneGeometry(W,.2),m.red,[W/2+.04,st+L-.12,-.01]));
  const br=mesh(new THREE.BoxGeometry(.02,Math.hypot(W,L),.02),m.wood,[W/2+.04,st+L/2,.02]);br.rotation.z=Math.atan2(W,L);arm.add(br);
  for(const x of [.04,W+.04])arm.add(mesh(new THREE.BoxGeometry(.025,L,.03),m.wood,[x,st+L/2,.01]));}
 // iter7: tail pole + paper vane at the back -> reads windward front
 const tail=mesh(new THREE.BoxGeometry(.06,.06,1.7),m.wood2,[0,-.35,-1.05]);tail.rotation.x=-.62;cap.add(tail);

 const fin=mesh(new THREE.BoxGeometry(.03,.42,.5),m.red,[0,.25,-.95]);cap.add(fin);
 for(const s of [-1,1]){const b=mesh(new THREE.BoxGeometry(.04,.04,1.0),m.wood,[s*.35,-.2,-.75]);b.rotation.set(-.75,s*-.3,0);cap.add(b);}
 Object.assign(root.userData,{sails,cap,tower:tw,height:y0+H+2.3});
 if(opts.scale)root.scale.setScalar(opts.scale);return root;
}
export function updateWindmill(o,dt,action='idle'){const u=o.userData;u.t+=dt;u.w=THREE.MathUtils.damp(u.w||.15,action==='spin'?2.2:.15,1.6,dt);u.sails.rotation.z-=u.w*dt;
 u.cap.rotation.z=Math.sin(u.t*1.3)*.006*(u.w);u.sails.children.forEach((a,i)=>a.scale.x=1+.03*Math.sin(u.t*3+i)*Math.min(1,u.w));u.cap.rotation.y=Math.sin(u.t*.25)*.03;}
export function createLandmark(o={}){return o.kind==='mill'?createWindmill(o):createLighthouse(o);}
export function updateLandmark(o,dt,a){return o.userData.kind==='mill'?updateWindmill(o,dt,a):updateLighthouse(o,dt,a);}
