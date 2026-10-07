const express = require("express");
const router = express.Router();

const {
  registerResearcher,
  loginUser,
  getUserProfile,
  updateUserProfile,
} = require("../controllers/authController");

router.post("/register", registerResearcher);
router.post("/login", loginUser);
router.get("/profile", getUserProfile);
router.put("/profile", updateUserProfile);

module.exports = router;