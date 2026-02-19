const crypto = require("crypto");

function getSessionSettings(isProd) {
  const sessionSecret = process.env.SESSION_SECRET;
  const sessionCookieName = isProd ? "__Host-sid" : "sid";

  if (isProd && (!sessionSecret || sessionSecret.length < 32)) {
    throw new Error("SESSION_SECRET is required in production and must be at least 32 characters.");
  }

  const effectiveSessionSecret = sessionSecret || crypto.randomBytes(48).toString("hex");
  if (!sessionSecret) {
    console.warn("SESSION_SECRET is not set. Using ephemeral secret for this process.");
  }

  return { sessionCookieName, effectiveSessionSecret };
}

module.exports = { getSessionSettings };
