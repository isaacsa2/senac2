'use strict';
(() => {
  // Preços em CENTAVOS e exclusivamente ilustrativos para exercícios. Nunca representam preços oficiais.
  const SRC_FUEL = 'https://www.shell.com.br/motoristas/combustiveis/duvidas-sobre-combustiveis.html';
  const SRC_VPOWER = 'https://www.shell.com.br/motoristas/combustiveis/shell-v-power.html';
  const SRC_RACING = 'https://www.shell.com.br/motoristas/combustiveis/shell-v-power-racing.html';
  const SRC_DIESEL = 'https://www.shell.com.br/motoristas/combustiveis/shell-v-power-diesel.html';
  const SRC_OIL = 'https://raizenlubrificantes.shell.com.br/para-revendas-e-consumidores/linha-de-produto/shell-helix/produto/shell-helix-hx8-sp';
  const SRC_ARLA = 'https://www.gov.br/anp/pt-br/assuntos/qualidade-de-produtos/arla-32';
  // Fotografias de embalagens reais, de varejistas brasileiros; sem dependência para o funcionamento do PDV.
  const pictures={
    coca:'https://santaluzia.vtexassets.com/arquivos/ids/997380/556297.jpg?v=638525861586730000',
    redbull:'https://carrefourbr.vtexassets.com/arquivos/ids/183189711/image-0.jpg?v=638740381539970000',
    oleo:'https://images.tcdn.com.br/img/img_prod/945233/shell_helix_hx8_sp_gf6_5w_30_305337_1_d60fb75deefdebba672b1596906b76c6.jpg',
    arla:'https://images.tcdn.com.br/img/img_prod/1264917/arla_32_galao_20_lts_7677_1_1bdc0c0ee60766ed8f024ea07b8739f6.png'
  };
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
    {id:'troca-oleo',name:'Serviço de troca de óleo',brand:'Serviço demonstrativo',category:'servicos',price:6500,unit:'un',summary:'Substituição técnica de lubrificante e verificação da manutenção.',how:'Serviço de retirada e reposição do óleo do motor, conforme a especificação e o procedimento do fabricante. Óleo e filtro podem ser cobrados separadamente.',care:'Execução apenas por profissional qualificado. Óleo usado e filtro devem ser destinados à coleta autorizada, nunca ao solo ou ralo.',source:null},
    {id:'lavagem',name:'Lavagem externa simples',brand:'Serviço demonstrativo',category:'servicos',price:3500,unit:'un',summary:'Limpeza externa do veículo.',how:'Serviço de remoção de sujidades da carroceria com produtos e técnicas adequados para a superfície.',care:'É um serviço fictício do simulador; valor, execução e disponibilidade variam conforme o posto.',source:null},
    {id:'calibragem',name:'Calibragem de pneus',brand:'Serviço demonstrativo',category:'servicos',price:0,unit:'un',summary:'Verificação e ajuste da pressão dos pneus.',how:'Ajusta a pressão dos pneus aos valores recomendados pelo fabricante do veículo nas condições indicadas.',care:'Use a pressão correta indicada no manual ou na etiqueta do veículo, considerando a condição dos pneus.',source:null}
  ];
  products.push(...(window.ECO_EXTRAS||[]));
  const labels = {todos:'Todos',combustiveis:'Combustíveis',cuidados:'Óleos e cuidados',conveniencia:'Conveniência',servicos:'Serviços'};
  const icons = {combustiveis:'i-pump',cuidados:'i-drop',conveniencia:'i-bag',servicos:'i-tool'};
  const $ = (selector) => document.querySelector(selector);
  const money = (cents) => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(cents/100);
  const qtyText = (p,qty) => qty.toLocaleString('pt-BR',{maximumFractionDigits:p.unit==='L'?1:0})+(p.unit==='L'?' L':' un.');
  const storageKey = 'ecoposto-cart-v1';
  let filter='todos', query='', cart=[], lastFocus=null, toastTimeout;
  try {
    const stored=JSON.parse(localStorage.getItem(storageKey)||'[]');
    if(Array.isArray(stored))cart=stored.filter(e=>e&&products.some(p=>p.id===e.id)&&Number.isFinite(e.qty)&&e.qty>0&&e.qty<=2000&&(Number.isInteger(e.qty*10))).slice(0,30);
  } catch { cart=[]; }
  function persist(){try{localStorage.setItem(storageKey,JSON.stringify(cart));}catch{}}
  function productOf(id){return products.find(p=>p.id===id);}
  function total(){return cart.reduce((sum,e)=>{const p=productOf(e.id);return sum+(p?Math.round(p.price*e.qty):0);},0);}
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
    $('#products-grid').innerHTML=found.length?found.map(p=>'<article class="product-card"><div class="product-art" data-kind="'+p.category+'"><span class="product-type">'+labels[p.category].toUpperCase()+'</span><svg aria-hidden="true"><use href="#'+icons[p.category]+'"></use></svg>'+(pictures[p.id]?'<img class="real-product-image" src="'+pictures[p.id]+'" loading="lazy" decoding="async" alt="Embalagem real de '+p.name+'">':'')+'</div><div class="product-body"><span class="product-brand">'+p.brand+'</span><h3>'+p.name+'</h3><p class="product-summary">'+p.summary+'</p><div class="product-meta"><strong class="product-price">'+money(p.price)+'</strong><span class="product-unit">/ '+(p.unit==='L'?'litro':'unidade')+'</span></div><div class="product-actions"><button type="button" class="product-details" data-detail="'+p.id+'">Entender</button><button type="button" class="product-add" data-add="'+p.id+'">+ PDV</button></div></div></article>').join(''):'<p class="empty-state">Nenhum produto encontrado. Tente outro termo ou categoria.</p>';
  }
  function add(id){
    const p=productOf(id);if(!p)return;
    if(p.unit==='L'&&window.ecoGame?.isActive()){
      notify('No modo frentista, lance o combustível somente pela bomba após o abastecimento.');
      return;
    }
    const entry=cart.find(e=>e.id===id), amount=p.unit==='L'?20:1;
    if(p.unit!=='L'&&p.category!=='servicos'){
      const available=window.ECO_OPERATIONS?.retailCount?.(p);
      if(Number.isFinite(available)&&(entry?.qty||0)+amount>available){
        notify('Sem estoque suficiente de '+p.name+'. Consulte Operações para repor.');return;
      }
    }
    if(entry){entry.qty=Math.min(2000,entry.qty+amount);} else cart.push({id,qty:amount});
    persist();renderCart();notify('Adicionado ao PDV: '+p.name);
  }
  function adjust(id,delta){
    const entry=cart.find(e=>e.id===id);if(!entry)return;
    const product=productOf(id);
    if(product?.unit==='L'&&window.ecoGame?.isActive()){
      notify('Litros do veículo vêm do visor da bomba e não podem ser alterados no caixa.');
      return;
    }
    if(product?.unit!=='L'&&product?.category!=='servicos'&&delta>0){
      const available=window.ECO_OPERATIONS?.retailCount?.(product);
      if(Number.isFinite(available)&&entry.qty+delta>available){
        notify('Quantidade maior que o estoque de '+product.name);return;
      }
    }
    entry.qty=Math.min(2000,Math.round((entry.qty+delta)*10)/10);
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
      return '<div class="cart-line"><div class="cart-line-top"><div><h3>'+p.name+'</h3><p>'+money(p.price)+' / '+(p.unit==='L'?'litro':'unidade')+'</p></div><strong>'+money(Math.round(p.price*e.qty))+'</strong></div><div class="cart-line-bottom"><div class="qty-controls"><button data-adjust="'+p.id+'" data-delta="'+(p.unit==='L'?'-0.1':'-1')+'" aria-label="Diminuir '+p.name+'">−</button><input class="qty-input" data-qty="'+p.id+'" type="number" min="'+(p.unit==='L'?'0.1':'1')+'" max="2000" step="'+(p.unit==='L'?'0.1':'1')+'" value="'+e.qty+'" aria-label="Quantidade de '+p.name+' em '+(p.unit==='L'?'litros':'unidades')+'"><span class="qty-unit">'+(p.unit==='L'?'L':'un.')+'</span><button data-adjust="'+p.id+'" data-delta="'+(p.unit==='L'?'0.1':'1')+'" aria-label="Aumentar '+p.name+'">+</button></div><button class="cart-remove" data-remove="'+p.id+'">Remover</button></div></div>';
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
  // Terminal 100% didático: QR é desenho, cartão é fictício, não existe API de cobrança.
  let paymentApproved=false,approvalTimer=null;
  const sim=window.ECO_SIM;
  let receiptScenario=null,selectedCash=0;
  const cashInput=$('#cash-received');
  function escapeHtml(value){
    return String(value).replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
  }
  function displayReceivables(){
    const dest=$('#credit-list');if(!dest||!sim)return;
    const entries=sim.receivables().slice(-50).reverse();
    dest.innerHTML=entries.length?entries.map(r=>
      '<article class="credit-item"><div><strong>'+escapeHtml(r.customer)+'</strong>'+
      '<small>'+escapeHtml(r.id)+' · Venc.: '+escapeHtml(r.due)+'</small></div>'+
      '<div><strong>'+money(r.amount)+'</strong><span>'+(r.status==='paid'?'BAIXADA':'EM ABERTO')+'</span>'+
      (r.status==='open'?'<button type="button" data-credit-settle="'+escapeHtml(r.id)+'">Baixar (simular)</button>':'')+'</div></article>'
    ).join(''):'<p>Nenhuma nota a prazo registrada.</p>';
  }
  function setCreditDefaults(){
    const customer=window.ecoGame?.currentCustomer?.();
    $('#credit-customer').value=customer?.customer||'Cliente de treinamento';
    $('#credit-plate').value=customer?.plate||'DEMO-001';
    const due=new Date();due.setDate(due.getDate()+15);
    const iso=due.getFullYear()+'-'+String(due.getMonth()+1).padStart(2,'0')+'-'+String(due.getDate()).padStart(2,'0');
    $('#credit-due').value=iso;$('#credit-notes').value='Prazo de 15 dias (simulação)';
    $('#credit-summary').textContent='Valor a prazo: '+money(total())+' · Limite por cliente: R$ 1.500,00.';
    displayReceivables();
  }
  function setupCashDenominations(){
    const dest=$('#cash-denominations');if(!sim||!dest||dest.childElementCount)return;
    for(const denom of sim.DENOMS){
      const btn=document.createElement('button');
      btn.type='button';btn.className='money-unit '+(denom.kind==='coin'?'money-coin':'money-note');
      btn.dataset.cashCentavos=String(denom.value);
      btn.style.setProperty('--money-tint',denom.color);
      btn.textContent=denom.label;
      btn.setAttribute('aria-label','Receber '+denom.label+' em dinheiro de treinamento');
      dest.append(btn);
    }
  }
  function getCreditDetails(){return {customer:$('#credit-customer').value,due:$('#credit-due').value,
    plate:$('#credit-plate').value,notes:$('#credit-notes').value,amount:total()};}
  function renderPosComputer(){
    const entries=cart.map(e=>({p:productOf(e.id),qty:e.qty})).filter(e=>!!e.p);
    $('#pos-computer-rows').innerHTML=entries.length?entries.map(e=>
      '<tr><td>'+escapeHtml(e.p.name)+'</td><td>'+escapeHtml(qtyText(e.p,e.qty))+
      '</td><td>'+money(Math.round(e.p.price*e.qty))+'</td></tr>'
    ).join(''):'<tr><td colspan="3">Nenhum item lançado. Abasteça ou escolha um produto.</td></tr>';
    $('#pos-computer-total').textContent=money(total());
    const c=window.ecoGame?.currentCustomer?.();
    $('#pos-computer-customer').textContent=c?c.customer+' • '+c.plate:'Cliente de treinamento';
  }
  function openPosComputer(){
    if(document.querySelector('dialog[open]'))return;
    renderPosComputer();$('#pos-computer').showModal();
  }
  function openPosPayment(credit=false){
    if($('#pos-computer').open)$('#pos-computer').close();
    if(!cart.length){notify('Abasteça ou adicione produtos ao PDV antes de receber.');return;}
    openPayment();
    if(credit){
      $('input[name="payment"][value="prazo"]').checked=true;
      renderPaymentMode();
    }
  }
  const paymentDialog=$('#payment-dialog');
  function paymentMethod(){return $('input[name="payment"]:checked')?.value||'pix';}
  function makeFakeQr(){
    const host=$('#fake-qr');
    if(host.childElementCount)return;
    const frag=document.createDocumentFragment();
    for(let y=0;y<15;y++)for(let x=0;x<15;x++){
      const dot=document.createElement('i');
      const finder=(cx,cy)=>x>=cx&&x<cx+4&&y>=cy&&y<cy+4;
      const corner=finder(0,0)||finder(11,0)||finder(0,11);
      const on=corner?((x%4===0||y%4===0)||((x%4===2)&&(y%4===2))):((x*17+y*37+x*y*7)%11<5);
      if(on)dot.className='filled';
      frag.append(dot);
    }
    host.append(frag);
  }
  function setTerminalStatus(text,state=''){
    $('#terminal-status').textContent=text;
    $('#terminal-status').className='terminal-status'+(state?' '+state:'');
  }
  function allowFinish(enabled){
    $('#finish-sale').disabled=!enabled;
  }
  function updateCash(){
    if(paymentMethod()!=='dinheiro')return;
    const cash=sim?.cashAdjustment(total())||{original:total(),due:total(),discount:0};
    const adjustment=$('#cash-adjustment');
    if(adjustment){
      adjustment.textContent=cash.discount>0?
        'Original: '+money(cash.original)+' • desconto de centavos: -'+money(cash.discount)+' • em dinheiro: '+money(cash.due):
        'Total em dinheiro: '+money(cash.due)+' (sem ajuste)';
    }
    const input=$('#cash-received'),amount=input.value===''?NaN:Math.round(Number(input.value)*100);
    const valid=Number.isSafeInteger(amount)&&amount>=0&&amount<=10000000&&amount%5===0;
    const difference=valid?amount-cash.due:NaN;
    const change=$('#cash-change');
    const breakdown=$('#cash-change-breakdown');
    change.classList.toggle('insufficient',valid&&difference<0);
    if(!valid){
      if(breakdown)breakdown.replaceChildren();
      change.textContent='Informe um valor recebido em múltiplos de R$ 0,05.';
      allowFinish(false);
    }else if(difference<0){
      if(breakdown)breakdown.replaceChildren();
      change.textContent='Ainda faltam '+money(-difference)+'.';
      allowFinish(false);
    }else{
      change.textContent='Troco a entregar ao cliente: '+money(difference);
      if(breakdown)breakdown.textContent='Sugestão de notas e moedas: '+(difference===0?'troco exato · R$ 0,00':
        (sim?.changeFor(difference)||[]).map(x=>x.count+' × '+x.label).join(' • '));
      allowFinish(true);
    }
    $('#payment-error').textContent='';
  }
  function renderPaymentMode(){
    if(approvalTimer){clearTimeout(approvalTimer);approvalTimer=null;}
    paymentApproved=false;receiptScenario=null;
    const method=paymentMethod(),cash=method==='dinheiro',credit=method==='prazo',card=method==='cartao';
    $('#payment-device').hidden=cash||credit;
    $('#cash-group').hidden=!cash;
    $('#credit-group').hidden=!credit;
    $('#card-type-group').hidden=!card;
    $('#card-operation-group').hidden=!card;
    $('#card-virtual').hidden=!card;
    $('#fake-qr').hidden=method!=='pix';
    $('#payment-device').classList.toggle('is-card',card);
    $('#payment-device').classList.remove('is-approving','is-inserting');
    $('#terminal-amount').textContent=money(total());
    $('#payment-error').textContent='';
    if(method==='pix'){
      $('#terminal-screen-title').textContent='PIX · DEMONSTRAÇÃO';
      $('#terminal-screen-sub').textContent='QR ILUSTRATIVO, NÃO ESCANEÁVEL';
      $('#terminal-instructions').textContent='QR desenhado na maquininha: o instrutor confirma apenas uma simulação.';
      $('#terminal-confirm').textContent='Simular Pix recebido';
      setTerminalStatus('AGUARDANDO PIX');
    }else if(card){
      const inserted=$('#card-operation').value==='insert';
      $('#terminal-screen-title').textContent='CARTÃO · '+($('#card-type').value==='credito'?'CRÉDITO':'DÉBITO');
      $('#terminal-screen-sub').textContent=inserted?'INSIRA O CARTÃO FICTÍCIO':'APROXIME O CARTÃO VIRTUAL';
      $('#terminal-instructions').textContent=inserted?'Simule a inserção do chip sem fornecer cartão, senha ou PIN reais.':
        'Simule a aproximação NFC do cartão fictício. Erros podem acontecer em modo treinamento.';
      $('#terminal-confirm').textContent=inserted?'Inserir cartão virtual':'Aproximar cartão virtual';
      setTerminalStatus('AGUARDANDO CARTÃO');
    }else if(credit){
      setCreditDefaults();
    }else{
      $('#cash-art-value').textContent='R$ 20';
      setupCashDenominations();
      updateCash();
    }
    $('#terminal-confirm').disabled=false;
    allowFinish(credit?total()>0:false);
    if(cash)updateCash();
    const machine=sim?.config();
    if(machine)$('#machine-scenario').value=machine.forced;
  }
    function openPayment(){
    if(!cart.length){notify('Adicione produtos antes de concluir.');return;}
    closeCart();
    $('input[name="payment"][value="pix"]').checked=true;
    $('#payment-summary').textContent=money(total());
    $('#cash-received').value='';
    makeFakeQr();setupCashDenominations();renderPaymentMode();
    paymentDialog.showModal();
  }
  function confirmTerminal(){
    if(!['pix','cartao'].includes(paymentMethod())||paymentApproved||approvalTimer)return;
    $('#terminal-confirm').disabled=true;
    $('#payment-device').classList.add('is-approving');
    if(paymentMethod()==='cartao'&&$('#card-operation').value==='insert')$('#payment-device').classList.add('is-inserting');
    $('#terminal-screen-sub').textContent='PROCESSANDO TREINAMENTO';
    setTerminalStatus('PROCESSANDO…','processing');
    approvalTimer=setTimeout(()=>{
      approvalTimer=null;
      if(!paymentDialog.open)return;
      const scenario=sim?.machineOutcome()||{code:'approved',name:'APROVADO',message:'Operação simulada aprovada.',ok:true};
      receiptScenario=scenario;
      paymentApproved=!!scenario.ok;
      $('#terminal-screen-sub').textContent=scenario.name;
      $('#terminal-instructions').textContent=scenario.message;
      $('#payment-device').classList.remove('is-approving','is-inserting');
      setTerminalStatus(scenario.name+' · DEMO',scenario.ok?'approved':'error');
      allowFinish(scenario.ok);
      if(!scenario.ok){
        $('#terminal-confirm').disabled=false;
        $('#terminal-confirm').textContent='Tentar novamente';
      }else $('#terminal-confirm').textContent='Aprovado ✓';
    },650);
  }
    function finishSale(){
    if(!cart.length)return;
    const method=paymentMethod();
    const retailItems=cart.map(e=>{
      const p=productOf(e.id);
      return p?{id:p.id,category:p.category,qty:e.qty}:null;
    }).filter(Boolean);
    const retailCheck=window.ECO_OPERATIONS?.validateRetail?.(retailItems);
    if(retailCheck&&!retailCheck.ok){
      $('#payment-error').textContent=retailCheck.error;return;
    }
    let creditRecord=null;
    if(method==='prazo'){
      try{creditRecord=sim.saveCredit(getCreditDetails());}
      catch(error){$('#payment-error').textContent=error.message;return;}
    }
    const amountReceived=$('#cash-received').value===''?NaN:Math.round(Number($('#cash-received').value)*100);
    const cash=sim?.cashAdjustment(total())||{original:total(),due:total(),discount:0};
    if(method==='dinheiro'){
      if(!Number.isSafeInteger(amountReceived)||amountReceived%5!==0||amountReceived<cash.due||amountReceived>10000000){
        $('#payment-error').textContent='Confira o valor em dinheiro recebido antes de concluir.';return;
      }
    }else if(method!=='prazo'&&!paymentApproved){
      $('#payment-error').textContent='Confirme o pagamento fictício na maquininha antes de finalizar.';return;
    }
    const now=new Date(),rows=cart.map(e=>({product:productOf(e.id),qty:e.qty}));
    const payNames={pix:'Pix na maquininha (simulado)',cartao:'Cartão '+($('#card-type').value==='credito'?'crédito':'débito')+' (simulado)',dinheiro:'Dinheiro em espécie (simulado)',prazo:'Nota a prazo (conta a receber fictícia)'};
    const ref=String(now.getTime()).slice(-8);
    const summary=rows.map(e=>'<div class="row-receipt"><span>'+e.product.name+'<br>'+qtyText(e.product,e.qty)+' × '+money(e.product.price)+'</span><span>'+money(Math.round(e.qty*e.product.price))+'</span></div>').join('<br>');
    $('#receipt-content').innerHTML='<div class="receipt-print"><h2>ECOPOSTO 3D</h2><div style="text-align:center">Laboratório de PDV · Exemplo didático</div><div class="warning">SIMULAÇÃO — SEM VALOR FISCAL</div><div>Operação #'+ref+'</div><div>'+new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'medium'}).format(now)+'</div><hr>'+summary+'<hr><div class="row-receipt total-receipt"><span>TOTAL</span><span>'+money(total())+'</span></div><div>Pagamento: '+payNames[method]+'</div>'+(method==='dinheiro'?'<div>Ajuste favorável em espécie: -'+money(cash.discount)+'</div><div>Valor em dinheiro: '+money(cash.due)+'</div><div>Recebido: '+money(amountReceived)+'</div><div>Troco entregue: '+money(amountReceived-cash.due)+'</div>':method==='prazo'?'<div>Prazo: '+escapeHtml(creditRecord?.id||'')+' · vencimento '+escapeHtml(creditRecord?.due||'')+'</div>':'<div>Terminal: ECO PAY · modo de treinamento</div>')+'<hr><div style="text-align:center">Treinamento exclusivamente educativo.<br>Não comprova compra, pagamento ou abastecimento.</div></div>';
    // A baixa de produtos físicos só ocorre após confirmar o pagamento fictício.
    const retailResult=window.ECO_OPERATIONS?.consumeRetail?.(retailItems);
    if(retailResult&&!retailResult.ok){
      $('#payment-error').textContent=retailResult.error;return;
    }
    // Emite evento antes de limpar o carrinho; o veículo só é liberado após venda.
    window.dispatchEvent(new CustomEvent('ecoposto:sale-complete',{detail:{
      method,productIds:rows.map(e=>e.product.id),value:method==='dinheiro'?cash.due:total(),creditId:creditRecord?.id||null
    }}));
    paymentDialog.close();
    if(approvalTimer)clearTimeout(approvalTimer);approvalTimer=null;paymentApproved=false;
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
    if(btn.matches('[data-remove]')){
      const p=productOf(btn.dataset.remove);
      if(p?.unit==='L'&&window.ecoGame?.isActive()){
        notify('Combustível já abastecido: não é possível apagar o registro no modo frentista.');return;
      }
      cart=cart.filter(e=>e.id!==btn.dataset.remove);persist();renderCart();
    }
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
  document.querySelectorAll('input[name="payment"]').forEach(r=>r.addEventListener('change',renderPaymentMode));
  $('#card-type').addEventListener('change',renderPaymentMode);
  $('#card-operation').addEventListener('change',renderPaymentMode);
  $('#machine-scenario').addEventListener('change',event=>{
    sim?.setConfig({forced:event.target.value});
    renderPaymentMode();
  });
  $('#credit-list').addEventListener('click',event=>{
    const id=event.target.closest('[data-credit-settle]')?.dataset.creditSettle;
    if(!id)return;
    if(sim?.settleCredit(id)){displayReceivables();notify('Baixa fictícia registrada.');}
  });
  for(const id of ['credit-customer','credit-plate','credit-due','credit-notes']){
    $('#'+id).addEventListener('input',()=>{$('#payment-error').textContent='';});
  }
  $('#cash-received').addEventListener('input',updateCash);
  $('#cash-reset').addEventListener('click',()=>{
    $('#cash-received').value='';
    $('#cash-art-value').textContent='R$ 20';
    updateCash();
  });
  $('#cash-denominations').addEventListener('click',event=>{
    const button=event.target.closest('[data-cash-centavos]');if(!button||paymentMethod()!=='dinheiro')return;
    const cents=Number(button.dataset.cashCentavos);
    if(!Number.isInteger(cents)||cents<1||cents>20000)return;
    const current=cashInput.value===''?0:Math.round(Number(cashInput.value)*100);
    if(!Number.isSafeInteger(current)||current+cents>10000000)return;
    cashInput.value=((current+cents)/100).toFixed(2);
    $('#cash-art-value').textContent=money(cents);
    $('#cash-group').classList.remove('is-receiving');void $('#cash-group').offsetWidth;
    $('#cash-group').classList.add('is-receiving');
    updateCash();
  });
    $('#terminal-confirm').addEventListener('click',confirmTerminal);
  paymentDialog.addEventListener('close',()=>{
    if(approvalTimer){clearTimeout(approvalTimer);approvalTimer=null;}
    paymentApproved=false;
  });
  $('#cart-items').addEventListener('change',event=>{
    const id=event.target.dataset.qty;
    if(!id)return;
    const entry=cart.find(e=>e.id===id);
    if(!entry)return;
    const n=Number(event.target.value);
    const p=productOf(id),min=p?.unit==='L'?0.1:1;
    if(p?.unit==='L'&&window.ecoGame?.isActive()){
      event.target.value=entry.qty;notify('Volume registrado pela bomba não pode ser editado.');return;
    }
    if(p?.unit!=='L'&&p?.category!=='servicos'){
      const available=window.ECO_OPERATIONS?.retailCount?.(p);
      if(Number.isFinite(available)&&n>available){
        event.target.value=entry.qty;notify('Quantidade acima do estoque disponível.');return;
      }
    }
    const valid=Number.isFinite(n)&&n>=min&&n<=2000&&(p?.unit==='L'?Math.abs(n*10-Math.round(n*10))<1e-7:Number.isInteger(n));
    if(!valid){event.target.value=entry.qty;notify('Informe uma quantidade válida (litros em décimos ou produtos inteiros).');return;}
    entry.qty=n;persist();renderCart();
  });
  $('#finish-sale').addEventListener('click',finishSale);
  $('#print-receipt').addEventListener('click',()=>window.print());
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&$('#cart-drawer').classList.contains('open'))closeCart();});
  // Integração com o modo frentista: registra litros com uma casa decimal, sem acesso a bomba real.
  window.addEventListener('ecoposto:fill-complete',event=>{
    const id=event.detail?.id;
    const litres=Number(event.detail?.litres);
    const p=productOf(id);
    if(!p||p.unit!=='L'||!Number.isFinite(litres)||litres<.1||litres>200||Math.abs(litres*10-Math.round(litres*10))>1e-7)return;
    const entry=cart.find(e=>e.id===id);
    if(entry)entry.qty=Math.min(2000,Math.round((entry.qty+litres)*10)/10);
    else cart.push({id,qty:litres});
    persist();renderCart();
    notify(litres.toLocaleString('pt-BR',{maximumFractionDigits:1})+' L de '+p.name+' registrados no PDV.');
  });
  window.addEventListener('ecoposto:show-product',event=>openDetails(event.detail?.id));
  window.addEventListener('ecoposto:add-item',event=>{if(productOf(event.detail?.id))add(event.detail.id);});
  document.addEventListener('error',event=>{
    if(event.target instanceof HTMLImageElement&&event.target.matches('.real-product-image'))event.target.hidden=true;
  },true);
  window.ecoCatalog={
    fuelProducts:products.filter(p=>p.category==='combustiveis').map(p=>({id:p.id,name:p.name,price:p.price})),
    catalog:products.filter(p=>p.category!=='combustiveis').map(p=>({id:p.id,name:p.name,brand:p.brand,category:p.category,price:p.price,summary:p.summary,image:pictures[p.id]||null})),
    money
  };
  // Integração dos terminais de pagamento 3D ao mesmo fluxo seguro do PDV.
  // Sem produtos, openPayment mostra orientação em vez de abrir uma cobrança vazia.
  window.addEventListener('ecoposto:open-payment',openPayment);
  window.addEventListener('ecoposto:open-pos',openPosComputer);
  $('#pos-close').addEventListener('click',()=>$('#pos-computer').close());
  $('#pos-open-payment').addEventListener('click',()=>openPosPayment(false));
  $('#pos-credit').addEventListener('click',()=>openPosPayment(true));
  $('#pos-open-cart').addEventListener('click',()=>{$('#pos-computer').close();openCart();});
  document.addEventListener('keydown',event=>{
    if(!$('#pos-computer').open)return;
    if(event.key==='Escape'){$('#pos-computer').close();return;}
    if(event.target instanceof HTMLElement&&event.target.closest('input,textarea,select,[contenteditable]'))return;
    if(event.key==='F4'){event.preventDefault();openPosPayment(false);}
    if(event.key==='F6'){event.preventDefault();openPosPayment(true);}
  });
  const graphics=$('#graphics-quality');
  function updateQuality(){window.ecoScene?.setQuality?.(graphics.value);}
  graphics.addEventListener('change',updateQuality);
  const density=$('#traffic-density');
  function updateDensity(){
    const result=window.ecoScene?.setTrafficDensity?.(density.value);
    if(result)$('#traffic-count').textContent='Até '+result.max+' veículos';
  }
  density.addEventListener('change',updateDensity);
  const weatherSelect=$('#weather-mode');
  function updateWeather(){window.ecoScene?.setWeather?.(weatherSelect.value);}
  weatherSelect.addEventListener('change',updateWeather);
  window.addEventListener('ecoposto:scene-ready',updateWeather);
  window.addEventListener('ecoposto:scene-ready',updateDensity);
  window.addEventListener('ecoposto:scene-ready',updateQuality);
  if(window.ecoScene){updateQuality();updateDensity();updateWeather();}

  // Tela cheia nativa da cena (inclui HUD e barra de ferramentas).
  // Se o navegador não expuser Fullscreen API, usa fallback CSS reversível.
  const sceneCard=$('.scene-card'),fullBtn=$('#fullscreen-scene');
  let fallbackFullscreen=false;
  function fullscreenNow(){return document.fullscreenElement===sceneCard||fallbackFullscreen;}
  function updateFullscreen(){
    const active=fullscreenNow();
    fullBtn.textContent=active?'⤢ Sair da tela cheia':'⛶ Tela cheia';
    fullBtn.setAttribute('aria-pressed',String(active));
    fullBtn.setAttribute('aria-label',active?'Sair do modo tela cheia':'Abrir posto em tela cheia');
    document.body.classList.toggle('scene-fullscreen-open',active);
    window.dispatchEvent(new Event('resize'));
    window.ecoScene?.requestRender?.();
  }
  async function toggleFullscreen(){
    if(document.fullscreenElement===sceneCard){
      try{await document.exitFullscreen();}catch(error){console.warn('Não foi possível sair da tela cheia.',error);}
      return;
    }
    if(fallbackFullscreen){
      fallbackFullscreen=false;sceneCard.classList.remove('fullscreen-fallback');updateFullscreen();return;
    }
    try{
      if(typeof sceneCard.requestFullscreen==='function'){
        await sceneCard.requestFullscreen();
        updateFullscreen();return;
      }
    }catch(error){console.info('Tela cheia nativa indisponível; usando layout alternativo.',error);}
    fallbackFullscreen=true;sceneCard.classList.add('fullscreen-fallback');updateFullscreen();
  }
  fullBtn.addEventListener('click',toggleFullscreen);
  document.addEventListener('fullscreenchange',updateFullscreen);
  document.addEventListener('keydown',event=>{
    if(event.target instanceof HTMLElement&&event.target.closest('input,textarea,select,[contenteditable]'))return;
    if(event.key.toLowerCase()==='f'&&!document.querySelector('dialog[open]')){
      event.preventDefault();toggleFullscreen();
    }
    if(event.key==='Escape'&&fallbackFullscreen){
      fallbackFullscreen=false;sceneCard.classList.remove('fullscreen-fallback');updateFullscreen();
    }
  });
  window.addEventListener('ecoposto:zone',event=>chooseZone(event.detail.category));
  $('#catalog-count').textContent=String(products.length);
  renderProducts();renderCart();
})();
