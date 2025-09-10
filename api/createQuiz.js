export const config = { runtime: 'edge' };
import { db, newId } from '../_store.js';
import { buildQuestions } from '../_bank.js';

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ ok: false, error: 'POST only' }), { status: 405 });
  }

  let body = {};
  try { body = await req.json(); } catch {}

  const category    = (body.category || 'General').toString();
  const region      = (body.region   || 'global').toString();
  const topic       = (body.topic    || '').toString();
  const amount      = Math.max(3, Math.min(10, body.amount | 0 || 5));
  const durationSec = Math.max(60, Math.min(86400 * 3, body.durationSec | 0 || 86400)); // cap 3 days max

  const { pub, answers } = buildQuestions(category, amount, topic);

  const id = newId(6);
  const now = Date.now();
  const quiz = {
    id, category, region, topic,
    createdAt: now,
    closesAt: now + durationSec * 1000,
    open: true,
    questionsPub: pub,       // safe to return to client
    answers,                 // secret
    results: [],             // {name, score, ts}
  };

  db().set(id, quiz);

  return new Response(JSON.stringify({ ok: true, id, quizId: id }), {
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}
