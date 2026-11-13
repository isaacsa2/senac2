import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Posto-escola 3D com materiais físicos, texturas procedurais e detalhes de pista leves.
// Mantém as posições originais das bombas e os eventos usados pelo PDV.
const stage = document.querySelector('#scene-stage');
const host = document.querySelector('#scene-canvas');
const fallback = document.querySelector('#scene-fallback');
const markersHost = document.querySelector('#scene-markers');
const smallScreen = () => window.innerWidth < 650;
const lowPower = () => smallScreen() || (navigator.hardwareConcurrency||8)<=4;
const color = (hex) => new THREE.MeshStandardMaterial({color:hex,roughness:.87,metalness:.02});
const palette = {
  grass:color('#d6e7d4'), concrete:color('#f2eee4'), road:color('#485d5c'),
  white:color('#fffdf4'), trim:color('#1d7358'), green:color('#207859'),
  dark:color('#244a42'), darkGlass:color('#305f68'), glass:color('#82b6b5'),
  lime:color('#b9e879'), gold:color('#f7c965'), gray:color('#7d958b'),
  wheels:color('#273634'), blue:color('#477ca9'), red:color('#d65a51'),
  metal:new THREE.MeshStandardMaterial({color:'#9caeb4',metalness:.67,roughness:.29}),
  glass:new THREE.MeshPhysicalMaterial({color:'#8ac9d7',metalness:.05,roughness:.12,transparent:true,opacity:.65,side:THREE.DoubleSide}),
  led:new THREE.MeshStandardMaterial({color:'#fff5cd',emissive:'#ffdb90',emissiveIntensity:1.7,roughness:.24}),
  screen:new THREE.MeshStandardMaterial({color:'#bbffba',emissive:'#54a366',emissiveIntensity:.52,roughness:.3})
};
function makeLabel(text, foreground='#fff', background=null, fontSize=66) {
  const canvas=document.createElement('canvas'); canvas.width=512;canvas.height=128;
  const ctx=canvas.getContext('2d');
  if(background){ctx.fillStyle=background;ctx.fillRect(0,0,512,128);}
  ctx.font='800 '+Math.round(fontSize*.5)+'px Arial,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillStyle=foreground;ctx.fillText(text,256,65,475);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  texture.anisotropy=2;
  return new THREE.MeshBasicMaterial({map:texture,transparent:true,side:THREE.DoubleSide,depthWrite:false});
}
let renderer, camera, controls, world, scene, renderQueued=false, activeCamera=null, daylight, sunLight;
let lamps=[],qualityMode='auto',cameraObstacles=[];
let anchors=[];
function buildScene(){
  scene=new THREE.Scene();
  scene.background=null;
  scene.fog=new THREE.Fog('#d9e7df',29,57);
  world=new THREE.Group();scene.add(world);
  daylight=new THREE.HemisphereLight('#edf6ff','#65866a',1.45);scene.add(daylight);
  sunLight=new THREE.DirectionalLight('#fff3d6',2.15);
  sunLight.position.set(-12,20,13);
  sunLight.castShadow=true;
  sunLight.shadow.mapSize.set(1024,1024);
  sunLight.shadow.camera.left=-17;sunLight.shadow.camera.right=17;
  sunLight.shadow.camera.top=18;sunLight.shadow.camera.bottom=-18;
  sunLight.shadow.camera.near=1;sunLight.shadow.camera.far=65;
  sunLight.shadow.bias=-.0002;
  scene.add(sunLight);
  function pavedMaterial(base,mode){
    const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;
    const g=canvas.getContext('2d');
    g.fillStyle=base;g.fillRect(0,0,256,256);
    for(let y=0;y<256;y+=4)for(let x=0;x<256;x+=4){
      const hash=((x*31+y*47+x*y*3)>>>0)%29;
      g.fillStyle='rgba(30,40,35,'+((hash+1)/1300)+')';
      g.fillRect(x+(hash%3),y+(hash%2),1,1);
    }
    if(mode==='concrete'){
      g.strokeStyle='rgba(75,83,72,.09)';g.lineWidth=2;
      for(const p of [0,128,255]){g.beginPath();g.moveTo(p,0);g.lineTo(p,256);g.stroke();g.beginPath();g.moveTo(0,p);g.lineTo(256,p);g.stroke();}
    }
    const texture=new THREE.CanvasTexture(canvas);
    texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
    texture.repeat.set(mode==='concrete'?4:6,mode==='concrete'?4:2);
    texture.colorSpace=THREE.SRGBColorSpace;
    texture.anisotropy=2;
    return new THREE.MeshStandardMaterial({map:texture,roughness:.96,metalness:0});
  }
  const concreteSurface=pavedMaterial('#e0dfd5','concrete'),asphaltSurface=pavedMaterial('#485653','asphalt');
  function box(w,h,d,x,y,z,material,parent=world){
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),typeof material==='string'?color(material):material);
    mesh.position.set(x,y,z);
    mesh.castShadow=w>.38&&h>.28&&d>.14;
    mesh.receiveShadow=w>1&&d>.8;
    parent.add(mesh);return mesh;
  }
  function cylinder(r1,r2,h,x,y,z,mat,segments=10){
    const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,segments),mat);
    mesh.position.set(x,y,z);mesh.castShadow=r1>.22&&h>.3;world.add(mesh);return mesh;
  }
  function planeLabel(text,w,h,x,y,z,fg='#fff',bg=null,fontSize=66,rotation=0){
    const obj=new THREE.Mesh(new THREE.PlaneGeometry(w,h),makeLabel(text,fg,bg,fontSize));
    obj.position.set(x,y,z);obj.rotation.y=rotation;world.add(obj);return obj;
  }
  function ellipseShadow(x,z,rx,rz,opacity=.11){
    const shadow=new THREE.Mesh(new THREE.CircleGeometry(1,24),new THREE.MeshBasicMaterial({color:'#244636',transparent:true,opacity,depthWrite:false}));
    shadow.rotation.x=-Math.PI/2;shadow.scale.set(rx,rz,1);shadow.position.set(x,.33,z);world.add(shadow);
  }
  // Terreno, calçada e faixa de rodagem
  box(25,.24,23,0,-.11,-2.2,palette.grass);
  box(23,.24,19.5,0,.08,-2.0,concreteSurface);
  box(21,.11,2.9,0,.04,5.2,asphaltSurface);
  box(19,.1,.21,0,.19,3.65,color('#d5d6c6'));
  for(let x=-9;x<=9;x+=3.2)box(1.55,.02,.075,x,.105,5.2,color('#f1dfb5'));
  for(let x=-8;x<=8;x+=2.3)box(.12,.018,.8,x,.22,2.85,color('#f4d984'));
  // Vagas demarcadas, passeio, ralos, faixa de pedestre e sinalização de acesso.
  const stripes=color('#f2e9cf'), curb=color('#c9c8b9'), drain=color('#4d6765');
  for(const x of [-8.25,-5.25,-2.25,.75]) {
    box(.055,.018,1.25,x,.22,1.55,stripes);
  }
  for(let i=0;i<6;i++)box(.29,.018,1.85,-7.6+i*.52,.21,4.05,stripes);
  box(11.2,.12,.22,-2.8,.21,-5.25,curb);
  for(const x of [-8.3,-3.5,1.0,6.9]){
    box(.46,.024,.26,x,.218,2.4,drain);
    for(const dx of [-.15,-.05,.05,.15])box(.022,.004,.17,x+dx,.234,2.4,palette.gray);
  }
  // Pedras e meio-fios limitam as áreas ajardinadas.
  for(const z of [-10.75,6.35])box(23,.28,.17,0,.22,z,curb);
  // Cobertura, pilares e placas solares (bombas)
  const canopyX=-2.8,canopyZ=-1.45;
  box(11.0,.5,5.7,canopyX,3.95,canopyZ,palette.trim);
  box(11.25,.13,5.9,canopyX,4.25,canopyZ,palette.lime);
  box(11.1,.19,.18,canopyX,3.78,1.43,palette.gold);
  box(10.8,.14,.14,canopyX,3.55,1.44,palette.white);
  // Fileiras de luminárias LED sob a cobertura: materiais emissivos + poucas luzes reais.
  for(const x of [-6.1,-3.1,.05]){
    for(const z of [-2.6,.35])box(1.5,.065,.16,x,3.62,z,palette.led);
    const lamp=new THREE.PointLight('#fff1cf',0,8,2);
    lamp.position.set(x,3.2,-1.5);scene.add(lamp);lamps.push(lamp);
  }
  planeLabel('ECOPOSTO',5.2,.67,-3.9,3.93,1.59,'#ffffff',null,105);
  planeLabel('SHELL  ·  TREINAMENTO',3,.35,.0,3.97,1.61,'#e7f5de',null,54);
  for(const x of [-7.35,1.75])for(const z of [-3.7,.85]){
    box(.34,3.65,.34,x,1.95,z,palette.white);
    box(.48,.15,.48,x,.3,z,palette.gray);
    box(.44,.18,.44,x,3.69,z,palette.gold);
  }
  for(let i=0;i<5;i++)for(let j=0;j<2;j++){
    const panel=box(1.55,.045,1.47,-6.5+i*1.78,4.40,-2.8+j*1.72,color('#365a71'));
    panel.rotation.z=-.045;
    box(.055,.055,1.43,-6.5+i*1.78,4.45,-2.8+j*1.72,color('#85b7bd'));
  }
  // Bombas com bicos, telas, mangueiras e cores distintas
  function dispenser(x,z,accent,name){
    ellipseShadow(x,z,.62,.54,.09);
    box(1.06,.16,.78,x,.35,z,palette.gray);
    box(.94,2.1,.64,x,1.45,z,palette.white);
    box(1.00,.22,.72,x,2.58,z,accent);
    box(.68,.61,.037,x,2.10,z+.34,palette.darkGlass);
    box(.65,.44,.048,x,2.15,z+.366,palette.screen);
    box(.47,.15,.043,x,2.20,z+.394,color('#dcf6e1'));
    box(.39,.11,.046,x,1.97,z+.397,color('#a1c9c9'));
    planeLabel('R$   0,00',.55,.13,x,2.28,z+.424,'#1c6043',null,50);
    planeLabel('L     0,00',.55,.12,x,2.06,z+.425,'#1c6043',null,51);
    box(.72,.12,.039,x,1.59,z+.341,accent);
    planeLabel(name,.64,.18,x,1.59,z+.37,'#fff',null,73);
    for(const dx of [-.2,.2]){
      box(.11,.35,.06,x+dx,1.09,z+.37,palette.dark);
      box(.08,.14,.15,x+dx,1.20,z+.44,accent);
    }
    const path=new THREE.CatmullRomCurve3([
      new THREE.Vector3(x+.43,1.9,z+.25),
      new THREE.Vector3(x+.76,1.5,z+.25),
      new THREE.Vector3(x+.75,.9,z+.26),
      new THREE.Vector3(x+.54,.7,z+.3)]);
    world.add(new THREE.Mesh(new THREE.TubeGeometry(path,16,.035,5,false),palette.wheels));
    cylinder(.055,.055,.15,x+.54,.71,z+.3,palette.dark);
  }
  // Seis bombas: correspondem exatamente aos seis combustíveis usados no catálogo.
  // Duas fileiras de três, mantendo a contagem de objetos baixa para aparelhos modestos.
  dispenser(-6.15,-2.95,color('#5eaa7d'),'COMUM');
  dispenser(-3.05,-2.95,color('#c65c56'),'NITRO+');
  dispenser(.05,-2.95,color('#b94143'),'RACING');
  dispenser(-6.15,-.40,color('#d8b359'),'ETANOL');
  dispenser(-3.05,-.40,color('#518bb7'),'S10');
  dispenser(.05,-.40,color('#6d879a'),'S500');
  // Conveniência atrás do posto, com vitrine e produtos em exibição.
  // O grupo permite mover o edifício inteiro sem afetar as coordenadas internas.
  const shopFirst=world.children.length;
  ellipseShadow(5.27,-2.47,2.8,2.25,.095);
  const convenienceShell=box(4.6,2.85,3.65,5.27,1.66,-2.50,palette.white);
  cameraObstacles.push(convenienceShell);
  box(4.92,.3,4.0,5.27,3.23,-2.50,palette.trim);
  box(4.98,.11,4.06,5.27,3.43,-2.5,palette.lime);
  box(4.65,.64,.13,5.27,2.65,-.61,palette.green);
  planeLabel('CONVENIÊNCIA',3.45,.42,5.27,2.67,-.53,'#ffffff',null,74);
  box(2.25,1.64,.065,4.15,1.31,-.635,palette.darkGlass);
  box(2.04,1.42,.072,4.15,1.33,-.58,palette.glass);
  box(.095,1.51,.09,4.15,1.3,-.53,palette.white);
  box(1.12,1.75,.07,6.84,1.24,-.62,palette.darkGlass);
  box(.96,1.60,.076,6.84,1.26,-.55,palette.glass);
  box(.09,.1,.1,6.44,1.28,-.48,palette.white);
  box(4.56,.14,.65,5.27,.35,-.22,palette.gray);
  box(3.15,.16,.14,5.27,2.23,-.51,color('#f8cf70'));
  for(const x of [3.4,4.9,5.85])box(.30,.21,.07,x,1.13,-.49,color('#fdf9e0'));
  // Detalhes de vidro, iluminação de loja e balcão: visual de posto urbano.
  box(2.00,1.48,.025,4.15,1.29,-.525,palette.glass);
  box(.92,1.51,.024,6.84,1.26,-.506,palette.glass);
  box(2.95,.06,.30,5.2,2.20,-.44,palette.led);
  // PC de caixa completo: monitor, tela de PDV, base, teclado, impressora e leitor.
  box(.77,.53,.10,6.02,1.40,.36,palette.dark);
  box(.63,.41,.017,6.02,1.41,.419,palette.screen);
  planeLabel('ECO PDV',.49,.12,6.02,1.47,.435,'#1d5b38',null,58);
  planeLabel('CAIXA 01',.44,.10,6.02,1.34,.435,'#1d5b38',null,51);
  box(.08,.19,.07,6.02,1.05,.34,palette.metal);
  box(.37,.035,.21,6.02,.96,.55,palette.dark);
  box(.47,.048,.16,6.02,.91,.83,palette.metal);
  for(let i=0;i<6;i++)for(let j=0;j<2;j++)box(.052,.006,.029,5.84+i*.072,.94,.785+j*.07,palette.gray);
  box(.36,.26,.26,5.25,1.00,.7,palette.dark);
  box(.30,.07,.25,5.25,1.16,.7,palette.metal);
  box(.27,.18,.018,5.25,1.25,.84,palette.white);
  // Expositor de conveniência com latas, garrafas e embalagens modeladas.
  box(3.55,.12,.58,5.15,.6,.38,palette.white);
  box(3.55,.11,.58,5.15,1.2,.38,palette.white);
  box(3.55,.11,.58,5.15,1.82,.38,palette.white);
  for(const x of [3.58,4.13,4.68,5.23,5.78,6.33]){
    const c=x<5.15?color('#dc3d34'):color('#436aab');
    for(const y of [.8,1.4,2.02]){
      cylinder(.115,.115,.35,x,y,.45,c,10);
      cylinder(.122,.122,.028,x,y+.19,.45,palette.white,10);
      planeLabel(x<5.15?'Coca-Cola':'Red Bull',.34,.15,x,y,.58,'#ffffff',null,47);
    }
  }
  // Maquininha estilizada sobre o balcão de conveniência.
  box(.25,.35,.20,6.85,.87,.62,color('#263c39'));
  box(.20,.18,.025,6.85,.99,.74,color('#b4e7ae'));
  box(.16,.06,.03,6.85,.81,.74,color('#5b8274'));
  planeLabel('PIX',.18,.09,6.85,1.01,.758,'#245239',null,50);
  // Ilha de bebidas na entrada: três embalagens maiores em destaque.
  for(const [x,c,name] of [[3.85,'#cf352d','COCA'],[5.15,'#496dba','RED BULL'],[6.5,'#72b3e5','ÁGUA']]){
    const material=color(c);
    cylinder(.25,.25,.8,x,.65,1.05,material,14);
    cylinder(.255,.255,.045,x,1.07,1.05,palette.white,14);
    planeLabel(name,.48,.18,x,.72,1.31,'#ffffff',null,65);
  }
  const shopEnd=world.children.length;
  const shopGroup=new THREE.Group();
  for(const mesh of world.children.slice(shopFirst,shopEnd))shopGroup.attach(mesh);
  shopGroup.position.set(-8.1,0,-6.05);
  world.add(shopGroup);
  shopGroup.updateMatrixWorld(true);
  // Box de TROCA DE ÓLEO ao lado direito das bombas: cobertura aberta,
  // rampa, ferramentas, barris e embalagens (sem modelagens externas pesadas).
  ellipseShadow(6.35,-.35,3.0,2.9,.12);
  box(5.0,.23,4.4,6.45,.32,-.45,color('#dce3dc'));
  box(5.10,.32,4.63,6.40,3.25,-.45,palette.dark);
  box(5.16,.10,4.68,6.40,3.48,-.45,palette.gold);
  for(const x of [4.15,8.65])for(const z of [-2.5,1.65]){
    box(.22,2.86,.22,x,1.76,z,palette.white);
    box(.35,.20,.35,x,.35,z,palette.gray);
  }
  box(5.05,.54,.14,6.40,2.72,1.89,palette.green);
  planeLabel('TROCA DE ÓLEO',4.35,.46,6.40,2.72,1.98,'#ffffff',null,72);
  // Área aberta visível de frente, com elevador pantográfico estilizado.
  box(3.05,.22,1.65,6.33,.55,-.4,color('#4f6464'));
  box(2.2,.14,1.34,6.33,1.00,-.4,palette.gray);
  for(const x of [5.43,7.23]){
    box(.11,.8,.11,x,.76,-.4,palette.dark);
    box(.24,.12,1.32,x,1.08,-.4,palette.gold);
  }
  for(const x of [4.45,8.05]){
    for(const z of [-1.7,-1.15]){
      cylinder(.32,.35,.54,x,.61,z,color('#2b6c92'),12);
      box(.45,.18,.02,x,.61,z+.33,palette.white);
    }
  }
  // Armário e itens de óleo Shell ao lado do box
  box(1.12,1.45,.68,8.22,1.10,-2.1,palette.white);
  box(1.10,.10,.75,8.22,1.85,-2.1,palette.green);
  for(const x of [7.88,8.23,8.58])for(const y of [1.12,1.53]){
    box(.26,.43,.23,x,y,-1.64,color('#9da2a1'));
    box(.20,.22,.021,x,y+.03,-1.51,color('#e8eced'));
    planeLabel('HELIX',.20,.13,x,y+.03,-1.49,'#bc3f30',null,46);
  }
  box(.62,.92,.56,4.6,.80,-1.85,color('#f4c54f'));
  planeLabel('ARLA 32',.61,.25,4.6,.86,-1.55,'#1a536d',null,52);
  // Terminal autônomo na pista: pagamento didático sem caixa físico.
  box(.52,.18,.55,2.74,.27,1.86,curb);
  box(.18,1.15,.17,2.74,.91,1.86,palette.metal);
  box(.47,.56,.32,2.74,1.63,1.86,palette.dark);
  box(.36,.30,.028,2.74,1.69,2.034,palette.screen);
  planeLabel('PIX / CARD',.34,.09,2.74,1.73,2.053,'#194a34',null,52);
  planeLabel('DEMO',.33,.10,2.74,1.58,2.054,'#155438',null,52);
  box(.26,.10,.026,2.74,1.36,2.032,palette.gray);
  for(const x of [2.42,3.06]){cylinder(.10,.11,.72,x,.63,2.11,palette.gold,10);}
  // Placa totem com informações e placas pequenas
  box(.27,3.3,.28,-9.15,1.78,-3.7,palette.dark);
  box(1.52,2.20,.35,-9.15,3.50,-3.7,palette.green);
  planeLabel('ECO',1.2,.45,-9.15,4.09,-3.49,'#d5fb99',null,128);
  planeLabel('POSTO',1.2,.36,-9.15,3.64,-3.49,'#ffffff',null,103);
  planeLabel('DEMO',1.2,.29,-9.15,3.08,-3.49,'#ffd56c',null,94);
  planeLabel('COMUM  6,25',1.24,.24,-9.15,2.82,-3.47,'#ffffff',null,49);
  planeLabel('S10     5,99',1.24,.24,-9.15,2.60,-3.47,'#ffffff',null,49);
  // Valores e letreiros exclusivamente demonstrativos.
  // Veículo leve, formas simples e rodas
  function car(x,z,bodyColor){
    ellipseShadow(x,z,1.65,.94,.12);
    box(2.65,.60,1.31,x,.75,z,bodyColor);
    box(1.48,.58,1.16,x-.2,1.28,z,bodyColor);
    box(.86,.41,1.19,x-.55,1.37,z,palette.darkGlass);
    box(.46,.22,1.20,x+1.15,.70,z,palette.white);
    for(const dx of [-.88,.86])for(const dz of [-.67,.67]){
      const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.34,.34,.16,12),palette.wheels);
      wheel.rotation.x=Math.PI/2;wheel.position.set(x+dx,.49,z+dz);world.add(wheel);
      const hub=new THREE.Mesh(new THREE.CylinderGeometry(.17,.17,.17,12),palette.gray);
      hub.rotation.x=Math.PI/2;hub.position.set(x+dx,.49,z+dz+(dz>0?.025:-.025));world.add(hub);
    }
    for(const dz of [-.46,.46])box(.13,.19,.20,x+1.35,.82,z+dz,palette.gold);
    for(const dz of [-.46,.46])box(.07,.20,.18,x-1.33,.82,z+dz,palette.red);
  }
  car(-2.8,2.80,color('#457a9c'));
  car(-6.85,1.7,color('#dad6c9'));
  // Faixas refletivas sobre o piso e pequenas balizas na lateral.
  for(const x of [3.45,9.25])for(const z of [-2.75,1.45]){
    cylinder(.065,.075,.74,x,.66,z,palette.gold,8);
    cylinder(.07,.07,.10,x,.93,z,palette.white,8);
  }
  // Arborização estilizada de baixo número de polígonos
  function tree(x,z,h=.95){
    ellipseShadow(x,z,.7,.7,.08);
    cylinder(.16,.22,1.05*h,x,.80*h,z,color('#8b9b6f'),7);
    for(const [dx,dy,dz,size] of [[0,1.65,0,.9],[-.42,1.45,0,.66],[.42,1.52,-.2,.66]]){
      const mesh=new THREE.Mesh(new THREE.IcosahedronGeometry(size*h,0),color('#6eac81'));
      mesh.position.set(x+dx*h,dy*h,z+dz*h);world.add(mesh);
    }
  }
  tree(-10.4,2.6,.8);tree(-9.0,-10.5,.8);tree(10.25,-5,.85);tree(10.45,3.3,.7);
  // Bordas da praça / canteiros
  for(const x of [-8.3,8.2]){
    box(.7,.24,1.6,x,.26,1.85,color('#eff2da'));
    for(let i=0;i<3;i++)cylinder(.21,.24,.45,x,.53,1.3+i*.46,color('#74af80'),6);
  }
  anchors=[
    {label:'Bombas · 6 combustíveis',category:'combustiveis',position:new THREE.Vector3(-3.2,4.68,.15)},
    {label:'Conveniência atrás do posto',category:'conveniencia',position:new THREE.Vector3(-2.82,4.15,-8.1)},
    {label:'Troca de óleo lateral',category:'cuidados',position:new THREE.Vector3(6.5,4.12,.4)},
    {label:'Coca-Cola',productId:'coca',image:'https://santaluzia.vtexassets.com/arquivos/ids/997380/556297.jpg?v=638525861586730000',position:new THREE.Vector3(-4.20,2.1,-5.08)},
    {label:'Red Bull',productId:'redbull',image:'https://carrefourbr.vtexassets.com/arquivos/ids/183189711/image-0.jpg?v=638740381539970000',position:new THREE.Vector3(-2.70,2.1,-5.08)},
    {label:'Shell Helix',productId:'oleo',image:'https://images.tcdn.com.br/img/img_prod/945233/shell_helix_hx8_sp_gf6_5w_30_305337_1_d60fb75deefdebba672b1596906b76c6.jpg',position:new THREE.Vector3(7.6,2.6,-1.2)},
    {label:'Caixa com computador',action:'payment',position:new THREE.Vector3(-1.70,2.35,-5.5)},
    {label:'Maquininha na pista',action:'payment',position:new THREE.Vector3(2.74,2.5,1.86)}
  ];
  for(const anchor of anchors){
    const btn=document.createElement('button');
    btn.type='button';btn.className='scene-marker'+(anchor.productId?' scene-product':'');
    if(anchor.image){
      const photo=document.createElement('img');
      photo.src=anchor.image;photo.alt='Imagem real de '+anchor.label;
      photo.loading='lazy';photo.decoding='async';
      photo.addEventListener('error',()=>photo.replaceWith(document.createTextNode('◈')));
      btn.append(photo);
    }else{
      const dot=document.createElement('span');dot.className='marker-dot';btn.append(dot);
    }
    const label=document.createElement('span');label.textContent=anchor.label;
    btn.append(label);
    btn.addEventListener('click',()=>{
      if(anchor.productId)window.dispatchEvent(new CustomEvent('ecoposto:show-product',{detail:{id:anchor.productId}}));
      else if(anchor.action==='payment')window.dispatchEvent(new Event('ecoposto:open-payment'));
      else window.dispatchEvent(new CustomEvent('ecoposto:zone',{detail:{category:anchor.category}}));
    });
    markersHost.appendChild(btn);anchor.element=btn;
  }
}
function draw(){
  renderQueued=false;
  if(!renderer||!stage.isConnected)return;
  const viewCamera=activeCamera||camera;
  viewCamera.updateMatrixWorld();
  for(const marker of anchors){
    const projected=marker.position.clone().project(viewCamera);
    const x=(projected.x+1)/2*100;
    const y=(-projected.y+1)/2*100;
    marker.element.style.left=x+'%';marker.element.style.top=y+'%';
    marker.element.hidden=projected.z>1||x<-4||x>104||y<2||y>99;
  }
  if(!activeCamera&&controls?.enableDamping)controls.update();
  renderer.render(scene,viewCamera);
}
function queueDraw(){
  if(!renderQueued){renderQueued=true;requestAnimationFrame(draw);}
}
const views={
  geral:{position:[18,15,18],target:[-.7,1.2,-2.0],zoom:.91},
  bombas:{position:[5.5,8.4,11.0],target:[-3.05,1.3,-1.1],zoom:1.17},
  loja:{position:[6.8,7.5,-1.5],target:[-2.85,1.5,-7.7],zoom:1.30},
  servicos:{position:[12.3,7.8,8.1],target:[6.4,1.5,-.25],zoom:1.37}
};
let transitionId=0;
function focus(name='geral'){
  stage.dataset.view=name;
  const view=views[name]||views.geral;
  const startPos=camera.position.clone(),startTarget=controls.target.clone(),startZoom=camera.zoom;
  const endPos=new THREE.Vector3(...view.position),endTarget=new THREE.Vector3(...view.target);
  const endZoom=view.zoom*(smallScreen()?.80:1);
  const duration=window.matchMedia('(prefers-reduced-motion:reduce)').matches?0:400;
  if(!duration){camera.position.copy(endPos);controls.target.copy(endTarget);camera.zoom=endZoom;camera.updateProjectionMatrix();controls.update();queueDraw();return;}
  const token=++transitionId,started=performance.now();
  function step(now){
    if(token!==transitionId)return;
    const t=Math.min(1,(now-started)/duration),ease=1-Math.pow(1-t,3);
    camera.position.lerpVectors(startPos,endPos,ease);
    controls.target.lerpVectors(startTarget,endTarget,ease);
    camera.zoom=startZoom+(endZoom-startZoom)*ease;
    camera.updateProjectionMatrix();controls.update();queueDraw();
    if(t<1)requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
function resize(){
  if(!renderer||!camera)return;
  const width=Math.max(stage.clientWidth,300),height=Math.max(stage.clientHeight,280);
  const aspect=width/height;
  const halfHeight=aspect<1.25?10.7:7.9;
  camera.left=-halfHeight*aspect;camera.right=halfHeight*aspect;
  camera.top=halfHeight;camera.bottom=-halfHeight;
  camera.updateProjectionMatrix();
  if(activeCamera&&activeCamera.isPerspectiveCamera){
    activeCamera.aspect=aspect;activeCamera.updateProjectionMatrix();
  }
  renderer.setSize(width,height,false);queueDraw();
}
try{
  if(!window.WebGLRenderingContext)throw new Error('WebGL não disponível');
  renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'default',preserveDrawingBuffer:false});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,lowPower()?1.05:1.7));
  renderer.shadowMap.enabled=!lowPower();
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.18;
  host.appendChild(renderer.domElement);
  camera=new THREE.OrthographicCamera(-14,14,8,-8,.1,100);
  camera.position.set(...views.geral.position);
  controls=new OrbitControls(camera,renderer.domElement);
  controls.target.set(...views.geral.target);
  controls.enablePan=false;controls.enableDamping=true;controls.dampingFactor=.075;
  controls.minZoom=.57;controls.maxZoom=2.7;
  controls.minPolarAngle=.25;controls.maxPolarAngle=1.42;
  controls.rotateSpeed=.68;controls.zoomSpeed=.85;
  controls.addEventListener('change',queueDraw);
  // Orientação sensível ao toque; preserva o controle por arrasto no modo observação.
  buildScene();
  resize();controls.update();queueDraw();
  fallback.hidden=true;
  function setQuality(mode='auto'){
    if(!['auto','economico','alto'].includes(mode))mode='auto';
    qualityMode=mode;
    const detail=mode==='alto'||(mode==='auto'&&!lowPower());
    renderer.shadowMap.enabled=detail;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,mode==='economico'?1:detail?1.7:1.10));
    sunLight.shadow.mapSize.set(detail?1024:512,detail?1024:512);
    sunLight.shadow.map?.dispose();
    if(sunLight.shadow.map)sunLight.shadow.map=null;
    renderer.shadowMap.needsUpdate=true;
    resize();queueDraw();
  }
  function setNight(night){
    daylight.intensity=night?.62:1.45;
    sunLight.intensity=night?.14:2.15;
    sunLight.color.set(night?'#9cbde4':'#fff3d6');
    scene.fog.color.set(night?'#1b3449':'#d9e7df');
    for(const lamp of lamps)lamp.intensity=night?13:.35;
    stage.classList.toggle('night-mode',!!night);
    queueDraw();
  }
  setQuality('auto');
  window.ecoScene={
    focus,
    requestRender:queueDraw,setQuality,
    getContext:()=>({THREE,scene,world,renderer,overviewCamera:camera,controls,stage,anchors,cameraObstacles,requestRender:queueDraw}),
    setActiveCamera:(next)=>{activeCamera=next||null;controls.enabled=!activeCamera;queueDraw();},
    setNight
  };
  window.dispatchEvent(new Event('ecoposto:scene-ready'));
  const ro=new ResizeObserver(resize);ro.observe(stage);
  renderer.domElement.addEventListener('webglcontextlost',(event)=>{
    event.preventDefault();fallback.hidden=false;markersHost.replaceChildren();host.replaceChildren();
  });
}catch(error){
  console.warn('EcoPosto 3D: a visualização WebGL não pôde ser iniciada.',error);
  fallback.hidden=false;
}
