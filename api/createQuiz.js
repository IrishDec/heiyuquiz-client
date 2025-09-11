const { getStore, cleanup, makeId, sampleQuestions, readJson } = require('./_lib/store');

module.exports.config = { runtime: 'nodejs' };

module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

    const s = getStore();
    cleanup();

    const body = await readJson(req);
    const {
      category = 'General',
      region = 'global',
      topic = '',
      amount = 5,
      durationSec = 24 * 3600
    } = body || {};

    const id = makeId((x) => s.quizzes.has(x));
    const { questions, answers } = sampleQuestions(category, Math.max(3, Math.min(10, amount)));
    const now = Date.now();
    const closesAt = now + Math.max(60, durationSec) * 1000;

    s.quizzes.set(id, { id, category, region, topic, createdAt: now, closesAt, questions, answers });
    // init results array
    if (!s.results.has(id)) s.results.set(id, []);

    res.status(200).json({ ok: true, id, category, region, topic, closesAt });
  } catch (e) {
    console.error('createQuiz error', e);
    res.status(500).json({ ok: false, error: 'Server error (createQuiz)' });
  }
};
