/* River — OEM config for the Epic River (Raam Group) demo: River Indie electric scooters.

   Same shape as ./hyundai.js (see ./README.md). Values here are the ones the River demo already
   uses (apps, src/data/*) gathered in one place; the River demo's output must not change, so treat
   every number as frozen unless the River demo itself is meant to change.

   Locations, stock and leads are NOT in this file — they live in src/data/ (epicRiverLocations.js,
   epicRiverInventory.js, epicRiverLeads.js), which pick the active OEM. `network` below only holds the
   sizing numbers those generators and the CEO login use.                                           */

const river = {
  key: "river",
  brand: "River",                       // the OEM brand as customers say it
  oemName: "River Mobility",            // the manufacturer
  category: "Electric scooters",        // one-liner for the OEM picker
  vehicleNoun: "scooter",
  vehicleNounPlural: "scooters",
  testNoun: "test ride",
  testNounPlural: "test rides",
  testVerb: "ride",                     // "take a test ride" / "book the ride"
  ev: true,

  dealerGroup: "Epic River (Raam Group)",
  dealerShort: "Epic River",            // the name stores carry ("Epic River — Kukatpally")
  dealerParent: "Raam Group",
  hq: "Hyderabad",
  pickerDealer: "Epic River (Raam Group)", // dealer as the shell's OEM picker names it
  outletCount: 100,
  statesLine: "Telangana, Andhra, Maharashtra, Tamil Nadu & Karnataka",
  shellNote: "Demo dealer: Epic River (Raam Group) — River Indie electric scooters, 100 outlets across Telangana, Andhra, Maharashtra, Tamil Nadu & Karnataka.",

  /* ---- Catalogue ----
     One model; variants are the two chargers. exShowroom is AFTER the PM E-DRIVE subsidy (what the
     stock and CEO numbers use); listPrice is before it (River's Maharashtra price sheet, Sep 2026). */
  models: [
    {
      name: "Indie", bodyType: "Electric scooter", weight: 1, bookingAmount: 2500,
      variants: [
        { name: "750W", detailed: "Indie · 750W portable charger (0–80% in ~5 h)", fuel: "Electric", engine: "4 kWh", transmission: "Automatic",
          exShowroom: 154799, listPrice: 159799, colours: ["Monsoon Blue", "Summer Red", "Spring Yellow", "Winter White", "Storm Grey"], weight: 0.7 },
        { name: "480W", detailed: "Indie · 480W portable charger (full charge in ~8 h)", fuel: "Electric", engine: "4 kWh", transmission: "Automatic",
          exShowroom: 150799, listPrice: 155799, colours: ["Monsoon Blue", "Summer Red", "Spring Yellow", "Winter White", "Storm Grey"], weight: 0.3 },
      ],
      colours: [
        { name: "Monsoon Blue", hex: "#2F5BA8", type: "Monotone", dualTone: false, matte: false, knight: false, weight: 0.27 },
        { name: "Summer Red", hex: "#C8352E", type: "Monotone", dualTone: false, matte: false, knight: false, weight: 0.18 },
        { name: "Spring Yellow", hex: "#E9B800", type: "Monotone", dualTone: false, matte: false, knight: false, weight: 0.14 },
        { name: "Winter White", hex: "#F4F4F0", type: "Monotone", dualTone: false, matte: false, knight: false, weight: 0.25 },
        { name: "Storm Grey", hex: "#6B7280", type: "Monotone", dualTone: false, matte: false, knight: false, weight: 0.16 },
      ],
      competitors: ["Ather Rizta", "Ola S1 Pro", "TVS iQube", "Bajaj Chetak", "Hero Vida V2"],
    },
  ],

  /* On-road price pieces (River's price sheet). */
  priceSheet: { insurance: 10889, rto: 1060, tcsAbove: null, handling: 0, accessoryFitment: 118 },
  subsidy: { name: "PM E-DRIVE", amount: 5000 },
  bookingAmount: 2500,
  discount: { typical: [1000, 5000], cap: 2500 },          // per-unit cap above which the manager approves
  dealerMarginPct: 4.5,                                     // FADA's 2W range; the CEO login's default
  loanRange: [120000, 148000],                              // in-house loan amount, ₹

  /* River Care plans (bundled into the "variant" label in leads: "750W + Plus Two"). */
  protectionPlans: [
    { key: "standard", name: "Standard", price: 0, desc: "5-yr battery warranty" },
    { key: "plus2", name: "Plus Two", label: "River Care Plus Two", price: 5899, desc: "5-yr warranty" },
    { key: "plus5", name: "Plus Five", label: "River Care Plus Five", price: 9912, desc: "8-yr warranty" },
  ],

  /* Official River accessory prices (₹). */
  accessories: [
    { key: "side_step", label: "Side Step", amount: 1449 },
    { key: "grab_rail", label: "Tubular Grab Rail", amount: 1199 },
    { key: "back_rest", label: "Back Rest", amount: 2199 },
    { key: "visor_clear", label: "Visor (Clear)", amount: 1499 },
    { key: "visor_tinted", label: "Visor (Tinted)", amount: 1499 },
    { key: "pannier_cover", label: "Pannier Slot Cover", amount: 799 },
    { key: "top_rack", label: "Top Rack", amount: 1599 },
    { key: "collar_bag", label: "Collar Bag", amount: 1599 },
    { key: "mount_open", label: "Open Mobile Mount", amount: 1399 },
    { key: "mount_wp", label: "Weatherproof Mobile Mount", amount: 1999 },
    { key: "charger_holder", label: "Single Socket Charger Holder", amount: 1499 },
    { key: "cover", label: "Vehicle Cover", amount: 559 },
    { key: "mat_pop", label: "Pop Floor Mat", amount: 799 },
    { key: "mat_black", label: "All Black Floor Mat", amount: 549 },
    { key: "seat_pop", label: "Pop Seat Cover", amount: 999 },
    { key: "seat_dual", label: "Dual-Tone Seat Cover", amount: 699 },
    { key: "helmet_open", label: "Open Face Helmet", amount: 1499 },
    { key: "helmet_full", label: "Full-face Helmet", amount: 1999 },
  ],

  /* Insurer / lender split — ILLUSTRATIVE ONLY (same numbers as the CEO login).
     share = group share %, f = avg premium / loan factor, anchor = [min,max] share at every outlet. */
  insurers: [
    { name: "TATA AIG", share: 80, f: 1.01, anchor: [0.72, 0.88] },
    { name: "ICICI Lombard", share: 6.5, f: 1.02 }, { name: "Bajaj Allianz", share: 5.1, f: 0.99 },
    { name: "HDFC ERGO", share: 4.2, f: 1.035 }, { name: "Go Digit", share: 2.8, f: 0.965 },
    { name: "Royal Sundaram", share: 1.4, f: 0.98 },
  ],
  insurancePremiumRange: [10350, 11450],
  lenders: [
    { name: "evfin (Greaves Finance)", share: 30, f: 1.02, anchor: [0.22, 0.38] },
    { name: "IDFC FIRST Bank", share: 18, f: 1.0 }, { name: "HDFC Bank", share: 16, f: 1.04 },
    { name: "Kotak Mahindra Bank", share: 13, f: 1.01 }, { name: "Shriram Finance", share: 13, f: 0.955 },
    { name: "Muthoot Capital", share: 10, f: 0.965 },
  ],

  competitors: ["Ather Rizta", "Ola S1 Pro", "TVS iQube", "Bajaj Chetak", "Hero Vida V2"],
  competitorBrands: ["Ather", "Ola Electric", "TVS", "Bajaj", "Hero Vida"],
  leadSources: ["Walk-in", "Website", "Referral", "BikeDekho", "BikeWale", "Google Ad", "Facebook Ad", "Instagram Ad", "Justdial", "OLX", "Corporate/Fleet"],
  lostReasons: ["Not reachable", "Price / budget", "Bought competitor", "Postponed purchase", "Finance rejected", "Charging / range concern", "Long delivery wait", "Low exchange value", "Other"],
  exchangeVehicles: ["Honda Activa 5G", "Honda Activa 6G", "TVS Jupiter", "Suzuki Access 125", "Hero Splendor Plus", "Bajaj Pulsar 150", "TVS Ntorq", "Hero Pleasure"],
  exchangeNoun: "petrol scooter",                          // "exchange of an old petrol scooter"
  exchangeValueRange: [10000, 45000],

  /* Network sizing (CEO login + inventory generator). */
  network: {
    formats: {
      Flagship: { label: "Flagship", desc: "≈3,000 sq ft store" },
      Store: { label: "Store", desc: "≈900 sq ft, River's standard" },
      Express: { label: "Express", desc: "≈400 sq ft" },
    },
    retailBase: { Flagship: 140, Store: 68, Express: 28 },  // mature monthly retail target per outlet
    seRange: { Flagship: [13, 15], Store: [7, 9], Express: [3, 5] },
    monthlyTarget: 5900,                                    // group, Nov 2026
    stockBase: { Flagship: 100, Store: 45, Express: 15 },   // ≈ three weeks of sales
    demoUnits: { Flagship: 3, Store: 2, Express: 1 },
    leadsPerRetail: [6, 9],                                 // demo assumption (not used by River today)
  },

  /* Picker swatch (dot only — never a logo). */
  dot: "#F5B800",
};

export default river;
