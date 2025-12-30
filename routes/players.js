import express from "express";
import { getRequireClerkAuth } from "../middleware/auth.js";

const router = express.Router();
const requireClerkAuth = getRequireClerkAuth();

// Seed data - 10 random players
const seedPlayers = [
  {
    playerId: 1,
    playerName: "Patrick Mahomes",
    position: "QB",
    teamId: 1,
    teamName: "Kansas City Chiefs",
  },
  {
    playerId: 2,
    playerName: "Josh Allen",
    position: "QB",
    teamId: 2,
    teamName: "Buffalo Bills",
  },
  {
    playerId: 3,
    playerName: "Christian McCaffrey",
    position: "RB",
    teamId: 3,
    teamName: "San Francisco 49ers",
  },
  {
    playerId: 4,
    playerName: "Derrick Henry",
    position: "RB",
    teamId: 4,
    teamName: "Tennessee Titans",
  },
  {
    playerId: 5,
    playerName: "Tyreek Hill",
    position: "WR",
    teamId: 5,
    teamName: "Miami Dolphins",
  },
  {
    playerId: 6,
    playerName: "Davante Adams",
    position: "WR",
    teamId: 6,
    teamName: "Las Vegas Raiders",
  },
  {
    playerId: 7,
    playerName: "Travis Kelce",
    position: "TE",
    teamId: 1,
    teamName: "Kansas City Chiefs",
  },
  {
    playerId: 8,
    playerName: "Mark Andrews",
    position: "TE",
    teamId: 7,
    teamName: "Baltimore Ravens",
  },
  {
    playerId: 9,
    playerName: "Justin Tucker",
    position: "K",
    teamId: 7,
    teamName: "Baltimore Ravens",
  },
  {
    playerId: 10,
    playerName: "Dallas Cowboys",
    position: "DST",
    teamId: 8,
    teamName: "Dallas Cowboys",
  },
];

router.get("/", requireClerkAuth, async (req, res) => {
  try {
    console.log("GET /players - Returning seeded players");
    console.log(`Returning ${seedPlayers.length} players`);
    
    res.json(seedPlayers);
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

