function verifySameOrigin(req, res, next) {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) return next();

  const origin = req.get("origin");
  if (!origin) return next();

  try {
    const requestOrigin = new URL(origin);
    if (requestOrigin.host !== req.get("host")) {
      return res.status(403).json({ error: "bad_origin" });
    }
  } catch (err) {
    return res.status(403).json({ error: "bad_origin" });
  }

  return next();
}

module.exports = verifySameOrigin;
