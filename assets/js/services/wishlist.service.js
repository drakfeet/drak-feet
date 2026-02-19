/**
 * Wishlist Service
 */

const WishlistService = {
  items: [],
  config: {},
  storageKey: 'wishlist_v1',
  _bound: false,

  init() {
    this.load();
    this.bindEvents();
    this.updateUI();
    console.info('WishlistService ready');
  },

  setConfig(config = {}) {
    this.config = config || {};
    this.updateUI();
  },

  bindEvents() {
    if (this._bound) return;

    const container = document.getElementById('wishlistItems');
    const btnShare = document.getElementById('btnShareWishlist');

    if (container) {
      container.addEventListener('click', (event) => {
        const button = event.target.closest('button[data-action="wishlist-remove"][data-produto-id]');
        if (!button) return;
        this.removeItem(button.dataset.produtoId);
      });
    }

    if (btnShare) {
      btnShare.addEventListener('click', () => {
        this.shareWhatsApp();
      });
    }

    this._bound = true;
  },

  load() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      this.items = Array.isArray(parsed) ? parsed : [];
    } catch {
      this.items = [];
    }
  },

  save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.items));
    } catch {
      // noop
    }
  },

  has(produtoId) {
    return this.items.some(item => String(item.produtoId) === String(produtoId));
  },

  toggleItem(produto) {
    if (!produto || !produto.id) return;
    if (this.has(produto.id)) {
      this.removeItem(produto.id);
      if (window.InlineAlert) InlineAlert.show('Produto removido da wishlist.', 'info');
      return;
    }

    this.items.unshift({
      produtoId: produto.id,
      nome: produto.nome || '',
      marca: produto.marca || '',
      categoria: produto.categoria || '',
      imagemUrl: produto.imagemUrl || '',
      precoPix: Number(produto.precoPix || 0),
      precoCartao: Number(produto.precoCartao || 0),
      timestamp: Date.now()
    });

    this.save();
    this.updateUI();

    if (window.InlineAlert) InlineAlert.show('Produto adicionado na wishlist.', 'success');
  },

  removeItem(produtoId) {
    this.items = this.items.filter(item => String(item.produtoId) !== String(produtoId));
    this.save();
    this.updateUI();
    if (window.CatalogRender && typeof CatalogRender.renderizarPorCategorias === 'function') {
      CatalogRender.renderizarPorCategorias(CatalogRender.produtosTodos || []);
    }
  },

  syncWithCatalog(produtos = []) {
    if (!Array.isArray(produtos) || produtos.length === 0 || this.items.length === 0) return;

    const produtosMap = new Map(produtos.map(p => [String(p.id), p]));
    let changed = false;

    this.items = this.items
      .map(item => {
        const ref = produtosMap.get(String(item.produtoId));
        if (!ref) return item;

        const next = {
          ...item,
          nome: ref.nome || item.nome,
          marca: ref.marca || item.marca,
          categoria: ref.categoria || item.categoria,
          imagemUrl: ref.imagemUrl || item.imagemUrl,
          precoPix: Number(ref.precoPix || item.precoPix || 0),
          precoCartao: Number(ref.precoCartao || item.precoCartao || 0)
        };

        if (
          next.nome !== item.nome ||
          next.marca !== item.marca ||
          next.categoria !== item.categoria ||
          next.imagemUrl !== item.imagemUrl ||
          next.precoPix !== item.precoPix ||
          next.precoCartao !== item.precoCartao
        ) {
          changed = true;
        }

        return next;
      });

    if (changed) {
      this.save();
      this.updateUI();
    }
  },

  updateUI() {
    this.renderBadge();
    this.renderItems();
  },

  renderBadge() {
    const badge = document.getElementById('wishlistBadge');
    if (!badge) return;

    const total = this.items.length;
    badge.textContent = String(total);
    badge.style.display = total > 0 ? 'flex' : 'none';
  },

  renderItems() {
    const list = document.getElementById('wishlistItems');
    const shareBtn = document.getElementById('btnShareWishlist');
    if (!list) return;

    if (this.items.length === 0) {
      list.innerHTML = `
        <div class="wishlist-empty">
          <p>Sua wishlist está vazia</p>
          <small>Toque no coração dos produtos para salvar aqui.</small>
        </div>
      `;
      if (shareBtn) shareBtn.disabled = true;
      return;
    }

    list.innerHTML = this.items.map(item => {
      const nome = DomUtils.escapeHtml(item.nome || 'Produto');
      const marca = DomUtils.escapeHtml(item.marca || '');
      const imagem = DomUtils.sanitizeUrl(item.imagemUrl || '');
      const preco = item.precoPix > 0 ? `R$ ${this.formatPrice(item.precoPix)}` : '';

      return `
        <article class="wishlist-item">
          <img src="${imagem}" alt="${nome}" class="wishlist-item-image">
          <div class="wishlist-item-info">
            <h4>${nome}</h4>
            <p>${marca}</p>
            <strong>${preco}</strong>
          </div>
          <button class="wishlist-remove" data-action="wishlist-remove" data-produto-id="${item.produtoId}" aria-label="Remover da wishlist">✖</button>
        </article>
      `;
    }).join('');

    if (shareBtn) shareBtn.disabled = false;
  },

  shareWhatsApp() {
    if (this.items.length === 0) {
      if (window.InlineAlert) InlineAlert.show('Adicione itens na wishlist antes de compartilhar.', 'warning');
      return;
    }

    const message = this.generateWhatsAppMessage();
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  },

  generateWhatsAppMessage() {
    const itens = this.items.map((item, index) => {
      const nome = String(item.nome || 'Produto').trim();
      const marca = String(item.marca || '').trim();
      const preco = item.precoPix > 0 ? `R$ ${this.formatPrice(item.precoPix)}` : 'sem preço';
      return `${index + 1}. ${nome} - ${marca} (${preco})`;
    }).join('\n');

    return `Olá! Quero compartilhar minha wishlist:\n\n${itens}`;
  },

  formatPrice(value) {
    return Number(value || 0).toFixed(2).replace('.', ',');
  }
};

window.WishlistService = WishlistService;
