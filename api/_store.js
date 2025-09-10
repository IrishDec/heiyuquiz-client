// In-memory store — resets on redeploys. Good enough for testing.

export const TTL_SEC = 24 * 3600; // default 24h

const quizzes = new Map(); // id -> { category, region, topic, closesAt, questions, submissions:[] }

function uid() {
  // Short ID, uppercased
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function demoQuestions(n = 5) {
  return Array.from({ length: n }, (_, i) => ({
    q: `Sample question #${i + 1}?`,
    options: ['Option A', 'Option B', 'Option C', 'Option D'],
    answer: 0
  }));
}

export const store = {
  createQuiz({ category = 'General', region = 'global', topic = '', amount = 5, durationSec = TTL_SEC }) {
    const id = uid();
    const closesAt = Date.now() + durationSec * 1000;
    const questions = demoQuestions(amount);
    quizzes.set(id, { category, region, topic, closesAt, questions, submissions: [] });
    return { id, closesAt, category, region, topic, questions };
  },

  getQuizPublic(id) {
    const q = quizzes.get(id);
    if (!q) throw new Error('not-found');
    if (Date.now() > q.closesAt) throw new Error('expired');
    // hide answers server-side
    return { category: q.category, region: q.region, topic: q.topic, closesAt: q.closesAt, questions: q.questions.map(({ q:qq, options }) => ({ q: qq, options })) };
  },

  submit(id, name, picks = []) {
    const q = quizzes.get(id);
    if (!q) throw new Error('not-found');
    const score = q.questions.reduce((s, it, i) => s + (picks[i] === it.answer ? 1 : 0), 0);
    q.submissions.push({ name, score, total: q.questions.length, t: Date.now() });
    return { score, total: q.questions.length };
  },

  results(id) {
    const q = quizzes.get(id);
    if (!q) throw new Error('not-found');
    const results = [...q.submissions].sort((a, b) => b.score - a.score);
    return { totalQuestions: q.questions.length, results };
  }
};

