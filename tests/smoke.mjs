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
 assert.match(world,/maxTraffic=lowPower\?8:15/);
 assert.match(world,/intenso:19/);
 assert.match(world,/const variants=\['car','car','hatch','hatch','suv','pickup','van','bus','motorcycle'\]/);
 assert.match(world,/function setTrafficDensity/);
 assert.match(world,/trafficLightPhase\(sec\)/);
 assert.match(world,/function updateSignals/);
 assert.match(world,/const grass=surface/);
 assert.match(world,/Faixa de estacionamento/);
 assert.match(world,/ÔNIBUS/);
 assert.match(game,/createCustomer\(serial,Math\.floor\(Math\.random\(\)\*6\)\)/);
 assert.match(game,/function animateCustomer/);
});


test('V7 realistic station: quantity/value/full tank and stock accounting',()=>{
  const code=read('public/operations-core.js');
  const storage=new Map();
  const ctx={window:{},Date,Math,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)}};
  runInNewContext(code,ctx);
  const ops=ctx.window.ECO_OPERATIONS;
  assert.equal(ops.FUEL_IDS.length,6);
  assert.equal(ops.tank('gasolina-comum').litres,10500);
  const arg={fuelId:'gasolina-comum',unitPriceCents:625,tankFreeDeci:440};
  const byLitres=ops.planFill({...arg,mode:'litros',requestLitres:22.5});
  assert.equal(byLitres.ok,true);assert.equal(byLitres.deci,225);
  assert.equal(byLitres.totalCents,14063);
  const byMoney=ops.planFill({...arg,mode:'valor',requestCents:5000});
  assert.equal(byMoney.ok,true);assert.equal(byMoney.deci,80);assert.equal(byMoney.totalCents,5000);
  assert.equal(ops.planFill({...arg,mode:'completar'}).deci,440);
  assert.equal(ops.planFill({...arg,mode:'litros',requestLitres:45}).ok,false);
  assert.equal(ops.planFill({...arg,mode:'litros',requestLitres:1.25}).ok,false);
  assert.equal(ops.planFill({...arg,mode:'incorrect'}).ok,false);
  const before=ops.tank('gasolina-comum').deci;
  const receipt=ops.dispense('gasolina-comum',225,625);
  assert.equal(receipt.ok,true);assert.equal(receipt.amountCents,14063);
  assert.equal(ops.tank('gasolina-comum').deci,before-225);
  assert.equal(ops.dispense('gasolina-comum',999999,625).ok,false);
  assert.equal(ops.restock('gasolina-comum',9000).ok,false);
  assert.equal(ops.restock('gasolina-comum',500).ok,true);
  const ctx2={window:{},Date,Math,localStorage:ctx.localStorage};
  runInNewContext(code,ctx2);
  assert.equal(ctx2.window.ECO_OPERATIONS.tank('gasolina-comum').deci,before-225+5000);
});
test('V7 realistic station: payment reconciliation, customer experience and shift closure',()=>{
  const store=new Map(),ctx={window:{},Date,Math,
    localStorage:{getItem:key=>store.get(key)||null,setItem:(key,val)=>store.set(key,val)}};
  runInNewContext(read('public/operations-core.js'),ctx);
  const ops=ctx.window.ECO_OPERATIONS;
  for(const [method,amount] of [['pix',5000],['cartao',2000],['dinheiro',4500],['prazo',1000]]){
    assert.equal(ops.sale({method,amountCents:amount}),true);
  }
  assert.equal(ops.sale({method:'pix',amountCents:-1}),false);
  assert.equal(ops.customer({satisfaction:90,waitingSeconds:45}),90);
  ops.warning('Bico incorreto no exercício');
  const m=ops.snapshot().metrics;
  assert.equal(m.sales,4);assert.equal(m.revenueCents,12500);
  assert.equal(m.cashCents,4500);assert.equal(m.pixCents,5000);
  assert.equal(m.cardCents,2000);assert.equal(m.creditCents,1000);
  assert.equal(m.cars,1);assert.equal(m.warnings,1);
  const closed=ops.closeShift();
  assert.equal(closed.metrics.sales,4);
  assert.equal(ops.snapshot().metrics.sales,0);
  assert.equal(ops.snapshot().history.length,1);
});
test('V7 realistic station: refill checklist, weather, inventory and UI dependencies',()=>{
  const html=read('public/index.html'),app=read('public/app.js');
  const scene=read('public/scene.js'),game=read('public/game.js');
  for(const id of ['fuel-mode','fuel-value-target','fuel-speed','fuel-engine-off','fuel-connect',
    'fuel-stock-status','fuel-projection','operations-dialog','ops-tanks','ops-deliver',
    'ops-close-shift','open-operations-toolbar','weather-mode']){
    assert.match(html,new RegExp('id="'+id+'"'),id);
  }
  assert.match(html,/src="\.\/operations-core\.js\?v=realism-v7"/);
  assert.match(html,/src="\.\/operations-ui\.js\?v=realism-v7"/);
  assert.match(scene,/function setHose\(/);
  assert.match(scene,/function setWeather\(/);
  assert.match(scene,/function moveRain\(/);
  assert.match(game,/function chosenPlan\(/);
  assert.match(game,/function toggleNozzle\(/);
  assert.match(game,/function startFilling\(/);
  assert.match(game,/function commitFuel\(/);
  assert.match(game,/ops\?\.dispense\(/);
  assert.match(game,/ecoposto:customer-released/);
  assert.match(app,/function updateWeather\(/);
  assert.match(app,/litres<\.1/);
  assert.doesNotThrow(()=>new Script(read('public/operations-core.js')));
  assert.doesNotThrow(()=>new Script(read('public/operations-ui.js')));
});


test('V7 convenience stock and replenishment persist and prevent overselling',()=>{
 const store=new Map(),ctx={window:{},Date,Math,
   localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)}};
 const source=read('public/operations-core.js');
 runInNewContext(source,ctx);
 const ops=ctx.window.ECO_OPERATIONS;
 const item={id:'coca',category:'conveniencia',qty:4};
 assert.equal(ops.retailCount(item),32);
 assert.equal(ops.validateRetail([item]).ok,true);
 assert.equal(ops.consumeRetail([item]).ok,true);
 assert.equal(ops.retailCount(item),28);
 assert.equal(ops.validateRetail([{...item,qty:29}]).ok,false);
 assert.equal(ops.restockRetail({id:'coca',category:'conveniencia',qty:12}).ok,true);
 assert.equal(ops.retailCount(item),40);
 assert.equal(ops.consumeRetail([{id:'troca-oleo',category:'servicos',qty:1}]).ok,true);
 assert.equal(ops.retailCount({id:'troca-oleo',category:'servicos'}),Infinity);
 const next={window:{},Date,Math,localStorage:ctx.localStorage};
 runInNewContext(source,next);
 assert.equal(next.window.ECO_OPERATIONS.retailCount(item),40);
 assert.equal(next.window.ECO_OPERATIONS.retailCount({id:'oleo',category:'cuidados'}),18);
});
test('V7 physical pump and NPC have consistent UI and game invariants',()=>{
 const app=read('public/app.js'),world=read('public/world-extra.js');
 assert.match(app,/No modo frentista, lance o combustível somente pela bomba/);
 assert.match(app,/Litros do veículo vêm do visor da bomba/);
 assert.match(app,/Volume registrado pela bomba não pode ser editado/);
 assert.match(app,/validateRetail/);
 assert.match(app,/consumeRetail/);
 assert.match(world,/setFuelCap\(/);
 assert.match(world,/setDoor\(/);
 assert.match(world,/setLights\(/);
 assert.match(game,/function makeNPC\(/);
 assert.match(game,/function updateNPC\(/);
 assert.match(game,/function animateAttendant\(/);
 assert.match(game,/state='boarding'/);
});


test('low-FPS rendering advances game logic with bounded substeps',()=>{
  const game=read('public/game.js');
  const scene=read('public/scene.js');
  assert.match(game,/const steps=Math\.max\(1,Math\.ceil\(dt\/\.05\)\),step=dt\/steps/);
  assert.match(game,/for\(let i=0;i<steps;i\+\+\)/);
  assert.match(game,/moved=move\(step\)\|\|moved/);
  assert.match(game,/carMoved=animateCustomer\(step\)\|\|carMoved/);
  assert.match(scene,/const steps=Math\.max\(1,Math\.ceil\(delta\/\.08\)\)/);
  assert.match(scene,/district\?\.update\(time-delta\*1000/);
});


test('V8 elevated sidewalks do not bridge active streets or the fueling access',()=>{
  const scene=read('public/scene.js'),world=read('public/world-extra.js');
  assert.doesNotMatch(scene,/car\(9\.60,4\.50/);
  assert.doesNotMatch(scene,/car\(-9\.40,4\.60/);
  assert.match(scene,/box\(23,\.16,15\.5,0,\.08,-4\.25,concreteSurface\)/);
  assert.match(scene,/box\(33\.4,\.12,2\.9,0,\.065,5\.2,asphaltSurface\)/);
  assert.match(world,/function sidewalkRow\(z,depth,material\)/);
  assert.match(world,/sidewalkRow\(-14\.0,2\.30,pavement\)/);
  assert.match(world,/sidewalkRow\(19\.0,2\.30,stone\)/);
  assert.doesNotMatch(world,/cube\(68,\.20,2\.30,0,\.17,-14\.0,pavement\)/);
  assert.doesNotMatch(world,/cube\(1\.3,\.2,55,x,\.16,-3\.0,pavement\)/);
  const road=read('public/traffic-paths.js').replace(/^export\s+/gm,'');
  const sandbox={};
  runInNewContext(road+';globalThis.P={ROAD_BOUNDS}',sandbox);
  const {left,right}=sandbox.P.ROAD_BOUNDS;
  const sections=[[-26.85,14.15],[0,28.45],[26.85,14.15]];
  for(const [x,width] of sections){
    const start=x-width/2,end=x+width/2;
    for(const lane of [left,right]){
      assert.ok(end<lane.xMin||start>lane.xMax,
        'raised sidewalk intersects road: '+x+','+width);
    }
  }
  assert.match(world,/cube\(1\.3,\.20,33\.75,x,\.16,-13\.625,pavement\)/);
  assert.match(world,/cube\(1\.3,\.20,6\.6,x,\.16,21\.20,pavement\)/);
  // Antigo trecho: z=6.85..24.5 atravessava a avenida de z=6.75..17.65.
  const boulevard={min:6.75,max:17.65};
  const southernSidewalk={min:-30.5,max:3.25};
  const northernSidewalk={min:17.90,max:24.5};
  assert.ok(southernSidewalk.max<boulevard.min);
  assert.ok(northernSidewalk.min>boulevard.max);
});
test('V8 collision SAT handles right-angle cars, motorcycles and the junction priority',()=>{
  const code=read('public/traffic-paths.js').replace(/^export\s+/gm,'');
  const scope={};
  runInNewContext(code+';globalThis.api={trafficOverlaps,trafficEnvelope,TRAFFIC_SHAPES,junctionWinner,TRAFFIC_JUNCTIONS}',scope);
  const {trafficOverlaps,trafficEnvelope,TRAFFIC_SHAPES,junctionWinner,TRAFFIC_JUNCTIONS}=scope.api;
  assert.equal(TRAFFIC_JUNCTIONS.length,2);
  assert.ok(TRAFFIC_SHAPES.motorcycle.length<TRAFFIC_SHAPES.car.length);
  assert.equal(trafficOverlaps(
    trafficEnvelope({x:0,z:0,heading:0,variant:'car'}),
    trafficEnvelope({x:4.5,z:0,heading:0,variant:'car'})),false);
  assert.equal(trafficOverlaps(
    trafficEnvelope({x:0,z:0,heading:0,variant:'car'}),
    trafficEnvelope({x:2,z:0,heading:0,variant:'car'})),true);
  assert.equal(trafficOverlaps(
    trafficEnvelope({x:0,z:0,heading:0,variant:'car'}),
    trafficEnvelope({x:0,z:0,heading:Math.PI/2,variant:'bus'})),true);
  assert.equal(trafficOverlaps(
    trafficEnvelope({x:0,z:0,heading:0,variant:'motorcycle'}),
    trafficEnvelope({x:0,z:1.65,heading:0,variant:'motorcycle'})),false);
  const junction={x:17,z:11.6};
  assert.equal(junctionWinner([{id:21,x:18,z:11.6},{id:4,x:19,z:11.6}],junction),21);
  assert.equal(junctionWinner([{id:7,x:20,z:11.6},{id:4,x:20,z:11.6}],junction),4);
});
test('V8 road traffic cannot clip the customer or park decorative cars in lanes',()=>{
  const world=read('public/world-extra.js'),scene=read('public/scene.js'),game=read('public/game.js');
  assert.match(world,/function isRouteFreeFor\(/);
  assert.match(world,/function nearVehicle\(/);
  assert.match(world,/junctionWinner\(greenCandidates,j\)/);
  assert.match(world,/trafficOverlaps\(probe,peer,\.58\)/);
  assert.match(world,/const wouldOverlap=distance=>nearVehicle/);
  assert.match(world,/collisionAvoided\+\+/);
  assert.match(world,/gridlocksResolved\+\+/);
  assert.match(world,/trafficCars:\(\)=>traffic\.map/);
  assert.match(scene,/getTrafficCars:/);
  assert.match(scene,/setTrafficExternalVehicle:/);
  assert.match(game,/setTrafficExternalVehicle\?\.\(vehicle\)/);
  assert.match(game,/isRouteFreeFor\?\.\(customer\.group,nextPose\)/);
  assert.match(world,/variants=\['car','car','hatch','hatch','suv','pickup','van','bus','motorcycle'\]/);
  assert.match(world,/parkedVehicles\.push/);
  assert.match(world,/for\(const \[i,profile\] of walkers\.entries\(\)\)/);
  assert.match(world,/attendants=\[/);
  assert.match(scene,/from '\.\/world-extra\.js\?v=street-v8'/);
  assert.match(game,/from '\.\/world-extra\.js\?v=street-v8'/);
});
