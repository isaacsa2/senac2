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
