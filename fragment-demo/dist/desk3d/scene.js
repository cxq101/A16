import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {makeSurfaces} from './surfaces.js';

// Presentation study only. The 12-card prototype and its save remain separate.
const $=s=>document.querySelector(s),data=window.DESK_CARDS,KEY='fragment-desk3d-art-v1';
let progress={active:0,placed:[[],[]],stored:[false,false]},view='3d',selected=null,drag=null,inspect=null,busy=false,reference=false,muted=false,audio;
try{const v=JSON.parse(localStorage.getItem(KEY));if(v&&[0,1].includes(v.active)&&Array.isArray(v.placed)&&v.placed.length===2&&v.placed.every(a=>Array.isArray(a)&&a.every(n=>Number.isInteger(n)&&n>=0&&n<6))){progress={active:v.active,placed:v.placed.map(a=>[...new Set(a)]),stored:[0,1].map(c=>v.stored?.[c]===true&&new Set(v.placed[c]).size===6)};}}catch{}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(progress));}catch{}};
let noticeTimer;function notice(s){$('#toast').textContent=s;$('#toast').classList.add('show');clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>$('#toast').classList.remove('show'),2600);}
function sound(good=true){if(muted)return;try{audio??=new(window.AudioContext||window.webkitAudioContext)();audio.resume();const t=audio.currentTime;[good?660:160,good?990:130].forEach((f,i)=>{const o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(.0001,t+i*.04);g.gain.exponentialRampToValueAtTime(.045,t+i*.04+.008);g.gain.exponentialRampToValueAtTime(.0001,t+i*.04+.2);o.connect(g).connect(audio.destination);o.start(t+i*.04);o.stop(t+i*.04+.21);});}catch{}}
function paperSound(kind){
 if(muted)return;try{audio??=new(window.AudioContext||window.webkitAudioContext)();audio.resume();const t=audio.currentTime;
 const length=kind==='store'?.19:.075,buffer=audio.createBuffer(1,Math.floor(audio.sampleRate*length),audio.sampleRate),samples=buffer.getChannelData(0);
 for(let i=0;i<samples.length;i++)samples[i]=(Math.random()*2-1)*Math.pow(1-i/samples.length,2);
 const source=audio.createBufferSource(),filter=audio.createBiquadFilter(),gain=audio.createGain();source.buffer=buffer;filter.type='bandpass';filter.frequency.value=kind==='pick'?1800:kind==='store'?1000:550;filter.Q.value=.7;gain.gain.value=kind==='pick'?.055:.10;source.connect(filter).connect(gain).connect(audio.destination);source.start(t);
 if(kind==='complete'||kind==='store'){[523.25,659.25,783.99].forEach((f,i)=>{const o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(.0001,t+i*.065);g.gain.exponentialRampToValueAtTime(.025,t+i*.065+.012);g.gain.exponentialRampToValueAtTime(.0001,t+i*.065+.32);o.connect(g).connect(audio.destination);o.start(t+i*.065);o.stop(t+i*.065+.34);});}
 }catch{}
}
let renderer;try{renderer=new THREE.WebGLRenderer({canvas:$('#scene'),antialias:true,alpha:false,powerPreference:'high-performance'});}catch(e){$('#loading').hidden=true;$('#fallback').hidden=false;throw e;}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.94;
const scene=new THREE.Scene();scene.background=new THREE.Color('#263431');
const camera=new THREE.OrthographicCamera(-8,8,5,-5,.1,60);let zoom=1,pan=new THREE.Vector3();
const hemi=new THREE.HemisphereLight('#e8f0e5','#514132',1.45);scene.add(hemi);
const key=new THREE.DirectionalLight('#ffe9ce',2.8);key.position.set(-3,9,2);key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-9,right:9,top:7,bottom:-7,near:.1,far:24});key.shadow.bias=-.00015;key.shadow.normalBias=.018;key.shadow.radius=3;scene.add(key);
const fill=new THREE.DirectionalLight('#b9d5df',.65);fill.position.set(5,4,-5);scene.add(fill);
const pmrem=new THREE.PMREMGenerator(renderer);const env=pmrem.fromScene(new RoomEnvironment(),.04);scene.environment=env.texture;scene.environmentIntensity=.32;pmrem.dispose();
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(),workPlane=new THREE.Plane(new THREE.Vector3(0,1,0),-.12),hitVector=new THREE.Vector3();
const tweens=[];function animate(obj,to,duration=.3,done){for(let i=tweens.length-1;i>=0;i--){const t=tweens[i];if(t.obj===obj&&Object.keys(to).some(k=>k in t.to))tweens.splice(i,1);}const from={};for(const k in to)from[k]=obj[k];tweens.push({obj,from,to,duration,start:performance.now(),done});}
function material(color,roughness=.8,metalness=0){return new THREE.MeshStandardMaterial({color,roughness,metalness});}
function box(w,h,d,mat,x,y,z){const radius=Math.min(w,h,d)*.22;const m=new THREE.Mesh(new RoundedBoxGeometry(w,h,d,2,radius),mat);m.position.set(x,y,z);m.receiveShadow=true;m.castShadow=true;scene.add(m);return m;}
function flat(w,h,mat,x,y,z){const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),mat);m.rotation.x=-Math.PI/2;m.position.set(x,y,z);m.receiveShadow=true;scene.add(m);return m;}
function canvasTexture(draw,w=512,h=512){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),8);return t;}
let seed=716;function rand(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
const surfaces=makeSurfaces(THREE,canvasTexture);
const woodMat=new THREE.MeshStandardMaterial({map:surfaces.wood,bumpMap:surfaces.wood,bumpScale:.012,roughness:.48});
box(14,.35,8.8,woodMat,0,-.21,0);box(14.08,.08,8.88,material('#332f26'),0,-.42,0);
const brass=material('#aa8546',.32,.78),dark=material('#132e29',.48),paper=new THREE.MeshStandardMaterial({map:surfaces.paper,roughness:.85});
box(5.7,.06,5.3,material('#a18a55',.7,.2),-2.15,.005,-.28);
box(5.59,.07,5.18,new THREE.MeshStandardMaterial({map:surfaces.cloth,bumpMap:surfaces.grain,bumpScale:.009,roughness:.94}),-2.15,.045,-.28);
flat(5.49,5.08,new THREE.MeshBasicMaterial({map:surfaces.matStitch,transparent:true,depthWrite:false}),-2.15,.082,-.28);
// A low sorting tray, a leather album and a small desk lamp: reusable primitives.
box(4.75,.055,4.6,material('#231a15'),2.53,.025,.1);box(4.55,.04,4.4,new THREE.MeshStandardMaterial({map:surfaces.leather,roughness:.85,bumpMap:surfaces.grain,bumpScale:.009}),2.53,.07,.1);
for(const x of [.19,4.87])box(.08,.12,4.65,woodMat,x,.1,.1);
for(const z of [-2.2,2.4])box(4.75,.12,.08,woodMat,2.53,.1,z);
const albumParts=[];albumParts.push(box(2.25,.13,2.9,new THREE.MeshStandardMaterial({map:surfaces.leather,roughness:.65}),-5.2,.12,1.35));albumParts.push(box(2.07,.09,2.67,paper,-5.14,.23,1.35));albumParts.push(box(2.13,.045,2.76,paper,-5.2,.30,1.35));
box(.025,.025,2.65,material('#6a634f'),-5.18,.327,1.35);
for(let i=0;i<2;i++){flat(.82,1.22,new THREE.MeshBasicMaterial({map:surfaces.pocket,transparent:true,depthWrite:false}),-5.66+i*.93,.365,1.24);label('00'+(i+1),-5.66+i*.93,2.14,.52,26,'#5d614e',.329);}
for(const x of [-6.23,-4.18])for(const z of [.02,2.67])box(.16,.035,.16,brass,x,.335,z);
const ribbon=box(.13,.008,.68,material('#9b543e'),-4.65,.02,3);ribbon.rotation.y=.12;
box(.1,.16,2.9,brass,-6.23,.25,1.35);
function label(text,x,z,w=2.2,size=27,color='#dbc895',y=.13){const tex=canvasTexture((c,W,H)=>{c.fillStyle=color;c.font=`${size}px Georgia,serif`;c.textAlign='center';c.textBaseline='middle';c.fillText(text,W/2,H/2);},512,80);return flat(w,w*80/512,new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false}),x,y,z);}
label('COLLECTION / I',-5.2,.32,1.7,27,'#686750',.329);label('01 / RESTORATION',-2.15,-2.46,2.5,29,'#d5c590',.09);label('02 / FRAGMENTS',2.5,-2.1,2.8,29,'#d2bc8b',.16);
const lamp=new THREE.Group();scene.add(lamp);
function lampMesh(geo,mat,x,y,z){const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;lamp.add(m);return m;}
lampMesh(new THREE.CylinderGeometry(.48,.6,.12,40),dark,-5.55,.12,-2.6);
lampMesh(new THREE.CylinderGeometry(.045,.055,2.3,16),brass,-5.55,1.3,-2.6);
const arm=lampMesh(new THREE.CylinderGeometry(.045,.045,1.25,16),brass,-5.1,2.45,-2.6);arm.rotation.z=-Math.PI/3;
lampMesh(new THREE.ConeGeometry(.57,.48,40,1,true),new THREE.MeshStandardMaterial({color:'#315145',side:THREE.DoubleSide,metalness:.2,roughness:.45}),-4.65,2.57,-2.6);
const rim=lampMesh(new THREE.TorusGeometry(.57,.016,8,48),brass,-4.65,2.33,-2.6);rim.rotation.x=Math.PI/2;
lampMesh(new THREE.SphereGeometry(.075,16,12),brass,-4.65,2.87,-2.6);
lampMesh(new THREE.CylinderGeometry(.065,.065,.14,16),brass,-5.55,2.45,-2.6);
lampMesh(new THREE.SphereGeometry(.13,16,12),new THREE.MeshBasicMaterial({color:'#ffe5a0'}),-4.65,2.35,-2.6);
const deskLamp=new THREE.PointLight('#ffcd7a',3,6,2);deskLamp.position.set(-4.65,2.2,-2.6);scene.add(deskLamp);
// A pen and card stock make scale and thickness visible without extra art assets.
const pen=box(.13,.12,1.9,material('#1b302e',.32),5.8,.13,1.5);pen.rotation.y=-.25;
box(.14,.13,.18,brass,5.56,.13,2.4);
for(let i=0;i<4;i++)box(1.2,.018,1.8,paper,5.7,.1+i*.02,-1.4+i*.015).rotation.y=-.13+i*.02;
label('FIELD NOTES',5.69,-1.95,.94,24,'#4d5140',.19);label('ASTRAL / 001',5.69,-1.18,.92,21,'#5c5e4a',.19);
const lensRim=new THREE.Mesh(new THREE.TorusGeometry(.32,.026,10,48),brass);lensRim.rotation.x=Math.PI/2;lensRim.position.set(5.75,.24,-.38);scene.add(lensRim);
const glass=flat(.59,.59,new THREE.MeshPhysicalMaterial({color:'#bcded3',transparent:true,opacity:.16,roughness:.05,metalness:.12}),5.75,.238,-.38);
const lensHandle=box(.12,.08,.75,dark,6.02,.22,.2);lensHandle.rotation.y=.4;
label('A S T R A L   /   A R C H I V E',.1,-3.64,4.7,25,'#bca36e',-.028);
const boardCenter={x:-2.04,z:-.2};const unit=1.03;
function slotPosition(p){return new THREE.Vector3(boardCenter.x+(p%2-.5)*unit,.115,boardCenter.z+(Math.floor(p/2)-1)*unit);}
const slots=[],slotMats=[];
for(let p=0;p<6;p++){const v=slotPosition(p),m=box(1.005,.018,1.005,material('#1c3835',.98),v.x,.092,v.z);m.userData={kind:'slot',p};slots.push(m);slotMats.push(m.material);label(String(p+1),v.x,v.z,.38,36,'#78948a',.105);}
box(2.16,.025,.025,brass,boardCenter.x,.08,boardCenter.z-1.61);box(2.16,.025,.025,brass,boardCenter.x,.08,boardCenter.z+1.61);
const textures=[],fullTextures=[],foilTextures=[],fullFoils=[],pieceObjects=[],shelved=[];let referenceMesh;
const backTexture=surfaces.back;
async function loadCard(c){
 const image=new Image();image.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(data[c].svg);await image.decode();
 const full=document.createElement('canvas');full.width=720;full.height=1080;const ctx=full.getContext('2d');ctx.drawImage(image,0,0,720,1080);ctx.globalAlpha=.025;
 for(let i=0;i<16000;i++){ctx.fillStyle=rand()>.5?'#fff':'#000';ctx.fillRect(rand()*720,rand()*1080,1,1);}
 const foil=document.createElement('canvas');foil.width=720;foil.height=1080;const f=foil.getContext('2d');f.strokeStyle='#fff';f.lineWidth=2.5;f.beginPath();f.roundRect(21,21,678,1038,18);f.stroke();
 f.lineWidth=3;for(const [x,y,sx,sy]of [[61,66,1,1],[659,66,-1,1],[61,1014,1,-1],[659,1014,-1,-1]]){f.beginPath();f.moveTo(x+sx*80,y);f.lineTo(x,y);f.lineTo(x,y+sy*77);f.stroke();}
 f.fillStyle='#fff';f.textAlign='center';f.font='22px Georgia';f.letterSpacing='7px';f.fillText('ASTRAL ARCHIVE',360,92);
 function tex(canvas){const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());return t;}
 fullTextures[c]=tex(full);fullFoils[c]=tex(foil);textures[c]=[];foilTextures[c]=[];
 for(let p=0;p<6;p++){for(const [source,output]of [[full,textures[c]],[foil,foilTextures[c]]]){const tile=document.createElement('canvas');tile.width=tile.height=360;tile.getContext('2d').drawImage(source,(p%2)*360,Math.floor(p/2)*360,360,360,0,0,360,360);output[p]=tex(tile);}}
}
const faceMaterials=[];
function releaseCard(root){scene.remove(root);root.traverse(o=>{o.geometry?.dispose();if(o.material&&o.material!==paper){const index=faceMaterials.indexOf(o.material);if(index>=0)faceMaterials.splice(index,1);o.material.dispose();}});}
function cardShape(w,h,r){const s=new THREE.Shape();s.moveTo(-w/2+r,-h/2);s.lineTo(w/2-r,-h/2);s.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r);s.lineTo(w/2,h/2-r);s.quadraticCurveTo(w/2,h/2,w/2-r,h/2);s.lineTo(-w/2+r,h/2);s.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r);s.lineTo(-w/2,-h/2+r);s.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2);return s;}
function cardModel(w,h,map,foilMap){
 const g=new THREE.Group(),shape=cardShape(w,h,Math.min(w,h)*.025),geom=new THREE.ExtrudeGeometry(shape,{depth:.026,steps:1,bevelEnabled:true,bevelSegments:2,bevelSize:.002,bevelThickness:.002,curveSegments:5});geom.translate(0,0,-.013);
 const edge=new THREE.Mesh(geom,paper);edge.rotation.x=-Math.PI/2;edge.castShadow=true;edge.receiveShadow=true;g.add(edge);
 const mat=new THREE.MeshPhysicalMaterial({map,metalnessMap:foilMap,roughness:.42,metalness:foilMap?.8:0,clearcoat:.25,clearcoatRoughness:.35,bumpMap:surfaces.grain,bumpScale:.0015});faceMaterials.push(mat);
 const front=new THREE.Mesh(new THREE.ShapeGeometry(shape,5),mat);
 // ShapeGeometry UVs are in model units; remap them to a full printed sheet.
 const uv=front.geometry.attributes.uv,pos=front.geometry.attributes.position;for(let i=0;i<uv.count;i++)uv.setXY(i,pos.getX(i)/w+.5,pos.getY(i)/h+.5);
 front.rotation.x=-Math.PI/2;front.position.y=.016;front.receiveShadow=true;g.add(front);
 const back=new THREE.Mesh(front.geometry.clone(),new THREE.MeshStandardMaterial({map:backTexture,roughness:.58}));back.rotation.x=Math.PI/2;back.position.y=-.016;g.add(back);return g;
}
const homes=Array.from({length:12},(_,i)=>({x:.91+(i%4)*1.08,z:-1.25+Math.floor(i/4)*1.18,rot:(i%3-1)*.045}));
function shuffleHomes(){const a=[...homes];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}pieceObjects.forEach((o,i)=>o.home={...a[i]});}
function isPlaced(c,p){return progress.placed[c].includes(p);}
function refreshPieces(immediate=false){pieceObjects.forEach(o=>{o.group.visible=!isPlaced(o.c,o.p)||(!progress.stored[o.c]&&o.c===progress.active&&!inspect);const v=isPlaced(o.c,o.p)?slotPosition(o.p):new THREE.Vector3(o.home.x,.145,o.home.z);if(immediate){o.group.position.copy(v);o.group.rotation.set(0,isPlaced(o.c,o.p)?0:o.home.rot,0);}else if(o!==selected&&(!drag||drag.piece!==o)){animate(o.group.position,{x:v.x,y:v.y,z:v.z},.25);animate(o.group.rotation,{x:0,y:isPlaced(o.c,o.p)?0:o.home.rot,z:0},.25);}});}
function updateUI(){[0,1].forEach(c=>{$('#count'+c).textContent=progress.stored[c]?'已收入收藏册':`${progress.placed[c].length} / 6 片`;$('#card'+c).classList.toggle('active',progress.active===c);});$('#progress').textContent=`${progress.placed.flat().length} / 12`;$('#albumCount').textContent=`${progress.stored.filter(Boolean).length} / 2`;$('#reference').setAttribute('aria-pressed',reference);$('#selection').textContent=selected?`已拿起碎片 · 拖到对应空位，或点击目标位置`:`正在拼接：${data[progress.active].name}`;if(referenceMesh){referenceMesh.material.map=fullTextures[progress.active];referenceMesh.visible=reference&&!inspect;}slots.forEach((m,p)=>m.material.color.set(isPlaced(progress.active,p)?'#37534a':'#1c3835'));save();}
function choose(c){if(busy)return;if(inspect){notice('先把完整卡牌收入收藏册，再切换另一张');return;}selected=null;progress.active=c;reference=false;refreshPieces();updateUI();if(progress.placed[c].length===6&&!progress.stored[c])showInspection(c);}
function select(o){if(busy||inspect||isPlaced(o.c,o.p))return;selected=o;refreshPieces();animate(o.group.position,{y:.42},.11);animate(o.group.rotation,{x:.025,y:0,z:-.015},.11);paperSound('pick');updateUI();}
function reject(){sound(false);notice(selected?.c!==progress.active?'这片来自另一张卡，试试切换下方卡片':'图案还接不上，试试其他空位');if(selected){const o=selected;selected=null;animate(o.group.position,{x:o.home.x,y:.145,z:o.home.z},.3);animate(o.group.rotation,{x:0,y:o.home.rot,z:0},.3);}updateUI();}
function place(p){if(!selected||busy||inspect)return;if(isPlaced(progress.active,p)){notice('这个位置已经拼好了');selected=null;refreshPieces();updateUI();return;}if(selected.c!==progress.active||selected.p!==p){reject();return;}const o=selected;selected=null;progress.placed[o.c].push(p);const pos=slotPosition(p);animate(o.group.position,{x:pos.x,y:pos.y,z:pos.z},.18);animate(o.group.rotation,{x:0,y:0,z:0},.18);paperSound("snap");updateUI();if(progress.placed[o.c].length===6){busy=true;setTimeout(()=>{busy=false;showInspection(o.c);},240);}}
function showInspection(c){if(inspect||progress.stored[c])return;selected=null;reference=false;paperSound('complete');const root=new THREE.Group(),inner=cardModel(2.04,3.06,fullTextures[c],fullFoils[c]);root.add(inner);root.position.copy(new THREE.Vector3(boardCenter.x,.15,boardCenter.z));scene.add(root);inspect={c,root,inner,flipped:false};refreshPieces();animate(root.position,{x:-.3,y:1.35,z:.15},.48);animate(root.rotation,{x:view==='flat'?0:.95,y:0,z:0},.7);$('#inspection').hidden=false;$('#inspectName').textContent=data[c].name+' · 已拼完整';$('#flipCard').textContent='翻到背面';$('#storeCard').disabled=false;$('#flipCard').disabled=false;updateUI();notice('拼缝合拢了。翻面看看，再把它收入收藏册。');}
function storeInspection(){if(!inspect||busy)return;busy=true;const current=inspect,c=current.c;$('#storeCard').disabled=true;$('#flipCard').disabled=true;animate(current.inner.rotation,{x:0},.25);animate(current.root.rotation,{x:0,y:0,z:0},.55);animate(current.root.scale,{x:.35,y:.35,z:.35},.55);animate(current.root.position,{x:-5.63+c*.9,y:.36,z:1.3},.58,()=>{releaseCard(current.root);inspect=null;busy=false;progress.stored[c]=true;$('#inspection').hidden=true;updateShelved();paperSound("store");refreshPieces();updateUI();const next=[0,1].find(i=>!progress.stored[i]);if(next!==undefined){choose(next);notice('已收入收藏册。下一张故事，继续拼回。');}else{notice('两张藏品都已收入收藏册');showAlbum();}});}
function updateShelved(){for(let c=0;c<2;c++){if(!shelved[c]){const m=cardModel(.72,1.08,fullTextures[c],fullFoils[c]);m.position.set(-5.66+c*.93,.344,1.24);scene.add(m);shelved[c]=m;}shelved[c].visible=progress.stored[c];}}
function showAlbum(){if(busy)return;$('#albumCards').innerHTML=data.map((d,c)=>`<figure>${progress.stored[c]?d.svg:'<div class="empty-card">尚未入册</div>'}<figcaption>${d.name}<small>${progress.stored[c]?'完整收藏':`${progress.placed[c].length} / 6 片`}</small></figcaption></figure>`).join('');$('#albumDialog').showModal();}
function syncCamera(){const rect=$('#stage').getBoundingClientRect(),a=rect.width/rect.height,halfH=Math.max(4.15,7.55/a)/zoom;camera.left=-halfH*a;camera.right=halfH*a;camera.top=halfH;camera.bottom=-halfH;camera.position.copy(pan).add(view==='flat'?new THREE.Vector3(0,14,.001):new THREE.Vector3(0,11,8.3));camera.lookAt(pan);camera.updateProjectionMatrix();renderer.setSize(rect.width,rect.height,false);}
function syncFinish(){const glossy=$('#finish').checked&&view==='3d';faceMaterials.forEach(m=>{m.clearcoat=glossy?.25:0;m.roughness=glossy?.42:1;m.metalness=(glossy&&m.metalnessMap)? .8 : 0;});}
function setView(v){view=v;$('#view3d').classList.toggle('active',v==='3d');$('#viewFlat').classList.toggle('active',v==='flat');$('#view3d').setAttribute('aria-pressed',v==='3d');$('#viewFlat').setAttribute('aria-pressed',v==='flat');$('#viewLabel').textContent=v==='3d'?'倾斜俯视 · 实时光影':'正俯视 · 无阴影／无光泽';lamp.visible=v==='3d';deskLamp.intensity=v==='3d'?3:0;key.intensity=v==='3d'?2.8:0;fill.intensity=v==='3d'?.65:0;hemi.intensity=v==='3d'?1.45:2.5;scene.environmentIntensity=v==='3d'?.32:0;renderer.shadowMap.enabled=v==='3d'&&$('#shadows').checked;$('#shadows').disabled=v==='flat';$('#finish').disabled=v==='flat';syncFinish();if(inspect)animate(inspect.root.rotation,{x:v==='flat'?0:.95},.35);syncCamera();}
function rayAt(e){const r=$('#scene').getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);}
function hit(e){rayAt(e);const objects=pieceObjects.filter(o=>!isPlaced(o.c,o.p)).flatMap(o=>o.group.children).concat(slots);const intersection=raycaster.intersectObjects(objects,false)[0];if(!intersection)return null;const obj=intersection.object;if(obj.userData.owner)return {kind:'piece',piece:obj.userData.owner};if(obj.userData.kind==='slot')return {kind:'slot',p:obj.userData.p};return null;}
const canvas=$('#scene');canvas.addEventListener('pointerdown',e=>{if(busy||inspect)return;e.preventDefault();const h=hit(e);drag={startX:e.clientX,startY:e.clientY,moved:false,kind:e.shiftKey||e.button===1?'pan':h?.kind,piece:h?.piece,p:h?.p,panStart:pan.clone()};if(drag.kind==='piece')select(drag.piece);canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.startX,dy=e.clientY-drag.startY;if(Math.hypot(dx,dy)>4)drag.moved=true;if(drag.kind==='pan'){const r=canvas.getBoundingClientRect();pan.x=THREE.MathUtils.clamp(drag.panStart.x-dx*(camera.right-camera.left)/r.width,-3,3);pan.z=THREE.MathUtils.clamp(drag.panStart.z-dy*(camera.top-camera.bottom)/r.height,-2.5,2.5);syncCamera();return;}if(drag.kind==='piece'&&drag.moved){rayAt(e);if(raycaster.ray.intersectPlane(workPlane,hitVector)){const o=drag.piece;for(let i=tweens.length-1;i>=0;i--)if(tweens[i].obj===o.group.position)tweens.splice(i,1);o.group.position.set(THREE.MathUtils.clamp(hitVector.x,-6.4,6.4),.48,THREE.MathUtils.clamp(hitVector.z,-3.8,3.8));}}});
function pointerUp(e,cancel=false){if(!drag)return;const d=drag;drag=null;if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);if(d.kind==='piece'&&d.moved){if(cancel){selected=null;refreshPieces();updateUI();return;}rayAt(e);raycaster.ray.intersectPlane(workPlane,hitVector);const p=slots.findIndex((m,p)=>slotPosition(p).distanceTo(new THREE.Vector3(hitVector.x,.115,hitVector.z))<.62);if(p>=0)place(p);else{selected=null;refreshPieces();updateUI();}}else if(d.kind==='slot'&&!cancel&&!d.moved){if(selected)place(d.p);else notice('先从右侧拿起一片碎片');}}
canvas.addEventListener('pointerup',e=>pointerUp(e));canvas.addEventListener('pointercancel',e=>pointerUp(e,true));canvas.addEventListener('contextmenu',e=>e.preventDefault());canvas.addEventListener('wheel',e=>{e.preventDefault();zoom=THREE.MathUtils.clamp(zoom*(e.deltaY<0?1.08:.925),.7,1.8);syncCamera();},{passive:false});
$('#view3d').onclick=()=>setView('3d');$('#viewFlat').onclick=()=>setView('flat');
$('#artButton').onclick=()=>{$('#artCards').innerHTML=data.map((d,c)=>`<figure>${d.svg}<figcaption><small>SPECIMEN / 00${c+1}</small><h3>${d.name}</h3><p>${d.lore}</p></figcaption></figure>`).join('');$('#artDialog').showModal();};$('#closeArt').onclick=()=>$('#artDialog').close();
$('#zoomIn').onclick=()=>{zoom=Math.min(1.8,zoom*1.15);syncCamera();};$('#zoomOut').onclick=()=>{zoom=Math.max(.7,zoom/1.15);syncCamera();};$('#zoomReset').onclick=()=>{zoom=1;pan.set(0,0,0);syncCamera();};
$('#reference').onclick=()=>{reference=!reference;updateUI();};$('#hint').onclick=()=>{if(busy||inspect)return;const o=pieceObjects.find(o=>o.c===progress.active&&!isPlaced(o.c,o.p));if(!o){notice('这张卡已经拼好');return;}select(o);slots[o.p].material.color.set('#b8a368');notice('已拿起一片碎片，对应空位已亮起');};
$('#card0').onclick=()=>choose(0);$('#card1').onclick=()=>choose(1);
$('#flipCard').onclick=()=>{if(!inspect||busy)return;inspect.flipped=!inspect.flipped;animate(inspect.inner.rotation,{x:inspect.flipped?Math.PI:0},.5);$('#flipCard').textContent=inspect.flipped?'翻回正面':'翻到背面';};$('#storeCard').onclick=storeInspection;
$('#album').onclick=showAlbum;$('#closeAlbum').onclick=$('#finishStudy').onclick=()=>$('#albumDialog').close();$('#costButton').onclick=()=>$('#costDialog').showModal();$('#closeCost').onclick=()=>$('#costDialog').close();$('#sound').onclick=()=>{muted=!muted;$('#sound').textContent=muted?'声音：关':'声音：开';};
$('#shadows').onchange=()=>{renderer.shadowMap.enabled=view==='3d'&&$('#shadows').checked;};$('#finish').onchange=syncFinish;
$('#light').oninput=()=>{const t=Number($('#light').value)/100;key.position.set(-6+t*12,8,1+Math.sin(t*Math.PI)*3);};
$('#reset').onclick=()=>{if(busy||!confirm('只重置本次两张卡的桌面体验，原版十二张收藏不会受影响。确定吗？'))return;if(inspect){releaseCard(inspect.root);inspect=null;}progress={active:0,placed:[[],[]],stored:[false,false]};selected=null;reference=false;$('#inspection').hidden=true;tweens.splice(0);shuffleHomes();refreshPieces(true);updateShelved();updateUI();};
const resize=new ResizeObserver(syncCamera);resize.observe($('#stage'));
let ready=false,frames=0,lastSample=performance.now(),lastTime=0,measuredFPS=0;
function loop(now){requestAnimationFrame(loop);for(let i=tweens.length-1;i>=0;i--){const t=tweens[i],p=Math.min((now-t.start)/(t.duration*1000),1),k=1-Math.pow(1-p,3);for(const key in t.to)t.obj[key]=t.from[key]+(t.to[key]-t.from[key])*k;if(p===1){tweens.splice(i,1);t.done?.();}}if(ready){renderer.render(scene,camera);frames++;if(now-lastSample>1000){measuredFPS=Math.round(frames*1000/(now-lastSample));$('#fps').textContent=measuredFPS+' FPS';frames=0;lastSample=now;}}lastTime=now;}
requestAnimationFrame(loop);
async function init(){await Promise.all([loadCard(0),loadCard(1)]);for(let c=0;c<2;c++)for(let p=0;p<6;p++){const group=cardModel(1.015,1.015,textures[c][p],foilTextures[c][p]),o={c,p,group,home:null};group.children.forEach(m=>m.userData.owner=o);pieceObjects.push(o);scene.add(group);}shuffleHomes();referenceMesh=flat(2.055,3.085,new THREE.MeshBasicMaterial({map:fullTextures[0],transparent:true,opacity:.25,depthWrite:false}),boardCenter.x,.109,boardCenter.z);referenceMesh.visible=false;updateShelved();refreshPieces(true);updateUI();syncCamera();ready=true;$('#loading').hidden=true;if(progress.placed[progress.active].length===6&&!progress.stored[progress.active])showInspection(progress.active);}
init().catch(e=>{$('#loading').textContent='卡面载入失败，请刷新后重试。';console.error(e);});
// Read-only coordinates and measurements for repeatable browser QA.
window.deskStudy={get ready(){return ready;},get snapshot(){return JSON.parse(JSON.stringify({...progress,view,busy,inspecting:inspect?.c??null,flipped:inspect?.flipped??false,fps:measuredFPS,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,shadowEnabled:renderer.shadowMap.enabled,gloss:faceMaterials[0]?.clearcoat}));},screenPoint(kind,c,p){const v=kind==='slot'?slotPosition(p):pieceObjects.find(o=>o.c===c&&o.p===p).group.position.clone();v.project(camera);const r=canvas.getBoundingClientRect();return {x:r.left+(v.x+1)*r.width/2,y:r.top+(1-v.y)*r.height/2};}};
