const mongoose = require("mongoose");

const whoStandardSchema = new mongoose.Schema(
{
    metal: {
        type: String,
        required: true,
        unique: true
    },

    permissibleLimit: {
        type: Number,
        required: true
    },

    unit: {
        type: String,
        default: "mg/L"
    }
},
{
    timestamps: true
}
);

module.exports = mongoose.model(
    "WHOStandard",
    whoStandardSchema
);