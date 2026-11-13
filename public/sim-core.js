'use strict';
/* Motor de treinamento local. Não faz cobranças, não transmite dados, não emite NF-e. */
(()=>{
  const DENOMS=Object.freeze([
    {value:20000,label:'R$ 200',kind:'note',color:'#b3d0b7'},
    {value:10000,label:'R$ 100',kind:'note',color:'#9dbee0'},
    {value:5000,label:'R$ 50',kind:'note',color:'#e8ba8b'},
    {value:2000,label:'R$ 20',kind:'note',color:'#dfd29a'},
    {value:1000,label:'R$ 10',kind:'note',color:'#f3b6ab'},
    {value:500,label:'R$ 5',kind:'note',color:'#b6bade'},
    {value:200,label:'R$ 2',kind:'note',color:'#a8cbbe'},
    {value:100,label:'R$ 1',kind:'coin',color:'#d0b67b'},
    {value:50,label:'50 centavos',kind:'coin',color:'#d3d4d0'},
    {value:25,label:'25 centavos',kind:'coin',color:'#d9c5a5'},
    {value:10,label:'10 centavos',kind:'coin',color:'#d8bb9e'},
    {value:5,label:'5 centavos',kind:'coin',color:'#cfa78d'},
    {value:1,label:'1 centavo',kind:'coin',color:'#c69c88'}
  ]);
  const machineKey='ecoposto-machine-v1',receivableKey='ecoposto-receivables-v1';
  const defaultMachine={approval:72,read_error:10,declined:8,offline:6,pin_error:4,forced:'random'};
  const outcomeText={
    approved:{name:'APROVADO',message:'Pagamento de treinamento autorizado.',ok:true},
    read_error:{name:'ERRO DE LEITURA',message:'Retire e insira o cartão novamente ou use aproximação.',ok:false},
    declined:{name:'TRANSAÇÃO NEGADA',message:'Pagamento não autorizado na simulação. Peça outra forma de pagamento.',ok:false},
    offline:{name:'SEM COMUNICAÇÃO',message:'Terminal sem comunicação. Tente novamente ou escolha outro meio.',ok:false},
    pin_error:{name:'SENHA INCORRETA',message:'PIN de treinamento incorreto. Não digite senhas reais.',ok:false}
  };
  function read(key,fallback){try{const raw=JSON.parse(localStorage.getItem(key)||'null');return raw??fallback;}catch{return fallback;}}
  function write(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{return false;}}
  function config(){
    const value=read(machineKey,defaultMachine);
    if(!value||typeof value!=='object')return {...defaultMachine};
    const next={...defaultMachine};
    for(const key of ['approval','read_error','declined','offline','pin_error']){
      const n=Number(value[key]);
      if(Number.isInteger(n)&&n>=0&&n<=100)next[key]=n;
    }
    if(Object.keys(outcomeText).includes(value.forced)||value.forced==='random')next.forced=value.forced;
    return next;
  }
  function setConfig(input){
    const valid=['random',...Object.keys(outcomeText)];
    const forced=valid.includes(input?.forced)?input.forced:'random';
    const out={...config(),forced};
    write(machineKey,out);
    return out;
  }
  function machineOutcome(){
    const settings=config();
    if(settings.forced!=='random')return {code:settings.forced,...outcomeText[settings.forced]};
    const entries=[['approved','approval'],['read_error','read_error'],['declined','declined'],['offline','offline'],['pin_error','pin_error']];
    const sum=entries.reduce((n,[,key])=>n+settings[key],0);
    if(sum<=0)return {code:'approved',...outcomeText.approved};
    let roll=Math.random()*sum;
    for(const [code,key] of entries){roll-=settings[key];if(roll<0)return {code,...outcomeText[code]};}
    return {code:'approved',...outcomeText.approved};
  }
  function changeFor(cents){
    if(!Number.isSafeInteger(cents)||cents<0||cents>10000000)return [];
    const result=[];let left=cents;
    for(const item of DENOMS){
      const count=Math.floor(left/item.value);
      if(count){result.push({...item,count});left-=count*item.value;}
    }
    return result;
  }
  function denominationsValue(values){
    if(!Array.isArray(values))return 0;
    return values.reduce((sum,entry)=>{
      const match=DENOMS.find(d=>d.value===Number(entry.value));
      const count=Number(entry.count);
      return sum+(match&&Number.isSafeInteger(count)&&count>=0&&count<=10000?match.value*count:0);
    },0);
  }
  function receivables(){
    const saved=read(receivableKey,[]);
    return Array.isArray(saved)?saved.filter(r=>r&&typeof r.id==='string'&&Number.isSafeInteger(r.amount)&&r.amount>=0).slice(-200):[];
  }
  function saveCredit({customer,due,amount,plate='',notes=''}) {
    const name=String(customer||'').trim().slice(0,70);
    const date=String(due||'').slice(0,10);
    const cents=Number(amount);
    if(name.length<2)throw new Error('Informe um nome fictício de cliente com pelo menos 2 caracteres.');
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||Number.isNaN(new Date(date+'T12:00:00').valueOf()))throw new Error('Informe uma data de vencimento válida.');
    const today=new Date();today.setHours(0,0,0,0);
    const dueDate=new Date(date+'T12:00:00');
    if(dueDate.getTime()<today.getTime())throw new Error('O vencimento não pode ser anterior a hoje.');
    if(!Number.isSafeInteger(cents)||cents<=0||cents>10000000)throw new Error('Valor de prazo inválido.');
    const list=receivables();
    const openTotal=list.filter(x=>x.status==='open'&&x.customer.toLocaleLowerCase('pt-BR')===name.toLocaleLowerCase('pt-BR')).reduce((n,x)=>n+x.amount,0);
    const creditLimit=150000; // limite escolar de R$ 1.500,00 por cliente
    if(openTotal+cents>creditLimit)throw new Error('Limite fictício de R$ 1.500 em aberto por cliente excedido.');
    const item={id:'PRAZO-'+Date.now().toString(36).toUpperCase()+'-'+String(list.length+1),customer:name,due:date,amount:cents,plate:String(plate).slice(0,14),notes:String(notes).slice(0,170),status:'open',createdAt:new Date().toISOString()};
    list.push(item);write(receivableKey,list);
    return item;
  }
  function settleCredit(id){
    const list=receivables(),item=list.find(r=>r.id===id);
    if(!item||item.status!=='open')return false;
    item.status='paid';item.paidAt=new Date().toISOString();
    write(receivableKey,list);return true;
  }
  function createCustomer(index=0){
    const types=[
      {id:'gasolina-comum',fuel:'Gasolina Comum',vehicle:'Sedã flex',kind:'flex',capacity:52,liters:18},
      {id:'etanol-comum',fuel:'Etanol Comum',vehicle:'Hatch flex',kind:'flex',capacity:48,liters:22},
      {id:'gasolina-nitro',fuel:'Shell V-Power Nitro+',vehicle:'SUV flex',kind:'flex',capacity:61,liters:25},
      {id:'diesel-s10',fuel:'Diesel S10',vehicle:'Picape diesel',kind:'diesel',capacity:80,liters:34},
      {id:'gasolina-racing',fuel:'Shell V-Power Racing',vehicle:'Esportivo gasolina',kind:'flex',capacity:60,liters:20},
      {id:'diesel-s500',fuel:'Diesel S500',vehicle:'Utilitário antigo',kind:'diesel-antigo',capacity:72,liters:29}
    ];
    const n=(Math.max(0,Math.floor(index)))%types.length;
    const base=types[n];
    const starting=base.capacity-base.liters-5;
    return {...base,fuelId:base.id,plate:'DEMO-'+String(index+1).padStart(3,'0'),customer:['Ana','Carlos','Mariana','João','Beatriz','Rafael'][n]+' (fictício)',tank:starting,requested:base.liters,filled:0,paid:false,orderType:n%3===0?'valor':n%3===1?'litros':'completar',id:'CAR-'+String(index+1).padStart(3,'0')};
  }
  window.ECO_SIM=Object.freeze({DENOMS,changeFor,denominationsValue,config,setConfig,machineOutcome,receivables,saveCredit,settleCredit,createCustomer,outcomeText});
})();