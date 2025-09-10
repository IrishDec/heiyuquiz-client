export const config = { runtime: 'nodejs18.x' };
import { saveQuiz } from './_store.js';
import { getQuestions } from './_bank.js';

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}

export default async function handler(req) {
  try {
    if (req.method !== 'POST') return json({ ok:false, error:'Method Not Allowed' }, 405);

    let body = {};
    try { body = await req.json(); } catch {}
    const {
      category = 'General',
      region = 'global',
      topic = '',
      amount = 5,
      durationSec = 86400,
    } = body;

    const id = Math.random().toString(36).slice(2, 8).toUpperCase();
    const closesAt = Date.now() + durationSec * 1000;
    const questions = getQuestions({ category, topic, amount });

    saveQuiz({ id, category, region, topic, closesAt, questions, results: [] });

    return json({ ok:true, id, quizId:id, category, region, topic, closesAt });
  } catch (err) {
    console.error('createQuiz error:', err);
    return json({ ok:false, error: String(err?.message || err) }, 500);
  }
}
