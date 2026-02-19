/**
 * Pagina: Configuracoes > Visual
 */
const ConfigVisualPage = {
  filterState: {
    query: '',
    essentialsOnly: true
  },
  ESSENTIAL_KEYS: [
    'corPrimaria',
    'corSecundaria',
    'corFundo',
    'corTexto',
    'corHeaderBg',
    'corCardBg',
    'corCardBorda',
    'corBotaoPrimario',
    'corBotaoPrimarioTextoCor',
    'corBotaoWhatsapp',
    'corBarraAvisoBg',
    'corCarrinhoBg',
    'corFooterBg',
    'corFooterTexto'
  ],
  COLOR_GROUPS: [
    {
      id: 'grupo-base',
      titulo: 'Base do Tema',
      icone: '🎨',
      campos: [
        { key: 'corPrimaria', label: 'Cor Primaria', descricao: 'Destaques e elementos principais', padrao: '#6366f1' },
        { key: 'corSecundaria', label: 'Cor Secundaria', descricao: 'Sucesso e destaques secundarios', padrao: '#10b981' },
        { key: 'corFundo', label: 'Fundo Geral', descricao: 'Fundo principal do catalogo', padrao: '#0f172a' },
        { key: 'corTexto', label: 'Texto Principal', descricao: 'Cor base para titulos e textos', padrao: '#f1f5f9' }
      ]
    },
    {
      id: 'grupo-header-menu',
      titulo: 'Header e Menus',
      icone: '🧭',
      campos: [
        { key: 'corHeaderBg', label: 'Header - Fundo', descricao: 'Fundo do cabecalho fixo', padrao: '#1e293b' },
        { key: 'corMenuTexto', label: 'Menu Desktop - Texto', descricao: 'Links do menu principal', padrao: '#94a3b8' },
        { key: 'corMenuTiposBg', label: 'Menu de Tipos - Fundo', descricao: 'Fundo da barra de menu de tipos', padrao: '#1e293b' },
        { key: 'corMenuTiposBotaoBg', label: 'Menu de Tipos - Botao', descricao: 'Botao normal do menu de tipos', padrao: '#0f172a' },
        { key: 'corMenuTiposBotaoTexto', label: 'Menu de Tipos - Texto', descricao: 'Texto do botao normal do menu de tipos', padrao: '#94a3b8' },
        { key: 'corMenuTiposBotaoAtivoBg', label: 'Menu de Tipos - Ativo (Fundo)', descricao: 'Botao ativo no menu de tipos', padrao: '#6366f1' },
        { key: 'corMenuTiposBotaoAtivoTexto', label: 'Menu de Tipos - Ativo (Texto)', descricao: 'Texto do botao ativo no menu de tipos', padrao: '#ffffff' }
      ]
    },
    {
      id: 'grupo-cards-filtros',
      titulo: 'Cards e Filtros',
      icone: '🧱',
      campos: [
        { key: 'corCardBg', label: 'Card de Produto - Fundo', descricao: 'Fundo dos cards', padrao: '#1e293b' },
        { key: 'corCardBorda', label: 'Card de Produto - Borda', descricao: 'Borda dos cards', padrao: '#334155' },
        { key: 'corFiltroBotaoBg', label: 'Filtro Mobile - Botao Fundo', descricao: 'Botao "Filtros" no mobile', padrao: '#6366f1' },
        { key: 'corFiltroBotaoTexto', label: 'Filtro Mobile - Botao Texto', descricao: 'Texto do botao "Filtros" no mobile', padrao: '#ffffff' },
        { key: 'corFiltrosPainelBg', label: 'Painel de Filtros - Fundo', descricao: 'Fundo lateral dos filtros', padrao: '#1e293b' },
        { key: 'corFiltrosPainelBorda', label: 'Painel de Filtros - Borda', descricao: 'Borda do painel de filtros', padrao: '#334155' },
        { key: 'corFiltroItemHover', label: 'Filtros - Hover Item', descricao: 'Fundo no hover das opcoes de filtro', padrao: '#334155' }
      ]
    },
    {
      id: 'grupo-botoes',
      titulo: 'Botoes',
      icone: '🔘',
      campos: [
        { key: 'corBotaoPrimario', label: 'Botao Primario - Fundo', descricao: 'Botoes principais', padrao: '#6366f1' },
        { key: 'corBotaoPrimarioHover', label: 'Botao Primario - Hover', descricao: 'Hover do botao primario', padrao: '#4f46e5' },
        { key: 'corBotaoPrimarioTextoCor', label: 'Botao Primario - Texto', descricao: 'Texto do botao primario', padrao: '#ffffff' },
        { key: 'corBotaoOutline', label: 'Botao Contorno - Borda/Texto', descricao: 'Botao de adicionar ao carrinho', padrao: '#6366f1' },
        { key: 'corBotaoOutlineHover', label: 'Botao Contorno - Hover Fundo', descricao: 'Hover do botao contorno', padrao: '#6366f1' },
        { key: 'corBotaoOutlineHoverTextoCor', label: 'Botao Contorno - Hover Texto', descricao: 'Texto no hover do contorno', padrao: '#ffffff' },
        { key: 'corBotaoWhatsapp', label: 'WhatsApp - Botao Fundo', descricao: 'Botao de compra via WhatsApp', padrao: '#10b981' },
        { key: 'corBotaoWhatsappHover', label: 'WhatsApp - Botao Hover', descricao: 'Hover do botao de compra via WhatsApp', padrao: '#059669' },
        { key: 'corBotaoWhatsappTextoCor', label: 'WhatsApp - Botao Texto', descricao: 'Texto do botao de compra via WhatsApp', padrao: '#ffffff' },
        { key: 'corSliderBotaoBg', label: 'Slider - Botoes Fundo', descricao: 'Botoes anterior/proximo do slider', padrao: '#6366f1' },
        { key: 'corSliderBotaoTexto', label: 'Slider - Botoes Texto', descricao: 'Icones/texto dos botoes do slider', padrao: '#f1f5f9' },
        { key: 'corSliderDotBg', label: 'Slider - Dot Inativo', descricao: 'Indicador inativo do slider', padrao: '#64748b' },
        { key: 'corSliderDotAtivo', label: 'Slider - Dot Ativo', descricao: 'Indicador ativo do slider', padrao: '#6366f1' }
      ]
    },
    {
      id: 'grupo-entrega-whatsapp',
      titulo: 'Entrega e WhatsApp Flutuante',
      icone: '🚚',
      campos: [
        { key: 'corBarraAvisoBg', label: 'Barra de Aviso - Fundo', descricao: 'Barra superior de aviso de entrega', padrao: '#6366f1' },
        { key: 'corBarraAvisoTexto', label: 'Barra de Aviso - Texto', descricao: 'Texto da barra superior de aviso', padrao: '#ffffff' },
        { key: 'corEntregaSelectorBg', label: 'Seletor de Entrega - Fundo', descricao: 'Box de tipo de entrega', padrao: '#1e293b' },
        { key: 'corEntregaSelectorBorda', label: 'Seletor de Entrega - Borda', descricao: 'Borda do box de entrega', padrao: '#334155' },
        { key: 'corEntregaOpcaoBg', label: 'Entrega - Opcao Fundo', descricao: 'Botao normal da opcao de entrega', padrao: '#0f172a' },
        { key: 'corEntregaOpcaoTexto', label: 'Entrega - Opcao Texto', descricao: 'Texto da opcao de entrega', padrao: '#94a3b8' },
        { key: 'corEntregaOpcaoAtivaBg', label: 'Entrega - Opcao Ativa Fundo', descricao: 'Fundo da opcao ativa de entrega', padrao: '#6366f1' },
        { key: 'corEntregaOpcaoAtivaTexto', label: 'Entrega - Opcao Ativa Texto', descricao: 'Texto da opcao ativa de entrega', padrao: '#ffffff' },
        { key: 'corWhatsappFlutuanteBg', label: 'WhatsApp Flutuante - Botao Fundo', descricao: 'Botao circular flutuante', padrao: '#25d366' },
        { key: 'corWhatsappTooltipBg', label: 'WhatsApp Flutuante - Tooltip Fundo', descricao: 'Fundo do tooltip do WhatsApp', padrao: '#1e293b' },
        { key: 'corWhatsappTooltipTexto', label: 'WhatsApp Flutuante - Tooltip Texto', descricao: 'Texto do tooltip do WhatsApp', padrao: '#f1f5f9' }
      ]
    },
    {
      id: 'grupo-carrinho-footer',
      titulo: 'Carrinho e Rodape',
      icone: '🛒',
      campos: [
        { key: 'corCarrinhoBg', label: 'Carrinho - Fundo', descricao: 'Fundo lateral do carrinho', padrao: '#1e293b' },
        { key: 'corCarrinhoBorda', label: 'Carrinho - Borda', descricao: 'Bordas do carrinho', padrao: '#334155' },
        { key: 'corCarrinhoHeaderBg', label: 'Carrinho - Header Fundo', descricao: 'Fundo do cabecalho do carrinho', padrao: '#0f172a' },
        { key: 'corCarrinhoFooterBg', label: 'Carrinho - Footer Fundo', descricao: 'Fundo do rodape do carrinho', padrao: '#0f172a' },
        { key: 'corCarrinhoItemBg', label: 'Carrinho - Item Fundo', descricao: 'Fundo dos cards de item do carrinho', padrao: '#0f172a' },
        { key: 'corCarrinhoTotalTexto', label: 'Carrinho - Total Texto', descricao: 'Cor do valor total', padrao: '#10b981' },
        { key: 'corFooterBg', label: 'Footer - Fundo', descricao: 'Fundo do rodape', padrao: '#0f172a' },
        { key: 'corFooterTexto', label: 'Footer - Texto', descricao: 'Texto do rodape', padrao: '#94a3b8' }
      ]
    }
  ],

  init() {
    this.renderColorFields();
    this.bindEvents();
    this.setupColorSyncs();
    this.carregarConfiguracoes();
  },

  getColorFields() {
    return this.COLOR_GROUPS.flatMap((group) => group.campos);
  },

  getColorDefaults() {
    return this.getColorFields().reduce((acc, campo) => {
      acc[campo.key] = campo.padrao;
      return acc;
    }, {});
  },

  renderColorFields() {
    const container = document.getElementById('colorGroupsContainer');
    if (!container) return;

    container.innerHTML = this.COLOR_GROUPS.map((group, index) => `
      <section class="color-group-card" data-color-group="${group.id}">
        <button type="button" class="color-group-toggle" data-group-toggle="${group.id}" aria-expanded="${index === 0 ? 'true' : 'false'}">
          <span class="color-group-title">${group.icone} ${group.titulo}</span>
          <span class="color-group-meta">${group.campos.length} cores</span>
        </button>
        <div class="color-group-body ${index === 0 ? '' : 'is-collapsed'}" data-group-body="${group.id}">
          <div class="form-row">
          ${group.campos.map((campo) => {
            const isEssential = this.ESSENTIAL_KEYS.includes(campo.key);
            return `
            <div class="form-group color-field" data-essential="${isEssential}" data-color-search="${(campo.label + ' ' + campo.descricao + ' ' + group.titulo).toLowerCase()}">
              <div class="color-field-header">
                <label for="${campo.key}">${campo.label}</label>
                ${isEssential ? '<span class="color-field-badge">Essencial</span>' : ''}
              </div>
              <div class="color-picker-group">
                <input type="color" id="${campo.key}" name="${campo.key}" value="${campo.padrao}" aria-label="${campo.label}">
                <input type="text" id="${campo.key}Texto" value="${campo.padrao.toUpperCase()}" maxlength="7" autocomplete="off" spellcheck="false" inputmode="text" placeholder="#FFFFFF" aria-label="${campo.label} hexadecimal">
              </div>
              <small>${campo.descricao}</small>
            </div>
          `;
          }).join('')}
          </div>
        </div>
      </section>
    `).join('');
  },

  bindEvents() {
    document.getElementById('configVisualForm')?.addEventListener('submit', (e) => this.salvarConfiguracoes(e));
    document.getElementById('logoUpload')?.addEventListener('change', (e) => this.onLogoUpload(e));
    document.getElementById('footerTexto')?.addEventListener('input', () => this.atualizarPreview());
    document.getElementById('btnResetarCores')?.addEventListener('click', () => this.resetarCores());
    document.getElementById('filtroCoresInput')?.addEventListener('input', (e) => {
      this.filterState.query = e.target.value || '';
      this.applyColorFilters();
    });
    document.getElementById('filtroEssenciais')?.addEventListener('change', (e) => {
      this.filterState.essentialsOnly = e.target.checked;
      this.applyColorFilters();
    });
    this.bindGroupToggles();
  },

  setupColorSyncs() {
    this.getColorFields().forEach(({ key }) => {
      const colorInput = document.getElementById(key);
      const textInput = document.getElementById(`${key}Texto`);
      if (!colorInput || !textInput) return;

      colorInput.addEventListener('input', () => {
        textInput.value = colorInput.value.toUpperCase();
        textInput.classList.remove('hex-invalid');
        this.atualizarPreview();
      });

      textInput.addEventListener('input', () => {
        const normalized = this.normalizeHex(textInput.value);
        if (!normalized) {
          textInput.classList.add('hex-invalid');
          return;
        }

        textInput.classList.remove('hex-invalid');
        colorInput.value = normalized;
        textInput.value = normalized.toUpperCase();
        this.atualizarPreview();
      });

      textInput.addEventListener('blur', () => {
        const normalized = this.normalizeHex(textInput.value);
        if (!normalized) {
          textInput.value = colorInput.value.toUpperCase();
          textInput.classList.remove('hex-invalid');
          return;
        }
        textInput.value = normalized.toUpperCase();
      });
    });
  },

  bindGroupToggles() {
    document.querySelectorAll('[data-group-toggle]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const groupId = btn.dataset.groupToggle;
        const body = document.querySelector(`[data-group-body="${groupId}"]`);
        if (!body) return;
        body.classList.toggle('is-collapsed');
        btn.setAttribute('aria-expanded', body.classList.contains('is-collapsed') ? 'false' : 'true');
      });
    });
  },

  applyColorFilters() {
    const termo = String(this.filterState.query || '').trim().toLowerCase();
    const essentialsOnly = this.filterState.essentialsOnly;
    const fields = document.querySelectorAll('.color-field');
    const groups = document.querySelectorAll('.color-group-card');

    fields.forEach((field) => {
      const haystack = field.dataset.colorSearch || '';
      const isEssential = field.dataset.essential === 'true';
      const visibleByEssential = !essentialsOnly || isEssential;
      const visibleBySearch = !termo || haystack.includes(termo);
      field.style.display = visibleByEssential && visibleBySearch ? '' : 'none';
    });

    groups.forEach((group) => {
      const hasVisible = Array.from(group.querySelectorAll('.color-field')).some((field) => field.style.display !== 'none');
      group.style.display = hasVisible ? '' : 'none';
      if (termo && hasVisible) {
        const body = group.querySelector('.color-group-body');
        const toggle = group.querySelector('.color-group-toggle');
        if (body) body.classList.remove('is-collapsed');
        if (toggle) toggle.setAttribute('aria-expanded', 'true');
      }
    });
  },

  normalizeHex(value) {
    const raw = String(value || '').trim().replace('#', '');
    if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(raw)) return null;
    const full = raw.length === 3 ? raw.split('').map((c) => c + c).join('') : raw;
    return `#${full.toLowerCase()}`;
  },

  getColorValue(key) {
    const input = document.getElementById(key);
    if (input && input.value) return input.value;
    const defaults = this.getColorDefaults();
    return defaults[key] || '#000000';
  },

  setColorValue(key, value) {
    const colorInput = document.getElementById(key);
    const textInput = document.getElementById(`${key}Texto`);
    const normalized = this.normalizeHex(value) || this.getColorDefaults()[key] || '#000000';

    if (colorInput) colorInput.value = normalized;
    if (textInput) {
      textInput.value = normalized.toUpperCase();
      textInput.classList.remove('hex-invalid');
    }
  },

  atualizarPreview() {
    const preview = document.getElementById('previewCatalogo');
    const header = document.getElementById('previewHeader');
    const btn = document.getElementById('previewBtn');
    const card = document.getElementById('previewCard');
    const whatsapp = document.getElementById('previewWhatsapp');
    const texto = document.getElementById('previewTexto');
    const footer = document.getElementById('previewFooter');
    const footerText = document.getElementById('previewFooterText');
    const footerTextoInput = document.getElementById('footerTexto');

    const corPrimaria = this.getColorValue('corPrimaria');
    const corFundo = this.getColorValue('corFundo');
    const corTexto = this.getColorValue('corTexto');
    const corHeaderBg = this.getColorValue('corHeaderBg');
    const corCardBg = this.getColorValue('corCardBg');
    const corCardBorda = this.getColorValue('corCardBorda');
    const corBotaoPrimario = this.getColorValue('corBotaoPrimario');
    const corBotaoPrimarioHover = this.getColorValue('corBotaoPrimarioHover');
    const corBotaoPrimarioTextoCor = this.getColorValue('corBotaoPrimarioTextoCor');
    const corBotaoOutlineHover = this.getColorValue('corBotaoOutlineHover');
    const corBotaoOutlineHoverTextoCor = this.getColorValue('corBotaoOutlineHoverTextoCor');
    const corBotaoWhatsapp = this.getColorValue('corBotaoWhatsapp');
    const corBotaoWhatsappHover = this.getColorValue('corBotaoWhatsappHover');
    const corBotaoWhatsappTextoCor = this.getColorValue('corBotaoWhatsappTextoCor');
    const corFooterBg = this.getColorValue('corFooterBg');
    const corFooterTexto = this.getColorValue('corFooterTexto');

    preview.style.background = corFundo;
    header.style.background = corHeaderBg;
    header.style.borderBottom = `2px solid ${corPrimaria}`;
    btn.style.background = corBotaoPrimario;
    btn.style.color = corBotaoPrimarioTextoCor || '#ffffff';
    card.style.background = corCardBg;
    card.style.border = `1px solid ${corCardBorda}`;
    whatsapp.style.background = corBotaoWhatsapp;
    whatsapp.style.color = corBotaoWhatsappTextoCor;
    texto.style.color = corTexto;
    footer.style.background = corFooterBg;
    footerText.style.color = corFooterTexto;

    if (footerTextoInput && footerTextoInput.value.trim() !== '') {
      footerText.textContent = footerTextoInput.value.trim();
    }

    btn.dataset.hoverBg = corBotaoPrimarioHover;
    btn.dataset.hoverColor = corBotaoPrimarioTextoCor;
    whatsapp.dataset.hoverBg = corBotaoWhatsappHover;
    whatsapp.dataset.hoverColor = corBotaoWhatsappTextoCor;
    card.dataset.outlineBg = corBotaoOutlineHover;
    card.dataset.outlineText = corBotaoOutlineHoverTextoCor;
  },

  resetarCores() {
    if (!confirm('Restaurar TODAS as cores padrao? Esta acao nao pode ser desfeita.')) return;

    const padroes = this.getColorDefaults();
    Object.entries(padroes).forEach(([key, value]) => this.setColorValue(key, value));

    this.atualizarPreview();
    alert('Cores restauradas para os valores padrao!');
  },

  async onLogoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Selecione apenas imagens');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('Imagem muito grande (max. 2MB)');
      return;
    }

    try {
      const loadingEl = document.getElementById('logoPreview');
      DomUtils.clear(loadingEl);
      const p = document.createElement('p');
      p.textContent = 'Enviando logo...';
      loadingEl.appendChild(p);
      loadingEl.style.display = 'block';

      const url = await ProdutosService.uploadImagem(file);

      document.getElementById('logoUrl').value = url;
      DomUtils.clear(loadingEl);
      const img = document.createElement('img');
      img.src = url;
      img.alt = 'Logo';
      loadingEl.appendChild(img);

      const previewLogo = document.getElementById('previewLogo');
      DomUtils.clear(previewLogo);
      const imgPreview = document.createElement('img');
      imgPreview.src = url;
      imgPreview.style.height = '40px';
      previewLogo.appendChild(imgPreview);
    } catch (error) {
      alert('Erro ao enviar logo');
    }
  },

  async carregarConfiguracoes() {
    const config = await ConfigService.buscar();

    document.getElementById('nomeLoja').value = config.nomeLoja || '';
    document.getElementById('logoUrl').value = config.logoUrl || '';
    document.getElementById('catalogoUrl').value = config.catalogoUrl || '';
    document.getElementById('footerTexto').value = config.footerTexto || '';

    const defaults = this.getColorDefaults();
    const customizacao = config.customizacao || {};
    this.getColorFields().forEach(({ key }) => {
      this.setColorValue(key, customizacao[key] || defaults[key]);
    });
    this.applyColorFilters();

    if (config.logoUrl) {
      const preview = document.getElementById('logoPreview');
      DomUtils.clear(preview);
      const img = document.createElement('img');
      img.src = config.logoUrl;
      img.alt = 'Logo';
      preview.appendChild(img);
      preview.style.display = 'block';

      const previewLogo = document.getElementById('previewLogo');
      DomUtils.clear(previewLogo);
      const imgPreview = document.createElement('img');
      imgPreview.src = config.logoUrl;
      imgPreview.style.height = '40px';
      previewLogo.appendChild(imgPreview);
    }

    this.atualizarPreview();
  },

  async salvarConfiguracoes(e) {
    e.preventDefault();

    const config = {
      nomeLoja: document.getElementById('nomeLoja').value.trim(),
      logoUrl: document.getElementById('logoUrl').value.trim(),
      catalogoUrl: document.getElementById('catalogoUrl').value.trim(),
      footerTexto: document.getElementById('footerTexto').value.trim(),
      customizacao: {}
    };

    this.getColorFields().forEach(({ key }) => {
      config.customizacao[key] = this.getColorValue(key);
    });

    const result = await ConfigService.salvar(config);

    if (result.success) {
      alert('Configuracoes salvas com sucesso!');
    } else {
      alert('Erro ao salvar configuracoes');
    }
  }
};

document.addEventListener('DOMContentLoaded', () => ConfigVisualPage.init());
window.ConfigVisualPage = ConfigVisualPage;
