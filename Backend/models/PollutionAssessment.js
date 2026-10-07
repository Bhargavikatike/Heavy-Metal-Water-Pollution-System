const mongoose = require("mongoose");

const pollutionAssessmentSchema = new mongoose.Schema(
  {
    sampleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WaterSample",
      required: true,
    },
    customSampleId: {
      type: String,
      default: "",
    },
    locationName: {
      type: String,
      default: "",
    },
    waterSource: {
      type: String,
      default: "",
    },
    collectionDate: {
      type: Date,
      default: Date.now,
    },
    // Calculated Values
    hpi: {
      type: Number,
      required: true,
      default: 0,
    },
    mi: {
      type: Number,
      required: true,
      default: 0,
    },
    pli: {
      type: Number,
      required: true,
      default: 0,
    },
    cf: {
      type: Map,
      of: Number,
      default: {},
    },
    igeo: {
      type: Map,
      of: Number,
      default: {},
    },
    // Individual Index Classifications
    hpiCategory: {
      type: String,
      default: "Low Pollution",
    },
    miCategory: {
      type: String,
      default: "Pure",
    },
    pliCategory: {
      type: String,
      default: "Unpolluted",
    },
    cfCategories: {
      type: Map,
      of: String,
      default: {},
    },
    igeoCategories: {
      type: Map,
      of: String,
      default: {},
    },
    // Overall Water Quality Status
    overallStatus: {
      type: String,
      enum: [
        "SAFE WATER",
        "CONTAMINATED WATER",
        "HIGHLY CONTAMINATED WATER",
        "SEVERELY CONTAMINATED WATER",
      ],
      default: "SAFE WATER",
    },
    exceededMetals: [
      {
        metal: String,
        symbol: String,
        measuredValue: Number,
        permissibleLimit: Number,
        unit: String,
      },
    ],
    recommendations: {
      type: [String],
      default: [],
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "PollutionAssessment",
  pollutionAssessmentSchema
);