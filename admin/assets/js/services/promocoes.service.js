/**
 * Servico de Promocoes
 */

const PromocoesService = {
  collection: 'promocoes',
  tiposPermitidos: ['porcentagem', 'valor_fixo', 'loja_inteira_percentual', 'compre_2_ou_mais', 'compre_1_leve_2', 'progressivo'],

  async listar() {
    try {
      try {
        const snapshot = await firebaseDb
          .collection(this.collection)
          .orderBy('nome', 'asc')
          .get();

        const promocoes = [];
        snapshot.forEach((doc) => promocoes.push({ id: doc.id, ...doc.data() }));
        return promocoes;
      } catch (error) {
        if (error?.code === 'failed-precondition') {
          const snapshot = await firebaseDb.collection(this.collection).get();
          const promocoes = [];
          snapshot.forEach((doc) => promocoes.push({ id: doc.id, ...doc.data() }));
          return promocoes.sort((a, b) => String(a.nome || '').localeCompare(String(b.nome || '')));
        }
        throw error;
      }
    } catch (error) {
      console.error('Erro ao listar promocoes:', error);
      return [];
    }
  },

  async buscarPorId(id) {
    try {
      const doc = await firebaseDb.collection(this.collection).doc(id).get();
      return doc.exists ? { id: doc.id, ...doc.data() } : null;
    } catch (error) {
      console.error('Erro ao buscar promocao:', error);
      return null;
    }
  },

  async criar(promocao) {
    try {
      if (window.RbacService && !RbacService.has('config.write')) {
        return { success: false, error: 'Sem permissao para criar promocao' };
      }

      const payload = this.sanitize(promocao, true);
      const validacao = this.validar(payload);
      if (!validacao.valido) {
        return { success: false, error: validacao.erros.join('\n') };
      }

      const ref = await firebaseDb.collection(this.collection).add(payload);

      if (window.AuditService) {
        await AuditService.log({
          action: 'promocao_create',
          entity: 'promocao',
          entityId: ref.id,
          before: null,
          after: payload
        });
      }

      return { success: true, id: ref.id };
    } catch (error) {
      console.error('Erro ao criar promocao:', error);
      return { success: false, error: error.message };
    }
  },

  async atualizar(id, promocao) {
    try {
      if (window.RbacService && !RbacService.has('config.write')) {
        return { success: false, error: 'Sem permissao para atualizar promocao' };
      }

      const atual = await this.buscarPorId(id);
      if (!atual) return { success: false, error: 'Promocao nao encontrada' };

      const payload = this.sanitize(promocao, false);
      const validacao = this.validar(payload);
      if (!validacao.valido) {
        return { success: false, error: validacao.erros.join('\n') };
      }

      await firebaseDb.collection(this.collection).doc(id).update(payload);

      if (window.AuditService) {
        await AuditService.log({
          action: 'promocao_update',
          entity: 'promocao',
          entityId: id,
          before: atual,
          after: payload
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Erro ao atualizar promocao:', error);
      return { success: false, error: error.message };
    }
  },

  async deletar(id) {
    try {
      if (window.RbacService && !RbacService.has('config.write')) {
        return { success: false, error: 'Sem permissao para deletar promocao' };
      }

      const atual = await this.buscarPorId(id);
      await firebaseDb.collection(this.collection).doc(id).delete();

      if (window.AuditService) {
        await AuditService.log({
          action: 'promocao_delete',
          entity: 'promocao',
          entityId: id,
          before: atual,
          after: null
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Erro ao deletar promocao:', error);
      return { success: false, error: error.message };
    }
  },

  sanitize(promocao = {}, isCreate = false) {
    const parseList = (value) => {
      const source = Array.isArray(value) ? value : String(value || '').split(',');
      return source
        .map((item) => DomUtils.sanitizeText(item, 120))
        .filter(Boolean)
        .slice(0, 50);
    };

    const tipoRaw = String(promocao.tipo || 'porcentagem').trim().toLowerCase();
    const tipo = this.tiposPermitidos.includes(tipoRaw) ? tipoRaw : 'porcentagem';
    const parseNiveis = (value) => {
      const source = Array.isArray(value)
        ? value
        : String(value || '').split(/\r?\n|,/);
      return source
        .map((item) => DomUtils.sanitizeText(item, 30))
        .filter(Boolean)
        .slice(0, 20);
    };

    const payload = {
      nome: DomUtils.sanitizeText(promocao.nome, 80),
      tipo,
      valor: Number(promocao.valor || 0),
      ativo: promocao.ativo !== false,
      validadeInicio: String(promocao.validadeInicio || '').trim(),
      validadeFim: String(promocao.validadeFim || '').trim(),
      prioridade: Math.max(0, Math.trunc(Number(promocao.prioridade || 0))),
      acumulavelComCupom: promocao.acumulavelComCupom === true,
      subtotalMinimo: Math.max(0, Number(promocao.subtotalMinimo || 0)),
      descontoMaximo: Math.max(0, Number(promocao.descontoMaximo || 0)),
      regras: {
        entregaPermitida: parseList(promocao.entregaPermitida).map((v) => v.toLowerCase()),
        pagamentosPermitidos: parseList(promocao.pagamentosPermitidos).map((v) => v.toUpperCase()),
        categorias: parseList(promocao.categorias),
        marcas: parseList(promocao.marcas),
        produtoIds: parseList(promocao.produtoIds),
        qtdMinima: Math.max(0, Math.trunc(Number(promocao.qtdMinima || 0))),
        qtdPaga: Math.max(0, Math.trunc(Number(promocao.qtdPaga || 0))),
        qtdLeva: Math.max(0, Math.trunc(Number(promocao.qtdLeva || 0))),
        niveisProgressivos: parseNiveis(promocao.niveisProgressivos)
      },
      atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
    };

    if (isCreate) {
      payload.criadoEm = firebase.firestore.FieldValue.serverTimestamp();
    }

    return payload;
  },

  validar(promocao = {}) {
    const erros = [];
    const regras = promocao.regras && typeof promocao.regras === 'object' ? promocao.regras : {};
    const precisaValor = ['porcentagem', 'valor_fixo', 'loja_inteira_percentual', 'compre_2_ou_mais'].includes(promocao.tipo);

    if (!promocao.nome || promocao.nome.length < 3) {
      erros.push('Nome da promocao deve ter ao menos 3 caracteres.');
    }
    if (!this.tiposPermitidos.includes(promocao.tipo)) {
      erros.push('Tipo de promocao invalido.');
    }
    if (precisaValor && (!Number.isFinite(promocao.valor) || promocao.valor <= 0)) {
      erros.push('Valor da promocao deve ser maior que zero.');
    }
    if (['porcentagem', 'loja_inteira_percentual', 'compre_2_ou_mais'].includes(promocao.tipo) && promocao.valor > 100) {
      erros.push('Para promocao percentual, valor maximo e 100%.');
    }
    if (promocao.tipo === 'compre_2_ou_mais' && Number(regras.qtdMinima || 0) < 2) {
      erros.push('Compre 2+ exige quantidade minima de pelo menos 2 itens.');
    }
    if (promocao.tipo === 'compre_1_leve_2') {
      const paga = Number(regras.qtdPaga || 0);
      const leva = Number(regras.qtdLeva || 0);
      if (paga < 1 || leva < 2 || leva <= paga) {
        erros.push('Compre/leve invalido. Use valores como paga=1 e leva=2.');
      }
    }
    if (promocao.tipo === 'progressivo' && (!Array.isArray(regras.niveisProgressivos) || !regras.niveisProgressivos.length)) {
      erros.push('Desconto progressivo exige niveis (ex.: 2:5).');
    }
    if (promocao.validadeInicio && promocao.validadeFim && promocao.validadeInicio > promocao.validadeFim) {
      erros.push('Validade inicial nao pode ser maior que a validade final.');
    }

    return { valido: erros.length === 0, erros };
  }
};

window.PromocoesService = PromocoesService;
