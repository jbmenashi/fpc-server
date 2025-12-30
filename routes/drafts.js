import express from "express";
import mongoose from "mongoose";
import { getRequireClerkAuth } from "../middleware/auth.js";
import Draft from "../models/Draft.js";

const router = express.Router();
const requireClerkAuth = getRequireClerkAuth();

router.get("/", requireClerkAuth, async (req, res) => {
  try {
    const { leagueId } = req.query;
    console.log("GET /drafts - Requested leagueId:", leagueId);

    if (!leagueId) {
      return res.status(400).json({ error: "leagueId query parameter is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(leagueId)) {
      console.error("VALIDATION FAILED: Invalid leagueId");
      return res.status(400).json({ error: "Invalid leagueId" });
    }

    const draft = await Draft.findOne({ leagueId: new mongoose.Types.ObjectId(leagueId) }).lean();

    if (!draft) {
      console.error("Draft not found for leagueId:", leagueId);
      return res.status(404).json({ error: "Draft not found for this league" });
    }

    console.log("✓ Draft found:", draft._id);
    res.json(draft);
  } catch (error) {
    console.error("GET /drafts - Error:", error.message);
    console.error("Error stack:", error.stack);
    return res.status(500).json({
      error: "Failed to get draft",
      message: error.message,
    });
  }
});

router.get("/:id", requireClerkAuth, async (req, res) => {
  try {
    const { id } = req.params;
    console.log("GET /drafts/:id - Requested ID:", id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.error("VALIDATION FAILED: Invalid draft ID");
      return res.status(400).json({ error: "Invalid draft ID" });
    }

    const draft = await Draft.findById(id).lean();

    if (!draft) {
      console.error("Draft not found with ID:", id);
      return res.status(404).json({ error: "Draft not found" });
    }

    console.log("✓ Draft found:", draft._id);
    res.json(draft);
  } catch (error) {
    console.error("GET /drafts/:id - Error:", error.message);
    console.error("Error stack:", error.stack);
    return res.status(500).json({
      error: "Failed to get draft",
      message: error.message,
    });
  }
});

// Helper function to validate draft result object
function validateDraftResult(result, index) {
  if (!result || typeof result !== "object") {
    return { valid: false, error: `results[${index}] must be an object` };
  }

  if (!result.pickingTeam || typeof result.pickingTeam !== "string") {
    return { valid: false, error: `results[${index}].pickingTeam must be a string` };
  }

  if (result.pickNumber === undefined || typeof result.pickNumber !== "number" || !Number.isInteger(result.pickNumber)) {
    return { valid: false, error: `results[${index}].pickNumber must be an integer` };
  }

  if (result.playerId === undefined || typeof result.playerId !== "number" || !Number.isInteger(result.playerId)) {
    return { valid: false, error: `results[${index}].playerId must be an integer` };
  }

  if (!result.playerName || typeof result.playerName !== "string") {
    return { valid: false, error: `results[${index}].playerName must be a string` };
  }

  if (!result.position || typeof result.position !== "string") {
    return { valid: false, error: `results[${index}].position must be a string` };
  }

  if (result.teamId === undefined || typeof result.teamId !== "number" || !Number.isInteger(result.teamId)) {
    return { valid: false, error: `results[${index}].teamId must be an integer` };
  }

  if (!result.teamName || typeof result.teamName !== "string") {
    return { valid: false, error: `results[${index}].teamName must be a string` };
  }

  return { valid: true };
}

router.post("/", requireClerkAuth, async (req, res) => {
  try {
    console.log("=== POST /drafts - START ===");
    console.log("Request body (raw):", req.body);
    console.log("Request body (stringified):", JSON.stringify(req.body, null, 2));

    const { leagueId, completed, rounds, currentRound, size, currentPickInRound, overallPick, direction, order, results } = req.body || {};

    console.log("Extracted values:");
    console.log("  leagueId:", leagueId, "type:", typeof leagueId);
    console.log("  completed:", completed, "type:", typeof completed);
    console.log("  rounds:", rounds, "type:", typeof rounds);
    console.log("  currentRound:", currentRound, "type:", typeof currentRound);
    console.log("  size:", size, "type:", typeof size);
    console.log("  currentPickInRound:", currentPickInRound, "type:", typeof currentPickInRound);
    console.log("  overallPick:", overallPick, "type:", typeof overallPick);
    console.log("  direction:", direction, "type:", typeof direction);
    console.log("  order:", order, "type:", typeof order, "length:", Array.isArray(order) ? order.length : "N/A");
    console.log("  results:", results, "type:", typeof results, "length:", Array.isArray(results) ? results.length : "N/A");

    // Validate required fields
    console.log("Validating leagueId...");
    if (!leagueId || !mongoose.Types.ObjectId.isValid(leagueId)) {
      console.error("VALIDATION FAILED: leagueId is invalid");
      console.error("  leagueId value:", leagueId);
      console.error("  leagueId type:", typeof leagueId);
      const errorResponse = { error: "Body must include { leagueId: ObjectID }" };
      console.error("Sending 400 response:", errorResponse);
      return res.status(400).json(errorResponse);
    }
    console.log("✓ leagueId validation passed");

    // Validate rounds (optional, defaults to 14 in model)
    console.log("Validating rounds (optional)...");
    if (rounds !== undefined) {
      if (typeof rounds !== "number" || !Number.isInteger(rounds) || rounds < 1) {
        console.error("VALIDATION FAILED: rounds must be an integer >= 1 if provided");
        console.error("  rounds value:", rounds);
        console.error("  rounds type:", typeof rounds);
        const errorResponse = { error: "rounds must be an integer >= 1 if provided" };
        console.error("Sending 400 response:", errorResponse);
        return res.status(400).json(errorResponse);
      }
      console.log("✓ rounds validation passed (provided value)");
    } else {
      console.log("✓ rounds not provided, will use model default (14)");
    }

    console.log("Validating size...");
    if (size === undefined || typeof size !== "number" || !Number.isInteger(size) || size < 1) {
      console.error("VALIDATION FAILED: size is invalid");
      console.error("  size value:", size);
      console.error("  size type:", typeof size);
      const errorResponse = { error: "Body must include { size: integer } (must be >= 1)" };
      console.error("Sending 400 response:", errorResponse);
      return res.status(400).json(errorResponse);
    }
    console.log("✓ size validation passed");

    // Validate optional fields
    console.log("Validating optional fields...");
    if (completed !== undefined && typeof completed !== "boolean") {
      console.error("VALIDATION FAILED: completed must be a boolean");
      const errorResponse = { error: "completed must be a boolean" };
      console.error("Sending 400 response:", errorResponse);
      return res.status(400).json(errorResponse);
    }

    if (currentRound !== undefined) {
      if (typeof currentRound !== "number" || !Number.isInteger(currentRound) || currentRound < 1) {
        console.error("VALIDATION FAILED: currentRound must be an integer >= 1");
        const errorResponse = { error: "currentRound must be an integer >= 1" };
        console.error("Sending 400 response:", errorResponse);
        return res.status(400).json(errorResponse);
      }
    }

    if (currentPickInRound !== undefined) {
      if (typeof currentPickInRound !== "number" || !Number.isInteger(currentPickInRound) || currentPickInRound < 1) {
        console.error("VALIDATION FAILED: currentPickInRound must be an integer >= 1");
        const errorResponse = { error: "currentPickInRound must be an integer >= 1" };
        console.error("Sending 400 response:", errorResponse);
        return res.status(400).json(errorResponse);
      }
    }

    if (overallPick !== undefined) {
      if (typeof overallPick !== "number" || !Number.isInteger(overallPick) || overallPick < 1) {
        console.error("VALIDATION FAILED: overallPick must be an integer >= 1");
        const errorResponse = { error: "overallPick must be an integer >= 1" };
        console.error("Sending 400 response:", errorResponse);
        return res.status(400).json(errorResponse);
      }
    }

    if (direction !== undefined) {
      if (typeof direction !== "string") {
        console.error("VALIDATION FAILED: direction must be a string");
        const errorResponse = { error: "direction must be a string" };
        console.error("Sending 400 response:", errorResponse);
        return res.status(400).json(errorResponse);
      }
    }
    console.log("✓ Optional fields validation passed");

    // Validate order array
    console.log("Validating order array...");
    if (order !== undefined) {
      if (!Array.isArray(order)) {
        console.error("VALIDATION FAILED: order must be an array");
        const errorResponse = { error: "order must be an array" };
        console.error("Sending 400 response:", errorResponse);
        return res.status(400).json(errorResponse);
      }
      for (let i = 0; i < order.length; i++) {
        if (!mongoose.Types.ObjectId.isValid(order[i])) {
          console.error(`VALIDATION FAILED: order[${i}] must be a valid ObjectID`);
          const errorResponse = { error: `order[${i}] must be a valid ObjectID` };
          console.error("Sending 400 response:", errorResponse);
          return res.status(400).json(errorResponse);
        }
      }
      console.log(`✓ Order array validation passed (${order.length} items)`);
    } else {
      console.log("No order array provided, using default empty array");
    }

    // Validate results array
    console.log("Validating results array...");
    if (results !== undefined) {
      if (!Array.isArray(results)) {
        console.error("VALIDATION FAILED: results must be an array");
        const errorResponse = { error: "results must be an array" };
        console.error("Sending 400 response:", errorResponse);
        return res.status(400).json(errorResponse);
      }
      for (let i = 0; i < results.length; i++) {
        const resultValidation = validateDraftResult(results[i], i);
        if (!resultValidation.valid) {
          console.error(`VALIDATION FAILED: ${resultValidation.error}`);
          const errorResponse = { error: resultValidation.error };
          console.error("Sending 400 response:", errorResponse);
          return res.status(400).json(errorResponse);
        }
      }
      console.log(`✓ Results array validation passed (${results.length} items)`);
    } else {
      console.log("No results array provided, using default empty array");
    }

    const draftData = {
      leagueId: new mongoose.Types.ObjectId(leagueId),
      completed: completed ?? false,
      rounds: rounds ?? 14, // Use model default if not provided
      currentRound: currentRound ?? 1,
      size,
      currentPickInRound: currentPickInRound ?? 1,
      overallPick: overallPick ?? 1, // Use model default if not provided
      direction: direction ?? "forward", // Use model default if not provided
      order: order ?? [],
      results: results ?? [],
    };

    console.log("Draft data to create:", JSON.stringify(draftData, null, 2));
    console.log("Attempting to create draft in database...");

    const draft = await Draft.create(draftData);

    console.log("✓ Draft created successfully");
    console.log("  Draft ID:", draft._id);
    console.log("=== POST /drafts - SUCCESS ===");
    res.status(201).json(draft);
  } catch (error) {
    console.error("=== POST /drafts - ERROR ===");
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
      error: "Failed to create draft",
      message: error.message,
    };
    console.error("Sending 500 error response:", errorResponse);
    return res.status(500).json(errorResponse);
  }
});

router.put("/:id", requireClerkAuth, async (req, res) => {
  try {
    const { id } = req.params;
    console.log("=== PUT /drafts/:id - START ===");
    console.log("Draft ID:", id);
    console.log("Request body (raw):", req.body);
    console.log("Request body (stringified):", JSON.stringify(req.body, null, 2));

    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.error("VALIDATION FAILED: Invalid draft ID");
      return res.status(400).json({ error: "Invalid draft ID" });
    }

    const { leagueId, completed, rounds, currentRound, size, currentPickInRound, overallPick, direction, order, results } = req.body || {};

    console.log("Extracted values:");
    console.log("  leagueId:", leagueId, "type:", typeof leagueId);
    console.log("  completed:", completed, "type:", typeof completed);
    console.log("  rounds:", rounds, "type:", typeof rounds);
    console.log("  currentRound:", currentRound, "type:", typeof currentRound);
    console.log("  size:", size, "type:", typeof size);
    console.log("  currentPickInRound:", currentPickInRound, "type:", typeof currentPickInRound);
    console.log("  overallPick:", overallPick, "type:", typeof overallPick);
    console.log("  direction:", direction, "type:", typeof direction);
    console.log("  order:", order, "type:", typeof order, "length:", Array.isArray(order) ? order.length : "N/A");
    console.log("  results:", results, "type:", typeof results, "length:", Array.isArray(results) ? results.length : "N/A");

    const updateData = {};

    if (leagueId !== undefined) {
      if (!mongoose.Types.ObjectId.isValid(leagueId)) {
        return res.status(400).json({ error: "leagueId must be a valid ObjectID" });
      }
      updateData.leagueId = new mongoose.Types.ObjectId(leagueId);
    }

    if (completed !== undefined) {
      if (typeof completed !== "boolean") {
        return res.status(400).json({ error: "completed must be a boolean" });
      }
      updateData.completed = completed;
    }

    if (rounds !== undefined) {
      if (typeof rounds !== "number" || !Number.isInteger(rounds) || rounds < 1) {
        return res.status(400).json({ error: "rounds must be an integer >= 1" });
      }
      updateData.rounds = rounds;
    }

    if (currentRound !== undefined) {
      if (typeof currentRound !== "number" || !Number.isInteger(currentRound) || currentRound < 1) {
        return res.status(400).json({ error: "currentRound must be an integer >= 1" });
      }
      updateData.currentRound = currentRound;
    }

    if (size !== undefined) {
      if (typeof size !== "number" || !Number.isInteger(size) || size < 1) {
        return res.status(400).json({ error: "size must be an integer >= 1" });
      }
      updateData.size = size;
    }

    if (currentPickInRound !== undefined) {
      if (typeof currentPickInRound !== "number" || !Number.isInteger(currentPickInRound) || currentPickInRound < 1) {
        return res.status(400).json({ error: "currentPickInRound must be an integer >= 1" });
      }
      updateData.currentPickInRound = currentPickInRound;
    }

    if (overallPick !== undefined) {
      if (typeof overallPick !== "number" || !Number.isInteger(overallPick) || overallPick < 1) {
        return res.status(400).json({ error: "overallPick must be an integer >= 1" });
      }
      updateData.overallPick = overallPick;
    }

    if (direction !== undefined) {
      if (typeof direction !== "string") {
        return res.status(400).json({ error: "direction must be a string" });
      }
      updateData.direction = direction;
    }

    if (order !== undefined) {
      if (!Array.isArray(order)) {
        return res.status(400).json({ error: "order must be an array" });
      }
      for (let i = 0; i < order.length; i++) {
        if (!mongoose.Types.ObjectId.isValid(order[i])) {
          return res.status(400).json({ error: `order[${i}] must be a valid ObjectID` });
        }
      }
      updateData.order = order.map((id) => new mongoose.Types.ObjectId(id));
    }

    if (results !== undefined) {
      if (!Array.isArray(results)) {
        return res.status(400).json({ error: "results must be an array" });
      }
      for (let i = 0; i < results.length; i++) {
        const resultValidation = validateDraftResult(results[i], i);
        if (!resultValidation.valid) {
          return res.status(400).json({ error: resultValidation.error });
        }
      }
      updateData.results = results;
    }

    if (Object.keys(updateData).length === 0) {
      console.error("VALIDATION FAILED: No fields to update");
      const errorResponse = {
        error: "Body must include at least one field to update (leagueId, completed, rounds, currentRound, size, currentPickInRound, overallPick, direction, order, or results)",
      };
      console.error("Sending 400 response:", errorResponse);
      return res.status(400).json(errorResponse);
    }

    console.log("Update data:", JSON.stringify(updateData, null, 2));
    console.log("Attempting to update draft in database...");

    const draft = await Draft.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!draft) {
      console.error("Draft not found with ID:", id);
      return res.status(404).json({ error: "Draft not found" });
    }

    console.log("✓ Draft updated successfully");
    console.log("  Draft ID:", draft._id);
    console.log("=== PUT /drafts/:id - SUCCESS ===");
    res.json(draft);
  } catch (error) {
    console.error("=== PUT /drafts/:id - ERROR ===");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    if (error.errors) {
      console.error("Validation errors:", JSON.stringify(error.errors, null, 2));
    }
    if (error.code) {
      console.error("Error code:", error.code);
    }

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
      error: "Failed to update draft",
      message: error.message,
    };
    console.error("Sending 500 error response:", errorResponse);
    return res.status(500).json(errorResponse);
  }
});

router.delete("/:id", requireClerkAuth, async (req, res) => {
  try {
    const { id } = req.params;
    console.log("DELETE /drafts/:id - Requested ID:", id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.error("VALIDATION FAILED: Invalid draft ID");
      return res.status(400).json({ error: "Invalid draft ID" });
    }

    console.log("Attempting to delete draft from database...");
    const draft = await Draft.findByIdAndDelete(id);

    if (!draft) {
      console.error("Draft not found with ID:", id);
      return res.status(404).json({ error: "Draft not found" });
    }

    console.log("✓ Draft deleted successfully");
    console.log("  Deleted Draft ID:", draft._id);
    res.json({ message: "Draft deleted successfully" });
  } catch (error) {
    console.error("DELETE /drafts/:id - Error:", error.message);
    console.error("Error stack:", error.stack);
    return res.status(500).json({
      error: "Failed to delete draft",
      message: error.message,
    });
  }
});

export default router;

