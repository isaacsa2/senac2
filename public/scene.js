import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createDistrict } from './world-extra.js?v=street-v8';

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
let lamps=[],qualityMode='auto',cameraObstacles=[],district=null,shopDoors=[];
let ambientLast=0,ambientId=0,ambientVisible=true;
let weather='limpo',isNight=false,asphaltMaterial=null,concreteMaterial=null;
let hoseGroup=null,rainDrops=null,rainArray=null,rainSpeed=[];
const PUMP_HOSE_COLORS={'gasolina-comum':'#4daa67','gasolina-nitro':'#da785b',
  'gasolina-racing':'#bc3945','etanol-comum':'#dcad4b','diesel-s10':'#4898cb','diesel-s500':'#638296'};

let anchors=[];
function buildScene(){
  scene=new THREE.Scene();
  scene.background=null;
  scene.fog=new THREE.Fog('#d9e7df',35,78);
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
  concreteMaterial=concreteSurface;asphaltMaterial=asphaltSurface;
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
  // O pátio não pode cobrir a pista: o antigo piso de concreto ia até z=7,75,
  // ficando acima do asfalto e fazendo a calçada aparecer no meio da rua.
  box(23,.16,15.5,0,.08,-4.25,concreteSurface);
  // Via de acesso contínua até conectar as duas ruas laterais do bairro.
  box(33.4,.12,2.9,0,.065,5.2,asphaltSurface);
  box(19,.1,.21,0,.19,3.65,color('#d5d6c6'));
  for(let x=-14.0;x<=14;x+=3.2)box(1.55,.016,.075,x,.142,5.2,color('#f1dfb5'));

  for(let x=-8;x<=8;x+=2.3)box(.12,.018,.8,x,.22,2.85,color('#f4d984'));
  // Vagas demarcadas, passeio, ralos, faixa de pedestre e sinalização de acesso.
  const stripes=color('#f2e9cf'), curb=color('#c9c8b9'), drain=color('#4d6765');
  for(const x of [-8.25,-5.25,-2.25,.75]) {
    box(.055,.018,1.25,x,.22,1.55,stripes);
  }
  for(let i=0;i<6;i++)box(.29,.018,1.85,-7.6+i*.52,.142,4.05,stripes);
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
  // Posto brasileiro: três ILHAS físicas e seis produtos em seis bicos.
  // Ilha mista: comum, aditivada, etanol; ilha diesel: S10/S500; ilha premium: Racing.
  const islands=[
    {x:-5.45,z:-1.40,title:'FLEX',fuel:[['COMUM','#6ebc84'],['ADITIVADA','#db7067'],['ETANOL','#ddb959']]},
    {x:-2.40,z:-1.40,title:'DIESEL',fuel:[['S10','#4b9bcc'],['S500','#6f839a']]},
    {x:.65,z:-1.40,title:'PREMIUM',fuel:[['RACING','#bc3a44']]}
  ];
  function dispenser(island){
    const {x,z,title,fuel}=island;
    ellipseShadow(x,z,.66,.60,.08);
    box(1.15,.17,.83,x,.37,z,palette.gray);
    box(1.03,2.18,.72,x,1.52,z,palette.white);
    box(1.08,.24,.83,x,2.69,z,palette.trim);
    box(.82,.66,.055,x,2.18,z+.388,palette.dark);
    box(.71,.42,.059,x,2.20,z+.424,palette.screen);
    planeLabel('R$  0,00',.63,.14,x,2.26,z+.464,'#245b39',null,51);
    planeLabel('L    0,00',.63,.12,x,2.08,z+.464,'#245b39',null,50);
    planeLabel(title,.89,.16,x,1.69,z+.375,'#ffffff','#21674d',68);
    fuel.forEach(([name,hex],i)=>{
      const dx=(i-(fuel.length-1)/2)*.29;
      const material=color(hex);
      box(.25,.11,.075,x+dx,1.38,z+.399,material);
      planeLabel(name,.29,.12,x+dx,1.39,z+.442,'#ffffff',hex,48);
      box(.09,.33,.08,x+dx,1.01,z+.40,palette.dark);
      box(.10,.16,.13,x+dx,1.17,z+.47,material);
      const path=new THREE.CatmullRomCurve3([
        new THREE.Vector3(x+dx,1.06,z+.42),
        new THREE.Vector3(x+dx+.20,.77,z+.58),
        new THREE.Vector3(x+dx+.12,.55,z+.60),
        new THREE.Vector3(x+dx+.02,.68,z+.46)]);
      world.add(new THREE.Mesh(new THREE.TubeGeometry(path,9,.019,4,false),palette.wheels));
    });
    box(.86,.11,.08,x,.65,z+.41,palette.metal);
    for(const side of [-.54,.54])box(.09,1.16,.07,x+side,1.28,z-.08,palette.metal);
    planeLabel(title==='FLEX'?'3 BICOS':title==='DIESEL'?'2 BICOS':'1 BICO',
      .78,.12,x,.84,z+.423,'#285c45',null,50);
  }
  for(const island of islands)dispenser(island);
  // Drenagem, defensas e demarcações de cada ilha.
  for(const island of islands){
    box(1.65,.14,1.42,island.x,.23,island.z,color('#d1d8ce'));
    for(const side of [-.85,.85]){
      cylinder(.09,.09,.72,island.x+side,.60,island.z+.50,palette.gold,8);
    }
    box(2.15,.018,.06,island.x,.215,1.25,color('#f8db9b'));
  }
  // Loja transitável: paredes e vitrines com porta de correr, corredor, caixa e produtos.
  const shopFirst=world.children.length;
  ellipseShadow(5.27,-2.48,2.8,2.20,.06);
  const shellMat=color('#f4f1e8'),tile=color('#d6d7cf'),darkFrame=color('#3a554f');
  box(4.62,.22,3.74,5.27,.30,-2.51,tile);
  cameraObstacles.push(box(4.68,2.82,.12,5.27,1.69,-4.36,shellMat));
  cameraObstacles.push(box(.12,2.82,3.65,2.95,1.69,-2.50,shellMat));
  cameraObstacles.push(box(.12,2.82,3.65,7.59,1.69,-2.50,shellMat));
  // Fachada de vidro aberta ao centro para entrada real do personagem.
  box(1.45,2.03,.10,3.70,1.39,-.63,palette.glass);
  box(1.20,2.03,.10,6.92,1.39,-.63,palette.glass);
  box(.10,2.40,.12,4.45,1.49,-.62,darkFrame);
  box(.10,2.40,.12,6.27,1.49,-.62,darkFrame);
  const doorL=box(.73,2.08,.045,4.95,1.39,-.56,palette.glass);
  const doorR=box(.73,2.08,.045,5.58,1.39,-.56,palette.glass);
  shopDoors=[{mesh:doorL,x:4.95,dx:-.57},{mesh:doorR,x:5.58,dx:.57}];
  for(const door of shopDoors){
    box(.035,1.89,.052,door.x+.21,1.39,-.52,palette.metal);
  }
  box(4.93,.27,4.02,5.27,3.25,-2.49,palette.trim);
  box(4.97,.11,4.07,5.27,3.45,-2.49,palette.lime);
  box(4.73,.54,.16,5.27,2.75,-.53,palette.green);
  planeLabel('CONVENIÊNCIA',3.66,.39,5.27,2.77,-.426,'#ffffff',null,78);
  box(4.62,.15,.40,5.27,3.00,-.53,palette.led);
  // Revestimento de piso em quadrados, com prateleira central livre para circulação lateral.
  const grout=color('#aebbb6');
  for(let i=0;i<5;i++){
    box(.024,.018,3.45,3.19+i*.99,.43,-2.51,grout);
  }
  for(let z=-4.20;z<-.70;z+=.75)box(4.30,.018,.027,5.28,.43,z,grout);
  // Refrigeradores no fundo da loja com portas transparentes e iluminação interna.
  for(const x of [3.61,4.47,5.33]){
    box(.78,2.0,.55,x,1.48,-4.03,palette.white);
    box(.66,1.68,.034,x,1.45,-3.734,palette.darkGlass);
    box(.62,1.60,.032,x,1.46,-3.701,palette.glass);
    box(.08,1.35,.05,x+.25,1.45,-3.674,palette.metal);
    for(const y of [1.05,1.55,2.05])for(const dx of [-.18,0,.18]){
      cylinder(.075,.075,.25,x+dx,y,-3.66,color(y>1.7?'#4c78b0':'#cd3c3b'),8);
    }
  }
  // Ilha de prateleiras na lateral esquerda, sem bloquear o acesso ao caixa.
  for(const y of [.72,1.36,1.97]){
    box(1.36,.08,.53,3.75,y,-2.30,palette.white);
    for(const x of [3.25,3.57,3.89,4.21]){
      const c=x<3.75?color('#c63235'):color('#426d9e');
      cylinder(.10,.10,.32,x,y+.19,-2.25,c,9);
      cylinder(.108,.108,.024,x,y+.36,-2.25,palette.metal,9);
    }
  }
  box(.13,1.56,.11,3.10,1.22,-2.30,darkFrame);
  box(.13,1.56,.11,4.39,1.22,-2.30,darkFrame);
  // Parede de lanches e expositores com três embalagens ampliadas.
  for(const [x,c,name] of [[3.45,'#cf352d','COCA'],[4.42,'#456bae','RED BULL'],[5.30,'#74b3e5','ÁGUA']]){
    cylinder(.20,.20,.69,x,.74,-1.43,color(c),12);
    cylinder(.20,.20,.036,x,1.10,-1.43,palette.white,12);
    planeLabel(name,.37,.12,x,.79,-1.207,'#ffffff',null,56);
  }
  // Balcão do PDV do lado direito, com PC, teclado, impressora e maquininha.
  box(1.85,.18,.72,6.50,.94,-2.02,palette.white);
  box(1.85,.82,.70,6.50,.51,-2.02,color('#cbd3c9'));
  box(.79,.55,.10,6.20,1.35,-2.26,palette.dark);
  box(.70,.46,.019,6.20,1.37,-2.204,palette.screen);
  planeLabel('ECO PDV',.58,.13,6.20,1.42,-2.19,'#125637',null,62);
  planeLabel('CAIXA 01',.52,.10,6.20,1.30,-2.18,'#125637',null,52);
  box(.10,.22,.08,6.20,1.01,-2.25,palette.metal);
  box(.50,.04,.18,6.20,1.04,-1.75,palette.dark);
  for(let i=0;i<5;i++)for(let j=0;j<2;j++)box(.06,.009,.031,6.02+i*.085,1.066,-1.81+j*.065,palette.gray);
  box(.34,.30,.23,6.97,1.15,-2.34,palette.dark);
  box(.27,.08,.22,6.97,1.31,-2.34,palette.metal);
  box(.27,.14,.014,6.97,1.39,-2.207,palette.white);
  box(.27,.37,.23,6.99,1.31,-1.78,color('#253f3b'));
  box(.22,.17,.022,6.99,1.42,-1.65,palette.screen);
  planeLabel('PIX',.18,.07,6.99,1.43,-1.632,'#275c3f',null,48);
  box(.22,.09,.021,6.99,1.19,-1.65,palette.gray);
  // Letreiros de seções internas e quadro de ofertas fictícias.
  planeLabel('BEBIDAS  •  LANCHES',2.28,.27,4.44,2.40,-4.277,'#4a7a55',null,64);
  planeLabel('PAGAMENTO AQUI',1.48,.20,6.48,2.18,-3.94,'#387453',null,58);
  const shopEnd=world.children.length;
  const shopGroup=new THREE.Group();
  shopGroup.name='loja-conveniencia-interior';
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
  // Oficina detalhada: bancada de ferramentas, elevador, motor e drenagem segura.
  box(2.15,.14,.78,6.44,.42,-.43,palette.metal);
  for(const x of [5.60,7.30])for(const z of [-.92,.06]){
    box(.12,.96,.12,x,.90,z,palette.dark);
  }
  box(2.45,.14,1.56,6.44,1.53,-.45,color('#4f7d88'));
  box(2.09,.20,1.18,6.44,1.68,-.45,color('#cfdbdf'));
  // Veículo de manutenção sobre o elevador.
  box(2.64,.42,1.26,6.42,1.99,-.46,color('#b2c4cc'));
  box(1.22,.45,1.08,6.17,2.37,-.46,palette.darkGlass);
  for(const dx of [-.88,.85])for(const dz of [-.64,.64]){
    const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.28,.28,.14,10),palette.wheels);
    wheel.rotation.x=Math.PI/2;wheel.position.set(6.42+dx,1.78,-.46+dz);world.add(wheel);
  }
  // Coletor de óleo usado sob o veículo.
  cylinder(.39,.41,.37,6.40,.68,-.45,color('#2d5158'),12);
  cylinder(.42,.42,.06,6.40,.88,-.45,palette.metal,12);
  box(1.16,1.78,.13,8.29,1.40,-.80,palette.dark);
  for(const [i,x] of [7.91,8.27,8.63].entries()){
    const tool=box(.07,.76,.058,x,1.63,-.708,palette.metal);
    tool.rotation.z=i===1?.24:-.15;
    box(.26,.10,.06,x,2.05,-.71,palette.gold);
  }
  box(1.22,.78,.67,8.13,.73,.96,palette.gray);
  box(1.12,.08,.70,8.13,1.15,.96,palette.metal);
  box(.71,.25,.12,8.13,.93,1.33,palette.dark);
  planeLabel('LUBRIFICANTES',1.06,.16,8.13,1.31,1.35,'#2b694e',null,54);
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
  // Não há carros decorativos na entrada: vagas fixas ficam atrás da loja,
  // no bairro, fora das rotas de tráfego e do atendimento.
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
  district=createDistrict({world,scene,lowPower:lowPower()});
  // Bordas da praça / canteiros
  for(const x of [-8.3,8.2]){
    box(.7,.24,1.6,x,.26,1.85,color('#eff2da'));
    for(let i=0;i<3;i++)cylinder(.21,.24,.45,x,.53,1.3+i*.46,color('#74af80'),6);
  }
  anchors=[
    {label:'3 ilhas · 6 combustíveis',category:'combustiveis',position:new THREE.Vector3(-2.40,4.68,-1.4)},
    {label:'Conveniência atrás do posto',category:'conveniencia',position:new THREE.Vector3(-2.82,4.15,-8.1)},
    {label:'Troca de óleo lateral',category:'cuidados',position:new THREE.Vector3(6.5,4.12,.4)},
    {label:'Coca-Cola',productId:'coca',image:'https://santaluzia.vtexassets.com/arquivos/ids/997380/556297.jpg?v=638525861586730000',position:new THREE.Vector3(-4.65,1.9,-7.42)},
    {label:'Red Bull',productId:'redbull',image:'https://carrefourbr.vtexassets.com/arquivos/ids/183189711/image-0.jpg?v=638740381539970000',position:new THREE.Vector3(-3.63,1.9,-7.42)},
    {label:'Shell Helix',productId:'oleo',image:'https://images.tcdn.com.br/img/img_prod/945233/shell_helix_hx8_sp_gf6_5w_30_305337_1_d60fb75deefdebba672b1596906b76c6.jpg',position:new THREE.Vector3(7.6,2.6,-1.2)},
    {label:'Caixa com computador',action:'payment',position:new THREE.Vector3(-1.65,2.12,-8.0)},
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
  servicos:{position:[12.3,7.8,8.1],target:[6.4,1.5,-.25],zoom:1.37},
  bairro:{position:[49,37,48],target:[0,1.5,2.0],zoom:.60}
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
  function disposeHose(){
    if(!hoseGroup)return;
    world.remove(hoseGroup);
    hoseGroup.traverse(obj=>{if(obj.isMesh){obj.geometry?.dispose?.();obj.material?.dispose?.();}});
    hoseGroup=null;
  }
  function setHose(data){
    disposeHose();
    if(!data?.attached||!data.vehicle||!data.pump)return;
    const car=data.vehicle;
    const cap=car.userData?.fuelCap;
    if(!cap)return;
    car.updateWorldMatrix(true,true);
    const end=cap.getWorldPosition(new THREE.Vector3());
    const start=new THREE.Vector3(data.pump.x+.31,1.12,data.pump.z+.44);
    const middle=start.clone().lerp(end,.55);
    middle.y=Math.min(start.y,end.y)-.64;
    const points=[start,start.clone().lerp(middle,.48).add(new THREE.Vector3(.08,-.34,.03)),
      middle,middle.clone().lerp(end,.55).add(new THREE.Vector3(-.10,-.24,.06)),end];
    const hoseMat=new THREE.MeshStandardMaterial({color:'#1d302a',roughness:.89,metalness:.05});
    const curve=new THREE.CatmullRomCurve3(points);
    hoseGroup=new THREE.Group();hoseGroup.name='mangueira-de-abastecimento';
    const rubber=new THREE.Mesh(new THREE.TubeGeometry(curve,20,.027,6,false),hoseMat);
    hoseGroup.add(rubber);
    const gripMat=new THREE.MeshStandardMaterial({color:PUMP_HOSE_COLORS[data.pump.id]||'#3eaa72',roughness:.41,metalness:.22});
    const grip=new THREE.Mesh(new THREE.CylinderGeometry(.075,.075,.24,9),gripMat);
    grip.position.copy(end);grip.rotation.x=Math.PI/2;hoseGroup.add(grip);
    const trigger=new THREE.Mesh(new THREE.BoxGeometry(.12,.11,.07),gripMat.clone());
    trigger.position.copy(end).add(new THREE.Vector3(.02,-.08,.035));hoseGroup.add(trigger);
    const indicatorMat=new THREE.MeshBasicMaterial({color:data.flowing?'#8bea73':'#4c6655'});
    const indicator=new THREE.Mesh(new THREE.SphereGeometry(.045,8,6),indicatorMat);
    indicator.position.copy(start).add(new THREE.Vector3(0,.25,.10));
    hoseGroup.add(indicator);
    world.add(hoseGroup);queueDraw();
  }
  function createRain(){
    const count=lowPower()?95:260;
    rainArray=new Float32Array(count*6);
    for(let i=0;i<count;i++){
      const x=(Math.random()-.5)*49,z=(Math.random()-.5)*37,y=Math.random()*10;
      rainArray[i*6]=x;rainArray[i*6+1]=y;rainArray[i*6+2]=z;
      rainArray[i*6+3]=x-.04;rainArray[i*6+4]=y-.33;rainArray[i*6+5]=z+.08;
      rainSpeed[i]=8+Math.random()*6;
    }
    const g=new THREE.BufferGeometry();
    g.setAttribute('position',new THREE.BufferAttribute(rainArray,3).setUsage(THREE.DynamicDrawUsage));
    const m=new THREE.LineBasicMaterial({color:'#b2d9eb',transparent:true,opacity:.51,depthWrite:false});
    rainDrops=new THREE.LineSegments(g,m);rainDrops.visible=false;rainDrops.frustumCulled=false;
    scene.add(rainDrops);
  }
  function moveRain(dt){
    if(weather!=='chuva'||!rainDrops)return;
    for(let i=0;i<rainSpeed.length;i++){
      let y=rainArray[i*6+1]-rainSpeed[i]*dt;
      if(y<.18){
        y=9+Math.random()*3;
        let x=(Math.random()-.5)*49,z=(Math.random()-.5)*37;
        if(x>-8&&x<2&&z>-4&&z<1)x+=11; // menos gotas sob a cobertura
        rainArray[i*6]=x;rainArray[i*6+2]=z;
      }
      rainArray[i*6+1]=y;
      rainArray[i*6+3]=rainArray[i*6]-.04;
      rainArray[i*6+4]=y-.34;rainArray[i*6+5]=rainArray[i*6+2]+.08;
    }
    rainDrops.geometry.attributes.position.needsUpdate=true;
  }
  createRain();
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
  function applyAtmosphere(){
    const cloudy=weather==='nublado',raining=weather==='chuva';
    daylight.intensity=isNight?.62:raining?.82:cloudy?1.18:1.45;
    sunLight.intensity=isNight?.14:raining?.45:cloudy?1.15:2.15;
    sunLight.color.set(isNight?'#a6c0ee':raining?'#dde8ed':cloudy?'#e9f2f4':'#fff3d6');
    scene.fog.color.set(isNight?'#21354b':raining?'#b5c6cf':cloudy?'#c7d5d5':'#d9e7df');
    scene.fog.near=raining?21:cloudy?29:35;
    scene.fog.far=raining?58:cloudy?66:78;
    if(asphaltMaterial){
      asphaltMaterial.color.set(raining?'#a6b7bf':'#ffffff');
      asphaltMaterial.roughness=raining?.32:.96;
      asphaltMaterial.metalness=raining?.11:0;
      asphaltMaterial.needsUpdate=true;
    }
    if(concreteMaterial){concreteMaterial.roughness=raining?.55:.96;concreteMaterial.needsUpdate=true;}
    for(const lamp of lamps)lamp.intensity=isNight?13:raining?1.2:cloudy?.55:.35;
    if(rainDrops)rainDrops.visible=raining;
    stage.classList.toggle('night-mode',isNight);
    stage.classList.toggle('rain-mode',raining);
    district?.setNight(isNight);
    queueDraw();
  }
  function setNight(night){isNight=!!night;applyAtmosphere();}
  function setWeather(next){
    if(!['limpo','nublado','chuva'].includes(next))next='limpo';
    weather=next;applyAtmosphere();return weather;
  }
    // Animação ambiente com limite de FPS, pausada quando o painel não está visível.
  let doorOpening=0,doorTarget=0,previousTrafficLabel=0;
  function animateAmbient(time){
    ambientId=requestAnimationFrame(animateAmbient);
    if(document.hidden||!ambientVisible)return;
    if(ambientLast&&time-ambientLast<(lowPower()?58:35))return;
    const delta=ambientLast?Math.min(.24,Math.max(0,(time-ambientLast)/1000)):.035;
    ambientLast=time;
    // Trânsito com tempo estável em GPU lenta, sem extrapolar física dos semáforos.
    const steps=Math.max(1,Math.ceil(delta/.08));
    for(let i=0;i<steps;i++)district?.update(time-delta*1000+(i+1)*delta*1000/steps,delta/steps);
    if(weather==='chuva')moveRain(delta);
    if(time-previousTrafficLabel>2500){
      previousTrafficLabel=time;
      const target=document.querySelector('#traffic-count');
      if(target&&district){
        const stats=district.diagnostics();
        target.textContent=stats.cars+' veículos · '+stats.pedestrians+' pedestres';
        target.title='Trânsito dinâmico: '+stats.collisionsPrevented+
          ' aproximações evitadas, '+stats.gridlocksResolved+' bloqueios recuperados';
      }
    }
    const next=doorOpening+(doorTarget-doorOpening)*Math.min(1,delta*6);
    if(Math.abs(next-doorOpening)>.0001){doorOpening=next;
      for(const door of shopDoors)door.mesh.position.x=door.x+door.dx*doorOpening;
    }
    queueDraw();
  }
  function setShopOpen(value){doorTarget=value?1:0;}
  requestAnimationFrame(animateAmbient);
  if(typeof IntersectionObserver==='function'){
    const obs=new IntersectionObserver(entries=>{ambientVisible=!!entries[0]?.isIntersecting;ambientLast=0;},{threshold:.03});
    obs.observe(stage);
  }
  setQuality('auto');
  window.ecoScene={
    focus,
    requestRender:queueDraw,setQuality,setShopOpen,setHose,setWeather,getWeather:()=>weather,
    setTrafficDensity:(value)=>district?.setTrafficDensity(value)||{mode:value,count:0,max:0},
    getTrafficStats:()=>district?.diagnostics()||{cars:0,max:0,spawned:0,signals:null},
    getTrafficCars:()=>district?.trafficCars?.()||[],
    setTrafficExternalVehicle:vehicle=>district?.setExternalVehicle?.(vehicle),
    isRouteFreeFor:(vehicle,pose)=>district?.isRouteFreeFor?.(vehicle,pose)!==false,
    getSidewalkSegments:()=>district?.sidewalkSegments?.()||[],
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
