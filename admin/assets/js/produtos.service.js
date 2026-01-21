/**
 * Serviço de Produtos
 * Gerencia CRUD e upload de imagens
 */

const ProdutosService = {
  collection: 'produtos',
  
  // Configuração Cloudinary - SUBSTITUA PELOS SEUS DADOS
  cloudinary: {
    cloudName: 'dz2alj2st',
    uploadPreset: 'drakfeet_products'
  },

  /**
   * Lista todos os produtos
   * @returns {Promise<Array>}
   */
  async listar() {
    try {
      console.info('📦 Buscando produtos...');
      const snapshot = await firebaseDb.collection(this.collection)
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

  /**
   * Busca produto por ID
   * @param {string} id 
   * @returns {Promise<object|null>}
   */
  async buscarPorId(id) {
    try {
      const doc = await firebaseDb.collection(this.collection).doc(id).get();
      if (doc.exists) {
        return { id: doc.id, ...doc.data() };
      }
      return null;
    } catch (error) {
      console.error('❌ Erro ao buscar produto:', error);
      return null;
    }
  },

  /**
   * Cria novo produto
   * @param {object} produto 
   * @returns {Promise<object>}
   */
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

  /**
   * Atualiza produto existente
   * @param {string} id 
   * @param {object} dados 
   * @returns {Promise<object>}
   */
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

  /**
   * Deleta produto
   * @param {string} id 
   * @returns {Promise<object>}
   */
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

  /**
   * Upload de imagem para Cloudinary
   * @param {File} file 
   * @returns {Promise<string>}
   */
  async uploadImagem(file) {
    try {
      console.info('📤 Fazendo upload da imagem...');
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', this.cloudinary.uploadPreset);
      
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${this.cloudinary.cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData
        }
      );
      
      const data = await response.json();
      
      if (data.secure_url) {
        console.info('✅ Imagem enviada com sucesso');
        return data.secure_url;
      }
      
      throw new Error('URL da imagem não retornada');
    } catch (error) {
      console.error('❌ Erro no upload:', error);
      throw error;
    }
  },

  /**
   * Valida dados do produto
   * @param {object} produto 
   * @returns {object}
   */
  validar(produto) {
    const erros = [];

    if (!produto.nome || produto.nome.trim() === '') {
      erros.push('Nome é obrigatório');
    }

    if (!produto.marca || produto.marca.trim() === '') {
      erros.push('Marca é obrigatória');
    }

    if (!produto.precoPix || produto.precoPix <= 0) {
      erros.push('Preço PIX inválido');
    }

    if (!produto.precoCartao || produto.precoCartao <= 0) {
      erros.push('Preço Cartão inválido');
    }

    if (!produto.tamanhos || produto.tamanhos.length === 0) {
      erros.push('Selecione pelo menos um tamanho');
    }

    if (!produto.imagemUrl) {
      erros.push('Imagem é obrigatória');
    }

    return {
      valido: erros.length === 0,
      erros
    };
  }
};

// Exportar
window.ProdutosService = ProdutosService;