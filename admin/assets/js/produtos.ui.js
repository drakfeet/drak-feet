/**
 * UI de Produtos
 * Gerencia interface de listagem e formulário
 */

const ProdutosUI = {
  isSubmitting: false,
  isUploading: false,

  // 📐 Mapa central de tamanhos por tipo
  tamanhosPorTipo: {
    tenis: Array.from({ length: 10 }, (_, i) => String(34 + i)),
    camisa: ['P', 'M', 'G', 'GG', 'G1', 'G2'],
    calca: Array.from({ length: 11 }, (_, i) => String(38 + i)),
    bermuda: ['P', 'M', 'G', 'GG']
  },

  /* =========================
     🔧 INIT
  ========================== */

  init() {
    console.log('🟢 ProdutosUI.init iniciado');

    const form = document.getElementById('produtoForm');
    if (form) {
      console.log('🟢 Formulário encontrado');
      form.addEventListener('submit', e => this.salvarProduto(e));
    } else {
      console.warn('⚠️ Formulário não encontrado');
    }

    const inputImagem = document.getElementById('imagemUpload');
    if (inputImagem) {
      console.log('🟢 Input de imagem encontrado');
      inputImagem.addEventListener('change', e => this.processarUpload(e));
    }

    const tipoSelect = document.getElementById('tipoProduto');
    if (tipoSelect) {
      console.log('🟢 Select de tipo encontrado');
      tipoSelect.addEventListener('change', e =>
        this.renderizarTamanhos(e.target.value)
      );
    }
  },

  /* =========================
     📐 TAMANHOS
  ========================== */

  renderizarTamanhos(tipo, tamanhosSelecionados = []) {
    console.log('📐 Renderizando tamanhos para tipo:', tipo);

    const container = document.getElementById('tamanhosSelect');
    if (!container) {
      console.warn('⚠️ Container de tamanhos não encontrado');
      return;
    }

    container.innerHTML = '';

    const tamanhos = this.tamanhosPorTipo[tipo];
    if (!Array.isArray(tamanhos)) {
      console.warn('⚠️ Nenhum tamanho mapeado para:', tipo);
      return;
    }

    tamanhos.forEach(tamanho => {
      const label = document.createElement('label');
      label.className = 'tamanho-item';

      const input = document.createElement('input');
      input.type = 'checkbox';
      input.name = 'tamanhos';
      input.value = tamanho;

      if (tamanhosSelecionados.includes(tamanho)) {
        input.checked = true;
      }

      const span = document.createElement('span');
      span.textContent = tamanho;

      label.appendChild(input);
      label.appendChild(span);
      container.appendChild(label);
    });

    console.log('✅ Tamanhos renderizados:', tamanhos);
  },

  /* =========================
     📦 LISTAGEM
  ========================== */

  renderizarLista(produtos = []) {
    console.log('📦 Renderizando lista de produtos:', produtos?.length || 0);

    const tbody = document.getElementById('produtosTableBody');
    if (!tbody) {
      console.warn('⚠️ Tbody não encontrado');
      return;
    }

    if (!Array.isArray(produtos) || produtos.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center;padding:40px;">
            Nenhum produto cadastrado
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = produtos.map(produto => `
      <tr>
        <td>
          <img src="${produto.imagemUrl}"
               alt="${this.escapeHTML(produto.nome)}"
               style="width:60px;height:60px;object-fit:cover;border-radius:8px;">
        </td>
        <td>${this.escapeHTML(produto.nome)}</td>
        <td>${this.escapeHTML(produto.marca)}</td>
        <td>R$ ${this.formatarPreco(produto.precoPix)}</td>
        <td>R$ ${this.formatarPreco(produto.precoCartao)}</td>
        <td>
          <span class="status-badge ${produto.ativo ? 'ativo' : 'inativo'}">
            ${produto.ativo ? 'Ativo' : 'Inativo'}
          </span>
        </td>
        <td class="acoes">
          <button onclick="ProdutosUI.editar('${produto.id}')">✏️</button>
          <button onclick="ProdutosUI.confirmarDelete('${produto.id}', '${this.escapeHTML(produto.nome)}')">🗑️</button>
        </td>
      </tr>
    `).join('');
  },

  editar(id) {
    console.log('✏️ Editando produto:', id);
    window.location.href = `/admin/produto-form.html?id=${encodeURIComponent(id)}`;
  },

  async confirmarDelete(id, nome) {
    console.log('🗑️ Solicitação de exclusão:', id, nome);

    if (!confirm(`Excluir o produto "${nome}"? Essa ação é irreversível.`)) {
      console.log('ℹ️ Exclusão cancelada pelo usuário');
      return;
    }

    try {
      this.mostrarLoading('Excluindo produto...');
      await ProdutosService.deletar(id);
      console.log('✅ Produto excluído:', id);
      this.mostrarMensagem('Produto excluído com sucesso!', 'success');
      this.renderizarLista(await ProdutosService.listar());
    } catch (err) {
      console.error('⚠️ Erro ao excluir produto', err);
      this.mostrarMensagem('Erro ao excluir produto', 'error');
    } finally {
      this.esconderLoading();
    }
  },

  /* =========================
     🖼️ UPLOAD + PREVIEW
  ========================== */

  async processarUpload(e) {
    console.log('🖼️ Upload iniciado');

    const file = e.target.files[0];
    if (!file || !file.type.startsWith('image/')) {
      console.warn('⚠️ Arquivo inválido');
      this.mostrarMensagem('Selecione uma imagem válida', 'error');
      return;
    }

    console.log('📄 Arquivo selecionado:', file.name, file.size);

    const preview = document.getElementById('imagemPreview');
    if (!preview) {
      console.warn('⚠️ Preview não encontrado');
      return;
    }

    preview.innerHTML = '';
    preview.style.display = 'block';

    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);
    img.style.width = '160px';
    img.style.height = '160px';
    img.style.objectFit = 'cover';
    img.style.borderRadius = '10px';
    img.style.display = 'block';

    const progressContainer = document.createElement('div');
    progressContainer.style.marginTop = '8px';
    progressContainer.innerHTML = `
      <div style="width:160px;height:8px;background:#eee;border-radius:4px;">
        <div id="uploadBar" style="
          width:0%;
          height:100%;
          background:#4caf50;
          border-radius:4px;
          transition:width .2s;"></div>
      </div>
    `;

    preview.appendChild(img);
    preview.appendChild(progressContainer);

    this.isUploading = true;

    try {
      const imageUrl = await this.uploadComProgresso(file);
      console.log('✅ Upload concluído:', imageUrl);
      document.getElementById('imagemUrlHidden').value = imageUrl;
      img.src = imageUrl;
      progressContainer.remove();
    } catch (err) {
      console.error('⚠️ Erro no upload', err);
      progressContainer.remove();
      this.mostrarMensagem('Erro ao enviar imagem', 'error');
    } finally {
      this.isUploading = false;
    }
  },

  uploadComProgresso(file) {
    console.log('📡 Enviando imagem para Cloudinary');

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();

      formData.append('file', file);
      formData.append('upload_preset', ProdutosService.cloudinary.uploadPreset);

      xhr.upload.onprogress = e => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          console.log(`📡 Progresso upload: ${percent}%`);
          const bar = document.getElementById('uploadBar');
          if (bar) bar.style.width = percent + '%';
        }
      };

      xhr.onload = () => {
        try {
          const res = JSON.parse(xhr.responseText || '{}');
          res.secure_url ? resolve(res.secure_url) : reject();
        } catch {
          reject();
        }
      };

      xhr.onerror = () => reject();

      xhr.open(
        'POST',
        `https://api.cloudinary.com/v1_1/${ProdutosService.cloudinary.cloudName}/image/upload`
      );
      xhr.send(formData);
    });
  },

  /* =========================
     💾 SALVAR
  ========================== */

  async salvarProduto(e) {
    console.log('💾 Salvando produto');
    e.preventDefault();
    if (this.isSubmitting || this.isUploading) return;

    this.isSubmitting = true;
    const form = e.target;
    const produtoId = new URLSearchParams(window.location.search).get('id');

    const tamanhos = [...document.querySelectorAll('#tamanhosSelect input:checked')]
      .map(i => i.value);

    const produto = {
      nome: form.nome.value.trim(),
      marca: form.marca.value.trim(),
      categoria: form.categoria.value.trim(),
      tipoProduto: form.tipoProduto.value,
      precoPix: Number(form.precoPix.value),
      precoCartao: Number(form.precoCartao.value),
      tamanhos,
      imagemUrl: form.imagemUrlHidden.value,
      ativo: form.ativo.checked
    };

    console.log('📦 Payload produto:', produto);

    const validacao = ProdutosService.validar(produto);
    if (!validacao.valido) {
      console.warn('⚠️ Validação falhou', validacao.erros);
      this.mostrarMensagem(validacao.erros.join('<br>'), 'error');
      this.isSubmitting = false;
      return;
    }

    try {
      this.mostrarLoading(produtoId ? 'Atualizando...' : 'Salvando...');
      produtoId
        ? await ProdutosService.atualizar(produtoId, produto)
        : await ProdutosService.criar(produto);

      console.log('✅ Produto salvo com sucesso');
      this.mostrarMensagem('Produto salvo com sucesso!', 'success');
      setTimeout(() => {
        window.location.href = '/admin/produtos.html';
      }, 1200);
    } catch (err) {
      console.error('⚠️ Erro ao salvar produto', err);
      this.mostrarMensagem('Erro ao salvar produto', 'error');
    } finally {
      this.isSubmitting = false;
      this.esconderLoading();
    }
  },

  /* =========================
     🔧 UTILITÁRIOS
  ========================== */

  formatarPreco(valor) {
    const num = Number(valor);
    return isNaN(num) ? '0,00' : num.toFixed(2).replace('.', ',');
  },

  mostrarLoading(msg) {
    console.log('⏳ Loading:', msg);
    let el = document.getElementById('loadingOverlay');
    if (!el) {
      el = document.createElement('div');
      el.id = 'loadingOverlay';
      el.className = 'loading-overlay';
      document.body.appendChild(el);
    }
    el.innerHTML = `<p>${this.escapeHTML(msg)}</p>`;
    el.style.display = 'flex';
  },

  esconderLoading() {
    console.log('⏳ Loading finalizado');
    const el = document.getElementById('loadingOverlay');
    if (el) el.style.display = 'none';
  },

  mostrarMensagem(msg, tipo = 'info') {
    console.log(`🔔 Mensagem [${tipo}]:`, msg);
    const alert = document.createElement('div');
    alert.className = `alert alert-${tipo}`;
    alert.innerHTML = msg;
    document.querySelector('.container')?.prepend(alert);
    setTimeout(() => alert.remove(), 5000);
  },

  escapeHTML(str = '') {
    return str.replace(/[&<>"']/g, m =>
      ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' }[m])
    );
  }
};

window.ProdutosUI = ProdutosUI;
document.addEventListener('DOMContentLoaded', () => ProdutosUI.init());
