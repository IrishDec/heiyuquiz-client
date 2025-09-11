const { getStore, cleanup } = require('../../../_lib/store');

module.exports.config = { runtime: 'nodejs' };

module.exports = (req, res) => {
  try {
    const { id } = req.query || {};
    const s = getStore();
    cleanup();

    const q = s.quizzes.get(id);
    const arr = s.results.get(id) || [];
    const total = q ? q.questions.length : (arr[0]?.total || 0);

    res.status(200).json({
      ok: true,
      totalQuestions: total,
      results: arr
    });
  } catch (e) {
    console.error('results error', e);
    res.status(500).json({ ok: false, error: 'Server error (results)' });
  }
};
