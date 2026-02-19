function requireAuth(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ error: "not_authenticated" });
  return next();
}

module.exports = requireAuth;
