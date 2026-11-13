'use strict';
/**
 * EcoPosto | Operações educativas (versão 7)
 * Quantidades armazenadas em décimos de litro, dinheiro em centavos.
 * Nenhuma informação é enviada a servidores e nenhum pagamento é processado.
 */
(()=>{
  const STORE='ecoposto-ops-v7';
  const FUEL_IDS=Object.freeze(['gasolina-comum','gasolina-nitro','gasolina-racing','etanol-comum','diesel-s10','diesel-s500']);
  const CAPACITY=Object.freeze({
    'gasolina-comum':130000,'gasolina-nitro':70000,'gasolina-racing':40000,
    'etanol-comum':110000,'diesel-s10':120000,'diesel-s500':65000
  });
  const DEFAULT_STOCK=Object.freeze({
    'gasolina-comum':105000,'gasolina-nitro':51000,'gasolina-racing':26000,
    'etanol-comum':89000,'diesel-s10':86000,'diesel-s500':41000
  });
  const FLOW_LPM=Object.freeze({
    'gasolina-comum':34,'gasolina-nitro':32,'gasolina-racing':29,
    'etanol-comum':36,'diesel-s10':38,'diesel-s500':35
  });
  const DEFAULT={version:7,shift:1,stock:{...DEFAULT_STOCK},retail:{},metrics:{
    sales:0,cars:0,fills:0,litresDeci:0,revenueCents:0,serviceScore:0,
    warnings:0,cashCents:0,cardCents:0,pixCents:0,creditCents:0
  },activity:[],history:[]};
  const clone=value=>JSON.parse(JSON.stringify(value));
  const isInt=n=>Number.isSafeInteger(n);
  function canStore(){try{return typeof localStorage!=='undefined';}catch{return false;}}
  function read(){
    if(!canStore())return clone(DEFAULT);
    try{
      const data=JSON.parse(localStorage.getItem(STORE)||'null');
      if(data?.version!==7||!data.stock||!data.metrics||!Array.isArray(data.activity))return clone(DEFAULT);
      const safe=clone(DEFAULT);
      safe.shift=Number.isInteger(data.shift)&&data.shift>0&&data.shift<999999?data.shift:1;
      if(data.retail&&typeof data.retail==='object'){
        for(const [id,count] of Object.entries(data.retail)){
          if(/^[a-z0-9-]{2,75}$/.test(id)&&isInt(Number(count))&&Number(count)>=0&&Number(count)<=300)
            safe.retail[id]=Number(count);
        }
      }
      for(const id of FUEL_IDS){
        const v=Number(data.stock[id]);
        if(Number.isInteger(v)&&v>=0&&v<=CAPACITY[id])safe.stock[id]=v;
      }
      for(const key of Object.keys(safe.metrics)){
        const n=Number(data.metrics[key]);
        if(Number.isSafeInteger(n)&&n>=0&&n<1e12)safe.metrics[key]=n;
      }
      safe.activity=data.activity.filter(e=>e&&typeof e.text==='string').slice(-40);
      safe.history=Array.isArray(data.history)?data.history.slice(-14):[];
      return safe;
    }catch{return clone(DEFAULT);}
  }
  let state=read();
  const listeners=new Set();
  function persist(){
    if(canStore())try{localStorage.setItem(STORE,JSON.stringify(state));}catch{}
    for(const fn of listeners)try{fn(snapshot());}catch(err){console.warn('EcoPosto operations listener',err);}
  }
  function snapshot(){return clone(state);}
  function subscribe(fn){
    if(typeof fn!=='function')throw new TypeError('Subscriber required');
    listeners.add(fn);return ()=>listeners.delete(fn);
  }
  function event(text,type='info'){
    state.activity.push({at:new Date().toISOString(),type,text:String(text).slice(0,220)});
    state.activity=state.activity.slice(-40);persist();
  }
  function tank(id){
    if(!FUEL_IDS.includes(id))return null;
    const deci=state.stock[id];
    return {id,deci,litres:deci/10,capacityLitres:CAPACITY[id]/10,percent:Math.round(deci/CAPACITY[id]*100),low:deci<=CAPACITY[id]*.15};
  }
  function planFill(input){
    const fuelId=input?.fuelId,unitPriceCents=Number(input?.unitPriceCents);
    if(!FUEL_IDS.includes(fuelId))return {ok:false,error:'Combustível desconhecido.'};
    if(!isInt(unitPriceCents)||unitPriceCents<100||unitPriceCents>3000)
      return {ok:false,error:'Preço por litro inválido.'};
    const mode=input?.mode;
    if(!['litros','valor','completar'].includes(mode))
      return {ok:false,error:'Selecione litros, valor em reais ou completar.'};
    const available=state.stock[fuelId];
    const freeDeci=Number(input?.tankFreeDeci);
    if(!isInt(freeDeci)||freeDeci<0||freeDeci>5000)
      return {ok:false,error:'Capacidade livre do tanque inválida.'};
    if(freeDeci<1)return {ok:false,error:'O tanque do veículo já está cheio.'};
    if(available<1)return {ok:false,error:'Estoque insuficiente. Solicite reposição.'};
    let deci;
    if(mode==='litros'){
      const l=Number(input.requestLitres);
      if(!Number.isFinite(l)||l<.1||l>500)
        return {ok:false,error:'Informe entre 0,1 e 500 litros.'};
      deci=Math.round(l*10);
      if(Math.abs(deci/10-l)>1e-7)return {ok:false,error:'Use incrementos de 0,1 litro.'};
    }else if(mode==='valor'){
      const cents=Number(input.requestCents);
      if(!isInt(cents)||cents<1||cents>1000000)
        return {ok:false,error:'Informe um valor positivo válido em reais.'};
      // Valor por 0,1 L arredondado no visor. Nunca exceder o pedido por valor.
      deci=Math.floor((cents*10)/unitPriceCents);
      while(deci>0&&Math.round(deci*unitPriceCents/10)>cents)deci--;
      if(deci<1)return {ok:false,error:'Valor insuficiente para registrar 0,1 L.'};
    }else deci=freeDeci;
    if(deci>freeDeci)return {ok:false,error:'O volume ultrapassaria a capacidade disponível do tanque.'};
    if(deci>available)return {ok:false,error:'O estoque da bomba não comporta esse volume. Reponha o combustível.'};
    const cents=Math.round(deci*unitPriceCents/10);
    return {ok:true,fuelId,mode,deci,litres:deci/10,totalCents:cents,
      freeDeci,stockAfterDeci:available-deci,
      flowLpm:FLOW_LPM[fuelId],unitPriceCents};
  }
  function dispense(fuelId,deci,unitPriceCents){
    if(!FUEL_IDS.includes(fuelId)||!isInt(deci)||deci<1||deci>5000
      ||!isInt(unitPriceCents)||unitPriceCents<100||unitPriceCents>3000)
      return {ok:false,error:'Dados de abastecimento inválidos.'};
    if(state.stock[fuelId]<deci)return {ok:false,error:'Estoque insuficiente no momento de finalizar.'};
    state.stock[fuelId]-=deci;
    state.metrics.fills++;
    state.metrics.litresDeci+=deci;
    event('Bomba '+fuelId+': '+(deci/10).toFixed(1)+' L · visor R$ '+(Math.round(deci*unitPriceCents/10)/100).toFixed(2),'fuel');
    return {ok:true,deci,amountCents:Math.round(deci*unitPriceCents/10),remaining:state.stock[fuelId]};
  }
  function restock(id,litres){
    if(!FUEL_IDS.includes(id))return {ok:false,error:'Selecione um tanque válido.'};
    const deci=Math.round(Number(litres)*10);
    if(!isInt(deci)||deci<1||deci>200000||Math.abs(deci/10-Number(litres))>1e-7)
      return {ok:false,error:'Informe um volume de reposição válido.'};
    if(deci+state.stock[id]>CAPACITY[id])
      return {ok:false,error:'Entrega excede a capacidade física do tanque simulado.'};
    state.stock[id]+=deci;
    event('Recebimento de combustível simulado: '+id+' · '+(deci/10).toFixed(1)+' L','delivery');
    return {ok:true,stock:state.stock[id]/10};
  }
  function retailDefault(category){return category==='conveniencia'?32:category==='cuidados'?18:24;}
  function retailCount({id,category}={}){
    if(typeof id!=='string'||!/^[a-z0-9-]{2,75}$/.test(id))return null;
    if(category==='servicos')return Infinity;
    const saved=state.retail[id];
    return isInt(saved)&&saved>=0?saved:retailDefault(category);
  }
  function validateRetail(lines){
    if(!Array.isArray(lines)||lines.length>150)return {ok:false,error:'Itens do estoque inválidos.'};
    const totals=new Map();
    for(const item of lines){
      const {id,category}=item||{};
      if(category==='combustiveis'||category==='servicos')continue;
      const qty=Number(item.qty);
      if(!isInt(qty)||qty<1||qty>300)return {ok:false,error:'Quantidade de produto inválida.'};
      if(retailCount({id,category})===null)return {ok:false,error:'Código de produto inválido.'};
      const entry=totals.get(id)||{id,category,qty:0};
      entry.qty+=qty;totals.set(id,entry);
    }
    for(const entry of totals.values()){
      if(retailCount(entry)<entry.qty)
        return {ok:false,error:'Estoque insuficiente: '+entry.id+' · disponível '+retailCount(entry)};
    }
    return {ok:true,items:[...totals.values()]};
  }
  function consumeRetail(lines){
    const check=validateRetail(lines);
    if(!check.ok)return check;
    for(const item of check.items)state.retail[item.id]=retailCount(item)-item.qty;
    if(check.items.length)event('Baixa no estoque da conveniência: '+check.items.length+' tipos de item','retail');
    return {ok:true,count:check.items.length};
  }
  function restockRetail({id,category,qty}={}){
    const amount=Number(qty),present=retailCount({id,category});
    if(present===null||category==='servicos'||category==='combustiveis')
      return {ok:false,error:'Selecione produto físico válido.'};
    if(!isInt(amount)||amount<1||amount>200||present+amount>300)
      return {ok:false,error:'Reposição inválida ou acima de 300 unidades.'};
    state.retail[id]=present+amount;
    event('Recebimento de mercadoria '+id+' · '+amount+' un.','delivery');
    return {ok:true,count:state.retail[id]};
  }
    function sale({amountCents,method}={}){
    const cents=Number(amountCents);
    if(!isInt(cents)||cents<0||cents>20000000)return false;
    const valid=['dinheiro','cartao','pix','prazo'];
    if(!valid.includes(method))return false;
    state.metrics.sales++;
    state.metrics.revenueCents+=cents;
    const key={dinheiro:'cashCents',cartao:'cardCents',pix:'pixCents',prazo:'creditCents'}[method];
    state.metrics[key]+=cents;
    event('Venda de treinamento '+method+': R$ '+(cents/100).toFixed(2),'sale');
    return true;
  }
  function customer({satisfaction=100,waitingSeconds=0}={}){
    const score=Math.max(0,Math.min(100,Math.round(Number(satisfaction)||0)));
    state.metrics.cars++;
    state.metrics.serviceScore+=score;
    event('Atendimento encerrado · satisfação '+score+'% · espera '+Math.max(0,Math.round(waitingSeconds))+'s','customer');
    return score;
  }
  function warning(message){
    state.metrics.warnings++;
    event('Atenção: '+String(message).slice(0,170),'warning');
  }
  function closeShift(){
    const report={number:state.shift,closedAt:new Date().toISOString(),metrics:clone(state.metrics)};
    state.history.push(report);state.history=state.history.slice(-14);
    state.shift++;
    state.metrics=clone(DEFAULT.metrics);
    event('Turno '+report.number+' encerrado. Novo turno '+state.shift+' iniciado.','shift');
    return report;
  }
  function resetPractice(){
    state=clone(DEFAULT);persist();return snapshot();
  }
  window.ECO_OPERATIONS=Object.freeze({FUEL_IDS,CAPACITY,FLOW_LPM,
    snapshot,subscribe,tank,planFill,dispense,restock,retailCount,validateRetail,consumeRetail,restockRetail,sale,customer,warning,closeShift,resetPractice});
})();