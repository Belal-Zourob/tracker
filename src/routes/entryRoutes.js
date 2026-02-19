const express = require("express");
const requireAuth = require("../middleware/requireAuth");

function createEntryRouter({ db }) {
  const router = express.Router();

  router.get("/week", requireAuth, (req, res) => {
    const start = String(req.query.start || "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(start)) return res.status(400).json({ error: "bad_start" });

    const rows = db
      .prepare(`
        SELECT id, day, subject, type, hours, note, created_at
        FROM entries
        WHERE user_id = ?
          AND day >= ?
          AND day <= date(?, '+6 day')
        ORDER BY day ASC, created_at DESC
      `)
      .all(req.session.userId, start, start);

    return res.json({ entries: rows });
  });

  router.post("/entries", requireAuth, (req, res) => {
    const day = String(req.body.day || "");
    const subject = String(req.body.subject || "").trim();
    const type = String(req.body.type || "");
    const hours = Number(req.body.hours);
    const note = req.body.note == null ? null : String(req.body.note).trim();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return res.status(400).json({ error: "bad_day" });
    if (!subject || subject.length > 60) return res.status(400).json({ error: "bad_subject" });
    if (!["taak", "study", "lecture"].includes(type)) return res.status(400).json({ error: "bad_type" });
    if (!Number.isFinite(hours) || hours < 0 || hours > 24) return res.status(400).json({ error: "bad_hours" });
    if (note && note.length > 200) return res.status(400).json({ error: "note_too_long" });

    db.prepare(
      `
        INSERT INTO entries (user_id, day, subject, type, hours, note)
        VALUES (?, ?, ?, ?, ?, ?)
      `
    ).run(req.session.userId, day, subject, type, Math.round(hours * 100) / 100, note);

    return res.json({ ok: true });
  });

  router.delete("/entries/:id", requireAuth, (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: "bad_id" });

    db.prepare("DELETE FROM entries WHERE id = ? AND user_id = ?").run(id, req.session.userId);
    return res.json({ ok: true });
  });

  router.delete("/week", requireAuth, (req, res) => {
    const start = String(req.query.start || "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(start)) return res.status(400).json({ error: "bad_start" });

    db.prepare(
      `
        DELETE FROM entries
        WHERE user_id = ?
          AND day >= ?
          AND day <= date(?, '+6 day')
      `
    ).run(req.session.userId, start, start);

    return res.json({ ok: true });
  });

  return router;
}

module.exports = createEntryRouter;
