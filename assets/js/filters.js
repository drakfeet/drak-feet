/**
 * Sistema de Filtros do Catálogo
 * Filtra produtos por marca e tamanho
 */

const Filters = {
  produtosTodos: [],
  filtrosMarcaSelecionados: [],
  filtrosTamanhoSelecionados: [],
  filtrosCategoriaSelecionados: [],
  termoBusca: '',
  config: null,

  /**
   * Inicializa o sistema de filtros
   * @param {Array} produtos 
   * @param {object} config 
   */
  init(produtos, config) {
    this.produtosTodos = produtos;
    this.config = config;
    this.renderizarFiltros();
    this.configurarEventListeners();
  },

  /**
   * Renderiza opções de filtros
   */
  renderizarFiltros() {
    this.renderizarFiltrosCategoria();
    this.renderizarFiltrosMarca();
    this.renderizarFiltrosTamanho();
  },

  /**
   * Renderiza filtros de categoria
   */
  renderizarFiltrosCategoria() {
    const container = document.getElementById('filtrosCategoria');
    const grupoCategoria = document.getElementById('grupoCategoria');
    
    if (!container || !grupoCategoria) return;

    // Verificar se há categorias no menu
    if (this.config?.menuCategorias && this.config.menuCategorias.length > 0) {
      grupoCategoria.style.display = 'block';
      
      container.innerHTML = this.config.menuCategorias.map(categoria => `
        <label class="filtro-checkbox">
          <input type="checkbox" value="${categoria}" data-filtro="categoria">
          <span>${categoria}</span>
        </label>
      `).join('');
    } else {
      // Se não houver categorias no menu, usar as dos produtos
      const categorias = this.extrairCategorias(this.produtosTodos);
      
      if (categorias.length > 0) {
        grupoCategoria.style.display = 'block';
        
        container.innerHTML = categorias.map(categoria => `
          <label class="filtro-checkbox">
            <input type="checkbox" value="${categoria}" data-filtro="categoria">
            <span>${categoria}</span>
          </label>
        `).join('');
      }
    }
  },

  /**
   * Extrai categorias únicas dos produtos
   * @param {Array} produtos 
   * @returns {Array}
   */
  extrairCategorias(produtos) {
    const categorias = [...new Set(produtos
      .filter(p => p.categoria)
      .map(p => p.categoria))];
    return categorias.sort();
  },

  /**
   * Renderiza filtros de marca
   */
  renderizarFiltrosMarca() {
    const container = document.getElementById('filtrosMarca');
    if (!container) return;

    const marcas = DataService.extrairMarcas(this.produtosTodos);
    
    container.innerHTML = marcas.map(marca => `
      <label class="filtro-checkbox">
        <input type="checkbox" value="${marca}" data-filtro="marca">
        <span>${marca}</span>
      </label>
    `).join('');
  },

  /**
   * Renderiza filtros de tamanho
   */
  renderizarFiltrosTamanho() {
    const container = document.getElementById('filtrosTamanho');
    if (!container) return;

    const tamanhos = DataService.extrairTamanhos(this.produtosTodos);
    
    container.innerHTML = tamanhos.map(tamanho => `
      <label class="filtro-checkbox">
        <input type="checkbox" value="${tamanho}" data-filtro="tamanho">
        <span>${tamanho}</span>
      </label>
    `).join('');
  },

  /**
   * Configura event listeners
   */
  configurarEventListeners() {
    // Busca simples
    const campoBusca = document.getElementById('campoBusca');
    if (campoBusca) {
      campoBusca.addEventListener('input', (e) => {
        this.termoBusca = e.target.value.toLowerCase();
        this.aplicarFiltros();
      });
    }

    // Filtros de categoria
    document.querySelectorAll('[data-filtro="categoria"]').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        if (e.target.checked) {
          this.filtrosCategoriaSelecionados.push(e.target.value);
        } else {
          this.filtrosCategoriaSelecionados = this.filtrosCategoriaSelecionados.filter(
            c => c !== e.target.value
          );
        }
        this.aplicarFiltros();
      });
    });

    // Filtros de marca
    document.querySelectorAll('[data-filtro="marca"]').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        if (e.target.checked) {
          this.filtrosMarcaSelecionados.push(e.target.value);
        } else {
          this.filtrosMarcaSelecionados = this.filtrosMarcaSelecionados.filter(
            m => m !== e.target.value
          );
        }
        this.aplicarFiltros();
      });
    });

    // Filtros de tamanho
    document.querySelectorAll('[data-filtro="tamanho"]').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        if (e.target.checked) {
          this.filtrosTamanhoSelecionados.push(e.target.value);
        } else {
          this.filtrosTamanhoSelecionados = this.filtrosTamanhoSelecionados.filter(
            t => t !== e.target.value
          );
        }
        this.aplicarFiltros();
      });
    });

    // Botão limpar filtros
    const btnLimpar = document.getElementById('btnLimparFiltros');
    if (btnLimpar) {
      btnLimpar.addEventListener('click', () => this.limparFiltros());
    }
  },

  /**
   * Aplica filtros selecionados
   */
  aplicarFiltros() {
    let produtosFiltrados = [...this.produtosTodos];

    // Filtrar por busca
    if (this.termoBusca) {
      produtosFiltrados = produtosFiltrados.filter(p =>
        p.nome.toLowerCase().includes(this.termoBusca) ||
        p.marca.toLowerCase().includes(this.termoBusca) ||
        (p.categoria && p.categoria.toLowerCase().includes(this.termoBusca))
      );
    }

    // Filtrar por categoria
    if (this.filtrosCategoriaSelecionados.length > 0) {
      produtosFiltrados = produtosFiltrados.filter(p =>
        p.categoria && this.filtrosCategoriaSelecionados.includes(p.categoria)
      );
    }

    // Filtrar por marca
    if (this.filtrosMarcaSelecionados.length > 0) {
      produtosFiltrados = produtosFiltrados.filter(p =>
        this.filtrosMarcaSelecionados.includes(p.marca)
      );
    }

    // Filtrar por tamanho
    if (this.filtrosTamanhoSelecionados.length > 0) {
      produtosFiltrados = produtosFiltrados.filter(p =>
        p.tamanhos.some(t => this.filtrosTamanhoSelecionados.includes(t))
      );
    }

    // Atualizar contadores
    this.atualizarContadores(produtosFiltrados.length);

    // Renderizar produtos filtrados
    CatalogRender.renderizarProdutos(produtosFiltrados);
  },

  /**
   * Limpa todos os filtros
   */
  limparFiltros() {
    this.filtrosMarcaSelecionados = [];
    this.filtrosTamanhoSelecionados = [];
    this.filtrosCategoriaSelecionados = [];
    this.termoBusca = '';

    // Desmarcar checkboxes
    document.querySelectorAll('[data-filtro]').forEach(checkbox => {
      checkbox.checked = false;
    });

    // Limpar campo de busca
    const campoBusca = document.getElementById('campoBusca');
    if (campoBusca) {
      campoBusca.value = '';
    }

    // Mostrar todos os produtos
    this.atualizarContadores(this.produtosTodos.length);
    CatalogRender.renderizarProdutos(this.produtosTodos);
  },

  /**
   * Atualiza contador de produtos
   * @param {number} total 
   */
  atualizarContadores(total) {
    const contador = document.getElementById('contadorProdutos');
    if (contador) {
      contador.textContent = `${total} produto${total !== 1 ? 's' : ''} encontrado${total !== 1 ? 's' : ''}`;
    }
  }
};

// Exportar
window.Filters = Filters;