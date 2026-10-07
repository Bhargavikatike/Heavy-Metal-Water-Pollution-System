import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const sampleService = {
  /**
   * Fetch water samples directly from MongoDB
   * Supports search, risk level filter, water source filter, and pagination
   */
  async getSamples(params = {}) {
    const { search = "", riskLevel = "All", waterSource = "All", page = 1, limit = 50 } = params;

    try {
      const response = await axios.get(`${API_BASE_URL}/samples`, {
        params: {
          search,
          riskLevel,
          waterSource,
          page,
          limit,
        },
      });
      return response.data;
    } catch (error) {
      console.warn("Backend API unavailable when fetching samples:", error.message);
      throw error;
    }
  },

  /**
   * Manual Entry - Add a single water sample to MongoDB
   */
  async addSample(sampleData) {
    try {
      const token = localStorage.getItem("token");
      const config = token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : {};

      const response = await axios.post(`${API_BASE_URL}/samples/add`, sampleData, config);
      return response.data;
    } catch (error) {
      console.error("Error creating sample in MongoDB:", error);
      throw new Error(
        error.response?.data?.message || "Failed to save sample to MongoDB"
      );
    }
  },

  /**
   * File Upload - Upload CSV/Excel file to bulk store records into MongoDB
   */
  async uploadSamplesFile(file) {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const token = localStorage.getItem("token");
      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      };

      const response = await axios.post(`${API_BASE_URL}/samples/upload`, formData, config);
      return response.data;
    } catch (error) {
      console.error("Error uploading samples file to MongoDB:", error);
      throw new Error(
        error.response?.data?.message || "Failed to process sample file upload"
      );
    }
  },

  /**
   * Update an existing water sample in MongoDB
   */
  async updateSample(id, sampleData) {
    try {
      const response = await axios.put(`${API_BASE_URL}/samples/${id}`, sampleData);
      return response.data;
    } catch (error) {
      console.error("Error updating sample in MongoDB:", error);
      throw new Error(
        error.response?.data?.message || "Failed to update sample in MongoDB"
      );
    }
  },

  /**
   * Delete a water sample from MongoDB
   */
  async deleteSample(id) {
    try {
      const response = await axios.delete(`${API_BASE_URL}/samples/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting sample from MongoDB:", error);
      throw new Error(
        error.response?.data?.message || "Failed to delete sample from MongoDB"
      );
    }
  },
};

export default sampleService;
