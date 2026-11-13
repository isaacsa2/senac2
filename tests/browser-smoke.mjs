import {chromium} from 'playwright';
import assert from 'node:assert/strict';

/**
 * Smoke real em navegador: valida a cena, entrada no jogo, movimento, clima,
 * gestão de estoque e pagamento de treinamento.
 *
 * Requer servidor HTTP na porta 8765 e WebGL disponível no Chromium.
 */
const errors=[];
const browser=await chromium.launch({
  headless:true,args:['--enable-webgl','--use-angle=swiftshader','--ignore-gpu-blocklist','--no-sandbox']
});
const page=await browser.newPage({viewport:{width:1280,height:800},deviceScaleFactor:1});
page.on('pageerror',error=>errors.push(String(error)));
try{
  await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded',timeout:20000});
  await page.waitForFunction(()=>Boolean(window.ecoScene&&window.ecoGame&&window.ECO_OPERATIONS),{timeout:45000});
  console.log('Scene initialized');
  // As calçadas elevadas nunca podem atravessar a via lateral.
  const sidewalks=await page.evaluate(()=>window.ecoScene.getSidewalkSegments());
  assert.equal(sidewalks.length,6,'two split sidewalk strips, three segments each');
  for(const p of sidewalks){
    const x0=p.x-p.width/2,x1=p.x+p.width/2;
    assert.ok(x1< -19.6||x0> -14.4,'sidewalk over west side road');
    assert.ok(x1< 14.4||x0> 19.6,'sidewalk over east side road');
  }
  const collisions=[];
  for(let iteration=0;iteration<6;iteration++){
    const snapshot=await page.evaluate(()=>window.ecoScene.getTrafficCars());
    const hits=await page.evaluate(async cars=>{
      const {trafficEnvelope,trafficOverlaps}=await import('./traffic-paths.js?v=street-v8');
      const result=[];
      for(let i=0;i<cars.length;i++)for(let j=i+1;j<cars.length;j++){
        if(trafficOverlaps(trafficEnvelope(cars[i]),trafficEnvelope(cars[j]),0))
          result.push([cars[i].id,cars[j].id]);
      }
      return result;
    },snapshot);
    collisions.push(...hits);
    await page.waitForTimeout(220);
  }
  assert.deepEqual(collisions,[],'traffic vehicles have overlapping bodies');
  await page.screenshot({path:'ecoposto-desktop.png',fullPage:true});
  assert.equal(await page.locator('#products-grid .product-card').count(),45);
  // CPU-based WebGL em CI precisa da qualidade econômica para manter resposta.
  await page.locator('#graphics-quality').selectOption('economico');
  await page.locator('#traffic-density').selectOption('baixo');
  await page.locator('#start-game').click();
  await page.waitForFunction(()=>window.ecoGame?.isActive(),{timeout:8000});
  await page.waitForTimeout(300);
  const before=await page.evaluate(()=>window.ecoGame.getDebugState());
  await page.keyboard.down('w');
  const pressed=await page.evaluate(()=>window.ecoGame.getDebugState());
  await page.waitForTimeout(1400);
  const moving=await page.evaluate(()=>window.ecoGame.getDebugState());
  await page.keyboard.up('w');
  const after=await page.evaluate(()=>window.ecoGame.getDebugState());
  console.log('Movement diagnostic:',JSON.stringify({before,pressed,moving,after}));
  assert.ok(Math.hypot(after.position.x-before.position.x,after.position.z-before.position.z)>.10,
    'attendant did not walk; debug: '+JSON.stringify({before,pressed,moving,after}));
  await page.waitForFunction(()=>window.ecoGame?.getCustomerState()==='parked',{timeout:26000});
  assert.ok(await page.evaluate(()=>Boolean(window.ecoGame.currentCustomer()?.fuelId)),
    'arriving customer has no valid fuel request');
  console.log('Attendant moved and first customer parked');
  await page.locator('#open-operations-game').click();
  await page.waitForFunction(()=>document.querySelector('#operations-dialog')?.open);
  assert.equal(await page.locator('#ops-tanks .ops-tank').count(),6);
  await page.locator('#ops-delivery-litres').fill('500');
  await page.locator('#ops-deliver').click();
  const feedback=await page.locator('#ops-delivery-feedback').innerText();
  assert.match(feedback,/Entrega registrada/);
  await page.locator('#close-operations').click();
  console.log('Management panel and stock delivery working');
  await page.locator('#exit-game').click();
  await page.locator('#weather-mode').selectOption('chuva');
  await page.waitForFunction(()=>document.querySelector('#scene-stage')?.classList.contains('rain-mode'));
  await page.locator('#weather-mode').selectOption('limpo');
  assert.equal(await page.locator('#scene-stage').evaluate(node=>node.classList.contains('rain-mode')),false);
  console.log('Weather transitions working');
  await page.locator('[data-add="cafe-espresso"]').click();
  await page.locator('[data-open-cart]').first().click();
  await page.locator('#checkout-btn').click();
  await page.waitForFunction(()=>document.querySelector('#payment-dialog')?.open);
  await page.locator('input[name="payment"][value="dinheiro"]').check();
  await page.locator('[data-cash-centavos="2000"]').click();
  assert.equal(await page.locator('#finish-sale').isEnabled(),true);
  await page.locator('#finish-sale').click();
  await page.waitForFunction(()=>document.querySelector('#receipt-dialog')?.open);
  assert.match(await page.locator('#receipt-content').innerText(),/SIMULAÇÃO/);
  console.log('Cash transaction and receipt working');
  assert.deepEqual(errors,[],'Uncaught browser JavaScript errors');
  // Viewport móvel: detectar vazamentos laterais e interfaces fora da tela.
  const mobile=await browser.newPage({viewport:{width:390,height:844},
    deviceScaleFactor:1,isMobile:true,hasTouch:true});
  mobile.on('pageerror',error=>errors.push(String(error)));
  await mobile.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded',timeout:20000});
  await mobile.waitForFunction(()=>Boolean(window.ecoScene&&window.ECO_OPERATIONS),{timeout:45000});
  await mobile.locator('#graphics-quality').selectOption('economico');
  const sizes=await mobile.evaluate(()=>({
    viewport:document.documentElement.clientWidth,document:document.documentElement.scrollWidth,
    scene:document.querySelector('#scene-stage').getBoundingClientRect().width,
    toolbar:document.querySelector('.scene-toolbar').getBoundingClientRect().width
  }));
  console.log('Mobile layout:',JSON.stringify(sizes));
  assert.ok(sizes.document<=sizes.viewport+2,'horizontal overflow on 390px viewport');
  await mobile.screenshot({path:'ecoposto-mobile.png',fullPage:true});
  await mobile.locator('#open-operations-toolbar').click();
  assert.equal(await mobile.locator('#operations-dialog').evaluate(el=>el.open),true);
  const dlg=await mobile.locator('.operations-shell').evaluate(el=>({
    width:el.getBoundingClientRect().width,scroll:el.scrollWidth
  }));
  assert.ok(dlg.scroll<=dlg.width+2,'management dialog horizontal overflow on mobile');
  await mobile.locator('#close-operations').click();
  await mobile.close();
  assert.deepEqual(errors,[],'Uncaught browser JavaScript errors');
  console.log('Browser smoke: all checks passed');
}catch(err){
  const errorLog=errors.length?'\nPage errors:\n'+errors.join('\n'):'';
  const screenshot='browser-smoke-failed.png';
  try{await page.screenshot({path:screenshot,fullPage:true});}catch{}
  throw new Error(String(err)+errorLog);
}finally{
  await browser.close();
}
