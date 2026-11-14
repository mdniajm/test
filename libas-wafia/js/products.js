/*
 * Libas Wafia — product catalogue.
 * PLACEHOLDER DATA: replace names, prices, sizes and images with the real
 * products from the Facebook page. Fields map 1:1 to WooCommerce columns
 * (see tools/build-woocommerce-csv.js).
 *   image: path/URL to a real photo. Leave "" to show the drawn placeholder.
 *   color: tint used by the placeholder illustration.
 *   shape: placeholder silhouette — "dress" | "kurti" | "abaya" | "hijab" | "saree" | "kids"
 *   pattern: placeholder fabric print — "floral" | "paisley" | "dots" | "stripe" | "check" | "lattice" | "leaf" | "plain"
 */
window.CATEGORIES = [
  { slug: "three-piece", name: "Three Piece" },
  { slug: "kurti", name: "Kurti & Tops" },
  { slug: "abaya", name: "Abaya & Borka" },
  { slug: "hijab", name: "Hijab & Scarf" },
  { slug: "saree", name: "Saree" },
  { slug: "kids", name: "Kids" }
];

window.PRODUCTS = [
  { id: 101, sku: "LW-3P-101", name: "Rangoli Embroidered Three Piece", category: "three-piece", price: 2850, salePrice: 2450, sizes: ["M","L","XL","XXL"], stock: 12, color: "#b03a5b", shape: "dress", pattern: "floral", image: "", featured: true, isNew: false,
    description: "Soft cotton lawn kameez with hand-finished neck embroidery, matching printed salwar and chiffon dupatta." },
  { id: 102, sku: "LW-3P-102", name: "Noor Pastel Lawn Set", category: "three-piece", price: 2250, salePrice: null, sizes: ["S","M","L","XL"], stock: 20, color: "#7fb7a4", shape: "dress", pattern: "leaf", image: "", featured: true, isNew: true,
    description: "Breathable summer lawn in soft mint with digital floral print. Unstitched-feel comfort, ready to wear." },
  { id: 103, sku: "LW-3P-103", name: "Jamdani Weave Festive Set", category: "three-piece", price: 4200, salePrice: 3790, sizes: ["M","L","XL"], stock: 6, color: "#c9973b", shape: "dress", pattern: "lattice", image: "", featured: false, isNew: false,
    description: "Festive three piece with Jamdani-inspired motifs, gold zari border and organza dupatta. Perfect for Eid." },
  { id: 104, sku: "LW-3P-104", name: "Midnight Georgette Party Set", category: "three-piece", price: 3650, salePrice: null, sizes: ["M","L","XL","XXL"], stock: 9, color: "#2c3e6b", shape: "dress", pattern: "dots", image: "", featured: true, isNew: true,
    description: "Flowing georgette with sequin yoke, inner lining and soft net dupatta." },

  { id: 201, sku: "LW-KU-201", name: "Bloom Printed Cotton Kurti", category: "kurti", price: 1150, salePrice: 950, sizes: ["S","M","L","XL"], stock: 30, color: "#e07a5f", shape: "kurti", pattern: "floral", image: "", featured: true, isNew: false,
    description: "Everyday A-line kurti in pure cotton with block-print florals and three-quarter sleeves." },
  { id: 202, sku: "LW-KU-202", name: "Indigo Handblock Kurti", category: "kurti", price: 1350, salePrice: null, sizes: ["M","L","XL"], stock: 14, color: "#3d5a99", shape: "kurti", pattern: "stripe", image: "", featured: true, isNew: true,
    description: "Hand block-printed indigo kurti with side slits and wooden buttons." },
  { id: 203, sku: "LW-KU-203", name: "Ivory Chikankari Tunic", category: "kurti", price: 1890, salePrice: 1650, sizes: ["S","M","L","XL","XXL"], stock: 8, color: "#d8cbb3", shape: "kurti", pattern: "lattice", image: "", featured: false, isNew: false,
    description: "Lightweight ivory tunic with delicate chikankari-style thread work." },

  { id: 301, sku: "LW-AB-301", name: "Classic Black Nida Abaya", category: "abaya", price: 2650, salePrice: null, sizes: ["52","54","56","58"], stock: 18, color: "#1f1f24", shape: "abaya", pattern: "plain", image: "", featured: true, isNew: false,
    description: "Premium Dubai nida fabric abaya, wrinkle-free, with matching hijab. Sizes are length in inches." },
  { id: 302, sku: "LW-AB-302", name: "Mocha Butterfly Abaya", category: "abaya", price: 2990, salePrice: 2590, sizes: ["52","54","56"], stock: 7, color: "#7a5c4f", shape: "abaya", pattern: "plain", image: "", featured: false, isNew: true,
    description: "Butterfly-cut abaya in soft mocha crepe with lace cuff detailing." },
  { id: 303, sku: "LW-AB-303", name: "Pearl Grey Front-Open Borka", category: "abaya", price: 3200, salePrice: null, sizes: ["54","56","58"], stock: 5, color: "#9aa0a6", shape: "abaya", pattern: "dots", image: "", featured: false, isNew: false,
    description: "Front-open borka with pearl-button placket and a pocket. Easy to wear over any outfit." },

  { id: 401, sku: "LW-HJ-401", name: "Premium Jersey Hijab", category: "hijab", price: 450, salePrice: 390, sizes: ["Free Size"], stock: 60, color: "#c38d9e", shape: "hijab", pattern: "plain", image: "", featured: true, isNew: false,
    description: "Stretchy, breathable jersey hijab that stays in place all day. Many colours available." },
  { id: 402, sku: "LW-HJ-402", name: "Chiffon Ombre Scarf", category: "hijab", price: 550, salePrice: null, sizes: ["Free Size"], stock: 40, color: "#8e7dbe", shape: "hijab", pattern: "stripe", image: "", featured: false, isNew: true,
    description: "Lightweight chiffon scarf with an ombre fade. Ideal for parties and daily wear." },

  { id: 501, sku: "LW-SR-501", name: "Tangail Cotton Saree", category: "saree", price: 2400, salePrice: 2150, sizes: ["Free Size"], stock: 10, color: "#d1495b", shape: "saree", pattern: "check", image: "", featured: true, isNew: false,
    description: "Traditional Tangail handloom cotton saree with contrast anchal. Blouse piece included." },
  { id: 502, sku: "LW-SR-502", name: "Emerald Silk Katan Saree", category: "saree", price: 5800, salePrice: null, sizes: ["Free Size"], stock: 3, color: "#1b7f5f", shape: "saree", pattern: "paisley", image: "", featured: false, isNew: true,
    description: "Rich silk katan saree with woven golden buti, for weddings and special occasions." },

  { id: 601, sku: "LW-KD-601", name: "Little Princess Frock", category: "kids", price: 1050, salePrice: 890, sizes: ["2-3Y","4-5Y","6-7Y","8-9Y"], stock: 15, color: "#f2a65a", shape: "kids", pattern: "dots", image: "", featured: false, isNew: true,
    description: "Twirly cotton frock with lace trim and soft lining for little ones." },
  { id: 602, sku: "LW-KD-602", name: "Mini Eid Three Piece", category: "kids", price: 1450, salePrice: null, sizes: ["4-5Y","6-7Y","8-9Y","10-11Y"], stock: 0, color: "#6a8caf", shape: "kids", pattern: "paisley", image: "", featured: false, isNew: false,
    description: "Mother-daughter matching festive set for girls. Currently out of stock — ask on Messenger for restock." }
];

/* Store settings — edit to match the real business. Mirrors WooCommerce shipping/payment setup. */
window.STORE = {
  name: "Libas Wafia",
  tagline: "Elegance in every thread",
  currency: "৳",
  phone: "01875-511222",
  email: "libaswafia@gmail.com",
  location: "Bashundhara, Dhaka",
  whatsapp: "8801875511222",      // assumed same as phone — confirm
  facebook: "https://www.facebook.com/libaswafia",
  messenger: "https://m.me/libaswafia",
  shipping: [
    { id: "inside_dhaka", label: "Inside Dhaka", cost: 70 },
    { id: "outside_dhaka", label: "Outside Dhaka", cost: 130 }
  ],
  freeShippingOver: 5000,
  payments: [
    { id: "cod", label: "Cash on Delivery", note: "Pay when you receive the parcel." },
    { id: "bkash", label: "bKash", note: "Send money to 01875-511222 and enter the Transaction ID (TrxID)." },
    { id: "nagad", label: "Nagad", note: "Send money to 01875-511222 and enter the Transaction ID (TrxID)." }
  ],
  coupons: { "WAFIA10": { type: "percent", amount: 10 }, "EID200": { type: "fixed", amount: 200, min: 2000 } }
};
