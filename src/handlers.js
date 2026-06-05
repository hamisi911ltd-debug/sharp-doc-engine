import { detectDocumentMeta, extractAndVerifyData } from './core.js';

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function docInput(rawText, docMeta) {
  return rawText.slice(0, 6000);
}

function ts() { return new Date().toTimeString().slice(0, 8); }

// ── Phase 1: Streaming Reasoning ─────────────────────────────────────────────
export async function handleStreamReasoning(request, env) {
  const { content, filename, model } = await request.json();
  const docMeta  = detectDocumentMeta(content, filename);
  const langNote = docMeta.languageHint === 'non-english'
    ? 'IMPORTANT: The document may not be in English. Translate key content and always respond in English.'
    : '';

  const systemPrompt =
    'You are a senior business intelligence analyst. Document format: **' + docMeta.format + '**. ' + langNote + '\n\n' +
    'Reason through this document step-by-step BEFORE any extraction:\n\n' +
    '1. **Document type & language** — What kind of document is this?\n' +
    '2. **Business metrics** — What KPIs, financial figures, or operational data are present?\n' +
    '3. **Events & actions** — What happened, was triggered, sent, or modified?\n' +
    '4. **Anomalies & flags** — Any math errors, inconsistencies, or data quality issues?\n' +
    '5. **Stakeholder insights** — Top 2–3 takeaways for a business decision-maker.\n\n' +
    'Use **markdown** headers for each section. Be precise and analytical.';

  const stream = await env.AI.run(model || '@cf/meta/llama-3.1-8b-instruct', {
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: 'Reason through this document:\n\n' + docInput(content, docMeta) },
    ],
    stream: true,
  });

  return new Response(stream, {
    headers: { ...CORS, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
  });
}

// ── Phase 2: Structured Extraction ───────────────────────────────────────────
export async function handleAnalyze(request, env) {
  const { content, filename, model } = await request.json();
  const docMeta = detectDocumentMeta(content, filename);
  const fmt     = docMeta.format;
  const toolLog = [];

  const fmtNotes = {
    csv:      'This is CSV/tabular data. Sum/average numeric columns where relevant.',
    json:     'This is a JSON data file. Traverse the structure to find business fields.',
    sql:      'This is SQL. Look for revenue figures, transaction counts in query results or comments.',
    log:      'This is a log file. Extract metrics from log lines; detect error events.',
    markdown: 'This is a Markdown document.',
  };
  let fmtNote = fmtNotes[fmt] || '';
  if (fmt.startsWith('code/')) fmtNote = 'This is ' + fmt.split('/')[1] + ' source code. Extract business metrics from comments, string literals, and data values.';
  if (!fmtNote) fmtNote = 'The document may be in ANY human language — extract business data regardless.';

  const systemPrompt =
    'You are a business document parsing engine. ' + fmtNote + '\n' +
    'Extract ALL business metrics from this document regardless of its language or format.\n' +
    'Return ONLY a single valid JSON object — no markdown fences, no commentary:\n' +
    '{\n' +
    '  "readable": "<2-4 sentence plain-English summary of the document>",\n' +
    '  "document_language": "<detected human language, e.g. English/Spanish/French, or Data/Code>",\n' +
    '  "currency": "<ISO currency code detected, default USD>",\n' +
    '  "orders": <integer total order/transaction count, 0 if absent>,\n' +
    '  "aov": <float average order value in base currency, 0.0 if absent>,\n' +
    '  "discount_cost": <float total discount/promo amount, 0.0 if absent>,\n' +
    '  "net_revenue": <float total net revenue or sales, 0.0 if absent>,\n' +
    '  "email_body": "<extracted email copy, or empty string>",\n' +
    '  "sms_body": "<extracted SMS/text copy, or empty string>",\n' +
    '  "shopify_triggered": <true if Shopify was modified/updated, else false>,\n' +
    '  "messaging_triggered": <true if any message/campaign was dispatched, else false>,\n' +
    '  "extra_actions": ["<any other notable business events or actions>"]\n' +
    '}';

  const aiModel = model || '@cf/meta/llama-3.1-8b-instruct';
  let data;
  const t0 = Date.now();

  try {
    const resp    = await env.AI.run(aiModel, {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: 'Parse this document:\n\n' + docInput(content, docMeta) },
      ],
    });
    const elapsed = ((Date.now() - t0) / 1000).toFixed(2);
    let raw = (resp.response || '').replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/, '').trim();

    try { data = JSON.parse(raw); }
    catch {
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) data = JSON.parse(m[0]);
      else throw new Error('Cannot parse JSON from AI response');
    }

    toolLog.push({
      tool: 'ai_structured_extraction',
      inputs: { model: aiModel, format: fmt, docChars: content.length, elapsedS: elapsed },
      result: Object.fromEntries(Object.entries(data).filter(([k]) => k !== 'readable')),
      status: 'ok', ts: ts(),
    });
  } catch (err) {
    toolLog.push({ tool: 'ai_extraction_failed', inputs: { error: err.message },
      result: 'Falling back to regex', status: 'warn', ts: ts() });
    const fallback = extractAndVerifyData(content, toolLog);
    return Response.json({
      readable: null, docLanguage: 'Unknown (regex fallback)',
      docMeta, payload: fallback, toolLog, usedFallback: true,
    }, { headers: CORS });
  }

  const ordersVal   = parseInt(data.orders        || 0) || 0;
  const aovVal      = parseFloat(data.aov          || 0) || 0;
  const discVal     = parseFloat(data.discount_cost || 0) || 0;
  const reportedRev = parseFloat(data.net_revenue  || 0) || 0;
  const calculated  = Math.round((ordersVal * aovVal - discVal) * 100) / 100;
  const mathError   = reportedRev > 0.01 && Math.abs(calculated - reportedRev) > 0.01;

  toolLog.push({
    tool: 'verify_financial_math',
    inputs: { orders: ordersVal, aov: aovVal, discount: discVal, reportedRevenue: reportedRev },
    result: { calculatedRevenue: calculated, anomalyDetected: mathError },
    status: mathError ? 'warn' : 'ok', ts: ts(),
  });

  const actions = [];
  if (data.shopify_triggered)   actions.push('MODIFIED: Shopify coupon code / inventory was altered.');
  else                          actions.push('NO ACTION: Shopify remains untouched.');
  if (data.messaging_triggered) actions.push('SENT: Marketing blast was actively dispatched.');
  else                          actions.push('NO ACTION: No messaging channels were triggered.');
  for (const x of (data.extra_actions || [])) { if (x) actions.push('ACTION: ' + x); }

  toolLog.push(
    { tool: 'detect_shopify_trigger',   inputs: { source: 'ai' }, result: !!data.shopify_triggered,   status: 'ok', ts: ts() },
    { tool: 'detect_messaging_trigger', inputs: { source: 'ai' }, result: !!data.messaging_triggered, status: 'ok', ts: ts() },
  );

  return Response.json({
    readable:    data.readable || 'No summary generated.',
    docLanguage: data.document_language || 'Unknown',
    docMeta,
    payload: {
      currency: data.currency || 'USD',
      metrics: { orders: ordersVal, aov: aovVal, discount_cost: discVal,
        reported_revenue: reportedRev, calculated_revenue: calculated,
        math_anomaly_detected: mathError },
      actions_taken:  actions,
      extracted_copy: {
        email: data.email_body || 'Not found in document.',
        sms:   data.sms_body   || 'Not found in document.',
      },
    },
    toolLog,
    usedFallback: false,
  }, { headers: CORS });
}

// ── Chatbot ───────────────────────────────────────────────────────────────────
export async function handleChat(request, env) {
  const { message, payload, history, model } = await request.json();

  const sysPrompt =
    'You are a business analyst assistant. ' +
    'The JSON below is the verified, pre-calculated business data extracted from the document. ' +
    'Answer the user\'s question using ONLY this data — do not invent numbers. ' +
    'If the user writes in a non-English language, reply in that same language.\n\n' +
    JSON.stringify(payload, null, 2);

  const messages = [
    { role: 'system', content: sysPrompt },
    ...(history || []),
    { role: 'user', content: message },
  ];

  const resp = await env.AI.run(model || '@cf/meta/llama-3.1-8b-instruct', {
    messages, temperature: 0.5,
  });

  return Response.json({ reply: resp.response || '' }, { headers: CORS });
}
