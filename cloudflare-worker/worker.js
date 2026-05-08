/**
 * OpenRouter proxy: keeps OPENROUTER_API_KEY in Cloudflare only (never in the public repo).
 * Deploy with wrangler; set secret: wrangler secret put OPENROUTER_API_KEY
 *
 * Client (Vite) posts the same JSON body as OpenRouter chat/completions — no Authorization header from the browser.
 */
export default {
  async fetch(request, env) {
    const cors = corsHeaders(request);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    if (request.method !== 'POST') {
      return json(405, { error: 'Method not allowed' }, cors);
    }

    const key = env.OPENROUTER_API_KEY;
    if (!key || typeof key !== 'string') {
      return json(500, { error: 'Worker misconfigured (missing OPENROUTER_API_KEY)' }, cors);
    }

    let body;
    try {
      body = await request.text();
    } catch {
      return json(400, { error: 'Invalid body' }, cors);
    }

    const upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
        'HTTP-Referer': env.OPENROUTER_HTTP_REFERER || 'https://github.com',
        'X-Title': env.OPENROUTER_X_TITLE || 'AI Museum Guide',
      },
      body,
    });

    const text = await upstream.text();
    const ct = upstream.headers.get('Content-Type') || 'application/json';

    return new Response(text, {
      status: upstream.status,
      headers: {
        ...cors,
        'Content-Type': ct,
      },
    });
  },
};

function corsHeaders(request) {
  const allowOrigin = request.headers.get('Origin') || '*';
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
    'Access-Control-Max-Age': '86400',
  };
}

function json(status, obj, cors) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      ...cors,
      'Content-Type': 'application/json',
    },
  });
}
