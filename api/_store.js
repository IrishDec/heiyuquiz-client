// Force Node runtime explicitly when imported by Node routes
export const config = { runtime: 'nodejs18.x' };

// Very simple in-memory store (per serverless instance)
const db = globalThis.__QUIZ_DB || (globalThis.__QUIZ_DB = new Map());

export function saveQuiz(q) { db.set(q.id, q); }
export function getQuiz(id)  { return db.get(id) || null; }
export function saveResult(id, row) {
  const q = db.get(id); if (!q) return;
  if (!q.results) q.results = [];
  q.results.push(row);
}
export function getResults(id) {
  const q = db.get(id);
  return q ? { results: q.results || [], totalQuestions: q.questions?.length || 0 } : null;
}
