/* Epic River sample leads — one shared pool so the Telecaller, Sales Executive and Manager logins
   show the same customers at consistent stages. Deterministic (seeded), sample data only.

   Each lead is app-agnostic; every login maps it onto its own lead shape and stage names.
   Stage ladder (generic):  new → attempted → contacted → interested → test_ride → booking →
   retailed → delivered, or lost (with lostReason / lostAt / lostTo).

   Who owns what (the demo's two Pune stores, Aundh L014 and Shivaji Nagar L015):
   - telecaller: "Priya Nambiar" — early-funnel leads (new … interested, plus some lost).
   - SEs: the Sales Executive login is "Rahul Kumar" (Aundh); the others are his team-mates.
   - Manager login (Priya's team / both stores) sees every lead.                               */

const TODAY = new Date("2026-11-19T10:00:00+05:30");

function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function rng(seed) { let a = hash(seed); return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
function pickW(r, pairs) { const t = pairs.reduce((s, [, w]) => s + w, 0); let x = r() * t; for (const [v, w] of pairs) { if ((x -= w) <= 0) return v; } return pairs[pairs.length - 1][0]; }
const daysAgo = (n, hour = 11) => { const d = new Date(TODAY); d.setDate(d.getDate() - n); d.setHours(hour, (n * 7) % 60, 0, 0); return d.toISOString(); };

const FIRST = ["Aarav", "Aditi", "Akash", "Ananya", "Anil", "Anjali", "Arjun", "Asha", "Bhavna", "Chetan", "Deepak", "Divya", "Farhan", "Gauri", "Harsh", "Isha", "Jayesh", "Kavita", "Kiran", "Lakshmi", "Mahesh", "Manasi", "Meera", "Mihir", "Neha", "Nikhil", "Omkar", "Pooja", "Prachi", "Pranav", "Rahul", "Rajesh", "Ravi", "Riya", "Rohan", "Sachin", "Sakshi", "Sameer", "Sanjay", "Shreya", "Siddharth", "Sneha", "Sunil", "Swati", "Tanvi", "Tejas", "Uday", "Varun", "Vikram", "Yash", "Zoya", "Imran", "Fatima", "Joseph", "Mary", "Gurpreet", "Harpreet", "Venkat", "Sai", "Pallavi"];
const LAST = ["Kulkarni", "Deshpande", "Joshi", "Patil", "Pawar", "Shinde", "Jadhav", "Gokhale", "Bhosale", "Chavan", "Sharma", "Verma", "Iyer", "Nair", "Menon", "Rao", "Reddy", "Shaikh", "Khan", "D'Souza", "Fernandes", "Gupta", "Mehta", "Shah", "Agarwal", "Bhat", "Kamath", "Sawant", "More", "Gaikwad"];
const LOCALITY = {
  L014: ["Aundh", "Baner", "Pashan", "Balewadi", "Wakad", "Pimple Saudagar", "Sus", "Bavdhan", "Hinjewadi", "Pimple Nilakh"],
  L015: ["Shivajinagar", "Deccan", "Kothrud", "Model Colony", "Erandwane", "Karve Nagar", "Sadashiv Peth", "Wakdewadi", "Khadki", "Yerawada"],
};
export const LEAD_SOURCES = ["Walk-in", "Website", "Referral", "BikeDekho", "BikeWale", "Google Ad", "Facebook Ad", "Instagram Ad", "Justdial", "OLX", "Corporate/Fleet"];
const SOURCE_W = [["Walk-in", 20], ["Website", 14], ["Referral", 10], ["BikeDekho", 9], ["BikeWale", 6], ["Google Ad", 10], ["Facebook Ad", 8], ["Instagram Ad", 9], ["Justdial", 6], ["OLX", 5], ["Corporate/Fleet", 3]];
export const VARIANTS = ["750W", "750W + Plus Two", "750W + Plus Five", "480W", "480W + Plus Two", "480W + Plus Five"];
const VARIANT_W = [["750W", 30], ["750W + Plus Two", 14], ["750W + Plus Five", 9], ["480W", 30], ["480W + Plus Two", 11], ["480W + Plus Five", 6]];
export const COLOURS = ["Monsoon Blue", "Summer Red", "Spring Yellow", "Winter White", "Storm Grey"];
export const EXCHANGE_BIKES = ["Honda Activa 5G", "Honda Activa 6G", "TVS Jupiter", "Suzuki Access 125", "Hero Splendor Plus", "Bajaj Pulsar 150", "TVS Ntorq", "Hero Pleasure"];
export const LENDERS = ["evfin (Greaves Finance)", "IDFC FIRST Bank", "HDFC Bank", "Kotak Mahindra Bank", "Shriram Finance", "Muthoot Capital"];
export const LOST_REASONS = ["Not reachable", "Price / budget", "Bought competitor", "Postponed purchase", "Finance rejected", "Charging / range concern", "Long delivery wait", "Low exchange value", "Other"];
const LOST_W = [["Not reachable", 24], ["Price / budget", 18], ["Bought competitor", 16], ["Postponed purchase", 12], ["Finance rejected", 9], ["Charging / range concern", 8], ["Long delivery wait", 5], ["Low exchange value", 4], ["Other", 4]];
export const COMPETITORS = ["Ather Rizta", "Ola S1 Pro", "TVS iQube", "Bajaj Chetak", "Hero Vida V2"];

export const STAGES = ["new", "attempted", "contacted", "interested", "test_ride", "booking", "retailed", "delivered", "lost"];

/* People. Telecaller and Manager names match the apps' existing personas. */
export const TELECALLER = "Priya Nambiar";
export const SALES_TEAM = [
  { name: "Rahul Kumar", store: "L014", login: true },   // the Sales Executive login
  { name: "Divya Pillai", store: "L014" },
  { name: "Kiran Bhat", store: "L014" },
  { name: "Meera Iyer", store: "L015" },
  { name: "Arjun Nair", store: "L015" },
  { name: "Sameer Khan", store: "L015" },
];

const NOTES = {
  new: ["Enquired on {src}; wants a callback in the evening.", "Asked about range for a 30 km daily commute.", "Wants to know if the 750W charger fits a society parking socket."],
  attempted: ["Call not answered; WhatsApp sent with brochure.", "Busy — asked to call after 6 pm.", "Switched off twice; will retry tomorrow morning."],
  contacted: ["Interested in {variant}; comparing with {comp}.", "Wants EMI options under ₹4,500/month.", "Asked about exchange for old {bike}."],
  interested: ["Budget fits; wants a test ride this weekend.", "Family wants to see the 43 L storage in person.", "Prefers {colour}; asked about delivery time."],
  test_ride: ["Test ride done — liked the ride on broken roads.", "Took a test ride with spouse; discussing finance.", "Test ride booked for Saturday 11 am."],
  booking: ["Booked with ₹2,500 token; finance via {lender}.", "Booking done; waiting for {colour} allotment.", "Booked; exchange of {bike} at ₹{exch}."],
  retailed: ["Invoice raised; RTO in progress.", "Retailed with River Care {plan}.", "Payment complete; delivery slot being fixed."],
  delivered: ["Delivered; happy with the scooter.", "Delivered with side step and back rest.", "Delivered — asked about first service."],
  lost: ["Lost: {reason}.", "Closed as lost — {reason}.", "Customer said: {reason}."],
};

function makeLead(i) {
  const r = rng("lead:" + i);
  const store = r() < 0.62 ? "L014" : "L015";
  const first = pick(r, FIRST), last = pick(r, LAST);
  const source = pickW(r, SOURCE_W);
  // Stage mix across the pool: plenty at every stage.
  const stage = pickW(r, [["new", 12], ["attempted", 11], ["contacted", 13], ["interested", 12], ["test_ride", 11], ["booking", 10], ["retailed", 7], ["delivered", 8], ["lost", 16]]);
  const order = STAGES.indexOf(stage);
  const ageDays = stage === "new" ? Math.floor(r() * 3) : Math.floor(2 + r() * (stage === "delivered" ? 75 : 45));
  const variant = pickW(r, VARIANT_W);
  const colour = pick(r, COLOURS);
  const team = SALES_TEAM.filter(p => p.store === store);
  const hasSE = order >= STAGES.indexOf("interested") && stage !== "lost" || (stage === "lost" && r() < 0.5);
  // Rahul (the SE login) gets a large share of his store's assigned leads.
  const se = hasSE ? (store === "L014" && r() < 0.62 ? SALES_TEAM[0] : pick(r, team)) : null;
  const exchange = r() < 0.38 ? { bike: pick(r, EXCHANGE_BIKES), year: 2013 + Math.floor(r() * 9), value: 10000 + Math.round(r() * 35) * 1000 } : null;
  const finance = r() < 0.55 ? { lender: pickW(r, [[LENDERS[0], 30], [LENDERS[1], 18], [LENDERS[2], 17], [LENDERS[3], 13], [LENDERS[4], 12], [LENDERS[5], 10]]), amount: 120000 + Math.round(r() * 28) * 1000 } : null;
  const lostReason = stage === "lost" ? pickW(r, LOST_W) : null;
  const lostAt = stage === "lost" ? pickW(r, [["attempted", 30], ["contacted", 28], ["interested", 20], ["test_ride", 15], ["booking", 7]]) : null;
  const comp = pick(r, COMPETITORS);
  const plan = variant.includes("Plus Five") ? "Plus Five" : variant.includes("Plus Two") ? "Plus Two" : "—";
  const fill = (t) => t.replace("{src}", source).replace("{variant}", `Indie ${variant}`).replace("{comp}", comp)
    .replace("{bike}", exchange ? exchange.bike : "petrol scooter").replace("{colour}", colour)
    .replace("{lender}", finance ? finance.lender : "own funds").replace("{exch}", exchange ? exchange.value.toLocaleString("en-IN") : "—")
    .replace("{plan}", plan).replace("{reason}", (lostReason || "").toLowerCase() + (lostReason === "Bought competitor" ? ` (${comp})` : ""));
  const createdAt = daysAgo(ageDays + Math.floor(r() * 4), 9 + Math.floor(r() * 9));
  const lastActivityAt = daysAgo(Math.max(0, Math.floor(ageDays * r() * 0.5)), 10 + Math.floor(r() * 8));
  const followUpAt = ["new", "attempted", "contacted", "interested", "test_ride", "booking"].includes(stage)
    ? daysAgo(-Math.floor(r() * 5) + (r() < 0.25 ? 1 : 0), 10 + Math.floor(r() * 8)) : null; // some overdue (yesterday), most upcoming
  return {
    id: `ER-${String(24000 + i)}`,
    name: `${first} ${last}`,
    phone: `+91 9${String(800000000 + Math.floor(r() * 199999999)).slice(0, 9)}`,
    store, storeName: store === "L014" ? "Aundh" : "Shivaji Nagar",
    locality: pick(r, LOCALITY[store]),
    source, stage, model: "Indie", variant, colour,
    rating: 1 + Math.floor(r() * 5),          // 1–5 likelihood
    telecaller: TELECALLER,
    se: se ? se.name : null,
    exchange, finance,
    testRideAt: order >= STAGES.indexOf("test_ride") && stage !== "lost" ? daysAgo(Math.max(0, ageDays - 3), 11) : null,
    bookingAmount: order >= STAGES.indexOf("booking") && stage !== "lost" ? 2500 : 0,
    lostReason, lostAt, lostTo: lostReason === "Bought competitor" ? comp : null,
    createdAt, lastActivityAt, followUpAt,
    note: fill(pick(r, NOTES[stage])),
  };
}


/* ---- Call history with comments ----
   Each lead carries `calls`: newest last. { at, by, connected, outcome, durationSec, comment }.
   Connected calls by stage (so ≥ half the pool has 3+ connected calls with comments):
   new 0–1 · attempted 0 (only unanswered attempts) · contacted 3–4 · interested 3–5 · test_ride 3–5 ·
   booking 4–6 · retailed 4–7 · delivered 5–8 · lost 2–5. Comments don't repeat within a lead. Early calls are by the telecaller, later
   ones by the SE (if assigned). */
const CALL_COMMENTS = {
  intro: [
    "Introduced River Indie; customer enquired about range and storage.",
    "Explained 43 L under-seat + 12 L glovebox; customer liked the utility angle.",
    "Shared price sheet on WhatsApp; on-road ₹1.67 L for 750W.",
    "Customer rides 25–30 km daily; Indie's 161 km IDC range is more than enough.",
    "Asked about home charging — explained 750W portable charger, 0–80% in ~5 h.",
  ],
  qualify: [
    "Budget around ₹1.6–1.7 L; open to EMI. Shared evfin scheme from 5.99%.",
    "Has an old {bike} for exchange; asked for an estimate.",
    "Comparing with {comp}; highlighted 14-inch wheels and storage.",
    "Wants {colour}; checked stock at {store} — available.",
    "Society parking has a socket; no charging concern.",
    "Spouse will join for the test ride; prefers weekend slot.",
  ],
  testride: [
    "Test ride done; liked stability on bad roads and Rush mode pickup.",
    "Felt the seat height is comfortable; asked about pillion footrests.",
    "Took a 5 km ride; asked about service intervals and River Care.",
    "Compared ride quality with {comp}; preferred Indie's suspension.",
  ],
  close: [
    "Discussed River Care Plus Two vs Plus Five; leaning towards Plus Two.",
    "Finance documents collected; file logged with {lender}.",
    "Exchange value of ₹{exch} accepted for the {bike}.",
    "Token of ₹2,500 paid; booking confirmed for Indie {variant}.",
    "Asked for side step and back rest to be fitted before delivery.",
  ],
  after: [
    "Invoice shared; RTO registration in progress.",
    "Delivery scheduled for Saturday 11 am at {store}.",
    "Delivered; walked customer through the app and charging.",
    "Post-delivery call: happy with the scooter, ~115 km real range so far.",
    "Reminder for first free service at 1,000 km.",
  ],
  lost: [
    "Customer says price is above budget even with EMI.",
    "Customer has booked {comp}; closing the lead.",
    "Finance not approved by lender; customer not ready to pay upfront.",
    "Worried about charging in rented flat; postponing purchase.",
    "Not reachable after multiple attempts; marking lost.",
    "Exchange offer too low compared with local dealer; dropped out.",
  ],
};
const NOT_CONNECTED = ["No answer", "Busy", "Switched off", "Call back later"];
const CONNECTED_RANGE = { new: [0, 1], attempted: [0, 0], contacted: [3, 4], interested: [3, 5], test_ride: [3, 5],
  booking: [4, 6], retailed: [4, 7], delivered: [5, 8], lost: [2, 5] };

function buildCalls(l, i) {
  const r = rng("calls:" + i);
  const [lo, hi] = CONNECTED_RANGE[l.stage];
  const nConn = lo + Math.floor(r() * (hi - lo + 1));
  const nMiss = l.stage === "attempted" ? 1 + Math.floor(r() * 3) : Math.floor(r() * 3);
  const fill = (t) => t.replace("{bike}", l.exchange ? l.exchange.bike : "petrol scooter").replace("{comp}", l.lostTo || pick(r, COMPETITORS))
    .replace("{colour}", l.colour).replace("{store}", l.storeName).replace("{lender}", l.finance ? l.finance.lender : "evfin (Greaves Finance)")
    .replace("{exch}", l.exchange ? l.exchange.value.toLocaleString("en-IN") : "18,000").replace("{variant}", l.variant);
  // Which comment pool each connected call draws from, in order through the funnel.
  const phases = ["intro", "qualify", "qualify", "testride", "close", "close", "after", "after"];
  const conn = [];
  const used = new Set();
  for (let k = 0; k < nConn; k++) {
    let ph = phases[Math.min(k, phases.length - 1)];
    if (l.stage === "lost" && k === nConn - 1) ph = "lost";
    if (["contacted", "interested"].includes(l.stage) && (ph === "testride" || ph === "close" || ph === "after")) ph = "qualify";
    if (l.stage === "test_ride" && (ph === "close" || ph === "after")) ph = "testride";
    if (l.stage === "booking" && ph === "after") ph = "close";
    const pool = CALL_COMMENTS[ph].filter(t => !used.has(t));
    const raw = pick(r, pool.length ? pool : CALL_COMMENTS[ph]); used.add(raw);
    let text = fill(raw);
    if (l.stage === "lost" && k === nConn - 1 && l.lostReason) {
      const map = { "Not reachable": 4, "Price / budget": 0, "Bought competitor": 1, "Finance rejected": 2, "Charging / range concern": 3, "Low exchange value": 5 };
      if (map[l.lostReason] != null) text = fill(CALL_COMMENTS.lost[map[l.lostReason]]);
    }
    conn.push({ connected: true, outcome: "Connected", comment: text, durationSec: 60 + Math.floor(r() * 420) });
  }
  const MISS_NOTE = { "No answer": "No answer; WhatsApp sent.", "Busy": "Busy; will call back in the evening.",
    "Switched off": "Phone switched off; retry tomorrow.", "Call back later": "Asked to call back after 6 pm." };
  const miss = Array.from({ length: nMiss }, () => { const o = pick(r, NOT_CONNECTED); return { connected: false, outcome: o, comment: MISS_NOTE[o], durationSec: 0 }; });
  // Interleave: a missed attempt often precedes a connected one.
  const seq = [];
  let mi = 0;
  conn.forEach((c, k) => { if (mi < miss.length && r() < 0.5) seq.push(miss[mi++]); seq.push(c); });
  while (mi < miss.length) seq.push(miss[mi++]);
  // Spread timestamps from createdAt to lastActivityAt.
  const t0 = new Date(l.createdAt).getTime(), t1 = Math.max(t0 + 3600e3, new Date(l.lastActivityAt).getTime());
  const telecallerCalls = Math.max(1, Math.ceil(seq.length * 0.4));
  return seq.map((c, k) => {
    const at = new Date(t0 + ((t1 - t0) * (k + 1)) / (seq.length + 1));
    at.setHours(10 + ((k * 3 + i) % 9), (k * 17 + i) % 60, 0, 0);
    return { ...c, at: at.toISOString(), by: l.se && k >= telecallerCalls ? l.se : TELECALLER };
  });
}

/** The full pool (360 leads): ~62% Aundh, ~38% Shivaji Nagar; every stage well represented. */
export const LEADS = Array.from({ length: 360 }, (_, i) => {
  const l = makeLead(i + 1);
  // A lead lost on exchange value must have had an exchange offer (separate seed: other fields unchanged).
  if (l.lostReason === "Low exchange value" && !l.exchange) {
    const r = rng("exch:" + (i + 1));
    l.exchange = { bike: pick(r, EXCHANGE_BIKES), year: 2013 + Math.floor(r() * 9), value: 9000 + Math.round(r() * 12) * 1000 };
  }
  l.calls = buildCalls(l, i + 1);
  return l;
});

/** Leads for a login.
 *  telecaller → early-funnel + lost (≥ 100)       sales → Rahul Kumar's leads + unassigned Aundh walk-ins (≥ 100)
 *  manager    → everything (both stores).                                                         */
export function leadsFor(role) {
  if (role === "telecaller") return LEADS.filter(l => ["new", "attempted", "contacted", "interested", "lost"].includes(l.stage) || !l.se);
  if (role === "sales") return LEADS.filter(l => l.se === "Rahul Kumar" || (l.store === "L014" && !l.se && ["contacted", "interested"].includes(l.stage)));
  return LEADS;
}
