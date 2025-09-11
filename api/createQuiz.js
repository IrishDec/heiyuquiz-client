// api/createQuiz.js
exports.config = { runtime: "nodejs" };

module.exports = (req, res) => {
  res.setHeader("content-type", "application/json");
  if (req.method !== "POST") {
    res.status(405).end(JSON.stringify({ ok:false, error:"method_not_allowed" }));
    return;
  }
  const id = Math.random().toString(36).slice(2,8).toUpperCase();
  res.status(200).end(JSON.stringify({ ok:true, id, closesAt: Date.now() + 86400*1000 }));
};

