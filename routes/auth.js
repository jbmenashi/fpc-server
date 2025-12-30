import express from "express";
import { getRequireClerkAuth } from "../middleware/auth.js";

const router = express.Router();
const requireClerkAuth = getRequireClerkAuth();

router.get("/me", requireClerkAuth, (req, res) => {
  res.json({ userId: req.auth.userId });
});

export default router;

