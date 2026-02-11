const path = require("path");
const express = require("express");
const session = require("express-session");
const bcrypt = require("bcrypt");
const db = require("./db");

const app = express();

app.use(express.json({ limit: "50kb" }));
app.use(express.static(path.join(__dirname, "public")));

app.set("trust proxy", 1);
app.use(
  session({
    name: "sid",
    secret: process.env.SESSION_SECRET || "dev_secret_change_me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: false, // zet op true achter HTTPS
      maxAge: 1000 * 60 * 60 * 24 * 14, // 14 dagen
    },
  })
);

// ---- Helpers ----
function requireAuth(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ error: "not_authenticated" });
  next();
}

function normalizeUsername(u) {
  return String(u || "").trim().toLowerCase();
}

// ---- Auth ----
// Regel: als username niet bestaat => aanmaken met password
// Als bestaat => password check
app.post("/api/login", async (req, res) => {
  try {
    const username = normalizeUsername(req.body.username);
    const password = String(req.body.password || "");

    if (username.length < 3 || username.length > 32) {
      return res.status(400).json({ error: "username_length" });
    }
    if (password.length < 6 || password.length > 128) {
      return res.status(400).json({ error: "password_length" });
    }

    const row = db.prepare("SELECT id, password_hash FROM users WHERE username = ?").get(username);

    if (!row) {
      const hash = await bcrypt.hash(password, 12);
      const info = db.prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)").run(username, hash);
      const userId = Number(info.lastInsertRowid);

      // Default vak
      db.prepare("INSERT OR IGNORE INTO subjects (user_id, name) VALUES (?, ?)").run(userId, "Algemeen");

      req.session.userId = userId;
      req.session.username = username;
      return res.json({ ok: true, created: true, username });
    }

    const ok = await bcrypt.compare(password, row.password_hash);
    if (!ok) return res.status(401).json({ error: "invalid_credentials" });

    req.session.userId = row.id;
    req.session.username = username;
    return res.json({ ok: true, created: false, username });
  } catch (e) {
    return res.status(500).json({ error: "server_error" });
  }
});

app.post("/api/logout", (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get("/api/me", (req, res) => {
  if (!req.session.userId) return res.json({ authed: false });
  res.json({ authed: true, username: req.session.username });
});

// ---- Subjects ----
app.get("/api/subjects", requireAuth, (req, res) => {
  const rows = db
    .prepare("SELECT name FROM subjects WHERE user_id = ? ORDER BY name COLLATE NOCASE")
    .all(req.session.userId);
  res.json({ subjects: rows.map(r => r.name) });
});

app.post("/api/subjects", requireAuth, (req, res) => {
  const name = String(req.body.name || "").trim();
  if (name.length < 1 || name.length > 60) return res.status(400).json({ error: "bad_subject" });

  db.prepare("INSERT OR IGNORE INTO subjects (user_id, name) VALUES (?, ?)").run(req.session.userId, name);
  res.json({ ok: true });
});

app.delete("/api/subjects/:name", requireAuth, (req, res) => {
  const name = String(req.params.name || "").trim();
  if (!name) return res.status(400).json({ error: "bad_subject" });
  db.prepare("DELETE FROM subjects WHERE user_id = ? AND name = ?").run(req.session.userId, name);
  res.json({ ok: true });
});

// ---- Entries ----
app.get("/api/week", requireAuth, (req, res) => {
  const start = String(req.query.start || ""); // YYYY-MM-DD (maandag)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start)) return res.status(400).json({ error: "bad_start" });

  // 7 dagen (start..start+6) via SQLite date()
  const rows = db.prepare(`
    SELECT id, day, subject, type, hours, note, created_at
    FROM entries
    WHERE user_id = ?
      AND day >= ?
      AND day <= date(?, '+6 day')
    ORDER BY day ASC, created_at DESC
  `).all(req.session.userId, start, start);

  res.json({ entries: rows });
});

app.post("/api/entries", requireAuth, (req, res) => {
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

  db.prepare(`
    INSERT INTO entries (user_id, day, subject, type, hours, note)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(req.session.userId, day, subject, type, Math.round(hours * 100) / 100, note);

  res.json({ ok: true });
});

app.delete("/api/entries/:id", requireAuth, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "bad_id" });

  db.prepare("DELETE FROM entries WHERE id = ? AND user_id = ?").run(id, req.session.userId);
  res.json({ ok: true });
});

app.delete("/api/week", requireAuth, (req, res) => {
  const start = String(req.query.start || "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start)) return res.status(400).json({ error: "bad_start" });

  db.prepare(`
    DELETE FROM entries
    WHERE user_id = ?
      AND day >= ?
      AND day <= date(?, '+6 day')
  `).run(req.session.userId, start, start);

  res.json({ ok: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`http://localhost:${PORT}`));
