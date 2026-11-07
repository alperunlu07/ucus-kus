import * as THREE from 'three';
// Local axes: -Z is the bow, +Y up. Waterline is y=0; dimensions match game kinds.
const boxG=new THREE.BoxGeometry(1,1,1);
const C={ink:'#34565e',cream:'#f4e8ca',deck:'#d6ba85',red:'#bc6857',blue:'#6f9b9c',gold:'#d7aa59',dark:'#354e58',white:'#fcf3dc'};
const mats=new Map();let fiberTexture;
function fibers(){if(fiberTexture)return fiberTexture;const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d'),im=g.createImageData(128,128);let seed=733;for(let i=0;i<im.data.length;i+=4){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const v=242+(seed%14);im.data[i]=im.data[i+1]=im.data[i+2]=v;im.data[i+3]=255;}g.putImageData(im,0,0);g.strokeStyle='rgba(126,116,91,.10)';for(let i=0;i<130;i++){const x=(i*43)%128,y=(i*71)%128;g.beginPath();g.moveTo(x,y);g.lineTo(x+3,y+.5);g.stroke();}fiberTexture=new THREE.CanvasTexture(c);fiberTexture.wrapS=fiberTexture.wrapT=THREE.RepeatWrapping;fiberTexture.repeat.set(3,3);fiberTexture.colorSpace=THREE.SRGBColorSpace;return fiberTexture;}

function paper(color){if(!mats.has(color))mats.set(color,new THREE.MeshStandardMaterial({color,map:fibers(),bumpMap:fibers(),bumpScale:.012,roughness:1,metalness:0,flatShading:true}));return mats.get(color);}
function box(g,w,h,d,x,y,z,color){const m=new THREE.Mesh(boxG,paper(color));m.scale.set(w,h,d);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;g.add(m);return m;}
function beam(g,a,b,width,color){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),d=bv.clone().sub(av);const m=new THREE.Mesh(boxG,paper(color));m.scale.set(width,d.length(),width);m.position.copy(av.add(bv).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());m.castShadow=true;g.add(m);return m;}
function rail(g,points,y,h,color){for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length];beam(g,[a[0],y+h,a[1]],[b[0],y+h,b[1]],.028,color);beam(g,[a[0],y+h*.48,a[1]],[b[0],y+h*.48,b[1]],.018,color);const n=Math.ceil(Math.hypot(a[0]-b[0],a[1]-b[1])/.64);for(let j=0;j<n;j++){const f=j/n,x=a[0]+(b[0]-a[0])*f,z=a[1]+(b[1]-a[1])*f;beam(g,[x,y,z],[x,y+h,z],.026,color);}}}
function contour(L,W){return [[0,-L*.51],[W*.39,-L*.38],[W*.5,-L*.23],[W*.5,L*.33],[W*.38,L*.47],[-W*.38,L*.47],[-W*.5,L*.33],[-W*.5,-L*.23],[-W*.39,-L*.38]];}
function hullGeometry(L,W,rings=[[.72,-.25],[.87,-.08],[1,.42]]){const rim=contour(L,W),v=[],idx=[],n=rim.length;for(const [s,y] of rings)for(const [x,z] of rim)v.push(x*s,y,z*s);for(let r=0;r<rings.length-1;r++)for(let i=0;i<n;i++){const j=(i+1)%n,a=r*n,b=(r+1)*n;idx.push(a+i,b+j,a+j,a+i,b+i,b+j);}const top=(rings.length-1)*n;for(let i=1;i<n-1;i++)idx.push(top,top+i+1,top+i,0,i,i+1);const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(v,3));geo.setIndex(idx);geo.setAttribute('uv',new THREE.Float32BufferAttribute(v.flatMap((_,i)=>i%3===0?[v[i]/W+.5,v[i+2]/L+.5]:[]),2));geo.computeVertexNormals();return geo;}

function deckShape(g,L,W,y,color){const sh=new THREE.Shape();contour(L,W).forEach(([x,z],i)=>i?sh.lineTo(x,z):sh.moveTo(x,z));sh.closePath();const geo=new THREE.ExtrudeGeometry(sh,{depth:.065,bevelEnabled:false});geo.rotateX(Math.PI/2);const m=new THREE.Mesh(geo,paper(color));m.position.y=y;m.castShadow=m.receiveShadow=true;g.add(m);return m;}
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
 if(kind!==0){const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,.36,-.045,0,0,-.17,0],3));geo.computeVertexNormals();const flag=new THREE.Mesh(geo,paper(C.red).clone());flag.material.side=THREE.DoubleSide;flag.position.set(.025,mastY+mastH-.04,mastZ);body.add(flag);root.userData.flag=flag;}else beam(body,[-.26,1.68,mastZ],[.26,1.68,mastZ],.055,C.blue);
 for(const side of [-1,1]){const ring=new THREE.Mesh(new THREE.TorusGeometry(.105,.029,4,16),paper(C.red));ring.rotation.y=Math.PI/2;ring.position.set(side*(kind===2?.824:W*.378),kind===2?1.27:.71,kind===2?.78:L*.30+.14);ring.castShadow=true;body.add(ring);for(let i=0;i<4;i++){const band=new THREE.Mesh(new THREE.TorusGeometry(.105,.032,4,2,Math.PI/6),paper(C.white));band.rotation.z=i*Math.PI/2;ring.add(band);}}
 // Wake is a separate, horizontal paper cutout: it must never rock with the hull.
 const wake=new THREE.Group();wake.name='V-shaped paper wake';root.add(wake);root.userData.wake=wake;
 for(const side of [-1,1])for(let i=0;i<3;i++){const z=L*.40+i*.20,a=[side*(W*.27+i*.06),z],b=[side*(1.40+i*.10),z+1.75-i*.12],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz),nx=-dz/len,nz=dx/len,wa=.065-i*.012,wb=.018;const v=[a[0]-nx*wa,-.143,a[1]-nz*wa,a[0]+nx*wa,-.143,a[1]+nz*wa,b[0]+nx*wb,-.143,b[1]+nz*wb,b[0]-nx*wb,-.143,b[1]-nz*wb];const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(v,3));geo.setIndex([0,1,2,0,2,3]);geo.computeVertexNormals();const mat=paper(i===1?'#bdd4ce':'#f4efd8').clone();mat.side=THREE.DoubleSide;const m=new THREE.Mesh(geo,mat);m.renderOrder=2;wake.add(m);}
 wake.visible=false;
 // A scored triangular foredeck closes the bow; its ridge catches the light like folded card.
 const foldGeo=new THREE.BufferGeometry();foldGeo.setAttribute('position',new THREE.Float32BufferAttribute([0,.476,-L*.475,-W*.24,.463,-L*.355,0,.524,-L*.375,W*.24,.463,-L*.355],3));foldGeo.setIndex([0,2,1,0,3,2,1,2,3]);foldGeo.computeVertexNormals();const foldMat=paper(C.cream).clone();foldMat.side=THREE.DoubleSide;const fold=new THREE.Mesh(foldGeo,foldMat);fold.castShadow=fold.receiveShadow=true;body.add(fold);beam(body,[0,.482,-L*.468],[0,.529,-L*.377],.012,'#b7a27d');
 // A little stern foam joins the diverging wake to the actual waterline.
 const sternGeo=new THREE.BufferGeometry();sternGeo.setAttribute('position',new THREE.Float32BufferAttribute([-.25,-.142,L*.405,.25,-.142,L*.405,.13,-.142,L*.57,-.13,-.142,L*.57],3));sternGeo.setIndex([0,1,2,0,2,3]);sternGeo.computeVertexNormals();const sternMat=paper('#d4e2d6').clone();sternMat.side=THREE.DoubleSide;wake.add(new THREE.Mesh(sternGeo,sternMat));

 return root;
}
/** Update idle / rock / sail. Also accepts {state,dt,time} for deterministic capture. */
export function updateShip(ship,state='idle',dt=1/60){
 const u=ship.userData;let fixedTime;
 if(typeof state==='object'){dt=state.dt??dt;fixedTime=state.time;state=state.state??'idle';}
 u.time=fixedTime??u.time+Math.min(.1,Math.max(0,dt));const t=u.time,active=state!=='idle';
 u.body.rotation.z=active?Math.sin(t*1.35+u.kind*.9)*.027:0;
 u.body.rotation.x=active?Math.sin(t*.93+u.kind*.6)*.014:0;
 u.body.position.y=active?Math.sin(t*1.1+u.kind)*.018:0;
 u.wake.visible=state==='sail';u.wake.scale.x=1+(active?Math.sin(t*1.7)*.025:0);
 if(u.flag)u.flag.rotation.y=active?Math.sin(t*2.2+u.kind)*.11:0;
}
