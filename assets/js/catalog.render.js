/**
 * Renderização do Catálogo
 * Gerencia exibição de produtos e interações
 */

const CatalogRender = {
  config: null,

  /**
   * Renderiza produtos no grid
   * @param {Array} produtos 
   */
  renderizarProdutos(produtos) {
    const grid = document.getElementById('produtosGrid');
    
    if (!grid) return;

    if (produtos.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <p>Nenhum produto encontrado</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = produtos.map(produto => this.criarCardProduto(produto)).join('');
    
    // Adicionar event listeners
    this.configurarEventListeners();
  },

  /**
   * Cria HTML do card de produto
   * @param {object} produto 
   * @returns {string}
   */
  criarCardProduto(produto) {
    const parcelasTexto = this.config.parcelasSemJuros > 1 
      ? `ou ${this.config.parcelasSemJuros}x sem juros` 
      : '';

    return `
      <div class="produto-card" data-produto-id="${produto.id}">
        <div class="produto-imagem">
          <img src="${produto.imagemUrl}" alt="${produto.nome}" loading="lazy">
        </div>
        <div class="produto-info">
          <span class="produto-marca">${produto.marca}</span>
          <h3 class="produto-nome">${produto.nome}</h3>
          
          <div class="produto-precos">
            <div class="preco-item">
              <span class="preco-label">💳 Cartão</span>
              <span class="preco-valor">R$ ${this.formatarPreco(produto.precoCartao)}</span>
              ${parcelasTexto ? `<small class="parcelas-info">${parcelasTexto}</small>` : ''}
            </div>
            <div class="preco-item destaque">
              <span class="preco-label">💰 PIX</span>
              <span class="preco-valor">R$ ${this.formatarPreco(produto.precoPix)}</span>
            </div>
          </div>

          <div class="produto-tamanhos">
            <label>Tamanho:</label>
            <div class="tamanhos-opcoes">
              ${produto.tamanhos.map(tamanho => `
                <label class="tamanho-radio">
                  <input type="radio" name="tamanho-${produto.id}" value="${tamanho}">
                  <span>${tamanho}</span>
                </label>
              `).join('')}
            </div>
          </div>

          <div class="produto-pagamento">
            <label>Forma de Pagamento:</label>
            <div class="pagamento-opcoes">
              <label class="pagamento-radio">
                <input type="radio" name="pagamento-${produto.id}" value="pix" checked>
                <span>💰 PIX - R$ ${this.formatarPreco(produto.precoPix)}</span>
              </label>
              <label class="pagamento-radio">
                <input type="radio" name="pagamento-${produto.id}" value="cartao">
                <span>💳 Cartão - R$ ${this.formatarPreco(produto.precoCartao)}</span>
              </label>
            </div>
          </div>

          <button class="btn-whatsapp" onclick="CatalogRender.enviarWhatsApp('${produto.id}')">
            📱 Comprar no WhatsApp
          </button>
        </div>
      </div>
    `;
  },

  /**
   * Formata preço para exibição
   * @param {number} preco 
   * @returns {string}
   */
  formatarPreco(preco) {
    return parseFloat(preco).toFixed(2).replace('.', ',');
  },

  /**
   * Configura event listeners dos cards
   */
  configurarEventListeners() {
    // Atualizar preço ao mudar forma de pagamento
    document.querySelectorAll('.pagamento-radio input').forEach(radio => {
      radio.addEventListener('change', (e) => {
        const card = e.target.closest('.produto-card');
        const produtoId = card.dataset.produtoId;
        // Apenas visual, o preço já está no label
      });
    });
  },

  /**
   * Envia pedido via WhatsApp
   * @param {string} produtoId 
   */
  async enviarWhatsApp(produtoId) {
    const card = document.querySelector(`[data-produto-id="${produtoId}"]`);
    
    if (!card) return;

    // Obter tamanho selecionado
    const tamanhoRadio = card.querySelector(`input[name="tamanho-${produtoId}"]:checked`);
    if (!tamanhoRadio) {
      alert('Por favor, selecione um tamanho');
      return;
    }

    // Obter forma de pagamento
    const pagamentoRadio = card.querySelector(`input[name="pagamento-${produtoId}"]:checked`);
    const formaPagamento = pagamentoRadio.value === 'pix' ? 'PIX' : 'Cartão';

    // Obter dados do produto
    const nome = card.querySelector('.produto-nome').textContent;
    const marca = card.querySelector('.produto-marca').textContent;
    const tamanho = tamanhoRadio.value;
    
    // Obter preço baseado na forma de pagamento
    const precoText = pagamentoRadio.parentElement.querySelector('.pagamento-radio span').textContent;
    const preco = precoText.match(/R\$ ([\d,]+)/)[1];
    const valorNumerico = parseFloat(preco.replace(',', '.'));

    // Usar mensagem personalizada com variáveis
    let mensagem = this.config.mensagemPadrao;
    
    // Substituir variáveis
    mensagem = mensagem
      .replace(/{produto}/g, nome)
      .replace(/{marca}/g, marca)
      .replace(/{tamanho}/g, tamanho)
      .replace(/{pagamento}/g, formaPagamento)
      .replace(/{valor}/g, preco);

    // Registrar métrica
    await DataService.registrarCliqueWhatsApp({
      produtoId,
      produtoNome: nome
    });

    // Tracking - Facebook Pixel e GTM
    if (window.TrackingService) {
      TrackingService.trackWhatsAppClick({
        nome: nome,
        marca: marca,
        tamanho: tamanho,
        pagamento: formaPagamento,
        valor: valorNumerico
      });
    }

    // Abrir WhatsApp
    const whatsappUrl = `https://wa.me/${this.config.whatsapp}?text=${encodeURIComponent(mensagem)}`;
    window.open(whatsappUrl, '_blank');
  },

  /**
   * Define configuração
   * @param {object} config 
   */
  setConfig(config) {
    this.config = config;
  },

  /**
   * Mostra estado de carregamento
   */
  mostrarLoading() {
    const grid = document.getElementById('produtosGrid');
    if (grid) {
      grid.innerHTML = `
        <div class="loading-state">
          <div class="loading-spinner"></div>
          <p>Carregando produtos...</p>
        </div>
      `;
    }
  }
};

// Exportar
window.CatalogRender = CatalogRender;