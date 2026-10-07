const express = require("express");
const router = express.Router();
const multer = require("multer");

// Configure multer buffer storage for memory parsing
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

const {
  addSample,
  uploadSamples,
  getAllSamples,
  getSampleById,
  updateSample,
  deleteSample,
} = require("../controllers/sampleController");

// Public / Authenticated Endpoints for Water Samples
router.get("/", getAllSamples);
router.post("/add", addSample);
router.post("/upload", upload.single("file"), uploadSamples);
router.get("/:id", getSampleById);
router.put("/:id", updateSample);
router.delete("/:id", deleteSample);

module.exports = router;