/**
 * Renderização do Catálogo
 * Gerencia exibição de produtos e interações
 */

const CatalogRender = {
  config: null,
  produtosTodos: [],
  categoriaAtual: 'todas',

  /**
   * Renderiza produtos organizados por categoria
   * @param {Array} produtos 
   */
  renderizarPorCategorias(produtos) {
    this.produtosTodos = produtos;
    const container = document.getElementById('produtosPorCategoria');
    
    if (!container) return;

    if (produtos.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>Nenhum produto encontrado</p>
        </div>
      `;
      return;
    }

    // Agrupar produtos por categoria
    const produtosPorCategoria = this.agruparPorCategoria(produtos);

    // Renderizar menu de categorias
    this.renderizarMenuCategorias(produtosPorCategoria);

    // Renderizar seções
    let html = '';
    
    if (this.categoriaAtual === 'todas') {
      // Mostrar todas as categorias
      for (const [categoria, prods] of Object.entries(produtosPorCategoria)) {
        html += this.criarSecaoCategoria(categoria, prods);
      }
    } else {
      // Mostrar apenas categoria selecionada
      const prods = produtosPorCategoria[this.categoriaAtual];
      if (prods && prods.length > 0) {
        html += this.criarSecaoCategoria(this.categoriaAtual, prods);
      }
    }

    container.innerHTML = html;
    this.configurarEventListeners();
  },

  /**
   * Agrupa produtos por categoria
   * @param {Array} produtos 
   * @returns {Object}
   */
  agruparPorCategoria(produtos) {
    const agrupados = {};
    
    produtos.forEach(produto => {
      const categoria = produto.categoria || 'Sem Categoria';
      if (!agrupados[categoria]) {
        agrupados[categoria] = [];
      }
      agrupados[categoria].push(produto);
    });

    return agrupados;
  },

  /**
   * Renderiza menu de categorias
   * @param {Object} produtosPorCategoria 
   */
  renderizarMenuCategorias(produtosPorCategoria) {
    const menu = document.getElementById('menuCategorias');
    if (!menu) return;

    const categorias = Object.keys(produtosPorCategoria);
    
    // Usar categorias do menu de config ou das próprias categorias dos produtos
    let categoriasMenu = [];
    
    if (this.config?.menuCategorias && this.config.menuCategorias.length > 0) {
      categoriasMenu = this.config.menuCategorias;
    } else {
      categoriasMenu = categorias;
    }

    const scrollDiv = menu.querySelector('.categorias-scroll');
    
    // Manter botão "Todas"
    const btnTodas = scrollDiv.querySelector('[data-categoria="todas"]');
    
    // Adicionar categorias
    const categoriasHtml = categoriasMenu.map(cat => `
      <button class="categoria-item" data-categoria="${cat}">
        ${cat}
      </button>
    `).join('');
    
    scrollDiv.innerHTML = btnTodas.outerHTML + categoriasHtml;

    // Event listeners
    scrollDiv.querySelectorAll('.categoria-item').forEach(btn => {
      btn.addEventListener('click', () => {
        scrollDiv.querySelectorAll('.categoria-item').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        this.categoriaAtual = btn.dataset.categoria;
        this.renderizarPorCategorias(this.produtosTodos);
      });
    });
  },

  /**
   * Cria seção de categoria
   * @param {string} categoria 
   * @param {Array} produtos 
   * @returns {string}
   */
  criarSecaoCategoria(categoria, produtos) {
    return `
      <div class="categoria-secao">
        <h3 class="categoria-titulo">${categoria}</h3>
        <div class="produtos-grid">
          ${produtos.map(p => this.criarCardProduto(p)).join('')}
        </div>
      </div>
    `;
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
    // Listener para filtros mobile
    const btnFiltros = document.getElementById('btnFiltrosMobile');
    const sidebar = document.getElementById('filtrosSidebar');
    const overlay = document.getElementById('filtrosOverlay');
    const btnFechar = document.getElementById('btnFecharFiltros');

    if (btnFiltros) {
      btnFiltros.addEventListener('click', () => {
        sidebar.classList.add('active');
        overlay.classList.add('active');
      });
    }

    if (btnFechar) {
      btnFechar.addEventListener('click', () => {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
      });
    }

    if (overlay) {
      overlay.addEventListener('click', () => {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
      });
    }
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

    // Tracking - Facebook Pixel, GTM e GA
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
    const container = document.getElementById('produtosPorCategoria');
    if (container) {
      container.innerHTML = `
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