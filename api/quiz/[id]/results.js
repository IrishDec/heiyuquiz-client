export const config = { runtime: 'nodejs' };

import { getResults } from '../../_store.js';

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}

export default async function handler(req, ctx) {
  try {
    const id = ctx?.params?.id || req.url.split('/').slice(-2, -1)[0];
    const data = getResults(id);
    if (!data) return json({ ok:false, error:'not_found' }, 404);
    return json({ ok:true, ...data });
  } catch (err) {
    console.error('results error:', err);
    return json({ ok:false, error:String(err?.message || err) }, 500);
  }
}
