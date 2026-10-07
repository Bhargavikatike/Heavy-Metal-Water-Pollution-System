const Recommendation = require("../models/Recommendation");
const { seedRecommendationsIfNeeded } = require("./recommendationSeeder");

/**
 * Scientific Recommendation Engine Service
 * Consumes the MongoDB Recommendation collection to retrieve structured recommendations.
 * 
 * Sections:
 * 1. Recommended Treatment Methods
 * 2. Water Reuse Possibilities
 * 3. Water Recycling Possibilities
 * 4. Environmental Precautions
 * 5. Public Health Warnings
 */
const fetchRecommendationsFromDB = async (exceededMetals = [], overallStatus = "SAFE WATER") => {
  await seedRecommendationsIfNeeded();

  const treatmentMethods = new Set();
  const reusePossibilities = new Set();
  const recyclingPossibilities = new Set();
  const environmentalPrecautions = new Set();
  const publicHealthWarnings = new Set();

  // Determine pollution severity tag for database lookup
  let targetSeverity = "Moderate";
  if (overallStatus === "SEVERELY CONTAMINATED WATER") targetSeverity = "Severe";
  else if (overallStatus === "HIGHLY CONTAMINATED WATER") targetSeverity = "Severe";
  else if (overallStatus === "CONTAMINATED WATER") targetSeverity = "Moderate";

  // If no metals exceed limits and water is safe
  if (exceededMetals.length === 0 && overallStatus === "SAFE WATER") {
    return {
      treatmentMethods: [
        "Water quality complies with WHO/BIS standard permissible limits.",
        "Standard dual-media sand filtration and disinfection.",
      ],
      reusePossibilities: [
        "Safe for unrestricted potable, agricultural, and domestic consumption.",
      ],
      recyclingPossibilities: [
        "Standard municipal storm and greywater recycling.",
      ],
      environmentalPrecautions: [
        "Maintain routine periodic catchment area monitoring and watershed protection.",
      ],
      publicHealthWarnings: [
        "No heavy metal health hazards detected.",
      ],
    };
  }

  // Iterate over detected exceeded metals and query MongoDB Recommendation collection
  for (const item of exceededMetals) {
    const metalName = item.metal || "";
    const symbol = item.symbol || "";

    // Query MongoDB for matching metal recommendation
    let docs = await Recommendation.find({
      $or: [
        { metal: new RegExp(`^${metalName}$`, "i") },
        { symbol: new RegExp(`^${symbol}$`, "i") },
      ],
    });

    // Fallback if specific severity not found
    if (docs.length === 0) {
      docs = await Recommendation.find({ symbol: "General" });
    }

    docs.forEach((doc) => {
      (doc.treatmentMethods || []).forEach((t) => treatmentMethods.add(t));
      (doc.reusePossibilities || []).forEach((r) => reusePossibilities.add(r));
      (doc.recyclingPossibilities || []).forEach((rc) => recyclingPossibilities.add(rc));
      (doc.environmentalPrecautions || []).forEach((e) => environmentalPrecautions.add(e));
      (doc.publicHealthWarnings || []).forEach((w) => publicHealthWarnings.add(w));
    });
  }

  // If general overall status requires additional database warnings
  if (treatmentMethods.size === 0) {
    const generalDocs = await Recommendation.find({ symbol: "General" });
    generalDocs.forEach((doc) => {
      (doc.treatmentMethods || []).forEach((t) => treatmentMethods.add(t));
      (doc.reusePossibilities || []).forEach((r) => reusePossibilities.add(r));
      (doc.recyclingPossibilities || []).forEach((rc) => recyclingPossibilities.add(rc));
      (doc.environmentalPrecautions || []).forEach((e) => environmentalPrecautions.add(e));
      (doc.publicHealthWarnings || []).forEach((w) => publicHealthWarnings.add(w));
    });
  }

  return {
    treatmentMethods: Array.from(treatmentMethods),
    reusePossibilities: Array.from(reusePossibilities),
    recyclingPossibilities: Array.from(recyclingPossibilities),
    environmentalPrecautions: Array.from(environmentalPrecautions),
    publicHealthWarnings: Array.from(publicHealthWarnings),
  };
};

module.exports = {
  fetchRecommendationsFromDB,
};