const API_BASE_URL = "http://localhost:5000/api";

export const standardsService = {
  /**
   * Fetch all Metal Standards directly from MongoDB
   */
  async getMetalStandards() {
    try {
      const response = await fetch(`${API_BASE_URL}/standards/metals`);
      if (!response.ok) {
        throw new Error("Failed to fetch metal standards from database");
      }
      const result = await response.json();
      return result.standards || [];
    } catch (error) {
      console.error("standardsService.getMetalStandards error:", error);
      throw error;
    }
  },

  /**
   * Create a new Metal Standard in MongoDB
   */
  async createMetalStandard(standardData) {
    try {
      const response = await fetch(`${API_BASE_URL}/standards/metals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(standardData),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Failed to create metal standard");
      }
      return await response.json();
    } catch (error) {
      console.error("standardsService.createMetalStandard error:", error);
      throw error;
    }
  },

  /**
   * Update an existing Metal Standard in MongoDB
   */
  async updateMetalStandard(id, updatedData) {
    try {
      const response = await fetch(`${API_BASE_URL}/standards/metals/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedData),
      });
      if (!response.ok) {
        throw new Error("Failed to update metal standard in database");
      }
      return await response.json();
    } catch (error) {
      console.error("standardsService.updateMetalStandard error:", error);
      throw error;
    }
  },

  /**
   * Delete a Metal Standard from MongoDB
   */
  async deleteMetalStandard(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/standards/metals/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete metal standard");
      }
      return await response.json();
    } catch (error) {
      console.error("standardsService.deleteMetalStandard error:", error);
      throw error;
    }
  },

  /**
   * Fetch all Pollution Index Thresholds directly from MongoDB
   */
  async getIndexThresholds() {
    try {
      const response = await fetch(`${API_BASE_URL}/standards/thresholds`);
      if (!response.ok) {
        throw new Error("Failed to fetch index thresholds from database");
      }
      const result = await response.json();
      return result.thresholds || [];
    } catch (error) {
      console.error("standardsService.getIndexThresholds error:", error);
      throw error;
    }
  },

  /**
   * Update Pollution Index Threshold in MongoDB
   */
  async updateIndexThreshold(id, thresholdData) {
    try {
      const response = await fetch(`${API_BASE_URL}/standards/thresholds/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(thresholdData),
      });
      if (!response.ok) {
        throw new Error("Failed to update index threshold in database");
      }
      return await response.json();
    } catch (error) {
      console.error("standardsService.updateIndexThreshold error:", error);
      throw error;
    }
  },
};

export default standardsService;
