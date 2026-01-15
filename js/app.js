/* ======================================================
   Drak Feet - App Principal (FINAL)
====================================================== */

console.info("🚀 app.js carregado com sucesso");

AOS.init({
  duration: 900,
  once: true,
  easing: "ease-out-cubic"
});

const menuToggle   = document.getElementById("menuToggle");
const menu         = document.getElementById("menu");
const brandFilter  = document.getElementById("filterBrand");
const sizeFilter   = document.getElementById("filterSize");
const clearBtn     = document.getElementById("clearFilters");

menuToggle.onclick = () => {
  menu.style.display = menu.style.display === "block" ? "none" : "block";
};

/* =======================
   FILTROS
======================= */
function initFilters() {
  const brands = new Set();
  const sizes  = new Set();

  Object.values(products).flat().forEach(p => {
    brands.add(p.brand);
    p.sizes.forEach(s => sizes.add(s));
  });

  brands.forEach(b => {
    brandFilter.innerHTML += `<option value="${b}">${b}</option>`;
  });

  [...sizes].sort((a,b) => a - b).forEach(s => {
    sizeFilter.innerHTML += `<option value="${s}">${s}</option>`;
  });

  console.info("✅ Filtros carregados");
}

/* =======================
   RENDER GERAL
======================= */
function renderAll() {
  const brand = brandFilter.value;
  const size  = sizeFilter.value ? Number(sizeFilter.value) : null;

  document.querySelectorAll(".category").forEach(section => {
    const container = section.querySelector(".products");
    const key = container.dataset.category;
    const list = products[key];

    const filtered = list.filter(p =>
      (!brand || p.brand === brand) &&
      (!size || p.sizes.includes(size))
    );

    section.style.display =
      brand && !list.some(p => p.brand === brand)
      ? "none"
      : filtered.length ? "block" : "none";

    container.innerHTML = "";
    filtered.forEach(p => renderCard(container, p));
  });
}

/* =======================
   CARD
======================= */
function renderCard(container, p) {

  let selectedSize = null;
  let selectedPayment = "PIX";

  const card = document.createElement("div");
  card.className = "card";
  card.setAttribute("data-aos", "fade-up");

  card.innerHTML = `
    <img src="${p.img}" alt="${p.model}">
    <h3>${p.brand} - ${p.model}</h3>

    <span class="old">R$ ${p.old.toFixed(2)}</span>
    <span class="price">R$ ${p.pix.toFixed(2)} no PIX</span>
    <small>Até 4x de R$ ${p.card.toFixed(2)}</small>

    <div class="sizes">
      ${p.sizes.map(s => `<div class="size">${s}</div>`).join("")}
    </div>

    <div class="payment-method">
      <select>
        <option value="PIX">PIX</option>
        <option value="CARTAO">Cartão</option>
      </select>
    </div>

    <button class="btn-buy">Comprar no WhatsApp</button>
  `;

  /* TAMANHO */
  card.querySelectorAll(".size").forEach(el => {
    el.onclick = () => {
      card.querySelectorAll(".size").forEach(s => s.classList.remove("active"));
      el.classList.add("active");
      selectedSize = el.innerText;
    };
  });

  /* PAGAMENTO */
  card.querySelector(".payment-method select").onchange = e => {
    selectedPayment = e.target.value;
  };

  /* WHATSAPP */
  card.querySelector(".btn-buy").onclick = () => {

    if (!selectedSize) {
      alert("Selecione um tamanho antes de continuar");
      return;
    }

    if (typeof fbq === "function") {
      fbq("track", "Contact", {
        content_name: `${p.brand} ${p.model}`,
        content_category: p.brand,
        value: selectedPayment === "PIX" ? p.pix : p.card,
        currency: "BRL"
      });
    }

    const paymentText =
      selectedPayment === "PIX"
        ? `PIX: R$ ${p.pix.toFixed(2)}`
        : `Cartão: até 4x de R$ ${p.card.toFixed(2)}`;

    const message =
`Drak Feet - Pedido via Catalogo

Produto: ${p.brand} ${p.model}
Tamanho: ${selectedSize}

Forma de Pagamento:
${paymentText}`;

    window.open(
      `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`,
      "_blank"
    );
  };

  container.appendChild(card);
}

/* =======================
   EVENTOS
======================= */
brandFilter.onchange = renderAll;
sizeFilter.onchange  = renderAll;

clearBtn.onclick = () => {
  brandFilter.value = "";
  sizeFilter.value  = "";
  renderAll();
  console.info("🧹 Filtros limpos");
};

/* =======================
   START
======================= */
initFilters();
renderAll();
