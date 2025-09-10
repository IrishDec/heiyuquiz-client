export const config = { runtime: 'edge' };

export default async function handler(req) {
  return new Response(
    JSON.stringify({ ok: true, where: 'edge', now: Date.now() }),
    {
      headers: {
        'content-type': 'application/json',
        'cache-control': 'no-store',
      },
    }
  );
}
