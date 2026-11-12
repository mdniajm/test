# Moving Libas Wafia to WordPress + WooCommerce

The prototype's settings map one-to-one to WooCommerce. Follow these steps in order.

## 1. Hosting & WordPress

- Get a domain (for example `libaswafia.com` or `.com.bd`) and hosting with **PHP 8.1+, MySQL 8, SSL**. Most BD hosts (ExonHost, XeonBD, Hostinger) offer one-click WordPress.
- Install WordPress. Then set **Settings → General**: Site title `Libas Wafia`, Timezone `Dhaka`.
- **Settings → Permalinks**: choose "Post name".

## 2. Plugins

| Plugin | Why |
|---|---|
| **WooCommerce** | The store |
| **Bangladeshi Payment Gateways** (or the official bKash / Nagad merchant plugins once you have merchant accounts) | bKash / Nagad with a TrxID field |
| **Click to Chat** (WhatsApp) | Floating WhatsApp button and "Order on WhatsApp" on products |
| **TI WooCommerce Wishlist** | Wishlist |
| **Advanced Shipment Tracking** or **Orders Tracking for WooCommerce** | Order tracking page |
| **Rank Math** or **Yoast SEO** | SEO |
| **Facebook for WooCommerce** | Syncs the catalogue to your Facebook Shop and Pixel |
| **LiteSpeed Cache** / **WP Super Cache** | Speed |

## 3. Theme

Use a lightweight, WooCommerce-ready theme: **Astra**, **Kadence** or **Blocksy** (all free).
Match the prototype's look under **Appearance → Customize**:

| Setting | Value |
|---|---|
| Primary / accent colour | `#E8192C` (logo red) |
| Hover colour | `#B80F1F` |
| Background | `#FCFAF8` |
| Text | `#2A1D22` |
| Headings font | Cormorant Garamond |
| Body font | Inter (plus Hind Siliguri for Bangla) |
| Logo | `assets/logo.jpg` |
| Footer background | `#1F1A1B` |

Rebuild the home page in the block editor (or Kadence / Spectra blocks) with the same sections: hero → 4 perks → category tiles → featured products → promo banner → new arrivals.

## 4. WooCommerce settings

**WooCommerce → Settings → General**
- Store address: Bashundhara, Dhaka, Bangladesh
- Selling location: Bangladesh only
- Currency: **Bangladeshi taka (৳)**, 0 decimals

**Shipping → Zones**
| Zone | Region | Method |
|---|---|---|
| Inside Dhaka | Bangladesh → Dhaka (state) | Flat rate ৳70 + Free shipping (min ৳5,000) |
| Outside Dhaka | Bangladesh | Flat rate ৳130 + Free shipping (min ৳5,000) |

**Payments**
- Enable **Cash on delivery**.
- Configure the bKash / Nagad plugin with your number (01875-511222). Turn on the transaction ID field.

**Accounts & Privacy**: allow guest checkout. Most BD customers won't create accounts.

**Checkout fields**: to match the prototype (name, phone, district, area, address), use **Checkout Field Editor for WooCommerce**. Make Phone required and Email optional, and remove Company and Postcode.

**Coupons** (Marketing → Coupons)
- `WAFIA10`: Percentage discount, 10
- `EID200`: Fixed cart discount ৳200, minimum spend ৳2,000

## 5. Import products

1. **Products → Attributes**: add the attribute **Size** (slug `size`).
2. **Products → Categories**: create Three Piece, Kurti & Tops, Abaya & Borka, Hijab & Scarf, Saree, Kids. The importer can also create them automatically.
3. Upload product photos to **Media** (or by FTP to `wp-content/uploads/products/`). Then regenerate the CSV with the image URL prefix:
   ```bash
   node tools/build-woocommerce-csv.js https://yourdomain.com/wp-content/uploads/products/
   ```
4. **Products → All Products → Import** → choose `woocommerce/products.csv` → Run.
   - Multi-size items import as **variable products** with one variation per size. Stock is managed on the parent.
   - Free Size items import as **simple products**.

## 6. Pages & menus

WooCommerce creates Shop, Cart, Checkout and My Account. Create these as well:
- **About**, **Contact** and **Delivery & Returns** (copy the text from the prototype pages)
- **Track Order** (shortcode from the tracking plugin)

Main menu: Home · Shop (with the categories as a submenu) · Track Order · About · Contact.

## 7. Before launch

- [ ] Replace placeholder products with the real catalogue and photos
- [ ] Place test orders with COD and bKash
- [ ] Set up order emails (WooCommerce → Settings → Emails) to libaswafia@gmail.com
- [ ] Connect Facebook for WooCommerce and add the site link to the Facebook page's button
- [ ] Optional: courier integration (Steadfast, Pathao or RedX plugins) for automatic parcel booking
