export const config = { runtime: 'edge' };
import { db } from '../../../_store.js';

export default async function handler(req) {
  const url = new URL(req.url);
  const id = url.pathname.split('/').slice(-2, -1)[0];

  const qz = db().get(id);
  if (!qz) return json({ ok: false, error: 'not_found' }, 404);

  const total = qz.answers.length;
  const results = [...qz.results]
    .sort((a,b) => b.score - a.score || a.ts - b.ts)
    .map(r => ({ name: r.name, score: r.score, total }));

  return json({ ok: true, id: qz.id, totalQuestions: total, results });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}
