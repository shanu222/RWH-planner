import { fmt, round100 } from "../shared/i18n.js";
import { FT2, GAL } from "../shared/calc.js";
import { tr, type Lang } from "./strings";

export { fmt };
export const pkr = (lang: Lang, n: number) => tr(lang, "money", { n: fmt(round100(n)) });
export const pkrExact = (lang: Lang, n: number) => tr(lang, "money", { n: fmt(n) });

export function area(lang: Lang, m2: number, unit: "m2" | "ft2") {
  return unit === "ft2" ? `${fmt(m2 / FT2)} ${tr(lang, "ft2")}` : `${fmt(m2)} ${tr(lang, "m2")}`;
}
export const areaValue = (m2: number, unit: "m2" | "ft2") => (unit === "ft2" ? m2 / FT2 : m2);
export const areaToM2 = (v: number, unit: "m2" | "ft2") => (unit === "ft2" ? v * FT2 : v);

// Volumes: litres or US gallons (as in "1,000-gallon tanker")
const USGAL = GAL / 1000;
export function vol(lang: Lang, litres: number, unit: "L" | "gal", digits = 0) {
  if (unit === "gal") return `${fmt(litres / USGAL, digits)} ${tr(lang, "gallonsU")}`;
  return tr(lang, "litres", { n: fmt(litres, digits) });
}
export const volNumber = (litres: number, unit: "L" | "gal") => (unit === "gal" ? litres / USGAL : litres);

export function compact(n: number) {
  if (n >= 1e6) return fmt(n / 1e6, 1) + "M";
  if (n >= 1e4) return fmt(n / 1e3, 0) + "k";
  return fmt(n);
}

export function ago(lang: Lang, at: number | null) {
  if (!at) return "";
  const m = Math.round((Date.now() - at) / 60000);
  if (m < 2) return tr(lang, "justNow");
  const d = new Date(at);
  return d.toLocaleDateString(lang === "ur" ? "ur-PK" : "en-GB", { day: "numeric", month: "short" }) + " " +
    d.toLocaleTimeString(lang === "ur" ? "ur-PK" : "en-GB", { hour: "2-digit", minute: "2-digit" });
}
