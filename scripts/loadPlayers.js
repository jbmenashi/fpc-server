import mongoose from "mongoose";
import dotenv from "dotenv";
import Player from "../models/Player.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const RAPID_API_KEY = process.env.RAPID_API_KEY;

const API_URL = "https://tank01-nfl-live-in-game-real-time-statistics-nfl.p.rapidapi.com/getNFLPlayerList";

const ALLOWED_POSITIONS = ["QB", "RB", "WR", "TE", "PK"];
const ALLOWED_TEAMS = ["DEN", "NE", "LAC", "BUF", "PIT", "BAL", "HOU", "JAX", "SF", "LAR", "SEA", "TB", "CAR", "GB", "CHI", "PHI"];

async function loadPlayers() {
  try {
    // Validate environment variables
    if (!MONGODB_URI) {
      console.error("Missing MONGODB_URI in .env");
      process.exit(1);
    }

    if (!RAPID_API_KEY) {
      console.error("Missing RAPID_API_KEY in .env");
      process.exit(1);
    }

    // Connect to MongoDB
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✓ Connected to MongoDB");

    // Fetch players from API
    console.log("Fetching players from API...");
    const headers = {
      "x-rapidapi-key": RAPID_API_KEY,
      "x-rapidapi-host": "tank01-nfl-live-in-game-real-time-statistics-nfl.p.rapidapi.com",
    };

    const response = await fetch(API_URL, { headers });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`✓ Received data from API`);

    // Parse and filter players
    console.log("Parsing and filtering players...");
    const players = [];

    // The API response structure may vary, so we'll handle different possible structures
    let playerList = [];
    if (Array.isArray(data)) {
      playerList = data;
    } else if (data.body && Array.isArray(data.body)) {
      playerList = data.body;
    } else if (data.players && Array.isArray(data.players)) {
      playerList = data.players;
    } else if (typeof data === "object") {
      // If it's an object, try to find an array property
      const arrayKeys = Object.keys(data).filter((key) => Array.isArray(data[key]));
      if (arrayKeys.length > 0) {
        playerList = data[arrayKeys[0]];
      } else {
        // If no array found, log the structure for debugging
        console.log("API response structure:", JSON.stringify(data, null, 2).substring(0, 500));
        throw new Error("Could not find player array in API response");
      }
    } else {
      throw new Error("Unexpected API response format");
    }

    console.log(`  Found ${playerList.length} total players in API response`);

    // Filter and map players
    for (const player of playerList) {
      const pos = player.pos || player.position || player.POS || player.Position;
      
      // Only include players with allowed positions
      if (pos && ALLOWED_POSITIONS.includes(pos.toUpperCase())) {
        // Check if player is a free agent (exclude if string "True")
        const isFreeAgent = player.isFreeAgent || player.isFreeagent || player.IsFreeAgent || player.is_free_agent || "";
        if (String(isFreeAgent).toLowerCase() === "true") {
          // Silently skip free agents
          continue;
        }

        const playerId = player.playerID || player.playerId || player.PlayerID;
        const playerName = player.longName || player.longname || player.name || player.Name || player.playerName;
        const teamId = player.teamID || player.teamId || player.TeamID;
        const teamName = player.team || player.Team || player.teamName || player.teamName;
        // Convert PK to K for MongoDB
        let position = pos.toUpperCase();
        if (position === "PK") {
          position = "K";
        }

        // Validate required fields
        if (playerId && playerName && teamId !== undefined && teamName && position) {
          // Check if team is in allowed teams list (case-insensitive)
          const teamNameUpper = String(teamName).toUpperCase();
          if (ALLOWED_TEAMS.includes(teamNameUpper)) {
            players.push({
              playerId: Number(playerId),
              playerName: String(playerName),
              position: position,
              teamId: Number(teamId),
              teamName: teamNameUpper, // Store as uppercase to match triCode format
            });
          }
          // Silently skip players from non-allowed teams
        } else {
          console.warn(`Skipping player with missing fields:`, {
            playerID: playerId,
            longName: playerName,
            teamID: teamId,
            team: teamName,
            pos: pos,
          });
        }
      }
    }

    console.log(`✓ Filtered to ${players.length} players with positions: ${ALLOWED_POSITIONS.join(", ")} and teams: ${ALLOWED_TEAMS.join(", ")}`);

    if (players.length === 0) {
      console.warn("No players found matching the criteria. Check API response structure.");
      console.log("Sample API response:", JSON.stringify(playerList[0] || data, null, 2).substring(0, 500));
      await mongoose.disconnect();
      process.exit(0);
    }

    // Insert players into MongoDB
    console.log("Inserting players into MongoDB...");
    
    // Use insertMany with ordered: false to continue on duplicates
    // and updateOnDuplicate to update existing players
    let insertedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;

    for (const player of players) {
      try {
        const result = await Player.findOneAndUpdate(
          { playerId: player.playerId },
          player,
          { upsert: true, new: true }
        );
        if (result.isNew) {
          insertedCount++;
        } else {
          updatedCount++;
        }
      } catch (error) {
        errorCount++;
        console.error(`Error inserting player ${player.playerId} (${player.playerName}):`, error.message);
      }
    }

    console.log(`✓ Players loaded successfully:`);
    console.log(`  - New players inserted: ${insertedCount}`);
    console.log(`  - Existing players updated: ${updatedCount}`);
    console.log(`  - Errors: ${errorCount}`);
    console.log(`  - Total processed: ${players.length}`);

    // Create teamName to teamId mapping from loaded players
    console.log("Creating team mapping for DST players...");
    const teamMapping = {};
    for (const player of players) {
      if (!teamMapping[player.teamName]) {
        teamMapping[player.teamName] = player.teamId;
      }
    }

    // Create DST players for each allowed team
    console.log("Creating DST players for each team...");
    const dstPlayers = [];
    let dstInsertedCount = 0;
    let dstUpdatedCount = 0;
    let dstErrorCount = 0;

    for (const team of ALLOWED_TEAMS) {
      const teamId = teamMapping[team] || ALLOWED_TEAMS.indexOf(team) + 1; // Fallback to index if not found
      const dstPlayer = {
        playerId: 1000 + teamId,
        playerName: `${team} DST`,
        teamId: teamId,
        teamName: team,
        position: "DST",
      };
      dstPlayers.push(dstPlayer);

      try {
        const result = await Player.findOneAndUpdate(
          { playerId: dstPlayer.playerId },
          dstPlayer,
          { upsert: true, new: true }
        );
        if (result.isNew) {
          dstInsertedCount++;
        } else {
          dstUpdatedCount++;
        }
      } catch (error) {
        dstErrorCount++;
        console.error(`Error inserting DST player ${dstPlayer.playerId} (${dstPlayer.playerName}):`, error.message);
      }
    }

    console.log(`✓ DST players loaded successfully:`);
    console.log(`  - New DST players inserted: ${dstInsertedCount}`);
    console.log(`  - Existing DST players updated: ${dstUpdatedCount}`);
    console.log(`  - Errors: ${dstErrorCount}`);
    console.log(`  - Total DST players processed: ${dstPlayers.length}`);

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log("✓ Disconnected from MongoDB");
    process.exit(0);
  } catch (error) {
    console.error("Error loading players:", error.message);
    console.error("Error stack:", error.stack);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
}

loadPlayers();

