/**
 * Serviço de Produtos
 * Gerencia CRUD e upload de imagens
 */

const ProdutosService = {
  collection: 'produtos',

  // ☁️ Cloudinary
  cloudinary: {
    cloudName: 'dz2alj2st',
    uploadPreset: 'drakfeet_products'
  },

  // 📐 Regras de tamanhos por tipo (SEGURANÇA)
  tamanhosPorTipo: {
    tenis: Array.from({ length: 10 }, (_, i) => String(34 + i)),
    camisa: ['P', 'M', 'G', 'GG', 'G1', 'G2'],
    calca: Array.from({ length: 11 }, (_, i) => String(38 + i)),
    bermuda: ['P', 'M', 'G', 'GG']
  },

  async listar() {
    try {
      console.info('📦 Buscando produtos...');
      const snapshot = await firebaseDb
        .collection(this.collection)
        .orderBy('nome')
        .get();

      const produtos = [];
      snapshot.forEach(doc => {
        produtos.push({ id: doc.id, ...doc.data() });
      });

      console.info(`✅ ${produtos.length} produtos encontrados`);
      return produtos;
    } catch (error) {
      console.error('❌ Erro ao listar produtos:', error);
      return [];
    }
  },

  async buscarPorId(id) {
    try {
      const doc = await firebaseDb.collection(this.collection).doc(id).get();
      return doc.exists ? { id: doc.id, ...doc.data() } : null;
    } catch (error) {
      console.error('❌ Erro ao buscar produto:', error);
      return null;
    }
  },

  async criar(produto) {
    try {
      console.info('➕ Criando produto...');
      const novoProduto = {
        ...produto,
        criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
        atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await firebaseDb.collection(this.collection).add(novoProduto);
      console.info('✅ Produto criado:', docRef.id);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('❌ Erro ao criar produto:', error);
      return { success: false, error: error.message };
    }
  },

  async atualizar(id, dados) {
    try {
      console.info('✏️ Atualizando produto:', id);
      await firebaseDb.collection(this.collection).doc(id).update({
        ...dados,
        atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
      });
      console.info('✅ Produto atualizado');
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao atualizar produto:', error);
      return { success: false, error: error.message };
    }
  },

  async deletar(id) {
    try {
      console.info('🗑️ Deletando produto:', id);
      await firebaseDb.collection(this.collection).doc(id).delete();
      console.info('✅ Produto deletado');
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao deletar produto:', error);
      return { success: false, error: error.message };
    }
  },

  async uploadImagem(file) {
    try {
      console.info('📤 Upload de imagem...');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', this.cloudinary.uploadPreset);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${this.cloudinary.cloudName}/image/upload`,
        { method: 'POST', body: formData }
      );

      const data = await response.json();
      if (!data.secure_url) throw new Error('URL não retornada');

      console.info('✅ Imagem enviada');
      return data.secure_url;
    } catch (error) {
      console.error('❌ Erro no upload:', error);
      throw error;
    }
  },

  /**
   * 🔐 Validação completa do produto
   */
  validar(produto) {
    const erros = [];

    if (!produto.nome?.trim()) erros.push('Nome é obrigatório');
    if (!produto.marca?.trim()) erros.push('Marca é obrigatória');

    if (!produto.precoPix || produto.precoPix <= 0)
      erros.push('Preço PIX inválido');

    if (!produto.precoCartao || produto.precoCartao <= 0)
      erros.push('Preço Cartão inválido');

    if (!produto.tipoProduto || !this.tamanhosPorTipo[produto.tipoProduto]) {
      erros.push('Tipo de produto inválido');
    }

    if (!Array.isArray(produto.tamanhos) || produto.tamanhos.length === 0) {
      erros.push('Selecione ao menos um tamanho');
    } else if (produto.tipoProduto) {
      const tamanhosPermitidos = this.tamanhosPorTipo[produto.tipoProduto] || [];
      const invalidos = produto.tamanhos.filter(
        t => !tamanhosPermitidos.includes(t)
      );
      if (invalidos.length) {
        erros.push(`Tamanhos inválidos para ${produto.tipoProduto}`);
      }
    }

    if (!produto.imagemUrl) erros.push('Imagem é obrigatória');

    return {
      valido: erros.length === 0,
      erros
    };
  }
};

// Exportar global
window.ProdutosService = ProdutosService;
