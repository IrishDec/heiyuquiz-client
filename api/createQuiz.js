export const config = { runtime: 'edge' };

import { store, TTL_SEC } from './_store.js';   // note: "./", not "../"
import { debit, credit }   from './_bank.js';   // note: "./", not "../"

export default async function handler(req) {
  try {
    const { category = 'General', region = 'global', topic = '', amount = 5, durationSec = TTL_SEC } =
      (await req.json().catch(() => ({}))) || {};

    const quiz = store.createQuiz({ category, region, topic, amount, durationSec });

    return new Response(JSON.stringify({ ok: true, id: quiz.id, closesAt: quiz.closesAt, category }), {
      headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }
    });
  } catch (err) {
    // Return JSON instead of the default HTML error so you can see what broke
    return new Response(JSON.stringify({ ok: false, error: String(err), stack: err?.stack }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
}

