import React, { useEffect, useState } from "react";
import { Headphones, Car, LayoutDashboard, RotateCcw, Signal, Wifi, BatteryFull } from "lucide-react";

const BASE = import.meta.env.BASE_URL;

const ROLES = [
  { key: "telecaller", label: "Telecaller", short: "Telecaller", sub: "Call queue, follow-ups, qualification", Icon: Headphones, src: `${BASE}telecaller.html` },
  { key: "sales", label: "Sales Executive", short: "Sales Exec", sub: "Leads, test drives, quotes, bookings", Icon: Car, src: `${BASE}sales.html` },
  { key: "manager", label: "Manager + Admin", short: "Manager", sub: "Team board, targets, reports, admin", Icon: LayoutDashboard, src: `${BASE}manager.html` },
];

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
function AppFrames({ active, visited, resetKeys }) {
  return ROLES.filter((r) => visited.includes(r.key)).map((r) => (
    <iframe
      key={`${r.key}-${resetKeys[r.key] || 0}`}
      title={r.label}
      src={r.src}
      className="app-frame"
      style={{ display: r.key === active ? "block" : "none" }}
    />
  ));
}

export default function Shell() {
  const [active, setActive] = useState(roleFromHash);
  const [visited, setVisited] = useState(() => [roleFromHash()]);
  const [resetKeys, setResetKeys] = useState({});
  const { w, h } = useViewport();
  const isMobile = w < MOBILE_BREAKPOINT;

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
        </div>
        <div className="m-screen">
          <AppFrames active={active} visited={visited} resetKeys={resetKeys} />
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
        <button className="reset" onClick={reset}>
          <RotateCcw size={13} strokeWidth={2.2} /> Reset {current.short} demo
        </button>
        <p className="note">Each login keeps its place when you switch. Sample data only.</p>
      </aside>

      <main className="d-stage">
        <div style={{ width: (SCREEN_W + BEZEL * 2) * scale, height: PHONE_H * scale }}>
          <div className="phone" style={{ transform: `scale(${scale})` }}>
            <div className="screen">
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
                <AppFrames active={active} visited={visited} resetKeys={resetKeys} />
              </div>
              <div className="home-bar" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
