import * as THREE from 'three';

// Ambientação externa com geometria original e leve; sem pacotes de modelos.
const surface=(hex,roughness=.85,metalness=.01)=>new THREE.MeshStandardMaterial({color:hex,roughness,metalness});
const l=(hex)=>new THREE.MeshBasicMaterial({color:hex});
export function createVehicle(tint='#29739a',variant='car'){
  const root=new THREE.Group();
  const body=surface(tint,.43,.24),rubber=surface('#252b30',.93),glass=surface('#345761',.20,.24),
    chrome=surface('#aebac0',.25,.71),red=l('#e9665b'),white=l('#f7f3cc');
  const wheels=[];
  function box(w,h,d,x,y,z,mat){
    const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
    m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;root.add(m);return m;
  }
  const isTruck=variant==='pickup'||variant==='van';
  box(isTruck?3.35:2.85,.57,1.38,0,.63,0,body);
  box(isTruck?1.75:1.57,.56,1.27,isTruck?-.65:-.25,1.15,0,body);
  box(isTruck?.95:1.05,.35,1.30,isTruck?-.70:-.36,1.21,0,glass);
  box(2.70,.13,1.39,0,.36,0,chrome);
  for(const ax of [-.98,1.02])for(const side of [-.72,.72]){
    const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.35,.35,.19,12),rubber);
    wheel.rotation.x=Math.PI/2;wheel.position.set(ax,.35,side);root.add(wheel);wheels.push(wheel);
    const hub=new THREE.Mesh(new THREE.CylinderGeometry(.19,.19,.20,10),chrome);
    hub.rotation.x=Math.PI/2;hub.position.copy(wheel.position);hub.position.z+=side>0?.017:-.017;root.add(hub);
  }
  for(const side of [-.48,.48]){
    box(.10,.18,.25,1.46,.70,side,white);
    box(.10,.16,.23,-1.46,.70,side,red);
  }
  // Tanque e tampa de abastecimento do lado esquerdo.
  const fuelCap=box(.07,.16,.17,-.9,.79,-.713,chrome);
  root.userData={wheels,fuelCap};
  root.scale.setScalar(variant==='van'?1.07:1);
  return root;
}
export function createDistrict({world,scene,lowPower=false}){
  const district=new THREE.Group();
  district.name='bairro-entorno';
  world.add(district);
  const asphalt=surface('#495359',.97),pavement=surface('#b4b9b4',.97),stone=surface('#dedcce',1),
    yellow=surface('#f0d99d'),white=surface('#e8ece7'),dark=surface('#354246'),
    foliage=surface('#5b8b6d'),stem=surface('#806f54');
  const traffic=[], clouds=[],blinkers=[],walking=[],cars=[];
  let night=false;
  function cube(w,h,d,x,y,z,mat,parent=district){
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
    mesh.position.set(x,y,z);mesh.castShadow=h>.4;mesh.receiveShadow=w>3||d>3;parent.add(mesh);
    return mesh;
  }
  function cylinder(r,h,x,y,z,material,parent=district){
    const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,8),material);
    mesh.position.set(x,y,z);parent.add(mesh);return mesh;
  }
  // A praça do posto continua no centro; avenidas formam um quarteirão real.
  cube(68,.11,4.5,0,.035,9.0,asphalt);
  cube(68,.12,6.7,0,.045,14.3,asphalt);
  cube(5.2,.10,56,-17,.025,-3.3,asphalt);
  cube(5.2,.10,56,17,.025,-3.3,asphalt);
  for(const x of [-12.7,12.7]){
    cube(1.3,.2,55,x,.16,-3.0,pavement);
  }
  cube(68,.20,2.65,0,.17,18.95,stone);
  cube(68,.20,2.30,0,.17,-14.0,pavement);
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
  for(const x of [-24,-12,0,12,24]){
    cylinder(.075,5.1,x,2.7,17.6,dark);
    cube(.56,.13,.36,x,5.26,17.35,white);
    const light=new THREE.PointLight('#fff4ca',0,8,2);light.position.set(x,5.15,17.35);scene.add(light);blinkers.push(light);
  }
  function ambientCar(color,x,z,dir,speed,variant='car'){
    const m=createVehicle(color,variant);
    m.position.set(x,.18,z);
    m.rotation.y=dir<0?Math.PI:0;
    district.add(m);traffic.push({model:m,origin:x,z,dir,speed});
  }
  ambientCar('#a5b6c2',-27,9.4,1,2.1);
  ambientCar('#b77360',23,13.7,-1,2.7);
  ambientCar('#f1e3bc',-5,9.4,1,1.6,'pickup');
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
  // Pedestres discretos no entorno; animação lenta, não na pista.
  for(const [i,x] of [-8,1,10].entries()){
    const g=new THREE.Group(),jacket=surface(['#b88672','#567ca2','#c8a54d'][i]);
    const torso=cube(.37,.63,.26,0,1.08,0,jacket,g);
    const head=new THREE.Mesh(new THREE.SphereGeometry(.20,8,6),surface('#bd8d73'));
    head.position.y=1.55;g.add(head);
    const legs=[];
    for(const sx of [-.12,.12])legs.push(cube(.12,.55,.16,sx,.40,0,dark,g));
    g.position.set(x,0,19.4);
    district.add(g);walking.push({group:g,legs,base:x,offset:i*2.6});
  }
  function update(time,delta){
    const sec=time/1000;
    for(const car of traffic){
      car.model.position.x+=car.dir*car.speed*delta;
      if(car.model.position.x>33)car.model.position.x=-33;
      if(car.model.position.x<-33)car.model.position.x=33;
      for(const wheel of car.model.userData.wheels||[])wheel.rotation.z-=car.dir*delta*car.speed/.34;
    }
    for(const cloud of clouds)cloud.group.position.x=cloud.base+Math.sin(sec*cloud.speed)*3;
    for(const p of walking){
      p.group.position.x=p.base+Math.sin(sec*.21+p.offset)*1.4;
      p.legs[0].rotation.x=Math.sin(sec*2.6+p.offset)*.24;
      p.legs[1].rotation.x=-p.legs[0].rotation.x;
    }
  }
  function setNight(active){night=!!active;for(const li of blinkers)li.intensity=night?2.2:0;}
  return {update,setNight,district};
}
