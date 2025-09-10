// Lightweight in-memory store for Vercel functions.
// NOTE: This is fine for testing, not for "viral" scale.
// Later we’ll swap this for Vercel KV / Supabase.

const g = globalThis;
if (!g.__QUIZ_STORE__) {
  g.__QUIZ_STORE__ = new Map(); // id -> quiz object
}
export function db() {
  return g.__QUIZ_STORE__;
}

export function newId(len = 6) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/1/O/I
  let s = '';
  for (let i = 0; i < len; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return s;
}
