import mongoose from "mongoose";

const scoringLogSchema = new mongoose.Schema(
  {
    contestant_id: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Contestant", index: true },
    league_id: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "League", index: true },
    timestamp: { type: String, required: true },
    playerId: { type: Number, required: true },
    playerName: { type: String, required: true },
    position: { type: String, required: true },
    playerPhoto: { type: String },
    teamName: { type: String, required: true },
    teamPhoto: { type: String },
    pointsChange: { type: Number, required: true },
  },
  { timestamps: true }
);

const ScoringLog = mongoose.model("ScoringLog", scoringLogSchema);

export default ScoringLog;

