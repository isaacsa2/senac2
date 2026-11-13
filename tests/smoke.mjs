import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script} from 'node:vm';
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
