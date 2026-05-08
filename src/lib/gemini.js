// Lightweight OpenRouter wrapper using fetch (no npm dependencies).
// Free tier: https://openrouter.ai/  Account > Keys > Create Key
// Uses OpenAI-compatible chat completions API with free vision + text models.
//
// (Filename kept as gemini.js to avoid touching imports elsewhere.)

const rawKey = import.meta.env.VITE_OPENROUTER_API_KEY;
const API_KEY = typeof rawKey === 'string' ? rawKey.trim() : '';
const ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';

// Free models on OpenRouter (no credit card required).
// Tested working as of 2026-05; if rate-limited, try other `:free` models.
const VISION_MODEL = 'nvidia/nemotron-nano-12b-v2-vl:free';
const TEXT_MODEL   = 'openai/gpt-oss-120b:free';

/** Visitor app context: informs vision + text prompts. */
export const NATIONALMUSEUM_CONTEXT =
  "The visitor is at Nationalmuseum in Stockholm, Sweden: Sweden's national museum of fine art and applied arts (paintings, sculpture, works on paper, design, jewellery, ceramics, textiles, and major Nordic and European works). Prefer framing that fits that setting unless the scanned object clearly belongs elsewhere.";

export const aiEnabled = API_KEY.length > 0;

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
  if (!text || typeof text !== 'string') return null;
  let s = text.trim();
  const fence = s.match(/^```(?:json)?\s*([\s\S]*?)```$/im);
  if (!fence && s.includes('```')) {
    const inner = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (inner) s = inner[1].trim();
  } else if (fence) {
    s = fence[1].trim();
  }
  try {
    return JSON.parse(s);
  } catch {}

  const start = s.indexOf('{');
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < s.length; i++) {
    const c = s[i];
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) {
        const slice = s.slice(start, i + 1);
        try {
          return JSON.parse(slice);
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

// Vision: identify a museum object from a captured image
export async function recognizeObject(imageBase64, mimeType = 'image/jpeg') {
  const prompt = `${NATIONALMUSEUM_CONTEXT}

You are a vision assistant for gallery visitors. Look ONLY at THIS photograph and describe what is actually visible.
Do not assume the object is Nordic, medieval, or textile-related unless the image clearly shows that.
Do not copy any example names or categories from this prompt - pick a label that matches the photograph.
If you cannot see a clear object, say "Unidentified".

Respond with ONLY a JSON object, no prose, no markdown fences. Exact shape:
{
  "name": "<short English name for what you see, 2-6 words>",
  "period": "<rough period such as '1800s' or 'Unknown' if unsure>",
  "context": "<one short phrase: type of thing, e.g. 'Portrait painting', 'Silver tableware'>",
  "summary": "<one sentence: what it is and what it was for, grounded in visible details>"
}
Use plain ASCII in all string values: hyphens for date ranges, no emoji, no en dash or em dash.
Everyday bottles, utensils, dishes, furniture, or tools belong in museums too: name them plainly from what you see.
If nothing useful is visible in the photograph, set name to "Unidentified" and explain briefly in summary.`;

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
    temperature: 0.55,
  });

  const parsed = extractJSON(text);
  if (parsed && typeof parsed.name === 'string') {
    const name = parsed.name.trim();
    return {
      name: name || 'Unidentified',
      period: typeof parsed.period === 'string' && parsed.period.trim() ? parsed.period.trim() : 'Unknown',
      context: typeof parsed.context === 'string' ? parsed.context.trim() : '',
      summary: typeof parsed.summary === 'string' ? parsed.summary.trim() : text.slice(0, 200),
    };
  }
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
