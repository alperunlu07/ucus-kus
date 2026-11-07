// Kağıt Kuş · cotton clouds. Standalone; no game material or ground injector.
import * as THREE from 'three';
const POLISH = 10;
function smin(a,b,k){const h=Math.max(k-Math.abs(a-b),0)/k;return Math.min(a,b)-h*h*k*.25;}
function field(bl,x,y,z){let d=99;for(const q of bl){const a=(x-q[0])/q[3],b=(y-q[1])/q[4],c=(z-q[2])/q[5];d=smin(d,(Math.sqrt(a*a+b*b+c*c)-1)*Math.min(q[3],q[4],q[5]),.40);}return d+.0055*Math.sin(x*10.3+y*3.2)*Math.sin(y*9.1-z*4.7)*Math.cos(z*10.6+x*2.3);}
function geometry(kind,seed){
 const cfg={puff:[1.05,.88,.88],bank:[1.95,1.05,1.08],wide:[2.85,1.12,1.32]}[kind]||[2,.72,1.05];
 const [rx,ry,rz]=cfg;
 const bl=[[0,-.05,0,rx*.94,ry*.53,rz*.96],[-rx*.56,.05,.04,rx*.48,ry*.79,rz*.78],[rx*.56,.02,-.08,rx*.47,ry*.77,rz*.76],[rx*.04,ry*.42,-rz*.07,rx*.31,ry*1.12,rz*.78]];
 if(kind==='puff'){bl[3]=[-.12,.50,-.04,.65,.83,.66];}
 if(kind==='bank')bl.push([-rx*.29,ry*.74,-rz*.16,rx*.32,ry*.74,rz*.61]);
 if(kind==='wide'){
  bl.push([-rx*.30,ry*.69,-rz*.18,rx*.30,ry*.81,rz*.58]);
  bl.push([rx*.28,ry*.51,rz*.04,rx*.29,ry*.70,rz*.68]);
 }
 // Buried lobe contributors become gentle hills in ONE surface, never meshes.
 for(let j=0;j<7;j++){const a=j*2.39996+seed*.37;const h=.28+.19*Math.sin(j*1.91+seed);bl.push([Math.cos(a)*rx*.59,ry*h,Math.sin(a)*rz*.57,rx*(.28+.035*Math.sin(j)),ry*(.75+.13*Math.cos(j*1.4)),rz*.48]);}
 const g=new THREE.SphereGeometry(1,112,72),p=g.attributes.position;
 for(let i=0;i<p.count;i++){
  const dx=p.getX(i),dy=p.getY(i),dz=p.getZ(i);let lo=0,hi=6;
  for(let j=0;j<25;j++){const r=(lo+hi)/2;if(field(bl,dx*r,dy*r,dz*r)<0)lo=r;else hi=r;}
  p.setXYZ(i,dx*lo,dy*lo,dz*lo);
 }
 // Gradient normals remain identical on the UV seam and pole duplicates.
 const n=g.attributes.normal,e=.001;
 for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);const v=new THREE.Vector3(field(bl,x+e,y,z)-field(bl,x-e,y,z),field(bl,x,y+e,z)-field(bl,x,y-e,z),field(bl,x,y,z+e)-field(bl,x,y,z-e)).normalize();n.setXYZ(i,v.x,v.y,v.z);}
 g.computeBoundingSphere();return g;
}
function cottonMaterial(){
 const m=new THREE.MeshStandardMaterial({color:'#fffdf5',roughness:1,metalness:0,alphaToCoverage:true});
 m.userData.cloudUniforms={uCloudPart:{value:0}};
 m.onBeforeCompile=s=>{
 Object.assign(s.uniforms,m.userData.cloudUniforms);
 s.vertexShader='uniform float uCloudPart; varying vec3 vCotton;\n'+s.vertexShader;
 s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvCotton=position; transformed.x+=uCloudPart*.30*position.x/sqrt(position.x*position.x+.10); transformed.y*=1.-uCloudPart*.10;');
 s.fragmentShader=`uniform float uCloudPart; varying vec3 vCotton;
 float hashCotton(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
 float cottonNoise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hashCotton(i),hashCotton(i+vec3(1,0,0)),f.x),mix(hashCotton(i+vec3(0,1,0)),hashCotton(i+vec3(1,1,0)),f.x),f.y),mix(mix(hashCotton(i+vec3(0,0,1)),hashCotton(i+vec3(1,0,1)),f.x),mix(hashCotton(i+vec3(0,1,1)),hashCotton(i+vec3(1,1,1)),f.x),f.y),f.z);}
 `+s.fragmentShader;
 s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
 vec3 cp=vCotton*95.;float aa=1.-smoothstep(.3,1.5,length(fwidth(cp)));
 float grain=cottonNoise(cp)-.5;float nap=cottonNoise(vCotton*24.)-.5;
 diffuseColor.rgb*=.98+nap*.10+grain*.17*aa;
 float under=1.-smoothstep(-.50,.30,vCotton.y);
 diffuseColor.rgb*=mix(vec3(1.),vec3(.84,.88,.91),under*.45);
 `);
 s.fragmentShader=s.fragmentShader.replace('#include <opaque_fragment>',`float silver=pow(1.-clamp(dot(normal,geometryViewDir),0.,1.),3.);outgoingLight+=vec3(.93,.96,1.)*silver*.045;diffuseColor.a=(1.-silver*.16)*(1.-uCloudPart*.96*exp(-vCotton.x*vCotton.x/.38));\n#include <opaque_fragment>`);
 };
 m.customProgramCacheKey=()=> 'cloud-cotton-'+POLISH;
 return m;
}
export function createCloud({kind='bank',seed=7,scale=1}={}){
 const c=new THREE.Group();const surface=new THREE.Mesh(geometry(kind,seed),cottonMaterial());c.add(surface);c.scale.setScalar(scale);c.userData={kind,seed,scale,surface,t:0,polish:POLISH};return c;
}
export function updateCloud(cloud,dt,action='idle'){
 const u=cloud.userData;u.t+=Math.min(Math.max(dt,0),.1);
 const t=u.t,phase=u.seed*.67;
 const breath=Math.sin(t*.64+phase);
 u.surface.scale.set(1+breath*.005,1+breath*.011,1-breath*.003);
 u.surface.position.y=Math.sin(t*.43+phase)*.018;
 if(u.action!==action){u.action=action;u.actionTime=0;}
 u.actionTime=(u.actionTime||0)+Math.min(Math.max(dt,0),.1);
 const at=u.actionTime;
 u.surface.position.x=action==='drift'?.65*Math.sin(at*.24):0;
 const cycle=at%6.6;
 const p=action==='part'&&cycle<4.4?Math.pow(Math.sin(Math.PI*cycle/4.4),2):0;
 u.surface.material.userData.cloudUniforms.uCloudPart.value=p;
 u.part=p;
}
