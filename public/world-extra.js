import * as THREE from 'three';
import {buildTrafficRoutes,sampleRoute,trafficLightPhase,rotateTowards,wheelRotationForTravel,trafficEnvelope,trafficOverlaps,TRAFFIC_JUNCTIONS,junctionWinner,trafficJunctionDistance} from './traffic-paths.js?v=street-v8';

// Ambientação externa com geometria original e leve; sem pacotes de modelos.
const surface=(hex,roughness=.85,metalness=.01)=>new THREE.MeshStandardMaterial({color:hex,roughness,metalness});
const l=(hex)=>new THREE.MeshBasicMaterial({color:hex});
/**
 * Carro leve com eixo longitudinal +X; eixos das rodas paralelos ao eixo Z.
 * O pivô gira em Z local, enquanto a malha do pneu é rotacionada X=PI/2 só uma vez.
 */
export function createVehicle(tint='#29739a',variant='car'){
  const root=new THREE.Group();
  if(variant==='motorcycle'){
    const paint=surface(tint,.45,.19),black=surface('#24282d'),silver=surface('#aebbc1',.29,.51);
    const lights=surface('#f1e9cf'),back=surface('#c84947');
    const wheels=[];
    function item(w,h,d,x,y,z,material,parent=root){
      const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
      mesh.position.set(x,y,z);mesh.castShadow=true;parent.add(mesh);return mesh;
    }
    item(1.22,.30,.54,0,.68,0,paint);
    item(.64,.16,.55,-.23,.92,0,black);
    item(.50,.23,.48,.36,.92,0,paint);
    item(.08,.14,.75,.52,1.04,0,silver);
    item(.06,.16,.08,1.03,.76,0,lights);
    item(.08,.13,.13,-1.03,.73,0,back);
    const helmet=new THREE.Mesh(new THREE.SphereGeometry(.23,9,7),surface('#374c65'));
    helmet.position.set(-.14,1.55,0);root.add(helmet);
    const rider=item(.34,.54,.39,-.20,1.19,0,surface('#4c6b61'));
    for(const x of [-.83,.83]){
      const pivot=new THREE.Group();pivot.position.set(x,.37,0);root.add(pivot);
      const tire=new THREE.Mesh(new THREE.CylinderGeometry(.36,.36,.17,13),black);
      tire.rotation.x=Math.PI/2;pivot.add(tire);
      const hub=new THREE.Mesh(new THREE.CylinderGeometry(.16,.16,.18,10),silver);
      hub.rotation.x=Math.PI/2;pivot.add(hub);
      wheels.push(pivot);
    }
    let travelled=0;
    root.userData={wheels,variant:'motorcycle',axleAxis:'Z',forwardAxis:'X',wheelRadius:.36,
      spinWheels(metres){if(!Number.isFinite(metres))return;travelled+=metres;
        for(const pivot of wheels)pivot.rotation.z+=wheelRotationForTravel(metres,.36);},
      setBraking(active){back.emissive?.set('#e62828');back.emissiveIntensity=active?1:.10;},
      setTurnSignal(){},setLights(active){lights.emissive?.set('#ffe8aa');lights.emissiveIntensity=active?1.1:.08;},
      animateBody(dt){rider.rotation.z=Math.sin(travelled*.45)*.02;},
      setDoor(){},setFuelCap(){},getTravel(){return travelled;}};
    return root;
  }
  const paint=surface(tint,.43,.21),rubber=surface('#242a30',.91);
  const glass=surface('#355c68',.19,.24),rim=surface('#c1ccd2',.28,.65);
  const black=surface('#252b32',.77),white=surface('#f7f1d5',.3),indicator=surface('#e59b37',.42);
  const brakeMat=surface('#ae3334',.38);
  brakeMat.emissive.set('#e42727');brakeMat.emissiveIntensity=.11;
  white.emissive.set('#fff6d0');white.emissiveIntensity=.10;
  indicator.emissive.set('#f5a943');indicator.emissiveIntensity=.04;
  const type=['car','hatch','suv','pickup','van','bus'].includes(variant)?variant:'car';
  const length=type==='bus'?4.80:type==='pickup'?3.5:type==='van'?3.55:type==='suv'?3.22:type==='hatch'?2.56:2.88;
  const height=type==='bus'?1.42:type==='van'?1.15:type==='suv'?.82:.63;
  const wheels=[],turnSignals=[];
  function box(w,h,d,x,y,z,mat,parent=root){
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
    mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
  }
  box(length,.57,1.38,0,.71,0,paint);
  box(length-.18,.15,1.41,0,.42,0,black);
  if(type==='pickup'){
    box(1.60,.60,1.27,.49,1.19,0,paint);
    box(1.45,.36,1.31,.53,1.24,0,glass);
    box(1.35,.12,1.32,-.98,.95,0,black);
  }else{
    const cabinLen=type==='bus'?3.98:type==='van'?2.50:type==='suv'?2.00:type==='hatch'?1.55:1.70;
    box(cabinLen,height,1.30,type==='van'?-.23:-.16,1.07+height*.25,0,paint);
    box(cabinLen-.12,height*.67,1.323,type==='van'?-.24:-.17,1.15+height*.23,0,glass);
    if(type==='suv'||type==='van'||type==='bus')box(cabinLen+.05,.07,1.35,-.19,1.29+height*.75,paint);
    if(type==='bus'){
      box(1.2,.24,1.0,1.51,1.13,0,black);  // letreiro do micro-ônibus
      box(1.05,.14,.03,1.51,1.22,.53,white);
      for(const dx of [-1.36,-.70,-.04,.62])
        box(.05,.68,.042,dx,1.55,.678,black);
      for(const dx of [-1.36,-.70,-.04,.62])
        box(.05,.68,.042,dx,1.55,-.678,black);
    }
  }
  // Para-lamas, faróis, lanternas de freio e setas que piscam quando há curva.
  for(const side of [-.49,.49]){
    box(.12,.14,.28,length*.5,.75,side,white);
    box(.12,.16,.23,-length*.5,.75,side,brakeMat);
    const signal=box(.085,.10,.12,length*.5+.02,.61,side*1.15,indicator);
    turnSignals.push(signal);
  }
  const frontAxle=length*.5-.55,rearAxle=-length*.5+.55;
  for(const ax of [frontAxle,rearAxle])for(const side of [-.73,.73]){
    const pivot=new THREE.Group();pivot.position.set(ax,.36,side);root.add(pivot);
    const tire=new THREE.Mesh(new THREE.CylinderGeometry(.35,.35,.19,12),rubber);
    tire.rotation.x=Math.PI/2;tire.castShadow=true;pivot.add(tire);
    const hub=new THREE.Mesh(new THREE.CylinderGeometry(.195,.195,.204,10),rim);
    hub.rotation.x=Math.PI/2;pivot.add(hub);
    const sideZ=side>0?.113:-.113;
    for(const rad of [Math.PI/5,-Math.PI/5]){
      const spoke=box(.37,.053,.016,0,0,sideZ,rim,pivot);
      spoke.rotation.z=rad;
    }
    const center=new THREE.Mesh(new THREE.CylinderGeometry(.057,.057,.23,8),black);
    center.rotation.x=Math.PI/2;pivot.add(center);
    wheels.push(pivot);
  }
  // Porta do motorista animável e portinhola de combustível (lado da bomba).
  const driverDoorPivot=new THREE.Group();
  driverDoorPivot.position.set(-Math.min(.52,length*.2),1.09,-.708);
  root.add(driverDoorPivot);
  box(.67,.59,.052,-.33,0,0,paint,driverDoorPivot);
  box(.53,.19,.058,-.33,.20,-.005,glass,driverDoorPivot);
  box(.12,.042,.028,-.51,-.11,-.045,rim,driverDoorPivot);
  const fuelCapPivot=new THREE.Group();
  fuelCapPivot.position.set(-length*.28,.86,-.718);root.add(fuelCapPivot);
  const fuelCap=box(.075,.15,.17,0,0,0,rim,fuelCapPivot);
  let accumulatedDistance=0,doorAngle=0,doorTarget=0,capAngle=0,capTarget=0;
  root.userData={
    wheels,fuelCap,variant:type,axleAxis:'Z',forwardAxis:'X',wheelRadius:.35,
    spinWheels(metres){
      if(!Number.isFinite(metres)||!metres)return;
      const angle=wheelRotationForTravel(metres,.35);
      accumulatedDistance+=metres;
      for(const pivot of wheels)pivot.rotation.z+=angle;
    },
    setBraking(active){brakeMat.emissiveIntensity=active?1.4:.12;},
    setTurnSignal(active,on){
      indicator.emissiveIntensity=active&&on?1.25:.04;
    },
    setLights(enabled){white.emissiveIntensity=enabled?1.35:.10;},
    setDoor(open){doorTarget=open?-.83:0;},
    setFuelCap(open){capTarget=open?-.8:0;},
    animateBody(dt){
      const t=Math.min(1,Math.max(0,dt)*7);
      doorAngle+=(doorTarget-doorAngle)*t;
      driverDoorPivot.rotation.y=doorAngle;
      capAngle+=(capTarget-capAngle)*t;
      fuelCapPivot.rotation.y=capAngle;
    },
    getTravel(){return accumulatedDistance;}
  };
  return root;
}
export function disposeVehicle(vehicle){
  if(!vehicle)return;
  vehicle.parent?.remove(vehicle);
  const geometries=new Set(),materials=new Set();
  vehicle.traverse(o=>{
    if(o.geometry)geometries.add(o.geometry);
    const list=Array.isArray(o.material)?o.material:[o.material];
    for(const m of list)if(m)materials.add(m);
  });
  for(const g of geometries)g.dispose();
  for(const m of materials)m.dispose();
}
export function createDistrict({world,scene,lowPower=false}){
  const district=new THREE.Group();
  district.name='bairro-entorno';
  world.add(district);
  const asphalt=surface('#495359',.97),pavement=surface('#b4b9b4',.97),stone=surface('#dedcce',1),
    yellow=surface('#f0d99d'),white=surface('#e8ece7'),dark=surface('#354246'),
    foliage=surface('#5b8b6d'),stem=surface('#806f54');
  const traffic=[], clouds=[],blinkers=[],walking=[],signals=[],parkedVehicles=[],ambientDetails=[];
  let nextTrafficId=1,collisionAvoided=0,gridlocksResolved=0,retired=0;
  let externalVehicle=null;
  const elevatedSidewalks=[];

  const routes=buildTrafficRoutes();
  const paintChoices=['#b9c8cf','#b87563','#eee2c5','#3d7499','#a2b698',
    '#dbcab7','#445465','#d3cebd','#7393a6','#be8f48','#e4e7e8','#8b6677'];
  const variants=['car','car','hatch','hatch','suv','pickup','van','bus','motorcycle'];
  let night=false,lastLightPhase=null,spawnDelay=0,spawned=0;
  let maxTraffic=lowPower?8:15;
  function cube(w,h,d,x,y,z,mat,parent=district){
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
    mesh.position.set(x,y,z);mesh.castShadow=h>.4;mesh.receiveShadow=w>3||d>3;parent.add(mesh);
    return mesh;
  }
  function cylinder(r,h,x,y,z,material,parent=district){
    const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,8),material);
    mesh.position.set(x,y,z);parent.add(mesh);return mesh;
  }
  // Calçadas elevadas são interrompidas no cruzamento das vias laterais.
  // Nunca renderizar piso de passeio contínuo sobre a faixa por onde passa o tráfego.
  const sidewalkSections=[{x:-26.85,width:14.15},{x:0,width:28.45},{x:26.85,width:14.15}];
  function sidewalkRow(z,depth,material){
    for(const section of sidewalkSections){
      cube(section.width,.20,depth,section.x,.17,z,material);
      elevatedSidewalks.push({x:section.x,z,width:section.width,depth});
    }
  }
  // Terreno contínuo remove o fundo branco ao redor da malha viária.
  // O piso está abaixo de todas as vias para impedir z-fighting.
  const grass=surface('#8eaa91',1);
  cube(79,.14,76,0,-.29,-1.2,grass);
  // A praça do posto continua no centro; avenidas formam um quarteirão real.
  cube(68,.11,4.5,0,.035,9.0,asphalt);
  cube(68,.12,6.7,0,.045,14.3,asphalt);
  cube(5.2,.10,56,-17,.025,-3.3,asphalt);
  cube(5.2,.10,56,17,.025,-3.3,asphalt);
  // Passeio longitudinal em dois trechos: rampas de entrada e saída do posto em z=5.15.
  for(const x of [-12.7,12.7]){
    cube(1.3,.20,33.75,x,.16,-13.625,pavement);
    // O trecho alto só recomeça depois da avenida (z > 17.65).
    cube(1.3,.20,6.6,x,.16,21.20,pavement);
    // A faixa entre os dois trechos é asfalto contínuo: sem passeio sobre a rua.
  }
  sidewalkRow(19.0,2.30,stone);
  sidewalkRow(-14.0,2.30,pavement);
  // Entrada e saída do posto ficam livres; as calçadas param antes do acesso.
  cube(12,.20,1.13,-26.1,.15,6.12,pavement);
  cube(11.5,.20,1.13,26.1,.15,6.12,pavement);
  // A faixa de piso sobreposta que cruzava as ruas foi removida. Uma fileira basta.
  for(const x of [-17,17]){
    // Sarjeta e borda do asfalto nas ruas laterais.
    cube(.15,.10,56,x-2.72,.13,-3.3,stone);
    cube(.15,.10,56,x+2.72,.13,-3.3,stone);
  }
  // Tracejados de divisão, faixas de retenção e zebras: cada lado respeita o asfalto.
  for(let x=-30;x<=29;x+=4.0){
    if(Math.abs(x-17)<3.3||Math.abs(x+17)<3.3)continue;
    cube(1.45,.014,.08,x,.16,11.45,white);
  }
  for(const cx of [-12.1,12.1]){
    // Passagens de pedestres sobre a avenida, alinhadas às calçadas.
    for(let z=7.0;z<17.45;z+=.82)cube(1.85,.012,.46,cx,.162,z,white);
    cube(.18,.014,4.5,cx-3.40,.163,9.05,white);
    cube(.18,.014,4.5,cx+3.40,.163,14.6,white);
  }
  for(const z of [5.40,18.80]){
    for(const cx of [-17,17])for(let i=0;i<6;i++)
      cube(.43,.014,1.45,cx-1.60+i*.61,.163,z,white);
  }
  // Faixa de estacionamento atrás do posto e baias pintadas.
  cube(18,.10,2.2,-.6,.16,-12.30,surface('#a8aea9',1));
  for(let x=-8.15;x<8.5;x+=2.5){
    cube(.075,.015,1.70,x,.223,-12.50,white);
    cube(.95,.015,.065,x+1.15,.222,-13.30,white);
  }
  for(let x=-29;x<30;x+=4.2){
    cube(2.0,.016,.09,x,.119,9.9,yellow);
    cube(2.0,.016,.08,x,.119,14.45,yellow);
  }
  for(let z=-28;z<24;z+=3.3){
    cube(.09,.014,1.25,-17,.119,z,yellow);
    cube(.09,.014,1.25,17,.119,z,yellow);
  }
  for(let x=12.5;x<=15.9;x+=.47)cube(.28,.012,3.2,x,.118,8.25,white);
  function building(x,z,w,d,h,hue,sign){
    const group=new THREE.Group();group.position.set(x,0,z);district.add(group);
    const wall=surface(hue,.93),border=surface('#dee1da'),windowMat=surface('#517d87',.22,.17);
    cube(w,h,d,0,h/2+.22,0,wall,group);
    cube(w+.15,.23,d+.15,0,h+.32,0,dark,group);
    const n=Math.max(2,Math.floor(w/1.4));
    for(let i=0;i<n;i++){
      const px=-w/2+(i+.5)*w/n;
      for(let j=0;j<Math.max(1,Math.floor(h/1.65));j++){
        cube(.72,.73,.025,px,.95+j*1.4,d/2+.026,windowMat,group);
        cube(.76,.06,.032,px,1.35+j*1.4,d/2+.052,border,group);
      }
    }
    if(sign){
      cube(w*.80,.56,.065,0,2.0,d/2+.055,sign==='FARMÁCIA'?surface('#29816a'):dark,group);
      const c=document.createElement('canvas');c.width=512;c.height=96;
      const cx=c.getContext('2d');cx.font='bold 60px Arial';cx.textAlign='center';cx.textBaseline='middle';cx.fillStyle='#fff';cx.fillText(sign,256,49);
      const tx=new THREE.CanvasTexture(c);tx.colorSpace=THREE.SRGBColorSpace;
      const m=new THREE.Mesh(new THREE.PlaneGeometry(w*.7,.36),new THREE.MeshBasicMaterial({map:tx,transparent:true}));
      m.position.set(0,2.0,d/2+.09);group.add(m);
    }
  }
  building(-10.6,-19.7,7.4,4.4,5.7,'#c5a996','AUTOPEÇAS');
  building(0,-20.2,9.2,5.1,6.8,'#c6cbc6','MINIMERCADO');
  building(10.8,-20.1,8.6,4.6,5.5,'#b4c3cf','FARMÁCIA');
  building(-11,24.2,10.4,5.5,6.2,'#c8c0aa',null);
  building(2,24.8,8.7,5.4,8.1,'#a7b6ba',null);
  building(11.6,24.0,7.0,5.6,5.0,'#d0b0a4',null);
  // Bairro além do quarteirão central: fachada comercial, garagens e telhados.
  building(-26.3,-9.2,6.9,5.1,4.0,'#dbc7b3','LANCHES');
  building(-27.1,1.1,5.4,4.9,5.1,'#b8c2b8',null);
  building(26.2,-9.1,6.6,5.3,4.3,'#c5bdb8','OFICINA');
  building(27.0,1.3,5.0,4.9,6.3,'#a8bbc5',null);
  function label(text,x,y,z,w=1.8,h=.35,background='#2d6754'){
    const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;
    const context=canvas.getContext('2d');
    context.fillStyle=background;context.fillRect(0,0,512,128);
    context.fillStyle='#ffffff';context.font='bold 56px sans-serif';
    context.textAlign='center';context.textBaseline='middle';
    context.fillText(text,256,65,492);
    const texture=new THREE.CanvasTexture(canvas);
    texture.colorSpace=THREE.SRGBColorSpace;
    const plane=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide}));
    plane.position.set(x,y,z);district.add(plane);return plane;
  }
  // Identidade local, acessos e limites de velocidade apenas para a simulação.
  for(const [x,z,text] of [[-10.9,6.36,'ENTRADA'],[9.1,6.36,'SAÍDA']]){
    cylinder(.065,2.15,x,1.25,z,dark);
    label(text,x,2.45,z,1.40,.35);
  }
  for(const [x,z] of [[-25.4,7.2],[26.5,16.7],[-20.7,-10.2]]){
    cylinder(.06,2.16,x,1.27,z,dark);
    label('30 km/h',x,2.52,z,1.28,.38,'#4c666f');
  }
  // Estacionamento simples, canteiros e postes de sinalização.
  for(const x of [-9.7,11.2]){
    cube(1.7,.23,1.5,x,.28,-13.6,stone);
    for(const offset of [-.48,.48]){
      const leaf=new THREE.Mesh(new THREE.IcosahedronGeometry(.44,0),foliage);
      leaf.position.set(x+offset,.72,-13.6);district.add(leaf);
    }
  }
  function tree(x,z,s=1){
    cylinder(.12*s,1.45*s,x,.85*s,z,stem);
    for(const [dx,y,dz,r] of [[0,2.0,0,.84],[.6,1.75,-.1,.65],[-.5,1.76,.25,.65]]){
      const m=new THREE.Mesh(new THREE.IcosahedronGeometry(r*s,1),foliage);m.position.set(x+dx*s,y*s,z+dz*s);district.add(m);
    }
  }
  for(let x=-29;x<=29;x+=5.8){
    tree(x,20.0,.9);
    if(Math.abs(x)>12)tree(x,-14.7,.85);
  }
  // Ponto de ônibus, banco, lixeira e iluminação pública com faróis noturnos.
  cube(3.4,.18,1.5,6.0,2.7,18.1,dark);
  for(const x of [4.6,7.4])for(const z of [17.5,18.65])cube(.11,2.5,.10,x,1.5,z,dark);
  cube(2.6,1.0,.08,6,1.7,18.8,surface('#8dc5d2',.18,.22));
  cube(2.4,.16,.49,6,.68,18.2,stone);
  cube(2.1,.40,.08,6,1.05,18.5,dark);
  cube(.54,.95,.5,8.4,.65,18.2,surface('#35604b'));
  cylinder(.07,2.1,4.35,1.29,18.37,dark);
  label('ÔNIBUS',4.35,2.56,18.39,1.22,.35,'#247a66');
  // Refletores laterais, caixas elétricas e defensas.
  for(const [x,z] of [[-13.4,-12.3],[13.45,6.05],[-13.4,18.1]]){
    cube(.44,.7,.40,x,.50,z,surface('#648473'));
    cube(.48,.06,.43,x,.89,z,dark);
  }
  for(const x of [-29.2,-23.9,24.7,30.2])for(const z of [-10.5,-4.5]){
    cylinder(.075,1.03,x,.70,z,stone);
    cube(.22,.09,.22,x,1.22,z,yellow);
  }
  for(const x of [-24,-12,0,12,24]){
    cylinder(.075,5.1,x,2.7,17.6,dark);
    cube(.56,.13,.36,x,5.26,17.35,white);
    const light=new THREE.PointLight('#fff4ca',0,8,2);light.position.set(x,5.15,17.35);scene.add(light);blinkers.push(light);
  }
  // Estacionados SOMENTE nas baias atrás da conveniência, longe das rotas de entrada.
  for(const [i,x] of [-7.7,-2.85,2.55,7.15].entries()){
    if(lowPower&&i%2===1)continue;
    const variant=i===3?'van':i===0?'hatch':'car';
    const model=createVehicle(['#a7b1bd','#d1b89f','#6892a6','#c8c6b5'][i],variant);
    model.rotation.y=0;model.position.set(x,.18,-12.05);
    district.add(model);parkedVehicles.push({model,offset:i*.9,idx:i});
  }
  // Lixeira, bicicletário e cones de segurança, sem invadir a faixa de rolamento.
  for(const x of [-10.8,11.45]){
    for(let i=0;i<3;i++){
      const body=cylinder(.105,.28,x+i*.29,.42,-11.95,surface('#d59e54'));
      ambientDetails.push(body);
    }
  }
  for(const x of [5.0,5.85,6.70]){
    const wheelMat=surface('#303f43'),frameMat=surface('#54857c');
    for(const dz of [-.28,.28]){
      const wheel=new THREE.Mesh(new THREE.TorusGeometry(.19,.035,5,11),wheelMat);
      wheel.rotation.y=Math.PI/2;wheel.position.set(x,.39,20.18+dz);district.add(wheel);
    }
    cube(.59,.055,.08,x,.66,20.18,frameMat);
    cube(.06,.46,.08,x,.50,20.18,frameMat);
  }
  // Semáforos: eixos Leste/Oeste e Norte/Sul têm fases diferentes.
  function signal(x,z,axis){
    cylinder(.075,3.5,x,1.95,z,dark);
    cube(.35,.88,.30,x,3.5,z,dark);
    const lights=[];
    for(const [i,hue] of ['#c12d2d','#d3a63b','#2ca568'].entries()){
      const mat=new THREE.MeshStandardMaterial({color:hue,emissive:hue,emissiveIntensity:.05});
      const globe=new THREE.Mesh(new THREE.SphereGeometry(.11,8,6),mat);
      globe.position.set(x,3.75-i*.27,z+.18);district.add(globe);
      lights.push(mat);
    }
    signals.push({axis,lights});
  }
  signal(-21.4,6.25,'ew');signal(21.8,16.6,'ew');
  signal(-19.3,18.9,'ns');signal(19.6,5.6,'ns');
  function updateSignals(phase){
    if(lastLightPhase===phase)return;
    lastLightPhase=phase;
    for(const head of signals){
      const go=phase===head.axis;
      head.lights[0].emissiveIntensity=go?.06:1.45;
      head.lights[1].emissiveIntensity=phase==='all-red'?.65:.06;
      head.lights[2].emissiveIntensity=go?1.4:.06;
    }
  }
  const random=arr=>arr[Math.floor(Math.random()*arr.length)];
  function vehiclePose(car, distance=car.distance){
    const pose=sampleRoute(car.route,distance);
    return {id:car.id,...trafficEnvelope({x:pose.x,z:pose.z,heading:pose.heading,variant:car.variant})};
  }
  function externalPose(){
    if(!externalVehicle||!externalVehicle.parent)return null;
    return trafficEnvelope({x:externalVehicle.position.x,z:externalVehicle.position.z,
      heading:externalVehicle.rotation.y,variant:externalVehicle.userData?.variant||'car'});
  }
  function nearVehicle(candidate,exclude=null,clearance=.55){
    const external=externalPose();
    return (external&&trafficOverlaps(candidate,external,clearance))||
      traffic.some(car=>car!==exclude&&trafficOverlaps(candidate,vehiclePose(car),clearance));
  }
  function isRouteFreeFor(vehicle,pose){
    const candidate=trafficEnvelope({x:pose.x,z:pose.z,heading:pose.heading,
      variant:vehicle?.userData?.variant||'car'});
    return !traffic.some(car=>trafficOverlaps(candidate,vehiclePose(car),.55));
  }
  function createTrafficCar(initial=false){
    if(traffic.length>=maxTraffic)return false;
    for(let tries=0;tries<45;tries++){
      const route=random(routes);
      const distance=initial?Math.random()*Math.max(1,route.length-8):0;
      const at=sampleRoute(route,distance);
      const variant=random(variants);
      const shape=trafficEnvelope({x:at.x,z:at.z,heading:at.heading,variant});
      if(nearVehicle(shape,null,1.30))continue;
      if(TRAFFIC_JUNCTIONS.some(j=>trafficJunctionDistance(at.x,at.z,j)<4.8))continue;
      const model=createVehicle(random(paintChoices),variant);
      model.position.set(at.x,.18,at.z);model.rotation.y=at.heading;
      model.userData.setLights(night);district.add(model);
      traffic.push({id:nextTrafficId++,model,route,distance,variant,
        velocity:initial?Math.random()*1.5:0,cruise:2.8+Math.random()*2.3,
        offset:Math.random()*6,blockedFor:0,stalledFor:0,opacity:1,
        enteredJunction:0});
      spawned++;return true;
    }
    return false;
  }
  function setTrafficDensity(value){
    const allowed=['baixo','normal','intenso'];
    const mode=allowed.includes(value)?value:'normal';
    maxTraffic=lowPower?{baixo:4,normal:8,intenso:11}[mode]:
      {baixo:7,normal:15,intenso:19}[mode];
    while(traffic.length>maxTraffic){
      const entry=traffic.pop();disposeVehicle(entry.model);
    }
    spawnDelay=0;
    return {mode,max:maxTraffic,count:traffic.length};
  }
  // Distribuição aleatória inicial, com recusa de ocupações conflitantes.
  for(let i=0;i<(lowPower?7:13);i++)createTrafficCar(true);
  // Céu estilizado e nuvens com deslocamento suave.
  const cloudMat=new THREE.MeshBasicMaterial({color:'#f6f8f7',transparent:true,opacity:.70,depthWrite:false});
  for(let i=0;i<4;i++){
    const g=new THREE.Group(),x=-27+i*16;
    for(const [dx,dy,r] of [[0,0,2.0],[-2,-.15,1.45],[2,.15,1.5]]){
      const m=new THREE.Mesh(new THREE.SphereGeometry(r,8,6),cloudMat);
      m.position.set(dx,dy,0);m.scale.y=.36;g.add(m);
    }
    g.position.set(x,18,-20-i*4);district.add(g);clouds.push({group:g,base:x,speed:.12+i*.05});
  }
  // Pedestres do bairro andam SOMENTE sobre calçadas / calçadões:
  // não atravessam a via por meio de rotas aleatórias.
  const walkers=[
    {x:-9.6,z:19.55,axis:'x',span:2.9,coat:'#b88672',speed:.29},
    {x:2.1,z:19.55,axis:'x',span:4.1,coat:'#567ca2',speed:.23},
    {x:10.0,z:19.55,axis:'x',span:1.7,coat:'#c8a54d',speed:.21},
    {x:-8.2,z:-14.3,axis:'x',span:2.6,coat:'#a17e94',speed:.22},
    {x:4.4,z:-14.3,axis:'x',span:3.3,coat:'#709468',speed:.26},
    {x:-12.65,z:-3.6,axis:'z',span:4.1,coat:'#8c82b8',speed:.18},
    {x:12.65,z:-4.2,axis:'z',span:3.1,coat:'#b68569',speed:.16},
    {x:5.8,z:19.75,axis:'wait',span:.25,coat:'#807b94',speed:.11}
  ];
  for(const [i,profile] of walkers.entries()){
    if(lowPower&&i>=5)continue;
    const person=new THREE.Group();
    const jacket=surface(profile.coat),skin=surface(i%2?'#bd8b6b':'#d3a78c');
    cube(.35,.64,.25,0,1.05,0,jacket,person);
    const face=new THREE.Mesh(new THREE.SphereGeometry(.20,8,6),skin);
    face.position.y=1.56;person.add(face);
    const legs=[],arms=[];
    for(const side of [-1,1]){
      const leg=new THREE.Group();leg.position.set(side*.12,.65,0);person.add(leg);
      cube(.12,.56,.15,0,-.28,0,dark,leg);legs.push(leg);
      const arm=new THREE.Group();arm.position.set(side*.25,1.32,0);person.add(arm);
      cube(.11,.47,.14,0,-.22,0,jacket,arm);arms.push(arm);
    }
    person.position.set(profile.x,0,profile.z);
    district.add(person);
    walking.push({group:person,legs,arms,base:profile.axis==='z'?profile.z:profile.x,
      profile:{...profile,speed:profile.speed*(.82+Math.random()*.38)},offset:Math.random()*6.28});
  }
  // Animações pequenas na loja: um atendente atrás do caixa e outro na oficina.
  const attendants=[
    {x:-1.77,z:-8.80,coat:'#256e52',lean:.05},
    {x:9.30,z:.20,coat:'#527b96',lean:.10}
  ];
  for(const [i,worker] of attendants.entries()){
    if(lowPower&&i>0)continue;
    const group=new THREE.Group();
    const coat=surface(worker.coat),skin=surface('#c99a77');
    cube(.37,.65,.27,0,1.02,0,coat,group);
    const head=new THREE.Mesh(new THREE.SphereGeometry(.19,8,7),skin);
    head.position.set(0,1.52,0);group.add(head);
    for(const sx of [-.11,.11])cube(.12,.55,.15,sx,.39,0,dark,group);
    const arm=new THREE.Group();arm.position.set(-.25,1.30,0);group.add(arm);
    cube(.11,.47,.12,0,-.21,0,coat,arm);
    group.position.set(worker.x,0,worker.z);district.add(group);
    ambientDetails.push({worker:group,arm,phase:i*2.8});
  }
  // O posto continua funcional; nenhum veículo decorativo ocupa corredores de chegada.
  function update(time,delta){
    const sec=time/1000,dt=Math.max(0,Math.min(.08,delta));
    const phase=trafficLightPhase(sec);
    updateSignals(phase);
    // Retratos do início do quadro: decisões de cruzamento independem da ordem de iteração.
    const positions=traffic.map(car=>{
      const pos=vehiclePose(car);
      return {...pos,axis:car.route.axis,vehicle:car,velocity:car.velocity};
    });
    const greenCandidates=positions.filter(p=>p.axis===phase||
      TRAFFIC_JUNCTIONS.some(j=>trafficJunctionDistance(p.x,p.z,j)<4.3));
    const reservations=TRAFFIC_JUNCTIONS.map(j=>junctionWinner(greenCandidates,j));
    for(let i=traffic.length-1;i>=0;i--){
      const car=traffic[i],before=sampleRoute(car.route,car.distance);
      const now=vehiclePose(car);
      let desired=car.cruise*(before.turning?.54:1);
      let redHold=false,intersectionHold=false,collisionHold=false;
      const red=phase!==car.route.axis;
      if(red){
        for(const stop of car.route.stops){
          const gap=stop-car.distance;
          if(gap>-.02&&gap<10){
            desired=Math.min(desired,Math.max(0,(gap-.85)*1.65));
            if(gap<2.6)redHold=true;
          }
        }
      }
      // Reservas exclusivas para cruzamentos: somente um carro por vez na caixa central.
      for(let n=0;n<TRAFFIC_JUNCTIONS.length;n++){
        const junction=TRAFFIC_JUNCTIONS[n];
        const distance=trafficJunctionDistance(before.x,before.z,junction);
        if(distance>9.2||distance<4.3)continue;
        const winner=reservations[n];
        if(winner!==null&&winner!==car.id){
          desired=Math.min(desired,Math.max(0,(distance-5.15)*1.85));
          if(distance<6.4)intersectionHold=true;
        }
      }
      // Aproximação preditiva. Considera curvas e veículos em vias cruzadas,
      // além de checar uma faixa longitudinal quando ambos seguem o mesmo sentido.
      const probeDistance=Math.min(car.route.length,
        car.distance+Math.min(6,Math.max(2.0,car.velocity*.82+1.50)));
      const probe=vehiclePose(car,probeDistance);
      for(const other of traffic){
        if(other===car)continue;
        const peer=vehiclePose(other);
        const separation=Math.hypot(peer.x-now.x,peer.z-now.z);
        if(separation>10.5)continue;
        const ahead=(peer.x-now.x)*before.direction.x+
          (peer.z-now.z)*before.direction.z;
        const lateral=Math.abs((peer.x-now.x)*before.direction.z-
          (peer.z-now.z)*before.direction.x);
        const sameLane=ahead>.05&&ahead<9.0&&lateral<1.38;
        const pathConflict=trafficOverlaps(probe,peer,.58);
        if(sameLane||pathConflict){
          const length=(now.length+peer.length)*.5;
          const gap=Math.max(0,(sameLane?ahead:separation)-length-.80);
          desired=Math.min(desired,gap*1.35);
        }
      }
      const braking=desired<car.velocity?4.8:1.65;
      car.velocity+=Math.max(-braking*dt,Math.min(braking*dt,desired-car.velocity));
      car.velocity=Math.max(0,car.velocity);
      let moved=Math.min(car.velocity*dt,Math.max(0,car.route.length-car.distance));
      if(red){
        for(const stop of car.route.stops){
          if(stop>=car.distance-.02&&stop-car.distance<3.5){
            moved=Math.min(moved,Math.max(0,stop-.85-car.distance));
          }
        }
      }
      // Evita que a frente de um veículo entre numa caixa ocupada por outro.
      for(let n=0;n<TRAFFIC_JUNCTIONS.length;n++){
        const junction=TRAFFIC_JUNCTIONS[n];
        const distance=trafficJunctionDistance(before.x,before.z,junction);
        if(distance>9.2||distance<4.3||reservations[n]===null||
          reservations[n]===car.id)continue;
        // Aproxima pela trajetória, nunca cruza o limite de segurança da reserva.
        const probePoint=sampleRoute(car.route,car.distance+moved);
        const futureRadius=trafficJunctionDistance(probePoint.x,probePoint.z,junction);
        if(futureRadius<5.10&&futureRadius<distance){
          let low=0,high=moved;
          for(let k=0;k<8;k++){
            const mid=(low+high)/2,p=sampleRoute(car.route,car.distance+mid);
            if(trafficJunctionDistance(p.x,p.z,junction)>=5.10)low=mid;
            else high=mid;
          }
          moved=low;intersectionHold=true;
        }
      }
      // A verificação final usa o formato real das carrocerias (OBB), não só o centro.
      // Um movimento que colidir seria reduzido por busca binária, sem atravessar objetos.
      const wouldOverlap=distance=>nearVehicle(vehiclePose(car,car.distance+distance),car,.32);
      if(moved>0&&wouldOverlap(moved)){
        let low=0,high=moved;
        for(let k=0;k<10;k++){
          const mid=(low+high)/2;
          if(wouldOverlap(mid))high=mid;else low=mid;
        }
        if(low<moved-.0001){collisionAvoided++;collisionHold=true;}
        moved=low;
        car.velocity=Math.min(car.velocity,moved/Math.max(.001,dt));
      }
      car.distance+=moved;
      const position=sampleRoute(car.route,car.distance);
      car.model.position.set(position.x,.18+Math.sin(sec*5+car.offset)*.006,position.z);
      car.model.rotation.y=rotateTowards(car.model.rotation.y,position.heading,dt*3.5);
      car.model.userData.spinWheels(moved);
      car.model.userData.setBraking(desired<car.cruise*.4||collisionHold||redHold);
      car.model.userData.setTurnSignal(position.turning,Math.floor(sec*3)%2===0);
      car.model.userData.animateBody(dt);
      // Recuperação só após bloqueio físico persistente, nunca por sinal vermelho.
      if(moved<.006&&(collisionHold||intersectionHold)&&!redHold){
        car.blockedFor+=dt;
      }else car.blockedFor=Math.max(0,car.blockedFor-dt*2);
      if(car.blockedFor>28){
        // A retirada excepcional restaura fluxo quando dois caminhos se bloqueiam.
        // Um novo veículo surgirá apenas a partir da borda segura do mapa.
        disposeVehicle(car.model);traffic.splice(i,1);
        gridlocksResolved++;retired++;spawnDelay=Math.min(spawnDelay,1.2);
        continue;
      }
      if(car.distance>=car.route.length-.15){
        disposeVehicle(car.model);traffic.splice(i,1);
        retired++;spawnDelay=Math.min(spawnDelay,.40);
      }
    }
    spawnDelay-=dt;
    if(spawnDelay<=0&&traffic.length<maxTraffic){
      if(createTrafficCar(false))spawnDelay=1.1+Math.random()*1.9;
      else spawnDelay=.7;
    }
    for(const cloud of clouds)cloud.group.position.x=cloud.base+Math.sin(sec*cloud.speed)*3;
    for(const p of walking){
      const {profile}=p;
      const walk=Math.sin(sec*profile.speed+p.offset)*profile.span;
      const facing=Math.cos(sec*profile.speed+p.offset)>=0;
      if(profile.axis==='z'){
        p.group.position.z=p.base+walk;
        p.group.rotation.y=facing?Math.PI/2:-Math.PI/2;
      }else if(profile.axis==='x'){
        p.group.position.x=p.base+walk;
        p.group.rotation.y=facing?-Math.PI/2:Math.PI/2;
      }else p.group.rotation.y=0;
      const gait=profile.axis==='wait'?.03:Math.sin(sec*3.2+p.offset)*.26;
      p.legs[0].rotation.x=gait;p.legs[1].rotation.x=-gait;
      p.arms[0].rotation.x=-gait*.7;p.arms[1].rotation.x=gait*.7;
    }
    for(const detail of ambientDetails){
      if(detail.worker){
        detail.arm.rotation.x=Math.sin(sec*1.1+detail.phase)*.30;
        detail.worker.rotation.y=Math.sin(sec*.24+detail.phase)*.10;
      }
    }
    for(const car of parkedVehicles){
      car.model.userData.animateBody(dt);
    }
  }
  function setNight(active){
    night=!!active;
    for(const li of blinkers)li.intensity=night?2.2:0;
    for(const car of traffic)car.model.userData.setLights(night);
  }
  return {update,setNight,district,setTrafficDensity,
    trafficCount:()=>traffic.length,
    routeCount:()=>routes.length,
    diagnostics:()=>({cars:traffic.length,max:maxTraffic,spawned,retired,
      pedestrians:walking.length,parked:parkedVehicles.length,
      collisionsPrevented:collisionAvoided,gridlocksResolved,signals:lastLightPhase}),
    setExternalVehicle:vehicle=>{externalVehicle=vehicle||null;},
    isRouteFreeFor,
    trafficCars:()=>traffic.map(c=>({id:c.id,variant:c.variant,
      x:c.model.position.x,z:c.model.position.z,
      heading:c.model.rotation.y,speed:c.velocity,blockedFor:c.blockedFor})),
    sidewalkSegments:()=>elevatedSidewalks.map(x=>({...x}))
  };
}
