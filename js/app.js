/* ======================================================
   Drak Feet - App Principal
   Autor: Drak Feet
   Descrição: Renderização, filtros, WhatsApp e Pixel
====================================================== */

console.info("🚀 app.js carregado com sucesso");

AOS.init({
  duration: 900,
  once: true,
  easing: "ease-out-cubic"
});

/* =======================
   ELEMENTOS DOM
======================= */
const menuToggle   = document.getElementById("menuToggle");
const menu         = document.getElementById("menu");
const brandFilter  = document.getElementById("filterBrand");
const sizeFilter   = document.getElementById("filterSize");
const clearBtn     = document.getElementById("clearFilters");

/* =======================
   MENU MOBILE
======================= */
menuToggle.addEventListener("click", () => {
  menu.style.display = menu.style.display === "block" ? "none" : "block";
});

/* =======================
   INICIALIZA FILTROS
======================= */
function initFilters() {
  const brands = new Set();
  const sizes  = new Set();

  Object.values(products).flat().forEach(p => {
    brands.add(p.brand);
    p.sizes.forEach(s => sizes.add(s));
  });

  brands.forEach(b => {
    const opt = document.createElement("option");
    opt.value = b;
    opt.textContent = b;
    brandFilter.appendChild(opt);
  });

  [...sizes].sort((a,b) => a - b).forEach(s => {
    const opt = document.createElement("option");
    opt.value = s;
    opt.textContent = s;
    sizeFilter.appendChild(opt);
  });

  console.info("✅ Filtros inicializados");
}

/* =======================
   RENDERIZAÇÃO GERAL
======================= */
function renderAll() {

  const selectedBrand = brandFilter.value;
  const selectedSize  = sizeFilter.value ? Number(sizeFilter.value) : null;

  document.querySelectorAll(".category").forEach(section => {

    const container = section.querySelector(".products");
    const categoryKey = container.dataset.category;
    const categoryProducts = products[categoryKey];

    let filteredProducts = categoryProducts.filter(p => {
      const brandMatch = !selectedBrand || p.brand === selectedBrand;
      const sizeMatch  = !selectedSize || p.sizes.includes(selectedSize);
      return brandMatch && sizeMatch;
    });

    // Regra do filtro de MARCA:
    if (selectedBrand) {
      section.style.display =
        categoryProducts.some(p => p.brand === selectedBrand)
        ? "block"
        : "none";
    } else {
      section.style.display = filteredProducts.length ? "block" : "none";
    }

    container.innerHTML = "";

    filteredProducts.forEach(p => renderCard(container, p));
  });

  console.info("🔄 Render atualizado", {
    marca: selectedBrand || "todas",
    tamanho: selectedSize || "todos"
  });
}

/* =======================
   CARD DO PRODUTO
======================= */
function renderCard(container, product) {

  let selectedSize = null;

  const card = document.createElement("div");
  card.className = "card";
  card.setAttribute("data-aos", "fade-up");

  card.innerHTML = `
    <img src="${product.img}" alt="${product.model}">
    <h3>${product.brand} - ${product.model}</h3>

    <span class="old">R$ ${product.old.toFixed(2)}</span>
    <span class="price">R$ ${product.pix.toFixed(2)} no PIX</span>
    <small>Até 4x de R$ ${product.card.toFixed(2)}</small>

    <div class="sizes">
      ${product.sizes.map(size => `
        <div class="size">${size}</div>
      `).join("")}
    </div>

    <button class="btn-buy">Comprar no WhatsApp</button>
  `;

  /* TAMANHOS */
  card.querySelectorAll(".size").forEach(el => {
    el.addEventListener("click", () => {
      card.querySelectorAll(".size").forEach(s => s.classList.remove("active"));
      el.classList.add("active");
      selectedSize = el.textContent;
    });
  });

  /* BOTÃO WHATSAPP */
  card.querySelector(".btn-buy").addEventListener("click", () => {

    if (!selectedSize) {
      alert("⚠️ Selecione um tamanho antes de continuar");
      return;
    }

    /* META PIXEL */
    if (typeof fbq === "function") {
      fbq("track", "Contact", {
        content_name: `${product.brand} ${product.model}`,
        content_category: product.brand,
        value: product.pix,
        currency: "BRL"
      });
      console.info("📊 Pixel: evento Contact disparado");
    }

    const message =
`Olá! 👟 Tenho interesse no produto abaixo:

📌 Produto: ${product.brand} ${product.model}
📏 Tamanho: ${selectedSize}

💰 Valor no PIX: R$ ${product.pix.toFixed(2)}
💳 Cartão: até 4x de R$ ${product.card.toFixed(2)}

📍 Pronta entrega em Leme - SP`;

    window.open(
      `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`,
      "_blank"
    );
  });

  container.appendChild(card);
}

/* =======================
   EVENTOS
======================= */
brandFilter.addEventListener("change", renderAll);
sizeFilter.addEventListener("change", renderAll);

clearBtn.addEventListener("click", () => {
  brandFilter.value = "";
  sizeFilter.value  = "";
  renderAll();
  console.info("🧹 Filtros limpos");
});

/* =======================
   START
======================= */
initFilters();
renderAll();
