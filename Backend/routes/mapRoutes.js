const express = require("express");
const router = express.Router();
const { getFactories, getWaterBodies } = require("../controllers/mapController");

// Public / Authenticated REST endpoints for GIS Map dynamic data
router.get("/factories", getFactories);
router.get("/water-bodies", getWaterBodies);

module.exports = router;
