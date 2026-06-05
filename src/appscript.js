export function getAppJS() {
  return `
(function () {
  "use strict";

  var state = {
    payload: null,
    dissection: "",
    history: [],
  };

  // ── Model selector ───────────────────────────────────────
  function getModel() {
    return document.getElementById("modelSelect").value;
  }

  // ── Upload wiring ────────────────────────────────────────
  var zone  = document.getElementById("uploadZone");
  var input = document.getElementById("fileInput");

  zone.addEventListener("click", function () { input.click(); });
  zone.addEventListener("dragover", function (e) { e.preventDefault(); zone.classList.add("drag"); });
  zone.addEventListener("dragleave", function () { zone.classList.remove("drag"); });
  zone.addEventListener("drop", function (e) {
    e.preventDefault(); zone.classList.remove("drag");
    if (e.dataTransfer.files[0]) readFile(e.dataTransfer.files[0]);
  });
  input.addEventListener("change", function (e) {
    if (e.target.files[0]) readFile(e.target.files[0]);
  });

  function readFile(file) {
    var reader = new FileReader();
    reader.onload = function (e) { runAnalysis(e.target.result, file.name); };
    reader.readAsText(file, "utf-8");
  }

  // ── Meta chips ───────────────────────────────────────────
  function setMeta(content, filename) {
    var ext   = filename.split(".").pop().toUpperCase();
    var lines = (content.match(/[\\n]/g) || []).length;
    document.getElementById("cFormat").textContent = ext;
    document.getElementById("cSize").textContent   = content.length.toLocaleString() + " ch";
    document.getElementById("cLines").textContent  = lines.toLocaleString();
    document.getElementById("cLang").textContent   = "Detecting…";
  }

  // ── Tabs ─────────────────────────────────────────────────
  document.querySelectorAll(".tab-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var tab = btn.getAttribute("data-tab");
      document.querySelectorAll(".tab-btn").forEach(function (b) { b.classList.remove("active"); });
      document.querySelectorAll(".tab-pane").forEach(function (p) { p.classList.remove("active"); });
      btn.classList.add("active");
      var pane = document.getElementById("pane-" + tab);
      if (pane) pane.classList.add("active");
    });
  });

  // ── Quick chat buttons ───────────────────────────────────
  document.getElementById("qTranslate").addEventListener("click", function () {
    quickAsk("Translate the entire document to English. Give me the complete translation, section by section.");
  });
  document.getElementById("qSummary").addEventListener("click", function () {
    quickAsk("Give me exactly 5 bullet points summarizing the most important things in this document.");
  });
  document.getElementById("qRisks").addEventListener("click", function () {
    quickAsk("What are all the risks, problems, concerns, and red flags in this document? List every one.");
  });
  document.getElementById("qActions").addEventListener("click", function () {
    quickAsk("List all action items and decisions from this document. Who is responsible for each?");
  });
  document.getElementById("qFinancial").addEventListener("click", function () {
    quickAsk("Explain all the financial figures in this document in plain English. What do the numbers mean for the business?");
  });
  document.getElementById("qExec").addEventListener("click", function () {
    quickAsk("Write a professional executive summary of this document with sections: Overview, Key Findings, Financial Highlights, Actions Required, and Recommendations.");
  });

  function quickAsk(prompt) {
    if (!state.payload) return;
    document.getElementById("chatInput").value = prompt;
    sendChat();
  }

  // ── Send chat button ─────────────────────────────────────
  document.getElementById("sendBtn").addEventListener("click", sendChat);
  document.getElementById("chatInput").addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); }
  });

  // ── Main analysis ────────────────────────────────────────
  async function runAnalysis(content, filename) {
    state.payload    = null;
    state.dissection = "";
    state.history    = [];

    document.getElementById("chatMessages").innerHTML   = "";
    document.getElementById("dissectionText").textContent = "";
    document.getElementById("toolLog").innerHTML        = "";
    document.getElementById("toolCard").style.display  = "none";
    document.getElementById("results").classList.remove("hidden");

    setMeta(content, filename);
    document.getElementById("dissectPill").className  = "status-pill loading";
    document.getElementById("dissectPill").innerHTML  = '<span class="pulse"></span> Streaming…';
    document.getElementById("cStatus").innerHTML      = '<span class="spinner"></span>&nbsp;Analyzing…';

    // Phase 1 + Phase 2 in parallel
    var p1 = streamDissection(content, filename);
    var p2 = analyzeDoc(content, filename);

    await Promise.all([p1, p2]);

    document.getElementById("cStatus").className = "chip chip-ok";
    document.getElementById("cStatus").textContent = "✓ Complete";
  }

  // ── Phase 1: streaming dissection ───────────────────────
  async function streamDissection(content, filename) {
    try {
      var resp = await fetch("/api/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content, filename: filename, model: getModel() }),
      });

      var reader  = resp.body.getReader();
      var decoder = new TextDecoder();
      var buf     = "";
      var full    = "";

      while (true) {
        var chunk = await reader.read();
        if (chunk.done) break;
        buf += decoder.decode(chunk.value, { stream: true });
        var newline = 10; // char code for newline
        var lines   = buf.split("\\n");
        buf = lines.pop();

        for (var i = 0; i < lines.length; i++) {
          var line = lines[i];
          if (line.slice(0, 6) !== "data: ") continue;
          var raw = line.slice(6).trim();
          if (raw === "[DONE]") break;
          try {
            var obj = JSON.parse(raw);
            if (obj.response) {
              full += obj.response;
              document.getElementById("dissectionText").textContent = full;
            }
          } catch (e) {}
        }
      }

      state.dissection = full;
      document.getElementById("dissectPill").className = "status-pill done";
      document.getElementById("dissectPill").textContent = "✓ Complete";
    } catch (err) {
      document.getElementById("dissectPill").className = "status-pill error";
      document.getElementById("dissectPill").textContent = "Error: " + err.message;
    }
  }

  // ── Phase 2: structured extraction ──────────────────────
  async function analyzeDoc(content, filename) {
    try {
      var resp = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content, filename: filename, model: getModel() }),
      });
      var data = await resp.json();

      document.getElementById("cLang").textContent = data.docLanguage || "—";
      if (data.translationNote) {
        document.getElementById("cLang").textContent += " → " + data.translationNote;
      }

      renderToolLog(data.toolLog || []);

      if (data.payload) {
        state.payload = data.payload;
        renderPayload(data.payload);
      }
    } catch (err) {
      document.getElementById("cStatus").className   = "chip chip-warn";
      document.getElementById("cStatus").textContent = "Extraction error";
    }
  }

  // ── Render tool log ──────────────────────────────────────
  function renderToolLog(calls) {
    if (!calls.length) return;
    document.getElementById("toolCard").style.display = "";

    var ok   = calls.filter(function (c) { return c.status === "ok"; }).length;
    var warn = calls.filter(function (c) { return c.status === "warn"; }).length;
    var miss = calls.filter(function (c) { return c.status === "not_found"; }).length;
    document.getElementById("toolStats").textContent =
      ok + " ok  " + (warn ? warn + " warn  " : "") + (miss ? miss + " miss" : "");

    var html = "";
    calls.forEach(function (c) {
      var iconClass = c.status === "ok" ? "tl-ok" : c.status === "warn" ? "tl-warn" : "tl-err";
      var icon = c.status === "ok" ? "✔" : c.status === "warn" ? "⚠" : "✕";
      html += "<div class=\\"tl-item\\">";
      html += "<span class=\\"tl-icon " + iconClass + "\\">" + icon + "<\/span>";
      html += "<span class=\\"tl-name\\">" + esc(c.tool) + "<\/span>";
      html += "<span class=\\"tl-ts\\">" + esc(c.ts || "") + "<\/span>";
      html += "<\/div>";
    });
    document.getElementById("toolLog").innerHTML = html;
  }

  // ── Render payload ───────────────────────────────────────
  function renderPayload(p) {
    renderFinancial(p);
    renderEntities(p);
    renderInsights(p);
    renderActions(p);
    renderRaw(p);
  }

  function renderFinancial(p) {
    var m = p.metrics;
    var c = p.currency || "USD";
    var gross = Math.round(m.orders * m.aov * 100) / 100;

    document.getElementById("mOrders").textContent =
      m.orders ? m.orders.toLocaleString() : "—";
    document.getElementById("mAov").textContent =
      m.aov ? c + " " + m.aov.toFixed(2) : "—";
    document.getElementById("mDiscount").textContent =
      m.discount_cost ? c + " " + m.discount_cost.toFixed(2) : "—";

    var alertEl = document.getElementById("revenueAlert");
    if (m.math_anomaly_detected) {
      alertEl.innerHTML =
        "<div class=\\"alert warn\\">" +
        "⚠️ Math anomaly &mdash; Reported: " + c + " " + m.reported_revenue.toFixed(2) +
        " &nbsp;•&nbsp; Calculated: " + c + " " + m.calculated_revenue.toFixed(2) +
        " &nbsp;•&nbsp; Diff: " + c + " " + Math.abs(m.calculated_revenue - m.reported_revenue).toFixed(2) +
        "<\/div>";
    } else if (m.calculated_revenue > 0) {
      alertEl.innerHTML =
        "<div class=\\"alert ok\\">" +
        "✔ Net Revenue: <strong>" + c + " " + m.calculated_revenue.toFixed(2) + "<\/strong> &mdash; Math verified" +
        "<\/div>";
    } else {
      alertEl.innerHTML = "<div class=\\"alert ok\\">No financial figures detected in this document.<\/div>";
    }

    renderChart(m, c, gross);
  }

  var chartInst = null;
  function renderChart(m, c, gross) {
    if (chartInst) { chartInst.destroy(); chartInst = null; }
    if (m.orders === 0 && m.aov === 0 && m.calculated_revenue === 0) return;

    var ctx = document.getElementById("chartRevenue").getContext("2d");
    chartInst = new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["Gross Revenue", "Discount Cost", "Net Revenue"],
        datasets: [{
          data: [gross, m.discount_cost, m.calculated_revenue],
          backgroundColor: ["rgba(16,185,129,0.6)", "rgba(239,68,68,0.6)", "rgba(79,70,229,0.6)"],
          borderColor:     ["#10b981", "#ef4444", "#818cf8"],
          borderWidth: 1,
          borderRadius: 6,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function (ctx) {
                return " " + c + " " + ctx.parsed.y.toLocaleString(undefined, { minimumFractionDigits: 2 });
              }
            }
          }
        },
        scales: {
          x: { grid: { color: "rgba(255,255,255,0.05)" }, ticks: { color: "#6868a0" } },
          y: {
            grid: { color: "rgba(255,255,255,0.05)" },
            ticks: { color: "#6868a0", callback: function (v) { return c + " " + v.toLocaleString(); } }
          },
        },
      },
    });
  }

  function renderEntities(p) {
    var e   = p.entities || {};
    var html = "";
    if (e.people && e.people.length) {
      html += "<div class=\\"entity-group\\"><div class=\\"entity-group-label\\">People<\/div><div class=\\"tag-list\\">";
      e.people.forEach(function (x) { html += "<span class=\\"tag\\">" + esc(x) + "<\/span>"; });
      html += "<\/div><\/div>";
    }
    if (e.organizations && e.organizations.length) {
      html += "<div class=\\"entity-group\\"><div class=\\"entity-group-label\\">Organizations<\/div><div class=\\"tag-list\\">";
      e.organizations.forEach(function (x) { html += "<span class=\\"tag\\">" + esc(x) + "<\/span>"; });
      html += "<\/div><\/div>";
    }
    if (e.dates && e.dates.length) {
      html += "<div class=\\"entity-group\\"><div class=\\"entity-group-label\\">Dates &amp; Periods<\/div><div class=\\"tag-list\\">";
      e.dates.forEach(function (x) { html += "<span class=\\"tag\\">" + esc(x) + "<\/span>"; });
      html += "<\/div><\/div>";
    }
    if (!html) html = "<p class=\\"empty-note\\">No named entities detected.<\/p>";
    document.getElementById("entitiesContent").innerHTML = html;
  }

  function renderInsights(p) {
    var html = "";

    if (p.key_decisions && p.key_decisions.length) {
      html += "<div class=\\"entity-group-label\\" style=\\"margin-bottom:8px\\">Decisions Made<\/div>";
      p.key_decisions.forEach(function (d) {
        html += "<div class=\\"list-item decision\\"><span class=\\"list-bullet\\">▶<\/span><span>" + esc(d) + "<\/span><\/div>";
      });
    }
    if (p.action_items && p.action_items.length) {
      html += "<div class=\\"entity-group-label\\" style=\\"margin: 14px 0 8px\\">Action Items<\/div>";
      p.action_items.forEach(function (a) {
        html += "<div class=\\"list-item action\\"><span class=\\"list-bullet\\">✓<\/span><span>" + esc(a) + "<\/span><\/div>";
      });
    }
    if (p.risks && p.risks.length) {
      html += "<div class=\\"entity-group-label\\" style=\\"margin: 14px 0 8px\\">Risks &amp; Concerns<\/div>";
      p.risks.forEach(function (r) {
        html += "<div class=\\"list-item risk\\"><span class=\\"list-bullet\\">⚠<\/span><span>" + esc(r) + "<\/span><\/div>";
      });
    }
    if (!html) html = "<p class=\\"empty-note\\">No decisions, action items, or risks detected.<\/p>";
    document.getElementById("insightsContent").innerHTML = html;
  }

  function renderActions(p) {
    var html = "";
    (p.actions_taken || []).forEach(function (a) {
      var cls = "none";
      if (a.slice(0, 8) === "MODIFIED") cls = "modified";
      else if (a.slice(0, 4) === "SENT") cls = "sent";
      else if (a.slice(0, 6) === "ACTION") cls = "other";
      html += "<div class=\\"action-card " + cls + "\\">" + esc(a) + "<\/div>";
    });
    if (!html) html = "<p class=\\"empty-note\\">No integration actions detected.<\/p>";
    document.getElementById("actionsContent").innerHTML = html;
  }

  function renderRaw(p) {
    document.getElementById("rawEmail").textContent = p.extracted_copy.email || "—";
    document.getElementById("rawSms").textContent   = p.extracted_copy.sms   || "—";
    document.getElementById("rawJson").textContent  = JSON.stringify(p, null, 2);
  }

  // ── Chat ─────────────────────────────────────────────────
  async function sendChat() {
    if (!state.payload) return;
    var input = document.getElementById("chatInput");
    var msg   = input.value.trim();
    if (!msg) return;

    input.value = "";
    appendMsg("user", msg);
    state.history.push({ role: "user", content: msg });
    document.getElementById("sendBtn").disabled = true;

    try {
      var resp = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message:    msg,
          payload:    state.payload,
          dissection: state.dissection,
          history:    state.history,
          model:      getModel(),
        }),
      });
      var data  = await resp.json();
      var reply = data.reply || "";
      appendMsg("assistant", reply);
      state.history.push({ role: "assistant", content: reply });
    } catch (err) {
      appendMsg("assistant", "Error: " + err.message);
    }

    document.getElementById("sendBtn").disabled = false;
  }

  function appendMsg(role, text) {
    var box = document.getElementById("chatMessages");
    var div = document.createElement("div");
    div.className   = "msg " + role;
    div.textContent = text;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
  }

  // ── Escape HTML ──────────────────────────────────────────
  function esc(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

})();
`;
}
