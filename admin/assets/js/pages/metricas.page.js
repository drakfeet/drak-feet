/**
 * Página: Métricas
 */
const MetricasPage = {
  pageSize: 10,
  currentPage: 1,
  pageAnchors: { 1: null },
  isLoadingEventos: false,

  init() {
    this.bindEventosPaginacao();
    this.carregarMetricas();
  },

  bindEventosPaginacao() {
    document.getElementById('eventosPrevPage')?.addEventListener('click', () => {
      if (this.currentPage <= 1 || this.isLoadingEventos) return;
      this.carregarEventosPagina(this.currentPage - 1);
    });

    document.getElementById('eventosNextPage')?.addEventListener('click', () => {
      if (this.isLoadingEventos) return;
      this.carregarEventosPagina(this.currentPage + 1);
    });
  },

  async carregarMetricas() {
    const dados = await DashboardService.buscarMetricasCompletas();
    const stats = DashboardService.estatisticasResumo(dados.metricas);

    document.getElementById('totalProdutos').textContent = dados.totalProdutos;
    document.getElementById('totalAcessos').textContent = stats.ultimos30Dias.acessos;
    document.getElementById('totalCliques').textContent = stats.ultimos30Dias.cliques;
    document.getElementById('totalAddToCart').textContent = stats.ultimos30Dias.addToCart ?? 0;
    document.getElementById('totalCheckout').textContent = stats.ultimos30Dias.checkout ?? 0;
    document.getElementById('totalWhatsAppFloating').textContent = stats.ultimos30Dias.whatsappFloating ?? 0;
    await this.carregarEventosPagina(1);
  },

  async carregarEventosPagina(page) {
    if (!window.MetricasService || this.isLoadingEventos) return;

    const tbody = document.getElementById('eventosTableBody');
    const prevBtn = document.getElementById('eventosPrevPage');
    const nextBtn = document.getElementById('eventosNextPage');
    const pageInfo = document.getElementById('eventosPageInfo');

    if (!tbody || !prevBtn || !nextBtn || !pageInfo) return;

    if (typeof this.pageAnchors[page] === 'undefined') return;

    this.isLoadingEventos = true;
    prevBtn.disabled = true;
    nextBtn.disabled = true;

    DomUtils.clear(tbody);
    const loadingTr = document.createElement('tr');
    const loadingTd = document.createElement('td');
    loadingTd.colSpan = 3;
    loadingTd.style.textAlign = 'center';
    loadingTd.style.padding = '30px';
    loadingTd.textContent = 'Carregando eventos...';
    loadingTr.appendChild(loadingTd);
    tbody.appendChild(loadingTr);

    try {
      const result = await MetricasService.buscarEventosRecentesPaginado({
        limite: this.pageSize,
        startAfterDoc: this.pageAnchors[page]
      });

      const eventos = result.eventos || [];
      DomUtils.clear(tbody);

      if (eventos.length === 0) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 3;
        td.style.textAlign = 'center';
        td.style.padding = '40px';
        td.textContent = 'Nenhum evento registrado';
        tr.appendChild(td);
        tbody.appendChild(tr);
        this.currentPage = page;
        pageInfo.textContent = `Página ${this.currentPage}`;
        prevBtn.disabled = this.currentPage <= 1;
        nextBtn.disabled = true;
        return;
      }

      const frag = document.createDocumentFragment();

      eventos.forEach(evento => {
        const tr = document.createElement('tr');
        const tdTipo = document.createElement('td');
        const badge = document.createElement('span');
        badge.className = 'badge';
        const labels = {
          whatsapp_click: '💬 WhatsApp',
          whatsapp_floating_click: '📲 WhatsApp Flutuante',
          checkout_whatsapp: '✅ Finalização',
          add_to_cart: '🛒 Carrinho',
          page_view: '👁️ Visualização',
          product_view: '👀 Produto',
          banner_click: '🖼️ Banner',
          search: '🔎 Busca',
          filter_apply: '🧰 Filtro'
        };
        badge.textContent = labels[evento.tipo] || evento.tipo;
        tdTipo.appendChild(badge);

        const tdProduto = document.createElement('td');
        tdProduto.textContent = evento.produtoNome || 'Página Principal';

        const tdData = document.createElement('td');
        tdData.textContent = new Date(evento.timestamp).toLocaleString('pt-BR');

        tr.appendChild(tdTipo);
        tr.appendChild(tdProduto);
        tr.appendChild(tdData);

        frag.appendChild(tr);
      });

      tbody.appendChild(frag);

      this.currentPage = page;
      pageInfo.textContent = `Página ${this.currentPage}`;

      if (result.hasMore && result.nextCursor) {
        this.pageAnchors[page + 1] = result.nextCursor;
      } else {
        delete this.pageAnchors[page + 1];
      }

      prevBtn.disabled = this.currentPage <= 1;
      nextBtn.disabled = !result.hasMore;
    } catch (error) {
      DomUtils.clear(tbody);
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 3;
      td.style.textAlign = 'center';
      td.style.padding = '40px';
      td.textContent = 'Erro ao carregar eventos';
      tr.appendChild(td);
      tbody.appendChild(tr);
      prevBtn.disabled = this.currentPage <= 1;
      nextBtn.disabled = true;
    } finally {
      this.isLoadingEventos = false;
    }
  }
};

document.addEventListener('DOMContentLoaded', () => MetricasPage.init());
window.MetricasPage = MetricasPage;


