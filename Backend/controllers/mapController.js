const WaterSample = require("../models/WaterSample");
const PollutionAssessment = require("../models/PollutionAssessment");
const MetalStandard = require("../models/MetalStandard");
const {
  calculateHPI,
  calculateMI,
  calculateCF,
  calculatePLI,
  calculateIgeo,
} = require("../services/pollutionCalculator");

// Baseline 5 Factories
const baselineFactories = [
  {
    id: "base-factory-1",
    name: "Jeedimetla Factory",
    industryType: "Chemical Manufacturing",
    lat: 17.5184,
    lng: 78.4518,
    pollution: "High",
    metals: {
      Pb: 0.12,
      Hg: 0.03,
      Cd: 0.02,
      Cr: 0.06,
      As: 0.05,
      Ni: 0.18,
    },
  },
  {
    id: "base-factory-2",
    name: "Balanagar Factory",
    industryType: "Metal Plating & Finishing",
    lat: 17.4934,
    lng: 78.4484,
    pollution: "Medium",
    metals: {
      Cr: 0.08,
      Ni: 0.15,
      Cu: 0.22,
      Zn: 0.45,
    },
  },
  {
    id: "base-factory-3",
    name: "Patancheru Factory",
    industryType: "Pharmaceutical & Bulk Drugs",
    lat: 17.5286,
    lng: 78.264,
    pollution: "High",
    metals: {
      As: 0.09,
      Cd: 0.04,
      Pb: 0.18,
      Hg: 0.05,
      Fe: 1.25,
      Mn: 0.65,
    },
  },
  {
    id: "base-factory-4",
    name: "Nacharam Factory",
    industryType: "Textile & Dyeing Industry",
    lat: 17.4401,
    lng: 78.5586,
    pollution: "Medium",
    metals: {
      Cu: 0.19,
      Cr: 0.05,
      Fe: 0.85,
      Zn: 0.32,
    },
  },
  {
    id: "base-factory-5",
    name: "Uppal Factory",
    industryType: "Battery & Electronics Manufacturing",
    lat: 17.4058,
    lng: 78.5591,
    pollution: "Low",
    metals: {
      Pb: 0.04,
      Cd: 0.008,
      Ni: 0.06,
      Mn: 0.12,
    },
  },
];

// Baseline 5 Water Bodies
const baselineWaterBodies = [
  {
    id: "base-water-1",
    name: "Hussain Sagar",
    lat: 17.4239,
    lng: 78.4738,
    pollution: "High",
    hpi: 145.2,
    mi: 4.15,
    cf: 5.3,
    pli: 2.75,
    igeo: 2.1,
    metals: {
      Pb: 0.14,
      Hg: 0.04,
      Cd: 0.03,
      Cr: 0.08,
      As: 0.05,
      Fe: 1.4,
      Zn: 0.62,
    },
  },
  {
    id: "base-water-2",
    name: "Osman Sagar",
    lat: 17.3713,
    lng: 78.2988,
    pollution: "Medium",
    hpi: 78.5,
    mi: 2.05,
    cf: 2.4,
    pli: 1.35,
    igeo: 0.95,
    metals: {
      Fe: 0.72,
      Mn: 0.35,
      Cu: 0.11,
      Zn: 0.28,
    },
  },
  {
    id: "base-water-3",
    name: "Himayat Sagar",
    lat: 17.3507,
    lng: 78.3657,
    pollution: "Medium",
    hpi: 82.0,
    mi: 2.2,
    cf: 2.65,
    pli: 1.48,
    igeo: 1.02,
    metals: {
      Pb: 0.07,
      Cd: 0.012,
      Ni: 0.08,
      Cr: 0.04,
    },
  },
  {
    id: "base-water-4",
    name: "Durgam Cheruvu",
    lat: 17.4347,
    lng: 78.3924,
    pollution: "Low",
    hpi: 42.8,
    mi: 0.95,
    cf: 1.15,
    pli: 0.78,
    igeo: 0.38,
    metals: {
      Fe: 0.45,
      Mn: 0.18,
      Zn: 0.15,
    },
  },
  {
    id: "base-water-5",
    name: "Fox Sagar",
    lat: 17.5155,
    lng: 78.442,
    pollution: "High",
    hpi: 158.4,
    mi: 4.6,
    cf: 5.85,
    pli: 3.1,
    igeo: 2.45,
    metals: {
      Pb: 0.16,
      Hg: 0.05,
      Cd: 0.035,
      Cr: 0.09,
      As: 0.06,
      Ni: 0.21,
      Cu: 0.3,
    },
  },
];

/**
 * Get Factories for GIS Map
 * GET /api/map/factories
 */
const getFactories = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      count: baselineFactories.length,
      factories: baselineFactories,
    });
  } catch (error) {
    console.error("Error fetching factories for GIS map:", error);
    res.status(500).json({
      success: false,
      message: "Unable to load GIS factory data",
    });
  }
};

/**
 * Get Water Bodies for GIS Map (Dynamically loaded from MongoDB + baseline data)
 * GET /api/map/water-bodies
 */
const getWaterBodies = async (req, res) => {
  try {
    const samples = await WaterSample.find().sort({ createdAt: -1 });
    const assessments = await PollutionAssessment.find();
    let standards = await MetalStandard.find();

    if (!standards || standards.length === 0) {
      // Fallback default metal standards for formula calculations
      standards = [
        { symbol: "Pb", metal: "Lead", permissibleLimit: 0.01, idealValue: 0, unitWeight: 0.7, backgroundConcentration: 0.005 },
        { symbol: "Cd", metal: "Cadmium", permissibleLimit: 0.003, idealValue: 0, unitWeight: 0.7, backgroundConcentration: 0.001 },
        { symbol: "Cr", metal: "Chromium", permissibleLimit: 0.05, idealValue: 0, unitWeight: 0.7, backgroundConcentration: 0.01 },
        { symbol: "As", metal: "Arsenic", permissibleLimit: 0.01, idealValue: 0, unitWeight: 0.7, backgroundConcentration: 0.002 },
        { symbol: "Hg", metal: "Mercury", permissibleLimit: 0.006, idealValue: 0, unitWeight: 0.7, backgroundConcentration: 0.0005 },
        { symbol: "Ni", metal: "Nickel", permissibleLimit: 0.07, idealValue: 0, unitWeight: 0.3, backgroundConcentration: 0.01 },
        { symbol: "Cu", metal: "Copper", permissibleLimit: 2.0, idealValue: 0, unitWeight: 0.1, backgroundConcentration: 0.05 },
        { symbol: "Zn", metal: "Zinc", permissibleLimit: 3.0, idealValue: 0, unitWeight: 0.01, backgroundConcentration: 0.1 },
        { symbol: "Fe", metal: "Iron", permissibleLimit: 0.3, idealValue: 0, unitWeight: 0.003, backgroundConcentration: 0.1 },
      ];
    }

    const assessmentMap = new Map();
    assessments.forEach((a) => {
      if (a.sampleId) {
        assessmentMap.set(a.sampleId.toString(), a);
      }
    });

    const dbWaterBodies = samples.map((sample, index) => {
      const assessment = assessmentMap.get(sample._id.toString());

      const metals = {
        Pb: Number(sample.pb) || 0,
        Cd: Number(sample.cd) || 0,
        Cr: Number(sample.cr) || 0,
        As: Number(sample.as) || 0,
        Hg: Number(sample.hg) || 0,
        Ni: Number(sample.ni) || 0,
        Cu: Number(sample.cu) || 0,
        Zn: Number(sample.zn) || 0,
        Fe: Number(sample.fe) || 0,
      };

      const activeMetals = {};
      Object.entries(metals).forEach(([k, v]) => {
        if (v > 0) activeMetals[k] = v;
      });

      // Calculate indices if assessment not pre-generated
      let cfMap = {};
      if (assessment && assessment.cf) {
        cfMap = typeof assessment.cf.get === "function" ? Object.fromEntries(assessment.cf) : assessment.cf;
      } else {
        cfMap = calculateCF(sample, standards);
      }

      let igeoMap = {};
      if (assessment && assessment.igeo) {
        igeoMap = typeof assessment.igeo.get === "function" ? Object.fromEntries(assessment.igeo) : assessment.igeo;
      } else {
        igeoMap = calculateIgeo(sample, standards);
      }

      const hpi = Number(
        assessment?.hpi ?? sample.hpi ?? calculateHPI(sample, standards)
      );
      const mi = Number(
        assessment?.mi ?? sample.mi ?? calculateMI(sample, standards)
      );
      const pli = Number(
        assessment?.pli ?? sample.pli ?? calculatePLI(cfMap)
      );

      const cfValues = Object.values(cfMap).map(Number).filter((n) => !isNaN(n));
      const avgCF = cfValues.length > 0 ? Number((cfValues.reduce((a, b) => a + b, 0) / cfValues.length).toFixed(2)) : 1.0;

      const igeoValues = Object.values(igeoMap).map(Number).filter((n) => !isNaN(n));
      const avgIgeo = igeoValues.length > 0 ? Number((igeoValues.reduce((a, b) => a + b, 0) / igeoValues.length).toFixed(2)) : 0.5;

      let pollution = sample.riskLevel || "Medium";
      if (hpi >= 100 || pollution === "Critical") pollution = "High";
      else if (hpi >= 60) pollution = "Medium";
      else pollution = "Low";

      // Coordinate assignment with jitter if missing default
      let lat = Number(sample.latitude);
      let lng = Number(sample.longitude);
      if (!lat || isNaN(lat) || lat === 0) {
        lat = 17.385 + (index * 0.012) % 0.15;
      }
      if (!lng || isNaN(lng) || lng === 0) {
        lng = 78.4866 + (index * 0.015) % 0.15;
      }

      return {
        id: sample._id.toString(),
        sampleId: sample.sampleId,
        name: sample.locationName || `Water Sample ${sample.sampleId}`,
        lat,
        lng,
        pollution,
        hpi: Number(hpi.toFixed(1)),
        mi: Number(mi.toFixed(2)),
        cf: avgCF,
        pli: Number(pli.toFixed(2)),
        igeo: avgIgeo,
        metals: Object.keys(activeMetals).length > 0 ? activeMetals : metals,
        waterSource: sample.waterSource || "Urban Water Body",
        district: sample.district || "Telangana",
        isDatabaseRecord: true,
      };
    });

    // Merge baseline water bodies and database water samples
    // Remove baseline item if a DB sample has exact matching locationName
    const dbLocationNames = new Set(dbWaterBodies.map((w) => w.name.toLowerCase().trim()));
    const filteredBaseline = baselineWaterBodies.filter(
      (b) => !dbLocationNames.has(b.name.toLowerCase().trim())
    );

    const mergedWaterBodies = [...filteredBaseline, ...dbWaterBodies];

    res.status(200).json({
      success: true,
      count: mergedWaterBodies.length,
      waterBodies: mergedWaterBodies,
    });
  } catch (error) {
    console.error("Error fetching water bodies for GIS map:", error);
    res.status(500).json({
      success: false,
      message: "Unable to load GIS water body data",
    });
  }
};

module.exports = {
  getFactories,
  getWaterBodies,
};
