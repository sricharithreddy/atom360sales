import React, { useEffect, useRef, useState } from "react";
import { Headphones, Bike, LayoutDashboard, Crown, RotateCcw, Signal, Wifi, BatteryFull } from "lucide-react";

const BASE = import.meta.env.BASE_URL;

// `themed`: the login renders the dealer theme (wrapped in ThemeRoot). Every login gets the
// theme message; the phone's status bar only goes dark for a themed login in the river theme.
const ROLES = [
  { key: "telecaller", label: "Telecaller", short: "Telecaller", sub: "Call queue, follow-ups, qualification", Icon: Headphones, src: `${BASE}telecaller.html` },
  { key: "sales", label: "Sales Executive", short: "Sales Exec", sub: "Leads, test rides, quotes, bookings", Icon: Bike, src: `${BASE}sales.html` },
  { key: "manager", label: "Manager + Admin", short: "Manager", sub: "Team board, targets, reports, admin", Icon: LayoutDashboard, src: `${BASE}manager.html` },
  { key: "ceo", label: "CEO", short: "CEO", sub: "100 outlets, states, cities, money, stock", Icon: Crown, src: `${BASE}ceo.html`, themed: true },
];

// Dealer theme (see src/theme/riverGlass.jsx): the demo is for Epic River, so River is the default
// here; the product's own default is Autoprism. Persisted in localStorage (same key the apps read),
// passed to each login as ?theme= when its frame first loads, then pushed live with postMessage.
const THEMES = [
  { key: "river", label: "River", swatch: "#F7EC2B", ring: "#373409" },
  { key: "autoprism", label: "Autoprism", swatch: "#3B4BE8", ring: "#3B4BE8" },
];
const THEME_KEY = "rg-theme";
const DEMO_THEME = "river";
const isTheme = (t) => THEMES.some((x) => x.key === t);
function initialTheme() {
  try { const q = new URLSearchParams(window.location.search).get("theme"); if (isTheme(q)) return q; } catch (e) { /* no URL */ }
  try { const s = window.localStorage.getItem(THEME_KEY); if (isTheme(s)) return s; } catch (e) { /* storage blocked */ }
  return DEMO_THEME;
}
const postTheme = (frame, theme) => {
  try { frame.contentWindow && frame.contentWindow.postMessage({ type: "rg-theme", theme }, window.location.origin); } catch (e) { /* frame gone */ }
};

// Phone screen size (iPhone 14/15 class) and bezel.
const SCREEN_W = 390;
const SCREEN_H = 844;
const BEZEL = 13;
const PHONE_H = SCREEN_H + BEZEL * 2;
const MOBILE_BREAKPOINT = 700;

const roleFromHash = () => {
  const k = window.location.hash.replace("#", "");
  return ROLES.some((r) => r.key === k) ? k : "telecaller";
};

function useViewport() {
  const read = () => ({ w: window.innerWidth, h: window.innerHeight });
  const [vp, setVp] = useState(read);
  useEffect(() => {
    const onResize = () => setVp(read());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return vp;
}

function Clock() {
  const fmt = () => new Date().toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: false });
  const [t, setT] = useState(fmt);
  useEffect(() => {
    const id = setInterval(() => setT(fmt()), 30000);
    return () => clearInterval(id);
  }, []);
  return <span>{t}</span>;
}

// One iframe per login. A login is mounted the first time it is opened and then
// kept alive, so switching away and back keeps where you were in that app.
// The src carries the theme at mount time only (so a theme change never reloads the app);
// later changes arrive by postMessage, and every (re)load re-sends the current theme.
function AppFrame({ role, show, themeRef }) {
  const [src] = useState(() => `${role.src}?theme=${themeRef.current}`);
  return (
    <iframe
      title={role.label}
      src={src}
      data-role={role.key}
      className="app-frame"
      onLoad={(e) => postTheme(e.currentTarget, themeRef.current)}
      style={{ display: show ? "block" : "none" }}
    />
  );
}
function AppFrames({ active, visited, resetKeys, themeRef }) {
  return ROLES.filter((r) => visited.includes(r.key)).map((r) => (
    <AppFrame key={`${r.key}-${resetKeys[r.key] || 0}`} role={r} show={r.key === active} themeRef={themeRef} />
  ));
}

function ThemeSwitch({ theme, setTheme, compact }) {
  if (compact) {
    const next = theme === "river" ? "autoprism" : "river";
    const cur = THEMES.find((t) => t.key === theme);
    return (
      <button className="m-theme" data-testid="theme-toggle" onClick={() => setTheme(next)}
        aria-label={`Dealer theme: ${cur.label}. Switch to ${THEMES.find((t) => t.key === next).label}`} title={`Theme: ${cur.label}`}>
        {THEMES.map((t) => (
          <span key={t.key} className={`m-swatch ${t.key === theme ? "on" : ""}`} style={{ background: t.swatch }} />
        ))}
      </button>
    );
  }
  return (
    <div className="theme" data-testid="theme-switch">
      <div className="eyebrow">Dealer theme</div>
      <div className="theme-seg" role="radiogroup" aria-label="Dealer theme">
        {THEMES.map((t) => (
          <button key={t.key} role="radio" aria-checked={t.key === theme} data-testid={`theme-${t.key}`}
            className={`theme-opt ${t.key === theme ? "on" : ""}`} onClick={() => setTheme(t.key)}>
            <span className="theme-swatch" style={{ background: t.swatch, boxShadow: `0 0 0 1.5px #fff, 0 0 0 2.5px ${t.ring}` }} />
            {t.label}
          </button>
        ))}
      </div>
      <p className="theme-note">River = Epic River's brand colours. Autoprism = the product's own indigo.</p>
    </div>
  );
}

export default function Shell() {
  const [active, setActive] = useState(roleFromHash);
  const [visited, setVisited] = useState(() => [roleFromHash()]);
  const [resetKeys, setResetKeys] = useState({});
  const [theme, setTheme] = useState(initialTheme);
  const themeRef = useRef(theme);
  const { w, h } = useViewport();
  const isMobile = w < MOBILE_BREAKPOINT;

  // Persist and push the theme to every open login, live (no reload, apps keep their place).
  useEffect(() => {
    themeRef.current = theme;
    try { window.localStorage.setItem(THEME_KEY, theme); } catch (e) { /* storage blocked */ }
    document.querySelectorAll("iframe.app-frame").forEach((f) => postTheme(f, theme));
  }, [theme]);

  useEffect(() => {
    const onHash = () => switchTo(roleFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  function switchTo(key) {
    setActive(key);
    setVisited((v) => (v.includes(key) ? v : [...v, key]));
    if (window.location.hash !== `#${key}`) history.replaceState(null, "", `#${key}`);
  }

  const reset = () => setResetKeys((k) => ({ ...k, [active]: (k[active] || 0) + 1 }));

  if (isMobile) {
    return (
      <div className="m-shell">
        <div className="m-bar">
          {ROLES.map((r) => (
            <button key={r.key} className={`m-tab ${r.key === active ? "on" : ""}`} onClick={() => switchTo(r.key)}>
              <r.Icon size={14} strokeWidth={2.2} />
              {r.short}
            </button>
          ))}
          <ThemeSwitch compact theme={theme} setTheme={setTheme} />
        </div>
        <div className="m-screen">
          <AppFrames active={active} visited={visited} resetKeys={resetKeys} themeRef={themeRef} />
        </div>
      </div>
    );
  }

  const scale = Math.min(1, (h - 48) / PHONE_H);
  const current = ROLES.find((r) => r.key === active);

  return (
    <div className="d-shell">
      <aside className="d-panel">
        <div className="brand">
          Atom360<span className="brand-dot" />
          <span className="brand-sub">Sales CRM</span>
        </div>
        <div className="eyebrow">Live demo · view as</div>
        <div className="roles">
          {ROLES.map((r) => (
            <button key={r.key} className={`role ${r.key === active ? "on" : ""}`} onClick={() => switchTo(r.key)}>
              <span className="role-icon"><r.Icon size={18} strokeWidth={2} /></span>
              <span className="role-text">
                <span className="role-name">{r.label}</span>
                <span className="role-sub">{r.sub}</span>
              </span>
            </button>
          ))}
        </div>
        <ThemeSwitch theme={theme} setTheme={setTheme} />
        <button className="reset" onClick={reset}>
          <RotateCcw size={13} strokeWidth={2.2} /> Reset {current.short} demo
        </button>
        <p className="note">Demo dealer: Epic River (Raam Group) — River Indie electric scooters, 100 outlets across Telangana, Andhra, Maharashtra, Tamil Nadu &amp; Karnataka. Each login keeps its place when you switch. Sample data only.</p>
      </aside>

      <main className="d-stage">
        <div style={{ width: (SCREEN_W + BEZEL * 2) * scale, height: PHONE_H * scale }}>
          <div className="phone" style={{ transform: `scale(${scale})` }}>
            <div className={`screen ${current.themed && theme === "river" ? "dark-status" : ""}`}>
              <div className="status">
                <Clock />
                <span className="island" />
                <span className="status-icons">
                  <Signal size={14} strokeWidth={2.4} />
                  <Wifi size={14} strokeWidth={2.4} />
                  <BatteryFull size={18} strokeWidth={2} />
                </span>
              </div>
              <div className="screen-body">
                <AppFrames active={active} visited={visited} resetKeys={resetKeys} themeRef={themeRef} />
              </div>
              <div className="home-bar" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
