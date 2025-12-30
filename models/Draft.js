import mongoose from "mongoose";

// Schema for individual draft results
const draftResultSchema = new mongoose.Schema(
  {
    pickingTeam: { type: String, required: true },
    pickNumber: { type: Number, required: true },
    playerId: { type: Number, required: true },
    playerName: { type: String, required: true },
    position: { type: String, required: true },
    teamId: { type: Number, required: true },
    teamName: { type: String, required: true },
  },
  { _id: false }
);

// Main Draft schema
const draftSchema = new mongoose.Schema(
  {
    leagueId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "League", index: true },
    completed: { type: Boolean, default: false },
    rounds: { type: Number, default: 14 },
    currentRound: { type: Number, default: 1 },
    size: { type: Number, required: true },
    currentPickInRound: { type: Number, default: 1 },
    order: [{ type: mongoose.Schema.Types.ObjectId }],
    results: [draftResultSchema],
  },
  { timestamps: true }
);

const Draft = mongoose.model("Draft", draftSchema);

export default Draft;

