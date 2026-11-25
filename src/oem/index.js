/* OEM switch — which brand the demo is running as (Hyundai | River). See ./README.md.

   The active OEM is decided once, at module load, from:
     1. `?oem=` in this page's URL (the showcase shell puts it on every iframe src),
     2. else localStorage["ap.oem"] (the shell's last choice),
     3. else "river" (so the live demo is unchanged by default).
   Switching OEM always reloads the app pages (the shell remounts its iframes), so `OEM` is a plain
   constant — no React context needed.                                                              */

import river from "./river.js";
import hyundai from "./hyundai.js";

export const OEMS = { hyundai, river };
export const OEM_KEYS = ["hyundai", "river"];          // picker order
export const DEFAULT_OEM = "river";
export const OEM_STORAGE_KEY = "ap.oem";

export const isOemKey = (k) => OEM_KEYS.includes(k);

/** The OEM key for this page: ?oem= → localStorage["ap.oem"] → "river". Safe outside a browser. */
export function currentOemKey() {
  try {
    const q = new URLSearchParams(globalThis.window?.location?.search || "").get("oem");
    if (isOemKey(q)) return q;
  } catch { /* no URL */ }
  try {
    const s = globalThis.localStorage?.getItem(OEM_STORAGE_KEY);
    if (isOemKey(s)) return s;
  } catch { /* storage blocked */ }
  return DEFAULT_OEM;
}

/** Remember a choice for pages opened without ?oem= (the shell calls this on switch). */
export function storeOemKey(key) {
  try { if (isOemKey(key)) globalThis.localStorage?.setItem(OEM_STORAGE_KEY, key); } catch { /* ignore */ }
}

/** `url` with ?oem=<key> set (keeps other params and the #hash). */
export function withOem(url, key = OEM_KEY) {
  const [pathQ, hash] = url.split("#");
  const [path, q] = pathQ.split("?");
  const p = new URLSearchParams(q || "");
  p.set("oem", key);
  return `${path}?${p.toString()}${hash != null ? "#" + hash : ""}`;
}

export const OEM_KEY = currentOemKey();
/** The active OEM config (see river.js / hyundai.js for the shape). */
export const OEM = OEMS[OEM_KEY];
export const IS_HYUNDAI = OEM_KEY === "hyundai";
export const IS_RIVER = OEM_KEY === "river";

/* ---------------- Words ---------------- */
export const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
/** "Test Drive" — every word capitalised. */
export const title = (s) => (s ? s.replace(/\b\w/g, (c) => c.toUpperCase()) : s);

export const VEHICLE = OEM.vehicleNoun;                    // "car" / "scooter"
export const VEHICLES = OEM.vehicleNounPlural;             // "cars" / "scooters"
export const Vehicle = cap(VEHICLE);                       // "Car" / "Scooter"
export const Vehicles = cap(VEHICLES);                     // "Cars" / "Scooters"
export const testNoun = OEM.testNoun;                      // "test drive" / "test ride"
export const testNounPlural = OEM.testNounPlural;          // "test drives" / "test rides"
export const TestNoun = cap(testNoun);                     // "Test drive" / "Test ride"
export const TestNounPlural = cap(testNounPlural);         // "Test drives" / "Test rides"
export const TEST_TITLE = title(testNoun);                 // "Test Drive" / "Test Ride"
export const BRAND = OEM.brand;                            // "Hyundai" / "River"
export const DEALER = OEM.dealerShort;                     // "Autoprism Hyundai" / "Epic River"
export const DEALER_GROUP = OEM.dealerGroup;               // "Autoprism Hyundai (Autoprism Motors)" / "Epic River (Raam Group)"

/** "1 car" / "3 cars" (Indian digit grouping). */
export function fmtVehicle(n, oem = OEM) {
  const v = Math.round(n || 0);
  return `${v.toLocaleString("en-IN")} ${v === 1 ? oem.vehicleNoun : oem.vehicleNounPlural}`;
}
/** Just the noun for a count: vehicleWord(1) → "car", vehicleWord(3) → "cars". */
export const vehicleWord = (n, oem = OEM) => (Math.round(n) === 1 ? oem.vehicleNoun : oem.vehicleNounPlural);

/* ---------------- Money ---------------- */
/** ₹ in lakh: fmtLakh(1504400) → "₹15.04 L"; fmtLakh(154799, 1) → "₹1.5 L". */
export const fmtLakh = (n, d = 2) => (Number.isFinite(n) ? `₹${(n / 1e5).toFixed(d)} L` : "—");
export const fmtINR = (n) => (Number.isFinite(n) ? `₹${Math.round(n).toLocaleString("en-IN")}` : "—");

/* ---------------- Catalogue lookups ---------------- */
export const MODELS = OEM.models;
export const MODEL_NAMES = OEM.models.map((m) => m.name);
export const findModel = (name, oem = OEM) => oem.models.find((m) => m.name === name) || null;
/** Variant by model + variant name; `variantName` may also be the full "Creta SX MT Petrol" style label. */
export function findVariant(modelName, variantName, oem = OEM) {
  const m = findModel(modelName, oem);
  if (!m) return null;
  return m.variants.find((v) => v.name === variantName || `${m.name} ${v.name}` === variantName) || null;
}
export const findColour = (modelName, colourName, oem = OEM) =>
  (findModel(modelName, oem)?.colours || []).find((c) => c.name === colourName) || null;
/** Ex-showroom ₹ for a model + variant (null if unknown). */
export const priceOf = (modelName, variantName, oem = OEM) => findVariant(modelName, variantName, oem)?.exShowroom ?? null;
/** { min, max } ex-showroom ₹ across a model's variants. */
export function priceRange(model, oem = OEM) {
  const m = typeof model === "string" ? findModel(model, oem) : model;
  const p = (m?.variants || []).map((v) => v.exShowroom);
  return p.length ? { min: Math.min(...p), max: Math.max(...p) } : { min: null, max: null };
}
/** Colour objects offered on one variant (falls back to all the model's colours). */
export function coloursOf(model, variant, oem = OEM) {
  const m = typeof model === "string" ? findModel(model, oem) : model;
  if (!m) return [];
  const v = typeof variant === "string" ? m.variants.find((x) => x.name === variant) : variant;
  return v?.colours ? m.colours.filter((c) => v.colours.includes(c.name)) : m.colours;
}
/** "#hex" for a colour name (searches every model), grey if unknown. */
export function colourHex(colourName, oem = OEM) {
  for (const m of oem.models) { const c = m.colours.find((x) => x.name === colourName); if (c) return c.hex; }
  return "#9AA0AE";
}
/** Booking token for a model (falls back to the OEM default). */
export const bookingAmountOf = (modelName, oem = OEM) => findModel(modelName, oem)?.bookingAmount ?? oem.bookingAmount;
export const competitorsOf = (modelName, oem = OEM) => findModel(modelName, oem)?.competitors || oem.competitors;

/** Estimated on-road price for a model + variant from OEM.priceSheet.
 *  River: ex-showroom (after subsidy) + insurance + RTO. Hyundai: + road tax slab + insurance % +
 *  registration + TCS above ₹10 L. Returns { exShowroom, roadTax, insurance, registration, tcs, total }. */
export function onRoadPrice(modelName, variantName, oem = OEM) {
  const v = findVariant(modelName, variantName, oem);
  if (!v) return null;
  const ps = oem.priceSheet, ex = v.exShowroom;
  if (ps.roadTaxSlabs) {
    const rate = v.fuel === "Electric" ? ps.evRoadTax : ps.roadTaxSlabs.find(([upTo]) => ex <= upTo)[1];
    const roadTax = Math.round(ex * rate), insurance = Math.round(ex * ps.insurancePct);
    const tcs = ex > ps.tcsAbove ? Math.round(ex * ps.tcsPct) : 0;
    return { exShowroom: ex, roadTax, insurance, registration: ps.registration, tcs, total: ex + roadTax + insurance + ps.registration + tcs };
  }
  return { exShowroom: ex, roadTax: ps.rto, insurance: ps.insurance, registration: 0, tcs: 0, total: ex + ps.rto + ps.insurance };
}

/* ---------------- Deterministic picks ----------------
   `seed` is a string / number (hashed) or an rng function returning [0,1). Same seed → same pick. */
function hash(s) { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function unit(seed) {
  if (typeof seed === "function") return seed();
  let a = hash(seed);
  a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
/** Weighted pick from items with a `weight` (missing weight = 1). */
export function pickWeighted(items, seed) {
  const w = items.map((x) => (x.weight == null ? 1 : x.weight));
  let x = unit(seed) * w.reduce((s, v) => s + v, 0);
  for (let i = 0; i < items.length; i++) { if ((x -= w[i]) <= 0) return items[i]; }
  return items[items.length - 1];
}
/** A model, weighted by sales mix: pickModel("lead:12").name → "Creta". */
export const pickModel = (seed, oem = OEM) => pickWeighted(oem.models, seed);
/** A variant of a model (object or name), weighted toward mid trims. */
export function pickVariant(model, seed, oem = OEM) {
  const m = typeof model === "string" ? findModel(model, oem) : model;
  return pickWeighted(m.variants, seed);
}
/** A colour offered on that variant (or the model), weighted by popularity. */
export const pickColour = (model, variant, seed, oem = OEM) => pickWeighted(coloursOf(model, variant, oem), seed);
/** { model, variant, colour } objects in one go — pickVehicle("se-demo-3"). */
export function pickVehicle(seed, oem = OEM) {
  const s = typeof seed === "function" ? seed : String(seed);
  const model = pickModel(typeof s === "function" ? s : s + ":m", oem);
  const variant = pickVariant(model, typeof s === "function" ? s : s + ":v", oem);
  const colour = pickColour(model, variant, typeof s === "function" ? s : s + ":c", oem);
  return { model, variant, colour };
}
