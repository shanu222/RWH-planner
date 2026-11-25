import { API, $, esc, api } from "./api.js";
export let state = { videos: [], categories: [], languages: {}, storage: false };
let editing = null, type = "file", file = null, thumbBlob = null, duration = null, confirmDel = null;

export async function loadVideos() {
  state = await api("/api/admin/videos");
  $("storageWarn").hidden = state.storage; $("newBtn").disabled = !state.storage;
  $("cat").innerHTML = state.categories.map(c => `<option value="${c.key}">${esc(c.en)}</option>`).join("");
  $("lang").innerHTML = Object.entries(state.languages).map(([k, l]) => `<option value="${k}">${esc(l.en)}</option>`).join("");
  renderLib();
}
const load = loadVideos;

// ---------- library ----------
const fmtDur = s => s ? `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}` : "–";
const fmtSize = b => b ? (b > 1e9 ? (b / 1e9).toFixed(2) + " GB" : (b / 1e6).toFixed(1) + " MB") : "";
const catName = k => (state.categories.find(c => c.key === k) || {}).en || k;
const thumbOf = v => v.type === "youtube" ? `https://i.ytimg.com/vi/${v.ref}/default.jpg` : v.type === "file" && v.thumbKey ? `${API}/api/videos/${v.id}/thumb` : "";

function renderLib() {
  const list = [...state.videos].sort((a, b) => (a.order ?? 1e9) - (b.order ?? 1e9));
  const pub = list.filter(v => v.published).length;
  $("libSub").textContent = `${list.length} videos · ${pub} published · ${list.length - pub} drafts`;
  $("lib").innerHTML = `<thead><tr><th></th><th>Title</th><th>Category</th><th>Source</th><th class="n">Length</th><th>Status</th><th class="n">Actions</th></tr></thead><tbody>` +
    list.map((v, i) => `<tr data-id="${esc(v.id)}">
      <td class="lib-thumb">${thumbOf(v) ? `<img src="${esc(thumbOf(v))}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">` : ""}</td>
      <td><b>${esc(v.title?.en || v.title?.ur)}</b>${v.title?.ur && v.title?.en ? `<div class="muted small" dir="rtl" lang="ur">${esc(v.title.ur)}</div>` : ""}</td>
      <td>${esc(catName(v.category))}</td>
      <td class="small">${v.type === "file" ? "Uploaded " + fmtSize(v.size) : v.type === "youtube" ? "YouTube" : "Vimeo"}</td>
      <td class="n">${fmtDur(v.duration)}</td>
      <td><span class="tag ${v.published ? "live" : "est"}">${v.published ? "Published" : "Draft"}</span></td>
      <td class="n actions">
        <button class="icon-btn sm" data-act="up" title="Move up" ${i === 0 ? "disabled" : ""}>↑</button>
        <button class="icon-btn sm" data-act="down" title="Move down" ${i === list.length - 1 ? "disabled" : ""}>↓</button>
        <button class="btn sm" data-act="toggle">${v.published ? "Unpublish" : "Publish"}</button>
        <button class="btn sm" data-act="edit">Edit</button>
        <button class="btn sm danger" data-act="del">${confirmDel === v.id ? "Confirm delete" : "Delete"}</button>
      </td></tr>`).join("") + "</tbody>";
  $("lib").querySelectorAll("button").forEach(b => { if (!state.storage) b.disabled = true; });
}

$("lib").addEventListener("click", async e => {
  const b = e.target.closest("button[data-act]"); if (!b) return;
  const id = b.closest("tr").dataset.id, v = state.videos.find(x => x.id === id), act = b.dataset.act;
  try {
    if (act === "edit") return openEditor(v);
    if (act === "del") {
      if (confirmDel !== id) { confirmDel = id; renderLib(); setTimeout(() => { if (confirmDel === id) { confirmDel = null; renderLib(); } }, 4000); return; }
      confirmDel = null; b.disabled = true; await api(`/api/admin/videos/${id}`, { method: "DELETE" });
    }
    if (act === "toggle") { b.disabled = true; await api("/api/admin/videos", { method: "POST", body: JSON.stringify({ ...v, published: !v.published }) }); }
    if (act === "up" || act === "down") {
      const ids = [...state.videos].sort((a, b) => (a.order ?? 1e9) - (b.order ?? 1e9)).map(x => x.id);
      const i = ids.indexOf(id), j = act === "up" ? i - 1 : i + 1;
      [ids[i], ids[j]] = [ids[j], ids[i]];
      await api("/api/admin/order", { method: "POST", body: JSON.stringify({ ids }) });
    }
    await load();
  } catch (err) { alertMsg(err.message); }
});
const alertMsg = m => { $("libSub").textContent = m; $("libSub").className = "status err"; setTimeout(() => { $("libSub").className = "muted"; renderLib(); }, 4000); };

// ---------- editor ----------
$("newBtn").addEventListener("click", () => openEditor(null));
$("edClose").addEventListener("click", closeEditor); $("cancelBtn").addEventListener("click", closeEditor);
$("typeSeg").addEventListener("click", e => { const b = e.target.closest("button[data-type]"); if (b && !editing) setType(b.dataset.type); });

function setType(t) {
  type = t;
  $("typeSeg").querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", b.dataset.type === t));
  $("drop").hidden = t !== "file" || !!editing; $("urlField").hidden = t === "file";
  $("urlLabel").textContent = t === "youtube" ? "YouTube link" : "Vimeo link";
  $("thumbRow").hidden = !(t === "file" && thumbBlob);
  $("saveBtn").textContent = editing ? "Save changes" : t === "file" ? "Upload and save" : "Save";
}

function openEditor(v) {
  editing = v; file = null; thumbBlob = null; duration = v?.duration || null;
  $("editor").hidden = false; $("edTitle").textContent = v ? "Edit video" : "Add video";
  $("edMsg").textContent = ""; $("prog").hidden = true; $("preview").hidden = true; $("dropIn").hidden = false; $("file").value = "";
  $("tEn").value = v?.title?.en || ""; $("tUr").value = v?.title?.ur || "";
  $("dEn").value = v?.desc?.en || ""; $("dUr").value = v?.desc?.ur || "";
  $("cat").value = v?.category || state.categories[0]?.key; $("lang").value = v?.lang || "ur"; $("subs").value = v?.subtitles || "";
  $("src").value = v?.source || ""; $("srcUrl").value = v?.sourceUrl || ""; $("pub").checked = v ? !!v.published : true;
  $("url").value = v && v.type !== "file" ? (v.type === "youtube" ? `https://www.youtube.com/watch?v=${v.ref}` : `https://vimeo.com/${v.ref}`) : "";
  $("typeSeg").classList.toggle("locked", !!v);
  setType(v?.type || "file");
  $("editor").scrollIntoView({ behavior: "smooth", block: "start" });
}
function closeEditor() { $("editor").hidden = true; editing = null; const p = $("preview"); if (p.src) URL.revokeObjectURL(p.src); p.removeAttribute("src"); }

// file pick / drop
$("file").addEventListener("change", () => pickFile($("file").files[0]));
const drop = $("drop");
["dragover", "dragenter"].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add("over"); }));
["dragleave", "drop"].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove("over"); }));
drop.addEventListener("drop", e => pickFile(e.dataTransfer.files[0]));

function pickFile(f) {
  if (!f) return;
  if (!/^video\/(mp4|webm|quicktime)$/.test(f.type)) return msg("Choose an MP4, WebM or MOV file.", true);
  if (f.size > 2 * 1024 ** 3) return msg("The file is larger than 2 GB.", true);
  file = f; msg("");
  if (!$("tEn").value) $("tEn").value = f.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ");
  const p = $("preview"); if (p.src) URL.revokeObjectURL(p.src);
  p.src = URL.createObjectURL(f); p.hidden = false; p.controls = true; $("dropIn").hidden = true;
  p.onloadedmetadata = () => { duration = p.duration; p.currentTime = Math.min(3, p.duration / 3); };
  p.onseeked = () => { if (!thumbBlob) grab(); };
}
$("retake").addEventListener("click", grab);
function grab() {
  const p = $("preview"); if (!p.videoWidth) return;
  const w = Math.min(1280, p.videoWidth), h = Math.round(w * p.videoHeight / p.videoWidth);
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  c.getContext("2d").drawImage(p, 0, 0, w, h);
  c.toBlob(b => { thumbBlob = b; $("thumbImg").src = URL.createObjectURL(b); $("thumbRow").hidden = false; }, "image/jpeg", 0.82);
}

function put(url, blob, onProgress) {
  return new Promise((resolve, reject) => {
    const x = new XMLHttpRequest(); x.open("PUT", url); x.setRequestHeader("Content-Type", blob.type);
    x.upload.onprogress = e => e.lengthComputable && onProgress && onProgress(e.loaded / e.total);
    x.onload = () => (x.status >= 200 && x.status < 300 ? resolve() : reject(new Error(`Upload failed (HTTP ${x.status}).`)));
    x.onerror = () => reject(new Error("Upload was blocked. Add the CORS policy to the R2 bucket (see README) and try again."));
    x.send(blob);
  });
}
const msg = (m, err) => { $("edMsg").textContent = m; $("edMsg").className = "status" + (err ? " err" : m ? " ok" : ""); };
const progress = (f, text) => { $("prog").hidden = false; $("progBar").style.width = Math.round(f * 100) + "%"; $("progText").textContent = text; };

$("edForm").addEventListener("submit", async e => {
  e.preventDefault();
  const body = {
    id: editing?.id, type, category: $("cat").value, lang: $("lang").value, subtitles: $("subs").value || undefined,
    title: { en: $("tEn").value, ur: $("tUr").value }, desc: { en: $("dEn").value, ur: $("dUr").value },
    source: $("src").value, sourceUrl: $("srcUrl").value, published: $("pub").checked, duration: duration || undefined,
  };
  if (!body.title.en.trim() && !body.title.ur.trim()) return msg("Add a title in English or Urdu.", true);
  $("saveBtn").disabled = true;
  try {
    if (type === "file" && !editing) {
      if (!file) throw new Error("Choose a video file first.");
      const up = await api("/api/admin/uploads", { method: "POST", body: JSON.stringify({ kind: "video", contentType: file.type, size: file.size }) });
      const t0 = Date.now();
      await put(up.url, file, f => { const mb = (file.size * f / 1e6).toFixed(0), sp = (file.size * f / 1e6) / ((Date.now() - t0) / 1000 || 1); progress(f, `Uploading ${mb} of ${(file.size / 1e6).toFixed(0)} MB · ${sp.toFixed(1)} MB/s`); });
      body.key = up.key;
    }
    if (type === "file" && thumbBlob) {
      const tu = await api("/api/admin/uploads", { method: "POST", body: JSON.stringify({ kind: "thumb", contentType: "image/jpeg", size: thumbBlob.size }) });
      await put(tu.url, thumbBlob); body.thumbKey = tu.key;
    }
    if (type !== "file") body.url = $("url").value;
    progress(1, "Saving…");
    await api("/api/admin/videos", { method: "POST", body: JSON.stringify(body) });
    msg("Saved."); await load(); setTimeout(closeEditor, 700);
  } catch (err) { msg(err.message, true);  }
  finally { $("saveBtn").disabled = false; }
});


// ---------- AI translation (title and description, either direction) ----------
document.querySelectorAll("[data-tr]").forEach(b => b.addEventListener("click", async () => {
  const [from, to, fl, tl] = b.dataset.tr.split(":");
  const text = $(from).value.trim(), m = $("trMsg");
  if (!text) { m.textContent = "Nothing to translate."; return; }
  b.disabled = true; m.textContent = "Translating…"; m.className = "muted small";
  try { const r = await api("/api/admin/ai/translate", { method: "POST", body: JSON.stringify({ text, from: fl, to: tl }) }); $(to).value = r.text; m.textContent = "Translated. Please check the wording."; }
  catch (e) { m.textContent = e.message; m.className = "status err small"; }
  finally { b.disabled = false; }
}));
