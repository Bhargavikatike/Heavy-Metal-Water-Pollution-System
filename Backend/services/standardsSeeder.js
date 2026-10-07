const MetalStandard = require("../models/MetalStandard");
const PollutionIndexThreshold = require("../models/PollutionIndexThreshold");

const DEFAULT_METAL_STANDARDS = [
  { metal: "Lead", symbol: "Pb", permissibleLimit: 0.01, idealValue: 0, backgroundConcentration: 0.002, unitWeight: 10 },
  { metal: "Cadmium", symbol: "Cd", permissibleLimit: 0.003, idealValue: 0, backgroundConcentration: 0.0005, unitWeight: 33.33 },
  { metal: "Chromium", symbol: "Cr", permissibleLimit: 0.05, idealValue: 0, backgroundConcentration: 0.01, unitWeight: 2 },
  { metal: "Arsenic", symbol: "As", permissibleLimit: 0.01, idealValue: 0, backgroundConcentration: 0.002, unitWeight: 10 },
  { metal: "Mercury", symbol: "Hg", permissibleLimit: 0.001, idealValue: 0, backgroundConcentration: 0.0001, unitWeight: 100 },
  { metal: "Nickel", symbol: "Ni", permissibleLimit: 0.02, idealValue: 0, backgroundConcentration: 0.005, unitWeight: 5 },
  { metal: "Copper", symbol: "Cu", permissibleLimit: 0.05, idealValue: 0, backgroundConcentration: 0.01, unitWeight: 2 },
  { metal: "Zinc", symbol: "Zn", permissibleLimit: 3.0, idealValue: 0, backgroundConcentration: 0.5, unitWeight: 0.033 },
  { metal: "Iron", symbol: "Fe", permissibleLimit: 0.3, idealValue: 0, backgroundConcentration: 0.1, unitWeight: 0.33 },
];

const DEFAULT_INDEX_THRESHOLDS = [
  {
    indexName: "HPI",
    categories: [
      { label: "Low Pollution", min: 0, max: 50 },
      { label: "Moderate Pollution", min: 50, max: 100 },
      { label: "High Pollution", min: 100, max: 200 },
      { label: "Critical Pollution", min: 200, max: 9999 },
    ],
  },
  {
    indexName: "MI",
    categories: [
      { label: "Very Pure", min: 0, max: 0.3 },
      { label: "Pure", min: 0.3, max: 1 },
      { label: "Slightly Polluted", min: 1, max: 2 },
      { label: "Moderately Polluted", min: 2, max: 4 },
      { label: "Strongly Polluted", min: 4, max: 6 },
      { label: "Seriously Polluted", min: 6, max: 9999 },
    ],
  },
  {
    indexName: "CF",
    categories: [
      { label: "Low Contamination", min: 0, max: 1 },
      { label: "Moderate Contamination", min: 1, max: 3 },
      { label: "Considerable Contamination", min: 3, max: 6 },
      { label: "Very High Contamination", min: 6, max: 9999 },
    ],
  },
  {
    indexName: "PLI",
    categories: [
      { label: "Unpolluted", min: 0, max: 1 },
      { label: "Moderate Pollution", min: 1, max: 2 },
      { label: "Heavy Pollution", min: 2, max: 9999 },
    ],
  },
  {
    indexName: "Igeo",
    categories: [
      { label: "Unpolluted", min: -999, max: 0 },
      { label: "Unpolluted to Moderately Polluted", min: 0, max: 1 },
      { label: "Moderately Polluted", min: 1, max: 2 },
      { label: "Moderately to Strongly Polluted", min: 2, max: 3 },
      { label: "Strongly to Extremely Polluted", min: 3, max: 9999 },
    ],
  },
];

const seedStandardsAndThresholdsIfNeeded = async () => {
  try {
    const metalCount = await MetalStandard.countDocuments();
    if (metalCount === 0) {
      console.log("Seeding Metal Standards into MongoDB...");
      await MetalStandard.insertMany(DEFAULT_METAL_STANDARDS);
    }

    const thresholdCount = await PollutionIndexThreshold.countDocuments();
    if (thresholdCount === 0) {
      console.log("Seeding Pollution Index Thresholds into MongoDB...");
      await PollutionIndexThreshold.insertMany(DEFAULT_INDEX_THRESHOLDS);
    }
  } catch (error) {
    console.error("Error seeding standards & thresholds:", error);
  }
};

module.exports = {
  seedStandardsAndThresholdsIfNeeded,
  DEFAULT_METAL_STANDARDS,
  DEFAULT_INDEX_THRESHOLDS,
};
