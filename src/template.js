export function getHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Sharp Document Engine</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"><\/script>
<style>
:root{
  --bg:#07070e;--s1:#0d0d1a;--s2:#121224;--s3:#181830;
  --border:#1e1e38;--border2:#282848;
  --t1:#e8e8f8;--t2:#a8a8c8;--t3:#6868a0;
  --acc:#5046e4;--acc2:#7c6ff7;--acc3:#a5a0fa;
  --green:#10b981;--red:#f04949;--yellow:#f59e0b;--blue:#3b82f6;
  --font:'Inter',system-ui,sans-serif;--mono:'JetBrains Mono',monospace;
  --radius:10px;
}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{font-size:14px;scroll-behavior:smooth}
body{background:var(--bg);color:var(--t1);font-family:var(--font);min-height:100vh;line-height:1.6}

/* ── Scrollbar ───────────────── */
::-webkit-scrollbar{width:4px;height:4px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:var(--border2);border-radius:4px}

/* ── Layout ──────────────────── */
#app{max-width:1480px;margin:0 auto;padding:18px 22px}

/* ── Header ──────────────────── */
header{
  display:flex;align-items:center;justify-content:space-between;
  padding-bottom:18px;border-bottom:1px solid var(--border);margin-bottom:22px;
  gap:12px;flex-wrap:wrap;
}
.logo{display:flex;align-items:center;gap:10px}
.logo-icon{
  width:36px;height:36px;background:linear-gradient(135deg,var(--acc),var(--acc2));
  border-radius:9px;display:flex;align-items:center;justify-content:center;flex-shrink:0;
}
.logo h1{font-size:1.15rem;font-weight:700;letter-spacing:-.3px;line-height:1.2}
.logo h1 span{color:var(--acc3)}
.logo p{font-size:.72rem;color:var(--t3);margin-top:1px}
.hdr-right{display:flex;align-items:center;gap:8px;flex-wrap:wrap}

/* ── Controls ────────────────── */
select,button.btn{
  background:var(--s2);border:1px solid var(--border2);color:var(--t1);
  padding:7px 12px;border-radius:7px;font-family:var(--font);font-size:.8rem;
  cursor:pointer;outline:none;transition:border-color .15s;
}
select{
  appearance:none;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%236868a0' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat:no-repeat;background-position:right 9px center;padding-right:26px;
}
select:focus,button.btn:hover{border-color:var(--acc)}
button.btn-primary{background:var(--acc);border-color:var(--acc);color:#fff;font-weight:500}
button.btn-primary:hover{background:var(--acc2);border-color:var(--acc2)}
button.btn-outline{background:transparent;border-color:var(--border2);color:var(--t2)}
button.btn-outline:hover{border-color:var(--acc);color:var(--acc3)}
button:disabled{opacity:.4;cursor:not-allowed!important}

/* ── Upload area ─────────────── */
.upload-wrap{display:grid;grid-template-columns:1fr;gap:14px;margin-bottom:22px}
.upload-wrap.two-col{grid-template-columns:1fr 1fr}
@media(max-width:700px){.upload-wrap.two-col{grid-template-columns:1fr}}

.upload-zone{
  border:2px dashed var(--border2);border-radius:var(--radius);
  padding:40px 20px;text-align:center;cursor:pointer;
  transition:border-color .2s,background .2s;background:var(--s1);
  position:relative;
}
.upload-zone:hover,.upload-zone.drag{border-color:var(--acc);background:rgba(80,70,228,.04)}
.upload-zone.has-file{border-color:var(--green);border-style:solid;background:rgba(16,185,129,.04)}
.upload-zone .uz-icon{
  width:44px;height:44px;border-radius:11px;background:rgba(80,70,228,.14);
  display:flex;align-items:center;justify-content:center;
  margin:0 auto 12px;color:var(--acc3);
}
.upload-zone h3{font-size:1rem;font-weight:600;margin-bottom:5px}
.upload-zone p{color:var(--t3);font-size:.8rem;margin-bottom:12px}
.file-tags{display:flex;flex-wrap:wrap;gap:5px;justify-content:center}
.file-tag{
  background:rgba(80,70,228,.1);color:var(--acc3);
  border-radius:4px;padding:2px 7px;font-size:.7rem;font-weight:500;font-family:var(--mono);
}
.file-loaded{
  display:none;flex-direction:column;align-items:center;gap:6px;
}
.upload-zone.has-file .file-loaded{display:flex}
.upload-zone.has-file .file-prompt{display:none}
.file-loaded-name{font-size:.85rem;font-weight:600;color:var(--green)}
.file-loaded-sub{font-size:.75rem;color:var(--t3)}

/* ── Meta row ────────────────── */
#metaRow{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px;align-items:center}
.chip{
  display:inline-flex;align-items:center;gap:5px;
  background:var(--s2);border:1px solid var(--border);
  border-radius:20px;padding:4px 11px;font-size:.75rem;
}
.chip .cl{color:var(--t3)}
.chip .cv{font-weight:600}
.chip.c-ok{border-color:rgba(16,185,129,.3);color:var(--green)}
.chip.c-warn{border-color:rgba(245,158,11,.3);color:var(--yellow)}
.chip.c-run{border-color:rgba(80,70,228,.3);color:var(--acc3)}

/* ── Tab bar (top-level) ──────── */
#topTabs{
  display:flex;gap:4px;border-bottom:1px solid var(--border);
  margin-bottom:20px;flex-wrap:wrap;
}
.ttab{
  padding:9px 16px;font-size:.82rem;font-weight:500;color:var(--t3);
  cursor:pointer;border:none;background:none;font-family:var(--font);
  border-bottom:2px solid transparent;margin-bottom:-1px;
  transition:color .15s;display:flex;align-items:center;gap:6px;
}
.ttab:hover{color:var(--t1)}
.ttab.active{color:var(--acc3);border-bottom-color:var(--acc)}
.ttab .badge{
  background:rgba(80,70,228,.2);color:var(--acc3);
  border-radius:10px;padding:1px 7px;font-size:.7rem;font-weight:600;
}

/* ── Main grid ───────────────── */
#mainGrid{display:grid;grid-template-columns:1fr 400px;gap:18px;align-items:start}
@media(max-width:1080px){#mainGrid{grid-template-columns:1fr}}

/* ── Cards ───────────────────── */
.card{
  background:var(--s2);border:1px solid var(--border);
  border-radius:var(--radius);overflow:hidden;margin-bottom:14px;
}
.card:last-child{margin-bottom:0}
.card-head{
  display:flex;align-items:center;justify-content:space-between;
  padding:12px 16px;border-bottom:1px solid var(--border);
}
.card-head h2{font-size:.88rem;font-weight:600;display:flex;align-items:center;gap:7px}
.card-body{padding:16px}

/* Status pill */
.spill{font-size:.72rem;font-weight:600;padding:3px 10px;border-radius:20px;display:flex;align-items:center;gap:5px}
.spill.loading{background:rgba(80,70,228,.15);color:var(--acc3)}
.spill.done{background:rgba(16,185,129,.12);color:var(--green)}
.spill.error{background:rgba(240,73,73,.12);color:var(--red)}
.pulse{width:6px;height:6px;border-radius:50%;background:currentColor;animation:pulse 1.1s ease-in-out infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.25}}

/* Markdown output */
.md-out{font-size:.85rem;line-height:1.8;color:var(--t1)}
.md-out h1{font-size:1.1rem;font-weight:700;color:var(--acc3);margin:18px 0 8px;padding-bottom:4px;border-bottom:1px solid var(--border)}
.md-out h2{font-size:.95rem;font-weight:600;color:var(--acc3);margin:14px 0 6px}
.md-out h3{font-size:.88rem;font-weight:600;color:#c4c0fa;margin:10px 0 4px}
.md-out h1:first-child,.md-out h2:first-child,.md-out h3:first-child{margin-top:0}
.md-out p{margin-bottom:8px}
.md-out p:last-child{margin-bottom:0}
.md-out strong{color:#fff;font-weight:600}
.md-out em{color:var(--acc3);font-style:italic}
.md-out ul,.md-out ol{margin:6px 0 8px 18px}
.md-out li{margin-bottom:3px}
.md-out hr{border:none;border-top:1px solid var(--border);margin:14px 0}
.md-out code{background:var(--s3);border:1px solid var(--border);border-radius:4px;padding:1px 6px;font-family:var(--mono);font-size:.78rem;color:var(--acc3)}
.md-out pre{background:var(--s3);border:1px solid var(--border);border-radius:7px;padding:12px;margin:8px 0;overflow-x:auto}
.md-out pre code{background:none;border:none;padding:0;font-size:.8rem}
.md-out table{width:100%;border-collapse:collapse;margin:10px 0;font-size:.8rem}
.md-out th{background:var(--s3);color:var(--acc3);padding:7px 10px;text-align:left;border:1px solid var(--border2);font-weight:600}
.md-out td{padding:6px 10px;border:1px solid var(--border);color:var(--t2)}
.md-out tr:hover td{background:rgba(255,255,255,.02)}

/* Inner tabs */
.tabs{display:flex;border-bottom:1px solid var(--border)}
.tab-btn{
  padding:9px 14px;font-size:.78rem;font-weight:500;color:var(--t3);
  cursor:pointer;border:none;background:none;font-family:var(--font);
  border-bottom:2px solid transparent;margin-bottom:-1px;transition:color .15s;
}
.tab-btn:hover{color:var(--t1)}
.tab-btn.active{color:var(--acc3);border-bottom-color:var(--acc)}
.tab-pane{display:none;padding:16px}
.tab-pane.active{display:block}

/* Financial */
.m3{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px}
.mbox{background:var(--s1);border-radius:8px;padding:11px 13px;border:1px solid var(--border)}
.mbox .ml{font-size:.68rem;color:var(--t3);text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px}
.mbox .mv{font-size:1.15rem;font-weight:700}
.alert{border-radius:7px;padding:9px 13px;font-size:.8rem;margin-bottom:12px;line-height:1.5}
.alert.ok{background:rgba(16,185,129,.08);border:1px solid rgba(16,185,129,.2);color:#6ee7b7}
.alert.warn{background:rgba(240,73,73,.08);border:1px solid rgba(240,73,73,.2);color:#fca5a5}
.chart-box{height:220px;position:relative;margin-top:8px}

/* Entity + insight lists */
.eg{margin-bottom:12px}
.eg-label{font-size:.68rem;font-weight:600;text-transform:uppercase;letter-spacing:.07em;color:var(--t3);margin-bottom:6px}
.tag-row{display:flex;flex-wrap:wrap;gap:5px}
.tag{background:rgba(80,70,228,.1);border:1px solid rgba(80,70,228,.18);color:var(--acc3);border-radius:5px;padding:2px 9px;font-size:.75rem}
.li-row{display:flex;gap:7px;padding:6px 0;border-bottom:1px solid var(--border);font-size:.82rem;line-height:1.5}
.li-row:last-child{border-bottom:none}
.li-bullet{flex-shrink:0;font-weight:700;margin-top:1px}
.li-row.risk .li-bullet{color:var(--red)}
.li-row.action .li-bullet{color:var(--green)}
.li-row.decision .li-bullet{color:var(--yellow)}
.empty{color:var(--t3);font-size:.8rem;font-style:italic}

/* Action cards */
.acard{border-radius:7px;padding:9px 13px;margin-bottom:7px;font-size:.82rem;line-height:1.5}
.acard.modified{background:rgba(245,158,11,.07);border:1px solid rgba(245,158,11,.18);color:#fcd34d}
.acard.sent{background:rgba(59,130,246,.07);border:1px solid rgba(59,130,246,.18);color:#93c5fd}
.acard.none{background:rgba(255,255,255,.02);border:1px solid var(--border);color:var(--t3)}
.acard.other{background:rgba(80,70,228,.07);border:1px solid rgba(80,70,228,.18);color:var(--acc3)}

/* Raw */
.raw-label{font-size:.68rem;font-weight:600;color:var(--t3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:5px}
.code-view{
  background:var(--bg);border:1px solid var(--border);border-radius:7px;
  padding:11px;font-family:var(--mono);font-size:.76rem;color:var(--acc3);
  white-space:pre-wrap;word-break:break-all;max-height:200px;overflow-y:auto;margin-bottom:12px;
}

/* Tool log */
.tl-row{display:flex;align-items:center;gap:7px;padding:6px 0;border-bottom:1px solid var(--border);font-size:.77rem}
.tl-row:last-child{border-bottom:none}
.tl-name{font-family:var(--mono);color:var(--t1);font-weight:500}
.tl-ts{color:var(--t3);font-size:.7rem;margin-left:auto}
.tok{color:var(--green)}.twarn{color:var(--yellow)}.terr{color:var(--red)}

/* ── Chat panel ──────────────── */
#chatPanel{
  background:var(--s2);border:1px solid var(--border);
  border-radius:var(--radius);display:flex;flex-direction:column;
  height:700px;position:sticky;top:18px;
}
.ch-head{padding:12px 16px;border-bottom:1px solid var(--border);flex-shrink:0}
.ch-head h2{font-size:.88rem;font-weight:600}
.ch-head p{font-size:.72rem;color:var(--t3);margin-top:2px}
.qbtns{display:flex;flex-wrap:wrap;gap:5px;padding:8px 12px;border-bottom:1px solid var(--border);flex-shrink:0}
.qbtn{
  background:rgba(80,70,228,.1);border:1px solid rgba(80,70,228,.18);color:var(--acc3);
  border-radius:16px;padding:4px 11px;font-size:.72rem;font-weight:500;
  cursor:pointer;font-family:var(--font);transition:background .15s;
}
.qbtn:hover{background:rgba(80,70,228,.22)}
#chatMsgs{
  flex:1;overflow-y:auto;padding:12px 14px;
  display:flex;flex-direction:column;gap:9px;
}
.msg{max-width:90%;padding:9px 12px;border-radius:9px;font-size:.82rem;line-height:1.65}
.msg.user{background:var(--acc);margin-left:auto;border-bottom-right-radius:2px;color:#fff}
.msg.assistant{background:var(--s1);border:1px solid var(--border);border-bottom-left-radius:2px;white-space:pre-wrap}
.msg.assistant.md-msg{white-space:normal}
.ci-row{display:flex;gap:7px;padding:10px 12px;border-top:1px solid var(--border);flex-shrink:0}
#chatInput{
  flex:1;background:var(--s1);border:1px solid var(--border);color:var(--t1);
  border-radius:7px;padding:8px 11px;font-family:var(--font);font-size:.82rem;
  resize:none;min-height:38px;max-height:90px;line-height:1.5;
}
#chatInput:focus{outline:none;border-color:var(--acc)}
#sendBtn{
  background:var(--acc);border:none;color:#fff;border-radius:7px;
  width:38px;height:38px;cursor:pointer;display:flex;align-items:center;justify-content:center;
  transition:background .15s;flex-shrink:0;
}
#sendBtn:hover{background:var(--acc2)}
#sendBtn:disabled{opacity:.4;cursor:not-allowed}

/* ── Translate panel ─────────── */
#translatePanel{
  background:var(--s2);border:1px solid var(--border);
  border-radius:var(--radius);padding:16px;margin-bottom:14px;
}
.lang-row{display:flex;gap:8px;align-items:center;margin-bottom:12px;flex-wrap:wrap}
#translateContent{min-height:60px}

/* ── Compare panel ───────────── */
#compareCard .compare-upload{
  display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;
}
@media(max-width:600px){#compareCard .compare-upload{grid-template-columns:1fr}}

/* ── Utilities ───────────────── */
.hidden{display:none!important}
.spinner{display:inline-block;width:13px;height:13px;border:2px solid rgba(255,255,255,.12);border-top-color:var(--acc3);border-radius:50%;animation:spin .65s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.sep{width:1px;height:20px;background:var(--border);flex-shrink:0}
</style>
</head>
<body>
<div id="app">

  <!-- Header -->
  <header>
    <div class="logo">
      <div class="logo-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
        </svg>
      </div>
      <div>
        <h1>Sharp <span>Document Engine</span></h1>
        <p>Full dissection &bull; Translation &bull; Comparison &bull; Any language</p>
      </div>
    </div>
    <div class="hdr-right">
      <select id="modelSelect" title="AI Model">
        <option value="@cf/meta/llama-3.3-70b-instruct-fp8-fast">Llama 3.3 &mdash; 70B Powerful</option>
        <option value="@cf/meta/llama-3.1-8b-instruct">Llama 3.1 &mdash; 8B Fast</option>
        <option value="@cf/mistral/mistral-7b-instruct-v0.1">Mistral 7B</option>
        <option value="@cf/google/gemma-7b-it">Gemma 7B</option>
      </select>
    </div>
  </header>

  <!-- Upload area -->
  <div class="upload-wrap" id="uploadWrap">
    <!-- Doc A -->
    <div class="upload-zone" id="zoneA">
      <input type="file" id="fileA" accept=".txt,.log,.json,.md,.csv,.py,.js,.ts,.jsx,.tsx,.sql" style="display:none">
      <div class="uz-icon">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
          <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/>
        </svg>
      </div>
      <div class="file-prompt">
        <h3>Drop any document</h3>
        <p>Transcript &bull; Report &bull; CSV &bull; JSON &bull; Email &bull; Log &bull; Code &bull; Any language</p>
        <div class="file-tags">
          <span class="file-tag">txt</span><span class="file-tag">csv</span>
          <span class="file-tag">json</span><span class="file-tag">md</span>
          <span class="file-tag">log</span><span class="file-tag">py</span>
          <span class="file-tag">js</span><span class="file-tag">sql</span>
        </div>
      </div>
      <div class="file-loaded">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        <div class="file-loaded-name" id="nameA">—</div>
        <div class="file-loaded-sub" id="infoA">—</div>
      </div>
    </div>

    <!-- Doc B (hidden until compare mode) -->
    <div class="upload-zone hidden" id="zoneB">
      <input type="file" id="fileB" accept=".txt,.log,.json,.md,.csv,.py,.js,.ts,.jsx,.tsx,.sql" style="display:none">
      <div class="uz-icon" style="background:rgba(245,158,11,.12);color:#fcd34d">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
          <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/>
        </svg>
      </div>
      <div class="file-prompt">
        <h3>Drop Document B to Compare</h3>
        <p>Upload a second document for side-by-side comparison</p>
      </div>
      <div class="file-loaded">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2.5">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        <div class="file-loaded-name" id="nameB">—</div>
        <div class="file-loaded-sub" id="infoB">—</div>
      </div>
    </div>
  </div>

  <!-- Results (hidden until upload) -->
  <div id="results" class="hidden">

    <!-- Meta chips -->
    <div id="metaRow">
      <div class="chip"><span class="cl">Format</span>&nbsp;<span class="cv" id="cFmt">—</span></div>
      <div class="chip"><span class="cl">Size</span>&nbsp;<span class="cv" id="cSz">—</span></div>
      <div class="chip"><span class="cl">Lines</span>&nbsp;<span class="cv" id="cLn">—</span></div>
      <div class="chip"><span class="cl">Language</span>&nbsp;<span class="cv" id="cLg">Detecting&hellip;</span></div>
      <div class="chip c-run" id="cSt"><span class="spinner"></span>&nbsp;Analyzing&hellip;</div>
      <div style="margin-left:auto;display:flex;gap:7px;flex-wrap:wrap">
        <button class="btn btn-outline" id="btnCompare" onclick="toggleCompare()">&#9654; Compare Documents</button>
        <button class="btn btn-outline" id="btnTranslate" onclick="showTranslate()">&#8644; Translate</button>
      </div>
    </div>

    <!-- Top-level tabs -->
    <div id="topTabs">
      <button class="ttab active" data-view="analysis">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        Analysis
      </button>
      <button class="ttab hidden" id="tabTranslate" data-view="translate">
        &#8644; Translation
      </button>
      <button class="ttab hidden" id="tabCompare" data-view="compare">
        &#9654; Comparison
      </button>
    </div>

    <!-- VIEW: Analysis -->
    <div id="view-analysis">
      <div id="mainGrid">

        <!-- LEFT: Analysis cards -->
        <div id="leftCol">

          <!-- Dissection card -->
          <div class="card">
            <div class="card-head">
              <h2>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--acc3)" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                Document Dissection
              </h2>
              <div class="spill loading" id="dissectPill"><span class="pulse"></span>&nbsp;Streaming&hellip;</div>
            </div>
            <div class="card-body">
              <div class="md-out" id="dissectOut"></div>
            </div>
          </div>

          <!-- Data card -->
          <div class="card">
            <div class="tabs">
              <button class="tab-btn active" data-tab="financial">Financial</button>
              <button class="tab-btn" data-tab="entities">Entities</button>
              <button class="tab-btn" data-tab="insights">Decisions &amp; Risks</button>
              <button class="tab-btn" data-tab="actions">Actions</button>
              <button class="tab-btn" data-tab="raw">Raw</button>
              <button class="tab-btn" data-tab="toollog">Log</button>
            </div>
            <div id="pane-financial" class="tab-pane active">
              <div class="m3">
                <div class="mbox"><div class="ml">Orders</div><div class="mv" id="mOrders">—</div></div>
                <div class="mbox"><div class="ml">Avg Order Value</div><div class="mv" id="mAov">—</div></div>
                <div class="mbox"><div class="ml">Discount Cost</div><div class="mv" id="mDisc">—</div></div>
              </div>
              <div id="revAlert"></div>
              <div class="chart-box"><canvas id="chartRev"></canvas></div>
            </div>
            <div id="pane-entities" class="tab-pane"><div id="entOut"></div></div>
            <div id="pane-insights" class="tab-pane"><div id="insOut"></div></div>
            <div id="pane-actions" class="tab-pane"><div id="actOut"></div></div>
            <div id="pane-raw" class="tab-pane">
              <div class="raw-label">Email Copy</div><div class="code-view" id="rawEmail">—</div>
              <div class="raw-label">SMS Copy</div><div class="code-view" id="rawSms">—</div>
              <div class="raw-label">Full JSON</div><div class="code-view" id="rawJson" style="max-height:280px">—</div>
            </div>
            <div id="pane-toollog" class="tab-pane"><div id="toolLogOut"></div></div>
          </div>

        </div><!-- /leftCol -->

        <!-- RIGHT: Chat -->
        <div id="chatPanel">
          <div class="ch-head">
            <h2>Ask About This Document</h2>
            <p>Translate &bull; Summarize &bull; Analyze &bull; Explain &mdash; any language</p>
          </div>
          <div class="qbtns">
            <button class="qbtn" id="qTr">Translate All</button>
            <button class="qbtn" id="qSum">5 Key Points</button>
            <button class="qbtn" id="qRisk">All Risks</button>
            <button class="qbtn" id="qAct">Action Items</button>
            <button class="qbtn" id="qFin">Explain Financials</button>
            <button class="qbtn" id="qExec">Executive Report</button>
          </div>
          <div id="chatMsgs"></div>
          <div class="ci-row">
            <textarea id="chatInput" rows="1" placeholder="Ask anything&hellip; translate, summarize, compare, explain"></textarea>
            <button id="sendBtn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>

      </div>
    </div><!-- /view-analysis -->

    <!-- VIEW: Translation -->
    <div id="view-translate" class="hidden">
      <div class="card">
        <div class="card-head">
          <h2>&#8644; Document Translation</h2>
          <div class="spill done hidden" id="trPill">&#10003; Done</div>
        </div>
        <div class="card-body">
          <div class="lang-row" style="margin-bottom:14px">
            <span style="font-size:.82rem;color:var(--t2)">Translate to:</span>
            <select id="targetLang" style="width:180px">
              <option>English</option>
              <option>French</option>
              <option>Spanish</option>
              <option>German</option>
              <option>Arabic</option>
              <option>Portuguese</option>
              <option>Swahili</option>
              <option>Chinese (Simplified)</option>
              <option>Japanese</option>
            </select>
            <button class="btn btn-primary" id="runTranslate">Translate Document</button>
          </div>
          <div class="md-out" id="trOut" style="min-height:80px;color:var(--t3)">
            Select a language and click Translate Document.
          </div>
        </div>
      </div>
    </div>

    <!-- VIEW: Comparison -->
    <div id="view-compare" class="hidden">
      <div class="card" id="compareCard">
        <div class="card-head">
          <h2>&#9654; Document Comparison</h2>
          <div class="spill loading hidden" id="cmpPill"><span class="pulse"></span>&nbsp;Comparing&hellip;</div>
        </div>
        <div class="card-body">
          <p style="font-size:.82rem;color:var(--t2);margin-bottom:14px">
            Upload Document B above, then click Compare.
          </p>
          <button class="btn btn-primary" id="runCompare" disabled>Run Comparison</button>
          <div class="md-out" id="cmpOut" style="margin-top:18px;min-height:40px"></div>
        </div>
      </div>
    </div>

  </div><!-- /results -->

</div>
<script src="/app.js"><\/script>
</body>
</html>`;
}
