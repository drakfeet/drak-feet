/**
 * UI de Promocoes
 */

let promocaoEditandoId = null;

const promocoesRuleCatalog = {
  entrega: [],
  pagamentos: [],
  categorias: [],
  marcas: [],
  produtos: []
};

const promocoesRuleSelection = {
  entrega: new Set(),
  pagamentos: new Set(),
  categorias: new Set(),
  marcas: new Set(),
  produtoIds: new Set()
};

const PromocoesUI = {
  maxProdutosSelecionados: 50,
  produtosPage: 1,
  produtosPageSize: 50,
  produtosFiltrados: [],
  buscaProdutosDebounce: null,

  init() {
    this.bind();
    this.carregarOpcoesRegra().finally(() => this.carregar());
  },

  bind() {
    document.getElementById('btnNovaPromocao')?.addEventListener('click', () => this.abrirModal());
    document.getElementById('formPromocao')?.addEventListener('submit', (event) => this.salvar(event));

    document.querySelectorAll('.js-close-modal-promocao').forEach((el) => {
      el.addEventListener('click', () => this.fecharModal());
    });

    document.getElementById('promocaoProdutoBusca')?.addEventListener('input', () => this.onBuscaProdutosInput());
    document.getElementById('promocaoProdutoSomenteAtivos')?.addEventListener('change', () => {
      this.produtosPage = 1;
      this.renderProdutos();
    });
    document.getElementById('btnPromocaoSelecionarFiltrados')?.addEventListener('click', () => this.selecionarProdutosFiltrados());
    document.getElementById('btnPromocaoLimparProdutos')?.addEventListener('click', () => this.limparProdutosSelecionados());
    document.getElementById('promocaoProdutoPageSize')?.addEventListener('change', () => this.onProdutosPageSizeChange());
    document.getElementById('btnPromocaoProdutoPrev')?.addEventListener('click', () => this.goToProdutosPage(this.produtosPage - 1));
    document.getElementById('btnPromocaoProdutoNext')?.addEventListener('click', () => this.goToProdutosPage(this.produtosPage + 1));

    const tipo = document.getElementById('promocaoTipo');
    if (tipo) {
      tipo.addEventListener('change', () => this.atualizarAjudaTipo());
      this.atualizarAjudaTipo();
    }
  },

  async carregarOpcoesRegra() {
    const configPromise = (window.ConfigService && typeof ConfigService.buscar === 'function')
      ? ConfigService.buscar()
      : Promise.resolve({});
    const produtosPromise = (window.ProdutosService && typeof ProdutosService.listar === 'function')
      ? ProdutosService.listar()
      : Promise.resolve([]);

    const [configRaw, produtosRaw] = await Promise.all([configPromise, produtosPromise]);
    const config = (configRaw && typeof configRaw === 'object') ? configRaw : {};
    const produtos = Array.isArray(produtosRaw) ? produtosRaw : [];

    promocoesRuleCatalog.entrega = this.resolveOpcoesEntrega(config);
    promocoesRuleCatalog.pagamentos = this.resolveOpcoesPagamento(config);
    promocoesRuleCatalog.categorias = this.resolveOpcoesTexto(
      this.mergeDistinct(
        this.normalizeList(config.categoriasCadastradas),
        this.normalizeList(produtos.map((item) => item?.categoria))
      )
    );
    promocoesRuleCatalog.marcas = this.resolveOpcoesTexto(
      this.mergeDistinct(
        this.normalizeList(config.marcasCadastradas),
        this.normalizeList(produtos.map((item) => item?.marca))
      )
    );
    promocoesRuleCatalog.produtos = produtos
      .map((item) => ({
        id: String(item?.id || '').trim(),
        nome: String(item?.nome || '').trim(),
        marca: String(item?.marca || '').trim(),
        categoria: String(item?.categoria || '').trim(),
        ativo: item?.ativo !== false
      }))
      .filter((item) => item.id && item.nome)
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

    this.renderRuleOptions();
  },

  resolveOpcoesEntrega(config) {
    const opcoes = [];
    if (config.entregaRetiradaAtivo !== false) opcoes.push({ value: 'retirada', label: 'Retirada' });
    if (config.entregaMotoboyAtivo !== false) opcoes.push({ value: 'motoboy', label: 'Motoboy' });
    if (!opcoes.length) {
      opcoes.push({ value: 'retirada', label: 'Retirada' });
      opcoes.push({ value: 'motoboy', label: 'Motoboy' });
    }
    return opcoes;
  },

  resolveOpcoesPagamento(config) {
    const opcoes = [
      { value: 'PIX', label: 'PIX' },
      { value: 'CARTAO', label: 'Cartao' }
    ];
    if (config.aceitaDinheiro === true) opcoes.push({ value: 'DINHEIRO', label: 'Dinheiro' });
    if (config.aceitaBoleto === true) opcoes.push({ value: 'BOLETO', label: 'Boleto' });
    return opcoes;
  },

  resolveOpcoesTexto(lista = []) {
    return lista.map((item) => ({ value: item, label: item }));
  },

  renderRuleOptions() {
    this.renderOptionGrid('promocaoEntregaPermitidaOptions', promocoesRuleCatalog.entrega, promocoesRuleSelection.entrega);
    this.renderOptionGrid('promocaoPagamentosPermitidosOptions', promocoesRuleCatalog.pagamentos, promocoesRuleSelection.pagamentos);
    this.renderOptionGrid('promocaoCategoriasOptions', promocoesRuleCatalog.categorias, promocoesRuleSelection.categorias);
    this.renderOptionGrid('promocaoMarcasOptions', promocoesRuleCatalog.marcas, promocoesRuleSelection.marcas);
    this.renderProdutos();
  },

  renderOptionGrid(containerId, options, selectedSet) {
    const container = document.getElementById(containerId);
    if (!container) return;
    DomUtils.clear(container);

    if (!Array.isArray(options) || !options.length) {
      const empty = document.createElement('span');
      empty.className = 'coupon-option-empty';
      empty.textContent = 'Nenhuma opcao cadastrada.';
      container.appendChild(empty);
      return;
    }

    options.forEach((option) => {
      const value = String(option?.value || '').trim();
      if (!value) return;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `coupon-option-chip ${selectedSet.has(value) ? 'selected' : ''}`;
      btn.textContent = option?.label || value;
      btn.addEventListener('click', () => {
        if (selectedSet.has(value)) selectedSet.delete(value);
        else selectedSet.add(value);
        btn.classList.toggle('selected', selectedSet.has(value));
      });
      container.appendChild(btn);
    });
  },

  renderProdutos() {
    const container = document.getElementById('promocaoProdutoIdsOptions');
    if (!container) return;
    DomUtils.clear(container);

    if (!promocoesRuleCatalog.produtos.length) {
      const empty = document.createElement('span');
      empty.className = 'coupon-option-empty';
      empty.textContent = 'Nenhum produto cadastrado.';
      container.appendChild(empty);
      this.renderProdutosInfo();
      this.renderProdutosPaginacao();
      return;
    }

    const filtrados = this.getProdutosFiltrados();
    this.produtosFiltrados = filtrados;
    const totalPaginas = Math.max(1, Math.ceil(filtrados.length / this.produtosPageSize));
    if (this.produtosPage > totalPaginas) this.produtosPage = totalPaginas;
    if (this.produtosPage < 1) this.produtosPage = 1;

    if (!filtrados.length) {
      const empty = document.createElement('span');
      empty.className = 'coupon-option-empty';
      empty.textContent = 'Nenhum produto encontrado para o filtro.';
      container.appendChild(empty);
      this.renderProdutosInfo();
      this.renderProdutosPaginacao();
      return;
    }

    const inicio = (this.produtosPage - 1) * this.produtosPageSize;
    const fim = inicio + this.produtosPageSize;
    const paginaAtual = filtrados.slice(inicio, fim);

    paginaAtual.forEach((item) => {
      const row = document.createElement('button');
      row.type = 'button';
      row.className = `coupon-product-item ${promocoesRuleSelection.produtoIds.has(item.id) ? 'selected' : ''}`;
      row.setAttribute('aria-pressed', promocoesRuleSelection.produtoIds.has(item.id) ? 'true' : 'false');
      row.addEventListener('click', () => {
        const jaSelecionado = promocoesRuleSelection.produtoIds.has(item.id);
        if (!jaSelecionado && promocoesRuleSelection.produtoIds.size >= this.maxProdutosSelecionados) {
          alert(`Limite de ${this.maxProdutosSelecionados} produtos por promocao.`);
          return;
        }
        if (jaSelecionado) promocoesRuleSelection.produtoIds.delete(item.id);
        else promocoesRuleSelection.produtoIds.add(item.id);

        const selecionadoAgora = promocoesRuleSelection.produtoIds.has(item.id);
        row.classList.toggle('selected', selecionadoAgora);
        row.setAttribute('aria-pressed', selecionadoAgora ? 'true' : 'false');
        this.renderProdutosInfo();
      });

      const textWrap = document.createElement('span');
      textWrap.className = 'coupon-product-text';
      const title = document.createElement('strong');
      title.textContent = item.nome;
      const meta = document.createElement('small');
      const marca = item.marca ? `Marca: ${item.marca}` : 'Marca: -';
      const categoria = item.categoria ? `Categoria: ${item.categoria}` : 'Categoria: -';
      const status = item.ativo ? 'Ativo' : 'Inativo';
      meta.textContent = `${marca} | ${categoria} | ID: ${item.id} | ${status}`;
      textWrap.appendChild(title);
      textWrap.appendChild(meta);
      row.appendChild(textWrap);
      container.appendChild(row);
    });

    this.renderProdutosInfo();
    this.renderProdutosPaginacao();
  },

  renderProdutosInfo() {
    const info = document.getElementById('promocaoProdutosSelecionadosInfo');
    if (!info) return;
    const total = promocoesRuleSelection.produtoIds.size;
    info.textContent = `Selecionados: ${total}/${this.maxProdutosSelecionados}`;
    info.style.color = total >= this.maxProdutosSelecionados ? 'var(--warning, #f59e0b)' : '';
  },

  getProdutosFiltrados() {
    const busca = String(document.getElementById('promocaoProdutoBusca')?.value || '').trim().toLowerCase();
    const somenteAtivos = document.getElementById('promocaoProdutoSomenteAtivos')?.checked !== false;
    return promocoesRuleCatalog.produtos.filter((item) => {
      if (somenteAtivos && !item.ativo) return false;
      if (!busca) return true;
      const ref = `${item.nome} ${item.marca} ${item.categoria} ${item.id}`.toLowerCase();
      return ref.includes(busca);
    });
  },

  onBuscaProdutosInput() {
    if (this.buscaProdutosDebounce) clearTimeout(this.buscaProdutosDebounce);
    this.buscaProdutosDebounce = setTimeout(() => {
      this.produtosPage = 1;
      this.renderProdutos();
    }, 120);
  },

  onProdutosPageSizeChange() {
    const value = Number(document.getElementById('promocaoProdutoPageSize')?.value || 50);
    this.produtosPageSize = Number.isFinite(value) && value > 0 ? value : 50;
    this.produtosPage = 1;
    this.renderProdutos();
  },

  goToProdutosPage(page) {
    const totalPaginas = Math.max(1, Math.ceil((this.produtosFiltrados.length || 0) / this.produtosPageSize));
    const target = Math.max(1, Math.min(totalPaginas, Number(page) || 1));
    if (target === this.produtosPage) return;
    this.produtosPage = target;
    this.renderProdutos();
  },

  renderProdutosPaginacao() {
    const info = document.getElementById('promocaoProdutoPaginacaoInfo');
    const prev = document.getElementById('btnPromocaoProdutoPrev');
    const next = document.getElementById('btnPromocaoProdutoNext');
    if (!info || !prev || !next) return;

    const total = this.produtosFiltrados.length || 0;
    const totalPaginas = Math.max(1, Math.ceil(total / this.produtosPageSize));
    if (this.produtosPage > totalPaginas) this.produtosPage = totalPaginas;
    if (this.produtosPage < 1) this.produtosPage = 1;

    const inicio = total === 0 ? 0 : ((this.produtosPage - 1) * this.produtosPageSize) + 1;
    const fim = Math.min(total, this.produtosPage * this.produtosPageSize);
    info.textContent = `Pagina ${this.produtosPage} de ${totalPaginas} (${inicio}-${fim} de ${total})`;
    prev.disabled = this.produtosPage <= 1;
    next.disabled = this.produtosPage >= totalPaginas;
  },

  selecionarProdutosFiltrados() {
    const filtrados = this.getProdutosFiltrados();
    let restantes = this.maxProdutosSelecionados - promocoesRuleSelection.produtoIds.size;
    if (restantes <= 0) {
      this.renderProdutosInfo();
      alert(`Limite de ${this.maxProdutosSelecionados} produtos por promocao.`);
      return;
    }
    for (const item of filtrados) {
      if (promocoesRuleSelection.produtoIds.has(item.id)) continue;
      promocoesRuleSelection.produtoIds.add(item.id);
      restantes -= 1;
      if (restantes <= 0) break;
    }
    this.renderProdutos();
  },

  limparProdutosSelecionados() {
    promocoesRuleSelection.produtoIds.clear();
    this.renderProdutos();
  },

  normalizeList(value) {
    if (Array.isArray(value)) {
      return value.map((item) => String(item || '').trim()).filter(Boolean);
    }
    if (typeof value === 'string') {
      return value.split(',').map((item) => String(item || '').trim()).filter(Boolean);
    }
    return [];
  },

  mergeDistinct(...lists) {
    const map = new Map();
    lists.flat().forEach((item) => {
      const raw = String(item || '').trim();
      if (!raw) return;
      const key = raw.toLocaleLowerCase('pt-BR');
      if (!map.has(key)) map.set(key, raw);
    });
    return Array.from(map.values()).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  },

  resetRuleSelections() {
    promocoesRuleSelection.entrega.clear();
    promocoesRuleSelection.pagamentos.clear();
    promocoesRuleSelection.categorias.clear();
    promocoesRuleSelection.marcas.clear();
    promocoesRuleSelection.produtoIds.clear();

    const busca = document.getElementById('promocaoProdutoBusca');
    if (busca) busca.value = '';
    const somenteAtivos = document.getElementById('promocaoProdutoSomenteAtivos');
    if (somenteAtivos) somenteAtivos.checked = true;
    const pageSize = document.getElementById('promocaoProdutoPageSize');
    if (pageSize) pageSize.value = '50';
    this.produtosPage = 1;
    this.produtosPageSize = 50;

    this.renderRuleOptions();
  },

  applyRuleSelections(regras = {}) {
    this.resetRuleSelections();

    this.normalizeList(regras.entregaPermitida).forEach((item) => {
      promocoesRuleSelection.entrega.add(String(item).toLowerCase());
    });
    this.normalizeList(regras.pagamentosPermitidos).forEach((item) => {
      promocoesRuleSelection.pagamentos.add(String(item).toUpperCase());
    });
    this.normalizeList(regras.categorias).forEach((item) => {
      promocoesRuleSelection.categorias.add(item);
    });
    this.normalizeList(regras.marcas).forEach((item) => {
      promocoesRuleSelection.marcas.add(item);
    });
    this.normalizeList(regras.produtoIds).forEach((item) => {
      promocoesRuleSelection.produtoIds.add(item);
    });

    this.renderRuleOptions();
  },

  async carregar() {
    const tbody = document.getElementById('promocoesTableBody');
    if (!tbody || !window.PromocoesService) return;

    const promocoes = await PromocoesService.listar();
    DomUtils.clear(tbody);

    if (!promocoes.length) {
      const tr = document.createElement('tr');
      tr.innerHTML = '<td colspan="8" style="text-align:center;padding:30px;">Nenhuma promocao cadastrada.</td>';
      tbody.appendChild(tr);
      return;
    }

    promocoes.forEach((promocao) => {
      const tr = document.createElement('tr');
      const status = promocao.ativo ? 'Ativa' : 'Inativa';
      const validade = `${promocao.validadeInicio || '-'} ate ${promocao.validadeFim || '-'}`;
      const tipoNormalizado = String(promocao.tipo || '').toLowerCase();
      const valor = tipoNormalizado === 'valor_fixo'
        ? `R$ ${Number(promocao.valor || 0).toFixed(2).replace('.', ',')}`
        : (tipoNormalizado === 'compre_1_leve_2' || tipoNormalizado === 'progressivo')
          ? 'Automatico'
          : `${Number(promocao.valor || 0).toFixed(2).replace('.', ',')}%`;
      const prioridade = Number(promocao.prioridade || 0);

      tr.innerHTML = `
        <td><strong>${DomUtils.escapeHTML(promocao.nome || '')}</strong></td>
        <td>${DomUtils.escapeHTML(this.rotuloTipo(promocao.tipo))}</td>
        <td>${valor}</td>
        <td>${DomUtils.escapeHTML(validade)}</td>
        <td>${prioridade}</td>
        <td>${promocao.acumulavelComCupom ? 'Acumula com cupom' : 'Nao acumula'}</td>
        <td><span class="status-badge ${promocao.ativo ? 'ativo' : 'inativo'}">${status}</span></td>
        <td class="acoes">
          <button class="btn-editar" data-action="editar" data-id="${promocao.id}" title="Editar">&#9998;&#65039;</button>
          <button class="btn-deletar" data-action="deletar" data-id="${promocao.id}" data-nome="${DomUtils.escapeHTML(promocao.nome || '')}" title="Excluir">&#128465;&#65039;</button>
        </td>
      `;

      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('button[data-action="editar"]').forEach((btn) => {
      btn.addEventListener('click', () => this.editar(btn.dataset.id));
    });
    tbody.querySelectorAll('button[data-action="deletar"]').forEach((btn) => {
      btn.addEventListener('click', () => this.deletar(btn.dataset.id, btn.dataset.nome));
    });
  },

  rotuloTipo(tipo) {
    const map = {
      porcentagem: 'Porcentagem',
      valor_fixo: 'Valor fixo',
      loja_inteira_percentual: 'Loja inteira % OFF',
      compre_2_ou_mais: 'Compre 2+ e ganhe %',
      compre_1_leve_2: 'Compre 1 Leve 2',
      progressivo: 'Desconto progressivo'
    };
    return map[String(tipo || '').toLowerCase()] || 'Porcentagem';
  },

  abrirModal(id = null) {
    promocaoEditandoId = id;
    const modal = document.getElementById('modalPromocao');
    const titulo = document.getElementById('modalPromocaoTitulo');
    const form = document.getElementById('formPromocao');
    if (!modal || !titulo || !form) return;

    if (!id) {
      form.reset();
      this.resetRuleSelections();
      document.getElementById('promocaoAtivo').checked = true;
      document.getElementById('promocaoAcumulavelComCupom').checked = false;
      titulo.textContent = 'Nova Promocao';
      this.atualizarAjudaTipo();
      modal.style.display = 'flex';
      return;
    }

    titulo.textContent = 'Editar Promocao';
    this.preencherParaEdicao(id);
    modal.style.display = 'flex';
  },

  fecharModal() {
    const modal = document.getElementById('modalPromocao');
    if (modal) modal.style.display = 'none';
    promocaoEditandoId = null;
  },

  async preencherParaEdicao(id) {
    const promocao = await PromocoesService.buscarPorId(id);
    if (!promocao) {
      alert('Promocao nao encontrada.');
      return;
    }

    document.getElementById('promocaoNome').value = promocao.nome || '';
    document.getElementById('promocaoTipo').value = promocao.tipo || 'porcentagem';
    document.getElementById('promocaoValor').value = Number(promocao.valor || 0);
    document.getElementById('promocaoValidadeInicio').value = promocao.validadeInicio || '';
    document.getElementById('promocaoValidadeFim').value = promocao.validadeFim || '';
    document.getElementById('promocaoPrioridade').value = Number(promocao.prioridade || 0) || 0;
    document.getElementById('promocaoSubtotalMinimo').value = Number(promocao.subtotalMinimo || 0) || '';
    document.getElementById('promocaoDescontoMaximo').value = Number(promocao.descontoMaximo || 0) || '';
    document.getElementById('promocaoAcumulavelComCupom').checked = promocao.acumulavelComCupom === true;
    document.getElementById('promocaoAtivo').checked = promocao.ativo !== false;
    const regras = promocao.regras || {};
    document.getElementById('promocaoQtdMinima').value = Number(regras.qtdMinima || 0) || '';
    document.getElementById('promocaoQtdPaga').value = Number(regras.qtdPaga || 0) || '';
    document.getElementById('promocaoQtdLeva').value = Number(regras.qtdLeva || 0) || '';
    document.getElementById('promocaoNiveisProgressivos').value = Array.isArray(regras.niveisProgressivos) ? regras.niveisProgressivos.join('\n') : '';

    this.applyRuleSelections(regras);
    this.atualizarAjudaTipo();
  },

  atualizarAjudaTipo() {
    const tipo = document.getElementById('promocaoTipo')?.value || 'porcentagem';
    const ajuda = document.getElementById('promocaoValorAjuda');
    const max = document.getElementById('promocaoValor');
    if (!ajuda || !max) return;

    const valorField = document.getElementById('promocaoValor');
    const qtdMinRow = document.getElementById('promocaoQtdMinimaRow');
    const compreLeveRow = document.getElementById('promocaoCompreLeveRow');
    const progressivoRow = document.getElementById('promocaoProgressivoRow');
    const usaValor = ['porcentagem', 'valor_fixo', 'loja_inteira_percentual', 'compre_2_ou_mais'].includes(tipo);

    if (valorField) {
      valorField.required = usaValor;
      if (!usaValor) valorField.value = '';
    }
    if (qtdMinRow) qtdMinRow.style.display = tipo === 'compre_2_ou_mais' ? 'grid' : 'none';
    if (compreLeveRow) compreLeveRow.style.display = tipo === 'compre_1_leve_2' ? 'grid' : 'none';
    if (progressivoRow) progressivoRow.style.display = tipo === 'progressivo' ? 'block' : 'none';

    if (tipo === 'valor_fixo') {
      ajuda.textContent = 'Informe o valor em reais (ex.: 20 para R$ 20,00).';
      max.removeAttribute('max');
      return;
    }

    if (tipo === 'compre_1_leve_2') {
      ajuda.textContent = 'Desconto calculado automaticamente pelas quantidades pagas/leva.';
      max.removeAttribute('max');
      return;
    }
    if (tipo === 'progressivo') {
      ajuda.textContent = 'Desconto calculado pelos niveis progressivos.';
      max.removeAttribute('max');
      return;
    }

    ajuda.textContent = 'Informe o percentual do desconto (1 a 100).';
    max.setAttribute('max', '100');
  },

  payloadFromForm() {
    return {
      nome: document.getElementById('promocaoNome')?.value || '',
      tipo: document.getElementById('promocaoTipo')?.value || 'porcentagem',
      valor: document.getElementById('promocaoValor')?.value || 0,
      validadeInicio: document.getElementById('promocaoValidadeInicio')?.value || '',
      validadeFim: document.getElementById('promocaoValidadeFim')?.value || '',
      prioridade: document.getElementById('promocaoPrioridade')?.value || 0,
      subtotalMinimo: document.getElementById('promocaoSubtotalMinimo')?.value || 0,
      descontoMaximo: document.getElementById('promocaoDescontoMaximo')?.value || 0,
      acumulavelComCupom: document.getElementById('promocaoAcumulavelComCupom')?.checked === true,
      ativo: document.getElementById('promocaoAtivo')?.checked === true,
      qtdMinima: document.getElementById('promocaoQtdMinima')?.value || 0,
      qtdPaga: document.getElementById('promocaoQtdPaga')?.value || 0,
      qtdLeva: document.getElementById('promocaoQtdLeva')?.value || 0,
      niveisProgressivos: document.getElementById('promocaoNiveisProgressivos')?.value || '',
      entregaPermitida: Array.from(promocoesRuleSelection.entrega),
      pagamentosPermitidos: Array.from(promocoesRuleSelection.pagamentos),
      categorias: Array.from(promocoesRuleSelection.categorias),
      marcas: Array.from(promocoesRuleSelection.marcas),
      produtoIds: Array.from(promocoesRuleSelection.produtoIds)
    };
  },

  async salvar(event) {
    event.preventDefault();
    const payload = this.payloadFromForm();

    let result;
    if (promocaoEditandoId) {
      result = await PromocoesService.atualizar(promocaoEditandoId, payload);
    } else {
      result = await PromocoesService.criar(payload);
    }

    if (!result.success) {
      alert(`Erro ao salvar promocao:\n${result.error || 'Erro desconhecido'}`);
      return;
    }

    alert('Promocao salva com sucesso.');
    this.fecharModal();
    await this.carregar();
  },

  async editar(id) {
    this.abrirModal(id);
  },

  async deletar(id, nome) {
    if (!confirm(`Excluir a promocao ${nome}?`)) return;

    const result = await PromocoesService.deletar(id);
    if (!result.success) {
      alert(`Erro ao excluir promocao:\n${result.error || 'Erro desconhecido'}`);
      return;
    }

    await this.carregar();
  }
};

window.PromocoesUI = PromocoesUI;
