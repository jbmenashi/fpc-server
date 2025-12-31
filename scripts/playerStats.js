import mongoose from "mongoose";
import dotenv from "dotenv";
import Contestant from "../models/Contestant.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const RAPID_API_KEY = process.env.RAPID_API_KEY;
const API_BASE_URL = "https://tank01-nfl-live-in-game-real-time-statistics-nfl.p.rapidapi.com/getNFLBoxScore";

// Helper function to calculate defense fantasy points based on points allowed
function getDefenseFantasyPoints(pointsAllowed) {
  if (pointsAllowed === 0) return 10;
  if (pointsAllowed <= 6) return 7;
  if (pointsAllowed <= 13) return 4;
  if (pointsAllowed <= 20) return 1;
  if (pointsAllowed <= 27) return 0;
  if (pointsAllowed <= 34) return -1;
  return -4; // 35+
}

async function playerStats(round, gameId) {
  try {
    // Validate environment variables
    if (!MONGODB_URI) {
      throw new Error("Missing MONGODB_URI in .env");
    }

    if (!RAPID_API_KEY) {
      throw new Error("Missing RAPID_API_KEY in .env");
    }

    // Validate parameters
    if (!round || typeof round !== "string") {
      throw new Error("round must be a non-empty string");
    }

    if (!gameId || typeof gameId !== "string") {
      throw new Error("gameId must be a non-empty string");
    }

    // Validate round parameter
    const validRounds = ["wc", "dv", "cc", "sb"];
    const roundLower = round.toLowerCase();
    if (!validRounds.includes(roundLower)) {
      throw new Error(`round must be one of: ${validRounds.join(", ")}`);
    }

    // Map round to field name
    const fieldMap = {
      wc: "wcPts",
      dv: "dvPts",
      cc: "ccPts",
      sb: "sbPts",
    };
    const pointsField = fieldMap[roundLower];

    // Connect to MongoDB
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✓ Connected to MongoDB");

    // Build URL with query parameters
    const params = new URLSearchParams({
      gameID: gameId,
      playByPlay: "false",
      fantasyPoints: "true",
      twoPointConversions: "2",
      passYards: ".04",
      passAttempts: "0",
      passTD: "4",
      passCompletions: "0",
      passInterceptions: "-1",
      pointsPerReception: ".5",
      carries: "0",
      rushYards: ".1",
      rushTD: "6",
      fumbles: "-2",
      receivingYards: ".1",
      receivingTD: "6",
      targets: "0",
      defTD: "6",
      fgMade: "3",
      fgMissed: "-3",
      xpMade: "1",
      xpMissed: "-1",
      idpTotalTackles: "0",
      idpSoloTackles: "0",
      idpTFL: "0",
      idpQbHits: "0",
      idpInt: "0",
      idpSacks: "0",
      idpPassDeflections: "0",
      idpFumblesRecovered: "0",
    });

    const url = `${API_BASE_URL}?${params.toString()}`;

    // Set up headers for RapidAPI
    const headers = {
      "x-rapidapi-key": RAPID_API_KEY,
      "x-rapidapi-host": "tank01-nfl-live-in-game-real-time-statistics-nfl.p.rapidapi.com",
    };

    // Make API request
    console.log(`Fetching player stats for gameId: ${gameId}...`);
    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("✓ Received data from API");

    // Check if body exists in the response
    if (!data.body || typeof data.body !== "object") {
      throw new Error("API response does not contain body object");
    }

    // Check if playerStats exists in the response
    if (!data.body.playerStats || typeof data.body.playerStats !== "object") {
      throw new Error("API response does not contain playerStats object");
    }

    // For Super Bowl (sb), check for winning teams and double points
    let winningTeams = [];
    if (roundLower === "sb") {
      const awayResult = data.body.awayResult;
      const homeResult = data.body.homeResult;
      
      // Get away and home team abbreviations from DST data
      let awayTeam = null;
      let homeTeam = null;
      
      if (data.body.DST && data.body.DST.away && data.body.DST.away.teamAbv) {
        awayTeam = data.body.DST.away.teamAbv.toUpperCase();
      }
      if (data.body.DST && data.body.DST.home && data.body.DST.home.teamAbv) {
        homeTeam = data.body.DST.home.teamAbv.toUpperCase();
      }
      
      if (awayResult === "W" && awayTeam) {
        winningTeams.push(awayTeam);
        console.log(`Super Bowl: Away team ${awayTeam} won - points will be doubled`);
      }
      if (homeResult === "W" && homeTeam) {
        winningTeams.push(homeTeam);
        console.log(`Super Bowl: Home team ${homeTeam} won - points will be doubled`);
      }
    }

    // Loop through playerStats and update contestants' rosters
    console.log(`Processing playerStats for round: ${roundLower}...`);
    let updatedCount = 0;
    let notFoundCount = 0;
    let errorCount = 0;

    // Get all roster field names
    const rosterFields = ["qb1", "qb2", "rb1", "rb2", "wr1", "wr2", "wr3", "te1", "fl1", "fl2", "fl3", "fl4", "kicker", "dst"];

    for (const [playerIdStr, playerStat] of Object.entries(data.body.playerStats)) {
      try {
        const playerId = parseInt(playerIdStr, 10);
        
        if (isNaN(playerId)) {
          console.warn(`Skipping invalid playerID: ${playerIdStr}`);
          continue;
        }

        // Get fantasyPoints from the playerStat object
        let baseFantasyPoints = playerStat.fantasyPoints;
        
        // Get player name from playerStat if available (for logging)
        const playerNameFromStat = playerStat.playerName || playerStat.name || `playerID ${playerId}`;
        
        if (baseFantasyPoints === undefined || baseFantasyPoints === null) {
          console.warn(`No fantasyPoints found for ${playerNameFromStat}`);
          continue;
        }

        // Find all contestants that have this playerId in their roster
        const contestants = await Contestant.find({
          $or: rosterFields.map(field => ({
            [`roster.${field}.playerId`]: playerId
          }))
        });

        if (contestants.length === 0) {
          notFoundCount++;
          continue;
        }

        // Update each contestant's roster
        for (const contestant of contestants) {
          let updated = false;
          let playerName = null;
          for (const field of rosterFields) {
            if (contestant.roster[field] && contestant.roster[field].playerId === playerId) {
              // Store player name for logging
              if (!playerName) {
                playerName = contestant.roster[field].playerName;
              }
              
              // Calculate fantasy points (may be doubled for Super Bowl)
              let fantasyPoints = baseFantasyPoints;
              
              // For Super Bowl, double points if player's team won
              if (roundLower === "sb" && winningTeams.length > 0) {
                const playerTeam = contestant.roster[field].teamName?.toUpperCase();
                if (playerTeam && winningTeams.includes(playerTeam)) {
                  fantasyPoints = fantasyPoints * 2;
                  console.log(`  Super Bowl: Doubling points for ${contestant.roster[field].playerName} (${playerTeam})`);
                }
              }
              
              contestant.roster[field][pointsField] = fantasyPoints;
              updated = true;
            }
          }
          
          if (updated) {
            await contestant.save();
            updatedCount++;
            console.log(`✓ Updated contestant ${contestant._id} - ${playerName || playerNameFromStat} with ${pointsField}`);
          }
        }
      } catch (error) {
        errorCount++;
        const errorPlayerName = playerStat?.playerName || playerStat?.name || `playerID ${playerIdStr}`;
        console.error(`Error processing ${errorPlayerName}:`, error.message);
      }
    }

    console.log(`✓ Player stats update completed:`);
    console.log(`  - Roster entries updated: ${updatedCount}`);
    console.log(`  - Players not found in rosters: ${notFoundCount}`);
    console.log(`  - Errors: ${errorCount}`);

    // Process DST stats
    console.log(`Processing DST stats for round: ${roundLower}...`);
    let dstUpdatedCount = 0;
    let dstNotFoundCount = 0;
    let dstErrorCount = 0;

    // Process DST.away and DST.home
    const dstTeams = [];
    if (data.body.DST && data.body.DST.away) {
      dstTeams.push({ dst: data.body.DST.away, type: "away" });
    }
    if (data.body.DST && data.body.DST.home) {
      dstTeams.push({ dst: data.body.DST.home, type: "home" });
    }

    for (const { dst, type } of dstTeams) {
      try {
        // Extract DST stats
        const defTD = Number(dst.defTD) || 0;
        const defensiveInterceptions = Number(dst.defensiveInterceptions) || 0;
        const sacks = Number(dst.sacks) || 0;
        const safeties = Number(dst.safeties) || 0;
        const fumblesRecovered = Number(dst.fumblesRecovered) || 0;
        const pointsAllowed = Number(dst.ptsAllowed) || 0;
        const teamAbv = dst.teamAbv;

        if (!teamAbv) {
          console.warn(`No teamAbv found for DST ${type}`);
          dstErrorCount++;
          continue;
        }

        // Calculate fantasy points
        const pointsFromStats = (defTD * 6) + (defensiveInterceptions * 2) + sacks + (safeties * 4) + (fumblesRecovered * 2);
        const pointsFromAllowed = getDefenseFantasyPoints(pointsAllowed);
        let fantasyPoints = pointsFromStats + pointsFromAllowed;

        // teamName is stored in uppercase, so we need to match case-insensitively or convert
        const teamAbvUpper = teamAbv.toUpperCase();
        
        // For Super Bowl, double points if DST team won
        if (roundLower === "sb" && winningTeams.length > 0) {
          if (winningTeams.includes(teamAbvUpper)) {
            fantasyPoints = fantasyPoints * 2;
            console.log(`  Super Bowl: Doubling points for DST ${teamAbvUpper}`);
          }
        }

        // Find all contestants that have this DST team in their roster
        const contestants = await Contestant.find({
          "roster.dst": { $ne: null },
          "roster.dst.teamName": teamAbvUpper
        });

        if (contestants.length === 0) {
          dstNotFoundCount++;
          continue;
        }

        // Update each contestant's DST roster entry
        for (const contestant of contestants) {
          if (contestant.roster.dst && contestant.roster.dst.teamName === teamAbvUpper) {
            const dstPlayerName = contestant.roster.dst.playerName || `${teamAbvUpper} DST`;
            contestant.roster.dst[pointsField] = fantasyPoints;
            await contestant.save();
            dstUpdatedCount++;
            console.log(`✓ Updated contestant ${contestant._id} - ${dstPlayerName} with ${pointsField}: ${fantasyPoints} (stats: ${pointsFromStats}, allowed: ${pointsFromAllowed})`);
          }
        }
      } catch (error) {
        dstErrorCount++;
        console.error(`Error processing DST ${type}:`, error.message);
      }
    }

    console.log(`✓ DST stats update completed:`);
    console.log(`  - DST roster entries updated: ${dstUpdatedCount}`);
    console.log(`  - DST teams not found in rosters: ${dstNotFoundCount}`);
    console.log(`  - DST errors: ${dstErrorCount}`);

    // Update each contestant's total points by summing roster players' points
    console.log(`Calculating and updating contestant total ${pointsField}...`);
    let contestantsUpdated = 0;
    let contestantsErrorCount = 0;

    try {
      const allContestants = await Contestant.find({});
      
      for (const contestant of allContestants) {
        try {
          let totalPoints = 0;
          
          // Sum up points from all roster players
          for (const field of rosterFields) {
            if (contestant.roster[field] && contestant.roster[field][pointsField] !== undefined && contestant.roster[field][pointsField] !== null) {
              totalPoints += contestant.roster[field][pointsField];
            }
          }
          
          // Update the contestant's top-level points field
          contestant[pointsField] = totalPoints;
          await contestant.save();
          contestantsUpdated++;
        } catch (error) {
          contestantsErrorCount++;
          console.error(`Error updating contestant ${contestant._id} total points:`, error.message);
        }
      }
      
      console.log(`✓ Contestant totals update completed:`);
      console.log(`  - Contestants updated: ${contestantsUpdated}`);
      console.log(`  - Errors: ${contestantsErrorCount}`);
    } catch (error) {
      console.error(`Error calculating contestant totals:`, error.message);
      contestantsErrorCount++;
    }

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log("✓ Disconnected from MongoDB");

    return {
      success: true,
      updated: updatedCount,
      notFound: notFoundCount,
      errors: errorCount,
      dstUpdated: dstUpdatedCount,
      dstNotFound: dstNotFoundCount,
      dstErrors: dstErrorCount,
      contestantsUpdated: contestantsUpdated,
      contestantsErrors: contestantsErrorCount,
    };
  } catch (error) {
    console.error("Error in playerStats:", error.message);
    console.error("Error stack:", error.stack);
    await mongoose.disconnect().catch(() => {});
    throw error;
  }
}

playerStats("wc", "20251228_CHI@SF");

