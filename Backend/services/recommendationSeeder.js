const Recommendation = require("../models/Recommendation");

const DEFAULT_RECOMMENDATIONS = [
  // 1. Lead (Pb)
  {
    metal: "Lead",
    symbol: "Pb",
    severityLevel: "Moderate",
    treatmentMethods: [
      "Activated Carbon Filtration",
      "Ion Exchange Resin Beds",
      "Point-of-Use Reverse Osmosis (RO)",
    ],
    reusePossibilities: [
      "Industrial cooling tower feed after filtration",
      "Sub-surface forestry irrigation",
    ],
    recyclingPossibilities: [
      "Closed-loop industrial rinse water recycling",
      "Precipitate metal recovery",
    ],
    environmentalPrecautions: [
      "Isolate discharge channels to prevent soil leaching",
      "Perform monthly soil and sediment testing",
    ],
    publicHealthWarnings: [
      "Lead concentrations exceed WHO safe limit (0.01 mg/L)",
      "Do not use for drinking, cooking, or food preparation",
    ],
  },
  {
    metal: "Lead",
    symbol: "Pb",
    severityLevel: "Severe",
    treatmentMethods: [
      "Multi-stage Industrial Reverse Osmosis (RO)",
      "Chemical Precipitation with Sodium Sulfide",
      "Advanced Ion Exchange Chelating Resins",
    ],
    reusePossibilities: [
      "Restricted strictly to closed-circuit industrial reuse",
    ],
    recyclingPossibilities: [
      "Hazardous waste sludge encapsulation",
      "Electro-deposition lead recovery",
    ],
    environmentalPrecautions: [
      "Declare immediate environmental protection zone",
      "Install perimeter groundwater monitoring wells",
    ],
    publicHealthWarnings: [
      "CRITICAL LEAD TOXICITY WARNING: High risk of neurological impairment",
      "Prohibit all human, livestock, and agricultural access to water source",
    ],
  },

  // 2. Cadmium (Cd)
  {
    metal: "Cadmium",
    symbol: "Cd",
    severityLevel: "Moderate",
    treatmentMethods: [
      "Lime Softening Chemical Precipitation",
      "Reverse Osmosis (RO) Membrane Filtration",
      "Coagulation with Ferric Sulfate",
    ],
    reusePossibilities: [
      "Non-food crop agricultural irrigation",
      "Dust suppression at industrial sites",
    ],
    recyclingPossibilities: [
      "Electro-coagulation rinse recycling",
      "Sludge incineration with ash recovery",
    ],
    environmentalPrecautions: [
      "Monitor shallow aquifer wells within 1 km radius",
      "Restrict animal grazing along drainage boundaries",
    ],
    publicHealthWarnings: [
      "Cadmium exceeds permissible limit (0.003 mg/L)",
      "Long-term ingestion causes renal dysfunction and bone density loss",
    ],
  },
  {
    metal: "Cadmium",
    symbol: "Cd",
    severityLevel: "Severe",
    treatmentMethods: [
      "Dual-Pass High-Pressure Reverse Osmosis (RO)",
      "Sulfide Precipitation with Flocculation",
      "Nanofiltration polishing",
    ],
    reusePossibilities: [
      "No agricultural or open-air reuse allowed until full purification",
    ],
    recyclingPossibilities: [
      "Concentrated brine crystallization & hazardous recovery",
    ],
    environmentalPrecautions: [
      "Implement emergency containment dykes to halt stream spread",
      "Notify environmental protection authority immediately",
    ],
    publicHealthWarnings: [
      "CARCINOGENIC RISK ALERT: Cadmium is a Class-1 human carcinogen",
      "Immediate shut-off of public supply intakes in affected zone",
    ],
  },

  // 3. Chromium (Cr)
  {
    metal: "Chromium",
    symbol: "Cr",
    severityLevel: "Moderate",
    treatmentMethods: [
      "Chemical Reduction (Hexavalent Cr6+ to Trivalent Cr3+) using Ferrous Sulfate",
      "Alkaline Hydroxide Precipitation at pH 8.5–9.5",
      "Ion Exchange Resin Purification",
    ],
    reusePossibilities: [
      "Industrial wash water in tanneries and plating plants",
      "Construction concrete mixing",
    ],
    recyclingPossibilities: [
      "Chromium hydroxide sludge reprocessing",
      "Closed-loop plating bath recycling",
    ],
    environmentalPrecautions: [
      "Audit industrial effluent discharges across local industrial zone",
      "Conduct redox potential monitoring in surface stream",
    ],
    publicHealthWarnings: [
      "Chromium exceeds WHO threshold (0.05 mg/L)",
      "Avoid direct skin contact; causes allergic dermatitis and ulceration",
    ],
  },

  // 4. Arsenic (As)
  {
    metal: "Arsenic",
    symbol: "As",
    severityLevel: "Moderate",
    treatmentMethods: [
      "Coagulation/Filtration with Ferric Chloride & Alum",
      "Activated Alumina Adsorption Columns",
      "Iron-coated Sand Filtration",
    ],
    reusePossibilities: [
      "Industrial process heating boilers",
      "Non-potable municipal sanitation flushing",
    ],
    recyclingPossibilities: [
      "Arsenic-iron coprecipitate stabilization in concrete matrices",
    ],
    environmentalPrecautions: [
      "Test surrounding borewell drinking sources",
      "Deploy Community Arsenic Removal Plants (CARPs)",
    ],
    publicHealthWarnings: [
      "Arsenic exceeds permissible limit (0.01 mg/L)",
      "Risk of chronic arsenicosis, skin pigmentation, and internal organ toxicity",
    ],
  },

  // 5. Mercury (Hg)
  {
    metal: "Mercury",
    symbol: "Hg",
    severityLevel: "Severe",
    treatmentMethods: [
      "Sulfur-Impregnated Granular Activated Carbon Adsorption",
      "Sulfide Precipitation with Polymer Flocculation",
      "Membrane Bioreactors",
    ],
    reusePossibilities: [
      "No reuse permitted under environmental compliance guidelines",
    ],
    recyclingPossibilities: [
      "Vacuum retort distillation for mercury metal recovery",
    ],
    environmentalPrecautions: [
      "Severe bio-accumulation risk: Issue ban on fishing and aquatic harvesting",
      "Seal all direct surface water intake points",
    ],
    publicHealthWarnings: [
      "CRITICAL MERCURY NEUROTOXICITY ALERT: Severe risk of Minamata disease",
      "Total prohibition on human consumption, fishing, and bathing",
    ],
  },

  // 6. General / Fallback
  {
    metal: "General",
    symbol: "General",
    severityLevel: "Moderate",
    treatmentMethods: [
      "Centralized Effluent Treatment Plant (ETP) operation",
      "Dual Media Sand & Carbon Filtration",
      "Phytoremediation with constructed wetlands",
    ],
    reusePossibilities: [
      "Urban park and greenbelt landscape irrigation",
      "Firefighting reserve water storage",
    ],
    recyclingPossibilities: [
      "Municipal greywater recycling system",
      "Sludge composting for non-agricultural forestry",
    ],
    environmentalPrecautions: [
      "Increase water quality monitoring frequency to bi-weekly",
      "Enforce mandatory industrial discharge pretreatment",
    ],
    publicHealthWarnings: [
      "Water sample exceeds WHO/BIS permissible heavy metal standards",
      "Switch to alternative treated potable water supply",
    ],
  },
];

const seedRecommendationsIfNeeded = async () => {
  try {
    const count = await Recommendation.countDocuments();
    if (count === 0) {
      console.log("Seeding scientific recommendations into MongoDB database...");
      await Recommendation.insertMany(DEFAULT_RECOMMENDATIONS);
    }
  } catch (error) {
    console.error("Error seeding recommendations into MongoDB:", error);
  }
};

module.exports = {
  seedRecommendationsIfNeeded,
  DEFAULT_RECOMMENDATIONS,
};
