/**
 * AuthService - Autenticação
 */

const AuthService = {

  getCurrentUser() {
    return new Promise(resolve => {
      firebase.auth().onAuthStateChanged(user => {
        resolve(user || null);
      });
    });
  },

  async logout() {
    await firebase.auth().signOut();
    window.location.href = '/admin/login.html';
  }
};

window.AuthService = AuthService;
