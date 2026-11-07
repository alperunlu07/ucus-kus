// Kağıt Kuş — continuous felt-hide cows. +Z forward, soles at Y=0.
import * as THREE from 'three';
import {makeFeltMaterial} from './sheepModel.js';
export const COW_POLISH=10;
export const COW_VARIANTS={brown:'#946346',black:'#343735',cream:'#e5cf9e',patched:'#eee5d2'};
const white=new THREE.Color('#f1e7cf');
const smooth=(a,b,k)=>{const h=Math.max(k-Math.abs(a-b),0)/k;return Math.min(a,b)-h*h*k*.25;};
function ell(q,x,y,z){return (Math.hypot((x-q[0])/q[3],(y-q[1])/q[4],(z-q[2])/q[5])-1)*Math.min(q[3],q[4],q[5]);}
// Ray-solve a smooth union, welded indexed latitude rings: ONE hide, not balls.
function hull(blobs,origin,seed=1,body=false){const P=[],I=[],C=[],nu=112,nv=72;
 const sdf=(x,y,z)=>{let d=100;for(let k=0;k<blobs.length;k++){const q=blobs[k];let e=ell(q,x,y,z);if(body&&COW_POLISH>=3&&k===0){const n=2.65;e=(Math.pow(Math.pow(Math.abs((x-q[0])/q[3]),n)+Math.pow(Math.abs((y-q[1])/q[4]),n)+Math.pow(Math.abs((z-q[2])/q[5]),n),1/n)-1)*.38;}d=smooth(d,e,q[6]||.12);}return d;};
 for(let j=0;j<=nv;j++){const v=j/nv*Math.PI;for(let i=0;i<=nu;i++){const u=i/nu*Math.PI*2,dx=Math.sin(v)*Math.cos(u),dy=Math.cos(v),dz=Math.sin(v)*Math.sin(u);let lo=0,hi=2.8;
 for(let n=0;n<25;n++){const r=(lo+hi)/2;if(sdf(origin[0]+dx*r,origin[1]+dy*r,origin[2]+dz*r)<0)lo=r;else hi=r;}
 const grain=COW_POLISH>=3?1+.003*Math.sin(dx*19+seed)*Math.sin(dz*23)*Math.cos(dy*17):1;
 P.push(origin[0]+dx*lo*grain,origin[1]+dy*lo*grain,origin[2]+dz*lo*grain);C.push(1,1,1);
 if(j<nv&&i<nu){const a=j*(nu+1)+i,b=a+nu+1;I.push(a,a+1,b,b,a+1,b+1);}}}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('color',new THREE.Float32BufferAttribute(C,3));g.setIndex(I);g.computeVertexNormals();
 // Smooth duplicate seam/pole normals without sacrificing patch-local vertices.
 const p=g.attributes.position,n=g.attributes.normal,map=new Map();for(let i=0;i<p.count;i++){const k=[p.getX(i),p.getY(i),p.getZ(i)].map(x=>Math.round(x*1e5)).join(',');let v=map.get(k);if(!v){v={n:new THREE.Vector3(),ids:[]};map.set(k,v);}v.n.add(new THREE.Vector3(n.getX(i),n.getY(i),n.getZ(i)));v.ids.push(i);}for(const v of map.values()){v.n.normalize();for(const i of v.ids)n.setXYZ(i,v.n.x,v.n.y,v.n.z);}return g;
}
function material(c,dark=false){const m=makeFeltMaterial(c,dark);m.vertexColors=false;return m;}
function oval(sc,pos,mat,parent){const geo=new THREE.SphereGeometry(1,24,16);geo.scale(...sc);const m=new THREE.Mesh(geo,mat);m.position.set(...pos);parent.add(m);return m;}
function curve(points,r,mat,parent){const g=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),20,r,8,false),m=new THREE.Mesh(g,mat);parent.add(m);return m;}
// Analytic, derivative-antialiased dye boundary: no sawtooth vertex patches.
function hideMaterial(variant,seed){const m=makeFeltMaterial('#ffffff',variant==='black');const compile=m.onBeforeCompile,base=new THREE.Color(COW_VARIANTS[variant]||COW_VARIANTS.brown),ink=new THREE.Color('#34352e');const rgb=c=>`vec3(${c.r.toFixed(6)},${c.g.toFixed(6)},${c.b.toFixed(6)})`;
 m.onBeforeCompile=sh=>{compile(sh);let expression='0.0',other=white,cut=.95;if(variant==='patched'){other=ink;cut=.25;}else if(variant==='black')cut=1.4;
 if(variant!=='cream')expression=`smoothstep(${cut.toFixed(2)}-aa,${cut.toFixed(2)}+aa,f)`;
 sh.fragmentShader=sh.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
 vec3 hp=vFeltPosition;float f=sin(hp.z*4.8+${(seed*.7).toFixed(4)}+sin(hp.y*6.0)*.65)+.7*cos(hp.x*7.0-hp.y*4.7)+.35*sin(hp.z*11.0+hp.x*8.0+hp.y*9.0);float aa=max(.012,fwidth(f)*.8);diffuseColor.rgb*=mix(${rgb(base)},${rgb(other)},${expression});`);};m.customProgramCacheKey=()=>`cow-hide-${variant}-${seed}`;return m;}
function hide(geo){const c=geo.attributes.color,n=geo.attributes.normal;for(let i=0;i<c.count;i++){const ao=.98-.12*Math.max(0,-n.getY(i));c.setXYZ(i,ao,ao,ao);}return geo;}
export function createCow(o={}){const variant=o.variant||'patched',seed=o.seed??1,calf=!!(o.isCalf||o.calf);const root=new THREE.Group(),body=new THREE.Group();root.add(body);
 const coat=hideMaterial(variant,seed),face=material(COW_VARIANTS[variant]||COW_VARIANTS.brown),pink=material('#c89382'),dark=material('#37362e',true),horn=material('#decea1'),eye=material('#241f19',true),cream=material('#e9dfc4');
 const flat=COW_POLISH>=2;
 const blobs=flat?[[0,.99,-.12,.47,.38,.98,.13],[0,.98,-.67,.43,.37,.40,.13],[0,1.0,.49,.41,.39,.39,.13]]:[[0,.96,-.08,.5,.48,.94,.15]];
 const skin=new THREE.Mesh(hide(hull(blobs,[0,.99,-.1],seed,true),variant,seed),coat);body.add(skin);
 const head=new THREE.Group();head.position.set(0,1.12,.68);body.add(head);
 const hg=hull([[0,.02,.02,.245,.36,.30,.12],[0,.16,.26,.235,.29,.30,.14],[0,-.08,.53,.27,.17,.22,.15]],[0,.05,.23],seed);const headMat=variant==='patched'?hideMaterial(variant,seed+1):face;if(variant==='patched')hide(hg,variant,seed+1);head.add(new THREE.Mesh(hg,headMat));
 const muzzle=oval([.275,.135,.16],[0,-.08,.62],pink,head);const ears=[];
 for(const s of [-1,1]){oval([.045,.052,.025],[s*.185,.20,.448],face,head);oval([.032,.037,.026],[s*.19,.20,.465],eye,head);const ear=oval([.205,.036,.087],[s*.33,.25,.17],face,head);ear.rotation.z=s*.17;ears.push(ear);}
 if(COW_POLISH>=4){for(const s of [-1,1]){const no=oval([.045,.028,.013],[s*.125,-.05,.773],dark,head);no.rotation.z=s*.2;oval([.011,.012,.008],[s*.18,.214,.478],cream,head);}curve([[-.14,-.145,.74],[0,-.162,.774],[.14,-.145,.74]],.008,dark,head);}
 if(COW_POLISH>=5){for(const s of [-1,1]){const inner=oval([.139,.010,.052],[s*.35,.282,.177],pink,head);inner.rotation.z=s*.17;if(o.horns===false||calf)continue;const path=new THREE.CatmullRomCurve3([[s*.17,.36,.18],[s*.25,.47,.13],[s*.27,.58,.16]].map(p=>new THREE.Vector3(...p)));const g=new THREE.TubeGeometry(path,16,.045,10,false);const p=g.attributes.position;for(let i=0;i<p.count;i++){const t=Math.floor(i/11)/16,v=path.getPoint(t);p.setXYZ(i,v.x+(p.getX(i)-v.x)*(1-t*.9),v.y+(p.getY(i)-v.y)*(1-t*.9),v.z+(p.getZ(i)-v.z)*(1-t*.9));}g.computeVertexNormals();head.add(new THREE.Mesh(g,horn));}}
 const legs=[];for(const [x,z] of [[-.31,.53],[.31,.53],[-.32,-.7],[.32,-.7]]){const l=new THREE.Group();l.position.set(x,.68,z);body.add(l);const g=new THREE.CylinderGeometry(.10,.073,.59,12,3);g.translate(0,-.295,0);l.add(new THREE.Mesh(g,face));oval([.086,.07,.10],[0,-.60,.025],dark,l);legs.push(l);
 if(COW_POLISH>=7){oval([.079,.07,.083],[0,-.47,0],cream,l);curve([[0,-.645,.115],[0,-.59,.12]],.006,eye,l);}}
 const tail=new THREE.Group();tail.position.set(0,1.15,-1.02);body.add(tail);curve([[0,0,0],[.03,-.2,-.13],[.04,-.48,-.17]],.027,face,tail);oval([.065,.12,.05],[.04,-.51,-.17],dark,tail);
 let sc=(o.scale??1)*(calf?.62:1);root.scale.setScalar(sc);if(calf&&COW_POLISH>=8){head.scale.setScalar(1.24);head.position.z=.72;skin.scale.set(.93,1,.88);for(const l of legs)l.position.z*=.86;}
 root.traverse(m=>{if(m.isMesh){m.castShadow=true;m.receiveShadow=true;}});root.userData={body,head,skin,legs,tail,muzzle,ears,seed,t:seed*.61,weights:{idle:1,graze:0,walk:0,hop:0},calf,state:'idle'};return root;}
// Blended heavy four-beat performance; no randomness or allocations per frame.
export function updateCow(cow,state='idle',dt=1/60,speed=1){const d=cow.userData;dt=Math.min(.05,Math.max(0,dt));d.t+=dt;d.state=state;const t=d.t,w=d.weights;state=state==='startle'?'hop':state;for(const k in w)w[k]+=((k===state?1:0)-w[k])*(1-Math.exp(-dt*7));
 const phase=t*5.2*speed,a=Math.sin(phase),p=(t*.76)%1;let jump=0,squash=0,tuck=0;
 if(p<.22){squash=Math.sin(p/.22*Math.PI*.5);}else if(p<.78){const u=(p-.22)/.56;jump=Math.sin(u*Math.PI)*.40;tuck=Math.sin(u*Math.PI);}else{squash=Math.sin((p-.78)/.22*Math.PI)*.7;}
 d.body.position.y=w.walk*.022*Math.abs(a)+w.hop*(jump-squash*.045);d.body.rotation.set(w.walk*.018+w.hop*tuck*-.055,0,w.walk*a*.025);d.skin.scale.y=1+.008*Math.sin(t*1.4)-w.hop*squash*.065;
 d.head.rotation.set(w.graze*(1.08+Math.sin(t*8)*.018)+w.walk*.035*Math.sin(phase*2)-w.hop*tuck*.15,Math.sin(t*.5+d.seed)*.08,Math.sin(t*1.1)*.018);d.head.position.y=1.12-w.graze*.36;d.head.position.z=(d.calf?.72:.68)+w.graze*.10;
 d.muzzle.scale.y=1+w.graze*Math.sin(t*8)*.035;
 d.legs.forEach((l,i)=>{l.rotation.x=w.walk*a*(i===0||i===3?1:-1)*.32+w.hop*tuck*(i<2?-.48:.42);l.scale.y=1-w.hop*(squash*.067+tuck*.06);});d.tail.rotation.set(w.hop*tuck*.4,Math.sin(t*1.4)*.12,Math.sin(t*1.7)*.20);d.ears.forEach((e,i)=>e.rotation.z=(i===0?-1:1)*.17+Math.max(0,Math.sin(t*2.1+i*2+d.seed)-.94)*2);
 return cow;
}
