/**
 * Cart Service
 */

const CartService = {
  items: [],
  maxItems: 50,
  notes: '',
  deliveryType: null,
  deliveryOptions: [],
  deliveryConfig: {},
  couponCatalog: [],
  promotionCatalog: [],
  appliedCouponCode: '',
  _itemEventsBound: false,
  _notesBound: false,
  _couponEventsBound: false,
  storageKey: 'cart_v2',
  legacyStorageKey: 'cart',
  clientIdKey: 'catalogo_cliente_id',
  completedOrdersKey: 'catalogo_completed_orders',
  couponUsageKey: 'catalogo_coupon_usage',

  init() {
    this.loadFromStorage();
    this.bindItemActions();
    this.bindNotesInput();
    this.bindCouponActions();
    this.updateCartUI();
    console.info('CartService ready');
  },

  bindItemActions() {
    if (this._itemEventsBound) return;
    const container = document.getElementById('cartItems');
    if (!container) return;

    container.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-action][data-item-id]');
      if (!button) return;
      const itemId = button.dataset.itemId;
      if (!itemId) return;

      if (button.dataset.action === 'remove-item') {
        this.removeItem(itemId);
        return;
      }

      if (button.dataset.action === 'change-qty') {
        const qty = Number(button.dataset.qty || 0);
        if (!Number.isFinite(qty)) return;
        this.updateQuantity(itemId, qty);
      }
    });

    this._itemEventsBound = true;
  },

  bindNotesInput() {
    if (this._notesBound) return;
    const textarea = document.getElementById('cartObservacoes');
    if (!textarea) return;
    textarea.addEventListener('input', () => {
      this.notes = textarea.value;
      this.saveToStorage();
    });
    this._notesBound = true;
  },

  bindCouponActions() {
    if (this._couponEventsBound) return;

    const input = document.getElementById('cartCouponInput');
    const applyBtn = document.getElementById('btnApplyCoupon');
    const removeBtn = document.getElementById('btnRemoveCoupon');

    if (applyBtn) {
      applyBtn.addEventListener('click', () => {
        const code = input ? input.value : '';
        this.applyCoupon(code);
      });
    }

    if (removeBtn) {
      removeBtn.addEventListener('click', () => {
        this.removeCoupon();
      });
    }

    if (input) {
      input.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter') return;
        event.preventDefault();
        this.applyCoupon(input.value);
      });
    }

    this._couponEventsBound = true;
  },

  loadFromStorage() {
    try {
      const saved = localStorage.getItem(this.storageKey) || localStorage.getItem(this.legacyStorageKey);
      if (!saved) return;

      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        this.items = parsed;
        this.notes = '';
        this.deliveryType = null;
        this.appliedCouponCode = '';
        return;
      }

      if (parsed && typeof parsed === 'object') {
        this.items = Array.isArray(parsed.items) ? parsed.items : [];
        this.notes = String(parsed.notes || '');
        this.deliveryType = parsed.deliveryType || null;
        this.appliedCouponCode = this.normalizeCouponCode(parsed.appliedCouponCode || parsed.couponCode || '');
      }
    } catch (error) {
      console.warn('Failed to load cart:', error);
      this.items = [];
      this.notes = '';
      this.deliveryType = null;
      this.appliedCouponCode = '';
    }
  },

  saveToStorage() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify({
        items: this.items,
        notes: this.notes,
        deliveryType: this.deliveryType,
        appliedCouponCode: this.appliedCouponCode
      }));
    } catch (error) {
      console.warn('Failed to save cart:', error);
    }
  },

  setCouponOptions(config = {}) {
    this.couponCatalog = Array.isArray(config.cupons) ? config.cupons : [];
    this.updateCartUI();
  },

  setPromotionOptions(config = {}) {
    this.promotionCatalog = Array.isArray(config.promocoes) ? config.promocoes : [];
    this.updateCartUI();
  },

  addItem(produto, tamanho, pagamento, preco) {
    if (this.items.length >= this.maxItems) {
      if (window.InlineAlert) {
        InlineAlert.show(`Limite de ${this.maxItems} itens no carrinho atingido.`, 'warning');
      }
      return false;
    }

    const item = {
      id: `${produto.id}-${tamanho}-${pagamento}`,
      produtoId: produto.id,
      nome: produto.nome,
      marca: produto.marca,
      categoria: produto.categoria || '',
      imagem: produto.imagemUrl,
      tamanho,
      pagamento,
      preco,
      quantidade: 1,
      timestamp: Date.now()
    };

    const existingIndex = this.items.findIndex(i =>
      i.produtoId === produto.id &&
      i.tamanho === tamanho &&
      i.pagamento === pagamento
    );

    if (existingIndex >= 0) {
      this.items[existingIndex].quantidade += 1;
    } else {
      this.items.push(item);
    }

    this.saveToStorage();
    this.updateCartUI();
    this.showNotification('Produto adicionado ao carrinho!');
    return true;
  },

  removeItem(itemId) {
    this.items = this.items.filter(item => item.id !== itemId);
    this.saveToStorage();
    this.updateCartUI();
  },

  updateQuantity(itemId, quantidade) {
    if (quantidade <= 0) {
      this.removeItem(itemId);
      return;
    }

    const item = this.items.find(i => i.id === itemId);
    if (item) {
      item.quantidade = Math.min(quantidade, 10);
      this.saveToStorage();
      this.updateCartUI();
    }
  },

  clear() {
    this.items = [];
    this.notes = '';
    this.appliedCouponCode = '';
    this.saveToStorage();
    this.updateCartUI();
  },

  getTotalItems() {
    return this.items.reduce((sum, item) => sum + item.quantidade, 0);
  },

  getSubtotalValue() {
    if (this.items.length === 0) return 0;
    return this.items.reduce((sum, item) => sum + (Number(item.preco || 0) * Number(item.quantidade || 0)), 0);
  },

  getDeliveryFee() {
    if (this.deliveryType !== 'motoboy') return 0;
    return Number(this.deliveryConfig.taxaMotoboy || 0);
  },

  getDiscountValue() {
    return Number(this.getCombinedDiscountEvaluation().discount || 0);
  },

  getTotalValue() {
    const subtotal = this.getSubtotalValue();
    const total = subtotal + this.getDeliveryFee() - this.getDiscountValue();
    return Math.max(0, total);
  },

  updateCartUI() {
    const badge = document.getElementById('cartBadge');
    const cartTotal = document.getElementById('cartTotal');
    const cartSubtotal = document.getElementById('cartSubtotal');
    const cartDiscountAmount = document.getElementById('cartDiscountAmount');
    const cartDiscountRow = document.getElementById('cartDiscountRow');

    const totalItems = this.getTotalItems();
    const subtotal = this.getSubtotalValue();
    const discount = this.getDiscountValue();
    const total = this.getTotalValue();

    if (badge) {
      badge.textContent = totalItems;
      badge.style.display = totalItems > 0 ? 'flex' : 'none';
    }

    if (cartSubtotal) {
      cartSubtotal.textContent = `R$ ${this.formatPrice(subtotal)}`;
    }

    if (cartTotal) {
      cartTotal.textContent = `R$ ${this.formatPrice(total)}`;
    }

    if (cartDiscountAmount) {
      cartDiscountAmount.textContent = `- R$ ${this.formatPrice(discount)}`;
    }

    if (cartDiscountRow) {
      cartDiscountRow.style.display = discount > 0 ? 'flex' : 'none';
    }

    this.renderCouponUI();
    this.renderDeliveryFee();
    this.renderCartItems();
    this.syncNotesUI();
  },

  syncNotesUI() {
    const textarea = document.getElementById('cartObservacoes');
    if (!textarea) return;
    if (textarea.value !== this.notes) {
      textarea.value = this.notes || '';
    }
  },

  applyCoupon(rawCode) {
    const code = this.normalizeCouponCode(rawCode);
    if (!code) {
      this.setCouponFeedback('Digite um cupom válido.', 'warning');
      return;
    }

    this.appliedCouponCode = code;
    const evaluation = this.getCouponEvaluation();

    if (!evaluation.valid) {
      this.appliedCouponCode = '';
      this.saveToStorage();
      this.updateCartUI();
      this.setCouponFeedback(evaluation.message || 'Cupom inválido.', 'error');
      return;
    }

    this.saveToStorage();
    this.updateCartUI();
    this.setCouponFeedback(`Cupom ${evaluation.displayCode} aplicado.`, 'success');
  },

  removeCoupon() {
    this.appliedCouponCode = '';
    this.saveToStorage();
    this.updateCartUI();
    this.setCouponFeedback('Cupom removido.', 'info');
  },

  getCouponByCode(code) {
    const normalized = this.normalizeCouponCode(code);
    if (!normalized) return null;

    return this.couponCatalog.find(coupon => {
      const couponCode = this.normalizeCouponCode(coupon.codigo || coupon.code || '');
      return couponCode === normalized;
    }) || null;
  },

  getCouponEvaluation() {
    if (!this.appliedCouponCode) {
      return { valid: false, discount: 0, message: '' };
    }

    const coupon = this.getCouponByCode(this.appliedCouponCode);
    if (!coupon) {
      return { valid: false, discount: 0, message: 'Cupom não encontrado.' };
    }

    if (coupon.ativo === false) {
      return { valid: false, discount: 0, message: 'Cupom inativo.' };
    }

    const subtotal = this.getSubtotalValue();
    const totalItems = this.getTotalItems();
    const deliveryFee = this.getDeliveryFee();
    const now = Date.now();
    const displayCode = this.normalizeCouponCode(coupon.codigo || coupon.code || this.appliedCouponCode);

    if (subtotal <= 0 || totalItems <= 0) {
      return { valid: false, discount: 0, message: 'Adicione itens para usar o cupom.', displayCode };
    }

    const startAt = this.parseDateValue(coupon.validadeInicio || coupon.inicio || coupon.inicioEm || coupon.validoDe);
    const endAt = this.parseDateValue(coupon.validadeFim || coupon.fim || coupon.fimEm || coupon.validoAte || coupon.validade, true);

    if (startAt && now < startAt) {
      return { valid: false, discount: 0, message: 'Cupom ainda não iniciou.', displayCode };
    }

    if (endAt && now > endAt) {
      return { valid: false, discount: 0, message: 'Cupom expirado.', displayCode };
    }

    const type = this.normalizeCouponType(coupon.tipo || coupon.type);
    if (type === 'primeira_compra' && this.getCompletedOrdersCount() > 0) {
      return { valid: false, discount: 0, message: 'Cupom válido apenas para primeira compra.', displayCode };
    }

    const totalUsageLimit = Number(coupon.limiteUso || coupon.limiteTotal || 0);
    if (totalUsageLimit > 0 && this.getCouponUsageTotal(displayCode) >= totalUsageLimit) {
      return { valid: false, discount: 0, message: 'Cupom atingiu o limite de uso.', displayCode };
    }

    const perClientLimit = Number(coupon.limitePorCliente || coupon.limiteCliente || 0);
    if ((type === 'por_cliente' || perClientLimit > 0) && perClientLimit > 0) {
      const usedByClient = this.getCouponUsageForClient(displayCode);
      if (usedByClient >= perClientLimit) {
        return { valid: false, discount: 0, message: 'Você já atingiu o limite deste cupom.', displayCode };
      }
    }

    const regras = coupon.regras && typeof coupon.regras === 'object' ? coupon.regras : {};
    const subtotalMinimo = Number(coupon.subtotalMinimo || coupon.valorMinimoPedido || regras.subtotalMinimo || 0);
    if (subtotalMinimo > 0 && subtotal < subtotalMinimo) {
      return {
        valid: false,
        discount: 0,
        message: `Pedido mínimo para cupom: R$ ${this.formatPrice(subtotalMinimo)}.`,
        displayCode
      };
    }

    const itensMinimos = Number(coupon.itensMinimos || regras.itensMinimos || 0);
    if (itensMinimos > 0 && totalItems < itensMinimos) {
      return {
        valid: false,
        discount: 0,
        message: `Cupom exige pelo menos ${itensMinimos} item(ns).`,
        displayCode
      };
    }

    const entregaPermitida = Array.isArray(regras.entregaPermitida)
      ? regras.entregaPermitida.map(v => String(v || '').toLowerCase())
      : [];
    if (entregaPermitida.length > 0) {
      const entregaAtual = String(this.deliveryType || '').toLowerCase();
      if (!entregaAtual || !entregaPermitida.includes(entregaAtual)) {
        return { valid: false, discount: 0, message: 'Cupom indisponível para esta entrega.', displayCode };
      }
    }

    const pagamentosPermitidos = Array.isArray(regras.pagamentosPermitidos)
      ? regras.pagamentosPermitidos.map(v => String(v || '').toUpperCase())
      : [];
    if (pagamentosPermitidos.length > 0) {
      const pagamentosCarrinho = [...new Set(this.items.map(item => String(item.pagamento || '').toUpperCase()))];
      const pagamentosInvalidos = pagamentosCarrinho.filter(pag => !pagamentosPermitidos.includes(pag));
      if (pagamentosInvalidos.length > 0) {
        return { valid: false, discount: 0, message: 'Cupom inválido para a forma de pagamento escolhida.', displayCode };
      }
    }

    const eligibleItems = this.getEligibleItemsFromRules(regras);

    if (eligibleItems.length === 0) {
      return { valid: false, discount: 0, message: 'Cupom sem itens elegíveis no carrinho.', displayCode };
    }

    const eligibleSubtotal = eligibleItems.reduce((sum, item) => {
      return sum + (Number(item.preco || 0) * Number(item.quantidade || 0));
    }, 0);

    if (eligibleSubtotal <= 0) {
      return { valid: false, discount: 0, message: 'Cupom sem valor elegível.', displayCode };
    }

    const percentValue = Number(coupon.percentual || coupon.porcentagem || coupon.valorPercentual || coupon.valor || 0);
    const fixedValue = Number(coupon.valorFixo || coupon.valorDesconto || coupon.valor || 0);
    const maxDiscount = Number(coupon.descontoMaximo || regras.descontoMaximo || 0);
    let discount = 0;

    if (type === 'valor_fixo') {
      discount = fixedValue;
    } else {
      discount = eligibleSubtotal * (percentValue / 100);
    }

    if (maxDiscount > 0) {
      discount = Math.min(discount, maxDiscount);
    }

    discount = Math.max(0, Math.min(discount, eligibleSubtotal + deliveryFee));

    if (discount <= 0) {
      return { valid: false, discount: 0, message: 'Cupom não gera desconto neste pedido.', displayCode };
    }

    return {
      valid: true,
      discount,
      message: '',
      displayCode,
      coupon,
      type
    };
  },

  getPromotionEvaluation() {
    const promotions = Array.isArray(this.promotionCatalog) ? this.promotionCatalog : [];
    if (!promotions.length) {
      return { valid: false, discount: 0, message: '' };
    }

    const subtotal = this.getSubtotalValue();
    const totalItems = this.getTotalItems();
    const deliveryFee = this.getDeliveryFee();
    const now = Date.now();

    if (subtotal <= 0 || totalItems <= 0) {
      return { valid: false, discount: 0, message: '' };
    }

    const validPromotions = [];

    promotions.forEach((promotion) => {
      if (!promotion || promotion.ativo === false) return;

      const startAt = this.parseDateValue(promotion.validadeInicio || promotion.inicio || promotion.inicioEm);
      const endAt = this.parseDateValue(promotion.validadeFim || promotion.fim || promotion.fimEm, true);
      if (startAt && now < startAt) return;
      if (endAt && now > endAt) return;

      const regras = promotion.regras && typeof promotion.regras === 'object' ? promotion.regras : {};
      const subtotalMinimo = Number(promotion.subtotalMinimo || regras.subtotalMinimo || 0);
      if (subtotalMinimo > 0 && subtotal < subtotalMinimo) return;

      const entregaPermitida = Array.isArray(regras.entregaPermitida)
        ? regras.entregaPermitida.map((v) => String(v || '').toLowerCase())
        : [];
      if (entregaPermitida.length > 0) {
        const entregaAtual = String(this.deliveryType || '').toLowerCase();
        if (!entregaAtual || !entregaPermitida.includes(entregaAtual)) return;
      }

      const pagamentosPermitidos = Array.isArray(regras.pagamentosPermitidos)
        ? regras.pagamentosPermitidos.map((v) => String(v || '').toUpperCase())
        : [];
      if (pagamentosPermitidos.length > 0) {
        const pagamentosCarrinho = [...new Set(this.items.map((item) => String(item.pagamento || '').toUpperCase()))];
        const pagamentosInvalidos = pagamentosCarrinho.filter((pag) => !pagamentosPermitidos.includes(pag));
        if (pagamentosInvalidos.length > 0) return;
      }

      const eligibleItems = this.getEligibleItemsFromRules(regras);
      if (!eligibleItems.length) return;

      const eligibleSubtotal = eligibleItems.reduce((sum, item) => {
        return sum + (Number(item.preco || 0) * Number(item.quantidade || 0));
      }, 0);
      if (eligibleSubtotal <= 0) return;

      const type = this.normalizePromotionType(promotion.tipo || promotion.type);
      const percentValue = Number(promotion.percentual || promotion.porcentagem || promotion.valorPercentual || promotion.valor || 0);
      const fixedValue = Number(promotion.valorFixo || promotion.valorDesconto || promotion.valor || 0);
      const maxDiscount = Number(promotion.descontoMaximo || regras.descontoMaximo || 0);
      const totalQty = eligibleItems.reduce((sum, item) => sum + Number(item.quantidade || 0), 0);
      let discount = 0;

      if (type === 'valor_fixo') {
        discount = fixedValue;
      } else if (type === 'porcentagem' || type === 'loja_inteira_percentual') {
        discount = eligibleSubtotal * (percentValue / 100);
      } else if (type === 'compre_2_ou_mais') {
        const qtdMinima = Math.max(2, Number(regras.qtdMinima || 2));
        if (totalQty < qtdMinima) return;
        discount = eligibleSubtotal * (percentValue / 100);
      } else if (type === 'compre_1_leve_2') {
        const qtdPaga = Math.max(1, Math.trunc(Number(regras.qtdPaga || 1)));
        const qtdLeva = Math.max(2, Math.trunc(Number(regras.qtdLeva || 2)));
        if (qtdLeva <= qtdPaga) return;
        discount = this.getBuyXTakeYDiscount(eligibleItems, qtdPaga, qtdLeva);
      } else if (type === 'progressivo') {
        const percentualProgressivo = this.getProgressivePercent(totalQty, regras.niveisProgressivos);
        if (percentualProgressivo <= 0) return;
        discount = eligibleSubtotal * (percentualProgressivo / 100);
      } else {
        return;
      }

      if (maxDiscount > 0) {
        discount = Math.min(discount, maxDiscount);
      }
      discount = Math.max(0, Math.min(discount, eligibleSubtotal + deliveryFee));
      if (discount <= 0) return;

      validPromotions.push({
        promotion,
        discount,
        priority: Number(promotion.prioridade || 0),
        stackableWithCoupon: promotion.acumulavelComCupom === true
      });
    });

    if (!validPromotions.length) {
      return { valid: false, discount: 0, message: '' };
    }

    validPromotions.sort((a, b) => {
      if (b.discount !== a.discount) return b.discount - a.discount;
      if (b.priority !== a.priority) return b.priority - a.priority;
      return String(a.promotion?.nome || '').localeCompare(String(b.promotion?.nome || ''));
    });

    const best = validPromotions[0];
    return {
      valid: true,
      discount: best.discount,
      message: '',
      promotion: best.promotion,
      stackableWithCoupon: best.stackableWithCoupon
    };
  },

  getCombinedDiscountEvaluation() {
    const couponEval = this.getCouponEvaluation();
    const promotionEval = this.getPromotionEvaluation();

    if (couponEval.valid && promotionEval.valid) {
      if (promotionEval.stackableWithCoupon) {
        const subtotal = this.getSubtotalValue();
        const deliveryFee = this.getDeliveryFee();
        const maxPossible = Math.max(0, subtotal + deliveryFee);
        return {
          discount: Math.min(maxPossible, Number(couponEval.discount || 0) + Number(promotionEval.discount || 0)),
          coupon: couponEval,
          promotion: promotionEval,
          source: 'stacked'
        };
      }

      if (Number(couponEval.discount || 0) >= Number(promotionEval.discount || 0)) {
        return { discount: Number(couponEval.discount || 0), coupon: couponEval, promotion: promotionEval, source: 'coupon' };
      }
      return { discount: Number(promotionEval.discount || 0), coupon: couponEval, promotion: promotionEval, source: 'promotion' };
    }

    if (couponEval.valid) {
      return { discount: Number(couponEval.discount || 0), coupon: couponEval, promotion: promotionEval, source: 'coupon' };
    }
    if (promotionEval.valid) {
      return { discount: Number(promotionEval.discount || 0), coupon: couponEval, promotion: promotionEval, source: 'promotion' };
    }
    return { discount: 0, coupon: couponEval, promotion: promotionEval, source: 'none' };
  },

  getEligibleItemsFromRules(regras = {}) {
    let eligibleItems = [...this.items];

    const categorias = Array.isArray(regras.categorias) ? regras.categorias : [];
    if (categorias.length > 0) {
      const categoriesSet = new Set(categorias.map((v) => String(v || '').toLowerCase()));
      eligibleItems = eligibleItems.filter((item) => categoriesSet.has(String(item.categoria || '').toLowerCase()));
    }

    const marcas = Array.isArray(regras.marcas) ? regras.marcas : [];
    if (marcas.length > 0) {
      const brandsSet = new Set(marcas.map((v) => String(v || '').toLowerCase()));
      eligibleItems = eligibleItems.filter((item) => brandsSet.has(String(item.marca || '').toLowerCase()));
    }

    const produtoIds = Array.isArray(regras.produtoIds) ? regras.produtoIds : [];
    if (produtoIds.length > 0) {
      const idsSet = new Set(produtoIds.map((v) => String(v || '')));
      eligibleItems = eligibleItems.filter((item) => idsSet.has(String(item.produtoId || '')));
    }

    return eligibleItems;
  },

  getBuyXTakeYDiscount(items = [], qtyPay = 1, qtyTake = 2) {
    const totalQty = items.reduce((sum, item) => sum + Number(item.quantidade || 0), 0);
    if (qtyTake <= qtyPay || totalQty < qtyTake) return 0;
    const freePerGroup = qtyTake - qtyPay;
    const groups = Math.floor(totalQty / qtyTake);
    const freeUnits = groups * freePerGroup;
    if (freeUnits <= 0) return 0;

    const unitPrices = [];
    items.forEach((item) => {
      const qty = Math.max(0, Math.trunc(Number(item.quantidade || 0)));
      const price = Math.max(0, Number(item.preco || 0));
      for (let i = 0; i < qty; i += 1) {
        unitPrices.push(price);
      }
    });

    unitPrices.sort((a, b) => a - b);
    return unitPrices.slice(0, freeUnits).reduce((sum, price) => sum + price, 0);
  },

  getProgressivePercent(totalQty = 0, levels = []) {
    const parsed = this.parseProgressiveLevels(levels);
    if (!parsed.length || totalQty <= 0) return 0;
    let percent = 0;
    parsed.forEach((level) => {
      if (totalQty >= level.minQty && level.percent > percent) {
        percent = level.percent;
      }
    });
    return percent;
  },

  parseProgressiveLevels(levels = []) {
    const source = Array.isArray(levels) ? levels : String(levels || '').split(/\r?\n|,/);
    const parsed = [];
    source.forEach((entryRaw) => {
      const entry = String(entryRaw || '').trim();
      if (!entry) return;
      const parts = entry.split(':');
      if (parts.length < 2) return;
      const minQty = Math.trunc(Number(parts[0]));
      const percent = Number(parts[1]);
      if (!Number.isFinite(minQty) || !Number.isFinite(percent)) return;
      if (minQty <= 0 || percent <= 0) return;
      parsed.push({ minQty, percent: Math.min(percent, 100) });
    });
    return parsed.sort((a, b) => a.minQty - b.minQty);
  },

  renderCouponUI() {
    const input = document.getElementById('cartCouponInput');
    const removeBtn = document.getElementById('btnRemoveCoupon');
    const meta = document.getElementById('cartCouponMeta');
    const couponEval = this.getCouponEvaluation();
    const promotionEval = this.getPromotionEvaluation();
    const combined = this.getCombinedDiscountEvaluation();

    if (input) {
      const shouldFill = this.appliedCouponCode && input !== document.activeElement;
      if (shouldFill && input.value !== this.appliedCouponCode) {
        input.value = this.appliedCouponCode;
      }
      if (!this.appliedCouponCode && input !== document.activeElement) {
        input.value = '';
      }
    }

    if (removeBtn) {
      removeBtn.style.display = (combined.source === 'coupon' || combined.source === 'stacked') ? 'inline-flex' : 'none';
    }

    if (meta) {
      if (combined.source === 'coupon' || combined.source === 'stacked') {
        meta.textContent = `Cupom ${couponEval.displayCode} ativo`;
        meta.className = 'cart-coupon-meta active';
      } else if (combined.source === 'promotion' && promotionEval.valid) {
        const promoNome = String(promotionEval.promotion?.nome || 'Promocao');
        meta.textContent = `${promoNome} ativa`;
        meta.className = 'cart-coupon-meta active';
      } else {
        meta.textContent = '';
        meta.className = 'cart-coupon-meta';
      }
    }
  },

  setCouponFeedback(message, type = 'info') {
    const feedback = document.getElementById('cartCouponFeedback');
    if (!feedback) return;

    feedback.textContent = message || '';
    feedback.className = `cart-coupon-feedback ${type}`;

    if (!message) {
      return;
    }

    setTimeout(() => {
      if (feedback.textContent === message) {
        feedback.textContent = '';
        feedback.className = 'cart-coupon-feedback';
      }
    }, 4000);
  },

  setDeliveryOptions(config = {}) {
    this.deliveryConfig = config || {};
    const options = [];
    if (config.entregaRetiradaAtivo !== false) {
      options.push({ value: 'retirada', label: 'Retirar na Loja' });
    }
    if (config.entregaMotoboyAtivo !== false) {
      options.push({ value: 'motoboy', label: 'Entrega via Motoboy' });
    }

    this.deliveryOptions = options;
    if (!options.length) {
      this.deliveryType = null;
      this.renderDeliveryOptions();
      return;
    }

    if (!this.deliveryType || !options.some(o => o.value === this.deliveryType)) {
      this.deliveryType = options[0].value;
      this.saveToStorage();
    }

    this.renderDeliveryOptions();
  },

  setDeliveryType(value) {
    if (!value || value === this.deliveryType) return;
    this.deliveryType = value;
    this.saveToStorage();
    this.renderDeliveryOptions();
    this.updateCartUI();
  },

  getDeliveryLabel() {
    if (!this.deliveryType) return '';
    const option = this.deliveryOptions.find(o => o.value === this.deliveryType);
    return option ? option.label : '';
  },

  renderDeliveryOptions() {
    const cartWrap = document.getElementById('cartDelivery');
    const cartOptions = document.getElementById('cartDeliveryOptions');
    const catalogOptions = document.getElementById('entregaCatalogoOptions');
    const catalogWrap = document.getElementById('entregaSelector');
    const cardOptions = document.querySelectorAll('[data-entrega-options]');

    if (!this.deliveryOptions.length) {
      if (cartWrap) cartWrap.style.display = 'none';
      if (catalogWrap) catalogWrap.style.display = 'none';
      cardOptions.forEach((el) => {
        el.innerHTML = '';
      });
      return;
    }

    if (cartWrap) cartWrap.style.display = 'flex';
    if (catalogWrap) catalogWrap.style.display = 'flex';

    const renderOptions = (container, name, compact = false) => {
      if (!container) return;
      container.innerHTML = this.deliveryOptions.map(opt => `
        <label class="entrega-option ${compact ? 'entrega-option--compact' : ''} ${this.deliveryType === opt.value ? 'active' : ''}">
          <input type="radio" name="${name}" value="${opt.value}" ${this.deliveryType === opt.value ? 'checked' : ''}>
          <span>${opt.label}</span>
        </label>
      `).join('');

      container.querySelectorAll('input[type="radio"]').forEach(input => {
        input.addEventListener('change', () => this.setDeliveryType(input.value));
      });
    };

    renderOptions(cartOptions, 'entrega_cart');
    renderOptions(catalogOptions, 'entrega_catalogo');
    cardOptions.forEach((el) => renderOptions(el, 'entrega_global', true));
  },

  renderDeliveryFee() {
    const feeEl = document.getElementById('cartDeliveryFee');
    if (!feeEl) return;
    if (this.deliveryType !== 'motoboy') {
      feeEl.textContent = '';
      return;
    }
    const taxa = this.getDeliveryFee();
    if (taxa > 0) {
      feeEl.textContent = `Taxa de entrega: R$ ${this.formatPrice(taxa)}`;
    } else {
      feeEl.textContent = '';
    }
  },

  renderCartItems() {
    const container = document.getElementById('cartItems');
    if (!container) return;

    if (this.items.length === 0) {
      container.innerHTML = `
        <div class="cart-empty">
          <p>Seu carrinho está vazio</p>
          <small>Adicione produtos para começar</small>
        </div>
      `;
      return;
    }

    container.innerHTML = this.items.map(item => {
      const nome = DomUtils.escapeHtml(item.nome);
      const marca = DomUtils.escapeHtml(item.marca);
      const tamanho = DomUtils.escapeHtml(item.tamanho);
      const pagamento = DomUtils.escapeHtml(item.pagamento);
      const imagem = DomUtils.sanitizeUrl(item.imagem);

      return `
        <div class="cart-item" data-item-id="${item.id}">
          <img src="${imagem}" alt="${nome}" class="cart-item-image">
          <div class="cart-item-info">
            <h4 class="cart-item-name">${nome}</h4>
            <p class="cart-item-details">${marca} • ${tamanho} • ${pagamento}</p>
            <div class="cart-item-controls">
              <button class="btn-quantity" data-action="change-qty" data-item-id="${item.id}" data-qty="${item.quantidade - 1}">-</button>
              <span class="cart-item-qty">${item.quantidade}</span>
              <button class="btn-quantity" data-action="change-qty" data-item-id="${item.id}" data-qty="${item.quantidade + 1}">+</button>
              <span class="cart-item-price">R$ ${this.formatPrice(item.preco * item.quantidade)}</span>
            </div>
          </div>
          <button class="btn-remove-item" data-action="remove-item" data-item-id="${item.id}" aria-label="Remover">✖</button>
        </div>
      `;
    }).join('');
  },

  registerCheckout() {
    this.incrementCompletedOrders();

    const couponEval = this.getCouponEvaluation();
    if (!couponEval.valid || !couponEval.displayCode) return;

    const usage = this.readCouponUsage();
    const code = couponEval.displayCode;
    const clientId = this.getClientId();
    const current = usage[code] || { total: 0, clients: {} };

    current.total = Number(current.total || 0) + 1;
    current.clients = current.clients || {};
    current.clients[clientId] = Number(current.clients[clientId] || 0) + 1;

    usage[code] = current;
    this.writeCouponUsage(usage);
  },

  getCompletedOrdersCount() {
    try {
      return Number(localStorage.getItem(this.completedOrdersKey) || 0);
    } catch {
      return 0;
    }
  },

  incrementCompletedOrders() {
    const next = this.getCompletedOrdersCount() + 1;
    try {
      localStorage.setItem(this.completedOrdersKey, String(next));
    } catch {
      // noop
    }
  },

  readCouponUsage() {
    try {
      const raw = localStorage.getItem(this.couponUsageKey);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return {};
      return parsed;
    } catch {
      return {};
    }
  },

  writeCouponUsage(usage) {
    try {
      localStorage.setItem(this.couponUsageKey, JSON.stringify(usage || {}));
    } catch {
      // noop
    }
  },

  getCouponUsageTotal(code) {
    const usage = this.readCouponUsage();
    return Number(usage?.[code]?.total || 0);
  },

  getCouponUsageForClient(code) {
    const usage = this.readCouponUsage();
    const clientId = this.getClientId();
    return Number(usage?.[code]?.clients?.[clientId] || 0);
  },

  getClientId() {
    try {
      const existing = localStorage.getItem(this.clientIdKey);
      if (existing) return existing;
      const generated = `cli_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
      localStorage.setItem(this.clientIdKey, generated);
      return generated;
    } catch {
      return 'anonimo';
    }
  },

  parseDateValue(value, endOfDay = false) {
    if (!value) return 0;

    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (value && typeof value.toDate === 'function') {
      const date = value.toDate();
      return date instanceof Date ? date.getTime() : 0;
    }

    const raw = String(value || '').trim();
    const isoDateOnly = /^\\d{4}-\\d{2}-\\d{2}$/;
    const normalized = endOfDay && isoDateOnly.test(raw)
      ? `${raw}T23:59:59.999`
      : raw;

    const parsed = Date.parse(normalized);
    return Number.isNaN(parsed) ? 0 : parsed;
  },

  normalizeCouponCode(code) {
    return String(code || '').trim().toUpperCase();
  },

  normalizeCouponType(value) {
    const type = String(value || '').trim().toLowerCase();
    if (type === 'fixo' || type === 'valor' || type === 'valor fixo' || type === 'valor_fixo') {
      return 'valor_fixo';
    }
    if (type === 'primeira compra' || type === 'primeira_compra') {
      return 'primeira_compra';
    }
    if (type === 'por cliente' || type === 'por_cliente') {
      return 'por_cliente';
    }
    if (type === 'relampago' || type === 'relâmpago') {
      return 'relampago';
    }
    return 'porcentagem';
  },

  normalizePromotionType(value) {
    const raw = String(value || '').trim().toLowerCase();
    if (['porcentagem', 'percentual', 'percent'].includes(raw)) return 'porcentagem';
    if (['valor_fixo', 'fixo', 'valor'].includes(raw)) return 'valor_fixo';
    if (['loja_inteira_percentual', 'loja_inteira', 'store_percent'].includes(raw)) return 'loja_inteira_percentual';
    if (['compre_2_ou_mais', 'qtd_minima', 'buy_2_plus'].includes(raw)) return 'compre_2_ou_mais';
    if (['compre_1_leve_2', 'buy_1_get_2', 'b1g2'].includes(raw)) return 'compre_1_leve_2';
    if (['progressivo', 'desconto_progressivo', 'tiered'].includes(raw)) return 'progressivo';
    return 'porcentagem';
  },

  showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'cart-notification';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add('show');
    }, 10);

    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  },

  generateWhatsAppMessage(config) {
    if (this.items.length === 0) return '';

    const subtotal = this.getSubtotalValue();
    const combinedDiscount = this.getCombinedDiscountEvaluation();
    const discount = Number(combinedDiscount.discount || 0);
    const total = this.getTotalValue();
    const totalItems = this.getTotalItems();
    const pagamentos = [...new Set(this.items.map(i => i.pagamento))];
    const pagamentoTexto = pagamentos.length === 1 ? pagamentos[0] : 'Variado';
    const freteValor = this.getDeliveryFee();
    const entregaTexto = this.getDeliveryLabel() || 'Retirar na Loja';
    const totalPix = this.items
      .filter(i => String(i.pagamento).toUpperCase() === 'PIX')
      .reduce((sum, i) => sum + (i.preco * i.quantidade), 0);
    const totalCartao = this.items
      .filter(i => String(i.pagamento).toUpperCase() === 'CARTAO')
      .reduce((sum, i) => sum + (i.preco * i.quantidade), 0);

    const combined = this.getCombinedDiscountEvaluation();
    const couponEval = combined.coupon || this.getCouponEvaluation();
    const promotionEval = combined.promotion || this.getPromotionEvaluation();
    const couponCode = couponEval.valid ? couponEval.displayCode : '';
    const promotionName = promotionEval.valid ? String(promotionEval.promotion?.nome || '').trim() : '';
    const couponOrPromotion = combined.source === 'promotion'
      ? (promotionName || 'Sem cupom')
      : (couponCode || promotionName || 'Sem cupom');

    const itemTemplate = config.mensagemCarrinhoItem
      || '{numero}. *{produto}* - {marca}\n   Tamanho: {tamanho} | Pagamento: {pagamento}\n   Qtd: {quantidade} | Valor unit.: R$ {valor} | Subtotal: R$ {subtotal}';

    const produtosLista = this.items.map((item, index) => {
      const nome = String(item.nome || '').trim();
      const marca = String(item.marca || '').trim();
      const tamanho = String(item.tamanho || '').trim();
      const pagamento = String(item.pagamento || '').trim();
      const unit = this.formatPrice(item.preco);
      const subtotalItem = this.formatPrice(item.preco * item.quantidade);
      return itemTemplate
        .replace(/{numero}/g, String(index + 1))
        .replace(/{produto}/g, nome)
        .replace(/{marca}/g, marca)
        .replace(/{tamanho}/g, tamanho)
        .replace(/{pagamento}/g, pagamento)
        .replace(/{quantidade}/g, String(item.quantidade))
        .replace(/{valor}/g, unit)
        .replace(/{subtotal}/g, subtotalItem);
    }).join('\n\n');

    const itensSimples = this.items.map(item => {
      const nome = String(item.nome || '').trim();
      return `${nome} x${item.quantidade}`;
    }).join('\n');

    const template = config.mensagemCarrinho || config.mensagemPadrao || 'Olá! Gostaria de fazer um pedido:';

    return template
      .replace(/{produtos}/g, produtosLista)
      .replace(/{item}/g, produtosLista)
      .replace(/{itens}/g, itensSimples)
      .replace(/{quantidade}/g, String(totalItems))
      .replace(/{subtotal}/g, this.formatPrice(subtotal))
      .replace(/{desconto}/g, this.formatPrice(discount))
      .replace(/{cupom}/g, couponOrPromotion)
      .replace(/{total}/g, this.formatPrice(total))
      .replace(/{total_pix}/g, this.formatPrice(totalPix))
      .replace(/{total_cartao}/g, this.formatPrice(totalCartao))
      .replace(/{pagamento}/g, pagamentoTexto)
      .replace(/{entrega}/g, entregaTexto)
      .replace(/{frete}/g, this.formatPrice(freteValor))
      .replace(/{observacoes}/g, this.notes && String(this.notes).trim() !== ''
        ? String(this.notes).trim()
        : 'Sem observações');
  },

  formatPrice(value) {
    return Number(value || 0).toFixed(2).replace('.', ',');
  }
};

window.CartService = CartService;
