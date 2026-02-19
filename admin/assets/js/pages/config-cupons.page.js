/**
 * Página: Configurações > Cupons
 */
const ConfigCuponsPage = {
  init() {
    if (window.CuponsUI) {
      CuponsUI.init();
    }
  }
};

document.addEventListener('DOMContentLoaded', () => ConfigCuponsPage.init());
window.ConfigCuponsPage = ConfigCuponsPage;
