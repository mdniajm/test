(function () {
  "use strict";

  const S = window.SHOP;
  const P = window.PRODUCTS;
  const app = document.getElementById("app");
  const CART_KEY = "shariftel_cart_v1";

  /* ---------- helpers ---------- */
  const bnDigits = "০১২৩৪৫৬৭৮৯";
  const toBn = (n) => String(n).replace(/\d/g, (d) => bnDigits[d]);
  const money = (n) => "৳" + toBn(Number(n).toLocaleString("en-IN"));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const find = (id) => P.find((p) => p.id === id);
  const waLink = (text) => "https://wa.me/" + S.whatsapp + "?text=" + encodeURIComponent(text);
  const msLink = () => "https://m.me/" + S.messenger;
  const pageUrl = (p) => location.origin + location.pathname + "#/product/" + p.id;

  function toast(msg) {
    const t = document.getElementById("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove("show"), 2600);
  }

  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); return true; }
    catch (e) {
      const ta = document.createElement("textarea");
      ta.value = text; document.body.appendChild(ta); ta.select();
      let ok = false; try { ok = document.execCommand("copy"); } catch (_) {}
      ta.remove(); return ok;
    }
  }

  // Messenger cannot pre-fill a message, so copy it first, then open Messenger.
  async function openMessenger(text) {
    if (text) {
      const ok = await copyText(text);
      toast(ok ? "মেসেজ কপি হয়েছে – Messenger-এ পেস্ট করে পাঠান" : "Messenger খোলা হচ্ছে…");
    }
    window.open(msLink(), "_blank", "noopener");
  }

  /* ---------- cart ---------- */
  let cart = [];
  try { cart = JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch (e) { cart = []; }
  cart = cart.filter((i) => find(i.id));

  function saveCart() {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) {}
    renderCart();
  }
  const keyOf = (id, v) => id + "|" + (v || "");
  function addToCart(id, variant, qty) {
    const k = keyOf(id, variant);
    const line = cart.find((i) => keyOf(i.id, i.variant) === k);
    if (line) line.qty += qty; else cart.push({ id, variant: variant || null, qty });
    saveCart();
  }
  function setQty(k, qty) {
    const line = cart.find((i) => keyOf(i.id, i.variant) === k);
    if (!line) return;
    line.qty = Math.max(0, qty);
    if (!line.qty) cart = cart.filter((i) => i !== line);
    saveCart();
  }
  const cartCount = () => cart.reduce((a, i) => a + i.qty, 0);
  const subtotal = () => cart.reduce((a, i) => a + find(i.id).price * i.qty, 0);

  function orderLines() {
    return cart.map((i, n) => {
      const p = find(i.id);
      return `${n + 1}. ${p.name}${i.variant ? " (" + i.variant + ")" : ""} × ${i.qty} = ৳${p.price * i.qty}`;
    }).join("\n");
  }

  function renderCart() {
    document.getElementById("cartCount").textContent = toBn(cartCount());
    document.getElementById("cartCount").classList.toggle("has", cartCount() > 0);
    const body = document.getElementById("cartItems");
    const foot = document.getElementById("cartFoot");
    if (!cart.length) {
      body.innerHTML = `<div class="empty"><div class="empty-icon">🛒</div><p>আপনার কার্ট খালি</p><a href="#/" class="btn btn-primary" data-close>শপিং করুন</a></div>`;
      foot.innerHTML = "";
      return;
    }
    body.innerHTML = cart.map((i) => {
      const p = find(i.id), k = keyOf(i.id, i.variant);
      return `<div class="cart-line">
        <img src="${p.image}" alt="${esc(p.name)}">
        <div class="cart-line-info">
          <a href="#/product/${p.id}" data-close class="cart-line-name">${esc(p.name)}</a>
          ${i.variant ? `<span class="chip">${esc(i.variant)}</span>` : ""}
          <div class="cart-line-row">
            <div class="qty qty-sm">
              <button data-dec="${k}" aria-label="Decrease">−</button>
              <span>${toBn(i.qty)}</span>
              <button data-inc="${k}" aria-label="Increase">+</button>
            </div>
            <strong>${money(p.price * i.qty)}</strong>
          </div>
        </div>
        <button class="icon-btn remove" data-rm="${k}" aria-label="Remove">✕</button>
      </div>`;
    }).join("");
    foot.innerHTML = `
      <div class="sum-row"><span>সাবটোটাল</span><strong>${money(subtotal())}</strong></div>
      <p class="muted small">ডেলিভারি চার্জ চেকআউটে যোগ হবে</p>
      <a href="#/checkout" class="btn btn-primary btn-block" data-close>চেকআউট করুন</a>
      <button class="btn btn-ghost btn-block" data-clear>কার্ট খালি করুন</button>`;
  }

  /* drawer */
  const drawer = document.getElementById("drawer");
  const overlay = document.getElementById("overlay");
  const openCart = () => { drawer.classList.add("open"); overlay.classList.add("show"); document.body.classList.add("lock"); };
  const closeCart = () => { drawer.classList.remove("open"); overlay.classList.remove("show"); document.body.classList.remove("lock"); };
  document.getElementById("cartBtn").addEventListener("click", openCart);
  document.getElementById("closeCart").addEventListener("click", closeCart);
  overlay.addEventListener("click", closeCart);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeCart(); });

  drawer.addEventListener("click", (e) => {
    const t = e.target.closest("button, a");
    if (!t) return;
    const line = (k) => cart.find((i) => keyOf(i.id, i.variant) === k);
    if (t.dataset.inc) setQty(t.dataset.inc, line(t.dataset.inc).qty + 1);
    else if (t.dataset.dec) setQty(t.dataset.dec, line(t.dataset.dec).qty - 1);
    else if (t.dataset.rm) setQty(t.dataset.rm, 0);
    else if (t.hasAttribute("data-clear")) { cart = []; saveCart(); }
    if (t.hasAttribute("data-close")) closeCart();
  });

  /* ---------- views ---------- */
  function productCard(p) {
    const off = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
    return `<article class="card">
      <a href="#/product/${p.id}" class="card-img">
        <img src="${p.image}" alt="${esc(p.name)}" loading="lazy">
        ${p.badge ? `<span class="badge">${esc(p.badge)}</span>` : ""}
        ${off ? `<span class="badge badge-off">-${toBn(off)}%</span>` : ""}
      </a>
      <div class="card-body">
        <span class="card-cat">${esc(p.category)} · ${esc(p.model)}</span>
        <h3><a href="#/product/${p.id}">${esc(p.name)}</a></h3>
        <p class="card-bn">${esc(p.nameBn)}</p>
        <div class="price">${money(p.price)} ${p.oldPrice ? `<del>${money(p.oldPrice)}</del>` : ""}</div>
        <div class="card-actions">
          ${p.variants
            ? `<a href="#/product/${p.id}" class="btn btn-primary btn-sm">অপশন বাছুন</a>`
            : `<button class="btn btn-primary btn-sm" data-add="${p.id}">কার্টে যোগ করুন</button>`}
          <a class="btn btn-wa btn-sm btn-icon" href="${waLink(`আমি এই প্রোডাক্টটি অর্ডার করতে চাই:\n${p.name} (${p.model}) – ৳${p.price}\n${pageUrl(p)}`)}" target="_blank" rel="noopener" aria-label="Order on WhatsApp">WhatsApp</a>
        </div>
      </div>
    </article>`;
  }

  function viewHome() {
    document.title = "Sharif Telecom | SHARIF TEL Chargers & Mobile Accessories";
    return `
    <section class="hero">
      <div class="container hero-grid">
        <div class="hero-copy">
          <span class="eyebrow">⚡ SHARIF TEL · Best brand</span>
          <h1>দ্রুত চার্জ,<br><span>নিশ্চিত আস্থা</span></h1>
          <p>শরীফ টেল-এর সুপার-ফাস্ট চার্জার, ডাটা কেবল ও মোবাইল এক্সেসরিজ – সাথে ৬ মাসের ওয়ারেন্টি। অভিজ্ঞ টেকনিশিয়ান দ্বারা সকল ধরনের মোবাইল সার্ভিসিং।</p>
          <div class="hero-cta">
            <a href="#/" data-scroll="products" class="btn btn-primary btn-lg">প্রোডাক্ট দেখুন</a>
            <a href="${waLink("আসসালামু আলাইকুম, আমি অর্ডার করতে চাই।")}" target="_blank" rel="noopener" class="btn btn-wa btn-lg">WhatsApp-এ অর্ডার</a>
          </div>
          <ul class="trust">
            <li><b>৬ মাস</b>ওয়ারেন্টি</li>
            <li><b>সারা দেশে</b>ডেলিভারি</li>
            <li><b>পাইকারি</b>ও খুচরা</li>
          </ul>
        </div>
        <div class="hero-art">
          <img src="images/charger-27w.jpg" alt="SHARIF TEL 27W charger">
        </div>
      </div>
    </section>

    <section class="section" id="products">
      <div class="container">
        <div class="section-head">
          <h2>আমাদের প্রোডাক্ট</h2>
          <p>শরীফ টেল ব্র্যান্ডের অরিজিনাল চার্জার ও কেবল</p>
        </div>
        <div class="filters" id="filters">
          ${["All", ...new Set(P.map((p) => p.category))].map((c, i) => `<button class="pill${i ? "" : " active"}" data-cat="${c}">${c === "All" ? "সব" : c === "Charger" ? "চার্জার" : c === "Cable" ? "কেবল" : esc(c)}</button>`).join("")}
        </div>
        <div class="grid" id="grid">${P.map(productCard).join("")}</div>
      </div>
    </section>

    <section class="section section-alt" id="services">
      <div class="container split">
        <img class="split-img" src="images/shop.jpg" alt="Sharif Telecom shop, Babuganj Bazar" loading="lazy">
        <div>
          <span class="eyebrow">🔧 মোবাইল সার্ভিসিং</span>
          <h2>আপনার শখের মোবাইলটি নষ্ট? চিন্তা নেই!</h2>
          <p>আধুনিক প্রযুক্তি ও অভিজ্ঞ টেকনিশিয়ান দ্বারা নিখুঁতভাবে আপনার ফোনের সমস্যার সমাধান।</p>
          <ul class="checks">
            <li>সব মডেলের মোবাইল সার্ভিসিং</li>
            <li>টাচ / ডিসপ্লে রিপ্লেসমেন্ট</li>
            <li>আইসি মেরামত</li>
            <li>ব্যাটারি ও চার্জার</li>
          </ul>
          <div class="hero-cta">
            <a href="${waLink("আসসালামু আলাইকুম, আমার মোবাইল সার্ভিসিং করাতে চাই। সমস্যা: ")}" target="_blank" rel="noopener" class="btn btn-wa">সার্ভিসিং-এর জন্য মেসেজ দিন</a>
            <a href="tel:+8801850499052" class="btn btn-ghost">কল করুন</a>
          </div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container dealer">
        <div>
          <h2>পাইকারি ও ডিলার নেওয়া হচ্ছে!</h2>
          <p>থানা/জেলা পর্যায়ে ডিলারশিপের সুযোগ। সরাসরি ইমপোর্টার থেকে কম দামে অরিজিনাল পণ্য, মার্কেটিং সাপোর্ট ও দ্রুত ডেলিভারি।</p>
        </div>
        <div class="dealer-cta">
          <a href="${waLink("আসসালামু আলাইকুম, আমি শরীফ টেল-এর ডিলার/পাইকারি সম্পর্কে জানতে চাই।")}" target="_blank" rel="noopener" class="btn btn-light">WhatsApp</a>
          <a data-ms-text="আসসালামু আলাইকুম, আমি শরীফ টেল-এর ডিলার/পাইকারি সম্পর্কে জানতে চাই।" class="btn btn-outline-light" href="${msLink()}" target="_blank" rel="noopener">Messenger</a>
        </div>
      </div>
    </section>`;
  }

  function viewProduct(id) {
    const p = find(id);
    if (!p) return `<section class="section"><div class="container empty"><h2>প্রোডাক্ট পাওয়া যায়নি</h2><a class="btn btn-primary" href="#/">হোমে ফিরুন</a></div></section>`;
    document.title = p.name + " | Sharif Telecom";
    const off = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
    const related = P.filter((x) => x.id !== p.id).slice(0, 3);
    return `
    <section class="section product-page">
      <div class="container">
        <nav class="crumbs"><a href="#/">হোম</a> / <a href="#/" data-scroll="products">প্রোডাক্ট</a> / <span>${esc(p.model)}</span></nav>
        <div class="pd">
          <div class="pd-gallery">
            <img src="${p.image}" alt="${esc(p.name)}">
            ${off ? `<span class="badge badge-off">-${toBn(off)}%</span>` : ""}
          </div>
          <div class="pd-info">
            <span class="card-cat">${esc(p.category)} · Model: ${esc(p.model)}</span>
            <h1>${esc(p.name)}</h1>
            <p class="pd-bn">${esc(p.nameBn)}</p>
            <div class="price price-lg">${money(p.price)} ${p.oldPrice ? `<del>${money(p.oldPrice)}</del>` : ""}</div>
            <p class="pd-short">${esc(p.short)}</p>

            ${p.variants ? `
            <div class="field">
              <label>কানেক্টর টাইপ</label>
              <div class="variants" id="variants">
                ${p.variants.map((v, i) => `<button class="pill${i ? "" : " active"}" data-variant="${esc(v)}">${esc(v)}</button>`).join("")}
              </div>
            </div>` : ""}

            <div class="field">
              <label>পরিমাণ</label>
              <div class="qty" id="qtyBox">
                <button data-q="-1" aria-label="Decrease">−</button>
                <span id="qty">১</span>
                <button data-q="1" aria-label="Increase">+</button>
              </div>
            </div>

            <div class="pd-actions">
              <button class="btn btn-primary btn-lg" id="addBtn">🛒 কার্টে যোগ করুন</button>
              <button class="btn btn-dark btn-lg" id="buyBtn">এখনই কিনুন</button>
            </div>
            <div class="pd-chat">
              <a class="btn btn-wa btn-lg" id="waBtn" target="_blank" rel="noopener">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35zM12.04 21.5a9.4 9.4 0 0 1-4.8-1.31l-.34-.2-3.57.94.95-3.48-.22-.36a9.38 9.38 0 0 1-1.44-5.01c0-5.2 4.23-9.42 9.43-9.42 2.52 0 4.88.98 6.66 2.76a9.36 9.36 0 0 1 2.76 6.67c0 5.2-4.23 9.42-9.42 9.42zm8.02-17.44A11.27 11.27 0 0 0 12.04.75C5.8.75.72 5.83.72 12.08c0 2 .52 3.95 1.52 5.66L.62 23.25l5.64-1.48a11.3 11.3 0 0 0 5.78 1.47c6.24 0 11.32-5.08 11.32-11.33 0-3.03-1.18-5.87-3.31-8z"/></svg>
                WhatsApp-এ অর্ডার
              </a>
              <button class="btn btn-ms btn-lg" id="msBtn">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 2C6.36 2 2 6.13 2 11.7c0 2.91 1.19 5.44 3.14 7.17.16.14.26.35.27.57l.05 1.78c.02.57.6.94 1.12.71l1.98-.87c.17-.08.36-.09.54-.04.91.25 1.87.38 2.9.38 5.64 0 10-4.13 10-9.7S17.64 2 12 2zm6 7.46-2.93 4.67c-.47.74-1.47.93-2.17.4l-2.34-1.75a.6.6 0 0 0-.72 0l-3.16 2.4c-.42.32-.97-.18-.69-.63l2.93-4.67c.47-.74 1.47-.93 2.17-.4l2.34 1.75a.6.6 0 0 0 .72 0l3.16-2.4c.42-.32.97.18.69.63z"/></svg>
                Messenger-এ জানুন
              </button>
            </div>

            <div class="pd-features">
              <h3>বৈশিষ্ট্য</h3>
              <ul class="checks">${p.features.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>
            </div>
            <ul class="pd-perks">
              <li>🛡️ ৬ মাসের ওয়ারেন্টি</li>
              <li>🚚 সারা দেশে ক্যাশ অন ডেলিভারি</li>
              <li>🏪 বাবুগঞ্জ বাজারের দোকান থেকেও কিনতে পারবেন</li>
            </ul>
          </div>
        </div>

        <div class="section-head section-head-left"><h2>আরও প্রোডাক্ট</h2></div>
        <div class="grid">${related.map(productCard).join("")}</div>
      </div>
    </section>`;
  }

  function bindProduct(id) {
    const p = find(id);
    if (!p) return;
    let qty = 1;
    let variant = p.variants ? p.variants[0] : null;
    const qtyEl = document.getElementById("qty");
    const wa = document.getElementById("waBtn");
    const msg = () => `আসসালামু আলাইকুম, আমি এই প্রোডাক্টটি অর্ডার করতে চাই:\n\n${p.name}\nModel: ${p.model}${variant ? "\nType: " + variant : ""}\nQty: ${qty}\nPrice: ৳${p.price * qty}\n\n${pageUrl(p)}`;
    const update = () => { qtyEl.textContent = toBn(qty); wa.href = waLink(msg()); };
    update();

    document.getElementById("qtyBox").addEventListener("click", (e) => {
      const b = e.target.closest("button[data-q]");
      if (!b) return;
      qty = Math.max(1, Math.min(99, qty + Number(b.dataset.q)));
      update();
    });
    const vbox = document.getElementById("variants");
    if (vbox) vbox.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-variant]");
      if (!b) return;
      vbox.querySelectorAll(".pill").forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
      variant = b.dataset.variant;
      update();
    });
    document.getElementById("addBtn").addEventListener("click", () => {
      addToCart(p.id, variant, qty);
      toast("✓ কার্টে যোগ হয়েছে");
      openCart();
    });
    document.getElementById("buyBtn").addEventListener("click", () => {
      addToCart(p.id, variant, qty);
      location.hash = "#/checkout";
    });
    document.getElementById("msBtn").addEventListener("click", () => openMessenger(msg()));
  }

  function viewCheckout() {
    document.title = "Checkout | Sharif Telecom";
    if (!cart.length) {
      return `<section class="section"><div class="container empty"><div class="empty-icon">🛒</div><h2>আপনার কার্ট খালি</h2><a class="btn btn-primary" href="#/">শপিং করুন</a></div></section>`;
    }
    return `
    <section class="section">
      <div class="container">
        <nav class="crumbs"><a href="#/">হোম</a> / <span>চেকআউট</span></nav>
        <h1 class="page-title">চেকআউট</h1>
        <div class="checkout">
          <form class="co-form" id="coForm" novalidate>
            <h3>ডেলিভারি তথ্য</h3>
            <div class="field"><label for="f-name">আপনার নাম *</label><input id="f-name" name="name" required autocomplete="name"></div>
            <div class="field"><label for="f-phone">মোবাইল নম্বর *</label><input id="f-phone" name="phone" type="tel" inputmode="tel" required autocomplete="tel" placeholder="01XXXXXXXXX"></div>
            <div class="field"><label for="f-addr">সম্পূর্ণ ঠিকানা *</label><textarea id="f-addr" name="address" rows="3" required autocomplete="street-address"></textarea></div>
            <div class="field">
              <label>ডেলিভারি এলাকা</label>
              <div class="radio-row">
                <label class="radio"><input type="radio" name="area" value="inside" checked> বরিশালের ভিতরে (${money(S.deliveryInside)})</label>
                <label class="radio"><input type="radio" name="area" value="outside"> বরিশালের বাইরে (${money(S.deliveryOutside)})</label>
                <label class="radio"><input type="radio" name="area" value="pickup"> দোকান থেকে নেব (ফ্রি)</label>
              </div>
            </div>
            <div class="field"><label for="f-note">নোট (ঐচ্ছিক)</label><input id="f-note" name="note"></div>
            <p class="form-error" id="formError" hidden></p>
          </form>

          <aside class="co-summary">
            <h3>অর্ডার সারাংশ</h3>
            <div class="co-lines">
              ${cart.map((i) => { const p = find(i.id); return `<div class="co-line"><img src="${p.image}" alt=""><div><b>${esc(p.name)}</b>${i.variant ? `<span class="chip">${esc(i.variant)}</span>` : ""}<small>${toBn(i.qty)} × ${money(p.price)}</small></div><strong>${money(p.price * i.qty)}</strong></div>`; }).join("")}
            </div>
            <div class="sum-row"><span>সাবটোটাল</span><span>${money(subtotal())}</span></div>
            <div class="sum-row"><span>ডেলিভারি</span><span id="delv"></span></div>
            <div class="sum-row sum-total"><span>সর্বমোট</span><strong id="total"></strong></div>
            <p class="muted small">পেমেন্ট: ক্যাশ অন ডেলিভারি / বিকাশ / নগদ (কনফার্মেশনের সময় জানানো হবে)</p>
            <button class="btn btn-wa btn-lg btn-block" id="sendWa">WhatsApp-এ অর্ডার পাঠান</button>
            <button class="btn btn-ms btn-lg btn-block" id="sendMs">Messenger-এ অর্ডার পাঠান</button>
          </aside>
        </div>
      </div>
    </section>`;
  }

  function bindCheckout() {
    const form = document.getElementById("coForm");
    if (!form) return;
    const fee = () => ({ inside: S.deliveryInside, outside: S.deliveryOutside, pickup: 0 }[form.area.value]);
    const refresh = () => {
      document.getElementById("delv").textContent = fee() ? money(fee()) : "ফ্রি";
      document.getElementById("total").textContent = money(subtotal() + fee());
    };
    form.addEventListener("change", refresh);
    refresh();

    const build = () => {
      const err = document.getElementById("formError");
      const name = form.name.value.trim(), phone = form.phone.value.trim(), addr = form.address.value.trim();
      const bad = !name ? "নাম লিখুন" : !/^(\+?88)?01[3-9]\d{8}$/.test(phone.replace(/[\s-]/g, "")) ? "সঠিক মোবাইল নম্বর লিখুন (01XXXXXXXXX)" : (!addr && form.area.value !== "pickup") ? "ঠিকানা লিখুন" : "";
      err.hidden = !bad; err.textContent = bad;
      if (bad) { form.querySelector(!name ? "#f-name" : bad.includes("নম্বর") ? "#f-phone" : "#f-addr").focus(); return null; }
      const areaTxt = { inside: "বরিশালের ভিতরে", outside: "বরিশালের বাইরে", pickup: "দোকান থেকে পিকআপ" }[form.area.value];
      return `🛒 নতুন অর্ডার – shariftel.com\n\n${orderLines()}\n\nসাবটোটাল: ৳${subtotal()}\nডেলিভারি (${areaTxt}): ৳${fee()}\nসর্বমোট: ৳${subtotal() + fee()}\n\n👤 নাম: ${name}\n📞 মোবাইল: ${phone}\n📍 ঠিকানা: ${addr || "-"}${form.note.value.trim() ? "\n📝 নোট: " + form.note.value.trim() : ""}`;
    };
    document.getElementById("sendWa").addEventListener("click", () => {
      const m = build(); if (!m) return;
      window.open(waLink(m), "_blank", "noopener");
    });
    document.getElementById("sendMs").addEventListener("click", () => {
      const m = build(); if (!m) return;
      openMessenger(m);
    });
  }

  /* ---------- router ---------- */
  function route() {
    const h = location.hash || "#/";
    if (route.ready) closeCart();
    route.ready = true;
    const m = h.match(/^#\/product\/([\w-]+)/);
    if (m) { app.innerHTML = viewProduct(m[1]); bindProduct(m[1]); }
    else if (h.startsWith("#/checkout")) { app.innerHTML = viewCheckout(); bindCheckout(); }
    else { app.innerHTML = viewHome(); }
    hydrateLinks();
    if (route.pendingScroll) { scrollToId(route.pendingScroll); route.pendingScroll = null; }
    else window.scrollTo(0, 0);
  }

  function scrollToId(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // Generic data-wa / data-ms links (footer, floating buttons)
  function hydrateLinks() {
    document.querySelectorAll("[data-wa]").forEach((a) => { a.href = waLink(a.dataset.wa); });
    document.querySelectorAll("[data-ms]").forEach((a) => { a.href = msLink(); });
  }

  document.addEventListener("click", (e) => {
    const s = e.target.closest("[data-scroll]");
    if (s) {
      e.preventDefault();
      const id = s.dataset.scroll;
      if (id === "contact" || document.getElementById(id)) { scrollToId(id); }
      else { route.pendingScroll = id; location.hash = "#/"; }
      return;
    }
    const add = e.target.closest("[data-add]");
    if (add) {
      addToCart(add.dataset.add, null, 1);
      toast("✓ কার্টে যোগ হয়েছে");
      return;
    }
    const mt = e.target.closest("[data-ms-text]");
    if (mt) { e.preventDefault(); openMessenger(mt.dataset.msText); return; }
    const cat = e.target.closest("[data-cat]");
    if (cat) {
      document.querySelectorAll("#filters .pill").forEach((x) => x.classList.toggle("active", x === cat));
      const c = cat.dataset.cat;
      document.getElementById("grid").innerHTML = P.filter((p) => c === "All" || p.category === c).map(productCard).join("");
    }
  });

  window.addEventListener("hashchange", route);
  window.addEventListener("storage", (e) => {
    if (e.key === CART_KEY) { try { cart = JSON.parse(e.newValue) || []; } catch (_) { cart = []; } renderCart(); }
  });
  document.getElementById("year").textContent = toBn(new Date().getFullYear());
  renderCart();
  route();
})();
