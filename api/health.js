module.exports.config = { runtime: 'nodejs' };
module.exports = (req, res) => {
  res.status(200).json({ ok: true, where: 'node', now: Date.now() });
};
