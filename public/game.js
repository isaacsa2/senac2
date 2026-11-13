import * as THREE from 'three';

// Simulação educativa leve: o mundo 3D fica sob responsabilidade de scene.js.
// Esta camada implementa personagem, proximidade, missões e abastecimento.
const $=id=>document.getElementById(id);
const pumpList=[
  {id:'gasolina-comum',name:'Gasolina Comum',x:-6.15,z:-2.95,type:'flex'},
  {id:'gasolina-nitro',name:'Shell V-Power Nitro+',x:-3.05,z:-2.95,type:'flex'},
  {id:'gasolina-racing',name:'Shell V-Power Racing',x:.05,z:-2.95,type:'flex'},
  {id:'etanol-comum',name:'Etanol Comum',x:-6.15,z:-.40,type:'flex'},
  {id:'diesel-s10',name:'Diesel S10',x:-3.05,z:-.40,type:'diesel'},
  {id:'diesel-s500',name:'Diesel S500',x:.05,z:-.40,type:'diesel-antigo'}
];
const productPhotos={
  coca:'https://santaluzia.vtexassets.com/arquivos/ids/997380/556297.jpg?v=638525861586730000',
  redbull:'https://carrefourbr.vtexassets.com/arquivos/ids/183189711/image-0.jpg?v=638740381539970000',
  oleo:'https://images.tcdn.com.br/img/img_prod/945233/shell_helix_hx8_sp_gf6_5w_30_305337_1_d60fb75deefdebba672b1596906b76c6.jpg',
  arla:'https://images.tcdn.com.br/img/img_prod/1264917/arla_32_galao_20_lts_7677_1_1bdc0c0ee60766ed8f024ea07b8739f6.png'
};
const money=cents=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(cents/100);
let started=false;
function initialise(){
  if(started||!window.ecoScene)return;
  started=true;
  const ctx=window.ecoScene.getContext();
  const {scene,world,stage}=ctx;
  const player=new THREE.Group();
  const shirt=new THREE.MeshStandardMaterial({color:'#f0cd55',roughness:.72});
  const pants=new THREE.MeshStandardMaterial({color:'#243f51',roughness:.82});
  const face=new THREE.MeshStandardMaterial({color:'#bd8b68',roughness:.86});
  const boots=new THREE.MeshStandardMaterial({color:'#263332'});
  function primitive(geometry,material,x,y,z,parent=player){
    const obj=new THREE.Mesh(geometry,material);obj.position.set(x,y,z);parent.add(obj);return obj;
  }
  primitive(new THREE.CylinderGeometry(.22,.31,.66,8),shirt,0,1.06,0);
  primitive(new THREE.SphereGeometry(.22,10,8),face,0,1.62,0);
  primitive(new THREE.BoxGeometry(.47,.18,.31),pants,0,.66,0);
  for(const dx of [-.14,.14]){
    primitive(new THREE.BoxGeometry(.15,.53,.16),pants,dx,.35,0);
    primitive(new THREE.BoxGeometry(.18,.13,.28),boots,dx,.08,-.055);
  }
  for(const dx of [-.29,.29])primitive(new THREE.BoxGeometry(.13,.56,.16),shirt,dx,1.06,0);
  primitive(new THREE.BoxGeometry(.48,.06,.40),pants,0,1.83,-.03);
  primitive(new THREE.BoxGeometry(.43,.13,.14),pants,0,1.78,-.25);
  player.position.set(-2.4,.29,2.4);
  world.add(player);
  player.visible=false;
  const cam=new THREE.PerspectiveCamera(54,1,.12,95);
  const states={active:false, keys:new Set(), near:null, runs:0, liters:0, afterSound:false, audio:null};
  const dialog=$('fuel-dialog');
  const controls=$('game-touch-pad');
  const movement={forward:[0,-1],back:[0,1],left:[-1,0],right:[1,0]};
  let lastFrame=0,animId=null, filling=null, fuelSequence=0;
  // Inventário de vitrine: produtos reais identificados por fotos de embalagens de varejistas.
  const shopDialog=document.createElement('dialog');
  shopDialog.id='game-shop-dialog';
  shopDialog.className='modal game-shop-dialog';
  shopDialog.setAttribute('aria-label','Produtos do posto');
  document.body.appendChild(shopDialog);
  function renderShop(area){
    const atOil=area==='oleo';
    const choices=atOil?[
      {id:'oleo',name:'Shell Helix HX8 SP 5W-30',photo:productPhotos.oleo},
      {id:'arla',name:'ARLA 32 · galão 20 L',photo:productPhotos.arla},
      {id:'troca-oleo',name:'Serviço de troca de óleo'}
    ]:[
      {id:'coca',name:'Coca-Cola · 350 mL',photo:productPhotos.coca},
      {id:'redbull',name:'Red Bull · 250 mL',photo:productPhotos.redbull},
      {id:'agua',name:'Água mineral · 500 mL'}
    ];
    const title=atOil?'Box de troca de óleo':'Loja de conveniência';
    // Os ids são constantes internas; os nomes e links são definidos no projeto.
    shopDialog.innerHTML='<div class="modal-inner"><button class="icon-button game-shop-close" type="button" aria-label="Fechar">✕</button><span class="section-kicker">EXPLORAÇÃO DO POSTO</span><h2>'+title+'</h2><p>Selecione um produto da prateleira para saber sua função ou levá-lo ao PDV de treinamento.</p><div class="game-products">'+choices.map(i=>'<div class="game-product"><div class="game-product-art">'+(i.photo?'<img alt="Embalagem real de '+i.name+'" src="'+i.photo+'" loading="lazy" onerror="this.hidden=true">':'<span>▣</span>')+'</div><strong>'+i.name+'</strong><div><button type="button" data-game-detail="'+i.id+'">Conhecer</button><button type="button" data-game-add="'+i.id+'">+ PDV</button></div></div>').join('')+'</div><small>Imagens ilustrativas de produtos reais; operações e preços fictícios.</small></div>';
    shopDialog.showModal();
  }
  shopDialog.addEventListener('click',event=>{
    if(event.target===shopDialog||event.target.closest('.game-shop-close')){shopDialog.close();return;}
    const detail=event.target.closest('[data-game-detail]');
    const add=event.target.closest('[data-game-add]');
    if(detail){
      shopDialog.close();
      window.dispatchEvent(new CustomEvent('ecoposto:show-product',{detail:{id:detail.dataset.gameDetail}}));
    }
    if(add){
      window.dispatchEvent(new CustomEvent('ecoposto:add-item',{detail:{id:add.dataset.gameAdd}}));
      add.textContent='Adicionado ✓';setTimeout(()=>{if(add.isConnected)add.textContent='+ PDV';},900);
    }
  });
  function beep(frequency=650,duration=.09){
    if(!states.afterSound)return;
    try{
      const AC=window.AudioContext||window.webkitAudioContext;
      if(!AC)return;
      if(!states.audio)states.audio=new AC();
      if(states.audio.state==='suspended')states.audio.resume();
      const osc=states.audio.createOscillator(),gain=states.audio.createGain();
      osc.type='sine';osc.frequency.value=frequency;
      gain.gain.setValueAtTime(.0001,states.audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(.045,states.audio.currentTime+.015);
      gain.gain.exponentialRampToValueAtTime(.0001,states.audio.currentTime+duration);
      osc.connect(gain);gain.connect(states.audio.destination);
      osc.start();osc.stop(states.audio.currentTime+duration+.02);
    }catch{}
  }
  // Mini mapa isométrico: jogador, bombas, conveniência atrás e box lateral.
  const mini=document.createElement('div');
  mini.className='game-minimap';
  mini.innerHTML='<span>MAPA DO POSTO</span><i class="map-pumps" title="Bombas">⛽</i><i class="map-shop" title="Conveniência">▣</i><i class="map-oil" title="Troca de óleo">⚙</i><i class="map-player" title="Você"></i>';
  $('game-hud').append(mini);
  const playerDot=mini.querySelector('.map-player');
  function updateMini(){
    const x=((player.position.x+10.5)/21)*100;
    const y=((player.position.z+12.5)/19)*100;
    playerDot.style.left=Math.min(96,Math.max(4,x)).toFixed(1)+'%';
    playerDot.style.top=Math.min(96,Math.max(4,y)).toFixed(1)+'%';
  }
  const nightButton=document.createElement('button');
  nightButton.className='game-exit';nightButton.type='button';nightButton.textContent='☾ Noite';
  let night=false;
  $('game-hud').querySelector('.game-hud-top').insertBefore(nightButton,$('exit-game'));
  nightButton.addEventListener('click',()=>{
    night=!night;window.ecoScene.setNight(night);
    nightButton.textContent=night?'☀ Dia':'☾ Noite';
  });
  const soundButton=document.createElement('button');
  soundButton.className='game-exit';soundButton.type='button';soundButton.textContent='Som: desligado';
  $('game-hud').querySelector('.game-hud-top').insertBefore(soundButton,$('exit-game'));
  soundButton.addEventListener('click',()=>{
    states.afterSound=!states.afterSound;
    soundButton.textContent='Som: '+(states.afterSound?'ligado':'desligado');
    beep();
  });
  function nearest(){
    let best=null, dMin=Infinity;
    for(const pump of pumpList){
      const d=Math.hypot(player.position.x-pump.x,player.position.z-pump.z);
      if(d<2.15&&d<dMin){best={kind:'pump',pump,label:'Abastecer: '+pump.name};dMin=d;}
    }
    const shopDist=Math.hypot(player.position.x+2.85,player.position.z+5.9);
    if(shopDist<2.75&&shopDist<dMin){best={kind:'shop',label:'Entrar na conveniência'};dMin=shopDist;}
    const oilDist=Math.hypot(player.position.x-6.5,player.position.z-1.35);
    if(oilDist<3.15&&oilDist<dMin){best={kind:'oleo',label:'Visitar a troca de óleo'};dMin=oilDist;}
    return best;
  }
  function updateHud(){
    if(!states.active)return;
    const near=nearest();states.near=near;
    $('game-interact').disabled=!near;
    $('game-action-label').textContent=near?near.label:'Explore o posto com WASD ou setas';
    $('game-progress').textContent=states.runs?('Atendimentos: '+states.runs+' · '+states.liters.toLocaleString('pt-BR')+' L abastecidos'):'Missão: abasteça o primeiro veículo';
  }
  function isBlocked(x,z){
    if(x<-10.2||x>10.5||z<-12.3||z>6.3)return true;
    // A loja tem vitrine, portanto não é atravessável. Interação ocorre na entrada.
    if(x>-5.5&&x<-.15&&z<-6.38&&z>-10.7)return true;
    // Bombas físicas e pilares da estrutura.
    for(const pump of pumpList)if(Math.abs(x-pump.x)<.53&&Math.abs(z-pump.z)<.48)return true;
    return false;
  }
  function move(delta){
    if(!states.active||document.querySelector('dialog[open]'))return false;
    const axis={x:0,z:0};
    if(states.keys.has('w')||states.keys.has('arrowup')||states.keys.has('forward'))axis.z-=1;
    if(states.keys.has('s')||states.keys.has('arrowdown')||states.keys.has('back'))axis.z+=1;
    if(states.keys.has('a')||states.keys.has('arrowleft')||states.keys.has('left'))axis.x-=1;
    if(states.keys.has('d')||states.keys.has('arrowright')||states.keys.has('right'))axis.x+=1;
    const length=Math.hypot(axis.x,axis.z);if(!length)return false;
    const speed=(states.keys.has('shift')?5.1:3.6);
    const dx=(axis.x/length)*speed*delta,dz=(axis.z/length)*speed*delta;
    const nx=player.position.x+dx,nz=player.position.z+dz;
    if(!isBlocked(nx,player.position.z))player.position.x=nx;
    if(!isBlocked(player.position.x,nz))player.position.z=nz;
    player.rotation.y=Math.atan2(-axis.x,-axis.z);
    player.position.y=.29+Math.sin(performance.now()/135)*.018;
    return true;
  }
  function updateCamera(delta){
    const view=new THREE.Vector3(player.position.x+3.75,player.position.y+6.4,player.position.z+6.7);
    cam.position.lerp(view,Math.min(1,delta*12));
    cam.lookAt(player.position.x,1.05,player.position.z-.45);
  }
  function tick(now){
    if(!states.active)return;
    const dt=lastFrame?Math.min(.05,(now-lastFrame)/1000):.016;
    lastFrame=now;
    if(!document.hidden){
      const moved=move(dt);
      if(moved){updateCamera(dt);ctx.stage.classList.add('game-moving');ctx.requestRender();}
      else if(!cam.userData.followed){updateCamera(dt);ctx.requestRender();}
      cam.userData.followed=true;
      if(moved||!states.near){updateHud();updateMini();}
    }
    animId=requestAnimationFrame(tick);
  }
  function start(){
    if(states.active)return;
    states.active=true;player.visible=true;
    stage.classList.add('is-gaming');
    $('game-launch').hidden=true;$('game-hud').hidden=false;
    $('game-interact').disabled=true;
    cam.aspect=Math.max(1,stage.clientWidth)/Math.max(1,stage.clientHeight);
    cam.updateProjectionMatrix();
    cam.position.copy(player.position).add(new THREE.Vector3(3.75,6.4,6.7));
    cam.lookAt(player.position.x,1.05,player.position.z-.45);
    ctx.controls.enabled=false;
    window.ecoScene.setActiveCamera(cam);
    lastFrame=0;
    updateHud();updateMini();
    animId=requestAnimationFrame(tick);
    ctx.requestRender();
  }
  function stop(){
    if(!states.active)return;
    states.active=false;states.keys.clear();
    cancelAnimationFrame(animId);animId=null;
    player.visible=false;
    stage.classList.remove('is-gaming','game-moving');
    $('game-hud').hidden=true;$('game-launch').hidden=false;
    window.ecoScene.setActiveCamera(null);
    ctx.controls.enabled=true;
    window.ecoScene.focus('geral');
    ctx.requestRender();
    if(dialog.open)dialog.close();
    if(shopDialog.open)shopDialog.close();
    filling=null;fuelSequence++;
  }
  function interact(){
    if(!states.active)return;
    const here=nearest();if(!here)return;
    if(here.kind==='pump')openFuel(here.pump);
    else renderShop(here.kind);
  }
  $('start-game').addEventListener('click',start);
  $('exit-game').addEventListener('click',stop);
  $('game-interact').addEventListener('click',interact);
  const keyMap={w:'w',a:'a',s:'s',d:'d',arrowup:'arrowup',arrowdown:'arrowdown',arrowleft:'arrowleft',arrowright:'arrowright',shift:'shift'};
  document.addEventListener('keydown',event=>{
    if(!states.active||event.repeat&&event.key.toLowerCase()==='e')return;
    if(event.target instanceof HTMLElement&&event.target.closest('input,select,textarea,[contenteditable=true]'))return;
    if(document.querySelector('dialog[open]'))return;
    const key=event.key.toLowerCase();
    if(keyMap[key]){event.preventDefault();states.keys.add(key);}
    if(key==='e'){event.preventDefault();interact();}
    if(key==='escape')stop();
  });
  document.addEventListener('keyup',event=>states.keys.delete(event.key.toLowerCase()));
  window.addEventListener('blur',()=>states.keys.clear());
  for(const btn of controls.querySelectorAll('[data-move]')){
    const key=btn.dataset.move;
    const press=event=>{event.preventDefault();states.keys.add(key);btn.classList.add('is-pressed');try{btn.setPointerCapture(event.pointerId);}catch{}};
    const release=event=>{states.keys.delete(key);btn.classList.remove('is-pressed');};
    btn.addEventListener('pointerdown',press);
    btn.addEventListener('pointerup',release);
    btn.addEventListener('pointercancel',release);
    btn.addEventListener('lostpointercapture',release);
  }
  const closeFuel=$('fuel-close'),targetInput=$('fuel-target'),vehicle=$('fuel-vehicle');
  function openFuel(pump){
    const product=window.ecoCatalog?.fuelProducts?.find(p=>p.id===pump.id);
    if(!product)return;
    fuelSequence++;
    filling={pump,product,litres:0,target:20,running:false,finished:false,last:0};
    $('fuel-product-name').textContent=product.name;
    $('fuel-unit-price').textContent=money(product.price)+' / L';
    vehicle.value=pump.type==='flex'?'flex':'diesel';
    targetInput.value='20';targetInput.max=pump.type==='flex'?'80':'200';
    targetInput.disabled=false;vehicle.disabled=false;
    $('fuel-error').textContent='';
    $('fuel-start').textContent='Iniciar abastecimento';
    $('fuel-start').disabled=false;
    $('fuel-pause').disabled=true;$('fuel-finish').disabled=true;
    resetMeter();dialog.showModal();beep(520,.08);
  }
  function resetMeter(){
    $('fuel-litres').textContent='0,0 L';
    $('fuel-amount').textContent=money(0);
    $('fuel-progress-bar').style.width='0%';
  }
  function compatible(pump,choice){
    if(pump.type==='flex')return choice==='flex';
    if(pump.type==='diesel')return choice==='diesel'||choice==='diesel-antigo';
    return choice==='diesel-antigo';
  }
  function startFilling(){
    if(!filling||filling.finished)return;
    const qty=Number(targetInput.value);
    const maximum=vehicle.value==='flex'?80:200;
    $('fuel-error').textContent='';
    if(!Number.isInteger(qty)||qty<1||qty>maximum){
      $('fuel-error').textContent='Escolha um volume inteiro entre 1 e '+maximum+' litros.';return;
    }
    if(!compatible(filling.pump,vehicle.value)){
      $('fuel-error').textContent='Combustível incompatível com o veículo selecionado. Verifique o tipo de motor e escolha a bomba correta.';return;
    }
    filling.target=qty;filling.litres=0;filling.last=0;filling.running=true;
    targetInput.disabled=true;vehicle.disabled=true;
    $('fuel-start').disabled=true;$('fuel-pause').disabled=false;
    $('fuel-pause').textContent='Pausar';
    $('fuel-finish').disabled=true; // pode finalizar parcial depois de pelo menos 1 L
    beep(520,.09);
    const token=++fuelSequence;
    requestAnimationFrame(t=>stepFuel(t,token));
  }
  function stepFuel(t,token){
    const f=filling;
    if(!f||!f.running||!dialog.open||token!==fuelSequence)return;
    const elapsed=f.last?Math.min(.06,(t-f.last)/1000):0;
    f.last=t;
    f.litres=Math.min(f.target,Math.round((f.litres+elapsed*6.5)*10)/10);
    const displayed=Math.min(f.target,f.litres);
    $('fuel-litres').textContent=displayed.toFixed(1).replace('.',',')+' L';
    $('fuel-amount').textContent=money(Math.round(displayed*f.product.price));
    $('fuel-progress-bar').style.width=(displayed/f.target*100).toFixed(1)+'%';
    $('fuel-finish').disabled=displayed<1;
    if(displayed>=f.target){
      f.running=false;
      $('fuel-pause').disabled=true;
      $('fuel-start').disabled=true;
      $('fuel-finish').disabled=false;
      $('fuel-error').textContent='Meta atingida! Registre os litros no PDV.';
      beep(880,.14);
      return;
    }
    requestAnimationFrame(now=>stepFuel(now,token));
  }
  function pauseFilling(){
    if(!filling)return;
    if(filling.running){
      filling.running=false;filling.last=0;fuelSequence++;
      $('fuel-pause').textContent='Retomar';
      beep(460,.07);
    }else{
      filling.running=true;filling.last=0;
      $('fuel-pause').textContent='Pausar';
      const token=++fuelSequence;
      requestAnimationFrame(t=>stepFuel(t,token));
    }
  }
  function commitFuel(){
    if(!filling||filling.litres<1||filling.finished)return;
    filling.running=false;filling.finished=true;fuelSequence++;
    const litres=Math.round(filling.litres*10)/10;
    window.dispatchEvent(new CustomEvent('ecoposto:fill-complete',{detail:{id:filling.product.id,litres}}));
    states.runs+=1;
    states.liters=Math.round((states.liters+litres)*10)/10;
    beep(950,.18);
    dialog.close();
    filling=null;
    updateHud();
  }
  closeFuel.addEventListener('click',()=>dialog.close());
  $('fuel-start').addEventListener('click',startFilling);
  $('fuel-pause').addEventListener('click',pauseFilling);
  $('fuel-finish').addEventListener('click',commitFuel);
  vehicle.addEventListener('change',()=>{
    targetInput.max=vehicle.value==='flex'?'80':'200';
    if(Number(targetInput.value)>Number(targetInput.max))targetInput.value=targetInput.max;
  });
  dialog.addEventListener('close',()=>{
    if(filling){filling.running=false;filling=null;fuelSequence++;}
  });
  // Exibição pública mínima para testes automatizados de jogabilidade.
  window.ecoGame={start,stop,interact,isActive:()=>states.active,near:()=>nearest(),getPumpIds:()=>pumpList.map(p=>p.id)};
}
if(window.ecoScene)initialise();
else window.addEventListener('ecoposto:scene-ready',initialise,{once:true});
