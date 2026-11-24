// Procedural, seeded surface masters. No external textures or per-card material work.
export function makeSurfaces(THREE,texture){
 let seed=8291;const random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
 const wood=texture((c,w,h)=>{
   c.fillStyle='#51382b';c.fillRect(0,0,w,h);
   for(let board=0;board<3;board++){
     const y=board*h/3,gradient=c.createLinearGradient(0,y,0,y+h/3);
     gradient.addColorStop(0,'#2b1c1450');gradient.addColorStop(.15,'#bf885b18');gradient.addColorStop(.7,'#291c1825');gradient.addColorStop(1,'#150e0b65');c.fillStyle=gradient;c.fillRect(0,y,w,h/3);
   }
   for(let i=0;i<2100;i++){
     const y=random()*h,amplitude=1+random()*10,phase=random()*6;
     c.strokeStyle=random()>.5?`rgba(207,160,104,${.015+random()*.06})`:`rgba(9,6,4,${.025+random()*.10})`;
     c.lineWidth=.3+random()*1.3;c.beginPath();
     for(let x=0;x<=w;x+=16){const yy=y+Math.sin(x/w*7+phase)*amplitude+Math.sin(x/w*17+phase)*2;x?c.lineTo(x,yy):c.moveTo(x,yy);}c.stroke();
   }
   for(let i=0;i<90;i++){c.strokeStyle='#e4c18c08';c.beginPath();const x=random()*w,y=random()*h;c.moveTo(x,y);c.lineTo(x+10+random()*100,y+.3);c.stroke();}
 },1024,1024);
 const cloth=texture((c,w,h)=>{c.fillStyle='#183c36';c.fillRect(0,0,w,h);for(let i=0;i<60000;i++){c.fillStyle=random()>.5?'#d9e0bd0c':'#061b1d15';c.fillRect(random()*w,random()*h,1,random()*3+.5);}c.strokeStyle='#aac6b009';c.lineWidth=.5;for(let i=0;i<w;i+=3){c.beginPath();c.moveTo(i,0);c.lineTo(i,h);c.stroke();}},512,512);
 const leather=texture((c,w,h)=>{c.fillStyle='#15322d';c.fillRect(0,0,w,h);for(let i=0;i<28000;i++){c.strokeStyle=random()>.5?'#8aa38b18':'#020d0a30';const x=random()*w,y=random()*h;c.beginPath();c.ellipse(x,y,1+random()*2,.5+random(),random()*3,0,Math.PI*2);c.stroke();}});
 const paper=texture((c,w,h)=>{c.fillStyle='#d6c9a6';c.fillRect(0,0,w,h);for(let i=0;i<15000;i++){c.fillStyle=random()>.5?'#fff5cd12':'#6958330c';c.fillRect(random()*w,random()*h,random()*3+1,.7);}c.fillStyle='#5a49361a';for(let y=0;y<h;y+=7)c.fillRect(0,y,w,.6);});
 const grain=texture((c,w,h)=>{c.fillStyle='#888';c.fillRect(0,0,w,h);for(let i=0;i<25000;i++){const v=100+Math.floor(random()*50);c.fillStyle=`rgb(${v},${v},${v})`;c.fillRect(random()*w,random()*h,1,1);}},256,256);grain.colorSpace=THREE.NoColorSpace;
 const matStitch=texture((c,w,h)=>{c.strokeStyle='#c5ad7770';c.lineWidth=1.5;c.setLineDash([5,5]);c.strokeRect(8,8,w-16,h-16);},1024,1024);
 const pocket=texture((c,w,h)=>{c.strokeStyle='#e3dec170';c.lineWidth=2;c.strokeRect(7,7,w-14,h-14);c.fillStyle='#e3dec10a';c.fillRect(8,8,w-16,h-16);const gl=c.createLinearGradient(0,0,w,h);gl.addColorStop(0,'#f0ead929');gl.addColorStop(.25,'#ffffff00');gl.addColorStop(.8,'#ffffff00');gl.addColorStop(1,'#e9edde17');c.fillStyle=gl;c.fillRect(8,8,w-16,h-16);},256,384);
 const back=texture((c,w,h)=>{
  c.fillStyle='#142e34';c.fillRect(0,0,w,h);c.strokeStyle='#bba16c';c.lineWidth=2;c.beginPath();c.roundRect(22,22,w-44,h-44,12);c.stroke();c.strokeStyle='#bba16c60';c.strokeRect(34,34,w-68,h-68);
  c.save();c.beginPath();c.rect(43,43,w-86,h-86);c.clip();
  for(let j=0;j<18;j++){c.beginPath();for(let i=0;i<=260;i++){const t=i/260*Math.PI*2,r=136+Math.sin(t*12+j*.38)*10+j*2,x=w/2+Math.cos(t)*r,y=h/2+Math.sin(t)*r*1.52;i?c.lineTo(x,y):c.moveTo(x,y);}c.closePath();c.strokeStyle=j%3===0?'#bba16c66':'#bba16c29';c.lineWidth=.7;c.stroke();}
  c.fillStyle='#142e34';c.beginPath();c.arc(w/2,h/2,98,0,Math.PI*2);c.fill();c.strokeStyle='#cdb37b';c.lineWidth=1.2;for(const r of [86,96]){c.beginPath();c.arc(w/2,h/2,r,0,Math.PI*2);c.stroke();}
  c.translate(w/2,h/2);for(let j=0;j<8;j++){c.save();c.rotate(j*Math.PI/4);c.beginPath();c.moveTo(0,-76);c.lineTo(9,-14);c.lineTo(0,0);c.lineTo(-9,-14);c.closePath();c.fillStyle=j%2?'#8b805e':'#e2c78c';c.fill();c.restore();}c.fillStyle='#142e34';c.beginPath();c.arc(0,0,12,0,Math.PI*2);c.fill();c.stroke();c.restore();
  c.fillStyle='#ddc38a';c.textAlign='center';c.font='19px Georgia';c.letterSpacing='5px';c.fillText('ASTRAL ARCHIVE',w/2,100);c.font='11px Georgia';c.letterSpacing='3px';c.fillText('THE FIRST EDITION',w/2,h-80);
 },512,768);
 return {wood,cloth,leather,paper,grain,matStitch,pocket,back};
}
