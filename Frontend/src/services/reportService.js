const API_BASE_URL = "http://localhost:5000/api";

export const reportService = {
  /**
   * Download PDF Report for an Assessment ID
   * @param {String} assessmentId - MongoDB ObjectId of the assessment
   * @param {String} filename - Optional custom filename for saving
   */
  async downloadReport(assessmentId, filename = "Water_Pollution_Report.pdf") {
    if (!assessmentId) {
      throw new Error("Please generate an assessment before downloading the report.");
    }

    try {
      const response = await fetch(`${API_BASE_URL}/reports/${assessmentId}`, {
        method: "GET",
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Assessment data not found in database. Please generate an assessment first.");
        }
        const errorText = await response.text();
        let message = "Report generation failed.";
        try {
          const parsed = JSON.parse(errorText);
          if (parsed.message) message = parsed.message;
        } catch (e) {
          // Fallback to text
        }
        throw new Error(message);
      }

      // Read PDF binary blob
      const blob = await response.blob();
      if (!blob || blob.size === 0) {
        throw new Error("Generated PDF report was empty. Please check server logs.");
      }

      // Trigger automatic browser download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();

      // Clean up link & object URL
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("reportService.downloadReport error:", error);
      throw error;
    }
  },
};

export default reportService;
