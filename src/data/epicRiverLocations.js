/* Epic River (Raam Group) — River dealership network used by every login in the demo.

   The first 19 rows are real River Stores in Raam Group's cities, with the addresses River's
   dealer locator (dealers.rideriver.com) lists. Which of them Raam actually operates is not
   published — River's Red Hills, Chennai store is the one publicly confirmed as a RAAM Group
   partnership — so treat that mapping as a demo assumption.
   The remaining 81 are the planned roll-out to 100 outlets across Raam Group's footprint
   (Telangana, Andhra Pradesh, Maharashtra, Tamil Nadu, Karnataka): locality only, no street
   address. In the demo all 100 are trading, with staggered opening months so "New outlet"
   (open under 12 months) and same-store growth have something to work on.

   Fields
     id        stable key (L001…L100)
     name      store name as the app shows it ("Epic River — Kukatpally")
     locality, city, state
     cluster   area-manager patch (custom field)
     zone      zone-head patch
     format    Flagship (≈3,000 sq ft) · Store (≈900 sq ft, River's standard) · Express (≈400 sq ft)
     opened    "YYYY-MM"
     real      true = an existing River Store address from River's dealer locator
     address, phone   only on real rows

   OEM-aware: with ?oem=hyundai, GROUP / ZONES / LOCATIONS come from ./hyundaiLocations.js instead
   (36 Autoprism Hyundai outlets, same row shape). The River rows below are unchanged.        */

import { IS_HYUNDAI } from "../oem/index.js";
import * as HY from "./hyundaiLocations.js";

const RIVER_GROUP = {
  name: "Epic River",
  parent: "Raam Group",
  hq: "Hyderabad",
  oem: "River Mobility",
  product: "River Indie",
  targetOutlets: 100,
};

export const GROUP = IS_HYUNDAI ? HY.GROUP : RIVER_GROUP;

const RIVER_ZONES = [
  { key: "TG-AP", label: "Telangana & Andhra", states: ["Telangana", "Andhra Pradesh"] },
  { key: "WEST", label: "Maharashtra", states: ["Maharashtra"] },
  { key: "SOUTH", label: "Tamil Nadu & Karnataka", states: ["Tamil Nadu", "Karnataka"] },
];
export const ZONES = IS_HYUNDAI ? HY.ZONES : RIVER_ZONES;

const R = (locality, city, state, cluster, format, opened, address, phone) =>
  ({ locality, city, state, cluster, format, opened, real: true, address, phone });
const P = (locality, city, state, cluster, format, opened) =>
  ({ locality, city, state, cluster, format, opened, real: false });

const ROWS = [
  // ---- Real River Stores in Raam Group cities (dealers.rideriver.com) ----
  R("Kukatpally", "Hyderabad", "Telangana", "Hyderabad West", "Flagship", "2025-02", "Y-Junction, beside Amor Hospitals, Metro Pillar 847–848, Kukatpally, Hyderabad", "092402 17118"),
  R("HITEC City", "Hyderabad", "Telangana", "Hyderabad West", "Flagship", "2025-03", "Ground Floor, Suraj Trade Center, Plot 28, Rohini Layout Rd, opp. Cyber View Towers, Madhapur, Hyderabad", "092402 40844"),
  R("Attapur", "Hyderabad", "Telangana", "Hyderabad West", "Store", "2025-03", "2-4-13/B/1, Upperpally, Rajendranagar, Hyderabad", "092402 23765"),
  R("RC Puram", "Hyderabad", "Telangana", "Hyderabad West", "Store", "2025-03", "Mallikarjuna Nagar, Ramachandrapuram, Hyderabad", "092402 71326"),
  R("Tadbund", "Secunderabad", "Telangana", "Hyderabad East", "Store", "2025-06", "First Floor, Bowenpally, Tadbund, Secunderabad", "079652 20284"),
  R("Narayanguda", "Hyderabad", "Telangana", "Hyderabad East", "Store", "2025-07", "Narayanguda Road, Narayanguda, Hyderabad", "092402 17123"),
  R("Malakpet", "Hyderabad", "Telangana", "Hyderabad East", "Store", "2025-08", "Ground Floor, 16-11-740/6, Gaddi Annaram, Dilsukhnagar, Hyderabad", "092402 06859"),
  R("Karmanghat", "Hyderabad", "Telangana", "Hyderabad East", "Store", "2025-09", "Plot 1 & 2, Nagarjuna Sagar Ring Road, Karmanghat, Hyderabad", "092402 10844"),
  R("Uppal", "Hyderabad", "Telangana", "Hyderabad East", "Store", "2025-10", "2-1-1/7/A, Nagole Road, Saraswathi Colony, Uppal, Hyderabad", "092402 17120"),
  R("Rekurthi", "Karimnagar", "Telangana", "Telangana North", "Store", "2025-11", "Jagtial – Karimnagar Road, Rekurthi, Karimnagar", "079658 02773"),
  R("Sheela Nagar", "Visakhapatnam", "Andhra Pradesh", "Coastal Andhra North", "Store", "2025-06", "Akkireddypalem, Gajuwaka Mandal, BHPV Post, Visakhapatnam", "079652 20287"),
  R("Dondaparthy", "Visakhapatnam", "Andhra Pradesh", "Coastal Andhra North", "Store", "2025-08", "Ground Floor 103, Sai Krishna Complex, Railway New Colony Rd, Dondaparthy, Visakhapatnam", "092402 03431"),
  R("Waltair", "Visakhapatnam", "Andhra Pradesh", "Coastal Andhra North", "Flagship", "2025-10", "D No. 8-1-63/23, Waltair Main Road, opp. Govt ENT Hospital, Visakhapatnam", "092402 17121"),
  R("Aundh", "Pune", "Maharashtra", "Pune Metro", "Flagship", "2025-04", "Ground Floor, Shreenivas Classic, Baner Road, Pune", "079652 26446"),
  R("Shivaji Nagar", "Pune", "Maharashtra", "Pune Metro", "Store", "2025-05", "Bhale Estate Condominium, B-5 & B-6, Wakadewadi, Shivajinagar, Pune", "092402 22407"),
  R("Kharadi", "Pune", "Maharashtra", "Pune Metro", "Store", "2025-09", "Shop 2, Goodwill Landmark Apts, Kharadi, Pune", "092402 56438"),
  R("Mahatma Nagar", "Nashik", "Maharashtra", "North Maharashtra", "Store", "2025-07", "Plot 489, Shree Sai Siddhi Plaza, Trimbak Rd, Mahatma Nagar, Nashik", "079652 20294"),
  R("Mumbai Naka", "Nashik", "Maharashtra", "North Maharashtra", "Store", "2025-12", "Plot 1, Shop A-04, Lenkar's Majestic Apartment, Mumbai Naka, Nashik", "079652 20293"),
  R("Red Hills", "Chennai", "Tamil Nadu", "Chennai Metro", "Store", "2026-10", "No. 627, GNT Road, Balaji Nagar, Red Hills, Chennai 600052", "079652 29524"),

  // ---- Planned roll-out to 100 (locality only) ----
  // Telangana — Hyderabad
  P("Gachibowli", "Hyderabad", "Telangana", "Hyderabad West", "Flagship", "2026-01"),
  P("Miyapur", "Hyderabad", "Telangana", "Hyderabad West", "Store", "2026-02"),
  P("Kompally", "Hyderabad", "Telangana", "Hyderabad East", "Store", "2026-03"),
  P("LB Nagar", "Hyderabad", "Telangana", "Hyderabad East", "Store", "2026-04"),
  P("Ameerpet", "Hyderabad", "Telangana", "Hyderabad West", "Express", "2026-05"),
  P("ECIL", "Hyderabad", "Telangana", "Hyderabad East", "Express", "2026-06"),
  P("Shamshabad", "Hyderabad", "Telangana", "Hyderabad West", "Express", "2026-08"),
  P("Secunderabad Paradise", "Secunderabad", "Telangana", "Hyderabad East", "Store", "2026-09"),
  // Telangana — districts
  P("Mankammathota", "Karimnagar", "Telangana", "Telangana North", "Express", "2026-07"),
  P("Hanumakonda", "Warangal", "Telangana", "Telangana North", "Store", "2025-12"),
  P("Kazipet", "Warangal", "Telangana", "Telangana North", "Express", "2026-06"),
  P("Vinayak Nagar", "Nizamabad", "Telangana", "Telangana North", "Store", "2026-02"),
  P("Armoor Road", "Nizamabad", "Telangana", "Telangana North", "Express", "2026-09"),
  P("Wyra Road", "Khammam", "Telangana", "Telangana South", "Store", "2026-01"),
  P("Gandhi Chowk", "Khammam", "Telangana", "Telangana South", "Express", "2026-08"),
  P("Marriguda", "Nalgonda", "Telangana", "Telangana South", "Store", "2026-03"),
  P("Yenugonda", "Mahabubnagar", "Telangana", "Telangana South", "Store", "2026-04"),
  P("Medak Road", "Siddipet", "Telangana", "Telangana North", "Express", "2026-10"),
  P("Station Road", "Adilabad", "Telangana", "Telangana North", "Express", "2026-11"),
  P("Kodad X Road", "Suryapet", "Telangana", "Telangana South", "Express", "2026-10"),
  // Andhra Pradesh
  P("MVP Colony", "Visakhapatnam", "Andhra Pradesh", "Coastal Andhra North", "Store", "2026-02"),
  P("Madhurawada", "Visakhapatnam", "Andhra Pradesh", "Coastal Andhra North", "Express", "2026-07"),
  P("Pendurthi", "Visakhapatnam", "Andhra Pradesh", "Coastal Andhra North", "Express", "2026-09"),
  P("Benz Circle", "Vijayawada", "Andhra Pradesh", "Coastal Andhra Central", "Flagship", "2025-11"),
  P("Patamata", "Vijayawada", "Andhra Pradesh", "Coastal Andhra Central", "Store", "2026-01"),
  P("Governorpet", "Vijayawada", "Andhra Pradesh", "Coastal Andhra Central", "Store", "2026-04"),
  P("Gollapudi", "Vijayawada", "Andhra Pradesh", "Coastal Andhra Central", "Express", "2026-08"),
  P("Brodipet", "Guntur", "Andhra Pradesh", "Coastal Andhra Central", "Store", "2026-02"),
  P("Arundelpet", "Guntur", "Andhra Pradesh", "Coastal Andhra Central", "Express", "2026-09"),
  P("Danavaipeta", "Rajahmundry", "Andhra Pradesh", "Coastal Andhra North", "Store", "2026-03"),
  P("Morampudi", "Rajahmundry", "Andhra Pradesh", "Coastal Andhra North", "Express", "2026-10"),
  P("Sarpavaram", "Kakinada", "Andhra Pradesh", "Coastal Andhra North", "Store", "2026-05"),
  P("Renigunta Road", "Tirupati", "Andhra Pradesh", "Rayalaseema", "Store", "2026-01"),
  P("Tiruchanoor", "Tirupati", "Andhra Pradesh", "Rayalaseema", "Express", "2026-08"),
  P("Vedayapalem", "Nellore", "Andhra Pradesh", "Rayalaseema", "Store", "2026-03"),
  P("Nandyal Road", "Kurnool", "Andhra Pradesh", "Rayalaseema", "Store", "2026-04"),
  P("Trunk Road", "Ongole", "Andhra Pradesh", "Coastal Andhra Central", "Express", "2026-06"),
  P("Bellary Road", "Anantapur", "Andhra Pradesh", "Rayalaseema", "Store", "2026-05"),
  // Maharashtra
  P("Hinjewadi", "Pune", "Maharashtra", "Pune Metro", "Store", "2025-12"),
  P("Wakad", "Pune", "Maharashtra", "Pune Metro", "Store", "2026-01"),
  P("Hadapsar", "Pune", "Maharashtra", "Pune Metro", "Store", "2026-02"),
  P("Kothrud", "Pune", "Maharashtra", "Pune Metro", "Store", "2026-04"),
  P("Pimpri", "Pune", "Maharashtra", "Pune Metro", "Express", "2026-06"),
  P("Viman Nagar", "Pune", "Maharashtra", "Pune Metro", "Express", "2026-08"),
  P("College Road", "Nashik", "Maharashtra", "North Maharashtra", "Store", "2026-03"),
  P("Nashik Road", "Nashik", "Maharashtra", "North Maharashtra", "Express", "2026-09"),
  P("CIDCO", "Chhatrapati Sambhajinagar", "Maharashtra", "Marathwada", "Flagship", "2026-01"),
  P("Jalna Road", "Chhatrapati Sambhajinagar", "Maharashtra", "Marathwada", "Store", "2026-05"),
  P("Waluj", "Chhatrapati Sambhajinagar", "Maharashtra", "Marathwada", "Express", "2026-10"),
  P("Ghodbunder Road", "Thane", "Maharashtra", "Mumbai MMR", "Store", "2026-02"),
  P("Andheri East", "Mumbai", "Maharashtra", "Mumbai MMR", "Store", "2026-04"),
  P("Kharghar", "Navi Mumbai", "Maharashtra", "Mumbai MMR", "Store", "2026-06"),
  P("Rajarampuri", "Kolhapur", "Maharashtra", "Pune Metro", "Express", "2026-07"),
  P("Hotgi Road", "Solapur", "Maharashtra", "Marathwada", "Express", "2026-09"),
  P("Savedi", "Ahilyanagar", "Maharashtra", "North Maharashtra", "Express", "2026-11"),
  // Tamil Nadu
  P("Mount Road", "Chennai", "Tamil Nadu", "Chennai Metro", "Flagship", "2026-01"),
  P("Ambattur", "Chennai", "Tamil Nadu", "Chennai Metro", "Store", "2026-03"),
  P("Thoraipakkam", "Chennai", "Tamil Nadu", "Chennai Metro", "Store", "2026-05"),
  P("Chromepet", "Chennai", "Tamil Nadu", "Chennai Metro", "Store", "2026-07"),
  P("Perambur", "Chennai", "Tamil Nadu", "Chennai Metro", "Express", "2026-09"),
  P("Guindy", "Chennai", "Tamil Nadu", "Chennai Metro", "Express", "2026-11"),
  P("Gandhipuram", "Coimbatore", "Tamil Nadu", "Kongu & South TN", "Store", "2026-02"),
  P("Peelamedu", "Coimbatore", "Tamil Nadu", "Kongu & South TN", "Store", "2026-06"),
  P("Saravanampatti", "Coimbatore", "Tamil Nadu", "Kongu & South TN", "Express", "2026-10"),
  P("Anna Nagar", "Madurai", "Tamil Nadu", "Kongu & South TN", "Store", "2026-04"),
  P("Mattuthavani", "Madurai", "Tamil Nadu", "Kongu & South TN", "Express", "2026-10"),
  P("Thillai Nagar", "Tiruchirappalli", "Tamil Nadu", "Kongu & South TN", "Store", "2026-05"),
  P("KK Nagar", "Tiruchirappalli", "Tamil Nadu", "Kongu & South TN", "Express", "2026-11"),
  P("Fairlands", "Salem", "Tamil Nadu", "Kongu & South TN", "Store", "2026-08"),
  P("Sathuvachari", "Vellore", "Tamil Nadu", "Chennai Metro", "Express", "2026-08"),
  P("Hosur Road", "Hosur", "Tamil Nadu", "Kongu & South TN", "Express", "2026-09"),
  // Karnataka
  P("Whitefield", "Bengaluru", "Karnataka", "Bengaluru Metro", "Flagship", "2026-02"),
  P("Koramangala", "Bengaluru", "Karnataka", "Bengaluru Metro", "Store", "2026-03"),
  P("Yelahanka", "Bengaluru", "Karnataka", "Bengaluru Metro", "Store", "2026-05"),
  P("Electronic City", "Bengaluru", "Karnataka", "Bengaluru Metro", "Store", "2026-06"),
  P("Rajajinagar", "Bengaluru", "Karnataka", "Bengaluru Metro", "Express", "2026-08"),
  P("Banashankari", "Bengaluru", "Karnataka", "Bengaluru Metro", "Express", "2026-10"),
  P("Vijayanagar", "Mysuru", "Karnataka", "Karnataka Districts", "Store", "2026-04"),
  P("Hebbal", "Mysuru", "Karnataka", "Karnataka Districts", "Express", "2026-11"),
  P("Vidyanagar", "Hubballi", "Karnataka", "Karnataka Districts", "Store", "2026-07"),
  P("Kankanady", "Mangaluru", "Karnataka", "Karnataka Districts", "Express", "2026-09"),
];

export const LOCATIONS = (IS_HYUNDAI ? HY.ROWS : ROWS).map((r, i) => {
  const zone = ZONES.find(z => z.states.includes(r.state)).key;
  return { id: `L${String(i + 1).padStart(3, "0")}`, name: `${GROUP.name} — ${r.locality}`, zone, ...r };
});

/** Months a location has been open as of the demo's "today" (Nov 2026). */
export function monthsOpen(loc, today = "2026-11") {
  const [y1, m1] = loc.opened.split("-").map(Number);
  const [y2, m2] = today.split("-").map(Number);
  return (y2 - y1) * 12 + (m2 - m1);
}
