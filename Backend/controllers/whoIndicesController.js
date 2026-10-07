const WhoIndicesValue =
require("../models/WhoIndicesValue");

const seedIndicesValues =
async (req, res) => {

  try {

    await WhoIndicesValue.deleteMany();

    await WhoIndicesValue.insertMany([
      {
        indexName: "HPI",
        ranges: [
          {
            label: "Safe",
            min: 0,
            max: 100,
          },
          {
            label: "Unsafe",
            min: 100,
            max: null,
          },
        ],
      },

      {
        indexName: "MI",
        ranges: [
          {
            label: "Very Pure",
            min: 0,
            max: 0.3,
          },
          {
            label: "Pure",
            min: 0.3,
            max: 1,
          },
          {
            label: "Slightly Affected",
            min: 1,
            max: 2,
          },
          {
            label: "Moderately Affected",
            min: 2,
            max: 4,
          },
          {
            label: "Strongly Affected",
            min: 4,
            max: 6,
          },
          {
            label: "Seriously Affected",
            min: 6,
            max: null,
          },
        ],
      },

      {
        indexName: "CF",
        ranges: [
          {
            label: "Low Contamination",
            min: 0,
            max: 1,
          },
          {
            label: "Moderate Contamination",
            min: 1,
            max: 3,
          },
          {
            label: "Considerable Contamination",
            min: 3,
            max: 6,
          },
          {
            label: "Very High Contamination",
            min: 6,
            max: null,
          },
        ],
      },

      {
        indexName: "PLI",
        ranges: [
          {
            label: "No Pollution",
            min: 0,
            max: 1,
          },
          {
            label: "Polluted",
            min: 1,
            max: null,
          },
        ],
      },

      {
        indexName: "IGEO",
        ranges: [
          {
            label: "Unpolluted",
            min: -999,
            max: 0,
          },
          {
            label:
              "Unpolluted to Moderately Polluted",
            min: 0,
            max: 1,
          },
          {
            label:
              "Moderately Polluted",
            min: 1,
            max: 2,
          },
          {
            label:
              "Moderately to Heavily Polluted",
            min: 2,
            max: 3,
          },
          {
            label:
              "Heavily Polluted",
            min: 3,
            max: 4,
          },
          {
            label:
              "Heavily to Extremely Polluted",
            min: 4,
            max: 5,
          },
          {
            label:
              "Extremely Polluted",
            min: 5,
            max: null,
          },
        ],
      },
    ]);

    res.status(200).json({
      success: true,
      message:
        "WHO Indices Values Seeded Successfully",
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });

  }
};

module.exports = {
  seedIndicesValues,
};