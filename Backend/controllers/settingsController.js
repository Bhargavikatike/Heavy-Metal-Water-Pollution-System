const UserSettings = require("../models/UserSettings");
const User = require("../models/User");
const bcrypt = require("bcryptjs");

// Get User Settings from MongoDB
const getUserSettings = async (req, res) => {
  try {
    const { email } = req.query;
    const targetEmail = (email || "bhargavi@example.com").toLowerCase().trim();

    let settings = await UserSettings.findOne({ userEmail: targetEmail });

    if (!settings) {
      settings = await UserSettings.create({
        userEmail: targetEmail,
        notifications: {
          emailAlerts: true,
          highPollutionAlerts: true,
          soundNotifications: true,
          weeklyDigest: false,
        },
        theme: {
          mode: "light",
          compactMode: false,
          mapStyle: "satellite",
        },
      });
    }

    res.status(200).json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching user settings",
    });
  }
};

// Update User Settings in MongoDB
const updateUserSettings = async (req, res) => {
  try {
    const { email, notifications, theme } = req.body;
    const targetEmail = (email || "bhargavi@example.com").toLowerCase().trim();

    let settings = await UserSettings.findOne({ userEmail: targetEmail });

    if (settings) {
      if (notifications) settings.notifications = { ...settings.notifications, ...notifications };
      if (theme) settings.theme = { ...settings.theme, ...theme };
      await settings.save();
    } else {
      settings = await UserSettings.create({
        userEmail: targetEmail,
        notifications: notifications || {},
        theme: theme || {},
      });
    }

    res.status(200).json({
      success: true,
      message: "Settings saved successfully to MongoDB",
      settings,
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update settings in MongoDB",
    });
  }
};

// Change Password in MongoDB
const changePassword = async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body;
    const targetEmail = (email || "bhargavi@example.com").toLowerCase().trim();

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long",
      });
    }

    const user = await User.findOne({ email: targetEmail });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User account not found in database",
      });
    }

    // If user has existing password, compare it
    if (user.password) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: "Current password is incorrect",
        });
      }
    }

    // Hash new password and save
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password updated successfully in MongoDB",
    });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({
      success: false,
      message: "Server error while changing password",
    });
  }
};

module.exports = {
  getUserSettings,
  updateUserSettings,
  changePassword,
};
