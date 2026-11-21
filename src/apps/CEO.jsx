import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  ChevronDown, ChevronLeft, ChevronRight, FileText, IndianRupee, Landmark, MapPin, Menu, Package, Phone, Plus,
  Filter, Settings, ShieldCheck, ShoppingBag, Store, Target, Upload, User, UserX,
} from "lucide-react";
import { GROUP, ZONES, LOCATIONS, monthsOpen } from "../data/epicRiverLocations.js";
import { stockFor, VARIANTS, COLOURS } from "../data/epicRiverInventory.js";
import { MetricBox, MetricGrid } from "../ui/MetricGlass.jsx";

/* ==================================================================================
   AUTOPRISM — CEO (Epic River, Raam Group)

   Same design language as the Manager login: one idea per card, one compact table that
   expands in place. The CEO sees 100 outlets and ~1,000 people.

   Every number is summed from Sales Executives, so a parent row always equals the sum of
   its children — in the People tree and in the Locations tree alike — and every ratio
   (achievement, ₹/unit, accessories/unit, River Care attach) is computed from summed
   numerators and denominators, never an average of averages.
   ================================================================================== */

const C = {
  bg: "#F3F4F9", card: "#FFFFFF", border: "#E7EAF3", borderStrong: "#D5DAE8",
  ink: "#0B1946", sub: "#4F5A7D", faint: "#6B7596", ghost: "#AEB4CB",
  primary: "#3B4BE8", primarySoft: "rgba(59,75,232,0.09)",
  hot: "#E53935", hotSoft: "rgba(229,57,53,0.08)",
  warm: "#F59E0B", warmSoft: "rgba(245,158,11,0.10)",
  green: "#2E7D32", greenSoft: "rgba(46,125,50,0.09)",
  purple: "#6D28D9", teal: "#00695C",
};
const F = "'Inter', -apple-system, system-ui, sans-serif";
const shadow = "0 1px 3px rgba(0,0,0,0.07), 0 6px 18px rgba(0,0,0,0.075)";

/* ---------------- Formatting (Indian units) ---------------- */
const ok = (x) => x != null && Number.isFinite(x);
const nIN = (n) => (ok(n) ? Math.round(n).toLocaleString("en-IN") : "—");
const rs = (n) => (ok(n) ? `₹${nIN(n)}` : "—");
const inr = (n) => !ok(n) ? "—"
  : Math.abs(n) >= 1e9 ? `₹${Math.round(n / 1e7)} Cr`
  : Math.abs(n) >= 1e7 ? `₹${(n / 1e7).toFixed(2)} Cr`
  : Math.abs(n) >= 1e5 ? `₹${(n / 1e5).toFixed(1)} L`
  : rs(n);
const lakh = (n) => (ok(n) ? `₹${(n / 1e5).toFixed(2)} L` : "—");
const pctS = (x, d = 0) => (ok(x) ? `${(x * 100).toFixed(d)}%` : "—");
const div = (a, b) => (b ? a / b : null);
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const monthLabel = (ym) => { const [y, m] = ym.split("-").map(Number); return `${MONTHS[m - 1]} ${y}`; };

/* ---------------- Deterministic randomness ---------------- */
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
const rngFor = (s) => mulberry32(hashStr(s));
const rr = (r, a, b) => a + r() * (b - a);
const ri = (r, a, b) => Math.floor(a + r() * (b - a + 1));
// Split an integer total across weights so the parts are integers that add back exactly.
function splitInt(total, weights) {
  const W = weights.reduce((a, b) => a + b, 0) || 1;
  const raw = weights.map(w => (total * w) / W);
  const out = raw.map(Math.floor);
  let rem = total - out.reduce((a, b) => a + b, 0);
  raw.map((v, i) => [v - Math.floor(v), i]).sort((a, b) => b[0] - a[0]).forEach(([, i]) => { if (rem > 0) { out[i]++; rem--; } });
  return out;
}

/* ---------------- Calendar: "today" is 19 Nov 2026, month to date ---------------- */
const MI = (y, m) => y * 12 + m - 1;
const NOW_MI = MI(2026, 11);
const DAY = 19, MONTH_DAYS = 30;
const PERIOD_LINE = `Nov 2026 · MTD · day ${DAY} of ${MONTH_DAYS}`;

/* ---------------- Product ---------------- */
const P750 = 154799, P480 = 150799;   // ex-showroom after PM E-DRIVE subsidy
const RC_PLUS2 = 5899, RC_PLUS5 = 9912;   // River Care packs
const ONROAD_750 = 166748, ONROAD_480 = 162748;   // on-road price, the base for loan-to-value

/* ---------------- Network: 100 outlets, as-is from the dataset ---------------- */
const ZONE_LABEL = Object.fromEntries(ZONES.map(z => [z.key, z.label]));
const STATE_ABBR = { Telangana: "TG", "Andhra Pradesh": "AP", Maharashtra: "MH", "Tamil Nadu": "TN", Karnataka: "KA" };
const FORMAT_BASE = { Flagship: 140, Store: 68, Express: 28 };   // mature monthly retail target
const SE_RANGE = { Flagship: [13, 15], Store: [7, 9], Express: [3, 5] };
const ramp = (m) => (m < 0 ? 0 : Math.min(1, 0.6 + (0.4 * (m + 1)) / 12));

const LOCS = LOCATIONS.map(l => {
  const [y, m] = l.opened.split("-").map(Number);
  const mo = monthsOpen(l);
  return { ...l, openMi: MI(y, m), mo, isNew: mo < 12, ses: [] };
});
const LOC_BY_ID = Object.fromEntries(LOCS.map(l => [l.id, l]));
(() => {
  // Plan status mix ≈ 60 / 25 / 15 — shuffled deterministically across outlets.
  const r = rngFor("status-v1");
  const idx = LOCS.map((_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
  idx.forEach((li, k) => { LOCS[li].plan = k < 60 ? "on" : k < 85 ? "risk" : "off"; });
  LOCS.forEach(l => {
    const q = rngFor("loc:" + l.id);
    l.scale = rr(q, 0.9, 1.12);
    l.factor = l.plan === "on" ? rr(q, 0.99, 1.18) : l.plan === "risk" ? rr(q, 0.845, 0.925) : rr(q, 0.56, 0.76);
    l.conv = l.plan === "off" ? rr(q, 0.12, 0.18) : rr(q, 0.16, 0.27);
    l.dpsF = l.plan === "off" ? rr(q, 0.85, 1.4) : rr(q, 0.55, 1.12);
    // The first four draws are no longer used (the F&I model below has its own seed); they stay
    // so the draws after them — model mix and booking rate — keep their values.
    q(); q(); q(); q();
    l.exch = rr(q, 0.07, 0.22); l.mix = rr(q, 0.6, 0.8);
    l.obRate = rr(q, 0.3, 0.6); l.tdr = rr(q, 0.32, 0.55); l.bkr = rr(q, 0.08, 0.24);
    l.avgPrice = l.mix * P750 + (1 - l.mix) * P480;
    // Finance & insurance (own seed). Outlet-level rates; per-SE numbers are split from them.
    const f = rngFor("fi4:" + l.id);
    l.fi = {
      ins: f() < 0.06 ? rr(f, 0.86, 0.895) : rr(f, 0.94, 0.985),       // in-house policies ÷ units
      prem: rr(f, 10350, 11450),                                       // ₹ per in-house policy
      any: rr(f, 0.39, 0.72),                                          // any finance (in-house + self-arranged) ÷ units
      share: rr(f, 0.67, 0.94),                                        // in-house ÷ all loans
      ltv: rr(f, 0.745, 0.88),                                         // loan ÷ on-road price
      acc: rr(f, 0.52, 0.88), bill: 1450 + 1950 * f() ** 1.5,          // accessory attach · ₹ per buyer
      rc: 0.095 + 0.27 * f() ** 1.3, p5: rr(f, 0.16, 0.42),            // River Care attach · Plus Five share
    };
    if (l.fi.any * l.fi.share > 0.64) l.fi.any = 0.64 / l.fi.share;   // in-house finance stays ≤ ~65% of units
  });
})();
// Calibrate so the group's full-month November target is ≈ 5,900 scooters.
const CAL = 5900 / LOCS.reduce((s, l) => s + FORMAT_BASE[l.format] * l.scale * ramp(NOW_MI - l.openMi), 0);
const tgtM = (l, mi) => FORMAT_BASE[l.format] * l.scale * ramp(mi - l.openMi) * CAL;

/* ---------------- People: one reporting line, ~1,000 people ---------------- */
const FIRST = ["Aarav", "Abhishek", "Aditi", "Ajay", "Akhil", "Amrutha", "Anand", "Anusha", "Arjun", "Bhavana", "Charan",
  "Deepak", "Divya", "Ganesh", "Harini", "Harsha", "Jyothi", "Karthik", "Kavya", "Kiran", "Lakshmi", "Madhav", "Mahesh",
  "Meghana", "Mohan", "Naveen", "Nikhil", "Pooja", "Pradeep", "Pranav", "Priya", "Rahul", "Rajesh", "Ramya", "Ravi",
  "Rohan", "Sai", "Sandeep", "Sanjana", "Santosh", "Shreya", "Sneha", "Srinivas", "Suresh", "Swathi", "Tejas", "Uday",
  "Varun", "Vidya", "Vinay", "Vishal", "Yamini", "Yash", "Faisal", "Imran", "Joseph", "Neha", "Omkar", "Ritika",
  "Sagar", "Tanvi", "Zoya", "Gautam", "Hema", "Irfan", "Keerthi", "Manoj", "Nandini", "Prakash", "Revathi"];
const LAST = {
  Telangana: ["Reddy", "Rao", "Goud", "Yadav", "Chary", "Naidu", "Varma", "Sharma", "Ali"],
  "Andhra Pradesh": ["Naidu", "Chowdary", "Raju", "Reddy", "Prasad", "Murthy", "Babu", "Varma"],
  Maharashtra: ["Patil", "Deshmukh", "Kulkarni", "Joshi", "Pawar", "Shinde", "Jadhav", "Gaikwad", "More"],
  "Tamil Nadu": ["Iyer", "Subramanian", "Krishnan", "Murugan", "Raman", "Pillai", "Selvam", "Natarajan"],
  Karnataka: ["Gowda", "Hegde", "Shetty", "Kamath", "Bhat", "Naik", "Rao", "Kulkarni"],
};
const personName = (state, seed) => {
  const r = rngFor("name:" + seed);
  const last = LAST[state] || LAST.Telangana;
  return `${FIRST[Math.floor(r() * FIRST.length)]} ${last[Math.floor(r() * last.length)]}`;
};

const NODES = {};
const SES = [];
let PID = 0;
function mkNode(role, name, parent, extra = {}) {
  const id = "P" + String(++PID).padStart(4, "0");
  const n = { id, role, name, parent: parent ? parent.id : null, kids: [], ses: [], ...extra };
  NODES[id] = n;
  if (parent) parent.kids.push(id);
  return n;
}
const CEO_NODE = mkNode("CEO", "Arvind Kesavan", null);
(() => {
  const zh = {};
  ZONES.forEach(z => { zh[z.key] = mkNode("ZH", personName(z.states[0], "zh" + z.key), CEO_NODE, { zone: z.key }); });
  const clusters = [...new Set(LOCS.map(l => l.cluster || ""))];
  clusters.forEach(c => {
    const ls = LOCS.filter(l => (l.cluster || "") === c);
    const am = mkNode("AM", personName(ls[0].state, "am" + c), zh[ls[0].zone], { cluster: c || "Unassigned" });
    const r = rngFor("sm:" + c);
    let i = 0;
    while (i < ls.length) {
      const a = ls[i];
      const sm = mkNode("SM", personName(a.state, "sm" + a.id), am, { locIds: [a.id] });
      a.smId = sm.id; i++;
      const b = ls[i];
      // Small outlets share a sales manager: an SM runs one or two locations.
      if (b && a.format !== "Flagship" && b.format !== "Flagship" && (a.format === "Express" || b.format === "Express") && r() < 0.75) {
        b.smId = sm.id; sm.locIds.push(b.id); i++;
      }
    }
  });
  LOCS.forEach(l => {
    const r = rngFor("team:" + l.id);
    const sm = NODES[l.smId];
    const n = ri(r, ...SE_RANGE[l.format]);
    let parents;
    if (l.format === "Express") parents = Array.from({ length: n }, () => sm);   // Express: SEs report straight to the SM
    else {
      const tl = Math.max(2, Math.ceil(n / (r() < 0.5 ? 4 : 3.5)));
      const tls = Array.from({ length: tl }, (_, k) => mkNode("TL", personName(l.state, "tl" + l.id + k), sm, { locId: l.id }));
      parents = Array.from({ length: n }, (_, k) => tls[k % tl]);
    }
    parents.forEach((p, k) => {
      const node = mkNode("SE", personName(l.state, "se" + l.id + k), p, { locId: l.id });
      const q = rngFor("se:" + node.id);
      const skill = Math.exp((q() - 0.5) * 0.9);
      const s = {
        idx: SES.length, id: node.id, node, loc: l,
        skill, tw: rr(q, 0.85, 1.15), s2: skill * rr(q, 0.8, 1.2),
        conv: l.conv * rr(q, 0.82, 1.18), tdr: l.tdr * rr(q, 0.85, 1.15), bkr: l.bkr * rr(q, 0.7, 1.3),
        dpsF: l.dpsF * rr(q, 0.85, 1.15), _1: q(), _2: q(), _3: q(), _4: q(),   // unused draws, kept for seed stability
        exch: l.exch * rr(q, 0.75, 1.25), mix: clamp(l.mix * rr(q, 0.9, 1.1), 0.4, 0.95),
      };
      // Nine per-SE noise draws for the F&I split (own seed).
      const q2 = rngFor("fi4:" + node.id);
      s.nz = Array.from({ length: 9 }, () => q2());
      node.seIdx = s.idx;
      SES.push(s);
      l.ses.push(s.idx);
    });
  });
  SES.forEach(s => { let n = s.node; while (n) { n.ses.push(s.idx); n = n.parent ? NODES[n.parent] : null; } });
})();
const ALL_SE = SES.map(s => s.idx);
const PEOPLE_COUNT = Object.keys(NODES).length;

/* ---------------- Per-SE numbers, November month to date ---------------- */
function nudge(A, T, plan) {
  // Rounding a small outlet's units can flip its status; keep each outlet in its planned band.
  const proj = (a) => (a * MONTH_DAYS) / DAY / T;
  for (let k = 0; k < 40 && T > 0; k++) {
    if (plan === "on" && proj(A) < 0.958) A++;
    else if (plan === "risk" && proj(A) >= 0.942) A--;
    else if (plan === "risk" && proj(A) < 0.81) A++;
    else if (plan === "off" && proj(A) >= 0.79) A--;
    else break;
  }
  return Math.max(0, A);
}
const KEYS = ["heads", "target", "retail", "book", "value",
  "ins", "insPrem", "loans", "fin", "loanAmt", "loanRoad", "accBuy", "acc", "rc", "p2", "p5", "rcVal"];
// Split an integer total across weights with a cap per part (part ≤ cap); integer parts that add back.
function splitCap(total, weights, caps) {
  const out = weights.map(() => 0);
  let left = Math.min(total, caps.reduce((a, b) => a + b, 0));
  let free = weights.map((_, i) => i).filter(i => caps[i] > 0);
  while (left > 0 && free.length) {
    const part = splitInt(left, free.map(i => weights[i]));
    free.forEach((i, k) => { out[i] += part[k]; });
    left = 0;
    free = free.filter(i => { if (out[i] >= caps[i]) { left += out[i] - caps[i]; out[i] = caps[i]; return false; } return true; });
  }
  return out;
}
// round(n × rate), kept inside the outlet's [lo, hi] band where an integer allows it (tiny outlets).
function within(n, rate, lo, hi) {
  const a = Math.ceil(n * lo - 1e-9), b = Math.floor(n * hi + 1e-9);
  return a <= b ? clamp(Math.round(n * rate), a, b) : Math.round(n * rate);
}
const SE_ROWS = (() => {
  const rows = new Array(SES.length);
  LOCS.forEach(l => {
    l.monthTarget = Math.round(tgtM(l, NOW_MI));
    l.mtd = nudge(Math.round(tgtM(l, NOW_MI) * l.factor * (DAY / MONTH_DAYS)), l.monthTarget, l.plan);
    const tA = splitInt(l.mtd, l.ses.map(i => SES[i].skill));
    const tT = splitInt(l.monthTarget, l.ses.map(i => SES[i].tw));
    // F&I: outlet totals from the outlet's rates, split across its SEs (weight = units × noise).
    const fi = l.fi, U = l.mtd, se = l.ses.map(i => SES[i]);
    const w = (j) => se.map((s, k) => tA[k] * (0.8 + 0.4 * s.nz[j]));
    const L = within(U, fi.any, 0.35, 0.75);
    const IN = within(L, fi.share, Math.max(0.65, (0.25 * U) / L || 0), Math.min(0.95, (0.65 * U) / L || 1));
    const PL = within(U, fi.rc, 0.08, 0.38);
    const pol = splitCap(within(U, fi.ins, 0.84, 0.99), w(0), tA);
    const loans = splitCap(L, w(1), tA);
    const inL = splitCap(IN, w(2), loans);
    const accB = splitCap(within(U, fi.acc, 0.5, 0.9), w(3), tA);
    const plans = splitCap(PL, w(4), tA);
    const p5s = splitCap(within(PL, fi.p5, 0.15, 0.45), w(5), plans);
    l.ses.forEach((i, k) => {
      const s = SES[i];
      const retail = tA[k];
      const r750 = Math.round(retail * s.mix);
      const n = inL[k], n750 = Math.round(n * s.mix);
      const road = n750 * ONROAD_750 + (n - n750) * ONROAD_480;
      const ltv = Math.min(0.9, fi.ltv * (0.98 + 0.04 * s.nz[7]));
      const p5 = p5s[k], p2 = plans[k] - p5;
      rows[i] = {
        heads: 1, target: tT[k], retail, book: retail + Math.round(retail * s.bkr),
        value: r750 * P750 + (retail - r750) * P480,
        ins: pol[k], insPrem: Math.round((pol[k] * fi.prem * (0.97 + 0.06 * s.nz[6])) / 10) * 10,
        loans: loans[k], fin: n, loanAmt: Math.round((road * ltv) / 1000) * 1000, loanRoad: road,
        accBuy: accB[k], acc: Math.round((accB[k] * fi.bill * (0.93 + 0.14 * s.nz[8])) / 10) * 10,
        rc: plans[k], p2, p5, rcVal: p2 * RC_PLUS2 + p5 * RC_PLUS5,
      };
    });
  });
  return rows;
})();
function sumIdx(idx) {
  const o = {}; KEYS.forEach(k => { o[k] = 0; });
  for (let j = 0; j < idx.length; j++) { const r = SE_ROWS[idx[j]]; for (let k = 0; k < KEYS.length; k++) o[KEYS[k]] += r[KEYS[k]]; }
  return o;
}
// Every ratio is Σnumerator ÷ Σdenominator. "Units" = retail units invoiced month to date.
function derive(a) {
  return {
    ...a,
    ach: div(a.retail, a.target),
    proj: (a.retail / DAY) * MONTH_DAYS,     // month projection at the current daily pace
    insPct: div(a.ins, a.retail), premAvg: div(a.insPrem, a.ins),
    finPct: div(a.fin, a.retail), finShare: div(a.fin, a.loans), anyFin: div(a.loans, a.retail),
    loanAvg: div(a.loanAmt, a.fin), ltv: div(a.loanAmt, a.loanRoad),
    accPct: div(a.accBuy, a.retail), accBill: div(a.acc, a.accBuy),
    rcPct: div(a.rc, a.retail), p5Sh: div(a.p5, a.rc),
    addPU: div(a.acc + a.rcVal, a.retail),
  };
}
const AGG = new Map();
const aggOf = (t) => { let a = AGG.get(t.key); if (!a) { a = derive(sumIdx(t.ses)); AGG.set(t.key, a); } return a; };
const GROUP_AGG = derive(sumIdx(ALL_SE));

/* ---------------- Insurer and finance-partner split (sample data) ----------------
   ILLUSTRATIVE ONLY. Insurers are typical dealer tie-ups for two-wheelers, not River's or Epic
   River's actual insurers. Lenders are evfin and its reported co-lending partners (see LENDERS).
   Every share, count and average below is sample data, not real volumes.
   Each outlet ties up with TATA AIG plus 1–3 other insurers, and evfin plus 2–4 other lenders.
   The mix leans by state (Royal Sundaram in Tamil Nadu, Go Digit in Karnataka / Telangana,
   Shriram in AP / TN districts, Muthoot in TN and districts); the non-anchor weights are
   calibrated to the target group mix. Every SE's in-house policies (`ins`, `insPrem`) and in-house
   loans (`fin`, `loanAmt`) are split across the outlet's companies as integers that add back
   exactly, so any scope's split sums to that scope's policies / loans / ₹. Avg premium and avg
   loan differ slightly by company (factor `f`) around the SE's own average. */
// TATA AIG is the anchor insurer: every outlet ties up with it and it writes ≈ 72–88% of the
// outlet's in-house policies (≈ 80% group); the other five share the rest by `mix` × state tilt.
const INSURERS = [
  { name: "TATA AIG", mix: 80, f: 1.01, anchor: [0.72, 0.88] },
  { name: "ICICI Lombard", mix: 6.5, f: 1.02 }, { name: "Bajaj Allianz", mix: 5.1, f: 0.99 },
  { name: "HDFC ERGO", mix: 4.2, f: 1.035 }, { name: "Go Digit", mix: 2.8, f: 0.965 },
  { name: "Royal Sundaram", mix: 1.4, f: 0.98 },
];
// Lenders: evfin (Greaves Finance, an EV two-wheeler NBFC with a public financing tie-up with River
// Mobility) and the institutions it is reported to co-lend with. The names are real; the SHARES are
// illustrative sample data, not actual volumes. evfin is the anchor: every outlet ties up with it
// (≈ 22–38% of the outlet's in-house loans, ≈ 30% group) plus 2–4 of the others.
const LENDERS = [
  { name: "evfin (Greaves Finance)", mix: 30, f: 1.02, anchor: [0.22, 0.38] },
  { name: "IDFC FIRST Bank", mix: 18, f: 1.0 }, { name: "HDFC Bank", mix: 16, f: 1.04 },
  { name: "Kotak Mahindra Bank", mix: 13, f: 1.01 }, { name: "Shriram Finance", mix: 13, f: 0.955 },
  { name: "Muthoot Capital", mix: 10, f: 0.965 },
];
const METROS = new Set(["Hyderabad", "Secunderabad", "Bengaluru", "Chennai", "Mumbai", "Navi Mumbai", "Thane", "Pune"]);
function partnerTilt(kind, name, l) {
  const metro = METROS.has(l.city);
  if (kind === "ins") {
    if (name === "Royal Sundaram") return l.state === "Tamil Nadu" ? 3.4 : 0.55;
    if (name === "Go Digit") return l.state === "Karnataka" || l.state === "Telangana" ? 1.9 : 0.7;
    return 1;
  }
  if (name === "Shriram Finance") return (l.state === "Andhra Pradesh" || l.state === "Tamil Nadu") && !metro ? 2.2 : metro ? 0.45 : 0.9;
  if (name === "Muthoot Capital") return l.state === "Tamil Nadu" ? (metro ? 1.5 : 2.2) : metro ? 0.55 : 1.4;
  return 1;
}
// `others`: how many companies besides the anchor an outlet ties up with.
const SPLIT_KINDS = { ins: { list: INSURERS, n: "ins", amt: "insPrem", unit: 10, others: [1, 3] },
  fin: { list: LENDERS, n: "fin", amt: "loanAmt", unit: 1000, others: [2, 4] } };
const SE_SPLIT = { ins: new Array(SES.length), fin: new Array(SES.length) };
(() => {
  Object.entries(SPLIT_KINDS).forEach(([kind, K]) => {
    const target = K.list.map(c => c.mix);
    let base = [...target];
    const outletW = (l) => {
      // Tie-ups: the anchor + K.others more, drawn without replacement by (base × state
      // tilt); then outlet weights. An anchor company takes a fixed share of the outlet.
      const r = rngFor(`tie:${kind}:${l.id}`);
      const a = K.list.findIndex(c => c.anchor);
      const k = a >= 0 ? 1 + ri(r, ...K.others) : ri(r, 3, 5);
      const pw = K.list.map((c, i) => (i === a ? 0 : base[i] * partnerTilt(kind, c.name, l)));
      const pick = new Set();
      if (a >= 0) pick.add(a);
      while (pick.size < k) {
        const free = pw.map((w, i) => (pick.has(i) ? 0 : w));
        let x = r() * free.reduce((a, b) => a + b, 0), j = 0;
        while (j < free.length - 1 && (x -= free[j]) > 0) j++;
        if (free[j] === 0) j = free.findIndex(w => w > 0);
        pick.add(j);
      }
      const w = pw.map((x, i) => (pick.has(i) && i !== a ? x * rr(r, 0.75, 1.3) : (r(), 0)));
      if (a < 0) return w;
      const t = rr(r, ...K.list[a].anchor), W = w.reduce((x, y) => x + y, 0);
      return w.map((x, i) => (i === a ? t : ((1 - t) * x) / W));
    };
    // Calibrate the base weights so the expected group mix lands on the target mix.
    for (let it = 0; it < 24; it++) {
      const tot = K.list.map(() => 0);
      LOCS.forEach(l => {
        const w = outletW(l), W = w.reduce((a, b) => a + b, 0), n = sumIdx(l.ses)[K.n];
        w.forEach((x, i) => { tot[i] += (n * x) / W; });
      });
      const T = tot.reduce((a, b) => a + b, 0), S = target.reduce((a, b) => a + b, 0);
      base = base.map((b, i) => (K.list[i].anchor ? b : b * Math.pow(target[i] / S / (tot[i] / T || 1e-3), 0.6)));
    }
    LOCS.forEach(l => {
      // Outlet counts per company first (so small per-SE counts don't skew the mix), then the
      // policies / loans are dealt out to the SEs in a shuffled order: both sums stay exact.
      const w = outletW(l);
      const cnt = splitInt(l.ses.reduce((a, i) => a + SE_ROWS[i][K.n], 0), w);
      const slots = cnt.flatMap((c, j) => Array(c).fill(j));
      const rs = rngFor(`deal:${kind}:${l.id}`);
      for (let x = slots.length - 1; x > 0; x--) { const y = Math.floor(rs() * (x + 1)); [slots[x], slots[y]] = [slots[y], slots[x]]; }
      let at = 0;
      l.ses.forEach(i => {
        const row = SE_ROWS[i], r = rngFor(`mix:${kind}:${SES[i].id}`);
        const n = K.list.map(() => 0);
        for (let x = 0; x < row[K.n]; x++) n[slots[at++]]++;
        const f = K.list.map(c => c.f * (0.99 + 0.02 * r()));
        const raw = n.map((k, j) => k * f[j]), R = raw.reduce((a, b) => a + b, 0);
        const amt = raw.map(v => (R ? Math.round((row[K.amt] * v) / R / K.unit) * K.unit : 0));
        if (R) { let j = 0; n.forEach((k, m) => { if (k > n[j]) j = m; }); amt[j] += row[K.amt] - amt.reduce((a, b) => a + b, 0); }
        SE_SPLIT[kind][i] = { n, amt };
      });
    });
  });
})();
const SPLIT_AGG = new Map();
// Σ over a scope's SEs → rows per company: { i, name, n, amt, share, avg }, plus totals.
function splitOf(kind, scope) {
  const ck = kind + ":" + scope.key;
  let o = SPLIT_AGG.get(ck);
  if (o) return o;
  const list = SPLIT_KINDS[kind].list;
  const n = list.map(() => 0), amt = list.map(() => 0);
  scope.ses.forEach(i => { const s = SE_SPLIT[kind][i]; for (let j = 0; j < list.length; j++) { n[j] += s.n[j]; amt[j] += s.amt[j]; } });
  const N = n.reduce((a, b) => a + b, 0), A = amt.reduce((a, b) => a + b, 0);
  const rows = list.map((c, i) => ({ i, key: c.name, name: c.name, n: n[i], amt: amt[i], share: div(n[i], N), avg: div(amt[i], n[i]) })).filter(x => x.n > 0);
  o = { rows, n: N, amt: A, avg: div(A, N) };
  SPLIT_AGG.set(ck, o);
  return o;
}

/* ---------------- Leads → retail funnel and lost leads (sample data) ----------------
   Generated per SE per day for the last 120 days (23 Jul – 19 Nov 2026). Per day and SE every
   stage is a subset of the one before (Leads ≥ Attempted ≥ Contacted ≥ Interested ≥ Test ride ≥
   Booking), so any date range keeps that order. November's Booking and Retailed per SE are the
   Board's MTD numbers (SE_ROWS.book / .retail), dealt out over 1–19 Nov; earlier months use the
   outlet's target × its plan factor. Retailed is invoiced from earlier bookings, so it is split
   over the days on its own (it can run a little ahead of a short range's bookings).
   Lost: per day, a share of the leads that stopped at each stage is closed as lost (never more
   than stopped there), plus a few booking cancellations — so a lost lead counts in every stage
   it reached and none beyond. For any range, each SE's counts are split by lead source with
   capped integer splits (Σ sources = the SE, stage order kept per source), then each source's
   lost leads by reason (weights by stage × source × outlet), and "Bought competitor" by brand.
   Every split adds back exactly, so a parent is always Σ children in all three groupings. */
const FN_START = Date.UTC(2026, 6, 23), FN_DAYS = 120, DMS = 864e5, FN_NP = FN_DAYS + 1;
const fnIso = (i) => new Date(FN_START + i * DMS).toISOString().slice(0, 10);
const fnIdx = (iso) => Math.round((Date.parse(iso + "T00:00:00Z") - FN_START) / DMS);
const fnDay = (i, yr) => { const d = new Date(FN_START + i * DMS); return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}${yr ? " " + d.getUTCFullYear() : ""}`; };
const FN_MIN = fnIso(0), FN_MAX = fnIso(FN_DAYS - 1);
const FN_RANGES = { this: [fnIdx("2026-11-01"), FN_DAYS - 1], last: [fnIdx("2026-10-01"), fnIdx("2026-10-31")] };
const STAGES = ["leads", "att", "con", "int", "td", "bk", "rt"];
const LOST_AT = ["l0", "l1", "l2", "l3", "l4", "l5"];   // lost at: lead · attempted · contacted · interested · test ride · booking
// cf: conversion tilt per stage · lt: tilt on being closed as lost · metro / town / flag: mix tilts.
const FN_SRC = [
  { name: "Walk-in", mix: 26, cf: 1.16, lt: 0.8, metro: 0.8, town: 1.35, exp: 1.2 },
  { name: "Website", mix: 12, cf: 1.0, lt: 1.0, metro: 1.4, town: 0.85, flag: 1.15 },
  { name: "Referral", mix: 9, cf: 1.14, lt: 0.8, metro: 1, town: 1.1 },
  { name: "BikeDekho", mix: 8, cf: 0.97, lt: 1.0, metro: 1.3, town: 0.9 },
  { name: "BikeWale", mix: 7, cf: 0.97, lt: 1.0, metro: 1.3, town: 0.9 },
  { name: "Google Ad", mix: 10, cf: 0.94, lt: 1.05, metro: 1.5, town: 0.85 },
  { name: "Facebook Ad", mix: 8, cf: 0.88, lt: 1.1, metro: 1.4, town: 0.9 },
  { name: "Instagram Ad", mix: 7, cf: 0.88, lt: 1.1, metro: 1.6, town: 0.75 },
  { name: "Justdial", mix: 6, cf: 0.82, lt: 1.25, metro: 0.85, town: 1.3 },
  { name: "OLX", mix: 4, cf: 0.76, lt: 1.3, metro: 0.85, town: 1.3 },
  { name: "Corporate/Fleet", mix: 3, cf: 1.08, lt: 0.85, metro: 1.3, town: 0.7, flag: 1.6 },
];
const LOST_REASONS = [
  { key: "price", name: "Price / budget" }, { key: "comp", name: "Bought competitor" }, { key: "finr", name: "Finance rejected" },
  { key: "chg", name: "Charging / range concern" }, { key: "wait", name: "Long delivery wait" }, { key: "nr", name: "Not reachable" },
  { key: "post", name: "Postponed purchase" }, { key: "exch", name: "Low exchange value" }, { key: "oth", name: "Other" },
];
// Reason mix by the stage the lead was lost at (columns in LOST_REASONS order).
const REASON_BY_STAGE = [
  [10, 0, 0, 0, 0, 62, 16, 0, 8],       // never got past the lead
  [0, 0, 0, 0, 0, 92, 0, 0, 5],         // attempted, never contacted
  [24, 20, 10, 13, 3, 5, 16, 6, 3],     // contacted, not interested
  [22, 23, 12, 12, 6, 0, 14, 7, 4],     // interested, no test ride
  [18, 26, 24, 4, 10, 0, 8, 8, 2],      // test ride, no booking
  [0, 15, 40, 0, 30, 0, 10, 0, 5],      // booking cancelled
];
const COMPETITORS = [
  { name: "Ather", mix: 34 }, { name: "Ola Electric", mix: 24 }, { name: "TVS iQube", mix: 18 },
  { name: "Bajaj Chetak", mix: 13 }, { name: "Hero Vida", mix: 6 }, { name: "Other", mix: 5 },
];
const NSRC = FN_SRC.length, NRSN = LOST_REASONS.length, NCMP = COMPETITORS.length;
const FN_SERIES = STAGES.length + LOST_AT.length;                  // 13 daily series
const FN_KEYS = [...STAGES, ...LOST_AT, ...LOST_REASONS.map(r => r.key), ...COMPETITORS.map((_, i) => "c" + i)];
const NF = FN_KEYS.length;                                         // 28 fields per SE (and per SE × source)
const R0 = STAGES.length + LOST_AT.length, C0 = R0 + NRSN;
const NSE = SES.length;
const FN_PREF = new Int32Array(FN_SERIES * NSE * FN_NP);
(() => {
  const months = [[2026, 7], [2026, 8], [2026, 9], [2026, 10], [2026, 11]];
  const day = new Int32Array(FN_SERIES * FN_DAYS);
  LOCS.forEach(l => {
    const q = rngFor("fnl:" + l.id);
    const metro = METROS.has(l.city);
    const f = { a: rr(q, 0.95, 1.04), c: rr(q, 0.88, 1.1), i: rr(q, 0.88, 1.12), t: rr(q, 0.88, 1.12), b: rr(q, 0.9, 1.1), lost: rr(q, 0.85, 1.15) };
    l.fnMix = FN_SRC.map(s => s.mix * (metro ? s.metro : s.town) * (l.format === "Flagship" ? s.flag || 1 : 1)
      * (l.format === "Express" ? s.exp || 1 : 1) * rr(q, 0.8, 1.2));
    // Reason weights per source × stage: source tilt, metro vs district tilt, outlet noise.
    const on = LOST_REASONS.map(() => rr(q, 0.85, 1.15));
    const locT = LOST_REASONS.map((r, k) => on[k] * (metro
      ? ({ comp: 1.3, chg: 0.8, finr: 0.85 }[r.key] || 1)
      : ({ comp: 0.85, chg: 1.3, finr: 1.3 }[r.key] || 1)));
    l.fnRW = FN_SRC.map(s => {
      const t = (r) => (s.name === "OLX" || s.name === "Justdial" ? ({ nr: 1.9 }[r] || 1)
        : s.name === "Facebook Ad" || s.name === "Instagram Ad" ? ({ nr: 1.3 }[r] || 1)
        : s.name === "Walk-in" || s.name === "Referral" ? ({ price: 1.35, comp: 1.35, nr: 0.4 }[r] || 1)
        : s.name === "Corporate/Fleet" ? ({ finr: 0.5, price: 1.2 }[r] || 1) : 1);
      return REASON_BY_STAGE.map(row => row.map((w, k) => w * locT[k] * t(LOST_REASONS[k].key)));
    });
    l.fnCW = COMPETITORS.map(c => c.mix * rr(q, 0.8, 1.2)
      * (c.name === "Ather" ? (l.state === "Karnataka" || l.state === "Tamil Nadu" ? 1.5 : 1) * (metro ? 1.15 : 0.75) : 1)
      * (c.name === "Ola Electric" && (l.state === "Telangana" || l.state === "Andhra Pradesh") ? 1.25 : 1)
      * (c.name === "Bajaj Chetak" && l.state === "Maharashtra" ? 1.5 : 1)
      * (c.name === "TVS iQube" && !metro ? 1.3 : 1));
    // Retail per SE for the months before November (Nov is the Board's MTD, per SE).
    const monthR = {};
    months.forEach(([y, m]) => {
      const mi = MI(y, m);
      if (mi === NOW_MI) return;
      const qm = rngFor(`fnm:${l.id}:${mi}`);
      monthR[mi] = splitInt(Math.round(tgtM(l, mi) * l.factor * rr(qm, 0.9, 1.08)), l.ses.map(i => SES[i].skill * rr(qm, 0.85, 1.15)));
    });
    l.ses.forEach((si, k) => {
      const s = SES[si];
      day.fill(0);
      const qs = rngFor("fns:" + s.id);
      const pa = clamp(0.9 * f.a * rr(qs, 0.97, 1.03), 0.8, 0.97), pc = 0.72 * f.c * rr(qs, 0.92, 1.08),
        pi = 0.45 * f.i * rr(qs, 0.9, 1.1), pt = 0.55 * f.t * rr(qs, 0.9, 1.1), pb = 0.45 * f.b * rr(qs, 0.9, 1.1);
      const ql = [0.33, 0.42, 0.5, 0.45, 0.4].map(x => clamp(x * f.lost * rr(qs, 0.9, 1.1), 0, 0.95));
      const qc = 0.04 * rr(qs, 0.6, 1.4);
      months.forEach(([y, m]) => {
        const mi = MI(y, m);
        if (mi < l.openMi) return;                       // not open yet: no leads
        const now = mi === NOW_MI;
        const nd = now ? DAY : new Date(Date.UTC(y, m, 0)).getUTCDate();
        const first = fnIdx(`${y}-${String(m).padStart(2, "0")}-01`);
        const R = now ? SE_ROWS[si].retail : monthR[mi][k];
        const B = now ? SE_ROWS[si].book : R + Math.round(R * s.bkr);
        const r = rngFor(`fnd:${s.id}:${mi}`);
        const sr = (x) => Math.floor(x + r());
        const w = Array.from({ length: nd }, (_, d) => {
          const wd = new Date(Date.UTC(y, m - 1, d + 1)).getUTCDay();
          return (wd === 0 || wd === 6 ? 1.35 : 1) * rr(r, 0.6, 1.4);
        });
        const W = w.reduce((a, b) => a + b, 0);
        const lam = B > 0 ? B / (pa * pc * pi * pt * pb) : 6;
        const L = [], A = [], Cn = [], I = [], T = [];
        for (let d = 0; d < nd; d++) {
          L[d] = sr((lam * w[d] / W) * rr(r, 0.85, 1.15));
          A[d] = Math.min(L[d], sr(L[d] * pa * rr(r, 0.95, 1.05)));
          Cn[d] = Math.min(A[d], sr(A[d] * pc * rr(r, 0.9, 1.1)));
          I[d] = Math.min(Cn[d], sr(Cn[d] * pi * rr(r, 0.9, 1.1)));
          T[d] = Math.min(I[d], sr(I[d] * pt * rr(r, 0.9, 1.1)));
        }
        const gap = B - T.reduce((a, b) => a + b, 0);
        if (gap > 0) { let d = 0; w.forEach((x, j) => { if (x > w[d]) d = j; }); L[d] += gap; A[d] += gap; Cn[d] += gap; I[d] += gap; T[d] += gap; }
        const Bk = splitCap(B, T, T);
        const Rt = splitInt(R, w.map(x => x * rr(r, 0.6, 1.4)));
        for (let d = 0; d < nd; d++) {
          const ix = first + d;
          if (ix < 0 || ix >= FN_DAYS) continue;
          const st = [L[d], A[d], Cn[d], I[d], T[d], Bk[d], Rt[d]];
          st.forEach((v, j) => { day[j * FN_DAYS + ix] = v; });
          for (let j = 0; j < 5; j++) { const drop = st[j] - st[j + 1]; day[(7 + j) * FN_DAYS + ix] = Math.min(drop, sr(drop * ql[j])); }
          day[12 * FN_DAYS + ix] = Math.min(Bk[d], sr(Bk[d] * qc));
        }
      });
      for (let j = 0; j < FN_SERIES; j++) {
        const base = (j * NSE + si) * FN_NP;
        for (let d = 0; d < FN_DAYS; d++) FN_PREF[base + d + 1] = FN_PREF[base + d] + day[j * FN_DAYS + d];
      }
    });
  });
})();
// One date range → per SE × source (and per SE) the 28 fields. Cached per range.
const FN_RANGE = new Map();
function fnRange(a, b) {
  const key = a + ":" + b;
  let o = FN_RANGE.get(key);
  if (o) return o;
  const src = new Int32Array(NSE * NSRC * NF), all = new Int32Array(NSE * NF);
  const tot = new Array(FN_SERIES);
  for (let s = 0; s < NSE; s++) {
    for (let j = 0; j < FN_SERIES; j++) { const base = (j * NSE + s) * FN_NP; tot[j] = FN_PREF[base + b + 1] - FN_PREF[base + a]; }
    const l = SES[s].loc;
    const st = [splitInt(tot[0], l.fnMix)];
    for (let k = 1; k < 6; k++) st[k] = splitCap(tot[k], st[k - 1].map((p, j) => p * FN_SRC[j].cf), st[k - 1]);
    st[6] = tot[6] <= tot[5] ? splitCap(tot[6], st[5], st[5]) : splitInt(tot[6], st[5].map((x, j) => x + l.fnMix[j] * 1e-3));
    const lk = [];
    for (let k = 0; k < 6; k++) {
      const caps = k < 5 ? st[k].map((x, j) => x - st[k + 1][j]) : st[5];
      lk[k] = splitCap(tot[7 + k], caps.map((c, j) => c * FN_SRC[j].lt), caps);
    }
    for (let j = 0; j < NSRC; j++) {
      const off = (s * NSRC + j) * NF;
      for (let k = 0; k < 7; k++) src[off + k] = st[k][j];
      for (let k = 0; k < 6; k++) {
        const n = lk[k][j];
        src[off + 7 + k] = n;
        if (n) splitInt(n, l.fnRW[j][k]).forEach((v, x) => { src[off + R0 + x] += v; });
      }
      const nc = src[off + R0 + 1];
      if (nc) splitInt(nc, l.fnCW).forEach((v, x) => { src[off + C0 + x] = v; });
      for (let x = 0; x < NF; x++) all[s * NF + x] += src[off + x];
    }
  }
  o = { src, all };
  FN_RANGE.set(key, o);
  return o;
}
function fnDerive(o) {
  o.lost = LOST_AT.reduce((x, k) => x + o[k], 0);
  o.lostTD = o.l4 + o.l5;
  return o;
}
// agg(t) for a tree node over a range: Σ over t.ses (one source's share when t.src is set).
const FN_AGG = new Map();
function fnAggFor(a, b) {
  const key = a + ":" + b;
  let f = FN_AGG.get(key);
  if (f) return f;
  const m = new Map();
  f = (t) => {
    let o = m.get(t.key);
    if (o) return o;
    const R = fnRange(a, b), v = new Array(NF).fill(0);
    const ses = t.ses;
    if (t.src != null) for (let i = 0; i < ses.length; i++) { const off = (ses[i] * NSRC + t.src) * NF; for (let x = 0; x < NF; x++) v[x] += R.src[off + x]; }
    else for (let i = 0; i < ses.length; i++) { const off = ses[i] * NF; for (let x = 0; x < NF; x++) v[x] += R.all[off + x]; }
    o = fnDerive(Object.fromEntries(FN_KEYS.map((k, x) => [k, v[x]])));
    m.set(t.key, o);
    return o;
  };
  FN_AGG.set(key, f);
  return f;
}

/* ---------------- Dealer income at the Admin rates ----------------
   Linear in the summed fields, so per-SE income summed = income of the sums. */
const DEFAULT_RATES = { ins: 15, pay: 1.5, file: 750, acc: 25, rc: 20 };
function withIncome(a, R) {
  const incIns = (a.insPrem * R.ins) / 100;
  const incFin = (a.loanAmt * R.pay) / 100 + R.file * a.fin;
  const incAdd = (a.acc * R.acc) / 100 + (a.rcVal * R.rc) / 100;
  const incTot = incIns + incFin + incAdd;
  return { ...a, incIns, incFin, incAdd, incTot,
    insPV: div(incIns, a.retail), finPV: div(incFin, a.retail), addPV: div(incAdd, a.retail), totPV: div(incTot, a.retail) };
}
const INC_AGG = new Map();
function aggWith(R) {
  const rk = JSON.stringify(R);
  let f = INC_AGG.get(rk);
  if (!f) {
    const m = new Map();
    f = (t) => { let a = m.get(t.key); if (!a) { a = withIncome(aggOf(t), R); m.set(t.key, a); } return a; };
    INC_AGG.set(rk, f);
  }
  return f;
}

/* ---------------- Stock (point in time) — the shared Epic River inventory ---------------- */
const STOCK_AGG = new Map();
function stockOf(t) {
  let o = STOCK_AGG.get(t.key);
  if (o) return o;
  o = { units: 0, value: 0, aged: 0, demo: 0 };
  t.locIds.forEach(id => { const s = stockFor(id); o.units += s.total; o.value += s.value; o.aged += s.aged90; o.demo += s.demo; });
  STOCK_AGG.set(t.key, o);
  return o;
}

/* ---------------- The two trees ----------------
   A tree node: { key, name, kind, ses (SE indexes), locIds, kids() }. Children are built
   lazily and sorted by units retailed, biggest first. */
const byRetail = (list) => list.sort((a, b) => aggOf(b).retail - aggOf(a).retail || a.name.localeCompare(b.name));
const PEOPLE_T = new Map();
function peopleNode(n, only) {
  // `only` (a Set of SE indexes) narrows the tree to one outlet's people.
  const key = (only ? only.tag + ":" : "") + n.id;
  if (PEOPLE_T.has(key)) return PEOPLE_T.get(key);
  const ses = only ? n.ses.filter(i => only.has(i)) : n.ses;
  let kids = null;
  const t = {
    key, name: n.name, kind: n.role, node: n, ses,
    hasKids: n.role !== "SE",
    kids: () => kids || (kids = byRetail(n.kids.map(id => NODES[id])
      .filter(k => !only || k.ses.some(i => only.has(i))).map(k => peopleNode(k, only)))),
  };
  PEOPLE_T.set(key, t);
  return t;
}
const PEOPLE_ROOT = peopleNode(CEO_NODE);
const LOC_ROOT = (() => {
  const mk = (key, name, kind, locs, kids) => ({
    key, name, kind, locs, locIds: locs.map(l => l.id), ses: locs.flatMap(l => l.ses), hasKids: !!kids, _k: kids,
    kids() { return this._sorted || (this._sorted = byRetail([...this._k])); },
  });
  const outlet = (l) => ({ ...mk("O:" + l.id, l.locality, "OUTLET", [l], null), loc: l });
  const states = [...new Set(LOCS.map(l => l.state))].map(st => {
    const sl = LOCS.filter(l => l.state === st);
    const cities = [...new Set(sl.map(l => l.city))].map(c => {
      const cl = sl.filter(l => l.city === c);
      return mk("C:" + st + ":" + c, c, "CITY", cl, cl.map(outlet));
    });
    return mk("S:" + st, st, "STATE", sl, cities);
  });
  return mk("G", GROUP.name, "GROUP", LOCS, states);
})();
// Source tree (funnel / lost leads): group → lead source → State → City → Outlet, built lazily.
// Every node below a source carries `src`, so its numbers are that source's share of its SEs.
const SRC_ROOT = (() => {
  const mk = (key, name, kind, src, locs, kf, extra) => ({
    key, name, kind, src, locs, locIds: locs.map(l => l.id), ses: locs.flatMap(l => l.ses), hasKids: !!kf, _kf: kf,
    kids() { return this._k || (this._k = this._kf()); }, ...extra,
  });
  const states = (j, pre) => [...new Set(LOCS.map(l => l.state))].map(st => {
    const sl = LOCS.filter(l => l.state === st);
    return mk(`${pre}S:${st}`, st, "STATE", j, sl, () => [...new Set(sl.map(l => l.city))].map(c => {
      const cl = sl.filter(l => l.city === c);
      return mk(`${pre}C:${st}:${c}`, c, "CITY", j, cl, () => cl.map(l => mk(`${pre}O:${l.id}`, l.locality, "OUTLET", j, [l], null, { loc: l })));
    }));
  });
  const srcs = FN_SRC.map((s, j) => mk(`SRC${j}`, s.name, "SOURCE", j, LOCS, () => states(j, `SRC${j}:`), { subText: "Lead source · all outlets" }));
  return mk("SRC", GROUP.name, "GROUP", null, LOCS, () => srcs, { subText: `Group · ${FN_SRC.length} sources` });
})();

/* ---------------- Custom fields (Admin) ---------------- */
const UN = "__unassigned";
function locKey(fk, l, cfs) {
  let v;
  switch (fk) {
    case "state": v = l.state; break;
    case "city": v = l.city; break;
    case "cluster": v = l.cluster; break;
    case "format": v = l.format; break;
    case "isNew": v = l.isNew ? "Yes" : "No"; break;
    case "loc": v = l.id; break;
    default: { const cf = cfs.find(c => c.key === fk); v = cf && cf.applies === "Locations" ? cf.assign[l.id] : undefined; }
  }
  return v == null || v === "" ? UN : v;
}
function seKey(fk, s, cfs) {
  const cf = cfs.find(c => c.key === fk);
  if (cf && cf.applies === "People") { const v = cf.assign[s.id]; return v == null || v === "" ? UN : v; }
  return locKey(fk, s.loc, cfs);
}
function labelOf(fk, key) {
  if (key === UN) return "Unassigned";
  if (fk === "loc") return LOC_BY_ID[key].locality;
  return key;
}

/* ============================ SHARED UI ============================ */
function Card({ children, style, ...rest }) {
  return <div {...rest} style={{ background: C.card, borderRadius: 16, padding: 14, marginBottom: 10, boxShadow: shadow, ...style }}>{children}</div>;
}
function ScreenHead({ title, blurb, right }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: F, fontWeight: 800, fontSize: 15.5, color: C.ink }}>{title}</div>
        {blurb && <div style={{ fontFamily: F, fontSize: 11.5, color: C.sub, marginTop: 2, lineHeight: 1.4 }}>{blurb}</div>}
      </div>
      {right}
    </div>
  );
}
function PeriodLine() {
  return <div style={{ fontFamily: F, fontSize: 11, color: C.faint, margin: "0 0 9px 4px" }}>{PERIOD_LINE}</div>;
}
function Seg({ value, onChange, opts, testid }) {
  return (
    <span data-testid={testid} style={{ display: "inline-flex", flexShrink: 0, border: `1.5px solid ${C.border}`, borderRadius: 9, padding: 2 }}>
      {opts.map(([v, label]) => {
        const on = value === v;
        return (
          <button key={v} type="button" aria-pressed={on} data-testid={`${testid}-${v}`} onClick={() => onChange(v)} style={{
            padding: "4px 9px", borderRadius: 7, border: "none", cursor: "pointer",
            background: on ? C.primarySoft : "none", color: on ? C.primary : C.sub,
            fontFamily: F, fontWeight: 700, fontSize: 11 }}>{label}</button>
        );
      })}
    </span>
  );
}
function CardHead({ Icon, title, right, hint, testid }) {
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3, paddingLeft: 4 }}>
        <Icon size={14} color={C.primary} />
        <span data-testid={testid} style={{ flex: 1, minWidth: 0, fontFamily: F, fontSize: 13.5, fontWeight: 800, color: C.ink }}>{title}</span>
        {right}
      </div>
      {hint && <div style={{ fontFamily: F, fontSize: 10.5, color: C.faint, marginBottom: 8, paddingLeft: 4 }}>{hint}</div>}
    </>
  );
}
function BackBar({ title, sub, onBack }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
      <button type="button" aria-label="Back" data-testid="back" onClick={onBack} style={{ width: 32, height: 32, borderRadius: 10, border: `1px solid ${C.border}`,
        background: C.card, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
        <ChevronLeft size={17} color={C.ink} />
      </button>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontFamily: F, fontWeight: 800, fontSize: 15, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</div>
        {sub && <div style={{ fontFamily: F, fontSize: 11, color: C.faint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sub}</div>}
      </div>
    </div>
  );
}

/* ============================ THE EXPANDABLE TABLE ============================
   Manager's TargetRow treatment: a level-coloured left bar and a background step per depth
   (no indenting), a chevron, an initials avatar, name over a one-line sub. */
const DEPTH_BG = ["rgba(59,75,232,0.07)", "#FFFFFF", "#F8F9FD", "#EEF0F7"];
const LEVEL_TONE = {
  CEO: C.ink, ZH: C.primary, AM: C.purple, SM: C.ink, TL: C.teal, SE: C.ghost,
  GROUP: C.ink, STATE: C.primary, CITY: C.purple, OUTLET: C.teal, SOURCE: C.warm,
};
const AVATAR_BG = { ...LEVEL_TONE, SE: C.sub };
const LEGEND = {
  people: [["ZH", "ZH"], ["AM", "AM"], ["SM", "SM"], ["TL", "TL"], ["SE", "SE"]],
  locations: [["STATE", "State"], ["CITY", "City"], ["OUTLET", "Outlet"]],
  source: [["SOURCE", "Source"], ["STATE", "State"], ["CITY", "City"], ["OUTLET", "Outlet"]],
};
const initials = (name) => name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();
const shortName = (name) => { const [a, ...b] = name.split(" "); return b.length ? `${a} ${b[b.length - 1][0]}.` : a; };

function Avatar({ t, size }) {
  const bg = AVATAR_BG[t.kind];
  const box = { width: size, height: size, borderRadius: "50%", background: bg, color: "#fff", display: "flex", alignItems: "center",
    justifyContent: "center", flexShrink: 0, fontFamily: F, fontWeight: 800, fontSize: size * 0.36 };
  if (t.kind === "CITY") return <span style={box}><MapPin size={size * 0.5} color="#fff" /></span>;
  if (t.kind === "OUTLET") return <span style={box}><Store size={size * 0.5} color="#fff" /></span>;
  const txt = t.kind === "GROUP" ? "ER" : t.kind === "STATE" ? STATE_ABBR[t.name] || initials(t.name) : initials(t.name);
  return <span style={box}>{txt}</span>;
}
function rowSub(t, parent) {
  if (t.subText) return t.subText;
  if (t.node) {
    const n = t.node;
    const heads = t.hasKids ? ` · ${t.ses.length}` : "";
    const place = n.role === "ZH" ? ZONE_LABEL[n.zone] : n.role === "AM" ? n.cluster
      : n.role === "SM" ? n.locIds.map(id => LOC_BY_ID[id].locality).join(" + ")
      : n.role === "TL" || n.role === "SE" ? (parent ? `under ${parent}` : LOC_BY_ID[n.locId].locality) : "";
    return `${n.role}${heads}${place ? ` · ${place}` : ""}`;
  }
  if (t.kind === "OUTLET") return `${t.loc.format}${t.loc.isNew ? " · new" : ""} · ${t.loc.ses.length} SEs`;
  const n = t.locIds.length;
  return `${t.kind === "GROUP" ? "Group" : t.kind === "STATE" ? "State" : "City"} · ${n} outlet${n === 1 ? "" : "s"}`;
}

const KIND_WORD = { GROUP: "Group", STATE: "State", CITY: "City", OUTLET: "Outlet" };
const displayName = (t) => t.label || (t.node ? shortName(t.name) : t.name);
// Finance screens: the sub-line under a name is "<kind> · N units".
const fiSub = (a, t) => `${t.node ? t.node.role : KIND_WORD[t.kind]} · ${nIN(a.retail)} unit${a.retail === 1 ? "" : "s"}`;
/* Collapse single-child levels: a city with one outlet shows as one row "City · Outlet" (same for
   any one-child level in the People tree). The merged row is the child, carrying both names. */
const MERGED = new Map();
function collapsed(t) {
  if (!t.hasKids) return t;
  const ks = t.kids();
  if (ks.length !== 1) return t;
  let m = MERGED.get(t.key);
  if (!m) {
    const c = collapsed(ks[0]);
    m = { ...c, name: `${t.name} · ${c.name}`, label: `${displayName(t)} · ${displayName(c)}`, merged: t.key };
    MERGED.set(t.key, m);
  }
  return m;
}

/* `part`: "line" renders only this row, "kids" only its (expanded) children, default both. */
function TreeRow({ t, depth, expanded, onToggle, onOutlet, parent, cols, agg, cmp, sub, subFull, collapse, part }) {
  const a = agg(t);
  const open = expanded.has(t.key);
  const isOutlet = t.kind === "OUTLET" && onOutlet;
  const clickable = t.hasKids || isOutlet;
  const attrs = Object.fromEntries(Object.entries(a).filter(([, v]) => typeof v === "number").map(([k, v]) => [`data-${k.toLowerCase()}`, v]));
  const line = part === "kids" ? null : (
    <div data-testid="tree-row" data-key={t.key} data-parent={parent ? parent.key : ""} data-depth={depth} data-kind={t.kind} data-name={t.name}
      data-merged={t.merged || undefined} {...attrs}
      style={{ display: "flex", alignItems: "center", minHeight: 48, borderBottom: `1px solid ${C.border}`,
        background: DEPTH_BG[Math.min(depth, DEPTH_BG.length - 1)], borderLeft: `3px solid ${LEVEL_TONE[t.kind]}` }}>
      <button type="button" data-testid="tree-name" disabled={!clickable}
        onClick={() => (t.hasKids ? onToggle(t.key) : isOutlet ? onOutlet(t.loc.id) : null)}
        aria-expanded={t.hasKids ? open : undefined}
        style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 6, padding: "10px 4px 10px 6px",
          background: "none", border: "none", cursor: clickable ? "pointer" : "default", textAlign: "left", WebkitTapHighlightColor: "transparent" }}>
        {t.hasKids
          ? (open ? <ChevronDown size={12} color={C.faint} style={{ flexShrink: 0 }} />
                  : <ChevronRight size={12} color={C.faint} style={{ flexShrink: 0 }} />)
          : isOutlet ? <ChevronRight size={12} color={C.primary} style={{ flexShrink: 0 }} />
          : <span style={{ width: 12, flexShrink: 0 }} />}
        <Avatar t={t} size={depth === 0 ? 26 : 23} />
        <span style={{ minWidth: 0 }}>
          <span style={{ display: "block", fontFamily: F, fontSize: 12.5, fontWeight: depth === 0 ? 800 : 600,
            color: isOutlet ? C.primary : C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {displayName(t)}
          </span>
          <span style={{ display: "block", fontFamily: F, fontSize: 10, color: C.faint, marginTop: 1,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {subFull ? subFull(a, t) : (sub ? sub(a) + " · " : "") + rowSub(t, parent && parent.node ? shortName(parent.name).split(" ")[0] : null)}
          </span>
        </span>
      </button>
      {cols.map(c => <span key={c.key} style={{ width: c.w, flexShrink: 0, textAlign: c.align || "center",
        paddingRight: c.align === "right" ? 4 : 0 }}>{c.cell(a, t)}</span>)}
    </div>
  );
  if (part === "line") return line;
  const kids = open && t.hasKids ? (collapse ? t.kids().map(collapsed) : t.kids()) : [];
  return (
    <>
      {line}
      {(cmp ? [...kids].sort(cmp) : kids).map(ch => (
        <TreeRow key={ch.key} t={ch} depth={depth + 1} expanded={expanded} onToggle={onToggle} onOutlet={onOutlet}
          parent={t} cols={cols} agg={agg} cmp={cmp} sub={sub} subFull={subFull} collapse={collapse} />
      ))}
    </>
  );
}
/* Tap-to-sort: a header tap sorts siblings at every level of the tree (numbers high → low first,
   Name A → Z first; tap again to flip). Rows without a value (no units → no ratio) go last.
   Finance screens pass `opts`: a metric tap sorts worst (lowest) first, and Name sorts by units. */
const FI_SORT = { first: (key) => (key === "name" ? "desc" : "asc"), nameSort: (a) => a.retail };
const nextSort = (s, key, opts) => (s.key === key ? { key, dir: s.dir === "desc" ? "asc" : "desc" }
  : { key, dir: opts ? opts.first(key) : key === "name" ? "asc" : "desc" });
function makeCmp(sort, cols, agg, opts) {
  const sgn = sort.dir === "asc" ? 1 : -1;
  const byName = (x, y) => x.name.localeCompare(y.name);
  const col = sort.key === "name" && opts ? { sort: opts.nameSort } : cols.find(c => c.key === sort.key);
  if (!col) return (x, y) => sgn * byName(x, y) || (x.key < y.key ? -1 : 1);
  return (x, y) => {
    const a = col.sort(agg(x), x), b = col.sort(agg(y), y);
    const na = !ok(a), nb = !ok(b);
    if (na || nb) return na === nb ? byName(x, y) : na ? 1 : -1;
    return sgn * (a - b) || byName(x, y) || (x.key < y.key ? -1 : 1);
  };
}
function useSort(cols, agg, initial, opts) {
  const [sort, setSort] = useState(initial);
  const cmp = useMemo(() => makeCmp(sort, cols, agg, opts), [sort, cols, agg, opts]);
  return [sort, (key) => setSort(s => nextSort(s, key, opts)), cmp];
}
function TreeHead({ cols, sort, onSort }) {
  const h = { fontFamily: F, fontSize: 9, fontWeight: 800, color: C.sub, textTransform: "uppercase", letterSpacing: 0.2 };
  const btn = { background: "none", border: "none", padding: 0, margin: 0, cursor: "pointer", lineHeight: "inherit", WebkitTapHighlightColor: "transparent" };
  const arrow = (k) => sort && sort.key === k
    ? <span style={{ position: "absolute", left: 0, right: 0, top: "100%", paddingTop: 1, fontSize: 6.5, lineHeight: 1, color: C.primary,
        textAlign: "inherit", paddingLeft: "inherit", paddingRight: "inherit" }}>{sort.dir === "desc" ? "▼" : "▲"}</span> : null;
  const cell = (k, label, style) => onSort
    ? <button type="button" data-testid={`sort-${k}`} data-sort={sort && sort.key === k ? sort.dir : ""} onClick={() => onSort(k)}
        style={{ ...h, ...btn, position: "relative", ...style }}>{label}{arrow(k)}</button>
    : <span style={{ ...h, ...style }}>{label}</span>;
  return (
    <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: 7, borderBottom: `1.5px solid ${C.borderStrong}` }}>
      {cell("name", "Name", { flex: 1, minWidth: 0, textAlign: "left", letterSpacing: 0.4, paddingLeft: 5 })}
      {cols.map(c => <React.Fragment key={c.key}>{cell(c.key, c.label, { width: c.w, flexShrink: 0, textAlign: c.align || "center", paddingRight: c.align === "right" ? 4 : 0 })}</React.Fragment>)}
    </div>
  );
}
function Legend({ items }) {
  return (
    <div style={{ display: "flex", gap: 11, marginBottom: 9, paddingLeft: 4 }}>
      {items.map(([k, label]) => (
        <span key={k} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 3, height: 11, borderRadius: 2, background: LEVEL_TONE[k] }} />
          <span style={{ fontFamily: F, fontSize: 9.5, color: C.faint }}>{label}</span>
        </span>
      ))}
    </div>
  );
}
function useExpanded(initial) {
  const [s, setS] = useState(() => new Set(initial));
  const toggle = (k) => setS(x => { const n = new Set(x); if (n.has(k)) n.delete(k); else n.add(k); return n; });
  return [s, toggle];
}
const TABLE_CARD = { padding: "14px 10px" };
const MODES = [["people", "People"], ["locations", "Locations"]];

/* ---------------- Column sets ----------------
   Each column: key, header label, width, cell renderer, and `sort` — the value a header tap
   sorts by (for a ratio column, the ratio). */
const num = (v, strong, size = 12.5) => (
  <span style={{ fontFamily: F, fontSize: size, fontWeight: strong ? 700 : 600, color: strong ? C.ink : C.sub }}>{v}</span>
);
const small = (v, color = C.faint, size = 9) => (
  <span style={{ display: "block", fontFamily: F, fontSize: size, marginTop: 2, color, whiteSpace: "nowrap", lineHeight: 1.15 }}>{v}</span>
);
const two = (a, b) => <>{a}<br />{b}</>;
const BOARD_COLS = [
  { key: "t", label: "Target", w: 42, sort: (a) => a.target, cell: (a) => num(nIN(a.target)) },
  { key: "r", label: "Retail", w: 52, sort: (a) => a.retail, cell: (a) => (
    <>
      <span style={{ display: "block", fontFamily: F, fontSize: 12.5, fontWeight: 700, lineHeight: 1, color: C.ink }}>{nIN(a.retail)}</span>
      {small(pctS(a.ach))}
      {small(`proj ${nIN(a.proj)}`, C.faint, 8.5)}
    </>
  ) },
  { key: "b", label: "Book", w: 40, sort: (a) => a.book, cell: (a) => num(nIN(a.book)) },
  { key: "v", label: "Value", w: 58, align: "right", sort: (a) => a.value, cell: (a) => (
    <span style={{ fontFamily: F, fontSize: 11.5, fontWeight: 700, color: C.ink, whiteSpace: "nowrap" }}>{inr(a.value)}</span>
  ) },
];
const G = GROUP_AGG;
/* Comparison vs group. Rates: ±5 percentage points; ₹ values: ±5% relative. A row is coloured
   only with ≥ 20 units behind it, and an average (premium, loan, accessory bill) also needs
   ≥ 10 policies / loans / buyers; otherwise ink. */
const MIN_UNITS = 20, MIN_BASE = 10;
const rateTone = (x, g, units) => (!ok(x) || !ok(g) ? C.faint : units < MIN_UNITS ? C.ink
  : x > g + 0.05 ? C.green : x < g - 0.05 ? C.hot : C.ink);
const rsTone = (x, g, units, base) => (!ok(x) || !ok(g) ? C.faint : units < MIN_UNITS || (base != null && base < MIN_BASE) ? C.ink
  : x > g * 1.05 ? C.green : x < g * 0.95 ? C.hot : C.ink);
const top2 = (v, sub, tone = C.ink, size = 12) => (
  <>
    <span style={{ display: "block", fontFamily: F, fontSize: size, fontWeight: 700, lineHeight: 1, color: tone, whiteSpace: "nowrap" }}>{v}</span>
    {sub}
  </>
);
const grey = (v) => small(v, C.faint, 8.5);
const rateCol = (key, label, w, f, subF, align) => ({ key, label, w, align, sort: (a) => a[f],
  cell: (a) => top2(pctS(a[f]), subF ? grey(subF(a)) : null, rateTone(a[f], G[f], a.retail)) });

// Finance · Insurance.
const INS_COLS = [
  rateCol("ins", "Ins %", 42, "insPct"),
  { key: "prem", label: two("Avg", "premium"), w: 58, sort: (a) => a.premAvg,
    cell: (a) => top2(rs(a.premAvg), null, rsTone(a.premAvg, G.premAvg, a.retail, a.ins)) },
  { key: "pol", label: "Policies", w: 54, align: "right", sort: (a) => a.ins, cell: (a) => top2(nIN(a.ins), null) },
];
// Finance · Finance.
const FINC_COLS = [
  rateCol("fin", "Fin %", 58, "finPct", (a) => `${pctS(a.finShare)} of loans`),
  { key: "loan", label: two("Avg", "loan"), w: 54, sort: (a) => a.loanAvg,
    cell: (a) => top2(lakh(a.loanAvg), grey(`${pctS(a.ltv)} LTV`), rsTone(a.loanAvg, G.loanAvg, a.retail, a.fin)) },
  { key: "loans", label: "Loans", w: 46, align: "right", sort: (a) => a.fin, cell: (a) => top2(nIN(a.fin), null) },
];
// Finance · Add-ons (revenue, not margin).
const ADDON_COLS = [
  rateCol("acc", "Acc %", 38, "accPct"),
  { key: "bill", label: two("Avg acc", "bill"), w: 50, sort: (a) => a.accBill,
    cell: (a) => top2(rs(a.accBill), null, rsTone(a.accBill, G.accBill, a.retail, a.accBuy)) },
  rateCol("rc", two("River", "Care %"), 58, "rcPct", (a) => `${pctS(a.p5Sh)} Plus Five`),
  { key: "pu", label: two("Add-ons", "₹/unit"), w: 48, align: "right", sort: (a) => a.addPU,
    cell: (a) => top2(rs(a.addPU), null, rsTone(a.addPU, G.addPU, a.retail)) },
];
// Finance · Income per vehicle — ₹ per scooter sold, at the Admin rates (`gi` = group with income).
const incomeCols = (gi) => {
  const col = (key, label, w, f, align) => ({ key, label, w, align, sort: (a) => a[f],
    cell: (a) => top2(rs(a[f]), null, rsTone(a[f], gi[f], a.retail)) });
  return [col("ins", "Insurance", 56, "insPV"), col("fin", "Finance", 48, "finPV"), col("add", "Add-ons", 48, "addPV"),
    col("tot", "Total", 46, "totPV", "right")];
};
const STOCK_COLS = [
  { key: "u", label: "Units", w: 46, sort: (s) => s.units, cell: (s) => num(nIN(s.units), true) },
  { key: "v", label: "Value", w: 62, sort: (s) => s.value, cell: (s) => <span style={{ fontFamily: F, fontSize: 11.5, fontWeight: 700, color: C.ink, whiteSpace: "nowrap" }}>{inr(s.value)}</span> },
  { key: "a", label: "90+ days", w: 52, align: "right", sort: (s) => s.aged, cell: (s) => (
    <span style={{ fontFamily: F, fontSize: 12.5, fontWeight: 700, color: s.aged > 0 ? C.hot : C.faint }}>{nIN(s.aged)}</span>
  ) },
];

/* ============================ LEADS TO RETAIL · LOST LEADS ============================
   Manager's funnel pattern in the CEO look: period chips (This month / Last month / Custom), a
   3-way grouping, and a table that scrolls sideways inside its card with a sticky name column;
   the header and group row stay pinned while the table scrolls down. */
const FN_NAME_W = 124;
const OPAQUE_BG = ["#F1F2FD", "#FFFFFF", "#F8F9FD", "#EEF0F7"];   // DEPTH_BG on white, opaque for sticky cells
const FN_MODES = [["people", "People"], ["locations", "Locations"], ["source", "Source"]];
const FN_PERIODS = [["this", "This month"], ["last", "Last month"], ["custom", "Custom"]];
const fnRootOf = (mode) => (mode === "people" ? PEOPLE_ROOT : mode === "locations" ? LOC_ROOT : SRC_ROOT);
const pct1 = (x) => pctS(x, ok(x) && x < 0.1 ? 1 : 0);
const stageCol = (key, label, prev, w = 56) => ({ key, label, w, sort: (a) => a[key],
  cell: (a) => top2(nIN(a[key]), prev ? grey(pct1(div(a[key], a[prev]))) : null, C.ink, 12) });
const FN_COLS = [
  stageCol("leads", "Leads", null, 58),
  stageCol("att", "Attempted", "leads"),
  stageCol("con", "Contacted", "att"),
  stageCol("int", "Interested", "con", 60),
  stageCol("td", two("Test", "ride"), "int", 50),
  stageCol("bk", "Booking", "td"),
  { key: "rt", label: "Retailed", w: 60, sort: (a) => a.rt,
    cell: (a) => top2(nIN(a.rt), <>{grey(pct1(div(a.rt, a.bk)))}{grey(`${pct1(div(a.rt, a.leads))} of leads`)}</>, C.ink, 12) },
  { key: "lost", label: "Lost", w: 56, sort: (a) => a.lost,
    cell: (a) => top2(nIN(a.lost), grey(`${pct1(div(a.lost, a.leads))} of leads`), C.ink, 12) },
];
const REASON_LABEL = { price: two("Price /", "budget"), comp: two("Bought", "competitor"), finr: two("Finance", "rejected"),
  chg: two("Charging", "/ range"), wait: two("Delivery", "wait"), nr: two("Not", "reachable"), post: "Postponed",
  exch: two("Low", "exchange"), oth: "Other" };
const LN_COLS = [
  { key: "lost", label: "Lost", w: 58, sort: (a) => a.lost,
    cell: (a) => top2(nIN(a.lost), grey(`${pct1(div(a.lost, a.leads))} of leads`), C.ink, 12) },
  ...LOST_REASONS.map(r => ({ key: r.key, label: REASON_LABEL[r.key], w: r.key === "comp" ? 62 : 56, sort: (a) => a[r.key],
    cell: (a) => top2(nIN(a[r.key]), grey(pct1(div(a[r.key], a.lost))), C.ink, 12) })),
];

function FnHead({ cols, sort, onSort }) {
  const h = { fontFamily: F, fontSize: 8.5, fontWeight: 800, color: C.sub, textTransform: "uppercase", letterSpacing: 0.1, lineHeight: 1.2 };
  const btn = { background: "none", border: "none", padding: 0, margin: 0, cursor: "pointer", WebkitTapHighlightColor: "transparent", position: "relative" };
  const arrow = (k) => sort.key === k
    ? <span style={{ position: "absolute", left: 0, right: 0, top: "100%", paddingTop: 1, fontSize: 6.5, lineHeight: 1, color: C.primary, textAlign: "inherit" }}>{sort.dir === "desc" ? "▼" : "▲"}</span> : null;
  return (
    <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: 8, paddingTop: 2, borderBottom: `1.5px solid ${C.borderStrong}`, background: C.card }}>
      <span style={{ width: FN_NAME_W, flexShrink: 0, position: "sticky", left: 0, zIndex: 2, background: C.card, alignSelf: "stretch", display: "flex", alignItems: "flex-end" }}>
        <button type="button" data-testid="sort-name" data-sort={sort.key === "name" ? sort.dir : ""} onClick={() => onSort("name")}
          style={{ ...h, ...btn, letterSpacing: 0.4, paddingLeft: 8, textAlign: "left" }}>Name{arrow("name")}</button>
      </span>
      {cols.map(c => (
        <button key={c.key} type="button" data-testid={`sort-${c.key}`} data-sort={sort.key === c.key ? sort.dir : ""} onClick={() => onSort(c.key)}
          style={{ ...h, ...btn, width: c.w, flexShrink: 0, textAlign: "center" }}>{c.label}{arrow(c.key)}</button>
      ))}
    </div>
  );
}
function FnRow({ t, depth, expanded, onToggle, onOutlet, parent, cols, agg, cmp, testid, part }) {
  const a = agg(t);
  const open = expanded.has(t.key);
  const isOutlet = t.kind === "OUTLET" && onOutlet;
  const clickable = t.hasKids || isOutlet;
  const bg = OPAQUE_BG[Math.min(depth, OPAQUE_BG.length - 1)];
  const attrs = Object.fromEntries(Object.entries(a).map(([k, v]) => [`data-${k.toLowerCase()}`, v]));
  const line = part === "kids" ? null : (
    <div data-testid={`${testid}-row`} data-key={t.key} data-parent={parent ? parent.key : ""} data-depth={depth} data-kind={t.kind} data-name={t.name}
      {...attrs} style={{ display: "flex", alignItems: "center", minHeight: 50, borderBottom: `1px solid ${C.border}`, background: bg }}>
      <button type="button" data-testid={`${testid}-name`} disabled={!clickable} aria-expanded={t.hasKids ? open : undefined}
        onClick={() => (t.hasKids ? onToggle(t.key) : isOutlet ? onOutlet(t.loc.id) : null)}
        style={{ width: FN_NAME_W, flexShrink: 0, alignSelf: "stretch", position: "sticky", left: 0, zIndex: 1, background: bg,
          borderTop: "none", borderRight: `1px solid ${C.border}`, borderBottom: "none", borderLeft: `3px solid ${LEVEL_TONE[t.kind]}`,
          display: "flex", alignItems: "center", gap: 5, padding: "8px 4px 8px 4px", cursor: clickable ? "pointer" : "default",
          textAlign: "left", WebkitTapHighlightColor: "transparent", boxSizing: "border-box" }}>
        {t.hasKids
          ? (open ? <ChevronDown size={11} color={C.faint} style={{ flexShrink: 0 }} /> : <ChevronRight size={11} color={C.faint} style={{ flexShrink: 0 }} />)
          : isOutlet ? <ChevronRight size={11} color={C.primary} style={{ flexShrink: 0 }} />
          : <span style={{ width: 11, flexShrink: 0 }} />}
        <Avatar t={t} size={depth === 0 ? 24 : 21} />
        <span style={{ minWidth: 0 }}>
          <span style={{ display: "block", fontFamily: F, fontSize: 12, fontWeight: depth === 0 ? 800 : 600, color: isOutlet ? C.primary : C.ink,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{displayName(t)}</span>
          <span style={{ display: "block", fontFamily: F, fontSize: 9.5, color: C.faint, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {rowSub(t, parent && parent.node ? shortName(parent.name).split(" ")[0] : null)}
          </span>
        </span>
      </button>
      {cols.map(c => <span key={c.key} style={{ width: c.w, flexShrink: 0, textAlign: "center" }}>{c.cell(a, t)}</span>)}
    </div>
  );
  if (part === "line") return line;
  const kids = open && t.hasKids ? [...t.kids()].sort(cmp) : [];
  return (
    <>
      {line}
      {kids.map(ch => <FnRow key={ch.key} t={ch} depth={depth + 1} expanded={expanded} onToggle={onToggle} onOutlet={onOutlet}
        parent={t} cols={cols} agg={agg} cmp={cmp} testid={testid} />)}
    </>
  );
}
const dateInput = { width: "100%", boxSizing: "border-box", border: `1.5px solid ${C.borderStrong}`, borderRadius: 8, padding: "6px 7px",
  fontFamily: F, fontSize: 12, color: C.ink, background: C.card, outline: "none", minWidth: 0 };
function customRange(from, to) {
  let a = fnIdx(from), b = fnIdx(to);
  if (!Number.isFinite(a)) a = 0;
  if (!Number.isFinite(b)) b = FN_DAYS - 1;
  a = clamp(a, 0, FN_DAYS - 1); b = clamp(b, 0, FN_DAYS - 1);
  return a <= b ? [a, b] : [b, a];
}
/* One card: grouping, period, summary boxes, the table. `after(g, rangeText)` renders below the card. */
function RangeTreeCard({ title, Icon, testid, cols, hint, summary, after, open }) {
  const [mode, setMode] = useState("people");
  const [period, setPeriod] = useState("this");
  const [from, setFrom] = useState("2026-10-01");
  const [to, setTo] = useState("2026-10-15");
  const [exP, toggleP] = useExpanded([PEOPLE_ROOT.key]);
  const [exL, toggleL] = useExpanded([LOC_ROOT.key]);
  const [exS, toggleS] = useExpanded([SRC_ROOT.key]);
  const [a, b] = period === "custom" ? customRange(from, to) : FN_RANGES[period];
  const agg = fnAggFor(a, b);
  const [sort, onSort, cmp] = useSort(cols, agg, { key: cols[0].key, dir: "desc" });
  const root = fnRootOf(mode);
  const ex = mode === "people" ? exP : mode === "locations" ? exL : exS;
  const toggle = mode === "people" ? toggleP : mode === "locations" ? toggleL : toggleS;
  const g = agg(root);
  const days = b - a + 1;
  const rangeText = `${fnDay(a, fnDay(a, true).slice(-4) !== fnDay(b, true).slice(-4))} – ${fnDay(b, true)} · ${days} day${days === 1 ? "" : "s"}${period === "this" ? " · MTD" : ""}`;
  const rp = { t: root, depth: 0, expanded: ex, onToggle: toggle, onOutlet: open, cols, agg, cmp, testid };
  const minW = FN_NAME_W + cols.reduce((x, c) => x + c.w, 0);
  return (
    <>
      <Card style={TABLE_CARD} data-testid={`${testid}-card`} data-mode={mode} data-period={period} data-range={`${fnIso(a)}..${fnIso(b)}`}>
        <CardHead Icon={Icon} title={title} testid={`${testid}-title`}
          right={<Seg value={mode} onChange={setMode} opts={FN_MODES} testid={`${testid}-mode`} />} hint={hint} />
        <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap", padding: "2px 4px 0" }}>
          {FN_PERIODS.map(([k, label]) => {
            const on = period === k;
            return (
              <button key={k} type="button" data-testid={`${testid}-period-${k}`} aria-pressed={on} onClick={() => setPeriod(k)} style={{
                padding: "5px 10px", borderRadius: 8, cursor: "pointer", border: `1.5px solid ${on ? C.primary : C.border}`,
                background: on ? C.primarySoft : C.card, color: on ? C.primary : C.sub, fontFamily: F, fontWeight: 700, fontSize: 11 }}>{label}</button>
            );
          })}
        </div>
        <div data-testid={`${testid}-range`} style={{ fontFamily: F, fontSize: 10.5, color: C.faint, padding: "5px 4px 8px" }}>{rangeText}</div>
        {period === "custom" && (
          <div data-testid={`${testid}-custom`} style={{ display: "flex", gap: 8, alignItems: "flex-end", margin: "0 4px 10px",
            border: `1px solid ${C.border}`, borderRadius: 11, padding: 9 }}>
            {[["From", from, setFrom, FN_MIN, to], ["To", to, setTo, from, FN_MAX]].map(([lab, v, set, mn, mx]) => (
              <label key={lab} style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontFamily: F, fontSize: 9.5, fontWeight: 800, color: C.faint, textTransform: "uppercase", marginBottom: 3 }}>{lab}</span>
                <input type="date" data-testid={`${testid}-${lab.toLowerCase()}`} value={v} min={mn} max={mx}
                  onChange={e => { if (e.target.value) set(e.target.value); }} style={dateInput} />
              </label>
            ))}
          </div>
        )}
        {summary(g)}
        <Legend items={LEGEND[mode]} />
        <div data-testid={`${testid}-scroll`} style={{ overflow: "auto", maxHeight: 560, overscrollBehaviorX: "contain", borderRadius: 6 }}>
          <div style={{ minWidth: minW }}>
            <div data-testid={`${testid}-pinned`} style={{ position: "sticky", top: 0, zIndex: 3, background: C.card }}>
              <FnHead cols={cols} sort={sort} onSort={onSort} />
              <FnRow key={root.key} {...rp} part="line" />
            </div>
            <FnRow key={root.key + ":kids"} {...rp} part="kids" />
          </div>
        </div>
      </Card>
      {after && after(g, rangeText)}
    </>
  );
}
const FN_HINT = "Grey % = conversion from the stage before; Retailed also shows retail ÷ leads, Lost shows lost ÷ leads. Swipe the table for more columns; tap a header to sort.";
function FunnelSection({ open }) {
  return (
    <RangeTreeCard title="Leads to Retail" Icon={Filter} testid="fn" cols={FN_COLS} open={open} hint={FN_HINT}
      summary={(g) => (
        <MetricGrid testid="fn-summary" style={{ padding: "2px 0 12px" }}>
          <MetricBox span label="Leads" value={nIN(g.leads)} sub={`${nIN(g.td)} test rides · ${pct1(div(g.td, g.leads))} of leads`} testid="fn-sum-leads" />
          <MetricBox label="Retailed" value={nIN(g.rt)} sub={`${pct1(div(g.rt, g.leads))} of leads`} testid="fn-sum-rt" />
          <MetricBox label="Booking" value={nIN(g.bk)} sub={`${pct1(div(g.rt, g.bk))} to retail`} testid="fn-sum-bk" />
        </MetricGrid>
      )} />
  );
}
const LN_HINT = "Leads closed as lost in the period, by reason (grey = % of lost). Swipe for every reason; tap a header to sort.";
function LostSection({ open }) {
  return (
    <RangeTreeCard title="Lost leads" Icon={UserX} testid="ln" cols={LN_COLS} open={open} hint={LN_HINT}
      summary={(g) => {
        const top = LOST_REASONS.reduce((x, r) => (g[r.key] > g[x.key] ? r : x), LOST_REASONS[0]);
        return (
          <MetricGrid testid="ln-summary" style={{ padding: "2px 0 12px" }}>
            <MetricBox span label="Lost leads" value={nIN(g.lost)} sub={`${pct1(div(g.lost, g.leads))} of ${nIN(g.leads)} leads`} testid="ln-sum-lost" />
            <MetricBox label="Top reason" value={<span style={{ fontSize: 15 }}>{top.name}</span>} sub={`${pct1(div(g[top.key], g.lost))} of lost`} testid="ln-sum-top" />
            <MetricBox label="Lost after test ride" value={nIN(g.lostTD)} sub={`${pct1(div(g.lostTD, g.lost))} of lost · ${nIN(g.l5)} cancelled bookings`} testid="ln-sum-td" />
          </MetricGrid>
        );
      }}
      after={(g, rangeText) => <CompetitorCard g={g} rangeText={rangeText} />} />
  );
}
/* Lost to competitor: the Insurers / Finance-partners split style, for the group in the period. */
const CMP_COLS = [
  { key: "share", label: "Share", w: 48, sort: (r) => r.share },
  { key: "n", label: "Leads", w: 52, align: "right", sort: (r) => r.n },
];
function CompetitorCard({ g, rangeText }) {
  const [sort, setSort] = useState({ key: "share", dir: "desc" });
  const N = g.comp;
  const rows = COMPETITORS.map((c, i) => ({ key: c.name, name: c.name, n: g["c" + i], share: div(g["c" + i], N) }));
  const col = CMP_COLS.find(c => c.key === sort.key);
  const sgn = sort.dir === "asc" ? 1 : -1;
  rows.sort((x, y) => (col ? sgn * ((col.sort(x) || 0) - (col.sort(y) || 0)) : sgn * x.name.localeCompare(y.name)) || x.name.localeCompare(y.name));
  const cellW = (c) => ({ width: c.w, flexShrink: 0, textAlign: c.align || "center", paddingRight: c.align === "right" ? 4 : 0 });
  const nameCell = (title, sub, bar, strong) => (
    <span style={{ flex: 1, minWidth: 0, padding: "0 8px 0 6px" }}>
      <span style={{ display: "block", fontFamily: F, fontSize: 12.5, fontWeight: strong ? 800 : 600, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</span>
      {sub != null && <span style={{ display: "block", fontFamily: F, fontSize: 10, color: C.faint, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sub}</span>}
      {bar != null && (
        <span style={{ display: "block", position: "relative", height: 3, borderRadius: 999, background: "#ECEEF4", marginTop: 5 }}>
          <span style={{ position: "absolute", left: 0, top: 0, bottom: 0, borderRadius: 999, background: C.primary, width: `${clamp((bar || 0) * 100, 0, 100)}%` }} />
        </span>
      )}
    </span>
  );
  return (
    <Card style={TABLE_CARD} data-testid="ln-competitor">
      <CardHead Icon={UserX} title="Lost to competitor" testid="ln-competitor-title" hint={`Leads lost as "Bought competitor", by brand · ${rangeText}`} />
      <TreeHead cols={CMP_COLS} sort={sort} onSort={(k) => setSort(x => nextSort(x, k))} />
      <div data-testid="cmp-total" data-n={N} style={{ display: "flex", alignItems: "center", minHeight: 44, borderBottom: `1px solid ${C.border}`, background: DEPTH_BG[0], borderLeft: `3px solid ${C.ink}` }}>
        {nameCell(GROUP.name, `${nIN(N)} leads bought a competitor · ${pct1(div(N, g.lost))} of lost`, null, true)}
        <span style={cellW(CMP_COLS[0])}>{num(N ? "100%" : "—", true)}</span>
        <span style={cellW(CMP_COLS[1])}>{num(nIN(N), true)}</span>
      </div>
      {rows.map(r => (
        <div key={r.key} data-testid="cmp-row" data-name={r.name} data-n={r.n} data-share={r.share}
          style={{ display: "flex", alignItems: "center", minHeight: 42, borderBottom: `1px solid ${C.border}`, borderLeft: "3px solid transparent" }}>
          {nameCell(r.name, null, r.share)}
          <span style={cellW(CMP_COLS[0])}>{num(pctS(r.share), true, 12)}</span>
          <span style={cellW(CMP_COLS[1])}>{num(nIN(r.n), false, 12)}</span>
        </div>
      ))}
      <div style={{ fontFamily: F, fontSize: 10, color: C.faint, padding: "8px 4px 0", lineHeight: 1.4 }}>Sample data</div>
    </Card>
  );
}

/* ============================ BOARD ============================ */
/* `fi` (Finance screens): no legend, rows collapse single-child levels, sub-line "<kind> · N units",
   worst-first sorting, and the header + group row stay pinned while the table scrolls. */
function TreeCard({ title, Icon, testid, hintPeople, hintLoc, cols, open, top, mode, setMode, defSort, sub, agg = aggOf, fi }) {
  const [exP, toggleP] = useExpanded([PEOPLE_ROOT.key]);
  const [exL, toggleL] = useExpanded([LOC_ROOT.key]);
  const [sort, onSort, cmp] = useSort(cols, agg, defSort, fi ? FI_SORT : null);
  const people = mode === "people";
  const root = people ? PEOPLE_ROOT : LOC_ROOT;
  const rp = { t: root, depth: 0, expanded: people ? exP : exL, onToggle: people ? toggleP : toggleL, onOutlet: people ? undefined : open,
    cols, agg, cmp, sub, subFull: fi ? fiSub : undefined, collapse: !!fi };
  return (
    <Card style={TABLE_CARD} data-testid={`${testid}-card`}>
      <CardHead Icon={Icon} title={title} testid={testid}
        right={setMode && <Seg value={mode} onChange={setMode} opts={MODES} testid={`${testid}-mode`} />}
        hint={people ? hintPeople : hintLoc} />
      {top}
      {setMode && !fi && <Legend items={LEGEND[mode]} />}
      {fi ? (
        <>
          <div data-testid="pinned" style={{ position: "sticky", top: 0, zIndex: 3, background: C.card }}>
            <TreeHead cols={cols} sort={sort} onSort={onSort} />
            <TreeRow key={root.key} {...rp} part="line" />
          </div>
          <TreeRow key={root.key + ":kids"} {...rp} part="kids" />
        </>
      ) : (
        <>
          <TreeHead cols={cols} sort={sort} onSort={onSort} />
          <TreeRow {...rp} />
        </>
      )}
    </Card>
  );
}
/* The Board is one scrolling page: key numbers, Target achievement, Leads to Retail, Lost leads,
   then every dashboard as a section (Insurance, Finance, Add-ons, Income per vehicle, Stock). The menu jumps to a section
   instead of opening a separate screen. */
const BOARD_SECTIONS = ["insurance", "finance", "addons", "income", "stock"];
function BoardScreen({ open, rates }) {
  const [mode, setMode] = useState("people");
  const g = aggOf(PEOPLE_ROOT);
  return (
    <div style={{ padding: "14px 14px 90px" }}>
      <PeriodLine />
      <MetricGrid testid="board-metrics" style={{ marginBottom: 12 }}>
        <MetricBox span hero label="Retail" value={nIN(g.retail)} after={`/ ${nIN(g.target)}`}
          sub={`${pctS(g.ach)} achieved`} sub2={`proj ${nIN(g.proj)}`}
          bar={{ value: g.ach, tick: div(g.proj, g.target) }} />
        <MetricBox label="Sales value" value={inr(g.value)} />
        <MetricBox label="Bookings" value={nIN(g.book)} />
      </MetricGrid>
      <TreeCard title="Target achievement" Icon={Target} testid="board-title" cols={BOARD_COLS} open={open} mode={mode} setMode={setMode}
        defSort={{ key: "r", dir: "desc" }}
        hintPeople="Tap a name to expand, a header to sort. Proj = month at today's pace."
        hintLoc="Tap a name to expand, an outlet to open it, a header to sort." />
      <section id="sec-funnel" data-testid="sec-funnel" style={{ marginTop: 14, scrollMarginTop: 8 }}>
        <FunnelSection open={open} />
      </section>
      <section id="sec-lost" data-testid="sec-lost" style={{ marginTop: 14, scrollMarginTop: 8 }}>
        <LostSection open={open} />
      </section>
      {BOARD_SECTIONS.map(k => (
        <section key={k} id={`sec-${k}`} data-testid={`sec-${k}`} style={{ marginTop: 14, scrollMarginTop: 8 }}>
          {k === "stock" ? <StockScreen open={open} embedded /> : <FinanceScreen which={k} open={open} rates={rates} embedded />}
        </section>
      ))}
    </div>
  );
}

/* ============================ FINANCE ============================ */
const FI_HINT = "Month to date · green/red = 5 pts (rates) or 5% (₹) better/worse than group";
const FIN = {
  insurance: {
    label: "Insurance", title: "Insurance", Icon: ShieldCheck, hint: FI_HINT, cols: () => INS_COLS, split: "ins",
    summary: (g) => [
      ["In-house insurance", pctS(g.insPct), `${nIN(g.ins)} of ${nIN(g.retail)} units`],
      ["Avg premium", rs(g.premAvg), "per in-house policy"],
      ["Policies", nIN(g.ins), `${inr(g.insPrem)} premium`],
    ],
  },
  finance: {
    label: "Finance", title: "Finance", Icon: Landmark, hint: FI_HINT, cols: () => FINC_COLS, split: "fin",
    summary: (g) => [
      ["In-house finance", pctS(g.finPct), `${pctS(g.finShare)} of loans`],
      ["Avg loan", lakh(g.loanAvg), `${pctS(g.ltv)} LTV`],
      ["Loans", nIN(g.fin), `${inr(g.loanAmt)} disbursed`],
    ],
  },
  addons: {
    label: "Add-ons", title: "Add-ons", Icon: ShoppingBag, hint: FI_HINT, cols: () => ADDON_COLS,
    summary: (g) => [
      ["Add-ons / scooter", rs(g.addPU), "acc + River Care"],
      ["Accessory attach", pctS(g.accPct), `avg bill ${rs(g.accBill)}`],
      ["River Care attach", pctS(g.rcPct), `${pctS(g.p5Sh)} Plus Five`],
    ],
  },
  income: {
    label: "Income per vehicle", title: "Income per vehicle", Icon: IndianRupee, cols: incomeCols,
    hint: "Epic River's earnings per scooter sold, at the rates in Admin → Payout & margin rates.",
    summary: (g) => [
      ["F&I and add-on income", inr(g.incTot), "month to date"],
      ["Income per scooter", rs(g.totPV), `${nIN(g.retail)} scooters sold`],
    ],
  },
};
function FinanceScreen({ which, open, rates, embedded }) {
  const d = FIN[which] || FIN.insurance;
  const [mode, setMode] = useState("people");
  const agg = aggWith(rates);           // cached per rate set, so the reference is stable
  const gi = agg(LOC_ROOT);             // the group, with income at these rates
  const cols = useMemo(() => d.cols(gi), [d, gi]);
  const summary = d.summary(gi);
  const n = summary.length;
  const top = (
    <MetricGrid testid="fin-summary" style={{ padding: "6px 0 12px" }}>
      {summary.map(([k, v, sub], i) => <MetricBox key={k} label={k} value={v} sub={sub} hero={!embedded && i === 0} span={n % 2 === 1 && i === 0} />)}
    </MetricGrid>
  );
  const card = (
      <TreeCard title={d.title} Icon={d.Icon} testid={`fin-${which}`} cols={cols} open={open} mode={mode} setMode={setMode} top={top}
        defSort={{ key: "name", dir: "desc" }} hintPeople={d.hint} hintLoc={d.hint} agg={agg} fi />
  );
  const split = d.split ? <SplitCard kind={d.split} /> : null;
  if (embedded) return <>{card}{split}</>;
  return (
    <div style={{ padding: "14px 14px 90px" }}>
      <PeriodLine />
      {card}
      {split}
    </div>
  );
}

/* ---------------- Company split: insurers / finance partners ----------------
   Rows = company with a slim share bar, share of in-house policies / loans, count and average.
   Scope = group, a state or a city (Locations order); the outlet page passes its outlet. */
const SPLIT_DEF = {
  ins: { title: "Insurers", Icon: ShieldCheck, count: "Policies", avgLabel: two("Avg", "premium"), avg: rs, word: "insurer", note: "Sample partner mix",
    hint: "Share of in-house policies by insurer. Tap a header to sort." },
  fin: { title: "Finance partners", Icon: Landmark, count: "Loans", avgLabel: two("Avg", "loan"), avg: lakh, word: "lender",
    note: "Lenders: evfin and its reported co-lending partners · shares are sample data",
    hint: "Share of in-house loans by lender. Tap a header to sort." },
};
const SCOPES = (() => {
  const out = [{ t: LOC_ROOT, label: LOC_ROOT.name }];
  LOC_ROOT.kids().forEach(st => {
    out.push({ t: st, label: st.name });
    st.kids().forEach(c => out.push({ t: c, label: `\u00A0\u00A0${c.name}` }));
  });
  return out;
})();
const SCOPE_BY_KEY = Object.fromEntries(SCOPES.map(x => [x.t.key, x.t]));
const SPLIT_COLS = (d) => [
  { key: "share", label: "Share", w: 44, sort: (r) => r.share },
  { key: "n", label: d.count, w: 52, sort: (r) => r.n },
  { key: "avg", label: d.avgLabel, w: 56, align: "right", sort: (r) => r.avg },
];
function SplitCard({ kind, scope: fixed, compact }) {
  const d = SPLIT_DEF[kind];
  const [scopeKey, setScopeKey] = useState(LOC_ROOT.key);
  const [sort, setSort] = useState({ key: "share", dir: "desc" });
  const scope = fixed || SCOPE_BY_KEY[scopeKey];
  const s = splitOf(kind, scope);
  const cols = useMemo(() => SPLIT_COLS(d), [d]);
  const col = cols.find(c => c.key === sort.key);
  const sgn = sort.dir === "asc" ? 1 : -1;
  const rows = [...s.rows].sort((x, y) => (col ? sgn * (col.sort(x) - col.sort(y)) : sgn * x.name.localeCompare(y.name))
    || y.n - x.n || x.name.localeCompare(y.name));
  const cellW = (c) => ({ width: c.w, flexShrink: 0, textAlign: c.align || "center", paddingRight: c.align === "right" ? 4 : 0 });
  const avgTxt = (v) => <span style={{ fontFamily: F, fontSize: 11, fontWeight: 600, color: C.faint, whiteSpace: "nowrap" }}>{d.avg(v)}</span>;
  const nameCell = (title, sub, bar, strong) => (
    <span style={{ flex: 1, minWidth: 0, padding: "0 8px 0 6px" }}>
      <span style={{ display: "block", fontFamily: F, fontSize: 12.5, fontWeight: strong ? 800 : 600, color: C.ink,
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</span>
      {sub != null && <span style={{ display: "block", fontFamily: F, fontSize: 10, color: C.faint, marginTop: 1,
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sub}</span>}
      {bar != null && (
        <span style={{ display: "block", position: "relative", height: 3, borderRadius: 999, background: "#ECEEF4", marginTop: 5 }}>
          <span style={{ position: "absolute", left: 0, top: 0, bottom: 0, borderRadius: 999, background: C.primary, width: `${clamp(bar * 100, 0, 100)}%` }} />
        </span>
      )}
    </span>
  );
  return (
    <Card style={TABLE_CARD} data-testid={`split-${kind}`} data-scope={scope.key}>
      <CardHead Icon={d.Icon} title={d.title} testid={`split-${kind}-title`} hint={compact ? null : d.hint} />
      {!fixed && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 4px 9px" }}>
          <span style={{ fontFamily: F, fontSize: 11, color: C.faint }}>Showing:</span>
          <select data-testid={`split-${kind}-scope`} aria-label={`${d.title} scope`} value={scopeKey} onChange={e => setScopeKey(e.target.value)}
            style={{ minWidth: 0, maxWidth: 200, fontFamily: F, fontSize: 11.5, fontWeight: 700, color: C.ink, background: C.card,
              border: `1.5px solid ${C.border}`, borderRadius: 8, padding: "3px 6px", cursor: "pointer", outline: "none" }}>
            {SCOPES.map(x => <option key={x.t.key} value={x.t.key}>{x.label}</option>)}
          </select>
        </div>
      )}
      <TreeHead cols={cols} sort={sort} onSort={(k) => setSort(x => nextSort(x, k))} />
      <div data-testid="split-total" data-n={s.n} data-amt={s.amt} style={{ display: "flex", alignItems: "center", minHeight: 44,
        borderBottom: `1px solid ${C.border}`, background: DEPTH_BG[0], borderLeft: `3px solid ${C.ink}` }}>
        {nameCell(fixed ? fixed.name : scope.name, `${nIN(s.n)} ${d.count.toLowerCase()} · ${s.rows.length} ${d.word}${s.rows.length === 1 ? "" : "s"}`, null, true)}
        <span style={cellW(cols[0])}>{num(s.n ? "100%" : "—", true)}</span>
        <span style={cellW(cols[1])}>{num(nIN(s.n), true)}</span>
        <span style={cellW(cols[2])}>{avgTxt(s.avg)}</span>
      </div>
      {rows.map(r => (
        <div key={r.key} data-testid="split-row" data-name={r.name} data-n={r.n} data-amt={r.amt} data-share={r.share}
          style={{ display: "flex", alignItems: "center", minHeight: 42, borderBottom: `1px solid ${C.border}`, borderLeft: "3px solid transparent" }}>
          {nameCell(r.name, null, r.share)}
          <span style={cellW(cols[0])}>{num(pctS(r.share), true, 12)}</span>
          <span style={cellW(cols[1])}>{num(nIN(r.n), false, 12)}</span>
          <span style={cellW(cols[2])}>{avgTxt(r.avg)}</span>
        </div>
      ))}
      <div style={{ fontFamily: F, fontSize: 10, color: C.faint, padding: "8px 4px 0", lineHeight: 1.4 }}>{d.note}</div>
    </Card>
  );
}

/* ============================ STOCK ============================ */
function StockScreen({ open, embedded }) {
  const [ex, toggle] = useExpanded([LOC_ROOT.key]);
  const [sort, onSort, cmp] = useSort(STOCK_COLS, stockOf, { key: "u", dir: "desc" });
  return (
    <div style={embedded ? undefined : { padding: "14px 14px 90px" }}>
      <div style={{ fontFamily: F, fontSize: 11, color: C.faint, margin: "0 0 9px 4px" }}>{embedded ? "Stock · today, ex-showroom value" : "Today · ex-showroom value"}</div>
      <Card style={TABLE_CARD}>
        <CardHead Icon={Package} title="Stock" testid="stock-title" hint="Tap a name to expand, a header to sort. 90+ days is aged stock." />
        <TreeHead cols={STOCK_COLS} sort={sort} onSort={onSort} />
        <TreeRow t={LOC_ROOT} depth={0} expanded={ex} onToggle={toggle} onOutlet={open} cols={STOCK_COLS} agg={stockOf} cmp={cmp} />
      </Card>
    </div>
  );
}

/* ---------------- Outlet stock card ---------------- */
const SWATCH = {
  "Monsoon Blue": ["Blue", "#2F5BA8"], "Summer Red": ["Red", "#C8352E"], "Spring Yellow": ["Yellow", "#E9B800"],
  "Winter White": ["White", "#F4F4F0"], "Storm Grey": ["Grey", "#6B7280"],
};
function StockCard({ id }) {
  const s = stockFor(id);
  const units = (v, c) => { const l = s.lines.find(x => x.variant === v && x.colour === c); return l ? l.units : 0; };
  const age = [0, 1, 2, 3].map(b => s.lines.reduce((x, l) => x + l.buckets[b], 0));
  const grid = { display: "grid", gridTemplateColumns: "42px repeat(5, minmax(0,1fr)) 40px", alignItems: "center" };
  const head = { fontFamily: F, fontSize: 9, fontWeight: 800, color: C.sub, textTransform: "uppercase", letterSpacing: 0.2, textAlign: "center" };
  return (
    <Card data-testid="outlet-stock">
      <CardHead Icon={Package} title="Stock" testid="outlet-stock-title" hint={`Today · ${inr(s.value)} ex-showroom`}
        right={<span data-testid="outlet-stock-total" data-total={s.total} style={{ fontFamily: F, fontSize: 13, fontWeight: 800, color: C.ink }}>{nIN(s.total)} units</span>} />
      <div style={{ ...grid, padding: "4px 4px 7px", borderBottom: `1.5px solid ${C.borderStrong}` }}>
        <span />
        {COLOURS.map(c => (
          <span key={c} title={c} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: SWATCH[c][1], border: `1px solid ${C.borderStrong}` }} />
            <span style={{ ...head, fontSize: 8.5 }}>{SWATCH[c][0]}</span>
          </span>
        ))}
        <span style={{ ...head, textAlign: "right" }}>Total</span>
      </div>
      {VARIANTS.map(v => {
        const row = COLOURS.map(c => units(v.key, c));
        return (
          <div key={v.key} data-testid="outlet-stock-row" style={{ ...grid, padding: "9px 4px", borderBottom: `1px solid ${C.border}` }}>
            <span style={{ fontFamily: F, fontSize: 12, fontWeight: 700, color: C.ink }}>{v.key}</span>
            {row.map((n, i) => <span key={i} style={{ textAlign: "center", fontFamily: F, fontSize: 12.5, fontWeight: 600, color: n ? C.sub : C.ghost }}>{n}</span>)}
            <span style={{ textAlign: "right", fontFamily: F, fontSize: 12.5, fontWeight: 700, color: C.ink }}>{nIN(row.reduce((a, b) => a + b, 0))}</span>
          </div>
        );
      })}
      <div data-testid="outlet-stock-age" style={{ fontFamily: F, fontSize: 11.5, color: C.sub, padding: "10px 4px 2px" }}>
        {["0–30", "31–60", "61–90", "90+"].map((k, i) => (
          <React.Fragment key={k}>{i > 0 && " · "}
            <span style={{ color: i === 3 && age[3] > 0 ? C.hot : C.sub, fontWeight: i === 3 && age[3] > 0 ? 700 : 500 }}>{k}: {age[i]}</span>
          </React.Fragment>
        ))}
      </div>
      <div style={{ fontFamily: F, fontSize: 10.5, color: C.faint, padding: "3px 4px 0" }}>Age in days · plus {s.demo} demo scooter{s.demo === 1 ? "" : "s"}</div>
    </Card>
  );
}

/* ============================ OUTLET PAGE ============================ */
function OutletScreen({ id, onBack, rates }) {
  const l = LOC_BY_ID[id];
  const only = useMemo(() => Object.assign(new Set(l.ses), { tag: "o" + l.id }), [l]);
  const root = peopleNode(NODES[l.smId], only);
  const [ex, toggle] = useExpanded([root.key]);
  const [sort, onSort, cmp] = useSort(BOARD_COLS, aggOf, { key: "r", dir: "desc" });
  const a = withIncome(derive(sumIdx(l.ses)), rates);
  const outletScope = useMemo(() => ({ key: "O:" + l.id, name: l.locality, ses: l.ses }), [l]);
  const gi = aggWith(rates)(LOC_ROOT);
  // One colour on the glass: the green / red verdict is spelled out in the grey group line.
  const verdict = (tone) => (tone === C.green ? " · better" : tone === C.hot ? " · worse" : "");
  const line = (k, v, tone, gv, sub) => (
    <MetricBox key={k} testid="outlet-fin-row" hero={k === line.hero} label={k} value={v} sub={sub} sub2={`group ${gv}${verdict(tone)}`} />
  );
  line.hero = "In-house insurance";
  return (
    <div data-testid="outlet-page" style={{ padding: "14px 14px 90px" }}>
      <BackBar title={l.name} sub={`${l.city} · ${l.state}`} onBack={onBack} />
      <div style={{ fontFamily: F, fontSize: 11.5, color: C.sub, margin: "0 0 12px 40px", lineHeight: 1.5 }}>
        {l.format} · opened {monthLabel(l.opened)}{l.isNew ? " · new outlet" : ""}
        {l.real && <div style={{ color: C.faint, fontSize: 11 }}>{l.address}</div>}
        {l.real && <div style={{ display: "flex", alignItems: "center", gap: 5, color: C.faint, fontSize: 11 }}><Phone size={11} color={C.faint} />{l.phone}</div>}
      </div>
      <PeriodLine />
      <Card style={TABLE_CARD}>
        <CardHead Icon={Target} title="Target achievement" testid="outlet-board" hint="Tap a name to expand. Proj = month at today's pace." />
        <Legend items={LEGEND.people.slice(2)} />
        <TreeHead cols={BOARD_COLS} sort={sort} onSort={onSort} />
        <TreeRow t={root} depth={0} expanded={ex} onToggle={toggle} cols={BOARD_COLS} agg={aggOf} cmp={cmp} />
      </Card>
      <Card>
        <CardHead Icon={IndianRupee} title="Finance" testid="outlet-fin"
          hint={`This outlet, ${nIN(a.retail)} units, with the group in grey. Better / worse = 5 pts or 5% vs group.`} />
        <MetricGrid style={{ marginTop: 4 }}>
        {line("In-house insurance", pctS(a.insPct), rateTone(a.insPct, G.insPct, a.retail), pctS(G.insPct), `${nIN(a.ins)} of ${nIN(a.retail)} units`)}
        {line("Avg premium", rs(a.premAvg), rsTone(a.premAvg, G.premAvg, a.retail, a.ins), rs(G.premAvg), `${nIN(a.ins)} policies · ${inr(a.insPrem)}`)}
        {line("In-house finance", pctS(a.finPct), rateTone(a.finPct, G.finPct, a.retail), pctS(G.finPct), `${pctS(a.finShare)} of loans · group ${pctS(G.finShare)}`)}
        {line("Avg loan", lakh(a.loanAvg), rsTone(a.loanAvg, G.loanAvg, a.retail, a.fin), lakh(G.loanAvg), `${nIN(a.fin)} loans · ${pctS(a.ltv)} LTV`)}
        {line("Add-ons ₹/scooter", rs(a.addPU), rsTone(a.addPU, G.addPU, a.retail), rs(G.addPU), "accessories + River Care")}
        {line("Income per scooter", rs(a.totPV), rsTone(a.totPV, gi.totPV, a.retail), rs(gi.totPV), "at Admin → Payout & margin rates")}
        </MetricGrid>
      </Card>
      <SplitCard kind="ins" scope={outletScope} compact />
      <SplitCard kind="fin" scope={outletScope} compact />
      <StockCard id={l.id} />
    </div>
  );
}

/* ============================ REPORTS / ACCOUNT ============================ */
function ReportsScreen({ showToast }) {
  const reps = [["Daily flash", "Retail, bookings and value by outlet — today and MTD"],
    ["Finance MIS", "Insurance, finance, add-ons and dealer income by outlet"],
    ["Stock ageing", "Units and ₹ by age, variant and colour"],
    ["People roster", `${PEOPLE_COUNT} people on the reporting line`]];
  return (
    <div style={{ padding: "14px 14px 90px" }}>
      <ScreenHead title="Reports" blurb="Group reports as a sheet, sent to your email." />
      {reps.map(([t, s]) => (
        <Card key={t} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px" }}>
          <FileText size={16} color={C.primary} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: F, fontSize: 13, fontWeight: 800, color: C.ink }}>{t}</div>
            <div style={{ fontFamily: F, fontSize: 11, color: C.faint }}>{s}</div>
          </div>
          <button type="button" onClick={() => showToast(`${t} — CSV sent to your email`)} style={{ border: `1.5px solid ${C.borderStrong}`, background: C.card, borderRadius: 9, padding: "6px 10px", fontFamily: F, fontSize: 11.5, fontWeight: 700, color: C.sub, cursor: "pointer" }}>CSV</button>
        </Card>
      ))}
    </div>
  );
}
const inputStyle = { width: "100%", boxSizing: "border-box", border: `1.5px solid ${C.borderStrong}`, borderRadius: 9,
  padding: "9px 11px", fontFamily: F, fontSize: 13, color: C.ink, background: C.card, outline: "none" };
function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontFamily: F, fontSize: 10, fontWeight: 800, color: C.faint, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 5 }}>{label}</div>
      {children}
    </div>
  );
}
function PrimaryBtn({ children, onClick, disabled, full }) {
  return <button type="button" onClick={onClick} disabled={disabled} style={{ width: full ? "100%" : "auto", padding: "12px 18px", borderRadius: 10, border: "none",
    background: disabled ? C.borderStrong : C.primary, color: "#fff", fontFamily: F, fontWeight: 800, fontSize: 13, cursor: disabled ? "default" : "pointer" }}>{children}</button>;
}
function GhostBtn({ children, onClick, tone }) {
  return <button type="button" onClick={onClick} style={{ padding: "10px 14px", borderRadius: 10, cursor: "pointer", border: `1.5px solid ${C.borderStrong}`,
    background: C.card, color: tone || C.sub, fontFamily: F, fontWeight: 700, fontSize: 12.5 }}>{children}</button>;
}
function ChipBtn({ on, label, onClick }) {
  return (
    <button type="button" onClick={onClick} style={{ padding: "7px 11px", borderRadius: 9, cursor: "pointer",
      border: `1.5px solid ${on ? C.primary : C.border}`, background: on ? C.primarySoft : C.card, color: on ? C.primary : C.sub,
      fontFamily: F, fontWeight: 700, fontSize: 11.5 }}>{label}</button>
  );
}
function MyAccountScreen({ showToast }) {
  const [name, setName] = useState(CEO_NODE.name);
  const [email, setEmail] = useState("arvind.kesavan@autoprism.in");
  return (
    <div style={{ padding: "14px 14px 90px" }}>
      <ScreenHead title="My Account" blurb="Your login details." />
      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <span style={{ width: 46, height: 46, borderRadius: "50%", background: C.ink, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F, fontWeight: 800, fontSize: 15 }}>AK</span>
          <span style={{ fontFamily: F, fontSize: 12, color: C.sub }}>Group CEO · {GROUP.name} ({GROUP.parent})</span>
        </div>
        <Field label="Profile name"><input style={inputStyle} value={name} onChange={e => setName(e.target.value)} /></Field>
        <Field label="Email ID"><input style={inputStyle} value={email} onChange={e => setEmail(e.target.value)} /></Field>
        <Field label="Scope"><div style={{ fontFamily: F, fontSize: 12.5, color: C.ink }}>{LOCS.length} outlets · {PEOPLE_COUNT} people · {ZONES.length} zones</div></Field>
        <PrimaryBtn full onClick={() => showToast("Profile updated")}>Save changes</PrimaryBtn>
      </Card>
    </div>
  );
}

/* ============================ ADMIN ============================ */
function AdminFieldsScreen({ cfs, setCfs, showToast }) {
  const [creating, setCreating] = useState(false);
  const [openKey, setOpenKey] = useState(null);
  const [name, setName] = useState(""); const [applies, setApplies] = useState("Locations"); const [vals, setVals] = useState("");
  const [ruleMonths, setRuleMonths] = useState(12);
  const std = [
    { key: "state", label: "State", applies: "Locations", kind: "Standard" }, { key: "city", label: "City", applies: "Locations", kind: "Standard" },
    { key: "loc", label: "Location", applies: "Locations", kind: "Standard" }, { key: "cluster", label: "Cluster", applies: "Locations", kind: "Custom" },
    { key: "format", label: "Format", applies: "Locations", kind: "Custom" }, { key: "isNew", label: "New outlet", applies: "Locations", kind: "Custom", rule: "Opened in the last 12 months" },
  ];
  const countsFor = (f) => {
    const m = new Map();
    if (f.applies === "People") SES.forEach(s => { const k = seKey(f.key, s, cfs); m.set(k, (m.get(k) || 0) + 1); });
    else LOCS.forEach(l => { const k = locKey(f.key, l, cfs); m.set(k, (m.get(k) || 0) + 1); });
    return [...m.entries()].map(([k, n]) => [labelOf(f.key, k), n]).sort((a, b) => b[1] - a[1]);
  };
  const upload = (cf) => {
    const vs = cf.values.length ? cf.values : ["A", "B"];
    const r = rngFor("upload:" + cf.key);
    const ids = cf.applies === "People" ? SES.map(s => s.id) : LOCS.map(l => l.id);
    const assign = {}; ids.forEach(id => { if (r() > 0.06) assign[id] = vs[Math.floor(r() * vs.length)]; });
    setCfs(list => list.map(x => x.key === cf.key ? { ...x, assign, source: "Excel upload" } : x));
    showToast(`${Object.keys(assign).length} of ${ids.length} ${cf.applies.toLowerCase()} assigned — ${ids.length - Object.keys(assign).length} left Unassigned`);
  };
  const applyRule = (cf) => {
    const assign = {}; LOCS.forEach(l => { assign[l.id] = l.mo < ruleMonths ? "Yes" : "No"; });
    setCfs(list => list.map(x => x.key === cf.key ? { ...x, values: ["Yes", "No"], assign, source: `Rule: opened in the last ${ruleMonths} months` } : x));
    showToast(`Rule applied to ${LOCS.length} locations`);
  };
  const all = [...std, ...cfs.map(c => ({ ...c, kind: "Custom · new" }))];
  return (
    <div style={{ padding: "14px 14px 90px" }}>
      <ScreenHead title="Fields" blurb="Fields on locations and people. Values left blank show as Unassigned."
        right={!creating && <button type="button" onClick={() => setCreating(true)} style={{ display: "inline-flex", alignItems: "center", gap: 4, border: "none", borderRadius: 9, background: C.primary, color: "#fff", fontFamily: F, fontWeight: 800, fontSize: 12, padding: "8px 11px", cursor: "pointer" }}><Plus size={13} />Field</button>} />
      {creating && (
        <Card>
          <Field label="Field name"><input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Mall outlet" /></Field>
          <Field label="Applies to">
            <div style={{ display: "flex", gap: 6 }}>{["Locations", "People"].map(a => <ChipBtn key={a} on={applies === a} label={a} onClick={() => setApplies(a)} />)}</div>
          </Field>
          <Field label="Values (comma separated)"><input style={inputStyle} value={vals} onChange={e => setVals(e.target.value)} placeholder="e.g. Yes, No" /></Field>
          <div style={{ display: "flex", gap: 8 }}>
            <PrimaryBtn disabled={!name.trim()} onClick={() => {
              const key = "cf_" + name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_") + "_" + (cfs.length + 1);
              setCfs(l => [...l, { key, label: name.trim(), applies, values: vals.split(",").map(v => v.trim()).filter(Boolean), assign: {}, source: "Not assigned yet" }]);
              setCreating(false); setName(""); setVals(""); setOpenKey(key); showToast(`Field "${name.trim()}" created`);
            }}>Create field</PrimaryBtn>
            <GhostBtn onClick={() => setCreating(false)}>Cancel</GhostBtn>
          </div>
        </Card>
      )}
      {all.map(f => {
        const isOpen = openKey === f.key;
        const cf = cfs.find(c => c.key === f.key);
        const counts = isOpen ? countsFor(f) : [];
        return (
          <Card key={f.key} style={{ padding: "12px 14px" }}>
            <button type="button" data-testid="field-row" onClick={() => setOpenKey(isOpen ? null : f.key)} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontFamily: F, fontSize: 13, fontWeight: 800, color: C.ink }}>{f.label}</span>
                <span style={{ display: "block", fontFamily: F, fontSize: 10.5, color: C.faint }}>{f.kind} · {f.applies}{f.rule ? ` · ${f.rule}` : cf ? ` · ${cf.source}` : ""}</span>
              </span>
              <ChevronDown size={14} color={C.ghost} style={{ transform: isOpen ? "rotate(180deg)" : "none" }} />
            </button>
            {isOpen && (
              <div style={{ marginTop: 10 }}>
                {counts.slice(0, 12).map(([v, n]) => (
                  <div key={v} style={{ display: "flex", fontFamily: F, fontSize: 12, padding: "5px 0", borderTop: `1px solid ${C.border}` }}>
                    <span style={{ flex: 1, color: v === "Unassigned" ? C.warm : C.ink, fontWeight: 600 }}>{v}</span>
                    <span style={{ color: C.sub }}>{n} {f.applies === "People" ? "SEs" : "outlets"}</span>
                  </div>
                ))}
                {counts.length > 12 && <div style={{ fontFamily: F, fontSize: 11, color: C.faint, paddingTop: 4 }}>+ {counts.length - 12} more values</div>}
                {cf && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                    <GhostBtn onClick={() => upload(cf)}><span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><Upload size={13} />Upload Excel</span></GhostBtn>
                    {cf.applies === "Locations" && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                        <GhostBtn onClick={() => applyRule(cf)}>Rule: opened in last</GhostBtn>
                        <input aria-label="Months" type="number" min={1} max={36} value={ruleMonths} onChange={e => setRuleMonths(Number(e.target.value) || 12)} style={{ ...inputStyle, width: 54, padding: "8px 6px" }} />
                        <span style={{ fontFamily: F, fontSize: 11.5, color: C.sub }}>months</span>
                      </span>
                    )}
                    <GhostBtn tone={C.hot} onClick={() => { setCfs(l => l.filter(x => x.key !== cf.key)); showToast(`Field "${cf.label}" deleted`); }}>Delete</GhostBtn>
                  </div>
                )}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
/* Payout & margin rates — what Epic River earns on each sale. In memory; Save recomputes
   Finance → Income per vehicle and the outlet pages. */
const RATE_PCT = ["ins", "pay", "acc", "rc"];
function AdminRatesScreen({ rates, setRates, showToast }) {
  const toDraft = (r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, String(v)]));
  const [d, setD] = useState(() => toDraft(rates));
  const parsed = Object.fromEntries(Object.entries(d).map(([k, v]) => [k, v.trim() === "" ? NaN : Number(v)]));
  const valid = Object.entries(parsed).every(([k, v]) => Number.isFinite(v) && v >= 0 && (!RATE_PCT.includes(k) || v <= 100));
  const changed = Object.keys(rates).some(k => parsed[k] !== rates[k]);
  const gi = withIncome(G, valid ? parsed : rates);
  const unit = (t) => <span style={{ fontFamily: F, fontSize: 12, color: C.sub, whiteSpace: "nowrap" }}>{t}</span>;
  const box = (k, w = 76) => (
    <input data-testid={`rate-${k}`} inputMode="decimal" value={d[k]} onChange={e => setD(x => ({ ...x, [k]: e.target.value.replace(/[^0-9.]/g, "") }))}
      style={{ ...inputStyle, width: w, textAlign: "right", borderColor: Number.isFinite(parsed[k]) ? C.borderStrong : C.hot }} />
  );
  const row = (...xs) => <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>{xs.map((x, i) => <React.Fragment key={i}>{x}</React.Fragment>)}</div>;
  return (
    <div style={{ padding: "14px 14px 90px" }}>
      <ScreenHead title="Payout & margin rates" blurb="What Epic River earns on each sale. Used by Finance → Income per vehicle." />
      <Card>
        <Field label="Insurance commission">{row(box("ins"), unit("% of premium"))}</Field>
        <Field label="Lender payout">{row(
          box("pay"), unit("% of loan  +  ₹"),
          box("file"), unit("per file"))}</Field>
        <Field label="Accessory margin">{row(box("acc"), unit("% of accessory sales"))}</Field>
        <Field label="River Care margin">{row(box("rc"), unit("% of plan sales"))}</Field>
        <div data-testid="rates-preview" data-value={gi.totPV} style={{ borderTop: `1px solid ${C.border}`, padding: "11px 0 12px", marginTop: 2 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ flex: 1, fontFamily: F, fontSize: 12.5, fontWeight: 600, color: C.ink }}>Group income per scooter</span>
            <span style={{ fontFamily: F, fontSize: 15, fontWeight: 800, color: valid ? C.ink : C.faint }}>{rs(gi.totPV)}</span>
          </div>
          <div style={{ fontFamily: F, fontSize: 10.5, color: C.faint, marginTop: 2 }}>
            {valid ? `insurance ${rs(gi.insPV)} · finance ${rs(gi.finPV)} · add-ons ${rs(gi.addPV)}` : "Enter a number in every box (percentages up to 100)."}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <span data-testid="rates-save" style={{ flex: 1, display: "flex" }}>
            <PrimaryBtn full disabled={!valid || !changed} onClick={() => { setRates(parsed); showToast("Rates saved — Income per vehicle updated"); }}>Save rates</PrimaryBtn>
          </span>
          <GhostBtn onClick={() => setD(toDraft(DEFAULT_RATES))}>Defaults</GhostBtn>
        </div>
      </Card>
    </div>
  );
}
function AdminLocationsScreen({ cfs, open }) {
  const locCfs = cfs.filter(c => c.applies === "Locations");
  return (
    <div style={{ padding: "14px 14px 90px" }}>
      <ScreenHead title="Locations" blurb={`${LOCS.length} outlets and their fields. Read-only — fields are set under Fields.`} />
      <Card style={{ padding: "4px 14px" }}>
        {LOCS.map((l, i) => (
          <button key={l.id} type="button" data-testid="admin-loc" onClick={() => open(l.id)} style={{ display: "block", width: "100%", textAlign: "left", background: "none",
            border: "none", borderTop: i ? `1px solid ${C.border}` : "none", padding: "9px 0", cursor: "pointer" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ flex: 1, minWidth: 0, fontFamily: F, fontSize: 12.5, fontWeight: 700, color: C.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{l.locality}</span>
              <span style={{ fontFamily: F, fontSize: 10, color: C.faint }}>{l.id}</span>
            </span>
            <span style={{ display: "block", fontFamily: F, fontSize: 10.5, color: C.faint, marginTop: 2, lineHeight: 1.4 }}>
              {l.city} · {l.state} · {l.format} · {l.cluster} · opened {monthLabel(l.opened)}{l.isNew ? " · new" : ""}
              {locCfs.map(cf => ` · ${cf.label}: ${labelOf(cf.key, locKey(cf.key, l, cfs))}`).join("")}
            </span>
          </button>
        ))}
      </Card>
    </div>
  );
}

/* ============================ APP ============================ */
const NAV = [
  { key: "board", label: "Board", Icon: Target, subs: [] },
  { key: "funnel", label: "Leads to Retail", Icon: Filter, subs: [] },
  { key: "lost", label: "Lost leads", Icon: UserX, subs: [] },
  { key: "finance", label: "Finance", Icon: IndianRupee, subs: Object.entries(FIN).map(([k, d]) => ({ key: "finance:" + k, label: d.label })) },
  { key: "stock", label: "Stock", Icon: Package, subs: [] },
  { key: "reports", label: "Reports", Icon: FileText, subs: [] },
  { key: "admin", label: "Admin", Icon: Settings, subs: [
    { key: "admin:fields", label: "Fields" }, { key: "admin:locations", label: "Locations" },
    { key: "admin:rates", label: "Payout & margin rates" },
  ]},
  { key: "account", label: "My Account", Icon: User, subs: [] },
];

export default function CEOApp() {
  const [tab, setTab] = useState("board");
  const [openGroup, setOpenGroup] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cfs, setCfs] = useState([]);
  const [rates, setRates] = useState(DEFAULT_RATES);
  const [stack, setStack] = useState([]);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const scrollRef = useRef(null);
  const showToast = (m) => { setToast(m); clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToast(null), 2800); };

  const open = (id) => setStack(s => [...s, id]);
  const back = () => setStack(s => s.slice(0, -1));
  const [jump, setJump] = useState(null);
  const go = (key) => {
    setStack([]); setMenuOpen(false);
    const [b, sb] = String(key).split(":");
    if (b === "funnel" || b === "lost") { setTab("board"); setJump({ id: b, t: Date.now() }); return; }
    if (b === "finance" || b === "stock") { setTab("board"); setJump({ id: b === "stock" ? "stock" : sb, t: Date.now() }); return; }
    setJump(null); setTab(key);
  };
  useEffect(() => {
    if (!jump || !scrollRef.current) return;
    const el = scrollRef.current.querySelector(`#sec-${jump.id}`);
    if (el) scrollRef.current.scrollTo({ top: el.offsetTop - 8, behavior: "smooth" });
  }, [jump]);
  useEffect(() => { if (scrollRef.current && !jump) scrollRef.current.scrollTop = 0; }, [tab]);
  const [base, sub] = String(tab).split(":");
  const top = stack[stack.length - 1];

  return (
    <div style={{ width: "100%", maxWidth: 420, margin: "0 auto", height: "100vh", maxHeight: 900,
      background: C.bg, display: "flex", flexDirection: "column", position: "relative",
      borderRadius: 22, overflow: "hidden", boxShadow: "0 10px 40px rgba(0,0,0,.12)" }}>

      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "15px 14px 13px",
        background: C.card, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        <button aria-label="Menu" data-testid="menu-btn" onClick={() => setMenuOpen(true)}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
          <Menu size={20} color={C.ink} />
        </button>
        <span style={{ fontFamily: F, fontWeight: 900, fontSize: 16, letterSpacing: -0.8, color: C.ink }}>
          AUTOPRISM<span style={{ display: "inline-block", width: 5, height: 5, borderRadius: "50%", background: C.primary, marginLeft: 1, marginBottom: 8 }} />
        </span>
        <span style={{ flex: 1 }} />
        <span style={{ width: 30, height: 30, borderRadius: "50%", background: C.ink, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: F, fontWeight: 800, fontSize: 11.5 }}>AK</span>
      </div>

      <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
        <div ref={scrollRef} style={{ position: "absolute", inset: 0, overflowY: "auto", overflowX: "hidden" }}>
          {base === "board" && <BoardScreen open={open} rates={rates} />}
          {base === "finance" && <FinanceScreen key={sub} which={sub} open={open} rates={rates} />}
          {base === "stock" && <StockScreen open={open} />}
          {base === "reports" && <ReportsScreen showToast={showToast} />}
          {base === "account" && <MyAccountScreen showToast={showToast} />}
          {base === "admin" && (sub === "locations"
            ? <AdminLocationsScreen cfs={cfs} open={open} />
            : sub === "rates" ? <AdminRatesScreen rates={rates} setRates={setRates} showToast={showToast} />
            : <AdminFieldsScreen cfs={cfs} setCfs={setCfs} showToast={showToast} />)}
        </div>
        {top && (
          <div key={stack.length} style={{ position: "absolute", inset: 0, overflowY: "auto", overflowX: "hidden", background: C.bg, zIndex: 10 }}>
            <OutletScreen id={top} onBack={back} rates={rates} />
          </div>
        )}
      </div>

      {menuOpen && (
        <div style={{ position: "absolute", inset: 0, zIndex: 150, display: "flex" }}>
          <div onClick={() => setMenuOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(11,25,70,0.4)" }} />
          <div style={{ position: "relative", width: "78%", maxWidth: 280, height: "100%", background: C.card,
            boxShadow: "8px 0 32px rgba(0,0,0,0.18)", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "18px 18px 12px" }}>
              <div style={{ fontFamily: F, fontWeight: 900, fontSize: 15.5, color: C.ink, letterSpacing: -0.5 }}>
                AUTOPRISM<span style={{ display: "inline-block", width: 5, height: 5, borderRadius: "50%", background: C.primary, marginLeft: 1, marginBottom: 8 }} />
              </div>
              <div style={{ fontFamily: F, fontSize: 11.5, color: C.faint, marginTop: 3 }}>{CEO_NODE.name} · Group CEO, {GROUP.name}</div>
            </div>
            <div style={{ padding: "0 12px", flex: 1, overflowY: "auto" }}>
              {NAV.map(t => {
                const groupActive = t.subs.length ? t.subs.some(x => x.key === tab) : tab === t.key;
                const expanded = openGroup === t.key;
                return (
                  <div key={t.key} style={{ marginBottom: 2 }}>
                    <button data-testid={`nav-${t.key}`} onClick={() => { if (!t.subs.length) { go(t.key); return; } setOpenGroup(expanded ? null : t.key); }} style={{
                      display: "flex", alignItems: "center", gap: 11, width: "100%", padding: "11px 12px", borderRadius: 9, border: "none",
                      background: groupActive ? C.primarySoft : "none", cursor: "pointer", textAlign: "left" }}>
                      <t.Icon size={17} color={groupActive ? C.primary : C.faint} />
                      <span style={{ flex: 1, fontFamily: F, fontWeight: groupActive ? 700 : 500, fontSize: 14, color: groupActive ? C.primary : C.ink }}>{t.label}</span>
                      {t.subs.length > 0 && <ChevronDown size={14} color={C.ghost} style={{ transform: expanded ? "rotate(180deg)" : "none" }} />}
                    </button>
                    {expanded && t.subs.map(s => (
                      <button key={s.key} data-testid={`nav-${s.key}`} onClick={() => go(s.key)} style={{
                        display: "flex", alignItems: "center", width: "100%", padding: "8px 12px 8px 40px", borderRadius: 8, border: "none",
                        background: tab === s.key ? C.primarySoft : "none", cursor: "pointer", textAlign: "left" }}>
                        <span style={{ flex: 1, fontFamily: F, fontWeight: tab === s.key ? 700 : 500, fontSize: 13, color: tab === s.key ? C.primary : C.sub }}>{s.label}</span>
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
            <div style={{ padding: 14, borderTop: `1px solid ${C.border}` }}>
              <button onClick={() => setMenuOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: F, fontSize: 13, fontWeight: 700, color: C.hot }}>Sign out</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position: "absolute", bottom: 22, left: 14, right: 14, background: C.ink, color: "#fff", borderRadius: 11, padding: "12px 14px",
          fontFamily: F, fontSize: 13, fontWeight: 600, textAlign: "center", zIndex: 300 }}>{toast}</div>
      )}
    </div>
  );
}
