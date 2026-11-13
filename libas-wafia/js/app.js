/* Libas Wafia storefront — vanilla JS single-page shop.
 * Views map to WooCommerce templates:
 *   home -> front page, shop -> archive-product, product -> single-product,
 *   checkout -> /checkout, order -> order-received, track -> order tracking.
 * Cart, wishlist, recently viewed and orders persist in localStorage until a real backend exists.
 * Routing uses the URL hash ("#/shop?cat=abaya"). Set window.LW_MEMORY_ROUTER = true
 * before this script to keep routes in memory instead (used by the shareable preview build).
 */
(function () {
  "use strict";

  const S = window.STORE, P = window.PRODUCTS, C = window.CATEGORIES;
  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
  const app = $("#app");
  const MEMORY = !!window.LW_MEMORY_ROUTER;

  /* ---------- storage ---------- */
  const store = {
    get(k, d) { try { const v = localStorage.getItem("lw_" + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem("lw_" + k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } }
  };
  let cart = store.get("cart", []);          // [{id, size, qty}]
  let wish = store.get("wish", []);          // [id]
  let seen = store.get("seen", []);          // recently viewed ids
  let coupon = store.get("coupon", null);

  /* ---------- helpers ---------- */
  const money = n => S.currency + Math.round(n).toLocaleString("en-IN");
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const byId = id => P.find(p => p.id === Number(id));
  const cat = slug => C.find(c => c.slug === slug) || { name: slug, bn: "" };
  const priceOf = p => p.salePrice || p.price;
  const offOf = p => p.salePrice ? Math.round((1 - p.salePrice / p.price) * 100) : 0;
  const telHref = "tel:" + S.phone.replace(/[^\d+]/g, "");
  const waHref = text => "https://wa.me/" + S.whatsapp + (text ? "?text=" + encodeURIComponent(text) : "");
  const ICON = {
    heart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
    eye: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
    arrow: '<svg class="arrow" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    check: '<svg viewBox="0 0 24 24" width="40" height="40" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };

  let toastT;
  function toast(msg, action) {
    const t = $("#toast");
    t.innerHTML = `<span>${esc(msg)}</span>` + (action ? `<button type="button">${esc(action.label)}</button>` : "");
    if (action) t.querySelector("button").onclick = () => { t.classList.remove("show"); action.run(); };
    t.classList.add("show");
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 2600);
  }

  /* ---------- product art (placeholder until real photos are added) ---------- */
  let uid = 0;
  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    const f = v => amt > 0 ? Math.round(v + (255 - v) * amt) : Math.round(v * (1 + amt));
    return "#" + [n >> 16, (n >> 8) & 255, n & 255].map(v => f(v).toString(16).padStart(2, "0")).join("");
  }
  function patternDef(id, kind, c, scale = 1) {
    const l = shade(c, .55), d = shade(c, -.28), w = shade(c, .82);
    const s = 22 * scale;
    const tiles = {
      floral: `<circle cx="11" cy="11" r="2" fill="${w}"/>${[0, 72, 144, 216, 288].map(a => `<ellipse cx="11" cy="6.6" rx="1.9" ry="3" fill="${l}" transform="rotate(${a} 11 11)"/>`).join("")}<circle cx="11" cy="11" r="1.4" fill="${d}"/><circle cx="0" cy="0" r="1.2" fill="${l}"/><circle cx="22" cy="22" r="1.2" fill="${l}"/><circle cx="0" cy="22" r="1.2" fill="${l}"/><circle cx="22" cy="0" r="1.2" fill="${l}"/>`,
      paisley: `<path d="M8 15c-4-1-4-8 1-9 4-1 7 3 5 7-1 2-3 3-6 2z" fill="none" stroke="${l}" stroke-width="1.3"/><circle cx="10" cy="10.5" r="1.5" fill="${w}"/><path d="M14 6c2-2 4-2 5-4" stroke="${l}" stroke-width="1.1" fill="none"/>`,
      dots: `<circle cx="5.5" cy="5.5" r="1.8" fill="${l}"/><circle cx="16.5" cy="16.5" r="1.8" fill="${l}"/>`,
      stripe: `<path d="M-4 4 4-4M0 22 22 0M18 26 26 18" stroke="${l}" stroke-width="3"/>`,
      check: `<path d="M0 6h22M0 16h22M6 0v22M16 0v22" stroke="${l}" stroke-width="1.6" opacity=".8"/><path d="M0 11h22M11 0v22" stroke="${d}" stroke-width="2.4" opacity=".5"/>`,
      lattice: `<path d="M11 0 22 11 11 22 0 11z" fill="none" stroke="${l}" stroke-width="1.2"/><circle cx="11" cy="11" r="2.2" fill="${w}"/><circle cx="0" cy="0" r="1.4" fill="${l}"/><circle cx="22" cy="0" r="1.4" fill="${l}"/><circle cx="0" cy="22" r="1.4" fill="${l}"/><circle cx="22" cy="22" r="1.4" fill="${l}"/>`,
      leaf: `<ellipse cx="7" cy="8" rx="2" ry="4.5" fill="${l}" transform="rotate(35 7 8)"/><ellipse cx="16" cy="16" rx="2" ry="4.5" fill="${l}" transform="rotate(-35 16 16)"/><path d="M7 8l3 4M16 16l-3-4" stroke="${d}" stroke-width=".8"/>`,
      plain: `<path d="M0 11h22" stroke="${l}" stroke-width=".5" opacity=".35"/>`
    };
    return `<pattern id="${id}" width="${s}" height="${s}" patternUnits="userSpaceOnUse" viewBox="0 0 22 22"><rect width="22" height="22" fill="${c}"/>${tiles[kind] || tiles.plain}</pattern>`;
  }
  const SHAPES = {
    dress: { body: "M150 76q30 18 60 0l38 24-16 50-18-6v34l46 168H100l46-168v-34l-18 6-16-50z", neck: "M150 76q30 18 60 0l-5 14q-25 14-50 0z", extra: c => `<path d="M104 340h152" stroke="${shade(c, .7)}" stroke-width="7"/><path d="M146 178h68" stroke="${shade(c, .7)}" stroke-width="4" stroke-dasharray="1 7" stroke-linecap="round"/><path d="M96 104q-62 130 12 248M264 104q62 130-12 248" fill="none" stroke="${shade(c, .6)}" stroke-width="12" opacity=".55" stroke-linecap="round"/>` },
    kurti: { body: "M146 74q34 20 68 0l50 28-20 64-22-8v188H138V158l-22 8-20-64z", neck: "M146 74q34 20 68 0l-6 14q-28 14-56 0z", extra: c => `<path d="M180 88v70" stroke="${shade(c, -.3)}" stroke-width="2.5"/><circle cx="180" cy="108" r="3.2" fill="${shade(c, .8)}"/><circle cx="180" cy="128" r="3.2" fill="${shade(c, .8)}"/><path d="M138 320h84" stroke="${shade(c, .7)}" stroke-width="5" stroke-dasharray="2 8" stroke-linecap="round"/>` },
    abaya: { body: "M180 56c-28 0-42 22-42 46l-36 30-28 214h204l-28-214-36-30c0-24-14-46-42-46z", neck: "M140 102q40 32 80 0", extra: c => `<path d="M180 128v218" stroke="${shade(c, .5)}" stroke-width="2" opacity=".5"/><path d="M80 330h200" stroke="${shade(c, .4)}" stroke-width="5" opacity=".6"/><path d="M110 150l-20 170M250 150l20 170" stroke="${shade(c, .4)}" stroke-width="2" opacity=".35"/>` },
    hijab: { body: "M180 62c-62 0-88 62-80 114 6 42-32 94-42 164h244c-10-70-48-122-42-164 8-52-18-114-80-114z", neck: "", extra: c => `<ellipse cx="180" cy="146" rx="40" ry="50" fill="${shade(c, .75)}" opacity=".7"/><path d="M110 240q70 44 140 0M96 290q84 40 168 0" fill="none" stroke="${shade(c, -.25)}" stroke-width="3" opacity=".45"/>` },
    saree: { body: "M150 70q30 16 60 0l22 32-16 32v40l48 172H96l48-172v-40l-16-32z", neck: "", extra: c => `<path d="M210 70l44 44-92 232h-34z" fill="${shade(c, -.25)}" opacity=".85"/><path d="M98 340h164" stroke="#e7c27a" stroke-width="10"/><path d="M252 114l-92 232" stroke="#e7c27a" stroke-width="5"/>` },
    kids: { body: "M160 110q20 12 40 0l28 20-12 34-14-4v22l50 116H108l50-116v-22l-14 4-12-34z", neck: "M160 110q20 12 40 0l-4 9q-16 9-32 0z", extra: c => `<path d="M110 290h140" stroke="${shade(c, .75)}" stroke-width="7" stroke-dasharray="7 6"/><circle cx="180" cy="160" r="6" fill="${shade(c, .8)}"/>` }
  };
  /* view: "main" garment on a hanger | "fabric" close-up | "detail" folded. opts.bg=false -> transparent (hero rail). */
  function art(p, view = "main", cls = "", opts = {}) {
    if (p.image && view === "main") return `<img class="art ${cls}" src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy">`;
    const id = "lw" + (++uid), c = p.color;
    const pat = patternDef(id + "p", p.pattern, c, view === "fabric" ? 3.2 : 1);
    if (view === "fabric" || view === "detail") {
      const folds = view === "fabric"
        ? `<rect width="360" height="450" fill="url(#${id}p)"/><path d="M0 120q180-60 360 20v80q-180-60-360 10z" fill="#000" opacity=".1"/><path d="M0 300q180-50 360 30v40q-180-60-360 0z" fill="#fff" opacity=".1"/>`
        : `<rect width="360" height="450" fill="${shade(c, .9)}"/><g transform="rotate(-8 180 225)"><rect x="70" y="120" width="230" height="70" rx="6" fill="url(#${id}p)"/><rect x="60" y="196" width="240" height="70" rx="6" fill="url(#${id}p)"/><rect x="50" y="272" width="250" height="70" rx="6" fill="url(#${id}p)"/><path d="M70 186h230M60 262h240M50 338h250" stroke="#000" stroke-width="6" opacity=".08"/></g>`;
      return `<svg class="art ${cls}" viewBox="0 0 360 450" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${esc(p.name)}, ${view === "fabric" ? "fabric close-up" : "folded"}"><defs>${pat}</defs>${folds}
        <g transform="translate(252 388)"><rect width="86" height="30" fill="#fffefc"/><path d="M6 6h74M6 24h74" stroke="#e8192c" stroke-width="1.2" stroke-dasharray="4 3"/><text x="43" y="19" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-weight="600" font-size="9" letter-spacing="1" fill="#25161a">${esc(p.sku)}</text></g></svg>`;
    }
    const sh = SHAPES[p.shape] || SHAPES.dress;
    const bg = opts.bg === false ? "" : `<rect width="360" height="450" fill="${shade(c, .93)}"/>`;
    return `<svg class="art ${cls}" viewBox="0 0 360 450" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${esc(p.name)}">
      <defs>${pat}
        <linearGradient id="${id}s" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".2"/><stop offset=".35" stop-color="#fff" stop-opacity=".12"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></linearGradient>
      </defs>
      ${bg}
      <path d="M180 64V36" stroke="#8d7d80" stroke-width="3"/><path d="M180 36c0-8 9-10 9-17a9 9 0 0 0-18 0" fill="none" stroke="#8d7d80" stroke-width="3.2" stroke-linecap="round"/>
      <g transform="translate(0 -14)">
        <path d="${sh.body}" fill="url(#${id}p)"/>
        <path d="${sh.body}" fill="url(#${id}s)"/>
        ${sh.neck ? `<path d="${sh.neck}" fill="${shade(c, -.3)}" opacity=".9"/>` : ""}
        ${sh.extra(c)}
      </g>
      <path d="M134 78q46-30 92 0" fill="none" stroke="#6f5f62" stroke-width="5" stroke-linecap="round"/>
    </svg>`;
  }

  const tapeNums = n => Array.from({ length: n }, (_, i) => `<span>${i + 1}</span>`).join("");
  const CHEST = { S: 34, M: 36, L: 38, XL: 40, XXL: 42 };
  function measureHTML(p, size) {
    const inch = CHEST[size] || (/^\d+$/.test(size) ? Number(size) : null);
    if (!inch) return `<div class="measure-note">${esc(size)} · message us for exact measurements</div>`;
    const isLen = !CHEST[size];
    const lo = isLen ? 40 : 28, hi = isLen ? 64 : 48, pct = (inch - lo) / (hi - lo) * 100;
    return `<div class="measure" id="measure"><div class="tape"><div class="tape-track" style="width:100%">${Array.from({ length: (hi - lo) / 2 }, (_, i) => `<span style="flex:1 0 0">${lo + i * 2}</span>`).join("")}</div><span class="marker" style="left:${pct}%"></span></div>
      <div class="measure-note">${esc(size)} = ${inch}" ${isLen ? "length" : "chest"}</div></div>`;
  }

  /* ---------- cart ---------- */
  function bump(el) { if (!el) return; el.classList.remove("bump"); void el.offsetWidth; el.classList.add("bump"); }
  function saveCart() { store.set("cart", cart); renderCartUI(); }
  function addToCart(id, size, qty = 1, open = true) {
    const p = byId(id); if (!p || p.stock <= 0) return toast("Sorry, this item is out of stock");
    size = size || p.sizes[0];
    const line = cart.find(l => l.id === p.id && l.size === size);
    const allowed = Math.min(qty, p.stock - (line ? line.qty : 0));
    if (allowed <= 0) return toast(`Only ${p.stock} in stock`);
    if (line) line.qty += allowed; else cart.push({ id: p.id, size, qty: allowed });
    saveCart(); bump($("#cartCount")); bump($("#tabCartCount"));
    if (open) openCart(); else toast(`Added · ${p.name} (${size})`, { label: "View bag", run: openCart });
  }
  function setQty(i, q) {
    const l = cart[i]; if (!l) return;
    l.qty = Math.max(1, Math.min(q, byId(l.id).stock));
    saveCart(); if (route().name === "checkout") render();
  }
  function removeLine(i) {
    const [gone] = cart.splice(i, 1); saveCart();
    if (route().name === "checkout") render();
    toast("Removed from bag", { label: "Undo", run: () => { cart.splice(i, 0, gone); saveCart(); if (route().name === "checkout") render(); } });
  }
  function couponDiscount(sub) {
    const c = coupon && S.coupons[coupon];
    if (!c || (c.min && sub < c.min)) return 0;
    return c.type === "percent" ? Math.round(sub * c.amount / 100) : Math.min(c.amount, sub);
  }
  function totals(shipId) {
    const sub = cart.reduce((s, l) => s + priceOf(byId(l.id)) * l.qty, 0);
    const disc = couponDiscount(sub);
    const zone = S.shipping.find(z => z.id === shipId) || S.shipping[0];
    const ship = !cart.length ? 0 : (sub - disc >= S.freeShippingOver ? 0 : zone.cost);
    return { sub, disc, ship, total: sub - disc + ship, zone };
  }
  const cartCount = () => cart.reduce((s, l) => s + l.qty, 0);

  function lineHTML(l, i, editable) {
    const p = byId(l.id);
    return `<div class="line">
      <a class="thumb" href="#/product/${p.id}">${art(p)}</a>
      <div>
        <div class="line-title">${esc(p.name)}</div>
        <div class="line-meta">Size ${esc(l.size)} · ${money(l.price || priceOf(p))}</div>
        ${editable ? `<div class="line-ctrl"><div class="qty sm" data-i="${i}"><button type="button" data-q="-1" aria-label="Decrease">−</button><input value="${l.qty}" inputmode="numeric" aria-label="Quantity"><button type="button" data-q="1" aria-label="Increase">+</button></div><button type="button" class="remove" data-rm="${i}">Remove</button></div>` : `<div class="line-meta">Qty ${l.qty}</div>`}
      </div>
      <b>${money((l.price || priceOf(p)) * l.qty)}</b>
    </div>`;
  }
  function shipMeter(sub) {
    const left = S.freeShippingOver - sub, pct = Math.min(100, sub / S.freeShippingOver * 100);
    return `<div class="ship-meter">${left > 0 ? `${money(left)} more for free delivery` : "Free delivery unlocked"}<div class="tape"><div class="tape-track">${tapeNums(20)}</div><span class="fill" style="width:${pct}%"></span></div></div>`;
  }
  function renderCartUI() {
    const n = cartCount();
    $("#cartCount").textContent = n || ""; $("#tabCartCount").textContent = n || "";
    $("#wishCount").textContent = wish.length || "";
    $("#drawerCount").textContent = n ? `(${n})` : "";
    const body = $("#cartItems"), foot = $("#cartFoot");
    if (!cart.length) {
      body.innerHTML = `<div class="empty"><span class="bn">ব্যাগ খালি</span><h3>Your bag is empty</h3><p>Nothing on the counter yet.</p><a class="btn" href="#/shop">Browse the rail ${ICON.arrow}</a></div>`;
      foot.innerHTML = ""; return;
    }
    const t = totals();
    body.innerHTML = shipMeter(t.sub - t.disc) + cart.map((l, i) => lineHTML(l, i, true)).join("");
    foot.innerHTML = `
      <div class="row"><span>Subtotal</span><b>${money(t.sub)}</b></div>
      ${t.disc ? `<div class="row"><span>Discount (${esc(coupon)})</span><b>−${money(t.disc)}</b></div>` : ""}
      <p class="muted small" style="margin:4px 0 14px">Delivery is calculated at checkout.</p>
      <a class="btn block" href="#/checkout">Checkout · ${money(t.sub - t.disc)} ${ICON.arrow}</a>
      <a class="btn ghost block" style="margin-top:8px" target="_blank" rel="noopener" href="${waHref(orderText())}">Order on WhatsApp instead</a>`;
  }
  function orderText(order) {
    const lines = (order ? order.items : cart).map(l => {
      const p = byId(l.id); return `• ${p.name} (${p.sku}) — Size ${l.size} × ${l.qty} = ${money(priceOf(p) * l.qty)}`;
    });
    let s = `Assalamu Alaikum, I want to order from ${S.name}:\n` + lines.join("\n");
    if (order) s += `\n\nOrder #${order.id}\nTotal: ${money(order.total)}\nName: ${order.customer.name}\nPhone: ${order.customer.phone}\nAddress: ${order.customer.address}, ${order.customer.area}, ${order.customer.district}\nPayment: ${order.paymentLabel}`;
    return s;
  }
  function openCart() { closeQuick(); $("#cartDrawer").classList.add("open"); $("#cartDrawer").setAttribute("aria-hidden", "false"); $("#overlay").classList.add("show"); }
  function closeAll() {
    $("#cartDrawer").classList.remove("open"); $("#cartDrawer").setAttribute("aria-hidden", "true");
    $("#overlay").classList.remove("show"); $("#nav").classList.remove("open"); closeQuick();
  }

  /* ---------- wishlist & recently viewed ---------- */
  function toggleWish(id) {
    id = Number(id);
    wish = wish.includes(id) ? wish.filter(x => x !== id) : [...wish, id];
    store.set("wish", wish); renderCartUI();
    const on = wish.includes(id);
    $$(`.wish[data-wish="${id}"]`).forEach(b => { b.classList.toggle("on", on); b.classList.remove("pop"); void b.offsetWidth; b.classList.add("pop"); });
    toast(on ? "Saved to your wishlist" : "Removed from wishlist");
    if (route().name === "wishlist") render();
  }
  function markSeen(id) { seen = [Number(id), ...seen.filter(x => x !== Number(id))].slice(0, 8); store.set("seen", seen); }

  /* ---------- quick view ---------- */
  function openQuick(id) {
    const p = byId(id); if (!p) return;
    const out = p.stock <= 0;
    $("#quickViewBody").innerHTML = `
      <button class="icon-btn modal-close" data-close aria-label="Close">✕</button>
      <div class="shot">${art(p)}</div>
      <div class="mbody">
        <span class="kicker">${esc(p.sku)} · ${esc(cat(p.category).name)}</span>
        <h2 class="display">${esc(p.name)}</h2>
        ${priceHTML(p)}
        <p class="muted">${esc(p.description)}</p>
        <div class="opt-label">Size</div>
        <div class="sizes" id="qvSizes">${p.sizes.map((s, i) => `<button type="button" class="size ${i === 0 ? "active" : ""}" data-size="${esc(s)}">${esc(s)}</button>`).join("")}</div>
        <div class="buy-row">
          <button type="button" class="btn" id="qvAdd" ${out ? "disabled" : ""}>${out ? "Sold out" : "Add to bag"}</button>
          <a class="btn ghost" href="#/product/${p.id}">Full details</a>
        </div>
      </div>`;
    const m = $("#quickView"); m.hidden = false;
    $("#qvSizes").onclick = e => { const b = e.target.closest(".size"); if (b) $$("#qvSizes .size").forEach(x => x.classList.toggle("active", x === b)); };
    $("#qvAdd").onclick = () => { addToCart(p.id, $("#qvSizes .active").dataset.size, 1, false); closeQuick(); };
    m.querySelector("[data-close]").focus();
  }
  function closeQuick() { const m = $("#quickView"); if (m) m.hidden = true; }

  /* ---------- components ---------- */
  function priceHTML(p) {
    return `<div class="price">${p.salePrice ? `<span class="now">${money(p.salePrice)}</span><del>${money(p.price)}</del>` : `<span>${money(p.price)}</span>`}</div>`;
  }
  function card(p) {
    const on = wish.includes(p.id), out = p.stock <= 0, off = offOf(p);
    return `<article class="card">
      <div class="media-wrap">
        <a class="card-media" href="#/product/${p.id}" aria-label="${esc(p.name)}">
          ${art(p, "main", "main")}${p.image ? "" : art(p, "fabric", "alt")}
        </a>
        <span class="flags">${out ? `<span class="flag">Sold out</span>` : ""}${!out && off ? `<span class="flag sale">−${off}%</span>` : ""}${p.isNew && !out ? `<span class="flag new">New</span>` : ""}${!out && p.stock <= 5 ? `<span class="flag">${p.stock} left</span>` : ""}</span>
        <button type="button" class="wish ${on ? "on" : ""}" data-wish="${p.id}" aria-label="Save ${esc(p.name)}">${ICON.heart}</button>
        ${out ? "" : `<div class="quick"><small>Add in size</small><div class="quick-sizes">${p.sizes.slice(0, 5).map(s => `<button type="button" data-qadd="${p.id}" data-size="${esc(s)}">${esc(s)}</button>`).join("")}</div></div>`}
      </div>
      <div class="tagline">
        <div class="ptag">
          <span class="sku"><span>${esc(p.sku)}</span><span class="bn">${esc(cat(p.category).bn)}</span></span>
          <a class="card-title" href="#/product/${p.id}">${esc(p.name)}</a>
          ${priceHTML(p)}
        </div>
        <button type="button" class="peek" data-quick="${p.id}" aria-label="Quick view">${ICON.eye}</button>
      </div>
    </article>`;
  }
  const grid = list => `<div class="grid">${list.map(card).join("")}</div>`;

  /* ---------- views ---------- */
  const RAIL = [104, 301, 102, 103, 401];
  const CARE_ICONS = {
    cod: '<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="4" y="9" width="24" height="14" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="16" cy="16" r="3.5" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    check: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M5 12 16 6l11 6v12l-11 5-11-5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="m11 17 4 4 7-8" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    swap: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M6 12h18l-5-5M26 20H8l5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    van: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M3 9h16v13H3zM19 13h6l4 4v5H19z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="9" cy="24" r="2.5" fill="currentColor"/><circle cx="24" cy="24" r="2.5" fill="currentColor"/></svg>',
    chat: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M5 26l2-5a11 11 0 1 1 4 3z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>'
  };
  function careLabel(title) {
    return `<div class="care">
      <h3><span>${title}</span><span>LW</span></h3>
      <ul>
        <li>${CARE_ICONS.cod}<div>Cash on delivery<small>Pay when the parcel reaches you. bKash and Nagad work too.</small></div></li>
        <li>${CARE_ICONS.check}<div>Check before you pay<small>Open the parcel in front of the delivery person.</small></div></li>
        <li>${CARE_ICONS.swap}<div>3-day size exchange<small>Unused items with tags.</small></div></li>
        <li>${CARE_ICONS.van}<div>${money(S.shipping[0].cost)} Dhaka · ${money(S.shipping[1].cost)} outside<small>Free over ${money(S.freeShippingOver)}. 1–4 working days.</small></div></li>
        <li>${CARE_ICONS.chat}<div>A real person replies<small>WhatsApp ${esc(S.phone)}</small></div></li>
      </ul>
      <div class="made">Made with care · Bashundhara, Dhaka</div>
    </div>`;
  }
  const secHead = (bn, en, right = "") => `<div class="sec-head"><div class="sec-title"><span class="bn">${bn}</span><h2 class="display">${en}</h2></div><span class="rule"></span>${right}</div>`;

  function home() {
    const tabs = {
      best: P.filter(p => p.featured).slice(0, 8),
      new: P.filter(p => p.isNew).slice(0, 8),
      sale: P.filter(p => p.salePrice).slice(0, 8)
    };
    const recent = seen.map(byId).filter(Boolean).slice(0, 4);
    return `
      <section class="hero">
        <div class="wrap">
          <div class="hero-top">
            <div>
              <p class="bn-title">লিবাস ওয়াফিয়া</p>
              <h1 class="display">Clothes that keep <em>their promise.</em></h1>
            </div>
            <div class="hero-side">
              <p class="meaning"><b>Libas</b> (লিবাস): clothing.<br><b>Wafia</b> (ওয়াফিয়া): faithful.<br>Three piece, abaya, kurti and hijab, chosen by hand in Bashundhara and delivered across Bangladesh.</p>
              <div class="hero-cta">
                <a class="btn light" href="#/shop">Browse the rail ${ICON.arrow}</a>
                <a class="btn ghost-light" href="#/shop?cat=abaya">Abaya & borka</a>
              </div>
            </div>
          </div>
          <div class="rail-wrap">
            <span class="rail-bar"></span>
            <div class="rail">
              ${RAIL.map(byId).filter(Boolean).map(p => `<a class="hang" href="#/product/${p.id}" aria-label="${esc(p.name)}, ${money(priceOf(p))}">${art(p, "main", "", { bg: false })}<span class="htag"><b>${esc(p.name)}</b><span class="p">${money(priceOf(p))}</span></span></a>`).join("")}
            </div>
          </div>
        </div>
      </section>

      <section class="section wrap">
        ${secHead("কাপড় বেছে নিন", "Pick a fabric", `<a class="link" href="#/shop">All ${P.length} styles</a>`)}
        <div class="swatches">${C.map(c => {
          const sample = P.find(p => p.category === c.slug && p.featured) || P.find(p => p.category === c.slug);
          const n = P.filter(p => p.category === c.slug).length;
          return `<a class="swatch" href="#/shop?cat=${c.slug}"><div class="cloth">${art(sample, "fabric")}</div><div class="lbl"><b>${esc(c.name)}</b><span class="bn">${c.bn}</span></div><span class="n">${n} style${n === 1 ? "" : "s"}</span></a>`;
        }).join("")}</div>
      </section>

      <section class="section wrap">
        ${secHead("এই সপ্তাহে", "On the rail this week", `<div class="tabs" role="tablist" id="homeTabs">
            <button type="button" role="tab" class="on" data-tab="best">Bestsellers</button>
            <button type="button" role="tab" data-tab="new">New in</button>
            <button type="button" role="tab" data-tab="sale">On sale</button>
          </div>`)}
        ${Object.entries(tabs).map(([k, list]) => `<div data-panel="${k}" ${k === "best" ? "" : "hidden"}>${grid(list)}</div>`).join("")}
      </section>

      <section class="offer">
        <div class="wrap offer-inner">
          <div>
            <span class="bn">প্রথম অর্ডারে ছাড়</span>
            <h2 class="display">Ten percent off your first order.</h2>
            <p>New to Libas Wafia? Sew this patch onto your first order: add the code at checkout and 10% comes off.</p>
            <div class="hero-cta" style="margin-top:22px"><a class="btn light" href="#/shop">Start shopping ${ICON.arrow}</a></div>
          </div>
          <div class="patch">
            <small>First order</small>
            <span class="pct">10%</span>
            <code>WAFIA10</code>
            <button type="button" data-copy="WAFIA10">Copy code</button>
          </div>
        </div>
      </section>

      <section class="section wrap">
        ${secHead("কীভাবে অর্ডার করবেন", "How ordering works")}
        <div class="counter">
          <div class="slip">
            <div class="slip-head"><span class="bn">অর্ডার স্লিপ</span><span>No. LW-____</span></div>
            <ol>
              <li><div><b>Pick your style and size</b><span>Not sure about the size? Ask us on WhatsApp and we'll measure it for you.</span></div></li>
              <li><div><b>Place the order</b><span>Check out here in a minute, or send the order on WhatsApp. We call to confirm.</span></div></li>
              <li><div><b>Check it, then pay</b><span>Open the parcel in front of the delivery person and pay cash, or pay first with bKash or Nagad.</span></div></li>
            </ol>
            <div class="slip-foot"><span>Inside Dhaka 1–2 days</span><span>Outside Dhaka 2–4 days</span></div>
          </div>
          ${careLabel("Our promise")}
        </div>
      </section>

      ${recent.length ? `<section class="section wrap">${secHead("আবার দেখুন", "You looked at these")}${grid(recent)}</section>` : ""}

      <section class="follow wrap">
        <div class="follow-inner">
          <div><span class="bn">নতুন কালেকশন সবার আগে</span><p>New pieces go up on our Facebook page first.</p></div>
          <a class="btn dark" href="${S.facebook}" target="_blank" rel="noopener">Follow on Facebook ${ICON.arrow}</a>
        </div>
      </section>`;
  }

  function shop(q) {
    const c = q.get("cat") || "", term = (q.get("q") || "").trim().toLowerCase(), sort = q.get("sort") || "default";
    const min = Number(q.get("min")) || 0, max = Number(q.get("max")) || Infinity, instock = q.get("instock") === "1";
    let list = P.filter(p =>
      (!c || p.category === c) &&
      (!term || (p.name + " " + p.description + " " + cat(p.category).name).toLowerCase().includes(term)) &&
      priceOf(p) >= min && priceOf(p) <= max && (!instock || p.stock > 0));
    const sorters = {
      "price-asc": (a, b) => priceOf(a) - priceOf(b),
      "price-desc": (a, b) => priceOf(b) - priceOf(a),
      "new": (a, b) => (b.isNew - a.isNew) || b.id - a.id,
      "sale": (a, b) => offOf(b) - offOf(a)
    };
    if (sorters[sort]) list = [...list].sort(sorters[sort]);
    const link = changes => { const n = new URLSearchParams(q); Object.entries(changes).forEach(([k, v]) => v === "" || v == null ? n.delete(k) : n.set(k, v)); const s = n.toString(); return "#/shop" + (s ? "?" + s : ""); };
    const title = term ? `“${esc(term)}”` : c ? esc(cat(c).name) : "Shop all";
    const filtered = min || isFinite(max) || instock;
    return `
      <section class="page-head"><div class="wrap">
        <div class="crumbs"><a href="#/">Home</a> / Shop${c ? " / " + esc(cat(c).name) : ""}</div>
        <span class="bn">${term ? "খুঁজুন" : c ? esc(cat(c).bn) : "সব পণ্য"}</span>
        <h1 class="display">${title}</h1>
        <div class="chips">
          <a class="chip ${!c ? "on" : ""}" href="${link({ cat: "" })}">All<span>${P.length}</span></a>
          ${C.map(x => `<a class="chip ${c === x.slug ? "on" : ""}" href="${link({ cat: x.slug })}">${esc(x.name)}<span>${P.filter(p => p.category === x.slug).length}</span></a>`).join("")}
        </div>
      </div></section>
      <div class="wrap">
        <div class="toolbar">
          <span class="muted"><b style="color:var(--ink)">${list.length}</b> style${list.length === 1 ? "" : "s"}${filtered ? ` · <a class="link" href="${link({ min: "", max: "", instock: "" })}">Clear filters</a>` : ""}</span>
          <div class="toolbar-r">
            <details class="filter-pop">
              <summary class="btn ghost sm">Filter${filtered ? " •" : ""}</summary>
              <form class="filter-body" id="priceForm">
                <div class="opt-label" style="margin-top:0">Price (${S.currency})</div>
                <div class="range"><input name="min" type="number" min="0" placeholder="Min" value="${min || ""}" aria-label="Minimum price"><input name="max" type="number" min="0" placeholder="Max" value="${isFinite(max) ? max : ""}" aria-label="Maximum price"></div>
                <label style="display:flex;gap:8px;margin-top:14px;font-size:14px;font-weight:600"><input type="checkbox" name="instock" ${instock ? "checked" : ""}> In stock only</label>
                <button class="btn block sm" style="margin-top:14px">Apply</button>
              </form>
            </details>
            <select id="sortSel" aria-label="Sort products">
              ${[["default", "Featured"], ["new", "Newest"], ["sale", "Biggest discount"], ["price-asc", "Price: low to high"], ["price-desc", "Price: high to low"]]
                .map(([v, l]) => `<option value="${v}" ${sort === v ? "selected" : ""}>${l}</option>`).join("")}
            </select>
          </div>
        </div>
        ${list.length ? grid(list) : `<div class="empty"><span class="bn">কিছু পাওয়া যায়নি</span><h3>Nothing on this rail</h3><p>Try another category or clear your filters.</p><a class="btn" href="#/shop">See all products</a></div>`}
      </div>`;
  }

  function product(id) {
    const p = byId(id);
    if (!p) return notFound();
    markSeen(p.id);
    const out = p.stock <= 0;
    const st = out ? ["no", "Out of stock — ask us about restock"] : p.stock <= 5 ? ["low", `Only ${p.stock} left — order soon`] : ["ok", "In stock, ready to ship"];
    const related = P.filter(x => x.category === p.category && x.id !== p.id);
    const more = (related.length >= 4 ? related : [...related, ...P.filter(x => x.featured && x.id !== p.id && !related.includes(x))]).slice(0, 4);
    const views = p.image ? ["main"] : ["main", "fabric", "detail"];
    return `
      <div class="wrap">
        <div class="crumbs" style="padding-top:22px"><a href="#/">Home</a> / <a href="#/shop?cat=${p.category}">${esc(cat(p.category).name)}</a> / ${esc(p.name)}</div>
        <div class="pdp">
          <div class="gallery">
            <div class="thumbs" id="thumbs">${views.map((v, i) => `<button type="button" class="${i === 0 ? "on" : ""}" data-view="${v}" aria-label="View ${i + 1}">${art(p, v)}</button>`).join("")}</div>
            <div class="main-shot" id="mainShot">${art(p)}</div>
          </div>
          <div class="pdp-info">
            <span class="bn-cat">${esc(cat(p.category).bn)}</span>
            <span class="kicker" style="margin-left:10px">${esc(p.sku)}</span>
            <h1 class="display">${esc(p.name)}</h1>
            <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">${priceHTML(p)}${p.salePrice ? `<span class="save">You save ${money(p.price - p.salePrice)}</span>` : ""}</div>
            <div class="stock ${st[0]}">${st[1]}</div>
            <p class="pdp-desc">${esc(p.description)}</p>
            <div class="opt-label"><span>Size</span><button type="button" id="sizeGuideBtn">Size guide</button></div>
            <div class="sizes" id="sizes">${p.sizes.map((s, i) => `<button type="button" class="size ${i === 0 ? "active" : ""}" data-size="${esc(s)}">${esc(s)}</button>`).join("")}</div>
            ${measureHTML(p, p.sizes[0])}
            <div class="buy-row" id="buyRow">
              <div class="qty" id="pdpQty"><button type="button" data-q="-1" aria-label="Decrease">−</button><input value="1" inputmode="numeric" aria-label="Quantity"><button type="button" data-q="1" aria-label="Increase">+</button></div>
              <button type="button" class="btn" id="pdpAdd" ${out ? "disabled" : ""}>Add to bag</button>
              <button type="button" class="wish ${wish.includes(p.id) ? "on" : ""}" style="position:static;width:50px;height:50px;box-shadow:inset 0 0 0 1.5px var(--line)" data-wish="${p.id}" aria-label="Save to wishlist">${ICON.heart}</button>
            </div>
            <div class="buy-row" style="margin-top:10px">
              <button type="button" class="btn dark" id="pdpBuy" ${out ? "disabled" : ""}>Buy it now</button>
              <a class="btn wa" target="_blank" rel="noopener" href="${waHref(`Hi ${S.name}, I'm interested in "${p.name}" (${p.sku}) — ${money(priceOf(p))}. Is it available?`)}">Ask on WhatsApp</a>
            </div>
            ${careLabel("Before you buy")}
            <div class="acc">
              <details id="sizeGuide"><summary>Size guide</summary><p>S 34" · M 36" · L 38" · XL 40" · XXL 42" (chest). Abaya sizes are length in inches. Message us for custom measurements.</p></details>
              <details><summary>Delivery</summary><p>Inside Dhaka 1–2 working days, outside Dhaka 2–4 working days. ${S.shipping.map(z => `${z.label}: ${money(z.cost)}`).join(" · ")}.</p></details>
              <details><summary>Payment</summary><p>${S.payments.map(x => x.label).join(", ")}.</p></details>
            </div>
          </div>
        </div>
        <section class="section">${secHead("একই রকম আরও", "More from this rail")}${grid(more)}</section>
      </div>
      <div class="sticky-buy" id="stickyBuy"><div class="p">${money(priceOf(p))}<small>${esc(p.name)}</small></div><button type="button" class="btn" id="stickyAdd" ${out ? "disabled" : ""}>Add to bag</button></div>`;
  }

  function wishlist() {
    const list = wish.map(byId).filter(Boolean);
    return `<section class="page-head"><div class="wrap" style="padding-bottom:26px"><span class="bn">পছন্দের তালিকা</span><h1 class="display">Saved for later</h1></div></section>
      <div class="wrap" style="padding-top:40px">${list.length ? grid(list) :
        `<div class="empty"><h3>No saved styles yet</h3><p>Tap the heart on any product to keep it here.</p><a class="btn" href="#/shop">Browse the rail ${ICON.arrow}</a></div>`}</div>`;
  }

  const DISTRICTS = ["Dhaka", "Gazipur", "Narayanganj", "Chattogram", "Cox's Bazar", "Cumilla", "Feni", "Noakhali", "Sylhet", "Moulvibazar", "Rajshahi", "Bogura", "Pabna", "Khulna", "Jashore", "Kushtia", "Barishal", "Patuakhali", "Rangpur", "Dinajpur", "Mymensingh", "Tangail", "Jamalpur", "Faridpur", "Other"];

  function checkout() {
    if (!cart.length) return `<div class="wrap empty"><span class="bn">ব্যাগ খালি</span><h3>Your bag is empty</h3><p>Add something you love first.</p><a class="btn" href="#/shop">Go to shop ${ICON.arrow}</a></div>`;
    const draft = store.get("draft", {});
    const ship = draft.shipping || "inside_dhaka", pay = draft.payment || "cod";
    const t = totals(ship);
    const f = (name, label, attrs = "", full = false) => `<label class="field ${full ? "full" : ""}">${label}<input id="co-${name}" name="${name}" value="${esc(draft[name] || "")}" ${attrs}><span class="err"></span></label>`;
    return `
      <div class="wrap">
        <div class="crumbs" style="padding-top:22px"><a href="#/">Home</a> / Checkout</div>
        <form class="checkout" id="checkoutForm" novalidate>
          <div class="panel">
            <span class="bn" style="color:var(--red);font-size:28px;line-height:1.1">ডেলিভারির ঠিকানা</span>
            <h2>Checkout</h2>
            <h3><i>1</i>Delivery details</h3>
            <div class="fields">
              ${f("name", "Full name", 'autocomplete="name" required')}
              ${f("phone", "Mobile number", 'type="tel" inputmode="tel" autocomplete="tel" placeholder="01XXXXXXXXX" required')}
              <label class="field">District<select id="co-district" name="district" required>${DISTRICTS.map(d => `<option ${draft.district === d ? "selected" : ""}>${d}</option>`).join("")}</select><span class="err"></span></label>
              ${f("area", "Area / Thana", 'placeholder="e.g. Bashundhara R/A" required')}
              ${f("address", "Full address", 'placeholder="House, road, block" autocomplete="street-address" required', true)}
              ${f("email", "Email (optional)", 'type="email" autocomplete="email"')}
              <label class="field">Order note (optional)<input id="co-note" name="note" value="${esc(draft.note || "")}" placeholder="Colour, delivery time…"></label>
            </div>
            <h3><i>2</i>Delivery area</h3>
            <div class="choices two">${S.shipping.map(z => `<label class="choice"><input type="radio" name="shipping" value="${z.id}" ${ship === z.id ? "checked" : ""}><span><b>${z.label}</b><small>${money(z.cost)} · ${z.id === "inside_dhaka" ? "1–2 days" : "2–4 days"}</small></span></label>`).join("")}</div>
            <h3><i>3</i>Payment</h3>
            <div class="choices">${S.payments.map(m => `<label class="choice"><input type="radio" name="payment" value="${m.id}" ${pay === m.id ? "checked" : ""}><span><b>${m.label}</b><small>${esc(m.note)}</small></span></label>`).join("")}</div>
            <div id="trxWrap" class="fields" style="margin-top:12px" ${pay === "cod" ? "hidden" : ""}>${f("trx", "Transaction ID (TrxID)", 'placeholder="e.g. 9BX7K2L1QZ"', true)}</div>
          </div>
          <div class="panel tint">
            <h2>Order slip</h2>
            ${shipMeter(t.sub - t.disc)}
            ${cart.map((l, i) => lineHTML(l, i, true)).join("")}
            <div class="coupon"><input id="couponInput" placeholder="Coupon code" value="${esc(coupon || "")}" aria-label="Coupon code"><button type="button" class="btn sm" id="applyCoupon">Apply</button></div>
            <div class="row"><span>Subtotal</span><b>${money(t.sub)}</b></div>
            ${t.disc ? `<div class="row"><span>Discount (${esc(coupon)}) <button type="button" class="remove" id="rmCoupon">remove</button></span><b>−${money(t.disc)}</b></div>` : ""}
            <div class="row"><span>Delivery · ${t.zone.label}</span><b>${t.ship ? money(t.ship) : "Free"}</b></div>
            <div class="row total"><span>Total</span><span>${money(t.total)}</span></div>
            <button class="btn block" style="margin-top:18px" type="submit">Place order · ${money(t.total)}</button>
            <p class="muted small" style="text-align:center;margin-bottom:0">We'll call you to confirm before we ship.</p>
          </div>
        </form>
      </div>`;
  }

  function validate(form) {
    const d = Object.fromEntries(new FormData(form));
    const errs = {};
    if (!d.name || d.name.trim().length < 2) errs.name = "Please enter your name";
    const phone = (d.phone || "").replace(/[\s-]/g, "").replace(/^\+?88/, "");
    if (!/^01[3-9]\d{8}$/.test(phone)) errs.phone = "Enter an 11-digit Bangladeshi mobile number, e.g. 01712345678";
    if (d.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) errs.email = "Enter a valid email or leave it empty";
    if (!d.area || !d.area.trim()) errs.area = "Please enter your area";
    if (!d.address || d.address.trim().length < 5) errs.address = "Please enter your house, road and block";
    if (d.payment !== "cod" && !(d.trx || "").trim()) errs.trx = "Enter the transaction ID from your bKash / Nagad payment";
    $$(".field", form).forEach(el => {
      const input = el.querySelector("input,select,textarea"); if (!input) return;
      const e = errs[input.name];
      el.classList.toggle("invalid", !!e);
      const span = el.querySelector(".err"); if (span) span.textContent = e || "";
    });
    return { ok: !Object.keys(errs).length, d, phone };
  }
  function placeOrder(form) {
    const { ok, d, phone } = validate(form);
    if (!ok) { const first = form.querySelector(".invalid input, .invalid select"); if (first) first.focus(); return toast("Please check the highlighted fields"); }
    const t = totals(d.shipping);
    const order = {
      id: "LW" + Date.now().toString().slice(-7),
      date: new Date().toISOString(), status: "pending",
      items: cart.map(l => ({ ...l, price: priceOf(byId(l.id)) })),
      customer: { name: d.name.trim(), phone, email: d.email, district: d.district, area: d.area.trim(), address: d.address.trim(), note: d.note },
      shipping: t.zone.id, shippingCost: t.ship, subtotal: t.sub, discount: t.disc, coupon: t.disc ? coupon : null, total: t.total,
      payment: d.payment, paymentLabel: S.payments.find(m => m.id === d.payment).label, trx: d.trx || ""
    };
    const orders = store.get("orders", []); orders.unshift(order); store.set("orders", orders);
    cart = []; coupon = null; store.set("coupon", null); store.set("draft", {}); saveCart();
    go("#/order/" + order.id);
  }

  const STEPS = ["Placed", "Confirmed", "Shipped", "Delivered"];
  function orderView(id) {
    const o = store.get("orders", []).find(x => x.id === id);
    if (!o) return `<div class="page wrap"><h1 class="display">Order not found</h1><p>We couldn't find order <b>${esc(id)}</b> on this device. Contact us with your order number.</p><a class="btn" href="#/track">Track another order</a></div>`;
    const idx = { pending: 0, confirmed: 1, shipped: 2, delivered: 3 }[o.status] || 0;
    return `<div class="confirm wrap">
      <div class="confirm-head">
        <span class="bn">ধন্যবাদ!</span>
        <h1 class="display">Thank you, ${esc(o.customer.name.split(" ")[0])}.</h1>
        <p class="muted">Order <b style="color:var(--ink)">#${o.id}</b> is in. We'll call <b style="color:var(--ink)">${esc(o.customer.phone)}</b> to confirm.</p>
      </div>
      <div class="panel">
        <div class="row"><b>Order status</b><span class="status">${STEPS[idx]}</span></div>
        <div class="timeline">${STEPS.map((s, i) => `<div class="tstep ${i <= idx ? "done" : ""}"><i>${i + 1}</i>${s}</div>`).join("")}</div>
        ${o.items.map(l => lineHTML(l, 0, false)).join("")}
        <div class="row" style="margin-top:14px"><span>Subtotal</span><b>${money(o.subtotal)}</b></div>
        ${o.discount ? `<div class="row"><span>Discount (${esc(o.coupon)})</span><b>−${money(o.discount)}</b></div>` : ""}
        <div class="row"><span>Delivery</span><b>${o.shippingCost ? money(o.shippingCost) : "Free"}</b></div>
        <div class="row total"><span>Total</span><span>${money(o.total)}</span></div>
        <p class="muted small" style="margin-bottom:0">Payment: ${esc(o.paymentLabel)}${o.trx ? " · TrxID " + esc(o.trx) : ""}<br>Deliver to: ${esc(o.customer.address)}, ${esc(o.customer.area)}, ${esc(o.customer.district)}</p>
      </div>
      <div class="hero-cta" style="justify-content:center">
        <a class="btn wa" target="_blank" rel="noopener" href="${waHref(orderText(o))}">Send order on WhatsApp</a>
        <a class="btn ghost" href="#/shop">Keep shopping</a>
      </div>
    </div>`;
  }

  function track(q) {
    const id = (q.get("id") || "").trim().toUpperCase();
    const mine = store.get("orders", []);
    if (id && mine.find(x => x.id === id)) return orderView(id);
    return `<div class="page wrap">
      <span class="bn">অর্ডার ট্র্যাক</span>
      <h1 class="display">Track your order</h1>
      <p class="muted">Enter the order number from your confirmation, e.g. LW1234567.</p>
      <form id="trackForm" class="coupon"><input id="trackId" name="id" placeholder="Order number" value="${esc(id)}" required><button class="btn">Track</button></form>
      ${id ? `<p style="color:var(--danger)">No order <b>${esc(id)}</b> on this device. Call us on <b>${esc(S.phone)}</b>.</p>` : ""}
      ${mine.length ? `<h2>Your recent orders</h2><div class="orders" style="display:grid;gap:8px">${mine.slice(0, 10).map(o => `<a class="row" href="#/order/${o.id}"><span><b>#${o.id}</b> · ${new Date(o.date).toLocaleDateString("en-GB")}</span><span>${money(o.total)} →</span></a>`).join("")}</div>` : ""}
    </div>`;
  }

  const pageHead = (bn, t) => `<span class="bn">${bn}</span><h1 class="display">${t}</h1>`;
  const about = () => `<div class="page wrap">${pageHead("আমাদের কথা", "About Libas Wafia")}
    <p><b>Libas</b> means attire, and <b>Wafia</b> means faithful. We're a women's clothing store based in ${esc(S.location)}. We bring you modest, elegant and comfortable clothing at honest prices.</p>
    <h2>What we offer</h2><p>Three piece sets, kurtis, abayas and borkas, hijabs, sarees and festive wear. We choose every piece for its fabric, finish and fit.</p>
    <h2>Our promise</h2><p>What you see is what you get. Check your parcel in front of the delivery person, and we'll happily exchange sizes within 3 days.</p>
    <a class="btn" href="#/shop">Browse the rail ${ICON.arrow}</a></div>`;
  const contact = () => `<div class="page wrap">${pageHead("যোগাযোগ", "Contact us")}
    <p class="muted">Questions about a product, size or order? Message us and a real person will reply.</p>
    <div class="contact-cards">
      <div><span class="kicker">Call</span><b>${esc(S.phone)}</b><button type="button" class="copy" data-copy="${esc(S.phone)}">Copy number</button></div>
      <a href="${waHref("Hi " + S.name + "!")}" target="_blank" rel="noopener"><span class="kicker">WhatsApp</span><b>Chat with us →</b><span class="muted small">${esc(S.phone)}</span></a>
      <a href="${S.messenger}" target="_blank" rel="noopener"><span class="kicker">Messenger</span><b>Libas Wafia →</b><span class="muted small">Facebook page</span></a>
    </div>
    <p><b>Email:</b> ${esc(S.email)} <button type="button" class="copy" data-copy="${esc(S.email)}" style="margin:0 0 0 6px;background:var(--stone)">Copy</button><br><b>Location:</b> ${esc(S.location)}</p></div>`;
  const policy = () => `<div class="page wrap">${pageHead("ডেলিভারি ও এক্সচেঞ্জ", "Delivery & exchange")}
    <h2>Delivery charges</h2><p>${S.shipping.map(z => `${z.label}: <b>${money(z.cost)}</b>`).join("<br>")}<br>Free delivery on orders over <b>${money(S.freeShippingOver)}</b>.</p>
    <h2>Delivery time</h2><p>Inside Dhaka: 1–2 working days. Outside Dhaka: 2–4 working days.</p>
    <h2>Payment</h2><p>${S.payments.map(p => `<b>${p.label}</b>: ${esc(p.note)}`).join("<br>")}</p>
    <h2>Exchange & returns</h2><p>Please check your product in front of the delivery person. If the size doesn't fit, we exchange within 3 days as long as the item is unused and has its tags. If an item is damaged or wrong, we replace it free of charge.</p></div>`;
  const notFound = () => `<div class="wrap empty"><h3>Page not found</h3><a class="btn" href="#/">Back home</a></div>`;

  /* ---------- router ---------- */
  let memRoute = "/";
  function current() { return MEMORY ? memRoute : (location.hash.replace(/^#/, "") || "/"); }
  function route() {
    const [path, qs] = current().split("?");
    const parts = path.split("/").filter(Boolean);
    return { name: parts[0] || "home", arg: parts[1], q: new URLSearchParams(qs || "") };
  }
  function go(h) {
    h = String(h).replace(/^#/, "") || "/";
    if (MEMORY) { memRoute = h; onNav(); }
    else if (location.hash.replace(/^#/, "") === h) onNav();
    else location.hash = "#" + h;
  }
  function onNav() { closeAll(); render(); window.scrollTo(0, 0); }

  let slideTimer;
  function render() {
    clearInterval(slideTimer);
    const r = route();
    const views = {
      home, shop: () => shop(r.q), product: () => product(r.arg), wishlist, checkout,
      order: () => orderView(r.arg), track: () => track(r.q), about, contact, policy
    };
    app.innerHTML = (views[r.name] || notFound)();
    const navKey = r.name === "home" ? "#/" : r.name === "shop" && r.q.get("sort") === "new" ? "#/shop?sort=new" : "#/" + r.name;
    $$(".nav > a").forEach(a => a.classList.toggle("active", a.getAttribute("href") === navKey));
    $$(".tabbar [data-tab]").forEach(a => a.classList.toggle("on", a.dataset.tab === r.name));
    const titles = { home: "Women's Clothing Store, Bashundhara", shop: "Shop", product: (byId(r.arg) || {}).name, wishlist: "Wishlist", checkout: "Checkout", order: "Order received", track: "Track order", about: "About", contact: "Contact", policy: "Delivery & exchange" };
    document.title = `${titles[r.name] || "Not found"} — ${S.name}`;
    bindPage(r);
  }

  function bindPage(r) {
    if (r.name === "home") {
      $("#homeTabs").onclick = e => {
        const b = e.target.closest("[data-tab]"); if (!b) return;
        $$("#homeTabs button").forEach(x => x.classList.toggle("on", x === b));
        $$("[data-panel]").forEach(p => p.hidden = p.dataset.panel !== b.dataset.tab);
      };
    }
    if (r.name === "shop") {
      $("#sortSel").onchange = e => { const q = new URLSearchParams(r.q); q.set("sort", e.target.value); go("#/shop?" + q); };
      $("#priceForm").onsubmit = e => {
        e.preventDefault(); const fd = new FormData(e.target); const q = new URLSearchParams(r.q);
        ["min", "max"].forEach(k => fd.get(k) ? q.set(k, fd.get(k)) : q.delete(k));
        fd.get("instock") ? q.set("instock", "1") : q.delete("instock");
        go("#/shop?" + q);
      };
    }
    if (r.name === "product") {
      const p = byId(r.arg); if (!p) return;
      const sizes = $("#sizes"), qtyIn = $("#pdpQty input");
      sizes.onclick = e => { const b = e.target.closest(".size"); if (!b) return; $$(".size", sizes).forEach(x => x.classList.toggle("active", x === b)); const m = $("#measure") || $(".measure-note", sizes.parentNode); if (m) m.outerHTML = measureHTML(p, b.dataset.size); };
      $("#pdpQty").onclick = e => { const b = e.target.closest("[data-q]"); if (b) qtyIn.value = Math.max(1, Math.min(p.stock || 1, (Number(qtyIn.value) || 1) + Number(b.dataset.q))); };
      $("#thumbs").onclick = e => {
        const b = e.target.closest("[data-view]"); if (!b) return;
        $$("#thumbs button").forEach(x => x.classList.toggle("on", x === b));
        $("#mainShot").innerHTML = art(p, b.dataset.view);
      };
      $("#sizeGuideBtn").onclick = () => { const d = $("#sizeGuide"); d.open = true; d.scrollIntoView({ behavior: "smooth", block: "center" }); };
      const sel = () => [p.id, $(".size.active", sizes).dataset.size, Math.max(1, Number(qtyIn.value) || 1)];
      $("#pdpAdd").onclick = () => addToCart(...sel());
      $("#stickyAdd").onclick = () => addToCart(...sel());
      $("#pdpBuy").onclick = () => { addToCart(...sel(), false); go("#/checkout"); };
      const sticky = $("#stickyBuy"), buyRow = $("#buyRow");
      if ("IntersectionObserver" in window) new IntersectionObserver(([en]) => sticky.classList.toggle("show", !en.isIntersecting && en.boundingClientRect.top < 0)).observe(buyRow);
    }
    if (r.name === "checkout" && cart.length) {
      const form = $("#checkoutForm");
      const saveDraft = () => store.set("draft", Object.fromEntries(new FormData(form)));
      form.oninput = saveDraft;
      form.onchange = e => {
        saveDraft();
        if (e.target.name === "shipping") render();
        if (e.target.name === "payment") $("#trxWrap").hidden = e.target.value === "cod";
        if (e.target.name === "district") {
          const d = store.get("draft", {}); d.shipping = e.target.value === "Dhaka" ? "inside_dhaka" : "outside_dhaka"; store.set("draft", d); render();
        }
      };
      form.onsubmit = e => { e.preventDefault(); placeOrder(form); };
      $("#applyCoupon").onclick = () => {
        const code = $("#couponInput").value.trim().toUpperCase();
        const c = S.coupons[code];
        if (!c) return toast("That coupon code doesn't exist");
        if (c.min && totals().sub < c.min) return toast(`${code} needs a minimum order of ${money(c.min)}`);
        coupon = code; store.set("coupon", coupon); saveCart(); render(); toast(`${code} applied`);
      };
      const rm = $("#rmCoupon"); if (rm) rm.onclick = () => { coupon = null; store.set("coupon", null); saveCart(); render(); };
    }
    if (r.name === "track" && $("#trackForm")) {
      $("#trackForm").onsubmit = e => { e.preventDefault(); go("#/track?id=" + encodeURIComponent(new FormData(e.target).get("id"))); };
    }
  }

  /* ---------- global events ---------- */
  document.addEventListener("click", e => {
    const t = e.target;
    const qa = t.closest("[data-qadd]"); if (qa) { e.preventDefault(); return addToCart(qa.dataset.qadd, qa.dataset.size, 1, false); }
    const w = t.closest("[data-wish]"); if (w) { e.preventDefault(); return toggleWish(w.dataset.wish); }
    const qv = t.closest("[data-quick]"); if (qv) { e.preventDefault(); return openQuick(qv.dataset.quick); }
    const rm = t.closest("[data-rm]"); if (rm) return removeLine(Number(rm.dataset.rm));
    const qb = t.closest(".qty[data-i] [data-q]"); if (qb) { const i = Number(qb.closest(".qty").dataset.i); return setQty(i, cart[i].qty + Number(qb.dataset.q)); }
    const cp = t.closest("[data-copy]");
    if (cp) {
      const v = cp.dataset.copy;
      const done = () => { const old = cp.textContent; cp.textContent = "Copied"; setTimeout(() => cp.textContent = old, 1500); };
      try { navigator.clipboard.writeText(v).then(done, () => toast("Copy this: " + v)); } catch (err) { toast("Copy this: " + v); }
      return;
    }
    if (t.closest("[data-close]") || t.id === "quickView") return closeQuick();
    const a = t.closest('a[href^="#"]');
    if (a && !e.defaultPrevented) { e.preventDefault(); go(a.getAttribute("href")); }
  });
  document.addEventListener("change", e => {
    const qi = e.target.closest(".qty[data-i] input"); if (qi) setQty(Number(qi.closest(".qty").dataset.i), Number(qi.value) || 1);
  });
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeAll(); });
  $("#cartBtn").onclick = openCart;
  $("#tabCart").onclick = openCart;
  $("#closeCart").onclick = closeAll;
  $("#overlay").onclick = closeAll;
  $("#menuBtn").onclick = () => { $("#nav").classList.add("open"); $("#overlay").classList.add("show"); };
  $("#closeNav").onclick = closeAll;
  $("#searchForm").onsubmit = e => { e.preventDefault(); const v = $("#searchInput").value.trim(); go("#/shop" + (v ? "?q=" + encodeURIComponent(v) : "")); };
  if (!MEMORY) window.addEventListener("hashchange", onNav);

  /* ---------- static bits ---------- */
  const wa = waHref(`Hi ${S.name}! I'd like to order.`);
  ["#waFloat", "#tabWa", "#footWa"].forEach(s => $(s).href = wa);
  $("#footFb").href = S.facebook;
  $("#footMsg").href = S.messenger;
  $("#tapeTrack").innerHTML = tapeNums(100);
  const tapeEl = $("#tapeTrack");
  const moveTape = () => { const max = document.documentElement.scrollHeight - innerHeight; const prog = max > 0 ? scrollY / max : 0; tapeEl.style.transform = `translateX(${-prog * Math.max(0, tapeEl.scrollWidth - innerWidth)}px)`; };
  window.addEventListener("scroll", moveTape, { passive: true });
  $("#year").textContent = new Date().getFullYear();
  $("#navCats").innerHTML = C.map(c => `<a href="#/shop?cat=${c.slug}">${esc(c.name)}</a>`).join("");
  $("#footerCats").innerHTML = C.map(c => `<a href="#/shop?cat=${c.slug}">${esc(c.name)}</a>`).join("");
  $("#footContact").innerHTML = `${esc(S.phone)}<br>${esc(S.email)}<br>${esc(S.location)}`;

  renderCartUI();
  render();
})();
