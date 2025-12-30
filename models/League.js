import mongoose from "mongoose";

const leagueSchema = new mongoose.Schema(
  {
    leagueName: { type: String, required: true },
    size: { type: Number, required: true },
    full: { type: Boolean, default: false },
    drafted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const League = mongoose.model("League", leagueSchema);

export default League;

