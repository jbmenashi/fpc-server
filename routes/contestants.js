import express from "express";
import mongoose from "mongoose";
import { getRequireClerkAuth } from "../middleware/auth.js";
import Contestant from "../models/Contestant.js";

const router = express.Router();
const requireClerkAuth = getRequireClerkAuth();

router.get("/", requireClerkAuth, async (req, res) => {
  const contestants = await Contestant.find()
    .sort({ createdAt: -1 })
    .lean();
  res.json(contestants);
});

router.get("/:id", requireClerkAuth, async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid contestant ID" });
  }

  const contestant = await Contestant.findById(id).lean();

  if (!contestant) {
    return res.status(404).json({ error: "Contestant not found" });
  }

  res.json(contestant);
});

// Helper function to validate player object
function validatePlayer(player, fieldName) {
  if (!player || typeof player !== "object") {
    return { valid: false, error: `${fieldName} must be an object` };
  }

  if (player.playerId === undefined || typeof player.playerId !== "number" || !Number.isInteger(player.playerId)) {
    return { valid: false, error: `${fieldName}.playerId must be an integer` };
  }

  if (!player.playerName || typeof player.playerName !== "string") {
    return { valid: false, error: `${fieldName}.playerName must be a string` };
  }

  if (player.teamId === undefined || typeof player.teamId !== "number" || !Number.isInteger(player.teamId)) {
    return { valid: false, error: `${fieldName}.teamId must be an integer` };
  }

  if (!player.teamName || typeof player.teamName !== "string") {
    return { valid: false, error: `${fieldName}.teamName must be a string` };
  }

  if (!player.position || typeof player.position !== "string") {
    return { valid: false, error: `${fieldName}.position must be a string` };
  }

  if (player.wcPts !== undefined && typeof player.wcPts !== "number") {
    return { valid: false, error: `${fieldName}.wcPts must be a number` };
  }

  if (player.dvPts !== undefined && typeof player.dvPts !== "number") {
    return { valid: false, error: `${fieldName}.dvPts must be a number` };
  }

  if (player.ccPts !== undefined && typeof player.ccPts !== "number") {
    return { valid: false, error: `${fieldName}.ccPts must be a number` };
  }

  if (player.sbPts !== undefined && typeof player.sbPts !== "number") {
    return { valid: false, error: `${fieldName}.sbPts must be a number` };
  }

  return { valid: true };
}

// Helper function to validate roster object
function validateRoster(roster) {
  if (!roster || typeof roster !== "object") {
    return { valid: false, error: "roster must be an object" };
  }

  if (roster.qb1 !== undefined) {
    const qb1Validation = validatePlayer(roster.qb1, "roster.qb1");
    if (!qb1Validation.valid) return qb1Validation;
  }

  if (roster.qb2 !== undefined) {
    const qb2Validation = validatePlayer(roster.qb2, "roster.qb2");
    if (!qb2Validation.valid) return qb2Validation;
  }

  if (roster.rb1 !== undefined) {
    const rb1Validation = validatePlayer(roster.rb1, "roster.rb1");
    if (!rb1Validation.valid) return rb1Validation;
  }

  if (roster.rb2 !== undefined) {
    const rb2Validation = validatePlayer(roster.rb2, "roster.rb2");
    if (!rb2Validation.valid) return rb2Validation;
  }

  if (roster.wr1 !== undefined) {
    const wr1Validation = validatePlayer(roster.wr1, "roster.wr1");
    if (!wr1Validation.valid) return wr1Validation;
  }

  if (roster.wr2 !== undefined) {
    const wr2Validation = validatePlayer(roster.wr2, "roster.wr2");
    if (!wr2Validation.valid) return wr2Validation;
  }

  if (roster.wr3 !== undefined) {
    const wr3Validation = validatePlayer(roster.wr3, "roster.wr3");
    if (!wr3Validation.valid) return wr3Validation;
  }

  if (roster.te1 !== undefined) {
    const te1Validation = validatePlayer(roster.te1, "roster.te1");
    if (!te1Validation.valid) return te1Validation;
  }

  if (roster.fl1 !== undefined) {
    const fl1Validation = validatePlayer(roster.fl1, "roster.fl1");
    if (!fl1Validation.valid) return fl1Validation;
  }

  if (roster.fl2 !== undefined) {
    const fl2Validation = validatePlayer(roster.fl2, "roster.fl2");
    if (!fl2Validation.valid) return fl2Validation;
  }

  if (roster.fl3 !== undefined) {
    const fl3Validation = validatePlayer(roster.fl3, "roster.fl3");
    if (!fl3Validation.valid) return fl3Validation;
  }

  if (roster.fl4 !== undefined) {
    const fl4Validation = validatePlayer(roster.fl4, "roster.fl4");
    if (!fl4Validation.valid) return fl4Validation;
  }

  if (roster.kicker !== undefined) {
    const kickerValidation = validatePlayer(roster.kicker, "roster.kicker");
    if (!kickerValidation.valid) return kickerValidation;
  }

  if (roster.dst !== undefined) {
    const dstValidation = validatePlayer(roster.dst, "roster.dst");
    if (!dstValidation.valid) return dstValidation;
  }

  return { valid: true };
}

router.post("/", requireClerkAuth, async (req, res) => {
  try {
    console.log("=== POST /contestants - START ===");
    console.log("Request headers:", JSON.stringify(req.headers, null, 2));
    console.log("Request body (raw):", req.body);
    console.log("Request body (stringified):", JSON.stringify(req.body, null, 2));

    const { userId, leagueId, teamName, wcPts, dvPts, ccPts, sbPts, roster } = req.body || {};

    console.log("Extracted values:");
    console.log("  userId:", userId, "type:", typeof userId);
    console.log("  leagueId:", leagueId, "type:", typeof leagueId);
    console.log("  teamName:", teamName, "type:", typeof teamName);
    console.log("  wcPts:", wcPts, "type:", typeof wcPts);
    console.log("  dvPts:", dvPts, "type:", typeof dvPts);
    console.log("  ccPts:", ccPts, "type:", typeof ccPts);
    console.log("  sbPts:", sbPts, "type:", typeof sbPts);
    console.log("  roster:", roster, "type:", typeof roster);

    // Validate required fields
    console.log("Validating userId...");
    if (!userId || typeof userId !== "string") {
      console.error("VALIDATION FAILED: userId is invalid");
      console.error("  userId value:", userId);
      console.error("  userId type:", typeof userId);
      const errorResponse = { error: "Body must include { userId: string }" };
      console.error("Sending 400 response:", errorResponse);
      return res.status(400).json(errorResponse);
    }
    console.log("✓ userId validation passed");

    console.log("Validating leagueId...");
    if (leagueId === undefined || (typeof leagueId !== "string" && typeof leagueId !== "number")) {
      console.error("VALIDATION FAILED: leagueId is invalid");
      console.error("  leagueId value:", leagueId);
      console.error("  leagueId type:", typeof leagueId);
      const errorResponse = { error: "Body must include { leagueId: string (ObjectID) }" };
      console.error("Sending 400 response:", errorResponse);
      return res.status(400).json(errorResponse);
    }

    // Convert string leagueId to ObjectId
    let leagueIdObjectId;
    if (typeof leagueId === "string") {
      if (!mongoose.Types.ObjectId.isValid(leagueId)) {
        console.error("VALIDATION FAILED: leagueId is not a valid ObjectID string");
        console.error("  leagueId value:", leagueId);
        const errorResponse = { error: "leagueId must be a valid ObjectID string" };
        console.error("Sending 400 response:", errorResponse);
        return res.status(400).json(errorResponse);
      }
      leagueIdObjectId = new mongoose.Types.ObjectId(leagueId);
      console.log("  Converted leagueId string to ObjectId:", leagueIdObjectId);
    } else {
      // If it's already a number or ObjectId, keep it as is (for backward compatibility)
      leagueIdObjectId = leagueId;
    }
    console.log("✓ leagueId validation passed");

    console.log("Validating teamName...");
    if (!teamName || typeof teamName !== "string") {
      console.error("VALIDATION FAILED: teamName is invalid");
      console.error("  teamName value:", teamName);
      console.error("  teamName type:", typeof teamName);
      const errorResponse = { error: "Body must include { teamName: string }" };
      console.error("Sending 400 response:", errorResponse);
      return res.status(400).json(errorResponse);
    }
    console.log("✓ teamName validation passed");

    // Validate optional numeric fields
    console.log("Validating optional numeric fields...");
    if (wcPts !== undefined && typeof wcPts !== "number") {
      console.error("VALIDATION FAILED: wcPts must be a number");
      const errorResponse = { error: "wcPts must be a number" };
      console.error("Sending 400 response:", errorResponse);
      return res.status(400).json(errorResponse);
    }

    if (dvPts !== undefined && typeof dvPts !== "number") {
      console.error("VALIDATION FAILED: dvPts must be a number");
      const errorResponse = { error: "dvPts must be a number" };
      console.error("Sending 400 response:", errorResponse);
      return res.status(400).json(errorResponse);
    }

    if (ccPts !== undefined && typeof ccPts !== "number") {
      console.error("VALIDATION FAILED: ccPts must be a number");
      const errorResponse = { error: "ccPts must be a number" };
      console.error("Sending 400 response:", errorResponse);
      return res.status(400).json(errorResponse);
    }

    if (sbPts !== undefined && typeof sbPts !== "number") {
      console.error("VALIDATION FAILED: sbPts must be a number");
      const errorResponse = { error: "sbPts must be a number" };
      console.error("Sending 400 response:", errorResponse);
      return res.status(400).json(errorResponse);
    }
    console.log("✓ Optional numeric fields validation passed");

    // Validate roster if provided
    console.log("Validating roster...");
    if (roster !== undefined) {
      console.log("Roster provided, validating structure...");
      const rosterValidation = validateRoster(roster);
      if (!rosterValidation.valid) {
        console.error("VALIDATION FAILED: roster validation failed");
        console.error("  Roster validation error:", rosterValidation.error);
        const errorResponse = { error: rosterValidation.error };
        console.error("Sending 400 response:", errorResponse);
        return res.status(400).json(errorResponse);
      }
      console.log("✓ Roster validation passed");
    } else {
      console.log("No roster provided, using default empty object");
    }

    const contestantData = {
      userId,
      leagueId: leagueIdObjectId,
      teamName,
      wcPts: wcPts ?? 0,
      dvPts: dvPts ?? 0,
      ccPts: ccPts ?? 0,
      sbPts: sbPts ?? 0,
      roster: roster ?? {},
    };

    console.log("Contestant data to create:", JSON.stringify(contestantData, null, 2));

    console.log("Attempting to create contestant in database...");
    const contestant = await Contestant.create(contestantData);

    console.log("✓ Contestant created successfully");
    console.log("  Contestant ID:", contestant._id);
    console.log("=== POST /contestants - SUCCESS ===");
    res.status(201).json(contestant);
  } catch (error) {
    console.error("=== POST /contestants - ERROR ===");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    if (error.errors) {
      console.error("Validation errors:", JSON.stringify(error.errors, null, 2));
    }
    if (error.code) {
      console.error("Error code:", error.code);
    }
    if (error.keyPattern) {
      console.error("Error keyPattern:", error.keyPattern);
    }
    if (error.keyValue) {
      console.error("Error keyValue:", error.keyValue);
    }

    // Return appropriate error response
    if (error.name === "ValidationError") {
      const errorResponse = {
        error: "Validation error",
        details: error.message,
        errors: error.errors,
      };
      console.error("Sending 400 ValidationError response:", errorResponse);
      return res.status(400).json(errorResponse);
    }

    const errorResponse = {
      error: "Failed to create contestant",
      message: error.message,
    };
    console.error("Sending 500 error response:", errorResponse);
    return res.status(500).json(errorResponse);
  }
});

router.put("/:id", requireClerkAuth, async (req, res) => {
  const { id } = req.params;
  const { userId, leagueId, managerName, teamName, wcPts, dvPts, ccPts, sbPts, roster } = req.body || {};

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid contestant ID" });
  }

  const updateData = {};

  if (userId !== undefined) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "userId must be a valid ObjectID" });
    }
    updateData.userId = new mongoose.Types.ObjectId(userId);
  }

  if (leagueId !== undefined) {
    if (!mongoose.Types.ObjectId.isValid(leagueId)) {
      return res.status(400).json({ error: "leagueId must be a valid ObjectID" });
    }
    updateData.leagueId = new mongoose.Types.ObjectId(leagueId);
  }

  if (managerName !== undefined) {
    if (typeof managerName !== "string") {
      return res.status(400).json({ error: "managerName must be a string" });
    }
    updateData.managerName = managerName;
  }

  if (teamName !== undefined) {
    if (typeof teamName !== "string") {
      return res.status(400).json({ error: "teamName must be a string" });
    }
    updateData.teamName = teamName;
  }

  if (wcPts !== undefined) {
    if (typeof wcPts !== "number") {
      return res.status(400).json({ error: "wcPts must be a number" });
    }
    updateData.wcPts = wcPts;
  }

  if (dvPts !== undefined) {
    if (typeof dvPts !== "number") {
      return res.status(400).json({ error: "dvPts must be a number" });
    }
    updateData.dvPts = dvPts;
  }

  if (ccPts !== undefined) {
    if (typeof ccPts !== "number") {
      return res.status(400).json({ error: "ccPts must be a number" });
    }
    updateData.ccPts = ccPts;
  }

  if (sbPts !== undefined) {
    if (typeof sbPts !== "number") {
      return res.status(400).json({ error: "sbPts must be a number" });
    }
    updateData.sbPts = sbPts;
  }

  if (roster !== undefined) {
    const rosterValidation = validateRoster(roster);
    if (!rosterValidation.valid) {
      return res.status(400).json({ error: rosterValidation.error });
    }
    updateData.roster = roster;
  }

  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({
      error: "Body must include at least one field to update (userId, leagueId, managerName, teamName, wcPts, dvPts, ccPts, sbPts, or roster)",
    });
  }

  const contestant = await Contestant.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!contestant) {
    return res.status(404).json({ error: "Contestant not found" });
  }

  res.json(contestant);
});

router.delete("/:id", requireClerkAuth, async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid contestant ID" });
  }

  const contestant = await Contestant.findByIdAndDelete(id);

  if (!contestant) {
    return res.status(404).json({ error: "Contestant not found" });
  }

  res.json({ message: "Contestant deleted successfully" });
});

export default router;

