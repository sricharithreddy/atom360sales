import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  ChevronDown, ChevronLeft, ChevronRight, FileText, IndianRupee, MapPin, Menu, Package, Phone, Plus,
  Settings, Store, Target, Upload, User,
} from "lucide-react";
import { GROUP, ZONES, LOCATIONS, monthsOpen } from "../data/epicRiverLocations.js";

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
const VARIANTS = [{ key: "750W", price: P750 }, { key: "480W", price: P480 }];
const COLOURS = ["Monsoon Blue", "Summer Red", "Spring Yellow", "Winter White", "Storm Grey"];
const COLOUR_W = [0.26, 0.16, 0.14, 0.2, 0.24];

/* ---------------- Network: 100 outlets, as-is from the dataset ---------------- */
const ZONE_LABEL = Object.fromEntries(ZONES.map(z => [z.key, z.label]));
const STATE_ABBR = { Telangana: "TG", "Andhra Pradesh": "AP", Maharashtra: "MH", "Tamil Nadu": "TN", Karnataka: "KA" };
const FORMAT_BASE = { Flagship: 140, Store: 68, Express: 28 };   // mature monthly retail target
const SE_RANGE = { Flagship: [13, 15], Store: [7, 9], Express: [3, 5] };
const DEMO_UNITS = { Flagship: 3, Store: 2, Express: 1 };
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
    // River Care attach (units with Plus Two or Plus Five ÷ units), the Plus Five share of
    // those plans, and accessories ₹ per scooter — each varies by outlet.
    l.fin = rr(q, 0.36, 0.64); l.rc = rr(q, 0.27, 0.56); l.p5s = rr(q, 0.29, 0.41);
    l.acc = rr(q, 1000, 2550); l.exch = rr(q, 0.07, 0.22); l.mix = rr(q, 0.6, 0.8);
    l.obRate = rr(q, 0.3, 0.6); l.tdr = rr(q, 0.32, 0.55); l.bkr = rr(q, 0.08, 0.24);
    l.avgPrice = l.mix * P750 + (1 - l.mix) * P480;
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
        dpsF: l.dpsF * rr(q, 0.85, 1.15), fin: clamp(l.fin * rr(q, 0.8, 1.2), 0, 0.95),
        rc: clamp(l.rc * rr(q, 0.85, 1.15), 0.25, 0.6), p5s: clamp(l.p5s * rr(q, 0.85, 1.15), 0.25, 0.45),
        acc: clamp(l.acc * rr(q, 0.85, 1.15), 900, 2800),
        exch: l.exch * rr(q, 0.75, 1.25), mix: clamp(l.mix * rr(q, 0.9, 1.1), 0.4, 0.95),
      };
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
const KEYS = ["heads", "target", "retail", "book", "value", "acc", "rc", "p2", "p5", "rcVal"];
const SE_ROWS = (() => {
  const rows = new Array(SES.length);
  LOCS.forEach(l => {
    l.monthTarget = Math.round(tgtM(l, NOW_MI));
    l.mtd = nudge(Math.round(tgtM(l, NOW_MI) * l.factor * (DAY / MONTH_DAYS)), l.monthTarget, l.plan);
    const tA = splitInt(l.mtd, l.ses.map(i => SES[i].skill));
    const tT = splitInt(l.monthTarget, l.ses.map(i => SES[i].tw));
    l.ses.forEach((i, k) => {
      const s = SES[i];
      const retail = tA[k];
      const r750 = Math.round(retail * s.mix);
      const plans = Math.round(retail * s.rc);
      const p5 = Math.round(plans * s.p5s), p2 = plans - p5;
      rows[i] = {
        heads: 1, target: tT[k], retail, book: retail + Math.round(retail * s.bkr),
        value: r750 * P750 + (retail - r750) * P480,
        acc: Math.round((retail * s.acc) / 10) * 10,
        rc: plans, p2, p5, rcVal: p2 * RC_PLUS2 + p5 * RC_PLUS5,
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
function derive(a) {
  return {
    ...a,
    ach: div(a.retail, a.target),
    proj: (a.retail / DAY) * MONTH_DAYS,     // month projection at the current daily pace
    perUnit: div(a.value, a.retail), accPU: div(a.acc, a.retail),
    rcAtt: div(a.rc, a.retail), rcPU: div(a.rcVal, a.retail),
  };
}
const AGG = new Map();
const aggOf = (t) => { let a = AGG.get(t.key); if (!a) { a = derive(sumIdx(t.ses)); AGG.set(t.key, a); } return a; };
const GROUP_AGG = derive(sumIdx(ALL_SE));

/* ---------------- Stock (point in time) ---------------- */
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
  combos.forEach((c, k) => { c.b = splitInt(units[k], ageP.map(p => p * rr(r, 0.6, 1.4))); c.units = units[k]; });
  STOCK[l.id] = { combos, demo: DEMO_UNITS[l.format] };
});
const STOCK_AGG = new Map();
function stockOf(t) {
  let o = STOCK_AGG.get(t.key);
  if (o) return o;
  o = { units: 0, value: 0, aged: 0 };
  t.locIds.forEach(id => STOCK[id].combos.forEach(c => c.b.forEach((n, bi) => {
    o.units += n; o.value += n * c.price; if (bi === 3) o.aged += n;
  })));
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
  GROUP: C.ink, STATE: C.primary, CITY: C.purple, OUTLET: C.teal,
};
const AVATAR_BG = { ...LEVEL_TONE, SE: C.sub };
const LEGEND = {
  people: [["ZH", "ZH"], ["AM", "AM"], ["SM", "SM"], ["TL", "TL"], ["SE", "SE"]],
  locations: [["STATE", "State"], ["CITY", "City"], ["OUTLET", "Outlet"]],
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

function TreeRow({ t, depth, expanded, onToggle, onOutlet, parent, cols, agg }) {
  const a = agg(t);
  const open = expanded.has(t.key);
  const isOutlet = t.kind === "OUTLET" && onOutlet;
  const clickable = t.hasKids || isOutlet;
  const attrs = Object.fromEntries(Object.entries(a).filter(([, v]) => typeof v === "number").map(([k, v]) => [`data-${k.toLowerCase()}`, v]));
  return (
    <>
      <div data-testid="tree-row" data-key={t.key} data-parent={parent ? parent.key : ""} data-depth={depth} data-kind={t.kind} {...attrs}
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
              {t.node ? shortName(t.name) : t.name}
            </span>
            <span style={{ display: "block", fontFamily: F, fontSize: 10, color: C.faint, marginTop: 1,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {rowSub(t, parent && parent.node ? shortName(parent.name).split(" ")[0] : null)}
            </span>
          </span>
        </button>
        {cols.map(c => <span key={c.key} style={{ width: c.w, flexShrink: 0, textAlign: c.align || "center",
          paddingRight: c.align === "right" ? 4 : 0 }}>{c.cell(a, t)}</span>)}
      </div>
      {open && t.hasKids && t.kids().map(ch => (
        <TreeRow key={ch.key} t={ch} depth={depth + 1} expanded={expanded} onToggle={onToggle} onOutlet={onOutlet}
          parent={t} cols={cols} agg={agg} />
      ))}
    </>
  );
}
function TreeHead({ cols }) {
  const h = { fontFamily: F, fontSize: 9, fontWeight: 800, color: C.sub, textTransform: "uppercase", letterSpacing: 0.2 };
  return (
    <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: 7, borderBottom: `1.5px solid ${C.borderStrong}` }}>
      <span style={{ ...h, flex: 1, letterSpacing: 0.4, paddingLeft: 5 }}>Name</span>
      {cols.map(c => <span key={c.key} style={{ ...h, width: c.w, flexShrink: 0, textAlign: c.align || "center", paddingRight: c.align === "right" ? 4 : 0 }}>{c.label}</span>)}
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

/* ---------------- Column sets ---------------- */
const num = (v, strong) => (
  <span style={{ fontFamily: F, fontSize: 12.5, fontWeight: strong ? 700 : 600, color: strong ? C.ink : C.sub }}>{v}</span>
);
const small = (v, color = C.faint, size = 9) => (
  <span style={{ display: "block", fontFamily: F, fontSize: size, marginTop: 2, color, whiteSpace: "nowrap", lineHeight: 1.15 }}>{v}</span>
);
const BOARD_COLS = [
  { key: "t", label: "Target", w: 42, cell: (a) => num(nIN(a.target)) },
  { key: "r", label: "Retail", w: 52, cell: (a) => (
    <>
      <span style={{ display: "block", fontFamily: F, fontSize: 12.5, fontWeight: 700, lineHeight: 1, color: C.ink }}>{nIN(a.retail)}</span>
      {small(pctS(a.ach))}
      {small(`proj ${nIN(a.proj)}`, C.faint, 8.5)}
    </>
  ) },
  { key: "b", label: "Book", w: 40, cell: (a) => num(nIN(a.book)) },
  { key: "v", label: "Value", w: 58, align: "right", cell: (a) => (
    <span style={{ fontFamily: F, fontSize: 11.5, fontWeight: 700, color: C.ink, whiteSpace: "nowrap" }}>{inr(a.value)}</span>
  ) },
];
// Better than the group by more than 5% → green; worse by more than 5% → red; ink otherwise.
const vsTone = (x, g) => (!ok(x) || !ok(g) ? C.faint : x > g * 1.05 ? C.green : x < g * 0.95 ? C.hot : C.ink);
const G = GROUP_AGG;
const FIN_COLS = [
  { key: "u", label: "Units", w: 38, cell: (a) => num(nIN(a.retail), true) },
  { key: "s", label: "Sales", w: 58, cell: (a) => (
    <>
      <span style={{ display: "block", fontFamily: F, fontSize: 11.5, fontWeight: 700, lineHeight: 1, color: C.ink, whiteSpace: "nowrap" }}>{inr(a.value)}</span>
      {small(lakh(a.perUnit), vsTone(a.perUnit, G.perUnit) === C.ink ? C.faint : vsTone(a.perUnit, G.perUnit))}
    </>
  ) },
  { key: "a", label: "Acc/unit", w: 48, cell: (a) => (
    <span style={{ fontFamily: F, fontSize: 11.5, fontWeight: 700, color: vsTone(a.accPU, G.accPU) }}>{rs(a.accPU)}</span>
  ) },
  { key: "rc", label: "River Care", w: 50, align: "right", cell: (a) => (
    <>
      <span style={{ display: "block", fontFamily: F, fontSize: 12, fontWeight: 700, lineHeight: 1, color: vsTone(a.rcAtt, G.rcAtt) }}>{pctS(a.rcAtt)}</span>
      {small(rs(a.rcPU))}
    </>
  ) },
];
const STOCK_COLS = [
  { key: "u", label: "Units", w: 46, cell: (s) => num(nIN(s.units), true) },
  { key: "v", label: "Value", w: 62, cell: (s) => <span style={{ fontFamily: F, fontSize: 11.5, fontWeight: 700, color: C.ink, whiteSpace: "nowrap" }}>{inr(s.value)}</span> },
  { key: "a", label: "90+ days", w: 52, align: "right", cell: (s) => (
    <span style={{ fontFamily: F, fontSize: 12.5, fontWeight: 700, color: s.aged > 0 ? C.hot : C.faint }}>{nIN(s.aged)}</span>
  ) },
];

/* ============================ BOARD ============================ */
function TreeCard({ title, Icon, testid, hintPeople, hintLoc, cols, open, top, mode, setMode }) {
  const [exP, toggleP] = useExpanded([PEOPLE_ROOT.key]);
  const [exL, toggleL] = useExpanded([LOC_ROOT.key]);
  const people = mode === "people";
  return (
    <Card style={TABLE_CARD} data-testid={`${testid}-card`}>
      <CardHead Icon={Icon} title={title} testid={testid}
        right={setMode && <Seg value={mode} onChange={setMode} opts={MODES} testid={`${testid}-mode`} />}
        hint={people ? hintPeople : hintLoc} />
      {top}
      {setMode && <Legend items={LEGEND[mode]} />}
      <TreeHead cols={cols} />
      {people
        ? <TreeRow t={PEOPLE_ROOT} depth={0} expanded={exP} onToggle={toggleP} cols={cols} agg={aggOf} />
        : <TreeRow t={LOC_ROOT} depth={0} expanded={exL} onToggle={toggleL} onOutlet={open} cols={cols} agg={aggOf} />}
    </Card>
  );
}
function BoardScreen({ open }) {
  const [mode, setMode] = useState("people");
  return (
    <div style={{ padding: "14px 14px 90px" }}>
      <PeriodLine />
      <TreeCard title="Target achievement" Icon={Target} testid="board-title" cols={BOARD_COLS} open={open} mode={mode} setMode={setMode}
        hintPeople="Tap a name to expand. Proj = month at today's pace."
        hintLoc="Tap a name to expand, an outlet to open it." />
    </div>
  );
}

/* ============================ FINANCE ============================ */
function Quiet({ k, v, sub }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontFamily: F, fontSize: 9, fontWeight: 800, color: C.faint, textTransform: "uppercase", letterSpacing: 0.4 }}>{k}</div>
      <div style={{ fontFamily: F, fontSize: 14, fontWeight: 800, color: C.ink, marginTop: 2, whiteSpace: "nowrap" }}>{v}</div>
      {sub && <div style={{ fontFamily: F, fontSize: 9.5, color: C.faint, marginTop: 1, whiteSpace: "nowrap" }}>{sub}</div>}
    </div>
  );
}
function FinanceScreen({ open }) {
  const [mode, setMode] = useState("people");
  const top = (
    <div data-testid="fin-summary" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: "10px 12px", padding: "6px 4px 12px" }}>
      <Quiet k="Total sales" v={`₹${(G.value / 1e7).toFixed(1)} Cr`} sub={`${nIN(G.retail)} units · ex-showroom`} />
      <Quiet k="Realisation" v={`${rs(G.perUnit)}`} sub="per unit" />
      <Quiet k="Accessories" v={rs(G.accPU)} sub="per unit" />
      <Quiet k="River Care" v={`${pctS(G.rcAtt)} attach`} sub={`${rs(G.rcPU)} per unit`} />
    </div>
  );
  return (
    <div style={{ padding: "14px 14px 90px" }}>
      <PeriodLine />
      <TreeCard title="Finance" Icon={IndianRupee} testid="fin-title" cols={FIN_COLS} open={open} mode={mode} setMode={setMode} top={top}
        hintPeople="Green: better than group by 5%+, red: worse. Tap to expand."
        hintLoc="Green: better than group by 5%+, red: worse. Tap to expand." />
    </div>
  );
}

/* ============================ STOCK ============================ */
function StockScreen({ open }) {
  const [ex, toggle] = useExpanded([LOC_ROOT.key]);
  return (
    <div style={{ padding: "14px 14px 90px" }}>
      <div style={{ fontFamily: F, fontSize: 11, color: C.faint, margin: "0 0 9px 4px" }}>Today · ex-showroom value</div>
      <Card style={TABLE_CARD}>
        <CardHead Icon={Package} title="Stock" testid="stock-title" hint="Tap a name to expand. 90+ days is aged stock." />
        <TreeHead cols={STOCK_COLS} />
        <TreeRow t={LOC_ROOT} depth={0} expanded={ex} onToggle={toggle} onOutlet={open} cols={STOCK_COLS} agg={stockOf} />
      </Card>
    </div>
  );
}

/* ============================ OUTLET PAGE ============================ */
function OutletScreen({ id, onBack }) {
  const l = LOC_BY_ID[id];
  const only = useMemo(() => Object.assign(new Set(l.ses), { tag: "o" + l.id }), [l]);
  const root = peopleNode(NODES[l.smId], only);
  const [ex, toggle] = useExpanded([root.key]);
  const a = derive(sumIdx(l.ses));
  const line = (k, v, tone, gv, sub) => (
    <div key={k} data-testid="outlet-fin-row" style={{ display: "flex", alignItems: "baseline", gap: 8, padding: "9px 4px", borderTop: `1px solid ${C.border}` }}>
      <span style={{ flex: 1, minWidth: 0, fontFamily: F, fontSize: 12.5, fontWeight: 600, color: C.ink }}>{k}
        {sub && <span style={{ display: "block", fontSize: 10, color: C.faint, fontWeight: 500 }}>{sub}</span>}</span>
      <span style={{ fontFamily: F, fontSize: 13, fontWeight: 800, color: tone }}>{v}</span>
      <span style={{ width: 92, textAlign: "right", fontFamily: F, fontSize: 10, color: C.faint, whiteSpace: "nowrap" }}>group {gv}</span>
    </div>
  );
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
        <TreeHead cols={BOARD_COLS} />
        <TreeRow t={root} depth={0} expanded={ex} onToggle={toggle} cols={BOARD_COLS} agg={aggOf} />
      </Card>
      <Card>
        <CardHead Icon={IndianRupee} title="Finance" hint="This outlet, with the group in grey. Green / red = 5%+ better / worse." />
        {line("Total sales", inr(a.value), C.ink, inr(G.value), `${nIN(a.retail)} units`)}
        {line("Realisation", rs(a.perUnit), vsTone(a.perUnit, G.perUnit), rs(G.perUnit), "₹ per unit")}
        {line("Accessories", rs(a.accPU), vsTone(a.accPU, G.accPU), rs(G.accPU), "₹ per unit")}
        {line("River Care attach", pctS(a.rcAtt), vsTone(a.rcAtt, G.rcAtt), pctS(G.rcAtt), `${rs(a.rcPU)} per unit · group ${rs(G.rcPU)}`)}
      </Card>
    </div>
  );
}

/* ============================ REPORTS / ACCOUNT ============================ */
function ReportsScreen({ showToast }) {
  const reps = [["Daily flash", "Retail, bookings and value by outlet — today and MTD"],
    ["Finance MIS", "Sales, ₹/unit, accessories and River Care by outlet"],
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
  { key: "finance", label: "Finance", Icon: IndianRupee, subs: [] },
  { key: "stock", label: "Stock", Icon: Package, subs: [] },
  { key: "reports", label: "Reports", Icon: FileText, subs: [] },
  { key: "admin", label: "Admin", Icon: Settings, subs: [
    { key: "admin:fields", label: "Fields" }, { key: "admin:locations", label: "Locations" },
  ]},
  { key: "account", label: "My Account", Icon: User, subs: [] },
];

export default function CEOApp() {
  const [tab, setTab] = useState("board");
  const [openGroup, setOpenGroup] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cfs, setCfs] = useState([]);
  const [stack, setStack] = useState([]);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const scrollRef = useRef(null);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = 0; }, [tab]);
  const showToast = (m) => { setToast(m); clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToast(null), 2800); };

  const open = (id) => setStack(s => [...s, id]);
  const back = () => setStack(s => s.slice(0, -1));
  const go = (key) => { setStack([]); setTab(key); setMenuOpen(false); };
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
          {base === "board" && <BoardScreen open={open} />}
          {base === "finance" && <FinanceScreen open={open} />}
          {base === "stock" && <StockScreen open={open} />}
          {base === "reports" && <ReportsScreen showToast={showToast} />}
          {base === "account" && <MyAccountScreen showToast={showToast} />}
          {base === "admin" && (sub === "locations"
            ? <AdminLocationsScreen cfs={cfs} open={open} />
            : <AdminFieldsScreen cfs={cfs} setCfs={setCfs} showToast={showToast} />)}
        </div>
        {top && (
          <div key={stack.length} style={{ position: "absolute", inset: 0, overflowY: "auto", overflowX: "hidden", background: C.bg, zIndex: 10 }}>
            <OutletScreen id={top} onBack={back} />
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
