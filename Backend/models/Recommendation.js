const mongoose = require("mongoose");

const recommendationSchema = new mongoose.Schema(
  {
    metal: {
      type: String, // "Lead", "Cadmium", "Chromium", "Arsenic", "Mercury", "Nickel", "Copper", "Zinc", "Iron", "General"
      required: true,
    },
    symbol: {
      type: String, // "Pb", "Cd", "Cr", "As", "Hg", "Ni", "Cu", "Zn", "Fe", "General"
      required: true,
    },
    severityLevel: {
      type: String, // "Low", "Moderate", "High", "Severe"
      required: true,
      default: "Moderate",
    },
    treatmentMethods: {
      type: [String],
      default: [],
    },
    reusePossibilities: {
      type: [String],
      default: [],
    },
    recyclingPossibilities: {
      type: [String],
      default: [],
    },
    environmentalPrecautions: {
      type: [String],
      default: [],
    },
    publicHealthWarnings: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Recommendation", recommendationSchema);
