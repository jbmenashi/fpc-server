import express from "express";
import { getRequireClerkAuth } from "../middleware/auth.js";

const router = express.Router();
const requireClerkAuth = getRequireClerkAuth();

// Seed data - 20 random players
const seedPlayers = [
  {
    playerId: 1,
    playerName: "Patrick Mahomes",
    position: "QB",
    teamId: 1,
    teamName: "KC",
  },
  {
    playerId: 2,
    playerName: "Josh Allen",
    position: "QB",
    teamId: 2,
    teamName: "BUF",
  },
  {
    playerId: 3,
    playerName: "Christian McCaffrey",
    position: "RB",
    teamId: 3,
    teamName: "SF",
  },
  {
    playerId: 4,
    playerName: "Derrick Henry",
    position: "RB",
    teamId: 4,
    teamName: "TEN",
  },
  {
    playerId: 5,
    playerName: "Tyreek Hill",
    position: "WR",
    teamId: 5,
    teamName: "MIA",
  },
  {
    playerId: 6,
    playerName: "Davante Adams",
    position: "WR",
    teamId: 6,
    teamName: "LV",
  },
  {
    playerId: 7,
    playerName: "Travis Kelce",
    position: "TE",
    teamId: 1,
    teamName: "KC",
  },
  {
    playerId: 8,
    playerName: "Mark Andrews",
    position: "TE",
    teamId: 7,
    teamName: "BAL",
  },
  {
    playerId: 9,
    playerName: "Justin Tucker",
    position: "K",
    teamId: 7,
    teamName: "BAL",
  },
  {
    playerId: 10,
    playerName: "Dallas Cowboys",
    position: "DST",
    teamId: 8,
    teamName: "DAL",
  },
  {
    playerId: 11,
    playerName: "Lamar Jackson",
    position: "QB",
    teamId: 7,
    teamName: "BAL",
  },
  {
    playerId: 12,
    playerName: "Austin Ekeler",
    position: "RB",
    teamId: 9,
    teamName: "LAC",
  },
  {
    playerId: 13,
    playerName: "CeeDee Lamb",
    position: "WR",
    teamId: 8,
    teamName: "DAL",
  },
  {
    playerId: 14,
    playerName: "T.J. Hockenson",
    position: "TE",
    teamId: 10,
    teamName: "MIN",
  },
  {
    playerId: 15,
    playerName: "Daniel Carlson",
    position: "K",
    teamId: 6,
    teamName: "LV",
  },
  {
    playerId: 16,
    playerName: "San Francisco 49ers",
    position: "DST",
    teamId: 3,
    teamName: "SF",
  },
  {
    playerId: 17,
    playerName: "Jalen Hurts",
    position: "QB",
    teamId: 11,
    teamName: "PHI",
  },
  {
    playerId: 18,
    playerName: "Saquon Barkley",
    position: "RB",
    teamId: 12,
    teamName: "NYG",
  },
  {
    playerId: 19,
    playerName: "Cooper Kupp",
    position: "WR",
    teamId: 13,
    teamName: "LAR",
  },
  {
    playerId: 20,
    playerName: "George Kittle",
    position: "TE",
    teamId: 3,
    teamName: "SF",
  },
];

router.get("/", requireClerkAuth, async (req, res) => {
  try {
    const { playerName, position, teamName } = req.query;
    
    console.log("GET /players - Request received");
    console.log("Query parameters:", { playerName, position, teamName });
    
    let filteredPlayers = [...seedPlayers];
    
    // Filter by playerName (case-insensitive partial match)
    if (playerName) {
      console.log(`Filtering by playerName: "${playerName}"`);
      const playerNameLower = playerName.toLowerCase();
      filteredPlayers = filteredPlayers.filter((player) =>
        player.playerName.toLowerCase().includes(playerNameLower)
      );
      console.log(`  ${filteredPlayers.length} players match playerName filter`);
    }
    
    // Filter by position (case-insensitive exact match)
    if (position) {
      console.log(`Filtering by position: "${position}"`);
      const positionUpper = position.toUpperCase();
      filteredPlayers = filteredPlayers.filter(
        (player) => player.position.toUpperCase() === positionUpper
      );
      console.log(`  ${filteredPlayers.length} players match position filter`);
    }
    
    // Filter by teamName (case-insensitive exact match)
    if (teamName) {
      console.log(`Filtering by teamName: "${teamName}"`);
      const teamNameUpper = teamName.toUpperCase();
      filteredPlayers = filteredPlayers.filter(
        (player) => player.teamName.toUpperCase() === teamNameUpper
      );
      console.log(`  ${filteredPlayers.length} players match teamName filter`);
    }
    
    console.log(`Returning ${filteredPlayers.length} players (out of ${seedPlayers.length} total)`);
    
    res.json(filteredPlayers);
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

