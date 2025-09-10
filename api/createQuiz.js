const RENDER_BASE = process.env.RENDER_BASE || "https://heiyuquiz-server.onrender.com";
export const config = { runtime: "edge" };

export default async function handler(req) {
  const body = await req.text();
  const r = await fetch(`${RENDER_BASE}/api/createQuiz`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body
  });
  return new Response(await r.text(), { status: r.status, headers: { "content-type": "application/json" } });
}
