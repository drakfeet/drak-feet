/**
 * UI de Cupons
 */

let cupomEditandoId = null;

const cuponsRuleCatalog = {
  entrega: [],
  pagamentos: [],
  categorias: [],
  marcas: [],
  produtos: []
};

const cuponsRuleSelection = {
  entrega: new Set(),
  pagamentos: new Set(),
  categorias: new Set(),
  marcas: new Set(),
  produtoIds: new Set()
};

const CuponsUI = {
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
    document.getElementById('btnNovoCupom')?.addEventListener('click', () => this.abrirModal());
    document.getElementById('formCupom')?.addEventListener('submit', (event) => this.salvar(event));
    document.getElementById('cupomProdutoBusca')?.addEventListener('input', () => this.onBuscaProdutosInput());
    document.getElementById('cupomProdutoSomenteAtivos')?.addEventListener('change', () => {
      this.produtosPage = 1;
      this.renderProdutos();
    });
    document.getElementById('btnCupomSelecionarFiltrados')?.addEventListener('click', () => this.selecionarProdutosFiltrados());
    document.getElementById('btnCupomLimparProdutos')?.addEventListener('click', () => this.limparProdutosSelecionados());
    document.getElementById('cupomProdutoPageSize')?.addEventListener('change', () => this.onProdutosPageSizeChange());
    document.getElementById('btnCupomProdutoPrev')?.addEventListener('click', () => this.goToProdutosPage(this.produtosPage - 1));
    document.getElementById('btnCupomProdutoNext')?.addEventListener('click', () => this.goToProdutosPage(this.produtosPage + 1));

    document.querySelectorAll('.js-close-modal-cupom').forEach((el) => {
      el.addEventListener('click', () => this.fecharModal());
    });

    const tipo = document.getElementById('cupomTipo');
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

    cuponsRuleCatalog.entrega = this.resolveOpcoesEntrega(config);
    cuponsRuleCatalog.pagamentos = this.resolveOpcoesPagamento(config);
    cuponsRuleCatalog.categorias = this.resolveOpcoesTexto(
      this.mergeDistinct(
        this.normalizeList(config.categoriasCadastradas),
        this.normalizeList(produtos.map((item) => item?.categoria))
      )
    );
    cuponsRuleCatalog.marcas = this.resolveOpcoesTexto(
      this.mergeDistinct(
        this.normalizeList(config.marcasCadastradas),
        this.normalizeList(produtos.map((item) => item?.marca))
      )
    );
    cuponsRuleCatalog.produtos = produtos
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
    if (config.entregaRetiradaAtivo !== false) {
      opcoes.push({ value: 'retirada', label: 'Retirada' });
    }
    if (config.entregaMotoboyAtivo !== false) {
      opcoes.push({ value: 'motoboy', label: 'Motoboy' });
    }
    if (!opcoes.length) {
      opcoes.push({ value: 'retirada', label: 'Retirada' });
      opcoes.push({ value: 'motoboy', label: 'Motoboy' });
    }
    return opcoes;
  },

  resolveOpcoesPagamento(config) {
    const opcoes = [
      { value: 'PIX', label: 'PIX' },
      { value: 'CARTAO', label: 'Cartão' }
    ];
    if (config.aceitaDinheiro === true) {
      opcoes.push({ value: 'DINHEIRO', label: 'Dinheiro' });
    }
    if (config.aceitaBoleto === true) {
      opcoes.push({ value: 'BOLETO', label: 'Boleto' });
    }
    return opcoes;
  },

  resolveOpcoesTexto(lista = []) {
    return lista.map((item) => ({ value: item, label: item }));
  },

  renderRuleOptions() {
    this.renderOptionGrid('cupomEntregaPermitidaOptions', cuponsRuleCatalog.entrega, cuponsRuleSelection.entrega);
    this.renderOptionGrid('cupomPagamentosPermitidosOptions', cuponsRuleCatalog.pagamentos, cuponsRuleSelection.pagamentos);
    this.renderOptionGrid('cupomCategoriasOptions', cuponsRuleCatalog.categorias, cuponsRuleSelection.categorias);
    this.renderOptionGrid('cupomMarcasOptions', cuponsRuleCatalog.marcas, cuponsRuleSelection.marcas);
    this.renderProdutos();
  },

  renderOptionGrid(containerId, options, selectedSet) {
    const container = document.getElementById(containerId);
    if (!container) return;

    DomUtils.clear(container);
    if (!Array.isArray(options) || !options.length) {
      const empty = document.createElement('span');
      empty.className = 'coupon-option-empty';
      empty.textContent = 'Nenhuma opção cadastrada.';
      container.appendChild(empty);
      return;
    }

    options.forEach((option) => {
      const value = String(option?.value || '').trim();
      if (!value) return;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `coupon-option-chip ${selectedSet.has(value) ? 'selected' : ''}`;
      button.textContent = option?.label || value;
      button.addEventListener('click', () => {
        if (selectedSet.has(value)) {
          selectedSet.delete(value);
        } else {
          selectedSet.add(value);
        }
        button.classList.toggle('selected', selectedSet.has(value));
      });
      container.appendChild(button);
    });
  },

  renderProdutos() {
    const container = document.getElementById('cupomProdutoIdsOptions');
    if (!container) return;

    DomUtils.clear(container);
    if (!cuponsRuleCatalog.produtos.length) {
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
      row.className = `coupon-product-item ${cuponsRuleSelection.produtoIds.has(item.id) ? 'selected' : ''}`;
      row.setAttribute('aria-pressed', cuponsRuleSelection.produtoIds.has(item.id) ? 'true' : 'false');
      row.addEventListener('click', () => {
        const jaSelecionado = cuponsRuleSelection.produtoIds.has(item.id);
        if (!jaSelecionado && cuponsRuleSelection.produtoIds.size >= this.maxProdutosSelecionados) {
          alert(`Limite de ${this.maxProdutosSelecionados} produtos por cupom.`);
          return;
        }
        if (jaSelecionado) {
          cuponsRuleSelection.produtoIds.delete(item.id);
        } else {
          cuponsRuleSelection.produtoIds.add(item.id);
        }
        const selecionadoAgora = cuponsRuleSelection.produtoIds.has(item.id);
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
    const info = document.getElementById('cupomProdutosSelecionadosInfo');
    if (!info) return;
    const total = cuponsRuleSelection.produtoIds.size;
    info.textContent = `Selecionados: ${total}/${this.maxProdutosSelecionados}`;
    info.style.color = total >= this.maxProdutosSelecionados ? 'var(--warning, #f59e0b)' : '';
  },

  getProdutosFiltrados() {
    const busca = String(document.getElementById('cupomProdutoBusca')?.value || '')
      .trim()
      .toLowerCase();
    const somenteAtivos = document.getElementById('cupomProdutoSomenteAtivos')?.checked !== false;
    return cuponsRuleCatalog.produtos.filter((item) => {
      if (somenteAtivos && !item.ativo) return false;
      if (!busca) return true;
      const ref = `${item.nome} ${item.marca} ${item.categoria} ${item.id}`.toLowerCase();
      return ref.includes(busca);
    });
  },

  onBuscaProdutosInput() {
    if (this.buscaProdutosDebounce) {
      clearTimeout(this.buscaProdutosDebounce);
    }
    this.buscaProdutosDebounce = setTimeout(() => {
      this.produtosPage = 1;
      this.renderProdutos();
    }, 120);
  },

  onProdutosPageSizeChange() {
    const value = Number(document.getElementById('cupomProdutoPageSize')?.value || 50);
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
    const info = document.getElementById('cupomProdutoPaginacaoInfo');
    const prev = document.getElementById('btnCupomProdutoPrev');
    const next = document.getElementById('btnCupomProdutoNext');
    if (!info || !prev || !next) return;

    const total = this.produtosFiltrados.length || 0;
    const totalPaginas = Math.max(1, Math.ceil(total / this.produtosPageSize));
    if (this.produtosPage > totalPaginas) this.produtosPage = totalPaginas;
    if (this.produtosPage < 1) this.produtosPage = 1;

    const inicio = total === 0 ? 0 : ((this.produtosPage - 1) * this.produtosPageSize) + 1;
    const fim = Math.min(total, this.produtosPage * this.produtosPageSize);
    info.textContent = `Página ${this.produtosPage} de ${totalPaginas} (${inicio}-${fim} de ${total})`;
    prev.disabled = this.produtosPage <= 1;
    next.disabled = this.produtosPage >= totalPaginas;
  },

  selecionarProdutosFiltrados() {
    const filtrados = this.getProdutosFiltrados();
    let restantes = this.maxProdutosSelecionados - cuponsRuleSelection.produtoIds.size;
    if (restantes <= 0) {
      this.renderProdutosInfo();
      alert(`Limite de ${this.maxProdutosSelecionados} produtos por cupom.`);
      return;
    }

    for (const item of filtrados) {
      if (cuponsRuleSelection.produtoIds.has(item.id)) continue;
      cuponsRuleSelection.produtoIds.add(item.id);
      restantes -= 1;
      if (restantes <= 0) break;
    }

    this.renderProdutos();
  },

  limparProdutosSelecionados() {
    cuponsRuleSelection.produtoIds.clear();
    this.renderProdutos();
  },

  normalizeList(value) {
    if (Array.isArray(value)) {
      return value
        .map((item) => String(item || '').trim())
        .filter(Boolean);
    }
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((item) => String(item || '').trim())
        .filter(Boolean);
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
    cuponsRuleSelection.entrega.clear();
    cuponsRuleSelection.pagamentos.clear();
    cuponsRuleSelection.categorias.clear();
    cuponsRuleSelection.marcas.clear();
    cuponsRuleSelection.produtoIds.clear();
    const busca = document.getElementById('cupomProdutoBusca');
    if (busca) busca.value = '';
    const somenteAtivos = document.getElementById('cupomProdutoSomenteAtivos');
    if (somenteAtivos) somenteAtivos.checked = true;
    const pageSize = document.getElementById('cupomProdutoPageSize');
    if (pageSize) pageSize.value = '50';
    this.produtosPage = 1;
    this.produtosPageSize = 50;
    this.renderRuleOptions();
  },

  applyRuleSelections(regras = {}) {
    this.resetRuleSelections();

    this.normalizeList(regras.entregaPermitida).forEach((item) => {
      cuponsRuleSelection.entrega.add(String(item).toLowerCase());
    });
    this.normalizeList(regras.pagamentosPermitidos).forEach((item) => {
      cuponsRuleSelection.pagamentos.add(String(item).toUpperCase());
    });
    this.normalizeList(regras.categorias).forEach((item) => {
      cuponsRuleSelection.categorias.add(item);
    });
    this.normalizeList(regras.marcas).forEach((item) => {
      cuponsRuleSelection.marcas.add(item);
    });
    this.normalizeList(regras.produtoIds).forEach((item) => {
      cuponsRuleSelection.produtoIds.add(item);
    });

    this.renderRuleOptions();
  },

  async carregar() {
    const tbody = document.getElementById('cuponsTableBody');
    if (!tbody) return;

    const cupons = await CuponsService.listar();
    DomUtils.clear(tbody);

    if (!cupons.length) {
      const tr = document.createElement('tr');
      tr.innerHTML = '<td colspan="8" style="text-align:center;padding:30px;">Nenhum cupom cadastrado.</td>';
      tbody.appendChild(tr);
      return;
    }

    cupons.forEach((cupom) => {
      const tr = document.createElement('tr');
      const status = cupom.ativo ? 'Ativo' : 'Inativo';
      const validade = `${cupom.validadeInicio || '-'} até ${cupom.validadeFim || '-'}`;
      const limite = `${Number(cupom.limiteUso || 0) || '-'} / ${Number(cupom.limitePorCliente || 0) || '-'}`;
      const valor = cupom.tipo === 'valor_fixo'
        ? `R$ ${Number(cupom.valor || 0).toFixed(2).replace('.', ',')}`
        : `${Number(cupom.valor || 0).toFixed(2).replace('.', ',')}%`;

      tr.innerHTML = `
        <td><strong>${DomUtils.escapeHTML(cupom.codigo || '')}</strong></td>
        <td>${DomUtils.escapeHTML(this.rotuloTipo(cupom.tipo))}</td>
        <td>${valor}</td>
        <td>${DomUtils.escapeHTML(validade)}</td>
        <td>${DomUtils.escapeHTML(limite)}</td>
        <td>${Number(cupom.subtotalMinimo || 0) > 0 ? `R$ ${Number(cupom.subtotalMinimo).toFixed(2).replace('.', ',')}` : '-'}</td>
        <td><span class="status-badge ${cupom.ativo ? 'ativo' : 'inativo'}">${status}</span></td>
        <td class="acoes">
          <button class="btn-editar" data-action="editar" data-id="${cupom.id}" title="Editar">&#9998;&#65039;</button>
          <button class="btn-deletar" data-action="deletar" data-id="${cupom.id}" data-codigo="${DomUtils.escapeHTML(cupom.codigo || '')}" title="Excluir">&#128465;&#65039;</button>
        </td>
      `;

      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('button[data-action="editar"]').forEach((btn) => {
      btn.addEventListener('click', () => this.editar(btn.dataset.id));
    });

    tbody.querySelectorAll('button[data-action="deletar"]').forEach((btn) => {
      btn.addEventListener('click', () => this.deletar(btn.dataset.id, btn.dataset.codigo));
    });
  },

  rotuloTipo(tipo) {
    const map = {
      porcentagem: 'Porcentagem',
      valor_fixo: 'Valor fixo',
      primeira_compra: 'Primeira compra',
      por_cliente: 'Por cliente',
      relampago: 'Relâmpago'
    };
    return map[String(tipo || '').toLowerCase()] || 'Porcentagem';
  },

  abrirModal(id = null) {
    cupomEditandoId = id;
    const modal = document.getElementById('modalCupom');
    const titulo = document.getElementById('modalCupomTitulo');
    const form = document.getElementById('formCupom');
    if (!modal || !titulo || !form) return;

    if (!id) {
      form.reset();
      this.resetRuleSelections();
      document.getElementById('cupomAtivo').checked = true;
      titulo.textContent = 'Novo Cupom';
      this.atualizarAjudaTipo();
      modal.style.display = 'flex';
      return;
    }

    titulo.textContent = 'Editar Cupom';
    this.preencherParaEdicao(id);
    modal.style.display = 'flex';
  },

  fecharModal() {
    const modal = document.getElementById('modalCupom');
    if (modal) modal.style.display = 'none';
    cupomEditandoId = null;
  },

  async preencherParaEdicao(id) {
    const cupom = await CuponsService.buscarPorId(id);
    if (!cupom) {
      alert('Cupom não encontrado.');
      return;
    }

    document.getElementById('cupomCodigo').value = cupom.codigo || '';
    document.getElementById('cupomTipo').value = cupom.tipo || 'porcentagem';
    document.getElementById('cupomValor').value = Number(cupom.valor || 0);
    document.getElementById('cupomValidadeInicio').value = cupom.validadeInicio || '';
    document.getElementById('cupomValidadeFim').value = cupom.validadeFim || '';
    document.getElementById('cupomLimiteUso').value = Number(cupom.limiteUso || 0) || '';
    document.getElementById('cupomLimitePorCliente').value = Number(cupom.limitePorCliente || 0) || '';
    document.getElementById('cupomSubtotalMinimo').value = Number(cupom.subtotalMinimo || 0) || '';
    document.getElementById('cupomDescontoMaximo').value = Number(cupom.descontoMaximo || 0) || '';
    document.getElementById('cupomAtivo').checked = cupom.ativo !== false;

    this.applyRuleSelections(cupom.regras || {});
    this.atualizarAjudaTipo();
  },

  atualizarAjudaTipo() {
    const tipo = document.getElementById('cupomTipo')?.value || 'porcentagem';
    const ajuda = document.getElementById('cupomValorAjuda');
    const max = document.getElementById('cupomValor');
    if (!ajuda || !max) return;

    if (tipo === 'valor_fixo') {
      ajuda.textContent = 'Informe o valor em reais (ex.: 20 para R$ 20,00).';
      max.removeAttribute('max');
      return;
    }

    ajuda.textContent = 'Informe o percentual do desconto (1 a 100).';
    max.setAttribute('max', '100');
  },

  payloadFromForm() {
    return {
      codigo: document.getElementById('cupomCodigo')?.value || '',
      tipo: document.getElementById('cupomTipo')?.value || 'porcentagem',
      valor: document.getElementById('cupomValor')?.value || 0,
      validadeInicio: document.getElementById('cupomValidadeInicio')?.value || '',
      validadeFim: document.getElementById('cupomValidadeFim')?.value || '',
      limiteUso: document.getElementById('cupomLimiteUso')?.value || 0,
      limitePorCliente: document.getElementById('cupomLimitePorCliente')?.value || 0,
      subtotalMinimo: document.getElementById('cupomSubtotalMinimo')?.value || 0,
      descontoMaximo: document.getElementById('cupomDescontoMaximo')?.value || 0,
      ativo: document.getElementById('cupomAtivo')?.checked === true,
      entregaPermitida: Array.from(cuponsRuleSelection.entrega),
      pagamentosPermitidos: Array.from(cuponsRuleSelection.pagamentos),
      categorias: Array.from(cuponsRuleSelection.categorias),
      marcas: Array.from(cuponsRuleSelection.marcas),
      produtoIds: Array.from(cuponsRuleSelection.produtoIds)
    };
  },

  async salvar(event) {
    event.preventDefault();
    const payload = this.payloadFromForm();

    let result;
    if (cupomEditandoId) {
      result = await CuponsService.atualizar(cupomEditandoId, payload);
    } else {
      result = await CuponsService.criar(payload);
    }

    if (!result.success) {
      alert(`Erro ao salvar cupom:\n${result.error || 'Erro desconhecido'}`);
      return;
    }

    alert('Cupom salvo com sucesso.');
    this.fecharModal();
    await this.carregar();
  },

  async editar(id) {
    this.abrirModal(id);
  },

  async deletar(id, codigo) {
    if (!confirm(`Excluir o cupom ${codigo}?`)) return;

    const result = await CuponsService.deletar(id);
    if (!result.success) {
      alert(`Erro ao excluir cupom:\n${result.error || 'Erro desconhecido'}`);
      return;
    }

    await this.carregar();
  }
};

window.CuponsUI = CuponsUI;


