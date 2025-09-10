export const config = { runtime: 'edge' };

import { store } from '../../_store.js';                  // <-- was ../../../_store.js


export default async function handler(req, ctx) {
  const url = new URL(req.url);
  const id = url.pathname.split('/').slice(-2, -1)[0]; // /api/quiz/[id]/ -> grab [id]

  const qz = db().get(id);
  if (!qz) {
    return json({ ok: false, error: 'not_found' }, 404);
  }

  const now = Date.now();
  const open = now < qz.closesAt;
  if (!open) {
    qz.open = false;
    // Still return metadata so client can show “expired”
    return json({
      ok: false,
      error: 'expired',
      id: qz.id,
      category: qz.category,
      region: qz.region,
      topic: qz.topic,
      closesAt: qz.closesAt,
      open: false,
    }, 410);
  }

  return json({
    ok: true,
    id: qz.id,
    category: qz.category,
    region: qz.region,
    topic: qz.topic,
    closesAt: qz.closesAt,
    open: true,
    questions: qz.questionsPub, // no answers here
  });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}
