import React from "react";

/* ==================================================================================
   MetricGlass — the one shared visual on top of the indigo design: key metric numbers
   sit in Autoprism-indigo glass boxes. One colour only (brand primary #3B4BE8 on ink
   #0B1946). CSS is injected once; a solid fallback covers browsers without
   backdrop-filter.
   ================================================================================== */

const CSS = `
.amg-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.amg-box{position:relative;min-width:0;box-sizing:border-box;border-radius:12px;padding:12px 14px 13px;
  /* Professional, restrained: a clean white panel with a hairline border. A very light frost keeps a
     hint of glass; all colour stays inside the box edge (no outer glow). Indigo is only an accent. */
  background:rgba(255,255,255,0.88);
  -webkit-backdrop-filter:blur(12px) saturate(140%);backdrop-filter:blur(12px) saturate(140%);
  border:1px solid #E3E6EF;
  box-shadow:inset 0 1px 0 rgba(255,255,255,1);
  overflow:hidden;
  font-family:'Inter',-apple-system,system-ui,sans-serif}
.amg-span{grid-column:1/-1}
.amg-label{font-size:11px;font-weight:600;color:#5D6577;line-height:1.3;letter-spacing:0.04em;text-transform:uppercase;
  overflow-wrap:anywhere}
.amg-value{margin-top:6px;font-size:24px;font-weight:650;color:#0B1946;line-height:1.1;
  font-variant-numeric:tabular-nums;letter-spacing:-0.02em;overflow-wrap:anywhere}
.amg-after{font-size:13px;font-weight:600;color:#5D6577;margin-left:3px;letter-spacing:0}
.amg-sub{margin-top:3px;font-size:11px;color:#5D6577;line-height:1.35;font-variant-numeric:tabular-nums;
  overflow-wrap:anywhere}
.amg-bar{position:relative;margin-top:10px;height:3px;border-radius:999px;background:#ECEEF4}
.amg-fill{position:absolute;left:0;top:0;bottom:0;border-radius:999px;background:#3B4BE8}
.amg-tick{position:absolute;top:-2px;bottom:-2px;width:2px;border-radius:1px;background:#0B1946;opacity:0.45}
@supports not ((backdrop-filter:blur(1px)) or (-webkit-backdrop-filter:blur(1px))){
  .amg-box{background:#FFFFFF}
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
export function MetricBox({ label, value, after, sub, sub2, bar, span, style, testid }) {
  useMetricCss();
  return (
    <div className={span ? "amg-box amg-span" : "amg-box"} style={style} data-testid={testid}>
      {label != null && <div className="amg-label">{label}</div>}
      <div className="amg-value">
        {value}
        {after != null && <span className="amg-after">{after}</span>}
      </div>
      {sub != null && <div className="amg-sub">{sub}</div>}
      {sub2 != null && <div className="amg-sub">{sub2}</div>}
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
