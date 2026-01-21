/**
 * Serviço de Tracking
 * Gerencia Facebook Pixel e Google Analytics 4
 */

const TrackingService = {
  config: null,
  facebookInitialized: false,
  gaInitialized: false,

  /**
   * Inicializa tracking com base nas configurações
   * @param {object} config
   */
  init(config) {
    this.config = config || {};

    // Facebook Pixel
    if (this.config.pixelFacebook && this.config.pixelFacebook.trim() !== '') {
      this.initFacebookPixel(this.config.pixelFacebook.trim());
    }

    // Google Analytics
    if (this.config.gaMeasurementId && this.config.gaMeasurementId.trim() !== '') {
      this.initGA(this.config.gaMeasurementId.trim());
    }
  },

  /**
   * Inicializa Facebook Pixel
   * @param {string} pixelId
   */
  initFacebookPixel(pixelId) {
    try {
      if (this.facebookInitialized) return;

      !function (f, b, e, v, n, t, s) {
        if (f.fbq) return;
        n = f.fbq = function () {
          n.callMethod
            ? n.callMethod.apply(n, arguments)
            : n.queue.push(arguments);
        };
        if (!f._fbq) f._fbq = n;
        n.push = n;
        n.loaded = !0;
        n.version = '2.0';
        n.queue = [];
        t = b.createElement(e);
        t.async = !0;
        t.src = v;
        s = b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t, s);
      }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

      fbq('init', pixelId);
      fbq('track', 'PageView');

      this.facebookInitialized = true;
      console.info('✅ Facebook Pixel inicializado:', pixelId);
    } catch (error) {
      console.warn('⚠️ Erro ao inicializar Facebook Pixel:', error);
    }
  },

  /**
   * Inicializa Google Analytics 4
   * @param {string} measurementId
   */
  initGA(measurementId) {
    try {
      if (this.gaInitialized) return;

      window.dataLayer = window.dataLayer || [];
      window.gtag = function () {
        window.dataLayer.push(arguments);
      };

      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;

      script.onload = () => {
        gtag('js', new Date());
        gtag('config', measurementId, {
          send_page_view: true
        });

        this.gaInitialized = true;
        console.info('✅ Google Analytics inicializado:', measurementId);
      };

      script.onerror = () => {
        console.warn('⚠️ Falha ao carregar Google Analytics');
      };

      document.head.appendChild(script);
    } catch (error) {
      console.warn('⚠️ Erro ao inicializar Google Analytics:', error);
    }
  },

  /**
   * Evento de contato Facebook
   * @param {object} dados
   */
  trackFacebookContact(dados) {
    if (!this.facebookInitialized || typeof fbq === 'undefined') return;

    try {
      fbq('track', 'Contact', {
        content_name: dados.produtoNome,
        content_category: dados.marca,
        value: dados.valor,
        currency: 'BRL'
      });
      console.info('✅ Evento Contact enviado ao Facebook');
    } catch (error) {
      console.warn('⚠️ Erro ao enviar evento Facebook:', error);
    }
  },

  /**
   * Evento Google Analytics
   * @param {string} eventName
   * @param {object} dados
   */
  trackGAEvent(eventName, dados) {
    if (!this.gaInitialized || typeof gtag === 'undefined') return;

    try {
      gtag('event', eventName, dados);
      console.info('✅ Evento enviado ao Google Analytics:', eventName);
    } catch (error) {
      console.warn('⚠️ Erro ao enviar evento GA:', error);
    }
  },

  /**
   * Clique no WhatsApp
   * @param {object} dados
   */
  trackWhatsAppClick(dados) {
    this.trackFacebookContact({
      produtoNome: dados.nome,
      marca: dados.marca,
      valor: dados.valor
    });

    this.trackGAEvent('whatsapp_contact', {
      product_name: dados.nome,
      product_brand: dados.marca,
      product_size: dados.tamanho,
      payment_method: dados.pagamento,
      value: dados.valor,
      currency: 'BRL'
    });
  }
};

// Disponibilizar globalmente
window.TrackingService = TrackingService;
