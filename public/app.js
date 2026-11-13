'use strict';
(() => {
  // Preços em CENTAVOS e exclusivamente ilustrativos para exercícios. Nunca representam preços oficiais.
  const SRC_FUEL = 'https://www.shell.com.br/motoristas/combustiveis/duvidas-sobre-combustiveis.html';
  const SRC_VPOWER = 'https://www.shell.com.br/motoristas/combustiveis/shell-v-power.html';
  const SRC_RACING = 'https://www.shell.com.br/motoristas/combustiveis/shell-v-power-racing.html';
  const SRC_DIESEL = 'https://www.shell.com.br/motoristas/combustiveis/shell-v-power-diesel.html';
  const SRC_OIL = 'https://raizenlubrificantes.shell.com.br/para-revendas-e-consumidores/linha-de-produto/shell-helix/produto/shell-helix-hx8-sp';
  const SRC_ARLA = 'https://www.gov.br/anp/pt-br/assuntos/qualidade-de-produtos/arla-32';
  const products = [
    {id:'gasolina-comum',name:'Gasolina Comum',brand:'Combustível comum',category:'combustiveis',price:625,unit:'L',summary:'Gasolina sem pacote adicional de aditivos detergentes.',how:'Combustível para motores de ciclo Otto a gasolina ou flex. Fornece energia para a combustão interna do motor.',care:'Confirme no manual do veículo o tipo de combustível permitido. O percentual de etanol anidro na mistura pode mudar por regulamentação; não use informações antigas como regra atual.',source:SRC_FUEL},
    {id:'gasolina-nitro',name:'Gasolina Aditivada Shell V-Power Nitro+',brand:'Shell · denominação histórica',category:'combustiveis',price:655,unit:'L',summary:'Gasolina aditivada com agentes de limpeza e proteção.',how:'Nitro+ é uma denominação usada anteriormente para a gasolina aditivada Shell. A linha atualmente é divulgada como Shell V-Power, com tecnologias de limpeza de depósitos no motor.',care:'Gasolina aditivada não é necessariamente premium. O nome Nitro+ aqui foi mantido para fins de treinamento, conforme a nomenclatura do exercício.',source:SRC_VPOWER},
    {id:'gasolina-racing',name:'Shell V-Power Racing',brand:'Shell',category:'combustiveis',price:819,unit:'L',summary:'Gasolina premium de alta octanagem, acima de 100 RON.',how:'Seu índice de octanagem superior aumenta a resistência à detonação e atende motores de maior exigência, especialmente de alto desempenho que necessitam dessa característica.',care:'Não significa ganho garantido em carros que não exigem gasolina de alta octanagem. Siga a especificação do fabricante do veículo.',source:SRC_RACING},
    {id:'etanol-comum',name:'Etanol Comum',brand:'Combustível comum',category:'combustiveis',price:449,unit:'L',summary:'Etanol hidratado usado em carros flex ou compatíveis.',how:'Biocombustível de origem renovável que pode ser utilizado como combustível em motores preparados para etanol, como os veículos flex.',care:'Não coloque etanol em veículo que só aceita gasolina sem orientação do fabricante.',source:SRC_FUEL},
    {id:'diesel-s10',name:'Diesel S10',brand:'Óleo diesel de baixo teor de enxofre',category:'combustiveis',price:599,unit:'L',summary:'Diesel com limite nominal de 10 mg/kg de enxofre.',how:'É combustível para motores diesel compatíveis, especialmente os mais modernos que exigem diesel de baixo enxofre por causa dos sistemas de emissões.',care:'S10 identifica o teor de enxofre, não necessariamente aditivação. Confira a especificação do motor. ARLA 32 nunca vai no tanque de diesel.',source:SRC_DIESEL},
    {id:'diesel-s500',name:'Diesel S500',brand:'Óleo diesel de até 500 mg/kg de enxofre',category:'combustiveis',price:569,unit:'L',summary:'Diesel usado em aplicações mais antigas e compatíveis.',how:'Óleo diesel com teor de enxofre nominalmente maior que o S10. A Shell informa que a oferta de S500 ainda pode existir em alguns postos, com redução gradual.',care:'Não use S500 em motor que exige S10. A disponibilidade e os requisitos de uso dependem do veículo e da regulamentação vigente.',source:SRC_DIESEL},
    {id:'arla',name:'ARLA 32 — galão 20 L',brand:'Agente redutor automotivo',category:'cuidados',price:8990,unit:'un',summary:'Fluido usado no controle de emissões de alguns veículos diesel.',how:'Uma solução de ureia automotiva utilizada no sistema SCR do escapamento para reduzir óxidos de nitrogênio. Não é aditivo do diesel.',care:'Abasteça somente o reservatório específico de ARLA 32. Nunca coloque no tanque de combustível.',source:SRC_ARLA},
    {id:'oleo',name:'Shell Helix HX8 SP 5W-30 — 1 L',brand:'Shell Lubrificantes',category:'cuidados',price:5290,unit:'un',summary:'Óleo lubrificante sintético para motores compatíveis.',how:'Óleo sintético com tecnologia de proteção, detergência e redução de atrito em motores para os quais as especificações API SP e ILSAC GF-6A sejam adequadas.',care:'A viscosidade 5W-30, por si só, não garante compatibilidade. Consulte todas as homologações e recomendações do manual.',source:SRC_OIL},
    {id:'coca',name:'Coca-Cola Original — lata 350 mL',brand:'Coca-Cola',category:'conveniencia',price:650,unit:'un',summary:'Refrigerante para consumo na conveniência.',how:'Bebida não alcoólica carbonatada vendida pronta para consumo. Exemplo de item de giro na loja.',care:'Consulte rótulo, validade e informações nutricionais.',source:'https://www.coca-cola.com/br/pt'},
    {id:'redbull',name:'Red Bull Energy Drink — 250 mL',brand:'Red Bull',category:'conveniencia',price:1290,unit:'un',summary:'Energético em lata para consumo individual.',how:'Bebida energética com cafeína, comercializada pronta para consumo. É um item de conveniência, não um combustível.',care:'Verifique recomendações de consumo e advertências presentes na embalagem.',source:'https://www.redbull.com/br-pt/energydrink'},
    {id:'agua',name:'Água mineral — garrafa 500 mL',brand:'Produto de conveniência',category:'conveniencia',price:350,unit:'un',summary:'Água potável mineral engarrafada.',how:'Bebida para hidratação. No PDV é vendida por unidade, diferentemente de combustíveis, vendidos por litro.',care:'Observe lacre, validade e condições de armazenamento.',source:null},
    {id:'lavagem',name:'Lavagem externa simples',brand:'Serviço demonstrativo',category:'servicos',price:3500,unit:'un',summary:'Limpeza externa do veículo.',how:'Serviço de remoção de sujidades da carroceria com produtos e técnicas adequados para a superfície.',care:'É um serviço fictício do simulador; valor, execução e disponibilidade variam conforme o posto.',source:null},
    {id:'calibragem',name:'Calibragem de pneus',brand:'Serviço demonstrativo',category:'servicos',price:0,unit:'un',summary:'Verificação e ajuste da pressão dos pneus.',how:'Ajusta a pressão dos pneus aos valores recomendados pelo fabricante do veículo nas condições indicadas.',care:'Use a pressão correta indicada no manual ou na etiqueta do veículo, considerando a condição dos pneus.',source:null}
  ];
  const labels = {todos:'Todos',combustiveis:'Combustíveis',cuidados:'Óleos e cuidados',conveniencia:'Conveniência',servicos:'Serviços'};
  const icons = {combustiveis:'i-pump',cuidados:'i-drop',conveniencia:'i-bag',servicos:'i-tool'};
  const $ = (selector) => document.querySelector(selector);
  const money = (cents) => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(cents/100);
  const qtyText = (p,qty) => String(qty)+(p.unit==='L'?' L':' un.');
  const storageKey = 'ecoposto-cart-v1';
  let filter='todos', query='', cart=[], lastFocus=null, toastTimeout;
  try {
    const stored=JSON.parse(localStorage.getItem(storageKey)||'[]');
    if(Array.isArray(stored))cart=stored.filter(e=>e&&products.some(p=>p.id===e.id)&&Number.isInteger(e.qty)&&e.qty>0&&e.qty<=2000).slice(0,30);
  } catch { cart=[]; }
  function persist(){try{localStorage.setItem(storageKey,JSON.stringify(cart));}catch{}}
  function productOf(id){return products.find(p=>p.id===id);}
  function total(){return cart.reduce((sum,e)=>{const p=productOf(e.id);return sum+(p?p.price*e.qty:0);},0);}
  function notify(message){
    const toast=$('#toast'); toast.textContent=message;toast.classList.add('visible');
    clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>toast.classList.remove('visible'),2800);
  }
  function renderFilters(){
    $('#category-chips').innerHTML=Object.entries(labels).map(([id,label])=>'<button type="button" data-filter="'+id+'" class="filter-chip'+(filter===id?' is-active':'')+'" aria-pressed="'+String(filter===id)+'">'+label+'</button>').join('');
  }
  function renderProducts(){
    renderFilters();
    const found=products.filter(p=>(filter==='todos'||p.category===filter)&&(p.name+' '+p.brand+' '+p.summary).toLocaleLowerCase('pt-BR').includes(query));
    $('#products-counter').textContent=found.length+' '+(found.length===1?'ITEM ENCONTRADO':'ITENS ENCONTRADOS');
    $('#products-grid').innerHTML=found.length?found.map(p=>'<article class="product-card"><div class="product-art" data-kind="'+p.category+'"><span class="product-type">'+labels[p.category].toUpperCase()+'</span><svg aria-hidden="true"><use href="#'+icons[p.category]+'"></use></svg></div><div class="product-body"><span class="product-brand">'+p.brand+'</span><h3>'+p.name+'</h3><p class="product-summary">'+p.summary+'</p><div class="product-meta"><strong class="product-price">'+money(p.price)+'</strong><span class="product-unit">/ '+(p.unit==='L'?'litro':'unidade')+'</span></div><div class="product-actions"><button type="button" class="product-details" data-detail="'+p.id+'">Entender</button><button type="button" class="product-add" data-add="'+p.id+'">+ PDV</button></div></div></article>').join(''):'<p class="empty-state">Nenhum produto encontrado. Tente outro termo ou categoria.</p>';
  }
  function add(id){
    const p=productOf(id);if(!p)return;
    const entry=cart.find(e=>e.id===id), amount=p.unit==='L'?20:1;
    if(entry){entry.qty=Math.min(2000,entry.qty+amount);} else cart.push({id,qty:amount});
    persist();renderCart();notify('Adicionado ao PDV: '+p.name);
  }
  function adjust(id,delta){
    const entry=cart.find(e=>e.id===id);if(!entry)return;
    entry.qty=Math.min(2000,entry.qty+delta);
    if(entry.qty<=0)cart=cart.filter(e=>e.id!==id);
    persist();renderCart();
  }
  function renderCart(){
    const count=cart.reduce((n,e)=>n+e.qty,0);
    $('#cart-count').textContent=String(cart.length);
    $('#cart-count').setAttribute('title',count+' unidades/litros');
    $('#cart-total').textContent=money(total());
    $('#checkout-btn').disabled=!cart.length;
    $('#clear-cart').disabled=!cart.length;
    $('#cart-items').innerHTML=cart.length?cart.map(e=>{
      const p=productOf(e.id);if(!p)return '';
      return '<div class="cart-line"><div class="cart-line-top"><div><h3>'+p.name+'</h3><p>'+money(p.price)+' / '+(p.unit==='L'?'litro':'unidade')+'</p></div><strong>'+money(p.price*e.qty)+'</strong></div><div class="cart-line-bottom"><div class="qty-controls"><button data-adjust="'+p.id+'" data-delta="-1" aria-label="Diminuir '+p.name+'">−</button><input class="qty-input" data-qty="'+p.id+'" type="number" min="1" max="2000" step="1" value="'+e.qty+'" aria-label="Quantidade de '+p.name+' em '+(p.unit==='L'?'litros':'unidades')+'"><span class="qty-unit">'+(p.unit==='L'?'L':'un.')+'</span><button data-adjust="'+p.id+'" data-delta="1" aria-label="Aumentar '+p.name+'">+</button></div><button class="cart-remove" data-remove="'+p.id+'">Remover</button></div></div>';
    }).join(''):'<div class="cart-empty"><svg><use href="#i-bag"></use></svg><h3>Seu caixa está vazio</h3><p>Escolha produtos no catálogo para começar a simulação.</p></div>';
  }
  function openCart(){
    lastFocus=document.activeElement;
    $('#drawer-backdrop').hidden=false;
    const drawer=$('#cart-drawer');drawer.classList.add('open');drawer.setAttribute('aria-hidden','false');
    document.body.classList.add('no-scroll');setTimeout(()=>$('#close-cart').focus(),60);
  }
  function closeCart(){
    const drawer=$('#cart-drawer');drawer.classList.remove('open');drawer.setAttribute('aria-hidden','true');
    $('#drawer-backdrop').hidden=true;document.body.classList.remove('no-scroll');
    if(lastFocus&&lastFocus.isConnected)lastFocus.focus();
  }
  function openDetails(id){
    const p=productOf(id);if(!p)return;
    const source=p.source?'<a class="detail-source" target="_blank" rel="noopener noreferrer" href="'+p.source+'">Consultar fonte ou fabricante ↗</a>':'<span class="muted">Informação geral de treinamento.</span>';
    $('#detail-content').innerHTML='<div class="detail-icon"><svg><use href="#'+icons[p.category]+'"></use></svg></div><span class="section-kicker">'+labels[p.category].toUpperCase()+' · '+p.brand+'</span><h2>'+p.name+'</h2><p>'+p.summary+'</p><div class="detail-grid"><h3>Para que serve?</h3><p>'+p.how+'</p><h3>Cuidados importantes</h3><p>'+p.care+'</p></div>'+source+'<button class="button button-primary button-full" type="button" data-add-detail="'+p.id+'">Adicionar ao PDV · '+money(p.price)+'</button>';
    $('#detail-dialog').showModal();
  }
  function openPayment(){
    if(!cart.length){notify('Adicione produtos antes de concluir.');return;}
    closeCart();
    $('#payment-summary').textContent=money(total());
    $('#payment-error').textContent='';
    $('input[name="payment"][value="pix"]').checked=true;
    $('#cash-group').hidden=true;$('#cash-received').value='';$('#cash-change').textContent='';
    $('#payment-dialog').showModal();
  }
  function paymentMethod(){return $('input[name="payment"]:checked').value;}
  function updateCash(){
    const value=$('#cash-received').value;
    if(!value){$('#cash-change').textContent='';return;}
    const cents=Math.round(Number(value)*100);
    const diff=cents-total();
    $('#cash-change').textContent=Number.isFinite(cents)?(diff>=0?'Troco fictício: '+money(diff):'Faltam '+money(-diff)):'';
  }
  function finishSale(){
    if(!cart.length)return;
    const method=paymentMethod(), received=Math.round(Number($('#cash-received').value)*100);
    if(method==='dinheiro'&&(!$('#cash-received').value||!Number.isFinite(received)||received<total())){
      $('#payment-error').textContent='Informe um valor recebido maior ou igual ao total.';return;
    }
    $('#payment-error').textContent='';
    const now=new Date(), rows=cart.map(e=>({product:productOf(e.id),qty:e.qty}));
    const payNames={pix:'PIX simulado',cartao:'Cartão simulado',dinheiro:'Dinheiro simulado'};
    const ref=String(now.getTime()).slice(-8);
    const summary=rows.map(e=>'<div class="row-receipt"><span>'+e.product.name+'<br>'+qtyText(e.product,e.qty)+' × '+money(e.product.price)+'</span><span>'+money(e.qty*e.product.price)+'</span></div>').join('<br>');
    $('#receipt-content').innerHTML='<div class="receipt-print"><h2>ECOPOSTO 3D</h2><div style="text-align:center">Laboratório de PDV · Exemplo didático</div><div class="warning">SIMULAÇÃO — SEM VALOR FISCAL</div><div>Operação #'+ref+'</div><div>'+new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'medium'}).format(now)+'</div><hr>'+summary+'<hr><div class="row-receipt total-receipt"><span>TOTAL</span><span>'+money(total())+'</span></div><div>Pagamento: '+payNames[method]+'</div>'+(method==='dinheiro'?'<div>Recebido: '+money(received)+'</div><div>Troco: '+money(received-total())+'</div>':'')+'<hr><div style="text-align:center">Treinamento exclusivamente educativo.<br>Não comprova compra, pagamento ou abastecimento.</div></div>';
    $('#payment-dialog').close();
    cart=[];persist();renderCart();
    $('#receipt-dialog').showModal();
    notify('Venda fictícia concluída!');
  }
  function chooseZone(id,shouldScroll=true){
    if(!labels[id])return;
    filter=id;query='';$('#product-search').value='';renderProducts();
    if(shouldScroll)$('#produtos').scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  }
  document.addEventListener('click',(event)=>{
    const btn=event.target.closest('button');
    if(!btn)return;
    if(btn.matches('[data-open-cart]'))openCart();
    if(btn.matches('[data-filter]'))chooseZone(btn.dataset.filter,false);
    if(btn.matches('[data-detail]'))openDetails(btn.dataset.detail);
    if(btn.matches('[data-add]'))add(btn.dataset.add);
    if(btn.matches('[data-add-detail]')){const id=btn.dataset.addDetail;$('#detail-dialog').close();add(id);}
    if(btn.matches('[data-zone]'))chooseZone(btn.dataset.zone);
    if(btn.matches('[data-adjust]'))adjust(btn.dataset.adjust,Number(btn.dataset.delta));
    if(btn.matches('[data-remove]')){cart=cart.filter(e=>e.id!==btn.dataset.remove);persist();renderCart();}
    if(btn.matches('[data-close-dialog]'))btn.closest('dialog').close();
    if(btn.matches('[data-view]')){
      document.querySelectorAll('[data-view]').forEach(el=>el.classList.toggle('is-active',el===btn));
      if(window.ecoScene)window.ecoScene.focus(btn.dataset.view);else notify('Vista 3D indisponível neste navegador.');
    }
  });
  document.querySelectorAll('dialog').forEach(dialog=>dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();}));
  $('#drawer-backdrop').addEventListener('click',closeCart);
  $('#close-cart').addEventListener('click',closeCart);
  $('#checkout-btn').addEventListener('click',openPayment);
  $('#clear-cart').addEventListener('click',()=>{cart=[];persist();renderCart();notify('Pedido limpo.');});
  $('#product-search').addEventListener('input',event=>{query=event.target.value.trim().toLocaleLowerCase('pt-BR');renderProducts();});
  $('#reset-camera').addEventListener('click',()=>{document.querySelector('[data-view="geral"]').click();});
  document.querySelectorAll('input[name="payment"]').forEach(r=>r.addEventListener('change',()=>{$('#cash-group').hidden=paymentMethod()!=='dinheiro';$('#payment-error').textContent='';}));
  $('#cash-received').addEventListener('input',updateCash);
  $('#cart-items').addEventListener('change',event=>{
    const id=event.target.dataset.qty;
    if(!id)return;
    const entry=cart.find(e=>e.id===id);
    if(!entry)return;
    const n=Number(event.target.value);
    if(!Number.isInteger(n)||n<1||n>2000){event.target.value=entry.qty;notify('Informe uma quantidade inteira entre 1 e 2000.');return;}
    entry.qty=n;persist();renderCart();
  });
  $('#finish-sale').addEventListener('click',finishSale);
  $('#print-receipt').addEventListener('click',()=>window.print());
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&$('#cart-drawer').classList.contains('open'))closeCart();});
  window.addEventListener('ecoposto:zone',event=>chooseZone(event.detail.category));
  renderProducts();renderCart();
})();
