/* Autoprism Hyundai (Autoprism Motors) — the FICTIONAL Hyundai dealer group used when the demo runs
   with ?oem=hyundai. Not a real dealer; localities are real neighbourhoods / roads, but there are no
   street addresses or phone numbers on purpose.

   36 outlets in Telangana, Andhra Pradesh and Karnataka. Car dealers are long-established, so most
   outlets opened years ago; a handful opened in the last 12 months so "New outlet" still has rows.

   Same row shape as epicRiverLocations.js. `format` keeps the shared keys the apps already use:
     Flagship  3S flagship — large showroom + full workshop (service, body & paint)
     Store     3S showroom + workshop
     Express   city showroom (sales only; service at the nearest Store/Flagship)
   `workshop` says whether the outlet has a workshop.

   L014 (Kondapur) and L015 (Banjara Hills) are the two showrooms the Telecaller, Sales Executive and
   Manager logins work — the same ids the River demo uses for Aundh / Shivaji Nagar, so code that keys
   on "L014" / "L015" works in both OEMs.                                                           */

export const GROUP = {
  name: "Autoprism Hyundai",
  parent: "Autoprism Motors",
  hq: "Hyderabad",
  oem: "Hyundai Motor India",
  product: "Hyundai cars",
  targetOutlets: 36,
};

export const ZONES = [
  { key: "TG", label: "Telangana", states: ["Telangana"] },
  { key: "AP", label: "Andhra Pradesh", states: ["Andhra Pradesh"] },
  { key: "KA", label: "Karnataka", states: ["Karnataka"] },
];

const H = (locality, city, state, cluster, format, opened) =>
  ({ locality, city, state, cluster, format, opened, real: false, workshop: format !== "Express" });

export const ROWS = [
  // Telangana — Hyderabad & Secunderabad
  H("Somajiguda", "Hyderabad", "Telangana", "Hyderabad Central", "Flagship", "2011-06"),
  H("Madhapur", "Hyderabad", "Telangana", "Hyderabad West", "Flagship", "2014-03"),
  H("Kukatpally", "Hyderabad", "Telangana", "Hyderabad West", "Store", "2013-09"),
  H("SD Road", "Secunderabad", "Telangana", "Hyderabad East", "Store", "2010-01"),
  H("LB Nagar", "Hyderabad", "Telangana", "Hyderabad East", "Store", "2015-07"),
  H("Uppal", "Hyderabad", "Telangana", "Hyderabad East", "Store", "2017-02"),
  H("Attapur", "Hyderabad", "Telangana", "Hyderabad Central", "Store", "2018-05"),
  H("Kompally", "Hyderabad", "Telangana", "Hyderabad East", "Store", "2019-11"),
  H("Miyapur", "Hyderabad", "Telangana", "Hyderabad West", "Store", "2020-02"),
  H("Shamshabad", "Hyderabad", "Telangana", "Hyderabad Central", "Express", "2022-08"),
  H("ECIL", "Hyderabad", "Telangana", "Hyderabad East", "Express", "2021-03"),
  H("Tolichowki", "Hyderabad", "Telangana", "Hyderabad Central", "Express", "2023-01"),
  H("Bowenpally", "Secunderabad", "Telangana", "Hyderabad East", "Express", "2026-06"),
  H("Kondapur", "Hyderabad", "Telangana", "Hyderabad West", "Store", "2016-08"),          // L014 — demo store
  H("Banjara Hills", "Hyderabad", "Telangana", "Hyderabad Central", "Store", "2014-11"),  // L015 — demo store
  // Telangana — districts
  H("Hanumakonda", "Warangal", "Telangana", "Telangana Districts", "Store", "2015-04"),
  H("Mankammathota", "Karimnagar", "Telangana", "Telangana Districts", "Store", "2017-08"),
  H("Vinayak Nagar", "Nizamabad", "Telangana", "Telangana Districts", "Store", "2018-10"),
  H("Wyra Road", "Khammam", "Telangana", "Telangana Districts", "Store", "2019-06"),
  H("Marriguda", "Nalgonda", "Telangana", "Telangana Districts", "Express", "2026-03"),
  H("Medak Road", "Siddipet", "Telangana", "Telangana Districts", "Express", "2026-07"),
  // Andhra Pradesh
  H("Benz Circle", "Vijayawada", "Andhra Pradesh", "Coastal Andhra", "Flagship", "2012-02"),
  H("Patamata", "Vijayawada", "Andhra Pradesh", "Coastal Andhra", "Store", "2021-09"),
  H("Dwaraka Nagar", "Visakhapatnam", "Andhra Pradesh", "North Andhra", "Flagship", "2012-11"),
  H("Gajuwaka", "Visakhapatnam", "Andhra Pradesh", "North Andhra", "Store", "2020-01"),
  H("Lakshmipuram", "Guntur", "Andhra Pradesh", "Coastal Andhra", "Store", "2016-06"),
  H("Morampudi", "Rajahmundry", "Andhra Pradesh", "North Andhra", "Store", "2018-03"),
  H("Renigunta Road", "Tirupati", "Andhra Pradesh", "Rayalaseema", "Store", "2017-05"),
  H("Vedayapalem", "Nellore", "Andhra Pradesh", "Rayalaseema", "Express", "2025-12"),
  H("Nandyal Road", "Kurnool", "Andhra Pradesh", "Rayalaseema", "Store", "2019-09"),
  // Karnataka
  H("Hebbal", "Bengaluru", "Karnataka", "Bengaluru", "Flagship", "2014-08"),
  H("Whitefield", "Bengaluru", "Karnataka", "Bengaluru", "Store", "2016-01"),
  H("JP Nagar", "Bengaluru", "Karnataka", "Bengaluru", "Store", "2018-07"),
  H("Electronic City", "Bengaluru", "Karnataka", "Bengaluru", "Express", "2026-05"),
  H("Vijayanagar", "Mysuru", "Karnataka", "Karnataka Districts", "Store", "2019-02"),
  H("Vidyanagar", "Hubballi", "Karnataka", "Karnataka Districts", "Express", "2026-01"),
];
