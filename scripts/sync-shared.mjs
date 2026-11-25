// Copies shared/*.js into frontend/src/shared and backend/src/shared.
// Run `npm run sync` after editing anything in shared/. `npm run check` fails if copies drift.
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const src = path.join(root, "shared");
const targets = ["frontend/src/shared", "backend/src/shared"].map(p => path.join(root, p));
const check = process.argv.includes("--check");
let drift = 0;
for (const f of readdirSync(src).filter(f => f.endsWith(".js"))) {
  const body = readFileSync(path.join(src, f), "utf8");
  for (const t of targets) {
    const dest = path.join(t, f);
    if (check) {
      let cur = ""; try { cur = readFileSync(dest, "utf8"); } catch {}
      if (cur !== body) { console.error(`out of sync: ${path.relative(root, dest)}`); drift++; }
    } else { mkdirSync(t, { recursive: true }); writeFileSync(dest, body); console.log(`synced ${path.relative(root, dest)}`); }
  }
}
if (check && drift) { console.error("Run `npm run sync`."); process.exit(1); }
if (check) console.log("shared files in sync");
