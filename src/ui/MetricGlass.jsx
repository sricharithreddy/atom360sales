import React from "react";

/* ==================================================================================
   MetricGlass — the one shared visual on top of the indigo design: key metric numbers
   sit in Autoprism-indigo glass boxes. One colour only (brand primary #3B4BE8 on ink
   #0B1946). CSS is injected once; a solid fallback covers browsers without
   backdrop-filter.
   ================================================================================== */

const CSS = `
.amg-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
.amg-box{position:relative;min-width:0;box-sizing:border-box;border-radius:14px;padding:9px 12px 10px;
  /* Modern, still professional: white floating panel, thin white rim, soft NEUTRAL shadow (no colour
     leaves the box). One hero box per screen gets a vivid indigo gradient (.amg-hero). */
  background:rgba(255,255,255,0.92);
  -webkit-backdrop-filter:blur(12px) saturate(140%);backdrop-filter:blur(12px) saturate(140%);
  border:1px solid rgba(255,255,255,0.9);
  box-shadow:0 0 0 1px rgba(15,23,42,0.05), 0 6px 16px rgba(15,23,42,0.07), 0 1px 3px rgba(15,23,42,0.04),
    inset 0 1px 0 #FFFFFF;
  overflow:hidden;
  font-family:'Inter',-apple-system,system-ui,sans-serif}
.amg-hero{background:linear-gradient(135deg,#4A5BF2 0%,#3B4BE8 45%,#2A36C9 100%);border-color:rgba(255,255,255,0.35);
  box-shadow:0 0 0 1px rgba(15,23,42,0.05), 0 6px 18px rgba(15,23,42,0.12), 0 1px 3px rgba(15,23,42,0.06),
    inset 0 1px 0 rgba(255,255,255,0.35)}
.amg-hero::before{content:"";position:absolute;inset:0;pointer-events:none;
  background:radial-gradient(90% 70% at 0% 0%,rgba(255,255,255,0.28) 0%,rgba(255,255,255,0) 60%),
    radial-gradient(60% 60% at 100% 100%,rgba(56,189,248,0.35) 0%,rgba(56,189,248,0) 70%)}
.amg-hero>*{position:relative}
.amg-hero .amg-label{color:rgba(255,255,255,0.86)}
.amg-hero .amg-value{color:#FFFFFF}
.amg-hero .amg-after,.amg-hero .amg-sub{color:rgba(255,255,255,0.86)}
.amg-hero .amg-bar{background:rgba(255,255,255,0.28)}
.amg-hero .amg-fill{background:#FFFFFF}
.amg-hero .amg-tick{background:#FFFFFF;opacity:0.7}
.amg-span{grid-column:1/-1}
.amg-label{font-size:10px;font-weight:600;color:#5D6577;line-height:1.3;letter-spacing:0.04em;text-transform:uppercase;
  overflow-wrap:anywhere}
.amg-value{margin-top:2px;font-size:19px;font-weight:650;color:#0B1946;line-height:1.15;
  font-variant-numeric:tabular-nums;letter-spacing:-0.02em;overflow-wrap:anywhere}
.amg-after{font-size:12px;font-weight:600;color:#5D6577;margin-left:3px;letter-spacing:0}
.amg-sub{margin-top:1px;font-size:10.5px;color:#5D6577;line-height:1.35;font-variant-numeric:tabular-nums;
  overflow-wrap:anywhere}
.amg-bar{position:relative;margin-top:6px;height:3px;border-radius:999px;background:#ECEEF4}
.amg-fill{position:absolute;left:0;top:0;bottom:0;border-radius:999px;background:#3B4BE8}
.amg-tick{position:absolute;top:-2px;bottom:-2px;width:2px;border-radius:1px;background:#0B1946;opacity:0.45}
@supports not ((backdrop-filter:blur(1px)) or (-webkit-backdrop-filter:blur(1px))){
  .amg-box{background:#FFFFFF}
  .amg-hero{background:linear-gradient(135deg,#5B6CFF 0%,#3B4BE8 48%,#2A36C9 100%)}
}
`;

let injected = false;
function useMetricCss() {
  if (injected || typeof document === "undefined") return;
  injected = true;
  const el = document.createElement("style");
  el.setAttribute("data-metric-glass", "");
  el.textContent = CSS;
  document.head.appendChild(el);
}

const pctOf = (x) => `${Math.max(0, Math.min(100, Number.isFinite(x) ? x : 0))}%`;

/* bar: { value: 0..1, tick?: 0..1 } — tick marks e.g. the month-end projection. */
export function MetricBox({ label, value, after, sub, sub2, bar, span, hero, style, testid }) {
  useMetricCss();
  return (
    <div className={`amg-box${span ? " amg-span" : ""}${hero ? " amg-hero" : ""}`} style={style} data-testid={testid}>
      {label != null && <div className="amg-label">{label}</div>}
      <div className="amg-value">
        {value}
        {after != null && <span className="amg-after">{after}</span>}
      </div>
      {(sub != null || sub2 != null) && (
        <div className="amg-sub">{sub}{sub != null && sub2 != null && " · "}{sub2}</div>
      )}
      {bar && (
        <div className="amg-bar">
          <div className="amg-fill" style={{ width: pctOf(bar.value * 100) }} />
          {bar.tick != null && Number.isFinite(bar.tick) && (
            <div className="amg-tick" style={{ left: `calc(${pctOf(bar.tick * 100)} - 1px)` }} />
          )}
        </div>
      )}
    </div>
  );
}

export function MetricGrid({ children, style, testid }) {
  useMetricCss();
  return <div className="amg-grid" style={style} data-testid={testid}>{children}</div>;
}
