export const config = { runtime: 'nodejs' };

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ ok:false, error:'POST only' }), {
      status: 405, headers:{ 'content-type':'application/json' }
    });
  }
  return new Response(JSON.stringify({ ok:true, test:'createQuiz alive' }), {
    status: 200, headers:{ 'content-type':'application/json' }
  });
}
