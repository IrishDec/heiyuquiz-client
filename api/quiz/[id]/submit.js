export const config = { runtime: 'edge' };

import { store } from '../../_store.js';                  // <-- was ../../../_store.js

export default async function handler(req) {
  if (req.method !== 'POST') {
    return json({ ok: false, error: 'POST only' }, 405);
  }

  const url = new URL(req.url);
  const id = url.pathname.split('/').slice(-2, -1)[0];

  const qz = db().get(id);
  if (!qz) return json({ ok: false, error: 'not_found' }, 404);

  if (Date.now() >= qz.closesAt) {
    qz.open = false;
    return json({ ok: false, error: 'expired' }, 410);
  }

  let body = {};
  try { body = await req.json(); } catch {}

  const name  = (body.name || 'Player').toString().slice(0, 40).trim();
  const picks = Array.isArray(body.picks) ? body.picks.map(x => x | 0) : [];

  const total = qz.answers.length;
  let score = 0;
  for (let i = 0; i < total; i++) {
    if (picks[i] === qz.answers[i]) score++;
  }

  // Upsert result by name (last submission wins)
  const existing = qz.results.findIndex(r => r.name === name);
  const row = { name, score, total, ts: Date.now() };
  if (existing >= 0) qz.results[existing] = row;
  else qz.results.push(row);

  return json({ ok: true, score, total });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}
