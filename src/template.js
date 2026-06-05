export function getHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Sharp Document Engine</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"><\/script>
<style>
:root {
  --bg: #08080f;
  --surface: #0e0e1c;
  --card: #13132a;
  --border: #1d1d3a;
  --text: #dcdcf4;
  --muted: #6868a0;
  --accent: #4f46e5;
  --accent-light: #818cf8;
  --green: #10b981;
  --red: #ef4444;
  --yellow: #f59e0b;
  --blue: #3b82f6;
  --font: 'Inter', system-ui, sans-serif;
}
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { font-size: 15px; }
body { background: var(--bg); color: var(--text); font-family: var(--font); min-height: 100vh; }

/* ── Layout ─────────────────────────────────────────────── */
#app { max-width: 1440px; margin: 0 auto; padding: 20px 24px; }

/* ── Header ─────────────────────────────────────────────── */
header {
  display: flex; align-items: center; justify-content: space-between;
  padding-bottom: 20px; border-bottom: 1px solid var(--border); margin-bottom: 24px;
  flex-wrap: wrap; gap: 12px;
}
.brand { display: flex; align-items: center; gap: 12px; }
.brand-icon {
  width: 38px; height: 38px; background: var(--accent); border-radius: 10px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.brand h1 { font-size: 1.25rem; font-weight: 700; letter-spacing: -0.3px; }
.brand h1 em { font-style: normal; color: var(--accent-light); }
.brand p { font-size: 0.75rem; color: var(--muted); margin-top: 1px; }
.header-right { display: flex; align-items: center; gap: 10px; }
select {
  background: var(--card); border: 1px solid var(--border); color: var(--text);
  padding: 8px 12px; border-radius: 8px; font-family: var(--font); font-size: 0.82rem;
  cursor: pointer; outline: none; appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236868a0' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat; background-position: right 10px center; padding-right: 28px;
}
select:focus { border-color: var(--accent); }

/* ── Upload zone ────────────────────────────────────────── */
#uploadZone {
  border: 2px dashed var(--border); border-radius: 14px;
  padding: 52px 24px; text-align: center; cursor: pointer;
  transition: border-color 0.2s, background 0.2s; background: var(--surface);
  margin-bottom: 24px;
}
#uploadZone:hover, #uploadZone.drag { border-color: var(--accent); background: rgba(79,70,229,0.05); }
#uploadZone .upload-icon {
  width: 52px; height: 52px; border-radius: 14px; background: rgba(79,70,229,0.15);
  display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;
  color: var(--accent-light);
}
#uploadZone h2 { font-size: 1.1rem; font-weight: 600; margin-bottom: 6px; }
#uploadZone p { color: var(--muted); font-size: 0.85rem; margin-bottom: 14px; }
.file-chips { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; }
.file-chips span {
  background: rgba(79,70,229,0.12); color: var(--accent-light);
  border-radius: 5px; padding: 3px 9px; font-size: 0.75rem; font-weight: 500; font-family: monospace;
}

/* ── Meta row ───────────────────────────────────────────── */
#metaRow {
  display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px; align-items: center;
}
.chip {
  display: flex; align-items: center; gap: 6px;
  background: var(--card); border: 1px solid var(--border);
  border-radius: 20px; padding: 5px 12px; font-size: 0.78rem;
}
.chip .chip-label { color: var(--muted); margin-right: 2px; }
.chip .chip-val { font-weight: 600; }
.chip.chip-ok { border-color: rgba(16,185,129,0.3); color: var(--green); }
.chip.chip-warn { border-color: rgba(245,158,11,0.3); color: var(--yellow); }

/* ── Main two-column grid ───────────────────────────────── */
#mainGrid {
  display: grid; grid-template-columns: 1fr 420px; gap: 20px; align-items: start;
}
@media (max-width: 1000px) { #mainGrid { grid-template-columns: 1fr; } }

/* ── Panel cards ────────────────────────────────────────── */
.panel-card {
  background: var(--card); border: 1px solid var(--border);
  border-radius: 12px; overflow: hidden; margin-bottom: 16px;
}
.panel-card:last-child { margin-bottom: 0; }
.panel-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 18px; border-bottom: 1px solid var(--border);
}
.panel-header h2 { font-size: 0.9rem; font-weight: 600; }
.panel-body { padding: 18px; }

/* Status indicators */
.status-pill {
  font-size: 0.72rem; font-weight: 600; padding: 3px 10px; border-radius: 20px;
  display: flex; align-items: center; gap: 5px;
}
.status-pill.loading { background: rgba(79,70,229,0.15); color: var(--accent-light); }
.status-pill.done    { background: rgba(16,185,129,0.12); color: var(--green); }
.status-pill.error   { background: rgba(239,68,68,0.12);  color: var(--red); }
.pulse { width: 7px; height: 7px; border-radius: 50%; background: currentColor; animation: pulse 1.2s ease-in-out infinite; }
@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }

/* Dissection text */
#dissectionText {
  font-size: 0.86rem; line-height: 1.8; color: var(--text);
  white-space: pre-wrap; min-height: 40px;
}
#dissectionText h2, #dissectionText h3 {
  color: var(--accent-light); font-size: 0.88rem; font-weight: 600;
  margin: 16px 0 6px; letter-spacing: 0.02em;
}
#dissectionText h2:first-child { margin-top: 0; }
#dissectionText strong { color: #fff; }
#dissectionText ul { margin: 6px 0 6px 18px; }
#dissectionText li { margin-bottom: 3px; }

/* ── Tabs ───────────────────────────────────────────────── */
.tabs { display: flex; border-bottom: 1px solid var(--border); }
.tab-btn {
  padding: 11px 16px; font-size: 0.82rem; font-weight: 500; color: var(--muted);
  cursor: pointer; border: none; background: none; font-family: var(--font);
  border-bottom: 2px solid transparent; margin-bottom: -1px; transition: color 0.15s;
}
.tab-btn:hover { color: var(--text); }
.tab-btn.active { color: var(--accent-light); border-bottom-color: var(--accent-light); }
.tab-pane { display: none; padding: 18px; }
.tab-pane.active { display: block; }

/* ── Financial tab ──────────────────────────────────────── */
.metrics-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 14px; }
.metric-box { background: var(--surface); border-radius: 8px; padding: 12px 14px; }
.metric-box .m-label { font-size: 0.7rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 5px; }
.metric-box .m-val   { font-size: 1.2rem; font-weight: 700; }
.alert { border-radius: 8px; padding: 11px 14px; font-size: 0.83rem; margin-bottom: 14px; line-height: 1.5; }
.alert.ok   { background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.25); color: #6ee7b7; }
.alert.warn { background: rgba(239,68,68,0.1);  border: 1px solid rgba(239,68,68,0.25);  color: #fca5a5; }
.chart-box { height: 240px; position: relative; margin: 10px 0; }

/* ── Entities / decisions / risks ───────────────────────── */
.entity-group { margin-bottom: 14px; }
.entity-group-label {
  font-size: 0.7rem; font-weight: 600; text-transform: uppercase;
  letter-spacing: 0.08em; color: var(--muted); margin-bottom: 7px;
}
.tag-list { display: flex; flex-wrap: wrap; gap: 6px; }
.tag {
  background: rgba(79,70,229,0.1); border: 1px solid rgba(79,70,229,0.2);
  color: var(--accent-light); border-radius: 6px; padding: 3px 10px; font-size: 0.78rem;
}
.list-item {
  display: flex; gap: 8px; padding: 7px 0;
  border-bottom: 1px solid var(--border); font-size: 0.84rem; line-height: 1.5;
}
.list-item:last-child { border-bottom: none; }
.list-bullet { color: var(--accent-light); flex-shrink: 0; font-weight: 700; margin-top: 1px; }
.list-item.risk .list-bullet { color: var(--red); }
.list-item.action .list-bullet { color: var(--green); }
.list-item.decision .list-bullet { color: var(--yellow); }
.empty-note { color: var(--muted); font-size: 0.83rem; font-style: italic; }

/* Actions tab */
.action-card {
  border-radius: 8px; padding: 10px 14px; margin-bottom: 8px; font-size: 0.84rem; line-height: 1.5;
}
.action-card.modified { background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.2); color: #fcd34d; }
.action-card.sent     { background: rgba(59,130,246,0.08); border: 1px solid rgba(59,130,246,0.2); color: #93c5fd; }
.action-card.none     { background: rgba(255,255,255,0.03); border: 1px solid var(--border); color: var(--muted); }
.action-card.other    { background: rgba(79,70,229,0.08); border: 1px solid rgba(79,70,229,0.2); color: var(--accent-light); }

/* Raw tab */
.raw-label { font-size: 0.72rem; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 6px; }
.code-view {
  background: var(--bg); border: 1px solid var(--border); border-radius: 8px;
  padding: 12px; font-family: monospace; font-size: 0.78rem; color: var(--accent-light);
  white-space: pre-wrap; word-break: break-all; max-height: 220px; overflow-y: auto; margin-bottom: 14px;
}

/* Tool log */
#toolLog { margin-top: 4px; }
.tl-item {
  display: flex; align-items: flex-start; gap: 8px;
  padding: 7px 0; border-bottom: 1px solid var(--border); font-size: 0.8rem;
}
.tl-item:last-child { border-bottom: none; }
.tl-icon { flex-shrink: 0; margin-top: 1px; }
.tl-name { font-family: monospace; font-weight: 600; color: var(--text); }
.tl-ts { color: var(--muted); font-size: 0.72rem; margin-left: auto; flex-shrink: 0; }
.tl-ok   { color: var(--green); }
.tl-warn { color: var(--yellow); }
.tl-err  { color: var(--red); }

/* ── Chat panel ─────────────────────────────────────────── */
#chatPanel {
  background: var(--card); border: 1px solid var(--border);
  border-radius: 12px; display: flex; flex-direction: column;
  height: 680px; position: sticky; top: 20px;
}
.chat-head {
  padding: 14px 18px; border-bottom: 1px solid var(--border); flex-shrink: 0;
}
.chat-head h2 { font-size: 0.9rem; font-weight: 600; }
.chat-head p  { font-size: 0.75rem; color: var(--muted); margin-top: 2px; }
.quick-btns { display: flex; flex-wrap: wrap; gap: 6px; padding: 10px 14px; border-bottom: 1px solid var(--border); flex-shrink: 0; }
.quick-btn {
  background: rgba(79,70,229,0.1); border: 1px solid rgba(79,70,229,0.2);
  color: var(--accent-light); border-radius: 20px; padding: 4px 12px;
  font-size: 0.75rem; font-weight: 500; cursor: pointer; font-family: var(--font);
  transition: background 0.15s;
}
.quick-btn:hover { background: rgba(79,70,229,0.2); }
#chatMessages {
  flex: 1; overflow-y: auto; padding: 14px 16px;
  display: flex; flex-direction: column; gap: 10px;
}
.msg { max-width: 88%; padding: 10px 13px; border-radius: 10px; font-size: 0.84rem; line-height: 1.65; }
.msg.user { background: var(--accent); margin-left: auto; border-bottom-right-radius: 3px; }
.msg.assistant {
  background: var(--surface); border: 1px solid var(--border);
  border-bottom-left-radius: 3px; white-space: pre-wrap;
}
.chat-input-row {
  display: flex; gap: 8px; padding: 12px 14px;
  border-top: 1px solid var(--border); flex-shrink: 0;
}
#chatInput {
  flex: 1; background: var(--surface); border: 1px solid var(--border);
  color: var(--text); border-radius: 8px; padding: 9px 12px;
  font-family: var(--font); font-size: 0.84rem; resize: none; min-height: 40px; max-height: 100px;
}
#chatInput:focus { outline: none; border-color: var(--accent); }
#sendBtn {
  background: var(--accent); border: none; color: #fff; border-radius: 8px;
  width: 40px; height: 40px; cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: opacity 0.15s; flex-shrink: 0;
}
#sendBtn:hover { opacity: 0.85; }
#sendBtn:disabled { opacity: 0.4; cursor: not-allowed; }

/* Util */
.hidden { display: none !important; }
.spinner { display: inline-block; width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.15); border-top-color: var(--accent-light); border-radius: 50%; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
::-webkit-scrollbar { width: 5px; height: 5px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
</style>
</head>
<body>
<div id="app">

  <!-- Header -->
  <header>
    <div class="brand">
      <div class="brand-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
        </svg>
      </div>
      <div>
        <h1>Sharp <em>Document Engine</em></h1>
        <p>Any document &bull; Any language &bull; Full dissection &bull; AI-powered</p>
      </div>
    </div>
    <div class="header-right">
      <select id="modelSelect">
        <option value="@cf/meta/llama-3.1-8b-instruct">Llama 3.1 8B &mdash; Fast</option>
        <option value="@cf/meta/llama-3.3-70b-instruct-fp8-fast">Llama 3.3 70B &mdash; Powerful</option>
        <option value="@cf/mistral/mistral-7b-instruct-v0.1">Mistral 7B</option>
        <option value="@cf/google/gemma-7b-it">Gemma 7B</option>
      </select>
    </div>
  </header>

  <!-- Upload zone -->
  <div id="uploadZone">
    <input type="file" id="fileInput" accept=".txt,.log,.json,.md,.csv,.py,.js,.ts,.jsx,.tsx,.sql" style="display:none">
    <div class="upload-icon">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
        <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/>
      </svg>
    </div>
    <h2>Drop any business document here</h2>
    <p>Transcripts &bull; Reports &bull; CSV &bull; JSON &bull; Emails &bull; Logs &bull; Code &bull; Any language</p>
    <div class="file-chips">
      <span>txt</span><span>csv</span><span>json</span><span>md</span>
      <span>log</span><span>py</span><span>js</span><span>ts</span><span>sql</span>
    </div>
  </div>

  <!-- Results -->
  <div id="results" class="hidden">

    <!-- Meta chips -->
    <div id="metaRow">
      <div class="chip"><span class="chip-label">Format</span><span class="chip-val" id="cFormat">—</span></div>
      <div class="chip"><span class="chip-label">Size</span><span class="chip-val" id="cSize">—</span></div>
      <div class="chip"><span class="chip-label">Lines</span><span class="chip-val" id="cLines">—</span></div>
      <div class="chip"><span class="chip-label">Language</span><span class="chip-val" id="cLang">Detecting&hellip;</span></div>
      <div class="chip" id="cStatus"><span class="spinner"></span>&nbsp;Analyzing&hellip;</div>
    </div>

    <div id="mainGrid">

      <!-- LEFT: Analysis -->
      <div id="analysisCol">

        <!-- Dissection card -->
        <div class="panel-card">
          <div class="panel-header">
            <h2>Document Dissection</h2>
            <div class="status-pill loading" id="dissectPill">
              <span class="pulse"></span> Streaming&hellip;
            </div>
          </div>
          <div class="panel-body">
            <div id="dissectionText"></div>
          </div>
        </div>

        <!-- Data card -->
        <div class="panel-card">
          <div class="tabs">
            <button class="tab-btn active" data-tab="financial">Financial</button>
            <button class="tab-btn" data-tab="entities">Entities</button>
            <button class="tab-btn" data-tab="insights">Decisions &amp; Risks</button>
            <button class="tab-btn" data-tab="actions">Actions</button>
            <button class="tab-btn" data-tab="raw">Raw</button>
          </div>

          <div id="pane-financial" class="tab-pane active">
            <div class="metrics-3">
              <div class="metric-box"><div class="m-label">Orders</div><div class="m-val" id="mOrders">—</div></div>
              <div class="metric-box"><div class="m-label">Avg Order Value</div><div class="m-val" id="mAov">—</div></div>
              <div class="metric-box"><div class="m-label">Discount Cost</div><div class="m-val" id="mDiscount">—</div></div>
            </div>
            <div id="revenueAlert"></div>
            <div class="chart-box"><canvas id="chartRevenue"></canvas></div>
          </div>

          <div id="pane-entities" class="tab-pane">
            <div id="entitiesContent"></div>
          </div>

          <div id="pane-insights" class="tab-pane">
            <div id="insightsContent"></div>
          </div>

          <div id="pane-actions" class="tab-pane">
            <div id="actionsContent"></div>
          </div>

          <div id="pane-raw" class="tab-pane">
            <div class="raw-label">Email Copy</div>
            <div class="code-view" id="rawEmail">—</div>
            <div class="raw-label">SMS Copy</div>
            <div class="code-view" id="rawSms">—</div>
            <div class="raw-label">Full JSON Payload</div>
            <div class="code-view" id="rawJson" style="max-height:320px">—</div>
          </div>
        </div>

        <!-- Tool log card -->
        <div class="panel-card" id="toolCard" style="display:none">
          <div class="panel-header">
            <h2>Extraction Log</h2>
            <span id="toolStats" style="font-size:0.78rem;color:var(--muted)"></span>
          </div>
          <div class="panel-body" style="padding:14px 18px">
            <div id="toolLog"></div>
          </div>
        </div>

      </div>

      <!-- RIGHT: Chat -->
      <div id="chatPanel">
        <div class="chat-head">
          <h2>Ask About This Document</h2>
          <p>Translate &bull; Summarize &bull; Analyze &bull; Explain &mdash; any language</p>
        </div>
        <div class="quick-btns">
          <button class="quick-btn" id="qTranslate">Translate to English</button>
          <button class="quick-btn" id="qSummary">5-Bullet Summary</button>
          <button class="quick-btn" id="qRisks">Key Risks</button>
          <button class="quick-btn" id="qActions">Action Items</button>
          <button class="quick-btn" id="qFinancial">Explain Financials</button>
          <button class="quick-btn" id="qExec">Executive Report</button>
        </div>
        <div id="chatMessages"></div>
        <div class="chat-input-row">
          <textarea id="chatInput" rows="1" placeholder="Ask anything about this document&hellip;"></textarea>
          <button id="sendBtn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>

    </div>
  </div>
</div>
<script src="/app.js"><\/script>
</body>
</html>`;
}
