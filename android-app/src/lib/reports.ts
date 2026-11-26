// PDF design reports from the backend (POST /api/report), saved on the device and shared via the Android share sheet.
import { Directory, File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { request } from "./api";
import { KEYS, readJSON, writeJSON } from "./storage";
import type { Inputs } from "./store";
import type { Lang } from "./strings";
import { CITIES } from "../shared/calc.js";

export type ReportMeta = { id: string; name: string; uri: string; lang: Lang; city: string; createdAt: string; size: number };

const dir = () => {
  const d = new Directory(Paths.document, "reports");
  if (!d.exists) d.create({ intermediates: true });
  return d;
};

export async function listReports(): Promise<ReportMeta[]> {
  const list = await readJSON<ReportMeta[]>(KEYS.reports, []);
  return list.filter(r => { try { return new File(r.uri).exists; } catch { return false; } });
}

export async function createReport(inputs: Inputs, lang: Lang): Promise<ReportMeta> {
  const res = await request(`/api/report?lang=${lang}`, { method: "POST", body: JSON.stringify({ inputs, lang }), timeout: 120000, headers: { Accept: "application/pdf" } });
  const buf = await res.arrayBuffer();
  const bytes = new Uint8Array(buf);
  // a real PDF starts with "%PDF"
  if (bytes.length < 1000 || bytes[0] !== 0x25 || bytes[1] !== 0x50) throw new Error("bad pdf");
  const city = (CITIES as Record<string, { en: string }>)[inputs.city]?.en ?? "Design";
  const stamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, "");
  const name = `RWH-Design-Report-${city}-${lang === "ur" ? "Urdu" : "English"}-${stamp}.pdf`;
  const f = new File(dir(), name);
  if (f.exists) f.delete();
  f.create();
  f.write(bytes);
  const meta: ReportMeta = { id: stamp + lang, name, uri: f.uri, lang, city: inputs.city, createdAt: new Date().toISOString(), size: bytes.length };
  const list = await listReports();
  await writeJSON(KEYS.reports, [meta, ...list]);
  return meta;
}

export async function shareReport(r: ReportMeta) {
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(r.uri, { mimeType: "application/pdf", dialogTitle: r.name, UTI: "com.adobe.pdf" });
}

export async function deleteReport(r: ReportMeta) {
  try { const f = new File(r.uri); if (f.exists) f.delete(); } catch {}
  const list = await listReports();
  await writeJSON(KEYS.reports, list.filter(x => x.id !== r.id));
}
