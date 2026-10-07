const MetalStandard = require("../models/MetalStandard");
const PollutionIndexThreshold = require("../models/PollutionIndexThreshold");
const { seedStandardsAndThresholdsIfNeeded } = require("../services/standardsSeeder");

/**
 * GET All Metal Standards from MongoDB
 * GET /api/standards/metals
 */
const getMetalStandards = async (req, res) => {
  try {
    await seedStandardsAndThresholdsIfNeeded();
    const standards = await MetalStandard.find().sort({ metal: 1 });
    res.status(200).json({
      success: true,
      count: standards.length,
      standards,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Create New Metal Standard in MongoDB
 * POST /api/standards/metals
 */
const createMetalStandard = async (req, res) => {
  try {
    const { metal, symbol, permissibleLimit, idealValue, backgroundConcentration, unitWeight } = req.body;

    const existing = await MetalStandard.findOne({ metal });
    if (existing) {
      return res.status(400).json({ success: false, message: `Metal standard for ${metal} already exists` });
    }

    const standard = await MetalStandard.create({
      metal,
      symbol,
      permissibleLimit: Number(permissibleLimit),
      idealValue: Number(idealValue || 0),
      backgroundConcentration: Number(backgroundConcentration),
      unitWeight: Number(unitWeight),
    });

    res.status(201).json({ success: true, message: "Metal standard created in MongoDB", standard });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update Metal Standard in MongoDB
 * PUT /api/standards/metals/:id
 */
const updateMetalStandard = async (req, res) => {
  try {
    const standard = await MetalStandard.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!standard) {
      return res.status(404).json({ success: false, message: "Metal standard not found" });
    }
    res.status(200).json({ success: true, message: "Metal standard updated in MongoDB", standard });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Delete Metal Standard from MongoDB
 * DELETE /api/standards/metals/:id
 */
const deleteMetalStandard = async (req, res) => {
  try {
    const standard = await MetalStandard.findByIdAndDelete(req.params.id);
    if (!standard) {
      return res.status(404).json({ success: false, message: "Metal standard not found" });
    }
    res.status(200).json({ success: true, message: "Metal standard deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET All Pollution Index Thresholds from MongoDB
 * GET /api/standards/thresholds
 */
const getIndexThresholds = async (req, res) => {
  try {
    await seedStandardsAndThresholdsIfNeeded();
    const thresholds = await PollutionIndexThreshold.find();
    res.status(200).json({
      success: true,
      count: thresholds.length,
      thresholds,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update Pollution Index Threshold Categories in MongoDB
 * PUT /api/standards/thresholds/:id
 */
const updateIndexThreshold = async (req, res) => {
  try {
    const threshold = await PollutionIndexThreshold.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!threshold) {
      return res.status(404).json({ success: false, message: "Index threshold not found" });
    }
    res.status(200).json({ success: true, message: "Index threshold updated in MongoDB", threshold });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getMetalStandards,
  createMetalStandard,
  updateMetalStandard,
  deleteMetalStandard,
  getIndexThresholds,
  updateIndexThreshold,
};
