console.info("🚀 Drak Feet iniciado");

AOS.init({ duration: 900, once: true });

const menuToggle = document.getElementById("menuToggle");
const menu = document.getElementById("menu");

menuToggle.onclick = () => {
  menu.style.display = menu.style.display === "block" ? "none" : "block";
};

/* =======================
   FILTROS
======================= */
function renderAll() {
  document.querySelectorAll(".category").forEach(section => {
    const container = section.querySelector(".products");
    const key = container.dataset.category;
    container.innerHTML = "";

    products[key].forEach(p => renderCard(container, p));
  });
}

/* =======================
   CARD
======================= */
function renderCard(container, p) {

  let selectedSize = null;
  let payment = "PIX";

  const card = document.createElement("div");
  card.className = "card";
  card.setAttribute("data-aos","fade-up");

  card.innerHTML = `
    <img src="${p.img}" alt="${p.model}">
    <h3>${p.brand} - ${p.model}</h3>

    <span class="old">R$ ${p.old.toFixed(2)}</span>
    <span class="price">R$ ${p.pix.toFixed(2)} no PIX</span>
    <small>R$ ${p.card.toFixed(2)} — Até 4x sem juros</small>

    <div class="sizes">
      ${p.sizes.map(s=>`<div class="size">${s}</div>`).join("")}
    </div>

    <div class="payment-method">
      <label>Escolha a Forma de Pagamento</label>
      <select>
        <option value="PIX">PIX</option>
        <option value="CARTAO">Cartão</option>
      </select>
    </div>

    <button class="btn-buy">Comprar no WhatsApp</button>
  `;

  card.querySelectorAll(".size").forEach(el=>{
    el.onclick=()=>{
      card.querySelectorAll(".size").forEach(s=>s.classList.remove("active"));
      el.classList.add("active");
      selectedSize=el.innerText;
    };
  });

  card.querySelector("select").onchange=e=>payment=e.target.value;

  card.querySelector(".btn-buy").onclick=()=>{
    if(!selectedSize){
      alert("Selecione um tamanho");
      return;
    }

    const paymentText = payment==="PIX"
      ? `PIX: R$ ${p.pix.toFixed(2)}`
      : `Cartão: R$ ${p.card.toFixed(2)} — Até 4x sem juros`;

    const message =
`👟 Drak Feet - Pedido via Catálogo

📌 Produto: ${p.brand} ${p.model}
📏 Tamanho: ${selectedSize}

💰 Forma de Pagamento:
${paymentText}`;

    window.open(
      `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`,
      "_blank"
    );
  };

  container.appendChild(card);
}

renderAll();
