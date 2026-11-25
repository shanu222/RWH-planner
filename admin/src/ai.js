import { $, esc, api, say } from "./api.js";
const NAMES = { openai: "OpenAI", gemini: "Google Gemini", openrouter: "OpenRouter" };
let view = null, order = [];

export async function loadAi() {
  view = await api("/api/admin/ai");
  $("aiStorageWarn").hidden = view.storage; order = [...view.order];
  $("aiEnabled").checked = view.enabled; $("aiFallback").checked = view.fallback; $("aiCache").checked = view.cache; $("aiLogging").checked = view.logging;
  $("aiRetries").value = view.maxRetries; $("aiTimeout").value = Math.round(view.timeoutMs / 1000); $("aiTtl").value = view.cacheTtl;
  renderOrder(); renderProviders();
}

function renderOrder() {
  $("aiOrder").innerHTML = order.map((p, i) => `<span class="chip" data-p="${p}"><b>${i + 1}</b> ${NAMES[p]}
    <button type="button" class="icon-btn sm" data-mv="-1" ${i === 0 ? "disabled" : ""} aria-label="Move earlier">←</button>
    <button type="button" class="icon-btn sm" data-mv="1" ${i === order.length - 1 ? "disabled" : ""} aria-label="Move later">→</button></span>`).join("");
}
$("aiOrder").addEventListener("click", e => {
  const b = e.target.closest("[data-mv]"); if (!b) return;
  const p = b.closest("[data-p]").dataset.p, i = order.indexOf(p), j = i + Number(b.dataset.mv);
  [order[i], order[j]] = [order[j], order[i]]; renderOrder();
});

function renderProviders() {
  $("provGrid").innerHTML = Object.entries(view.providers).map(([p, v]) => `<section class="card prov" data-p="${p}">
    <div class="card-h"><h2>${NAMES[p]}</h2><span class="status-pill ${v.set ? "live" : "off"}">${v.set ? (v.source === "env" ? "Key from server settings" : "Key set by admin") : "No key"}</span></div>
    <p class="muted small">${v.set ? `Current key <code>${esc(v.hint)}</code>` : "Add a key to use this provider."}</p>
    <label class="field"><span>New API key</span><input type="password" class="k" autocomplete="off" placeholder="${v.set ? "Leave empty to keep the current key" : "Paste key"}"></label>
    ${p === "openrouter"
      ? `<label class="field"><span>Models, one per line (tried in order)</span><textarea class="m" rows="5">${esc(v.models.join("\n"))}</textarea></label>`
      : `<div class="row2 eq"><label class="field"><span>Model</span><input type="text" class="m1" value="${esc(v.model)}"></label><label class="field"><span>Fallback model</span><input type="text" class="m2" value="${esc(v.fallbackModel || "")}"></label></div>`}
    <div class="ed-actions"><button class="btn" data-act="test">Test key</button><button class="btn primary" data-act="save">Save</button>${v.source === "admin" ? `<button class="btn danger" data-act="remove">Remove key</button>` : ""}</div>
    <p class="status" role="status"></p></section>`).join("");
}

$("provGrid").addEventListener("click", async e => {
  const b = e.target.closest("button[data-act]"); if (!b) return;
  const card = b.closest(".prov"), p = card.dataset.p, out = card.querySelector(".status"), typed = card.querySelector(".k").value.trim();
  const models = () => p === "openrouter" ? { openrouter: card.querySelector(".m").value.split("\n").map(s => s.trim()).filter(Boolean) }
    : { [p]: card.querySelector(".m1").value, [p + "Fallback"]: card.querySelector(".m2").value };
  b.disabled = true;
  try {
    if (b.dataset.act === "test") {
      say(out, "Testing…");
      const r = await api("/api/admin/ai/test", { method: "POST", body: JSON.stringify({ provider: p, key: typed || undefined }) });
      say(out, r.ok ? `Works · ${r.model} · ${r.ms} ms${typed ? " (not saved yet)" : ""}` : "Failed: " + r.message, r.ok ? "ok" : "err");
    } else if (b.dataset.act === "save") {
      await api("/api/admin/ai", { method: "PUT", body: JSON.stringify({ keys: typed ? { [p]: typed } : {}, models: models() }) });
      await loadAi(); say($("provGrid").querySelector(`[data-p="${p}"] .status`), "Saved.", "ok");
    } else if (confirm("Remove the key stored by the admin? The server setting (if any) will be used instead.")) {
      await api("/api/admin/ai", { method: "PUT", body: JSON.stringify({ keys: { [p]: null } }) });
      await loadAi();
    }
  } catch (err) { say(out, err.message, "err"); }
  finally { b.disabled = false; }
});

$("aiForm").addEventListener("submit", async e => {
  e.preventDefault();
  try {
    await api("/api/admin/ai", { method: "PUT", body: JSON.stringify({
      enabled: $("aiEnabled").checked, fallback: $("aiFallback").checked, cache: $("aiCache").checked, logging: $("aiLogging").checked,
      order, maxRetries: Number($("aiRetries").value), timeoutMs: Number($("aiTimeout").value) * 1000, cacheTtl: Number($("aiTtl").value) }) });
    say($("aiMsg"), "Saved.", "ok");
  } catch (err) { say($("aiMsg"), err.message, "err"); }
});
$("aiClear").addEventListener("click", async () => { await api("/api/admin/ai/clear-cache", { method: "POST" }); say($("aiMsg"), "Cache cleared.", "ok"); });
