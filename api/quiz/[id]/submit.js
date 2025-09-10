const RENDER_BASE = process.env.RENDER_BASE || "https://heiyuquiz-server.onrender.com";
export const config = { runtime: "edge" };

export default async function handler(req) {
  const parts = new URL(req.url).pathname.split("/");
  const id = parts[parts.length - 2];
  const body = await req.text();
  const r = await fetch(`${RENDER_BASE}/api/quiz/${id}/submit`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body
  });
  return new Response(await r.text(), { status: r.status, headers: { "content-type": "application/json" } });
}
