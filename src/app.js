const path = require("path");
const express = require("express");
const session = require("express-session");

const db = require("./db");
const { getSessionSettings } = require("./config/session");
const verifySameOrigin = require("./middleware/sameOrigin");
const securityHeaders = require("./middleware/securityHeaders");
const createAuthRouter = require("./routes/authRoutes");
const createSubjectRouter = require("./routes/subjectRoutes");
const createEntryRouter = require("./routes/entryRoutes");
const SqliteSessionStore = require("./session/sqliteSessionStore");

function createApp() {
  const app = express();
  const isProd = process.env.NODE_ENV === "production";
  const { sessionCookieName, effectiveSessionSecret } = getSessionSettings(isProd);

  app.disable("x-powered-by");
  app.use(securityHeaders({ isProd }));

  app.use(express.json({ limit: "50kb" }));
  app.use(express.static(path.join(__dirname, "..", "public")));
  app.use("/api", verifySameOrigin);

  const sessionStore = new SqliteSessionStore(db);
  setInterval(() => sessionStore.clearExpired(), 1000 * 60 * 15).unref();

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
        maxAge: 1000 * 60 * 60 * 24 * 14,
      },
    })
  );

  app.use("/api", createAuthRouter({ db, sessionCookieName }));
  app.use("/api", createSubjectRouter({ db }));
  app.use("/api", createEntryRouter({ db }));

  return app;
}

module.exports = createApp;
