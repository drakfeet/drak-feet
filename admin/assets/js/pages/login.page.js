/**
 * Página: Login
 */
const LoginPage = {
  init() {
    if (typeof AuthService === 'undefined') {
      console.error('AuthService não foi carregado');
      return;
    }

    const form = document.getElementById('loginForm');
    if (!form) return;

    this.renderReasonMessage();
    form.addEventListener('submit', (e) => this.onSubmit(e));
  },

  renderReasonMessage() {
    const params = new URLSearchParams(window.location.search);
    const reason = params.get('reason');
    const errorDiv = document.getElementById('errorMessage');
    if (!errorDiv) return;

    if (reason === 'permission_denied') {
      errorDiv.textContent = 'Acesso negado para sua conta nesta página. Faça login com um usuário autorizado.';
      errorDiv.style.display = 'block';
      if (window.AuthService) {
        AuthService.loginAttempts = {};
        try {
          localStorage.setItem('loginAttempts', JSON.stringify({}));
        } catch (e) {
          // ignore
        }
      }
    } else if (reason === 'session_expired') {
      errorDiv.textContent = 'Sua sessão expirou. Faça login novamente.';
      errorDiv.style.display = 'block';
    }
  },

  async onSubmit(e) {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('errorMessage');
    const submitBtn = e.target.querySelector('button[type="submit"]');

    errorDiv.style.display = 'none';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Entrando...';

    try {
      const result = await AuthService.login(email, password);

      if (!result.success) {
        throw new Error(result.error);
      }

      const urlParams = new URLSearchParams(window.location.search);
      const redirectParam = urlParams.get('redirect');
      const safeRedirect = AuthService.getSafeRedirect(redirectParam);
      window.location.href = safeRedirect;

    } catch (err) {
      errorDiv.textContent = err.message || 'Erro ao fazer login';
      errorDiv.style.display = 'block';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Entrar';
    }
  }
};

document.addEventListener('DOMContentLoaded', () => LoginPage.init());
window.LoginPage = LoginPage;
