const path = require("path");
const express = require("express");
const session = require("express-session");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const db = require("./db");

const app = express();
const isProd = process.env.NODE_ENV === "production";
const sessionSecret = process.env.SESSION_SECRET;
const sessionCookieName = isProd ? "__Host-sid" : "sid";

if (isProd && (!sessionSecret || sessionSecret.length < 32)) {
  throw new Error("SESSION_SECRET is required in production and must be at least 32 characters.");
}

const effectiveSessionSecret = sessionSecret || crypto.randomBytes(48).toString("hex");
if (!sessionSecret) {
  console.warn("SESSION_SECRET is not set. Using ephemeral secret for this process.");
}

app.disable("x-powered-by");

class SqliteSessionStore extends session.Store {
  constructor(database) {
    super();
    this.db = database;
    this.getStmt = this.db.prepare(
      "SELECT sess FROM sessions WHERE sid = ? AND expires_at > ?"
    );
    this.setStmt = this.db.prepare(
      "INSERT INTO sessions (sid, sess, expires_at) VALUES (?, ?, ?) " +
      "ON CONFLICT(sid) DO UPDATE SET sess = excluded.sess, expires_at = excluded.expires_at"
    );
    this.destroyStmt = this.db.prepare("DELETE FROM sessions WHERE sid = ?");
    this.touchStmt = this.db.prepare("UPDATE sessions SET expires_at = ? WHERE sid = ?");
    this.clearExpiredStmt = this.db.prepare("DELETE FROM sessions WHERE expires_at <= ?");
  }

  get(sid, callback) {
    try {
      const row = this.getStmt.get(sid, Date.now());
      if (!row) return callback(null, null);
      return callback(null, JSON.parse(row.sess));
    } catch (err) {
      return callback(err);
    }
  }

  set(sid, sess, callback = () => {}) {
    try {
      const expiresAt = this.resolveExpiresAt(sess);
      this.setStmt.run(sid, JSON.stringify(sess), expiresAt);
      callback(null);
    } catch (err) {
      callback(err);
    }
  }

  destroy(sid, callback = () => {}) {
    try {
      this.destroyStmt.run(sid);
      callback(null);
    } catch (err) {
      callback(err);
    }
  }

  touch(sid, sess, callback = () => {}) {
    try {
      const expiresAt = this.resolveExpiresAt(sess);
      this.touchStmt.run(expiresAt, sid);
      callback(null);
    } catch (err) {
      callback(err);
    }
  }

  clearExpired() {
    this.clearExpiredStmt.run(Date.now());
  }

  resolveExpiresAt(sess) {
    if (sess && sess.cookie && sess.cookie.expires) {
      const ts = new Date(sess.cookie.expires).getTime();
      if (Number.isFinite(ts)) return ts;
    }
    if (sess && sess.cookie && Number.isFinite(sess.cookie.maxAge)) {
      return Date.now() + Number(sess.cookie.maxAge);
    }
    return Date.now() + 1000 * 60 * 60 * 24 * 14;
  }
}

const sessionStore = new SqliteSessionStore(db);
setInterval(() => sessionStore.clearExpired(), 1000 * 60 * 15).unref();

const LOGIN_WINDOW_MS = 1000 * 60 * 15;
const LOGIN_MAX_ATTEMPTS = 10;
const loginAttempts = new Map();

function loginAttemptKey(req, username) {
  return `${req.ip}|${username}`;
}

function isLoginLimited(key) {
  const entry = loginAttempts.get(key);
  if (!entry) return false;
  if (Date.now() > entry.resetAt) {
    loginAttempts.delete(key);
    return false;
  }
  return entry.count >= LOGIN_MAX_ATTEMPTS;
}

function registerFailedLogin(key) {
  const now = Date.now();
  const existing = loginAttempts.get(key);
  if (!existing || now > existing.resetAt) {
    loginAttempts.set(key, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    return;
  }
  existing.count += 1;
}

function clearLoginAttempts(key) {
  loginAttempts.delete(key);
}

setInterval(() => {
  const now = Date.now();
  for (const [key, value] of loginAttempts.entries()) {
    if (value.resetAt <= now) loginAttempts.delete(key);
  }
}, 1000 * 60 * 5).unref();

function verifySameOrigin(req, res, next) {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) return next();
  const origin = req.get("origin");
  if (!origin) return next(); // non-browser clients

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

function regenerateSession(req) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; img-src 'self' data:; script-src 'self'; style-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'"
  );
  if (isProd) {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  next();
});

app.use(express.json({ limit: "50kb" }));
app.use(express.static(path.join(__dirname, "public")));
app.use("/api", verifySameOrigin);

app.set("trust proxy", 1);
app.use(
  session({
    store: sessionStore,
    name: sessionCookieName,
    secret: effectiveSessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: isProd,
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
    const attemptKey = loginAttemptKey(req, username);

    if (isLoginLimited(attemptKey)) {
      return res.status(429).json({ error: "too_many_attempts" });
    }

    if (username.length < 3 || username.length > 32) {
      registerFailedLogin(attemptKey);
      return res.status(400).json({ error: "username_length" });
    }
    if (password.length < 6 || password.length > 128) {
      registerFailedLogin(attemptKey);
      return res.status(400).json({ error: "password_length" });
    }

    const row = db.prepare("SELECT id, password_hash FROM users WHERE username = ?").get(username);

    if (!row) {
      const hash = await bcrypt.hash(password, 12);
      const info = db.prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)").run(username, hash);
      const userId = Number(info.lastInsertRowid);

      // Default vak
      db.prepare("INSERT OR IGNORE INTO subjects (user_id, name) VALUES (?, ?)").run(userId, "Algemeen");

      await regenerateSession(req);
      req.session.userId = userId;
      req.session.username = username;
      clearLoginAttempts(attemptKey);
      return res.json({ ok: true, created: true, username });
    }

    const ok = await bcrypt.compare(password, row.password_hash);
    if (!ok) {
      registerFailedLogin(attemptKey);
      return res.status(401).json({ error: "invalid_credentials" });
    }

    await regenerateSession(req);
    req.session.userId = row.id;
    req.session.username = username;
    clearLoginAttempts(attemptKey);
    return res.json({ ok: true, created: false, username });
  } catch (e) {
    return res.status(500).json({ error: "server_error" });
  }
});

app.post("/api/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie(sessionCookieName);
    res.json({ ok: true });
  });
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
