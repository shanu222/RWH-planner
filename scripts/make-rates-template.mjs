// Writes rates-template.csv from the built-in published rates (shared/rates.js).
// Import it into Google Sheets, update rates monthly from PBS and supplier price lists,
// then File → Share → Publish to web → CSV, and put that link in RATES_SOURCE_URL on Railway.
import { writeFileSync } from "node:fs";
import { RATE_ITEMS, PBS } from "../shared/rates.js";
const q = v => /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v);
const rows = [["key", "city", "rate", "unit", "item", "source", "url", "as_of"]];
for (const it of RATE_ITEMS) {
  if (it.pbs) for (const [city, r] of Object.entries(PBS.cities)) rows.push([it.key, city, r[it.pbs], it.unit, it.en, PBS.source, PBS.url, PBS.asOf]);
  else rows.push([it.key, "", it.rate, it.unit, it.en, it.src, it.url || "", it.asOf]);
}
writeFileSync(new URL("../rates-template.csv", import.meta.url), rows.map(r => r.map(q).join(",")).join("\n") + "\n");
console.log(`rates-template.csv: ${rows.length - 1} rates`);
