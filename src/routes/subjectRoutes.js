const express = require("express");
const requireAuth = require("../middleware/requireAuth");

function createSubjectRouter({ db }) {
  const router = express.Router();

  router.get("/subjects", requireAuth, (req, res) => {
    const rows = db
      .prepare("SELECT name FROM subjects WHERE user_id = ? ORDER BY name COLLATE NOCASE")
      .all(req.session.userId);

    return res.json({ subjects: rows.map((row) => row.name) });
  });

  router.post("/subjects", requireAuth, (req, res) => {
    const name = String(req.body.name || "").trim();
    if (name.length < 1 || name.length > 60) {
      return res.status(400).json({ error: "bad_subject" });
    }

    db.prepare("INSERT OR IGNORE INTO subjects (user_id, name) VALUES (?, ?)").run(req.session.userId, name);
    return res.json({ ok: true });
  });

  router.delete("/subjects/:name", requireAuth, (req, res) => {
    const name = String(req.params.name || "").trim();
    if (!name) return res.status(400).json({ error: "bad_subject" });

    db.prepare("DELETE FROM subjects WHERE user_id = ? AND name = ?").run(req.session.userId, name);
    return res.json({ ok: true });
  });

  return router;
}

module.exports = createSubjectRouter;
