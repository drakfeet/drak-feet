/**
 * Serviço de Autenticação
 * Gerencia login, logout e verificação de usuário
 */

const AuthService = {
  /**
   * Realiza login do usuário
   * @param {string} email 
   * @param {string} password 
   * @returns {Promise<object>}
   */
  async login(email, password) {
    try {
      console.info('🔐 Iniciando login...');
      const userCredential = await firebaseAuth.signInWithEmailAndPassword(email, password);
      console.info('✅ Login realizado com sucesso');
      return { success: true, user: userCredential.user };
    } catch (error) {
      console.error('❌ Erro no login:', error.code);
      return { 
        success: false, 
        error: this.getErrorMessage(error.code) 
      };
    }
  },

  /**
   * Realiza logout do usuário
   */
  async logout() {
    try {
      await firebaseAuth.signOut();
      console.info('✅ Logout realizado');
      window.location.href = '/admin/login.html';
    } catch (error) {
      console.error('❌ Erro no logout:', error);
    }
  },

  /**
   * Verifica se há usuário autenticado
   * @returns {Promise<object|null>}
   */
  getCurrentUser() {
    return new Promise((resolve) => {
      firebaseAuth.onAuthStateChanged(user => {
        resolve(user);
      });
    });
  },

  /**
   * Traduz códigos de erro do Firebase
   * @param {string} errorCode 
   * @returns {string}
   */
  getErrorMessage(errorCode) {
    const messages = {
      'auth/invalid-email': 'Email inválido',
      'auth/user-disabled': 'Usuário desabilitado',
      'auth/user-not-found': 'Usuário não encontrado',
      'auth/wrong-password': 'Senha incorreta',
      'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde',
      'auth/network-request-failed': 'Erro de conexão. Verifique sua internet'
    };
    return messages[errorCode] || 'Erro ao fazer login. Tente novamente';
  }
};

// Exportar para uso global
window.AuthService = AuthService;