import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  AlertTriangle, PlayCircle, Headphones, MessageSquare, Flame, TrendingDown, TrendingUp, Settings, Wind, Eye, User, Calendar, MessageCircle, IndianRupee, Heart, RefreshCw,
  Phone, Car, FileText, ChevronLeft, ChevronRight,
  Search, X, ChevronDown, ChevronUp, Check,
  Clock, Mail, MapPin, Users, Target,
  Bell, Globe, HelpCircle, LogOut, Lock, Trophy, Package,
  CalendarClock, ClipboardList, CarFront,
  Activity as PulseSignal, Scale, SplitSquareHorizontal, Landmark,
  Hourglass, VolumeX, UserPlus, Mic, Store, Camera, ShieldCheck,
  Navigation, BarChart3, Share2, Plus, Flag, SlidersHorizontal, CheckSquare, Square, Link2, Copy, Sparkles, CheckCircle2, AlertCircle, Pencil, Star, GraduationCap, ThumbsUp, ArrowRight, Award, Menu
} from "lucide-react";

/* ============================== DESIGN TOKENS ============================== */
const C = {
  // Surfaces
  bg: "#F3F4F9",          // warm parchment — not clinical white
  card: "#FFFFFF",
  cardHover: "#F8F9FD",
  border: "#E7EAF3",
  borderStrong: "#D5DAE8",

  // Typography — four levels, genuinely distinct
  ink: "#0B1946",         // near-black, warmth from the tiny yellow
  sub: "#4F5A7D",         // warm mid-grey
  faint: "#6B7596",       // placeholder / tertiary — 5.0:1 on card, passes AA
  ghost: "#AEB4CB",       // disabled / decorative

  // Action — orange, one colour for everything interactive
  primary: "#3B4BE8",
  primaryDark: "#2F3CC4",
  primarySoft: "rgba(59,75,232,0.09)",

  // Urgency ring colours — used only on the propensity arc
  urgent: "#E53935",      // overdue / cold
  hot: "#E53935",
  hotSoft: "rgba(229,57,53,0.08)",
  warm: "#F59E0B",
  warmSoft: "rgba(245,158,11,0.08)",
  cold: "#1E88E5",
  coldSoft: "rgba(30,136,229,0.08)",
  green: "#2E7D32",
  greenSoft: "rgba(46,125,50,0.08)",
  darkGreen: "#1B5E20",
  darkGreenSoft: "rgba(27,94,32,0.10)",
  purple: "#6D28D9",
  purpleSoft: "rgba(109,40,217,0.08)",
  teal: "#00695C",
  tealSoft: "rgba(0,105,92,0.08)",
  gold: "#92400E",
  whatsapp: "#0B1946",    // same as ink — neutral secondary action
};



const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');`;
const F = `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;

/* ============================== MOCK ORG ============================== */
// Single-role app: the person is always viewing as a Sales Executive. The other Sales
// Executives are kept only so the Leaderboard has peers to rank against.
const USERS = [
  { id: 7, name: "Vikram Singh", role: "Sales Executive", reportsTo: null, email: "vikram.singh@autoprism.in", phone: "+91 98450 77889", branch: "Whitefield Showroom", target: 8, achieved: 7, monthlyStats: { calls: 52, whatsapp: 38 }, testDrives: 17, bookings: 9, leads: 44, respHrs: 2.9, streak: 6,  prevAchieved: 6, warrantyAttach: 6, addOns: 14, tdShowroom: 11, tdHome: 6, opportunity: 28 },
  { id: 8, name: "Ananya Rao", role: "Sales Executive", reportsTo: null, email: "ananya.rao@autoprism.in", phone: "+91 98450 88990", branch: "Whitefield Showroom", target: 7, achieved: 3, monthlyStats: { calls: 24, whatsapp: 19 }, testDrives: 12, bookings: 4, leads: 38, respHrs: 1.1, streak: 4,  prevAchieved: 4, warrantyAttach: 1, addOns: 5, tdShowroom: 10, tdHome: 2, opportunity: 19 },
  { id: 9, name: "Karthik Menon", role: "Sales Executive", reportsTo: null, email: "karthik.menon@autoprism.in", phone: "+91 98450 99001", branch: "Indiranagar Showroom", target: 5, achieved: 1, monthlyStats: { calls: 11, whatsapp: 7 }, testDrives: 6,  bookings: 2, leads: 33, respHrs: 5.8, streak: 19, prevAchieved: 0, warrantyAttach: 0, addOns: 2, tdShowroom: 6, tdHome: 0, opportunity: 11 },
  { id: 10, name: "Rahul Kumar", role: "Sales Executive", reportsTo: null, email: "rahul.kumar@autoprism.in", phone: "+91 98450 10112", branch: "Indiranagar Showroom", target: 6, achieved: 4, monthlyStats: { calls: 48, whatsapp: 26 }, testDrives: 23, bookings: 7, leads: 41, respHrs: 2.4, streak: 9,  prevAchieved: 2, warrantyAttach: 3, addOns: 11, tdShowroom: 20, tdHome: 3, opportunity: 31 },
];
const DEFAULT_USER_ID = 10;

function initials(name) {
  return name.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase();
}
function userById(id) { return USERS.find(u => u.id === id); }
function getSubtreeIds(rootId) {
  const ids = [rootId];
  let frontier = [rootId];
  while (frontier.length) {
    const next = USERS.filter(u => frontier.includes(u.reportsTo)).map(u => u.id);
    ids.push(...next);
    frontier = next;
  }
  return ids;
}

/* ============================== LEAD BUCKETS (replaces hot/warm/cold) ==============================
   Leads are grouped by what's actually blocking the deal — that's what tells a rep *what to do*,
   not just *how urgent*. Urgency survives as a small secondary "propensity" tag on the bucket.
*/
const BUCKET_META = {
  ready:     { label: "Ready to Close",    color: C.green,  soft: C.greenSoft,  Icon: Target,               weight: 50 },
  price:     { label: "Price Negotiation", color: C.warm,   soft: C.warmSoft,   Icon: Scale,                weight: 35 },
  comparing: { label: "Comparing Options", color: C.purple, soft: C.purpleSoft, Icon: SplitSquareHorizontal, weight: 15 },
  finance:   { label: "Finance Pending",   color: C.teal,   soft: C.tealSoft,   Icon: Landmark,             weight: 20 },
  quiet:     { label: "Gone Quiet",        color: C.hot,    soft: C.hotSoft,    Icon: VolumeX,              weight: 45 },
  new:       { label: "New / Unqualified", color: C.cold,   soft: C.coldSoft,   Icon: UserPlus,             weight: 10 },
  nurture:   { label: "Long-Term Nurture", color: C.sub,    soft: C.bg,    Icon: Hourglass,            weight: 0 },
};
const BUCKET_ORDER = ["ready", "quiet", "price", "finance", "comparing", "new", "nurture"];
// Deals in these stages are effectively closed / no longer need a blocker bucket — they surface via Activity instead.
const EXCLUDE_FROM_BUCKETS = ["Booking", "Retailed", "Delivered", "Lost"];


// Labels are separate from bucket: a lead can carry several at once (e.g. Opportunity + Family
// Approval), whereas bucket captures only the single biggest blocker.
const LABEL_OPTIONS = ["Exchange", "Finance", "Urgent"];

// The 6-milestone status timeline. "Lost" is deliberately excluded — it's an exit from the
// funnel, not a milestone reached along it, so it's handled as a separate action.
const STATUS_ORDER = ["New", "Contacted", "Test Drive", "Opportunity", "Booking", "Retailed", "Delivered"];
const STATUS_FILTER_OPTIONS = [...STATUS_ORDER, "Lost"];

// Ordered worst → best. Estimate range spans one level below to one level above the selected condition.
const CONDITION_LEVELS = [
  { key: "scrap", label: "Scrap", multiplier: 0.5 },
  { key: "very_bad", label: "Very Bad", multiplier: 0.7 },
  { key: "bad", label: "Bad", multiplier: 0.85 },
  { key: "good", label: "Good", multiplier: 1.0 },
  { key: "very_good", label: "Very Good", multiplier: 1.15 },
  { key: "excellent", label: "Excellent", multiplier: 1.3 },
];

const MOCK_VOICE_TRANSCRIPTS = [
  "Customer confirmed budget range, wants final quote by Friday.",
  "Discussed accessory package, will decide after checking with spouse.",
  "Positive call — asked about exchange bonus for the old vehicle.",
  "Requested a callback next week, currently travelling.",
  "Customer compared pricing with a competitor, seemed satisfied with our offer.",
];

// Longer, realistic post-call notes a rep would actually dictate. Deliberately messy —
// they mix a clear outcome with details that belong in structured fields, plus a bit of
// colour that has nowhere to go but the notes.
// ============================== LANGUAGE SYSTEM ==============================
// We deliberately use "Hinglish" style (English-ish phrasing in regional script/romanisation)
// rather than pure formal translation, because that's how people actually speak in showrooms.
// Each key is a UI string; each language is a variant. English is the canonical key.
const LANG_STRINGS = {
  // Navigation / labels
  "Leads":          { hi: "Leads",       te: "Leads",        kn: "Leads",       ta: "Leads"       },
  "Profile":        { hi: "Profile",     te: "Profile",      kn: "Profile",     ta: "Profile"     },
  "Today's Queue":  { hi: "Aaj ki Queue",te: "Nenu Queue",   kn: "Inna Queue",  ta: "Intha Queue" },
  "Generate MIS":   { hi: "MIS banao",   te: "MIS cheyyandi",kn: "MIS maadi",   ta: "MIS podu"    },
  "Do These First": { hi: "Pehle yeh karo",te: "Munduga ivvi",kn: "Mundha idu", ta: "Munnadi idu" },
  "Today's Schedule":{ hi: "Aaj ka schedule",te: "Nenu schedule",kn: "Inna schedule",ta: "Intha schedule"},
  // Actions
  "Call":           { hi: "Call karo",   te: "Call cheyyandi",kn: "Call maadi", ta: "Call pannu"  },
  "WhatsApp":       { hi: "WhatsApp karo",te: "WhatsApp cheyyandi",kn: "WhatsApp maadi",ta: "WhatsApp pannu"},
  "Test Drive":     { hi: "Test Drive",  te: "Test Drive",   kn: "Test Drive",  ta: "Test Drive"  },
  "Quote":          { hi: "Quote",       te: "Quote",        kn: "Quote",       ta: "Quote"       },
  "Log this call":  { hi: "Call log karo",te: "Call log cheyyandi",kn: "Call log maadi",ta: "Call log pannu"},
  "Save Log":       { hi: "Save karo",   te: "Save cheyyandi",kn: "Save maadi", ta: "Save pannu"  },
  "Cancel":         { hi: "Cancel",      te: "Cancel",       kn: "Cancel",      ta: "Cancel"      },
  "Add Lead":       { hi: "Lead add karo",te: "Lead add cheyyandi",kn: "Lead add maadi",ta: "Lead seri pannu"},
  // Status
  "Contacted":      { hi: "Contact hua", te: "Contact ayyindi",kn: "Contact aaithu",ta: "Contact aachu"},
  "Booking":        { hi: "Booking",     te: "Booking",      kn: "Booking",     ta: "Booking"     },
  "Opportunity":    { hi: "Opportunity", te: "Opportunity",  kn: "Opportunity", ta: "Opportunity" },
  // Search/filter
  "Search or filter leads": { hi: "Search ya filter karo", te: "Search cheyyi", kn: "Search maadi", ta: "Search pannu" },
  "Show results":   { hi: "Results dikhao", te: "Results chuppu", kn: "Results toro", ta: "Results kaatu" },
  "Clear all":      { hi: "Sab clear karo", te: "Anni clear cheyyandi", kn: "Ella clear maadi", ta: "Ellam clear pannu" },
  // Settings
  "Voice-first logging": { hi: "Voice se log karo", te: "Voice tho log cheyyandi", kn: "Voice ninda log maadi", ta: "Voice moolam log pannu" },
  "Language":       { hi: "Bhasha",      te: "Bhasha",       kn: "Bhasha",      ta: "Mozhi"       },
};
const LANG_OPTIONS = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिंदी (Hinglish)" },
  { code: "te", label: "Telugu (Mix)" },
  { code: "kn", label: "Kannada (Mix)" },
  { code: "ta", label: "Tamil (Mix)" },
];
// t() is the translation function — returns English if no override exists for the language.
const LangCtx = React.createContext("en");
function useLang() { return React.useContext(LangCtx); }
function t(key, lang) {
  if (!lang || lang === "en") return key;
  return (LANG_STRINGS[key] && LANG_STRINGS[key][lang]) || key;
}

const MOCK_CALL_DICTATIONS = [
  "Spoke to him just now, he wants to bring his wife and do the test drive on Saturday at the showroom. He also has an old i10 to exchange, around 2016 model. Said he'll need a loan for about twelve lakhs. Seemed quite keen on the top variant.",
  "Called, he picked up but was driving. Asked me to call back tomorrow evening. Nothing else discussed.",
  "He's ready to book. Wants to pay twenty five thousand as token today itself, delivery he's asking for before month end. Very positive, said his brother also bought from us last year.",
  "No answer, phone just rang out. Third time now.",
  "He's gone quiet on price, says Nexon is giving him a better deal. Asked me for a discount, I said I'd check with the manager and revert. Worth escalating.",
  "Not interested anymore, he's decided to postpone the purchase. Said maybe after Diwali he'll think again.",
];

// Prototype transcript parser. Keyword-driven on purpose — it demonstrates the voice-first
// flow end to end without pretending to be a real speech/NLP model. In production this is a
// server-side call that returns the same shape. Anything it cannot confidently map to a
// structured field is deliberately left in `leftover`, which becomes the call note.
function parseCallTranscript(text, lead) {
  const t = " " + text.toLowerCase() + " ";
  const has = (...words) => words.some(w => t.includes(w));
  const out = {
    outcome: null, subReason: null,
    callback: { date: "", window: "" },
    testDrive: { mode: "", date: "", time: "", locationText: "" },
    signals: [], exchange: null, finance: null,
    booking: null,
    confidence: [],
    leftover: text.trim(),
  };

  // --- not connected ---
  if (has("no answer", "rang out", "didn't pick", "did not pick", "not reachable", "switched off")) {
    out.outcome = "not_reachable";
    out.confidence.push(["Outcome", "Not Reachable"]);
  } else if (has("was driving", "busy", "asked me to call back", "call back", "callback")) {
    out.outcome = "callback";
    out.confidence.push(["Outcome", "Call Back"]);
    if (has("tomorrow")) out.callback.date = toDateInputValue(d(1));
    else if (has("next week")) out.callback.date = toDateInputValue(d(7));
    if (has("morning")) out.callback.window = "morning";
    else if (has("afternoon")) out.callback.window = "afternoon";
    else if (has("evening", "night")) out.callback.window = "evening";
    if (out.callback.date) out.confidence.push(["Callback date", fmt(parseDateInput(out.callback.date))]);
    if (out.callback.window) out.confidence.push(["Best time", out.callback.window]);
  } else if (has("not interested", "postpone", "dropped", "decided against")) {
    out.outcome = "not_interested";
    out.subReason = has("competitor", "nexon", "creta", "brezza", "better deal") ? "competitor" : "not_now";
    out.confidence.push(["Outcome", "Not Interested"]);
    out.confidence.push(["Reason", out.subReason === "competitor" ? "Preferring Competitor" : "Not Interested Now"]);
  } else if (has("ready to book", "wants to book", "token", "booking amount")) {
    out.outcome = "ready";
    out.confidence.push(["Outcome", "Ready to Book"]);
    const amt = t.match(/(\d[\d,]*)\s*(?:thousand|k\b)/) || t.match(/twenty five thousand/);
    if (t.includes("twenty five thousand")) out.booking = { advance: "25000" };
    else if (amt) out.booking = { advance: amt[1].replace(/,/g, "") };
    if (out.booking) out.confidence.push(["Token amount", "₹" + out.booking.advance]);
  } else if (has("test drive", "testdrive")) {
    out.outcome = "test_drive";
    out.confidence.push(["Outcome", "Wants Test Drive"]);
    out.testDrive.mode = has("at home", "his place", "her place", "their location") ? "location" : "showroom";
    out.confidence.push(["Location", out.testDrive.mode === "location" ? "Customer's Location" : "Showroom"]);
    const dayMap = { saturday: 6, sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5 };
    for (const [name, dow] of Object.entries(dayMap)) {
      if (t.includes(name)) {
        const now = new Date(today);
        let delta = (dow - now.getDay() + 7) % 7; if (delta === 0) delta = 7;
        out.testDrive.date = toDateInputValue(d(delta));
        out.confidence.push(["Test drive", fmt(parseDateInput(out.testDrive.date))]);
        break;
      }
    }
    if (has("tomorrow")) { out.testDrive.date = toDateInputValue(d(1)); }
  } else if (has("discount", "price", "better deal")) {
    out.outcome = "discount";
    out.confidence.push(["Outcome", "Asked for Discount"]);
  }

  // --- signals, independent of outcome ---
  if (has("exchange", "old car", "trade in", "trade-in", "his old", "her old", " i10", "swift", "alto")) {
    out.signals.push("Exchange");
    const yr = t.match(/\b(20[0-2]\d)\b/);
    out.exchange = { year: yr ? yr[1] : "" };
    out.confidence.push(["Signal", "Exchange" + (yr ? ` · ${yr[1]}` : "")]);
  }
  if (has("loan", "finance", "emi", "lakhs", "lakh")) {
    out.signals.push("Finance");
    const lk = t.match(/(\w+|\d+)\s*lakh/);
    const words = { twelve: "12", ten: "10", eight: "8", fifteen: "15", twenty: "20" };
    let amt = lk ? (words[lk[1]] || lk[1]) : "";
    out.finance = { loanAmount: amt };
    out.signals.push("Finance");
    out.confidence.push(["Signal", "Finance" + (amt ? ` · ₹${amt} L` : "")]);
  }
  if (has("escalat", "manager", "check with")) {
    out.confidence.push(["Flag", "Suggested for escalation"]);
  }
  out.signals = [...new Set(out.signals)];
  return out;
}


// Call-log presets, grouped by whether the call actually connected.
const CONTACTED_OUTCOMES = [
  { key: "callback", label: "Call Back" },
  { key: "test_drive", label: "Wants Test Drive" },
  { key: "discount", label: "Asked for Discount" },
  { key: "ready", label: "Ready to Book" },
  { key: "not_interested", label: "Not Interested" },
];
const NOT_CONTACTED_OUTCOMES = [
  { key: "not_reachable", label: "Not Reachable" },
  { key: "busy", label: "Busy / No Response" },
  { key: "wrong_number", label: "Wrong Number" },
];
const CALL_OUTCOMES = [...CONTACTED_OUTCOMES, ...NOT_CONTACTED_OUTCOMES];
const NOT_INTERESTED_REASONS = [
  { key: "not_now", label: "Not Interested Now" },
  { key: "competitor", label: "Preferring Competitor" },
];

// WhatsApp outcomes — "WhatsApp Call" folded in as one outcome rather than a separate up-front
// Type step, so the rep makes one decision instead of two for the app's highest-frequency action.
const WHATSAPP_OUTCOMES = [
  { key: "replied", label: "Customer Replied" },
  { key: "no_reply", label: "No Reply" },
  { key: "shared_quote", label: "Shared Quote" },
  { key: "shared_brochure", label: "Shared Brochure" },
  { key: "wa_call", label: "WhatsApp Call" },
];

// Competitor battle cards — three sharp, factual points each. Brief by design — meant to be
// scanned mid-conversation, not read as an essay.
const COMPETITOR_BATTLE_CARDS = {
  "Seltos": {
    ourCar: "Creta",
    points: [
      "Panoramic sunroof (Creta) vs single-pane (Seltos) — customers notice it instantly on the test drive.",
      "Rear-seat headroom is 15mm more in Creta — meaningful for taller families and longer journeys.",
      "Creta holds resale value ~8% higher than Seltos after 3 years — a strong long-term ownership story.",
    ],
  },
  "Brezza": {
    ourCar: "Venue / Exter",
    points: [
      "Venue's turbo engine delivers punchier highway performance vs Brezza's naturally-aspirated unit.",
      "Exter's sunroof is a segment-first at this price point — Brezza doesn't offer one below ₹12L.",
      "Hyundai's BlueLink connected suite has broader remote features than Suzuki's SmartPlay at the same tier.",
    ],
  },
  "Nexon": {
    ourCar: "Creta / Venue",
    points: [
      "Creta cabin quality is consistently rated higher in owner surveys — materials feel more premium in person.",
      "Hyundai's service network is 200+ outlets stronger, especially in Tier 2/3 — less waiting.",
      "Creta's CNG and hybrid options give better total cost of ownership for mixed city/highway use.",
    ],
  },
  "Compass": {
    ourCar: "Tucson",
    points: [
      "Tucson Hybrid AWD is the only hybrid SUV in this segment — meaningfully lower fuel cost over 3 years.",
      "Tucson's Level 2 ADAS suite is more comprehensive than Compass's safety package at the same price.",
      "Hyundai's warranty (3yr standard, extendable to 5yr) outlasts Jeep's standard 2-year package.",
    ],
  },
  "City": {
    ourCar: "Verna",
    points: [
      "Verna's turbo petrol has better low-end torque than City's unit — customers feel the difference immediately.",
      "Verna's 10.25\" infotainment and 360-camera are standard on SX; City charges extra for comparable spec.",
      "Hyundai resale is 5–6% stronger than Honda City in most metro markets based on recent auction data.",
    ],
  },
  "Other": {
    ourCar: "Our Model",
    points: [
      "Ask what specifically attracted them — it's often one feature you can match or exceed.",
      "Highlight Hyundai's warranty and BlueLink suite — consistently underestimated by first-time buyers.",
      "Check competitor delivery timelines — if they're waiting 2+ months, you may be able to deliver faster.",
    ],
  },
};
const COMPETITOR_OPTIONS = Object.keys(COMPETITOR_BATTLE_CARDS);

// Shared demo fleet — physical cars all reps book from the same pool.
const DEMO_FLEET = [
  { id: "demo1", model: "Creta", variant: "SX(O) Turbo DCT", color: "Atlas White", regNo: "KA01 AA 1234" },
  { id: "demo2", model: "Creta", variant: "SX Diesel AT", color: "Titan Grey", regNo: "KA01 AA 1235" },
  { id: "demo3", model: "Venue", variant: "SX Dual Tone", color: "Titan Grey", regNo: "KA01 AA 1236" },
  { id: "demo4", model: "Verna", variant: "SX(O)", color: "Fiery Red", regNo: "KA01 AA 1237" },
  { id: "demo5", model: "Tucson", variant: "Signature AWD", color: "Amazon Grey", regNo: "KA01 AA 1238" },
  { id: "demo6", model: "Ioniq 5", variant: "AWD Long Range", color: "Gravity Gold", regNo: "KA01 AA 1239" },
];
const CALL_WINDOWS = [
  { key: "morning", label: "Morning" },
  { key: "afternoon", label: "Afternoon" },
  { key: "evening", label: "Evening" },
];
const TEST_DRIVE_MODES = [
  { key: "showroom", label: "Showroom", icon: Store },
  { key: "location", label: "Customer's Location", icon: MapPin },
];
const TEST_DRIVE_RESPONSES = [
  { key: "loved_ready", label: "Loved It — Ready to Book" },
  { key: "positive_comparing", label: "Positive, Still Comparing" },
  { key: "neutral", label: "Neutral" },
  { key: "not_liked", label: "Didn't Like It" },
  { key: "wants_second", label: "Wants a Second Test Drive" },
];

// SE → Team Leader → Manager. Both escalation steps are actions the SE takes themselves — the
// second step represents the SE pushing further if the first escalation goes unresolved, since
// this prototype only has the Sales Executive persona to act from.
const ESCALATION_REASONS = [
  { key: "discount", label: "Needs Discount Approval" },
  { key: "stuck", label: "Deal Stuck / No Progress" },
  { key: "complaint", label: "Customer Complaint" },
  { key: "pricing", label: "Pricing Exception" },
  { key: "other", label: "Other" },
];

const LOST_REASONS = [
  { key: "competitor", label: "Bought from Competitor" },
  { key: "budget", label: "Budget Mismatch" },
  { key: "not_interested", label: "Not Interested Anymore" },
  { key: "postponed", label: "Postponed Purchase" },
  { key: "other", label: "Other" },
];
const TEST_DRIVE_CANCEL_REASONS = [
  { key: "postponed", label: "Customer Postponed" },
  { key: "no_show", label: "Customer No-Show" },
  { key: "vehicle_unavailable", label: "Vehicle Unavailable" },
  { key: "lost_interest", label: "Lost Interest" },
  { key: "other", label: "Other" },
];
const PAYMENT_MODES = ["Cash", "Loan", "Exchange"];

// On-road price breakup, modeled on how CarWale/CarDekho split it. System computes everything
// except discount — that's the one lever the executive controls in a negotiation.
const ACCESSORY_OPTIONS = [
  { key: "mats", label: "Floor Mats", amount: 3000 },
  { key: "covers", label: "Seat Covers", amount: 5000 },
  { key: "warranty", label: "Extended Warranty", amount: 25000 },
  { key: "care", label: "Care Package (3yr)", amount: 12000 },
];
function formatINR(amount) {
  return "₹" + Math.round(amount || 0).toLocaleString("en-IN");
}
function computeQuoteBreakup(priceLakh, discountRupees, accessoriesRupees) {
  const exShowroom = Math.round((priceLakh || 0) * 100000);
  const rto = Math.round(exShowroom * 0.09);
  const insurance = Math.round(exShowroom * 0.035);
  const tcs = exShowroom > 1000000 ? Math.round(exShowroom * 0.01) : 0;
  const handling = 15000;
  const accessories = accessoriesRupees || 0;
  const subtotal = exShowroom + rto + insurance + tcs + handling + accessories;
  const discount = discountRupees || 0;
  const total = Math.max(10000, subtotal - discount);
  return { exShowroom, rto, insurance, tcs, handling, accessories, discount, subtotal, total };
}
// ---- Required-field highlighting -------------------------------------------------
// A disabled CTA with no explanation is a dead end, so every form marks which fields are
// still blocking it. Highlighting only switches on after the rep first tries to submit —
// an untouched form should never open covered in red.
const REQ = { border: "#E53935", bg: "#FDF3F2" };
function reqInput(missing) {
  return missing ? { borderColor: REQ.border, background: REQ.bg } : {};
}
function ReqHint({ show, text }) {
  if (!show) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
      <AlertCircle size={10} color={REQ.border} />
      <span style={{ fontFamily: F, fontSize: 9.5, fontWeight: 700, color: REQ.border }}>{text || "Required"}</span>
    </div>
  );
}
// Small banner above the CTA naming everything still outstanding.
function MissingBanner({ items }) {
  if (!items.length) return null;
  return (
    <div style={{ display: "flex", gap: 7, alignItems: "flex-start", background: REQ.bg, border: `1px solid ${REQ.border}`, borderRadius: 9, padding: "8px 10px", marginBottom: 9 }}>
      <AlertCircle size={13} color={REQ.border} style={{ flexShrink: 0, marginTop: 1 }} />
      <div style={{ fontFamily: F, fontSize: 10.5, color: REQ.border, lineHeight: 1.35 }}>
        <span style={{ fontWeight: 700 }}>Still needed: </span>{items.join(" · ")}
      </div>
    </div>
  );
}

// Lead subtypes, taken directly from the Autoprism stage map. A customer who says they are
// ready to book enters Booking as Ready_to_book — the deal is NOT closed until money arrives,
// at which point the subtype becomes token_received. Every follow-up call we schedule has to
// belong to one of these states so it shows up in the right queue.
const LEAD_SUBTYPE = {
  READY_TO_BOOK: "Ready_to_book",
  TOKEN_RECEIVED: "token_received",
  RETAILED: "retailed",
};

// Shared step used after a positive test drive and after a "ready to book" call outcome.
// It refuses to let the lead go quiet: either the money is in, or we book the call that chases it.
function BookingAmountStep({ value, onChange, attempted }) {
  const v = value || { received: null, amount: "", mode: "", promiseDate: "", promiseWindow: "" };
  const set = (patch) => onChange({ ...v, ...patch });
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontFamily: F, fontSize: 11, fontWeight: 700, color: C.ink, marginBottom: 6 }}>
        Has the customer given the booking amount?
      </div>
      <div style={{ display: "flex", gap: 7, marginBottom: 10 }}>
        {[["yes", "Yes, received"], ["no", "Not yet"]].map(([k, lab]) => (
          <button key={k} onClick={() => set({ received: k })} style={{
            flex: 1, padding: "9px 0", borderRadius: 9,
            border: `1.5px solid ${v.received === k ? (k === "yes" ? C.darkGreen : C.warm) : C.borderStrong}`,
            background: v.received === k ? (k === "yes" ? C.darkGreenSoft : C.warmSoft) : C.card,
            color: v.received === k ? (k === "yes" ? C.darkGreen : C.warm) : C.sub,
            fontFamily: F, fontWeight: 700, fontSize: 12, cursor: "pointer",
          }}>{lab}</button>
        ))}
      </div>
      <ReqHint show={attempted && !v.received} text="Choose one" />

      {v.received === "yes" && (
        <>
          <input type="number" min="0" placeholder="Booking amount (₹)" value={v.amount}
            onChange={e => set({ amount: e.target.value })}
            style={{ ...formInputStyle, width: "100%", marginBottom: 4, ...reqInput(attempted && !v.amount) }} />
          <ReqHint show={attempted && !v.amount} text="Enter the amount received" />
          <div style={{ fontFamily: F, fontSize: 10.5, color: C.sub, fontWeight: 600, margin: "8px 0 5px" }}>Payment mode</div>
          <div style={{ display: "flex", gap: 6 }}>
            {PAYMENT_MODES.map(m => (
              <button key={m} onClick={() => set({ mode: m })} style={chipStyle(v.mode === m, true)}>{m}</button>
            ))}
          </div>
          <ReqHint show={attempted && !v.mode} text="Pick a payment mode" />
        </>
      )}

      {v.received === "no" && (
        <>
          <div style={{ fontFamily: F, fontSize: 10.5, color: C.sub, marginBottom: 7, lineHeight: 1.4 }}>
            When will they pay it? We'll schedule the call so nobody has to remember.
          </div>
          <span style={{ fontFamily: F, fontSize: 10, color: C.faint, fontWeight: 600, marginBottom: 3, display: "block" }}>Expected on</span>
          <input type="date" value={v.promiseDate} min={toDateInputValue(today)}
            onChange={e => set({ promiseDate: e.target.value })}
            style={{ ...formInputStyle, width: 170, maxWidth: "100%", ...reqInput(attempted && !v.promiseDate) }} />
          <ReqHint show={attempted && !v.promiseDate} text="Pick the date they'll pay" />
          <div style={{ display: "flex", gap: 6, marginTop: 7 }}>
            {CALL_WINDOWS.map(w => (
              <button key={w.key} onClick={() => set({ promiseWindow: w.key })} style={chipStyle(v.promiseWindow === w.key, true)}>{w.label}</button>
            ))}
          </div>
          <ReqHint show={attempted && !v.promiseWindow} text="Pick a time window" />
        </>
      )}
    </div>
  );
}
function bookingMissing(v) {
  if (!v || !v.received) return ["booking amount answer"];
  if (v.received === "yes") {
    const m = [];
    if (!v.amount) m.push("amount received");
    if (!v.mode) m.push("payment mode");
    return m;
  }
  const m = [];
  if (!v.promiseDate) m.push("date they'll pay");
  if (!v.promiseWindow) m.push("time window");
  return m;
}
function bookingStepComplete(v) {
  if (!v || !v.received) return false;
  if (v.received === "yes") return !!(v.amount && v.mode);
  return !!(v.promiseDate && v.promiseWindow);
}

const COLOR_OPTIONS = ["Atlas White", "Titan Grey", "Fiery Red", "Abyss Black", "Amazon Grey", "Starry Night", "Gravity Gold", "Ranger Khaki"];
// Customer-stated contact preference. Not a nicety — DPDP purpose-limitation and TRAI's DND
// framework both mean continuing to call/message someone who's restricted a channel is a real
// compliance exposure, so this is treated as a hard restriction, not a soft suggestion.
const COMM_PREFS = [
  { key: "phone", label: "Phone Only", Icon: Phone },
  { key: "whatsapp", label: "WhatsApp Only", Icon: WhatsAppIcon },
  { key: "email", label: "Email Only", Icon: Mail },
];
function commPrefMeta(key) { return COMM_PREFS.find(c => c.key === key) || null; }
// Does this channel violate a stated restriction? "any"/null means no restriction on file.
function channelBlocked(lead, channel) { return !!lead.commPref && lead.commPref !== channel; }
const FINANCE_STATUSES = [
  { key: "applied", label: "Applied" },
  { key: "review", label: "Under Review" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];
const DOCUMENT_ITEMS = [
  { key: "aadhaar", label: "Aadhaar Card" },
  { key: "pan", label: "PAN Card" },
  { key: "address", label: "Address Proof" },
  { key: "bankStatement", label: "Bank Statement" },
  { key: "photo", label: "Passport Photo" },
  { key: "insurance", label: "Insurance Copy" },
];
function defaultDocuments() { return Object.fromEntries(DOCUMENT_ITEMS.map(d => [d.key, { done: false, via: null }])); }

/* ============================== MOCK LEADS ============================== */
const today = new Date("2026-07-03");
const d = (offset) => {
  const dt = new Date(today);
  dt.setDate(dt.getDate() + offset);
  return dt;
};
const fmt = (dt) => dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
const fmtFull = (dt) => dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
function fmtTime(t) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}
function toDateInputValue(dt) {
  if (!dt) return "";
  const y = dt.getFullYear(), m = String(dt.getMonth() + 1).padStart(2, "0"), dd = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}
function parseDateInput(value) {
  if (!value) return null;
  const [y, m, dd] = value.split("-").map(Number);
  return new Date(y, m - 1, dd);
}
function isSameDay(a, b) {
  if (!a || !b) return false;
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function timeToMinutes(t) {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

// Illustrative shared-fleet bookings from other reps — stands in for what would be a real shared
// calendar across the team. Used only to surface a heads-up, never to block scheduling.
const MOCK_DEMO_BOOKINGS = [
  { demoId: "demo1", repName: "Vikram Singh", date: toDateInputValue(today), time: "17:00" },
  { demoId: "demo3", repName: "Ananya Rao", date: toDateInputValue(today), time: "11:30" },
];

// Checks the shared demo fleet for the given model/date/time. Returns which units (if any) are
// likely already out with another rep or another of this rep's own customers — informational
// only, never prevents scheduling.
function getDemoAvailability(model, dateStr, timeStr, leads, excludeLeadId) {
  const fleet = DEMO_FLEET.filter(c => c.model === model);
  if (fleet.length === 0 || !dateStr || !timeStr) return null;
  const targetMin = timeToMinutes(timeStr);

  const ownConflicts = leads
    .filter(l => l.id !== excludeLeadId && l.model === model && l.testDrive?.date && toDateInputValue(l.testDrive.date) === dateStr)
    .filter(l => Math.abs(timeToMinutes(l.testDrive.time) - targetMin) < 60)
    .map(l => ({ repName: "you", customer: l.name, time: l.testDrive.time }));

  const teamConflicts = MOCK_DEMO_BOOKINGS
    .filter(b => DEMO_FLEET.find(c => c.id === b.demoId)?.model === model && b.date === dateStr)
    .filter(b => Math.abs(timeToMinutes(b.time) - targetMin) < 60)
    .map(b => ({ repName: b.repName, customer: null, time: b.time }));

  const conflicts = [...ownConflicts, ...teamConflicts];
  return { fleetSize: fleet.length, conflicts };
}

let LEAD_SEQ = 100;
function mkLead(o) {
  return {
    id: ++LEAD_SEQ, labels: [], channelUsage: { call: 0, whatsapp: 0 },
    booking: null, lostReason: null, finance: null, documents: defaultDocuments(), deliveryPhotos: [],
    color: "", drivingLicense: { done: false, via: null }, commPref: null,
    ...o,
  };
}

const RAW_LEADS = [
  // Rahul Kumar (10)
  mkLead({ owner: 10, name: "Ravi Teja", phone: "98765 43210", location: "Indiranagar", model: "Creta", variant: "SX(O) Turbo DCT", bucket: "ready", propensity: 82, stage: "Test Drive",
    budget: "₹18–20 L", targetDate: fmt(d(10)), created: d(-6), followUp: { date: d(0), window: null }, source: "Website",
    summary: "Loved the sunroof on test drive — bringing spouse for a second look", flag: "positive",
    nextAction: "Call today — confirm booking before spouse's visit",
    labels: ["Family Approval"],
    suggestedSignals: [{ signal: "Exchange", reason: "From yesterday's call: customer mentioned trading in their current i10. Add the Exchange signal to start booking an evaluation?" }],
    hasRecording: true,
    recordingTranscript: "Spoke to him just now, he wants to bring his wife and do the test drive on Saturday at the showroom. He also has an old i10 to exchange, around 2016 model. Said he'll need a loan for about twelve lakhs.",
    channelUsage: { call: 2, whatsapp: 0 },
    testDrive: { mode: "showroom", date: d(0), time: "17:00", location: null },
    notes: ["Compared with Seltos, prefers Creta's ride quality.", "Wants sunroof + ADAS variant only.", "Bringing spouse for 2nd test drive."],
    timeline: [
      { type: "test-drive", text: "Test drive completed — loved the panoramic sunroof", date: d(-1) },
      { type: "call", text: "Discussed finance options, sent EMI breakup", date: d(-3) },
      { type: "visit", text: "Walked in, browsed Creta & Seltos", date: d(-6) },
    ] }),
  mkLead({ owner: 10, name: "Sneha Kulkarni", phone: "98765 43211", location: "Koramangala", model: "Venue", variant: "SX Dual Tone", bucket: "quiet", propensity: 55,
    budget: "₹11–12 L", targetDate: fmt(d(15)), created: d(-12), followUp: { date: d(2), window: "evening" }, source: "CarDekho", stage: "Opportunity",
    summary: "Last 2 calls unanswered · earlier said okay to proceed with added discount", flag: "attention",
    nextAction: "Switch to WhatsApp — 2 calls missed, put the discount offer in writing",
    labels: ["Opportunity", "Exchange"],
    channelUsage: { call: 1, whatsapp: 2 },
    exchange: { model: "Hyundai i10", variant: "Magna", year: "2016", odometer: "62000", condition: "bad", photos: 2, appraisalScheduled: true, appraisedValue: null },
    notes: ["Negotiating on accessories package.", "Exchange car: 2016 i10, awaiting valuation."],
    timeline: [
      { type: "call", text: "Call unanswered, follow-up SMS sent", date: d(-1) },
      { type: "call", text: "Call unanswered", date: d(-3) },
      { type: "call", text: "Said will proceed if additional discount is offered", date: d(-5) },
      { type: "quote", text: `Quote #2 generated — ${formatINR(computeQuoteBreakup(11.6, 15000, 8000).total)}`, date: d(-3), quoteDetails: computeQuoteBreakup(11.6, 15000, 8000) },
      { type: "quote", text: `Quote #1 generated — ${formatINR(computeQuoteBreakup(11.6, 0, 0).total)}`, date: d(-6), quoteDetails: computeQuoteBreakup(11.6, 0, 0) },
      { type: "test-drive", text: "Test drive done, liked the dual-tone exterior", date: d(-9) },
    ] }),
  mkLead({ owner: 10, name: "Amit Joshi", phone: "98765 43212", location: "Whitefield", model: "Verna", variant: "S Turbo", bucket: "nurture", propensity: 25, stage: "Contacted",
    budget: "₹14–15 L", targetDate: fmt(d(40)), created: d(-20), followUp: { date: d(6), window: null }, source: "Walk-in",
    summary: "Low response rate — said will decide after Diwali, no urgency yet", flag: "attention",
    nextAction: "Light touch only — check in closer to Diwali",
    labels: ["Needs Time"],
    notes: ["Still comparing with Honda City.", "Not in a hurry — budget approval pending from family."],
    timeline: [
      { type: "call", text: "Follow-up call, said will decide after Diwali", date: d(-8) },
      { type: "visit", text: "Walked in for brochure and pricing", date: d(-20) },
    ] }),
  mkLead({ owner: 10, name: "Lakshmi Narayan", phone: "98765 43213", location: "Jayanagar", model: "Alcazar", variant: "Platinum 7-str", bucket: "ready", propensity: 88, stage: "Contacted",
    budget: "₹22–24 L", targetDate: fmt(d(7)), created: d(-9), followUp: { date: d(-1), window: "morning" }, source: "Referral",
    summary: "Budget & seating confirmed, ready to move — follow-up is overdue", flag: "attention",
    nextAction: "Call today — she's ready, don't lose momentum",
    escalation: {
      level: "manager", reason: "stuck", note: "Team Leader didn't respond after 2 days — pushing to manager for special allocation given the urgent 7-seater need.",
      date: d(-1), history: [{ level: "tl", date: d(-3) }, { level: "manager", date: d(-1) }],
    },
    notes: ["Referred by existing customer Suresh Pillai.", "Needs 7-seater for joint family, urgent requirement."],
    timeline: [
      { type: "call", text: "Confirmed budget and seating requirement", date: d(-2) },
      { type: "visit", text: "Referral walk-in, met at showroom", date: d(-9) },
    ] }),
  mkLead({ owner: 10, name: "Farhan Khan", phone: "98765 43214", location: "Frazer Town", model: "i20", variant: "Asta (O)", bucket: "new", propensity: 40, stage: "New",
    budget: "₹9–10 L", targetDate: fmt(d(30)), created: d(-2), followUp: { date: d(1), window: null }, source: "Website",
    summary: "First-time buyer, engaged well on intro call — needs variant guidance", flag: "neutral",
    nextAction: "Send variant comparison — help narrow down the choice",
    labels: ["Variant Confusion"],
    notes: ["Enquired via website chatbot, first car buyer."],
    timeline: [
      { type: "call", text: "Introductory call, explained variant lineup", date: d(-1) },
    ] }),
  mkLead({ owner: 10, name: "Deepika Rao", phone: "98765 43215", location: "HSR Layout", model: "Tucson", variant: "Signature AWD", bucket: "ready", propensity: 95, stage: "Booking",
    budget: "₹32 L", targetDate: fmt(d(20)), created: d(-30), followUp: null, source: "Website",
    expectedDeliveryDate: d(2),
    documents: {
      ...defaultDocuments(),
      aadhaar: { done: true, via: "customer" },
      pan: { done: true, via: "customer" },
    },
    summary: "Booking confirmed, advance received — awaiting delivery in 3 weeks", flag: "positive",
    nextAction: "Keep customer updated on delivery timeline",
    notes: ["Booking confirmed, advance paid.", "Delivery expected in 3 weeks."],
    timeline: [
      { type: "booking", text: "Booking confirmed — ₹1,00,000 advance received", date: d(-4) },
      { type: "quote", text: "Final quote approved by customer", date: d(-10) },
    ] }),
  mkLead({ owner: 10, name: "Suresh Pillai", phone: "98765 43216", location: "CV Raman Nagar", model: "Exter", variant: "SX Knight", bucket: "ready", propensity: 100, stage: "Delivered",
    budget: "₹11 L", targetDate: fmt(d(-5)), created: d(-45), followUp: null, source: "Referral",
    summary: "Delivered and happy — already referred one new lead", flag: "neutral",
    nextAction: "Ask for a review / further referrals",
    notes: ["Delivered successfully, very happy customer.", "Referred Lakshmi Narayan for Alcazar."],
    timeline: [
      { type: "delivery", text: "Vehicle delivered, customer delighted", date: d(-5) },
      { type: "booking", text: "Booking confirmed", date: d(-25) },
    ] }),
  mkLead({ owner: 10, name: "Neha Verma", phone: "98765 43220", location: "HSR Layout", model: "Ioniq 5", variant: "AWD Long Range", bucket: "ready", propensity: 80, stage: "Opportunity",
    budget: "₹48 L", targetDate: fmt(d(5)), created: d(-14), followUp: { date: d(0), window: "afternoon" }, source: "Website", commPref: "whatsapp",
    summary: "Keen on charger setup details — wants delivery before month-end", flag: "positive",
    nextAction: "Confirm charger installation slot to lock month-end delivery",
    labels: ["Exchange", "Finance"],
    exchange: { model: "Hyundai Verna", variant: "SX", year: "2019", odometer: "45000", condition: "very_good", photos: 3, appraisalScheduled: true, appraisedValue: 3.5 },
    finance: { loanAmount: "40", bank: "HDFC Bank", status: "approved" },
    testDrive: { mode: "location", date: d(0), time: "11:30", location: { text: "HSR Layout, Bengaluru", mapsLink: "" } },
    notes: ["EV enthusiast, comparing with home-charging setup cost.", "Wants delivery before month-end for tax benefit."],
    timeline: [{ type: "call", text: "Discussed charger installation & subsidy", date: d(-1) }] }),
];

/* ============================== MOCK INVENTORY (flat variants — grouped by model for display) ============================== */
const INVENTORY = [
  // Creta — full ladder, base to top, petrol/diesel, manual/automatic
  { id: 1, model: "Creta", variant: "E", color: "Atlas White", fuel: "Petrol", transmission: "Manual", priceLakh: 11.2, status: "In Stock", units: 5, restock: 6 },
  { id: 2, model: "Creta", variant: "EX", color: "Titan Grey", fuel: "Petrol", transmission: "Manual", priceLakh: 12.8, status: "In Stock", units: 4, restock: 7 },
  { id: 3, model: "Creta", variant: "S", color: "Fiery Red", fuel: "Petrol", transmission: "Manual", priceLakh: 14.5, status: "In Stock", units: 3, restock: 8 },
  { id: 4, model: "Creta", variant: "SX", color: "Abyss Black", fuel: "Petrol", transmission: "Manual", priceLakh: 16.9, status: "Low Stock", units: 2, restock: 10 },
  { id: 5, model: "Creta", variant: "SX(O) Diesel AT", color: "Amazon Grey", fuel: "Diesel", transmission: "Automatic", priceLakh: 18.4, status: "In Stock", units: 4, restock: 9 },
  { id: 6, model: "Creta", variant: "SX(O) Turbo DCT", color: "Atlas White", fuel: "Petrol", transmission: "Automatic", priceLakh: 19.8, status: "In Stock", units: 6, restock: 7 },
  { id: 7, model: "Creta", variant: "N Line N8", color: "Starry Night", fuel: "Petrol", transmission: "Manual", priceLakh: 17.5, status: "In Transit", units: 0, restock: 25 },

  // Venue
  { id: 8, model: "Venue", variant: "E", color: "Titan Grey", fuel: "Petrol", transmission: "Manual", priceLakh: 7.9, status: "In Stock", units: 5, restock: 6 },
  { id: 9, model: "Venue", variant: "S", color: "Atlas White", fuel: "Petrol", transmission: "Manual", priceLakh: 9.2, status: "In Stock", units: 4, restock: 7 },
  { id: 10, model: "Venue", variant: "SX Dual Tone", color: "Titan Grey", fuel: "Petrol", transmission: "Manual", priceLakh: 11.6, status: "Low Stock", units: 2, restock: 12 },
  { id: 11, model: "Venue", variant: "S Turbo DCT", color: "Atlas White", fuel: "Petrol", transmission: "Automatic", priceLakh: 10.9, status: "In Stock", units: 5, restock: 8 },
  { id: 12, model: "Venue", variant: "SX(O) Turbo", color: "Fiery Red", fuel: "Petrol", transmission: "Manual", priceLakh: 12.9, status: "In Transit", units: 0, restock: 20 },

  // Verna
  { id: 13, model: "Verna", variant: "E", color: "Titan Grey", fuel: "Petrol", transmission: "Manual", priceLakh: 10.9, status: "In Stock", units: 4, restock: 7 },
  { id: 14, model: "Verna", variant: "S", color: "Fiery Red", fuel: "Petrol", transmission: "Manual", priceLakh: 12.8, status: "In Stock", units: 5, restock: 6 },
  { id: 15, model: "Verna", variant: "SX", color: "Abyss Black", fuel: "Petrol", transmission: "Manual", priceLakh: 14.5, status: "In Stock", units: 7, restock: 6 },
  { id: 16, model: "Verna", variant: "SX(O)", color: "Fiery Red", fuel: "Petrol", transmission: "Manual", priceLakh: 16.4, status: "In Stock", units: 5, restock: 9 },
  { id: 17, model: "Verna", variant: "SX(O) Turbo DCT", color: "Starry Night", fuel: "Petrol", transmission: "Automatic", priceLakh: 17.9, status: "Low Stock", units: 1, restock: 14 },

  // Tucson — smaller real-world lineup, diesel-heavy
  { id: 18, model: "Tucson", variant: "Signature", color: "Titan Grey", fuel: "Diesel", transmission: "Automatic", priceLakh: 28.5, status: "In Stock", units: 3, restock: 12 },
  { id: 19, model: "Tucson", variant: "Signature AWD", color: "Amazon Grey", fuel: "Diesel", transmission: "Automatic", priceLakh: 32.2, status: "In Transit", units: 0, restock: 21 },
  { id: 20, model: "Tucson", variant: "Platinum", color: "Abyss Black", fuel: "Diesel", transmission: "Automatic", priceLakh: 30.5, status: "Low Stock", units: 1, restock: 18 },
  { id: 21, model: "Tucson", variant: "Hybrid AWD", color: "Titan Grey", fuel: "Hybrid", transmission: "Automatic", priceLakh: 34.5, status: "In Stock", units: 2, restock: 15 },

  // Exter
  { id: 22, model: "Exter", variant: "E", color: "Atlas White", fuel: "Petrol", transmission: "Manual", priceLakh: 6.1, status: "In Stock", units: 6, restock: 5 },
  { id: 23, model: "Exter", variant: "EX", color: "Titan Grey", fuel: "Petrol", transmission: "Manual", priceLakh: 7.5, status: "In Stock", units: 5, restock: 5 },
  { id: 24, model: "Exter", variant: "S", color: "Fiery Red", fuel: "Petrol", transmission: "Manual", priceLakh: 8.8, status: "In Stock", units: 4, restock: 6 },
  { id: 25, model: "Exter", variant: "SX Knight", color: "Abyss Black", fuel: "Petrol", transmission: "Manual", priceLakh: 11.1, status: "In Stock", units: 8, restock: 5 },
  { id: 26, model: "Exter", variant: "SX(O) CNG", color: "Titan Grey", fuel: "CNG", transmission: "Manual", priceLakh: 10.2, status: "In Stock", units: 3, restock: 10 },

  // i20
  { id: 27, model: "i20", variant: "Era", color: "Atlas White", fuel: "Petrol", transmission: "Manual", priceLakh: 7.2, status: "In Stock", units: 5, restock: 6 },
  { id: 28, model: "i20", variant: "Magna", color: "Titan Grey", fuel: "Petrol", transmission: "Manual", priceLakh: 8.0, status: "In Stock", units: 4, restock: 6 },
  { id: 29, model: "i20", variant: "Sportz", color: "Atlas White", fuel: "Petrol", transmission: "Automatic", priceLakh: 8.6, status: "In Stock", units: 6, restock: 6 },
  { id: 30, model: "i20", variant: "Asta (O)", color: "Fiery Red", fuel: "Petrol", transmission: "Manual", priceLakh: 9.9, status: "In Stock", units: 4, restock: 8 },
  { id: 31, model: "i20", variant: "N Line", color: "Starry Night", fuel: "Petrol", transmission: "Manual", priceLakh: 11.4, status: "In Transit", units: 0, restock: 22 },

  // Ioniq 5 — smaller EV lineup
  { id: 32, model: "Ioniq 5", variant: "RWD Standard", color: "Abyss Black", fuel: "Electric", transmission: "Automatic", priceLakh: 44.6, status: "In Transit", units: 0, restock: 35 },
  { id: 33, model: "Ioniq 5", variant: "RWD Long Range", color: "Gravity Gold", fuel: "Electric", transmission: "Automatic", priceLakh: 46.6, status: "Low Stock", units: 1, restock: 32 },
  { id: 34, model: "Ioniq 5", variant: "AWD Long Range", color: "Gravity Gold", fuel: "Electric", transmission: "Automatic", priceLakh: 48.2, status: "Low Stock", units: 1, restock: 30 },

  // Alcazar
  { id: 35, model: "Alcazar", variant: "Prestige 6-str", color: "Titan Grey", fuel: "Petrol", transmission: "Manual", priceLakh: 19.9, status: "In Stock", units: 2, restock: 11 },
  { id: 36, model: "Alcazar", variant: "Platinum 7-str", color: "Abyss Black", fuel: "Diesel", transmission: "Automatic", priceLakh: 22.9, status: "In Stock", units: 3, restock: 14 },
  { id: 37, model: "Alcazar", variant: "Signature 6-str", color: "Ranger Khaki", fuel: "Diesel", transmission: "Automatic", priceLakh: 24.5, status: "Low Stock", units: 1, restock: 16 },
  { id: 38, model: "Alcazar", variant: "Signature(O) 7-str", color: "Amazon Grey", fuel: "Diesel", transmission: "Automatic", priceLakh: 25.8, status: "In Transit", units: 0, restock: 24 },
];

// Fuel/Transmission are distinct attributes shown as separate filter groups; Color options are
// derived from real inventory data so they never go stale if inventory changes.
const FUEL_FILTER_OPTIONS = ["Petrol", "Diesel", "Hybrid", "Electric", "CNG"];
const TRANSMISSION_FILTER_OPTIONS = ["Automatic", "Manual"];
const COLOR_FILTER_OPTIONS = [...new Set(INVENTORY.map(v => v.color))].sort();

function matchesInventoryFilters(v, filters) {
  const fuelOk = filters.fuel.length === 0 || filters.fuel.includes(v.fuel);
  const transOk = filters.transmission.length === 0 || filters.transmission.includes(v.transmission);
  const colorOk = filters.color.length === 0 || filters.color.includes(v.color);
  return fuelOk && transOk && colorOk;
}

function groupInventory(leads, variantsList = INVENTORY) {
  const models = [...new Set(variantsList.map(v => v.model))];
  return models.map(model => {
    const variants = variantsList.filter(v => v.model === model);
    const totalUnits = variants.reduce((s, v) => s + v.units, 0);
    const prices = variants.map(v => v.priceLakh).sort((a, b) => a - b);
    const minPrice = prices[0], maxPrice = prices[prices.length - 1];
    let rollupStatus = "In Stock";
    if (totalUnits === 0) rollupStatus = "In Transit";
    else if (totalUnits <= 3 || variants.some(v => v.status === "Low Stock")) rollupStatus = "Low Stock";
    const avgRestock = Math.round(variants.reduce((s, v) => s + v.restock, 0) / variants.length);
    const interested = leads.filter(l => l.model === model && !["Lost", "Retailed", "Delivered"].includes(l.stage));
    return { model, variants, totalUnits, minPrice, maxPrice, rollupStatus, avgRestock, interested };
  }).sort((a, b) => b.interested.length - a.interested.length);
}

/* ============================== HELPERS ============================== */
const FLAG_META = {
  positive: { color: C.green },
  attention: { color: C.warm },
  neutral: { color: C.sub },
};

function daysAgo(dt) { return Math.round((today - dt) / 86400000); }
function daysUntil(dt) { return Math.round((dt - today) / 86400000); }

const COUNTER_LABELS = ["Leads", "Contacted", "Test Drives", "Bookings", "Delivery"];
// Shared by the performance-strip counts and the filtered screen those numbers open into.
function filterLeadsByCounter(leads, label) {
  switch (label) {
    case "Leads": return leads;
    case "Contacted": return leads.filter(l => l.stage !== "New");
    case "Test Drives": return leads.filter(l => l.stage === "Test Drive" || l.timeline.some(t => t.type === "test-drive"));
    case "Bookings": return leads.filter(l => ["Booking", "Retailed", "Delivered"].includes(l.stage));
    case "Delivery": return leads.filter(l => l.stage === "Delivered");
    default: return leads;
  }
}

function directionsUrl(location) {
  if (!location) return null;
  if (location.mapsLink) return location.mapsLink;
  if (location.text) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.text)}`;
  return null;
}

// Mock trade-in estimator — illustrative only, not a real valuation model.
// Base value assumes a generic compact hatchback; depreciates with age & mileage.
function exchangeBaseValue(year, odometer) {
  const y = parseInt(year, 10);
  const km = parseInt(odometer, 10);
  if (!y || !km) return null;
  const age = Math.max(0, today.getFullYear() - y);
  return Math.max(0.8, 7.5 - age * 0.55 - (km / 10000) * 0.12);
}
// Range spans one condition level below to one above the selected condition.
function exchangeRange(year, odometer, conditionKey) {
  const base = exchangeBaseValue(year, odometer);
  const idx = CONDITION_LEVELS.findIndex(c => c.key === conditionKey);
  if (base == null || idx === -1) return null;
  const lowIdx = Math.max(0, idx - 1);
  const highIdx = Math.min(CONDITION_LEVELS.length - 1, idx + 1);
  return {
    low: +(base * CONDITION_LEVELS[lowIdx].multiplier).toFixed(1),
    high: +(base * CONDITION_LEVELS[highIdx].multiplier).toFixed(1),
  };
}

// Ranks a lead for the rep's prioritized Calls queue — combines follow-up urgency,
// blocker-bucket weight, and AI propensity score into a single actionability score.
function queueScore(lead) {
  let score = 0;
  if (lead.followUp?.date) {
    const du = daysUntil(lead.followUp.date);
    if (du < 0) score += 100 + Math.min(40, Math.abs(du) * 5);
    else if (du === 0) score += 70;
    else if (du <= 2) score += 40 - du * 10;
  }
  score += (BUCKET_META[lead.bucket]?.weight || 0);
  score += (lead.propensity || 0) * 0.3;
  return score;
}

// A lead only belongs in the Calls queue if calling it is actually useful today. Lost deals never
// need a call. Closed-stage deals (Booked/Delivered) or leads whose most recent action was a
// completed test drive / delivery only surface again if a follow-up was explicitly scheduled.
function callsQueueEligible(lead) {
  if (lead.stage === "Lost") return false;
  const isClosedStage = lead.stage === "Booking" || lead.stage === "Retailed" || lead.stage === "Delivered";
  const last = lead.timeline[0];
  const recentlyCompleted = last && (last.type === "test-drive" || last.type === "delivery");
  if ((isClosedStage || recentlyCompleted) && !lead.followUp?.date) return false;
  return true;
}

// Rough anchor times so untimed calls (only a morning/afternoon/evening window) can still slot
// into a single time-ordered day, without pretending to know an exact minute.
const WINDOW_ANCHOR = { morning: "09:30", afternoon: "14:00", evening: "18:00" };

// Builds "the shape of the day" instead of disconnected lists: urgent items that need doing
// right now (pinned, no fixed time), and the rest of today in order (test drives at their real
// time, calls slotted at their window's anchor, deliveries folded in at the end of the day).
function buildDaySchedule(leads) {
  const pinned = [];
  const timed = [];

  leads.forEach(l => {
    if (l.testDrive?.date && isSameDay(l.testDrive.date, today)) {
      timed.push({ kind: "test-drive", time: l.testDrive.time, lead: l });
    }
    if ((l.stage === "Booking" || l.stage === "Retailed") && l.expectedDeliveryDate && isSameDay(l.expectedDeliveryDate, today)) {
      timed.push({ kind: "delivery", time: "99:99", lead: l }); // no real time — sorts to the end of today
    }
  });

  leads
    .filter(callsQueueEligible)
    .filter(l => queueScore(l) > 0)
    .forEach(l => {
      const hasFollowUp = !!l.followUp?.date;
      const overdue = hasFollowUp && daysUntil(l.followUp.date) < 0;
      const dueToday = hasFollowUp && daysUntil(l.followUp.date) === 0;
      const dueFuture = hasFollowUp && daysUntil(l.followUp.date) > 0;
      if (dueFuture) return; // not part of today
      if (overdue || (dueToday && !l.followUp.window) || !hasFollowUp) {
        pinned.push({ kind: "call", lead: l });
      } else if (dueToday && l.followUp.window) {
        timed.push({ kind: "call", time: WINDOW_ANCHOR[l.followUp.window], lead: l });
      }
    });

  pinned.sort((a, b) => queueScore(b.lead) - queueScore(a.lead));
  timed.sort((a, b) => a.time.localeCompare(b.time));
  return { pinned, timed };
}

// Aggregates everything across leads that needs the rep's attention, for the notifications panel.
function getAttentionItems(leads) {
  const items = [];
  leads.forEach(l => {
    if (l.followUp?.date && daysUntil(l.followUp.date) < 0 && l.stage !== "Lost") {
      items.push({ lead: l, icon: Phone, color: C.hot, text: `Follow-up overdue — ${l.name}` });
    }
    if (l.testDrive?.date && isSameDay(l.testDrive.date, today)) {
      items.push({ lead: l, icon: Car, color: C.purple, text: `Test drive today — ${l.name}` });
    }
    if (l.expectedDeliveryDate && daysUntil(l.expectedDeliveryDate) >= 0 && daysUntil(l.expectedDeliveryDate) <= 1) {
      items.push({ lead: l, icon: CarFront, color: C.green, text: `Delivery due soon — ${l.name}` });
    }
    if (l.exchange?.appraisalScheduled && !l.exchange?.appraisedValue) {
      items.push({ lead: l, icon: TradeInIcon, color: C.warm, text: `Appraisal pending — ${l.name}` });
    }
    if (l.escalation) {
      items.push({ lead: l, icon: Flag, color: C.hot, text: `Escalated to ${l.escalation.level === "tl" ? "Team Leader" : "Manager"} — ${l.name}` });
    }
    (l.suggestedSignals || []).forEach(s => {
      items.push({ lead: l, icon: Sparkles, color: C.gold, text: `Call analysis: ${l.name} may want ${s.signal} — review suggestion` });
    });
  });
  return items;
}

function TradeInIcon({ size = 14, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* top curved arrow */}
      <path d="M5 7C5 3.5 8.5 1.5 12 1.8C15 2 17.5 3.5 18.5 6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M15.3 4L18.6 6L16.3 8.6" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      {/* car glyph */}
      <path d="M7.3 11.5L8.8 8.5H15.2L16.7 11.5" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="5" y="11.5" width="14" height="4" rx="1.2" stroke={color} strokeWidth="1.6" />
      <circle cx="8.3" cy="16.3" r="1.4" fill={color} />
      <circle cx="15.7" cy="16.3" r="1.4" fill={color} />
      {/* bottom curved arrow, mirrored */}
      <path d="M19 17C19 20.5 15.5 22.5 12 22.2C9 22 6.5 20.5 5.5 18" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8.7 20L5.4 18L7.7 15.4" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Simplified monochrome WhatsApp glyph — accepts a color prop so it always renders correctly
// regardless of surrounding CSS context (fixes it disappearing when forced white on a colored dot).
function WhatsAppIcon({ size = 14, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2.1c-5.42 0-9.8 4.28-9.8 9.56 0 1.69.46 3.28 1.26 4.66L2 22l5.86-1.5a9.98 9.98 0 0 0 4.14.9c5.42 0 9.8-4.29 9.8-9.57S17.42 2.1 12 2.1Zm0 17.4c-1.35 0-2.65-.35-3.78-1.02l-.27-.16-2.85.73.76-2.72-.18-.28a7.7 7.7 0 0 1-1.28-4.32c0-4.29 3.6-7.78 8.03-7.78s8.03 3.49 8.03 7.78-3.6 7.77-8.03 7.77Z" />
      <path d="M16.4 13.65c-.24-.12-1.4-.68-1.62-.75-.22-.08-.38-.12-.54.12-.16.24-.62.75-.76.9-.14.16-.28.18-.52.06-.24-.12-1-.36-1.9-1.15-.7-.62-1.18-1.38-1.32-1.62-.14-.24-.02-.36.1-.48.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.28-.74-1.76-.2-.46-.4-.4-.54-.4h-.46c-.16 0-.42.06-.64.3-.22.24-.84.8-.84 1.96 0 1.16.86 2.28.98 2.44.12.16 1.7 2.56 4.1 3.6.57.24 1.02.39 1.37.5.58.18 1.1.16 1.52.1.46-.07 1.4-.57 1.6-1.12.2-.55.2-1.02.14-1.12-.06-.1-.22-.16-.46-.28Z" />
    </svg>
  );
}

// Once a lead has 2+ total contacts and one channel is actually ahead, that channel goes solid
// (full brand blue) and the other recedes to muted gray. Tied or too little signal → both stay
// in the default soft-blue state. Weight signals preference, not a new color.
function callWaTones(lead) {
  // The customer's stated preference is an explicit restriction and always overrides
  // usage history. If they said "WhatsApp only", WhatsApp gets the prominent slot
  // regardless of how many calls have been made in the past.
  if (lead.commPref === "whatsapp") return { call: "muted", whatsapp: "whatsapp" };
  if (lead.commPref === "phone")    return { call: "call",  whatsapp: "muted" };
  if (lead.commPref === "email")    return { call: "muted", whatsapp: "muted" };

  // No stated preference — fall back to usage history.
  const cu = lead.channelUsage || { call: 0, whatsapp: 0 };
  const total = cu.call + cu.whatsapp;
  if (total < 2 || cu.call === cu.whatsapp) return { call: "call", whatsapp: "whatsapp" };
  return cu.call > cu.whatsapp
    ? { call: "prominent", whatsapp: "muted" }
    : { call: "muted", whatsapp: "prominent" };
}

// Exchange label color reflects where the trade-in is in its lifecycle: blue while details are
// captured / appraisal is pending or scheduled, dark green once the appraiser has confirmed a value.
function exchangeStatusColor(lead) {
  if (lead.exchange?.appraisedValue) return { color: C.darkGreen, soft: C.darkGreenSoft };
  return { color: C.primary, soft: C.primarySoft };
}
// "Initiated" means real progress beyond just flagging the signal — a model logged, an
// appraisal booked, or a value confirmed. This is what earns the tick on the pill itself.
function hasExchangeData(lead) {
  const ex = lead.exchange;
  return !!(ex && (ex.model || ex.appraisalScheduled || ex.appraisedValue));
}
function hasFinanceData(lead) {
  const fin = lead.finance;
  return !!(fin && (fin.loanAmount || fin.bank || fin.status));
}
function exchangeSummary(lead) {
  const ex = lead.exchange;
  if (!ex) return "Not started";
  if (ex.appraisedValue) return `Appraised at ₹${ex.appraisedValue} L`;
  if (ex.appraisalScheduled) return "Appraisal scheduled";
  if (ex.model) return `${ex.model}${ex.variant ? " " + ex.variant : ""}`;
  return "Not started";
}
function financeSummary(lead) {
  const fin = lead.finance;
  if (!fin) return "Not started";
  const statusLabel = FINANCE_STATUSES.find(s => s.key === fin.status)?.label;
  if (statusLabel) return `${statusLabel}${fin.bank ? " — " + fin.bank : ""}`;
  if (fin.loanAmount) return `₹${fin.loanAmount} L requested`;
  return "Not started";
}

/* ============================== SHARED FORM STYLES ============================== */
function chipStyle(active, small) {
  return {
    fontFamily: F,
    fontWeight: 700, fontSize: small ? 10.5 : 11,
    padding: small ? "5px 10px" : "6px 12px", borderRadius: 8,
    border: `1.5px solid ${active ? C.primary : C.borderStrong}`,
    background: active ? C.primarySoft : "#FAFAF8",
    color: active ? C.primary : C.sub, cursor: "pointer",
    letterSpacing: 0.1,
  };
}
const formInputStyle = {
  border: `1.5px solid ${C.borderStrong}`, borderRadius: 10, padding: "10px 12px",
  fontFamily: F,
  fontSize: 13, fontWeight: 500, color: C.ink, outline: "none",
  background: C.bg, boxSizing: "border-box",
};
const cancelBtnStyle = {
  padding: "11px 0", borderRadius: 12, border: `1.5px solid ${C.borderStrong}`,
  background: C.bg,
  color: C.sub, fontFamily: F,
  fontWeight: 700, fontSize: 13, cursor: "pointer",
};
function saveBtnStyle(enabled) {
  return {
    padding: "11px 0", borderRadius: 12, border: "none",
    background: enabled ? C.primary : C.borderStrong,
    color: enabled ? "#fff" : C.faint,
    fontFamily: F,
    fontWeight: 700, fontSize: 13, cursor: enabled ? "pointer" : "default",
  };
}

/* ============================== SMALL UI ATOMS ============================== */
function Badge({ children, color, soft, style }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10.5, fontWeight: 700,
      color, background: soft, padding: "2px 7px", borderRadius: 6, whiteSpace: "nowrap",
      fontFamily: F, letterSpacing: 0.1, ...style,
    }}>{children}</span>
  );
}
// Telecaller has exactly 3 signals — Exchange, Finance, Urgent — and this app should match,
// not invent its own broader set. Anything else in lead.labels (freeform notes like "Opportunity"
// or "Needs Time") is real data but isn't a signal, so it doesn't get a pill here.
const SIGNALS = ["Exchange", "Finance", "Urgent"];
const LABEL_COLORS = {
  "Exchange": { color: C.teal, soft: C.tealSoft },
  "Finance": { color: C.purple, soft: C.purpleSoft },
  "Urgent": { color: C.hot, soft: C.hotSoft },
};
function labelStyle(label) {
  return LABEL_COLORS[label] || { color: C.sub, soft: C.bg };
}

function StageBadge({ stage }) {
  const map = {
    "New": C.faint, "Contacted": C.cold, "Test Drive": C.primary,
    "Opportunity": C.warm, "Booking": C.green, "Retailed": C.green, "Delivered": C.green, "Lost": C.faint,
  };
  const color = map[stage] || C.sub;
  return (
    <span style={{
      fontSize: 10, fontWeight: 800, color, fontFamily: F,
      letterSpacing: 0.6, textTransform: "uppercase",
    }}>{stage}</span>
  );
}

function BucketBadge({ bucket }) {
  const m = BUCKET_META[bucket];
  if (!m) return null;
  return <Badge color={m.color} soft={m.soft}><m.Icon size={10} />{m.label}</Badge>;
}

function propensityColor(p) {
  if (p >= 70) return "#2E7D32";   // green — strong signal
  if (p >= 40) return "#1565C0";   // blue — moderate signal
  return "#4F5A7D";                 // dark grey — weak signal
}

// 5 stars = near-certain conversion, 1 star = weak signal. Adopted from the telecaller app after
// user feedback that a raw percentage is harder to read at a glance than a familiar star rating.
function propensityStars(p) { return Math.max(1, Math.min(5, Math.round(p / 20))); }
function StarRating({ value, size = 11 }) {
  const filled = propensityStars(value);
  return (
    <div style={{ display: "flex", gap: 1 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={size} color={i <= filled ? "#F5A623" : "#B9B5AC"} fill={i <= filled ? "#F5A623" : "none"} strokeWidth={1.5} />
      ))}
    </div>
  );
}
function ArcRing({ value }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2, flexShrink: 0 }}>
      <StarRating value={value} size={13} />
      <span style={{ fontFamily: F, fontWeight: 500, fontSize: 9.5, color: C.faint, letterSpacing: 0.2 }}>likely</span>
    </div>
  );
}

function PropensityTag({ value }) {
  return <StarRating value={value} size={10} />;
}

function PulseBar({ pct, color = C.primary }) {
  return (
    <div style={{ height: 5, background: C.border, borderRadius: 999, overflow: "hidden" }}>
      <div style={{
        width: `${Math.min(100, Math.max(0, pct))}%`, height: "100%",
        background: color, borderRadius: 999, transition: "width .6s cubic-bezier(.4,0,.2,1)",
      }} />
    </div>
  );
}

// CTA button — soft-tint like the rest of the app's badges/chips, with a small solid-color
// icon dot for the two primary actions (Call, WhatsApp) so they read as primary without
// the visual weight of a fully solid block.
// One accent only. The recommended channel is orange; everything else is a neutral
// outline. Pure black is never used for a CTA — a filled action falls back to charcoal,
// which sits better against the warm background than #000.
const CHARCOAL = "#0B1946";
function IconBtn({ icon: Icon, label, onClick, tone = "default", iconOnly = false }) {
  const tones = {
    default:   { bg: C.card,        fg: C.sub,     border: C.border },
    muted:     { bg: C.card,        fg: C.ghost,   border: C.border },
    primary:   { bg: C.primarySoft, fg: C.primary, border: "rgba(59,75,232,0.25)" },
    // Recommended channel — whether that's the call or the chat, it reads the same way.
    call:      { bg: C.primary,     fg: "#fff",    border: C.primary },
    whatsapp:  { bg: C.primary,     fg: "#fff",    border: C.primary },
    prominent: { bg: C.primary,     fg: "#fff",    border: C.primary },
    // Reserved for a committed/selected state that isn't a channel recommendation.
    active:    { bg: CHARCOAL,      fg: "#fff",    border: CHARCOAL },
  };
  const t = tones[tone] || tones.default;
  const filled = t.bg === C.primary || t.bg === CHARCOAL;
  if (iconOnly) {
    return (
      <button onClick={e => { e.stopPropagation(); onClick(); }} style={{
        width: 32, height: 32, borderRadius: "50%",
        background: t.bg, color: t.fg, border: `1.5px solid ${t.border}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", flexShrink: 0,
        boxShadow: filled ? `0 2px 6px ${t.bg}55` : "none",
      }}>
        <Icon size={14} color={t.fg} />
      </button>
    );
  }
  return (
    <button onClick={e => { e.stopPropagation(); onClick(); }} style={{
      display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
      background: t.bg, color: t.fg, border: `1.5px solid ${t.border}`, borderRadius: 9,
      padding: "7px 8px", fontSize: 11.5, fontWeight: 700, fontFamily: F,
      cursor: "pointer", flex: 1, whiteSpace: "nowrap",
    }}>
      <Icon size={13} color={t.fg} />{label}
    </button>
  );
}

function Toast({ text }) {
  if (!text) return null;
  return (
    <div style={{
      position: "absolute", bottom: 80, left: "50%", transform: "translateX(-50%)",
      background: "rgba(255,255,255,0.95)",
      backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
      border: `1px solid ${C.border}`,
      borderLeft: `3px solid ${C.primary}`,
      color: C.ink, padding: "10px 16px", borderRadius: 11,
      fontSize: 12.5, fontWeight: 600,
      fontFamily: F,
      zIndex: 70, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", whiteSpace: "nowrap",
    }}>{text}</div>
  );
}

/* ============================== HEADER ============================== */
function Header({ screenName, user, onAvatar, onBack, attentionCount, onBellTap, onMenuTap }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 16px", height: 52, background: C.card,
      borderBottom: `1px solid ${C.border}`,
      position: "sticky", top: 0, zIndex: 30,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        {onBack ? (
          <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", marginRight: 4 }}>
            <ChevronLeft size={22} color={C.ink} />
          </button>
        ) : (
          <button onClick={onMenuTap} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", marginRight: 2 }}>
            <Menu size={21} color={C.ink} />
          </button>
        )}
        <span style={{ fontFamily: F, fontWeight: 900, fontSize: 16, color: C.ink, letterSpacing: -0.8, textTransform: "uppercase", display: "flex", alignItems: "center" }}>
          AUTOPRISM<span className="pulse-dot" style={{ display: "inline-block", width: 5, height: 5, borderRadius: "50%", background: C.primary, marginLeft: 1, marginBottom: 8 }} />
        </span>
        {screenName && <span style={{ fontFamily: F, fontWeight: 500, fontSize: 13, color: C.faint }}>/ {screenName}</span>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button onClick={onBellTap} style={{ position: "relative", background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex" }}>
          <Bell size={18} color={C.sub} strokeWidth={2} />
          {attentionCount > 0 && (
            <span style={{
              position: "absolute", top: 0, right: 0, minWidth: 14, height: 14, borderRadius: 999,
              background: C.hot, color: "#fff", fontSize: 9, fontWeight: 800, fontFamily: F,
              display: "flex", alignItems: "center", justifyContent: "center", padding: "0 2px",
            }}>{attentionCount > 9 ? "9+" : attentionCount}</span>
          )}
        </button>
        <button onClick={onAvatar} style={{
          width: 28, height: 28, borderRadius: "50%", background: C.ink, color: "#fff",
          border: "none", cursor: "pointer", fontFamily: F, fontWeight: 700, fontSize: 11,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>{initials(user.name)}</button>
      </div>
    </div>
  );
}

/* ============================== MENU DRAWER ============================== */
function MenuDrawer({ active, onChange, onClose, onLogout, onQuickQuote, onOpenMIS }) {
  // Two-level menu, matching the agreed navigation. Sub-items route to the same screens
  // with a preset view, so the structure is the menu's job rather than each screen's.
  const [openGroup, setOpenGroup] = useState("leads");
  const tabs = [
    { key: "leads", label: "Leads", Icon: ClipboardList, subs: [
      { key: "leads:all",        label: "All Leads" },
      { key: "leads:queue",      label: "Call Queue" },
      { key: "leads:followups",  label: "Follow-Ups" },
      { key: "leads:delivery",   label: "Post-Delivery" },
      { key: "activity",         label: "Recent Activity" },
    ]},
    { key: "inventory", label: "Inventory", Icon: CarFront, subs: [
      { key: "inventory:new",      label: "New Cars" },
      { key: "inventory:preowned", label: "Pre-Owned" },
      { key: "inventory:demo",     label: "Demo Cars" },
      { key: "inventory:block",    label: "Block/Allocate a car" },
    ]},
    { key: "performance", label: "Performance", Icon: BarChart3, subs: [
      { key: "leaderboard", label: "Leaderboard" },
      { key: "dashboard",   label: "Dashboard" },
    ]},
    { key: "learning", label: "Learning", Icon: GraduationCap, subs: [] },
    { key: "account", label: "My Account", Icon: User, subs: [
      { key: "account:profile",  label: "Profile" },
      { key: "account:password", label: "Password" },
      { key: "account:language", label: "Language" },
      { key: "account:email",    label: "Email ID" },
    ]},
  ];
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 100, display: "flex" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(14,14,12,0.4)" }} />
      <div style={{ position: "relative", width: "78%", maxWidth: 280, height: "100%", background: C.card, boxShadow: "8px 0 32px rgba(0,0,0,0.18)", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 18px 14px" }}>
          <span style={{ fontFamily: F, fontWeight: 900, fontSize: 15, color: C.ink, letterSpacing: -0.8, textTransform: "uppercase" }}>
            AUTOPRISM<span style={{ display: "inline-block", width: 5, height: 5, borderRadius: "50%", background: C.primary, marginLeft: 1, marginBottom: 8 }} />
          </span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}><X size={19} color={C.faint} /></button>
        </div>
        <div style={{ padding: "6px 10px", flex: 1, overflowY: "auto" }}>
          {tabs.map(t => {
            const groupActive = t.subs.length
              ? t.subs.some(sub => sub.key === active)
              : active === t.key;
            const expanded = openGroup === t.key;
            return (
              <div key={t.key} style={{ marginBottom: 2 }}>
                <button onClick={() => {
                  if (!t.subs.length) { onChange(t.key); onClose(); return; }
                  setOpenGroup(expanded ? null : t.key);
                }} style={{
                  display: "flex", alignItems: "center", gap: 11, width: "100%", padding: "10px 12px",
                  borderRadius: 9, border: "none", background: groupActive ? C.primarySoft : "none",
                  cursor: "pointer", textAlign: "left",
                }}>
                  <t.Icon size={17} color={groupActive ? C.primary : C.faint} strokeWidth={groupActive ? 2.4 : 1.8} />
                  <span style={{ flex: 1, fontFamily: F, fontWeight: groupActive ? 700 : 500, fontSize: 13.5,
                    color: groupActive ? C.primary : C.ink }}>{t.label}</span>
                  {t.subs.length > 0 && (
                    <ChevronDown size={14} color={C.ghost} style={{
                      transform: expanded ? "rotate(180deg)" : "none", transition: "transform .18s" }} />
                  )}
                </button>
                {expanded && t.subs.map(sub => {
                  const on = active === sub.key;
                  return (
                    <button key={sub.key} onClick={() => { onChange(sub.key); onClose(); }} style={{
                      display: "flex", alignItems: "center", width: "100%", padding: "8px 12px 8px 40px",
                      borderRadius: 8, border: "none", background: on ? C.primarySoft : "none",
                      cursor: "pointer", textAlign: "left",
                    }}>
                      <span style={{ fontFamily: F, fontWeight: on ? 700 : 500, fontSize: 12.5,
                        color: on ? C.primary : C.sub }}>{sub.label}</span>
                    </button>
                  );
                })}
              </div>
            );
          })}

          {/* Actions that used to live on the floating button / the removed MIS toggle */}
          <div style={{ borderTop: `1px solid ${C.border}`, margin: "10px 2px", paddingTop: 10 }}>
            <div style={{ fontFamily: F, fontSize: 9.5, fontWeight: 700, color: C.faint, textTransform: "uppercase", letterSpacing: 0.6, padding: "0 12px 6px" }}>Quick actions</div>
            <button onClick={() => { onClose(); onQuickQuote(); }} style={{
              display: "flex", alignItems: "center", gap: 11, width: "100%", padding: "10px 12px", borderRadius: 9,
              border: "none", background: "none", cursor: "pointer", marginBottom: 2, textAlign: "left",
            }}>
              <FileText size={17} color={C.teal} strokeWidth={1.8} />
              <span style={{ fontFamily: F, fontWeight: 500, fontSize: 13.5, color: C.ink }}>Quick Quote</span>
            </button>
            <button onClick={() => { onClose(); onOpenMIS(); }} style={{
              display: "flex", alignItems: "center", gap: 11, width: "100%", padding: "10px 12px", borderRadius: 9,
              border: "none", background: "none", cursor: "pointer", textAlign: "left",
            }}>
              <BarChart3 size={17} color={C.faint} strokeWidth={1.8} />
              <span style={{ fontFamily: F, fontWeight: 500, fontSize: 13.5, color: C.ink }}>Generate MIS</span>
            </button>
          </div>
        </div>
        <div style={{ padding: 12, borderTop: `1px solid ${C.border}` }}>
          <button onClick={onLogout} style={{ display: "flex", alignItems: "center", gap: 11, width: "100%", padding: "9px 12px", borderRadius: 9, border: "none", background: "none", cursor: "pointer", textAlign: "left" }}>
            <LogOut size={16} color={C.hot} />
            <span style={{ fontFamily: F, fontWeight: 600, fontSize: 13.5, color: C.hot }}>Sign out</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================== CALL LOG SUB-FORMS ============================== */
function TestDriveFields({ value, onChange, model, leads, excludeLeadId }) {
  const fieldLabelStyle = { fontFamily: F, fontSize: 10, color: C.faint, fontWeight: 600, marginBottom: 3, display: "block" };
  const availability = (model && leads && value.date && value.time) ? getDemoAvailability(model, value.date, value.time, leads, excludeLeadId) : null;
  return (
    <div style={{ marginTop: 9 }}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {TEST_DRIVE_MODES.map(m => (
          <button key={m.key} onClick={() => onChange({ ...value, mode: m.key })} style={{
            ...chipStyle(value.mode === m.key, true), display: "flex", alignItems: "center", gap: 4
          }}>
            <m.icon size={11} />{m.label}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 130 }}>
          <span style={fieldLabelStyle}>Date</span>
          <input type="date" value={value.date} min={toDateInputValue(today)}
            onChange={e => onChange({ ...value, date: e.target.value })} style={{ ...formInputStyle, width: 170, maxWidth: "100%" }} />
        </div>
        <div style={{ flex: 1, minWidth: 110 }}>
          <span style={fieldLabelStyle}>Time</span>
          <input type="time" value={value.time}
            onChange={e => onChange({ ...value, time: e.target.value })} style={{ ...formInputStyle, width: "100%" }} />
        </div>
      </div>
      {value.mode === "location" && (
        <input
          type="text" value={value.locationText || ""} placeholder="Address or paste Google Maps link (optional)"
          onChange={e => onChange({ ...value, locationText: e.target.value })}
          style={{ ...formInputStyle, width: "100%", marginTop: 8 }}
        />
      )}
      {availability && availability.conflicts.length > 0 && (
        <div style={{ background: C.warmSoft, borderRadius: 9, padding: 9, marginTop: 9 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <Car size={12} color={C.warm} />
            <span style={{ fontFamily: F, fontSize: 10, fontWeight: 800, color: C.warm, textTransform: "uppercase", letterSpacing: .3 }}>
              TD car may be unavailable
            </span>
          </div>
          {availability.conflicts.map((c, i) => (
            <div key={i} style={{ fontFamily: F, fontSize: 11, color: C.ink, marginTop: 4 }}>
              • {c.repName === "you" ? "You already have" : `${c.repName} has`}{c.customer ? ` ${c.repName === "you" ? "" : "one"} booked for ${c.customer}` : " it booked"} around {fmtTime(c.time)}
            </div>
          ))}
          <div style={{ fontFamily: F, fontSize: 10.5, color: C.sub, marginTop: 6, fontStyle: "italic" }}>
            Just a heads-up — you can still go ahead and schedule.
          </div>
        </div>
      )}
      {availability && availability.conflicts.length === 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 9 }}>
          <Check size={12} color={C.green} />
          <span style={{ fontFamily: F, fontSize: 11, color: C.green, fontWeight: 600 }}>Demo car likely available at this time</span>
        </div>
      )}
    </div>
  );
}

// Cancelling a scheduled test drive, with a reason — same presets+notes pattern as Lost.
function TestDriveCancelForm({ onCancel, onSubmit }) {
  const [reason, setReason] = useState(null);
  const [note, setNote] = useState("");
  const [recording, setRecording] = useState(false);
  const canSubmit = !!reason;
  const [attempted, setAttempted] = useState(false);

  const handleVoice = () => {
    if (recording) return;
    setRecording(true);
    setTimeout(() => {
      const text = MOCK_VOICE_TRANSCRIPTS[Math.floor(Math.random() * MOCK_VOICE_TRANSCRIPTS.length)];
      setNote(prev => prev ? `${prev} ${text}` : text);
      setRecording(false);
    }, 1600);
  };

  return (
    <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px dashed ${C.border}` }} onClick={e => e.stopPropagation()}>
      <div style={{ fontFamily: F, fontSize: 11.5, fontWeight: 700, color: C.ink, marginBottom: 8 }}>Cancel Test Drive</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {TEST_DRIVE_CANCEL_REASONS.map(r => (
          <button key={r.key} onClick={() => setReason(r.key)} style={chipStyle(reason === r.key)}>{r.label}</button>
        ))}
      </div>
      <div style={{ marginTop: 10 }}>
        <NoteField value={note} onChange={setNote} recording={recording} onVoiceNote={handleVoice} />
      </div>
      {attempted && !canSubmit && <MissingBanner items={["a cancellation reason"]} />}
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <button onClick={onCancel} style={{ flex: 1, ...cancelBtnStyle }}>Back</button>
        <button onClick={() => { if (!canSubmit) { setAttempted(true); return; } onSubmit({ reason, note }); }} style={{ flex: 2, ...saveBtnStyle(canSubmit) }}>Confirm Cancellation</button>
      </div>
    </div>
  );
}

// Logged after a test drive happens — captures how it actually went, same presets+notes
// pattern as the call log. Clearing the lead's upcoming testDrive also feeds the existing
// "recently completed" suppression logic in the Calls queue.
function TestDriveResponseForm({ onCancel, onSubmit }) {
  const [response, setResponse] = useState(null);
  const [note, setNote] = useState("");
  const [recording, setRecording] = useState(false);
  const [booking, setBooking] = useState(null);
  const [attempted, setAttempted] = useState(false);
  // A customer who loved the drive is a booking conversation, not a closed task — so we
  // insist on either the amount or a date they have committed to pay it.
  const needsBooking = response === "loved_ready";
  const canSubmit = !!response && (!needsBooking || bookingStepComplete(booking));

  const handleVoice = () => {
    if (recording) return;
    setRecording(true);
    setTimeout(() => {
      const text = MOCK_VOICE_TRANSCRIPTS[Math.floor(Math.random() * MOCK_VOICE_TRANSCRIPTS.length)];
      setNote(prev => prev ? `${prev} ${text}` : text);
      setRecording(false);
    }, 1600);
  };

  return (
    <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px dashed ${C.border}` }} onClick={e => e.stopPropagation()}>
      <div style={{ fontFamily: F, fontSize: 11.5, fontWeight: 700, color: C.ink, marginBottom: 8 }}>How did it go?</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {TEST_DRIVE_RESPONSES.map(r => (
          <button key={r.key} onClick={() => setResponse(r.key)} style={chipStyle(response === r.key)}>{r.label}</button>
        ))}
      </div>
      {needsBooking && <BookingAmountStep value={booking} onChange={setBooking} attempted={attempted} />}
      <div style={{ marginTop: 10 }}>
        <NoteField value={note} onChange={setNote} recording={recording} onVoiceNote={handleVoice} />
      </div>
      {attempted && !canSubmit && (
        <div style={{ marginTop: 10 }}>
          <MissingBanner items={!response ? ["how the test drive went"] : bookingMissing(booking)} />
        </div>
      )}
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <button onClick={onCancel} style={{ flex: 1, ...cancelBtnStyle }}>Cancel</button>
        <button onClick={() => { if (!canSubmit) { setAttempted(true); return; } onSubmit({ response, note, booking }); }}
          style={{ flex: 2, ...saveBtnStyle(canSubmit) }}>Save</button>
      </div>
    </div>
  );
}

function NoteField({ value, onChange, recording, onVoiceNote }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
        <span style={{ fontFamily: F, fontSize: 10.5, color: C.sub, fontWeight: 600 }}>Note (optional)</span>
        <button onClick={onVoiceNote} disabled={recording} style={{
          display: "flex", alignItems: "center", gap: 4, background: recording ? C.hotSoft : C.primarySoft,
          color: recording ? C.hot : C.primary, border: "none", borderRadius: 999, padding: "4px 8px",
          fontSize: 10, fontWeight: 700, cursor: recording ? "default" : "pointer", fontFamily: F
        }}>
          <Mic size={11} className={recording ? "pulse-dot" : ""} />{recording ? "Listening…" : "Voice"}
        </button>
      </div>
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder="Type a note…" rows={2} style={{
        width: "100%", border: `1px solid ${C.border}`, borderRadius: 9, padding: "7px 9px",
        fontFamily: F, fontSize: 12, color: C.ink, outline: "none", background: C.bg,
        resize: "none", boxSizing: "border-box"
      }} />
    </div>
  );
}

function CallLogForm({ lead, onSubmit, onCancel, voiceFirst = true }) {
  const [outcome, setOutcome] = useState(null);
  const [subReason, setSubReason] = useState(null);
  const [callback, setCallback] = useState({ date: "", window: "" });
  const [testDrive, setTestDrive] = useState({ mode: "", date: "", time: "", locationText: "" });
  const [readyMode, setReadyMode] = useState("token"); // "token" | "full" | "followup"
  const [readyFollowUp, setReadyFollowUp] = useState({ date: "", window: "" });
  const [readyBooking, setReadyBooking] = useState({ advance: "", deliveryDate: "", mode: "" });
  const [readyRetailDate, setReadyRetailDate] = useState(toDateInputValue(today));
  const [readyPaymentDetails, setReadyPaymentDetails] = useState(defaultPaymentBreakdown());
  const readyFirstVehicle = (lead.vehicles && lead.vehicles.length ? lead.vehicles : [{ id: "v1", model: lead.model, variant: lead.variant, color: lead.color || "" }])[0];
  const [readyVehicle, setReadyVehicle] = useState(readyFirstVehicle);
  const [note, setNote] = useState("");
  const [recording, setRecording] = useState(false);
  // Voice-first: "capture" is the default surface, "review" shows what was parsed,
  // "manual" is the fallback for when a rep would rather tap than talk.
  // Recorded calls are auto-parsed into the review screen. Manual is the MVP input path.
  const [logMode, setLogMode] = useState(lead.hasRecording ? "review" : "manual");
  const [transcript, setTranscript] = useState(lead.hasRecording ? (lead.recordingTranscript || MOCK_CALL_DICTATIONS[0]) : "");
  const [parsed, setParsed] = useState(null);
  const [dictating, setDictating] = useState(false);
  const [attempted, setAttempted] = useState(false);

  // Push a parsed transcript into the same state the manual form writes to, so a voice log
  // and a typed log produce an identical record downstream.
  const applyParsed = (p) => {
    if (p.outcome) setOutcome(p.outcome);
    if (p.subReason) setSubReason(p.subReason);
    if (p.callback.date || p.callback.window) setCallback(c => ({ ...c, ...p.callback }));
    if (p.testDrive.mode || p.testDrive.date) setTestDrive(td => ({ ...td, ...p.testDrive }));
    if (p.booking?.advance) setReadyBooking(b => ({ ...b, advance: p.booking.advance }));
    setNote(p.leftover);
  };

  useEffect(() => {
    if (lead.hasRecording && !parsed) {
      const p = parseCallTranscript(transcript, lead);
      setParsed(p); applyParsed(p);
    }
  }, []);

  const runDictation = () => {
    if (dictating) return;
    setDictating(true);
    setTimeout(() => {
      const text = MOCK_CALL_DICTATIONS[Math.floor(Math.random() * MOCK_CALL_DICTATIONS.length)];
      const p = parseCallTranscript(text, lead);
      setTranscript(text); setParsed(p); applyParsed(p);
      setDictating(false); setLogMode("review");
    }, 1700);
  };

  const handleVoice = () => {
    if (recording) return;
    setRecording(true);
    setTimeout(() => {
      const text = MOCK_VOICE_TRANSCRIPTS[Math.floor(Math.random() * MOCK_VOICE_TRANSCRIPTS.length)];
      setNote(prev => prev ? `${prev} ${text}` : text);
      setRecording(false);
    }, 1600);
  };

  const canSubmit = !!outcome
    && (outcome !== "not_interested" || !!subReason)
    && (outcome !== "callback" || (callback.date && callback.window))
    && (outcome !== "test_drive" || (testDrive.mode && testDrive.date && testDrive.time))
    && (outcome !== "ready" || (!!(readyVehicle.model && readyVehicle.variant) && (
      readyMode === "full" ? (!!readyRetailDate && paymentBreakdownHasAmount(readyPaymentDetails)) :
      readyMode === "followup" ? (!!readyFollowUp.date && !!readyFollowUp.window) :
      (readyBooking.advance && readyBooking.deliveryDate && readyBooking.mode)
    )));

  // Named, human-readable list of what is still blocking the save.
  const missingList = (() => {
    const m = [];
    if (!outcome) return ["a call outcome"];
    if (outcome === "not_interested" && !subReason) m.push("a reason");
    if (outcome === "callback") {
      if (!callback.date) m.push("callback date");
      if (!callback.window) m.push("time window");
    }
    if (outcome === "test_drive") {
      if (!testDrive.mode) m.push("test drive location");
      if (!testDrive.date) m.push("test drive date");
      if (!testDrive.time) m.push("test drive time");
    }
    if (outcome === "ready") {
      if (!readyVehicle.model || !readyVehicle.variant) m.push("confirmed vehicle");
      if (readyMode === "full") {
        if (!readyRetailDate) m.push("retail date");
        if (!paymentBreakdownHasAmount(readyPaymentDetails)) m.push("payment amount");
      } else if (readyMode === "followup") {
        if (!readyFollowUp.date) m.push("date they'll pay");
        if (!readyFollowUp.window) m.push("time window");
      } else {
        if (!readyBooking.advance) m.push("advance amount");
        if (!readyBooking.deliveryDate) m.push("expected delivery date");
        if (!readyBooking.mode) m.push("payment mode");
      }
    }
    return m;
  })();

  const submitPayload = () => onSubmit({ outcome, subReason, callback, testDrive, note, readyMode, readyBooking, readyRetailDate, readyPaymentDetails, readyVehicle, readyFollowUp, transcript, signals: parsed?.signals || [] });

  /* ---------- PARSED REVIEW ---------- */
  if (logMode === "review" && parsed) {
    const chips = parsed.confidence;
    return (
      <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px dashed ${C.border}` }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.darkGreen }} />
          <span style={{ fontFamily: F, fontSize: 11.5, fontWeight: 700, color: C.darkGreen }}>
            {lead.hasRecording ? "Logged from the call recording" : "Logged from your voice note"}
          </span>
        </div>

        <div style={{ background: C.bg, borderRadius: 10, padding: "9px 11px", marginBottom: 10 }}>
          <div style={{ fontFamily: F, fontSize: 9.5, fontWeight: 700, color: C.faint, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 4 }}>What we heard</div>
          <div style={{ fontFamily: F, fontSize: 11, color: C.sub, lineHeight: 1.45, fontStyle: "italic" }}>"{transcript}"</div>
        </div>

        {chips.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontFamily: F, fontSize: 9.5, fontWeight: 700, color: C.faint, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 6 }}>Filled in for you</div>
            {chips.map(([k, v], i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, marginBottom: 5 }}>
                <Check size={12} color={C.darkGreen} />
                <span style={{ fontFamily: F, fontSize: 10, color: C.faint, width: 82, flexShrink: 0 }}>{k}</span>
                <span style={{ fontFamily: F, fontSize: 11.5, fontWeight: 700, color: C.ink, flex: 1 }}>{v}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ fontFamily: F, fontSize: 9.5, fontWeight: 700, color: C.faint, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 5 }}>Kept as a note</div>
        <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
          style={{ ...formInputStyle, width: "100%", boxSizing: "border-box", resize: "vertical", marginBottom: 10, fontSize: 11 }} />

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setLogMode("manual")} style={{ flex: 1, ...cancelBtnStyle }}>Edit details</button>
          <button onClick={() => { if (!canSubmit) { setAttempted(true); setLogMode("manual"); return; } submitPayload(); }} style={{ flex: 2, ...saveBtnStyle(canSubmit) }}>
            {canSubmit ? "Confirm & Log" : "Add missing details"}
          </button>
        </div>
        {!canSubmit && (
          <div style={{ fontFamily: F, fontSize: 10, color: C.warm, marginTop: 7, textAlign: "center" }}>
            Still needed: {missingList.join(" · ")}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px dashed ${C.border}` }} onClick={e => e.stopPropagation()}>
      <div style={{ fontFamily: F, fontSize: 11.5, fontWeight: 700, color: C.ink, marginBottom: 8 }}>Log this call</div>
      <div style={{ fontFamily: F, fontSize: 10, fontWeight: 800, color: C.faint, textTransform: "uppercase", letterSpacing: .4, marginBottom: 6 }}>Contacted</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {CONTACTED_OUTCOMES.map(o => (
          <button key={o.key} onClick={() => setOutcome(o.key)} style={chipStyle(outcome === o.key)}>{o.label}</button>
        ))}
      </div>
      <div style={{ height: 1, background: C.border, margin: "11px 0" }} />
      <div style={{ fontFamily: F, fontSize: 10, fontWeight: 800, color: C.faint, textTransform: "uppercase", letterSpacing: .4, marginBottom: 6 }}>Not Contacted</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {NOT_CONTACTED_OUTCOMES.map(o => (
          <button key={o.key} onClick={() => setOutcome(o.key)} style={chipStyle(outcome === o.key)}>{o.label}</button>
        ))}
      </div>
      {outcome === "not_interested" && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
          {NOT_INTERESTED_REASONS.map(r => (
            <button key={r.key} onClick={() => setSubReason(r.key)} style={chipStyle(subReason === r.key, true)}>{r.label}</button>
          ))}
        </div>
      )}
      {outcome === "callback" && (
        <div style={{ marginTop: 9 }}>
          <span style={{ fontFamily: F, fontSize: 10, color: C.faint, fontWeight: 600, marginBottom: 3, display: "block" }}>Callback Date</span>
          <input type="date" value={callback.date} min={toDateInputValue(today)}
            onChange={e => setCallback(c => ({ ...c, date: e.target.value }))} style={{ ...formInputStyle, width: 170, maxWidth: "100%", ...reqInput(attempted && !callback.date) }} />
          <ReqHint show={attempted && !callback.date} text="Pick a callback date" />
          <div style={{ display: "flex", gap: 6, marginTop: 7 }}>
            {CALL_WINDOWS.map(w => (
              <button key={w.key} onClick={() => setCallback(c => ({ ...c, window: w.key }))} style={chipStyle(callback.window === w.key, true)}>{w.label}</button>
            ))}
          </div>
          <ReqHint show={attempted && !callback.window} text="Pick a time window" />
        </div>
      )}
      {outcome === "test_drive" && <TestDriveFields value={testDrive} onChange={setTestDrive} />}
      {outcome === "ready" && (
        <div style={{ marginTop: 9 }}>
          <VehicleConfirmPicker lead={lead} value={readyVehicle} onChange={setReadyVehicle} />
          <div style={{ display: "flex", gap: 6, marginBottom: 9 }}>
            <button onClick={() => setReadyMode("token")} style={{
              flex: 1, minWidth: 0, boxSizing: "border-box", padding: "8px 4px", borderRadius: 8, border: `1.5px solid ${readyMode === "token" ? C.green : C.borderStrong}`,
              background: readyMode === "token" ? C.greenSoft : C.bg, color: readyMode === "token" ? C.green : C.sub,
              fontFamily: F, fontWeight: 700, fontSize: 9.5, cursor: "pointer",
            }}>Token received</button>
            <button onClick={() => setReadyMode("full")} style={{
              flex: 1, minWidth: 0, boxSizing: "border-box", padding: "8px 4px", borderRadius: 8, border: `1.5px solid ${readyMode === "full" ? C.green : C.borderStrong}`,
              background: readyMode === "full" ? C.greenSoft : C.bg, color: readyMode === "full" ? C.green : C.sub,
              fontFamily: F, fontWeight: 700, fontSize: 9.5, cursor: "pointer",
            }}>Paid in full</button>
            <button onClick={() => setReadyMode("followup")} style={{
              flex: 1, minWidth: 0, boxSizing: "border-box", padding: "8px 4px", borderRadius: 8, border: `1.5px solid ${readyMode === "followup" ? C.green : C.borderStrong}`,
              background: readyMode === "followup" ? C.greenSoft : C.bg, color: readyMode === "followup" ? C.green : C.sub,
              fontFamily: F, fontWeight: 700, fontSize: 9.5, cursor: "pointer",
            }}>Not yet paid</button>
          </div>
          {readyMode === "token" ? (
            <>
              <input type="number" min="0" placeholder="Advance amount (₹)" value={readyBooking.advance}
                onChange={e => setReadyBooking(b => ({ ...b, advance: e.target.value }))}
                style={{ ...formInputStyle, width: "100%", marginBottom: 4, ...reqInput(attempted && !readyBooking.advance) }} />
              <ReqHint show={attempted && !readyBooking.advance} text="Enter the advance amount" />
              <span style={{ fontFamily: F, fontSize: 10, color: C.faint, fontWeight: 600, marginBottom: 3, display: "block" }}>Expected Delivery Date</span>
              <input type="date" value={readyBooking.deliveryDate} min={toDateInputValue(today)}
                onChange={e => setReadyBooking(b => ({ ...b, deliveryDate: e.target.value }))}
                style={{ ...formInputStyle, width: 170, maxWidth: "100%", marginBottom: 8 }} />
              <div style={{ fontFamily: F, fontSize: 10.5, color: C.sub, fontWeight: 600, marginBottom: 5 }}>Payment Mode</div>
              <div style={{ display: "flex", gap: 6 }}>
                {PAYMENT_MODES.map(m => (
                  <button key={m} onClick={() => setReadyBooking(b => ({ ...b, mode: m }))} style={chipStyle(readyBooking.mode === m, true)}>{m}</button>
                ))}
              </div>
            </>
          ) : readyMode === "full" ? (
            <>
              <div style={{ fontFamily: F, fontSize: 10.5, color: C.sub, marginBottom: 9, lineHeight: 1.4 }}>Customer is paying in full right now — this books and retails the deal in one step.</div>
              <span style={{ fontFamily: F, fontSize: 10, color: C.faint, fontWeight: 600, marginBottom: 3, display: "block" }}>Retail Date</span>
              <input type="date" value={readyRetailDate} min={toDateInputValue(today)} onChange={e => setReadyRetailDate(e.target.value)}
                style={{ ...formInputStyle, width: 170, maxWidth: "100%", marginBottom: 10 }} />
              <PaymentBreakdownFields value={readyPaymentDetails} onChange={setReadyPaymentDetails} />
            </>
          ) : (
            <>
              <div style={{ fontFamily: F, fontSize: 10.5, color: C.sub, marginBottom: 9, lineHeight: 1.4 }}>No money in yet. The lead moves to Booking · Ready_to_book and we schedule the call to collect it.</div>
              <span style={{ fontFamily: F, fontSize: 10, color: C.faint, fontWeight: 600, marginBottom: 3, display: "block" }}>Follow-up Date</span>
              <input type="date" value={readyFollowUp.date} min={toDateInputValue(today)}
                onChange={e => setReadyFollowUp(f => ({ ...f, date: e.target.value }))} style={{ ...formInputStyle, width: 170, maxWidth: "100%", ...reqInput(attempted && !readyFollowUp.date) }} />
              <ReqHint show={attempted && !readyFollowUp.date} text="Pick the date they'll pay" />
              <div style={{ display: "flex", gap: 6, marginTop: 7 }}>
                {CALL_WINDOWS.map(w => (
                  <button key={w.key} onClick={() => setReadyFollowUp(f => ({ ...f, window: w.key }))} style={chipStyle(readyFollowUp.window === w.key, true)}>{w.label}</button>
                ))}
              </div>
              <ReqHint show={attempted && !readyFollowUp.window} text="Pick a time window" />
            </>
          )}
        </div>
      )}
      <div style={{ marginTop: 10 }}>
        <NoteField value={note} onChange={setNote} recording={recording} onVoiceNote={handleVoice} />
      </div>
      {attempted && !canSubmit && <MissingBanner items={missingList} />}
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <button onClick={onCancel} style={{ flex: 1, ...cancelBtnStyle }}>Cancel</button>
        <button onClick={() => { if (!canSubmit) { setAttempted(true); return; } submitPayload(); }}
          style={{ flex: 2, ...saveBtnStyle(canSubmit) }}>Save Log</button>
      </div>
    </div>
  );
}

/* ============================== LEAD CARD ============================== */
// WhatsApp logging — one outcome decision, not a separate type + outcome step.

function WhatsAppModePicker({ lead, onPick, onCancel }) {
  const phone = (lead?.phone || "").replace(/[^0-9]/g, "");
  const OPTS = [
    { key: "whatsapp_call", label: "WhatsApp Call", note: "Voice call over WhatsApp",
      Icon: Phone, href: `https://wa.me/${phone}` },
    { key: "whatsapp_msg", label: "WhatsApp Message", note: "Send a message",
      Icon: MessageSquare, href: `https://wa.me/${phone}` },
  ];
  return (
    <div style={{ padding: 12, background: C.bg, borderRadius: 12, marginTop: 8 }}>
      <div style={{ fontFamily: F, fontSize: 11, fontWeight: 800, color: C.faint,
        textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 9 }}>How do you want to reach them?</div>
      <div style={{ display: "flex", gap: 8 }}>
        {OPTS.map(o => (
          <button key={o.key} type="button"
            onClick={() => {
              // Open WhatsApp in a new tab, then show the same outcome form a call uses.
              try { window.open(o.href, "_blank", "noopener"); } catch (e) {}
              onPick(o.key);
            }}
            style={{ flex: 1, textDecoration: "none", display: "flex", flexDirection: "column",
              alignItems: "center", gap: 5, padding: "12px 8px", borderRadius: 10,
              border: `1.5px solid ${C.border}`, background: C.card, cursor: "pointer" }}>
            <o.Icon size={18} color={C.green} />
            <span style={{ fontFamily: F, fontSize: 12, fontWeight: 700, color: C.ink }}>{o.label}</span>
            <span style={{ fontFamily: F, fontSize: 10, color: C.faint, textAlign: "center" }}>{o.note}</span>
          </button>
        ))}
      </div>
      <button onClick={onCancel} style={{ width: "100%", marginTop: 9, padding: "8px 0",
        borderRadius: 9, border: `1.5px solid ${C.borderStrong}`, background: C.card,
        color: C.sub, fontFamily: F, fontWeight: 700, fontSize: 11.5, cursor: "pointer" }}>Cancel</button>
    </div>
  );
}

function WhatsAppLogForm({ onSubmit, onCancel }) {
  const [outcome, setOutcome] = useState(null);
  const [note, setNote] = useState("");
  const [recording, setRecording] = useState(false);

  const canSubmit = !!outcome;
  const [attempted, setAttempted] = useState(false);

  const handleVoice = () => {
    if (recording) return;
    setRecording(true);
    setTimeout(() => {
      const text = MOCK_VOICE_TRANSCRIPTS[Math.floor(Math.random() * MOCK_VOICE_TRANSCRIPTS.length)];
      setNote(prev => prev ? `${prev} ${text}` : text);
      setRecording(false);
    }, 1600);
  };

  return (
    <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px dashed ${C.border}` }} onClick={e => e.stopPropagation()}>
      <div style={{ fontFamily: F, fontSize: 11.5, fontWeight: 700, color: C.ink, marginBottom: 8 }}>Log this WhatsApp interaction</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
        {WHATSAPP_OUTCOMES.map(o => (
          <button key={o.key} onClick={() => setOutcome(o.key)} style={chipStyle(outcome === o.key)}>{o.label}</button>
        ))}
      </div>
      <NoteField value={note} onChange={setNote} recording={recording} onVoiceNote={handleVoice} />
      {attempted && !canSubmit && <MissingBanner items={["a chat outcome"]} />}
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <button onClick={onCancel} style={{ flex: 1, ...cancelBtnStyle }}>Cancel</button>
        <button onClick={() => { if (!canSubmit) { setAttempted(true); return; } onSubmit({ outcome, note }); }} style={{ flex: 2, ...saveBtnStyle(canSubmit) }}>
          Save Log
        </button>
      </div>
    </div>
  );
}



// Stage-aware WhatsApp message templates. The rep picks one; we open it in WhatsApp
// with the text pre-filled. Templates are light prompts, not full scripts.
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

// ---- WhatsApp templates -------------------------------------------------------
// A library of openers. Which three surface is decided by where the lead actually is —
// there's no point offering a test drive to someone who took one last week, or asking
// for a booking amount from a lead that hasn't been qualified yet.
const WA_LIB = {
  intro: {
    title: "Introduce yourself", brief: "Who you are + what they enquired about",
    Icon: User, tone: "#25D366",
    build: ({ first, model, rep, dealership }) =>
      `Hello ${first}, this is ${rep} from ${dealership}. 🙏\n\n` +
      `Thank you for your enquiry about the ${model}. I'll be your point of contact for anything you need — pricing, variants, test drive or exchange.\n\n` +
      `Is this a good time to share the details?`,
  },
  quote: {
    title: "Share on-road price", brief: "Full price breakup for their model",
    Icon: FileText, tone: "#0F766E",
    build: ({ first, model, variant, rep, dealership }) =>
      `Hi ${first}, as promised — here is the on-road price for the ${model}${variant ? ` ${variant}` : ""}. 🚗\n\n` +
      `• Ex-showroom, RTO, insurance and handling included\n• Current offers already applied\n• Exchange and finance options available\n\n` +
      `Shall I send the detailed quote PDF?\n\n— ${rep}, ${dealership}`,
  },
  testdrive: {
    title: "Invite for a test drive", brief: "Offer slots, bring them to the showroom",
    Icon: CarFront, tone: "#D97706",
    build: ({ first, model, rep, dealership }) =>
      `Hi ${first}, would you like to experience the ${model} before deciding? 🙂\n\n` +
      `I can arrange a test drive at the showroom, or bring the car to your place — whichever is easier.\n\n` +
      `Which works better — this weekend or a weekday evening?\n\n— ${rep}, ${dealership}`,
  },
  td_confirm: {
    title: "Confirm the test drive", brief: "Slot, location and what to carry",
    Icon: Calendar, tone: "#D97706",
    build: ({ first, model, rep, dealership }) =>
      `Hi ${first}, confirming your test drive of the ${model}. 🚗\n\n` +
      `Please carry your driving licence — it's required before the drive.\n\n` +
      `If the timing needs to change, just message me here.\n\n— ${rep}, ${dealership}`,
  },
  td_feedback: {
    title: "Follow up after the drive", brief: "Ask how it went, move to next step",
    Icon: MessageCircle, tone: "#0F766E",
    build: ({ first, model, rep }) =>
      `Hi ${first}, hope you enjoyed driving the ${model}! 😊\n\n` +
      `How did it feel — anything you'd like to know before taking it forward?\n\n` +
      `Happy to share the best offer running right now.\n\n— ${rep}`,
  },
  revised_quote: {
    title: "Share revised offer", brief: "Updated numbers after your discussion",
    Icon: FileText, tone: "#0F766E",
    build: ({ first, model, rep, dealership }) =>
      `Hi ${first}, I've reworked the numbers on the ${model} as discussed. 📄\n\n` +
      `I've applied the best I can do on price along with the running offers.\n\n` +
      `Shall I take you through it on a quick call?\n\n— ${rep}, ${dealership}`,
  },
  nudge: {
    title: "Gentle check-in", brief: "Re-open a conversation that went quiet",
    Icon: MessageCircle, tone: "#6D28D9",
    build: ({ first, model, rep, dealership }) =>
      `Hi ${first}, hope you're doing well! 🙂\n\n` +
      `Just checking in on the ${model} — is there anything still open that I can help with?\n\n` +
      `No rush at all, happy to help whenever you're ready.\n\n— ${rep}, ${dealership}`,
  },
  booking_amount: {
    title: "Request booking amount", brief: "Payment details to block the car",
    Icon: IndianRupee, tone: "#2E7D32",
    build: ({ first, model, rep, dealership }) =>
      `Hi ${first}, to block your ${model} I'll need the booking amount. 🚗\n\n` +
      `Once received, I'll confirm your allotment and share the expected delivery date.\n\n` +
      `Shall I send the payment details?\n\n— ${rep}, ${dealership}`,
  },
  documents: {
    title: "Document checklist", brief: "What's needed for finance / registration",
    Icon: ClipboardList, tone: "#6D28D9",
    build: ({ first, rep, dealership }) =>
      `Hi ${first}, sharing the documents we'll need to move ahead: 📋\n\n` +
      `• Aadhaar & PAN\n• Address proof\n• Passport-size photo\n• Bank statements (if opting for finance)\n\n` +
      `You can send photos right here on WhatsApp.\n\n— ${rep}, ${dealership}`,
  },
  delivery_update: {
    title: "Delivery update", brief: "Where the car is and what's next",
    Icon: Package, tone: "#2E7D32",
    build: ({ first, model, rep, dealership }) =>
      `Hi ${first}, an update on your ${model}. 🎉\n\n` +
      `We're preparing everything for your delivery. I'll confirm the exact slot shortly.\n\n` +
      `Anything you'd like arranged on the day — accessories, photos?\n\n— ${rep}, ${dealership}`,
  },
  psf: {
    title: "Post-delivery check-in", brief: "How the car is treating them",
    Icon: Heart, tone: "#2E7D32",
    build: ({ first, model, rep, dealership }) =>
      `Hi ${first}, congratulations again on your ${model}! 🎉\n\n` +
      `How has the first drive been? Any questions on features or the first service?\n\n` +
      `I'm always here on this number.\n\n— ${rep}, ${dealership}`,
  },
  referral: {
    title: "Ask for a referral", brief: "Friends or family in the market",
    Icon: Users, tone: "#6D28D9",
    build: ({ first, rep, dealership }) =>
      `Hi ${first}, hope you're enjoying the new car! 😊\n\n` +
      `If any friend or family member is looking at a new car, do point them my way — I'll personally make sure they're looked after.\n\n— ${rep}, ${dealership}`,
  },
  reengage: {
    title: "Re-open the conversation", brief: "New offer for a cold lead",
    Icon: RefreshCw, tone: "#6D28D9",
    build: ({ first, model, rep, dealership }) =>
      `Hi ${first}, it's been a while since we spoke about the ${model}. 🙂\n\n` +
      `There are some new offers running this month that are noticeably better than before.\n\n` +
      `Would you like me to share the latest pricing?\n\n— ${rep}, ${dealership}`,
  },
};

// Picks the three most useful openers for where this lead actually stands.
function waTemplatesFor(lead) {
  const tdDone = (lead.timeline || []).some(t => t.type === "test-drive");
  const tdScheduled = !!lead.testDrive?.date && !tdDone;
  const stage = lead.stage;

  let ids;
  if (stage === "Lost" || lead.bucket === "nurture")      ids = ["reengage", "nudge", "quote"];
  else if (stage === "Delivered" || stage === "Retailed") ids = ["psf", "referral", "nudge"];
  else if (stage === "Booking")                            ids = ["delivery_update", "documents", "booking_amount"];
  else if (stage === "Opportunity")                        ids = ["revised_quote", "booking_amount", "nudge"];
  else if (tdScheduled)                                    ids = ["td_confirm", "quote", "nudge"];
  else if (tdDone)                                         ids = ["td_feedback", "revised_quote", "booking_amount"];
  else if (stage === "New")                                ids = ["intro", "quote", "testdrive"];
  else                                                     ids = ["quote", "testdrive", "nudge"];

  return ids.map(id => ({ id, ...WA_LIB[id] }));
}

function WhatsAppTemplateSheet({ lead, user, onSend, onClose }) {
  const [openId, setOpenId] = useState(null);
  const [drafts, setDrafts] = useState({});
  const templates = waTemplatesFor(lead);

  const vars = {
    first: (lead.name || "there").split(" ")[0],
    model: lead.model || "the car",
    variant: lead.variant || "",
    rep: (user?.name || "your sales executive").split(" ")[0],
    dealership: user?.branch ? user.branch.replace(" Showroom", "") + " Hyundai" : "Autoprism Hyundai",
  };
  const textFor = (t) => drafts[t.id] !== undefined ? drafts[t.id] : t.build(vars);

  return (
    <BottomSheet title={`Message ${vars.first} on WhatsApp`} onClose={onClose}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 12 }}>
        <span style={{ flex: 1, fontFamily: F, fontSize: 11, color: C.sub, lineHeight: 1.4 }}>
          Pick an opener — tap to see and edit the full message before sending.
        </span>
        {/* Voice call over WhatsApp — the other thing this button could mean. */}
        <button type="button" onClick={() => {
          try { window.open(`https://wa.me/${(lead.phone || "").replace(/[^0-9]/g, "")}`, "_blank", "noopener"); } catch (e) {}
        }} style={{
          flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 4,
          background: "none", border: "none", padding: 0, cursor: "pointer",
          fontFamily: F, fontSize: 11.5, fontWeight: 700, color: C.green,
        }}>
          <Phone size={12} /> WhatsApp call instead
        </button>
      </div>

      {templates.map(t => {
        const open = openId === t.id;
        const text = textFor(t);
        return (
          <div key={t.id} style={{
            border: `1.5px solid ${open ? t.tone : C.border}`, borderRadius: 12,
            marginBottom: 8, overflow: "hidden", background: C.card,
          }}>
            <button onClick={() => setOpenId(open ? null : t.id)} style={{
              display: "flex", alignItems: "center", gap: 10, width: "100%",
              padding: "11px 12px", background: "none", border: "none", cursor: "pointer", textAlign: "left",
            }}>
              <span style={{
                width: 32, height: 32, borderRadius: 9, background: t.tone, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}><t.Icon size={15} color="#fff" /></span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontFamily: F, fontSize: 12.5, fontWeight: 700, color: C.ink }}>{t.title}</span>
                <span style={{ display: "block", fontFamily: F, fontSize: 10.5, color: C.faint, marginTop: 1 }}>{t.brief}</span>
              </span>
              <ChevronDown size={15} color={C.faint} style={{ flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform .18s" }} />
            </button>

            {open && (
              <div style={{ padding: "0 12px 12px" }}>
                <textarea
                  value={text}
                  onChange={e => setDrafts(d => ({ ...d, [t.id]: e.target.value }))}
                  rows={7}
                  style={{
                    width: "100%", boxSizing: "border-box", border: `1px solid ${C.border}`, borderRadius: 9,
                    padding: "9px 10px", fontFamily: F, fontSize: 11.5, color: C.ink, background: C.bg,
                    outline: "none", resize: "vertical", lineHeight: 1.5,
                  }} />
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                  <button onClick={() => setDrafts(d => { const n = { ...d }; delete n[t.id]; return n; })}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: F, fontSize: 10.5, fontWeight: 700, color: C.faint }}>
                    Reset
                  </button>
                  <button onClick={() => onSend(text)} style={{
                    display: "flex", alignItems: "center", gap: 6, background: "#25D366", color: "#fff",
                    border: "none", borderRadius: 9, padding: "9px 16px", cursor: "pointer",
                    fontFamily: F, fontWeight: 800, fontSize: 12.5,
                  }}>
                    <WhatsAppIcon size={14} color="#fff" />Send
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      <button onClick={() => onSend("")} style={{
        width: "100%", background: "none", border: `1px dashed ${C.borderStrong}`, borderRadius: 11,
        padding: "11px 0", fontFamily: F, fontSize: 12, fontWeight: 700, color: C.sub, cursor: "pointer", marginTop: 2,
      }}>Write my own message</button>
    </BottomSheet>
  );
}


// Model/variant vocabulary for the inventory screen, derived from INVENTORY above.
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

// Stable hash so generated inventory is identical across renders.
function hashStr(str) {
  let h = 0;
  for (let i = 0; i < String(str).length; i++) h = (h * 31 + String(str).charCodeAt(i)) | 0;
  return Math.abs(h);
}
function genActivityId() { return `act_${Date.now()}_${Math.floor(Math.random() * 1000)}`; }

const EV_MODELS = ["Ioniq 5"];
const isEV = (model) => EV_MODELS.includes(model);

// Waiting period when nothing is in stock or in transit for a combination. Real dealerships
// quote these off the OEM allocation cycle; here they're per-model so a rep can still give
// the customer an honest answer instead of "let me check".
const WAITING_WEEKS = { "Creta": 6, "Alcazar": 8, "Tucson": 10, "Ioniq 5": 12, "Venue": 4, "Verna": 5, "Exter": 3, "i20": 4 };

const UNIT_STATUS = {
  in_stock:   { label: "In Stock",   color: C.green,  soft: C.greenSoft },
  in_transit: { label: "In Transit", color: C.cold,   soft: C.coldSoft },
  blocked:    { label: "Blocked",    color: C.purple, soft: "#F3EEFF" },
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

          <CommissionBreakup model={unit.model} />

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
                  {unit.blockedFor.at ? ` · ${fmt(new Date(unit.blockedFor.at))}` : ""}
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
            }}><Package size={12} />Mark arrived at branch</button>
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
          Added by {entry.by} · {fmt(new Date(entry.at))}
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

function InventoryScreen({ leads, showToast, onUpdateLead, currentUser, releasedUnitId, canAllocate = true, subView }) {
  const [category, setCategory] = useState("new");
  const [units, setUnits] = useState(() => [...buildInventoryUnits(), ...DEMO_USED_UNITS]);
  const [openModel, setOpenModel] = useState(null);
  const [openVariant, setOpenVariant] = useState(null);
  const [openColor, setOpenColor] = useState(null);
  const [blockingUnit, setBlockingUnit] = useState(null);
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

  // A lead elsewhere in the app cancelled or was lost while holding this car.
  useEffect(() => {
    if (!releasedUnitId) return;
    const unit = units.find(u => u.id === releasedUnitId.id);
    if (unit && unit.blockedFor) releaseAndCascade(unit, "Booking cancelled");
  }, [releasedUnitId]);

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



  const CATEGORIES = [
    { key: "new",  label: "New Cars" },
    { key: "used", label: "Pre-owned" },
  ];

  // The menu sub-item decides what this screen opens on.
  useEffect(() => {
    if (subView === "new") setCategory("new");
    if (subView === "preowned") { setCategory("used"); setPreKind("used"); }
    if (subView === "demo")     { setCategory("used"); setPreKind("demo"); }
    if (subView === "block")    setCategory("new");
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

      {canAllocate && myAllotments.map(a => (
        <AllotmentBanner key={a.id} allotment={a} onAccept={acceptAllotment} onDecline={setDecliningAllotment} />
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
              showToast={showToast} onBlock={setBlockingUnit} onRelease={doRelease} onAddPhotos={setAddingPhotos} />
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
                        {canAllocate && <CommissionChip model={model} compact />}
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
                                    {cUnits.filter(u => u.status === "in_stock" && !u.blockedFor).length === 0 && (
                                      <WaitlistPanel model={model} variant={variant} color={color}
                                        entries={waitFor(model, variant, color)} currentUser={currentUser}
                                        waitWeeks={WAITING_WEEKS[model] || 6} canAct={canAllocate}
                                        onJoin={setJoiningWait} />
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
        <BlockUnitSheet unit={{ ...joiningWait, vin: "— not yet allotted —" }} leads={leads} waitlistMode
          onClose={() => setJoiningWait(null)} onConfirm={(u, lead) => joinWaitlist(joiningWait, lead)} />
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

function LeadCard({ lead, onOpen, onCall, onWhatsApp, onLogCall, onLogWhatsApp }) {
  const [callExpanded, setCallExpanded] = useState(false);
  const [waExpanded, setWaExpanded] = useState(false);
  // null until the rep picks call vs message; then the same call form opens.
  const [waMode, setWaMode] = useState(null);
  const chTones = callWaTones(lead);
  const bucket = BUCKET_META[lead.bucket];
  const urgencyColor = bucket?.color || C.faint;

  return (
    <div onClick={() => onOpen(lead.id)} style={{
      background: C.card, borderRadius: 16, overflow: "hidden",
      marginBottom: 8, cursor: "pointer",
      boxShadow: "0 1px 2px rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.06)",
      transition: "box-shadow 0.15s ease",
    }}>
      <div style={{ display: "flex" }}>
        {/* Left urgency bar — the pre-attentive scan signal */}
        <div style={{ width: 4, background: urgencyColor, flexShrink: 0, minHeight: 88 }} />

        <div style={{ flex: 1, padding: "12px 12px 12px 14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            {/* Left: name, stage, model */}
            <div style={{ flex: 1, minWidth: 0, paddingRight: 12 }}>
              <span style={{ fontFamily: F, fontWeight: 800, fontSize: 17, color: C.ink, letterSpacing: -0.4, lineHeight: 1.15, display: "block" }}>{lead.name}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                <StageBadge stage={lead.stage} />
                {lead.labels.filter(l => SIGNALS.includes(l)).map(label => {
                  const ls = labelStyle(label);
                  return <Badge key={label} color={ls.color} soft={ls.soft}>{label}</Badge>;
                })}
                {lead.commPref && (() => {
                  const cp = commPrefMeta(lead.commPref);
                  return <Badge color={C.ink} soft={C.bg}><cp.Icon size={9} />{cp.label}</Badge>;
                })()}
                {lead.escalation && (
                  <span style={{ fontFamily: F, fontSize: 10, fontWeight: 700, color: C.hot, letterSpacing: 0.4, textTransform: "uppercase" }}>↑ Escalated</span>
                )}
              </div>
              <div style={{ fontFamily: F, fontSize: 12, fontWeight: 500, color: C.faint, marginTop: 5, letterSpacing: 0.1 }}>
                {lead.model} · {lead.variant}
              </div>
            </div>
            {/* Right: ArcRing — the propensity signal */}
            <ArcRing value={lead.propensity} size={44} />
          </div>

          {/* Next action — the most actionable text on the card */}
          {lead.nextAction && (
            <div style={{ fontFamily: F, fontSize: 12, fontWeight: 600, color: C.sub, marginTop: 10, lineHeight: 1.4, paddingLeft: 0 }}>
              → {lead.nextAction}
            </div>
          )}

          {/* Action row — icon-only buttons, bottom-right thumb zone */}
          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 8, marginTop: 12 }}>
            {lead.followUp?.window && (
              <span style={{ fontFamily: F, fontSize: 10.5, fontWeight: 600, color: C.warm, flex: 1 }}>
                Best: {CALL_WINDOWS.find(w => w.key === lead.followUp.window)?.label}
              </span>
            )}
            <IconBtn icon={Phone} label="Call" tone={chTones.call === "call" ? "call" : "default"} iconOnly onClick={e => { onCall(lead); setCallExpanded(v => !v); setWaExpanded(false); }} />
            <IconBtn icon={WhatsAppIcon} label="WhatsApp" tone={chTones.whatsapp === "prominent" ? "whatsapp" : "default"} iconOnly onClick={e => { onWhatsApp(lead); setWaExpanded(v => !v); setWaMode(null); setCallExpanded(false); }} />
          </div>

          {callExpanded && (
            <div style={{ marginTop: 12, borderTop: `1px solid ${C.bg}`, paddingTop: 12 }}>
              <CallLogForm lead={lead} onCancel={() => setCallExpanded(false)} onSubmit={payload => { onLogCall(lead.id, payload); setCallExpanded(false); }} />
            </div>
          )}
          {waExpanded && (
            <div style={{ marginTop: 12, borderTop: `1px solid ${C.bg}`, paddingTop: 12 }}>
              {!waMode ? (
                <WhatsAppModePicker lead={lead} onCancel={() => setWaExpanded(false)} onPick={setWaMode} />
              ) : (
                /* Same form as a phone call — only the channel differs. */
                <CallLogForm lead={lead} channel={waMode}
                  onCancel={() => { setWaExpanded(false); setWaMode(null); }}
                  onSubmit={payload => { onLogWhatsApp(lead.id, { ...payload, channel: waMode }); setWaExpanded(false); setWaMode(null); }} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================== TODAY'S QUEUE ROWS ============================== */
function CallQueueRow({ lead, rank, onOpen, onCall, onWhatsApp, onLogCall }) {
  const [expanded, setExpanded] = useState(false);
  const chTones = callWaTones(lead);
  return (
    <div onClick={() => onOpen(lead.id)} style={{
      display: "flex", gap: 10, background: C.card, borderRadius: 14,
      border: `1px solid ${C.border}`, padding: 12, marginBottom: 9, cursor: "pointer"
    }}>
      <div style={{
        width: 22, height: 22, borderRadius: "50%", background: C.primaryDark, color: "#fff",
        fontFamily: F, fontWeight: 800, fontSize: 11, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1
      }}>{rank}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
          <span style={{ fontFamily: F, fontWeight: 700, fontSize: 13.5, color: C.ink, display: "flex", alignItems: "center", gap: 6 }}>
            {lead.name}
            {lead.labels.includes("Exchange") && (
              <Badge color={exchangeStatusColor(lead).color} soft={exchangeStatusColor(lead).soft}>Exchange</Badge>
            )}
          </span>
          <BucketBadge bucket={lead.bucket} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
          <span style={{ fontFamily: F, fontSize: 11.5, color: C.sub }}>
            {lead.model} · {lead.variant}
          </span>
          <PropensityTag value={lead.propensity} />
        </div>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 4, marginTop: 6 }}>
          <PulseSignal size={12} color={C.primary} style={{ flexShrink: 0, marginTop: 1.5 }} />
          <span style={{ fontFamily: F, fontSize: 11.5, color: C.primaryDark, fontWeight: 600, lineHeight: 1.3 }}>
            {lead.nextAction}
          </span>
        </div>
        {lead.followUp?.window && (
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 5 }}>
            <Clock size={11} color={C.warm} />
            <span style={{ fontFamily: F, fontSize: 10.5, color: C.warm, fontWeight: 700 }}>
              Best time: {CALL_WINDOWS.find(w => w.key === lead.followUp.window)?.label}
            </span>
          </div>
        )}
        <div style={{ display: "flex", gap: 7, marginTop: 9 }}>
          <IconBtn icon={Phone} label="Call" tone={chTones.call} onClick={() => { onCall(lead); setExpanded(true); }} />
          <IconBtn icon={WhatsAppIcon} label="WhatsApp" tone={chTones.whatsapp} onClick={() => onWhatsApp(lead)} />
        </div>
        {expanded && (
          <CallLogForm
            lead={lead}
            onCancel={() => setExpanded(false)}
            onSubmit={payload => { onLogCall(lead.id, payload); setExpanded(false); }}
          />
        )}
      </div>
    </div>
  );
}

function TestDriveQueueRow({ lead, onOpen, onCall, onWhatsApp }) {
  const td = lead.testDrive;
  const dirUrl = directionsUrl(td.location);
  const chTones = callWaTones(lead);
  return (
    <div onClick={() => onOpen(lead.id)} style={{
      background: C.card, borderRadius: 16, padding: 13, marginBottom: 10, cursor: "pointer", boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.05)"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{ fontFamily: F, fontWeight: 700, fontSize: 13.5, color: C.ink }}>{lead.name}</span>
        <Badge color={C.purple} soft={C.purpleSoft}>{td.mode === "location" ? "Customer's Location" : "Showroom"}</Badge>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
        <span style={{ fontFamily: F, fontSize: 11.5, color: C.sub }}>{lead.model} · {lead.variant}</span>
        <PropensityTag value={lead.propensity} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 6 }}>
        <Clock size={12} color={C.primary} />
        <span style={{ fontFamily: F, fontSize: 12, fontWeight: 700, color: C.primaryDark }}>{fmtTime(td.time)}</span>
        {td.location?.text && (
          <span style={{ fontFamily: F, fontSize: 11, color: C.sub }}>· {td.location.text}</span>
        )}
      </div>
      <div style={{ display: "flex", gap: 7, marginTop: 9 }}>
        <IconBtn icon={Phone} label="Call" tone={chTones.call} onClick={() => onCall(lead)} />
        <IconBtn icon={WhatsAppIcon} label="WhatsApp" tone={chTones.whatsapp} onClick={() => onWhatsApp(lead)} />
        {dirUrl && <IconBtn icon={Navigation} label="Directions" onClick={() => window.open(dirUrl, "_blank")} />}
      </div>
    </div>
  );
}

function DeliveryQueueRow({ lead, onOpen, onCall, onWhatsApp }) {
  const du = daysUntil(lead.expectedDeliveryDate);
  const chTones = callWaTones(lead);
  return (
    <div onClick={() => onOpen(lead.id)} style={{
      background: C.card, borderRadius: 16, padding: 13, marginBottom: 10, cursor: "pointer", boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.05)"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{ fontFamily: F, fontWeight: 700, fontSize: 13.5, color: C.ink }}>{lead.name}</span>
        <Badge color={C.green} soft={C.greenSoft}>{du === 0 ? "Today" : `In ${du}d`}</Badge>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
        <span style={{ fontFamily: F, fontSize: 11.5, color: C.sub }}>{lead.model} · {lead.variant}</span>
        <PropensityTag value={lead.propensity} />
      </div>
      <div style={{ fontFamily: F, fontSize: 11, color: C.faint, marginTop: 4 }}>
        Expected delivery — {fmt(lead.expectedDeliveryDate)}
      </div>
      <div style={{ display: "flex", gap: 7, marginTop: 9 }}>
        <IconBtn icon={Phone} label="Call" tone={chTones.call} onClick={() => onCall(lead)} />
        <IconBtn icon={WhatsAppIcon} label="WhatsApp" tone={chTones.whatsapp} onClick={() => onWhatsApp(lead)} />
      </div>
    </div>
  );
}

/* ============================== MIS REPORT ============================== */
function MISReport({ leads, user }) {
  const [period, setPeriod] = useState("day");
  const [copied, setCopied] = useState(false);
  const periodDays = { day: 1, week: 7, month: 30 }[period];
  const periodLabel = { day: "Today", week: "This Week", month: "This Month" }[period];

  const inPeriod = (dt) => !!dt && daysAgo(dt) >= 0 && daysAgo(dt) < periodDays;

  const callsMade = leads.reduce((sum, l) => sum + l.timeline.filter(t => t.type === "call" && inPeriod(t.date)).length, 0);
  const testDrivesDone = leads.reduce((sum, l) => sum + l.timeline.filter(t => t.type === "test-drive" && inPeriod(t.date)).length, 0);
  const bookingsMade = leads.reduce((sum, l) => sum + l.timeline.filter(t => t.type === "booking" && inPeriod(t.date)).length, 0);
  const deliveriesDone = leads.reduce((sum, l) => sum + l.timeline.filter(t => t.type === "delivery" && inPeriod(t.date)).length, 0);
  const newLeads = leads.filter(l => inPeriod(l.created)).length;
  const totalLeads = leads.length;
  const closedLeads = leads.filter(l => ["Booking", "Retailed", "Delivered"].includes(l.stage)).length;
  const conversion = totalLeads ? Math.round((closedLeads / totalLeads) * 100) : 0;

  const stats = [
    { label: "Calls Made", value: callsMade, icon: Phone },
    { label: "Test Drives", value: testDrivesDone, icon: Car },
    { label: "Bookings", value: bookingsMade, icon: Package },
    { label: "Deliveries", value: deliveriesDone, icon: CarFront },
    { label: "New Leads", value: newLeads, icon: UserPlus },
    { label: "Conversion", value: `${conversion}%`, icon: BarChart3 },
  ];

  const handleShare = async () => {
    const text = `MIS Report — ${user.name} (${periodLabel})\n` + stats.map(s => `${s.label}: ${s.value}`).join("\n");
    try { await navigator.clipboard.writeText(text); } catch (e) { /* clipboard unavailable — report is still visible on screen */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 14, background: C.border, borderRadius: 12, padding: 3 }}>
        {["day", "week", "month"].map(p => (
          <button key={p} onClick={() => setPeriod(p)} style={{
            flex: 1, padding: "7px 4px", borderRadius: 9, border: "none", cursor: "pointer",
            background: period === p ? C.card : "none",
            fontFamily: F, fontSize: 11.5, fontWeight: 700,
            color: period === p ? C.primary : C.sub,
            boxShadow: period === p ? "0 1px 3px rgba(0,0,0,.08)" : "none"
          }}>{p[0].toUpperCase() + p.slice(1)}</button>
        ))}
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14, marginBottom: 12 }}>
        <div style={{ fontFamily: F, fontWeight: 700, fontSize: 14, color: C.ink }}>{user.name}'s Activity</div>
        <div style={{ fontFamily: F, fontSize: 11.5, color: C.sub, marginBottom: 12 }}>{periodLabel} · {fmtFull(today)}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {stats.map(s => (
            <div key={s.label} style={{ background: C.bg, borderRadius: 10, padding: 10 }}>
              <s.icon size={14} color={C.primary} />
              <div style={{ fontFamily: F, fontWeight: 800, fontSize: 17, color: C.ink, marginTop: 6 }}>{s.value}</div>
              <div style={{ fontFamily: F, fontSize: 10.5, color: C.sub, marginTop: 1 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <button onClick={handleShare} style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%",
        background: copied ? C.darkGreen : C.primary, color: "#fff", border: "none", borderRadius: 12,
        padding: "12px 0", fontFamily: F, fontWeight: 700, fontSize: 13, cursor: "pointer",
        boxShadow: "0 2px 6px rgba(0,0,0,.14)"
      }}>
        {copied ? <Check size={15} /> : <Share2 size={15} />}
        {copied ? "Copied — ready to share" : "Copy & Share Report"}
      </button>
    </div>
  );
}

/* ============================== LEADS SCREEN ============================== */
function LeadsScreen({ currentId, leads, onOpenLead, onCall, onWhatsApp, onCounterTap, onLogCall, onLogWhatsApp, onAddLead, showMIS, onCloseMIS, subView }) {
  const lang = useLang();
  const [query, setQuery] = useState("");
  // Typed vs applied — the queue only re-filters when the rep hits Enter.
  const [queryDraft, setQueryDraft] = useState("");
  const runSearch = () => setQuery(queryDraft.trim());
  const clearSearch = () => { setQueryDraft(""); setQuery(""); };
  const section = showMIS ? "mis" : "queue";
  const SUBVIEW_TITLES = { queue: "Call Queue", followups: "Follow-Ups", delivery: "Post-Delivery" }; // All Leads renders its own layout
  const subViewTitle = SUBVIEW_TITLES[subView] || null;
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [leadFilters, setLeadFilters] = useState({ bucket: [], stage: [], source: [], model: [] });
  const [quickFilter, setQuickFilter] = useState(null);
  const [allTab, setAllTab] = useState("all");
  const user = userById(currentId);
  const target = user.target || 6;
  const achieved = user.achieved || 4;

  const toggleLeadFilter = (group, value) => {
    setLeadFilters(f => ({
      ...f,
      [group]: f[group].includes(value) ? f[group].filter(x => x !== value) : [...f[group], value],
    }));
  };
  const activeFilterCount = leadFilters.bucket.length + leadFilters.stage.length + leadFilters.source.length + leadFilters.model.length;
  const hasActiveLeadFilters = activeFilterCount > 0;
  const sourceOptions = [...new Set(leads.map(l => l.source))].sort();
  // Model only — no variant. A rep who wants a specific variant types it in the search bar.
  const modelOptions = [...new Set(leads.map(l => l.model).filter(Boolean))].sort();
  const matchesLeadFilters = (l) => {
    const bucketOk = leadFilters.bucket.length === 0 || leadFilters.bucket.includes(l.bucket);
    const stageOk = leadFilters.stage.length === 0 || leadFilters.stage.includes(l.stage);
    const sourceOk = leadFilters.source.length === 0 || leadFilters.source.includes(l.source);
    const modelOk = leadFilters.model.length === 0 || leadFilters.model.includes(l.model);
    return bucketOk && stageOk && sourceOk && modelOk;
  };

  // Draft state for the sheet — nothing applies until the CTA is tapped.
  const [draftFilters, setDraftFilters] = useState({ stage: [], model: [], source: [], bucket: [] });
  const openFilterSheet = () => {
    setDraftFilters({ stage: leadFilters.stage, model: leadFilters.model, source: leadFilters.source, bucket: leadFilters.bucket });
    setFiltersOpen(true);
  };
  const applyDraftFilters = () => { setLeadFilters({ ...draftFilters }); setFiltersOpen(false); };
  const countFor = (pred) => leads.filter(pred).length;
  const draftResultCount = leads.filter(l => {
    const d = draftFilters;
    if (d.bucket.length && !d.bucket.includes(l.bucket)) return false;
    if (d.stage.length && !d.stage.includes(l.stage)) return false;
    if (d.source.length && !d.source.includes(l.source)) return false;
    if (d.model.length && !d.model.includes(l.model)) return false;
    return true;
  }).length;
  const filterGroups = [
    { key: "stage",  label: "Status", options: STATUS_FILTER_OPTIONS.map(st => ({ key: st, label: st, count: countFor(l => l.stage === st) })) },
    { key: "model",  label: "Model",  options: modelOptions.map(m => ({ key: m, label: m, count: countFor(l => l.model === m) })) },
    { key: "source", label: "Source", options: sourceOptions.map(sv => ({ key: sv, label: sv, count: countFor(l => l.source === sv) })) },
    { key: "bucket", label: "Bucket", options: BUCKET_ORDER.map(bk => ({ key: bk, label: BUCKET_META[bk].label, count: countFor(l => l.bucket === bk) })) },
  ];
  const matchesQuery = (l) => {
    const q = query.toLowerCase();
    if (!q) return true;
    return l.name.toLowerCase().includes(q) || l.model.toLowerCase().includes(q) || l.variant.toLowerCase().includes(q);
  };
  // Tabs double as the counters — one row instead of two. "Calls" is gone: almost every
  // item in the queue is a call, so the tab filtered out almost nothing.
  const isReadyToBook = (l) => l.bucket === "ready" || l.stage === "Booking";
  const matchesQuickFilter = (item) => {
    if (!quickFilter) return true;
    if (quickFilter === "ready") return isReadyToBook(item.lead);
    return item.kind === quickFilter;
  };

  // The menu sub-item narrows the same list. These are views over one queue, not separate
  // screens — "All Leads" is the unfiltered case.
  // followUp is { date: Date, ... } — not a string.
  const followUpDate = (l) => {
    const f = l.followUp;
    if (!f) return null;
    const raw = f.date || f;
    const dt = raw instanceof Date ? raw : new Date(raw);
    return isNaN(dt) ? null : dt;
  };
  // The app runs on a fixed demo "today", so compare against that — not the real clock,
  // which would put every seed follow-up in the past.
  const endOfToday = (() => { const d2 = new Date(today); d2.setHours(23, 59, 59, 999); return d2; })();
  const matchesSubView = (item) => {
    const l = item.lead;
    if (!subView || subView === "all") return true;
    if (subView === "queue") {
      // Due today or already overdue, and not finished.
      if (["Delivered", "Lost"].includes(l.stage)) return false;
      const f = followUpDate(l);
      return !f || f <= endOfToday;
    }
    if (subView === "followups") {
      // A committed next contact still ahead of today.
      const f = followUpDate(l);
      return !!f && f > endOfToday;
    }
    if (subView === "delivery") {
      return ["Delivered", "Retailed", "Booking"].includes(l.stage) || item.kind === "delivery";
    }
    return true;
  };

  const { pinned: rawPinned, timed: rawTimed } = buildDaySchedule(leads);
  const itemFilter = (item) => matchesQuery(item.lead) && matchesLeadFilters(item.lead) && matchesQuickFilter(item) && matchesSubView(item);
  const pinned = rawPinned.filter(itemFilter);
  const timed = rawTimed.filter(itemFilter);

  // "Contacted" = has been engaged at least once (past the New stage) — a broader, more useful
  // read on outreach activity than a strict "Contacted"-stage-only count.
  const counts = Object.fromEntries(COUNTER_LABELS.map(l => [l, filterLeadsByCounter(leads, l).length]));

  return (
    <div style={{ padding: 12 }}>
      {/* ---- Compact command row: search + filter + add lead ---- */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 11, padding: "9px 12px", flex: 1, minWidth: 0 }}>
          <Search size={14} color={C.faint} />
          <input value={queryDraft} onChange={e => setQueryDraft(e.target.value)}
            placeholder="Search name, model, or variant…"
            type="search" inputMode="search" enterKeyHint="search"
            onKeyDown={e => { if (e.key === "Enter") { runSearch(); e.currentTarget.blur(); } }}
            style={{ border: "none", outline: "none", flex: 1, minWidth: 0, fontFamily: F, fontSize: 12.5, color: C.ink, background: "none", WebkitAppearance: "none" }} />
          {(queryDraft || query) && <button onClick={clearSearch} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}><X size={13} color={C.faint} /></button>}
        </div>
        <button onClick={openFilterSheet} style={{
          position: "relative", display: "flex", alignItems: "center", justifyContent: "center", width: 38, height: 38, borderRadius: 11, flexShrink: 0,
          border: `1.5px solid ${hasActiveLeadFilters ? C.primary : C.border}`, background: hasActiveLeadFilters ? C.primarySoft : C.card, cursor: "pointer",
        }}>
          <SlidersHorizontal size={15} color={hasActiveLeadFilters ? C.primary : C.sub} />
          {hasActiveLeadFilters && <span style={{ position: "absolute", top: 6, right: 6, width: 6, height: 6, borderRadius: "50%", background: C.hot }} />}
        </button>
        <button onClick={onAddLead} title="Add Lead" style={{
          display: "flex", alignItems: "center", justifyContent: "center", width: 38, height: 38, borderRadius: 11, flexShrink: 0,
          border: `1.5px solid ${C.ink}`, background: C.ink, cursor: "pointer",
        }}>
          <UserPlus size={16} color="#fff" />
        </button>
      </div>

      {/* Applied filter chips */}
      {hasActiveLeadFilters && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8, alignItems: "center" }}>
          {leadFilters.stage.map(k => <FilterChip key={"st"+k} label={k} onRemove={() => setLeadFilters(f => ({ ...f, stage: f.stage.filter(x => x !== k) }))} />)}
          {leadFilters.model.map(k => <FilterChip key={"m"+k} label={k} onRemove={() => setLeadFilters(f => ({ ...f, model: f.model.filter(x => x !== k) }))} />)}
          {leadFilters.source.map(k => <FilterChip key={"sr"+k} label={k} onRemove={() => setLeadFilters(f => ({ ...f, source: f.source.filter(x => x !== k) }))} />)}
          {leadFilters.bucket.map(k => <FilterChip key={"b"+k} label={BUCKET_META[k].label} onRemove={() => setLeadFilters(f => ({ ...f, bucket: f.bucket.filter(x => x !== k) }))} />)}
          <button onClick={() => setLeadFilters({ bucket: [], stage: [], source: [], model: [] })} style={{
            background: "none", border: "none", cursor: "pointer", fontFamily: F, fontSize: 11.5, fontWeight: 700, color: C.hot, padding: "4px 6px"
          }}>Clear all</button>
        </div>
      )}

      <FilterSheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        groups={filterGroups}
        draft={draftFilters}
        setDraft={setDraftFilters}
        onApply={applyDraftFilters}
        onClearAll={() => setDraftFilters({ stage: [], model: [], source: [], bucket: [] })}
        resultCount={draftResultCount}
      />

      {/* ---- Single-line monthly target (same compact pattern as the telecaller) ---- */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "9px 12px", marginBottom: 8, display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 3, flexShrink: 0 }}>
          <span style={{ fontFamily: F, fontWeight: 900, fontSize: 18, color: achieved >= target ? C.darkGreen : C.ink, letterSpacing: -0.5, lineHeight: 1 }}>{achieved}</span>
          <span style={{ fontFamily: F, fontWeight: 500, fontSize: 11, color: C.ghost }}>/{target}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
            <span style={{ fontFamily: F, fontSize: 9, fontWeight: 700, color: C.sub, textTransform: "uppercase", letterSpacing: 0.6 }}>Cars retailed · this month</span>
            <span style={{ fontFamily: F, fontSize: 10, fontWeight: 700, color: achieved >= target ? C.darkGreen : C.primary }}>
              {achieved >= target ? "Target hit 🎯" : `${target - achieved} more to go`}
            </span>
          </div>
          <div style={{ height: 4, background: C.bg, borderRadius: 999, overflow: "hidden" }}>
            <div style={{ width: `${Math.min(100, (achieved / target) * 100)}%`, height: "100%", background: achieved >= target ? C.darkGreen : C.primary, borderRadius: 999, transition: "width .5s" }} />
          </div>
        </div>
      </div>

      {subView === "all" ? (
        /* All Leads is a browse view, not a work queue — a flat list of everyone, with the
           highest-intent stages as quick tabs. Lost sits in its own tab so it is reachable
           without cluttering the live pipeline. */
        (() => {
          const TABS = [
            { key: "all",     label: "All",           match: (l) => l.stage !== "Lost" },
            { key: "ready",   label: "Ready to Book", match: (l) => l.bucket === "ready" || l.stage === "Booking" },
            { key: "oppty",   label: "Opportunity",   match: (l) => ["Opportunity", "Test Drive"].includes(l.stage) },
            { key: "lost",    label: "Lost",          match: (l) => l.stage === "Lost" },
          ];
          const active = allTab || "all";
          const tab = TABS.find(x => x.key === active) || TABS[0];
          const rows = leads.filter(l => tab.match(l) && matchesQuery(l) && matchesLeadFilters(l));
          return (
            <>
              <div style={{ display: "flex", gap: 5, marginBottom: 11 }}>
                {TABS.map(x => {
                  const on = active === x.key;
                  const n = leads.filter(l => x.match(l) && matchesQuery(l) && matchesLeadFilters(l)).length;
                  return (
                    <button key={x.key} onClick={() => setAllTab(x.key)} style={{
                      flex: 1, padding: "8px 3px", borderRadius: 9, cursor: "pointer",
                      border: `1.5px solid ${on ? C.primary : C.border}`,
                      background: on ? C.primarySoft : C.card,
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 1,
                    }}>
                      <span style={{ fontFamily: F, fontSize: 13, fontWeight: 800,
                        color: on ? C.primary : C.ink, lineHeight: 1 }}>{n}</span>
                      <span style={{ fontFamily: F, fontSize: 8.5, fontWeight: 700,
                        color: on ? C.primary : C.faint, textTransform: "uppercase",
                        letterSpacing: 0.3, whiteSpace: "nowrap" }}>{x.label}</span>
                    </button>
                  );
                })}
              </div>
              {rows.length === 0 ? (
                <div style={{ textAlign: "center", padding: "30px 10px", color: C.faint,
                  fontFamily: F, fontSize: 13 }}>No leads in this tab.</div>
              ) : rows.map(lead => (
                <LeadCard key={lead.id} lead={lead} onOpen={onOpenLead} onCall={onCall}
                  onWhatsApp={onWhatsApp} onLogCall={onLogCall} onLogWhatsApp={onLogWhatsApp} />
              ))}
            </>
          );
        })()
      ) : section === "mis" ? (
        <>
          <button onClick={onCloseMIS} style={{
            display: "flex", alignItems: "center", gap: 5, background: "none", border: "none",
            cursor: "pointer", padding: "0 0 10px", fontFamily: F, fontSize: 12, fontWeight: 700, color: C.primary,
          }}><ChevronLeft size={14} />Back to queue</button>
          <MISReport leads={leads} user={user} />
        </>
      ) : (
        <>
          {/* Quick preset filters — fast access to the three things reps filter by most */}
          {/* Tabs carry their own counts, so the separate counter strip is no longer needed.
              Labelled "Today" because these are today's items, not month-to-date — without it
              the counts read as if they belong to the monthly target bar directly above. */}
          {/* When a menu sub-view is active, say so — otherwise a filtered list reads as
              missing data rather than a deliberate view. */}
          {subViewTitle && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.primarySoft,
              borderRadius: 9, padding: "8px 11px", margin: "10px 0 8px" }}>
              <span style={{ flex: 1, fontFamily: F, fontSize: 11.5, fontWeight: 700, color: C.primary }}>
                {subViewTitle}
              </span>
              <span style={{ fontFamily: F, fontSize: 10.5, color: C.primary, opacity: 0.8 }}>
                filtered view
              </span>
            </div>
          )}
          <div style={{ display: "flex", alignItems: "baseline", gap: 5, margin: "10px 0 6px" }}>
            <span style={{ fontFamily: F, fontSize: 10, fontWeight: 800, color: C.ink, textTransform: "uppercase", letterSpacing: 0.7 }}>Today</span>
            <span style={{ fontFamily: F, fontSize: 10, color: C.faint }}>· due now</span>
          </div>
          <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
            {(() => {
              const all = [...rawPinned, ...rawTimed];
              const tabs = [
                { key: null,          label: "All",          n: all.length },
                { key: "ready",       label: "Ready to Book",n: all.filter(i => isReadyToBook(i.lead)).length },
                { key: "test-drive",  label: "Test Drive",   n: all.filter(i => i.kind === "test-drive").length },
                { key: "delivery",    label: "Delivery",     n: all.filter(i => i.kind === "delivery").length },
              ];
              return tabs.map(t => {
                const on = quickFilter === t.key;
                return (
                  <button key={t.label} onClick={() => setQuickFilter(t.key)} style={{
                    flex: 1, padding: "7px 4px", borderRadius: 9, cursor: "pointer",
                    border: `1.5px solid ${on ? C.primary : C.border}`,
                    background: on ? C.primarySoft : C.card,
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 1,
                  }}>
                    <span style={{ fontFamily: F, fontSize: 13, fontWeight: 800, color: on ? C.primary : C.ink, lineHeight: 1 }}>{t.n}</span>
                    <span style={{ fontFamily: F, fontSize: 8.5, fontWeight: 700, color: on ? C.primary : C.faint, textTransform: "uppercase", letterSpacing: 0.3, whiteSpace: "nowrap" }}>{t.label}</span>
                  </button>
                );
              });
            })()}
          </div>



          {pinned.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <Flag size={13} color={C.hot} fill={C.hot} />
                <span style={{ fontFamily: F, fontWeight: 800, fontSize: 13, color: C.ink }}>{t("Do These First", lang)}</span>
                <Badge color={C.hot} soft={C.hotSoft}>{pinned.length}</Badge>
              </div>
              {pinned.map(item => (
                <LeadCard key={item.lead.id} lead={item.lead} onOpen={onOpenLead} onCall={onCall} onWhatsApp={onWhatsApp} onLogCall={onLogCall} onLogWhatsApp={onLogWhatsApp} />
              ))}
            </div>
          )}

          {timed.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <Clock size={13} color={C.primary} />
                <span style={{ fontFamily: F, fontWeight: 800, fontSize: 13, color: C.ink }}>{t("Today's Schedule", lang)}</span>
                <Badge color={C.primary} soft={C.primarySoft}>{timed.length}</Badge>
              </div>
              {timed.map(item => (
                <LeadCard key={item.lead.id} lead={item.lead} onOpen={onOpenLead} onCall={onCall} onWhatsApp={onWhatsApp} onLogCall={onLogCall} onLogWhatsApp={onLogWhatsApp} />
              ))}
            </div>
          )}

          {pinned.length === 0 && timed.length === 0 && (
            <div style={{ textAlign: "center", padding: "30px 10px", color: C.faint, fontFamily: F, fontSize: 13 }}>
              {query || hasActiveLeadFilters || quickFilter ? "No matching items." : "Nothing needs your attention right now — nice work! 🎉"}
            </div>
          )}

          {/* Rest of pipeline — leads not in today's queue, always visible so nothing feels hidden */}
          {(() => {
            const queuedIds = new Set([...pinned, ...timed].map(i => i.lead.id));
            // This section repeats the same list, so it needs the same sub-view filter —
            // without it, a filtered view still showed every lead underneath.
            const rest = leads.filter(l =>
              !queuedIds.has(l.id) &&
              (subView === "delivery" ? l.stage !== "Lost" : !["Delivered", "Lost"].includes(l.stage)) &&
              matchesQuery(l) && matchesLeadFilters(l) &&
              matchesSubView({ lead: l, kind: "call" })
            );
            if (!rest.length) return null;
            return (
              <div style={{ marginTop: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <span style={{ fontFamily: F, fontWeight: 800, fontSize: 13, color: C.ink }}>{subViewTitle || "All Leads"}</span>
                  <Badge color={C.sub} soft={C.bg}>{rest.length}</Badge>
                </div>
                {rest.map(lead => (
                  <LeadCard key={lead.id} lead={lead} onOpen={onOpenLead} onCall={onCall} onWhatsApp={onWhatsApp} onLogCall={onLogCall} onLogWhatsApp={onLogWhatsApp} />
                ))}
              </div>
            );
          })()}
        </>
      )}
    </div>
  );
}

/* ============================== EXCHANGE CARD ============================== */
function ExchangeCard({ lead, onUpdateField, onAddPhoto, onAppraise }) {
  const ex = lead.exchange || { model: "", variant: "", year: "", odometer: "", condition: "", photos: 0, appraisedValue: null };
  const range = exchangeRange(ex.year, ex.odometer, ex.condition);
  const canAppraise = !!(ex.model && ex.variant && ex.year && ex.odometer && ex.condition && range);

  const fieldStyle = {
    width: "100%", border: `1px solid ${C.border}`, borderRadius: 9, padding: "8px 10px",
    fontFamily: F, fontSize: 12.5, color: C.ink, outline: "none",
    background: C.bg, boxSizing: "border-box"
  };
  const labelStyle = { fontFamily: F, fontSize: 10.5, color: C.sub, fontWeight: 600, marginBottom: 4, display: "block" };

  return (
    <div style={{ background: C.card, border: `1px solid ${C.teal}55`, borderRadius: 14, padding: 13, marginBottom: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
        <TradeInIcon size={14} color={C.teal} />
        <span style={{ fontFamily: F, fontWeight: 700, fontSize: 12.5, color: C.ink }}>Exchange Vehicle</span>
        <Badge color={C.teal} soft={C.tealSoft}>Trade-in</Badge>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "9px 4%" }}>
        {[
          ["Car Model", "model", "e.g. Hyundai i10"],
          ["Variant", "variant", "e.g. Magna"],
          ["Year", "year", "e.g. 2016"],
          ["Odometer (km)", "odometer", "e.g. 62000"],
        ].map(([label, field, placeholder]) => (
          <div key={field} style={{ width: "48%" }}>
            <span style={labelStyle}>{label}</span>
            <input
              type="text"
              value={ex[field]}
              placeholder={placeholder}
              onChange={e => onUpdateField(lead.id, field, e.target.value)}
              style={fieldStyle}
            />
          </div>
        ))}
      </div>

      <div style={{ marginTop: 12 }}>
        <span style={labelStyle}>Condition</span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {CONDITION_LEVELS.map(c => {
            const on = ex.condition === c.key;
            return (
              <button key={c.key} onClick={() => onUpdateField(lead.id, "condition", c.key)} style={{
                fontFamily: F, fontSize: 11, fontWeight: 600, padding: "6px 10px", borderRadius: 999,
                border: `1px solid ${on ? C.teal : C.border}`, background: on ? C.tealSoft : "#fff",
                color: on ? C.teal : C.sub, cursor: "pointer"
              }}>
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <span style={labelStyle}>Photos</span>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {Array.from({ length: ex.photos || 0 }).map((_, i) => (
            <div key={i} style={{
              width: 44, height: 44, borderRadius: 9, background: C.primarySoft,
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <Camera size={16} color={C.primary} />
            </div>
          ))}
          <button onClick={() => onAddPhoto(lead.id)} style={{
            width: 44, height: 44, borderRadius: 9, border: `1.5px dashed ${C.border}`,
            background: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer"
          }}>
            <span style={{ fontSize: 17, color: C.faint, fontWeight: 600 }}>+</span>
          </button>
        </div>
      </div>

      <div style={{ marginTop: 13, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: F, fontSize: 11.5, color: C.sub, fontWeight: 600 }}>System Estimate</span>
          <span style={{ fontFamily: F, fontSize: 13.5, fontWeight: 700, color: range ? C.ink : C.faint }}>
            {range ? (range.low === range.high ? `₹${range.low} L` : `₹${range.low}–${range.high} L`) : "Fill in details above"}
          </span>
        </div>
        <div style={{ fontFamily: F, fontSize: 10.5, color: C.faint, marginTop: 2 }}>
          Range reflects one condition grade below to one above what's selected
        </div>

        <div style={{ marginTop: 11, background: ex.appraisedValue ? C.darkGreenSoft : "#FFFBEB", borderRadius: 10, padding: 11 }}>
          {ex.appraisedValue ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <ShieldCheck size={13} color={C.darkGreen} />
                <span style={{ fontFamily: F, fontSize: 10.5, fontWeight: 800, color: C.darkGreen, letterSpacing: .3 }}>
                  FINAL VALUE · APPRAISER CONFIRMED
                </span>
              </div>
              <div style={{ fontFamily: F, fontWeight: 800, fontSize: 19, color: C.ink, marginTop: 4 }}>
                ₹{ex.appraisedValue} L
              </div>
              <div style={{ fontFamily: F, fontSize: 10.5, color: C.sub, marginTop: 3 }}>
                This is the value used for the deal — it supersedes the system estimate above.
              </div>
            </>
          ) : ex.appraisalScheduled ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <Clock size={12} color={C.warm} />
                <span style={{ fontFamily: F, fontSize: 11, fontWeight: 700, color: C.warm }}>
                  Appraiser visit scheduled
                </span>
              </div>
              <div style={{ fontFamily: F, fontSize: 10.5, color: C.sub, marginTop: 3 }}>
                Final value will be confirmed in ~2 days, after inspection.
              </div>
            </>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <Clock size={12} color={C.warm} />
                <span style={{ fontFamily: F, fontSize: 11, fontWeight: 700, color: C.warm }}>
                  Pending appraiser visit
                </span>
              </div>
              <div style={{ fontFamily: F, fontSize: 10.5, color: C.sub, marginTop: 3 }}>
                The final value is only confirmed after physical inspection.
              </div>
              <button disabled={!canAppraise} onClick={() => onAppraise(lead.id)} style={{
                marginTop: 9, width: "100%", padding: "8px 0", borderRadius: 9, border: "none",
                background: canAppraise ? C.primary : "#E2E8F0", color: canAppraise ? "#fff" : C.faint,
                fontFamily: F, fontWeight: 700, fontSize: 11.5,
                cursor: canAppraise ? "pointer" : "default"
              }}>
                Schedule Appraiser Visit
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================== CONTACT CARD (phone + alternate number) ============================== */
function ContactCard({ lead, onUpdateAltPhone, onUpdateCommPref }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(lead.altPhone || "");

  const rowStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0" };
  const labelStyle = { fontFamily: F, fontSize: 12, color: C.sub };
  const valueStyle = { fontFamily: F, fontSize: 12.5, color: C.ink, fontWeight: 600 };

  return (
    <div style={{ background: C.card, borderRadius: 14, padding: 12, marginBottom: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 6px 18px rgba(0,0,0,0.075)" }}>
      <div style={rowStyle}>
        <span style={labelStyle}>Phone</span>
        <span style={valueStyle}>{lead.phone}</span>
      </div>
      <div style={{ ...rowStyle, borderTop: `1px solid ${C.border}` }}>
        <span style={labelStyle}>Alternate Phone</span>
        {editing ? (
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input
              value={val} onChange={e => setVal(e.target.value)} placeholder="Add number" autoFocus
              style={{ ...formInputStyle, width: 130 }}
            />
            <button onClick={() => { onUpdateAltPhone(lead.id, val); setEditing(false); }} style={{
              background: C.primary, color: "#fff", border: "none", borderRadius: 8, padding: "7px 8px", cursor: "pointer", display: "flex"
            }}>
              <Check size={12} />
            </button>
          </div>
        ) : lead.altPhone ? (
          <button onClick={() => setEditing(true)} style={{ ...valueStyle, background: "none", border: "none", cursor: "pointer" }}>
            {lead.altPhone}
          </button>
        ) : (
          <button onClick={() => setEditing(true)} style={{
            display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer",
            fontFamily: F, fontSize: 12, color: C.primary, fontWeight: 700
          }}>
            <Plus size={12} />Add alternate number
          </button>
        )}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "7px 0", borderTop: `1px solid ${C.border}` }}>
        <span style={labelStyle}>Contact Preference</span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, justifyContent: "flex-end", maxWidth: 200 }}>
          {COMM_PREFS.map(cp => {
            const on = lead.commPref === cp.key;
            return (
              <button key={cp.key} onClick={() => onUpdateCommPref(lead.id, on ? null : cp.key)} style={{
                display: "flex", alignItems: "center", gap: 4, padding: "4px 8px", borderRadius: 7,
                border: `1.5px solid ${on ? C.primary : C.border}`, background: on ? C.primarySoft : "none", color: on ? C.primary : C.sub,
                fontFamily: F, fontWeight: 700, fontSize: 10, cursor: "pointer",
              }}>
                <cp.Icon size={10} />{cp.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ============================== STATUS TIMELINE ============================== */
function StatusTimeline({ currentStatus, pendingStatus, onSelect }) {
  const currentIndex = STATUS_ORDER.indexOf(currentStatus);
  return (
    <div style={{ marginBottom: 4 }}>
      {STATUS_ORDER.map((s, i) => {
        const reached = i <= currentIndex;
        const isCurrent = s === currentStatus;
        const isPending = s === pendingStatus;
        return (
          <div key={s} onClick={() => onSelect(s)} style={{ display: "flex", gap: 10, cursor: "pointer" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 16 }}>
              <span style={{
                width: isCurrent || isPending ? 14 : 11, height: isCurrent || isPending ? 14 : 11, borderRadius: "50%", flexShrink: 0,
                background: isPending ? "#fff" : reached ? C.primary : "#fff",
                border: `2px solid ${isPending ? C.warm : reached ? C.primary : C.border}`,
                boxShadow: isCurrent ? `0 0 0 4px ${C.primarySoft}` : isPending ? `0 0 0 4px ${C.warmSoft}` : "none",
                marginTop: 3
              }} />
              {i !== STATUS_ORDER.length - 1 && (
                <span style={{ width: 2, flex: 1, minHeight: 18, background: i < currentIndex ? C.primary : C.border, marginTop: 2 }} />
              )}
            </div>
            <div style={{ paddingBottom: i === STATUS_ORDER.length - 1 ? 2 : 14 }}>
              <span style={{
                fontFamily: F, fontSize: 12.5,
                fontWeight: isCurrent || isPending ? 800 : reached ? 600 : 500,
                color: isPending ? C.warm : isCurrent ? C.primaryDark : reached ? C.ink : C.faint
              }}>
                {s}
              </span>
              {isCurrent && (
                <span style={{
                  marginLeft: 7, fontFamily: F, fontSize: 9.5, fontWeight: 800, color: C.primary,
                  background: C.primarySoft, padding: "2px 7px", borderRadius: 999
                }}>
                  CURRENT
                </span>
              )}
              {isPending && (
                <span style={{
                  marginLeft: 7, fontFamily: F, fontSize: 9.5, fontWeight: 800, color: C.warm,
                  background: C.warmSoft, padding: "2px 7px", borderRadius: 999
                }}>
                  SELECTED
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ============================== QUOTE GENERATION ============================== */
function QuoteForm({ lead, onCancel, onSubmit, onViewQuote }) {
  const variant = INVENTORY.find(v => v.model === lead.model && v.variant === lead.variant);
  const priceLakh = variant?.priceLakh || 12;
  const [selectedAccessories, setSelectedAccessories] = useState([]);
  const [discount, setDiscount] = useState("");
  const [note, setNote] = useState("");
  const [recording, setRecording] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const pastQuotes = lead.timeline.filter(t => t.type === "quote" && t.quoteDetails);

  const accessoriesTotal = selectedAccessories.reduce((sum, key) => {
    const a = ACCESSORY_OPTIONS.find(x => x.key === key);
    return sum + (a?.amount || 0);
  }, 0);
  const breakup = computeQuoteBreakup(priceLakh, parseInt(discount) || 0, accessoriesTotal);
  const toggleAccessory = (key) => setSelectedAccessories(s => s.includes(key) ? s.filter(x => x !== key) : [...s, key]);

  const handleVoice = () => {
    if (recording) return;
    setRecording(true);
    setTimeout(() => {
      const text = MOCK_VOICE_TRANSCRIPTS[Math.floor(Math.random() * MOCK_VOICE_TRANSCRIPTS.length)];
      setNote(prev => prev ? `${prev} ${text}` : text);
      setRecording(false);
    }, 1600);
  };

  return (
    <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px dashed ${C.border}` }} onClick={e => e.stopPropagation()}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontFamily: F, fontSize: 11.5, fontWeight: 700, color: C.ink }}>
          Generate Quote — {lead.model} {lead.variant}
        </span>
        {pastQuotes.length > 0 && (
          <button onClick={() => setHistoryOpen(true)} style={{
            display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", padding: 0
          }}>
            <Clock size={14} color={C.sub} />
            <span style={{ fontFamily: F, fontSize: 10.5, color: C.sub, fontWeight: 700 }}>{pastQuotes.length}</span>
          </button>
        )}
      </div>

      <div style={{ background: C.bg, borderRadius: 10, padding: 10, marginBottom: 10 }}>
        <div style={{ fontFamily: F, fontSize: 9.5, fontWeight: 800, color: C.faint, textTransform: "uppercase", letterSpacing: .4, marginBottom: 6 }}>
          System-calculated
        </div>
        {[
          ["Ex-Showroom Price", breakup.exShowroom],
          ["RTO (Registration)", breakup.rto],
          ["Insurance (1st year)", breakup.insurance],
          ...(breakup.tcs > 0 ? [["TCS", breakup.tcs]] : []),
          ["Handling & Logistics", breakup.handling],
        ].map(([label, amt]) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}>
            <span style={{ fontFamily: F, fontSize: 11, color: C.sub }}>{label}</span>
            <span style={{ fontFamily: F, fontSize: 11, color: C.ink, fontWeight: 600 }}>{formatINR(amt)}</span>
          </div>
        ))}
      </div>

      <div style={{ fontFamily: F, fontSize: 10.5, color: C.sub, fontWeight: 600, marginBottom: 6 }}>Accessories (optional)</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
        {ACCESSORY_OPTIONS.map(a => (
          <button key={a.key} onClick={() => toggleAccessory(a.key)} style={chipStyle(selectedAccessories.includes(a.key), true)}>
            {a.label} (+{formatINR(a.amount)})
          </button>
        ))}
      </div>

      <div style={{ fontFamily: F, fontSize: 10.5, color: C.sub, fontWeight: 600, marginBottom: 6 }}>Discount (₹) — your call</div>
      <input type="number" min="0" step="1000" placeholder="e.g. 15000" value={discount}
        onChange={e => setDiscount(e.target.value)} style={{ ...formInputStyle, width: "100%", marginBottom: 10 }} />

      <div style={{ background: C.primarySoft, borderRadius: 10, padding: 11, marginBottom: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: F, fontSize: 12, fontWeight: 700, color: C.primaryDark }}>On-Road Total</span>
          <span style={{ fontFamily: F, fontWeight: 800, fontSize: 17, color: C.ink }}>{formatINR(breakup.total)}</span>
        </div>
      </div>

      <NoteField value={note} onChange={setNote} recording={recording} onVoiceNote={handleVoice} />

      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <button onClick={onCancel} style={{ flex: 1, ...cancelBtnStyle }}>Cancel</button>
        <button onClick={() => onSubmit({ ...breakup, note })} style={{
          flex: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, ...saveBtnStyle(true)
        }}>
          <Share2 size={13} />Send Quote
        </button>
      </div>

      {historyOpen && (
        <BottomSheet title="Quote History" onClose={() => setHistoryOpen(false)}>
          {pastQuotes.map((q, i) => (
            <button key={i} onClick={() => { onViewQuote(q.quoteDetails); setHistoryOpen(false); }} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", padding: "10px 2px",
              borderBottom: i !== pastQuotes.length - 1 ? `1px solid ${C.border}` : "none",
              background: "none", border: "none", cursor: "pointer", textAlign: "left"
            }}>
              <div>
                <div style={{ fontFamily: F, fontSize: 12.5, fontWeight: 700, color: C.ink }}>{formatINR(q.quoteDetails.total)}</div>
                <div style={{ fontFamily: F, fontSize: 11, color: C.sub, marginTop: 2 }}>{fmtFull(q.date)}</div>
              </div>
              <ChevronRight size={14} color={C.faint} />
            </button>
          ))}
        </BottomSheet>
      )}
    </div>
  );
}

function QuoteDetailSheet({ quote, onClose }) {
  const rows = [
    ["Ex-Showroom Price", quote.exShowroom],
    ["RTO (Registration)", quote.rto],
    ["Insurance (1st year)", quote.insurance],
    ...(quote.tcs > 0 ? [["TCS", quote.tcs]] : []),
    ["Handling & Logistics", quote.handling],
    ...(quote.accessories > 0 ? [["Accessories", quote.accessories]] : []),
  ];
  return (
    <BottomSheet title="Quote Details" onClose={onClose}>
      {rows.map(([label, amt]) => (
        <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderTop: `1px solid ${C.border}` }}>
          <span style={{ fontFamily: F, fontSize: 12, color: C.sub }}>{label}</span>
          <span style={{ fontFamily: F, fontSize: 12.5, color: C.ink, fontWeight: 600 }}>{formatINR(amt)}</span>
        </div>
      ))}
      {quote.discount > 0 && (
        <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderTop: `1px solid ${C.border}` }}>
          <span style={{ fontFamily: F, fontSize: 12, color: C.green, fontWeight: 600 }}>Discount</span>
          <span style={{ fontFamily: F, fontSize: 12.5, color: C.green, fontWeight: 700 }}>-{formatINR(quote.discount)}</span>
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", padding: "11px 0 4px", marginTop: 6, borderTop: `2px solid ${C.ink}` }}>
        <span style={{ fontFamily: F, fontSize: 13, fontWeight: 700, color: C.ink }}>On-Road Total</span>
        <span style={{ fontFamily: F, fontSize: 17, fontWeight: 800, color: C.primary }}>{formatINR(quote.total)}</span>
      </div>
      {quote.note && (
        <div style={{ marginTop: 12, fontFamily: F, fontSize: 12, color: C.sub, background: C.bg, borderRadius: 9, padding: 10 }}>
          {quote.note}
        </div>
      )}
    </BottomSheet>
  );
}

/* ============================== COMPETITOR BATTLE CARD ============================== */
function CompetitorBattleCard({ competitor, ourModel }) {
  const card = COMPETITOR_BATTLE_CARDS[competitor] || COMPETITOR_BATTLE_CARDS["Other"];
  return (
    <div style={{ background: C.primarySoft, border: `1px solid #DBEAFE`, borderRadius: 12, padding: 12, marginTop: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 8 }}>
        <Target size={13} color={C.primaryDark} />
        <span style={{ fontFamily: F, fontWeight: 800, fontSize: 11, color: C.primaryDark, textTransform: "uppercase", letterSpacing: .4 }}>
          Battle Card — vs {competitor}
        </span>
      </div>
      {card.points.map((p, i) => (
        <div key={i} style={{ display: "flex", gap: 7, marginBottom: 7, alignItems: "flex-start" }}>
          <span style={{ fontFamily: F, fontWeight: 800, fontSize: 10, color: C.primary, flexShrink: 0, marginTop: 1.5 }}>{i + 1}</span>
          <span style={{ fontFamily: F, fontSize: 11.5, color: C.primaryDark, lineHeight: 1.4 }}>{p}</span>
        </div>
      ))}
    </div>
  );
}

/* ============================== ESCALATION CARD ============================== */

// Escalation is a rare, deliberate act — it does not need permanent screen real estate.
// Unescalated: a small grey link at the bottom of Deal Details.
// Escalated: a compact one-liner badge inside Deal Details; the full context is in the timeline.
// The form opens inline on tap — reason chips + optional note, then confirm.
function EscalationInline({ lead, onEscalate }) {
  const [formOpen, setFormOpen] = useState(false);
  const [reason, setReason] = useState(null);
  const [note, setNote] = useState("");
  const [recording, setRecording] = useState(false);

  const esc = lead.escalation;
  const nextLevel = !esc ? "tl" : esc.level === "tl" ? "manager" : null;
  const nextLevelLabel = nextLevel === "tl" ? "Team Leader" : "Manager";

  const handleVoice = () => {
    if (recording) return;
    setRecording(true);
    setTimeout(() => {
      const text = MOCK_VOICE_TRANSCRIPTS[Math.floor(Math.random() * MOCK_VOICE_TRANSCRIPTS.length)];
      setNote(prev => prev ? `${prev} ${text}` : text);
      setRecording(false);
    }, 1600);
  };
  const handleSubmit = () => {
    onEscalate(lead.id, { level: nextLevel, reason, note });
    setFormOpen(false); setReason(null); setNote("");
  };

  return (
    <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
      {esc && !formOpen && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: nextLevel ? 8 : 0 }}>
          <AlertCircle size={12} color={C.hot} />
          <span style={{ fontFamily: F, fontSize: 11.5, color: C.hot, fontWeight: 700 }}>
            Escalated to {esc.level === "tl" ? "Team Leader" : "Manager"}
          </span>
          <span style={{ fontFamily: F, fontSize: 10.5, color: C.faint }}>
            · {ESCALATION_REASONS.find(r => r.key === esc.reason)?.label} · {fmt(esc.date)}
          </span>
        </div>
      )}
      {!formOpen && nextLevel && (
        <button onClick={() => setFormOpen(true)} style={{
          display: "flex", alignItems: "center", gap: 5, background: "none", border: "none",
          cursor: "pointer", padding: 0, fontFamily: F,
          fontSize: 11.5, fontWeight: 700, color: C.sub,
        }}>
          <AlertCircle size={12} color={C.faint} />
          {esc ? `Escalate further to Manager` : `Escalate to Team Leader`}
        </button>
      )}
      {formOpen && (
        <div>
          <div style={{ fontFamily: F, fontSize: 11, color: C.sub, fontWeight: 700, marginBottom: 8 }}>
            Escalating to {nextLevelLabel} — pick a reason
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
            {ESCALATION_REASONS.map(r => (
              <button key={r.key} onClick={() => setReason(r.key)} style={chipStyle(reason === r.key, true)}>{r.label}</button>
            ))}
          </div>
          <NoteField value={note} onChange={setNote} recording={recording} onVoiceNote={handleVoice} />
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button onClick={() => { setFormOpen(false); setReason(null); setNote(""); }} style={{ flex: 1, ...cancelBtnStyle }}>Cancel</button>
            <button disabled={!reason} onClick={handleSubmit} style={{ flex: 2, ...saveBtnStyle(!!reason) }}>Confirm Escalation</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================== BOOKING FORM ============================== */
/* ============================== PAYMENT BREAKDOWN (Retail) ============================== */
// Ported from the telecaller app after user feedback there: a booking deposit and the actual
// completed sale are different events, and the full payment picture belongs at the sale
// ("Retail"), not bundled into the deposit or pushed all the way out to physical delivery.
function defaultPaymentBreakdown() {
  return {
    financeAmount: "", financeCompany: "", roi: "", loanTenure: "", cibil: "",
    cashAmount: "",
    dealerInsurance: true, insuranceAmount: "", insuranceCompany: "",
    extendedWarranty: "", carePackage: "",
    addons: [{ id: "rsa", label: "RSA (Road Side Assistance)", amount: "" }],
    accessoriesAmount: "",
  };
}
function paymentBreakdownHasAmount(pd) {
  return (parseFloat(pd.financeAmount) || 0) + (parseFloat(pd.cashAmount) || 0) > 0;
}
function paymentBreakdownTotal(pd) {
  return (parseFloat(pd.financeAmount) || 0) + (parseFloat(pd.cashAmount) || 0);
}
function PaymentBreakdownFields({ value, onChange }) {
  const pd = value;
  const set = (patch) => onChange({ ...pd, ...patch });
  const setAddon = (id, patch) => set({ addons: pd.addons.map(a => a.id === id ? { ...a, ...patch } : a) });
  const removeAddon = (id) => set({ addons: pd.addons.filter(a => a.id !== id) });
  const addAddon = () => set({ addons: [...pd.addons, { id: `addon-${Date.now()}`, label: "", amount: "" }] });
  const smallInput = { ...formInputStyle, padding: "8px 10px", fontSize: 12 };
  const labelStyle = { fontFamily: F, fontSize: 10, color: C.faint, fontWeight: 600, marginBottom: 4, display: "block" };

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 12, width: "100%", boxSizing: "border-box" }}>
      <div style={{ fontFamily: F, fontSize: 10, fontWeight: 800, color: C.faint, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 9 }}>Payment Breakdown</div>

      <div style={{ display: "flex", gap: 8, marginBottom: 9 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={labelStyle}>Finance Amount (₹)</span>
          <input type="number" min="0" value={pd.financeAmount} onChange={e => set({ financeAmount: e.target.value })} placeholder="0" style={{ ...smallInput, width: "100%" }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={labelStyle}>Cash (₹)</span>
          <input type="number" min="0" value={pd.cashAmount} onChange={e => set({ cashAmount: e.target.value })} placeholder="0" style={{ ...smallInput, width: "100%" }} />
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 11, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 120px", minWidth: 0 }}>
          <span style={labelStyle}>Finance Company</span>
          <input value={pd.financeCompany} onChange={e => set({ financeCompany: e.target.value })} placeholder="e.g. HDFC Bank" style={{ ...smallInput, width: "100%" }} />
        </div>
        <div style={{ width: 58, flexShrink: 0 }}>
          <span style={labelStyle}>ROI (%)</span>
          <input type="number" min="0" step="0.1" value={pd.roi} onChange={e => set({ roi: e.target.value })} placeholder="9.5" style={{ ...smallInput, width: "100%", boxSizing: "border-box" }} />
        </div>
        <div style={{ width: 68, flexShrink: 0 }}>
          <span style={labelStyle}>Tenure</span>
          <input type="number" min="0" value={pd.loanTenure} onChange={e => set({ loanTenure: e.target.value })} placeholder="60" style={{ ...smallInput, width: "100%", boxSizing: "border-box" }} />
        </div>
      </div>

      {/* CIBIL sits with the finance fields, and only appears once the deal is actually
          financed. It's optional everywhere except the retail confirmation, where the
          sanction letter is in front of the rep and the number is known. */}
      {(parseFloat(pd.financeAmount) || 0) > 0 && (() => {
        const n = parseInt(pd.cibil, 10);
        const bad = pd.cibil !== "" && !(n >= 300 && n <= 900);
        const band = n >= 750 ? { label: "Excellent", c: C.green }
                   : n >= 700 ? { label: "Good", c: C.green }
                   : n >= 650 ? { label: "Fair", c: C.warm }
                   : n >= 300 ? { label: "Weak — expect a higher rate", c: C.hot } : null;
        return (
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 11 }}>
            <div style={{ width: 96, flexShrink: 0 }}>
              <span style={labelStyle}>CIBIL score</span>
              <input type="number" min="300" max="900" value={pd.cibil}
                onChange={e => set({ cibil: e.target.value })} placeholder="300–900"
                style={{ ...smallInput, width: "100%", boxSizing: "border-box",
                  borderColor: bad ? C.hot : undefined }} />
            </div>
            <div style={{ flex: 1, minWidth: 0, paddingTop: 17 }}>
              {bad ? (
                <span style={{ fontFamily: F, fontSize: 10.5, color: C.hot, lineHeight: 1.4 }}>
                  Must be between 300 and 900.
                </span>
              ) : band ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5,
                  background: band.c + "14", borderRadius: 999, padding: "3px 9px" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: band.c }} />
                  <span style={{ fontFamily: F, fontSize: 10.5, fontWeight: 700, color: band.c }}>{band.label}</span>
                </span>
              ) : (
                <span style={{ fontFamily: F, fontSize: 10.5, color: C.faint, lineHeight: 1.4 }}>
                  From the sanction letter. Required to confirm a financed retail.
                </span>
              )}
            </div>
          </div>
        );
      })()}

      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 11, marginBottom: 12 }}>
        <div style={{ background: C.primarySoft, borderRadius: 10, padding: "8px 11px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: F, fontSize: 11, fontWeight: 700, color: C.primary, flexShrink: 0 }}>Total Payment</span>
          <span style={{ fontFamily: F, fontSize: 15, fontWeight: 800, color: C.ink, textAlign: "right" }}>{formatINR(paymentBreakdownTotal(pd))}</span>
        </div>
      </div>

      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 11 }}>
      <button onClick={() => set({ dealerInsurance: !pd.dealerInsurance })} style={{
        display: "flex", alignItems: "center", gap: 8, width: "100%", background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: pd.dealerInsurance ? 9 : 12, boxSizing: "border-box",
      }}>
        {pd.dealerInsurance ? <CheckSquare size={16} color={C.primary} /> : <Square size={16} color={C.ghost} />}
        <span style={{ fontFamily: F, fontSize: 12, fontWeight: 700, color: C.ink }}>Dealer Insurance</span>
      </button>
      {pd.dealerInsurance && (
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={labelStyle}>Insurance Amount (₹)</span>
            <input type="number" min="0" value={pd.insuranceAmount} onChange={e => set({ insuranceAmount: e.target.value })} placeholder="0" style={{ ...smallInput, width: "100%" }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={labelStyle}>Insurance Company</span>
            <input value={pd.insuranceCompany} onChange={e => set({ insuranceCompany: e.target.value })} placeholder="e.g. ICICI Lombard" style={{ ...smallInput, width: "100%" }} />
          </div>
        </div>
      )}
      </div>

      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 11 }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 11 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={labelStyle}>Extended Warranty (₹)</span>
          <input type="number" min="0" value={pd.extendedWarranty} onChange={e => set({ extendedWarranty: e.target.value })} placeholder="0" style={{ ...smallInput, width: "100%" }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={labelStyle}>Care Package (₹)</span>
          <input type="number" min="0" value={pd.carePackage} onChange={e => set({ carePackage: e.target.value })} placeholder="0" style={{ ...smallInput, width: "100%" }} />
        </div>
      </div>
      </div>

      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 11 }}>
      <span style={labelStyle}>Add-ons</span>
      <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: 8, marginBottom: 11, boxSizing: "border-box" }}>
        {pd.addons.map(a => (
          <div key={a.id} style={{ display: "flex", gap: 6, alignItems: "center", paddingBottom: 8, marginBottom: 8, borderBottom: `1px solid ${C.border}` }}>
            <input value={a.label} onChange={e => setAddon(a.id, { label: e.target.value })} placeholder="Add-on name" style={{ ...smallInput, flex: 2, minWidth: 0, background: C.card }} />
            <input type="number" min="0" value={a.amount} onChange={e => setAddon(a.id, { amount: e.target.value })} placeholder="₹" style={{ ...smallInput, flex: 1, minWidth: 0, background: C.card }} />
            <button onClick={() => removeAddon(a.id)} style={{
              display: "flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, borderRadius: 999,
              background: "#FDECEA", border: "none", cursor: "pointer", flexShrink: 0, padding: 0,
            }}><X size={13} color={C.red || "#C62828"} /></button>
          </div>
        ))}
        <button onClick={addAddon} style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 7, width: "100%", boxSizing: "border-box",
          background: C.primarySoft, border: `1.5px dashed ${C.primary}66`, borderRadius: 8, padding: "8px 0", cursor: "pointer",

        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 17, height: 17, borderRadius: 999, background: C.primary, flexShrink: 0 }}>
            <Plus size={11} color="#fff" strokeWidth={3} />
          </div>
          <span style={{ fontFamily: F, fontSize: 11.5, fontWeight: 700, color: C.primary }}>Add another add-on</span>
        </button>
      </div>
      </div>

      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 11 }}>
      <span style={labelStyle}>Accessories Amount (₹)</span>
      <input type="number" min="0" value={pd.accessoriesAmount} onChange={e => set({ accessoriesAmount: e.target.value })} placeholder="0" style={{ ...smallInput, width: "100%" }} />
      </div>
    </div>
  );
}
function RetailForm({ lead, onCancel, onConfirm }) {
  const [retailDate, setRetailDate] = useState(toDateInputValue(today));
  const [pd, setPd] = useState(defaultPaymentBreakdown());
  const firstVehicle = (lead.vehicles && lead.vehicles.length ? lead.vehicles : [{ id: "v1", model: lead.model, variant: lead.variant, color: lead.color || "" }])[0];
  const [confirmedVehicle, setConfirmedVehicle] = useState(firstVehicle);
  const [attempted, setAttempted] = useState(false);
  // A financed retail must carry the customer's CIBIL score. By this point the loan is
  // sanctioned, so the number exists on the paperwork in front of the rep — which is
  // exactly why this is the right gate and the finance panel earlier is not.
  const isFinanced = (parseFloat(pd.financeAmount) || 0) > 0;
  const cibilNum = parseInt(pd.cibil, 10);
  const cibilOk = !isFinanced || (cibilNum >= 300 && cibilNum <= 900);
  const canSubmit = !!(confirmedVehicle.model && confirmedVehicle.variant) && !!retailDate
    && paymentBreakdownHasAmount(pd) && cibilOk;
  const retailMissingList = (() => {
    const m = [];
    if (!confirmedVehicle.model || !confirmedVehicle.variant) m.push("confirmed vehicle");
    if (!retailDate) m.push("retail date");
    if (!paymentBreakdownHasAmount(pd)) m.push("payment amount");
    if (isFinanced && !cibilOk) m.push(pd.cibil ? "a valid CIBIL score (300–900)" : "CIBIL score");
    return m;
  })();
  return (
    <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: 12, marginBottom: 10 }}>
      <div style={{ fontFamily: F, fontWeight: 700, fontSize: 12, color: C.ink, marginBottom: 3 }}>Confirm Retail</div>
      <div style={{ fontFamily: F, fontSize: 10.5, color: C.sub, marginBottom: 10, lineHeight: 1.4 }}>This is the true sale — full payment is settled here. Delivery is tracked separately and can happen on a different date.</div>
      <VehicleConfirmPicker lead={lead} value={confirmedVehicle} onChange={setConfirmedVehicle} />
      <span style={{ fontFamily: F, fontSize: 10, color: C.faint, fontWeight: 600, marginBottom: 3, display: "block" }}>Retail Date</span>
      <input type="date" value={retailDate} min={toDateInputValue(today)} onChange={e => setRetailDate(e.target.value)}
        style={{ ...formInputStyle, width: 170, maxWidth: "100%", marginBottom: 10 }} />
      <div style={{ marginBottom: 10 }}>
        <PaymentBreakdownFields value={pd} onChange={setPd} />
      </div>
      {attempted && !canSubmit && <MissingBanner items={retailMissingList} />}
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={onCancel} style={{ flex: 1, ...cancelBtnStyle }}>Cancel</button>
        <button onClick={() => { if (!canSubmit) { setAttempted(true); return; } onConfirm({ retailDate, paymentDetails: pd, confirmedVehicle }); }} style={{ flex: 2, ...saveBtnStyle(canSubmit) }}>
          Confirm Retail
        </button>
      </div>
    </div>
  );
}
function DeliveryConfirmForm({ onCancel, onConfirm }) {
  const [deliveryDate, setDeliveryDate] = useState(toDateInputValue(today));
  return (
    <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: 12, marginBottom: 10 }}>
      <div style={{ fontFamily: F, fontWeight: 700, fontSize: 12, color: C.ink, marginBottom: 3 }}>Mark Delivered</div>
      <div style={{ fontFamily: F, fontSize: 10.5, color: C.sub, marginBottom: 10, lineHeight: 1.4 }}>Payment was already settled at retail. This just confirms physical handover.</div>
      <span style={{ fontFamily: F, fontSize: 10, color: C.faint, fontWeight: 600, marginBottom: 3, display: "block" }}>Delivery Date</span>
      <input type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)}
        style={{ ...formInputStyle, width: 170, maxWidth: "100%", marginBottom: 10 }} />
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={onCancel} style={{ flex: 1, ...cancelBtnStyle }}>Cancel</button>
        <button disabled={!deliveryDate} onClick={() => onConfirm({ deliveryDate })} style={{ flex: 2, ...saveBtnStyle(!!deliveryDate) }}>
          Confirm Delivery
        </button>
      </div>
    </div>
  );
}
// Resolves whatever vehicles were under consideration (up to 3) into exactly one confirmed
// vehicle at the point of booking. Once a deal is booked, "which car" can't stay ambiguous —
// and if the details were never fully nailed down, this is where they get finalized, not just picked.
function VehicleConfirmPicker({ lead, value, onChange }) {
  const baseVehicles = lead.vehicles && lead.vehicles.length ? lead.vehicles : [{ id: "v1", model: lead.model, variant: lead.variant, color: lead.color || "" }];
  const [editingId, setEditingId] = useState(null);
  const models = [...new Set(INVENTORY.map(v => v.model))];
  const variantsForModel = (m) => INVENTORY.filter(v => v.model === m);

  const selectVehicle = (v) => onChange(v);
  const updateField = (field, val) => onChange({ ...value, [field]: val });

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontFamily: F, fontSize: 10.5, color: C.sub, fontWeight: 700, marginBottom: 6 }}>
        {baseVehicles.length > 1 ? "Which vehicle is this booking for?" : "Confirm vehicle"}
      </div>
      {baseVehicles.map(v => {
        const on = value.id === v.id;
        const isEditing = on && editingId === v.id;
        const shown = on ? value : v; // once selected, show live-edited values, not the stale base entry
        return (
          <div key={v.id} style={{ marginBottom: 6 }}>
            <button onClick={() => selectVehicle(v)} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, width: "100%",
              background: on ? C.greenSoft : C.card, border: `1.5px solid ${on ? C.green : C.borderStrong}`,
              borderRadius: isEditing ? "9px 9px 0 0" : 9, padding: "9px 11px", cursor: "pointer", textAlign: "left",
            }}>
              <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                {on ? <CheckSquare size={14} color={C.green} /> : <Square size={14} color={C.ghost} />}
                <span style={{ fontFamily: F, fontSize: 12, fontWeight: on ? 700 : 500, color: on ? C.green : C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {shown.model}{shown.variant ? ` ${shown.variant}` : ""}{shown.color ? ` · ${shown.color}` : ""}
                </span>
              </span>
              {on && (
                <span onClick={(e) => { e.stopPropagation(); setEditingId(isEditing ? null : v.id); }} style={{ fontFamily: F, fontSize: 10.5, fontWeight: 700, color: C.primary, flexShrink: 0 }}>
                  {isEditing ? "Done" : "Edit"}
                </span>
              )}
            </button>
            {isEditing && (
              <div style={{ border: `1.5px solid ${C.green}`, borderTop: "none", borderRadius: "0 0 9px 9px", padding: 8 }}>
                <div style={{ display: "flex", border: `1px solid ${C.border}`, borderRadius: 9, overflow: "hidden", height: 200 }}>
                  <div style={{ width: 84, flexShrink: 0, borderRight: `1px solid ${C.border}`, overflowY: "auto", background: C.bg }}>
                    {models.map((m, i) => (
                      <button key={m} onClick={() => onChange({ ...value, model: m, variant: "", color: "" })} style={{
                        display: "block", width: "100%", padding: "9px 6px", background: value.model === m ? C.card : "none", border: "none",
                        borderLeft: `3px solid ${value.model === m ? C.primary : "transparent"}`,
                        borderBottom: i < models.length - 1 ? `1px solid ${C.border}` : "none", cursor: "pointer", textAlign: "left",
                      }}>
                        <span style={{ fontFamily: F, fontSize: 10.5, fontWeight: value.model === m ? 700 : 500, color: value.model === m ? C.primary : C.ink }}>{m}</span>
                      </button>
                    ))}
                  </div>
                  <div style={{ flex: 1, overflowY: "auto", padding: 4, borderRight: `1px solid ${C.border}` }}>
                    {variantsForModel(value.model).map((vv, i, arr) => (
                      <button key={vv.id} onClick={() => updateField("variant", vv.variant)} style={{
                        display: "flex", alignItems: "center", gap: 6, width: "100%", background: "none", border: "none",
                        borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : "none", cursor: "pointer", padding: "8px 6px", textAlign: "left",
                      }}>
                        {value.variant === vv.variant ? <CheckSquare size={12} color={C.primary} /> : <Square size={12} color={C.ghost} />}
                        <span style={{ fontFamily: F, fontSize: 11, fontWeight: value.variant === vv.variant ? 700 : 500, color: value.variant === vv.variant ? C.primary : C.ink }}>{vv.variant}</span>
                      </button>
                    ))}
                  </div>
                  <div style={{ width: 90, flexShrink: 0, overflowY: "auto", padding: 4 }}>
                    {COLOR_OPTIONS.map((c, i) => (
                      <button key={c} onClick={() => updateField("color", c)} style={{
                        display: "flex", alignItems: "center", gap: 5, width: "100%", background: "none", border: "none",
                        borderBottom: i < COLOR_OPTIONS.length - 1 ? `1px solid ${C.border}` : "none", cursor: "pointer", padding: "7px 5px", textAlign: "left",
                      }}>
                        {value.color === c ? <CheckSquare size={11} color={C.teal} /> : <Square size={11} color={C.ghost} />}
                        <span style={{ fontFamily: F, fontSize: 9.5, fontWeight: value.color === c ? 700 : 500, color: value.color === c ? C.teal : C.ink, lineHeight: 1.2 }}>{c}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
      {baseVehicles.length > 1 && (
        <div style={{ fontFamily: F, fontSize: 10, color: C.faint, marginTop: 2 }}>The other vehicle(s) drop off once this is confirmed.</div>
      )}
    </div>
  );
}
function BookingForm({ lead, onCancel, onConfirm }) {
  const [advance, setAdvance] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [mode, setMode] = useState("");
  const [isFullPayment, setIsFullPayment] = useState(false);
  const [retailDate, setRetailDate] = useState(toDateInputValue(today));
  const [pd, setPd] = useState(defaultPaymentBreakdown());
  const firstVehicle = (lead.vehicles && lead.vehicles.length ? lead.vehicles : [{ id: "v1", model: lead.model, variant: lead.variant, color: lead.color || "" }])[0];
  const [confirmedVehicle, setConfirmedVehicle] = useState(firstVehicle);
  const [attempted, setAttempted] = useState(false);
  const canSubmit = !!(confirmedVehicle.model && confirmedVehicle.variant) && (isFullPayment ? (!!retailDate && paymentBreakdownHasAmount(pd)) : (advance && deliveryDate && mode));
  const bookingMissingList = (() => {
    const m = [];
    if (!confirmedVehicle.model || !confirmedVehicle.variant) m.push("confirmed vehicle");
    if (isFullPayment) {
      if (!retailDate) m.push("retail date");
      if (!paymentBreakdownHasAmount(pd)) m.push("payment amount");
    } else {
      if (!advance) m.push("advance amount");
      if (!deliveryDate) m.push("expected delivery date");
      if (!mode) m.push("payment mode");
    }
    return m;
  })();
  return (
    <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: 12, marginBottom: 10 }}>
      <div style={{ fontFamily: F, fontWeight: 700, fontSize: 12, color: C.ink, marginBottom: 9 }}>Confirm Booking</div>

      <VehicleConfirmPicker lead={lead} value={confirmedVehicle} onChange={setConfirmedVehicle} />

      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
        <button onClick={() => setIsFullPayment(false)} style={{
          flex: 1, minWidth: 0, boxSizing: "border-box", padding: "8px 4px", borderRadius: 8, border: `1.5px solid ${!isFullPayment ? C.green : C.borderStrong}`,
          background: !isFullPayment ? C.greenSoft : C.bg, color: !isFullPayment ? C.green : C.sub,
          fontFamily: F, fontWeight: 700, fontSize: 10, cursor: "pointer",
        }}>Token received</button>
        <button onClick={() => setIsFullPayment(true)} style={{
          flex: 1, minWidth: 0, boxSizing: "border-box", padding: "8px 4px", borderRadius: 8, border: `1.5px solid ${isFullPayment ? C.green : C.borderStrong}`,
          background: isFullPayment ? C.greenSoft : C.bg, color: isFullPayment ? C.green : C.sub,
          fontFamily: F, fontWeight: 700, fontSize: 10, cursor: "pointer",
        }}>Paid in full</button>
      </div>

      {!isFullPayment ? (
        <>
          <input type="number" min="0" placeholder="Advance amount (₹)" value={advance} onChange={e => setAdvance(e.target.value)}
            style={{ ...formInputStyle, width: "100%", marginBottom: 4, ...reqInput(attempted && !advance) }} />
          <ReqHint show={attempted && !advance} text="Enter the advance amount" />
          <span style={{ fontFamily: F, fontSize: 10, color: C.faint, fontWeight: 600, margin: "8px 0 3px", display: "block" }}>Expected Delivery Date</span>
          <input type="date" value={deliveryDate} min={toDateInputValue(today)} onChange={e => setDeliveryDate(e.target.value)}
            style={{ ...formInputStyle, width: 170, maxWidth: "100%", marginBottom: 4, ...reqInput(attempted && !deliveryDate) }} />
          <ReqHint show={attempted && !deliveryDate} text="Pick the expected delivery date" />
          <div style={{ fontFamily: F, fontSize: 10.5, color: C.sub, fontWeight: 600, margin: "8px 0 5px" }}>Payment Mode</div>
          <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
            {PAYMENT_MODES.map(m => <button key={m} onClick={() => setMode(m)} style={chipStyle(mode === m, true)}>{m}</button>)}
          </div>
          <ReqHint show={attempted && !mode} text="Pick a payment mode" />
          <div style={{ height: 6 }} />
        </>
      ) : (
        <>
          <div style={{ fontFamily: F, fontSize: 10.5, color: C.sub, marginBottom: 9, lineHeight: 1.4 }}>Customer is paying in full right now — this books and retails the deal in one step.</div>
          <span style={{ fontFamily: F, fontSize: 10, color: C.faint, fontWeight: 600, marginBottom: 3, display: "block" }}>Retail Date</span>
          <input type="date" value={retailDate} min={toDateInputValue(today)} onChange={e => setRetailDate(e.target.value)}
            style={{ ...formInputStyle, width: 170, maxWidth: "100%", marginBottom: 10 }} />
          <div style={{ marginBottom: 10 }}>
            <PaymentBreakdownFields value={pd} onChange={setPd} />
          </div>
        </>
      )}

      {attempted && !canSubmit && <MissingBanner items={bookingMissingList} />}
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={onCancel} style={{ flex: 1, ...cancelBtnStyle }}>Cancel</button>
        <button onClick={() => { if (!canSubmit) { setAttempted(true); return; } onConfirm(isFullPayment ? { isFullPayment: true, retailDate, paymentDetails: pd, confirmedVehicle } : { advance, deliveryDate, mode, confirmedVehicle }); }} style={{ flex: 2, ...saveBtnStyle(canSubmit) }}>
          {isFullPayment ? "Confirm Retail" : "Confirm Booking"}
        </button>
      </div>
    </div>
  );
}

/* ============================== LOST FORM ============================== */
function LostForm({ onCancel, onConfirm }) {
  const [reason, setReason] = useState(null);
  const [note, setNote] = useState("");
  const [recording, setRecording] = useState(false);
  const canSubmit = !!reason;
  const [attempted, setAttempted] = useState(false);

  const handleVoice = () => {
    if (recording) return;
    setRecording(true);
    setTimeout(() => {
      const text = MOCK_VOICE_TRANSCRIPTS[Math.floor(Math.random() * MOCK_VOICE_TRANSCRIPTS.length)];
      setNote(prev => prev ? `${prev} ${text}` : text);
      setRecording(false);
    }, 1600);
  };

  return (
    <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: 12, marginBottom: 10 }}>
      <div style={{ fontFamily: F, fontWeight: 700, fontSize: 12, color: C.ink, marginBottom: 9 }}>Mark as Lost</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 9 }}>
        {LOST_REASONS.map(r => <button key={r.key} onClick={() => setReason(r.key)} style={chipStyle(reason === r.key, true)}>{r.label}</button>)}
      </div>
      <NoteField value={note} onChange={setNote} recording={recording} onVoiceNote={handleVoice} />
      {attempted && !canSubmit && <MissingBanner items={["a reason for the loss"]} />}
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <button onClick={onCancel} style={{ flex: 1, ...cancelBtnStyle }}>Cancel</button>
        <button onClick={() => { if (!canSubmit) { setAttempted(true); return; } onConfirm({ reason, note }); }} style={{ flex: 2, ...saveBtnStyle(canSubmit) }}>
          Confirm Lost
        </button>
      </div>
    </div>
  );
}

/* ============================== FINANCE CARD (label-gated, mirrors ExchangeCard) ============================== */
function FinanceCard({ lead, onUpdateField }) {
  const fin = lead.finance || { loanAmount: "", bank: "", status: "" };
  const labelStyle = { fontFamily: F, fontSize: 10.5, color: C.sub, fontWeight: 600, marginBottom: 4, display: "block" };
  return (
    <div style={{ background: C.card, border: `1px solid ${C.teal}55`, borderRadius: 14, padding: 13, marginBottom: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
        <Landmark size={14} color={C.teal} />
        <span style={{ fontFamily: F, fontWeight: 700, fontSize: 12.5, color: C.ink }}>Finance</span>
        <Badge color={C.teal} soft={C.tealSoft}>Loan</Badge>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "9px 4%" }}>
        <div style={{ width: "48%" }}>
          <span style={labelStyle}>Loan Amount (₹ L)</span>
          <input type="number" min="0" value={fin.loanAmount} onChange={e => onUpdateField(lead.id, "loanAmount", e.target.value)}
            style={{ ...formInputStyle, width: "100%" }} />
        </div>
        <div style={{ width: "48%" }}>
          <span style={labelStyle}>Bank / NBFC</span>
          <input value={fin.bank} onChange={e => onUpdateField(lead.id, "bank", e.target.value)} style={{ ...formInputStyle, width: "100%" }} />
        </div>
      </div>
      <div style={{ marginTop: 12 }}>
        <span style={labelStyle}>Application Status</span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {FINANCE_STATUSES.map(s => (
            <button key={s.key} onClick={() => onUpdateField(lead.id, "status", s.key)} style={chipStyle(fin.status === s.key, true)}>{s.label}</button>
          ))}
        </div>
      </div>
      {fin.status === "approved" && (
        <div style={{ marginTop: 11, background: C.darkGreenSoft, borderRadius: 10, padding: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <ShieldCheck size={13} color={C.darkGreen} />
            <span style={{ fontFamily: F, fontSize: 10.5, fontWeight: 800, color: C.darkGreen }}>LOAN APPROVED</span>
          </div>
          <div style={{ fontFamily: F, fontSize: 11.5, color: C.ink, marginTop: 4 }}>
            ₹{fin.loanAmount || "—"} L{fin.bank ? ` from ${fin.bank}` : ""}
          </div>
        </div>
      )}
      {fin.status === "rejected" && (
        <div style={{ marginTop: 11, background: C.hotSoft, borderRadius: 10, padding: 10 }}>
          <span style={{ fontFamily: F, fontSize: 11.5, fontWeight: 700, color: C.hot }}>
            Loan application rejected — discuss alternate financing
          </span>
        </div>
      )}
    </div>
  );
}

/* ============================== DRIVING LICENSE (tied to test drive) ============================== */
function DrivingLicenseBlock({ lead, onToggle, onShareLink }) {
  const [copied, setCopied] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const dl = lead.drivingLicense || { done: false, via: null };
  const link = `https://autoprism.app/upload/dl-${lead.id.toString(36)}`;

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(link); } catch (e) { /* clipboard unavailable — link still visible to copy manually */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: dl.done ? 0 : 8 }}>
        <span style={{ fontFamily: F, fontSize: 11.5, fontWeight: 700, color: C.ink }}>Driving License</span>
        {dl.done ? (
          <button onClick={() => setPreviewOpen(true)} style={{ background: "none", border: "none", cursor: "pointer" }}>
            <Badge color={C.primary} soft={C.primarySoft}><Check size={10} />{dl.via === "customer" ? "Uploaded" : "Collected"}</Badge>
          </button>
        ) : (
          <button onClick={() => onToggle(lead.id)} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: F, fontSize: 11, fontWeight: 700, color: C.sub }}>
            Mark Collected
          </button>
        )}
      </div>

      {!dl.done && (
        <>
          <div style={{ fontFamily: F, fontSize: 11, color: C.sub, marginBottom: 8, wordBreak: "break-all" }}>{link}</div>
          <div style={{ display: "flex", gap: 7 }}>
            <button onClick={handleCopy} style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
              background: C.bg, border: `1px solid ${C.border}`, borderRadius: 9, padding: "7px 0",
              fontFamily: F, fontSize: 11.5, fontWeight: 700, color: C.ink, cursor: "pointer"
            }}>
              {copied ? <Check size={12} color={C.darkGreen} /> : <Copy size={12} />}{copied ? "Copied" : "Copy Link"}
            </button>
            <button onClick={() => onShareLink(lead)} style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
              background: C.primarySoft, border: `1px solid #DBEAFE`, borderRadius: 9, padding: "7px 0",
              fontFamily: F, fontSize: 11.5, fontWeight: 700, color: C.primaryDark, cursor: "pointer"
            }}>
              <WhatsAppIcon size={12} />Send via WhatsApp
            </button>
          </div>
        </>
      )}

      {previewOpen && (
        <BottomSheet title="Driving License" onClose={() => setPreviewOpen(false)}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "16px 0 6px" }}>
            <div style={{
              width: 140, height: 90, borderRadius: 10, background: C.bg, border: `1.5px dashed ${C.border}`,
              display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14
            }}>
              <FileText size={30} color={C.faint} />
            </div>
            <span style={{ fontFamily: F, fontSize: 12.5, color: C.sub, fontWeight: 600 }}>
              {dl.via === "customer" ? "Uploaded by customer via link" : "Collected in person"}
            </span>
          </div>
        </BottomSheet>
      )}
    </div>
  );
}

/* ============================== DOCUMENTS CHECKLIST ============================== */
function DocumentsCard({ lead, onToggle, onShareLink, embedded }) {
  const docs = lead.documents || defaultDocuments();
  const collected = DOCUMENT_ITEMS.filter(d => docs[d.key]?.done).length;
  const complete = collected === DOCUMENT_ITEMS.length;
  const [copied, setCopied] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);
  const link = `https://autoprism.app/upload/${lead.id.toString(36)}`;

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(link); } catch (e) { /* clipboard unavailable — link is still visible to copy manually */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={embedded ? {} : { background: C.card, borderRadius: 14, padding: 12, marginBottom: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 6px 18px rgba(0,0,0,0.075)" }}>
      {!embedded && (
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 9 }}>
        <span style={{ fontFamily: F, fontWeight: 700, fontSize: 12.5, color: C.ink }}>Documents</span>
        <span style={{ fontFamily: F, fontSize: 11, fontWeight: 700, color: complete ? C.darkGreen : C.sub }}>
          {collected}/{DOCUMENT_ITEMS.length}
        </span>
      </div>
      )}
      <div style={{ marginBottom: 11 }}>
        <PulseBar pct={(collected / DOCUMENT_ITEMS.length) * 100} color={complete ? C.darkGreen : C.primary} />
      </div>

      <div style={{ background: C.bg, borderRadius: 10, padding: 10, marginBottom: 11 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
          <Link2 size={12} color={C.primary} />
          <span style={{ fontFamily: F, fontSize: 10.5, fontWeight: 700, color: C.primaryDark }}>Customer Upload Link</span>
        </div>
        <div style={{ fontFamily: F, fontSize: 11, color: C.sub, marginBottom: 8, wordBreak: "break-all" }}>{link}</div>
        <div style={{ fontFamily: F, fontSize: 10.5, color: C.faint, marginBottom: 8 }}>
          Customer uploads documents here — this checklist updates automatically as they come in.
        </div>
        <div style={{ display: "flex", gap: 7 }}>
          <button onClick={handleCopy} style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
            background: C.bg, border: `1px solid ${C.border}`, borderRadius: 9, padding: "7px 0",
            fontFamily: F, fontSize: 11.5, fontWeight: 700, color: C.ink, cursor: "pointer"
          }}>
            {copied ? <Check size={12} color={C.darkGreen} /> : <Copy size={12} />}{copied ? "Copied" : "Copy Link"}
          </button>
          <button onClick={() => onShareLink(lead)} style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
            background: C.primarySoft, border: `1px solid #DBEAFE`, borderRadius: 9, padding: "7px 0",
            fontFamily: F, fontSize: 11.5, fontWeight: 700, color: C.primaryDark, cursor: "pointer"
          }}>
            <WhatsAppIcon size={12} />Send via WhatsApp
          </button>
        </div>
      </div>

      {DOCUMENT_ITEMS.map(d => {
        const state = docs[d.key] || { done: false, via: null };
        return (
          <div key={d.key} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "6px 0" }}>
            <button onClick={() => onToggle(lead.id, d.key)} style={{
              display: "flex", alignItems: "center", gap: 8, flex: 1, background: "none", border: "none",
              cursor: "pointer", textAlign: "left", padding: 0
            }}>
              {state.done ? <CheckSquare size={16} color={C.primary} /> : <Square size={16} color={C.faint} />}
              <span style={{ fontFamily: F, fontSize: 12.5, color: state.done ? C.ink : C.sub, fontWeight: state.done ? 600 : 500 }}>
                {d.label}
              </span>
            </button>
            {state.done && state.via === "customer" && (
              <button onClick={() => setPreviewDoc(d)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                <Badge color={C.primary} soft={C.primarySoft}><Link2 size={9} />Link</Badge>
              </button>
            )}
          </div>
        );
      })}

      {previewDoc && (
        <BottomSheet title={previewDoc.label} onClose={() => setPreviewDoc(null)}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "16px 0 6px" }}>
            <div style={{
              width: 130, height: 160, borderRadius: 10, background: C.bg, border: `1.5px dashed ${C.border}`,
              display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14
            }}>
              <FileText size={36} color={C.faint} />
            </div>
            <span style={{ fontFamily: F, fontSize: 12.5, color: C.sub, fontWeight: 600 }}>Uploaded by customer via link</span>
          </div>
        </BottomSheet>
      )}
    </div>
  );
}

/* ============================== EDITABLE DETAIL ROW ============================== */
function EditableRow({ label, value, placeholder, onSave }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderTop: `1px solid ${C.border}` }}>
      <span style={{ fontFamily: F, fontSize: 12, color: C.sub }}>{label}</span>
      {editing ? (
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <input value={val} onChange={e => setVal(e.target.value)} placeholder={placeholder} autoFocus style={{ ...formInputStyle, width: 130 }} />
          <button onClick={() => { onSave(val); setEditing(false); }} style={{
            background: C.primary, color: "#fff", border: "none", borderRadius: 8, padding: "7px 8px", cursor: "pointer", display: "flex"
          }}>
            <Check size={12} />
          </button>
        </div>
      ) : (
        <button onClick={() => setEditing(true)} style={{
          background: "none", border: "none", cursor: "pointer",
          fontFamily: F, fontSize: 12.5, color: C.ink, fontWeight: 600
        }}>
          {value || placeholder}
        </button>
      )}
    </div>
  );
}

/* ============================== VEHICLE CHANGE ============================== */
function VehicleTabsSection({ lead, onUpdateVehicles }) {
  const vehicles = lead.vehicles && lead.vehicles.length ? lead.vehicles : [{ id: "v1", model: lead.model, variant: lead.variant, color: lead.color || "", primary: true }];
  const [activeIdx, setActiveIdx] = useState(0);
  const idx = Math.min(activeIdx, vehicles.length - 1);
  const active = vehicles[idx];
  const models = [...new Set(INVENTORY.map(v => v.model))];
  const variantsForModel = INVENTORY.filter(v => v.model === active.model);

  const updateActive = (patch) => onUpdateVehicles(lead.id, vehicles.map((v, i) => i === idx ? { ...v, ...patch } : v));
  const addVehicle = () => {
    const next = [...vehicles, { id: `v${Date.now()}`, model: models[0], variant: "", color: "", primary: false }];
    onUpdateVehicles(lead.id, next);
    setActiveIdx(next.length - 1);
  };
  const removeActive = () => {
    if (vehicles.length <= 1) return;
    let next = vehicles.filter((_, i) => i !== idx);
    if (!next.some(v => v.primary)) next[0] = { ...next[0], primary: true };
    onUpdateVehicles(lead.id, next);
    setActiveIdx(0);
  };
  const setPrimary = () => onUpdateVehicles(lead.id, vehicles.map((v, i) => ({ ...v, primary: i === idx })));

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
        {vehicles.map((v, i) => (
          <button key={v.id} onClick={() => setActiveIdx(i)} style={{
            display: "flex", alignItems: "center", gap: 5, padding: "6px 10px", borderRadius: 8,
            border: `1.5px solid ${i === idx ? C.primary : C.border}`,
            background: i === idx ? C.primarySoft : C.card, cursor: "pointer",
          }}>
            {v.primary && vehicles.length > 1 && <Star size={11} color={C.gold} fill={C.gold} />}
            <span style={{ fontFamily: F, fontSize: 11.5, fontWeight: i === idx ? 700 : 500, color: i === idx ? C.primary : C.ink }}>
              {v.model || `Vehicle ${i + 1}`}
            </span>
          </button>
        ))}
        {vehicles.length < 3 && (
          <button onClick={addVehicle} style={{
            display: "flex", alignItems: "center", gap: 4, padding: "6px 10px", borderRadius: 8,
            border: `1.5px dashed ${C.borderStrong}`, background: "none", cursor: "pointer",
          }}>
            <Plus size={12} color={C.primary} />
            <span style={{ fontFamily: F, fontSize: 11.5, fontWeight: 700, color: C.primary }}>Add Vehicle</span>
          </button>
        )}
      </div>

      {vehicles.length > 1 && (
        active.primary ? (
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 10 }}>
            <Star size={12} color={C.gold} fill={C.gold} />
            <span style={{ fontFamily: F, fontSize: 11, fontWeight: 700, color: C.gold }}>Primary — shown on the card</span>
          </div>
        ) : (
          <button onClick={setPrimary} style={{
            display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer",
            padding: 0, marginBottom: 10, fontFamily: F, fontSize: 11, fontWeight: 700, color: C.gold,
          }}><Star size={12} />Set as primary vehicle</button>
        )
      )}

      <div style={{ display: "flex", border: `1px solid ${C.border}`, borderRadius: 9, overflow: "hidden", height: 200 }}>
        <div style={{ width: 84, flexShrink: 0, borderRight: `1px solid ${C.border}`, overflowY: "auto", background: C.bg }}>
          {models.map((m, i) => (
            <button key={m} onClick={() => updateActive({ model: m, variant: "", color: "" })} style={{
              display: "block", width: "100%", padding: "9px 6px", background: active.model === m ? C.card : "none", border: "none",
              borderLeft: `3px solid ${active.model === m ? C.primary : "transparent"}`,
              borderBottom: i < models.length - 1 ? `1px solid ${C.border}` : "none", cursor: "pointer", textAlign: "left",
            }}>
              <span style={{ fontFamily: F, fontSize: 10.5, fontWeight: active.model === m ? 700 : 500, color: active.model === m ? C.primary : C.ink }}>{m}</span>
            </button>
          ))}
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 4, borderRight: `1px solid ${C.border}` }}>
          {variantsForModel.map((v, i) => (
            <button key={v.id} onClick={() => updateActive({ variant: v.variant })} style={{
              display: "flex", alignItems: "center", gap: 6, width: "100%", background: "none", border: "none",
              borderBottom: i < variantsForModel.length - 1 ? `1px solid ${C.border}` : "none", cursor: "pointer", padding: "8px 6px", textAlign: "left",
            }}>
              {active.variant === v.variant ? <CheckSquare size={12} color={C.primary} /> : <Square size={12} color={C.ghost} />}
              <span style={{ fontFamily: F, fontSize: 11, fontWeight: active.variant === v.variant ? 700 : 500, color: active.variant === v.variant ? C.primary : C.ink }}>{v.variant}</span>
            </button>
          ))}
        </div>
        <div style={{ width: 90, flexShrink: 0, overflowY: "auto", padding: 4 }}>
          {COLOR_OPTIONS.map((c, i) => (
            <button key={c} onClick={() => updateActive({ color: c })} style={{
              display: "flex", alignItems: "center", gap: 5, width: "100%", background: "none", border: "none",
              borderBottom: i < COLOR_OPTIONS.length - 1 ? `1px solid ${C.border}` : "none", cursor: "pointer", padding: "7px 5px", textAlign: "left",
            }}>
              {active.color === c ? <CheckSquare size={11} color={C.teal} /> : <Square size={11} color={C.ghost} />}
              <span style={{ fontFamily: F, fontSize: 9.5, fontWeight: active.color === c ? 700 : 500, color: active.color === c ? C.teal : C.ink, lineHeight: 1.2 }}>{c}</span>
            </button>
          ))}
        </div>
      </div>

      {vehicles.length > 1 && (
        <button onClick={removeActive} style={{
          background: "none", border: "none", cursor: "pointer", padding: "8px 0 0", fontFamily: F, fontSize: 11, fontWeight: 700, color: C.hot,
        }}>Remove this vehicle</button>
      )}
    </div>
  );
}

/* ============================== DELIVERY PHOTOS ============================== */
function DeliveryPhotosCard({ lead, onAddPhoto, onShare }) {
  const fileInputRef = useRef(null);
  const photos = lead.deliveryPhotos || [];

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => onAddPhoto(lead.id, reader.result);
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  return (
    <div style={{ background: C.card, borderRadius: 14, padding: 12, marginBottom: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 6px 18px rgba(0,0,0,0.075)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 11 }}>
        <Camera size={14} color={C.primary} />
        <span style={{ fontFamily: F, fontWeight: 700, fontSize: 12.5, color: C.ink }}>Delivery Photos</span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: photos.length ? 11 : 0 }}>
        {photos.map((src, i) => (
          <img key={i} src={src} alt={`Delivery ${i + 1}`} style={{ width: 72, height: 72, borderRadius: 10, objectFit: "cover", border: `1px solid ${C.border}` }} />
        ))}
        <button onClick={() => fileInputRef.current?.click()} style={{
          width: 72, height: 72, borderRadius: 10, border: `1.5px dashed ${C.border}`, background: C.bg,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, cursor: "pointer"
        }}>
          <Camera size={18} color={C.faint} />
          <span style={{ fontFamily: F, fontSize: 9, color: C.faint, fontWeight: 600 }}>Add Photo</span>
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" capture="environment" multiple onChange={handleFileChange} style={{ display: "none" }} />
      </div>
      {photos.length > 0 && (
        <button onClick={() => onShare(lead)} style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%",
          background: C.primary, color: "#fff", border: "none", borderRadius: 10, padding: "10px 0",
          fontFamily: F, fontWeight: 700, fontSize: 12.5, cursor: "pointer", boxShadow: "0 2px 6px rgba(37,99,235,.25)"
        }}>
          <Share2 size={14} />Share to Social Media
        </button>
      )}
    </div>
  );
}
/* ============================== LEAD DETAIL ============================== */
function LeadDetail({ lead, currentId, voiceFirst = true, onDone, onUpdateCommPref, onToggleLabel, onAcceptSuggestedSignal, onDismissSuggestedSignal, onCall, onWhatsApp, onAction, onAddNote, onScheduleTestDrive, onCompleteTestDrive, onCancelTestDrive, onLogCall, onLogWhatsApp, onUpdateExchangeField, onAddExchangePhoto, onAppraiseExchange, onUpdateAltPhone, onEscalate, onChangeStage, onConfirmBooking, onConfirmRetail, onConfirmDelivery, onConfirmLost, onUpdateFinanceField, onToggleDocument, onUpdateLeadField, onShareDocLink, onAddDeliveryPhoto, onShareDelivery, onSendQuote, onSetCompetitor, onUpdateVehicles, onToggleDrivingLicense, onShareDLLink, allLeads }) {
  const [testDriveExpanded, setTestDriveExpanded] = useState(false);
  const [tdForm, setTdForm] = useState({ mode: "", date: "", time: "", locationText: "" });
  const [exchangeOpen, setExchangeOpen] = useState(false);
  const [financeOpen, setFinanceOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [contactWarning, setContactWarning] = useState(null); // "call" | "whatsapp" | null
  // A rep can VIEW any lead they find through search, but can only ACT on leads assigned to them.
  const [waTemplateOpen, setWaTemplateOpen] = useState(false);
  const isOwned = !currentId || !lead.owner || lead.owner === currentId;
  const assignedUser = !isOwned ? userById(lead.owner) : null;
  const [documentsOpen, setDocumentsOpen] = useState(false);
  const [dealDetailsOpen, setDealDetailsOpen] = useState(false);
  const [nameEditing, setNameEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [callLogExpanded, setCallLogExpanded] = useState(false);
  const [waLogExpanded, setWaLogExpanded] = useState(false);
  const [quoteFormOpen, setQuoteFormOpen] = useState(false);
  const [viewingQuote, setViewingQuote] = useState(null);
  const [testDriveResponseOpen, setTestDriveResponseOpen] = useState(false);
  const [testDriveCancelOpen, setTestDriveCancelOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [stagePickerOpen, setStagePickerOpen] = useState(false);
  const [pendingStage, setPendingStage] = useState(null);
  const [bookingFormOpen, setBookingFormOpen] = useState(false);
  const [retailFormOpen, setRetailFormOpen] = useState(false);
  const [deliveryFormOpen, setDeliveryFormOpen] = useState(false);
  const [lostFormOpen, setLostFormOpen] = useState(false);
  const chTones = callWaTones(lead);

  // Tapping a milestone only stages the selection — nothing changes until Confirm is pressed.
  // Booking/Retailed/Delivered skip the generic confirm step since their own forms are the confirmation.
  const handleMilestoneTap = (stage) => {
    if (stage === lead.stage) { setPendingStage(null); return; }
    if (stage === "Booking") { setPendingStage(null); setBookingFormOpen(true); return; }
    if (stage === "Retailed") { setPendingStage(null); setRetailFormOpen(true); return; }
    if (stage === "Delivered") { setPendingStage(null); setDeliveryFormOpen(true); return; }
    setPendingStage(stage);
  };
  const handleConfirmStageChange = () => {
    if (!pendingStage) return;
    onChangeStage(lead.id, pendingStage);
    setPendingStage(null);
    setStagePickerOpen(false);
  };

  const timelineIcon = {
    call: Phone, visit: MapPin, "test-drive": Car, quote: FileText, booking: Package, delivery: CarFront,
    escalation: Flag, "escalation-response": CheckCircle2, whatsapp: WhatsAppIcon,
  };

  const handleVoiceNote = () => {
    if (recording) return;
    setRecording(true);
    setTimeout(() => {
      const text = MOCK_VOICE_TRANSCRIPTS[Math.floor(Math.random() * MOCK_VOICE_TRANSCRIPTS.length)];
      onAddNote(lead.id, text);
      setRecording(false);
    }, 1700);
  };

  const tdCanSave = tdForm.mode && tdForm.date && tdForm.time;

  return (
    <div style={{ padding: 12 }}>
      {/* Header card */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14, marginBottom: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          {nameEditing ? (
            <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, minWidth: 0 }}>
              <input
                value={nameDraft}
                onChange={e => setNameDraft(e.target.value)}
                autoFocus
                onKeyDown={e => {
                  if (e.key === "Enter" && nameDraft.trim()) {
                    onUpdateLeadField(lead.id, "name", nameDraft.trim());
                    setNameEditing(false);
                  }
                  if (e.key === "Escape") setNameEditing(false);
                }}
                style={{
                  fontFamily: F,
                  fontWeight: 700, fontSize: 17, color: C.ink, border: "none", borderBottom: `2px solid ${C.primary}`,
                  outline: "none", background: "none", width: "100%", padding: "2px 0",
                }}
              />
              <button
                disabled={!nameDraft.trim()}
                onClick={() => { onUpdateLeadField(lead.id, "name", nameDraft.trim()); setNameEditing(false); }}
                style={{ background: C.primary, border: "none", borderRadius: 8, padding: "5px 7px", cursor: "pointer", display: "flex", flexShrink: 0 }}
              >
                <Check size={13} color="#fff" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => { setNameDraft(lead.name); setNameEditing(true); }}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "left",
              }}
            >
              <span style={{
                fontFamily: F,
                fontWeight: 700, fontSize: 17, color: C.ink,
              }}>
                {lead.name}
              </span>
              <Pencil size={13} color={C.faint} />
            </button>
          )}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5 }}>
            <BucketBadge bucket={lead.bucket} />
            <PropensityTag value={lead.propensity} />
          </div>
        </div>
        <div style={{ fontFamily: F, fontSize: 13, color: C.sub, marginTop: 3 }}>{lead.model} · {lead.variant}</div>
        {lead.summary && (
          <div style={{
            display: "flex", alignItems: "flex-start", gap: 6, marginTop: 9, paddingTop: 9,
            borderTop: `1px solid ${C.border}`
          }}>
            <PulseSignal size={13} color={FLAG_META[lead.flag]?.color || C.sub} style={{ flexShrink: 0, marginTop: 1.5 }} />
            <span style={{ fontFamily: F, fontSize: 12.5, color: C.ink, fontWeight: 500, lineHeight: 1.35 }}>
              {lead.summary}
            </span>
          </div>
        )}
      </div>

      {/* Status — kept visually more prominent (accent border, larger heading) since it's the
          single most important thing about a lead's position in the pipeline. */}
      <div style={{ background: C.card, border: `1.5px solid ${C.primary}40`, borderRadius: 14, padding: 14, marginBottom: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: stagePickerOpen ? 12 : 0 }}>
          <span style={{ fontFamily: F, fontWeight: 700, fontSize: 13.5, color: C.ink, display: "flex", alignItems: "center", gap: 6 }}>
            <ClipboardList size={14} color={C.primary} />Status
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <StageBadge stage={lead.stage} />
            <button onClick={() => { setStagePickerOpen(o => !o); setPendingStage(null); }} style={{
              background: "none", border: "none", cursor: "pointer",
              fontFamily: F, fontSize: 11.5, fontWeight: 700, color: C.primary
            }}>
              {stagePickerOpen ? "Done" : "Update"}
            </button>
          </div>
        </div>
        {stagePickerOpen && (
          <>
            <StatusTimeline currentStatus={lead.stage} pendingStatus={pendingStage} onSelect={handleMilestoneTap} />
            {pendingStage && (
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button onClick={() => setPendingStage(null)} style={{ flex: 1, ...cancelBtnStyle }}>Cancel</button>
                <button onClick={handleConfirmStageChange} style={{ flex: 2, ...saveBtnStyle(true) }}>
                  Confirm — Move to {pendingStage}
                </button>
              </div>
            )}
            {!pendingStage && lead.stage !== "Lost" && (
              <button onClick={() => setLostFormOpen(true)} style={{
                background: "none", border: "none", cursor: "pointer", padding: "8px 0 0",
                fontFamily: F, fontSize: 11.5, fontWeight: 700, color: C.hot
              }}>
                Mark as Lost instead
              </button>
            )}
          </>
        )}
        {bookingFormOpen && (
          <BookingForm
            lead={lead}
            onCancel={() => setBookingFormOpen(false)}
            onConfirm={(data) => { onConfirmBooking(lead.id, data); setBookingFormOpen(false); }}
          />
        )}
        {retailFormOpen && (
          <RetailForm
            lead={lead}
            onCancel={() => setRetailFormOpen(false)}
            onConfirm={(data) => { onConfirmRetail(lead.id, data); setRetailFormOpen(false); }}
          />
        )}
        {deliveryFormOpen && (
          <DeliveryConfirmForm
            onCancel={() => setDeliveryFormOpen(false)}
            onConfirm={(data) => { onConfirmDelivery(lead.id, data); setDeliveryFormOpen(false); }}
          />
        )}
        {lostFormOpen && (
          <LostForm
            onCancel={() => setLostFormOpen(false)}
            onConfirm={(data) => { onConfirmLost(lead.id, data); setLostFormOpen(false); }}
          />
        )}
        {lead.lostReason && (
          <div style={{ background: C.bg, borderRadius: 10, padding: 10, marginTop: 10 }}>
            <div style={{ fontFamily: F, fontSize: 11, fontWeight: 800, color: C.faint }}>
              LOST · {LOST_REASONS.find(r => r.key === lead.lostReason.reason)?.label || lead.lostReason.reason}
            </div>
            {lead.lostReason.note && (
              <div style={{ fontFamily: F, fontSize: 11.5, color: C.sub, marginTop: 4 }}>{lead.lostReason.note}</div>
            )}
          </div>
        )}
        {lead.booking && (
          <div style={{ background: C.darkGreenSoft, borderRadius: 10, padding: 10, marginTop: 10 }}>
            <div style={{ fontFamily: F, fontSize: 11, fontWeight: 800, color: C.darkGreen }}>
              BOOKED · ₹{lead.booking.advance} advance ({lead.booking.mode})
            </div>
            <div style={{ fontFamily: F, fontSize: 11.5, color: C.sub, marginTop: 4 }}>
              Expected delivery — {lead.expectedDeliveryDate ? fmt(lead.expectedDeliveryDate) : "—"}
            </div>
          </div>
        )}
      </div>

      <ContactCard lead={lead} onUpdateAltPhone={onUpdateAltPhone} onUpdateCommPref={onUpdateCommPref} />

      {/* Quick actions — hidden for leads not assigned to the current user */}
      {!isOwned ? (
        <div style={{ background: C.warmSoft, border: `1px solid ${C.warm}`, borderRadius: 12, padding: "12px 14px", marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <Lock size={14} color={C.warm} />
            <span style={{ fontFamily: F, fontSize: 12.5, fontWeight: 700, color: C.warm }}>
              Assigned to {assignedUser?.name || "another rep"}
            </span>
          </div>
          <div style={{ fontFamily: F, fontSize: 11, color: C.sub, marginTop: 4 }}>
            You can view this lead but cannot update it. Contact {assignedUser?.name?.split(" ")[0] || "the rep"} or your manager to reassign.
          </div>
        </div>
      ) : (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
        <IconBtn icon={Phone} label="Call" tone={chTones.call} onClick={() => {
          if (channelBlocked(lead, "phone")) { setContactWarning("call"); return; }
          onCall(lead); setCallLogExpanded(true); setWaLogExpanded(false); setTestDriveExpanded(false); setQuoteFormOpen(false);
        }} />
        <IconBtn icon={WhatsAppIcon} label="WhatsApp" tone={chTones.whatsapp} onClick={() => {
          if (channelBlocked(lead, "whatsapp")) { setContactWarning("whatsapp"); return; }
          setWaTemplateOpen(true); setCallLogExpanded(false); setTestDriveExpanded(false); setQuoteFormOpen(false);
        }} />
        <IconBtn icon={Car} label="Test Drive" onClick={() => {
          if (lead.testDrive && !testDriveExpanded) {
            setTdForm({ mode: lead.testDrive.mode, date: toDateInputValue(lead.testDrive.date), time: lead.testDrive.time, locationText: lead.testDrive.location?.text || lead.testDrive.location?.mapsLink || "" });
          }
          setTestDriveExpanded(v => !v);
          setCallLogExpanded(false);
          setWaLogExpanded(false);
          setQuoteFormOpen(false);
        }} />
        <IconBtn icon={FileText} label="Quote" onClick={() => setQuoteFormOpen(v => !v)} />
      </div>
      )}

      {contactWarning && (
        <div style={{ background: C.hotSoft, border: `1.5px solid ${C.hot}`, borderRadius: 12, padding: "11px 13px", marginBottom: 10 }}>
          <div style={{ fontFamily: F, fontSize: 12, fontWeight: 700, color: C.hot, marginBottom: 3 }}>
            Customer prefers {commPrefMeta(lead.commPref)?.label}
          </div>
          <div style={{ fontFamily: F, fontSize: 11, color: C.sub, marginBottom: 9, lineHeight: 1.4 }}>
            Contacting via {contactWarning === "call" ? "phone" : "WhatsApp"} goes against what they stated — only proceed if there's a real reason to.
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setContactWarning(null)} style={{ flex: 1, ...cancelBtnStyle }}>Cancel</button>
            <button onClick={() => {
              const channel = contactWarning;
              setContactWarning(null);
              if (channel === "call") { onCall(lead); setCallLogExpanded(true); setWaLogExpanded(false); }
              else { onWhatsApp(lead); setWaLogExpanded(true); setCallLogExpanded(false); }
              setTestDriveExpanded(false); setQuoteFormOpen(false);
            }} style={{ flex: 2, background: C.hot, color: "#fff", border: "none", borderRadius: 9, padding: "9px 0", fontFamily: F, fontWeight: 700, fontSize: 12.5, cursor: "pointer" }}>
              {contactWarning === "call" ? "Call Anyway" : "Message Anyway"}
            </button>
          </div>
        </div>
      )}

      {callLogExpanded && (
        <div style={{ background: C.card, borderRadius: 14, padding: 12, marginBottom: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 6px 18px rgba(0,0,0,0.075)" }}>
          <CallLogForm
            lead={lead}
            voiceFirst={voiceFirst}
            onCancel={() => setCallLogExpanded(false)}
            onSubmit={payload => { onLogCall(lead.id, payload); setCallLogExpanded(false); setTimeout(onDone, 500); }}
          />
        </div>
      )}
      {waLogExpanded && (
        <div style={{ background: C.card, borderRadius: 14, padding: 12, marginBottom: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 6px 18px rgba(0,0,0,0.075)" }}>
          <WhatsAppLogForm
            onCancel={() => setWaLogExpanded(false)}
            onSubmit={payload => { onLogWhatsApp(lead.id, payload); setWaLogExpanded(false); setTimeout(onDone, 500); }}
          />
        </div>
      )}
      {quoteFormOpen && (
        <div style={{ background: C.card, borderRadius: 14, padding: 12, marginBottom: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 6px 18px rgba(0,0,0,0.075)" }}>
          <QuoteForm
            lead={lead}
            onCancel={() => setQuoteFormOpen(false)}
            onSubmit={quote => { onSendQuote(lead.id, quote); setQuoteFormOpen(false); }}
            onViewQuote={setViewingQuote}
          />
        </div>
      )}

      {lead.testDrive && !testDriveExpanded && (
        <div style={{ background: C.card, borderRadius: 14, padding: 12, marginBottom: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 6px 18px rgba(0,0,0,0.075)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontFamily: F, fontWeight: 700, fontSize: 12.5, color: C.ink }}>Test Drive Scheduled</div>
              <div style={{ fontFamily: F, fontSize: 11.5, color: C.sub, marginTop: 2 }}>
                {lead.testDrive.mode === "location" ? "Customer's Location" : "Showroom"} · {fmt(lead.testDrive.date)} at {fmtTime(lead.testDrive.time)}
              </div>
            </div>
            <Car size={17} color={C.purple} />
          </div>

          <DrivingLicenseBlock lead={lead} onToggle={onToggleDrivingLicense} onShareLink={onShareDLLink} />

          {!testDriveResponseOpen && !testDriveCancelOpen && (
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button onClick={() => {
                setTdForm({ mode: lead.testDrive.mode, date: toDateInputValue(lead.testDrive.date), time: lead.testDrive.time, locationText: lead.testDrive.location?.text || lead.testDrive.location?.mapsLink || "" });
                setTestDriveExpanded(true);
              }} style={{ flex: 1, ...cancelBtnStyle }}>Reschedule</button>
              <button onClick={() => setTestDriveResponseOpen(true)} style={{ flex: 1, ...saveBtnStyle(true) }}>Mark Completed</button>
            </div>
          )}
          {!testDriveResponseOpen && !testDriveCancelOpen && (
            <button onClick={() => setTestDriveCancelOpen(true)} style={{
              background: "none", border: "none", cursor: "pointer", padding: "8px 0 0", width: "100%",
              fontFamily: F, fontSize: 11.5, fontWeight: 700, color: C.hot
            }}>
              Cancel Test Drive
            </button>
          )}
          {testDriveResponseOpen && (
            <TestDriveResponseForm
              onCancel={() => setTestDriveResponseOpen(false)}
              onSubmit={payload => { onCompleteTestDrive(lead.id, payload); setTestDriveResponseOpen(false); setTimeout(onDone, 500); }}
            />
          )}
          {testDriveCancelOpen && (
            <TestDriveCancelForm
              onCancel={() => setTestDriveCancelOpen(false)}
              onSubmit={payload => { onCancelTestDrive(lead.id, payload); setTestDriveCancelOpen(false); }}
            />
          )}
        </div>
      )}

      {testDriveExpanded && (
        <div style={{ background: C.card, borderRadius: 14, padding: 12, marginBottom: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 6px 18px rgba(0,0,0,0.075)" }}>
          <div style={{ fontFamily: F, fontWeight: 700, fontSize: 12.5, color: C.ink }}>
            {lead.testDrive ? "Reschedule Test Drive" : "Schedule Test Drive"}
          </div>
          <TestDriveFields value={tdForm} onChange={setTdForm} model={lead.model} leads={allLeads} excludeLeadId={lead.id} />
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button onClick={() => setTestDriveExpanded(false)} style={{ flex: 1, ...cancelBtnStyle }}>Cancel</button>
            <button disabled={!tdCanSave} onClick={() => {
              onScheduleTestDrive(lead.id, tdForm);
              setTestDriveExpanded(false);
              setTdForm({ mode: "", date: "", time: "", locationText: "" });
            }} style={{ flex: 2, ...saveBtnStyle(tdCanSave) }}>Save</button>
          </div>
        </div>
      )}

      {/* Signals — always expanded so the SE can mark them in one tap mid-call. AI-detected
          suggestions from call analysis surface here as an accept/dismiss banner. */}
      <div style={{ background: C.card, borderRadius: 14, padding: 12, marginBottom: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 6px 18px rgba(0,0,0,0.075)" }}>
        <span style={{ fontFamily: F, fontWeight: 700, fontSize: 12.5, color: C.ink }}>Signals</span>
        {(lead.suggestedSignals || []).map(sug => (
          <div key={sug.signal} style={{
            display: "flex", alignItems: "flex-start", gap: 8, background: "#FEFCE8", border: "1px solid #FDE68A",
            borderRadius: 10, padding: 10, marginTop: 10
          }}>
            <Sparkles size={14} color={C.gold} style={{ flexShrink: 0, marginTop: 1 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: F, fontSize: 11.5, color: C.ink, lineHeight: 1.4 }}>{sug.reason}</div>
              <div style={{ display: "flex", gap: 6, marginTop: 7 }}>
                <button onClick={() => onAcceptSuggestedSignal(lead.id, sug.signal)} style={{
                  fontFamily: F, fontSize: 11, fontWeight: 700, color: "#fff", background: C.primary,
                  border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer"
                }}>Add "{sug.signal}"</button>
                <button onClick={() => onDismissSuggestedSignal(lead.id, sug.signal)} style={{
                  fontFamily: F, fontSize: 11, fontWeight: 700, color: C.sub, background: "none",
                  border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 12px", cursor: "pointer"
                }}>Dismiss</button>
              </div>
            </div>
          </div>
        ))}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
          {LABEL_OPTIONS.map(opt => {
            const on = lead.labels.includes(opt);
            const hasModule = opt === "Exchange" || opt === "Finance";
            const statusColor = opt === "Exchange" && on ? exchangeStatusColor(lead) : { color: C.primaryDark, soft: C.primarySoft };
            const initiated = (opt === "Exchange" && hasExchangeData(lead)) || (opt === "Finance" && hasFinanceData(lead));
            const isOpen = opt === "Exchange" ? exchangeOpen : opt === "Finance" ? financeOpen : false;
            const handleClick = () => {
              if (!hasModule) { onToggleLabel(lead.id, opt); return; }
              if (!on) onToggleLabel(lead.id, opt); // activate on first click into the module
              if (opt === "Exchange") setExchangeOpen(v => !v || !on);
              if (opt === "Finance") setFinanceOpen(v => !v || !on);
            };
            return (
              <button key={opt} onClick={handleClick} style={{
                fontFamily: F, fontSize: 11.5, fontWeight: 600, padding: "6px 11px", borderRadius: 999,
                border: `1px solid ${on ? statusColor.color : C.border}`, background: on ? statusColor.soft : "#fff",
                color: on ? statusColor.color : C.sub, cursor: "pointer", display: "flex", alignItems: "center", gap: 4
              }}>
                {on && (initiated ? <CheckCircle2 size={12} /> : <Check size={11} />)}{opt}
                {hasModule && <ChevronDown size={11} style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform .15s", opacity: 0.6 }} />}
              </button>
            );
          })}
          {(() => {
            const docs = lead.documents || defaultDocuments();
            const collected = DOCUMENT_ITEMS.filter(d => docs[d.key]?.done).length;
            const complete = collected === DOCUMENT_ITEMS.length;
            const started = collected > 0;
            return (
              <button onClick={() => setDocumentsOpen(v => !v)} style={{
                fontFamily: F, fontSize: 11.5, fontWeight: 600, padding: "6px 11px", borderRadius: 999,
                border: `1px solid ${started ? (complete ? C.darkGreen : C.primaryDark) : C.border}`,
                background: started ? (complete ? C.darkGreenSoft : C.primarySoft) : "#fff",
                color: started ? (complete ? C.darkGreen : C.primaryDark) : C.sub, cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
              }}>
                {started && (complete ? <CheckCircle2 size={12} /> : <Check size={11} />)}Documents
                <span style={{ fontSize: 10, opacity: 0.75 }}>{collected}/{DOCUMENT_ITEMS.length}</span>
                <ChevronDown size={11} style={{ transform: documentsOpen ? "rotate(180deg)" : "none", transition: "transform .15s", opacity: 0.6 }} />
              </button>
            );
          })()}
        </div>
        {exchangeOpen && lead.labels.includes("Exchange") && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
            <ExchangeCard lead={lead} onUpdateField={onUpdateExchangeField} onAddPhoto={onAddExchangePhoto} onAppraise={onAppraiseExchange} />
            <button onClick={() => { onToggleLabel(lead.id, "Exchange"); setExchangeOpen(false); }} style={{
              background: "none", border: "none", cursor: "pointer", padding: "8px 0 0", fontFamily: F, fontSize: 11, fontWeight: 700, color: C.hot,
            }}>Remove Exchange signal</button>
          </div>
        )}
        {financeOpen && lead.labels.includes("Finance") && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
            <FinanceCard lead={lead} onUpdateField={onUpdateFinanceField} />
            <button onClick={() => { onToggleLabel(lead.id, "Finance"); setFinanceOpen(false); }} style={{
              background: "none", border: "none", cursor: "pointer", padding: "8px 0 0", fontFamily: F, fontSize: 11, fontWeight: 700, color: C.hot,
            }}>Remove Finance signal</button>
          </div>
        )}
        {documentsOpen && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
            <DocumentsCard lead={lead} onToggle={onToggleDocument} onShareLink={onShareDocLink} embedded />
          </div>
        )}
        <button onClick={() => onToggleLabel(lead.id, "Comparing Competitor")} style={{
          background: "none", border: "none", cursor: "pointer", padding: 0, marginTop: 10,
          fontFamily: F, fontSize: 11, fontWeight: 700, color: lead.labels.includes("Comparing Competitor") ? C.primary : C.faint,
        }}>
          {lead.labels.includes("Comparing Competitor") ? "✓ Comparing a competitor" : "Customer comparing a competitor?"}
        </button>
        {lead.labels.includes("Comparing Competitor") && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
            <div style={{ fontFamily: F, fontSize: 10.5, color: C.sub, fontWeight: 600, marginBottom: 6 }}>Which competitor?</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {COMPETITOR_OPTIONS.map(c => (
                <button key={c} onClick={() => onSetCompetitor(lead.id, c)} style={chipStyle(lead.competitor === c, true)}>{c}</button>
              ))}
            </div>
            {lead.competitor && <CompetitorBattleCard competitor={lead.competitor} ourModel={lead.model} />}
          </div>
        )}
      </div>

      {/* Vehicle / budget details — one-line summary by default, expands to fully editable fields */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, marginBottom: 10, padding: "13px 13px 0" }}>
            <button onClick={() => setDetailsOpen(v => !v)} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%",
              background: "none", border: "none", cursor: "pointer", padding: "0 0 13px", textAlign: "left",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
                <Car size={14} color={C.faint} style={{ flexShrink: 0 }} />
                <span style={{ fontFamily: F, fontWeight: 700, fontSize: 12.5, color: C.ink, flexShrink: 0 }}>Details</span>
                <span style={{ fontFamily: F, fontSize: 11.5, color: C.sub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {lead.model} · {lead.variant}{lead.color ? ` · ${lead.color}` : ""}
                </span>
              </div>
              <ChevronDown size={15} color={C.faint} style={{ flexShrink: 0, transform: detailsOpen ? "rotate(180deg)" : "none", transition: "transform .15s" }} />
            </button>
            {detailsOpen && (
            <div style={{ paddingTop: 0, paddingBottom: 12, borderTop: `1px solid ${C.border}` }}>
              <div style={{ margin: "12px 0 8px" }}>
                <span style={{ fontFamily: F, fontWeight: 700, fontSize: 11.5, color: C.faint, textTransform: "uppercase", letterSpacing: 0.4 }}>Vehicles</span>
              </div>
              <VehicleTabsSection lead={lead} onUpdateVehicles={onUpdateVehicles} />
              <EditableRow label="Budget" value={lead.budget} placeholder="e.g. ₹12–14 L" onSave={v => onUpdateLeadField(lead.id, "budget", v)} />
              <EditableRow label="Purchase Target Date" value={lead.targetDate} placeholder="e.g. 15 Jul" onSave={v => onUpdateLeadField(lead.id, "targetDate", v)} />
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderTop: `1px solid ${C.border}` }}>
                <span style={{ fontFamily: F, fontSize: 12, color: C.sub }}>Lead Age</span>
                <span style={{ fontFamily: F, fontSize: 12.5, color: C.ink, fontWeight: 600 }}>{daysAgo(lead.created)} days</span>
              </div>
            </div>
            )}
            <EscalationInline lead={lead} onEscalate={onEscalate} />
      </div>

      {lead.stage === "Delivered" && (
        <DeliveryPhotosCard lead={lead} onAddPhoto={onAddDeliveryPhoto} onShare={onShareDelivery} />
      )}

      {/* Timeline with search + filter */}
      {(() => {
        const [tlQuery, setTlQuery] = React.useState("");
        const [tlFilter, setTlFilter] = React.useState(null); // null | "call" | "booking" | "note"
        const timelineTypes = [...new Set((lead.timeline || []).map(t => t.type))];
        const filteredTimeline = (lead.timeline || []).filter(t => {
          const q = tlQuery.toLowerCase();
          const matchQ = !q || t.text?.toLowerCase().includes(q);
          const matchF = !tlFilter || t.type === tlFilter;
          return matchQ && matchF;
        });
        return (
      <div style={{ background: C.card, borderRadius: 14, padding: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 6px 18px rgba(0,0,0,0.075)" }}>
        <div style={{ fontFamily: F, fontWeight: 700, fontSize: 12.5, color: C.ink, marginBottom: 10 }}>Timeline</div>
        <div style={{ display: "flex", alignItems: "center", gap: 7, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "7px 10px", marginBottom: 8 }}>
          <Search size={12} color={C.faint} />
          <input value={tlQuery} onChange={e => setTlQuery(e.target.value)} placeholder="Search activity…"
            style={{ flex: 1, border: "none", outline: "none", fontFamily: F, fontSize: 12, background: "none", color: C.ink }} />
          {tlQuery && <X size={12} color={C.faint} style={{ cursor: "pointer" }} onClick={() => setTlQuery("")} />}
        </div>
        {timelineTypes.length > 1 && (
          <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
            <button onClick={() => setTlFilter(null)} style={chipStyle(!tlFilter)}>All</button>
            {timelineTypes.map(ty => (
              <button key={ty} onClick={() => setTlFilter(ty === tlFilter ? null : ty)} style={chipStyle(tlFilter === ty, true)}>
                {ty.charAt(0).toUpperCase() + ty.slice(1)}
              </button>
            ))}
          </div>
        )}
        {filteredTimeline.length === 0 && <div style={{ fontFamily: F, fontSize: 12, color: C.faint, padding: "8px 0" }}>No activity matches.</div>}
        {filteredTimeline.map((t, i) => {
          const Icon = timelineIcon[t.type] || Clock;
          const clickable = t.type === "quote" && t.quoteDetails;
          const Wrapper = clickable ? "button" : "div";
          return (
            <div key={i} style={{ display: "flex", gap: 10, position: "relative", paddingBottom: i === filteredTimeline.length - 1 ? 0 : 16 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <span style={{
                  width: 26, height: 26, borderRadius: "50%", background: C.primarySoft, display: "flex",
                  alignItems: "center", justifyContent: "center", flexShrink: 0
                }}><Icon size={13} color={C.primary} /></span>
                {i !== lead.timeline.length - 1 && <span style={{ width: 1.5, flex: 1, background: C.border, marginTop: 2 }} />}
              </div>
              <Wrapper
                onClick={clickable ? () => setViewingQuote(t.quoteDetails) : undefined}
                style={{
                  paddingBottom: 4, background: "none", border: "none", textAlign: "left", cursor: clickable ? "pointer" : "default",
                  padding: 0, width: "100%"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ fontFamily: F, fontSize: 12.5, color: clickable ? C.primary : C.ink, fontWeight: clickable ? 700 : 500 }}>{t.text}</span>
                  {clickable && <ChevronRight size={12} color={C.primary} />}
                </div>
                <div style={{ fontFamily: F, fontSize: 11, color: C.faint, marginTop: 2 }}>{fmtFull(t.date)}</div>
              </Wrapper>
            </div>
          );
        })}
      </div>

      );})()}

      {viewingQuote && <QuoteDetailSheet quote={viewingQuote} onClose={() => setViewingQuote(null)} />}

      {waTemplateOpen && (
        <WhatsAppTemplateSheet
          lead={lead}
          user={userById(currentId)}
          onSend={(text) => {
            setWaTemplateOpen(false);
            onWhatsApp(lead);
            setWaLogExpanded(true);
          }}
          onClose={() => setWaTemplateOpen(false)}
        />
      )}
    </div>
  );
}

/* ============================== ACTIVITY TAB ============================== */
/* ============================== CHART PRIMITIVES ==============================
   Hand-rolled SVG rather than a charting library — these are small, fixed shapes and a
   dependency would cost more than it saves. Each one is built to read at a glance on a
   phone: no axes unless they earn their place, values on the marks themselves. */

// Horizontal bars. Better than vertical on a narrow screen because the label sits inline
// and long category names don't have to be rotated or truncated.
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

/* ============================== COMMISSION ==============================
   Two design problems here, and they pull against each other.

   First: a rep who sees a rupee figure on every car starts steering customers toward
   whatever pays best, which produces bad-fit sales and comes back as cancellations. So
   inventory carries a *relative* signal, not a headline number — small, muted, and never
   competing with stock status. The exact rupees live in one place the rep goes to on
   purpose.

   Second: the interesting thing about commission in auto retail is not the total. It's
   that most reps under-earn on attachments rather than on volume — a rep selling 7 cars
   with warranty and insurance attached out-earns one selling 9 without. So the earnings
   tab leads with what was left on the table, not with the balance. */

const COMMISSION = {
  // Per-unit base. Slower-moving stock pays more — that's the dealership steering the
  // floor, and it's the one place a commission number *should* influence what gets pushed.
  base: {
    "Creta": 6000, "Venue": 5000, "Verna": 6500, "i20": 4500,
    "Alcazar": 9000, "Exter": 4000, "Tucson": 14000, "Ioniq 5": 18000,
  },
  // Attachment rates — where the real money is.
  rates: {
    accessories:  { pct: 1.5, label: "Accessories",       typical: 42000 },
    warranty:     { pct: 5.0, label: "Extended warranty", typical: 22000 },
    insurance:    { pct: 3.0, label: "Insurance",         typical: 38000 },
    finance:      { flat: 2500, label: "Finance",         typical: null },
    exchange:     { flat: 3000, label: "Exchange",        typical: null },
  },
  // Volume kicker, paid retrospectively on every unit once the tier is crossed.
  tiers: [{ at: 6, bonus: 8000 }, { at: 8, bonus: 15000 }, { at: 10, bonus: 25000 }],
};

const attachValue = (k) => {
  const r = COMMISSION.rates[k];
  return r.flat != null ? r.flat : Math.round((r.typical * r.pct) / 100);
};

// Full potential on one car, if every attachment lands.
function commissionFor(model) {
  const base = COMMISSION.base[model] || 5000;
  const parts = Object.keys(COMMISSION.rates).map(k => ({ key: k, label: COMMISSION.rates[k].label, value: attachValue(k) }));
  const attachTotal = parts.reduce((n, p) => n + p.value, 0);
  return { base, parts, attachTotal, max: base + attachTotal };
}

const inrShort = (n) =>
  n >= 100000 ? `₹${(n / 100000).toFixed(2)}L` : n >= 1000 ? `₹${(n / 1000).toFixed(1)}k` : `₹${n}`;

/* ---- Inventory signal ----
   Deliberately small. It answers "roughly what does this one pay" without inviting the rep
   to rank the yard by earnings. */
function CommissionChip({ model, compact }) {
  const c = commissionFor(model);
  if (compact) {
    return (
      <span title={`Up to ${inrShort(c.max)} with attachments`} style={{
        fontFamily: F, fontSize: 9, fontWeight: 700, color: C.faint, whiteSpace: "nowrap",
      }}>{inrShort(c.base)}+</span>
    );
  }
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: C.bg,
      borderRadius: 6, padding: "2px 7px" }}>
      <IndianRupee size={9} color={C.sub} />
      <span style={{ fontFamily: F, fontSize: 9.5, fontWeight: 700, color: C.sub }}>
        {inrShort(c.base)}–{inrShort(c.max)}
      </span>
    </span>
  );
}

// Shown inside an expanded unit, where the rep has already chosen to look.
function CommissionBreakup({ model }) {
  const [open, setOpen] = useState(false);
  const c = commissionFor(model);
  return (
    <div style={{ marginTop: 9 }}>
      <button onClick={() => setOpen(o => !o)} style={{
        display: "flex", alignItems: "center", gap: 7, width: "100%", background: "none",
        border: `1px dashed ${C.borderStrong}`, borderRadius: 8, padding: "8px 10px", cursor: "pointer",
      }}>
        <IndianRupee size={11} color={C.sub} />
        <span style={{ flex: 1, textAlign: "left", fontFamily: F, fontSize: 10.5, fontWeight: 700, color: C.sub }}>
          Your commission · {inrShort(c.base)} base, up to {inrShort(c.max)}
        </span>
        <ChevronDown size={12} color={C.faint} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .18s" }} />
      </button>
      {open && (
        <div style={{ background: C.bg, borderRadius: 9, padding: 11, marginTop: 7 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontFamily: F, fontSize: 11, fontWeight: 700, color: C.ink }}>Unit base</span>
            <span style={{ fontFamily: F, fontSize: 11, fontWeight: 800, color: C.ink }}>{inrShort(c.base)}</span>
          </div>
          {c.parts.map(p => (
            <div key={p.key} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontFamily: F, fontSize: 10.5, color: C.sub }}>
                {p.label}
                <span style={{ color: C.faint }}>
                  {COMMISSION.rates[p.key].flat != null ? " · flat" : ` · ${COMMISSION.rates[p.key].pct}%`}
                </span>
              </span>
              <span style={{ fontFamily: F, fontSize: 10.5, fontWeight: 700, color: C.green }}>+{inrShort(p.value)}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 7, paddingTop: 7,
            borderTop: `1px solid ${C.borderStrong}` }}>
            <span style={{ fontFamily: F, fontSize: 10.5, color: C.faint }}>Everything attached</span>
            <span style={{ fontFamily: F, fontSize: 12, fontWeight: 900, color: C.ink }}>{inrShort(c.max)}</span>
          </div>
          <div style={{ fontFamily: F, fontSize: 9.5, color: C.faint, marginTop: 7, lineHeight: 1.45 }}>
            Attachments are worth more than the car on most units. Warranty and insurance are
            the two that move this number.
          </div>
        </div>
      )}
    </div>
  );
}

/* ---- Earnings ----
   Rebuilt around one principle: a rep should be able to trace every rupee back to a car.
   Aggregate charts fail that test — they say "you earned 59k" without saying which sale
   paid what, so the rep can't learn which behaviour produced the money.

   Also deliberately positive. An earnings screen that opens with what you lost is a
   demotivator dressed as analytics. Attachments appear as what they added, and the tier
   ladder as what's still reachable — same information, and a rep will actually open it
   twice. */

const DEAL_NAMES = [
  "Lakshmi Narayan", "Ravi Teja", "Neha Verma", "Amit Joshi", "Sneha Kulkarni",
  "Farhan Khan", "Priya Desai", "Vikram Rao", "Anita Shetty", "George Thomas",
  "Meena Rao", "Deepa Menon",
];

const isoDay = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const monthStart = (back = 0) => new Date(today.getFullYear(), today.getMonth() - back, 1);
const monthEnd = (back = 0) => new Date(today.getFullYear(), today.getMonth() - back + 1, 0);

function EarningsPanel({ history }) {
  const [openDeal, setOpenDeal] = useState(null);
  const [preset, setPreset] = useState("this");
  const [from, setFrom] = useState(isoDay(monthStart(0)));
  const [to, setTo] = useState(isoDay(today));

  // Every retail across the history, with a real date so any range can be applied.
  const allDeals = useMemo(() => {
    const retails = history.filter(r => r.retailed);
    let n = 7;
    const rnd = () => { n = (n * 1103515245 + 12345) & 0x7fffffff; return n / 0x7fffffff; };
    return retails.map((r, i) => {
      // A retail can't be dated in the future, so the current month is capped at today.
      const isCurrent = r.month.getMonth() === today.getMonth() && r.month.getFullYear() === today.getFullYear();
      const maxDay = isCurrent ? Math.max(1, today.getDate()) : 27;
      const day = 1 + Math.floor(rnd() * maxDay);
      const date = new Date(r.month.getFullYear(), r.month.getMonth(), Math.min(day, maxDay));
      return {
        id: i,
        name: DEAL_NAMES[i % DEAL_NAMES.length],
        model: r.model,
        delivered: r.delivered,
        date,
        attached: {
          accessories: rnd() < 0.55,
          warranty:    rnd() < 0.42,
          insurance:   rnd() < 0.71,
          finance:     rnd() < 0.62,
          exchange:    rnd() < 0.38,
        },
      };
    }).sort((a, b) => b.date - a.date);
  }, [history]);

  const applyPreset = (k) => {
    setPreset(k);
    if (k === "this")  { setFrom(isoDay(monthStart(0))); setTo(isoDay(today)); }
    if (k === "last")  { setFrom(isoDay(monthStart(1))); setTo(isoDay(monthEnd(1))); }
    if (k === "q")     { setFrom(isoDay(monthStart(2))); setTo(isoDay(today)); }
  };

  const fromD = new Date(from + "T00:00:00");
  const toD = new Date(to + "T23:59:59");
  const deals = allDeals.filter(d => d.date >= fromD && d.date <= toD);
  const rangeLabel = preset === "this" ? "this month"
    : preset === "last" ? "last month"
    : preset === "q" ? "last 3 months"
    : `${fmt(fromD)} – ${fmt(toD)}`;

  const lineItems = (d) => {
    const c = commissionFor(d.model);
    const rows = [{ label: `${d.model} — unit commission`, value: c.base, base: true }];
    Object.keys(d.attached).forEach(k => {
      if (!d.attached[k]) return;
      const r = COMMISSION.rates[k];
      rows.push({
        label: r.label,
        note: r.flat != null ? "flat rate" : `${r.pct}% of ${inrShort(r.typical)}`,
        value: attachValue(k),
      });
    });
    return rows;
  };
  const earnedOn = (d) => lineItems(d).reduce((n, r) => n + r.value, 0);

  const delivered = deals.filter(d => d.delivered);
  const awaiting  = deals.filter(d => !d.delivered);

  const baseTotal   = delivered.reduce((n, d) => n + (COMMISSION.base[d.model] || 5000), 0);
  const attachTotal = delivered.reduce((n, d) => n + earnedOn(d), 0) - baseTotal;
  const attachCount = delivered.reduce((n, d) => n + Object.values(d.attached).filter(Boolean).length, 0);

  // Tier is decided on delivered units and pays across all of them, not just the ones
  // after the threshold — which is exactly why it's worth spelling out.
  const units = delivered.length;

  // The volume bonus is a monthly scheme, so across a multi-month range it has to be
  // worked out per calendar month and summed — not applied once to the range total.
  const monthKey = (d) => `${d.getFullYear()}-${d.getMonth()}`;
  const perMonth = {};
  delivered.forEach(d => { const k = monthKey(d.date); perMonth[k] = (perMonth[k] || 0) + 1; });
  const monthsInRange = Object.keys(perMonth);
  const bonus = monthsInRange.reduce((sum, k) => {
    const t = [...COMMISSION.tiers].reverse().find(x => perMonth[k] >= x.at);
    return sum + (t ? t.bonus : 0);
  }, 0);

  // The ladder below only makes sense against a single month, so it tracks the current
  // month's own count rather than the range.
  const thisMonthUnits = perMonth[monthKey(today)] || 0;
  const singleMonth = monthsInRange.length <= 1;
  const tier = [...COMMISSION.tiers].reverse().find(t => thisMonthUnits >= t.at) || null;
  const nextTier = COMMISSION.tiers.find(t => thisMonthUnits < t.at);
  const total = baseTotal + attachTotal + bonus;
  const pendingTotal = awaiting.reduce((n, d) => n + earnedOn(d), 0);

  return (
    <div>
      {/* Range. Presets cover the everyday cases; custom is there for a payroll query or
          a month that has already closed. */}
      <div style={{ display: "flex", gap: 5, marginBottom: 8 }}>
        {[["this", "This month"], ["last", "Last month"], ["q", "3 months"], ["custom", "Custom"]].map(([k, l]) => {
          const on = preset === k;
          return (
            <button key={k} onClick={() => k === "custom" ? setPreset("custom") : applyPreset(k)} style={{
              flex: 1, padding: "8px 0", borderRadius: 9, cursor: "pointer",
              border: `1.5px solid ${on ? C.primary : C.border}`,
              background: on ? C.primarySoft : C.card, color: on ? C.primary : C.sub,
              fontFamily: F, fontWeight: 700, fontSize: 11,
            }}>{l}</button>
          );
        })}
      </div>

      {preset === "custom" && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.card,
          border: `1px solid ${C.border}`, borderRadius: 11, padding: "10px 12px", marginBottom: 10 }}>
          <input type="date" value={from} max={to} onChange={e => setFrom(e.target.value)}
            style={{ flex: 1, minWidth: 0, border: `1.5px solid ${C.borderStrong}`, borderRadius: 8,
              padding: "7px 9px", fontFamily: F, fontSize: 12, color: C.ink, background: C.card, outline: "none" }} />
          <span style={{ fontFamily: F, fontSize: 11, color: C.faint, flexShrink: 0 }}>to</span>
          <input type="date" value={to} min={from} max={isoDay(today)} onChange={e => setTo(e.target.value)}
            style={{ flex: 1, minWidth: 0, border: `1.5px solid ${C.borderStrong}`, borderRadius: 8,
              padding: "7px 9px", fontFamily: F, fontSize: 12, color: C.ink, background: C.card, outline: "none" }} />
        </div>
      )}

      {/* Headline */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 15, marginBottom: 10 }}>
        <div style={{ fontFamily: F, fontSize: 9.5, fontWeight: 800, color: C.faint,
          textTransform: "uppercase", letterSpacing: 0.6 }}>Earned · {rangeLabel}</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 5 }}>
          <span style={{ fontFamily: F, fontSize: 34, fontWeight: 900, color: C.ink, letterSpacing: -1.4, lineHeight: 1 }}>
            {inrShort(total)}
          </span>
          <span style={{ fontFamily: F, fontSize: 11.5, color: C.sub }}>on {units} deliveries</span>
        </div>

        {/* Where it came from — three lines, each traceable below. */}
        <div style={{ marginTop: 13, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
          {[
            { l: `Unit commission · ${units} cars`, v: baseTotal, c: C.ink },
            { l: `Add-ons · ${attachCount} attached`, v: attachTotal, c: C.green },
            { l: singleMonth ? (tier ? `Volume bonus · ${tier.at}+ tier` : "Volume bonus · not reached")
                             : `Volume bonus · ${monthsInRange.length} months`,
              v: bonus, c: bonus ? C.primary : C.ghost },
          ].map(r => (
            <div key={r.l} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
              <span style={{ fontFamily: F, fontSize: 11.5, color: C.sub }}>{r.l}</span>
              <span style={{ fontFamily: F, fontSize: 13, fontWeight: 800, color: r.c }}>
                {r.v ? inrShort(r.v) : "—"}
              </span>
            </div>
          ))}
        </div>

        {pendingTotal > 0 && (
          <div style={{ display: "flex", gap: 7, background: C.bg, borderRadius: 9, padding: "9px 10px", marginTop: 5 }}>
            <Clock size={12} color={C.sub} style={{ flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontFamily: F, fontSize: 10.5, color: C.sub, lineHeight: 1.45 }}>
              A further <strong>{inrShort(pendingTotal)}</strong> across {awaiting.length} booked cars,
              payable once they're delivered.
            </span>
          </div>
        )}
      </div>

      {/* Volume bonus, explained rather than asserted. */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14, marginBottom: 10 }}>
        <div style={{ fontFamily: F, fontSize: 12.5, fontWeight: 800, color: C.ink, marginBottom: 3 }}>
          How the volume bonus works
        </div>
        <div style={{ fontFamily: F, fontSize: 10.5, color: C.faint, marginBottom: 12, lineHeight: 1.45 }}>
          Cross a tier and the bonus is paid on the whole month, not only the cars after it.
        </div>

        {COMMISSION.tiers.map(t => {
          const reached = thisMonthUnits >= t.at;
          const current = tier && tier.at === t.at;
          return (
            <div key={t.at} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "9px 11px", marginBottom: 6,
              borderRadius: 10, background: current ? C.primarySoft : C.bg,
              border: `1.5px solid ${current ? C.primary : "transparent"}`,
            }}>
              <span style={{
                width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                background: reached ? C.green : C.borderStrong,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {reached ? <Check size={12} color="#fff" strokeWidth={3} />
                         : <span style={{ fontFamily: F, fontSize: 9.5, fontWeight: 800, color: "#fff" }}>{t.at}</span>}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontFamily: F, fontSize: 11.5, fontWeight: 700,
                  color: reached ? C.ink : C.sub }}>{t.at} deliveries</span>
                {current && (
                  <span style={{ display: "block", fontFamily: F, fontSize: 9.5, color: C.primary, fontWeight: 700, marginTop: 1 }}>
                    You're here — {thisMonthUnits} delivered this month
                  </span>
                )}
              </span>
              <span style={{ fontFamily: F, fontSize: 12.5, fontWeight: 800,
                color: reached ? C.green : C.ghost }}>{inrShort(t.bonus)}</span>
            </div>
          );
        })}

        {nextTier && (
          <div style={{ display: "flex", gap: 7, background: C.greenSoft, borderRadius: 9, padding: "10px 11px", marginTop: 5 }}>
            <TrendingUp size={13} color={C.green} style={{ flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontFamily: F, fontSize: 10.5, color: C.green, lineHeight: 1.5 }}>
              <strong>{nextTier.at - thisMonthUnits} more {nextTier.at - thisMonthUnits === 1 ? "delivery" : "deliveries"}</strong> moves you to the {nextTier.at}+ tier —
              worth {inrShort(nextTier.bonus - (tier ? tier.bonus : 0))} more than where you are now.
            </span>
          </div>
        )}
      </div>

      {deals.length === 0 && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12,
          padding: 22, textAlign: "center", fontFamily: F, fontSize: 12.5, color: C.sub, marginBottom: 10 }}>
          No retails in this range.
        </div>
      )}

      {/* The ledger. Every rupee traceable to a car. */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14, marginBottom: 10 }}>
        <div style={{ fontFamily: F, fontSize: 12.5, fontWeight: 800, color: C.ink, marginBottom: 3 }}>
          What each car paid
        </div>
        <div style={{ fontFamily: F, fontSize: 10.5, color: C.faint, marginBottom: 11, lineHeight: 1.45 }}>
          Tap a sale to see how it was made up.
        </div>

        {delivered.map(d => {
          const open = openDeal === d.id;
          const items = lineItems(d);
          const amt = earnedOn(d);
          const addOns = items.length - 1;
          return (
            <div key={d.id} style={{ borderBottom: `1px solid ${C.border}` }}>
              <button onClick={() => setOpenDeal(open ? null : d.id)} style={{
                display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "10px 0",
                background: "none", border: "none", cursor: "pointer", textAlign: "left",
              }}>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontFamily: F, fontSize: 12, fontWeight: 700, color: C.ink,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.name}</span>
                  <span style={{ display: "block", fontFamily: F, fontSize: 10, color: C.faint, marginTop: 1 }}>
                    {d.model} · {addOns ? `${addOns} add-on${addOns > 1 ? "s" : ""}` : "no add-ons"}
                  </span>
                </span>
                <span style={{ fontFamily: F, fontSize: 13.5, fontWeight: 800, color: C.ink }}>{inrShort(amt)}</span>
                <ChevronDown size={13} color={C.faint} style={{ flexShrink: 0,
                  transform: open ? "rotate(180deg)" : "none", transition: "transform .18s" }} />
              </button>

              {open && (
                <div style={{ background: C.bg, borderRadius: 9, padding: 11, marginBottom: 10 }}>
                  {items.map((r, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline",
                      gap: 8, marginBottom: 5 }}>
                      <span style={{ minWidth: 0 }}>
                        <span style={{ fontFamily: F, fontSize: 11, color: C.ink, fontWeight: r.base ? 700 : 500 }}>{r.label}</span>
                        {r.note && <span style={{ display: "block", fontFamily: F, fontSize: 9.5, color: C.faint }}>{r.note}</span>}
                      </span>
                      <span style={{ fontFamily: F, fontSize: 11.5, fontWeight: 700, flexShrink: 0,
                        color: r.base ? C.ink : C.green }}>{r.base ? "" : "+"}{inrShort(r.value)}</span>
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, paddingTop: 8,
                    borderTop: `1px solid ${C.borderStrong}` }}>
                    <span style={{ fontFamily: F, fontSize: 11, fontWeight: 700, color: C.sub }}>This sale</span>
                    <span style={{ fontFamily: F, fontSize: 13, fontWeight: 900, color: C.ink }}>{inrShort(amt)}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* The lever, stated as what add-ons contributed rather than what was missed. */}
        {attachTotal > 0 && (
          <div style={{ display: "flex", gap: 7, background: C.greenSoft, borderRadius: 9, padding: "10px 11px", marginTop: 12 }}>
            <Sparkles size={13} color={C.green} style={{ flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontFamily: F, fontSize: 10.5, color: C.green, lineHeight: 1.5 }}>
              Add-ons brought in <strong>{inrShort(attachTotal)}</strong> — {pct(attachTotal, total)}% of everything
              you earned this month, from {attachCount} attachments across {units} cars.
            </span>
          </div>
        )}
      </div>

      <div style={{ fontFamily: F, fontSize: 9.5, color: C.faint, lineHeight: 1.5, padding: "0 2px" }}>
        Indicative — settles against the payroll statement. Commission pays on delivery.
      </div>
    </div>
  );
}

function SEDashboardScreen({ leads, user }) {
  const [months, setMonths] = useState(1);        // 1 | 3 | 6
  const [dim, setDim] = useState("month");        // month | source | model
  const [drill, setDrill] = useState(null);
  const [tab, setTab] = useState("funnel");

  const history = useMemo(() => buildHistory(11), []);

  // Current window and the equivalent window immediately before it, so every comparison
  // is like-for-like rather than "this month vs a full quarter".
  const inWindow = history.filter(r => r.monthIdx < months);
  const prevWindow = history.filter(r => r.monthIdx >= months && r.monthIdx < months * 2);

  const totals = funnelOf(inWindow);
  const prevTotals = funnelOf(prevWindow);

  const group = (rowsIn, keyFn, order) => {
    const map = {};
    rowsIn.forEach(r => { const k = keyFn(r); (map[k] = map[k] || []).push(r); });
    const keys = order || Object.keys(map).sort();
    return keys.filter(k => map[k]).map(k => ({ label: k, values: funnelOf(map[k]), rows: map[k] }));
  };

  const monthRows = (() => {
    const out = [];
    for (let m = months - 1; m >= 0; m--) {
      const rowsM = history.filter(r => r.monthIdx === m);
      if (!rowsM.length) continue;
      out.push({
        label: rowsM[0].month.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
        values: funnelOf(rowsM), rows: rowsM,
      });
    }
    return out;
  })();

  const bySource = group(inWindow, r => r.source).sort((a, b) => b.values.leads - a.values.leads);
  const byModel  = group(inWindow, r => r.model).sort((a, b) => b.values.leads - a.values.leads);

  const tableRows = dim === "month" ? monthRows : dim === "source" ? bySource : byModel;

  const insights = useMemo(
    () => buildInsights({ rows: inWindow, totals, prevTotals, bySource, byModel, role: "se" }),
    [months]
  );

  // Current-month KPIs always compare to last month, regardless of the window above —
  // "this month vs last month" is the question a rep is actually asked.
  const thisM = funnelOf(history.filter(r => r.monthIdx === 0));
  const lastM = funnelOf(history.filter(r => r.monthIdx === 1));

  const RANGES = [{ k: 1, l: "This month" }, { k: 3, l: "3 months" }, { k: 6, l: "6 months" }];
  const DIMS = [{ k: "month", l: "By month" }, { k: "source", l: "By source" }, { k: "model", l: "By model" }];

  const drillRow = tableRows.find(r => r.label === drill);

  return (
    <div style={{ padding: "14px 14px 90px" }}>
      <div style={{ fontFamily: F, fontWeight: 800, fontSize: 15, color: C.ink }}>Dashboard</div>
      <div style={{ fontFamily: F, fontSize: 11, color: C.sub, marginTop: 1, marginBottom: 12 }}>
        {tab === "funnel" ? "Your funnel, where it leaks, and what to do about it" : "What you have earned this month, and where it came from"}
      </div>

      {/* Money is kept behind its own tab so the funnel view stays about customers. */}
      <div style={{ display: "flex", gap: 5, marginBottom: 12 }}>
        {[["funnel", "Performance"], ["earnings", "Earnings"]].map(([k, l]) => {
          const on = tab === k;
          return (
            <button key={k} onClick={() => setTab(k)} style={{
              flex: 1, padding: "9px 0", borderRadius: 10, cursor: "pointer",
              border: `1.5px solid ${on ? C.primary : C.border}`,
              background: on ? C.primarySoft : C.card, color: on ? C.primary : C.sub,
              fontFamily: F, fontWeight: 800, fontSize: 12,
            }}>{l}</button>
          );
        })}
      </div>

      {tab === "earnings" && <EarningsPanel history={history} />}
      {tab === "funnel" && (<>

      {/* ---- KPI strip: always this month vs last ---- */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        <KpiTile label="Contacted · this month" value={thisM.contacted} prev={lastM.contacted} />
        <KpiTile label="Test drives · this month" value={thisM.visit} prev={lastM.visit} accent={C.primary} />
        <KpiTile label="Bookings · this month" value={thisM.booking} prev={lastM.booking} accent={C.warm} />
        <KpiTile label="Retailed · this month" value={thisM.retailed} prev={lastM.retailed} accent={C.darkGreen} />
      </div>

      {/* ---- Period ---- */}
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

      {/* ---- The main table ---- */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 13, marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <span style={{ flex: 1, fontFamily: F, fontSize: 12.5, fontWeight: 800, color: C.ink }}>Lead funnel</span>
          <span style={{ fontFamily: F, fontSize: 10, color: C.faint }}>
            {totals.leads} leads · {pct(totals.retailed, totals.leads)}% retail
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

      {/* Tapping a row explains that slice on its own terms. */}
      {drillRow && (
        <div style={{ background: C.primarySoft, border: `1px solid ${C.primary}33`, borderRadius: 12,
          padding: 12, marginBottom: 10 }}>
          <div style={{ fontFamily: F, fontSize: 12, fontWeight: 800, color: C.primary, marginBottom: 6 }}>
            {drillRow.label}
          </div>
          <div style={{ fontFamily: F, fontSize: 11, color: C.sub, lineHeight: 1.55 }}>
            {drillRow.values.leads} leads · {drillRow.values.visit} test drives
            ({pct(drillRow.values.visit, drillRow.values.leads)}%) ·
            {" "}{drillRow.values.retailed} retailed ({pct(drillRow.values.retailed, drillRow.values.leads)}%).
            {" "}{pct(drillRow.values.retailed, drillRow.values.leads) > pct(totals.retailed, totals.leads)
              ? "Converting above your overall average — worth more of your time."
              : "Converting below your overall average."}
          </div>
        </div>
      )}

      {/* ---- Insights ---- */}
      <div style={{ display: "flex", alignItems: "center", gap: 7, margin: "14px 0 9px" }}>
        <Sparkles size={14} color={C.primary} />
        <span style={{ fontFamily: F, fontSize: 12.5, fontWeight: 800, color: C.ink }}>What this is telling you</span>
      </div>
      {insights.length === 0
        ? <div style={{ fontFamily: F, fontSize: 11.5, color: C.faint }}>Not enough data in this period to draw anything useful.</div>
        : insights.map((ins, i) => <InsightCard key={i} insight={ins} />)}
      </>)}
    </div>
  );
}

function ActivityScreen({ leads, onOpenLead }) {
  const [sub, setSub] = useState("calls");

  const calls = leads.flatMap(l => l.timeline.filter(t => t.type === "call").map(t => ({ ...t, lead: l })))
    .sort((a, b) => b.date - a.date);
  const testDrives = leads.flatMap(l => l.timeline.filter(t => t.type === "test-drive").map(t => ({ ...t, lead: l })))
    .sort((a, b) => b.date - a.date);
  const bookings = leads.flatMap(l => l.timeline.filter(t => t.type === "booking").map(t => ({ ...t, lead: l })))
    .sort((a, b) => b.date - a.date);
  const deliveries = leads.flatMap(l => l.timeline.filter(t => t.type === "delivery").map(t => ({ ...t, lead: l })))
    .sort((a, b) => b.date - a.date);

  const tabs = [
    { key: "calls", label: "Calls", data: calls, icon: Phone },
    { key: "testdrives", label: "Test Drives", data: testDrives, icon: Car },
    { key: "bookings", label: "Bookings", data: bookings, icon: Package },
    { key: "delivery", label: "Delivery", data: deliveries, icon: CarFront },
  ];

  // Search and filters over the activity feed. Committed on Enter, like every other search
  // in the app, so a half-typed name doesn't empty the list.
  const [queryDraft, setQueryDraft] = useState("");
  const [query, setQuery] = useState("");
  const [modelFilter, setModelFilter] = useState([]);
  const [periodFilter, setPeriodFilter] = useState(null); // null | 7 | 30
  const runSearch = () => setQuery(queryDraft.trim());
  const clearSearch = () => { setQueryDraft(""); setQuery(""); };
  const activityModels = [...new Set(leads.map(l => l.model).filter(Boolean))].sort();
  const filtersOn = !!(query || modelFilter.length || periodFilter);

  const applyFilters = (rows) => rows.filter(r => {
    const q = query.toLowerCase();
    if (q && !(r.lead.name.toLowerCase().includes(q)
      || (r.lead.model || "").toLowerCase().includes(q)
      || (r.text || "").toLowerCase().includes(q))) return false;
    if (modelFilter.length && !modelFilter.includes(r.lead.model)) return false;
    if (periodFilter && (today - new Date(r.date)) / 864e5 > periodFilter) return false;
    return true;
  });

  const rawActive = tabs.find(t => t.key === sub);
  const activeTab = { ...rawActive, data: applyFilters(rawActive.data) };

  return (
    <div style={{ padding: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.card, border: `1.5px solid ${query ? C.primary : C.borderStrong}`, borderRadius: 11, padding: "9px 12px", marginBottom: 8 }}>
        <Search size={14} color={C.faint} />
        <input value={queryDraft} onChange={e => setQueryDraft(e.target.value)}
          placeholder="Search customer, model or note…"
          type="search" inputMode="search" enterKeyHint="search"
          onKeyDown={e => { if (e.key === "Enter") { runSearch(); e.currentTarget.blur(); } }}
          style={{ border: "none", outline: "none", flex: 1, minWidth: 0, fontFamily: F, fontSize: 12.5, color: C.ink, background: "none", WebkitAppearance: "none" }} />
        {(queryDraft || query) && <button onClick={clearSearch} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}><X size={13} color={C.faint} /></button>}
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
        {[{ k: 7, l: "Last 7 days" }, { k: 30, l: "Last 30 days" }].map(p => (
          <button key={p.k} onClick={() => setPeriodFilter(periodFilter === p.k ? null : p.k)} style={chipStyle(periodFilter === p.k, true)}>{p.l}</button>
        ))}
        {activityModels.slice(0, 5).map(m => (
          <button key={m} onClick={() => setModelFilter(f => f.includes(m) ? f.filter(x => x !== m) : [...f, m])} style={chipStyle(modelFilter.includes(m), true)}>{m}</button>
        ))}
        {filtersOn && (
          <button onClick={() => { clearSearch(); setModelFilter([]); setPeriodFilter(null); }} style={{
            background: "none", border: "none", cursor: "pointer", fontFamily: F, fontSize: 11, fontWeight: 700, color: C.hot, padding: "4px 6px",
          }}>Clear</button>
        )}
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 14, background: C.border, borderRadius: 12, padding: 3 }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setSub(t.key)} style={{
            flex: 1, padding: "7px 4px", borderRadius: 9, border: "none", cursor: "pointer",
            background: sub === t.key ? C.card : "none",
            fontFamily: F, fontSize: 11.5, fontWeight: 700,
            color: sub === t.key ? C.primary : C.sub,
            boxShadow: sub === t.key ? "0 1px 3px rgba(0,0,0,.08)" : "none"
          }}>{t.label}</button>
        ))}
      </div>

      {activeTab.data.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 10px", color: C.faint, fontFamily: F, fontSize: 13 }}>
          No {activeTab.label.toLowerCase()} yet.
        </div>
      )}

      {activeTab.data.map((row, i) => (
        <div key={i} onClick={() => onOpenLead(row.lead.id)} style={{
          display: "flex", alignItems: "center", gap: 11, background: C.card, border: `1px solid ${C.border}`,
          borderRadius: 12, padding: "10px 12px", marginBottom: 8, cursor: "pointer"
        }}>
          <span style={{
            width: 34, height: 34, borderRadius: "50%", background: C.primarySoft, display: "flex",
            alignItems: "center", justifyContent: "center", flexShrink: 0
          }}><activeTab.icon size={16} color={C.primary} /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: F, fontWeight: 700, fontSize: 13, color: C.ink }}>{row.lead.name}</div>
            <div style={{ fontFamily: F, fontSize: 11.5, color: C.sub, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {row.text}
            </div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0, display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ fontFamily: F, fontSize: 11, color: C.faint, fontWeight: 600 }}>{fmt(row.date)}</div>
            <ChevronRight size={14} color={C.faint} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ============================== LEARNING MODULE ============================== */
// Product-knowledge reference for the sales floor: why our model wins against the customer's
// other shortlisted options, common objections and how to answer them, and what independent
// reviewers tend to highlight — so an SE walking into a comparison conversation has the
// talking points ready instead of improvising.
const LEARNING_CONTENT = {
  Creta: {
    segment: "Mid-size SUV",
    competitors: ["Kia Seltos", "Maruti Grand Vitara", "Honda Elevate"],
    keyStrengths: [
      "Widest service network in the segment — matters most to buyers outside metro cities",
      "Strongest resale value of any mid-size SUV, tracked over a 5-year hold",
      "Panoramic sunroof and ventilated seats available from a lower trim than most rivals",
    ],
    talkingPoints: [
      { vs: "Kia Seltos", points: [
        "Same platform and powertrains — Creta wins on resale value and service network density",
        "Creta's diesel-automatic combination is available where Seltos often isn't at every trim",
      ]},
      { vs: "Maruti Grand Vitara", points: [
        "Grand Vitara is hybrid-only for its best mileage figures — Creta offers a straightforward turbo-petrol for buyers who don't want hybrid running costs",
        "Creta's cabin trim and sunroof size are usually seen as a class above at the equivalent price point",
      ]},
      { vs: "Honda Elevate", points: [
        "Elevate is newer to the segment with a thinner dealer network in tier-2/3 towns",
        "Creta has a longer track record — a real point for buyers who ask about long-term reliability",
      ]},
    ],
    objectionHandling: [
      { objection: "\"Seltos looks sportier\"", response: "Agree it's a fair styling preference, then pivot to running cost: resale value and service cost over 5 years favour Creta noticeably." },
      { objection: "\"Why not the hybrid Grand Vitara for better mileage?\"", response: "Ask their real daily running — hybrids pay back mainly in heavy city traffic. For highway-heavy use, Creta's turbo-petrol is usually cheaper to own." },
    ],
    reviewThemes: [
      "Ride comfort and highway stability are consistently rated above segment average",
      "Cabin quality and features-for-price are the most repeated praise across reviewers",
      "Turbo-petrol DCT is frequently called out as the pick of the range for city + highway mix",
    ],
    searchTip: "Search \"Hyundai Creta 2025 review\" — Autocar India, CarWale, and CarDekho all have recent long-form reviews worth watching together with a customer if they're undecided.",
  },
  Venue: {
    segment: "Compact SUV",
    competitors: ["Tata Nexon", "Maruti Brezza"],
    keyStrengths: [
      "Turbo-petrol DCT option gives genuinely quick performance in the segment",
      "Feature list at mid-trim (sunroof, connected car tech) beats most rivals at the same price",
    ],
    talkingPoints: [
      { vs: "Tata Nexon", points: [
        "Nexon's 5-star crash rating is a strong pitch for them — don't dodge it, pivot to Venue's lower service cost and better infotainment responsiveness instead",
        "Venue's turbo-DCT is noticeably smoother in traffic than Nexon's AMT",
      ]},
      { vs: "Maruti Brezza", points: [
        "Brezza's mileage claim is close on paper — Venue's real-world city mileage is competitive and the turbo-petrol is more fun to drive",
        "Venue's cabin tech (sunroof, digital cluster) is available at a lower trim than Brezza's equivalent",
      ]},
    ],
    objectionHandling: [
      { objection: "\"Nexon is safer\"", response: "Acknowledge the crash rating directly — don't argue it. Then move to total cost of ownership and in-city drivability, where Venue is genuinely stronger." },
    ],
    reviewThemes: [
      "Turbo-petrol engine and DCT gearbox combination is the most-praised part of the range",
      "Reviewers consistently note the features-per-rupee value at the SX trim",
    ],
    searchTip: "Search \"Hyundai Venue N Line review\" for the sportier trim specifically — useful when a customer is cross-shopping on driving feel, not just space.",
  },
  i20: {
    segment: "Premium hatchback",
    competitors: ["Maruti Baleno", "Tata Altroz"],
    keyStrengths: [
      "Cabin quality and dashboard design are consistently rated best-in-class for the segment",
      "Diesel option available where most hatchback rivals have gone petrol-only",
    ],
    talkingPoints: [
      { vs: "Maruti Baleno", points: [
        "i20's cabin materials and fit-finish are usually seen as a clear step up",
        "Baleno wins on outright mileage — be upfront about this, then pivot to ride quality and NVH, where i20 leads",
      ]},
      { vs: "Tata Altroz", points: [
        "Altroz's 5-star safety rating is real — pivot to i20's stronger resale and lower long-term maintenance cost",
      ]},
    ],
    objectionHandling: [
      { objection: "\"Baleno gives better mileage\"", response: "True on paper — ask if they're cross-shopping on running cost or on how the car feels to drive daily. i20 wins clearly on the second." },
    ],
    reviewThemes: [
      "Interior design and build quality are the most consistently praised aspects",
      "Ride comfort at highway speed is repeatedly called out as segment-leading",
    ],
    searchTip: "Search \"Hyundai i20 vs Baleno comparison\" — several channels have done direct back-to-back tests that are useful to show a customer weighing both.",
  },
  Verna: {
    segment: "Mid-size sedan",
    competitors: ["Honda City", "Skoda Slavia"],
    keyStrengths: [
      "Only car in the segment offering a turbo-petrol with a proper sporty character",
      "ADAS (driver assistance) available at a lower trim than most segment rivals",
    ],
    talkingPoints: [
      { vs: "Honda City", points: [
        "City has a stronger brand reputation for reliability — don't dismiss it, but point to Verna's turbo-petrol performance and ADAS availability as real differentiators",
      ]},
      { vs: "Skoda Slavia", points: [
        "Slavia has a European road-manners reputation — Verna counters with a much larger dealer and service network",
      ]},
    ],
    objectionHandling: [
      { objection: "\"Honda has a better reliability reputation\"", response: "Fair point historically — pivot to Verna's warranty terms and the fact that recent JD Power/quality survey gaps between Korean and Japanese brands have narrowed significantly." },
    ],
    reviewThemes: [
      "Turbo-petrol performance is the most repeated highlight — often called the most engaging car in its class to drive",
      "ADAS features at the price point are frequently flagged as excellent value",
    ],
    searchTip: "Search \"Hyundai Verna turbo review\" for driving-focused content — most useful when a customer explicitly asks about performance, not just comfort.",
  },
  Alcazar: {
    segment: "3-row SUV",
    competitors: ["Tata Safari", "Mahindra XUV700"],
    keyStrengths: [
      "Genuinely usable third row for shorter trips — not just an emergency seat",
      "Captain seat option in the 6-seat variant is a strong pitch for premium-feel buyers",
    ],
    talkingPoints: [
      { vs: "Tata Safari", points: [
        "Safari has more road presence — Alcazar counters with a noticeably better-finished cabin and lower service cost",
      ]},
      { vs: "Mahindra XUV700", points: [
        "XUV700 wins on raw power and ADAS tech — Alcazar counters on ride comfort, cabin refinement, and resale value",
      ]},
    ],
    objectionHandling: [
      { objection: "\"XUV700 has more powerful engines\"", response: "True on the top trim — ask about their actual use case. For city + occasional highway family use, Alcazar's refinement and comfort usually wins the comparison once they drive both." },
    ],
    reviewThemes: [
      "Third-row usability is repeatedly called out as better than most competitors at this price",
      "Cabin refinement and ride quality are consistently rated above the segment average",
    ],
    searchTip: "Search \"Hyundai Alcazar 6-seater review\" — most family buyers cross-shopping this segment specifically want to see third-row and captain-seat usability.",
  },
  Tucson: {
    segment: "Premium SUV",
    competitors: ["Jeep Compass", "Skoda Kodiaq"],
    keyStrengths: [
      "AWD available at a more accessible price point than most premium SUV rivals",
      "Panoramic sunroof, ventilated seats, and full ADAS suite standard from a mid trim",
    ],
    talkingPoints: [
      { vs: "Jeep Compass", points: [
        "Compass has stronger off-road brand credibility — Tucson counters with better in-city drivability and a significantly lower cost of ownership",
      ]},
      { vs: "Skoda Kodiaq", points: [
        "Kodiaq is a genuine 7-seater — be upfront about that if the customer needs 7 seats. For 5-seat premium SUV use, Tucson is priced well below Kodiaq for a comparable feature set",
      ]},
    ],
    objectionHandling: [
      { objection: "\"Compass feels more premium off-road\"", response: "Ask how often they'll actually go off-road — for the vast majority of owners, Tucson's on-road comfort and running costs matter more day to day." },
    ],
    reviewThemes: [
      "Highway ride and NVH are consistently rated among the best in the premium SUV segment",
      "Feature-for-price value versus European rivals is a frequently repeated point",
    ],
    searchTip: "Search \"Hyundai Tucson AWD review\" — reviewers who've driven the AWD variant specifically tend to focus on the value angle versus pricier European SUVs.",
  },
  Exter: {
    segment: "Micro SUV",
    competitors: ["Tata Punch", "Maruti Fronx"],
    keyStrengths: [
      "Highest ground clearance in the micro-SUV segment — a genuine, visible differentiator",
      "CNG factory-fitted option available, unlike some rivals' aftermarket-only CNG",
    ],
    talkingPoints: [
      { vs: "Tata Punch", points: [
        "Punch has a 5-star crash rating — acknowledge it directly, then pivot to Exter's larger boot and factory CNG option",
      ]},
      { vs: "Maruti Fronx", points: [
        "Fronx's turbo-petrol is quicker — Exter counters on ground clearance, boot space, and a roomier rear seat",
      ]},
    ],
    objectionHandling: [
      { objection: "\"Punch is safer\"", response: "Don't argue the rating — acknowledge it and move to what Exter offers that Punch doesn't at this price: factory CNG and more boot space." },
    ],
    reviewThemes: [
      "Ground clearance and general road presence for the segment are the most-praised aspects",
      "Boot space is repeatedly called out as best-in-class for a micro-SUV",
    ],
    searchTip: "Search \"Hyundai Exter CNG review\" — most useful for customers specifically asking about running cost, since CNG is a major reason buyers shortlist this segment.",
  },
};
/* ============================== LEARNING ==============================
   Four categories, one axis. The previous version filtered by topic *and* format, which
   is two questions to answer before seeing anything — and the answer to "what do I want
   to learn about" is usually "whatever fits the gap I have right now". Format answers
   that on its own: fifteen minutes in the car is a podcast, five minutes between
   customers is an article.

   Internal is its own category rather than a tag. Content from someone on your own floor
   carries different weight from a produced course, and reps go looking for it specifically. */

const LEARN_CATS = [
  { key: "video",    label: "Videos",   Icon: PlayCircle, color: C.hot,     verb: "Watch" },
  { key: "podcast",  label: "Podcasts", Icon: Headphones, color: C.purple,  verb: "Listen" },
  { key: "article",  label: "Articles", Icon: FileText,   color: C.cold,    verb: "Read" },
  { key: "internal", label: "Internal", Icon: Users,      color: C.teal,    verb: "Watch" },
];

const LEARN_LIBRARY = [
  // ---- Videos (produced) ----
  { id: "speed-lead", cat: "video", mins: 6, topic: "Sales",
    title: "Speed to lead — the first hour", by: "Autoprism Sales Lab",
    blurb: "Why an enquiry called back in ten minutes converts several times better than the same enquiry called at day's end." },
  { id: "hold-price", cat: "video", mins: 12, topic: "Sales",
    title: "Holding price without losing the deal", by: "Autoprism Sales Lab",
    blurb: "Four ways to answer \"what's your best price\" that don't start with a number." },
  { id: "addons", cat: "video", mins: 9, topic: "Sales",
    title: "Selling add-ons at booking", by: "Autoprism Sales Lab",
    blurb: "Warranty and insurance are a booking conversation. Once the customer has the keys in mind, they stop buying." },
  { id: "who-decides", cat: "video", mins: 11, topic: "Communication",
    title: "Reading the room — who actually decides", by: "Meera Shankar · sales trainer",
    blurb: "The person asking questions is often not the person signing." },
  { id: "angry", cat: "video", mins: 14, topic: "Communication",
    title: "The delivery-day complaint", by: "Meera Shankar",
    blurb: "The most expensive conversation in the business — it decides the referral, not just this sale." },
  { id: "finance-talk", cat: "video", mins: 10, topic: "Communication",
    title: "Explaining finance without jargon", by: "Autoprism Sales Lab",
    blurb: "Said in language a customer repeats correctly to their spouse that evening." },
  { id: "ev-basics", cat: "video", mins: 16, topic: "Product",
    title: "Selling an EV to a petrol buyer", by: "Autoprism Sales Lab",
    blurb: "The four objections that come up every time on the Ioniq 5." },

  // ---- Podcasts ----
  { id: "qualify-call", cat: "podcast", mins: 22, topic: "Sales",
    title: "Qualifying on the first call", by: "The Showroom Floor · Ep. 31",
    blurb: "Budget, timeline and who decides — without it feeling like an interrogation." },
  { id: "first-time", cat: "podcast", mins: 26, topic: "Communication",
    title: "First-time buyer vs repeat buyer", by: "The Showroom Floor · Ep. 18",
    blurb: "Two different conversations. One needs reassurance, the other finds it patronising." },
  { id: "silence", cat: "podcast", mins: 18, topic: "Communication",
    title: "Silence as a closing tool", by: "The Showroom Floor · Ep. 24",
    blurb: "After you state the price, whoever speaks first loses." },
  { id: "phone-tone", cat: "podcast", mins: 15, topic: "Communication",
    title: "Sounding like someone worth meeting", by: "The Showroom Floor · Ep. 09",
    blurb: "On a call the customer has only your voice to judge you by." },

  // ---- Articles ----
  { id: "battlecards", cat: "article", mins: 9, topic: "Product",
    title: "Comparison battlecards", by: "Autoprism",
    blurb: "Creta vs Seltos, Venue vs Nexon, Alcazar vs XUV700 — including where each rival honestly beats us.", tag: "Updated" },
  { id: "whatsapp", cat: "article", mins: 6, topic: "Communication",
    title: "WhatsApp that gets replied to", by: "Autoprism",
    blurb: "Openers, follow-ups, and the three habits that get you blocked." },
  { id: "queue", cat: "article", mins: 5, topic: "Sales",
    title: "Working the queue daily", by: "Autoprism",
    blurb: "Why notes written from memory cost you the next call." },
  { id: "exchange", cat: "article", mins: 7, topic: "Product",
    title: "Talking about exchange valuation", by: "Autoprism",
    blurb: "The customer's car is always worth more to them than to the market." },

  // ---- Internal (your own floor) ----
  { id: "closing-td", cat: "internal", mins: 8, topic: "Sales",
    title: "Closing after the test drive", by: "Ravi Menon · 14 yrs, Indiranagar",
    blurb: "The drive is over and the customer is standing by the car. The next ninety seconds decide it.", tag: "Most watched" },
  { id: "home-td", cat: "internal", mins: 7, topic: "Sales",
    title: "Home test drives that convert", by: "Divya Pillai · top converter",
    blurb: "Takes an hour longer, closes far better. How to offer it and to whom." },
  { id: "walkaround", cat: "internal", mins: 13, topic: "Product",
    title: "The six-point walkaround", by: "Ravi Menon",
    blurb: "A repeatable route around the car, in the order that builds interest." },
];

// Minutes logged this month, by category. In production this comes from playback events.
const LEARN_LOG = { video: 47, podcast: 63, article: 18, internal: 21 };

/* ============================== PRODUCT REFERENCE ==============================
   Split out from the skills library on purpose. The two are used at opposite moments.

   Skills content is studied — you sit with it, it has a duration, you track hours and
   completion. Product content is looked up mid-conversation, with a customer standing
   there. So this side has no durations, no progress, no hours: it has search, models on
   top, and the answer two taps down. Anything that slows a rep down here costs a sale. */

const PRODUCT_REF = [
  {
    model: "Creta", segment: "Mid-size SUV", price: "₹11.2 – 19.8 L",
    specs: ["1.5 petrol / diesel / 1.5 turbo", "6 airbags standard", "Level-2 ADAS on SX(O)", "Panoramic sunroof"],
    pitch: "The safe default in the segment — best service reach and the strongest resale.",
    rivals: [
      { name: "Kia Seltos",
        headline: "Same platform and engines. The difference is what happens after the sale.",
        wins: ["Widest service network in the segment", "Strongest 5-year resale", "Diesel-automatic on more trims"],
        edge: "Seltos has a sharper interior. If they've seen it, agree — then move to ownership cost." },
      { name: "Maruti Grand Vitara",
        headline: "They'll win on fuel economy. Win on everything you can feel.",
        wins: ["Far stronger performance, petrol and diesel", "Better ride quality on bad roads", "Higher feature count at the same price"],
        edge: "Strong-hybrid economy is genuinely better. Don't argue the number — reframe on drive quality." },
    ],
    articles: [
      { title: "Creta variant ladder — which trim to pitch", mins: 6 },
      { title: "Handling the \"waiting period\" objection", mins: 4 },
    ],
  },
  {
    model: "Venue", segment: "Compact SUV", price: "₹7.9 – 12.9 L",
    specs: ["1.0 turbo petrol", "DCT and iMT options", "Dual-tone roof", "6 airbags"],
    pitch: "Refinement and running cost, not crash rating. Compete where you win.",
    rivals: [
      { name: "Tata Nexon",
        headline: "Nexon leads on safety rating — don't fight that. Compete on refinement.",
        wins: ["Smoother turbo and gearbox", "Better cabin fit and finish", "Lower routine service cost"],
        edge: "Nexon rates higher on crash safety. Be honest, then pivot to total ownership." },
      { name: "Kia Sonet",
        headline: "Closest rival on paper. Decided on delivery and service, not features.",
        wins: ["Shorter waiting period on most variants", "Wider service footprint", "Better resale"],
        edge: "Sonet's diesel-automatic is a genuine draw. Check stock before promising." },
    ],
    articles: [{ title: "Venue vs the sub-4m field — one-page summary", mins: 5 }],
  },
  {
    model: "Alcazar", segment: "7-seater SUV", price: "₹19.9 – 25.8 L",
    specs: ["6 and 7 seat layouts", "1.5 turbo / diesel", "Captain seats on Signature", "Level-2 ADAS"],
    pitch: "Ask who sits in the third row. That question decides this segment.",
    rivals: [
      { name: "Mahindra XUV700",
        headline: "XUV700 wins on power and price. Alcazar wins on the third row being usable.",
        wins: ["Genuinely usable third row for adults", "Quieter at highway speed", "Shorter, more predictable wait"],
        edge: "Don't compete on straight-line performance — you'll lose. Move to who's travelling." },
    ],
    articles: [{ title: "Selling the 6-seat vs 7-seat decision", mins: 5 }],
  },
  {
    model: "Ioniq 5", segment: "Electric SUV", price: "₹44.6 – 48.2 L",
    specs: ["72.6 kWh · 631 km certified", "800V — 10–80% in ~18 min", "V2L power output", "8 yr / 1.6 L km battery warranty"],
    pitch: "Charging speed and service network. That's the whole argument.",
    rivals: [
      { name: "BYD Atto 3",
        headline: "Charging speed and service access decide this, not sticker price.",
        wins: ["800V — roughly half the charging time", "Established service network in India", "Higher certified range"],
        edge: "Atto 3 is materially cheaper. If budget is the constraint, steer to a petrol SUV instead of losing them." },
    ],
    articles: [
      { title: "The four EV objections and how to answer them", mins: 8 },
      { title: "Home charger installation — what to promise", mins: 5 },
    ],
  },
  {
    model: "Verna", segment: "Mid-size sedan", price: "₹10.9 – 17.9 L",
    specs: ["1.5 NA / 1.5 turbo", "Level-2 ADAS", "Ventilated front seats", "5-star Global NCAP"],
    pitch: "The turbo is the car. Get them to drive that variant, not the base.",
    rivals: [
      { name: "Honda City",
        headline: "City sells on badge and refinement. Verna sells on everything measurable.",
        wins: ["Turbo option City has no answer to", "More features at every price point", "5-star crash rating"],
        edge: "City's resale and brand trust are real. Acknowledge, then get them into the turbo." },
      { name: "VW Virtus",
        headline: "Closest on performance. Wins and losses are on ownership, not the drive.",
        wins: ["Far better service reach", "Lower maintenance cost", "More equipment as standard"],
        edge: "Virtus feels more solid on the highway. Don't dispute it — compete on running cost." },
    ],
    articles: [{ title: "Why the turbo variant sells itself on a drive", mins: 4 }],
  },
];

function ProductReference() {
  const [q, setQ] = useState("");
  const [openModel, setOpenModel] = useState(null);
  const [openRival, setOpenRival] = useState(null);

  const term = q.trim().toLowerCase();
  const shown = PRODUCT_REF.filter(m =>
    !term || m.model.toLowerCase().includes(term) || m.segment.toLowerCase().includes(term)
    || m.rivals.some(r => r.name.toLowerCase().includes(term)));

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.card,
        border: `1.5px solid ${C.border}`, borderRadius: 11, padding: "10px 12px", marginBottom: 12 }}>
        <Search size={15} color={C.faint} />
        <input value={q} onChange={e => setQ(e.target.value)}
          placeholder="Model or a competitor they mentioned…"
          style={{ border: "none", outline: "none", flex: 1, fontFamily: F, fontSize: 12.5,
            color: C.ink, background: "none" }} />
        {q && <button onClick={() => setQ("")} style={{ background: "none", border: "none",
          cursor: "pointer", padding: 0, display: "flex" }}><X size={14} color={C.faint} /></button>}
      </div>

      {shown.map(m => {
        const open = openModel === m.model;
        return (
          <div key={m.model} style={{ background: C.card, border: `1px solid ${open ? C.primary + "55" : C.border}`,
            borderRadius: 12, marginBottom: 9, overflow: "hidden" }}>
            <button onClick={() => { setOpenModel(open ? null : m.model); setOpenRival(null); }} style={{
              display: "flex", alignItems: "center", gap: 10, width: "100%", padding: 14,
              background: "none", border: "none", cursor: "pointer", textAlign: "left",
            }}>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontFamily: F, fontSize: 14, fontWeight: 800, color: C.ink }}>
                  {m.model}
                </span>
                <span style={{ display: "block", fontFamily: F, fontSize: 11, color: C.sub, marginTop: 2 }}>
                  {m.segment} · {m.price}
                </span>
              </span>
              <span style={{ background: C.bg, borderRadius: 999, padding: "3px 9px",
                fontFamily: F, fontSize: 10.5, fontWeight: 700, color: C.sub, flexShrink: 0 }}>
                {m.rivals.length} rival{m.rivals.length > 1 ? "s" : ""}
              </span>
              <ChevronDown size={15} color={C.faint} style={{ flexShrink: 0,
                transform: open ? "rotate(180deg)" : "none", transition: "transform .18s" }} />
            </button>

            {open && (
              <div style={{ padding: "0 14px 14px" }}>
                <div style={{ background: C.primarySoft, borderRadius: 9, padding: "10px 11px", marginBottom: 11 }}>
                  <span style={{ fontFamily: F, fontSize: 12, fontWeight: 700, color: C.primary, lineHeight: 1.45 }}>
                    {m.pitch}
                  </span>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 13 }}>
                  {m.specs.map(s => (
                    <span key={s} style={{ background: C.bg, borderRadius: 7, padding: "5px 9px",
                      fontFamily: F, fontSize: 11, color: C.sub }}>{s}</span>
                  ))}
                </div>

                <div style={{ fontFamily: F, fontSize: 10.5, fontWeight: 800, color: C.faint,
                  textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Against</div>
                {m.rivals.map(r => {
                  const ro = openRival === m.model + r.name;
                  return (
                    <div key={r.name} style={{ border: `1px solid ${C.border}`, borderRadius: 10,
                      marginBottom: 7, overflow: "hidden" }}>
                      <button onClick={() => setOpenRival(ro ? null : m.model + r.name)} style={{
                        display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "11px 12px",
                        background: "none", border: "none", cursor: "pointer", textAlign: "left",
                      }}>
                        <span style={{ flex: 1, fontFamily: F, fontSize: 12.5, fontWeight: 700, color: C.ink }}>
                          vs {r.name}
                        </span>
                        <ChevronDown size={13} color={C.faint} style={{ flexShrink: 0,
                          transform: ro ? "rotate(180deg)" : "none", transition: "transform .18s" }} />
                      </button>
                      {ro && (
                        <div style={{ padding: "0 12px 12px" }}>
                          <div style={{ fontFamily: F, fontSize: 12, fontWeight: 700, color: C.ink,
                            lineHeight: 1.45, marginBottom: 10 }}>{r.headline}</div>
                          {r.wins.map(w => (
                            <div key={w} style={{ display: "flex", gap: 7, marginBottom: 6 }}>
                              <CheckCircle2 size={13} color={C.green} style={{ flexShrink: 0, marginTop: 1 }} />
                              <span style={{ fontFamily: F, fontSize: 12, color: C.sub, lineHeight: 1.45 }}>{w}</span>
                            </div>
                          ))}
                          {/* The honest half. A card that only lists wins gets a rep caught out. */}
                          <div style={{ display: "flex", gap: 7, background: C.warmSoft, borderRadius: 8,
                            padding: "9px 10px", marginTop: 9 }}>
                            <AlertTriangle size={13} color={C.warm} style={{ flexShrink: 0, marginTop: 1 }} />
                            <span style={{ fontFamily: F, fontSize: 11.5, color: C.warm, lineHeight: 1.5 }}>
                              <strong>Where they beat us: </strong>{r.edge}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {m.articles.length > 0 && (
                  <>
                    <div style={{ fontFamily: F, fontSize: 10.5, fontWeight: 800, color: C.faint,
                      textTransform: "uppercase", letterSpacing: 0.5, margin: "13px 0 8px" }}>Supporting reads</div>
                    {m.articles.map(a => (
                      <button key={a.title} style={{
                        display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "10px 11px",
                        background: C.bg, border: "none", borderRadius: 9, marginBottom: 6,
                        cursor: "pointer", textAlign: "left",
                      }}>
                        <FileText size={14} color={C.cold} style={{ flexShrink: 0 }} />
                        <span style={{ flex: 1, fontFamily: F, fontSize: 12, color: C.ink }}>{a.title}</span>
                        <span style={{ fontFamily: F, fontSize: 11, color: C.sub }}>{a.mins} min</span>
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}

      {shown.length === 0 && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12,
          padding: 22, textAlign: "center", fontFamily: F, fontSize: 12.5, color: C.sub }}>
          Nothing matches "{q}".
        </div>
      )}
    </div>
  );
}

function LearningScreen({ assigned = [] }) {
  const [view, setView] = useState("skills");
  const [cat, setCat] = useState("video");
  const [done, setDone] = useState(["queue", "whatsapp", "silence"]);
  const [openId, setOpenId] = useState(null);

  const shown = LEARN_LIBRARY.filter(m => m.cat === cat);
  const assignedItems = LEARN_LIBRARY.filter(m => assigned.includes(m.title));

  const totalMins = Object.values(LEARN_LOG).reduce((a, b) => a + b, 0);
  const goalMins = 240;                 // four hours a month
  const lastMonth = 105;
  const teamAvg = 115;
  const fmtH = (m) => m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
  const deltaM = totalMins - lastMonth;

  return (
    <div style={{ padding: "14px 14px 90px" }}>
      {/* Two halves of learning: skills you sit down with, and product you look up with a
          customer in front of you. They don't belong in the same list. */}
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

      {view === "product" && <ProductReference />}

      {view === "skills" && (<>
      {/* ---- Hours. One number, one bar, two comparisons. ---- */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16,
        padding: 15, marginBottom: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 6px 18px rgba(0,0,0,0.075)" }}>
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
            <div style={{ fontFamily: F, fontSize: 11, color: C.faint, marginTop: 2 }}>
              team {fmtH(teamAvg)}
            </div>
          </div>
        </div>

        {/* Where the time actually went — the split is the informative part, not the total. */}
        <div style={{ display: "flex", height: 8, borderRadius: 999, overflow: "hidden", marginBottom: 8 }}>
          {LEARN_CATS.map(c => {
            const w = (LEARN_LOG[c.key] / totalMins) * 100;
            return <span key={c.key} style={{ width: `${w}%`, background: c.color }} />;
          })}
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

      {assignedItems.length > 0 && (
        <div style={{ background: C.primarySoft, border: `1px solid ${C.primary}33`, borderRadius: 12,
          padding: 12, marginBottom: 12 }}>
          <div style={{ fontFamily: F, fontSize: 10.5, fontWeight: 800, color: C.primary,
            textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Picked out for you</div>
          {assignedItems.map(m => (
            <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 5 }}>
              <span style={{ flex: 1, fontFamily: F, fontSize: 12.5, fontWeight: 700, color: C.ink }}>{m.title}</span>
              <span style={{ fontFamily: F, fontSize: 11, color: C.sub }}>{m.mins} min</span>
            </div>
          ))}
        </div>
      )}

      {/* ---- Four categories. The only filter. ---- */}
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
              <span style={{ fontFamily: F, fontSize: 10.5, fontWeight: 700, color: on ? c.color : C.sub }}>
                {c.label}
              </span>
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
                <span style={{ display: "block", fontFamily: F, fontSize: 11, color: C.faint, marginTop: 3 }}>
                  {m.by}
                </span>
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

/* ============================== INVENTORY TAB ============================== */


/* ============================== LEADERBOARD TAB ============================== */
/* ---- Leaderboard ----
   A table, because that is what this data is. Columns follow the funnel left to right and
   Retailed is the only emphasised one — it's the metric the job is measured by, and
   everything to its left exists to explain it.

   Nothing is set in a size or weight that needs squinting at. The earlier version used
   colour-coded dots and 9px grey captions to fit more in; it fit more in and communicated
   less. Insights sit underneath in plain sentences that compare this rep to their team and
   say what to do. */

const TD_CLOSE = (u) => (u.testDrives ? Math.round((u.bookings / u.testDrives) * 100) : 0);
const HOME_PCT = (u) => {
  const t = (u.tdShowroom || 0) + (u.tdHome || 0);
  return t ? Math.round(((u.tdHome || 0) / t) * 100) : 0;
};

// Comparisons against the floor, phrased as something the rep can do on Monday.
function buildAdvice(me, execs) {
  const others = execs.filter(u => u.id !== me.id);
  const best = [...execs].sort((a, b) => b.achieved - a.achieved)[0];
  const avg = (fn) => Math.round(others.reduce((n, u) => n + fn(u), 0) / others.length);
  const out = [];

  if (TD_CLOSE(me) < TD_CLOSE(best) && me.testDrives >= 8) {
    const couldBe = Math.round((me.testDrives * TD_CLOSE(best)) / 100);
    out.push({
      title: `Close more of the drives you already run`,
      body: `You ran ${me.testDrives} test drives — more than anyone on the floor — but ${TD_CLOSE(me)}% turn into bookings `
        + `against ${best.name.split(" ")[0]}'s ${TD_CLOSE(best)}%. At their rate your ${me.testDrives} drives would be `
        + `${couldBe} bookings instead of ${me.bookings}.`,
      action: `Ask for the booking before the customer leaves the drive, not on a follow-up call.`,
      module: "Closing after the test drive",
    });
  }

  if (HOME_PCT(me) < avg(HOME_PCT)) {
    out.push({
      title: `Take more drives to the customer`,
      body: `${HOME_PCT(me)}% of your drives happen at the customer's place, against ${avg(HOME_PCT)}% for the rest of the team. `
        + `${best.name.split(" ")[0]} runs ${HOME_PCT(best)}% at home and closes ${TD_CLOSE(best)}%.`,
      action: `Offer a home drive to anyone who has already visited once — the family is there and nobody is watching the clock.`,
      module: "Home test drives that convert",
    });
  }

  if ((me.addOns || 0) < avg(u => u.addOns || 0)) {
    out.push({
      title: `Attach more add-ons`,
      body: `${me.addOns} add-ons across ${me.achieved} cars. The rest of the team average ${avg(u => u.addOns || 0)}. `
        + `It doesn't move you up the board, but it is the largest single lever on what you take home.`,
      action: `Raise warranty and insurance at booking, while the customer is still deciding — not at delivery.`,
      module: "Selling the add-ons at booking",
    });
  }

  if ((me.respHrs || 0) > avg(u => u.respHrs || 0)) {
    out.push({
      title: `Reply faster to new enquiries`,
      body: `You average ${me.respHrs}h to first contact; the rest of the team manage ${avg(u => u.respHrs)}h.`,
      action: `Clear new leads before working the follow-up queue — the first hour decides most of them.`,
      module: "Speed to lead — the first hour",
    });
  }

  return out.slice(0, 3);
}

function LeaderboardScreen({ currentId }) {
  const [added, setAdded] = useState([]);
  const [toast, setToast] = useState(null);
  const flash = (m) => { setToast(m); setTimeout(() => setToast(null), 2400); };

  const execs = USERS.filter(u => u.role === "Sales Executive");
  const ranked = [...execs].sort((a, b) => b.achieved - a.achieved);
  const myRank = ranked.findIndex(u => u.id === currentId) + 1;
  const me = ranked.find(u => u.id === currentId);
  const above = myRank > 1 ? ranked[myRank - 2] : null;
  const gap = above ? above.achieved - me.achieved : 0;
  const advice = buildAdvice(me, execs);

  const COLS = [
    { key: "opportunity", label: "Opp",    get: (u) => u.opportunity || 0, base: true },
    { key: "td",          label: "TD",     get: (u) => u.testDrives || 0 },
    { key: "booking",     label: "Book",   get: (u) => u.bookings || 0 },
    { key: "retailed",    label: "Retail", get: (u) => u.achieved, hero: true },
  ];

  return (
    <div style={{ padding: "12px 12px 90px", position: "relative" }}>
      {/* North star */}
      <div style={{ background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryDark} 100%)`,
        borderRadius: 16, padding: 17, marginBottom: 12, color: "#fff" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontFamily: F, fontSize: 11, fontWeight: 700, opacity: 0.9,
              textTransform: "uppercase", letterSpacing: 0.7 }}>Retails · this month</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 5, marginTop: 6 }}>
              <span style={{ fontFamily: F, fontSize: 40, fontWeight: 900, letterSpacing: -1.8, lineHeight: 1 }}>
                {me.achieved}
              </span>
              <span style={{ fontFamily: F, fontSize: 17, fontWeight: 500, opacity: 0.75 }}>/{me.target}</span>
            </div>
            <div style={{ fontFamily: F, fontSize: 13, fontWeight: 700, marginTop: 8 }}>
              #{myRank} of {ranked.length} on the floor
            </div>
            <div style={{ fontFamily: F, fontSize: 12, opacity: 0.92, marginTop: 3 }}>
              {above ? `${gap} more ${gap === 1 ? "car" : "cars"} to pass ${above.name.split(" ")[0]}.` : "Top of the floor."}
            </div>
          </div>
          <Trophy size={30} color="#fff" style={{ opacity: 0.9, flexShrink: 0 }} />
        </div>
      </div>

      {/* The table */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14,
        padding: "12px 10px", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: 8,
          borderBottom: `1.5px solid ${C.borderStrong}`, marginBottom: 2 }}>
          <span style={{ flex: 1, minWidth: 0, fontFamily: F, fontSize: 10.5, fontWeight: 700, color: C.sub,
            textTransform: "uppercase", letterSpacing: 0.4, paddingLeft: 4 }}>Executive</span>
          {COLS.map(c => (
            <span key={c.key} style={{
              width: c.hero ? 58 : 50, textAlign: "center", fontFamily: F, fontSize: 10,
              fontWeight: c.hero ? 800 : 700, color: c.hero ? C.primary : C.sub,
              textTransform: "uppercase", letterSpacing: 0.3,
            }}>{c.label}</span>
          ))}
        </div>

        {ranked.map((u, i) => {
          const isMe = u.id === currentId;
          return (
            <div key={u.id} style={{
              display: "flex", alignItems: "center", padding: "11px 0",
              borderBottom: i < ranked.length - 1 ? `1px solid ${C.border}` : "none",
              background: isMe ? C.primarySoft : "none",
              borderRadius: isMe ? 8 : 0,
            }}>
              <span style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 8, paddingLeft: 4 }}>
                <span style={{ fontFamily: F, fontSize: 12, fontWeight: 700, color: C.sub, width: 16 }}>{i + 1}</span>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: "block", fontFamily: F, fontSize: 13, fontWeight: isMe ? 800 : 600,
                    color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {u.name.split(" ")[0]}{isMe ? " (you)" : ""}
                  </span>

                </span>
              </span>
              {COLS.map(c => {
                const v = c.get(u);
                const share = c.base ? null : pct(v, u.opportunity || 0);
                return (
                  <span key={c.key} style={{ width: c.hero ? 58 : 50, textAlign: "center" }}>
                    <span style={{ display: "block", fontFamily: F, fontSize: c.hero ? 19 : 14,
                      fontWeight: c.hero ? 900 : 500, color: c.hero ? C.primary : C.ink, lineHeight: 1.1 }}>
                      {v}
                    </span>
                    {share != null && (
                      <span style={{ display: "block", fontFamily: F, fontSize: 10,
                        color: c.hero ? C.primary : C.sub, opacity: c.hero ? 0.85 : 1, marginTop: 2 }}>
                        {share}%
                      </span>
                    )}
                  </span>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Actionable, comparative, plainly written. */}
      {advice.length > 0 && (
        <>
          <div style={{ fontFamily: F, fontSize: 13.5, fontWeight: 800, color: C.ink, marginBottom: 4 }}>
            How to move up
          </div>
          <div style={{ fontFamily: F, fontSize: 11.5, color: C.sub, marginBottom: 11, lineHeight: 1.45 }}>
            Measured against the rest of your team.
          </div>
          {advice.map(a => {
            const done = added.includes(a.module);
            return (
              <div key={a.title} style={{ background: C.card, border: `1px solid ${C.border}`,
                borderRadius: 12, padding: 14, marginBottom: 9 }}>
                <div style={{ fontFamily: F, fontSize: 13, fontWeight: 800, color: C.ink, lineHeight: 1.35 }}>
                  {a.title}
                </div>
                <div style={{ fontFamily: F, fontSize: 12, color: C.sub, marginTop: 6, lineHeight: 1.55 }}>
                  {a.body}
                </div>
                <div style={{ display: "flex", gap: 8, background: C.bg, borderRadius: 9,
                  padding: "10px 11px", marginTop: 10 }}>
                  <ArrowRight size={14} color={C.primary} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span style={{ fontFamily: F, fontSize: 12, color: C.ink, fontWeight: 600, lineHeight: 1.5 }}>
                    {a.action}
                  </span>
                </div>
                <button
                  onClick={() => { if (!done) { setAdded(x => [...x, a.module]); flash(`Added "${a.module}" to your Learning`); } }}
                  style={{
                    display: "flex", alignItems: "center", gap: 6, marginTop: 11, padding: "8px 13px",
                    borderRadius: 8, border: "none", cursor: done ? "default" : "pointer",
                    background: done ? C.greenSoft : C.primarySoft, color: done ? C.green : C.primary,
                    fontFamily: F, fontWeight: 800, fontSize: 11.5,
                  }}>
                  <GraduationCap size={13} />
                  {done ? "Added to Learning" : a.module}
                </button>
              </div>
            );
          })}
        </>
      )}

      {toast && (
        <div style={{ position: "fixed", bottom: 90, left: 20, right: 20, background: C.ink, color: "#fff",
          borderRadius: 11, padding: "12px 14px", fontFamily: F, fontSize: 12.5, fontWeight: 600,
          textAlign: "center", zIndex: 300 }}>{toast}</div>
      )}
    </div>
  );
}

/* ============================== PROFILE ============================== */
function ProfileScreen({ user, onLogout, voiceFirst, onToggleVoiceFirst, lang, onSetLang }) {
  const rows = [
    { icon: Lock, label: "Change Password" },
    { icon: Bell, label: "Notification Preferences" },
    { icon: Globe, label: "Language" },
    { icon: HelpCircle, label: "Help & Support" },
  ];
  return (
    <div style={{ padding: 12 }}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20, textAlign: "center", marginBottom: 12 }}>
        <span style={{
          width: 64, height: 64, borderRadius: "50%", background: C.primary, color: "#fff",
          fontFamily: F, fontWeight: 800, fontSize: 22, display: "inline-flex",
          alignItems: "center", justifyContent: "center"
        }}>{initials(user.name)}</span>
        <div style={{ fontFamily: F, fontWeight: 700, fontSize: 17, color: C.ink, marginTop: 10 }}>{user.name}</div>
        <div style={{ fontFamily: F, fontSize: 12.5, color: C.sub, marginTop: 2 }}>{user.role}</div>
      </div>

      {/* Language Switcher */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14, marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <span style={{ width: 34, height: 34, borderRadius: 9, background: C.bg, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Globe size={16} color={C.faint} />
          </span>
          <span style={{ fontFamily: F, fontSize: 13, fontWeight: 700, color: C.ink }}>Language</span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          {LANG_OPTIONS.map(o => (
            <button key={o.code} onClick={() => onSetLang(o.code)} style={{
              padding: "6px 12px", borderRadius: 9, border: `1.5px solid ${lang === o.code ? C.primary : C.borderStrong}`,
              background: lang === o.code ? C.primarySoft : "none", color: lang === o.code ? C.primary : C.sub,
              fontFamily: F, fontWeight: 700, fontSize: 11.5, cursor: "pointer",
            }}>{o.label}</button>
          ))}
        </div>
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14, marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <span style={{ width: 34, height: 34, borderRadius: 9, background: voiceFirst ? C.primarySoft : C.bg, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Mic size={16} color={voiceFirst ? C.primary : C.faint} />
            </span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: F, fontSize: 13, fontWeight: 700, color: C.ink }}>Voice-first logging</div>
              <div style={{ fontFamily: F, fontSize: 10.5, color: C.sub, marginTop: 1 }}>
                {voiceFirst ? "Calls open with the mic, form is one tap away" : "Calls open with the form"}
              </div>
            </div>
          </div>
          <button onClick={onToggleVoiceFirst} style={{
            width: 46, height: 26, borderRadius: 999, border: "none", cursor: "pointer", flexShrink: 0,
            background: voiceFirst ? C.primary : C.borderStrong, position: "relative", padding: 0,
          }}>
            <span style={{
              position: "absolute", top: 3, left: voiceFirst ? 23 : 3, width: 20, height: 20,
              borderRadius: "50%", background: "#fff", transition: "left .15s",
            }} />
          </button>
        </div>
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 4, marginBottom: 12 }}>
        {[
          { icon: Mail, label: "Email", value: user.email },
          { icon: Phone, label: "Phone", value: user.phone },
          { icon: MapPin, label: "Branch", value: user.branch },
          { icon: Target, label: "Monthly Target", value: user.target ? `${user.target} cars` : "—" },
        ].map((r, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 10px", borderTop: i ? `1px solid ${C.border}` : "none" }}>
            <r.icon size={15} color={C.sub} />
            <span style={{ fontFamily: F, fontSize: 12, color: C.sub, flex: 1 }}>{r.label}</span>
            <span style={{ fontFamily: F, fontSize: 12.5, color: C.ink, fontWeight: 600, textAlign: "right" }}>{r.value}</span>
          </div>
        ))}
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 4, marginBottom: 12 }}>
        {rows.map((r, i) => (
          <button key={i} style={{
            display: "flex", alignItems: "center", gap: 10, padding: "12px 10px", width: "100%",
            background: "none", border: "none", cursor: "pointer", borderTop: i ? `1px solid ${C.border}` : "none"
          }}>
            <r.icon size={15} color={C.sub} />
            <span style={{ fontFamily: F, fontSize: 13, color: C.ink, flex: 1, textAlign: "left" }}>{r.label}</span>
            <ChevronRight size={15} color={C.faint} />
          </button>
        ))}
      </div>

      <button onClick={onLogout} style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%",
        background: C.hotSoft, color: C.hot, border: `1px solid #FECACA`, borderRadius: 12,
        padding: "12px 0", fontFamily: F, fontWeight: 700, fontSize: 13, cursor: "pointer"
      }}>
        <LogOut size={15} />Log Out
      </button>
    </div>
  );
}

/* ============================== BOTTOM SHEET (shared wrapper) ============================== */
function BottomSheet({ title, subtitle, onClose, children }) {
  return (
    <div onClick={onClose} style={{
      position: "absolute", inset: 0, background: "rgba(14,14,12,0.28)", zIndex: 80,
      display: "flex", alignItems: "flex-end",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#FFFFFF",
        border: `1px solid ${C.borderStrong}`,
        boxShadow: "0 -4px 32px rgba(0,0,0,0.10)",
        width: "100%", borderRadius: "20px 20px 0 0", padding: 18,
        maxHeight: "85%", overflowY: "auto", boxSizing: "border-box",
      }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: C.borderStrong, margin: "0 auto 16px", opacity: 0.6 }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: subtitle ? 4 : 14 }}>
          <span style={{ fontFamily: F, fontWeight: 800, fontSize: 15.5, color: C.ink }}>{title}</span>
          <button onClick={onClose} style={{ background: C.bg, border: `1.5px solid ${C.borderStrong}`, cursor: "pointer", padding: 6, borderRadius: 8, display: "flex" }}>
            <X size={15} color={C.faint} />
          </button>
        </div>
        {subtitle && <div style={{ fontFamily: F, fontSize: 12, color: C.sub, marginBottom: 14 }}>{subtitle}</div>}
        {children}
      </div>
    </div>
  );
}

/* ============================== ADD LEAD ============================== */
function AddLeadSheet({ onClose, onSubmit, prefill }) {
  const [form, setForm] = useState({
    name: prefill?.name || "", phone: prefill?.phone || "", altPhone: "", model: prefill?.model || "", variant: prefill?.variant || "",
    budget: prefill?.finalPrice ? `₹${prefill.finalPrice.toFixed(1)} L` : "", source: "Walk-in",
  });
  const models = [...new Set(INVENTORY.map(v => v.model))];
  const variantsForModel = INVENTORY.filter(v => v.model === form.model);
  const canSubmit = form.name.trim() && form.phone.trim() && form.model;
  const [attempted, setAttempted] = useState(false);
  const addLeadMissing = (() => {
    const m = [];
    if (!form.name.trim()) m.push("customer name");
    if (!form.phone.trim()) m.push("phone number");
    if (!form.model) m.push("model of interest");
    return m;
  })();

  return (
    <BottomSheet title="Add Lead" onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div>
          <input placeholder="Customer name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={{ ...formInputStyle, width: "100%", boxSizing: "border-box", ...reqInput(attempted && !form.name.trim()) }} />
          <ReqHint show={attempted && !form.name.trim()} text="Enter the customer's name" />
        </div>
        <div>
          <input placeholder="Phone number" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} style={{ ...formInputStyle, width: "100%", boxSizing: "border-box", ...reqInput(attempted && !form.phone.trim()) }} />
          <ReqHint show={attempted && !form.phone.trim()} text="Enter a phone number" />
        </div>
        <input placeholder="Alternate phone (optional)" value={form.altPhone} onChange={e => setForm(f => ({ ...f, altPhone: e.target.value }))} style={{ ...formInputStyle, width: "100%" }} />
        <div>
          <select value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value, variant: "" }))} style={{ ...formInputStyle, width: "100%", boxSizing: "border-box", ...reqInput(attempted && !form.model) }}>
            <option value="">Select model</option>
            {models.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <ReqHint show={attempted && !form.model} text="Pick a model" />
        </div>
        {form.model && (
          <select value={form.variant} onChange={e => setForm(f => ({ ...f, variant: e.target.value }))} style={{ ...formInputStyle, width: "100%" }}>
            <option value="">Select variant (optional)</option>
            {variantsForModel.map(v => <option key={v.id} value={v.variant}>{v.variant}</option>)}
          </select>
        )}
        <input placeholder="Budget (optional, e.g. ₹12–14 L)" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} style={{ ...formInputStyle, width: "100%" }} />
        <div>
          <span style={{ fontFamily: F, fontSize: 10.5, color: C.sub, fontWeight: 600 }}>Source</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
            {["Walk-in", "Website", "CarDekho", "Referral", "Others"].map(s => (
              <button key={s} onClick={() => setForm(f => ({ ...f, source: s }))} style={chipStyle(form.source === s)}>{s}</button>
            ))}
          </div>
        </div>
      </div>
      {attempted && !canSubmit && <div style={{ marginTop: 12 }}><MissingBanner items={addLeadMissing} /></div>}
      <button onClick={() => { if (!canSubmit) { setAttempted(true); return; } onSubmit({ ...form, quoteNotes: prefill?.notes, quoteDiscount: prefill?.discount }); }}
        style={{ ...saveBtnStyle(canSubmit), width: "100%", marginTop: attempted && !canSubmit ? 4 : 14 }}>
        Add Lead
      </button>
    </BottomSheet>
  );
}

/* ============================== QUICK QUOTE ============================== */
function QuickQuoteSheet({ onClose, onConvert }) {
  const [form, setForm] = useState({ name: "", phone: "", model: "", variant: "", discount: "", notes: "" });
  const [recording, setRecording] = useState(false);
  const [result, setResult] = useState(null);
  const models = [...new Set(INVENTORY.map(v => v.model))];
  const variantsForModel = INVENTORY.filter(v => v.model === form.model);
  const canGenerate = !!(form.phone.trim() && form.model && form.variant);
  const discountVal = Math.max(0, parseFloat(form.discount) || 0);
  const finalPrice = result ? Math.max(0.1, result.priceLakh - discountVal) : null;

  const handleVoice = () => {
    if (recording) return;
    setRecording(true);
    setTimeout(() => {
      const text = MOCK_VOICE_TRANSCRIPTS[Math.floor(Math.random() * MOCK_VOICE_TRANSCRIPTS.length)];
      setForm(f => ({ ...f, notes: f.notes ? `${f.notes} ${text}` : text }));
      setRecording(false);
    }, 1600);
  };

  return (
    <BottomSheet title="Quick Quote" subtitle="Instant pricing — no lead needed yet" onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <input placeholder="Customer name (optional)" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={{ ...formInputStyle, width: "100%" }} />
        <input placeholder="Mobile number *" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} style={{ ...formInputStyle, width: "100%" }} />
        <select value={form.model} onChange={e => { setForm(f => ({ ...f, model: e.target.value, variant: "" })); setResult(null); }} style={{ ...formInputStyle, width: "100%" }}>
          <option value="">Select model</option>
          {models.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        {form.model && (
          <select value={form.variant} onChange={e => { setForm(f => ({ ...f, variant: e.target.value })); setResult(null); }} style={{ ...formInputStyle, width: "100%" }}>
            <option value="">Select variant</option>
            {variantsForModel.map(v => <option key={v.id} value={v.variant}>{v.variant}</option>)}
          </select>
        )}
        <input type="number" min="0" step="0.1" placeholder="Discount, ₹ L (optional)" value={form.discount}
          onChange={e => setForm(f => ({ ...f, discount: e.target.value }))} style={{ ...formInputStyle, width: "100%" }} />
      </div>
      <button disabled={!canGenerate} onClick={() => setResult(INVENTORY.find(v => v.model === form.model && v.variant === form.variant) || null)}
        style={{ ...saveBtnStyle(canGenerate), width: "100%", marginTop: 12 }}>
        Generate Quote
      </button>

      {result && (
        <div style={{ marginTop: 14, background: C.primarySoft, borderRadius: 12, padding: 13 }}>
          <div style={{ fontFamily: F, fontSize: 11.5, color: C.primary, fontWeight: 700 }}>Estimated On-Road Price</div>
          {discountVal > 0 ? (
            <>
              <div style={{ fontFamily: F, fontSize: 13, color: C.faint, textDecoration: "line-through", marginTop: 4 }}>
                ₹{result.priceLakh.toFixed(1)} L
              </div>
              <div style={{ fontFamily: F, fontWeight: 800, fontSize: 22, color: C.darkGreen }}>
                ₹{finalPrice.toFixed(1)} L
              </div>
              <div style={{ fontFamily: F, fontSize: 11, color: C.green, fontWeight: 700, marginTop: 2 }}>
                Discount applied: ₹{discountVal.toFixed(1)} L
              </div>
            </>
          ) : (
            <div style={{ fontFamily: F, fontWeight: 800, fontSize: 22, color: C.ink, marginTop: 4 }}>
              ₹{result.priceLakh.toFixed(1)} L
            </div>
          )}
          <div style={{ fontFamily: F, fontSize: 11.5, color: C.sub, marginTop: 3 }}>
            {result.model} {result.variant} · {result.color} · {result.fuel}
          </div>

          <div style={{ marginTop: 12 }}>
            <NoteField value={form.notes} onChange={v => setForm(f => ({ ...f, notes: v }))} recording={recording} onVoiceNote={handleVoice} />
          </div>

          <button onClick={() => onConvert({
            name: form.name, phone: form.phone, model: form.model, variant: form.variant,
            discount: discountVal, finalPrice, notes: form.notes,
          })} style={{ ...saveBtnStyle(true), width: "100%", marginTop: 12 }}>
            Save as Lead
          </button>
        </div>
      )}
    </BottomSheet>
  );
}

/* ============================== NOTIFICATIONS ============================== */
function NotificationsSheet({ items, onClose, onOpenLead }) {
  return (
    <BottomSheet title="Needs Your Attention" onClose={onClose}>
      {items.length === 0 ? (
        <div style={{ textAlign: "center", padding: "24px 0", color: C.faint, fontFamily: F, fontSize: 13 }}>
          All caught up 🎉
        </div>
      ) : items.map((it, i) => (
        <button key={i} onClick={() => { onOpenLead(it.lead.id); onClose(); }} style={{
          display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 2px",
          borderBottom: i !== items.length - 1 ? `1px solid ${C.border}` : "none",
          background: "none", border: "none", cursor: "pointer", textAlign: "left"
        }}>
          <span style={{
            width: 32, height: 32, borderRadius: "50%", background: it.color + "18", display: "flex",
            alignItems: "center", justifyContent: "center", flexShrink: 0
          }}>
            <it.icon size={15} color={it.color} />
          </span>
          <span style={{ fontFamily: F, fontSize: 12.5, color: C.ink, fontWeight: 600, flex: 1 }}>{it.text}</span>
          <ChevronRight size={14} color={C.faint} />
        </button>
      ))}
    </BottomSheet>
  );
}

/* ============================== FAB SPEED-DIAL ============================== */
function FilteredLeadsScreen({ label, leads, onOpenLead, onCall, onWhatsApp, onLogCall, onLogWhatsApp }) {
  const items = filterLeadsByCounter(leads, label);

  // The full "all leads" view groups by blocker bucket — the browsing experience that used to
  // live on the main Leads screen, now reachable here instead of duplicating it there.
  if (label === "Leads") {
    const grouped = BUCKET_ORDER.map(bk => ({ bk, meta: BUCKET_META[bk], items: items.filter(l => l.bucket === bk && !EXCLUDE_FROM_BUCKETS.includes(l.stage)) }))
      .filter(g => g.items.length > 0);
    const closed = items.filter(l => EXCLUDE_FROM_BUCKETS.includes(l.stage));
    return (
      <div style={{ padding: 12 }}>
        <div style={{ fontFamily: F, fontSize: 12, color: C.sub, marginBottom: 10 }}>
          {items.length} lead{items.length !== 1 ? "s" : ""} total
        </div>
        {grouped.map(({ bk, meta, items }) => (
          <div key={bk} style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <meta.Icon size={14} color={meta.color} />
              <span style={{ fontFamily: F, fontWeight: 800, fontSize: 13, color: C.ink }}>{meta.label}</span>
              <span style={{ fontFamily: F, fontSize: 11.5, color: C.faint, fontWeight: 600 }}>({items.length})</span>
            </div>
            {items.map(l => (
              <LeadCard key={l.id} lead={l} onOpen={onOpenLead} onCall={onCall} onWhatsApp={onWhatsApp} onLogCall={onLogCall} onLogWhatsApp={onLogWhatsApp} />
            ))}
          </div>
        ))}
        {closed.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <span style={{ fontFamily: F, fontWeight: 800, fontSize: 13, color: C.ink }}>Booked / Delivered / Lost</span>
              <span style={{ fontFamily: F, fontSize: 11.5, color: C.faint, fontWeight: 600 }}>({closed.length})</span>
            </div>
            {closed.map(l => (
              <LeadCard key={l.id} lead={l} onOpen={onOpenLead} onCall={onCall} onWhatsApp={onWhatsApp} onLogCall={onLogCall} onLogWhatsApp={onLogWhatsApp} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ padding: 12 }}>
      <div style={{ fontFamily: F, fontSize: 12, color: C.sub, marginBottom: 10 }}>
        {items.length} lead{items.length !== 1 ? "s" : ""} · {label}
      </div>
      {items.length === 0 ? (
        <div style={{ textAlign: "center", padding: "30px 10px", color: C.faint, fontFamily: F, fontSize: 13 }}>
          No leads in this category yet.
        </div>
      ) : items.map(l => (
        <LeadCard key={l.id} lead={l} onOpen={onOpenLead} onCall={onCall} onWhatsApp={onWhatsApp} onLogCall={onLogCall} onLogWhatsApp={onLogWhatsApp} />
      ))}
    </div>
  );
}

/* ============================== BOOKING CELEBRATION ============================== */
function BookingCelebration({ data, repName, onClose }) {
  const [copied, setCopied] = useState(false);
  const handleShare = async () => {
    const text = `🚗 BOOKING CONFIRMED\n${data.model} ${data.variant}\nAdvance: ₹${data.advance} (${data.mode})\nDelivery: ${data.deliveryDate ? new Date(data.deliveryDate).toLocaleDateString("en-IN", {day:"2-digit",month:"short",year:"numeric"}) : "TBD"}\nClosed by: ${repName}`;
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch(e) {}
  };

  return (
    <div style={{ position: "absolute", inset: 0, background: "rgba(14,14,12,0.28)", zIndex: 80, display: "flex", alignItems: "flex-end" }}>
      <div style={{ width: "100%", background: C.card, borderRadius: "20px 20px 0 0", padding: 20, boxSizing: "border-box", boxShadow: "0 -4px 32px rgba(0,0,0,0.10)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: C.greenSoft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <CheckCircle2 size={22} color={C.green} />
          </div>
          <div>
            <div style={{ fontFamily: F, fontWeight: 800, fontSize: 17, color: C.ink, letterSpacing: -0.3 }}>Booking Confirmed</div>
            <div style={{ fontFamily: F, fontSize: 12, color: C.sub, marginTop: 2 }}>{data.model} {data.variant}</div>
          </div>
        </div>
        <div style={{ background: C.bg, borderRadius: 12, padding: 12, marginBottom: 16 }}>
          {[["Advance", `₹${data.advance} (${data.mode})`], ["Delivery", data.deliveryDate ? new Date(data.deliveryDate).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}) : "TBD"], ["Closed by", repName]].map(([k, v], i) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: i > 0 ? "7px 0 0" : "0 0 7px", borderBottom: i < 2 ? `1px solid ${C.border}` : "none" }}>
              <span style={{ fontFamily: F, fontSize: 12, color: C.faint }}>{k}</span>
              <span style={{ fontFamily: F, fontSize: 12.5, fontWeight: 700, color: C.ink }}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, ...cancelBtnStyle }}>Done</button>
          <button onClick={handleShare} style={{ flex: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, ...saveBtnStyle(true) }}>
            {copied ? <><Check size={13} />Copied!</> : <><Share2 size={13} />Share with Team</>}
          </button>
        </div>
      </div>
    </div>
  );
}


/* ============================== APP ROOT ============================== */
export default function SalesExecutiveApp() {
  const currentUserId = DEFAULT_USER_ID; // locked to the single Sales Executive view
  const [activeTab, setActiveTabRaw] = useState("leads");
  // Menu keys are "tab" or "tab:subview". Screens key off activeTab; subView presets the
  // view inside that screen so the menu owns the structure.
  const setActiveTab = (k) => setActiveTabRaw(k);
  const [tabBase, subView] = String(activeTab).split(":");
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [voiceFirst, setVoiceFirst] = useState(true);
  const [lang, setLang] = useState("en"); // "en" | "hi" | "te" | "kn" | "ta"
  const [leads, setLeads] = useState(RAW_LEADS);
  const [toast, setToast] = useState("");
  const toastTimer = useRef(null);
  const [showAddLead, setShowAddLead] = useState(false);
  const [showMIS, setShowMIS] = useState(false);
  // Set when a lead releases its held car, so InventoryScreen can cascade it.
  const [releasedUnitId, setReleasedUnitId] = useState(null);
  const [showQuickQuote, setShowQuickQuote] = useState(false);
  const [quickQuotePrefill, setQuickQuotePrefill] = useState(null);
  const [counterFilter, setCounterFilter] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [celebration, setCelebration] = useState(null);

  const scopedIds = useMemo(() => getSubtreeIds(currentUserId), [currentUserId]);
  const scopedLeads = useMemo(() => leads.filter(l => scopedIds.includes(l.owner)), [leads, scopedIds]);
  const attentionItems = useMemo(() => getAttentionItems(scopedLeads), [scopedLeads]);

  const showToast = (msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2200);
  };

  const handleCall = (lead) => {
    showToast(`📞 Calling ${lead.name}…`);
    setLeads(prev => prev.map(l => l.id !== lead.id ? l : {
      ...l, channelUsage: { call: (l.channelUsage?.call || 0) + 1, whatsapp: l.channelUsage?.whatsapp || 0 }
    }));
  };
  const handleWhatsApp = (lead) => {
    showToast(`💬 Opening WhatsApp with ${lead.name}…`);
    setLeads(prev => prev.map(l => l.id !== lead.id ? l : {
      ...l, channelUsage: { call: l.channelUsage?.call || 0, whatsapp: (l.channelUsage?.whatsapp || 0) + 1 }
    }));
  };

  const handleToggleLabel = (leadId, label) => {
    setLeads(prev => prev.map(l => {
      if (l.id !== leadId) return l;
      const hasLabel = l.labels.includes(label);
      const newLabels = hasLabel ? l.labels.filter(x => x !== label) : [...l.labels, label];
      // Exchange data persists across toggle off/on — only initialize once, on first activation.
      let exchange = l.exchange;
      if (label === "Exchange" && !hasLabel && !exchange) {
        exchange = { model: "", variant: "", year: "", odometer: "", condition: "", photos: 0, appraisalScheduled: false, appraisedValue: null };
      }
      return { ...l, labels: newLabels, exchange };
    }));
  };
  // AI-suggested signals — accepting activates the signal via the same path as a manual toggle
  // (so Exchange initialization etc. all still happens), then clears the suggestion.
  const handleAcceptSuggestedSignal = (leadId, signal) => {
    handleToggleLabel(leadId, signal);
    setLeads(prev => prev.map(l => l.id !== leadId ? l : {
      ...l,
      suggestedSignals: (l.suggestedSignals || []).filter(s => s.signal !== signal),
      timeline: [{ type: "note", text: `Signal "${signal}" added from call analysis`, date: today }, ...l.timeline],
    }));
    showToast(`✅ "${signal}" signal added`);
  };
  const handleDismissSuggestedSignal = (leadId, signal) => {
    setLeads(prev => prev.map(l => l.id !== leadId ? l : {
      ...l, suggestedSignals: (l.suggestedSignals || []).filter(s => s.signal !== signal),
    }));
  };
  // Mock of the call-recording analysis pipeline: scans logged note text for signal keywords and
  // raises a suggestion if that signal isn't already active. In production this would run on the
  // actual recording transcript server-side, not the SE's typed note.
  const detectSignalsFromNote = (lead, note) => {
    if (!note) return [];
    const text = note.toLowerCase();
    const rules = [
      { signal: "Exchange", words: ["exchange", "trade-in", "trade in", "old car", "current car"], reason: "From this call: customer mentioned their current car. Add the Exchange signal to start booking an evaluation?" },
      { signal: "Finance", words: ["loan", "emi", "finance", "down payment"], reason: "From this call: customer asked about loan/EMI options. Add the Finance signal to start the loan process?" },
      { signal: "Comparing Competitor", words: ["seltos", "brezza", "nexon", "compass", "competitor", "comparing"], reason: "From this call: customer is comparing with a competitor. Add the signal to see the battle card?" },
    ];
    return rules
      .filter(r => r.words.some(w => text.includes(w)))
      .filter(r => !lead.labels.includes(r.signal) && !(lead.suggestedSignals || []).some(s => s.signal === r.signal))
      .map(r => ({ signal: r.signal, reason: r.reason }));
  };
  const handleUpdateExchangeField = (leadId, field, value) => {
    setLeads(prev => prev.map(l => l.id !== leadId ? l : { ...l, exchange: { ...l.exchange, [field]: value } }));
  };
  const handleAddExchangePhoto = (leadId) => {
    setLeads(prev => prev.map(l => l.id !== leadId ? l : {
      ...l, exchange: { ...l.exchange, photos: (l.exchange?.photos || 0) + 1 }
    }));
  };
  const handleScheduleAppraisal = (leadId) => {
    setLeads(prev => prev.map(l => l.id !== leadId ? l : {
      ...l, exchange: { ...l.exchange, appraisalScheduled: true }
    }));
    showToast("🗓️ Appraiser visit scheduled — final value in ~2 days");
  };
  const handleAddNote = (leadId, text) => {
    setLeads(prev => prev.map(l => l.id !== leadId ? l : { ...l, notes: [text, ...l.notes] }));
    showToast("🎙️ Voice note transcribed & added");
  };
  const handleUpdateAltPhone = (leadId, value) => {
    setLeads(prev => prev.map(l => l.id !== leadId ? l : { ...l, altPhone: value.trim() }));
    showToast(value.trim() ? "📱 Alternate number saved" : "Alternate number removed");
  };
  const handleUpdateCommPref = (leadId, pref) => {
    setLeads(prev => prev.map(l => {
      if (l.id !== leadId) return l;
      const label = pref ? commPrefMeta(pref)?.label : null;
      return {
        ...l, commPref: pref,
        timeline: [{ type: "call", text: pref ? `Customer stated contact preference — ${label}` : "Contact preference cleared", date: today }, ...l.timeline],
      };
    }));
    showToast(pref ? `✅ Marked as ${commPrefMeta(pref)?.label}` : "Contact preference cleared");
  };
  const handleEscalate = (leadId, { level, reason, note }) => {
    setLeads(prev => prev.map(l => {
      if (l.id !== leadId) return l;
      const history = [...(l.escalation?.history || []), { level, date: today }];
      const levelLabel = level === "tl" ? "Team Leader" : "Manager";
      const reasonLabel = ESCALATION_REASONS.find(r => r.key === reason)?.label || reason;
      // Simulated manager-response timeline entry — in production this would arrive via a push
      // notification or webhook once the TL/Manager actually responds in their own view.
      const mockResponse = { type: "escalation-response", text: `${levelLabel} acknowledged — will review and follow up`, date: today };
      return {
        ...l,
        escalation: { level, reason, note, date: today, history },
        timeline: [mockResponse, { type: "escalation", text: `Escalated to ${levelLabel} — ${reasonLabel}`, date: today }, ...l.timeline],
      };
    }));
    showToast(`🚩 Escalated to ${level === "tl" ? "Team Leader" : "Manager"}`);
  };

  // Simple stage moves (anything except Booked/Lost, which need their own confirmation forms).
  const handleChangeStage = (leadId, stage) => {
    setLeads(prev => prev.map(l => l.id !== leadId ? l : {
      ...l, stage, timeline: [{ type: "call", text: `Status updated to ${stage}`, date: today }, ...l.timeline],
    }));
    showToast(`Stage updated — ${stage}`);
  };
  // Locks in whatever vehicle was confirmed at booking — including any last-minute edits made
  // right there in the picker. This becomes the vehicle shown everywhere going forward.
  const lockVehicle = (vehicle) => ({ vehicles: [{ ...vehicle, primary: true }], model: vehicle.model, variant: vehicle.variant, color: vehicle.color });
  const handleConfirmBooking = (leadId, data) => {
    const existingLead = leads.find(l => l.id === leadId);
    if (data.isFullPayment) {
      const { retailDate, paymentDetails, confirmedVehicle } = data;
      const dateObj = parseDateInput(retailDate);
      const locked = lockVehicle(confirmedVehicle);
      setLeads(prev => prev.map(l => {
        if (l.id !== leadId) return l;
        return {
          ...l, ...locked, stage: "Retailed", retailDate: dateObj,
          paymentDetails: { ...paymentDetails, isFullPayment: true },
          timeline: [{ type: "booking", text: `Booked and retailed in one step — ${locked.model} ${locked.variant} confirmed, full payment of ${formatINR(paymentBreakdownTotal(paymentDetails))} settled`, date: today }, ...l.timeline],
        };
      }));
      if (existingLead) {
        setCelebration({ name: existingLead.name, model: locked.model, variant: locked.variant, advance: paymentBreakdownTotal(paymentDetails), deliveryDate: null, mode: "Full Payment" });
      }
      return;
    }
    const { advance, deliveryDate, mode, confirmedVehicle } = data;
    const locked = lockVehicle(confirmedVehicle);
    setLeads(prev => prev.map(l => {
      if (l.id !== leadId) return l;
      const dateObj = parseDateInput(deliveryDate);
      return {
        ...l, ...locked, stage: "Booking", expectedDeliveryDate: dateObj,
        booking: { advance, deliveryDate: dateObj, mode },
        timeline: [{ type: "booking", text: `Booking confirmed — ${locked.model} ${locked.variant}, ₹${advance} advance (${mode})`, date: today }, ...l.timeline],
      };
    }));
    if (existingLead) {
      setCelebration({ name: existingLead.name, model: locked.model, variant: locked.variant, advance, deliveryDate: parseDateInput(deliveryDate), mode });
    }
  };
  const handleConfirmRetail = (leadId, { retailDate, paymentDetails, confirmedVehicle }) => {
    const dateObj = parseDateInput(retailDate);
    const locked = lockVehicle(confirmedVehicle);
    setLeads(prev => prev.map(l => {
      if (l.id !== leadId) return l;
      return {
        ...l, ...locked, stage: "Retailed", retailDate: dateObj,
        paymentDetails: { ...paymentDetails, isFullPayment: true },
        timeline: [{ type: "booking", text: `Retailed — ${locked.model} ${locked.variant} confirmed, full payment of ${formatINR(paymentBreakdownTotal(paymentDetails))} settled`, date: today }, ...l.timeline],
      };
    }));
  };
  const handleConfirmDelivery = (leadId, { deliveryDate }) => {
    const dateObj = parseDateInput(deliveryDate);
    setLeads(prev => prev.map(l => {
      if (l.id !== leadId) return l;
      return {
        ...l, stage: "Delivered", actualDeliveryDate: dateObj,
        timeline: [{ type: "booking", text: `Vehicle delivered to customer`, date: today }, ...l.timeline],
      };
    }));
  };
  const handleConfirmLost = (leadId, { reason, note }) => {
    let freedUnit = null;
    setLeads(prev => prev.map(l => {
      if (l.id !== leadId) return l;
      const reasonLabel = LOST_REASONS.find(r => r.key === reason)?.label || reason;
      // A lost lead holding a car is the worst kind of dead stock — nobody can sell it and
      // nobody is buying it. Record the car so inventory can release it and pass it on.
      if (l.blockedUnit) freedUnit = l.blockedUnit;
      return {
        ...l, stage: "Lost", lostReason: { reason, note, date: today }, blockedUnit: null,
        timeline: [
          { type: "call", text: `Marked as Lost — ${reasonLabel}`, date: today },
          ...(l.blockedUnit ? [{ type: "call", text: `Held car released — ${l.blockedUnit.model} ${l.blockedUnit.color} (VIN ${l.blockedUnit.vin})`, date: today }] : []),
          ...l.timeline,
        ],
      };
    }));
    if (freedUnit) setReleasedUnitId({ id: freedUnit.id, at: Date.now() });
    showToast(freedUnit ? "Lead lost — held car released back to stock" : "Lead marked as Lost");
  };
  const handleUpdateFinanceField = (leadId, field, value) => {
    setLeads(prev => prev.map(l => l.id !== leadId ? l : { ...l, finance: { ...l.finance, [field]: value } }));
  };
  const handleToggleDocument = (leadId, docKey) => {
    setLeads(prev => prev.map(l => {
      if (l.id !== leadId) return l;
      const docs = l.documents || defaultDocuments();
      const cur = docs[docKey] || { done: false, via: null };
      return { ...l, documents: { ...docs, [docKey]: cur.done ? { done: false, via: null } : { done: true, via: "manual" } } };
    }));
  };
  const handleShareDocLink = (lead) => showToast(`💬 Upload link sent to ${lead.name} via WhatsApp`);
  const handleToggleDrivingLicense = (leadId) => {
    setLeads(prev => prev.map(l => l.id !== leadId ? l : { ...l, drivingLicense: { done: true, via: "manual" } }));
    showToast("✅ Driving license marked collected");
  };
  const handleShareDLLink = (lead) => showToast(`💬 Driving license upload link sent to ${lead.name} via WhatsApp`);
  const handleAddDeliveryPhoto = (leadId, dataUrl) => {
    setLeads(prev => prev.map(l => l.id !== leadId ? l : { ...l, deliveryPhotos: [...(l.deliveryPhotos || []), dataUrl] }));
  };
  const handleShareDelivery = async (lead) => {
    const caption = `🎉 Another happy customer! ${lead.name} just drove home their new ${lead.model} ${lead.variant}. #NewCarDay`;
    try {
      if (navigator.share) {
        const photos = lead.deliveryPhotos || [];
        if (photos.length && navigator.canShare) {
          try {
            const res = await fetch(photos[0]);
            const blob = await res.blob();
            const file = new File([blob], "delivery.jpg", { type: blob.type || "image/jpeg" });
            if (navigator.canShare({ files: [file] })) {
              await navigator.share({ files: [file], title: "New Delivery!", text: caption });
              showToast("📤 Shared!");
              return;
            }
          } catch (e) { /* fall through to text-only share */ }
        }
        await navigator.share({ title: "New Delivery!", text: caption });
        showToast("📤 Shared!");
        return;
      }
    } catch (e) {
      if (e.name === "AbortError") return; // user cancelled the native share sheet
    }
    try { await navigator.clipboard.writeText(caption); } catch (e) { /* clipboard unavailable */ }
    showToast("📋 Caption copied — share the photo from your gallery");
  };
  const handleUpdateLeadField = (leadId, field, value) => {
    setLeads(prev => prev.map(l => l.id !== leadId ? l : { ...l, [field]: value }));
  };
  const handleUpdateVehicles = (leadId, vehicles) => {
    const primary = vehicles.find(v => v.primary) || vehicles[0];
    setLeads(prev => prev.map(l => {
      if (l.id !== leadId) return l;
      const prevCount = (l.vehicles || [1]).length;
      const note = vehicles.length !== prevCount
        ? `${vehicles.length > prevCount ? "Added a vehicle" : "Removed a vehicle"} — now considering ${vehicles.length} vehicle${vehicles.length > 1 ? "s" : ""}, primary: ${primary.model} ${primary.variant}`
        : `Vehicle preference updated — ${primary.model} ${primary.variant}${primary.color ? ` (${primary.color})` : ""}`;
      return {
        ...l, vehicles, model: primary.model, variant: primary.variant, color: primary.color,
        timeline: [{ type: "call", text: note, date: today }, ...l.timeline],
      };
    }));
    showToast("🚗 Vehicle preference updated");
  };
  const handleLogWhatsApp = (leadId, { outcome, note }) => {
    const outcomeLabel = WHATSAPP_OUTCOMES.find(o => o.key === outcome)?.label || outcome;
    setLeads(prev => prev.map(l => {
      if (l.id !== leadId) return l;
      let updated = { ...l, channelUsage: { ...l.channelUsage, whatsapp: (l.channelUsage?.whatsapp || 0) + 1 } };
      updated.timeline = [{ type: "whatsapp", text: `WhatsApp — ${outcomeLabel}${note ? ": " + note : ""}`, date: today }, ...l.timeline];
      if (note?.trim()) updated.notes = [note.trim(), ...l.notes];
      const detected = detectSignalsFromNote(l, note);
      if (detected.length) updated.suggestedSignals = [...(l.suggestedSignals || []), ...detected];
      return updated;
    }));
    showToast("✅ WhatsApp interaction logged");
  };
  const handleSendQuote = (leadId, quote) => {
    const lead = leads.find(l => l.id === leadId);
    setLeads(prev => prev.map(l => {
      if (l.id !== leadId) return l;
      const quoteNum = l.timeline.filter(t => t.type === "quote").length + 1;
      return {
        ...l,
        timeline: [{
          type: "quote",
          text: `Quote #${quoteNum} sent — ${formatINR(quote.total)}${quote.discount > 0 ? ` (${formatINR(quote.discount)} discount)` : ""}`,
          date: today, quoteDetails: quote,
        }, ...l.timeline],
      };
    }));

    // Save happens instantly above regardless of what follows — the share is a bonus layer,
    // never a condition for the quote being recorded.
    const firstName = lead?.name?.split(" ")[0] || "there";
    const shareText = `Hi ${firstName}, here's your quote for the ${lead?.model || ""} ${lead?.variant || ""}:\nOn-Road Price: ${formatINR(quote.total)}${quote.discount > 0 ? `\n(Includes ${formatINR(quote.discount)} discount)` : ""}\nValid for 7 days.`;
    (async () => {
      try {
        if (navigator.share) {
          await navigator.share({ title: "Your Quote", text: shareText });
          showToast("📤 Quote sent");
          return;
        }
      } catch (e) {
        if (e.name === "AbortError") { showToast("📄 Quote saved"); return; }
      }
      try { await navigator.clipboard.writeText(shareText); } catch (e) { /* clipboard unavailable */ }
      showToast(`📋 Quote copied — share it with ${lead?.name || "the customer"}`);
    })();
  };
  const handleSetCompetitor = (leadId, competitor) => {
    setLeads(prev => prev.map(l => l.id !== leadId ? l : { ...l, competitor }));
  };
  // Standalone "Schedule Test Drive" quick action (Lead Detail) — full date/time/location capture.
  // Distinguishes a fresh schedule from a reschedule of an existing one.
  const handleScheduleTestDrive = (leadId, data) => {
    setLeads(prev => prev.map(l => {
      if (l.id !== leadId) return l;
      const dateObj = parseDateInput(data.date);
      const modeLabel = TEST_DRIVE_MODES.find(m => m.key === data.mode)?.label || "";
      const locText = (data.locationText || "").trim();
      const isLink = locText.startsWith("http");
      const isReschedule = !!l.testDrive;
      return {
        ...l,
        testDrive: {
          mode: data.mode, date: dateObj, time: data.time,
          location: locText ? { text: isLink ? "" : locText, mapsLink: isLink ? locText : "" } : null,
        },
        timeline: [{ type: "test-drive", text: `Test drive ${isReschedule ? "rescheduled" : "scheduled"} — ${modeLabel} on ${fmt(dateObj)} at ${fmtTime(data.time)}`, date: today }, ...l.timeline],
      };
    }));
    showToast(`🚗 Test drive ${leads.find(l => l.id === leadId)?.testDrive ? "rescheduled" : "scheduled"}`);
  };
  // Marks the upcoming test drive as done, clears it from the queue, and logs the customer's
  // actual response — this also feeds the existing "recently completed" suppression in Calls.
  const handleCompleteTestDrive = (leadId, { response, note, booking }) => {
    setLeads(prev => prev.map(l => {
      if (l.id !== leadId) return l;
      const respLabel = TEST_DRIVE_RESPONSES.find(r => r.key === response)?.label || response;
      let updated = { ...l, testDrive: null };
      updated.timeline = [{ type: "test-drive", text: `Test drive completed — ${respLabel}`, date: today }, ...l.timeline];
      if (note?.trim()) updated.notes = [note.trim(), ...l.notes];

      // Feedback decides what happens next — a hot response shouldn't sit as cold as a lukewarm
      // one, and a negative response shouldn't get a false-urgency follow-up forced on it.
      if (response === "loved_ready") {
        // Per the stage map, this lead now belongs in Booking — as Ready_to_book if no money
        // has come in yet, or token_received once it has. It is never "done" at this point.
        updated.stage = "Booking";
        updated.bucket = "ready";
        if (booking?.received === "yes") {
          updated.stageSubtype = LEAD_SUBTYPE.TOKEN_RECEIVED;
          updated.booking = { advance: booking.amount, deliveryDate: null, mode: booking.mode };
          updated.followUp = null;
          updated.nextAction = "Token received — confirm delivery date";
          updated.timeline = [{ type: "booking", text: `Booking amount received — ₹${booking.amount} (${booking.mode})`, date: today }, ...updated.timeline];
        } else {
          updated.stageSubtype = LEAD_SUBTYPE.READY_TO_BOOK;
          const dt = parseDateInput(booking.promiseDate);
          updated.followUp = { date: dt, window: booking.promiseWindow };
          updated.nextAction = `Collect booking amount — customer committed ${fmt(dt)}`;
          updated.timeline = [{ type: "call", text: `Ready to book — booking amount promised for ${fmt(dt)} (${booking.promiseWindow})`, date: today }, ...updated.timeline];
        }
      } else if (response === "positive_comparing") {
        updated.followUp = { date: d(3), window: null };
        updated.nextAction = "Still comparing — follow up before they decide elsewhere";
        updated.bucket = "comparing";
      } else if (response === "neutral") {
        updated.followUp = { date: d(4), window: null };
        updated.nextAction = "Neutral on the test drive — check in and address concerns";
      } else if (response === "wants_second") {
        updated.followUp = { date: d(1), window: null };
        updated.nextAction = "Wants a second test drive — get it scheduled";
      }
      // "not_liked" — no follow-up forced; leaving it to be reviewed and marked lost if that's
      // where it's heading, rather than pretending there's momentum that isn't there.
      return updated;
    }));
    showToast("✅ Test drive marked complete");
  };
  const handleCancelTestDrive = (leadId, { reason, note }) => {
    setLeads(prev => prev.map(l => {
      if (l.id !== leadId) return l;
      const reasonLabel = TEST_DRIVE_CANCEL_REASONS.find(r => r.key === reason)?.label || reason;
      let updated = { ...l, testDrive: null };
      updated.timeline = [{ type: "test-drive", text: `Test drive cancelled — ${reasonLabel}`, date: today }, ...l.timeline];
      if (note?.trim()) updated.notes = [note.trim(), ...l.notes];
      return updated;
    }));
    showToast("Test drive cancelled");
  };

  // Post-call log: records the outcome as a timeline entry, and — for Call Back / Wants Test
  // Drive — updates the lead's followUp / testDrive fields so the queue reflects it next time.
  const handleLogCall = (leadId, payload) => {
    setLeads(prev => prev.map(l => {
      if (l.id !== leadId) return l;
      let updated = { ...l };
      const outcomeMeta = CALL_OUTCOMES.find(o => o.key === payload.outcome);
      let text = `Call outcome: ${outcomeMeta?.label || payload.outcome}`;

      if (payload.outcome === "not_interested" && payload.subReason) {
        const reason = NOT_INTERESTED_REASONS.find(r => r.key === payload.subReason);
        text = `Call outcome: ${reason?.label || "Not interested"}`;
      }
      if (payload.outcome === "callback" && payload.callback.date) {
        const dateObj = parseDateInput(payload.callback.date);
        const windowLabel = CALL_WINDOWS.find(w => w.key === payload.callback.window)?.label || "";
        text = `Call outcome: Requested callback — ${fmt(dateObj)} (${windowLabel})`;
        updated.followUp = { date: dateObj, window: payload.callback.window };
      }
      if (payload.outcome === "test_drive" && payload.testDrive.date) {
        const dateObj = parseDateInput(payload.testDrive.date);
        const modeLabel = TEST_DRIVE_MODES.find(m => m.key === payload.testDrive.mode)?.label || "";
        text = `Call outcome: Wants test drive — ${modeLabel} on ${fmt(dateObj)} at ${fmtTime(payload.testDrive.time)}`;
        const locText = (payload.testDrive.locationText || "").trim();
        const isLink = locText.startsWith("http");
        updated.testDrive = {
          mode: payload.testDrive.mode, date: dateObj, time: payload.testDrive.time,
          location: locText ? { text: isLink ? "" : locText, mapsLink: isLink ? locText : "" } : null,
        };
      }
      if (payload.outcome === "ready") {
        const locked = lockVehicle(payload.readyVehicle);
        if (payload.readyMode === "full") {
          const dateObj = parseDateInput(payload.readyRetailDate);
          text = `Call outcome: Ready to book — ${locked.model} ${locked.variant} confirmed, booked and retailed in one step, ₹${formatINR(paymentBreakdownTotal(payload.readyPaymentDetails))} settled`;
          Object.assign(updated, locked);
          updated.stage = "Retailed";
          updated.retailDate = dateObj;
          updated.paymentDetails = { ...payload.readyPaymentDetails, isFullPayment: true };
        } else if (payload.readyMode === "followup" && payload.readyFollowUp.date) {
          const dateObj = parseDateInput(payload.readyFollowUp.date);
          const windowLabel = CALL_WINDOWS.find(w => w.key === payload.readyFollowUp.window)?.label || "";
          text = `Ready to book — ${locked.model} ${locked.variant}, booking amount expected ${fmt(dateObj)} (${windowLabel})`;
          Object.assign(updated, locked);
          // Stage map: an interested customer with no money in yet sits in Booking as
          // Ready_to_book, with a scheduled call to collect. The lead is not closed.
          updated.stage = "Booking";
          updated.stageSubtype = LEAD_SUBTYPE.READY_TO_BOOK;
          updated.labels = [...new Set([...l.labels, "Ready to Book"])];
          updated.followUp = { date: dateObj, window: payload.readyFollowUp.window };
          updated.nextAction = `Collect booking amount — customer committed ${fmt(dateObj)}`;
        } else if (payload.readyBooking.advance) {
          const dateObj = parseDateInput(payload.readyBooking.deliveryDate);
          text = `Call outcome: Ready to book — ${locked.model} ${locked.variant} confirmed, ₹${payload.readyBooking.advance} advance (${payload.readyBooking.mode})`;
          Object.assign(updated, locked);
          updated.stage = "Booking";
          updated.stageSubtype = LEAD_SUBTYPE.TOKEN_RECEIVED;
          updated.expectedDeliveryDate = dateObj;
          updated.booking = { advance: payload.readyBooking.advance, deliveryDate: dateObj, mode: payload.readyBooking.mode };
        }
      }

      updated.timeline = [{ type: "call", text, date: today }, ...l.timeline];
      if (payload.note?.trim()) updated.notes = [payload.note.trim(), ...l.notes];

      const detected = detectSignalsFromNote(l, payload.note);
      if (detected.length) updated.suggestedSignals = [...(l.suggestedSignals || []), ...detected];

      return updated;
    }));
    showToast("✅ Call logged");
  };

  const handleCounterTap = (label) => setCounterFilter(label);
  const handleTabChange = (tab) => { setCounterFilter(null); setActiveTab(tab); };

  const handleAddLead = (form) => {
    const initialNotes = [];
    if (form.quoteNotes?.trim()) initialNotes.push(form.quoteNotes.trim());
    if (form.quoteDiscount) initialNotes.push(`Quoted with ₹${form.quoteDiscount.toFixed(1)} L discount`);
    const newLead = {
      id: ++LEAD_SEQ, owner: DEFAULT_USER_ID, name: form.name.trim(), phone: form.phone.trim(), altPhone: (form.altPhone || "").trim(),
      model: form.model, variant: form.variant || "Base", bucket: "new", propensity: 35,
      stage: "New", budget: form.budget || "—", targetDate: fmt(d(30)), created: today,
      followUp: null, source: form.source, summary: "New lead — not yet contacted", flag: "neutral",
      nextAction: "Make first contact call", labels: [], notes: initialNotes, channelUsage: { call: 0, whatsapp: 0 },
      timeline: [{ type: "visit", text: "Lead created", date: today }],
    };
    setLeads(prev => [newLead, ...prev]);
    setShowAddLead(false);
    setQuickQuotePrefill(null);
    setSelectedLeadId(newLead.id);
    showToast(`✅ ${newLead.name} added as a new lead`);
  };
  const handleConvertQuoteToLead = (data) => {
    setShowQuickQuote(false);
    setQuickQuotePrefill(data);
    setShowAddLead(true);
  };

  const user = userById(currentUserId);
  const selectedLead = leads.find(l => l.id === selectedLeadId);

  let screenName = { leads: "Leads", activity: "Activity", learning: "Learning", inventory: "Inventory", dashboard: "Dashboard", leaderboard: "Leaderboard" }[activeTab];
  if (counterFilter) screenName = counterFilter;
  if (selectedLead) screenName = selectedLead.name;
  if (showProfile) screenName = "Profile";

  return (
    <LangCtx.Provider value={lang}>
    <div style={{
      width: "100%", maxWidth: 420, margin: "0 auto", height: "100vh", maxHeight: 860,
      background: C.bg,
      display: "flex", flexDirection: "column", position: "relative",
      fontFamily: F,
      overflow: "hidden",
      boxShadow: `0 0 0 1px ${C.borderStrong}, 0 24px 64px rgba(14,14,12,0.16)`,
      borderRadius: 20,
    }}>
      <style>{FONTS}{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 0; height: 0; }
        .pulse-dot { animation: pulseAnim 1.8s ease-in-out infinite; }
        @keyframes pulseAnim { 0%,100% { opacity: 1; } 50% { opacity: .35; } }
        @keyframes confettiFall { 0% { transform: translateY(0) rotate(0deg); opacity: 1; } 100% { transform: translateY(420px) rotate(540deg); opacity: 0; } }
        @keyframes celebrationPop { 0% { transform: scale(.7); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes carBounce { 0%,100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-8px) scale(1.05); } }
        @keyframes shimmer { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }
        input::placeholder, textarea::placeholder { color: #A8A69F; }
        input[type="search"]::-webkit-search-cancel-button,
        input[type="search"]::-webkit-search-decoration { -webkit-appearance: none; appearance: none; }
        input:focus, textarea:focus, select:focus { outline: none; border-color: rgba(59,75,232,0.45) !important; box-shadow: 0 0 0 3px rgba(59,75,232,0.07); }
        select { appearance: none; -webkit-appearance: none; }
        @media (prefers-reduced-motion: reduce) { .pulse-dot { animation: none; } }
      `}</style>

      <Header
        screenName={screenName}
        user={user}
        onAvatar={() => setShowProfile(true)}
        onBack={showProfile ? () => setShowProfile(false) : (selectedLead ? () => setSelectedLeadId(null) : (counterFilter ? () => setCounterFilter(null) : null))}
        attentionCount={attentionItems.length}
        onBellTap={() => setShowNotifications(true)}
        onMenuTap={() => setMenuOpen(true)}
      />

      <div style={{ flex: 1, overflowY: "auto" }}>
        {showProfile ? (
          <ProfileScreen user={user} onLogout={() => showToast("Logged out (mock) — restarting demo")}
            voiceFirst={voiceFirst}
            onToggleVoiceFirst={() => { setVoiceFirst(v => !v); showToast(voiceFirst ? "Voice-first logging off" : "🎙️ Voice-first logging on"); }}
            lang={lang} onSetLang={(l) => { setLang(l); showToast(LANG_OPTIONS.find(x=>x.code===l)?.label + " selected"); }} />
        ) : selectedLead ? (
          <LeadDetail
            lead={selectedLead}
            onDone={() => setSelectedLeadId(null)}
            currentId={currentUserId}
            voiceFirst={voiceFirst}
            onUpdateCommPref={handleUpdateCommPref}
            onToggleLabel={handleToggleLabel}
            onAcceptSuggestedSignal={handleAcceptSuggestedSignal}
            onDismissSuggestedSignal={handleDismissSuggestedSignal}
            onCall={handleCall}
            onWhatsApp={handleWhatsApp}
            onAction={showToast}
            onAddNote={handleAddNote}
            onScheduleTestDrive={handleScheduleTestDrive}
            onCompleteTestDrive={handleCompleteTestDrive}
            onCancelTestDrive={handleCancelTestDrive}
            onLogCall={handleLogCall}
            onUpdateExchangeField={handleUpdateExchangeField}
            onAddExchangePhoto={handleAddExchangePhoto}
            onAppraiseExchange={handleScheduleAppraisal}
            onUpdateAltPhone={handleUpdateAltPhone}
            onEscalate={handleEscalate}
            onChangeStage={handleChangeStage}
            onConfirmBooking={handleConfirmBooking}
            onConfirmRetail={handleConfirmRetail}
            onConfirmDelivery={handleConfirmDelivery}
            onConfirmLost={handleConfirmLost}
            onUpdateFinanceField={handleUpdateFinanceField}
            onToggleDocument={handleToggleDocument}
            onUpdateLeadField={handleUpdateLeadField}
            onShareDocLink={handleShareDocLink}
            onAddDeliveryPhoto={handleAddDeliveryPhoto}
            onShareDelivery={handleShareDelivery}
            onSendQuote={handleSendQuote}
            onSetCompetitor={handleSetCompetitor}
            onLogWhatsApp={handleLogWhatsApp}
            onUpdateVehicles={handleUpdateVehicles}
            onToggleDrivingLicense={handleToggleDrivingLicense}
            onShareDLLink={handleShareDLLink}
            allLeads={scopedLeads}
          />
        ) : counterFilter ? (
          <FilteredLeadsScreen
            label={counterFilter}
            leads={scopedLeads}
            onOpenLead={setSelectedLeadId}
            onCall={handleCall}
            onWhatsApp={handleWhatsApp}
            onLogCall={handleLogCall}
          />
        ) : tabBase === "leads" ? (
          <LeadsScreen
            subView={subView}
            currentId={currentUserId}
            leads={scopedLeads}
            onOpenLead={setSelectedLeadId}
            onCall={handleCall}
            onWhatsApp={handleWhatsApp}
            onCounterTap={handleCounterTap}
            onLogCall={handleLogCall}
            onLogWhatsApp={handleLogWhatsApp}
            onAddLead={() => setShowAddLead(true)}
            showMIS={showMIS}
            onCloseMIS={() => setShowMIS(false)}
          />
        ) : tabBase === "activity" ? (
          <ActivityScreen leads={scopedLeads} onOpenLead={setSelectedLeadId} />
        ) : tabBase === "learning" ? (
          <LearningScreen />
        ) : tabBase === "account" ? (
          <div style={{ padding: "14px 14px 90px" }}>
            <div style={{ fontFamily: F, fontWeight: 800, fontSize: 15, color: C.ink, marginBottom: 3 }}>My Account</div>
            <div style={{ fontFamily: F, fontSize: 11.5, color: C.sub, marginBottom: 13 }}>
              Your login details and preferences.
            </div>
            {[
              { key: "profile",  label: "Profile",  value: userById(currentUserId)?.name || "—" },
              { key: "password", label: "Password", value: "••••••••" },
              { key: "language", label: "Language", value: "English" },
              { key: "email",    label: "Email ID", value: (userById(currentUserId)?.name || "user").toLowerCase().replace(/\s+/g, ".") + "@autoprism.in" },
            ].map(row => (
              <div key={row.key} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "13px 14px", marginBottom: 8,
                background: C.card, border: `1.5px solid ${subView === row.key ? C.primary : C.border}`,
                borderRadius: 12,
              }}>
                <span style={{ flex: 1, fontFamily: F, fontSize: 13, fontWeight: 700, color: C.ink }}>{row.label}</span>
                <span style={{ fontFamily: F, fontSize: 12, color: C.sub }}>{row.value}</span>
              </div>
            ))}
          </div>
        ) : tabBase === "inventory" ? (
          <InventoryScreen subView={subView} leads={scopedLeads} showToast={showToast} currentUser={userById(currentUserId)} releasedUnitId={releasedUnitId} onUpdateLead={(u) => setLeads(ls => ls.map(l => l.id === u.id ? u : l))} />
        ) : tabBase === "dashboard" ? (
          <SEDashboardScreen leads={scopedLeads} user={userById(currentUserId)} />
        ) : (
          <LeaderboardScreen currentId={currentUserId} />
        )}
      </div>

      {menuOpen && (
        <MenuDrawer
          active={activeTab}
          onChange={handleTabChange}
          onClose={() => setMenuOpen(false)}
          onQuickQuote={() => { setQuickQuotePrefill(null); setShowQuickQuote(true); }}
          onOpenMIS={() => { handleTabChange("leads"); setShowMIS(true); }}
          onLogout={() => { setMenuOpen(false); showToast("Logged out (mock) — restarting demo"); }}
        />
      )}

      {showAddLead && (
        <AddLeadSheet
          prefill={quickQuotePrefill}
          onClose={() => { setShowAddLead(false); setQuickQuotePrefill(null); }}
          onSubmit={handleAddLead}
        />
      )}
      {showQuickQuote && (
        <QuickQuoteSheet onClose={() => setShowQuickQuote(false)} onConvert={handleConvertQuoteToLead} />
      )}
      {showNotifications && (
        <NotificationsSheet items={attentionItems} onClose={() => setShowNotifications(false)} onOpenLead={(id) => { setShowNotifications(false); setSelectedLeadId(id); }} />
      )}
      {celebration && (
        <BookingCelebration data={celebration} repName={user.name} onClose={() => setCelebration(null)} />
      )}

      <Toast text={toast} />
    </div>
    </LangCtx.Provider>
  );
}
