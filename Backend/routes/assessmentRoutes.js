const express = require("express");
const router = express.Router();

const {
  generateAssessment,
  getAllAssessments,
  getAssessmentById,
  deleteAssessment,
} = require("../controllers/assessmentController");

// Generate scientific assessment for a sample
router.post("/generate/:sampleId", generateAssessment);
router.post("/:sampleId", generateAssessment);

// Fetch assessments
router.get("/", getAllAssessments);
router.get("/:id", getAssessmentById);
router.delete("/:id", deleteAssessment);

module.exports = router;