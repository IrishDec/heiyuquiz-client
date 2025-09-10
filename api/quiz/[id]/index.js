export const config = { runtime: 'edge' };
import { store } from '../../_store.js';

export default async function handler(req, { params }) {
  try {
    const id   = params.id;
    const data = store.getQuizPublic(id);
    return new Response(JSON.stringify({ ok: true, ...data }), {
      headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 404, headers: { 'content-type': 'application/json' }
    });
  }
}

