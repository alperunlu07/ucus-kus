import * as THREE from 'three';
// Local axes: -Z is the bow, +Y up. Waterline is y=0; dimensions match game kinds.
const boxG=new THREE.BoxGeometry(1,1,1);
const C={ink:'#34565e',cream:'#f4e8ca',deck:'#d6ba85',red:'#bc6857',blue:'#6f9b9c',gold:'#d7aa59',dark:'#354e58',white:'#fcf3dc'};
const mats=new Map();let fiberTexture;
function fibers(){if(fiberTexture)return fiberTexture;const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d'),im=g.createImageData(128,128);let seed=733;for(let i=0;i<im.data.length;i+=4){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const v=242+(seed%14);im.data[i]=im.data[i+1]=im.data[i+2]=v;im.data[i+3]=255;}g.putImageData(im,0,0);g.strokeStyle='rgba(126,116,91,.16)';for(let i=0;i<130;i++){const x=(i*43)%128,y=(i*71)%128;g.beginPath();g.moveTo(x,y);g.lineTo(x+3,y+.5);g.stroke();}fiberTexture=new THREE.CanvasTexture(c);fiberTexture.wrapS=fiberTexture.wrapT=THREE.RepeatWrapping;fiberTexture.repeat.set(3,3);fiberTexture.colorSpace=THREE.SRGBColorSpace;return fiberTexture;}

function paper(color){if(!mats.has(color))mats.set(color,new THREE.MeshStandardMaterial({color,map:fibers(),bumpMap:fibers(),bumpScale:.007,roughness:1,metalness:0,flatShading:true}));return mats.get(color);}
function box(g,w,h,d,x,y,z,color){const m=new THREE.Mesh(boxG,paper(color));m.scale.set(w,h,d);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;g.add(m);return m;}
function beam(g,a,b,width,color){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),d=bv.clone().sub(av);const m=new THREE.Mesh(boxG,paper(color));m.scale.set(width,d.length(),width);m.position.copy(av.add(bv).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());m.castShadow=true;g.add(m);return m;}
function rail(g,points,y,h,color){for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length];beam(g,[a[0],y+h,a[1]],[b[0],y+h,b[1]],.028,color);beam(g,[a[0],y+h*.48,a[1]],[b[0],y+h*.48,b[1]],.018,color);const n=Math.ceil(Math.hypot(a[0]-b[0],a[1]-b[1])/.64);for(let j=0;j<n;j++){const f=j/n,x=a[0]+(b[0]-a[0])*f,z=a[1]+(b[1]-a[1])*f;beam(g,[x,y,z],[x,y+h,z],.026,color);}}}
function contour(L,W){return [[0,-L*.51],[W*.39,-L*.38],[W*.5,-L*.23],[W*.5,L*.33],[W*.38,L*.47],[-W*.38,L*.47],[-W*.5,L*.33],[-W*.5,-L*.23],[-W*.39,-L*.38]];}
function hullGeometry(L,W,rings=[[.72,-.25],[.87,-.08],[1,.42]]){const rim=contour(L,W),v=[],idx=[],n=rim.length;for(const [s,y] of rings)for(const [x,z] of rim)v.push(x*s,y,z*s);for(let r=0;r<rings.length-1;r++)for(let i=0;i<n;i++){const j=(i+1)%n,a=r*n,b=(r+1)*n;idx.push(a+i,b+j,a+j,a+i,b+i,b+j);}const top=(rings.length-1)*n;for(let i=1;i<n-1;i++)idx.push(top,top+i+1,top+i,0,i,i+1);const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(v,3));geo.setIndex(idx);geo.setAttribute('uv',new THREE.Float32BufferAttribute(v.flatMap((_,i)=>i%3===0?[v[i]/W+.5,v[i+2]/L+.5]:[]),2));geo.computeVertexNormals();return geo;}

function deckShape(g,L,W,y,color){const sh=new THREE.Shape();contour(L,W).forEach(([x,z],i)=>i?sh.lineTo(x,z):sh.moveTo(x,z));sh.closePath();const geo=new THREE.ExtrudeGeometry(sh,{depth:.065,bevelEnabled:false});geo.rotateX(Math.PI/2);const m=new THREE.Mesh(geo,paper(color));m.position.y=y;m.castShadow=m.receiveShadow=true;g.add(m);return m;}
// Static paper boxes/rails share geometry and material. Bake only those meshes;
// the hull, flags, wakes and animated exhaust remain independently addressable.
function batchPaperBoxes(body){
 const groups=new Map();
 for(const m of body.children)if(m.isMesh&&m.geometry===boxG&&!m.children.length){
  const key=m.material.uuid+'/'+Number(m.castShadow)+Number(m.receiveShadow);
  if(!groups.has(key))groups.set(key,[]);groups.get(key).push(m);
 }
 for(const meshes of groups.values()){
  if(meshes.length<2)continue;
  const positions=[],normals=[],uvs=[],indices=[];
  for(const m of meshes){
   m.updateMatrix();const g=boxG.clone().applyMatrix4(m.matrix),off=positions.length/3;
   positions.push(...g.attributes.position.array);normals.push(...g.attributes.normal.array);uvs.push(...g.attributes.uv.array);
   for(const n of g.index.array)indices.push(off+n);g.dispose();
  }
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geo.setIndex(indices);
  const batch=new THREE.Mesh(geo,meshes[0].material);batch.castShadow=meshes[0].castShadow;batch.receiveShadow=meshes[0].receiveShadow;batch.name='Batched static paper fittings';
  for(const m of meshes)body.remove(m);body.add(batch);
 }
}
function printPaper(text,w,h,color){
 const c=document.createElement('canvas');c.width=512;c.height=128;
 const g=c.getContext('2d');g.fillStyle=color;g.textAlign='center';g.textBaseline='middle';g.font='600 74px system-ui';g.fillText(text,256,66,490);
 const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;
 const mat=new THREE.MeshStandardMaterial({map:tex,transparent:true,roughness:1,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1});
 return new THREE.Mesh(new THREE.PlaneGeometry(w,h),mat);
}
function waterRibbon(g,points,width,color){
 const v=[],idx=[];
 for(let i=0;i<points.length;i++){
  const a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz)||1;
  const w=width*(.22+.78*Math.sin(Math.PI*i/(points.length-1)));
  for(const side of [-1,1])v.push(points[i][0]-dz/len*w*side,-.137,points[i][1]+dx/len*w*side);
  if(i){const j=i*2;idx.push(j-2,j-1,j,j-1,j+1,j);}
 }
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(v,3));geo.setIndex(idx);geo.computeVertexNormals();
 const mat=paper(color).clone();mat.side=THREE.DoubleSide;const mesh=new THREE.Mesh(geo,mat);mesh.renderOrder=2;g.add(mesh);return mesh;
}
/** Build one matte-paper ship. {kind:0|1|2}; bow is -Z, local waterline y=0.
 * Returns a movable Group; userData.body rocks independently of userData.wake.
 * Natural lengths are 6 / 4 / 5. Caller controls world position, heading and scale.
 */
export function createShip(options={}){
 if(typeof options==='number')options={kind:options};
 const kind=Math.max(0,Math.min(2,options.kind??0));const L=[6,4,5][kind],W=[1.75,1.48,1.85][kind];
 const root=new THREE.Group(),body=new THREE.Group();root.add(body);root.name=['Kağıt yük gemisi','Kağıt nehir teknesi','Kağıt kıyı vapuru'][kind];
 const hull=new THREE.Mesh(hullGeometry(L,W),paper(kind===2?C.cream:C.ink));hull.castShadow=hull.receiveShadow=true;body.add(hull);deckShape(body,L*.96,W*.94,.445,C.deck);
 if(kind!==2){box(body,W*.74,.72,.85,0,.82,L*.30,C.cream);box(body,W*.84,.09,1,0,1.22,L*.30,C.blue);}
 if(kind===0){for(let i=0;i<3;i++){box(body,1.19,.56,.91,0,.75,-1.6+i*1.02,[C.red,C.blue,C.gold][i]);if(i<2)box(body,1.19,.52,.91,0,1.29,-1.6+i*1.02,[C.gold,C.red][i]);}}
 if(kind===1){box(body,1.12,.1,1.65,0,.49,-.65,C.dark);for(let i=0;i<3;i++)box(body,.91,.31,.45,0,.69,-1.15+i*.53,[C.gold,C.red,C.blue][i]);}
 if(kind===2){box(body,1.42,.54,2.9,0,.75,-.15,C.cream);box(body,1.67,.1,3.12,0,1.06,-.15,C.white);box(body,1.16,.47,1.96,0,1.34,-.23,C.cream);box(body,1.34,.08,2.13,0,1.61,-.23,C.blue);}

 root.userData={kind,L,W,body,time:0,baseY:0};
 // The angled chine is deliberately visible above the water; not a rectangular barge.
 const boot=new THREE.Mesh(hullGeometry(L*1.002,W*1.005,[[.72,-.252],[.875,-.065]]),paper(C.red));boot.castShadow=true;body.add(boot);
 const belt=new THREE.Mesh(hullGeometry(L*1.003,W*1.008,[[.978,.32],[1.003,.425]]),paper(kind===2?C.blue:C.cream));body.add(belt);
 // Bridge glazing is cut paper, not reflective glass.
 if(kind!==2){for(let i=-1;i<=1;i++)box(body,W*.18,.21,.016,i*W*.23,.98,L*.30-.434,C.dark);for(const side of [-1,1]){box(body,.018,.22,.44,side*W*.375,.98,L*.30-.09,C.dark);box(body,.02,.35,.20,side*W*.375,.65,L*.30+.23,C.blue);}if(kind===1){box(body,.13,.53,.16,-.43,1.23,L*.30+.23,C.red);box(body,.17,.07,.20,-.43,1.51,L*.30+.23,C.dark);}}
 else{for(const side of [-1,1]){for(let i=0;i<6;i++)box(body,.018,.22,.25,side*.716,.82,-1.34+i*.46,C.dark);for(let i=0;i<4;i++)box(body,.018,.23,.28,side*.585,1.36,-.98+i*.50,C.dark);}for(let i=-1;i<=1;i++)box(body,.27,.23,.018,i*.35,1.36,-1.22,C.dark);const funnel=box(body,.39,.66,.51,0,1.93,.43,C.red);funnel.rotation.x=-.1;box(body,.44,.09,.56,0,2.25,.39,C.dark);box(body,.40,.11,.52,0,1.79,.44,C.cream);}
 rail(body,contour(L*.944,W*.927),.455,.29,C.white);
 if(kind===2)rail(body,[[-.80,-1.65],[.80,-1.65],[.80,1.35],[-.80,1.35]],1.115,.27,C.white);
 if(kind===0){for(let i=0;i<3;i++)for(let level=0;level<(i<2?2:1);level++){const y=level?1.29:.75,color=level?[C.gold,C.red][i]:[C.red,C.blue,C.gold][i];const shade='#'+new THREE.Color(color).multiplyScalar(.91).getHexString();for(const side of [-1,1])for(let j=0;j<7;j++)box(body,.018,level?.43:.47,.025,side*.604,y,-1.99+i*1.02+j*.128,shade);for(let j=0;j<6;j++)box(body,.026,.014,.87,-.49+j*.196,y+(level?.268:.288),-1.6+i*1.02,shade);}}
 if(kind===1)for(let i=0;i<3;i++)for(const x of [-.29,.29])box(body,.027,.012,.45,x,.851,-1.15+i*.53,C.cream);
 beam(body,[0,.457,-L*.47],[0,.457,-L*.32],.012,'#b6996e');
 // Small navigational fittings stay broad enough for the flight camera.
 for(const z of [-L*.39,L*.39])for(const side of [-1,1]){const x=side*W*.28;box(body,.065,.11,.065,x,.515,z,C.dark);box(body,.17,.035,.06,x,.58,z,C.dark);}
 const mastZ=kind===2?-.78:L*.30,mastY=kind===2?1.66:1.27,mastH=kind===1?.68:.48;beam(body,[0,mastY,mastZ],[0,mastY+mastH,mastZ],.045,C.cream);
 if(kind!==0){const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,.19,-.012,.055,.39,-.045,0,.28,-.095,.02,.39,-.17,-.01,.18,-.14,.05,0,-.17,0],3));geo.setIndex([0,1,6,1,5,6,1,2,3,1,3,5,3,4,5]);geo.computeVertexNormals();const flag=new THREE.Mesh(geo,paper(C.red).clone());flag.material.side=THREE.DoubleSide;flag.position.set(.025,mastY+mastH-.04,mastZ);body.add(flag);root.userData.flag=flag;}else beam(body,[-.26,1.68,mastZ],[.26,1.68,mastZ],.055,C.blue);
 for(const side of [-1,1]){const ring=new THREE.Mesh(new THREE.TorusGeometry(.105,.029,4,16),paper(C.red));ring.rotation.y=Math.PI/2;ring.position.set(side*(kind===2?.824:W*.378),kind===2?1.27:.71,kind===2?.78:L*.30+.14);ring.castShadow=true;body.add(ring);for(let i=0;i<4;i++){const band=new THREE.Mesh(new THREE.TorusGeometry(.105,.032,4,2,Math.PI/6),paper(C.white));band.rotation.z=i*Math.PI/2;ring.add(band);}}
 // Wake is a separate, horizontal paper cutout: it must never rock with the hull.
 const wake=new THREE.Group();wake.name='V-shaped paper wake';root.add(wake);root.userData.wake=wake;
 // 17 — curved, tapered torn-paper wake ribbons rather than straight bars.
 for(const side of [-1,1]){
  for(let layer=0;layer<3;layer++){
   const points=[];for(let j=0;j<=12;j++){const f=j/12;points.push([side*(W*.30+layer*.045+f*.82+Math.sin(f*Math.PI)*.09),L*.37+layer*.18+f*(1.78-layer*.13)]);}
   waterRibbon(wake,points,.047-layer*.011,layer===1?'#c3d9d0':'#f4efd8');
  }
  const bow=[];for(let j=0;j<=12;j++){const f=j/12;bow.push([side*(.015+W*.43*Math.sin(f*Math.PI*.5)),-L*.44+f*L*.20]);}
  waterRibbon(wake,bow,.028,'#f4efd8');
  for(let j=0;j<4;j++)waterRibbon(wake,[[side*(.15+j*.035),L*.49+j*.22],[side*(.24+j*.06),L*.52+j*.22],[side*(.19+j*.05),L*.55+j*.22]],.025,'#dce5d7');
 }
 wake.visible=false;
 // A scored triangular foredeck closes the bow; its ridge catches the light like folded card.
 const foldGeo=new THREE.BufferGeometry();foldGeo.setAttribute('position',new THREE.Float32BufferAttribute([0,.476,-L*.475,-W*.24,.463,-L*.355,0,.524,-L*.375,W*.24,.463,-L*.355],3));foldGeo.setIndex([0,2,1,0,3,2,1,2,3]);foldGeo.computeVertexNormals();const foldMat=paper(C.cream).clone();foldMat.side=THREE.DoubleSide;const fold=new THREE.Mesh(foldGeo,foldMat);fold.castShadow=fold.receiveShadow=true;body.add(fold);beam(body,[0,.482,-L*.468],[0,.529,-L*.377],.012,'#b7a27d');
 // A little stern foam joins the diverging wake to the actual waterline.
 const sternGeo=new THREE.BufferGeometry();sternGeo.setAttribute('position',new THREE.Float32BufferAttribute([-.25,-.142,L*.405,.25,-.142,L*.405,.13,-.142,L*.57,-.13,-.142,L*.57],3));sternGeo.setIndex([0,1,2,0,2,3]);sternGeo.computeVertexNormals();const sternMat=paper('#d4e2d6').clone();sternMat.side=THREE.DoubleSide;wake.add(new THREE.Mesh(sternGeo,sternMat));

 // 19 — small printed vessel names and roof registration marks; no glossy decals.
 for(const side of [-1,1]){
  const x=side*W*.492,z=L*.05,col=kind===2?C.blue:C.cream;
  box(body,.018,.145,.91,x,.188,z,col);
  const mark=printPaper(['MARTI · 01','SAZLIK · 02','KIYI · 03'][kind],.82,.105,kind===2?C.white:C.dark);
  mark.rotation.y=side*Math.PI/2;mark.position.set(x+side*.012,.19,z);body.add(mark);
 }
 const roofMark=printPaper('0'+(kind+1),.28,.14,C.cream);
 roofMark.rotation.x=-Math.PI/2;roofMark.position.set(-.27,kind===2?1.658:1.268,(kind===2?-.23:L*.30)-.24);body.add(roofMark);
 // 18 — three low-poly paper exhaust wisps, animated independently of the fittings.
 if(kind!==0){
  const smoke=new THREE.Group();smoke.name='Warm paper exhaust';body.add(smoke);root.userData.smoke=smoke;
  const smokeGeo=new THREE.DodecahedronGeometry(1,0);
  for(let i=0;i<3;i++){
   const puff=new THREE.Mesh(smokeGeo,paper(['#c4c4b6','#d4d1c0','#dfd9c8'][i]));
   puff.scale.set(.07+i*.033,.055+i*.025,.065+i*.025);puff.rotation.set(i*.6,.3,i*.8);smoke.add(puff);
  }
  smoke.position.set(kind===1?-.43:0,kind===1?1.62:2.37,kind===1?L*.30+.23:.40);smoke.visible=false;
 }
 // 16 — ferry rescue craft, davits, passenger benches and a folded raft pack.
 if(kind===2){
  for(const side of [-1,1]){
   const boat=new THREE.Mesh(hullGeometry(.78,.28,[[.56,-.05],[1,.12]]),paper(C.red));
   boat.position.set(side*.48,1.72,.39);boat.castShadow=true;body.add(boat);
   const cover=new THREE.Group();cover.position.copy(boat.position);deckShape(cover,.69,.23,.13,C.cream);body.add(cover);
   for(const z of [.15,.64]){
    beam(body,[side*.64,1.66,z],[side*.64,1.94,z],.025,C.cream);
    beam(body,[side*.64,1.94,z],[side*.44,1.94,z],.025,C.cream);
    beam(body,[side*.44,1.94,z],[side*.44,1.86,z],.012,C.dark);
   }
   box(body,.31,.06,.43,side*.43,1.22,1.04,C.deck);
   box(body,.035,.19,.43,side*.57,1.29,1.04,C.cream);
   for(const z of [.90,1.18])box(body,.22,.09,.025,side*.43,1.16,z,C.dark);
  }
  box(body,.31,.12,.37,-.30,1.76,-.69,C.white);
  for(const z of [-.79,-.59])box(body,.325,.018,.033,-.30,1.825,z,C.blue);
 }
 // 15 — a river trader's timber fenders and a folded canvas-paper work canopy.
 if(kind===1){
  for(const side of [-1,1]){
   box(body,.07,.09,2.05,side*.755,.18,-.17,'#b99563');
   for(const z of [-.89,-.10,.58]){
    box(body,.10,.24,.12,side*.78,.23,z,C.dark);
    beam(body,[side*.69,.70,z],[side*.79,.30,z],.018,C.cream);
   }
  }
  for(const x of [-.56,.56])for(const z of [.24,.73])beam(body,[x,.46,z],[x,1.04,z],.028,C.cream);
  const v=[-.64,1.04,.18,0,1.15,.18,.64,1.04,.18,-.64,1.04,.79,0,1.15,.79,.64,1.04,.79];
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(v,3));geo.setIndex([0,3,1,1,3,4,1,4,2,2,4,5]);geo.computeVertexNormals();
  const mat=paper(C.cream).clone();mat.side=THREE.DoubleSide;const awning=new THREE.Mesh(geo,mat);awning.castShadow=true;body.add(awning);
  for(const x of [-.4,0,.4]){const stripe=box(body,.09,.012,.61,x,1.157-Math.abs(x)*.172,.485,C.red);stripe.rotation.z=x<0?.17:x>0?-.17:0;}
  box(body,1.30,.065,.027,0,1.025,.18,C.cream);
 }
 // 14 — shaded glazing brows, roof skylight and port/starboard paper lamps.
 const roofY=kind===2?1.66:1.27,roofZ=kind===2?-.23:L*.30;
 const cabinW=kind===2?1.16:W*.74,frontZ=kind===2?-1.22:L*.30-.434;
 for(const x of [-1,0,1]){
  box(body,cabinW*.23,.025,.045,x*cabinW*.30,kind===2?1.50:1.115,frontZ-.014,C.cream);
  box(body,cabinW*.17,.018,.019,x*cabinW*.30,kind===2?1.427:1.045,frontZ-.016,'#789b9f');
 }
 box(body,.31,.10,.25,.23,roofY+.055,roofZ+.15,C.cream);
 box(body,.25,.018,.19,.23,roofY+.113,roofZ+.15,C.dark);
 for(const x of [-.32,-.20,-.08])box(body,.065,.045,.19,x,roofY+.027,roofZ+.22,C.gold);
 for(const side of [-1,1]){
  const x=side*(kind===2?.63:W*.40),z=kind===2?-1.15:L*.30-.39;
  box(body,.11,.045,.13,x,roofY+.025,z,C.dark);
  box(body,.065,.075,.075,x,roofY+.08,z,side<0?C.red:'#769e7d');
 }
 // 13 — printed plank scores, bow windlass and coiled mooring lines.
 for(const side of [-1,1]){
  for(let j=0;j<11;j++){
   const z=-L*.24+j*L*.055;
   box(body,W*.068,.006,.010,side*W*.418,.451,z,'#b69d73');
  }
  const coil=new THREE.Mesh(new THREE.TorusGeometry(.10,.018,4,18),paper('#b69b70'));
  coil.rotation.x=-Math.PI/2;coil.position.set(side*W*.22,.468,L*.414);body.add(coil);
  const inner=new THREE.Mesh(new THREE.TorusGeometry(.059,.015,4,16),paper(C.cream));coil.add(inner);
 }
 const winchZ=-L*.382;
 box(body,.30,.07,.20,0,.495,winchZ,C.blue);
 box(body,.34,.09,.09,0,.575,winchZ,C.dark);
 for(const x of [-.14,.14])box(body,.035,.14,.15,x,.575,winchZ,C.cream);
 beam(body,[0,.46,winchZ-.11],[0,.47,-L*.45],.025,C.dark);
 box(body,.35,.025,.23,0,.46,L*.421,C.blue);
 box(body,.25,.014,.15,0,.48,L*.421,C.deck);
 // 12 — inset cargo end doors, paired locking bars and folded corner tabs.
 if(kind===0)for(let i=0;i<3;i++)for(let level=0;level<(i<2?2:1);level++){
  const y=level?1.29:.75,z=-1.6+i*1.02,h=level?.52:.56;
  for(const end of [-1,1]){
   const face=z+end*.461;
   box(body,.018,h*.82,.014,0,y,face,C.dark);
   for(const x of [-.30,.30]){
    box(body,.022,h*.78,.024,x,y,face,C.cream);
    box(body,.12,.026,.03,x+.035,y-.07,face,C.dark);
   }
   for(const x of [-.54,.54])for(const dy of [-1,1])box(body,.072,.055,.035,x,y+dy*(h*.5-.035),face,C.cream);
  }
 }
 // 11 — laminated hull edges, cut-paper hawse plates and anchor silhouettes.
 for(const side of [-1,1]){
  beam(body,[side*W*.505,.24,-L*.20],[side*W*.505,.24,L*.30],.045,C.dark);
  for(const z of [-L*.24,L*.27])box(body,.028,.055,.20,side*W*.505,.355,z,C.dark);
  const x=side*W*.34,z=-L*.389;
  box(body,.07,.15,.20,x,.245,z,C.dark);
  beam(body,[x,.30,z],[x,.06,z],.038,C.cream);
  beam(body,[x,.065,z],[x,.12,z-.10],.035,C.cream);
  beam(body,[x,.065,z],[x,.12,z+.10],.035,C.cream);
 }
 // 20 — preserve every visible paper detail while consolidating static fittings.
 batchPaperBoxes(body);
 return root;
}
/** Update idle / rock / sail. Also accepts {state,dt,time} for deterministic capture. */
export function updateShip(ship,state='idle',dt=1/60){
 const u=ship.userData;let fixedTime;
 if(typeof state==='object'){dt=state.dt??dt;fixedTime=state.time;state=state.state??'idle';}
 u.time=fixedTime??u.time+Math.min(.1,Math.max(0,dt));const t=u.time,active=state!=='idle';
 u.body.rotation.z=active?Math.sin(t*[1.04,1.62,1.19][u.kind]+u.kind*.9)*[.019,.034,.023][u.kind]:0;
 u.body.rotation.x=active?Math.sin(t*.93+u.kind*.6)*[.011,.020,.013][u.kind]:0;
 u.body.position.y=active?Math.sin(t*1.1+u.kind)*[.014,.024,.018][u.kind]:0;
 u.wake.visible=state==='sail';u.wake.scale.x=1+(active?Math.sin(t*1.7)*.025:0);
 if(u.smoke){u.smoke.visible=state==='sail';u.smoke.children.forEach((p,i)=>{p.position.set(Math.sin(t*.8+i)*.035,i*.16+Math.sin(t+i)*.018,i*.16);p.rotation.y=t*.12+i;});}
 if(u.flag)u.flag.rotation.y=active?Math.sin(t*2.2+u.kind)*.11:0;
}
