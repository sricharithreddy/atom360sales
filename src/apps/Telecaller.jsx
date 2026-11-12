import React, { useState, useEffect, useLayoutEffect, useRef, useMemo } from "react";
import {
  AlertTriangle, BarChart3, Calendar, Camera, Car, Check, CheckCircle2, CheckSquare, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, ClipboardList, Clock, Copy, Download, Eye, FileText, Filter, GraduationCap, Headphones, Image, Link2, Lock, LogOut, Mail, MapPin, Menu, MessageSquare, Mic, MoreHorizontal, Navigation, Package, Pause, Pencil, Phone, Play, PlayCircle, Plus, Search, Settings, Sparkles, Square, Star, Store, Tag, TrendingUp, User, UserPlus, Users, Wind, X, Zap,
} from "lucide-react";

/* ============================== TOKENS ============================== */
const C = {
  bg: "#F3F4F9", card: "#FFFFFF", border: "#E7EAF3", borderStrong: "#D5DAE8",
  ink: "#0B1946", sub: "#4F5A7D", faint: "#6B7596", ghost: "#AEB4CB",
  primary: "#3B4BE8", primaryDark: "#2F3CC4", primarySoft: "rgba(59,75,232,0.09)",
  hot: "#E53935", hotSoft: "rgba(229,57,53,0.08)",
  warm: "#F59E0B", warmSoft: "rgba(245,158,11,0.08)",
  cold: "#1565C0", coldSoft: "rgba(21,101,192,0.08)",
  green: "#2E7D32", greenSoft: "rgba(46,125,50,0.08)",
  yellow: "#EAB308", yellowSoft: "rgba(234,179,8,0.10)",
  darkGreen: "#1B5E20", darkGreenSoft: "rgba(27,94,32,0.10)",
  purple: "#6D28D9", purpleSoft: "rgba(109,40,217,0.08)",
  teal: "#00695C", tealSoft: "rgba(0,105,92,0.08)",
  gold: "#92400E",
};
const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');`;
const F = `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
const ini = n => n.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase();
const shadow = "0 1px 2px rgba(0,0,0,0.05), 0 6px 18px rgba(0,0,0,0.08)";
const ME = { name: "Priya Nambiar" };
const today = new Date();
const genActivityId = () => `act_${Date.now().toString(36)}${Math.random().toString(36).slice(2,7)}`;
const d = offset => { const x = new Date(); x.setDate(x.getDate() + offset); return x; };
const fmtDateTime = dt => dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) + ", " + dt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
// Date N days ago at a specific hour — lets seeded call history spread across the day
// so the time-of-day chart has something real to show.
function dh(days, hour) { const x = d(days); x.setHours(hour, 0, 0, 0); return x; }
const fmtDate = dt => dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
// 5 stars = near-certain conversion, 1 star = weak signal — same tiering as the border colors,
// just in a form that doesn't require reading a percentage to understand.
function propensityStars(p) { return Math.max(1, Math.min(5, Math.round(p / 20))); }
function PropensityStars({ propensity, size = 12 }) {
  const filled = propensityStars(propensity);
  return (
    <div style={{ display: "flex", gap: 1 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={size} color={i <= filled ? "#F5A623" : "#B9B5AC"} fill={i <= filled ? "#F5A623" : "none"} strokeWidth={1.5} />
      ))}
    </div>
  );
}

/* ============================== CONFIG ============================== */
const SIGNAL_META = {
  finance_needed:   { label: "Finance Needed",   color: C.cold,  soft: C.coldSoft },
  exchange:         { label: "Exchange",         color: C.teal,  soft: C.tealSoft },
  urgent:           { label: "Urgent",           color: C.hot,   soft: C.hotSoft },
};
const EXCHANGE_CONDITIONS = [
  { key: "scrap", label: "Scrap", multiplier: 0.5 },
  { key: "very_bad", label: "Very Bad", multiplier: 0.7 },
  { key: "bad", label: "Bad", multiplier: 0.85 },
  { key: "good", label: "Good", multiplier: 1.0 },
  { key: "very_good", label: "Very Good", multiplier: 1.15 },
  { key: "excellent", label: "Excellent", multiplier: 1.3 },
];
// Same estimate formula as the SE app (pulse-crm.jsx) — a rough system estimate range,
// one condition grade below to one above what's selected. The SE's physical appraisal
// after handoff is what actually confirms the final value; this is just a live indicator
// during the call so the telecaller (and customer) aren't going in blind.
const OWNERSHIP_OPTIONS = [
  { key: "1st", label: "1st Owner", multiplier: 1.0 },
  { key: "2nd", label: "2nd Owner", multiplier: 0.95 },
  { key: "3rd", label: "3rd Owner", multiplier: 0.88 },
  { key: "more", label: "4th Owner or More", multiplier: 0.80 },
];
function exchangeBaseValue(year, odometer) {
  const y = parseInt(year, 10);
  const km = parseInt(odometer, 10);
  if (!y || !km) return null;
  const age = Math.max(0, today.getFullYear() - y);
  return Math.max(0.8, 7.5 - age * 0.55 - (km / 10000) * 0.12);
}
function exchangeRange(year, odometer, conditionKey, ownershipKey) {
  const base = exchangeBaseValue(year, odometer);
  const idx = EXCHANGE_CONDITIONS.findIndex(c => c.key === conditionKey);
  if (base == null || idx === -1) return null;
  // Ownership count is a real factor in resale value — a 1st-owner car commands a premium,
  // each subsequent owner chips away at it. Defaults to no discount if not entered yet, so
  // the estimate still works before the telecaller has asked.
  const ownershipMult = OWNERSHIP_OPTIONS.find(o => o.key === ownershipKey)?.multiplier ?? 1.0;
  const lowIdx = Math.max(0, idx - 1);
  const highIdx = Math.min(EXCHANGE_CONDITIONS.length - 1, idx + 1);
  return {
    low: +(base * EXCHANGE_CONDITIONS[lowIdx].multiplier * ownershipMult).toFixed(1),
    high: +(base * EXCHANGE_CONDITIONS[highIdx].multiplier * ownershipMult).toFixed(1),
  };
}
const FINANCE_STATUSES = [
  { key: "applied", label: "Applied" },
  { key: "review", label: "Under Review" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];
const PAYMENT_SOURCES = [
  { key: "cash", label: "Cash" },
  { key: "upi", label: "UPI" },
  { key: "bank_transfer", label: "Bank Transfer / NEFT" },
  { key: "cheque", label: "Cheque" },
  { key: "card", label: "Debit / Credit Card" },
];
// Same palette used across the SE app's inventory — customer color preference, independent
// of which model/variant they land on (the SE confirms actual stock availability later).
const COLOR_OPTIONS = ["Atlas White", "Titan Grey", "Fiery Red", "Abyss Black", "Amazon Grey", "Starry Night", "Gravity Gold", "Ranger Khaki"];
// Customer-stated contact preference. Not a nicety — DPDP purpose-limitation and TRAI's DND
// framework both mean continuing to call/message someone who's restricted a channel is a real
// compliance exposure, so this is treated as a hard restriction, not a soft suggestion.
const COMM_PREFS = [
  { key: "phone", label: "Phone Only", Icon: Phone },
  { key: "whatsapp", label: "WhatsApp Only", Icon: MessageSquare },
  { key: "email", label: "Email Only", Icon: Mail },
];
function commPrefMeta(key) { return COMM_PREFS.find(c => c.key === key) || null; }
function channelBlocked(lead, channel) { return !!lead.commPref && lead.commPref !== channel; }
const MODELS = ["Alcazar", "Creta", "Exter", "Ioniq 5", "Tucson", "Venue", "Verna", "i20"];
const VARIANT_PRICES = {
  "Alcazar": { "Prestige 6-str": 19.9, "Platinum 7-str": 22.9, "Signature 6-str": 24.5, "Signature(O) 7-str": 25.8 },
  "Creta": { "E": 11.2, "EX": 12.8, "S": 14.5, "SX": 16.9, "SX(O) Diesel AT": 18.4, "SX(O) Turbo DCT": 19.8, "N Line N8": 17.5 },
  "Exter": { "E": 6.1, "EX": 7.5, "S": 8.8, "SX Knight": 11.1, "SX(O) CNG": 10.2 },
  "Ioniq 5": { "RWD Standard": 44.6, "RWD Long Range": 46.6, "AWD Long Range": 48.2 },
  "Tucson": { "Signature": 28.5, "Signature AWD": 32.2, "Platinum": 30.5, "Hybrid AWD": 34.5 },
  "Venue": { "E": 7.9, "S": 9.2, "SX Dual Tone": 11.6, "S Turbo DCT": 10.9, "SX(O) Turbo": 12.9 },
  "Verna": { "E": 10.9, "S": 12.8, "SX": 14.5, "SX(O)": 16.4, "SX(O) Turbo DCT": 17.9 },
  "i20": { "Era": 7.2, "Magna": 8.0, "Sportz": 8.6, "Asta (O)": 9.9, "N Line": 11.4 },
};
const MODEL_VARIANTS = {
  "Alcazar": ["Prestige 6-str", "Platinum 7-str", "Signature 6-str", "Signature(O) 7-str"],
  "Creta": ["E", "EX", "S", "SX", "SX(O) Diesel AT", "SX(O) Turbo DCT", "N Line N8"],
  "Exter": ["E", "EX", "S", "SX Knight", "SX(O) CNG"],
  "Ioniq 5": ["RWD Standard", "RWD Long Range", "AWD Long Range"],
  "Tucson": ["Signature", "Signature AWD", "Platinum", "Hybrid AWD"],
  "Venue": ["E", "S", "SX Dual Tone", "S Turbo DCT", "SX(O) Turbo"],
  "Verna": ["E", "S", "SX", "SX(O)", "SX(O) Turbo DCT"],
  "i20": ["Era", "Magna", "Sportz", "Asta (O)", "N Line"],
};
const YET_TO_DECIDE = "Yet to decide";

// Approximate real-world price ladder per model — first variant is the base trim, last is
// the top trim, with everything in between interpolated evenly.
const MODEL_PRICE_RANGE = {
  "Creta": [11.2, 20.2], "Venue": [7.9, 13.3], "i20": [7.2, 11.5], "Verna": [10.9, 18.2],
  "Exter": [6.1, 11.2], "Alcazar": [19.9, 26.1], "Tucson": [28.5, 34.6],
};
function priceForVariant(model, variantIndex, totalVariants) {
  const [base, top] = MODEL_PRICE_RANGE[model] || [8, 15];
  if (totalVariants === 1) return base;
  return +(base + (top - base) * (variantIndex / (totalVariants - 1))).toFixed(1);
}

// Discounts can be set at whichever level is broadest for the situation — an aging model
// needing a push, one slow variant, or just one unpopular colour sitting on the lot. The most
// specific level that matches wins.
const DISCOUNTS = {
  model: { "i20": 10000 },
  variant: { "Tucson::AWD": 40000 },
  color: { "Alcazar::Platinum::Ranger Khaki": 25000 },
};
function discountFor(model, variant, color) {
  if (DISCOUNTS.color[`${model}::${variant}::${color}`] != null) return DISCOUNTS.color[`${model}::${variant}::${color}`];
  if (DISCOUNTS.variant[`${model}::${variant}`] != null) return DISCOUNTS.variant[`${model}::${variant}`];
  if (DISCOUNTS.model[model] != null) return DISCOUNTS.model[model];
  return 0;
}
// Base commission is roughly half a percent of the sale price, rounded to a clean figure.
// Pushing discounted stock (which usually means it's not moving on its own) and clearing
// demo/used units both carry a bonus on top, since that's the stock that most needs a nudge.
function commissionFor(priceLakh, discountAmount, isUsed) {
  const base = Math.round((priceLakh * 100000 * 0.005) / 100) * 100;
  const discountBonus = discountAmount > 0 ? Math.round((discountAmount * 0.10) / 100) * 100 : 0;
  const usedBonus = isUsed ? 500 : 0;
  return base + discountBonus + usedBonus;
}

// Every model+variant carries 2-4 color options, each with its own stock count and waiting
// time — deterministic from a hash so the numbers stay stable across reloads rather than
// reshuffling randomly.
function inventoryColorsFor(model, variant, priceLakh) {
  const paletteSize = 2 + (hashStr(model + variant) % 3); // 2-4 colors
  const colors = [];
  for (let i = 0; i < paletteSize + 2; i++) {
    if (colors.length >= paletteSize) break;
    const color = COLOR_OPTIONS[hashStr(model + variant + i) % COLOR_OPTIONS.length];
    if (colors.some(c => c.color === color)) continue;
    const h = hashStr(model + variant + color);
    const units = h % 9; // 0-8 units
    const waitingDays = units >= 4 ? 0 : units >= 1 ? 5 + (h % 12) : 18 + (h % 25);
    const status = units >= 4 ? "In Stock" : units >= 1 ? "Low Stock" : "In Transit";
    const discount = discountFor(model, variant, color);
    const commission = commissionFor(priceLakh, discount, false);
    colors.push({ color, units, waitingDays, status, discount, commission });
  }
  return colors;
}
const INVENTORY = Object.entries(MODEL_VARIANTS).map(([model, variants]) => ({
  model,
  variants: variants.map((variant, i) => {
    const priceLakh = priceForVariant(model, i, variants.length);
    return { variant, priceLakh, colors: inventoryColorsFor(model, variant, priceLakh) };
  }),
}));
const INVENTORY_STATUS_META = {
  "In Stock": { color: C.green, soft: C.greenSoft },
  "Low Stock": { color: C.warm, soft: C.warmSoft },
  "In Transit": { color: C.cold, soft: C.coldSoft },
};
function inventoryLookup(model, variant, color) {
  const m = INVENTORY.find(i => i.model === model);
  const v = m?.variants.find(x => x.variant === variant);
  return v?.colors.find(x => x.color === color) || null;
}

// Demo/used units — each is a specific, one-off car (not restockable stock), typically sold
// off at a discount once it's done its time as a test-drive unit.
const USED_INVENTORY = [
  { id: 1, model: "Creta", variant: "SX(O)", color: "Atlas White", year: 2024, kmDriven: 3200, condition: "Excellent", originalPriceLakh: 18.4, discountLakh: 1.2, note: "Demo unit — 6 months old, single owner (dealership)." },
  { id: 2, model: "Venue", variant: "SX(O) Turbo", color: "Fiery Red", year: 2024, kmDriven: 5100, condition: "Excellent", originalPriceLakh: 12.9, discountLakh: 0.9, note: "Demo unit — test-drive car, minor wear on seats." },
  { id: 3, model: "Verna", variant: "SX(O)", color: "Starry Night", year: 2023, kmDriven: 8400, condition: "Good", originalPriceLakh: 16.4, discountLakh: 1.6, note: "Ex-showroom display unit, full service history." },
  { id: 4, model: "Alcazar", variant: "Platinum", color: "Abyss Black", year: 2024, kmDriven: 4600, condition: "Excellent", originalPriceLakh: 22.9, discountLakh: 1.8, note: "Demo unit — management car, always serviced on time." },
  { id: 5, model: "Exter", variant: "SX(O)", color: "Amazon Grey", year: 2023, kmDriven: 9800, condition: "Good", originalPriceLakh: 10.2, discountLakh: 0.7, note: "Demo unit, ready for immediate delivery." },
  { id: 6, model: "Tucson", variant: "AWD", color: "Titan Grey", year: 2023, kmDriven: 6200, condition: "Excellent", originalPriceLakh: 32.2, discountLakh: 2.5, note: "Showroom display unit, top-of-line trim." },
];
function usedFinalPrice(u) { return +(u.originalPriceLakh - u.discountLakh).toFixed(2); }
// Real stock availability for a model+variant, used when confirming delivery timelines with a
// customer — aggregates across colors so the telecaller has an accurate answer, not a guess.
function inventoryAvailabilityFor(model, variant) {
  const modelEntry = INVENTORY.find(m => m.model === model);
  const variantEntry = modelEntry?.variants.find(v => v.variant === variant);
  if (!variantEntry) return null;
  const totalUnits = variantEntry.colors.reduce((s, c) => s + c.units, 0);
  const inStockColors = variantEntry.colors.filter(c => c.units > 0);
  const minWait = inStockColors.length ? 0 : Math.min(...variantEntry.colors.map(c => c.waitingDays));
  return { totalUnits, minWait, colors: variantEntry.colors };
}


// Best-effort parse of a legacy single "Model Variant" string (e.g. "Creta SX(O)") back into
// the structured {model: [variants]} shape, so the picker can pre-fill from old data.
function parseModelString(full) {
  if (!full) return {};
  for (const model of Object.keys(MODEL_VARIANTS)) {
    if (full === model) return { [model]: [] };
    if (full.startsWith(model + " ")) {
      const variant = full.slice(model.length + 1).trim();
      return { [model]: MODEL_VARIANTS[model].includes(variant) ? [variant] : [] };
    }
  }
  return { [full]: [] };
}
// Structured {model: [variants]} -> flat display tags, e.g. {Creta:["SX","SX(O)"]} -> ["Creta SX","Creta SX(O)"]
function modelInterestTags(map) {
  const tags = [];
  Object.entries(map || {}).forEach(([model, variants]) => {
    if (!variants || variants.length === 0) { tags.push(model); return; }
    variants.forEach(v => tags.push(v === YET_TO_DECIDE ? `${model} — ${YET_TO_DECIDE}` : `${model} ${v}`));
  });
  return tags;
}
// Condensed display for the lead card — states each model once, with its variants listed
// after it, instead of repeating the model name per variant ("Alcazar Platinum, Alcazar
// Signature" -> "Alcazar Platinum, Signature").
function modelInterestSummary(map) {
  return Object.entries(map || {}).map(([model, variants]) => {
    if (!variants || variants.length === 0) return model;
    return `${model} ${variants.join(", ")}`;
  }).join(" · ");
}

const DISPOSITIONS = [
  { key: "connected",     label: "Connected" },
  { key: "no_answer",     label: "No Answer" },
  { key: "busy",          label: "Busy" },
  { key: "wrong_number",  label: "Wrong Number" },
  { key: "switched_off",  label: "Switched Off" },
];
// ---- Required-field highlighting -------------------------------------------------
// A disabled CTA with no explanation is a dead end. Every form marks what is still blocking
// it, but only after the rep first tries to save — an untouched form never opens in red.
const REQ = { border: "#E53935", bg: "#FDF3F2" };
function reqInput(missing) { return missing ? { borderColor: REQ.border, background: REQ.bg } : {}; }
function ReqHint({ show, text }) {
  if (!show) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
      <AlertTriangle size={10} color={REQ.border} />
      <span style={{ fontFamily: F, fontSize: 9.5, fontWeight: 700, color: REQ.border }}>{text || "Required"}</span>
    </div>
  );
}
function MissingBanner({ items }) {
  if (!items || !items.length) return null;
  return (
    <div style={{ display: "flex", gap: 7, alignItems: "flex-start", background: REQ.bg, border: `1px solid ${REQ.border}`, borderRadius: 9, padding: "8px 10px", marginBottom: 9 }}>
      <AlertTriangle size={13} color={REQ.border} style={{ flexShrink: 0, marginTop: 1 }} />
      <div style={{ fontFamily: F, fontSize: 10.5, color: REQ.border, lineHeight: 1.35 }}>
        <span style={{ fontWeight: 700 }}>Still needed: </span>{items.join(" · ")}
      </div>
    </div>
  );
}

const TEAM_ROSTER = [
  { name: "Rahul Kumar",   branch: "Indiranagar", role: "Sales Executive" },
  { name: "Divya Pillai",  branch: "Indiranagar", role: "Sales Executive" },
  { name: "Arjun Nair",    branch: "Whitefield",  role: "Sales Executive" },
  { name: "Meera Iyer",    branch: "Whitefield",  role: "Sales Executive" },
  { name: "Kiran Bhat",    branch: "Indiranagar", role: "Sales Executive" },
  { name: "Anjali Reddy",  branch: "Indiranagar", role: "Sales Executive" },
  { name: "Vikram Singh",  branch: "Whitefield",  role: "Sales Executive" },
  { name: "Neha Kulkarni", branch: "Whitefield",  role: "Sales Executive" },
  { name: "Sunil Mathur",  branch: "Indiranagar", role: "Team Leader" },
  { name: "Priya Sharma",  branch: "Whitefield",  role: "Team Leader" },
];
const ROLE_COLOR_2 = { "Sales Executive": C.primary, "Team Leader": C.purple, "Manager": C.teal };
const SOURCE_COLOR = {
  "Website": C.cold, "Facebook Ad": C.purple, "Google": C.cold, "OLX": C.warm, "Referral": C.green,
  "Instagram Ad": C.purple, "YouTube Ad": C.purple, "SMS Campaign": C.cold, "Email Campaign": C.cold,
  "CarDekho": C.warm, "CarWale": C.warm, "Justdial": C.warm,
  "Employee Referral": C.green, "Corporate Tie-up": C.green, "Walk-in": C.green, "Others": C.faint,
};
const SOURCE_OPTIONS = Object.keys(SOURCE_COLOR);
const CUSTOMER_TYPES = ["Male", "Female", "Corporate", "Fleet", "CSD / Defence", "Other"];
const AGE_BUCKETS = [
  { key: "7d",  label: "Last 7 days",        test: d => d <= 7 },
  { key: "2w",  label: "Last 2 weeks",       test: d => d > 7 && d <= 14 },
  { key: "1m",  label: "1 month",            test: d => d > 14 && d <= 30 },
  { key: "old", label: "Older than 1 month", test: d => d > 30 },
];
const STAGE_FILTER_OPTIONS = [
  { key: "new",             label: "New & Unqualified" },
  { key: "dormant",         label: "Dormant — Needs Reactivation" },
  { key: "missed_followup", label: "Missed Follow-up" },
  { key: "stage:Contacted", label: "Contacted" },
  { key: "stage:Test Drive",label: "Test Drive" },
  { key: "stage:Opportunity",label: "Opportunity" },
  { key: "stage:Booking",   label: "Booking" },
  { key: "stage:Retailed",  label: "Retailed" },
  { key: "stage:Delivered", label: "Delivered" },
  { key: "exchange_active", label: "Exchange — Active" },
  { key: "finance_active",  label: "Finance — Active" },
];
const TEST_DRIVE_MODES = [
  { key: "showroom", label: "Showroom",           Icon: Store },
  { key: "location", label: "Customer's Location", Icon: MapPin },
];
// Tomorrow's date, used when a call doesn't connect and the retry is scheduled for the next day.
function tomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

// Which part of the day it is now, and which slot to try next when a call doesn't connect.
// Rotating the retry to a different window is the whole point — calling at the same hour
// that already failed tends to fail again.
function currentSession() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
function nextSession(session) {
  const order = ["morning", "afternoon", "evening"];
  const i = order.indexOf(session);
  return order[(i + 1) % order.length];
}

const TIME_OF_DAY_OPTIONS = [
  { key: "morning",   label: "Morning" },
  { key: "afternoon", label: "Afternoon" },
  { key: "evening",   label: "Evening" },
];
const QUICK_CALLBACK_OPTIONS = [
  { key: "tomorrow", label: "Tomorrow",   days: 1 },
  { key: "2d",       label: "In 2 days",  days: 2 },
  { key: "week",     label: "Next week",  days: 7 },
  { key: "2w",       label: "In 2 weeks", days: 14 },
  { key: "month",    label: "Next month", days: 30 },
];
const TRACK_STATUS_META = {
  pending:    { label: "Pending",    color: C.warm,  soft: C.warmSoft },
  active:     { label: "In Progress",color: C.cold,  soft: C.coldSoft },
  approved:   { label: "Approved",   color: C.green, soft: C.greenSoft },
  declined:   { label: "Declined",   color: C.hot,   soft: C.hotSoft },
  complete:   { label: "Complete",   color: C.green, soft: C.greenSoft },
};
const EXTRA_DISPOSITION_LABELS = {
  car_blocked: "Car Blocked",
  connected: "Connected", no_answer: "No Answer", busy: "Busy",
  wrong_number: "Wrong Number", switched_off: "Switched Off",
};
const NOT_INTERESTED_REASONS = [
  "Bought elsewhere", "Postponed purchase", "Budget constraint",
  "Preferred competitor model", "Not the decision maker", "Just browsing", "Other",
];
const EXCHANGE_DECLINE_REASONS = ["Valuation too low", "Selling privately", "Keeping the car", "Other"];
const FINANCE_DECLINE_REASONS  = ["Paying cash", "Own bank tie-up", "Rate too high", "Other"];
const BOOKING_CANCELLATION_REASONS = [
  "Better deal elsewhere", "Financial difficulty", "Delivery delay",
  "Family decision changed", "Model / variant change", "Other",
];
const FEEDBACK_PENDING_ITEMS = [
  "RC / registration", "Insurance copy", "Accessories fitment",
  "Extended warranty papers", "Free service coupons", "Number plate",
];
const ACCESSORY_OPTIONS = [
  { key: "floor_mats",   label: "Floor Mats",        price: 3500 },
  { key: "seat_cover",   label: "Seat Covers",       price: 12000 },
  { key: "dashcam",      label: "Dash Camera",       price: 8500 },
  { key: "body_cover",   label: "Body Cover",        price: 2500 },
  { key: "mud_flaps",    label: "Mud Flaps",         price: 1200 },
  { key: "ppf",          label: "Paint Protection",  price: 35000 },
];
const DISCOUNT_LIMIT = 25000;
const CARE_PACKAGE_AMOUNT = 18000;
const EXTENDED_WARRANTY_AMOUNT = 22000;
const COLD_UNASSIGNED_DAYS = 3;

const CALL_QUEUE = [
  {
    id: 1, name: "Colonel Vikram Bhatt (Retd.)", phone: "+91 9000000007", altPhone: "", email: "",
    model: "Tucson", variant: "Signature AWD", source: "Referral", customerType: "CSD / Defence",
    location: "Indiranagar", sourceContext: "Very interested, CSD price confirmed. Asked to call back in 4 days to finalize — that date has passed.",
    propensity: 82, priority: "high",
    contacted: 3, stage: "Contacted", createdDate: d(-16),
    bestCallTime: "", followUpDate: d(1), signals: ["exchange"],
    exchange: { model: "Maruti Swift", variant: "VXi", year: "2017", odometer: "48000", condition: "good", photos: 0, appraisalScheduled: false, appraisedValue: null },
    finance: null,
    modelInterest: null, colorInterest: null, commPref: null,
    targetDeliveryDate: null, assignedSE: null, lastSEContactDate: null,
    drivingLicense: null, cancellationRequest: null, closed: false,
    callHistory: [{ id: "seed1", date: dh(-6, 13), disposition: "busy", recordingDuration: "2:11", note: "Very interested, CSD price confirmed. Asked to call back in 4 days to finalize — that date has passed." }],
  },
  {
    id: 2, name: "Farhan Ahmed", phone: "+91 9000000008", altPhone: "", email: "",
    model: "Alcazar", variant: "Signature 7-str", source: "OLX", customerType: "Male",
    location: "Whitefield", sourceContext: "SE promised a callback with a revised quote — hasn't followed up since.",
    bookingAmount: "25000", colorInterest: ["Titan Grey"],
    propensity: 76, priority: "high",
    contacted: 4, stage: "Opportunity", createdDate: d(-16),
    bestCallTime: "", followUpDate: d(1), signals: ["exchange", "finance_needed"],
    exchange: { model: "Maruti Swift", variant: "VXi", year: "2017", odometer: "48000", condition: "good", photos: 0, appraisalScheduled: false, appraisedValue: null },
    finance: { loanAmount: "8", bank: "", status: "" },
    modelInterest: null, commPref: null,
    targetDeliveryDate: null, assignedSE: { name: "Divya Pillai", branch: "Whitefield" }, lastSEContactDate: d(-6),
    drivingLicense: null, cancellationRequest: null, closed: false,
    callHistory: [{ id: "seed2", date: dh(-6, 10), disposition: "switched_off", recordingDuration: "2:12", note: "SE promised a callback with a revised quote — hasn't followed up since." }],
  },
  {
    id: 3, name: "Meena Rao", phone: "+91 9000000004", altPhone: "", email: "",
    model: "Verna", variant: "SX Turbo", source: "OLX", customerType: "Female",
    location: "Indiranagar", sourceContext: "Confirmed budget and wants exchange for her old Swift. Ready to test drive — needs an SE assigned.",
    propensity: 71, priority: "high",
    contacted: 2, stage: "Contacted", createdDate: d(-11),
    bestCallTime: "", followUpDate: d(6), signals: ["exchange"],
    exchange: { model: "Maruti Swift", variant: "VXi", year: "2017", odometer: "48000", condition: "good", photos: 0, appraisalScheduled: false, appraisedValue: null },
    finance: null,
    modelInterest: null, colorInterest: null, commPref: null,
    targetDeliveryDate: null, assignedSE: null, lastSEContactDate: null,
    drivingLicense: null, cancellationRequest: null, closed: false,
    callHistory: [{ id: "seed3", date: dh(-1, 19), disposition: "connected", recordingDuration: "2:13", note: "Confirmed budget and wants exchange for her old Swift. Ready to test drive — needs an SE assigned." }],
  },
  {
    id: 4, name: "Ajay Pillai", phone: "+91 9000000003", altPhone: "", email: "",
    model: "Creta", variant: "SX(O) Turbo DCT", source: "Website", customerType: "Male",
    location: "Whitefield", sourceContext: "Wants a showroom visit this Saturday. Has an old Swift to exchange, 2017 model.",
    propensity: 68, priority: "high",
    contacted: 1, stage: "New", createdDate: d(-12),
    bestCallTime: "", followUpDate: d(5), signals: ["exchange", "finance_needed"],
    exchange: { model: "Maruti Swift", variant: "VXi", year: "2017", odometer: "48000", condition: "good", photos: 0, appraisalScheduled: false, appraisedValue: null },
    finance: { loanAmount: "8", bank: "", status: "" },
    modelInterest: null, colorInterest: null, commPref: null,
    targetDeliveryDate: null, assignedSE: null, lastSEContactDate: null,
    drivingLicense: null, cancellationRequest: null, closed: false,
    callHistory: [{ id: "seed4", date: dh(-2, 16), disposition: "connected", recordingDuration: "2:14", note: "Wants a showroom visit this Saturday. Has an old Swift to exchange, 2017 model." }],
  },
  {
    id: 5, name: "Sunita Gupta", phone: "+91 9000000005", altPhone: "", email: "",
    model: "Venue", variant: "SX Dual Tone", source: "CarDekho", customerType: "Female",
    location: "Indiranagar", sourceContext: "Prefers WhatsApp only. Asked for the on-road price in writing.",
    propensity: 64, priority: "medium",
    contacted: 2, stage: "Contacted", createdDate: d(-13),
    bestCallTime: "", followUpDate: d(4), signals: [],
    exchange: null,
    finance: null,
    modelInterest: null, colorInterest: null, commPref: "whatsapp",
    targetDeliveryDate: null, assignedSE: null, lastSEContactDate: null,
    drivingLicense: null, cancellationRequest: null, closed: false,
    callHistory: [{ id: "seed5", date: dh(-3, 19), disposition: "connected", recordingDuration: "2:15", note: "Prefers WhatsApp only. Asked for the on-road price in writing." }],
  },
  {
    id: 6, name: "Rahul Mehta", phone: "+91 9000000001", altPhone: "", email: "",
    model: "i20", variant: "Asta (O)", source: "Website", customerType: "Male",
    location: "Indiranagar", sourceContext: "Fresh web enquiry, not yet attempted.",
    propensity: 58, priority: "medium",
    contacted: 0, stage: "New", createdDate: d(-1),
    bestCallTime: "", followUpDate: null, signals: [],
    exchange: null,
    finance: null,
    modelInterest: null, colorInterest: null, commPref: null,
    targetDeliveryDate: null, assignedSE: null, lastSEContactDate: null,
    drivingLicense: null, cancellationRequest: null, closed: false,
    callHistory: [],
  },
  {
    id: 7, name: "Priya Desai", phone: "+91 9000000002", altPhone: "", email: "",
    model: "Exter", variant: "SX Knight", source: "Instagram Ad", customerType: "Female",
    location: "Whitefield", sourceContext: "Picked up but was driving, asked to call back tomorrow evening.",
    propensity: 55, priority: "medium",
    contacted: 1, stage: "New", createdDate: d(-11),
    bestCallTime: "", followUpDate: d(6), signals: [],
    exchange: null,
    finance: null,
    modelInterest: null, colorInterest: null, commPref: null,
    targetDeliveryDate: null, assignedSE: null, lastSEContactDate: null,
    drivingLicense: null, cancellationRequest: null, closed: false,
    callHistory: [{ id: "seed7", date: dh(-1, 10), disposition: "no_answer", recordingDuration: "2:17", note: "Picked up but was driving, asked to call back tomorrow evening." }],
  },
  {
    id: 8, name: "Sanjay Kulkarni", phone: "+91 9000000006", altPhone: "", email: "",
    model: "Creta", variant: "EX", source: "Justdial", customerType: "Male",
    location: "Indiranagar", sourceContext: "Comparing with Seltos. Wants best possible discount before deciding.",
    propensity: 49, priority: "medium",
    contacted: 3, stage: "Contacted", createdDate: d(-18),
    bestCallTime: "", followUpDate: d(-1), signals: ["finance_needed"],
    exchange: null,
    finance: { loanAmount: "8", bank: "", status: "" },
    modelInterest: null, colorInterest: null, commPref: null,
    targetDeliveryDate: null, assignedSE: null, lastSEContactDate: null,
    drivingLicense: null, cancellationRequest: null, closed: false,
    callHistory: [{ id: "seed8", date: dh(-8, 17), disposition: "connected", recordingDuration: "2:18", note: "Comparing with Seltos. Wants best possible discount before deciding." }],
  },
  {
    id: 9, name: "Anita Shetty", phone: "+91 9000000009", altPhone: "", email: "",
    model: "Ioniq 5", variant: "AWD Long Range", source: "Website", customerType: "Female",
    location: "Whitefield", sourceContext: "EV enquiry — asked about home charger installation cost.",
    propensity: 44, priority: "medium",
    contacted: 1, stage: "New", createdDate: d(-14),
    bestCallTime: "", followUpDate: d(3), signals: [],
    exchange: null,
    finance: null,
    modelInterest: null, colorInterest: null, commPref: null,
    targetDeliveryDate: null, assignedSE: null, lastSEContactDate: null,
    drivingLicense: null, cancellationRequest: null, closed: false,
    callHistory: [{ id: "seed9", date: dh(-4, 11), disposition: "switched_off", recordingDuration: "2:19", note: "EV enquiry — asked about home charger installation cost." }],
  },
  {
    id: 10, name: "Ravi Shankar", phone: "+91 9000000010", altPhone: "", email: "",
    model: "Venue", variant: "S Turbo", source: "Facebook Ad", customerType: "Male",
    location: "Indiranagar", sourceContext: "Postponed purchase to after Diwali. Worth a nurture call.",
    propensity: 38, priority: "low",
    contacted: 2, stage: "Contacted", createdDate: d(-22),
    bestCallTime: "", followUpDate: d(-5), signals: [],
    exchange: null,
    finance: null,
    modelInterest: null, colorInterest: null, commPref: null,
    targetDeliveryDate: null, assignedSE: null, lastSEContactDate: null,
    drivingLicense: null, cancellationRequest: null, closed: false,
    callHistory: [{ id: "seed10", date: dh(-12, 11), disposition: "no_answer", recordingDuration: "2:10", note: "Postponed purchase to after Diwali. Worth a nurture call." }],
  },
  {
    id: 11, name: "Deepa Menon", phone: "+91 9000000011", altPhone: "", email: "",
    model: "Alcazar", variant: "Platinum 7-str", source: "Referral", customerType: "Female",
    location: "Whitefield", sourceContext: "Employee referral, not yet contacted.",
    propensity: 35, priority: "low",
    contacted: 0, stage: "New", createdDate: d(-1),
    bestCallTime: "", followUpDate: null, signals: [],
    exchange: null,
    finance: null,
    modelInterest: null, colorInterest: null, commPref: null,
    targetDeliveryDate: null, assignedSE: null, lastSEContactDate: null,
    drivingLicense: null, cancellationRequest: null, closed: false,
    callHistory: [],
  },
  {
    id: 12, name: "Imran Sheikh", phone: "+91 9000000012", altPhone: "", email: "",
    model: "Verna", variant: "S Turbo", source: "CarWale", customerType: "Male",
    location: "Indiranagar", sourceContext: "Went quiet after the third call. Number rings out.",
    propensity: 31, priority: "low",
    contacted: 4, stage: "Contacted", createdDate: d(-25),
    bestCallTime: "", followUpDate: d(-8), signals: [],
    exchange: null,
    finance: null,
    modelInterest: null, colorInterest: null, commPref: null,
    targetDeliveryDate: null, assignedSE: null, lastSEContactDate: null,
    drivingLicense: null, cancellationRequest: null, closed: false,
    callHistory: [{ id: "seed12", date: dh(-15, 10), disposition: "switched_off", recordingDuration: "2:12", note: "Went quiet after the third call. Number rings out." }],
  },
  {
    id: 13, name: "Lakshmi Iyer", phone: "+91 9000000013", altPhone: "", email: "",
    model: "Exter", variant: "SX", source: "SMS Campaign", customerType: "Female",
    location: "Whitefield", sourceContext: "Wrong number on file — needs an alternate contact.",
    propensity: 27, priority: "low",
    contacted: 1, stage: "New", createdDate: d(-19),
    bestCallTime: "", followUpDate: d(-2), signals: [],
    exchange: null,
    finance: null,
    modelInterest: null, colorInterest: null, commPref: null,
    targetDeliveryDate: null, assignedSE: null, lastSEContactDate: null,
    drivingLicense: null, cancellationRequest: null, closed: false,
    callHistory: [{ id: "seed13", date: dh(-9, 14), disposition: "connected", recordingDuration: "2:13", note: "Wrong number on file — needs an alternate contact." }],
  },
  {
    id: 14, name: "George Thomas", phone: "+91 9000000014", altPhone: "", email: "",
    model: "Tucson", variant: "Platinum AWD", source: "Corporate Tie-up", customerType: "Corporate",
    location: "Indiranagar", sourceContext: "Corporate fleet enquiry, budget approval pending at their end.",
    propensity: 22, priority: "low",
    contacted: 1, stage: "Contacted", createdDate: d(-30),
    bestCallTime: "", followUpDate: d(-13), signals: [],
    exchange: null,
    finance: null,
    modelInterest: null, colorInterest: null, commPref: null,
    targetDeliveryDate: null, assignedSE: null, lastSEContactDate: null,
    drivingLicense: null, cancellationRequest: null, closed: false,
    callHistory: [{ id: "seed14", date: dh(-20, 17), disposition: "connected", recordingDuration: "2:14", note: "Corporate fleet enquiry, budget approval pending at their end." }],
  },
];

// ============================== VOICE-FIRST CALL LOGGING ==============================
// Notes field with dictation. Tap-to-speak as a whole logging mode is gone — the form is
// the only way to log a call — but dictating a note is still far faster than thumb-typing
// on a showroom floor, so the mic lives here instead.
// Notes with a voice recording. The rep records once; we keep the clip (so anyone can
// listen back to exactly what was said) and a short summary of it, which is what actually
// gets read in the timeline. Typing stays available — the two live side by side.
function VoiceNoteField({ value, onChange, recording, onRecordingChange, placeholder = "What did the customer say?", rows = 2 }) {
  const [state, setState] = useState("idle");   // idle | recording | processing
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (state !== "recording") return;
    const t = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(t);
  }, [state]);

  const start = () => { setElapsed(0); setState("recording"); };
  const stop = () => {
    setState("processing");
    // Stand-in for server-side transcription + summarisation.
    setTimeout(() => {
      const samples = [
        { summary: "Wants the on-road price in writing; comparing with Seltos.", transcript: "He asked me to send the full on-road price on WhatsApp. Said he's also looking at the Seltos and wants to compare before deciding." },
        { summary: "Bringing spouse Saturday; keen on the top variant.", transcript: "He wants to bring his wife this Saturday to see the car. Seemed keen on the top variant, asked about the sunroof." },
        { summary: "Exchange for 2017 Swift; wants valuation first.", transcript: "He has a 2017 Swift he wants to exchange. Asked what valuation we'd give before he commits to anything." },
        { summary: "Budget tight this month; revisit after salary credit.", transcript: "Said his budget is a bit tight this month. Asked me to check back after his salary comes in." },
      ];
      const pick = samples[Math.floor(Math.random() * samples.length)];
      const mins = String(Math.floor(elapsed / 60)).padStart(2, "0");
      const secs = String(elapsed % 60).padStart(2, "0");
      onRecordingChange && onRecordingChange({ duration: `${mins}:${secs}`, ...pick });
      onChange(value ? `${value} ${pick.summary}` : pick.summary);
      setState("idle");
    }, 1400);
  };

  return (
    <div style={{ marginBottom: 14 }}>
      {recording ? (
        <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: 10, marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
            <span style={{ width: 26, height: 26, borderRadius: "50%", background: C.primary, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Play size={11} color="#fff" />
            </span>
            <div style={{ flex: 1, height: 3, background: C.borderStrong, borderRadius: 999 }}>
              <div style={{ width: "0%", height: "100%", background: C.primary, borderRadius: 999 }} />
            </div>
            <span style={{ fontFamily: F, fontSize: 10.5, color: C.sub, fontWeight: 700, flexShrink: 0 }}>{recording.duration}</span>
            <button onClick={() => onRecordingChange(null)} title="Delete recording"
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
              <X size={13} color={C.faint} />
            </button>
          </div>
          <div style={{ fontFamily: F, fontSize: 9.5, fontWeight: 700, color: C.faint, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 3 }}>Summary</div>
          <div style={{ fontFamily: F, fontSize: 11, color: C.ink, lineHeight: 1.4 }}>{recording.summary}</div>
        </div>
      ) : (
        <button onClick={state === "recording" ? stop : start} disabled={state === "processing"} style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 7, width: "100%",
          background: state === "recording" ? C.hotSoft : C.primarySoft,
          border: `1.5px solid ${state === "recording" ? C.hot : C.primary}44`,
          borderRadius: 10, padding: "9px 0", marginBottom: 8,
          cursor: state === "processing" ? "default" : "pointer",
        }}>
          <Mic size={14} color={state === "recording" ? C.hot : C.primary} />
          <span style={{ fontFamily: F, fontSize: 11.5, fontWeight: 700, color: state === "recording" ? C.hot : C.primary }}>
            {state === "recording" ? `Recording — tap to stop (${elapsed}s)`
              : state === "processing" ? "Summarising…"
              : "Record a voice note"}
          </span>
        </button>
      )}

      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
        style={{ width: "100%", border: `1.5px solid ${C.borderStrong}`, borderRadius: 9,
          padding: "9px 12px", fontFamily: F, fontSize: 12.5, color: C.ink, resize: "none",
          background: C.card, outline: "none", boxSizing: "border-box" }} />
    </div>
  );
}

function chipStyle(on, small) {
  return {
    padding: small ? "5px 9px" : "6px 11px", borderRadius: 8, cursor: "pointer",
    border: `1.5px solid ${on ? C.primary : C.borderStrong}`,
    background: on ? C.primarySoft : C.card, color: on ? C.primary : C.sub,
    fontFamily: F, fontWeight: 700, fontSize: small ? 10.5 : 11.5, whiteSpace: "nowrap",
  };
}
function isoDate(d) {
  if (!d) return "";
  const dt = d instanceof Date ? d : new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}
function fmtHour(h) {
  const n = parseInt(h, 10);
  if (isNaN(n)) return h;
  const suffix = n >= 12 ? "PM" : "AM";
  const hour = n % 12 === 0 ? 12 : n % 12;
  return `${hour}:00 ${suffix}`;
}
function inDays(n) { return d(n); }
// A follow-up is "missed" once its date has passed with no call logged after it.
function hasMissedFollowUp(lead) {
  if (!lead.followUpDate) return false;
  const due = new Date(lead.followUpDate);
  if (due >= today) return false;
  const last = (lead.callHistory || [])[0];
  return !last || new Date(last.date) < due;
}
// Does this lead need the telecaller specifically (rather than the SE) right now?
function needsTelecallerNow(lead) {
  if (lead.closed) return false;
  if (!lead.assignedSE) return true;
  return hasMissedFollowUp(lead);
}
function leadFieldMatchesTerm(lead, term) {
  const t = String(term).trim().toLowerCase();
  if (!t) return true;
  const phone = (lead.phone || "").replace(/\s/g, "");
  return (lead.name || "").toLowerCase().includes(t)
    || phone.includes(t.replace(/\s/g, ""))
    || (lead.model || "").toLowerCase().includes(t);
}

function FilterChip({ label, onRemove }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: C.primarySoft, borderRadius: 999, padding: "5px 8px 5px 10px" }}>
      <span style={{ fontFamily: F, fontSize: 11, fontWeight: 700, color: C.primary }}>{label}</span>
      <button onClick={onRemove} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
        <X size={11} color={C.primary} />
      </button>
    </span>
  );
}

// Two-column filter sheet: category rail on the left, options on the right. Selections stay
// in a draft until the rep taps the CTA. Fixed height so switching category never resizes it.
function FilterSheet({ open, onClose, groups, draft, setDraft, onApply, onClearAll, resultCount }) {
  const [activeGroup, setActiveGroup] = useState(groups[0]?.key);
  const [filterQuery, setFilterQuery] = useState("");
  if (!open) return null;

  const active = groups.find(g => g.key === activeGroup) || groups[0];
  const q = filterQuery.trim().toLowerCase();
  const visibleOptions = q
    ? groups.flatMap(g => g.options.filter(o => o.label.toLowerCase().includes(q)).map(o => ({ ...o, groupKey: g.key, groupLabel: g.label })))
    : active.options.map(o => ({ ...o, groupKey: active.key }));
  const draftCount = groups.reduce((n, g) => n + (draft[g.key]?.length || 0), 0);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)" }} onClick={onClose} />
      <div style={{ position: "relative", background: C.card, borderRadius: "18px 18px 0 0", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "16px 16px 10px" }}>
          <div style={{ fontFamily: F, fontSize: 17, fontWeight: 800, color: C.ink, marginBottom: 12 }}>Filters</div>
          <div style={{ display: "flex", alignItems: "center", gap: 9, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 999, padding: "10px 14px" }}>
            <Search size={15} color={C.sub} />
            <input value={filterQuery} onChange={e => setFilterQuery(e.target.value)}
              placeholder="Search across filters…" enterKeyHint="search"
              onKeyDown={e => { if (e.key === "Enter") e.currentTarget.blur(); }}
              style={{ flex: 1, border: "none", outline: "none", background: "none", fontFamily: F, fontSize: 13, color: C.ink }} />
            {filterQuery && <button onClick={() => setFilterQuery("")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}><X size={14} color={C.faint} /></button>}
          </div>
        </div>

        <div style={{ display: "flex", height: 380, borderTop: `1px solid ${C.border}` }}>
          {!q && (
            <div style={{ width: 132, flexShrink: 0, borderRight: `1px solid ${C.border}`, overflowY: "auto", background: C.bg }}>
              {groups.map(g => {
                const on = g.key === activeGroup;
                const n = draft[g.key]?.length || 0;
                return (
                  <button key={g.key} onClick={() => setActiveGroup(g.key)} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, width: "100%",
                    padding: "14px 12px", background: on ? C.card : "none", border: "none", cursor: "pointer", textAlign: "left",
                    borderLeft: `3px solid ${on ? C.primary : "transparent"}`,
                  }}>
                    <span style={{ fontFamily: F, fontSize: 12.5, fontWeight: on ? 800 : 500, color: on ? C.primary : C.sub, lineHeight: 1.25 }}>{g.label}</span>
                    {n > 0 && <span style={{ background: C.primary, color: "#fff", fontFamily: F, fontSize: 9.5, fontWeight: 800, borderRadius: 999, padding: "1px 6px", flexShrink: 0 }}>{n}</span>}
                  </button>
                );
              })}
            </div>
          )}

          <div style={{ flex: 1, overflowY: "auto", padding: "4px 0" }}>
            {visibleOptions.length === 0 && (
              <div style={{ fontFamily: F, fontSize: 12.5, color: C.faint, padding: "18px 16px" }}>No filters match "{filterQuery}".</div>
            )}
            {visibleOptions.map(o => {
              const sel = (draft[o.groupKey] || []).includes(o.key);
              return (
                <button key={o.groupKey + o.key} onClick={() => setDraft(d => {
                  const cur = d[o.groupKey] || [];
                  const next = cur.includes(o.key) ? cur.filter(x => x !== o.key) : [...cur, o.key];
                  return { ...d, [o.groupKey]: next };
                })} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, width: "100%",
                  padding: "13px 16px", background: "none", border: "none", cursor: "pointer", textAlign: "left",
                }}>
                  <span style={{ minWidth: 0 }}>
                    <span style={{ fontFamily: F, fontSize: 13, fontWeight: sel ? 700 : 500, color: C.ink }}>{o.label}</span>
                    {typeof o.count === "number" && <span style={{ fontFamily: F, fontSize: 12, color: C.faint }}> ({o.count})</span>}
                    {q && o.groupLabel && <span style={{ display: "block", fontFamily: F, fontSize: 10, color: C.faint, marginTop: 2 }}>in {o.groupLabel}</span>}
                  </span>
                  <span style={{
                    width: 20, height: 20, borderRadius: 5, flexShrink: 0,
                    border: `2px solid ${sel ? C.primary : C.borderStrong}`, background: sel ? C.primary : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>{sel && <Check size={13} color="#fff" strokeWidth={3} />}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, padding: 14, borderTop: `1px solid ${C.border}` }}>
          <button onClick={onClearAll} disabled={draftCount === 0} style={{
            flex: 1, padding: "13px 0", borderRadius: 10, cursor: draftCount ? "pointer" : "default",
            border: `1.5px solid ${draftCount ? C.primary : C.border}`, background: "none",
            color: draftCount ? C.primary : C.ghost, fontFamily: F, fontWeight: 700, fontSize: 13.5,
          }}>Clear Filter</button>
          <button onClick={onApply} style={{
            flex: 1.4, padding: "13px 0", borderRadius: 10, border: "none", cursor: "pointer",
            background: C.primary, color: "#fff", fontFamily: F, fontWeight: 800, fontSize: 13.5,
          }}>Show {resultCount} lead{resultCount === 1 ? "" : "s"}</button>
        </div>
      </div>
    </div>
  );
}


// Hides call entries that were superseded by a later edit of the same entry.
function visibleActivity(history) {
  const superseded = new Set((history || []).filter(h => h.editedFromId).map(h => h.editedFromId));
  return (history || []).filter(h => !superseded.has(h.id));
}
function relativeTime(dt) {
  const mins = Math.round((today - dt) / 60000);
  if (mins < 60) return mins <= 1 ? "Just now" : `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return fmtDate(dt);
}

function hashStr(str) {
  let h = 0;
  for (let i = 0; i < String(str).length; i++) h = (h * 31 + String(str).charCodeAt(i)) | 0;
  return Math.abs(h);
}

function formatINR(amount) {
    return "\u20B9" + Math.round(amount || 0).toLocaleString("en-IN");
  }

function fmtSeconds(s) {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }

function baseModelOf(modelString) {
    if (!modelString) return "Unknown";
    const known = Object.keys(MODEL_VARIANTS).find((m) => modelString.startsWith(m));
    return known || modelString.split(" ")[0];
  }

function leadAgeDays(lead) {
    return Math.round((today - lead.createdDate) / 864e5);
  }

function leadLane(lead) {
    if (lead.closed) return "closed";
    if (hasMissedFollowUp(lead)) return "missed_followup";
    if (lead.assignedSE) return needsTelecallerNow(lead) ? "dormant" : "with_se";
    const daysSince = daysSinceLastTelecallerContact(lead);
    if (lead.contacted >= 2 && daysSince !== null && daysSince > COLD_UNASSIGNED_DAYS) return "dormant";
    return "new";
  }

function leadMatchesQuery(lead, rawQuery) {
    const orGroups = rawQuery.split(/,|\bor\b/i).map((g) => g.trim()).filter(Boolean);
    if (orGroups.length === 0) return true;
    return orGroups.some((group) => group.split(/[&\s]+/).map((t) => t.trim()).filter(Boolean).every((term) => leadFieldMatchesTerm(lead, term)));
  }

function leadMatchesStageFilterKey(lead, key) {
    if (key.startsWith("stage:")) return lead.stage === key.slice(6);
    if (key === "track:exchange") {
      const s = exchangeTrackStatus(lead);
      return s === "pending" || s === "in_progress";
    }
    if (key === "track:finance") {
      const s = financeTrackStatus(lead);
      return s === "pending" || s === "in_progress";
    }
    return leadLane(lead) === key;
  }

function stageStatusLabel(lead) {
    if (lead.stage === "Booking") return "Booking Amount Received";
    if (lead.stage === "Retailed") return "Retailed \u2014 Awaiting Delivery";
    if (lead.stage === "Delivered") return "Vehicle Delivered";
    return lead.stage;
  }

function priorityColorOf(lead) {
    if (lead.stage === "Booking" || lead.stage === "Retailed" || lead.stage === "Delivered") return C.green;
    if (lead.propensity >= 80) return C.hot;
    if (lead.propensity >= 60) return C.yellow;
    if (lead.propensity >= 40) return C.cold;
    return C.ghost;
  }

function everConnected(lead) {
    return lead.callHistory.some((c) => c.disposition === "connected");
  }

function hasPriorDisposition(lead, key) {
    return lead.callHistory.some((c) => c.disposition === key);
  }

function daysSinceLastTelecallerContact(lead) {
    const last = lead.callHistory[lead.callHistory.length - 1];
    return last ? Math.round((today - last.date) / 864e5) : null;
  }

function daysSinceSEContact(lead) {
    if (!lead.assignedSE || !lead.lastSEContactDate) return null;
    return Math.round((today - lead.lastSEContactDate) / 864e5);
  }

function needsCallToday(lead) {
    if (lead.followUpDate && new Date(lead.followUpDate) < new Date()) return true;
    const financeStatus = financeTrackStatus(lead);
    if (financeStatus === "pending" || financeStatus === "in_progress") return true;
    if (lead.stage === "Retailed" && !lead.targetDeliveryDate) return true;
    return false;
  }

function callTodayReason(lead) {
    const financeStatus = financeTrackStatus(lead);
    if (financeStatus === "pending" || financeStatus === "in_progress") return "Finance pending";
    if (lead.stage === "Retailed" && !lead.targetDeliveryDate) return "Delivery date not set";
    return "Follow-up needed";
  }

function seBannerHealthy(lead) {
    const wonOrBeyond = lead.stage === "Booking" || lead.stage === "Retailed" || lead.stage === "Delivered";
    if (wonOrBeyond) return !needsTelecallerNow(lead);
    if (lead.propensity > 75) return false;
    return !needsTelecallerNow(lead);
  }

function lastCallRecap(lead) {
    const connectedCalls = visibleActivity(lead.callHistory).filter((h) => h.disposition === "connected");
    if (connectedCalls.length === 0) return null;
    const last = connectedCalls[connectedCalls.length - 1];
    return { when: relativeTime(last.date), note: last.note, priorCount: connectedCalls.length - 1 };
  }

function mostRecentTestDrive(lead) {
    const entries = lead.callHistory.filter((h) => h.disposition === "test_drive_scheduled");
    return entries.length ? entries[entries.length - 1] : null;
  }

function findTestDriveConflict(allLeads, date, slot, mode, excludeLeadId) {
    if (!allLeads || !date || !slot) return null;
    for (const l of allLeads) {
      if (l.id === excludeLeadId) continue;
      const hit = l.callHistory.find((h) => h.disposition === "test_drive_scheduled" && h.testDriveDate === date && h.testDriveSlot === slot && h.testDriveMode === mode);
      if (hit) return { leadName: l.name, model: l.model };
    }
    return null;
  }

function generateTimeSlots(mode) {
    const step = mode === "location" ? 2 : 1;
    const slots = [];
    for (let h = 9; h < 19; h += step) {
      slots.push(`${fmtHour(h)} - ${fmtHour(Math.min(h + step, 19))}`);
    }
    return slots;
  }

function exchangeTrackStatus(lead) {
    if (!lead.signals.includes("exchange") && !lead.exchange) return null;
    if (!lead.exchange || !lead.exchange.year || !lead.exchange.odometer || !lead.exchange.condition) return "pending";
    if (lead.exchange.customerAccepted === "yes") return "completed";
    if (lead.exchange.customerAccepted === "no") return "declined";
    return "in_progress";
  }

function financeTrackStatus(lead) {
    if (!lead.signals.includes("finance_needed") && !lead.finance) return null;
    if (!lead.finance || !lead.finance.status) return "pending";
    if (lead.finance.customerAccepted === "yes") return "completed";
    if (lead.finance.customerAccepted === "no") return "declined";
    return "in_progress";
  }

function computeQuoteBreakup(exShowroom, discountRupees, accessoriesRupees, includeInsurance, includeWarranty, includeCare) {
    const rto = Math.round(exShowroom * 0.09);
    const insurance = includeInsurance ? Math.round(exShowroom * 0.035) : 0;
    const warranty = includeWarranty ? EXTENDED_WARRANTY_AMOUNT : 0;
    const care = includeCare ? CARE_PACKAGE_AMOUNT : 0;
    const tcs = exShowroom > 1e6 ? Math.round(exShowroom * 0.01) : 0;
    const handling = 15e3;
    const accessories = accessoriesRupees || 0;
    const subtotal = exShowroom + rto + insurance + warranty + care + tcs + handling + accessories;
    const discount = discountRupees || 0;
    const total = Math.max(1e4, subtotal - discount);
    return { exShowroom, rto, insurance, warranty, care, tcs, handling, accessories, discount, subtotal, total };
  }

function defaultPaymentDetails() {
    return {
      financeAmount: "",
      financeCompany: "",
      roi: "",
      loanTenure: "",
      cashAmount: "",
      dealerInsurance: true,
      insuranceAmount: "",
      insuranceCompany: "",
      extendedWarranty: "",
      carePackage: "",
      addons: [{ id: "rsa", label: "RSA (Road Side Assistance)", amount: "" }],
      accessoriesAmount: ""
    };
  }

function paymentDetailsHasAmount(pd) {
    return (parseFloat(pd.financeAmount) || 0) + (parseFloat(pd.cashAmount) || 0) > 0;
  }

function paymentDetailsTotal(pd) {
    return (parseFloat(pd.financeAmount) || 0) + (parseFloat(pd.cashAmount) || 0);
  }

function generateActivitySummary(lead) {
    const history = lead.callHistory;
    const connectedCount = history.filter((c) => c.disposition === "connected").length;
    const last = history[history.length - 1];
    const daysSinceLast = Math.round((today - last.date) / 864e5);
    const lastLabel = DISPOSITIONS.find((d2) => d2.key === last.disposition)?.label || last.disposition;
    const signalLabels = lead.signals.map((s) => SIGNAL_META[s]?.label).filter(Boolean);
    const line1 = `${history.length} attempts so far, ${connectedCount} connected \u2014 currently ${lead.stage.toLowerCase()} stage${lead.assignedSE ? `, with ${lead.assignedSE.name}` : ", unassigned"}.`;
    const line2 = signalLabels.length ? `Confirmed so far: ${signalLabels.join(", ")}.` : `No firm signals confirmed yet.`;
    const line3 = `Last attempt ${daysSinceLast === 0 ? "today" : daysSinceLast + "d ago"} \u2014 ${lastLabel}.`;
    return [line1, line2, line3];
  }

function buildFocusQueueIds(leads) {
    return leads.filter((l) => !l.closed && ["missed_followup", "new", "dormant"].includes(leadLane(l))).sort((a, b) => b.propensity - a.propensity).map((l) => l.id);
  }

// Tracks how often each SE has been picked this session, so auto-assign can round-robin
// rather than always landing on the same name.
const seAssignmentFrequency = {};

function bumpAssignmentFrequency(name) {
    seAssignmentFrequency[name] = (seAssignmentFrequency[name] || 0) + 1;
  }

function autoAssignSE(lead, allLeads) {
    const sePool = TEAM_ROSTER.filter((r) => r.role === "Sales Executive");
    const loadMap = {};
    sePool.forEach((se) => {
      loadMap[se.name] = 0;
    });
    allLeads.forEach((l) => {
      if (l.assignedSE && loadMap[l.assignedSE.name] !== void 0 && !l.closed) {
        loadMap[l.assignedSE.name] = (loadMap[l.assignedSE.name] || 0) + 1;
      }
    });
    const sameBranch = sePool.filter((se) => se.branch === (lead.location || "Indiranagar").split(" ")[0] || (lead.location || "").includes(se.branch));
    const pool = sameBranch.length > 0 ? sameBranch : sePool;
    const sorted = [...pool].sort((a, b) => (loadMap[a.name] || 0) - (loadMap[b.name] || 0));
    return sorted[0] || sePool[0];
  }

function Pill({ label, color, soft }) {
    return <span style={{
  display: "inline-flex",
  alignItems: "center",
  fontSize: 10.5,
  fontWeight: 700,
  color,
  background: soft,
  border: `1px solid ${color}35`,
  padding: "2px 8px",
  borderRadius: 6,
  whiteSpace: "nowrap",
  fontFamily: F
}}>
  {label}
</span>;
  }

function Toast({ text }) {
    if (!text) return null;
    return <div style={{
  position: "absolute",
  bottom: 80,
  left: "50%",
  transform: "translateX(-50%)",
  background: C.ink,
  color: "#fff",
  padding: "10px 16px",
  borderRadius: 11,
  fontSize: 12.5,
  fontWeight: 600,
  fontFamily: F,
  zIndex: 90,
  boxShadow: "0 8px 24px rgba(0,0,0,.18)",
  whiteSpace: "nowrap",
  borderLeft: `3px solid ${C.primary}`
}}>
  {text}
</div>;
  }

function Header({ screenName, onBack, onMenuClick }) {
    return <div style={{
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 16px",
  height: 52,
  background: C.card,
  borderBottom: `1px solid ${C.border}`,
  position: "sticky",
  top: 0,
  zIndex: 30
}}>
  <div style={{
  display: "flex",
  alignItems: "center",
  gap: 10
}}>
    {onBack && <button onClick={onBack} style={{
  background: "none",
  border: "none",
  cursor: "pointer",
  padding: 0,
  display: "flex"
}}>
  <ChevronLeft size={22} color={C.ink} />
</button>}
    {onMenuClick && !onBack && <button onClick={onMenuClick} className="rm-menu-btn" style={{
  background: "none",
  border: "none",
  cursor: "pointer",
  padding: 0,
  display: "flex"
}}>
  <Menu size={21} color={C.ink} />
</button>}
    <span style={{
  fontFamily: F,
  fontWeight: 900,
  fontSize: 16,
  color: C.ink,
  letterSpacing: -0.8,
  textTransform: "uppercase"
}}>
      AUTOPRISM
      <span style={{
  display: "inline-block",
  width: 5,
  height: 5,
  borderRadius: "50%",
  background: C.primary,
  marginLeft: 1,
  marginBottom: 8
}} />
    </span>
    {screenName && <span style={{
  fontFamily: F,
  fontSize: 13,
  color: C.sub
}}>
  / 
  {screenName}
</span>}
  </div>
  <div style={{
  width: 28,
  height: 28,
  borderRadius: "50%",
  background: C.ink,
  color: "#fff",
  fontFamily: F,
  fontWeight: 700,
  fontSize: 11,
  display: "flex",
  alignItems: "center",
  justifyContent: "center"
}}>
    {ini(ME.name)}
  </div>
</div>;
  }

function MenuDrawer({ active, onChange, onClose }) {
  const [openGroup, setOpenGroup] = useState("leads");
    return <div style={{
  position: "absolute",
  inset: 0,
  zIndex: 100,
  display: "flex"
}}>
  <div onClick={onClose} style={{
  position: "absolute",
  inset: 0,
  background: "rgba(14,14,12,0.4)"
}} />
  <div style={{
  position: "relative",
  width: "78%",
  maxWidth: 280,
  height: "100%",
  background: C.card,
  boxShadow: "8px 0 32px rgba(0,0,0,0.18)",
  display: "flex",
  flexDirection: "column"
}}>
    <div style={{
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "18px 18px 14px"
}}>
      <span style={{
  fontFamily: F,
  fontWeight: 900,
  fontSize: 15,
  color: C.ink,
  letterSpacing: -0.8,
  textTransform: "uppercase"
}}>
        AUTOPRISM
        <span style={{
  display: "inline-block",
  width: 5,
  height: 5,
  borderRadius: "50%",
  background: C.primary,
  marginLeft: 1,
  marginBottom: 7
}} />
      </span>
      <button onClick={onClose} style={{
  background: "none",
  border: "none",
  cursor: "pointer",
  padding: 2
}}>
        <X size={19} color={C.faint} />
      </button>
    </div>
    <div style={{
  padding: "8px 12px",
  flex: 1
}}>
      {NAV_ITEMS.map(t => {
  const groupActive = t.subs.length ? t.subs.some(x => x.key === active) : active === t.key;
  const expanded = openGroup === t.key;
  return <div key={t.key} style={{ marginBottom: 3 }}>
    <button onClick={() => {
      if (!t.subs.length) { onChange(t.key); onClose(); return; }
      setOpenGroup(expanded ? null : t.key);
    }} style={{
      display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "12px 12px",
      borderRadius: 10, border: "none", background: groupActive ? C.primarySoft : "none",
      cursor: "pointer", textAlign: "left",
    }}>
      <t.Icon size={18} color={groupActive ? C.primary : C.faint} strokeWidth={groupActive ? 2.4 : 1.8} />
      <span style={{ flex: 1, fontFamily: F, fontWeight: groupActive ? 700 : 500, fontSize: 14,
        color: groupActive ? C.primary : C.ink }}>{t.label}</span>
      {t.subs.length > 0 && <ChevronDown size={15} color={C.ghost} style={{
        transform: expanded ? "rotate(180deg)" : "none", transition: "transform .18s" }} />}
    </button>
    {expanded && t.subs.map(sub => {
      const on = active === sub.key;
      return <button key={sub.key} onClick={() => { onChange(sub.key); onClose(); }} style={{
        display: "flex", alignItems: "center", width: "100%", padding: "9px 12px 9px 42px",
        borderRadius: 9, border: "none", background: on ? C.primarySoft : "none",
        cursor: "pointer", textAlign: "left",
      }}>
        <span style={{ fontFamily: F, fontWeight: on ? 700 : 500, fontSize: 13,
          color: on ? C.primary : C.sub }}>{sub.label}</span>
      </button>;
    })}
  </div>;
})}
    </div>
    <div style={{
  padding: "12px",
  borderTop: `1px solid ${C.border}`
}}>
      <div style={{
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "10px 12px",
  marginBottom: 6
}}>
        <div style={{
  width: 30,
  height: 30,
  borderRadius: "50%",
  background: C.ink,
  color: "#fff",
  fontFamily: F,
  fontWeight: 700,
  fontSize: 12,
  display: "flex",
  alignItems: "center",
  justifyContent: "center"
}}>
          {ini(ME.name)}
        </div>
        <span style={{
  fontFamily: F,
  fontSize: 13,
  fontWeight: 700,
  color: C.ink
}}>
          {ME.name}
        </span>
      </div>
      <button style={{
  display: "flex",
  alignItems: "center",
  gap: 12,
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "none",
  background: "none",
  cursor: "pointer",
  textAlign: "left"
}}>
        <LogOut size={17} color={C.hot} />
        <span style={{
  fontFamily: F,
  fontWeight: 600,
  fontSize: 14,
  color: C.hot
}}>
          Logout
        </span>
      </button>
    </div>
  </div>
</div>;
  }

function QuickAction({ icon: Icon, label, onClick, tone }) {
    const tones = {
      primary: { bg: C.primary, fg: "#fff", border: "none" },
      // Charcoal, not pure black — a second filled action alongside the orange primary,
      // warm enough to sit with the rest of the palette.
      dark: { bg: "#0B1946", fg: "#fff", border: "none" },
      soft: { bg: C.primarySoft, fg: C.primary, border: `1.5px solid ${C.primary}35` }
    };
    const t = tones[tone] || tones.soft;
    return <button onClick={onClick} style={{
  flex: 1,
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 2,
  background: t.bg,
  color: t.fg,
  border: t.border,
  borderRadius: 8,
  padding: "5px 3px",
  cursor: "pointer"
}}>
  <Icon size={11} />
  <span style={{
  fontFamily: F,
  fontWeight: 700,
  fontSize: 8.5,
  whiteSpace: "nowrap"
}}>
    {label}
  </span>
</button>;
  }

function ShareButton({ icon: Icon, label, href, onClick, color, sent }) {
    const DisplayIcon = sent ? Check : Icon;
    const displayColor = sent ? C.green : color || C.ink;
    const content = <>
  <DisplayIcon size={16} color={displayColor} />
  <span style={{
  fontFamily: F,
  fontWeight: 700,
  fontSize: 10.5,
  color: sent ? C.green : C.ink
}}>
    {sent ? "Sent" : label}
  </span>
</>;
    const style = {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 5,
      flex: "1 1 64px",
      minWidth: 64,
      padding: "10px 4px",
      borderRadius: 10,
      border: `1.5px solid ${sent ? C.green : C.border}`,
      background: sent ? C.greenSoft : C.card,
      cursor: "pointer",
      textDecoration: "none"
    };
    return href ? <a href={href} target="_blank" rel="noopener noreferrer" onClick={onClick} style={style}>
  {content}
</a> : <button onClick={onClick} style={style}>
  {content}
</button>;
  }

function DropdownChecklist({ options, selected, onToggle, placeholder, renderLabel, multi = true }) {
    const [open, setOpen] = useState(false);
    const selectedOpt = !multi && selected.length ? options.find((o) => o.key === selected[0]) : null;
    return <div>
  <button onClick={() => setOpen(v => !v)} style={{
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  width: "100%",
  border: `1.5px solid ${C.borderStrong}`,
  borderRadius: 9,
  padding: "9px 12px",
  background: C.card,
  cursor: "pointer"
}}>
    <span style={{
  fontFamily: F,
  fontSize: 12.5,
  color: selected.length ? C.ink : C.sub
}}>
      {multi ? selected.length ? `${selected.length} selected` : placeholder : selectedOpt ? renderLabel ? renderLabel(selectedOpt) : selectedOpt.label : placeholder}
    </span>
    <ChevronDown size={14} color={C.faint} style={{
  transform: open ? "rotate(180deg)" : "none"
}} />
  </button>
  {open && <div style={{
  background: C.card,
  border: `1px solid ${C.border}`,
  borderRadius: 9,
  padding: 6,
  marginTop: 6,
  maxHeight: 220,
  overflowY: "auto"
}}>
  {options.map((opt, i) => {
  const on = selected.includes(opt.key);
  return <button onClick={() => {
  onToggle(opt.key);
  if (!multi) setOpen(false);
}} style={{
  display: "flex",
  alignItems: "center",
  gap: 8,
  width: "100%",
  background: "none",
  border: "none",
  borderBottom: i < options.length - 1 ? `1px solid ${C.border}` : "none",
  cursor: "pointer",
  padding: "9px 8px",
  textAlign: "left"
}} key={opt.key}>
  {multi ? on ? <CheckSquare size={14} color={C.primary} /> : <Square size={14} color={C.ghost} /> : <span style={{
  width: 14,
  height: 14,
  borderRadius: "50%",
  flexShrink: 0,
  boxSizing: "border-box",
  border: `1.5px solid ${on ? C.primary : C.ghost}`,
  display: "flex",
  alignItems: "center",
  justifyContent: "center"
}}>
  {on && <span style={{
  width: 7,
  height: 7,
  borderRadius: "50%",
  background: C.primary
}} />}
</span>}
  <span style={{
  fontFamily: F,
  fontSize: 12,
  fontWeight: on ? 700 : 500,
  color: on ? C.primary : C.ink
}}>
    {renderLabel ? renderLabel(opt) : opt.label}
  </span>
</button>;
})}
</div>}
</div>;
  }

function SourcePicker({ value, onChange, customSources, onAddCustomSource }) {
    const [open, setOpen] = useState(!value);
    const [addingOther, setAddingOther] = useState(false);
    const [otherText, setOtherText] = useState("");
    const pick = (s) => {
      onChange(s);
      setOpen(false);
      setAddingOther(false);
      setOtherText("");
    };
    const submitOther = () => {
      const v = otherText.trim();
      if (!v) return;
      onAddCustomSource(v);
      pick(v);
    };
    const optionButtonStyle = (on) => ({
      display: "flex",
      alignItems: "center",
      gap: 8,
      width: "100%",
      textAlign: "left",
      background: on ? C.primarySoft : "none",
      border: "none",
      borderBottom: `1px solid ${C.border}`,
      borderRadius: 6,
      cursor: "pointer",
      padding: "8px 8px",
      fontFamily: F,
      fontSize: 11.5,
      fontWeight: on ? 700 : 500,
      color: on ? C.primary : C.ink
    });
    const RadioDot = ({ on }) => <span style={{
  width: 13,
  height: 13,
  borderRadius: "50%",
  flexShrink: 0,
  boxSizing: "border-box",
  border: `1.5px solid ${on ? C.primary : C.ghost}`,
  display: "flex",
  alignItems: "center",
  justifyContent: "center"
}}>
  {on && <span style={{
  width: 6.5,
  height: 6.5,
  borderRadius: "50%",
  background: C.primary
}} />}
</span>;
    return <div>
  <button onClick={() => setOpen(v => !v)} style={{
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  width: "100%",
  border: `1.5px solid ${C.borderStrong}`,
  borderRadius: 9,
  padding: "9px 12px",
  background: C.card,
  cursor: "pointer"
}}>
    <span style={{
  fontFamily: F,
  fontSize: 12.5,
  color: value ? C.ink : C.sub
}}>
      {value || "How did they reach us?"}
    </span>
    <ChevronDown size={14} color={C.sub} style={{
  transform: open ? "rotate(180deg)" : "none"
}} />
  </button>
  {open && <div style={{
  display: "flex",
  border: `1px solid ${C.border}`,
  borderRadius: 9,
  marginTop: 6,
  overflow: "hidden",
  maxHeight: 230
}}>
  <div style={{
  flex: 1,
  overflowY: "auto",
  padding: 6,
  borderRight: `1.5px solid ${C.borderStrong}`,
  background: C.bg
}}>
    <div style={{
  fontFamily: F,
  fontSize: 9,
  fontWeight: 700,
  color: C.sub,
  textTransform: "uppercase",
  letterSpacing: 0.3,
  padding: "2px 8px 6px"
}}>
      Standard
    </div>
    {SOURCE_OPTIONS.map(s => <button onClick={() => pick(s)} style={optionButtonStyle(value === s)} key={s}>
  <RadioDot on={value === s} />
  {s}
</button>)}
  </div>
  <div style={{
  flex: 1,
  overflowY: "auto",
  padding: 6
}}>
    <div style={{
  fontFamily: F,
  fontSize: 9,
  fontWeight: 700,
  color: C.sub,
  textTransform: "uppercase",
  letterSpacing: 0.3,
  padding: "2px 8px 6px"
}}>
      Added by Team
    </div>
    {customSources.length === 0 && !addingOther && <div style={{
  fontFamily: F,
  fontSize: 11,
  color: C.sub,
  padding: "4px 8px 8px"
}}>
  None yet.
</div>}
    {customSources.map(s => <button onClick={() => pick(s)} style={optionButtonStyle(value === s)} key={s}>
  <RadioDot on={value === s} />
  {s}
</button>)}
    {!addingOther ? <button onClick={() => setAddingOther(true)} style={optionButtonStyle(false)}>
  <RadioDot on={false} />
  Other…
</button> : <div style={{
  padding: "4px 4px 0"
}}>
  <input value={otherText} onChange={e => setOtherText(e.target.value)} placeholder="New source name" autoFocus={true} style={{
  width: "100%",
  minWidth: 0,
  border: `1px solid ${C.borderStrong}`,
  borderRadius: 7,
  padding: "6px 8px",
  fontFamily: F,
  fontSize: 11.5,
  color: C.ink,
  background: C.card,
  outline: "none",
  boxSizing: "border-box",
  marginBottom: 5
}} />
  <button onClick={submitOther} disabled={!otherText.trim()} style={{
  width: "100%",
  padding: "6px 0",
  borderRadius: 7,
  border: "none",
  background: otherText.trim() ? C.primary : C.ghost,
  color: otherText.trim() ? "#fff" : C.sub,
  fontFamily: F,
  fontWeight: 700,
  fontSize: 11,
  cursor: otherText.trim() ? "pointer" : "default"
}}>
    Add & Use
  </button>
</div>}
  </div>
</div>}
</div>;
  }

function TimeSlotPicker({ mode, date, slot, onChange, allLeads, excludeLeadId }) {
    const slots = generateTimeSlots(mode);
    const conflict = slot ? findTestDriveConflict(allLeads, date, slot, mode, excludeLeadId) : null;
    return <div>
  <div style={{
  display: "flex",
  flexDirection: "column",
  gap: 5,
  maxHeight: 168,
  overflowY: "auto",
  border: `1px solid ${C.border}`,
  borderRadius: 8,
  padding: 5,
  background: C.bg
}}>
    {slots.map(s => {
  const on = slot === s;
  return <button onClick={() => onChange(s)} style={{
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  width: "100%",
  padding: "8px 10px",
  borderRadius: 7,
  border: `1.5px solid ${on ? C.primary : "transparent"}`,
  background: on ? C.primarySoft : C.card,
  color: on ? C.primary : C.ink,
  fontFamily: F,
  fontWeight: on ? 700 : 500,
  fontSize: 12,
  cursor: "pointer"
}} key={s}>
  {s}
  {on && <Check size={13} color={C.primary} />}
</button>;
})}
  </div>
  {conflict && <div style={{
  display: "flex",
  alignItems: "flex-start",
  gap: 6,
  marginTop: 8
}}>
  <AlertTriangle size={12} color={C.hot} style={{
  marginTop: 1,
  flexShrink: 0
}} />
  <span style={{
  fontFamily: F,
  fontSize: 11,
  color: C.hot,
  lineHeight: 1.4
}}>
    1 TD already booked at this time for 
    {conflict.leadName}
     — 
    {conflict.model}
    .
  </span>
</div>}
</div>;
  }

// The numbers we can try for a lead, best-connecting first. Rate is the share of past
// attempts on that number that actually connected — null when it has never been tried,
// so a new alternate number isn't ranked above a proven one on zero evidence.
function phoneOptions(lead) {
  const history = lead.callHistory || [];
  const rateFor = (num) => {
    const tries = history.filter(h => !h.number || h.number === num);
    if (!tries.length) return null;
    const ok = tries.filter(h => h.disposition === "connected").length;
    return Math.round((ok / tries.length) * 100) + "%";
  };
  const list = [{ number: lead.phone, rate: rateFor(lead.phone) }];
  if (lead.altPhone) list.push({ number: lead.altPhone, rate: null });
  // Known-good numbers first; untried ones keep their original order below.
  return list.sort((a, b) => (parseInt(b.rate) || -1) - (parseInt(a.rate) || -1));
}

function PhoneNumberPicker({ lead, onPick, onCancel }) {
    const options = phoneOptions(lead);
    return <div style={{
  background: C.bg,
  borderRadius: 12,
  padding: 10,
  marginTop: 10
}}>
  <div style={{
  fontFamily: F,
  fontSize: 10.5,
  fontWeight: 700,
  color: C.sub,
  textTransform: "uppercase",
  letterSpacing: 0.5,
  marginBottom: 8
}}>
    Which number?
  </div>
  {options.map((o, i) => <button onClick={() => onPick(o.number)} style={{
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  width: "100%",
  background: C.card,
  border: `1.5px solid ${i === 0 && o.rate !== null ? C.green : C.border}`,
  borderRadius: 10,
  padding: "9px 11px",
  marginBottom: i === options.length - 1 ? 0 : 6,
  cursor: "pointer"
}} key={o.number}>
  <div style={{
  display: "flex",
  alignItems: "center",
  gap: 8
}}>
    <span style={{
  fontFamily: F,
  fontWeight: 700,
  fontSize: 13,
  color: C.ink
}}>
      {o.number}
    </span>
    {o.rate !== null && <span style={{
  fontFamily: F,
  fontWeight: 700,
  fontSize: 11,
  color: i === 0 ? C.green : C.sub
}}>
  {o.rate}
  % contact
</span>}
    {i === 0 && o.rate !== null && <Pill label="Best chance" color={C.green} soft={C.greenSoft} />}
  </div>
  <div style={{
  width: 28,
  height: 28,
  borderRadius: "50%",
  background: C.primary,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0
}}>
    <Phone size={13} color="#fff" />
  </div>
</button>)}
  <button onClick={onCancel} style={{
  background: "none",
  border: "none",
  cursor: "pointer",
  fontFamily: F,
  fontSize: 11,
  color: C.sub,
  marginTop: 8,
  padding: 0
}}>
    Cancel
  </button>
</div>;
  }

function SERosterPicker({ selectedSE, onSelect }) {
    const [open, setOpen] = useState(!selectedSE);
    const [query, setQuery] = useState("");
    const filtered = TEAM_ROSTER.filter((p) => !query.trim() || p.name.toLowerCase().includes(query.trim().toLowerCase()) || p.role.toLowerCase().includes(query.trim().toLowerCase())).sort((a, b) => (seAssignmentFrequency[b.name] || 0) - (seAssignmentFrequency[a.name] || 0));
    const handleSelect = (se) => {
      onSelect(se);
      setOpen(false);
    };
    return <div>
  <button onClick={() => setOpen(v => !v)} style={{
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  width: "100%",
  border: `1.5px solid ${C.borderStrong}`,
  borderRadius: 10,
  padding: "8px 11px",
  background: C.card,
  cursor: "pointer"
}}>
    {selectedSE ? <div style={{
  display: "flex",
  alignItems: "center",
  gap: 9
}}>
  <div style={{
  width: 26,
  height: 26,
  borderRadius: "50%",
  background: (ROLE_COLOR_2[selectedSE.role] || C.primary) + "18",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0
}}>
    <span style={{
  fontFamily: F,
  fontWeight: 700,
  fontSize: 10,
  color: ROLE_COLOR_2[selectedSE.role] || C.primary
}}>
      {ini(selectedSE.name)}
    </span>
  </div>
  <div style={{
  textAlign: "left"
}}>
    <div style={{
  fontFamily: F,
  fontWeight: 700,
  fontSize: 12.5,
  color: C.ink
}}>
      {selectedSE.name}
    </div>
    <div style={{
  fontFamily: F,
  fontSize: 10,
  color: C.sub
}}>
      {selectedSE.branch}
    </div>
  </div>
</div> : <span style={{
  fontFamily: F,
  fontSize: 12.5,
  color: C.sub
}}>
  Select a Sales Executive…
</span>}
    <ChevronDown size={14} color={C.faint} style={{
  transform: open ? "rotate(180deg)" : "none",
  flexShrink: 0
}} />
  </button>
  {open && <div style={{
  marginTop: 8
}}>
  <div style={{
  display: "flex",
  alignItems: "center",
  gap: 8,
  background: C.card,
  border: `1.5px solid ${C.border}`,
  borderRadius: 10,
  padding: "8px 11px",
  marginBottom: 10
}}>
    <Search size={13} color={C.faint} />
    <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by name or designation…" style={{
  border: "none",
  outline: "none",
  flex: 1,
  fontFamily: F,
  fontSize: 12.5,
  color: C.ink,
  background: "none"
}} />
    {query && <button onClick={() => setQuery("")} style={{
  background: "none",
  border: "none",
  cursor: "pointer",
  padding: 0,
  display: "flex"
}}>
  <X size={12} color={C.faint} />
</button>}
  </div>
  <div style={{
  maxHeight: 220,
  overflowY: "auto"
}}>
    {filtered.length === 0 && <div style={{
  textAlign: "center",
  padding: "16px 0",
  fontFamily: F,
  fontSize: 12,
  color: C.sub
}}>
  No one matches "
  {query}
  "
</div>}
    {filtered.map(se => {
  const freq = seAssignmentFrequency[se.name] || 0;
  const isSelected = selectedSE?.name === se.name;
  return <button onClick={() => handleSelect(se)} style={{
  display: "flex",
  alignItems: "center",
  gap: 10,
  width: "100%",
  background: isSelected ? C.primarySoft : C.card,
  border: `1.5px solid ${isSelected ? C.primary : C.border}`,
  borderRadius: 10,
  padding: 10,
  marginBottom: 6,
  cursor: "pointer",
  textAlign: "left"
}} key={se.name}>
  <div style={{
  width: 30,
  height: 30,
  borderRadius: "50%",
  background: (ROLE_COLOR_2[se.role] || C.primary) + "18",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0
}}>
    <span style={{
  fontFamily: F,
  fontWeight: 700,
  fontSize: 11,
  color: ROLE_COLOR_2[se.role] || C.primary
}}>
      {ini(se.name)}
    </span>
  </div>
  <div style={{
  flex: 1,
  minWidth: 0
}}>
    <div style={{
  display: "flex",
  alignItems: "center",
  gap: 6,
  flexWrap: "wrap"
}}>
      <span style={{
  fontFamily: F,
  fontWeight: 700,
  fontSize: 12.5,
  color: C.ink
}}>
        {se.name}
      </span>
      <Pill label={se.role} color={ROLE_COLOR_2[se.role] || C.primary} soft={(ROLE_COLOR_2[se.role] || C.primary) + "18"} />
    </div>
    <div style={{
  fontFamily: F,
  fontSize: 10.5,
  color: C.sub,
  marginTop: 1
}}>
      {se.branch}
    </div>
  </div>
  {isSelected ? <Check size={16} color={C.primary} style={{
  flexShrink: 0
}} /> : freq > 0 && <span style={{
  fontFamily: F,
  fontSize: 9.5,
  color: C.sub,
  flexShrink: 0
}}>
  {freq}
  × recent
</span>}
</button>;
})}
  </div>
</div>}
</div>;
  }

function ModelInterestPicker({ value, onChange, colorValue, onColorChange }) {
    const [open, setOpen] = useState(true);
    const [activeModel, setActiveModel] = useState(() => Object.keys(value)[0] || Object.keys(MODEL_VARIANTS)[0]);
    const models = Object.keys(MODEL_VARIANTS);
    const toggleVariant = (model, variant) => {
      const current = value[model] || [];
      const next = current.includes(variant) ? current.filter((v) => v !== variant) : [...current, variant];
      const nextMap = { ...value };
      if (next.length === 0) delete nextMap[model];
      else nextMap[model] = next;
      onChange(nextMap);
    };
    const toggleColor = (color) => {
      onColorChange(colorValue.includes(color) ? colorValue.filter((c) => c !== color) : [...colorValue, color]);
    };
    const tags = modelInterestTags(value);
    const totalSelected = tags.length + colorValue.length;
    return <div>
  {(tags.length > 0 || colorValue.length > 0) && <div style={{
  display: "flex",
  flexWrap: "wrap",
  gap: 6,
  marginBottom: 10
}}>
  {tags.map(t => <Pill label={t} color={C.primary} soft={C.primarySoft} key={t} />)}
  {colorValue.map(c => <Pill label={c} color={C.teal} soft={C.tealSoft} key={c} />)}
</div>}
  <button onClick={() => setOpen(v => !v)} style={{
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  width: "100%",
  border: `1.5px solid ${C.borderStrong}`,
  borderRadius: 9,
  padding: "9px 12px",
  background: C.card,
  cursor: "pointer"
}}>
    <span style={{
  fontFamily: F,
  fontSize: 12.5,
  color: totalSelected ? C.ink : C.sub
}}>
      {totalSelected ? `${totalSelected} selected` : "Select models, variants & color\u2026"}
    </span>
    <ChevronDown size={14} color={C.faint} style={{
  transform: open ? "rotate(180deg)" : "none"
}} />
  </button>
  {open && <div style={{
  display: "flex",
  border: `1px solid ${C.border}`,
  borderRadius: 9,
  marginTop: 6,
  overflow: "hidden",
  height: 240
}}>
  <div style={{
  width: 92,
  flexShrink: 0,
  borderRight: `1px solid ${C.border}`,
  overflowY: "auto",
  background: C.bg
}}>
    {models.map((model, i) => {
  const hasSelection = (value[model] || []).length > 0;
  const isActive = activeModel === model;
  return <button onClick={() => setActiveModel(model)} style={{
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  width: "100%",
  padding: "10px 6px",
  background: isActive ? C.card : "none",
  border: "none",
  borderLeft: `3px solid ${isActive ? C.primary : "transparent"}`,
  borderBottom: i < models.length - 1 ? `1px solid ${C.border}` : "none",
  cursor: "pointer",
  textAlign: "left"
}} key={model}>
  <span style={{
  fontFamily: F,
  fontSize: 11,
  fontWeight: isActive ? 700 : 500,
  color: isActive ? C.primary : hasSelection ? C.ink : C.sub
}}>
    {model}
  </span>
  {hasSelection && <span style={{
  width: 6,
  height: 6,
  borderRadius: "50%",
  background: C.primary,
  flexShrink: 0
}} />}
</button>;
})}
  </div>
  <div style={{
  flex: 1,
  overflowY: "auto",
  padding: 5,
  borderRight: `1px solid ${C.border}`
}}>
    {[...MODEL_VARIANTS[activeModel], YET_TO_DECIDE].map((variant, i, arr) => {
  const on = (value[activeModel] || []).includes(variant);
  return <button onClick={() => toggleVariant(activeModel, variant)} style={{
  display: "flex",
  alignItems: "center",
  gap: 8,
  width: "100%",
  background: "none",
  border: "none",
  borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : "none",
  cursor: "pointer",
  padding: "9px 8px",
  textAlign: "left"
}} key={variant}>
  {on ? <CheckSquare size={14} color={C.primary} /> : <Square size={14} color={C.ghost} />}
  <span style={{
  fontFamily: F,
  fontSize: 12,
  fontWeight: on ? 700 : 500,
  color: on ? C.primary : C.ink
}}>
    {variant}
  </span>
</button>;
})}
  </div>
  <div style={{
  width: 96,
  flexShrink: 0,
  overflowY: "auto",
  padding: 5
}}>
    {COLOR_OPTIONS.map((color, i) => {
  const on = colorValue.includes(color);
  return <button onClick={() => toggleColor(color)} style={{
  display: "flex",
  alignItems: "center",
  gap: 6,
  width: "100%",
  background: "none",
  border: "none",
  borderBottom: i < COLOR_OPTIONS.length - 1 ? `1px solid ${C.border}` : "none",
  cursor: "pointer",
  padding: "8px 6px",
  textAlign: "left"
}} key={color}>
  {on ? <CheckSquare size={13} color={C.teal} /> : <Square size={13} color={C.ghost} />}
  <span style={{
  fontFamily: F,
  fontSize: 10.5,
  fontWeight: on ? 700 : 500,
  color: on ? C.teal : C.ink,
  lineHeight: 1.2
}}>
    {color}
  </span>
</button>;
})}
  </div>
</div>}
</div>;
  }

function CallbackScheduler({ dateValue, onDateChange, timeValue, onTimeChange }) {
    const selectedDate = dateValue ? new Date(dateValue + "T00:00:00") : null;
    const [viewMonth, setViewMonth] = useState(() => {
      const d2 = selectedDate || new Date();
      return new Date(d2.getFullYear(), d2.getMonth(), 1);
    });
    const setQuickDate = (days) => {
      const d2 = new Date();
      d2.setDate(d2.getDate() + days);
      onDateChange(isoDate(d2));
      setViewMonth(new Date(d2.getFullYear(), d2.getMonth(), 1));
    };
    const isSameDay = (a, b) => a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    const firstOfMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
    const startWeekday = firstOfMonth.getDay();
    const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < startWeekday; i++) cells.push(null);
    for (let d2 = 1; d2 <= daysInMonth; d2++) cells.push(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d2));
    return <div>
  <div style={{
  display: "flex",
  gap: 6,
  marginBottom: 10
}}>
    {QUICK_CALLBACK_OPTIONS.map(o => <button onClick={() => setQuickDate(o.days)} style={{
  flex: 1,
  padding: "7px 0",
  borderRadius: 8,
  border: `1.5px solid ${dateValue === isoDate(new Date(Date.now() + o.days * 864e5)) ? C.primary : C.borderStrong}`,
  background: dateValue === isoDate(new Date(Date.now() + o.days * 864e5)) ? C.primarySoft : C.card,
  color: dateValue === isoDate(new Date(Date.now() + o.days * 864e5)) ? C.primary : C.sub,
  fontFamily: F,
  fontWeight: 700,
  fontSize: 11.5,
  cursor: "pointer"
}} key={o.label}>
  {o.label}
</button>)}
  </div>
  <div style={{
  background: C.card,
  border: `1.5px solid ${C.border}`,
  borderRadius: 10,
  padding: 10,
  marginBottom: 10
}}>
    <div style={{
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 8
}}>
      <button onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))} style={{
  background: "none",
  border: "none",
  cursor: "pointer",
  padding: 4,
  display: "flex"
}}>
        <ChevronLeft size={15} color={C.sub} />
      </button>
      <span style={{
  fontFamily: F,
  fontWeight: 700,
  fontSize: 12,
  color: C.ink
}}>
        {viewMonth.toLocaleDateString("en-IN", {
  month: "long",
  year: "numeric"
})}
      </span>
      <button onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))} style={{
  background: "none",
  border: "none",
  cursor: "pointer",
  padding: 4,
  display: "flex"
}}>
        <ChevronRight size={15} color={C.sub} />
      </button>
    </div>
    <div style={{
  display: "grid",
  gridTemplateColumns: "repeat(7, 1fr)",
  gap: 2,
  marginBottom: 4
}}>
      {["S", "M", "T", "W", "T", "F", "S"].map((d2, i) => <div style={{
  textAlign: "center",
  fontFamily: F,
  fontSize: 9,
  fontWeight: 700,
  color: C.sub
}} key={i}>
  {d2}
</div>)}
    </div>
    <div style={{
  display: "grid",
  gridTemplateColumns: "repeat(7, 1fr)",
  gap: 2
}}>
      {cells.map((d2, i) => {
  if (!d2) return <div key={i} />;
  const isToday = isSameDay(d2, today);
  const isSelected = isSameDay(d2, selectedDate);
  return <button onClick={() => onDateChange(isoDate(d2))} style={{
  aspectRatio: "1",
  borderRadius: 8,
  cursor: "pointer",
  border: isToday && !isSelected ? `1.5px solid ${C.primary}` : "1px solid transparent",
  background: isSelected ? C.primary : "none",
  color: isSelected ? "#fff" : C.ink,
  fontFamily: F,
  fontWeight: isSelected || isToday ? 700 : 500,
  fontSize: 11.5
}} key={i}>
  {d2.getDate()}
</button>;
})}
    </div>
  </div>
  <div style={{
  fontFamily: F,
  fontSize: 11,
  fontWeight: 700,
  color: C.sub,
  textTransform: "uppercase",
  letterSpacing: 0.6,
  marginBottom: 8
}}>
    Preferred Time
  </div>
  <div style={{
  display: "flex",
  gap: 6
}}>
    {TIME_OF_DAY_OPTIONS.map(t => <button onClick={() => onTimeChange(t.key)} style={{
  flex: 1,
  padding: "8px 0",
  borderRadius: 8,
  border: `1.5px solid ${timeValue === t.key ? C.primary : C.borderStrong}`,
  background: timeValue === t.key ? C.primarySoft : C.card,
  color: timeValue === t.key ? C.primary : C.sub,
  fontFamily: F,
  fontWeight: 700,
  fontSize: 12,
  cursor: "pointer"
}} key={t.key}>
  {t.label}
</button>)}
  </div>

  {/* Exact time, for when the customer named one. Choosing a period clears it and vice
      versa — the follow-up is either "sometime that morning" or "at 4:30", never both. */}
  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
    <span style={{ fontFamily: F, fontSize: 10.5, color: C.faint, fontWeight: 600, flexShrink: 0 }}>or exact time</span>
    <input
      type="time"
      value={/^\d{2}:\d{2}$/.test(timeValue || "") ? timeValue : ""}
      onChange={e => onTimeChange(e.target.value)}
      style={{
        flex: 1, border: `1.5px solid ${/^\d{2}:\d{2}$/.test(timeValue || "") ? C.primary : C.borderStrong}`,
        borderRadius: 8, padding: "7px 10px", fontFamily: F, fontSize: 12,
        color: C.ink, background: C.card, outline: "none", boxSizing: "border-box",
      }} />
  </div>
</div>;
  }

function CallRecordingPlayer({ durationLabel }) {
    const [playing, setPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const totalSeconds = durationLabel.split(":").reduce((acc, v) => acc * 60 + parseInt(v, 10), 0);
    useEffect(() => {
      if (!playing) return;
      const start = Date.now() - progress * totalSeconds * 1e3;
      const interval = setInterval(() => {
        const elapsed = (Date.now() - start) / 1e3;
        if (elapsed >= totalSeconds) {
          setProgress(1);
          setPlaying(false);
          clearInterval(interval);
        } else {
          setProgress(elapsed / totalSeconds);
        }
      }, 200);
      return () => clearInterval(interval);
    }, [playing]);
    return <div style={{
  display: "flex",
  alignItems: "center",
  gap: 8,
  background: C.card,
  border: `1px solid ${C.border}`,
  borderRadius: 8,
  padding: "6px 10px",
  marginTop: 7
}}>
  <button onClick={() => setPlaying(p => {
  if (p) return false;
  if (progress >= 1) setProgress(0);
  return true;
})} style={{
  width: 24,
  height: 24,
  borderRadius: "50%",
  background: C.primary,
  border: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  flexShrink: 0
}}>
    {playing ? <Pause size={11} color="#fff" /> : <Play size={11} color="#fff" style={{
  marginLeft: 1
}} />}
  </button>
  <div style={{
  flex: 1,
  height: 4,
  background: C.border,
  borderRadius: 999,
  overflow: "hidden"
}}>
    <div style={{
  width: `${progress * 100}%`,
  height: "100%",
  background: C.primary,
  borderRadius: 999
}} />
  </div>
  <span style={{
  fontFamily: F,
  fontSize: 10,
  color: C.sub,
  flexShrink: 0,
  minWidth: 66,
  textAlign: "right"
}}>
    {fmtSeconds(progress * totalSeconds)}
     / 
    {durationLabel}
  </span>
</div>;
  }

function CallHistoryList({ history, limit }) {
    const ordered = [...history].reverse();
    const visible = limit ? ordered.slice(0, limit) : ordered;
    return <div style={{
  marginTop: 10
}}>
  {visible.map((c, i) => {
  const dispoMeta = DISPOSITIONS.find(dd => dd.key === c.disposition);
  return <div style={{
  background: C.bg,
  border: `1px solid ${C.borderStrong}`,
  borderRadius: 10,
  padding: 10,
  marginBottom: 6
}} key={i}>
  <div style={{
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 5
}}>
    <span style={{
  fontFamily: F,
  fontWeight: 700,
  fontSize: 11.5,
  color: C.ink
}}>
      {fmtDateTime(c.date)}
    </span>
    <Pill label={dispoMeta?.label || EXTRA_DISPOSITION_LABELS[c.disposition] || c.disposition} color={C.sub} soft={C.card} />
  </div>
  {c.note && <div style={{
  fontFamily: F,
  fontSize: 11.5,
  color: C.sub,
  lineHeight: 1.4
}}>
  {c.note}
</div>}
  {c.disposition === "connected" && c.recordingDuration && <CallRecordingPlayer durationLabel={c.recordingDuration} />}
</div>;
})}
</div>;
  }

function CollectibleDocRow({ label, done, via, onCollect, onUndo, onSendLink, onPreview }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const viaLabel = via === "camera" ? "via camera" : via === "upload" ? "via upload" : via === "customer" ? "via link" : "";
    const menuBtnStyle = {
      display: "flex",
      alignItems: "center",
      gap: 4,
      background: C.card,
      border: `1px solid ${C.borderStrong}`,
      borderRadius: 7,
      padding: "5px 9px",
      fontFamily: F,
      fontSize: 10.5,
      fontWeight: 700,
      color: C.sub,
      cursor: "pointer"
    };
    return <div>
  <div style={{
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8
}}>
    <button onClick={() => done ? onPreview() : setMenuOpen(v => !v)} style={{
  display: "flex",
  alignItems: "center",
  gap: 8,
  flex: 1,
  background: "none",
  border: "none",
  cursor: "pointer",
  textAlign: "left",
  padding: 0
}}>
      {done ? <CheckSquare size={15} color={C.primary} /> : <Square size={15} color={C.ghost} />}
      <span style={{
  fontFamily: F,
  fontSize: 12,
  color: done ? C.ink : C.sub,
  fontWeight: done ? 600 : 500
}}>
        {label}
        {done ? " Collected" : ""}
      </span>
    </button>
    <div style={{
  display: "flex",
  alignItems: "center",
  gap: 6,
  flexShrink: 0
}}>
      {done && via && <button onClick={onPreview} style={{
  width: 26,
  height: 26,
  borderRadius: 6,
  background: C.bg,
  border: `1px solid ${C.border}`,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  padding: 0
}}>
  <Image size={13} color={C.primary} />
</button>}
      {done && via && <Pill label={viaLabel} color={C.primary} soft={C.primarySoft} />}
      {done && <button onClick={onUndo} style={{
  background: "none",
  border: "none",
  cursor: "pointer",
  padding: 2
}}>
  <X size={12} color={C.sub} />
</button>}
    </div>
  </div>
  {menuOpen && !done && <div style={{
  display: "flex",
  gap: 6,
  marginTop: 7,
  marginLeft: 23
}}>
  <button onClick={() => {
  onCollect("camera");
  setMenuOpen(false);
}} style={menuBtnStyle}>
    <Camera size={11} />
    Camera
  </button>
  <button onClick={() => {
  onCollect("upload");
  setMenuOpen(false);
}} style={menuBtnStyle}>
    <Image size={11} />
    Upload
  </button>
  <button onClick={() => {
  onSendLink();
  setMenuOpen(false);
}} style={menuBtnStyle}>
    <MessageSquare size={11} />
    Send Link
  </button>
</div>}
</div>;
  }

function DrivingLicenseRow({ done, via, onCollect, onUndo, showToast, customerName }) {
    const [previewOpen, setPreviewOpen] = useState(false);
    return <div style={{
  background: C.bg,
  border: `1px solid ${C.border}`,
  borderRadius: 9,
  padding: 10,
  marginTop: 10
}}>
  <CollectibleDocRow label="Driving License" done={done} via={via} onCollect={onCollect} onUndo={onUndo} onPreview={() => setPreviewOpen(true)} onSendLink={() => showToast(`\u{1F4AC} Driving license upload link sent to ${customerName} via WhatsApp`)} />
  {previewOpen && <DocPreviewModal label="Driving License" via={via} onClose={() => setPreviewOpen(false)} />}
</div>;
  }

function DocPreviewModal({ label, via, onClose }) {
    const viaText = via === "camera" ? "Captured via camera" : via === "upload" ? "Uploaded photo" : "Received from customer via link";
    return <div onClick={onClose} style={{
  position: "fixed",
  inset: 0,
  background: "rgba(14,14,12,0.55)",
  zIndex: 300,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 24
}}>
  <div onClick={e => e.stopPropagation()} style={{
  background: C.card,
  borderRadius: 16,
  padding: 16,
  width: "100%",
  maxWidth: 300
}}>
    <div style={{
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 12
}}>
      <span style={{
  fontFamily: F,
  fontWeight: 700,
  fontSize: 13,
  color: C.ink
}}>
        {label}
      </span>
      <button onClick={onClose} style={{
  background: "none",
  border: "none",
  cursor: "pointer",
  padding: 2
}}>
        <X size={17} color={C.sub} />
      </button>
    </div>
    <div style={{
  width: "100%",
  aspectRatio: "3 / 4",
  borderRadius: 12,
  background: C.bg,
  border: `1.5px dashed ${C.borderStrong}`,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  marginBottom: 10
}}>
      {via === "camera" ? <Camera size={30} color={C.ghost} /> : <FileText size={30} color={C.ghost} />}
      <span style={{
  fontFamily: F,
  fontSize: 10.5,
  color: C.sub
}}>
        Preview
      </span>
    </div>
    <div style={{
  fontFamily: F,
  fontSize: 11.5,
  color: C.sub,
  fontWeight: 600
}}>
      {viaText}
    </div>
  </div>
</div>;
  }

// Collapsible detail section. Ticking a signal shouldn't dump a whole form on the rep —
// they may just be flagging "there's an exchange" and filling details later. Collapsed by
// default, with a filled dot when something has actually been entered, so the rep can see
// at a glance which sections hold data without opening them.
// A one-line toggle for an optional detail section. The filled dot is the "this has been
// edited" cue — same idea as the Sales Executive app's signal chips: you can see which
// sections hold data without opening any of them.
function ExpandRow({ label, accent, open, onToggle, hasData }) {
  return (
    <button onClick={onToggle} style={{
      display: "flex", alignItems: "center", gap: 7, width: "100%",
      background: open ? accent + "0F" : C.card,
      border: `1.5px solid ${hasData || open ? accent + "55" : C.borderStrong}`,
      borderRadius: 10, padding: "9px 12px", marginBottom: open ? 0 : 14,
      cursor: "pointer", textAlign: "left",
    }}>
      <span style={{ fontFamily: F, fontSize: 11, fontWeight: 700, color: hasData || open ? accent : C.sub, flex: 1 }}>
        {label}
      </span>
      {hasData && <span title="Details added" style={{ width: 6, height: 6, borderRadius: "50%", background: accent, flexShrink: 0 }} />}
      <ChevronDown size={14} color={C.faint} style={{ flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform .18s" }} />
    </button>
  );
}

function CollapsibleDetails({ title, subtitle, accent, hasData, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ background: C.card, border: `1.5px solid ${accent}55`, borderRadius: 10, marginBottom: 14, overflow: "hidden" }}>
      <button onClick={() => setOpen(o => !o)} style={{
        display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "10px 12px",
        background: "none", border: "none", cursor: "pointer", textAlign: "left",
      }}>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontFamily: F, fontSize: 11, fontWeight: 700, color: accent }}>{title}</span>
            {hasData && (
              <span title="Details added" style={{ width: 6, height: 6, borderRadius: "50%", background: accent, flexShrink: 0 }} />
            )}
          </span>
          {!open && subtitle && (
            <span style={{ display: "block", fontFamily: F, fontSize: 10, color: C.faint, marginTop: 2 }}>{subtitle}</span>
          )}
        </span>
        <ChevronDown size={14} color={C.faint} style={{ flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform .18s" }} />
      </button>
      {open && <div style={{ padding: "0 12px 12px" }}>{children}</div>}
    </div>
  );
}

function ExchangeEditPanel({ lead, onUpdateLead }) {
    const ex = lead.exchange || {};
    const [model, setModel] = useState(ex.model || "");
    const [variant, setVariant] = useState(ex.variant || "");
    const [year, setYear] = useState(ex.year || "");
    const [odometer, setOdometer] = useState(ex.odometer || "");
    const save = (patch) => onUpdateLead({ ...lead, exchange: { ...ex, ...patch } });
    const fieldStyle = { width: "100%", border: `1px solid ${C.borderStrong}`, borderRadius: 7, padding: "6px 8px", fontFamily: F, fontSize: 11.5, color: C.ink, background: C.card, outline: "none", boxSizing: "border-box" };
    const labelStyle = { fontFamily: F, fontSize: 9.5, color: C.sub, marginBottom: 3 };
    const range = exchangeRange(year, odometer, ex.condition, ex.ownership);
    return <div style={{
  background: C.bg,
  border: `1px solid ${C.border}`,
  borderRadius: 9,
  padding: "9px 10px"
}}>
  <div style={{
  display: "flex",
  flexWrap: "wrap",
  gap: "8px 4%",
  marginBottom: 8
}}>
    <div style={{
  width: "48%"
}}>
      <div style={labelStyle}>
        Car Model
      </div>
      <input value={model} onChange={e => setModel(e.target.value)} onBlur={() => save({
  model
})} placeholder="e.g. Maruti Swift" style={fieldStyle} />
    </div>
    <div style={{
  width: "48%"
}}>
      <div style={labelStyle}>
        Variant
      </div>
      <input value={variant} onChange={e => setVariant(e.target.value)} onBlur={() => save({
  variant
})} placeholder="e.g. VXI" style={fieldStyle} />
    </div>
    <div style={{
  width: "48%"
}}>
      <div style={labelStyle}>
        Year
      </div>
      <input value={year} onChange={e => setYear(e.target.value)} onBlur={() => save({
  year
})} placeholder="e.g. 2018" style={fieldStyle} />
    </div>
    <div style={{
  width: "48%"
}}>
      <div style={labelStyle}>
        Odometer (km)
      </div>
      <input value={odometer} onChange={e => setOdometer(e.target.value)} onBlur={() => save({
  odometer
})} placeholder="e.g. 48000" style={fieldStyle} />
    </div>
  </div>
  <div style={labelStyle}>
    Condition
  </div>
  <DropdownChecklist options={EXCHANGE_CONDITIONS} selected={ex.condition ? [ex.condition] : []} onToggle={key => save({
  condition: ex.condition === key ? "" : key
})} multi={false} placeholder="Select condition…" />
  {range && <div style={{
  marginTop: 8,
  background: C.tealSoft,
  borderRadius: 8,
  padding: "7px 9px"
}}>
  <div style={{
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center"
}}>
    <span style={{
  fontFamily: F,
  fontSize: 10,
  color: C.teal,
  fontWeight: 700
}}>
      System Estimate
    </span>
    <span style={{
  fontFamily: F,
  fontSize: 12,
  fontWeight: 800,
  color: C.ink
}}>
      {range.low === range.high ? `\u20B9${range.low} L` : `\u20B9${range.low}\u2013${range.high} L`}
    </span>
  </div>
</div>}
  {ex.appraisedValue != null && <div style={{
  fontFamily: F,
  fontSize: 11,
  color: C.green,
  fontWeight: 700,
  marginTop: 6
}}>
  Evaluator confirmed: ₹
  {ex.appraisedValue}
   L
</div>}
</div>;
  }

function FinanceEditPanel({ lead, onUpdateLead }) {
    const fin = lead.finance || {};
    const [loanAmount, setLoanAmount] = useState(fin.loanAmount || "");
    const [bank, setBank] = useState(fin.bank || "");
    const save = (patch) => onUpdateLead({ ...lead, finance: { ...fin, ...patch } });
    const fieldStyle = { width: "100%", border: `1px solid ${C.borderStrong}`, borderRadius: 7, padding: "6px 8px", fontFamily: F, fontSize: 11.5, color: C.ink, background: C.card, outline: "none", boxSizing: "border-box" };
    const labelStyle = { fontFamily: F, fontSize: 9.5, color: C.sub, marginBottom: 3 };
    return <div style={{
  background: C.bg,
  border: `1px solid ${C.border}`,
  borderRadius: 9,
  padding: "9px 10px"
}}>
  <div style={{
  display: "flex",
  flexWrap: "wrap",
  gap: "8px 4%",
  marginBottom: 8
}}>
    <div style={{
  width: "48%"
}}>
      <div style={labelStyle}>
        Loan Amount (₹ L)
      </div>
      <input type="number" min="0" value={loanAmount} onChange={e => setLoanAmount(e.target.value)} onBlur={() => save({
  loanAmount
})} placeholder="e.g. 10" style={fieldStyle} />
    </div>
    <div style={{
  width: "48%"
}}>
      <div style={labelStyle}>
        Bank / NBFC
      </div>
      <input value={bank} onChange={e => setBank(e.target.value)} onBlur={() => save({
  bank
})} placeholder="e.g. HDFC Bank" style={fieldStyle} />
    </div>
  </div>
  <div style={labelStyle}>
    Application Status
  </div>
  <DropdownChecklist options={FINANCE_STATUSES} selected={fin.status ? [fin.status] : []} onToggle={key => save({
  status: fin.status === key ? "" : key
})} multi={false} placeholder="Select status…" />
</div>;
  }

function PaymentDetailsForm({ value, onChange }) {
    const pd = value;
    const set = (patch) => onChange({ ...pd, ...patch });
    const setAddon = (id, patch) => set({ addons: pd.addons.map((a) => a.id === id ? { ...a, ...patch } : a) });
    const removeAddon = (id) => set({ addons: pd.addons.filter((a) => a.id !== id) });
    const addAddon = () => set({ addons: [...pd.addons, { id: genActivityId(), label: "", amount: "" }] });
    const fieldStyle = { width: "100%", border: `1px solid ${C.borderStrong}`, borderRadius: 8, padding: "7px 9px", fontFamily: F, fontSize: 12, color: C.ink, background: C.card, outline: "none", boxSizing: "border-box" };
    const labelStyle = { fontFamily: F, fontSize: 10, color: C.sub, marginBottom: 4 };
    return <div style={{
  background: C.bg,
  border: `1px solid ${C.border}`,
  borderRadius: 10,
  padding: 12
}}>
  <div style={{
  fontFamily: F,
  fontSize: 10.5,
  fontWeight: 700,
  color: C.sub,
  textTransform: "uppercase",
  letterSpacing: 0.4,
  marginBottom: 8
}}>
    Payment Breakdown
  </div>
  <div style={{
  display: "flex",
  gap: 8,
  marginBottom: 8
}}>
    <div style={{
  flex: 1
}}>
      <div style={labelStyle}>
        Finance Amount (₹)
      </div>
      <input type="number" min="0" value={pd.financeAmount} onChange={e => set({
  financeAmount: e.target.value
})} placeholder="0" style={fieldStyle} />
    </div>
    <div style={{
  flex: 1
}}>
      <div style={labelStyle}>
        Cash (₹)
      </div>
      <input type="number" min="0" value={pd.cashAmount} onChange={e => set({
  cashAmount: e.target.value
})} placeholder="0" style={fieldStyle} />
    </div>
  </div>
  <div style={{
  display: "flex",
  gap: 8,
  marginBottom: 10
}}>
    <div style={{
  flex: 1
}}>
      <div style={labelStyle}>
        Finance Company
      </div>
      <input value={pd.financeCompany} onChange={e => set({
  financeCompany: e.target.value
})} placeholder="e.g. HDFC Bank" style={fieldStyle} />
    </div>
    <div style={{
  width: 70
}}>
      <div style={labelStyle}>
        ROI (%)
      </div>
      <input type="number" min="0" step="0.1" value={pd.roi} onChange={e => set({
  roi: e.target.value
})} placeholder="9.5" style={fieldStyle} />
    </div>
    <div style={{
  width: 90
}}>
      <div style={labelStyle}>
        Tenure (mo)
      </div>
      <input type="number" min="0" value={pd.loanTenure} onChange={e => set({
  loanTenure: e.target.value
})} placeholder="60" style={fieldStyle} />
    </div>
  </div>
  <div style={{
  background: C.primarySoft,
  borderRadius: 8,
  padding: "8px 10px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 12
}}>
    <span style={{
  fontFamily: F,
  fontSize: 11,
  fontWeight: 700,
  color: C.primaryDark
}}>
      Total Payment
    </span>
    <span style={{
  fontFamily: F,
  fontSize: 14,
  fontWeight: 800,
  color: C.ink
}}>
      {formatINR(paymentDetailsTotal(pd))}
    </span>
  </div>
  <button onClick={() => set({
  dealerInsurance: !pd.dealerInsurance
})} style={{
  display: "flex",
  alignItems: "center",
  gap: 8,
  width: "100%",
  background: "none",
  border: "none",
  cursor: "pointer",
  padding: 0,
  marginBottom: pd.dealerInsurance ? 8 : 12
}}>
    {pd.dealerInsurance ? <CheckSquare size={15} color={C.primary} /> : <Square size={15} color={C.ghost} />}
    <span style={{
  fontFamily: F,
  fontSize: 11.5,
  fontWeight: 700,
  color: C.ink
}}>
      Dealer Insurance
    </span>
  </button>
  {pd.dealerInsurance && <div style={{
  display: "flex",
  gap: 8,
  marginBottom: 12
}}>
  <div style={{
  flex: 1
}}>
    <div style={labelStyle}>
      Insurance Amount (₹)
    </div>
    <input type="number" min="0" value={pd.insuranceAmount} onChange={e => set({
  insuranceAmount: e.target.value
})} placeholder="0" style={fieldStyle} />
  </div>
  <div style={{
  flex: 1
}}>
    <div style={labelStyle}>
      Insurance Company
    </div>
    <input value={pd.insuranceCompany} onChange={e => set({
  insuranceCompany: e.target.value
})} placeholder="e.g. ICICI Lombard" style={fieldStyle} />
  </div>
</div>}
  <div style={{
  display: "flex",
  gap: 8,
  marginBottom: 10
}}>
    <div style={{
  flex: 1
}}>
      <div style={labelStyle}>
        Extended Warranty (₹)
      </div>
      <input type="number" min="0" value={pd.extendedWarranty} onChange={e => set({
  extendedWarranty: e.target.value
})} placeholder="0" style={fieldStyle} />
    </div>
    <div style={{
  flex: 1
}}>
      <div style={labelStyle}>
        Care Package (₹)
      </div>
      <input type="number" min="0" value={pd.carePackage} onChange={e => set({
  carePackage: e.target.value
})} placeholder="0" style={fieldStyle} />
    </div>
  </div>
  <div style={labelStyle}>
    Add-ons
  </div>
  <div style={{
  background: C.card,
  border: `1px solid ${C.border}`,
  borderRadius: 9,
  padding: 8,
  marginBottom: 10
}}>
    {pd.addons.map((a, i) => <div style={{
  display: "flex",
  gap: 6,
  alignItems: "center",
  paddingBottom: 8,
  marginBottom: 8,
  borderBottom: `1px solid ${C.border}`
}} key={a.id}>
  <input value={a.label} onChange={e => setAddon(a.id, {
  label: e.target.value
})} placeholder="Add-on name" style={{
  ...fieldStyle,
  flex: 2,
  background: C.bg
}} />
  <input type="number" min="0" value={a.amount} onChange={e => setAddon(a.id, {
  amount: e.target.value
})} placeholder="₹" style={{
  ...fieldStyle,
  flex: 1,
  background: C.bg
}} />
  <button onClick={() => removeAddon(a.id)} style={{
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 26,
  height: 26,
  borderRadius: 999,
  background: C.hotSoft,
  border: "none",
  cursor: "pointer",
  flexShrink: 0,
  padding: 0
}}>
    <X size={13} color={C.hot} />
  </button>
</div>)}
    <button onClick={addAddon} style={{
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 7,
  width: "100%",
  background: C.primarySoft,
  border: `1.5px dashed ${C.primary}66`,
  borderRadius: 8,
  padding: "8px 0",
  cursor: "pointer"
}}>
      <div style={{
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 17,
  height: 17,
  borderRadius: 999,
  background: C.primary,
  flexShrink: 0
}}>
        <Plus size={11} color="#fff" strokeWidth={3} />
      </div>
      <span style={{
  fontFamily: F,
  fontSize: 11.5,
  fontWeight: 700,
  color: C.primary
}}>
        Add another add-on
      </span>
    </button>
  </div>
  <div style={labelStyle}>
    Accessories Amount (₹)
  </div>
  <input type="number" min="0" value={pd.accessoriesAmount} onChange={e => set({
  accessoriesAmount: e.target.value
})} placeholder="0" style={fieldStyle} />
</div>;
  }

function LeadStatusRow({ lead, onOpenTab }) {
    const tracks = [
      { key: "exchange", label: "Exchange", status: exchangeTrackStatus(lead) },
      { key: "finance", label: "Finance", status: financeTrackStatus(lead) }
    ].filter((t) => t.status !== null);
    const trackKeys = new Set(tracks.map((t) => t.key));
    const signalsToShow = lead.signals.filter((s) => !(s === "exchange" && trackKeys.has("exchange")) && !(s === "finance_needed" && trackKeys.has("finance")));
    return <div style={{
  display: "flex",
  gap: 6,
  flexWrap: "wrap"
}}>
  {!lead.assignedSE && <Pill label={lead.source} color={SOURCE_COLOR[lead.source] || C.cold} soft={(SOURCE_COLOR[lead.source] || C.cold) + "18"} />}
  <div style={{
  display: "flex",
  alignItems: "center",
  background: C.primarySoft,
  border: `1px solid ${C.primary}35`,
  borderRadius: 6,
  padding: "3px 8px"
}}>
    <span style={{
  fontFamily: F,
  fontSize: 10.5,
  fontWeight: 700,
  color: C.primary
}}>
      {stageStatusLabel(lead)}
    </span>
  </div>
  {tracks.map(t => {
  const meta = TRACK_STATUS_META[t.status] || TRACK_STATUS_META.pending;
  return <button onClick={() => onOpenTab && onOpenTab(t.key)} style={{
  display: "flex",
  alignItems: "center",
  gap: 4,
  background: meta.soft,
  border: `1px solid ${meta.color}35`,
  borderRadius: 6,
  padding: "3px 8px",
  cursor: onOpenTab ? "pointer" : "default"
}} key={t.key}>
  <span style={{
  fontFamily: F,
  fontSize: 10.5,
  fontWeight: 700,
  color: C.ink
}}>
    {t.label}
  </span>
  <span style={{
  fontFamily: F,
  fontSize: 9,
  fontWeight: 700,
  color: meta.color,
  textTransform: "uppercase",
  letterSpacing: 0.2
}}>
    {meta.label}
  </span>
</button>;
})}
  {signalsToShow.map(s => <Pill label={(SIGNAL_META[s]||{}).label} color={(SIGNAL_META[s]||{}).color} soft={(SIGNAL_META[s]||{}).soft} key={s} />)}
  {lead.commPref && (() => {
  const cp = commPrefMeta(lead.commPref);
  return <span style={{
  display: "inline-flex",
  alignItems: "center",
  gap: 3,
  background: C.ink,
  borderRadius: 6,
  padding: "3px 8px"
}}>
  <cp.Icon size={9} color="#fff" />
  <span style={{
  fontFamily: F,
  fontSize: 10,
  fontWeight: 700,
  color: "#fff"
}}>
    {cp.label}
  </span>
</span>;
})()}
</div>;
  }

function QualificationCallForm({ lead, onSave, onCancel, channel, allLeads, showToast }) {
    const [disposition, setDisposition] = useState("");
    const [signals, setSignals] = useState(() => [...lead.signals]);
    // Detail panels start collapsed — ticking a signal flags it; filling in the detail is
    // a separate, optional step the rep opts into.
    const [noteRecording, setNoteRecording] = useState(null);
    const [exchangeOpen, setExchangeOpen] = useState(false);
    const [financeOpen, setFinanceOpen] = useState(false);
    const [exchangeModel, setExchangeModel] = useState(() => lead.exchange?.model || "");
    const [exchangeVariant, setExchangeVariant] = useState(() => lead.exchange?.variant || "");
    const [exchangeYear, setExchangeYear] = useState(() => lead.exchange?.year || "");
    const [exchangeOdometer, setExchangeOdometer] = useState(() => lead.exchange?.odometer || "");
    const [exchangeCondition, setExchangeCondition] = useState(() => lead.exchange?.condition || "");
    const [exchangeRegisteredCity, setExchangeRegisteredCity] = useState(() => lead.exchange?.registeredCity || "");
    const [exchangeOwnership, setExchangeOwnership] = useState(() => lead.exchange?.ownership || "");
    const [financeLoanAmount, setFinanceLoanAmount] = useState(() => lead.finance?.loanAmount || "");
    const [financeBank, setFinanceBank] = useState(() => lead.finance?.bank || "");
    const [financeStatus, setFinanceStatus] = useState(() => lead.finance?.status || "");
    const [exchangeAccepted, setExchangeAccepted] = useState(() => lead.exchange?.customerAccepted || "");
    const [exchangeAppraisalScheduled, setExchangeAppraisalScheduled] = useState(() => !!lead.exchange?.appraisalScheduled);
    const [exchangeDeclineReason, setExchangeDeclineReason] = useState(() => lead.exchange?.declineReason || "");
    const [financeAccepted, setFinanceAccepted] = useState(() => lead.finance?.customerAccepted || "");
    const [financeDeclineReason, setFinanceDeclineReason] = useState(() => lead.finance?.declineReason || "");
    const [decision, setDecision] = useState("");
    const [assignSE, setAssignSE] = useState(null);
    const [testDriveMode, setTestDriveMode] = useState("");
    const [testDriveDLVia, setTestDriveDLVia] = useState(null);
    const [testDriveDate, setTestDriveDate] = useState("");
    const [testDriveSlot, setTestDriveSlot] = useState("");
    const [testDriveLocation, setTestDriveLocation] = useState("");
    const [reason, setReason] = useState("");
    const [note, setNote] = useState("");
    const [preferredTime, setPreferredTime] = useState("");
    const [followUpDate, setFollowUpDate] = useState("");
    const toggleSignal = (key) => setSignals((s) => s.includes(key) ? s.filter((x) => x !== key) : [...s, key]);
    const needsDetail = disposition === "connected" || channel === "whatsapp";
    const isRepeatWrongNumber = disposition === "wrong_number" && hasPriorDisposition(lead, "wrong_number");
    const needsSE = decision === "test_drive" || decision === "discount";
    const decisionOk = needsSE ? decision !== "test_drive" || testDriveMode && testDriveDate && testDriveSlot && (testDriveMode !== "location" || testDriveLocation.trim()) : decision === "close" ? !!reason : !!decision;
    const canSubmit = channel === "whatsapp" ? decisionOk : disposition && (disposition !== "connected" || decisionOk);
    const [attempted, setAttempted] = useState(false);
    return <div style={{
  background: C.bg,
  border: `1px solid ${C.borderStrong}`,
  borderRadius: 14,
  padding: 14,
  marginTop: 10
}}>
  <div style={{
  display: "flex",
  alignItems: "center",
  gap: 6,
  marginBottom: 12
}}>
    <span style={{
  fontFamily: F,
  fontSize: 11.5,
  color: C.primary,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: 0.5
}}>
      Qualifying Call
    </span>
  </div>
  {channel !== "whatsapp" && <>
  <div style={{
  fontFamily: F,
  fontSize: 11,
  fontWeight: 700,
  color: C.sub,
  textTransform: "uppercase",
  letterSpacing: 0.6,
  marginBottom: 10
}}>
    Outcome
  </div>
  <div style={{
  display: "flex",
  flexWrap: "wrap",
  gap: 6,
  marginBottom: 14
}}>
    {DISPOSITIONS.map(o => <button onClick={() => setDisposition(o.key)} style={{
  padding: "6px 12px",
  borderRadius: 8,
  border: `1.5px solid ${disposition === o.key ? C.primary : C.borderStrong}`,
  background: disposition === o.key ? C.primarySoft : C.card,
  color: disposition === o.key ? C.primary : C.sub,
  fontFamily: F,
  fontWeight: 700,
  fontSize: 12,
  cursor: "pointer"
}} key={o.key}>
  {o.label}
</button>)}
  </div>
</>}
  {needsDetail && <>
  <div style={{
  fontFamily: F,
  fontSize: 11,
  fontWeight: 700,
  color: C.sub,
  textTransform: "uppercase",
  letterSpacing: 0.6,
  marginBottom: 10
}}>
    Signals
  </div>
  <div style={{
  display: "flex",
  flexWrap: "wrap",
  gap: 6,
  marginBottom: 14
}}>
    {Object.entries(SIGNAL_META).map(([key, meta]) => {
  const on = signals.includes(key);
  return <button onClick={() => toggleSignal(key)} style={{
  padding: "6px 11px",
  borderRadius: 8,
  border: `1.5px solid ${on ? meta.color : C.borderStrong}`,
  background: on ? meta.soft : C.card,
  color: on ? meta.color : C.sub,
  fontFamily: F,
  fontWeight: 700,
  fontSize: 11.5,
  cursor: "pointer"
}} key={key}>
  {meta.label}
</button>;
})}
  </div>
  {signals.includes("exchange") && <ExpandRow
    label="Exchange Vehicle Details"
    accent={C.teal}
    open={exchangeOpen}
    onToggle={() => setExchangeOpen(o => !o)}
    hasData={!!(exchangeModel || exchangeVariant || exchangeYear || exchangeOdometer || exchangeCondition)}
  />}
  {signals.includes("exchange") && exchangeOpen && <div style={{
  background: C.card,
  border: `1.5px solid ${C.teal}55`,
  borderRadius: 10,
  padding: 12,
  marginBottom: 14
}}>
  <div style={{
  fontFamily: F,
  fontSize: 11,
  fontWeight: 700,
  color: C.teal,
  marginBottom: 3
}}>
    Exchange Vehicle Details
  </div>
  <div style={{
  fontFamily: F,
  fontSize: 10.5,
  color: C.sub,
  marginBottom: 10,
  lineHeight: 1.4
}}>
    All optional — add what you know now, update later.
  </div>
  <div style={{
  display: "flex",
  flexWrap: "wrap",
  gap: "8px 4%",
  marginBottom: 10
}}>
    <div style={{
  width: "48%"
}}>
      <div style={{
  fontFamily: F,
  fontSize: 10,
  color: C.sub,
  marginBottom: 4
}}>
        Car Model
      </div>
      <input value={exchangeModel} onChange={e => setExchangeModel(e.target.value)} placeholder="e.g. Maruti Swift" style={{
  width: "100%",
  border: `1px solid ${C.borderStrong}`,
  borderRadius: 8,
  padding: "7px 9px",
  fontFamily: F,
  fontSize: 12,
  color: C.ink,
  background: C.bg,
  outline: "none",
  boxSizing: "border-box"
}} />
    </div>
    <div style={{
  width: "48%"
}}>
      <div style={{
  fontFamily: F,
  fontSize: 10,
  color: C.sub,
  marginBottom: 4
}}>
        Variant
      </div>
      <input value={exchangeVariant} onChange={e => setExchangeVariant(e.target.value)} placeholder="e.g. VXI" style={{
  width: "100%",
  border: `1px solid ${C.borderStrong}`,
  borderRadius: 8,
  padding: "7px 9px",
  fontFamily: F,
  fontSize: 12,
  color: C.ink,
  background: C.bg,
  outline: "none",
  boxSizing: "border-box"
}} />
    </div>
    <div style={{
  width: "48%"
}}>
      <div style={{
  fontFamily: F,
  fontSize: 10,
  color: C.sub,
  marginBottom: 4
}}>
        Year
      </div>
      <input value={exchangeYear} onChange={e => setExchangeYear(e.target.value)} placeholder="e.g. 2018" style={{
  width: "100%",
  border: `1px solid ${C.borderStrong}`,
  borderRadius: 8,
  padding: "7px 9px",
  fontFamily: F,
  fontSize: 12,
  color: C.ink,
  background: C.bg,
  outline: "none",
  boxSizing: "border-box"
}} />
    </div>
    <div style={{
  width: "48%"
}}>
      <div style={{
  fontFamily: F,
  fontSize: 10,
  color: C.sub,
  marginBottom: 4
}}>
        Odometer (km)
      </div>
      <input value={exchangeOdometer} onChange={e => setExchangeOdometer(e.target.value)} placeholder="e.g. 48000" style={{
  width: "100%",
  border: `1px solid ${C.borderStrong}`,
  borderRadius: 8,
  padding: "7px 9px",
  fontFamily: F,
  fontSize: 12,
  color: C.ink,
  background: C.bg,
  outline: "none",
  boxSizing: "border-box"
}} />
    </div>
  </div>
  <div style={{
  fontFamily: F,
  fontSize: 10,
  color: C.sub,
  marginBottom: 6
}}>
    Condition (as described by customer)
  </div>
  <DropdownChecklist options={EXCHANGE_CONDITIONS} selected={exchangeCondition ? [exchangeCondition] : []} onToggle={key => setExchangeCondition(c => c === key ? "" : key)} multi={false} placeholder="Select condition…" />
  <div style={{
  fontFamily: F,
  fontSize: 10,
  color: C.sub,
  margin: "10px 0 4px"
}}>
    Registered City
  </div>
  <input value={exchangeRegisteredCity} onChange={e => setExchangeRegisteredCity(e.target.value)} placeholder="e.g. Bengaluru" style={{
  width: "100%",
  border: `1px solid ${C.borderStrong}`,
  borderRadius: 8,
  padding: "7px 9px",
  fontFamily: F,
  fontSize: 12,
  color: C.ink,
  background: C.bg,
  outline: "none",
  boxSizing: "border-box"
}} />
  <div style={{
  fontFamily: F,
  fontSize: 10,
  color: C.sub,
  margin: "10px 0 6px"
}}>
    Ownership
  </div>
  <DropdownChecklist options={OWNERSHIP_OPTIONS} selected={exchangeOwnership ? [exchangeOwnership] : []} onToggle={key => setExchangeOwnership(o => o === key ? "" : key)} multi={false} placeholder="Select ownership…" />
  {(() => {
  const range = exchangeRange(exchangeYear, exchangeOdometer, exchangeCondition, exchangeOwnership);
  return range ? <div style={{
  marginTop: 10,
  background: C.tealSoft,
  borderRadius: 9,
  padding: "9px 11px"
}}>
  <div style={{
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center"
}}>
    <span style={{
  fontFamily: F,
  fontSize: 10.5,
  color: C.teal,
  fontWeight: 700
}}>
      System Estimate
    </span>
    <span style={{
  fontFamily: F,
  fontSize: 13,
  fontWeight: 800,
  color: C.ink
}}>
      {range.low === range.high ? `\u20B9${range.low} L` : `\u20B9${range.low}\u2013${range.high} L`}
    </span>
  </div>
  <div style={{
  fontFamily: F,
  fontSize: 9.5,
  color: C.sub,
  marginTop: 2
}}>
    Final value confirmed by an evaluator after physical inspection.
  </div>
</div> : null;
})()}
  <div style={{
  marginTop: 10,
  background: lead.exchange?.appraisedValue ? C.greenSoft : "#FFFBEB",
  borderRadius: 9,
  padding: "9px 11px"
}}>
    {lead.exchange?.appraisedValue ? <>
  <div style={{
  display: "flex",
  alignItems: "center",
  gap: 5
}}>
    <CheckCircle2 size={12} color={C.green} />
    <span style={{
  fontFamily: F,
  fontSize: 10,
  fontWeight: 800,
  color: C.green,
  letterSpacing: 0.3
}}>
      FINAL VALUE · EVALUATOR CONFIRMED
    </span>
  </div>
  <div style={{
  fontFamily: F,
  fontWeight: 800,
  fontSize: 16,
  color: C.ink,
  marginTop: 4
}}>
    ₹
    {lead.exchange.appraisedValue}
     L
  </div>
  <div style={{
  fontFamily: F,
  fontSize: 10,
  color: C.sub,
  marginTop: 3
}}>
    This is the value used for the deal — it supersedes the system estimate above.
  </div>
</> : exchangeAppraisalScheduled ? <>
  <div style={{
  display: "flex",
  alignItems: "center",
  gap: 5
}}>
    <Clock size={12} color={C.warm} />
    <span style={{
  fontFamily: F,
  fontSize: 11,
  fontWeight: 700,
  color: C.warm
}}>
      Evaluator visit scheduled
    </span>
  </div>
  <div style={{
  fontFamily: F,
  fontSize: 10,
  color: C.sub,
  marginTop: 3
}}>
    Final value will be confirmed in ~2 days, after inspection.
  </div>
</> : <>
  <div style={{
  display: "flex",
  alignItems: "center",
  gap: 5
}}>
    <Clock size={12} color={C.warm} />
    <span style={{
  fontFamily: F,
  fontSize: 11,
  fontWeight: 700,
  color: C.warm
}}>
      Pending evaluator visit
    </span>
  </div>
  <div style={{
  fontFamily: F,
  fontSize: 10,
  color: C.sub,
  marginTop: 3
}}>
    The final value is only confirmed after physical inspection by an evaluator.
  </div>
  <button onClick={() => setExchangeAppraisalScheduled(true)} style={{
  marginTop: 9,
  width: "100%",
  padding: "8px 0",
  borderRadius: 9,
  border: "none",
  background: C.primary,
  color: "#fff",
  fontFamily: F,
  fontWeight: 700,
  fontSize: 11.5,
  cursor: "pointer"
}}>
    Schedule Evaluator Visit
  </button>
</>}
  </div>
</div>}
  {signals.includes("exchange") && !lead.exchange?.appraisedValue && exchangeRange(exchangeYear, exchangeOdometer, exchangeCondition, exchangeOwnership) && <div style={{
  fontFamily: F,
  fontSize: 10.5,
  color: C.sub,
  marginBottom: 14,
  fontStyle: "italic"
}}>
  Acceptance can be logged once the evaluator confirms a final value.
</div>}
  {signals.includes("exchange") && lead.exchange?.appraisedValue && <div style={{
  background: C.card,
  border: `1.5px solid ${C.borderStrong}`,
  borderRadius: 9,
  padding: 11,
  marginBottom: 14
}}>
  <div style={{
  fontFamily: F,
  fontSize: 11.5,
  fontWeight: 700,
  color: C.ink,
  marginBottom: 8
}}>
    Did the customer accept the value?
  </div>
  <div style={{
  display: "flex",
  gap: 8
}}>
    <button onClick={() => setExchangeAccepted("yes")} style={{
  flex: 1,
  padding: "8px 0",
  borderRadius: 8,
  border: `1.5px solid ${exchangeAccepted === "yes" ? C.green : C.borderStrong}`,
  background: exchangeAccepted === "yes" ? C.greenSoft : C.bg,
  color: exchangeAccepted === "yes" ? C.green : C.sub,
  fontFamily: F,
  fontWeight: 700,
  fontSize: 12,
  cursor: "pointer"
}}>
      Yes
    </button>
    <button onClick={() => setExchangeAccepted("no")} style={{
  flex: 1,
  padding: "8px 0",
  borderRadius: 8,
  border: `1.5px solid ${exchangeAccepted === "no" ? C.hot : C.borderStrong}`,
  background: exchangeAccepted === "no" ? C.hotSoft : C.bg,
  color: exchangeAccepted === "no" ? C.hot : C.sub,
  fontFamily: F,
  fontWeight: 700,
  fontSize: 12,
  cursor: "pointer"
}}>
      No
    </button>
  </div>
  {exchangeAccepted === "no" && <div style={{
  marginTop: 10
}}>
  <div style={{
  fontFamily: F,
  fontSize: 10,
  color: C.sub,
  marginBottom: 6
}}>
    Why not?
  </div>
  <DropdownChecklist options={EXCHANGE_DECLINE_REASONS.map(r => ({
  key: r,
  label: r
}))} selected={exchangeDeclineReason ? [exchangeDeclineReason] : []} onToggle={key => setExchangeDeclineReason(r => r === key ? "" : key)} multi={false} placeholder="Select a reason…" />
</div>}
</div>}
  {signals.includes("finance_needed") && <ExpandRow
    label="Finance Details"
    accent={C.cold}
    open={financeOpen}
    onToggle={() => setFinanceOpen(o => !o)}
    hasData={!!(financeLoanAmount || financeBank || financeStatus)}
  />}
  {signals.includes("finance_needed") && financeOpen && <div style={{
  background: C.card,
  border: `1.5px solid ${C.teal}55`,
  borderRadius: 10,
  padding: 12,
  marginBottom: 14
}}>
  <div style={{
  fontFamily: F,
  fontSize: 11,
  fontWeight: 700,
  color: C.teal,
  marginBottom: 3
}}>
    Finance
  </div>
  <div style={{
  fontFamily: F,
  fontSize: 10.5,
  color: C.sub,
  marginBottom: 10,
  lineHeight: 1.4
}}>
    All optional — add what you know now, update later.
  </div>
  <div style={{
  display: "flex",
  flexWrap: "wrap",
  gap: "8px 4%",
  marginBottom: 10
}}>
    <div style={{
  width: "48%"
}}>
      <div style={{
  fontFamily: F,
  fontSize: 10,
  color: C.sub,
  marginBottom: 4
}}>
        Loan Amount (₹ L)
      </div>
      <input type="number" min="0" value={financeLoanAmount} onChange={e => setFinanceLoanAmount(e.target.value)} placeholder="e.g. 10" style={{
  width: "100%",
  border: `1px solid ${C.borderStrong}`,
  borderRadius: 8,
  padding: "7px 9px",
  fontFamily: F,
  fontSize: 12,
  color: C.ink,
  background: C.bg,
  outline: "none",
  boxSizing: "border-box"
}} />
    </div>
    <div style={{
  width: "48%"
}}>
      <div style={{
  fontFamily: F,
  fontSize: 10,
  color: C.sub,
  marginBottom: 4
}}>
        Bank / NBFC
      </div>
      <input value={financeBank} onChange={e => setFinanceBank(e.target.value)} placeholder="e.g. HDFC Bank" style={{
  width: "100%",
  border: `1px solid ${C.borderStrong}`,
  borderRadius: 8,
  padding: "7px 9px",
  fontFamily: F,
  fontSize: 12,
  color: C.ink,
  background: C.bg,
  outline: "none",
  boxSizing: "border-box"
}} />
    </div>
  </div>
  <div style={{
  fontFamily: F,
  fontSize: 10,
  color: C.sub,
  marginBottom: 6
}}>
    Application Status (if already applied)
  </div>
  <DropdownChecklist options={FINANCE_STATUSES} selected={financeStatus ? [financeStatus] : []} onToggle={key => setFinanceStatus(s => s === key ? "" : key)} multi={false} placeholder="Select status…" />
</div>}
  {signals.includes("finance_needed") && financeStatus === "approved" && <div style={{
  background: C.card,
  border: `1.5px solid ${C.borderStrong}`,
  borderRadius: 9,
  padding: 11,
  marginBottom: 14
}}>
  <div style={{
  fontFamily: F,
  fontSize: 11.5,
  fontWeight: 700,
  color: C.ink,
  marginBottom: 8
}}>
    Did the customer accept the terms?
  </div>
  <div style={{
  display: "flex",
  gap: 8
}}>
    <button onClick={() => setFinanceAccepted("yes")} style={{
  flex: 1,
  padding: "8px 0",
  borderRadius: 8,
  border: `1.5px solid ${financeAccepted === "yes" ? C.green : C.borderStrong}`,
  background: financeAccepted === "yes" ? C.greenSoft : C.bg,
  color: financeAccepted === "yes" ? C.green : C.sub,
  fontFamily: F,
  fontWeight: 700,
  fontSize: 12,
  cursor: "pointer"
}}>
      Yes
    </button>
    <button onClick={() => setFinanceAccepted("no")} style={{
  flex: 1,
  padding: "8px 0",
  borderRadius: 8,
  border: `1.5px solid ${financeAccepted === "no" ? C.hot : C.borderStrong}`,
  background: financeAccepted === "no" ? C.hotSoft : C.bg,
  color: financeAccepted === "no" ? C.hot : C.sub,
  fontFamily: F,
  fontWeight: 700,
  fontSize: 12,
  cursor: "pointer"
}}>
      No
    </button>
  </div>
  {financeAccepted === "no" && <div style={{
  marginTop: 10
}}>
  <div style={{
  fontFamily: F,
  fontSize: 10,
  color: C.sub,
  marginBottom: 6
}}>
    Why not?
  </div>
  <DropdownChecklist options={FINANCE_DECLINE_REASONS.map(r => ({
  key: r,
  label: r
}))} selected={financeDeclineReason ? [financeDeclineReason] : []} onToggle={key => setFinanceDeclineReason(r => r === key ? "" : key)} multi={false} placeholder="Select a reason…" />
</div>}
</div>}
  <div style={{
  fontFamily: F,
  fontSize: 11,
  fontWeight: 700,
  color: C.sub,
  textTransform: "uppercase",
  letterSpacing: 0.6,
  marginBottom: 10,
  marginTop: 18,
  paddingTop: 16,
  borderTop: `1.5px solid ${C.borderStrong}`
}}>
    Decision
  </div>
  <div style={{
  marginBottom: 14
}}>
    {[["assign", "Qualified \u2014 assign to SE", CheckCircle2, C.green], ["test_drive", "Wants a test drive", Car, C.teal], ["discount", "Asked for a discount", Tag, C.warm], ["callback", "Keep qualifying \u2014 call back later", Clock, C.warm], ["close", "Not interested \u2014 close", X, C.hot]].map(([key, label, Icon, color]) => <button onClick={() => setDecision(key)} style={{
  display: "flex",
  alignItems: "center",
  gap: 8,
  width: "100%",
  background: decision === key ? color + "12" : C.card,
  border: `1.5px solid ${decision === key ? color : C.border}`,
  borderRadius: 10,
  padding: "9px 12px",
  marginBottom: 6,
  cursor: "pointer",
  textAlign: "left"
}} key={key}>
  <Icon size={14} color={decision === key ? color : C.ghost} />
  <span style={{
  fontFamily: F,
  fontSize: 12.5,
  fontWeight: 600,
  color: decision === key ? color : C.ink
}}>
    {label}
  </span>
</button>)}
  </div>
  {needsSE && (
    <div style={{ background: C.greenSoft, border: `1px solid ${C.green}55`, borderRadius: 10, padding: "10px 12px", marginTop: 4, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
      <CheckCircle2 size={14} color={C.green} />
      <span style={{ fontFamily: F, fontSize: 11.5, color: C.green, fontWeight: 700 }}>
        A Sales Executive is assigned automatically when you save.
      </span>
    </div>
  )}
  {decision === "test_drive" && <div style={{
  background: C.card,
  border: `1.5px solid ${C.teal}55`,
  borderRadius: 10,
  padding: 12,
  marginBottom: 14
}}>
  <div style={{
  fontFamily: F,
  fontSize: 11,
  fontWeight: 700,
  color: C.teal,
  marginBottom: 10
}}>
    Test Drive Details
  </div>
  <div style={{
  display: "flex",
  gap: 8,
  marginBottom: 10
}}>
    {TEST_DRIVE_MODES.map(m => <button onClick={() => {
  setTestDriveMode(m.key);
  setTestDriveSlot("");
}} style={{
  flex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  padding: "8px 0",
  borderRadius: 8,
  border: `1.5px solid ${testDriveMode === m.key ? C.teal : C.borderStrong}`,
  background: testDriveMode === m.key ? C.tealSoft : C.bg,
  color: testDriveMode === m.key ? C.teal : C.sub,
  fontFamily: F,
  fontWeight: 700,
  fontSize: 11.5,
  cursor: "pointer"
}} key={m.key}>
  <m.Icon size={12} />
  {m.label}
</button>)}
  </div>
  {testDriveMode === "location" && <input value={testDriveLocation} onChange={e => setTestDriveLocation(e.target.value)} placeholder="Pickup address" style={{
  width: "100%",
  border: `1px solid ${C.borderStrong}`,
  borderRadius: 8,
  padding: "8px 10px",
  fontFamily: F,
  fontSize: 12,
  color: C.ink,
  background: C.bg,
  outline: "none",
  boxSizing: "border-box",
  marginBottom: 10
}} />}
  <input type="date" value={testDriveDate} onChange={e => setTestDriveDate(e.target.value)} style={{
  width: "100%",
  minWidth: 0,
  border: `1px solid ${C.borderStrong}`,
  borderRadius: 8,
  padding: "8px 9px",
  fontFamily: F,
  fontSize: 12,
  color: C.ink,
  background: C.bg,
  outline: "none",
  boxSizing: "border-box",
  marginBottom: 10
}} />
  {testDriveMode && <>
  <div style={{
  fontFamily: F,
  fontSize: 10,
  color: C.sub,
  marginBottom: 6
}}>
    {testDriveMode === "location" ? "2-hour slots (travel buffer included)" : "1-hour slots"}
  </div>
  <TimeSlotPicker mode={testDriveMode} date={testDriveDate} slot={testDriveSlot} onChange={setTestDriveSlot} allLeads={allLeads} excludeLeadId={lead.id} />
</>}
  <DrivingLicenseRow done={!!testDriveDLVia} via={testDriveDLVia} onCollect={setTestDriveDLVia} onUndo={() => setTestDriveDLVia(null)} showToast={showToast} customerName={lead.name} />
</div>}
  {decision === "callback" && <div style={{
  background: C.card,
  border: `1.5px solid ${C.warm}55`,
  borderRadius: 10,
  padding: 12,
  marginBottom: 14
}}>
  <div style={{
  fontFamily: F,
  fontSize: 11,
  fontWeight: 700,
  color: C.warm,
  marginBottom: 10
}}>
    When to call back
  </div>
  <CallbackScheduler dateValue={followUpDate} onDateChange={setFollowUpDate} timeValue={preferredTime} onTimeChange={setPreferredTime} />
</div>}
  {decision === "close" && <div style={{
  background: C.card,
  border: `1.5px solid ${C.hot}55`,
  borderRadius: 10,
  padding: 12,
  marginBottom: 14
}}>
  <div style={{
  fontFamily: F,
  fontSize: 11,
  fontWeight: 700,
  color: C.hot,
  marginBottom: 10
}}>
    Why isn't this lead interested?
  </div>
  <DropdownChecklist options={NOT_INTERESTED_REASONS.map(r => ({
  key: r,
  label: r
}))} selected={reason ? [reason] : []} onToggle={key => setReason(r => r === key ? "" : key)} multi={false} placeholder="Select a reason…" />
  {!reason && <div style={{
  fontFamily: F,
  fontSize: 11,
  color: C.hot,
  marginTop: 8
}}>
  Pick a reason before you can save.
</div>}
</div>}
</>}
  {channel !== "whatsapp" && disposition && disposition !== "connected" && <div style={{
  marginBottom: 14
}}>
  {disposition === "wrong_number" ? isRepeatWrongNumber ? <div style={{
  display: "flex",
  alignItems: "center",
  gap: 7,
  background: C.hotSoft,
  borderRadius: 9,
  padding: "9px 11px"
}}>
  <AlertTriangle size={13} color={C.hot} />
  <span style={{
  fontFamily: F,
  fontSize: 11.5,
  color: C.hot,
  fontWeight: 600
}}>
    Wrong number again — will mark lost on save.
  </span>
</div> : <div style={{
  background: C.bg,
  border: `1px solid ${C.borderStrong}`,
  borderRadius: 9,
  padding: "9px 11px",
  fontFamily: F,
  fontSize: 11.5,
  color: C.sub
}}>
  Retry auto-scheduled in 2 days.
</div> : <div style={{
  background: C.bg,
  border: `1px solid ${C.borderStrong}`,
  borderRadius: 9,
  padding: "9px 11px",
  fontFamily: F,
  fontSize: 11.5,
  color: C.sub
}}>
  Retry tomorrow (
  {nextSession(currentSession())}
  ).
  {lead.contacted + 1 >= 5 && !everConnected(lead) && <span style={{
  display: "block",
  marginTop: 4,
  color: C.hot,
  fontWeight: 600
}}>
  5th attempt, no contact — will mark lost on save.
</span>}
</div>}
</div>}
  <div style={{
  fontFamily: F,
  fontSize: 11,
  fontWeight: 700,
  color: C.sub,
  textTransform: "uppercase",
  letterSpacing: 0.6,
  marginBottom: 8,
  marginTop: 18,
  paddingTop: 16,
  borderTop: `1.5px solid ${C.borderStrong}`
}}>
    Notes
  </div>
  <VoiceNoteField value={note} onChange={setNote} recording={noteRecording} onRecordingChange={setNoteRecording} />
  <div style={{
  display: "flex",
  gap: 8
}}>
    <button onClick={onCancel} style={{
  flex: 1,
  padding: "10px 0",
  borderRadius: 10,
  border: `1.5px solid ${C.borderStrong}`,
  background: "none",
  fontFamily: F,
  fontWeight: 700,
  fontSize: 12.5,
  color: C.sub,
  cursor: "pointer"
}}>
      Cancel
    </button>
    <button onClick={() => {
  if (!canSubmit) {
    setAttempted(true);
    return;
  }
  onSave({
    disposition: disposition || "connected",
    signals,
    exchange: signals.includes("exchange") && (exchangeModel.trim() || exchangeVariant.trim() || exchangeYear.trim() || exchangeOdometer.trim() || exchangeCondition) ? {
      model: exchangeModel,
      variant: exchangeVariant,
      year: exchangeYear,
      odometer: exchangeOdometer,
      condition: exchangeCondition,
      registeredCity: exchangeRegisteredCity,
      ownership: exchangeOwnership,
      customerAccepted: exchangeAccepted,
      declineReason: exchangeDeclineReason,
      appraisalScheduled: exchangeAppraisalScheduled,
      appraisedValue: lead.exchange?.appraisedValue || null
    } : null,
    decision,
    assignSE,
    testDriveMode,
    testDriveDate,
    testDriveSlot,
    testDriveLocation,
    testDriveDLVia,
    reason,
    note,
    preferredTime,
    financeLoanAmount,
    financeBank,
    financeStatus,
    exchangeAccepted,
    exchangeDeclineReason,
    financeAccepted,
    financeDeclineReason,
    followUpDate: followUpDate ? new Date(followUpDate) : null
  });
}} style={{
  flex: 2,
  padding: "10px 0",
  borderRadius: 10,
  border: "none",
  background: canSubmit ? C.primary : C.ghost,
  color: canSubmit ? "#fff" : C.sub,
  fontFamily: F,
  fontWeight: 700,
  fontSize: 12.5,
  cursor: canSubmit ? "pointer" : "default"
}}>
      Save
    </button>
  </div>
</div>;
  }

function ReactivationCallForm({ lead, onSave, onCancel, channel, allLeads, showToast }) {
    const [disposition, setDisposition] = useState("");
    const [signals, setSignals] = useState(() => [...lead.signals]);
    // Detail panels start collapsed — ticking a signal flags it; filling in the detail is
    // a separate, optional step the rep opts into.
    const [noteRecording, setNoteRecording] = useState(null);
    const [exchangeOpen, setExchangeOpen] = useState(false);
    const [financeOpen, setFinanceOpen] = useState(false);
    const [exchangeModel, setExchangeModel] = useState(() => lead.exchange?.model || "");
    const [exchangeVariant, setExchangeVariant] = useState(() => lead.exchange?.variant || "");
    const [exchangeYear, setExchangeYear] = useState(() => lead.exchange?.year || "");
    const [exchangeOdometer, setExchangeOdometer] = useState(() => lead.exchange?.odometer || "");
    const [exchangeCondition, setExchangeCondition] = useState(() => lead.exchange?.condition || "");
    const [exchangeRegisteredCity, setExchangeRegisteredCity] = useState(() => lead.exchange?.registeredCity || "");
    const [exchangeOwnership, setExchangeOwnership] = useState(() => lead.exchange?.ownership || "");
    const [financeLoanAmount, setFinanceLoanAmount] = useState(() => lead.finance?.loanAmount || "");
    const [financeBank, setFinanceBank] = useState(() => lead.finance?.bank || "");
    const [financeStatus, setFinanceStatus] = useState(() => lead.finance?.status || "");
    const [exchangeAccepted, setExchangeAccepted] = useState(() => lead.exchange?.customerAccepted || "");
    const [exchangeAppraisalScheduled, setExchangeAppraisalScheduled] = useState(() => !!lead.exchange?.appraisalScheduled);
    const [exchangeDeclineReason, setExchangeDeclineReason] = useState(() => lead.exchange?.declineReason || "");
    const [financeAccepted, setFinanceAccepted] = useState(() => lead.finance?.customerAccepted || "");
    const [financeDeclineReason, setFinanceDeclineReason] = useState(() => lead.finance?.declineReason || "");
    const [decision, setDecision] = useState("");
    const [assignSE, setAssignSE] = useState(null);
    const [testDriveMode, setTestDriveMode] = useState("");
    const [testDriveDLVia, setTestDriveDLVia] = useState(null);
    const [testDriveDate, setTestDriveDate] = useState("");
    const [testDriveSlot, setTestDriveSlot] = useState("");
    const [testDriveLocation, setTestDriveLocation] = useState("");
    const [bookingAmount, setBookingAmount] = useState("");
    const [bookingIsFullPayment, setBookingIsFullPayment] = useState(false);
    const [bookingRetailDate, setBookingRetailDate] = useState(() => isoDate(new Date()));
    const [bookingPaymentDetails, setBookingPaymentDetails] = useState(() => defaultPaymentDetails());
    const initialModelInterest = lead.modelInterest && Object.keys(lead.modelInterest).length ? lead.modelInterest : parseModelString(lead.model);
    const [deliveryModel, setDeliveryModel] = useState(() => Object.keys(initialModelInterest)[0] || "");
    const [deliveryVariant, setDeliveryVariant] = useState(() => initialModelInterest[Object.keys(initialModelInterest)[0]]?.[0] || "");
    const [deliveryColor, setDeliveryColor] = useState(() => lead.colorInterest?.[0] || "");
    const [deliveryDate, setDeliveryDate] = useState(() => lead.targetDeliveryDate || "");
    const [paymentSource, setPaymentSource] = useState("");
    const [receiptNumber, setReceiptNumber] = useState("");
    const [reason, setReason] = useState("");
    const [note, setNote] = useState("");
    const [preferredTime, setPreferredTime] = useState("");
    const [followUpDate, setFollowUpDate] = useState("");
    const toggleSignal = (key) => setSignals((s) => s.includes(key) ? s.filter((x) => x !== key) : [...s, key]);
    const needsDetail = disposition === "connected" || channel === "whatsapp";
    const isRepeatWrongNumber = disposition === "wrong_number" && hasPriorDisposition(lead, "wrong_number");
    const effectiveSE = decision === "test_drive" || decision === "discount" ? lead.assignedSE || assignSE : assignSE;
    const needsSEPicker = decision === "reassign" || (decision === "test_drive" || decision === "discount") && !lead.assignedSE;
    const isBookingStage = lead.stage === "Booking";
    const isRetailedStage = lead.stage === "Retailed";
    const alreadyBooked = isBookingStage || isRetailedStage;
    const decisionOk = isRetailedStage ? decision === "delivery_confirmed" ? !!deliveryModel && !!deliveryVariant && !!deliveryDate : !!decision : isBookingStage ? decision === "cancelled" ? !!reason : !!decision : decision === "reassign" ? true : decision === "test_drive" ? testDriveMode && testDriveDate && testDriveSlot && (testDriveMode !== "location" || testDriveLocation.trim()) : decision === "discount" ? true : decision === "lost" ? !!reason : decision === "book" ? bookingIsFullPayment ? !!bookingRetailDate && paymentDetailsHasAmount(bookingPaymentDetails) : bookingAmount.trim() && paymentSource : !!decision;
    const canSubmit = channel === "whatsapp" ? decisionOk : disposition && (disposition !== "connected" || decisionOk);
    const [attempted, setAttempted] = useState(false);
    const cancellationPending = lead.cancellationRequest?.status === "pending_manager_approval";
    const decisionOptions = isRetailedStage ? [
      ["delivery_confirmed", "Delivery on track \u2014 confirmed with customer", CheckCircle2, C.green],
      ["needs_se_attention", "Customer has a query \u2014 send back to SE", UserPlus, C.cold],
      ["callback", "Customer busy \u2014 will call back", Clock, C.warm]
    ] : isBookingStage ? [
      ["proceeding", "Customer proceeding as planned", CheckCircle2, C.green],
      ["needs_se_attention", "Customer has a query \u2014 send back to SE", UserPlus, C.cold],
      ["callback", "Customer busy \u2014 will call back", Clock, C.warm],
      ["cancelled", "Customer wants to cancel \u2014 request cancellation", X, C.hot]
    ].filter(([key]) => key !== "cancelled" || !cancellationPending) : [
      ["book", "Ready to book!", CheckCircle2, C.green],
      ["reactivate_same", `Still interested \u2014 send back to ${lead.assignedSE?.name || "SE"}`, CheckCircle2, C.green],
      ["reassign", lead.assignedSE ? "Still interested \u2014 reassign to a different SE" : "Still interested \u2014 assign an SE", UserPlus, C.cold],
      ["test_drive", "Wants a test drive", Car, C.teal],
      ["discount", "Asked for a discount", Tag, C.warm],
      ["callback", "Interested but not ready \u2014 call back later", Clock, C.warm],
      ["lost", "Not interested \u2014 mark as lost", X, C.hot]
    ].filter(([key]) => (key !== "reactivate_same" || lead.assignedSE) && (key !== "book" || lead.assignedSE));
    return <div style={{
  background: C.bg,
  border: `1px solid ${C.borderStrong}`,
  borderRadius: 14,
  padding: 14,
  marginTop: 10
}}>
  <div style={{
  display: "flex",
  alignItems: "center",
  gap: 6,
  marginBottom: 12
}}>
    <span style={{
  fontFamily: F,
  fontSize: 11.5,
  color: C.hot,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: 0.5
}}>
      Reactivation Call
    </span>
  </div>
  {channel !== "whatsapp" && <>
  <div style={{
  fontFamily: F,
  fontSize: 11,
  fontWeight: 700,
  color: C.sub,
  textTransform: "uppercase",
  letterSpacing: 0.6,
  marginBottom: 10
}}>
    Outcome
  </div>
  <div style={{
  display: "flex",
  flexWrap: "wrap",
  gap: 6,
  marginBottom: 14
}}>
    {DISPOSITIONS.map(o => <button onClick={() => setDisposition(o.key)} style={{
  padding: "6px 12px",
  borderRadius: 8,
  border: `1.5px solid ${disposition === o.key ? C.primary : C.borderStrong}`,
  background: disposition === o.key ? C.primarySoft : C.card,
  color: disposition === o.key ? C.primary : C.sub,
  fontFamily: F,
  fontWeight: 700,
  fontSize: 12,
  cursor: "pointer"
}} key={o.key}>
  {o.label}
</button>)}
  </div>
</>}
  {needsDetail && <>
  <div style={{
  fontFamily: F,
  fontSize: 11,
  fontWeight: 700,
  color: C.sub,
  textTransform: "uppercase",
  letterSpacing: 0.6,
  marginBottom: 10
}}>
    Signals
  </div>
  <div style={{
  display: "flex",
  flexWrap: "wrap",
  gap: 6,
  marginBottom: 14
}}>
    {Object.entries(SIGNAL_META).map(([key, meta]) => {
  const on = signals.includes(key);
  return <button onClick={() => toggleSignal(key)} style={{
  padding: "6px 11px",
  borderRadius: 8,
  border: `1.5px solid ${on ? meta.color : C.borderStrong}`,
  background: on ? meta.soft : C.card,
  color: on ? meta.color : C.sub,
  fontFamily: F,
  fontWeight: 700,
  fontSize: 11.5,
  cursor: "pointer"
}} key={key}>
  {meta.label}
</button>;
})}
  </div>
  {signals.includes("exchange") && <ExpandRow
    label="Exchange Vehicle Details"
    accent={C.teal}
    open={exchangeOpen}
    onToggle={() => setExchangeOpen(o => !o)}
    hasData={!!(exchangeModel || exchangeVariant || exchangeYear || exchangeOdometer || exchangeCondition)}
  />}
  {signals.includes("exchange") && exchangeOpen && <div style={{
  background: C.card,
  border: `1.5px solid ${C.teal}55`,
  borderRadius: 10,
  padding: 12,
  marginBottom: 14
}}>
  <div style={{
  fontFamily: F,
  fontSize: 11,
  fontWeight: 700,
  color: C.teal,
  marginBottom: 3
}}>
    Exchange Vehicle Details
  </div>
  <div style={{
  fontFamily: F,
  fontSize: 10.5,
  color: C.sub,
  marginBottom: 10,
  lineHeight: 1.4
}}>
    All optional — add what you know now, update later.
  </div>
  <div style={{
  display: "flex",
  flexWrap: "wrap",
  gap: "8px 4%",
  marginBottom: 10
}}>
    <div style={{
  width: "48%"
}}>
      <div style={{
  fontFamily: F,
  fontSize: 10,
  color: C.sub,
  marginBottom: 4
}}>
        Car Model
      </div>
      <input value={exchangeModel} onChange={e => setExchangeModel(e.target.value)} placeholder="e.g. Maruti Swift" style={{
  width: "100%",
  border: `1px solid ${C.borderStrong}`,
  borderRadius: 8,
  padding: "7px 9px",
  fontFamily: F,
  fontSize: 12,
  color: C.ink,
  background: C.bg,
  outline: "none",
  boxSizing: "border-box"
}} />
    </div>
    <div style={{
  width: "48%"
}}>
      <div style={{
  fontFamily: F,
  fontSize: 10,
  color: C.sub,
  marginBottom: 4
}}>
        Variant
      </div>
      <input value={exchangeVariant} onChange={e => setExchangeVariant(e.target.value)} placeholder="e.g. VXI" style={{
  width: "100%",
  border: `1px solid ${C.borderStrong}`,
  borderRadius: 8,
  padding: "7px 9px",
  fontFamily: F,
  fontSize: 12,
  color: C.ink,
  background: C.bg,
  outline: "none",
  boxSizing: "border-box"
}} />
    </div>
    <div style={{
  width: "48%"
}}>
      <div style={{
  fontFamily: F,
  fontSize: 10,
  color: C.sub,
  marginBottom: 4
}}>
        Year
      </div>
      <input value={exchangeYear} onChange={e => setExchangeYear(e.target.value)} placeholder="e.g. 2018" style={{
  width: "100%",
  border: `1px solid ${C.borderStrong}`,
  borderRadius: 8,
  padding: "7px 9px",
  fontFamily: F,
  fontSize: 12,
  color: C.ink,
  background: C.bg,
  outline: "none",
  boxSizing: "border-box"
}} />
    </div>
    <div style={{
  width: "48%"
}}>
      <div style={{
  fontFamily: F,
  fontSize: 10,
  color: C.sub,
  marginBottom: 4
}}>
        Odometer (km)
      </div>
      <input value={exchangeOdometer} onChange={e => setExchangeOdometer(e.target.value)} placeholder="e.g. 48000" style={{
  width: "100%",
  border: `1px solid ${C.borderStrong}`,
  borderRadius: 8,
  padding: "7px 9px",
  fontFamily: F,
  fontSize: 12,
  color: C.ink,
  background: C.bg,
  outline: "none",
  boxSizing: "border-box"
}} />
    </div>
  </div>
  <div style={{
  fontFamily: F,
  fontSize: 10,
  color: C.sub,
  marginBottom: 6
}}>
    Condition (as described by customer)
  </div>
  <DropdownChecklist options={EXCHANGE_CONDITIONS} selected={exchangeCondition ? [exchangeCondition] : []} onToggle={key => setExchangeCondition(c => c === key ? "" : key)} multi={false} placeholder="Select condition…" />
  <div style={{
  fontFamily: F,
  fontSize: 10,
  color: C.sub,
  margin: "10px 0 4px"
}}>
    Registered City
  </div>
  <input value={exchangeRegisteredCity} onChange={e => setExchangeRegisteredCity(e.target.value)} placeholder="e.g. Bengaluru" style={{
  width: "100%",
  border: `1px solid ${C.borderStrong}`,
  borderRadius: 8,
  padding: "7px 9px",
  fontFamily: F,
  fontSize: 12,
  color: C.ink,
  background: C.bg,
  outline: "none",
  boxSizing: "border-box"
}} />
  <div style={{
  fontFamily: F,
  fontSize: 10,
  color: C.sub,
  margin: "10px 0 6px"
}}>
    Ownership
  </div>
  <DropdownChecklist options={OWNERSHIP_OPTIONS} selected={exchangeOwnership ? [exchangeOwnership] : []} onToggle={key => setExchangeOwnership(o => o === key ? "" : key)} multi={false} placeholder="Select ownership…" />
  {(() => {
  const range = exchangeRange(exchangeYear, exchangeOdometer, exchangeCondition, exchangeOwnership);
  return range ? <div style={{
  marginTop: 10,
  background: C.tealSoft,
  borderRadius: 9,
  padding: "9px 11px"
}}>
  <div style={{
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center"
}}>
    <span style={{
  fontFamily: F,
  fontSize: 10.5,
  color: C.teal,
  fontWeight: 700
}}>
      System Estimate
    </span>
    <span style={{
  fontFamily: F,
  fontSize: 13,
  fontWeight: 800,
  color: C.ink
}}>
      {range.low === range.high ? `\u20B9${range.low} L` : `\u20B9${range.low}\u2013${range.high} L`}
    </span>
  </div>
  <div style={{
  fontFamily: F,
  fontSize: 9.5,
  color: C.sub,
  marginTop: 2
}}>
    Final value confirmed by an evaluator after physical inspection.
  </div>
</div> : null;
})()}
  <div style={{
  marginTop: 10,
  background: lead.exchange?.appraisedValue ? C.greenSoft : "#FFFBEB",
  borderRadius: 9,
  padding: "9px 11px"
}}>
    {lead.exchange?.appraisedValue ? <>
  <div style={{
  display: "flex",
  alignItems: "center",
  gap: 5
}}>
    <CheckCircle2 size={12} color={C.green} />
    <span style={{
  fontFamily: F,
  fontSize: 10,
  fontWeight: 800,
  color: C.green,
  letterSpacing: 0.3
}}>
      FINAL VALUE · EVALUATOR CONFIRMED
    </span>
  </div>
  <div style={{
  fontFamily: F,
  fontWeight: 800,
  fontSize: 16,
  color: C.ink,
  marginTop: 4
}}>
    ₹
    {lead.exchange.appraisedValue}
     L
  </div>
  <div style={{
  fontFamily: F,
  fontSize: 10,
  color: C.sub,
  marginTop: 3
}}>
    This is the value used for the deal — it supersedes the system estimate above.
  </div>
</> : exchangeAppraisalScheduled ? <>
  <div style={{
  display: "flex",
  alignItems: "center",
  gap: 5
}}>
    <Clock size={12} color={C.warm} />
    <span style={{
  fontFamily: F,
  fontSize: 11,
  fontWeight: 700,
  color: C.warm
}}>
      Evaluator visit scheduled
    </span>
  </div>
  <div style={{
  fontFamily: F,
  fontSize: 10,
  color: C.sub,
  marginTop: 3
}}>
    Final value will be confirmed in ~2 days, after inspection.
  </div>
</> : <>
  <div style={{
  display: "flex",
  alignItems: "center",
  gap: 5
}}>
    <Clock size={12} color={C.warm} />
    <span style={{
  fontFamily: F,
  fontSize: 11,
  fontWeight: 700,
  color: C.warm
}}>
      Pending evaluator visit
    </span>
  </div>
  <div style={{
  fontFamily: F,
  fontSize: 10,
  color: C.sub,
  marginTop: 3
}}>
    The final value is only confirmed after physical inspection by an evaluator.
  </div>
  <button onClick={() => setExchangeAppraisalScheduled(true)} style={{
  marginTop: 9,
  width: "100%",
  padding: "8px 0",
  borderRadius: 9,
  border: "none",
  background: C.primary,
  color: "#fff",
  fontFamily: F,
  fontWeight: 700,
  fontSize: 11.5,
  cursor: "pointer"
}}>
    Schedule Evaluator Visit
  </button>
</>}
  </div>
</div>}
  {signals.includes("exchange") && !lead.exchange?.appraisedValue && exchangeRange(exchangeYear, exchangeOdometer, exchangeCondition, exchangeOwnership) && <div style={{
  fontFamily: F,
  fontSize: 10.5,
  color: C.sub,
  marginBottom: 14,
  fontStyle: "italic"
}}>
  Acceptance can be logged once the evaluator confirms a final value.
</div>}
  {signals.includes("exchange") && lead.exchange?.appraisedValue && <div style={{
  background: C.card,
  border: `1.5px solid ${C.borderStrong}`,
  borderRadius: 9,
  padding: 11,
  marginBottom: 14
}}>
  <div style={{
  fontFamily: F,
  fontSize: 11.5,
  fontWeight: 700,
  color: C.ink,
  marginBottom: 8
}}>
    Did the customer accept the value?
  </div>
  <div style={{
  display: "flex",
  gap: 8
}}>
    <button onClick={() => setExchangeAccepted("yes")} style={{
  flex: 1,
  padding: "8px 0",
  borderRadius: 8,
  border: `1.5px solid ${exchangeAccepted === "yes" ? C.green : C.borderStrong}`,
  background: exchangeAccepted === "yes" ? C.greenSoft : C.bg,
  color: exchangeAccepted === "yes" ? C.green : C.sub,
  fontFamily: F,
  fontWeight: 700,
  fontSize: 12,
  cursor: "pointer"
}}>
      Yes
    </button>
    <button onClick={() => setExchangeAccepted("no")} style={{
  flex: 1,
  padding: "8px 0",
  borderRadius: 8,
  border: `1.5px solid ${exchangeAccepted === "no" ? C.hot : C.borderStrong}`,
  background: exchangeAccepted === "no" ? C.hotSoft : C.bg,
  color: exchangeAccepted === "no" ? C.hot : C.sub,
  fontFamily: F,
  fontWeight: 700,
  fontSize: 12,
  cursor: "pointer"
}}>
      No
    </button>
  </div>
  {exchangeAccepted === "no" && <div style={{
  marginTop: 10
}}>
  <div style={{
  fontFamily: F,
  fontSize: 10,
  color: C.sub,
  marginBottom: 6
}}>
    Why not?
  </div>
  <DropdownChecklist options={EXCHANGE_DECLINE_REASONS.map(r => ({
  key: r,
  label: r
}))} selected={exchangeDeclineReason ? [exchangeDeclineReason] : []} onToggle={key => setExchangeDeclineReason(r => r === key ? "" : key)} multi={false} placeholder="Select a reason…" />
</div>}
</div>}
  {signals.includes("finance_needed") && <ExpandRow
    label="Finance Details"
    accent={C.cold}
    open={financeOpen}
    onToggle={() => setFinanceOpen(o => !o)}
    hasData={!!(financeLoanAmount || financeBank || financeStatus)}
  />}
  {signals.includes("finance_needed") && financeOpen && <div style={{
  background: C.card,
  border: `1.5px solid ${C.teal}55`,
  borderRadius: 10,
  padding: 12,
  marginBottom: 14
}}>
  <div style={{
  fontFamily: F,
  fontSize: 11,
  fontWeight: 700,
  color: C.teal,
  marginBottom: 3
}}>
    Finance
  </div>
  <div style={{
  fontFamily: F,
  fontSize: 10.5,
  color: C.sub,
  marginBottom: 10,
  lineHeight: 1.4
}}>
    All optional — add what you know now, update later.
  </div>
  <div style={{
  display: "flex",
  flexWrap: "wrap",
  gap: "8px 4%",
  marginBottom: 10
}}>
    <div style={{
  width: "48%"
}}>
      <div style={{
  fontFamily: F,
  fontSize: 10,
  color: C.sub,
  marginBottom: 4
}}>
        Loan Amount (₹ L)
      </div>
      <input type="number" min="0" value={financeLoanAmount} onChange={e => setFinanceLoanAmount(e.target.value)} placeholder="e.g. 10" style={{
  width: "100%",
  border: `1px solid ${C.borderStrong}`,
  borderRadius: 8,
  padding: "7px 9px",
  fontFamily: F,
  fontSize: 12,
  color: C.ink,
  background: C.bg,
  outline: "none",
  boxSizing: "border-box"
}} />
    </div>
    <div style={{
  width: "48%"
}}>
      <div style={{
  fontFamily: F,
  fontSize: 10,
  color: C.sub,
  marginBottom: 4
}}>
        Bank / NBFC
      </div>
      <input value={financeBank} onChange={e => setFinanceBank(e.target.value)} placeholder="e.g. HDFC Bank" style={{
  width: "100%",
  border: `1px solid ${C.borderStrong}`,
  borderRadius: 8,
  padding: "7px 9px",
  fontFamily: F,
  fontSize: 12,
  color: C.ink,
  background: C.bg,
  outline: "none",
  boxSizing: "border-box"
}} />
    </div>
  </div>
  <div style={{
  fontFamily: F,
  fontSize: 10,
  color: C.sub,
  marginBottom: 6
}}>
    Application Status (if already applied)
  </div>
  <DropdownChecklist options={FINANCE_STATUSES} selected={financeStatus ? [financeStatus] : []} onToggle={key => setFinanceStatus(s => s === key ? "" : key)} multi={false} placeholder="Select status…" />
</div>}
  {signals.includes("finance_needed") && financeStatus === "approved" && <div style={{
  background: C.card,
  border: `1.5px solid ${C.borderStrong}`,
  borderRadius: 9,
  padding: 11,
  marginBottom: 14
}}>
  <div style={{
  fontFamily: F,
  fontSize: 11.5,
  fontWeight: 700,
  color: C.ink,
  marginBottom: 8
}}>
    Did the customer accept the terms?
  </div>
  <div style={{
  display: "flex",
  gap: 8
}}>
    <button onClick={() => setFinanceAccepted("yes")} style={{
  flex: 1,
  padding: "8px 0",
  borderRadius: 8,
  border: `1.5px solid ${financeAccepted === "yes" ? C.green : C.borderStrong}`,
  background: financeAccepted === "yes" ? C.greenSoft : C.bg,
  color: financeAccepted === "yes" ? C.green : C.sub,
  fontFamily: F,
  fontWeight: 700,
  fontSize: 12,
  cursor: "pointer"
}}>
      Yes
    </button>
    <button onClick={() => setFinanceAccepted("no")} style={{
  flex: 1,
  padding: "8px 0",
  borderRadius: 8,
  border: `1.5px solid ${financeAccepted === "no" ? C.hot : C.borderStrong}`,
  background: financeAccepted === "no" ? C.hotSoft : C.bg,
  color: financeAccepted === "no" ? C.hot : C.sub,
  fontFamily: F,
  fontWeight: 700,
  fontSize: 12,
  cursor: "pointer"
}}>
      No
    </button>
  </div>
  {financeAccepted === "no" && <div style={{
  marginTop: 10
}}>
  <div style={{
  fontFamily: F,
  fontSize: 10,
  color: C.sub,
  marginBottom: 6
}}>
    Why not?
  </div>
  <DropdownChecklist options={FINANCE_DECLINE_REASONS.map(r => ({
  key: r,
  label: r
}))} selected={financeDeclineReason ? [financeDeclineReason] : []} onToggle={key => setFinanceDeclineReason(r => r === key ? "" : key)} multi={false} placeholder="Select a reason…" />
</div>}
</div>}
  <div style={{
  fontFamily: F,
  fontSize: 11,
  fontWeight: 700,
  color: C.sub,
  textTransform: "uppercase",
  letterSpacing: 0.6,
  marginBottom: 10,
  marginTop: 18,
  paddingTop: 16,
  borderTop: `1.5px solid ${C.borderStrong}`
}}>
    Decision
  </div>
  <div style={{
  marginBottom: 14
}}>
    {decisionOptions.map(([key, label, Icon, color]) => <button onClick={() => setDecision(key)} style={{
  display: "flex",
  alignItems: "center",
  gap: 8,
  width: "100%",
  background: decision === key ? color + "12" : C.card,
  border: `1.5px solid ${decision === key ? color : C.border}`,
  borderRadius: 10,
  padding: "9px 12px",
  marginBottom: 6,
  cursor: "pointer",
  textAlign: "left"
}} key={key}>
  <Icon size={14} color={decision === key ? color : C.ghost} />
  <span style={{
  fontFamily: F,
  fontSize: 12.5,
  fontWeight: 600,
  color: decision === key ? color : C.ink
}}>
    {label}
  </span>
</button>)}
  </div>
  {needsSEPicker && <div style={{
  background: C.card,
  border: `1.5px solid ${C.cold}55`,
  borderRadius: 10,
  padding: 12,
  marginBottom: 14
}}>
  <div style={{
  fontFamily: F,
  fontSize: 11,
  fontWeight: 700,
  color: C.cold,
  marginBottom: 10
}}>
    Sales Executive
  </div>
  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
    <CheckCircle2 size={14} color={C.green} />
    <span style={{ fontFamily: F, fontSize: 11.5, color: C.green, fontWeight: 700 }}>
      Assigned automatically when you save.
    </span>
  </div>
</div>}
  {decision === "book" && <div style={{
  background: C.card,
  border: `1.5px solid ${C.green}55`,
  borderRadius: 10,
  padding: 12,
  marginBottom: 14
}}>
  <div style={{
  fontFamily: F,
  fontSize: 11,
  fontWeight: 700,
  color: C.green,
  marginBottom: 10
}}>
    Booking Details
  </div>
  <div style={{
  display: "flex",
  gap: 6,
  marginBottom: 12
}}>
    <button onClick={() => setBookingIsFullPayment(false)} style={{
  flex: 1,
  padding: "8px 6px",
  borderRadius: 8,
  border: `1.5px solid ${!bookingIsFullPayment ? C.green : C.borderStrong}`,
  background: !bookingIsFullPayment ? C.greenSoft : C.bg,
  color: !bookingIsFullPayment ? C.green : C.sub,
  fontFamily: F,
  fontWeight: 700,
  fontSize: 11,
  cursor: "pointer"
}}>
      Booking / Token Amount
    </button>
    <button onClick={() => setBookingIsFullPayment(true)} style={{
  flex: 1,
  padding: "8px 6px",
  borderRadius: 8,
  border: `1.5px solid ${bookingIsFullPayment ? C.green : C.borderStrong}`,
  background: bookingIsFullPayment ? C.greenSoft : C.bg,
  color: bookingIsFullPayment ? C.green : C.sub,
  fontFamily: F,
  fontWeight: 700,
  fontSize: 11,
  cursor: "pointer"
}}>
      Full Payment — Retailed
    </button>
  </div>
  {!bookingIsFullPayment ? <>
  <div style={{
  fontFamily: F,
  fontSize: 10,
  color: C.sub,
  marginBottom: 4
}}>
    Booking Amount (₹) *
  </div>
  <input type="number" min="0" value={bookingAmount} onChange={e => setBookingAmount(e.target.value)} placeholder="e.g. 25000" style={{
  width: "100%",
  border: `1px solid ${C.borderStrong}`,
  borderRadius: 8,
  padding: "7px 9px",
  fontFamily: F,
  fontSize: 12,
  color: C.ink,
  background: C.bg,
  outline: "none",
  boxSizing: "border-box",
  marginBottom: 10
}} />
  <div style={{
  fontFamily: F,
  fontSize: 10,
  color: C.sub,
  marginBottom: 6
}}>
    Source of Payment *
  </div>
  <DropdownChecklist options={PAYMENT_SOURCES} selected={paymentSource ? [paymentSource] : []} onToggle={key => setPaymentSource(v => v === key ? "" : key)} placeholder="Select…" multi={false} />
  <div style={{
  fontFamily: F,
  fontSize: 10,
  color: C.sub,
  margin: "10px 0 4px"
}}>
    Receipt Number
  </div>
  <input value={receiptNumber} onChange={e => setReceiptNumber(e.target.value)} placeholder="Optional — add once issued" style={{
  width: "100%",
  border: `1px solid ${C.borderStrong}`,
  borderRadius: 8,
  padding: "7px 9px",
  fontFamily: F,
  fontSize: 12,
  color: C.ink,
  background: C.bg,
  outline: "none",
  boxSizing: "border-box"
}} />
</> : <>
  <div style={{
  fontFamily: F,
  fontSize: 11,
  color: C.sub,
  marginBottom: 10,
  lineHeight: 1.4
}}>
    Customer is paying in full right now — this books and retails the deal in one step. The true sale is recorded today.
  </div>
  <div style={{
  fontFamily: F,
  fontSize: 10,
  color: C.sub,
  marginBottom: 4
}}>
    Retail Date
  </div>
  <input type="date" value={bookingRetailDate} onChange={e => setBookingRetailDate(e.target.value)} style={{
  width: 170,
  maxWidth: "100%",
  border: `1px solid ${C.borderStrong}`,
  borderRadius: 8,
  padding: "7px 9px",
  fontFamily: F,
  fontSize: 12,
  color: C.ink,
  background: C.bg,
  outline: "none",
  boxSizing: "border-box",
  marginBottom: 10
}} />
  <PaymentDetailsForm value={bookingPaymentDetails} onChange={setBookingPaymentDetails} />
</>}
</div>}
  {decision === "test_drive" && <div style={{
  background: C.card,
  border: `1.5px solid ${C.teal}55`,
  borderRadius: 10,
  padding: 12,
  marginBottom: 14
}}>
  <div style={{
  fontFamily: F,
  fontSize: 11,
  fontWeight: 700,
  color: C.teal,
  marginBottom: 10
}}>
    Test Drive Details
    {lead.assignedSE ? ` \u2014 ${lead.assignedSE.name}` : ""}
  </div>
  <div style={{
  display: "flex",
  gap: 8,
  marginBottom: 10
}}>
    {TEST_DRIVE_MODES.map(m => <button onClick={() => {
  setTestDriveMode(m.key);
  setTestDriveSlot("");
}} style={{
  flex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  padding: "8px 0",
  borderRadius: 8,
  border: `1.5px solid ${testDriveMode === m.key ? C.teal : C.borderStrong}`,
  background: testDriveMode === m.key ? C.tealSoft : C.bg,
  color: testDriveMode === m.key ? C.teal : C.sub,
  fontFamily: F,
  fontWeight: 700,
  fontSize: 11.5,
  cursor: "pointer"
}} key={m.key}>
  <m.Icon size={12} />
  {m.label}
</button>)}
  </div>
  {testDriveMode === "location" && <input value={testDriveLocation} onChange={e => setTestDriveLocation(e.target.value)} placeholder="Pickup address" style={{
  width: "100%",
  border: `1px solid ${C.borderStrong}`,
  borderRadius: 8,
  padding: "8px 10px",
  fontFamily: F,
  fontSize: 12,
  color: C.ink,
  background: C.bg,
  outline: "none",
  boxSizing: "border-box",
  marginBottom: 10
}} />}
  <input type="date" value={testDriveDate} onChange={e => setTestDriveDate(e.target.value)} style={{
  width: "100%",
  minWidth: 0,
  border: `1px solid ${C.borderStrong}`,
  borderRadius: 8,
  padding: "8px 9px",
  fontFamily: F,
  fontSize: 12,
  color: C.ink,
  background: C.bg,
  outline: "none",
  boxSizing: "border-box",
  marginBottom: 10
}} />
  {testDriveMode && <>
  <div style={{
  fontFamily: F,
  fontSize: 10,
  color: C.sub,
  marginBottom: 6
}}>
    {testDriveMode === "location" ? "2-hour slots (travel buffer included)" : "1-hour slots"}
  </div>
  <TimeSlotPicker mode={testDriveMode} date={testDriveDate} slot={testDriveSlot} onChange={setTestDriveSlot} allLeads={allLeads} excludeLeadId={lead.id} />
</>}
  <DrivingLicenseRow done={!!testDriveDLVia} via={testDriveDLVia} onCollect={setTestDriveDLVia} onUndo={() => setTestDriveDLVia(null)} showToast={showToast} customerName={lead.name} />
</div>}
  {decision === "callback" && <div style={{
  background: C.card,
  border: `1.5px solid ${C.warm}55`,
  borderRadius: 10,
  padding: 12,
  marginBottom: 14
}}>
  <div style={{
  fontFamily: F,
  fontSize: 11,
  fontWeight: 700,
  color: C.warm,
  marginBottom: 10
}}>
    When to call back
  </div>
  <CallbackScheduler dateValue={followUpDate} onDateChange={setFollowUpDate} timeValue={preferredTime} onTimeChange={setPreferredTime} />
</div>}
  {decision === "lost" && <div style={{
  background: C.card,
  border: `1.5px solid ${C.hot}55`,
  borderRadius: 10,
  padding: 12,
  marginBottom: 14
}}>
  <div style={{
  fontFamily: F,
  fontSize: 11,
  fontWeight: 700,
  color: C.hot,
  marginBottom: 10
}}>
    Why isn't this lead interested?
  </div>
  <DropdownChecklist options={NOT_INTERESTED_REASONS.map(r => ({
  key: r,
  label: r
}))} selected={reason ? [reason] : []} onToggle={key => setReason(r => r === key ? "" : key)} multi={false} placeholder="Select a reason…" />
  {!reason && <div style={{
  fontFamily: F,
  fontSize: 11,
  color: C.hot,
  marginTop: 8
}}>
  Pick a reason before you can save.
</div>}
</div>}
  {decision === "delivery_confirmed" && (() => {
  const availability = deliveryModel && deliveryVariant && deliveryColor ? inventoryLookup(deliveryModel, deliveryVariant, deliveryColor) : null;
  const asm = availability ? INVENTORY_STATUS_META[availability.status] : null;
  return <div style={{
  background: C.card,
  border: `1.5px solid ${C.green}55`,
  borderRadius: 10,
  padding: 12,
  marginBottom: 14
}}>
  <div style={{
  fontFamily: F,
  fontSize: 11,
  fontWeight: 700,
  color: C.green,
  marginBottom: 10
}}>
    Confirm Model, Variant & Delivery Date
  </div>
  <div style={{
  fontFamily: F,
  fontSize: 10,
  color: C.sub,
  marginBottom: 4
}}>
    Model
  </div>
  <DropdownChecklist options={Object.keys(MODEL_VARIANTS).map(m => ({
  key: m,
  label: m
}))} selected={deliveryModel ? [deliveryModel] : []} onToggle={key => {
  setDeliveryModel(m => m === key ? "" : key);
  setDeliveryVariant("");
}} multi={false} placeholder="Select model…" />
  <div style={{
  fontFamily: F,
  fontSize: 10,
  color: C.sub,
  margin: "10px 0 4px"
}}>
    Variant
  </div>
  <DropdownChecklist options={(MODEL_VARIANTS[deliveryModel] || []).map(v => ({
  key: v,
  label: v
}))} selected={deliveryVariant ? [deliveryVariant] : []} onToggle={key => setDeliveryVariant(v => v === key ? "" : key)} multi={false} placeholder={deliveryModel ? "Select variant\u2026" : "Pick a model first"} />
  <div style={{
  fontFamily: F,
  fontSize: 10,
  color: C.sub,
  margin: "10px 0 4px"
}}>
    Colour
  </div>
  <DropdownChecklist options={COLOR_OPTIONS.map(c => ({
  key: c,
  label: c
}))} selected={deliveryColor ? [deliveryColor] : []} onToggle={key => setDeliveryColor(c => c === key ? "" : key)} multi={false} placeholder="Select colour…" />
  {deliveryModel && deliveryVariant && deliveryColor && <div style={{
  marginTop: 10,
  background: asm ? asm.soft : C.bg,
  border: `1px solid ${asm ? asm.color : C.borderStrong}35`,
  borderRadius: 8,
  padding: "8px 10px"
}}>
  {availability ? <>
  <div style={{
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center"
}}>
    <span style={{
  fontFamily: F,
  fontSize: 11,
  fontWeight: 700,
  color: asm.color
}}>
      {availability.status}
    </span>
    <span style={{
  fontFamily: F,
  fontSize: 11,
  color: C.sub
}}>
      {availability.units}
       in stock
    </span>
  </div>
  <div style={{
  fontFamily: F,
  fontSize: 10.5,
  color: availability.waitingDays === 0 ? C.green : C.sub,
  fontWeight: availability.waitingDays === 0 ? 700 : 500,
  marginTop: 2
}}>
    {availability.waitingDays === 0 ? "Ready now" : `~${availability.waitingDays}d waiting period`}
  </div>
</> : <span style={{
  fontFamily: F,
  fontSize: 11,
  color: C.sub
}}>
  This colour isn't currently stocked for this variant — check with inventory before confirming a date.
</span>}
</div>}
  <div style={{
  fontFamily: F,
  fontSize: 10,
  color: C.sub,
  margin: "12px 0 4px"
}}>
    Target Delivery Date
  </div>
  <input type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} style={{
  width: "100%",
  minWidth: 0,
  border: `1px solid ${C.borderStrong}`,
  borderRadius: 8,
  padding: "7px 9px",
  fontFamily: F,
  fontSize: 12,
  color: C.ink,
  background: C.bg,
  outline: "none",
  boxSizing: "border-box"
}} />
  {(!deliveryModel || !deliveryVariant || !deliveryDate) && <div style={{
  fontFamily: F,
  fontSize: 11,
  color: C.hot,
  marginTop: 8
}}>
  Confirm model, variant, and delivery date before you can save.
</div>}
</div>;
})()}
  {decision === "cancelled" && <div style={{
  background: C.card,
  border: `1.5px solid ${C.hot}55`,
  borderRadius: 10,
  padding: 12,
  marginBottom: 14
}}>
  <div style={{
  fontFamily: F,
  fontSize: 11,
  fontWeight: 700,
  color: C.hot,
  marginBottom: 3
}}>
    Why is the customer cancelling?
  </div>
  <div style={{
  fontFamily: F,
  fontSize: 10.5,
  color: C.sub,
  marginBottom: 10,
  lineHeight: 1.4
}}>
    This sends a request to the SE, TL, and Manager — it doesn't cancel the booking. Only a Manager can approve a cancellation.
  </div>
  <DropdownChecklist options={BOOKING_CANCELLATION_REASONS.map(r => ({
  key: r,
  label: r
}))} selected={reason ? [reason] : []} onToggle={key => setReason(r => r === key ? "" : key)} multi={false} placeholder="Select a reason…" />
  {!reason && <div style={{
  fontFamily: F,
  fontSize: 11,
  color: C.hot,
  marginTop: 8
}}>
  Pick a reason before you can save.
</div>}
</div>}
</>}
  {channel !== "whatsapp" && disposition && disposition !== "connected" && <div style={{
  marginBottom: 14
}}>
  {disposition === "wrong_number" ? isRepeatWrongNumber ? <div style={{
  display: "flex",
  alignItems: "center",
  gap: 7,
  background: C.hotSoft,
  borderRadius: 9,
  padding: "9px 11px"
}}>
  <AlertTriangle size={13} color={C.hot} />
  <span style={{
  fontFamily: F,
  fontSize: 11.5,
  color: C.hot,
  fontWeight: 600
}}>
    Wrong number again — will mark lost on save.
  </span>
</div> : <div style={{
  background: C.bg,
  border: `1px solid ${C.borderStrong}`,
  borderRadius: 9,
  padding: "9px 11px",
  fontFamily: F,
  fontSize: 11.5,
  color: C.sub
}}>
  Retry auto-scheduled in 2 days.
</div> : <div style={{
  background: C.bg,
  border: `1px solid ${C.borderStrong}`,
  borderRadius: 9,
  padding: "9px 11px",
  fontFamily: F,
  fontSize: 11.5,
  color: C.sub
}}>
  Retry tomorrow (
  {nextSession(currentSession())}
  ).
  {lead.contacted + 1 >= 5 && !everConnected(lead) && <span style={{
  display: "block",
  marginTop: 4,
  color: C.hot,
  fontWeight: 600
}}>
  5th attempt, no contact — will mark lost on save.
</span>}
</div>}
</div>}
  <div style={{
  fontFamily: F,
  fontSize: 11,
  fontWeight: 700,
  color: C.sub,
  textTransform: "uppercase",
  letterSpacing: 0.6,
  marginBottom: 8,
  marginTop: 18,
  paddingTop: 16,
  borderTop: `1.5px solid ${C.borderStrong}`
}}>
    Notes
  </div>
  <VoiceNoteField value={note} onChange={setNote} recording={noteRecording} onRecordingChange={setNoteRecording} />
  <div style={{
  display: "flex",
  gap: 8
}}>
    <button onClick={onCancel} style={{
  flex: 1,
  padding: "10px 0",
  borderRadius: 10,
  border: `1.5px solid ${C.borderStrong}`,
  background: "none",
  fontFamily: F,
  fontWeight: 700,
  fontSize: 12.5,
  color: C.sub,
  cursor: "pointer"
}}>
      Cancel
    </button>
    <button onClick={() => {
  if (!canSubmit) {
    setAttempted(true);
    return;
  }
  onSave({
    disposition: disposition || "connected",
    signals,
    exchange: signals.includes("exchange") && (exchangeModel.trim() || exchangeVariant.trim() || exchangeYear.trim() || exchangeOdometer.trim() || exchangeCondition) ? {
      model: exchangeModel,
      variant: exchangeVariant,
      year: exchangeYear,
      odometer: exchangeOdometer,
      condition: exchangeCondition,
      registeredCity: exchangeRegisteredCity,
      ownership: exchangeOwnership,
      customerAccepted: exchangeAccepted,
      declineReason: exchangeDeclineReason,
      appraisalScheduled: exchangeAppraisalScheduled,
      appraisedValue: lead.exchange?.appraisedValue || null
    } : null,
    decision,
    assignSE: effectiveSE,
    testDriveMode,
    testDriveDate,
    testDriveSlot,
    testDriveLocation,
    testDriveDLVia,
    reason,
    note,
    preferredTime,
    financeLoanAmount,
    financeBank,
    financeStatus,
    exchangeAccepted,
    exchangeDeclineReason,
    financeAccepted,
    financeDeclineReason,
    bookingAmount,
    paymentSource,
    receiptNumber,
    bookingIsFullPayment,
    bookingRetailDate,
    bookingPaymentDetails,
    deliveryModel,
    deliveryVariant,
    deliveryColor,
    deliveryDate,
    followUpDate: followUpDate ? new Date(followUpDate) : null
  });
}} style={{
  flex: 2,
  padding: "10px 0",
  borderRadius: 10,
  border: "none",
  background: canSubmit ? C.primary : C.ghost,
  color: canSubmit ? "#fff" : C.sub,
  fontFamily: F,
  fontWeight: 700,
  fontSize: 12.5,
  cursor: canSubmit ? "pointer" : "default"
}}>
      Save
    </button>
  </div>
</div>;
  }

function TestDriveForm({ onSave, onCancel, allLeads, excludeLeadId, showToast, customerName }) {
    const [mode, setMode] = useState("");
    const [date, setDate] = useState("");
    const [slot, setSlot] = useState("");
    const [locationText, setLocationText] = useState("");
    const [note, setNote] = useState("");
    const [dlVia, setDlVia] = useState(null);
    const canSubmit = mode && date && slot && (mode !== "location" || locationText.trim());
    const [attempted, setAttempted] = useState(false);
    const missingList = (() => {
      const m = [];
      if (!mode) m.push("test drive mode");
      if (!date) m.push("date");
      if (!slot) m.push("time slot");
      if (mode === "location" && !locationText.trim()) m.push("customer's location");
      return m;
    })();
    return <div style={{
  background: C.bg,
  border: `1px solid ${C.borderStrong}`,
  borderRadius: 14,
  padding: 14,
  marginTop: 10
}}>
  <div style={{
  fontFamily: F,
  fontSize: 11,
  fontWeight: 700,
  color: C.sub,
  textTransform: "uppercase",
  letterSpacing: 0.6,
  marginBottom: 10
}}>
    Schedule Test Drive
  </div>
  <div style={{
  display: "flex",
  gap: 8,
  marginBottom: 12
}}>
    {TEST_DRIVE_MODES.map(m => <button onClick={() => {
  setMode(m.key);
  setSlot("");
}} style={{
  flex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  padding: "9px 0",
  borderRadius: 9,
  border: `1.5px solid ${mode === m.key ? C.primary : C.borderStrong}`,
  background: mode === m.key ? C.primarySoft : C.card,
  color: mode === m.key ? C.primary : C.sub,
  fontFamily: F,
  fontWeight: 700,
  fontSize: 12,
  cursor: "pointer"
}} key={m.key}>
  <m.Icon size={13} />
  {m.label}
</button>)}
  </div>
  {mode === "location" && <input value={locationText} onChange={e => setLocationText(e.target.value)} placeholder="Pickup address" style={{
  width: "100%",
  minWidth: 0,
  border: `1.5px solid ${C.borderStrong}`,
  borderRadius: 9,
  padding: "9px 10px",
  fontFamily: F,
  fontSize: 12.5,
  color: C.ink,
  background: C.card,
  outline: "none",
  boxSizing: "border-box",
  marginBottom: 12
}} />}
  <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{
  width: "100%",
  minWidth: 0,
  border: `1.5px solid ${C.borderStrong}`,
  borderRadius: 9,
  padding: "9px 10px",
  fontFamily: F,
  fontSize: 12.5,
  color: C.ink,
  background: C.card,
  outline: "none",
  boxSizing: "border-box",
  marginBottom: 12
}} />
  {mode && <div style={{
  marginBottom: 12
}}>
  <div style={{
  fontFamily: F,
  fontSize: 10,
  color: C.sub,
  marginBottom: 6
}}>
    {mode === "location" ? "2-hour slots (travel buffer included)" : "1-hour slots"}
  </div>
  <TimeSlotPicker mode={mode} date={date} slot={slot} onChange={setSlot} allLeads={allLeads} excludeLeadId={excludeLeadId} />
</div>}
  <DrivingLicenseRow done={!!dlVia} via={dlVia} onCollect={setDlVia} onUndo={() => setDlVia(null)} showToast={showToast} customerName={customerName} />
  <div style={{
  marginTop: 12
}} />
  <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Note for the SE — pickup preference, family joining, etc." rows={2} style={{
  width: "100%",
  border: `1.5px solid ${C.borderStrong}`,
  borderRadius: 9,
  padding: "9px 12px",
  fontFamily: F,
  fontSize: 12.5,
  color: C.ink,
  resize: "none",
  background: C.card,
  outline: "none",
  boxSizing: "border-box",
  marginBottom: 12
}} />
  <div style={{
  display: "flex",
  gap: 8
}}>
    {attempted && !canSubmit && <div style={{
  width: "100%"
}}>
  <MissingBanner items={missingList} />
</div>}
    <button onClick={onCancel} style={{
  flex: 1,
  padding: "10px 0",
  borderRadius: 10,
  border: `1.5px solid ${C.borderStrong}`,
  background: "none",
  fontFamily: F,
  fontWeight: 700,
  fontSize: 12.5,
  color: C.sub,
  cursor: "pointer"
}}>
      Cancel
    </button>
    <button onClick={() => {
  if (!canSubmit) {
    setAttempted(true);
    return;
  }
  onSave({
    mode,
    date,
    slot,
    locationText,
    note,
    dlVia
  });
}} style={{
  flex: 2,
  padding: "10px 0",
  borderRadius: 10,
  border: "none",
  background: canSubmit ? C.primary : C.ghost,
  color: canSubmit ? "#fff" : C.sub,
  fontFamily: F,
  fontWeight: 700,
  fontSize: 12.5,
  cursor: canSubmit ? "pointer" : "default"
}}>
      Schedule Test Drive
    </button>
  </div>
</div>;
  }

function QuoteForm({ model, onSave, onCancel }) {
    const variantOptions = Object.keys(VARIANT_PRICES);
    const [variant, setVariant] = useState(() => model && VARIANT_PRICES[model] !== void 0 ? model : variantOptions[0]);
    const [selectedAccessories, setSelectedAccessories] = useState([]);
    const [includeInsurance, setIncludeInsurance] = useState(true);
    const [includeWarranty, setIncludeWarranty] = useState(true);
    const [includeCare, setIncludeCare] = useState(true);
    const [discount, setDiscount] = useState("");
    const [note, setNote] = useState("");
    const exShowroomNum = VARIANT_PRICES[variant] || 0;
    const accessoriesTotal = selectedAccessories.reduce((sum, key) => {
      const a = ACCESSORY_OPTIONS.find((x) => x.key === key);
      return sum + (a?.amount || 0);
    }, 0);
    const breakup = computeQuoteBreakup(exShowroomNum, parseInt(discount) || 0, accessoriesTotal, includeInsurance, includeWarranty, includeCare);
    const toggleAccessory = (key) => setSelectedAccessories((s) => s.includes(key) ? s.filter((x) => x !== key) : [...s, key]);
    const discountOverLimit = (parseInt(discount) || 0) > DISCOUNT_LIMIT;
    const canSubmit = !!variant && !discountOverLimit;
    const [attempted, setAttempted] = useState(false);
    const missingList = (() => {
      const m = [];
      if (!variant) m.push("a variant");
      if (discountOverLimit) m.push("discount within limit");
      return m;
    })();
    return <div style={{
  background: C.bg,
  border: `1px solid ${C.borderStrong}`,
  borderRadius: 14,
  padding: 14,
  marginTop: 10
}}>
  <div style={{
  fontFamily: F,
  fontSize: 11,
  fontWeight: 700,
  color: C.sub,
  textTransform: "uppercase",
  letterSpacing: 0.6,
  marginBottom: 10
}}>
    Send Quote
  </div>
  <div style={{
  fontFamily: F,
  fontSize: 10.5,
  color: C.sub,
  fontWeight: 600,
  marginBottom: 6
}}>
    Model / Variant
  </div>
  <select value={variant} onChange={e => setVariant(e.target.value)} style={{
  width: "100%",
  border: `1.5px solid ${C.borderStrong}`,
  borderRadius: 9,
  padding: "9px 12px",
  fontFamily: F,
  fontSize: 12.5,
  color: C.ink,
  background: C.card,
  outline: "none",
  boxSizing: "border-box",
  marginBottom: 12,
  appearance: "none"
}}>
    {variantOptions.map(v => <option value={v} key={v}>
  {v}
</option>)}
  </select>
  <div style={{
  background: C.card,
  border: `1px solid ${C.border}`,
  borderRadius: 10,
  padding: 10,
  marginBottom: 12
}}>
    <div style={{
  fontFamily: F,
  fontSize: 9.5,
  fontWeight: 800,
  color: C.sub,
  textTransform: "uppercase",
  letterSpacing: 0.4,
  marginBottom: 6
}}>
      From the price list — not editable
    </div>
    {[["Ex-Showroom Price", breakup.exShowroom], ["RTO (Registration)", breakup.rto], ...breakup.tcs > 0 ? [["TCS", breakup.tcs]] : [], ["Handling & Logistics", breakup.handling]].map(([label, amt]) => <div style={{
  display: "flex",
  justifyContent: "space-between",
  padding: "3px 0"
}} key={label}>
  <span style={{
  fontFamily: F,
  fontSize: 11,
  color: C.sub
}}>
    {label}
  </span>
  <span style={{
  fontFamily: F,
  fontSize: 11,
  color: C.ink,
  fontWeight: 600
}}>
    {formatINR(amt)}
  </span>
</div>)}
  </div>
  <div style={{
  fontFamily: F,
  fontSize: 10.5,
  color: C.sub,
  fontWeight: 600,
  marginBottom: 6
}}>
    Included by default — untick if the customer doesn't want it
  </div>
  <div style={{
  background: C.card,
  border: `1px solid ${C.border}`,
  borderRadius: 10,
  padding: 10,
  marginBottom: 12
}}>
    {[{
  checked: includeInsurance,
  onToggle: () => setIncludeInsurance(v => !v),
  label: "Insurance (1st year)",
  amount: breakup.insurance || Math.round(exShowroomNum * 0.035),
  hint: "Untick for non-dealer insurance"
}, {
  checked: includeWarranty,
  onToggle: () => setIncludeWarranty(v => !v),
  label: "Extended Warranty",
  amount: EXTENDED_WARRANTY_AMOUNT,
  hint: null
}, {
  checked: includeCare,
  onToggle: () => setIncludeCare(v => !v),
  label: "Care Package (3yr)",
  amount: CARE_PACKAGE_AMOUNT,
  hint: null
}].map((item, i) => <button onClick={item.onToggle} style={{
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  width: "100%",
  background: "none",
  border: "none",
  cursor: "pointer",
  padding: "6px 0",
  borderTop: i > 0 ? `1px solid ${C.border}` : "none",
  textAlign: "left"
}} key={item.label}>
  <div style={{
  display: "flex",
  alignItems: "center",
  gap: 8
}}>
    {item.checked ? <CheckSquare size={15} color={C.primary} /> : <Square size={15} color={C.ghost} />}
    <div>
      <div style={{
  fontFamily: F,
  fontSize: 11,
  color: item.checked ? C.ink : C.sub,
  fontWeight: 600
}}>
        {item.label}
      </div>
      {item.hint && !item.checked && <div style={{
  fontFamily: F,
  fontSize: 9.5,
  color: C.sub,
  marginTop: 1
}}>
  {item.hint}
</div>}
    </div>
  </div>
  <span style={{
  fontFamily: F,
  fontSize: 11,
  color: item.checked ? C.ink : C.ghost,
  fontWeight: 600,
  textDecoration: item.checked ? "none" : "line-through"
}}>
    {formatINR(item.amount)}
  </span>
</button>)}
  </div>
  <div style={{
  fontFamily: F,
  fontSize: 10.5,
  color: C.sub,
  fontWeight: 600,
  marginBottom: 6
}}>
    Accessories (optional) — select what the customer wants, prices fixed
  </div>
  {selectedAccessories.length > 0 && <div style={{
  display: "flex",
  flexWrap: "wrap",
  gap: 6,
  marginBottom: 8
}}>
  {selectedAccessories.map(key => {
  const a = ACCESSORY_OPTIONS.find(x => x.key === key);
  return <Pill label={`${a.label} (+${formatINR(a.amount)})`} color={C.primary} soft={C.primarySoft} onRemove={() => toggleAccessory(key)} key={key} />;
})}
</div>}
  <div style={{
  marginBottom: 12
}}>
    <DropdownChecklist options={ACCESSORY_OPTIONS.map(a => ({
  key: a.key,
  label: a.label,
  amount: a.amount
}))} selected={selectedAccessories} onToggle={toggleAccessory} placeholder="Select accessories…" renderLabel={opt => `${opt.label} (+${formatINR(opt.amount)})`} />
  </div>
  <div style={{
  fontFamily: F,
  fontSize: 10.5,
  color: C.sub,
  fontWeight: 600,
  marginBottom: 6
}}>
    Discount (₹)
  </div>
  <input type="number" min="0" step="1000" value={discount} onChange={e => setDiscount(e.target.value)} placeholder="e.g. 15000" style={{
  width: "100%",
  border: `1.5px solid ${discountOverLimit ? C.hot : C.borderStrong}`,
  borderRadius: 9,
  padding: "9px 12px",
  fontFamily: F,
  fontSize: 12.5,
  color: C.ink,
  background: C.card,
  outline: "none",
  boxSizing: "border-box",
  marginBottom: discountOverLimit ? 6 : 12
}} />
  {discountOverLimit && <div style={{
  display: "flex",
  alignItems: "flex-start",
  gap: 6,
  marginBottom: 12
}}>
  <AlertTriangle size={12} color={C.hot} style={{
  marginTop: 1,
  flexShrink: 0
}} />
  <span style={{
  fontFamily: F,
  fontSize: 11,
  color: C.hot,
  lineHeight: 1.4
}}>
    Exceeds your authorized limit of 
    {formatINR(DISCOUNT_LIMIT)}
    . (Demo limit — in the real product this is set per user in Admin and can differ person to person.)
  </span>
</div>}
  <div style={{
  background: C.primarySoft,
  borderRadius: 10,
  padding: 11,
  marginBottom: 12
}}>
    <div style={{
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center"
}}>
      <span style={{
  fontFamily: F,
  fontSize: 12,
  fontWeight: 700,
  color: C.primaryDark
}}>
        On-Road Total
      </span>
      <span style={{
  fontFamily: F,
  fontWeight: 800,
  fontSize: 17,
  color: C.ink
}}>
        {formatINR(breakup.total)}
      </span>
    </div>
  </div>
  <div style={{
  fontFamily: F,
  fontSize: 10.5,
  color: C.sub,
  fontWeight: 600,
  marginBottom: 6
}}>
    Comments
  </div>
  <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Note for the SE — discount discussed, exchange, etc." rows={2} style={{
  width: "100%",
  border: `1.5px solid ${C.borderStrong}`,
  borderRadius: 9,
  padding: "9px 12px",
  fontFamily: F,
  fontSize: 12.5,
  color: C.ink,
  resize: "none",
  background: C.card,
  outline: "none",
  boxSizing: "border-box",
  marginBottom: 12
}} />
  <div style={{
  display: "flex",
  gap: 8
}}>
    {attempted && !canSubmit && <div style={{
  width: "100%"
}}>
  <MissingBanner items={missingList} />
</div>}
    <button onClick={onCancel} style={{
  flex: 1,
  padding: "10px 0",
  borderRadius: 10,
  border: `1.5px solid ${C.borderStrong}`,
  background: "none",
  fontFamily: F,
  fontWeight: 700,
  fontSize: 12.5,
  color: C.sub,
  cursor: "pointer"
}}>
      Cancel
    </button>
    <button onClick={() => {
  if (!canSubmit) {
    setAttempted(true);
    return;
  }
  onSave({
    variant,
    ...breakup,
    note
  });
}} style={{
  flex: 2,
  padding: "10px 0",
  borderRadius: 10,
  border: "none",
  background: canSubmit ? C.primary : C.ghost,
  color: canSubmit ? "#fff" : C.sub,
  fontFamily: F,
  fontWeight: 700,
  fontSize: 12.5,
  cursor: canSubmit ? "pointer" : "default"
}}>
      Send Quote
    </button>
  </div>
</div>;
  }

function RetailForm({ onSave, onCancel }) {
    const [retailDate, setRetailDate] = useState(() => isoDate(new Date()));
    const [paymentDetails, setPaymentDetails] = useState(defaultPaymentDetails());
    const canSubmit = !!retailDate && paymentDetailsHasAmount(paymentDetails);
    const [attempted, setAttempted] = useState(false);
    const missingList = (() => {
      const m = [];
      if (!retailDate) m.push("retail date");
      if (!paymentDetailsHasAmount(paymentDetails)) m.push("payment amount");
      return m;
    })();
    return <div style={{
  background: C.bg,
  border: `1px solid ${C.borderStrong}`,
  borderRadius: 14,
  padding: 14,
  marginTop: 10
}}>
  <div style={{
  fontFamily: F,
  fontSize: 11,
  fontWeight: 700,
  color: C.sub,
  textTransform: "uppercase",
  letterSpacing: 0.6,
  marginBottom: 4
}}>
    Mark as Retailed
  </div>
  <div style={{
  fontFamily: F,
  fontSize: 11,
  color: C.sub,
  marginBottom: 12,
  lineHeight: 1.4
}}>
    This is the true sale event — full payment is settled here. Delivery is tracked separately and can happen on a different date.
  </div>
  <div style={{
  fontFamily: F,
  fontSize: 10,
  color: C.sub,
  marginBottom: 4
}}>
    Retail Date
  </div>
  <input type="date" value={retailDate} onChange={e => setRetailDate(e.target.value)} style={{
  width: 170,
  maxWidth: "100%",
  border: `1px solid ${C.borderStrong}`,
  borderRadius: 8,
  padding: "8px 9px",
  fontFamily: F,
  fontSize: 12,
  color: C.ink,
  background: C.card,
  outline: "none",
  boxSizing: "border-box",
  marginBottom: 12
}} />
  <div style={{
  marginBottom: 12
}}>
    <PaymentDetailsForm value={paymentDetails} onChange={setPaymentDetails} />
  </div>
  <div style={{
  display: "flex",
  gap: 8
}}>
    {attempted && !canSubmit && <div style={{
  width: "100%"
}}>
  <MissingBanner items={missingList} />
</div>}
    <button onClick={onCancel} style={{
  flex: 1,
  padding: "10px 0",
  borderRadius: 10,
  border: `1.5px solid ${C.borderStrong}`,
  background: "none",
  fontFamily: F,
  fontWeight: 700,
  fontSize: 12.5,
  color: C.sub,
  cursor: "pointer"
}}>
      Cancel
    </button>
    <button onClick={() => {
  if (!canSubmit) {
    setAttempted(true);
    return;
  }
  onSave(retailDate, paymentDetails);
}} style={{
  flex: 2,
  padding: "10px 0",
  borderRadius: 10,
  border: "none",
  background: canSubmit ? C.primary : C.ghost,
  color: canSubmit ? "#fff" : C.sub,
  fontFamily: F,
  fontWeight: 700,
  fontSize: 12.5,
  cursor: canSubmit ? "pointer" : "default"
}}>
      Confirm Retail
    </button>
  </div>
</div>;
  }

function DeliveryForm({ onSave, onCancel }) {
    const [deliveryDate, setDeliveryDate] = useState(() => isoDate(new Date()));
    return <div style={{
  background: C.bg,
  border: `1px solid ${C.borderStrong}`,
  borderRadius: 14,
  padding: 14,
  marginTop: 10
}}>
  <div style={{
  fontFamily: F,
  fontSize: 11,
  fontWeight: 700,
  color: C.sub,
  textTransform: "uppercase",
  letterSpacing: 0.6,
  marginBottom: 4
}}>
    Mark Delivered
  </div>
  <div style={{
  fontFamily: F,
  fontSize: 11,
  color: C.sub,
  marginBottom: 12,
  lineHeight: 1.4
}}>
    Payment was already settled at retail. This just confirms physical handover — the delivery date can differ from the retail date.
  </div>
  <div style={{
  fontFamily: F,
  fontSize: 10,
  color: C.sub,
  marginBottom: 4
}}>
    Delivery Date
  </div>
  <input type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} style={{
  width: 170,
  maxWidth: "100%",
  border: `1px solid ${C.borderStrong}`,
  borderRadius: 8,
  padding: "8px 9px",
  fontFamily: F,
  fontSize: 12,
  color: C.ink,
  background: C.card,
  outline: "none",
  boxSizing: "border-box",
  marginBottom: 12
}} />
  <div style={{
  display: "flex",
  gap: 8
}}>
    <button onClick={onCancel} style={{
  flex: 1,
  padding: "10px 0",
  borderRadius: 10,
  border: `1.5px solid ${C.borderStrong}`,
  background: "none",
  fontFamily: F,
  fontWeight: 700,
  fontSize: 12.5,
  color: C.sub,
  cursor: "pointer"
}}>
      Cancel
    </button>
    <button onClick={() => deliveryDate && onSave(deliveryDate)} disabled={!deliveryDate} style={{
  flex: 2,
  padding: "10px 0",
  borderRadius: 10,
  border: "none",
  background: deliveryDate ? C.primary : C.ghost,
  color: deliveryDate ? "#fff" : C.sub,
  fontFamily: F,
  fontWeight: 700,
  fontSize: 12.5,
  cursor: deliveryDate ? "pointer" : "default"
}}>
      Confirm Delivery
    </button>
  </div>
</div>;
  }

function AddLeadForm({ onSave, onCancel, customSources, onAddCustomSource }) {
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [altPhone, setAltPhone] = useState("");
    const [email, setEmail] = useState("");
    const [customerType, setCustomerType] = useState("");
    const [customerTypeOther, setCustomerTypeOther] = useState("");
    const [source, setSource] = useState("");
    const [location, setLocation] = useState("");
    const [modelInterest, setModelInterest] = useState({});
    const [colorInterest, setColorInterest] = useState([]);
    const [signals, setSignals] = useState([]);
    const [note, setNote] = useState("");
    const [exchangeModel, setExchangeModel] = useState("");
    const [exchangeVariant, setExchangeVariant] = useState("");
    const [exchangeYear, setExchangeYear] = useState("");
    const [exchangeOdometer, setExchangeOdometer] = useState("");
    const [exchangeCondition, setExchangeCondition] = useState("");
    const [exchangeRegisteredCity, setExchangeRegisteredCity] = useState("");
    const [exchangeOwnership, setExchangeOwnership] = useState("");
    const [financeLoanAmount, setFinanceLoanAmount] = useState("");
    const [financeBank, setFinanceBank] = useState("");
    const [financeStatus, setFinanceStatus] = useState("");
    const phoneDigits = phone.replace(/\D/g, "");
    const canSubmit = name.trim() && phoneDigits.length === 10;
    const [attempted, setAttempted] = useState(false);
    const missingList = (() => {
      const m = [];
      if (!name.trim()) m.push("customer name");
      if (phoneDigits.length !== 10) m.push("valid 10-digit phone");
      return m;
    })();
    const toggleSignal = (key) => setSignals((s) => s.includes(key) ? s.filter((x) => x !== key) : [...s, key]);
    const smallFieldStyle = { width: "100%", border: `1px solid ${C.borderStrong}`, borderRadius: 8, padding: "7px 9px", fontFamily: F, fontSize: 12, color: C.ink, background: C.bg, outline: "none", boxSizing: "border-box" };
    const inputStyle = { width: "100%", minWidth: 0, border: `1.5px solid ${C.borderStrong}`, borderRadius: 9, padding: "9px 12px", fontFamily: F, fontSize: 12.5, color: C.ink, background: C.card, outline: "none", boxSizing: "border-box" };
    const sectionHeadingStyle = { fontFamily: F, fontSize: 11, fontWeight: 700, color: C.sub, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 10 };
    const dividedSectionHeadingStyle = { ...sectionHeadingStyle, marginTop: 18, paddingTop: 16, borderTop: `1.5px solid ${C.borderStrong}` };
    return <div style={{
  display: "flex",
  flexDirection: "column",
  height: "100%"
}}>
  <div style={{
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "12px 14px",
  background: C.card,
  borderBottom: `1px solid ${C.border}`
}}>
    <button onClick={onCancel} style={{
  background: "none",
  border: "none",
  cursor: "pointer",
  padding: 4,
  display: "flex"
}}>
      <ChevronLeft size={20} color={C.ink} />
    </button>
    <span style={{
  fontFamily: F,
  fontWeight: 800,
  fontSize: 15,
  color: C.ink
}}>
      Add Lead
    </span>
  </div>
  <div style={{
  flex: 1,
  overflowY: "auto",
  padding: 14
}}>
    <div style={sectionHeadingStyle}>
      Contact Details
    </div>
    <div style={{
  fontFamily: F,
  fontSize: 10,
  color: C.sub,
  marginBottom: 4
}}>
      Name *
    </div>
    <input value={name} onChange={e => setName(e.target.value)} placeholder="Customer's full name" style={{
  ...inputStyle,
  marginBottom: 12
}} />
    <div style={{
  fontFamily: F,
  fontSize: 10,
  color: C.sub,
  marginBottom: 4
}}>
      Mobile Number *
    </div>
    <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="10-digit mobile number" style={{
  ...inputStyle,
  marginBottom: phone && phoneDigits.length !== 10 ? 4 : 12
}} />
    {phone && phoneDigits.length !== 10 && <div style={{
  fontFamily: F,
  fontSize: 10.5,
  color: C.hot,
  marginBottom: 12
}}>
  Enter a valid 10-digit number.
</div>}
    <div style={{
  fontFamily: F,
  fontSize: 10,
  color: C.sub,
  marginBottom: 4
}}>
      Alternate Phone
    </div>
    <input value={altPhone} onChange={e => setAltPhone(e.target.value)} placeholder="Optional" style={{
  ...inputStyle,
  marginBottom: 12
}} />
    <div style={{
  fontFamily: F,
  fontSize: 10,
  color: C.sub,
  marginBottom: 4
}}>
      Email
    </div>
    <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Optional — for quotes and updates" style={{
  ...inputStyle,
  marginBottom: 12
}} />
    <div style={{
  fontFamily: F,
  fontSize: 10,
  color: C.sub,
  marginBottom: 4
}}>
      Location
    </div>
    <input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Indiranagar" style={inputStyle} />
    <div style={dividedSectionHeadingStyle}>
      Customer Type
    </div>
    <DropdownChecklist options={[...CUSTOMER_TYPES.map(t => ({
  key: t,
  label: t
})), {
  key: "Other",
  label: "Other"
}]} selected={customerType ? [customerType] : []} onToggle={key => setCustomerType(v => v === key ? "" : key)} multi={false} placeholder="Select…" />
    {customerType === "Other" && <input value={customerTypeOther} onChange={e => setCustomerTypeOther(e.target.value)} placeholder="Describe the customer type" style={{
  ...inputStyle,
  marginTop: 8
}} />}
    <div style={dividedSectionHeadingStyle}>
      Lead Source
    </div>
    <SourcePicker value={source} onChange={setSource} customSources={customSources} onAddCustomSource={onAddCustomSource} />
    <div style={dividedSectionHeadingStyle}>
      Interested Vehicle
    </div>
    <ModelInterestPicker value={modelInterest} onChange={setModelInterest} colorValue={colorInterest} onColorChange={setColorInterest} />
    <div style={dividedSectionHeadingStyle}>
      Signals
    </div>
    <div style={{
  display: "flex",
  flexWrap: "wrap",
  gap: 6
}}>
      {Object.entries(SIGNAL_META).map(([key, meta]) => {
  const on = signals.includes(key);
  return <button onClick={() => toggleSignal(key)} style={{
  padding: "6px 11px",
  borderRadius: 8,
  border: `1.5px solid ${on ? meta.color : C.borderStrong}`,
  background: on ? meta.soft : C.card,
  color: on ? meta.color : C.sub,
  fontFamily: F,
  fontWeight: 700,
  fontSize: 11.5,
  cursor: "pointer"
}} key={key}>
  {meta.label}
</button>;
})}
    </div>
    {signals.includes("exchange") && <div style={{
  background: C.card,
  border: `1.5px solid ${C.teal}55`,
  borderRadius: 10,
  padding: 12,
  marginTop: 14
}}>
  <div style={{
  fontFamily: F,
  fontSize: 11,
  fontWeight: 700,
  color: C.teal,
  marginBottom: 3
}}>
    Exchange Vehicle Details
  </div>
  <div style={{
  fontFamily: F,
  fontSize: 10.5,
  color: C.sub,
  marginBottom: 10,
  lineHeight: 1.4
}}>
    All optional — add what you know now, update later.
  </div>
  <div style={{
  display: "flex",
  flexWrap: "wrap",
  gap: "8px 4%",
  marginBottom: 10
}}>
    <div style={{
  width: "48%"
}}>
      <div style={{
  fontFamily: F,
  fontSize: 10,
  color: C.sub,
  marginBottom: 4
}}>
        Car Model
      </div>
      <input value={exchangeModel} onChange={e => setExchangeModel(e.target.value)} placeholder="e.g. Maruti Swift" style={smallFieldStyle} />
    </div>
    <div style={{
  width: "48%"
}}>
      <div style={{
  fontFamily: F,
  fontSize: 10,
  color: C.sub,
  marginBottom: 4
}}>
        Variant
      </div>
      <input value={exchangeVariant} onChange={e => setExchangeVariant(e.target.value)} placeholder="e.g. VXI" style={smallFieldStyle} />
    </div>
    <div style={{
  width: "48%"
}}>
      <div style={{
  fontFamily: F,
  fontSize: 10,
  color: C.sub,
  marginBottom: 4
}}>
        Year
      </div>
      <input value={exchangeYear} onChange={e => setExchangeYear(e.target.value)} placeholder="e.g. 2018" style={smallFieldStyle} />
    </div>
    <div style={{
  width: "48%"
}}>
      <div style={{
  fontFamily: F,
  fontSize: 10,
  color: C.sub,
  marginBottom: 4
}}>
        Odometer (km)
      </div>
      <input value={exchangeOdometer} onChange={e => setExchangeOdometer(e.target.value)} placeholder="e.g. 48000" style={smallFieldStyle} />
    </div>
  </div>
  <div style={{
  fontFamily: F,
  fontSize: 10,
  color: C.sub,
  marginBottom: 6
}}>
    Condition (as described by customer)
  </div>
  <DropdownChecklist options={EXCHANGE_CONDITIONS} selected={exchangeCondition ? [exchangeCondition] : []} onToggle={key => setExchangeCondition(c => c === key ? "" : key)} multi={false} placeholder="Select condition…" />
  <div style={{
  fontFamily: F,
  fontSize: 10,
  color: C.sub,
  margin: "10px 0 4px"
}}>
    Registered City
  </div>
  <input value={exchangeRegisteredCity} onChange={e => setExchangeRegisteredCity(e.target.value)} placeholder="e.g. Bengaluru" style={{
  width: "100%",
  border: `1px solid ${C.borderStrong}`,
  borderRadius: 8,
  padding: "7px 9px",
  fontFamily: F,
  fontSize: 12,
  color: C.ink,
  background: C.bg,
  outline: "none",
  boxSizing: "border-box"
}} />
  <div style={{
  fontFamily: F,
  fontSize: 10,
  color: C.sub,
  margin: "10px 0 6px"
}}>
    Ownership
  </div>
  <DropdownChecklist options={OWNERSHIP_OPTIONS} selected={exchangeOwnership ? [exchangeOwnership] : []} onToggle={key => setExchangeOwnership(o => o === key ? "" : key)} multi={false} placeholder="Select ownership…" />
  {(() => {
  const range = exchangeRange(exchangeYear, exchangeOdometer, exchangeCondition, exchangeOwnership);
  return range ? <div style={{
  marginTop: 10,
  background: C.tealSoft,
  borderRadius: 9,
  padding: "9px 11px"
}}>
  <div style={{
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center"
}}>
    <span style={{
  fontFamily: F,
  fontSize: 10.5,
  color: C.teal,
  fontWeight: 700
}}>
      System Estimate
    </span>
    <span style={{
  fontFamily: F,
  fontSize: 13,
  fontWeight: 800,
  color: C.ink
}}>
      {range.low === range.high ? `\u20B9${range.low} L` : `\u20B9${range.low}\u2013${range.high} L`}
    </span>
  </div>
  <div style={{
  fontFamily: F,
  fontSize: 9.5,
  color: C.sub,
  marginTop: 2
}}>
    Final value confirmed by an evaluator after physical inspection.
  </div>
</div> : null;
})()}
</div>}
    {signals.includes("finance_needed") && <div style={{
  background: C.card,
  border: `1.5px solid ${C.teal}55`,
  borderRadius: 10,
  padding: 12,
  marginTop: 14
}}>
  <div style={{
  fontFamily: F,
  fontSize: 11,
  fontWeight: 700,
  color: C.teal,
  marginBottom: 3
}}>
    Finance
  </div>
  <div style={{
  fontFamily: F,
  fontSize: 10.5,
  color: C.sub,
  marginBottom: 10,
  lineHeight: 1.4
}}>
    All optional — add what you know now, update later.
  </div>
  <div style={{
  display: "flex",
  flexWrap: "wrap",
  gap: "8px 4%",
  marginBottom: 10
}}>
    <div style={{
  width: "48%"
}}>
      <div style={{
  fontFamily: F,
  fontSize: 10,
  color: C.sub,
  marginBottom: 4
}}>
        Loan Amount (₹ L)
      </div>
      <input type="number" min="0" value={financeLoanAmount} onChange={e => setFinanceLoanAmount(e.target.value)} placeholder="e.g. 10" style={smallFieldStyle} />
    </div>
    <div style={{
  width: "48%"
}}>
      <div style={{
  fontFamily: F,
  fontSize: 10,
  color: C.sub,
  marginBottom: 4
}}>
        Bank / NBFC
      </div>
      <input value={financeBank} onChange={e => setFinanceBank(e.target.value)} placeholder="e.g. HDFC Bank" style={smallFieldStyle} />
    </div>
  </div>
  <div style={{
  fontFamily: F,
  fontSize: 10,
  color: C.sub,
  marginBottom: 6
}}>
    Application Status (if already applied)
  </div>
  <DropdownChecklist options={FINANCE_STATUSES} selected={financeStatus ? [financeStatus] : []} onToggle={key => setFinanceStatus(s => s === key ? "" : key)} multi={false} placeholder="Select status…" />
</div>}
    <div style={dividedSectionHeadingStyle}>
      Note
    </div>
    <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Anything worth flagging for the first call" rows={3} style={{
  ...inputStyle,
  resize: "none"
}} />
  </div>
  <div style={{
  display: "flex",
  gap: 8,
  padding: 14,
  background: C.card,
  borderTop: `1px solid ${C.border}`
}}>
    <button onClick={onCancel} style={{
  flex: 1,
  padding: "12px 0",
  borderRadius: 10,
  border: `1.5px solid ${C.borderStrong}`,
  background: "none",
  fontFamily: F,
  fontWeight: 700,
  fontSize: 13,
  color: C.sub,
  cursor: "pointer"
}}>
      Cancel
    </button>
    <button onClick={() => {
  if (!canSubmit) {
    setAttempted(true);
    return;
  }
  onSave({
    name: name.trim(),
    phone: `+91 ${phoneDigits}`,
    altPhone: altPhone.trim(),
    email: email.trim(),
    customerType: customerType === "Other" ? customerTypeOther.trim() : customerType,
    source,
    location: location.trim(),
    modelInterest,
    colorInterest,
    signals,
    note: note.trim(),
    exchange: signals.includes("exchange") && (exchangeModel.trim() || exchangeVariant.trim() || exchangeYear.trim() || exchangeOdometer.trim() || exchangeCondition) ? {
      model: exchangeModel.trim(),
      variant: exchangeVariant.trim(),
      year: exchangeYear.trim(),
      odometer: exchangeOdometer.trim(),
      condition: exchangeCondition,
      registeredCity: exchangeRegisteredCity.trim(),
      ownership: exchangeOwnership
    } : null,
    finance: signals.includes("finance_needed") && (financeLoanAmount.trim() || financeBank.trim() || financeStatus) ? {
      loanAmount: financeLoanAmount.trim(),
      bank: financeBank.trim(),
      status: financeStatus
    } : null
  });
}} style={{
  flex: 2,
  padding: "12px 0",
  borderRadius: 10,
  border: "none",
  background: canSubmit ? C.primary : C.ghost,
  color: canSubmit ? "#fff" : C.sub,
  fontFamily: F,
  fontWeight: 700,
  fontSize: 13,
  cursor: canSubmit ? "pointer" : "default"
}}>
      Add Lead
    </button>
  </div>
</div>;
  }

function LeadRow({ lead, onUpdateLead, showToast, focusMode, allLeads }) {
    const [action, setAction] = useState(null);
    const [lastQuote, setLastQuote] = useState(null);
    const [chosenPhone, setChosenPhone] = useState(lead.phone);
    const [activeTab, setActiveTab] = useState(focusMode ? "history" : null);
    const [historyCount, setHistoryCount] = useState(3);
    const [showAltPhone, setShowAltPhone] = useState(false);
    const [contactWarning, setContactWarning] = useState(null);
    const [addingAltPhone, setAddingAltPhone] = useState(false);
    const [altPhoneDraft, setAltPhoneDraft] = useState("");
    const [editingModelInterest, setEditingModelInterest] = useState(false);
    const [editingDeliveryDate, setEditingDeliveryDate] = useState(false);
    const [editingEmail, setEditingEmail] = useState(false);
    const [emailDraft, setEmailDraft] = useState(lead.email || "");
    const modelInterestRowRef = useRef(null);
    const modelInterestEditorRef = useRef(null);
    const deliveryDateRowRef = useRef(null);
    const deliveryDateEditorRef = useRef(null);
    const deliveryDateInputRef = useRef(null);
    useEffect(() => {
      if (!editingModelInterest) return;
      const handler = (e) => {
        const inRow = modelInterestRowRef.current && modelInterestRowRef.current.contains(e.target);
        const inEditor = modelInterestEditorRef.current && modelInterestEditorRef.current.contains(e.target);
        if (!inRow && !inEditor) setEditingModelInterest(false);
      };
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }, [editingModelInterest]);
    useEffect(() => {
      if (!editingDeliveryDate) return;
      const handler = (e) => {
        const inRow = deliveryDateRowRef.current && deliveryDateRowRef.current.contains(e.target);
        const inEditor = deliveryDateEditorRef.current && deliveryDateEditorRef.current.contains(e.target);
        if (!inRow && !inEditor) setEditingDeliveryDate(false);
      };
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }, [editingDeliveryDate]);
    useLayoutEffect(() => {
      if (editingDeliveryDate && deliveryDateInputRef.current) {
        try {
          deliveryDateInputRef.current.showPicker && deliveryDateInputRef.current.showPicker();
        } catch (e) {
        }
      }
    }, [editingDeliveryDate]);
    const lane = leadLane(lead);
    const overdueDays = daysSinceSEContact(lead);
    const coldDays = daysSinceLastTelecallerContact(lead);
    const logNote = (entry) => {
      const parts = [];
      if (entry.decision === "discount") parts.push("Asked for a discount");
      if (entry.exchange?.model) parts.push(`Exchange: ${entry.exchange.model} ${entry.exchange.variant || ""} \xB7 ${entry.exchange.year || "?"} \xB7 ${entry.exchange.odometer || "?"}km`.trim());
      if (entry.note) parts.push(entry.note);
      return parts.join(" \xB7 ");
    };
    const applyCallOrWhatsApp = (entry) => {
      const numberNote = action === "call" && lead.altPhone ? `[Called ${chosenPhone}] ` : "";
      const newContacted = lead.contacted + 1;
      const baseUpdated = {
        ...lead,
        contacted: newContacted,
        callHistory: [...lead.callHistory, { id: genActivityId(), date: new Date(), disposition: entry.disposition, note: numberNote + logNote(entry) }],
        signals: entry.signals ? [...new Set([...lead.signals, ...entry.signals])] : lead.signals,
        exchange: entry.exchange || lead.exchange,
        finance: entry.financeLoanAmount || entry.financeBank || entry.financeStatus ? { loanAmount: entry.financeLoanAmount || "", bank: entry.financeBank || "", status: entry.financeStatus || "", customerAccepted: entry.financeAccepted, declineReason: entry.financeDeclineReason } : lead.finance
      };
      if (entry.disposition !== "connected") {
        if (entry.disposition === "wrong_number") {
          if (hasPriorDisposition(lead, "wrong_number")) {
            onUpdateLead({ ...baseUpdated, closed: true, closedReason: "Wrong number reported twice" });
            showToast("Lead closed \u2014 wrong number reported twice");
            setAction(null);
            return;
          }
          onUpdateLead({ ...baseUpdated, followUpDate: inDays(2) });
          showToast("\u2705 Logged \u2014 retry auto-scheduled in 2 days");
          setAction(null);
          return;
        }
        if (newContacted >= 5 && !everConnected(lead)) {
          onUpdateLead({ ...baseUpdated, closed: true, closedReason: "5 attempts with no contact" });
          showToast("Lead closed \u2014 5 attempts without contact");
          setAction(null);
          return;
        }
        const session = nextSession(currentSession());
        onUpdateLead({ ...baseUpdated, followUpDate: tomorrow(), bestCallTime: session });
        showToast(`\u2705 Logged \u2014 retry tomorrow (${session})`);
        setAction(null);
        return;
      }
      const updated = {
        ...baseUpdated,
        bestCallTime: entry.preferredTime || lead.bestCallTime,
        followUpDate: entry.followUpDate || lead.followUpDate,
        modelInterest: lead.modelInterest,
        colorInterest: lead.colorInterest
      };
      if (entry.decision === "assign" || entry.decision === "reassign" || entry.decision === "test_drive" || entry.decision === "discount") {
        const assignSE = entry.assignSE || autoAssignSE(lead, allLeads);
        entry = { ...entry, assignSE };
        bumpAssignmentFrequency(assignSE.name);
        let finalHistory = updated.callHistory;
        if (entry.decision === "test_drive" && entry.testDriveMode && entry.testDriveDate && entry.testDriveSlot) {
          const modeLabel = TEST_DRIVE_MODES.find((m) => m.key === entry.testDriveMode)?.label || entry.testDriveMode;
          const locationPart = entry.testDriveMode === "location" && entry.testDriveLocation ? ` at ${entry.testDriveLocation}` : "";
          const dlNote = entry.testDriveDLVia ? ` Driving license collected (${entry.testDriveDLVia}).` : "";
          finalHistory = [...finalHistory, {
            id: genActivityId(),
            date: new Date(),
            disposition: "test_drive_scheduled",
            testDriveDate: entry.testDriveDate,
            testDriveSlot: entry.testDriveSlot,
            testDriveMode: entry.testDriveMode,
            note: `Test drive scheduled ${entry.testDriveDate}, ${entry.testDriveSlot} \u2014 ${modeLabel}${locationPart}.${dlNote}`
          }];
        }
        onUpdateLead({
          ...updated,
          callHistory: finalHistory,
          assignedSE: entry.assignSE,
          lastSEContactDate: new Date(),
          drivingLicense: entry.testDriveDLVia ? { done: true, via: entry.testDriveDLVia } : lead.drivingLicense
        });
        showToast(`\u2705 Qualified & auto-assigned to ${entry.assignSE.name}`);
        setAction(null);
        return;
      }
      if (entry.decision === "delivery_confirmed") {
        const availability = entry.deliveryModel && entry.deliveryVariant && entry.deliveryColor ? inventoryLookup(entry.deliveryModel, entry.deliveryVariant, entry.deliveryColor) : null;
        const availabilityNote = availability ? availability.waitingDays === 0 ? " Ready now." : ` ~${availability.waitingDays}d waiting period.` : "";
        onUpdateLead({
          ...updated,
          targetDeliveryDate: entry.deliveryDate || lead.targetDeliveryDate,
          modelInterest: entry.deliveryModel && entry.deliveryVariant ? { [entry.deliveryModel]: [entry.deliveryVariant] } : lead.modelInterest,
          colorInterest: entry.deliveryColor ? [entry.deliveryColor] : lead.colorInterest,
          callHistory: [...updated.callHistory, {
            id: genActivityId(),
            date: new Date(),
            disposition: "connected",
            note: `Delivery confirmed \u2014 ${entry.deliveryModel} ${entry.deliveryVariant}${entry.deliveryColor ? ` (${entry.deliveryColor})` : ""}.${availabilityNote} Target delivery: ${entry.deliveryDate}.${entry.note ? ` ${entry.note}` : ""}`
          }]
        });
        showToast(`\u2705 Delivery confirmed \u2014 ${lead.name}`);
        setAction(null);
        return;
      }
      if (entry.decision === "proceeding") {
        onUpdateLead({
          ...updated,
          callHistory: [...updated.callHistory, { id: genActivityId(), date: new Date(), disposition: "connected", note: entry.note || "Customer confirmed proceeding as planned \u2014 no issues raised." }]
        });
        showToast(`\u2705 Logged \u2014 ${lead.name}`);
        setAction(null);
        return;
      }
      if (entry.decision === "needs_se_attention") {
        onUpdateLead({
          ...updated,
          lastSEContactDate: new Date(),
          callHistory: [...updated.callHistory, { id: genActivityId(), date: new Date(), disposition: "connected", note: entry.note ? `Customer query, sent to ${lead.assignedSE?.name || "SE"}: ${entry.note}` : `Customer has a query \u2014 sent back to ${lead.assignedSE?.name || "SE"}.` }]
        });
        showToast(`\u2705 Sent to ${lead.assignedSE?.name || "SE"}`);
        setAction(null);
        return;
      }
      if (entry.decision === "cancelled") {
        onUpdateLead({
          ...updated,
          cancellationRequest: {
            status: "pending_manager_approval",
            reason: entry.reason,
            note: entry.note || "",
            requestedAt: new Date(),
            requestedBy: "Telecaller"
          },
          callHistory: [...updated.callHistory, { id: genActivityId(), date: new Date(), disposition: "connected", note: `Cancellation requested \u2014 ${entry.reason}.${entry.note ? ` ${entry.note}` : ""} Sent to SE, TL, and Manager. Only a Manager can approve the cancellation.` }]
        });
        showToast(`\u{1F4E8} Cancellation request sent for manager approval \u2014 ${lead.name}`);
        setAction(null);
        return;
      }
      if (entry.decision === "book") {
        if (entry.bookingIsFullPayment) {
          onUpdateLead({
            ...updated,
            stage: "Retailed",
            propensity: Math.max(lead.propensity, 92),
            lastSEContactDate: new Date(),
            retailDate: entry.bookingRetailDate,
            paymentDetails: { ...entry.bookingPaymentDetails, isFullPayment: true },
            callHistory: [...updated.callHistory, {
              id: genActivityId(),
              date: new Date(),
              disposition: "connected",
              note: `Booked and retailed in one step \u2014 full payment of ${formatINR(paymentDetailsTotal(entry.bookingPaymentDetails))} settled. Retail date: ${entry.bookingRetailDate}.`
            }]
          });
          showToast(`\u{1F389} Retailed \u2014 ${lead.name}`);
          setAction(null);
          return;
        }
        const sourceLabel = PAYMENT_SOURCES.find((p) => p.key === entry.paymentSource)?.label || entry.paymentSource;
        const receiptPart = entry.receiptNumber ? ` Receipt No. ${entry.receiptNumber}.` : "";
        onUpdateLead({
          ...updated,
          stage: "Booking",
          propensity: Math.max(lead.propensity, 92),
          lastSEContactDate: new Date(),
          callHistory: [...updated.callHistory, {
            id: genActivityId(),
            date: new Date(),
            disposition: "connected",
            note: `Booking confirmed \u2014 \u20B9${entry.bookingAmount} booking amount received via ${sourceLabel}.${receiptPart}`
          }]
        });
        showToast(`\u{1F389} Booked \u2014 ${lead.name}`);
        setAction(null);
        return;
      }
      if (entry.decision === "reactivate_same") {
        onUpdateLead({ ...updated, lastSEContactDate: new Date() });
        showToast(`\u2705 Sent back to ${lead.assignedSE.name} with fresh notes`);
        setAction(null);
        return;
      }
      if (entry.decision === "close" || entry.decision === "lost") {
        onUpdateLead({ ...updated, closed: true, closedReason: entry.reason || (entry.decision === "lost" ? "Reactivation \u2014 not interested" : "Not interested at qualification") });
        showToast("Lead closed");
        setAction(null);
        return;
      }
      onUpdateLead(updated);
      showToast("\u2705 Logged");
      setAction(null);
    };
    const handleMarkDelivered = (deliveryDate) => {
      onUpdateLead({
        ...lead,
        stage: "Delivered",
        closed: true,
        actualDeliveryDate: deliveryDate || isoDate(new Date()),
        callHistory: [...lead.callHistory, { id: genActivityId(), date: new Date(), disposition: "connected", note: `Vehicle delivered to customer.${deliveryDate ? ` Delivery date: ${deliveryDate}.` : ""}` }]
      });
      showToast(`\u{1F697} Marked as delivered \u2014 ${lead.name}`);
      setAction(null);
    };
    const handleRetail = (retailDate, paymentDetails) => {
      onUpdateLead({
        ...lead,
        stage: "Retailed",
        retailDate,
        paymentDetails: { ...paymentDetails, isFullPayment: true },
        callHistory: [...lead.callHistory, { id: genActivityId(), date: new Date(), disposition: "connected", note: `Retailed \u2014 full payment of ${formatINR(paymentDetailsTotal(paymentDetails))} settled. Retail date: ${retailDate}.` }]
      });
      showToast(`\u{1F389} Retailed \u2014 ${lead.name}`);
      setAction(null);
    };
    const handleAssign = (se, note) => {
      bumpAssignmentFrequency(se.name);
      onUpdateLead({ ...lead, assignedSE: se, lastSEContactDate: new Date(), assignNote: note });
      showToast(`\u2705 Assigned to ${se.name}`);
      setAction(null);
    };
    const handleTestDrive = (entry) => {
      const modeLabel = TEST_DRIVE_MODES.find((m) => m.key === entry.mode)?.label || entry.mode;
      const locationPart = entry.mode === "location" && entry.locationText ? ` at ${entry.locationText}` : "";
      const dlNote = entry.dlVia ? ` Driving license collected (${entry.dlVia}).` : "";
      onUpdateLead({
        ...lead,
        callHistory: [...lead.callHistory, {
          id: genActivityId(),
          date: new Date(),
          disposition: "test_drive_scheduled",
          testDriveDate: entry.date,
          testDriveSlot: entry.slot,
          testDriveMode: entry.mode,
          note: `Test drive scheduled ${entry.date}, ${entry.slot} \u2014 ${modeLabel}${locationPart}. ${entry.note}`.trim() + dlNote
        }],
        drivingLicense: entry.dlVia ? { done: true, via: entry.dlVia } : lead.drivingLicense
      });
      showToast(`\u2705 Test drive scheduled \u2014 ${lead.assignedSE.name} notified`);
      setAction(null);
    };
    const handleQuote = (entry) => {
      setLastQuote(entry);
      setAction("quote_share");
    };
    const logQuoteMedium = (medium, entry) => {
      const accessoryNote = entry.accessories > 0 ? `, ${formatINR(entry.accessories)} accessories` : "";
      const discountNote = entry.discount > 0 ? `, ${formatINR(entry.discount)} discount` : "";
      onUpdateLead({ ...lead, callHistory: [...lead.callHistory, { id: genActivityId(), date: new Date(), disposition: "quote_sent", note: `Quote sent via ${medium} for ${entry.variant} \u2014 ${formatINR(entry.total)} on-road${accessoryNote}${discountNote}. ${entry.note}`.trim() }] });
      showToast(`\u2705 Quote sent via ${medium} \u2014 ${lead.assignedSE.name} notified`);
    };
    return <div style={{
  background: C.card,
  borderRadius: 16,
  padding: 16,
  marginBottom: 12,
  boxShadow: shadow,
  borderLeft: `3px solid ${priorityColorOf(lead)}`
}}>
  {(() => {
  let reason = null;
  if (lane === "missed_followup") reason = {
    text: `Missed ${Math.max(1, Math.round((today - lead.followUpDate) / 864e5))}d`,
    color: C.hot,
    bg: C.hotSoft
  }; else if (lane === "new" && lead.contacted === 0) reason = {
    text: "\u{1F195} Not yet called",
    color: C.primaryDark,
    bg: C.primarySoft
  }; else if (lane === "dormant" && lead.assignedSE) reason = {
    text: overdueDays === null ? "SE hasn't called" : `SE quiet ${overdueDays}d`,
    color: C.hot,
    bg: C.hotSoft
  }; else if (lane === "dormant" && !lead.assignedSE) reason = {
    text: `Cold ${coldDays}d`,
    color: C.hot,
    bg: C.hotSoft
  }; else if (lane === "with_se" && needsCallToday(lead)) reason = {
    text: callTodayReason(lead),
    color: C.warm,
    bg: C.warmSoft
  };
  return <div style={{
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 8,
  marginBottom: 8
}}>
  {reason ? <span style={{
  display: "inline-flex",
  alignItems: "center",
  background: reason.bg,
  border: `1px solid ${reason.color}35`,
  borderRadius: 7,
  padding: "3px 8px",
  fontFamily: F,
  fontSize: 11,
  fontWeight: 700,
  color: reason.color
}}>
  {reason.text}
</span> : <span />}
  <div style={{
  flexShrink: 0
}}>
    <PropensityStars propensity={lead.propensity} size={13} />
  </div>
</div>;
})()}
  <div style={{
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 8,
  marginBottom: 6
}}>
    <div style={{
  fontFamily: F,
  fontWeight: 800,
  fontSize: 16,
  color: C.ink,
  letterSpacing: -0.2
}}>
      {lead.name}
    </div>
    {lead.assignedSE && <div style={{
  display: "flex",
  alignItems: "center",
  gap: 5,
  flexShrink: 0
}}>
  <User size={11} color={seBannerHealthy(lead) ? C.green : C.hot} />
  <span style={{
  fontFamily: F,
  fontSize: 11,
  color: seBannerHealthy(lead) ? C.green : C.hot,
  fontWeight: 700
}}>
    {lead.assignedSE.name}
  </span>
</div>}
  </div>
  <div style={{
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 8,
  marginBottom: 8
}}>
    <div style={{
  display: "flex",
  alignItems: "center",
  gap: 5
}}>
      <span style={{
  fontFamily: F,
  fontSize: 11.5,
  color: C.ink
}}>
        📞 
        {lead.phone}
      </span>
      {lead.altPhone ? <button onClick={() => setShowAltPhone(v => !v)} style={{
  background: showAltPhone ? C.primarySoft : C.bg,
  border: `1px solid ${showAltPhone ? C.primary : C.borderStrong}`,
  borderRadius: 999,
  width: 17,
  height: 17,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  padding: 0,
  fontFamily: F,
  fontSize: 9.5,
  fontWeight: 800,
  color: showAltPhone ? C.primary : C.sub
}}>
  +1
</button> : <button onClick={() => {
  setAltPhoneDraft("");
  setAddingAltPhone(true);
}} style={{
  background: "none",
  border: `1px dashed ${C.borderStrong}`,
  borderRadius: 999,
  width: 17,
  height: 17,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  padding: 0,
  color: C.sub,
  fontSize: 11,
  lineHeight: 1
}}>
  +
</button>}
    </div>
    {editingEmail ? (() => {
      // Explicit save, same as the alternate number — blur is unreliable on mobile.
      const ok = /\S+@\S+\.\S+/.test(emailDraft.trim());
      const commit = () => { if (!ok) return; onUpdateLead({ ...lead, email: emailDraft.trim() }); setEditingEmail(false); };
      return (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
          <input autoFocus value={emailDraft} inputMode="email"
            onChange={e => setEmailDraft(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditingEmail(false); }}
            placeholder="email@example.com"
            style={{ border: `1px solid ${C.borderStrong}`, borderRadius: 6, padding: "3px 7px",
              fontFamily: F, fontSize: 11.5, color: C.ink, background: C.card, outline: "none", width: 150 }} />
          <button type="button" onClick={commit} disabled={!ok} aria-label="Save email"
            style={{ width: 24, height: 24, borderRadius: 6, border: "none", flexShrink: 0,
              cursor: ok ? "pointer" : "default", background: ok ? C.green : C.borderStrong, color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Check size={13} />
          </button>
          <button type="button" onClick={() => setEditingEmail(false)} aria-label="Cancel email"
            style={{ width: 24, height: 24, borderRadius: 6, flexShrink: 0, cursor: "pointer",
              border: `1px solid ${C.borderStrong}`, background: C.card, color: C.sub,
              display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={12} />
          </button>
        </span>
      );
    })() : <span onClick={() => {
  setEmailDraft(lead.email || "");
  setEditingEmail(true);
}} style={{
  fontFamily: F,
  fontSize: 11.5,
  color: C.sub,
  cursor: "pointer",
  textDecoration: "underline",
  textDecorationColor: C.borderStrong,
  textUnderlineOffset: 2
}}>
  ✉️ 
  {lead.email || "Add email"}
</span>}
  </div>
  {addingAltPhone && (() => {
    // Explicit save. The old version committed on blur, which on mobile often never
    // fired — the number looked typed but was silently dropped.
    const valid = altPhoneDraft.replace(/[^0-9]/g, "").length >= 10;
    const commit = () => {
      if (!valid) return;
      onUpdateLead({ ...lead, altPhone: altPhoneDraft.trim() });
      setAddingAltPhone(false);
      setAltPhoneDraft("");
      setShowAltPhone(true);
    };
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: -2, marginBottom: 10 }}>
        <input autoFocus value={altPhoneDraft} inputMode="numeric"
          onChange={e => setAltPhoneDraft(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setAddingAltPhone(false); setAltPhoneDraft(""); } }}
          placeholder="Alternate number"
          style={{ flex: 1, minWidth: 0, border: `1.5px solid ${C.borderStrong}`, borderRadius: 8,
            padding: "7px 10px", fontFamily: F, fontSize: 12, color: C.ink,
            background: C.card, outline: "none" }} />
        <button type="button" onClick={commit} disabled={!valid} aria-label="Save alternate number"
          style={{ flexShrink: 0, width: 34, height: 34, borderRadius: 8, cursor: valid ? "pointer" : "default",
            border: "none", background: valid ? C.green : C.borderStrong, color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Check size={16} />
        </button>
        <button type="button" onClick={() => { setAddingAltPhone(false); setAltPhoneDraft(""); }}
          aria-label="Cancel"
          style={{ flexShrink: 0, width: 34, height: 34, borderRadius: 8, cursor: "pointer",
            border: `1.5px solid ${C.borderStrong}`, background: C.card, color: C.sub,
            display: "flex", alignItems: "center", justifyContent: "center" }}>
          <X size={15} />
        </button>
      </div>
    );
  })()}
  {showAltPhone && lead.altPhone && <div style={{
  fontFamily: F,
  fontSize: 11,
  color: C.sub,
  marginTop: -4,
  marginBottom: 8
}}>
  Alt: 
  {lead.altPhone}
</div>}
  <div style={{
  display: "flex",
  alignItems: "center",
  gap: 6,
  marginTop: 4,
  marginBottom: 13,
  flexWrap: "wrap"
}}>
    <span style={{
  fontFamily: F,
  fontSize: 9.5,
  fontWeight: 700,
  color: C.faint,
  textTransform: "uppercase",
  letterSpacing: 0.3
}}>
      Prefers
    </span>
    {COMM_PREFS.map(cp => {
  const on = lead.commPref === cp.key;
  return <button onClick={() => onUpdateLead({
  ...lead,
  commPref: on ? null : cp.key
})} style={{
  display: "flex",
  alignItems: "center",
  gap: 3,
  padding: "5px 9px",
  borderRadius: 6,
  border: `1px solid ${on ? C.ink : C.borderStrong}`,
  background: on ? C.ink : "none",
  color: on ? "#fff" : C.sub,
  fontFamily: F,
  fontWeight: 700,
  fontSize: 9.5,
  cursor: "pointer"
}} key={cp.key}>
  <cp.Icon size={9} />
  {cp.label}
</button>;
})}
  </div>
  <div style={{
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
  marginBottom: 13
}}>
    <div ref={modelInterestRowRef} onClick={() => setEditingModelInterest(v => !v)} style={{
  flex: 1,
  minWidth: 0,
  cursor: "pointer"
}}>
      <div style={{
  display: "flex",
  alignItems: "center",
  gap: 4,
  marginBottom: 4
}}>
        <span style={{
  fontFamily: F,
  fontSize: 9,
  fontWeight: 700,
  color: C.sub,
  textTransform: "uppercase",
  letterSpacing: 0.3
}}>
          Interested Vehicle
        </span>
        <Pencil size={10} color={editingModelInterest ? C.primary : C.faint} />
      </div>
      <div style={{
  fontFamily: F,
  fontSize: 12,
  color: C.ink,
  lineHeight: 1.3,
  textDecoration: "underline",
  textDecorationColor: C.borderStrong,
  textUnderlineOffset: 2,
  display: "inline-block"
}}>
        {lead.modelInterest && Object.keys(lead.modelInterest).length ? modelInterestSummary(lead.modelInterest) : lead.model}
        {lead.colorInterest && lead.colorInterest.length > 0 ? ` \u2014 ${lead.colorInterest.join(", ")}` : ""}
      </div>
      {mostRecentTestDrive(lead) && <div style={{
  display: "flex",
  alignItems: "center",
  gap: 4,
  marginTop: 3
}}>
  <Car size={11} color={C.teal} />
  <span style={{
  fontFamily: F,
  fontSize: 10,
  color: C.teal,
  fontWeight: 600
}}>
    Test Drive Scheduled
    {(() => {
  const raw = mostRecentTestDrive(lead).testDriveDate;
  const d2 = raw ? new Date(raw) : null;
  return d2 && !isNaN(d2) ? ` \u2014 ${fmtDate(d2)}` : "";
})()}
  </span>
</div>}
    </div>
    <div ref={deliveryDateRowRef} onClick={() => setEditingDeliveryDate(v => !v)} style={{
  textAlign: "right",
  flexShrink: 0,
  maxWidth: "42%",
  cursor: "pointer"
}}>
      <div style={{
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: 4,
  marginBottom: 2
}}>
        <span style={{
  fontFamily: F,
  fontSize: 9,
  fontWeight: 700,
  color: C.sub,
  textTransform: "uppercase",
  letterSpacing: 0.3
}}>
          Target Delivery
        </span>
        <Pencil size={10} color={editingDeliveryDate ? C.primary : C.faint} />
      </div>
      <div style={{
  fontFamily: F,
  fontSize: 12,
  color: lead.targetDeliveryDate ? C.ink : C.sub,
  textDecoration: "underline",
  textDecorationColor: C.borderStrong,
  textUnderlineOffset: 2,
  display: "inline-block"
}}>
        {lead.targetDeliveryDate ? fmtDate(new Date(lead.targetDeliveryDate)) : "Not set"}
      </div>
    </div>
  </div>
  {editingModelInterest && <div ref={modelInterestEditorRef} style={{
  marginBottom: 10
}}>
  <ModelInterestPicker value={lead.modelInterest && Object.keys(lead.modelInterest).length ? lead.modelInterest : parseModelString(lead.model)} onChange={v => onUpdateLead({
  ...lead,
  modelInterest: v
})} colorValue={lead.colorInterest || []} onColorChange={v => onUpdateLead({
  ...lead,
  colorInterest: v
})} />
</div>}
  {editingDeliveryDate && <div ref={deliveryDateEditorRef} style={{
  marginBottom: 10,
  display: "flex",
  justifyContent: "flex-end"
}}>
  <input ref={deliveryDateInputRef} type="date" value={lead.targetDeliveryDate || ""} onChange={e => {
  onUpdateLead({
    ...lead,
    targetDeliveryDate: e.target.value
  });
  setEditingDeliveryDate(false);
}} style={{
  border: `1.5px solid ${C.borderStrong}`,
  borderRadius: 9,
  padding: "8px 10px",
  fontFamily: F,
  fontSize: 12.5,
  color: C.ink,
  background: C.card,
  outline: "none"
}} />
</div>}
  <div style={{
  background: C.bg,
  border: `1px solid ${C.border}`,
  borderRadius: 10,
  padding: "9px 10px",
  marginBottom: 10
}}>
    <LeadStatusRow lead={lead} onOpenTab={key => setActiveTab(a => a === key ? null : key)} />
    {lastCallRecap(lead) && (() => {
  const recap = lastCallRecap(lead);
  return <div style={{
  display: "flex",
  alignItems: "flex-start",
  gap: 6,
  marginTop: 7
}}>
  <Sparkles size={11} color={C.purple} style={{
  flexShrink: 0,
  marginTop: 2
}} />
  <div style={{
  flex: 1,
  minWidth: 0,
  fontFamily: F,
  fontSize: 11,
  lineHeight: 1.4
}}>
    {recap.note && <span style={{
  color: C.ink
}}>
  {recap.note}
   
</span>}
    <span style={{
  color: C.sub
}}>
      · 
      {recap.when}
    </span>
  </div>
</div>;
})()}
    {lead.callHistory.length > 0 && <button onClick={() => setActiveTab(a => a === "history" ? null : "history")} style={{
  display: "flex",
  alignItems: "center",
  gap: 3,
  background: "none",
  border: "none",
  cursor: "pointer",
  marginTop: 6,
  padding: 0,
  color: C.primary,
  fontFamily: F,
  fontSize: 10.5,
  fontWeight: 700
}}>
  <ChevronRight size={11} style={{
  transform: activeTab === "history" ? "rotate(90deg)" : "none",
  transition: "transform .15s"
}} />
  View Activity
</button>}
    {activeTab === "history" && (() => {
  const total = lead.callHistory.length;
  const hasMore = historyCount < total;
  return <div style={{
  marginTop: 4
}}>
  {focusMode && total > 4 && <div style={{
  background: C.purpleSoft,
  border: `1.5px solid ${C.purple}33`,
  borderRadius: 10,
  padding: 12,
  marginTop: 8,
  marginBottom: 6
}}>
  <div style={{
  display: "flex",
  alignItems: "center",
  gap: 6,
  marginBottom: 6
}}>
    <Sparkles size={13} color={C.purple} />
    <span style={{
  fontFamily: F,
  fontSize: 10.5,
  fontWeight: 800,
  color: C.purple,
  textTransform: "uppercase",
  letterSpacing: 0.5
}}>
      AI Summary
    </span>
  </div>
  {generateActivitySummary(lead).map((line, i) => <div style={{
  fontFamily: F,
  fontSize: 11.5,
  color: C.ink,
  lineHeight: 1.5
}} key={i}>
  {line}
</div>)}
</div>}
  <CallHistoryList history={lead.callHistory} limit={historyCount} />
  {hasMore && <button onClick={() => setHistoryCount(c => c + 2)} style={{
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  background: "none",
  border: `1.5px dashed ${C.borderStrong}`,
  borderRadius: 9,
  padding: "7px 0",
  cursor: "pointer",
  color: C.sub,
  fontFamily: F,
  fontSize: 10.5,
  fontWeight: 700
}}>
  + More (
  {total - historyCount}
   left)
</button>}
</div>;
})()}
  </div>
  {lead.cancellationRequest?.status === "pending_manager_approval" && <div style={{
  display: "flex",
  alignItems: "center",
  gap: 8,
  background: C.hotSoft,
  border: `1.5px solid ${C.hot}55`,
  borderRadius: 10,
  padding: "8px 10px",
  marginBottom: 10
}}>
  <AlertTriangle size={14} color={C.hot} />
  <div>
    <div style={{
  fontFamily: F,
  fontSize: 12,
  color: C.hot,
  fontWeight: 800
}}>
      Cancellation requested — pending Manager approval
    </div>
    <div style={{
  fontFamily: F,
  fontSize: 10.5,
  color: C.sub,
  marginTop: 1
}}>
      Sent to SE, TL, and Manager. Only a Manager can approve this.
    </div>
  </div>
</div>}
  {activeTab === "exchange" && <div style={{
  marginBottom: 10
}}>
  <ExchangeEditPanel lead={lead} onUpdateLead={onUpdateLead} />
</div>}
  {activeTab === "finance" && <div style={{
  marginBottom: 10
}}>
  <FinanceEditPanel lead={lead} onUpdateLead={onUpdateLead} />
</div>}
  {/* A lead already working with a Sales Executive isn't the telecaller's to action —
      say so plainly above the buttons rather than letting them call by mistake. */}
  {!action && lead.assignedSE && (
    <div style={{ display: "flex", alignItems: "center", gap: 7, background: C.warmSoft, border: `1px solid ${C.warm}55`, borderRadius: 9, padding: "8px 10px", marginBottom: 8 }}>
      <AlertTriangle size={13} color={C.warm} style={{ flexShrink: 0 }} />
      <span style={{ fontFamily: F, fontSize: 11, color: C.warm, fontWeight: 700, lineHeight: 1.35 }}>
        Assigned to {lead.assignedSE.name} — check with them before contacting this customer.
      </span>
    </div>
  )}
  {!action && <div style={{
  display: "flex",
  gap: 7
}}>
  <QuickAction icon={Phone} label="Call" tone="primary" onClick={() => {
  if (channelBlocked(lead, "phone")) {
    setContactWarning("call");
    return;
  }
  lead.altPhone ? setAction("call_pick") : (setChosenPhone(lead.phone), setAction("call"));
}} />
  <QuickAction icon={MessageSquare} label="WhatsApp" tone="dark" onClick={() => {
  if (channelBlocked(lead, "whatsapp")) {
    setContactWarning("whatsapp");
    return;
  }
  setAction("whatsapp_pick");
}} />
  {lead.assignedSE ? <>
  {lead.stage === "Booking" ? <QuickAction icon={FileText} label="Mark as Retailed" tone="soft" onClick={() => setAction("retail")} /> : lead.stage === "Retailed" ? <QuickAction icon={CheckCircle2} label="Mark Delivered" tone="soft" onClick={() => setAction("deliver")} /> : <QuickAction icon={Car} label="Test Drive" tone="soft" onClick={() => setAction("testdrive")} />}
  <QuickAction icon={FileText} label="Quote" tone="soft" onClick={() => setAction("quote")} />
</> : null}
</div>}
  {contactWarning && <div style={{
  background: C.hotSoft,
  border: `1.5px solid ${C.hot}`,
  borderRadius: 10,
  padding: "10px 12px",
  marginTop: 8
}}>
  <div style={{
  fontFamily: F,
  fontSize: 11.5,
  fontWeight: 700,
  color: C.hot,
  marginBottom: 2
}}>
    Customer prefers 
    {commPrefMeta(lead.commPref)?.label}
  </div>
  <div style={{
  fontFamily: F,
  fontSize: 10.5,
  color: C.sub,
  marginBottom: 8,
  lineHeight: 1.4
}}>
    Contacting via 
    {contactWarning === "call" ? "phone" : "WhatsApp"}
     goes against what they stated — only proceed if there's a real reason to.
  </div>
  <div style={{
  display: "flex",
  gap: 7
}}>
    <button onClick={() => setContactWarning(null)} style={{
  flex: 1,
  background: "none",
  border: `1.5px solid ${C.borderStrong}`,
  color: C.sub,
  borderRadius: 8,
  padding: "7px 0",
  fontFamily: F,
  fontWeight: 700,
  fontSize: 11.5,
  cursor: "pointer"
}}>
      Cancel
    </button>
    <button onClick={() => {
  const channel = contactWarning;
  setContactWarning(null);
  if (channel === "call") {
    lead.altPhone ? setAction("call_pick") : (setChosenPhone(lead.phone), setAction("call"));
  } else setAction("whatsapp");
}} style={{
  flex: 2,
  background: C.hot,
  color: "#fff",
  border: "none",
  borderRadius: 8,
  padding: "7px 0",
  fontFamily: F,
  fontWeight: 700,
  fontSize: 11.5,
  cursor: "pointer"
}}>
      {contactWarning === "call" ? "Call Anyway" : "Message Anyway"}
    </button>
  </div>
</div>}
  {action === "call_pick" && <PhoneNumberPicker lead={lead} onCancel={() => setAction(null)} onPick={number => {
  setChosenPhone(number);
  setAction("call");
}} />}
  {action === "call" && lead.altPhone && <div style={{
  fontFamily: F,
  fontSize: 11,
  color: C.sub,
  marginTop: 10
}}>
  Calling 
  <strong style={{
  color: C.ink
}}>
    {chosenPhone}
  </strong>
</div>}
    {action === "whatsapp_pick" && (() => {
      const digits = (lead.phone || "").replace(/[^0-9]/g, "");
      // Skip honorifics so "Colonel Vikram Bhatt" greets Vikram, not Colonel.
      const HONORIFICS = ["mr","mrs","ms","dr","col","colonel","capt","captain","maj","major","shri","smt","prof"];
      const parts = (lead.name || "there").replace(/[().]/g, "").split(" ").filter(Boolean);
      const first = parts.find(w => !HONORIFICS.includes(w.toLowerCase())) || parts[0] || "there";
      const model = lead.modelInterest || lead.model || "the car you enquired about";
      // Openers written for a telecaller: qualifying and re-engaging, not closing.
      const OPENERS = [
        { id: "intro", label: "Introduce yourself", note: "First contact after an enquiry",
          Icon: MessageSquare, color: C.teal,
          text: `Hi ${first}, this is ${"Priya"} from Autoprism Hyundai. You enquired about the ${model} — is now a good time to talk for two minutes?` },
        { id: "reengage", label: "Gentle check-in", note: "Re-open a conversation that went quiet",
          Icon: Clock, color: C.purple,
          text: `Hi ${first}, checking in about the ${model}. Are you still looking, or has the plan changed? Either way is fine — just want to stop bothering you if it's the latter.` },
        { id: "slot", label: "Offer a showroom visit", note: "Move them to the sales team",
          Icon: Car, color: C.warm,
          text: `Hi ${first}, we have the ${model} available for a test drive this week. Would a weekday evening or a weekend morning suit you better?` },
      ];
      const openWA = (text) => {
        try { window.open(`https://wa.me/${digits}?text=${encodeURIComponent(text || "")}`, "_blank", "noopener"); } catch (e) {}
        setChosenPhone(lead.phone); setAction("whatsapp_msg");
      };
      return (
        <div style={{ padding: 13, background: C.bg, borderRadius: 12, marginTop: 8 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 11 }}>
            <span style={{ flex: 1, fontFamily: F, fontSize: 13.5, fontWeight: 800, color: C.ink }}>
              Message {first} on WhatsApp
            </span>
            <button type="button" onClick={() => {
              try { window.open(`https://wa.me/${digits}`, "_blank", "noopener"); } catch (e) {}
              setChosenPhone(lead.phone); setAction("whatsapp_call");
            }} style={{
              flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 4,
              background: "none", border: "none", padding: 0, cursor: "pointer",
              fontFamily: F, fontSize: 11.5, fontWeight: 700, color: C.green,
            }}>
              <Phone size={12} /> WhatsApp call instead
            </button>
          </div>
          <div style={{ fontFamily: F, fontSize: 11, color: C.sub, marginBottom: 11, lineHeight: 1.4 }}>
            Pick an opener — it opens in WhatsApp ready to edit before you send.
          </div>
          {OPENERS.map(o => (
            <button key={o.id} type="button" onClick={() => openWA(o.text)} style={{
              display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left",
              padding: "11px 12px", marginBottom: 7, borderRadius: 10, cursor: "pointer",
              border: `1px solid ${C.border}`, background: C.card,
            }}>
              <span style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: o.color + "1A",
                display: "flex", alignItems: "center", justifyContent: "center" }}>
                <o.Icon size={15} color={o.color} />
              </span>
              <span style={{ minWidth: 0 }}>
                <span style={{ display: "block", fontFamily: F, fontSize: 12.5, fontWeight: 700, color: C.ink }}>{o.label}</span>
                <span style={{ display: "block", fontFamily: F, fontSize: 10.5, color: C.faint, marginTop: 1 }}>{o.note}</span>
              </span>
            </button>
          ))}
          <button type="button" onClick={() => openWA("")} style={{
            width: "100%", padding: "11px 0", borderRadius: 10, cursor: "pointer",
            border: `1.5px dashed ${C.borderStrong}`, background: "none",
            fontFamily: F, fontSize: 12.5, fontWeight: 700, color: C.sub, marginBottom: 7,
          }}>Write my own message</button>
          <button type="button" onClick={() => setAction(null)} style={{
            width: "100%", padding: "8px 0", borderRadius: 9, cursor: "pointer",
            border: `1.5px solid ${C.borderStrong}`, background: C.card,
            fontFamily: F, fontSize: 11.5, fontWeight: 700, color: C.sub,
          }}>Cancel</button>
        </div>
      );
    })()}
  {(action === "call" || action === "whatsapp_call" || action === "whatsapp_msg") && lane === "new" && (
    <QualificationCallForm lead={lead} channel={action.startsWith("whatsapp") ? action : "call"} onSave={applyCallOrWhatsApp} onCancel={() => setAction(null)} allLeads={allLeads} showToast={showToast} />
  )}
  {(action === "call" || action === "whatsapp_call" || action === "whatsapp_msg") && lane !== "new" && (
    <ReactivationCallForm lead={lead} channel={action.startsWith("whatsapp") ? action : "call"} onSave={applyCallOrWhatsApp} onCancel={() => setAction(null)} allLeads={allLeads} showToast={showToast} />
  )}
  {action === "testdrive" && <TestDriveForm onSave={handleTestDrive} onCancel={() => setAction(null)} allLeads={allLeads} excludeLeadId={lead.id} showToast={showToast} customerName={lead.name} />}
  {action === "retail" && <RetailForm onSave={handleRetail} onCancel={() => setAction(null)} />}
  {action === "deliver" && <DeliveryForm onSave={handleMarkDelivered} onCancel={() => setAction(null)} />}
  {action === "quote" && <QuoteForm model={lead.model} onSave={handleQuote} onCancel={() => setAction(null)} />}
  {action === "quote_share" && lastQuote && <QuoteShareScreen lead={lead} quote={lastQuote} onMediumUsed={medium => logQuoteMedium(medium, lastQuote)} onDone={() => setAction(null)} />}
</div>;
  }

function FocusModeScreen({ leads, onUpdateLead, showToast, onExit }) {
    const [queueIds] = useState(() => buildFocusQueueIds(leads));
    const [index, setIndex] = useState(0);
    const currentId = queueIds[index];
    const currentLead = leads.find((l) => l.id === currentId);
    const total = queueIds.length;
    const wrappedUpdate = (updated) => {
      const hadHistory = currentLead ? currentLead.callHistory.length : 0;
      onUpdateLead(updated);
      if (updated.callHistory.length > hadHistory || updated.closed) {
        setTimeout(() => setIndex((i) => i + 1), 450);
      }
    };
    return <div style={{
  display: "flex",
  flexDirection: "column",
  height: "100%"
}}>
  <div style={{
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "12px 14px",
  background: C.card,
  borderBottom: `1px solid ${C.border}`
}}>
    <div style={{
  display: "flex",
  alignItems: "center",
  gap: 8
}}>
      <Zap size={16} color={C.primary} />
      <span style={{
  fontFamily: F,
  fontWeight: 800,
  fontSize: 13,
  color: C.ink
}}>
        Focus Mode
      </span>
    </div>
    <div style={{
  display: "flex",
  alignItems: "center",
  gap: 12
}}>
      <span style={{
  fontFamily: F,
  fontWeight: 800,
  fontSize: 13,
  color: C.primary
}}>
        {Math.min(index, total)}
        /
        {total}
         worked
      </span>
      <button onClick={onExit} style={{
  background: "none",
  border: `1.5px solid ${C.borderStrong}`,
  borderRadius: 8,
  padding: "5px 10px",
  cursor: "pointer",
  fontFamily: F,
  fontWeight: 700,
  fontSize: 11,
  color: C.sub
}}>
        Exit
      </button>
    </div>
  </div>
  <div style={{
  flex: 1,
  minHeight: 0,
  overflowY: "auto",
  padding: 14
}}>
    {currentLead ? <LeadRow lead={currentLead} onUpdateLead={wrappedUpdate} showToast={showToast} focusMode={true} allLeads={leads} key={currentLead.id} /> : <div style={{
  textAlign: "center",
  padding: "60px 20px"
}}>
  <CheckCircle2 size={36} color={C.green} style={{
  marginBottom: 12
}} />
  <div style={{
  fontFamily: F,
  fontWeight: 800,
  fontSize: 16,
  color: C.ink,
  marginBottom: 6
}}>
    All done
  </div>
  <div style={{
  fontFamily: F,
  fontSize: 13,
  color: C.sub,
  marginBottom: 20
}}>
    {total}
    /
    {total}
     worked. Nice run.
  </div>
  <button onClick={onExit} style={{
  background: C.primary,
  color: "#fff",
  border: "none",
  borderRadius: 10,
  padding: "10px 20px",
  fontFamily: F,
  fontWeight: 700,
  fontSize: 13,
  cursor: "pointer"
}}>
    Back to Queue
  </button>
</div>}
  </div>
</div>;
  }

function QuoteShareScreen({ lead, quote, onMediumUsed, onDone }) {
    const [sentVia, setSentVia] = useState([]);
    const [otherOpen, setOtherOpen] = useState(false);
    const [otherText, setOtherText] = useState("");
    const markSent = (medium) => {
      if (!sentVia.includes(medium)) {
        setSentVia((s) => [...s, medium]);
        onMediumUsed(medium);
      }
    };
    const summaryText = [
      `Quote for ${lead.name} \u2014 ${quote.variant}`,
      "",
      `Ex-Showroom: ${formatINR(quote.exShowroom)}`,
      `RTO: ${formatINR(quote.rto)}`,
      `Insurance: ${formatINR(quote.insurance)}`,
      ...quote.tcs > 0 ? [`TCS: ${formatINR(quote.tcs)}`] : [],
      `Handling: ${formatINR(quote.handling)}`,
      ...quote.accessories > 0 ? [`Accessories: ${formatINR(quote.accessories)}`] : [],
      ...quote.discount > 0 ? [`Discount: -${formatINR(quote.discount)}`] : [],
      "",
      `On-Road Total: ${formatINR(quote.total)}`,
      "",
      "\u2014 Autoprism"
    ].join("\n");
    const phoneDigits = (lead.phone || "").replace(/\D/g, "");
    const waLink = `https://wa.me/${phoneDigits}?text=${encodeURIComponent(summaryText)}`;
    const mailLink = `mailto:${encodeURIComponent(lead.email || "")}?subject=${encodeURIComponent(`Your quote for ${quote.variant}`)}&body=${encodeURIComponent(summaryText)}`;
    const smsLink = `sms:${phoneDigits}?body=${encodeURIComponent(summaryText)}`;
    const copyToClipboard = () => {
      if (navigator.clipboard) navigator.clipboard.writeText(summaryText);
      markSent("Copy Text");
    };
    const breakdownRows = [
      ["Ex-Showroom Price", quote.exShowroom],
      ["RTO (Registration)", quote.rto],
      ["Insurance (1st year)", quote.insurance],
      ...quote.tcs > 0 ? [["TCS", quote.tcs]] : [],
      ["Handling & Logistics", quote.handling],
      ...quote.accessories > 0 ? [["Accessories", quote.accessories]] : [],
      ...quote.discount > 0 ? [["Discount", -quote.discount]] : []
    ];
    return <div style={{
  background: C.bg,
  border: `1px solid ${C.borderStrong}`,
  borderRadius: 14,
  padding: 14,
  marginTop: 10
}}>
  <div style={{
  display: "flex",
  alignItems: "center",
  gap: 6,
  marginBottom: 12
}}>
    <CheckCircle2 size={14} color={C.green} />
    <span style={{
  fontFamily: F,
  fontSize: 11.5,
  color: C.green,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: 0.5
}}>
      Quote Ready
    </span>
  </div>
  <div id="quote-print-area" style={{
  background: "#fff",
  border: `1.5px solid ${C.border}`,
  borderRadius: 14,
  padding: 16,
  marginBottom: 14
}}>
    <div style={{
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 12,
  paddingBottom: 10,
  borderBottom: `1px solid ${C.border}`
}}>
      <span style={{
  fontFamily: F,
  fontWeight: 900,
  fontSize: 14,
  color: C.ink,
  letterSpacing: -0.5,
  textTransform: "uppercase"
}}>
        AUTOPRISM
        <span style={{
  display: "inline-block",
  width: 4,
  height: 4,
  borderRadius: "50%",
  background: C.primary,
  marginLeft: 1
}} />
      </span>
      <span style={{
  fontFamily: F,
  fontSize: 10,
  color: C.sub
}}>
        {fmtDate(new Date())}
      </span>
    </div>
    <div style={{
  fontFamily: F,
  fontWeight: 800,
  fontSize: 15,
  color: C.ink,
  marginBottom: 2
}}>
      {quote.variant}
    </div>
    <div style={{
  fontFamily: F,
  fontSize: 11.5,
  color: C.sub,
  marginBottom: 14
}}>
      Quote for 
      {lead.name}
    </div>
    {breakdownRows.map(([label, amt]) => <div style={{
  display: "flex",
  justifyContent: "space-between",
  padding: "5px 0"
}} key={label}>
  <span style={{
  fontFamily: F,
  fontSize: 12,
  color: C.sub
}}>
    {label}
  </span>
  <span style={{
  fontFamily: F,
  fontSize: 12,
  color: C.ink,
  fontWeight: 600
}}>
    {amt < 0 ? "\u2212 " : ""}
    {formatINR(Math.abs(amt))}
  </span>
</div>)}
    <div style={{
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: 10,
  paddingTop: 10,
  borderTop: `1.5px solid ${C.ink}`
}}>
      <span style={{
  fontFamily: F,
  fontWeight: 800,
  fontSize: 13,
  color: C.ink
}}>
        On-Road Total
      </span>
      <span style={{
  fontFamily: F,
  fontWeight: 900,
  fontSize: 19,
  color: C.primary
}}>
        {formatINR(quote.total)}
      </span>
    </div>
  </div>
  <div style={{
  fontFamily: F,
  fontSize: 10.5,
  fontWeight: 700,
  color: C.sub,
  marginBottom: 8
}}>
    {sentVia.length > 0 ? `Sent via ${sentVia.join(", ")} \u2014 send another way if needed` : "Share this quote"}
  </div>
  <div style={{
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  marginBottom: otherOpen ? 10 : 14
}}>
    <ShareButton icon={MessageSquare} label="WhatsApp" href={waLink} onClick={() => markSent("WhatsApp")} color={C.green} sent={sentVia.includes("WhatsApp")} />
    <ShareButton icon={Mail} label="Email" href={mailLink} onClick={() => markSent("Email")} color={C.cold} sent={sentVia.includes("Email")} />
    <ShareButton icon={Phone} label="SMS" href={smsLink} onClick={() => markSent("SMS")} color={C.warm} sent={sentVia.includes("SMS")} />
    <ShareButton icon={Copy} label="Copy Text" onClick={copyToClipboard} color={C.ink} sent={sentVia.includes("Copy Text")} />
    <ShareButton icon={Download} label="Save as PDF" onClick={() => {
  window.print();
  markSent("PDF");
}} color={C.ink} sent={sentVia.includes("PDF")} />
    <ShareButton icon={MoreHorizontal} label="Other" onClick={() => setOtherOpen(v => !v)} color={C.sub} sent={sentVia.some(m => m.startsWith("Other:"))} />
  </div>
  {otherOpen && <div style={{
  display: "flex",
  gap: 8,
  marginBottom: 14
}}>
  <input value={otherText} onChange={e => setOtherText(e.target.value)} placeholder="How did you share it?" style={{
  flex: 1,
  border: `1.5px solid ${C.borderStrong}`,
  borderRadius: 9,
  padding: "9px 11px",
  fontFamily: F,
  fontSize: 12.5,
  color: C.ink,
  background: C.card,
  outline: "none"
}} />
  <button onClick={() => {
  if (otherText.trim()) {
    markSent(`Other: ${otherText.trim()}`);
    setOtherText("");
    setOtherOpen(false);
  }
}} style={{
  padding: "0 16px",
  borderRadius: 9,
  border: "none",
  background: otherText.trim() ? C.primary : C.ghost,
  color: otherText.trim() ? "#fff" : C.sub,
  fontFamily: F,
  fontWeight: 700,
  fontSize: 12.5,
  cursor: otherText.trim() ? "pointer" : "default"
}}>
    Log
  </button>
</div>}
  <button onClick={onDone} style={{
  width: "100%",
  padding: "10px 0",
  borderRadius: 10,
  border: "none",
  background: C.primary,
  color: "#fff",
  fontFamily: F,
  fontWeight: 700,
  fontSize: 12.5,
  cursor: "pointer"
}}>
    Done
  </button>
</div>;
  }

/* ============================== SCREENS (rebuilt) ==============================
   These five screens and NAV_ITEMS were lost and have been rebuilt. They use the
   recovered components (LeadRow, FilterSheet, Header, MenuDrawer) and follow the same
   layout conventions as the Sales Executive app: a compact command row, a single-line
   target bar, then content. */

// Two-level menu, matching the agreed navigation. A telecaller does not get Teams,
// Reports or Admin Settings — those are privilege-gated for TL and above.
const NAV_ITEMS = [
  { key: "leads", label: "Leads", Icon: ClipboardList, subs: [
    { key: "queue:all",      label: "All Leads" },
    { key: "queue",          label: "Call Queue" },
    { key: "queue:followup", label: "Follow-Ups" },
    { key: "delivery",       label: "Post-Delivery" },
    { key: "activity",       label: "Recent Activity" },
  ]},
  { key: "inventory", label: "Inventory", Icon: Car, subs: [
    { key: "inventory:new",      label: "New Cars" },
    { key: "inventory:preowned", label: "Pre-Owned" },
    { key: "inventory:demo",     label: "Demo Cars" },
  ]},
  { key: "performance", label: "Performance", Icon: BarChart3, subs: [
    { key: "dashboard", label: "Dashboard" },
  ]},
  { key: "learning", label: "Learning", Icon: GraduationCap, subs: [] },
  { key: "account", label: "My Account", Icon: User, subs: [
    { key: "account:profile",  label: "Profile" },
    { key: "account:password", label: "Password" },
    { key: "account:language", label: "Language" },
    { key: "account:email",    label: "Email ID" },
  ]},
];

function CallQueueScreen({ leads, onUpdateLead, showToast, onEnterFocusMode, onAddLead, customSources, onAddCustomSource }) {
  const [query, setQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState([]);
  const [stageFilter, setStageFilter] = useState([]);
  const [modelFilter, setModelFilter] = useState([]);
  const [customerTypeFilter, setCustomerTypeFilter] = useState([]);
  const [ageFilter, setAgeFilter] = useState("");
  const [filtersPanelOpen, setFiltersPanelOpen] = useState(false);
  const [showAddLead, setShowAddLead] = useState(false);
  // What's typed vs what's actually applied. Nothing filters until Enter — a rep half-way
  // through typing a phone number shouldn't watch the queue empty out under them.
  const [queryDraft, setQueryDraft] = useState("");
  const runSearch = () => setQuery(queryDraft.trim());
  const clearSearch = () => { setQueryDraft(""); setQuery(""); };
  const [exitingIds, setExitingIds] = useState(new Set());
  const [recentlyActedIds, setRecentlyActedIds] = useState(new Set());

  // A lead already handed to a Sales Executive is not the telecaller's to work. It stays out
  // of the queue entirely and only surfaces on an explicit name/phone search, so the rep can
  // look it up when a customer calls in — but can't accidentally work someone else's lead.
  const searching = !!query.trim();
  const isMine = (l) => !l.assignedSE;
  const allActive = leads.filter(l =>
    !l.closed && !recentlyActedIds.has(l.id) && (searching || isMine(l))
  );
  const clearFilters = () => { setQuery(""); setQueryDraft(""); setSourceFilter([]); setStageFilter([]); setModelFilter([]); setCustomerTypeFilter([]); setAgeFilter(""); };
  const filtersActive = !!(query.trim() || sourceFilter.length || stageFilter.length || modelFilter.length || customerTypeFilter.length || ageFilter);

  const matches = (l) => {
    if (query.trim() && !leadMatchesQuery(l, query)) return false;
    if (sourceFilter.length && !sourceFilter.includes(l.source)) return false;
    if (modelFilter.length && !modelFilter.includes(l.model)) return false;
    if (customerTypeFilter.length && !customerTypeFilter.includes(l.customerType)) return false;
    if (stageFilter.length && !stageFilter.some(k => leadMatchesStageFilterKey(l, k))) return false;
    if (ageFilter) {
      const b = AGE_BUCKETS.find(x => x.key === ageFilter);
      if (b && !b.test(leadAgeDays(l))) return false;
    }
    return true;
  };
  const active = allActive.filter(matches);

  // Draft filter state — nothing applies until the sheet's CTA is tapped.
  const [draftFilters, setDraftFilters] = useState({ stage: [], source: [], model: [], customer: [], age: [] });
  const openFilterSheet = () => {
    setDraftFilters({ stage: stageFilter, source: sourceFilter, model: modelFilter, customer: customerTypeFilter, age: ageFilter ? [ageFilter] : [] });
    setFiltersPanelOpen(true);
  };
  const applyDraftFilters = () => {
    setStageFilter(draftFilters.stage); setSourceFilter(draftFilters.source);
    setModelFilter(draftFilters.model); setCustomerTypeFilter(draftFilters.customer);
    setAgeFilter(draftFilters.age[0] || "");
    setFiltersPanelOpen(false);
  };
  const countFor = (pred) => leads.filter(l => !l.closed && pred(l)).length;
  const draftResultCount = leads.filter(l => {
    const d = draftFilters;
    if (l.closed) return false;
    if (d.source.length && !d.source.includes(l.source)) return false;
    if (d.model.length && !d.model.includes(l.model)) return false;
    if (d.customer.length && !d.customer.includes(l.customerType)) return false;
    if (d.stage.length && !d.stage.some(k => leadMatchesStageFilterKey(l, k))) return false;
    if (d.age.length) {
      const b = AGE_BUCKETS.find(x => x.key === d.age[0]);
      if (b && !b.test(leadAgeDays(l))) return false;
    }
    return true;
  }).length;
  const filterGroups = [
    { key: "stage",    label: "Stage",         options: STAGE_FILTER_OPTIONS.map(o => ({ key: o.key, label: o.label, count: countFor(l => leadMatchesStageFilterKey(l, o.key)) })) },
    { key: "source",   label: "Source",        options: [...new Set(leads.map(l => l.source))].sort().map(sv => ({ key: sv, label: sv, count: countFor(l => l.source === sv) })) },
    { key: "model",    label: "Model",         options: [...new Set(leads.map(l => l.model).filter(Boolean))].sort().map(m => ({ key: m, label: m, count: countFor(l => l.model === m) })) },
    { key: "customer", label: "Customer Type", options: CUSTOMER_TYPES.map(ct => ({ key: ct, label: ct, count: countFor(l => l.customerType === ct) })) },
    { key: "age",      label: "Lead Age",      options: AGE_BUCKETS.map(b => ({ key: b.key, label: b.label, count: countFor(l => b.test(leadAgeDays(l))) })) },
  ];

  // A lead leaves today's queue when it has been WORKED — a call logged, an SE assigned,
  // a follow-up set, or it was closed. Editing a detail (alternate number, email, model
  // interest) is not working the lead, and used to make the card vanish mid-edit.
  const wrappedUpdate = (updated, opts = {}) => {
    const before = leads.find(l => l.id === updated.id) || {};
    const worked =
      opts.worked === true ||
      (updated.callHistory || []).length !== (before.callHistory || []).length ||
      updated.contacted !== before.contacted ||
      !!updated.assignedSE !== !!before.assignedSE ||
      updated.followUpDate !== before.followUpDate ||
      !!updated.closed !== !!before.closed;
    onUpdateLead(updated);
    if (!worked) return;
    setExitingIds(s => new Set([...s, updated.id]));
    setTimeout(() => setRecentlyActedIds(s => new Set([...s, updated.id])), 650);
  };

  // Telecaller target is a daily qualification count, not call volume.
  const todayStr = new Date().toDateString();
  const qualifiedToday = leads.filter(l => l.assignedSE && l.lastSEContactDate && new Date(l.lastSEContactDate).toDateString() === todayStr).length;
  const dailyTarget = 8;
  const pct = Math.min(100, (qualifiedToday / dailyTarget) * 100);

  return (
    <div style={{ padding: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 11, padding: "9px 12px", flex: 1, minWidth: 0 }}>
          <Search size={14} color={C.faint} />
          <input value={queryDraft} onChange={e => setQueryDraft(e.target.value)} placeholder="Search by name, phone, or model…"
            type="search" inputMode="search" enterKeyHint="search"
            onKeyDown={e => { if (e.key === "Enter") { runSearch(); e.currentTarget.blur(); } }}
            style={{ border: "none", outline: "none", flex: 1, minWidth: 0, fontFamily: F, fontSize: 12.5, color: C.ink, background: "none", WebkitAppearance: "none" }} />
          {(queryDraft || query) && <button onClick={clearSearch} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}><X size={13} color={C.faint} /></button>}
        </div>
        <button onClick={openFilterSheet} style={{
          position: "relative", display: "flex", alignItems: "center", justifyContent: "center", width: 38, height: 38, borderRadius: 11, flexShrink: 0,
          border: `1.5px solid ${filtersActive ? C.primary : C.border}`, background: filtersActive ? C.primarySoft : C.card, cursor: "pointer",
        }}>
          <Filter size={15} color={filtersActive ? C.primary : C.sub} />
          {filtersActive && <span style={{ position: "absolute", top: 6, right: 6, width: 6, height: 6, borderRadius: "50%", background: C.hot }} />}
        </button>
        <button onClick={onEnterFocusMode} title="Focus / auto-dial mode" style={{
          display: "flex", alignItems: "center", justifyContent: "center", width: 38, height: 38, borderRadius: 11, flexShrink: 0,
          border: `1.5px solid ${C.primary}`, background: C.primary, cursor: "pointer",
        }}><Zap size={16} color="#fff" /></button>
        <button onClick={() => setShowAddLead(true)} title="Add lead" style={{
          display: "flex", alignItems: "center", justifyContent: "center", width: 38, height: 38, borderRadius: 11, flexShrink: 0,
          border: `1.5px solid #0B1946`, background: "#0B1946", cursor: "pointer",
        }}><UserPlus size={16} color="#fff" /></button>
      </div>

      <FilterSheet
        open={filtersPanelOpen}
        onClose={() => setFiltersPanelOpen(false)}
        groups={filterGroups}
        draft={draftFilters}
        setDraft={setDraftFilters}
        onApply={applyDraftFilters}
        onClearAll={() => setDraftFilters({ stage: [], source: [], model: [], customer: [], age: [] })}
        resultCount={draftResultCount}
      />

      {filtersActive && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10, alignItems: "center" }}>
          {stageFilter.map(k => <FilterChip key={"s" + k} label={(STAGE_FILTER_OPTIONS.find(o => o.key === k) || {}).label || k} onRemove={() => setStageFilter(f => f.filter(x => x !== k))} />)}
          {sourceFilter.map(k => <FilterChip key={"src" + k} label={k} onRemove={() => setSourceFilter(f => f.filter(x => x !== k))} />)}
          {modelFilter.map(k => <FilterChip key={"m" + k} label={k} onRemove={() => setModelFilter(f => f.filter(x => x !== k))} />)}
          {customerTypeFilter.map(k => <FilterChip key={"c" + k} label={k} onRemove={() => setCustomerTypeFilter(f => f.filter(x => x !== k))} />)}
          {ageFilter && <FilterChip label={(AGE_BUCKETS.find(b => b.key === ageFilter) || {}).label || ageFilter} onRemove={() => setAgeFilter("")} />}
          <button onClick={clearFilters} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: F, fontSize: 11.5, fontWeight: 700, color: C.hot, padding: "4px 6px" }}>Clear all</button>
        </div>
      )}

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "9px 12px", marginBottom: 12, boxShadow: shadow, display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 3, flexShrink: 0 }}>
          <span style={{ fontFamily: F, fontWeight: 900, fontSize: 18, color: qualifiedToday >= dailyTarget ? C.green : C.ink, letterSpacing: -0.5, lineHeight: 1 }}>{qualifiedToday}</span>
          <span style={{ fontFamily: F, fontWeight: 500, fontSize: 11, color: C.ghost }}>/{dailyTarget}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
            <span style={{ fontFamily: F, fontSize: 9, fontWeight: 700, color: C.sub, textTransform: "uppercase", letterSpacing: 0.6 }}>Leads qualified · today</span>
            <span style={{ fontFamily: F, fontSize: 10, fontWeight: 700, color: qualifiedToday >= dailyTarget ? C.green : C.primary }}>
              {qualifiedToday >= dailyTarget ? "Target hit 🎯" : `${dailyTarget - qualifiedToday} more`}
            </span>
          </div>
          <div style={{ height: 4, background: C.border, borderRadius: 999, overflow: "hidden" }}>
            <div style={{ width: `${pct}%`, height: "100%", background: qualifiedToday >= dailyTarget ? C.green : C.primary, borderRadius: 999, transition: "width .5s" }} />
          </div>
        </div>
      </div>

      {filtersActive && (
        <div style={{ fontFamily: F, fontSize: 10, color: C.sub, marginBottom: 8 }}>{active.length} of {allActive.length} match filters</div>
      )}

      <div style={{ fontFamily: F, fontWeight: 800, fontSize: 14, color: C.ink, marginBottom: 10 }}>
        Call Queue <span style={{ color: C.primary }}>({active.length})</span>
      </div>

      {active.length === 0 && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24, textAlign: "center", fontFamily: F, fontSize: 13, color: C.sub }}>
          {filtersActive ? "No leads match your filters." : "Queue is clear. 🎉"}
        </div>
      )}

      {active.map(lead => (
        <LeadRow key={lead.id} lead={lead} onUpdateLead={wrappedUpdate} showToast={showToast} allLeads={leads} />
      ))}

      {showAddLead && (
        <AddLeadForm
          onSave={(data) => { onAddLead(data); setShowAddLead(false); }}
          onCancel={() => setShowAddLead(false)}
          customSources={customSources}
          onAddCustomSource={onAddCustomSource}
        />
      )}
    </div>
  );
}

function RecentActivityScreen({ leads, onUpdateLead, showToast }) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState(null);

  // Flatten every logged call across leads into one reverse-chronological feed.
  const entries = leads.flatMap(l =>
    (l.callHistory || []).map(h => ({ ...h, lead: l }))
  ).sort((a, b) => new Date(b.date) - new Date(a.date));

  const types = [...new Set(entries.map(e => e.disposition).filter(Boolean))];
  const shown = entries.filter(e => {
    const q = query.trim().toLowerCase();
    if (q && !(e.lead.name.toLowerCase().includes(q) || (e.note || "").toLowerCase().includes(q))) return false;
    if (typeFilter && e.disposition !== typeFilter) return false;
    return true;
  });

  return (
    <div style={{ padding: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 11, padding: "9px 12px", marginBottom: 10 }}>
        <Search size={14} color={C.faint} />
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search activity…"
          type="search" enterKeyHint="search" onKeyDown={e => { if (e.key === "Enter") e.currentTarget.blur(); }}
          style={{ border: "none", outline: "none", flex: 1, fontFamily: F, fontSize: 12.5, color: C.ink, background: "none" }} />
        {query && <button onClick={() => setQuery("")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}><X size={13} color={C.faint} /></button>}
      </div>

      {types.length > 1 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
          <button onClick={() => setTypeFilter(null)} style={chipStyle(!typeFilter)}>All</button>
          {types.map(t => (
            <button key={t} onClick={() => setTypeFilter(t === typeFilter ? null : t)} style={chipStyle(typeFilter === t)}>
              {EXTRA_DISPOSITION_LABELS[t] || t}
            </button>
          ))}
        </div>
      )}

      <div style={{ fontFamily: F, fontWeight: 800, fontSize: 14, color: C.ink, marginBottom: 10 }}>
        Recent Activity <span style={{ color: C.primary }}>({shown.length})</span>
      </div>

      {shown.length === 0 && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24, textAlign: "center", fontFamily: F, fontSize: 13, color: C.sub }}>
          Nothing logged yet.
        </div>
      )}

      {shown.map((e, i) => (
        <div key={e.id || i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 12, marginBottom: 8, boxShadow: shadow }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontFamily: F, fontWeight: 700, fontSize: 13, color: C.ink }}>{e.lead.name}</span>
            <span style={{ fontFamily: F, fontSize: 10.5, color: C.faint }}>{relativeTime(new Date(e.date))}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <span style={{ fontFamily: F, fontSize: 10, fontWeight: 700, color: C.primary, background: C.primarySoft, borderRadius: 6, padding: "2px 7px" }}>
              {EXTRA_DISPOSITION_LABELS[e.disposition] || e.disposition}
            </span>
            {e.recordingDuration && (
              <span style={{ fontFamily: F, fontSize: 10, color: C.faint }}>· {e.recordingDuration}</span>
            )}
          </div>
          {e.note && <div style={{ fontFamily: F, fontSize: 11.5, color: C.sub, lineHeight: 1.45 }}>{e.note}</div>}
        </div>
      ))}
    </div>
  );
}

function PostDeliveryScreen({ leads, onUpdateLead, showToast }) {
  const delivered = leads.filter(l => l.stage === "Delivered" || l.stage === "Retailed");
  return (
    <div style={{ padding: 14 }}>
      <div style={{ fontFamily: F, fontWeight: 800, fontSize: 14, color: C.ink, marginBottom: 4 }}>Post-delivery</div>
      <div style={{ fontFamily: F, fontSize: 11.5, color: C.sub, marginBottom: 12 }}>
        Feedback calls for customers who've taken delivery.
      </div>
      {delivered.length === 0 && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24, textAlign: "center", fontFamily: F, fontSize: 13, color: C.sub }}>
          No deliveries pending feedback.
        </div>
      )}
      {delivered.map(lead => (
        <LeadRow key={lead.id} lead={lead} onUpdateLead={onUpdateLead} showToast={showToast} allLeads={leads} />
      ))}
    </div>
  );
}

/* ============================== INVENTORY — UNIT LEVEL ==============================
   The old screen showed "5 Cretas", which is an abstraction an SE can't act on. What they
   actually need to know is whether a specific physical car exists in the customer's colour
   and whether they can hold it. So the source of truth here is individual units, each with
   a VIN, chassis and engine number, and every count on screen is derived from them. */

const EV_MODELS = ["Ioniq 5"];
const isEV = (model) => EV_MODELS.includes(model);

// Waiting period when nothing is in stock or in transit for a combination. Real dealerships
// quote these off the OEM allocation cycle; here they're per-model so a rep can still give
// the customer an honest answer instead of "let me check".
const WAITING_WEEKS = { "Creta": 6, "Alcazar": 8, "Tucson": 10, "Ioniq 5": 12, "Venue": 4, "Verna": 5, "Exter": 3, "i20": 4 };

const UNIT_STATUS = {
  in_stock:   { label: "In Stock",   color: C.green,  soft: C.greenSoft },
  in_transit: { label: "In Transit", color: C.cold,   soft: C.coldSoft },
  blocked:    { label: "Blocked",    color: C.purple, soft: C.purpleSoft || "#F3EEFF" },
  low_stock:  { label: "Low Stock",  color: C.warm,   soft: C.warmSoft },
  no_stock:   { label: "No Stock",   color: C.faint,  soft: C.bg },
};

// Deterministic generator so the demo data is stable across renders but still looks like a
// real yard — most combinations have a unit or two, some have none, a few are in transit.
function buildInventoryUnits() {
  const units = [];
  let seq = 0;
  const branches = ["Indiranagar", "Whitefield"];
  Object.entries(MODEL_VARIANTS).forEach(([model, variants]) => {
    variants.forEach((variant, vi) => {
      COLOR_OPTIONS.forEach((color, ci) => {
        // Not every colour of every variant is stocked — that's the point of the screen.
        const h = hashStr(model + variant + color);
        const count = h % 7 === 0 ? 2 : h % 5 === 0 ? 1 : h % 3 === 0 ? 1 : 0;
        for (let n = 0; n < count; n++) {
          seq += 1;
          const inTransit = (h + n) % 4 === 0;
          const ev = isEV(model);
          units.push({
            id: `U${seq}`,
            category: "new",
            model, variant, color,
            vin: `MA1${String(h % 900 + 100)}${model.slice(0, 2).toUpperCase()}${String(seq).padStart(5, "0")}`,
            chassis: `CH${String(h % 90000 + 10000)}${seq}`,
            engineNo: ev ? null : `EN${String((h * 7) % 90000 + 10000)}${seq}`,
            motorNo: ev ? `MT${String((h * 7) % 90000 + 10000)}${seq}` : null,
            status: inTransit ? "in_transit" : "in_stock",
            branch: branches[(h + n) % 2],
            etaDays: inTransit ? ((h + n) % 12) + 3 : null,
            mfgMonth: ["Jan 2026", "Feb 2026", "Mar 2026", "Apr 2026"][(h + n) % 4],
            priceLakh: (VARIANT_PRICES[model] || {})[variant] || null,
            ev: ev ? {
              batteryKwh: variant.includes("Long Range") ? 72.6 : 58,
              rangeKm: variant.includes("Long Range") ? 631 : 481,
              charger: "CCS2 · 350 kW DC",
              batteryWarranty: "8 yrs / 1,60,000 km",
            } : null,
            blockedFor: null,
          });
        }
      });
    });
  });
  return units;
}

// Demo and used cars are a much smaller, hand-listed set — they're individual assets, not
// allocations off a production line, so they carry odometer and ownership instead of ETA.
const DEMO_USED_UNITS = [
  { id: "D1", category: "demo", model: "Creta", variant: "SX(O) Turbo DCT", color: "Atlas White",
    vin: "MA1DEMO00001", chassis: "CHD10001", engineNo: "END10001", status: "in_stock",
    branch: "Indiranagar", odometer: "4,120 km", mfgMonth: "Nov 2025", priceLakh: 18.4, ev: null, blockedFor: null },
  { id: "D2", category: "demo", model: "Ioniq 5", variant: "AWD Long Range", color: "Titan Grey",
    vin: "MA1DEMO00002", chassis: "CHD10002", engineNo: null, motorNo: "MTD10002", status: "in_stock",
    branch: "Whitefield", odometer: "2,860 km", mfgMonth: "Dec 2025", priceLakh: 45.9,
    ev: { batteryKwh: 72.6, rangeKm: 631, charger: "CCS2 · 350 kW DC", batteryWarranty: "8 yrs / 1,60,000 km" }, blockedFor: null },
  { id: "D3", category: "demo", model: "Venue", variant: "SX Dual Tone", color: "Fiery Red",
    vin: "MA1DEMO00003", chassis: "CHD10003", engineNo: "END10003", status: "in_stock",
    branch: "Indiranagar", odometer: "6,540 km", mfgMonth: "Oct 2025", priceLakh: 11.2, ev: null, blockedFor: null },

  { id: "P1", category: "used", model: "Creta", variant: "SX", color: "Abyss Black",
    vin: "MA1USED00001", chassis: "CHU10001", engineNo: "ENU10001", status: "in_stock",
    branch: "Indiranagar", odometer: "38,200 km", mfgMonth: "2022", owners: 1, priceLakh: 13.4, ev: null, blockedFor: null },
  { id: "P2", category: "used", model: "i20", variant: "Asta (O)", color: "Titan Grey",
    vin: "MA1USED00002", chassis: "CHU10002", engineNo: "ENU10002", status: "in_stock",
    branch: "Whitefield", odometer: "51,700 km", mfgMonth: "2021", owners: 2, priceLakh: 7.1, ev: null, blockedFor: null },
  { id: "P3", category: "used", model: "Verna", variant: "SX Turbo", color: "Atlas White",
    vin: "MA1USED00003", chassis: "CHU10003", engineNo: "ENU10003", status: "in_stock",
    branch: "Indiranagar", odometer: "22,400 km", mfgMonth: "2023", owners: 1, priceLakh: 12.8, ev: null, blockedFor: null },
];

// Rolls a set of units up into the status shown on a collapsed row.
function rollupStatus(units, model) {
  const free = units.filter(u => u.status === "in_stock" && !u.blockedFor);
  const transit = units.filter(u => u.status === "in_transit");
  if (free.length === 0 && transit.length === 0) {
    return { key: "no_stock", label: "No Stock", detail: `~${WAITING_WEEKS[model] || 6} wks wait` };
  }
  if (free.length === 0) return { key: "in_transit", label: "In Transit", detail: `${transit.length} arriving` };
  if (free.length <= 2) return { key: "low_stock", label: "Low Stock", detail: `${free.length} free` };
  return { key: "in_stock", label: "In Stock", detail: `${free.length} free` };
}

function StatusPill({ status, detail }) {
  const meta = UNIT_STATUS[status] || UNIT_STATUS.no_stock;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: meta.soft, borderRadius: 999, padding: "3px 9px", flexShrink: 0 }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: meta.color }} />
      <span style={{ fontFamily: F, fontSize: 9.5, fontWeight: 800, color: meta.color, whiteSpace: "nowrap" }}>{meta.label}</span>
      {detail && <span style={{ fontFamily: F, fontSize: 9.5, color: meta.color, opacity: 0.8, whiteSpace: "nowrap" }}>· {detail}</span>}
    </span>
  );
}

/* ---- Blocking a unit for a customer ---- */
// Two guards, both of which reflect real dealership failures:
//   1. A car can only be held once the booking amount is in — otherwise stock gets tied up
//      against verbal interest and other SEs lose sales they could have closed.
//   2. If the unit doesn't match what the customer actually booked (different variant or
//      colour), the SE has to acknowledge the mismatch. This is the drift that causes a
//      customer to turn up on delivery day to a car they didn't order.
function BlockUnitSheet({ unit, leads, onClose, onConfirm, waitlistMode }) {
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState(null);
  // Not a checkbox. Changing the car a customer is buying is a decision with a consequence
  // either way, so the SE has to say which one it is: finalise this car and move the
  // booking onto it, or go back and find the car that was actually booked.
  const [resolution, setResolution] = useState(null); // null | "finalise" | "wrong_car"

  const term = q.trim().toLowerCase();
  const matches = !term ? [] : leads.filter(l =>
    l.name.toLowerCase().includes(term) || l.phone.replace(/\s/g, "").includes(term.replace(/\s/g, ""))
  ).slice(0, 6);

  const bookingPaid = waitlistMode || (picked && (picked.stage === "Booking" || picked.stage === "Retailed" || !!picked.bookingAmount));
  const mismatches = picked ? [
    picked.model && picked.model !== unit.model ? { field: "Model", booked: picked.model, unit: unit.model } : null,
    picked.variant && picked.variant !== unit.variant ? { field: "Variant", booked: picked.variant, unit: unit.variant } : null,
    picked.colorInterest?.length && !picked.colorInterest.includes(unit.color) ? { field: "Colour", booked: picked.colorInterest.join(", "), unit: unit.color } : null,
  ].filter(Boolean) : [];

  const canConfirm = picked && bookingPaid && (mismatches.length === 0 || resolution === "finalise");

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 220, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)" }} onClick={onClose} />
      <div style={{ position: "relative", background: C.card, borderRadius: "18px 18px 0 0", maxHeight: "88vh", overflowY: "auto", padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontFamily: F, fontSize: 16, fontWeight: 800, color: C.ink }}>{waitlistMode ? "Add to waitlist" : "Block this car"}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}><X size={18} color={C.sub} /></button>
        </div>
        <div style={{ fontFamily: F, fontSize: 11.5, color: C.sub, marginBottom: 14 }}>
          {unit.model} {unit.variant} · {unit.color}{waitlistMode ? " · no stock — joining the queue" : ` · VIN ${unit.vin}`}
        </div>

        <div style={{ fontFamily: F, fontSize: 10, fontWeight: 700, color: C.faint, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Find the customer</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.bg, border: `1.5px solid ${C.borderStrong}`, borderRadius: 10, padding: "9px 12px", marginBottom: 8 }}>
          <Search size={14} color={C.faint} />
          <input value={q} onChange={e => { setQ(e.target.value); setPicked(null); setResolution(null); }}
            placeholder="Name or phone number" autoFocus
            style={{ border: "none", outline: "none", flex: 1, fontFamily: F, fontSize: 12.5, color: C.ink, background: "none" }} />
        </div>

        {!picked && matches.map(l => (
          <button key={l.id} onClick={() => setPicked(l)} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%",
            background: C.card, border: `1px solid ${C.border}`, borderRadius: 9, padding: "9px 11px",
            marginBottom: 6, cursor: "pointer", textAlign: "left",
          }}>
            <span>
              <span style={{ display: "block", fontFamily: F, fontSize: 12.5, fontWeight: 700, color: C.ink }}>{l.name}</span>
              <span style={{ display: "block", fontFamily: F, fontSize: 10.5, color: C.faint }}>{l.phone} · {l.model || "—"}</span>
            </span>
            <ChevronRight size={14} color={C.faint} />
          </button>
        ))}
        {term && !picked && matches.length === 0 && (
          <div style={{ fontFamily: F, fontSize: 11.5, color: C.faint, padding: "8px 2px" }}>No customer matches "{q}".</div>
        )}

        {picked && (
          <>
            <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: 11, marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontFamily: F, fontSize: 13, fontWeight: 700, color: C.ink }}>{picked.name}</span>
                <button onClick={() => { setPicked(null); setResolution(null); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: F, fontSize: 10.5, fontWeight: 700, color: C.primary }}>Change</button>
              </div>
              <div style={{ fontFamily: F, fontSize: 10.5, color: C.faint, marginTop: 2 }}>{picked.phone}</div>
            </div>

            {!bookingPaid && (
              <div style={{ display: "flex", gap: 8, background: C.hotSoft, border: `1px solid ${C.hot}55`, borderRadius: 10, padding: 11, marginBottom: 10 }}>
                <AlertTriangle size={14} color={C.hot} style={{ flexShrink: 0, marginTop: 1 }} />
                <div style={{ fontFamily: F, fontSize: 11.5, color: C.hot, lineHeight: 1.4 }}>
                  <strong>Booking amount not received.</strong> A car can only be held once the booking is paid — otherwise it sits blocked while another customer could have taken it.
                </div>
              </div>
            )}

            {bookingPaid && mismatches.length > 0 && (
              <div style={{ background: C.warmSoft, border: `1px solid ${C.warm}66`, borderRadius: 10, padding: 11, marginBottom: 10 }}>
                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <AlertTriangle size={14} color={C.warm} style={{ flexShrink: 0, marginTop: 1 }} />
                  <div style={{ fontFamily: F, fontSize: 11.5, fontWeight: 700, color: C.warm }}>
                    This car doesn't match what {picked.name.split(" ")[0]} booked
                  </div>
                </div>
                {mismatches.map(m => (
                  <div key={m.field} style={{ display: "flex", gap: 6, fontFamily: F, fontSize: 11, marginBottom: 3, paddingLeft: 22 }}>
                    <span style={{ color: C.faint, width: 52, flexShrink: 0 }}>{m.field}</span>
                    <span style={{ color: C.sub, textDecoration: "line-through" }}>{m.booked}</span>
                    <span style={{ color: C.faint }}>→</span>
                    <span style={{ color: C.ink, fontWeight: 700 }}>{m.unit}</span>
                  </div>
                ))}
                <div style={{ paddingLeft: 22, marginTop: 10 }}>
                  <div style={{ fontFamily: F, fontSize: 11, fontWeight: 700, color: C.warm, marginBottom: 7 }}>
                    Is this car finalised, replacing the one that was booked?
                  </div>
                  <div style={{ display: "flex", gap: 7 }}>
                    <button onClick={() => setResolution("finalise")} style={{
                      flex: 1, padding: "8px 0", borderRadius: 8, cursor: "pointer",
                      border: `1.5px solid ${resolution === "finalise" ? C.green : C.borderStrong}`,
                      background: resolution === "finalise" ? C.greenSoft : C.card,
                      color: resolution === "finalise" ? C.green : C.sub,
                      fontFamily: F, fontWeight: 700, fontSize: 11.5,
                    }}>Yes — finalise this car</button>
                    <button onClick={() => setResolution("wrong_car")} style={{
                      flex: 1, padding: "8px 0", borderRadius: 8, cursor: "pointer",
                      border: `1.5px solid ${resolution === "wrong_car" ? C.hot : C.borderStrong}`,
                      background: resolution === "wrong_car" ? C.hotSoft : C.card,
                      color: resolution === "wrong_car" ? C.hot : C.sub,
                      fontFamily: F, fontWeight: 700, fontSize: 11.5,
                    }}>No</button>
                  </div>

                  {resolution === "finalise" && (
                    <div style={{ display: "flex", gap: 7, marginTop: 9, background: C.greenSoft, borderRadius: 8, padding: "8px 10px" }}>
                      <CheckCircle2 size={13} color={C.green} style={{ flexShrink: 0, marginTop: 1 }} />
                      <span style={{ fontFamily: F, fontSize: 10.5, color: C.green, lineHeight: 1.4 }}>
                        The booking will be updated to this {unit.variant} in {unit.color}, and the change logged on {picked.name.split(" ")[0]}'s record.
                      </span>
                    </div>
                  )}
                  {resolution === "wrong_car" && (
                    <div style={{ display: "flex", gap: 7, marginTop: 9, background: C.hotSoft, borderRadius: 8, padding: "8px 10px" }}>
                      <AlertTriangle size={13} color={C.hot} style={{ flexShrink: 0, marginTop: 1 }} />
                      <span style={{ fontFamily: F, fontSize: 10.5, color: C.hot, lineHeight: 1.4 }}>
                        Then this isn't the right car. Close this and pick the {picked.variant || picked.model}
                        {picked.colorInterest?.length ? ` in ${picked.colorInterest.join(" or ")}` : ""} the customer actually booked.
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        <button
          onClick={() => canConfirm && onConfirm(unit, picked, mismatches, resolution)}
          style={{
            width: "100%", marginTop: 4, padding: "13px 0", borderRadius: 11, border: "none",
            background: canConfirm ? C.primary : C.ghost, color: "#fff",
            fontFamily: F, fontWeight: 800, fontSize: 13.5, cursor: canConfirm ? "pointer" : "default",
          }}>
          {!picked ? "Select a customer"
            : !bookingPaid ? "Booking amount required"
            : mismatches.length && resolution === "wrong_car" ? "Pick the booked car instead"
            : mismatches.length && !resolution ? "Answer the question above"
            : waitlistMode ? "Add to waitlist" : mismatches.length ? "Block & update booking"
            : "Block this car"}
        </button>
      </div>
    </div>
  );
}

function UnitRow({ unit, onBlock, onRelease, onArrived }) {
  const [open, setOpen] = useState(false);
  const blocked = !!unit.blockedFor;
  return (
    <div style={{ borderTop: `1px solid ${C.border}` }}>
      <button onClick={() => setOpen(o => !o)} style={{
        display: "flex", alignItems: "center", gap: 8, width: "100%",
        padding: "9px 0", background: "none", border: "none", cursor: "pointer", textAlign: "left",
      }}>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "block", fontFamily: F, fontSize: 11.5, fontWeight: 700, color: C.ink }}>
            VIN {unit.vin}
          </span>
          <span style={{ display: "block", fontFamily: F, fontSize: 10, color: C.faint, marginTop: 1 }}>
            {unit.branch}
            {unit.status === "in_transit" && unit.etaDays ? ` · arriving in ${unit.etaDays}d` : ""}
            {unit.odometer ? ` · ${unit.odometer}` : ""}
            {unit.owners ? ` · ${unit.owners} owner${unit.owners > 1 ? "s" : ""}` : ""}
          </span>
        </span>
        {blocked
          ? <StatusPill status="blocked" detail={`by ${unit.blockedFor.by?.split(" ")[0] || "SE"}`} />
          : <StatusPill status={unit.status} />}
        <ChevronDown size={13} color={C.faint} style={{ flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform .18s" }} />
      </button>

      {open && (
        <div style={{ padding: "0 0 11px" }}>
          <div style={{ background: C.bg, borderRadius: 9, padding: 10, marginBottom: 9 }}>
            {[
              ["VIN", unit.vin],
              ["Chassis no.", unit.chassis],
              [unit.ev ? "Motor no." : "Engine no.", unit.ev ? unit.motorNo : unit.engineNo],
              ["Manufactured", unit.mfgMonth],
              ["Location", unit.branch],
              unit.priceLakh ? ["Ex-showroom", `₹${unit.priceLakh} L`] : null,
            ].filter(Boolean).map(([k, v]) => (
              <div key={k} style={{ display: "flex", gap: 8, marginBottom: 4 }}>
                <span style={{ fontFamily: F, fontSize: 10.5, color: C.faint, width: 92, flexShrink: 0 }}>{k}</span>
                <span style={{ fontFamily: F, fontSize: 10.5, color: C.ink, fontWeight: 600, wordBreak: "break-all" }}>{v}</span>
              </div>
            ))}
          </div>

          {unit.ev && (
            <div style={{ background: C.tealSoft, borderRadius: 9, padding: 10, marginBottom: 9 }}>
              <div style={{ fontFamily: F, fontSize: 9.5, fontWeight: 800, color: C.teal, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Electric vehicle</div>
              {[
                ["Battery", `${unit.ev.batteryKwh} kWh`],
                ["Certified range", `${unit.ev.rangeKm} km`],
                ["Fast charging", unit.ev.charger],
                ["Battery warranty", unit.ev.batteryWarranty],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontFamily: F, fontSize: 10.5, color: C.teal, opacity: 0.75, width: 92, flexShrink: 0 }}>{k}</span>
                  <span style={{ fontFamily: F, fontSize: 10.5, color: C.teal, fontWeight: 700 }}>{v}</span>
                </div>
              ))}
            </div>
          )}

          {blocked ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.card, border: `1px solid ${C.border}`, borderRadius: 9, padding: "9px 11px" }}>
              <Lock size={13} color={C.purple} />
              <span style={{ flex: 1, fontFamily: F, fontSize: 11, color: C.sub, lineHeight: 1.45 }}>
                Held for <strong style={{ color: C.ink }}>{unit.blockedFor.name}</strong> · {unit.blockedFor.phone}
                <span style={{ display: "block", color: C.faint, fontSize: 10, marginTop: 2 }}>
                  Blocked by {unit.blockedFor.by || "an SE"}
                  {unit.blockedFor.at ? ` · ${fmtDate(new Date(unit.blockedFor.at))}` : ""}
                </span>
              </span>
              <button onClick={() => onRelease(unit)} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: F, fontSize: 11, fontWeight: 700, color: C.hot }}>Release</button>
            </div>
          ) : unit.status === "in_stock" ? (
            <button onClick={() => onBlock(unit)} style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%",
              background: C.primarySoft, border: `1.5px solid ${C.primary}44`, borderRadius: 9,
              padding: "9px 0", cursor: "pointer", fontFamily: F, fontSize: 11.5, fontWeight: 700, color: C.primary,
            }}>
              <Lock size={12} />Block for a customer
            </button>
          ) : (
            <button onClick={() => onArrived && onArrived(unit)} style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%",
              background: C.coldSoft, border: `1.5px solid ${C.cold}44`, borderRadius: 9,
              padding: "9px 0", cursor: "pointer", fontFamily: F, fontSize: 11.5, fontWeight: 700, color: C.cold,
            }}>
              <Package size={12} />Mark arrived at branch
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// `canAllocate` separates what a telecaller needs from what a Sales Executive needs.
// A telecaller answers "is there a white Creta and how soon" — availability, not identity.
// Only the SE, who owns the deal, sees which physical car it is and can hold one.
/* ============================== USED CAR STOCK ==============================
   Consumer marketplaces (CarWale, Cars24, Spinny) answer "is this car good and can I
   trust it". A sales rep needs the answer to a different question: can I sell this car,
   to whom, at what price, and how fast. So alongside the consumer-facing material —
   photos, inspection scores, spec — this carries the things a marketplace deliberately
   hides from buyers: what we paid, what we've spent, what the floor price is, how long
   it's been sitting, and who's asked about it.

   Structural note: used cars are NOT rendered through the model→variant→colour tree the
   way new stock is. Every used car is a unique asset with its own history, so each gets
   its own card. */

const INSPECTION_AREAS = [
  { key: "engine",    label: "Engine & transmission", Icon: Settings },
  { key: "ac",        label: "Air conditioning",      Icon: Wind },
  { key: "steering",  label: "Steering, suspension & brakes", Icon: Navigation },
  { key: "exterior",  label: "Exterior & tyres",      Icon: Car },
  { key: "interior",  label: "Interior & electricals", Icon: Sparkles },
];

const DOC_CHECKLIST = [
  { key: "rc",        label: "RC (original)" },
  { key: "insurance", label: "Insurance" },
  { key: "noc",       label: "NOC / hypothecation clear" },
  { key: "service",   label: "Service history" },
  { key: "duplicate", label: "Duplicate key" },
];

// Retail readiness — a rep should never promise a delivery date on a car that hasn't
// finished refurb or photography.
const READINESS = {
  retail_ready: { label: "Retail ready",   color: C.green,  soft: C.greenSoft },
  refurb:       { label: "In refurb",      color: C.warm,   soft: C.warmSoft },
  docs_pending: { label: "Docs pending",   color: C.hot,    soft: C.hotSoft },
  photos:       { label: "Photos pending", color: C.cold,   soft: C.coldSoft },
};

const USED_STOCK = [
  {
    id: "D1", kind: "demo", brand: "Hyundai",
    model: "Creta", variant: "SX(O) Turbo DCT", year: 2025, color: "Atlas White",
    vin: "MA1DEMO00001", chassis: "CHD10001", engineNo: "END10001",
    regNo: "TS09 DM 0011", regCity: "Hyderabad", odometer: 4120, fuel: "Petrol",
    transmission: "Automatic", owners: 1, branch: "Indiranagar",
    cost: { purchase: 1720000, refurb: 12000 }, ask: 1840000, floor: 1780000,
    daysInStock: 41, enquiries: 4, testDrives: 11,
    readiness: "retail_ready",
    inspection: { engine: 5, ac: 5, steering: 5, exterior: 4.5, interior: 4.5 },
    defects: ["Light wear on driver seat bolster from test drives"],
    docs: { rc: true, insurance: true, noc: true, service: true, duplicate: true },
    insuranceTill: "Jan 2028", photos: 24,
    highlights: ["Dealership demo", "Full service history", "Under warranty", "Non-accidental"],
    blockedFor: null,
  },
  {
    id: "D2", kind: "demo", brand: "Hyundai",
    model: "Ioniq 5", variant: "AWD Long Range", year: 2025, color: "Titan Grey",
    vin: "MA1DEMO00002", chassis: "CHD10002", engineNo: null, motorNo: "MTD10002",
    regNo: "TS07 DM 0022", regCity: "Hyderabad", odometer: 2860, fuel: "Electric",
    transmission: "Automatic", owners: 1, branch: "Whitefield",
    cost: { purchase: 4320000, refurb: 8000 }, ask: 4590000, floor: 4460000,
    daysInStock: 27, enquiries: 7, testDrives: 14,
    readiness: "retail_ready",
    inspection: { engine: 5, ac: 5, steering: 5, exterior: 5, interior: 5 },
    defects: [],
    docs: { rc: true, insurance: true, noc: true, service: true, duplicate: true },
    insuranceTill: "Feb 2028", photos: 26,
    highlights: ["Dealership demo", "Battery health 98%", "Under warranty", "Non-accidental"],
    ev: { batteryKwh: 72.6, rangeKm: 631, charger: "CCS2 · 350 kW DC", batteryWarranty: "8 yrs / 1,60,000 km" },
    blockedFor: null,
  },
  {
    id: "D3", kind: "demo", brand: "Hyundai",
    model: "Venue", variant: "SX Dual Tone", year: 2024, color: "Fiery Red",
    vin: "MA1DEMO00003", chassis: "CHD10003", engineNo: "END10003",
    regNo: "TS09 DM 0033", regCity: "Hyderabad", odometer: 6540, fuel: "Petrol",
    transmission: "Manual", owners: 1, branch: "Indiranagar",
    cost: { purchase: 1010000, refurb: 18000 }, ask: 1120000, floor: 1065000,
    daysInStock: 88, enquiries: 2, testDrives: 9,
    readiness: "retail_ready",
    inspection: { engine: 4.5, ac: 5, steering: 4.5, exterior: 4, interior: 4 },
    defects: ["Minor stone chips on bonnet", "Rear parcel tray scuffed"],
    docs: { rc: true, insurance: true, noc: true, service: true, duplicate: true },
    insuranceTill: "Jun 2027", photos: 19,
    highlights: ["Dealership demo", "Full service history", "Under warranty"],
    blockedFor: null,
  },
  {
    id: "P1", kind: "used", brand: "Hyundai", model: "Creta", variant: "SX", year: 2022, color: "Abyss Black",
    vin: "MA1USED00001", chassis: "CHU10001", engineNo: "ENU10001",
    regNo: "TS09 EA 4471", regCity: "Hyderabad", odometer: 38200, fuel: "Petrol",
    transmission: "Manual", owners: 1, branch: "Indiranagar",
    // Money the customer never sees.
    cost: { purchase: 1080000, refurb: 46000 }, ask: 1340000, floor: 1265000,
    daysInStock: 18, enquiries: 6, testDrives: 2,
    readiness: "retail_ready",
    inspection: { engine: 4.5, ac: 5, steering: 4, exterior: 4, interior: 4.5 },
    defects: ["Minor scuff on rear bumper", "Both front tyres at ~40% tread"],
    docs: { rc: true, insurance: true, noc: true, service: true, duplicate: true },
    insuranceTill: "Mar 2027", photos: 21,
    highlights: ["Single owner", "Full service history", "Non-accidental", "Original paint"],
    blockedFor: null,
  },
  {
    id: "P2", kind: "used", brand: "Hyundai", model: "i20", variant: "Asta (O)", year: 2021, color: "Titan Grey",
    vin: "MA1USED00002", chassis: "CHU10002", engineNo: "ENU10002",
    regNo: "TS07 FB 9902", regCity: "Hyderabad", odometer: 51700, fuel: "Petrol",
    transmission: "Manual", owners: 2, branch: "Whitefield",
    cost: { purchase: 560000, refurb: 38000 }, ask: 710000, floor: 662000,
    daysInStock: 63, enquiries: 2, testDrives: 0,
    readiness: "retail_ready",
    inspection: { engine: 4, ac: 3.5, steering: 4, exterior: 3.5, interior: 4 },
    defects: ["AC cooling weak — gas top-up done, monitor", "Windscreen chip, driver side", "Alloy kerb rash x2"],
    docs: { rc: true, insurance: true, noc: true, service: false, duplicate: false },
    insuranceTill: "Nov 2026", photos: 18,
    highlights: ["Second owner", "Accident-free", "New battery"],
    blockedFor: null,
  },
  {
    id: "P3", kind: "used", brand: "Hyundai", model: "Verna", variant: "SX Turbo", year: 2023, color: "Atlas White",
    vin: "MA1USED00003", chassis: "CHU10003", engineNo: "ENU10003",
    regNo: "TS10 GC 1188", regCity: "Hyderabad", odometer: 22400, fuel: "Petrol",
    transmission: "Automatic", owners: 1, branch: "Indiranagar",
    cost: { purchase: 1040000, refurb: 22000 }, ask: 1280000, floor: 1195000,
    daysInStock: 6, enquiries: 9, testDrives: 4,
    readiness: "photos",
    inspection: { engine: 5, ac: 5, steering: 4.5, exterior: 4.5, interior: 5 },
    defects: [],
    docs: { rc: true, insurance: true, noc: true, service: true, duplicate: true },
    insuranceTill: "Aug 2027", photos: 6,
    highlights: ["Single owner", "Under warranty till 2026", "Full service history", "Non-accidental"],
    blockedFor: null,
  },
  {
    id: "P5", kind: "used", brand: "Maruti Suzuki",
    model: "Baleno", variant: "Zeta", year: 2021, color: "Titan Grey",
    vin: "MA1USED00005", chassis: "CHU10005", engineNo: "ENU10005",
    regNo: "TS08 JK 5521", regCity: "Hyderabad", odometer: 44300, fuel: "Petrol",
    transmission: "Manual", owners: 1, branch: "Whitefield",
    cost: { purchase: 585000, refurb: 29000 }, ask: 725000, floor: 678000,
    daysInStock: 31, enquiries: 3, testDrives: 1,
    readiness: "retail_ready",
    inspection: { engine: 4, ac: 4.5, steering: 4, exterior: 4, interior: 4 },
    defects: ["Rear bumper repainted"],
    docs: { rc: true, insurance: true, noc: true, service: true, duplicate: true },
    insuranceTill: "Sep 2026", photos: 17,
    highlights: ["Single owner", "Exchange intake", "Full service history"],
    blockedFor: null,
  },
  {
    id: "P6", kind: "used", brand: "Tata",
    model: "Nexon", variant: "XZ+", year: 2022, color: "Abyss Black",
    vin: "MA1USED00006", chassis: "CHU10006", engineNo: "ENU10006",
    regNo: "TS10 LM 7734", regCity: "Hyderabad", odometer: 33900, fuel: "Petrol",
    transmission: "Manual", owners: 1, branch: "Indiranagar",
    cost: { purchase: 790000, refurb: 34000 }, ask: 965000, floor: 902000,
    daysInStock: 12, enquiries: 5, testDrives: 2,
    readiness: "photos",
    inspection: { engine: 4.5, ac: 4, steering: 4, exterior: 4, interior: 4.5 },
    defects: ["Front left alloy kerb rash"],
    docs: { rc: true, insurance: true, noc: true, service: false, duplicate: true },
    insuranceTill: "Dec 2026", photos: 9,
    highlights: ["Single owner", "Exchange intake", "5-star safety"],
    blockedFor: null,
  },
  {
    id: "P4", kind: "used", brand: "Hyundai", model: "Venue", variant: "S Turbo", year: 2020, color: "Fiery Red",
    vin: "MA1USED00004", chassis: "CHU10004", engineNo: "ENU10004",
    regNo: "AP28 HD 3390", regCity: "Vijayawada", odometer: 74800, fuel: "Petrol",
    transmission: "Manual", owners: 2, branch: "Whitefield",
    cost: { purchase: 520000, refurb: 71000 }, ask: 690000, floor: 640000,
    daysInStock: 104, enquiries: 1, testDrives: 0,
    readiness: "docs_pending",
    inspection: { engine: 3.5, ac: 4, steering: 3, exterior: 3, interior: 3.5 },
    defects: ["Clutch nearing replacement", "Rear-left door repainted", "Suspension noise over bumps", "Other-state registration — NOC pending"],
    docs: { rc: true, insurance: false, noc: false, service: false, duplicate: true },
    insuranceTill: "Expired", photos: 14,
    highlights: ["Priced to move"],
    blockedFor: null,
  },
];

const inr = (n) => "₹" + Number(n).toLocaleString("en-IN");
const lakh = (n) => "₹" + (n / 100000).toFixed(2) + " L";
const totalCost = (u) => u.cost.purchase + u.cost.refurb;
const margin = (u) => u.ask - totalCost(u);
const marginPct = (u) => Math.round((margin(u) / totalCost(u)) * 100);
const inspectionAvg = (u) => {
  const v = Object.values(u.inspection);
  return (v.reduce((a, b) => a + b, 0) / v.length).toFixed(1);
};
// Ageing is the number that should make a rep act. Floor-plan interest and depreciation
// run whether or not anyone is looking at the car.
const ageBand = (d) =>
  d <= 30 ? { label: "Fresh stock",   color: C.green } :
  d <= 60 ? { label: "Watch",          color: C.warm } :
  d <= 90 ? { label: "Ageing",         color: C.hot } :
            { label: "Overdue — escalate", color: C.hot };

function ScoreStars({ score, size = 11 }) {
  const full = Math.floor(score), half = score % 1 >= 0.5;
  const tone = score >= 4 ? C.green : score >= 3 ? C.warm : C.hot;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 3,
      background: score >= 4 ? C.greenSoft : score >= 3 ? C.warmSoft : C.hotSoft,
      borderRadius: 6, padding: "2px 7px" }}>
      <Star size={size} color={tone} fill={tone} />
      <span style={{ fontFamily: F, fontSize: 10.5, fontWeight: 800, color: tone }}>{score}</span>
    </span>
  );
}

// Photo strip. Real listings carry 15–25 shots; what a rep needs to know at a glance is
// whether the set is complete enough to send to a customer.
function PhotoStrip({ unit, onAddPhotos }) {
  const cats = ["Exterior", "Interior", "Tyres", "Engine", "Damage"];
  const enough = unit.photos >= 15;
  return (
    <div>
      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 6 }}>
        {cats.map((c, i) => (
          <div key={c} style={{ flexShrink: 0, width: 78 }}>
            <div style={{
              height: 56, borderRadius: 8, background: `linear-gradient(135deg, ${C.bg} 0%, ${C.border} 100%)`,
              border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Camera size={15} color={C.faint} />
            </div>
            <div style={{ fontFamily: F, fontSize: 9, color: C.sub, textAlign: "center", marginTop: 3 }}>{c}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
        <span style={{ flex: 1, fontFamily: F, fontSize: 10, color: enough ? C.faint : C.hot, fontWeight: enough ? 500 : 700 }}>
          {unit.photos} photos{enough ? "" : " — too few to share with a customer"}
        </span>
        <button onClick={(e) => { e.stopPropagation(); onAddPhotos && onAddPhotos(unit); }} style={{
          display: "flex", alignItems: "center", gap: 4, background: enough ? "none" : C.primarySoft,
          border: `1px solid ${enough ? C.border : C.primary + "44"}`, borderRadius: 7,
          padding: "4px 9px", cursor: "pointer",
          fontFamily: F, fontSize: 10, fontWeight: 700, color: enough ? C.sub : C.primary,
        }}><Plus size={10} />Add photos</button>
      </div>
    </div>
  );
}

function UsedCarCard({ unit, leads, onBlock, onRelease, currentUser, showToast, onAddPhotos }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("condition");
  const [showCost, setShowCost] = useState(false);
  const age = ageBand(unit.daysInStock);
  const ready = READINESS[unit.readiness];
  const docsMissing = DOC_CHECKLIST.filter(d => !unit.docs[d.key]);

  // Reverse-match: which of my live leads are actually looking for this car. This is the
  // thing a consumer app has no reason to build, and the thing that turns dead stock.
  const matches = (leads || []).filter(l =>
    !l.closed && l.model === unit.model &&
    !["Delivered", "Retailed", "Lost"].includes(l.stage)
  ).slice(0, 4);

  return (
    <div style={{ background: C.card, border: `1px solid ${open ? C.primary + "55" : C.border}`,
      borderRadius: 14, marginBottom: 10, overflow: "hidden" }}>

      {/* ---- Collapsed card ---- */}
      <button onClick={() => setOpen(o => !o)} style={{
        display: "block", width: "100%", background: "none", border: "none",
        padding: 0, cursor: "pointer", textAlign: "left",
      }}>
        <div style={{ display: "flex", gap: 11, padding: 12 }}>
          <div style={{
            width: 92, height: 68, borderRadius: 9, flexShrink: 0, position: "relative",
            background: `linear-gradient(135deg, ${C.bg} 0%, ${C.border} 100%)`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Car size={24} color={C.ghost} />
            <span style={{ position: "absolute", bottom: 4, left: 4, background: "rgba(0,0,0,0.6)",
              borderRadius: 4, padding: "1px 5px", fontFamily: F, fontSize: 8.5, color: "#fff", fontWeight: 700 }}>
              {unit.photos} 📷
            </span>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
              <span style={{ minWidth: 0 }}>
                {/* Demo cars sit in the same list but carry a tag — the distinction matters
                    for the pitch (low km, warranty intact) not for where the car lives. */}
                {unit.kind === "demo" && (
                  <span style={{ display: "inline-block", background: C.tealSoft, color: C.teal,
                    borderRadius: 5, padding: "1px 6px", marginBottom: 3,
                    fontFamily: F, fontSize: 8.5, fontWeight: 800, letterSpacing: 0.4 }}>
                    DEMO CAR
                  </span>
                )}
                <span style={{ display: "block", fontFamily: F, fontSize: 13, fontWeight: 800, color: C.ink, lineHeight: 1.25 }}>
                  {unit.year} {unit.model} {unit.variant}
                </span>
              </span>
              <ScoreStars score={Number(inspectionAvg(unit))} />
            </div>
            <div style={{ fontFamily: F, fontSize: 10, color: C.faint, marginTop: 2 }}>
              {unit.brand} · {unit.color} · {unit.regNo}
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 7, marginTop: 5 }}>
              <span style={{ fontFamily: F, fontSize: 15, fontWeight: 900, color: C.ink, letterSpacing: -0.3 }}>
                {lakh(unit.ask)}
              </span>
              <span style={{ fontFamily: F, fontSize: 10, fontWeight: 700, color: margin(unit) > 0 ? C.green : C.hot }}>
                {marginPct(unit)}% margin
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", padding: "0 12px 10px" }}>
          {[`${(unit.odometer / 1000).toFixed(0)}k km`, unit.fuel, unit.transmission,
            `${unit.owners} owner${unit.owners > 1 ? "s" : ""}`].map(t => (
            <span key={t} style={{ background: C.bg, borderRadius: 6, padding: "3px 8px",
              fontFamily: F, fontSize: 10, color: C.sub, fontWeight: 600 }}>{t}</span>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px",
          borderTop: `1px solid ${C.border}`, background: C.bg }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: age.color }} />
            <span style={{ fontFamily: F, fontSize: 10, fontWeight: 700, color: age.color }}>
              {unit.daysInStock}d in stock
            </span>
          </span>
          <span style={{ fontFamily: F, fontSize: 10, color: C.faint }}>·</span>
          <span style={{ fontFamily: F, fontSize: 10, color: C.sub }}>
            {unit.enquiries} enquiries · {unit.testDrives} TDs
          </span>
          <span style={{ flex: 1 }} />
          <span style={{ background: ready.soft, borderRadius: 999, padding: "2px 8px",
            fontFamily: F, fontSize: 9.5, fontWeight: 800, color: ready.color }}>{ready.label}</span>
          <ChevronDown size={13} color={C.faint} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .18s" }} />
        </div>
      </button>

      {/* ---- Expanded ---- */}
      {open && (
        <div style={{ borderTop: `1px solid ${C.border}` }}>
          <div style={{ padding: 12 }}><PhotoStrip unit={unit} onAddPhotos={onAddPhotos} /></div>

          <div style={{ display: "flex", gap: 4, padding: "0 12px 10px" }}>
            {[["condition", "Condition"], ["pricing", "Pricing"], ["papers", "Papers"], ["matches", `Matches (${matches.length})`]].map(([k, l]) => (
              <button key={k} onClick={() => setTab(k)} style={{
                flex: 1, padding: "6px 0", borderRadius: 7, cursor: "pointer",
                border: `1.5px solid ${tab === k ? C.primary : C.border}`,
                background: tab === k ? C.primarySoft : C.card,
                color: tab === k ? C.primary : C.sub,
                fontFamily: F, fontWeight: 700, fontSize: 10,
              }}>{l}</button>
            ))}
          </div>

          <div style={{ padding: "0 12px 12px" }}>
            {tab === "condition" && (
              <>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 11 }}>
                  {INSPECTION_AREAS.map(a => (
                    <div key={a.key} style={{ flex: "1 1 46%", background: C.bg, borderRadius: 9, padding: "9px 10px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                        <a.Icon size={13} color={C.sub} />
                        <ScoreStars score={unit.inspection[a.key]} size={10} />
                      </div>
                      <div style={{ fontFamily: F, fontSize: 10, color: C.sub, lineHeight: 1.3 }}>{a.label}</div>
                    </div>
                  ))}
                </div>

                {/* Known defects, stated plainly. A rep who finds out about the clutch from
                    the customer has already lost the deal. */}
                <div style={{ fontFamily: F, fontSize: 9.5, fontWeight: 800, color: C.faint,
                  textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
                  Known issues — disclose these
                </div>
                {unit.defects.length === 0 ? (
                  <div style={{ display: "flex", gap: 7, background: C.greenSoft, borderRadius: 8, padding: "9px 10px" }}>
                    <CheckCircle2 size={13} color={C.green} style={{ flexShrink: 0, marginTop: 1 }} />
                    <span style={{ fontFamily: F, fontSize: 11, color: C.green, fontWeight: 700 }}>
                      Nothing flagged at inspection.
                    </span>
                  </div>
                ) : unit.defects.map((d, i) => (
                  <div key={i} style={{ display: "flex", gap: 7, marginBottom: 5 }}>
                    <AlertTriangle size={12} color={C.warm} style={{ flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontFamily: F, fontSize: 11, color: C.sub, lineHeight: 1.4 }}>{d}</span>
                  </div>
                ))}

                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 11 }}>
                  {unit.highlights.map(h => (
                    <span key={h} style={{ background: C.greenSoft, borderRadius: 999, padding: "3px 9px",
                      fontFamily: F, fontSize: 10, fontWeight: 700, color: C.green }}>{h}</span>
                  ))}
                </div>
              </>
            )}

            {tab === "pricing" && (
              <>
                <div style={{ background: C.bg, borderRadius: 10, padding: 11, marginBottom: 10 }}>
                  {[["Asking price", lakh(unit.ask), C.ink, 800],
                    ["Floor price — do not go below", lakh(unit.floor), C.hot, 800],
                    ["Room to negotiate", inr(unit.ask - unit.floor), C.sub, 600]].map(([k, v, col, w]) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 5 }}>
                      <span style={{ fontFamily: F, fontSize: 11, color: C.sub }}>{k}</span>
                      <span style={{ fontFamily: F, fontSize: 11.5, fontWeight: w, color: col }}>{v}</span>
                    </div>
                  ))}
                </div>

                {/* Cost is deliberately behind a tap. It's the number that must never be on
                    screen when a customer is looking over the rep's shoulder. */}
                <button onClick={() => setShowCost(s => !s)} style={{
                  display: "flex", alignItems: "center", gap: 6, width: "100%", background: "none",
                  border: `1px dashed ${C.borderStrong}`, borderRadius: 8, padding: "8px 10px", cursor: "pointer",
                }}>
                  {showCost ? <Eye size={12} color={C.sub} /> : <Lock size={12} color={C.sub} />}
                  <span style={{ fontFamily: F, fontSize: 10.5, fontWeight: 700, color: C.sub }}>
                    {showCost ? "Hide cost breakup" : "Show cost breakup — internal only"}
                  </span>
                </button>
                {showCost && (
                  <div style={{ background: C.hotSoft, borderRadius: 9, padding: 11, marginTop: 8 }}>
                    {[["Purchase price", inr(unit.cost.purchase)],
                      ["Refurbishment", inr(unit.cost.refurb)],
                      ["Total cost", inr(totalCost(unit))],
                      ["Margin at asking", `${inr(margin(unit))} · ${marginPct(unit)}%`]].map(([k, v], i, arr) => (
                      <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 8,
                        marginBottom: 4, paddingTop: i === arr.length - 1 ? 5 : 0,
                        borderTop: i === arr.length - 1 ? `1px solid ${C.hot}33` : "none" }}>
                        <span style={{ fontFamily: F, fontSize: 11, color: C.sub }}>{k}</span>
                        <span style={{ fontFamily: F, fontSize: 11, fontWeight: 800, color: C.ink }}>{v}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ display: "flex", gap: 7, background: age.color === C.green ? C.greenSoft : C.warmSoft,
                  borderRadius: 9, padding: "9px 10px", marginTop: 10 }}>
                  <Clock size={13} color={age.color} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span style={{ fontFamily: F, fontSize: 10.5, color: age.color, lineHeight: 1.4 }}>
                    <strong>{age.label} · {unit.daysInStock} days.</strong>{" "}
                    {unit.daysInStock > 60
                      ? "Every extra week costs holding interest — worth proposing a markdown to your manager."
                      : "Priced to move at the current ask."}
                  </span>
                </div>
              </>
            )}

            {tab === "papers" && (
              <>
                {DOC_CHECKLIST.map(d => (
                  <div key={d.key} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0",
                    borderBottom: `1px solid ${C.border}` }}>
                    {unit.docs[d.key]
                      ? <CheckCircle2 size={14} color={C.green} />
                      : <AlertTriangle size={14} color={C.hot} />}
                    <span style={{ flex: 1, fontFamily: F, fontSize: 11.5, color: C.ink }}>{d.label}</span>
                    <span style={{ fontFamily: F, fontSize: 10, fontWeight: 700,
                      color: unit.docs[d.key] ? C.green : C.hot }}>
                      {unit.docs[d.key] ? "On file" : "Missing"}
                    </span>
                  </div>
                ))}
                <div style={{ marginTop: 11 }}>
                  {[["Registration", `${unit.regNo} · ${unit.regCity}`],
                    ["Insurance valid till", unit.insuranceTill],
                    ["VIN", unit.vin], ["Chassis no.", unit.chassis], ["Engine no.", unit.engineNo],
                    ["At branch", unit.branch]].map(([k, v]) => (
                    <div key={k} style={{ display: "flex", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontFamily: F, fontSize: 10.5, color: C.faint, width: 108, flexShrink: 0 }}>{k}</span>
                      <span style={{ fontFamily: F, fontSize: 10.5, color: C.ink, fontWeight: 600, wordBreak: "break-all" }}>{v}</span>
                    </div>
                  ))}
                </div>
                {docsMissing.length > 0 && (
                  <div style={{ display: "flex", gap: 7, background: C.hotSoft, borderRadius: 9, padding: "9px 10px", marginTop: 10 }}>
                    <AlertTriangle size={13} color={C.hot} style={{ flexShrink: 0, marginTop: 1 }} />
                    <span style={{ fontFamily: F, fontSize: 10.5, color: C.hot, lineHeight: 1.4 }}>
                      <strong>Don't promise a delivery date.</strong> {docsMissing.map(d => d.label).join(", ")} still outstanding.
                    </span>
                  </div>
                )}
              </>
            )}

            {tab === "matches" && (
              <>
                <div style={{ fontFamily: F, fontSize: 10.5, color: C.faint, marginBottom: 9, lineHeight: 1.4 }}>
                  Live leads looking for a {unit.model}. Ageing stock usually moves because
                  someone remembered who wanted it.
                </div>
                {matches.length === 0 ? (
                  <div style={{ fontFamily: F, fontSize: 11.5, color: C.faint, padding: "8px 0" }}>
                    No open leads on this model right now.
                  </div>
                ) : matches.map(l => (
                  <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 9,
                    border: `1px solid ${C.border}`, borderRadius: 9, padding: "9px 10px", marginBottom: 6 }}>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: "block", fontFamily: F, fontSize: 12, fontWeight: 700, color: C.ink }}>{l.name}</span>
                      <span style={{ display: "block", fontFamily: F, fontSize: 10, color: C.faint }}>
                        {l.stage} · {l.phone}
                      </span>
                    </span>
                    <button onClick={() => showToast && showToast(`Shared ${unit.year} ${unit.model} with ${l.name.split(" ")[0]}`)}
                      style={{ background: C.primarySoft, border: "none", borderRadius: 7, padding: "6px 10px",
                        cursor: "pointer", fontFamily: F, fontSize: 10.5, fontWeight: 700, color: C.primary }}>
                      Share
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>

          <div style={{ display: "flex", gap: 8, padding: 12, borderTop: `1px solid ${C.border}` }}>
            {unit.blockedFor ? (
              <>
                <span style={{ flex: 1, display: "flex", alignItems: "center", gap: 7 }}>
                  <Lock size={13} color={C.purple} />
                  <span style={{ fontFamily: F, fontSize: 11, color: C.sub }}>
                    Held for <strong style={{ color: C.ink }}>{unit.blockedFor.name}</strong>
                    <span style={{ display: "block", fontSize: 9.5, color: C.faint }}>by {unit.blockedFor.by}</span>
                  </span>
                </span>
                <button onClick={() => onRelease(unit)} style={{ background: "none", border: "none", cursor: "pointer",
                  fontFamily: F, fontSize: 11, fontWeight: 700, color: C.hot }}>Release</button>
              </>
            ) : (
              <>
                <button onClick={() => showToast && showToast("Test drive request sent to the branch")}
                  style={{ flex: 1, background: C.card, border: `1.5px solid ${C.borderStrong}`, borderRadius: 9,
                    padding: "10px 0", cursor: "pointer", fontFamily: F, fontSize: 11.5, fontWeight: 700, color: C.sub }}>
                  Book test drive
                </button>
                <button onClick={() => onBlock(unit)} style={{
                  flex: 1, background: C.primary, border: "none", borderRadius: 9, padding: "10px 0",
                  cursor: "pointer", fontFamily: F, fontSize: 11.5, fontWeight: 800, color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}><Lock size={12} />Block for customer</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================== WAITLIST & ALLOTMENT ==============================
   When a variant/colour has nothing free, "block" has nothing to block. Instead the
   customer joins a queue against that exact combination. The queue is shared — any SE
   looking at that colour sees how many people are ahead — so two reps can't both promise
   the next arrival to different customers.

   When a car arrives, the earliest entry is allotted automatically. Automatic allotment
   is not the same as acceptance, though: the customer may have changed their mind on
   colour, or the specific car may have a problem. So an allotment sits in a pending
   state until the SE accepts or declines it, and declining asks *why* — because
   "this particular car has a scratch" and "she now wants white" lead to different
   outcomes. The first keeps the customer's place in the queue; the second means the
   queue they're in is the wrong one. */

const DECLINE_REASONS = [
  {
    key: "car_issue",
    label: "Issue with this specific car",
    hint: "Damage, higher odometer on the transit unit, wrong build month",
    outcome: "Position kept — the customer stays first in line for the next arrival.",
  },
  {
    key: "changed_colour",
    label: "Customer changed colour or variant",
    hint: "They now want something different from what they queued for",
    outcome: "Leaves this queue. Add them to the right one instead.",
  },
  {
    key: "no_longer",
    label: "No longer buying",
    hint: "Deal lost, deferred, or bought elsewhere",
    outcome: "Removed from the waitlist entirely.",
  },
];

function waitKey(model, variant, color) { return `${model}|${variant}|${color}`; }

function WaitlistRow({ entry, index, isMine }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 0",
      borderBottom: `1px solid ${C.border}` }}>
      <span style={{
        width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
        background: index === 0 ? C.primary : C.bg,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: F, fontSize: 10, fontWeight: 800, color: index === 0 ? "#fff" : C.sub,
      }}>{index + 1}</span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontFamily: F, fontSize: 11.5, fontWeight: 700, color: C.ink }}>
          {entry.name}{isMine && <span style={{ color: C.primary, fontWeight: 800 }}> · yours</span>}
        </span>
        <span style={{ display: "block", fontFamily: F, fontSize: 9.5, color: C.faint }}>
          Added by {entry.by} · {fmtDate(new Date(entry.at))}
        </span>
      </span>
      {entry.status === "allotted" && (
        <span style={{ background: C.greenSoft, borderRadius: 999, padding: "2px 8px",
          fontFamily: F, fontSize: 9, fontWeight: 800, color: C.green }}>ALLOTTED</span>
      )}
    </div>
  );
}

// Shown in place of the unit list when a colour has nothing free.
function WaitlistPanel({ model, variant, color, entries, currentUser, waitWeeks, onJoin, canAct }) {
  const [open, setOpen] = useState(false);
  const mine = entries.filter(e => e.by === currentUser?.name);
  return (
    <div style={{ padding: "8px 0 12px" }}>
      <div style={{ display: "flex", gap: 8, background: C.bg, borderRadius: 9, padding: "10px 11px", marginBottom: 9 }}>
        <Clock size={13} color={C.faint} style={{ flexShrink: 0, marginTop: 1 }} />
        <span style={{ fontFamily: F, fontSize: 10.5, color: C.sub, lineHeight: 1.45 }}>
          Nothing free in {color}. Expected wait about <strong>{waitWeeks} weeks</strong>.
          {entries.length > 0 && ` ${entries.length} customer${entries.length > 1 ? "s" : ""} already waiting.`}
        </span>
      </div>

      {entries.length > 0 && (
        <>
          <button onClick={() => setOpen(o => !o)} style={{
            display: "flex", alignItems: "center", gap: 6, width: "100%", background: "none",
            border: "none", padding: "0 0 7px", cursor: "pointer", textAlign: "left",
          }}>
            <Users size={12} color={C.sub} />
            <span style={{ flex: 1, fontFamily: F, fontSize: 10.5, fontWeight: 700, color: C.sub }}>
              Waitlist · {entries.length}{mine.length ? ` (${mine.length} yours)` : ""}
            </span>
            <ChevronDown size={12} color={C.faint} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .18s" }} />
          </button>
          {open && entries.map((e, i) => (
            <WaitlistRow key={e.id} entry={e} index={i} isMine={e.by === currentUser?.name} />
          ))}
        </>
      )}

      <button
        onClick={() => canAct ? onJoin({ model, variant, color }) : null}
        style={{
          width: "100%", marginTop: 9, background: canAct ? C.primarySoft : C.bg,
          border: `1.5px solid ${canAct ? C.primary + "44" : C.border}`, borderRadius: 9,
          padding: "9px 0", cursor: canAct ? "pointer" : "default",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          fontFamily: F, fontSize: 11.5, fontWeight: 700, color: canAct ? C.primary : C.ghost,
        }}>
        <Plus size={12} />{canAct ? "Add customer to waitlist" : "Sales Executive only"}
      </button>
    </div>
  );
}

// A car has arrived and been auto-allotted. Until the SE acts on this, the car is held
// but not confirmed — which is the honest state, because the customer hasn't seen it yet.
function AllotmentBanner({ allotment, onAccept, onDecline }) {
  return (
    <div style={{ background: C.greenSoft, border: `1.5px solid ${C.green}55`, borderRadius: 12,
      padding: 12, marginBottom: 10 }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <CheckCircle2 size={15} color={C.green} style={{ flexShrink: 0, marginTop: 1 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: F, fontSize: 12, fontWeight: 800, color: C.green }}>
            Car arrived — auto-allotted to {allotment.name}
          </div>
          <div style={{ fontFamily: F, fontSize: 10.5, color: C.sub, marginTop: 3, lineHeight: 1.45 }}>
            {allotment.model} {allotment.variant} · {allotment.color} · VIN {allotment.vin}
            <span style={{ display: "block", color: C.faint, marginTop: 2 }}>
              They were first on the waitlist. Confirm with the customer before promising it.
            </span>
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => onDecline(allotment)} style={{
          flex: 1, background: C.card, border: `1.5px solid ${C.borderStrong}`, borderRadius: 9,
          padding: "9px 0", cursor: "pointer", fontFamily: F, fontSize: 11.5, fontWeight: 700, color: C.sub,
        }}>Decline this car</button>
        <button onClick={() => onAccept(allotment)} style={{
          flex: 1.3, background: C.green, border: "none", borderRadius: 9, padding: "9px 0",
          cursor: "pointer", fontFamily: F, fontSize: 11.5, fontWeight: 800, color: "#fff",
        }}>Customer confirmed</button>
      </div>
    </div>
  );
}

function DeclineAllotmentSheet({ allotment, onClose, onConfirm }) {
  const [reason, setReason] = useState(null);
  const picked = DECLINE_REASONS.find(r => r.key === reason);
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 230, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)" }} onClick={onClose} />
      <div style={{ position: "relative", background: C.card, borderRadius: "18px 18px 0 0", padding: 16, maxHeight: "85vh", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
          <span style={{ fontFamily: F, fontSize: 16, fontWeight: 800, color: C.ink }}>Why is it being declined?</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            <X size={18} color={C.sub} />
          </button>
        </div>
        <div style={{ fontFamily: F, fontSize: 11, color: C.sub, marginBottom: 14, lineHeight: 1.45 }}>
          The reason decides what happens to {allotment.name.split(" ")[0]}'s place in the queue —
          so this isn't just a note.
        </div>

        {DECLINE_REASONS.map(r => {
          const on = reason === r.key;
          return (
            <button key={r.key} onClick={() => setReason(r.key)} style={{
              display: "block", width: "100%", textAlign: "left", marginBottom: 8, cursor: "pointer",
              background: on ? C.primarySoft : C.card,
              border: `1.5px solid ${on ? C.primary : C.border}`, borderRadius: 11, padding: "11px 12px",
            }}>
              <span style={{ display: "block", fontFamily: F, fontSize: 12.5, fontWeight: 700, color: on ? C.primary : C.ink }}>
                {r.label}
              </span>
              <span style={{ display: "block", fontFamily: F, fontSize: 10.5, color: C.faint, marginTop: 2, lineHeight: 1.4 }}>
                {r.hint}
              </span>
            </button>
          );
        })}

        {picked && (
          <div style={{ display: "flex", gap: 7, background: C.bg, borderRadius: 9, padding: "10px 11px", marginTop: 4 }}>
            <AlertTriangle size={13} color={C.sub} style={{ flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontFamily: F, fontSize: 10.5, color: C.sub, lineHeight: 1.45 }}>
              <strong>What happens: </strong>{picked.outcome} The car goes back to available stock either way.
            </span>
          </div>
        )}

        <button onClick={() => reason && onConfirm(allotment, reason)} style={{
          width: "100%", marginTop: 14, padding: "13px 0", borderRadius: 11, border: "none",
          background: reason ? C.primary : C.ghost, color: "#fff",
          fontFamily: F, fontWeight: 800, fontSize: 13.5, cursor: reason ? "pointer" : "default",
        }}>{reason ? "Confirm decline" : "Pick a reason"}</button>
      </div>
    </div>
  );
}

// Photo capture for a car whose set is incomplete. Real capture is a device concern; what
// matters in the UI is that the rep can see which categories are thin and act on it.
function AddPhotosSheet({ unit, onClose, onAdd }) {
  const CATS = ["Exterior", "Interior", "Tyres", "Engine bay", "Damage / wear", "Documents"];
  const [picked, setPicked] = useState([]);
  const toggle = (c) => setPicked(p => p.includes(c) ? p.filter(x => x !== c) : [...p, c]);
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 230, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)" }} onClick={onClose} />
      <div style={{ position: "relative", background: C.card, borderRadius: "18px 18px 0 0", padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
          <span style={{ fontFamily: F, fontSize: 16, fontWeight: 800, color: C.ink }}>Add photos</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            <X size={18} color={C.sub} />
          </button>
        </div>
        <div style={{ fontFamily: F, fontSize: 11, color: C.sub, marginBottom: 14 }}>
          {unit.year} {unit.model} {unit.variant} · {unit.photos} on file
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 14 }}>
          {CATS.map(c => {
            const on = picked.includes(c);
            return (
              <button key={c} onClick={() => toggle(c)} style={{
                flex: "1 1 46%", padding: "14px 8px", borderRadius: 11, cursor: "pointer",
                border: `1.5px solid ${on ? C.primary : C.borderStrong}`,
                background: on ? C.primarySoft : C.card,
                display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
              }}>
                <Camera size={17} color={on ? C.primary : C.sub} />
                <span style={{ fontFamily: F, fontSize: 10.5, fontWeight: 700, color: on ? C.primary : C.sub }}>{c}</span>
              </button>
            );
          })}
        </div>

        <button onClick={() => picked.length && onAdd(unit, picked)} style={{
          width: "100%", padding: "13px 0", borderRadius: 11, border: "none",
          background: picked.length ? C.primary : C.ghost, color: "#fff",
          fontFamily: F, fontWeight: 800, fontSize: 13.5, cursor: picked.length ? "pointer" : "default",
        }}>
          {picked.length ? `Capture ${picked.length} set${picked.length > 1 ? "s" : ""}` : "Pick what to shoot"}
        </button>
      </div>
    </div>
  );
}

function InventoryScreen({ leads, showToast, onUpdateLead, currentUser, canAllocate = false, subView }) {
  const [category, setCategory] = useState("new");
  const [units, setUnits] = useState(() => [...buildInventoryUnits(), ...DEMO_USED_UNITS]);
  const [openModel, setOpenModel] = useState(null);
  const [openVariant, setOpenVariant] = useState(null);
  const [openColor, setOpenColor] = useState(null);
  const [blockingUnit, setBlockingUnit] = useState(null);
  const [waitlist, setWaitlist] = useState([
    // Seeded so the queue mechanic is visible without having to build one up first.
    { id: "w1", model: "Creta", variant: "SX(O) Turbo DCT", color: "Fiery Red",
      leadId: 3, name: "Ajay Pillai", phone: "+91 9000000003",
      by: "Divya Pillai", at: d(-9), status: "waiting" },
    { id: "w2", model: "Creta", variant: "SX(O) Turbo DCT", color: "Fiery Red",
      leadId: 5, name: "Sunita Gupta", phone: "+91 9000000005",
      by: "Rahul Kumar", at: d(-4), status: "waiting" },
    // Queued against a colour that has a car in transit — this is the entry that gets
    // auto-allotted when the car is marked arrived.
    { id: "w3", model: "Creta", variant: "SX(O) Turbo DCT", color: "Titan Grey",
      leadId: 4, name: "Meena Rao", phone: "+91 9000000004",
      by: "Rahul Kumar", at: d(-6), status: "waiting" },
    // Second in line for the same colour — proves the cascade on release/cancel.
    { id: "w4", model: "Creta", variant: "SX(O) Turbo DCT", color: "Titan Grey",
      leadId: 6, name: "Rahul Mehta", phone: "+91 9000000001",
      by: "Rahul Kumar", at: d(-2), status: "waiting" },
  ]);
  // Kept in a ref so the cascade below reads the live queue rather than a stale closure.
  const waitlistRef = useRef(waitlist);
  useEffect(() => { waitlistRef.current = waitlist; }, [waitlist]);
  const [joiningWait, setJoiningWait] = useState(null);
  const [decliningAllotment, setDecliningAllotment] = useState(null);
  const [addingPhotos, setAddingPhotos] = useState(null);
  // Pre-owned filters. Kind is a 3-way toggle so chips are right; brand/model/variant are
  // open-ended lists, so they're dropdowns.
  const [preKind, setPreKind] = useState("all");   // all | demo | used
  const [preBrand, setPreBrand] = useState("");
  const [preModel, setPreModel] = useState("");
  const [preVariant, setPreVariant] = useState("");
  const [usedStock, setUsedStock] = useState(USED_STOCK);

  const waitFor = (m, v, c) => waitlist.filter(w =>
    w.model === m && w.variant === v && w.color === c && w.status !== "removed");

  // Pending allotments this rep needs to act on.
  const myAllotments = waitlist.filter(w => w.status === "allotted");

  const joinWaitlist = (combo, lead) => {
    setWaitlist(ws => [...ws, {
      id: `w${Date.now()}`, ...combo, leadId: lead.id, name: lead.name, phone: lead.phone,
      by: currentUser?.name || "SE", at: new Date(), status: "waiting",
    }]);
    setJoiningWait(null);
    const ahead = waitFor(combo.model, combo.variant, combo.color).length;
    showToast(`Added to waitlist — position ${ahead + 1} for ${combo.color}`);
  };

  // When a car arrives, the earliest waiting entry for that exact combination gets it.
  const markArrived = (unit) => {
    const queue = waitFor(unit.model, unit.variant, unit.color)
      .filter(w => w.status === "waiting")
      .sort((a, b) => new Date(a.at) - new Date(b.at));
    const first = queue[0];
    setUnits(us => us.map(u => u.id === unit.id
      ? { ...u, status: "in_stock",
          blockedFor: first ? { leadId: first.leadId, name: first.name, phone: first.phone,
            at: new Date(), by: first.by, viaWaitlist: true, pending: true } : null }
      : u));
    if (first) {
      setWaitlist(ws => ws.map(w => w.id === first.id
        ? { ...w, status: "allotted", vin: unit.vin, unitId: unit.id } : w));
      showToast(`🚗 Arrived — auto-allotted to ${first.name.split(" ")[0]}`);
    } else {
      showToast("🚗 Car arrived — added to available stock");
    }
  };

  const acceptAllotment = (a) => {
    setUnits(us => us.map(u => u.id === a.unitId
      ? { ...u, blockedFor: { ...u.blockedFor, pending: false } } : u));
    setWaitlist(ws => ws.filter(w => w.id !== a.id));
    showToast(`✅ ${a.name.split(" ")[0]} confirmed — car held`);
  };

  // Declining always frees the car. What differs is what happens to the queue place.
  const declineAllotment = (a, reason) => {
    setWaitlist(ws => ws.map(w => {
      if (w.id !== a.id) return w;
      if (reason === "car_issue")      return { ...w, status: "waiting", vin: null, unitId: null };
      if (reason === "changed_colour") return { ...w, status: "removed" };
      return { ...w, status: "removed" };
    }));
    setDecliningAllotment(null);
    // Hand the car straight to whoever is next rather than leaving it idle. The declining
    // customer keeps their place only when the problem was this specific car.
    const unit = units.find(u => u.id === a.unitId);
    if (unit) setTimeout(() => releaseAndCascade(unit, "Declined"), 0);
    showToast(reason === "car_issue"
      ? `Car released — ${a.name.split(" ")[0]} keeps position 1`
      : reason === "changed_colour"
        ? `Removed from this queue — add ${a.name.split(" ")[0]} to the right colour`
        : `${a.name.split(" ")[0]} removed from the waitlist`);
  };

  const addPhotos = (unit, cats) => {
    setUsedStock(us => us.map(u => u.id === unit.id
      ? { ...u, photos: u.photos + cats.length * 4 } : u));
    setAddingPhotos(null);
    showToast(`📷 ${cats.length * 4} photos added`);
  };
  const [q, setQ] = useState("");

  const catUnits = units.filter(u => u.category === category);
  const term = q.trim().toLowerCase();
  const searched = term
    ? catUnits.filter(u =>
        u.model.toLowerCase().includes(term) || u.variant.toLowerCase().includes(term) ||
        u.color.toLowerCase().includes(term) || (canAllocate && u.vin.toLowerCase().includes(term)))
    : catUnits;

  const models = [...new Set(searched.map(u => u.model))].sort();

  const doBlock = (unit, lead, mismatches, resolution) => {
    setUnits(us => us.map(u => u.id === unit.id
      ? { ...u, blockedFor: {
            leadId: lead.id, name: lead.name, phone: lead.phone, at: new Date(), mismatches,
            // Who placed the hold — without this, an SE finding a blocked car has no idea
            // who to talk to about releasing it.
            by: currentUser?.name || "Unknown", byId: currentUser?.id ?? null,
          } }
      : u));

    // Every block is written to the lead's activity — an allocation is a commitment to the
    // customer, and whoever picks the file up next needs to see which car was held and why.
    const changed = mismatches.length > 0 && resolution === "finalise";
    const note = changed
      ? `Car finalised — ${unit.model} ${unit.variant} in ${unit.color} (VIN ${unit.vin}) blocked. Booking updated from ${mismatches.map(m => `${m.field}: ${m.booked} → ${m.unit}`).join(", ")}. Customer confirmed the change. Blocked by ${currentUser?.name || "an SE"}.`
      : `${unit.model} ${unit.variant} in ${unit.color} (VIN ${unit.vin}) blocked for this customer by ${currentUser?.name || "an SE"}.`;

    if (onUpdateLead) {
      onUpdateLead({
        ...lead,
        // When the SE finalises a different car, the booking record follows it — otherwise
        // the paperwork and the physical car drift apart and it surfaces on delivery day.
        ...(changed ? { model: unit.model, variant: unit.variant, colorInterest: [unit.color] } : {}),
        blockedUnit: { id: unit.id, vin: unit.vin, model: unit.model, variant: unit.variant, color: unit.color },
        callHistory: [
          { id: genActivityId(), date: new Date(), disposition: "car_blocked", note },
          ...(lead.callHistory || []),
        ],
      });
    }

    setBlockingUnit(null);
    showToast(changed
      ? `🔒 Held & booking updated — ${unit.model} ${unit.color}`
      : `🔒 ${unit.model} ${unit.color} held for ${lead.name.split(" ")[0]}`);
  };
  // Any time a car is freed — booking cancelled, allotment declined, manual release —
  // the queue for that exact combination is checked and the earliest entry gets it.
  // A freed car should never sit unallocated while someone is waiting for it.
  const releaseAndCascade = (unit, why) => {
    const queue = waitlistRef.current
      .filter(w => w.model === unit.model && w.variant === unit.variant
        && w.color === unit.color && w.status === "waiting")
      .sort((a, b) => new Date(a.at) - new Date(b.at));
    const next = queue[0];

    setUnits(us => us.map(u => u.id !== unit.id ? u : ({
      ...u,
      blockedFor: next
        ? { leadId: next.leadId, name: next.name, phone: next.phone, at: new Date(),
            by: next.by, viaWaitlist: true, pending: true }
        : null,
    })));

    if (next) {
      setWaitlist(ws => ws.map(w => w.id === next.id
        ? { ...w, status: "allotted", vin: unit.vin, unitId: unit.id } : w));
      showToast(`${why} — passed to ${next.name.split(" ")[0]}, next on the waitlist`);
    } else {
      showToast(`${why} — back in available stock`);
    }
    return next;
  };

  const doRelease = (unit) => releaseAndCascade(unit, "Car released");

  const CATEGORIES = [
    { key: "new",  label: "New Cars" },
    { key: "used", label: "Pre-owned" },
  ];

  // The menu sub-item decides what this screen opens on.
  useEffect(() => {
    if (subView === "new") setCategory("new");
    if (subView === "preowned") { setCategory("used"); setPreKind("used"); }
    if (subView === "demo")     { setCategory("used"); setPreKind("demo"); }
  }, [subView]);

  return (
    <div style={{ padding: 14 }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
        {CATEGORIES.map(c => {
          const on = category === c.key;
          const n = c.key === "used"
            ? usedStock.filter(u => !u.blockedFor).length
            : units.filter(u => u.category === c.key && !u.blockedFor && u.status === "in_stock").length;
          return (
            <button key={c.key} onClick={() => { setCategory(c.key); setOpenModel(null); setOpenVariant(null); setOpenColor(null); }} style={{
              flex: 1, padding: "8px 4px", borderRadius: 10, cursor: "pointer",
              border: `1.5px solid ${on ? C.primary : C.border}`,
              background: on ? C.primarySoft : C.card,
              display: "flex", flexDirection: "column", alignItems: "center", gap: 1,
            }}>
              <span style={{ fontFamily: F, fontSize: 13, fontWeight: 800, color: on ? C.primary : C.ink, lineHeight: 1 }}>{n}</span>
              <span style={{ fontFamily: F, fontSize: 8.5, fontWeight: 700, color: on ? C.primary : C.faint, textTransform: "uppercase", letterSpacing: 0.3 }}>{c.label}</span>
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 11, padding: "9px 12px", marginBottom: 12 }}>
        <Search size={14} color={C.faint} />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder={canAllocate ? "Model, variant, colour or VIN…" : "Model, variant or colour…"}
          style={{ border: "none", outline: "none", flex: 1, fontFamily: F, fontSize: 12.5, color: C.ink, background: "none" }} />
        {q && <button onClick={() => setQ("")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}><X size={13} color={C.faint} /></button>}
      </div>

      {!canAllocate && (
        <div style={{ display: "flex", gap: 7, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 9, padding: "8px 10px", marginBottom: 10 }}>
          <AlertTriangle size={13} color={C.faint} style={{ flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontFamily: F, fontSize: 10.5, color: C.sub, lineHeight: 1.4 }}>
            Availability and waiting periods only. The assigned Sales Executive allocates a specific car.
          </span>
        </div>
      )}

      {/* Used stock is a list of unique cars, not a tree of interchangeable units. */}
      {canAllocate && myAllotments.map(a => (
        <AllotmentBanner key={a.id} allotment={a}
          onAccept={acceptAllotment} onDecline={setDecliningAllotment} />
      ))}

      {category === "used" && (() => {
        // Cascading options — picking a brand narrows the model list, and so on, so the
        // dropdowns can never offer a combination that returns nothing.
        const byKind = usedStock.filter(u => preKind === "all" || u.kind === preKind);
        const brands = [...new Set(byKind.map(u => u.brand))].sort();
        const byBrand = byKind.filter(u => !preBrand || u.brand === preBrand);
        const models = [...new Set(byBrand.map(u => u.model))].sort();
        const byModel = byBrand.filter(u => !preModel || u.model === preModel);
        const variants = [...new Set(byModel.map(u => u.variant))].sort();

        const shown = byModel.filter(u => {
          if (preVariant && u.variant !== preVariant) return false;
          if (!term) return true;
          return [u.brand, u.model, u.variant, u.color, u.regNo, String(u.year)]
            .some(x => String(x).toLowerCase().includes(term));
        });
        const filtersOn = preKind !== "all" || preBrand || preModel || preVariant;

        const Drop = ({ value, onChange, options, placeholder }) => (
          <select value={value} onChange={e => onChange(e.target.value)} style={{
            flex: 1, minWidth: 0, boxSizing: "border-box",
            border: `1.5px solid ${value ? C.primary : C.borderStrong}`, borderRadius: 9,
            padding: "8px 9px", fontFamily: F, fontSize: 11.5,
            color: value ? C.primary : C.sub, background: value ? C.primarySoft : C.card,
            outline: "none", cursor: "pointer", appearance: "none", WebkitAppearance: "none",
          }}>
            <option value="">{placeholder}</option>
            {options.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        );

        return (
        <>
          <div style={{ display: "flex", gap: 5, marginBottom: 7 }}>
            {[["all", "All"], ["used", "Used"], ["demo", "Demo"]].map(([k, l]) => {
              const on = preKind === k;
              const n = k === "all" ? usedStock.length : usedStock.filter(u => u.kind === k).length;
              return (
                <button key={k} onClick={() => { setPreKind(k); setPreBrand(""); setPreModel(""); setPreVariant(""); }} style={{
                  flex: 1, padding: "7px 0", borderRadius: 9, cursor: "pointer",
                  border: `1.5px solid ${on ? C.primary : C.border}`,
                  background: on ? C.primarySoft : C.card,
                  color: on ? C.primary : C.sub,
                  fontFamily: F, fontWeight: 700, fontSize: 11,
                }}>{l} <span style={{ opacity: .65 }}>{n}</span></button>
              );
            })}
          </div>

          <div style={{ display: "flex", gap: 5, marginBottom: 10 }}>
            <Drop value={preBrand} placeholder="All brands" options={brands}
              onChange={v => { setPreBrand(v); setPreModel(""); setPreVariant(""); }} />
            <Drop value={preModel} placeholder="All models" options={models}
              onChange={v => { setPreModel(v); setPreVariant(""); }} />
            <Drop value={preVariant} placeholder="All variants" options={variants}
              onChange={setPreVariant} />
          </div>

          {filtersOn && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ flex: 1, fontFamily: F, fontSize: 10.5, color: C.sub }}>
                {shown.length} of {usedStock.length} cars
              </span>
              <button onClick={() => { setPreKind("all"); setPreBrand(""); setPreModel(""); setPreVariant(""); }}
                style={{ background: "none", border: "none", cursor: "pointer",
                  fontFamily: F, fontSize: 11, fontWeight: 700, color: C.hot, padding: 0 }}>Clear</button>
            </div>
          )}

          {shown.length === 0 && (
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12,
              padding: 22, textAlign: "center", fontFamily: F, fontSize: 12.5, color: C.sub }}>
              No pre-owned cars match these filters.
            </div>
          )}

          {shown.map(u => (
            <UsedCarCard key={u.id} unit={u} leads={leads} currentUser={currentUser}
              showToast={showToast}
              onBlock={canAllocate ? setBlockingUnit : () => showToast && showToast("Only a Sales Executive can hold a car")}
              onRelease={doRelease} onAddPhotos={setAddingPhotos} />
          ))}
        </>
        );
      })()}

      {category !== "used" && models.length === 0 && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24, textAlign: "center", fontFamily: F, fontSize: 13, color: C.sub }}>
          Nothing in {CATEGORIES.find(c => c.key === category).label.toLowerCase()} matching this.
        </div>
      )}

      {category !== "used" && models.map(model => {
        const mUnits = searched.filter(u => u.model === model);
        const mOpen = openModel === model;
        const roll = rollupStatus(mUnits, model);
        const variants = [...new Set(mUnits.map(u => u.variant))];
        return (
          <div key={model} style={{ background: C.card, border: `1px solid ${mOpen ? C.primary + "55" : C.border}`, borderRadius: 12, marginBottom: 8, overflow: "hidden" }}>
            <button onClick={() => { setOpenModel(mOpen ? null : model); setOpenVariant(null); setOpenColor(null); }} style={{
              display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "12px 14px",
              background: "none", border: "none", cursor: "pointer", textAlign: "left",
            }}>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontFamily: F, fontSize: 13.5, fontWeight: 800, color: C.ink }}>{model}</span>
                <span style={{ display: "block", fontFamily: F, fontSize: 10.5, color: C.faint, marginTop: 1 }}>
                  {variants.length} variant{variants.length > 1 ? "s" : ""} · {mUnits.length} unit{mUnits.length > 1 ? "s" : ""}
                </span>
              </span>
              <StatusPill status={roll.key} detail={roll.detail} />
              <ChevronDown size={14} color={C.faint} style={{ flexShrink: 0, transform: mOpen ? "rotate(180deg)" : "none", transition: "transform .18s" }} />
            </button>

            {mOpen && (
              <div style={{ padding: "0 14px 10px" }}>
                {variants.map(variant => {
                  const vUnits = mUnits.filter(u => u.variant === variant);
                  const vOpen = openVariant === model + variant;
                  const vRoll = rollupStatus(vUnits, model);
                  // Every colour the variant comes in — a colour with no stock is exactly the
                  // case the waitlist exists for, so it has to be visible to queue against.
                  const stockedColors = [...new Set(vUnits.map(u => u.color))];
                  const colors = canAllocate
                    ? [...new Set([...stockedColors, ...COLOR_OPTIONS])]
                    : stockedColors;
                  return (
                    <div key={variant} style={{ borderTop: `1px solid ${C.border}` }}>
                      <button onClick={() => { setOpenVariant(vOpen ? null : model + variant); setOpenColor(null); }} style={{
                        display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "10px 0",
                        background: "none", border: "none", cursor: "pointer", textAlign: "left",
                      }}>
                        <span style={{ flex: 1, fontFamily: F, fontSize: 12, fontWeight: 700, color: C.ink }}>{variant}</span>
                        <StatusPill status={vRoll.key} detail={vRoll.detail} />
                        <ChevronDown size={12} color={C.faint} style={{ flexShrink: 0, transform: vOpen ? "rotate(180deg)" : "none", transition: "transform .18s" }} />
                      </button>

                      {vOpen && (
                        <div style={{ paddingLeft: 10, paddingBottom: 6 }}>
                          {colors.map(color => {
                            const cUnits = vUnits.filter(u => u.color === color);
                            const cOpen = openColor === model + variant + color;
                            const cRoll = rollupStatus(cUnits, model);
                            return (
                              <div key={color} style={{ borderTop: `1px solid ${C.border}` }}>
                                <button
                                  onClick={() => canAllocate && setOpenColor(cOpen ? null : model + variant + color)}
                                  style={{
                                    display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "9px 0",
                                    background: "none", border: "none", textAlign: "left",
                                    cursor: canAllocate ? "pointer" : "default",
                                  }}>
                                  <span style={{ flex: 1, fontFamily: F, fontSize: 11.5, color: C.sub }}>{color}</span>
                                  <StatusPill status={cRoll.key} detail={cRoll.detail} />
                                  {canAllocate && <ChevronDown size={12} color={C.faint} style={{ flexShrink: 0, transform: cOpen ? "rotate(180deg)" : "none", transition: "transform .18s" }} />}
                                </button>
                                {canAllocate && cOpen && (
                                  <div style={{ paddingLeft: 8 }}>
                                    {cUnits.map(u => (
                                      <UnitRow key={u.id} unit={u} onBlock={setBlockingUnit}
                                        onRelease={doRelease} onArrived={markArrived} />
                                    ))}
                                    {/* Nothing free to block — offer the queue instead. */}
                                    {cUnits.filter(u => u.status === "in_stock" && !u.blockedFor).length === 0 && (
                                      <WaitlistPanel
                                        model={model} variant={variant} color={color}
                                        entries={waitFor(model, variant, color)}
                                        currentUser={currentUser}
                                        waitWeeks={WAITING_WEEKS[model] || 6}
                                        canAct={canAllocate}
                                        onJoin={setJoiningWait}
                                      />
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {joiningWait && (
        <BlockUnitSheet
          unit={{ ...joiningWait, vin: "— not yet allotted —" }}
          leads={leads}
          waitlistMode
          onClose={() => setJoiningWait(null)}
          onConfirm={(u, lead) => joinWaitlist(joiningWait, lead)}
        />
      )}
      {decliningAllotment && (
        <DeclineAllotmentSheet allotment={decliningAllotment}
          onClose={() => setDecliningAllotment(null)} onConfirm={declineAllotment} />
      )}
      {addingPhotos && (
        <AddPhotosSheet unit={addingPhotos} onClose={() => setAddingPhotos(null)} onAdd={addPhotos} />
      )}

      {blockingUnit && (
        <BlockUnitSheet
          unit={blockingUnit}
          leads={leads}
          onClose={() => setBlockingUnit(null)}
          onConfirm={doBlock}
        />
      )}
    </div>
  );
}

/* ============================== CHART PRIMITIVES ==============================
   Hand-rolled SVG rather than a charting library — these are small, fixed shapes and a
   dependency would cost more than it saves. Each one is built to read at a glance on a
   phone: no axes unless they earn their place, values on the marks themselves. */

// Horizontal bars. Better than vertical on a narrow screen because the label sits inline
// and long category names don't have to be rotated or truncated.
// A funnel-per-row matrix. A single "qualified by source" bar tells you which source wins,
// but not *where* the others fall over — a source with plenty of leads that never get
// contacted is a very different problem from one that's contacted and then goes cold.
// Each row carries its own mini funnel so both are visible at once.
function BreakdownTable({ rows, columns, onRowTap }) {
  const [sortKey, setSortKey] = useState(columns[0].key);
  const sorted = [...rows].sort((a, b) => (b.values[sortKey] || 0) - (a.values[sortKey] || 0));
  const max = Math.max(1, ...rows.map(r => r.values[columns[0].key] || 0));

  return (
    <div>
      {/* Column headers double as sort controls — on a phone there isn't room for both. */}
      <div style={{ display: "flex", alignItems: "flex-end", gap: 4, paddingBottom: 6, borderBottom: `1px solid ${C.border}`, marginBottom: 8 }}>
        <span style={{ flex: 1, minWidth: 0, fontFamily: F, fontSize: 9, fontWeight: 700, color: C.faint, textTransform: "uppercase", letterSpacing: 0.4 }}>
          {columns[0].rowLabel || "Source"}
        </span>
        {columns.map(c => (
          <button key={c.key} onClick={() => setSortKey(c.key)} style={{
            width: 34, flexShrink: 0, background: "none", border: "none", cursor: "pointer", padding: 0,
            fontFamily: F, fontSize: 8.5, fontWeight: 800, letterSpacing: 0.2, textAlign: "center",
            color: sortKey === c.key ? C.primary : C.faint, textTransform: "uppercase",
          }}>{c.short}</button>
        ))}
      </div>

      {sorted.map(r => {
        const first = r.values[columns[0].key] || 0;
        return (
          <div key={r.label} style={{ marginBottom: 9 }}>
            <button
              onClick={() => onRowTap && onRowTap(r)}
              style={{
                display: "flex", alignItems: "center", gap: 4, width: "100%",
                background: "none", border: "none", padding: 0, textAlign: "left",
                cursor: onRowTap ? "pointer" : "default",
              }}>
              <span style={{ flex: 1, minWidth: 0, fontFamily: F, fontSize: 11, fontWeight: 600, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {r.label}
              </span>
              {columns.map(c => {
                const v = r.values[c.key] || 0;
                return (
                  <span key={c.key} style={{
                    width: 34, flexShrink: 0, textAlign: "center",
                    fontFamily: F, fontSize: 11, fontWeight: v ? 800 : 500,
                    color: v ? (c.color || C.ink) : C.ghost,
                  }}>{v}</span>
                );
              })}
            </button>

            {/* Stacked proportion bar — reads as "of everything this source sent, this is
                how far each part got". */}
            <div style={{ display: "flex", height: 5, borderRadius: 3, overflow: "hidden", background: C.bg, marginTop: 4 }}>
              {columns.slice(1).map(c => {
                const v = r.values[c.key] || 0;
                const pct = first ? (v / first) * 100 : 0;
                return pct > 0 ? (
                  <span key={c.key} title={`${c.label}: ${v}`} style={{ width: `${pct}%`, background: c.color || C.primary, opacity: 0.85 }} />
                ) : null;
              })}
            </div>
          </div>
        );
      })}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 9, marginTop: 10, paddingTop: 9, borderTop: `1px solid ${C.border}` }}>
        {columns.map(c => (
          <span key={c.key} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 7, height: 7, borderRadius: 2, background: c.color || C.ink }} />
            <span style={{ fontFamily: F, fontSize: 9.5, color: C.sub }}>{c.label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function BarRows({ data, accent, maxLabel = 96, showZero = true }) {
  const max = Math.max(1, ...data.map(d => d.value));
  const rows = showZero ? data : data.filter(d => d.value > 0);
  if (rows.length === 0) {
    return <div style={{ fontFamily: F, fontSize: 11.5, color: C.faint, padding: "6px 0" }}>Nothing to show yet.</div>;
  }
  return (
    <div>
      {rows.map(d => (
        <div key={d.label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
          <span style={{ fontFamily: F, fontSize: 10.5, color: C.sub, width: maxLabel, flexShrink: 0, lineHeight: 1.25 }}>{d.label}</span>
          <span style={{ flex: 1, height: 16, background: C.bg, borderRadius: 4, overflow: "hidden", position: "relative" }}>
            <span style={{
              display: "block", width: `${(d.value / max) * 100}%`, height: "100%",
              background: d.color || accent || C.primary, borderRadius: 4, transition: "width .4s",
            }} />
          </span>
          <span style={{ fontFamily: F, fontSize: 11, fontWeight: 800, color: C.ink, width: 30, textAlign: "right", flexShrink: 0 }}>
            {d.display ?? d.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// Sparkline with an area fill. Used for "how has this moved over the last N days" — the
// shape matters more than exact values, so there are no gridlines.
function TrendChart({ points, labels, accent = C.primary, height = 64, target }) {
  const max = Math.max(1, ...points, target || 0);
  const w = 300, pad = 4;
  const step = points.length > 1 ? (w - pad * 2) / (points.length - 1) : 0;
  const y = (v) => height - pad - (v / max) * (height - pad * 2);
  const coords = points.map((v, i) => [pad + i * step, y(v)]);
  const line = coords.map(([x, yy], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${yy.toFixed(1)}`).join(" ");
  const area = `${line} L${(pad + (points.length - 1) * step).toFixed(1)},${height - pad} L${pad},${height - pad} Z`;
  return (
    <div>
      <svg viewBox={`0 0 ${w} ${height}`} style={{ width: "100%", height, display: "block" }} preserveAspectRatio="none">
        {target != null && (
          <line x1={pad} x2={w - pad} y1={y(target)} y2={y(target)}
            stroke={C.faint} strokeWidth="1" strokeDasharray="4 4" opacity="0.7" />
        )}
        <path d={area} fill={accent} opacity="0.12" />
        <path d={line} fill="none" stroke={accent} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {coords.map(([x, yy], i) => (
          <circle key={i} cx={x} cy={yy} r={i === coords.length - 1 ? 3.5 : 2} fill={accent} />
        ))}
      </svg>
      {labels && (
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
          {labels.map((l, i) => (
            <span key={i} style={{ fontFamily: F, fontSize: 8.5, color: C.faint }}>{l}</span>
          ))}
        </div>
      )}
    </div>
  );
}

// Stage funnel. Each bar is drawn proportional to the top of the funnel, with the drop-off
// to the next stage called out — the drop is the insight, not the absolute number.
function FunnelChart({ stages }) {
  const top = Math.max(1, stages[0]?.value || 1);
  return (
    <div>
      {stages.map((s, i) => {
        const next = stages[i + 1];
        const pct = Math.round((s.value / top) * 100);
        const drop = next && s.value > 0 ? Math.round(((s.value - next.value) / s.value) * 100) : null;
        return (
          <div key={s.label} style={{ marginBottom: i === stages.length - 1 ? 0 : 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontFamily: F, fontSize: 10.5, color: C.sub, width: 84, flexShrink: 0 }}>{s.label}</span>
              <span style={{ flex: 1, height: 20, background: C.bg, borderRadius: 4, overflow: "hidden" }}>
                <span style={{
                  display: "flex", alignItems: "center", justifyContent: "flex-end",
                  width: `${Math.max(pct, 6)}%`, height: "100%", background: s.color || C.primary,
                  borderRadius: 4, paddingRight: 6, boxSizing: "border-box", transition: "width .4s",
                }}>
                  <span style={{ fontFamily: F, fontSize: 10, fontWeight: 800, color: "#fff" }}>{s.value}</span>
                </span>
              </span>
            </div>
            {drop != null && drop > 0 && (
              <div style={{ fontFamily: F, fontSize: 9, color: C.faint, paddingLeft: 92, marginTop: 2 }}>
                ↓ {drop}% drop off
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Donut for a small categorical split. Capped at five slices — past that a bar list reads
// better and this becomes a colour-matching exercise.
function DonutChart({ data, size = 108 }) {
  const total = data.reduce((n, d) => n + d.value, 0) || 1;
  const r = size / 2 - 10, cx = size / 2, cy = size / 2, circ = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <svg width={size} height={size} style={{ flexShrink: 0, transform: "rotate(-90deg)" }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.bg} strokeWidth="14" />
        {data.map(d => {
          const len = (d.value / total) * circ;
          const el = (
            <circle key={d.label} cx={cx} cy={cy} r={r} fill="none" stroke={d.color} strokeWidth="14"
              strokeDasharray={`${len} ${circ - len}`} strokeDashoffset={-offset} />
          );
          offset += len;
          return el;
        })}
      </svg>
      <div style={{ flex: 1, minWidth: 0 }}>
        {data.map(d => (
          <div key={d.label} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: d.color, flexShrink: 0 }} />
            <span style={{ flex: 1, fontFamily: F, fontSize: 10.5, color: C.sub, minWidth: 0 }}>{d.label}</span>
            <span style={{ fontFamily: F, fontSize: 10.5, fontWeight: 800, color: C.ink }}>{d.value}</span>
            <span style={{ fontFamily: F, fontSize: 9.5, color: C.faint, width: 30, textAlign: "right" }}>
              {Math.round((d.value / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Section wrapper so every card on the dashboard has the same anatomy: title, optional
// one-line "what this tells you", then the chart.
function ChartCard({ title, hint, children, action }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14, marginBottom: 10 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: hint ? 2 : 10 }}>
        <span style={{ fontFamily: F, fontSize: 12.5, fontWeight: 800, color: C.ink }}>{title}</span>
        {action}
      </div>
      {hint && <div style={{ fontFamily: F, fontSize: 10.5, color: C.faint, marginBottom: 11, lineHeight: 1.35 }}>{hint}</div>}
      {children}
    </div>
  );
}

// Compact metric tile with an optional delta against the prior period.
function StatTile({ label, value, sub, delta, accent }) {
  const up = delta != null && delta > 0;
  return (
    <div style={{ flex: "1 1 45%", background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 12 }}>
      <div style={{ fontFamily: F, fontSize: 9.5, fontWeight: 700, color: C.faint, textTransform: "uppercase", letterSpacing: 0.4 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 5, marginTop: 5 }}>
        <span style={{ fontFamily: F, fontSize: 21, fontWeight: 900, color: accent || C.ink, letterSpacing: -0.5, lineHeight: 1 }}>{value}</span>
        {delta != null && (
          <span style={{ fontFamily: F, fontSize: 10, fontWeight: 800, color: up ? C.green : C.hot }}>
            {up ? "▲" : "▼"}{Math.abs(delta)}%
          </span>
        )}
      </div>
      {sub && <div style={{ fontFamily: F, fontSize: 10, color: C.sub, marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

/* ============================== LEARNING ==============================
   Two different jobs sit in here. A telecaller is on the phone with someone who hasn't
   decided anything yet, so they need openers, objection handling and enough product
   knowledge to sound credible for ninety seconds. The comparison cards are the part
   that matters most in practice — "why not the Seltos" is the question that ends calls. */

const OBJECTIONS = [
  {
    id: "price",
    trigger: "It's too expensive",
    why: "Usually means they haven't seen the full value, or they're comparing an on-road price against a rival's ex-showroom.",
    say: "I understand. Can I ask what figure you're comparing it against? Sometimes we're looking at ex-showroom on one side and on-road on the other, which makes a ₹1–2 lakh difference on paper that isn't really there.",
    avoid: "Don't lead with a discount. Once you discount to hold a conversation, the price becomes the only thing being discussed.",
  },
  {
    id: "waiting",
    trigger: "The waiting period is too long",
    why: "A real objection, and the one most likely to lose a customer to whoever has stock. Never guess the date.",
    say: "Let me check the exact allocation for that variant and colour rather than give you a rough figure. If the wait doesn't work, there may be a nearby colour or variant arriving sooner — shall I look?",
    avoid: "Don't promise a date you haven't checked in the system. A missed delivery date costs the referral, not just the deal.",
  },
  {
    id: "competitor",
    trigger: "I'm also looking at the Seltos / Nexon",
    why: "Good sign — they're serious enough to shortlist. Don't criticise the rival; the customer has already decided it's worth considering.",
    say: "That's a fair shortlist, it's a good car. The two things owners tell us matter after a couple of years are service reach and resale — can I show you how the two compare on both?",
    avoid: "Never run down the competitor. It makes the customer defend their choice instead of listening.",
  },
  {
    id: "thinking",
    trigger: "Let me think about it",
    why: "Almost always a specific unresolved doubt the customer hasn't voiced — price, family approval, or finance.",
    say: "Of course. So I follow up usefully rather than just chasing you — is it the pricing, the variant, or something you want to check with family first?",
    avoid: "Don't accept it and hang up. A vague follow-up on a vague objection goes nowhere.",
  },
  {
    id: "family",
    trigger: "I need to discuss with my family",
    why: "The decision-maker isn't on the call. Nothing progresses until they are.",
    say: "That makes sense, it's a family car. Would a weekend test drive work, so everyone can see it together? That usually settles it faster than photos.",
    avoid: "Don't keep selling to someone who can't say yes. Get the group in front of the car.",
  },
  {
    id: "callback",
    trigger: "Call me later",
    why: "Either genuinely busy or a soft brush-off. The difference shows in whether they'll commit to a time.",
    say: "No problem — would tomorrow evening around 6 suit, or is a weekend morning easier?",
    avoid: "Don't leave it open-ended. \\\"I'll call sometime\\\" becomes a lead that goes cold.",
  },
];

const CALL_OPENERS = [
  { label: "New enquiry", text: "Good morning, am I speaking with {name}? This is {me} from Autoprism Hyundai. You'd enquired about the {model} — is this a good time to talk for two minutes?" },
  { label: "Reactivating an old lead", text: "Hello {name}, {me} from Autoprism Hyundai. We'd spoken a while back about the {model}. There are some new offers this month — would it be worth me sharing them?" },
  { label: "Missed follow-up", text: "Hi {name}, {me} from Autoprism Hyundai. I owe you a call from last week about the {model} — apologies for the delay. Where did you get to on it?" },
];

const COMPARISONS = [
  {
    ours: "Creta", theirs: "Kia Seltos", segment: "Mid-size SUV",
    headline: "Same platform, same engines — the difference is what happens after the sale.",
    points: [
      { us: "Widest service network in the segment", them: "Fewer touchpoints outside metros", note: "Matters most for tier-2/3 buyers and anyone who travels" },
      { us: "Strongest resale in segment over 5 years", them: "Resale trails by a noticeable margin", note: "Worth quantifying in rupees, not adjectives" },
      { us: "Diesel-automatic across more trims", them: "Limited diesel-AT availability", note: "Only raise if they've asked about diesel" },
    ],
    watchOut: "Seltos genuinely has a sharper interior design. If they've seen it, acknowledge that rather than arguing — then move to ownership costs.",
  },
  {
    ours: "Venue", theirs: "Tata Nexon", segment: "Compact SUV",
    headline: "Nexon leads on crash rating — don't fight that. Compete on refinement and running costs.",
    points: [
      { us: "Smoother turbo-petrol and gearbox", them: "More vibration at idle, notchier shift", note: "Best demonstrated on a test drive, not described" },
      { us: "Better cabin fit and finish", them: "Panel gaps and switchgear vary", note: "Let them touch it — this argument wins in person" },
      { us: "Lower routine service cost", them: "Higher per-service outgo", note: "Bring the actual service schedule sheet" },
    ],
    watchOut: "If safety rating is their main criterion, be honest — Nexon rates higher. Pivot to overall ownership rather than disputing the score.",
  },
  {
    ours: "Alcazar", theirs: "Mahindra XUV700", segment: "7-seater SUV",
    headline: "XUV700 wins on power and price. Alcazar wins on the third row actually being usable.",
    points: [
      { us: "Genuinely usable third row for adults", them: "Third row best for children", note: "Ask who will sit there — this decides it" },
      { us: "Quieter cabin at highway speeds", them: "More road and engine noise", note: "Long-distance families notice within minutes" },
      { us: "Shorter, more predictable waiting period", them: "Long and variable waits", note: "Check current allocation before quoting" },
    ],
    watchOut: "Don't compete on straight-line performance — you'll lose. Move the conversation to who's actually travelling in the car.",
  },
  {
    ours: "Ioniq 5", theirs: "BYD Atto 3", segment: "Electric SUV",
    headline: "Charging speed and network access are the whole argument.",
    points: [
      { us: "800V architecture — 10–80% in ~18 min", them: "Notably slower DC charging", note: "The single strongest EV talking point" },
      { us: "Established service network", them: "Thin service footprint in India", note: "First question most EV buyers ask" },
      { us: "Higher certified range on Long Range", them: "Lower usable range", note: "Quote certified figures, never estimates" },
    ],
    watchOut: "Atto 3 is materially cheaper. If budget is the constraint, this is not the right comparison — steer to a petrol SUV instead of losing the customer entirely.",
  },
];

/* ============================== LEARNING ==============================
   Same structure as the Sales Executive app — four categories on one axis, an hours
   panel on top, and product kept separate from skills. The content is different because
   the job is: a telecaller has ninety seconds on a phone with someone who didn't expect
   the call, and their output is a qualified handoff rather than a sale. */

const LEARN_CATS = [
  { key: "video",    label: "Videos",   Icon: PlayCircle, color: C.hot,    verb: "Watch" },
  { key: "podcast",  label: "Podcasts", Icon: Headphones, color: C.purple, verb: "Listen" },
  { key: "article",  label: "Articles", Icon: FileText,   color: C.cold,   verb: "Read" },
  { key: "internal", label: "Internal", Icon: Users,      color: C.teal,   verb: "Watch" },
];

const LEARN_LIBRARY = [
  // ---- Videos ----
  { id: "first15", cat: "video", mins: 5, topic: "Openers",
    title: "The first fifteen seconds", by: "Autoprism Sales Lab",
    blurb: "Name yourself, name the dealership, name what they enquired about, then ask if it's a good time. Skip any of the four and the call is already over." },
  { id: "qual-noint", cat: "video", mins: 9, topic: "Qualifying",
    title: "Qualifying without interrogating", by: "Autoprism Sales Lab",
    blurb: "Budget, timeline and decision-maker, established through conversation rather than a checklist read aloud." },
  { id: "whatsapp-please", cat: "video", mins: 7, topic: "Objections",
    title: "\"Just send details on WhatsApp\"", by: "Meera Shankar · sales trainer",
    blurb: "Usually a polite exit. How to earn another sixty seconds without arguing." },
  { id: "wrong-person", cat: "video", mins: 6, topic: "Objections",
    title: "When you've reached the wrong person", by: "Autoprism Sales Lab",
    blurb: "Enquiries get filed under a brother, a driver, an office number. Finding the buyer without annoying whoever picked up." },

  // ---- Podcasts ----
  { id: "tone", cat: "podcast", mins: 16, topic: "Communication",
    title: "Reading tone on a call", by: "The Showroom Floor · Ep. 12",
    blurb: "Without a face to read, pace and hesitation are the only signals you get. What each one usually means." },
  { id: "callback", cat: "podcast", mins: 19, topic: "Follow-up",
    title: "The callback that gets answered", by: "The Showroom Floor · Ep. 27",
    blurb: "Why \"I'll call you sometime\" guarantees a cold lead, and what to commit to instead." },
  { id: "cold48", cat: "podcast", mins: 23, topic: "Follow-up",
    title: "Why leads go cold in 48 hours", by: "The Showroom Floor · Ep. 05",
    blurb: "What actually happens to an enquiry between the form submission and the third day." },

  // ---- Articles ----
  { id: "objections", cat: "article", mins: 6, topic: "Objections",
    title: "Objection quick-reference", by: "Autoprism",
    blurb: "The six that come up daily — price, waiting period, competitor, thinking about it, family, call me later — with what to say and what to avoid.", tag: "Most opened" },
  { id: "best-times", cat: "article", mins: 4, topic: "Follow-up",
    title: "Best times to call, by source", by: "Autoprism",
    blurb: "Portal leads and walk-in follow-ups answer at completely different hours." },
  { id: "what-qualified", cat: "article", mins: 5, topic: "Qualifying",
    title: "What counts as qualified", by: "Autoprism",
    blurb: "The bar for a handoff. Passing on a lead that was never going to buy costs the SE a day and costs you credibility." },
  { id: "logging", cat: "article", mins: 4, topic: "Handoff",
    title: "Logging a call the SE can actually use", by: "Autoprism",
    blurb: "What to write so the next person doesn't have to re-ask everything you already covered." },

  // ---- Internal ----
  { id: "priya-45", cat: "internal", mins: 8, topic: "Qualifying",
    title: "How I hold a 45% qualification rate", by: "Priya Nair · Indiranagar",
    blurb: "Where she sets the bar, and the two questions she asks before deciding to pass a lead on.", tag: "Most watched" },
  { id: "revive", cat: "internal", mins: 6, topic: "Follow-up",
    title: "Reviving a 90-day-old lead", by: "Priya Nair",
    blurb: "The opener that works on someone who enquired three months ago and has been called twice since." },
];

const LEARN_LOG = { video: 38, podcast: 71, article: 24, internal: 16 };

function LearningScreen() {
  const [view, setView] = useState("skills");
  const [cat, setCat] = useState("video");
  const [done, setDone] = useState(["objections", "logging"]);
  const [openId, setOpenId] = useState(null);
  const [openModel, setOpenModel] = useState(null);

  const shown = LEARN_LIBRARY.filter(m => m.cat === cat);
  const totalMins = Object.values(LEARN_LOG).reduce((a, b) => a + b, 0);
  const goalMins = 180;
  const lastMonth = 96;
  const teamAvg = 132;
  const fmtH = (m) => m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
  const deltaM = totalMins - lastMonth;

  return (
    <div style={{ padding: "14px 14px 90px" }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 13 }}>
        {[["skills", "Skills"], ["product", "Product & rivals"]].map(([k, l]) => {
          const on = view === k;
          return (
            <button key={k} onClick={() => setView(k)} style={{
              flex: 1, padding: "10px 0", borderRadius: 11, cursor: "pointer",
              border: `1.5px solid ${on ? C.primary : C.border}`,
              background: on ? C.primarySoft : C.card, color: on ? C.primary : C.sub,
              fontFamily: F, fontWeight: 800, fontSize: 12.5,
            }}>{l}</button>
          );
        })}
      </div>

      {/* ---- Product: looked up mid-call, so no durations or progress here. ---- */}
      {view === "product" && (
        <>
          <div style={{ fontFamily: F, fontSize: 11.5, color: C.sub, marginBottom: 11, lineHeight: 1.45 }}>
            For when a customer names a rival mid-call. Enough to hold the conversation and
            book the drive — the Sales Executive takes it from there.
          </div>
          {COMPARISONS.map(c => {
            const id = c.ours + c.theirs;
            const open = openModel === id;
            return (
              <div key={id} style={{ background: C.card, border: `1px solid ${open ? C.primary + "55" : C.border}`,
                borderRadius: 12, marginBottom: 9, overflow: "hidden" }}>
                <button onClick={() => setOpenModel(open ? null : id)} style={{
                  display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "13px 14px",
                  background: "none", border: "none", cursor: "pointer", textAlign: "left",
                }}>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontFamily: F, fontSize: 13.5, fontWeight: 800, color: C.ink }}>
                      {c.ours} <span style={{ color: C.faint, fontWeight: 500 }}>vs</span> {c.theirs}
                    </span>
                    <span style={{ display: "block", fontFamily: F, fontSize: 11, color: C.sub, marginTop: 2 }}>{c.segment}</span>
                  </span>
                  <ChevronDown size={15} color={C.faint} style={{ flexShrink: 0,
                    transform: open ? "rotate(180deg)" : "none", transition: "transform .18s" }} />
                </button>
                {open && (
                  <div style={{ padding: "0 14px 14px" }}>
                    <div style={{ background: C.primarySoft, borderRadius: 9, padding: "10px 11px", marginBottom: 11 }}>
                      <span style={{ fontFamily: F, fontSize: 12, fontWeight: 700, color: C.primary, lineHeight: 1.45 }}>
                        {c.headline}
                      </span>
                    </div>
                    {c.points.map((p, i) => (
                      <div key={i} style={{ display: "flex", gap: 7, marginBottom: 7 }}>
                        <CheckCircle2 size={13} color={C.green} style={{ flexShrink: 0, marginTop: 2 }} />
                        <span style={{ fontFamily: F, fontSize: 12, color: C.ink, lineHeight: 1.45 }}>
                          {p.us}
                          <span style={{ display: "block", color: C.sub, marginTop: 1 }}>
                            {c.theirs}: {p.them}
                          </span>
                        </span>
                      </div>
                    ))}
                    <div style={{ display: "flex", gap: 7, background: C.warmSoft, borderRadius: 9,
                      padding: "10px 11px", marginTop: 6 }}>
                      <AlertTriangle size={13} color={C.warm} style={{ flexShrink: 0, marginTop: 1 }} />
                      <span style={{ fontFamily: F, fontSize: 11.5, color: C.warm, lineHeight: 1.5 }}>
                        <strong>Where they beat us: </strong>{c.watchOut}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}

      {/* ---- Skills ---- */}
      {view === "skills" && (<>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16,
          padding: 15, marginBottom: 12, boxShadow: shadow }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
            <div>
              <div style={{ fontFamily: F, fontSize: 10, fontWeight: 800, color: C.faint,
                textTransform: "uppercase", letterSpacing: 0.6 }}>Learning time · this month</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 7, marginTop: 5 }}>
                <span style={{ fontFamily: F, fontSize: 30, fontWeight: 900, color: C.ink,
                  letterSpacing: -1.2, lineHeight: 1 }}>{fmtH(totalMins)}</span>
                <span style={{ fontFamily: F, fontSize: 12, fontWeight: 800,
                  color: deltaM >= 0 ? C.green : C.hot }}>
                  {deltaM >= 0 ? "▲" : "▼"}{fmtH(Math.abs(deltaM))}
                </span>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: F, fontSize: 11, color: C.sub }}>{done.length} completed</div>
              <div style={{ fontFamily: F, fontSize: 11, color: C.faint, marginTop: 2 }}>team {fmtH(teamAvg)}</div>
            </div>
          </div>

          <div style={{ display: "flex", height: 8, borderRadius: 999, overflow: "hidden", marginBottom: 8 }}>
            {LEARN_CATS.map(c => (
              <span key={c.key} style={{ width: `${(LEARN_LOG[c.key] / totalMins) * 100}%`, background: c.color }} />
            ))}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 11, marginBottom: 11 }}>
            {LEARN_CATS.map(c => (
              <span key={c.key} style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 7, height: 7, borderRadius: 2, background: c.color }} />
                <span style={{ fontFamily: F, fontSize: 10.5, color: C.sub }}>
                  {c.label} <strong style={{ color: C.ink }}>{fmtH(LEARN_LOG[c.key])}</strong>
                </span>
              </span>
            ))}
          </div>
          <div style={{ height: 5, background: C.bg, borderRadius: 999, overflow: "hidden" }}>
            <div style={{ width: `${Math.min(100, (totalMins / goalMins) * 100)}%`, height: "100%",
              background: totalMins >= goalMins ? C.green : C.primary, borderRadius: 999 }} />
          </div>
          <div style={{ fontFamily: F, fontSize: 10.5, color: C.sub, marginTop: 6 }}>
            {totalMins >= goalMins
              ? `Past the ${fmtH(goalMins)} monthly goal.`
              : `${fmtH(goalMins - totalMins)} short of the ${fmtH(goalMins)} monthly goal.`}
          </div>
        </div>

        <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
          {LEARN_CATS.map(c => {
            const on = cat === c.key;
            const n = LEARN_LIBRARY.filter(m => m.cat === c.key).length;
            return (
              <button key={c.key} onClick={() => { setCat(c.key); setOpenId(null); }} style={{
                flex: 1, padding: "10px 2px", borderRadius: 11, cursor: "pointer",
                border: `1.5px solid ${on ? c.color : C.border}`,
                background: on ? c.color + "12" : C.card,
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              }}>
                {React.createElement(c.Icon, { size: 16, color: on ? c.color : C.sub })}
                <span style={{ fontFamily: F, fontSize: 10.5, fontWeight: 700, color: on ? c.color : C.sub }}>{c.label}</span>
                <span style={{ fontFamily: F, fontSize: 9.5, color: on ? c.color : C.faint, opacity: .8 }}>{n}</span>
              </button>
            );
          })}
        </div>

        {shown.map(m => {
          const meta = LEARN_CATS.find(c => c.key === m.cat);
          const isDone = done.includes(m.id);
          const open = openId === m.id;
          return (
            <div key={m.id} style={{ background: C.card, border: `1px solid ${open ? meta.color + "66" : C.border}`,
              borderRadius: 12, marginBottom: 8, overflow: "hidden" }}>
              <button onClick={() => setOpenId(open ? null : m.id)} style={{
                display: "flex", alignItems: "center", gap: 11, width: "100%", padding: 13,
                background: "none", border: "none", cursor: "pointer", textAlign: "left",
              }}>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
                    <span style={{ fontFamily: F, fontSize: 11, fontWeight: 700, color: C.sub }}>{m.mins} min</span>
                    <span style={{ fontFamily: F, fontSize: 11, color: C.faint }}>·</span>
                    <span style={{ fontFamily: F, fontSize: 11, color: C.sub }}>{m.topic}</span>
                    {m.tag && (
                      <span style={{ background: C.warmSoft, color: C.warm, borderRadius: 5, padding: "1px 6px",
                        fontFamily: F, fontSize: 9, fontWeight: 800 }}>{m.tag}</span>
                    )}
                  </span>
                  <span style={{ display: "block", fontFamily: F, fontSize: 13.5, fontWeight: 700,
                    color: isDone ? C.sub : C.ink, lineHeight: 1.3,
                    textDecoration: isDone ? "line-through" : "none" }}>{m.title}</span>
                  <span style={{ display: "block", fontFamily: F, fontSize: 11, color: C.faint, marginTop: 3 }}>{m.by}</span>
                </span>
                {isDone && <CheckCircle2 size={17} color={C.green} style={{ flexShrink: 0 }} />}
                <ChevronDown size={15} color={C.faint} style={{ flexShrink: 0,
                  transform: open ? "rotate(180deg)" : "none", transition: "transform .18s" }} />
              </button>
              {open && (
                <div style={{ padding: "0 13px 13px" }}>
                  <div style={{ fontFamily: F, fontSize: 12, color: C.sub, lineHeight: 1.55, marginBottom: 11 }}>
                    {m.blurb}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => setDone(d => isDone ? d.filter(x => x !== m.id) : [...d, m.id])}
                      style={{ padding: "9px 14px", borderRadius: 9, cursor: "pointer",
                        border: `1.5px solid ${C.borderStrong}`, background: C.card, color: C.sub,
                        fontFamily: F, fontWeight: 700, fontSize: 12 }}>
                      {isDone ? "Undo" : "Mark done"}
                    </button>
                    <button style={{ flex: 1, padding: "9px 0", borderRadius: 9, cursor: "pointer",
                      border: "none", background: meta.color, color: "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      fontFamily: F, fontWeight: 800, fontSize: 12 }}>
                      {React.createElement(meta.Icon, { size: 14, color: "#fff" })}
                      {meta.verb} · {m.mins} min
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </>)}
    </div>
  );
}

/* ============================== DASHBOARD ANALYTICS ==============================
   The previous dashboard was decorative — donuts and sparklines that looked active but
   never answered the only two questions a rep has: where am I leaking, and what do I do
   about it today. This is built the other way round: one funnel table that can be sliced
   three ways, and rules that read the table and say something specific.

   Live leads alone are too few to show a six-month trend, so the history below is
   generated deterministically for the demo. In production this is a query. */

const FUNNEL_STAGES = [
  { key: "leads",       label: "Leads",       short: "Leads" },
  { key: "contacted",   label: "Contacted",   short: "Cont" },
  { key: "opportunity", label: "Opportunity", short: "Opp" },
  { key: "visit",       label: "Visit",       short: "Visit" },
  { key: "booking",     label: "Booking",     short: "Book" },
  { key: "retailed",    label: "Retailed",    short: "Retail" },
  { key: "delivered",   label: "Delivered",   short: "Deliv" },
];

const HIST_SOURCES = ["Website", "CarDekho", "Referral", "Walk-in", "Facebook Ad", "OLX", "Justdial"];
const HIST_MODELS  = ["Creta", "Venue", "Verna", "i20", "Alcazar", "Exter", "Tucson", "Ioniq 5"];

// Per-source conversion character — referrals close, portals leak early. Having sources
// behave differently is what makes the source slice worth looking at.
const SOURCE_PROFILE = {
  "Referral":    { contact: 0.95, opp: 0.72, visit: 0.60, book: 0.42, retail: 0.38 },
  "Walk-in":     { contact: 0.98, opp: 0.66, visit: 0.58, book: 0.36, retail: 0.33 },
  "Website":     { contact: 0.88, opp: 0.48, visit: 0.32, book: 0.18, retail: 0.15 },
  "CarDekho":    { contact: 0.72, opp: 0.34, visit: 0.20, book: 0.10, retail: 0.08 },
  "Facebook Ad": { contact: 0.61, opp: 0.24, visit: 0.13, book: 0.06, retail: 0.05 },
  "OLX":         { contact: 0.66, opp: 0.29, visit: 0.17, book: 0.08, retail: 0.06 },
  "Justdial":    { contact: 0.70, opp: 0.31, visit: 0.18, book: 0.09, retail: 0.07 },
};

function buildHistory(seed = 11) {
  let n = seed;
  const rnd = () => { n = (n * 1103515245 + 12345) & 0x7fffffff; return n / 0x7fffffff; };
  const rows = [];
  for (let m = 5; m >= 0; m--) {
    const monthDate = new Date(today.getFullYear(), today.getMonth() - m, 1);
    // Volume drifts month to month, and the current month is only part-elapsed.
    const base = 34 + Math.floor(rnd() * 16);
    // Current month is part-elapsed, but never so thin that the table looks broken.
    const count = m === 0 ? Math.max(18, Math.round(base * (today.getDate() / 30))) : base;
    for (let i = 0; i < count; i++) {
      const source = HIST_SOURCES[Math.floor(rnd() * HIST_SOURCES.length)];
      const model  = HIST_MODELS[Math.floor(rnd() * HIST_MODELS.length)];
      const p = SOURCE_PROFILE[source];
      const contacted   = rnd() < p.contact;
      const opportunity = contacted   && rnd() < p.opp / p.contact;
      const visit       = opportunity && rnd() < p.visit / p.opp;
      const booking     = visit       && rnd() < p.book / p.visit;
      const retailed    = booking     && rnd() < p.retail / p.book;
      // Delivery lags — a car booked this month is often delivered next.
      const delivered   = retailed    && (m > 0 || rnd() < 0.55);
      rows.push({ month: monthDate, monthIdx: m, source, model,
        contacted, opportunity, visit, booking, retailed, delivered });
    }
  }
  return rows;
}

// Roll a set of rows into funnel counts.
function funnelOf(rows) {
  return {
    leads:       rows.length,
    contacted:   rows.filter(r => r.contacted).length,
    opportunity: rows.filter(r => r.opportunity).length,
    visit:       rows.filter(r => r.visit).length,
    booking:     rows.filter(r => r.booking).length,
    retailed:    rows.filter(r => r.retailed).length,
    delivered:   rows.filter(r => r.delivered).length,
  };
}

const pct = (a, b) => b ? Math.round((a / b) * 100) : 0;
const delta = (cur, prev) => prev ? Math.round(((cur - prev) / prev) * 100) : null;

/* ---- The funnel table ----
   Rows are whichever dimension is selected; columns are always the funnel. Every cell
   carries the count and, beneath it, that stage as a share of the row's own lead count —
   so a small source with good conversion doesn't get visually buried by a big leaky one. */
function FunnelTable({ rows, dimension, onPickRow, activeRow, totals }) {
  const [mode, setMode] = useState("of_leads"); // of_leads | step

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <span style={{ flex: 1, fontFamily: F, fontSize: 9.5, color: C.faint }}>
          {mode === "of_leads" ? "% of that row's leads" : "% converted from the previous stage"}
        </span>
        <button onClick={() => setMode(m => m === "of_leads" ? "step" : "of_leads")} style={{
          background: "none", border: `1px solid ${C.border}`, borderRadius: 7, padding: "3px 8px",
          cursor: "pointer", fontFamily: F, fontSize: 9.5, fontWeight: 700, color: C.sub,
        }}>{mode === "of_leads" ? "Show step %" : "Show total %"}</button>
      </div>

      <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <div style={{ minWidth: 520 }}>
          {/* header */}
          <div style={{ display: "flex", borderBottom: `1.5px solid ${C.borderStrong}`, paddingBottom: 6, marginBottom: 4 }}>
            <span style={{ width: 96, flexShrink: 0, fontFamily: F, fontSize: 9, fontWeight: 800,
              color: C.faint, textTransform: "uppercase", letterSpacing: 0.4 }}>{dimension}</span>
            {FUNNEL_STAGES.map(s => (
              <span key={s.key} style={{ flex: 1, textAlign: "center", fontFamily: F, fontSize: 9,
                fontWeight: 800, color: C.faint, textTransform: "uppercase", letterSpacing: 0.3 }}>{s.short}</span>
            ))}
          </div>

          {rows.map(r => {
            const on = activeRow === r.label;
            return (
              <button key={r.label} onClick={() => onPickRow && onPickRow(on ? null : r.label)} style={{
                display: "flex", width: "100%", alignItems: "stretch", padding: "7px 0",
                borderBottom: `1px solid ${C.border}`, background: on ? C.primarySoft : "none",
                border: "none", borderRadius: on ? 6 : 0, cursor: onPickRow ? "pointer" : "default", textAlign: "left",
              }}>
                <span style={{ width: 96, flexShrink: 0, display: "flex", alignItems: "center",
                  fontFamily: F, fontSize: 11, fontWeight: on ? 800 : 600, color: on ? C.primary : C.ink,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingLeft: on ? 6 : 0 }}>
                  {r.label}
                </span>
                {FUNNEL_STAGES.map((s, i) => {
                  const v = r.values[s.key] || 0;
                  const prev = i === 0 ? null : (r.values[FUNNEL_STAGES[i - 1].key] || 0);
                  const share = i === 0 ? null
                    : mode === "of_leads" ? pct(v, r.values.leads) : pct(v, prev);
                  // The biggest single drop in a row is the leak worth naming.
                  const drop = i > 0 && prev ? pct(prev - v, prev) : 0;
                  const worst = i > 0 && drop >= 45;
                  return (
                    <span key={s.key} style={{ flex: 1, textAlign: "center" }}>
                      <span style={{ display: "block", fontFamily: F, fontSize: 12.5, fontWeight: 800,
                        color: v === 0 ? C.ghost : worst ? C.hot : C.ink, lineHeight: 1.15 }}>{v}</span>
                      {share != null && (
                        <span style={{ display: "block", fontFamily: F, fontSize: 9,
                          color: worst ? C.hot : C.faint, marginTop: 1 }}>{share}%</span>
                      )}
                    </span>
                  );
                })}
              </button>
            );
          })}

          {/* Total sits inside the same scroll container as the rows — it previously had
              its own overflow, so scrolling the table right left the totals behind. */}
          {totals && (
            <div style={{ display: "flex", paddingTop: 8, marginTop: 4,
              borderTop: `1.5px solid ${C.borderStrong}` }}>
              <span style={{ width: 96, flexShrink: 0, fontFamily: F, fontSize: 10.5,
                fontWeight: 800, color: C.sub }}>Total</span>
              {FUNNEL_STAGES.map((st, i) => (
                <span key={st.key} style={{ flex: 1, textAlign: "center" }}>
                  <span style={{ display: "block", fontFamily: F, fontSize: 12.5, fontWeight: 900, color: C.ink }}>
                    {totals[st.key]}
                  </span>
                  {i > 0 && (
                    <span style={{ display: "block", fontFamily: F, fontSize: 9, color: C.faint }}>
                      {pct(totals[st.key], totals.leads)}%
                    </span>
                  )}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---- Insights ----
   Rules over the same numbers the table shows. Each one names the thing, quantifies it,
   and says what to do — an observation with no action attached is just another number. */
function buildInsights({ rows, totals, prevTotals, bySource, byModel, role }) {
  const out = [];

  // 1. Biggest funnel leak.
  let worst = null;
  FUNNEL_STAGES.forEach((s, i) => {
    if (i === 0) return;
    const prev = totals[FUNNEL_STAGES[i - 1].key];
    const cur = totals[s.key];
    if (prev < 5) return;
    const lost = prev - cur;
    if (!worst || lost > worst.lost) {
      worst = { from: FUNNEL_STAGES[i - 1].label, to: s.label, lost, rate: pct(cur, prev) };
    }
  });
  if (worst && worst.rate < 70) {
    out.push({
      tone: "warn",
      title: `${worst.from} → ${worst.to} is your biggest leak`,
      body: `Only ${worst.rate}% get through — ${worst.lost} leads stop here. `
        + (worst.to === "Visit"
            ? "Getting people into a car is the step that most predicts a sale; try offering a home test drive."
            : worst.to === "Booking"
            ? "Deals stall here on price or family approval. Ask what's unresolved before the drive ends, not after."
            : worst.to === "Contacted"
            ? "These leads were never reached. Speed matters more than anything else at this stage."
            : "Worth reviewing what happens immediately after this step."),
    });
  }

  // 2. Best and worst source by end-to-end conversion, where volume justifies the claim.
  const credible = bySource.filter(s => s.values.leads >= 8);
  if (credible.length >= 2) {
    const scored = credible.map(s => ({ ...s, conv: pct(s.values.retailed, s.values.leads) }))
      .sort((a, b) => b.conv - a.conv);
    const best = scored[0], poor = scored[scored.length - 1];
    if (best.conv >= poor.conv * 2 && best.conv > 0) {
      out.push({
        tone: "good",
        title: `${best.label} converts ${best.conv}% — ${poor.label} only ${poor.conv}%`,
        body: `${best.label} gave you ${best.values.leads} leads and ${best.values.retailed} retails. `
          + `${poor.label} gave ${poor.values.leads} for ${poor.values.retailed}. `
          + `Same hours spent — ask your manager for more ${best.label} allocation.`,
      });
    }
  }

  // 3. Movement against the previous period.
  if (prevTotals && prevTotals.leads >= 10) {
    const d = delta(totals.retailed, prevTotals.retailed);
    const convNow = pct(totals.retailed, totals.leads);
    const convPrev = pct(prevTotals.retailed, prevTotals.leads);
    if (d != null && Math.abs(d) >= 15) {
      out.push({
        tone: d > 0 ? "good" : "warn",
        title: d > 0 ? `Retails up ${d}% on the previous period` : `Retails down ${Math.abs(d)}% on the previous period`,
        body: convNow === convPrev
          ? `Conversion held at ${convNow}%, so this is a volume change rather than a quality one.`
          : `Conversion moved ${convPrev}% → ${convNow}%, so this is about how the leads were worked, not just how many arrived.`,
      });
    }
  }

  // 4. Model concentration — a rep selling one model well may be avoiding the others.
  const modelsWithRetail = byModel.filter(m => m.values.retailed > 0)
    .sort((a, b) => b.values.retailed - a.values.retailed);
  if (modelsWithRetail.length && totals.retailed >= 4) {
    const top = modelsWithRetail[0];
    const share = pct(top.values.retailed, totals.retailed);
    if (share >= 45) {
      out.push({
        tone: "info",
        title: `${share}% of your retails are ${top.label}`,
        body: `You're strong on ${top.label}. The risk is the rest of the range — check whether `
          + `enquiries for other models are being worked as hard, or handed on.`,
      });
    }
  }

  // 5. Role-specific.
  if (role === "telecaller") {
    const q = totals.opportunity;      // qualified and passed on
    const r = totals.retailed;
    const acc = pct(r, q);
    if (q >= 10) {
      out.push({
        tone: acc < 12 ? "warn" : "good",
        title: `${acc}% of the leads you qualified went on to retail`,
        body: acc < 12
          ? `You passed ${q} leads and ${r} converted. A low rate usually means the bar for "qualified" is set too low — tightening it saves the SE team time and makes your handoffs count for more.`
          : `You passed ${q} leads and ${r} converted. That's a healthy bar — your judgement on what counts as qualified is holding up downstream.`,
      });
    }
  } else {
    const stalled = totals.opportunity - totals.visit;
    if (stalled > 5) {
      out.push({
        tone: "info",
        title: `${stalled} opportunities never took a test drive`,
        body: `These are people who showed real interest and then didn't get in a car. `
          + `It's usually the cheapest conversion available to you this month.`,
      });
    }
  }

  return out.slice(0, 4);
}

function InsightCard({ insight }) {
  const tone = insight.tone === "warn" ? { c: C.hot, s: C.hotSoft, Icon: AlertTriangle }
             : insight.tone === "good" ? { c: C.green, s: C.greenSoft, Icon: TrendingUp }
             : { c: C.cold, s: C.coldSoft, Icon: Sparkles };
  return (
    <div style={{ display: "flex", gap: 9, background: tone.s, borderRadius: 11, padding: "11px 12px", marginBottom: 8 }}>
      <tone.Icon size={15} color={tone.c} style={{ flexShrink: 0, marginTop: 1 }} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: F, fontSize: 12, fontWeight: 800, color: tone.c, lineHeight: 1.35 }}>{insight.title}</div>
        <div style={{ fontFamily: F, fontSize: 11, color: C.sub, lineHeight: 1.5, marginTop: 3 }}>{insight.body}</div>
      </div>
    </div>
  );
}

// KPI tile with a like-for-like comparison against the equivalent prior period.
function KpiTile({ label, value, prev, accent }) {
  const d = delta(value, prev);
  const up = d != null && d > 0;
  return (
    <div style={{ flex: "1 1 45%", background: C.card, border: `1px solid ${C.border}`,
      borderRadius: 12, padding: "11px 12px" }}>
      <div style={{ fontFamily: F, fontSize: 9, fontWeight: 800, color: C.faint,
        textTransform: "uppercase", letterSpacing: 0.4 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 5 }}>
        <span style={{ fontFamily: F, fontSize: 22, fontWeight: 900, color: accent || C.ink,
          letterSpacing: -0.5, lineHeight: 1 }}>{value}</span>
        {d != null && (
          <span style={{ fontFamily: F, fontSize: 10, fontWeight: 800, color: up ? C.green : C.hot }}>
            {up ? "▲" : "▼"}{Math.abs(d)}%
          </span>
        )}
      </div>
      <div style={{ fontFamily: F, fontSize: 9.5, color: C.faint, marginTop: 3 }}>
        {prev != null ? `${prev} previous period` : "no prior data"}
      </div>
    </div>
  );
}

function DashboardScreen({ leads }) {
  const [months, setMonths] = useState(1);
  const [dim, setDim] = useState("source");
  const [drill, setDrill] = useState(null);

  const history = useMemo(() => buildHistory(23), []);
  const inWindow = history.filter(r => r.monthIdx < months);
  const prevWindow = history.filter(r => r.monthIdx >= months && r.monthIdx < months * 2);
  const totals = funnelOf(inWindow);
  const prevTotals = funnelOf(prevWindow);

  const group = (rowsIn, keyFn) => {
    const map = {};
    rowsIn.forEach(r => { const k = keyFn(r); (map[k] = map[k] || []).push(r); });
    return Object.keys(map).map(k => ({ label: k, values: funnelOf(map[k]), rows: map[k] }));
  };

  const monthRows = (() => {
    const out = [];
    for (let m = months - 1; m >= 0; m--) {
      const rowsM = history.filter(r => r.monthIdx === m);
      if (!rowsM.length) continue;
      out.push({ label: rowsM[0].month.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
        values: funnelOf(rowsM), rows: rowsM });
    }
    return out;
  })();
  const bySource = group(inWindow, r => r.source).sort((a, b) => b.values.leads - a.values.leads);
  const byModel  = group(inWindow, r => r.model).sort((a, b) => b.values.leads - a.values.leads);
  const tableRows = dim === "month" ? monthRows : dim === "source" ? bySource : byModel;

  const insights = useMemo(
    () => buildInsights({ rows: inWindow, totals, prevTotals, bySource, byModel, role: "telecaller" }),
    [months]
  );

  const thisM = funnelOf(history.filter(r => r.monthIdx === 0));
  const lastM = funnelOf(history.filter(r => r.monthIdx === 1));

  // The telecaller's own quality measure. She controls up to "qualified"; everything after
  // that is the SE's work. Comparing the two is the only honest read on whether her bar is
  // set right — a low rate means she's passing on leads that were never going to buy.
  const qualified = totals.opportunity;
  const converted = totals.retailed;
  const accuracy = pct(converted, qualified);
  const teamBar = 22; // what a healthy handoff looks like here

  // Outcome breakdown of the leads she qualified, by source.
  const outcomeRows = bySource.map(s => ({
    label: s.label,
    q: s.values.opportunity,
    visit: s.values.visit,
    booked: s.values.booking,
    retail: s.values.retailed,
    rate: pct(s.values.retailed, s.values.opportunity),
  })).filter(r => r.q > 0).sort((a, b) => b.rate - a.rate);

  const RANGES = [{ k: 1, l: "This month" }, { k: 3, l: "3 months" }, { k: 6, l: "6 months" }];
  const DIMS = [{ k: "month", l: "By month" }, { k: "source", l: "By source" }, { k: "model", l: "By model" }];
  const drillRow = tableRows.find(r => r.label === drill);

  return (
    <div style={{ padding: "14px 14px 90px" }}>
      <div style={{ fontFamily: F, fontWeight: 800, fontSize: 15, color: C.ink }}>Dashboard</div>
      <div style={{ fontFamily: F, fontSize: 11, color: C.sub, marginTop: 1, marginBottom: 12 }}>
        What you qualified, and what became of it
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        <KpiTile label="Contacted · this month" value={thisM.contacted} prev={lastM.contacted} />
        <KpiTile label="Qualified · this month" value={thisM.opportunity} prev={lastM.opportunity} accent={C.primary} />
        <KpiTile label="Test drives · this month" value={thisM.visit} prev={lastM.visit} accent={C.warm} />
        <KpiTile label="Retailed · this month" value={thisM.retailed} prev={lastM.retailed} accent={C.green} />
      </div>

      <div style={{ display: "flex", gap: 5, marginBottom: 8 }}>
        {RANGES.map(r => {
          const on = months === r.k;
          return (
            <button key={r.k} onClick={() => { setMonths(r.k); setDrill(null); }} style={{
              flex: 1, padding: "8px 0", borderRadius: 9, cursor: "pointer",
              border: `1.5px solid ${on ? C.primary : C.border}`,
              background: on ? C.primarySoft : C.card, color: on ? C.primary : C.sub,
              fontFamily: F, fontWeight: 700, fontSize: 11.5,
            }}>{r.l}</button>
          );
        })}
      </div>

      {/* ---- Qualification quality: the metric that is actually hers ---- */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 13, marginBottom: 10 }}>
        <div style={{ fontFamily: F, fontSize: 12.5, fontWeight: 800, color: C.ink, marginBottom: 3 }}>
          Quality of your handoffs
        </div>
        <div style={{ fontFamily: F, fontSize: 10.5, color: C.faint, marginBottom: 11, lineHeight: 1.4 }}>
          Of the leads you marked qualified, how many the sales team went on to retail.
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 10, marginBottom: 9 }}>
          <span style={{ fontFamily: F, fontSize: 30, fontWeight: 900,
            color: accuracy >= teamBar ? C.green : C.warm, letterSpacing: -1, lineHeight: 1 }}>{accuracy}%</span>
          <span style={{ fontFamily: F, fontSize: 11, color: C.sub, paddingBottom: 3 }}>
            {converted} retailed from {qualified} qualified
          </span>
        </div>
        <div style={{ position: "relative", height: 7, background: C.bg, borderRadius: 999, marginBottom: 7 }}>
          <div style={{ width: `${Math.min(100, accuracy)}%`, height: "100%",
            background: accuracy >= teamBar ? C.green : C.warm, borderRadius: 999 }} />
          <div style={{ position: "absolute", left: `${teamBar}%`, top: -3, bottom: -3, width: 2, background: C.ink, opacity: .45 }} />
        </div>
        <div style={{ fontFamily: F, fontSize: 10, color: C.faint, lineHeight: 1.45 }}>
          Marker is the {teamBar}% benchmark.{" "}
          {accuracy >= teamBar
            ? "Your bar is set about right — what you pass on is worth the sales team's time."
            : "Below the benchmark. Qualifying more strictly would mean fewer handoffs but better ones."}
        </div>
      </div>

      {/* ---- Main funnel table ---- */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 13, marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <span style={{ flex: 1, fontFamily: F, fontSize: 12.5, fontWeight: 800, color: C.ink }}>Lead funnel</span>
          <span style={{ fontFamily: F, fontSize: 10, color: C.faint }}>
            {totals.leads} leads · {pct(totals.opportunity, totals.leads)}% qualified
          </span>
        </div>
        <div style={{ display: "flex", gap: 5, marginBottom: 11 }}>
          {DIMS.map(d => {
            const on = dim === d.k;
            return (
              <button key={d.k} onClick={() => { setDim(d.k); setDrill(null); }} style={{
                flex: 1, padding: "6px 0", borderRadius: 8, cursor: "pointer",
                border: `1.5px solid ${on ? C.primary : C.border}`,
                background: on ? C.primarySoft : C.card, color: on ? C.primary : C.sub,
                fontFamily: F, fontWeight: 700, fontSize: 10.5,
              }}>{d.l}</button>
            );
          })}
        </div>
        <FunnelTable rows={tableRows} dimension={dim} onPickRow={setDrill} activeRow={drill} totals={totals} />
      </div>

      {drillRow && (
        <div style={{ background: C.primarySoft, border: `1px solid ${C.primary}33`, borderRadius: 12, padding: 12, marginBottom: 10 }}>
          <div style={{ fontFamily: F, fontSize: 12, fontWeight: 800, color: C.primary, marginBottom: 6 }}>{drillRow.label}</div>
          <div style={{ fontFamily: F, fontSize: 11, color: C.sub, lineHeight: 1.55 }}>
            {drillRow.values.leads} leads, {drillRow.values.opportunity} qualified
            ({pct(drillRow.values.opportunity, drillRow.values.leads)}%),
            {" "}{drillRow.values.retailed} eventually retailed.
          </div>
        </div>
      )}

      {/* ---- Downstream outcome by source: what happened after she handed over ---- */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 13, marginBottom: 10 }}>
        <div style={{ fontFamily: F, fontSize: 12.5, fontWeight: 800, color: C.ink, marginBottom: 3 }}>
          Where your qualified leads ended up
        </div>
        <div style={{ fontFamily: F, fontSize: 10.5, color: C.faint, marginBottom: 11, lineHeight: 1.4 }}>
          Sorted by how often a source you qualify actually turns into a sale — the best
          argument for where your calling hours should go.
        </div>
        <div style={{ display: "flex", paddingBottom: 6, borderBottom: `1px solid ${C.border}`, marginBottom: 6 }}>
          <span style={{ flex: 1, fontFamily: F, fontSize: 9, fontWeight: 800, color: C.faint, textTransform: "uppercase" }}>Source</span>
          {["Qual", "TD", "Book", "Retail", "Rate"].map(h => (
            <span key={h} style={{ width: 42, textAlign: "center", fontFamily: F, fontSize: 9, fontWeight: 800, color: C.faint, textTransform: "uppercase" }}>{h}</span>
          ))}
        </div>
        {outcomeRows.map(r => (
          <div key={r.label} style={{ display: "flex", alignItems: "center", padding: "7px 0", borderBottom: `1px solid ${C.border}` }}>
            <span style={{ flex: 1, fontFamily: F, fontSize: 11, fontWeight: 600, color: C.ink, minWidth: 0,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.label}</span>
            {[r.q, r.visit, r.booked, r.retail].map((v, i) => (
              <span key={i} style={{ width: 42, textAlign: "center", fontFamily: F, fontSize: 11.5,
                fontWeight: 700, color: v ? C.ink : C.ghost }}>{v}</span>
            ))}
            <span style={{ width: 42, textAlign: "center", fontFamily: F, fontSize: 11.5, fontWeight: 800,
              color: r.rate >= teamBar ? C.green : r.rate > 0 ? C.warm : C.hot }}>{r.rate}%</span>
          </div>
        ))}
        {outcomeRows.length > 1 && (
          <div style={{ display: "flex", gap: 7, background: C.bg, borderRadius: 9, padding: "9px 10px", marginTop: 10 }}>
            <Sparkles size={13} color={C.primary} style={{ flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontFamily: F, fontSize: 10.5, color: C.sub, lineHeight: 1.45 }}>
              <strong>{outcomeRows[0].label}</strong> converts at {outcomeRows[0].rate}% once you qualify it,
              against {outcomeRows[outcomeRows.length - 1].rate}% for <strong>{outcomeRows[outcomeRows.length - 1].label}</strong>.
              Same call time, very different outcome.
            </span>
          </div>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 7, margin: "14px 0 9px" }}>
        <Sparkles size={14} color={C.primary} />
        <span style={{ fontFamily: F, fontSize: 12.5, fontWeight: 800, color: C.ink }}>What this is telling you</span>
      </div>
      {insights.length === 0
        ? <div style={{ fontFamily: F, fontSize: 11.5, color: C.faint }}>Not enough data in this period to draw anything useful.</div>
        : insights.map((ins, i) => <InsightCard key={i} insight={ins} />)}
    </div>
  );
}


export default function RelationshipManagerApp() {
    const [activeTab, setActiveTab] = useState("queue");
    const [leads, setLeads] = useState(CALL_QUEUE);
    const [customSources, setCustomSources] = useState([]);
    const addCustomSource = (name) => {
      setCustomSources((cs) => cs.some((c) => c.toLowerCase() === name.toLowerCase()) ? cs : [...cs, name]);
    };
    const [toast, setToast] = useState("");
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [openNavGroup, setOpenNavGroup] = useState("leads");
    // Menu keys are "tab" or "tab:subview" — screens key off the base.
    const [navBase, navSub] = String(activeTab).split(":");
    const [focusMode, setFocusMode] = useState(false);
    const showToast = (msg) => {
      setToast(msg);
      setTimeout(() => setToast(""), 2500);
    };
    const screenName = { queue: "Call Queue", activity: "Recent Activity", delivery: "Post-delivery", inventory: "Inventory", learning: "Learning", dashboard: "Dashboard" }[activeTab];
    const handleUpdateLead = (updated) => {
      setLeads((ls) => ls.map((l) => l.id === updated.id ? updated : l));
    };
    const handleAddLead = (data) => {
      const newId = Math.max(0, ...leads.map((l) => l.id)) + 1;
      const modelInterestKeys = Object.keys(data.modelInterest || {});
      const newLead = {
        id: newId,
        name: data.name,
        phone: data.phone,
        altPhone: data.altPhone || "",
        email: data.email || "",
        model: modelInterestKeys.length ? modelInterestSummary(data.modelInterest) : "",
        sourceContext: data.note || "Added manually by telecaller",
        source: data.source || "Website",
        location: data.location || "",
        customerType: data.customerType || "",
        propensity: 50,
        priority: "medium",
        contacted: 0,
        stage: "New",
        createdDate: new Date(),
        bestCallTime: "",
        followUpDate: null,
        signals: data.signals || [],
        exchange: data.exchange || null,
        finance: data.finance || null,
        modelInterest: modelInterestKeys.length ? data.modelInterest : null,
        colorInterest: data.colorInterest && data.colorInterest.length ? data.colorInterest : null,
        targetDeliveryDate: null,
        assignedSE: null,
        lastSEContactDate: null,
        closed: false,
        callHistory: []
      };
      setLeads((ls) => [...ls, newLead]);
      showToast(`\u2705 Lead added \u2014 ${data.name}`);
    };
    return <div className="rm-shell">
  <style>
    {FONTS}
    {`
        * { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 0; }
        input::placeholder, textarea::placeholder { color: #A8A69F; }

        .rm-shell { width: 100%; height: 100vh; display: flex; background: ${C.bg}; font-family: ${F}; overflow: hidden; }
        .rm-sidebar { display: none; }
        .rm-menu-btn { display: flex; }
        .rm-outer { flex: 1; display: flex; justify-content: center; align-items: center; height: 100vh; }
        .rm-card { width: 100%; max-width: 420px; height: 100vh; max-height: 860px; background: ${C.bg}; display: flex; flex-direction: column; position: relative; overflow: hidden; box-shadow: 0 0 0 1px #D5DAE8, 0 24px 64px rgba(14,14,12,0.16); border-radius: 20px; }
        .rm-content { flex: 1; min-height: 0; overflow-y: auto; }
        input[type="search"]::-webkit-search-cancel-button,
        input[type="search"]::-webkit-search-decoration { -webkit-appearance: none; appearance: none; }

        @media (min-width: 860px) {
          .rm-outer { padding: 0; align-items: stretch; justify-content: flex-start; }
          .rm-card { max-width: none; flex: 1; min-height: 0; height: auto; max-height: none; border-radius: 0; box-shadow: none; }
          .rm-sidebar {
            display: flex; flex-direction: column; width: 232px; flex-shrink: 0; background: ${C.card};
            border-right: 1px solid ${C.border}; padding: 20px 14px; height: 100vh; box-sizing: border-box;
          }
          .rm-menu-btn { display: none; }
          .rm-content > div { max-width: 720px; margin: 0 auto; width: 100%; box-sizing: border-box; padding-left: 28px !important; padding-right: 28px !important; padding-top: 24px !important; }
        }

        @media print {
          body * { visibility: hidden; }
          #quote-print-area, #quote-print-area * { visibility: visible; }
          #quote-print-area { position: absolute; top: 0; left: 0; width: 100%; box-shadow: none !important; border: none !important; }
        }
      `}
  </style>
  <div className="rm-sidebar">
    <div style={{
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "6px 10px 24px"
}}>
      <span style={{
  fontFamily: F,
  fontWeight: 900,
  fontSize: 16,
  color: C.ink,
  letterSpacing: -0.8,
  textTransform: "uppercase"
}}>
        AUTOPRISM
        <span style={{
  display: "inline-block",
  width: 5,
  height: 5,
  borderRadius: "50%",
  background: C.primary,
  marginLeft: 1,
  marginBottom: 8
}} />
      </span>
    </div>
    {NAV_ITEMS.map(t => {
  const groupActive = t.subs.length ? t.subs.some(x => x.key === activeTab) : activeTab === t.key;
  const expanded = openNavGroup === t.key;
  return <div key={t.key} style={{ marginBottom: 3 }}>
    <button onClick={() => {
      if (!t.subs.length) { setActiveTab(t.key); setDrawerOpen(false); return; }
      setOpenNavGroup(expanded ? null : t.key);
    }} style={{
      display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "11px 12px",
      borderRadius: 10, border: "none", background: groupActive ? C.primarySoft : "none",
      cursor: "pointer", textAlign: "left",
    }}>
      <t.Icon size={17} color={groupActive ? C.primary : C.faint} strokeWidth={groupActive ? 2.4 : 1.8} />
      <span style={{ flex: 1, fontFamily: F, fontWeight: groupActive ? 700 : 500, fontSize: 13,
        color: groupActive ? C.primary : C.sub }}>{t.label}</span>
      {t.subs.length > 0 && <ChevronDown size={14} color={C.ghost} style={{
        transform: expanded ? "rotate(180deg)" : "none", transition: "transform .18s" }} />}
    </button>
    {expanded && t.subs.map(sub => {
      const on = activeTab === sub.key;
      return <button key={sub.key} onClick={() => { setActiveTab(sub.key); setDrawerOpen(false); }} style={{
        display: "flex", alignItems: "center", width: "100%", padding: "8px 12px 8px 39px",
        borderRadius: 8, border: "none", background: on ? C.primarySoft : "none",
        cursor: "pointer", textAlign: "left",
      }}>
        <span style={{ fontFamily: F, fontWeight: on ? 700 : 500, fontSize: 12.5,
          color: on ? C.primary : C.sub }}>{sub.label}</span>
      </button>;
    })}
  </div>;
})}
    <div style={{
  marginTop: "auto"
}}>
      <button style={{
  display: "flex",
  alignItems: "center",
  gap: 10,
  width: "100%",
  padding: "11px 12px",
  borderRadius: 10,
  border: "none",
  background: "none",
  cursor: "pointer",
  marginBottom: 10,
  textAlign: "left"
}}>
        <LogOut size={17} color={C.hot} strokeWidth={1.8} />
        <span style={{
  fontFamily: F,
  fontWeight: 500,
  fontSize: 13,
  color: C.hot
}}>
          Logout
        </span>
      </button>
      <div style={{
  display: "flex",
  alignItems: "center",
  gap: 9,
  paddingTop: 12,
  borderTop: `1px solid ${C.border}`
}}>
        <div style={{
  width: 28,
  height: 28,
  borderRadius: "50%",
  background: C.ink,
  color: "#fff",
  fontFamily: F,
  fontWeight: 700,
  fontSize: 11,
  display: "flex",
  alignItems: "center",
  justifyContent: "center"
}}>
          {ini(ME.name)}
        </div>
        <span style={{
  fontFamily: F,
  fontSize: 12.5,
  fontWeight: 700,
  color: C.ink
}}>
          {ME.name}
        </span>
      </div>
    </div>
  </div>
  <div className="rm-outer">
    <div className="rm-card">
      {focusMode ? <FocusModeScreen leads={leads} onUpdateLead={handleUpdateLead} showToast={showToast} onExit={() => setFocusMode(false)} /> : <>
  <Header screenName={screenName} onMenuClick={() => setDrawerOpen(true)} />
  <div className="rm-content">
    {navBase === "queue" && <CallQueueScreen leads={leads} onUpdateLead={handleUpdateLead} showToast={showToast} onEnterFocusMode={() => setFocusMode(true)} onAddLead={handleAddLead} customSources={customSources} onAddCustomSource={addCustomSource} />}
    {navBase === "activity" && <RecentActivityScreen leads={leads} onUpdateLead={handleUpdateLead} showToast={showToast} />}
    {navBase === "delivery" && <PostDeliveryScreen leads={leads} onUpdateLead={handleUpdateLead} showToast={showToast} />}
    {navBase === "inventory" && <InventoryScreen subView={navSub} leads={leads} showToast={showToast} currentUser={ME} onUpdateLead={handleUpdateLead} />}
    {navBase === "account" && <div style={{ padding: "14px 14px 90px" }}>
      <div style={{ fontFamily: F, fontWeight: 800, fontSize: 15, color: C.ink, marginBottom: 3 }}>My Account</div>
      <div style={{ fontFamily: F, fontSize: 11.5, color: C.sub, marginBottom: 13 }}>
        Your login details and preferences.
      </div>
      {[
        { key: "profile",  label: "Profile",  value: ME?.name || "Priya Nair" },
        { key: "password", label: "Password", value: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" },
        { key: "language", label: "Language", value: "English" },
        { key: "email",    label: "Email ID", value: "priya.nair@autoprism.in" },
      ].map(row => (
        <div key={row.key} style={{
          display: "flex", alignItems: "center", gap: 10, padding: "13px 14px", marginBottom: 8,
          background: C.card, border: `1.5px solid ${navSub === row.key ? C.primary : C.border}`,
          borderRadius: 12,
        }}>
          <span style={{ flex: 1, fontFamily: F, fontSize: 13, fontWeight: 700, color: C.ink }}>{row.label}</span>
          <span style={{ fontFamily: F, fontSize: 12, color: C.sub }}>{row.value}</span>
        </div>
      ))}
    </div>}
    {navBase === "learning" && <LearningScreen />}
    {navBase === "dashboard" && <DashboardScreen leads={leads} />}
  </div>
  {drawerOpen && <MenuDrawer active={activeTab} onChange={setActiveTab} onClose={() => setDrawerOpen(false)} />}
</>}
      <Toast text={toast} />
    </div>
  </div>
</div>;
  }
