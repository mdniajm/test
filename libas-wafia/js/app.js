/* Libas Wafia storefront — vanilla JS single-page shop.
 * Pages map to WooCommerce equivalents:
 *   #/            -> front page          #/shop        -> /shop (archive-product)
 *   #/product/:id -> single-product      #/checkout    -> /checkout
 *   #/order/:id   -> order-received      #/track       -> order tracking
 * Cart, wishlist and orders persist in localStorage until a real backend exists.
 */
(function () {
  "use strict";

  const S = window.STORE, P = window.PRODUCTS, C = window.CATEGORIES;
  const $ = (sel, el = document) => el.querySelector(sel);
  const app = $("#app");

  /* ---------- storage ---------- */
  const store = {
    get(k, d) { try { const v = localStorage.getItem("lw_" + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem("lw_" + k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } }
  };
  let cart = store.get("cart", []);          // [{id, size, qty}]
  let wish = store.get("wish", []);          // [id]
  let coupon = store.get("coupon", null);    // code string

  /* ---------- helpers ---------- */
  const money = n => S.currency + Math.round(n).toLocaleString("en-IN");
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const byId = id => P.find(p => p.id === Number(id));
  const catName = slug => (C.find(c => c.slug === slug) || {}).name || slug;
  const priceOf = p => p.salePrice || p.price;
  const telHref = "tel:" + S.phone.replace(/[^\d+]/g, "");
  const waHref = text => "https://wa.me/" + S.whatsapp + (text ? "?text=" + encodeURIComponent(text) : "");

  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg; t.classList.add("show");
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("show"), 2200);
  }

  /* Drawn garment placeholder, tinted per product, until real photos are added. */
  function art(p, cls = "ph") {
    if (p.image) return `<img class="${cls}" src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy">`;
    const c = p.color, light = shade(c, 0.55), dark = shade(c, -0.25);
    const shapes = {
      dress: `<path d="M150 70 q30 18 60 0 l34 22 -16 44 -16-6 v40 l40 150 H92 l40-150 v-40 l-16 6 -16-44z" fill="${c}"/>
              <path d="M150 70 q30 18 60 0 l-6 16 q-24 14 -48 0z" fill="${dark}"/>
              <path d="M128 190 h104" stroke="${light}" stroke-width="5" stroke-dasharray="2 9" stroke-linecap="round"/>
              <path d="M96 318 h168" stroke="${light}" stroke-width="7"/>
              <path d="M98 96 q-50 120 10 230 M262 96 q50 120 -10 230" fill="none" stroke="${light}" stroke-width="10" opacity=".7"/>`,
      kurti: `<path d="M148 70 q32 20 64 0 l46 26 -18 58 -22-8 v170 H142 v-170 l-22 8 -18-58z" fill="${c}"/>
              <path d="M180 82 v60" stroke="${dark}" stroke-width="3"/>
              <circle cx="180" cy="102" r="3" fill="${light}"/><circle cx="180" cy="120" r="3" fill="${light}"/>
              <path d="M142 290 h76" stroke="${light}" stroke-width="5" stroke-dasharray="1 8" stroke-linecap="round"/>`,
      abaya: `<path d="M180 52 c-26 0 -40 22 -40 44 l-34 30 -26 200 h200 l-26-200 -34-30 c0-22 -14-44 -40-44z" fill="${c}"/>
              <path d="M140 96 q40 30 80 0" fill="none" stroke="${light}" stroke-width="3" opacity=".6"/>
              <path d="M180 120 v206" stroke="${light}" stroke-width="2" opacity=".35"/>`,
      hijab: `<path d="M180 60 c-60 0 -84 60 -76 110 c6 40 -30 90 -40 150 h232 c-10 -60 -46 -110 -40 -150 c8 -50 -16 -110 -76 -110z" fill="${c}"/>
              <ellipse cx="180" cy="140" rx="38" ry="48" fill="${light}" opacity=".55"/>
              <path d="M112 230 q68 40 136 0" fill="none" stroke="${dark}" stroke-width="4" opacity=".5"/>`,
      saree: `<path d="M150 66 q30 16 60 0 l20 30 -14 30 v40 l46 160 H98 l46 -160 v-40 l-14-30z" fill="${c}"/>
              <path d="M210 66 l40 40 -90 220 h-30z" fill="${dark}" opacity=".8"/>
              <path d="M100 318 h160" stroke="${light}" stroke-width="10"/>
              <path d="M248 106 l-90 220" stroke="${light}" stroke-width="4" stroke-dasharray="3 7"/>`,
      kids: `<path d="M160 100 q20 12 40 0 l26 18 -12 32 -12-4 v20 l46 110 H112 l46 -110 v-20 l-12 4 -12-32z" fill="${c}"/>
             <path d="M114 276 h132" stroke="${light}" stroke-width="6" stroke-dasharray="6 6"/>
             <circle cx="180" cy="150" r="6" fill="${light}"/>`
    };
    return `<svg class="${cls}" viewBox="0 0 360 450" role="img" aria-label="${esc(p.name)}">
      <defs><linearGradient id="g${p.id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(c, 0.86)}"/><stop offset="1" stop-color="${shade(c, 0.72)}"/></linearGradient></defs>
      <rect width="360" height="450" fill="url(#g${p.id})"/>
      <path d="M180 22 v28" stroke="#8a7f7f" stroke-width="2"/><path d="M160 54 q20 -14 40 0" fill="none" stroke="#8a7f7f" stroke-width="3"/>
      <g transform="translate(0 12)">${shapes[p.shape] || shapes.dress}</g>
      <text x="180" y="430" text-anchor="middle" font-family="Cormorant Garamond, serif" font-size="15" letter-spacing="3" fill="${dark}" opacity=".7">LIBAS WAFIA</text>
    </svg>`;
  }
  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    const f = v => amt > 0 ? Math.round(v + (255 - v) * amt) : Math.round(v * (1 + amt));
    return "#" + [f(r), f(g), f(b)].map(v => v.toString(16).padStart(2, "0")).join("");
  }

  /* ---------- cart ---------- */
  function saveCart() { store.set("cart", cart); renderCartUI(); }
  function addToCart(id, size, qty = 1) {
    const p = byId(id); if (!p || p.stock <= 0) return toast("Sorry, this item is out of stock");
    size = size || p.sizes[0];
    const line = cart.find(l => l.id === p.id && l.size === size);
    const have = line ? line.qty : 0;
    const allowed = Math.min(qty, p.stock - have);
    if (allowed <= 0) return toast(`Only ${p.stock} in stock`);
    if (line) line.qty += allowed; else cart.push({ id: p.id, size, qty: allowed });
    saveCart(); toast(`Added to bag — ${p.name}`); openCart();
  }
  function setQty(i, q) {
    const l = cart[i]; if (!l) return;
    const p = byId(l.id);
    l.qty = Math.max(1, Math.min(q, p.stock));
    saveCart(); if (route().name === "checkout") render();
  }
  function removeLine(i) { cart.splice(i, 1); saveCart(); if (route().name === "checkout") render(); }

  function couponDiscount(sub) {
    if (!coupon) return 0;
    const c = S.coupons[coupon]; if (!c) return 0;
    if (c.min && sub < c.min) return 0;
    return c.type === "percent" ? Math.round(sub * c.amount / 100) : Math.min(c.amount, sub);
  }
  function totals(shipId) {
    const sub = cart.reduce((s, l) => s + priceOf(byId(l.id)) * l.qty, 0);
    const disc = couponDiscount(sub);
    const zone = S.shipping.find(z => z.id === shipId) || S.shipping[0];
    const ship = cart.length === 0 ? 0 : (sub - disc >= S.freeShippingOver ? 0 : zone.cost);
    return { sub, disc, ship, total: sub - disc + ship, zone };
  }
  const cartCount = () => cart.reduce((s, l) => s + l.qty, 0);

  function lineHTML(l, i, editable) {
    const p = byId(l.id);
    return `<div class="line">
      <a href="#/product/${p.id}">${art(p)}</a>
      <div>
        <div class="line-title">${esc(p.name)}</div>
        <div class="line-meta">Size: ${esc(l.size)} · ${money(priceOf(p))}</div>
        ${editable ? `<div class="qty" data-i="${i}"><button data-q="-1" aria-label="Decrease">−</button><input value="${l.qty}" inputmode="numeric" aria-label="Quantity"><button data-q="1" aria-label="Increase">+</button></div>
        <div><button class="remove" data-rm="${i}">Remove</button></div>` : `<div class="line-meta">Qty: ${l.qty}</div>`}
      </div>
      <b>${money(priceOf(p) * l.qty)}</b>
    </div>`;
  }

  function renderCartUI() {
    const n = cartCount();
    $("#cartCount").textContent = n; $("#cartCount").dataset.zero = n ? 0 : 1;
    $("#wishCount").textContent = wish.length; $("#wishCount").dataset.zero = wish.length ? 0 : 1;
    const body = $("#cartItems"), foot = $("#cartFoot");
    if (!cart.length) {
      body.innerHTML = `<div class="empty"><div class="big">👜</div><p>Your bag is empty.</p><a class="btn" href="#/shop">Start shopping</a></div>`;
      foot.innerHTML = ""; return;
    }
    body.innerHTML = cart.map((l, i) => lineHTML(l, i, true)).join("");
    const t = totals();
    const left = S.freeShippingOver - (t.sub - t.disc);
    foot.innerHTML = `
      <div class="row"><span>Subtotal</span><b>${money(t.sub)}</b></div>
      ${t.disc ? `<div class="row"><span>Discount (${esc(coupon)})</span><b>−${money(t.disc)}</b></div>` : ""}
      <p class="muted">${left > 0 ? `Add ${money(left)} more for <b>free delivery</b>.` : "🎉 You've unlocked free delivery!"} Delivery is calculated at checkout.</p>
      <a class="btn block" href="#/checkout">Checkout</a>
      <button class="btn ghost block" style="margin-top:8px" id="waOrder">Order on WhatsApp</button>`;
    $("#waOrder").onclick = () => window.open(waHref(orderText()), "_blank");
  }
  function orderText(order) {
    const lines = (order ? order.items : cart).map(l => {
      const p = byId(l.id); return `• ${p.name} (${p.sku}) — Size ${l.size} × ${l.qty} = ${money(priceOf(p) * l.qty)}`;
    });
    let s = `Assalamu Alaikum, I want to order from ${S.name}:\n` + lines.join("\n");
    if (order) s += `\n\nOrder #${order.id}\nTotal: ${money(order.total)}\nName: ${order.customer.name}\nPhone: ${order.customer.phone}\nAddress: ${order.customer.address}, ${order.customer.area}, ${order.customer.district}\nPayment: ${order.paymentLabel}`;
    return s;
  }

  function openCart() { $("#cartDrawer").classList.add("open"); $("#cartDrawer").setAttribute("aria-hidden", "false"); $("#overlay").classList.add("show"); }
  function closeCart() { $("#cartDrawer").classList.remove("open"); $("#cartDrawer").setAttribute("aria-hidden", "true"); $("#overlay").classList.remove("show"); $("#nav").classList.remove("open"); }

  /* ---------- wishlist ---------- */
  function toggleWish(id) {
    id = Number(id);
    wish = wish.includes(id) ? wish.filter(x => x !== id) : [...wish, id];
    store.set("wish", wish); renderCartUI();
    toast(wish.includes(id) ? "Saved to wishlist" : "Removed from wishlist");
    document.querySelectorAll(`.wish[data-wish="${id}"]`).forEach(b => { b.classList.toggle("on", wish.includes(id)); b.textContent = wish.includes(id) ? "♥" : "♡"; });
    if (route().name === "wishlist") render();
  }

  /* ---------- components ---------- */
  function card(p) {
    const on = wish.includes(p.id), out = p.stock <= 0;
    const off = p.salePrice ? Math.round((1 - p.salePrice / p.price) * 100) : 0;
    return `<article class="card">
      <a class="card-media" href="#/product/${p.id}">
        ${art(p)}
        ${out ? `<span class="tag out">SOLD OUT</span>` : off ? `<span class="tag">-${off}%</span>` : ""}
        ${p.isNew && !out ? `<span class="tag new">NEW</span>` : ""}
      </a>
      <button class="wish ${on ? "on" : ""}" data-wish="${p.id}" aria-label="Toggle wishlist">${on ? "♥" : "♡"}</button>
      <div class="card-body">
        <span class="card-cat">${esc(catName(p.category))}</span>
        <a class="card-title" href="#/product/${p.id}">${esc(p.name)}</a>
        <div class="price">${money(priceOf(p))}${p.salePrice ? `<del>${money(p.price)}</del>` : ""}</div>
        <button class="btn ${out ? "ghost" : ""}" data-add="${p.id}" ${out ? "disabled" : ""}>${out ? "Out of stock" : "Add to bag"}</button>
      </div>
    </article>`;
  }

  /* ---------- pages ---------- */
  function home() {
    const featured = P.filter(p => p.featured).slice(0, 8);
    const fresh = P.filter(p => p.isNew).slice(0, 4);
    const heroPicks = [P[1], P[7]];
    return `
      <section class="hero">
        <div>
          <span class="eyebrow">New Collection · ${new Date().getFullYear()}</span>
          <h1>Wear your <em>grace</em>,<br>every day.</h1>
          <p>Three piece, kurti, abaya, hijab and more — handpicked by Libas Wafia in Bashundhara, Dhaka and delivered to your door anywhere in Bangladesh.</p>
          <div class="hero-cta">
            <a class="btn" href="#/shop">Shop the collection</a>
            <a class="btn ghost" href="#/shop?cat=abaya">Explore abaya</a>
          </div>
        </div>
        <div class="hero-art">${heroPicks.map(p => art(p)).join("")}</div>
      </section>

      <div class="perks">
        <div class="perk"><span class="i">🚚</span><div><b>Nationwide delivery</b><span>Inside Dhaka ${money(S.shipping[0].cost)}</span></div></div>
        <div class="perk"><span class="i">💵</span><div><b>Cash on delivery</b><span>Pay when you receive</span></div></div>
        <div class="perk"><span class="i">📱</span><div><b>bKash & Nagad</b><span>Mobile payment accepted</span></div></div>
        <div class="perk"><span class="i">🔁</span><div><b>Easy exchange</b><span>Within 3 days</span></div></div>
      </div>

      <section class="section">
        <div class="section-head"><h2>Shop by category</h2><a class="link" href="#/shop">View all →</a></div>
        <div class="cat-grid">${C.map(c => {
          const sample = P.find(p => p.category === c.slug);
          return `<a class="cat-card" href="#/shop?cat=${c.slug}">${art(sample)}<b>${esc(c.name)}</b><small class="bn">${c.bn}</small></a>`;
        }).join("")}</div>
      </section>

      <section class="section">
        <div class="section-head"><h2>Bestsellers</h2><a class="link" href="#/shop">Shop all →</a></div>
        <div class="grid">${featured.map(card).join("")}</div>
      </section>

      <section class="banner">
        <div><h3>Get 10% off your first order</h3><p>Use code <code>WAFIA10</code> at checkout.</p></div>
        <a class="btn light" href="#/shop">Shop now</a>
      </section>

      <section class="section">
        <div class="section-head"><h2>New arrivals</h2><a class="link" href="#/shop?sort=new">See more →</a></div>
        <div class="grid">${fresh.map(card).join("")}</div>
      </section>`;
  }

  function shop(q) {
    const cat = q.get("cat") || "", term = (q.get("q") || "").trim().toLowerCase(), sort = q.get("sort") || "default";
    const min = Number(q.get("min")) || 0, max = Number(q.get("max")) || Infinity, instock = q.get("instock") === "1";
    let list = P.filter(p =>
      (!cat || p.category === cat) &&
      (!term || (p.name + " " + p.description + " " + catName(p.category)).toLowerCase().includes(term)) &&
      priceOf(p) >= min && priceOf(p) <= max && (!instock || p.stock > 0));
    const sorters = {
      "price-asc": (a, b) => priceOf(a) - priceOf(b),
      "price-desc": (a, b) => priceOf(b) - priceOf(a),
      "new": (a, b) => (b.isNew - a.isNew) || b.id - a.id,
      "name": (a, b) => a.name.localeCompare(b.name)
    };
    if (sorters[sort]) list = [...list].sort(sorters[sort]);
    const title = term ? `Search: “${esc(term)}”` : cat ? esc(catName(cat)) : "All products";
    const link = changes => { const n = new URLSearchParams(q); Object.entries(changes).forEach(([k, v]) => v === "" || v == null ? n.delete(k) : n.set(k, v)); const s = n.toString(); return "#/shop" + (s ? "?" + s : ""); };

    return `
      <div class="crumbs"><a href="#/">Home</a> / Shop${cat ? " / " + esc(catName(cat)) : ""}</div>
      <div class="shop">
        <aside class="filters">
          <div class="group">
            <h4>Category</h4>
            <a class="opt ${!cat ? "active" : ""}" href="${link({ cat: "" })}"><span>All</span><span>${P.length}</span></a>
            ${C.map(c => `<a class="opt ${cat === c.slug ? "active" : ""}" href="${link({ cat: c.slug })}"><span>${esc(c.name)}</span><span>${P.filter(p => p.category === c.slug).length}</span></a>`).join("")}
          </div>
          <form class="group" id="priceForm">
            <h4>Price (${S.currency})</h4>
            <div class="range"><input name="min" type="number" min="0" placeholder="Min" value="${min || ""}"><input name="max" type="number" min="0" placeholder="Max" value="${isFinite(max) ? max : ""}"></div>
            <label style="display:flex;gap:8px;margin-top:12px;font-size:14px"><input type="checkbox" name="instock" ${instock ? "checked" : ""}> In stock only</label>
            <button class="btn ghost block" style="margin-top:12px;padding:8px">Apply</button>
          </form>
        </aside>
        <section>
          <div class="toolbar">
            <div><h1>${title}</h1><span class="muted">${list.length} product${list.length === 1 ? "" : "s"}</span></div>
            <select id="sortSel" aria-label="Sort products">
              ${[["default", "Featured"], ["new", "Newest"], ["price-asc", "Price: low to high"], ["price-desc", "Price: high to low"], ["name", "Name A–Z"]]
                .map(([v, l]) => `<option value="${v}" ${sort === v ? "selected" : ""}>${l}</option>`).join("")}
            </select>
          </div>
          ${list.length ? `<div class="grid">${list.map(card).join("")}</div>` :
            `<div class="empty"><div class="big">🔍</div><p>No products match your filters.</p><a class="btn ghost" href="#/shop">Clear filters</a></div>`}
        </section>
      </div>`;
  }

  function product(id) {
    const p = byId(id);
    if (!p) return notFound();
    const out = p.stock <= 0;
    const stockCls = out ? "no" : p.stock <= 5 ? "low" : "ok";
    const stockTxt = out ? "Out of stock" : p.stock <= 5 ? `Only ${p.stock} left — order soon` : "In stock";
    const related = P.filter(x => x.category === p.category && x.id !== p.id).slice(0, 4);
    return `
      <div class="crumbs"><a href="#/">Home</a> / <a href="#/shop">Shop</a> / <a href="#/shop?cat=${p.category}">${esc(catName(p.category))}</a> / ${esc(p.name)}</div>
      <div class="pdp">
        <div class="pdp-media">${art(p)}</div>
        <div>
          <span class="card-cat">${esc(catName(p.category))} · SKU ${esc(p.sku)}</span>
          <h1>${esc(p.name)}</h1>
          <div class="price">${money(priceOf(p))}${p.salePrice ? `<del>${money(p.price)}</del><span class="save">Save ${money(p.price - p.salePrice)}</span>` : ""}</div>
          <div class="stock ${stockCls}">● ${stockTxt}</div>
          <p>${esc(p.description)}</p>
          <div class="opt-label">Size</div>
          <div class="sizes" id="sizes">${p.sizes.map((s, i) => `<button class="size ${i === 0 ? "active" : ""}" data-size="${esc(s)}">${esc(s)}</button>`).join("")}</div>
          <div class="opt-label">Quantity</div>
          <div class="qty" id="pdpQty"><button data-q="-1" aria-label="Decrease">−</button><input value="1" inputmode="numeric" aria-label="Quantity"><button data-q="1" aria-label="Increase">+</button></div>
          <div class="pdp-actions">
            <button class="btn" id="pdpAdd" ${out ? "disabled" : ""}>Add to bag</button>
            <button class="btn gold" id="pdpBuy" ${out ? "disabled" : ""}>Buy now</button>
            <button class="wish ${wish.includes(p.id) ? "on" : ""}" style="position:static;width:48px;height:48px;border:1.5px solid var(--line)" data-wish="${p.id}" aria-label="Toggle wishlist">${wish.includes(p.id) ? "♥" : "♡"}</button>
          </div>
          <a class="btn wa block" style="margin-top:10px" target="_blank" rel="noopener" href="${waHref(`Hi ${S.name}, I'm interested in "${p.name}" (${p.sku}) — ${money(priceOf(p))}. Is it available?`)}">💬 Ask on WhatsApp</a>
          <div class="info-list">
            <details open><summary>Delivery</summary><p>${S.shipping.map(z => `${z.label}: ${money(z.cost)}`).join(" · ")}. Free delivery on orders over ${money(S.freeShippingOver)}. Inside Dhaka 1–2 days, outside Dhaka 2–4 days.</p></details>
            <details><summary>Payment</summary><p>${S.payments.map(x => x.label).join(", ")}.</p></details>
            <details><summary>Exchange policy</summary><p>Check the product in front of the delivery person. Size exchange within 3 days if the item is unused with tags.</p></details>
            <details><summary>Size guide</summary><p>S (34") · M (36") · L (38") · XL (40") · XXL (42") chest. Abaya sizes are length in inches. Message us for custom measurements.</p></details>
          </div>
        </div>
      </div>
      ${related.length ? `<section class="section"><div class="section-head"><h2>You may also like</h2></div><div class="grid">${related.map(card).join("")}</div></section>` : ""}`;
  }

  function wishlist() {
    const list = wish.map(byId).filter(Boolean);
    return `<div class="toolbar"><h1>Wishlist</h1></div>
      ${list.length ? `<div class="grid">${list.map(card).join("")}</div>` :
        `<div class="empty"><div class="big">♡</div><p>Nothing saved yet. Tap the heart on any product to save it.</p><a class="btn" href="#/shop">Browse products</a></div>`}`;
  }

  const DISTRICTS = ["Dhaka", "Gazipur", "Narayanganj", "Chattogram", "Cox's Bazar", "Cumilla", "Feni", "Noakhali", "Sylhet", "Moulvibazar", "Rajshahi", "Bogura", "Pabna", "Khulna", "Jashore", "Kushtia", "Barishal", "Patuakhali", "Rangpur", "Dinajpur", "Mymensingh", "Tangail", "Jamalpur", "Faridpur", "Other"];

  function checkout() {
    if (!cart.length) return `<div class="empty"><div class="big">👜</div><p>Your bag is empty.</p><a class="btn" href="#/shop">Go to shop</a></div>`;
    const draft = store.get("draft", {});
    const ship = draft.shipping || "inside_dhaka", pay = draft.payment || "cod";
    const t = totals(ship);
    const f = (name, label, attrs = "", full = false) => `<label class="field ${full ? "full" : ""}">${label}<input name="${name}" value="${esc(draft[name] || "")}" ${attrs}><span class="err"></span></label>`;
    return `
      <div class="crumbs"><a href="#/">Home</a> / Checkout</div>
      <form class="checkout" id="checkoutForm" novalidate>
        <div class="panel">
          <h2>Delivery details</h2>
          <div class="fields">
            ${f("name", "Full name *", 'autocomplete="name" required')}
            ${f("phone", "Mobile number *", 'type="tel" inputmode="tel" autocomplete="tel" placeholder="01XXXXXXXXX" required')}
            ${f("email", "Email (optional)", 'type="email" autocomplete="email"')}
            <label class="field">District *<select name="district" required>${DISTRICTS.map(d => `<option ${draft.district === d ? "selected" : ""}>${d}</option>`).join("")}</select><span class="err"></span></label>
            ${f("area", "Area / Thana *", 'placeholder="e.g. Bashundhara R/A" required')}
            ${f("address", "Full address *", 'placeholder="House, road, block" autocomplete="street-address" required', true)}
            <label class="field full">Order note (optional)<textarea name="note" rows="2" placeholder="Colour preference, delivery time…">${esc(draft.note || "")}</textarea></label>
          </div>

          <h3>Delivery area</h3>
          ${S.shipping.map(z => `<label class="choice"><input type="radio" name="shipping" value="${z.id}" ${ship === z.id ? "checked" : ""}><span><b>${z.label}</b> — ${money(z.cost)}</span></label>`).join("")}

          <h3>Payment method</h3>
          ${S.payments.map(m => `<label class="choice"><input type="radio" name="payment" value="${m.id}" ${pay === m.id ? "checked" : ""}><span><b>${m.label}</b><span class="muted">${esc(m.note)}</span></span></label>`).join("")}
          <div id="trxWrap" style="${pay === "cod" ? "display:none" : ""}">${f("trx", "Transaction ID (TrxID) *", 'placeholder="e.g. 9BX7K2L1QZ"')}</div>
        </div>

        <div class="panel summary">
          <h2>Your order</h2>
          ${cart.map((l, i) => lineHTML(l, i, true)).join("")}
          <div class="coupon"><input id="couponInput" placeholder="Coupon code" value="${esc(coupon || "")}"><button type="button" class="btn ghost" id="applyCoupon">Apply</button></div>
          <div class="row"><span>Subtotal</span><b>${money(t.sub)}</b></div>
          ${t.disc ? `<div class="row"><span>Discount (${esc(coupon)}) <button type="button" class="remove" id="rmCoupon">remove</button></span><b>−${money(t.disc)}</b></div>` : ""}
          <div class="row"><span>Delivery (${t.zone.label})</span><b>${t.ship ? money(t.ship) : "Free"}</b></div>
          <div class="row total"><span>Total</span><span>${money(t.total)}</span></div>
          <button class="btn block" style="margin-top:16px" type="submit">Place order · ${money(t.total)}</button>
          <p class="muted" style="text-align:center">We'll call you to confirm before dispatch.</p>
        </div>
      </form>`;
  }

  function validate(form) {
    const d = Object.fromEntries(new FormData(form));
    const errs = {};
    if (!d.name || d.name.trim().length < 2) errs.name = "Please enter your name";
    const phone = (d.phone || "").replace(/[\s-]/g, "").replace(/^\+?88/, "");
    if (!/^01[3-9]\d{8}$/.test(phone)) errs.phone = "Enter a valid Bangladeshi mobile number (01XXXXXXXXX)";
    if (d.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) errs.email = "Enter a valid email";
    if (!d.area || !d.area.trim()) errs.area = "Please enter your area";
    if (!d.address || d.address.trim().length < 5) errs.address = "Please enter your full address";
    if (d.payment !== "cod" && !(d.trx || "").trim()) errs.trx = "Enter the transaction ID from your payment";
    form.querySelectorAll(".field").forEach(el => {
      const input = el.querySelector("input,select,textarea"); if (!input) return;
      const e = errs[input.name];
      el.classList.toggle("invalid", !!e);
      const span = el.querySelector(".err"); if (span) span.textContent = e || "";
    });
    return { ok: !Object.keys(errs).length, d, phone };
  }

  function placeOrder(form) {
    const { ok, d, phone } = validate(form);
    if (!ok) { const first = form.querySelector(".invalid input, .invalid select"); first && first.focus(); return toast("Please fix the highlighted fields"); }
    const t = totals(d.shipping);
    const order = {
      id: "LW" + Date.now().toString().slice(-7),
      date: new Date().toISOString(),
      status: "pending",
      items: cart.map(l => ({ ...l, price: priceOf(byId(l.id)) })),
      customer: { name: d.name.trim(), phone, email: d.email, district: d.district, area: d.area.trim(), address: d.address.trim(), note: d.note },
      shipping: t.zone.id, shippingCost: t.ship, subtotal: t.sub, discount: t.disc, coupon: t.disc ? coupon : null, total: t.total,
      payment: d.payment, paymentLabel: S.payments.find(m => m.id === d.payment).label, trx: d.trx || ""
    };
    const orders = store.get("orders", []); orders.unshift(order); store.set("orders", orders);
    cart = []; coupon = null; store.set("coupon", null); store.set("draft", {}); saveCart();
    location.hash = "#/order/" + order.id;
  }

  const STEPS = ["Placed", "Confirmed", "Shipped", "Delivered"];
  function orderView(id) {
    const o = store.get("orders", []).find(x => x.id === id);
    if (!o) return `<div class="page"><h1>Order not found</h1><p>We couldn't find order <b>${esc(id)}</b> on this device. Contact us with your order number.</p><a class="btn" href="#/track">Track another order</a></div>`;
    const stepIdx = { pending: 0, confirmed: 1, shipped: 2, delivered: 3 }[o.status] || 0;
    return `<div class="confirm">
      <div class="check">✓</div>
      <h1>Thank you, ${esc(o.customer.name.split(" ")[0])}!</h1>
      <p class="muted">Your order <b>#${o.id}</b> has been received. We'll call ${esc(o.customer.phone)} to confirm.</p>
      <div class="panel">
        <div class="row"><span>Status</span><span class="status">${STEPS[stepIdx]}</span></div>
        <div class="timeline">${STEPS.map((s, i) => `<div class="step ${i <= stepIdx ? "done" : ""}"><i>${i + 1}</i>${s}</div>`).join("")}</div>
        ${o.items.map(l => lineHTML(l, 0, false)).join("")}
        <div class="row"><span>Subtotal</span><b>${money(o.subtotal)}</b></div>
        ${o.discount ? `<div class="row"><span>Discount (${esc(o.coupon)})</span><b>−${money(o.discount)}</b></div>` : ""}
        <div class="row"><span>Delivery</span><b>${o.shippingCost ? money(o.shippingCost) : "Free"}</b></div>
        <div class="row total"><span>Total</span><span>${money(o.total)}</span></div>
        <p class="muted">Payment: ${esc(o.paymentLabel)}${o.trx ? " · TrxID " + esc(o.trx) : ""}<br>Deliver to: ${esc(o.customer.address)}, ${esc(o.customer.area)}, ${esc(o.customer.district)}</p>
      </div>
      <div class="hero-cta" style="justify-content:center">
        <a class="btn wa" target="_blank" rel="noopener" href="${waHref(orderText(o))}">💬 Send order on WhatsApp</a>
        <a class="btn ghost" href="#/shop">Continue shopping</a>
      </div>
    </div>`;
  }

  function track(q) {
    const id = (q.get("id") || "").trim().toUpperCase();
    const mine = store.get("orders", []);
    if (id) { const o = mine.find(x => x.id === id); if (o) return orderView(id); }
    return `<div class="page">
      <h1>Track your order</h1>
      <p class="muted">Enter the order number from your confirmation (e.g. LW1234567).</p>
      <form id="trackForm" class="coupon"><input name="id" placeholder="Order number" value="${esc(id)}" required><button class="btn">Track</button></form>
      ${id ? `<p style="color:var(--danger)">No order <b>${esc(id)}</b> found on this device. Please call <a class="link" href="${telHref}">${S.phone}</a>.</p>` : ""}
      ${mine.length ? `<h2>Your recent orders</h2>${mine.slice(0, 10).map(o => `<a class="row panel" style="padding:14px 18px;margin-bottom:8px" href="#/order/${o.id}"><span><b>#${o.id}</b> · ${new Date(o.date).toLocaleDateString("en-GB")}</span><span>${money(o.total)} →</span></a>`).join("")}` : ""}
    </div>`;
  }

  const about = () => `<div class="page">
    <h1>About Libas Wafia</h1>
    <p><b>Libas</b> means attire, and <b>Wafia</b> means faithful. We're a women's clothing store based in ${esc(S.location)}. We bring you modest, elegant and comfortable clothing at honest prices.</p>
    <h2>What we offer</h2>
    <p>Three piece sets, kurtis, abayas and borkas, hijabs, sarees and festive wear for little ones. We choose every piece for its fabric, finish and fit.</p>
    <h2>Our promise</h2>
    <p>What you see is what you get. Check your parcel in front of the delivery person, and we'll happily exchange sizes within 3 days.</p>
    <a class="btn" href="#/shop">Shop the collection</a>
  </div>`;

  const contact = () => `<div class="page">
    <h1>Contact us</h1>
    <p class="muted">Questions about a product, size or order? We usually reply within an hour.</p>
    <div class="contact-cards">
      <a href="${telHref}"><div class="i">📞</div><b>Call</b><div class="muted">${esc(S.phone)}</div></a>
      <a href="${waHref("Hi " + S.name + "!")}" target="_blank" rel="noopener"><div class="i">💬</div><b>WhatsApp</b><div class="muted">Chat with us</div></a>
      <a href="${S.messenger}" target="_blank" rel="noopener"><div class="i">✉️</div><b>Messenger</b><div class="muted">Libas Wafia</div></a>
    </div>
    <p>📧 <a class="link" href="mailto:${esc(S.email)}">${esc(S.email)}</a><br>📍 ${esc(S.location)}</p>
  </div>`;

  const policy = () => `<div class="page">
    <h1>Delivery & Returns</h1>
    <h2>Delivery charges</h2>
    <p>${S.shipping.map(z => `${z.label}: <b>${money(z.cost)}</b>`).join("<br>")}<br>Free delivery on orders over <b>${money(S.freeShippingOver)}</b>.</p>
    <h2>Delivery time</h2><p>Inside Dhaka: 1–2 working days. Outside Dhaka: 2–4 working days.</p>
    <h2>Payment</h2><p>${S.payments.map(p => `<b>${p.label}</b> — ${esc(p.note)}`).join("<br>")}</p>
    <h2>Exchange & returns</h2><p>Please check your product in front of the delivery person. If the size doesn't fit, we exchange within 3 days as long as the item is unused and has its tags. If an item is damaged or wrong, we replace it free of charge.</p>
  </div>`;

  const notFound = () => `<div class="empty"><div class="big">🧵</div><h2>Page not found</h2><a class="btn" href="#/">Back home</a></div>`;

  /* ---------- router ---------- */
  function route() {
    const h = location.hash.replace(/^#/, "") || "/";
    const [path, qs] = h.split("?");
    const parts = path.split("/").filter(Boolean);
    return { name: parts[0] || "home", arg: parts[1], q: new URLSearchParams(qs || "") };
  }
  function render() {
    const r = route();
    const views = {
      home, shop: () => shop(r.q), product: () => product(r.arg), wishlist, checkout,
      order: () => orderView(r.arg), track: () => track(r.q), about, contact, policy
    };
    app.innerHTML = (views[r.name] || notFound)();
    document.querySelectorAll(".nav > a").forEach(a => a.classList.toggle("active", a.getAttribute("href") === "#/" + (r.name === "home" ? "" : r.name)));
    const titles = { home: "Women's Clothing Store, Bashundhara", shop: "Shop", product: (byId(r.arg) || {}).name, wishlist: "Wishlist", checkout: "Checkout", order: "Order received", track: "Track order", about: "About", contact: "Contact", policy: "Delivery & Returns" };
    document.title = `${titles[r.name] || "Not found"} — ${S.name}`;
    bindPage(r);
  }

  function bindPage(r) {
    if (r.name === "shop") {
      $("#sortSel").onchange = e => { const q = new URLSearchParams(r.q); q.set("sort", e.target.value); location.hash = "#/shop?" + q; };
      $("#priceForm").onsubmit = e => {
        e.preventDefault(); const fd = new FormData(e.target); const q = new URLSearchParams(r.q);
        ["min", "max"].forEach(k => fd.get(k) ? q.set(k, fd.get(k)) : q.delete(k));
        fd.get("instock") ? q.set("instock", "1") : q.delete("instock");
        location.hash = "#/shop?" + q;
      };
    }
    if (r.name === "product") {
      const p = byId(r.arg); if (!p) return;
      const sizes = $("#sizes"), qtyIn = $("#pdpQty input");
      sizes.onclick = e => { const b = e.target.closest(".size"); if (!b) return; sizes.querySelectorAll(".size").forEach(x => x.classList.toggle("active", x === b)); };
      $("#pdpQty").onclick = e => { const b = e.target.closest("[data-q]"); if (!b) return; qtyIn.value = Math.max(1, Math.min(p.stock || 1, (Number(qtyIn.value) || 1) + Number(b.dataset.q))); };
      const sel = () => [p.id, sizes.querySelector(".active").dataset.size, Math.max(1, Number(qtyIn.value) || 1)];
      $("#pdpAdd").onclick = () => addToCart(...sel());
      $("#pdpBuy").onclick = () => { addToCart(...sel()); closeCart(); location.hash = "#/checkout"; };
    }
    if (r.name === "checkout" && cart.length) {
      const form = $("#checkoutForm");
      const saveDraft = () => store.set("draft", Object.fromEntries(new FormData(form)));
      form.oninput = saveDraft;
      form.onchange = e => {
        saveDraft();
        if (e.target.name === "shipping") render();
        if (e.target.name === "payment") $("#trxWrap").style.display = e.target.value === "cod" ? "none" : "";
        // auto-pick delivery zone from district
        if (e.target.name === "district") {
          const z = e.target.value === "Dhaka" ? "inside_dhaka" : "outside_dhaka";
          const d = store.get("draft", {}); d.shipping = z; store.set("draft", d); render();
        }
      };
      form.onsubmit = e => { e.preventDefault(); placeOrder(form); };
      $("#applyCoupon").onclick = () => {
        const code = $("#couponInput").value.trim().toUpperCase();
        const c = S.coupons[code];
        if (!c) return toast("Invalid coupon code");
        if (c.min && totals().sub < c.min) return toast(`${code} needs a minimum order of ${money(c.min)}`);
        coupon = code; store.set("coupon", coupon); saveCart(); render(); toast("Coupon applied 🎉");
      };
      const rm = $("#rmCoupon"); if (rm) rm.onclick = () => { coupon = null; store.set("coupon", null); saveCart(); render(); };
    }
    if (r.name === "track") {
      $("#trackForm").onsubmit = e => { e.preventDefault(); location.hash = "#/track?id=" + encodeURIComponent(new FormData(e.target).get("id")); };
    }
  }

  /* ---------- global events ---------- */
  document.addEventListener("click", e => {
    const add = e.target.closest("[data-add]"); if (add) { e.preventDefault(); return addToCart(add.dataset.add); }
    const w = e.target.closest("[data-wish]"); if (w) { e.preventDefault(); return toggleWish(w.dataset.wish); }
    const rm = e.target.closest("[data-rm]"); if (rm) return removeLine(Number(rm.dataset.rm));
    const qb = e.target.closest(".qty[data-i] [data-q]");
    if (qb) { const i = Number(qb.closest(".qty").dataset.i); return setQty(i, cart[i].qty + Number(qb.dataset.q)); }
  });
  document.addEventListener("change", e => {
    const qi = e.target.closest(".qty[data-i] input"); if (qi) setQty(Number(qi.closest(".qty").dataset.i), Number(qi.value) || 1);
  });
  $("#cartBtn").onclick = openCart;
  $("#closeCart").onclick = closeCart;
  $("#overlay").onclick = closeCart;
  $("#menuBtn").onclick = () => { $("#nav").classList.add("open"); $("#overlay").classList.add("show"); };
  $("#nav").addEventListener("click", e => { if (e.target.closest("a")) closeCart(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeCart(); });
  $("#searchForm").onsubmit = e => { e.preventDefault(); const v = $("#searchInput").value.trim(); location.hash = "#/shop" + (v ? "?q=" + encodeURIComponent(v) : ""); };
  window.addEventListener("hashchange", () => { closeCart(); render(); window.scrollTo(0, 0); });

  /* ---------- static bits ---------- */
  $("#topPhone").href = telHref; $("#topPhone").textContent = "📞 " + S.phone;
  $("#fbLink").href = S.facebook; $("#msgLink").href = S.messenger; $("#waLink").href = waHref();
  $("#year").textContent = new Date().getFullYear();
  $("#navCats").innerHTML = C.map(c => `<a href="#/shop?cat=${c.slug}">${esc(c.name)}</a>`).join("");
  $("#footerCats").innerHTML = C.map(c => `<a href="#/shop?cat=${c.slug}">${esc(c.name)}</a>`).join("");
  const fc = document.createElement("div");
  fc.innerHTML = `<p style="margin-top:12px">📍 ${esc(S.location)}<br>📞 <a style="display:inline" href="${telHref}">${esc(S.phone)}</a><br>📧 <a style="display:inline" href="mailto:${esc(S.email)}">${esc(S.email)}</a></p>`;
  $(".footer-grid > div").appendChild(fc);

  renderCartUI();
  render();
})();
