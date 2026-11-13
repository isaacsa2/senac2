/** Rotas físicas (X/Z): carro com frente em +X e eixo de roda em Z local. */
export const ROAD_BOUNDS={
 horizontal:{xMin:-33,xMax:33,zMin:6.75,zMax:17.65},
 left:{xMin:-19.6,xMax:-14.4,zMin:-31,zMax:24.7},
 right:{xMin:14.4,xMax:19.6,zMin:-31,zMax:24.7}
};
export const WHEEL_RADIUS=.35;
export function headingForTravel(dx,dz){
  if(!Number.isFinite(dx)||!Number.isFinite(dz)||Math.hypot(dx,dz)<1e-8)return 0;
  return Math.atan2(-dz,dx); // Modelo aponta em +X; rotação +Y leva +X em direção a -Z.
}
export function rotateTowards(current,target,maxStep){
  const difference=Math.atan2(Math.sin(target-current),Math.cos(target-current));
  return Number.isFinite(difference)?current+Math.max(-Math.abs(maxStep),Math.min(Math.abs(maxStep),difference)):current;
}
export function wheelRotationForTravel(metres,radius=WHEEL_RADIUS){
  return Number.isFinite(metres)&&radius>0?-metres/radius:0;
}
export function pointOnRoad(x,z,margin=0){
  return Object.values(ROAD_BOUNDS).some(r=>
    x>=r.xMin+margin&&x<=r.xMax-margin&&z>=r.zMin+margin&&z<=r.zMax-margin);
}
const L=(ax,az,bx,bz)=>({type:'line',a:[ax,az],b:[bx,bz]});
const Q=(ax,az,cx,cz,bx,bz)=>({type:'curve',a:[ax,az],c:[cx,cz],b:[bx,bz]});
const S=(x,z)=>({x,z});
const ROUTES=[
 {id:'east',axis:'ew',segments:[L(-32,8.7,32,8.7)],stops:[S(-22,8.7),S(11.9,8.7)]},
 {id:'west',axis:'ew',segments:[L(32,14.3,-32,14.3)],stops:[S(22,14.3),S(-11.9,14.3)]},
 {id:'left-south',axis:'ns',segments:[L(-16.1,-30,-16.1,24.3)],stops:[S(-16.1,4)]},
 {id:'left-north',axis:'ns',segments:[L(-18.1,24.3,-18.1,-30)],stops:[S(-18.1,20)]},
 {id:'right-south',axis:'ns',segments:[L(18.1,-30,18.1,24.3)],stops:[S(18.1,4)]},
 {id:'right-north',axis:'ns',segments:[L(16.1,24.3,16.1,-30)],stops:[S(16.1,20)]},
 {id:'east-turn',axis:'ew',segments:[L(-32,8.7,11.6,8.7),Q(11.6,8.7,18.1,8.7,18.1,15.2),L(18.1,15.2,18.1,24.3)],stops:[S(-22,8.7),S(11,8.7)]},
 {id:'west-turn',axis:'ew',segments:[L(32,14.3,-11.6,14.3),Q(-11.6,14.3,-18.1,14.3,-18.1,7.8),L(-18.1,7.8,-18.1,-30)],stops:[S(22,14.3),S(-11,14.3)]},
 {id:'north-turn-left',axis:'ns',segments:[L(-18.1,24.3,-18.1,20),Q(-18.1,20,-18.1,14.3,-23,14.3),L(-23,14.3,-32,14.3)],stops:[S(-18.1,21.9)]},
 {id:'south-turn-left',axis:'ns',segments:[L(18.1,-30,18.1,4.1),Q(18.1,4.1,18.1,8.7,23,8.7),L(23,8.7,32,8.7)],stops:[S(18.1,3.7)]},
 {id:'south-turn-right',axis:'ns',segments:[L(-16.1,-30,-16.1,4.1),Q(-16.1,4.1,-16.1,8.7,-11.6,8.7),L(-11.6,8.7,32,8.7)],stops:[S(-16.1,3.7)]},
 {id:'north-turn-right',axis:'ns',segments:[L(16.1,24.3,16.1,20),Q(16.1,20,16.1,14.3,11.6,14.3),L(11.6,14.3,-32,14.3)],stops:[S(16.1,21.9)]}
];
function point(segment,t){
  if(segment.type==='line')return {x:segment.a[0]+(segment.b[0]-segment.a[0])*t,z:segment.a[1]+(segment.b[1]-segment.a[1])*t};
  const a=1-t;return {
    x:a*a*segment.a[0]+2*a*t*segment.c[0]+t*t*segment.b[0],
    z:a*a*segment.a[1]+2*a*t*segment.c[1]+t*t*segment.b[1]
  };
}
export function buildRoute({id='test',axis='ew',segments=[],stops=[]},step=.4){
  if(!segments.length)throw Error('Empty traffic route');
  const samples=[];let length=0;
  for(const seg of segments){
    const v=seg.c?Math.hypot(seg.c[0]-seg.a[0],seg.c[1]-seg.a[1])+
      Math.hypot(seg.b[0]-seg.c[0],seg.b[1]-seg.c[1]):
      Math.hypot(seg.b[0]-seg.a[0],seg.b[1]-seg.a[1]);
    const count=Math.max(3,Math.ceil(v/Math.max(.2,step)));
    for(let i=0;i<=count;i++){
      if(samples.length&&!i)continue;
      const p=point(seg,i/count);
      if(samples.length){const last=samples[samples.length-1];length+=Math.hypot(last.x-p.x,last.z-p.z);}
      samples.push({...p,s:length,turning:seg.type==='curve'});
    }
  }
  if(length<=.1)throw Error('Degenerate route');
  const stopDistances=stops.map(({x,z})=>{
    let d=Infinity,nearest=0;
    for(const p of samples){const test=(p.x-x)**2+(p.z-z)**2;if(test<d){d=test;nearest=p.s;}}
    return nearest;
  }).sort((a,b)=>a-b);
  return {id,axis,samples,length,stops:stopDistances};
}
export function buildTrafficRoutes(){return ROUTES.map(d=>buildRoute(d));}
export function sampleRoute(route,distance){
  const pts=route.samples;
  const d=Math.max(0,Math.min(route.length,distance));
  let lo=0,hi=pts.length-1;
  while(lo+1<hi){const m=(lo+hi)>>>1;if(pts[m].s<d)lo=m;else hi=m;}
  const a=pts[lo],b=pts[hi],t=(d-a.s)/((b.s-a.s)||1);
  const prev=pts[Math.max(0,lo-2)],next=pts[Math.min(pts.length-1,hi+2)];
  const dx=next.x-prev.x,dz=next.z-prev.z,n=Math.hypot(dx,dz)||1;
  return {x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t,
    heading:headingForTravel(dx,dz),turning:a.turning||b.turning,
    direction:{x:dx/n,z:dz/n}};
}
export function trafficLightPhase(seconds){
  const t=((seconds%40)+40)%40;
  return t<17?'ew':t>=20&&t<37?'ns':'all-red';
}
