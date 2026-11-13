'use strict';
/** Painel do gerente/treinamento. Não registra dados pessoais e não faz cobranças. */
(()=>{
  const ops=window.ECO_OPERATIONS;
  if(!ops)return;
  const $=id=>document.getElementById(id);
  const dlg=$('operations-dialog');
  const names={
    'gasolina-comum':'Gasolina comum',
    'gasolina-nitro':'Gasolina aditivada',
    'gasolina-racing':'Gasolina premium Racing',
    'etanol-comum':'Etanol comum',
    'diesel-s10':'Diesel S10',
    'diesel-s500':'Diesel S500'
  };
  const money=cent=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(cent/100);
  const litres=n=>n.toLocaleString('pt-BR',{maximumFractionDigits:1})+' L';
  const show=message=>{$('ops-delivery-feedback').textContent=message;};
  const selector=$('ops-fuel-select');
  for(const id of ops.FUEL_IDS){
    const item=document.createElement('option');item.value=id;item.textContent=names[id];
    selector.add(item);
  }
  const retailItems=(window.ecoCatalog?.catalog||[]).filter(p=>p.category!=='servicos'&&p.category!=='combustiveis');
  const retailSelector=$('ops-retail-select');
  for(const product of retailItems){
    const option=document.createElement('option');
    option.value=product.id;option.textContent=product.name;
    retailSelector.add(option);
  }
  function addLine(parent,e){
    const article=document.createElement('article');
    if(e.type==='warning')article.className='is-warning';
    const time=document.createElement('time');
    const d=new Date(e.at);
    time.textContent=Number.isNaN(d.valueOf())?'—':d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
    const body=document.createElement('span');body.textContent=e.text;
    article.append(time,body);parent.append(article);
  }
  function render(){
    const snap=ops.snapshot(),m=snap.metrics;
    $('ops-shift-number').textContent=String(snap.shift).padStart(2,'0');
    $('ops-sales').textContent=String(m.sales);
    $('ops-litres').textContent=litres(m.litresDeci/10);
    $('ops-revenue').textContent=money(m.revenueCents);
    $('ops-rating').textContent=m.cars?(Math.round(m.serviceScore/m.cars)+'%'):'—';
    $('ops-methods').textContent='Dinheiro '+money(m.cashCents)+' · Cartão '+money(m.cardCents)+
      ' · Pix '+money(m.pixCents)+' · Prazo '+money(m.creditCents)+'. Avisos: '+m.warnings;
    const tanks=$('ops-tanks');tanks.replaceChildren();
    for(const id of ops.FUEL_IDS){
      const tank=ops.tank(id);
      const article=document.createElement('article');
      article.className='ops-tank'+(tank.low?' is-low':'');
      const heading=document.createElement('div'),name=document.createElement('strong'),pct=document.createElement('small');
      name.textContent=names[id];pct.textContent=tank.percent+'%'+(tank.low?' · baixo estoque':'');
      heading.append(name,pct);
      const track=document.createElement('div');track.className='ops-tank-track';
      const level=document.createElement('span');level.style.width=tank.percent+'%';
      track.append(level);
      const volume=document.createElement('small');
      volume.textContent=litres(tank.litres)+' / '+litres(tank.capacityLitres);
      article.append(heading,track,volume);tanks.append(article);
    }
    const retailView=$('ops-retail-preview');
    retailView.replaceChildren();
    const ranked=retailItems.map(p=>({p,count:ops.retailCount(p)}))
      .sort((a,b)=>a.count-b.count||a.p.name.localeCompare(b.p.name,'pt-BR')).slice(0,12);
    for(const item of ranked){
      const line=document.createElement('div');
      line.className='ops-retail-line'+(item.count<=5?' is-low':'');
      const title=document.createElement('span');title.textContent=item.p.name;
      const qty=document.createElement('strong');qty.textContent=item.count+' un.';
      line.append(title,qty);retailView.append(line);
    }
    const log=$('ops-events');log.replaceChildren();
    for(const entry of snap.activity.slice().reverse().slice(0,18))addLine(log,entry);
    if(!snap.activity.length){
      const p=document.createElement('p');p.textContent='Nenhuma operação registrada neste turno.';
      log.append(p);
    }
  }
  ops.subscribe(render);
  function open(){
    if(document.querySelector('dialog[open]'))return;
    render();dlg.showModal();
  }
  $('open-operations-toolbar').addEventListener('click',open);
  $('open-operations-game').addEventListener('click',open);
  $('close-operations').addEventListener('click',()=>dlg.close());
  $('ops-deliver').addEventListener('click',()=>{
    const id=selector.value,volume=Number($('ops-delivery-litres').value);
    const result=ops.restock(id,volume);
    show(result.ok?'Entrega registrada: '+names[id]+' · estoque '+litres(result.stock):result.error);
  });
  $('ops-retail-add').addEventListener('click',()=>{
    const id=retailSelector.value;
    const product=retailItems.find(x=>x.id===id);
    if(!product)return;
    const result=ops.restockRetail({id,category:product.category,qty:Number($('ops-retail-qty').value)});
    $('ops-retail-feedback').textContent=result.ok?
      'Entrada de '+product.name+' registrada · saldo '+result.count+' unidades.':result.error;
  });
  $('ops-close-shift').addEventListener('click',()=>{
    const customer=window.ecoGame?.currentCustomer?.();
    if(customer&&!customer.paid){
      show('Finalize o atendimento pendente antes de fechar o turno.');return;
    }
    if(!window.confirm('Encerrar o turno de treinamento? As estatísticas serão arquivadas localmente.'))return;
    const report=ops.closeShift();
    show('Turno '+report.number+' encerrado. Faturamento: '+money(report.metrics.revenueCents)+
      ', abastecido: '+litres(report.metrics.litresDeci/10)+'.');
  });
  $('ops-reset').addEventListener('click',()=>{
    if(!window.confirm('Reiniciar estoque e histórico didáticos desta sessão? Esta ação não pode ser desfeita.'))return;
    ops.resetPractice();show('Operação didática reiniciada.');
  });
  window.addEventListener('ecoposto:sale-complete',event=>{
    const detail=event.detail||{};
    ops.sale({amountCents:detail.value,method:detail.method});
  });
  window.addEventListener('ecoposto:customer-released',event=>{
    ops.customer({satisfaction:event.detail?.satisfaction,waitingSeconds:event.detail?.waitingSeconds});
  });
  window.addEventListener('ecoposto:training-warning',event=>{
    const message=event.detail?.message||'Procedimento fora do padrão.';
    ops.warning(message);
  });
  // Renderização leve: apenas mudanças, nunca em cada quadro 3D.
  render();
})();