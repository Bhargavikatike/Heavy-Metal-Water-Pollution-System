const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  label: {
    type: String,
    required: true,
  },
  min: {
    type: Number,
    required: true,
  },
  max: {
    type: Number,
    required: true,
  },
});

const pollutionIndexThresholdSchema = new mongoose.Schema(
  {
    indexName: {
      type: String, // "HPI", "MI", "CF", "PLI", "Igeo"
      required: true,
      unique: true,
    },
    categories: [categorySchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "PollutionIndexThreshold",
  pollutionIndexThresholdSchema
);
