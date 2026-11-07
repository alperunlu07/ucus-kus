// Kağıt Kuş — continuous felt-hide cows. +Z forward, soles at Y=0.
import * as THREE from 'three';
import {makeFeltMaterial} from './sheepModel.js';
export const COW_POLISH=20;
export const COW_VARIANTS={brown:'#946346',black:'#343735',cream:'#e5cf9e',patched:'#eee5d2'};
const white=new THREE.Color('#f1e7cf');
const smooth=(a,b,k)=>{const h=Math.max(k-Math.abs(a-b),0)/k;return Math.min(a,b)-h*h*k*.25;};
function ell(q,x,y,z){return (Math.hypot((x-q[0])/q[3],(y-q[1])/q[4],(z-q[2])/q[5])-1)*Math.min(q[3],q[4],q[5]);}
// Ray-solve a smooth union, welded indexed latitude rings: ONE hide, not balls.
function hull(blobs,origin,seed=1,body=false){const P=[],I=[],C=[],nu=112,nv=72;
 const sdf=(x,y,z)=>{let d=100;for(let k=0;k<blobs.length;k++){const q=blobs[k];let e=ell(q,x,y,z);if(body&&COW_POLISH>=3&&k===0){const n=2.65;e=(Math.pow(Math.pow(Math.abs((x-q[0])/q[3]),n)+Math.pow(Math.abs((y-q[1])/q[4]),n)+Math.pow(Math.abs((z-q[2])/q[5]),n),1/n)-1)*.38;}d=smooth(d,e,q[6]||.12);}return d;};
 for(let j=0;j<=nv;j++){const v=j/nv*Math.PI;for(let i=0;i<=nu;i++){const u=i/nu*Math.PI*2,dx=Math.sin(v)*Math.cos(u),dy=Math.cos(v),dz=Math.sin(v)*Math.sin(u);let lo=0,hi=2.8;
 for(let n=0;n<25;n++){const r=(lo+hi)/2;if(sdf(origin[0]+dx*r,origin[1]+dy*r,origin[2]+dz*r)<0)lo=r;else hi=r;}
 const grain=COW_POLISH>=3?1+.0018*Math.sin(dx*19+seed)*Math.sin(dz*23)*Math.cos(dy*17):1;
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
function hideMaterial(variant,seed,isHead=false){const m=makeFeltMaterial('#ffffff',variant==='black');const compile=m.onBeforeCompile,base=new THREE.Color(COW_VARIANTS[variant]||COW_VARIANTS.brown),ink=new THREE.Color('#353831');const rgb=c=>`vec3(${c.r.toFixed(6)},${c.g.toFixed(6)},${c.b.toFixed(6)})`;
 // Asymmetric soft-edged islands dyed into the same surface; no raised patches.
 const shift=Math.sin(seed*2.31)*.12;
 const spots=isHead?[[.20,.28,.16,.20,.22,.22],[-.21,.09,.19,.16,.22,.23]]:[[.43,1.01,-.55+shift,.30,.42,.36],[-.43,1.07,-.36-shift,.27,.42,.38],[.37,.91,.39+shift,.26,.32,.29],[-.40,.92,.52-shift,.26,.34,.25],[.06,1.34,-.19+shift,.27,.15,.32]];
 const field=spots.map(q=>`(length((hp-vec3(${q.slice(0,3).map(v=>v.toFixed(4)).join(',')}))/vec3(${q.slice(3).map(v=>v.toFixed(4)).join(',')}))-1.0)`).reduce((a,b)=>a?`min(${a},${b})`:b,'');
 m.onBeforeCompile=sh=>{compile(sh);const other=variant==='patched'?ink:white,cut=variant==='patched'?.12:variant==='brown'?-.38:-.65;
 sh.fragmentShader=sh.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
 vec3 hp=vFeltPosition;float edge=${field};edge+=.105*sin(hp.z*19.0+hp.y*8.0+${seed.toFixed(2)})*sin(hp.x*16.0-hp.y*11.0);float aa=max(.009,fwidth(edge)*.8);float dye=${variant==='cream'?'0.0':`1.0-smoothstep(${cut.toFixed(3)}-aa,${cut.toFixed(3)}+aa,edge)`};diffuseColor.rgb*=mix(${rgb(base)},${rgb(other)},dye);diffuseColor.rgb*=mix(vec3(.96,.945,.92),vec3(1.0),smoothstep(.4,1.05,hp.y));`);};m.customProgramCacheKey=()=>`cow-hide-12-${variant}-${seed}-${isHead}`;return m;}

function hide(geo){const c=geo.attributes.color,n=geo.attributes.normal;for(let i=0;i<c.count;i++){const ao=.98-.12*Math.max(0,-n.getY(i));c.setXYZ(i,ao,ao,ao);}return geo;}
export function createCow(o={}){const variant=o.variant||'patched',seed=o.seed??1,calf=!!(o.isCalf||o.calf);const root=new THREE.Group(),body=new THREE.Group();root.add(body);
 const coat=hideMaterial(variant,seed),face=material(COW_VARIANTS[variant]||COW_VARIANTS.brown),pink=material('#c89382'),dark=material('#37362e',true),horn=material('#decea1'),eye=material('#241f19',true),cream=material('#e9dfc4');
 const flat=COW_POLISH>=2;
 const blobs=flat?[[0,.99,-.12,.47,.38,.98,.13],[0,.98,-.67,.43,.37,.40,.13],[0,1.02,.47,.405,.385,.43,.18],[0,.85,.65,.285,.30,.30,.20],[0,.76,.63,.17,.19,.27,.18]]:[[0,.96,-.08,.5,.48,.94,.15]];
 const skin=new THREE.Mesh(hide(hull(blobs,[0,.99,-.1],seed,true),variant,seed),coat);body.add(skin);
 const head=new THREE.Group();head.position.set(0,1.12,.68);body.add(head);
 const hg=hull([[0,.02,.02,.245,.36,.30,.12],[0,.16,.26,.235,.29,.30,.14],[0,-.08,.53,.27,.17,.22,.15],[0,.29,.14,.17,.16,.19,.17]],[0,.05,.23],seed);const headMat=variant==='patched'?hideMaterial(variant,seed+1,true):face;if(variant==='patched')hide(hg,variant,seed+1);head.add(new THREE.Mesh(hg,headMat));
 const muzzle=oval([.282,.142,.175],[0,-.08,.615],pink,head);const ears=[],eyes=[];
 for(const s of [-1,1]){
  oval([.037,.044,.036],[s*.218,.19,.354],material('#b5a68b'),head);
  const eyeball=oval([.028,.035,.03],[s*.239,.19,.372],eye,head);eyes.push(eyeball);
  oval([.008,.009,.006],[s*.012,.014,.021],cream,eyeball);
  const ear=new THREE.Group();ear.position.set(s*.22,.25,.17);ear.rotation.z=s*.17;head.add(ear);
  oval([.205,.034,.091],[s*.12,0,0],face,ear);
  oval([.145,.010,.057],[s*.13,.027,.002],pink,ear);ears.push(ear);
  // Flush warm rim and dark nostril inset, rather than black beads.
  const rim=oval([.047,.031,.009],[s*.125,-.045,.778],material('#b57e70'),head);rim.rotation.z=s*.22;
  const no=oval([.034,.021,.009],[s*.125,-.044,.785],dark,head);no.rotation.z=s*.22;
 }
 curve([[-.145,-.151,.736],[0,-.166,.768],[.145,-.151,.736]],.0055,material('#825f50'),head);
 if(COW_POLISH>=5){for(const s of [-1,1]){if(o.horns===false||calf)continue;
 const path=new THREE.CatmullRomCurve3([[s*.17,.35,.16],[s*.27,.43,.12],[s*.31,.54,.17],[s*.275,.61,.23]].map(p=>new THREE.Vector3(...p)));
 const g=new THREE.TubeGeometry(path,24,.047,12,false),p=g.attributes.position,C=[];
 for(let i=0;i<p.count;i++){const t=Math.floor(i/13)/24,v=path.getPoint(t),taper=Math.pow(1-t,.78)*.96+.025;p.setXYZ(i,v.x+(p.getX(i)-v.x)*taper,v.y+(p.getY(i)-v.y)*taper,v.z+(p.getZ(i)-v.z)*taper);const tip=new THREE.Color('#e5d6ad').lerp(new THREE.Color('#9c895f'),Math.pow(t,4)*.5);C.push(tip.r,tip.g,tip.b);}
 g.setAttribute('color',new THREE.Float32BufferAttribute(C,3));g.computeVertexNormals();const hm=material('#ffffff');hm.vertexColors=true;head.add(new THREE.Mesh(g,hm));}}
 const legs=[];for(const [x,z] of [[-.31,.53],[.31,.53],[-.32,-.7],[.32,-.7]]){const l=new THREE.Group();l.position.set(x,.68,z);body.add(l);
 // Continuous tapered shank, its upper ring buried into shoulder/haunch.
 const profile=[[.065,-.565],[.068,-.47],[.075,-.36],[.088,-.25],[.098,-.12],[.125,.035],[.128,.28]].map(([r,y])=>new THREE.Vector2(r,y));
 const lg=new THREE.LatheGeometry(profile,20),lp=lg.attributes.position;for(let i=0;i<lp.count;i++){const y=lp.getY(i);lp.setZ(i,lp.getZ(i)+(z<0?-.035:.015)*Math.sin((y+.565)/.735*Math.PI));}lg.computeVertexNormals();l.add(new THREE.Mesh(lg,face));
 const hoof=oval([.098,.074,.131],[0,-.602,.031],dark,l),hp=hoof.geometry.attributes.position;
 for(let i=0;i<hp.count;i++)hp.setY(i,Math.max(hp.getY(i),-.070));hoof.geometry.computeVertexNormals();
 curve([[0,-.667,.085],[0,-.632,.157],[0,-.589,.156]],.0045,eye,l);legs.push(l);
 }
 // Small adult-only udder, mostly buried under the rear belly; never on calves.
 if(!calf&&o.udder!==false){const um=material('#cda995');oval([.185,.115,.21],[0,.585,-.47],um,body);for(const x of [-.078,.078])for(const z of [-.54,-.39])oval([.024,.037,.025],[x,.478,z],um,body);}
 const tail=new THREE.Group();tail.position.set(0,1.15,-1.02);body.add(tail);
 curve([[0,0,0],[.025,-.14,-.10],[.04,-.28,-.15]],.025,face,tail);
 const tailTip=new THREE.Group();tailTip.position.set(.04,-.28,-.15);tail.add(tailTip);
 curve([[0,0,0],[.01,-.11,-.025],[.025,-.22,-.01]],.021,face,tailTip);
 const tuft=oval([.06,.115,.044],[.025,-.255,-.01],dark,tailTip),tp=tuft.geometry.attributes.position;
 for(let i=0;i<tp.count;i++){const y=tp.getY(i);tp.setX(i,tp.getX(i)*(1+y*2.2));}tuft.geometry.computeVertexNormals();
 let sc=(o.scale??1)*(calf?.62:1);root.scale.setScalar(sc);if(calf&&COW_POLISH>=8){head.scale.set(1.20,1.18,1.12);head.position.z=.65;skin.scale.set(.94,.94,.83);skin.position.y=.06;muzzle.scale.x=.94;tail.position.z=-.88;tail.scale.setScalar(.80);for(const e of ears)e.scale.setScalar(1.08);for(const l of legs){l.position.z*=.82;l.position.x*=.9;l.scale.x=l.scale.z=.86;}}
 for(const l of legs)l.userData.baseZ=l.position.z;
 root.traverse(m=>{if(m.isMesh){m.castShadow=true;m.receiveShadow=true;}});root.userData={body,head,skin,legs,tail,tailTip,muzzle,ears,eyes,seed,t:seed*.61,weights:{idle:1,graze:0,walk:0,hop:0},calf,state:'idle'};return root;}
const FOOT_PHASE=[0,Math.PI,Math.PI*.5,Math.PI*1.5];
// Blended heavy four-beat performance; no randomness or allocations per frame.
export function updateCow(cow,state='idle',dt=1/60,speed=1){const d=cow.userData;dt=Math.min(.05,Math.max(0,dt));d.t+=dt;d.state=state;const t=d.t,w=d.weights;state=state==='startle'?'hop':state;for(const k in w)w[k]+=((k===state?1:0)-w[k])*(1-Math.exp(-dt*7));
 const phase=t*5.2*speed,a=Math.sin(phase),p=(t*.76)%1;let jump=0,squash=0,tuck=0;
 if(p<.22){squash=Math.sin(p/.22*Math.PI*.5);}else if(p<.78){const u=(p-.22)/.56;jump=Math.sin(u*Math.PI)*.40;tuck=Math.sin(u*Math.PI);}else{squash=Math.sin((p-.78)/.22*Math.PI)*.7;}
 d.body.position.y=w.walk*.008*Math.abs(a)+w.hop*(jump-squash*.045);d.body.rotation.set(w.walk*.008+w.hop*tuck*-.055,0,w.walk*a*.010);d.skin.scale.y=(d.calf?.94:1)+.008*Math.sin(t*1.4)-w.hop*squash*.065;
 d.head.rotation.set(w.graze*(1.16+Math.sin(t*7.6)*.012)+w.walk*.035*Math.sin(phase*2)-w.hop*tuck*.15,Math.sin(t*.5+d.seed)*.08,Math.sin(t*1.1)*.018);d.head.position.y=1.12-w.graze*.31;d.head.position.z=(d.calf?.65:.68)+w.graze*.10;
 const chew=w.graze*Math.sin(t*7.6);d.muzzle.scale.y=1+chew*.026;d.muzzle.position.x=chew*.006;
 const blinkPhase=(t+d.seed*.37)%4.7,blink=blinkPhase<.16?Math.sin(blinkPhase/.16*Math.PI):0;for(const e of d.eyes)e.scale.y=1-blink*.94;
 d.legs.forEach((l,i)=>{const step=phase+FOOT_PHASE[i],swing=Math.max(0,Math.cos(step)),angle=w.walk*Math.sin(step)*.28+w.graze*(i<2?-.04:.015)+w.hop*tuck*(i<2?-.48:.42);
 l.rotation.x=angle;l.scale.y=1-w.hop*(squash*.067+tuck*.06);
 // Sole projection compensation, not IK: counter tilt penetration, then lift swing.
 l.position.y=.68+w.walk*(.672*Math.cos(angle)+.165*Math.abs(Math.sin(angle))-.672+swing*swing*.065+.012);
 l.position.z=l.userData.baseZ+w.graze*(i<2?.035:-.015);
 });const swish=Math.pow(Math.max(0,Math.sin(t*.73+d.seed)),6);d.tail.rotation.set(w.hop*tuck*.4,Math.sin(t*1.4)*.12,Math.sin(t*1.7)*.13+swish*.45);d.tailTip.rotation.z=Math.sin(t*1.7-.65)*.17+swish*.23;d.tailTip.rotation.x=Math.sin(t*1.1)*.08;d.ears.forEach((e,i)=>e.rotation.z=(i===0?-1:1)*.17+Math.max(0,Math.sin(t*2.1+i*2+d.seed)-.94)*2);
 return cow;
}
