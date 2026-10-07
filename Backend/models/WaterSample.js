const mongoose = require("mongoose");

const waterSampleSchema = new mongoose.Schema(
  {
    sampleId: {
      type: String,
      unique: true,
      trim: true,
    },
    locationName: {
      type: String,
      required: [true, "Location Name is required"],
      trim: true,
    },
    district: {
      type: String,
      default: "Telangana",
      trim: true,
    },
    waterSource: {
      type: String,
      default: "Urban Lake",
      trim: true,
    },
    latitude: {
      type: Number,
      default: 17.385,
    },
    longitude: {
      type: Number,
      default: 78.4866,
    },
    collectionDate: {
      type: Date,
      default: Date.now,
    },
    pb: { type: Number, default: 0 },
    cd: { type: Number, default: 0 },
    cr: { type: Number, default: 0 },
    as: { type: Number, default: 0 },
    hg: { type: Number, default: 0 },
    ni: { type: Number, default: 0 },
    cu: { type: Number, default: 0 },
    zn: { type: Number, default: 0 },
    fe: { type: Number, default: 0 },
    hpi: { type: Number, default: 0 },
    riskLevel: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium",
    },
    status: {
      type: String,
      enum: ["Analyzed", "Under Review", "Pending"],
      default: "Analyzed",
    },
    collector: {
      type: String,
      default: "Researcher",
      trim: true,
    },
    researcher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to generate unique sampleId if not supplied
waterSampleSchema.pre("save", async function () {
  if (!this.sampleId) {
    const count = await mongoose.model("WaterSample").countDocuments();
    const year = new Date().getFullYear();
    this.sampleId = `SMP-${year}-${String(count + 1).padStart(3, "0")}`;
  }
});

module.exports = mongoose.model("WaterSample", waterSampleSchema);