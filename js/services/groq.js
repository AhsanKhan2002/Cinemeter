import CONFIG from '../config.js';
import * as Cache from '../cache.js';

const _pending = new Set();

export async function getInsight(movieId, title, audienceScore, criticScore, controversyScore, label) {
  const key = `groq:insight:${movieId}`;
  const cached = Cache.get(key);
  if (cached) return cached;
  if (_pending.has(movieId)) throw new Error('Request already in flight');

  _pending.add(movieId);
  try {
    const prompt = `Movie: "${title}"
Audience Score: ${audienceScore ?? 'N/A'}/100
Critic Score: ${criticScore ?? 'N/A'}/100
Controversy Score: ${controversyScore ?? 'N/A'}/100
Verdict: ${label}

Write exactly 3 sharp, opinionated sentences analyzing why this movie's ratings diverge between audiences and critics. Be direct and insightful. No fluff.`;

    const res = await fetch(`${CONFIG.GROQ_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.GROQ_KEY}`
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        max_tokens: 200,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!res.ok) throw new Error(`Groq error ${res.status}`);
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim() || 'No insight available.';
    Cache.set(key, text);
    return text;
  } finally {
    _pending.delete(movieId);
  }
}
