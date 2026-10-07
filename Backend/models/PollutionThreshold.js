const mongoose = require("mongoose");

const rangeSchema = new mongoose.Schema({
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
    default: null, // null means infinity
  },
});

const pollutionThresholdSchema = new mongoose.Schema(
  {
    indexName: {
      type: String, // "HPI", "MI", "CF", "PLI", "IGEO"
      required: true,
      unique: true,
    },
    ranges: [rangeSchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("PollutionThreshold", pollutionThresholdSchema);
