const mongoose = require("mongoose");

const userSettingsSchema = new mongoose.Schema(
  {
    userEmail: {
      type: String,
      required: true,
      unique: true,
    },
    notifications: {
      emailAlerts: { type: Boolean, default: true },
      highPollutionAlerts: { type: Boolean, default: true },
      soundNotifications: { type: Boolean, default: true },
      weeklyDigest: { type: Boolean, default: false },
    },
    theme: {
      mode: { type: String, enum: ["light", "dark", "system"], default: "light" },
      compactMode: { type: Boolean, default: false },
      mapStyle: { type: String, default: "satellite" },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("UserSettings", userSettingsSchema);
