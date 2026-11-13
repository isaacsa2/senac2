import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script,runInNewContext} from 'node:vm';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const html=read('public/index.html');
const app=read('public/app.js');
const scene=read('public/scene.js');
const game=read('public/game.js');

test('scripts are syntactically valid',()=>{
  for(const [path,content] of [['app.js',app],['scene.js',scene],['game.js',game]]){
    assert.doesNotThrow(()=>new Script(content.replace(/^import\s+.*?;\s*$/gm,''),{filename:path}));
  }
});
test('six pumps and six user-specified fuel IDs are present',()=>{
 const ids=['gasolina-comum','gasolina-nitro','gasolina-racing','etanol-comum','diesel-s10','diesel-s500'];
 for(const id of ids){assert.match(app,new RegExp("id:'"+id+"'"));assert.match(game,new RegExp("id:'"+id+"'"));}
 assert.equal((scene.match(/^\s*dispenser\(/gm)||[]).length,6);
});
test('backend-less 3D and game have all expected UI elements',()=>{
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(new Set(ids).size,ids.length,'duplicate HTML IDs');
 for(const id of ['scene-stage','scene-canvas','start-game','game-hud','fuel-dialog','fuel-product-name','fuel-vehicle','fuel-target','fuel-start','fuel-pause','fuel-finish','fuel-litres','fuel-amount','fuel-progress-bar','game-interact','game-touch-pad','products-grid','cart-items','checkout-btn']){
  assert.ok(ids.includes(id),id+' missing');
 }
});
test('compatible vehicle and decimals are enforced',()=>{
 assert.match(game,/function compatible\(/);
 assert.match(game,/pump\.type==='diesel-antigo'/);
 assert.match(game,/stepFuel\(t,token\)/);
 assert.match(app,/Math\.round\(p\.price\*e\.qty\)/);
 assert.match(app,/ecoposto:fill-complete/);
});
test('product images remain optional and details are reachable',()=>{
 assert.match(app,/real-product-image/);
 assert.match(app,/ecoposto:show-product/);
 assert.match(scene,/scene-product/);
 assert.match(scene,/CONVENIÊNCIA/);
 assert.match(scene,/TROCA DE ÓLEO/);
});


test('payment simulator covers Pix terminal, card and physical cash',()=>{
  const css=read('public/styles.css');
  for(const id of ['payment-dialog','payment-device','card-virtual','fake-qr','terminal-confirm','card-type','cash-group','cash-received','cash-change','finish-sale']){
    assert.match(html,new RegExp('id="'+id+'"'));
  }
  assert.match(app,/function makeFakeQr\(/);
  assert.match(app,/function confirmTerminal\(/);
  assert.match(app,/paymentApproved/);
  assert.match(app,/data-cash-bill/);
  assert.match(css,/\.fake-qr\[hidden\]/);
  assert.match(css,/@media\(max-width:680px\)/);
});
test('game redraw API and dynamic shop are connected',()=>{
  assert.match(scene,/getContext:\(\)=>\(\{[^}]*requestRender:queueDraw/);
  assert.match(game,/ecoCatalog\?\.catalog/);
  assert.match(game,/game-shop-checkout/);
  assert.match(game,/game-shop-search-input/);
});
test('expanded catalog has real-brand entries and mock prices',()=>{
  const context={window:{}};
  runInNewContext(read('public/catalog-extra.js'),context);
  const extra=context.window.ECO_EXTRAS;
  assert.equal(extra.length,31);
  assert.equal(extra.filter(x=>x.category==='cuidados').length,9);
  assert.equal(extra.filter(x=>x.category==='conveniencia').length,22);
  assert.equal(new Set(extra.map(x=>x.id)).size,extra.length);
  for(const p of extra)assert.ok(Number.isInteger(p.price)&&p.price>=0);
});


test('immersive version: fullscreen, camera, quality and checkout stations',()=>{
  const scene=read('public/scene.js');
  const game=read('public/game.js');
  const app=read('public/app.js');
  const css=read('public/styles.css');
  const idMatches=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  for(const id of ['fullscreen-scene','graphics-quality','reset-camera','start-game','scene-stage','scene-canvas']){
    assert.ok(idMatches.includes(id),'Missing '+id);
  }
  assert.match(app,/requestFullscreen/);
  assert.match(app,/fullscreenchange/);
  assert.match(app,/fullscreen-fallback/);
  assert.match(app,/ecoposto:open-payment/);
  assert.match(scene,/function setQuality/);
  assert.match(scene,/function setNight/);
  assert.match(scene,/cameraObstacles/);
  assert.match(scene,/PointLight/);
  assert.match(scene,/PC de caixa completo/);
  assert.match(scene,/Terminal autônomo na pista/);
  assert.match(game,/function toggleCamera/);
  assert.match(game,/cameraRig.firstPerson/);
  assert.match(game,/pointermove/);
  assert.match(game,/ecoCatalog/);
  assert.match(game,/new Event\('ecoposto:open-payment'\)/);
  assert.match(css,/scene-card:fullscreen/);
  assert.match(css,/scene-fullscreen-open/);
});

test('new scene modules keep their JavaScript syntax valid',()=>{
  for(const path of ['public/scene.js','public/game.js','public/app.js']){
    assert.doesNotThrow(()=>new Script(read(path).replace(/^import\s+.*?;\s*$/gm,''),{filename:path}));
  }
});
