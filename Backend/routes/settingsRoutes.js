const express = require("express");
const router = express.Router();
const {
  getUserSettings,
  updateUserSettings,
  changePassword,
} = require("../controllers/settingsController");

router.get("/", getUserSettings);
router.put("/", updateUserSettings);
router.post("/change-password", changePassword);

module.exports = router;
