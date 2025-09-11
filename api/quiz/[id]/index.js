// runtime: Node on Vercel
export const config = { runtime: 'nodejs' };

import { getStore } from '../../_lib/store.js';

const json = (status, obj) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }
  });

export default async function handler(req, ctx) {
  try {
    // id from route params or last path segment
    let id =
      (ctx?.params && (Array.isArray(ctx.params.id) ? ctx.params.id[0] : ctx.params.id)) ||
      req.url.split('/').pop();

    if (!id) return json(400, { ok: false, error: 'Missing id' });

    const DB = getStore();
    const rec = DB.get(id);

    if (!rec) return json(404, { ok: false, error: 'Quiz not found' });

    const { category, region, topic, closesAt } = rec;

    // Make sure questions are safe & always an array
    const safeQuestions = Array.isArray(rec.questions)
      ? rec.questions.map(q => ({
          q: q.q ?? q.question ?? 'Question',
          options: Array.isArray(q.options) ? q.options : (q.choices || [])
        }))
      : [];

    return json(200, {
      ok: true,
      id,
      category: category || 'Quiz',
      region: region || 'global',
      topic: topic || '',
      closesAt: closesAt || null,
      questions: safeQuestions
    });
  } catch (err) {
    // Never crash the function—return JSON instead of a 500 HTML page
    console.error('GET /api/quiz/[id] error:', err);
    return json(500, { ok: false, error: 'Server error' });
  }
}

