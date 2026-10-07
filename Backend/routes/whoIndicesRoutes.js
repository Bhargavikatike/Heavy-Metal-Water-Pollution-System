const express = require("express");

const router = express.Router();

const {
  seedIndicesValues,
} = require("../controllers/whoIndicesController");

router.post(
  "/seed",
  seedIndicesValues
);

module.exports = router;