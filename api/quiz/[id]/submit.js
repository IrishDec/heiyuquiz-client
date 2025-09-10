export const config = { runtime: 'nodejs18.x' };
import { getQuiz, saveResult } from '../../_store.js';

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}

export default async function handler(req, ctx) {
  try {
    if (req.method !== 'POST') return json({ ok:false, error:'Method Not Allowed' }, 405);

    const id = ctx?.params?.id || req.url.split('/').slice(-2, -1)[0];
    const quiz = getQuiz(id);
    if (!quiz) return json({ ok:false, error:'not_found' }, 404);

    const { name = 'Player', picks = [] } = await req.json();
    const total = quiz.questions.length;
    let score = 0;
    // no correct answers in sample bank; treat first option as “correct” for demo
    picks.forEach((p, i) => { if (Number(p) === 0) score++; });

    saveResult(id, { name, score, total });
    return json({ ok:true, score, total });
  } catch (err) {
    console.error('submit error:', err);
    return json({ ok:false, error:String(err?.message || err) }, 500);
  }
}
