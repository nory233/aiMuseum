// Lightweight OpenRouter wrapper using fetch (no npm dependencies).
// Free tier: https://openrouter.ai/  Account > Keys > Create Key
// Uses OpenAI-compatible chat completions API with free vision + text models.
//
// (Filename kept as gemini.js to avoid touching imports elsewhere.)

const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';

// Free models on OpenRouter (no credit card required).
// Tested working as of 2026-05; if rate-limited, try other `:free` models.
const VISION_MODEL = 'nvidia/nemotron-nano-12b-v2-vl:free';
const TEXT_MODEL   = 'openai/gpt-oss-120b:free';

/** Visitor app context: informs vision + text prompts. */
export const NATIONALMUSEUM_CONTEXT =
  "The visitor is at Nationalmuseum in Stockholm, Sweden: Sweden's national museum of fine art and applied arts (paintings, sculpture, works on paper, design, jewellery, ceramics, textiles, and major Nordic and European works). Prefer framing that fits that setting unless the scanned object clearly belongs elsewhere.";

export const aiEnabled = Boolean(API_KEY);

async function callOpenRouter({ messages, model, maxTokens = 600, temperature = 0.7 }) {
  if (!API_KEY) {
    throw new Error('Missing VITE_OPENROUTER_API_KEY. Copy .env.example to .env and add your key.');
  }

  const body = {
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
  };

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
      // OpenRouter requires these for free models.
      'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173',
      'X-Title': 'Nationalmuseum AI Guide',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenRouter ${res.status}: ${errText.slice(0, 240)}`);
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content ?? '';
  if (!text) throw new Error('Empty response from OpenRouter.');
  return text;
}

// Extract a JSON object from a possibly-noisy response (free models often add prose).
function extractJSON(text) {
  try { return JSON.parse(text); } catch {}
  const match = text.match(/\{[\s\S]*\}/);
  if (match) {
    try { return JSON.parse(match[0]); } catch {}
  }
  return null;
}

// Vision: identify a museum object from a captured image
export async function recognizeObject(imageBase64, mimeType = 'image/jpeg') {
  const prompt = `${NATIONALMUSEUM_CONTEXT}

You are its curator-facing vision assistant: identify the historical or cultural object in this photograph (likely Nationalmuseum holdings or displays).
Respond with ONLY a JSON object, no prose, no markdown fences. Exact shape:
{
  "name": "<short object name, e.g. 'Glättsten' or 'Roman amphora'>",
  "period": "<rough period, e.g. '1100-1500 CE' or 'Unknown'>",
  "context": "<one short phrase, e.g. 'Textile craft tool'>",
  "summary": "<one sentence describing what it is and what it was used for>"
}
Use plain ASCII in all string values: hyphens for date ranges, no emoji, no en dash or em dash.
If the image clearly does not show a plausible museum artefact or artwork, set name to "Unidentified" and explain briefly in summary.`;

  const text = await callOpenRouter({
    model: VISION_MODEL,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
        ],
      },
    ],
    maxTokens: 800,
    temperature: 0.4,
  });

  const parsed = extractJSON(text);
  if (parsed && parsed.name) return parsed;
  return { name: 'Unidentified', period: 'Unknown', context: '', summary: text.slice(0, 200) };
}

// Text: generate explanation tailored to user's preferences
// mode: 'quick' | 'detailed' | 'immersive'
const asciiHint = 'Use plain ASCII in every JSON string value: simple hyphen for ranges, no emoji, no en dash or em dash.';

export async function generateExplanation({ object, mode, interest, style }) {
  const objectName = object?.name || 'Nationalmuseum artefact';
  const objectContext = object?.context || '';
  const objectSummary = object?.summary || '';

  const styleHint = {
    'Story-based': 'Use a warm, narrative tone; tell a small story.',
    'Chronological': 'Frame the answer with clear time markers and historical sequence.',
    'Thematic': 'Frame the answer around themes (everyday life, craft, society).',
  }[style] || 'Use a clear, engaging tone.';

  const interestHint = interest ? `The visitor is most interested in: ${interest}.` : '';

  let prompt;
  let maxTokens = 500;
  let temperature = 0.7;

  if (mode === 'quick') {
    maxTokens = 700;
    prompt = `${NATIONALMUSEUM_CONTEXT}

You are a friendly in-gallery voice guide here. The visitor scanned: ${objectName}${objectContext ? ` (${objectContext})` : ''}.
${objectSummary ? `Known background: ${objectSummary}` : ''}
${interestHint}
${styleHint}
${asciiHint}

Respond with ONLY a JSON object, no prose, no markdown fences:
{ "bullets": ["...", "...", "..."] }
Exactly 3 bullets, each at most 18 words.`;
  } else if (mode === 'detailed') {
    maxTokens = 1200;
    prompt = `${NATIONALMUSEUM_CONTEXT}

You are a curator writing for museum labels and visitors. They scanned: ${objectName}${objectContext ? ` (${objectContext})` : ''}.
${objectSummary ? `Known background: ${objectSummary}` : ''}
${interestHint}
${styleHint}
${asciiHint}

Respond with ONLY a JSON object, no prose, no markdown fences:
{
  "paragraphs": ["<paragraph 1, 2-3 sentences>", "<paragraph 2, 2-3 sentences>"],
  "meta": {
    "period": "<short>",
    "context": "<short>",
    "function": "<short>",
    "importance": "<short>"
  }
}`;
  } else if (mode === 'immersive') {
    maxTokens = 900;
    temperature = 0.85;
    prompt = `${NATIONALMUSEUM_CONTEXT}

You are writing a short immersive listening moment inside Nationalmuseum Stockholm.
Object: ${objectName}${objectContext ? ` (${objectContext})` : ''}.
${objectSummary ? `Background: ${objectSummary}` : ''}
${interestHint}
${asciiHint}

Write 2 short first-person lines from a historical character who actually used this object.
Respond with ONLY a JSON object, no prose, no markdown fences:
{
  "character": "<who the speaker is, e.g. 'Medieval textile worker, 1200 CE'>",
  "lines": [
    "<first line, in quotes, at most 30 words>",
    "<second line, in quotes, at most 30 words>"
  ]
}`;
  } else {
    throw new Error(`Unknown mode: ${mode}`);
  }

  const text = await callOpenRouter({
    model: TEXT_MODEL,
    messages: [{ role: 'user', content: prompt }],
    maxTokens,
    temperature,
  });

  const parsed = extractJSON(text);

  if (mode === 'quick') {
    if (parsed && Array.isArray(parsed.bullets) && parsed.bullets.length) return parsed;
    return { bullets: [text.slice(0, 120)] };
  }
  if (mode === 'detailed') {
    if (parsed && Array.isArray(parsed.paragraphs)) return parsed;
    return { paragraphs: [text], meta: {} };
  }
  if (mode === 'immersive') {
    if (parsed && Array.isArray(parsed.lines)) return parsed;
    return { character: 'Historical voice', lines: [text.slice(0, 120)] };
  }
}
