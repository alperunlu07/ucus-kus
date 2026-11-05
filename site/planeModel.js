// Kağıt Kuş — detaylı kağıt pervaneli uçak (burun -Z, yukarı +Y, ~3.6 boy, ~6 kanat açıklığı)
import * as THREE from 'three';
const lam=(c,o={})=>new THREE.MeshLambertMaterial(Object.assign({color:c},o));
const EDGE=new THREE.LineBasicMaterial({color:'#6b5a48',transparent:true,opacity:.32});
function crease(m,th=28){const e=new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry,th),EDGE);m.add(e);return m;}
// planform shape (x=span/out, y=chord along +z) -> extruded slab lying in XZ
function slab(pts,thick,mat,bevel=.02){const s=new THREE.Shape();pts.forEach((p,i)=>i?s.lineTo(p[0],p[1]):s.moveTo(p[0],p[1]));
 const g=new THREE.ExtrudeGeometry(s,{depth:thick,bevelEnabled:true,bevelThickness:bevel,bevelSize:bevel,bevelSegments:2,curveSegments:6});
 g.rotateX(Math.PI/2);g.translate(0,thick/2,0);// shape y -> +z, extrude -> -y
 const m=new THREE.Mesh(g,mat);m.castShadow=true;m.receiveShadow=true;return crease(m);}
function line(x0,z0,x1,z1,y,mat,w=.018){const L=Math.hypot(x1-x0,z1-z0);const m=new THREE.Mesh(new THREE.BoxGeometry(w,.006,L),mat);m.position.set((x0+x1)/2,y,(z0+z1)/2);m.rotation.y=Math.atan2(x1-x0,z1-z0);return m;}
function regTex(txt){const c=document.createElement('canvas');c.width=256;c.height=64;const g=c.getContext('2d');g.fillStyle='#3d3a46';g.font='bold 46px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(txt,128,34);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;}

export function buildPlane(opt={}){
 const C=Object.assign({body:'#fbf6ec',acc:'#e8766b',acc2:'#f2c46b',dark:'#4a4552',glass:'#7f9fb2',tire:'#3b3740',reg:'TC-KUŞ'},opt);
 const pm=lam(C.body),pa=lam(C.acc),py=lam(C.acc2),pd=lam(C.dark),pg=lam(C.glass),pt=lam(C.tire),seam=lam('#b9ab97');
 const P=new THREE.Group();P.name='plane';const root=new THREE.Group();P.add(root);// root receives bank/pitch
 const Y=.55;// fuselage centerline height
 // ---- fuselage: lathe profile (nose y+ -> tail y-), oval section, belly flat-ish, upswept tail
 const prof=[[0,1.62],[.30,1.60],[.34,1.30],[.35,.9],[.36,.4],[.34,0],[.30,-.5],[.23,-1.0],[.15,-1.45],[.08,-1.78],[.02,-1.86],[0,-1.86]].map(p=>new THREE.Vector2(p[0],p[1])).reverse();
 const fg=new THREE.LatheGeometry(prof,18);fg.rotateX(-Math.PI/2);
 {const a=fg.attributes.position;for(let i=0;i<a.count;i++){let x=a.getX(i),y=a.getY(i),z=a.getZ(i);x*=.86;if(y<0)y*=.78;// flatter belly
  if(z>.2)y+=(z-.2)*.14;a.setXYZ(i,x,y+Y,z);}fg.computeVertexNormals();}
 const fus=crease(new THREE.Mesh(fg,pm),35);fus.castShadow=fus.receiveShadow=true;root.add(fus);
 // cheat line stripe along both sides
 for(const s of[-1,1]){const st=new THREE.Mesh(new THREE.BoxGeometry(.02,.06,2.6),pa);st.position.set(s*.30,Y+.02,.1);st.rotation.y=-s*.05;root.add(st);}
 // ---- cowling (accent), front intake ring, exhaust stubs, cowl seam
 const cw=new THREE.Mesh(new THREE.CylinderGeometry(.31,.30,.55,18,1,true),pa);cw.rotation.x=Math.PI/2;cw.scale.set(.88,1,.82);cw.position.set(0,Y+.01,-1.38);root.add(crease(cw,40));
 const ring=new THREE.Mesh(new THREE.TorusGeometry(.25,.035,6,18),pd);ring.scale.set(.88,.82,1);ring.position.set(0,Y,-1.66);root.add(ring);
 const intake=new THREE.Mesh(new THREE.CircleGeometry(.25,18),pd);intake.scale.set(.88,.82,1);intake.position.set(0,Y,-1.655);intake.rotation.y=Math.PI;root.add(intake);
 for(const s of[-1,1])for(let k=0;k<2;k++){const ex=new THREE.Mesh(new THREE.CylinderGeometry(.025,.03,.12,6),pd);ex.rotation.z=s*Math.PI/2;ex.position.set(s*.29,Y-.1,-1.3+k*.13);root.add(ex);}
 root.add(line(-.25,-1.12,.25,-1.12,Y+.3,seam,.015));
 // ---- spinner + propeller
 const prop=new THREE.Group();prop.position.set(0,Y,-1.68);root.add(prop);
 const spin=new THREE.Mesh(new THREE.ConeGeometry(.15,.32,14),py);spin.rotation.x=-Math.PI/2;spin.position.z=-.16;prop.add(crease(spin,50));
 const bladeShape=new THREE.Shape();bladeShape.moveTo(.08,-.045);bladeShape.quadraticCurveTo(.5,-.085,.86,-.04);bladeShape.quadraticCurveTo(.92,0,.86,.03);bladeShape.quadraticCurveTo(.5,.06,.08,.035);bladeShape.lineTo(.08,-.045);
 const bg=new THREE.ExtrudeGeometry(bladeShape,{depth:.02,bevelEnabled:false});bg.translate(0,0,-.01);
 const blades=new THREE.Group();prop.add(blades);
 for(let i=0;i<2;i++){const b=new THREE.Mesh(bg,lam('#6e5644'));b.rotation.z=i*Math.PI;b.rotation.x=.25*(i?-1:1);b.castShadow=true;blades.add(b);
  const tip=new THREE.Mesh(new THREE.BoxGeometry(.1,.07,.025),py);tip.position.set(.82,0,0);b.add(tip);}
 // blur: thin ring in the prop plane (top-down reads as a fine line, 3/4 as an ellipse)
 const blurM=new THREE.MeshBasicMaterial({color:'#5d5148',transparent:true,opacity:0,depthWrite:false});
 const blur=new THREE.Mesh(new THREE.TorusGeometry(.86,.012,4,48),blurM);prop.add(blur);
 const blurTip=new THREE.Mesh(new THREE.TorusGeometry(.84,.022,4,48),new THREE.MeshBasicMaterial({color:C.acc2,transparent:true,opacity:0,depthWrite:false}));prop.add(blurTip);
 // ---- wings (low wing) with dihedral, rounded tips, separate ailerons + flaps
 const ail={};
 for(const s of[-1,1]){const w=new THREE.Group();w.position.set(s*.22,Y-.2,-.55);w.rotation.z=s*.06;root.add(w);
  const pts=[[0,0],[2.55,.12],[2.85,.2],[2.95,.36],[2.88,.62],[2.6,.66],[0,.95]].map(p=>[p[0]*s,p[1]]);if(s<0)pts.reverse();
  const wm=slab(pts,.05,pm,.022);w.add(wm);
  // tip accent
  const tp=[[2.35,.1],[2.85,.2],[2.95,.36],[2.88,.62],[2.6,.66],[2.35,.69]].map(p=>[p[0]*s,p[1]]);if(s<0)tp.reverse();const tipm=slab(tp,.055,pa,.022);tipm.position.y=.003;w.add(tipm);
  // aileron: hinge along trailing edge outer
  const ah=new THREE.Group();ah.position.set(s*1.55,0,.73);w.add(ah);
  const ap=[[0,0],[1.0,-.06],[1.0,.18],[0,.24]].map(p=>[p[0]*s,p[1]]);if(s<0)ap.reverse();const am=slab(ap,.03,pm,.012);am.position.y=.004;ah.add(am);
  ah.rotation.x=0;ail[s]=ah;
  // flap seam inner + aileron seams
  w.add(line(s*.15,.72,s*1.5,.74,.04,seam),line(s*1.55,.72,s*2.55,.66,.042,seam),line(s*1.5,.74,s*1.52,.95,.042,seam));
  // rivet/spar line
  w.add(line(s*.1,.3,s*2.6,.3,.035,lam('#e6dccb'),.012));
  // nav light
  const nl=new THREE.Mesh(new THREE.SphereGeometry(.045,8,6),new THREE.MeshBasicMaterial({color:s<0?'#e0504a':'#4fbf6a'}));nl.position.set(s*2.93,.0,.36);w.add(nl);
  // main gear: leg + wheel pant + tire
  const leg=new THREE.Mesh(new THREE.BoxGeometry(.05,.34,.08),pd);leg.position.set(s*.75,-.17,.35);leg.rotation.z=s*.18;w.add(leg);
  const pant=new THREE.Mesh(new THREE.SphereGeometry(.13,10,8),pm);pant.scale.set(.55,.75,1.6);pant.position.set(s*.8,-.36,.35);pant.castShadow=true;w.add(crease(pant,45));
  const tire=new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,.06,14),pt);tire.rotation.z=Math.PI/2;tire.position.set(s*.8,-.4,.35);tire.castShadow=true;w.add(tire);
 }
 // registration on right wing top (reads from above)
 {const r=new THREE.Mesh(new THREE.PlaneGeometry(1.3,.32),new THREE.MeshLambertMaterial({map:regTex(C.reg),transparent:true}));r.rotation.x=-Math.PI/2;r.position.set(1.35,.075,.42);root.children.find(o=>o.isGroup&&o.position.x>0&&o!==prop).add(r);}
 // wing root fairings
 for(const s of[-1,1]){const f=new THREE.Mesh(new THREE.SphereGeometry(.2,10,6),pm);f.scale.set(.6,.35,2.4);f.position.set(s*.26,Y-.18,-.1);root.add(f);}
 // ---- cabin canopy (matte), frame bars, door seam
 const can=new THREE.Mesh(new THREE.SphereGeometry(.26,18,10,0,Math.PI*2,0,Math.PI/2),pg);can.scale.set(.95,.95,2.3);can.position.set(0,Y+.22,-.35);root.add(crease(can,40));
 for(const z of[-.72,-.35,.05]){const fr=new THREE.Mesh(new THREE.TorusGeometry(.25,.018,4,16,Math.PI),pm);fr.scale.set(.95,.95,1);fr.position.set(0,Y+.22,z);root.add(fr);}
 root.add(line(0,-.9,0,.25,Y+.48,pm,.03));// center bar
 const seat=new THREE.Mesh(new THREE.BoxGeometry(.22,.1,.18),pd);seat.position.set(0,Y+.25,-.25);root.add(seat);// pilot head silhouette
 const head=new THREE.Mesh(new THREE.SphereGeometry(.08,10,8),lam('#e2b48f'));head.position.set(0,Y+.37,-.3);root.add(head);
 const cap=new THREE.Mesh(new THREE.SphereGeometry(.085,10,6,0,Math.PI*2,0,Math.PI/2),pa);cap.position.set(0,Y+.38,-.3);root.add(cap);
 for(const s of[-1,1])root.add(Object.assign(line(s*.3,-.1,s*.27,.5,Y+.05,seam,.012),{}));
 // antenna + beacon
 const ant=new THREE.Mesh(new THREE.CylinderGeometry(.008,.014,.32,5),pd);ant.position.set(0,Y+.42,.55);ant.rotation.x=.45;root.add(ant);
 const bea=new THREE.Mesh(new THREE.SphereGeometry(.035,8,6),new THREE.MeshBasicMaterial({color:'#ff5a4a'}));bea.position.set(0,Y+.3,.9);root.add(bea);
 // ---- tail: stabiliser + elevator, fin + rudder
 const tail=new THREE.Group();tail.position.set(0,Y+.2,1.35);root.add(tail);
 const stP=[[-1.05,.05],[-1.12,.2],[-1.02,.4],[1.02,.4],[1.12,.2],[1.05,.05],[.2,-.18],[-.2,-.18]];tail.add(slab(stP,.035,pm,.015));
 const elev=new THREE.Group();elev.position.set(0,0,.4);tail.add(elev);elev.add(slab([[-1.0,0],[-.9,.2],[.9,.2],[1.0,0]],.025,pa,.01));
 tail.add(line(-1,.4,1,.4,.03,seam));
 const fin=new THREE.Group();fin.position.set(0,0,0);tail.add(fin);
 const finS=new THREE.Shape();finS.moveTo(-.25,0);finS.lineTo(.28,0);finS.lineTo(.3,.62);finS.quadraticCurveTo(.2,.72,.08,.7);finS.lineTo(-.25,0);
 const fgm=new THREE.ExtrudeGeometry(finS,{depth:.04,bevelEnabled:true,bevelThickness:.012,bevelSize:.012,bevelSegments:1});fgm.rotateY(-Math.PI/2);fgm.translate(.02,0,0);
 const finM=crease(new THREE.Mesh(fgm,pm));finM.castShadow=true;fin.add(finM);
 const rud=new THREE.Group();rud.position.set(0,0,.28);fin.add(rud);
 const rS=new THREE.Shape();rS.moveTo(0,0);rS.lineTo(.22,.04);rS.lineTo(.18,.58);rS.quadraticCurveTo(.08,.68,0,.62);rS.lineTo(0,0);
 const rg=new THREE.ExtrudeGeometry(rS,{depth:.03,bevelEnabled:false});rg.rotateY(-Math.PI/2);rg.translate(.015,0,0);const rm=crease(new THREE.Mesh(rg,pa));rm.castShadow=true;rud.add(rm);
 // rudder stripe
 const rs=new THREE.Mesh(new THREE.BoxGeometry(.035,.08,.2),py);rs.position.set(0,.4,.1);rud.add(rs);
 // tail wheel
 const tw=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,.03,10),pt);tw.rotation.z=Math.PI/2;tw.position.set(0,-.38,.3);tail.add(tw);
 const twl=new THREE.Mesh(new THREE.BoxGeometry(.02,.2,.03),pd);twl.position.set(0,-.27,.25);twl.rotation.x=-.4;tail.add(twl);
 // ---- animation
 let ang=0,bank=0,pitch=0,yaw=0;
 P.userData={prop,blades,blur,ail,elev,rud,root,
  tick(dt,{steer=0,climb=0,spin=1}={}){
   ang+=dt*spin*55;blades.rotation.z=ang;
   const f=THREE.MathUtils.clamp((spin-.25)/.6,0,1);blurM.opacity=.38*f;blurTip.material.opacity=.45*f;blades.children.forEach(b=>{b.material.transparent=true;b.material.opacity=1-.75*f;});
   const k=1-Math.exp(-dt*5);bank+=(-steer*.5-bank)*k;pitch+=(climb*.22-pitch)*k;yaw+=(steer-yaw)*k;
   root.rotation.z=bank;root.rotation.x=pitch;
   ail[-1].rotation.x=yaw*.45;ail[1].rotation.x=-yaw*.45;elev.rotation.x=-climb*.5;rud.rotation.y=-yaw*.4;
  }};
 return P;}
