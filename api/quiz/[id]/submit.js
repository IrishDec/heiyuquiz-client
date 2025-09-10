export const config = { runtime: 'edge' };
import { store } from '../../_store.js';

export default async function handler(req, { params }) {
  try {
    const id = params.id;
    const { name = 'Player', picks = [] } = (await req.json().catch(() => ({}))) || {};
    const result = store.submit(id, name, picks);
    return new Response(JSON.stringify({ ok: true, ...result }), {
      headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 400, headers: { 'content-type': 'application/json' }
    });
  }
}

