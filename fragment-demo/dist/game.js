function visibleCards(){
 if(state.mode==='high')return seriesCards(seriesOf(state.active));
 const first=Math.floor(state.active/2)*2;return [first,first+1];
}
function remaining(){return visibleCards().flatMap(c=>Array.from({length:6},(_,p)=>({c,p})).filter(x=>!state.placed[c].includes(x.p)));}
function randomize(){
 order=remaining();
 for(let i=order.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
}
function notify(msg){$('#toast').textContent=msg;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),2600);}
function chime(ok=true){if(!sound)return;try{audioContext??=new(window.AudioContext||window.webkitAudioContext)();audioContext.resume();const t=audioContext.currentTime;[ok?523:160,ok?784:120].forEach((f,i)=>{const o=audioContext.createOscillator(),g=audioContext.createGain();o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(.0001,t+i*.07);g.gain.exponentialRampToValueAtTime(.09,t+i*.07+.01);g.gain.exponentialRampToValueAtTime(.0001,t+.3+i*.07);o.connect(g);g.connect(audioContext.destination);o.start(t+i*.07);o.stop(t+.4+i*.07);});}catch{}}
function render(){
 const total=state.placed.reduce((n,a)=>n+a.length,0),done=doneCount(),s=seriesOf(state.active),d=cards[state.active],ids=seriesCards(s),seriesDone=ids.filter(completed).length;
 document.body.dataset.theme=series[s].theme;
 for(const mode of ['low','high']){$('#'+mode).classList.toggle('active',state.mode===mode);$('#'+mode).setAttribute('aria-pressed',state.mode===mode);}
 $('#albumCount').textContent=`${done} / ${cards.length} 张`;$('#albumBar').style.width=`${done/cards.length*100}%`;$('#placedCount').textContent=`${total} / ${cards.length*6}`;
 $('#seriesTabs').innerHTML=series.map((item,i)=>`<button data-series="${i}" class="series-tab ${s===i?'active':''}" aria-pressed="${s===i}"><span>${item.name}</span><small>${seriesCards(i).filter(completed).length} / 6 ${seriesComplete(i)?'✦':''}</small></button>`).join('');
 $('#seriesProgress').textContent=`本系列 ${seriesDone} / 6 张`;
 $('#galleryButton').disabled=seriesDone!==6;$('#galleryButton').textContent=seriesDone===6?'✦ 查看系列展示':'集齐 6 张解锁展示';
 $('#seriesBanner').innerHTML=`<span>VOL. 0${s+1} · ${series[s].name}</span><span>${seriesComplete(s)?'✦ 系列展示已解锁':`再完成 ${6-seriesDone} 张，解锁专属展示页`}</span>`;
 $('#chapterLabel').textContent=s===0?'ASTRAL VOYAGE · 星旅藏集':'THE LITTLE WORKSHOP · 时光工坊';
 $('#album').innerHTML=ids.map(c=>`<button class="album-item ${c===state.active?'active':''}" data-card="${c}" aria-label="${cards[c].name}，${state.placed[c].length}片已完成"><span class="album-thumb">${artworks[c]}</span><span><span class="album-title">${cards[c].name}</span><span class="album-detail">${completed(c)?'已收入收藏':`${state.placed[c].length} / 6 片 · ${state.mode==='low'?`第 ${Math.floor((c%6)/2)+1} 组`:'拼接中'}`}</span></span>${completed(c)?'<span class="album-check">✓</span>':''}</button>`).join('');
 $('#cardName').textContent=d.name;$('#rarity').textContent=d.kind;$('#cardLore').textContent=d.lore;
 $('#cardProgress').textContent=completed(state.active)?'✦ 已完整修复并收入收藏':`已拼回 ${state.placed[state.active].length} / 6 片`;
 $('.desk-side').innerHTML=`<span>${series[s].name}</span><b id="cardNumber"></b><span>COLLECTION<br>VOL. 0${s+1}</span>`;
 $('#cardNumber').textContent=String(state.active+1).padStart(2,'0');$('#boardCaption').textContent=completed(state.active)?`完整藏品 · ${series[s].name}`:'六片碎光，一段奇遇';
 $('#board').innerHTML=Array.from({length:6},(_,p)=>`<button class="slot ${state.placed[state.active].includes(p)?'filled':''}" data-slot="${p}" aria-label="${d.name}第${p+1}个位置">${state.placed[state.active].includes(p)?pieceArt(state.active,p):'<span class="slot-mark">＋</span>'}</button>`).join('')+(reference?`<div class="reference-image">${artworks[state.active]}</div>`:'');
 $('#reference').textContent=reference?'隐藏原图':'查看原图';$('#reference').setAttribute('aria-pressed',reference);
 const unlocked=upgradeUnlocked();$('#highlight').disabled=!unlocked;$('#highlight').classList.toggle('enabled',state.highlight&&unlocked);$('#highlight').setAttribute('aria-pressed',unlocked&&state.highlight);
 $('#highlight').textContent=unlocked?`✦ 同卡碎片高亮：${state.highlight?'开':'关'}`:`同卡碎片高亮 · ${done} / 2 张`;
 $('#upgradeHelp').textContent=unlocked?'为当前卡的碎片描边，不提示拼接位置':`再完成 ${2-done} 张卡，解锁同卡碎片高亮`;
 const rem=remaining();order=order.filter(x=>rem.some(y=>y.c===x.c&&y.p===x.p));for(const x of rem)if(!order.some(y=>y.c===x.c&&y.p===x.p))order.push(x);
 $('#trayCount').textContent=`剩余 ${order.length} 片`;
 $('#modeHelp').textContent=state.mode==='low'?`本系列第 ${Math.floor((state.active%6)/2)+1} / 3 组 · 2 张卡混合，完成后继续下一组`:'本系列 6 张卡同时混合 · 切换系列可体验另一套藏集';
 $('#tray').innerHTML=order.length?order.map((x,i)=>`<button class="piece ${selected&&selected.c===x.c&&selected.p===x.p?'selected':''} ${unlocked&&state.highlight&&x.c===state.active?'same-card':''}" draggable="true" data-c="${x.c}" data-p="${x.p}" aria-label="待拼碎片 ${i+1}${unlocked&&state.highlight&&x.c===state.active?'，属于当前卡':''}" aria-pressed="${!!(selected&&selected.c===x.c&&selected.p===x.p)}">${pieceArt(x.c,x.p)}</button>`).join(''):`<div class="empty-tray">✧ ${seriesDone===6?'本系列已全部修复，专属展示页已解锁。':'本组已完成，选择左侧下一组卡片继续收藏。'}</div>`;
 save();
}
function choose(c){
 if(!Number.isInteger(c)||c<0||c>=cards.length)return;
 const oldSeries=seriesOf(state.active),oldGroup=Math.floor(state.active/2);state.active=c;reference=false;
 if(oldSeries!==seriesOf(c)||(state.mode==='low'&&oldGroup!==Math.floor(c/2))){selected=null;randomize();}
 render();
}
function chooseSeries(s){if(!Number.isInteger(s)||s<0||s>=series.length)return;const ids=seriesCards(s);choose(ids.find(c=>!completed(c))??ids[0]);}
function showGallery(s){
 if(!seriesComplete(s)){notify('完成本系列六张卡后，展示页就会解锁');return;}
 const info=series[s],ids=seriesCards(s),other=1-s;$('#gallery').dataset.series=s;$('#gallery').dataset.theme=info.theme;
 $('#galleryTitle').textContent=`${info.name} · 珍藏展`;$('#gallerySubtitle').textContent=info.subtitle;
 $('#galleryCards').innerHTML=ids.map(c=>`<figure><div>${artworks[c]}</div><figcaption>${cards[c].name}<small>${cards[c].kind}</small></figcaption></figure>`).join('');
 $('#galleryQuote').textContent=info.quote;
 $('#nextSeries').textContent=seriesComplete(other)?`欣赏${series[other].name}`:`${seriesCards(other).some(c=>state.placed[c].length)?'继续':'开始'}${series[other].name}`;
 $('#nextSeries').dataset.series=other;$('#gallery').showModal();
}
function place(p){
 if(!selected){notify('先从下方挑选一片碎片');return;}
 if(selected.c!==state.active||selected.p!==p){chime(false);notify(selected.c!==state.active?'这片属于另一张卡，试着切换左侧卡片':'图案还接不上，试试另一个位置');const b=$('#board');b.classList.remove('shake');void b.offsetWidth;b.classList.add('shake');return;}
 const c=selected.c;if(state.placed[c].includes(p))return;
 const wasUnlocked=upgradeUnlocked();state.placed[c].push(p);selected=null;chime();render();
 if(completed(c)){
  const s=seriesOf(c),all=doneCount()===cards.length,finishedSeries=seriesComplete(s),justUnlocked=!wasUnlocked&&upgradeUnlocked();
  $('#completeArt').innerHTML=artworks[c];
  $('#completeTitle').textContent=all?'十二段奇遇，完整珍藏':finishedSeries?`${series[s].name} · 全套完成`:`${cards[c].name} · 修复完成`;
  $('#completeText').textContent=all?'72 片碎光已全部归位，两套专属展示页都已解锁。':finishedSeries?'六张藏品已集齐，专属系列展示页已解锁。看看它们一起陈列的样子，再开始下一套故事。':justUnlocked?'第二张卡收入收藏！新能力「同卡碎片高亮」已解锁，可在左侧开启，为当前卡的碎片描边。':'一张完整的卡已收入收藏。继续补齐这一套，解锁它们的专属展示页。';
  $('#continue').textContent=finishedSeries?'查看系列展示':justUnlocked?'继续，试试新能力':'继续收藏';$('#continue').dataset.gallery=finishedSeries?String(s):'';$('#completion').showModal();
 }
}
$('#seriesTabs').addEventListener('click',e=>{const b=e.target.closest('[data-series]');if(b)chooseSeries(+b.dataset.series);});
$('#album').addEventListener('click',e=>{const b=e.target.closest('[data-card]');if(b)choose(+b.dataset.card);});
$('#tray').addEventListener('click',e=>{const b=e.target.closest('.piece');if(!b)return;const next={c:+b.dataset.c,p:+b.dataset.p};selected=selected&&selected.c===next.c&&selected.p===next.p?null:next;render();});
$('#tray').addEventListener('dragstart',e=>{const b=e.target.closest('.piece');if(!b)return;selected={c:+b.dataset.c,p:+b.dataset.p};e.dataTransfer.setData('text/plain',JSON.stringify(selected));e.dataTransfer.effectAllowed='move';});
$('#board').addEventListener('dragover',e=>{if(e.target.closest('[data-slot]')){e.preventDefault();e.dataTransfer.dropEffect='move';}});
$('#board').addEventListener('drop',e=>{e.preventDefault();const b=e.target.closest('[data-slot]');if(b)place(+b.dataset.slot);});
$('#board').addEventListener('click',e=>{const b=e.target.closest('[data-slot]');if(b&&!b.classList.contains('filled'))place(+b.dataset.slot);});
for(const mode of ['low','high'])$('#'+mode).onclick=()=>{if(state.mode===mode)return;state.mode=mode;selected=null;reference=false;randomize();render();notify(mode==='low'?'已切换：每组 2 张卡，已有进度保留':'已切换：本系列 6 张卡同时混合，已有进度保留');};
$('#highlight').onclick=()=>{if(!upgradeUnlocked())return;state.highlight=!state.highlight;render();notify(state.highlight?'已为当前卡的碎片描边；切换卡片时会自动更新':'同卡碎片高亮已关闭');};
$('#shuffle').onclick=()=>{randomize();render();notify('碎片已重新打散');};$('#reference').onclick=()=>{reference=!reference;render();};
$('#hint').onclick=()=>{if(completed(state.active)&&!selected){notify('这张卡已经完整，可以选择另一张');return;}if(!selected){const x=order.find(x=>x.c===state.active)||order[0];if(!x)return;selected={...x};}state.active=selected.c;state.hints++;render();const slot=$(`[data-slot="${selected.p}"]`);slot.classList.add('hint');notify('已选中碎片，对应位置正在发光');clearTimeout(hintTimer);hintTimer=setTimeout(()=>slot.classList.remove('hint'),4000);};
$('#sound').onclick=()=>{sound=!sound;$('#sound').textContent=`声音：${sound?'开':'关'}`;if(sound)chime();};
$('#reset').onclick=()=>{if(!confirm('重新开始会清除全部十二张卡的进度、展示奖励和高亮能力，确定吗？'))return;state.placed=cards.map(()=>[]);state.active=0;state.hints=0;state.highlight=false;selected=null;reference=false;randomize();render();};
$('#continue').onclick=()=>{const gallery=$('#continue').dataset.gallery;$('#completion').close();if(gallery!==''){showGallery(+gallery);return;}const next=visibleCards().find(c=>!completed(c))??seriesCards(seriesOf(state.active)).find(c=>!completed(c));if(next!==undefined)choose(next);};
$('#galleryButton').onclick=()=>showGallery(seriesOf(state.active));
$('#closeGallery').onclick=()=>$('#gallery').close();
$('#nextSeries').onclick=()=>{const next=+$('#nextSeries').dataset.series;$('#gallery').close();chooseSeries(next);};
randomize();render();if(migrated)notify('已保留原版收藏进度，新增「时光工坊」等你开启');
