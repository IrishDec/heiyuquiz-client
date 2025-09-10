export const config = { runtime: 'nodejs18.x' };

export default async function handler() {
  return new Response(JSON.stringify({ ok: true, where: 'node', now: Date.now() }), {
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}
