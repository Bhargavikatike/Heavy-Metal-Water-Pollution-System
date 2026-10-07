const mongoose = require("mongoose");

const metalStandardSchema = new mongoose.Schema(
  {
    metal: {
      type: String,
      required: true,
      unique: true,
    },
    symbol: {
      type: String,
      required: true,
    },
    permissibleLimit: {
      type: Number,
      required: true, // Standard limit / MACi
    },
    idealValue: {
      type: Number,
      default: 0, // Ideal value Ii
    },
    backgroundConcentration: {
      type: Number,
      required: true, // Background value Bi
    },
    unitWeight: {
      type: Number,
      required: true, // Unit weight Wi
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("MetalStandard", metalStandardSchema);
