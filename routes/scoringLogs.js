import express from "express";
import mongoose from "mongoose";
import { getRequireClerkAuth } from "../middleware/auth.js";
import ScoringLog from "../models/ScoringLog.js";

const router = express.Router();
const requireClerkAuth = getRequireClerkAuth();

router.get("/:leagueId", requireClerkAuth, async (req, res) => {
  try {
    const { leagueId } = req.params;

    // Validate leagueId
    if (!mongoose.Types.ObjectId.isValid(leagueId)) {
      return res.status(400).json({ error: "Invalid leagueId" });
    }

    // Fetch scoring logs for the specified league
    const scoringLogs = await ScoringLog.find({
      league_id: new mongoose.Types.ObjectId(leagueId)
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json(scoringLogs);
  } catch (error) {
    console.error("Error fetching scoring logs:", error.message);
    console.error("Error stack:", error.stack);
    return res.status(500).json({
      error: "Failed to fetch scoring logs",
      message: error.message,
    });
  }
});

export default router;

