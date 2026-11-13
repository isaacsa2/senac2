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
  assert.equal(await page.locator('#products-grid .product-card').count(),45);
  await page.locator('#start-game').click();
  await page.waitForFunction(()=>window.ecoGame?.isActive(),{timeout:6000});
  const before=await page.evaluate(()=>window.ecoGame.getPlayerPosition());
  await page.keyboard.down('w');
  await page.waitForTimeout(460);
  await page.keyboard.up('w');
  const after=await page.evaluate(()=>window.ecoGame.getPlayerPosition());
  assert.ok(Math.hypot(after.x-before.x,after.z-before.z)>.10,'attendant did not walk');
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
  console.log('Browser smoke: all checks passed');
}catch(err){
  const errorLog=errors.length?'\nPage errors:\n'+errors.join('\n'):'';
  const screenshot='browser-smoke-failed.png';
  try{await page.screenshot({path:screenshot,fullPage:true});}catch{}
  throw new Error(String(err)+errorLog);
}finally{
  await browser.close();
}
