// Training videos and technique guides.
import { SEED_VIDEOS, VIDEO_CATEGORIES, VIDEO_LANGS } from "./shared/videos.js";
import { GUIDES, THEMES, CALENDAR } from "./shared/guides.js";
import { t } from "./shared/i18n.js";

const $ = id => document.getElementById(id);
const esc = v => String(v ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

let API = "", getLang = () => "en";
let data = null, loading = false, cat = "all", query = "";

export function initLearn(opts) {
  API = opts.api; getLang = opts.lang;
  $("vSearch").addEventListener("input", e => { query = e.target.value.trim().toLowerCase(); renderGrid(); });
  $("vCats").addEventListener("click", e => {
    const b = e.target.closest("button[data-cat]"); if (!b) return;
    cat = b.dataset.cat; renderTraining();
  });
  $("vGrid").addEventListener("click", e => {
    const card = e.target.closest("[data-vid]"); if (!card) return;
    e.preventDefault(); location.hash = "training/" + card.dataset.vid;
  });
  const dlg = $("player");
  $("pClose").addEventListener("click", () => closePlayer(true));
  dlg.addEventListener("cancel", e => { e.preventDefault(); closePlayer(true); });
  dlg.addEventListener("click", e => { if (e.target === dlg) closePlayer(true); });
  $("gGrid").addEventListener("click", e => {
    const b = e.target.closest("[data-more]"); if (!b) return;
    const card = b.closest(".guide"); const open = card.classList.toggle("open");
    if (open) card.scrollIntoView({ behavior: "smooth", block: "nearest" });
    b.textContent = t(getLang(), open ? "gLess" : "gMore"); b.setAttribute("aria-expanded", open);
  });
}

// ---------- data ----------
async function load() {
  if (data || loading) return;
  loading = true;
  try {
    if (!API) throw new Error("no api");
    const res = await fetch(`${API}/api/videos`, { signal: AbortSignal.timeout(20000) });
    if (!res.ok) throw new Error("HTTP " + res.status);
    data = await res.json();
  } catch {
    data = { categories: VIDEO_CATEGORIES, videos: SEED_VIDEOS.map(v => ({ ...v, thumb: v.type === "youtube" ? `https://i.ytimg.com/vi/${v.ref}/hqdefault.jpg` : null })) };
  }
  loading = false;
  renderTraining(); openFromHash();
}

const title = (v, L) => v.title?.[L] || v.title?.en || v.title?.ur || "";
const desc = (v, L) => v.desc?.[L] || v.desc?.en || v.desc?.ur || "";
const catName = (k, L) => (VIDEO_CATEGORIES.find(c => c.key === k) || {})[L] || k;
const langName = (k, L) => (VIDEO_LANGS[k] || VIDEO_LANGS.other)[L];
const dur = s => { if (!s) return ""; s = Math.round(s); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return (h ? h + ":" + String(m).padStart(2, "0") : m) + ":" + String(x).padStart(2, "0"); };

// ---------- training ----------
export function renderTraining() {
  const L = getLang();
  $("vSearch").placeholder = t(L, "searchVideos");
  if (!data) { $("vGrid").innerHTML = skeleton(); $("vCount").textContent = t(L, "vLoading"); load(); return; }
  const used = new Set(data.videos.map(v => v.category));
  const cats = VIDEO_CATEGORIES.filter(c => used.has(c.key));
  if (cat !== "all" && !used.has(cat)) cat = "all";
  $("vCats").innerHTML = [{ key: "all", [L]: t(L, "allCats") }, ...cats]
    .map(c => `<button type="button" class="chip" data-cat="${c.key}" aria-pressed="${c.key === cat}">${esc(c[L] || c.en)}</button>`).join("");
  renderGrid();
}

function renderGrid() {
  if (!data) return;
  const L = getLang();
  const list = data.videos.filter(v => (cat === "all" || v.category === cat) &&
    (!query || [v.title?.en, v.title?.ur, v.desc?.en, v.desc?.ur, v.source, catName(v.category, "en"), catName(v.category, "ur")].join(" ").toLowerCase().includes(query)));
  $("vCount").textContent = list.length === 1 ? t(L, "vCount1") : t(L, "vCount", { n: list.length });
  $("vEmpty").hidden = list.length > 0; $("vEmpty").textContent = t(L, "noVideos");
  $("vGrid").innerHTML = list.map(v => `
    <a class="vcard" href="#training/${esc(v.id)}" data-vid="${esc(v.id)}" aria-label="${esc(t(L, "vOpen", { t: title(v, L) }))}">
      <div class="thumb">${v.thumb ? `<img src="${esc(v.thumb)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">` : ""}
        <span class="play" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5z" fill="currentColor"/></svg></span>
        ${v.duration ? `<span class="dur num">${dur(v.duration)}</span>` : ""}</div>
      <div class="vbody">
        <span class="vcat">${esc(catName(v.category, L))}</span>
        <b class="vtitle">${esc(title(v, L))}</b>
        <span class="vmeta">${esc(v.source || "")}</span>
        <span class="vmeta">${esc(langName(v.lang, L))}${v.subtitles ? " · " + esc(t(L, "vSubs", { l: langName(v.subtitles, L) })) : ""}</span>
      </div>
    </a>`).join("");
}

const skeleton = () => Array.from({ length: 6 }, () => `<div class="vcard sk"><div class="thumb"></div><div class="vbody"><span class="skl w40"></span><span class="skl w90"></span><span class="skl w60"></span></div></div>`).join("");

// ---------- player ----------
export function openFromHash() {
  const m = location.hash.match(/^#training\/([\w-]+)/);
  if (!m) { closePlayer(false); return; }
  if (!data) { load(); return; }
  const v = data.videos.find(x => x.id === m[1]);
  if (v) openPlayer(v);
}

function openPlayer(v) {
  const L = getLang(), dlg = $("player");
  let frame;
  if (v.type === "youtube") frame = `<iframe src="https://www.youtube-nocookie.com/embed/${esc(v.ref)}?autoplay=1&rel=0&modestbranding=1&hl=${L}" title="${esc(title(v, L))}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
  else if (v.type === "vimeo") frame = `<iframe src="https://player.vimeo.com/video/${esc(v.ref)}?autoplay=1&dnt=1&title=0&byline=0" title="${esc(title(v, L))}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
  else frame = `<video src="${esc(v.src)}" ${v.thumb ? `poster="${esc(v.thumb)}"` : ""} controls autoplay playsinline preload="metadata"></video>`;
  $("pFrame").innerHTML = frame;
  $("pTitle").textContent = title(v, L);
  $("pMeta").textContent = [catName(v.category, L), langName(v.lang, L) + (v.subtitles ? " · " + t(L, "vSubs", { l: langName(v.subtitles, L) }) : ""), v.duration ? dur(v.duration) : ""].filter(Boolean).join(" · ");
  $("pDesc").textContent = desc(v, L);
  $("pSrc").innerHTML = v.source || v.sourceUrl ? `${esc(t(L, "vSource"))}: ${esc(v.source || "")}${v.sourceUrl ? ` · <a href="${esc(v.sourceUrl)}" target="_blank" rel="noopener">${esc(t(L, "vWatchOn"))} ↗</a>` : ""}` : "";
  if (!dlg.open) dlg.showModal();
}

function closePlayer(updateHash) {
  const dlg = $("player");
  if (dlg.open) dlg.close();
  $("pFrame").innerHTML = "";
  if (updateHash && /^#training\//.test(location.hash)) history.pushState(null, "", "#training"), dispatchEvent(new HashChangeEvent("hashchange"));
}

// ---------- guides ----------
export function renderGuides() {
  const L = getLang();
  const theme = n => THEMES.find(x => x.n === n);
  $("gGrid").innerHTML = GUIDES.map(g => `
    <article class="card guide" id="guide-${g.key}">
      <div class="guide-top"><span class="vcat" title="${esc(theme(g.theme)[L])}">${esc(t(L, "gTheme", { n: g.theme }))} · ${esc(theme(g.theme)[L])}</span>
        <h2>${esc(g.title[L])}</h2><p class="muted">${esc(g.summary[L])}</p></div>
      <div class="guide-more">
        <div><h3>${esc(t(L, "gWhen"))}</h3><p>${esc(g.when[L])}</p></div>
        <div><h3>${esc(t(L, "gPoints"))}</h3><ul>${g.points[L].map(p => `<li>${esc(p)}</li>`).join("")}</ul></div>
        <div><h3>${esc(t(L, "gCare"))}</h3><ul>${g.care[L].map(p => `<li>${esc(p)}</li>`).join("")}</ul></div>
      </div>
      <div class="card-f guide-f">
        <button type="button" class="link" data-more aria-expanded="false">${esc(t(L, "gMore"))}</button>
        <span class="guide-links"><a class="link" href="#training" data-gocat="${g.video}">${esc(t(L, "gVideos"))}</a>${["rooftop", "rechargeWell", "firstflush", "storage"].includes(g.key) ? `<a class="link" href="#overview">${esc(t(L, "gPlanner"))}</a>` : ""}</span>
      </div>
    </article>`).join("");
  $("gGrid").querySelectorAll("[data-gocat]").forEach(a => a.addEventListener("click", () => { cat = a.dataset.gocat; query = ""; $("vSearch").value = ""; }));
  $("cal").innerHTML = CALENDAR.map(c => `
    <div class="cal-col"><h3>${esc(c.when[L])}</h3><ul class="checks">${c.tasks[L].map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>`).join("");
}
