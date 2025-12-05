(function(){
  if (window.__smCRMAppLoaded) return;
  window.__smCRMAppLoaded = true;

  /* ===================== [F1] CONFIG ===================== */
  const ENDPOINT = "https://script.google.com/macros/s/AKfycby6scSZZhAnXS_eSY12m2gYu7X4-WzamqYsitKCyaPwTbU_MCUPjdte70E85HpK2w1A/exec";
  const ZOOM_ORIGIN = "https://applications.zoom.us";
  const ENDPOINT_LOG_MENSUAL = "https://script.google.com/macros/s/AKfycbzYjrCG36UnjyoZfgw_NOVAhgYn2kNQmKSQLigFMO9drgoPCVLgRyITN8OUyJDSrs4d/exec";

  // ZAPIER WEBHOOKS
  const ZAPIER_ANALISIS = "https://hooks.zapier.com/hooks/catch/6030955/ukh9o60/";
  const ZAPIER_ASISTIDO = "https://hooks.zapier.com/hooks/catch/6030955/ukh9mx9/";

  const qs = s => document.querySelector(s);
  const qsa = s => Array.from(document.querySelectorAll(s));

  /* ===================== [F2] UI HELPERS ===================== */
  function toast(msg, ms=1600){
  let t = qs('#sm-toast');

  // si no existe, lo creamos en el body
  if(!t){
    t = document.createElement("div");
    t.id = "sm-toast";
    document.body.appendChild(t);
  }

  // si está dentro del overlay/popup, lo movemos al body para que no se oculte al cerrar
  const ov = qs("#sm-overlay");
  if (ov && ov.contains(t)){
    document.body.appendChild(t);
  }

  t.textContent = msg;
  t.classList.add('is-show');

  if (t.__hideTimer) clearTimeout(t.__hideTimer);
  t.__hideTimer = setTimeout(()=> t.classList.remove('is-show'), ms);
}


  function getIDC(){
    const p = new URLSearchParams(location.search);
    return (p.get('idc') || "").trim();
  }

  function setLinkOrDash(el, url, label){
    if (!el) return;
    url = (url || "").trim();
    const txt = (label || "Abrir").trim();
    if(!url){
      el.textContent = "—";
      return;
    }
    el.innerHTML = `<a class="sm-btn sm-btn-secondary" href="${url}" target="_blank" rel="noopener noreferrer">${txt}</a>`;
  }

  function openPopup(){
    const o = qs("#sm-overlay");
    if(!o) return;
    o.style.display = "flex";
  }

    function closePopup(){
    const o = qs("#sm-overlay");
    if(!o) return;
    o.style.display = "none";

    // Presence: al cerrar popup consideramos “salió del trato”
    try{ presenceLeave_(); }catch(_){}
  }


  function showDealView(){
    qs("#sm-view-deal") && (qs("#sm-view-deal").style.display = "block");
    qs("#sm-view-survey") && (qs("#sm-view-survey").style.display = "none");
    qs("#sm-foot-deal") && (qs("#sm-foot-deal").style.display = "flex");
    qs("#sm-foot-survey") && (qs("#sm-foot-survey").style.display = "none");
  }

  function showSurveyView(){
    qs("#sm-view-deal") && (qs("#sm-view-deal").style.display = "none");
    qs("#sm-view-survey") && (qs("#sm-view-survey").style.display = "block");
    qs("#sm-foot-deal") && (qs("#sm-foot-deal").style.display = "none");
    qs("#sm-foot-survey") && (qs("#sm-foot-survey").style.display = "flex");
  }

  /* ===================== [F2.1] MODAL OMITIR ===================== */
  function openOmitModal(){
    const m = qs("#sm-omit-modal");
    const t = qs("#sm-omit-reason");
    if(!m) return;
    if(t) t.value = "";
    m.style.display = "flex";
    m.setAttribute("aria-hidden", "false");
    setTimeout(()=>{
      try{ t && t.focus(); }catch(_){}
    }, 0);
  }

  function closeOmitModal(){
    const m = qs("#sm-omit-modal");
    if(!m) return;
    m.style.display = "none";
    m.setAttribute("aria-hidden", "true");
  }

  /* ===================== [F2.2] MODAL BUSCAR ===================== */
  function openSearchModal(){
    const m = qs("#sm-search-modal");
    const inp = qs("#sm-search-q");
    const res = qs("#sm-search-results");
    if(!m) return;
    if (inp) inp.value = "";
    if (res) res.innerHTML = `<div class="sm-search-hint">Ingresa un <strong>IDPIPE</strong> o un <strong>Email</strong>.</div>`;
    m.style.display = "flex";
    m.setAttribute("aria-hidden", "false");
    setTimeout(()=>{
      try{ inp && inp.focus(); }catch(_){}
    }, 0);
  }

  function closeSearchModal(){
    const m = qs("#sm-search-modal");
    if(!m) return;
    m.style.display = "none";
    m.setAttribute("aria-hidden", "true");
  }

  /* ===================== [F2.3] MODAL LOG TRATO ===================== */
  function openLogModal(){
    const m = qs("#sm-log-modal");
    if(!m) return;
    m.style.display = "flex";
    m.setAttribute("aria-hidden", "false");
  }

  function closeLogModal(){
    const m = qs("#sm-log-modal");
    if(!m) return;
    m.style.display = "none";
    m.setAttribute("aria-hidden", "true");
  }

  function isEmail_(s){
    const v = String(s || "").trim();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }

  function lockBtn(btn, loadingText){
    if(!btn) return ()=>{};
    const prev = btn.textContent;
    btn.disabled = true;
    btn.setAttribute("aria-disabled", "true");
    btn.style.opacity = ".75";
    btn.style.pointerEvents = "none";
    if (loadingText) btn.textContent = loadingText;
    return ()=>{
      btn.disabled = false;
      btn.removeAttribute("aria-disabled");
      btn.style.opacity = "";
      btn.style.pointerEvents = "";
      btn.textContent = prev;
    };
  }

  /* ===================== [F2.4] SEND WEBHOOK (NO-CORS via FORM) ===================== */
  function sendWebhookViaForm(url, payload){
    const form = qs("#sm-post-form");
    if(!form) throw new Error("missing_post_form");
    form.setAttribute("action", url);
    form.setAttribute("method", "POST");
    form.innerHTML = "";
    Object.keys(payload || {}).forEach((k)=>{
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = k;
      input.value = (payload[k] == null) ? "" : String(payload[k]);
      form.appendChild(input);
    });
    form.submit();
  }

  function payloadFromDeal(){
    const d = state.deal || {};
    return {
      Nombre: d.NOMBRE || "",
      IDPIPE: d.IDPIPE || "",
      Email: d.EMAIL || "",
      Marca: d.MARCA || "",
      PDF: d.PDF || ""
    };
  }

  /* ===================== [F3] DEBUG UI ===================== */
  function ensureDebugUI(){
    if (qs("#sm-debug-wrap")) return;

    const wrap = document.createElement("div");
    wrap.id = "sm-debug-wrap";
    wrap.style.cssText = "position:fixed;right:14px;bottom:14px;z-index:999999;display:flex;flex-direction:column;gap:8px;font-family:Inter,system-ui,Arial;font-size:12px;";
    wrap.innerHTML = `
      <div style="display:flex;gap:8px;justify-content:flex-end;">
        <button id="sm-debug-toggle" style="border:1px solid rgba(0,0,0,.12);background:#fff;border-radius:999px;padding:8px 10px;cursor:pointer;box-shadow:0 10px 30px rgba(0,0,0,.08);">Debug</button>
        <button id="sm-debug-copy" style="border:1px solid rgba(0,0,0,.12);background:#fff;border-radius:999px;padding:8px 10px;cursor:pointer;box-shadow:0 10px 30px rgba(0,0,0,.08);display:none;">Copiar</button>
      </div>
      <div id="sm-debug-panel" style="display:none;width:360px;max-width:calc(100vw - 28px);max-height:40vh;overflow:auto;border:1px solid rgba(0,0,0,.12);background:#fff;border-radius:16px;padding:12px;box-shadow:0 12px 40px rgba(0,0,0,.12);">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
          <div style="font-weight:700;color:#111827;">Perf / Debug</div>
          <div id="sm-debug-badge" style="font-size:11px;padding:2px 8px;border-radius:999px;background:rgba(0,0,0,.06);color:#111827;">—</div>
        </div>
        <pre id="sm-debug-pre" style="white-space:pre-wrap;word-break:break-word;margin:0;color:#111827;line-height:1.35;">—</pre>
      </div>
    `;

    document.body.appendChild(wrap);

    qs("#sm-debug-toggle")?.addEventListener("click", ()=>{
      const p = qs("#sm-debug-panel");
      const c = qs("#sm-debug-copy");
      const show = p && p.style.display === "none";
      if (p) p.style.display = show ? "block" : "none";
      if (c) c.style.display = show ? "inline-flex" : "none";
    });

    qs("#sm-debug-copy")?.addEventListener("click", async ()=>{
      const txt = qs("#sm-debug-pre")?.textContent || "";
      if (!txt || txt === "—") return toast("Nada que copiar");
      try{
        await navigator.clipboard.writeText(txt);
        toast("Debug copiado");
      }catch(e){
        toast("No se pudo copiar");
      }
    });
  }

  function renderDebug(debug){
    ensureDebugUI();
    const pre = qs("#sm-debug-pre");
    const badge = qs("#sm-debug-badge");
    if (!pre || !badge) return;

    if (!debug){
      badge.textContent = "—";
      pre.textContent = "—";
      return;
    }

    badge.textContent = (debug.ms_total != null) ? (debug.ms_total + " ms") : "debug";

    const lines = [];
    lines.push(`ms_total: ${debug.ms_total ?? "—"}`);
    lines.push(`ms_lastRow: ${debug.ms_lastRow ?? "—"} | ms_readCols: ${debug.ms_readCols ?? "—"} | ms_scan: ${debug.ms_scan ?? "—"} | ms_readDealRow: ${debug.ms_readDealRow ?? "—"}`);
    lines.push(`lastRow: ${debug.lastRow ?? "—"} | n: ${debug.n ?? "—"} | sheet_getLastRow: ${debug.sheet_getLastRow ?? "—"}`);
    lines.push(`scanned: ${debug.scanned ?? "—"} | match_idc: ${debug.match_idc ?? "—"} | excluded_out: ${debug.excluded_out ?? "—"} | estado_ok: ${debug.estado_ok ?? "—"} | p1_found: ${debug.p1_found ?? "—"}`);
    lines.push(`bestRow: ${debug.bestRow ?? "—"} | detail: ${debug.detail ?? "—"}`);

    pre.textContent = lines.join("\n");
  }

  /* ===================== [F4] API ===================== */
  async function apiNext(idc, skipRids){
    const skip = Array.isArray(skipRids) ? skipRids.filter(Boolean).join(",") : "";
    const url = `${ENDPOINT}?mode=next&idc=${encodeURIComponent(idc)}&debug=1${skip ? `&skip=${encodeURIComponent(skip)}` : ""}&_=${Date.now()}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`next ${res.status}`);
    return res.json();
  }

  async function apiFinalize({ rid, obs, calls_text, survey, recorrido }){
  const body = new URLSearchParams({
    mode: "finalize",
    rid: String(rid || ""),
    obs: obs || "",
    calls_text: calls_text || "",
    survey: survey || "",
    recorrido: recorrido || ""   
  });
  const res = await fetch(ENDPOINT, { method:"POST", body });
  if (!res.ok) throw new Error(`finalize ${res.status}`);
  return res.json();
}


  async function apiLogMensual({ idc, idpipe, fecha_completa, recorrido, tiempo_total, tiempo_total_sec, final_code }){
  const body = new URLSearchParams({
    idc: idc || "",
    idpipe: idpipe || "",
    fecha_completa: fecha_completa || "",
    recorrido: recorrido || "",
    tiempo_total: tiempo_total || "",
    tiempo_total_sec: String(tiempo_total_sec ?? ""),
    final_code: final_code || ""
  });

  //  no preflight + no CORS issues (envío “fire and forget”)
  await fetch(ENDPOINT_LOG_MENSUAL, {
    method: "POST",
    mode: "no-cors",
    keepalive: true,
    body
  });

  // No podemos leer respuesta en no-cors (queda “opaque”), pero el POST sí llega.
  return { ok: true };
}



  async function apiOmit({ rid, motivo }){
    const body = new URLSearchParams({
      mode: "omit",
      rid: String(rid || ""),
      motivo: motivo || ""
    });
    const res = await fetch(ENDPOINT, { method:"POST", body });
    if (!res.ok) throw new Error(`omit ${res.status}`);
    return res.json();
  }

  async function apiDealByRid(rid){
    const url = `${ENDPOINT}?mode=deal&rid=${encodeURIComponent(String(rid||""))}&_=${Date.now()}`;
    const res = await fetch(url, { cache:"no-store" });
    if (!res.ok) throw new Error(`deal ${res.status}`);
    return res.json();
  }

  async function apiSearch(q){
    const url = `${ENDPOINT}?mode=search&q=${encodeURIComponent(String(q||""))}&_=${Date.now()}`;
    const res = await fetch(url, { cache:"no-store" });
    if (!res.ok) throw new Error(`search ${res.status}`);
    return res.json();
  }

  // ✅ ultra liviano: solo CH
  async function apiPayState(rid){
    const url = `${ENDPOINT}?mode=paystate&rid=${encodeURIComponent(String(rid||""))}&_=${Date.now()}`;
    const res = await fetch(url, { cache:"no-store" });
    if (!res.ok) throw new Error(`paystate ${res.status}`);
    return res.json();
  }

  async function apiPayStateVig(rid){
    const url = `${ENDPOINT}?mode=paystate_vig&rid=${encodeURIComponent(String(rid||""))}&_=${Date.now()}`;
    const res = await fetch(url, { cache:"no-store" });
    if (!res.ok) throw new Error(`paystate_vig ${res.status}`);
    return res.json();
  }

  // ✅ ultra liviano: solo BP
  async function apiLog(rid){
    const url = `${ENDPOINT}?mode=log&rid=${encodeURIComponent(String(rid||""))}&_=${Date.now()}`;
    const res = await fetch(url, { cache:"no-store" });
    if (!res.ok) throw new Error(`log ${res.status}`);
    return res.json();
  }

    async function apiPresence({ action, sid, rid, prev_rid }){
    const body = new URLSearchParams({
      mode: "presence",
      action: String(action || ""),
      sid: String(sid || ""),
      rid: String(rid || ""),
      prev_rid: String(prev_rid || "")
    });

    const res = await fetch(ENDPOINT, { method:"POST", body });
    if (!res.ok) throw new Error(`presence ${res.status}`);
    return res.json();
  }


  /* ===================== [F4.9] TRACKING ESTADO ===================== */
  function renderTracking(estadoRaw){
    const box = qs("#sm-tracking");
    if(!box) return;

    const raw = String(estadoRaw || "").trim();
    const est = raw.toUpperCase();

    // Solo se muestra si el estado está dentro de estos
    const allowed = new Set([
      "",
      "AGENDADO",
      "PEND. PAGO REGISTRO",
      "AGENDADO PAGO REGISTRO",
      "REGISTRO PAGADO",
      "PEND. PAGO VIGILANCIA",
      "AGENDADO PAGO VIGILANCIA",
      "VIGILANCIA PAGADA"
    ]);

    if(!allowed.has(est)){
      box.style.display = "none";
      box.innerHTML = "";
      return;
    }

    // Determina etapa actual (1..5)
    let active = 0;
    if (est === "" || est === "AGENDADO") active = 1;
    else if (est === "PEND. PAGO REGISTRO" || est === "AGENDADO PAGO REGISTRO") active = 2;
    else if (est === "REGISTRO PAGADO") active = 3;
    else if (est === "PEND. PAGO VIGILANCIA" || est === "AGENDADO PAGO VIGILANCIA") active = 4;
    else if (est === "VIGILANCIA PAGADA") active = 5;

    // Labels: siempre la primera opción, excepto si el estado es "AGENDADO ..." (ahí muestra esa)
    const label1 = (est === "AGENDADO") ? "AGENDADO" : "NUEVO CONTACTO";
    const label2 = (est === "AGENDADO PAGO REGISTRO") ? "AGENDADO PAGO REGISTRO" : "PEND. PAGO REGISTRO";
    const label3 = "REGISTRO PAGADO";
    const label4 = (est === "AGENDADO PAGO VIGILANCIA") ? "AGENDADO PAGO VIGILANCIA" : "PEND. PAGO VIGILANCIA";
    const label5 = "VIGILANCIA PAGADA";

    const labels = [label1, label2, label3, label4, label5];

    box.style.display = "block";
    box.innerHTML = `
      <div class="sm-track">
        ${labels.map((t, i) => {
          const idx = i + 1;
          const cls = (idx < active) ? "is-on" : (idx === active ? "is-on is-active" : "");
          return `
            <div class="sm-track-step ${cls}">
              <div class="sm-track-dot"></div>
              <div class="sm-track-label">${t}</div>
            </div>
          `;
        }).join("")}
      </div>
    `;
  }

  /* ===================== [F5] STATE + RENDER ===================== */
  const state = {
    deal: null,
    calls: [],
    pending: null,
    zpReady: false,
    skipRids: [],
    __omitBusy: false,
    __saleBusy: false,
    __searchBusy: false,
    __payBusy: false,
    __payVigBusy: false,
    __logBusy: false,
    __callBusy: false,
    __callInProgress: false,
    __callTry: 0,
    __queuedCall: null,
    __callWatchdog: null,
    __preloadRid: null,
    __preloadPromise: null,
    __preloadResult: null,
    __preloadTs: 0,
    __presenceSid: null,
    __presenceRid: null,
    __presenceTimer: null

  };

    function getPresenceSid_(){
    try{
      const k = "sm_presence_sid_v1";
      let sid = sessionStorage.getItem(k);
      if (!sid){
        sid = "sid_" + Math.random().toString(16).slice(2) + "_" + Date.now();
        sessionStorage.setItem(k, sid);
      }
      return sid;
    }catch(_){
      // fallback
      return "sid_" + Math.random().toString(16).slice(2) + "_" + Date.now();
    }
  }

  function presenceStartHeartbeat_(){
    if (state.__presenceTimer) return;

    state.__presenceTimer = setInterval(async ()=>{
      const sid = state.__presenceSid;
      const rid = state.__presenceRid;
      if (!sid || !rid) return;

      try{
        await apiPresence({ action:"ping", sid, rid });
      }catch(_){}
    }, 120000); // 2 min
  }

  function presenceStopHeartbeat_(){
    if (state.__presenceTimer){
      clearInterval(state.__presenceTimer);
      state.__presenceTimer = null;
    }
  }

  async function presenceEnterOrSwitch_(nextRid, prevRid){
    const sid = getPresenceSid_();
    state.__presenceSid = sid;
    state.__presenceRid = nextRid;

    try{
      if (prevRid && prevRid !== nextRid){
        await apiPresence({ action:"switch", sid, rid: nextRid, prev_rid: prevRid });
      } else {
        await apiPresence({ action:"enter", sid, rid: nextRid });
      }
    }catch(_){}

    presenceStartHeartbeat_();
  }

  async function presenceLeave_(){
    const sid = state.__presenceSid || getPresenceSid_();
    const rid = state.__presenceRid;

    presenceStopHeartbeat_();

    state.__presenceRid = null;

    if (!rid) return;

    try{
      await apiPresence({ action:"leave", sid, rid, prev_rid: rid });
    }catch(_){}
  }


  const __smCLFmt = new Intl.DateTimeFormat("es-CL", {
    timeZone: "America/Santiago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });

  function fmtChile(iso){
    try{
      const parts = __smCLFmt.formatToParts(new Date(iso));
      const m = {};
      parts.forEach(p => { if (p.type !== "literal") m[p.type] = p.value; });
      return `${m.day}-${m.month}-${m.year} ${m.hour}:${m.minute}:${m.second}`;
    }catch(_){
      return String(iso || "");
    }
  }

  function formatMSS(totalSec){
    const s = Math.max(0, Number(totalSec || 0) | 0);
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${String(r).padStart(2,"0")}`;
  }

  function renderCalls(){
    const box = qs("#sm-calls");
    if(!box) return;
    if(!state.calls.length){
      box.textContent = "—";
      return;
    }
    box.innerHTML = state.calls.map(c => `
      <div class="sm-call-item">
        <div><strong>${c.number}</strong></div>
        <div style="color:#6b7280;font-size:12px;">Inicio: ${fmtChile(c.start_iso)}</div>
        <div style="color:#6b7280;font-size:12px;">Fin: ${fmtChile(c.end_iso)}</div>
        <div style="color:#6b7280;font-size:12px;">Duración: ${c.duration_sec}s</div>
      </div>
    `).join("");
  }

    function smScrollHistoryBottom(){
    const el = qs("#sm-history");
    if(!el) return;
    requestAnimationFrame(() => {
      if (el.scrollHeight > el.clientHeight) el.scrollTop = el.scrollHeight;
    });
  }

  function renderHistorialBT(txt){
  const box = qs("#sm-history");
  if(!box) return;

  const t = String(txt || "").trim();
  if(!t){
    box.textContent = "—";
    smScrollHistoryBottom();
    return;
  }

  // separa por líneas y dibuja zebra
  const lines = t.split(/\r?\n/).map(s => s.trim()).filter(Boolean);

  box.innerHTML = `
    <div class="sm-history-list">
      ${lines.map((line)=> `<div class="sm-history-line">${escapeHtml(line)}</div>`).join("")}
    </div>
  `;

  smScrollHistoryBottom();
}

// helper simple para no romper el HTML si viene algo raro
function escapeHtml(s){
  return String(s)
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#39;");
}



function dealToUI(d){
  const prevRid = state.deal?.RID || null;

  state.deal = d;
  state.calls = [];
  state.pending = null;
  state.__preloadRid = null;
  state.__preloadPromise = null;
  state.__preloadResult = null;
  state.__preloadTs = 0;

  // Presence: marca el trato actual (B=true) y baja el anterior si corresponde
  try{
    if (d?.RID) presenceEnterOrSwitch_(d.RID, prevRid);
  }catch(_){}

  renderCalls();

    showDealView();
    renderTracking(d.ESTADO);
    renderHistorialBT(d.LOG_BT || d.BT || "");

    // Reset encuesta para cada trato
    try{ window.__smTypeformMinReset && window.__smTypeformMinReset(); }catch(_){}

    const setText = (k) => {
      const el = qs("#sm-"+k);
      if (el) el.textContent = (d[k] || "—");
    };

    [
      "CONSULTOR","NOMBRE","IDPIPE","EMAIL","MARCA","CLASES","CANT_CLASES",
      "OPCION","MONTO_BASE","DESCUENTO","TIPO","ESTADO","ULTIMO_CONTACTO",
      "ESTADO_PAGO","ESTADO_PAGO_VIGILANCIA"
    ].forEach(setText);

    setLinkOrDash(qs("#sm-PDF"), d.PDF, "PDF");
    setLinkOrDash(qs("#sm-URL_FICHA"), d.URL_FICHA, "FICHA REGISTRO");
    setLinkOrDash(qs("#sm-URL_AGENDA"), d.URL_AGENDA, "AGENDA");
    setLinkOrDash(qs("#sm-URL_CONTACTO_FALLIDO"), d.URL_CONTACTO_FALLIDO, "CONTACTO FALLIDO");
    setLinkOrDash(qs("#sm-URL_FICHA_VIGILANCIA"), d.URL_FICHA_VIGILANCIA, "FICHA VIGILANCIA");

    const phone = qs("#sm-phone");
    const obs = qs("#sm-obs");
    if(phone) phone.value = d.TELEFONO || "";
    if(obs) obs.value = d.OBS || "";

    qsa('input[name="sm-survey"]').forEach(r => r.checked = false);

    const sn = qs("#sm-survey-note");
    if(sn) sn.value = "";

    // Limpia shimmer por si quedó encendido
    const shimmer = qs("#sm-pay-shimmer");
    if (shimmer) shimmer.classList.remove("is-loading");
    const payVal = qs("#sm-ESTADO_PAGO");
    if (payVal) payVal.style.display = "";

    const shimmerV = qs("#sm-payv-shimmer");
    if (shimmerV) shimmerV.classList.remove("is-loading");
    const payVVal = qs("#sm-ESTADO_PAGO_VIGILANCIA");
    if (payVVal) payVVal.style.display = "";
  }

  function callsToText(){
    if(!state.calls.length) return "";
    return state.calls.map(c => {
      const s = fmtChile(c.start_iso);
      const e = fmtChile(c.end_iso);
      const mss = formatMSS(c.duration_sec);
      return `${s} / ${e} = ${mss}`;
    }).join("\n");
  }

  /* ===================== [F5.x] SURVEY BRIDGE (TYPEFORM) ===================== */
  function totalCallsSec_(){
    return (state.calls || []).reduce((acc, c)=> acc + (Number(c?.duration_sec) || 0), 0);
  }

  function totalCallsMSS_(){
    return formatMSS(totalCallsSec_());
  }

  // Contexto para el webhook del componente
  window.__smSurveyGetContext = function(){
    return {
      idc: getIDC(),
      idpipe: (state.deal?.IDPIPE || ""),
      total_calls_sec: totalCallsSec_(),
      total_calls_mss: totalCallsMSS_()
    };
  };

  // Esta función la llama el componente al apretar "Aceptar y enviar"
  window.__smSurveyFinalizeFromTypeform = async function(payload){
  // payload esperado: { numero_pregunta, detalle, recorrido }
  const startedAt = Date.now();

  // 1) Asegura pending (como antes)
  if(!state.pending?.rid){
    if(!state.deal?.RID) {
      toast("Sin trato");
      return { ok:false, error:"no_deal" };
    }
    const obs = (qs("#sm-obs")?.value || "").trim();
    const calls_text = callsToText();
    state.pending = { rid: state.deal.RID, obs, calls_text };
  }

  const rid = state.pending.rid;
  const idc = getIDC();


  // 2) Usa preload ya corriendo (si existe) o crea uno ahora
const skipNow = Array.isArray(state.skipRids) ? state.skipRids.slice() : [];
if (rid && !skipNow.includes(rid)) skipNow.push(rid);

const nextPromise =
  (state.__preloadPromise && state.__preloadRid === rid)
    ? state.__preloadPromise
    : (idc ? apiNext(idc, skipNow) : Promise.resolve(null))
        .catch(err => ({ ok:false, error:String(err?.message || err), __preloadFail:true }));

    startDealLoader();

  try{
    // 3) Guardado (lento)
    const data = await apiFinalize({
      rid,
      obs: state.pending.obs || "",
      calls_text: state.pending.calls_text || "",
      survey: String(payload?.numero_pregunta || ""),
      recorrido: String(payload?.recorrido || "")
    });

    if(!data?.ok) throw new Error(data?.error || "bad_finalize");

    // 4) Log mensual (no bloquea fuerte, pero lo dejamos aquí)
    try{
      await apiLogMensual({
        idc,
        idpipe: (state.deal?.IDPIPE || ""),
        fecha_completa: fmtChile(new Date().toISOString()),
        recorrido: String(payload?.recorrido || ""),
        tiempo_total: totalCallsMSS_(),
        tiempo_total_sec: totalCallsSec_(),
        final_code: String(payload?.numero_pregunta || "")
      });
    }catch(err){
      console.error("[SM] log mensual error", err);
    }

    // 5) Marca RID como “saltado” apenas guardó
    if (!state.skipRids.includes(rid)) state.skipRids.push(rid);
    state.pending = null;

    // 6) Si el preload ya llegó, lo usamos (si no, lo esperamos ahora)
    const nextData = await nextPromise;

    //  consume/limpia precarga
    state.__preloadRid = null;
    state.__preloadPromise = null;
    state.__preloadResult = null;
    state.__preloadTs = 0;


    if (nextData?.ok && nextData.deal){
      // opcional: debug panel como loadDeal()
      try{ renderDebug(nextData?.debug); }catch(_){}
      dealToUI(nextData.deal);
      openPopup();
    } else {
  toast("No quedan llamadas disponibles");
  closePopup();
  showDealView();
  try{ window.__smTypeformMinReset && window.__smTypeformMinReset(); }catch(_){}
}



    return { ok:true, ms: Date.now() - startedAt };
  }catch(e){
    console.error("[SM] finalize(typeform) error", e);
    toast("Error al guardar");
    return { ok:false, error:String(e?.message || e) };
  }finally{
    finishDealLoader();
  }
};



  /* ===================== [F5.1] LOADER OVERLAY GLOBAL ===================== */
  function startDealLoader(){
    const ov = qs("#sm-loader-overlay");
    const bar = qs("#sm-loader-bar");
    const pct = qs("#sm-loader-pct");
    const track = bar ? bar.parentElement : null;
    if(!ov || !bar || !track) return;

    ov.style.display = "flex";
    ov.setAttribute("aria-hidden", "false");

    if (window.__smLoaderRAF) cancelAnimationFrame(window.__smLoaderRAF);
    window.__smLoaderRAF = null;

    bar.classList.remove("is-loading");
    bar.style.transition = "";
    bar.style.width = "0%";
    void bar.offsetWidth;

    if (pct) pct.textContent = "0%";

    bar.classList.add("is-loading");

    const t0 = performance.now();
    const DURATION_MS = 16000;

    const tick = ()=>{
      if (ov.style.display !== "flex") return;

      let val = 0;
      try{
        const tw = track.getBoundingClientRect().width || 0;
        const bw = bar.getBoundingClientRect().width || 0;
        if (tw > 0){
          val = Math.round((bw / tw) * 100);
          val = Math.max(0, Math.min(95, val));
        }else{
          const t = performance.now() - t0;
          val = Math.round(Math.min(95, (t / DURATION_MS) * 95));
        }
      }catch(_){
        const t = performance.now() - t0;
        val = Math.round(Math.min(95, (t / DURATION_MS) * 95));
      }

      if (pct) pct.textContent = val + "%";
      window.__smLoaderRAF = requestAnimationFrame(tick);
    };

    window.__smLoaderRAF = requestAnimationFrame(tick);
  }

  function finishDealLoader(){
    const ov = qs("#sm-loader-overlay");
    const bar = qs("#sm-loader-bar");
    const pct = qs("#sm-loader-pct");
    if(!ov || !bar) return;

    if (window.__smLoaderRAF) cancelAnimationFrame(window.__smLoaderRAF);
    window.__smLoaderRAF = null;

    bar.classList.remove("is-loading");
    bar.style.transition = "width 220ms ease-out";
    bar.style.width = "100%";

    if (pct) pct.textContent = "100%";

    setTimeout(()=>{
      ov.style.display = "none";
      ov.setAttribute("aria-hidden", "true");
      bar.style.transition = "";
      bar.style.width = "0%";
      if (pct) pct.textContent = "0%";
    }, 260);
  }

  async function loadDeal(opts){
    const o = opts || {};
    const resetSkip = !!o.resetSkip;
    const idc = getIDC();
    if(!idc){
      toast("Falta ?idc");
      return;
    }

    if (resetSkip) state.skipRids = [];
    renderDebug(null);
    startDealLoader();

    try{
      const data = await apiNext(idc, state.skipRids);
      renderDebug(data?.debug);
      if(!data?.ok) throw new Error(data?.error || "bad_next");
      dealToUI(data.deal);
      openPopup();
    }catch(e){
  console.error("[SM] next error", e);

  const msg = String(e?.message || e || "");
  if (msg.includes("no_deals")){
    closePopup();
    showDealView();
    try{ window.__smTypeformMinReset && window.__smTypeformMinReset(); }catch(_){}
    toast("No quedan llamadas disponible");
    return;
  }

  toast("No se pudo cargar");
}finally{
  finishDealLoader();
}

  }

  async function loadDealByRid(rid){
    startDealLoader();
    try{
      const data = await apiDealByRid(rid);
      if(!data?.ok) throw new Error(data?.error || "bad_deal");
      dealToUI(data.deal);
      openPopup();
    }catch(e){
      console.error("[SM] deal error", e);
      toast("No se pudo cargar");
    }finally{
      finishDealLoader();
    }
  }

  /* ===================== [F6] ZOOM PHONE ===================== */
  function initZoom(){
    const iframe = qs("#sm-zoomphone-iframe");
    if(!iframe) return;

    function setZoomSrc_(){
      const originDomain = encodeURIComponent(window.location.origin);
      iframe.src = `${ZOOM_ORIGIN}/integration/phone/embeddablephone/home?originDomain=${originDomain}&_=${Date.now()}`;
    }

    function initConfig_(){
      try{
        iframe.contentWindow && iframe.contentWindow.postMessage({
          type: "zp-init-config",
          data: {
            enableSavingLog: false,
            enableAutoLog: false,
            enableContactSearching: false,
            enableContactMatching: false
          }
        }, ZOOM_ORIGIN);
      }catch(_){}
    }

    function setCallBtnBusy_(on, text){
      const btn = qs("#sm-btn-llamar");
      if(!btn) return;
      btn.disabled = !!on;
      btn.setAttribute("aria-disabled", on ? "true" : "false");
      btn.style.opacity = on ? ".7" : "";
      btn.style.pointerEvents = on ? "none" : "";
      if(text) btn.textContent = text;
      if(!on) btn.textContent = "Llamar";
    }

    function clearWatchdog_(){
      if(state.__callWatchdog){
        clearTimeout(state.__callWatchdog);
        state.__callWatchdog = null;
      }
    }

function rebuildZoom_(reason){
  // “reinicia” el embeddable sin recargar navegador
  state.zpReady = false;
  window.__smConnTs = null;
  window.__smRingTs = null;

  // corta cualquier watchdog anterior
  clearWatchdog_();

  try{ setCallBtnBusy_(true, "Conectando..."); }catch(_){}

  // vuelve a cargar el iframe (por si acaso)
  try{ setZoomSrc_(); }catch(_){}

  // watchdog: si NO llega zp-ready en 6.5s, libera y abre pestaña de login
  state.__callWatchdog = setTimeout(()=>{
    if (state.zpReady) return;

    // limpia estado de llamada
    state.__queuedCall = null;
    state.__callBusy = false;
    state.__callInProgress = false;
    state.__callTry = 0;

    setCallBtnBusy_(false);

    // construye la misma URL que usa el iframe
    var iframe = document.querySelector("#sm-zoomphone-iframe");
    var url = iframe && iframe.src;

    if (!url){
      try{
        var originDomain = encodeURIComponent(window.location.origin);
        url = ZOOM_ORIGIN + "/integration/phone/embeddablephone/home?originDomain=" + originDomain + "&_=" + Date.now();
      }catch(_){}
    }

if (url){
  try{
    window.open(url, "_blank", "noopener,noreferrer");
    toast("Abre la pestaña de Zoom, inicia sesión y luego vuelve a intentar llamar.", 7000);
  }catch(e){
    // si el navegador bloquea el popup, al menos deja el mensaje (más tiempo)
    toast("Zoom no conectó. Permite la ventana emergente para iniciar sesión en Zoom.", 7000);
  }
}else{
  toast("Zoom no conectó. Intenta de nuevo o recarga.");
}


  }, 6500);
}



    // expone make call (siempre)
    window.__smMakeZoomCall = (number)=>{
      try{
        iframe.contentWindow && iframe.contentWindow.postMessage(
          { type:"zp-make-call", data:{ number } },
          ZOOM_ORIGIN
        );
      }catch(_){}
    };

    // listener UNA sola vez (aunque “rebuild” cambie src)
    if(!window.__smZpListenerInstalled){
      window.__smZpListenerInstalled = true;

      window.addEventListener("message", (e)=>{
        if(e.origin !== ZOOM_ORIGIN) return;
        const msg = e.data || {};
        if(!msg.type) return;

        if(msg.type === "zp-ready"){
  clearWatchdog_(); //  suelta cualquier watchdog de reconexión

  state.zpReady = true;
  initConfig_();

  // si había llamada en cola, dispara 1 sola vez
  if(state.__queuedCall){
    const n = state.__queuedCall;
    state.__queuedCall = null;

    setTimeout(()=> window.__smMakeZoomCall && window.__smMakeZoomCall(n), 250);
  }
  return;
}


        if(msg.type === "zp-call-ringing-event"){
          window.__smRingTs = window.__smRingTs || new Date();
          state.__callInProgress = true;
          clearWatchdog_();
          return;
        }

        if(msg.type === "zp-call-connected-event"){
          window.__smConnTs = new Date();
          state.__callInProgress = true;
          clearWatchdog_();
          return;
        }

        if(msg.type === "zp-call-ended-event"){
          const end = new Date();
          const start = window.__smConnTs || window.__smRingTs;
          window.__smConnTs = null;
          window.__smRingTs = null;

          // guarda log llamada (igual que antes)
          const phone = (qs("#sm-phone")?.value || "").trim();
          if(start && phone && state.deal){
            const dur = Math.max(0, Math.round((end.getTime() - start.getTime())/1000));
            state.calls.push({
              number: phone,
              start_iso: start.toISOString(),
              end_iso: end.toISOString(),
              duration_sec: dur
            });
            renderCalls();
          }

          // libera lock (1 click = 1 llamada)
          state.__callInProgress = false;
          state.__callBusy = false;
          state.__callTry = 0;
          clearWatchdog_();
          setCallBtnBusy_(false);

          return;
        }
      });
    }

    // primera carga
    setZoomSrc_();

    // expone helpers para doCall()
    window.__smZoomRebuild = rebuildZoom_;
    window.__smZoomSetCallBtnBusy = setCallBtnBusy_;
    window.__smZoomClearWatchdog = clearWatchdog_;
  }

  function doCall(){
    const num = (qs("#sm-phone")?.value || "").trim();
    if(!num){ toast("Falta teléfono"); return; }

    // 1 click = 1 llamada (no se acumulan)
    if(state.__callBusy || state.__callInProgress){
      toast("Ya hay una llamada en curso");
      return;
    }

    state.__callBusy = true;
    state.__callTry = 0;

    // deshabilita botón inmediatamente
    window.__smZoomSetCallBtnBusy && window.__smZoomSetCallBtnBusy(true, "Llamando...");

    const attempt = ()=>{
      state.__callTry++;

      // watchdog: si en X ms no hay ringing/connected, reinicia iframe y reintenta (máx 2)
      window.__smZoomClearWatchdog && window.__smZoomClearWatchdog();
      state.__callWatchdog = setTimeout(()=>{
        if(state.__callInProgress) return;

        if(state.__callTry >= 2){
          state.__callBusy = false;
          window.__smZoomSetCallBtnBusy && window.__smZoomSetCallBtnBusy(false);
          toast("Zoom no respondió. Recarga la página si sigue.");
          return;
        }

        // reintento: reconstruye iframe y deja llamada en cola
        state.__queuedCall = num;
        toast("Reconectando Zoom...");
        window.__smZoomRebuild && window.__smZoomRebuild("watchdog");
      }, 4500);

      if(state.zpReady){
        window.__smMakeZoomCall && window.__smMakeZoomCall(num);
      }else{
        // no está listo: cola + rebuild
        state.__queuedCall = num;
        toast("Conectando Zoom...");
        window.__smZoomRebuild && window.__smZoomRebuild("not_ready");
      }
    };

    attempt();
  }

  /* ===================== [F6.1] REFRESH ESTADO PAGO (SHIMMER) ===================== */
  async function doRefreshPayState(){
    if(!state.deal?.RID){
      toast("Sin trato");
      return;
    }
    if (state.__payBusy) return;
    state.__payBusy = true;

    const rid = state.deal.RID;
    const btn = qs("#sm-btn-refresh-pay");
    const val = qs("#sm-ESTADO_PAGO");
    const sh = qs("#sm-pay-shimmer");

    if (btn){
      btn.disabled = true;
      btn.setAttribute("aria-disabled","true");
      btn.style.opacity = ".7";
      btn.style.pointerEvents = "none";
    }
    if (sh) sh.classList.add("is-loading");
    if (val) val.style.display = "none";

    try{
      const data = await apiPayState(rid);
      if(!data?.ok) throw new Error(data?.error || "bad_paystate");
      const next = String(data.value || "").trim();
      if (val){
        val.textContent = next || "—";
        val.style.display = "inline";
      }
      // también actualiza el estado en el objeto, por si lo usas después
      if (state.deal) state.deal.ESTADO_PAGO = next;
    }catch(e){
      console.error("[SM] paystate error", e);
      if (val) val.style.display = "inline";
      toast("No se pudo actualizar");
    }finally{
      if (sh) sh.classList.remove("is-loading");
      if (btn){
        btn.disabled = false;
        btn.removeAttribute("aria-disabled");
        btn.style.opacity = "";
        btn.style.pointerEvents = "";
      }
      state.__payBusy = false;
    }
  }

  async function doRefreshPayStateVig(){
    if(!state.deal?.RID){
      toast("Sin trato");
      return;
    }
    if (state.__payVigBusy) return;
    state.__payVigBusy = true;

    const rid = state.deal.RID;
    const btn = qs("#sm-btn-refresh-payv");
    const val = qs("#sm-ESTADO_PAGO_VIGILANCIA");
    const sh = qs("#sm-payv-shimmer");

    if (btn){
      btn.disabled = true;
      btn.setAttribute("aria-disabled","true");
      btn.style.opacity = ".7";
      btn.style.pointerEvents = "none";
    }
    if (sh) sh.classList.add("is-loading");
    if (val) val.style.display = "none";

    try{
      const data = await apiPayStateVig(rid);
      if(!data?.ok) throw new Error(data?.error || "bad_paystate_vig");
      const next = String(data.value || "").trim();
      if (val){
        val.textContent = next || "—";
        val.style.display = "inline";
      }
      if (state.deal) state.deal.ESTADO_PAGO_VIGILANCIA = next;
    }catch(e){
      console.error("[SM] paystate_vig error", e);
      if (val) val.style.display = "inline";
      toast("No se pudo actualizar");
    }finally{
      if (sh) sh.classList.remove("is-loading");
      if (btn){
        btn.disabled = false;
        btn.removeAttribute("aria-disabled");
        btn.style.opacity = "";
        btn.style.pointerEvents = "";
      }
      state.__payVigBusy = false;
    }
  }

  /* ===================== [F6.2] LOG TRATO ===================== */
  async function doOpenLog(){
    if(!state.deal?.RID){
      toast("Sin trato");
      return;
    }
    if (state.__logBusy) return;
    state.__logBusy = true;

    const pre = qs("#sm-log-text");
    const sh = qs("#sm-log-shimmer");
    if (pre) pre.textContent = "";
    if (sh) sh.classList.add("is-loading");

    openLogModal();

    try{
      const data = await apiLog(state.deal.RID);
      if(!data?.ok) throw new Error(data?.error || "bad_log");
      const txt = String(data.value || "").trim();
      if (sh) sh.classList.remove("is-loading");
      if (pre) pre.textContent = txt || "—";
    }catch(e){
      console.error("[SM] log error", e);
      if (sh) sh.classList.remove("is-loading");
      if (pre) pre.textContent = "No se pudo cargar el log.";
      toast("No se pudo cargar");
    }finally{
      state.__logBusy = false;
    }
  }
  /* ===================== [F6.9] PRE CARGA ===================== */

  function preloadNextDealForCurrent(){
  const idc = getIDC();
  const rid = state.deal?.RID;
  if(!idc || !rid) return;

  // si ya está precargando para ESTE rid, no hagas nada
  if(state.__preloadRid === rid && state.__preloadPromise) return;

  const skipNow = Array.isArray(state.skipRids) ? state.skipRids.slice() : [];
  if(rid && !skipNow.includes(rid)) skipNow.push(rid);

  state.__preloadRid = rid;
  state.__preloadTs = Date.now();
  state.__preloadResult = null;

  state.__preloadPromise = apiNext(idc, skipNow)
    .then(d => {
      state.__preloadResult = d;
      return d;
    })
    .catch(err => {
      const o = { ok:false, error:String(err?.message || err), __preloadFail:true };
      state.__preloadResult = o;
      return o;
    });
}

  
  /* ===================== [F7] FLOW ACTIONS ===================== */
  function doAcceptAndContinue(){
    if(!state.deal?.RID){
      toast("Sin RID");
      return;
    }
    const obs = (qs("#sm-obs")?.value || "").trim();
    const calls_text = callsToText();
    state.pending = { rid: state.deal.RID, obs, calls_text };

    preloadNextDealForCurrent();
    
    showSurveyView();
  }

  async function doSendSurvey(){
    if(!state.pending?.rid){
      toast("Falta data");
      return;
    }
    const picked = qsa('input[name="sm-survey"]').find(r => r.checked);
    const survey = picked ? picked.value : "";
    const note = (qs("#sm-survey-note")?.value || "").trim();

    try{
      const data = await apiFinalize({
        rid: state.pending.rid,
        obs: state.pending.obs || "",
        calls_text: state.pending.calls_text || "",
        survey,
        note
      });
      if(!data?.ok) throw new Error(data?.error || "bad_finalize");
      if (!state.skipRids.includes(state.pending.rid)) state.skipRids.push(state.pending.rid);
      state.pending = null;
      await loadDeal();
    }catch(e){
      console.error("[SM] finalize error", e);
      toast("Error al guardar");
    }
  }

  function doBack(){ showDealView(); }

  function doOmit(){
    if(!state.deal?.RID){
      toast("Sin RID");
      return;
    }
    openOmitModal();
  }

  async function doConfirmOmit(){
    if(!state.deal?.RID){
      toast("Sin RID");
      return;
    }
    if (state.__omitBusy) return;
    state.__omitBusy = true;

    const btn = qs("#sm-btn-omit-confirm");
    const unlock = lockBtn(btn, "Enviando...");

    const motivo = (qs("#sm-omit-reason")?.value || "").trim();
    if(!motivo){
      toast("Escribe el motivo");
      state.__omitBusy = false;
      unlock();
      return;
    }

    try{
      const data = await apiOmit({ rid: state.deal.RID, motivo });
      if(!data?.ok) throw new Error(data?.error || "bad_omit");
      if(state.deal?.RID && !state.skipRids.includes(state.deal.RID)){
        state.skipRids.push(state.deal.RID);
      }
      closeOmitModal();
      state.__omitBusy = false;
      unlock();
      await loadDeal();
    }catch(e){
      console.error("[SM] omit error", e);
      toast("Error al omitir");
      state.__omitBusy = false;
      unlock();
    }
  }

  /* ===================== [F7.1] BUSCAR ===================== */
  function renderSearchResultsEmail(list){
    const box = qs("#sm-search-results");
    if(!box) return;

    if(!Array.isArray(list) || !list.length){
      box.innerHTML = `<div class="sm-search-empty">No encontré tratos activos (Q vacío) para ese email.</div>`;
      return;
    }

    box.innerHTML = `
      <div class="sm-search-meta">Resultados: <strong>${list.length}</strong></div>
      <div class="sm-search-list">
        ${list.map(item => `
          <div class="sm-search-item">
            <div class="sm-search-left">
              <div class="sm-search-idpipe">${(item.IDPIPE || "—")}</div>
              <div class="sm-search-marca">${(item.MARCA || "—")}</div>
            </div>
            <button class="sm-btn sm-btn-primary sm-btn-xs" type="button" data-pick-rid="${item.RID}">Ver trato</button>
          </div>
        `).join("")}
      </div>
    `;
  }

  async function doSearch(){
    if(state.__searchBusy) return;

    const q = (qs("#sm-search-q")?.value || "").trim();
    if(!q) return toast("Ingresa un IDPIPE o Email");

    const btn = qs("#sm-btn-search-run");
    const unlock = lockBtn(btn, "Buscando...");

    state.__searchBusy = true;
    startDealLoader();

    try{
      const isEmail = isEmail_(q);
      const data = await apiSearch(q);
      if(!data?.ok) throw new Error(data?.error || "bad_search");

      if (isEmail){
        renderSearchResultsEmail(data.results || []);
      } else {
        if (data.type !== "idpipe" || !data.deal) throw new Error("not_found");
        closeSearchModal();
        dealToUI(data.deal);
        openPopup();
        toast("Trato cargado");
      }
    }catch(e){
      console.error("[SM] search error", e);
      toast("No se pudo buscar");
    }finally{
      finishDealLoader();
      state.__searchBusy = false;
      unlock();
    }
  }

  /* ===================== [F7.2] VENTAS (ZAPIER) ===================== */
  function doVentaAnalisis(){
    if(!state.deal) return toast("Sin trato cargado");
    if (state.__saleBusy) return;

    const ok = window.confirm("Vas a enviar una solicitud de pago para analisis de marca ¿Confirmar?...");
    if(!ok) return;

    const btn = qs("#sm-btn-venta-analisis");
    state.__saleBusy = true;
    const unlock = lockBtn(btn, "Enviando...");

    try{
      const payload = payloadFromDeal();
      sendWebhookViaForm(ZAPIER_ANALISIS, payload);
      toast("Solicitud enviada");
    }catch(e){
      console.error("[SM] zapier analisis error", e);
      toast("No se pudo enviar");
    }finally{
      setTimeout(()=>{
        state.__saleBusy = false;
        unlock();
      }, 800);
    }
  }

  function doVentaAsistido(){
    if(!state.deal) return toast("Sin trato cargado");
    if (state.__saleBusy) return;

    const ok = window.confirm("Vas a enviar una solicitud de pago para Venta de Registro Asistido ¿Confirmar?...");
    if(!ok) return;

    const btn = qs("#sm-btn-venta-asistido");
    state.__saleBusy = true;
    const unlock = lockBtn(btn, "Enviando...");

    try{
      const payload = payloadFromDeal();
      sendWebhookViaForm(ZAPIER_ASISTIDO, payload);
      toast("Solicitud enviada");
    }catch(e){
      console.error("[SM] zapier asistido error", e);
      toast("No se pudo enviar");
    }finally{
      setTimeout(()=>{
        state.__saleBusy = false;
        unlock();
      }, 800);
    }
  }

  /* ===================== [F8] COPY HANDLERS ===================== */
  function wireCopy(){
    qs("#sm-btn-copy-phone")?.addEventListener("click", async ()=>{
      const v = (qs("#sm-phone")?.value || "").trim();
      if (!v) return;
      try{
        await navigator.clipboard.writeText(v);
        toast("Copiado");
      }catch(_){
        toast("No se pudo copiar");
      }
    });

    document.addEventListener("click", async (ev)=>{
      const el = ev.target;

      // COPIAR (para todos los botones con data-copy="#selector")
      const copyBtn = el && el.closest && el.closest("[data-copy]");
      if (copyBtn){
        ev.preventDefault();
        const sel = copyBtn.getAttribute("data-copy") || "";
        const target = sel ? qs(sel) : null;

        // puede ser span/div (textContent) o input/textarea (value)
        const val = String((target && ("value" in target ? target.value : target.textContent)) || "").trim();
        if (!val) return;

        try{
          await navigator.clipboard.writeText(val);
          toast("Copiado");
        }catch(_){
          // fallback simple si clipboard bloqueado
          try{ window.prompt("Copia esto:", val); }catch(__){}
          toast("No se pudo copiar");
        }
        return;
      }

      // Header stats (abre nueva pestaña)
      const statsBtn = el && el.closest && el.closest("#sm-btn-stats");
      if (statsBtn){
      ev.preventDefault();
      const p = new URLSearchParams(location.search);
      const idc = getIDC();
      const codep = (p.get("codep") || "").trim();
      const url = `https://www.simplemarcas.cl/stats4342755671134?idc=${encodeURIComponent(idc)}&codep=${encodeURIComponent(codep)}`;
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }


      // Header calendar (abre nueva pestaña)
      const calBtn = el && el.closest && el.closest("#sm-btn-calendar");
      if (calBtn){
      ev.preventDefault();
      const idc = getIDC();
      const url = `https://www.simplemarcas.cl/agendamiento-calendario1764009390297?idc=${encodeURIComponent(idc)}`;
      window.open(url, "_blank", "noopener,noreferrer");
      return;
      }


      // Header search (funciona aunque cliquees el SVG/path)
      const searchBtn = el && el.closest && el.closest("#sm-btn-search");
      if (searchBtn){
        ev.preventDefault();
        openSearchModal();
        return;
      }

      const id = el?.id;

      if(id === "sm-btn-comenzar"){
        ev.preventDefault();
        loadDeal({ resetSkip:true });
        return;
      }

      if(id === "sm-btn-llamar"){
        ev.preventDefault();
        doCall();
        return;
      }

      if(id === "sm-btn-aceptar-continuar"){
        ev.preventDefault();
        doAcceptAndContinue();
        return;
      }

      if(id === "sm-btn-omitir"){
        ev.preventDefault();
        doOmit();
        return;
      }

      if(id === "sm-btn-atras"){
        ev.preventDefault();
        doBack();
        return;
      }

      if(id === "sm-btn-enviar-encuesta"){
        ev.preventDefault();
        doSendSurvey();
        return;
      }

      // Modal omit
      if(id === "sm-btn-omit-cancel"){
        ev.preventDefault();
        closeOmitModal();
        return;
      }

      if(id === "sm-btn-omit-confirm"){
        ev.preventDefault();
        doConfirmOmit();
        return;
      }

      // Modal search
      if(id === "sm-btn-search-cancel"){
        ev.preventDefault();
        closeSearchModal();
        return;
      }

      if(id === "sm-btn-search-run"){
        ev.preventDefault();
        doSearch();
        return;
      }

      // Pick from email results
      const pick = el && el.closest && el.closest("[data-pick-rid]");
      if(pick){
        ev.preventDefault();
        const rid = pick.getAttribute("data-pick-rid");
        if(!rid) return;
        closeSearchModal();
        await loadDealByRid(rid);
        return;
      }

      // Mini buttons right-bottom
      if(id === "sm-btn-venta-analisis"){
        ev.preventDefault();
        doVentaAnalisis();
        return;
      }

      if(id === "sm-btn-venta-asistido"){
        ev.preventDefault();
        doVentaAsistido();
        return;
      }
    });
  }

  /* ===================== [F9] EVENT WIRING ===================== */
  document.addEventListener("keydown", (ev)=>{
    if(ev.key === "Escape"){
      const om = qs("#sm-omit-modal");
      if(om && om.style.display === "flex"){
        closeOmitModal();
        return;
      }

      const sm = qs("#sm-search-modal");
      if(sm && sm.style.display === "flex"){
        closeSearchModal();
        return;
      }

      const lm = qs("#sm-log-modal");
      if(lm && lm.style.display === "flex"){
        closeLogModal();
        return;
      }
    }

    // Enter para buscar
    if(ev.key === "Enter"){
      const sm = qs("#sm-search-modal");
      if(sm && sm.style.display === "flex"){
        const active = document.activeElement;
        if(active && active.id === "sm-search-q"){
          ev.preventDefault();
          doSearch();
        }
      }
    }
  });

  function wirePayAndLog(){
    // ✅ listeners directos (no depende de ev.target.id ni del path del svg)
    qs("#sm-btn-refresh-pay")?.addEventListener("click", (ev)=>{
      ev.preventDefault();
      doRefreshPayState();
    });

    qs("#sm-btn-open-log")?.addEventListener("click", (ev)=>{
      ev.preventDefault();
      doOpenLog();
    });

    qs("#sm-btn-log-close")?.addEventListener("click", (ev)=>{
      ev.preventDefault();
      closeLogModal();
    });

    // click fuera para cerrar (solo log)
    qs("#sm-log-modal")?.addEventListener("click", (ev)=>{
      const card = qs("#sm-log-modal-card");
      if (!card) return;
      if (ev.target && !card.contains(ev.target)){
        closeLogModal();
      }
    });

    qs("#sm-btn-refresh-payv")?.addEventListener("click", (ev)=>{
      ev.preventDefault();
      doRefreshPayStateVig();
    });
  }

  document.addEventListener("DOMContentLoaded", ()=>{
    ensureDebugUI();
    initZoom();
    wireCopy();
    wirePayAndLog();
  });
})();



(function(){
  const WEBHOOK_URL = "https://hooks.zapier.com/hooks/catch/6030955/uk5zalw/";

  function init(){
    // ====== UI-only labels (NO afecta webhook) ======
    const qp = new URLSearchParams(location.search);
    const SHOW_PAYOUTS = (qp.get("codep") === "917830109");

    const PAYOUT_SUFFIX = {
      "A.1.2": "+$390",
      "A.2.1": "+$390",
      "A.2.3": "+$390",
      "A.2.4": "+$520",
      "A.2.2.3": "+$390",
      "A.2.2.1.1": "+$650",
      "A.2.2.1.2": "+$390",
      "A.2.2.2.1": "+$650",
      "A.2.2.2.2": "+$390",
      "A.2.5": "+$1300",
      "A.3.2.2": "+$260",
      "A.3.1": "+$650",
      "A.5.2.2": "+$260",
      "A.5.1": "+$650",
      "A.5.1.1": "+$650",
      "A.5.1.2": "+$650",
      "B.1.2": "+$390",
      "B.2.1": "+$390",
      "B.2.3": "+$390",
      "B.2.4": "+$520",
      "B.2.2.3": "+$390",
      "B.2.2.1.1": "+$650",
      "B.2.2.1.2": "+$390",
      "B.2.2.2.1": "+$650",
      "B.2.2.2.2": "+$390",
      "B.2.5": "+$780",
      "B.4.2.2": "+$260",
      "B.4.1.1": "+$650",
      "B.4.1.2": "+$650",
      "C.1.2": "+$390",
      "C.2.1": "+$390",
      "C.2.3": "+$390",
      "C.2.4": "+$520",
      "C.2.2.1": "+$390",
      "C.2.2.2": "+$390",
      "C.2.5": "+$780",
      "C.2.5.1": "+$650",
      "C.2.5.2": "+$650"
    };

    function displayLabel(option){
      if(!SHOW_PAYOUTS) return option.label;
      const s = PAYOUT_SUFFIX[option.id];
      return s ? (option.label + " " + s) : option.label;
    }

    const FLOW = {
      start: {
        id: "Q0",
        text: "Selecciona el tipo de llamada o desde donde se retoma",
        options: [
          { id:"A", label:"Llamada desde el Inicio", next:"A|Q1" },
          { id:"B", label:"Pendiente de pago de Registro", next:"B|Q1" },
          { id:"C", label:"Pendiente de pago de Vigilancia", next:"C|Q1" }
        ]
      },
      nodes: {
        "A|Q1": {
          id:"A|Q1",
          text:"¿Qué pasó en la llamada?",
          options:[
            { id:"A.1.1", label:"Telefono Inválido (Numero con error o no existe)", next:null, requires_text:false },
            { id:"A.1.2", label:"No contestó en 2 intentos seguidos (Sonó y no contestó o fue a buzon de voz)", next:null, requires_text:false },
            { id:"A.1.3", label:"Contestó", next:"A|Q2", requires_text:false }
          ]
        },
        "A|Q2": {
          id:"A|Q2",
          text:"¿Qué pasó al inicio de la llamada?",
          options:[
            { id:"A.2.1", label:"Número equivocado", next:null, requires_text:false },
            { id:"A.2.3", label:"Quiere el servicio, pero no quiere agendar (cliente dice se comunicará en el futuro)", next:null, requires_text:false },
            { id:"A.2.4", label:"Agendado (no podía hablar ahora)", next:null, requires_text:false },
            { id:"A.2.2", label:"Ya no quiere el Registro", next:"A|Q2_2", requires_text:false },
            { id:"A.2.5", label:"Se envía Ficha", next:"A|Q3", requires_text:false }
          ]
        },
        "A|Q2_2": {
          id:"A|Q2_2",
          text:"¿Cuál fué el motivo?",
          options:[
            { id:"A.2.2.3", label:"Otros: (Rellenar Manual)", next:null, requires_text:true },
            { id:"A.2.2.1", label:"Porque quiere análisis", next:"A|Q2_2_1", requires_text:false },
            { id:"A.2.2.2", label:"Por presupuesto", next:"A|Q2_2_2", requires_text:false }
          ]
        },
        "A|Q2_2_1": {
          id:"A|Q2_2_1",
          text:"¿El cliente accedió a comprar análisis y se enviaron datos?",
          options:[
            { id:"A.2.2.1.1", label:"Sí", next:null, requires_text:false },
            { id:"A.2.2.1.2", label:"No", next:null, requires_text:false }
          ]
        },
        "A|Q2_2_2": {
          id:"A|Q2_2_2",
          text:"¿Se envío información registro asistido?",
          options:[
            { id:"A.2.2.2.1", label:"Sí", next:null, requires_text:false },
            { id:"A.2.2.2.2", label:"No", next:null, requires_text:false }
          ]
        },
        "A|Q3": {
          id:"A|Q3",
          text:"¿Pagó en la llamada?",
          options:[
            { id:"A.3.2", label:"No", next:"A|Q3_2", requires_text:false },
            { id:"A.3.1", label:"Sí (Se asistió el pago)", next:"A|Q3_1", requires_text:false }
          ]
        },
        "A|Q3_2": {
          id:"A|Q3_2",
          text:"¿Se agendó para verificar el pago?",
          options:[
            { id:"A.3.2.1", label:"No quiere agendar dice que se comunicará en el futuro", next:null, requires_text:false },
            { id:"A.3.2.2", label:"Agendado (no podía pagar ahora)", next:null, requires_text:false }
          ]
        },
        "A|Q3_1": {
          id:"A|Q3_1",
          text:"¿Como pagó?",
          options:[
            { id:"A.3.1.2", label:"Por transferencia (Se agenda)", next:null, requires_text:false },
            { id:"A.3.1.1", label:"Por botón de pago", next:"A|Q4", requires_text:false }
          ]
        },
        "A|Q4": {
          id:"A|Q4",
          text:"¿Cual fué la opcion elegida en la ficha de vigilancia?",
          options:[
            { id:"A.4.2", label:"No", next:null, requires_text:false },
            { id:"A.4.1", label:"Sí", next:"A|Q5", requires_text:false }
          ]
        },
        "A|Q5": {
          id:"A|Q5",
          text:"¿Pagó en la llamada?",
          options:[
            { id:"A.5.2", label:"No", next:"A|Q5_2", requires_text:false },
            { id:"A.5.1", label:"Sí (Se asistió el pago)", next:"A|Q5_1", requires_text:false }
          ]
        },
        "A|Q5_2": {
          id:"A|Q5_2",
          text:"¿Se agendó para verificar el pago?",
          options:[
            { id:"A.5.2.1", label:"No quiere agendar dice que se comunicará en el futuro", next:null, requires_text:false },
            { id:"A.5.2.2", label:"Agendado (no podía pagar ahora)", next:null, requires_text:false }
          ]
        },
        "A|Q5_1": {
          id:"A|Q5_1",
          text:"¿Como pagó?",
          options:[
            { id:"A.5.1.1", label:"Por botón de pago", next:null, requires_text:false },
            { id:"A.5.1.2", label:"Por transferencia (Se agenda)", next:null, requires_text:false }
          ]
        },
        "B|Q1": {
          id:"B|Q1",
          text:"¿Qué pasó en la llamada?",
          options:[
            { id:"B.1.1", label:"Telefono Inválido (Numero con error o no existe)", next:null, requires_text:false },
            { id:"B.1.2", label:"No contestó en 2 intentos seguidos (Sonó y no contestó o fue a buzon de voz)", next:null, requires_text:false },
            { id:"B.1.3", label:"Contestó", next:"B|Q2", requires_text:false }
          ]
        },
        "B|Q2": {
          id:"B|Q2",
          text:"¿Qué pasó al inicio de la llamada?",
          options:[
            { id:"B.2.1", label:"Número equivocado", next:null, requires_text:false },
            { id:"B.2.3", label:"Quiere el servicio, pero no quiere agendar (cliente dice se comunicará en el futuro)", next:null, requires_text:false },
            { id:"B.2.4", label:"Agendado (no podía hablar ahora)", next:null, requires_text:false },
            { id:"B.2.2", label:"Ya no quiere el Registro", next:"B|Q2_2", requires_text:false },
            { id:"B.2.5", label:"Se asistió el pago", next:"B|Q2_5", requires_text:false }
          ]
        },
        "B|Q2_2": {
          id:"B|Q2_2",
          text:"¿Cuál fué el motivo?",
          options:[
            { id:"B.2.2.3", label:"Otros: (Rellenar Manual)", next:null, requires_text:true },
            { id:"B.2.2.1", label:"Porque quiere análisis", next:"B|Q2_2_1", requires_text:false },
            { id:"B.2.2.2", label:"Por presupuesto", next:"B|Q2_2_2", requires_text:false }
          ]
        },
        "B|Q2_2_1": {
          id:"B|Q2_2_1",
          text:"¿El cliente accedió a comprar análisis y se enviaron datos?",
          options:[
            { id:"B.2.2.1.1", label:"Sí", next:null, requires_text:false },
            { id:"B.2.2.1.2", label:"No", next:null, requires_text:false }
          ]
        },
        "B|Q2_2_2": {
          id:"B|Q2_2_2",
          text:"¿Se envío información registro asistido?",
          options:[
            { id:"B.2.2.2.1", label:"Sí", next:null, requires_text:false },
            { id:"B.2.2.2.2", label:"No", next:null, requires_text:false }
          ]
        },
        "B|Q2_5": {
          id:"B|Q2_5",
          text:"¿Como pagó?",
          options:[
            { id:"B.2.5.2", label:"Por transferencia (Se agenda)", next:null, requires_text:false },
            { id:"B.2.5.1", label:"Por botón de pago", next:"B|Q3", requires_text:false }
          ]
        },
        "B|Q3": {
          id:"B|Q3",
          text:"¿Cual fué la opcion elegida en la ficha de vigilancia?",
          options:[
            { id:"B.3.2", label:"No", next:null, requires_text:false },
            { id:"B.3.1", label:"Sí", next:"B|Q4", requires_text:false }
          ]
        },
        "B|Q4": {
          id:"B|Q4",
          text:"¿Pagó en la llamada?",
          options:[
            { id:"B.4.2", label:"No", next:"B|Q4_2", requires_text:false },
            { id:"B.4.1", label:"Sí (Se asistió el pago)", next:"B|Q4_1", requires_text:false }
          ]
        },
        "B|Q4_2": {
          id:"B|Q4_2",
          text:"¿Se agendó para verificar el pago?",
          options:[
            { id:"B.4.2.1", label:"No quiere agendar dice que se comunicará en el futuro", next:null, requires_text:false },
            { id:"B.4.2.2", label:"Agendado (no podía pagar ahora)", next:null, requires_text:false }
          ]
        },
        "B|Q4_1": {
          id:"B|Q4_1",
          text:"¿Como pagó?",
          options:[
            { id:"B.4.1.1", label:"Por botón de pago", next:null, requires_text:false },
            { id:"B.4.1.2", label:"Por transferencia (Se agenda)", next:null, requires_text:false }
          ]
        },
        "C|Q1": {
          id:"C|Q1",
          text:"¿Qué pasó en la llamada?",
          options:[
            { id:"C.1.1", label:"Telefono Inválido (Numero con error o no existe)", next:null, requires_text:false },
            { id:"C.1.2", label:"No contestó en 2 intentos seguidos (Sonó y no contestó o fue a buzon de voz)", next:null, requires_text:false },
            { id:"C.1.3", label:"Contestó", next:"C|Q2", requires_text:false }
          ]
        },
        "C|Q2": {
          id:"C|Q2",
          text:"¿Qué pasó al inicio de la llamada?",
          options:[
            { id:"C.2.1", label:"Número equivocado", next:null, requires_text:false },
            { id:"C.2.3", label:"Quiere el servicio, pero no quiere agendar (cliente dice se comunicará en el futuro)", next:null, requires_text:false },
            { id:"C.2.4", label:"Agendado (no podía hablar ahora)", next:null, requires_text:false },
            { id:"C.2.2", label:"Ya no quiere la Vigilancia", next:"C|Q2_2", requires_text:false },
            { id:"C.2.5", label:"Se asistió el pago", next:"C|Q2_5", requires_text:false }
          ]
        },
        "C|Q2_2": {
          id:"C|Q2_2",
          text:"¿Cuál fué el motivo?",
          options:[
            { id:"C.2.2.1", label:"Por presupuesto", next:null, requires_text:false },
            { id:"C.2.2.2", label:"Otros: (Rellenar Manual)", next:null, requires_text:true }
          ]
        },
        "C|Q2_5": {
          id:"C|Q2_5",
          text:"¿Como pagó?",
          options:[
            { id:"C.2.5.1", label:"Por botón de pago", next:null, requires_text:false },
            { id:"C.2.5.2", label:"Por transferencia (Se agenda)", next:null, requires_text:false }
          ]
        }
      }
    };

    const ROOT = document.getElementById("sm-typeform-min");
    if(!ROOT) return;

    const st = {
      nodeId: "Q0",
      branch: null,
      selected: null,
      detalle: "",
      history: [],
      answers: {}
    };

    let smfAutoTimer = null;

    function ce(t, c, txt){
      const el = document.createElement(t);
      if(c) el.className = c;
      if(txt !== undefined) el.textContent = txt;
      return el;
    }

    function getNodeById(nodeId){
      return nodeId === "Q0" ? FLOW.start : FLOW.nodes[nodeId];
    }

    function optionsOfById(nodeId, node){
      return nodeId === "Q0" ? (FLOW.start.options || []) : (node.options || []);
    }

    function findOptionInNode(nodeId, node, optId){
      const opts = optionsOfById(nodeId, node);
      return opts.find(o => o.id === optId) || null;
    }

    function paintSelected(optsWrap, selectedId){
      const btns = optsWrap.querySelectorAll(".smf-opt");
      btns.forEach(btn=>{
        btn.classList.toggle("is-selected", btn.getAttribute("data-optid") === selectedId);
      });
    }

    function cleanQuestionText(t){
      return String(t || "")
        .replace(/^PREGUNTA\s*:\s*/i, "PREGUNTA ")
        .replace(/^PREGUNTA\s*[\d.]*\s*:?\s*/i, "")
        .trim();
    }

    function isFinal(option){
      return !!option && !option.next && st.nodeId !== "Q0";
    }

    function canProceedFinal(option){
      if(!isFinal(option)) return true;
      if(!option.requires_text) return true;
      return (st.detalle || "").trim().length > 0;
    }

    function buildRecorridoString(){
      const norm = (s) => String(s || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

      function isYesNoNode(nodeId, node){
        const opts = optionsOfById(nodeId, node) || [];
        if(opts.length !== 2) return false;
        const a = norm(opts[0].label);
        const b = norm(opts[1].label);
        const isSi = (x) => x.startsWith("si");
        const isNo = (x) => x.startsWith("no");
        return (isSi(a) && isNo(b)) || (isNo(a) && isSi(b));
      }

      const nodeIds = st.history.map(h=>h.nodeId).concat([st.nodeId]);
      const steps = [];

      nodeIds.forEach(nid=>{
        const node = getNodeById(nid);
        const ans = st.answers[nid];
        if(!node || !ans || !ans.selected) return;
        const opt = findOptionInNode(nid, node, ans.selected);
        if(!opt) return;

        const det = (ans.detalle || "").trim();
        let step;

        if(isYesNoNode(nid, node)){
          step = cleanQuestionText(node.text) + ": " + opt.label;
        }else{
          step = opt.label;
        }

        if(opt.requires_text && det) step += " — " + det;
        steps.push(step);
      });

      //  elimina duplicados consecutivos
const compact = [];
for (let i = 0; i < steps.length; i++){
  if (steps[i] && steps[i] !== compact[compact.length - 1]) compact.push(steps[i]);
}
return compact.join(" > ");

    }

    function postWebhook(payload, ctx){
      const safe = ctx || {};
      const data = {
        numero_pregunta: payload.numero_pregunta ?? "",
        detalle: payload.detalle ?? "",
        recorrido: payload.recorrido ?? "",
        // NUEVO: datos del popup
        idpipe: safe.idpipe || "",
        idc: safe.idc || "",
        tiempo_total_llamadas_sec: (safe.total_calls_sec ?? ""),
        tiempo_total_llamadas: (safe.total_calls_mss ?? "")
      };

      try{
        const iframeName = "sm_zap_iframe_" + Math.random().toString(16).slice(2);
        const ifr = document.createElement("iframe");
        ifr.name = iframeName;
        ifr.style.display = "none";
        document.body.appendChild(ifr);

        const form = document.createElement("form");
        form.action = WEBHOOK_URL;
        form.method = "POST";
        form.enctype = "application/x-www-form-urlencoded";
        form.target = iframeName;
        form.style.display = "none";

        Object.keys(data).forEach(k=>{
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = k;
          input.value = String(data[k]);
          form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();

        setTimeout(()=>{
          try{ form.remove(); }catch(e){}
          try{ ifr.remove(); }catch(e){}
        }, 1200);

        return;
      }catch(e){}

      try{
        fetch(WEBHOOK_URL, {
          method:"POST",
          mode:"no-cors",
          keepalive:true,
          headers:{ "Content-Type":"application/json" },
          body: JSON.stringify(data)
        });
      }catch(e){}
    }

    function renderDone(){
      ROOT.innerHTML = "";
      const wrap = ce("div","smf smf-anim smf-enter");
      wrap.appendChild(ce("p","smf-done","Listo"));
      ROOT.appendChild(wrap);
    }

    function animateOutThen(cb){
      const wrap = ROOT.querySelector("[data-wrap='1']");
      if(!wrap){
        cb();
        return;
      }
      wrap.classList.remove("smf-enter");
      wrap.classList.add("smf-leave");
      setTimeout(cb,190);
    }

    function animateTo(newNodeId){
      animateOutThen(()=>{
        const a = st.answers[newNodeId];
        st.selected = a ? a.selected : null;
        st.detalle = a ? (a.detalle || "") : "";
        render(newNodeId,true);
      });
    }

    function goNext(option){
      st.answers[st.nodeId] = { selected: st.selected, detalle: st.detalle };

      if(st.nodeId === "Q0"){
        st.history.push({ nodeId:"Q0", branch: st.branch });
        st.branch = option.id;
        st.nodeId = st.branch + "|Q1";
        st.selected = null;
        st.detalle = "";
        animateTo(st.nodeId);
        return;
      }

      st.history.push({ nodeId: st.nodeId, branch: st.branch });
      st.nodeId = option.next;
      st.selected = null;
      st.detalle = "";
      animateTo(st.nodeId);
    }

    function render(nodeId, withEnter){
      ROOT.innerHTML = "";

      const node = getNodeById(nodeId);
      const wrap = ce("div","smf smf-anim" + (withEnter ? " smf-enter" : ""));
      wrap.setAttribute("data-wrap","1");

      wrap.appendChild(ce("div","smf-q", node.text));

      const optsWrap = ce("div","smf-opts");

      optionsOfById(nodeId, node).forEach((o, idx)=>{
        const b = ce("button","smf-opt");
        b.type = "button";
        b.setAttribute("data-optid", o.id);

        const letter = String.fromCharCode(65 + idx);
        const tag = ce("span","smf-letter", letter);

        const txtWrap = ce("span","smf-opt-text","");
        const shown = displayLabel(o);
        const m = shown.match(/\s(\+\$\d+)\s*$/);
        if(m){
          txtWrap.textContent = shown.replace(/\s(\+\$\d+)\s*$/,"");
          const pay = ce("span","smf-opt-pay", m[1]);
          txtWrap.appendChild(pay);
        }else{
          txtWrap.textContent = shown;
        }

        b.appendChild(tag);
        b.appendChild(txtWrap);

        if(st.selected === o.id) b.classList.add("is-selected");

        b.addEventListener("click", ()=>{
          if(smfAutoTimer){
            clearTimeout(smfAutoTimer);
            smfAutoTimer = null;
          }

          st.selected = o.id;
          if(!o.requires_text) st.detalle = "";
          paintSelected(optsWrap, o.id);

          if(o.next){
            smfAutoTimer = setTimeout(()=>{
              smfAutoTimer = null;
              goNext(o);
            }, 120);
            return;
          }

          render(st.nodeId,false);
        });

        optsWrap.appendChild(b);
      });

      wrap.appendChild(optsWrap);

      const currentOpt = findOptionInNode(nodeId, node, st.selected);

      if(currentOpt && !currentOpt.next && currentOpt.requires_text){
        const extra = ce("div","smf-extra");
        const input = ce("input","smf-input");
        input.type = "text";
        input.placeholder = "Escribe el motivo...";
        input.value = st.detalle || "";

        input.addEventListener("input", (e)=>{
          st.detalle = e.target.value;
          const btn = ROOT.querySelector("[data-sendbtn='1']");
          if(btn) btn.disabled = !canProceedFinal(currentOpt);
        });

        extra.appendChild(input);
        wrap.appendChild(extra);
      }

      const nav = ce("div","smf-nav");

      const back = ce("button","smf-btn","Atrás");
      back.type = "button";
      back.disabled = st.history.length === 0;

      back.addEventListener("click", ()=>{
        if(st.history.length === 0) return;

        if(smfAutoTimer){
          clearTimeout(smfAutoTimer);
          smfAutoTimer = null;
        }

        const prev = st.history.pop();
        st.nodeId = prev.nodeId;
        st.branch = prev.branch;

        const a = st.answers[st.nodeId];
        st.selected = a ? a.selected : null;
        st.detalle = a ? (a.detalle || "") : "";

        animateTo(st.nodeId);
      });

      const finalOpt = !!(currentOpt && isFinal(currentOpt));
      const sendBtn = ce("button","smf-btn smf-btn-primary", finalOpt ? "Aceptar y enviar" : "Siguiente");
      sendBtn.type = "button";
      sendBtn.setAttribute("data-sendbtn","1");

      if(!currentOpt){
        sendBtn.disabled = true;
      }else if(finalOpt){
        sendBtn.disabled = !canProceedFinal(currentOpt);
      }else{
        sendBtn.disabled = false;
      }

      sendBtn.addEventListener("click", async ()=>{
        if(!currentOpt) return;

        if(!finalOpt){
          if(currentOpt.next) goNext(currentOpt);
          return;
        }

        if(!canProceedFinal(currentOpt)) return;

        st.answers[st.nodeId] = { selected: st.selected, detalle: st.detalle };
        const recorrido = buildRecorridoString();

        const payload = {
          numero_pregunta: currentOpt.id,
          detalle: (currentOpt.requires_text ? (st.detalle || "").trim() : ""),
          recorrido
        };

        const ctx = (window.__smSurveyGetContext && window.__smSurveyGetContext()) || {};

        // Bloquea botón mientras envía
        sendBtn.disabled = true;
        const prevTxt = sendBtn.textContent;
        sendBtn.textContent = "Enviando...";

        // 1) Primero: hacer lo que hacía el botón Enviar del popup (finalize + siguiente trato)
        const fin = await (window.__smSurveyFinalizeFromTypeform ? window.__smSurveyFinalizeFromTypeform(payload) : Promise.resolve({ok:false,error:"missing_bridge"}));
        if(!fin?.ok){
          sendBtn.disabled = false;
          sendBtn.textContent = prevTxt;
          return;
        }

        // 2) Luego: webhook propio del componente (mismo endpoint) + datos extra
        postWebhook(payload, ctx);

        animateOutThen(()=>{
          reset(); // deja el componente listo para el siguiente trato
        });
      });

      // En la primera pregunta (Q0) NO mostrar "Atrás"
      if(st.history.length > 0 && nodeId !== "Q0"){
        nav.appendChild(back);
      }

      nav.appendChild(sendBtn);
      wrap.appendChild(nav);
      ROOT.appendChild(wrap);
    }

    function reset(){
      st.nodeId = "Q0";
      st.selected = null;
      st.detalle = "";
      st.history = [];
      st.answers = {};
      render("Q0", true);
    }

    // Permite reset desde el popup (cuando cambia el trato)
    window.__smTypeformMinReset = reset;

    reset();
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", init);
  }else{
    init();
  }
})();
