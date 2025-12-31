import express from "express";
import { getRequireClerkAuth } from "../middleware/auth.js";
import Player from "../models/Player.js";

const router = express.Router();
const requireClerkAuth = getRequireClerkAuth();

router.get("/", requireClerkAuth, async (req, res) => {
  try {
    const { playerName, position, teamName } = req.query;
    
    console.log("GET /players - Request received");
    console.log("Query parameters:", { playerName, position, teamName });
    
    // Build MongoDB query
    const query = {};
    
    // Filter by playerName (case-insensitive partial match using regex)
    if (playerName) {
      console.log(`Filtering by playerName: "${playerName}"`);
      query.playerName = { $regex: playerName, $options: "i" };
    }
    
    // Filter by position (case-insensitive exact match)
    if (position) {
      console.log(`Filtering by position: "${position}"`);
      query.position = position.toUpperCase();
    }
    
    // Filter by teamName (case-insensitive exact match)
    if (teamName) {
      console.log(`Filtering by teamName: "${teamName}"`);
      query.teamName = teamName.toUpperCase();
    }
    
    console.log("MongoDB query:", JSON.stringify(query, null, 2));
    
    // Query MongoDB
    const players = await Player.find(query).lean().sort({ playerName: 1 });
    
    console.log(`Returning ${players.length} players from MongoDB`);
    
    res.json(players);
  } catch (error) {
    console.error("GET /players - Error:", error.message);
    console.error("Error stack:", error.stack);
    return res.status(500).json({
      error: "Failed to get players",
      message: error.message,
    });
  }
});

export default router;

