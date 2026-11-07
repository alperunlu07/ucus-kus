// Kağıt Kuş · isolated wildlife models. Local +Z is forward; land soles are y=0.
import * as THREE from 'three';
import {makeFeltMaterial} from './sheepModel.js';
export const FAUNA_POLISH=10;
const TAU=Math.PI*2;
function material(color){return makeFeltMaterial(color);}
function ellipsoid(rx,ry,rz){const g=new THREE.SphereGeometry(1,32,24);g.scale(rx,ry,rz);return g;}
// Smooth-union implicit skin, triangulated as ONE indexed watertight volume.
// Contributors never survive as separate meshes or visible intersecting balls.
const skinCache=new Map();
function skin(kind){
 if(skinCache.has(kind))return skinCache.get(kind).clone();
 const defs={deer:[[0,1.21,-.04,.325,.37,.76],[0,1.28,.39,.27,.37,.37],[0,1.59,.59,.19,.36,.23]],rabbit:[[0,.4,-.08,.29,.34,.44],[-.16,.31,-.23,.19,.23,.24],[.16,.31,-.23,.19,.23,.24],[0,.51,.13,.23,.28,.29]],pduck:[[0,.43,-.02,.31,.29,.50],[0,.48,.25,.255,.28,.29],[0,.56,-.47,.15,.11,.26]],duck:[[0,.27,-.02,.31,.29,.50],[0,.32,.25,.255,.28,.29],[0,.4,-.47,.15,.11,.26]]};
 const bs=defs[kind],k=kind==='deer'?.16:.12;
 const field=(x,y,z)=>{let d=10;for(const b of bs){const v=(Math.hypot((x-b[0])/b[3],(y-b[1])/b[4],(z-b[2])/b[5])-1)*Math.min(b[3],b[4],b[5]),h=Math.max(k-Math.abs(d-v),0)/k;d=Math.min(d,v)-h*h*k*.25;}return d;};
 const min=[-.6,kind==='deer'?.72:-.07,-.92],max=[.6,kind==='deer'?2.05:.91,.89],step=.055,n=max.map((v,i)=>Math.ceil((v-min[i])/step)),P=[],I=[],map=new Map();
 const corners=[[0,0,0],[1,0,0],[1,1,0],[0,1,0],[0,0,1],[1,0,1],[1,1,1],[0,1,1]],tets=[[0,5,1,6],[0,1,2,6],[0,2,3,6],[0,3,7,6],[0,7,4,6],[0,4,5,6]];
 const vertex=p=>{const key=p.map(v=>Math.round(v*1e6)).join(',');if(map.has(key))return map.get(key);const i=P.length/3;P.push(...p);map.set(key,i);return i;};
 const triangle=(a,b,c)=>{const u=new THREE.Vector3(...b).sub(new THREE.Vector3(...a)),v=new THREE.Vector3(...c).sub(new THREE.Vector3(...a)),normal=u.cross(v),mid=a.map((x,i)=>(x+b[i]+c[i])/3),e=.002,grad=new THREE.Vector3(field(mid[0]+e,mid[1],mid[2])-field(mid[0]-e,mid[1],mid[2]),field(mid[0],mid[1]+e,mid[2])-field(mid[0],mid[1]-e,mid[2]),field(mid[0],mid[1],mid[2]+e)-field(mid[0],mid[1],mid[2]-e));if(normal.dot(grad)<0)[b,c]=[c,b];I.push(vertex(a),vertex(b),vertex(c));};
 for(let x=0;x<n[0];x++)for(let y=0;y<n[1];y++)for(let z=0;z<n[2];z++){
 const ps=corners.map(c=>[min[0]+(x+c[0])*step,min[1]+(y+c[1])*step,min[2]+(z+c[2])*step]),ds=ps.map(p=>field(...p));if(ds.every(d=>d>0)||ds.every(d=>d<0))continue;
 for(const tet of tets){const inside=tet.filter(i=>ds[i]<0),outside=tet.filter(i=>ds[i]>=0);if(!inside.length||!outside.length)continue;const cut=(i,j)=>{const t=ds[i]/(ds[i]-ds[j]);return ps[i].map((v,k)=>v+(ps[j][k]-v)*t);};if(inside.length===1||outside.length===1){const a=inside.length===1?inside[0]:outside[0],others=inside.length===1?outside:inside;triangle(...others.map(b=>cut(a,b)));}else{const [a,b]=inside,[c,d]=outside,p0=cut(a,c),p1=cut(a,d),p2=cut(b,c),p3=cut(b,d);triangle(p0,p1,p2);triangle(p1,p3,p2);}}
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setIndex(I);g.computeVertexNormals();skinCache.set(kind,g);return g.clone();
}
function mesh(parent,g,color,x=0,y=0,z=0){if(!g.attributes.color){const a=new Float32Array(g.attributes.position.count*3);a.fill(1);g.setAttribute('color',new THREE.BufferAttribute(a,3));}const m=new THREE.Mesh(g,typeof color==='string'?material(color):color);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;parent.add(m);return m;}
function paint(m,fn){const p=m.geometry.attributes.position,c=m.geometry.attributes.color;for(let i=0;i<p.count;i++){const col=fn(p.getX(i),p.getY(i),p.getZ(i));c.setXYZ(i,col.r,col.g,col.b);}m.material.color.set('#ffffff');c.needsUpdate=true;}
const mixColor=(a,b,t)=>new THREE.Color(a).lerp(new THREE.Color(b),THREE.MathUtils.clamp(t,0,1));
function oval(p,s,c,x,y,z){return mesh(p,ellipsoid(...s),c,x,y,z);}
function link(p,a,b,r1,r2,c){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),d=bv.clone().sub(av);const m=mesh(p,new THREE.CylinderGeometry(r2,r1,d.length(),9,1),c);m.position.copy(av.add(bv).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());return m;}
function leafGeo(w,h,thickness=.025){const sh=new THREE.Shape();sh.moveTo(0,0);sh.bezierCurveTo(-w,h*.25,-w,h*.65,0,h);sh.bezierCurveTo(w,h*.65,w,h*.25,0,0);return new THREE.ExtrudeGeometry(sh,{depth:thickness,bevelEnabled:true,bevelSegments:2,bevelThickness:.008,bevelSize:.008,steps:1,curveSegments:12});}
function eye(p,x,y,z,r=.035){oval(p,[r*.52,r,r],'#2f2c25',x,y,z);oval(p,[r*.18,r*.25,r*.25],'#fff9e6',x+Math.sign(x)*r*.45,y+r*.33,z+r*.20);}
function group(p,x=0,y=0,z=0){const g=new THREE.Group();g.position.set(x,y,z);p.add(g);return g;}
function root(kind,opts){const o=new THREE.Group(),rig=group(o);o.userData={kind,seed:opts.seed??1,t:0,rig,legs:[],ears:[],wings:[],flightWings:[],action:'idle'};return o;}
export function createDeer(opts={}){
 const o=root('deer',opts),d=o.userData,p=d.rig;d.coat=opts.young?'#bd8656':'#a66b43';
 d.body=mesh(p,skin('deer'),d.coat);paint(d.body,(x,y,z)=>{let c=mixColor(d.coat,'#855333',THREE.MathUtils.smoothstep(y,1.39,1.59)*.35);const throat=THREE.MathUtils.smoothstep(z,.44,.65)*(1-THREE.MathUtils.smoothstep(y,1.71,1.88));c.lerp(new THREE.Color('#e8d4ad'),throat*.93);if(Math.abs(x)>.20){let spot=0;for(let i=0;i<6;i++){const zz=-.53+i*.145;for(let row=0;row<2;row++){const yy=1.29+row*.13+Math.sin(i*2.1)*.025,dist=Math.hypot((z-zz)/.043,(y-yy)/.032);spot=Math.max(spot,1-THREE.MathUtils.smoothstep(dist,.6,1));}}c.lerp(new THREE.Color('#ead7b2'),spot*(opts.young?.95:.66));}return c;});
 d.head=group(p,0,1.86,.73);
 // One tapered head mesh: cheek narrows into a long soft paper muzzle.
 const hg=ellipsoid(.18,.23,.39),hp=hg.attributes.position;for(let i=0;i<hp.count;i++){const z=hp.getZ(i),f=1-.22*Math.max(0,z/.39);hp.setXYZ(i,hp.getX(i)*f,hp.getY(i)-Math.max(0,z)*.18,z+.14);}hg.computeVertexNormals();mesh(d.head,hg,d.coat);
 oval(d.head,[.10,.072,.075],'#3e342b',0,-.055,.49);
 for(const side of [-1,1]){
 eye(d.head,side*.164,.065,.24,.037);
 const ear=group(d.head,side*.145,.18,-.015);mesh(ear,leafGeo(.105,.40),d.coat);mesh(ear,leafGeo(.06,.265,.008),'#e4c3a4',0,.055,.034);ear.rotation.z=-side*.72;d.ears.push(ear);
 if(!opts.young){const ant=group(d.head,side*.10,.20,-.08),c='#d3b78b';
 const points=[[0,0,0],[side*.09,.30,-.07],[side*.19,.57,-.12],[side*.27,.79,-.06]];
 for(let j=0;j<3;j++)link(ant,points[j],points[j+1],.035-j*.007,.029-j*.008,c);
 link(ant,points[1],[side*.27,.43,.13],.025,.008,c);link(ant,points[2],[side*.06,.73,.06],.021,.006,c);
 }
 }
 d.knees=[];for(const z of [-.47,.48])for(const x of [-.22,.22]){const leg=group(p,x,1.06,z),bend=z<0?-.085:.025;link(leg,[0,0,0],[0,-.46,bend],.083,.047,d.coat);const knee=group(leg,0,-.46,bend);oval(knee,[.049,.065,.05],d.coat,0,0,0);link(knee,[0,0,0],[0,-.535,-bend+.025],.042,.03,'#99704e');const hoof=group(knee,0,-.535,-bend+.055);for(const side of [-1,1])oval(hoof,[.033,.065,.10],'#514137',side*.032,0,0);d.legs.push(leg);d.knees.push(knee);} 
 d.tail=oval(p,[.09,.16,.1],'#ece1ca',0,1.3,-.73);return o;
}
export function createRabbit(opts={}){
 const o=root('rabbit',opts),d=o.userData,p=d.rig;d.coat='#c6b39b';
 d.body=mesh(p,skin('rabbit'),d.coat);paint(d.body,(x,y,z)=>mixColor(d.coat,'#eee4d1',THREE.MathUtils.smoothstep(z,.12,.38)*(1-THREE.MathUtils.smoothstep(Math.abs(x),.12,.25))*.9+Math.max(0,.27-y)));d.head=group(p,0,.69,.30);const hg=ellipsoid(.23,.22,.255),hp=hg.attributes.position;for(let i=0;i<hp.count;i++){const y=hp.getY(i),z=hp.getZ(i);hp.setZ(i,z+.025+Math.max(0,-y)*.27);}hg.computeVertexNormals();const face=mesh(d.head,hg,d.coat);paint(face,(x,y,z)=>mixColor(d.coat,'#eee4d1',(1-THREE.MathUtils.smoothstep(y,-.12,-.015))*THREE.MathUtils.smoothstep(z,.12,.26)));
 for(const side of [-1,1])eye(d.head,side*.205,.045,.13,.042);
 oval(d.head,[.034,.024,.023],'#c28b80',0,-.055,.291);
 link(d.head,[0,-.069,.289],[0,-.105,.28],.004,.004,'#756052');for(const side of [-1,1]){link(d.head,[0,-.105,.28],[side*.044,-.12,.272],.003,.002,'#756052');for(let j=0;j<2;j++)link(d.head,[side*.095,-.075+j*.034,.245],[side*.30,-.10+j*.09,.23],.0025,.001,'#776958');}
 for(const side of [-1,1]){const ear=group(d.head,side*.115,.13,-.025);mesh(ear,leafGeo(.078,.66,.035),d.coat);mesh(ear,leafGeo(.044,.49,.008),'#d6a79c',0,.075,.047);ear.rotation.z=side*(side===1?.19:.10);ear.rotation.x=side===1?-.1:.08;d.ears.push(ear);const leg=group(p,side*.17,.29,.25);link(leg,[0,.02,0],[0,-.20,.06],.058,.045,d.coat);oval(leg,[.075,.055,.155],d.coat,0,-.235,.08);d.legs.push(leg);const rear=group(p,side*.24,.13,-.23);oval(rear,[.125,.075,.23],d.coat,0,-.055,.035);d.legs.push(rear);for(const j of [-1,1])link(rear,[j*.035,.005,.17],[j*.035,-.018,.225],.0025,.0015,'#8c7862');}
 d.tail=oval(p,[.12,.13,.12],'#f4ebdc',0,.43,-.48);return o;
}
export function createDuck(opts={}){
 const paddy=opts.paddy??opts.kind==='pduck',o=root(paddy?'pduck':'duck',opts),d=o.userData,p=d.rig;d.paddy=paddy;d.coat=paddy?'#fff7e3':'#a99883';const cy=paddy?.43:.27;
 d.body=mesh(p,skin(paddy?'pduck':'duck'),d.coat);paint(d.body,(x,y,z)=>paddy?mixColor('#fff7e3','#e4d8b9',Math.max(0,.45-y)*.6):mixColor(z>.20?'#916445':z<-.40?'#4f574b':'#b4b1a0','#d4ceba',Math.max(0,y-.34)*.9));
 link(p,[0,cy,.30],[0,cy+.38,.43],.16,.125,paddy?'#fff7e3':'#487259');if(!paddy){const collar=new THREE.TorusGeometry(.139,.018,6,32);collar.rotateX(Math.PI/2);mesh(p,collar,'#e9e0bd',0,cy+.26,.39);}
 d.head=group(p,0,cy+.39,.44);oval(d.head,[.185,.19,.22],paddy?'#fff7e3':'#487259',0,0,0);
 d.bill=oval(d.head,[.14,.038,.205],paddy?'#e5ac4f':'#c6a34b',0,-.048,.255);oval(d.head,[.127,.014,.18],'#bd8037',0,-.077,.263);
 for(const side of [-1,1]){eye(d.head,side*.173,.035,.105,.029);oval(d.head,[.012,.005,.022],'#735d38',side*.057,-.013,.25);
 const wing=group(p,side*.278,cy+.05,.24),wg=leafGeo(.16,.64,.035);wg.rotateX(-Math.PI/2);wg.rotateZ(side*Math.PI/2);mesh(wing,wg,paddy?'#e8e0ca':'#766f5a');d.wings.push(wing);if(!paddy){oval(wing,[.008,.05,.125],'#54769a',side*.05,.01,-.28);for(const y of [-.047,.066])link(wing,[side*.052,y,-.16],[side*.052,y,-.40],.006,.006,'#e7dec5');}
 const flight=group(p,side*.23,cy+.16,.17),fs=new THREE.Shape();fs.moveTo(0,.10);for(const [x,z]of [[.29,.07],[.64,-.16],[.58,-.36],[.47,-.27],[.36,-.45],[.27,-.32],[.14,-.47],[0,-.35]])fs.lineTo(side*x,z);fs.closePath();const fg=new THREE.ExtrudeGeometry(fs,{depth:.018,bevelEnabled:true,bevelThickness:.006,bevelSize:.008,bevelSegments:1});fg.rotateX(Math.PI/2);mesh(flight,fg,paddy?'#f4edd9':'#9a9b8b');flight.visible=false;d.flightWings.push(flight);
 // Three shallow score lines indicate folded primary feathers, not separate balls.
 for(let j=0;j<3;j++)link(wing,[side*.045,-.035+j*.045,-.25],[side*.045,-.025+j*.022,-.47-j*.025],.003,.002,paddy?'#bcbba3':'#a6a48d');
 }
 d.tail=group(p,0,cy+.11,-.47);
 for(const side of [-1,1]){const leg=group(p,side*.14,paddy?.15:.045,.03);if(paddy)link(leg,[0,.13,0],[0,-.12,0],.026,.023,'#d99a43');const sh=new THREE.Shape();sh.moveTo(-.025,-.065);sh.lineTo(-.105,.135);sh.lineTo(-.045,.12);sh.lineTo(0,.17);sh.lineTo(.045,.12);sh.lineTo(.105,.135);sh.lineTo(.025,-.065);sh.closePath();const fg=new THREE.ExtrudeGeometry(sh,{depth:.018,bevelEnabled:false});fg.rotateX(Math.PI/2);mesh(leg,fg,'#d59c47',0,paddy?-.132:0,0);for(const toe of [-1,0,1])link(leg,[0,paddy?-.130:.003,-.02],[toe*.065,paddy?-.130:.003,.12],.002,.001,'#b68239');if(!paddy)leg.visible=false;d.legs.push(leg);} 
 return o;
}
export function createFauna(opts={}){return opts.kind==='deer'?createDeer(opts):opts.kind==='rabbit'?createRabbit(opts):createDuck({...opts,paddy:opts.kind==='pduck'});}
export function updateFauna(o,action='idle',dt=0){
 const d=o.userData;dt=Math.max(0,Math.min(dt,.1));d.t+=dt;if(d.action!==action)d.actionTime=0;else d.actionTime=(d.actionTime||0)+dt;d.action=action;const t=d.t+d.seed*.71,duck=d.kind.includes('duck');
 if(!d.rest){d.rest={head:d.head.position.clone(),ears:d.ears.map(e=>e.rotation.clone()),legs:d.legs.map(l=>l.position.clone()),skin:d.body.geometry.attributes.position.array.slice()};d.graze=0;}
 d.rig.position.set(0,0,0);d.rig.rotation.set(0,0,0);d.rig.scale.set(1,1+.004*Math.sin(t*2),1);d.head.position.copy(d.rest.head);d.head.rotation.set(.018*Math.sin(t*1.8),.045*Math.sin(t*.8),.012*Math.sin(t*1.3));
 d.ears.forEach((e,i)=>{e.rotation.copy(d.rest.ears[i]);const flick=Math.pow(Math.max(0,Math.sin(t*1.8+i*1.7)),16);e.rotation.z+=(i?1:-1)*flick*.18;e.rotation.x+=.05*Math.sin(t*1.1+i);});
 d.legs.forEach((l,i)=>{l.rotation.set(0,0,0);l.position.copy(d.rest.legs[i]);});if(d.knees)d.knees.forEach(k=>k.rotation.set(0,0,0));d.wings.forEach(w=>{w.rotation.set(0,0,0);w.visible=action!=='flap';});d.flightWings.forEach(w=>w.visible=action==='flap');d.tail.rotation.z=.12*Math.sin(t*2.2);d.tail.rotation.x=0;
 if(d.kind==='deer'){
 const aim=action==='graze'?1:0;d.graze+=(aim-d.graze)*(1-Math.exp(-dt*5));const g=d.graze;
 d.head.position.y-=g*1.25;d.head.position.z+=g*.45;d.head.rotation.x+=g*1.15+g*.025*Math.sin(t*8);d.head.rotation.y*=1-g;
 if(g>.001||d.lastGraze>.001){const a=d.body.geometry.attributes.position,r=d.rest.skin;for(let i=0;i<a.count;i++){const y=r[i*3+1],z=r[i*3+2],w=THREE.MathUtils.smoothstep(y,1.27,1.85)*THREE.MathUtils.smoothstep(z,.20,.50);a.setXYZ(i,r[i*3],y-g*w*1.25,z+g*w*.45);}a.needsUpdate=true;d.body.geometry.computeVertexNormals();}d.lastGraze=g;
 }else if(d.kind==='rabbit'){
 d.head.position.z+=.008*Math.sin(t*5.2);d.head.rotation.x+=.02*Math.sin(t*4.7);if(action==='alert'){d.ears.forEach((e,i)=>{e.rotation.z=(i?1:-1)*.035;e.rotation.x=-.05;});d.head.rotation.x=-.10;d.head.position.y+=.035;}
 }else if(duck){d.head.position.y+=.014*Math.sin(t*2);d.head.rotation.y=.09*Math.sin(t*.9);if(!d.paddy){d.rig.position.y=.012*Math.sin(t*2.2);d.rig.rotation.z=.016*Math.sin(t*1.4);}}
 // Locomotion is intentionally in-place so consumers own world movement.
 if(action==='walk'&&d.kind==='deer'){
 const f=d.actionTime*4.8;d.rig.position.y=.018+.015*Math.abs(Math.sin(f));d.legs.forEach((l,i)=>{const ph=f+([0,Math.PI,Math.PI,0][i]);l.rotation.x=.36*Math.sin(ph);l.position.y+=Math.max(0,Math.sin(ph))*.055;d.knees[i].rotation.x=-.22*Math.max(0,Math.sin(ph));});d.head.rotation.x+=.025*Math.sin(f*2);
 }
 if(action==='hop'&&(d.kind==='deer'||d.kind==='rabbit')){
 const rabbit=d.kind==='rabbit',cycle=rabbit?.95:1.35,air=rabbit?.65:.80,u=(d.actionTime%cycle)/air,h=u<1?Math.sin(Math.PI*u):0;
 d.rig.position.y=(rabbit?.43:.60)*h;d.rig.rotation.x=u<1?-.09*Math.sin(u*TAU):0;d.rig.scale.y=1-(u>=1?.04:0);d.legs.forEach((l,i)=>{l.rotation.x=(rabbit?(i%2?-.55:.45):(i<2?.52:-.52))*h;});d.ears.forEach((e,i)=>e.rotation.x+=h*.18);d.tail.rotation.x=-h*.3;
 }
 if(duck){
 if(action==='paddle'||action==='swim'){
 const f=d.actionTime*5;d.rig.rotation.z+=.025*Math.sin(f);d.rig.rotation.y=.035*Math.sin(f*.5);d.rig.position.z=.025*Math.sin(f*.5);d.legs.forEach((l,i)=>{l.rotation.x=.4*Math.sin(f+i*Math.PI);if(d.paddy)l.position.y+=.035*Math.max(0,Math.sin(f+i*Math.PI));});d.head.position.y+=.022*Math.sin(f);
 }else if(action==='dabble'){
 const dip=.5-.5*Math.cos(d.actionTime*2.5);d.head.rotation.x+=dip*1.25;d.head.position.y-=dip*(d.paddy?.42:.30);d.head.position.z+=dip*.14;d.tail.rotation.x=-dip*.3;d.rig.rotation.x=dip*.10;d.rig.position.y+=dip*.025;
 }else if(action==='flap'){
 const f=d.actionTime*10;d.flightWings.forEach((w,i)=>{w.rotation.z=(i===0?-1:1)*(.35+.70*(.5+.5*Math.sin(f)));w.rotation.y=(i===0?-1:1)*.18;});d.head.rotation.x=-.08;d.rig.position.y+=.035*Math.abs(Math.sin(f));
 }
 }
}


export const updateDeer=updateFauna,updateRabbit=updateFauna,updateDuck=updateFauna;
