/* Epic River inventory — the ONE source of stock for every login.

   Stock is held per outlet as River Indie units by variant × colour × age bucket, as of the
   demo's "today" (19 Nov 2026). It is deterministic (seeded per outlet), so every login and
   every reload sees the same numbers.

   Sizing: about three weeks of the outlet's expected sales — Flagship ≈ 100 units, Store ≈ 45,
   Express ≈ 15 — scaled down for outlets still ramping up (open < 6 months). Older, larger
   outlets carry a little more aged stock.

   The Telecaller, Sales Executive and Manager logins work Epic River's two Pune stores,
   Aundh (L014) and Shivaji Nagar (L015); they must show exactly stockFor("L014") /
   stockFor("L015"). The CEO login aggregates all 100.                                        */

import { LOCATIONS, monthsOpen } from "./epicRiverLocations.js";

export const INVENTORY_AS_OF = "2026-11-19";

export const VARIANTS = [
  { key: "750W", exShowroom: 154799 },
  { key: "480W", exShowroom: 150799 },
];
export const COLOURS = ["Monsoon Blue", "Summer Red", "Spring Yellow", "Winter White", "Storm Grey"];
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
  VARIANTS.forEach((v, vi) => COLOURS.forEach((c, ci) => combos.push({
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

/** Units of one variant × colour at an outlet (0 if none). */
export function unitsOf(locId, variant, colour) {
  const l = stockFor(locId).lines.find(x => x.variant === variant && x.colour === colour);
  return l ? l.units : 0;
}

/** Ids of the two stores the Telecaller / Sales Executive / Manager logins work. */
export const PUNE_STORES = { Aundh: "L014", "Shivaji Nagar": "L015" };
