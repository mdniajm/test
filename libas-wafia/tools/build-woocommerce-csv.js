#!/usr/bin/env node
/* Generates woocommerce/products.csv from js/products.js for
 * WooCommerce → Products → Import (built-in CSV importer).
 * Multi-size items become variable products with one variation per size;
 * single-size items become simple products.
 * Usage: node tools/build-woocommerce-csv.js [https://your-site.com/wp-content/uploads/products/]
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const root = path.join(__dirname, "..");
const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, "js/products.js"), "utf8"), ctx);
const { PRODUCTS, CATEGORIES } = ctx.window;
const imageBase = process.argv[2] || "";

const cols = ["Type", "SKU", "Parent", "Name", "Published", "Is featured?", "Visibility in catalog",
  "Short description", "Description", "Tax status", "In stock?", "Stock", "Backorders allowed?",
  "Regular price", "Sale price", "Categories", "Tags", "Images",
  "Attribute 1 name", "Attribute 1 value(s)", "Attribute 1 visible", "Attribute 1 global", "Attribute 1 default"];
const q = v => { v = v == null ? "" : String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
const cat = slug => (CATEGORIES.find(c => c.slug === slug) || {}).name || slug;
const img = p => p.image ? (/^https?:/.test(p.image) ? p.image : imageBase + path.basename(p.image)) : "";

const rows = [];
for (const p of PRODUCTS) {
  const variable = p.sizes.length > 1;
  const base = {
    "SKU": p.sku, "Name": p.name, "Published": 1, "Is featured?": p.featured ? 1 : 0,
    "Visibility in catalog": "visible", "Short description": p.description, "Description": p.description,
    "Tax status": "none", "In stock?": p.stock > 0 ? 1 : 0, "Stock": p.stock, "Backorders allowed?": 0,
    "Categories": cat(p.category), "Tags": p.isNew ? "New Arrival" : "", "Images": img(p),
    "Attribute 1 name": "Size", "Attribute 1 value(s)": p.sizes.join(", "),
    "Attribute 1 visible": 1, "Attribute 1 global": 1
  };
  if (!variable) {
    rows.push({ ...base, Type: "simple", "Regular price": p.price, "Sale price": p.salePrice || "" });
    continue;
  }
  // stock is managed on the parent; variations inherit it
  rows.push({ ...base, Type: "variable", "Attribute 1 default": p.sizes[0] });
  for (const s of p.sizes) {
    rows.push({
      Type: "variation", SKU: `${p.sku}-${s}`, Parent: p.sku, Name: `${p.name} - ${s}`, Published: 1,
      "Tax status": "none", "In stock?": p.stock > 0 ? 1 : 0,
      "Regular price": p.price, "Sale price": p.salePrice || "",
      "Attribute 1 name": "Size", "Attribute 1 value(s)": s, "Attribute 1 global": 1
    });
  }
}
const out = path.join(root, "woocommerce/products.csv");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, "﻿" + [cols.join(","), ...rows.map(r => cols.map(c => q(r[c])).join(","))].join("\n") + "\n");
console.log(`Wrote ${rows.length} rows (${PRODUCTS.length} products) to ${path.relative(process.cwd(), out)}`);
