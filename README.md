# EcoPosto 3D — simulador educativo

Um posto de combustíveis interativo em **3D real (WebGL)**, com catálogo de produtos existentes no mercado brasileiro e um ponto de venda **inteiramente fictício** para treinamento. Feito com HTML, CSS e JavaScript, sem build e sem backend.

## Modo frentista (jogo 3D)

Acesse a seção **Explorar 3D** e clique em **Iniciar modo frentista**. No desktop, use **W/A/S/D** ou as **setas** para movimentar, **Shift** para andar mais rápido e **E** para interagir quando estiver próximo de uma bomba, da conveniência ou do box de troca de óleo. No celular, use as setas virtuais e o botão **Interagir**.

- **Abastecimento:** selecione uma bomba, o tipo correto de veículo e a quantidade desejada (1–80 L para carro flex ou até 200 L para diesel); iniciar, pausar, retomar e finalizar
- **Compatibilidade:** flex/gasolina/etanol; diesel S10 para motores compatíveis; diesel S500 só em veículo antigo compatível
- **Visor de abastecimento:** litros, valor em reais e barra de progresso; o total fictício é registrado no PDV em décimos de litro
- **Conveniência nos fundos:** vitrine modelada com latas e bebidas, fotografias reais nas etiquetas clicáveis e produtos no catálogo
- **Troca de óleo na lateral:** box aberto com rampa, lubrificantes, ARLA 32 e serviço de manutenção no PDV
- **HUD:** missão de abastecimento, minimapa e modos dia/noite; som de interface opcional e desligado por padrão
- **Gráficos leves:** modelos low-poly, textura de texto pequena e renderização sob demanda no modo de visita

O jogo não controla bombas, motores, veículos nem pagamentos reais. Os preços são exemplos, os gráficos estilizados e as imagens de terceiros dependem da disponibilidade dos servidores que as hospedam.

## O que já funciona

- Maquete 3D do posto: bombas de combustíveis, loja, área de serviços, carro, árvores e cobertura com painéis solares
- Giro por mouse/toque, zoom e atalhos de câmera, com renderização sob demanda
- Catálogo por categoria com busca e explicação de cada item, além de links para fontes
- PDV com produtos, litros em décimos, unidades, totalização em centavos e carrinho salvo localmente
- Simulação de pagamento PIX, cartão ou dinheiro, incluindo cálculo de troco
- Comprovante imprimível sinalizado **SIMULAÇÃO — SEM VALOR FISCAL**
- Layout responsivo e alternativa visual caso WebGL/CDN não funcione

**Atenção:** os preços são valores fictícios. Não há pagamento, estoque, nota fiscal, comunicação com bomba real, emissão de NF-e/NFC-e, cadastro de cliente ou conexão a sistemas de produção.

## Executar localmente

Use um servidor HTTP (não abra o HTML diretamente pelo protocolo file://):

    cd public
    python -m http.server 8080

Acesse http://localhost:8080.

## Publicar no Render

Use **Static Site** no Render, com:
- Repositório: https://github.com/isaacsa2/senac2
- Branch: main
- Build Command: echo "EcoPosto 3D pronto"
- Publish Directory: public
- Auto Deploy: Yes

Ou importe o arquivo render.yaml como Blueprint.

O código 3D usa Three.js 0.181.2, importado de uma CDN com versão fixa. O HTML/CSS/JS local não requer npm. Sem conexão para baixar Three.js, o restante do site continua funcionando e aparece uma ilustração 2D de reserva.

## Organização

- public/index.html — interface semântica e acessível
- public/styles.css — estilos, responsividade e impressão
- public/app.js — catálogo e PDV
- public/scene.js — modelo WebGL gerado por código
- public/assets/favicon.svg — ícone vetorial
- render.yaml — infraestrutura declarativa do Render

## Combustíveis incluídos (conforme exercício)

O simulador apresenta **seis combustíveis** e seis bombas na cena 3D:

1. Gasolina Comum
2. Gasolina Aditivada Shell V-Power Nitro+ (denominação histórica)
3. Shell V-Power Racing (gasolina premium)
4. Etanol Comum
5. Diesel S10
6. Diesel S500

**Nota sobre a nomenclatura:** a Shell atualmente promove a linha **Shell V-Power**, enquanto Nitro+ aparece em sua documentação histórica. O nome solicitado é mantido na simulação para fins didáticos. A Shell V-Power Racing é combustível de alta octanagem, distinta da gasolina aditivada convencional.

**Preços fictícios.** Os valores no simulador não são cotações, nem refletem um posto específico. A venda, os pagamentos, os comprovantes e os serviços são exclusivamente simulados.

## Conteúdo e créditos

Combustíveis Shell, lubrificante Shell Helix HX8 SP e produtos de conveniência são marcas e produtos reais referenciados **sem afiliação ou patrocínio**. Não foram empregados logotipos oficiais. Consulte o manual do veículo e as fichas técnicas de cada combustível ou produto antes de uso.

Fontes oficiais de referência:
- [Shell — dúvidas sobre combustíveis e menção histórica ao Nitro+](https://www.shell.com.br/motoristas/combustiveis/duvidas-sobre-combustiveis.html)
- [Shell V-Power](https://www.shell.com.br/motoristas/combustiveis/shell-v-power.html)
- [Shell V-Power Racing](https://www.shell.com.br/motoristas/combustiveis/shell-v-power-racing.html)
- [Shell — diesel S10 e S500](https://www.shell.com.br/motoristas/combustiveis/shell-v-power-diesel.html)
- [Shell Helix HX8 SP 5W-30](https://raizenlubrificantes.shell.com.br/para-revendas-e-consumidores/linha-de-produto/shell-helix/produto/shell-helix-hx8-sp)

O arquivo LICENSE do repositório estabelece AGPL-3.0. O projeto é uma criação original, não uma cópia do simulador do Canva.

## Imagens de produtos

As fotos são exibidas como **etiquetas de produtos na cena 3D** e nos cards do catálogo. Os modelos de latas e galões no mundo 3D são simplificações autorais, não modelos licenciados dos fabricantes. As fotografias reais são carregadas externamente e têm fallback para ícone se a loja/CDN estiver indisponível.

- Coca-Cola 350 mL: Casa Santa Luzia / VTEX
- Red Bull 250 mL: Carrefour Brasil / VTEX
- Shell Helix HX8 SP 5W-30: Auri Auto Peças / Tray
- ARLA 32 20 L: Lima Acessórios / Tray

As imagens e nomes comerciais pertencem aos respectivos titulares. Uso educativo, sem patrocínio ou afiliação; verificar termos de uso antes de redistribuir as fotos em outros projetos.

## Pagamento V3: maquininha e dinheiro
- **Pix:** na tela de uma maquininha estilizada, com QR puramente decorativo e não escaneável; confirmação simulada manual.
- **Cartão:** terminal com teclado estilizado, débito/crédito, cartão virtual e animação de aproximação. Sem números ou senhas reais.
- **Dinheiro:** representação de notas recebidas na mão (R$ 2–200), soma de cédulas, entrada manual e cálculo do troco.
- O recibo mostra a forma de pagamento, sempre como "SIMULAÇÃO — SEM VALOR FISCAL".

## Novos produtos
O catálogo possui **45 produtos e serviços didáticos**: novos óleos Shell Helix HX3, HX6, HX7, Ultra e Hybrid, Rimula e fluidos, além de bebidas Coca-Cola, Sprite, Fanta, Kuat, Red Bull, Del Valle, água Crystal, KitKat, Doritos, Lay's, Ruffles, Oreo, Club Social, Trident, Halls, café e pão de queijo. Os nomes são de produtos/linhas reais com links para as referências de fabricantes; preços e operações são fictícios. Mais opções aparecem ao clicar na conveniência e na troca de óleo 3D.

## Dispositivos
O layout funciona com CSS responsivo para telas de smartphone, tablet, notebook e desktop; movimentação por toque ou teclado. Renderização 3D depende de WebGL. Imagens externas de produtos têm fallback.


## Visual e câmera V4
- **Posto mais detalhado:** chão com texturas procedurais leves, pavimentação, demarcação de vagas, passarela de pedestres, ralos, meio-fios, frisos, painéis luminosos, iluminação dia/noite, sombras suaves nos aparelhos que suportam, displays nas bombas e dois veículos.
- **PC no caixa:** monitor de PDV, teclado, impressora e maquininha, construídos no próprio Three.js.
- **Maquininha na pista:** terminal instalado junto ao pátio; aproxime-se com o frentista e pressione **E** ou clique na marcação em vista 3D para abrir o processo de pagamento fictício, desde que haja produtos no carrinho.
- **Câmera:** vista orbitável na visita; em modo frentista, arraste mouse/toque para girar a câmera, role a roda para aproximar/afastar, pressione **V** para alternar entre 1ª e 3ª pessoa. WASD e setas acompanham a orientação da câmera.
- **Tela cheia:** botão na barra do cenário (ou tecla **F** fora dos campos de texto), com Fullscreen API quando disponível e alternativa CSS em navegadores sem a API. A cena, HUD e controles permanecem visíveis.
- **Qualidade:** escolha Automático, Mais detalhes ou Econômico. O modo automático reduz custo gráfico em dispositivos com tela pequena ou poucos núcleos; preserva compatibilidade com PC/notebook e celular.

O desenho 3D permanece uma representação estilizada do posto, **não uma réplica exata de uma unidade real**. Fotos de produtos e Three.js são recursos externos sujeitos à disponibilidade da conexão.


## Simulação V5 — posto brasileiro e bairro animado
O posto tem 3 bombas físicas com 6 bicos: bomba flex (comum, aditivada e etanol), diesel (S10 e S500) e premium (Racing), com seleção de bico no modo frentista. As seis opções continuam cadastradas individualmente no PDV.

A conveniência tem interior acessível com porta de correr, piso, refrigeradores, prateleiras e PC de caixa com maquininha. A troca de óleo inclui elevador, veículo em manutenção, bancada e coletor de óleo. O bairro recebeu ruas, edifícios, árvores, ponto de ônibus, nuvens, veículos e pedestres animados. Há redução de FPS nas animações para poupar energia e pausa fora da tela.

No modo frentista, o carro chega, apresenta pedido por litros, valor em reais ou tanque completo; o jogador escolhe o bico, abastece, conclui pagamento e libera o veículo para sair. O caixa na loja usa uma interface de treinamento original inspirada em PDVs brasileiros, sem cópia de produtos comerciais.

O terminal fictício inclui cartão por inserção ou aproximação, sucesso/erros aleatórios ou forçados (instrutor), Pix demonstrativo e dinheiro usando as cédulas e moedas brasileiras. Nota a prazo salva conta a receber local com vencimento, limite didático por cliente e baixa fictícia. No caixa prático são usadas moedas de 5, 10, 25 e 50 centavos e R$ 1. O histórico 1 centavo não é usado nos atendimentos. Consulte Banco Central: https://www.bcb.gov.br/cedulasemoedas/moedasemitidas . Tudo é simulado e não é pagamento nem documento fiscal.


## V6 — tráfego orientado pelo mapa, rodas e bairro
- Corrigido o giro das rodas: cada pneu/roda tem pivô no **eixo Z local**, com rotação equivalente à distância percorrida e ao raio do pneu. A malha cilíndrica é orientada uma única vez.
- Frota ambiente aleatória (carros, hatchbacks, SUVs, picapes, vans e micro-ônibus), em **12 rotas dirigidas por faixas reais**, incluindo curvas suaves e entrada e saída do mapa pelas bordas.
- O trânsito considera semáforos com ciclos alternados por direção, desaceleração, distância mínima entre carros e luzes de freio/setas. A fila do posto utiliza o mesmo cálculo de orientação e giro das rodas.
- Configuração de trânsito: **Leve / Normal / Intenso**. No PC, os limites são aproximadamente 6/13/17 veículos; em aparelhos limitados, 4/7/10.
- Vista **Bairro**, mais cruzamentos com faixas de pedestres, linha de parada, calçadas, estacionamentos, placas de direção e velocidade, paradas de ônibus, lojas e mobiliário urbano. O chão do bairro foi estendido para eliminar o vazio branco.
- Moeda de 1 centavo **excluída do caixa prático**, permanecendo apenas moedas de R$ 0,05, R$ 0,10, R$ 0,25, R$ 0,50 e R$ 1. Para não exigir troco inviável, o sistema aplica **desconto ao cliente em espécie de 0 a 4 centavos**, deixando o valor de pagamento múltiplo de cinco centavos e registrando o ajuste no comprovante. Cartão, Pix e prazo mantêm o total integral. A moeda de 1 centavo continua válida legalmente, mas deixou de ser produzida em 2004 (Banco Central: https://www.bcb.gov.br/cedulasemoedas/moedasemitidas).


## V7 — EcoPosto como simulador operacional de posto brasileiro

### Ciclo do cliente e abastecimento
1. O carro chega pela entrada do posto, estaciona junto à ilha correta e o cliente desce.
2. Selecione a ilha física e o bico solicitado. O sistema avisa quando a escolha é incorreta.
3. Configure a bomba em **litros**, **valor em reais** ou **completar tanque**.
4. Confira a capacidade livre do veículo e o saldo do estoque subterrâneo didático.
5. Marque motor desligado, encaixe o bico e inicie a operação. A mangueira aparece no mundo 3D conectada à tampa do veículo.
6. Ritmo do treinamento: 1× (vazão de referência didática), 3× (padrão) e 6× (rápido). Pausa, retomada e finalização parcial estão disponíveis.
7. Pare a bomba, retire o bico e registre os litros no PDV. Litros já abastecidos não podem ser manualmente alterados no caixa durante o modo frentista.
8. Receba pelo meio fictício escolhido. Somente após o pagamento registre a liberação do veículo; o cliente entra no carro e ele sai animadamente.

### Administração de estoque e turno
- O botão **Operação do posto** abre controle dos seis tanques de combustível, saldo, capacidade e alerta de reposição.
- A entrega de caminhão-tanque é simulada, valida a capacidade máxima e guarda o histórico apenas neste navegador.
- Produtos físicos de conveniência e lubrificantes têm estoque unitário por SKU; o caixa rejeita venda acima do saldo e a baixa acontece após a venda fictícia. Serviços não têm limite de estoque.
- O fechamento de turno registra litros, vendas, faturamento fictício por dinheiro, Pix, cartão e prazo, ocorrências e satisfação do atendimento.
- Os dados são armazenados localmente no navegador. Não há sincronização multiusuário, integração fiscal, bancária ou medição certificada.

### Cenário visual e dispositivos
- Porta do cliente e tampa de combustível animadas; personagem e cliente têm movimento de braços e pernas.
- Clima ensolarado, nublado e chuvoso. Na chuva há partículas leves, névoa e alteração visual do asfalto; o modo noite liga os faróis e altera a iluminação.
- Tráfego nas 12 rotas, opções de densidade, carros e micro-ônibus aleatórios, semáforos, painel 3D e interior transitável.
- O cenário é geométrico/estilizado com qualidade escalável, para continuar utilizável em mobile e computadores modestos.

### O que é e não é fiel à realidade
- A Resolução ANP nº 948/2023 determina **duas casas decimais** no preço por litro no painel e nas bombas (art. 22): https://www.gov.br/anp/pt-br/acesso-a-informacao/perguntas-frequentes/precos-e-defesa-da-concorrencia/precos .
- Combustíveis, procedimentos, denominações, estoque e formas de venda usam conceitos do varejo brasileiro, mas **preços, vazões, capacidades, veículos, funcionários e documentos são de treinamento**.
- Os limites de tanque e fluxo são parâmetros didáticos; não representam a medição calibrada de uma bomba real. Não é curso de segurança operacional certificado nem comprovação de conformidade regulatória, técnica ou ambiental.
- O caixa prático usa moedas de 5, 10, 25, 50 centavos e 1 real. A moeda de 1 centavo, embora tenha validade legal, não é utilizada no exercício: o pagamento em espécie aplica desconto favorável de até quatro centavos.
- Nenhuma transação Pix/cartão é real, e o comprovante declara que não tem valor fiscal. Não digite dados bancários reais.

### Testes
O CI executa testes unitários de regras e regressões e um teste de interface com Chromium headless (WebGL, movimentação, estoque, clima e pagamento simulado). Se o navegador falhar, um screenshot é anexado aos artefatos do workflow.


## V8 — mapa sem calçada sobre rua e trânsito com anticolisão

- Corrigida a malha do pátio: a base de concreto terminava por cima da faixa de rolamento. O concreto agora se encerra antes do asfalto, e a rua de acesso foi prolongada até conectar as duas vias laterais.
- Os passeios elevados dos lados foram divididos para **não atravessar as pistas**. Há um intervalo livre de passeio na entrada e saída do posto.
- Removidos os dois veículos decorativos que ficavam permanentemente no corredor de circulação. Os veículos estacionados restantes usam baias separadas atrás da loja, **fora das rotas animadas**.
- A IA do trânsito passou a comparar **retângulos orientados (SAT/OBB)** de carrocerias e prever veículos à frente e em curvas. Um veículo desacelera ou para para evitar aproximações físicas, respeita os sinais, e usa prioridade exclusiva nos cruzamentos.
- Bloqueios persistentes por outros veículos acionam recuperação após 28 segundos em vez de deixar a simulação travada. Não se trata de simulação de física de acidentes; a intenção é evitar interpenetração e congestionamentos sem saída.
- O carro do cliente é detectado pelo trânsito ambiente, e também cede passagem aos veículos que cruzam seu caminho.
- Novos modelos de **motocicleta** integram a frota aleatória. Também há trabalhadores animados na loja e na oficina, bicicletas junto ao ponto e mais perfis de pedestres nos passeios.
- O mostrador de trânsito apresenta número de veículos e pedestres, e nos detalhes informa aproximações evitadas e bloqueios recuperados. A contagem e densidade se ajustam para mobile.
- Testes adicionais cobrem a geometria dos passeios, colisões de carroceria, cruzamentos, ausência dos modelos fixos na passagem e amostragem da pista no navegador.

Esta atualização prioriza estabilidade, clareza visual e coerência de circulação. Ainda não é um simulador certificado de trânsito ou de operação de posto de combustíveis.

A V8 também interrompe os passeios longitudinais antes da avenida principal (faixa z=6,75–17,65), que na versão anterior tinham superfície elevada sobre a rua. A entrada e saída do posto têm asfalto contínuo sem veículo decorativo bloqueando as passagens.
