async(page)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1440,height:1000});
 await page.goto('http://127.0.0.1:5173/desk3d/index.html');await page.waitForFunction(()=>window.deskStudy?.ready);
 await page.click('#artButton');
 const assets=await page.evaluate(()=>[...document.querySelectorAll('#artCards svg')].map(svg=>({ids:[...svg.querySelectorAll('[id]')].map(n=>n.id),stops:[...svg.querySelectorAll('linearGradient:first-of-type stop')].map(n=>n.getAttribute('stop-color'))})));
 if(assets[0].ids.some(id=>assets[1].ids.includes(id)))throw new Error('SVG definition ID collision');
 if(assets[0].stops[0]===assets[1].stops[0])throw new Error('card palettes should differ');
 await page.screenshot({path:'output/playwright/desk3d-art.png'});await page.click('#closeArt');
 await page.waitForTimeout(3000);const samples=[];
 for(let i=0;i<4;i++){await page.waitForTimeout(1100);samples.push(await page.evaluate(()=>deskStudy.snapshot.fps));}
 await page.setViewportSize({width:1280,height:720});await page.waitForTimeout(300);
 await page.screenshot({path:'output/playwright/desk3d-720p.png'});
 const visible=await page.locator('#album').evaluate(el=>el.getBoundingClientRect().bottom<=innerHeight);
 if(!visible)throw new Error('main controls below 720p viewport');
 await page.goto('http://127.0.0.1:5173/desk3d/study.html');await page.waitForFunction(()=>window.deskStudy?.ready);
 if(errors.length)throw new Error(errors.join('\n'));
 return {artPassed:true,svgPalettes:assets.map(a=>a.stops),warmFPS:samples,previousStudyPassed:true};
}
