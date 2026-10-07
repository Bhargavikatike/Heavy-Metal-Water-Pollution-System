const API_BASE_URL = "http://localhost:5000/api";

export const assessmentService = {
  /**
   * Fetch all pollution assessments from MongoDB
   */
  async getAssessments() {
    try {
      const response = await fetch(`${API_BASE_URL}/assessments`);
      if (!response.ok) {
        throw new Error("Failed to fetch assessments");
      }
      const result = await response.json();
      return result.assessments || [];
    } catch (error) {
      console.error("assessmentService.getAssessments error:", error);
      throw error;
    }
  },

  /**
   * Fetch a single assessment by ID
   */
  async getAssessmentById(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/assessments/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch assessment details");
      }
      const result = await response.json();
      return result.assessment;
    } catch (error) {
      console.error("assessmentService.getAssessmentById error:", error);
      throw error;
    }
  },

  /**
   * Trigger calculation of a scientific assessment for a given Water Sample ID
   */
  async generateAssessment(sampleId) {
    try {
      const response = await fetch(`${API_BASE_URL}/assessments/generate/${sampleId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to generate assessment");
      }
      const result = await response.json();
      return result.assessment;
    } catch (error) {
      console.error("assessmentService.generateAssessment error:", error);
      throw error;
    }
  },

  /**
   * Delete an assessment
   */
  async deleteAssessment(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/assessments/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete assessment");
      }
      return await response.json();
    } catch (error) {
      console.error("assessmentService.deleteAssessment error:", error);
      throw error;
    }
  },

  /**
   * Fetch metal standards from MongoDB
   */
  async getStandards() {
    try {
      const response = await fetch(`${API_BASE_URL}/standards`);
      if (!response.ok) {
        throw new Error("Failed to fetch metal standards");
      }
      const result = await response.json();
      return result.standards || [];
    } catch (error) {
      console.error("assessmentService.getStandards error:", error);
      throw error;
    }
  },
};

export default assessmentService;
