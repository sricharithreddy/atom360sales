import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  AlertTriangle, BarChart3, Bell, Bookmark, Building2, Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight,
  Crown, FileText, IndianRupee, MapPin, Menu, Package, Phone, Plus, Search, Settings, Store, Target, Trash2,
  Upload, User, Users, X,
} from "lucide-react";
import { GROUP, ZONES, LOCATIONS, monthsOpen } from "../data/epicRiverLocations.js";

/* ==================================================================================
   AUTOPRISM — CEO (Epic River, Raam Group)

   Built on the Manager app: same palette, header, grouped hamburger menu, Board home and
   Admin. The CEO sees 100 outlets and ~1,000 people on one reporting line.

   One rule runs through every screen: every number is summed from Sales Executives.
   A Group-by partitions SEs, so any grouping sums back to the same group total, and every
   ratio (achievement, conversion, retail per SE, discount per scooter, attach %) is
   computed from summed numerators and denominators — never an average of averages.
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
  : Math.abs(n) >= 1e7 ? `₹${(n / 1e7).toFixed(2)} Cr`
  : Math.abs(n) >= 1e5 ? `₹${(n / 1e5).toFixed(1)} L`
  : rs(n);
const kRs = (n) => !ok(n) ? "—" : n >= 1000 ? `₹${(n / 1000).toFixed(1).replace(/\.0$/, "")}k` : `₹${Math.round(n)}`;
const pctS = (x, d = 0) => (ok(x) ? `${(x * 100).toFixed(d)}%` : "—");
const gS = (x) => (ok(x) ? `${x >= 0 ? "+" : "−"}${Math.abs(x * 100).toFixed(0)}%` : "—");
const div = (a, b) => (b ? a / b : null);
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

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

/* ---------------- Calendar: "today" is 19 Nov 2026 ---------------- */
const MI = (y, m) => y * 12 + m - 1;
const NOW_MI = MI(2026, 11);
const daysIn = (mi) => new Date(Math.floor(mi / 12), (mi % 12) + 1, 0).getDate();
const DAY = 19;
const fullMonths = (from, to) => { const o = []; for (let m = from; m <= to; m++) o.push([m, 1]); return o; };
const PERIODS = {
  month: {
    key: "month", label: "Month", sub: "Nov 2026 · MTD · day 19 of 30", E: 19, L: 30,
    act: [[NOW_MI, DAY / 30]], tgt: [[NOW_MI, 1]],
    prev: [[NOW_MI - 1, DAY / 31]], ly: [[NOW_MI - 12, DAY / 30]],
    prevShort: "vs LM same date", prevLong: "last month, same date (1–19 Oct)",
  },
  quarter: {
    key: "quarter", label: "Quarter", sub: "Q3 FY27 (Oct–Dec) · QTD · day 50 of 92", E: 50, L: 92,
    act: [[MI(2026, 10), 1], [NOW_MI, DAY / 30]], tgt: fullMonths(MI(2026, 10), MI(2026, 12)),
    prev: [[MI(2026, 7), 1], [MI(2026, 8), DAY / 31]], ly: [[MI(2025, 10), 1], [MI(2025, 11), DAY / 30]],
    prevShort: "vs LQ same date", prevLong: "last quarter, same date",
  },
  year: {
    key: "year", label: "Year", sub: "FY 2026–27 · YTD · day 233 of 365", E: 233, L: 365,
    act: [...fullMonths(MI(2026, 4), MI(2026, 10)), [NOW_MI, DAY / 30]], tgt: fullMonths(MI(2026, 4), MI(2027, 3)),
    prev: [...fullMonths(MI(2025, 4), MI(2025, 10)), [MI(2025, 11), DAY / 30]],
    ly: [...fullMonths(MI(2025, 4), MI(2025, 10)), [MI(2025, 11), DAY / 30]],
    prevShort: "vs LY same date", prevLong: "last year, same date (all outlets)",
  },
};
const CMP_OPTS = (P) => [
  { value: "target", label: "vs Target" },
  { value: "prev", label: P.prevShort },
  { value: "ly", label: "vs LY same-store" },
];

/* ---------------- Product ---------------- */
const P750 = 154799, P480 = 150799;   // ex-showroom after PM E-DRIVE subsidy
const VARIANTS = [{ key: "750W", price: P750 }, { key: "480W", price: P480 }];
const COLOURS = ["Monsoon Blue", "Summer Red", "Spring Yellow", "Winter White", "Storm Grey"];
const COLOUR_W = [0.26, 0.16, 0.14, 0.2, 0.24];
const AGE_BUCKETS = ["0–30", "31–60", "61–90", "90+"];
const AGE_MID = [15, 45, 75, 110];

/* ---------------- Network: 100 outlets, as-is from the dataset ---------------- */
const ZONE_LABEL = Object.fromEntries(ZONES.map(z => [z.key, z.label]));
const FORMAT_BASE = { Flagship: 140, Store: 68, Express: 28 };   // mature monthly retail target
const SE_RANGE = { Flagship: [13, 15], Store: [7, 9], Express: [3, 5] };
const DEMO_UNITS = { Flagship: 3, Store: 2, Express: 1 };
const ramp = (m) => (m < 0 ? 0 : Math.min(1, 0.6 + (0.4 * (m + 1)) / 12));
const DEFAULT_TH = {
  on: 95, risk: 80, pace: 90,
  limit: { Flagship: 3000, Store: 2500, Express: 2500 },
  cancelUnits: 3, stockAge: 90, interest: 10,
};

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
    l.fin = rr(q, 0.36, 0.64); l.p2 = rr(q, 0.16, 0.34); l.p5 = rr(q, 0.06, 0.18);
    l.acc = rr(q, 1100, 3600); l.exch = rr(q, 0.07, 0.22); l.mix = rr(q, 0.6, 0.8);
    l.obRate = rr(q, 0.3, 0.6); l.tdr = rr(q, 0.32, 0.55); l.bkr = rr(q, 0.08, 0.24);
    l.avgPrice = l.mix * P750 + (1 - l.mix) * P480;
  });
})();
// Calibrate so the group's full-month November target is ≈ 5,900 scooters.
const CAL = 5900 / LOCS.reduce((s, l) => s + FORMAT_BASE[l.format] * l.scale * ramp(NOW_MI - l.openMi), 0);
const tgtM = (l, mi) => FORMAT_BASE[l.format] * l.scale * ramp(mi - l.openMi) * CAL;
const perf = (l, mi) => mi === NOW_MI ? l.factor
  : clamp(1 + (l.factor - 1) * 0.55 + (rngFor(l.id + ":" + mi)() - 0.5) * 0.18, 0.5, 1.3);

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
const ROLE_LABEL = { CEO: "Group CEO", ZH: "Zone head", AM: "Area manager", SM: "Sales manager", TL: "Team lead", SE: "Sales executive" };
const ROLE_TONE = { CEO: "#0B1946", ZH: "#3B4BE8", AM: "#6D28D9", SM: "#0B1946", TL: "#00695C", SE: "#AEB4CB" };

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
        dpsF: l.dpsF * rr(q, 0.85, 1.15), fin: clamp(l.fin * rr(q, 0.8, 1.2), 0, 0.95),
        p2: l.p2 * rr(q, 0.8, 1.2), p5: l.p5 * rr(q, 0.8, 1.2), acc: l.acc * rr(q, 0.8, 1.2),
        exch: l.exch * rr(q, 0.75, 1.25), mix: clamp(l.mix * rr(q, 0.9, 1.1), 0.4, 0.95),
      };
      node.seIdx = s.idx;
      SES.push(s);
      l.ses.push(s.idx);
    });
  });
  SES.forEach(s => { let n = s.node; while (n) { n.ses.push(s.idx); n = n.parent ? NODES[n.parent] : null; } });
  Object.values(NODES).forEach(n => { n.seSet = new Set(n.ses); });
})();
const ALL_SE = SES.map(s => s.idx);
const PEOPLE_COUNT = Object.keys(NODES).length;
const ROLE_COUNTS = Object.values(NODES).reduce((m, n) => ({ ...m, [n.role]: (m[n.role] || 0) + 1 }), {});

/* ---------------- Per-SE numbers for a period (computed once per period) ---------------- */
function nudge(A, T, P, plan) {
  // Rounding a small outlet's units can flip its status; keep each outlet in its planned band.
  const proj = (a) => (a * P.L) / P.E / T;
  for (let k = 0; k < 40 && T > 0; k++) {
    if (plan === "on" && proj(A) < 0.958) A++;
    else if (plan === "risk" && proj(A) >= 0.942) A--;
    else if (plan === "risk" && proj(A) < 0.81) A++;
    else if (plan === "off" && proj(A) >= 0.79) A--;
    else break;
  }
  return Math.max(0, A);
}
const sumOver = (list, f) => list.reduce((s, [mi, fr]) => s + f(mi) * fr, 0);
LOCS.forEach(l => {
  const P = PERIODS.month;
  l.monthTarget = Math.round(tgtM(l, NOW_MI));
  l.mtd = nudge(Math.round(sumOver(P.act, mi => tgtM(l, mi) * perf(l, mi))), l.monthTarget, P, l.plan);
  l.ob = Math.round(l.mtd * l.obRate);   // booked, not yet delivered — a point-in-time number
  l.obSplit = splitInt(l.ob, l.ses.map(i => SES[i].skill));
  l.mtdSplit = splitInt(l.mtd, l.ses.map(i => SES[i].skill));   // current daily pace drives every projection
});

const KEYS = ["heads", "mtd", "target", "retail", "book", "ob", "obVal", "leads", "td", "value", "tValue", "prev", "prevVal",
  "ly", "lyVal", "retSS", "lySS", "valSS", "lyValSS", "disc", "fin", "ins", "p2", "p5", "acc", "exch", "r750"];
const PCACHE = {};
function periodRows(pk) {
  if (PCACHE[pk]) return PCACHE[pk];
  const P = PERIODS[pk];
  const rows = new Array(SES.length);
  LOCS.forEach(l => {
    const T = Math.round(sumOver(P.tgt, mi => tgtM(l, mi)));
    const A = pk === "month" ? l.mtd : Math.round(sumOver(P.act, mi => tgtM(l, mi) * perf(l, mi)));
    const PV = Math.round(sumOver(P.prev, mi => tgtM(l, mi) * perf(l, mi)));
    const LY = Math.round(sumOver(P.ly, mi => tgtM(l, mi) * perf(l, mi)));
    const ss = !l.isNew;
    const sk = l.ses.map(i => SES[i].skill);
    const tA = splitInt(A, sk), tT = splitInt(T, l.ses.map(i => SES[i].tw));
    const tP = splitInt(PV, l.ses.map(i => SES[i].s2)), tL = splitInt(LY, l.ses.map(i => SES[i].s2));
    l.ses.forEach((i, k) => {
      const s = SES[i];
      const q = rngFor(s.id + ":" + pk);
      const retail = tA[k];
      const r750 = Math.round(retail * s.mix);
      const value = r750 * P750 + (retail - r750) * P480;
      const leads = Math.round(retail / s.conv + q() * P.E * 0.12);
      const prevVal = Math.round(tP[k] * l.avgPrice), lyVal = Math.round(tL[k] * l.avgPrice);
      rows[i] = {
        heads: 1, mtd: l.mtdSplit[k], target: tT[k], retail, book: retail + Math.round(retail * s.bkr),
        ob: l.obSplit[k], obVal: Math.round(l.obSplit[k] * l.avgPrice),
        leads, td: Math.round(leads * s.tdr), value, tValue: Math.round(tT[k] * l.avgPrice),
        prev: tP[k], prevVal, ly: tL[k], lyVal,
        retSS: ss ? retail : 0, lySS: ss ? tL[k] : 0, valSS: ss ? value : 0, lyValSS: ss ? lyVal : 0,
        disc: Math.round((retail * DEFAULT_TH.limit[l.format] * s.dpsF) / 10) * 10,
        fin: Math.round(retail * s.fin), ins: retail, p2: Math.round(retail * s.p2), p5: Math.round(retail * s.p5),
        acc: Math.round((retail * s.acc) / 10) * 10, exch: Math.round(retail * s.exch), r750,
      };
    });
  });
  PCACHE[pk] = rows;
  return rows;
}
function sumIdx(rows, idx) {
  const o = {}; KEYS.forEach(k => { o[k] = 0; });
  for (let j = 0; j < idx.length; j++) { const r = rows[idx[j]]; for (let k = 0; k < KEYS.length; k++) o[KEYS[k]] += r[KEYS[k]]; }
  return o;
}
function derive(a, P, th) {
  // Projection at current daily pace: period-to-date + (MTD ÷ 19 days) × days left.
  const projRaw = a.retail + (a.mtd / DAY) * (P.L - P.E);
  const projAch = div(projRaw, a.target);
  const status = projAch == null ? "none" : projAch >= th.on / 100 ? "on" : projAch >= th.risk / 100 ? "risk" : "off";
  return {
    ...a, ach: div(a.retail, a.target), proj: Math.round(projRaw), projAch, status,
    conv: div(a.retail, a.leads), perSE: div(a.retail, a.heads), dps: div(a.disc, a.retail),
    gPrev: a.prev ? a.retail / a.prev - 1 : null, gLY: a.lySS ? a.retSS / a.lySS - 1 : null,
    vPrev: a.prevVal ? a.value / a.prevVal - 1 : null, vLY: a.lyValSS ? a.valSS / a.lyValSS - 1 : null,
    gap: a.target - a.retail,
  };
}
const cmpVal = (d, cmp) => (cmp === "target" ? d.ach : cmp === "prev" ? d.gPrev : d.gLY);
const cmpTxt = (d, cmp) => (cmp === "target" ? pctS(d.ach) : cmp === "prev" ? gS(d.gPrev) : gS(d.gLY));

/* ---------------- Stock (point in time), approvals, cancellations ---------------- */
const STOCK = {};
LOCS.forEach(l => {
  const r = rngFor("stk:" + l.id);
  const total = Math.max(4, Math.round(l.monthTarget * rr(r, 0.6, 1.1)));
  const ageP = l.plan === "on" ? [0.56, 0.27, 0.11, 0.06] : l.plan === "risk" ? [0.46, 0.29, 0.15, 0.1] : [0.34, 0.29, 0.2, 0.17];
  const combos = [];
  VARIANTS.forEach((v, vi) => COLOURS.forEach((c, ci) => combos.push({
    variant: v.key, price: v.price, colour: c, w: (vi === 0 ? l.mix : 1 - l.mix) * COLOUR_W[ci] * rr(r, 0.5, 1.5),
    w2: (vi === 0 ? l.mix : 1 - l.mix) * COLOUR_W[ci] * rr(r, 0.3, 1.8),
  })));
  const units = splitInt(total, combos.map(c => c.w));
  const waiting = splitInt(l.ob, combos.map(c => c.w2));
  combos.forEach((c, k) => {
    c.b = splitInt(units[k], ageP.map(p => p * rr(r, 0.6, 1.4)));
    c.units = units[k]; c.waiting = waiting[k];
  });
  STOCK[l.id] = { combos, demo: DEMO_UNITS[l.format] };
});
const CUSTOMERS = ["Lakshmi Narayan", "Ravi Teja", "Neha Verma", "Amit Joshi", "Sneha Kulkarni", "Farhan Khan", "Priya Desai",
  "Anita Shetty", "George Thomas", "Meena Rao", "Deepa Menon", "Sanjay Gupta", "Kavya Iyer", "Rohit Sharma", "Nisha Patel",
  "Arun Das", "Pooja Nair", "Swift Last-Mile (fleet)", "GreenRoute Couriers (fleet)", "Campus Riders Co-op (fleet)"];
const APPROVALS_SEED = (() => {
  const r = rngFor("approvals");
  return Array.from({ length: 36 }, (_, k) => {
    const l = LOCS[Math.floor(r() * LOCS.length)];
    const se = SES[l.ses[Math.floor(r() * l.ses.length)]];
    const lim = DEFAULT_TH.limit[l.format];
    return {
      id: "A" + (k + 1), locId: l.id, seId: se.id, customer: CUSTOMERS[Math.floor(r() * CUSTOMERS.length)],
      variant: `Indie ${r() < l.mix ? "750W" : "480W"}${r() < 0.4 ? " + Plus Two" : r() < 0.2 ? " + Plus Five" : ""}`,
      ask: Math.round((lim * rr(r, 0.9, 2.1)) / 100) * 100, hours: ri(r, 1, 46),
    };
  });
})();
const CANCELS = (() => {
  const r = rngFor("cancels");
  const reasons = ["Finance not approved", "Bought another brand", "Delivery date slipped", "Fleet order downsized", "Family decision — postponed"];
  return Array.from({ length: 24 }, (_, k) => {
    const l = LOCS[Math.floor(r() * LOCS.length)];
    const x = r();
    const units = x < 0.55 ? 1 : x < 0.75 ? 2 : ri(r, 3, 8);
    return {
      id: "X" + (k + 1), locId: l.id, customer: units >= 3 ? CUSTOMERS[17 + (k % 3)] : CUSTOMERS[Math.floor(r() * 17)],
      units, value: Math.round(units * l.avgPrice), reason: reasons[Math.floor(r() * reasons.length)], days: ri(r, 0, 18),
    };
  });
})();
const stockAgg = (locIds, th) => {
  const o = { units: 0, value: 0, b: [0, 0, 0, 0], bv: [0, 0, 0, 0], aged: 0, agedVal: 0, interest: 0, demo: 0 };
  const agedFrom = th.stockAge >= 90 ? 3 : 2;
  locIds.forEach(id => {
    const s = STOCK[id];
    o.demo += s.demo;
    s.combos.forEach(c => c.b.forEach((n, bi) => {
      o.units += n; o.value += n * c.price; o.b[bi] += n; o.bv[bi] += n * c.price;
      o.interest += (n * c.price * (th.interest / 100) * AGE_MID[bi]) / 365;
      if (bi >= agedFrom) { o.aged += n; o.agedVal += n * c.price; }
    }));
  });
  return o;
};

/* ---------------- Fields & grouping ---------------- */
const UN = "__unassigned";
const STD_FIELDS = [
  { key: "line", label: "Reporting line" }, { key: "zone", label: "Zone" }, { key: "state", label: "State" },
  { key: "city", label: "City" }, { key: "cluster", label: "Cluster" }, { key: "format", label: "Format" },
  { key: "isNew", label: "New outlet" }, { key: "loc", label: "Location" }, { key: "sm", label: "Sales manager" },
];
function locKey(fk, l, cfs) {
  let v;
  switch (fk) {
    case "zone": v = l.zone; break;
    case "state": v = l.state; break;
    case "city": v = l.city; break;
    case "cluster": v = l.cluster; break;
    case "format": v = l.format; break;
    case "isNew": v = l.isNew ? "Yes" : "No"; break;
    case "loc": v = l.id; break;
    case "sm": v = l.smId; break;
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
  if (fk === "zone") return ZONE_LABEL[key] || key;
  if (fk === "loc") return LOC_BY_ID[key].locality;
  if (fk === "sm") return NODES[key].name;
  if (fk === "line") return NODES[key].name;
  return key;
}
function fieldLabel(fk, cfs) {
  const f = STD_FIELDS.find(x => x.key === fk) || cfs.find(x => x.key === fk);
  return f ? f.label : fk;
}
function groupOptions(cfs, { line = false, none = false, people = true } = {}) {
  const o = [];
  if (none) o.push({ value: "none", label: "No grouping" });
  STD_FIELDS.forEach(f => { if (f.key === "line" && !line) return; if (f.key === "sm" && line) return; o.push({ value: f.key, label: f.label }); });
  cfs.forEach(cf => { if (cf.applies === "Locations" || people) o.push({ value: cf.key, label: cf.label }); });
  return o;
}
function groupSEs(set, fk, cfs) {
  const m = new Map();
  set.forEach(i => { const k = seKey(fk, SES[i], cfs); if (!m.has(k)) m.set(k, []); m.get(k).push(i); });
  return [...m.entries()].map(([key, idx]) => ({ key, label: labelOf(fk, key), idx }));
}
function groupLocs(locs, fk, cfs) {
  const m = new Map();
  locs.forEach(l => { const k = locKey(fk, l, cfs); if (!m.has(k)) m.set(k, []); m.get(k).push(l); });
  return [...m.entries()].map(([key, ls]) => ({ key, label: labelOf(fk, key), locs: ls }));
}
const outletsIn = (idx) => { const s = new Set(); idx.forEach(i => s.add(SES[i].loc.id)); return s.size; };
// Reporting-line anchor: from a node, step down while only one child holds the set.
function lineAnchor(start, set) {
  let n = start;
  for (;;) {
    if (n.role === "SE") return n;
    const kids = n.kids.map(id => NODES[id]).filter(k => set.some(i => k.seSet.has(i)));
    if (kids.length === 1 && kids[0].role !== "SE") n = kids[0]; else return n;
  }
}
const nodeSub = (n) => {
  if (n.role === "SE") return `SE · ${LOC_BY_ID[n.locId].locality}`;
  if (n.role === "TL") return `TL · ${LOC_BY_ID[n.locId].locality} · ${n.ses.length} SEs`;
  if (n.role === "SM") return `SM · ${n.locIds.map(id => LOC_BY_ID[id].locality).join(" + ")}`;
  if (n.role === "AM") return `AM · ${n.cluster}`;
  if (n.role === "ZH") return `ZH · ${ZONE_LABEL[n.zone]}`;
  return ROLE_LABEL[n.role];
};
const SEARCH_INDEX = [
  ...LOCS.map(l => ({ kind: "loc", id: l.id, label: l.name, sub: `${l.city} · ${l.format}`, q: `${l.name} ${l.locality} ${l.city}`.toLowerCase() })),
  ...Object.values(NODES).filter(n => n.role !== "CEO").map(n => ({ kind: "person", id: n.id, label: n.name, sub: nodeSub(n), q: n.name.toLowerCase() })),
];

/* ---------------- Context per period + thresholds ---------------- */
function buildCtx(pk, th) {
  const P = PERIODS[pk];
  const rows = periodRows(pk);
  const loc = {};
  LOCS.forEach(l => { loc[l.id] = derive(sumIdx(rows, l.ses), P, th); });
  const group = derive(sumIdx(rows, ALL_SE), P, th);
  const ranked = [...LOCS].sort((a, b) => (loc[b.id].projAch || 0) - (loc[a.id].projAch || 0));
  const rank = {}; ranked.forEach((l, i) => { rank[l.id] = i + 1; });
  const status = { on: [], risk: [], off: [] };
  LOCS.forEach(l => { const s = loc[l.id].status; if (status[s]) status[s].push(l.id); });
  const daysLeft = P.L - P.E;
  const pace = LOCS.filter(l => {
    const d = loc[l.id]; const req = (d.target - d.retail) / daysLeft; const cur = d.mtd / DAY;
    return req > 0 && cur < (th.pace / 100) * req;
  }).map(l => l.id);
  return { P, pk, rows, loc, group, rank, status, pace, th };
}
function attentionFor(ctx, approvals, th, locFilter) {
  const inLoc = (id) => !locFilter || locFilter.includes(id);
  const pace = ctx.pace.filter(inLoc);
  const disc = approvals.filter(a => inLoc(a.locId) && a.ask > th.limit[LOC_BY_ID[a.locId].format]);
  const canc = CANCELS.filter(c => inLoc(c.locId) && c.units >= th.cancelUnits);
  const stockLocs = LOCS.filter(l => inLoc(l.id)).map(l => ({ id: l.id, s: stockAgg([l.id], th) })).filter(x => x.s.aged > 0);
  return {
    pace, disc, canc, stockLocs,
    total: pace.length + disc.length + canc.length + (stockLocs.length ? 1 : 0),
    stockVal: stockLocs.reduce((s, x) => s + x.s.agedVal, 0), stockUnits: stockLocs.reduce((s, x) => s + x.s.aged, 0),
  };
}

/* ============================ SHARED UI ============================ */
const STATUS = { on: { label: "On track", tone: C.green, soft: C.greenSoft }, risk: { label: "At risk", tone: C.warm, soft: C.warmSoft },
  off: { label: "Off track", tone: C.hot, soft: C.hotSoft }, none: { label: "—", tone: C.ghost, soft: C.bg } };
const DEPTH_TONE = ["#0B1946", "#3B4BE8", "#6D28D9", "#00695C", "#F59E0B", "#E53935", "#AEB4CB"];
const depthTone = (d) => DEPTH_TONE[Math.min(d, DEPTH_TONE.length - 1)];

function Card({ children, style, ...rest }) {
  return <div {...rest} style={{ background: C.card, borderRadius: 16, padding: 14, marginBottom: 10, boxShadow: shadow, ...style }}>{children}</div>;
}
function CardTitle({ Icon, title, right, hint, tone = C.primary }) {
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: hint ? 3 : 10 }}>
        {Icon && <Icon size={14} color={tone} />}
        <span style={{ flex: 1, minWidth: 0, fontFamily: F, fontSize: 13.5, fontWeight: 800, color: C.ink }}>{title}</span>
        {right}
      </div>
      {hint && <div style={{ fontFamily: F, fontSize: 10.5, color: C.faint, marginBottom: 10 }}>{hint}</div>}
    </>
  );
}
function Dd({ value, onChange, options, label, grow }) {
  return (
    <label style={{ position: "relative", display: "inline-flex", alignItems: "center", minWidth: 0, flex: grow ? 1 : "0 1 auto" }}>
      <select aria-label={label} value={value} onChange={e => onChange(e.target.value)} style={{
        appearance: "none", WebkitAppearance: "none", MozAppearance: "none", width: "100%", minWidth: 0,
        border: `1.5px solid ${C.borderStrong}`, borderRadius: 999, padding: "6px 26px 6px 11px", background: C.card,
        fontFamily: F, fontSize: 11.5, fontWeight: 700, color: C.ink, cursor: "pointer", textOverflow: "ellipsis",
      }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown size={12} color={C.faint} style={{ position: "absolute", right: 9, pointerEvents: "none" }} />
    </label>
  );
}
function Chip({ on, label, onClick, tone = C.primary, count }) {
  return (
    <button type="button" onClick={onClick} style={{
      flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 10px", borderRadius: 999, cursor: "pointer",
      border: `1.5px solid ${on ? tone : C.borderStrong}`, background: on ? tone + "14" : C.card,
      fontFamily: F, fontSize: 11.5, fontWeight: on ? 800 : 600, color: on ? tone : C.sub,
    }}>{label}{count != null && <span style={{ fontWeight: 800 }}>{count}</span>}</button>
  );
}
const Dot = ({ status, size = 7 }) => (
  <span style={{ display: "inline-block", width: size, height: size, borderRadius: "50%", background: STATUS[status].tone, flexShrink: 0 }} />
);
function StatusPill({ status }) {
  const s = STATUS[status];
  return <span style={{ fontFamily: F, fontSize: 10, fontWeight: 800, color: s.tone, background: s.soft, borderRadius: 999, padding: "3px 8px", whiteSpace: "nowrap" }}>{s.label}</span>;
}
function Bar({ frac, tone = C.primary, marker, height = 6 }) {
  const f = clamp(ok(frac) ? frac : 0, 0, 1);
  return (
    <div style={{ position: "relative", height, borderRadius: height, background: C.bg, overflow: "hidden" }}>
      <div style={{ width: `${f * 100}%`, height: "100%", background: tone, borderRadius: height }} />
      {ok(marker) && <div style={{ position: "absolute", top: 0, bottom: 0, left: `${clamp(marker, 0, 1) * 100}%`, width: 2, background: C.ink }} />}
    </div>
  );
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
function PeriodBar({ period, setPeriod, cmp, setCmp, showCmp = true }) {
  const P = PERIODS[period];
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <Dd label="Period" value={period} onChange={setPeriod} options={Object.values(PERIODS).map(p => ({ value: p.key, label: p.label }))} />
        {showCmp && <Dd label="Compare" value={cmp} onChange={setCmp} options={CMP_OPTS(P)} />}
      </div>
      <div style={{ fontFamily: F, fontSize: 10.5, color: C.faint, marginTop: 6 }}>{P.sub}</div>
    </div>
  );
}
function BackBar({ title, sub, onBack }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
      <button type="button" aria-label="Back" onClick={onBack} style={{ width: 32, height: 32, borderRadius: 10, border: `1px solid ${C.border}`,
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
function Stat({ k, v, sub, tone }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontFamily: F, fontSize: 9, fontWeight: 800, color: C.faint, textTransform: "uppercase", letterSpacing: 0.4 }}>{k}</div>
      <div style={{ fontFamily: F, fontSize: 13, fontWeight: 800, color: tone || C.ink, marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{v}</div>
      {sub && <div style={{ fontFamily: F, fontSize: 9.5, color: C.faint, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sub}</div>}
    </div>
  );
}
function Tile({ k, v, line1, line2, tone }) {
  return (
    <div style={{ background: C.card, borderRadius: 14, padding: "11px 12px", boxShadow: shadow, minWidth: 0 }}>
      <div style={{ fontFamily: F, fontSize: 9.5, fontWeight: 800, color: C.faint, textTransform: "uppercase", letterSpacing: 0.4 }}>{k}</div>
      <div style={{ fontFamily: F, fontSize: 18, fontWeight: 900, color: C.ink, letterSpacing: -0.4, marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{v}</div>
      {line1 && <div style={{ fontFamily: F, fontSize: 10.5, fontWeight: 700, color: tone || C.sub, marginTop: 2 }}>{line1}</div>}
      {line2 && <div style={{ fontFamily: F, fontSize: 10, color: C.faint, marginTop: 1 }}>{line2}</div>}
    </div>
  );
}
const toneFor = (x, good = 0) => (!ok(x) ? C.faint : x >= good ? C.green : C.hot);
const achTone = (d) => STATUS[d.status].tone;

/* ============================ GROUP BOARD ============================ */
const CHAIN = ["zone", "state", "city", "loc"];
function nextField(cur, path, seq) {
  if (seq && seq[path.length + 1]) return seq[path.length + 1];
  if (cur === "line" || cur === "loc" || cur === "sm") return "line";
  const used = new Set([...path.map(p => p.field), cur]);
  const start = cur === "zone" ? 1 : cur === "state" ? 2 : cur === "city" || cur === "cluster" ? 3 : 1;
  for (let i = start; i < CHAIN.length; i++) if (!used.has(CHAIN[i])) return CHAIN[i];
  return "line";
}
const SORTS = [
  { value: "value", label: "Sort: Sales value" }, { value: "ach", label: "Sort: Achievement %" },
  { value: "gap", label: "Sort: Gap to target" }, { value: "growth", label: "Sort: Growth" },
];
function sortRows(rows, sort, cmp) {
  const g = (d) => (cmp === "ly" ? d.gLY : d.gPrev);
  const key = { value: d => d.value, ach: d => d.projAch, gap: d => d.gap, growth: d => g(d) }[sort];
  const asc = sort === "ach";   // achievement: worst first
  return [...rows].sort((a, b) => {
    const x = key(a.d), y = key(b.d);
    if (!ok(x) && !ok(y)) return 0; if (!ok(x)) return 1; if (!ok(y)) return -1;
    return asc ? x - y : y - x;
  });
}
const COLW = { t: 38, r: 46, b: 36, v: 58 };
function BoardHeadRow({ cmp }) {
  const h = { fontFamily: F, fontSize: 8.5, fontWeight: 800, color: C.sub, textTransform: "uppercase", letterSpacing: 0.3, textAlign: "center" };
  return (
    <div style={{ display: "flex", alignItems: "flex-end", padding: "0 18px 6px 9px", borderBottom: `1.5px solid ${C.borderStrong}` }}>
      <span style={{ ...h, flex: 1, textAlign: "left" }}>Name</span>
      <span style={{ ...h, width: COLW.t }}>Target</span>
      <span style={{ ...h, width: COLW.r }}>Retail<br /><span style={{ fontWeight: 600, textTransform: "none" }}>{cmp === "target" ? "ach %" : cmp === "prev" ? "growth" : "SS gr."}</span></span>
      <span style={{ ...h, width: COLW.b }}>Book</span>
      <span style={{ ...h, width: COLW.v, textAlign: "right" }}>Value</span>
    </div>
  );
}
function BoardRow({ name, sub, d, cmp, depth, onClick, hl, total, rowRef, chevron = true }) {
  const cell = { fontFamily: F, fontSize: 12, fontWeight: 600, color: C.sub, textAlign: "center" };
  return (
    <div ref={rowRef} data-testid={total ? "gb-total" : "gb-row"} data-retail={d.retail} data-target={d.target}
      data-value={d.value} data-book={d.book} data-heads={d.heads}
      style={{ borderLeft: `3px solid ${depthTone(depth)}`, borderBottom: `1px solid ${C.border}`,
        background: hl ? C.primarySoft : total ? "rgba(59,75,232,0.05)" : C.card }}>
      <button type="button" onClick={onClick} disabled={!onClick} style={{ display: "block", width: "100%", textAlign: "left", background: "none",
        border: "none", padding: "8px 4px 7px 6px", cursor: onClick ? "pointer" : "default", WebkitTapHighlightColor: "transparent" }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <Dot status={d.status} />
              <span style={{ fontFamily: F, fontSize: 12.5, fontWeight: total ? 800 : 700, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
            </div>
            <div style={{ fontFamily: F, fontSize: 10, color: C.faint, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sub}</div>
          </div>
          <span style={{ ...cell, width: COLW.t }}>{nIN(d.target)}</span>
          <span style={{ width: COLW.r, textAlign: "center" }}>
            <span style={{ display: "block", fontFamily: F, fontSize: 12.5, fontWeight: 800, color: C.ink, lineHeight: 1.1 }}>{nIN(d.retail)}</span>
            <span style={{ display: "block", fontFamily: F, fontSize: 9.5, fontWeight: 700, marginTop: 1,
              color: cmp === "target" ? achTone(d) : toneFor(cmpVal(d, cmp)) }}>{cmpTxt(d, cmp)}</span>
          </span>
          <span style={{ ...cell, width: COLW.b }}>{nIN(d.book)}</span>
          <span style={{ width: COLW.v, textAlign: "right", fontFamily: F, fontSize: 11, fontWeight: 800, color: C.ink }}>{inr(d.value)}</span>
          <span style={{ width: 14, display: "flex", justifyContent: "flex-end" }}>
            {chevron && onClick ? <ChevronRight size={12} color={C.ghost} /> : null}
          </span>
        </div>
        <div style={{ fontFamily: F, fontSize: 9.5, color: C.faint, marginTop: 3, paddingLeft: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {d.heads > 1 ? `${(d.perSE ?? 0).toFixed(1)} retail/SE · ` : ""}{pctS(d.conv)} conv · {kRs(d.dps)}/scooter disc.
        </div>
      </button>
    </div>
  );
}

function GroupBoard({ ctx, cmp, cfs, nav, setNav, onOpenLoc, onOpenPerson, base, compact, views, onSaveView, onApplyView, showToast }) {
  const { path, groupBy, seq, hl } = nav;
  const [sort, setSort] = useState("value");
  const [q, setQ] = useState("");
  const [saving, setSaving] = useState(false);
  const [viewName, setViewName] = useState("");
  const hlRef = useRef(null);
  useEffect(() => { if (hl && hlRef.current) hlRef.current.scrollIntoView({ block: "center" }); }, [hl]);

  const { set, rows, anchor } = useMemo(() => {
    let set = base || ALL_SE;
    path.forEach(p => {
      set = p.field === "line" ? set.filter(i => NODES[p.key].seSet.has(i)) : set.filter(i => seKey(p.field, SES[i], cfs) === p.key);
    });
    let rows, anchor = null;
    if (groupBy === "line") {
      const lastLine = [...path].reverse().find(p => p.field === "line");
      anchor = lineAnchor(lastLine ? NODES[lastLine.key] : CEO_NODE, set);
      const kids = anchor.role === "SE" ? [anchor] : anchor.kids.map(id => NODES[id]);
      rows = kids.map(k => ({ key: k.id, label: k.name, node: k, idx: set.filter(i => k.seSet.has(i)) })).filter(r => r.idx.length);
    } else rows = groupSEs(set, groupBy, cfs);
    rows.forEach(r => { r.d = derive(sumIdx(ctx.rows, r.idx), ctx.P, ctx.th); });
    return { set, rows, anchor };
  }, [path, groupBy, base, cfs, ctx]);
  const total = useMemo(() => derive(sumIdx(ctx.rows, set), ctx.P, ctx.th), [set, ctx]);
  const sorted = useMemo(() => sortRows(rows, sort, cmp), [rows, sort, cmp]);

  const depth = path.length;
  const stepIn = (r) => {
    if (groupBy === "loc") return onOpenLoc(r.key);
    if (groupBy === "line" && r.node.role === "SE") return onOpenPerson(r.node.id);
    setNav({ ...nav, hl: null, path: [...path, { field: groupBy, key: r.key, label: r.label }], groupBy: nextField(groupBy, path, seq) });
  };
  const crumbTo = (i) => {
    if (i === path.length) return;
    setNav({ ...nav, hl: null, path: path.slice(0, i), groupBy: path[i].field });
  };
  const results = q.trim().length >= 2 ? SEARCH_INDEX.filter(x => x.q.includes(q.trim().toLowerCase())).slice(0, 8) : [];
  const pick = (x) => {
    setQ("");
    if (x.kind === "loc") return onOpenLoc(x.id);
    const chain = []; let n = NODES[NODES[x.id].parent];
    while (n && n.role !== "CEO") { chain.unshift({ field: "line", key: n.id, label: n.name }); n = NODES[n.parent]; }
    setNav({ path: chain, groupBy: "line", seq: null, hl: x.id });
  };
  const totalName = path.length ? path[path.length - 1].label : compact ? "This location" : `${GROUP.name} group`;
  const totalSub = groupBy === "line" && anchor && anchor.role !== "CEO" && (!path.length || path[path.length - 1].key !== anchor.id)
    ? `Reporting line under ${anchor.name} (${anchor.role})`
    : `${outletsIn(set)} outlets · ${set.length} SEs · ${PERIODS[ctx.pk].label} total`;

  return (
    <div>
      {!compact && (
        <>
          <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
            <Dd grow label="Group by" value={groupBy} onChange={(v) => setNav({ ...nav, groupBy: v, seq: null, hl: null })}
              options={groupOptions(cfs, { line: true }).map(o => ({ ...o, label: `By ${o.label.toLowerCase()}` }))} />
            <Dd grow label="Sort" value={sort} onChange={setSort} options={SORTS} />
          </div>
          <div style={{ position: "relative", marginBottom: 8 }}>
            <Search size={13} color={C.faint} style={{ position: "absolute", left: 10, top: 10 }} />
            <input aria-label="Search location or person" value={q} onChange={e => setQ(e.target.value)} placeholder="Search a location or person"
              style={{ width: "100%", boxSizing: "border-box", border: `1.5px solid ${C.borderStrong}`, borderRadius: 10,
                padding: "8px 10px 8px 30px", fontFamily: F, fontSize: 12.5, color: C.ink, outline: "none", background: C.card }} />
            {results.length > 0 && (
              <div style={{ position: "absolute", top: 38, left: 0, right: 0, zIndex: 20, background: C.card, borderRadius: 10,
                border: `1px solid ${C.border}`, boxShadow: shadow, overflow: "hidden" }}>
                {results.map(x => (
                  <button key={x.kind + x.id} type="button" data-testid="search-hit" onClick={() => pick(x)} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%",
                    padding: "9px 11px", background: "none", border: "none", borderBottom: `1px solid ${C.border}`, cursor: "pointer", textAlign: "left" }}>
                    {x.kind === "loc" ? <Store size={13} color={C.primary} /> : <User size={13} color={C.teal} />}
                    <span style={{ minWidth: 0, flex: 1 }}>
                      <span style={{ display: "block", fontFamily: F, fontSize: 12.5, fontWeight: 700, color: C.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{x.label}</span>
                      <span style={{ display: "block", fontFamily: F, fontSize: 10.5, color: C.faint, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{x.sub}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 4, marginBottom: 8 }}>
        {[{ label: compact ? "Location" : "Group" }, ...path].map((p, i) => (
          <React.Fragment key={i}>
            {i > 0 && <ChevronRight size={11} color={C.ghost} />}
            <button type="button" data-testid="crumb" onClick={() => crumbTo(i)} style={{ display: "inline-flex", alignItems: "center", gap: 4,
              border: "none", background: i === path.length ? depthTone(i) + "18" : "none", borderRadius: 6, padding: "3px 6px", cursor: "pointer",
              fontFamily: F, fontSize: 11, fontWeight: i === path.length ? 800 : 600, color: i === path.length ? C.ink : C.primary, maxWidth: 150 }}>
              <span style={{ width: 3, height: 10, borderRadius: 2, background: depthTone(i), flexShrink: 0 }} />
              <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.label}</span>
            </button>
          </React.Fragment>
        ))}
      </div>
      {!compact && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
          <span style={{ flex: 1, fontFamily: F, fontSize: 10.5, color: C.faint, minWidth: 0 }}>
            Showing <b style={{ color: C.sub }}>{fieldLabel(groupBy, cfs)}</b>{seq ? ` · view: ${seq.map(f => fieldLabel(f, cfs)).join(" → ")}` : ""}
          </span>
          <button type="button" onClick={() => setSaving(s => !s)} style={{ display: "inline-flex", alignItems: "center", gap: 4, border: "none",
            background: "none", cursor: "pointer", fontFamily: F, fontSize: 11, fontWeight: 800, color: C.primary, flexShrink: 0 }}>
            <Bookmark size={12} /> Save view
          </button>
        </div>
      )}
      {saving && (
        <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
          <input aria-label="View name" value={viewName} onChange={e => setViewName(e.target.value)} placeholder={[...path.map(p => fieldLabel(p.field, cfs)), fieldLabel(groupBy, cfs)].join(" → ")}
            style={{ flex: 1, minWidth: 0, border: `1.5px solid ${C.borderStrong}`, borderRadius: 9, padding: "7px 10px", fontFamily: F, fontSize: 12 }} />
          <button type="button" onClick={() => {
            const fields = [...path.map(p => p.field), groupBy];
            const name = viewName.trim() || fields.map(f => fieldLabel(f, cfs)).join(" → ");
            onSaveView({ name, seq: fields });
            setSaving(false); setViewName(""); showToast(`View saved — "${name}" pinned above the board`);
          }} style={{ border: "none", borderRadius: 9, background: C.primary, color: "#fff", fontFamily: F, fontWeight: 800, fontSize: 12, padding: "0 12px", cursor: "pointer" }}>Save</button>
        </div>
      )}

      <BoardHeadRow cmp={cmp} />
      <BoardRow total name={totalName} sub={totalSub} d={total} cmp={cmp} depth={depth} />
      {sorted.map(r => (
        <BoardRow key={r.key} name={r.label}
          sub={groupBy === "line" ? nodeSub(r.node)
            : groupBy === "loc" ? `${LOC_BY_ID[r.key].city} · ${LOC_BY_ID[r.key].format}${LOC_BY_ID[r.key].isNew ? " · new" : ""}`
            : `${outletsIn(r.idx)} outlets · ${r.idx.length} SEs`}
          d={r.d} cmp={cmp} depth={depth + 1} onClick={() => stepIn(r)} hl={hl === r.key}
          rowRef={hl === r.key ? hlRef : undefined} />
      ))}
      {groupBy === "line" && anchor && anchor.role === "SM" && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
          {anchor.locIds.filter(id => set.some(i => SES[i].loc.id === id)).map(id => (
            <Chip key={id} label={<><Store size={11} /> Open {LOC_BY_ID[id].locality}</>} onClick={() => onOpenLoc(id)} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================ BOARD ============================ */
function HeadlineTiles({ ctx, cmp }) {
  const g = ctx.group, P = ctx.P;
  const valLine = cmp === "target" ? `${pctS(div(g.value, g.tValue))} of target value`
    : cmp === "prev" ? `${gS(g.vPrev)} ${P.prevShort.replace("vs ", "vs ")}` : `${gS(g.vLY)} vs LY (same-store)`;
  const valTone = cmp === "target" ? toneFor(div(g.value, g.tValue), P.E / P.L) : toneFor(cmp === "prev" ? g.vPrev : g.vLY);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
      <Tile k="Sales value · ex-showroom" v={inr(g.value)} line1={valLine} tone={valTone} line2={`Target ${inr(g.tValue)}`} />
      <Tile k="Retail vs target" v={`${nIN(g.retail)} / ${nIN(g.target)}`} line1={`${pctS(g.ach)} achieved`} tone={achTone(g)}
        line2={`${pctS(P.E / P.L)} of the ${P.label.toLowerCase()} gone`} />
      <Tile k="Projection at current pace" v={`${nIN(g.proj)} scooters`} line1={`${pctS(g.projAch)} of target`} tone={achTone(g)}
        line2={`${nIN(g.mtd / DAY)}/day now · need ${nIN(Math.max(0, g.target - g.retail) / (P.L - P.E))}/day`} />
      <Tile k="Order book" v={`${nIN(g.ob)} scooters`} line1={inr(g.obVal)} line2="Booked, not yet delivered" />
    </div>
  );
}
function StatusCounts({ ctx, onOpen }) {
  return (
    <Card style={{ padding: "12px 12px" }}>
      <CardTitle Icon={MapPin} title="Locations by status" hint={`From projected achievement · ≥${ctx.th.on}% on track, ${ctx.th.risk}–${ctx.th.on}% at risk, <${ctx.th.risk}% off`} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
        {["on", "risk", "off"].map(s => (
          <button key={s} type="button" data-testid={`status-${s}`} onClick={() => onOpen(s)} style={{ border: `1.5px solid ${STATUS[s].tone}33`,
            background: STATUS[s].soft, borderRadius: 12, padding: "9px 8px", cursor: "pointer", textAlign: "left" }}>
            <div style={{ fontFamily: F, fontSize: 20, fontWeight: 900, color: STATUS[s].tone }}>{ctx.status[s].length}</div>
            <div style={{ fontFamily: F, fontSize: 10.5, fontWeight: 700, color: C.sub }}>{STATUS[s].label}</div>
          </button>
        ))}
      </div>
    </Card>
  );
}
function AttentionCard({ att, onOpen, title = "Needs attention" }) {
  const items = [
    { kind: "pace", label: "Below required pace", n: att.pace.length, sub: "locations", Icon: Target },
    { kind: "disc", label: "Discounts above limit, awaiting approval", n: att.disc.length, sub: "requests", Icon: IndianRupee },
    { kind: "canc", label: "Large booking cancellations", n: att.canc.length, sub: att.canc.length ? `${att.canc.reduce((s, c) => s + c.units, 0)} scooters` : "none", Icon: X },
    { kind: "stock", label: "Aged stock", n: att.stockLocs.length, sub: att.stockUnits ? `${nIN(att.stockUnits)} units · ${inr(att.stockVal)}` : "none", Icon: Package },
  ];
  return (
    <Card>
      <CardTitle Icon={AlertTriangle} tone={C.hot} title={title} hint="Exceptions by type — thresholds are set in Admin → Attention thresholds." />
      {items.map(it => (
        <button key={it.kind} type="button" data-testid={`attn-${it.kind}`} onClick={() => it.n && onOpen(it.kind)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%",
          padding: "10px 2px", background: "none", border: "none", borderTop: `1px solid ${C.border}`, cursor: it.n ? "pointer" : "default", textAlign: "left" }}>
          <span style={{ width: 28, height: 28, borderRadius: 8, background: it.n ? C.hotSoft : C.greenSoft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {it.n ? <it.Icon size={14} color={C.hot} /> : <Check size={14} color={C.green} />}
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontFamily: F, fontSize: 12.5, fontWeight: 700, color: C.ink }}>{it.label}</span>
            <span style={{ display: "block", fontFamily: F, fontSize: 10.5, color: C.faint }}>{it.sub}</span>
          </span>
          <span style={{ fontFamily: F, fontSize: 15, fontWeight: 900, color: it.n ? C.hot : C.green }}>{it.n}</span>
          {it.n > 0 && <ChevronRight size={13} color={C.ghost} />}
        </button>
      ))}
    </Card>
  );
}
function BoardScreen({ ctx, period, setPeriod, cmp, setCmp, cfs, nav, setNav, views, onSaveView, att, open, showToast }) {
  const pinned = views.filter(v => v.pinned);
  return (
    <div style={{ padding: "14px 14px 90px" }}>
      <div data-testid="board-title" style={{ fontFamily: F, fontWeight: 800, fontSize: 18, color: C.ink, marginBottom: 8 }}>Board</div>
      <PeriodBar period={period} setPeriod={setPeriod} cmp={cmp} setCmp={setCmp} />
      <HeadlineTiles ctx={ctx} cmp={cmp} />
      <StatusCounts ctx={ctx} onOpen={(s) => open({ t: "locs", title: `${STATUS[s].label} · ${ctx.status[s].length} locations`, ids: ctx.status[s] })} />
      <Card style={{ padding: "14px 10px" }}>
        <div style={{ paddingLeft: 4 }}>
          <CardTitle Icon={Building2} title="Group board" hint="Tap a row to step in · breadcrumb to step back. Totals are summed from SEs." />
        </div>
        {pinned.length > 0 && (
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 8, marginBottom: 4 }}>
            {pinned.map(v => (
              <Chip key={v.id} on={nav.seq && nav.seq.join() === v.seq.join()} label={<><Bookmark size={11} />{v.name}</>}
                onClick={() => setNav({ path: [], groupBy: v.seq[0], seq: v.seq, hl: null })} />
            ))}
          </div>
        )}
        <GroupBoard ctx={ctx} cmp={cmp} cfs={cfs} nav={nav} setNav={setNav} views={views} onSaveView={onSaveView} showToast={showToast}
          onOpenLoc={(id) => open({ t: "loc", id })} onOpenPerson={(id) => open({ t: "person", id })} />
      </Card>
      <AttentionCard att={att} onOpen={(kind) => open({ t: "attn", kind })} />
    </div>
  );
}

/* ============================ LOCATION LISTS ============================ */
function LocRow({ l, d, rank, onOpen, cmp }) {
  return (
    <button type="button" data-testid="loc-row" onClick={() => onOpen(l.id)} style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "10px 4px",
      background: "none", border: "none", borderBottom: `1px solid ${C.border}`, cursor: "pointer", textAlign: "left" }}>
      <span style={{ width: 24, fontFamily: F, fontSize: 11, fontWeight: 800, color: C.faint, textAlign: "right", flexShrink: 0 }}>{rank}</span>
      <Dot status={d.status} size={8} />
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontFamily: F, fontSize: 12.5, fontWeight: 700, color: C.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{l.locality}</span>
        <span style={{ display: "block", fontFamily: F, fontSize: 10.5, color: C.faint, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {l.city} · {l.format}{l.isNew ? " · new" : ""} · {inr(d.value)}
        </span>
      </span>
      <span style={{ textAlign: "right", flexShrink: 0 }}>
        <span style={{ display: "block", fontFamily: F, fontSize: 12.5, fontWeight: 800, color: C.ink }}>{nIN(d.retail)}<span style={{ color: C.faint, fontWeight: 600 }}> / {nIN(d.target)}</span></span>
        <span style={{ display: "block", fontFamily: F, fontSize: 10.5, fontWeight: 700, color: cmp && cmp !== "target" ? toneFor(cmpVal(d, cmp)) : achTone(d) }}>
          {cmp && cmp !== "target" ? cmpTxt(d, cmp) : `${pctS(d.ach)} · proj ${pctS(d.projAch)}`}
        </span>
      </span>
      <ChevronRight size={13} color={C.ghost} />
    </button>
  );
}
function LocListOverlay({ ctx, title, ids, onBack, open, cmp }) {
  const ls = ids.map(id => LOC_BY_ID[id]).sort((a, b) => ctx.rank[a.id] - ctx.rank[b.id]);
  return (
    <div style={{ padding: "14px 14px 90px" }}>
      <BackBar title={title} sub={`Ranked by projected achievement · ${ctx.P.sub}`} onBack={onBack} />
      <Card style={{ padding: "6px 10px" }}>
        {ls.map(l => <LocRow key={l.id} l={l} d={ctx.loc[l.id]} rank={ctx.rank[l.id]} cmp={cmp} onOpen={(id) => open({ t: "loc", id })} />)}
      </Card>
    </div>
  );
}
function LocationsScreen({ ctx, period, setPeriod, cmp, setCmp, cfs, open }) {
  const [gb, setGb] = useState("none");
  const [sort, setSort] = useState("ach");
  const [st, setSt] = useState("all");
  const [q, setQ] = useState("");
  const list = LOCS.filter(l => (st === "all" || ctx.loc[l.id].status === st) &&
    (!q.trim() || `${l.name} ${l.city} ${l.state} ${l.cluster}`.toLowerCase().includes(q.trim().toLowerCase())));
  const sortL = (ls) => {
    const k = { ach: l => ctx.loc[l.id].projAch, value: l => ctx.loc[l.id].value, gap: l => ctx.loc[l.id].gap,
      growth: l => (cmp === "ly" ? ctx.loc[l.id].gLY : ctx.loc[l.id].gPrev) }[sort];
    return [...ls].sort((a, b) => { const x = k(a), y = k(b); if (!ok(x)) return 1; if (!ok(y)) return -1; return y - x; });
  };
  const groups = gb === "none" ? [{ key: "all", label: null, locs: list }] : groupLocs(list, gb, cfs).sort((a, b) => b.locs.length - a.locs.length);
  return (
    <div style={{ padding: "14px 14px 90px" }}>
      <ScreenHead title="Locations" blurb="All 100 outlets ranked. Tap one for its dashboard." />
      <PeriodBar period={period} setPeriod={setPeriod} cmp={cmp} setCmp={setCmp} />
      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 8 }}>
        <Chip on={st === "all"} label="All" count={LOCS.length} onClick={() => setSt("all")} />
        {["on", "risk", "off"].map(s => <Chip key={s} on={st === s} tone={STATUS[s].tone} label={STATUS[s].label} count={ctx.status[s].length} onClick={() => setSt(s)} />)}
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
        <Dd grow label="Group by" value={gb} onChange={setGb} options={groupOptions(cfs, { none: true, people: false })} />
        <Dd grow label="Sort" value={sort} onChange={setSort} options={[{ value: "ach", label: "Achievement %" }, { value: "gap", label: "Gap to target" }, { value: "value", label: "Sales value" }, { value: "growth", label: "Growth" }]} />
      </div>
      <div style={{ position: "relative", marginBottom: 10 }}>
        <Search size={13} color={C.faint} style={{ position: "absolute", left: 10, top: 10 }} />
        <input aria-label="Search locations" value={q} onChange={e => setQ(e.target.value)} placeholder="Search outlet, city, state or cluster"
          style={{ width: "100%", boxSizing: "border-box", border: `1.5px solid ${C.borderStrong}`, borderRadius: 10, padding: "8px 10px 8px 30px", fontFamily: F, fontSize: 12.5, background: C.card }} />
      </div>
      {groups.map(g => {
        const d = derive(sumIdx(ctx.rows, g.locs.flatMap(l => l.ses)), ctx.P, ctx.th);
        return (
          <Card key={g.key} style={{ padding: "8px 10px" }}>
            {g.label && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 4px 8px", borderBottom: `1.5px solid ${C.borderStrong}` }}>
                <Dot status={d.status} size={8} />
                <span style={{ flex: 1, minWidth: 0, fontFamily: F, fontSize: 13, fontWeight: 800, color: C.ink }}>{g.label}</span>
                <span style={{ fontFamily: F, fontSize: 11, color: C.sub }}>{g.locs.length} · {nIN(d.retail)}/{nIN(d.target)} · {pctS(d.ach)}</span>
              </div>
            )}
            {sortL(g.locs).map(l => <LocRow key={l.id} l={l} d={ctx.loc[l.id]} rank={ctx.rank[l.id]} cmp={cmp} onOpen={(id) => open({ t: "loc", id })} />)}
            {!g.locs.length && <div style={{ fontFamily: F, fontSize: 12, color: C.faint, padding: 10 }}>No outlets match.</div>}
          </Card>
        );
      })}
      {list.length === 0 && <Card><div style={{ fontFamily: F, fontSize: 12.5, color: C.sub, textAlign: "center" }}>No outlets match.</div></Card>}
    </div>
  );
}

/* ============================ STATE & CITY ============================ */
const SC_METRICS = [
  { value: "retail", label: "Retail" }, { value: "ach", label: "Achievement %" },
  { value: "value", label: "Sales value" }, { value: "growth", label: "Growth" },
];
function StateCityScreen({ ctx, period, setPeriod, cmp, setCmp, open, nav, setNav }) {
  const [metric, setMetric] = useState("retail");
  const { state, city } = nav;
  const level = city ? "loc" : state ? "city" : "state";
  const pool = LOCS.filter(l => (!state || l.state === state) && (!city || l.city === city));
  const groups = level === "loc" ? null : groupLocs(pool, level, []).map(g => {
    const idx = g.locs.flatMap(l => l.ses);
    const d = derive(sumIdx(ctx.rows, idx), ctx.P, ctx.th);
    const sc = { on: 0, risk: 0, off: 0 }; g.locs.forEach(l => { sc[ctx.loc[l.id].status]++; });
    return { ...g, d, sc, newN: g.locs.filter(l => l.isNew).length };
  });
  const mval = (d) => (metric === "retail" ? d.retail : metric === "ach" ? d.projAch : metric === "value" ? d.value : d.gLY);
  const mtxt = (d) => (metric === "retail" ? nIN(d.retail) : metric === "ach" ? `${pctS(d.projAch)} proj.` : metric === "value" ? inr(d.value) : (ok(d.gLY) ? `${gS(d.gLY)} SS` : "n/a — all new"));
  if (groups) groups.sort((a, b) => (mval(b.d) ?? -9) - (mval(a.d) ?? -9));
  const maxV = groups ? Math.max(...groups.map(g => Math.abs(mval(g.d) || 0)), 0.0001) : 1;
  const total = derive(sumIdx(ctx.rows, pool.flatMap(l => l.ses)), ctx.P, ctx.th);

  return (
    <div style={{ padding: "14px 14px 90px" }} data-testid="state-city">
      <ScreenHead title="State & City" blurb="Performance by state, then city, then outlet. Growth is same-store vs last year (outlets open 12+ months)." />
      <PeriodBar period={period} setPeriod={setPeriod} cmp={cmp} setCmp={setCmp} />
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 4, marginBottom: 10 }}>
        {[{ label: "All states", to: { state: null, city: null } }, state && { label: state, to: { state, city: null } }, city && { label: city, to: { state, city } }]
          .filter(Boolean).map((c, i, arr) => (
            <React.Fragment key={i}>
              {i > 0 && <ChevronRight size={11} color={C.ghost} />}
              <button type="button" data-testid="sc-crumb" onClick={() => setNav(c.to)} style={{ display: "inline-flex", alignItems: "center", gap: 4, border: "none",
                background: i === arr.length - 1 ? depthTone(i) + "18" : "none", borderRadius: 6, padding: "3px 6px", cursor: "pointer",
                fontFamily: F, fontSize: 11.5, fontWeight: i === arr.length - 1 ? 800 : 600, color: i === arr.length - 1 ? C.ink : C.primary }}>
                <span style={{ width: 3, height: 10, borderRadius: 2, background: depthTone(i) }} />{c.label}
              </button>
            </React.Fragment>
          ))}
      </div>
      <Card style={{ padding: "12px 12px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 8 }}>
          <Stat k="Outlets" v={nIN(pool.length)} sub={`${pool.filter(l => l.isNew).length} new`} />
          <Stat k="Retail" v={nIN(total.retail)} sub={`of ${nIN(total.target)}`} />
          <Stat k="Proj. ach." v={pctS(total.projAch)} tone={achTone(total)} sub={`${pctS(total.ach)} so far`} />
          <Stat k="Value" v={inr(total.value)} sub={`SS ${gS(total.gLY)}`} />
        </div>
      </Card>
      {groups && (
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 8 }}>
          {SC_METRICS.map(m => <Chip key={m.value} on={metric === m.value} label={m.label} onClick={() => setMetric(m.value)} />)}
        </div>
      )}
      {groups && groups.map(g => {
        const v = mval(g.d);
        return (
          <button key={g.key} type="button" data-testid="sc-card" onClick={() => setNav(level === "state" ? { state: g.key, city: null } : { state, city: g.key })}
            style={{ display: "block", width: "100%", textAlign: "left", background: C.card, borderRadius: 14, padding: "11px 12px", marginBottom: 8,
              boxShadow: shadow, border: "none", borderLeft: `3px solid ${depthTone(level === "state" ? 1 : 2)}`, cursor: "pointer" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <Dot status={g.d.status} size={8} />
              <span style={{ flex: 1, minWidth: 0, fontFamily: F, fontSize: 13.5, fontWeight: 800, color: C.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{g.label}</span>
              {["on", "risk", "off"].map(s => (
                <span key={s} style={{ display: "inline-flex", alignItems: "center", gap: 3, fontFamily: F, fontSize: 10.5, fontWeight: 800, color: STATUS[s].tone }}>
                  <Dot status={s} size={6} />{g.sc[s]}
                </span>
              ))}
              <ChevronRight size={13} color={C.ghost} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 6, marginBottom: 8 }}>
              <Stat k="Outlets · SEs" v={`${g.locs.length} · ${g.d.heads}`} sub={level === "city" ? `${g.newN} new` : `${g.newN} new`} />
              <Stat k="Retail / tgt" v={`${nIN(g.d.retail)}/${nIN(g.d.target)}`} sub={`${pctS(g.d.ach)} · proj ${pctS(g.d.projAch)}`} />
              <Stat k="Value" v={inr(g.d.value)} sub={`conv ${pctS(g.d.conv)}`} />
              <Stat k="SS growth" v={ok(g.d.gLY) ? gS(g.d.gLY) : "n/a"} tone={toneFor(g.d.gLY)} sub={ok(g.d.gLY) ? "vs LY" : "all new"} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ flex: 1 }}><Bar frac={Math.abs(v || 0) / maxV} tone={metric === "growth" ? toneFor(v) : metric === "ach" ? achTone(g.d) : C.primary} /></div>
              <span style={{ width: 92, textAlign: "right", fontFamily: F, fontSize: 11, fontWeight: 800, color: C.ink, whiteSpace: "nowrap" }}>{mtxt(g.d)}</span>
            </div>
          </button>
        );
      })}
      {level === "loc" && (
        <Card style={{ padding: "6px 10px" }}>
          <div style={{ fontFamily: F, fontSize: 11, color: C.faint, padding: "6px 4px" }}>Outlets in {city}, ranked by projected achievement</div>
          {[...pool].sort((a, b) => ctx.rank[a.id] - ctx.rank[b.id]).map(l => (
            <LocRow key={l.id} l={l} d={ctx.loc[l.id]} rank={ctx.rank[l.id]} cmp={cmp} onOpen={(id) => open({ t: "loc", id })} />
          ))}
        </Card>
      )}
    </div>
  );
}

/* ============================ LOCATION DASHBOARD ============================ */
function Compare({ k, mine, avg, fmt, good = "high", note }) {
  const better = ok(mine) && ok(avg) ? (good === "high" ? mine >= avg : mine <= avg) : null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderTop: `1px solid ${C.border}` }}>
      <span style={{ flex: 1, minWidth: 0, fontFamily: F, fontSize: 12, fontWeight: 600, color: C.ink }}>{k}{note && <span style={{ display: "block", fontSize: 10, color: C.faint, fontWeight: 500 }}>{note}</span>}</span>
      <span style={{ fontFamily: F, fontSize: 12.5, fontWeight: 800, color: better == null ? C.ink : better ? C.green : C.hot, width: 70, textAlign: "right" }}>{fmt(mine)}</span>
      <span style={{ fontFamily: F, fontSize: 11, color: C.faint, width: 74, textAlign: "right" }}>grp {fmt(avg)}</span>
    </div>
  );
}
function LocationScreen({ ctx, id, cmp, cfs, onBack, open, approvals, th }) {
  const l = LOC_BY_ID[id];
  const d = ctx.loc[id], g = ctx.group, P = ctx.P;
  const sm = NODES[l.smId];
  const avg = (x) => x / LOCS.length;
  const st = stockAgg([id], th);
  const gst = stockAgg(LOCS.map(x => x.id), th);
  const att = attentionFor(ctx, approvals, th, [id]);
  const [nav, setNav] = useState({ path: [], groupBy: "line", seq: null, hl: null });
  const grpLimit = LOCS.reduce((s, x) => s + ctx.loc[x.id].retail * th.limit[x.format], 0) / (g.retail || 1);
  // Aged units here that could fill bookings waiting at other outlets in the same city.
  const agedFrom = th.stockAge >= 90 ? 3 : 2;
  const fills = [];
  STOCK[id].combos.forEach(c => {
    const aged = c.b.slice(agedFrom).reduce((a, b) => a + b, 0);
    if (!aged) return;
    LOCS.filter(o => o.city === l.city && o.id !== id).forEach(o => {
      const oc = STOCK[o.id].combos.find(x => x.variant === c.variant && x.colour === c.colour);
      const fresh = oc.b[0] + oc.b[1];
      const short = oc.waiting - fresh;
      if (short > 0) fills.push({ c, aged, to: o, short, n: Math.min(aged, short) });
    });
  });
  return (
    <div style={{ padding: "14px 14px 90px" }} data-testid="loc-dash">
      <BackBar title={l.name} sub={`${l.city}, ${l.state}`} onBack={onBack} />
      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <StatusPill status={d.status} />
          <span style={{ fontFamily: F, fontSize: 11.5, fontWeight: 700, color: C.sub }}>Rank #{ctx.rank[id]} of {LOCS.length}</span>
          <span style={{ flex: 1 }} />
          <span style={{ fontFamily: F, fontSize: 10.5, color: C.faint }}>{l.id}</span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
          {[["City", l.city], ["State", l.state], ["Cluster", l.cluster || "Unassigned"], ["Format", l.format], ["New outlet", l.isNew ? "Yes" : "No"], ["Opened", l.opened]].map(([k, v]) => (
            <span key={k} style={{ fontFamily: F, fontSize: 10.5, color: C.sub, background: C.bg, borderRadius: 6, padding: "3px 7px" }}><b style={{ color: C.faint, fontWeight: 700 }}>{k}</b> {v}</span>
          ))}
        </div>
        <div style={{ fontFamily: F, fontSize: 12, color: C.ink }}><b>Sales manager:</b> {sm.name}{sm.locIds.length > 1 ? ` (also runs ${sm.locIds.filter(x => x !== id).map(x => LOC_BY_ID[x].locality).join(", ")})` : ""}</div>
        <div style={{ fontFamily: F, fontSize: 11, color: C.faint, marginTop: 2 }}>Area manager {NODES[sm.parent].name} · {l.ses.length} SEs</div>
        {l.real && (
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", gap: 6, fontFamily: F, fontSize: 11.5, color: C.sub, lineHeight: 1.4 }}><MapPin size={13} color={C.faint} style={{ flexShrink: 0, marginTop: 2 }} />{l.address}</div>
            <div style={{ display: "flex", gap: 6, alignItems: "center", fontFamily: F, fontSize: 11.5, color: C.sub, marginTop: 4 }}><Phone size={13} color={C.faint} />{l.phone}</div>
          </div>
        )}
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
        <Tile k="Sales value" v={inr(d.value)} line1={`${pctS(div(d.value, d.tValue))} of target value`} tone={achTone(d)} line2={`Group avg/outlet ${inr(avg(g.value))}`} />
        <Tile k="Retail vs target" v={`${nIN(d.retail)} / ${nIN(d.target)}`} line1={`${pctS(d.ach)} achieved`} tone={achTone(d)} line2={`Group ${pctS(g.ach)}`} />
        <Tile k="Projection" v={`${nIN(d.proj)} scooters`} line1={`${pctS(d.projAch)} of target`} tone={achTone(d)} line2={`Group ${pctS(g.projAch)}`} />
        <Tile k="Order book" v={`${nIN(d.ob)} · ${inr(d.obVal)}`} line1="Booked, not delivered" line2={`Group avg/outlet ${nIN(avg(g.ob))}`} />
      </div>

      <Card style={{ padding: "14px 10px" }}>
        <div style={{ paddingLeft: 4 }}><CardTitle Icon={Users} title="People" hint="This location's reporting line — tap to step in." /></div>
        <GroupBoard compact ctx={ctx} cmp={cmp} cfs={cfs} nav={nav} setNav={setNav} base={l.ses} views={[]}
          onOpenLoc={() => {}} onOpenPerson={(pid) => open({ t: "person", id: pid })} />
      </Card>

      <Card>
        <CardTitle Icon={IndianRupee} title="Money" hint={`Per scooter, ${P.sub}. Green = better than the group.`} />
        <Compare k="Discount per scooter" note={`Limit ${rs(th.limit[l.format])} (${l.format})`} mine={d.dps} avg={g.dps} fmt={kRs} good="low" />
        <div style={{ padding: "0 0 8px" }}><Bar frac={div(d.dps, th.limit[l.format] * 1.5)} marker={1 / 1.5} tone={d.dps > th.limit[l.format] ? C.hot : C.green} /></div>
        <Compare k="Finance attach" mine={div(d.fin, d.retail)} avg={div(g.fin, g.retail)} fmt={(x) => pctS(x)} />
        <Compare k="Insurance attach" mine={div(d.ins, d.retail)} avg={div(g.ins, g.retail)} fmt={(x) => pctS(x)} note="Always sold with the scooter" />
        <Compare k="River Care Plus Two" mine={div(d.p2, d.retail)} avg={div(g.p2, g.retail)} fmt={(x) => pctS(x)} />
        <Compare k="River Care Plus Five" mine={div(d.p5, d.retail)} avg={div(g.p5, g.retail)} fmt={(x) => pctS(x)} />
        <Compare k="Accessories per scooter" mine={div(d.acc, d.retail)} avg={div(g.acc, g.retail)} fmt={(x) => rs(x)} />
        <Compare k="Exchange" mine={div(d.exch, d.retail)} avg={div(g.exch, g.retail)} fmt={(x) => pctS(x)} />
        <div style={{ fontFamily: F, fontSize: 10, color: C.faint, marginTop: 4 }}>Group blended discount limit {rs(grpLimit)}.</div>
      </Card>

      <Card>
        <CardTitle Icon={Package} title="Stock" hint={`${nIN(st.units)} scooters · ${inr(st.value)} ex-showroom · ${st.demo} demo scooters · est. interest ${inr(st.interest)}`} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 6, marginBottom: 10 }}>
          {AGE_BUCKETS.map((b, i) => (
            <div key={b} style={{ background: i === 3 ? C.hotSoft : i === 2 ? C.warmSoft : C.bg, borderRadius: 10, padding: "7px 8px", minWidth: 0 }}>
              <div style={{ fontFamily: F, fontSize: 9.5, fontWeight: 800, color: C.faint }}>{b} d</div>
              <div style={{ fontFamily: F, fontSize: 15, fontWeight: 900, color: C.ink }}>{st.b[i]}</div>
              <div style={{ fontFamily: F, fontSize: 9.5, color: C.sub, whiteSpace: "nowrap" }}>{inr(st.bv[i])}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", fontFamily: F, fontSize: 9, fontWeight: 800, color: C.sub, textTransform: "uppercase", paddingBottom: 5, borderBottom: `1.5px solid ${C.borderStrong}` }}>
          <span style={{ flex: 1 }}>Colour</span><span style={{ width: 52, textAlign: "center" }}>750W</span><span style={{ width: 52, textAlign: "center" }}>480W</span><span style={{ width: 52, textAlign: "center" }}>Aged</span>
        </div>
        {COLOURS.map(c => {
          const a = STOCK[id].combos.filter(x => x.colour === c);
          const v = (k) => a.find(x => x.variant === k).units;
          const aged = a.reduce((s, x) => s + x.b.slice(agedFrom).reduce((p, q) => p + q, 0), 0);
          return (
            <div key={c} style={{ display: "flex", alignItems: "center", padding: "7px 0", borderBottom: `1px solid ${C.border}`, fontFamily: F, fontSize: 12 }}>
              <span style={{ flex: 1, color: C.ink, fontWeight: 600 }}>{c}</span>
              <span style={{ width: 52, textAlign: "center", color: C.sub }}>{v("750W")}</span>
              <span style={{ width: 52, textAlign: "center", color: C.sub }}>{v("480W")}</span>
              <span style={{ width: 52, textAlign: "center", fontWeight: 800, color: aged ? C.hot : C.ghost }}>{aged}</span>
            </div>
          );
        })}
        <div style={{ fontFamily: F, fontSize: 12, fontWeight: 800, color: C.ink, marginTop: 12, marginBottom: 4 }}>Aged units that could fill bookings nearby</div>
        {fills.length === 0
          ? <div style={{ fontFamily: F, fontSize: 11.5, color: C.faint }}>No {l.city} outlet is waiting on a variant/colour aged here.</div>
          : fills.slice(0, 6).map((f, i) => (
            <div key={i} style={{ fontFamily: F, fontSize: 11.5, color: C.sub, padding: "5px 0", borderTop: i ? `1px solid ${C.border}` : "none" }}>
              <b style={{ color: C.ink }}>{f.n} × Indie {f.c.variant} {f.c.colour}</b> → {f.to.locality}: {f.c.waiting === 0 ? "" : ""}{STOCK[f.to.id].combos.find(x => x.variant === f.c.variant && x.colour === f.c.colour).waiting} bookings waiting, {f.short} short
            </div>
          ))}
      </Card>
      <AttentionCard att={att} title="Needs attention here" onOpen={(kind) => open({ t: "attn", kind, locId: id })} />
      <div style={{ fontFamily: F, fontSize: 10, color: C.faint, textAlign: "center" }}>Group stock {nIN(gst.units)} scooters · {inr(gst.value)}</div>
    </div>
  );
}

function PersonScreen({ ctx, id, onBack, open }) {
  const n = NODES[id];
  const d = derive(sumIdx(ctx.rows, n.ses), ctx.P, ctx.th);
  const l = LOC_BY_ID[n.locId];
  const chain = []; let p = NODES[n.parent]; while (p) { chain.unshift(p); p = p.parent ? NODES[p.parent] : null; }
  return (
    <div style={{ padding: "14px 14px 90px" }}>
      <BackBar title={n.name} sub={`${ROLE_LABEL[n.role]} · ${l ? l.name : ""}`} onBack={onBack} />
      <Card>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 10 }}>
          <Stat k="Retail / target" v={`${d.retail} / ${d.target}`} sub={pctS(d.ach)} tone={achTone(d)} />
          <Stat k="Bookings" v={nIN(d.book)} sub={`order book ${d.ob}`} />
          <Stat k="Value" v={inr(d.value)} />
          <Stat k="Leads" v={nIN(d.leads)} sub={`conv ${pctS(d.conv)}`} />
          <Stat k="Test rides" v={nIN(d.td)} />
          <Stat k="Disc./scooter" v={kRs(d.dps)} />
          <Stat k="Finance" v={pctS(div(d.fin, d.retail))} />
          <Stat k="River Care" v={pctS(div(d.p2 + d.p5, d.retail))} />
          <Stat k="Exchange" v={pctS(div(d.exch, d.retail))} />
        </div>
      </Card>
      <Card>
        <CardTitle Icon={Users} title="Reports to" />
        {chain.map((c, i) => (
          <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", paddingLeft: i * 8, borderLeft: `3px solid ${depthTone(i)}`, marginBottom: 2 }}>
            <span style={{ fontFamily: F, fontSize: 12, fontWeight: 700, color: C.ink, paddingLeft: 6 }}>{c.name}</span>
            <span style={{ fontFamily: F, fontSize: 10.5, color: C.faint }}>{ROLE_LABEL[c.role]}</span>
          </div>
        ))}
      </Card>
      {l && <button type="button" onClick={() => open({ t: "loc", id: l.id })} style={{ width: "100%", padding: 12, borderRadius: 10, border: "none", background: C.primary, color: "#fff", fontFamily: F, fontWeight: 800, fontSize: 13, cursor: "pointer" }}>Open {l.locality} dashboard</button>}
    </div>
  );
}

function AttentionScreen({ ctx, kind, locId, onBack, open, approvals, onDecide, th }) {
  const att = attentionFor(ctx, approvals, th, locId ? [locId] : null);
  const title = { pace: "Below required pace", disc: "Discounts above limit", canc: "Large booking cancellations", stock: "Aged stock" }[kind];
  return (
    <div style={{ padding: "14px 14px 90px" }}>
      <BackBar title={title} sub={locId ? LOC_BY_ID[locId].name : "All 100 outlets"} onBack={onBack} />
      {kind === "pace" && (
        <Card style={{ padding: "6px 10px" }}>
          <div style={{ fontFamily: F, fontSize: 11, color: C.faint, padding: "6px 4px" }}>Current daily pace is under {th.pace}% of the pace needed to hit target.</div>
          {att.pace.map(id => <LocRow key={id} l={LOC_BY_ID[id]} d={ctx.loc[id]} rank={ctx.rank[id]} onOpen={(x) => open({ t: "loc", id: x })} />)}
        </Card>
      )}
      {kind === "disc" && <ApprovalList list={att.disc} th={th} onDecide={onDecide} open={open} />}
      {kind === "canc" && (
        <Card>
          {att.canc.map(c => (
            <div key={c.id} style={{ padding: "9px 0", borderTop: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", gap: 6 }}>
                <span style={{ flex: 1, fontFamily: F, fontSize: 12.5, fontWeight: 700, color: C.ink }}>{c.customer}</span>
                <span style={{ fontFamily: F, fontSize: 12.5, fontWeight: 800, color: C.hot }}>{c.units} scooters</span>
              </div>
              <div style={{ fontFamily: F, fontSize: 11, color: C.faint }}>{LOC_BY_ID[c.locId].locality} · {inr(c.value)} · {c.reason} · {c.days === 0 ? "today" : `${c.days}d ago`}</div>
            </div>
          ))}
        </Card>
      )}
      {kind === "stock" && (
        <Card style={{ padding: "6px 12px" }}>
          <div style={{ fontFamily: F, fontSize: 11, color: C.faint, padding: "6px 0" }}>Units older than {th.stockAge >= 90 ? 90 : 60} days, by outlet.</div>
          {[...att.stockLocs].sort((a, b) => b.s.agedVal - a.s.agedVal).map(x => (
            <button key={x.id} type="button" onClick={() => open({ t: "loc", id: x.id })} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "9px 0",
              background: "none", border: "none", borderTop: `1px solid ${C.border}`, cursor: "pointer", textAlign: "left" }}>
              <span style={{ flex: 1, fontFamily: F, fontSize: 12.5, fontWeight: 700, color: C.ink }}>{LOC_BY_ID[x.id].locality}<span style={{ display: "block", fontSize: 10.5, color: C.faint, fontWeight: 500 }}>{LOC_BY_ID[x.id].city}</span></span>
              <span style={{ fontFamily: F, fontSize: 12, fontWeight: 800, color: C.hot }}>{x.s.aged} · {inr(x.s.agedVal)}</span>
              <ChevronRight size={13} color={C.ghost} />
            </button>
          ))}
        </Card>
      )}
    </div>
  );
}
function ApprovalList({ list, th, onDecide, open }) {
  if (!list.length) return <Card><div style={{ display: "flex", gap: 8, alignItems: "center", fontFamily: F, fontSize: 13, fontWeight: 700, color: C.green }}><CheckCircle2 size={15} /> Nothing waiting</div></Card>;
  return (
    <Card>
      {list.map(a => {
        const l = LOC_BY_ID[a.locId]; const lim = th.limit[l.format];
        return (
          <div key={a.id} style={{ padding: "10px 0", borderTop: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ flex: 1, minWidth: 0, fontFamily: F, fontSize: 12.5, fontWeight: 700, color: C.ink }}>{a.customer}</span>
              <span style={{ fontFamily: F, fontSize: 13, fontWeight: 900, color: a.ask > lim ? C.hot : C.ink }}>{rs(a.ask)}</span>
            </div>
            <div style={{ fontFamily: F, fontSize: 10.5, color: C.faint, marginTop: 1 }}>
              {a.variant} · {NODES[a.seId].name} · <button type="button" onClick={() => open({ t: "loc", id: l.id })} style={{ border: "none", background: "none", padding: 0, color: C.primary, fontFamily: F, fontSize: 10.5, fontWeight: 700, cursor: "pointer" }}>{l.locality}</button> · {a.hours}h
            </div>
            <div style={{ fontFamily: F, fontSize: 10.5, color: a.ask > lim ? C.hot : C.sub, marginTop: 2 }}>
              {a.ask > lim ? `${rs(a.ask - lim)} over the ${l.format} limit of ${rs(lim)}` : `Within the ${l.format} limit of ${rs(lim)}`}
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 7 }}>
              <button type="button" onClick={() => onDecide(a, "approve")} style={{ flex: 1, padding: "8px 0", borderRadius: 9, border: "none", background: C.primary, color: "#fff", fontFamily: F, fontWeight: 800, fontSize: 12, cursor: "pointer" }}>Approve</button>
              <button type="button" onClick={() => onDecide(a, "decline")} style={{ flex: 1, padding: "8px 0", borderRadius: 9, border: `1.5px solid ${C.borderStrong}`, background: C.card, color: C.sub, fontFamily: F, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Decline</button>
            </div>
          </div>
        );
      })}
    </Card>
  );
}

/* ============================ MONEY ============================ */
function GroupRowsBy({ ctx, gb, cfs }) {
  return groupSEs(ALL_SE, gb, cfs).map(g => ({ ...g, d: derive(sumIdx(ctx.rows, g.idx), ctx.P, ctx.th) }));
}
function DiscountsScreen({ ctx, period, setPeriod, cfs, approvals, onDecide, th, open }) {
  const [gb, setGb] = useState("state");
  const g = ctx.group;
  const limitOf = (idx) => { let s = 0, r = 0; idx.forEach(i => { const x = ctx.rows[i].retail; s += x * th.limit[SES[i].loc.format]; r += x; }); return r ? s / r : null; };
  const rows = GroupRowsBy({ ctx, gb, cfs }).map(r => ({ ...r, lim: limitOf(r.idx) })).sort((a, b) => (b.d.dps || 0) - (a.d.dps || 0));
  const gLim = limitOf(ALL_SE);
  const over = LOCS.filter(l => ctx.loc[l.id].dps > th.limit[l.format]).length;
  const pend = approvals.filter(a => a.ask > th.limit[LOC_BY_ID[a.locId].format]);
  return (
    <div style={{ padding: "14px 14px 90px" }}>
      <ScreenHead title="Discounts" blurb="Discount per scooter against the limit for each format. Summed ₹ ÷ summed units — never averaged." />
      <PeriodBar period={period} setPeriod={setPeriod} showCmp={false} />
      <Card>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 8 }}>
          <Stat k="Per scooter" v={rs(g.dps)} tone={g.dps > gLim ? C.hot : C.green} sub={`limit ${rs(gLim)}`} />
          <Stat k="Total given" v={inr(g.disc)} sub={`${nIN(g.retail)} scooters`} />
          <Stat k="Outlets over" v={`${over} of ${LOCS.length}`} tone={over ? C.hot : C.green} sub={`${pend.length} approvals`} />
        </div>
      </Card>
      <Card style={{ padding: "12px 12px" }}>
        <CardTitle Icon={IndianRupee} title="By grouping" right={<Dd label="Group by" value={gb} onChange={setGb} options={groupOptions(cfs)} />} />
        {rows.map(r => {
          const isLoc = gb === "loc";
          return (
            <button key={r.key} type="button" data-testid="disc-row" onClick={() => isLoc && open({ t: "loc", id: r.key })} style={{ display: "block", width: "100%", textAlign: "left", background: "none",
              border: "none", borderTop: `1px solid ${C.border}`, padding: "8px 0", cursor: isLoc ? "pointer" : "default" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <span style={{ flex: 1, minWidth: 0, fontFamily: F, fontSize: 12.5, fontWeight: 700, color: C.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.label}</span>
                <span style={{ fontFamily: F, fontSize: 12.5, fontWeight: 800, color: r.d.dps > r.lim ? C.hot : C.green }}>{rs(r.d.dps)}</span>
                <span style={{ fontFamily: F, fontSize: 10.5, color: C.faint, width: 78, textAlign: "right" }}>limit {rs(r.lim)}</span>
              </div>
              <Bar frac={div(r.d.dps, (r.lim || 1) * 1.5)} marker={1 / 1.5} tone={r.d.dps > r.lim ? C.hot : C.green} />
              <div style={{ fontFamily: F, fontSize: 10, color: C.faint, marginTop: 3 }}>{inr(r.d.disc)} on {nIN(r.d.retail)} scooters</div>
            </button>
          );
        })}
      </Card>
      <div style={{ fontFamily: F, fontSize: 13.5, fontWeight: 800, color: C.ink, margin: "6px 2px 8px" }}>Approvals pending · {approvals.length}</div>
      <ApprovalList list={approvals} th={th} onDecide={onDecide} open={open} />
    </div>
  );
}
const ADDON_METRICS = [
  { value: "fin", label: "Finance", f: d => div(d.fin, d.retail), fmt: (x) => pctS(x) },
  { value: "ins", label: "Insurance", f: d => div(d.ins, d.retail), fmt: (x) => pctS(x) },
  { value: "p2", label: "Plus Two", f: d => div(d.p2, d.retail), fmt: (x) => pctS(x) },
  { value: "p5", label: "Plus Five", f: d => div(d.p5, d.retail), fmt: (x) => pctS(x) },
  { value: "acc", label: "Accessories ₹", f: d => div(d.acc, d.retail), fmt: rs },
  { value: "exch", label: "Exchange", f: d => div(d.exch, d.retail), fmt: (x) => pctS(x) },
];
function AddonsScreen({ ctx, period, setPeriod, cfs, open }) {
  const [gb, setGb] = useState("state");
  const [m, setM] = useState("fin");
  const M = ADDON_METRICS.find(x => x.value === m);
  const g = ctx.group;
  const rows = GroupRowsBy({ ctx, gb, cfs }).sort((a, b) => (M.f(b.d) || 0) - (M.f(a.d) || 0));
  const max = Math.max(...rows.map(r => M.f(r.d) || 0), M.f(g) || 0, 0.0001);
  return (
    <div style={{ padding: "14px 14px 90px" }}>
      <ScreenHead title="Add-ons" blurb="Attach % and ₹ per scooter. Insurance is always sold with the scooter; River Care Plus Two (5 yrs) and Plus Five (8 yrs)." />
      <PeriodBar period={period} setPeriod={setPeriod} showCmp={false} />
      <Card>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 10 }}>
          {ADDON_METRICS.map(x => <Stat key={x.value} k={x.label} v={x.fmt(x.f(g))} sub={x.value === "acc" ? `${inr(g.acc)} total` : `${nIN(g[x.value])} of ${nIN(g.retail)}`} />)}
        </div>
      </Card>
      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 8 }}>
        {ADDON_METRICS.map(x => <Chip key={x.value} on={m === x.value} label={x.label} onClick={() => setM(x.value)} />)}
      </div>
      <Card style={{ padding: "12px 12px" }}>
        <CardTitle Icon={Plus} title={`${M.label} by grouping`} right={<Dd label="Group by" value={gb} onChange={setGb} options={groupOptions(cfs)} />} />
        <div style={{ fontFamily: F, fontSize: 10.5, color: C.faint, marginBottom: 6 }}>Black tick = group {M.fmt(M.f(g))}</div>
        {rows.map(r => (
          <button key={r.key} type="button" onClick={() => gb === "loc" && open({ t: "loc", id: r.key })} style={{ display: "block", width: "100%", textAlign: "left", background: "none",
            border: "none", borderTop: `1px solid ${C.border}`, padding: "8px 0", cursor: gb === "loc" ? "pointer" : "default" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <span style={{ flex: 1, minWidth: 0, fontFamily: F, fontSize: 12.5, fontWeight: 700, color: C.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.label}</span>
              <span style={{ fontFamily: F, fontSize: 12.5, fontWeight: 800, color: (M.f(r.d) || 0) >= (M.f(g) || 0) ? C.green : C.hot }}>{M.fmt(M.f(r.d))}</span>
            </div>
            <Bar frac={(M.f(r.d) || 0) / max} marker={(M.f(g) || 0) / max} tone={C.primary} />
            <div style={{ fontFamily: F, fontSize: 10, color: C.faint, marginTop: 3 }}>{nIN(r.d.retail)} scooters</div>
          </button>
        ))}
      </Card>
    </div>
  );
}

/* ============================ STOCK ============================ */
function StockScreen({ cfs, th, open }) {
  const [gb, setGb] = useState("state");
  const all = stockAgg(LOCS.map(l => l.id), th);
  const groups = groupLocs(LOCS, gb, cfs).map(g => ({ ...g, s: stockAgg(g.locs.map(l => l.id), th) })).sort((a, b) => b.s.agedVal - a.s.agedVal);
  const maxV = Math.max(...all.bv, 1);
  return (
    <div style={{ padding: "14px 14px 90px" }}>
      <ScreenHead title="Stock & ageing" blurb={`Units and ex-showroom ₹ by age. Interest at ${th.interest}% p.a. on stock value × days held.`} />
      <Card>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 8, marginBottom: 12 }}>
          <Stat k="In stock" v={`${nIN(all.units)}`} sub={inr(all.value)} />
          <Stat k={`Aged ${th.stockAge >= 90 ? "90+" : "61+"} d`} v={nIN(all.aged)} tone={C.hot} sub={inr(all.agedVal)} />
          <Stat k="Est. interest" v={inr(all.interest)} sub={`${all.demo} demo scooters`} />
        </div>
        {AGE_BUCKETS.map((b, i) => (
          <div key={b} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ width: 52, fontFamily: F, fontSize: 11, fontWeight: 700, color: C.sub }}>{b} d</span>
            <div style={{ flex: 1 }}><Bar frac={all.bv[i] / maxV} tone={i === 3 ? C.hot : i === 2 ? C.warm : C.primary} height={8} /></div>
            <span style={{ width: 112, textAlign: "right", fontFamily: F, fontSize: 11, fontWeight: 800, color: C.ink, whiteSpace: "nowrap" }}>{nIN(all.b[i])} · {inr(all.bv[i])}</span>
          </div>
        ))}
      </Card>
      <Card style={{ padding: "12px 12px" }}>
        <CardTitle Icon={Package} title="By grouping" right={<Dd label="Group by" value={gb} onChange={setGb} options={groupOptions(cfs, { people: false })} />} />
        {groups.map(g => (
          <button key={g.key} type="button" data-testid="stock-row" onClick={() => gb === "loc" && open({ t: "loc", id: g.key })} style={{ display: "block", width: "100%", textAlign: "left", background: "none",
            border: "none", borderTop: `1px solid ${C.border}`, padding: "8px 0", cursor: gb === "loc" ? "pointer" : "default" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ flex: 1, minWidth: 0, fontFamily: F, fontSize: 12.5, fontWeight: 700, color: C.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{g.label}</span>
              <span style={{ fontFamily: F, fontSize: 12, fontWeight: 800, color: C.ink }}>{nIN(g.s.units)} · {inr(g.s.value)}</span>
            </div>
            <div style={{ display: "flex", height: 6, borderRadius: 6, overflow: "hidden", margin: "5px 0 3px", background: C.bg }}>
              {g.s.b.map((n, i) => <div key={i} style={{ width: `${(n / (g.s.units || 1)) * 100}%`, background: [C.primary, "#8C96F0", C.warm, C.hot][i] }} />)}
            </div>
            <div style={{ fontFamily: F, fontSize: 10, color: C.faint }}>{g.locs.length} outlets · aged {nIN(g.s.aged)} ({inr(g.s.agedVal)}) · interest {inr(g.s.interest)}</div>
          </button>
        ))}
      </Card>
    </div>
  );
}

/* ============================ REPORTS / ACCOUNT ============================ */
function ReportsScreen({ showToast }) {
  const reps = [["Daily flash", "Retail, bookings, value by outlet — today and MTD"], ["State & city MIS", "The State & City dashboard as a sheet"],
    ["Discount register", "Every discount given and approved, by outlet and SE"], ["Stock ageing", "Units and ₹ by age bucket, variant and colour"],
    ["Add-on attach", "Finance, insurance, River Care, accessories, exchange"], ["People roster", `${PEOPLE_COUNT} people on the reporting line`]];
  return (
    <div style={{ padding: "14px 14px 90px" }}>
      <ScreenHead title="Reports" blurb="Group reports. Scheduling and custom reports come in build 2." />
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
function MyAccountScreen({ showToast }) {
  const [name, setName] = useState(CEO_NODE.name);
  const [email, setEmail] = useState("arvind.kesavan@autoprism.in");
  return (
    <div style={{ padding: "14px 14px 90px" }}>
      <ScreenHead title="My Account" blurb="Your login details and preferences." />
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
function Placeholder({ title, blurb, Icon = Settings }) {
  return (
    <div style={{ padding: "14px 14px 90px" }}>
      <ScreenHead title={title} blurb={blurb} />
      <div style={{ background: C.card, border: `1px dashed ${C.borderStrong}`, borderRadius: 14, padding: 28, textAlign: "center" }}>
        <Icon size={22} color={C.ghost} />
        <div style={{ fontFamily: F, fontSize: 13, color: C.sub, marginTop: 9 }}>Same as the Manager + Admin login — open it there.</div>
      </div>
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
      <ScreenHead title="Fields" blurb="Fields you can group by on every screen. Values left blank show as Unassigned."
        right={!creating && <button type="button" onClick={() => setCreating(true)} style={{ display: "inline-flex", alignItems: "center", gap: 4, border: "none", borderRadius: 9, background: C.primary, color: "#fff", fontFamily: F, fontWeight: 800, fontSize: 12, padding: "8px 11px", cursor: "pointer" }}><Plus size={13} />Field</button>} />
      {creating && (
        <Card>
          <Field label="Field name"><input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Mall outlet" /></Field>
          <Field label="Applies to">
            <div style={{ display: "flex", gap: 6 }}>{["Locations", "People"].map(a => <Chip key={a} on={applies === a} label={a} onClick={() => setApplies(a)} />)}</div>
          </Field>
          <Field label="Values (comma separated)"><input style={inputStyle} value={vals} onChange={e => setVals(e.target.value)} placeholder="e.g. Yes, No" /></Field>
          <div style={{ display: "flex", gap: 8 }}>
            <PrimaryBtn disabled={!name.trim()} onClick={() => {
              const key = "cf_" + name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_") + "_" + (cfs.length + 1);
              setCfs(l => [...l, { key, label: name.trim(), applies, values: vals.split(",").map(v => v.trim()).filter(Boolean), assign: {}, source: "Not assigned yet" }]);
              setCreating(false); setName(""); setVals(""); setOpenKey(key); showToast(`Field "${name.trim()}" created — now in every Group by`);
            }}>Create field</PrimaryBtn>
            <GhostBtn onClick={() => setCreating(false)}>Cancel</GhostBtn>
          </div>
        </Card>
      )}
      {all.map(f => {
        const isOpen = openKey === f.key;
        const cf = cfs.find(c => c.key === f.key);
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
                {countsFor(f).slice(0, 12).map(([v, n]) => (
                  <div key={v} style={{ display: "flex", fontFamily: F, fontSize: 12, padding: "5px 0", borderTop: `1px solid ${C.border}` }}>
                    <span style={{ flex: 1, color: v === "Unassigned" ? C.warm : C.ink, fontWeight: 600 }}>{v}</span>
                    <span style={{ color: C.sub }}>{n} {f.applies === "People" ? "SEs" : "outlets"}</span>
                  </div>
                ))}
                {countsFor(f).length > 12 && <div style={{ fontFamily: F, fontSize: 11, color: C.faint, paddingTop: 4 }}>+ {countsFor(f).length - 12} more values</div>}
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
const SHARE_OPTS = [{ value: "private", label: "Private" }, { value: "ZH", label: "Shared · Zone heads" }, { value: "AM", label: "Shared · Area managers" }, { value: "SM", label: "Shared · Sales managers" }];
function AdminViewsScreen({ views, setViews, cfs, showToast }) {
  return (
    <div style={{ padding: "14px 14px 90px" }}>
      <ScreenHead title="Views" blurb="Saved Group-by paths. Save new ones from the Board. Pinned views appear as chips above the group board." />
      {views.length === 0 && <Card><div style={{ fontFamily: F, fontSize: 12.5, color: C.sub }}>No saved views yet.</div></Card>}
      {views.map(v => (
        <Card key={v.id} style={{ padding: "12px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Bookmark size={14} color={v.pinned ? C.primary : C.ghost} />
            <span style={{ flex: 1, minWidth: 0, fontFamily: F, fontSize: 13, fontWeight: 800, color: C.ink }}>{v.name}</span>
            <button type="button" aria-label="Delete view" onClick={() => { setViews(l => l.filter(x => x.id !== v.id)); showToast(`View "${v.name}" deleted`); }} style={{ border: "none", background: "none", cursor: "pointer" }}><Trash2 size={14} color={C.faint} /></button>
          </div>
          <div style={{ fontFamily: F, fontSize: 11, color: C.sub, margin: "4px 0 8px 22px" }}>{v.seq.map(f => fieldLabel(f, cfs)).join(" → ")}</div>
          <div style={{ display: "flex", gap: 6, alignItems: "center", marginLeft: 22 }}>
            <Dd label="Sharing" value={v.share} onChange={(s) => { setViews(l => l.map(x => x.id === v.id ? { ...x, share: s } : x)); showToast(s === "private" ? "View is private" : `View shared with ${SHARE_OPTS.find(o => o.value === s).label.split("· ")[1]}`); }} options={SHARE_OPTS} />
            <Chip on={v.pinned} label={v.pinned ? "Pinned" : "Pin"} onClick={() => setViews(l => l.map(x => x.id === v.id ? { ...x, pinned: !x.pinned } : x))} />
          </div>
        </Card>
      ))}
    </div>
  );
}
function AdminThresholdsScreen({ th, setTh, showToast }) {
  const [t, setT] = useState(th);
  const num = (k, v) => setT(x => ({ ...x, [k]: Number(v) }));
  const row = (label, k, unit, sub) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 0", borderTop: `1px solid ${C.border}` }}>
      <span style={{ flex: 1, minWidth: 0, fontFamily: F, fontSize: 12.5, fontWeight: 600, color: C.ink }}>{label}{sub && <span style={{ display: "block", fontSize: 10.5, color: C.faint, fontWeight: 500 }}>{sub}</span>}</span>
      <input aria-label={label} type="number" value={k.includes(".") ? t.limit[k.split(".")[1]] : t[k]}
        onChange={e => k.includes(".") ? setT(x => ({ ...x, limit: { ...x.limit, [k.split(".")[1]]: Number(e.target.value) } })) : num(k, e.target.value)}
        style={{ ...inputStyle, width: 78, padding: "7px 8px", textAlign: "right" }} />
      <span style={{ width: 22, fontFamily: F, fontSize: 11, color: C.faint }}>{unit}</span>
    </div>
  );
  return (
    <div style={{ padding: "14px 14px 90px" }}>
      <ScreenHead title="Attention thresholds" blurb="These feed Needs attention on the Board and each location dashboard." />
      <Card>
        <div style={{ fontFamily: F, fontSize: 12, fontWeight: 800, color: C.sub, marginBottom: 4 }}>Location status</div>
        {row("On track at or above", "on", "%", "Projected achievement")}
        {row("At risk at or above", "risk", "%", "Below this is off track")}
        {row("Pace alert below", "pace", "%", "Of the daily pace needed to hit target")}
      </Card>
      <Card>
        <div style={{ fontFamily: F, fontSize: 12, fontWeight: 800, color: C.sub, marginBottom: 4 }}>Discount limit per scooter</div>
        {row("Flagship", "limit.Flagship", "₹")}
        {row("Store", "limit.Store", "₹")}
        {row("Express", "limit.Express", "₹")}
      </Card>
      <Card>
        <div style={{ fontFamily: F, fontSize: 12, fontWeight: 800, color: C.sub, marginBottom: 4 }}>Cancellations & stock</div>
        {row("Large cancellation from", "cancelUnits", "units", "Scooters on one booking")}
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 0", borderTop: `1px solid ${C.border}` }}>
          <span style={{ flex: 1, fontFamily: F, fontSize: 12.5, fontWeight: 600, color: C.ink }}>Aged stock from</span>
          <Dd label="Aged stock from" value={String(t.stockAge)} onChange={(v) => num("stockAge", v)} options={[{ value: "61", label: "61 days" }, { value: "90", label: "90 days" }]} />
        </div>
        {row("Interest on stock", "interest", "% pa")}
      </Card>
      <PrimaryBtn full onClick={() => {
        if (!(t.risk < t.on)) { showToast("At-risk must be below on-track"); return; }
        setTh(t); showToast("Thresholds saved — Needs attention updated");
      }}>Save thresholds</PrimaryBtn>
    </div>
  );
}

/* ============================ APP ============================ */
const DEFAULT_VIEWS = [
  { id: "v1", name: "States to people", seq: ["state", "city", "loc"], share: "ZH", pinned: true },
  { id: "v2", name: "Format mix", seq: ["format", "state", "loc"], share: "private", pinned: true },
];

export default function CEOApp() {
  const [tab, setTab] = useState("board");
  const [openGroup, setOpenGroup] = useState("performance");
  const [menuOpen, setMenuOpen] = useState(false);
  const [period, setPeriod] = useState("month");
  const [cmp, setCmp] = useState("target");
  const [th, setTh] = useState(DEFAULT_TH);
  const [views, setViews] = useState(DEFAULT_VIEWS);
  const [cfs, setCfs] = useState([]);
  const [approvals, setApprovals] = useState(APPROVALS_SEED);
  const [stack, setStack] = useState([]);
  const [boardNav, setBoardNav] = useState({ path: [], groupBy: "line", seq: null, hl: null });
  const [scNav, setScNav] = useState({ state: null, city: null });
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const scrollRef = useRef(null);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = 0; }, [tab]);
  const showToast = (m) => { setToast(m); clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToast(null), 2800); };

  const ctx = useMemo(() => buildCtx(period, th), [period, th]);
  const att = useMemo(() => attentionFor(ctx, approvals, th, null), [ctx, approvals, th]);
  const open = (v) => setStack(s => [...s, v]);
  const back = () => setStack(s => s.slice(0, -1));
  const go = (key) => { setStack([]); setTab(key); setMenuOpen(false); };
  const decide = (a, verb) => {
    setApprovals(l => l.filter(x => x.id !== a.id));
    showToast(`${verb === "approve" ? "Approved" : "Declined"} ${rs(a.ask)} for ${a.customer} — ${NODES[a.seId].name.split(" ")[0]} notified`);
  };
  const saveView = (v) => setViews(l => [...l, { ...v, id: "v" + Date.now(), share: "private", pinned: true }]);

  const NAV = [
    { key: "board", label: "Board", Icon: Target, subs: [] },
    { key: "performance", label: "Performance", Icon: BarChart3, subs: [
      { key: "performance:statecity", label: "State & City" }, { key: "performance:locations", label: "Locations" },
      { key: "x1", label: "Sales", off: true }, { key: "x2", label: "Models", off: true }, { key: "x3", label: "People", off: true },
    ]},
    { key: "money", label: "Money", Icon: IndianRupee, subs: [
      { key: "money:discounts", label: "Discounts" }, { key: "money:addons", label: "Add-ons" },
      { key: "x4", label: "Spend", off: true }, { key: "x5", label: "OEM incentives", off: true },
    ]},
    { key: "stock", label: "Stock", Icon: Package, subs: [
      { key: "stock:ageing", label: "Stock & ageing" },
      { key: "x6", label: "Days of stock", off: true }, { key: "x7", label: "Transfers", off: true }, { key: "x8", label: "Demo & used", off: true },
    ]},
    { key: "reports", label: "Reports", Icon: FileText, subs: [] },
    { key: "admin", label: "Admin", Icon: Settings, subs: [
      { key: "admin:fields", label: "Fields" }, { key: "admin:views", label: "Views" }, { key: "admin:thresholds", label: "Attention thresholds" },
      { key: "admin:users", label: "Users & Roles" }, { key: "admin:locations", label: "Locations" }, { key: "admin:vehicles", label: "Vehicles" },
    ]},
    { key: "account", label: "My Account", Icon: User, subs: [] },
  ];
  const [base, sub] = String(tab).split(":");
  const top = stack[stack.length - 1];
  const common = { ctx, period, setPeriod, cmp, setCmp, cfs, open };

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
        <button type="button" aria-label="Needs attention" onClick={() => { go("board"); }} style={{ position: "relative", display: "flex", background: "none", border: "none", padding: 0, cursor: "pointer" }}>
          <Bell size={18} color={C.sub} />
          {att.total > 0 && (
            <span style={{ position: "absolute", top: -4, right: -7, minWidth: 14, height: 14, borderRadius: 7, background: C.hot, color: "#fff", fontFamily: F, fontSize: 9,
              fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px" }}>{att.total}</span>
          )}
        </button>
        <span style={{ width: 30, height: 30, borderRadius: "50%", background: C.ink, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: F, fontWeight: 800, fontSize: 11.5 }}>AK</span>
      </div>

      <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
        <div ref={scrollRef} style={{ position: "absolute", inset: 0, overflowY: "auto", overflowX: "hidden" }}>
          {base === "board" && <BoardScreen {...common} nav={boardNav} setNav={setBoardNav} views={views} onSaveView={saveView} att={att} showToast={showToast} />}
          {base === "performance" && sub === "statecity" && <StateCityScreen {...common} nav={scNav} setNav={setScNav} />}
          {base === "performance" && sub === "locations" && <LocationsScreen {...common} />}
          {base === "money" && sub === "discounts" && <DiscountsScreen {...common} approvals={approvals} onDecide={decide} th={th} />}
          {base === "money" && sub === "addons" && <AddonsScreen {...common} />}
          {base === "stock" && <StockScreen cfs={cfs} th={th} open={open} />}
          {base === "reports" && <ReportsScreen showToast={showToast} />}
          {base === "account" && <MyAccountScreen showToast={showToast} />}
          {base === "admin" && (
            sub === "fields" ? <AdminFieldsScreen cfs={cfs} setCfs={setCfs} showToast={showToast} />
            : sub === "views" ? <AdminViewsScreen views={views} setViews={setViews} cfs={cfs} showToast={showToast} />
            : sub === "thresholds" ? <AdminThresholdsScreen th={th} setTh={setTh} showToast={showToast} />
            : <Placeholder title={sub === "users" ? "Users & Roles" : sub === "locations" ? "Locations" : "Vehicles"}
                blurb={`Group-wide ${sub === "users" ? `users (${PEOPLE_COUNT} people: ${ROLE_COUNTS.ZH} zone heads, ${ROLE_COUNTS.AM} area managers, ${ROLE_COUNTS.SM} sales managers, ${ROLE_COUNTS.TL} team leads, ${ROLE_COUNTS.SE} SEs)` : sub === "locations" ? `${LOCS.length} outlets` : "River Indie variants, prices and accessories"}.`} />
          )}
        </div>
        {top && (
          <div key={stack.length} style={{ position: "absolute", inset: 0, overflowY: "auto", overflowX: "hidden", background: C.bg, zIndex: 10 }}>
            {top.t === "loc" && <LocationScreen ctx={ctx} id={top.id} cmp={cmp} cfs={cfs} onBack={back} open={open} approvals={approvals} th={th} />}
            {top.t === "locs" && <LocListOverlay ctx={ctx} title={top.title} ids={top.ids} onBack={back} open={open} cmp={cmp} />}
            {top.t === "person" && <PersonScreen ctx={ctx} id={top.id} onBack={back} open={open} />}
            {top.t === "attn" && <AttentionScreen ctx={ctx} kind={top.kind} locId={top.locId} onBack={back} open={open} approvals={approvals} onDecide={decide} th={th} />}
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
                      <button key={s.key} data-testid={`nav-${s.key}`} disabled={s.off} onClick={() => !s.off && go(s.key)} style={{
                        display: "flex", alignItems: "center", width: "100%", padding: "8px 12px 8px 40px", borderRadius: 8, border: "none",
                        background: tab === s.key ? C.primarySoft : "none", cursor: s.off ? "default" : "pointer", textAlign: "left" }}>
                        <span style={{ flex: 1, fontFamily: F, fontWeight: tab === s.key ? 700 : 500, fontSize: 13, color: s.off ? C.ghost : tab === s.key ? C.primary : C.sub }}>{s.label}</span>
                        {s.off && <span style={{ fontFamily: F, fontSize: 9, fontWeight: 700, color: C.ghost, border: `1px solid ${C.border}`, borderRadius: 5, padding: "1px 5px" }}>Coming in build 2</span>}
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

