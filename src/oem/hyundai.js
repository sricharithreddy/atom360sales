/* Hyundai — OEM config for the Autoprism Hyundai (Autoprism Motors) demo: Hyundai passenger cars.

   Same shape as ./river.js (see ./README.md). "Autoprism Hyundai" / "Autoprism Motors" is a FICTIONAL
   dealer group. The catalogue (models, variants, prices, colours) comes from the Hyundai India
   catalogue sheet via ./hyundaiCatalogue.js; everything marked "demo assumption" is illustrative
   sample data, not Hyundai's or any dealer's real numbers.

   Locations, stock and leads live in src/data/ (hyundaiLocations.js and the OEM-aware generators). */

import { HYUNDAI_MODELS } from "./hyundaiCatalogue.js";

/* Per-model extras: token amount at booking (demo assumption, typical Hyundai dealer tokens) and the
   cars a lost lead most often goes to. */
const MODEL_EXTRAS = {
  "Creta": { bookingAmount: 25000, competitors: ["Kia Seltos", "Maruti Suzuki Grand Vitara", "Toyota Urban Cruiser Hyryder", "Mahindra XUV 3XO", "Honda Elevate"] },
  "Venue": { bookingAmount: 21000, competitors: ["Maruti Suzuki Brezza", "Tata Nexon", "Kia Sonet", "Mahindra XUV 3XO"] },
  "Exter": { bookingAmount: 11000, competitors: ["Tata Punch", "Maruti Suzuki Fronx", "Nissan Magnite", "Renault Kiger"] },
  "Grand i10 Nios": { bookingAmount: 11000, competitors: ["Maruti Suzuki Swift", "Tata Tiago", "Maruti Suzuki Wagon R"] },
  "i20": { bookingAmount: 11000, competitors: ["Maruti Suzuki Baleno", "Tata Altroz", "Toyota Glanza"] },
  "Aura": { bookingAmount: 11000, competitors: ["Maruti Suzuki Dzire", "Honda Amaze", "Tata Tigor"] },
  "Verna": { bookingAmount: 21000, competitors: ["Honda City", "Skoda Slavia", "Volkswagen Virtus", "Maruti Suzuki Ciaz"] },
  "Alcazar": { bookingAmount: 25000, competitors: ["Mahindra XUV700", "Tata Safari", "Kia Carens", "Toyota Innova Crysta"] },
  "Creta Electric": { bookingAmount: 25000, competitors: ["Tata Nexon EV", "Mahindra BE 6", "MG ZS EV", "Tata Curvv EV"] },
  "Venue N Line": { bookingAmount: 21000, competitors: ["Kia Sonet", "Tata Nexon", "Maruti Suzuki Brezza"] },
  "Creta N Line": { bookingAmount: 25000, competitors: ["Kia Seltos", "Volkswagen Taigun", "Skoda Kushaq"] },
  "i20 N Line": { bookingAmount: 21000, competitors: ["Tata Altroz", "Maruti Suzuki Fronx", "Maruti Suzuki Baleno"] },
  "Ioniq 5": { bookingAmount: 100000, competitors: ["BYD Atto 3", "Kia EV6", "BMW iX1"] },
  "Prime HB": { bookingAmount: 11000, competitors: ["Maruti Suzuki Wagon R Tour", "Tata Tiago"] },
  "Prime SD": { bookingAmount: 11000, competitors: ["Maruti Suzuki Dzire Tour S", "Tata Tigor"] },
};

const hyundai = {
  key: "hyundai",
  brand: "Hyundai",
  oemName: "Hyundai Motor India",
  category: "Cars",
  vehicleNoun: "car",
  vehicleNounPlural: "cars",
  testNoun: "test drive",
  testNounPlural: "test drives",
  testVerb: "drive",
  ev: false,                             // the range is mostly ICE; Creta Electric / Ioniq 5 have fuel "Electric"

  dealerGroup: "Autoprism Hyundai (Autoprism Motors)",
  dealerShort: "Autoprism Hyundai",      // the name showrooms carry ("Autoprism Hyundai — Kondapur")
  dealerParent: "Autoprism Motors",
  hq: "Hyderabad",
  pickerDealer: "Autoprism Hyundai",       // dealer as the shell's OEM picker names it
  outletCount: 36,
  statesLine: "Telangana, Andhra Pradesh & Karnataka",
  shellNote: "Demo dealer: Autoprism Hyundai (Autoprism Motors, fictional) — Hyundai cars, 36 showrooms and workshops across Telangana, Andhra Pradesh & Karnataka.",

  /* ---- Catalogue (15 models, 119 variants) ---- */
  models: HYUNDAI_MODELS.map(m => ({ ...m, ...MODEL_EXTRAS[m.name] })),

  /* On-road price pieces — demo assumptions for a Telangana registration (individual owner):
     life tax by ex-showroom slab, EVs exempt (Telangana EV policy); first-year comprehensive insurance
     ≈ 3.2% of ex-showroom; registration + number plates + FASTag + hypothecation ≈ ₹3,500;
     TCS 1% above ₹10 L. */
  priceSheet: {
    roadTaxSlabs: [[500000, 0.13], [1000000, 0.14], [2000000, 0.17], [Infinity, 0.18]],
    evRoadTax: 0,
    insurancePct: 0.032,
    registration: 3500,
    tcsAbove: 1000000, tcsPct: 0.01,
    handling: 0,
    accessoryFitment: 0,
  },
  subsidy: null,
  bookingAmount: 21000,                  // default when a model has none
  discount: { typical: [10000, 60000], cap: 25000 },   // cash + exchange + corporate; manager approves above cap
  /* Dealer margin: FADA has repeatedly put Indian passenger-vehicle dealer margins at roughly 3–5% of
     ex-showroom (well below the 6–7% common abroad). The demo uses 4.0%, the middle of that range. */
  dealerMarginPct: 4.0,
  loanRange: [800000, 2000000],          // in-house car loan amount, ₹ (≈ ₹8–20 L)

  /* Warranty / protection — demo prices (assumption). Hyundai's standard warranty is 3 yr / unlimited km. */
  protectionPlans: [
    { key: "standard", name: "Standard warranty", price: 0, desc: "3 yr / unlimited km" },
    { key: "ew4", name: "Extended warranty 4 yr", label: "Extended warranty (4th year)", price: 8900, desc: "4 yr / 80,000 km" },
    { key: "ew5", name: "Extended warranty 5 yr", label: "Extended warranty (5th year)", price: 13900, desc: "5 yr / 1,00,000 km" },
    { key: "sot", name: "Shield of Trust", label: "Shield of Trust (3-yr maintenance)", price: 18500, desc: "Scheduled service parts + labour, 3 yr" },
    { key: "rsa", name: "Roadside assistance", label: "RSA (5 yr)", price: 2950, desc: "24×7 towing, flat tyre, fuel" },
  ],

  /* Genuine-accessory style list with demo prices (₹, assumption). */
  accessories: [
    { key: "mats_3d", label: "3D Floor Mats", amount: 3490 },
    { key: "seat_leather", label: "Seat Covers (Leatherette)", amount: 8500 },
    { key: "mud_flaps", label: "Mud Flaps (set of 4)", amount: 950 },
    { key: "door_visor", label: "Door Visors", amount: 2200 },
    { key: "side_moulding", label: "Body Side Moulding", amount: 2400 },
    { key: "scuff_plates", label: "Illuminated Scuff Plates", amount: 2900 },
    { key: "dash_cam", label: "Dash Camera", amount: 7900 },
    { key: "car_cover", label: "Car Cover", amount: 1800 },
    { key: "sunroof_deflector", label: "Sunroof Wind Deflector", amount: 2200 },
    { key: "ambient_light", label: "Ambient Lighting Kit", amount: 4500 },
    { key: "wireless_charger", label: "Wireless Phone Charger", amount: 5500 },
    { key: "tyre_inflator", label: "Tyre Inflator", amount: 2950 },
    { key: "trunk_organiser", label: "Boot Organiser", amount: 1950 },
    { key: "chrome_garnish", label: "Chrome Garnish Kit", amount: 3200 },
    { key: "parking_sensor", label: "Front Parking Sensors", amount: 4200 },
    { key: "seat_organiser", label: "Back-seat Organiser", amount: 1250 },
  ],

  /* Insurer / lender split — DEMO ASSUMPTIONS for a Hyundai dealer group, not real volumes.
     share = group share %, f = avg premium / loan factor, anchor = [min,max] share at every outlet. */
  insurers: [
    { name: "ICICI Lombard", share: 28, f: 1.02, anchor: [0.22, 0.34] },
    { name: "Bajaj Allianz", share: 20, f: 0.99 }, { name: "HDFC ERGO", share: 17, f: 1.03 },
    { name: "TATA AIG", share: 14, f: 1.0 }, { name: "New India Assurance", share: 10, f: 0.96 },
    { name: "Royal Sundaram", share: 6, f: 0.98 }, { name: "Go Digit", share: 5, f: 0.95 },
  ],
  insurancePremiumRange: [26000, 42000],
  lenders: [
    { name: "HDFC Bank", share: 26, f: 1.02, anchor: [0.2, 0.32] },
    { name: "ICICI Bank", share: 18, f: 1.03 }, { name: "State Bank of India", share: 17, f: 0.98 },
    { name: "Axis Bank", share: 12, f: 1.0 }, { name: "Kotak Mahindra Prime", share: 10, f: 1.01 },
    { name: "Hyundai Capital India", share: 9, f: 1.04 }, { name: "IndusInd Bank", share: 8, f: 0.97 },
  ],

  competitors: ["Kia Seltos", "Maruti Suzuki Brezza", "Tata Nexon", "Maruti Suzuki Grand Vitara", "Tata Punch", "Mahindra XUV 3XO", "Honda City", "Toyota Urban Cruiser Hyryder", "Maruti Suzuki Swift", "Maruti Suzuki Baleno"],
  competitorBrands: ["Maruti Suzuki", "Tata Motors", "Mahindra", "Kia", "Toyota", "Honda"],
  leadSources: ["Walk-in", "Website", "Hyundai Click to Buy", "Referral", "CarDekho", "CarWale", "Google Ad", "Facebook Ad", "Instagram Ad", "Justdial", "OLX", "Corporate/Fleet"],
  lostReasons: ["Not reachable", "Price / budget", "Bought competitor", "Postponed purchase", "Finance rejected", "Long waiting period", "Low exchange value", "Other"],
  exchangeVehicles: ["Maruti Suzuki Swift", "Maruti Suzuki Wagon R", "Maruti Suzuki Alto 800", "Maruti Suzuki Dzire", "Hyundai i10", "Hyundai Grand i10", "Hyundai i20", "Honda City", "Honda Amaze", "Toyota Etios", "Renault Kwid", "Tata Tiago", "Mahindra Bolero"],
  exchangeNoun: "old car",
  exchangeValueRange: [150000, 650000],

  /* Network sizing (CEO login + inventory generator) — demo assumptions. A Hyundai outlet retails
     ~40–150 cars a month; leads run ~10–15× retail. */
  network: {
    formats: {
      Flagship: { label: "Flagship", desc: "3S flagship: large showroom + full workshop" },
      Store: { label: "Showroom", desc: "3S showroom + workshop" },
      Express: { label: "City showroom", desc: "Sales only; service at the nearest workshop" },
    },
    retailBase: { Flagship: 140, Store: 80, Express: 40 },
    seRange: { Flagship: [12, 16], Store: [7, 10], Express: [3, 5] },
    monthlyTarget: 2800,
    stockBase: { Flagship: 160, Store: 85, Express: 35 },   // ≈ 4–5 weeks of sales
    demoUnits: { Flagship: 6, Store: 4, Express: 2 },
    leadsPerRetail: [10, 15],
  },

  dot: "#002C5F",
};

export default hyundai;
