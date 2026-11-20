import React from "react";

/* ==================================================================================
   RIVER GLASS — the shared look for every AUTOPRISM login (CEO, Manager, Sales
   Executive, Telecaller) at the Epic River dealer group.

   iOS 18/26-style "liquid glass" over a soft River-tinted mesh:
   - neutral glass (cards, header, drawer, sheets, buttons, chips) is ~50% white,
     heavily frosted (blur 36px, saturate 195%), with a specular rim (bright top-left,
     clear in the middle, faint bottom-right), an inner top highlight, a soft inner
     glow, a diagonal sheen band, ~3% noise and a two-layer depth shadow;
   - key numbers sit in TINTED glass boxes; the tint says what kind of number it is
     (see TINTS / LABEL_TINT), numbers are always River Ink, labels a dark shade of the
     tint, sub-lines neutral grey.
   Plain React + a CSS string; no dependencies. Inject once with <RiverGlassStyles/>.
   ================================================================================== */

/* ---------------- Tokens ---------------- */
export const FONT = "-apple-system, 'SF Pro Text', 'SF Pro Display', Inter, system-ui, sans-serif";
export const FONT_DISPLAY = "-apple-system, 'SF Pro Display', 'SF Pro Text', Inter, system-ui, sans-serif";   // big numbers, titles

/* Neutral text + interactive colours, tuned so body text keeps ≥ 4.5:1 on the glass. */
export const C = {
  bg: "#F6F7FB", card: "rgba(255,255,255,0.72)", border: "rgba(15,23,42,0.06)", borderStrong: "rgba(15,23,42,0.12)",
  ink: "#0B1946", sub: "#4A5578", faint: "#5D6577", ghost: "#AEB4CB",
  primary: "#3B4BE8", primarySoft: "rgba(59,75,232,0.10)",   // indigo = interactive, nothing else
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

/* c = the tint, a = [top-left, bottom-right] alpha of the tint gradient, label = dark shade for
   the small label (≥ 4.5:1 on its own tint), deep = alarm number (≥ 7:1). */
export const TINTS = {
  yellow: { c: "#F7EC2B", a: [0.46, 0.20], label: "#5A5100" },                 // River Yellow — units, achievement
  blue:   { c: "#3D6FB6", a: [0.34, 0.14], label: "#244A80" },                 // Monsoon Blue — ₹ value, insurance
  grey:   { c: "#5F6B7A", a: [0.22, 0.08], label: "#39424F" },                 // Storm Grey — bookings / pipeline
  mint:   { c: "#3BB08F", a: [0.27, 0.10], label: "#1A644F" },                 // mint — finance, income
  coral:  { c: "#E0533D", a: [0.25, 0.09], label: "#963020", deep: "#761A10" }, // Summer Red — add-ons, aged, alerts
};
/* Label → tint. Apps can pass `tint` explicitly instead; add a label here only when its meaning
   is the same in every app. */
export const LABEL_TINT = {
  Retail: "yellow", Units: "yellow", Achievement: "yellow", Deliveries: "yellow", Target: "yellow",
  "Sales value": "blue", Value: "blue", "In-house insurance": "blue", "Avg premium": "blue", Insurance: "blue",
  Bookings: "grey", Leads: "grey", Pipeline: "grey", Enquiries: "grey", "Test rides": "grey", Calls: "grey",
  "In-house finance": "mint", "Avg loan": "mint", Finance: "mint", "F&I and add-on income": "mint", "Income per scooter": "mint", Income: "mint",
  "Add-ons / scooter": "coral", "Add-ons ₹/scooter": "coral", "Accessory attach": "coral", "River Care attach": "coral",
  "90+ days": "coral", Overdue: "coral", Missed: "coral", Aged: "coral",
};

/* ---------------- Colour helpers ---------------- */
const rgbList = (hex) => { const n = parseInt(hex.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
export const rgbOf = (hex) => rgbList(hex).join(",");
export const rgba = (hex, a) => `rgba(${rgbOf(hex)},${a})`;
/* 70% tone + 30% navy ink, for small text on a pale tint of the same tone. */
export const deepen = (hex) => `rgb(${rgbList(hex).map((v, i) => Math.round(v * 0.7 + [11, 25, 70][i] * 0.3)).join(",")})`;
/* Solid pale tint, used where backdrop-filter is missing. */
export const pale = (hex, k) => `rgb(${rgbList(hex).map(v => Math.round(v * k + 255 * (1 - k))).join(",")})`;
/* CSS variables for a tinted glass surface: spread into `style` together with className="rg-box rg-box-tint". */
export function tintVars(name, inner) {
  const tk = TINTS[name] || TINTS.grey;
  const [a1, a2] = inner ? tk.a.map(x => +(x * 0.6).toFixed(3)) : tk.a;
  return { "--t": rgbOf(tk.c), "--a1": a1, "--a2": a2, "--tp": pale(tk.c, inner ? 0.12 : 0.2) };
}

/* ---------------- The material ---------------- */
const blur = (px, sat) => `-webkit-backdrop-filter:blur(${px}px) saturate(${sat}%);backdrop-filter:blur(${px}px) saturate(${sat}%);`;
const GLASS = blur(36, 195);
const NOISE = `url("data:image/svg+xml,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/>" +
  "<feColorMatrix values='0 0 0 0 0.5 0 0 0 0 0.5 0 0 0 0 0.5 0 0 0 1 0'/></filter><rect width='100%' height='100%' filter='url(#n)' opacity='0.028'/></svg>")}")`;
/* the surfaces that get the specular rim + sheen */
const SURF = ".rg-glass,.rg-box,.rg-sheet,.rg-drawer,.rg-pin,.rg-btn,.rg-chip";
const sel = (suffix) => SURF.split(",").map(s => s + suffix).join(",");
const LIFT = "0 1px 2px rgba(15,23,42,0.05),0 14px 38px -8px rgba(31,38,135,0.16)";   // contact + ambient
const INNER = "inset 0 1px 0 rgba(255,255,255,0.9),inset 0 0 20px rgba(255,255,255,0.30)";   // top highlight + inner glow
const HILITE = "radial-gradient(120% 70% at 0% 0%, rgba(255,255,255,0.42) 0%, rgba(255,255,255,0) 55%)";

export const GLASS_CSS = `
.rg-root{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;font-family:${FONT};color:${C.ink};}
.rg-mesh{background:
  radial-gradient(95% 15% at 50% 0%, rgba(247,236,43,0.42) 0%, rgba(247,236,43,0) 100%),
  radial-gradient(55% 30% at 106% 50%, rgba(61,111,182,0.26) 0%, rgba(61,111,182,0) 100%),
  radial-gradient(48% 26% at -6% 44%, rgba(150,120,220,0.20) 0%, rgba(150,120,220,0) 100%),
  radial-gradient(60% 30% at 104% 86%, rgba(59,176,143,0.26) 0%, rgba(59,176,143,0) 100%),
  radial-gradient(70% 30% at -4% 100%, rgba(224,83,61,0.22) 0%, rgba(224,83,61,0) 100%),
  radial-gradient(70% 22% at 40% 26%, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0) 100%),
  #F6F6F2;}

${SURF}{position:relative;isolation:isolate;}
${sel("::before")}{content:"";position:absolute;inset:-1px;border-radius:inherit;padding:1px;pointer-events:none;z-index:-1;
  background:linear-gradient(135deg,rgba(255,255,255,1) 0%,rgba(255,255,255,0.55) 22%,rgba(255,255,255,0) 48%,rgba(255,255,255,0) 70%,rgba(255,255,255,0.45) 100%);
  -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;}
${sel("::after")}{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;z-index:-1;
  background:linear-gradient(118deg,rgba(255,255,255,0) 28%,rgba(255,255,255,0.20) 40%,rgba(255,255,255,0.06) 47%,rgba(255,255,255,0) 56%),${NOISE};}

.rg-glass{${GLASS}background:${HILITE},rgba(255,255,255,0.55);border:1px solid rgba(15,23,42,0.07);border-radius:24px;box-shadow:${INNER},${LIFT};}
.rg-box{${GLASS}background:${HILITE},rgba(255,255,255,0.54);border:1px solid rgba(15,23,42,0.07);border-radius:18px;box-shadow:${INNER},${LIFT};transition:transform .18s ease;}
.rg-box.rg-inner{background:${HILITE},rgba(255,255,255,0.46);box-shadow:${INNER},0 1px 2px rgba(15,23,42,0.04),0 4px 14px -4px rgba(31,38,135,0.10);}
.rg-box:active{transform:scale(.98);}
.rg-box.rg-box-tint{border:1px solid rgba(var(--t),0.16);border-radius:20px;
  background:radial-gradient(110% 80% at 0% 0%,rgba(255,255,255,0.52) 0%,rgba(255,255,255,0) 50%),
    linear-gradient(135deg,rgba(var(--t),var(--a1)) 0%,rgba(var(--t),var(--a2)) 100%);
  box-shadow:inset 0 1px 0 rgba(255,255,255,0.85),inset 0 0 20px rgba(255,255,255,0.22),0 1px 2px rgba(var(--t),0.10),0 14px 34px -8px rgba(var(--t),0.30);}
.rg-box.rg-box-tint.rg-inner{border-radius:16px;box-shadow:inset 0 1px 0 rgba(255,255,255,0.8),inset 0 0 14px rgba(255,255,255,0.2),0 4px 14px -4px rgba(var(--t),0.22);}

.rg-bar{${GLASS}background:linear-gradient(180deg,rgba(255,255,255,0.62) 0%,rgba(255,255,255,0.42) 100%);border-bottom:1px solid rgba(255,255,255,0.7);
  box-shadow:inset 0 -1px 0 rgba(15,23,42,0.06),0 8px 24px -14px rgba(31,38,135,0.25);}
.rg-pin{${GLASS}background:rgba(255,255,255,0.80);border-radius:14px;box-shadow:inset 0 1px 0 rgba(255,255,255,0.9),0 1px 2px rgba(15,23,42,0.05),0 8px 22px -6px rgba(31,38,135,0.14);}
.rg-drawer{${blur(40, 200)}background:${HILITE},rgba(255,255,255,0.76);border-right:1px solid rgba(15,23,42,0.05);
  box-shadow:inset 0 1px 0 rgba(255,255,255,0.9),inset -1px 0 0 rgba(255,255,255,0.6),0 10px 44px rgba(31,38,135,0.20);}
.rg-sheet{${blur(40, 200)}background:${HILITE},rgba(255,255,255,0.72);border-radius:28px 28px 0 0;border:1px solid rgba(15,23,42,0.06);border-bottom:none;
  box-shadow:inset 0 1px 0 rgba(255,255,255,0.95),0 -10px 40px rgba(31,38,135,0.18);}
.rg-sheet.rg-center{border-radius:24px;border-bottom:1px solid rgba(15,23,42,0.06);box-shadow:${INNER},0 2px 4px rgba(15,23,42,0.06),0 24px 60px -10px rgba(31,38,135,0.28);}
.rg-grabber{width:36px;height:5px;border-radius:3px;background:rgba(15,23,42,0.18);margin:8px auto 4px;}
.rg-dim{-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);background:rgba(15,23,42,0.24);}
.rg-btn{${GLASS}background:${HILITE},rgba(255,255,255,0.58);border:1px solid rgba(15,23,42,0.08);box-shadow:inset 0 1px 0 rgba(255,255,255,0.9),0 1px 2px rgba(15,23,42,0.05),0 4px 12px -2px rgba(31,38,135,0.10);}
.rg-btn-primary{position:relative;border:none;color:#fff;background:linear-gradient(180deg,#4F5DF0 0%,${C.primary} 100%);
  box-shadow:inset 0 1px 0 rgba(255,255,255,0.35),inset 0 -1px 0 rgba(11,25,70,0.18),0 6px 18px rgba(59,75,232,0.28);}
.rg-btn-primary:disabled{background:rgba(15,23,42,0.10);color:${C.faint};box-shadow:none;}
.rg-chip{${blur(20, 180)}display:inline-flex;align-items:center;gap:5px;padding:6px 12px;border-radius:999px;border:1px solid rgba(15,23,42,0.10);
  background:rgba(255,255,255,0.58);color:${C.sub};font-family:${FONT};font-weight:600;font-size:11.5px;line-height:1.2;
  box-shadow:inset 0 1px 0 rgba(255,255,255,0.85),0 1px 3px rgba(15,23,42,0.05);}
.rg-chip.on,.rg-chip[aria-pressed=true]{background:rgba(59,75,232,0.12);border-color:rgba(59,75,232,0.35);color:${C.primary};}
.rg-seg{background:rgba(15,23,42,0.06);box-shadow:inset 0 1px 2px rgba(15,23,42,0.06),inset 0 0 0 1px rgba(255,255,255,0.55);}
.rg-thumb{background:linear-gradient(180deg,#FFFEF4 0%,#FFFBDF 100%);box-shadow:0 0 0 1px rgba(214,200,24,0.75),inset 0 1px 0 #fff,0 3px 8px rgba(15,23,42,0.12),0 1px 1px rgba(15,23,42,0.04);transition:transform .2s ease;}
.rg-toast{${blur(24, 170)}background:rgba(11,25,70,0.86);color:#fff;box-shadow:inset 0 1px 0 rgba(255,255,255,0.14),0 10px 30px rgba(11,25,70,0.28);}
.rg-list-row{display:flex;align-items:center;gap:10px;padding:11px 12px;border-bottom:1px solid rgba(15,23,42,0.07);background:transparent;transition:background-color .18s ease;}
.rg-list-row:last-child{border-bottom:none;}
.rg-list-row.on,.rg-list-row:active{background:rgba(99,102,241,0.06);}
.rg-input{width:100%;box-sizing:border-box;border:1px solid ${C.borderStrong};border-radius:12px;padding:10px 12px;font-family:${FONT};font-size:13px;color:${C.ink};
  background:rgba(255,255,255,0.72);outline:none;box-shadow:inset 0 1px 2px rgba(15,23,42,0.05);transition:border-color .18s ease,box-shadow .18s ease;}
.rg-input::placeholder{color:#6B7286;}
.rg-field:focus,.rg-input:focus{border-color:rgba(59,75,232,0.55)!important;box-shadow:0 0 0 3px rgba(59,75,232,0.14)!important;}
.rg-press{transition:transform .18s ease;}
.rg-press:active{transform:scale(.98);}
.rg-chev{transition:transform .18s ease;}

@supports not ((backdrop-filter:blur(1px)) or (-webkit-backdrop-filter:blur(1px))){
  .rg-glass,.rg-box,.rg-box.rg-inner,.rg-bar,.rg-pin,.rg-drawer,.rg-btn,.rg-sheet,.rg-chip{background:rgba(255,255,255,0.93);}
  .rg-box.rg-box-tint,.rg-box.rg-box-tint.rg-inner{background:var(--tp);}
  .rg-dim{background:rgba(15,23,42,0.4);}
  .rg-toast{background:rgba(11,25,70,0.96);}
}
@media (prefers-reduced-transparency:reduce){
  .rg-glass,.rg-box,.rg-box.rg-inner,.rg-bar,.rg-pin,.rg-drawer,.rg-btn,.rg-sheet,.rg-chip{background:rgba(255,255,255,0.93);}
  .rg-box.rg-box-tint,.rg-box.rg-box-tint.rg-inner{background:var(--tp);}
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

/* ---------------- Components ---------------- */
const ok = (x) => x != null && Number.isFinite(x);
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

/* Neutral glass card. */
export function GlassCard({ children, style, className, ...rest }) {
  return <div {...rest} className={`rg-glass${className ? " " + className : ""}`} style={{ padding: 14, marginBottom: 12, ...style }}>{children}</div>;
}
/* Any tinted glass box (for custom content). `inner` = sits inside a card (lighter tint). */
export function TintedBox({ tint = "grey", inner, className, style, children, ...rest }) {
  return <div {...rest} data-tint={tint} className={`rg-box rg-box-tint${inner ? " rg-inner" : ""}${className ? " " + className : ""}`}
    style={{ ...tintVars(tint, inner), minWidth: 0, ...style }}>{children}</div>;
}

/* A key number in a tinted glass box: small label (dark shade of the tint), big number in River
   Ink, one or two neutral grey sub-lines. `tint` overrides the LABEL_TINT lookup. `tone` colours
   the number: C.ink/C.faint map to River Ink / neutral grey, C.green/C.hot to TONE.up/down, any
   other colour is used as is. `inner` = inside a card. `span` = full grid row. `bar` = { v, mark }:
   a slim progress bar (v = fill 0–1, mark = optional ghost tick, e.g. projection). */
const BOX_TONE = { [C.ink]: RIVER.ink, [C.faint]: BOX_SUB, [C.green]: TONE.up, [C.hot]: TONE.down };
export function Metric({ label, value, after, sub, sub2, tone, span, inner, testid, bar, tint, style, ...rest }) {
  const name = tint || LABEL_TINT[label] || "grey";
  const tk = TINTS[name] || TINTS.grey;
  const fill = name === "yellow" ? RIVER.ink : tk.label;
  return (
    <TintedBox {...rest} tint={name} inner={inner} data-testid={testid}
      style={{ padding: inner ? "11px 12px 10px" : "12px 14px 11px", gridColumn: span ? "1 / -1" : undefined, ...style }}>
      <div style={{ fontFamily: FONT, fontSize: 11, fontWeight: 600, color: tk.label, lineHeight: 1.25 }}>{label}</div>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: inner ? 20 : 23, fontWeight: 650, letterSpacing: "-0.02em", color: BOX_TONE[tone] || tone || RIVER.ink,
        marginTop: 4, lineHeight: 1.1, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
        {value}{after && <span style={{ fontSize: 13, fontWeight: 500, letterSpacing: 0, color: BOX_SUB }}>{after}</span>}
      </div>
      {bar && ok(bar.v) && (
        <div aria-hidden style={{ position: "relative", height: 4, borderRadius: 4, background: "rgba(55,52,9,0.10)", margin: "7px 0 1px",
          boxShadow: "inset 0 0 0 0.5px rgba(55,52,9,0.06)" }}>
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${clamp(bar.v, 0, 1) * 100}%`, borderRadius: 4, background: fill, opacity: 0.85 }} />
          {ok(bar.mark) && <div style={{ position: "absolute", top: -2, bottom: -2, width: 2, borderRadius: 1, left: `calc(${clamp(bar.mark, 0, 1) * 100}% - 1px)`,
            background: fill, opacity: 0.35 }} />}
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

/* iOS segmented control: a frosted track with a pale-yellow thumb (yellow ring) that slides to the
   chosen option; the chosen label is indigo. opts = [[value, label], ...]. */
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
            color: on ? C.primary : C.sub, fontFamily: FONT, fontWeight: on ? 600 : 500, fontSize: 11.5, transition: "color .2s ease",
            WebkitTapHighlightColor: "transparent" }}><span>{label}</span></button>
        );
      })}
    </span>
  );
}

/* Small "Epic River" chip in River Yellow — the dealer's brand (AUTOPRISM stays the vendor mark). */
export function RiverChip({ children = "Epic River", testid = "river-chip" }) {
  return (
    <span data-testid={testid} style={{ display: "inline-flex", alignItems: "center", gap: 5, flexShrink: 0, padding: "3px 8px 3px 6px", borderRadius: 999,
      background: "rgba(247,236,43,0.32)", boxShadow: "inset 0 0 0 1px rgba(55,52,9,0.10), inset 0 1px 0 rgba(255,255,255,0.6)",
      fontFamily: FONT, fontSize: 10, fontWeight: 650, color: RIVER.ink, letterSpacing: 0.1 }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: RIVER.yellow, boxShadow: "0 0 0 1px rgba(55,52,9,0.28)" }} />
      {children}
    </span>
  );
}
