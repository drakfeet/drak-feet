/**
 * AdminShell - inicializa layout, menu mobile e hardening de links
 */
const AdminShell = {
  init() {
    this.normalizeMojibakeInPage();

    if (window.ThemeService) {
      ThemeService.init();
      this.setupThemeToggle();
    }

    this.organizeConfigNavigation();
    this.organizeQuickActions();
    this.setupMobileMenu();
    this.setupDesktopSidebarCollapse();
    this.normalizeSidebarHeaderTitle();
    this.ensureModernIconFont();
    this.replaceLegacyIcons();
    this.applyCatalogLinkFromConfig();
    this.hardenExternalLinks();
    this.captureGlobalErrors();
    this.setupAlertCenter();
  },

  normalizeMojibakeInPage() {
    const isMojibake = (text) => /Ã|Â|ð|â|ï¸|�/.test(String(text || ''));
    const decode = (text) => {
      let current = String(text || '');
      let attempts = 0;

      while (attempts < 2 && isMojibake(current)) {
        try {
          const decoded = decodeURIComponent(escape(current));
          if (!decoded || decoded === current) break;
          current = decoded;
          attempts += 1;
        } catch {
          break;
        }
      }

      return current;
    };

    if (typeof document === 'undefined' || !document.body) return;

    if (isMojibake(document.title)) {
      document.title = decode(document.title);
    }

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    let node = walker.nextNode();
    while (node) {
      textNodes.push(node);
      node = walker.nextNode();
    }

    textNodes.forEach((textNode) => {
      const value = textNode.nodeValue;
      if (!isMojibake(value)) return;
      const fixed = decode(value);
      if (fixed && fixed !== value) {
        textNode.nodeValue = fixed;
      }
    });

    document.querySelectorAll('[aria-label],[title],[placeholder]').forEach((el) => {
      ['aria-label', 'title', 'placeholder'].forEach((attr) => {
        const value = el.getAttribute(attr);
        if (!value || !isMojibake(value)) return;
        const fixed = decode(value);
        if (fixed && fixed !== value) {
          el.setAttribute(attr, fixed);
        }
      });
    });
  },

  setupThemeToggle() {
    const themeToggle = document.getElementById('themeToggleAdmin');
    if (!themeToggle) return;
    themeToggle.addEventListener('click', () => ThemeService.toggle());
  },

  setupMobileMenu() {
    const menuToggle = document.getElementById('menuToggleAdmin');
    const sidebar = document.getElementById('adminSidebar');
    const overlay = document.getElementById('menuOverlayAdmin');
    const closeBtn = document.getElementById('btnCloseSidebar');
    const navLinks = sidebar ? sidebar.querySelectorAll('a') : [];

    if (!menuToggle || !sidebar) return;

    const isMobileViewport = () => window.matchMedia('(max-width: 768px)').matches;

    const closeMenu = () => {
      sidebar.classList.remove('mobile-open');
      if (overlay) overlay.classList.remove('active');
      document.body.classList.remove('mobile-menu-open');
      document.body.style.overflow = '';
      menuToggle.setAttribute('aria-expanded', 'false');
    };

    const openMenu = () => {
      if (!isMobileViewport()) return;
      sidebar.classList.add('mobile-open');
      if (overlay) overlay.classList.add('active');
      document.body.classList.add('mobile-menu-open');
      document.body.style.overflow = 'hidden';
      menuToggle.setAttribute('aria-expanded', 'true');
    };

    const toggleMenu = () => {
      const isOpen = sidebar.classList.contains('mobile-open');
      if (isOpen) {
        closeMenu();
        return;
      }
      openMenu();
    };

    menuToggle.addEventListener('click', toggleMenu);
    if (closeBtn) closeBtn.addEventListener('click', closeMenu);
    if (overlay) overlay.addEventListener('click', closeMenu);

    navLinks.forEach((link) => {
      link.addEventListener('click', () => {
        if (isMobileViewport()) closeMenu();
      });
    });

    window.addEventListener('resize', () => {
      if (!isMobileViewport()) {
        closeMenu();
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeMenu();
      }
    });
  },

  setupDesktopSidebarCollapse() {
    const sidebar = document.getElementById('adminSidebar');
    const header = sidebar ? sidebar.querySelector('.sidebar-header') : null;
    if (!sidebar || !header) return;

    const isDesktopViewport = () => window.matchMedia('(min-width: 769px)').matches;
    const storageKey = 'admin_sidebar_collapsed';
    let toggleBtn = document.getElementById('sidebarCollapseToggle');

    if (!toggleBtn) {
      toggleBtn = document.createElement('button');
      toggleBtn.id = 'sidebarCollapseToggle';
      toggleBtn.type = 'button';
      toggleBtn.className = 'btn-sidebar-collapse material-symbols-rounded';
      header.appendChild(toggleBtn);
    }

    const setCollapsed = (collapsed, persist = true) => {
      if (!isDesktopViewport()) {
        document.body.classList.remove('sidebar-collapsed');
        return;
      }

      document.body.classList.toggle('sidebar-collapsed', collapsed);
      toggleBtn.textContent = collapsed ? 'left_panel_open' : 'left_panel_close';
      toggleBtn.setAttribute('aria-label', collapsed ? 'Expandir menu lateral' : 'Recolher menu lateral');
      toggleBtn.setAttribute('title', collapsed ? 'Expandir menu lateral' : 'Recolher menu lateral');

      if (persist) {
        localStorage.setItem(storageKey, collapsed ? '1' : '0');
      }
    };

    const initialCollapsed = localStorage.getItem(storageKey) === '1';
    setCollapsed(initialCollapsed, false);

    toggleBtn.addEventListener('click', () => {
      const collapsed = !document.body.classList.contains('sidebar-collapsed');
      setCollapsed(collapsed, true);
    });

    window.addEventListener('resize', () => {
      if (!isDesktopViewport()) {
        document.body.classList.remove('sidebar-collapsed');
        return;
      }
      setCollapsed(localStorage.getItem(storageKey) === '1', false);
    });

    this.applySidebarLinkTitles();
  },

  applySidebarLinkTitles() {
    const links = document.querySelectorAll('.sidebar .nav-item, .sidebar .nav-item-sub');
    links.forEach((link) => {
      if (link.getAttribute('title')) return;
      const label = link.querySelector('span:not(.icon)');
      const text = label ? label.textContent.trim() : link.textContent.trim();
      if (text) link.setAttribute('title', text);
    });
  },

  ensureModernIconFont() {
    if (document.querySelector('link[data-admin-icons="material-symbols"]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:FILL@0..1&opsz,wght,GRAD@20..48,400,0';
    link.dataset.adminIcons = 'material-symbols';
    document.head.appendChild(link);
  },

  replaceLegacyIcons() {
    const iconOnlySelectors = [
      '.icon',
      '.card-icon',
      '.theme-icon',
      '.status-icon',
      '.btn-close-sidebar span',
      '.btn-fechar',
      '.config-hub-card > span:last-child'
    ];

    iconOnlySelectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach((element) => {
        if (element.dataset.iconized === 'true') return;
        const rawText = element.textContent || '';
        const iconName = this.getModernIconName(rawText);
        if (!iconName) return;
        element.classList.add('material-symbols-rounded');
        if (element.classList.contains('icon')) {
          element.classList.add('icon-modern');
        }
        element.textContent = iconName;
        element.dataset.iconized = 'true';
      });
    });

    const inlineSelectors = [
      'h1',
      'h2',
      'h3',
      'h4',
      '.btn',
      '.action-button',
      '.nav-submenu-title',
      '.info-box h4',
      '.chart-header h3',
      '.config-hub-group h2',
      '.preview-btn',
      '.preview-social-icon'
    ];

    inlineSelectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach((element) => this.replaceLeadingEmojiWithIcon(element));
    });
  },

  replaceLeadingEmojiWithIcon(element) {
    if (!element || element.dataset.iconizedInline === 'true') return;
    if (element.matches('.sidebar-header h2')) return;
    const firstTextNode = Array.from(element.childNodes)
      .find((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 0);
    if (!firstTextNode) return;

    const match = firstTextNode.textContent.match(/^(\s*[\u{1F300}-\u{1FAFF}\u2600-\u27BF\uFE0F]+)\s*(.*)$/u);
    if (!match) return;

    const iconName = this.getModernIconName(match[1]);
    if (!iconName) return;

    const remainingText = match[2] || '';
    const iconEl = document.createElement('span');
    iconEl.className = 'material-symbols-rounded ms-icon-inline';
    iconEl.textContent = iconName;
    iconEl.setAttribute('aria-hidden', 'true');
    element.insertBefore(iconEl, element.firstChild);

    firstTextNode.textContent = remainingText ? ` ${remainingText}` : '';
    element.dataset.iconizedInline = 'true';
  },

  normalizeSidebarHeaderTitle() {
    const title = document.querySelector('.sidebar-header h2');
    if (!title) return;

    const cleanText = (title.textContent || '')
      .replace(/^[\s\u{1F300}-\u{1FAFF}\u2600-\u27BF\uFE0F]+/gu, '')
      .trim();

    title.textContent = cleanText || 'Painel';
  },

  async applyCatalogLinkFromConfig() {
    const link = document.querySelector('.sidebar-nav a.nav-item[target="_blank"]');
    if (!link || !window.ConfigService) return;

    try {
      const config = await ConfigService.buscar();
      const rawUrl = String(config?.catalogoUrl || '').trim();
      if (!rawUrl) return;

      const normalizedUrl = /^(https?:)?\/\//i.test(rawUrl)
        ? rawUrl
        : `https://${rawUrl}`;

      link.setAttribute('href', normalizedUrl);
    } catch (error) {
      // mantém href padrão quando houver falha de leitura
    }
  },

  getModernIconName(rawValue) {
    if (!rawValue) return '';
    const normalizedValue = String(rawValue)
      .replace(/\uFE0F/g, '')
      .replace(/\s+/g, '')
      .trim();

    const iconMap = {
      '📦': 'inventory_2',
      '📊': 'dashboard',
      '📈': 'trending_up',
      '🧑‍💼': 'manage_accounts',
      '⚙': 'settings',
      '🎨': 'palette',
      '🖼': 'image',
      '🔗': 'link',
      '📱': 'smartphone',
      '💳': 'credit_card',
      '💬': 'chat',
      '🌐': 'public',
      '✖': 'close',
      '🌙': 'dark_mode',
      '👁': 'visibility',
      '🛒': 'shopping_cart',
      '✅': 'task_alt',
      '📲': 'phone_in_talk',
      '🗓': 'calendar_month',
      '🕐': 'schedule',
      '🏆': 'emoji_events',
      '➕': 'add',
      '📋': 'checklist',
      '⬇': 'download',
      '🧾': 'receipt_long',
      '🛠': 'handyman',
      'ℹ': 'info',
      '💾': 'save',
      '🏷': 'sell',
      '📢': 'campaign',
      '🕒': 'schedule',
      '📞': 'call',
      '🧩': 'extension',
      '🚚': 'local_shipping',
      '🧭': 'explore',
      '🏪': 'storefront',
      '✨': 'auto_awesome',
      '🔥': 'local_fire_department',
      '🗂': 'folder_open',
      '⭐': 'star',
      '←': 'arrow_back'
    };

    return iconMap[normalizedValue] || '';
  },

  hardenExternalLinks() {
    const links = document.querySelectorAll('a[target="_blank"]');
    links.forEach(link => {
      const rel = link.getAttribute('rel') || '';
      if (!/\bnoopener\b/i.test(rel)) {
        const nextRel = `${rel} noopener noreferrer`.trim();
        link.setAttribute('rel', nextRel);
      }
    });
  },

  organizeQuickActions() {
    const quickConfigLink = document.querySelector('.quick-actions .action-button[href*="configuracoes/visual.html"]');
    if (!quickConfigLink) return;

    quickConfigLink.setAttribute('href', 'configuracoes/index.html');

    const iconEl = quickConfigLink.querySelector('.icon');
    if (iconEl) iconEl.textContent = '⚙️';

    const labelEl = quickConfigLink.querySelector('span:not(.icon)');
    if (labelEl) labelEl.textContent = 'Configurações';
  },

  organizeConfigNavigation() {
    const submenu = document.querySelector('.nav-submenu');
    if (!submenu) return;

    const title = submenu.querySelector('.nav-submenu-title');
    if (!title) return;

    Array.from(submenu.querySelectorAll('.nav-submenu-group')).forEach((group) => group.remove());

    const links = Array.from(submenu.querySelectorAll('.nav-item-sub'));
    if (!links.length) return;

    const linksBySlug = new Map();
    links.forEach((link) => {
      const slug = this.extractConfigSlug(link.getAttribute('href'));
      if (slug) linksBySlug.set(slug, link);
      link.remove();
    });

    const fallbackLink = links[0];
    const hubPrefix = this.resolveConfigPrefix(fallbackLink?.getAttribute('href') || '');
    if (!linksBySlug.has('index') && hubPrefix) {
      const hubLink = document.createElement('a');
      hubLink.className = 'nav-item-sub';
      hubLink.href = `${hubPrefix}index.html`;
      if (fallbackLink && fallbackLink.dataset && fallbackLink.dataset.permission) {
        hubLink.dataset.permission = fallbackLink.dataset.permission;
      }
      hubLink.innerHTML = '<span class="icon">🗂️</span><span>Central de Configurações</span>';
      linksBySlug.set('index', hubLink);
    }

    if (!linksBySlug.has('promocoes') && hubPrefix) {
      const promoLink = document.createElement('a');
      promoLink.className = 'nav-item-sub';
      promoLink.href = `${hubPrefix}promocoes.html`;
      if (fallbackLink && fallbackLink.dataset && fallbackLink.dataset.permission) {
        promoLink.dataset.permission = fallbackLink.dataset.permission;
      }
      promoLink.innerHTML = '<span class="icon">✨</span><span>Promoções</span>';
      linksBySlug.set('promocoes', promoLink);
    }

    const groups = [
      { title: 'Visao Geral', items: ['index'] },
      { title: 'Loja e Identidade', items: ['visual', 'comunicacao'] },
      { title: 'Catalogo e Conteudo', items: ['produtos', 'banners', 'menu-links', 'redes-sociais'] },
      { title: 'Comercial e Entrega', items: ['pagamento', 'cupons', 'promocoes'] },
      { title: 'Rastreio e Integracoes', items: ['tracking'] }
    ];

    groups.forEach((groupConfig) => {
      const groupLinks = groupConfig.items
        .map((slug) => linksBySlug.get(slug))
        .filter(Boolean);

      if (!groupLinks.length) return;

      const group = document.createElement('div');
      group.className = 'nav-submenu-group';

      const groupTitle = document.createElement('span');
      groupTitle.className = 'nav-submenu-group-title';
      groupTitle.textContent = groupConfig.title;

      group.appendChild(groupTitle);
      groupLinks.forEach((link) => {
        group.appendChild(link);
      });
      submenu.appendChild(group);
    });

    const remaining = [];
    linksBySlug.forEach((link, slug) => {
      const alreadyGrouped = groups.some((g) => g.items.includes(slug));
      if (!alreadyGrouped) remaining.push(link);
    });

    if (remaining.length) {
      const group = document.createElement('div');
      group.className = 'nav-submenu-group';

      const groupTitle = document.createElement('span');
      groupTitle.className = 'nav-submenu-group-title';
      groupTitle.textContent = 'Outros';
      group.appendChild(groupTitle);

      remaining.forEach((link) => group.appendChild(link));
      submenu.appendChild(group);
    }
  },

  resolveConfigPrefix(href) {
    const normalizedHref = String(href || '').split('#')[0].split('?')[0];
    const visualSuffix = 'visual.html';
    const visualIndex = normalizedHref.indexOf(visualSuffix);
    if (visualIndex >= 0) {
      return normalizedHref.slice(0, visualIndex);
    }
    const slashIndex = normalizedHref.lastIndexOf('/');
    return slashIndex >= 0 ? normalizedHref.slice(0, slashIndex + 1) : '';
  },

  extractConfigSlug(href) {
    const cleaned = String(href || '').split('#')[0].split('?')[0].trim();
    if (!cleaned) return null;
    const normalized = cleaned.replace(/\\/g, '/');
    const filename = normalized.substring(normalized.lastIndexOf('/') + 1);
    if (!filename.endsWith('.html')) return null;
    return filename.replace(/\.html$/i, '').toLowerCase();
  }
  ,
  captureGlobalErrors() {
    window.LastError = null;
    window.addEventListener('error', (e) => {
      window.LastError = e.error || e.message || 'Erro desconhecido';
    });
    window.addEventListener('unhandledrejection', (e) => {
      window.LastError = e.reason || 'Rejeição não tratada';
    });
  },

  async setupAlertCenter() {
    if (!window.AlertsService) return;

    const container = document.createElement('div');
    container.id = 'alertCenter';
    container.className = 'alert-center';

    const toggle = document.createElement('button');
    toggle.className = 'alert-center-toggle';
    toggle.textContent = 'Alertas';

    const panel = document.createElement('div');
    panel.className = 'alert-center-panel';
    panel.style.display = 'none';

    toggle.addEventListener('click', () => {
      panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    });

    container.appendChild(toggle);
    container.appendChild(panel);
    document.body.appendChild(container);

    const dismissed = new Set(this.getDismissedAlerts());
    const alerts = await AlertsService.listarAlertas();
    const visible = alerts.filter(a => !dismissed.has(a.id));

    if (window.DomUtils) {
      DomUtils.clear(panel);
    } else {
      while (panel.firstChild) panel.removeChild(panel.firstChild);
    }
    if (visible.length === 0) {
      const p = document.createElement('p');
      p.className = 'text-secondary';
      p.textContent = 'Nenhum alerta ativo.';
      panel.appendChild(p);
      toggle.textContent = 'Alertas (0)';
      return;
    }

    toggle.textContent = `Alertas (${visible.length})`;

    visible.forEach(alerta => {
      const card = document.createElement('div');
      card.className = `alert-center-card ${alerta.severidade || 'info'}`;

      const title = document.createElement('strong');
      title.textContent = alerta.tipo || 'Alerta';

      const origin = document.createElement('small');
      origin.className = 'alert-origin';
      origin.textContent = `Origem: ${alerta.origem || 'geral'}`;

      const msg = document.createElement('p');
      msg.textContent = alerta.mensagem || '';

      const rec = document.createElement('p');
      rec.className = 'alert-recomendacao';
      rec.textContent = alerta.recomendacao || 'Corrigir agora';

      const actions = document.createElement('div');
      actions.className = 'alert-actions';

      if (alerta.actionUrl) {
        const link = document.createElement('a');
        link.href = alerta.actionUrl;
        link.className = 'btn btn-secondary';
        link.textContent = 'Corrigir agora';
        actions.appendChild(link);
      }

      const dismiss = document.createElement('button');
      dismiss.className = 'btn btn-secondary';
      dismiss.textContent = 'Dispensar';
      dismiss.addEventListener('click', () => {
        this.dismissAlert(alerta.id);
        card.remove();
      });
      actions.appendChild(dismiss);

      card.appendChild(title);
      card.appendChild(origin);
      card.appendChild(msg);
      card.appendChild(rec);
      card.appendChild(actions);
      panel.appendChild(card);
    });
  },

  getDismissedAlerts() {
    try {
      const raw = localStorage.getItem('alert_center_dismissed');
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  },

  dismissAlert(id) {
    if (!id) return;
    const current = new Set(this.getDismissedAlerts());
    current.add(id);
    localStorage.setItem('alert_center_dismissed', JSON.stringify([...current]));
  }
};

document.addEventListener('DOMContentLoaded', () => {
  AdminShell.init();
});

window.AdminShell = AdminShell;


