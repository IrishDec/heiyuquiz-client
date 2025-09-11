const { getStore, cleanup, readJson } = require('../../../_lib/store');

module.exports.config = { runtime: 'nodejs' };

module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

    const { id } = req.query || {};
    const s = getStore();
    cleanup();

    const q = s.quizzes.get(id);
    if (!q) return res.status(404).json({ ok: false, error: 'Quiz not found' });
    if (Date.now() > q.closesAt) return res.status(410).json({ ok: false, error: 'Quiz expired' });

    const body = await readJson(req);
    const name = (body.name || 'Player').toString().slice(0, 40);
    const picks = Array.isArray(body.picks) ? body.picks : [];

    const total = q.questions.length;
    let score = 0;
    for (let i = 0; i < total; i++) {
      if (picks[i] === q.answers[i]) score++;
    }

    const arr = s.results.get(id) || [];
    arr.push({ name, score, total });
    // sort by score desc, then name
    arr.sort((a, b) => (b.score - a.score) || a.name.localeCompare(b.name));
    s.results.set(id, arr);

    res.status(200).json({ ok: true, score, total });
  } catch (e) {
    console.error('submit error', e);
    res.status(500).json({ ok: false, error: 'Server error (submit)' });
  }
};
