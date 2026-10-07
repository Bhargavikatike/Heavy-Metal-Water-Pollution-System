const Recommendation = require("../models/Recommendation");
const { fetchRecommendationsFromDB } = require("../services/recommendationEngine");
const { seedRecommendationsIfNeeded } = require("../services/recommendationSeeder");

/**
 * GET All Recommendations from MongoDB
 * GET /api/recommendations
 */
const getAllRecommendations = async (req, res) => {
  try {
    await seedRecommendationsIfNeeded();
    const recommendations = await Recommendation.find().sort({ metal: 1 });
    res.status(200).json({
      success: true,
      count: recommendations.length,
      recommendations,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Match Recommendations based on Exceeded Metals & Severity Level
 * POST /api/recommendations/match
 */
const matchRecommendations = async (req, res) => {
  try {
    const { exceededMetals = [], overallStatus = "SAFE WATER" } = req.body;
    const structuredRecommendations = await fetchRecommendationsFromDB(exceededMetals, overallStatus);

    res.status(200).json({
      success: true,
      data: structuredRecommendations,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Seed Recommendations in MongoDB
 * POST /api/recommendations/seed
 */
const seedRecommendations = async (req, res) => {
  try {
    await seedRecommendationsIfNeeded();
    res.status(200).json({
      success: true,
      message: "Recommendations seeded successfully in MongoDB database",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllRecommendations,
  matchRecommendations,
  seedRecommendations,
};
