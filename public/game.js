import * as THREE from 'three';
import {createVehicle} from './world-extra.js';

// Simulação educativa leve: o mundo 3D fica sob responsabilidade de scene.js.
// Esta camada implementa personagem, proximidade, missões e abastecimento.
const $=id=>document.getElementById(id);
const pumpList=[
 {id:'gasolina-comum',name:'Gasolina Comum',x:-5.45,z:-1.40,type:'flex',island:'FLEX',color:'#68af79'},
 {id:'gasolina-nitro',name:'Shell V-Power Nitro+',x:-5.45,z:-1.40,type:'flex',island:'FLEX',color:'#db7164'},
 {id:'etanol-comum',name:'Etanol Comum',x:-5.45,z:-1.40,type:'flex',island:'FLEX',color:'#e8ba4f'},
 {id:'diesel-s10',name:'Diesel S10',x:-2.40,z:-1.40,type:'diesel',island:'DIESEL',color:'#428ac4'},
 {id:'diesel-s500',name:'Diesel S500',x:-2.40,z:-1.40,type:'diesel-antigo',island:'DIESEL',color:'#617d91'},
 {id:'gasolina-racing',name:'Shell V-Power Racing',x:.65,z:-1.40,type:'flex',island:'PREMIUM',color:'#b93f44'}
];
const pumpIslands=[
 {id:'FLEX',label:'Bomba flex · 3 bicos',x:-5.45,z:-1.40},
 {id:'DIESEL',label:'Bomba diesel · 2 bicos',x:-2.40,z:-1.40},
 {id:'PREMIUM',label:'Bomba premium · bico Racing',x:.65,z:-1.40}
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
  const sim=window.ECO_SIM;
  const cameraRig={yaw:.56,pitch:.56,distance:7.4,firstPerson:false,dragging:false,pointerId:null,lastX:0,lastY:0};
  const cameraRay=new THREE.Raycaster();
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
  // Ponto inicial fora da vaga dos carros que chegam para abastecer.
  player.position.set(3.6,.29,3.7);
  world.add(player);
  player.visible=false;
  const cam=new THREE.PerspectiveCamera(58,1,.12,95);
  const states={active:false, keys:new Set(), near:null, runs:0, liters:0, afterSound:false, audio:null};
  const dialog=$('fuel-dialog');
  const nozzleDialog=$('nozzle-dialog');
  let customerSerial=0,currentCar=null,completedCars=0;
  const controls=$('game-touch-pad');
  const movement={forward:[0,-1],back:[0,1],left:[-1,0],right:[1,0]};
  let lastFrame=0,animId=null, filling=null, fuelSequence=0;
  // Inventário de vitrine: produtos reais identificados por fotos de embalagens de varejistas.
  const shopDialog=document.createElement('dialog');
  shopDialog.id='game-shop-dialog';
  shopDialog.className='modal game-shop-dialog';
  shopDialog.setAttribute('aria-label','Produtos do posto');
  document.body.appendChild(shopDialog);
  function escapeHtml(value){
    return String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }
  function renderShop(area){
    const atOil=area==='oleo';
    const categories=atOil?['cuidados','servicos']:['conveniencia'];
    const choices=(window.ecoCatalog?.catalog||[]).filter(p=>categories.includes(p.category));
    const title=atOil?'Box de troca de óleo':'Loja de conveniência';
    const photo=choice=>choice.image||productPhotos[choice.id]||null;
    shopDialog.innerHTML='<div class="modal-inner">'+
      '<button class="icon-button game-shop-close" type="button" aria-label="Fechar">✕</button>'+
      '<span class="section-kicker">EXPLORAÇÃO DO POSTO</span><h2>'+title+'</h2>'+
      '<p>Escolha os produtos e serviços nas prateleiras. Você pode conhecer a função ou registrar uma venda no PDV.</p>'+
      '<label class="game-shop-search">⌕ <input id="game-shop-search-input" type="search" placeholder="Buscar nesta área..." aria-label="Buscar produtos nesta área" autocomplete="off"></label>'+
      '<div class="game-products">'+choices.map(item=>{
         const pic=photo(item);
         const avatar=escapeHtml(item.name.slice(0,2).toUpperCase());
         return '<div class="game-product" data-shop-name="'+escapeHtml((item.name+' '+item.brand).toLocaleLowerCase('pt-BR'))+'">'+
          '<div class="game-product-art">'+(pic?'<img alt="Fotografia ilustrativa de '+escapeHtml(item.name)+'" src="'+escapeHtml(pic)+'" loading="lazy" onerror="this.hidden=true">':'<span aria-hidden="true">'+avatar+'</span>')+'</div>'+
          '<strong>'+escapeHtml(item.name)+'</strong>'+
          '<small>'+money(item.price)+' / unidade</small>'+
          '<div><button type="button" data-game-detail="'+escapeHtml(item.id)+'">Conhecer</button><button type="button" data-game-add="'+escapeHtml(item.id)+'">+ PDV</button></div>'+
          '</div>';
       }).join('')+'</div><p class="game-shop-empty" hidden>Nenhum produto encontrado nesta área.</p>'+
      '<button type="button" class="button button-primary button-full game-shop-checkout" id="game-shop-checkout">Ir ao caixa / maquininha</button>'+
      '<small>Marcas reais para fins didáticos, preços fictícios. Fotos de terceiros podem não carregar; sem ligação comercial com as marcas.</small></div>';
    shopDialog.showModal();
  }
  shopDialog.addEventListener('input',event=>{
    if(event.target.id!=='game-shop-search-input')return;
    const q=event.target.value.trim().toLocaleLowerCase('pt-BR');
    let visible=0;
    for(const card of shopDialog.querySelectorAll('.game-product')){
      const matches=card.dataset.shopName.includes(q);
      card.hidden=!matches;
      if(matches)visible++;
    }
    shopDialog.querySelector('.game-shop-empty').hidden=visible>0;
  });
    shopDialog.addEventListener('click',event=>{
    if(event.target===shopDialog||event.target.closest('.game-shop-close')){shopDialog.close();return;}
    if(event.target.closest('#game-shop-checkout')){
      shopDialog.close();
      document.querySelector('[data-open-cart]')?.click();
      return;
    }
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
  const cameraButton=document.createElement('button');
  cameraButton.type='button';cameraButton.className='game-exit';
  cameraButton.textContent='◉ Câmera 3ª pessoa';
  cameraButton.setAttribute('aria-label','Alternar entre câmera de terceira e primeira pessoa');
  $('game-hud').querySelector('.game-hud-top').insertBefore(cameraButton,$('exit-game'));
  function toggleCamera(){
    cameraRig.firstPerson=!cameraRig.firstPerson;
    cameraRig.pitch=cameraRig.firstPerson?.07:.56;
    player.visible=!cameraRig.firstPerson;
    cameraButton.textContent=cameraRig.firstPerson?'◉ Câmera 1ª pessoa':'◉ Câmera 3ª pessoa';
    updateCamera(.5);ctx.requestRender();
  }
  cameraButton.addEventListener('click',toggleCamera);
  const soundButton=document.createElement('button');
  soundButton.className='game-exit';soundButton.type='button';soundButton.textContent='Som: desligado';
  $('game-hud').querySelector('.game-hud-top').insertBefore(soundButton,$('exit-game'));
  soundButton.addEventListener('click',()=>{
    states.afterSound=!states.afterSound;
    soundButton.textContent='Som: '+(states.afterSound?'ligado':'desligado');
    beep();
  });
  function customerFuel(){
    return currentCar?pumpList.find(x=>x.id===currentCar.order.id):null;
  }
  function nearest(){
    let best=null,dMin=Infinity;
    for(const island of pumpIslands){
      const d=Math.hypot(player.position.x-island.x,player.position.z-island.z);
      if(d<2.35&&d<dMin){best={kind:'pump-island',island,label:'Escolher bico · '+island.label};dMin=d;}
    }
    const laneTerminal=Math.hypot(player.position.x-2.74,player.position.z-1.86);
    if(laneTerminal<1.45&&laneTerminal<dMin){best={kind:'payment',label:'Usar maquininha na pista'};dMin=laneTerminal;}
    const cashier=Math.hypot(player.position.x+1.65,player.position.z+8.02);
    if(cashier<2.25&&cashier<dMin){best={kind:'computer',label:'Operar PC do caixa'};dMin=cashier;}
    const entrance=Math.hypot(player.position.x+2.84,player.position.z+6.60);
    if(entrance<1.4&&entrance<dMin){best={kind:'shop',label:'Conhecer a loja de conveniência'};dMin=entrance;}
    const shelves=Math.hypot(player.position.x+4.15,player.position.z+8.10);
    if(shelves<1.42&&shelves<dMin){best={kind:'shop',label:'Escolher produtos das prateleiras'};dMin=shelves;}
    const oilDist=Math.hypot(player.position.x-6.5,player.position.z-1.35);
    if(oilDist<3.15&&oilDist<dMin){best={kind:'oleo',label:'Visitar a troca de óleo'};dMin=oilDist;}
    return best;
  }
  function carStatus(text,badge='ATENDIMENTO'){
    $('customer-indicator').textContent=badge;
    $('customer-request').textContent=text;
  }
  function updateCustomerHUD(){
    const bar=$('customer-hud');if(!bar)return;
    if(!currentCar){
      $('customer-summary').textContent='Sem veículo na pista';
      carStatus('Chame um veículo para atender.','AGUARDANDO');
      $('customer-next').disabled=false;$('customer-release').disabled=true;return;
    }
    const {order,state}=currentCar;
    $('customer-summary').textContent=order.vehicle+' • '+order.plate;
    const fuel=customerFuel();
    const price=window.ecoCatalog?.fuelProducts?.find(p=>p.id===order.id)?.price||0;
    const request=order.orderType==='valor'?'R$ 50,00 em '+fuel?.name
      :order.orderType==='completar'?'Completar tanque • '+fuel?.name
      :order.requested+' L de '+fuel?.name;
    const statuses={arriving:'Veículo chegando à bomba…',parked:'Pedido: '+request,
      filled:'Abastecido: '+order.filled.toFixed(1).replace('.',',')+' L · Receber no caixa',
      paid:'Venda registrada · liberar veículo',leaving:'Veículo saindo do posto…'};
    carStatus(statuses[state]||request,state==='paid'?'CONCLUÍDO':state==='filled'?'PAGAMENTO':state==='arriving'?'CHEGANDO':state==='leaving'?'SAINDO':'CLIENTE');
    $('customer-next').disabled=true;
    $('customer-release').disabled=state!=='paid';
  }
  function createQueueCar(){
    if(currentCar||!sim)return;
    const order=sim.createCustomer(customerSerial++);
    const fuel=pumpList.find(p=>p.id===order.id);
    const group=createVehicle(['#438eb1','#e2d6be','#7c9b84','#e4e8e8','#a8494c','#677485'][customerSerial%6],
      order.kind==='diesel'||order.kind==='diesel-antigo'?'pickup':'car');
    group.position.set(-16,.18,5.2);
    group.rotation.y=0;
    world.add(group);
    currentCar={order,group,state:'arriving',island:fuel.island,driveTarget:{x:fuel.x,z:2.50},pathIndex:0,
      path:[{x:fuel.x,z:5.2},{x:fuel.x,z:2.5}],leavingPath:[]};
    updateCustomerHUD();ctx.requestRender();
  }
  function moveCarTo(target,dt){
    if(!currentCar)return true;
    const {group}=currentCar;
    const dx=target.x-group.position.x,dz=target.z-group.position.z;
    const distance=Math.hypot(dx,dz);
    if(distance<.06){group.position.x=target.x;group.position.z=target.z;return true;}
    const rate=Math.min(distance,3.2*dt);
    group.rotation.y=Math.atan2(dx,dz)-Math.PI/2;
    group.position.x+=dx/distance*rate;group.position.z+=dz/distance*rate;
    for(const wheel of group.userData.wheels||[])wheel.rotation.z-=rate/.35;
    return false;
  }
  function animateCustomer(dt){
    if(!currentCar)return false;
    const c=currentCar;
    if(c.state==='arriving'){
      if(moveCarTo(c.path[c.pathIndex],dt)){
        c.pathIndex++;
        if(c.pathIndex>=c.path.length){c.state='parked';updateCustomerHUD();}
      }
      return true;
    }
    if(c.state==='leaving'){
      if(moveCarTo(c.leavingPath[c.pathIndex],dt)){
        c.pathIndex++;
        if(c.pathIndex>=c.leavingPath.length){
          world.remove(c.group);
          c.group.traverse(m=>{
            if(m.isMesh){m.geometry?.dispose?.();}
          });
          currentCar=null;completedCars++;updateCustomerHUD();
        }
      }
      return true;
    }
    return false;
  }
  function releaseCar(){
    if(!currentCar||currentCar.state!=='paid')return;
    currentCar.state='leaving';currentCar.pathIndex=0;
    currentCar.leavingPath=[{x:currentCar.group.position.x,z:5.2},{x:16,z:5.2}];
    updateCustomerHUD();
  }
  function selectNozzle(island){
    const fuel=pumpList.filter(p=>p.island===island.id);
    $('nozzle-title').textContent='Bomba '+island.label+' — escolha o bico';
    $('nozzle-options').replaceChildren();
    const wanted=customerFuel()?.id;
    for(const pump of fuel){
      const btn=document.createElement('button');
      btn.type='button';btn.className='nozzle-option';
      btn.style.setProperty('--nozzle-color',pump.color);
      const name=document.createElement('strong');name.textContent=pump.name;
      const label=document.createElement('small');label.textContent='Bico '+(fuel.indexOf(pump)+1)+(wanted===pump.id?' · pedido do cliente':'');
      btn.append(name,label);
      btn.addEventListener('click',()=>{
        if(currentCar&&currentCar.state!=='parked'){
          $('nozzle-warning').textContent='O veículo ainda não está pronto para abastecimento.';return;
        }
        if(currentCar&&pump.id!==wanted){
          $('nozzle-warning').textContent='Bico incorreto para o pedido do cliente. Selecione '+customerFuel()?.name+'.';return;
        }
        nozzleDialog.close();openFuel(pump);
      });
      $('nozzle-options').append(btn);
    }
    $('nozzle-warning').textContent='Escolha pelo combustível solicitado; não misture gasolina e diesel.';
    nozzleDialog.showModal();
  }
  $('nozzle-close').addEventListener('click',()=>nozzleDialog.close());
  $('customer-next').addEventListener('click',createQueueCar);
  $('customer-release').addEventListener('click',releaseCar);
  window.addEventListener('ecoposto:sale-complete',event=>{
    if(!currentCar||currentCar.state!=='filled')return;
    const ids=event.detail?.productIds;
    if(!Array.isArray(ids)||!ids.includes(currentCar.order.id))return;
    currentCar.state='paid';currentCar.order.paid=true;
    updateCustomerHUD();ctx.requestRender();
  });
    function updateHud(){
    if(!states.active)return;
    const near=nearest();states.near=near;
    $('game-interact').disabled=!near;
    $('game-action-label').textContent=near?near.label:'Explore o posto com WASD ou setas';
    $('game-progress').textContent='Atendidos: '+completedCars+' • Abastecimentos: '+states.runs+' • '+states.liters.toLocaleString('pt-BR')+' L';
  }
  function isBlocked(x,z){
    if(x<-27||x>27||z<-26||z>26)return true;
    if(z<-17.5&&z>-22.8&&x>-15&&x<15)return true;
    if(z>21.3&&z<26&&x>-17&&x<17.5)return true;
    // A loja tem vitrine, portanto não é atravessável. Interação ocorre na entrada.
    // Loja com corredor real: atravessa a abertura central da porta.
    if(x>-5.12&&x<-.49&&z<-10.39&&z>-6.75){
      if(z<-10.20)return true;
      if(x<-4.86||x>-.62)return true;
      // corredores livres; evita atravessar prateleiras e o caixa
      if(x<-3.65&&z<-7.72&&z>-9.45)return true;
      if(x>-2.32&&z<-7.70&&z>-8.75)return true;
      return false;
    }
    if(z<-6.52&&z>-6.83&&x>-5.12&&x<-.49&&!(x>-3.70&&x<-2.42))return true;
    if(z<-10.38&&x>-5.12&&x<-.49)return true;
    if(Math.abs(x-2.74)<.34&&Math.abs(z-1.86)<.30)return true;
    if(currentCar&&currentCar.state!=='leaving'&&Math.abs(x-currentCar.group.position.x)<1.45&&Math.abs(z-currentCar.group.position.z)<.83)return true;
    // Bombas físicas e pilares da estrutura.
    for(const island of pumpIslands)if(Math.abs(x-island.x)<.56&&Math.abs(z-island.z)<.50)return true;
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
    const localX=axis.x/length,localZ=axis.z/length;
    // Movimento relativo à orientação da câmera, como em jogos em terceira pessoa.
    const dx=(localX*Math.cos(cameraRig.yaw)+localZ*Math.sin(cameraRig.yaw))*speed*delta;
    const dz=(-localX*Math.sin(cameraRig.yaw)+localZ*Math.cos(cameraRig.yaw))*speed*delta;
    const nx=player.position.x+dx,nz=player.position.z+dz;
    if(!isBlocked(nx,player.position.z))player.position.x=nx;
    if(!isBlocked(player.position.x,nz))player.position.z=nz;
    player.rotation.y=Math.atan2(-dx,-dz);
    player.position.y=.29+Math.sin(performance.now()/135)*.018;
    return true;
  }
  function updateCamera(delta){
    const yaw=cameraRig.yaw,pitch=cameraRig.pitch;
    const target=new THREE.Vector3(player.position.x,player.position.y+1.05,player.position.z);
    if(cameraRig.firstPerson){
      const eye=new THREE.Vector3(player.position.x,player.position.y+1.53,player.position.z);
      const forward=new THREE.Vector3(-Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch));
      const changed=cam.position.distanceToSquared(eye)>.000001;
      cam.position.copy(eye);cam.lookAt(eye.clone().add(forward));
      return changed;
    }
    const horizontal=cameraRig.distance*Math.cos(pitch);
    const desired=target.clone().add(new THREE.Vector3(Math.sin(yaw)*horizontal,cameraRig.distance*Math.sin(pitch),Math.cos(yaw)*horizontal));
    // Evita que a câmera entre no volume da loja ao se aproximar do caixa.
    if(ctx.cameraObstacles?.length){
      const direction=desired.clone().sub(target),length=direction.length();
      cameraRay.set(target,direction.normalize());
      cameraRay.far=length;
      for(const obstacle of ctx.cameraObstacles)obstacle.updateWorldMatrix(true,false);
      const hits=cameraRay.intersectObjects(ctx.cameraObstacles,false);
      if(hits.length&&hits[0].distance<length){
        desired.copy(target).addScaledVector(direction,Math.max(1.2,hits[0].distance-.32));
      }
    }
    const old=cam.position.distanceToSquared(desired);
    cam.position.lerp(desired,1-Math.exp(-Math.min(.2,delta)*8));
    cam.lookAt(target);
    return old>.00002;
  }
  function tick(now){
    if(!states.active)return;
    const dt=lastFrame?Math.min(.05,(now-lastFrame)/1000):.016;
    lastFrame=now;
    if(!document.hidden){
      const moved=move(dt);
      const cameraMoving=updateCamera(dt);
      const carMoved=animateCustomer(dt);
      const closeToDoor=Math.hypot(player.position.x+2.84,player.position.z+6.65)<2.15 || (player.position.z<-6.75&&player.position.z>-10.40&&player.position.x>-5.1&&player.position.x<-.5);
      window.ecoScene.setShopOpen?.(states.active&&closeToDoor);
      if(moved||cameraMoving||carMoved)ctx.requestRender();
      if(moved){ctx.stage.classList.add('game-moving');}
      else ctx.stage.classList.remove('game-moving');
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
    cam.position.copy(player.position).add(new THREE.Vector3(3.75,5.5,6.3));
    cam.lookAt(player.position.x,1.05,player.position.z);
    cameraRig.firstPerson=false;player.visible=true;
    cameraRig.pitch=.56;cameraRig.distance=7.4;
    cameraButton.textContent='◉ Câmera 3ª pessoa';
    ctx.controls.enabled=false;
    window.ecoScene.setActiveCamera(cam);
    lastFrame=0;
    updateHud();updateMini();updateCustomerHUD();
    if(!currentCar)createQueueCar();
    animId=requestAnimationFrame(tick);
    ctx.requestRender();
  }
  function stop(){
    if(!states.active)return;
    states.active=false;states.keys.clear();cameraRig.dragging=false;cameraRig.pointerId=null;
    window.ecoScene.setShopOpen?.(false);
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
    if(here.kind==='pump-island')selectNozzle(here.island);
    else if(here.kind==='payment')window.dispatchEvent(new Event('ecoposto:open-payment'));
    else if(here.kind==='computer')window.dispatchEvent(new Event('ecoposto:open-pos'));
    else renderShop(here.kind);
  }
  $('start-game').addEventListener('click',start);
  $('exit-game').addEventListener('click',stop);
  $('game-interact').addEventListener('click',interact);
  // Mouse/toque gira a câmera sem alterar a movimentação; roda ajusta distância.
  const canvas=ctx.renderer.domElement;
  canvas.addEventListener('pointerdown',event=>{
    if(!states.active||document.querySelector('dialog[open]')||(event.pointerType==='mouse'&&event.button!==0))return;
    cameraRig.dragging=true;cameraRig.pointerId=event.pointerId;
    cameraRig.lastX=event.clientX;cameraRig.lastY=event.clientY;
    try{canvas.setPointerCapture(event.pointerId);}catch{}
  });
  canvas.addEventListener('pointermove',event=>{
    if(!states.active||!cameraRig.dragging||cameraRig.pointerId!==event.pointerId)return;
    const dx=event.clientX-cameraRig.lastX,dy=event.clientY-cameraRig.lastY;
    cameraRig.lastX=event.clientX;cameraRig.lastY=event.clientY;
    cameraRig.yaw-=dx*.006;
    const minPitch=cameraRig.firstPerson?-.65:.18;
    const maxPitch=cameraRig.firstPerson?.75:1.20;
    cameraRig.pitch=Math.max(minPitch,Math.min(maxPitch,cameraRig.pitch+dy*.004));
    event.preventDefault();
    ctx.requestRender();
  });
  function releasePointer(event){
    if(event.pointerId===cameraRig.pointerId){
      cameraRig.dragging=false;cameraRig.pointerId=null;
    }
  }
  canvas.addEventListener('pointerup',releasePointer);
  canvas.addEventListener('pointercancel',releasePointer);
  canvas.addEventListener('lostpointercapture',releasePointer);
  canvas.addEventListener('wheel',event=>{
    if(!states.active||cameraRig.firstPerson)return;
    event.preventDefault();
    cameraRig.distance=Math.max(3.4,Math.min(10.5,cameraRig.distance+Math.sign(event.deltaY)*.55));
    ctx.requestRender();
  },{passive:false});
  // Tecla V alterna entre 1ª e 3ª pessoa durante o jogo.
  const keyMap={w:'w',a:'a',s:'s',d:'d',arrowup:'arrowup',arrowdown:'arrowdown',arrowleft:'arrowleft',arrowright:'arrowright',shift:'shift'};
  document.addEventListener('keydown',event=>{
    if(!states.active||event.repeat&&event.key.toLowerCase()==='e')return;
    if(event.target instanceof HTMLElement&&event.target.closest('input,select,textarea,[contenteditable=true]'))return;
    if(document.querySelector('dialog[open]'))return;
    const key=event.key.toLowerCase();
    if(keyMap[key]){event.preventDefault();states.keys.add(key);}
    if(key==='e'){event.preventDefault();interact();}
    if(key==='v'){event.preventDefault();toggleCamera();}
    if(key==='escape'&&!document.fullscreenElement&&!stage.closest('.scene-card')?.classList.contains('fullscreen-fallback'))stop();
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
    vehicle.value=pump.type==='flex'?'flex':pump.type==='diesel-antigo'?'diesel-antigo':'diesel';
    // Pedido realista: valor em reais, litros ou completar tanque.
    const selected=currentCar?.state==='parked'&&currentCar.order.id===pump.id?currentCar.order:null;
    const price=product.price;
    const amount=selected?(selected.orderType==='valor'?Math.round(5000/price):
      selected.orderType==='completar'?Math.max(1,selected.capacity-selected.tank):selected.requested):20;
    targetInput.value=String(amount);targetInput.max=pump.type==='flex'?'80':'200';
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
    if(pump.type==='diesel-antigo')return choice==='diesel-antigo';
    return false;
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
    if(currentCar?.state==='parked'&&currentCar.order.id===filling.product.id){
      currentCar.order.filled=litres;
      currentCar.order.tank=Math.min(currentCar.order.capacity,currentCar.order.tank+litres);
      currentCar.state='filled';updateCustomerHUD();
    }
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
  window.ecoGame={start,stop,interact,isActive:()=>states.active,near:()=>nearest(),
    getPumpIds:()=>pumpList.map(p=>p.id),getIslands:()=>pumpIslands.map(x=>x.id),
    currentCustomer:()=>currentCar?.order||null,spawnCustomer:createQueueCar};
}
if(window.ecoScene)initialise();
else window.addEventListener('ecoposto:scene-ready',initialise,{once:true});
