# EcoPosto 3D — simulador educativo

Um posto de combustíveis interativo em **3D real (WebGL)**, com catálogo de produtos existentes no mercado brasileiro e um ponto de venda **inteiramente fictício** para treinamento. Feito com HTML, CSS e JavaScript, sem build e sem backend.

## O que já funciona

- Maquete 3D do posto: bombas de combustíveis, loja, área de serviços, carro, árvores e cobertura com painéis solares
- Giro por mouse/toque, zoom e atalhos de câmera, com renderização sob demanda
- Catálogo por categoria com busca e explicação de cada item, além de links para fontes
- PDV com produtos, litros, unidades, totalização em centavos e carrinho salvo localmente
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

## Conteúdo e créditos

Produtos como Original Gasolina, linha Ipimax e Ipiranga F1 Master são marcas reais usadas **sem afiliação ou patrocínio**. Os itens aparecem como referências educativas, sem logotipos oficiais. Exemplos de conveniência e serviços completam a simulação; consulte sempre rótulos, manuais e documentação técnica antes de uso.

Fontes de referência:
- [Combustíveis e linha Ipimax — Ipiranga](https://www.ipiranga.com.br/wps/portal/pt-br/ipiranga/produtos/combustiveis/nossos-produtos/)
- [Lubrificantes Ipiranga](https://www.ipiranga.com.br/wps/portal/pt-br/ipiranga/blog-ipiranga/categorias/lubrificantes/o-que-e-viscosidade-do-oleo)
- [Manual técnico de Diesel — Petrobras](https://petrobras.com.br)
- Sites oficiais das marcas citadas no catálogo

O arquivo LICENSE do repositório estabelece AGPL-3.0. O projeto é uma criação original, não uma cópia do simulador em Canva.
