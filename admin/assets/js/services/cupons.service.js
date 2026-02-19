/**
 * Serviço de Cupons
 */

const CuponsService = {
  collection: 'cupons',
  tiposPermitidos: ['porcentagem', 'valor_fixo', 'primeira_compra', 'por_cliente', 'relampago'],

  async listar() {
    try {
      try {
        const snapshot = await firebaseDb
          .collection(this.collection)
          .orderBy('codigo', 'asc')
          .get();

        const cupons = [];
        snapshot.forEach((doc) => cupons.push({ id: doc.id, ...doc.data() }));
        return cupons;
      } catch (error) {
        if (error?.code === 'failed-precondition') {
          const snapshot = await firebaseDb.collection(this.collection).get();
          const cupons = [];
          snapshot.forEach((doc) => cupons.push({ id: doc.id, ...doc.data() }));
          return cupons.sort((a, b) => String(a.codigo || '').localeCompare(String(b.codigo || '')));
        }
        throw error;
      }
    } catch (error) {
      console.error('Erro ao listar cupons:', error);
      return [];
    }
  },

  async buscarPorId(id) {
    try {
      const doc = await firebaseDb.collection(this.collection).doc(id).get();
      return doc.exists ? { id: doc.id, ...doc.data() } : null;
    } catch (error) {
      console.error('Erro ao buscar cupom:', error);
      return null;
    }
  },

  async criar(cupom) {
    try {
      if (window.RbacService && !RbacService.has('config.write')) {
        return { success: false, error: 'Sem permissão para criar cupom' };
      }

      const payload = this.sanitize(cupom, true);
      const validacao = this.validar(payload);
      if (!validacao.valido) {
        return { success: false, error: validacao.erros.join('\n') };
      }

      const ref = await firebaseDb.collection(this.collection).add(payload);

      if (window.AuditService) {
        await AuditService.log({
          action: 'cupom_create',
          entity: 'cupom',
          entityId: ref.id,
          before: null,
          after: payload
        });
      }

      return { success: true, id: ref.id };
    } catch (error) {
      console.error('Erro ao criar cupom:', error);
      return { success: false, error: error.message };
    }
  },

  async atualizar(id, cupom) {
    try {
      if (window.RbacService && !RbacService.has('config.write')) {
        return { success: false, error: 'Sem permissão para atualizar cupom' };
      }

      const atual = await this.buscarPorId(id);
      if (!atual) return { success: false, error: 'Cupom não encontrado' };

      const payload = this.sanitize(cupom, false);
      const validacao = this.validar(payload);
      if (!validacao.valido) {
        return { success: false, error: validacao.erros.join('\n') };
      }

      await firebaseDb.collection(this.collection).doc(id).update(payload);

      if (window.AuditService) {
        await AuditService.log({
          action: 'cupom_update',
          entity: 'cupom',
          entityId: id,
          before: atual,
          after: payload
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Erro ao atualizar cupom:', error);
      return { success: false, error: error.message };
    }
  },

  async deletar(id) {
    try {
      if (window.RbacService && !RbacService.has('config.write')) {
        return { success: false, error: 'Sem permissão para deletar cupom' };
      }

      const atual = await this.buscarPorId(id);
      await firebaseDb.collection(this.collection).doc(id).delete();

      if (window.AuditService) {
        await AuditService.log({
          action: 'cupom_delete',
          entity: 'cupom',
          entityId: id,
          before: atual,
          after: null
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Erro ao deletar cupom:', error);
      return { success: false, error: error.message };
    }
  },

  sanitize(cupom = {}, isCreate = false) {
    const parseList = (value) => {
      const source = Array.isArray(value)
        ? value
        : String(value || '').split(',');

      return source
        .map((item) => DomUtils.sanitizeText(item, 120))
        .filter(Boolean)
        .slice(0, 50);
    };

    const codigo = String(cupom.codigo || '').trim().toUpperCase().replace(/\s+/g, '');
    const tipoRaw = String(cupom.tipo || 'porcentagem').trim().toLowerCase();
    const tipo = this.tiposPermitidos.includes(tipoRaw) ? tipoRaw : 'porcentagem';

    const payload = {
      codigo,
      tipo,
      valor: Number(cupom.valor || 0),
      ativo: cupom.ativo !== false,
      validadeInicio: String(cupom.validadeInicio || '').trim(),
      validadeFim: String(cupom.validadeFim || '').trim(),
      limiteUso: Math.max(0, Math.trunc(Number(cupom.limiteUso || 0))),
      limitePorCliente: Math.max(0, Math.trunc(Number(cupom.limitePorCliente || 0))),
      subtotalMinimo: Math.max(0, Number(cupom.subtotalMinimo || 0)),
      descontoMaximo: Math.max(0, Number(cupom.descontoMaximo || 0)),
      regras: {
        entregaPermitida: parseList(cupom.entregaPermitida).map((v) => v.toLowerCase()),
        pagamentosPermitidos: parseList(cupom.pagamentosPermitidos).map((v) => v.toUpperCase()),
        categorias: parseList(cupom.categorias),
        marcas: parseList(cupom.marcas),
        produtoIds: parseList(cupom.produtoIds)
      },
      atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
    };

    if (isCreate) {
      payload.criadoEm = firebase.firestore.FieldValue.serverTimestamp();
    }

    return payload;
  },

  validar(cupom = {}) {
    const erros = [];

    if (!cupom.codigo || cupom.codigo.length < 3) {
      erros.push('Código deve ter ao menos 3 caracteres.');
    }

    if (!this.tiposPermitidos.includes(cupom.tipo)) {
      erros.push('Tipo de cupom inválido.');
    }

    if (!Number.isFinite(cupom.valor) || cupom.valor <= 0) {
      erros.push('Valor do cupom deve ser maior que zero.');
    }

    if (cupom.tipo !== 'valor_fixo' && cupom.valor > 100) {
      erros.push('Para tipos percentuais, valor máximo é 100%.');
    }

    if (cupom.validadeInicio && cupom.validadeFim && cupom.validadeInicio > cupom.validadeFim) {
      erros.push('Validade inicial não pode ser maior que a validade final.');
    }

    return { valido: erros.length === 0, erros };
  }
};

window.CuponsService = CuponsService;
