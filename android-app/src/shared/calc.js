// RWH Planner – shared calculation engine.
// This file is the single source of truth. `npm run sync` (repo root) copies it
// into frontend/src/shared and backend/src/shared. Edit it here only.
import { RATE_ITEMS, RATE_KEYS, defaultRates, PLOTS, DOWNPIPE } from "./rates.js";

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

export const TANK_UNIT = 2000;    // litres per plastic tank in the cost estimate
export const DIG_CFT_PER_DAY = 60; // manual excavation output of one labourer (cft/day)
export const PAYBACK_YEARS = 10;   // each added tank must repay itself in water saved within this many years

export const DEFAULTS = {
  city: "islamabad", plot: "5m", marlaSize: 225, storeys: 2, area: null, unit: "m2", roof: "rcc", people: 6, lpcd: 40,
  houses: 500, tank: null, rain: null, contingency: 10, rates: null,
};

// Roof area (m²) for a plot preset.
export function plotRoofArea(plotKey, marlaSize = 225) {
  const p = PLOTS.find(x => x.key === plotKey);
  if (!p) return null;
  return p.marla * marlaSize * p.cover * FT2;
}

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
  const plot = PLOTS.some(p => p.key === raw.plot) ? raw.plot : (raw.plot === "custom" ? "custom" : DEFAULTS.plot);
  const marlaSize = Number(raw.marlaSize) === 272.25 ? 272.25 : 225;
  const presetArea = plot === "custom" ? null : plotRoofArea(plot, marlaSize);
  const area = presetArea ?? num(raw.area, 1, 100000, 150);
  let rates = null;
  if (raw.rates && typeof raw.rates === "object") {
    rates = {};
    for (const k of RATE_KEYS) if (raw.rates[k] != null && raw.rates[k] !== "") rates[k] = num(raw.rates[k], 0, 1e8, 0);
  }
  return {
    city, roof, rain, tank, plot, marlaSize, rates, area,
    storeys: Math.round(num(raw.storeys, 1, 6, DEFAULTS.storeys)),
    contingency: num(raw.contingency, 0, 50, DEFAULTS.contingency),
    unit: raw.unit === "ft2" ? "ft2" : "m2",
    people: Math.round(num(raw.people, 1, 1000, DEFAULTS.people)),
    lpcd: num(raw.lpcd, 1, 1000, DEFAULTS.lpcd),
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

// Resolve the rates used: published rates for the city (or `published`, e.g. live rates
// from the API), with any user-edited values on top.
export function resolveRates(S, published) {
  const fallback = defaultRates(S.city);
  const out = {};
  for (const k of RATE_KEYS) {
    const b = (published && published[k]) || fallback[k];
    const edited = !!(S.rates && S.rates[k] != null);
    out[k] = { ...b, rate: edited ? S.rates[k] : b.rate, edited };
  }
  return out;
}

// Simple bill of quantities for the selected design.
export function costEstimate(S, d, rates) {
  const R = k => rates[k].rate;
  const roofFt2 = d.A / FT2;
  const outlets = Math.max(1, Math.ceil(roofFt2 / DOWNPIPE.maxPerOutletFt2));
  const pipeFt = Math.ceil(outlets * (S.storeys * 10.5 + 1.5 + 15) + 15);
  const elbows = outlets * 3 + 2;
  const filters = Math.max(1, Math.ceil(outlets / 2));
  const tanks = Math.max(1, Math.ceil(d.tank / TANK_UNIT));
  const wellCft = d.well.wells * Math.PI * (WELL_D / 2) ** 2 * d.well.depth * 35.3147;
  const bajri = (wellCft * 0.6) / 100, sand = (wellCft * 0.2) / 100;
  const bricks = (d.well.wells * 500) / 1000, cement = d.well.wells * 4;
  const plumberDays = Math.ceil(1 + outlets * 0.5);
  const masonDays = Math.ceil(d.well.wells * 1.5);
  const labourDays = Math.ceil(wellCft / DIG_CFT_PER_DAY + d.well.wells);
  const line = (key, group, qty) => ({ key, group, qty, rate: R(key), amount: qty * R(key) });
  const items = [
    line("pipe4", "conv", pipeFt), line("elbow4", "conv", elbows), line("filter", "conv", filters),
    line("tank", "store", tanks),
    line("bajri", "well", bajri), line("sand", "well", sand), line("bricks", "well", bricks), line("cement", "well", cement),
    line("plumber", "lab", plumberDays), line("mason", "lab", masonDays), line("labour", "lab", labourDays),
  ];
  const subtotal = items.reduce((a, b) => a + b.amount, 0);
  const contingency = (subtotal * S.contingency) / 100;
  const total = subtotal + contingency;
  const groups = {};
  for (const it of items) groups[it.group] = (groups[it.group] || 0) + it.amount;
  const capacityOk = roofFt2 / outlets <= DOWNPIPE.capacityFt2;
  return { items, groups, subtotal, contingencyPct: S.contingency, contingency, total,
    outlets, pipeFt, elbows, filters, tanks, tankUnit: TANK_UNIT, wellCft, roofFt2, capacityOk, downpipe: DOWNPIPE };
}

// Full design calculation. `inputs` should come from normalizeInputs().
// `published` = live rates from the API (optional).
export function compute(inputs, published) {
  const S = normalizeInputs(inputs);
  const rain = S.rain || CITIES[S.city].mm.slice();
  const A = S.area, C = ROOFS[S.roof].c;
  const inflow = rain.map(r => r * A * C * ETA);
  const demand = DAYS.map(d => S.people * S.lpcd * d);
  const harvest = inflow.reduce((a, b) => a + b, 0);
  const dem = demand.reduce((a, b) => a + b, 0);
  const annualRain = rain.reduce((a, b) => a + b, 0);

  const curve = TANKS.map(V => ({ V, ...simulate(inflow, demand, V) }));
  const rates = resolveRates(S, published);

  // Economic tank size: grow the tank step by step while the extra water from each step,
  // valued at the tanker price, repays that step's tank cost within PAYBACK_YEARS.
  const waterPerL = rates.tanker.rate / GAL;
  const tankPerL = rates.tank.rate / TANK_UNIT;
  let recIdx = 0;
  for (let i = 1; i < curve.length; i++) {
    const gain = curve[i].used - curve[i - 1].used;
    const stepCost = (curve[i].V - curve[i - 1].V) * tankPerL;
    if (gain * waterPerL * PAYBACK_YEARS >= stepCost) recIdx = i; else break;
  }
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


  // area scale
  const H = S.houses;
  const area = {
    houses: H,
    harvestML: (harvest * H) / 1e6,
    tankerTrips: (sim.used * H) / GAL,
    rechargeML: (sim.over * H) / 1e6,
    stormM3: storm * H,
  };

  const well = { storm, wells, depth: wellDepth, diameter: WELL_D, overflow: sim.over, monsoon: sim.overM[6] + sim.overM[7] };
  const boq = costEstimate(S, { A, tank, well }, rates);
  const save = (sim.used / GAL) * rates.tanker.rate;
  const payback = save > 0 ? boq.total / save : null;

  return {
    inputs: S, rain, edited: !!S.rain, annualRain, A, C, inflow, demand, harvest, dem,
    curve: curve.map(c => ({ V: c.V, used: c.used, pct: dem > 0 ? (100 * c.used) / dem : 0 })),
    recIdx, recommended, tank, sim, met,
    well, rates, boq,
    cost: { total: boq.total, save, payback },
    area,
    tankersEquivalent: harvest / GAL,
  };
}
