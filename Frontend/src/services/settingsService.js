import axios from "axios";
import authService from "./authService";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const settingsService = {
  /**
   * Fetch user settings from MongoDB
   */
  async getSettings(email) {
    try {
      const userEmail = email || authService.getCurrentUser()?.email || "bhargavi@example.com";
      const response = await axios.get(`${API_BASE_URL}/settings`, {
        params: { email: userEmail },
      });
      if (response.data && response.data.success && response.data.settings) {
        return response.data.settings;
      }
    } catch (error) {
      console.warn("Could not load settings from MongoDB backend:", error.message);
    }
    // Default fallback settings
    return {
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
    };
  },

  /**
   * Update user settings in MongoDB
   */
  async updateSettings(settingsData) {
    const userEmail = authService.getCurrentUser()?.email || "bhargavi@example.com";
    const payload = {
      email: userEmail,
      notifications: settingsData.notifications,
      theme: settingsData.theme,
    };

    try {
      const response = await axios.put(`${API_BASE_URL}/settings`, payload);
      if (response.data && response.data.success) {
        return response.data.settings;
      }
    } catch (error) {
      console.warn("Failed to update settings in MongoDB backend:", error.message);
    }
    return settingsData;
  },

  /**
   * Change Password in MongoDB
   */
  async changePassword(passwordData) {
    const userEmail = authService.getCurrentUser()?.email || "bhargavi@example.com";
    const payload = {
      email: userEmail,
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    };

    const response = await axios.post(`${API_BASE_URL}/settings/change-password`, payload);
    return response.data;
  },
};

export default settingsService;
