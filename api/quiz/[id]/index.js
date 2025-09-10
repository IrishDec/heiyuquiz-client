export const config = { runtime: 'nodejs' };

import { getQuiz } from '../../_store.js';

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}

export default async function handler(req, ctx) {
  try {
    const id = ctx?.params?.id || req.url.split('/').slice(-1)[0];
    const quiz = getQuiz(id);
    if (!quiz) return json({ ok:false, error:'not_found' }, 404);

    const now = Date.now();
    const open = now < quiz.closesAt;
    return json({ ok:true, id, open, closesAt: quiz.closesAt, category: quiz.category, region: quiz.region, topic: quiz.topic, questions: quiz.questions });
  } catch (err) {
    console.error('quiz/[id] error:', err);
    return json({ ok:false, error:String(err?.message || err) }, 500);
  }
}
