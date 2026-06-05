import { handleAnalyze, handleChat, handleStreamReasoning, handleTranslate, handleCompare } from './handlers.js';
import { getHTML } from './template.js';
import { getAppJS } from './appscript.js';

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env) {
    const url    = new URL(request.url);
    const method = request.method;

    if (method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });

    if (url.pathname === '/'        && method === 'GET')
      return new Response(getHTML(),   { headers: { ...CORS, 'Content-Type': 'text/html; charset=utf-8' } });
    if (url.pathname === '/app.js'  && method === 'GET')
      return new Response(getAppJS(),  { headers: { ...CORS, 'Content-Type': 'application/javascript; charset=utf-8' } });

    if (url.pathname === '/api/stream'   && method === 'POST') return handleStreamReasoning(request, env);
    if (url.pathname === '/api/analyze'  && method === 'POST') return handleAnalyze(request, env);
    if (url.pathname === '/api/translate'&& method === 'POST') return handleTranslate(request, env);
    if (url.pathname === '/api/compare'  && method === 'POST') return handleCompare(request, env);
    if (url.pathname === '/api/chat'     && method === 'POST') return handleChat(request, env);

    return new Response('Not found', { status: 404, headers: CORS });
  },
};
