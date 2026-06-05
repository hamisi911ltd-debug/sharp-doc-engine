import { detectDocumentMeta, extractAndVerifyData } from './core.js';

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function ts() { return new Date().toTimeString().slice(0, 8); }

function docInput(rawText, docMeta) {
  return rawText.slice(0, 7000);
}

// ── Phase 1: Streaming Dissection ─────────────────────────────────────────────
export async function handleStreamReasoning(request, env) {
  const { content, filename, model } = await request.json();
  const docMeta = detectDocumentMeta(content, filename);

  const systemPrompt = [
    'You are a world-class document analyst. Your job is to dissect ANY document — in ANY language, ANY format — and explain it in clear, plain English.',
    '',
    'Produce a structured dissection using these sections (use ## markdown headers):',
    '',
    '## Document Overview',
    'Type of document, original language, format, estimated date/period, overall purpose.',
    '',
    '## Plain-English Summary',
    '3-5 sentences explaining what this document is about in simple terms anyone can understand.',
    '',
    '## Key People & Organizations',
    'List everyone and every organization mentioned. One line each: Name — role/context.',
    '',
    '## Key Events & Timeline',
    'What happened? In what order? List chronologically if possible.',
    '',
    '## Decisions Made',
    'Every decision, approval, change, or commitment found in the document.',
    '',
    '## Financial Picture',
    'Any numbers, amounts, revenues, costs, percentages — explained in plain English. If none, say so.',
    '',
    '## Risks & Concerns',
    'Any problems, risks, anomalies, inconsistencies, or red flags found.',
    '',
    '## Action Items & Next Steps',
    'What needs to happen? Who is responsible?',
    '',
    '## Notable Quotes',
    'Any particularly important or revealing statements (quote them directly).',
    '',
    'IMPORTANT RULES:',
    '- If the document is not in English, translate all key content as you analyze it',
    '- Be specific — use actual names, numbers, and dates from the document',
    '- Do not make up information — only use what is in the document',
    '- If a section has no relevant content, write "Nothing found in this document."',
  ].join('\n');

  const stream = await env.AI.run(model || '@cf/meta/llama-3.1-8b-instruct', {
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: 'Dissect this document completely:\n\n' + docInput(content, docMeta) },
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
  const toolLog = [];
  const aiModel = model || '@cf/meta/llama-3.1-8b-instruct';

  const systemPrompt = [
    'You are a structured data extraction engine. Extract ALL business data from this document.',
    'Return ONLY a single valid JSON object with no markdown fences, no commentary:',
    '{',
    '  "readable": "<2-4 sentence plain English summary>",',
    '  "document_language": "<original language of the document>",',
    '  "translation_note": "<brief note if translated, or null>",',
    '  "currency": "<ISO code, default USD>",',
    '  "orders": <integer count, 0 if absent>,',
    '  "aov": <float average order value, 0.0 if absent>,',
    '  "discount_cost": <float total discounts, 0.0 if absent>,',
    '  "net_revenue": <float total revenue, 0.0 if absent>,',
    '  "people": ["<name — role>"],',
    '  "organizations": ["<org name>"],',
    '  "dates": ["<date or period>"],',
    '  "key_decisions": ["<decision made>"],',
    '  "action_items": ["<action — responsible person>"],',
    '  "risks": ["<risk or concern>"],',
    '  "email_body": "<extracted email copy or empty string>",',
    '  "sms_body": "<extracted SMS copy or empty string>",',
    '  "shopify_triggered": <true/false>,',
    '  "messaging_triggered": <true/false>,',
    '  "extra_actions": ["<any other notable events>"]',
    '}',
  ].join('\n');

  let data;
  const t0 = Date.now();

  try {
    const resp    = await env.AI.run(aiModel, {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: 'Extract from:\n\n' + docInput(content, docMeta) },
      ],
    });
    const elapsed = ((Date.now() - t0) / 1000).toFixed(2);
    let raw = (resp.response || '').replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/, '').trim();

    try { data = JSON.parse(raw); }
    catch {
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) data = JSON.parse(m[0]);
      else throw new Error('Cannot parse AI response as JSON');
    }

    toolLog.push({
      tool: 'ai_extraction', status: 'ok', ts: ts(),
      inputs: { model: aiModel, format: docMeta.format, chars: content.length, elapsed },
      result: { fields: Object.keys(data).length },
    });
  } catch (err) {
    toolLog.push({ tool: 'ai_extraction', status: 'warn', ts: ts(),
      inputs: { error: err.message }, result: 'regex fallback' });
    const fb = extractAndVerifyData(content, toolLog);
    return Response.json({ usedFallback: true, docMeta, payload: fb, toolLog }, { headers: CORS });
  }

  const ordersVal   = parseInt(data.orders        || 0) || 0;
  const aovVal      = parseFloat(data.aov          || 0) || 0;
  const discVal     = parseFloat(data.discount_cost || 0) || 0;
  const reportedRev = parseFloat(data.net_revenue  || 0) || 0;
  const calculated  = Math.round((ordersVal * aovVal - discVal) * 100) / 100;
  const mathError   = reportedRev > 0.01 && Math.abs(calculated - reportedRev) > 0.01;

  toolLog.push({
    tool: 'verify_financial_math', ts: ts(),
    inputs:  { orders: ordersVal, aov: aovVal, discount: discVal, reported: reportedRev },
    result:  { calculated, anomaly: mathError },
    status:  mathError ? 'warn' : 'ok',
  });

  const actions = [];
  if (data.shopify_triggered)   actions.push('MODIFIED: Shopify coupon / inventory altered.');
  else                          actions.push('NO ACTION: Shopify untouched.');
  if (data.messaging_triggered) actions.push('SENT: Marketing blast dispatched.');
  else                          actions.push('NO ACTION: No messaging triggered.');
  for (const x of (data.extra_actions || [])) { if (x) actions.push('ACTION: ' + x); }

  toolLog.push(
    { tool: 'detect_shopify',   status: 'ok', ts: ts(), inputs: {}, result: !!data.shopify_triggered },
    { tool: 'detect_messaging', status: 'ok', ts: ts(), inputs: {}, result: !!data.messaging_triggered },
  );

  return Response.json({
    readable:         data.readable || '',
    docLanguage:      data.document_language || 'Unknown',
    translationNote:  data.translation_note  || null,
    usedFallback:     false,
    docMeta,
    toolLog,
    payload: {
      currency: data.currency || 'USD',
      metrics: {
        orders: ordersVal, aov: aovVal, discount_cost: discVal,
        reported_revenue: reportedRev, calculated_revenue: calculated,
        math_anomaly_detected: mathError,
      },
      entities: {
        people:        data.people        || [],
        organizations: data.organizations || [],
        dates:         data.dates         || [],
      },
      key_decisions: data.key_decisions || [],
      action_items:  data.action_items  || [],
      risks:         data.risks         || [],
      actions_taken: actions,
      extracted_copy: {
        email: data.email_body || 'Not found.',
        sms:   data.sms_body   || 'Not found.',
      },
    },
  }, { headers: CORS });
}

// ── Chat ──────────────────────────────────────────────────────────────────────
export async function handleChat(request, env) {
  const { message, payload, dissection, history, model } = await request.json();

  const context = [
    'DOCUMENT ANALYSIS RESULTS:',
    JSON.stringify(payload, null, 2),
    '',
    dissection ? ('FULL DOCUMENT DISSECTION:\n' + dissection) : '',
  ].join('\n');

  const systemPrompt = [
    'You are an expert document analyst. You have analyzed a document and have full context about it.',
    'Below is the structured data extracted and the full dissection of the document.',
    '',
    context,
    '',
    'INSTRUCTIONS FOR ANSWERING:',
    '- If asked to TRANSLATE: give a complete, accurate translation of the relevant section or the whole document',
    '- If asked to SUMMARIZE: be concise, hit the exact format requested (bullets, sentences, etc.)',
    '- If asked about RISKS or PROBLEMS: list every risk and concern found in the document',
    '- If asked about DECISIONS or ACTIONS: be specific with names and deadlines if available',
    '- If asked to EXPLAIN something: give a clear, plain-English explanation',
    '- If asked about FINANCES: use the verified calculated figures, explain any anomalies',
    '- Always match the user\'s language — if they write in French, reply in French',
    '- Be specific and concrete. Never give generic answers. Only use information from the document.',
    '- Follow the user\'s exact instructions.',
  ].join('\n');

  const messages = [
    { role: 'system', content: systemPrompt },
    ...(history || []),
    { role: 'user', content: message },
  ];

  const resp = await env.AI.run(model || '@cf/meta/llama-3.1-8b-instruct', {
    messages, temperature: 0.4,
  });

  return Response.json({ reply: resp.response || '' }, { headers: CORS });
}
