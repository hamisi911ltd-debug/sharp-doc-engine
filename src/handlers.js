import { detectDocumentMeta, extractAndVerifyData } from './core.js';

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const DEFAULT_MODEL   = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
const EXTRACT_MODEL   = '@cf/meta/llama-3.1-8b-instruct';

function ts()           { return new Date().toTimeString().slice(0, 8); }
function clip(t, n)     { return t.slice(0, n); }
function jsonHeaders()  { return { ...CORS, 'Content-Type': 'application/json' }; }

// ── Phase 1: Full Document Dissection (streaming) ─────────────────────────────
export async function handleStreamReasoning(request, env) {
  const { content, filename, model } = await request.json();
  const docMeta = detectDocumentMeta(content, filename);

  const systemPrompt =
`You are an elite business document analyst with 20 years of experience. Your job is to thoroughly dissect any document — in ANY language and ANY format — and present the findings in clear, readable English.

RULES:
- Be SPECIFIC: use actual names, numbers, dates, and direct quotes from the document
- If the document is not in English, translate all content as you analyze it
- Every section must contain real information from the document — no generic filler
- Use proper markdown formatting with ## headers, **bold** for key terms, and bullet lists

Produce a complete dissection using EXACTLY these sections:

## Document Overview
State the document type, original language, date/period if detectable, who wrote it and for whom, and its purpose in 2-3 sentences.

## Plain English Summary
In 4-5 sentences, explain what this document is about and what its main message is. Write as if explaining to someone who has never seen it.

## People & Organizations
List every person and organization mentioned. Format: **Name** — role or context — what they did or said in this document. If none, say so.

## Events & Timeline
What happened in this document? List events chronologically. Format: **[Date/Period]** — what occurred. If no dates, describe the sequence of events.

## Financial Picture
Every financial figure, amount, percentage, or cost mentioned — explained in plain English. Format: **[Amount]** — what it represents and why it matters. If no financial data, say so explicitly.

## Decisions & Commitments
Every decision made, approved, or committed to. Who decided, what exactly was decided, and any conditions attached.

## Risks & Red Flags
Every problem, risk, inconsistency, anomaly, or concern — and why each one matters. Be direct.

## Action Items & Next Steps
Every task or follow-up item. Format: **[Task]** — who is responsible — deadline if mentioned.

## Key Quotes
The 2-3 most important or revealing statements from the document, quoted exactly. Explain why each quote matters.`;

  const stream = await env.AI.run(model || DEFAULT_MODEL, {
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: 'Dissect this document completely:\n\n' + clip(content, 8000) },
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
  const aiModel = EXTRACT_MODEL;

  const systemPrompt =
`Extract structured data from this document. Return ONLY valid JSON — no markdown, no explanation:
{
  "readable": "<2-4 sentence summary>",
  "document_language": "<original language>",
  "translation_note": "<one-line note if non-English, else null>",
  "currency": "<ISO code, default USD>",
  "orders": <integer, 0 if absent>,
  "aov": <float, 0.0 if absent>,
  "discount_cost": <float, 0.0 if absent>,
  "net_revenue": <float, 0.0 if absent>,
  "people": ["<Full Name — title/role>"],
  "organizations": ["<organization name>"],
  "dates": ["<date or period string>"],
  "key_decisions": ["<decision made>"],
  "action_items": ["<task — responsible person — deadline>"],
  "risks": ["<specific risk or concern>"],
  "email_body": "<extracted email copy or empty string>",
  "sms_body": "<extracted SMS copy or empty string>",
  "shopify_triggered": <true/false>,
  "messaging_triggered": <true/false>,
  "extra_actions": ["<other notable event>"]
}`;

  let data;
  const t0 = Date.now();

  try {
    const resp = await env.AI.run(aiModel, {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: 'Extract from:\n\n' + clip(content, 6000) },
      ],
    });
    const elapsed = ((Date.now() - t0) / 1000).toFixed(2);
    let raw = (resp.response || '').replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/, '').trim();

    try { data = JSON.parse(raw); }
    catch {
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) data = JSON.parse(m[0]); else throw new Error('No JSON found');
    }

    toolLog.push({ tool: 'ai_extraction', status: 'ok', ts: ts(),
      inputs: { model: aiModel, format: docMeta.format, chars: content.length, elapsed_s: elapsed },
      result: { fields_extracted: Object.keys(data).length } });

  } catch (err) {
    toolLog.push({ tool: 'ai_extraction', status: 'warn', ts: ts(),
      inputs: { error: err.message }, result: 'regex fallback active' });
    const fb = extractAndVerifyData(content, toolLog);
    return Response.json({ usedFallback: true, docMeta, payload: fb, toolLog }, { headers: jsonHeaders() });
  }

  const ordersVal   = parseInt(data.orders         || 0) || 0;
  const aovVal      = parseFloat(data.aov           || 0) || 0;
  const discVal     = parseFloat(data.discount_cost || 0) || 0;
  const reportedRev = parseFloat(data.net_revenue   || 0) || 0;
  const calculated  = Math.round((ordersVal * aovVal - discVal) * 100) / 100;
  const mathError   = reportedRev > 0.01 && Math.abs(calculated - reportedRev) > 0.01;

  toolLog.push({
    tool: 'verify_financial_math', status: mathError ? 'warn' : 'ok', ts: ts(),
    inputs:  { orders: ordersVal, aov: aovVal, discount: discVal, reported: reportedRev },
    result:  { calculated_revenue: calculated, anomaly_detected: mathError },
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
    readable:        data.readable || '',
    docLanguage:     data.document_language || 'Unknown',
    translationNote: data.translation_note  || null,
    usedFallback:    false,
    docMeta,
    toolLog,
    payload: {
      currency: data.currency || 'USD',
      metrics: {
        orders: ordersVal, aov: aovVal, discount_cost: discVal,
        reported_revenue: reportedRev, calculated_revenue: calculated,
        math_anomaly_detected: mathError,
      },
      entities:      { people: data.people || [], organizations: data.organizations || [], dates: data.dates || [] },
      key_decisions: data.key_decisions || [],
      action_items:  data.action_items  || [],
      risks:         data.risks         || [],
      actions_taken: actions,
      extracted_copy: { email: data.email_body || 'Not found.', sms: data.sms_body || 'Not found.' },
    },
  }, { headers: jsonHeaders() });
}

// ── Translation ───────────────────────────────────────────────────────────────
export async function handleTranslate(request, env) {
  const { content, filename, targetLang, model } = await request.json();
  const target = targetLang || 'English';

  const systemPrompt =
`You are a professional translator and document analyst. Translate the provided document to ${target}.

Produce your response in this exact format:

## ORIGINAL LANGUAGE
[State the detected language and document type]

## COMPLETE TRANSLATION
[Translate the ENTIRE document to ${target}. Preserve all structure — keep headings, lists, tables, and paragraphs exactly as in the original. Translate every word. Do not skip, summarize, or abbreviate anything.]

## TRANSLATION NOTES
[List any important notes:
- Technical terms or jargon and their translations
- Names that were kept in original
- Cultural context that needs explanation
- Any sections that were ambiguous or hard to translate]

Important rules:
- Translate EVERYTHING — no original language should remain except where noted
- Keep all numbers, dates, and proper nouns accurate
- Preserve the tone (formal/informal) of the original
- If the document is already in ${target}, say so and provide a clean reformatted version`;

  const stream = await env.AI.run(model || DEFAULT_MODEL, {
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: 'Translate this document:\n\n' + clip(content, 7000) },
    ],
    stream: true,
  });

  return new Response(stream, {
    headers: { ...CORS, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
  });
}

// ── Document Comparison ───────────────────────────────────────────────────────
export async function handleCompare(request, env) {
  const { contentA, filenameA, contentB, filenameB, model } = await request.json();

  const systemPrompt =
`You are an expert document analyst. Compare these two documents systematically and thoroughly.

Produce a structured comparison report in this EXACT format:

## DOCUMENT COMPARISON REPORT

### At a Glance

| Feature | ${filenameA || 'Document A'} | ${filenameB || 'Document B'} |
|---------|------------|------------|
| Type | [type] | [type] |
| Language | [lang] | [lang] |
| Date/Period | [date] | [date] |
| Length/Detail | [brief] | [brief] |
| Primary Purpose | [purpose] | [purpose] |

### Key Similarities
What do both documents share in common? List every significant similarity.

### Key Differences
The most important ways these documents differ — be specific with actual content differences, not just structural ones.

### Financial Comparison
Compare all financial figures side by side. If one document has financials the other doesn't, highlight that gap.

| Metric | ${filenameA || 'Document A'} | ${filenameB || 'Document B'} |
|--------|------------|------------|
[add rows for every financial figure found]

### People & Organizations Comparison
Who appears in each document? Who is in one but not the other?

### Decisions & Actions Comparison
Compare the decisions made and action items across both documents.

### Conflicts & Contradictions
Any point where Document A and Document B contradict or conflict with each other. Be specific.

### Overall Assessment
Which document is more comprehensive? What does the comparison reveal? What is the key takeaway from reading both together?`;

  const stream = await env.AI.run(model || DEFAULT_MODEL, {
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content:
          '=== DOCUMENT A: ' + (filenameA || 'Document A') + ' ===\n\n' + clip(contentA, 3500) +
          '\n\n=== DOCUMENT B: ' + (filenameB || 'Document B') + ' ===\n\n' + clip(contentB, 3500),
      },
    ],
    stream: true,
  });

  return new Response(stream, {
    headers: { ...CORS, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
  });
}

// ── Chat ──────────────────────────────────────────────────────────────────────
export async function handleChat(request, env) {
  const { message, payload, dissection, comparison, history, model } = await request.json();

  const systemPrompt =
`You are an expert document analyst. You have fully analyzed the uploaded document(s) and have complete knowledge of their contents.

STRUCTURED DATA EXTRACTED:
${JSON.stringify(payload, null, 2)}

${dissection  ? 'FULL DOCUMENT DISSECTION:\n' + dissection : ''}
${comparison  ? 'DOCUMENT COMPARISON REPORT:\n' + comparison : ''}

HOW TO ANSWER:
- TRANSLATE request → produce a complete, accurate translation preserving all formatting
- SUMMARIZE request → hit the exact format requested (bullets, sentences, table, etc.)
- RISKS/PROBLEMS → list every single risk found, be specific with names and figures
- DECISIONS/ACTIONS → be specific with who decided what and any deadlines
- EXPLAIN [term] → clear plain-English explanation using context from the document
- FINANCIAL questions → use the verified calculated figures; explain anomalies clearly
- COMPARISON questions → refer to both documents by their names
- Any other question → answer using ONLY information found in the document(s)

CRITICAL RULES:
- Never invent information not present in the document
- Match the user's language — reply in French if asked in French, etc.
- Be specific and concrete, never generic
- Follow the user's instructions EXACTLY`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...(history || []),
    { role: 'user', content: message },
  ];

  const resp = await env.AI.run(model || DEFAULT_MODEL, { messages, temperature: 0.35 });
  return Response.json({ reply: resp.response || '' }, { headers: jsonHeaders() });
}
