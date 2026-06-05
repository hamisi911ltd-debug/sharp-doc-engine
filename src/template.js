export function getHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Sharp Business Document Engine</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"><\/script>
<style>
:root{
  --bg:#0d0d14;--surface:#13131f;--card:#1a1a2e;--border:#252542;
  --text:#e2e2f4;--muted:#8080a8;--accent:#7c3aed;--accent2:#a78bfa;
  --green:#22c55e;--red:#ef4444;--yellow:#f59e0b;--blue:#3b82f6;
  --font:'Inter',system-ui,sans-serif;
}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--bg);color:var(--text);font-family:var(--font);min-height:100vh;line-height:1.6}
a{color:var(--accent2)}
h1{font-size:1.6rem;font-weight:700;letter-spacing:-.5px}
h2{font-size:1.1rem;font-weight:600}
h3{font-size:.95rem;font-weight:600}
.container{max-width:1400px;margin:0 auto;padding:24px 20px}

/* Header */
.header{display:flex;align-items:center;justify-content:space-between;
  padding:20px 0 24px;border-bottom:1px solid var(--border);margin-bottom:28px;flex-wrap:wrap;gap:12px}
.header-left h1 span{color:var(--accent2)}
.header-left p{color:var(--muted);font-size:.85rem;margin-top:2px}
.model-select{background:var(--card);border:1px solid var(--border);color:var(--text);
  padding:8px 12px;border-radius:8px;font-family:var(--font);font-size:.85rem;cursor:pointer}
.model-select:focus{outline:2px solid var(--accent);outline-offset:2px}

/* Upload */
.upload-zone{border:2px dashed var(--border);border-radius:12px;padding:48px 24px;
  text-align:center;cursor:pointer;transition:all .2s;background:var(--surface)}
.upload-zone:hover,.upload-zone.drag{border-color:var(--accent);background:rgba(124,58,237,.06)}
.upload-zone svg{color:var(--accent2);margin-bottom:12px}
.upload-zone p{color:var(--muted);font-size:.9rem}
.upload-zone strong{color:var(--text)}
.file-types{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin-top:12px}
.file-type{background:rgba(124,58,237,.15);color:var(--accent2);
  border-radius:4px;padding:2px 8px;font-size:.75rem;font-weight:500}
#fileInput{display:none}

/* Meta badges */
.meta-bar{display:flex;gap:12px;flex-wrap:wrap;margin:24px 0 20px}
.meta-badge{background:var(--card);border:1px solid var(--border);border-radius:8px;
  padding:10px 16px;flex:1;min-width:120px}
.meta-badge .label{font-size:.7rem;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px}
.meta-badge .value{font-size:1.1rem;font-weight:600}

/* Phase cards */
.phase{background:var(--card);border:1px solid var(--border);border-radius:12px;margin-bottom:16px;overflow:hidden}
.phase-header{display:flex;align-items:center;justify-content:space-between;
  padding:16px 20px;cursor:pointer;user-select:none}
.phase-header:hover{background:rgba(255,255,255,.03)}
.phase-title{display:flex;align-items:center;gap:10px}
.phase-num{width:26px;height:26px;border-radius:50%;background:var(--accent);
  display:flex;align-items:center;justify-content:center;font-size:.75rem;font-weight:700}
.phase-body{padding:0 20px;max-height:0;overflow:hidden;transition:max-height .3s ease,padding .2s}
.phase-body.open{max-height:9999px;padding:4px 20px 20px}
.chevron{transition:transform .25s;color:var(--muted)}
.chevron.open{transform:rotate(180deg)}

/* Reasoning stream */
#reasoningText{font-size:.88rem;line-height:1.75;color:var(--text);white-space:pre-wrap}
#reasoningText h1,#reasoningText h2,#reasoningText h3{color:var(--accent2);margin:12px 0 4px}
#reasoningText strong{color:var(--text)}

/* Tool log */
.tool-call{border:1px solid var(--border);border-radius:8px;margin-bottom:8px;overflow:hidden}
.tool-call-header{display:flex;align-items:center;gap:8px;padding:10px 14px;
  background:rgba(255,255,255,.02);font-size:.82rem;cursor:pointer}
.tool-call-body{display:none;padding:12px 14px;border-top:1px solid var(--border)}
.tool-call-body.open{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.tool-call-body pre{background:var(--bg);border-radius:6px;padding:8px;font-size:.75rem;
  overflow-x:auto;color:var(--accent2);white-space:pre-wrap}
.badge-ok{background:rgba(34,197,94,.15);color:var(--green);padding:2px 8px;border-radius:4px;font-size:.72rem;font-weight:600}
.badge-warn{background:rgba(245,158,11,.15);color:var(--yellow);padding:2px 8px;border-radius:4px;font-size:.72rem;font-weight:600}
.badge-err{background:rgba(239,68,68,.15);color:var(--red);padding:2px 8px;border-radius:4px;font-size:.72rem;font-weight:600}
.tool-stats{display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap}

/* Phase 3 layout */
.phase3-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px}
@media(max-width:900px){.phase3-grid{grid-template-columns:1fr}}

/* Tabs */
.tabs{display:flex;gap:0;border-bottom:1px solid var(--border);margin-bottom:20px}
.tab{padding:10px 18px;font-size:.85rem;font-weight:500;color:var(--muted);
  cursor:pointer;border-bottom:2px solid transparent;transition:all .15s}
.tab:hover{color:var(--text)}
.tab.active{color:var(--accent2);border-bottom-color:var(--accent2)}
.tab-panel{display:none}
.tab-panel.active{display:block}

/* Metrics */
.metrics-row{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px}
.metric{background:var(--surface);border-radius:8px;padding:14px}
.metric .mlabel{font-size:.72rem;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px}
.metric .mval{font-size:1.3rem;font-weight:700}
.alert-box{border-radius:8px;padding:12px 16px;font-size:.85rem;margin-bottom:16px}
.alert-error{background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.3);color:#fca5a5}
.alert-success{background:rgba(34,197,94,.12);border:1px solid rgba(34,197,94,.3);color:#86efac}

/* Charts */
.chart-wrap{position:relative;height:280px;margin:16px 0}

/* Actions */
.action-item{padding:10px 14px;border-radius:8px;margin-bottom:8px;font-size:.85rem}
.action-modified{background:rgba(245,158,11,.12);border:1px solid rgba(245,158,11,.3);color:#fcd34d}
.action-sent{background:rgba(59,130,246,.12);border:1px solid rgba(59,130,246,.3);color:#93c5fd}
.action-none{background:rgba(255,255,255,.04);border:1px solid var(--border);color:var(--muted)}
.action-other{background:rgba(124,58,237,.12);border:1px solid rgba(124,58,237,.3);color:var(--accent2)}

/* Raw assets */
.code-block{background:var(--bg);border:1px solid var(--border);border-radius:8px;
  padding:14px;font-family:monospace;font-size:.8rem;white-space:pre-wrap;
  color:var(--accent2);overflow-x:auto;max-height:200px;overflow-y:auto;margin-bottom:16px}
.section-label{font-size:.75rem;font-weight:600;color:var(--muted);
  text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px}

/* Chatbot */
.chat-panel{background:var(--card);border:1px solid var(--border);border-radius:12px;
  display:flex;flex-direction:column;height:620px}
.chat-header{padding:16px 20px;border-bottom:1px solid var(--border)}
.chat-messages{flex:1;overflow-y:auto;padding:16px 20px;display:flex;flex-direction:column;gap:10px}
.chat-msg{max-width:85%;padding:10px 14px;border-radius:10px;font-size:.85rem;line-height:1.6}
.chat-msg.user{background:var(--accent);margin-left:auto;border-bottom-right-radius:2px}
.chat-msg.assistant{background:var(--surface);border:1px solid var(--border);border-bottom-left-radius:2px}
.chat-input-row{display:flex;gap:8px;padding:14px 16px;border-top:1px solid var(--border)}
.chat-input{flex:1;background:var(--surface);border:1px solid var(--border);
  color:var(--text);border-radius:8px;padding:10px 14px;font-family:var(--font);
  font-size:.85rem;resize:none;min-height:42px}
.chat-input:focus{outline:2px solid var(--accent);outline-offset:1px}
.btn{padding:10px 18px;border:none;border-radius:8px;cursor:pointer;
  font-family:var(--font);font-size:.85rem;font-weight:500;transition:opacity .15s}
.btn:hover{opacity:.85}
.btn-primary{background:var(--accent);color:#fff}
.btn-secondary{background:var(--surface);color:var(--text);border:1px solid var(--border)}
.btn-full{width:100%;margin-bottom:10px}
.btn:disabled{opacity:.4;cursor:not-allowed}

/* Spinner */
.spinner{display:inline-block;width:16px;height:16px;border:2px solid rgba(255,255,255,.2);
  border-top-color:var(--accent2);border-radius:50%;animation:spin .7s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}

/* Hidden */
.hidden{display:none!important}

/* Scrollbar */
::-webkit-scrollbar{width:6px;height:6px}
::-webkit-scrollbar-track{background:var(--bg)}
::-webkit-scrollbar-thumb{background:var(--border);border-radius:3px}
</style>
</head>
<body>
<div class="container">

  <!-- Header -->
  <div class="header">
    <div class="header-left">
      <h1>Sharp <span>Business Document Engine</span></h1>
      <p>Any document &middot; Any language &middot; Cloudflare Workers AI &middot; Fully cloud-native</p>
    </div>
    <select class="model-select" id="modelSelect">
      <option value="@cf/meta/llama-3.1-8b-instruct">llama-3.1-8b-instruct (default)</option>
      <option value="@cf/meta/llama-3.3-70b-instruct-fp8-fast">llama-3.3-70b-fp8-fast (powerful)</option>
      <option value="@cf/mistral/mistral-7b-instruct-v0.1">mistral-7b-instruct</option>
      <option value="@cf/google/gemma-7b-it">gemma-7b-it</option>
    </select>
  </div>

  <!-- Upload -->
  <div class="upload-zone" id="uploadZone">
    <svg width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
      <path d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/>
    </svg>
    <p><strong>Drop a business document here</strong> or click to upload</p>
    <p>Transcript &middot; CSV &middot; JSON &middot; Log &middot; Email &middot; Code &middot; Any language</p>
    <div class="file-types">
      <span class="file-type">txt</span><span class="file-type">csv</span>
      <span class="file-type">json</span><span class="file-type">md</span>
      <span class="file-type">log</span><span class="file-type">py</span>
      <span class="file-type">js</span><span class="file-type">ts</span>
      <span class="file-type">sql</span>
    </div>
    <input type="file" id="fileInput" accept=".txt,.log,.json,.md,.csv,.py,.js,.ts,.jsx,.tsx,.sql">
  </div>

  <!-- Results (hidden until file uploaded) -->
  <div id="results" class="hidden">

    <!-- Meta badges -->
    <div class="meta-bar">
      <div class="meta-badge"><div class="label">Format</div><div class="value" id="mFormat">—</div></div>
      <div class="meta-badge"><div class="label">Size</div><div class="value" id="mSize">—</div></div>
      <div class="meta-badge"><div class="label">Lines</div><div class="value" id="mLines">—</div></div>
      <div class="meta-badge"><div class="label">Language</div><div class="value" id="mLang">Detecting…</div></div>
    </div>

    <!-- Phase 1 -->
    <div class="phase">
      <div class="phase-header" onclick="togglePhase('p1')">
        <div class="phase-title">
          <div class="phase-num">1</div>
          <div>
            <h2>Context Reasoning</h2>
            <p style="font-size:.78rem;color:var(--muted);margin-top:1px">LLM streams step-by-step analysis before extraction</p>
          </div>
        </div>
        <svg class="chevron" id="chevron-p1" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 9l-7 7-7-7"/></svg>
      </div>
      <div class="phase-body" id="body-p1">
        <div id="reasoningLoader" style="display:flex;align-items:center;gap:8px;color:var(--muted);font-size:.85rem;padding:8px 0">
          <span class="spinner"></span> Streaming reasoning…
        </div>
        <div id="reasoningText"></div>
      </div>
    </div>

    <!-- Phase 2 -->
    <div class="phase">
      <div class="phase-header" onclick="togglePhase('p2')">
        <div class="phase-title">
          <div class="phase-num">2</div>
          <div>
            <h2>Structured Extraction</h2>
            <p style="font-size:.78rem;color:var(--muted);margin-top:1px" id="p2Subtitle">Running tool calls…</p>
          </div>
        </div>
        <svg class="chevron" id="chevron-p2" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 9l-7 7-7-7"/></svg>
      </div>
      <div class="phase-body" id="body-p2">
        <div id="toolLogContainer"></div>
        <div id="docSummary" class="hidden" style="margin-top:14px;padding:14px;background:var(--surface);border-radius:8px;font-size:.85rem;line-height:1.7"></div>
      </div>
    </div>

    <!-- Phase 3 -->
    <div id="phase3Section" class="hidden">
      <div class="phase">
        <div class="phase-header" onclick="togglePhase('p3')">
          <div class="phase-title">
            <div class="phase-num">3</div>
            <div>
              <h2>Verified Payload</h2>
              <p style="font-size:.78rem;color:var(--muted);margin-top:1px">Financial audit &middot; Charts &middot; Chatbot</p>
            </div>
          </div>
          <svg class="chevron open" id="chevron-p3" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 9l-7 7-7-7"/></svg>
        </div>
        <div class="phase-body open" id="body-p3">
          <div class="phase3-grid">

            <!-- LEFT: visualizer -->
            <div>
              <div class="tabs">
                <div class="tab active" onclick="switchTab('financial')">Financial Audit</div>
                <div class="tab" onclick="switchTab('actions')">Integration Actions</div>
                <div class="tab" onclick="switchTab('assets')">Raw Assets</div>
              </div>

              <!-- Financial tab -->
              <div class="tab-panel active" id="tab-financial">
                <div class="metrics-row">
                  <div class="metric"><div class="mlabel">Orders</div><div class="mval" id="mOrders">—</div></div>
                  <div class="metric"><div class="mlabel">AOV</div><div class="mval" id="mAov">—</div></div>
                  <div class="metric"><div class="mlabel">Discount Cost</div><div class="mval" id="mDiscount">—</div></div>
                </div>
                <div id="revenueAlert"></div>
                <div class="chart-wrap"><canvas id="chartWaterfall"></canvas></div>
                <div class="chart-wrap" id="donutWrap" style="height:220px"><canvas id="chartDonut"></canvas></div>
              </div>

              <!-- Actions tab -->
              <div class="tab-panel" id="tab-actions">
                <div id="actionsContainer"></div>
              </div>

              <!-- Assets tab -->
              <div class="tab-panel" id="tab-assets">
                <div class="section-label">Extracted Email Copy</div>
                <div class="code-block" id="emailCopy">—</div>
                <div class="section-label">Extracted SMS Copy</div>
                <div class="code-block" id="smsCopy">—</div>
                <div class="section-label">Full JSON Payload</div>
                <div class="code-block" id="jsonPayload" style="max-height:320px">—</div>
              </div>
            </div>

            <!-- RIGHT: chatbot -->
            <div class="chat-panel">
              <div class="chat-header">
                <h2>Local Presentation Chatbot</h2>
                <p style="font-size:.78rem;color:var(--muted);margin-top:2px">Powered by Workers AI &middot; Streaming &middot; Cloud-native</p>
              </div>
              <div style="padding:12px 16px;border-bottom:1px solid var(--border)">
                <button class="btn btn-primary btn-full" id="execBtn" onclick="generateExecSummary()">
                  Generate Executive Summary
                </button>
              </div>
              <div class="chat-messages" id="chatMessages"></div>
              <div class="chat-input-row">
                <textarea class="chat-input" id="chatInput" rows="1"
                  placeholder="Ask about the data… (any language)"
                  onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();sendChat()}"></textarea>
                <button class="btn btn-primary" id="chatSendBtn" onclick="sendChat()">Send</button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>

  </div><!-- /results -->

</div><!-- /container -->

<script>
var currentPayload = null;
var chatHistory    = [];
var waterfallChart = null;
var donutChart     = null;

function getModel() { return document.getElementById('modelSelect').value; }

// ── Upload ────────────────────────────────────────────────────────────────────
var zone = document.getElementById('uploadZone');
zone.addEventListener('click', function() { document.getElementById('fileInput').click(); });
zone.addEventListener('dragover', function(e) { e.preventDefault(); zone.classList.add('drag'); });
zone.addEventListener('dragleave', function() { zone.classList.remove('drag'); });
zone.addEventListener('drop', function(e) {
  e.preventDefault(); zone.classList.remove('drag');
  if (e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]);
});
document.getElementById('fileInput').addEventListener('change', function(e) {
  if (e.target.files[0]) processFile(e.target.files[0]);
});

function processFile(file) {
  var reader = new FileReader();
  reader.onload = function(e) { runAnalysis(e.target.result, file.name); };
  reader.readAsText(file, 'utf-8');
}

// ── Meta badges ───────────────────────────────────────────────────────────────
function setMeta(content, filename) {
  var ext = filename.split('.').pop().toUpperCase();
  document.getElementById('mFormat').textContent  = ext;
  document.getElementById('mSize').textContent    = content.length.toLocaleString() + ' ch';
  document.getElementById('mLines').textContent   = (content.match(/\\n/g)||[]).length.toLocaleString();
  document.getElementById('mLang').textContent    = 'Detecting…';
}

// ── Toggle phase collapse ─────────────────────────────────────────────────────
function togglePhase(id) {
  var body    = document.getElementById('body-' + id);
  var chevron = document.getElementById('chevron-' + id);
  body.classList.toggle('open');
  chevron.classList.toggle('open');
}

function openPhase(id) {
  document.getElementById('body-'    + id).classList.add('open');
  document.getElementById('chevron-' + id).classList.add('open');
}

// ── Tab switching ─────────────────────────────────────────────────────────────
function switchTab(name) {
  document.querySelectorAll('.tab').forEach(function(t, i) {
    var names = ['financial','actions','assets'];
    t.classList.toggle('active', names[i] === name);
  });
  document.querySelectorAll('.tab-panel').forEach(function(p) {
    p.classList.toggle('active', p.id === 'tab-' + name);
  });
}

// ── Main analysis flow ────────────────────────────────────────────────────────
async function runAnalysis(content, filename) {
  currentPayload = null;
  chatHistory    = [];
  document.getElementById('chatMessages').innerHTML = '';
  document.getElementById('reasoningText').textContent = '';
  document.getElementById('toolLogContainer').innerHTML = '';
  document.getElementById('docSummary').classList.add('hidden');
  document.getElementById('phase3Section').classList.add('hidden');
  document.getElementById('results').classList.remove('hidden');
  document.getElementById('mLang').textContent = 'Detecting…';
  document.getElementById('p2Subtitle').textContent = 'Running tool calls…';
  document.getElementById('reasoningLoader').style.display = 'flex';

  setMeta(content, filename);
  openPhase('p1');
  openPhase('p2');

  // Phase 1 — stream reasoning
  try {
    var resp = await fetch('/api/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: content, filename: filename, model: getModel() }),
    });
    document.getElementById('reasoningLoader').style.display = 'none';
    var reader  = resp.body.getReader();
    var decoder = new TextDecoder();
    var buf     = '';
    while (true) {
      var chunk = await reader.read();
      if (chunk.done) break;
      buf += decoder.decode(chunk.value, { stream: true });
      var lines = buf.split('\\n');
      buf = lines.pop();
      for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        if (!line.startsWith('data: ')) continue;
        var raw = line.slice(6).trim();
        if (raw === '[DONE]') break;
        try {
          var obj = JSON.parse(raw);
          if (obj.response) {
            document.getElementById('reasoningText').textContent += obj.response;
          }
        } catch(e) {}
      }
    }
  } catch(e) {
    document.getElementById('reasoningLoader').style.display = 'none';
    document.getElementById('reasoningText').textContent = 'Reasoning unavailable: ' + e.message;
  }

  // Phase 2 — structured extraction
  try {
    var r2 = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: content, filename: filename, model: getModel() }),
    });
    var data = await r2.json();

    document.getElementById('mLang').textContent = data.docLanguage || '—';
    renderToolLog(data.toolLog || []);
    document.getElementById('p2Subtitle').textContent =
      (data.toolLog||[]).length + ' tool calls' +
      (data.usedFallback ? ' (regex fallback)' : ' via Workers AI');

    if (data.readable) {
      var s = document.getElementById('docSummary');
      s.textContent = data.readable;
      s.classList.remove('hidden');
    }

    if (data.payload) {
      currentPayload = data.payload;
      renderPayload(data.payload);
      document.getElementById('phase3Section').classList.remove('hidden');
    }
  } catch(e) {
    document.getElementById('p2Subtitle').textContent = 'Extraction failed: ' + e.message;
  }
}

// ── Tool log ──────────────────────────────────────────────────────────────────
function renderToolLog(calls) {
  var ok   = calls.filter(function(c) { return c.status === 'ok'; }).length;
  var warn = calls.filter(function(c) { return c.status === 'warn'; }).length;
  var miss = calls.filter(function(c) { return c.status === 'not_found'; }).length;

  var html = '<div class="tool-stats">' +
    '<span class="badge-ok">OK ' + ok + '</span>' +
    (warn ? '<span class="badge-warn">WARN ' + warn + '</span>' : '') +
    (miss ? '<span class="badge-err">MISS ' + miss + '</span>' : '') +
    '</div>';

  calls.forEach(function(c, i) {
    var icon  = c.status === 'ok' ? '✅' : c.status === 'warn' ? '⚠️' : '🔴';
    var badge = c.status === 'ok' ? 'badge-ok' : c.status === 'warn' ? 'badge-warn' : 'badge-err';
    html += '<div class="tool-call">' +
      '<div class="tool-call-header" onclick="toggleTool(' + i + ')">' +
        icon + ' <strong style="font-family:monospace">' + c.tool + '</strong>' +
        '<span class="' + badge + '" style="margin-left:auto;margin-right:8px">' + c.status + '</span>' +
        '<span style="color:var(--muted);font-size:.75rem">' + (c.ts||'') + '</span>' +
      '</div>' +
      '<div class="tool-call-body" id="tc-' + i + '">' +
        '<div><div class="section-label">Inputs</div><pre>' + JSON.stringify(c.inputs, null, 2) + '</pre></div>' +
        '<div><div class="section-label">Result</div><pre>' + JSON.stringify(c.result, null, 2) + '</pre></div>' +
      '</div>' +
    '</div>';
  });

  document.getElementById('toolLogContainer').innerHTML = html;
}

function toggleTool(i) {
  var el = document.getElementById('tc-' + i);
  el.classList.toggle('open');
}

// ── Payload render ────────────────────────────────────────────────────────────
function renderPayload(p) {
  var m = p.metrics;
  var c = p.currency || 'USD';
  var gross = Math.round(m.orders * m.aov * 100) / 100;

  document.getElementById('mOrders').textContent   = m.orders.toLocaleString();
  document.getElementById('mAov').textContent      = c + ' ' + m.aov.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
  document.getElementById('mDiscount').textContent = c + ' ' + m.discount_cost.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});

  var alertEl = document.getElementById('revenueAlert');
  if (m.math_anomaly_detected) {
    alertEl.innerHTML = '<div class="alert-box alert-error">⚠️ Math anomaly detected! Reported: ' + c + ' ' +
      m.reported_revenue.toLocaleString(undefined,{minimumFractionDigits:2}) + ' &nbsp;·&nbsp; Calculated: ' + c + ' ' +
      m.calculated_revenue.toLocaleString(undefined,{minimumFractionDigits:2}) + ' &nbsp;·&nbsp; Diff: ' + c + ' ' +
      Math.abs(m.calculated_revenue - m.reported_revenue).toLocaleString(undefined,{minimumFractionDigits:2}) + '</div>';
  } else {
    alertEl.innerHTML = '<div class="alert-box alert-success">✓ Net Revenue: <strong>' + c + ' ' +
      m.calculated_revenue.toLocaleString(undefined,{minimumFractionDigits:2}) + '</strong> &middot; Math verified</div>';
  }

  renderCharts(p, gross, c);
  renderActions(p.actions_taken || []);

  document.getElementById('emailCopy').textContent = p.extracted_copy.email || '—';
  document.getElementById('smsCopy').textContent   = p.extracted_copy.sms   || '—';
  document.getElementById('jsonPayload').textContent = JSON.stringify(p, null, 2);
}

// ── Charts ────────────────────────────────────────────────────────────────────
function renderCharts(p, gross, c) {
  var m = p.metrics;

  if (waterfallChart) { waterfallChart.destroy(); waterfallChart = null; }
  if (donutChart)     { donutChart.destroy();     donutChart = null; }

  if (m.orders === 0 && m.aov === 0 && m.calculated_revenue === 0) return;

  var wCtx = document.getElementById('chartWaterfall').getContext('2d');
  waterfallChart = new Chart(wCtx, {
    type: 'bar',
    data: {
      labels: ['Gross Revenue', 'Discount Cost', 'Net Revenue'],
      datasets: [{
        data: [gross, m.discount_cost, m.calculated_revenue],
        backgroundColor: ['rgba(34,197,94,.7)', 'rgba(239,68,68,.7)', 'rgba(59,130,246,.7)'],
        borderColor:     ['#22c55e','#ef4444','#3b82f6'],
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
            label: function(ctx) { return ' ' + c + ' ' + ctx.parsed.y.toLocaleString(undefined,{minimumFractionDigits:2}); }
          }
        }
      },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,.05)' }, ticks: { color: '#8080a8' } },
        y: { grid: { color: 'rgba(255,255,255,.05)' }, ticks: { color: '#8080a8',
          callback: function(v) { return c + ' ' + v.toLocaleString(); } } },
      },
    },
  });

  if (m.discount_cost > 0) {
    document.getElementById('donutWrap').style.display = '';
    var dCtx = document.getElementById('chartDonut').getContext('2d');
    donutChart = new Chart(dCtx, {
      type: 'doughnut',
      data: {
        labels: ['Net Revenue', 'Discount Cost'],
        datasets: [{
          data: [Math.max(m.calculated_revenue, 0), m.discount_cost],
          backgroundColor: ['rgba(34,197,94,.7)','rgba(239,68,68,.7)'],
          borderColor: ['#22c55e','#ef4444'],
          borderWidth: 2,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '60%',
        plugins: {
          legend: { position: 'bottom', labels: { color: '#8080a8', padding: 16 } },
          tooltip: {
            callbacks: {
              label: function(ctx) {
                var pct = (ctx.parsed / (m.calculated_revenue + m.discount_cost) * 100).toFixed(1);
                return ' ' + c + ' ' + ctx.parsed.toLocaleString(undefined,{minimumFractionDigits:2}) + ' (' + pct + '%)';
              }
            }
          }
        },
      },
    });
  } else {
    document.getElementById('donutWrap').style.display = 'none';
  }
}

// ── Actions ───────────────────────────────────────────────────────────────────
function renderActions(actions) {
  var html = '';
  actions.forEach(function(a) {
    var cls = 'action-none';
    if (a.startsWith('MODIFIED')) cls = 'action-modified';
    else if (a.startsWith('SENT')) cls = 'action-sent';
    else if (a.startsWith('ACTION')) cls = 'action-other';
    html += '<div class="action-item ' + cls + '">' + a + '</div>';
  });
  if (!html) html = '<div class="action-item action-none">No actions detected.</div>';
  document.getElementById('actionsContainer').innerHTML = html;
}

// ── Executive summary ─────────────────────────────────────────────────────────
async function generateExecSummary() {
  if (!currentPayload) return;
  var btn = document.getElementById('execBtn');
  btn.disabled = true;
  btn.textContent = 'Generating…';

  var sysPrompt = 'You are a corporate report formatter. Convert the verified JSON payload ' +
    'into a structured executive summary with these sections:\\n' +
    '**Overview** | **Financial Highlights** | **Actions Taken** | **Key Takeaways**\\n' +
    'Use the pre-verified figures exactly — do NOT recalculate.';
  var userMsg = 'Format this into an executive report:\\n\\n' + JSON.stringify(currentPayload, null, 2);

  try {
    var resp = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: userMsg, payload: currentPayload,
        history: [{ role: 'system', content: sysPrompt }],
        model: getModel(),
      }),
    });
    var data = await resp.json();
    appendChat('assistant', data.reply || '');
  } catch(e) {
    appendChat('assistant', 'Error: ' + e.message);
  }

  btn.disabled = false;
  btn.textContent = 'Generate Executive Summary';
}

// ── Chat ──────────────────────────────────────────────────────────────────────
async function sendChat() {
  if (!currentPayload) return;
  var input = document.getElementById('chatInput');
  var msg   = input.value.trim();
  if (!msg) return;

  input.value = '';
  appendChat('user', msg);
  chatHistory.push({ role: 'user', content: msg });
  document.getElementById('chatSendBtn').disabled = true;

  try {
    var resp = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg, payload: currentPayload, history: chatHistory, model: getModel() }),
    });
    var data = await resp.json();
    var reply = data.reply || '';
    appendChat('assistant', reply);
    chatHistory.push({ role: 'assistant', content: reply });
  } catch(e) {
    appendChat('assistant', 'Error: ' + e.message);
  }

  document.getElementById('chatSendBtn').disabled = false;
}

function appendChat(role, text) {
  var box = document.getElementById('chatMessages');
  var div = document.createElement('div');
  div.className = 'chat-msg ' + role;
  div.textContent = text;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}
<\/script>
</body>
</html>`;
}
