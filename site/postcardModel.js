// Paper collectible. Origin is the card centre; front faces +Z, top +Y.
// Geometry is 3.6 × 2.4, ~0.045 thick. Parent owns hover height and ground shadow.
import * as THREE from 'three';
export const POSTCARD_MOTIFS=['sheep','balloon','lighthouse','boat'];
const titles={sheep:'KIRDAN SELAM',balloon:'RÜZGÂRIN PEŞİNDE',lighthouse:'KIYIDA BİR IŞIK',boat:'MAVİYE DOĞRU'};
function texture(motif,back,seed){
 const c=document.createElement('canvas');c.width=1200;c.height=800;const x=c.getContext('2d');
 const rect=(a,b,w,h,col)=>{x.fillStyle=col;x.fillRect(a,b,w,h)};
 const ellipse=(a,b,r,s,col)=>{x.fillStyle=col;x.beginPath();x.ellipse(a,b,r,s,0,0,Math.PI*2);x.fill()};
 const path=(pts,col)=>{x.fillStyle=col;x.beginPath();pts.forEach(([a,b],i)=>i?x.lineTo(a,b):x.moveTo(a,b));x.closePath();x.fill()};
 const line=(pts,col,w=3)=>{x.strokeStyle=col;x.lineWidth=w;x.beginPath();pts.forEach(([a,b],i)=>i?x.lineTo(a,b):x.moveTo(a,b));x.stroke()};
 rect(0,0,1200,800,'#f5ecd7');
 if(!back){
 rect(51,48,1098,621,'#c5d5cd');x.save();x.beginPath();x.rect(51,48,1098,621);x.clip();ellipse(946,170,64,64,'#e7b775');
 // printed wisps, not clouds made of geometry
 for(const [a,b] of [[230,160],[680,220]]){ellipse(a,b,89,19,'#e7e7d6');ellipse(a-25,b-14,44,24,'#e7e7d6')}
 if(motif==='sheep'){
 path([[51,448],[220,342],[445,413],[720,320],[1149,422],[1149,669],[51,669]],'#9faa7a');
 path([[51,550],[330,459],[540,504],[840,441],[1149,535],[1149,669],[51,669]],'#6f8c68');
 path([[650,669],[718,552],[865,491],[790,567],[760,669]],'#c3ba8d');
 for(const [a,b,s] of [[490,485,1],[272,540,.6],[935,520,.46]]){x.save();x.translate(a,b);x.scale(s,s);line([[-50,5],[-55,77]],'#67584a',13);line([[57,8],[63,75]],'#67584a',13);ellipse(0,0,110,62,'#e9e4ce');for(let i=0;i<9;i++)ellipse(Math.cos(i*1.4)*65,Math.sin(i*1.4)*32,39,30,'#f4efdd');x.strokeStyle='rgba(165,153,116,.28)';x.lineWidth=2;for(const [a,b] of [[-44,-18],[-6,-27],[36,-13],[-25,17],[22,22]]){x.beginPath();x.arc(a,b,15,.2,2.2);x.stroke()}ellipse(97,5,34,44,'#6d6254');ellipse(116,-25,26,10,'#6d6254');ellipse(108,0,4,4,'#f8ecd6');x.restore()}
 for(let i=0;i<28;i++){let a=80+(i*137)%1050,b=570+(i*47)%83;line([[a,b+12],[a+2,b-6]],'#b7c08b',2);ellipse(a+2,b-9,4,5,i%2?'#e6c77a':'#e6d8ba')}
 } else if(motif==='balloon'){
 path([[51,530],[315,425],[565,499],[900,407],[1149,512],[1149,669],[51,669]],'#98a47d');path([[51,603],[350,535],[690,603],[1149,535],[1149,669],[51,669]],'#6c8d70');
 for(const [a,b,s,col] of [[620,289,1,'#bf795e'],[278,360,.43,'#d6b16b'],[976,392,.36,'#839c91']]){x.save();x.translate(a,b);x.scale(s,s);ellipse(0,0,142,167,col);x.save();x.beginPath();x.ellipse(0,0,142,167,0,0,Math.PI*2);x.clip();ellipse(0,0,65,169,'#e9ce95');x.strokeStyle='rgba(116,88,57,.32)';x.lineWidth=2;for(const rx of [65,111]){x.beginPath();x.ellipse(0,0,rx,169,0,0,Math.PI*2);x.stroke()}line([[-142,47],[142,47]],'#a46e52',10);x.restore();path([[-63,140],[63,140],[29,192],[-29,192]],col);line([[-29,192],[-23,220],[23,220],[29,192]],'#6f6651',5);rect(-30,216,60,41,'#a88356');line([[-30,225],[30,225]],'#d8b880',5);x.restore()}
 } else {
 rect(51,425,1098,244,'#8cafa7');
 for(let i=0;i<14;i++)line([[80+(i*113)%1030,460+i*13],[150+(i*113)%1030,460+i*13]],'#c3d2ba',3);
 if(motif==='lighthouse'){
 path([[180,669],[330,550],[600,523],[763,614],[834,669]],'#9a9a78');path([[292,599],[354,527],[632,534],[736,607]],'#b8b58c');
 path([[450,536],[475,224],[557,224],[584,536]],'#f1e5c8');path([[464,376],[568,376],[573,419],[460,419]],'#b67d66');rect(467,222,99,64,'#657f75');rect(477,231,79,39,'#e4bd6d');line([[516,230],[516,272]],'#64776b',7);path([[454,222],[516,176],[579,222]],'#a86e56');rect(449,282,134,14,'#7d8774');rect(505,466,28,70,'#6d7b69');rect(505,330,19,28,'#6d7b69');path([[310,600],[343,577],[371,603]],'#838d74');path([[649,604],[678,582],[710,613]],'#838d74');for(const [a,b] of [[755,300],[864,274],[817,331]]){line([[a-17,b],[a,b+7],[a+17,b-2]],'#788e81',3)}line([[439,282],[592,282]],'#626e61',5);
 }else{
 path([[348,511],[830,511],[749,590],[448,590]],'#9e6e51');path([[348,511],[830,511],[790,536],[390,536]],'#d6ae79');line([[596,257],[596,519]],'#766b52',9);path([[579,276],[423,482],[579,482]],'#f3e3bc');path([[611,302],[611,479],[773,479]],'#ca8a6d');line([[380,608],[797,608]],'#d5d7bb',5);line([[427,552],[784,552]],'#bb9167',3);line([[446,568],[765,568]],'#bb9167',2);line([[596,270],[773,479]],'#e6d3ac',2);ellipse(590,630,172,7,'rgba(72,113,107,.15)');
 }
 }
 x.restore();
 // caption band and thin decorative print rule
 x.strokeStyle='#9c9d7d';x.lineWidth=2;x.strokeRect(39,36,1122,645);
 x.textAlign='center';x.fillStyle='#666b54';x.font='500 31px Georgia,serif';x.fillText(titles[motif],600,730);
 line([[110,724],[286,724]],'#b4b091',1.5);line([[914,724],[1090,724]],'#b4b091',1.5);
 x.font='14px Georgia,serif';x.fillStyle='#9a967e';x.fillText('K A Ğ I T   K U Ş   /   Y O L C U L U K   N O T L A R I',600,766);
 }else{
 x.fillStyle='#7b8069';x.font='27px Georgia,serif';x.fillText('KAĞIT KUŞ',66,76);x.font='16px Georgia,serif';x.fillText('BİR YOLCULUK HATIRASI',66,106);
 line([[614,148],[614,714]],'#b5af94',2);
 x.fillStyle='#6d7769';x.font='italic 30px Georgia,serif';for(const [i,t] of ['Bugün rüzgâr çok güzeldi.','Yukarıdan her şey küçük,','hatıralar kocamandı.','Bu manzara senin olsun.'].entries()){x.save();x.translate(72,295+i*65);x.rotate([-.008,.005,-.004,.009][i]);x.fillText(t,0,0);x.restore()};
 x.font='italic 29px Georgia,serif';x.fillText('Sevgiyle,',285,622);x.fillText('Küçük Kuş',337,666);
 for(let i=0;i<4;i++)line([[678,408+i*76],[1110,408+i*76]],'#a8aa91',2);
 x.font='italic 23px Georgia,serif';x.fillText('Sevgili yol arkadaşım,',687,391);
 // scalloped postage edge and miniature motif mark
 rect(956,69,172,208,'#fcf5e3');for(let i=0;i<12;i++){ellipse(960+i*15,69,5,5,'#f5ecd7');ellipse(960+i*15,277,5,5,'#f5ecd7')}for(let i=0;i<14;i++){ellipse(956,74+i*15,5,5,'#f5ecd7');ellipse(1128,74+i*15,5,5,'#f5ecd7')}
 rect(970,83,144,179,'#9da995');rect(979,92,126,139,'#c6d0b4');if(motif==='balloon'){ellipse(1042,145,35,41,'#d1aa70');path([[1015,171],[1069,171],[1054,200],[1030,200]],'#b17c5c');line([[1030,200],[1032,212],[1052,212],[1054,200]],'#6c7159',2)}else if(motif==='sheep'){path([[979,205],[1026,177],[1105,204],[1105,231],[979,231]],'#839873');ellipse(1037,174,36,23,'#f3e8c8');ellipse(1073,176,12,18,'#6d715d');line([[1017,191],[1017,207]],'#6d715d',5);line([[1050,191],[1050,207]],'#6d715d',5)}else if(motif==='lighthouse'){rect(979,195,126,36,'#7e9e96');path([[1023,204],[1030,130],[1057,130],[1065,204]],'#f3e8c8');rect(1028,162,34,13,'#b67d66');rect(1025,124,39,17,'#d1aa70');path([[1019,125],[1044,106],[1070,125]],'#8b745c')}else{rect(979,195,126,36,'#7e9e96');path([[1001,191],[1086,191],[1068,211],[1018,211]],'#aa7c59');line([[1046,129],[1046,193]],'#6e745e',3);path([[1040,135],[1007,183],[1040,183]],'#f3e8c8');path([[1052,147],[1052,183],[1080,183]],'#ca8a6d')}x.fillStyle='#faf2da';x.font='18px Georgia';x.fillText('KUŞ POSTASI · 5',978,250);
 x.save();x.translate(940,265);x.rotate(-.23);x.strokeStyle='#777b68';x.lineWidth=3;for(const r of [70,61]){x.beginPath();x.arc(0,0,r,0,Math.PI*2);x.stroke()}x.textAlign='center';x.fillStyle='#777b68';x.font='16px Georgia';x.fillText('KAĞIT KUŞ',0,-24);x.font='21px Georgia';x.fillText('07 · 11',0,6);x.font='15px Georgia';x.fillText('HATIRA',0,31);for(let j=0;j<4;j++){x.beginPath();x.moveTo(57,-20+j*13);x.bezierCurveTo(95,-40+j*13,105,j*13,157,-20+j*13);x.stroke()}x.restore();
 x.font='15px Georgia';x.fillStyle='#9e9b83';x.fillText('ALBÜM / '+String(POSTCARD_MOTIFS.indexOf(motif)+1).padStart(2,'0')+'   ·   '+titles[motif],68,754);
 }
 // Warm paper at cut margins, with a tiny pressed corner crease.
 const age=x.createLinearGradient(0,0,1200,800);age.addColorStop(0,'rgba(150,113,62,.035)');age.addColorStop(.5,'rgba(255,255,255,0)');age.addColorStop(1,'rgba(150,113,62,.07)');x.fillStyle=age;x.fillRect(0,0,1200,800);
 line([[1167,14],[1185,32]],'rgba(144,122,86,.17)',1.5);
 // Fixed, object-space paper fibres and ink variation; no world-time shader.
 let r=seed>>>0;const rand=()=>{r=(Math.imul(r,1664525)+1013904223)>>>0;return r/4294967296};
 for(let i=0;i<17000;i++){x.fillStyle=rand()>.5?'rgba(99,84,53,.055)':'rgba(255,252,232,.085)';x.fillRect(rand()*1200,rand()*800,rand()*3+.5,rand()*1.2+.5)}
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t;
}
export function createPostcard({seed=17,motif='sheep',scale=1,side='front'}={}){
 if(!POSTCARD_MOTIFS.includes(motif))motif='sheep';const card=new THREE.Group();const paper=new THREE.Group();card.add(paper);
 const shape=new THREE.Shape(),w=1.8,h=1.2,r=.035;shape.moveTo(-w+r,-h);shape.lineTo(w-r,-h);shape.quadraticCurveTo(w,-h,w,-h+r);shape.lineTo(w,h-r);shape.quadraticCurveTo(w,h,w-r,h);shape.lineTo(-w+r,h);shape.quadraticCurveTo(-w,h,-w,h-r);shape.lineTo(-w,-h+r);shape.quadraticCurveTo(-w,-h,-w+r,-h);
 const geo=new THREE.ExtrudeGeometry(shape,{depth:.028,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.009,bevelThickness:.008,curveSegments:4});geo.translate(0,0,-.014);
 paper.add(new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:'#d5c5a4',roughness:1})));
 // Two fine cut-edge ply lines make thickness legible from grazing views.
 for(const z of [-.008,.008]){const pts=shape.getPoints(32).map(p=>new THREE.Vector3(p.x,p.y,z));const edge=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:'#ede0c5',transparent:true,opacity:.65}));paper.add(edge)}
 for(const back of [false,true]){const face=new THREE.Mesh(new THREE.PlaneGeometry(3.576,2.376),new THREE.MeshBasicMaterial({map:texture(motif,back,seed)}));face.position.z=back?-.023:.023;if(back)face.rotation.y=Math.PI;paper.add(face)}
 // Tiny warm collectible flecks, never covering the printed face.
 const glint=new THREE.Mesh(new THREE.OctahedronGeometry(.055),new THREE.MeshBasicMaterial({color:'#f6d98f'}));glint.position.set(1.99,.82,0);paper.add(glint);
 const haloCanvas=document.createElement('canvas');haloCanvas.width=haloCanvas.height=64;const hx=haloCanvas.getContext('2d'),hg=hx.createRadialGradient(32,32,0,32,32,32);hg.addColorStop(0,'rgba(255,223,142,.38)');hg.addColorStop(.25,'rgba(255,223,142,.14)');hg.addColorStop(1,'rgba(255,223,142,0)');hx.fillStyle=hg;hx.fillRect(0,0,64,64);const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(haloCanvas),transparent:true,depthWrite:false}));halo.scale.set(.42,.42,1);halo.position.copy(glint.position);paper.add(halo);
 const glint2=glint.clone();glint2.scale.setScalar(.5);glint2.position.set(-1.97,-.55,0);paper.add(glint2);
 card.scale.setScalar(scale);card.userData={paper,motif,side,elapsed:0,baseY:0,seed};paper.rotation.y=side==='back'?Math.PI:0;return card;
}
export function updatePostcard(card,dt,action=0){
 const d=card.userData;d.elapsed+=Math.min(dt,.05);const t=d.elapsed;const on=Number(action)===1;d.paper.position.y=on?Math.sin(t*.9)*.075:0;d.paper.rotation.z=on?Math.sin(t*.67)*.045:0;d.paper.rotation.x=on?Math.sin(t*.6)*.06:0;d.paper.rotation.y=(d.side==='back'?Math.PI:0)+(on?Math.sin(t*.34)*.35:0);
}
