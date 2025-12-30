import express from "express";
import mongoose from "mongoose";
import { getRequireClerkAuth } from "../middleware/auth.js";
import Todo from "../models/Todo.js";

const router = express.Router();
const requireClerkAuth = getRequireClerkAuth();

router.get("/", requireClerkAuth, async (req, res) => {
  const todos = await Todo.find({ userId: req.auth.userId })
    .sort({ createdAt: -1 })
    .lean();
  res.json(todos);
});

router.post("/", requireClerkAuth, async (req, res) => {
  const { text } = req.body || {};
  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "Body must include { text: string }" });
  }

  const todo = await Todo.create({ userId: req.auth.userId, text, done: false });
  res.status(201).json(todo);
});

router.put("/:id", requireClerkAuth, async (req, res) => {
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

router.delete("/:id", requireClerkAuth, async (req, res) => {
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

export default router;

