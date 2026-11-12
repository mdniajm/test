# Libas Wafia — Online Store

Storefront for **Libas Wafia**, a women's clothing store in Bashundhara, Dhaka
([Facebook](https://www.facebook.com/libaswafia) · 01875-511222 · libaswafia@gmail.com).

This folder has two parts:

1. **A working storefront prototype** (plain HTML/CSS/JS, no build step). You can open it today, show it to customers and test the full shopping flow.
2. **A WooCommerce migration kit.** The same products, prices, delivery rules and payment methods are set up to move to WordPress + WooCommerce.

## Run it

```bash
cd libas-wafia
python3 -m http.server 8000     # then open http://localhost:8000
```

On GitHub Pages it is served at `/libas-wafia/`.

## What works now

| Feature | Notes |
|---|---|
| Home page | Hero, category tiles, bestsellers, promo banner, new arrivals |
| Shop | Category filter, search, price range, in-stock filter, sorting |
| Product page | Size picker, quantity, stock status, sale badge, related items, "Ask on WhatsApp" |
| Cart drawer | Change quantity, remove items, free-delivery progress, "Order on WhatsApp" |
| Wishlist | Saved in the browser |
| Checkout | BD phone validation, district, delivery zone (Inside / Outside Dhaka), COD / bKash / Nagad with TrxID, coupons (`WAFIA10`, `EID200`) |
| Order confirmation | Order number, status timeline, one-tap "Send order on WhatsApp" |
| Track order | Looks up orders placed on this device |
| Pages | About, Contact, Delivery & Returns |
| Mobile | Fully responsive, slide-out menu |

> The prototype has no server. Orders are saved only in the customer's browser, and the shop finds out about them through the WhatsApp button. Real order handling arrives with WooCommerce.

## Things to replace with real content

All of this lives in **`js/products.js`**:

- **Products**: names, prices, sizes, stock and descriptions are **placeholders**. Replace them with the real items from the Facebook page.
- **Photos**: put images in `assets/products/` and set `image: "assets/products/xyz.jpg"`. Products without an image show a drawn placeholder.
- **WhatsApp number**: assumed to be the same as the phone (8801875511222). Confirm it.
- **bKash / Nagad numbers**: currently the shop phone.
- **Delivery charges**: currently ৳70 / ৳130, free over ৳5,000.
- **Coupons**.

## Moving to WordPress + WooCommerce

See **[WOOCOMMERCE.md](WOOCOMMERCE.md)** for the step-by-step guide.
`woocommerce/products.csv` is ready for the WooCommerce product importer. Regenerate it after you edit products:

```bash
node tools/build-woocommerce-csv.js https://yourdomain.com/wp-content/uploads/products/
```

## Files

```
libas-wafia/
├── index.html                 page shell (header, footer, cart drawer)
├── css/style.css              all styling; brand colours at the top (:root)
├── js/products.js             products, categories, store settings  ← edit this
├── js/app.js                  routing, cart, checkout, orders
├── assets/logo.jpg            brand logo
├── tools/build-woocommerce-csv.js
├── woocommerce/products.csv   import file for WooCommerce
└── WOOCOMMERCE.md             migration guide
```
