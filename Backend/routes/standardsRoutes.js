const express = require("express");
const router = express.Router();
const {
  getMetalStandards,
  createMetalStandard,
  updateMetalStandard,
  deleteMetalStandard,
  getIndexThresholds,
  updateIndexThreshold,
} = require("../controllers/standardsController");

// Metal Standards Routes
router.get("/metals", getMetalStandards);
router.get("/", getMetalStandards);
router.post("/metals", createMetalStandard);
router.put("/metals/:id", updateMetalStandard);
router.delete("/metals/:id", deleteMetalStandard);

// Pollution Index Threshold Routes
router.get("/thresholds", getIndexThresholds);
router.put("/thresholds/:id", updateIndexThreshold);

module.exports = router;
