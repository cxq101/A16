async (page) => {
 const check=(x,m)=>{if(!x)throw Error(m);};
 await page.setViewportSize({width:1440,height:1100});
 await page.evaluate(()=>{localStorage.removeItem('fragment-atelier-v2');localStorage.setItem('fragment-atelier-v1',JSON.stringify({mode:'high',active:2,placed:[[0,1,2,3,4,5],[0,1,2,3,4,5],[2],[],[],[]],hints:2}));});
 await page.reload();
 check(await page.locator('#albumCount').innerText()==='2 / 12 张','Old completed cards migrate');
 check(await page.locator('.slot.filled').count()===1,'Old partial card migrates');
 check(await page.locator('#highlight').isEnabled(),'Old progress unlocks upgrade');
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('fragment-atelier-v2')));
 check(saved.placed.length===12&&saved.placed[6].length===0,'New cards start empty');
 await page.evaluate(()=>{localStorage.removeItem('fragment-atelier-v1');localStorage.removeItem('fragment-atelier-v2');});await page.reload();
 check(await page.locator('.piece').count()===12,'Low mix: 12 pieces');
 check(await page.locator('#highlight').isDisabled(),'Upgrade starts locked');
 check(await page.locator('#galleryButton').isDisabled(),'Gallery starts locked');
 await page.locator('#high').click();check(await page.locator('.piece').count()===36,'High mix: 36 pieces');
 await page.locator('[data-series="1"]').click();
 check(await page.locator('.piece').count()===36,'Second series has 36 pieces');
 check(await page.locator('.piece[data-c="0"]').count()===0,'Series stay separate');
 check(await page.locator('body').getAttribute('data-theme')==='workshop','Workshop theme applied');
 await page.locator('[data-series="0"]').click();await page.locator('#low').click();
 await page.locator('.piece[data-c="1"][data-p="0"]').click();await page.locator('[data-slot="0"]').click();
 check(await page.locator('.slot.filled').count()===0,'Wrong card rejected');
 await page.waitForFunction(()=>!document.querySelector('#board').getAnimations().length);
 await page.locator('.piece[data-c="0"][data-p="0"]').dragTo(page.locator('[data-slot="0"]'));
 check(await page.locator('.slot.filled').count()===1,'Drag/drop works');
 await page.reload();check(await page.locator('.slot.filled').count()===1,'Partial progress saved');
 await page.locator('#reference').click();check(await page.locator('.reference-image').count()===1,'Reference works');await page.locator('#reference').click();
 await page.locator('#hint').click();check(await page.locator('.slot.hint').count()===1,'Hint works');
 for(let c=0;c<12;c++){
  await page.locator(`[data-card="${c}"]`).click();
  for(let p=0;p<6;p++){const piece=page.locator(`.piece[data-c="${c}"][data-p="${p}"]`);if(await piece.count()){await piece.click();await page.locator(`[data-slot="${p}"]`).click();}}
  check(await page.locator('#completion').isVisible(),`Card ${c} completes`);
  if(c===0)check(await page.locator('#highlight').isDisabled(),'One card does not unlock upgrade');
  if(c===1){
   check((await page.locator('#completeText').innerText()).includes('新能力'),'Unlock announced');
   await page.locator('#continue').click();await page.locator('#highlight').click();
   check(await page.locator('.same-card').count()===6,'Highlight marks six fragments');
   await page.locator('[data-card="3"]').click();
   check(await page.locator('.same-card[data-c="3"]').count()===6,'Highlight follows active card');
   check(await page.locator('.same-card[data-c="2"]').count()===0,'Other fragments not marked');
   await page.reload();check(await page.locator('#highlight').getAttribute('aria-pressed')==='true','Upgrade setting saved');
   await page.locator('#highlight').click();check(await page.locator('.same-card').count()===0,'Highlight switches off');
   await page.locator('#high').click();continue;
  }
  await page.locator('#continue').click();
  if(c===5||c===11){
   check(await page.locator('#gallery').isVisible(),'Series exhibition opens');
   check(await page.locator('#galleryCards figure').count()===6,'Exhibition displays six cards');
   await page.screenshot({path:`output/playwright/gallery-${Math.floor(c/6)}.png`,fullPage:true});
   if(c===5){await page.locator('#nextSeries').click();check(await page.locator('#cardName').innerText()==='午后三点','Next series starts');check(await page.locator('.piece').count()===36,'Next tray complete');}
   else await page.locator('#closeGallery').click();
  }
 }
 check(await page.locator('#albumCount').innerText()==='12 / 12 张','All twelve collected');
 check(await page.locator('#placedCount').innerText()==='72 / 72','All 72 pieces placed');
 await page.reload();check(await page.locator('#albumCount').innerText()==='12 / 12 张','Final progress saved');
 await page.locator('#galleryButton').click();await page.setViewportSize({width:390,height:844});
 check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Mobile gallery fits');
 await page.screenshot({path:'output/playwright/gallery-mobile.png',fullPage:true});await page.locator('#closeGallery').click();
 await page.evaluate(()=>localStorage.removeItem('fragment-atelier-v2'));await page.reload();
 check(await page.locator('#highlight').isDisabled(),'Fresh save relocks upgrade');
 check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Mobile desk fits');
 await page.screenshot({path:'output/playwright/mobile-v2.png',fullPage:true});
 await page.setViewportSize({width:1440,height:1100});await page.locator('[data-series="1"]').click();
 await page.screenshot({path:'output/playwright/workshop-v2.png',fullPage:true});await page.locator('[data-series="0"]').click();
 await page.screenshot({path:'output/playwright/desktop-v2.png',fullPage:true});
 return 'PASS: V1 migration; two series; low/high mixing; drag/drop; rejection; upgrade unlock, toggle and persistence; all 12 cards; both exhibitions; next series; mobile layout';
}
