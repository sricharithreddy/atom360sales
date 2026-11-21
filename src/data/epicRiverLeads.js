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
  { name: "Meera Iyer", store: "L014" },
  { name: "Arjun Nair", store: "L014" },
  { name: "Divya Pillai", store: "L015" },
  { name: "Sameer Khan", store: "L015" },
  { name: "Kiran Bhat", store: "L015" },
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

/** The full pool (360 leads): ~62% Aundh, ~38% Shivaji Nagar; every stage well represented. */
export const LEADS = Array.from({ length: 360 }, (_, i) => makeLead(i + 1));

/** Leads for a login.
 *  telecaller → early-funnel + lost (≥ 100)       sales → Rahul Kumar's leads + unassigned Aundh walk-ins (≥ 100)
 *  manager    → everything (both stores).                                                         */
export function leadsFor(role) {
  if (role === "telecaller") return LEADS.filter(l => ["new", "attempted", "contacted", "interested", "lost"].includes(l.stage) || !l.se);
  if (role === "sales") return LEADS.filter(l => l.se === "Rahul Kumar" || (l.store === "L014" && !l.se && ["contacted", "interested"].includes(l.stage)));
  return LEADS;
}
