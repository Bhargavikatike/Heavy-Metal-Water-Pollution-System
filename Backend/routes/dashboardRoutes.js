const express = require("express");

const router = express.Router();

const {
  getDashboardStats,
  getRiskDistribution,
  getMetalComparison,
  getHPITrend,
  getMonthlyTrend,
  getSourceDistribution,
  getRecentAssessments,
  getTopPollutedLocations,
  getRiskSummary,
  getIndexSummary
} = require("../controllers/dashboardController");

router.get("/stats", getDashboardStats);

router.get("/risk-distribution", getRiskDistribution);

router.get("/metal-comparison", getMetalComparison);

router.get("/hpi-trend", getHPITrend);

router.get("/monthly-trend", getMonthlyTrend);

router.get(
  "/source-distribution",
  getSourceDistribution
);
router.get(
  "/recent-assessments",
  getRecentAssessments
);
router.get(
  "/top-polluted-locations",
  getTopPollutedLocations
);
router.get(
  "/risk-summary",
  getRiskSummary
);
router.get(
  "/index-summary",
  getIndexSummary
);
module.exports = router;