/**
 * UI de Produtos
 * Gerencia interface de listagem e formulário
 */

const ProdutosUI = {
  /**
   * Renderiza lista de produtos na tabela
   * @param {Array} produtos 
   */
  renderizarLista(produtos) {
    const tbody = document.getElementById('produtosTableBody');
    if (!tbody) return;

    if (produtos.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 40px;">
            Nenhum produto cadastrado
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = produtos.map(produto => `
      <tr>
        <td>
          <img src="${produto.imagemUrl}" alt="${produto.nome}" 
               style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;">
        </td>
        <td>${produto.nome}</td>
        <td>${produto.marca}</td>
        <td>R$ ${this.formatarPreco(produto.precoPix)}</td>
        <td>R$ ${this.formatarPreco(produto.precoCartao)}</td>
        <td>
          <span class="status-badge ${produto.ativo ? 'ativo' : 'inativo'}">
            ${produto.ativo ? 'Ativo' : 'Inativo'}
          </span>
        </td>
        <td class="acoes">
          <button onclick="ProdutosUI.editar('${produto.id}')" class="btn-editar" title="Editar">
            ✏️
          </button>
          <button onclick="ProdutosUI.confirmarDelete('${produto.id}', '${produto.nome}')" 
                  class="btn-deletar" title="Excluir">
            🗑️
          </button>
        </td>
      </tr>
    `).join('');
  },

  /**
   * Formata preço para exibição
   * @param {number} preco 
   * @returns {string}
   */
  formatarPreco(preco) {
    return parseFloat(preco).toFixed(2).replace('.', ',');
  },

  /**
   * Redireciona para edição
   * @param {string} id 
   */
  editar(id) {
    window.location.href = `/admin/produto-form.html?id=${id}`;
  },

  /**
   * Confirma exclusão
   * @param {string} id 
   * @param {string} nome 
   */
  async confirmarDelete(id, nome) {
    if (!confirm(`Deseja realmente excluir "${nome}"?`)) {
      return;
    }

    this.mostrarLoading('Excluindo produto...');
    const result = await ProdutosService.deletar(id);
    this.esconderLoading();

    if (result.success) {
      this.mostrarMensagem('Produto excluído com sucesso!', 'success');
      setTimeout(() => window.location.reload(), 1000);
    } else {
      this.mostrarMensagem('Erro ao excluir produto', 'error');
    }
  },

  /**
   * Carrega dados no formulário (modo edição)
   * @param {string} id 
   */
  async carregarFormulario(id) {
    this.mostrarLoading('Carregando produto...');
    const produto = await ProdutosService.buscarPorId(id);
    this.esconderLoading();

    if (!produto) {
      this.mostrarMensagem('Produto não encontrado', 'error');
      return;
    }

    document.getElementById('nome').value = produto.nome;
    document.getElementById('marca').value = produto.marca;
    document.getElementById('categoria').value = produto.categoria || '';
    document.getElementById('precoPix').value = produto.precoPix;
    document.getElementById('precoCartao').value = produto.precoCartao;
    document.getElementById('ativo').checked = produto.ativo;

    // Marcar tamanhos
    produto.tamanhos.forEach(tamanho => {
      const checkbox = document.querySelector(`input[name="tamanhos"][value="${tamanho}"]`);
      if (checkbox) checkbox.checked = true;
    });

    // Preview da imagem
    if (produto.imagemUrl) {
      this.mostrarPreviewImagem(produto.imagemUrl);
      document.getElementById('imagemUrlHidden').value = produto.imagemUrl;
    }
  },

  /**
   * Salva produto (criar ou atualizar)
   * @param {Event} e 
   */
  async salvarProduto(e) {
    e.preventDefault();

    const form = e.target;
    const produtoId = new URLSearchParams(window.location.search).get('id');

    // Coletar dados
    const tamanhosSelecionados = Array.from(
      form.querySelectorAll('input[name="tamanhos"]:checked')
    ).map(cb => cb.value);

    const produto = {
      nome: form.nome.value.trim(),
      marca: form.marca.value.trim(),
      categoria: form.categoria.value.trim(),
      precoPix: parseFloat(form.precoPix.value),
      precoCartao: parseFloat(form.precoCartao.value),
      tamanhos: tamanhosSelecionados,
      imagemUrl: form.imagemUrlHidden.value,
      ativo: form.ativo.checked
    };

    // Validar
    const validacao = ProdutosService.validar(produto);
    if (!validacao.valido) {
      this.mostrarMensagem(validacao.erros.join('<br>'), 'error');
      return;
    }

    // Salvar
    this.mostrarLoading(produtoId ? 'Atualizando...' : 'Salvando...');
    
    const result = produtoId 
      ? await ProdutosService.atualizar(produtoId, produto)
      : await ProdutosService.criar(produto);

    this.esconderLoading();

    if (result.success) {
      this.mostrarMensagem('Produto salvo com sucesso!', 'success');
      setTimeout(() => window.location.href = '/admin/produtos.html', 1500);
    } else {
      this.mostrarMensagem('Erro ao salvar produto', 'error');
    }
  },

  /**
   * Processa upload de imagem
   * @param {Event} e 
   */
  async processarUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      this.mostrarMensagem('Selecione apenas imagens', 'error');
      return;
    }

    // Validar tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
      this.mostrarMensagem('Imagem muito grande. Máximo 5MB', 'error');
      return;
    }

    try {
      this.mostrarLoading('Enviando imagem...');
      const url = await ProdutosService.uploadImagem(file);
      this.esconderLoading();

      document.getElementById('imagemUrlHidden').value = url;
      this.mostrarPreviewImagem(url);
      this.mostrarMensagem('Imagem enviada com sucesso!', 'success');
    } catch (error) {
      this.esconderLoading();
      this.mostrarMensagem('Erro ao enviar imagem', 'error');
    }
  },

  /**
   * Mostra preview da imagem
   * @param {string} url 
   */
  mostrarPreviewImagem(url) {
    const preview = document.getElementById('imagemPreview');
    if (preview) {
      preview.innerHTML = `<img src="${url}" alt="Preview">`;
      preview.style.display = 'block';
    }
  },

  /**
   * Mostra loading
   * @param {string} mensagem 
   */
  mostrarLoading(mensagem) {
    let loading = document.getElementById('loadingOverlay');
    if (!loading) {
      loading = document.createElement('div');
      loading.id = 'loadingOverlay';
      loading.className = 'loading-overlay';
      document.body.appendChild(loading);
    }
    loading.innerHTML = `<div class="loading-spinner"></div><p>${mensagem}</p>`;
    loading.style.display = 'flex';
  },

  /**
   * Esconde loading
   */
  esconderLoading() {
    const loading = document.getElementById('loadingOverlay');
    if (loading) {
      loading.style.display = 'none';
    }
  },

  /**
   * Mostra mensagem de feedback
   * @param {string} mensagem 
   * @param {string} tipo 
   */
  mostrarMensagem(mensagem, tipo = 'info') {
    const alert = document.createElement('div');
    alert.className = `alert alert-${tipo}`;
    alert.innerHTML = mensagem;
    
    const container = document.querySelector('.container') || document.body;
    container.insertBefore(alert, container.firstChild);

    setTimeout(() => alert.remove(), 5000);
  }
};

// Exportar
window.ProdutosUI = ProdutosUI;