// RWH Planner – shared calculation engine.
// This file is the single source of truth. `npm run sync` (repo root) copies it
// into frontend/src/shared and backend/src/shared. Edit it here only.

// Monthly rainfall normals (mm), Jan–Dec, from each city's Wikipedia climate table.
export const CITIES = {
  islamabad:    { en: "Islamabad",    ur: "اسلام آباد", mm: [55.2, 93.4, 95.2, 58.1, 39.9, 78.4, 310.6, 317.0, 135.4, 34.4, 17.7, 25.9], src: "1991–2020 normals, WMO/NOAA", url: "https://en.wikipedia.org/wiki/Climate_of_Islamabad" },
  rawalpindi:   { en: "Rawalpindi",   ur: "راولپنڈی",   mm: [67.1, 84.1, 128.4, 63.2, 39.1, 144.3, 351.3, 340.3, 142.7, 31.7, 14.4, 36.2], src: "Climate-Data.org model (period not stated)", url: "https://en.wikipedia.org/wiki/Climate_of_Rawalpindi" },
  murree:       { en: "Murree",       ur: "مری",        mm: [126.5, 145.0, 176.8, 133.0, 91.9, 142.0, 418.3, 336.3, 161.5, 70.2, 32.5, 70.3], src: "1961–1990 normals, NOAA", url: "https://en.wikipedia.org/wiki/Murree" },
  muzaffarabad: { en: "Muzaffarabad", ur: "مظفرآباد",   mm: [101.3, 137.4, 157.3, 109.0, 78.5, 113.6, 328.7, 229.9, 112.6, 45.9, 37.2, 69.0], src: "1961–2009, Pakistan Meteorological Department", url: "https://en.wikipedia.org/wiki/Muzaffarabad" },
  lahore:       { en: "Lahore",       ur: "لاہور",      mm: [21.9, 31.5, 31.5, 19.5, 17.7, 73.8, 188.6, 177.1, 88.6, 10.3, 6.9, 6.8], src: "1991–2020 normals", url: "https://en.wikipedia.org/wiki/Climate_of_Lahore" },
  peshawar:     { en: "Peshawar",     ur: "پشاور",      mm: [39.8, 69.9, 78.2, 68.1, 26.7, 25.4, 69.0, 68.5, 34.8, 26.7, 16.9, 17.3], src: "1991–2020 normals", url: "https://en.wikipedia.org/wiki/Climate_of_Peshawar" },
  multan:       { en: "Multan",       ur: "ملتان",      mm: [18, 16, 19, 14, 12, 43, 76, 70, 45, 16, 1.4, 5.9], src: "World Meteorological Organization", url: "https://en.wikipedia.org/wiki/Climate_of_Multan" },
  karachi:      { en: "Karachi",      ur: "کراچی",      mm: [8.6, 9.4, 15.3, 15.7, 6.1, 55.8, 93.2, 78.9, 29.6, 17.6, 0.4, 2.8], src: "Pakistan Meteorological Department (2022)", url: "https://en.wikipedia.org/wiki/Climate_of_Karachi" },
  quetta:       { en: "Quetta",       ur: "کوئٹہ",      mm: [55.0, 58.4, 49.5, 40.0, 17.8, 3.2, 8.8, 4.9, 4.2, 4.5, 19.3, 34.6], src: "1991–2020 normals", url: "https://en.wikipedia.org/wiki/Climate_of_Quetta" },
};

// Runoff coefficients (C) by roof surface.
export const ROOFS = {
  rcc:    { c: 0.80, en: "Concrete (RCC) flat roof", ur: "کنکریٹ (آر سی سی) ہموار چھت" },
  metal:  { c: 0.90, en: "Metal / GI sheet",         ur: "دھاتی / جی آئی شیٹ" },
  tiles:  { c: 0.75, en: "Clay tiles",               ur: "مٹی کی ٹائلیں" },
  paved:  { c: 0.60, en: "Paved courtyard",          ur: "پختہ صحن" },
};

export const DAYS = [31, 28.25, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
export const TANKS = [1000, 1500, 2000, 3000, 4000, 5000, 7500, 10000, 15000, 20000, 25000, 30000];
export const ETA = 0.9;          // first-flush + filter efficiency
export const STORM_M = 0.05;     // design storm depth for recharge well (50 mm)
export const GAL = 3785.41;      // litres per 1,000 US gallons (tanker load)
export const FT2 = 0.09290304;   // m² per sq ft
export const WELL_D = 1.2;       // recharge well diameter (m)
export const WELL_MAX_DEPTH = 6; // split into more wells beyond this depth (m)

export const DEFAULTS = {
  city: "islamabad", area: 150, unit: "m2", roof: "rcc", people: 6, lpcd: 40,
  pTank: 30, pTanker: 3000, pPlumb: 25000, pWell: 60000, houses: 500, tank: null, rain: null,
};

const num = (v, lo, hi, d) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return d;
  return Math.min(hi, Math.max(lo, n));
};

// Clean any user/API input into a valid, bounded input object.
export function normalizeInputs(raw = {}) {
  const city = CITIES[raw.city] ? raw.city : DEFAULTS.city;
  const roof = ROOFS[raw.roof] ? raw.roof : DEFAULTS.roof;
  let rain = null;
  if (Array.isArray(raw.rain) && raw.rain.length === 12) rain = raw.rain.map(v => num(v, 0, 5000, 0));
  const tank = TANKS.includes(Number(raw.tank)) ? Number(raw.tank) : null;
  return {
    city, roof, rain, tank,
    unit: raw.unit === "ft2" ? "ft2" : "m2",
    area: num(raw.area, 1, 100000, DEFAULTS.area),
    people: Math.round(num(raw.people, 1, 1000, DEFAULTS.people)),
    lpcd: num(raw.lpcd, 1, 1000, DEFAULTS.lpcd),
    pTank: num(raw.pTank, 0, 1e7, DEFAULTS.pTank),
    pTanker: num(raw.pTanker, 0, 1e7, DEFAULTS.pTanker),
    pPlumb: num(raw.pPlumb, 0, 1e9, DEFAULTS.pPlumb),
    pWell: num(raw.pWell, 0, 1e9, DEFAULTS.pWell),
    houses: Math.round(num(raw.houses, 1, 1e6, DEFAULTS.houses)),
  };
}

// Monthly yield-after-spillage simulation over 3 cycles; the last (steady) year is reported.
export function simulate(inflow, demand, V) {
  let st = 0, res = null;
  for (let y = 0; y < 3; y++) {
    let used = 0, over = 0; const usedM = [], overM = [];
    for (let m = 0; m < 12; m++) {
      const tot = st + inflow[m];
      const o = Math.max(0, tot - V);
      st = Math.min(tot, V);
      const u = Math.min(st, demand[m]);
      st -= u; used += u; over += o; usedM.push(u); overM.push(o);
    }
    res = { used, over, usedM, overM };
  }
  return res;
}

// Full design calculation. `inputs` should come from normalizeInputs().
export function compute(inputs) {
  const S = normalizeInputs(inputs);
  const rain = S.rain || CITIES[S.city].mm.slice();
  const A = S.area, C = ROOFS[S.roof].c;
  const inflow = rain.map(r => r * A * C * ETA);
  const demand = DAYS.map(d => S.people * S.lpcd * d);
  const harvest = inflow.reduce((a, b) => a + b, 0);
  const dem = demand.reduce((a, b) => a + b, 0);
  const annualRain = rain.reduce((a, b) => a + b, 0);

  const curve = TANKS.map(V => ({ V, ...simulate(inflow, demand, V) }));
  const best = curve[curve.length - 1].used;
  let recIdx = curve.findIndex(c => c.used >= 0.9 * best);
  if (recIdx < 0) recIdx = curve.length - 1;
  const recommended = TANKS[recIdx];
  const tank = S.tank ?? recommended;
  const sim = simulate(inflow, demand, tank);
  const met = dem > 0 ? (100 * sim.used) / dem : 0;

  // recharge well
  const storm = A * C * STORM_M; // m³ for one design storm
  const wellArea = Math.PI * (WELL_D / 2) ** 2;
  const depthOne = storm / wellArea;
  const wells = Math.max(1, Math.ceil(depthOne / WELL_MAX_DEPTH));
  const wellDepth = Math.max(1.5, depthOne / wells);

  // cost
  const tankCost = tank * S.pTank;
  const total = tankCost + S.pPlumb + S.pWell;
  const save = (sim.used / GAL) * S.pTanker;
  const payback = save > 0 ? total / save : null;

  // area scale
  const H = S.houses;
  const area = {
    houses: H,
    harvestML: (harvest * H) / 1e6,
    tankerTrips: (sim.used * H) / GAL,
    rechargeML: (sim.over * H) / 1e6,
    stormM3: storm * H,
  };

  return {
    inputs: S, rain, edited: !!S.rain, annualRain, A, C, inflow, demand, harvest, dem,
    curve: curve.map(c => ({ V: c.V, used: c.used, pct: dem > 0 ? (100 * c.used) / dem : 0 })),
    recIdx, recommended, tank, sim, met,
    well: { storm, wells, depth: wellDepth, diameter: WELL_D, overflow: sim.over, monsoon: sim.overM[6] + sim.overM[7] },
    cost: { tank: tankCost, plumb: S.pPlumb, well: S.pWell, total, save, payback },
    area,
    tankersEquivalent: harvest / GAL,
  };
}
