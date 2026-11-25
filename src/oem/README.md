# OEM switch (`src/oem`)

The demo runs as one OEM at a time: **Hyundai** (cars, Autoprism Hyundai, a fictional dealer group) or
**River** (electric scooters, Epic River / Raam Group). River is the default, so the live demo is unchanged
without a parameter.

```
src/oem/index.js             active OEM + helpers (import from here)
src/oem/river.js             River config
src/oem/hyundai.js           Hyundai config
src/oem/hyundaiCatalogue.js  Hyundai models / variants / colours, derived from the Hyundai India sheet
src/data/hyundaiLocations.js Autoprism Hyundai's 36 outlets (River's stay in epicRiverLocations.js)
```

## How the OEM is chosen

`currentOemKey()` reads `?oem=` from the page URL, then `localStorage["ap.oem"]`, then falls back to
`"river"`. The shell (`index.html`) keeps the choice in its URL (`/?oem=hyundai#sales`) and in localStorage,
and loads every app as `sales.html?oem=hyundai`. Switching OEM in the shell **remounts the app iframes**, so
inside an app the OEM never changes while the page is open. `OEM` is therefore a plain constant: read it at
module level, no context or state needed.

## Config shape (`OEM`, same keys in both files)

| key | River | Hyundai |
|---|---|---|
| `key` | `"river"` | `"hyundai"` |
| `brand` / `oemName` | River / River Mobility | Hyundai / Hyundai Motor India |
| `category` | Electric scooters | Cars |
| `vehicleNoun` / `vehicleNounPlural` | scooter / scooters | car / cars |
| `testNoun` / `testNounPlural` / `testVerb` | test ride / test rides / ride | test drive / test drives / drive |
| `ev` | `true` | `false` (per-variant `fuel` says "Electric" for Creta Electric / Ioniq 5) |
| `dealerGroup` | Epic River (Raam Group) | Autoprism Hyundai (Autoprism Motors) |
| `dealerShort` (store prefix) | Epic River | Autoprism Hyundai |
| `dealerParent`, `hq` | Raam Group, Hyderabad | Autoprism Motors, Hyderabad |
| `pickerDealer`, `outletCount`, `statesLine`, `shellNote` | shell copy | shell copy |
| `models` | 1 (Indie) | 15 models, 119 variants |
| `priceSheet` | fixed `insurance`, `rto`, `accessoryFitment` | `roadTaxSlabs`, `evRoadTax`, `insurancePct`, `registration`, `tcsAbove`/`tcsPct` |
| `subsidy` | `{ name: "PM E-DRIVE", amount: 5000 }` | `null` |
| `bookingAmount` | 2,500 | 21,000 default (per model `bookingAmount`: 11k / 21k / 25k / 1 L) |
| `discount` | `{ typical: [1000, 5000], cap: 2500 }` | `{ typical: [10000, 60000], cap: 25000 }` |
| `dealerMarginPct` | 4.5 | 4.0 (FADA: Indian PV dealer margins ≈ 3–5%) |
| `loanRange` | ₹1.20–1.48 L | ₹8–20 L |
| `protectionPlans` | Standard / Plus Two / Plus Five | Standard warranty / EW 4 yr / EW 5 yr / Shield of Trust / RSA |
| `accessories` | `[{ key, label, amount }]` × 18 | × 16 |
| `insurers`, `lenders` | `[{ name, share, f, anchor? }]` (sample shares) | same shape, Hyundai-dealer mix |
| `insurancePremiumRange` | ₹10,350–11,450 | ₹26,000–42,000 |
| `competitors`, `competitorBrands` | Ather Rizta, Ola S1 Pro… | Kia Seltos, Maruti Suzuki Brezza… (also per model) |
| `leadSources` | … BikeDekho, BikeWale … | … Hyundai Click to Buy, CarDekho, CarWale … |
| `lostReasons` | … Charging / range concern, Long delivery wait … | … Long waiting period … |
| `exchangeVehicles`, `exchangeNoun`, `exchangeValueRange` | old petrol scooters | old cars, ₹1.5–6.5 L |
| `network` | `formats`, `retailBase`, `seRange`, `monthlyTarget` (5,900), `stockBase`, `demoUnits`, `leadsPerRetail` | same keys (2,800 / month) |
| `dot` | `#F5B800` | `#002C5F` (picker dot only, never a logo) |

`network.formats[format].label` is how to *show* an outlet format. The format **keys** stay
`Flagship` / `Store` / `Express` in both OEMs (Hyundai labels: Flagship / Showroom / City showroom).

A model: `{ name, bodyType, weight, bookingAmount, competitors, variants, colours }`
- variant: `{ name, detailed, fuel, engine, transmission, exShowroom, colours: [names], weight }` (+ Hyundai `notes`, River `listPrice` before subsidy)
- colour: `{ name, hex, type: "Monotone" | "Dual-tone" | "Matte", dualTone, matte, knight, weight }`

Hyundai variant names repeat across models ("HX10" is a Venue, Verna and Exter variant): always carry the
model with the variant. The display label is `` `${model} ${variant}` `` ("Creta SX MT Petrol").

## Helpers (`import { … } from "../oem/index.js"`)

```js
OEM                       // active config            OEM.brand → "Hyundai"
OEM_KEY, IS_HYUNDAI, IS_RIVER                         // "hyundai", true, false
OEMS, OEM_KEYS            // { hyundai, river }, ["hyundai", "river"]
currentOemKey()           // "?oem=" → localStorage → "river"
storeOemKey("hyundai")    // remember the choice (shell)
withOem("/sales.html#x", "hyundai") // "/sales.html?oem=hyundai#x"

VEHICLE, VEHICLES         // "car", "cars"           (River: "scooter", "scooters")
Vehicle, Vehicles         // "Car", "Cars"
testNoun, testNounPlural  // "test drive", "test drives"
TestNoun, TestNounPlural  // "Test drive", "Test drives"
TEST_TITLE                // "Test Drive"            (River: "Test Ride")
BRAND, DEALER, DEALER_GROUP // "Hyundai", "Autoprism Hyundai", "Autoprism Hyundai (Autoprism Motors)"
cap("test drive")         // "Test drive"            title("test drive") → "Test Drive"
fmtVehicle(1) / fmtVehicle(1240) // "1 car" / "1,240 cars"
vehicleWord(3)            // "cars"
fmtLakh(1504400)          // "₹15.04 L"              fmtINR(25000) → "₹25,000"

MODELS, MODEL_NAMES       // OEM.models, ["Creta", "Venue", …]
findModel("Creta")        // model object or null
findVariant("Creta", "SX MT Petrol") // variant object (also accepts "Creta SX MT Petrol")
findColour("Creta", "Atlas White") // colour object
priceOf("Venue", "HX4")   // 879900 (ex-showroom ₹)
priceRange("Creta")       // { min: 1090700, max: 2046000 }
coloursOf("Exter", "HX2") // colour objects offered on that variant
colourHex("Titan Grey")   // "#5E6266"
bookingAmountOf("Creta")  // 25000
competitorsOf("Venue")    // ["Maruti Suzuki Brezza", "Tata Nexon", …]
onRoadPrice("Creta", "SX MT Petrol") // { exShowroom, roadTax, insurance, registration, tcs, total }

// Deterministic picks: seed = string/number (hashed) or an rng function () => [0,1)
pickModel("se-demo-1")             // model object, weighted by sales mix
pickVariant("Creta", "se-demo-1")  // variant, weighted toward mid trims
pickColour("Creta", variant, "x")  // colour object offered on that variant
pickVehicle("quote-7")             // { model, variant, colour }
pickWeighted(items, seed)          // any [{ weight }] list
```

## Data modules (`src/data`, file names and export names unchanged)

All three read the active OEM. **River output is byte-for-byte what it was** (checked by dumping every
export before / after).

`epicRiverLocations.js` — `GROUP`, `ZONES`, `LOCATIONS`, `monthsOpen(loc)`.
Hyundai: 36 outlets (`L001…L036`), zones `TG` / `AP` / `KA`, rows also carry `workshop` (bool).
Store names are `` `${GROUP.name} — ${locality}` `` ("Autoprism Hyundai — Kondapur").

`epicRiverInventory.js` — `stockFor(locId)`, `unitsOf(locId, variant, colour, model?)`, `PUNE_STORES`
(alias `DEMO_STORES`), `INVENTORY_AS_OF`, `AGE_BUCKETS`, `MODELS`, **`STOCK_VARIANTS`, `STOCK_COLOURS`**.
- Hyundai stock lines: `{ model, variant, key: "Creta SX MT Petrol", colour, exShowroom, units, buckets[4] }`,
  only lines with units > 0. River lines have no `model` / `key` (one model: `line.model ?? "Indie"`).
- `unitsOf` for Hyundai: pass the model (`unitsOf(id, "SX MT Petrol", "Atlas White", "Creta")`) or the full key
  (`unitsOf(id, "Creta SX MT Petrol", "Atlas White")`).
- `VARIANTS` / `COLOURS` are **deprecated and River-only in every OEM** — kept so apps not yet converted still
  load. Converted code must use `STOCK_VARIANTS` / `STOCK_COLOURS` (Hyundai: `{ key, model, variant, exShowroom }`).
- Demo stores keep the ids **L014 / L015** in both OEMs: River = Aundh / Shivaji Nagar (Pune), Hyundai =
  Kondapur / Banjara Hills (Hyderabad). `PUNE_STORES` is `{ Kondapur: "L014", "Banjara Hills": "L015" }`
  under Hyundai (the name is legacy).

`epicRiverLeads.js` — `LEADS` (360), `leadsFor(role)`, `TELECALLER`, `SALES_TEAM`, `STAGES`, and the
OEM-aware lists `LEAD_SOURCES`, `VARIANTS` (labels: "750W + Plus Two" / "Creta SX MT Petrol"), `MODELS`,
`COLOURS`, `EXCHANGE_BIKES` (= `EXCHANGE_VEHICLES`), `LENDERS`, `LOST_REASONS`, `COMPETITORS`,
`STORE_NAMES` (`{ L014, L015 }` → showroom name).
- Staff names (Priya Nambiar, Rahul Kumar, …) are the same in both OEMs.
- Stage keys are generic: `"test_ride"` and `testRideAt` mean the test drive under Hyundai — show them with
  `OEM.testNoun` / `TEST_TITLE`.
- Hyundai lead: `model` ("Creta"), `variant` ("SX MT Petrol", no plan suffix), `colour`, `fuel`, `transmission`,
  `exShowroom`, `plan` (protection-plan name or null), `bookingAmount` (per model), `exchange` =
  `{ bike, vehicle, year, value }` (`bike` is the legacy key; same value), `finance` = `{ lender, amount }`
  with amounts ₹8–20 L, ids `AH-31001…`. River leads are unchanged (`model: "Indie"`, ids `ER-24001…`).

## Wording rules (from the brief)

With `?oem=hyundai` no page text may match `river|indie|epic|raam|scooter|test ride|750W|480W|monsoon|evfin|e-drive`;
with `?oem=river` none may match `hyundai|creta|venue|test drive`. Note "driver" contains "river" — avoid it in
Hyundai copy.
