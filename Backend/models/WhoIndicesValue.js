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
    default: null,
  },
});

const whoIndicesValueSchema = new mongoose.Schema(
  {
    indexName: {
      type: String,
      required: true,
      unique: true,
    },

    ranges: [rangeSchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "WhoIndicesValue",
  whoIndicesValueSchema
);