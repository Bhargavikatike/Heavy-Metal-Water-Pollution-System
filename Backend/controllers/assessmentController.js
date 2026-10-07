const WaterSample = require("../models/WaterSample");
const PollutionAssessment = require("../models/PollutionAssessment");
const MetalStandard = require("../models/MetalStandard");
const PollutionIndexThreshold = require("../models/PollutionIndexThreshold");

const {
  calculateHPI,
  calculateMI,
  calculateCF,
  calculatePLI,
  calculateIgeo,
  getExceededMetals,
} = require("../services/pollutionCalculator");

const {
  fetchRecommendationsFromDB,
} = require("../services/recommendationEngine");

const {
  getCategoryFromThresholds,
  determineOverallWaterStatus,
} = require("../services/indexComparison");

const {
  seedStandardsAndThresholdsIfNeeded,
} = require("../services/standardsSeeder");

const { createNotification } = require("../services/notificationHelper");

/**
 * Generate Scientific Assessment Workflow:
 * 1. Complete pollution assessment (calculate HPI, MI, CF, PLI, Igeo).
 * 2. Identify exceeded metals, severity level, and water quality status.
 * 3. Fetch structured recommendations from the MongoDB Recommendation collection/database.
 * 4. Save assessment record containing:
 *    - Exceeded Metals
 *    - Pollution Severity & Overall Status
 *    - Retrieved Recommendations (Treatment Methods, Reuse, Recycling, Precautions, Health Warnings)
 *    - Assessment Date
 * POST /api/assessments/generate/:sampleId
 */
const generateAssessment = async (req, res) => {
  try {
    const { sampleId } = req.params;

    // Fetch Water Sample from MongoDB
    const sample = await WaterSample.findById(sampleId);
    if (!sample) {
      return res.status(404).json({
        success: false,
        message: `Water sample not found with ID ${sampleId}`,
      });
    }

    // Seed default standards & thresholds in MongoDB if empty
    await seedStandardsAndThresholdsIfNeeded();

    // Fetch database standards & thresholds
    const standards = await MetalStandard.find().sort({ metal: 1 });
    const thresholds = await PollutionIndexThreshold.find();

    if (!standards || standards.length === 0) {
      return res.status(500).json({
        success: false,
        message: "Metal standards collection empty in database",
      });
    }

    // Step 1: Calculate pollution indices (CF and Igeo use background concentrations Bi from DB)
    const hpi = calculateHPI(sample, standards);
    const mi = calculateMI(sample, standards);
    const cf = calculateCF(sample, standards);
    const pli = calculatePLI(cf);
    const igeo = calculateIgeo(sample, standards);
    const exceededMetals = getExceededMetals(sample, standards);

    // Step 2: Fetch threshold documents & determine individual index categories
    const hpiDoc = thresholds.find((t) => t.indexName === "HPI");
    const miDoc = thresholds.find((t) => t.indexName === "MI");
    const pliDoc = thresholds.find((t) => t.indexName === "PLI");
    const cfDoc = thresholds.find((t) => t.indexName === "CF");
    const igeoDoc = thresholds.find((t) => t.indexName === "Igeo" || t.indexName === "IGEO");

    const hpiCategory = getCategoryFromThresholds(hpi, hpiDoc ? hpiDoc.categories : []);
    const miCategory = getCategoryFromThresholds(mi, miDoc ? miDoc.categories : []);
    const pliCategory = getCategoryFromThresholds(pli, pliDoc ? pliDoc.categories : []);

    const cfCategories = {};
    for (const metalSymbol in cf) {
      cfCategories[metalSymbol] = getCategoryFromThresholds(cf[metalSymbol], cfDoc ? cfDoc.categories : []);
    }

    const igeoCategories = {};
    for (const metalSymbol in igeo) {
      igeoCategories[metalSymbol] = getCategoryFromThresholds(igeo[metalSymbol], igeoDoc ? igeoDoc.categories : []);
    }

    // Determine Overall Water Quality Status
    const overallStatus = determineOverallWaterStatus({
      hpi,
      mi,
      pli,
      hpiCategory,
      miCategory,
      pliCategory,
      exceededMetalsCount: exceededMetals.length,
    });

    // Step 3: Fetch relevant structured recommendations from MongoDB Recommendation collection
    const retrievedRecommendations = await fetchRecommendationsFromDB(exceededMetals, overallStatus);

    // Flatten for legacy arrays if needed, keeping structured object intact
    const flattenedRecs = [
      ...retrievedRecommendations.treatmentMethods,
      ...retrievedRecommendations.publicHealthWarnings,
    ];

    // Risk badge mapping for sample list
    let simpleRiskLevel = "Low";
    if (overallStatus === "SEVERELY CONTAMINATED WATER") simpleRiskLevel = "Critical";
    else if (overallStatus === "HIGHLY CONTAMINATED WATER") simpleRiskLevel = "High";
    else if (overallStatus === "CONTAMINATED WATER") simpleRiskLevel = "Medium";

    const generatedAt = new Date();

    // Step 4: Save assessment record in MongoDB
    let assessment = await PollutionAssessment.findOne({ sampleId: sample._id });

    if (assessment) {
      assessment.hpi = hpi;
      assessment.mi = mi;
      assessment.pli = pli;
      assessment.cf = cf;
      assessment.igeo = igeo;
      assessment.hpiCategory = hpiCategory;
      assessment.miCategory = miCategory;
      assessment.pliCategory = pliCategory;
      assessment.cfCategories = cfCategories;
      assessment.igeoCategories = igeoCategories;
      assessment.overallStatus = overallStatus;
      assessment.exceededMetals = exceededMetals;
      assessment.recommendations = flattenedRecs;
      assessment.structuredRecommendations = retrievedRecommendations;
      assessment.generatedAt = generatedAt;
      await assessment.save();
    } else {
      assessment = await PollutionAssessment.create({
        sampleId: sample._id,
        customSampleId: sample.sampleId || `SMP-${sample._id.toString().substring(18)}`,
        locationName: sample.locationName,
        waterSource: sample.waterSource,
        collectionDate: sample.collectionDate || sample.createdAt,
        hpi,
        mi,
        pli,
        cf,
        igeo,
        hpiCategory,
        miCategory,
        pliCategory,
        cfCategories,
        igeoCategories,
        overallStatus,
        exceededMetals,
        recommendations: flattenedRecs,
        structuredRecommendations: retrievedRecommendations,
        generatedAt,
      });
    }

    // Update WaterSample record in MongoDB
    sample.hpi = hpi;
    sample.mi = mi;
    sample.pli = pli;
    sample.riskLevel = simpleRiskLevel;
    await sample.save();

    // Create Notification: Assessment Generated
    await createNotification({
      title: "Assessment Generated",
      message: `Scientific assessment completed for sample ${assessment.customSampleId || sample.locationName}`,
      type: "info",
    });

    // Create Notification: High Pollution Detected (if HPI > 100 or Contaminated)
    if (hpi > 100 || overallStatus === "HIGHLY CONTAMINATED WATER" || overallStatus === "SEVERELY CONTAMINATED WATER") {
      await createNotification({
        title: "High Pollution Detected",
        message: `High heavy metal contamination alert at ${sample.locationName}! Status: ${overallStatus}`,
        type: "danger",
      });
    }

    res.status(201).json({
      success: true,
      message: "Assessment & retrieved recommendations stored in MongoDB",
      assessment,
    });
  } catch (error) {
    console.error("Error in generateAssessment:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to generate assessment",
    });
  }
};

/**
 * Fetch All Assessments from MongoDB
 * GET /api/assessments
 */
const getAllAssessments = async (req, res) => {
  try {
    const assessments = await PollutionAssessment.find()
      .populate("sampleId")
      .sort({ generatedAt: -1 });

    res.status(200).json({
      success: true,
      count: assessments.length,
      assessments,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Fetch Single Assessment by ID
 * GET /api/assessments/:id
 */
const getAssessmentById = async (req, res) => {
  try {
    const assessment = await PollutionAssessment.findById(req.params.id).populate("sampleId");
    if (!assessment) {
      return res.status(404).json({ success: false, message: "Assessment not found" });
    }
    res.status(200).json({ success: true, assessment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Delete Assessment
 * DELETE /api/assessments/:id
 */
const deleteAssessment = async (req, res) => {
  try {
    const assessment = await PollutionAssessment.findByIdAndDelete(req.params.id);
    if (!assessment) {
      return res.status(404).json({ success: false, message: "Assessment not found" });
    }
    res.status(200).json({ success: true, message: "Assessment deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  generateAssessment,
  getAllAssessments,
  getAssessmentById,
  deleteAssessment,
};