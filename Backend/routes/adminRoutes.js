const express = require("express");
const router = express.Router();



const {
  getAdminOverview,
  getRecentActivity,
  getDistrictAnalysis
} = require("../controllers/adminController");
const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/roleMiddleware");
const isAdmin = require("../middleware/adminMiddleware");

router.get(
  "/overview",
  protect,
  isAdmin,
  getAdminOverview
);
router.get(
  "/recent-activity",
  protect,
  adminOnly,
  getRecentActivity
);
router.get(
  "/district-analysis",
  protect,
  adminOnly,
  getDistrictAnalysis
);


module.exports = router;