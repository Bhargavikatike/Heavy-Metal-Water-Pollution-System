import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const dashboardService = {
  /**
   * Fetch real dashboard summary statistics from MongoDB
   */
  async getDashboardStats() {
    try {
      const response = await axios.get(`${API_BASE_URL}/dashboard/stats`);
      return response.data?.data || response.data;
    } catch (error) {
      console.warn("Backend API unavailable for dashboard stats:", error.message);
      throw error;
    }
  },

  /**
   * Fetch recent assessments directly from MongoDB
   */
  async getRecentAssessments() {
    try {
      const response = await axios.get(`${API_BASE_URL}/dashboard/recent-assessments`);
      return response.data?.data || [];
    } catch (error) {
      console.warn("Backend API unavailable for recent assessments:", error.message);
      return [];
    }
  },

  /**
   * Fetch top polluted locations directly from MongoDB
   */
  async getTopPollutedLocations() {
    try {
      const response = await axios.get(`${API_BASE_URL}/dashboard/top-polluted`);
      return response.data?.data || [];
    } catch (error) {
      console.warn("Backend API unavailable for top polluted locations:", error.message);
      return [];
    }
  },
};

export default dashboardService;
