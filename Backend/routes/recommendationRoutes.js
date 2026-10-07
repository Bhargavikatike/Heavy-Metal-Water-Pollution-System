const express = require("express");
const router = express.Router();
const {
  getAllRecommendations,
  matchRecommendations,
  seedRecommendations,
} = require("../controllers/recommendationController");

router.get("/", getAllRecommendations);
router.post("/match", matchRecommendations);
router.post("/seed", seedRecommendations);

module.exports = router;
