import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { createRemoteJWKSet, jwtVerify } from "jose";

dotenv.config();

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

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;
const CLERK_ISSUER = process.env.CLERK_ISSUER;

// ---- MongoDB model ----
const todoSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    text: { type: String, required: true },
    done: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Todo = mongoose.model("Todo", todoSchema);

// ---- Clerk JWT middleware (JWKS) ----
if (!CLERK_ISSUER) {
  console.error("Missing CLERK_ISSUER in .env");
  process.exit(1);
}

const jwks = createRemoteJWKSet(new URL(`${CLERK_ISSUER}/.well-known/jwks.json`));

async function requireClerkAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing Bearer token" });
    }

    const token = authHeader.slice("Bearer ".length).trim();
    const { payload } = await jwtVerify(token, jwks, { issuer: CLERK_ISSUER });

    // Clerk user id is typically in `sub`
    if (!payload.sub) {
      return res.status(401).json({ error: "Token missing sub (userId)" });
    }

    req.auth = {
      userId: payload.sub,
      claims: payload,
    };

    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// ---- Routes ----
app.get("/health", (req, res) => res.json({ ok: true }));

app.get("/me", requireClerkAuth, (req, res) => {
  res.json({ userId: req.auth.userId });
});

app.get("/todos", requireClerkAuth, async (req, res) => {
  const todos = await Todo.find({ userId: req.auth.userId })
    .sort({ createdAt: -1 })
    .lean();
  res.json(todos);
});

app.post("/todos", requireClerkAuth, async (req, res) => {
  const { text } = req.body || {};
  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "Body must include { text: string }" });
  }

  const todo = await Todo.create({ userId: req.auth.userId, text, done: false });
  res.status(201).json(todo);
});

app.put("/todos/:id", requireClerkAuth, async (req, res) => {
  const { id } = req.params;
  const { text, done } = req.body || {};

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid todo ID" });
  }

  const updateData = {};
  if (text !== undefined) {
    if (typeof text !== "string") {
      return res.status(400).json({ error: "text must be a string" });
    }
    updateData.text = text;
  }
  if (done !== undefined) {
    if (typeof done !== "boolean") {
      return res.status(400).json({ error: "done must be a boolean" });
    }
    updateData.done = done;
  }

  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({ error: "Body must include at least one field to update (text or done)" });
  }

  const todo = await Todo.findOneAndUpdate(
    { _id: id, userId: req.auth.userId },
    updateData,
    { new: true, runValidators: true }
  );

  if (!todo) {
    return res.status(404).json({ error: "Todo not found" });
  }

  res.json(todo);
});

app.delete("/todos/:id", requireClerkAuth, async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid todo ID" });
  }

  const todo = await Todo.findOneAndDelete({ _id: id, userId: req.auth.userId });

  if (!todo) {
    return res.status(404).json({ error: "Todo not found" });
  }

  res.json({ message: "Todo deleted successfully" });
});

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
