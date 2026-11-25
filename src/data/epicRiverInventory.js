/* Epic River inventory — the ONE source of stock for every login.

   Stock is held per outlet as River Indie units by variant × colour × age bucket, as of the
   demo's "today" (19 Nov 2026). It is deterministic (seeded per outlet), so every login and
   every reload sees the same numbers.

   Sizing: about three weeks of the outlet's expected sales — Flagship ≈ 100 units, Store ≈ 45,
   Express ≈ 15 — scaled down for outlets still ramping up (open < 6 months). Older, larger
   outlets carry a little more aged stock.

   The Telecaller, Sales Executive and Manager logins work Epic River's two Pune stores,
   Aundh (L014) and Shivaji Nagar (L015); they must show exactly stockFor("L014") /
   stockFor("L015"). The CEO login aggregates all 100.

   OEM-aware (src/oem): with ?oem=hyundai the same exports describe Autoprism Hyundai's 36 outlets
   — Hyundai cars by model × variant × colour × age bucket, sized from OEM.network.stockBase
   (Flagship ≈ 160, Showroom ≈ 85, City showroom ≈ 35 cars; ≈ 4–5 weeks of sales). Hyundai lines
   also carry `model` and `key` ("Creta SX MT Petrol"), and only lines with units > 0 are listed. The two
   demo showrooms are again L014 / L015 (Kondapur, Banjara Hills). River output is unchanged.     */

import { LOCATIONS, monthsOpen } from "./epicRiverLocations.js";
import { OEM, IS_HYUNDAI } from "../oem/index.js";

export const INVENTORY_AS_OF = "2026-11-19";

const RIVER_VARIANTS = [
  { key: "750W", exShowroom: 154799 },
  { key: "480W", exShowroom: 150799 },
];
const RIVER_COLOURS = ["Monsoon Blue", "Summer Red", "Spring Yellow", "Winter White", "Storm Grey"];
/** Stock variants for the active OEM.
 *  River: [{ key: "750W", exShowroom }].  Hyundai: one row per model × variant,
 *  [{ key: "Creta SX MT Petrol", model: "Creta", variant: "SX MT Petrol", exShowroom }] in catalogue order. */
export const STOCK_VARIANTS = IS_HYUNDAI
  ? OEM.models.flatMap(m => m.variants.map(v => ({ key: `${m.name} ${v.name}`, model: m.name, variant: v.name, exShowroom: v.exShowroom })))
  : RIVER_VARIANTS;
/** Stock colour names for the active OEM. Hyundai: every colour in the catalogue (each model / variant
 *  offers a subset — see OEM.models[].colours and variant.colours). */
export const STOCK_COLOURS = IS_HYUNDAI
  ? [...new Set(OEM.models.flatMap(m => m.colours.map(c => c.name)))]
  : RIVER_COLOURS;
/** @deprecated LEGACY, RIVER-ONLY in every OEM — kept only so apps not yet converted to the OEM switch
 *  (which index River-only maps by these names) still load with ?oem=hyundai. Use STOCK_VARIANTS /
 *  STOCK_COLOURS; remove these once no app imports them. */
export const VARIANTS = RIVER_VARIANTS;
/** @deprecated see VARIANTS. */
export const COLOURS = RIVER_COLOURS;
/** Model names stocked (River: ["Indie"]). */
export const MODELS = OEM.models.map(m => m.name);
export const AGE_BUCKETS = ["0–30 days", "31–60 days", "61–90 days", "90+ days"];

const BASE_UNITS = { Flagship: 100, Store: 45, Express: 15 };
const DEMO_UNITS = { Flagship: 3, Store: 2, Express: 1 };
// Colour popularity (share of stock before per-outlet noise).
const COLOUR_W = [0.27, 0.18, 0.14, 0.25, 0.16];

function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function rng(seed) {
  let a = hash(seed);
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// Split an integer total across weights so the parts sum exactly to the total.
function splitInt(total, weights) {
  const sum = weights.reduce((a, b) => a + b, 0) || 1;
  const raw = weights.map(w => (total * w) / sum);
  const out = raw.map(Math.floor);
  let left = total - out.reduce((a, b) => a + b, 0);
  raw.map((v, i) => [v - Math.floor(v), i]).sort((a, b) => b[0] - a[0]).forEach(([, i]) => { if (left > 0) { out[i]++; left--; } });
  return out;
}

const CACHE = new Map();

/** Stock at one outlet.
 *  Returns { locId, total, value, aged90, demo, lines: [{ variant, colour, exShowroom, units, buckets:[4] }] } */
export function stockFor(locId) {
  if (CACHE.has(locId)) return CACHE.get(locId);
  if (IS_HYUNDAI) { const h = hyundaiStockFor(locId); CACHE.set(locId, h); return h; }
  const loc = LOCATIONS.find(l => l.id === locId);
  if (!loc) throw new Error(`Unknown location ${locId}`);
  const r = rng("inv:" + locId);
  const months = monthsOpen(loc);
  const ramp = months >= 6 ? 1 : 0.45 + 0.09 * Math.max(0, months);
  const total = Math.max(4, Math.round(BASE_UNITS[loc.format] * ramp * (0.8 + r() * 0.4)));
  // Older outlets carry more aged stock.
  const ageW = months >= 12 ? [0.5, 0.27, 0.13, 0.1] : months >= 6 ? [0.58, 0.26, 0.1, 0.06] : [0.72, 0.22, 0.06, 0];
  const mix750 = 0.62 + r() * 0.16;
  const combos = [];
  RIVER_VARIANTS.forEach((v, vi) => RIVER_COLOURS.forEach((c, ci) => combos.push({
    variant: v.key, colour: c, exShowroom: v.exShowroom,
    w: (vi === 0 ? mix750 : 1 - mix750) * COLOUR_W[ci] * (0.5 + r()),
  })));
  const units = splitInt(total, combos.map(c => c.w));
  const lines = combos.map((c, k) => ({
    variant: c.variant, colour: c.colour, exShowroom: c.exShowroom, units: units[k],
    buckets: splitInt(units[k], ageW.map(p => p * (0.6 + r() * 0.8))),
  }));
  const out = {
    locId, total,
    value: lines.reduce((s, l) => s + l.units * l.exShowroom, 0),
    aged90: lines.reduce((s, l) => s + l.buckets[3], 0),
    demo: DEMO_UNITS[loc.format],
    lines,
  };
  CACHE.set(locId, out);
  return out;
}

/** Units of one variant × colour at an outlet (0 if none).
 *  Hyundai: `variant` is the variant name with `model` given ("SX MT Petrol", colour, "Creta"), or the full
 *  key ("Creta SX MT Petrol"). Without a model, a bare variant name sums across models that share it. */
export function unitsOf(locId, variant, colour, model) {
  if (IS_HYUNDAI) {
    return stockFor(locId).lines
      .filter(x => x.colour === colour && (x.key === variant || (x.variant === variant && (!model || x.model === model))))
      .reduce((n, x) => n + x.units, 0);
  }
  const l = stockFor(locId).lines.find(x => x.variant === variant && x.colour === colour);
  return l ? l.units : 0;
}

/** Ids of the two stores the Telecaller / Sales Executive / Manager logins work.
 *  (Name kept for compatibility — with ?oem=hyundai these are the two Hyderabad showrooms.) */
export const PUNE_STORES = IS_HYUNDAI ? { Kondapur: "L014", "Banjara Hills": "L015" } : { Aundh: "L014", "Shivaji Nagar": "L015" };
/** Same as PUNE_STORES, OEM-neutral name. */
export const DEMO_STORES = PUNE_STORES;

/* ---------------- Hyundai stock ----------------
   total by format × ramp × noise → split across models (catalogue weight × noise; Ioniq 5 only at
   Flagships, fleet Prime models not at Express) → each model's units across up to 6 variants →
   each variant's units across up to 4 of its colours → age buckets. Every split is exact. */
function topK(weights, k, r) {
  const idx = weights.map((w, i) => [w * (0.5 + r()), i]).sort((a, b) => b[0] - a[0]).slice(0, k).map(([, i]) => i);
  return weights.map((w, i) => (idx.includes(i) ? w : 0));
}
// Each car drawn into an age bucket on its own (lines are small, so a proportional split would
// almost never reach the 90+ bucket).
function ageUnits(n, w, r) {
  const out = [0, 0, 0, 0], t = w.reduce((a, b) => a + b, 0);
  for (let k = 0; k < n; k++) { let x = r() * t, b = 0; while (b < 3 && (x -= w[b]) > 0) b++; out[b]++; }
  return out;
}
function hyundaiStockFor(locId) {
  const loc = LOCATIONS.find(l => l.id === locId);
  if (!loc) throw new Error(`Unknown location ${locId}`);
  const net = OEM.network;
  const r = rng("hinv:" + locId);
  const months = monthsOpen(loc);
  const ramp = months >= 6 ? 1 : 0.45 + 0.09 * Math.max(0, months);
  const total = Math.max(8, Math.round(net.stockBase[loc.format] * ramp * (0.85 + r() * 0.3)));
  const ageW = months >= 12 ? [0.55, 0.25, 0.12, 0.08] : months >= 6 ? [0.62, 0.24, 0.1, 0.04] : [0.74, 0.21, 0.05, 0];
  const modelW = OEM.models.map(m => {
    if (m.name === "Ioniq 5" && loc.format !== "Flagship") return 0;
    if (m.name.startsWith("Prime") && loc.format === "Express") return 0;
    return m.weight * (0.7 + r() * 0.6);
  });
  const perModel = splitInt(total, modelW);
  const lines = [];
  OEM.models.forEach((m, mi) => {
    if (!perModel[mi]) return;
    const vW = topK(m.variants.map(v => v.weight), Math.min(6, Math.max(1, Math.ceil(perModel[mi] / 4))), r);
    const perVar = splitInt(perModel[mi], vW);
    m.variants.forEach((v, vi) => {
      if (!perVar[vi]) return;
      const cols = m.colours.filter(c => v.colours.includes(c.name));
      const cW = topK(cols.map(c => c.weight), Math.min(4, Math.max(1, Math.ceil(perVar[vi] / 2))), r);
      const perCol = splitInt(perVar[vi], cW);
      cols.forEach((c, ci) => {
        if (!perCol[ci]) return;
        lines.push({
          model: m.name, variant: v.name, key: `${m.name} ${v.name}`, colour: c.name, exShowroom: v.exShowroom, units: perCol[ci],
          buckets: ageUnits(perCol[ci], ageW, r),
        });
      });
    });
  });
  return {
    locId, total,
    value: lines.reduce((s, l) => s + l.units * l.exShowroom, 0),
    aged90: lines.reduce((s, l) => s + l.buckets[3], 0),
    demo: net.demoUnits[loc.format],
    lines,
  };
}
