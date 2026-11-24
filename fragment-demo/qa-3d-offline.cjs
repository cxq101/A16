async (page) => {
  const requests=[];page.on('request',r=>requests.push(r.url()));
  await page.goto('http://127.0.0.1:5173/desk3d-standalone.html');
  await page.waitForFunction(()=>window.deskStudy?.ready);
  await page.waitForTimeout(1500);
  if(requests.filter(u=>/^https?:/.test(u)).length!==1)throw new Error('Standalone requested additional network asset');
  const result=await page.evaluate(()=>({...deskStudy.snapshot,originalLink:document.querySelector('#original').getAttribute('href')}));
  if(result.originalLink!=='demo.html')throw new Error('original link');
  return {standalonePassed:true,additionalNetworkRequests:0,measurement:result};
}
