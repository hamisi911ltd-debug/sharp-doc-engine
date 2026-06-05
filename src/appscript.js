export function getAppJS() {
  return `
(function () {
"use strict";

// ── State ────────────────────────────────────────────────────────────────────
var S = {
  payload:    null,
  dissection: "",
  comparison: "",
  history:    [],
  contentA:   null,
  filenameA:  null,
  contentB:   null,
  filenameB:  null,
  compareMode: false,
};

// ── Markdown renderer ────────────────────────────────────────────────────────
function renderMd(raw) {
  if (!raw) return "";
  var lines   = raw.split("\\n");
  var out     = [];
  var inList  = false;
  var listOl  = false;
  var inCode  = false;
  var codeBuf = [];

  function closeList() {
    if (inList) { out.push(listOl ? "</ol>" : "</ul>"); inList = false; }
  }
  function escHtml(s) {
    return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  }
  function inline(s) {
    return s
      .replace(/\\*\\*\\*(.+?)\\*\\*\\*/g,"<strong><em>$1</em></strong>")
      .replace(/\\*\\*(.+?)\\*\\*/g,"<strong>$1</strong>")
      .replace(/\\*(.+?)\\*/g,"<em>$1</em>")
      .replace(/\`([^\`]+)\`/g,"<code>$1</code>");
  }

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];

    // Code fence
    if (line.trim().slice(0,3) === "\`\`\`") {
      if (inCode) {
        out.push("<pre><code>" + escHtml(codeBuf.join("\\n")) + "</code></pre>");
        codeBuf = []; inCode = false;
      } else { closeList(); inCode = true; }
      continue;
    }
    if (inCode) { codeBuf.push(line); continue; }

    // Empty
    if (!line.trim()) { closeList(); out.push("<p style=\\"margin:4px 0\\"></p>"); continue; }

    var e = escHtml(line);

    // Table row
    if (line.indexOf("|") !== -1 && line.trim()[0] === "|") {
      closeList();
      if (line.replace(/[|\\- ]/g,"").trim() === "") continue; // separator
      var cells = line.split("|").filter(function(c){ return c.trim() !== ""; });
      var isHead = (i === 0 || lines[i-1].trim() === "" || (lines[i+1] && lines[i+1].replace(/[|\\- ]/g,"").trim() === ""));
      var tag = isHead ? "th" : "td";
      // detect if next line is separator
      var nextSep = lines[i+1] && lines[i+1].replace(/[|\\- ]/g,"").trim() === "";
      if (nextSep) tag = "th";
      var row = "<tr>" + cells.map(function(c){ return "<"+tag+">" + inline(escHtml(c.trim())) + "</"+tag+">"; }).join("") + "</tr>";
      // wrap in table if needed
      if (out.length === 0 || out[out.length-1].slice(0,4) !== "<tr>" && out[out.length-1].indexOf("<table") === -1) {
        closeList(); out.push("<table>"); out.push(row);
      } else { out.push(row); }
      if (!lines[i+1] || lines[i+1].trim() === "" || lines[i+1].trim()[0] !== "|") {
        if (out[out.length - 2] === "<table>" || (out.length > 1 && out[out.length-2].slice(0,3) === "<tr")) {
          out.push("</table>");
        }
      }
      continue;
    }

    // Headers
    if (line.slice(0,4) === "### ") { closeList(); out.push("<h3>" + inline(escHtml(line.slice(4))) + "</h3>"); continue; }
    if (line.slice(0,3) === "## ")  { closeList(); out.push("<h2>" + inline(escHtml(line.slice(3))) + "</h2>"); continue; }
    if (line.slice(0,2) === "# ")   { closeList(); out.push("<h1>" + inline(escHtml(line.slice(2))) + "</h1>"); continue; }

    // HR
    if (line.trim().match(/^---+$/) || line.trim().match(/^===+$/)) { closeList(); out.push("<hr>"); continue; }

    // UL
    var ulM = line.match(/^(\\s*)[\\-\\*]\\s+(.+)$/);
    if (ulM) {
      if (!inList || listOl) { closeList(); out.push("<ul>"); inList = true; listOl = false; }
      out.push("<li>" + inline(escHtml(ulM[2])) + "</li>"); continue;
    }
    // OL
    var olM = line.match(/^(\\s*)\\d+\\.\\s+(.+)$/);
    if (olM) {
      if (!inList || !listOl) { closeList(); out.push("<ol>"); inList = true; listOl = true; }
      out.push("<li>" + inline(escHtml(olM[2])) + "</li>"); continue;
    }

    closeList();
    out.push("<p>" + inline(e) + "</p>");
  }

  closeList();
  if (inCode) out.push("<pre><code>" + escHtml(codeBuf.join("\\n")) + "</code></pre>");
  return out.join("\\n");
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function esc(s) {
  return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}
function getModel() { return document.getElementById("modelSelect").value; }
function $id(id)    { return document.getElementById(id); }
function show(id)   { $id(id).classList.remove("hidden"); }
function hide(id)   { $id(id).classList.add("hidden"); }

// ── View switching ───────────────────────────────────────────────────────────
document.querySelectorAll(".ttab").forEach(function(btn) {
  btn.addEventListener("click", function() {
    var v = btn.getAttribute("data-view");
    document.querySelectorAll(".ttab").forEach(function(b){ b.classList.remove("active"); });
    btn.classList.add("active");
    ["analysis","translate","compare"].forEach(function(n){ hide("view-"+n); });
    show("view-"+v);
  });
});

// ── Inner tabs ───────────────────────────────────────────────────────────────
document.querySelectorAll(".tab-btn").forEach(function(btn) {
  btn.addEventListener("click", function() {
    var tab  = btn.getAttribute("data-tab");
    var card = btn.closest(".card");
    card.querySelectorAll(".tab-btn").forEach(function(b){ b.classList.remove("active"); });
    card.querySelectorAll(".tab-pane").forEach(function(p){ p.classList.remove("active"); });
    btn.classList.add("active");
    var pane = $id("pane-" + tab);
    if (pane) pane.classList.add("active");
  });
});

// ── Upload zone A ────────────────────────────────────────────────────────────
var zA = $id("zoneA");
var fA = $id("fileA");
zA.addEventListener("click", function(e){ if (e.target === zA || zA.contains(e.target)) fA.click(); });
zA.addEventListener("dragover", function(e){ e.preventDefault(); zA.classList.add("drag"); });
zA.addEventListener("dragleave", function(){ zA.classList.remove("drag"); });
zA.addEventListener("drop", function(e){
  e.preventDefault(); zA.classList.remove("drag");
  if (e.dataTransfer.files[0]) loadFileA(e.dataTransfer.files[0]);
});
fA.addEventListener("change", function(e){ if (e.target.files[0]) loadFileA(e.target.files[0]); });

function loadFileA(file) {
  var r = new FileReader();
  r.onload = function(e) {
    S.contentA  = e.target.result;
    S.filenameA = file.name;
    zA.classList.add("has-file");
    $id("nameA").textContent = file.name;
    $id("infoA").textContent = (e.target.result.length/1024).toFixed(1) + " KB";
    runAnalysis(e.target.result, file.name);
    if (S.compareMode) $id("runCompare").disabled = !S.contentB;
  };
  r.readAsText(file, "utf-8");
}

// ── Upload zone B ────────────────────────────────────────────────────────────
var zB = $id("zoneB");
var fB = $id("fileB");
zB.addEventListener("click", function(e){ if (e.target === zB || zB.contains(e.target)) fB.click(); });
zB.addEventListener("dragover", function(e){ e.preventDefault(); zB.classList.add("drag"); });
zB.addEventListener("dragleave", function(){ zB.classList.remove("drag"); });
zB.addEventListener("drop", function(e){
  e.preventDefault(); zB.classList.remove("drag");
  if (e.dataTransfer.files[0]) loadFileB(e.dataTransfer.files[0]);
});
fB.addEventListener("change", function(e){ if (e.target.files[0]) loadFileB(e.target.files[0]); });

function loadFileB(file) {
  var r = new FileReader();
  r.onload = function(e) {
    S.contentB  = e.target.result;
    S.filenameB = file.name;
    zB.classList.add("has-file");
    $id("nameB").textContent = file.name;
    $id("infoB").textContent = (e.target.result.length/1024).toFixed(1) + " KB";
    $id("runCompare").disabled = !S.contentA;
  };
  r.readAsText(file, "utf-8");
}

// ── Toggle compare mode ──────────────────────────────────────────────────────
function toggleCompare() {
  S.compareMode = !S.compareMode;
  var wrap = $id("uploadWrap");
  var btn  = $id("btnCompare");
  if (S.compareMode) {
    wrap.classList.add("two-col");
    show("zoneB"); show("tabCompare");
    btn.textContent = "X Cancel Compare";
    // switch to compare view
    document.querySelectorAll(".ttab").forEach(function(b){ b.classList.remove("active"); });
    $id("tabCompare").classList.add("active");
    ["analysis","translate","compare"].forEach(function(n){ hide("view-"+n); });
    show("view-compare");
  } else {
    wrap.classList.remove("two-col");
    hide("zoneB"); hide("tabCompare");
    btn.innerHTML = "&#9654; Compare Documents";
    document.querySelectorAll(".ttab").forEach(function(b){ b.classList.remove("active"); });
    document.querySelector(".ttab[data-view='analysis']").classList.add("active");
    ["analysis","translate","compare"].forEach(function(n){ hide("view-"+n); });
    show("view-analysis");
  }
}
window.toggleCompare = toggleCompare;

// ── Show translate view ──────────────────────────────────────────────────────
function showTranslate() {
  show("tabTranslate");
  document.querySelectorAll(".ttab").forEach(function(b){ b.classList.remove("active"); });
  $id("tabTranslate").classList.add("active");
  ["analysis","translate","compare"].forEach(function(n){ hide("view-"+n); });
  show("view-translate");
}
window.showTranslate = showTranslate;

// ── Meta ──────────────────────────────────────────────────────────────────────
function setMeta(content, filename) {
  var ext   = filename.split(".").pop().toUpperCase();
  var lines = (content.match(/\\n/g)||[]).length;
  $id("cFmt").textContent = ext;
  $id("cSz").textContent  = (content.length/1024).toFixed(1) + " KB";
  $id("cLn").textContent  = lines.toLocaleString();
  $id("cLg").textContent  = "Detecting…";
}

// ── Main analysis ────────────────────────────────────────────────────────────
async function runAnalysis(content, filename) {
  S.payload = null; S.dissection = ""; S.comparison = ""; S.history = [];
  $id("chatMsgs").innerHTML = "";
  $id("dissectOut").innerHTML = "";
  $id("toolLogOut").innerHTML = "";
  $id("results").classList.remove("hidden");
  setMeta(content, filename);

  var pill = $id("dissectPill");
  pill.className  = "spill loading";
  pill.innerHTML  = '<span class="pulse"></span>&nbsp;Streaming…';
  $id("cSt").className = "chip c-run";
  $id("cSt").innerHTML = '<span class="spinner"></span>&nbsp;Analyzing…';

  // Run phase 1 and 2 in parallel
  await Promise.all([ streamDissect(content, filename), extractData(content, filename) ]);

  $id("cSt").className = "chip c-ok";
  $id("cSt").textContent = "✓ Complete";
}

// ── Phase 1: streaming dissection ────────────────────────────────────────────
async function streamDissect(content, filename) {
  var out  = $id("dissectOut");
  var pill = $id("dissectPill");
  var full = "";
  try {
    var resp = await fetch("/api/stream", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: content, filename: filename, model: getModel() }),
    });
    var reader  = resp.body.getReader();
    var decoder = new TextDecoder();
    var buf     = "";

    while (true) {
      var chunk = await reader.read();
      if (chunk.done) break;
      buf += decoder.decode(chunk.value, { stream: true });
      var lines = buf.split("\\n");
      buf = lines.pop();
      for (var i = 0; i < lines.length; i++) {
        var ln = lines[i];
        if (ln.slice(0,6) !== "data: ") continue;
        var raw = ln.slice(6).trim();
        if (raw === "[DONE]") break;
        try {
          var obj = JSON.parse(raw);
          if (obj.response) {
            full += obj.response;
            out.innerHTML = renderMd(full);
            out.scrollTop = out.scrollHeight;
          }
        } catch(e){}
      }
    }
    S.dissection = full;
    pill.className   = "spill done";
    pill.textContent = "✓ Complete";
  } catch(err) {
    pill.className   = "spill error";
    pill.textContent = "Error: " + err.message;
  }
}

// ── Phase 2: structured extraction ───────────────────────────────────────────
async function extractData(content, filename) {
  try {
    var resp = await fetch("/api/analyze", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: content, filename: filename, model: getModel() }),
    });
    var data = await resp.json();
    $id("cLg").textContent = data.docLanguage || "—";
    if (data.translationNote) $id("cLg").textContent += " → " + data.translationNote;
    if (data.toolLog) renderToolLog(data.toolLog);
    if (data.payload) { S.payload = data.payload; renderPayload(data.payload); }
  } catch(err) {
    $id("cSt").className   = "chip c-warn";
    $id("cSt").textContent = "Extraction error";
  }
}

// ── Tool log ─────────────────────────────────────────────────────────────────
function renderToolLog(calls) {
  if (!calls.length) return;
  var html = "";
  calls.forEach(function(c) {
    var cls  = c.status === "ok" ? "tok" : c.status === "warn" ? "twarn" : "terr";
    var icon = c.status === "ok" ? "✔" : c.status === "warn" ? "⚠" : "✕";
    html += "<div class=\\"tl-row\\">";
    html += "<span class=\\"" + cls + "\\">" + icon + "</span>";
    html += "<span class=\\"tl-name\\">" + esc(c.tool) + "</span>";
    html += "<span class=\\"tl-ts\\">" + esc(c.ts||"") + "</span>";
    html += "</div>";
  });
  $id("toolLogOut").innerHTML = html;
}

// ── Payload rendering ─────────────────────────────────────────────────────────
function renderPayload(p) {
  renderFinancial(p);
  renderEntities(p);
  renderInsights(p);
  renderActions(p);
  renderRaw(p);
}

var chartInst = null;
function renderFinancial(p) {
  var m = p.metrics; var c = p.currency || "USD";
  var gross = Math.round(m.orders * m.aov * 100) / 100;
  $id("mOrders").textContent = m.orders ? m.orders.toLocaleString() : "—";
  $id("mAov").textContent    = m.aov    ? c + " " + m.aov.toFixed(2) : "—";
  $id("mDisc").textContent   = m.discount_cost ? c + " " + m.discount_cost.toFixed(2) : "—";

  var al = $id("revAlert");
  if (m.math_anomaly_detected) {
    al.innerHTML = "<div class=\\"alert warn\\">⚠ Math anomaly — Reported: " + c + " " + m.reported_revenue.toFixed(2) +
      " &nbsp;·&nbsp; Calculated: " + c + " " + m.calculated_revenue.toFixed(2) +
      " &nbsp;·&nbsp; Diff: " + c + " " + Math.abs(m.calculated_revenue - m.reported_revenue).toFixed(2) + "</div>";
  } else if (m.calculated_revenue > 0) {
    al.innerHTML = "<div class=\\"alert ok\\">✔ Net Revenue: <strong>" + c + " " + m.calculated_revenue.toFixed(2) + "</strong> — Math verified</div>";
  } else {
    al.innerHTML = "<div class=\\"alert ok\\">No financial figures detected in this document.</div>";
  }

  if (chartInst) { chartInst.destroy(); chartInst = null; }
  if (!m.orders && !m.aov && !m.calculated_revenue) return;
  var ctx = $id("chartRev").getContext("2d");
  chartInst = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Gross Revenue","Discount Cost","Net Revenue"],
      datasets:[{ data:[gross, m.discount_cost, m.calculated_revenue],
        backgroundColor:["rgba(16,185,129,.55)","rgba(240,73,73,.55)","rgba(80,70,228,.55)"],
        borderColor:["#10b981","#f04949","#818cf8"], borderWidth:1, borderRadius:6 }],
    },
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{display:false}, tooltip:{callbacks:{label:function(ctx){ return " "+c+" "+ctx.parsed.y.toLocaleString(undefined,{minimumFractionDigits:2}); }}} },
      scales:{
        x:{ grid:{color:"rgba(255,255,255,.04)"}, ticks:{color:"#6868a0"} },
        y:{ grid:{color:"rgba(255,255,255,.04)"}, ticks:{color:"#6868a0", callback:function(v){ return c+" "+v.toLocaleString(); }} },
      },
    },
  });
}

function renderEntities(p) {
  var e = p.entities || {}; var html = "";
  if (e.people && e.people.length) {
    html += "<div class=\\"eg\\"><div class=\\"eg-label\\">People</div><div class=\\"tag-row\\">";
    e.people.forEach(function(x){ html += "<span class=\\"tag\\">" + esc(x) + "</span>"; });
    html += "</div></div>";
  }
  if (e.organizations && e.organizations.length) {
    html += "<div class=\\"eg\\"><div class=\\"eg-label\\">Organizations</div><div class=\\"tag-row\\">";
    e.organizations.forEach(function(x){ html += "<span class=\\"tag\\">" + esc(x) + "</span>"; });
    html += "</div></div>";
  }
  if (e.dates && e.dates.length) {
    html += "<div class=\\"eg\\"><div class=\\"eg-label\\">Dates &amp; Periods</div><div class=\\"tag-row\\">";
    e.dates.forEach(function(x){ html += "<span class=\\"tag\\">" + esc(x) + "</span>"; });
    html += "</div></div>";
  }
  $id("entOut").innerHTML = html || "<p class=\\"empty\\">No named entities found.</p>";
}

function renderInsights(p) {
  var html = "";
  if (p.key_decisions && p.key_decisions.length) {
    html += "<div class=\\"eg-label\\" style=\\"margin-bottom:7px\\">Decisions Made</div>";
    p.key_decisions.forEach(function(d){ html += "<div class=\\"li-row decision\\"><span class=\\"li-bullet\\">▶</span><span>" + esc(d) + "</span></div>"; });
  }
  if (p.action_items && p.action_items.length) {
    html += "<div class=\\"eg-label\\" style=\\"margin:13px 0 7px\\">Action Items</div>";
    p.action_items.forEach(function(a){ html += "<div class=\\"li-row action\\"><span class=\\"li-bullet\\">✓</span><span>" + esc(a) + "</span></div>"; });
  }
  if (p.risks && p.risks.length) {
    html += "<div class=\\"eg-label\\" style=\\"margin:13px 0 7px\\">Risks &amp; Concerns</div>";
    p.risks.forEach(function(r){ html += "<div class=\\"li-row risk\\"><span class=\\"li-bullet\\">⚠</span><span>" + esc(r) + "</span></div>"; });
  }
  $id("insOut").innerHTML = html || "<p class=\\"empty\\">No decisions, actions, or risks found.</p>";
}

function renderActions(p) {
  var html = "";
  (p.actions_taken||[]).forEach(function(a) {
    var cls = a.slice(0,8)==="MODIFIED" ? "modified" : a.slice(0,4)==="SENT" ? "sent" : a.slice(0,6)==="ACTION" ? "other" : "none";
    html += "<div class=\\"acard "+cls+"\\">" + esc(a) + "</div>";
  });
  $id("actOut").innerHTML = html || "<p class=\\"empty\\">No integration actions detected.</p>";
}

function renderRaw(p) {
  $id("rawEmail").textContent = p.extracted_copy.email || "—";
  $id("rawSms").textContent   = p.extracted_copy.sms   || "—";
  $id("rawJson").textContent  = JSON.stringify(p, null, 2);
}

// ── Translation ───────────────────────────────────────────────────────────────
$id("runTranslate").addEventListener("click", async function() {
  if (!S.contentA) return;
  var tgt    = $id("targetLang").value;
  var out    = $id("trOut");
  var pill   = $id("trPill");
  var btn    = $id("runTranslate");
  out.innerHTML = "<span class=\\"spinner\\"></span> Translating…";
  btn.disabled  = true;
  pill.className = "spill loading";
  show("trPill");
  pill.innerHTML = '<span class="pulse"></span>&nbsp;Translating…';

  var full = "";
  try {
    var resp = await fetch("/api/translate", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: S.contentA, filename: S.filenameA, targetLang: tgt, model: getModel() }),
    });
    var reader  = resp.body.getReader();
    var decoder = new TextDecoder();
    var buf     = "";
    while (true) {
      var chunk = await reader.read();
      if (chunk.done) break;
      buf += decoder.decode(chunk.value, { stream: true });
      var lines = buf.split("\\n"); buf = lines.pop();
      for (var i = 0; i < lines.length; i++) {
        var ln = lines[i];
        if (ln.slice(0,6) !== "data: ") continue;
        var raw = ln.slice(6).trim();
        if (raw === "[DONE]") break;
        try { var obj = JSON.parse(raw); if (obj.response) { full += obj.response; out.innerHTML = renderMd(full); } } catch(e){}
      }
    }
    pill.className   = "spill done";
    pill.textContent = "✓ Done";
  } catch(err) {
    out.innerHTML    = "<p style=\\"color:var(--red)\\">Error: " + esc(err.message) + "</p>";
    pill.className   = "spill error";
    pill.textContent = "Error";
  }
  btn.disabled = false;
});

// ── Document comparison ───────────────────────────────────────────────────────
$id("runCompare").addEventListener("click", async function() {
  if (!S.contentA || !S.contentB) return;
  var out  = $id("cmpOut");
  var pill = $id("cmpPill");
  var btn  = $id("runCompare");
  out.innerHTML  = "";
  btn.disabled   = true;
  pill.className = "spill loading";
  show("cmpPill");

  var full = "";
  try {
    var resp = await fetch("/api/compare", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contentA: S.contentA, filenameA: S.filenameA,
        contentB: S.contentB, filenameB: S.filenameB,
        model: getModel(),
      }),
    });
    var reader  = resp.body.getReader();
    var decoder = new TextDecoder();
    var buf     = "";
    while (true) {
      var chunk = await reader.read();
      if (chunk.done) break;
      buf += decoder.decode(chunk.value, { stream: true });
      var lines = buf.split("\\n"); buf = lines.pop();
      for (var i = 0; i < lines.length; i++) {
        var ln = lines[i];
        if (ln.slice(0,6) !== "data: ") continue;
        var raw = ln.slice(6).trim();
        if (raw === "[DONE]") break;
        try { var obj = JSON.parse(raw); if (obj.response) { full += obj.response; out.innerHTML = renderMd(full); } } catch(e){}
      }
    }
    S.comparison = full;
    pill.className   = "spill done";
    pill.textContent = "✓ Complete";
  } catch(err) {
    out.innerHTML    = "<p style=\\"color:var(--red)\\">Error: " + esc(err.message) + "</p>";
    pill.className   = "spill error";
    pill.textContent = "Error";
  }
  btn.disabled = false;
});

// ── Quick chat buttons ────────────────────────────────────────────────────────
$id("qTr").addEventListener("click", function(){
  quickAsk("Translate the ENTIRE document to English. Give me the complete, word-for-word translation. Preserve all structure and formatting.");
});
$id("qSum").addEventListener("click", function(){
  quickAsk("Give me exactly 5 key points from this document. Be specific — use actual names, numbers, and facts.");
});
$id("qRisk").addEventListener("click", function(){
  quickAsk("List every single risk, problem, concern, and red flag in this document. Be specific about why each one matters.");
});
$id("qAct").addEventListener("click", function(){
  quickAsk("List all action items, tasks, and next steps. Who is responsible for each? What are the deadlines?");
});
$id("qFin").addEventListener("click", function(){
  quickAsk("Explain all the financial figures in this document in plain English. What do the numbers mean for the business? Are there any anomalies?");
});
$id("qExec").addEventListener("click", function(){
  quickAsk("Write a professional executive summary with these sections: Overview, Key Findings, Financial Highlights, Risks, Actions Required, and Recommendation.");
});

function quickAsk(prompt) {
  if (!S.payload) return;
  $id("chatInput").value = prompt;
  sendChat();
}

// ── Chat ──────────────────────────────────────────────────────────────────────
$id("sendBtn").addEventListener("click", sendChat);
$id("chatInput").addEventListener("keydown", function(e) {
  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); }
});

async function sendChat() {
  if (!S.payload) return;
  var input = $id("chatInput");
  var msg   = input.value.trim();
  if (!msg) return;
  input.value = "";
  appendMsg("user", msg);
  S.history.push({ role: "user", content: msg });
  $id("sendBtn").disabled = true;

  try {
    var resp = await fetch("/api/chat", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message:    msg,
        payload:    S.payload,
        dissection: S.dissection,
        comparison: S.comparison,
        history:    S.history,
        model:      getModel(),
      }),
    });
    var data  = await resp.json();
    var reply = data.reply || "";
    appendMsg("assistant", reply, true);
    S.history.push({ role: "assistant", content: reply });
  } catch(err) {
    appendMsg("assistant", "Error: " + err.message, false);
  }
  $id("sendBtn").disabled = false;
}

function appendMsg(role, text, useMarkdown) {
  var box = $id("chatMsgs");
  var div = document.createElement("div");
  div.className = "msg " + role;
  if (useMarkdown && role === "assistant") {
    div.className += " md-msg";
    div.innerHTML  = renderMd(text);
  } else {
    div.textContent = text;
  }
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

})();
`;
}
