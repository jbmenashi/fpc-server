import express from "express";
import mongoose from "mongoose";
import { getRequireClerkAuth } from "../middleware/auth.js";
import League from "../models/League.js";

const router = express.Router();
const requireClerkAuth = getRequireClerkAuth();

router.get("/", requireClerkAuth, async (req, res) => {
  const leagues = await League.find()
    .sort({ createdAt: -1 })
    .lean();
  res.json(leagues);
});

router.get("/:id", requireClerkAuth, async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid league ID" });
  }

  const league = await League.findById(id).lean();

  if (!league) {
    return res.status(404).json({ error: "League not found" });
  }

  res.json(league);
});

router.post("/", requireClerkAuth, async (req, res) => {
  const { leagueName, size } = req.body || {};

  if (!leagueName || typeof leagueName !== "string") {
    return res.status(400).json({ error: "Body must include { leagueName: string }" });
  }

  if (size === undefined || typeof size !== "number" || !Number.isInteger(size) || size < 1) {
    return res.status(400).json({ error: "Body must include { size: integer } (must be >= 1)" });
  }

  const league = await League.create({
    leagueName,
    size,
    full: false,
    drafted: false,
  });

  res.status(201).json(league);
});

router.put("/:id", requireClerkAuth, async (req, res) => {
  const { id } = req.params;
  const { leagueName, size, full, drafted } = req.body || {};

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid league ID" });
  }

  const updateData = {};
  if (leagueName !== undefined) {
    if (typeof leagueName !== "string") {
      return res.status(400).json({ error: "leagueName must be a string" });
    }
    updateData.leagueName = leagueName;
  }
  if (size !== undefined) {
    if (typeof size !== "number" || !Number.isInteger(size) || size < 1) {
      return res.status(400).json({ error: "size must be an integer >= 1" });
    }
    updateData.size = size;
  }
  if (full !== undefined) {
    if (typeof full !== "boolean") {
      return res.status(400).json({ error: "full must be a boolean" });
    }
    updateData.full = full;
  }
  if (drafted !== undefined) {
    if (typeof drafted !== "boolean") {
      return res.status(400).json({ error: "drafted must be a boolean" });
    }
    updateData.drafted = drafted;
  }

  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({ error: "Body must include at least one field to update (leagueName, size, or full)" });
  }

  const league = await League.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  );

  if (!league) {
    return res.status(404).json({ error: "League not found" });
  }

  res.json(league);
});

router.delete("/:id", requireClerkAuth, async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid league ID" });
  }

  const league = await League.findByIdAndDelete(id);

  if (!league) {
    return res.status(404).json({ error: "League not found" });
  }

  res.json({ message: "League deleted successfully" });
});

export default router;

