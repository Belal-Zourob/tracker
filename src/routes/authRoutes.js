const express = require("express");
const bcrypt = require("bcrypt");

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

function normalizeUsername(value) {
  return String(value || "").trim().toLowerCase();
}

function regenerateSession(req) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((err) => {
      if (err) return reject(err);
      return resolve();
    });
  });
}

setInterval(() => {
  const now = Date.now();
  for (const [key, value] of loginAttempts.entries()) {
    if (value.resetAt <= now) loginAttempts.delete(key);
  }
}, 1000 * 60 * 5).unref();

function createAuthRouter({ db, sessionCookieName }) {
  const router = express.Router();

  router.post("/login", async (req, res) => {
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
    } catch (err) {
      return res.status(500).json({ error: "server_error" });
    }
  });

  router.post("/logout", (req, res) => {
    req.session.destroy(() => {
      res.clearCookie(sessionCookieName);
      res.json({ ok: true });
    });
  });

  router.get("/me", (req, res) => {
    if (!req.session.userId) return res.json({ authed: false });
    return res.json({ authed: true, username: req.session.username });
  });

  return router;
}

module.exports = createAuthRouter;
