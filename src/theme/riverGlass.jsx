import React from "react";

/* ==================================================================================
   RIVER GLASS — the shared look for every AUTOPRISM login (CEO, Manager, Sales
   Executive, Telecaller).

   Autoprism is the CRM vendor; the dealer (Epic River, a River dealer) is the client. The
   product keeps its identity (AUTOPRISM wordmark, layout, neutral greys); the ACCENT palette
   is a dealer theme, switched with data-theme on the app root:
   - "autoprism" — the product default: indigo accent, indigo / lilac / mint backdrop.
   - "river"     — River's brand: River Yellow #F7EC2B + River Ink #373409. Solid, small yellow
                   moments (progress fills, selected thumb / chip / nav item, sort mark, focus
                   halo, key-number underline), ink primary buttons with yellow text, an ink
                   header band with light-on-dark header. Yellow is never a text colour on light.
   Theme tokens are CSS custom properties (see THEME_VARS); inline styles use them through
   ACCENT ("var(--accent)", …). <ThemeRoot> / useTheme() read ?theme= → localStorage → a
   postMessage from the showcase shell and set data-theme on the app root.

   Material: cards and metric boxes are "pre-frosted" (translucent fill + specular rim + sheen +
   noise over the soft backdrop) and carry NO backdrop-filter — blurring a smooth gradient
   changes nothing visible and costs a full-surface blur per card per frame. Real
   backdrop-filter is kept only where content actually scrolls or sits underneath: the header
   bar, the pinned table header, the drawer, sheets / modals and toasts.
   Key numbers sit in TINTED boxes (2–3 per screen); the tint says what kind of number it is
   (see TINTS / LABEL_TINT). Everything else is neutral glass.
   Plain React + a CSS string; no dependencies. Inject once with <RiverGlassStyles/> (ThemeRoot
   does it for you).
   ================================================================================== */

/* ---------------- Tokens ---------------- */
export const FONT = "-apple-system, 'SF Pro Text', 'SF Pro Display', Inter, system-ui, sans-serif";
export const FONT_DISPLAY = "-apple-system, 'SF Pro Display', 'SF Pro Text', Inter, system-ui, sans-serif";   // big numbers, titles

/* Neutral text colours (hex; the same in every theme), tuned so body text keeps ≥ 4.5:1 on the
   glass. `primary` / `primarySoft` are the legacy indigo for apps not yet on themes — themed
   code uses ACCENT instead. */
export const C = {
  bg: "#F6F7FB", card: "rgba(255,255,255,0.72)", border: "rgba(15,23,42,0.06)", borderStrong: "rgba(15,23,42,0.12)",
  ink: "#0B1946", sub: "#4A5578", faint: "#5D6577", ghost: "#AEB4CB",
  primary: "#3B4BE8", primarySoft: "rgba(59,75,232,0.10)",   // legacy: unthemed apps only
  hot: "#C62828", hotSoft: "rgba(198,40,40,0.08)",
  warm: "#B45309", warmSoft: "rgba(245,158,11,0.10)",
  green: "#2A7330", greenSoft: "rgba(46,125,50,0.09)",
  purple: "#6D28D9", teal: "#00695C",
};
/* River's palette (sampled from River's price sheet + the Indie's colour names). */
export const RIVER = { yellow: "#F7EC2B", ink: "#373409" };
export const BOX_SUB = "#474C57";   // neutral dark grey for sub-lines on every tint
/* Better/worse numbers INSIDE a tinted box: the same green/red rule, one step deeper so they
   keep ≥ 7:1 on the more see-through glass. Outside boxes keep using C.green / C.hot. */
export const TONE = { up: "#1B4F21", down: "#8C1A14" };

/* Theme-dependent colours for inline styles. Each is a CSS var() string, so it follows the
   data-theme of the nearest themed ancestor. Never pass these to rgba()/deepen()/pale() — those
   need hex; use color-mix() (see mixVar) instead. */
export const ACCENT = {
  primary: "var(--accent)",          // solid accent fill (primary button, active marks)
  ink: "var(--accent-ink)",          // text / icon ON an accent fill
  soft: "var(--accent-soft)",        // selected item background (river: solid yellow)
  onSoft: "var(--accent-on-soft)",   // text / icon on `soft`
  strong: "var(--accent-strong)",    // interactive text on light glass (links, ghost-button labels)
  link: "var(--link)",               // link text colour (pair with LINK_DECO)
  focus: "var(--focus)",
  iconBg: "var(--icon-bg)", iconInk: "var(--icon-ink)",       // small round icon badges
  rowOn: "var(--row-on)",                                       // open / active list row
  num: "var(--num)",                                            // big numbers in boxes
  level: "var(--level-1)",                                      // first hierarchy level colour (ZH / State)
  dot: "var(--dot)",                                            // the AUTOPRISM wordmark dot
  hdrInk: "var(--hdr-ink)",                                     // text / icons in the header bar
  sortInk: "var(--sort-ink)", sortBg: "var(--sort-bg)",         // active sort arrow / label highlight
};
/* Link affordance: river = ink text with a solid yellow underline; autoprism = plain indigo. */
export const LINK_DECO = { textDecorationLine: "var(--link-line)", textDecorationColor: "var(--link-deco)",
  textDecorationThickness: 2, textUnderlineOffset: 3 };
/* A translucent version of any colour, including var() strings (color-mix). */
export const mixVar = (color, pct, base = "transparent") => `color-mix(in srgb, ${color} ${pct}%, ${base})`;

/* c = the tint, a = [top-left, bottom-right] alpha of the tint gradient, label = dark shade for
   the small label (≥ 4.5:1 on its own tint), deep = alarm number (≥ 7:1).
   "neutral" is plain glass (no tint). "grey" is kept as an alias of neutral for older code. */
export const TINTS = {
  yellow:  { c: "#F7EC2B", a: [0.46, 0.20], label: "#5A5100" },                 // River Yellow — units, achievement
  blue:    { c: "#3D6FB6", a: [0.34, 0.14], label: "#244A80" },                 // Monsoon Blue — ₹ value, insurance
  mint:    { c: "#3BB08F", a: [0.27, 0.10], label: "#1A644F" },                 // mint — finance, income
  coral:   { c: "#E0533D", a: [0.25, 0.09], label: "#963020", deep: "#761A10" }, // Summer Red — alerts, aged, overdue
  neutral: { c: "#5F6B7A", a: [0, 0], label: C.sub, neutral: true },           // neutral glass — everything else
};
TINTS.grey = TINTS.neutral;   // the grey tint was dropped: grey boxes are neutral glass now
/* Label → tint. Apps can pass `tint` explicitly instead; add a label here only when its meaning
   is the same in every app. Only 2–3 headline numbers per screen get a tint. */
export const LABEL_TINT = {
  Retail: "yellow", Units: "yellow", Achievement: "yellow", Deliveries: "yellow", Target: "yellow",
  "Sales value": "blue", Value: "blue", "In-house insurance": "blue", Insurance: "blue",
  "Add-ons / scooter": "blue", "Add-ons ₹/scooter": "blue",
  "In-house finance": "mint", Finance: "mint", "F&I and add-on income": "mint", "Income per scooter": "mint", Income: "mint",
  "90+ days": "coral", Overdue: "coral", Missed: "coral", Aged: "coral",
  // secondary numbers: neutral glass
  Bookings: "neutral", Leads: "neutral", Pipeline: "neutral", Enquiries: "neutral", "Test rides": "neutral", Calls: "neutral",
  "Avg premium": "neutral", "Avg loan": "neutral", "Accessory attach": "neutral", "River Care attach": "neutral",
};
const tintName = (n) => (TINTS[n] ? (TINTS[n].neutral ? "neutral" : n) : "neutral");

/* ---------------- Colour helpers (hex only) ---------------- */
const rgbList = (hex) => { const n = parseInt(hex.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
export const rgbOf = (hex) => rgbList(hex).join(",");
export const rgba = (hex, a) => `rgba(${rgbOf(hex)},${a})`;
/* 70% tone + 30% navy ink, for small text on a pale tint of the same tone. */
export const deepen = (hex) => `rgb(${rgbList(hex).map((v, i) => Math.round(v * 0.7 + [11, 25, 70][i] * 0.3)).join(",")})`;
/* Solid pale tint, used where transparency is reduced. */
export const pale = (hex, k) => `rgb(${rgbList(hex).map(v => Math.round(v * k + 255 * (1 - k))).join(",")})`;
/* CSS variables for a tinted glass surface: spread into `style` together with className="rg-box rg-box-tint". */
export function tintVars(name, inner) {
  const tk = TINTS[tintName(name)];
  const [a1, a2] = inner ? tk.a.map(x => +(x * 0.6).toFixed(3)) : tk.a;
  return { "--t": rgbOf(tk.c), "--a1": a1, "--a2": a2, "--tp": pale(tk.c, inner ? 0.12 : 0.2) };
}

/* ---------------- Themes ---------------- */
export const THEMES = ["river", "autoprism"];
export const DEFAULT_THEME = "autoprism";          // the product default; the Epic River demo passes ?theme=river
export const THEME_KEY = "rg-theme";               // localStorage key (shared with the showcase shell)
export const THEME_MESSAGE = "rg-theme";           // postMessage { type: "rg-theme", theme } from the parent frame

/* Indigo / lilac / mint backdrop: an indigo field on the left, lilac right, mint low. The top stays
   light so the header can stay light glass with the navy wordmark (and unthemed apps, which get
   this default, keep their light headers). */
const MESH_AUTOPRISM = [
  "radial-gradient(80% 26% at -14% 36%, rgba(59,75,232,0.26) 0%, rgba(59,75,232,0.10) 50%, rgba(59,75,232,0) 78%)",
  "radial-gradient(60% 30% at 110% 34%, rgba(150,120,220,0.34) 0%, rgba(150,120,220,0) 100%)",
  "radial-gradient(64% 30% at 106% 82%, rgba(59,75,232,0.24) 0%, rgba(59,75,232,0) 100%)",
  "radial-gradient(76% 32% at -8% 98%, rgba(59,176,143,0.32) 0%, rgba(59,176,143,0) 100%)",
  "linear-gradient(180deg, #EEF0FA 0%, #F5F5FA 45%, #F1F4F6 100%)",
].join(",");
/* River: an ink band behind the header (the header is light-on-dark ink glass, with a yellow
   hairline), then a calm neutral base with faint Monsoon-blue and mint glows. No yellow wash:
   pale yellow over a large area reads as a stain, so yellow is only used solid and small. The band ends exactly at the 58px header edge, so no body text
   sits on the dark part; it keeps the header dark while light cards scroll under it. */
const MESH_RIVER = [
  "linear-gradient(180deg, #2A2805 0px, #373409 58px, rgba(55,52,9,0) 58px)",
  "radial-gradient(70% 30% at 108% 30%, rgba(61,111,182,0.20) 0%, rgba(61,111,182,0) 100%)",
  "radial-gradient(60% 26% at 106% 96%, rgba(61,111,182,0.14) 0%, rgba(61,111,182,0) 100%)",
  "radial-gradient(70% 28% at -10% 70%, rgba(59,176,143,0.16) 0%, rgba(59,176,143,0) 100%)",
  "radial-gradient(60% 24% at -8% 100%, rgba(55,52,9,0.06) 0%, rgba(55,52,9,0) 100%)",
  "linear-gradient(180deg, #F1F2F4 0%, #F5F5F4 50%, #EFF1F2 100%)",
].join(",");

/* One block per theme. :root carries the product default so unthemed apps keep working. */
const THEME_VARS = {
  autoprism: {
    "--accent": "#3B4BE8", "--accent-ink": "#FFFFFF",
    "--accent-grad": "linear-gradient(180deg,#4F5DF0 0%,#3B4BE8 100%)", "--accent-glow": "rgba(59,75,232,0.28)",
    "--accent-soft": "rgba(59,75,232,0.10)", "--accent-on-soft": "#3B4BE8", "--accent-strong": "#3341D6",
    "--link": "#3341D6", "--link-line": "none", "--link-deco": "transparent",
    "--focus": "#3B4BE8", "--focus-border": "rgba(59,75,232,0.60)", "--focus-halo": "rgba(59,75,232,0.18)",
    "--brand-yellow": RIVER.yellow, "--brand-ink": RIVER.ink,
    "--icon-bg": "rgba(59,75,232,0.10)", "--icon-ink": "#3B4BE8",
    "--row-on": "rgba(99,102,241,0.07)", "--num": C.ink, "--level-1": "#3B4BE8", "--dot": "#3B4BE8",
    "--seg-thumb": "linear-gradient(180deg,#FFFFFF 0%,#F6F7FF 100%)", "--seg-ring": "rgba(59,75,232,0.32)", "--seg-on": "#3B4BE8",
    "--chip-on-bg": "rgba(59,75,232,0.12)", "--chip-on-border": "rgba(59,75,232,0.38)", "--chip-on-ink": "#3341D6",
    "--sort-ink": "#3B4BE8", "--sort-bg": "transparent",
    "--bar-fill": "#3B4BE8", "--bar-track": "rgba(11,25,70,0.10)", "--bar-edge": "transparent", "--bar-mark": "#0B1946",
    "--key-line": "transparent",
    "--hdr-bg": "linear-gradient(180deg,rgba(255,255,255,0.66) 0%,rgba(255,255,255,0.48) 100%)", "--hdr-line": "rgba(255,255,255,0.75)",
    "--hdr-ink": C.ink, "--hdr-chip-bg": "rgba(255,255,255,0.72)", "--hdr-chip-ink": C.ink, "--hdr-chip-ring": "rgba(15,23,42,0.10)",
    "--toast-bg": "rgba(11,25,70,0.88)",
    "--dealer-chip-bg": "rgba(255,255,255,0.7)", "--dealer-chip-ring": "rgba(55,52,9,0.12)",
    "--mesh": MESH_AUTOPRISM,
  },
  river: {
    "--accent": RIVER.ink, "--accent-ink": RIVER.yellow,
    "--accent-grad": "linear-gradient(180deg,#4A4615 0%,#373409 100%)", "--accent-glow": "rgba(55,52,9,0.30)",
    "--accent-soft": RIVER.yellow, "--accent-on-soft": RIVER.ink, "--accent-strong": RIVER.ink,
    "--link": RIVER.ink, "--link-line": "underline", "--link-deco": RIVER.yellow,
    "--focus": RIVER.ink, "--focus-border": RIVER.ink, "--focus-halo": "rgba(247,236,43,0.95)",
    "--brand-yellow": RIVER.yellow, "--brand-ink": RIVER.ink,
    "--icon-bg": RIVER.yellow, "--icon-ink": RIVER.ink,
    "--row-on": "rgba(55,52,9,0.055)", "--num": RIVER.ink, "--level-1": "#6E6300", "--dot": RIVER.yellow,
    "--seg-thumb": RIVER.yellow, "--seg-ring": "rgba(55,52,9,0.30)", "--seg-on": RIVER.ink,
    "--chip-on-bg": RIVER.yellow, "--chip-on-border": "rgba(55,52,9,0.38)", "--chip-on-ink": RIVER.ink,
    "--sort-ink": RIVER.ink, "--sort-bg": RIVER.yellow,
    "--bar-fill": RIVER.yellow, "--bar-track": "rgba(55,52,9,0.12)", "--bar-edge": "rgba(55,52,9,0.55)", "--bar-mark": RIVER.ink,
    "--key-line": RIVER.yellow,
    "--hdr-bg": "linear-gradient(180deg,rgba(42,40,5,0.84) 0%,rgba(55,52,9,0.76) 100%)", "--hdr-line": "rgba(247,236,43,0.85)",
    "--hdr-ink": "#FFFDF0", "--hdr-chip-bg": RIVER.yellow, "--hdr-chip-ink": RIVER.ink, "--hdr-chip-ring": "rgba(0,0,0,0.25)",
    "--toast-bg": "rgba(42,40,5,0.90)",
    "--dealer-chip-bg": RIVER.yellow, "--dealer-chip-ring": "rgba(55,52,9,0.22)",
    "--mesh": MESH_RIVER,
  },
};
const varBlock = (o) => Object.entries(o).map(([k, v]) => `${k}:${v};`).join("");

/* ---------------- The material ---------------- */
const blur = (px, sat) => `-webkit-backdrop-filter:blur(${px}px) saturate(${sat}%);backdrop-filter:blur(${px}px) saturate(${sat}%);`;
const NOISE = `url("data:image/svg+xml,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/>" +
  "<feColorMatrix values='0 0 0 0 0.5 0 0 0 0 0.5 0 0 0 0 0.5 0 0 0 1 0'/></filter><rect width='100%' height='100%' filter='url(#n)' opacity='0.03'/></svg>")}")`;
/* the surfaces that get the specular rim + sheen */
const SURF = ".rg-glass,.rg-box,.rg-sheet,.rg-drawer,.rg-pin,.rg-btn,.rg-chip";
const sel = (suffix) => SURF.split(",").map(s => s + suffix).join(",");
const LIFT = "0 1px 2px rgba(15,23,42,0.05),0 14px 38px -8px rgba(31,38,135,0.16)";   // contact + ambient
const INNER = "inset 0 1px 0 rgba(255,255,255,0.92),inset 0 0 22px rgba(255,255,255,0.34)";   // top highlight + inner glow
const HILITE = "radial-gradient(120% 70% at 0% 0%, rgba(255,255,255,0.46) 0%, rgba(255,255,255,0) 55%)";
/* "Pre-frosted" fill: what a blur would give over a soft backdrop — a milky, slightly brighter top. */
const FROST = (a) => `linear-gradient(180deg,rgba(255,255,255,${a + 0.06}) 0%,rgba(255,255,255,${a}) 60%,rgba(255,255,255,${a - 0.03}) 100%)`;

export const GLASS_CSS = `
:root,[data-theme="autoprism"]{${varBlock(THEME_VARS.autoprism)}}
[data-theme="river"]{${varBlock(THEME_VARS.river)}}
.rg-root{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;font-family:${FONT};color:${C.ink};}
.rg-mesh{background:var(--mesh);}

${SURF}{position:relative;isolation:isolate;}
${sel("::before")}{content:"";position:absolute;inset:-1px;border-radius:inherit;padding:1px;pointer-events:none;z-index:-1;
  background:linear-gradient(135deg,rgba(255,255,255,1) 0%,rgba(255,255,255,0.6) 22%,rgba(255,255,255,0) 48%,rgba(255,255,255,0) 70%,rgba(255,255,255,0.5) 100%);
  -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;}
${sel("::after")}{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;z-index:-1;
  background:linear-gradient(118deg,rgba(255,255,255,0) 28%,rgba(255,255,255,0.22) 40%,rgba(255,255,255,0.07) 47%,rgba(255,255,255,0) 56%),${NOISE};}

/* Cards, boxes, buttons, chips: pre-frosted, no backdrop-filter. */
.rg-glass{background:${HILITE},${FROST(0.6)};border:1px solid rgba(15,23,42,0.07);border-radius:24px;box-shadow:${INNER},${LIFT};}
.rg-box{background:${HILITE},${FROST(0.58)};border:1px solid rgba(15,23,42,0.07);border-radius:18px;box-shadow:${INNER},${LIFT};transition:transform .18s ease;}
.rg-box.rg-inner{background:${HILITE},${FROST(0.5)};box-shadow:${INNER},0 1px 2px rgba(15,23,42,0.04),0 4px 14px -4px rgba(31,38,135,0.10);}
.rg-box:active{transform:scale(.98);}
.rg-box.rg-box-tint{border:1px solid rgba(var(--t),0.18);border-radius:20px;
  background:radial-gradient(110% 80% at 0% 0%,rgba(255,255,255,0.52) 0%,rgba(255,255,255,0) 50%),
    linear-gradient(135deg,rgba(var(--t),var(--a1)) 0%,rgba(var(--t),var(--a2)) 100%),rgba(255,255,255,0.40);
  box-shadow:inset 0 1px 0 rgba(255,255,255,0.88),inset 0 0 20px rgba(255,255,255,0.24),0 1px 2px rgba(var(--t),0.10),0 14px 34px -8px rgba(var(--t),0.32);}
/* river: the yellow box is only lightly tinted, so its solid yellow moments (underline, bar) carry the colour */
.rg-box-tint[data-tint="yellow"]{--a1:0!important;--a2:0!important;--tp:rgba(255,255,255,0.92)!important;--t:55,52,9!important;}
.rg-box-tint.rg-inner[data-tint="yellow"]{--a1:0!important;--a2:0!important;--t:55,52,9!important;}
.rg-box.rg-box-tint.rg-inner{border-radius:16px;box-shadow:inset 0 1px 0 rgba(255,255,255,0.8),inset 0 0 14px rgba(255,255,255,0.2),0 4px 14px -4px rgba(var(--t),0.22);}
.rg-btn{background:${HILITE},${FROST(0.64)};border:1px solid rgba(15,23,42,0.08);box-shadow:inset 0 1px 0 rgba(255,255,255,0.9),0 1px 2px rgba(15,23,42,0.05),0 4px 12px -2px rgba(31,38,135,0.10);}
.rg-chip{display:inline-flex;align-items:center;gap:5px;padding:6px 12px;border-radius:999px;border:1px solid rgba(15,23,42,0.10);
  background:rgba(255,255,255,0.66);color:${C.sub};font-family:${FONT};font-weight:600;font-size:11.5px;line-height:1.2;
  box-shadow:inset 0 1px 0 rgba(255,255,255,0.85),0 1px 3px rgba(15,23,42,0.05);}
.rg-chip.on,.rg-chip[aria-pressed=true]{background:var(--chip-on-bg);border-color:var(--chip-on-border);color:var(--chip-on-ink);}

/* Real glass (backdrop-filter): only where content moves underneath. */
.rg-bar{${blur(30, 180)}background:var(--hdr-bg);border-bottom:1px solid var(--hdr-line);color:var(--hdr-ink);
  box-shadow:inset 0 -1px 0 rgba(15,23,42,0.06),0 8px 24px -14px rgba(31,38,135,0.28);}
.rg-bar-chip{background:var(--hdr-chip-bg);color:var(--hdr-chip-ink);box-shadow:inset 0 0 0 1px var(--hdr-chip-ring),inset 0 1px 0 rgba(255,255,255,0.55),0 2px 6px rgba(15,23,42,0.12);}
.rg-pin{${blur(24, 180)}background:rgba(255,255,255,0.82);border-radius:14px;box-shadow:inset 0 1px 0 rgba(255,255,255,0.9),0 1px 2px rgba(15,23,42,0.05),0 8px 22px -6px rgba(31,38,135,0.14);}
.rg-drawer{${blur(36, 190)}background:${HILITE},rgba(255,255,255,0.84);border-right:1px solid rgba(15,23,42,0.05);
  box-shadow:inset 0 1px 0 rgba(255,255,255,0.9),inset -1px 0 0 rgba(255,255,255,0.6),0 10px 44px rgba(31,38,135,0.22);}
.rg-sheet{${blur(36, 190)}background:${HILITE},rgba(255,255,255,0.74);border-radius:28px 28px 0 0;border:1px solid rgba(15,23,42,0.06);border-bottom:none;
  box-shadow:inset 0 1px 0 rgba(255,255,255,0.95),0 -10px 40px rgba(31,38,135,0.18);}
.rg-sheet.rg-center{border-radius:24px;border-bottom:1px solid rgba(15,23,42,0.06);box-shadow:${INNER},0 2px 4px rgba(15,23,42,0.06),0 24px 60px -10px rgba(31,38,135,0.28);}
.rg-toast{${blur(20, 160)}background:var(--toast-bg);color:#fff;box-shadow:inset 0 1px 0 rgba(255,255,255,0.14),0 10px 30px rgba(11,25,70,0.28);}
.rg-grabber{width:36px;height:5px;border-radius:3px;background:rgba(15,23,42,0.18);margin:8px auto 4px;}
.rg-dim{background:rgba(15,23,42,0.32);}

/* Accent pieces. */
.rg-btn-primary{position:relative;border:none;color:var(--accent-ink);background:var(--accent-grad);
  box-shadow:inset 0 1px 0 rgba(255,255,255,0.30),inset 0 -1px 0 rgba(0,0,0,0.18),0 6px 18px var(--accent-glow);}
.rg-btn-primary:disabled{background:rgba(15,23,42,0.10);color:${C.faint};box-shadow:none;}
.rg-seg{background:rgba(15,23,42,0.06);box-shadow:inset 0 1px 2px rgba(15,23,42,0.06),inset 0 0 0 1px rgba(255,255,255,0.55);}
.rg-thumb{background:var(--seg-thumb);box-shadow:0 0 0 1px var(--seg-ring),inset 0 1px 0 rgba(255,255,255,0.7),0 3px 8px rgba(15,23,42,0.12),0 1px 1px rgba(15,23,42,0.04);transition:transform .2s ease;}
.rg-list-row{display:flex;align-items:center;gap:10px;padding:11px 12px;border-bottom:1px solid rgba(15,23,42,0.07);background:transparent;transition:background-color .18s ease;}
.rg-list-row:last-child{border-bottom:none;}
.rg-list-row.on,.rg-list-row:active{background:var(--row-on);}
.rg-input{width:100%;box-sizing:border-box;border:1px solid ${C.borderStrong};border-radius:12px;padding:10px 12px;font-family:${FONT};font-size:13px;color:${C.ink};
  background:rgba(255,255,255,0.76);outline:none;box-shadow:inset 0 1px 2px rgba(15,23,42,0.05);transition:border-color .18s ease,box-shadow .18s ease;}
.rg-input::placeholder{color:#6B7286;}
.rg-field:focus,.rg-input:focus{border-color:var(--focus-border)!important;box-shadow:0 0 0 3px var(--focus-halo)!important;}
.rg-root button:focus-visible,.rg-root a:focus-visible{outline:2px solid var(--focus);outline-offset:2px;}
[data-theme="river"] .rg-root button:focus-visible,[data-theme="river"].rg-root button:focus-visible{box-shadow:0 0 0 5px var(--focus-halo);}
.rg-press{transition:transform .18s ease;}
.rg-press:active{transform:scale(.98);}
.rg-chev{transition:transform .18s ease;}

@supports not ((backdrop-filter:blur(1px)) or (-webkit-backdrop-filter:blur(1px))){
  .rg-pin,.rg-drawer,.rg-sheet{background:rgba(255,255,255,0.95);}
  .rg-toast{background:rgba(11,25,70,0.96);}
  [data-theme="river"] .rg-toast,[data-theme="river"].rg-toast{background:rgba(42,40,5,0.97);}
  .rg-bar{background:rgba(255,255,255,0.94);}
  [data-theme="river"] .rg-bar{background:#373409;}
}
@media (prefers-reduced-transparency:reduce){
  .rg-glass,.rg-box,.rg-box.rg-inner,.rg-pin,.rg-drawer,.rg-btn,.rg-sheet,.rg-chip{background:rgba(255,255,255,0.95);}
  .rg-box.rg-box-tint,.rg-box.rg-box-tint.rg-inner{background:var(--tp);}
  .rg-bar{background:rgba(255,255,255,0.95);}
  [data-theme="river"] .rg-bar{background:#373409;}
}
@media (prefers-reduced-motion:reduce){
  .rg-root *{transition:none!important;}
  .rg-press:active,.rg-box:active{transform:none;}
}
`;

/* Inject the CSS once per document, however many times it is rendered. */
export function RiverGlassStyles() {
  React.useInsertionEffect(() => {
    if (document.getElementById("river-glass-css")) return;
    const s = document.createElement("style"); s.id = "river-glass-css"; s.textContent = GLASS_CSS;
    document.head.appendChild(s);
  }, []);
  return null;
}

/* ---------------- Theme hook + root ---------------- */
const isTheme = (t) => THEMES.includes(t);
function initialTheme() {
  try { const q = new URLSearchParams(window.location.search).get("theme"); if (isTheme(q)) return q; } catch (e) { /* no URL */ }
  try { const s = window.localStorage.getItem(THEME_KEY); if (isTheme(s)) return s; } catch (e) { /* storage blocked */ }
  return DEFAULT_THEME;
}
/* The current dealer theme: ?theme= on the page URL, else localStorage[THEME_KEY], else
   DEFAULT_THEME. Follows live changes from the parent frame (postMessage
   { type: "rg-theme", theme }, same origin only) and from other tabs (storage event). */
export function useTheme() {
  const [theme, setTheme] = React.useState(initialTheme);
  React.useEffect(() => {
    const onMsg = (e) => {
      if (e.origin !== window.location.origin || e.source !== window.parent) return;
      const d = e.data;
      if (d && d.type === THEME_MESSAGE && isTheme(d.theme)) setTheme(d.theme);
    };
    const onStorage = (e) => { if (e.key === THEME_KEY && isTheme(e.newValue)) setTheme(e.newValue); };
    window.addEventListener("message", onMsg);
    window.addEventListener("storage", onStorage);
    return () => { window.removeEventListener("message", onMsg); window.removeEventListener("storage", onStorage); };
  }, []);
  return theme;
}
/* The themed app root: rg-root + rg-mesh + data-theme, and the glass CSS. Replaces the app's
   outer <div className="rg-root rg-mesh">. `theme` overrides the hook (tests, previews). */
export const ThemeRoot = React.forwardRef(function ThemeRoot({ theme, className, children, ...rest }, ref) {
  const live = useTheme();
  return (
    <div ref={ref} {...rest} data-theme={theme || live} className={`rg-root rg-mesh${className ? " " + className : ""}`}>
      <RiverGlassStyles />
      {children}
    </div>
  );
});

/* ---------------- Components ---------------- */
const ok = (x) => x != null && Number.isFinite(x);
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

/* Neutral glass card. */
export function GlassCard({ children, style, className, ...rest }) {
  return <div {...rest} className={`rg-glass${className ? " " + className : ""}`} style={{ padding: 14, marginBottom: 12, ...style }}>{children}</div>;
}
/* Any tinted glass box (for custom content). `inner` = sits inside a card (lighter tint).
   tint "neutral" (or the old "grey") renders plain neutral glass. */
export function TintedBox({ tint = "neutral", inner, className, style, children, ...rest }) {
  const name = tintName(tint);
  const neutral = name === "neutral";
  return <div {...rest} data-tint={name} className={`rg-box${neutral ? "" : " rg-box-tint"}${inner ? " rg-inner" : ""}${className ? " " + className : ""}`}
    style={{ ...(neutral ? null : tintVars(name, inner)), minWidth: 0, ...style }}>{children}</div>;
}

/* A key number in a glass box: small label (dark shade of the tint), big number in the theme's
   number ink, one or two neutral grey sub-lines. `tint` overrides the LABEL_TINT lookup (default
   neutral). `tone` colours the number: C.ink/C.faint map to the number ink / neutral grey,
   C.green/C.hot to TONE.up/down, any other colour is used as is. `inner` = inside a card.
   `span` = full grid row. `bar` = { v, mark }: a slim progress bar (v = fill 0–1, mark = optional
   tick, e.g. projection). Yellow (units / achievement) boxes get the key-number underline in the
   river theme. */
const BOX_TONE = { [C.ink]: ACCENT.num, [C.faint]: BOX_SUB, [C.green]: TONE.up, [C.hot]: TONE.down };
export function Metric({ label, value, after, sub, sub2, tone, span, inner, testid, bar, tint, style, ...rest }) {
  const name = tintName(tint || LABEL_TINT[label] || "neutral");
  const tk = TINTS[name];
  const key = name === "yellow";
  return (
    <TintedBox {...rest} tint={name} inner={inner} data-testid={testid}
      style={{ padding: inner ? "11px 12px 10px" : "12px 14px 11px", gridColumn: span ? "1 / -1" : undefined, ...style }}>
      <div style={{ fontFamily: FONT, fontSize: 11, fontWeight: 600, color: tk.label, lineHeight: 1.25 }}>{label}</div>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: inner ? 20 : 23, fontWeight: 650, letterSpacing: "-0.02em", color: BOX_TONE[tone] || tone || ACCENT.num,
        marginTop: 4, lineHeight: 1.1, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
        <span style={key ? { textDecorationLine: "underline", textDecorationColor: "var(--key-line)", textDecorationThickness: 4,
          textUnderlineOffset: 5, textDecorationSkipInk: "none" } : undefined}>{value}</span>
        {after && <span style={{ fontSize: 13, fontWeight: 500, letterSpacing: 0, color: BOX_SUB }}>{after}</span>}
      </div>
      {bar && ok(bar.v) && (
        <div aria-hidden style={{ position: "relative", height: 5, borderRadius: 5, background: "var(--bar-track)", margin: key ? "9px 0 1px" : "7px 0 1px" }}>
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${clamp(bar.v, 0, 1) * 100}%`, borderRadius: 5, background: "var(--bar-fill)",
            boxShadow: "inset 0 0 0 1px var(--bar-edge)" }} />
          {ok(bar.mark) && <div style={{ position: "absolute", top: -2, bottom: -2, width: 2, borderRadius: 1, left: `calc(${clamp(bar.mark, 0, 1) * 100}% - 1px)`,
            background: "var(--bar-mark)", opacity: 0.55 }} />}
        </div>
      )}
      {sub && <div style={{ fontFamily: FONT, fontSize: 11, color: BOX_SUB, marginTop: 4, lineHeight: 1.3 }}>{sub}</div>}
      {sub2 && <div style={{ fontFamily: FONT, fontSize: 10.5, color: BOX_SUB, marginTop: 1, lineHeight: 1.3 }}>{sub2}</div>}
    </TintedBox>
  );
}
/* Two-column grid of Metric boxes. */
export function MetricGrid({ children, testid, style, cols = 2 }) {
  return <div data-testid={testid} style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))`, gap: 10, marginBottom: 12, ...style }}>{children}</div>;
}

/* iOS segmented control: a frosted track with a thumb that slides to the chosen option.
   autoprism: white thumb, indigo label; river: solid yellow thumb, ink label. opts = [[value, label], ...]. */
export function Seg({ value, onChange, opts, testid }) {
  const i = Math.max(0, opts.findIndex(([v]) => v === value));
  return (
    <span data-testid={testid} className="rg-seg" style={{ position: "relative", display: "inline-grid", gridTemplateColumns: `repeat(${opts.length}, 1fr)`,
      flexShrink: 0, borderRadius: 10, padding: 2 }}>
      <span aria-hidden className="rg-thumb" style={{ position: "absolute", top: 2, bottom: 2, left: 2, borderRadius: 8,
        width: `calc((100% - 4px) / ${opts.length})`, transform: `translateX(${i * 100}%)` }} />
      {opts.map(([v, label]) => {
        const on = value === v;
        return (
          <button key={v} type="button" aria-pressed={on} data-testid={testid && `${testid}-${v}`} onClick={() => onChange(v)} style={{
            position: "relative", padding: "5px 9px", borderRadius: 8, border: "none", cursor: "pointer", background: "none",
            color: on ? "var(--seg-on)" : C.sub, fontFamily: FONT, fontWeight: on ? 650 : 500, fontSize: 11.5, transition: "color .2s ease",
            WebkitTapHighlightColor: "transparent" }}><span>{label}</span></button>
        );
      })}
    </span>
  );
}

/* Small "Epic River" chip — the dealer's brand (AUTOPRISM stays the vendor mark). Pale yellow
   in autoprism, solid River Yellow in river; text is always River Ink. */
export function RiverChip({ children = "Epic River", testid = "river-chip" }) {
  return (
    <span data-testid={testid} style={{ display: "inline-flex", alignItems: "center", gap: 5, flexShrink: 0, padding: "3px 8px 3px 6px", borderRadius: 999,
      background: "var(--dealer-chip-bg)", boxShadow: "inset 0 0 0 1px var(--dealer-chip-ring), inset 0 1px 0 rgba(255,255,255,0.6)",
      fontFamily: FONT, fontSize: 10, fontWeight: 650, color: RIVER.ink, letterSpacing: 0.1 }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: RIVER.ink, boxShadow: `0 0 0 1.5px ${RIVER.yellow}, 0 0 0 2.5px rgba(55,52,9,0.35)` }} />
      {children}
    </span>
  );
}
