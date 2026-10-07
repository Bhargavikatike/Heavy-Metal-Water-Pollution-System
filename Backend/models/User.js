const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },

        email: {
            type: String,
            required: true,
            unique: true
        },

        password: {
            type: String,
            required: false
        },

        phone: {
            type: String,
            default: ""
        },

        institution: {
            type: String,
            default: "Water Pollution Research Center"
        },

        organization: {
            type: String,
            default: "Water Pollution Research Center"
        },

        avatar: {
            type: String,
            default: ""
        },

        avatarUrl: {
            type: String,
            default: ""
        },

        district: {
            type: String,
            default: ""
        },

        role: {
            type: String,
            enum: ["admin", "researcher", "Administrator", "Researcher", "Environmental Officer"],
            default: "researcher"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("User", userSchema);