async (page) => {
  const assert=(ok,msg)=>{if(!ok)throw new Error(msg);};
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize({width:1440,height:1000});
  await page.goto('http://127.0.0.1:5173/desk3d/index.html');
  await page.evaluate(()=>localStorage.removeItem('fragment-desk3d-art-v1'));
  await page.reload(); await page.waitForFunction(()=>window.deskStudy?.ready);
  await page.waitForTimeout(1500);
  const stats=await page.evaluate(()=>deskStudy.snapshot);
  await page.click('#artButton');await page.waitForSelector('#artDialog[open]');
  assert(await page.locator('#artCards svg').count()===2,'two illustrated card masters');
  await page.screenshot({path:'output/playwright/desk3d-art.png'});
  await page.click('#closeArt');
  await page.screenshot({path:'output/playwright/desk3d-desktop.png'});
  const point=async(kind,c,p)=>page.evaluate(([k,c,p])=>deskStudy.screenPoint(k,c,p),[kind,c,p]);
  const click=async(kind,c,p)=>{const q=await point(kind,c,p);await page.mouse.click(q.x,q.y);};
  await click('piece',1,0);await click('slot',0,0);
  assert((await page.evaluate(()=>deskStudy.snapshot)).placed.flat().length===0,'wrong-card rejection');
  await page.waitForTimeout(400);
  // Actual ray-cast drag, then remaining pieces through the supported click interaction.
  const a=await point('piece',0,0),b=await point('slot',0,0);
  await page.mouse.move(a.x,a.y);await page.mouse.down();await page.mouse.move(b.x,b.y,{steps:15});await page.mouse.up();
  assert((await page.evaluate(()=>deskStudy.snapshot)).placed[0].includes(0),'drag to slot');
  for(let p=1;p<6;p++){await click('piece',0,p);await click('slot',0,p);await page.waitForTimeout(220);}
  await page.waitForFunction(()=>deskStudy.snapshot.inspecting===0);await page.waitForTimeout(800);
  await page.screenshot({path:'output/playwright/desk3d-inspection.png'});
  await page.click('#flipCard');await page.waitForTimeout(550);
  assert(await page.evaluate(()=>deskStudy.snapshot.flipped),'flip');
  await page.screenshot({path:'output/playwright/desk3d-back.png'});
  await page.click('#storeCard');await page.waitForFunction(()=>deskStudy.snapshot.stored[0]);
  await page.waitForTimeout(400);
  for(let p=0;p<6;p++){await click('piece',1,p);await click('slot',1,p);await page.waitForTimeout(220);}
  await page.waitForFunction(()=>deskStudy.snapshot.inspecting===1);await page.waitForTimeout(800);
  await page.click('#storeCard');await page.waitForFunction(()=>deskStudy.snapshot.stored.every(Boolean));
  await page.waitForSelector('#albumDialog[open]');
  await page.screenshot({path:'output/playwright/desk3d-album.png'});
  await page.click('#closeAlbum');await page.reload();await page.waitForFunction(()=>window.deskStudy?.ready);
  assert(await page.evaluate(()=>deskStudy.snapshot.stored.every(Boolean)),'save reload');
  await page.click('#viewFlat');
  assert(await page.evaluate(()=>deskStudy.snapshot.view==='flat'&&!deskStudy.snapshot.shadowEnabled&&deskStudy.snapshot.gloss===0),'flat controls');
  await page.screenshot({path:'output/playwright/desk3d-flat.png'});
  await page.click('#view3d');await page.uncheck('#shadows');await page.uncheck('#finish');
  assert(await page.evaluate(()=>!deskStudy.snapshot.shadowEnabled&&deskStudy.snapshot.gloss===0),'quality toggles');
  await page.check('#shadows');await page.check('#finish');await page.click('#zoomIn');await page.click('#zoomReset');
  await page.setViewportSize({width:390,height:844});await page.waitForTimeout(300);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'mobile overflow');
  await page.screenshot({path:'output/playwright/desk3d-mobile.png',fullPage:true});
  assert(errors.length===0,errors.join('\n'));
  // Leave the testing origin ready for another playthrough. User's file save is separate.
  await page.evaluate(()=>localStorage.removeItem('fragment-desk3d-art-v1'));
  await page.setViewportSize({width:1440,height:1000});await page.reload();await page.waitForFunction(()=>window.deskStudy?.ready);
  return {passed:true,stats,pageErrors:errors};
}
