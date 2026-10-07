const express = require("express");

const {
  downloadReport,
} = require("../controllers/reportController");

const router = express.Router();

router.get(
  "/:id",
  downloadReport
);

module.exports = router;