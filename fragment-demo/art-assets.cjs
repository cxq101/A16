// Editable vector masters: the frame, palette and ornament are shared across cards.
const fs=require('node:fs'),path=require('node:path');
const out=path.join(__dirname,'dist/desk3d/assets');
const star=(x,y,r=5)=>`<path d="M${x-r} ${y}Q${x} ${y} ${x} ${y-r}Q${x} ${y} ${x+r} ${y}Q${x} ${y} ${x} ${y+r}Q${x} ${y} ${x-r} ${y}" fill="#e1c78a"/>`;
const dots=Array.from({length:76},(_,i)=>`<circle cx="${56+i*137%608}" cy="${102+i*199%757}" r="${i%9===0?2.7:1.15}" fill="#e9d9ac" opacity="${.3+i%4*.14}"/>`).join('');
function frame(title,index,subtitle,inside,colors){const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 1080">
<defs><linearGradient id="bg" x2=".8" y2="1"><stop stop-color="${colors[0]}"/><stop offset="1" stop-color="${colors[1]}"/></linearGradient><linearGradient id="gold" x2="1" y2="1"><stop stop-color="#927144"/><stop offset=".35" stop-color="#f5dda1"/><stop offset=".6" stop-color="#af8a4f"/><stop offset="1" stop-color="#edcf8a"/></linearGradient><radialGradient id="halo"><stop stop-color="${colors[2]}" stop-opacity=".45"/><stop offset="1" stop-color="${colors[2]}" stop-opacity="0"/></radialGradient><linearGradient id="body" x2=".2" y2="1"><stop stop-color="#b2d5cc"/><stop offset=".45" stop-color="#75aeb0"/><stop offset="1" stop-color="#355e71"/></linearGradient><linearGradient id="sand" x2="0" y2="1"><stop stop-color="#e2ab76"/><stop offset="1" stop-color="#79484a"/></linearGradient></defs>
<rect width="720" height="1080" rx="24" fill="url(#bg)"/><rect x="21" y="21" width="678" height="1038" rx="18" stroke="url(#gold)" stroke-width="3" fill="none"/><rect x="33" y="33" width="654" height="1014" rx="12" stroke="#beaa74" stroke-opacity=".4" fill="none"/>
${dots}<ellipse cx="360" cy="444" rx="315" ry="360" fill="url(#halo)"/>
<path d="M61 143V66H141M579 66H659V143M61 937V1014H141M579 1014H659V937" stroke="url(#gold)" stroke-width="4" fill="none"/>
<path d="M55 184L55 897M665 184V897" stroke="#dfc386" stroke-opacity=".25"/>
<text x="360" y="92" font-family="Georgia,serif" font-size="22" letter-spacing="7" text-anchor="middle" fill="#d8be86">ASTRAL ARCHIVE</text>
<text x="360" y="125" font-family="Georgia,serif" font-size="11" letter-spacing="5" text-anchor="middle" fill="#a89e80">${subtitle}</text>
${inside}
<path d="M93 900H291M429 900H627" stroke="url(#gold)"/>
${star(360,900,15)}${star(301,900,4)}${star(419,900,4)}
<text x="360" y="963" font-family="'Microsoft YaHei','SimSun',serif" font-size="39" letter-spacing="13" text-anchor="middle" fill="#efdbac">${title}</text>
<text x="360" y="1002" font-family="Georgia,serif" font-size="12" letter-spacing="5" text-anchor="middle" fill="#b9ad8b">VOLUME I  ·  SPECIMEN ${index}</text>
</svg>`;return svg.replace(/id="([^"]+)"/g,(_,id)=>`id="${id}-${index}"`).replace(/url\(#([^)]+)\)/g,(_,id)=>`url(#${id}-${index})`);}
const waves=Array.from({length:10},(_,i)=>`<path d="M58 ${710+i*15}Q155 ${665+i*17} 269 ${718+i*13}T664 ${711+i*13}" fill="none" stroke="${i%3?'#8fbdba':'#ddca91'}" stroke-width="${i%3?1.1:1.8}" opacity="${.28+i*.035}"/>`).join('');
const whale=`<circle cx="360" cy="450" r="253" fill="none" stroke="#c4bb91" stroke-opacity=".18"/><circle cx="360" cy="450" r="235" fill="none" stroke="#c4bb91" stroke-opacity=".1"/>
<path d="M121 347A254 254 0 0 1 564 297M176 658A250 250 0 0 0 613 485" fill="none" stroke="#cdb981" stroke-opacity=".4"/>
<circle cx="470" cy="295" r="93" fill="#e7d9b1"/><circle cx="502" cy="267" r="86" fill="#173d4b"/>
<circle cx="426" cy="313" r="6" fill="#d6c699" opacity=".55"/><circle cx="441" cy="339" r="10" fill="#d6c699" opacity=".35"/>
${star(207,243,10)}${star(129,468,7)}${star(576,604,9)}
<path d="M108 535C155 450 276 429 387 473C439 493 476 515 508 498L565 418L558 500L607 475L575 540C528 566 475 601 414 624C288 675 160 637 108 567Q95 551 108 535Z" fill="url(#body)" stroke="#afcfbb" stroke-width="1.8"/>
<path d="M107 555C180 594 275 609 373 586C446 570 489 545 528 533C486 578 461 605 414 624C288 675 160 637 108 567Z" fill="#dbe4c8"/>
<path d="M292 575Q330 613 360 657Q308 655 272 606" fill="#568b98" stroke="#a9c9bd"/>
<path d="M359 466L389 433L408 482" fill="#77a6ac"/>
<path d="M143 534Q212 490 315 509M163 548Q236 512 330 534M195 569Q260 547 344 550" fill="none" stroke="#d0e0ca" stroke-opacity=".36" stroke-width="2"/>
<path d="M153 581Q190 602 236 601" fill="none" stroke="#315465" stroke-width="2"/>
<circle cx="159" cy="546" r="6" fill="#153b48"/><circle cx="157" cy="544" r="1.7" fill="#e4eacb"/>
<path d="M267 458Q249 417 278 390M278 441Q289 406 312 400" fill="none" stroke="#b6d4c6" stroke-width="2" opacity=".8"/>
${waves}<path d="M146 802L223 774L296 805L382 763L489 802L579 766" stroke="#c9b47f" stroke-opacity=".4" fill="none"/>${[ [146,802],[223,774],[296,805],[382,763],[489,802],[579,766]].map(([x,y])=>star(x,y,4)).join('')}
<text x="101" y="356" fill="#a7bcac" font-family="Georgia" font-size="12" letter-spacing="3" transform="rotate(-65 101 356)">MARE TRANQUILLITATIS</text>`;
const dunes=Array.from({length:5},(_,i)=>`<path d="M55 ${650+i*44}Q${185+i*39} ${545+i*50} 383 ${667+i*35}T665 ${640+i*45}V879H55Z" fill="${['#ba8264','#d5a070','#b8795c','#96604f','#72434a'][i]}"/><path d="M55 ${657+i*44}Q${185+i*39} ${552+i*50} 383 ${674+i*35}T665 ${647+i*45}" stroke="#e3b47c" opacity=".3" fill="none"/>`).join('');
const tower=`<circle cx="360" cy="445" r="252" fill="none" stroke="#d8b98b" stroke-opacity=".24"/><circle cx="222" cy="314" r="79" fill="#e8c98d"/><circle cx="222" cy="314" r="94" fill="none" stroke="#d8b98b" stroke-opacity=".4"/>
<path d="M58 488L164 391L244 471L322 382L462 488L564 391L665 467V756H55" fill="#785157" opacity=".7"/>
${star(479,244,12)}${star(580,350,7)}<path d="M440 286L479 244L544 269" stroke="#d8b98b" opacity=".45" fill="none"/>
${dunes}
<path d="M292 694L316 415H413L439 694" fill="url(#sand)" stroke="#e9bf83" stroke-width="2"/>
<path d="M373 417H413L439 694H387" fill="#8b5550" opacity=".65"/>
<path d="M301 416H427L414 393H315Z" fill="#ddae79" stroke="#edc98a"/>
<path d="M309 391L364 332L419 391Z" fill="#b78164" stroke="#e8bf83" stroke-width="2"/>
<path d="M364 332V306" stroke="#ddc188" stroke-width="3"/>${star(364,303,6)}
<path d="M323 419V473H405V419" fill="#edc781"/><path d="M337 426V469M364 421V471M391 426V469" stroke="#825455" stroke-width="7"/>
<rect x="310" y="475" width="112" height="13" rx="2" fill="#75494c" stroke="#d7a673"/>
<path d="M311 514H422M309 522H423M303 573H428M300 581H430M296 632H435" stroke="#7f514e" stroke-width="3" opacity=".6"/>
<path d="M337 691V637Q364 602 390 637V691Z" fill="#402f40" stroke="#d2a372" stroke-width="2"/>
<path d="M350 690V645Q364 626 376 645V690" fill="#b47858"/>
<path d="M323 503V600M402 504V594" stroke="#efc68b" opacity=".45"/>
<path d="M297 691H440L450 709H285Z" fill="#d2a071" stroke="#dcb47e"/>
<path d="M363 710Q409 759 316 789T314 869" stroke="#dcb481" stroke-width="18" fill="none" opacity=".45"/>
<path d="M338 443L161 493M390 443L582 474" stroke="#edcb88" stroke-width="2" opacity=".65"/>
<text x="595" y="541" fill="#d5b88a" font-family="Georgia" font-size="11" letter-spacing="3" transform="rotate(65 595 541)">LUX IN ARENA</text>`;
fs.writeFileSync(path.join(out,'moon-whale.svg'),frame('月潮之鲸','001','THE TIDE OF DISTANT MOONS',whale,['#102833','#173f50','#62a4a6']));
fs.writeFileSync(path.join(out,'sand-tower.svg'),frame('赤砂之塔','002','A LIGHT BEYOND THE DUNES',tower,['#382c3d','#68444b','#d59d67']));
console.log('Built two editable card masters with one shared frame.');
