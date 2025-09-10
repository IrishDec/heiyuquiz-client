// api/health.js
export const config = { runtime: 'nodejs' };

export default function handler(req, res) {
  res.status(200).json({ ok: true, where: 'node', now: Date.now() });
}

