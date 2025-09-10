// api/health.js
export const config = { runtime: 'edge' };

export default function handler() {
  return new Response(
    JSON.stringify({ ok: true, where: 'edge', now: Date.now() }),
    { headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } }
  );
}


export default async function handler() {
  return new Response(JSON.stringify({ ok: true, where: 'node', now: Date.now() }), {
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}
