import * as THREE from 'three';
/** Paper birds face local -Z, Y up. Root transform belongs to the caller.
 * createBird({species:0..3|'paper'|'swallow'|'gull'|'owl',small:false,scale:1})
 * updateBird(root, 'idle'|'perch'|'flap'|'glide'|'bank', dtSeconds, speed=1)
 */
export const BIRD_SPECIES=[
 {id:'paper',name:'Kağıt Kuş',body:'#f3ead3',wing:'#f7efd9',edge:'#cdbb9c',beak:'#d99854',span:2.75,chord:.88,rate:3.2},
 {id:'swallow',name:'Kırlangıç',body:'#465d70',wing:'#506d80',edge:'#a3b4b8',beak:'#b97750',span:3.25,chord:.6,rate:4.7},
 {id:'gull',name:'Martı',body:'#f4f1e4',wing:'#dce2df',edge:'#a7b4b5',beak:'#dbb254',span:3.5,chord:.73,rate:2.5},
 {id:'owl',name:'Baykuş',body:'#b69268',wing:'#a88660',edge:'#ddc39a',beak:'#c99c52',span:2.6,chord:1.15,rate:2.8}
];
const materials=new Map();
let grain;
function paperGrain(){if(grain)return grain;const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');g.fillStyle='#eeeae0';g.fillRect(0,0,256,256);let seed=71;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};for(let i=0;i<12500;i++){const n=Math.floor(215+rand()*40);g.fillStyle=`rgba(${n},${n},${n},.22)`;g.fillRect(rand()*256,rand()*256,1+rand()*2,1);}for(let i=0;i<280;i++){g.strokeStyle=i%2?'#fff8':'#bdb39b40';const x=rand()*256,y=rand()*256;g.beginPath();g.moveTo(x,y);g.lineTo(x+2+rand()*8,y+rand()*2);g.stroke();}grain=new THREE.CanvasTexture(c);grain.wrapS=grain.wrapT=THREE.RepeatWrapping;grain.colorSpace=THREE.SRGBColorSpace;return grain;}

function paper(color){if(!materials.has(color))materials.set(color,new THREE.MeshStandardMaterial({color,map:paperGrain(),bumpMap:paperGrain(),bumpScale:.012,roughness:1,metalness:0,flatShading:true,side:THREE.DoubleSide}));return materials.get(color);}
function mesh(geo,mat,parent,pos=[0,0,0]){const m=new THREE.Mesh(geo,typeof mat==='string'?paper(mat):mat);m.position.set(...pos);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
// A closed, thin, ridged sheet: no infinitely thin triangles at grazing angles.
function sheet(points,ridge,color,parent){const verts=[],uv=[];const center=points.reduce((a,p)=>a.map((v,i)=>v+p[i]/points.length),[0,0,0]);center[1]+=ridge;
 const push=p=>{verts.push(...p);uv.push(p[0]*.45,p[2]*.6);};
 for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length],ab=[a[0],a[1]-.026,a[2]],bb=[b[0],b[1]-.026,b[2]];[center,a,b,a,ab,bb,a,bb,b].forEach(push);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.computeVertexNormals();return mesh(g,color,parent);}
function body(parent,color,owl){const rings=owl?[[-1.12,.19,.20],[-.85,.43,.43],[-.2,.48,.43],[.5,.34,.3],[.88,.10,.10]]:[[-1.25,.12,.10],[-.93,.29,.28],[-.35,.36,.34],[.3,.29,.26],[.83,.08,.08]];const a=[];for(let r=0;r<rings.length-1;r++)for(let j=0;j<8;j++){const ring=(k,n)=>{const [z,w,h]=rings[k],t=n/8*Math.PI*2;return [Math.sin(t)*w,Math.cos(t)*h,z];};a.push(...ring(r,j),...ring(r+1,j),...ring(r+1,j+1),...ring(r,j),...ring(r+1,j+1),...ring(r,j+1));}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(a,3));const uv=[];for(let i=0;i<a.length;i+=3)uv.push(a[i]*1.7,a[i+2]*1.7);g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.computeVertexNormals();return mesh(g,color,parent);}
// Clip the folded stock at a real wrist; both halves retain their paper thickness.
function wrist(wing,cut=1.25){const outer=new THREE.Group();outer.position.x=cut;const original=[...wing.children];
 for(const m of original){const p=m.geometry.attributes.position,uv=m.geometry.attributes.uv;const halves=[[],[]],uvs=[[],[]];
 for(let i=0;i<p.count;i+=3){const tri=[0,1,2].map(j=>({p:[p.getX(i+j)+m.position.x,p.getY(i+j)+m.position.y,p.getZ(i+j)+m.position.z],u:[uv?.getX(i+j)||0,uv?.getY(i+j)||0]}));
 for(let side=0;side<2;side++){const out=[];for(let k=0;k<3;k++){const a=tri[k],b=tri[(k+1)%3],inside=v=>side?v.p[0]>=cut:v.p[0]<=cut,ia=inside(a),ib=inside(b);if(ia)out.push(a);if(ia!==ib){const t=(cut-a.p[0])/(b.p[0]-a.p[0]);out.push({p:a.p.map((v,j)=>v+(b.p[j]-v)*t),u:a.u.map((v,j)=>v+(b.u[j]-v)*t)});}}for(let k=1;k<out.length-1;k++)for(const v of [out[0],out[k],out[k+1]]){halves[side].push(v.p[0]-(side?cut:0),v.p[1],v.p[2]);uvs[side].push(...v.u);}}}
 for(let side=0;side<2;side++)if(halves[side].length){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(halves[side],3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs[side],2));g.computeVertexNormals();mesh(g,m.material,side?outer:wing);}wing.remove(m);m.geometry.dispose();}
 wing.add(outer);return outer;}
const smallStock=new Map();
function smallBird(cfg,options){
 let stock=smallStock.get(cfg.id);if(!stock){const temp=new THREE.Group();const b=body(temp,cfg.body,false);const wg=new THREE.Group();sheet([[0,0,-.3],[1.05,.08,-.42],[2.4,0,.27],[1.5,0,.55],[.7,0,.38],[0,0,.42]],.13,cfg.wing,wg);const tg=new THREE.Group();sheet([[-.12,0,0],[.12,0,0],[.38,0,.8],[0,0,.47],[-.38,0,.8]],.06,cfg.wing,tg);stock={body:b.geometry,wing:wg.children[0].geometry,tail:tg.children[0].geometry};smallStock.set(cfg.id,stock);}
 const root=new THREE.Group(),rig=new THREE.Group();root.add(rig);mesh(stock.body,cfg.body,rig);const wings=[];for(const sign of [-1,1]){const wing=new THREE.Group(),outer=new THREE.Group();wing.position.set(sign*.18,.04,-.15);wing.scale.x=sign;mesh(stock.wing,cfg.wing,wing);wing.add(outer);rig.add(wing);wings.push({wing,outer,sign});}const tail=mesh(stock.tail,cfg.wing,rig,[0,0,.67]);const beak=mesh(new THREE.ConeGeometry(.11,.34,4),cfg.beak,rig,[0,0,-1.3]);beak.rotation.x=-Math.PI/2;root.name='Sürü kuşu / '+cfg.name;root.scale.setScalar(options.scale??.24);root.userData={rig,wings,tail,feet:[],eyes:[],cfg,time:options.phase??0,small:true};return root;
}
// Batch static paper pieces inside each articulated part; retain the two real hinges.
function batchPaper(group){for(const child of [...group.children])if(child.isGroup)batchPaper(child);const batches=new Map();for(const m of [...group.children])if(m.isMesh){if(!batches.has(m.material))batches.set(m.material,[]);batches.get(m.material).push(m);}for(const [mat,list] of batches){if(list.length<2)continue;const vertices=[],uvs=[];for(const m of list){m.updateMatrix();const g=m.geometry.clone().applyMatrix4(m.matrix),p=g.attributes.position,u=g.attributes.uv;for(let i=0;i<p.count;i++){vertices.push(p.getX(i),p.getY(i),p.getZ(i));uvs.push(u?.getX(i)||0,u?.getY(i)||0);}g.dispose();group.remove(m);m.geometry.dispose();}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));g.computeVertexNormals();mesh(g,mat,group);}}
export function createBird(options={}){const index=typeof options.species==='string'?BIRD_SPECIES.findIndex(s=>s.id===options.species):options.species??0;const cfg=BIRD_SPECIES[index]||BIRD_SPECIES[0],owl=cfg.id==='owl';if(options.small)return smallBird(cfg,options);const root=new THREE.Group(),rig=new THREE.Group();root.add(rig);root.name=cfg.name;
 body(rig,cfg.body,owl);
 const wings=[];for(const sign of [-1,1]){const wing=new THREE.Group();wing.position.set(sign*.24,.06,-.2);wing.scale.x=sign;rig.add(wing);const outlines={paper:[[0,0,-.52],[1.05,.05,-.50],[2.55,.02,-.55],[2.75,.02,-.32],[2.7,0,.38],[1.55,0,.50],[.6,0,.7],[0,0,.48]],swallow:[[0,0,-.40],[1.2,.05,-.45],[3.25,.02,.62],[1.5,0,.38],[0,0,.38]],gull:[[0,0,-.42],[1.6,.08,-.40],[3.5,.02,-.02],[2.3,0,.30],[1.3,0,.54],[0,0,.4]],owl:[[0,0,-.58],[1.25,.05,-.63],[2.15,.02,-.48],[2.6,.01,-.1],[2.55,0,.42],[2.1,0,.76],[1.2,0,.89],[0,0,.5]]};sheet(outlines[cfg.id],.075,cfg.wing,wing);// Individually folded flight-feather strips, not fur or soft lobes.
 for(let j=0;j<8;j++){const f=j/7,x=.62+f*(cfg.span-.83),w=.17+(1-f)*.12,z=-.34+f*.29,len=cfg.chord*(.86-.35*f);sheet([[x-w,.025,z],[x+w,.025,z-.025],[x+w+.20,.035,z+len*.82],[x+.03,.015,z+len],[x-w+.04,.02,z+len*.83]],.06,cfg.id==='gull'&&f>.70?'#52616a':j%3===0?new THREE.Color(cfg.wing).lerp(new THREE.Color(cfg.edge),.35).getStyle():cfg.wing,wing).position.y=.09;}
 sheet([[.02,.05,-.43],[1.13,.12,-.37],[1.6,.09,-.13],[1.03,.10,.18],[.08,.05,.32]],.085,cfg.body,wing);
 if(owl)for(let j=0;j<5;j++){const x=.8+j*.33;for(let k=0;k<2;k++){const z=-.06+k*.24;sheet([[x-.09,.16,z],[x+.10,.16,z-.015],[x+.12,.16,z+.045],[x-.08,.16,z+.055]],.003,'#8f7053',wing);}}
 const outer=wrist(wing);batchPaper(wing);wings.push({wing,outer,sign});}
 const tail=new THREE.Group();tail.position.z=.63;rig.add(tail);const tails={paper:[[-.17,0,0],[.17,0,0],[.52,0,.92],[0,.025,.78],[-.52,0,.92]],swallow:[[-.14,0,0],[.14,0,0],[.68,0,1.65],[.08,.02,.62],[-.08,.02,.62],[-.68,0,1.65]],gull:[[-.19,0,0],[.19,0,0],[.40,0,.76],[0,.02,.83],[-.40,0,.76]],owl:[[-.24,0,0],[.24,0,0],[.44,0,.65],[.3,0,.76],[-.3,0,.76],[-.44,0,.65]]};sheet(tails[cfg.id],.07,cfg.wing,tail);
 if(cfg.id!=='swallow')for(let j=-1;j<=1;j++){const x=j*.19;sheet([[x-.07,.035,.1],[x+.07,.035,.1],[x+.12,.025,.7],[x-.12,.025,.7]],.028,j===0?cfg.body:cfg.wing,tail);}

 batchPaper(tail);
 // A narrow doubled spine reads as a scored fold, never a soft feather ridge.
 sheet([[-.018,.335,-.55],[.018,.335,-.55],[.012,.27,.23],[-.012,.27,.23]],.008,cfg.edge,rig);
 const beak=mesh(new THREE.ConeGeometry(owl?.12:.115,owl?.22:.38,4),cfg.beak,rig,[0,-.015,-1.34]);beak.rotation.x=-Math.PI/2;
 if(owl){const head=mesh(new THREE.IcosahedronGeometry(1,1),cfg.body,rig,[0,.12,-.78]);head.scale.set(.48,.42,.36);const belly=mesh(new THREE.IcosahedronGeometry(1,1),'#d9c29b',rig,[0,-.17,-.2]);belly.scale.set(.36,.23,.65);}
 if(cfg.id==='swallow'){const bib=mesh(new THREE.IcosahedronGeometry(1,1),'#e5d9bf',rig,[0,-.16,-.46]);bib.scale.set(.27,.18,.53);const throat=mesh(new THREE.IcosahedronGeometry(1,0),'#bd795c',rig,[0,.02,-1.04]);throat.scale.set(.20,.16,.19);}
 const eyes=[];for(const sign of [-1,1]){const x=sign*(owl?.215:.255),y=owl?.23:.16,z=owl?-1.09:-.96;
 if(owl){const disc=mesh(new THREE.CylinderGeometry(.238,.238,.035,12),'#e8d9b9',rig,[x,y,z]);disc.rotation.x=Math.PI/2-.25;const inner=mesh(new THREE.CylinderGeometry(.145,.145,.039,12),'#c9a375',rig,[x,y+.012,z-.025]);inner.rotation.x=disc.rotation.x;}
 const eye=mesh(new THREE.IcosahedronGeometry(owl?.085:.059,1),'#303b3c',rig,[x,owl?y+.015:y,owl?z-.058:z]);eyes.push(eye);
 mesh(new THREE.IcosahedronGeometry(owl?.022:.015,0),'#fff5db',rig,[x-sign*.016,y+.025,z-(owl?.132:.042)]);
 if(owl){const brow=sheet([[Math.abs(x)-.20,.43,-1.04],[Math.abs(x)+.20,.40,-1.02],[Math.abs(x)+.04,.31,-1.15]],.025,cfg.body,rig);brow.scale.x=sign;}}

 const feet=[];for(const sign of [-1,1]){const foot=new THREE.Group();foot.position.set(sign*.16,-.22,.08);rig.add(foot);mesh(new THREE.BoxGeometry(.047,.26,.055),owl?'#a77b4f':cfg.beak,foot,[0,-.13,0]);for(let j=-1;j<=1;j++)sheet([[j*.04-.025,-.26,.04],[j*.04+.025,-.26,.04],[j*.065+.027,-.29,-.18],[j*.065-.027,-.29,-.18]],.014,cfg.beak,foot);feet.push(foot);}
 root.userData={rig,wings,tail,eyes,feet,cfg,time:0,small:!!options.small};root.scale.setScalar(options.scale??1);return root;}
export function updateBird(bird,action='idle',dt=1/60,speed=1){const d=bird.userData;if(!d.rig)return;d.time+=Math.min(.1,Math.max(0,dt))*speed;const t=d.time;const flying=action!=='idle'&&action!=='perch';d.rig.position.y=flying?Math.sin(t*2)*.045:Math.sin(t*1.5)*.018;d.rig.rotation.z=THREE.MathUtils.lerp(d.rig.rotation.z,action==='bank'?Math.sin(t*.8)*.28:0,1-Math.exp(-dt*7));d.rig.rotation.x=THREE.MathUtils.lerp(d.rig.rotation.x,flying?-.04:.09,1-Math.exp(-dt*9));for(const foot of d.feet)foot.rotation.x=THREE.MathUtils.lerp(foot.rotation.x,flying?-1.35:0,1-Math.exp(-dt*9));for(const eye of d.eyes)eye.scale.y=Math.sin(t*.8)>.997?.22:1;for(const {wing,outer,sign} of d.wings){const phase=t*d.cfg.rate*2;const flap=action==='flap',perched=!flying;wing.scale.x=THREE.MathUtils.lerp(wing.scale.x,sign*(perched?.42:1),1-Math.exp(-dt*9));wing.rotation.z=THREE.MathUtils.lerp(wing.rotation.z,sign*(flap?Math.sin(phase)*.62:perched?.20:.055),1-Math.exp(-dt*18));wing.rotation.y=THREE.MathUtils.lerp(wing.rotation.y,sign*(perched?-1.12:flap?Math.cos(phase)*.055:0),1-Math.exp(-dt*9));outer.rotation.z=flap?Math.sin(phase-.65)*.34:perched?.18:-.06;outer.rotation.y=perched?-.25:Math.sin(t*1.4)*.018;}
d.tail.rotation.x=Math.sin(t*2)*.025;}
