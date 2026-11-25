import { $, esc, api, say } from "./api.js";
let data = null, city = "islamabad";
const BADGE = { admin: ["Admin", "est"], sheet: ["Sheet", "live"], pbs: ["PBS", "live"] };
const GROUP = { conv: "Pipes, fittings and filters", store: "Storage tanks", well: "Recharge well materials", lab: "Labour", water: "Water value" };
const fmt = n => Number(n).toLocaleString("en-PK", { maximumFractionDigits: 2 });

export async function loadRates() {
  data = await api("/api/admin/rates?city=" + encodeURIComponent(city));
  $("rCity").innerHTML = Object.entries(data.cities).map(([k, n]) => `<option value="${k}" ${k === city ? "selected" : ""}>${esc(n)}</option>`).join("");
  $("sheetUrl").value = data.sheetUrl || "";
  const sh = data.status.sheet, link = data.status.sheetUrl;
  const pill = $("sheetPill");
  pill.className = "status-pill " + (sh.configured && !sh.error ? "live" : "off");
  pill.textContent = !sh.configured ? "No sheet linked" : sh.error ? "Sheet problem: " + sh.error : `Reading sheet · ${sh.rows} rows` + (sh.fetchedAt ? " · " + new Date(sh.fetchedAt).toLocaleString() : "");
  const open = $("openSheet"); const m = (link || "").match(/docs\.google\.com\/spreadsheets\/d\/[\w-]+/);
  open.hidden = !m; if (m) open.href = "https://" + m[0] + "/edit";
  render();
}

function render() {
  const groups = {};
  for (const it of data.items) (groups[it.group] ||= []).push(it);
  const ovs = data.overrides;
  const rows = Object.entries(groups).map(([g, items]) => `<tr class="grp"><td colspan="5">${esc(GROUP[g] || g)}</td></tr>` +
    items.map(it => {
      const r = data.rates[it.key], live = r.live, b = BADGE[live];
      const ov = ovs.find(o => o.key === it.key && (o.city || "") === city) || ovs.find(o => o.key === it.key && !o.city);
      return `<tr data-key="${esc(it.key)}"><td>${esc(it.en)}<div class="muted small">${esc(r.src || "")}</div></td>
        <td class="n"><b>${fmt(r.rate)}</b><div class="muted small">per ${esc(it.unit)}</div></td>
        <td>${b ? `<span class="tag ${b[1]}">${b[0]}</span>` : `<span class="tag">Bundled</span>`}${r.estimate ? ` <span class="tag est">Estimate</span>` : ""}</td>
        <td><input type="number" class="ov" min="0" step="any" placeholder="New rate" aria-label="Override for ${esc(it.en)}" value="${ov ? ov.rate : ""}"></td>
        <td class="n actions"><button class="btn sm" data-act="set">Set</button>${ov ? `<button class="btn sm" data-act="clear">Clear</button>` : ""}</td></tr>`;
    }).join("")).join("");
  $("rTable").innerHTML = `<thead><tr><th>Item</th><th class="n">Rate (Rs)</th><th>Source</th><th>Override for this city</th><th class="n">Actions</th></tr></thead><tbody>${rows}</tbody>`;
}

$("rCity").addEventListener("change", e => { city = e.target.value; loadRates().catch(err => say($("rMsg"), err.message, "err")); });
$("rTable").addEventListener("click", async e => {
  const b = e.target.closest("button[data-act]"); if (!b) return;
  const tr = b.closest("tr"), key = tr.dataset.key;
  b.disabled = true;
  try {
    if (b.dataset.act === "set") {
      const rate = Number(tr.querySelector(".ov").value);
      if (!(rate > 0)) throw new Error("Enter a rate above zero.");
      await api("/api/admin/rates/override", { method: "PUT", body: JSON.stringify({ key, city, rate }) });
      say($("rMsg"), "Override saved for this city. Visitors see it within a minute.", "ok");
    } else {
      await api("/api/admin/rates/override", { method: "DELETE", body: JSON.stringify({ key, city }) });
      say($("rMsg"), "Override removed.", "ok");
    }
    await loadRates();
  } catch (err) { say($("rMsg"), err.message, "err"); b.disabled = false; }
});
$("sheetForm").addEventListener("submit", async e => {
  e.preventDefault();
  try { await api("/api/admin/rates/sheet", { method: "PUT", body: JSON.stringify({ url: $("sheetUrl").value }) }); await loadRates(); say($("sheetMsg"), "Sheet link saved and re-read.", "ok"); }
  catch (err) { say($("sheetMsg"), err.message, "err"); }
});
$("refreshRates").addEventListener("click", async () => {
  try { await api("/api/admin/rates/refresh", { method: "POST" }); await loadRates(); say($("sheetMsg"), "Sheet re-read.", "ok"); }
  catch (err) { say($("sheetMsg"), err.message, "err"); }
});
