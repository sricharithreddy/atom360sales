import React, { useState, useRef } from "react";
import {
  AlertTriangle, ArrowRight, BarChart3, Bell, Car, Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, ClipboardList, Clock, FileText, GraduationCap, Headphones, History, IndianRupee, Lock, Mail, MapPin, Menu, MessageSquare, Pause, Pencil, Phone, PlayCircle, Plus, Search, Send, Settings, ShieldAlert, ShieldCheck, Sparkles, Target, Trash2, Upload, User, UserPlus, Users, X,
} from "lucide-react";

/* ==================================================================================
   AUTOPRISM — SALES MANAGER

   Target-led, not revenue-led. A manager's levers are units, conversion and coaching;
   vehicle margin is set by the OEM. Sales value is a COLUMN in the rollup — context for
   the conversation upward, not the manager's own headline.

   The org is a TREE. A Sales Manager can have another Sales Manager reporting to them,
   so every number rolls up recursively rather than summing a single level.
   ================================================================================== */

const C = {
  bg: "#F7F6F2", card: "#FFFFFF", border: "#E3E1DA", borderStrong: "#D8D6CF",
  ink: "#0E0E0C", sub: "#5C5A54", faint: "#726F68", ghost: "#AEABA3",
  primary: "#F05A28", primarySoft: "rgba(240,90,40,0.09)",
  hot: "#E53935", hotSoft: "rgba(229,57,53,0.08)",
  warm: "#F59E0B", warmSoft: "rgba(245,158,11,0.10)",
  green: "#2E7D32", greenSoft: "rgba(46,125,50,0.09)",
  purple: "#6D28D9", teal: "#00695C",
};
const F = "'Inter', -apple-system, system-ui, sans-serif";
const shadow = "0 1px 3px rgba(0,0,0,0.07), 0 6px 18px rgba(0,0,0,0.075)";
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
const inr = (n) =>
  n == null || n === "" ? "—"
  : n >= 10000000 ? `₹${(n / 10000000).toFixed(2)} Cr`
  : n >= 100000 ? `₹${(n / 100000).toFixed(1)} L`
  : n >= 1000 ? `₹${Math.round(n / 1000)}k` : `₹${n}`;

const DAYS_LEFT = 9, DAY_OF_MONTH = 21, DISCOUNT_CAP = 25000;

/* ---------------- Org tree. Leaves carry real numbers; everything above rolls up. ---------------- */
const ORG = {
  id: 1, name: "Priya Nambiar", role: "Sales Manager", initials: "PN", branch: "All branches",
  reports: [
    { id: 2, name: "Rajesh Menon", role: "Sales Manager", initials: "RM", branch: "Whitefield", reports: [
      { id: 3, name: "Anil Kumar", role: "Team Leader", initials: "AK", branch: "Whitefield", reports: [
        { id: 10, name: "Arjun Nair", role: "Sales Executive", initials: "AN", branch: "Whitefield",
          target: 10, retailed: 7, booking: 9, leads: 46, opportunity: 24,
          td: 21, respHrs: 3.8, streak: 2, discountTotal: 268000, prevRetailed: 9 },
        { id: 11, name: "Meera Iyer", role: "Sales Executive", initials: "MI", branch: "Whitefield",
          target: 9, retailed: 4, booking: 6, leads: 38, opportunity: 15,
          td: 8, respHrs: 5.6, streak: 4, discountTotal: 61000, prevRetailed: 2 },
      ]},
      { id: 6, name: "Latha Rao", role: "Team Leader", initials: "LR", branch: "Whitefield", reports: [
        { id: 16, name: "Sameer Khan", role: "Sales Executive", initials: "SK", branch: "Whitefield",
          target: 9, retailed: 6, booking: 8, leads: 39, opportunity: 20,
          td: 14, respHrs: 2.9, streak: 6, discountTotal: 133000, prevRetailed: 4 },
      ]},
    ]},
    { id: 4, name: "Sneha Rao", role: "Team Leader", initials: "SR", branch: "Indiranagar", reports: [
      { id: 12, name: "Rahul Kumar", role: "Sales Executive", initials: "RK", branch: "Indiranagar",
        target: 11, retailed: 12, booking: 14, leads: 44, opportunity: 28,
        td: 17, respHrs: 1.6, streak: 12, discountTotal: 186000, prevRetailed: 7 },
      { id: 13, name: "Divya Pillai", role: "Sales Executive", initials: "DP", branch: "Indiranagar",
        target: 10, retailed: 10, booking: 12, leads: 41, opportunity: 25,
        td: 18, respHrs: 2.1, streak: 9, discountTotal: 142000, prevRetailed: 5 },
    ]},
    { id: 5, name: "Vikas Shetty", role: "Team Leader", initials: "VS", branch: "Indiranagar", reports: [
      { id: 14, name: "Kiran Bhat", role: "Sales Executive", initials: "KB", branch: "Indiranagar",
        target: 10, retailed: 8, booking: 10, leads: 40, opportunity: 22,
        td: 16, respHrs: 2.6, streak: 7, discountTotal: 171000, prevRetailed: 7 },
      { id: 15, name: "Anjali Reddy", role: "Sales Executive", initials: "AR", branch: "Indiranagar",
        target: 8, retailed: 2, booking: 3, leads: 33, opportunity: 11,
        td: 5, respHrs: 7.2, streak: 1, discountTotal: 24000, prevRetailed: 0 },
    ]},
  ],
};

function roll(node) {
  if (!node.reports || !node.reports.length) {
    return {
      target: node.target || 0, retailed: node.retailed || 0, booking: node.booking || 0,
      // Value is the sum of what this person actually retailed — never an independent
      // figure that can drift away from the unit count beside it.
      salesValue: LEAD_VALUE_BY_OWNER[node.id] || 0,
      leads: node.leads || 0, opportunity: node.opportunity || 0,
      td: node.td || 0, discountTotal: node.discountTotal || 0, heads: 1,
    };
  }
  return node.reports.map(roll).reduce((a, b) => ({
    target: a.target + b.target, retailed: a.retailed + b.retailed, booking: a.booking + b.booking,
    salesValue: a.salesValue + b.salesValue, leads: a.leads + b.leads,
    opportunity: a.opportunity + b.opportunity, td: a.td + b.td,
    discountTotal: a.discountTotal + b.discountTotal, heads: a.heads + b.heads,
  }));
}
function flatten(node, out = []) {
  if (!node.reports || !node.reports.length) out.push(node);
  else node.reports.forEach(r => flatten(r, out));
  return out;
}

/* ---------------- What's waiting on the manager ----------------
   Two shapes: a DECISION (approve / decline) and an ACTION (own it / resolve). Both carry
   a note back to the rep — a bare "declined" teaches nobody anything. */
const ACTIONS = [
  { id: 1, kind: "discount", type: "Needs Discount Approval", Icon: IndianRupee, tone: "#5C5A54",
    raisedBy: "Arjun Nair", customerId: null, customer: "George Thomas", model: "Creta SX(O)",
    ask: 45000, cap: DISCOUNT_CAP, age: "2h", urgent: true,
    detail: "Corporate fleet — 3 units under discussion. Customer wants the same rate on all three." },
  { id: 2, kind: "discount", type: "Needs Discount Approval", Icon: IndianRupee, tone: "#5C5A54",
    raisedBy: "Kiran Bhat", customer: "Deepa Menon", model: "Alcazar Signature",
    ask: 32000, cap: DISCOUNT_CAP, age: "5h", urgent: false,
    detail: "Matching a written quote from another dealer. Customer has shown the quote." },
  { id: 3, kind: "stuck", type: "Deal Stuck / No Progress", Icon: Clock, tone: "#5C5A54",
    raisedBy: "Divya Pillai", customer: "Farhan Khan", model: "Alcazar Signature",
    age: "1d", urgent: true,
    detail: "Booked on the 6th, RC still not issued and delivery has slipped twice. Customer has a family trip booked and is threatening to cancel." },
  { id: 4, kind: "complaint", type: "Customer Complaint", Icon: MessageSquare, tone: "#5C5A54",
    raisedBy: "Meera Iyer", customer: "Anita Shetty", model: "Venue SX",
    age: "6h", urgent: false,
    detail: "Accessories fitted are not the ones quoted. Customer wants a refund or the correct set." },
  { id: 5, kind: "pricing", type: "Pricing Exception", Icon: ShieldAlert, tone: "#5C5A54",
    raisedBy: "Rahul Kumar", customer: "Vikram Rao", model: "Creta SX(O)",
    ask: 55000, cap: 0, age: "3h", urgent: false,
    detail: "Evaluator valued the trade-in at Rs 4.1 L; customer will not go below Rs 4.65 L. Deal is otherwise closed." },
];
const isDecision = (a) => ["discount", "pricing"].includes(a.kind);


/* Leads behind the numbers. Tapping a figure in the target table opens exactly these,
   filtered to that person's subtree and that stage — a manager asking "which nine?" gets
   the nine, not a summary of them. */
const STAGES = ["Ready to Book", "Booking", "Retailed", "Delivered"];
const MODELS = ["Creta SX(O)", "Venue SX", "Exter SX", "Verna Turbo", "Alcazar Signature", "Ioniq 5"];
const CUSTOMERS = ["Lakshmi Narayan","Ravi Teja","Neha Verma","Amit Joshi","Sneha Kulkarni",
  "Farhan Khan","Priya Desai","Vikram Rao","Anita Shetty","George Thomas","Meena Rao","Deepa Menon",
  "Sanjay Gupta","Kavya Iyer","Rohit Sharma","Nisha Patel","Arun Das","Pooja Nair"];

const LEADS = (() => {
  let n = 41, id = 1;
  const rnd = () => { n = (n * 1103515245 + 12345) & 0x7fffffff; return n / 0x7fffffff; };
  const out = [];
  flatten(ORG).forEach(se => {
    const mk = (stage, count) => {
      for (let i = 0; i < count; i++) {
        out.push({
          id: id++, ownerId: se.id, owner: se.name,
          name: CUSTOMERS[Math.floor(rnd() * CUSTOMERS.length)],
          model: MODELS[Math.floor(rnd() * MODELS.length)],
          stage,
          value: Math.round((900000 + rnd() * 2600000) / 10000) * 10000,
          days: 1 + Math.floor(rnd() * 21),
          phone: "+91 9" + String(Math.floor(rnd() * 900000000) + 100000000),
          source: ["Website", "CarDekho", "Walk-in", "Referral", "OLX"][Math.floor(rnd() * 5)],
          commPref: ["phone", "whatsapp", "phone"][Math.floor(rnd() * 3)],
          exchange: rnd() > 0.55, finance: rnd() > 0.4,
          budget: `\u20b9${10 + Math.floor(rnd() * 14)}\u201314 L`,
          testDrive: stage === "Ready to Book" ? (rnd() > 0.5 ? "Done \u00b7 showroom" : "Not yet") : "Done \u00b7 showroom",
          docs: stage === "Retailed" || stage === "Delivered" ? 6 : stage === "Booking" ? 2 + Math.floor(rnd() * 3) : 0,
          timeline: [
            { when: `${1 + Math.floor(rnd() * 3)}d ago`, what: stage === "Ready to Book" ? "Test drive completed \u2014 positive, still comparing" : "Booking amount received" },
            { when: `${4 + Math.floor(rnd() * 5)}d ago`, what: "Quote shared on WhatsApp" },
            { when: `${9 + Math.floor(rnd() * 6)}d ago`, what: "First call \u2014 connected, qualified" },
          ],
          next: stage === "Ready to Book" ? "Collect booking amount"
              : stage === "Booking" ? "Confirm allocation and documents"
              : stage === "Retailed" ? "Schedule delivery"
              : "Day-1 feedback call",
        });
      }
    };
    // Booking is cumulative, Retailed is the subset that has paid in full.
    mk("Retailed", se.retailed);
    mk("Booking", Math.max(0, se.booking - se.retailed));
    mk("Ready to Book", Math.max(0, Math.round(se.opportunity * 0.18)));
  });
  return out;
})();

// Escalations are raised ON leads — make sure each one exists as a real record.
(() => {
  let id = LEADS.length + 1;
  const ownerId = (name) => (flatten(ORG).find(se => se.name === name) || {}).id;
  ACTIONS.forEach(a => {
    if (LEADS.some(l => l.name === a.customer && l.owner === a.raisedBy)) return;
    const stage = a.kind === "stuck" ? "Booking" : "Ready to Book";
    LEADS.push({
      id: id++, ownerId: ownerId(a.raisedBy), owner: a.raisedBy, name: a.customer, model: a.model,
      stage, value: a.ask ? Math.max(1200000, a.ask * 32) : 1650000, days: 6,
      phone: "+91 98" + String(20000000 + a.id * 137).padStart(8, "0"),
      source: "Referral", commPref: "phone", exchange: a.kind === "pricing", finance: true,
      budget: "\u20b915\u201318 L", testDrive: "Done \u00b7 showroom",
      docs: stage === "Booking" ? 3 : 0,
      next: stage === "Booking" ? "Confirm allocation and documents" : "Collect booking amount",
      timeline: [
        { when: `${a.age} ago`, what: `Escalated: ${a.type}` },
        { when: "3d ago", what: "Quote shared on WhatsApp" },
        { when: "8d ago", what: "Test drive completed \u2014 positive" },
      ],
    });
  });
})();

// Retailed value per owner, derived from the leads themselves.
// A funnel status distinct from `stage` — Booking/Retailed/Delivered track the deal once
// it exists; this tracks where a lead sits (or died) before that, for segmentation.
const ADMIN_LEAD_STATUSES = ["Pre-Qualification", "Qualification", "Opportunity", "Lost <3m", "Lost <6m", "Lost"];
LEADS.forEach(l => {
  const bucket = (l.id * 7919) % 10;
  if (bucket < 2) {
    const sinceLost = (l.id * 104729) % 220;
    l.status = sinceLost <= 90 ? "Lost <3m" : sinceLost <= 180 ? "Lost <6m" : "Lost";
  } else if (bucket < 5) l.status = "Opportunity";
  else if (bucket < 8) l.status = "Qualification";
  else l.status = "Pre-Qualification";
});

// Add-on attach data. `finance` and `exchange` already exist per lead; the rest are
// enriched here, deterministically, so every incentive line below computes from a real
// per-lead figure rather than a decorative one — same treatment `status` got above.
LEADS.forEach(l => {
  l.insurance = (l.id * 65537) % 10 < 6;
  l.warranty = (l.id * 49157) % 10 < 3;
  l.coating = (l.id * 92821) % 10 < 4;
  l.accessoriesBill = (l.id * 15485863) % 10 < 5 ? 5000 + ((l.id * 7) % 20) * 500 : 0;
  l.addonBill = (l.id * 32452843) % 10 < 2 ? 3000 + ((l.id * 11) % 10) * 400 : 0;
  // Billing value behind each flat-fee add-on too, so a dealer can switch any of them to
  // a percentage-of-billing basis instead and still get a real number, not a placeholder.
  l.warrantyBill = l.warranty ? 12000 + ((l.id * 13) % 8) * 1000 : 0;
  l.coatingBill = l.coating ? 6000 + ((l.id * 17) % 6) * 500 : 0;
  l.insuranceBill = l.insurance ? 22000 + ((l.id * 19) % 10) * 1500 : 0;
  l.financeBill = l.finance ? Math.round(l.value * 0.7) : 0;
});

const LEAD_VALUE_BY_OWNER = LEADS.reduce((m, l) => {
  if (l.stage === "Retailed" || l.stage === "Delivered") m[l.ownerId] = (m[l.ownerId] || 0) + l.value;
  return m;
}, {});

function subtreeIds(node, out = []) {
  out.push(node.id);
  (node.reports || []).forEach(r => subtreeIds(r, out));
  return out;
}

const ROLE_SHORT = { "Sales Manager": "SM", "Team Leader": "TL", "Sales Executive": "SE" };
function Avatar({ r, size = 28 }) {
  const tone = r.role === "Sales Manager" ? C.ink : r.role === "Team Leader" ? C.teal : C.sub;
  return (
    <span style={{ width: size, height: size, borderRadius: "50%", background: tone, color: "#fff",
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      fontFamily: F, fontWeight: 800, fontSize: size * 0.36 }}>{r.initials}</span>
  );
}


/* The lead card and detail a Sales Executive sees — a manager drilling in should land on
   the same view, not a manager-only summary of it. */
function LeadCard({ lead, onOpen, handling }) {
  const mine = handling && handling[lead.id];
  const tone = lead.stage === "Retailed" ? C.green : lead.stage === "Booking" ? C.teal : C.warm;
  return (
    <button onClick={() => onOpen(lead)} style={{
      display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left",
      background: C.card, border: `1px solid ${C.border}`, borderLeft: `3px solid ${tone}`,
      borderRadius: 11, padding: "12px 13px", marginBottom: 8, cursor: "pointer",
    }}>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontFamily: F, fontSize: 13.5, fontWeight: 700, color: C.ink }}>
          {lead.name}
        </span>
        <span style={{ display: "block", fontFamily: F, fontSize: 11.5, color: C.sub, marginTop: 2 }}>
          {lead.model} · {lead.owner.split(" ")[0]}
          {mine && <span style={{ color: C.primary, fontWeight: 700 }}> · you're handling</span>}
        </span>
        <span style={{ display: "block", fontFamily: F, fontSize: 11, color: C.faint, marginTop: 3 }}>
          → {lead.next} · {lead.days}d
        </span>
      </span>
      <span style={{ textAlign: "right", flexShrink: 0 }}>
        <span style={{ display: "block", fontFamily: F, fontSize: 12.5, fontWeight: 800, color: C.ink }}>
          {inr(lead.value)}
        </span>
        <ChevronRight size={14} color={C.ghost} style={{ marginTop: 4 }} />
      </span>
    </button>
  );
}

function LeadScreen({ lead, onBack, showToast, handling, onTakeOver, onReassign }) {
  const [taking, setTaking] = useState(false);
  const [why, setWhy] = useState("");
  const mine = handling && handling[lead.id];
  const steps = ["Ready to Book", "Booking", "Retailed", "Delivered"];
  const at = steps.indexOf(lead.stage);
  const esc = lead.escalation;

  return (
    <div style={{ padding: "14px 14px 90px" }}>
      <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 5, background: "none",
        border: "none", cursor: "pointer", padding: "0 0 12px", fontFamily: F, fontSize: 12.5,
        fontWeight: 700, color: C.primary }}><ChevronLeft size={14} />Back</button>

      {/* ---- Header: same as the SE card ---- */}
      <div style={{ background: C.card, borderRadius: 16, padding: 15, marginBottom: 10, boxShadow: shadow }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontFamily: F, fontSize: 18.5, fontWeight: 800, color: C.ink }}>{lead.name}</span>
            <span style={{ display: "block", fontFamily: F, fontSize: 12.5, color: C.sub, marginTop: 3 }}>
              {lead.model} · {lead.budget}
            </span>
            <span style={{ display: "block", fontFamily: F, fontSize: 12, color: C.faint, marginTop: 3 }}>
              {lead.phone} · {lead.source}
            </span>
          </span>
          <span style={{ textAlign: "right", flexShrink: 0 }}>
            <span style={{ display: "inline-block", background: C.bg, borderRadius: 8, padding: "6px 9px",
              fontFamily: F, fontSize: 11, fontWeight: 700, color: C.sub, whiteSpace: "nowrap" }}>
              {lead.owner.split(" ")[0]}
            </span>
            {mine && <span style={{ display: "block", marginTop: 4, fontFamily: F, fontSize: 9.5,
              fontWeight: 800, color: C.primary, textTransform: "uppercase", letterSpacing: 0.4 }}>
              Manager handling</span>}
          </span>
        </div>
        <div style={{ display: "flex", gap: 4, marginTop: 14 }}>
          {steps.map((st, i) => (
            <span key={st} style={{ flex: 1, textAlign: "center" }}>
              <span style={{ display: "block", height: 4, borderRadius: 999,
                background: i <= at ? C.primary : C.border, marginBottom: 5 }} />
              <span style={{ fontFamily: F, fontSize: 9, fontWeight: i === at ? 800 : 500,
                color: i === at ? C.primary : C.faint }}>{st}</span>
            </span>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
          <TagChip label={lead.commPref === "whatsapp" ? "WhatsApp only" : "Phone"} on />
          <TagChip label="Exchange" on={lead.exchange} />
          <TagChip label="Finance" on={lead.finance} />
        </div>
      </div>

      {/* ---- Escalation rides on the lead, separate from its stage ---- */}
      {esc && (
        <div style={{ background: C.card, border: `1.5px solid ${esc.tone}44`, borderRadius: 14,
          padding: 14, marginBottom: 10 }}>
          <div style={{ fontFamily: F, fontSize: 9.5, fontWeight: 800, color: esc.tone,
            textTransform: "uppercase", letterSpacing: 0.4 }}>Open escalation · {esc.type}</div>
          <div style={{ fontFamily: F, fontSize: 12.5, color: C.sub, marginTop: 6, lineHeight: 1.5 }}>{esc.detail}</div>
          {esc.ask != null && (
            <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
              <span><span style={{ display: "block", fontFamily: F, fontSize: 10.5, color: C.faint,
                textTransform: "uppercase" }}>Requested</span>
                <span style={{ fontFamily: F, fontSize: 14.5, fontWeight: 900, color: C.ink }}>{inr(esc.ask)}</span></span>
              {esc.cap > 0 && (
                <span><span style={{ display: "block", fontFamily: F, fontSize: 10.5, color: C.faint,
                  textTransform: "uppercase" }}>Rep's cap</span>
                  <span style={{ fontFamily: F, fontSize: 14.5, fontWeight: 900, color: C.ink }}>{inr(esc.cap)}</span></span>
              )}
            </div>
          )}
        </div>
      )}

      <InfoCard title="Deal">
        <InfoRow k="Stage" v={lead.stage} />
        <InfoRow k="Next action" v={lead.next} />
        <InfoRow k="Days in stage" v={`${lead.days} days`} />
        <InfoRow k="Deal value" v={inr(lead.value)} />
        <InfoRow k="Test drive" v={lead.testDrive} />
        <InfoRow k="Documents" v={`${lead.docs} / 6`} />
      </InfoCard>

      <InfoCard title="Activity">
        {lead.timeline.map((t2, i) => (
          <div key={i} style={{ display: "flex", gap: 9, padding: "7px 0",
            borderBottom: i < lead.timeline.length - 1 ? `1px solid ${C.border}` : "none" }}>
            <span style={{ width: 52, flexShrink: 0, fontFamily: F, fontSize: 11, color: C.faint }}>{t2.when}</span>
            <span style={{ fontFamily: F, fontSize: 12.5, color: C.ink, lineHeight: 1.4 }}>{t2.what}</span>
          </div>
        ))}
      </InfoCard>

      {mine ? (
        /* Already handling — show the manager's own action set, same as an SE's. */
        <>
          <div style={{ background: C.bg, borderRadius: 11, padding: "11px 13px", marginBottom: 10 }}>
            <div style={{ fontFamily: F, fontSize: 10, fontWeight: 800, color: C.faint,
              textTransform: "uppercase", letterSpacing: 0.5 }}>You're driving this close</div>
            <div style={{ fontFamily: F, fontSize: 12, color: C.sub, marginTop: 4, lineHeight: 1.45 }}>
              Retail counts toward {lead.owner.split(" ")[0]}'s target. Your note: "{mine.note}"
            </div>
          </div>
          <div style={{ display: "flex", gap: 7 }}>
            {[["Call", () => showToast(`Calling ${lead.name}`)],
              ["WhatsApp", () => showToast(`WhatsApp to ${lead.name}`)],
              ["Log outcome", () => showToast("Outcome logged on the lead")]].map(([l2, fn]) => (
              <button key={l2} onClick={fn} style={{ flex: 1, padding: "12px 0", borderRadius: 10,
                cursor: "pointer", border: `1.5px solid ${C.borderStrong}`, background: C.card,
                color: C.ink, fontFamily: F, fontWeight: 700, fontSize: 12.5 }}>{l2}</button>
            ))}
          </div>
        </>
      ) : taking ? (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14 }}>
          <div style={{ fontFamily: F, fontSize: 13, fontWeight: 700, color: C.ink }}>
            Take over the close
          </div>
          <div style={{ fontFamily: F, fontSize: 11.5, color: C.sub, marginTop: 3, marginBottom: 10, lineHeight: 1.45 }}>
            {lead.owner.split(" ")[0]} keeps ownership and credit — you'll drive it alongside.
          </div>
          <textarea value={why} onChange={e => setWhy(e.target.value)} rows={2}
            placeholder="Why you're stepping in — goes to the rep (required)"
            style={{ width: "100%", boxSizing: "border-box", borderRadius: 9, padding: "8px 10px",
              border: `1.5px solid ${why.trim().length > 3 ? C.borderStrong : C.border}`,
              fontFamily: F, fontSize: 12, color: C.ink, background: C.card, outline: "none", resize: "none" }} />
          <div style={{ display: "flex", gap: 7, marginTop: 9 }}>
            <button onClick={() => { setTaking(false); setWhy(""); }} style={{ padding: "10px 14px",
              borderRadius: 9, cursor: "pointer", border: `1.5px solid ${C.borderStrong}`,
              background: C.card, color: C.sub, fontFamily: F, fontWeight: 700, fontSize: 12 }}>Back</button>
            <button disabled={why.trim().length <= 3} onClick={() => onTakeOver(lead, why.trim())}
              style={{ flex: 1, padding: "10px 0", borderRadius: 9, border: "none",
                cursor: why.trim().length > 3 ? "pointer" : "default",
                background: why.trim().length > 3 ? C.primary : C.borderStrong, color: "#fff",
                fontFamily: F, fontWeight: 800, fontSize: 12 }}>Confirm</button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => onReassign(lead)}
            style={{ flex: 1, padding: "14px 0", borderRadius: 11, cursor: "pointer",
              border: `1.5px solid ${C.borderStrong}`, background: C.card, color: C.sub,
              fontFamily: F, fontWeight: 700, fontSize: 13 }}>Reassign</button>
          <button onClick={() => setTaking(true)}
            style={{ flex: 1.4, padding: "14px 0", borderRadius: 11, border: "none", background: C.primary,
              color: "#fff", fontFamily: F, fontWeight: 800, fontSize: 13, cursor: "pointer" }}>
            Take over the close
          </button>
        </div>
      )}
    </div>
  );
}

/* Result of tapping a number in the target table. */
function DrillScreen({ drill, onBack, onOpenLead, handling }) {
  const ids = subtreeIds(drill.node);
  const rows = LEADS.filter(l => ids.includes(l.ownerId) && l.stage === drill.stage);
  // Count the people actually carrying leads, not every manager in the subtree.
  const owners = new Set(rows.map(l => l.ownerId)).size;
  return (
    <div style={{ padding: "14px 14px 90px" }}>
      <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 5,
        background: "none", border: "none", cursor: "pointer", padding: "0 0 10px",
        fontFamily: F, fontSize: 12.5, fontWeight: 700, color: C.primary }}>
        <ChevronLeft size={14} />Back to board
      </button>
      <div style={{ fontFamily: F, fontWeight: 800, fontSize: 15.5, color: C.ink }}>
        {drill.stage} · {drill.node.name.split(" ")[0]}
      </div>
      <div style={{ fontFamily: F, fontSize: 11.5, color: C.sub, marginTop: 1, marginBottom: 13 }}>
        {rows.length} {rows.length === 1 ? "lead" : "leads"} across {owners} {owners === 1 ? "person" : "people"}.
      </div>
      {rows.length === 0
        ? <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12,
            padding: 22, textAlign: "center", fontFamily: F, fontSize: 13, color: C.sub }}>
            Nothing at this stage.
          </div>
        : rows.map(l => <LeadCard key={l.id} lead={l} onOpen={onOpenLead} handling={handling} />)}
    </div>
  );
}

/* ============================ TARGET ROLLUP ============================ */
// Depth is shown by a role-coloured left bar and a background step — NOT by indenting.
// Four levels of indent would leave no width for the numbers on a phone, and the parent
// name in the sub-line carries the relationship better than whitespace does.
const DEPTH_BG = ["rgba(240,90,40,0.07)", "#FFFFFF", "#FAF9F5", "#F4F2EB"];
const ROLE_TONE = { "Sales Manager": "#0E0E0C", "Team Leader": "#00695C", "Sales Executive": "#AEABA3" };

function TargetRow({ node, depth, expanded, onToggle, onPick, parent, onDrill }) {
  const r = roll(node);
  const hasKids = !!(node.reports && node.reports.length);
  const open = expanded.has(node.id);
  return (
    <>
      <div style={{
        display: "flex", alignItems: "center", minHeight: 48,
        borderBottom: `1px solid ${C.border}`,
        background: DEPTH_BG[Math.min(depth, DEPTH_BG.length - 1)],
        borderLeft: `3px solid ${ROLE_TONE[node.role]}`,
      }}>
        <button type="button" onClick={() => hasKids ? onToggle(node.id) : onPick(node)}
          aria-expanded={hasKids ? open : undefined}
          style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 6,
            padding: "10px 4px 10px 6px", background: "none", border: "none", cursor: "pointer",
            textAlign: "left", WebkitTapHighlightColor: "transparent" }}>
          {hasKids
            ? (open ? <ChevronDown size={12} color={C.faint} style={{ flexShrink: 0 }} />
                    : <ChevronRight size={12} color={C.faint} style={{ flexShrink: 0 }} />)
            : <span style={{ width: 12, flexShrink: 0 }} />}
          <Avatar r={node} size={depth === 0 ? 26 : 23} />
          <span style={{ minWidth: 0 }}>
            <span style={{ display: "block", fontFamily: F, fontSize: 12.5,
              fontWeight: depth === 0 ? 800 : 600, color: C.ink,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {node.name.split(" ")[0]}
            </span>
            <span style={{ display: "block", fontFamily: F, fontSize: 10, color: C.faint,
              marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {ROLE_SHORT[node.role]}
              {hasKids ? ` · ${r.heads}` : ""}
              {parent ? ` · under ${parent}` : ""}
            </span>
          </span>
        </button>
        <span style={{ width: 42, textAlign: "center", fontFamily: F, fontSize: 12.5,
          fontWeight: 600, color: C.sub }}>{r.target}</span>
        <button type="button" onClick={() => onDrill(node, "Retailed")}
          style={{ width: 44, textAlign: "center", cursor: "pointer", background: "none", border: "none",
            padding: "8px 0", WebkitTapHighlightColor: "transparent" }}>
          <span style={{ display: "block", fontFamily: F, fontSize: 12.5, fontWeight: 700,
            lineHeight: 1, color: C.ink, textDecoration: "underline",
            textDecorationColor: C.border, textUnderlineOffset: 3 }}>{r.retailed}</span>
          <span style={{ display: "block", fontFamily: F, fontSize: 9, marginTop: 2,
            color: C.faint }}>{pct(r.retailed, r.target)}%</span>
        </button>
        <button type="button" onClick={() => onDrill(node, "Booking")}
          style={{ width: 40, textAlign: "center", fontFamily: F, fontSize: 12.5, fontWeight: 600,
            color: C.sub, cursor: "pointer", textDecoration: "underline", textDecorationColor: C.border,
            textUnderlineOffset: 3, background: "none", border: "none", padding: "8px 0",
            WebkitTapHighlightColor: "transparent" }}>{r.booking}</button>
        <span style={{ width: 62, textAlign: "right", paddingRight: 4, fontFamily: F,
          fontSize: 11.5, fontWeight: 700, color: C.ink }}>{inr(r.salesValue)}</span>
      </div>
      {open && hasKids && node.reports.map(ch => (
        <TargetRow key={ch.id} node={ch} depth={depth + 1} expanded={expanded}
          onToggle={onToggle} onPick={onPick} onDrill={onDrill} parent={node.name.split(" ")[0]} />
      ))}
    </>
  );
}

/* ============================ ACTION CARD ============================ */
function ActionCard({ item, onResolve, onOpenLead, onLogFollowUp }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(null);
  const decision = isDecision(item);
  const noteRequired = pending === "decline" || pending === "resolve";
  const canSubmit = pending && (!noteRequired || note.trim().length > 3);

  return (
    <div style={{ border: `1px solid ${C.border}`, borderRadius: 12, padding: 12, marginBottom: 9,
      background: C.card }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 9 }}>
        <span style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, background: item.tone + "1A",
          display: "flex", alignItems: "center", justifyContent: "center" }}>
          <item.Icon size={14} color={item.tone} />
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontFamily: F, fontSize: 9.5, fontWeight: 800, color: item.tone,
              textTransform: "uppercase", letterSpacing: 0.3 }}>{item.type}</span>
            {item.urgent && <span style={{ background: C.hotSoft, color: C.hot, borderRadius: 4,
              padding: "1px 5px", fontFamily: F, fontSize: 8.5, fontWeight: 800 }}>URGENT</span>}
            <span style={{ fontFamily: F, fontSize: 10, color: C.faint }}>· {item.age}</span>
          </span>
          <span style={{ display: "block", fontFamily: F, fontSize: 13, fontWeight: 700,
            color: C.ink, marginTop: 3 }}>{item.customer}</span>
          <span style={{ display: "block", fontFamily: F, fontSize: 11, color: C.faint, marginTop: 1 }}>
            {item.model} · {item.kind === "followup" ? `${item.raisedBy.split(" ")[0]}'s lead` : `raised by ${item.raisedBy}`}
          </span>
        </span>
        {item.ask != null && (
          <span style={{ textAlign: "right", flexShrink: 0 }}>
            <span style={{ display: "block", fontFamily: F, fontSize: 13.5, fontWeight: 900, color: C.ink }}>
              {inr(item.ask)}
            </span>
            {item.cap > 0 && (
              <span style={{ display: "block", fontFamily: F, fontSize: 10.5, color: C.sub, fontWeight: 600 }}>
                {inr(item.ask - item.cap)} over cap
              </span>
            )}
          </span>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 14, paddingTop: 8 }}>
        <button onClick={() => setOpen(v => !v)} style={{ display: "flex", alignItems: "center", gap: 5,
          background: "none", border: "none", padding: 0, cursor: "pointer",
          fontFamily: F, fontSize: 11, fontWeight: 700, color: C.sub }}>
          {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}{open ? "Hide detail" : "See detail"}
        </button>
        {/* The manager usually wants the lead itself, not a summary of it. */}
        <button onClick={() => onOpenLead(item)} style={{ display: "flex", alignItems: "center", gap: 4,
          background: "none", border: "none", padding: 0, cursor: "pointer",
          fontFamily: F, fontSize: 11, fontWeight: 700, color: C.primary }}>
          Open lead<ChevronRight size={12} />
        </button>
      </div>
      {open && (
        <div style={{ fontFamily: F, fontSize: 12, color: C.sub, lineHeight: 1.5,
          background: C.bg, borderRadius: 8, padding: "9px 10px", marginTop: 7 }}>{item.detail}</div>
      )}

      {item.kind === "followup" ? (
        <div style={{ display: "flex", gap: 7, marginTop: 10 }}>
          {[["Call", "call"], ["WhatsApp", "whatsapp"], ["Log outcome", "log"]].map(([l2, k]) => (
            <button key={k} onClick={() => onLogFollowUp(item.lead, k)} style={{
              flex: 1, padding: "9px 0", borderRadius: 9, cursor: "pointer",
              border: `1.5px solid ${C.borderStrong}`, background: C.card, color: C.ink,
              fontFamily: F, fontWeight: 700, fontSize: 12 }}>{l2}</button>
          ))}
        </div>
      ) : pending ? (
        <div style={{ marginTop: 9 }}>
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
            placeholder={noteRequired
              ? "Tell them why — this goes back to the rep (required)"
              : "Add a note for the rep (optional)"}
            style={{ width: "100%", boxSizing: "border-box", borderRadius: 9, padding: "8px 10px",
              border: `1.5px solid ${noteRequired && !canSubmit ? C.hot : C.borderStrong}`,
              fontFamily: F, fontSize: 12, color: C.ink, background: C.card,
              outline: "none", resize: "none" }} />
          <div style={{ display: "flex", gap: 7, marginTop: 8 }}>
            <button onClick={() => { setPending(null); setNote(""); }} style={{
              padding: "9px 14px", borderRadius: 9, cursor: "pointer",
              border: `1.5px solid ${C.borderStrong}`, background: C.card, color: C.sub,
              fontFamily: F, fontWeight: 700, fontSize: 12 }}>Back</button>
            <button disabled={!canSubmit} onClick={() => onResolve(item.id, pending, note.trim())}
              style={{ flex: 1, padding: "9px 0", borderRadius: 9, border: "none",
                cursor: canSubmit ? "pointer" : "default", color: "#fff",
                background: canSubmit ? (pending === "decline" ? C.hot : C.green) : C.borderStrong,
                fontFamily: F, fontWeight: 800, fontSize: 12,
                textTransform: "capitalize" }}>Confirm {pending}</button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 7, marginTop: 10 }}>
          <button onClick={() => setPending(decision ? "decline" : "ack")} style={{
            flex: 1, padding: "9px 0", borderRadius: 9, cursor: "pointer",
            border: `1.5px solid ${C.borderStrong}`, background: C.card, color: C.sub,
            fontFamily: F, fontWeight: 700, fontSize: 12 }}>
            {decision ? "Decline" : "I'm on it"}
          </button>
          <button onClick={() => setPending(decision ? "approve" : "resolve")} style={{
            flex: 1.3, padding: "9px 0", borderRadius: 9, cursor: "pointer", border: "none",
            background: C.primary, color: "#fff", fontFamily: F, fontWeight: 800, fontSize: 12 }}>
            {decision ? "Approve" : "Resolve"}
          </button>
        </div>
      )}
    </div>
  );
}


/* ---------------- Model-wise performance ----------------
   Targets exist at model level only — the OEM does not set variant targets — so the
   variant rows deliberately show a dash rather than inventing one. */
const MODEL_PERF = [
  { model: "Creta", target: 12, variants: [
    { name: "E / EX", retailed: 2, booking: 3 },
    { name: "S / S(O)", retailed: 3, booking: 4 },
    { name: "SX / SX(O)", retailed: 4, booking: 5 },
  ]},
  { model: "Venue", target: 9, variants: [
    { name: "E / S", retailed: 3, booking: 3 },
    { name: "SX / SX(O)", retailed: 6, booking: 7 },
  ]},
  { model: "Exter", target: 8, variants: [
    { name: "EX / S", retailed: 4, booking: 5 },
    { name: "SX / SX(O)", retailed: 2, booking: 3 },
  ]},
  { model: "Verna", target: 5, variants: [
    { name: "EX / S", retailed: 1, booking: 2 },
    { name: "SX / SX(O) Turbo", retailed: 3, booking: 3 },
  ]},
  { model: "Alcazar", target: 5, variants: [
    { name: "Prestige", retailed: 1, booking: 2 },
    { name: "Platinum / Signature", retailed: 2, booking: 4 },
  ]},
  { model: "Ioniq 5", target: 4, variants: [{ name: "AWD", retailed: 5, booking: 6 }] },
];
const AVG_UNIT = { Creta: 1720000, Venue: 1180000, Exter: 890000, Verna: 1490000,
  Alcazar: 2080000, "Ioniq 5": 4630000 };


const ModelHead = () => (
  <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: 7,
    borderBottom: `1.5px solid ${C.borderStrong}` }}>
    <span style={{ flex: 1, fontFamily: F, fontSize: 9, fontWeight: 800, color: C.sub,
      textTransform: "uppercase", letterSpacing: 0.4, paddingLeft: 5 }}>Model</span>
    {["Target", "Retail", "Book"].map(h => (
      <span key={h} style={{ width: 42, textAlign: "center", fontFamily: F, fontSize: 9,
        fontWeight: 800, color: C.sub, textTransform: "uppercase" }}>{h}</span>
    ))}
    <span style={{ width: 62, textAlign: "right", paddingRight: 4, fontFamily: F, fontSize: 9,
      fontWeight: 800, color: C.sub, textTransform: "uppercase" }}>Value</span>
  </div>
);

function ModelDashboard() {
  const [open, setOpen] = useState(new Set());
  const toggle = (m) => setOpen(s2 => { const n = new Set(s2); if (n.has(m)) n.delete(m); else n.add(m); return n; });
  const tot = MODEL_PERF.reduce((a, m) => {
    const ret = m.variants.reduce((n, v) => n + v.retailed, 0);
    const bk = m.variants.reduce((n, v) => n + v.booking, 0);
    return { target: a.target + m.target, retailed: a.retailed + ret, booking: a.booking + bk,
      value: a.value + ret * AVG_UNIT[m.model] };
  }, { target: 0, retailed: 0, booking: 0, value: 0 });

  return (
    <div style={{ padding: "14px 14px 90px" }}>
      <div style={{ fontFamily: F, fontWeight: 800, fontSize: 15.5, color: C.ink }}>Model performance</div>
      <div style={{ fontFamily: F, fontSize: 11.5, color: C.sub, marginTop: 1, marginBottom: 13 }}>
        Tap a model to see its variants.
      </div>
      <div style={{ background: C.card, borderRadius: 16, padding: "14px 10px", boxShadow: shadow }}>
        <ModelHead />
        {MODEL_PERF.map(m => {
          const ret = m.variants.reduce((n, v) => n + v.retailed, 0);
          const bk = m.variants.reduce((n, v) => n + v.booking, 0);
          const isOpen = open.has(m.model);
          return (
            <React.Fragment key={m.model}>
              <div onClick={() => toggle(m.model)} style={{ display: "flex", alignItems: "center",
                padding: "11px 0", cursor: "pointer", borderBottom: `1px solid ${C.border}` }}>
                <span style={{ flex: 1, display: "flex", alignItems: "center", gap: 6, paddingLeft: 5 }}>
                  {isOpen ? <ChevronDown size={12} color={C.faint} /> : <ChevronRight size={12} color={C.faint} />}
                  <span style={{ fontFamily: F, fontSize: 13, fontWeight: 700, color: C.ink }}>{m.model}</span>
                </span>
                <span style={{ width: 42, textAlign: "center", fontFamily: F, fontSize: 12.5,
                  fontWeight: 600, color: C.sub }}>{m.target}</span>
                <span style={{ width: 42, textAlign: "center" }}>
                  <span style={{ display: "block", fontFamily: F, fontSize: 12.5, fontWeight: 700,
                    color: C.ink, lineHeight: 1 }}>{ret}</span>
                  <span style={{ display: "block", fontFamily: F, fontSize: 10, color: C.faint,
                    marginTop: 2 }}>{pct(ret, m.target)}%</span>
                </span>
                <span style={{ width: 42, textAlign: "center", fontFamily: F, fontSize: 12.5,
                  fontWeight: 600, color: C.sub }}>{bk}</span>
                <span style={{ width: 62, textAlign: "right", paddingRight: 4, fontFamily: F,
                  fontSize: 11.5, fontWeight: 700, color: C.ink }}>{inr(ret * AVG_UNIT[m.model])}</span>
              </div>
              {isOpen && m.variants.map(v => (
                <div key={v.name} style={{ display: "flex", alignItems: "center", padding: "9px 0",
                  borderBottom: `1px solid ${C.border}`, background: "#FAF9F5" }}>
                  <span style={{ flex: 1, paddingLeft: 23, fontFamily: F, fontSize: 12,
                    color: C.sub }}>{v.name}</span>
                  {/* No variant-level target exists — a dash is honest, a number would not be. */}
                  <span style={{ width: 42, textAlign: "center", fontFamily: F, fontSize: 11.5,
                    color: C.ghost }}>—</span>
                  <span style={{ width: 42, textAlign: "center", fontFamily: F, fontSize: 12.5,
                    fontWeight: 600, color: C.ink }}>{v.retailed}</span>
                  <span style={{ width: 42, textAlign: "center", fontFamily: F, fontSize: 12.5,
                    color: C.sub }}>{v.booking}</span>
                  <span style={{ width: 62, textAlign: "right", paddingRight: 4, fontFamily: F,
                    fontSize: 11, color: C.sub }}>{inr(v.retailed * AVG_UNIT[m.model])}</span>
                </div>
              ))}
            </React.Fragment>
          );
        })}
        <div style={{ display: "flex", alignItems: "center", padding: "11px 0", marginTop: 2 }}>
          <span style={{ flex: 1, paddingLeft: 5, fontFamily: F, fontSize: 11.5, fontWeight: 800,
            color: C.faint, textTransform: "uppercase", letterSpacing: 0.4 }}>Total</span>
          <span style={{ width: 42, textAlign: "center", fontFamily: F, fontSize: 12.5,
            fontWeight: 800, color: C.ink }}>{tot.target}</span>
          <span style={{ width: 42, textAlign: "center", fontFamily: F, fontSize: 12.5,
            fontWeight: 800, color: C.ink }}>{tot.retailed}</span>
          <span style={{ width: 42, textAlign: "center", fontFamily: F, fontSize: 12.5,
            fontWeight: 800, color: C.ink }}>{tot.booking}</span>
          <span style={{ width: 62, textAlign: "right", paddingRight: 4, fontFamily: F,
            fontSize: 11.5, fontWeight: 800, color: C.ink }}>{inr(tot.value)}</span>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Funnel by person, same hierarchy as target achievement ---------------- */
const PERIODS = [
  { key: "this", label: "This month" },
  { key: "last", label: "Last month" },
  { key: "prev", label: "2 months back" },
  { key: "custom", label: "Custom" },
];
const FUNNEL_COLS = [
  { key: "leads", label: "Leads" }, { key: "contacted", label: "Cont" },
  { key: "visit", label: "Visit" }, { key: "booking", label: "Book" },
  { key: "retailed", label: "Retail" }, { key: "delivered", label: "Deliv" },
  { key: "lostBooking", label: "Lost Bk" }, { key: "lostLead", label: "Lost Ld" },
];
const PERIOD_SCALE = { this: 1, last: 1.12, prev: 0.94, custom: 1.05 };

function funnelFor(node, scale) {
  const r = roll(node);
  const f = (n) => Math.round(n * scale);
  return {
    leads: f(r.leads), contacted: f(r.leads * 0.78), visit: f(r.td * 1.15),
    booking: f(r.booking), retailed: f(r.retailed), delivered: f(r.retailed * 0.86),
    lostBooking: f(r.booking * 0.07), lostLead: f(r.leads * 0.34),
  };
}

function FunnelRow({ node, depth, expanded, onToggle, scale, parent }) {
  const f = funnelFor(node, scale);
  const hasKids = !!(node.reports && node.reports.length);
  const isOpen = expanded.has(node.id);
  return (
    <>
      <div onClick={() => hasKids && onToggle(node.id)} style={{ display: "flex", alignItems: "center",
        padding: "10px 0", cursor: hasKids ? "pointer" : "default",
        borderBottom: `1px solid ${C.border}`,
        background: DEPTH_BG[Math.min(depth, DEPTH_BG.length - 1)],
        borderLeft: `3px solid ${ROLE_TONE[node.role]}` }}>
        <span style={{ width: 118, flexShrink: 0, display: "flex", alignItems: "center", gap: 5,
          paddingLeft: 6, position: "sticky", left: 0,
          background: DEPTH_BG[Math.min(depth, DEPTH_BG.length - 1)] }}>
          {hasKids ? (isOpen ? <ChevronDown size={11} color={C.faint} /> : <ChevronRight size={11} color={C.faint} />)
                   : <span style={{ width: 11 }} />}
          <span style={{ minWidth: 0 }}>
            <span style={{ display: "block", fontFamily: F, fontSize: 12, fontWeight: depth === 0 ? 800 : 600,
              color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {node.name.split(" ")[0]}
            </span>
            <span style={{ display: "block", fontFamily: F, fontSize: 9.5, color: C.faint }}>
              {ROLE_SHORT[node.role]}{parent ? ` · ${parent}` : ""}
            </span>
          </span>
        </span>
        {FUNNEL_COLS.map(c => {
          // Every stage as a share of that row's leads, so a row reads as one funnel.
          // Lost bookings is the exception: it only makes sense against bookings.
          const base = c.key === "lostBooking" ? f.booking : f.leads;
          const share = c.key === "leads" ? null : pct(f[c.key], base);
          return (
            <span key={c.key} style={{ width: 46, flexShrink: 0, textAlign: "center" }}>
              <span style={{ display: "block", fontFamily: F, fontSize: 12.5, fontWeight: 600,
                color: C.ink, lineHeight: 1 }}>{f[c.key]}</span>
              {share != null && (
                <span style={{ display: "block", fontFamily: F, fontSize: 10, color: C.faint,
                  marginTop: 2 }}>{share}%</span>
              )}
            </span>
          );
        })}
      </div>
      {isOpen && hasKids && node.reports.map(ch => (
        <FunnelRow key={ch.id} node={ch} depth={depth + 1} expanded={expanded} onToggle={onToggle}
          scale={scale} parent={node.name.split(" ")[0]} />
      ))}
    </>
  );
}

function FunnelDashboard({ org = ORG }) {
  const [period, setPeriod] = useState("this");
  const [from, setFrom] = useState("2026-08-01");
  const [to, setTo] = useState("2026-08-31");
  const [expanded, setExpanded] = useState(new Set([ORG.id]));
  const toggle = (id) => setExpanded(s2 => { const n = new Set(s2); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  // A custom span scales the month's volume by its length — a 45-day window shows ~1.5x.
  const customDays = Math.max(1, Math.round((new Date(to) - new Date(from)) / 86400000) + 1);
  const scale = period === "custom" ? customDays / 30 : PERIOD_SCALE[period];
  return (
    <div style={{ padding: "14px 14px 90px" }}>
      <div style={{ fontFamily: F, fontWeight: 800, fontSize: 15.5, color: C.ink }}>Funnel by person</div>
      <div style={{ fontFamily: F, fontSize: 11.5, color: C.sub, marginTop: 1, marginBottom: 11 }}>
        % is of that row's leads. Swipe for more columns.
      </div>
      <div style={{ display: "flex", gap: 5, marginBottom: 12, flexWrap: "wrap" }}>
        {PERIODS.map(p2 => {
          const on = period === p2.key;
          return (
            <button key={p2.key} onClick={() => setPeriod(p2.key)} style={{
              padding: "7px 11px", borderRadius: 9, cursor: "pointer",
              border: `1.5px solid ${on ? C.primary : C.border}`,
              background: on ? C.primarySoft : C.card, color: on ? C.primary : C.sub,
              fontFamily: F, fontWeight: 700, fontSize: 11.5 }}>{p2.label}</button>
          );
        })}
      </div>
      {period === "custom" && (
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12,
          background: C.card, border: `1px solid ${C.border}`, borderRadius: 11, padding: 10 }}>
          <span style={{ flex: 1 }}>
            <span style={{ display: "block", fontFamily: F, fontSize: 10.5, fontWeight: 800, color: C.faint,
              textTransform: "uppercase", marginBottom: 3 }}>From</span>
            <input type="date" value={from} max={to} onChange={e => setFrom(e.target.value)}
              style={{ width: "100%", boxSizing: "border-box", border: `1.5px solid ${C.borderStrong}`,
                borderRadius: 8, padding: "7px 8px", fontFamily: F, fontSize: 12.5, color: C.ink,
                background: C.card, outline: "none" }} />
          </span>
          <span style={{ flex: 1 }}>
            <span style={{ display: "block", fontFamily: F, fontSize: 10.5, fontWeight: 800, color: C.faint,
              textTransform: "uppercase", marginBottom: 3 }}>To</span>
            <input type="date" value={to} min={from} onChange={e => setTo(e.target.value)}
              style={{ width: "100%", boxSizing: "border-box", border: `1.5px solid ${C.borderStrong}`,
                borderRadius: 8, padding: "7px 8px", fontFamily: F, fontSize: 12.5, color: C.ink,
                background: C.card, outline: "none" }} />
          </span>
          <span style={{ fontFamily: F, fontSize: 11, color: C.sub, alignSelf: "flex-end",
            paddingBottom: 9, whiteSpace: "nowrap" }}>{customDays}d</span>
        </div>
      )}
      <div style={{ background: C.card, borderRadius: 16, padding: "12px 0", boxShadow: shadow,
        overflowX: "auto" }}>
        <div style={{ minWidth: 118 + FUNNEL_COLS.length * 46 }}>
          <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: 7,
            borderBottom: `1.5px solid ${C.borderStrong}` }}>
            <span style={{ width: 118, flexShrink: 0, paddingLeft: 9, fontFamily: F, fontSize: 9,
              fontWeight: 800, color: C.sub, textTransform: "uppercase" }}>Name</span>
            {FUNNEL_COLS.map(c => (
              <span key={c.key} style={{ width: 46, flexShrink: 0, textAlign: "center", fontFamily: F,
                fontSize: 9, fontWeight: 800, color: C.sub, textTransform: "uppercase" }}>{c.label}</span>
            ))}
          </div>
          <FunnelRow node={org} depth={0} expanded={expanded} onToggle={toggle} scale={scale} />
        </div>
      </div>
    </div>
  );
}

/* ---------------- Reports ---------------- */
// Build the rows each report would contain, from the same data the dashboards use.
function reportRows(key) {
  if (key === "target") {
    const out = [["Name", "Role", "Reports to", "Target", "Retailed", "Booking", "Value"]];
    const walk = (n, parent) => {
      const r = roll(n);
      out.push([n.name, n.role, parent || "", r.target, r.retailed, r.booking, r.salesValue]);
      (n.reports || []).forEach(c => walk(c, n.name));
    };
    walk(ORG, "");
    return out;
  }
  if (key === "model") {
    const out = [["Model", "Variant", "Target", "Retailed", "Booking", "Value"]];
    MODEL_PERF.forEach(m => {
      const ret = m.variants.reduce((n, v) => n + v.retailed, 0);
      const bk = m.variants.reduce((n, v) => n + v.booking, 0);
      out.push([m.model, "", m.target, ret, bk, ret * AVG_UNIT[m.model]]);
      m.variants.forEach(v => out.push([m.model, v.name, "", v.retailed, v.booking, v.retailed * AVG_UNIT[m.model]]));
    });
    return out;
  }
  if (key === "funnel") {
    const out = [["Name", "Role", ...FUNNEL_COLS.map(c => c.label)]];
    const walk = (n) => {
      const f = funnelFor(n, 1);
      out.push([n.name, n.role, ...FUNNEL_COLS.map(c => f[c.key])]);
      (n.reports || []).forEach(walk);
    };
    walk(ORG);
    return out;
  }
  if (key === "walletbill") {
    const out = [["Customer", "Phone", "SMS Sent", "SMS Cost", "WhatsApp Sent", "WhatsApp Cost", "Calls", "Call Cost", "Total Billed"]];
    ADMIN_WALLET_BILLING.forEach(b => out.push([b.customer, b.phone, b.smsSent, `Rs ${b.smsCost}`, b.waSent, `Rs ${b.waCost}`, b.calls, `Rs ${b.callCost}`, `Rs ${b.total}`]));
    return out;
  }
  if (key === "calllogcre") {
    const out = [["Date", "Time", "Telecaller", "Customer", "Phone", "Model", "Source", "Outcome", "Duration", "Notes", "Next Follow-up"]];
    ADMIN_CRE_CALL_LOG.forEach(c => out.push([c.dateLabel, c.time, c.telecaller, c.customer, c.phone, c.model, c.source, c.outcome, c.duration, c.notes, c.nextFollowUp]));
    return out;
  }
  if (key === "calllogse") {
    const out = [["Date", "Time", "Sales Executive", "Customer", "Phone", "Model", "Stage", "Outcome", "Duration", "Test Drive Discussed", "Notes", "Next Follow-up"]];
    ADMIN_SE_CALL_LOG.forEach(c => out.push([c.dateLabel, c.time, c.se, c.customer, c.phone, c.model, c.stage, c.outcome, c.duration, c.testDrive, c.notes, c.nextFollowUp]));
    return out;
  }
  if (key === "testdrive") {
    const out = [["Date", "Time", "Customer", "Phone", "Model", "Variant", "Sales Executive", "Branch", "Status", "Feedback", "Booking Converted"]];
    ADMIN_TEST_DRIVES.forEach(t => out.push([t.dateLabel, t.time, t.customer, t.phone, t.model, t.variant, t.se, t.branch, t.status, t.feedback, t.converted]));
    return out;
  }
  return [["Type", "Raised by", "Customer", "Model", "Requested", "Urgent"],
    ...ACTIONS.map(a => [a.type, a.raisedBy, a.customer, a.model, a.ask || "", a.urgent ? "Yes" : "No"])];
}
function downloadCsv(name, rows) {
  const esc = (v) => `"${String(v).replace(/"/g, '""')}"`;
  const csv = rows.map(r => r.map(esc).join(",")).join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `${name.replace(/\s+/g, "-").toLowerCase()}.csv`;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}
function printPdf(name, rows) {
  const w = window.open("", "_blank");
  if (!w) return false;
  const th = rows[0].map(h => `<th>${h}</th>`).join("");
  const tr = rows.slice(1).map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("");
  w.document.write(`<html><head><title>${name}</title><style>
    body{font-family:Inter,system-ui,sans-serif;padding:24px;color:#0E0E0C}
    h1{font-size:18px;margin:0 0 4px} p{font-size:11px;color:#726F68;margin:0 0 16px}
    table{border-collapse:collapse;width:100%;font-size:11px}
    th{text-align:left;border-bottom:2px solid #D8D6CF;padding:6px 8px;font-size:10px;text-transform:uppercase}
    td{border-bottom:1px solid #E3E1DA;padding:6px 8px}
  </style></head><body><h1>${name}</h1><p>Autoprism · generated ${new Date().toLocaleDateString("en-IN")}</p>
  <table><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table>
  <script>window.onload=()=>window.print()</script></body></html>`);
  w.document.close();
  return true;
}

function ReportsScreen({ showToast }) {
  const REPORTS = [
    { key: "target", name: "Target achievement", note: "SM / TL / SE rollup with value" },
    { key: "model", name: "Model performance", note: "Model and variant split against OEM target" },
    { key: "funnel", name: "Funnel by person", note: "Leads through delivered, plus losses" },
    { key: "escal", name: "Escalations and approvals", note: "Decisions taken, with notes" },
    { key: "walletbill", name: "Wallet billing", note: "Per-customer SMS, WhatsApp and call cost — cross-check against the Wallet invoice" },
    { key: "calllogcre", name: "Telecaller call log", note: "Every qualification call, by telecaller" },
    { key: "calllogse", name: "Sales Executive call log", note: "Every call after handoff, by SE" },
    { key: "testdrive", name: "Test drives", note: "Scheduled, completed and no-shows, with feedback" },
  ];
  return (
    <div style={{ padding: "14px 14px 90px" }}>
      <div style={{ fontFamily: F, fontWeight: 800, fontSize: 15.5, color: C.ink }}>Reports</div>
      <div style={{ fontFamily: F, fontSize: 11.5, color: C.sub, marginTop: 1, marginBottom: 13 }}>
        Every dashboard, as Excel or PDF.
      </div>
      {REPORTS.map(r2 => (
        <div key={r2.key} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12,
          padding: 13, marginBottom: 9 }}>
          <div style={{ fontFamily: F, fontSize: 13.5, fontWeight: 700, color: C.ink }}>{r2.name}</div>
          <div style={{ fontFamily: F, fontSize: 11.5, color: C.faint, marginTop: 2 }}>{r2.note}</div>
          <div style={{ display: "flex", gap: 7, marginTop: 10 }}>
            <button onClick={() => { downloadCsv(r2.name, reportRows(r2.key)); showToast(`${r2.name} downloaded`); }} style={{
              flex: 1, padding: "8px 0", borderRadius: 8, cursor: "pointer",
              border: `1.5px solid ${C.borderStrong}`, background: C.card, color: C.sub,
              fontFamily: F, fontWeight: 700, fontSize: 11.5 }}>Excel</button>
            <button onClick={() => { if (!printPdf(r2.name, reportRows(r2.key))) showToast("Allow pop-ups to print"); }} style={{
              flex: 1, padding: "8px 0", borderRadius: 8, cursor: "pointer",
              border: `1.5px solid ${C.borderStrong}`, background: C.card, color: C.sub,
              fontFamily: F, fontWeight: 700, fontSize: 11.5 }}>PDF</button>
            <button onClick={() => showToast(`${r2.name} scheduled — every Monday 9am`)} style={{
              flex: 1.2, padding: "8px 0", borderRadius: 8, cursor: "pointer", border: "none",
              background: C.primary, color: "#fff", fontFamily: F, fontWeight: 800, fontSize: 11.5 }}>Schedule</button>
          </div>
        </div>
      ))}
    </div>
  );
}


/* ===== Learning — lifted from the Sales Executive app, unchanged ===== */
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

function ProductReference({ showToast }) {
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
          style={{ border: "none", outline: "none", flex: 1, fontFamily: F, fontSize: 13,
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
                <span style={{ display: "block", fontFamily: F, fontSize: 14.5, fontWeight: 800, color: C.ink }}>
                  {m.model}
                </span>
                <span style={{ display: "block", fontFamily: F, fontSize: 11.5, color: C.sub, marginTop: 2 }}>
                  {m.segment} · {m.price}
                </span>
              </span>
              <span style={{ background: C.bg, borderRadius: 999, padding: "3px 9px",
                fontFamily: F, fontSize: 11, fontWeight: 700, color: C.sub, flexShrink: 0 }}>
                {m.rivals.length} rival{m.rivals.length > 1 ? "s" : ""}
              </span>
              <ChevronDown size={15} color={C.faint} style={{ flexShrink: 0,
                transform: open ? "rotate(180deg)" : "none", transition: "transform .18s" }} />
            </button>

            {open && (
              <div style={{ padding: "0 14px 14px" }}>
                <div style={{ background: C.primarySoft, borderRadius: 9, padding: "10px 11px", marginBottom: 11 }}>
                  <span style={{ fontFamily: F, fontSize: 12.5, fontWeight: 700, color: C.primary, lineHeight: 1.45 }}>
                    {m.pitch}
                  </span>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 13 }}>
                  {m.specs.map(s => (
                    <span key={s} style={{ background: C.bg, borderRadius: 7, padding: "5px 9px",
                      fontFamily: F, fontSize: 11.5, color: C.sub }}>{s}</span>
                  ))}
                </div>

                <div style={{ fontFamily: F, fontSize: 11, fontWeight: 800, color: C.faint,
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
                        <span style={{ flex: 1, fontFamily: F, fontSize: 13, fontWeight: 700, color: C.ink }}>
                          vs {r.name}
                        </span>
                        <ChevronDown size={13} color={C.faint} style={{ flexShrink: 0,
                          transform: ro ? "rotate(180deg)" : "none", transition: "transform .18s" }} />
                      </button>
                      {ro && (
                        <div style={{ padding: "0 12px 12px" }}>
                          <div style={{ fontFamily: F, fontSize: 12.5, fontWeight: 700, color: C.ink,
                            lineHeight: 1.45, marginBottom: 10 }}>{r.headline}</div>
                          {r.wins.map(w => (
                            <div key={w} style={{ display: "flex", gap: 7, marginBottom: 6 }}>
                              <CheckCircle2 size={13} color={C.green} style={{ flexShrink: 0, marginTop: 1 }} />
                              <span style={{ fontFamily: F, fontSize: 12.5, color: C.sub, lineHeight: 1.45 }}>{w}</span>
                            </div>
                          ))}
                          {/* The honest half. A card that only lists wins gets a rep caught out. */}
                          <div style={{ display: "flex", gap: 7, background: C.warmSoft, borderRadius: 8,
                            padding: "9px 10px", marginTop: 9 }}>
                            <AlertTriangle size={13} color={C.warm} style={{ flexShrink: 0, marginTop: 1 }} />
                            <span style={{ fontFamily: F, fontSize: 12, color: C.warm, lineHeight: 1.5 }}>
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
                    <div style={{ fontFamily: F, fontSize: 11, fontWeight: 800, color: C.faint,
                      textTransform: "uppercase", letterSpacing: 0.5, margin: "13px 0 8px" }}>Supporting reads</div>
                    {m.articles.map(a => (
                      <button key={a.title} onClick={() => showToast(`Opening "${a.title}"`)} style={{
                        display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "10px 11px",
                        background: C.bg, border: "none", borderRadius: 9, marginBottom: 6,
                        cursor: "pointer", textAlign: "left",
                      }}>
                        <FileText size={14} color={C.cold} style={{ flexShrink: 0 }} />
                        <span style={{ flex: 1, fontFamily: F, fontSize: 12.5, color: C.ink }}>{a.title}</span>
                        <span style={{ fontFamily: F, fontSize: 11.5, color: C.sub }}>{a.mins} min</span>
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
          padding: 22, textAlign: "center", fontFamily: F, fontSize: 13, color: C.sub }}>
          Nothing matches "{q}".
        </div>
      )}
    </div>
  );
}

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



function LearningScreen({ assigned = [], showToast }) {
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
              fontFamily: F, fontWeight: 800, fontSize: 13,
            }}>{l}</button>
          );
        })}
      </div>

      {view === "product" && <ProductReference showToast={showToast} />}

      {view === "skills" && (<>
      {/* ---- Hours. One number, one bar. The format split lives inside the tabs below. ---- */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14,
        padding: "13px 15px", marginBottom: 12, display: "flex", alignItems: "center", gap: 14 }}>
        <div>
          <div style={{ fontFamily: F, fontSize: 10, fontWeight: 800, color: C.faint,
            textTransform: "uppercase", letterSpacing: 0.6 }}>Learning time · this month</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 7, marginTop: 4 }}>
            <span style={{ fontFamily: F, fontSize: 24.5, fontWeight: 900, color: C.ink,
              letterSpacing: -0.8, lineHeight: 1 }}>{fmtH(totalMins)}</span>
            <span style={{ fontFamily: F, fontSize: 11.5, color: C.sub }}>of {fmtH(goalMins)}</span>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ height: 5, background: C.bg, borderRadius: 999, overflow: "hidden" }}>
            <div style={{ width: `${Math.min(100, (totalMins / goalMins) * 100)}%`, height: "100%",
              background: C.primary, borderRadius: 999 }} />
          </div>
          <div style={{ fontFamily: F, fontSize: 10.5, color: C.faint, marginTop: 5, textAlign: "right" }}>
            {done.length} completed
          </div>
        </div>
      </div>

      {assignedItems.length > 0 && (
        <div style={{ background: C.primarySoft, border: `1px solid ${C.primary}33`, borderRadius: 12,
          padding: 12, marginBottom: 12 }}>
          <div style={{ fontFamily: F, fontSize: 11, fontWeight: 800, color: C.primary,
            textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Picked out for you</div>
          {assignedItems.map(m => (
            <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 5 }}>
              <span style={{ flex: 1, fontFamily: F, fontSize: 13, fontWeight: 700, color: C.ink }}>{m.title}</span>
              <span style={{ fontFamily: F, fontSize: 11.5, color: C.sub }}>{m.mins} min</span>
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
              <span style={{ fontFamily: F, fontSize: 11, fontWeight: 700, color: on ? c.color : C.sub }}>
                {c.label}
              </span>
              <span style={{ fontFamily: F, fontSize: 10, color: on ? c.color : C.faint, opacity: .8 }}>{n}</span>
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
                  <span style={{ fontFamily: F, fontSize: 11.5, fontWeight: 700, color: C.sub }}>{m.mins} min</span>
                  <span style={{ fontFamily: F, fontSize: 11.5, color: C.faint }}>·</span>
                  <span style={{ fontFamily: F, fontSize: 11.5, color: C.sub }}>{m.topic}</span>
                  {m.tag && (
                    <span style={{ background: C.warmSoft, color: C.warm, borderRadius: 5, padding: "1px 6px",
                      fontFamily: F, fontSize: 9.5, fontWeight: 800 }}>{m.tag}</span>
                  )}
                </span>
                <span style={{ display: "block", fontFamily: F, fontSize: 14, fontWeight: 700,
                  color: isDone ? C.sub : C.ink, lineHeight: 1.3,
                  textDecoration: isDone ? "line-through" : "none" }}>{m.title}</span>
                <span style={{ display: "block", fontFamily: F, fontSize: 11.5, color: C.faint, marginTop: 3 }}>
                  {m.by}
                </span>
              </span>
              {isDone && <CheckCircle2 size={17} color={C.green} style={{ flexShrink: 0 }} />}
              <ChevronDown size={15} color={C.faint} style={{ flexShrink: 0,
                transform: open ? "rotate(180deg)" : "none", transition: "transform .18s" }} />
            </button>

            {open && (
              <div style={{ padding: "0 13px 13px" }}>
                <div style={{ fontFamily: F, fontSize: 12.5, color: C.sub, lineHeight: 1.55, marginBottom: 11 }}>
                  {m.blurb}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setDone(d => isDone ? d.filter(x => x !== m.id) : [...d, m.id])}
                    style={{ padding: "9px 14px", borderRadius: 9, cursor: "pointer",
                      border: `1.5px solid ${C.borderStrong}`, background: C.card, color: C.sub,
                      fontFamily: F, fontWeight: 700, fontSize: 12.5 }}>
                    {isDone ? "Undo" : "Mark done"}
                  </button>
                  <button onClick={() => { if (!isDone) setDone(d => [...d, m.id]); showToast(`${meta.verb}ing "${m.title}"`); }}
                    style={{ flex: 1, padding: "9px 0", borderRadius: 9, cursor: "pointer",
                    border: "none", background: meta.color, color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    fontFamily: F, fontWeight: 800, fontSize: 12.5 }}>
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



/* Defined at module level on purpose. A component created inside a render function is a
   NEW type every render, so React unmounts and remounts it — which resets scroll position
   and wipes any local state. That was the transfer screen jumping to the top on every tap. */
const PickChip = ({ on, label, sub, onClick, muted }) => (
  <button onClick={onClick} disabled={muted} style={{
    display: "flex", flexDirection: "column", alignItems: "flex-start", padding: "8px 10px",
    borderRadius: 9, cursor: muted ? "default" : "pointer", textAlign: "left", minWidth: 0,
    border: `1.5px solid ${on ? C.primary : C.border}`, background: on ? C.primarySoft : C.card,
    opacity: muted ? 0.4 : 1,
  }}>
    <span style={{ fontFamily: F, fontSize: 12.5, fontWeight: 700, color: on ? C.primary : C.ink }}>{label}</span>
    {sub && <span style={{ fontFamily: F, fontSize: 10, color: C.faint, marginTop: 1 }}>{sub}</span>}
  </button>
);
const StepSection = ({ n, title, children, hint }) => (
  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 13, marginBottom: 10 }}>
    <div style={{ display: "flex", alignItems: "baseline", gap: 7, marginBottom: hint ? 2 : 9 }}>
      <span style={{ width: 18, height: 18, borderRadius: "50%", background: C.ink, color: "#fff",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        fontFamily: F, fontSize: 10.5, fontWeight: 800, flexShrink: 0 }}>{n}</span>
      <span style={{ fontFamily: F, fontSize: 13, fontWeight: 800, color: C.ink }}>{title}</span>
    </div>
    {hint && <div style={{ fontFamily: F, fontSize: 11, color: C.faint, marginBottom: 9, lineHeight: 1.4 }}>{hint}</div>}
    {children}
  </div>
);
const InfoCard = ({ title, children }) => (
  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14,
    padding: "12px 14px", marginBottom: 10 }}>
    <div style={{ fontFamily: F, fontSize: 10.5, fontWeight: 800, color: C.faint,
      textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>{title}</div>
    {children}
  </div>
);
const InfoRow = ({ k, v }) => (
  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "8px 0",
    borderBottom: `1px solid ${C.border}` }}>
    <span style={{ fontFamily: F, fontSize: 12, color: C.faint }}>{k}</span>
    <span style={{ fontFamily: F, fontSize: 12.5, fontWeight: 600, color: C.ink, textAlign: "right" }}>{v}</span>
  </div>
);
const TagChip = ({ label, on }) => (
  <span style={{ padding: "4px 9px", borderRadius: 6, fontFamily: F, fontSize: 11, fontWeight: 700,
    background: on ? C.primarySoft : C.bg, color: on ? C.primary : C.faint,
    border: `1px solid ${on ? C.primary : C.border}` }}>{label}</span>
);

/* ============================ TRANSFER LEADS ============================
   Three real cases a manager hits:
     1. A rep leaves or goes on leave — move EVERYTHING they hold to someone else.
     2. A rep is overloaded on one model or stage — move a FILTERED slice.
     3. Rebalancing across the floor — pull from several reps, spread across several.
   One screen handles all three: pick sources, filter, pick targets, distribute. */
const DISTRIBUTE = [
  { key: "equal", label: "Split equally" },
  { key: "single", label: "All to one" },
];

function TransferScreen({ showToast, onTransferred, transfers }) {
  const ses = flatten(ORG);
  const [from, setFrom] = useState(new Set());
  const [to, setTo] = useState(new Set());
  const [stage, setStage] = useState("all");
  const [model, setModel] = useState("all");
  const [minDays, setMinDays] = useState(0);
  const [picked, setPicked] = useState(new Set());   // individual leads, on top of filters
  const [mode, setMode] = useState("equal");
  const [note, setNote] = useState("");
  const [step, setStep] = useState(1);              // 1 pick & filter · 2 confirm

  const toggleIn = (setter) => (id) => setter(s => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const toggleFrom = toggleIn(setFrom), toggleTo = toggleIn(setTo), togglePick = toggleIn(setPicked);

  // Leads owned by the chosen sources, narrowed by the filters — this is the candidate set.
  const owned = (transfers || {});
  const currentOwner = (l) => owned[l.id] || l.ownerId;
  const pool = LEADS.filter(l => from.has(currentOwner(l)))
    .filter(l => stage === "all" || l.stage === stage)
    .filter(l => model === "all" || l.model.startsWith(model))
    .filter(l => l.days >= minDays);
  const selected = picked.size ? pool.filter(l => picked.has(l.id)) : pool;
  const targets = ses.filter(s2 => to.has(s2.id) && !from.has(s2.id));
  const stages = ["all", ...STAGES];
  const models = ["all", ...Array.from(new Set(LEADS.map(l => l.model.split(" ")[0])))];

  // Preview of who gets what, before anything moves.
  const plan = (() => {
    if (!targets.length || !selected.length) return [];
    if (mode === "single") return [{ target: targets[0], leads: selected }];
    const buckets = targets.map(t2 => ({ target: t2, leads: [] }));
    selected.forEach((l, i) => buckets[i % buckets.length].leads.push(l));
    return buckets;
  })();

  const commit = () => {
    const moves = {};
    plan.forEach(b2 => b2.leads.forEach(l => { moves[l.id] = b2.target.id; }));
    onTransferred(moves, note.trim());
    const n = selected.length, who = targets.map(t2 => t2.name.split(" ")[0]).join(", ");
    showToast(`${n} ${n === 1 ? "lead" : "leads"} moved to ${who}. Reps notified.`);
    setFrom(new Set()); setTo(new Set()); setPicked(new Set()); setNote(""); setStep(1);
  };

  const selStyle = { width: "100%", boxSizing: "border-box", border: `1.5px solid ${C.borderStrong}`,
    borderRadius: 8, padding: "8px 9px", fontFamily: F, fontSize: 12.5, color: C.ink, background: C.card };

  if (step === 2) {
    return (
      <div style={{ padding: "14px 14px 90px" }}>
        <button onClick={() => setStep(1)} style={{ display: "flex", alignItems: "center", gap: 5, background: "none",
          border: "none", cursor: "pointer", padding: "0 0 12px", fontFamily: F, fontSize: 12.5, fontWeight: 700,
          color: C.primary }}><ChevronLeft size={14} />Back</button>
        <div style={{ fontFamily: F, fontWeight: 800, fontSize: 15.5, color: C.ink }}>Confirm transfer</div>
        <div style={{ fontFamily: F, fontSize: 11.5, color: C.sub, marginTop: 1, marginBottom: 13 }}>
          {selected.length} {selected.length === 1 ? "lead" : "leads"} from {[...from].map(id => ses.find(s2 => s2.id === id).name.split(" ")[0]).join(", ")}.
          Ownership and retail credit move with the lead.
        </div>
        {plan.map(b2 => (
          <div key={b2.target.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12,
            padding: 12, marginBottom: 9 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Avatar r={b2.target} size={26} />
              <span style={{ flex: 1, fontFamily: F, fontSize: 13, fontWeight: 700, color: C.ink }}>{b2.target.name}</span>
              <span style={{ fontFamily: F, fontSize: 11.5, color: C.sub }}>+{b2.leads.length}</span>
            </div>
            {b2.leads.map(l => (
              <div key={l.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0",
                borderTop: `1px solid ${C.border}`, fontFamily: F, fontSize: 12 }}>
                <span style={{ color: C.ink }}>{l.name} <span style={{ color: C.faint }}>· {l.model}</span></span>
                <span style={{ color: C.sub }}>{l.stage}</span>
              </div>
            ))}
          </div>
        ))}
        <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
          placeholder="Reason — goes to both reps (optional)"
          style={{ width: "100%", boxSizing: "border-box", border: `1.5px solid ${C.borderStrong}`, borderRadius: 9,
            padding: "8px 10px", fontFamily: F, fontSize: 12, color: C.ink, background: C.card, outline: "none",
            resize: "none", marginBottom: 10 }} />
        <button onClick={commit} style={{ width: "100%", padding: "14px 0", borderRadius: 11, border: "none",
          background: C.primary, color: "#fff", fontFamily: F, fontWeight: 800, fontSize: 13, cursor: "pointer" }}>
          Move {selected.length} {selected.length === 1 ? "lead" : "leads"}
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "14px 14px 90px" }}>
      <div style={{ fontFamily: F, fontWeight: 800, fontSize: 15.5, color: C.ink }}>Transfer Leads</div>
      <div style={{ fontFamily: F, fontSize: 11.5, color: C.sub, marginTop: 1, marginBottom: 13 }}>
        Move some or all of a rep's leads.
      </div>

      <StepSection n={1} title="From" hint="Pick one or more reps. Their leads become the pool.">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          {ses.map(s2 => {
            const n = LEADS.filter(l => currentOwner(l) === s2.id).length;
            return <PickChip key={s2.id} on={from.has(s2.id)} label={s2.name.split(" ")[0]} sub={`${n} leads`}
              onClick={() => { toggleFrom(s2.id); setPicked(new Set()); }} />;
          })}
        </div>
      </StepSection>

      {from.size > 0 && (
        <StepSection n={2} title="Which leads" hint="Leave filters open to move everything, or narrow it down. Tap individual leads to hand-pick.">
          <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
            <select value={stage} onChange={e => { setStage(e.target.value); setPicked(new Set()); }} style={selStyle}>
              {stages.map(s2 => <option key={s2} value={s2}>{s2 === "all" ? "Any stage" : s2}</option>)}
            </select>
            <select value={model} onChange={e => { setModel(e.target.value); setPicked(new Set()); }} style={selStyle}>
              {models.map(m => <option key={m} value={m}>{m === "all" ? "Any model" : m}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <span style={{ fontFamily: F, fontSize: 11.5, color: C.sub, whiteSpace: "nowrap" }}>Stuck at least</span>
            <select value={minDays} onChange={e => { setMinDays(+e.target.value); setPicked(new Set()); }} style={{ ...selStyle, width: "auto" }}>
              {[0, 3, 7, 14].map(d => <option key={d} value={d}>{d === 0 ? "any time" : `${d} days`}</option>)}
            </select>
            <span style={{ flex: 1, textAlign: "right", fontFamily: F, fontSize: 12, fontWeight: 700, color: C.ink }}>
              {picked.size ? `${picked.size} of ${pool.length} picked` : `${pool.length} match`}
            </span>
          </div>
          <div style={{ maxHeight: 220, overflowY: "auto", border: `1px solid ${C.border}`, borderRadius: 9 }}>
            {pool.length === 0 && <div style={{ padding: 14, textAlign: "center", fontFamily: F, fontSize: 12, color: C.faint }}>No leads match.</div>}
            {pool.map(l => {
              const on = picked.size === 0 || picked.has(l.id);
              return (
                <div key={l.id} onClick={() => togglePick(l.id)} style={{ display: "flex", alignItems: "center", gap: 9,
                  padding: "8px 10px", borderBottom: `1px solid ${C.border}`, cursor: "pointer",
                  background: picked.has(l.id) ? C.primarySoft : "none" }}>
                  <span style={{ width: 15, height: 15, borderRadius: 4, flexShrink: 0,
                    border: `1.5px solid ${on ? C.primary : C.borderStrong}`, background: on ? C.primary : C.card,
                    display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {on && <Check size={10} color="#fff" />}
                  </span>
                  <span style={{ flex: 1, minWidth: 0, fontFamily: F, fontSize: 12, color: C.ink,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {l.name} <span style={{ color: C.faint }}>· {l.model}</span>
                  </span>
                  <span style={{ fontFamily: F, fontSize: 10.5, color: C.sub, whiteSpace: "nowrap" }}>{l.stage} · {l.days}d</span>
                </div>
              );
            })}
          </div>
        </StepSection>
      )}

      {from.size > 0 && selected.length > 0 && (
        <StepSection n={3} title="To" hint="One or more reps. Pick several and choose how to split.">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: targets.length > 1 ? 10 : 0 }}>
            {ses.map(s2 => {
              const n = LEADS.filter(l => currentOwner(l) === s2.id).length;
              return <PickChip key={s2.id} on={to.has(s2.id)} label={s2.name.split(" ")[0]} sub={`${n} now`}
                muted={from.has(s2.id)} onClick={() => toggleTo(s2.id)} />;
            })}
          </div>
          {targets.length > 1 && (
            <div style={{ display: "flex", gap: 6 }}>
              {DISTRIBUTE.map(d => (
                <button key={d.key} onClick={() => setMode(d.key)} style={{ flex: 1, padding: "8px 0", borderRadius: 8,
                  cursor: "pointer", border: `1.5px solid ${mode === d.key ? C.primary : C.border}`,
                  background: mode === d.key ? C.primarySoft : C.card, color: mode === d.key ? C.primary : C.sub,
                  fontFamily: F, fontWeight: 700, fontSize: 11.5 }}>{d.label}</button>
              ))}
            </div>
          )}
        </StepSection>
      )}

      {targets.length > 0 && selected.length > 0 && (
        <button onClick={() => setStep(2)} style={{ width: "100%", padding: "14px 0", borderRadius: 11, border: "none",
          background: C.primary, color: "#fff", fontFamily: F, fontWeight: 800, fontSize: 13, cursor: "pointer" }}>
          Review {selected.length} {selected.length === 1 ? "lead" : "leads"} → {targets.map(t2 => t2.name.split(" ")[0]).join(", ")}
        </button>
      )}
    </div>
  );
}


/* ============================ TEAM MEMBERS ============================ */
function TeamMembersScreen({ showToast }) {
  const [editing, setEditing] = useState(null);   // null · "new" · a node
  const [form, setForm] = useState({ name: "", role: "Sales Executive", reportsTo: "", branch: "Indiranagar", target: 8 });
  const all = [];
  const walk = (n, parent) => { all.push({ ...n, parentName: parent }); (n.reports || []).forEach(c => walk(c, n.name)); };
  walk(ORG, null);
  const leaders = all.filter(n => n.role !== "Sales Executive");
  const roleTone = { "Sales Manager": C.ink, "Team Leader": C.teal, "Sales Executive": C.sub };
  const open = (n) => {
    if (n === "new") { setForm({ name: "", role: "Sales Executive", reportsTo: leaders[0]?.name || "", branch: "Indiranagar", target: 8 }); }
    else setForm({ name: n.name, role: n.role, reportsTo: n.parentName || "", branch: "Indiranagar", target: n.target || roll(n).target });
    setEditing(n);
  };
  const save = () => {
    if (!form.name.trim()) return;
    showToast(editing === "new" ? `${form.name} added as ${form.role}` : `${form.name} updated`);
    setEditing(null);
  };
  const field = { width: "100%", boxSizing: "border-box", border: `1.5px solid ${C.borderStrong}`, borderRadius: 9,
    padding: "9px 10px", fontFamily: F, fontSize: 13, color: C.ink, background: C.card, outline: "none" };
  const label = { display: "block", fontFamily: F, fontSize: 10.5, fontWeight: 800, color: C.faint,
    textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4, marginTop: 10 };

  if (editing) {
    return (
      <div style={{ padding: "14px 14px 90px" }}>
        <button onClick={() => setEditing(null)} style={{ display: "flex", alignItems: "center", gap: 5, background: "none",
          border: "none", cursor: "pointer", padding: "0 0 12px", fontFamily: F, fontSize: 12.5, fontWeight: 700,
          color: C.primary }}><ChevronLeft size={14} />Back</button>
        <div style={{ fontFamily: F, fontWeight: 800, fontSize: 15.5, color: C.ink, marginBottom: 6 }}>
          {editing === "new" ? "Add team member" : `Edit ${editing.name.split(" ")[0]}`}
        </div>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14 }}>
          <span style={{ ...label, marginTop: 0 }}>Full name</span>
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="As on ID" style={field} />
          <span style={label}>Role</span>
          <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} style={field}>
            {["Sales Executive", "Team Leader", "Sales Manager"].map(r => <option key={r}>{r}</option>)}
          </select>
          <span style={label}>Reports to</span>
          <select value={form.reportsTo} onChange={e => setForm({ ...form, reportsTo: e.target.value })} style={field}>
            {leaders.filter(l => l.name !== form.name).map(l => <option key={l.id} value={l.name}>{l.name} · {ROLE_SHORT[l.role]}</option>)}
          </select>
          <span style={label}>Branch</span>
          <select value={form.branch} onChange={e => setForm({ ...form, branch: e.target.value })} style={field}>
            {["Indiranagar", "Whitefield"].map(b2 => <option key={b2}>{b2}</option>)}
          </select>
          <span style={label}>Monthly target (cars)</span>
          <input type="number" min={1} max={15} value={form.target}
            onChange={e => setForm({ ...form, target: +e.target.value })} style={field} />
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            {editing !== "new" && (
              <button onClick={() => { showToast(`${editing.name.split(" ")[0]} deactivated — leads need transferring`); setEditing(null); }}
                style={{ padding: "12px 14px", borderRadius: 10, cursor: "pointer", border: `1.5px solid ${C.borderStrong}`,
                  background: C.card, color: C.sub, fontFamily: F, fontWeight: 700, fontSize: 12.5 }}>Deactivate</button>
            )}
            <button onClick={save} disabled={!form.name.trim()} style={{ flex: 1, padding: "12px 0", borderRadius: 10,
              border: "none", cursor: form.name.trim() ? "pointer" : "default",
              background: form.name.trim() ? C.primary : C.borderStrong, color: "#fff",
              fontFamily: F, fontWeight: 800, fontSize: 13 }}>
              {editing === "new" ? "Create login" : "Save changes"}
            </button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div style={{ padding: "14px 14px 90px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 13 }}>
        <span style={{ flex: 1 }}>
          <span style={{ display: "block", fontFamily: F, fontWeight: 800, fontSize: 15.5, color: C.ink }}>Team members</span>
          <span style={{ display: "block", fontFamily: F, fontSize: 11.5, color: C.sub, marginTop: 1 }}>
            {all.length - 1} people under you. Tap to edit.
          </span>
        </span>
        <button onClick={() => open("new")} style={{ padding: "9px 13px", borderRadius: 9, border: "none",
          background: C.primary, color: "#fff", fontFamily: F, fontWeight: 800, fontSize: 12, cursor: "pointer",
          whiteSpace: "nowrap" }}>+ Add</button>
      </div>
      {all.slice(1).map(n => (
        <button key={n.id} onClick={() => open(n)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%",
          textAlign: "left", background: C.card, border: `1px solid ${C.border}`, borderLeft: `3px solid ${roleTone[n.role]}`,
          borderRadius: 11, padding: "11px 13px", marginBottom: 7, cursor: "pointer" }}>
          <Avatar r={n} size={30} />
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontFamily: F, fontSize: 13, fontWeight: 700, color: C.ink }}>{n.name}</span>
            <span style={{ display: "block", fontFamily: F, fontSize: 11, color: C.faint, marginTop: 1 }}>
              {n.role} · under {n.parentName.split(" ")[0]}
            </span>
          </span>
          <span style={{ fontFamily: F, fontSize: 11.5, color: C.sub }}>target {roll(n).target}</span>
          <ChevronRight size={14} color={C.ghost} />
        </button>
      ))}
    </div>
  );
}

/* ============================ LEADERBOARD ============================ */
function LeaderboardScreen({ onPick }) {
  const rows = flatten(ORG).map(se => ({ se, r: roll(se) })).sort((a, b2) => b2.r.retailed - a.r.retailed);
  const COLS = [["opportunity", "Opp"], ["td", "TD"], ["booking", "Book"], ["retailed", "Retail"]];
  return (
    <div style={{ padding: "14px 14px 90px" }}>
      <div style={{ fontFamily: F, fontWeight: 800, fontSize: 15.5, color: C.ink }}>Leaderboard</div>
      <div style={{ fontFamily: F, fontSize: 11.5, color: C.sub, marginTop: 1, marginBottom: 13 }}>
        Ranked by retails.
      </div>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "12px 10px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: 8, borderBottom: `1.5px solid ${C.borderStrong}` }}>
          <span style={{ width: 22, fontFamily: F, fontSize: 9.5, fontWeight: 800, color: C.sub, paddingLeft: 4 }}>#</span>
          <span style={{ flex: 1, fontFamily: F, fontSize: 9.5, fontWeight: 800, color: C.sub, textTransform: "uppercase" }}>Executive</span>
          {COLS.map(([k, l]) => <span key={k} style={{ width: 46, textAlign: "center", fontFamily: F, fontSize: 9.5,
            fontWeight: 800, color: C.sub, textTransform: "uppercase" }}>{l}</span>)}
        </div>
        {rows.map(({ se, r }, i) => (
          <button key={se.id} onClick={() => onPick(se)} style={{ display: "flex", alignItems: "center", width: "100%",
            padding: "10px 0", borderBottom: i < rows.length - 1 ? `1px solid ${C.border}` : "none",
            background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
            <span style={{ width: 22, paddingLeft: 4, fontFamily: F, fontSize: 11.5, fontWeight: 700, color: C.faint }}>{i + 1}</span>
            <span style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 7 }}>
              <Avatar r={se} size={26} />
              <span style={{ fontFamily: F, fontSize: 12.5, fontWeight: 700, color: C.ink, overflow: "hidden",
                textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{se.name.split(" ")[0]}</span>
            </span>
            {COLS.map(([k]) => (
              <span key={k} style={{ width: 46, textAlign: "center" }}>
                <span style={{ display: "block", fontFamily: F, fontSize: 12.5, fontWeight: 600, color: C.ink, lineHeight: 1 }}>{r[k]}</span>
                {k !== "opportunity" && <span style={{ display: "block", fontFamily: F, fontSize: 10, color: C.faint, marginTop: 2 }}>
                  {pct(r[k], r.opportunity)}%</span>}
              </span>
            ))}
          </button>
        ))}
      </div>
    </div>
  );
}


/* ============================ TEAM STRUCTURE ============================
   One way to move people: pick who, pick where, confirm. No drag-and-drop — two fields is
   the pattern that never fails on a phone. The tree below is a read-only reference; tapping
   a name there drops it into "Move". */

const idsUnder = (n, out = new Set()) => { out.add(n.id); (n.reports || []).forEach(c => idsUnder(c, out)); return out; };
const findNode = (n, id) => n.id === id ? n : (n.reports || []).map(c => findNode(c, id)).find(Boolean) || null;
const parentOf = (root, id) => {
  let found = null;
  const walk = (n) => { (n.reports || []).forEach(c => { if (c.id === id) found = n; walk(c); }); };
  walk(root); return found;
};
const loadOf = (n) => n.role === "Sales Executive"
  ? LEADS.filter(l => l.ownerId === n.id).length
  : flatten(n).reduce((s2, se) => s2 + LEADS.filter(l => l.ownerId === se.id).length, 0);
const seCount = (n) => n.role === "Sales Executive" ? 0 : flatten(n).length;
// Who a role can report to. An SE reports to a TL, a TL to an SM, an SM to an SM or the CEO.
const CAN_REPORT_TO = { "Sales Executive": ["Team Leader"], "Team Leader": ["Sales Manager"],
  "Sales Manager": ["Sales Manager", "CEO"] };
const CEO_NODE = { id: -1, name: "Dealer Principal", role: "CEO", initials: "DP", reports: [] };

function TeamStructureScreen({ showToast, org, onMove, history, onRecord, onReverse }) {
  const [histOpen, setHistOpen] = useState(false);
  const [reverseAsk, setReverseAsk] = useState(null);   // { entry, dependents }
  const [branchF, setBranchF] = useState("all");
  const [who, setWho] = useState([]);            // people being moved
  const [to, setTo] = useState(null);            // destination leader
  const [qWho, setQWho] = useState("");
  const [qTo, setQTo] = useState("");
  const [whoOpen, setWhoOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [undo, setUndo] = useState(null);
  const [q, setQ] = useState("");
  const [roleF, setRoleF] = useState("all");
  const [loadF, setLoadF] = useState("all");
  const undoTimer = React.useRef(null);

  const everyone = [];
  const walkAll = (n, parent, depth) => { everyone.push({ node: n, parent, depth }); (n.reports || []).forEach(c => walkAll(c, n, depth + 1)); };
  walkAll(org, null, 0);
  const ses = everyone.filter(e => e.node.role === "Sales Executive");
  const avgLoad = ses.length ? ses.reduce((s2, e) => s2 + loadOf(e.node), 0) / ses.length : 0;
  const loadTag = (n) => {
    if (n.role !== "Sales Executive") return null;
    const l = loadOf(n);
    return l > avgLoad * 1.3 ? "high load" : l < avgLoad * 0.7 ? "light load" : null;
  };

  // ---- Who can be moved, and where ----
  const movable = everyone.filter(e => e.node.id !== org.id && !who.some(w => w.node.id === e.node.id));
  const whoHits = qWho.trim()
    ? movable.filter(e => e.node.name.toLowerCase().includes(qWho.trim().toLowerCase())).slice(0, 6)
    : [];
  // Every selected person must share a role — you can't move an SE and a TL to the same leader.
  const moveRole = who.length ? who[0].node.role : null;
  const roleMismatch = who.some(w => w.node.role !== moveRole);
  const blocked = new Set(); who.forEach(w => idsUnder(w.node, blocked));
  const sameParent = who.length && who.every(w => (w.parent || {}).id === (who[0].parent || {}).id) ? (who[0].parent || {}).id : null;
  const targets = !moveRole || roleMismatch ? [] : [
    ...everyone.filter(e => CAN_REPORT_TO[moveRole].includes(e.node.role) && !blocked.has(e.node.id) && e.node.id !== sameParent),
    ...(CAN_REPORT_TO[moveRole].includes("CEO") ? [{ node: CEO_NODE, parent: null, depth: -1 }] : []),
  ];
  const toHits = qTo.trim() ? targets.filter(e => e.node.name.toLowerCase().includes(qTo.trim().toLowerCase())) : targets;

  const addWho = (e) => { setWho(w => [...w, e]); setQWho(""); setWhoOpen(false); setTo(null); };
  const removeWho = (id) => { setWho(w => w.filter(x => x.node.id !== id)); setTo(null); };
  const reset = () => { setWho([]); setTo(null); setQWho(""); setQTo(""); setConfirm(false); };

  const doMove = () => {
    const moves = who.map(w => ({ id: w.node.id, from: (w.parent || {}).id }));
    if (to.node.id !== CEO_NODE.id) who.forEach(w => onMove(w.node.id, to.node.id));
    const names = who.map(w => w.node.name.split(" ")[0]);
    const label = `${names.length === 1 ? names[0] : names.length + " people"} → ${to.node.name.split(" ")[0]}`;
    onRecord({ label, people: who.map(w => ({ id: w.node.id, name: w.node.name, from: (w.parent || {}).id, fromName: (w.parent || {}).name })),
      to: to.node.id, toName: to.node.name });
    clearTimeout(undoTimer.current);
    setUndo({ moves, label });
    undoTimer.current = setTimeout(() => setUndo(null), 6000);
    if (to.node.id === CEO_NODE.id) showToast(`${names.join(", ")} now report to the Dealer Principal — outside this tree`);
    reset();
  };
  const undoMove = () => { if (!undo) return; undo.moves.forEach(m => m.from && onMove(m.id, m.from)); setUndo(null); showToast("Move undone"); };

  // Before → after, per leader touched.
  const impact = (() => {
    if (!to) return [];
    const moving = who.reduce((s2, w) => s2 + loadOf(w.node), 0);
    const movingHeads = who.reduce((s2, w) => s2 + (w.node.role === "Sales Executive" ? 1 : seCount(w.node)), 0);
    const out = [];
    if (to.node.id !== CEO_NODE.id)
      out.push({ n: to.node, dir: "+", se: seCount(to.node), seAfter: seCount(to.node) + movingHeads, ld: loadOf(to.node), ldAfter: loadOf(to.node) + moving });
    Array.from(new Set(who.map(w => w.parent).filter(Boolean))).forEach(p2 => {
      const leaving = who.filter(w => (w.parent || {}).id === p2.id);
      const h = leaving.reduce((s2, w) => s2 + (w.node.role === "Sales Executive" ? 1 : seCount(w.node)), 0);
      const l = leaving.reduce((s2, w) => s2 + loadOf(w.node), 0);
      out.push({ n: p2, dir: "-", se: seCount(p2), seAfter: seCount(p2) - h, ld: loadOf(p2), ldAfter: loadOf(p2) - l });
    });
    return out;
  })();

  // ---- Reference tree ----
  const filtering = q.trim() || roleF !== "all" || loadF !== "all" || branchF !== "all";
  const matches = (n) => (!q.trim() || n.name.toLowerCase().includes(q.trim().toLowerCase()))
    && (roleF === "all" || ROLE_SHORT[n.role] === roleF) && (loadF === "all" || loadTag(n) === loadF)
    && (branchF === "all" || n.branch === branchF || n.branch === "All branches");
  const visible = (filtering || branchF !== "all") ? everyone.filter(e => e.node.id !== org.id && matches(e.node)) : everyone;
  const branches = Array.from(new Set(everyone.map(e => e.node.branch).filter(b2 => b2 && b2 !== "All branches")));

  const inp = { width: "100%", boxSizing: "border-box", border: `1.5px solid ${C.border}`, borderRadius: 9,
    padding: "9px 10px", fontFamily: F, fontSize: 12.5, color: C.ink, background: C.card, outline: "none" };
  const label = { fontFamily: F, fontSize: 10, fontWeight: 800, color: C.faint, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 5 };
  const menu = { position: "absolute", left: 0, right: 0, top: "100%", zIndex: 50, background: C.card,
    border: `1px solid ${C.border}`, borderRadius: 9, boxShadow: shadow, overflow: "hidden", marginTop: 3, maxHeight: 220, overflowY: "auto" };
  const Person = ({ e, onPick, sub }) => (
    <button type="button" onClick={() => onPick(e)} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%",
      padding: "9px 10px", background: "none", border: "none", borderBottom: `1px solid ${C.border}`, cursor: "pointer", textAlign: "left" }}>
      <Avatar r={e.node} size={22} />
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontFamily: F, fontSize: 12.5, fontWeight: 600, color: C.ink }}>{e.node.name}</span>
        <span style={{ display: "block", fontFamily: F, fontSize: 10.5, color: C.faint }}>{sub(e)}</span>
      </span>
    </button>
  );
  const chip = (e) => (
    <span key={e.node.id} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: C.primarySoft,
      border: `1.5px solid ${C.primary}`, borderRadius: 999, padding: "3px 6px 3px 4px", fontFamily: F, fontSize: 12, fontWeight: 700, color: C.ink }}>
      <Avatar r={e.node} size={18} />{e.node.name.split(" ")[0]}
      <button type="button" onClick={() => removeWho(e.node.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
        <X size={12} color={C.sub} /></button>
    </span>
  );

  return (
    <div style={{ padding: "14px 14px 90px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <span style={{ flex: 1 }}>
          <span style={{ display: "block", fontFamily: F, fontWeight: 800, fontSize: 15.5, color: C.ink }}>Team structure</span>
          <span style={{ display: "block", fontFamily: F, fontSize: 11.5, color: C.sub, marginTop: 1, marginBottom: 12, lineHeight: 1.45 }}>
            Pick who to move, then where.
          </span>
        </span>
        <button type="button" onClick={() => setHistOpen(true)} aria-label="History" style={{
          position: "relative", width: 36, height: 36, borderRadius: 10, border: `1.5px solid ${C.border}`,
          background: C.card, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <History size={16} color={C.sub} />
          {history.length > 0 && <span style={{ position: "absolute", top: -5, right: -5, minWidth: 16, height: 16, borderRadius: 8,
            background: C.ink, color: "#fff", fontFamily: F, fontSize: 9.5, fontWeight: 800, display: "flex", alignItems: "center",
            justifyContent: "center", padding: "0 4px" }}>{history.length}</span>}
        </button>
      </div>

      {/* ---- MOVE ---- */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 13, padding: 12, marginBottom: 12 }}>
        <div style={label}>Move</div>
        <div style={{ position: "relative" }}>
          <div onClick={() => setWhoOpen(true)} style={{ ...inp, display: "flex", flexWrap: "wrap", gap: 5, alignItems: "center",
            minHeight: 40, padding: "6px 8px", cursor: "text", borderColor: whoOpen ? C.primary : C.border }}>
            {who.map(chip)}
            <input value={qWho} onChange={e => { setQWho(e.target.value); setWhoOpen(true); }} onFocus={() => setWhoOpen(true)}
              onBlur={() => setTimeout(() => setWhoOpen(false), 150)}
              placeholder={who.length ? "Add another…" : "Search a person"}
              style={{ flex: 1, minWidth: 90, border: "none", outline: "none", fontFamily: F, fontSize: 12.5, color: C.ink, background: "none", padding: "3px 2px" }} />
          </div>
          {whoOpen && whoHits.length > 0 && (
            <div style={menu}>{whoHits.map(e => <Person key={e.node.id} e={e} onPick={addWho}
              sub={(x) => `${ROLE_SHORT[x.node.role]}${x.parent ? ` · under ${x.parent.name.split(" ")[0]}` : ""} · ${loadOf(x.node)} leads`} />)}</div>
          )}
        </div>
        {roleMismatch && (
          <div style={{ fontFamily: F, fontSize: 11, color: C.sub, marginTop: 6, lineHeight: 1.4 }}>
            Everyone moved must share one role.
          </div>
        )}

        {/* ---- TO ---- */}
        <div style={{ ...label, marginTop: 12 }}>
          To{moveRole && !roleMismatch ? ` · ${CAN_REPORT_TO[moveRole].map(r => r === "CEO" ? "CEO" : ROLE_SHORT[r]).join(" or ")} only` : ""}
        </div>
        {to ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, border: `1.5px solid ${C.primary}`, borderRadius: 9,
            padding: "7px 9px", background: C.primarySoft }}>
            <Avatar r={to.node} size={22} />
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", fontFamily: F, fontSize: 12.5, fontWeight: 700, color: C.ink }}>{to.node.name}</span>
              <span style={{ display: "block", fontFamily: F, fontSize: 10.5, color: C.faint }}>
                {to.node.id === CEO_NODE.id ? "Outside this tree" : `${seCount(to.node)} SE · ${loadOf(to.node)} leads today`}</span>
            </span>
            <button type="button" onClick={() => setTo(null)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex" }}>
              <X size={13} color={C.sub} /></button>
          </div>
        ) : (
          <>
            <input value={qTo} onChange={e => setQTo(e.target.value)} disabled={!who.length || roleMismatch}
              placeholder={!who.length ? "Pick who to move first" : targets.length > 4 ? "Narrow the list" : "Pick from the list"}
              style={{ ...inp, opacity: who.length && !roleMismatch ? 1 : 0.5 }} />
            {/* The eligible list is short, so it is always visible — searching only narrows it. */}
            {who.length > 0 && !roleMismatch && (
              <div style={{ border: `1px solid ${C.border}`, borderRadius: 9, marginTop: 6, overflow: "hidden" }}>
                {toHits.length === 0
                  ? <div style={{ padding: 12, fontFamily: F, fontSize: 12, color: C.faint, textAlign: "center" }}>No eligible leader.</div>
                  : toHits.map(e => <Person key={e.node.id} e={e} onPick={(x) => { setTo(x); setQTo(""); }}
                      sub={(x) => x.node.id === CEO_NODE.id ? "Outside this tree"
                        : `${ROLE_SHORT[x.node.role]} · ${seCount(x.node)} SE · ${loadOf(x.node)} leads`} />)}
              </div>
            )}
          </>
        )}

        {/* ---- Impact + action ---- */}
        {to && impact.length > 0 && (
          <div style={{ background: C.bg, borderRadius: 9, padding: "9px 11px", marginTop: 12 }}>
            {impact.map(i => (
              <div key={i.n.id} style={{ display: "flex", justifyContent: "space-between", fontFamily: F, fontSize: 11.5, padding: "3px 0" }}>
                <span style={{ color: C.ink, fontWeight: 600 }}>{i.n.name.split(" ")[0]}</span>
                <span style={{ color: C.sub }}>{i.se} → <strong style={{ color: C.ink }}>{i.seAfter}</strong> SE · {i.ld} → <strong style={{ color: C.ink }}>{i.ldAfter}</strong> leads</span>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          {(who.length > 0 || to) && (
            <button type="button" onClick={reset} style={{ padding: "11px 14px", borderRadius: 9, cursor: "pointer",
              border: `1.5px solid ${C.borderStrong}`, background: C.card, color: C.sub, fontFamily: F, fontWeight: 700, fontSize: 12.5 }}>Clear</button>
          )}
          <button type="button" disabled={!who.length || !to} onClick={() => setConfirm(true)}
            style={{ flex: 1, padding: "11px 0", borderRadius: 9, border: "none",
              background: who.length && to ? C.primary : C.borderStrong, color: "#fff", fontFamily: F, fontWeight: 800,
              fontSize: 13, cursor: who.length && to ? "pointer" : "default" }}>
            {who.length > 1 ? `Move ${who.length} people` : "Move"}
          </button>
        </div>
      </div>

      {/* ---- Reference tree ---- */}
      <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Find in the team"
          style={{ ...inp, flex: 1 }} />
        <select value={branchF} onChange={e => setBranchF(e.target.value)} style={{ ...inp, flex: 0.9, padding: "8px 6px", fontSize: 12 }}>
          <option value="all">All locations</option>{branches.map(b2 => <option key={b2} value={b2}>{b2}</option>)}
        </select>
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
        <select value={roleF} onChange={e => setRoleF(e.target.value)} style={{ ...inp, flex: 0.8, padding: "8px 6px", fontSize: 12 }}>
          <option value="all">Any role</option><option value="SM">SM</option><option value="TL">TL</option><option value="SE">SE</option>
        </select>
        <select value={loadF} onChange={e => setLoadF(e.target.value)} style={{ ...inp, flex: 1, padding: "8px 6px", fontSize: 12 }}>
          <option value="all">Any load</option><option value="high load">High load</option><option value="light load">Light load</option>
        </select>
      </div>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
        {visible.length === 0 && <div style={{ padding: 18, textAlign: "center", fontFamily: F, fontSize: 12.5, color: C.faint }}>No one matches.</div>}
        {visible.map(e => {
          const n = e.node; const tag = loadTag(n); const isRoot = n.id === org.id;
          const inMove = who.some(w => w.node.id === n.id);
          return (
            <button key={n.id} type="button" disabled={isRoot} onClick={() => !inMove && addWho(e)} style={{
              display: "flex", alignItems: "center", gap: 8, width: "100%", minHeight: 46, padding: "8px 10px 8px 8px",
              borderBottom: `1px solid ${C.border}`, borderLeft: `3px solid ${ROLE_TONE[n.role]}`,
              background: inMove ? C.primarySoft : DEPTH_BG[Math.min(Math.max(e.depth, 0), DEPTH_BG.length - 1)],
              border: "none", cursor: isRoot ? "default" : "pointer", textAlign: "left", WebkitTapHighlightColor: "transparent",
            }}>
              <Avatar r={n} size={e.depth === 0 ? 28 : 24} />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontFamily: F, fontSize: 13, fontWeight: e.depth === 0 ? 800 : 600, color: C.ink,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.name}</span>
                <span style={{ display: "block", fontFamily: F, fontSize: 10.5, color: C.faint, marginTop: 1,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {ROLE_SHORT[n.role]}
                  {n.role !== "Sales Executive" ? ` · ${seCount(n)} SE · ${loadOf(n)} leads` : ` · ${loadOf(n)} leads`}
                  {e.parent ? ` · under ${e.parent.name.split(" ")[0]}` : ""}
                  {n.branch && n.branch !== "All branches" ? ` · ${n.branch}` : ""}
                </span>
              </span>
              {tag && <span style={{ fontFamily: F, fontSize: 9.5, fontWeight: 700, color: C.sub, background: C.bg, borderRadius: 5,
                padding: "2px 6px", whiteSpace: "nowrap" }}>{tag}</span>}
              {inMove && <span style={{ fontFamily: F, fontSize: 10, fontWeight: 800, color: C.primary }}>In move</span>}
            </button>
          );
        })}
      </div>

      {/* ---- Confirm ---- */}
      {confirm && to && (
        <div style={{ position: "fixed", inset: 0, zIndex: 250, display: "flex", alignItems: "flex-end" }}>
          <div onClick={() => setConfirm(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)" }} />
          <div style={{ position: "relative", width: "100%", background: C.card, borderRadius: "18px 18px 0 0", padding: 16 }}>
            <div style={{ fontFamily: F, fontSize: 15.5, fontWeight: 800, color: C.ink }}>
              Move {who.length === 1 ? who[0].node.name.split(" ")[0] : `${who.length} people`} to {to.node.name.split(" ")[0]}?
            </div>
            <div style={{ fontFamily: F, fontSize: 12, color: C.sub, marginTop: 6, lineHeight: 1.5 }}>
              Leads and target move too. Both notified.
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button onClick={() => setConfirm(false)} style={{ flex: 1, padding: "13px 0", borderRadius: 11, cursor: "pointer",
                border: `1.5px solid ${C.borderStrong}`, background: C.card, color: C.sub, fontFamily: F, fontWeight: 700, fontSize: 13 }}>Cancel</button>
              <button onClick={doMove} style={{ flex: 1.4, padding: "13px 0", borderRadius: 11, border: "none", background: C.primary,
                color: "#fff", fontFamily: F, fontWeight: 800, fontSize: 13, cursor: "pointer" }}>Confirm</button>
            </div>
          </div>
        </div>
      )}


      {/* ---- History ---- */}
      {histOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 250, display: "flex", alignItems: "flex-end" }}>
          <div onClick={() => { setHistOpen(false); setReverseAsk(null); }} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)" }} />
          <div style={{ position: "relative", width: "100%", background: C.card, borderRadius: "18px 18px 0 0", padding: 16, maxHeight: "80vh", overflowY: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ flex: 1, fontFamily: F, fontSize: 15.5, fontWeight: 800, color: C.ink }}>Recent changes</span>
              <button type="button" onClick={() => { setHistOpen(false); setReverseAsk(null); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex" }}>
                <X size={18} color={C.sub} /></button>
            </div>
            <div style={{ fontFamily: F, fontSize: 11.5, color: C.sub, marginBottom: 12, lineHeight: 1.45 }}>
              Newest first. Dependent changes reverse together.
            </div>
            {history.length === 0 && <div style={{ padding: 18, textAlign: "center", fontFamily: F, fontSize: 12.5, color: C.faint }}>No changes yet.</div>}
            {history.map((h, i) => {
              // A later entry depends on this one if it moved any of the same people.
              const ids = new Set(h.people.map(p2 => p2.id));
              const dependents = history.slice(0, i).filter(later => later.people.some(p2 => ids.has(p2.id)));
              const ago = Math.max(0, Math.round((Date.now() - new Date(h.at)) / 60000));
              return (
                <div key={h.id} style={{ border: `1px solid ${C.border}`, borderRadius: 12, padding: "11px 12px", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: "block", fontFamily: F, fontSize: 13, fontWeight: 700, color: C.ink }}>{h.label}</span>
                      <span style={{ display: "block", fontFamily: F, fontSize: 11, color: C.faint, marginTop: 2 }}>
                        {h.people.map(p2 => `${p2.name.split(" ")[0]} from ${p2.fromName ? p2.fromName.split(" ")[0] : "—"}`).join(" · ")} · {ago === 0 ? "just now" : `${ago}m ago`}
                      </span>
                    </span>
                    <button type="button" onClick={() => dependents.length ? setReverseAsk({ entry: h, dependents }) : (onReverse([h]), showToast(`Reversed: ${h.label}`))}
                      style={{ flexShrink: 0, padding: "7px 11px", borderRadius: 8, cursor: "pointer", border: `1.5px solid ${C.borderStrong}`,
                        background: C.card, color: C.ink, fontFamily: F, fontWeight: 700, fontSize: 11.5 }}>Reverse</button>
                  </div>
                  {reverseAsk && reverseAsk.entry.id === h.id && (
                    <div style={{ background: C.bg, borderRadius: 9, padding: "10px 11px", marginTop: 10 }}>
                      <div style={{ fontFamily: F, fontSize: 12, color: C.ink, lineHeight: 1.45 }}>
                        Reversing this also reverses {reverseAsk.dependents.length === 1 ? "a later change" : `${reverseAsk.dependents.length} later changes`} that moved the same people:
                      </div>
                      {reverseAsk.dependents.map(d => (
                        <div key={d.id} style={{ fontFamily: F, fontSize: 11.5, color: C.sub, marginTop: 4 }}>· {d.label}</div>
                      ))}
                      <div style={{ display: "flex", gap: 7, marginTop: 10 }}>
                        <button type="button" onClick={() => setReverseAsk(null)} style={{ padding: "8px 12px", borderRadius: 8, cursor: "pointer",
                          border: `1.5px solid ${C.borderStrong}`, background: C.card, color: C.sub, fontFamily: F, fontWeight: 700, fontSize: 11.5 }}>Keep</button>
                        <button type="button" onClick={() => { onReverse([...reverseAsk.dependents, h]); setReverseAsk(null); showToast(`Reversed ${reverseAsk.dependents.length + 1} changes`); }}
                          style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: "none", background: C.primary, color: "#fff",
                            fontFamily: F, fontWeight: 800, fontSize: 11.5, cursor: "pointer" }}>Reverse all {reverseAsk.dependents.length + 1}</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {history.length > 1 && (
              <button type="button" onClick={() => { onReverse([...history]); setHistOpen(false); showToast("Restored the original structure"); }}
                style={{ width: "100%", padding: "12px 0", borderRadius: 10, cursor: "pointer", marginTop: 4,
                  border: `1.5px solid ${C.borderStrong}`, background: C.card, color: C.ink, fontFamily: F, fontWeight: 700, fontSize: 12.5 }}>
                Restore original structure
              </button>
            )}
          </div>
        </div>
      )}

      {undo && (
        <div style={{ position: "absolute", left: 14, right: 14, bottom: 18, zIndex: 130, background: C.ink, color: "#fff",
          borderRadius: 12, padding: "11px 14px", display: "flex", alignItems: "center", gap: 10, fontFamily: F, fontSize: 12.5 }}>
          <span style={{ flex: 1 }}>Moved {undo.label}</span>
          <button onClick={undoMove} style={{ background: "none", border: "none", color: C.primary, fontFamily: F, fontWeight: 800, fontSize: 12.5, cursor: "pointer" }}>Undo</button>
        </div>
      )}
    </div>
  );
}

/* ============================ LEADS (whole org) ============================ */
// Same interaction pattern as the Sales Executive app's own Call Queue and Follow-Ups —
// a rank, the next action right on the row, Call and WhatsApp as one-tap buttons, and an
// inline log instead of forcing a trip into the lead just to record a call. The manager
// version stays deliberately lighter than the SE's own logging screen (no booking flow,
// no voice dictation) — the manager is glancing across the whole team here, not running
// a single deal end to end; that full flow still lives one tap away via the lead itself.
const ADMIN_QUEUE_OUTCOMES = ["Connected", "No Answer", "Busy", "Switched Off", "Wrong Number"];

function ManagerActionBtn({ icon: Icon, label, onClick, filled }) {
  return (
    <button onClick={e => { e.stopPropagation(); onClick(); }} style={{
      display: "flex", alignItems: "center", justifyContent: "center", gap: 5, flex: 1,
      background: filled ? C.primary : C.card, color: filled ? "#fff" : C.sub,
      border: `1.5px solid ${filled ? C.primary : C.border}`, borderRadius: 9,
      padding: "8px 0", fontFamily: F, fontWeight: 700, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap",
    }}>
      <Icon size={13} color={filled ? "#fff" : C.sub} />{label}
    </button>
  );
}

function ManagerCallLogForm({ lead, onCancel, onSubmit }) {
  const [outcome, setOutcome] = useState(null);
  const [note, setNote] = useState("");
  return (
    <div onClick={e => e.stopPropagation()} style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
        {ADMIN_QUEUE_OUTCOMES.map(o => (
          <button key={o} onClick={() => setOutcome(o)} style={{ padding: "6px 10px", borderRadius: 7, cursor: "pointer",
            border: `1.5px solid ${outcome === o ? C.primary : C.border}`, background: outcome === o ? C.primarySoft : C.card,
            color: outcome === o ? C.primary : C.sub, fontFamily: F, fontWeight: 700, fontSize: 11 }}>{o}</button>
        ))}
      </div>
      <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Note (optional)" rows={2} style={{
        width: "100%", boxSizing: "border-box", border: `1.5px solid ${C.borderStrong}`, borderRadius: 9,
        padding: "8px 10px", fontFamily: F, fontSize: 12, color: C.ink, background: C.card, outline: "none",
        resize: "none", marginBottom: 8 }} />
      <div style={{ display: "flex", gap: 7 }}>
        <button onClick={onCancel} style={{ padding: "8px 13px", borderRadius: 9, cursor: "pointer",
          border: `1.5px solid ${C.borderStrong}`, background: C.card, color: C.sub, fontFamily: F, fontWeight: 700, fontSize: 12 }}>Cancel</button>
        <button onClick={() => outcome && onSubmit(outcome, note)} disabled={!outcome} style={{ flex: 1, padding: "8px 0", borderRadius: 9,
          border: "none", background: outcome ? C.primary : C.borderStrong, color: "#fff", fontFamily: F, fontWeight: 800,
          fontSize: 12, cursor: outcome ? "pointer" : "default" }}>Log call</button>
      </div>
    </div>
  );
}

function ManagerQueueRow({ lead, rank, onOpen, onLogCall, showToast }) {
  const [logging, setLogging] = useState(false);
  const tone = lead.stage === "Retailed" ? C.green : lead.stage === "Booking" ? C.teal : C.warm;
  return (
    <div onClick={() => onOpen(lead)} style={{ display: "flex", gap: 10, background: C.card, borderRadius: 14,
      border: `1px solid ${C.border}`, borderLeft: `3px solid ${tone}`, padding: 12, marginBottom: 9, cursor: "pointer" }}>
      <div style={{ width: 22, height: 22, borderRadius: "50%", background: C.ink, color: "#fff", fontFamily: F,
        fontWeight: 800, fontSize: 11.5, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1 }}>{rank}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
          <span style={{ fontFamily: F, fontWeight: 700, fontSize: 14, color: C.ink }}>{lead.name}</span>
          <span style={{ fontFamily: F, fontSize: 12.5, fontWeight: 800, color: C.ink, flexShrink: 0 }}>{inr(lead.value)}</span>
        </div>
        <div style={{ fontFamily: F, fontSize: 12, color: C.sub, marginTop: 2 }}>{lead.model} · {lead.owner.split(" ")[0]}</div>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 4, marginTop: 6 }}>
          <ArrowRight size={12} color={C.primary} style={{ flexShrink: 0, marginTop: 1.5 }} />
          <span style={{ fontFamily: F, fontSize: 12, color: C.primary, fontWeight: 600, lineHeight: 1.3 }}>{lead.next} · {lead.days}d</span>
        </div>
        <div style={{ display: "flex", gap: 7, marginTop: 9 }}>
          <ManagerActionBtn icon={Phone} label="Call" filled onClick={() => setLogging(true)} />
          <ManagerActionBtn icon={MessageSquare} label="WhatsApp" onClick={() => showToast(`Opened WhatsApp with ${lead.name.split(" ")[0]}`)} />
        </div>
        {logging && (
          <ManagerCallLogForm lead={lead} onCancel={() => setLogging(false)}
            onSubmit={(outcome, note) => { onLogCall(lead, outcome, note); setLogging(false); showToast(`Call with ${lead.name.split(" ")[0]} logged`); }} />
        )}
      </div>
    </div>
  );
}

function OrgLeadsScreen({ sub, handling, transfers, onOpen, managerActivity = [], onLogCall, showToast }) {
  const [tab, setTab] = useState("all");
  const [q, setQ] = useState("");
  const ownerOf = (l) => transfers[l.id] || l.ownerId;
  const nameOf = (id) => (flatten(ORG).find(s2 => s2.id === id) || {}).name || "";
  const all = LEADS.map(l => ({ ...l, ownerId: ownerOf(l), owner: nameOf(ownerOf(l)) }));
  const TITLES = { all: "All Leads", queue: "Call Queue", followups: "Follow-Ups", activity: "Recent Activity" };
  const base = sub === "queue" ? all.filter(l => l.days >= 5 && l.stage !== "Delivered")
    : sub === "followups" ? all.filter(l => l.days < 5 && l.stage !== "Delivered") : all;
  const TABS = [
    { key: "all",   label: "All",           match: () => true },
    { key: "ready", label: "Ready to Book", match: (l) => l.stage === "Ready to Book" },
    { key: "book",  label: "Booking",       match: (l) => l.stage === "Booking" },
    { key: "ret",   label: "Retailed",      match: (l) => l.stage === "Retailed" || l.stage === "Delivered" },
  ];
  const t2 = TABS.find(x => x.key === tab) || TABS[0];
  const rows = base.filter(t2.match).filter(l => !q || l.name.toLowerCase().includes(q.toLowerCase())
    || l.model.toLowerCase().includes(q.toLowerCase()) || l.owner.toLowerCase().includes(q.toLowerCase()));
  const blurb = { queue: "Across your team — leads that have gone 5+ days without movement.",
    followups: "Across your team — leads with a follow-up in the next few days.",
    activity: "Everything logged across your team, newest first — including your own calls." }[sub] || "Every lead under you.";
  const isActionable = sub === "queue" || sub === "followups";

  return (
    <div style={{ padding: "14px 14px 90px" }}>
      <div style={{ fontFamily: F, fontWeight: 800, fontSize: 15.5, color: C.ink }}>{TITLES[sub] || "All Leads"}</div>
      <div style={{ fontFamily: F, fontSize: 11.5, color: C.sub, marginTop: 1, marginBottom: 11 }}>{blurb}</div>
      {sub === "activity" ? (
        [
          ...managerActivity.map(e => ({ ...e, isManager: true })),
          ...all.flatMap(l => l.timeline.map((e, i) => ({ ...e, lead: l, leadName: l.name, owner: l.owner, k: `${l.id}-${i}` }))),
        ].slice(0, 40).map((e, i) => (
          <div key={e.k || `m-${i}`} style={{ display: "flex", gap: 10, background: e.isManager ? C.primarySoft : C.card,
            border: `1px solid ${e.isManager ? C.primary + "44" : C.border}`, borderRadius: 11, padding: "10px 13px", marginBottom: 7 }}>
            <span style={{ width: 52, flexShrink: 0, fontFamily: F, fontSize: 11, color: e.isManager ? C.primary : C.faint, fontWeight: e.isManager ? 700 : 400 }}>{e.when}</span>
            <span style={{ minWidth: 0 }}>
              <span style={{ display: "block", fontFamily: F, fontSize: 12.5, color: C.ink }}>{e.what}</span>
              <span style={{ display: "block", fontFamily: F, fontSize: 11, color: C.faint, marginTop: 2 }}>
                {e.leadName} · {e.owner.split(" ")[0]}</span>
            </span>
          </div>
        ))
      ) : (
        <>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search name, model or rep…"
            style={{ width: "100%", boxSizing: "border-box", border: `1.5px solid ${C.border}`, borderRadius: 10,
              padding: "9px 12px", fontFamily: F, fontSize: 12.5, color: C.ink, background: C.card, outline: "none", marginBottom: 10 }} />
          <div style={{ display: "flex", gap: 5, marginBottom: 11 }}>
            {TABS.map(x => {
              const on = tab === x.key; const n = base.filter(x.match).length;
              return (
                <button key={x.key} onClick={() => setTab(x.key)} style={{ flex: 1, padding: "8px 3px", borderRadius: 9,
                  cursor: "pointer", border: `1.5px solid ${on ? C.primary : C.border}`, background: on ? C.primarySoft : C.card,
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                  <span style={{ fontFamily: F, fontSize: 13.5, fontWeight: 800, color: on ? C.primary : C.ink, lineHeight: 1 }}>{n}</span>
                  <span style={{ fontFamily: F, fontSize: 9, fontWeight: 700, color: on ? C.primary : C.faint,
                    textTransform: "uppercase", letterSpacing: 0.3, whiteSpace: "nowrap" }}>{x.label}</span>
                </button>
              );
            })}
          </div>
          {rows.length === 0
            ? <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 22, textAlign: "center",
                fontFamily: F, fontSize: 13, color: C.sub }}>No leads here.</div>
            : rows.map((l, i) => isActionable
                ? <ManagerQueueRow key={l.id} lead={l} rank={i + 1} onOpen={onOpen} onLogCall={onLogCall} showToast={showToast} />
                : <LeadCard key={l.id} lead={l} onOpen={onOpen} handling={handling} />)}
        </>
      )}
    </div>
  );
}

/* ============================ INVENTORY ============================ */
/* ============================ INVENTORY ============================ */
const STOCK = [
  { model: "Creta", variants: [
    { name: "E", colours: { "Polar White": 2, "Titan Grey": 1 } },
    { name: "SX(O)", colours: { "Polar White": 3, "Abyss Black": 2, "Fiery Red": 1, "Titan Grey": 0 } } ]},
  { model: "Venue", variants: [
    { name: "S", colours: { "Polar White": 2, "Denim Blue": 1 } },
    { name: "SX", colours: { "Polar White": 1, "Abyss Black": 3, "Fiery Red": 2 } } ]},
  { model: "Exter", variants: [{ name: "SX", colours: { "Cosmic Blue": 2, "Ranger Khaki": 1, "Polar White": 2 } }] },
  { model: "Verna", variants: [{ name: "SX(O) Turbo", colours: { "Abyss Black": 1, "Atlas White": 2 } }] },
  { model: "Alcazar", variants: [{ name: "Signature 7-str", colours: { "Robust Emerald": 1, "Abyss Black": 1 } }] },
  { model: "Ioniq 5", variants: [{ name: "AWD", colours: { "Gravity Gold": 1, "Optic White": 2 } }] },
];
const PREOWNED = [
  { kind: "demo", model: "Creta SX(O)", reg: "KA01 MJ 4421", year: 2024, km: 3200, ask: 1520000, days: 41, branch: "Indiranagar" },
  { kind: "demo", model: "Ioniq 5 AWD", reg: "KA03 NA 0918", year: 2024, km: 1900, ask: 4180000, days: 22, branch: "Whitefield" },
  { kind: "demo", model: "Venue SX", reg: "KA01 MK 7730", year: 2025, km: 1100, ask: 1090000, days: 9, branch: "Indiranagar" },
  { kind: "used", model: "Creta SX", reg: "KA05 MB 2210", year: 2021, km: 38000, ask: 1140000, days: 62, branch: "Indiranagar" },
  { kind: "used", model: "Verna SX", reg: "KA03 MP 5561", year: 2022, km: 26500, ask: 1020000, days: 18, branch: "Whitefield" },
  { kind: "used", model: "Maruti Baleno", reg: "KA02 MG 8823", year: 2020, km: 44000, ask: 610000, days: 55, branch: "Indiranagar" },
];
const HELD = [
  { model: "Creta", variant: "SX(O)", colour: "Polar White", by: "Rahul Kumar", customer: "Lakshmi Narayan", since: "2d" },
  { model: "Venue", variant: "SX", colour: "Abyss Black", by: "Divya Pillai", customer: "Farhan Khan", since: "5d" },
  { model: "Ioniq 5", variant: "AWD", colour: "Optic White", by: "Arjun Nair", customer: "George Thomas", since: "1d" },
];
function InventoryAddCarScreen({ kind, onSave, onCancel }) {
  // Demo units are always the dealership's own current lineup, so Model/Variant are
  // picked from what's actually sold here. A used car is whatever a customer traded in or
  // it was bought as — any make at all (the existing stock already has a Maruti Baleno on
  // the lot) — so it's free text instead of a picker tied to Hyundai's own range.
  const isDemo = kind === "demo";
  const [f, setF] = useState({ kind, model: ADMIN_MODELS[0], variant: "", make: "", freeModel: "",
    reg: "", year: String(new Date().getFullYear()),
    km: "", fuel: "ICE", chassis: "", engineMotor: "", colour: "", ask: "", branch: ADMIN_SHOWROOMS[0], photos: 0 });
  const num = (v) => v.replace(/[^0-9]/g, "");
  const canSave = (isDemo ? f.variant : (f.make.trim() && f.freeModel.trim()))
    && f.reg.trim() && f.km !== "" && f.chassis.trim() && f.engineMotor.trim() && f.ask !== "";
  const variants = (STOCK.find(m => m.model === f.model)?.variants || []).map(v => v.name);

  return (
    <div style={{ padding: "14px 14px 90px" }}>
      <button onClick={onCancel} style={{ display: "flex", alignItems: "center", gap: 5, background: "none",
        border: "none", cursor: "pointer", padding: "0 0 12px", fontFamily: F, fontSize: 12.5, fontWeight: 700,
        color: C.primary }}><ChevronLeft size={14} />Back</button>
      <div style={{ fontFamily: F, fontWeight: 800, fontSize: 15.5, color: C.ink, marginBottom: 13 }}>
        Add a {kind === "demo" ? "demo" : "used"} car
      </div>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14 }}>
        {isDemo ? (
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1 }}><AdminField label="Model">
              <AdminSelect value={f.model} onChange={v => setF({ ...f, model: v, variant: "" })} options={ADMIN_MODELS} />
            </AdminField></div>
            <div style={{ flex: 1 }}><AdminField label="Variant">
              <AdminSelect value={f.variant} onChange={v => setF({ ...f, variant: v })} options={variants} placeholder="Pick one" />
            </AdminField></div>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1 }}><AdminField label="Make">
              <AdminInput value={f.make} onChange={e => setF({ ...f, make: e.target.value })} placeholder="Any make" />
            </AdminField></div>
            <div style={{ flex: 1 }}><AdminField label="Model">
              <AdminInput value={f.freeModel} onChange={e => setF({ ...f, freeModel: e.target.value })} placeholder="e.g. Baleno SX(O)" />
            </AdminField></div>
          </div>
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}><AdminField label="Registration no.">
            <AdminInput value={f.reg} onChange={e => setF({ ...f, reg: e.target.value })} placeholder="KA01 AB 1234" /></AdminField></div>
          <div style={{ flex: 1 }}><AdminField label="Year">
            <AdminInput inputMode="numeric" value={f.year} onChange={e => setF({ ...f, year: num(e.target.value) })} /></AdminField></div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}><AdminField label="Odometer (km)">
            <AdminInput inputMode="numeric" value={f.km} onChange={e => setF({ ...f, km: num(e.target.value) })} /></AdminField></div>
          <div style={{ flex: 1 }}><AdminField label="Colour">
            <AdminInput value={f.colour} onChange={e => setF({ ...f, colour: e.target.value })} /></AdminField></div>
        </div>
        <AdminField label="Fuel type">
          <div style={{ display: "flex", gap: 7 }}>
            {["ICE", "EV"].map(t => (
              <button key={t} type="button" onClick={() => setF({ ...f, fuel: t, engineMotor: "" })} style={{
                flex: 1, padding: "9px 0", borderRadius: 9, cursor: "pointer",
                border: `1.5px solid ${f.fuel === t ? C.primary : C.border}`,
                background: f.fuel === t ? C.primarySoft : C.card, color: f.fuel === t ? C.primary : C.sub,
                fontFamily: F, fontWeight: 700, fontSize: 12.5 }}>{t}</button>
            ))}
          </div>
        </AdminField>
        <AdminField label="Chassis no. (VIN)">
          <AdminInput value={f.chassis} onChange={e => setF({ ...f, chassis: e.target.value.toUpperCase() })} placeholder="17-character VIN" />
        </AdminField>
        <AdminField label={f.fuel === "EV" ? "Motor no." : "Engine no."}>
          <AdminInput value={f.engineMotor} onChange={e => setF({ ...f, engineMotor: e.target.value.toUpperCase() })} />
        </AdminField>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}><AdminField label="Asking price">
            <AdminInput inputMode="numeric" value={f.ask} onChange={e => setF({ ...f, ask: num(e.target.value) })} placeholder="₹" /></AdminField></div>
          <div style={{ flex: 1 }}><AdminField label="Branch">
            <AdminSelect value={f.branch} onChange={v => setF({ ...f, branch: v })} options={ADMIN_SHOWROOMS} /></AdminField></div>
        </div>
        <AdminField label="Photos">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button type="button" onClick={() => setF({ ...f, photos: f.photos + 1 })} style={{ display: "flex", alignItems: "center",
              gap: 5, padding: "8px 12px", borderRadius: 9, border: `1.5px solid ${C.borderStrong}`, background: C.card,
              cursor: "pointer", fontFamily: F, fontWeight: 700, fontSize: 12, color: C.sub }}><Upload size={13} />Take photo</button>
            <button type="button" onClick={() => setF({ ...f, photos: f.photos + 1 })} style={{ display: "flex", alignItems: "center",
              gap: 5, padding: "8px 12px", borderRadius: 9, border: `1.5px solid ${C.borderStrong}`, background: C.card,
              cursor: "pointer", fontFamily: F, fontWeight: 700, fontSize: 12, color: C.sub }}><Upload size={13} />Choose file</button>
            {f.photos > 0 && <span style={{ fontFamily: F, fontSize: 11.5, color: C.faint }}>{f.photos} added</span>}
          </div>
        </AdminField>
        <AdminPrimaryButton full disabled={!canSave} onClick={() => onSave({
          kind, model: isDemo ? `${f.model} ${f.variant}` : `${f.make.trim()} ${f.freeModel.trim()}`,
          reg: f.reg.trim(), year: +f.year, km: +f.km, ask: +f.ask,
          days: 0, branch: f.branch, fuel: f.fuel, chassis: f.chassis.trim(), engineMotor: f.engineMotor.trim(),
          colour: f.colour.trim(), photos: f.photos,
        })}>Add car</AdminPrimaryButton>
      </div>
    </div>
  );
}

function InventoryScreen({ sub }) {
  const [open, setOpen] = useState(new Set());
  const [cars, setCars] = useState(PREOWNED);
  const [adding, setAdding] = useState(false);
  const toggle = (k) => setOpen(s2 => { const n = new Set(s2); if (n.has(k)) n.delete(k); else n.add(k); return n; });
  const count = (v) => Object.values(v.colours).reduce((a, b2) => a + b2, 0);
  const view = sub || "new";
  const title = { new: "New Cars", preowned: "Pre-Owned", demo: "Demo Cars", block: "Block/Allocate a car" }[view];
  const total = STOCK.reduce((n, m) => n + m.variants.reduce((a, v) => a + count(v), 0), 0);
  const pre = cars.filter(p2 => view === "demo" ? p2.kind === "demo" : p2.kind === "used");

  if (adding) return <InventoryAddCarScreen kind={view === "demo" ? "demo" : "used"}
    onSave={(car) => { setCars(cs => [car, ...cs]); setAdding(false); }} onCancel={() => setAdding(false)} />;

  return (
    <div style={{ padding: "14px 14px 90px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <span style={{ flex: 1 }}>
          <span style={{ display: "block", fontFamily: F, fontWeight: 800, fontSize: 15.5, color: C.ink }}>{title}</span>
          <span style={{ display: "block", fontFamily: F, fontSize: 11.5, color: C.sub, marginTop: 1, marginBottom: 13 }}>
            {view === "new" ? `${total} units. Tap a model to expand.`
            : view === "block" ? "Held for a customer — SEs block cars from the lead."
            : `${pre.length} cars. Ageing past 45 days is flagged.`}
          </span>
        </span>
        {(view === "preowned" || view === "demo") && (
          <button onClick={() => setAdding(true)} style={{ padding: "8px 12px", borderRadius: 9, border: "none",
            background: C.primary, color: "#fff", fontFamily: F, fontWeight: 800, fontSize: 12, cursor: "pointer",
            whiteSpace: "nowrap", flexShrink: 0 }}>+ Add a car</button>
        )}
      </div>
      {view === "new" && STOCK.map(m => {
        const mo = open.has(m.model); const n = m.variants.reduce((a, v) => a + count(v), 0);
        return (
          <div key={m.model} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, marginBottom: 8, overflow: "hidden" }}>
            <button onClick={() => toggle(m.model)} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%",
              padding: "12px 13px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
              {mo ? <ChevronDown size={13} color={C.faint} /> : <ChevronRight size={13} color={C.faint} />}
              <span style={{ flex: 1, fontFamily: F, fontSize: 13.5, fontWeight: 700, color: C.ink }}>{m.model}</span>
              <span style={{ fontFamily: F, fontSize: 12.5, fontWeight: 700, color: C.ink }}>{n}</span>
              <span style={{ fontFamily: F, fontSize: 10.5, color: C.faint }}>in stock</span>
            </button>
            {mo && m.variants.map(v => {
              const vk = m.model + v.name; const vo = open.has(vk);
              return (
                <div key={v.name} style={{ borderTop: `1px solid ${C.border}`, background: "#FAF9F5" }}>
                  <button onClick={() => toggle(vk)} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%",
                    padding: "10px 13px 10px 34px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
                    {vo ? <ChevronDown size={12} color={C.faint} /> : <ChevronRight size={12} color={C.faint} />}
                    <span style={{ flex: 1, fontFamily: F, fontSize: 12.5, fontWeight: 600, color: C.ink }}>{v.name}</span>
                    <span style={{ fontFamily: F, fontSize: 12.5, fontWeight: 700, color: C.ink }}>{count(v)}</span>
                  </button>
                  {vo && Object.entries(v.colours).map(([c2, n2]) => (
                    <div key={c2} style={{ display: "flex", alignItems: "center", padding: "8px 13px 8px 56px",
                      borderTop: `1px solid ${C.border}`, background: "#F4F2EB" }}>
                      <span style={{ flex: 1, fontFamily: F, fontSize: 12, color: C.sub }}>{c2}</span>
                      <span style={{ fontFamily: F, fontSize: 12.5, fontWeight: 600, color: n2 ? C.ink : C.ghost }}>{n2 || "—"}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        );
      })}
      {(view === "preowned" || view === "demo") && pre.map(p2 => (
        <div key={p2.reg} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 13px", marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", fontFamily: F, fontSize: 13.5, fontWeight: 700, color: C.ink }}>{p2.model}</span>
              <span style={{ display: "block", fontFamily: F, fontSize: 11, color: C.faint, marginTop: 2 }}>
                {p2.reg} · {p2.year} · {p2.km.toLocaleString("en-IN")} km · {p2.branch}</span>
              {p2.chassis && <span style={{ display: "block", fontFamily: F, fontSize: 10, color: C.ghost, marginTop: 1 }}>
                {p2.fuel === "EV" ? "Motor" : "Engine"} {p2.engineMotor} · Chassis {p2.chassis}{p2.photos ? ` · ${p2.photos} photos` : ""}</span>}
            </span>
            <span style={{ textAlign: "right" }}>
              <span style={{ display: "block", fontFamily: F, fontSize: 13.5, fontWeight: 800, color: C.ink }}>{inr(p2.ask)}</span>
              <span style={{ display: "block", fontFamily: F, fontSize: 10.5, marginTop: 2, color: C.faint,
                fontWeight: p2.days > 45 ? 700 : 500 }}>{p2.days}d in stock{p2.days > 45 ? " · ageing" : ""}</span>
            </span>
          </div>
        </div>
      ))}
      {view === "block" && HELD.map((h, i) => (
        <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 13px", marginBottom: 8 }}>
          <div style={{ fontFamily: F, fontSize: 13.5, fontWeight: 700, color: C.ink }}>{h.model} {h.variant} · {h.colour}</div>
          <div style={{ fontFamily: F, fontSize: 11.5, color: C.sub, marginTop: 3 }}>Held for {h.customer} by {h.by.split(" ")[0]} · {h.since}</div>
        </div>
      ))}
    </div>
  );
}


/* ==================================================================================
   ADMIN — Users & Roles, Lead Rules, Locations, Vehicles.

   Lives entirely inside the manager login, behind the Admin privilege. Prefixed with
   ADMIN_ / Admin where a name would otherwise collide with the manager's own
   Avatar/ROLE_TONE/ROLE_SHORT, which use full role strings ("Sales Manager") rather
   than the short codes admin's wider role list needs (it also covers Finance,
   Evaluator, Inventory, Receptionist, EDP, CEO — roles outside the SM/TL/SE tree).
   ================================================================================== */

const ADMIN_ROLE_DEFS = [
  { key: "CEO", label: "CEO / Dealer Principal", desc: "Whole dealer group. Revenue, margin, and every branch." },
  { key: "SM", label: "Sales Manager", desc: "One or more branches. Targets, team structure, approvals." },
  { key: "TL", label: "Team Leader", desc: "A group of Sales Executives. Escalations, coaching, at-risk deals." },
  { key: "SE", label: "Sales Executive", desc: "Owns leads end to end — qualification through delivery." },
  { key: "CRE", label: "Telecaller", desc: "First contact and qualification before handoff to an SE." },
  { key: "FIN", label: "Finance Desk", desc: "Loan files, document collection, sanction or rejection." },
  { key: "EVL", label: "Evaluator", desc: "Trade-in appraisal. Sees no new-car pricing." },
  { key: "INV", label: "Inventory", desc: "Stock, arrivals, and unit condition across branches." },
  { key: "RCP", label: "Receptionist", desc: "Walk-ins and the day's appointment schedule." },
  { key: "EDP", label: "EDP / Data", desc: "Data entry and system upkeep." },
];
const ADMIN_ROLE_TONE = { CEO: "#0E0E0C", SM: "#0E0E0C", TL: "#00695C", SE: "#5C5A54", CRE: "#5C5A54",
  FIN: "#6D28D9", EVL: "#6D28D9", INV: "#1565C0", RCP: "#1565C0", EDP: "#1565C0" };

const ADMIN_USERS_SEED = [
  { id: 1, name: "Priya Nambiar", phone: "+91 90080 11223", email: "priya.nambiar@autoprism.in", role: "SM", branch: "All branches", reportsTo: null, active: true, adminPrivilege: true },
  { id: 2, name: "Rajesh Menon", phone: "+91 90080 22334", email: "rajesh.menon@autoprism.in", role: "SM", branch: "Whitefield", reportsTo: "Priya Nambiar", active: true, adminPrivilege: false },
  { id: 3, name: "Anil Kumar", phone: "+91 90080 33445", email: "anil.kumar@autoprism.in", role: "TL", branch: "Whitefield", reportsTo: "Rajesh Menon", active: true, adminPrivilege: false },
  { id: 4, name: "Sneha Rao", phone: "+91 90080 44556", email: "sneha.rao@autoprism.in", role: "TL", branch: "Indiranagar", reportsTo: "Priya Nambiar", active: true, adminPrivilege: false },
  { id: 5, name: "Arjun Nair", phone: "+91 90080 55667", email: "arjun.nair@autoprism.in", role: "SE", branch: "Whitefield", reportsTo: "Anil Kumar", active: true, adminPrivilege: false },
  { id: 6, name: "Rahul Kumar", phone: "+91 90080 66778", email: "rahul.kumar@autoprism.in", role: "SE", branch: "Indiranagar", reportsTo: "Sneha Rao", active: true, adminPrivilege: false },
  { id: 7, name: "Divya Pillai", phone: "+91 90080 77889", email: "divya.pillai@autoprism.in", role: "SE", branch: "Indiranagar", reportsTo: "Sneha Rao", active: true, adminPrivilege: false },
  { id: 8, name: "Meera Iyer", phone: "+91 90080 88990", email: "meera.iyer@autoprism.in", role: "CRE", branch: "Whitefield", reportsTo: "Anil Kumar", active: true, adminPrivilege: false },
  { id: 9, name: "Kavya Suresh", phone: "+91 90080 99001", email: "kavya.suresh@autoprism.in", role: "CRE", branch: "Indiranagar", reportsTo: "Sneha Rao", active: true, adminPrivilege: false },
  { id: 10, name: "Farouk Ahmed", phone: "+91 90080 10112", email: "farouk.ahmed@autoprism.in", role: "FIN", branch: "All branches", reportsTo: "Priya Nambiar", active: true, adminPrivilege: false },
  { id: 11, name: "Deepak Shetty", phone: "+91 90080 21223", email: "deepak.shetty@autoprism.in", role: "EVL", branch: "All branches", reportsTo: "Priya Nambiar", active: true, adminPrivilege: false },
  { id: 12, name: "Lakshmi Bhat", phone: "+91 90080 32334", email: "lakshmi.bhat@autoprism.in", role: "INV", branch: "All branches", reportsTo: "Priya Nambiar", active: true, adminPrivilege: false },
  { id: 13, name: "Anjali Reddy", phone: "+91 90080 43445", email: "anjali.reddy@autoprism.in", role: "SE", branch: "Indiranagar", reportsTo: "Vikas Shetty", active: false, adminPrivilege: false },
];

/* ============================ CALL LOG / BILLING / TEST DRIVE REPORT DATA ============================
   Modelled on the interaction records the Telecaller and Sales Executive apps actually
   keep (a call history entry per lead: date, disposition, duration, notes) — reproduced
   here as report rows since the Manager app doesn't share live state with those apps.
   Everything is deterministic from `l.id`, matching how every other derived field in
   this file is generated, so re-rendering never reshuffles the numbers. */

const ADMIN_CALL_TIMES = ["9:14 AM", "10:32 AM", "11:05 AM", "12:40 PM", "2:15 PM", "3:50 PM", "4:22 PM", "5:38 PM", "6:10 PM"];
const ADMIN_CALL_DURATIONS = ["1:12", "2:04", "0:48", "3:21", "1:55", "4:10", "0:32"];
const ADMIN_OUTCOMES = ["Connected", "No Answer", "Busy", "Switched Off", "Wrong Number"];
const ADMIN_CRE_NOTES = ["Confirmed interest, shared brochure over WhatsApp.", "Asked for a callback in 2 days.",
  "Discussed exchange value for the old car.", "Requested on-road price breakdown.", "Comparing with a rival model before deciding."];
const ADMIN_SE_NOTES = ["Test drive discussed for the weekend.", "Negotiated discount, awaiting manager approval.",
  "Customer wants extended warranty details.", "Finance documentation discussed.", "Delivery timeline confirmed."];

function adminPad(n) { return n < 10 ? `0${n}` : `${n}`; }
function adminDaysAgoLabel(n) { return n === 0 ? "Today" : n === 1 ? "Yesterday" : `${n} days ago`; }

const ADMIN_CRE_CALL_LOG = [];
const ADMIN_SE_CALL_LOG = [];
const ADMIN_TEST_DRIVES = [];

LEADS.forEach(l => {
  const owner = ADMIN_USERS_SEED.find(u => u.id === l.ownerId);
  const branch = owner ? owner.branch : "Indiranagar";
  const cre = ADMIN_USERS_SEED.find(u => u.role === "CRE" && u.branch === branch);

  // Pre-handoff qualification calls, attributed to the branch's telecaller.
  const creCalls = 1 + (l.id % 3);
  for (let i = 0; i < creCalls; i++) {
    const seed = l.id * 31 + i * 97;
    const outcome = ADMIN_OUTCOMES[seed % ADMIN_OUTCOMES.length];
    ADMIN_CRE_CALL_LOG.push({
      dateLabel: adminDaysAgoLabel((seed % 20) + i * 2), time: ADMIN_CALL_TIMES[seed % ADMIN_CALL_TIMES.length],
      telecaller: cre ? cre.name : "Unassigned", customer: l.name, phone: l.phone, model: l.model, source: l.source,
      outcome, duration: outcome === "Connected" ? ADMIN_CALL_DURATIONS[seed % ADMIN_CALL_DURATIONS.length] : "—",
      notes: outcome === "Connected" ? ADMIN_CRE_NOTES[seed % ADMIN_CRE_NOTES.length] : "No response — will retry.",
      nextFollowUp: `In ${1 + (seed % 5)} days`,
    });
  }

  // Post-handoff SE calls — only once a lead has actually reached an SE-owned stage.
  if (owner && owner.role === "SE") {
    const seCalls = 1 + (l.id % 4);
    for (let i = 0; i < seCalls; i++) {
      const seed = l.id * 53 + i * 61;
      const outcome = ADMIN_OUTCOMES[seed % ADMIN_OUTCOMES.length];
      ADMIN_SE_CALL_LOG.push({
        dateLabel: adminDaysAgoLabel((seed % 15) + i), time: ADMIN_CALL_TIMES[seed % ADMIN_CALL_TIMES.length],
        se: owner.name, customer: l.name, phone: l.phone, model: l.model, stage: l.stage,
        outcome, duration: outcome === "Connected" ? ADMIN_CALL_DURATIONS[seed % ADMIN_CALL_DURATIONS.length] : "—",
        testDrive: (seed % 3 === 0) ? "Yes" : "No",
        notes: outcome === "Connected" ? ADMIN_SE_NOTES[seed % ADMIN_SE_NOTES.length] : "No response — will retry.",
        nextFollowUp: `In ${1 + (seed % 5)} days`,
      });
    }

    // A subset of SE-owned leads get an actual test drive record.
    const tdSeed = l.id * 17;
    if (tdSeed % 10 < 4) {
      const [model, ...variantParts] = l.model.split(" ");
      const completed = l.stage === "Retailed" || l.stage === "Delivered" || tdSeed % 3 === 0;
      const noShow = !completed && tdSeed % 7 === 0;
      const status = noShow ? "No-show" : completed ? "Completed" : "Scheduled";
      ADMIN_TEST_DRIVES.push({
        dateLabel: adminDaysAgoLabel(tdSeed % 25), time: ADMIN_CALL_TIMES[tdSeed % ADMIN_CALL_TIMES.length],
        customer: l.name, phone: l.phone, model, variant: variantParts.join(" ") || "—", se: owner.name, branch,
        status, feedback: status === "Completed" ? ["Loved the ride quality", "Liked it, comparing options", "Wants a better discount", "Very positive, ready to book"][tdSeed % 4] : "—",
        converted: (l.stage === "Retailed" || l.stage === "Delivered") ? "Yes" : "No",
      });
    }
  }
});

const ADMIN_WALLET_BILLING = LEADS.map(l => {
  const seed = l.id * 41;
  const smsSent = 2 + (seed % 6);
  const waSent = 1 + (seed % 4);
  const calls = 1 + (seed % 3);
  const smsCost = smsSent * 0.20;
  const waCost = waSent * 0.90;
  const callCost = calls * 1.50;
  return {
    customer: l.name, phone: l.phone, smsSent, smsCost: Math.round(smsCost * 100) / 100,
    waSent, waCost: Math.round(waCost * 100) / 100, calls, callCost: Math.round(callCost * 100) / 100,
    total: Math.round((smsCost + waCost + callCost) * 100) / 100,
  };
});

const ADMIN_BRANCHES = ["All branches", "Indiranagar", "Whitefield"];
const ADMIN_MODELS = ["Alcazar", "Creta", "Exter", "Ioniq 5", "Venue", "Verna"];
const ADMIN_SOURCES = ["CarDekho", "Justdial", "OLX", "Referral", "Walk-in", "Website"];
const ADMIN_SHOWROOMS = ADMIN_BRANCHES.filter(b => b !== "All branches");

const ADMIN_LOCATIONS_SEED = [
  { id: 1, name: "Autoprism Hyundai — Indiranagar", address: "100 Feet Road, Indiranagar, Bengaluru, Karnataka 560038",
    mapsLink: "https://maps.google.com/?q=Autoprism+Hyundai+Indiranagar", c1: "+91 80 4012 3456", c2: "+91 80 4012 3457",
    w1: "+91 90080 11111", w2: "", email: "indiranagar@autoprism.in" },
  { id: 2, name: "Autoprism Hyundai — Whitefield", address: "ITPL Main Road, Whitefield, Bengaluru, Karnataka 560066",
    mapsLink: "https://maps.google.com/?q=Autoprism+Hyundai+Whitefield", c1: "+91 80 4012 9876", c2: "",
    w1: "+91 90080 22222", w2: "+91 90080 22223", email: "whitefield@autoprism.in" },
];

const ADMIN_VEHICLES_SEED = [
  { model: "Creta", variants: [
    { name: "E", exShowroom: 1109900, rto: 99891, insurance: 45000, handling: 12000, updated: "2 Aug 2026" },
    { name: "SX", exShowroom: 1439900, rto: 129591, insurance: 54000, handling: 12000, updated: "2 Aug 2026" },
    { name: "SX(O)", exShowroom: 1699900, rto: 152991, insurance: 61000, handling: 12000, updated: "2 Aug 2026" },
  ]},
  { model: "Venue", variants: [
    { name: "S", exShowroom: 799900, rto: 71991, insurance: 34000, handling: 10000, updated: "28 Jul 2026" },
    { name: "SX", exShowroom: 999900, rto: 89991, insurance: 40000, handling: 10000, updated: "28 Jul 2026" },
  ]},
  { model: "Exter", variants: [
    { name: "EX", exShowroom: 679900, rto: 61191, insurance: 30000, handling: 9000, updated: "15 Jul 2026" },
    { name: "SX(O)", exShowroom: 949900, rto: 85491, insurance: 38000, handling: 9000, updated: "15 Jul 2026" },
  ]},
];

const ADMIN_ACCESSORIES_SEED = [
  { model: "Creta", items: [
    { name: "Seat Covers (Leatherette)", price: 8500, updated: "2 Aug 2026" },
    { name: 'Alloy Wheel Upgrade 17"', price: 32000, updated: "2 Aug 2026" },
    { name: "Sunroof Wind Visor", price: 2200, updated: "2 Aug 2026" },
  ]},
  { model: "Venue", items: [
    { name: "Seat Covers (Fabric)", price: 5000, updated: "28 Jul 2026" },
    { name: "Body Graphics Kit", price: 6500, updated: "28 Jul 2026" },
  ]},
];

function AdminAvatar({ n, size = 30 }) {
  const initials = n.name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <span style={{ width: size, height: size, borderRadius: "50%", background: ADMIN_ROLE_TONE[n.role] || C.sub, color: "#fff",
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      fontFamily: F, fontWeight: 800, fontSize: size * 0.38 }}>{initials}</span>
  );
}
function AdminRoleTag({ role }) {
  return (
    <span style={{ fontFamily: F, fontSize: 10, fontWeight: 800, color: ADMIN_ROLE_TONE[role],
      background: (ADMIN_ROLE_TONE[role] || "#000") + "14", borderRadius: 5, padding: "2px 6px" }}>{role}</span>
  );
}
function AdminField({ label, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontFamily: F, fontSize: 10, fontWeight: 800, color: C.faint,
        textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 5 }}>{label}</div>
      {children}
    </div>
  );
}
const adminInputStyle = { width: "100%", boxSizing: "border-box", border: `1.5px solid ${C.borderStrong}`, borderRadius: 9,
  padding: "9px 11px", fontFamily: F, fontSize: 13, color: C.ink, background: C.card, outline: "none" };
function AdminInput(props) { return <input {...props} style={{ ...adminInputStyle, ...(props.style || {}) }} />; }
function AdminTextArea(props) { return <textarea {...props} style={{ ...adminInputStyle, resize: "none", ...(props.style || {}) }} />; }
function AdminSelect({ value, onChange, options, placeholder }) {
  return (
    <select value={value || ""} onChange={e => onChange(e.target.value)} style={adminInputStyle}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}
function AdminPrimaryButton({ children, onClick, disabled, full }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} style={{
      width: full ? "100%" : "auto", padding: "12px 18px", borderRadius: 10, border: "none",
      background: disabled ? C.borderStrong : C.primary, color: "#fff", fontFamily: F, fontWeight: 800,
      fontSize: 13, cursor: disabled ? "default" : "pointer" }}>{children}</button>
  );
}
function AdminGhostButton({ children, onClick, tone }) {
  return (
    <button type="button" onClick={onClick} style={{ padding: "10px 16px", borderRadius: 10, cursor: "pointer",
      border: `1.5px solid ${C.borderStrong}`, background: C.card, color: tone || C.sub, fontFamily: F,
      fontWeight: 700, fontSize: 12.5 }}>{children}</button>
  );
}
function AdminDivider() {
  // A plain rule between sections inside a form — cheaper to scan than relying on
  // whitespace alone once a card has four or five distinct sections in it.
  return <div style={{ height: 1, background: C.border, margin: "4px 0 14px" }} />;
}

function AdminScreenHeader({ title, blurb, action }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 14 }}>
      <span style={{ flex: 1 }}>
        <span style={{ display: "block", fontFamily: F, fontWeight: 800, fontSize: 15.5, color: C.ink }}>{title}</span>
        {blurb && <span style={{ display: "block", fontFamily: F, fontSize: 11.5, color: C.sub, marginTop: 2, lineHeight: 1.4 }}>{blurb}</span>}
      </span>
      {action}
    </div>
  );
}

function AdminPrivilegeToggle({ icon: Icon, label, sub, on, onClick }) {
  return (
    <button type="button" onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "10px 12px", borderRadius: 9,
      border: `1.5px solid ${on ? C.primary : C.borderStrong}`, background: on ? C.primarySoft : C.card,
      cursor: "pointer", textAlign: "left", marginBottom: 7 }}>
      <Icon size={15} color={on ? C.primary : C.faint} />
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontFamily: F, fontSize: 12.5, fontWeight: 600, color: C.ink }}>{label}</span>
        <span style={{ display: "block", fontFamily: F, fontSize: 11, color: C.faint, marginTop: 1 }}>{sub}</span>
      </span>
      <span style={{ width: 16, height: 16, borderRadius: 4, flexShrink: 0, border: `1.5px solid ${on ? C.primary : C.borderStrong}`,
        background: on ? C.primary : "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {on && <Check size={11} color="#fff" />}
      </span>
    </button>
  );
}

/* ---------------- Users & Roles ---------------- */
function AdminUserForm({ user, onSave, onCancel }) {
  const isNew = !user;
  const [f, setF] = useState(user || { name: "", phone: "", email: "", role: "SE", branch: "Indiranagar",
    reportsTo: "", active: true, adminPrivilege: false, reportsPrivilege: false });
  const possibleParents = ADMIN_USERS_SEED.filter(u => {
    if (f.role === "SE" || f.role === "CRE") return u.role === "TL";
    if (f.role === "TL") return u.role === "SM";
    if (f.role === "SM") return u.role === "SM" || u.role === "CEO";
    return true;
  });
  const canSave = f.name.trim() && f.phone.trim();
  return (
    <div style={{ padding: "14px 14px 90px" }}>
      <button onClick={onCancel} style={{ display: "flex", alignItems: "center", gap: 5, background: "none",
        border: "none", cursor: "pointer", padding: "0 0 12px", fontFamily: F, fontSize: 12.5, fontWeight: 700,
        color: C.primary }}><ChevronLeft size={14} />Back</button>
      <AdminScreenHeader title={isNew ? "Add user" : `Edit ${f.name.split(" ")[0]}`} />
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14 }}>
        <AdminField label="Full name"><AdminInput value={f.name} onChange={e => setF({ ...f, name: e.target.value })} placeholder="As on ID" /></AdminField>
        <AdminField label="Phone"><AdminInput value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} placeholder="+91 90000 00000" /></AdminField>
        <AdminField label="Email"><AdminInput value={f.email} onChange={e => setF({ ...f, email: e.target.value })} placeholder="name@autoprism.in" /></AdminField>
        <AdminField label="Role">
          <AdminSelect value={f.role} onChange={v => setF({ ...f, role: v, reportsTo: "" })} options={ADMIN_ROLE_DEFS.map(r => r.key)} />
        </AdminField>
        <AdminField label="Branch"><AdminSelect value={f.branch} onChange={v => setF({ ...f, branch: v })} options={ADMIN_BRANCHES} /></AdminField>
        <AdminField label="Reports to">
          <AdminSelect value={f.reportsTo} onChange={v => setF({ ...f, reportsTo: v })}
            options={possibleParents.map(p => p.name)} placeholder="No one — top of the tree" />
        </AdminField>
        <AdminField label="Privileges">
          <AdminPrivilegeToggle icon={ShieldCheck} label="Admin privilege" sub="Full Admin menu — Users, Lead Rules, Locations, Vehicles."
            on={f.adminPrivilege} onClick={() => setF({ ...f, adminPrivilege: !f.adminPrivilege })} />
          <AdminPrivilegeToggle icon={FileText} label="Reports privilege" sub="The Reports menu — all reports, scheduling and downloads."
            on={f.reportsPrivilege} onClick={() => setF({ ...f, reportsPrivilege: !f.reportsPrivilege })} />
        </AdminField>
        {/* Status is set only by Deactivate / Reactivate below — a separate toggle here
            would just be a second control doing the same thing. */}
        {!isNew && (
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12, fontFamily: F, fontSize: 11.5, color: C.faint }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: f.active ? C.green : C.hot }} />
            Currently {f.active ? "active" : "inactive"} — {f.active ? "can log in" : "login is disabled, history is kept"}
          </div>
        )}
        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          {!isNew && (f.active
            ? <AdminGhostButton tone={C.hot} onClick={() => onSave({ ...f, active: false })}>Deactivate</AdminGhostButton>
            : <AdminGhostButton tone={C.green} onClick={() => onSave({ ...f, active: true })}>Reactivate</AdminGhostButton>)}
          <div style={{ flex: 1 }}><AdminPrimaryButton full disabled={!canSave} onClick={() => onSave(f)}>
            {isNew ? "Create login" : "Save changes"}</AdminPrimaryButton></div>
        </div>
      </div>
    </div>
  );
}

function AdminUsersScreen({ showToast }) {
  const [tab, setTab] = useState("users");
  const [users, setUsers] = useState(ADMIN_USERS_SEED);
  const [q, setQ] = useState("");
  const [roleF, setRoleF] = useState("all");   // all | SM | TL | SE — the quick filters asked for
  const [openBranch, setOpenBranch] = useState(null);   // accordion — one showroom open at a time
  const [editing, setEditing] = useState(null);

  const save = (f) => {
    if (editing === "new") {
      setUsers(us => [...us, { ...f, id: Math.max(...us.map(u => u.id)) + 1 }]);
      showToast(`${f.name.split(" ")[0]} added as ${f.role}`);
    } else {
      const wasActive = editing.active;
      setUsers(us => us.map(u => u.id === editing.id ? { ...u, ...f } : u));
      showToast(wasActive !== f.active ? `${f.name.split(" ")[0]} ${f.active ? "reactivated" : "deactivated"}` : `${f.name.split(" ")[0]} updated`);
    }
    setEditing(null);
  };

  if (editing) return <AdminUserForm user={editing === "new" ? null : editing} onSave={save} onCancel={() => setEditing(null)} />;

  const matches = (u) => (roleF === "all" || u.role === roleF)
    && (!q.trim() || u.name.toLowerCase().includes(q.trim().toLowerCase()) || u.phone.includes(q.trim()));

  // Group by showroom. A branch with no users in it just doesn't produce a group — this
  // reads from the users themselves, not from the Locations list, so it never shows an
  // empty group. Showrooms first in their usual order, "All branches" roles (Finance,
  // Evaluator, Inventory, EDP…) last.
  const branchOrder = [...ADMIN_SHOWROOMS, "All branches"];
  const groups = branchOrder
    .map(branch => ({ branch, rows: users.filter(u => u.branch === branch && matches(u)) }))
    .filter(g => g.rows.length > 0);
  const toggle = (b) => setOpenBranch(cur => cur === b ? null : b);

  const UserRow = ({ u, isLast }) => (
    <button onClick={() => setEditing(u)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%",
      padding: "11px 12px", borderBottom: isLast ? "none" : `1px solid ${C.border}`,
      background: u.active ? "none" : "#FAF4F0", border: "none", cursor: "pointer", textAlign: "left",
      opacity: u.active ? 1 : 0.6 }}>
      <AdminAvatar n={u} />
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontFamily: F, fontSize: 13, fontWeight: 700, color: C.ink, overflow: "hidden",
            textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name}</span>
          <AdminRoleTag role={u.role} />
          {u.adminPrivilege && <ShieldCheck size={12} color={C.primary} />}
          {u.reportsPrivilege && <FileText size={12} color={C.teal} />}
          {!u.active && <span style={{ fontFamily: F, fontSize: 9.5, fontWeight: 800, color: C.hot }}>INACTIVE</span>}
        </span>
        <span style={{ display: "block", fontFamily: F, fontSize: 11, color: C.faint, marginTop: 2 }}>
          {u.reportsTo ? `under ${u.reportsTo.split(" ")[0]}` : "Top of the tree"}
        </span>
      </span>
      <ChevronRight size={14} color={C.ghost} />
    </button>
  );

  return (
    <div style={{ padding: "14px 14px 90px" }}>
      <AdminScreenHeader title="Users & Roles" blurb={`${users.filter(u => u.active).length} active logins across ${ADMIN_ROLE_DEFS.length} roles.`}
        action={<button onClick={() => setEditing("new")} style={{ padding: "9px 13px", borderRadius: 9, border: "none",
          background: C.primary, color: "#fff", fontFamily: F, fontWeight: 800, fontSize: 12, cursor: "pointer",
          whiteSpace: "nowrap" }}>+ Add</button>} />

      <div style={{ display: "flex", gap: 5, marginBottom: 12 }}>
        {["users", "roles"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: "8px 0", borderRadius: 9, cursor: "pointer",
            border: `1.5px solid ${tab === t ? C.primary : C.border}`, background: tab === t ? C.primarySoft : C.card,
            color: tab === t ? C.primary : C.sub, fontFamily: F, fontWeight: 700, fontSize: 12 }}>
            {t === "users" ? "Users" : "Role reference"}</button>
        ))}
      </div>

      {tab === "users" ? (
        <>
          <AdminInput value={q} onChange={e => setQ(e.target.value)} placeholder="Search name or phone" style={{ marginBottom: 8 }} />
          {/* The quick filters asked for — SM / TL / SE — sit above every showroom group,
              so filtering by role narrows every group at once rather than one at a time. */}
          <div style={{ display: "flex", gap: 5, marginBottom: 12 }}>
            {[["all", "All"], ["SM", "SM"], ["TL", "TL"], ["SE", "SE"]].map(([k, l]) => (
              <button key={k} onClick={() => setRoleF(k)} style={{ flex: 1, padding: "8px 0", borderRadius: 9, cursor: "pointer",
                border: `1.5px solid ${roleF === k ? C.primary : C.border}`, background: roleF === k ? C.primarySoft : C.card,
                color: roleF === k ? C.primary : C.sub, fontFamily: F, fontWeight: 700, fontSize: 12 }}>{l}</button>
            ))}
          </div>

          {groups.length === 0 && (
            <div style={{ padding: 20, textAlign: "center", fontFamily: F, fontSize: 12.5, color: C.faint,
              background: C.card, border: `1px solid ${C.border}`, borderRadius: 14 }}>No one matches.</div>
          )}

          {/* Every showroom starts closed — tap one to open it, which closes whichever
              was open before. Scales the same way whether there is one location or fifty. */}
          {groups.map(g => {
            const isOpen = openBranch === g.branch;
            return (
              <div key={g.branch} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14,
                overflow: "hidden", marginBottom: 9 }}>
                <button onClick={() => toggle(g.branch)} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%",
                  padding: "11px 13px", background: C.bg, border: "none", cursor: "pointer", textAlign: "left" }}>
                  {isOpen ? <ChevronDown size={13} color={C.faint} /> : <ChevronRight size={13} color={C.faint} />}
                  <MapPin size={13} color={C.faint} />
                  <span style={{ flex: 1, fontFamily: F, fontSize: 13, fontWeight: 800, color: C.ink }}>{g.branch}</span>
                  <span style={{ fontFamily: F, fontSize: 11.5, color: C.faint }}>{g.rows.length}</span>
                </button>
                {isOpen && g.rows.map((u, i) => <UserRow key={u.id} u={u} isLast={i === g.rows.length - 1} />)}
              </div>
            );
          })}
        </>
      ) : (
        ADMIN_ROLE_DEFS.map(r => (
          <div key={r.key} style={{ display: "flex", gap: 10, background: C.card, border: `1px solid ${C.border}`,
            borderLeft: `3px solid ${ADMIN_ROLE_TONE[r.key]}`, borderRadius: 11, padding: "11px 13px", marginBottom: 7 }}>
            <span style={{ flexShrink: 0, marginTop: 1 }}><AdminRoleTag role={r.key} /></span>
            <span style={{ minWidth: 0 }}>
              <span style={{ display: "block", fontFamily: F, fontSize: 13, fontWeight: 700, color: C.ink }}>{r.label}</span>
              <span style={{ display: "block", fontFamily: F, fontSize: 11.5, color: C.sub, marginTop: 2, lineHeight: 1.4 }}>{r.desc}</span>
            </span>
          </div>
        ))
      )}
    </div>
  );
}

const ADMIN_LEVELS = [
  { key: "SM", label: "Sales Manager" },
  { key: "TL", label: "Team Leader" },
  { key: "SE", label: "Sales Executive" },
];

/* A proper dropdown, not inline buttons — picking none means "no role restriction", i.e.
   the whole showroom; picking several unions their candidate pools into one picker below. */
function AdminLevelDropdown({ values, onChange }) {
  const [open, setOpen] = useState(false);
  const toggle = (k) => onChange(values.includes(k) ? values.filter(v => v !== k) : [...values, k]);
  const summary = values.length === 0 ? "Any level — whole showroom" : ADMIN_LEVELS.filter(o => values.includes(o.key)).map(o => o.label).join(", ");
  return (
    <div style={{ position: "relative" }}>
      <button type="button" onClick={() => setOpen(o => !o)} style={{ ...adminInputStyle, display: "flex",
        alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
        <span style={{ fontFamily: F, fontSize: 13, color: values.length ? C.ink : C.faint, overflow: "hidden",
          textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{summary}</span>
        <ChevronDown size={14} color={C.faint} style={{ flexShrink: 0, transform: open ? "rotate(180deg)" : "none" }} />
      </button>
      {open && (
        <div style={{ position: "absolute", left: 0, right: 0, top: "100%", zIndex: 50, background: C.card,
          border: `1px solid ${C.border}`, borderRadius: 9, boxShadow: shadow, marginTop: 4, overflow: "hidden" }}>
          {ADMIN_LEVELS.map(o => {
            const on = values.includes(o.key);
            return (
              <button key={o.key} type="button" onClick={() => toggle(o.key)} style={{ display: "flex", alignItems: "center",
                gap: 8, width: "100%", padding: "9px 11px", background: "none", border: "none",
                borderBottom: `1px solid ${C.border}`, cursor: "pointer", textAlign: "left" }}>
                <span style={{ width: 16, height: 16, borderRadius: 4, flexShrink: 0, border: `1.5px solid ${on ? C.primary : C.borderStrong}`,
                  background: on ? C.primary : "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {on && <Check size={11} color="#fff" />}
                </span>
                <span style={{ fontFamily: F, fontSize: 12.5, fontWeight: 600, color: C.ink }}>{o.label}</span>
              </button>
            );
          })}
          <button type="button" onClick={() => setOpen(false)} style={{ display: "block", width: "100%", padding: "8px 0",
            background: C.bg, border: "none", cursor: "pointer", fontFamily: F, fontWeight: 700, fontSize: 11.5, color: C.primary }}>Done</button>
        </div>
      )}
    </div>
  );
}

function AdminPersonPicker({ candidates, selected, onChange, placeholder }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const pool = candidates.filter(c => !selected.includes(c.id));
  const hits = q.trim() ? pool.filter(c => c.name.toLowerCase().includes(q.trim().toLowerCase())) : pool;
  const add = (u) => { onChange([...selected, u.id]); setQ(""); setOpen(false); };
  const remove = (id) => onChange(selected.filter(x => x !== id));
  return (
    <div style={{ position: "relative" }}>
      <div onClick={() => setOpen(true)} style={{ ...adminInputStyle, display: "flex", flexWrap: "wrap", gap: 5,
        alignItems: "center", minHeight: 40, padding: "6px 8px", cursor: "text",
        borderColor: open ? C.primary : C.borderStrong }}>
        {selected.map(id => {
          const u = candidates.find(c => c.id === id);
          if (!u) return null;
          return (
            <span key={id} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: C.primarySoft,
              border: `1.5px solid ${C.primary}`, borderRadius: 999, padding: "3px 6px 3px 4px", fontFamily: F,
              fontSize: 12, fontWeight: 700, color: C.ink }}>
              <AdminAvatar n={u} size={18} />{u.name.split(" ")[0]}
              <button type="button" onClick={() => remove(id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
                <X size={12} color={C.sub} /></button>
            </span>
          );
        })}
        <input value={q} onChange={e => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={selected.length ? "Add another…" : placeholder}
          style={{ flex: 1, minWidth: 90, border: "none", outline: "none", fontFamily: F, fontSize: 12.5, color: C.ink, background: "none", padding: "3px 2px" }} />
      </div>
      {open && hits.length > 0 && (
        <div style={{ position: "absolute", left: 0, right: 0, top: "100%", zIndex: 50, background: C.card,
          border: `1px solid ${C.border}`, borderRadius: 9, boxShadow: shadow, overflow: "hidden", marginTop: 3, maxHeight: 220, overflowY: "auto" }}>
          {hits.map(u => (
            <button key={u.id} type="button" onClick={() => add(u)} style={{ display: "flex", alignItems: "center", gap: 8,
              width: "100%", padding: "9px 10px", background: "none", border: "none", borderBottom: `1px solid ${C.border}`,
              cursor: "pointer", textAlign: "left" }}>
              <AdminAvatar n={u} size={22} />
              <span style={{ minWidth: 0 }}>
                <span style={{ display: "block", fontFamily: F, fontSize: 12.5, fontWeight: 600, color: C.ink }}>{u.name}</span>
                <span style={{ display: "block", fontFamily: F, fontSize: 10.5, color: C.faint }}>{u.branch}</span>
              </span>
            </button>
          ))}
        </div>
      )}
      {open && hits.length === 0 && pool.length === 0 && selected.length === 0 && (
        <div style={{ fontFamily: F, fontSize: 11, color: C.faint, marginTop: 4 }}>No one in this showroom holds that role.</div>
      )}
    </div>
  );
}

function AdminShowroomPicker({ value, onChange }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(!value);
  const hits = ADMIN_SHOWROOMS.filter(s => !q.trim() || s.toLowerCase().includes(q.trim().toLowerCase()));
  if (value && !open) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, border: `1.5px solid ${C.primary}`, borderRadius: 9,
        padding: "9px 11px", background: C.primarySoft }}>
        <MapPin size={14} color={C.primary} />
        <span style={{ flex: 1, fontFamily: F, fontSize: 13, fontWeight: 700, color: C.ink }}>{value}</span>
        <button type="button" onClick={() => setOpen(true)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex" }}>
          <X size={13} color={C.sub} /></button>
      </div>
    );
  }
  return (
    <div style={{ position: "relative" }}>
      <AdminInput value={q} onChange={e => setQ(e.target.value)} onFocus={() => setOpen(true)}
        placeholder={`Search a showroom (${ADMIN_SHOWROOMS.length})`} />
      {open && (
        <div style={{ border: `1px solid ${C.border}`, borderRadius: 9, marginTop: 5, overflow: "hidden", maxHeight: 200, overflowY: "auto" }}>
          {hits.map(s => (
            <button key={s} type="button" onClick={() => { onChange(s); setQ(""); setOpen(false); }} style={{
              display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "9px 11px", background: C.card,
              border: "none", borderBottom: `1px solid ${C.border}`, cursor: "pointer", textAlign: "left" }}>
              <MapPin size={13} color={C.faint} />
              <span style={{ fontFamily: F, fontSize: 12.5, fontWeight: 600, color: C.ink }}>{s}</span>
            </button>
          ))}
          {hits.length === 0 && <div style={{ padding: 10, fontFamily: F, fontSize: 12, color: C.faint, textAlign: "center" }}>No showroom matches.</div>}
        </div>
      )}
    </div>
  );
}

/* Multi-select for models or sources, with "All" as its own mutually-exclusive choice —
   picking All clears any specific picks and vice versa. Clearing the last specific pick
   falls back to All automatically, so this can never end up empty (which would match
   nothing rather than everything). Models and sources are independent: a rule can target
   specific models regardless of source, specific sources regardless of model, or both. */
function AdminKeyMultiSelect({ label, keys, values, onChange }) {
  const allOn = values.includes("ALL");
  const toggleAll = () => onChange(["ALL"]);
  const toggleOne = (k) => {
    const withoutAll = values.filter(v => v !== "ALL");
    const next = withoutAll.includes(k) ? withoutAll.filter(v => v !== k) : [...withoutAll, k];
    onChange(next.length ? next : ["ALL"]);
  };
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      <button type="button" onClick={toggleAll} style={{ padding: "7px 11px", borderRadius: 8, cursor: "pointer",
        border: `1.5px solid ${allOn ? C.primary : C.border}`, background: allOn ? C.primarySoft : C.card,
        color: allOn ? C.primary : C.sub, fontFamily: F, fontWeight: 700, fontSize: 12 }}>
        All {label}
      </button>
      {keys.map(k => {
        const on = values.includes(k);
        return (
          <button key={k} type="button" onClick={() => toggleOne(k)} style={{
            padding: "7px 11px", borderRadius: 8, cursor: "pointer",
            border: `1.5px solid ${on ? C.primary : C.border}`, background: on ? C.primarySoft : C.card,
            color: on ? C.primary : C.sub, fontFamily: F, fontWeight: 700, fontSize: 12 }}>{k}</button>
        );
      })}
    </div>
  );
}

function AdminRuleBuilder({ existing, blockedBy, onSave, onCancel }) {
  const [showroom, setShowroom] = useState(existing?.showroom || null);
  const [models, setModels] = useState(existing?.models || ["ALL"]);
  const [sources, setSources] = useState(existing?.sources || ["ALL"]);
  const [levels, setLevels] = useState(existing?.levels || []);
  const [people, setPeople] = useState(existing?.people || []);
  const [mode, setMode] = useState(existing?.mode || "exclusive");
  // No level picked = no role restriction = whole showroom. Several levels picked unions
  // their pools — e.g. a rule can hand a model to "this TL, plus this one SE" together.
  const candidates = showroom ? ADMIN_USERS_SEED.filter(u => u.branch === showroom && u.active
    && (levels.length === 0 || levels.includes(u.role))) : [];
  const bothAll = models.includes("ALL") && sources.includes("ALL");
  const draft = { showroom, models, sources, levels, people, mode };
  const blocker = showroom ? blockedBy(draft) : null;
  const canSave = showroom && !bothAll && !blocker;

  return (
    <div style={{ background: C.card, border: `1.5px solid ${C.primary}44`, borderRadius: 14, padding: 14, marginBottom: 12 }}>
      <AdminField label="Showroom"><AdminShowroomPicker value={showroom} onChange={(s) => { setShowroom(s); setPeople([]); }} /></AdminField>
      <AdminDivider />
      <AdminField label="Models">
        <AdminKeyMultiSelect label="models" keys={ADMIN_MODELS} values={models} onChange={setModels} />
      </AdminField>
      <AdminDivider />
      <AdminField label="Sources">
        <AdminKeyMultiSelect label="sources" keys={ADMIN_SOURCES} values={sources} onChange={setSources} />
      </AdminField>
      {bothAll && (
        <div style={{ fontFamily: F, fontSize: 11, color: C.sub, marginBottom: 2, lineHeight: 1.4 }}>
          That's just the default — narrow one to save.
        </div>
      )}
      <AdminDivider />
      <AdminField label="Decide at">
        <AdminLevelDropdown values={levels} onChange={(v) => { setLevels(v); setPeople([]); }} />
      </AdminField>
      {levels.length === 0 ? (
        <div style={{ fontFamily: F, fontSize: 11.5, color: C.sub, marginBottom: 4, lineHeight: 1.4, background: C.bg, borderRadius: 9, padding: "9px 11px" }}>
          Everyone in {showroom || "the showroom"} rotates for this.
        </div>
      ) : (
        <AdminField label={`Specific people in ${showroom || "the showroom"} — optional, narrows it further`}>
          {!showroom
            ? <div style={{ fontFamily: F, fontSize: 11.5, color: C.faint }}>Pick a showroom first.</div>
            : <AdminPersonPicker candidates={candidates} selected={people} onChange={setPeople}
                placeholder={`Search ${levels.map(l => ADMIN_LEVELS.find(x => x.key === l).label.toLowerCase()).join(" / ")}s`} />}
        </AdminField>
      )}
      <AdminDivider />
      {/* This is the ambiguity that needed resolving: does naming a group here mean they
          are the ONLY recipient, or one recipient among others still getting a share the
          normal way? Both are real cases, so both are explicit choices. */}
      <AdminField label="How this applies">
        {[["exclusive", Lock, "Only this group gets these leads",
            "No one else gets these leads."],
          ["additional", UserPlus, "This group joins whoever already gets these leads",
            "Adds to the default split, doesn't replace it."]]
          .map(([k, Icon, l, d]) => (
          <button key={k} type="button" onClick={() => setMode(k)} style={{ display: "flex", alignItems: "flex-start", gap: 10,
            width: "100%", textAlign: "left", padding: "11px 12px", borderRadius: 10, marginBottom: 7, cursor: "pointer",
            border: `1.5px solid ${mode === k ? C.primary : C.border}`, background: mode === k ? C.primarySoft : C.card }}>
            <Icon size={15} color={mode === k ? C.primary : C.faint} style={{ flexShrink: 0, marginTop: 1 }} />
            <span style={{ minWidth: 0 }}>
              <span style={{ display: "block", fontFamily: F, fontSize: 13, fontWeight: 700, color: mode === k ? C.primary : C.ink }}>{l}</span>
              <span style={{ display: "block", fontFamily: F, fontSize: 11.5, color: C.sub, marginTop: 2, lineHeight: 1.4 }}>{d}</span>
            </span>
          </button>
        ))}
      </AdminField>
      {blocker && (
        <div style={{ display: "flex", gap: 7, background: C.warmSoft, borderRadius: 9, padding: "9px 11px", marginBottom: 4 }}>
          <AlertTriangle size={13} color={C.warm} style={{ flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontFamily: F, fontSize: 11.5, color: C.sub, lineHeight: 1.4 }}>{blocker}</span>
        </div>
      )}
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <AdminGhostButton onClick={onCancel}>Cancel</AdminGhostButton>
        <div style={{ flex: 1 }}>
          <AdminPrimaryButton full disabled={!canSave} onClick={() => onSave(draft)}>
            {existing ? "Save rule" : "Add rule"}
          </AdminPrimaryButton>
        </div>
      </div>
    </div>
  );
}

function AdminLeadRulesScreen({ showToast }) {
  const [method, setMethod] = useState("load");
  const [rules, setRules] = useState([
    // Model-only rule (sources left at ALL) — proves the two dimensions are independent.
    { id: 1, showroom: "Whitefield", models: ["Alcazar"], sources: ["ALL"], levels: ["TL"], people: [3], mode: "exclusive" }, // Anil Kumar
  ]);
  const [building, setBuilding] = useState(null);

  const nameOf = (id) => (ADMIN_USERS_SEED.find(u => u.id === id) || {}).name || "?";
  const methodLabel = method === "load" ? "Equal distribution based on present load" : "Equal distribution";

  const ruleLabel = (r) => {
    const m = r.models.includes("ALL") ? null : r.models.join(", ");
    const s = r.sources.includes("ALL") ? null : r.sources.join(", ");
    if (m && s) return `${m} · ${s}`;
    return m || s || "All models · All sources";
  };
  const dimOverlaps = (a, b) => a.includes("ALL") || b.includes("ALL") || a.some(v => b.includes(v));
  const overlaps = (a, b) => a.showroom === b.showroom && dimOverlaps(a.models, b.models) && dimOverlaps(a.sources, b.sources);

  // Exclusive claims the combination outright, so it can always be saved — it just
  // displaces whatever was there. Additional only ever joins a pool; it cannot be saved
  // over an existing exclusive claim, since "add someone to an exclusive arrangement"
  // isn't a coherent thing to do — the exclusive rule has to change first.
  const blockedBy = (draft) => {
    if (draft.mode !== "additional") return null;
    const clash = rules.find(r => overlaps(r, draft) && r.mode === "exclusive" && r.id !== (building?.id));
    if (!clash) return null;
    return `${ruleLabel(clash)} in ${clash.showroom} is exclusive to ${clash.people.length ? clash.people.map(nameOf).join(", ") : clash.levels.map(l => ADMIN_LEVELS.find(x => x.key === l).label).join(", ")} — change or remove that rule first.`;
  };

  const saveRule = (f) => {
    const isEdit = building && building !== "new";
    const clashes = f.mode === "exclusive"
      ? rules.filter(r => overlaps(r, f) && (!isEdit || r.id !== building.id))
      : rules.filter(r => overlaps(r, f) && r.mode === "additional" && (!isEdit || r.id !== building.id));
    setRules(rs => {
      const kept = rs.filter(r => !clashes.includes(r));
      return isEdit
        ? kept.map(r => r.id === building.id ? { ...f, id: building.id } : r)
        : [...kept, { ...f, id: Math.max(0, ...rs.map(r => r.id)) + 1 }];
    });
    showToast(clashes.length ? `Replaced ${clashes.length} overlapping rule${clashes.length > 1 ? "s" : ""} for ${f.showroom}` : `Rule added for ${f.showroom}`);
    setBuilding(null);
  };
  const removeRule = (id) => { setRules(rs => rs.filter(r => r.id !== id)); showToast("Rule removed"); };

  return (
    <div style={{ padding: "14px 14px 90px" }}>
      <AdminScreenHeader title="Lead Rules" />

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14, marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 3 }}>
          <span style={{ flex: 1 }}>
            <span style={{ display: "block", fontFamily: F, fontSize: 13, fontWeight: 800, color: C.ink }}>Rules</span>
            <span style={{ display: "block", fontFamily: F, fontSize: 11, color: C.faint, marginTop: 2 }}>
              Only exceptions need one.
            </span>
          </span>
        </div>

        {/* The fallback is a visible row, not hidden text — what a lead uses when no rule
            below claims it. */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, border: `1.5px dashed ${C.borderStrong}`,
          borderRadius: 10, padding: "10px 11px", marginTop: 10 }}>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontFamily: F, fontSize: 13, fontWeight: 700, color: C.sub }}>
              All models <span style={{ color: C.faint, fontWeight: 500 }}>·</span> All sources <span style={{ color: C.faint, fontWeight: 500 }}>·</span> All showrooms
            </span>
            <span style={{ display: "block", fontFamily: F, fontSize: 11, color: C.faint, marginTop: 2 }}>
              Default — {methodLabel.toLowerCase()}
            </span>
          </span>
          <span style={{ fontFamily: F, fontSize: 9.5, fontWeight: 800, color: C.faint, textTransform: "uppercase",
            letterSpacing: 0.4, background: C.bg, borderRadius: 5, padding: "3px 7px" }}>Base rule</span>
        </div>

        {rules.map(r => (
          <div key={r.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, border: `1px solid ${C.border}`,
            borderRadius: 10, padding: "10px 11px", marginTop: 8 }}>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <span style={{ fontFamily: F, fontSize: 13, fontWeight: 700, color: C.ink }}>
                  {ruleLabel(r)} <span style={{ color: C.faint, fontWeight: 500 }}>in</span> {r.showroom}
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontFamily: F, fontSize: 9,
                  fontWeight: 800, color: r.mode === "exclusive" ? C.hot : C.teal,
                  background: r.mode === "exclusive" ? C.hotSoft : "rgba(0,105,92,0.08)",
                  borderRadius: 5, padding: "2px 6px", textTransform: "uppercase" }}>
                  {r.mode === "exclusive" ? <Lock size={9} /> : <UserPlus size={9} />}
                  {r.mode === "exclusive" ? "Only" : "Also"}
                </span>
              </span>
              <span style={{ display: "block", fontFamily: F, fontSize: 11, color: C.sub, marginTop: 3 }}>
                {r.levels.length === 0
                  ? "Whole showroom rotates"
                  : r.people.length > 0
                    ? r.people.map(nameOf).join(", ")
                    : `${r.levels.map(l => ADMIN_LEVELS.find(x => x.key === l).label).join(", ")} rotate`}
              </span>
            </span>
            <button type="button" onClick={() => setBuilding(r)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", flexShrink: 0 }}>
              <Pencil size={13} color={C.faint} /></button>
            <button type="button" onClick={() => removeRule(r.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", flexShrink: 0 }}>
              <Trash2 size={13} color={C.hot} /></button>
          </div>
        ))}

        {building ? (
          <div style={{ marginTop: 12 }}>
            <AdminRuleBuilder existing={building === "new" ? null : building} blockedBy={blockedBy} onSave={saveRule} onCancel={() => setBuilding(null)} />
          </div>
        ) : (
          <button type="button" onClick={() => setBuilding("new")} style={{ display: "flex", alignItems: "center", gap: 6,
            width: "100%", justifyContent: "center", padding: "11px 0", borderRadius: 10, marginTop: 12, cursor: "pointer",
            border: `1.5px dashed ${C.borderStrong}`, background: "none", fontFamily: F, fontWeight: 700, fontSize: 12.5, color: C.primary }}>
            <Plus size={14} />Add a rule
          </button>
        )}
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14, marginBottom: 14 }}>
        <div style={{ fontFamily: F, fontSize: 13, fontWeight: 800, color: C.ink, marginBottom: 3 }}>Distribution method</div>
        <div style={{ fontFamily: F, fontSize: 11, color: C.faint, marginBottom: 10, lineHeight: 1.4 }}>
          Used whenever more than one person is eligible.
        </div>
        {[["equal", "Equal distribution", "Rotates through the group in order, regardless of how many leads each person is already holding.", false],
          ["load", "Equal distribution based on present load", "Rotates through the group, but skips ahead of anyone already holding more open leads than the rest.", true]]
          .map(([k, l, d, rec]) => (
          <button key={k} type="button" onClick={() => setMethod(k)} style={{ display: "flex", alignItems: "flex-start", gap: 10,
            width: "100%", textAlign: "left", padding: "11px 12px", borderRadius: 10, marginBottom: 7, cursor: "pointer",
            border: `1.5px solid ${method === k ? C.primary : C.border}`, background: method === k ? C.primarySoft : C.card }}>
            <span style={{ width: 17, height: 17, borderRadius: "50%", flexShrink: 0, marginTop: 1,
              border: `1.5px solid ${method === k ? C.primary : C.borderStrong}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {method === k && <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.primary }} />}
            </span>
            <span style={{ minWidth: 0 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontFamily: F, fontSize: 13, fontWeight: 700, color: method === k ? C.primary : C.ink }}>{l}</span>
                {rec && <span style={{ background: C.greenSoft, color: C.green, borderRadius: 5, padding: "1px 6px",
                  fontFamily: F, fontSize: 9, fontWeight: 800 }}>RECOMMENDED</span>}
              </span>
              <span style={{ display: "block", fontFamily: F, fontSize: 11.5, color: C.sub, marginTop: 2, lineHeight: 1.4 }}>{d}</span>
            </span>
          </button>
        ))}
      </div>
      <AdminPrimaryButton full onClick={() => showToast("Lead allocation rules saved")}>Save allocation rules</AdminPrimaryButton>
    </div>
  );
}

/* ---------------- Locations ---------------- */
function adminEmptyLocation() { return { name: "", address: "", mapsLink: "", c1: "", c2: "", w1: "", w2: "", email: "" }; }

function AdminLocationForm({ loc, onSave, onCancel }) {
  const isNew = !loc;
  const [f, setF] = useState(loc || adminEmptyLocation());
  const canSave = f.name.trim() && f.address.trim();
  return (
    <div style={{ padding: "14px 14px 90px" }}>
      <button onClick={onCancel} style={{ display: "flex", alignItems: "center", gap: 5, background: "none",
        border: "none", cursor: "pointer", padding: "0 0 12px", fontFamily: F, fontSize: 12.5, fontWeight: 700,
        color: C.primary }}><ChevronLeft size={14} />Back</button>
      <AdminScreenHeader title={isNew ? "Add location" : `Edit ${f.name || "location"}`} />
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14 }}>
        <AdminField label="Name"><AdminInput value={f.name} onChange={e => setF({ ...f, name: e.target.value })} placeholder="Autoprism Hyundai — Branch" /></AdminField>
        <AdminField label="Address"><AdminTextArea rows={2} value={f.address} onChange={e => setF({ ...f, address: e.target.value })} placeholder="Full postal address" /></AdminField>
        <AdminField label="Google Maps link"><AdminInput value={f.mapsLink} onChange={e => setF({ ...f, mapsLink: e.target.value })} placeholder="https://maps.google.com/…" /></AdminField>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}><AdminField label="Contact no. 1"><AdminInput value={f.c1} onChange={e => setF({ ...f, c1: e.target.value })} placeholder="+91" /></AdminField></div>
          <div style={{ flex: 1 }}><AdminField label="Contact no. 2"><AdminInput value={f.c2} onChange={e => setF({ ...f, c2: e.target.value })} placeholder="Optional" /></AdminField></div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}><AdminField label="WhatsApp no. 1"><AdminInput value={f.w1} onChange={e => setF({ ...f, w1: e.target.value })} placeholder="+91" /></AdminField></div>
          <div style={{ flex: 1 }}><AdminField label="WhatsApp no. 2"><AdminInput value={f.w2} onChange={e => setF({ ...f, w2: e.target.value })} placeholder="Optional" /></AdminField></div>
        </div>
        <AdminField label="Email ID"><AdminInput value={f.email} onChange={e => setF({ ...f, email: e.target.value })} placeholder="branch@autoprism.in" /></AdminField>
        <AdminPrimaryButton full disabled={!canSave} onClick={() => onSave(f)}>{isNew ? "Add location" : "Save changes"}</AdminPrimaryButton>
      </div>
    </div>
  );
}

function AdminLocationCard({ loc, onEdit }) {
  return (
    <button onClick={() => onEdit(loc)} style={{ display: "block", width: "100%", textAlign: "left", background: C.card,
      border: `1px solid ${C.border}`, borderRadius: 13, padding: "12px 13px", marginBottom: 9, cursor: "pointer" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "block", fontFamily: F, fontSize: 13.5, fontWeight: 700, color: C.ink }}>{loc.name}</span>
          <span style={{ display: "block", fontFamily: F, fontSize: 11, color: C.faint, marginTop: 2, lineHeight: 1.4 }}>{loc.address}</span>
        </span>
        <Pencil size={13} color={C.ghost} style={{ flexShrink: 0, marginTop: 2 }} />
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 9, paddingTop: 9, borderTop: `1px solid ${C.border}` }}>
        {loc.c1 && <span style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: F, fontSize: 11, color: C.sub }}>
          <Phone size={11} color={C.faint} />{loc.c1}</span>}
        {loc.w1 && <span style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: F, fontSize: 11, color: C.green }}>
          <MessageSquare size={11} color={C.green} />{loc.w1}</span>}
        {loc.email && <span style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: F, fontSize: 11, color: C.sub }}>
          <Mail size={11} color={C.faint} />{loc.email}</span>}
        {loc.mapsLink && <span style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: F, fontSize: 11, color: C.teal }}>
          <MapPin size={11} color={C.teal} />Maps link set</span>}
      </div>
    </button>
  );
}

function AdminLocationsScreen({ showToast }) {
  const [locs, setLocs] = useState(ADMIN_LOCATIONS_SEED);
  const [editing, setEditing] = useState(null);

  const save = (f) => {
    if (editing === "new") {
      setLocs(l => [...l, { ...f, id: Math.max(0, ...l.map(x => x.id)) + 1 }]);
      showToast(`${f.name} added`);
    } else {
      setLocs(l => l.map(x => x.id === editing.id ? { ...x, ...f } : x));
      showToast(`${f.name} updated`);
    }
    setEditing(null);
  };

  if (editing) return <AdminLocationForm loc={editing === "new" ? null : editing} onSave={save} onCancel={() => setEditing(null)} />;

  return (
    <div style={{ padding: "14px 14px 90px" }}>
      <AdminScreenHeader title="Locations" blurb={`${locs.length} branches.`}
        action={<button onClick={() => setEditing("new")} style={{ padding: "9px 13px", borderRadius: 9, border: "none",
          background: C.primary, color: "#fff", fontFamily: F, fontWeight: 800, fontSize: 12, cursor: "pointer",
          whiteSpace: "nowrap" }}>+ Add</button>} />
      {locs.map(l => <AdminLocationCard key={l.id} loc={l} onEdit={setEditing} />)}
    </div>
  );
}

/* ---------------- Vehicles (renamed from Catalogue) ---------------- */
function adminOnRoad(v) { return v.exShowroom + v.rto + v.insurance + v.handling; }

function AdminVariantForm({ model, variant, onSave, onCancel }) {
  const isNew = !variant;
  const [f, setF] = useState(variant || { name: "", exShowroom: "", rto: "", insurance: "", handling: "" });
  const canSave = f.name.trim() && f.exShowroom !== "";
  const num = (v) => v === "" ? "" : Number(v.replace(/[^0-9]/g, ""));
  return (
    <div style={{ padding: "14px 14px 90px" }}>
      <button onClick={onCancel} style={{ display: "flex", alignItems: "center", gap: 5, background: "none",
        border: "none", cursor: "pointer", padding: "0 0 12px", fontFamily: F, fontSize: 12.5, fontWeight: 700,
        color: C.primary }}><ChevronLeft size={14} />Back</button>
      <AdminScreenHeader title={isNew ? `Add variant · ${model}` : `${model} ${f.name}`} />
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14 }}>
        <AdminField label="Variant name"><AdminInput value={f.name} onChange={e => setF({ ...f, name: e.target.value })} placeholder="e.g. SX(O)" /></AdminField>
        <AdminField label="Ex-showroom price"><AdminInput inputMode="numeric" value={f.exShowroom}
          onChange={e => setF({ ...f, exShowroom: num(e.target.value) })} placeholder="₹" /></AdminField>
        <AdminField label="RTO"><AdminInput inputMode="numeric" value={f.rto} onChange={e => setF({ ...f, rto: num(e.target.value) })} placeholder="₹" /></AdminField>
        <AdminField label="Insurance"><AdminInput inputMode="numeric" value={f.insurance} onChange={e => setF({ ...f, insurance: num(e.target.value) })} placeholder="₹" /></AdminField>
        <AdminField label="Handling / logistics"><AdminInput inputMode="numeric" value={f.handling} onChange={e => setF({ ...f, handling: num(e.target.value) })} placeholder="₹" /></AdminField>
        <div style={{ background: C.bg, borderRadius: 9, padding: "10px 11px", marginBottom: 14, display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontFamily: F, fontSize: 12, fontWeight: 700, color: C.sub }}>On-road total</span>
          <span style={{ fontFamily: F, fontSize: 13.5, fontWeight: 900, color: C.ink }}>
            {inr([f.exShowroom, f.rto, f.insurance, f.handling].every(x => x !== "") ? adminOnRoad({ exShowroom: +f.exShowroom, rto: +f.rto, insurance: +f.insurance, handling: +f.handling }) : null)}
          </span>
        </div>
        <AdminPrimaryButton full disabled={!canSave} onClick={() => onSave(f)}>{isNew ? "Add variant" : "Save changes"}</AdminPrimaryButton>
      </div>
    </div>
  );
}

// Shared by Vehicles pricing and Accessories — pick a mock extraction payload by kind.
// Real OCR happens server-side; what ships here is the review contract: extracted rows
// are editable and nothing saves until confirmed.
const ADMIN_EXTRACT_MOCKS = {
  pricing: [
    { model: "Alcazar", name: "Prestige", exShowroom: 1549900, rto: 139491, insurance: 58000, handling: 12000 },
    { model: "Alcazar", name: "Platinum", exShowroom: 1729900, rto: 155691, insurance: 63000, handling: 12000 },
    { model: "Alcazar", name: "Signature 7-str", exShowroom: 1929900, rto: 173691, insurance: 69000, handling: 12000 },
  ],
  accessories: [
    { model: "Alcazar", name: "Roof Rails", price: 7500 },
    { model: "Alcazar", name: "Ambient Lighting Kit", price: 4200 },
    { model: "Alcazar", name: "Boot Organiser", price: 1800 },
  ],
};

function AdminExtractUpload({ kind, onExtracted }) {
  const fileRef = useRef(null);
  const camRef = useRef(null);
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const label = kind === "accessories" ? "an accessories price list" : "a price list";

  const pick = (f) => {
    if (!f) return;
    setFile(f);
    setBusy(true);
    setTimeout(() => { setBusy(false); onExtracted(ADMIN_EXTRACT_MOCKS[kind], f.name); }, 1400);
  };

  return (
    <div style={{ background: C.card, border: `1.5px dashed ${C.borderStrong}`, borderRadius: 14, padding: 16,
      marginBottom: 14, textAlign: "center" }}>
      <input ref={fileRef} type="file" accept="image/*,.pdf" style={{ display: "none" }}
        onChange={e => pick(e.target.files[0])} />
      <input ref={camRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }}
        onChange={e => pick(e.target.files[0])} />
      {busy ? (
        <>
          <Sparkles size={22} color={C.primary} />
          <div style={{ fontFamily: F, fontSize: 13, fontWeight: 700, color: C.ink, marginTop: 8 }}>Reading {file?.name}…</div>
          <div style={{ fontFamily: F, fontSize: 11, color: C.faint, marginTop: 3 }}>Extracting model and pricing.</div>
        </>
      ) : (
        <>
          <Upload size={20} color={C.faint} />
          <div style={{ fontFamily: F, fontSize: 13, fontWeight: 700, color: C.ink, marginTop: 8 }}>Upload {label}</div>
          <div style={{ fontFamily: F, fontSize: 11, color: C.faint, marginTop: 3, marginBottom: 11 }}>
            Auto-read — you review before saving.
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            <AdminGhostButton onClick={() => camRef.current.click()}>Take photo</AdminGhostButton>
            <AdminGhostButton onClick={() => fileRef.current.click()}>Choose file</AdminGhostButton>
          </div>
        </>
      )}
    </div>
  );
}

function AdminExtractReview({ sourceName, rows, onDiscard, onConfirm }) {
  const [edited, setEdited] = useState(rows);
  const set = (i, k, v) => setEdited(e => e.map((r, ix) => ix === i ? { ...r, [k]: k === "name" || k === "model" ? v : Number(v.replace(/[^0-9]/g, "")) } : r));
  return (
    <div style={{ background: C.card, border: `1.5px solid ${C.primary}44`, borderRadius: 14, padding: 14, marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
        <CheckCircle2 size={14} color={C.green} />
        <span style={{ fontFamily: F, fontSize: 13, fontWeight: 800, color: C.ink }}>
          {edited.length} variants read from {sourceName}
        </span>
      </div>
      <div style={{ fontFamily: F, fontSize: 11, color: C.faint, marginBottom: 11, lineHeight: 1.4 }}>
        Double-check the numbers before saving.
      </div>
      {edited.map((r, i) => (
        <div key={i} style={{ border: `1px solid ${C.border}`, borderRadius: 10, padding: 10, marginBottom: 8, background: C.bg }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
            <AdminInput value={r.model} onChange={e => set(i, "model", e.target.value)} style={{ flex: 1, fontSize: 12.5 }} />
            <AdminInput value={r.name} onChange={e => set(i, "name", e.target.value)} style={{ flex: 1, fontSize: 12.5 }} />
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {["exShowroom", "rto", "insurance", "handling"].map(k => (
              <AdminInput key={k} inputMode="numeric" value={String(r[k])} onChange={e => set(i, k, e.target.value)}
                style={{ flex: 1, fontSize: 11.5, padding: "7px 8px" }} />
            ))}
          </div>
          <div style={{ fontFamily: F, fontSize: 10, color: C.faint, marginTop: 4 }}>
            Model · Variant · Ex-showroom · RTO · Insurance · Handling — on-road {inr(adminOnRoad(r))}
          </div>
        </div>
      ))}
      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <AdminGhostButton onClick={onDiscard}>Discard</AdminGhostButton>
        <div style={{ flex: 1 }}><AdminPrimaryButton full onClick={() => onConfirm(edited)}>Add {edited.length} to vehicles</AdminPrimaryButton></div>
      </div>
    </div>
  );
}

function AdminAccessoryForm({ model, item, onSave, onCancel }) {
  const isNew = !item;
  const [f, setF] = useState(item || { name: "", price: "" });
  const canSave = f.name.trim() && f.price !== "";
  const num = (v) => v === "" ? "" : Number(v.replace(/[^0-9]/g, ""));
  return (
    <div style={{ padding: "14px 14px 90px" }}>
      <button onClick={onCancel} style={{ display: "flex", alignItems: "center", gap: 5, background: "none",
        border: "none", cursor: "pointer", padding: "0 0 12px", fontFamily: F, fontSize: 12.5, fontWeight: 700,
        color: C.primary }}><ChevronLeft size={14} />Back</button>
      <AdminScreenHeader title={isNew ? `Add accessory · ${model}` : `${model} — ${f.name}`} />
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14 }}>
        <AdminField label="Accessory name"><AdminInput value={f.name} onChange={e => setF({ ...f, name: e.target.value })} placeholder="e.g. Roof Rails" /></AdminField>
        <AdminField label="Price"><AdminInput inputMode="numeric" value={f.price} onChange={e => setF({ ...f, price: num(e.target.value) })} placeholder="₹" /></AdminField>
        <AdminPrimaryButton full disabled={!canSave} onClick={() => onSave(f)}>{isNew ? "Add accessory" : "Save changes"}</AdminPrimaryButton>
      </div>
    </div>
  );
}

function AdminAccessoryExtractReview({ sourceName, rows, onDiscard, onConfirm }) {
  const [edited, setEdited] = useState(rows);
  const set = (i, k, v) => setEdited(e => e.map((r, ix) => ix === i ? { ...r, [k]: k === "price" ? Number(v.replace(/[^0-9]/g, "")) : v } : r));
  return (
    <div style={{ background: C.card, border: `1.5px solid ${C.primary}44`, borderRadius: 14, padding: 14, marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
        <CheckCircle2 size={14} color={C.green} />
        <span style={{ fontFamily: F, fontSize: 13, fontWeight: 800, color: C.ink }}>{edited.length} accessories read from {sourceName}</span>
      </div>
      <div style={{ fontFamily: F, fontSize: 11, color: C.faint, marginBottom: 11 }}>Double-check the numbers before saving.</div>
      {edited.map((r, i) => (
        <div key={i} style={{ display: "flex", gap: 6, border: `1px solid ${C.border}`, borderRadius: 10, padding: 10, marginBottom: 8, background: C.bg }}>
          <AdminInput value={r.model} onChange={e => set(i, "model", e.target.value)} style={{ flex: 1, fontSize: 12.5 }} />
          <AdminInput value={r.name} onChange={e => set(i, "name", e.target.value)} style={{ flex: 1.4, fontSize: 12.5 }} />
          <AdminInput inputMode="numeric" value={String(r.price)} onChange={e => set(i, "price", e.target.value)} style={{ flex: 0.8, fontSize: 12.5 }} />
        </div>
      ))}
      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <AdminGhostButton onClick={onDiscard}>Discard</AdminGhostButton>
        <div style={{ flex: 1 }}><AdminPrimaryButton full onClick={() => onConfirm(edited)}>Add {edited.length} accessories</AdminPrimaryButton></div>
      </div>
    </div>
  );
}

function AdminAccessoriesScreen({ showToast }) {
  const [data, setData] = useState(ADMIN_ACCESSORIES_SEED);
  const [open, setOpen] = useState(new Set(["Creta"]));
  const [editing, setEditing] = useState(null);
  const [extracted, setExtracted] = useState(null);
  const toggle = (m) => setOpen(s => { const n = new Set(s); if (n.has(m)) n.delete(m); else n.add(m); return n; });

  const saveItem = (model, original, f) => {
    setData(d => d.map(m => m.model !== model ? m : {
      ...m, items: original ? m.items.map(it => it.name === original.name ? f : it) : [...m.items, { ...f, updated: "Today" }],
    }));
    showToast(`${model} — ${f.name} saved`);
    setEditing(null);
  };
  const deleteItem = (model, name) => {
    setData(d => d.map(m => m.model !== model ? m : { ...m, items: m.items.filter(it => it.name !== name) }));
    showToast(`${name} removed`);
  };
  const confirmExtracted = (rows) => {
    setData(d => {
      const next = [...d];
      rows.forEach(r => {
        let m = next.find(x => x.model === r.model);
        if (!m) { m = { model: r.model, items: [] }; next.push(m); }
        m.items = [...m.items, { name: r.name, price: r.price, updated: "Today" }];
      });
      return next;
    });
    showToast(`${rows.length} accessories added from upload`);
    setExtracted(null);
  };

  if (editing) return (
    <AdminAccessoryForm model={editing.model} item={editing.item}
      onSave={(f) => saveItem(editing.model, editing.item, f)} onCancel={() => setEditing(null)} />
  );

  const grand = data.reduce((n, m) => n + m.items.length, 0);

  return (
    <>
      <div style={{ fontFamily: F, fontSize: 11.5, color: C.sub, marginTop: -6, marginBottom: 13 }}>
        {data.length} models · {grand} accessories on file.
      </div>
      <AdminExtractUpload kind="accessories" onExtracted={(rows, name) => setExtracted({ name, rows })} />
      {extracted && <AdminAccessoryExtractReview sourceName={extracted.name} rows={extracted.rows}
        onDiscard={() => setExtracted(null)} onConfirm={confirmExtracted} />}

      {data.map(m => {
        const isOpen = open.has(m.model);
        return (
          <div key={m.model} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, marginBottom: 8, overflow: "hidden" }}>
            <button onClick={() => toggle(m.model)} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%",
              padding: "12px 13px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
              {isOpen ? <ChevronDown size={13} color={C.faint} /> : <ChevronRight size={13} color={C.faint} />}
              <span style={{ flex: 1, fontFamily: F, fontSize: 13.5, fontWeight: 700, color: C.ink }}>{m.model}</span>
              <span style={{ fontFamily: F, fontSize: 11.5, color: C.faint }}>{m.items.length}</span>
            </button>
            {isOpen && (
              <>
                {m.items.map(it => (
                  <div key={it.name} style={{ display: "flex", alignItems: "center", padding: "9px 13px", borderTop: `1px solid ${C.border}` }}>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: "block", fontFamily: F, fontSize: 12.5, fontWeight: 600, color: C.ink }}>{it.name}</span>
                      <span style={{ display: "block", fontFamily: F, fontSize: 10.5, color: C.faint }}>Updated {it.updated}</span>
                    </span>
                    <span style={{ fontFamily: F, fontSize: 12.5, fontWeight: 800, color: C.ink, marginRight: 8 }}>{inr(it.price)}</span>
                    <button onClick={() => setEditing({ model: m.model, item: it })} style={{ background: "none", border: "none", cursor: "pointer", padding: 3, display: "flex" }}>
                      <Pencil size={13} color={C.faint} /></button>
                    <button onClick={() => deleteItem(m.model, it.name)} style={{ background: "none", border: "none", cursor: "pointer", padding: 3, display: "flex" }}>
                      <Trash2 size={13} color={C.hot} /></button>
                  </div>
                ))}
                <button onClick={() => setEditing({ model: m.model, item: null })} style={{ display: "flex", alignItems: "center",
                  gap: 5, width: "100%", padding: "9px 13px", background: "none", border: "none", borderTop: `1px solid ${C.border}`,
                  cursor: "pointer", fontFamily: F, fontSize: 12, fontWeight: 700, color: C.primary }}>
                  <Plus size={13} />Add accessory to {m.model}
                </button>
              </>
            )}
          </div>
        );
      })}
    </>
  );
}

function AdminVehiclesScreen({ showToast }) {
  const [tab, setTab] = useState("pricing");
  const [data, setData] = useState(ADMIN_VEHICLES_SEED);
  const [open, setOpen] = useState(new Set(["Creta"]));
  const [editing, setEditing] = useState(null);
  const [extracted, setExtracted] = useState(null);
  const toggle = (m) => setOpen(s => { const n = new Set(s); if (n.has(m)) n.delete(m); else n.add(m); return n; });

  const saveVariant = (model, original, f) => {
    setData(d => d.map(m => m.model !== model ? m : {
      ...m, variants: original ? m.variants.map(v => v.name === original.name ? f : v) : [...m.variants, { ...f, updated: "Today" }],
    }));
    showToast(`${model} ${f.name} saved`);
    setEditing(null);
  };
  const deleteVariant = (model, name) => {
    setData(d => d.map(m => m.model !== model ? m : { ...m, variants: m.variants.filter(v => v.name !== name) }));
    showToast(`${model} ${name} removed`);
  };
  const confirmExtracted = (rows) => {
    setData(d => {
      const next = [...d];
      rows.forEach(r => {
        let m = next.find(x => x.model === r.model);
        if (!m) { m = { model: r.model, variants: [] }; next.push(m); }
        m.variants = [...m.variants, { name: r.name, exShowroom: r.exShowroom, rto: r.rto, insurance: r.insurance, handling: r.handling, updated: "Today" }];
      });
      return next;
    });
    showToast(`${rows.length} variants added from upload`);
    setExtracted(null);
  };

  if (editing) return (
    <AdminVariantForm model={editing.model} variant={editing.variant}
      onSave={(f) => saveVariant(editing.model, editing.variant, f)} onCancel={() => setEditing(null)} />
  );

  const grand = data.reduce((n, m) => n + m.variants.length, 0);

  return (
    <div style={{ padding: "14px 14px 90px" }}>
      <AdminScreenHeader title="Vehicles" />
      <div style={{ display: "flex", gap: 5, marginBottom: 12 }}>
        {[["pricing", "Pricing"], ["accessories", "Accessories"]].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} style={{ flex: 1, padding: "8px 0", borderRadius: 9, cursor: "pointer",
            border: `1.5px solid ${tab === k ? C.primary : C.border}`, background: tab === k ? C.primarySoft : C.card,
            color: tab === k ? C.primary : C.sub, fontFamily: F, fontWeight: 700, fontSize: 12 }}>{l}</button>
        ))}
      </div>

      {tab === "accessories" ? <AdminAccessoriesScreen showToast={showToast} /> : (
        <>
          <div style={{ fontFamily: F, fontSize: 11.5, color: C.sub, marginTop: -6, marginBottom: 13 }}>
            {data.length} models · {grand} variants with pricing on file.
          </div>
          <AdminExtractUpload kind="pricing" onExtracted={(rows, name) => setExtracted({ name, rows })} />
          {extracted && <AdminExtractReview sourceName={extracted.name} rows={extracted.rows}
            onDiscard={() => setExtracted(null)} onConfirm={confirmExtracted} />}

          {data.map(m => {
            const isOpen = open.has(m.model);
            return (
              <div key={m.model} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, marginBottom: 8, overflow: "hidden" }}>
                <button onClick={() => toggle(m.model)} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%",
                  padding: "12px 13px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
                  {isOpen ? <ChevronDown size={13} color={C.faint} /> : <ChevronRight size={13} color={C.faint} />}
                  <span style={{ flex: 1, fontFamily: F, fontSize: 13.5, fontWeight: 700, color: C.ink }}>{m.model}</span>
                  <span style={{ fontFamily: F, fontSize: 11.5, color: C.faint }}>{m.variants.length} variants</span>
                </button>
                {isOpen && (
                  <>
                    <div style={{ display: "flex", padding: "6px 13px", background: C.bg, borderTop: `1px solid ${C.border}` }}>
                      <span style={{ flex: 1.3, fontFamily: F, fontSize: 9, fontWeight: 800, color: C.sub, textTransform: "uppercase" }}>Variant</span>
                      <span style={{ flex: 1, textAlign: "right", fontFamily: F, fontSize: 9, fontWeight: 800, color: C.sub, textTransform: "uppercase" }}>Ex-showroom</span>
                      <span style={{ flex: 1, textAlign: "right", fontFamily: F, fontSize: 9, fontWeight: 800, color: C.primary, textTransform: "uppercase" }}>On-road</span>
                      <span style={{ width: 46 }} />
                    </div>
                    {m.variants.map(v => (
                      <div key={v.name} style={{ display: "flex", alignItems: "center", padding: "9px 13px", borderTop: `1px solid ${C.border}` }}>
                        <span style={{ flex: 1.3, minWidth: 0 }}>
                          <span style={{ display: "block", fontFamily: F, fontSize: 12.5, fontWeight: 600, color: C.ink }}>{v.name}</span>
                          <span style={{ display: "block", fontFamily: F, fontSize: 10.5, color: C.faint }}>Updated {v.updated}</span>
                        </span>
                        <span style={{ flex: 1, textAlign: "right", fontFamily: F, fontSize: 12, color: C.sub }}>{inr(v.exShowroom)}</span>
                        <span style={{ flex: 1, textAlign: "right", fontFamily: F, fontSize: 12.5, fontWeight: 800, color: C.ink }}>{inr(adminOnRoad(v))}</span>
                        <span style={{ width: 46, display: "flex", justifyContent: "flex-end", gap: 4 }}>
                          <button onClick={() => setEditing({ model: m.model, variant: v })} style={{ background: "none", border: "none", cursor: "pointer", padding: 3, display: "flex" }}>
                            <Pencil size={13} color={C.faint} /></button>
                          <button onClick={() => deleteVariant(m.model, v.name)} style={{ background: "none", border: "none", cursor: "pointer", padding: 3, display: "flex" }}>
                            <Trash2 size={13} color={C.hot} /></button>
                        </span>
                      </div>
                    ))}
                    <button onClick={() => setEditing({ model: m.model, variant: null })} style={{ display: "flex", alignItems: "center",
                      gap: 5, width: "100%", padding: "9px 13px", background: "none", border: "none", borderTop: `1px solid ${C.border}`,
                      cursor: "pointer", fontFamily: F, fontSize: 12, fontWeight: 700, color: C.primary }}>
                      <Plus size={13} />Add variant to {m.model}
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

/* ============================ BOARD ============================ */
/* ============================ BOOKING CANCELLATION REQUESTS ============================
   Short cards — customer, vehicle, why, how much is at stake — that open straight into
   the same full lead screen every other part of the app uses, exactly like tapping a
   lead anywhere else. No separate mini-record; a cancellation request is a real lead in
   a bad moment, not a different kind of object. */

const ADMIN_CANCEL_REASONS = ["Found a better deal elsewhere", "Finance wasn't approved",
  "Family opposed the purchase", "Delivery delayed too long", "Changed their mind on the variant",
  "Personal emergency"];

// Same choice the SE app gives — WhatsApp isn't one action, it's a message or a voice
// call over WhatsApp, and which one matters enough to ask every time.
function ManagerWhatsAppPicker({ lead, onCancel, onPick }) {
  const phone = (lead?.phone || "").replace(/[^0-9]/g, "");
  const OPTS = [
    { key: "WhatsApp Call", note: "Voice call over WhatsApp", Icon: Phone, href: `https://wa.me/${phone}` },
    { key: "WhatsApp Message", note: "Send a message", Icon: MessageSquare, href: `https://wa.me/${phone}` },
  ];
  return (
    <div onClick={e => e.stopPropagation()} style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
      <div style={{ fontFamily: F, fontSize: 9.5, fontWeight: 800, color: C.faint, textTransform: "uppercase",
        letterSpacing: 0.5, marginBottom: 8 }}>How do you want to reach them?</div>
      <div style={{ display: "flex", gap: 8 }}>
        {OPTS.map(o => (
          <button key={o.key} type="button" onClick={() => { try { window.open(o.href, "_blank", "noopener"); } catch (e) { /* sandboxed */ } onPick(o.key); }}
            style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5, padding: "11px 8px",
              borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.card, cursor: "pointer" }}>
            <o.Icon size={17} color={C.green} />
            <span style={{ fontFamily: F, fontSize: 11, fontWeight: 700, color: C.ink }}>{o.key}</span>
            <span style={{ fontFamily: F, fontSize: 9, color: C.faint }}>{o.note}</span>
          </button>
        ))}
      </div>
      <button onClick={onCancel} style={{ display: "block", width: "100%", textAlign: "center", background: "none",
        border: "none", cursor: "pointer", marginTop: 8, fontFamily: F, fontWeight: 700, fontSize: 11, color: C.sub }}>Cancel</button>
    </div>
  );
}

function AdminCancellationCard({ lead, onOpen, onLogCall, showToast }) {
  const seed = lead.id * 71;
  const reason = ADMIN_CANCEL_REASONS[seed % ADMIN_CANCEL_REASONS.length];
  const daysPending = 1 + (seed % 9);
  const urgent = daysPending >= 6;
  const [mode, setMode] = useState(null); // null | "call" | "whatsapp"
  return (
    <div onClick={() => onOpen(lead)} style={{ background: C.card, border: `1px solid ${C.border}`,
      borderLeft: `3px solid ${C.hot}`, borderRadius: 12, padding: "12px 13px", marginBottom: 9, cursor: "pointer" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontFamily: F, fontSize: 13.5, fontWeight: 700, color: C.ink }}>{lead.name}</span>
            {urgent && <span style={{ fontFamily: F, fontSize: 9.5, fontWeight: 800, color: C.hot,
              background: C.hotSoft, borderRadius: 5, padding: "1px 6px" }}>URGENT</span>}
          </span>
          <span style={{ display: "block", fontFamily: F, fontSize: 11.5, color: C.sub, marginTop: 2 }}>
            {lead.model} · {lead.owner.split(" ")[0]}
          </span>
        </span>
        <span style={{ textAlign: "right", flexShrink: 0 }}>
          <span style={{ display: "block", fontFamily: F, fontSize: 12, fontWeight: 800, color: C.ink }}>{inr(lead.value)}</span>
          <span style={{ display: "block", fontFamily: F, fontSize: 10, color: C.faint, marginTop: 2 }}>car value</span>
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 5, marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.border}` }}>
        <AlertTriangle size={12} color={C.warm} style={{ flexShrink: 0, marginTop: 1.5 }} />
        <span style={{ fontFamily: F, fontSize: 11.5, color: C.ink, lineHeight: 1.4 }}>
          {reason} <span style={{ color: C.faint }}>· requested {daysPending}d ago</span>
        </span>
      </div>
      <div style={{ display: "flex", gap: 7, marginTop: 9 }}>
        <ManagerActionBtn icon={Phone} label="Call" filled onClick={() => setMode(mode === "call" ? null : "call")} />
        <ManagerActionBtn icon={MessageSquare} label="WhatsApp" onClick={() => setMode(mode === "whatsapp" ? null : "whatsapp")} />
      </div>
      {mode === "call" && (
        <ManagerCallLogForm lead={lead} onCancel={() => setMode(null)}
          onSubmit={(outcome, note) => { onLogCall(lead, outcome, note); setMode(null); showToast(`Call with ${lead.name.split(" ")[0]} logged`); }} />
      )}
      {mode === "whatsapp" && (
        <ManagerWhatsAppPicker lead={lead} onCancel={() => setMode(null)}
          onPick={(choice) => { setMode(null); showToast(`${choice} opened with ${lead.name.split(" ")[0]}`); }} />
      )}
    </div>
  );
}

function BoardScreen({ actions, onResolve, onPick, org, onDrill, onOpenLead, handling = {}, onLogFollowUp, onOpenCancellation, onLogCall, showToast }) {
  const nameOf = (id) => (flatten(ORG).find(s2 => s2.id === id) || {}).name || "";
  const cancellations = onOpenCancellation ? LEADS
    .filter(l => (l.stage === "Booking" || l.stage === "Retailed") && l.id % 11 === 0)
    .map(l => ({ ...l, owner: nameOf(l.ownerId) })) : [];
  const r = roll(org);
  const [expanded, setExpanded] = useState(new Set([org.id]));
  const toggle = (id) => setExpanded(s => {
    const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n;
  });

  // Once the manager takes over a close, its next call is theirs — so it sits in the same
  // queue as approvals and escalations rather than in a separate place they'd forget.
  const followUps = Object.keys(handling).map(Number)
    .map(id => LEADS.find(l => l.id === id)).filter(Boolean)
    .map(l => ({ id: "fu-" + l.id, kind: "followup", lead: l, type: "Your follow-up",
      customer: l.name, model: l.model, raisedBy: l.owner, age: `${l.days}d in stage`,
      urgent: l.days >= 10, detail: l.next, Icon: Clock, tone: "#5C5A54" }));
  const queue = [...actions, ...followUps];
  const urgent = queue.filter(a => a.urgent).length;

  return (
    <div style={{ padding: "14px 14px 90px" }}>
      <div style={{ background: C.card, borderRadius: 16, padding: "14px 10px", marginBottom: 10, boxShadow: shadow }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3, paddingLeft: 4 }}>
          <Target size={14} color={C.primary} />
          <span style={{ flex: 1, fontFamily: F, fontSize: 13.5, fontWeight: 800, color: C.ink }}>
            Target achievement
          </span>
        </div>
        <div style={{ fontFamily: F, fontSize: 10.5, color: C.faint, marginBottom: 8, paddingLeft: 4 }}>
          Tap a name to expand, a number to drill in.
        </div>
        <div style={{ display: "flex", gap: 11, marginBottom: 9, paddingLeft: 4 }}>
          {[["Sales Manager", "SM"], ["Team Leader", "TL"], ["Sales Executive", "SE"]].map(([role, short]) => (
            <span key={short} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 3, height: 11, borderRadius: 2, background: ROLE_TONE[role] }} />
              <span style={{ fontFamily: F, fontSize: 9.5, color: C.faint }}>{short}</span>
            </span>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: 7,
          borderBottom: `1.5px solid ${C.borderStrong}` }}>
          <span style={{ flex: 1, fontFamily: F, fontSize: 9, fontWeight: 800, color: C.sub,
            textTransform: "uppercase", letterSpacing: 0.4, paddingLeft: 5 }}>Name</span>
          <span style={{ width: 42, textAlign: "center", fontFamily: F, fontSize: 9, fontWeight: 800,
            color: C.sub, textTransform: "uppercase" }}>Target</span>
          <span style={{ width: 44, textAlign: "center", fontFamily: F, fontSize: 9, fontWeight: 800,
            color: C.sub, textTransform: "uppercase" }}>Retail</span>
          <span style={{ width: 40, textAlign: "center", fontFamily: F, fontSize: 9, fontWeight: 800,
            color: C.sub, textTransform: "uppercase" }}>Book</span>
          <span style={{ width: 62, textAlign: "right", paddingRight: 4, fontFamily: F, fontSize: 9,
            fontWeight: 800, color: C.sub, textTransform: "uppercase" }}>Value</span>
        </div>
        <TargetRow node={org} depth={0} expanded={expanded} onToggle={toggle} onPick={onPick} onDrill={onDrill} />
      </div>

      {onOpenCancellation && (
        <div style={{ background: C.card, borderRadius: 16, padding: 14, marginBottom: 10, boxShadow: shadow }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
            <AlertTriangle size={14} color={C.hot} />
            <span style={{ flex: 1, fontFamily: F, fontSize: 13.5, fontWeight: 800, color: C.ink }}>
              Cancellation Requests
            </span>
            {cancellations.length > 0 && (
              <span style={{ background: C.hotSoft, color: C.hot, borderRadius: 999, padding: "2px 8px",
                fontFamily: F, fontSize: 10.5, fontWeight: 700 }}>{cancellations.length}</span>
            )}
          </div>
          <div style={{ fontFamily: F, fontSize: 10.5, color: C.faint, marginBottom: 10 }}>
            Booked deals asking to cancel.
          </div>
          {cancellations.length === 0
            ? <div style={{ fontFamily: F, fontSize: 12, color: C.sub, textAlign: "center", padding: "8px 0" }}>Nothing pending.</div>
            : cancellations.map(l => <AdminCancellationCard key={l.id} lead={l} onOpen={onOpenCancellation} onLogCall={onLogCall} showToast={showToast} />)}
        </div>
      )}

      <div style={{ background: C.card, borderRadius: 16, padding: 14, marginBottom: 10, boxShadow: shadow }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
          <span style={{ flex: 1, fontFamily: F, fontSize: 13.5, fontWeight: 800, color: C.ink }}>
            Needs your action
          </span>
          {queue.length > 0 && (
            <span style={{ background: C.bg, color: C.sub,
              borderRadius: 999, padding: "2px 8px", fontFamily: F, fontSize: 10.5, fontWeight: 700 }}>
              {urgent ? `${urgent} of ${queue.length} urgent` : `${queue.length} waiting`}
            </span>
          )}
        </div>
        <div style={{ fontFamily: F, fontSize: 10.5, color: C.faint, marginBottom: 11 }}>
          Approvals, escalations, and your follow-ups.
        </div>
        {queue.length === 0 ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0" }}>
            <CheckCircle2 size={15} color={C.green} />
            <span style={{ fontFamily: F, fontSize: 13, fontWeight: 700, color: C.green }}>
              Nothing waiting on you
            </span>
          </div>
        ) : queue.map(a => <ActionCard key={a.id} item={a} onResolve={onResolve}
              onOpenLead={a.kind === "followup" ? () => onOpenLead(a) : onOpenLead}
              onLogFollowUp={onLogFollowUp} />)}
      </div>
    </div>
  );
}

function RepSheet({ rep, onClose, showToast }) {
  const r = roll(rep);
  const funnel = [["Leads", r.leads], ["Opp", r.opportunity], ["TD", r.td],
                  ["Book", r.booking], ["Retail", r.retailed]];
  const perUnit = r.retailed ? Math.round(r.discountTotal / r.retailed) : 0;
  const flags = [];
  if (r.retailed < r.target * 0.5 && DAY_OF_MONTH > 15)
    flags.push(`${r.retailed} of ${r.target} with ${DAYS_LEFT} days left`);
  if (rep.prevRetailed != null && r.retailed < rep.prevRetailed)
    flags.push(`Down from ${rep.prevRetailed} last month`);
  if (perUnit > DISCOUNT_CAP) flags.push(`${inr(perUnit)} discount per unit against a ${inr(DISCOUNT_CAP)} cap`);
  if (rep.respHrs > 4) flags.push(`${rep.respHrs}h to first response`);
  if (rep.streak != null && rep.streak <= 3) flags.push(`Logging streak down to ${rep.streak} days`);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", flexDirection: "column",
      justifyContent: "flex-end" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)" }} onClick={onClose} />
      <div style={{ position: "relative", background: C.card, borderRadius: "18px 18px 0 0",
        padding: 16, maxHeight: "86vh", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 14 }}>
          <Avatar r={rep} size={42} />
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontFamily: F, fontSize: 16.5, fontWeight: 800, color: C.ink }}>
              {rep.name}
            </span>
            <span style={{ display: "block", fontFamily: F, fontSize: 11, color: C.faint }}>
              {rep.role} · {r.retailed}/{r.target} retails · {inr(r.salesValue)}
            </span>
          </span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            <X size={18} color={C.sub} />
          </button>
        </div>
        <div style={{ display: "flex", marginBottom: 14, paddingBottom: 11, borderBottom: `1px solid ${C.border}` }}>
          {funnel.map(([l, v], i) => (
            <span key={l} style={{ flex: 1, textAlign: "center" }}>
              <span style={{ display: "block", fontFamily: F, fontSize: 15.5, fontWeight: 900, color: C.ink }}>{v}</span>
              <span style={{ display: "block", fontFamily: F, fontSize: 10, color: C.faint,
                textTransform: "uppercase", marginTop: 2 }}>{l}</span>
              {i > 0 && <span style={{ display: "block", fontFamily: F, fontSize: 9.5, color: C.ghost,
                marginTop: 1 }}>{pct(v, funnel[i - 1][1])}%</span>}
            </span>
          ))}
        </div>
        {flags.length > 0 && (
          <>
            <div style={{ fontFamily: F, fontSize: 10.5, fontWeight: 800, color: C.faint,
              textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 7 }}>Flags</div>
            {flags.map((f, i) => (
              <div key={i} style={{ display: "flex", gap: 7, marginBottom: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", marginTop: 5, flexShrink: 0,
                  background: C.warm }} />
                <span style={{ fontFamily: F, fontSize: 12, color: C.sub, lineHeight: 1.4 }}>{f}</span>
              </div>
            ))}
          </>
        )}
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <button onClick={() => { showToast(`Leads from ${rep.name.split(" ")[0]} ready to transfer`); onClose(); }}
            style={{ flex: 1, padding: "13px 0", borderRadius: 11, cursor: "pointer",
              border: `1.5px solid ${C.borderStrong}`, background: C.card, color: C.sub,
              fontFamily: F, fontWeight: 700, fontSize: 13 }}>Transfer leads</button>
          <button onClick={() => { showToast(`1:1 scheduled with ${rep.name.split(" ")[0]}`); onClose(); }}
            style={{ flex: 1.3, padding: "13px 0", borderRadius: 11, border: "none", background: C.primary,
              color: "#fff", fontFamily: F, fontWeight: 800, fontSize: 13, cursor: "pointer" }}>
            Schedule a 1:1
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================ MESSAGING ============================
   India-specific: TRAI's DLT registration governs any commercial SMS (Telecom Commercial
   Communications Customer Preference Regulations, 2018 — TCCCPR), WhatsApp's Business
   Policy governs template messaging, and the DPDP Act, 2023 governs consent for storing
   and using a customer's phone number, email and preferences at all. */

/* ============================ MESSAGING ============================
   Templates first — an SMS or WhatsApp send is only ever a template, so that is the one
   object this screen manages. TRAI splits commercial SMS into Transactional and
   Promotional/Marketing on the DLT platform, which is why that split is a real filter
   here, not decoration. SMS uses the DLT {#var#} variable syntax; WhatsApp templates use
   Meta's {{1}} numbered-placeholder syntax — genuinely different formats, kept distinct. */

const ADMIN_SMS_LIMIT = 160;      // GSM-7 single segment; concatenated parts drop to 153
const ADMIN_SMS_SEGMENT = 153;
const ADMIN_WA_LIMIT = 1024;     // Meta's hard cap on a template body — not a billing tier

// SMS bills per segment (153 chars each once past the first 160); WhatsApp has no
// multi-message concept — going over 1024 just means the template can't be approved.
function adminMessageMeter(text, channel) {
  if (channel !== "SMS") {
    const over = text.length > ADMIN_WA_LIMIT;
    return { limit: ADMIN_WA_LIMIT, segments: 1, over,
      note: over ? `Over the ${ADMIN_WA_LIMIT}-character template limit — won't be accepted for approval.` : "" };
  }
  const segments = text.length <= ADMIN_SMS_LIMIT ? (text.length ? 1 : 1) : Math.ceil(text.length / ADMIN_SMS_SEGMENT);
  return { limit: ADMIN_SMS_LIMIT, segments,
    note: segments > 1 ? `Over 160 characters — sends and bills as ${segments} SMS.` : "" };
}
const ADMIN_STATUS_TONE = { Approved: C.green, Pending: C.warm, Rejected: C.hot };

const ADMIN_TEMPLATES_SEED = [
  { id: 1, name: "Welcome", channel: "SMS", type: "Transactional", status: "Approved",
    ref: "DLT 1707168312450001",
    content: "Hi {#var#}, thank you for your interest in Autoprism Hyundai. Our team will reach out shortly. - AUTOPR" },
  { id: 2, name: "Test Drive Scheduled", channel: "SMS", type: "Transactional", status: "Approved",
    ref: "DLT 1707168312450002",
    content: "Hi {#var#}, your test drive for {#var#} is confirmed on {#var#} at {#var#}. - AUTOPR" },
  { id: 3, name: "Test Drive Completed & Feedback", channel: "WhatsApp", type: "Transactional", status: "Approved",
    ref: "td_feedback_v2",
    content: "Hi {{1}}, thanks for test driving the {{2}} today! We'd love your feedback: {{3}}" },
  { id: 4, name: "Booking Confirmation", channel: "SMS", type: "Transactional", status: "Approved",
    ref: "DLT 1707168312450003",
    content: "Hi {#var#}, your booking for {#var#} is confirmed. Booking ID: {#var#}. - AUTOPR" },
  { id: 5, name: "Delivery Update", channel: "WhatsApp", type: "Transactional", status: "Pending",
    ref: "delivery_update",
    content: "Hi {{1}}, your {{2}} is ready for delivery on {{3}}. See you at the showroom!" },
  { id: 6, name: "Service Reminder", channel: "SMS", type: "Transactional", status: "Pending",
    ref: "DLT — pending",
    content: "Hi {#var#}, your {#var#} is due for service. Book a slot: {#var#} - AUTOPR" },
  { id: 7, name: "Festive Offer", channel: "SMS", type: "Marketing", status: "Approved",
    ref: "DLT 1707168312450004",
    content: "Hi {#var#}, festive offers on Creta & Venue this week only! Visit Autoprism today. - AUTOPR" },
  { id: 8, name: "New Model Launch", channel: "WhatsApp", type: "Marketing", status: "Rejected",
    ref: "new_launch_promo",
    content: "Hi {{1}}, the all-new {{2}} has arrived! Book a test drive today." },
];

function AdminTemplateForm({ channel, template, onSave, onCancel }) {
  const isNew = !template;
  const [f, setF] = useState(template || { name: "", channel, type: "Transactional", content: "", ref: "", status: "Pending" });
  const meter = adminMessageMeter(f.content, f.channel);
  const over = meter.over || f.content.length > meter.limit;
  const canSave = f.name.trim() && f.content.trim() && !over;
  const contentChanged = template && f.content !== template.content;

  return (
    <div style={{ padding: "14px 14px 90px" }}>
      <button onClick={onCancel} style={{ display: "flex", alignItems: "center", gap: 5, background: "none",
        border: "none", cursor: "pointer", padding: "0 0 12px", fontFamily: F, fontSize: 12.5, fontWeight: 700,
        color: C.primary }}><ChevronLeft size={14} />Back</button>
      <AdminScreenHeader title={isNew ? "Add template" : f.name} />
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14 }}>
        <AdminField label="Template name"><AdminInput value={f.name} onChange={e => setF({ ...f, name: e.target.value })} placeholder="e.g. Booking Confirmation" /></AdminField>
        <AdminDivider />
        <AdminField label="Channel">
          <div style={{ display: "flex", gap: 7 }}>
            {["SMS", "WhatsApp"].map(c => (
              <button key={c} type="button" onClick={() => setF({ ...f, channel: c })} style={{
                flex: 1, padding: "9px 0", borderRadius: 9, cursor: "pointer",
                border: `1.5px solid ${f.channel === c ? C.primary : C.border}`,
                background: f.channel === c ? C.primarySoft : C.card, color: f.channel === c ? C.primary : C.sub,
                fontFamily: F, fontWeight: 700, fontSize: 12.5 }}>{c}</button>
            ))}
          </div>
        </AdminField>
        <AdminField label="Type">
          <div style={{ display: "flex", gap: 7 }}>
            {["Transactional", "Marketing"].map(t => (
              <button key={t} type="button" onClick={() => setF({ ...f, type: t })} style={{
                flex: 1, padding: "9px 0", borderRadius: 9, cursor: "pointer",
                border: `1.5px solid ${f.type === t ? C.primary : C.border}`,
                background: f.type === t ? C.primarySoft : C.card, color: f.type === t ? C.primary : C.sub,
                fontFamily: F, fontWeight: 700, fontSize: 12.5 }}>{t}</button>
            ))}
          </div>
        </AdminField>
        <AdminDivider />
        <AdminField label={f.channel === "SMS" ? "Content — use {#var#} for variables" : "Content — use {{1}}, {{2}} for variables"}>
          <AdminTextArea rows={4} value={f.content} onChange={e => setF({ ...f, content: e.target.value })} />
        </AdminField>
        <div style={{ fontFamily: F, fontSize: 10, fontWeight: 700, color: meter.note ? C.hot : C.faint,
          marginTop: -8, marginBottom: 4, textAlign: "right" }}>
          {f.content.length}/{meter.limit}
        </div>
        {meter.note && (
          <div style={{ fontFamily: F, fontSize: 11, color: C.hot, marginBottom: 12, textAlign: "right" }}>{meter.note}</div>
        )}
        <AdminField label={f.channel === "SMS" ? "DLT template ID" : "Meta template name"}>
          <AdminInput value={f.ref} onChange={e => setF({ ...f, ref: e.target.value })}
            placeholder={f.channel === "SMS" ? "From the DLT portal" : "From WhatsApp Manager"} />
        </AdminField>
        <div style={{ fontFamily: F, fontSize: 11, color: C.faint, marginBottom: 14 }}>
          {isNew ? "New templates start Pending until approved."
            : contentChanged ? "Editing the content resubmits it for approval."
            : `Currently ${f.status}.`}
        </div>
        <AdminPrimaryButton full disabled={!canSave} onClick={() => onSave({ ...f, status: (isNew || contentChanged) ? "Pending" : f.status })}>
          {isNew ? "Add template" : "Save changes"}
        </AdminPrimaryButton>
      </div>
    </div>
  );
}

/* ============================ BULK MESSAGING ============================
   Same audience-segmentation model dedicated platforms use (Gupshup, Kaleyra, WATI):
   start from a template or write fresh, then build the list either by filtering real
   leads or uploading one. Filters AND together across dimensions, OR within one — pick
   two sources and one model narrows to (source A or B) and that model. */

const ADMIN_AGE_BUCKETS = [
  { key: "0-7", label: "0–7 days", test: (l) => l.days <= 7 },
  { key: "8-30", label: "8–30 days", test: (l) => l.days > 7 && l.days <= 30 },
  { key: "31+", label: "31+ days", test: (l) => l.days > 30 },
];

function AdminChipMulti({ options, values, onChange, render }) {
  const toggle = (v) => onChange(values.includes(v) ? values.filter(x => x !== v) : [...values, v]);
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {options.map(o => {
        const on = values.includes(o);
        return (
          <button key={o} type="button" onClick={() => toggle(o)} style={{ padding: "7px 11px", borderRadius: 8,
            cursor: "pointer", border: `1.5px solid ${on ? C.primary : C.border}`, background: on ? C.primarySoft : C.card,
            color: on ? C.primary : C.sub, fontFamily: F, fontWeight: 700, fontSize: 12 }}>{render ? render(o) : o}</button>
        );
      })}
    </div>
  );
}

function AdminBulkUpload({ onLoaded }) {
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState(null);
  const pick = (f) => {
    if (!f) return;
    setFile(f); setBusy(true);
    // A stand-in for parsing the sheet server-side — a realistic contact count with a
    // couple of rows flagged bad, same review-before-use contract as everywhere else.
    setTimeout(() => { setBusy(false); onLoaded({ name: f.name, count: 342, invalid: 5 }); }, 1200);
  };
  return (
    <div style={{ background: C.card, border: `1.5px dashed ${C.borderStrong}`, borderRadius: 14, padding: 16, textAlign: "center" }}>
      <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: "none" }} onChange={e => pick(e.target.files[0])} />
      {busy ? (
        <>
          <Sparkles size={20} color={C.primary} />
          <div style={{ fontFamily: F, fontSize: 12.5, fontWeight: 700, color: C.ink, marginTop: 8 }}>Reading {file?.name}…</div>
        </>
      ) : (
        <>
          <Upload size={18} color={C.faint} />
          <div style={{ fontFamily: F, fontSize: 12.5, fontWeight: 700, color: C.ink, marginTop: 8 }}>Upload a contact list</div>
          <div style={{ fontFamily: F, fontSize: 10.5, color: C.faint, marginTop: 3, marginBottom: 10 }}>Excel or CSV, one number per row.</div>
          <AdminGhostButton onClick={() => fileRef.current.click()}>Choose file</AdminGhostButton>
        </>
      )}
    </div>
  );
}

function BulkMessageScreen({ channel, onBack, showToast }) {
  const [mode, setMode] = useState("template");
  const [templateId, setTemplateId] = useState(null);
  const [content, setContent] = useState("");
  const [audience, setAudience] = useState("filter");
  const [sources, setSources] = useState([]);
  const [models, setModels] = useState([]);
  const [ages, setAges] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [upload, setUpload] = useState(null);
  const [confirming, setConfirming] = useState(false);

  const channelTemplates = ADMIN_TEMPLATES_SEED.filter(t => t.channel === channel);
  const original = channelTemplates.find(t => t.id === templateId);
  const meter = adminMessageMeter(content, channel);
  const over = meter.over || content.length > meter.limit;
  const edited = original && content !== original.content;

  const pickTemplate = (t) => { setTemplateId(t.id); setContent(t.content); };

  const matches = (l) => (sources.length === 0 || sources.includes(l.source))
    && (models.length === 0 || models.some(m => l.model.startsWith(m)))
    && (ages.length === 0 || ages.some(a => ADMIN_AGE_BUCKETS.find(b => b.key === a).test(l)))
    && (statuses.length === 0 || statuses.includes(l.status));
  const recipients = audience === "upload" ? (upload?.count || 0) : LEADS.filter(matches).length;

  const canSend = content.trim() && !over && recipients > 0;

  return (
    <div style={{ padding: "14px 14px 90px" }}>
      <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 5, background: "none",
        border: "none", cursor: "pointer", padding: "0 0 12px", fontFamily: F, fontSize: 12.5, fontWeight: 700,
        color: C.primary }}><ChevronLeft size={14} />Back</button>
      <AdminScreenHeader title={`Bulk ${channel}`} blurb="One message, a filtered or uploaded list." />

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14, marginBottom: 12 }}>
        <div style={{ fontFamily: F, fontSize: 13, fontWeight: 800, color: C.ink, marginBottom: 9 }}>Message</div>
        <div style={{ display: "flex", gap: 7, marginBottom: 11 }}>
          {[["template", "From a template"], ["custom", "Write custom"]].map(([k, l]) => (
            <button key={k} onClick={() => { setMode(k); setTemplateId(null); setContent(""); }} style={{
              flex: 1, padding: "8px 0", borderRadius: 9, cursor: "pointer",
              border: `1.5px solid ${mode === k ? C.primary : C.border}`, background: mode === k ? C.primarySoft : C.card,
              color: mode === k ? C.primary : C.sub, fontFamily: F, fontWeight: 700, fontSize: 12 }}>{l}</button>
          ))}
        </div>
        {mode === "template" && (
          <AdminSelect value={original?.name || ""}
            onChange={v => { const t = channelTemplates.find(x => x.name === v); if (t) pickTemplate(t); }}
            options={channelTemplates.map(t => t.name)} placeholder="Pick a template" />
        )}
        <AdminDivider />
        <AdminTextArea rows={4} value={content} onChange={e => setContent(e.target.value)}
          placeholder={mode === "custom" ? "Write the message…" : "Pick a template above, then edit freely."} />
        <div style={{ fontFamily: F, fontSize: 10, fontWeight: 700, color: meter.note ? C.hot : C.faint,
          marginTop: 4, textAlign: "right" }}>
          {content.length}/{meter.limit}
        </div>
        {meter.note && <div style={{ fontFamily: F, fontSize: 11, color: C.hot, marginTop: 2, textAlign: "right" }}>{meter.note}</div>}
        {(mode === "custom" || edited) && (
          <div style={{ fontFamily: F, fontSize: 11, color: C.sub, marginTop: 4 }}>
            Custom or edited content needs approval before it can send.
          </div>
        )}
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14, marginBottom: 12 }}>
        <div style={{ fontFamily: F, fontSize: 13, fontWeight: 800, color: C.ink, marginBottom: 9 }}>Audience</div>
        <div style={{ display: "flex", gap: 7, marginBottom: 11 }}>
          {[["filter", "Filter leads"], ["upload", "Upload a list"]].map(([k, l]) => (
            <button key={k} onClick={() => setAudience(k)} style={{ flex: 1, padding: "8px 0", borderRadius: 9, cursor: "pointer",
              border: `1.5px solid ${audience === k ? C.primary : C.border}`, background: audience === k ? C.primarySoft : C.card,
              color: audience === k ? C.primary : C.sub, fontFamily: F, fontWeight: 700, fontSize: 12 }}>{l}</button>
          ))}
        </div>

        {audience === "filter" ? (
          <>
            <AdminField label="Lead source"><AdminChipMulti options={ADMIN_SOURCES} values={sources} onChange={setSources} /></AdminField>
            <AdminDivider />
            <AdminField label="Model"><AdminChipMulti options={ADMIN_MODELS} values={models} onChange={setModels} /></AdminField>
            <AdminDivider />
            <AdminField label="Lead age">
              <AdminChipMulti options={ADMIN_AGE_BUCKETS.map(b => b.key)} values={ages} onChange={setAges}
                render={(k) => ADMIN_AGE_BUCKETS.find(b => b.key === k).label} />
            </AdminField>
            <AdminDivider />
            <AdminField label="Lead status"><AdminChipMulti options={ADMIN_LEAD_STATUSES} values={statuses} onChange={setStatuses} /></AdminField>
          </>
        ) : upload ? (
          <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, padding: 11 }}>
            <div style={{ fontFamily: F, fontSize: 12.5, fontWeight: 700, color: C.ink }}>{upload.name}</div>
            <div style={{ fontFamily: F, fontSize: 11, color: C.faint, marginTop: 2 }}>
              {upload.count} contacts{upload.invalid ? ` · ${upload.invalid} invalid, will be skipped` : ""}
            </div>
            <button onClick={() => setUpload(null)} style={{ marginTop: 8, background: "none", border: "none", cursor: "pointer",
              fontFamily: F, fontWeight: 700, fontSize: 11.5, color: C.hot, padding: 0 }}>Remove</button>
          </div>
        ) : (
          <AdminBulkUpload onLoaded={setUpload} />
        )}
      </div>

      {!confirming ? (
        <AdminPrimaryButton full disabled={!canSend} onClick={() => setConfirming(true)}>
          {recipients > 0 ? `Review · ${recipients.toLocaleString("en-IN")} recipients` : "No recipients match yet"}
        </AdminPrimaryButton>
      ) : (
        <div style={{ background: C.card, border: `1.5px solid ${C.primary}44`, borderRadius: 14, padding: 14 }}>
          <div style={{ fontFamily: F, fontSize: 13, fontWeight: 800, color: C.ink, marginBottom: 3 }}>
            Send to {recipients.toLocaleString("en-IN")} people?
          </div>
          <div style={{ fontFamily: F, fontSize: 11.5, color: C.sub, marginBottom: 10, lineHeight: 1.4 }}>
            {channel} · {content.slice(0, 70)}{content.length > 70 ? "…" : ""}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <AdminGhostButton onClick={() => setConfirming(false)}>Back</AdminGhostButton>
            <div style={{ flex: 1 }}>
              <AdminPrimaryButton full onClick={() => { showToast(`Queued to ${recipients.toLocaleString("en-IN")} recipients`); onBack(); }}>
                Confirm & send
              </AdminPrimaryButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminMessagingScreen({ showToast }) {
  const [templates, setTemplates] = useState(ADMIN_TEMPLATES_SEED);
  const [channel, setChannel] = useState("SMS");
  const [typeF, setTypeF] = useState("all");
  const [editing, setEditing] = useState(null);
  const [bulk, setBulk] = useState(null);   // null | "SMS" | "WhatsApp"

  const save = (f) => {
    if (editing === "new") {
      setTemplates(ts => [...ts, { ...f, id: Math.max(...ts.map(t => t.id)) + 1 }]);
      showToast(`"${f.name}" added — Pending approval`);
    } else {
      setTemplates(ts => ts.map(t => t.id === editing.id ? { ...t, ...f } : t));
      showToast(f.status === "Pending" && editing.status !== "Pending" ? `"${f.name}" resubmitted for approval` : `"${f.name}" saved`);
    }
    setEditing(null);
  };

  if (editing) return <AdminTemplateForm channel={channel} template={editing === "new" ? null : editing} onSave={save} onCancel={() => setEditing(null)} />;
  if (bulk) return <BulkMessageScreen channel={bulk} onBack={() => setBulk(null)} showToast={showToast} />;

  const rows = templates.filter(t => t.channel === channel && (typeF === "all" || t.type === typeF));

  return (
    <div style={{ padding: "14px 14px 90px" }}>
      <AdminScreenHeader title="Messaging" blurb="Templates for SMS and WhatsApp." />

      {/* Sending, not managing a template — a distinct action, so it sits above the
          library rather than inside it. */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {["SMS", "WhatsApp"].map(c => (
          <button key={c} onClick={() => setBulk(c)} style={{ flex: 1, display: "flex", alignItems: "center",
            justifyContent: "center", gap: 6, padding: "12px 0", borderRadius: 11, cursor: "pointer",
            border: "none", background: C.ink, color: "#fff", fontFamily: F, fontWeight: 800, fontSize: 13 }}>
            <Send size={13} />Bulk {c}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 9 }}>
        <span style={{ flex: 1, fontFamily: F, fontSize: 13, fontWeight: 800, color: C.ink }}>Templates</span>
        <button onClick={() => setEditing("new")} style={{ padding: "8px 12px", borderRadius: 9, border: "none",
          background: C.primary, color: "#fff", fontFamily: F, fontWeight: 800, fontSize: 11.5, cursor: "pointer",
          whiteSpace: "nowrap" }}>+ Add</button>
      </div>

      <div style={{ display: "flex", gap: 5, marginBottom: 8 }}>
        {["SMS", "WhatsApp"].map(c => (
          <button key={c} onClick={() => setChannel(c)} style={{ flex: 1, padding: "8px 0", borderRadius: 9, cursor: "pointer",
            border: `1.5px solid ${channel === c ? C.primary : C.border}`, background: channel === c ? C.primarySoft : C.card,
            color: channel === c ? C.primary : C.sub, fontFamily: F, fontWeight: 700, fontSize: 12 }}>{c}</button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 5, marginBottom: 12 }}>
        {[["all", "All"], ["Transactional", "Transactional"], ["Marketing", "Marketing"]].map(([k, l]) => (
          <button key={k} onClick={() => setTypeF(k)} style={{ flex: 1, padding: "7px 0", borderRadius: 8, cursor: "pointer",
            border: `1.5px solid ${typeF === k ? C.primary : C.border}`, background: typeF === k ? C.primarySoft : C.card,
            color: typeF === k ? C.primary : C.sub, fontFamily: F, fontWeight: 700, fontSize: 11.5 }}>{l}</button>
        ))}
      </div>

      {rows.length === 0 && (
        <div style={{ padding: 20, textAlign: "center", fontFamily: F, fontSize: 12.5, color: C.faint,
          background: C.card, border: `1px solid ${C.border}`, borderRadius: 14 }}>No templates here.</div>
      )}
      {rows.map((t, i) => (
        <button key={t.id} onClick={() => setEditing(t)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%",
          textAlign: "left", background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "11px 13px",
          marginBottom: 8, cursor: "pointer" }}>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontFamily: F, fontSize: 13, fontWeight: 700, color: C.ink }}>{t.name}</span>
            <span style={{ display: "block", fontFamily: F, fontSize: 11, color: C.faint, marginTop: 2 }}>{t.type} · {t.ref}</span>
          </span>
          <span style={{ fontFamily: F, fontSize: 9.5, fontWeight: 800, color: ADMIN_STATUS_TONE[t.status],
            background: ADMIN_STATUS_TONE[t.status] + "1A", borderRadius: 5, padding: "3px 7px",
            textTransform: "uppercase", flexShrink: 0 }}>{t.status}</span>
          <Pencil size={13} color={C.ghost} style={{ flexShrink: 0 }} />
        </button>
      ))}
    </div>
  );
}

/* ============================ SECURITY ============================
   Data retention and Data Principal requests live here — DPDP Act, 2023. */
const ADMIN_SESSIONS_SEED = [
  { id: 1, user: "Arjun Nair", device: "iPhone 14 · Autoprism app", location: "Whitefield", last: "2m ago", current: false },
  { id: 2, user: "Sneha Rao", device: "Samsung A54 · Autoprism app", location: "Indiranagar", last: "18m ago", current: false },
  { id: 3, user: "Priya Nambiar", device: "iPhone 15 Pro · Autoprism app", location: "Indiranagar", last: "Just now", current: true },
  { id: 4, user: "Rahul Kumar", device: "Redmi Note 13 · Autoprism app", location: "Indiranagar", last: "3h ago", current: false },
];
const ADMIN_AUDIT_SEED = [
  { who: "Priya Nambiar", what: "Changed the volume incentive tiers", when: "Today, 10:12 AM" },
  { who: "Rajesh Menon", what: "Added Anjali Reddy as a Sales Executive", when: "Yesterday, 4:40 PM" },
  { who: "Priya Nambiar", what: "Added a lead rule — Alcazar in Whitefield", when: "Yesterday, 11:05 AM" },
  { who: "Priya Nambiar", what: "Deactivated a Whitefield user login", when: "3 days ago" },
  { who: "Rajesh Menon", what: "Edited a Vehicles price list — Creta", when: "4 days ago" },
  { who: "Priya Nambiar", what: "Moved Arjun Nair to Sneha Rao's team", when: "5 days ago" },
  { who: "Priya Nambiar", what: "Changed the Messaging opt-in template", when: "6 days ago" },
];

function AdminSecurityScreen({ showToast }) {
  const [retention, setRetention] = useState(180);
  const [dq, setDq] = useState("");
  const [dqResult, setDqResult] = useState(null);
  const [rpq, setRpq] = useState("");
  const [rpqResult, setRpqResult] = useState(null);
  const [leadRows, setLeadRows] = useState(null);   // parsed rows awaiting review
  const [leadFileName, setLeadFileName] = useState("");
  const [leadBusy, setLeadBusy] = useState(false);
  const [require2fa, setRequire2fa] = useState(true);
  const [minPasswordLen, setMinPasswordLen] = useState(8);
  const [idleTimeout, setIdleTimeout] = useState("7");
  const [lockoutAttempts, setLockoutAttempts] = useState(5);
  const [passwordResetDays, setPasswordResetDays] = useState("90 days");
  const [sessions, setSessions] = useState(ADMIN_SESSIONS_SEED);
  const [grievanceName, setGrievanceName] = useState("Priya Nambiar");
  const [grievanceEmail, setGrievanceEmail] = useState("grievance@autoprism.in");
  const [grievancePhone, setGrievancePhone] = useState("+91 90080 11223");
  const [bq, setBq] = useState("");
  const [bqResult, setBqResult] = useState(null);
  const [blacklist, setBlacklist] = useState([
    { id: 1, value: "+91 90080 55009", when: "12 Jun 2026" },
    { id: 2, value: "unsubscribe@example.com", when: "3 Aug 2026" },
  ]);
  const [auditExpanded, setAuditExpanded] = useState(false);
  const [maskPhone, setMaskPhone] = useState(true);
  const [maskName, setMaskName] = useState(false);
  const [maskAddress, setMaskAddress] = useState(true);
  const [maskMargin, setMaskMargin] = useState(true);
  const [exportAdminOnly, setExportAdminOnly] = useState(true);
  // Shared across the three PII masks — someone allowed to see the real phone number
  // almost always needs the real name and address too, so one allowlist rather than three.
  const [piiExceptions, setPiiExceptions] = useState([1]); // Priya Nambiar, by default
  const [showExceptions, setShowExceptions] = useState(false);

  const searchCustomer = () => {
    const hit = LEADS.find(l => l.name.toLowerCase().includes(dq.trim().toLowerCase()) || l.phone.includes(dq.trim()));
    setDqResult(hit || "none");
  };
  const searchForReset = () => {
    const hit = ADMIN_USERS_SEED.find(u => u.name.toLowerCase().includes(rpq.trim().toLowerCase()) || u.phone.includes(rpq.trim()));
    setRpqResult(hit || "none");
  };
  const resetPassword = () => {
    showToast(`Password reset link sent to ${rpqResult.name.split(" ")[0]}`);
    setRpq(""); setRpqResult(null);
  };
  const ADMIN_LEAD_UPLOAD_MOCK = [
    { name: "Kiran Malhotra", phone: "+91 98450 11223", model: "Creta SX(O)", source: "Website" },
    { name: "Sanya Kapoor", phone: "+91 98450 33445", model: "Venue SX", source: "CarDekho" },
    { name: "Vivek Rao", phone: "+91 98450 55667", model: "Alcazar Platinum", source: "Walk-in" },
    { name: "Meghna Iyer", phone: "+91 98450 77889", model: "Verna SX", source: "Referral" },
  ];
  const pickLeadFile = (f) => {
    if (!f) return;
    setLeadFileName(f.name); setLeadBusy(true);
    setTimeout(() => { setLeadBusy(false); setLeadRows(ADMIN_LEAD_UPLOAD_MOCK.map(r => ({ ...r }))); }, 1200);
  };
  const editLeadRow = (i, field, value) => setLeadRows(rows => rows.map((r, ix) => ix === i ? { ...r, [field]: value } : r));
  const confirmLeadImport = () => {
    showToast(`${leadRows.length} leads imported from ${leadFileName}`);
    setLeadRows(null); setLeadFileName("");
  };
  const searchToBlacklist = () => {
    const v = bq.trim();
    if (!v) return;
    const hit = LEADS.find(l => l.name.toLowerCase().includes(v.toLowerCase()) || l.phone.includes(v));
    setBqResult(hit ? { name: hit.name, value: hit.phone } : { name: null, value: v });
  };
  const addToBlacklist = () => {
    if (!bqResult) return;
    setBlacklist(bl => [{ id: Date.now(), value: bqResult.value, when: "Just now" }, ...bl]);
    showToast(`${bqResult.value} blacklisted — no communications will be sent`);
    setBq(""); setBqResult(null);
  };

  return (
    <div style={{ padding: "14px 14px 90px" }}>
      <AdminScreenHeader title="Security" blurb="Account security, sessions, and data protection." />

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14, marginBottom: 12 }}>
        <div style={{ fontFamily: F, fontSize: 13, fontWeight: 800, color: C.ink, marginBottom: 2 }}>Account security</div>
        <div style={{ fontFamily: F, fontSize: 11, color: C.faint, marginBottom: 11 }}>Applies dealership-wide.</div>
        <AdminPrivilegeToggle icon={ShieldCheck} label="Require 2FA for Admin privilege" sub="One-time code at login, on top of the password."
          on={require2fa} onClick={() => setRequire2fa(v => !v)} />
        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          <div style={{ flex: 1 }}><AdminField label="Minimum password length">
            <AdminSelect value={String(minPasswordLen)} onChange={v => setMinPasswordLen(+v)} options={["6", "8", "10", "12"]} />
          </AdminField></div>
          <div style={{ flex: 1 }}><AdminField label="Lock a login after">
            <AdminSelect value={String(lockoutAttempts)} onChange={v => setLockoutAttempts(+v)} options={["3", "5", "10"]} />
          </AdminField></div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}><AdminField label="Auto-logout after inactivity">
            <AdminSelect value={idleTimeout} onChange={setIdleTimeout} options={["1 day", "3 days", "7 days", "14 days", "30 days", "Never"]} />
          </AdminField></div>
          <div style={{ flex: 1 }}><AdminField label="Password reset every">
            <AdminSelect value={passwordResetDays} onChange={setPasswordResetDays} options={["30 days", "60 days", "90 days", "180 days", "Never"]} />
          </AdminField></div>
        </div>
        <AdminDivider />
        <AdminField label="Reset a user's password">
          <div style={{ display: "flex", gap: 6 }}>
            <AdminInput value={rpq} onChange={e => { setRpq(e.target.value); setRpqResult(null); }} placeholder="Search name or phone" style={{ flex: 1 }} />
            <button onClick={searchForReset} style={{ padding: "0 14px", borderRadius: 9, border: "none",
              background: C.primary, color: "#fff", fontFamily: F, fontWeight: 800, fontSize: 12, cursor: "pointer" }}>
              <Search size={14} /></button>
          </div>
        </AdminField>
        {rpqResult === "none" && <div style={{ fontFamily: F, fontSize: 11, color: C.faint }}>No match found.</div>}
        {rpqResult && rpqResult !== "none" && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, border: `1px solid ${C.border}`, borderRadius: 10, padding: 10 }}>
            <AdminAvatar n={rpqResult} size={26} />
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", fontFamily: F, fontSize: 12, fontWeight: 700, color: C.ink }}>{rpqResult.name}</span>
              <span style={{ display: "block", fontFamily: F, fontSize: 10.5, color: C.faint }}>{rpqResult.phone}</span>
            </span>
            <AdminGhostButton onClick={resetPassword}>Send reset link</AdminGhostButton>
          </div>
        )}
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14, marginBottom: 12 }}>
        <div style={{ fontFamily: F, fontSize: 13, fontWeight: 800, color: C.ink, marginBottom: 2 }}>Data upload</div>
        <div style={{ fontFamily: F, fontSize: 11, color: C.faint, marginBottom: 11 }}>Bulk-add leads from an Excel or CSV file.</div>
        {leadRows ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
              <CheckCircle2 size={14} color={C.green} />
              <span style={{ fontFamily: F, fontSize: 12.5, fontWeight: 800, color: C.ink }}>{leadRows.length} leads read from {leadFileName}</span>
            </div>
            <div style={{ fontFamily: F, fontSize: 10.5, color: C.faint, marginBottom: 11 }}>Check every row before importing.</div>
            {leadRows.map((r, i) => (
              <div key={i} style={{ border: `1px solid ${C.border}`, borderRadius: 10, padding: 10, marginBottom: 8, background: C.bg }}>
                <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                  <AdminInput value={r.name} onChange={e => editLeadRow(i, "name", e.target.value)} style={{ flex: 1.2, fontSize: 12 }} />
                  <AdminInput value={r.phone} onChange={e => editLeadRow(i, "phone", e.target.value)} style={{ flex: 1, fontSize: 12 }} />
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <AdminInput value={r.model} onChange={e => editLeadRow(i, "model", e.target.value)} style={{ flex: 1, fontSize: 11 }} />
                  <AdminInput value={r.source} onChange={e => editLeadRow(i, "source", e.target.value)} style={{ flex: 1, fontSize: 11 }} />
                </div>
                <div style={{ fontFamily: F, fontSize: 9, color: C.faint, marginTop: 4 }}>Name · Phone · Model · Source</div>
              </div>
            ))}
            <div style={{ display: "flex", gap: 8 }}>
              <AdminGhostButton onClick={() => { setLeadRows(null); setLeadFileName(""); }}>Discard</AdminGhostButton>
              <div style={{ flex: 1 }}><AdminPrimaryButton full onClick={confirmLeadImport}>Import {leadRows.length} leads</AdminPrimaryButton></div>
            </div>
          </>
        ) : (
          <div style={{ background: C.bg, border: `1.5px dashed ${C.borderStrong}`, borderRadius: 14, padding: 16, textAlign: "center" }}>
            <input type="file" accept=".xlsx,.xls,.csv" style={{ display: "none" }} id="admin-lead-upload"
              onChange={e => pickLeadFile(e.target.files[0])} />
            {leadBusy ? (
              <>
                <Sparkles size={20} color={C.primary} />
                <div style={{ fontFamily: F, fontSize: 12.5, fontWeight: 700, color: C.ink, marginTop: 8 }}>Reading {leadFileName}…</div>
              </>
            ) : (
              <>
                <Upload size={18} color={C.faint} />
                <div style={{ fontFamily: F, fontSize: 12.5, fontWeight: 700, color: C.ink, marginTop: 8 }}>Upload a leads file</div>
                <div style={{ fontFamily: F, fontSize: 10.5, color: C.faint, marginTop: 3, marginBottom: 11 }}>Excel or CSV — name, phone, model, source.</div>
                <AdminGhostButton onClick={() => document.getElementById("admin-lead-upload").click()}>Choose file</AdminGhostButton>
              </>
            )}
          </div>
        )}
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14, marginBottom: 12 }}>
        <div style={{ fontFamily: F, fontSize: 13, fontWeight: 800, color: C.ink, marginBottom: 2 }}>Active sessions</div>
        <div style={{ fontFamily: F, fontSize: 11, color: C.faint, marginBottom: 11 }}>Sign a device out if it's lost or changed hands.</div>
        {sessions.map(s => (
          <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0",
            borderTop: `1px solid ${C.border}` }}>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontFamily: F, fontSize: 12.5, fontWeight: 700, color: C.ink }}>{s.user}</span>
                {s.current && <span style={{ fontFamily: F, fontSize: 9, fontWeight: 800, color: C.green,
                  background: C.greenSoft, borderRadius: 4, padding: "1px 5px" }}>THIS DEVICE</span>}
              </span>
              <span style={{ display: "block", fontFamily: F, fontSize: 11, color: C.faint, marginTop: 1 }}>
                {s.device} · {s.location} · {s.last}
              </span>
            </span>
            {!s.current && (
              <button onClick={() => { setSessions(ss => ss.filter(x => x.id !== s.id)); showToast(`Signed ${s.user.split(" ")[0]} out`); }}
                style={{ padding: "6px 10px", borderRadius: 8, cursor: "pointer", border: `1.5px solid ${C.borderStrong}`,
                  background: C.card, color: C.hot, fontFamily: F, fontWeight: 700, fontSize: 11, flexShrink: 0 }}>Sign out</button>
            )}
          </div>
        ))}
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14, marginBottom: 12 }}>
        <div style={{ fontFamily: F, fontSize: 13, fontWeight: 800, color: C.ink, marginBottom: 2 }}>Audit log</div>
        <div style={{ fontFamily: F, fontSize: 11, color: C.faint, marginBottom: 11 }}>Recent changes made from the Admin menu.</div>
        {(auditExpanded ? ADMIN_AUDIT_SEED : ADMIN_AUDIT_SEED.slice(0, 3)).map((a, i) => (
          <div key={i} style={{ padding: "7px 0", borderTop: i > 0 ? `1px solid ${C.border}` : "none" }}>
            <div style={{ fontFamily: F, fontSize: 12, color: C.ink }}>
              <span style={{ fontWeight: 700 }}>{a.who.split(" ")[0]}</span> {a.what}
            </div>
            <div style={{ fontFamily: F, fontSize: 10, color: C.faint, marginTop: 1 }}>{a.when}</div>
          </div>
        ))}
        {ADMIN_AUDIT_SEED.length > 3 && (
          <button onClick={() => setAuditExpanded(v => !v)} style={{ display: "block", width: "100%", textAlign: "center",
            background: "none", border: "none", cursor: "pointer", padding: "8px 0 0", fontFamily: F, fontWeight: 700,
            fontSize: 11.5, color: C.primary }}>{auditExpanded ? "Show less" : "View more"}</button>
        )}
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14, marginBottom: 12 }}>
        <div style={{ fontFamily: F, fontSize: 13, fontWeight: 800, color: C.ink, marginBottom: 2 }}>Blacklist</div>
        <div style={{ fontFamily: F, fontSize: 11, color: C.faint, marginBottom: 11 }}>Blocked for good — no SMS, WhatsApp, or email, ever.</div>
        <AdminField label="Add a number or email">
          <div style={{ display: "flex", gap: 6 }}>
            <AdminInput value={bq} onChange={e => { setBq(e.target.value); setBqResult(null); }} placeholder="Search or paste one in" style={{ flex: 1 }} />
            <button onClick={searchToBlacklist} style={{ padding: "0 14px", borderRadius: 9, border: "none",
              background: C.primary, color: "#fff", fontFamily: F, fontWeight: 800, fontSize: 12.5, cursor: "pointer" }}>
              <Search size={14} /></button>
          </div>
        </AdminField>
        {bqResult && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, border: `1px solid ${C.border}`, borderRadius: 10, padding: 10, marginTop: -4, marginBottom: 11 }}>
            <span style={{ flex: 1, minWidth: 0 }}>
              {bqResult.name && <span style={{ display: "block", fontFamily: F, fontSize: 12.5, fontWeight: 700, color: C.ink }}>{bqResult.name}</span>}
              <span style={{ display: "block", fontFamily: F, fontSize: 11, color: C.faint }}>{bqResult.value}</span>
            </span>
            <AdminGhostButton tone={C.hot} onClick={addToBlacklist}>Blacklist</AdminGhostButton>
          </div>
        )}
        {blacklist.map((b, i) => (
          <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", borderTop: i > 0 ? `1px solid ${C.border}` : "none" }}>
            <span style={{ flex: 1, minWidth: 0, fontFamily: F, fontSize: 12, color: C.ink }}>{b.value}</span>
            <span style={{ fontFamily: F, fontSize: 10, color: C.faint, flexShrink: 0 }}>{b.when}</span>
            <button onClick={() => setBlacklist(bl => bl.filter(x => x.id !== b.id))} style={{ background: "none", border: "none",
              cursor: "pointer", padding: 2, flexShrink: 0, display: "flex" }}><Trash2 size={12} color={C.hot} /></button>
          </div>
        ))}
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14, marginBottom: 12 }}>
        <div style={{ fontFamily: F, fontSize: 13, fontWeight: 800, color: C.ink, marginBottom: 2 }}>Data masking & exports</div>
        <div style={{ fontFamily: F, fontSize: 11, color: C.faint, marginBottom: 11 }}>Beyond DPDP — limits what leaves the building.</div>
        <AdminPrivilegeToggle icon={Lock} label="Mask phone numbers in downloads" sub="Reports and exports show a partial number only."
          on={maskPhone} onClick={() => setMaskPhone(v => !v)} />
        <AdminPrivilegeToggle icon={Lock} label="Mask customer names in downloads" sub="Shows initials in place of the full name."
          on={maskName} onClick={() => setMaskName(v => !v)} />
        <AdminPrivilegeToggle icon={Lock} label="Mask addresses in downloads" sub="Area and city only, no door number or street."
          on={maskAddress} onClick={() => setMaskAddress(v => !v)} />

        {(maskPhone || maskName || maskAddress) && (
          <div style={{ background: C.bg, borderRadius: 10, padding: "10px 12px", marginBottom: 11 }}>
            <button onClick={() => setShowExceptions(v => !v)} style={{ display: "flex", alignItems: "center",
              gap: 7, width: "100%", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
              {showExceptions ? <ChevronDown size={13} color={C.faint} /> : <ChevronRight size={13} color={C.faint} />}
              <span style={{ flex: 1, textAlign: "left", fontFamily: F, fontSize: 11.5, fontWeight: 700, color: C.ink }}>
                Exceptions — who can still download it unmasked
              </span>
              <span style={{ fontFamily: F, fontSize: 10.5, fontWeight: 800, color: C.primary }}>{piiExceptions.length}</span>
            </button>
            {showExceptions && (
              <div style={{ marginTop: 10 }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: piiExceptions.length ? 9 : 0 }}>
                  {piiExceptions.map(id => {
                    const u = ADMIN_USERS_SEED.find(x => x.id === id);
                    if (!u) return null;
                    return (
                      <span key={id} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: C.primarySoft,
                        border: `1.5px solid ${C.primary}`, borderRadius: 999, padding: "3px 6px 3px 4px", fontFamily: F,
                        fontSize: 11, fontWeight: 700, color: C.ink }}>
                        <AdminAvatar n={u} size={18} />{u.name.split(" ")[0]}
                        <button onClick={() => setPiiExceptions(ex => ex.filter(x => x !== id))} style={{ background: "none",
                          border: "none", cursor: "pointer", padding: 0, display: "flex" }}><X size={11} color={C.sub} /></button>
                      </span>
                    );
                  })}
                </div>
                <AdminPersonPicker candidates={ADMIN_USERS_SEED.filter(u => u.active && !piiExceptions.includes(u.id))}
                  selected={[]} onChange={(ids) => setPiiExceptions(ex => [...ex, ...ids.filter(id => !ex.includes(id))])}
                  placeholder="Search a user to add" />
                <div style={{ fontFamily: F, fontSize: 10, color: C.faint, marginTop: 6 }}>
                  These users see the real name, phone and address wherever anyone else sees a mask.
                </div>
              </div>
            )}
          </div>
        )}

        <AdminPrivilegeToggle icon={Lock} label="Mask discount & margin from non-Finance roles" sub="Protects negotiating room — SEs and TLs see price, not cost."
          on={maskMargin} onClick={() => setMaskMargin(v => !v)} />
        <AdminPrivilegeToggle icon={ShieldCheck} label="Only Admin privilege can export data" sub="Stops a full lead list leaving with someone who resigns."
          on={exportAdminOnly} onClick={() => setExportAdminOnly(v => !v)} />
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14, marginBottom: 12 }}>
        <div style={{ fontFamily: F, fontSize: 13, fontWeight: 800, color: C.ink, marginBottom: 2 }}>Grievance Officer</div>
        <div style={{ fontFamily: F, fontSize: 11, color: C.faint, marginBottom: 11 }}>Required contact under the DPDP Act, 2023.</div>
        <AdminField label="Name"><AdminInput value={grievanceName} onChange={e => setGrievanceName(e.target.value)} /></AdminField>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}><AdminField label="Email"><AdminInput value={grievanceEmail} onChange={e => setGrievanceEmail(e.target.value)} /></AdminField></div>
          <div style={{ flex: 1 }}><AdminField label="Phone"><AdminInput value={grievancePhone} onChange={e => setGrievancePhone(e.target.value)} /></AdminField></div>
        </div>
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14, marginBottom: 12 }}>
        <div style={{ fontFamily: F, fontSize: 13, fontWeight: 800, color: C.ink, marginBottom: 2 }}>Data retention</div>
        <div style={{ fontFamily: F, fontSize: 11, color: C.faint, marginBottom: 11 }}>DPDP Act, 2023.</div>
        <AdminField label="Delete inactive lead data after">
          <AdminSelect value={String(retention)} onChange={v => setRetention(+v)} options={["90", "180", "365", "730"]} />
        </AdminField>
        <AdminDivider />
        <AdminField label="Handle a data request">
          <div style={{ display: "flex", gap: 6 }}>
            <AdminInput value={dq} onChange={e => setDq(e.target.value)} placeholder="Search name or phone" style={{ flex: 1 }} />
            <button onClick={searchCustomer} style={{ padding: "0 14px", borderRadius: 9, border: "none",
              background: C.primary, color: "#fff", fontFamily: F, fontWeight: 800, fontSize: 12.5, cursor: "pointer" }}>
              <Search size={14} /></button>
          </div>
        </AdminField>
        {dqResult === "none" && <div style={{ fontFamily: F, fontSize: 11.5, color: C.faint }}>No match found.</div>}
        {dqResult && dqResult !== "none" && (
          <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, padding: 11, marginTop: 4 }}>
            <div style={{ fontFamily: F, fontSize: 12.5, fontWeight: 700, color: C.ink }}>{dqResult.name}</div>
            <div style={{ fontFamily: F, fontSize: 11, color: C.faint, marginTop: 1, marginBottom: 9 }}>{dqResult.phone}</div>
            <div style={{ display: "flex", gap: 7 }}>
              <AdminGhostButton onClick={() => showToast(`Data exported for ${dqResult.name}`)}>Export data</AdminGhostButton>
              <AdminGhostButton tone={C.hot} onClick={() => { showToast(`Data deletion queued for ${dqResult.name}`); setDqResult(null); setDq(""); }}>Delete data</AdminGhostButton>
            </div>
          </div>
        )}
      </div>
      <AdminPrimaryButton full onClick={() => showToast("Security settings saved")}>Save security settings</AdminPrimaryButton>
    </div>
  );
}

/* ============================ TARGETS & INCENTIVES ============================
   Real Indian dealership practice, not an invented scheme:
     - Volume slabs, applied RETROACTIVELY to every unit once crossed. This is exactly how
       OEM mid-month schemes work ("cross 240 from 200, get +Rs 8,000 on all 240") — it's
       what makes closing the next slab worth chasing rather than just the marginal unit.
     - Finance and Insurance attach earn a flat amount per unit, mirroring the real payout
       dealers get from lenders and insurers and pass a slice of downstream.
   Deliberately NOT ten bonus layers — the advice that held up across every source was
   "one stable core, one narrow bonus layer." Everything here is also computable from data
   already in the app, so the preview below is a real number, not a mocked one. */

/* ============================ TARGETS & INCENTIVES ============================
   Selling an Exter and selling an Ioniq 5 are not the same event — the whole point of an
   incentive is to push what doesn't sell itself, so the rate has to vary by model, not
   just by how many units crossed the line. What stays true from the research (Indian OEM
   mid-month schemes: "cross 240 from 200, get +Rs 8,000 on ALL 240") is the volume TIER —
   total units retailed still decides which pay level an SE is on. What changes is that
   the rate AT that level now depends on which car was sold, not one flat number.

   The old retroactive/incremental toggle is gone for a concrete reason, not a style
   choice: with a real sale date per unit, "only units above the threshold" is computable.
   Without one — and this data has no such field — it can't be computed honestly, so only
   the mode that's both real-world-standard and actually correct here is offered. */

/* ============================ TARGETS & INCENTIVES ============================
   Three separate, additive layers — not one combined matrix:
     1. Volume tiers — a flat rate per car, by total units retailed this month.
     2. Model bonus — a flat rate per car, fixed per model, stacked on top of (1).
     3. Add-on incentives — six named products, each the value type it actually is:
        a commission percentage where the payout scales with billing (Accessories, the
        generic Additional Add-on), a flat amount where it doesn't (Extended Warranty,
        Car Coating, In-house Insurance, In-house Finance). */

/* ============================ TARGETS & COMMISSIONS DATA ============================
   Every configurable line shows both bases at once — a flat box, a small "Or", a
   percentage box — rather than a switch that hides one. Whichever box has a number in it
   contributes; leave one at zero and it contributes nothing. Each of the three layers
   below (Volume, Model, Add-ons) also has its own on/off, so a dealer can run with just
   one or two of the three without deleting anyone's numbers. */

const ADMIN_TIERS_SEED = [
  { id: 1, from: 0, to: 6, flatRate: 1500, pctRate: 0 },
  { id: 2, from: 7, to: 10, flatRate: 2500, pctRate: 0 },
  { id: 3, from: 11, to: 999, flatRate: 4000, pctRate: 0 },
];
const ADMIN_MODEL_BONUS_SEED = {
  Exter: { flat: 0, pct: 0 }, Venue: { flat: 0, pct: 0 },
  Verna: { flat: 500, pct: 0 }, Creta: { flat: 500, pct: 0 },
  Alcazar: { flat: 1500, pct: 0 }, "Ioniq 5": { flat: 2500, pct: 0 },
};
const ADMIN_TARGET_BONUS_SEED = { flat: 5000, pct: 0 };
const ADMIN_ADDONS_SEED = [
  { key: "accessories", label: "Accessories", flatValue: 0, pctValue: 10, flagField: "accessoriesBill", billField: "accessoriesBill" },
  { key: "warranty", label: "Extended Warranty", flatValue: 800, pctValue: 0, flagField: "warranty", billField: "warrantyBill" },
  { key: "coating", label: "Car Coating", flatValue: 600, pctValue: 0, flagField: "coating", billField: "coatingBill" },
  { key: "addon", label: "Additional Add-on", flatValue: 0, pctValue: 8, flagField: "addonBill", billField: "addonBill" },
  { key: "insurance", label: "In-house Insurance", flatValue: 1000, pctValue: 0, flagField: "insurance", billField: "insuranceBill" },
  { key: "finance", label: "In-house Finance", flatValue: 1000, pctValue: 0, flagField: "finance", billField: "financeBill" },
];

function adminTierFor(retailed, tiers) {
  const sorted = [...tiers].sort((a, b) => a.from - b.from);
  let t = sorted[0];
  sorted.forEach(x => { if (retailed >= x.from) t = x; });
  return t || { flatRate: 0, pctRate: 0 };
}

function adminComputeIncentive(rep, tiers, volumeOn, modelBonus, modelOn, variantRules, addons, addonsOn, targetBonus, targetBonusOn) {
  const closed = LEADS.filter(l => l.ownerId === rep.id && (l.stage === "Retailed" || l.stage === "Delivered"));
  const tier = adminTierFor(rep.retailed, tiers);

  // Grouped by the exact model + variant a car was — the finest grain a variant rule can
  // match at. Cars of a model with no matching rule fall back to the model's own bonus.
  const byVariant = {};
  closed.forEach(l => {
    const model = ADMIN_MODELS.find(m => l.model.startsWith(m)) || l.model;
    const variant = l.model.slice(model.length).trim();
    const key = model + "|" + variant;
    (byVariant[key] = byVariant[key] || { model, variant, cars: [] }).cars.push(l);
  });
  const modelLines = Object.values(byVariant).map(({ model, variant, cars }) => {
    const rule = variantRules.find(r => r.model === model && r.variant === variant);
    const bonus = rule ? { flat: rule.flat, pct: rule.pct } : (modelBonus[model] || { flat: 0, pct: 0 });
    const volumeAmt = volumeOn ? cars.length * tier.flatRate + cars.reduce((s, l) => s + l.value * tier.pctRate / 100, 0) : 0;
    const modelAmt = modelOn ? cars.length * bonus.flat + cars.reduce((s, l) => s + l.value * bonus.pct / 100, 0) : 0;
    return { model: variant ? `${model} ${variant}` : model, count: cars.length, tier, bonus, overridden: !!rule, amount: volumeAmt + modelAmt };
  });
  const volumeTotal = modelLines.reduce((n, l) => n + l.amount, 0);

  const addonLines = !addonsOn ? [] : addons.map(a => {
    const n = closed.filter(l => l[a.flagField]).length;
    const billTotal = closed.reduce((s, l) => s + (l[a.billField] || 0), 0);
    const flatAmt = n * a.flatValue;
    const pctAmt = Math.round(billTotal * a.pctValue / 100);
    return { ...a, count: n, billTotal, flatAmt, pctAmt, amount: flatAmt + pctAmt };
  });
  const addonTotal = addonLines.reduce((n, l) => n + l.amount, 0);

  const achieved = rep.retailed >= rep.target && rep.target > 0;
  const salesValue = roll(rep).salesValue;
  const targetAmount = (targetBonusOn && achieved) ? targetBonus.flat + Math.round(salesValue * targetBonus.pct / 100) : 0;

  return { tier, modelLines, volumeTotal, addonLines, addonTotal, achieved, targetAmount,
    total: volumeTotal + addonTotal + targetAmount };
}

function AdminOnOffToggle({ on, onClick }) {
  return (
    <button type="button" onClick={onClick} style={{ width: 40, height: 23, borderRadius: 12, border: "none",
      background: on ? C.primary : C.borderStrong, position: "relative", cursor: "pointer", flexShrink: 0, padding: 0 }}>
      <span style={{ position: "absolute", top: 2, left: on ? 19 : 2, width: 19, height: 19, borderRadius: "50%",
        background: "#fff", transition: "left .15s" }} />
    </button>
  );
}

const adminTinyInput = { width: 44, boxSizing: "border-box", border: `1.5px solid ${C.borderStrong}`, borderRadius: 7,
  padding: "6px 3px", fontFamily: F, fontSize: 11.5, color: C.ink, background: C.card, outline: "none", textAlign: "center" };

// One line, always: whatever this row is about, then a flat box, "Or", a percent box —
// nothing wraps to a second line. Volume tiers, Model bonuses and every Add-on all use
// this same row so the whole screen reads as one consistent list.
function AdminFlatOrPct({ label, flat, pct, onFlat, onPct, disabled }) {
  const num = (v) => v === "" ? 0 : Number(v.replace(/[^0-9]/g, ""));
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 8 }}>
      <span style={{ flex: "1 1 0", minWidth: 0, fontFamily: F, fontSize: 12, fontWeight: 600, color: C.ink,
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
      <span style={{ fontFamily: F, fontSize: 11, color: C.faint, flexShrink: 0 }}>₹</span>
      <input inputMode="numeric" disabled={disabled} value={String(flat)} onChange={e => onFlat(num(e.target.value))} style={adminTinyInput} />
      <span style={{ fontFamily: F, fontSize: 10, fontWeight: 700, color: C.ghost, flexShrink: 0 }}>Or</span>
      <input inputMode="numeric" disabled={disabled} value={String(pct)} onChange={e => onPct(num(e.target.value))} style={adminTinyInput} />
      <span style={{ fontFamily: F, fontSize: 11, color: C.faint, flexShrink: 0 }}>%</span>
      {/* Matches the width of the add/remove icon button that trails a Volume tier row,
          so the ₹ box lines up at the same x-position in every section. */}
      <span style={{ width: 19, flexShrink: 0 }} />
    </div>
  );
}

function AdminSectionHeader({ title, blurb, on, onToggle }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 11 }}>
      <span style={{ flex: 1 }}>
        <span style={{ display: "block", fontFamily: F, fontSize: 13, fontWeight: 800, color: on ? C.ink : C.faint }}>{title}</span>
        <span style={{ display: "block", fontFamily: F, fontSize: 11, color: C.faint, marginTop: 2 }}>{blurb}</span>
      </span>
      <AdminOnOffToggle on={on} onClick={onToggle} />
    </div>
  );
}

/* ============================ TARGETS (easy-set) ============================
   Same visual as the Board's Target Achievement table — same columns, same tree — the
   difference is Target is a real input here. Type a number on any row and it splits
   equally across everyone under that row, all the way down to the SEs who actually carry
   the number. Retail and Value stay read-only; they're what happened, not what's set. */
function AdminTargetRow({ node, depth, expanded, onToggle, onSetTarget }) {
  const r = roll(node);
  const hasKids = !!(node.reports && node.reports.length);
  const open = expanded.has(node.id);
  // Not synced from a prop into local state on mount — that goes stale the moment a
  // parent row's edit cascades a new value down to this one, since mount only happens
  // once. Instead the input shows the live rolled-up value except while this exact field
  // is focused, when it shows whatever's being typed.
  const [draft, setDraft] = useState(null);
  const [focused, setFocused] = useState(false);
  const shown = focused && draft !== null ? draft : String(r.target);
  const commit = () => {
    const n = Math.max(0, parseInt((draft ?? String(r.target)).replace(/[^0-9]/g, ""), 10) || 0);
    setFocused(false); setDraft(null);
    if (n !== r.target) onSetTarget(node.id, n);
  };
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", padding: "9px 0", minHeight: 46, paddingLeft: 6,
        borderBottom: `1px solid ${C.border}`, borderLeft: `3px solid ${ROLE_TONE[node.role]}`,
        background: DEPTH_BG[Math.min(depth, DEPTH_BG.length - 1)] }}>
        <button type="button" onClick={() => hasKids && onToggle(node.id)} style={{ flex: 1, minWidth: 0, display: "flex",
          alignItems: "center", gap: 6, background: "none", border: "none", cursor: hasKids ? "pointer" : "default",
          textAlign: "left", padding: 0, WebkitTapHighlightColor: "transparent" }}>
          {hasKids ? (open ? <ChevronDown size={12} color={C.faint} /> : <ChevronRight size={12} color={C.faint} />)
                   : <span style={{ width: 12, flexShrink: 0 }} />}
          <Avatar r={node} size={depth === 0 ? 26 : 22} />
          <span style={{ minWidth: 0 }}>
            <span style={{ display: "block", fontFamily: F, fontSize: 12.5, fontWeight: depth === 0 ? 800 : 600, color: C.ink,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{node.name.split(" ")[0]}</span>
            <span style={{ display: "block", fontFamily: F, fontSize: 10, color: C.faint }}>
              {ROLE_SHORT[node.role]}{hasKids ? ` · ${r.heads}` : ""}
            </span>
          </span>
        </button>
        <input value={shown} onFocus={() => { setFocused(true); setDraft(String(r.target)); }}
          onChange={e => setDraft(e.target.value)} onBlur={commit}
          onKeyDown={e => e.key === "Enter" && e.currentTarget.blur()} inputMode="numeric"
          style={{ width: 42, textAlign: "center", border: `1.5px solid ${C.borderStrong}`, borderRadius: 7,
            padding: "5px 2px", fontFamily: F, fontSize: 12.5, fontWeight: 700, color: C.primary, background: C.card }} />
        <span style={{ width: 44, textAlign: "center", fontFamily: F, fontSize: 12.5, fontWeight: 600, color: C.sub }}>{r.retailed}</span>
        <span style={{ width: 62, textAlign: "right", paddingRight: 4, fontFamily: F, fontSize: 11.5, fontWeight: 700, color: C.ink }}>{inr(r.salesValue)}</span>
      </div>
      {open && hasKids && node.reports.map(c => (
        <AdminTargetRow key={c.id} node={c} depth={depth + 1} expanded={expanded} onToggle={onToggle} onSetTarget={onSetTarget} />
      ))}
    </>
  );
}

/* ============================ WALLET (CPaaS) ============================
   Modelled on how Gupshup and MSG91 actually run this: a prepaid INR balance, an
   auto-recharge that fires at a threshold and tops up by a fixed amount, low-balance
   alerts as a separate concern from auto-recharge, GST on every recharge, and a plain
   transaction ledger. Nothing here is invented — every field maps to a real control on
   one of those two platforms. */

const ADMIN_TXNS_SEED = [
  { id: 1, when: "Today, 9:14 AM", desc: "WhatsApp — Festive Offer campaign", amount: -1240 },
  { id: 2, when: "Yesterday", desc: "SMS — Test Drive Scheduled (auto)", amount: -380 },
  { id: 3, when: "3 days ago", desc: "Wallet recharge", amount: 10000 },
  { id: 4, when: "6 days ago", desc: "WhatsApp — Delivery Update (auto)", amount: -560 },
  { id: 5, when: "12 days ago", desc: "Wallet recharge — auto top-up", amount: 5000 },
];

const ADMIN_BILLING_DETAIL = {
  SMS: {
    total: 3820,
    lines: [
      { label: "Transactional SMS", desc: "1,340 sent", amount: 1850 },
      { label: "Marketing SMS", desc: "290 sent", amount: 470 },
    ],
    campaigns: [
      { name: "Festive Offer", recipients: 342, amount: 900 },
      { name: "Service Reminder Drive", recipients: 210, amount: 400 },
      { name: "New Year Greeting", recipients: 80, amount: 200 },
    ],
  },
  WhatsApp: {
    total: 5140,
    lines: [
      { label: "Transactional WhatsApp", desc: "890 sent", amount: 2940 },
      { label: "Marketing WhatsApp", desc: "104 sent", amount: 600 },
    ],
    campaigns: [
      { name: "New Model Launch", recipients: 418, amount: 1000 },
      { name: "Test Drive Reminder", recipients: 165, amount: 400 },
      { name: "Diwali Wishes", recipients: 96, amount: 200 },
    ],
  },
  "AI Calls": { total: 2140, lines: [{ label: "AI-handled calls", desc: "186 calls", amount: 2140 }], campaigns: [] },
  "Robo Calls": { total: 640, lines: [{ label: "Robo call reminders", desc: "412 calls", amount: 640 }], campaigns: [] },
};
const ADMIN_BILLING_TOTAL = Object.values(ADMIN_BILLING_DETAIL).reduce((n, c) => n + c.total, 0);

function AdminCampaignList({ campaigns }) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? campaigns : campaigns.slice(0, 2);
  if (!campaigns.length) return null;
  return (
    <div style={{ marginTop: 6, marginBottom: 4, paddingLeft: 11, borderLeft: `2px solid ${C.border}` }}>
      <div style={{ fontFamily: F, fontSize: 9.5, fontWeight: 800, color: C.faint, textTransform: "uppercase", marginBottom: 3 }}>Bulk campaigns</div>
      {shown.map(c => (
        <div key={c.name} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}>
          <span style={{ fontFamily: F, fontSize: 11, color: C.sub }}>{c.name} <span style={{ color: C.faint }}>· {c.recipients} recipients</span></span>
          <span style={{ fontFamily: F, fontSize: 11, fontWeight: 700, color: C.ink }}>{inr(c.amount)}</span>
        </div>
      ))}
      {campaigns.length > 2 && (
        <button onClick={() => setExpanded(v => !v)} style={{ background: "none", border: "none", cursor: "pointer",
          padding: "3px 0 0", fontFamily: F, fontWeight: 700, fontSize: 10.5, color: C.primary }}>
          {expanded ? "Show less" : "View more"}
        </button>
      )}
    </div>
  );
}

function AdminInvoiceScreen({ gstin, billingEmail, onBack, showToast }) {
  const gstRate = 18;
  const subtotal = ADMIN_BILLING_TOTAL;
  const gstAmt = Math.round(subtotal * gstRate / 100);

  return (
    <div style={{ padding: "14px 14px 90px" }}>
      <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 5, background: "none",
        border: "none", cursor: "pointer", padding: "0 0 12px", fontFamily: F, fontSize: 12.5, fontWeight: 700,
        color: C.primary }}><ChevronLeft size={14} />Back</button>
      <AdminScreenHeader title="Detailed report" blurb="Every transaction behind this month's total." />

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14, marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
          <span style={{ fontFamily: F, fontSize: 13, fontWeight: 800, color: C.ink }}>Autoprism Hyundai</span>
          <span style={{ fontFamily: F, fontSize: 11, color: C.faint }}>INV-2026-0847</span>
        </div>
        <div style={{ fontFamily: F, fontSize: 10.5, color: C.faint, marginBottom: 2 }}>GSTIN {gstin}</div>
        <div style={{ fontFamily: F, fontSize: 10.5, color: C.faint }}>Billed to {billingEmail} · 1–30 Sep 2026</div>
      </div>

      {Object.entries(ADMIN_BILLING_DETAIL).map(([channel, d]) => (
        <div key={channel} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14, marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 9 }}>
            <span style={{ fontFamily: F, fontSize: 13, fontWeight: 800, color: C.ink }}>{channel}</span>
            <span style={{ fontFamily: F, fontSize: 13, fontWeight: 800, color: C.ink }}>{inr(d.total)}</span>
          </div>
          {d.lines.map(l => (
            <div key={l.label} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
              <span style={{ fontFamily: F, fontSize: 12, color: C.sub }}>{l.label} <span style={{ color: C.faint }}>· {l.desc}</span></span>
              <span style={{ fontFamily: F, fontSize: 12, fontWeight: 700, color: C.ink }}>{inr(l.amount)}</span>
            </div>
          ))}
          <AdminCampaignList campaigns={d.campaigns} />
        </div>
      ))}

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14, marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
          <span style={{ fontFamily: F, fontSize: 12, color: C.sub }}>Subtotal</span>
          <span style={{ fontFamily: F, fontSize: 12, color: C.ink }}>{inr(subtotal)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
          <span style={{ fontFamily: F, fontSize: 12, color: C.sub }}>CGST @ 9%</span>
          <span style={{ fontFamily: F, fontSize: 12, color: C.ink }}>{inr(Math.round(gstAmt / 2))}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
          <span style={{ fontFamily: F, fontSize: 12, color: C.sub }}>SGST @ 9%</span>
          <span style={{ fontFamily: F, fontSize: 12, color: C.ink }}>{inr(Math.round(gstAmt / 2))}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8, marginTop: 4, borderTop: `1px solid ${C.borderStrong}` }}>
          <span style={{ fontFamily: F, fontSize: 13, fontWeight: 800, color: C.ink }}>Total</span>
          <span style={{ fontFamily: F, fontSize: 15.5, fontWeight: 900, color: C.primary }}>{inr(subtotal + gstAmt)}</span>
        </div>
      </div>

      <AdminPrimaryButton full onClick={() => showToast("GST_Invoice_Sep2026.pdf downloaded")}>Download PDF</AdminPrimaryButton>
    </div>
  );
}

/* ============================ AI AGENTS ============================
   Two different things, priced and measured differently, kept distinct rather than
   folded into one generic "automation" bucket:
     - Robo Call: a pre-recorded/IVR message, one-way, a few paise a call. Good for a
       reminder — nothing that needs to handle a question.
     - Voice AI: a real conversational agent, priced per call like a short support
       call because it genuinely is one. Used where the customer might push back or ask
       something, which a recording can't handle.
   Cost and value are shown side by side rather than collapsed into one "ROI multiple" —
   at these costs-per-call, that multiple is a huge, not-very-believable number the
   moment an agent influences even one car sale, so it hides more than it shows. */

// Value is counted only where a car was actually booked or retailed off the back of the
// call — a reactivated conversation or an attended test drive on its own earns nothing
// here, since neither is money until it turns into that.
const ADMIN_AGENTS_SEED = [
  {
    id: 1, name: "Test Drive Reminder", kind: "Robo Call", status: "running",
    trigger: "24h before a scheduled test drive",
    calls: 380, connected: 312, outcome: "No-show rate: 34% → 19%",
    costPerCall: 1.10, cost: 418, value: 8400000, valueNote: "6 bookings traced to attendees who'd have no-showed",
  },
  {
    id: 3, name: "Cold Lead Re-engagement", kind: "Voice AI", status: "running",
    trigger: "Lead marked Lost <3m, no contact in 30 days",
    calls: 210, connected: 96, outcome: "34 leads reactivated, 6 booked",
    costPerCall: 8, cost: 1680, value: 8400000, valueNote: "6 bookings from leads written off as lost",
  },
  {
    id: 4, name: "Post-Delivery Feedback & Referral", kind: "Voice AI", status: "paused",
    trigger: "3 days after vehicle delivery",
    calls: 150, connected: 89, outcome: "22 referrals captured, 3 booked",
    costPerCall: 8, cost: 1200, value: 4200000, valueNote: "3 sales from referred customers",
  },
];

function AdminAgentForm({ onSave, onCancel }) {
  const [name, setName] = useState("");
  const [kind, setKind] = useState("Robo Call");
  const [trigger, setTrigger] = useState("");
  const [costPerCall, setCostPerCall] = useState(kind === "Robo Call" ? "1.10" : "8");
  const canSave = name.trim() && trigger.trim();
  return (
    <div style={{ padding: "14px 14px 90px" }}>
      <button onClick={onCancel} style={{ display: "flex", alignItems: "center", gap: 5, background: "none",
        border: "none", cursor: "pointer", padding: "0 0 12px", fontFamily: F, fontSize: 12.5, fontWeight: 700,
        color: C.primary }}><ChevronLeft size={14} />Back</button>
      <AdminScreenHeader title="Add an agent" />
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14 }}>
        <AdminField label="Name"><AdminInput value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Booking Confirmation Call" /></AdminField>
        <AdminField label="Type">
          <div style={{ display: "flex", gap: 7 }}>
            {["Robo Call", "Voice AI"].map(k => (
              <button key={k} type="button" onClick={() => { setKind(k); setCostPerCall(k === "Robo Call" ? "1.10" : "8"); }} style={{
                flex: 1, padding: "9px 0", borderRadius: 9, cursor: "pointer",
                border: `1.5px solid ${kind === k ? C.primary : C.border}`,
                background: kind === k ? C.primarySoft : C.card, color: kind === k ? C.primary : C.sub,
                fontFamily: F, fontWeight: 700, fontSize: 12.5 }}>{k}</button>
            ))}
          </div>
        </AdminField>
        <AdminField label="Runs when"><AdminInput value={trigger} onChange={e => setTrigger(e.target.value)} placeholder="e.g. 2 days after a booking with no advance paid" /></AdminField>
        <AdminField label="Cost per call">
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ fontFamily: F, fontSize: 12.5, color: C.faint }}>₹</span>
            <AdminInput inputMode="numeric" value={costPerCall} onChange={e => setCostPerCall(e.target.value.replace(/[^0-9.]/g, ""))} />
          </div>
        </AdminField>
        <AdminPrimaryButton full disabled={!canSave} onClick={() => onSave({
          id: Date.now(), name: name.trim(), kind, status: "running", trigger: trigger.trim(),
          calls: 0, connected: 0, outcome: "No calls placed yet", costPerCall: Number(costPerCall) || 0, cost: 0, value: 0, valueNote: "",
        })}>Add agent</AdminPrimaryButton>
      </div>
    </div>
  );
}

function AdminAgentCard({ agent, onToggle, onDelete }) {
  const running = agent.status === "running";
  const kindColor = agent.kind === "Voice AI" ? C.purple : C.teal;
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14, marginBottom: 10, opacity: running ? 1 : 0.7 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 3 }}>
        <span style={{ flex: 1, minWidth: 0, fontFamily: F, fontSize: 13.5, fontWeight: 700, color: C.ink }}>{agent.name}</span>
        <span style={{ fontFamily: F, fontSize: 9, fontWeight: 800, color: kindColor, background: kindColor + "1A",
          borderRadius: 5, padding: "2px 6px", flexShrink: 0 }}>{agent.kind.toUpperCase()}</span>
        <span style={{ fontFamily: F, fontSize: 9, fontWeight: 800, color: running ? C.green : C.faint,
          background: running ? C.greenSoft : C.bg, borderRadius: 5, padding: "2px 6px", flexShrink: 0 }}>
          {running ? "RUNNING" : "PAUSED"}</span>
      </div>
      <div style={{ fontFamily: F, fontSize: 11, color: C.faint, marginBottom: 10 }}>{agent.trigger}</div>

      <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
        <span style={{ fontFamily: F, fontSize: 11.5, color: C.sub }}>Calls placed</span>
        <span style={{ fontFamily: F, fontSize: 12, fontWeight: 700, color: C.ink }}>
          {agent.calls.toLocaleString("en-IN")} <span style={{ color: C.faint, fontWeight: 500 }}>· {agent.calls ? Math.round(agent.connected / agent.calls * 100) : 0}% connected</span>
        </span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
        <span style={{ fontFamily: F, fontSize: 11.5, color: C.sub }}>Outcome</span>
        <span style={{ fontFamily: F, fontSize: 11.5, fontWeight: 600, color: C.ink, textAlign: "right", maxWidth: "60%" }}>{agent.outcome}</span>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 9, paddingTop: 9, borderTop: `1px solid ${C.border}` }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: F, fontSize: 9.5, fontWeight: 800, color: C.faint, textTransform: "uppercase" }}>Cost this month</div>
          <div style={{ fontFamily: F, fontSize: 13.5, fontWeight: 800, color: C.ink }}>{inr(agent.cost)}</div>
          <div style={{ fontFamily: F, fontSize: 9.5, color: C.faint }}>₹{agent.costPerCall}/call</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: F, fontSize: 9.5, fontWeight: 800, color: C.faint, textTransform: "uppercase" }}>Value captured</div>
          <div style={{ fontFamily: F, fontSize: 13.5, fontWeight: 800, color: C.primary }}>{agent.value ? inr(agent.value) : "—"}</div>
          {agent.valueNote && <div style={{ fontFamily: F, fontSize: 9.5, color: C.faint }}>{agent.valueNote}</div>}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 11 }}>
        <button onClick={() => onToggle(agent.id)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
          gap: 6, padding: "9px 0", borderRadius: 9, cursor: "pointer", border: `1.5px solid ${C.borderStrong}`,
          background: C.card, color: C.ink, fontFamily: F, fontWeight: 700, fontSize: 12 }}>
          {running ? <><Pause size={13} />Pause</> : <><PlayCircle size={13} />Resume</>}
        </button>
        <button onClick={() => onDelete(agent.id)} style={{ padding: "9px 12px", borderRadius: 9, cursor: "pointer",
          border: `1.5px solid ${C.borderStrong}`, background: C.card, display: "flex" }}>
          <Trash2 size={13} color={C.hot} />
        </button>
      </div>
    </div>
  );
}

function AdminAgentsScreen({ showToast }) {
  const [agents, setAgents] = useState(ADMIN_AGENTS_SEED);
  const [adding, setAdding] = useState(false);

  const toggle = (id) => setAgents(as => as.map(a => a.id === id ? { ...a, status: a.status === "running" ? "paused" : "running" } : a));
  const remove = (id) => {
    const a = agents.find(x => x.id === id);
    setAgents(as => as.filter(x => x.id !== id));
    if (a) showToast(`${a.name} deleted`);
  };

  if (adding) return <AdminAgentForm onCancel={() => setAdding(false)} onSave={(a) => { setAgents(as => [a, ...as]); setAdding(false); showToast(`${a.name} added and running`); }} />;

  const running = agents.filter(a => a.status === "running").length;
  const totalCost = agents.reduce((n, a) => n + a.cost, 0);
  const totalValue = agents.reduce((n, a) => n + a.value, 0);

  return (
    <div style={{ padding: "14px 14px 90px" }}>
      <AdminScreenHeader title="AI Agents" blurb="Robo calls and Voice AI — what's running, and what it's worth."
        action={<button onClick={() => setAdding(true)} style={{ padding: "9px 13px", borderRadius: 9, border: "none",
          background: C.primary, color: "#fff", fontFamily: F, fontWeight: 800, fontSize: 12, cursor: "pointer",
          whiteSpace: "nowrap" }}>+ Add</button>} />

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14, marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 10 }}>
          {[["Running", `${running}/${agents.length}`], ["Cost this month", inr(totalCost)], ["Value captured", inr(totalValue)]].map(([l, v]) => (
            <span key={l} style={{ flex: 1 }}>
              <span style={{ display: "block", fontFamily: F, fontSize: 10.5, fontWeight: 800, color: C.faint, textTransform: "uppercase" }}>{l}</span>
              <span style={{ display: "block", fontFamily: F, fontSize: 15.5, fontWeight: 900, color: C.ink, marginTop: 2 }}>{v}</span>
            </span>
          ))}
        </div>
      </div>

      {agents.length === 0 && (
        <div style={{ padding: 24, textAlign: "center", fontFamily: F, fontSize: 12.5, color: C.faint,
          background: C.card, border: `1px solid ${C.border}`, borderRadius: 14 }}>No agents yet.</div>
      )}
      {agents.map(a => <AdminAgentCard key={a.id} agent={a} onToggle={toggle} onDelete={remove} />)}
    </div>
  );
}

function AdminWalletScreen({ showToast }) {
  const [balance, setBalance] = useState(6420);
  const [rechargeAmt, setRechargeAmt] = useState("5000");
  const [autoOn, setAutoOn] = useState(true);
  const [threshold, setThreshold] = useState(2000);
  const [topUp, setTopUp] = useState(5000);
  const [alertOn, setAlertOn] = useState(true);
  const [alertThreshold, setAlertThreshold] = useState(1500);
  const [alertChannels, setAlertChannels] = useState(["SMS", "Email"]);
  const [alertPhone, setAlertPhone] = useState("+91 90080 11223");
  const [alertEmail, setAlertEmail] = useState("priya.nambiar@autoprism.in");
  const [gstin, setGstin] = useState("29ABCDE1234F1Z5");
  const [billingEmail, setBillingEmail] = useState("accounts@autoprism.in");
  const [txns, setTxns] = useState(ADMIN_TXNS_SEED);
  const [viewingInvoice, setViewingInvoice] = useState(false);
  const [txnsExpanded, setTxnsExpanded] = useState(false);
  const num = (v) => v.replace(/[^0-9]/g, "");

  const recharge = () => {
    const amt = Number(rechargeAmt) || 0;
    if (!amt) return;
    setBalance(b => b + amt);
    setTxns(t => [{ id: Date.now(), when: "Just now", desc: "Wallet recharge", amount: amt }, ...t]);
    showToast(`₹${amt.toLocaleString("en-IN")} added to wallet`);
  };
  const toggleAlertChannel = (c) => setAlertChannels(cs => cs.includes(c) ? cs.filter(x => x !== c) : [...cs, c]);

  const low = balance < alertThreshold;

  if (viewingInvoice) return <AdminInvoiceScreen gstin={gstin} billingEmail={billingEmail} onBack={() => setViewingInvoice(false)} showToast={showToast} />;

  return (
    <div style={{ padding: "14px 14px 90px" }}>
      <AdminScreenHeader title="Wallet" blurb="Prepaid balance for SMS and WhatsApp sends." />

      <div style={{ background: C.ink, borderRadius: 16, padding: 16, marginBottom: 12 }}>
        <div style={{ fontFamily: F, fontSize: 11, color: "rgba(255,255,255,0.6)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>
          Wallet balance
        </div>
        <div style={{ fontFamily: F, fontSize: 30.5, fontWeight: 900, color: "#fff", marginTop: 4 }}>
          ₹{balance.toLocaleString("en-IN")}
        </div>
        {low && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
            <AlertTriangle size={12} color={C.warm} />
            <span style={{ fontFamily: F, fontSize: 11, color: C.warm }}>Below your ₹{alertThreshold.toLocaleString("en-IN")} alert threshold</span>
          </div>
        )}
        <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
          <span style={{ fontFamily: F, fontSize: 12.5, color: "#fff", alignSelf: "center" }}>₹</span>
          <input inputMode="numeric" value={rechargeAmt} onChange={e => setRechargeAmt(num(e.target.value))} style={{
            flex: 1, boxSizing: "border-box", border: "none", borderRadius: 9, padding: "9px 11px",
            fontFamily: F, fontSize: 13, color: C.ink, background: "#fff", outline: "none" }} />
          <button onClick={recharge} style={{ padding: "0 16px", borderRadius: 9, border: "none", background: C.primary,
            color: "#fff", fontFamily: F, fontWeight: 800, fontSize: 12.5, cursor: "pointer" }}>Recharge</button>
        </div>
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14, marginBottom: 12, opacity: autoOn ? 1 : 0.55 }}>
        <AdminSectionHeader title="Auto-recharge" blurb="Tops up automatically so sends never stall mid-campaign."
          on={autoOn} onToggle={() => setAutoOn(v => !v)} />
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ flex: "1 1 0", fontFamily: F, fontSize: 12, color: C.sub }}>When balance falls below</span>
          <span style={{ fontFamily: F, fontSize: 11.5, color: C.faint }}>₹</span>
          <input inputMode="numeric" disabled={!autoOn} value={String(threshold)} onChange={e => setThreshold(Number(num(e.target.value)) || 0)} style={adminTinyInput} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
          <span style={{ flex: "1 1 0", fontFamily: F, fontSize: 12, color: C.sub }}>Add back</span>
          <span style={{ fontFamily: F, fontSize: 11.5, color: C.faint }}>₹</span>
          <input inputMode="numeric" disabled={!autoOn} value={String(topUp)} onChange={e => setTopUp(Number(num(e.target.value)) || 0)} style={adminTinyInput} />
        </div>
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14, marginBottom: 12, opacity: alertOn ? 1 : 0.55 }}>
        <AdminSectionHeader title="Low-balance alerts" blurb="A heads-up before auto-recharge would even kick in."
          on={alertOn} onToggle={() => setAlertOn(v => !v)} />
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 9 }}>
          <span style={{ flex: "1 1 0", fontFamily: F, fontSize: 12, color: C.sub }}>Alert when balance falls below</span>
          <span style={{ fontFamily: F, fontSize: 11.5, color: C.faint }}>₹</span>
          <input inputMode="numeric" disabled={!alertOn} value={String(alertThreshold)} onChange={e => setAlertThreshold(Number(num(e.target.value)) || 0)} style={adminTinyInput} />
        </div>
        <div style={{ display: "flex", gap: 6, marginBottom: 11 }}>
          {["SMS", "Email"].map(c => (
            <button key={c} disabled={!alertOn} onClick={() => toggleAlertChannel(c)} style={{ padding: "7px 12px", borderRadius: 8,
              cursor: "pointer", border: `1.5px solid ${alertChannels.includes(c) ? C.primary : C.border}`,
              background: alertChannels.includes(c) ? C.primarySoft : C.card, color: alertChannels.includes(c) ? C.primary : C.sub,
              fontFamily: F, fontWeight: 700, fontSize: 11.5 }}>{c}</button>
          ))}
        </div>
        {alertChannels.includes("SMS") && (
          <AdminField label="Alert phone number">
            <AdminInput disabled={!alertOn} value={alertPhone} onChange={e => setAlertPhone(e.target.value)} />
          </AdminField>
        )}
        {alertChannels.includes("Email") && (
          <AdminField label="Alert email">
            <AdminInput disabled={!alertOn} value={alertEmail} onChange={e => setAlertEmail(e.target.value)} />
          </AdminField>
        )}
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14, marginBottom: 12 }}>
        <div style={{ fontFamily: F, fontSize: 13, fontWeight: 800, color: C.ink, marginBottom: 2 }}>Billing history</div>
        <div style={{ fontFamily: F, fontSize: 11, color: C.faint, marginBottom: 11 }}>This month, by channel.</div>
        {Object.entries(ADMIN_BILLING_DETAIL).map(([ch, d]) => (
          <div key={ch} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0" }}>
            <span style={{ fontFamily: F, fontSize: 12, color: C.sub }}>{ch} <span style={{ color: C.faint }}>· {d.lines.map(l => l.desc).join(" + ")}</span></span>
            <span style={{ fontFamily: F, fontSize: 12.5, fontWeight: 700, color: C.ink }}>{inr(d.total)}</span>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8, marginTop: 4, borderTop: `1px solid ${C.borderStrong}` }}>
          <span style={{ fontFamily: F, fontSize: 12.5, fontWeight: 800, color: C.ink }}>Total</span>
          <span style={{ fontFamily: F, fontSize: 13.5, fontWeight: 900, color: C.primary }}>{inr(ADMIN_BILLING_TOTAL)}</span>
        </div>
        <button onClick={() => setViewingInvoice(true)} style={{ display: "block", width: "100%", textAlign: "center",
          marginTop: 11, padding: "9px 0", borderRadius: 9, cursor: "pointer", border: `1.5px solid ${C.borderStrong}`,
          background: C.card, fontFamily: F, fontWeight: 700, fontSize: 12, color: C.primary }}>
          Download detailed report
        </button>
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14, marginBottom: 12 }}>
        <div style={{ fontFamily: F, fontSize: 13, fontWeight: 800, color: C.ink, marginBottom: 2 }}>Billing details</div>
        <div style={{ fontFamily: F, fontSize: 11, color: C.faint, marginBottom: 11 }}>GST applies to every recharge.</div>
        <AdminField label="GSTIN"><AdminInput value={gstin} onChange={e => setGstin(e.target.value.toUpperCase())} /></AdminField>
        <AdminField label="Billing email"><AdminInput value={billingEmail} onChange={e => setBillingEmail(e.target.value)} /></AdminField>
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14, marginBottom: 14 }}>
        <div style={{ fontFamily: F, fontSize: 13, fontWeight: 800, color: C.ink, marginBottom: 11 }}>Transaction history</div>
        {(txnsExpanded ? txns : txns.slice(0, 3)).map((t, i) => (
          <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "8px 0", borderTop: i > 0 ? `1px solid ${C.border}` : "none" }}>
            <span style={{ minWidth: 0 }}>
              <span style={{ display: "block", fontFamily: F, fontSize: 12, color: C.ink }}>{t.desc}</span>
              <span style={{ display: "block", fontFamily: F, fontSize: 10.5, color: C.faint, marginTop: 1 }}>{t.when}</span>
            </span>
            <span style={{ fontFamily: F, fontSize: 12.5, fontWeight: 800, color: t.amount > 0 ? C.green : C.ink, flexShrink: 0 }}>
              {t.amount > 0 ? "+" : "−"}{inr(Math.abs(t.amount))}
            </span>
          </div>
        ))}
        {txns.length > 3 && (
          <button onClick={() => setTxnsExpanded(v => !v)} style={{ display: "block", width: "100%", textAlign: "center",
            background: "none", border: "none", cursor: "pointer", padding: "8px 0 0", fontFamily: F, fontWeight: 700,
            fontSize: 11.5, color: C.primary }}>{txnsExpanded ? "Show less" : "View more"}</button>
        )}
      </div>

      <AdminPrimaryButton full onClick={() => showToast("Wallet settings saved")}>Save wallet settings</AdminPrimaryButton>
    </div>
  );
}

function AdminTargetsScreen({ org, onSetTarget }) {
  const [expanded, setExpanded] = useState(new Set([org.id]));
  const toggle = (id) => setExpanded(s => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const r = roll(org);
  return (
    <div style={{ padding: "14px 14px 90px" }}>
      <AdminScreenHeader title="Targets" blurb="Type a number on any row — it splits equally under it." />
      <div style={{ background: C.card, borderRadius: 16, padding: "14px 10px", boxShadow: shadow }}>
        <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: 7, paddingLeft: 5,
          borderBottom: `1.5px solid ${C.borderStrong}` }}>
          <span style={{ flex: 1, fontFamily: F, fontSize: 9, fontWeight: 800, color: C.sub, textTransform: "uppercase" }}>Name</span>
          <span style={{ width: 42, textAlign: "center", fontFamily: F, fontSize: 9, fontWeight: 800, color: C.primary, textTransform: "uppercase" }}>Target</span>
          <span style={{ width: 44, textAlign: "center", fontFamily: F, fontSize: 9, fontWeight: 800, color: C.sub, textTransform: "uppercase" }}>Retail</span>
          <span style={{ width: 62, textAlign: "right", paddingRight: 4, fontFamily: F, fontSize: 9, fontWeight: 800, color: C.sub, textTransform: "uppercase" }}>Value</span>
        </div>
        <AdminTargetRow node={org} depth={0} expanded={expanded} onToggle={toggle} onSetTarget={onSetTarget} />
      </div>
      <div style={{ fontFamily: F, fontSize: 11, color: C.faint, marginTop: 9, textAlign: "center" }}>
        Dealership total: {r.target} cars this month.
      </div>
    </div>
  );
}

function AdminCommissionsScreen({ showToast, org }) {
  const [tiers, setTiers] = useState(ADMIN_TIERS_SEED);
  const [volumeOn, setVolumeOn] = useState(true);
  const [modelBonus, setModelBonus] = useState(ADMIN_MODEL_BONUS_SEED);
  const [modelOn, setModelOn] = useState(true);
  const [variantRules, setVariantRules] = useState([]);
  const [variantRulesOn, setVariantRulesOn] = useState(true);
  const [addingRule, setAddingRule] = useState(false);
  const [ruleModel, setRuleModel] = useState(ADMIN_MODELS[0]);
  const [ruleVariant, setRuleVariant] = useState("");
  const [ruleFlat, setRuleFlat] = useState(0);
  const [rulePct, setRulePct] = useState(0);
  const [addons, setAddons] = useState(ADMIN_ADDONS_SEED);
  const [addonsOn, setAddonsOn] = useState(true);
  const [targetBonus, setTargetBonus] = useState(ADMIN_TARGET_BONUS_SEED);
  const [targetBonusOn, setTargetBonusOn] = useState(true);
  const [previewId, setPreviewId] = useState(flatten(org)[0]?.id);

  const updateTier = (i, next) => setTiers(t => t.map((x, ix) => ix === i ? next : x));
  const removeTier = (i) => setTiers(t => t.filter((_, ix) => ix !== i).map((x, ix, arr) =>
    ix === arr.length - 1 ? { ...x, to: 999 } : x));
  const addTier = () => setTiers(t => {
    const last = t[t.length - 1];
    return [...t.slice(0, -1), { ...last, to: last.from + 3 },
      { id: Date.now(), from: last.from + 4, to: 999, flatRate: last.flatRate + 1500, pctRate: last.pctRate }];
  });

  const ses = flatten(org);
  const rep = ses.find(s => s.id === previewId) || ses[0];
  const calc = adminComputeIncentive(rep, tiers, volumeOn, modelBonus, modelOn, variantRulesOn ? variantRules : [], addons, addonsOn, targetBonus, targetBonusOn);

  return (
    <div style={{ padding: "14px 14px 90px" }}>
      <AdminScreenHeader title="Commissions" blurb="How a retail turns into a payout." />

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14, marginBottom: 12, opacity: volumeOn ? 1 : 0.55 }}>
        <AdminSectionHeader title="Volume incentive" blurb="By total units retailed this month." on={volumeOn} onToggle={() => setVolumeOn(v => !v)} />
        {tiers.map((t, i) => (
          <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 8 }}>
            <div style={{ flex: "1 1 0", minWidth: 0, display: "flex", alignItems: "center", gap: 5 }}>
              <input inputMode="numeric" disabled={!volumeOn} value={String(t.from)}
                onChange={e => updateTier(i, { ...t, from: Number(e.target.value.replace(/[^0-9]/g, "")) || 0 })}
                style={{ ...adminTinyInput, width: 30, flexShrink: 0 }} />
              <span style={{ fontFamily: F, fontSize: 10.5, color: C.faint, flexShrink: 0 }}>–</span>
              <input inputMode="numeric" disabled={!volumeOn} value={t.to >= 999 ? "" : String(t.to)} placeholder="∞"
                onChange={e => updateTier(i, { ...t, to: e.target.value === "" ? 999 : Number(e.target.value.replace(/[^0-9]/g, "")) || 0 })}
                style={{ ...adminTinyInput, width: 30, flexShrink: 0 }} />
              <span style={{ fontFamily: F, fontSize: 10, color: C.faint }}>cars</span>
            </div>
            <span style={{ fontFamily: F, fontSize: 11, color: C.faint, flexShrink: 0 }}>₹</span>
            <input inputMode="numeric" disabled={!volumeOn} value={String(t.flatRate)}
              onChange={e => updateTier(i, { ...t, flatRate: Number(e.target.value.replace(/[^0-9]/g, "")) || 0 })} style={adminTinyInput} />
            <span style={{ fontFamily: F, fontSize: 10, fontWeight: 700, color: C.ghost, flexShrink: 0 }}>Or</span>
            <input inputMode="numeric" disabled={!volumeOn} value={String(t.pctRate)}
              onChange={e => updateTier(i, { ...t, pctRate: Number(e.target.value.replace(/[^0-9]/g, "")) || 0 })} style={adminTinyInput} />
            <span style={{ fontFamily: F, fontSize: 11, color: C.faint, flexShrink: 0 }}>%</span>
            {i === tiers.length - 1
              ? <button onClick={addTier} disabled={!volumeOn} style={{ background: "none", border: "none", cursor: "pointer",
                  padding: "0 0 0 2px", flexShrink: 0, display: "flex" }}><Plus size={13} color={C.primary} /></button>
              : <button onClick={() => removeTier(i)} disabled={!volumeOn} style={{ background: "none", border: "none", cursor: "pointer",
                  padding: "0 0 0 2px", flexShrink: 0, display: "flex" }}><Trash2 size={12} color={C.hot} /></button>}
          </div>
        ))}
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14, marginBottom: 12, opacity: modelOn ? 1 : 0.55 }}>
        <AdminSectionHeader title="Model incentive" blurb="Fixed per model, stacked on the volume rate." on={modelOn} onToggle={() => setModelOn(v => !v)} />
        {ADMIN_MODELS.map(m => (
          <AdminFlatOrPct key={m} label={m} disabled={!modelOn} flat={modelBonus[m]?.flat ?? 0} pct={modelBonus[m]?.pct ?? 0}
            onFlat={(v) => setModelBonus(mb => ({ ...mb, [m]: { ...(mb[m] || {}), flat: v, pct: mb[m]?.pct ?? 0 } }))}
            onPct={(v) => setModelBonus(mb => ({ ...mb, [m]: { ...(mb[m] || {}), pct: v, flat: mb[m]?.flat ?? 0 } }))} />
        ))}
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14, marginBottom: 12, opacity: variantRulesOn ? 1 : 0.55 }}>
        <AdminSectionHeader title="Variant-specific rules" blurb="Overrides the model incentive above, for this variant only."
          on={variantRulesOn} onToggle={() => setVariantRulesOn(v => !v)} />

        {variantRules.map((r, i) => (
          <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ flex: 1, minWidth: 0, fontFamily: F, fontSize: 12, fontWeight: 600, color: C.ink,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.model} {r.variant}</span>
            <span style={{ fontFamily: F, fontSize: 11, color: C.faint }}>
              {r.flat > 0 ? `₹${r.flat}` : `${r.pct}%`}
            </span>
            <button onClick={() => setVariantRules(rs => rs.filter((_, ix) => ix !== i))} disabled={!variantRulesOn}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 2, flexShrink: 0, display: "flex" }}>
              <Trash2 size={12} color={C.hot} /></button>
          </div>
        ))}

        {addingRule ? (
          <div style={{ background: C.bg, borderRadius: 10, padding: 11, marginTop: 4 }}>
            <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
              <AdminSelect value={ruleModel} onChange={(v) => { setRuleModel(v); setRuleVariant(""); }} options={ADMIN_MODELS} />
              <AdminSelect value={ruleVariant} onChange={setRuleVariant} placeholder="Variant"
                options={(ADMIN_VEHICLES_SEED.find(m => m.model === ruleModel)?.variants || []).map(v => v.name)} />
            </div>
            <AdminFlatOrPct label="Rate for this variant" flat={ruleFlat} pct={rulePct} onFlat={setRuleFlat} onPct={setRulePct} />
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <AdminGhostButton onClick={() => setAddingRule(false)}>Cancel</AdminGhostButton>
              <div style={{ flex: 1 }}>
                <AdminPrimaryButton full disabled={!ruleVariant} onClick={() => {
                  setVariantRules(rs => [...rs.filter(r => !(r.model === ruleModel && r.variant === ruleVariant)),
                    { id: Date.now(), model: ruleModel, variant: ruleVariant, flat: ruleFlat, pct: rulePct }]);
                  setAddingRule(false); setRuleVariant(""); setRuleFlat(0); setRulePct(0);
                }}>Add rule</AdminPrimaryButton>
              </div>
            </div>
          </div>
        ) : (
          <button onClick={() => setAddingRule(true)} disabled={!variantRulesOn} style={{ display: "flex", alignItems: "center", gap: 6,
            width: "100%", justifyContent: "center", padding: "9px 0", borderRadius: 9, marginTop: 2, cursor: "pointer",
            border: `1.5px dashed ${C.borderStrong}`, background: "none", fontFamily: F, fontWeight: 700, fontSize: 12, color: C.primary }}>
            <Plus size={13} />Add a rule
          </button>
        )}
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14, marginBottom: 12, opacity: addonsOn ? 1 : 0.55 }}>
        <AdminSectionHeader title="Add-on incentives" blurb="Six products — flat, percentage, or both." on={addonsOn} onToggle={() => setAddonsOn(v => !v)} />
        {addons.map((a, i) => (
          <AdminFlatOrPct key={a.key} label={a.label} disabled={!addonsOn} flat={a.flatValue} pct={a.pctValue}
            onFlat={(v) => setAddons(as => as.map((x, ix) => ix === i ? { ...x, flatValue: v } : x))}
            onPct={(v) => setAddons(as => as.map((x, ix) => ix === i ? { ...x, pctValue: v } : x))} />
        ))}
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14, marginBottom: 12, opacity: targetBonusOn ? 1 : 0.55 }}>
        <AdminSectionHeader title="Target achievement incentive" blurb="Paid only if retailed meets or beats target."
          on={targetBonusOn} onToggle={() => setTargetBonusOn(v => !v)} />
        <AdminFlatOrPct label="On hitting target" disabled={!targetBonusOn} flat={targetBonus.flat} pct={targetBonus.pct}
          onFlat={(v) => setTargetBonus(x => ({ ...x, flat: v }))} onPct={(v) => setTargetBonus(x => ({ ...x, pct: v }))} />
      </div>

      <div style={{ background: C.card, border: `1.5px solid ${C.primary}44`, borderRadius: 14, padding: 14, marginBottom: 14 }}>
        <div style={{ fontFamily: F, fontSize: 13, fontWeight: 800, color: C.ink, marginBottom: 9 }}>See it for someone</div>
        <AdminSelect value={rep.name} onChange={v => { const s = ses.find(x => x.name === v); if (s) setPreviewId(s.id); }}
          options={ses.map(s => s.name)} />
        <div style={{ marginTop: 9, background: C.bg, borderRadius: 10, padding: "11px 12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 10 }}>
            <Avatar r={rep} size={30} />
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", fontFamily: F, fontSize: 13, fontWeight: 700, color: C.ink }}>{rep.name}</span>
              <span style={{ display: "block", fontFamily: F, fontSize: 11, color: C.faint }}>{rep.retailed} retailed this month</span>
            </span>
          </div>

          {volumeOn && calc.modelLines.length > 0 && (
            <>
              <div style={{ fontFamily: F, fontSize: 10, fontWeight: 800, color: C.faint, textTransform: "uppercase", margin: "2px 0 4px" }}>Volume + model</div>
              {calc.modelLines.map(l => (
                <div key={l.model} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                  <span style={{ fontFamily: F, fontSize: 11.5, color: C.sub }}>{l.model} <span style={{ color: C.faint }}>· {l.count} car{l.count !== 1 ? "s" : ""}</span>
                    {l.overridden && <span style={{ marginLeft: 5, fontFamily: F, fontSize: 9, fontWeight: 800, color: C.primary,
                      background: C.primarySoft, borderRadius: 4, padding: "1px 5px" }}>OVERRIDE</span>}</span>
                  <span style={{ fontFamily: F, fontSize: 12, fontWeight: 700, color: C.ink }}>{inr(l.amount)}</span>
                </div>
              ))}
            </>
          )}

          {addonsOn && calc.addonLines.length > 0 && (
            <>
              <div style={{ fontFamily: F, fontSize: 10, fontWeight: 800, color: C.faint, textTransform: "uppercase", margin: "9px 0 4px" }}>Add-ons</div>
              {calc.addonLines.map(l => (
                <div key={l.key} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                  <span style={{ fontFamily: F, fontSize: 11.5, color: C.sub }}>
                    {l.label} <span style={{ color: C.faint }}>
                      · {l.flatAmt > 0 ? `${l.count} × ${inr(l.flatValue)}` : ""}{l.flatAmt > 0 && l.pctAmt > 0 ? " + " : ""}{l.pctAmt > 0 ? `${l.pctValue}% of ${inr(l.billTotal)}` : ""}
                    </span>
                  </span>
                  <span style={{ fontFamily: F, fontSize: 12, fontWeight: 700, color: C.ink }}>{inr(l.amount)}</span>
                </div>
              ))}
            </>
          )}

          {targetBonusOn && (
            <>
              <div style={{ fontFamily: F, fontSize: 10, fontWeight: 800, color: C.faint, textTransform: "uppercase", margin: "9px 0 4px" }}>Target</div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                <span style={{ fontFamily: F, fontSize: 11.5, color: C.sub }}>
                  {rep.retailed}/{rep.target} <span style={{ color: calc.achieved ? C.green : C.faint }}>
                    {calc.achieved ? "· target met" : "· short of target"}</span>
                </span>
                <span style={{ fontFamily: F, fontSize: 12, fontWeight: 700, color: C.ink }}>{inr(calc.targetAmount)}</span>
              </div>
            </>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8, marginTop: 8, borderTop: `1px solid ${C.borderStrong}` }}>
            <span style={{ fontFamily: F, fontSize: 13, fontWeight: 800, color: C.ink }}>Total payout</span>
            <span style={{ fontFamily: F, fontSize: 15.5, fontWeight: 900, color: C.primary }}>{inr(calc.total)}</span>
          </div>
        </div>
      </div>

      <AdminPrimaryButton full onClick={() => showToast("Commission scheme saved")}>Save commission scheme</AdminPrimaryButton>
    </div>
  );
}

function MyAccountScreen({ showToast }) {
  const [name, setName] = useState("Priya Nambiar");
  const [role, setRole] = useState("Sales Manager");
  const [email, setEmail] = useState("priya.nambiar@autoprism.in");
  const [language, setLanguage] = useState("English");
  const [newPassword, setNewPassword] = useState("");
  const [changingPw, setChangingPw] = useState(false);

  const save = () => {
    if (changingPw && newPassword.trim()) { showToast("Profile and password updated"); setNewPassword(""); setChangingPw(false); }
    else showToast("Profile updated");
  };

  return (
    <div style={{ padding: "14px 14px 90px" }}>
      <div style={{ fontFamily: F, fontWeight: 800, fontSize: 15.5, color: C.ink, marginBottom: 3 }}>My Account</div>
      <div style={{ fontFamily: F, fontSize: 12, color: C.sub, marginBottom: 13 }}>Your login details and preferences.</div>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <span style={{ width: 46, height: 46, borderRadius: "50%", background: C.ink, color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F, fontWeight: 800, fontSize: 15 }}>PN</span>
          <span style={{ fontFamily: F, fontSize: 11, color: C.faint }}>Photo can't be changed here — set it from the app icon.</span>
        </div>

        <AdminField label="Profile name"><AdminInput value={name} onChange={e => setName(e.target.value)} /></AdminField>
        <AdminField label="Role">
          <AdminSelect value={role} onChange={setRole} options={ADMIN_ROLE_DEFS.map(r => r.label)} />
        </AdminField>
        <AdminField label="Email ID"><AdminInput value={email} onChange={e => setEmail(e.target.value)} /></AdminField>
        <AdminField label="Language">
          <AdminSelect value={language} onChange={setLanguage} options={["English", "Hindi", "Telugu", "Kannada", "Tamil"]} />
        </AdminField>

        <AdminDivider />

        {changingPw ? (
          <>
            <AdminField label="New password">
              <AdminInput type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="At least 8 characters" />
            </AdminField>
            <button onClick={() => { setChangingPw(false); setNewPassword(""); }} style={{ background: "none", border: "none",
              cursor: "pointer", padding: "0 0 12px", fontFamily: F, fontWeight: 700, fontSize: 11.5, color: C.sub }}>Cancel password change</button>
          </>
        ) : (
          <button onClick={() => setChangingPw(true)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
            width: "100%", background: "none", border: "none", cursor: "pointer", padding: "0 0 14px" }}>
            <span style={{ fontFamily: F, fontSize: 12.5, fontWeight: 700, color: C.ink }}>Password</span>
            <span style={{ fontFamily: F, fontSize: 12, fontWeight: 700, color: C.primary }}>Change</span>
          </button>
        )}

        <AdminPrimaryButton full onClick={save}>Save changes</AdminPrimaryButton>
      </div>
    </div>
  );
}

function PlaceholderScreen({ title, blurb, Icon }) {
  return (
    <div style={{ padding: "14px 14px 90px" }}>
      <div style={{ fontFamily: F, fontWeight: 800, fontSize: 15.5, color: C.ink }}>{title}</div>
      <div style={{ fontFamily: F, fontSize: 11.5, color: C.sub, marginTop: 1, marginBottom: 14 }}>{blurb}</div>
      <div style={{ background: C.card, border: `1px dashed ${C.borderStrong}`, borderRadius: 14,
        padding: 28, textAlign: "center" }}>
        <Icon size={22} color={C.ghost} />
        <div style={{ fontFamily: F, fontSize: 13, color: C.sub, marginTop: 9 }}>Not built yet.</div>
      </div>
    </div>
  );
}

export default function ManagerApp() {
  const [tab, setTab] = useState("board");
  const [openGroup, setOpenGroup] = useState("board");
  const [menuOpen, setMenuOpen] = useState(false);
  const [rep, setRep] = useState(null);
  const [drill, setDrill] = useState(null);
  const [lead, setLead] = useState(null);
  const [done, setDone] = useState([]);
  // Leads the manager is personally driving to close. Ownership and retail credit stay
  // with the SE — the manager is alongside, not instead. Keyed by lead id.
  const [handling, setHandling] = useState({});
  const [transfers, setTransfers] = useState({});   // leadId -> new ownerId
  // Calls the manager personally logs from Call Queue / Follow-Ups. Kept separate from the
  // seed data's static timeline (which can't be mutated and re-render reliably) and merged
  // into it only when Recent Activity actually renders.
  const [managerActivity, setManagerActivity] = useState([]);
  const logManagerActivity = (lead, outcome, note) => setManagerActivity(a => [
    { leadId: lead.id, leadName: lead.name, owner: lead.owner, when: "Just now",
      what: `Call logged by Priya Nambiar — ${outcome}${note ? `: ${note}` : ""}` },
    ...a,
  ]);
  const [org, setOrg] = useState(() => JSON.parse(JSON.stringify(ORG)));
  // Every structural change, newest first. Each entry can be reversed; reversing one that a
  // later change depends on reverses the later one too, and says so first.
  const [history, setHistory] = useState([]);
  const recordMoves = (entry) => setHistory(h => [{ id: Date.now() + Math.random(), at: new Date(), ...entry }, ...h]);
  const movePerson = (personId, newLeaderId) => setOrg(o => {
    const next = JSON.parse(JSON.stringify(o));
    let moved = null;
    const detach = (n) => {
      const i = (n.reports || []).findIndex(c => c.id === personId);
      if (i >= 0) { moved = n.reports.splice(i, 1)[0]; return true; }
      return (n.reports || []).some(detach);
    };
    const attach = (n) => {
      if (n.id === newLeaderId) { n.reports = n.reports || []; n.reports.push(moved); return true; }
      return (n.reports || []).some(attach);
    };
    detach(next); if (moved) attach(next);
    return next;
  });
  // Setting a number on any node — a Sales Manager, a Team Leader, or a single SE — splits
  // that total equally across its direct reports, and each of those splits again across
  // theirs, all the way to the leaves. A Sales Executive has no reports, so the number
  // lands directly on them. Remainders go to the first few children so the total always
  // adds back up exactly, never silently drops a car.
  const distributeTarget = (node, total) => {
    if (!node.reports || node.reports.length === 0) return { ...node, target: total };
    const n = node.reports.length;
    const base = Math.floor(total / n), extra = total - base * n;
    return { ...node, reports: node.reports.map((c, i) => distributeTarget(c, base + (i < extra ? 1 : 0))) };
  };
  const setOrgTarget = (nodeId, total) => setOrg(o => {
    const apply = (n) => n.id === nodeId ? distributeTarget(n, total) : { ...n, reports: (n.reports || []).map(apply) };
    return apply(o);
  });

  const takeOver = (l, note) => {
    setHandling(h => ({ ...h, [l.id]: { note, since: "just now" } }));
    // Taking over IS the resolution of any escalation on this lead.
    const esc = ACTIONS.find(a => a.customer === l.name && a.raisedBy === l.owner && !done.includes(a.id));
    if (esc) setDone(d => [...d, esc.id]);
    const who = l.owner.split(" ")[0];
    showToast(`You're now driving ${l.name} to close — ${who} keeps the retail. ${who} notified.`);
    setLead(null);
  };
  const [toast, setToast] = useState(null);
  const showToast = (m) => { setToast(m); setTimeout(() => setToast(null), 2800); };

  const actions = ACTIONS.filter(a => !done.includes(a.id));
  const resolve = (id, verb, note) => {
    const item = ACTIONS.find(a => a.id === id);
    setDone(d => [...d, id]);
    const who = item.raisedBy.split(" ")[0];
    const base = verb === "approve" ? `Approved — ${who} notified`
      : verb === "decline" ? `Declined — reason sent to ${who}`
      : verb === "ack" ? `Marked as yours — ${who} notified`
      : `Resolved — ${who} notified`;
    showToast(note ? `${base}, with your note` : base);
  };

  const openLeadFromAction = (item) => {
    const match = LEADS.find(l => l.name === item.customer && l.owner === item.raisedBy);
    setLead({ ...match, escalation: done.includes(item.id) ? null : item });
  };

  const NAV = [
    { key: "board", label: "Board", Icon: Target, subs: [] },
    { key: "leads", label: "Leads", Icon: ClipboardList, subs: [
      { key: "leads:all",       label: "All Leads" },
      { key: "leads:queue",     label: "Call Queue" },
      { key: "leads:followups", label: "Follow-Ups" },
      { key: "leads:activity",  label: "Recent Activity" },
    ]},
    { key: "inventory", label: "Inventory", Icon: Car, subs: [
      { key: "inventory:new",      label: "New Cars" },
      { key: "inventory:preowned", label: "Pre-Owned" },
      { key: "inventory:demo",     label: "Demo Cars" },
      { key: "inventory:block",    label: "Block/Allocate a car" },
    ]},
    { key: "performance", label: "Performance", Icon: BarChart3, subs: [
      { key: "performance:target", label: "Target Achievement" },
      { key: "performance:model",  label: "Model Performance" },
      { key: "performance:funnel", label: "Funnel by Person" },
      { key: "performance:board",  label: "Leaderboard" },
    ]},
    { key: "learning", label: "Learning", Icon: GraduationCap, subs: [] },
    { key: "team", label: "Teams", Icon: Users, subs: [
      { key: "team:structure", label: "Team Structure" },
      { key: "team:transfer",  label: "Transfer Leads" },
      { key: "team:members",   label: "Add/Edit Team Member" },
    ]},
    { key: "reports", label: "Reports", Icon: FileText, subs: [
      { key: "reports:all",   label: "All Reports" },
      { key: "reports:sched", label: "Schedule Report" },
    ]},
    // Admin is a privilege, not a role. The sheet marks these CEO-level; this login has
    // been granted them, so the section appears with the full set.
    { key: "admin", label: "Admin", Icon: Settings, subs: [
      { key: "admin:users",        label: "Users & Roles" },
      { key: "admin:leadrules",    label: "Lead Rules" },
      { key: "admin:locations",    label: "Locations" },
      { key: "admin:vehicles",     label: "Vehicles" },
      { key: "admin:messaging",    label: "Messaging" },
      { key: "admin:targets",      label: "Targets" },
      { key: "admin:commissions",  label: "Commissions" },
      { key: "admin:security",     label: "Security" },
      { key: "admin:wallet", label: "Wallet" },
      { key: "admin:agents",      label: "AI Agents" },
    ]},
    { key: "account", label: "My Account", Icon: User, subs: [] },
  ];
  const [base, sub] = String(tab).split(":");

  return (
    <div style={{ width: "100%", maxWidth: 420, margin: "0 auto", height: "100vh", maxHeight: 900,
      background: C.bg, display: "flex", flexDirection: "column", position: "relative",
      borderRadius: 22, overflow: "hidden", boxShadow: "0 10px 40px rgba(0,0,0,.12)" }}>

      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "15px 14px 13px",
        background: C.card, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        <button className="mg-menu-btn" onClick={() => setMenuOpen(true)}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
          <Menu size={20} color={C.ink} />
        </button>
        <span style={{ fontFamily: F, fontWeight: 900, fontSize: 15.5, letterSpacing: -0.3, color: C.ink }}>
          AUTOPRISM<span style={{ color: C.primary }}>°</span>
        </span>
        <span style={{ flex: 1 }} />
        <span style={{ position: "relative", display: "flex" }}>
          <Bell size={18} color={C.sub} />
          {actions.length > 0 && (
            <span style={{ position: "absolute", top: -4, right: -5, minWidth: 14, height: 14,
              borderRadius: 7, background: C.hot, color: "#fff", fontFamily: F, fontSize: 9,
              fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center",
              padding: "0 3px" }}>{actions.length}</span>
          )}
        </span>
        <span style={{ width: 30, height: 30, borderRadius: "50%", background: C.ink, color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: F, fontWeight: 800, fontSize: 11.5 }}>PN</span>
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {lead && <LeadScreen lead={lead} onBack={() => setLead(null)} showToast={showToast}
          handling={handling} onTakeOver={takeOver}
          onReassign={() => { setLead(null); setTab("team:transfer"); }} />}
        {!lead && base === "board" && (drill
          ? <DrillScreen drill={drill} onBack={() => setDrill(null)} onOpenLead={setLead} handling={handling} />
          : <BoardScreen actions={actions} onResolve={resolve} onPick={setRep} org={org}
              onDrill={(node, stage) => setDrill({ node, stage })}
              onOpenLead={(item) => item.kind === "followup"
                ? setLead({ ...item.lead })
                : openLeadFromAction(item)}
              onOpenCancellation={setLead} onLogCall={logManagerActivity} showToast={showToast}
              handling={handling}
              onLogFollowUp={(l, k) => {
                if (k === "log") { showToast(`Outcome logged on ${l.name} — next follow-up set`); return; }
                showToast(k === "call" ? `Calling ${l.name}` : `WhatsApp to ${l.name}`);
              }} />)}
        {!lead && base === "team" && (sub === "transfer"
          ? <TransferScreen showToast={showToast} transfers={transfers}
              onTransferred={(moves) => setTransfers(t2 => ({ ...t2, ...moves }))} />
          : sub === "structure"
          ? <TeamStructureScreen showToast={showToast} org={org} onMove={movePerson} history={history} onRecord={recordMoves}
              onReverse={(entries) => {
                // Newest first, so each person returns through the chain in the right order.
                const sorted = [...entries].sort((a, b2) => new Date(b2.at) - new Date(a.at));
                sorted.forEach(e => e.people.forEach(p2 => p2.from && movePerson(p2.id, p2.from)));
                const gone = new Set(sorted.map(e => e.id));
                setHistory(h => h.filter(e => !gone.has(e.id)));
              }} />
          : <TeamMembersScreen showToast={showToast} />)}
        {!lead && base === "leads" && <OrgLeadsScreen sub={sub} handling={handling} transfers={transfers} onOpen={setLead}
          managerActivity={managerActivity} onLogCall={logManagerActivity} showToast={showToast} />}
        {!lead && base === "inventory" && <InventoryScreen sub={sub} />}
        {!lead && base === "account" && <MyAccountScreen showToast={showToast} />}
        {!lead && base === "performance" && (
          sub === "model" ? <ModelDashboard />
          : sub === "funnel" ? <FunnelDashboard org={org} />
          : sub === "board" ? <LeaderboardScreen onPick={setRep} />
          : <BoardScreen actions={[]} onResolve={() => {}} onPick={setRep} org={org}
              onDrill={(node, stage) => setDrill({ node, stage })} onOpenLead={openLeadFromAction}
              handling={{}} onLogFollowUp={() => {}} />)}
        {!lead && base === "reports" && <ReportsScreen showToast={showToast} />}
        {!lead && base === "learning" && <LearningScreen showToast={showToast} />}
        {!lead && base === "admin" && (
          sub === "users" ? <AdminUsersScreen showToast={showToast} />
          : sub === "leadrules" ? <AdminLeadRulesScreen showToast={showToast} />
          : sub === "locations" ? <AdminLocationsScreen showToast={showToast} />
          : sub === "vehicles" ? <AdminVehiclesScreen showToast={showToast} />
          : sub === "messaging" ? <AdminMessagingScreen showToast={showToast} />
          : sub === "security" ? <AdminSecurityScreen showToast={showToast} />
          : sub === "wallet" ? <AdminWalletScreen showToast={showToast} />
          : sub === "agents" ? <AdminAgentsScreen showToast={showToast} />
          : sub === "targets" ? <AdminTargetsScreen org={org} onSetTarget={setOrgTarget} />
          : sub === "commissions" ? <AdminCommissionsScreen showToast={showToast} org={org} />
          : <PlaceholderScreen title={"Admin · " + (sub || "")} Icon={Settings}
              blurb="Not built yet." />
        )}
      </div>

      {menuOpen && (
        <div style={{ position: "absolute", inset: 0, zIndex: 150, display: "flex" }}>
          <div onClick={() => setMenuOpen(false)} style={{ position: "absolute", inset: 0,
            background: "rgba(14,14,12,0.4)" }} />
          <div style={{ position: "relative", width: "78%", maxWidth: 280, height: "100%", background: C.card,
            boxShadow: "8px 0 32px rgba(0,0,0,0.18)", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "18px 18px 12px" }}>
              <div style={{ fontFamily: F, fontWeight: 900, fontSize: 15.5, color: C.ink, letterSpacing: -0.5 }}>
                AUTOPRISM<span style={{ color: C.primary }}>°</span>
              </div>
              <div style={{ fontFamily: F, fontSize: 11.5, color: C.faint, marginTop: 3 }}>
                Priya Nambiar · Sales Manager
              </div>
            </div>
            <div style={{ padding: "0 12px", flex: 1, overflowY: "auto" }}>
              {NAV.map(t => {
                const groupActive = t.subs.length ? t.subs.some(x => x.key === tab) : tab === t.key;
                const expanded = openGroup === t.key;
                return (
                  <div key={t.key} style={{ marginBottom: 2 }}>
                    <button onClick={() => {
                      if (!t.subs.length) { setLead(null); setDrill(null); setTab(t.key); setMenuOpen(false); return; }
                      setOpenGroup(expanded ? null : t.key);
                    }} style={{
                      display: "flex", alignItems: "center", gap: 11, width: "100%", padding: "11px 12px",
                      borderRadius: 9, border: "none", background: groupActive ? C.primarySoft : "none",
                      cursor: "pointer", textAlign: "left",
                    }}>
                      <t.Icon size={17} color={groupActive ? C.primary : C.faint} />
                      <span style={{ flex: 1, fontFamily: F, fontWeight: groupActive ? 700 : 500,
                        fontSize: 14, color: groupActive ? C.primary : C.ink }}>{t.label}</span>
                      {t.subs.length > 0 && <ChevronDown size={14} color={C.ghost}
                        style={{ transform: expanded ? "rotate(180deg)" : "none" }} />}
                    </button>
                    {expanded && t.subs.map(sub => (
                      <button key={sub.key} onClick={() => { setLead(null); setDrill(null); setTab(sub.key); setMenuOpen(false); }} style={{
                        display: "flex", width: "100%", padding: "8px 12px 8px 40px", borderRadius: 8,
                        border: "none", background: tab === sub.key ? C.primarySoft : "none",
                        cursor: "pointer", textAlign: "left",
                      }}>
                        <span style={{ fontFamily: F, fontWeight: tab === sub.key ? 700 : 500,
                          fontSize: 13, color: tab === sub.key ? C.primary : C.sub }}>{sub.label}</span>
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
            <div style={{ padding: 14, borderTop: `1px solid ${C.border}` }}>
              <button onClick={() => setMenuOpen(false)} style={{ background: "none", border: "none",
                cursor: "pointer", padding: 0, fontFamily: F, fontSize: 13, fontWeight: 700,
                color: C.hot }}>Sign out</button>
            </div>
          </div>
        </div>
      )}

      {rep && <RepSheet rep={rep} onClose={() => setRep(null)} showToast={showToast} />}


      {toast && (
        <div style={{ position: "absolute", bottom: 22, left: 14, right: 14, background: C.ink,
          color: "#fff", borderRadius: 11, padding: "12px 14px", fontFamily: F, fontSize: 13,
          fontWeight: 600, textAlign: "center", zIndex: 300 }}>{toast}</div>
      )}
    </div>
  );
}
