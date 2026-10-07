import React, { useState, useEffect } from "react";
import assessmentService from "../../services/assessmentService";
import sampleService from "../../services/sampleService";
import reportService from "../../services/reportService";

/**
 * Scientific Assessment Management Page Component (src/pages/assessments/Assessments.jsx)
 * Features:
 * - Integrated PDF Report Download using existing Backend Report Generation API
 * - Disables download if assessment not generated with friendly error messages
 * - Renders loading state ("Preparing PDF...", "Generating Report...")
 * - Automatically triggers browser download after PDF generation
 */
function Assessments() {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  // Modal Dialog States
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Generate Assessment Modal State
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [samplesList, setSamplesList] = useState([]);
  const [selectedSampleId, setSelectedSampleId] = useState("");
  const [generating, setGenerating] = useState(false);

  // Download PDF Loading State map by Assessment ID
  const [downloadingReportId, setDownloadingReportId] = useState(null);

  // Load Assessments from MongoDB
  const loadAssessments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await assessmentService.getAssessments();
      setAssessments(data);
    } catch (err) {
      console.error("Failed to load assessments:", err);
      setError("Failed to connect to database or fetch assessment records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssessments();
  }, []);

  // Load Water Samples for selector
  const handleOpenGenerateModal = async () => {
    try {
      setIsGenerateModalOpen(true);
      const res = await sampleService.getSamples({ limit: 100 });
      setSamplesList(res.samples || []);
      if (res.samples && res.samples.length > 0) {
        setSelectedSampleId(res.samples[0]._id);
      }
    } catch (err) {
      console.error("Failed to load samples for assessment selector:", err);
    }
  };

  const handleRunAssessment = async (e) => {
    e.preventDefault();
    if (!selectedSampleId) return;

    try {
      setGenerating(true);
      const newAssessment = await assessmentService.generateAssessment(selectedSampleId);
      setIsGenerateModalOpen(false);
      await loadAssessments();
      window.dispatchEvent(new Event("assessmentUpdated"));
      window.dispatchEvent(new Event("gisDataRefresh"));
      setSelectedAssessment(newAssessment);
      setIsViewModalOpen(true);
    } catch (err) {
      alert(`Error generating assessment: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  // Handle PDF Report Download Action
  const handleDownloadReport = async (ast) => {
    if (!ast || (!ast._id && !ast.id)) {
      alert("Please generate an assessment before downloading the report.");
      return;
    }

    const targetId = ast._id || ast.id;
    const customCode = ast.customSampleId || "Report";

    try {
      setDownloadingReportId(targetId);
      await reportService.downloadReport(targetId, `Pollution_Assessment_Report_${customCode}.pdf`);
    } catch (err) {
      alert(`⚠️ ${err.message || "Report generation failed. Please try again."}`);
    } finally {
      setDownloadingReportId(null);
    }
  };

  // Filter logic
  const filteredAssessments = assessments.filter((ast) => {
    const customId = ast.customSampleId || ast._id || "";
    const locName = ast.locationName || (ast.sampleId ? ast.sampleId.locationName : "") || "";
    const status = ast.overallStatus || ast.contaminationStatus || "";

    const matchesSearch =
      customId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      locName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      status.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      categoryFilter === "All" ||
      (categoryFilter === "SEVERELY CONTAMINATED WATER" && ast.overallStatus === "SEVERELY CONTAMINATED WATER") ||
      (categoryFilter === "HIGHLY CONTAMINATED WATER" && ast.overallStatus === "HIGHLY CONTAMINATED WATER") ||
      (categoryFilter === "CONTAMINATED WATER" && ast.overallStatus === "CONTAMINATED WATER") ||
      (categoryFilter === "SAFE WATER" && ast.overallStatus === "SAFE WATER");

    return matchesSearch && matchesCategory;
  });

  const getOverallStatusBadge = (status = "") => {
    switch (status) {
      case "SEVERELY CONTAMINATED WATER":
        return { bg: "#7f1d1d", text: "#ffffff", label: "🚨 SEVERELY CONTAMINATED WATER" };
      case "HIGHLY CONTAMINATED WATER":
        return { bg: "#991b1b", text: "#ffffff", label: "⚠️ HIGHLY CONTAMINATED WATER" };
      case "CONTAMINATED WATER":
        return { bg: "#d97706", text: "#ffffff", label: "☣️ CONTAMINATED WATER" };
      case "SAFE WATER":
      default:
        return { bg: "#059669", text: "#ffffff", label: "✅ SAFE WATER" };
    }
  };

  return (
    <div
      style={{
        backgroundColor: "#f8fafc",
        minHeight: "100vh",
        padding: "24px",
        boxSizing: "border-box",
        fontFamily: "system-ui, -apple-system, Roboto, sans-serif",
      }}
    >
      {/* Header Section */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          backgroundColor: "#ffffff",
          borderRadius: "14px",
          padding: "20px 24px",
          marginBottom: "24px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.03)",
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "'Poppins', 'Montserrat', 'Inter', system-ui, -apple-system, sans-serif",
              fontSize: "clamp(18px, 2.2vw, 24px)",
              fontWeight: 600,
              color: "#0f172a",
              margin: "0 0 4px 0",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              letterSpacing: "-0.01em",
              lineHeight: 1.3,
            }}
          >
            <span>📄</span> Water Quality Assessment & PDF Compliance Reports
          </h1>
          <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
            Generate IEEE pollution assessments and download official PDF compliance reports directly from database records.
          </p>
        </div>

        {/* Generate Assessment Button */}
        <button
          onClick={handleOpenGenerateModal}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            backgroundColor: "#2563eb",
            color: "#ffffff",
            padding: "10px 18px",
            borderRadius: "8px",
            fontWeight: "700",
            fontSize: "14px",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(37, 99, 235, 0.25)",
          }}
        >
          <span>⚡</span> Generate Assessment
        </button>
      </div>

      {/* Search & Category Filter Controls */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "20px",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "#ffffff",
          padding: "14px 18px",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
        }}
      >
        {/* Search Input */}
        <div style={{ flex: "1 1 300px", position: "relative" }}>
          <span
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: "14px",
              color: "#94a3b8",
            }}
          >
            🔍
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Sample ID, Location, or Overall Status..."
            style={{
              width: "100%",
              padding: "9px 12px 9px 36px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              outline: "none",
              fontSize: "14px",
              color: "#0f172a",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Filter by Pollution Category */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "13px", fontWeight: "600", color: "#475569" }}>
            Overall Water Status:
          </span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{
              padding: "9px 14px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              outline: "none",
              fontSize: "13px",
              fontWeight: "600",
              color: "#0f172a",
              backgroundColor: "#ffffff",
              cursor: "pointer",
            }}
          >
            <option value="All">All Statuses ({assessments.length})</option>
            <option value="SEVERELY CONTAMINATED WATER">🚨 SEVERELY CONTAMINATED WATER</option>
            <option value="HIGHLY CONTAMINATED WATER">⚠️ HIGHLY CONTAMINATED WATER</option>
            <option value="CONTAMINATED WATER">☣️ CONTAMINATED WATER</option>
            <option value="SAFE WATER">✅ SAFE WATER</option>
          </select>
        </div>
      </div>

      {/* Assessment Table Container */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
          overflowX: "auto",
        }}
      >
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
            🔄 Loading scientific assessment records from MongoDB...
          </div>
        ) : error ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#ef4444" }}>
            ⚠️ {error}
          </div>
        ) : (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left",
              fontSize: "13px",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#f1f5f9", color: "#475569" }}>
                <th style={{ padding: "12px 14px" }}>Sample ID</th>
                <th style={{ padding: "12px 14px" }}>Location Name</th>
                <th style={{ padding: "12px 14px" }}>HPI</th>
                <th style={{ padding: "12px 14px" }}>MI</th>
                <th style={{ padding: "12px 14px" }}>PLI</th>
                <th style={{ padding: "12px 14px" }}>Overall Water Status</th>
                <th style={{ padding: "12px 14px" }}>Exceeded Metals</th>
                <th style={{ padding: "12px 14px" }}>Date</th>
                <th style={{ padding: "12px 14px", textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssessments.length > 0 ? (
                filteredAssessments.map((ast) => {
                  const sampleCode = ast.customSampleId || (ast.sampleId ? ast.sampleId.sampleId : "SMP-N/A");
                  const locName = ast.locationName || (ast.sampleId ? ast.sampleId.locationName : "N/A");
                  const status = ast.overallStatus || "SAFE WATER";
                  const badge = getOverallStatusBadge(status);
                  const exceededCount = ast.exceededMetals ? ast.exceededMetals.length : 0;
                  const formattedDate = ast.generatedAt
                    ? new Date(ast.generatedAt).toISOString().split("T")[0]
                    : "N/A";

                  const isDownloading = downloadingReportId === ast._id;

                  return (
                    <tr
                      key={ast._id}
                      style={{
                        borderBottom: "1px solid #f1f5f9",
                        transition: "background-color 0.15s ease",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = "#f8fafc")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "transparent")
                      }
                    >
                      <td style={{ padding: "14px", fontWeight: "700", color: "#2563eb" }}>
                        {sampleCode}
                      </td>
                      <td style={{ padding: "14px", fontWeight: "600", color: "#0f172a" }}>
                        {locName}
                      </td>
                      <td style={{ padding: "14px", fontWeight: "800", color: ast.hpi > 100 ? "#ef4444" : "#0f172a" }}>
                        {ast.hpi}
                      </td>
                      <td style={{ padding: "14px", fontWeight: "600", color: "#334155" }}>
                        {ast.mi}
                      </td>
                      <td style={{ padding: "14px", fontWeight: "600", color: "#334155" }}>
                        {ast.pli}
                      </td>
                      <td style={{ padding: "14px" }}>
                        <span
                          style={{
                            backgroundColor: badge.bg,
                            color: badge.text,
                            padding: "4px 10px",
                            borderRadius: "12px",
                            fontWeight: "800",
                            fontSize: "11px",
                            display: "inline-block",
                          }}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td style={{ padding: "14px" }}>
                        {exceededCount > 0 ? (
                          <span style={{ color: "#ef4444", fontWeight: "700", fontSize: "12px" }}>
                            ⚠️ {exceededCount} metal{exceededCount > 1 ? "s" : ""}
                          </span>
                        ) : (
                          <span style={{ color: "#10b981", fontWeight: "600", fontSize: "12px" }}>
                            ✓ None
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "14px", color: "#64748b" }}>
                        {formattedDate}
                      </td>
                      <td style={{ padding: "14px", textAlign: "center" }}>
                        <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                          <button
                            onClick={() => {
                              setSelectedAssessment(ast);
                              setIsViewModalOpen(true);
                            }}
                            style={{
                              padding: "6px 10px",
                              borderRadius: "6px",
                              border: "1px solid #cbd5e1",
                              backgroundColor: "#ffffff",
                              color: "#0f172a",
                              fontWeight: "600",
                              cursor: "pointer",
                              fontSize: "12px",
                            }}
                          >
                            👁️ View
                          </button>

                          {/* PDF Report Download Button */}
                          <button
                            disabled={isDownloading}
                            onClick={() => handleDownloadReport(ast)}
                            style={{
                              padding: "6px 12px",
                              borderRadius: "6px",
                              border: "1px solid #16a34a",
                              backgroundColor: isDownloading ? "#f0fdf4" : "#16a34a",
                              color: isDownloading ? "#15803d" : "#ffffff",
                              fontWeight: "700",
                              cursor: isDownloading ? "wait" : "pointer",
                              fontSize: "12px",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <span>📄</span>
                            {isDownloading ? "Preparing PDF..." : "Download PDF"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={9}
                    style={{
                      padding: "32px",
                      textAlign: "center",
                      color: "#94a3b8",
                      fontSize: "14px",
                    }}
                  >
                    No assessment records found. Click "⚡ Generate Assessment" to run assessment and download report.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Generate Assessment Selector Modal */}
      {isGenerateModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "14px",
              padding: "28px",
              width: "100%",
              maxWidth: "540px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            }}
          >
            <h3 style={{ margin: "0 0 12px 0", fontSize: "18px", color: "#0f172a" }}>
              ⚡ Calculate Scientific Assessment
            </h3>
            <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 20px 0" }}>
              Select a Water Sample record from MongoDB to calculate indices, save assessment data, and generate PDF report.
            </p>

            <form onSubmit={handleRunAssessment}>
              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "#334155",
                    marginBottom: "6px",
                  }}
                >
                  Select Water Sample:
                </label>
                <select
                  value={selectedSampleId}
                  onChange={(e) => setSelectedSampleId(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "14px",
                    color: "#0f172a",
                    backgroundColor: "#ffffff",
                    outline: "none",
                  }}
                >
                  {samplesList.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.sampleId || "SMP-ID"} - {s.locationName} ({s.waterSource})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button
                  type="button"
                  onClick={() => setIsGenerateModalOpen(false)}
                  style={{
                    padding: "9px 18px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    backgroundColor: "#ffffff",
                    color: "#475569",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generating || !selectedSampleId}
                  style={{
                    padding: "9px 18px",
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor: "#2563eb",
                    color: "#ffffff",
                    fontWeight: "700",
                    cursor: generating ? "wait" : "pointer",
                  }}
                >
                  {generating ? "Calculating Assessment..." : "Calculate Assessment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Breakdown & Download Report Modal */}
      {isViewModalOpen && selectedAssessment && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "14px",
              padding: "28px",
              width: "100%",
              maxWidth: "780px",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            }}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "18px", color: "#0f172a" }}>
                  📋 Assessment Report ({selectedAssessment.customSampleId || "SMP-ID"})
                </h3>
                <span style={{ fontSize: "13px", color: "#64748b" }}>
                  Location: <strong>{selectedAssessment.locationName}</strong> ({selectedAssessment.waterSource}) | Date: {selectedAssessment.generatedAt ? new Date(selectedAssessment.generatedAt).toISOString().split("T")[0] : "N/A"}
                </span>
              </div>
              <span
                style={{
                  backgroundColor: getOverallStatusBadge(selectedAssessment.overallStatus).bg,
                  color: getOverallStatusBadge(selectedAssessment.overallStatus).text,
                  padding: "6px 14px",
                  borderRadius: "12px",
                  fontWeight: "800",
                  fontSize: "12px",
                }}
              >
                {getOverallStatusBadge(selectedAssessment.overallStatus).label}
              </span>
            </div>

            {/* Pollution Indices Breakdown Table */}
            <h4 style={{ margin: "16px 0 8px 0", fontSize: "14px", color: "#0f172a" }}>
              📊 Pollution Indices & Categories
            </h4>

            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", marginBottom: "20px" }}>
              <thead>
                <tr style={{ backgroundColor: "#f1f5f9", color: "#475569" }}>
                  <th style={{ padding: "8px 12px", textAlign: "left" }}>Index Name</th>
                  <th style={{ padding: "8px 12px", textAlign: "left" }}>Calculated Value</th>
                  <th style={{ padding: "8px 12px", textAlign: "left" }}>Category</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "8px 12px", fontWeight: "700" }}>HPI (Heavy Metal Index)</td>
                  <td style={{ padding: "8px 12px", fontWeight: "800", color: selectedAssessment.hpi > 100 ? "#ef4444" : "#0f172a" }}>{selectedAssessment.hpi}</td>
                  <td style={{ padding: "8px 12px", fontWeight: "700", color: "#2563eb" }}>{selectedAssessment.hpiCategory || "Low Pollution"}</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "8px 12px", fontWeight: "700" }}>MI (Metal Index)</td>
                  <td style={{ padding: "8px 12px", fontWeight: "800", color: "#0f172a" }}>{selectedAssessment.mi}</td>
                  <td style={{ padding: "8px 12px", fontWeight: "700", color: "#2563eb" }}>{selectedAssessment.miCategory || "Pure"}</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "8px 12px", fontWeight: "700" }}>PLI (Pollution Load Index)</td>
                  <td style={{ padding: "8px 12px", fontWeight: "800", color: "#0f172a" }}>{selectedAssessment.pli}</td>
                  <td style={{ padding: "8px 12px", fontWeight: "700", color: "#2563eb" }}>{selectedAssessment.pliCategory || "Unpolluted"}</td>
                </tr>
              </tbody>
            </table>

            {/* Modal Action Footer */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "24px", paddingTop: "16px", borderTop: "1px solid #e2e8f0" }}>
              <button
                disabled={downloadingReportId === selectedAssessment._id}
                onClick={() => handleDownloadReport(selectedAssessment)}
                style={{
                  padding: "10px 20px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: downloadingReportId === selectedAssessment._id ? "#16a34a" : "#16a34a",
                  color: "#ffffff",
                  fontWeight: "700",
                  cursor: downloadingReportId === selectedAssessment._id ? "wait" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: "0 4px 12px rgba(22, 163, 74, 0.3)",
                }}
              >
                <span>📄</span>
                {downloadingReportId === selectedAssessment._id ? "Generating PDF Report..." : "Download PDF Report"}
              </button>

              <button
                onClick={() => setIsViewModalOpen(false)}
                style={{
                  padding: "9px 20px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  backgroundColor: "#ffffff",
                  color: "#334155",
                  fontWeight: "700",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Assessments;
