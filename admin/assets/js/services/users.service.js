/**
 * Users Service (Admin)
 */
const UsersService = {
  collection: 'usuarios',
  allowedSelfProvisionRoles: ['admin', 'editor', 'analista', 'analyst'],

  async getProfile(uid) {
    if (!uid) return null;
    try {
      const doc = await firebaseDb.collection(this.collection).doc(uid).get();
      return doc.exists ? { id: doc.id, ...doc.data() } : null;
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      return null;
    }
  },

  async ensureProfile(user) {
    if (!user || !user.uid) return false;
    try {
      const ref = firebaseDb.collection(this.collection).doc(user.uid);
      const doc = await ref.get();
      if (doc.exists) return true;
      if (!user.email) return false;

      const inviteRef = firebaseDb.collection(this.collection).doc(String(user.email).trim());
      const inviteDoc = await inviteRef.get();
      if (!inviteDoc.exists) {
        return false;
      }

      const invite = inviteDoc.data() || {};
      const inviteRole = String(invite.role || '').trim().toLowerCase();
      if (!this.allowedSelfProvisionRoles.includes(inviteRole) || invite.ativo !== true) {
        return false;
      }

      await ref.set({
        email: user.email,
        role: inviteRole === 'analyst' ? 'analista' : inviteRole,
        ativo: true,
        displayName: user.displayName || String(invite.displayName || ''),
        criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
        atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      return true;
    } catch (error) {
      console.warn('Não foi possível garantir perfil:', error);
      return false;
    }
  },

  async listar() {
    try {
      const snapshot = await firebaseDb.collection(this.collection).orderBy('email').get();
      const users = [];
      snapshot.forEach(doc => users.push({ id: doc.id, ...doc.data() }));
      return users;
    } catch (error) {
      console.error('Erro ao listar usuários:', error);
      return [];
    }
  },

  async atualizarRole(userId, role) {
    try {
      await firebaseDb.collection(this.collection).doc(userId).set({
        role,
        atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      return { success: true };
    } catch (error) {
      console.error('Erro ao atualizar role:', error);
      return { success: false, error: error.message };
    }
  },

  async atualizarAtivo(userId, ativo) {
    try {
      await firebaseDb.collection(this.collection).doc(userId).set({
        ativo: !!ativo,
        atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      return { success: true };
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      return { success: false, error: error.message };
    }
  },

  async criar({ email, role = 'editor', ativo = true, displayName = '' }) {
    try {
      if (window.RbacService && !RbacService.has('admin.users')) {
        return { success: false, error: 'Sem permissão para cadastrar usuários' };
      }

      const emailClean = String(email || '').trim();
      if (!emailClean) {
        return { success: false, error: 'Email é obrigatório' };
      }

      const allowedRoles = ['admin', 'editor', 'analista'];
      const roleClean = allowedRoles.includes(role) ? role : 'editor';

      const docRef = firebaseDb.collection(this.collection).doc(emailClean);
      const snapshot = await docRef.get();
      if (snapshot.exists) {
        return { success: false, error: 'Usuário já cadastrado' };
      }

      await docRef.set({
        email: emailClean,
        role: roleClean,
        ativo: !!ativo,
        displayName: String(displayName || '').trim(),
        criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
        atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      return { success: true };
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      return { success: false, error: error.message };
    }
  }
};

window.UsersService = UsersService;
