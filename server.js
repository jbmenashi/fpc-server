import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { createRemoteJWKSet } from "jose";
import { createRequireClerkAuth } from "./middleware/auth.js";
import healthRoutes from "./routes/health.js";
import authRoutes from "./routes/auth.js";
import leaguesRoutes from "./routes/leagues.js";
import contestantsRoutes from "./routes/contestants.js";
import draftsRoutes from "./routes/drafts.js";
import playersRoutes from "./routes/players.js";

dotenv.config();

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;
const CLERK_ISSUER = process.env.CLERK_ISSUER;

// ---- Clerk JWT middleware (JWKS) ----
if (!CLERK_ISSUER) {
  console.error("Missing CLERK_ISSUER in .env");
  process.exit(1);
}

const jwks = createRemoteJWKSet(new URL(`${CLERK_ISSUER}/.well-known/jwks.json`));
const requireClerkAuth = createRequireClerkAuth(jwks, CLERK_ISSUER);

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Public paths that don't require auth
const publicPaths = new Set(["/health"]);

app.use((req, res, next) => {
  // allowlist exact paths (adjust if you have more)
  if (publicPaths.has(req.path)) return next();
  return requireClerkAuth(req, res, next);
});

// ---- Routes ----
app.use("/health", healthRoutes);
app.use("", authRoutes);
app.use("/leagues", leaguesRoutes);
app.use("/contestants", contestantsRoutes);
app.use("/drafts", draftsRoutes);
app.use("/players", playersRoutes);

// ---- Start ----
async function start() {
  if (!MONGODB_URI) {
    console.error("Missing MONGODB_URI in .env");
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`);
  });
}

start().catch((e) => {
  console.error(e);
  process.exit(1);
});
