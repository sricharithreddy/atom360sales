import React, { useEffect, useRef, useState } from "react";
import { Headphones, Bike, Car, LayoutDashboard, Crown, RotateCcw, Signal, Wifi, BatteryFull, ChevronDown, Check } from "lucide-react";
import { OEMS, OEM_KEYS, currentOemKey, storeOemKey, withOem } from "../oem/index.js";

const BASE = import.meta.env.BASE_URL;

// The login list depends on the OEM only for wording (test drives / rides, outlet count, icon).
const rolesFor = (cfg) => [
  { key: "telecaller", label: "Telecaller", short: "Telecaller", sub: "Call queue, follow-ups, qualification", Icon: Headphones, src: `${BASE}telecaller.html` },
  { key: "sales", label: "Sales Executive", short: "Sales Exec", sub: `Leads, ${cfg.testNounPlural}, quotes, bookings`, Icon: cfg.vehicleNoun === "car" ? Car : Bike, src: `${BASE}sales.html` },
  { key: "manager", label: "Manager + Admin", short: "Manager", sub: "Team board, targets, reports, admin", Icon: LayoutDashboard, src: `${BASE}manager.html` },
  { key: "ceo", label: "CEO", short: "CEO", sub: `${cfg.outletCount} outlets, states, cities, money, stock`, Icon: Crown, src: `${BASE}ceo.html` },
];
const ROLES = rolesFor(OEMS.river);   // keys / order are the same for every OEM

// One line per OEM in the picker: "Cars · Autoprism Hyundai · 36 outlets".
const oemLine = (cfg) => `${cfg.category} · ${cfg.pickerDealer} · ${cfg.outletCount} outlets`;

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
// Every src carries ?oem=, and the OEM is part of the key, so switching OEM remounts.
function AppFrames({ active, visited, resetKeys, oem }) {
  return ROLES.filter((r) => visited.includes(r.key)).map((r) => (
    <iframe
      key={`${r.key}-${oem}-${resetKeys[r.key] || 0}`}
      title={r.label}
      src={withOem(r.src, oem)}
      className="app-frame"
      style={{ display: r.key === active ? "block" : "none" }}
    />
  ));
}

// The OEM list, as a popover (desktop) or a bottom sheet (mobile). Keyboard: arrows / Home / End
// move, Enter / Space pick, Esc closes and returns focus to the trigger; Tab closes.
function OemMenu({ oem, onPick, onClose, sheet }) {
  const ref = useRef(null);
  const items = () => Array.from(ref.current?.querySelectorAll('[role="menuitemradio"]') || []);
  useEffect(() => {
    const list = items();
    (list[OEM_KEYS.indexOf(oem)] || list[0])?.focus();
  }, []);
  const onKeyDown = (e) => {
    const list = items();
    const i = list.indexOf(document.activeElement);
    const go = (j) => { e.preventDefault(); list[(j + list.length) % list.length]?.focus(); };
    if (e.key === "ArrowDown") go(i + 1);
    else if (e.key === "ArrowUp") go(i - 1);
    else if (e.key === "Home") go(0);
    else if (e.key === "End") go(list.length - 1);
    else if (e.key === "Tab") onClose(false);
  };
  return (
    <div ref={ref} className={sheet ? "oem-sheet" : "oem-pop"} role="menu" aria-label="Demo OEM" onKeyDown={onKeyDown}>
      {sheet && <div className="oem-grab" aria-hidden="true" />}
      <div className="oem-head">Run the demo as</div>
      {OEM_KEYS.map((k) => {
        const cfg = OEMS[k];
        const on = k === oem;
        return (
          <button key={k} type="button" role="menuitemradio" aria-checked={on} data-oem={k}
            className={`oem-item ${on ? "on" : ""}`} onClick={() => onPick(k)}>
            <span className="oem-dot" style={{ background: cfg.dot }} aria-hidden="true" />
            <span className="oem-text">
              <span className="oem-name">{cfg.brand}</span>
              <span className="oem-desc">{oemLine(cfg)}</span>
            </span>
            <span className="oem-check" aria-hidden="true">{on && <Check size={16} strokeWidth={2.6} />}</span>
          </button>
        );
      })}
    </div>
  );
}

// Open / close state for the OEM menu: Esc, a click outside (or into an app iframe, which blurs
// this window) closes it.
function useOemMenu() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const wrapRef = useRef(null);
  const close = (refocus = true) => { setOpen(false); if (refocus) triggerRef.current?.focus(); };
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (!wrapRef.current?.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") { e.preventDefault(); close(); } };
    const onBlur = () => setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown, { passive: true });
    document.addEventListener("keydown", onKey);
    window.addEventListener("blur", onBlur);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("blur", onBlur);
    };
  }, [open]);
  return { open, setOpen, close, triggerRef, wrapRef };
}

const urlFor = (oem, role) => `${window.location.pathname}?oem=${oem}#${role}`;

export default function Shell() {
  const [active, setActive] = useState(roleFromHash);
  const [visited, setVisited] = useState(() => [roleFromHash()]);
  const [resetKeys, setResetKeys] = useState({});
  const [oem, setOem] = useState(currentOemKey);
  const menu = useOemMenu();
  const { w, h } = useViewport();
  const isMobile = w < MOBILE_BREAKPOINT;
  const cfg = OEMS[oem];
  const roles = rolesFor(cfg);

  // Keep ?oem= in the shell's own URL and the choice in localStorage from the first render.
  useEffect(() => {
    storeOemKey(oem);
    const want = urlFor(oem, roleFromHash());
    if (window.location.pathname + window.location.search + window.location.hash !== want) history.replaceState(null, "", want);
  }, []);

  function pickOem(key) {
    menu.close();
    if (key === oem) return;
    storeOemKey(key);
    history.replaceState(null, "", urlFor(key, active));
    setOem(key);
    // Remount every login so nothing from the other OEM survives: only the active one stays mounted.
    setVisited([active]);
    setResetKeys((k) => Object.fromEntries(ROLES.map((r) => [r.key, (k[r.key] || 0) + 1])));
  }

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

  const trigger = (cls, children) => (
    <button ref={menu.triggerRef} type="button" className={cls} aria-haspopup="menu" aria-expanded={menu.open}
      aria-label={`Autoprism · demo OEM: ${cfg.brand}. Change OEM`} onClick={() => menu.setOpen((o) => !o)}>
      {children}
    </button>
  );

  if (isMobile) {
    return (
      <div className="m-shell">
        <div className="m-bar">
          <div className="m-brand-wrap" ref={menu.wrapRef}>
            {trigger("m-brand", <>
              <img src={`${BASE}brand/autoprism-icon.png`} alt="" width={24} height={20} />
              <span className="m-oem-dot" style={{ background: cfg.dot }} aria-hidden="true" />
              <ChevronDown size={12} strokeWidth={2.6} className="m-chev" aria-hidden="true" />
            </>)}
            {menu.open && <>
              <div className="oem-backdrop" aria-hidden="true" onClick={() => menu.close()} />
              <OemMenu sheet oem={oem} onPick={pickOem} onClose={menu.close} />
            </>}
          </div>
          {roles.map((r) => (
            <button key={r.key} className={`m-tab ${r.key === active ? "on" : ""}`} onClick={() => switchTo(r.key)}>
              <r.Icon size={14} strokeWidth={2.2} />
              {r.short}
            </button>
          ))}
        </div>
        <div className="m-screen">
          <AppFrames active={active} visited={visited} resetKeys={resetKeys} oem={oem} />
        </div>
      </div>
    );
  }

  const scale = Math.min(1, (h - 48) / PHONE_H);
  const current = roles.find((r) => r.key === active);

  return (
    <div className="d-shell">
      <aside className="d-panel">
        <div className="brand-wrap" ref={menu.wrapRef}>
          {trigger(`brand ${menu.open ? "open" : ""}`, <>
            <span className="brand-row">
              <img className="brand-logo" src={`${BASE}brand/autoprism-lockup.png`} alt="" width={170} height={35} />
              <span className="brand-sub">Sales CRM</span>
            </span>
            <span className="brand-oem">
              <span className="oem-dot sm" style={{ background: cfg.dot }} aria-hidden="true" />
              Demo: {cfg.brand}
              <ChevronDown size={13} strokeWidth={2.6} className="brand-chev" aria-hidden="true" />
            </span>
          </>)}
          {menu.open && <OemMenu oem={oem} onPick={pickOem} onClose={menu.close} />}
        </div>
        <div className="eyebrow">Live demo · view as</div>
        <div className="roles">
          {roles.map((r) => (
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
        <p className="note">{cfg.shellNote} Each login keeps its place when you switch. Sample data only.</p>
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
                <AppFrames active={active} visited={visited} resetKeys={resetKeys} oem={oem} />
              </div>
              <div className="home-bar" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
