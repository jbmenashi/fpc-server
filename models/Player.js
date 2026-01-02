import mongoose from "mongoose";

const playerSchema = new mongoose.Schema(
  {
    playerId: { type: Number, required: true, unique: true, index: true },
    playerName: { type: String, required: true },
    position: { type: String, required: true },
    teamId: { type: Number, required: true },
    teamName: { type: String, required: true },
    playerPhoto: { type: String },
    teamPhoto: { type: String },
  },
  { timestamps: true }
);

const Player = mongoose.model("Player", playerSchema);

export default Player;

