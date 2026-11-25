// RWH Planner – published rates used for the cost estimate.
// These are the bundled defaults. The API serves live rates: it merges these with the
// rate sheet at RATES_SOURCE_URL (see rates-template.csv) and caches the result.
// Every rate stays editable in the app.

// PBS: Pakistan Bureau of Statistics, Monthly Review on Price Indices, Annex-III
// "Urban Inter-City Consumer Prices of Construction and Energy Items", September 2026.
export const PBS = {
  source: "Pakistan Bureau of Statistics (PBS), Monthly Review on Price Indices, Annex-III: Urban Inter-City Consumer Prices of Construction and Energy Items",
  url: "https://www.pbs.gov.pk/",
  asOf: "2026-09",
  // city: bricks (per 1000), bajri/gravel (per 100 cft truck), sand (per 100 cft truck), cement (50 kg bag), mason/day, labour/day, plumber/day
  cities: {
    Islamabad:  { bricks: 27015.84, bajri: 16521.51, sand: 13630.86, cement: 1507.33, mason: 2404.60, labour: 1500.00, plumber: 2238.23 },
    Rawalpindi: { bricks: 26694.15, bajri: 15870.41, sand: 13557.61, cement: 1497.87, mason: 2370.34, labour: 1500.00, plumber: 2232.41 },
    Lahore:     { bricks: 24830.77, bajri: 18772.65, sand: 7997.85,  cement: 1586.18, mason: 2460.86, labour: 1746.91, plumber: 2037.30 },
    Karachi:    { bricks: 22000.00, bajri: 9253.42,  sand: 8232.59,  cement: 1467.44, mason: 2481.51, labour: 1500.00, plumber: 2359.27 },
    Peshawar:   { bricks: 21438.71, bajri: 10886.87, sand: 10327.74, cement: 1563.28, mason: 2420.93, labour: 1465.90, plumber: 2500.00 },
    Quetta:     { bricks: 15242.48, bajri: 6998.09,  sand: 6499.49,  cement: 1559.98, mason: 2193.92, labour: 1449.43, plumber: 1497.77 },
    Multan:     { bricks: 16533.06, bajri: 11425.60, sand: 7770.80,  cement: 1589.98, mason: 1908.51, labour: 1153.42, plumber: 1810.84 },
    Abbottabad: { bricks: 26165.61, bajri: 10000.00, sand: 15164.85, cement: 1576.53, mason: 2131.20, labour: 1693.86, plumber: 2000.00 },
  },
};

// App city -> PBS price city (nearest PBS-surveyed city where the app city is not surveyed).
export const PBS_CITY = {
  islamabad: "Islamabad", rawalpindi: "Rawalpindi", murree: "Rawalpindi", muzaffarabad: "Abbottabad",
  lahore: "Lahore", peshawar: "Peshawar", multan: "Multan", karachi: "Karachi", quetta: "Quetta",
};

// Rate items. `pbs` = taken from the PBS city table above; otherwise a national rate.
export const RATE_ITEMS = [
  { key: "pipe4",   group: "conv",  unit: "ft",  en: 'uPVC drainage pipe 4" (110 mm)', ur: "یو پی وی سی ڈرینیج پائپ 4 انچ (110 ملی میٹر)",
    rate: 215, src: 'Popular Pipes 4" sewer pipe, Rs 2,650–2,950 per 13 ft length (CheckPrice.pk market survey)', url: "https://checkprice.pk/pvc-pipe-price-in-pakistan/", asOf: "2026-10-24" },
  { key: "elbow4",  group: "conv",  unit: "no",  en: 'uPVC elbow 90° 4" (BS EN 1329)', ur: "یو پی وی سی ایلبو 90 درجے، 4 انچ",
    rate: 670, src: "Popular Pipes Group price list, uPVC fittings BS EN 1329", url: "", asOf: "2026-09-28" },
  { key: "filter",  group: "conv",  unit: "set", en: "First-flush diverter and mesh filter", ur: "فرسٹ فلش ڈائیورٹر اور جالی دار فلٹر",
    rate: 6000, src: "Estimate: 4\" tee, end cap, chamber pipe and stainless mesh. Get a local quote.", url: "", asOf: "2026-11", estimate: true },
  { key: "tank",    group: "store", unit: "no",  en: "Plastic water tank 2,000 L (Dura Flow)", ur: "پلاسٹک واٹر ٹینک 2,000 لیٹر (ڈیورا فلو)",
    rate: 32783, src: "Dura Flow blow-mould tank, 2,000 L retail price (sanitaryghar.com)", url: "https://sanitaryghar.com/product/dura-water-tank", asOf: "2026-11" },
  { key: "bajri",   group: "well",  unit: "100 cft", en: "Bajri / gravel (filter media)", ur: "بجری (فلٹر میڈیا)", pbs: "bajri" },
  { key: "sand",    group: "well",  unit: "100 cft", en: "Sand (filter layer)", ur: "ریت (فلٹر کی تہہ)", pbs: "sand" },
  { key: "bricks",  group: "well",  unit: "1000",    en: "Bricks, first class (well lining)", ur: "اوّل درجے کی اینٹیں (کنویں کی چنائی)", pbs: "bricks" },
  { key: "cement",  group: "well",  unit: "bag",     en: "Cement, 50 kg bag", ur: "سیمنٹ، 50 کلو بوری", pbs: "cement" },
  { key: "plumber", group: "lab",   unit: "day",     en: "Plumber", ur: "پلمبر", pbs: "plumber" },
  { key: "mason",   group: "lab",   unit: "day",     en: "Mason (raj)", ur: "مستری (راج)", pbs: "mason" },
  { key: "labour",  group: "lab",   unit: "day",     en: "Labourer (unskilled)", ur: "مزدور (غیر ہنرمند)", pbs: "labour" },
  { key: "tanker",  group: "water", unit: "1,000 gal", en: "Water tanker (value of water saved)", ur: "واٹر ٹینکر (بچائے گئے پانی کی قیمت)",
    rate: 3120, src: "KWSC Karachi official commercial tanker tariff, 1,000 gallons (ProPakistani)", url: "https://propakistani.pk/", asOf: "2026-07-01" },
];

export const RATE_KEYS = RATE_ITEMS.map(r => r.key);

// Published (default) rates for a city, with source details for each item.
export function defaultRates(cityKey = "islamabad") {
  const pc = PBS_CITY[cityKey] || "Islamabad";
  const row = PBS.cities[pc];
  const out = {};
  for (const it of RATE_ITEMS) {
    if (it.pbs) out[it.key] = { rate: row[it.pbs], src: `${PBS.source} (${pc})`, url: PBS.url, asOf: PBS.asOf, city: pc };
    else out[it.key] = { rate: it.rate, src: it.src, url: it.url, asOf: it.asOf, estimate: !!it.estimate };
  }
  return out;
}

// Plot sizes. A marla is 225 sq ft in most Islamabad/Rawalpindi housing societies
// and 272.25 sq ft in Punjab revenue records. Covered roof share is a typical figure for each plot size.
export const PLOTS = [
  { key: "3m",  marla: 3,  cover: 0.80, en: "3 marla",  ur: "3 مرلہ" },
  { key: "5m",  marla: 5,  cover: 0.80, en: "5 marla",  ur: "5 مرلہ" },
  { key: "7m",  marla: 7,  cover: 0.75, en: "7 marla",  ur: "7 مرلہ" },
  { key: "10m", marla: 10, cover: 0.75, en: "10 marla", ur: "10 مرلہ" },
  { key: "1k",  marla: 20, cover: 0.65, en: "1 kanal",  ur: "1 کنال" },
  { key: "2k",  marla: 40, cover: 0.55, en: "2 kanal",  ur: "2 کنال" },
];

// Downpipe sizing: International Plumbing Code Table 1106.2 (vertical leaders), capacity in sq ft of roof
// at 4 in/h (about 100 mm/h) rainfall intensity.
export const DOWNPIPE = { size: '4" (110 mm)', capacityFt2: 4600, designMmH: 100, maxPerOutletFt2: 1000,
  src: "International Plumbing Code, Table 1106.2 (vertical rainwater leaders, 4 in/h ≈ 100 mm/h)" };
