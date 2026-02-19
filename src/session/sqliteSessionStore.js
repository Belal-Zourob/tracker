const session = require("express-session");

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

module.exports = SqliteSessionStore;
