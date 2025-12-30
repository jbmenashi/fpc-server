import mongoose from "mongoose";

// Schema for individual players (qb1, qb2, rb1)
const playerSchema = new mongoose.Schema(
  {
    playerId: { type: Number, required: true },
    playerName: { type: String, required: true },
    teamId: { type: Number, required: true },
    teamName: { type: String, required: true },
    position: { type: String, required: true },
    wcPts: { type: Number, default: 0 },
    dvPts: { type: Number, default: 0 },
    ccPts: { type: Number, default: 0 },
    sbPts: { type: Number, default: 0 },
  },
  { _id: false }
);

// Schema for roster object
const rosterSchema = new mongoose.Schema(
  {
    qb1: { type: playerSchema, default: null },
    qb2: { type: playerSchema, default: null },
    rb1: { type: playerSchema, default: null },
    rb2: { type: playerSchema, default: null },
    wr1: { type: playerSchema, default: null },
    wr2: { type: playerSchema, default: null },
    wr3: { type: playerSchema, default: null },
    te1: { type: playerSchema, default: null },
    fl1: { type: playerSchema, default: null },
    fl2: { type: playerSchema, default: null },
    fl3: { type: playerSchema, default: null },
    fl4: { type: playerSchema, default: null },
    kicker: { type: playerSchema, default: null },
    dst: { type: playerSchema, default: null }
  },
  { _id: false }
);

// Main Contestant schema
const contestantSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    leagueId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "League" },
    teamName: { type: String, required: true },
    wcPts: { type: Number, default: 0 },
    dvPts: { type: Number, default: 0 },
    ccPts: { type: Number, default: 0 },
    sbPts: { type: Number, default: 0 },
    roster: { type: rosterSchema, default: {} },
  },
  { timestamps: true }
);

const Contestant = mongoose.model("Contestant", contestantSchema);

export default Contestant;

