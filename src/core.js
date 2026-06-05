// JS translation of core_logic.py — detection + regex fallback

export function detectDocumentMeta(rawText, filename = '') {
  const ext = filename.includes('.') ? filename.split('.').pop().toLowerCase() : '';
  const codeExts = new Set(['py','js','ts','jsx','tsx','java','cpp','c','go','rs','rb','php','swift','kt']);

  let format;
  if      (ext === 'csv')           format = 'csv';
  else if (ext === 'json')          format = 'json';
  else if (ext === 'sql')           format = 'sql';
  else if (codeExts.has(ext))       format = 'code/' + ext;
  else if (ext === 'log')           format = 'log';
  else if (ext === 'md')            format = 'markdown';
  else {
    const s = rawText.trim();
    if (s.startsWith('{') || s.startsWith('['))                                   format = 'json';
    else if ((rawText.match(/,/g)||[]).length > (rawText.match(/\n/g)||[]).length * 1.5
             && rawText.includes('\n'))                                            format = 'csv';
    else                                                                          format = 'text';
  }

  const sample   = rawText.slice(0, 3000);
  const nonAscii = [...sample].filter(c => c.charCodeAt(0) > 127).length;
  const langHint = nonAscii / Math.max(sample.length, 1) > 0.04 ? 'non-english' : 'english';

  return { format, languageHint: langHint, filename };
}

export function extractAndVerifyData(rawText, toolLog = null) {
  const ts = () => new Date().toTimeString().slice(0, 8);

  const ordersM = rawText.match(/(?:orders|order_count|transactions)["\s:,]+(\d+)/i);
  const aovM    = rawText.match(/(?:aov|average_order_value|avg_order)["\s:,]+([\d.]+)/i);
  const discM   = rawText.match(/(?:discount_cost|promo_cost|discount)["\s:,]+([\d.]+)/i);
  const revM    = rawText.match(/(?:net_revenue|revenue|total_revenue|sales)["\s:,]+([\d.]+)/i);

  const ordersVal   = ordersM ? parseInt(ordersM[1])   : 0;
  const aovVal      = aovM    ? parseFloat(aovM[1])    : 0.0;
  const discVal     = discM   ? parseFloat(discM[1])   : 0.0;
  const reportedRev = revM    ? parseFloat(revM[1])    : 0.0;
  const calculated  = Math.round((ordersVal * aovVal - discVal) * 100) / 100;
  const mathError   = reportedRev > 0.01 && Math.abs(calculated - reportedRev) > 0.01;

  if (toolLog) {
    toolLog.push({ tool: 'regex_orders',   inputs: { pattern: 'orders|order_count' },       result: ordersVal,   status: ordersM ? 'ok' : 'not_found', ts: ts() });
    toolLog.push({ tool: 'regex_aov',      inputs: { pattern: 'aov|average_order_value' },  result: aovVal,      status: aovM    ? 'ok' : 'not_found', ts: ts() });
    toolLog.push({ tool: 'regex_discount', inputs: { pattern: 'discount_cost|promo_cost' }, result: discVal,     status: discM   ? 'ok' : 'not_found', ts: ts() });
    toolLog.push({ tool: 'regex_revenue',  inputs: { pattern: 'net_revenue|revenue' },      result: reportedRev, status: revM    ? 'ok' : 'not_found', ts: ts() });
    toolLog.push({ tool: 'verify_financial_math',
      inputs: { orders: ordersVal, aov: aovVal, discount: discVal, reported: reportedRev },
      result: { calculated, anomaly: mathError },
      status: mathError ? 'warn' : 'ok', ts: ts() });
  }

  const shopifyKws = ['shopify.update','shopify_modified','activate_code'];
  const msgKws     = ['klaviyo.send','sms.send','dispatch_campaign','campaign_sent'];
  const shopifyHit = shopifyKws.some(k => rawText.toLowerCase().includes(k));
  const msgHit     = msgKws.some(k => rawText.toLowerCase().includes(k));

  const emailM = rawText.match(/(?:email_body|email_copy)["\s:]+["'](.+?)["']/si);
  const smsM   = rawText.match(/(?:sms_body|sms_copy)["\s:]+["'](.+?)["']/si);

  return {
    currency: 'USD',
    metrics: { orders: ordersVal, aov: aovVal, discount_cost: discVal,
      reported_revenue: reportedRev, calculated_revenue: calculated,
      math_anomaly_detected: mathError },
    actions_taken: [
      shopifyHit ? 'MODIFIED: Shopify coupon code / inventory was altered.' : 'NO ACTION: Shopify remains untouched.',
      msgHit     ? 'SENT: Marketing blast was actively dispatched.'         : 'NO ACTION: No messaging channels were triggered.',
    ],
    extracted_copy: {
      email: emailM ? emailM[1].trim() : 'Not found in document.',
      sms:   smsM   ? smsM[1].trim()   : 'Not found in document.',
    },
  };
}
