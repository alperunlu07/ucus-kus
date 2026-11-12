// Kağıt Kuş — kağıt sıcak hava balonu (festival).
// ORIGIN: (0,0,0) = sepet tabanının alt merkezi. Zarf yukarıda (+Y), sepet altta.
// Toplam yükseklik userData.height (scale=1 için ~4.1). Oyunda gökyüzüne yerleştirirken
// group.position.y = istenen sepet yüksekliği yeterli. Ön +Z.
import * as THREE from 'three';
import {makeFeltMaterial} from './sheepModel.js';
export const BALLOON_COLORS=[
 {name:'Mercan',main:'#e0816b',alt:'#f6ead6',trim:'#b95c4c'},
 {name:'Mavi',main:'#7ba3c4',alt:'#f4ecdc',trim:'#4f7593',gold:'#f1cf7c'},
 {name:'Altın',main:'#d99a3e',alt:'#f7efdc',trim:'#9c6a2c',gold:'#f6dfa0'},
 {name:'Pembe',main:'#e8a6b4',alt:'#fbf1e6',trim:'#bd7487'},
 {name:'Sarı',main:'#f0d873',alt:'#fbf5e4',trim:'#d9806a',gold:'#e8a07e'}];
export const BALLOON_VARIANTS=['serit','duz','kusak'];
function rng(s){s=(s>>>0)||1;return()=>((s=Math.imul(s^s>>>15,1|s)+0x6d2b79f5|0,((s^s>>>14)>>>0)/4294967296));}
export const ENV={gores:14,base:1.15,radius:1.32,height:2.9,mouth:.26};
// Profil: t=0 ağız (alt), t=1 tepe. Armut/damla silueti.
// Profil: alt koni ağızdan omuza, üstte yumuşak kubbe (sivri tepe yok).
function profile(t){const m=ENV.mouth/ENV.radius;if(t<.62){const u=t/.62;return m+(1-m)*Math.sin(u*Math.PI/2)**1.25;}const u=(t-.62)/.38;return Math.sqrt(Math.max(0,1-u*u))*(1-.04*u);}
// Boyalı kağıt süsleri bir kanvas dokusuna çizilir (iki dilimlik karo, G/2 kez tekrar):
// tepe başlığı, fistolu kenarlar, şerit/kuşak ve eşkenar dörtgen motif. Kenarlar keskin, uzaktan okunur.
const texCache={};
function paintTex(col,variant){const key=col.name+variant;if(texCache[key])return texCache[key];const W=256,H=512,cv=document.createElement('canvas');cv.width=W;cv.height=H;const x=cv.getContext('2d');const Y=t=>H*(1-t),gw=W/2;
 x.fillStyle=col.main;x.fillRect(0,0,W,H);
 if(variant==='serit'){x.fillStyle=col.alt;x.fillRect(gw,0,gw,H);}
 const scallops=(t,dir,c,n=2)=>{x.fillStyle=c;for(let g=0;g<2;g++)for(let k=0;k<n;k++){const w=gw/n,cx=g*gw+w*(k+.5);x.beginPath();x.ellipse(cx,Y(t),w/2,w*.42,0,dir>0?Math.PI:0,dir>0?Math.PI*2:Math.PI);x.fill();}};
 const diamond=(cx,t,w,h,c)=>{x.fillStyle=c;x.beginPath();x.moveTo(cx,Y(t+h));x.lineTo(cx+w,Y(t));x.lineTo(cx,Y(t-h));x.lineTo(cx-w,Y(t));x.closePath();x.fill();};
 if(variant==='kusak'){x.fillStyle=col.alt;x.fillRect(0,Y(.62),W,Y(.48)-Y(.62));scallops(.62,1,col.alt);scallops(.48,-1,col.alt);diamond(gw/2,.55,22,.04,col.trim);diamond(gw*1.5,.55,14,.028,col.trim);}
 else if(variant==='serit'){diamond(gw/2,.55,30,.06,col.gold||'#f2d48a');diamond(gw/2,.55,12,.024,col.trim);}
 else{diamond(gw/2,.55,30,.06,col.alt);diamond(gw*1.5,.36,16,.032,col.alt);diamond(gw*1.5,.74,16,.032,col.alt);}
 // tepe başlığı + fisto, alt etek + fisto
 x.fillStyle=col.alt;x.fillRect(0,0,W,Y(.88));scallops(.88,-1,col.alt);x.fillStyle=col.trim;x.fillRect(0,0,W,Y(.905));scallops(.905,-1,col.trim,1);
 x.fillStyle=col.alt;x.fillRect(0,Y(.17),W,H);scallops(.17,1,col.alt);x.fillStyle=col.trim;x.fillRect(0,Y(.13),W,H);scallops(.13,1,col.trim);
 // ince kağıt kenar çizgisi (dikiş) her dilimin kenarında
 x.fillStyle='#00000018';x.fillRect(0,0,2,H);x.fillRect(gw-1,0,2,H);x.fillRect(W-2,0,2,H);
 const t=new THREE.CanvasTexture(cv);t.wrapS=THREE.RepeatWrapping;t.repeat.set(ENV.gores/2,1);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return texCache[key]=t;}
function envelopeGeo(col,variant){const G=ENV.gores,SEG=12,RINGS=84,cols=G*SEG;const pos=[],clr=[],uv=[],idx=[];
 for(let j=0;j<=RINGS;j++){const t=j/RINGS;const r=profile(t)*ENV.radius,y=ENV.base+t*ENV.height;
  for(let i=0;i<=cols;i++){const a=i/cols*Math.PI*2,g=Math.floor(i/SEG)%G,f=(i%SEG)/SEG;
   const bulge=Math.pow(Math.sin(Math.PI*f),.6);const rr=r*(.9+.1*bulge*Math.min(1,r*3));pos.push(Math.cos(a)*rr,y,Math.sin(a)*rr);
   const sh=.8+.2*Math.pow(Math.sin(Math.PI*f),.35);clr.push(sh,sh,sh);uv.push(i/cols,t);}}
 for(let j=0;j<RINGS;j++)for(let i=0;i<cols;i++){const a=j*(cols+1)+i,b=a+cols+1;idx.push(a,b,a+1,b,b+1,a+1);}
 const g=new THREE.BufferGeometry();g.setIndex(idx);g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(clr,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.computeVertexNormals();return g;}
let wicker;function wickerTex(){if(wicker)return wicker;const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');x.fillStyle='#b98d5d';x.fillRect(0,0,128,128);
 // dokuma: dikey çubuklar üzerinden geçen yatay hasır şeritler (üst/alt sırayla)
 for(let r=0;r<10;r++){const y=r*12.8;for(let k=0;k<8;k++){const over=(r+k)%2===0,xx=k*16;x.fillStyle=over?'#cfa774':'#a57a4c';x.beginPath();x.roundRect(xx+1,y+1.5,15,10,4);x.fill();x.fillStyle=over?'#e2c08e55':'#00000022';x.fillRect(xx+3,y+3,11,2);}}
 x.fillStyle='#6f4e3044';for(let k=0;k<8;k++)x.fillRect(k*16,0,1.5,128);
 wicker=new THREE.CanvasTexture(c);wicker.wrapS=wicker.wrapT=THREE.RepeatWrapping;wicker.colorSpace=THREE.SRGBColorSpace;wicker.anisotropy=4;return wicker;}
export const BASKET={w:.52,h:.42};
function basket(R){const g=new THREE.Group();g.name='basket';const W=BASKET.w,H=BASKET.h;
 const body=new THREE.Mesh(new THREE.CylinderGeometry(W*.72,W*.64,H,4,1,true,Math.PI/4),new THREE.MeshLambertMaterial({map:wickerTex()}));body.material.map.repeat.set(2.5,1.6);body.position.y=H/2;body.material.side=THREE.DoubleSide;body.castShadow=body.receiveShadow=true;g.add(body);const floor=new THREE.Mesh(new THREE.PlaneGeometry(W*.88,W*.88),new THREE.MeshLambertMaterial({color:'#5d4430'}));floor.rotation.x=-Math.PI/2;floor.position.y=.04;g.add(floor);
 const leather=new THREE.MeshLambertMaterial({color:'#7a5136'});
 const rim=new THREE.Mesh(new THREE.TorusGeometry(W*.72*Math.SQRT1_2*1.41,.035,6,4),leather);rim.rotation.set(Math.PI/2,0,Math.PI/4);rim.position.y=H;rim.castShadow=true;g.add(rim);
 for(let k=0;k<4;k++){const a=Math.PI/4+k*Math.PI/2;const post=new THREE.Mesh(new THREE.CylinderGeometry(.022,.022,H+.12,6),leather);post.position.set(Math.cos(a)*W*.68,H/2+.05,Math.sin(a)*W*.68);g.add(post);}
 // kum torbaları (bağlı boyunlu) ve bir su şişesi, sepet kenarına asılı
 const sand=new THREE.MeshLambertMaterial({color:'#d9c49a'}),cord=new THREE.MeshLambertMaterial({color:'#6b5641'});
 for(const [a,y] of [[.28,.27],[.62,.22],[1.95,.25]]){const s=new THREE.Mesh(new THREE.SphereGeometry(.042,8,6),sand);s.scale.set(1,1.25,.75);const r=W*.36/Math.max(Math.abs(Math.cos(a)),Math.abs(Math.sin(a)))*1.02;s.position.set(Math.cos(a)*r,y,Math.sin(a)*r);s.castShadow=true;g.add(s);const neck=new THREE.Mesh(new THREE.CylinderGeometry(.012,.02,.03,6),cord);neck.position.copy(s.position).y+=.06;g.add(neck);const hang=new THREE.Mesh(new THREE.CylinderGeometry(.004,.004,H-y-.06,4),cord);hang.position.copy(s.position);hang.position.y=(H+y+.06)/2;g.add(hang);}
 const bottle=new THREE.Mesh(new THREE.CylinderGeometry(.022,.026,.09,8),new THREE.MeshLambertMaterial({color:'#7d9a86'}));bottle.position.set(-W*.38,H-.04,W*.12);g.add(bottle);const cork=new THREE.Mesh(new THREE.CylinderGeometry(.01,.012,.025,6),new THREE.MeshLambertMaterial({color:'#b58a5a'}));cork.position.set(-W*.38,H+.02,W*.12);g.add(cork);
 // deri kaplı kenar: rimin üzerine sarılmış şerit izleri
 const wrap=new THREE.MeshLambertMaterial({color:'#5f3e29'});for(let k=0;k<4;k++)for(const m of [-1.5,0,1.5]){const a=Math.PI/4+k*Math.PI/2,b=a+Math.PI/4,side=W*.72*.707;const ctr=new THREE.Vector3(Math.cos(b)*side,H,Math.sin(b)*side),tan=new THREE.Vector3(-Math.sin(b),0,Math.cos(b));const bd=new THREE.Mesh(new THREE.TorusGeometry(.037,.005,4,8),wrap);bd.position.copy(ctr).addScaledVector(tan,m*.1);bd.lookAt(bd.position.clone().add(tan));g.add(bd);}
 return g;}
function tube(p0,p1,r,m){const t=new THREE.Mesh(new THREE.CylinderGeometry(r,r,p0.distanceTo(p1),5),m);t.position.copy(p0).add(p1).multiplyScalar(.5);t.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),p1.clone().sub(p0).normalize());return t;}
// Askı: her dilim dikişinden ağız halkasına ip, halkadan 4 köşe direğine çift ip.
function rigging(){const g=new THREE.Group();g.name='rigging';const rope=new THREE.MeshLambertMaterial({color:'#5e4b38'});const ringY=ENV.base-.16;
 const ring=new THREE.Mesh(new THREE.TorusGeometry(ENV.mouth*.92,.018,6,28),new THREE.MeshLambertMaterial({color:'#6d5a45'}));ring.rotation.x=Math.PI/2;ring.position.y=ringY;g.add(ring);
 for(let k=0;k<ENV.gores;k++){const a=k/ENV.gores*Math.PI*2;g.add(tube(new THREE.Vector3(Math.cos(a)*ENV.mouth*.92,ringY,Math.sin(a)*ENV.mouth*.92),new THREE.Vector3(Math.cos(a)*ENV.mouth*.9,ENV.base+.02,Math.sin(a)*ENV.mouth*.9),.007,rope));}
 for(let k=0;k<4;k++){const a=Math.PI/4+k*Math.PI/2,p0=new THREE.Vector3(Math.cos(a)*BASKET.w*.68,BASKET.h+.11,Math.sin(a)*BASKET.w*.68);for(const d of [-.28,.28]){const b=a+d;g.add(tube(p0,new THREE.Vector3(Math.cos(b)*ENV.mouth*.92,ringY,Math.sin(b)*ENV.mouth*.92),.008,rope));}}
 // bağlı düğümler: halkada her ip birleşiminde ve direk tepelerinde
 const knot=new THREE.MeshLambertMaterial({color:'#4c3c2c'});for(let k=0;k<ENV.gores;k++){const a=k/ENV.gores*Math.PI*2,n=new THREE.Mesh(new THREE.SphereGeometry(.022,6,4),knot);n.position.set(Math.cos(a)*ENV.mouth*.92,ringY,Math.sin(a)*ENV.mouth*.92);g.add(n);}
 for(let k=0;k<4;k++){const a=Math.PI/4+k*Math.PI/2,n=new THREE.Mesh(new THREE.SphereGeometry(.026,6,4),knot);n.scale.y=1.4;n.position.set(Math.cos(a)*BASKET.w*.68,BASKET.h+.11,Math.sin(a)*BASKET.w*.68);g.add(n);}
 return g;}
// Brülör: halka altında küçük çerçeve, sıcak kağıt alev ve zarf ağzında içeriden ılık ışık.
function burner(){const g=new THREE.Group();g.name='burner';const metal=new THREE.MeshLambertMaterial({color:'#5b554c'});const y=ENV.base-.3;
 const can=new THREE.Mesh(new THREE.CylinderGeometry(.07,.085,.11,10),metal);can.position.y=y;g.add(can);
 const cap=new THREE.Mesh(new THREE.TorusGeometry(.075,.014,5,14),new THREE.MeshLambertMaterial({color:'#9a8b6f'}));cap.rotation.x=Math.PI/2;cap.position.y=y+.055;g.add(cap);
 const flame=new THREE.Mesh(new THREE.ConeGeometry(.05,.2,7,1,true),new THREE.MeshBasicMaterial({color:'#ffb35a',transparent:true,opacity:.85,depthWrite:false,side:THREE.DoubleSide}));flame.position.y=y+.16;flame.name='flame';g.add(flame);
 const core=new THREE.Mesh(new THREE.ConeGeometry(.025,.12,6),new THREE.MeshBasicMaterial({color:'#fff0c2'}));core.position.y=y+.12;core.name='core';g.add(core);
 // içeriden aydınlanan ağız diski (alttan bakınca ılık iç yüzey; gölgede delik bırakmaz)
 const inner=new THREE.Mesh(new THREE.CircleGeometry(ENV.mouth*.99,20),new THREE.MeshBasicMaterial({color:'#f2b77a'}));inner.rotation.x=-Math.PI/2;inner.position.y=ENV.base+.05;inner.name='mouthGlow';inner.castShadow=true;g.add(inner);
 const light=new THREE.PointLight('#ffb067',0,1.6,2);light.position.y=y+.2;light.name='burnerLight';g.add(light);return g;}
// Basit batch: düz renkli Lambert parçaları tek vertex-color geometriye birleştirir (draw call azaltır).
const batchMat=new THREE.MeshLambertMaterial({vertexColors:true});
function batch(rig){rig.updateMatrixWorld(true);const inv=rig.matrixWorld.clone().invert();const parts=[],kill=[];
 rig.traverse(o=>{if(!o.isMesh||o.material.map||o.material.isMeshBasicMaterial||o.material.vertexColors||o.name)return;const g=(o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone());g.applyMatrix4(inv.clone().multiply(o.matrixWorld));parts.push([g,o.material.color]);kill.push(o);});
 let n=0;for(const [g] of parts)n+=g.attributes.position.count;const P=new Float32Array(n*3),N=new Float32Array(n*3),C=new Float32Array(n*3);let off=0;
 for(const [g,c] of parts){const k=g.attributes.position.count;P.set(g.attributes.position.array,off*3);N.set(g.attributes.normal.array,off*3);for(let i=0;i<k;i++)C.set([c.r,c.g,c.b],(off+i)*3);off+=k;g.dispose();}
 for(const o of kill){o.parent.remove(o);o.geometry.dispose();}
 const bg=new THREE.BufferGeometry();bg.setAttribute('position',new THREE.BufferAttribute(P,3));bg.setAttribute('normal',new THREE.BufferAttribute(N,3));bg.setAttribute('color',new THREE.BufferAttribute(C,3));const m=new THREE.Mesh(bg,batchMat);m.name='batched';m.castShadow=true;rig.add(m);return parts.length;}
const mats={};function envMat(col,variant){const k='env'+col.name+variant;if(!mats[k]){mats[k]=makeFeltMaterial('#ffffff');mats[k].map=paintTex(col,variant);}return mats[k];}function mat(key,dark){return mats[key]||(mats[key]=makeFeltMaterial('#ffffff',dark));}
export function createBalloon(opts={}){const seed=opts.seed??1,R=rng(seed*131+7);const ci=typeof opts.color==='number'?opts.color:Math.floor(R()*BALLOON_COLORS.length);const col=BALLOON_COLORS[ci%BALLOON_COLORS.length];const variant=opts.variant||BALLOON_VARIANTS[seed%BALLOON_VARIANTS.length];
 const root=new THREE.Group();root.name='balloon';const rig=new THREE.Group();root.add(rig);
 const env=new THREE.Mesh(envelopeGeo(col,variant),envMat(col,variant));env.castShadow=true;rig.add(env);
 const lip=new THREE.Mesh(new THREE.TorusGeometry(ENV.mouth*1.02,.022,5,ENV.gores*3),new THREE.MeshLambertMaterial({color:col.trim}));lip.rotation.x=Math.PI/2;lip.position.y=ENV.base+.005;rig.add(lip);const vent=new THREE.Mesh(new THREE.CylinderGeometry(.09,.12,.035,ENV.gores),new THREE.MeshLambertMaterial({color:col.trim}));vent.position.y=ENV.base+ENV.height-.005;rig.add(vent);
 rig.add(basket(R));
 rig.add(rigging());rig.add(burner());
 root.userData.batched=batch(rig);root.scale.setScalar(opts.scale??1);Object.assign(root.userData,{kind:'balloon',color:ci,variant,seed,phase:R()*6.28,spin:(R()<.5?-1:1)*(.04+R()*.05),height:ENV.base+ENV.height,width:ENV.radius*2,t:0});return root;}
export function setBalloonGlow(b,amount){b.userData.glow=amount;}
export function updateBalloon(b,dt,action=1){const u=b.userData;const rig=b.children[0];const br=rig.getObjectByName('burner');
 // Süzül: yavaş inip kalkma, çok hafif sarkaç salınımı ve isteğe bağlı yavaş dönüş (oyun fiziği yok).
 // Salınım ekseni zarfın ortası: sepet yana kayar, zarf neredeyse sabit kalır.
 if(action){u.t+=dt;const t=u.t+u.phase;rig.position.y=Math.sin(t*1.1)*.09+Math.sin(t*.37)*.04;
  const sx=Math.sin(t*.8)*.022,sz=Math.sin(t*.63+1.3)*.026;rig.rotation.set(sx,rig.rotation.y+dt*(u.spin??.06),sz);
  const pv=new THREE.Vector3(0,ENV.base+ENV.height*.5,0),moved=pv.clone().applyEuler(rig.rotation);rig.position.x=pv.x-moved.x;rig.position.z=pv.z-moved.z;}
 // brülör nabzı: arada bir kısa alev; Dur'da sabit küçük alev
 const pulse=action?Math.max(0,Math.sin(u.t*.9+u.phase*2))**6:0;const fl=br.getObjectByName('flame');fl.scale.set(1,.7+pulse*1.3,1);fl.material.opacity=.55+pulse*.4;
 br.getObjectByName('burnerLight').intensity=(u.glow??0)*(1.2+pulse*1.6);}
