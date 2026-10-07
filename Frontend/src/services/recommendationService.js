import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const recommendationService = {
  /**
   * Fetch structured recommendations from MongoDB backend
   */
  async getRecommendations() {
    try {
      const response = await axios.get(`${API_BASE_URL}/recommendations`);
      return response.data;
    } catch (error) {
      console.warn("Backend API unavailable when fetching recommendations:", error.message);
      return { success: false, recommendations: [] };
    }
  },

  /**
   * Match recommendations based on exceeded metals and severity
   */
  async matchRecommendations(exceededMetals = [], overallStatus = "SAFE WATER") {
    try {
      const response = await axios.post(`${API_BASE_URL}/recommendations/match`, {
        exceededMetals,
        overallStatus,
      });
      return response.data;
    } catch (error) {
      console.warn("Backend API error matching recommendations:", error.message);
      throw error;
    }
  },
};

export default recommendationService;
