const RENDER_BASE = process.env.RENDER_BASE || "https://heiyuquiz-server.onrender.com";
export const config = { runtime: "edge" };

export default async function handler(req) {
  const id = new URL(req.url).pathname.split("/").pop();
  const r = await fetch(`${RENDER_BASE}/api/quiz/${id}`, { headers: { "accept": "application/json" } });
  return new Response(await r.text(), { status: r.status, headers: { "content-type": "application/json" } });
}
