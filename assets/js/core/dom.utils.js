/**
 * DOM and sanitization helpers (client-side safety)
 */

const DomUtils = {
  escapeHtml(value) {
    const text = String(value ?? '');
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  sanitizeText(value, maxLen) {
    let text = String(value ?? '').trim();
    if (maxLen && text.length > maxLen) {
      text = text.slice(0, maxLen);
    }
    return text;
  },

  sanitizeUrl(value) {
    const url = String(value ?? '').trim();
    if (!url) return '';

    if (url.startsWith('#') || url.startsWith('/')) {
      return url;
    }

    try {
      const parsed = new URL(url, window.location.origin);
      if (['http:', 'https:', 'mailto:', 'tel:'].includes(parsed.protocol)) {
        return parsed.href;
      }
    } catch {
      return '';
    }

    return '';
  },

  isExternalUrl(value) {
    try {
      const parsed = new URL(value, window.location.origin);
      return parsed.origin !== window.location.origin;
    } catch {
      return false;
    }
  },

  clear(el) {
    if (!el) return;
    while (el.firstChild) el.removeChild(el.firstChild);
  }
};

window.DomUtils = DomUtils;

const AppAlert = {
  queue: [],
  showing: false,
  styleInjected: false,

  inferType(message) {
    const text = String(message || '');
    if (text.includes('❌') || /erro|falha|inv[aá]lido|negado/i.test(text)) return 'error';
    if (text.includes('✅') || /sucesso|salvo|conclu[ií]do/i.test(text)) return 'success';
    if (text.includes('⚠') || /aten[cç][aã]o|aguarde|limite/i.test(text)) return 'warning';
    return 'info';
  },

  injectStyle() {
    if (this.styleInjected || document.getElementById('app-alert-style')) return;

    const style = document.createElement('style');
    style.id = 'app-alert-style';
    style.textContent = `
      .app-alert-overlay {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.55);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 100000;
        padding: 20px;
      }
      .app-alert-card {
        width: min(460px, 100%);
        border-radius: 14px;
        background: #0f172a;
        color: #e2e8f0;
        border: 1px solid #1e293b;
        box-shadow: 0 18px 50px rgba(2, 6, 23, 0.45);
        overflow: hidden;
      }
      .app-alert-head {
        padding: 14px 18px;
        font-weight: 700;
        letter-spacing: 0.2px;
      }
      .app-alert-head.info { background: #0b2f4a; color: #bae6fd; }
      .app-alert-head.success { background: #052e1a; color: #bbf7d0; }
      .app-alert-head.warning { background: #422006; color: #fde68a; }
      .app-alert-head.error { background: #4c0519; color: #fecdd3; }
      .app-alert-body {
        padding: 18px;
        line-height: 1.45;
        white-space: pre-line;
        word-break: break-word;
      }
      .app-alert-actions {
        display: flex;
        justify-content: flex-end;
        padding: 0 18px 18px;
      }
      .app-alert-btn {
        border: 0;
        border-radius: 10px;
        padding: 10px 16px;
        font-weight: 600;
        cursor: pointer;
        background: #38bdf8;
        color: #082f49;
      }
      .app-alert-btn:hover { filter: brightness(1.05); }
    `;
    document.head.appendChild(style);
    this.styleInjected = true;
  },

  show(message, type) {
    this.queue.push({
      message: String(message ?? ''),
      type: type || this.inferType(message)
    });
    this.renderNext();
  },

  renderNext() {
    if (this.showing || this.queue.length === 0) return;
    this.showing = true;
    this.injectStyle();

    const item = this.queue.shift();
    const overlay = document.createElement('div');
    overlay.className = 'app-alert-overlay';
    overlay.innerHTML = `
      <div class="app-alert-card" role="alertdialog" aria-modal="true">
        <div class="app-alert-head ${item.type}">${this.getTitle(item.type)}</div>
        <div class="app-alert-body"></div>
        <div class="app-alert-actions">
          <button type="button" class="app-alert-btn">OK</button>
        </div>
      </div>
    `;

    const body = overlay.querySelector('.app-alert-body');
    if (body) body.textContent = item.message;

    const close = () => {
      overlay.remove();
      this.showing = false;
      this.renderNext();
    };

    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) close();
    });
    overlay.querySelector('.app-alert-btn')?.addEventListener('click', close);
    document.addEventListener('keydown', function onKey(event) {
      if (event.key === 'Escape') {
        document.removeEventListener('keydown', onKey);
        close();
      }
    });

    document.body.appendChild(overlay);
  },

  getTitle(type) {
    if (type === 'success') return 'Sucesso';
    if (type === 'warning') return 'Atenção';
    if (type === 'error') return 'Erro';
    return 'Informação';
  }
};

window.AppAlert = AppAlert;

if (!window.__nativeAlert) {
  window.__nativeAlert = window.alert.bind(window);
  window.alert = function visualAlert(message) {
    if (window.AppAlert && typeof window.AppAlert.show === 'function') {
      window.AppAlert.show(message);
      return;
    }
    window.__nativeAlert(message);
  };
}

