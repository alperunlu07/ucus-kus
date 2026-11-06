// Kağıt Kuş — keçe/pamuk yumağı koyun (ön +Z, yukarı +Y, ayak tabanı y=0, ~1.5 boy)
import * as THREE from 'three';
export const WOOL={krem:'#f6f1e6',beyaz:'#fbf7ee',kahve:'#6e5646',kara:'#3a322d',pembe:'#efc4c8'};
function rng(s){s=(s>>>0)||1;return()=>((s=Math.imul(s^s>>>15,1|s)+0x6d2b79f5|0,((s^s>>>14)>>>0)/4294967296));}
// merge non-indexed geometries, optional vertex color per part
export function merge(parts){let n=0;const gs=parts.map(([g,c])=>{const x=g.index?g.toNonIndexed():g;n+=x.attributes.position.count;return[x,c];});
 const P=new Float32Array(n*3),N=new Float32Array(n*3),Cc=new Float32Array(n*3);let o=0;
 for(const[g,c]of gs){const k=g.attributes.position.count;P.set(g.attributes.position.array,o*3);N.set(g.attributes.normal.array,o*3);const col=new THREE.Color(c||'#fff');for(let i=0;i<k;i++)col.toArray(Cc,(o+i)*3);o+=k;}
 const m=new THREE.BufferGeometry();m.setAttribute('position',new THREE.BufferAttribute(P,3));m.setAttribute('normal',new THREE.BufferAttribute(N,3));m.setAttribute('color',new THREE.BufferAttribute(Cc,3));m.computeBoundingSphere();return m;}
function lumpy(r,seed,det=1){const g=new THREE.IcosahedronGeometry(r,det);const p=g.attributes.position,R=rng(seed);const cache={};
 for(let i=0;i<p.count;i++){const k=p.getX(i).toFixed(3)+p.getY(i).toFixed(3)+p.getZ(i).toFixed(3);const f=cache[k]??(cache[k]=.9+R()*.2);p.setXYZ(i,p.getX(i)*f,p.getY(i)*f,p.getZ(i)*f);}
 const nn=g.attributes.normal;for(let i=0;i<p.count;i++){const v=new THREE.Vector3(p.getX(i),p.getY(i),p.getZ(i)).normalize();nn.setXYZ(i,v.x,v.y,v.z);}return g;}
// wool fleece: flattened core + overlapping clumps (seeded), + forelock tuft over the face
export function woolGeo(seed=1,max=14,lamb=false,legs=null){const R=rng(seed*977+3);const parts=[];const cy=.52,rx=.46,ry=.31,rz=.62;
 const core=lumpy(1,seed,1);core.scale(rx,ry,rz);core.translate(0,cy,0);parts.push([core]);
 const n=Math.min(max,12+Math.floor(R()*5));
 for(let i=0;i<n;i++){const a=i/n*Math.PI*2+R()*.4,up=.15+R()*.75;const r=.17+R()*.1;
  const x=Math.cos(a)*rx*.82*Math.sqrt(1-up*up*.5),z=Math.sin(a)*rz*.85*Math.sqrt(1-up*up*.5),y=cy-.08+up*ry*.9;
  const g=lumpy(r,seed*31+i,1);g.scale(1,.85,1);g.translate(x,y,z);parts.push([g]);}
 for(let i=0;i<3;i++){const g=lumpy(.22+R()*.05,seed*7+i,1);g.translate((i-1)*.2+(R()-.5)*.06,cy+ry*.9,(R()-.5)*.4);parts.push([g]);}
 const t=lumpy(.15,seed+5,1);t.translate(0,cy+.16,rz*.82);parts.push([t]);// forelock
 const tail=lumpy(.11,seed+9,1);tail.translate(0,cy+.05,-rz-.05);parts.push([tail]);
 if(lamb){for(const[g]of parts){g.translate(0,-cy,0);g.scale(1,1,.9);g.translate(0,cy,0);}}
 if(legs)for(const q of LEGS){const g=LEG.clone();g.translate(...q);parts.push([g,legs]);}
 return merge(parts);}
// legs (dark) separate so they can step
export const LEG=(()=>{const g=new THREE.CylinderGeometry(.06,.05,.3,6);g.translate(0,-.15,0);return g;})();
export const LEGS=[[.19,.3,.3],[-.19,.3,.3],[.19,.3,-.3],[-.19,.3,-.3]];
// head: pivot at neck (0,.62,.48); black face, ears, pale eye-dots, muzzle
export const HEAD_PIVOT=[0,.54,.53];
export function headGeo(face='#2d2724'){const parts=[];
 const h=lumpy(1,77,1);h.scale(.16,.155,.22);h.translate(0,-.02,.24);parts.push([h,face]);
 const mz=new THREE.IcosahedronGeometry(1,1);mz.scale(.1,.09,.08);mz.translate(0,-.07,.4);parts.push([mz,face]);
 for(const s of[-1,1]){const e=new THREE.IcosahedronGeometry(1,1);e.scale(.13,.035,.06);e.rotateZ(s*-.35);e.translate(s*.17,.05,.18);parts.push([e,face]);
  const ey=new THREE.IcosahedronGeometry(.028,0);ey.translate(s*.085,.04,.36);parts.push([ey,'#f3ead8']);}
 return merge(parts);}
export function legsGeo(face='#2d2724'){return merge(LEGS.map(p=>{const g=LEG.clone();g.translate(...p);return[g,face];}));}
const _hg={};export function sharedHead(face){return _hg[face]||(_hg[face]=headGeo(face));}
const _wg={};export function sharedWool(seed,lamb){const k=seed+'_'+lamb;return _wg[k]||(_wg[k]=woolGeo(seed,16,lamb));}
export function createSheep(o={}){const seed=o.seed??1,face=o.faceColor||'#2d2724';
 const woolMat=new THREE.MeshLambertMaterial({color:o.woolColor||WOOL.krem,vertexColors:true});const dark=new THREE.MeshLambertMaterial({vertexColors:true});
 const g=new THREE.Group(),body=new THREE.Group();g.add(body);
 const wool=new THREE.Mesh(sharedWool(seed%6,!!o.isLamb),woolMat);body.add(wool);
 const head=new THREE.Group();head.position.set(...HEAD_PIVOT);head.add(new THREE.Mesh(sharedHead(face),dark));body.add(head);
 const legs=LEGS.map(p=>{const l=new THREE.Mesh(LEG,new THREE.MeshLambertMaterial({color:face}));l.position.set(...p);g.add(l);return l;});
 g.traverse(m=>{if(m.isMesh){m.castShadow=true;m.receiveShadow=true;}});
 const s=(o.scale||1)*(o.isLamb?.68:1);g.scale.setScalar(s);if(o.isLamb){head.scale.setScalar(1.25);}
 g.userData={body,head,legs,wool,woolMat,t:Math.random()*9,state:'idle',hop:0,chew:0};return g;}
export function setWool(sh,c){sh.userData.woolMat.color.set(c);}
// state: idle | graze | walk | hop
export function updateSheep(sh,state,dt){const u=sh.userData;u.t+=dt;const t=u.t;u.state=state;
 const k=Math.min(1,dt*6);const L=(a,b)=>a+(b-a)*k;
 let pitch=0,bob=0,roll=0,legA=0,sq=1;
 if(state==='idle'){bob=Math.sin(t*1.6)*.01;sq=1+Math.sin(t*1.6)*.015;pitch=Math.sin(t*.5)*.08-.05;}
 else if(state==='graze'){pitch=.85+Math.sin(t*9)*.05*(Math.sin(t*.7)>0?1:0);sq=1+Math.sin(t*1.4)*.012;}
 else if(state==='walk'){const w=t*7;legA=Math.sin(w)*.5;bob=Math.abs(Math.sin(w))*.035;roll=Math.sin(w)*.06;pitch=.1+Math.sin(w*2)*.04;sq=1+Math.sin(w*2)*.03;}
 else if(state==='hop'){u.hop+=dt*4.5;const p=u.hop%1;bob=Math.sin(p*Math.PI)*.45;sq=p<.1||p>.9?.88:1.06;legA=p<.5?-.5:.4;pitch=-.15;}
 if(state!=='hop')u.hop=0;
 u.body.position.y=L(u.body.position.y,bob);u.body.rotation.z=L(u.body.rotation.z,roll);u.wool.scale.set(L(u.wool.scale.x,2-sq),L(u.wool.scale.y,sq),u.wool.scale.z);
 u.head.rotation.x=L(u.head.rotation.x,pitch);
 u.legs.forEach((l,i)=>{const s=(i===0||i===3)?1:-1;l.rotation.x=L(l.rotation.x,state==='hop'?legA*(i<2?1:-1):legA*s);l.position.y=LEGS[i][1]+u.body.position.y*(state==='hop'?1:.3);});}
