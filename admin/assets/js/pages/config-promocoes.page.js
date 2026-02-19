/**
 * Pagina: Configuracoes > Promocoes
 */
const ConfigPromocoesPage = {
  init() {
    if (window.PromocoesUI) {
      PromocoesUI.init();
    }
  }
};

document.addEventListener('DOMContentLoaded', () => ConfigPromocoesPage.init());
window.ConfigPromocoesPage = ConfigPromocoesPage;
