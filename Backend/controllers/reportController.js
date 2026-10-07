const PollutionAssessment = require("../models/PollutionAssessment");
const { generatePDF } = require("../services/pdfGenerator");
const { createNotification } = require("../services/notificationHelper");

/**
 * Download Assessment PDF Report using existing PDF generator backend
 * GET /api/reports/:id
 */
const downloadReport = async (req, res) => {
  try {
    const { id } = req.params;

    // Look up by Assessment ID (_id) or Sample ID (sampleId)
    let assessment = await PollutionAssessment.findById(id).populate("sampleId");

    if (!assessment) {
      assessment = await PollutionAssessment.findOne({ sampleId: id }).populate("sampleId");
    }

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: "Assessment data not found in database. Please generate an assessment first.",
      });
    }

    // Trigger Notification: Report Downloaded
    await createNotification({
      title: "Report Downloaded",
      message: `PDF Compliance Report downloaded for sample ${assessment.customSampleId || assessment.locationName}`,
      type: "info",
    });

    // Call existing PDF generator logic
    generatePDF(assessment, res);
  } catch (error) {
    console.error("Error in downloadReport controller:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error while generating PDF report.",
    });
  }
};

module.exports = {
  downloadReport,
};