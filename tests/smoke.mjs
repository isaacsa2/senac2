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
 assert.equal((scene.match(/for\(const island of islands\)dispenser\(island\)/g)||[]).length,1);
 assert.match(scene,/title:'FLEX'/);assert.match(scene,/title:'DIESEL'/);assert.match(scene,/title:'PREMIUM'/);
 assert.match(scene,/3 BICOS/);assert.match(scene,/2 BICOS/);assert.match(scene,/1 BICO/);
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
  assert.match(app,/data-cash-centavos/);
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
  assert.match(scene,/Balcão do PDV do lado direito/);
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


test('Brazilian cash, card failure simulation, credit ledger',()=>{
 const store=new Map(),scope={window:{},Date,Math,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)}};
 runInNewContext(read('public/sim-core.js'),scope);
 const sim=scope.window.ECO_SIM;
 assert.equal(sim.DENOMS.length,12);
 assert.equal(sim.DENOMS.filter(x=>x.kind==='note').length,7);
 assert.equal(sim.DENOMS.filter(x=>x.kind==='coin').length,5);
 for(const cents of [0,1,7,89,121,2189,10433,19999]){
   const adjusted=sim.cashAdjustment(cents);
   assert.equal(adjusted.original,cents);
   assert.equal(adjusted.due+adjusted.discount,cents);
   assert.equal(adjusted.due%5,0);
   assert.equal(sim.denominationsValue(sim.changeFor(adjusted.due)),adjusted.due);
   assert.ok(adjusted.discount>=0&&adjusted.discount<5);
 }
 assert.equal(sim.DENOMS.some(d=>d.value===1),false);
 assert.equal(sim.changeFor(7).length,0,'cannot return 1/2-cent coins');
 sim.setConfig({forced:'read_error'});
 assert.equal(sim.machineOutcome().code,'read_error');
 sim.setConfig({forced:'approved'});
 assert.equal(sim.machineOutcome().ok,true);
 const d=new Date();d.setDate(d.getDate()+30);
 const due=d.toISOString().slice(0,10);
 const item=sim.saveCredit({customer:'Cliente Demo',due,amount:4999,plate:'DEMO-001'});
 assert.equal(item.status,'open');
 assert.equal(sim.receivables().length,1);
 assert.equal(sim.settleCredit(item.id),true);
 assert.equal(sim.receivables()[0].status,'paid');
 assert.throws(()=>sim.saveCredit({customer:'Cliente Demo',due,amount:170000}));
 assert.equal(sim.createCustomer(3).kind,'diesel');
});
test('Brazilian pump islands, interior and surrounding animation',()=>{
 const world=read('public/world-extra.js');
 for(const id of ['nozzle-dialog','nozzle-options','customer-hud','customer-next','customer-release','credit-group','pos-computer','pos-open-payment','machine-scenario','card-operation','cash-denominations']){
   assert.match(html,new RegExp('id="'+id+'"'));
 }
 assert.match(html,/src="\.\/sim-core\.js(?:\?[^\"]+)?"/);
 assert.match(scene,/createDistrict/);assert.match(scene,/shopDoors/);
 assert.match(scene,/setShopOpen/);assert.match(scene,/function animateAmbient/);
 assert.match(game,/function createQueueCar/);
 assert.match(game,/function animateCustomer/);
 assert.match(game,/function selectNozzle/);
 assert.match(game,/function releaseCar/);
 assert.match(game,/ecoposto:sale-complete/);
 for(const token of ['createVehicle','createTrafficCar','function building','walking','clouds']){
   assert.ok(world.includes(token));
 }
});
test('new modules compile and existing checkout workflow survives',()=>{
 for(const path of ['public/world-extra.js','public/sim-core.js']){
   assert.doesNotThrow(()=>new Script(read(path).replace(/^import\s+.*?;\s*$/gm,'').replace(/^export\s+/gm,''),{filename:path}));
 }
 assert.match(app,/sim\?\.machineOutcome\(\)/);
 assert.match(app,/sim\.saveCredit\(/);
 assert.match(app,/sim\?\.changeFor\(difference\)/);
 assert.match(app,/function openPosComputer\(/);
 assert.match(app,/ecoposto:sale-complete/);
});


test('regression: customer ID is distinct from fuel SKU, all six cars can find pump island',()=>{
  const source=read('public/sim-core.js');
  const store=new Map();
  const scope={
    window:{},Date,Math,
    localStorage:{
      getItem:key=>store.get(key)||null,
      setItem:(key,value)=>store.set(key,value)
    }
  };
  runInNewContext(source,scope);
  const sim=scope.window.ECO_SIM;
  const expected=[
    ['gasolina-comum','FLEX'],
    ['etanol-comum','FLEX'],
    ['gasolina-nitro','FLEX'],
    ['diesel-s10','DIESEL'],
    ['gasolina-racing','PREMIUM'],
    ['diesel-s500','DIESEL']
  ];
  const pumps=[...game.matchAll(/\{id:'([^']+)',name:'[^']+',x:[^,]+,z:[^,]+,type:'[^']+',island:'([^']+)'/g)]
    .map(match=>({fuelId:match[1],island:match[2]}));
  assert.equal(pumps.length,6,'six pumps indexed by fuel SKU');
  for(let i=0;i<18;i++){
    const order=sim.createCustomer(i);
    assert.match(order.id,/^CAR-\d{3}$/);
    assert.notEqual(order.id,order.fuelId,'customer identity must not overwrite fuel SKU');
    const [fuel,island]=expected[i%6];
    assert.equal(order.fuelId,fuel);
    const selected=pumps.find(p=>p.fuelId===order.fuelId);
    assert.ok(selected,'missing pump for '+order.fuelId);
    assert.equal(selected.island,island);
    assert.ok(order.capacity>=order.requested);
  }
  assert.doesNotMatch(game,/\border\.id\b/,'game must never use customer ID to find a pump');
  assert.match(game,/if\(!fuel\)/,'unknown fuel must not crash scene start');
  assert.match(game,/animId=requestAnimationFrame\(tick\);\s*if\(!currentCar\)createQueueCar\(\)/,
    'movement loop must start before optional queue generation');
});


test('vehicle wheels use a pivot on Z instead of spinning cylinder X',()=>{
 const world=read('public/world-extra.js');
 const game=read('public/game.js');
 const paths=read('public/traffic-paths.js');
 assert.match(world,/const pivot=new THREE\.Group\(\)/);
 assert.match(world,/tire\.rotation\.x=Math\.PI\/2/);
 assert.match(world,/pivot\.rotation\.z\+=angle/);
 assert.doesNotMatch(world,/wheel\.rotation\.z-=car\.dir/);
 assert.match(world,/wheelRotationForTravel\(metres,\.35\)/);
 assert.match(game,/customer\.group\.userData\.spinWheels\(step\)/);
 assert.match(world,/car\.model\.userData\.spinWheels\(moved\)/);
 assert.match(paths,/headingForTravel/);
 assert.match(paths,/rotateTowards/);
});
test('twelve traffic routes stay on the road map including every turn',()=>{
 const source=read('public/traffic-paths.js').replace(/^export\s+/gm,'');
 const sandbox={};
 runInNewContext(source+
  ';globalThis.ROADS_TEST={buildTrafficRoutes,pointOnRoad,sampleRoute,headingForTravel,rotateTowards,trafficLightPhase,wheelRotationForTravel};',sandbox);
 const fn=sandbox.ROADS_TEST;
 const routes=fn.buildTrafficRoutes();
 assert.equal(routes.length,12);
 let checked=0;
 for(const route of routes){
   assert.ok(route.length>18,'short route '+route.id);
   assert.ok(route.stops.length>0,'missing stops '+route.id);
   for(const p of route.samples){
     assert.ok(fn.pointOnRoad(p.x,p.z),'offroad '+route.id+' at '+p.x+','+p.z);
     checked++;
   }
   const end=fn.sampleRoute(route,route.length);
   assert.ok(Number.isFinite(end.heading));
 }
 assert.ok(checked>1500,'insufficient geometry sample coverage');
 assert.ok(Math.abs(fn.headingForTravel(0,1)+Math.PI/2)<1e-8);
 assert.ok(Math.abs(fn.headingForTravel(-1,0))>3.1);
 assert.equal(fn.wheelRotationForTravel(.35),-1);
 assert.equal(fn.trafficLightPhase(0),'ew');
 assert.equal(fn.trafficLightPhase(18),'all-red');
 assert.equal(fn.trafficLightPhase(25),'ns');
});
test('more vehicles, configurable traffic and upgraded city map',()=>{
 const html=read('public/index.html');
 const scene=read('public/scene.js');
 const game=read('public/game.js');
 const world=read('public/world-extra.js');
 const app=read('public/app.js');
 assert.match(html,/id="traffic-density"/);
 assert.match(html,/data-view="bairro"/);
 assert.match(scene,/setTrafficDensity:/);
 assert.match(scene,/bairro:\{position:/);
 assert.match(app,/function updateDensity\(\)/);
 assert.match(world,/maxTraffic=lowPower\?7:13/);
 assert.match(world,/intenso:17/);
 assert.match(world,/const variants=\['car','car','hatch','suv','pickup','van','bus'\]/);
 assert.match(world,/function setTrafficDensity/);
 assert.match(world,/trafficLightPhase\(sec\)/);
 assert.match(world,/function updateSignals/);
 assert.match(world,/const grass=surface/);
 assert.match(world,/Faixa de estacionamento/);
 assert.match(world,/ÔNIBUS/);
 assert.match(game,/createCustomer\(serial,Math\.floor\(Math\.random\(\)\*6\)\)/);
 assert.match(game,/function animateCustomer/);
});
