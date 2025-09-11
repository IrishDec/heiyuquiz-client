const { getStore, cleanup } = require('../../../_lib/store');

module.exports.config = { runtime: 'nodejs' };

module.exports = (req, res) => {
  try {
    const { id } = req.query || {};
    const s = getStore();
    cleanup();

    const q = s.quizzes.get(id);
    if (!q) {
      // missing or already GC'd
      return res.status(404).json({ ok: false, error: 'Quiz not found' });
    }
    if (Date.now() > q.closesAt) {
      return res.status(410).json({ ok: false, error: 'Quiz expired', closesAt: q.closesAt });
    }

    res.status(200).json({
      ok: true,
      id: q.id,
      category: q.category,
      region: q.region,
      topic: q.topic,
      closesAt: q.closesAt,
      questions: q.questions
    });
  } catch (e) {
    console.error('get quiz error', e);
    res.status(500).json({ ok: false, error: 'Server error (quiz get)' });
  }
};
