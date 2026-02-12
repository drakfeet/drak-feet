/**
 * UserRepairService removido por segurança.
 * Correções de role/ativo devem ser feitas apenas por backend confiável.
 */
window.UserRepairService = {
  async repairCurrentUser() {
    return {
      success: false,
      error: 'Funcionalidade desativada por segurança em produção.'
    };
  }
};
