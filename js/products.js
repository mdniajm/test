/*
 * ===== EDIT YOUR SHOP HERE =====
 * Prices are SAMPLE prices in Taka (BDT). Change "price" / "oldPrice" to your real prices.
 * To add a product: copy one block, give it a new unique "id", and put its photo in /images.
 */
window.SHOP = {
  name: "Sharif Telecom",
  nameBn: "শরীফ টেলিকম",
  brand: "SHARIF TEL",
  whatsapp: "8801850499052",          // country code + number, no + or spaces
  messenger: "61589741544696",        // Facebook page ID (or username)
  phone: "+880 1850-499052",
  email: "mksagor5566@gmail.com",
  address: "শরীফ টেলিকম, বাবুগঞ্জ বাজার, সদর রোড, বাবুগঞ্জ, বরিশাল ৮২১০",
  facebook: "https://www.facebook.com/profile.php?id=61589741544696",
  deliveryInside: 60,   // delivery charge inside Barishal (BDT)
  deliveryOutside: 120  // delivery charge outside Barishal (BDT)
};

window.PRODUCTS = [
  {
    id: "s127-27w-charger",
    name: "SHARIF TEL 27W Super VOOC Charger",
    nameBn: "শরীফ টেল ২৭W সুপার-ফাস্ট চার্জার",
    model: "S-127 Auto ID",
    category: "Charger",
    price: 550,
    oldPrice: 650,
    image: "images/charger-27w.jpg",
    badge: "New",
    short: "27W super-fast charging with Auto-ID that detects your phone and delivers the right power.",
    features: [
      "27W Super VOOC & super-fast charging",
      "Auto-ID smart chip – safe for every phone",
      "Multi-protocol: VOOC, Dash, Warp, Super Dart",
      "Full protection: over-heat, over-charge, short-circuit",
      "6 months warranty"
    ],
    variants: null
  },
  {
    id: "super-vooc-21w-charger",
    name: "SHARIF TEL 21W Super VOOC Charger",
    nameBn: "শরীফ টেল ২১W সুপার ভুক চার্জার",
    model: "21W Adapter",
    category: "Charger",
    price: 450,
    oldPrice: 520,
    image: "images/charger-21w.jpg",
    badge: "Best seller",
    short: "Fast, reliable 21W Super VOOC charger with auto-ID technology and long-lasting build.",
    features: [
      "21W Super VOOC fast charging",
      "Auto-ID technology",
      "Multi-protocol support",
      "Durable premium build",
      "6 months warranty"
    ],
    variants: null
  },
  {
    id: "spower-stc01-5w-charger",
    name: "SHARIF TEL S.Power 5W Charger",
    nameBn: "শরীফ টেল এস.পাওয়ার ৫W চার্জার",
    model: "STC-01",
    category: "Charger",
    price: 250,
    oldPrice: 300,
    image: "images/charger-5w.jpg",
    badge: null,
    short: "Compact 5W quick charger for button & feature phones with micro connector.",
    features: [
      "5W max quick charging",
      "Micro connector compatibility",
      "Two-colour charging signal light",
      "Quick-charging smart kit",
      "6 months warranty"
    ],
    variants: null
  },
  {
    id: "sc02g-80w-cable",
    name: "SHARIF TEL 80W Fast Charge & Data Cable",
    nameBn: "শরীফ টেল ৮০W ফাস্ট চার্জ ডাটা কেবল",
    model: "SC02G",
    category: "Cable",
    price: 220,
    oldPrice: 280,
    image: "images/cable-80w.jpg",
    badge: null,
    short: "Pure-copper 1 metre cable, 10–80W fast charging and high-speed data transfer.",
    features: [
      "10–80W fast charging, 3x faster",
      "Pure copper core",
      "Full protocol: Super VOOC, Super Dart, Flash, Turbo",
      "1 metre, tangle-free flat cable",
      "6 months warranty"
    ],
    variants: ["Micro USB", "Type-C", "Lightning", "C to C"]
  }
];
