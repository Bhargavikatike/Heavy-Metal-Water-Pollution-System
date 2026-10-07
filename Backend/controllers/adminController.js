const User = require("../models/User");
const WaterSample = require("../models/WaterSample");
const PollutionAssessment = require("../models/PollutionAssessment");

const getAdminOverview = async (req, res) => {
  try {

    const totalUsers =
      await User.countDocuments();

    const totalResearchers =
      await User.countDocuments({
        role: "researcher"
      });

    const totalAdmins =
      await User.countDocuments({
        role: "admin"
      });

    const totalSamples =
      await WaterSample.countDocuments();

    const totalAssessments =
      await PollutionAssessment.countDocuments();

    const criticalAssessments =
      await PollutionAssessment.countDocuments({
        overallRisk: "Critical"
      });

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalResearchers,
        totalAdmins,
        totalSamples,
        totalAssessments,
        criticalAssessments
      }
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};
const getRecentActivity = async (req, res) => {
  try {

    const recentSamples = await WaterSample
      .find()
      .sort({ createdAt: -1 })
      .limit(5);

    const recentAssessments = await PollutionAssessment
      .find()
      .populate("sampleId")
      .sort({ createdAt: -1 })
      .limit(5);

    const activities = [];

    recentSamples.forEach((sample) => {
      activities.push({
        type: "Sample Added",
        location: sample.locationName,
        district: sample.district,
        date: sample.createdAt
      });
    });

    recentAssessments.forEach((assessment) => {
      activities.push({
        type: "Assessment Generated",
        location:
          assessment.sampleId?.locationName || "Unknown",
        risk: assessment.overallRisk,
        date: assessment.createdAt
      });
    });

    activities.sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    res.status(200).json({
      success: true,
      count: activities.length,
      data: activities
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};
const getDistrictAnalysis = async (req, res) => {
  try {

    const districtData =
      await WaterSample.aggregate([
        {
          $group: {
            _id: "$district",
            sampleCount: { $sum: 1 }
          }
        },
        {
          $sort: {
            sampleCount: -1
          }
        }
      ]);

    res.status(200).json({
      success: true,
      data: districtData
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

module.exports = {
  getAdminOverview,
  getRecentActivity,
  getDistrictAnalysis
};