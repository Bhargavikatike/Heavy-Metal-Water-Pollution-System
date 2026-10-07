import React, { useState, useEffect } from "react";
import authService from "../../services/authService";
import sampleService from "../../services/sampleService";
import assessmentService from "../../services/assessmentService";

/**
 * Water Sample Management Page Component (src/pages/samples/Samples.jsx)
 * Fully integrated with MongoDB database backend.
 * Features:
 * - 100% Real Database Records (No Mock Data)
 * - Manual Water Sample Entry with Heavy Metal Parameters
 * - Bulk File Upload (.csv, .xlsx, .xls) with row validation & error reporting
 * - MongoDB-powered Search, Risk Filter & Water Source Filter
 * - Pagination Controls
 * - View Details, Edit Sample, & Delete Confirmation Modals
 */
function Samples() {
  const currentUserName = authService.getCurrentUser()?.name || "Researcher";

  // Data & Loading States
  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalSamples, setTotalSamples] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [apiError, setApiError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Search & Filter Controls
  const [searchTerm, setSearchTerm] = useState("");
  const [riskFilter, setRiskFilter] = useState("All");
  const [waterSourceFilter, setWaterSourceFilter] = useState("All");

  // Modal Dialog States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedSample, setSelectedSample] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // File Upload State
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  // Manual Entry Form State
  const [newSample, setNewSample] = useState({
    name: "",
    location: "Telangana",
    waterSource: "Urban Lake",
    collector: currentUserName,
    date: new Date().toISOString().split("T")[0],
    pb: 0.05,
    cd: 0.003,
    cr: 0.04,
    as: 0.01,
    hg: 0.002,
    ni: 0.05,
    cu: 0.1,
    zn: 0.2,
    fe: 0.3,
  });

  // Fetch samples from MongoDB database
  const fetchSamplesFromDB = async () => {
    setLoading(true);
    setApiError("");
    try {
      const data = await sampleService.getSamples({
        search: searchTerm,
        riskLevel: riskFilter,
        waterSource: waterSourceFilter,
        page: currentPage,
        limit: 15,
      });

      setSamples(data.samples || []);
      setTotalSamples(data.totalSamples || 0);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error("Failed to load samples from MongoDB:", error);
      setApiError(
        "Could not load samples from MongoDB. Please check if the backend server is running."
      );
      setSamples([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSamplesFromDB();
  }, [searchTerm, riskFilter, waterSourceFilter, currentPage]);

  // Handle Manual Add Sample Form Submit
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!newSample.name.trim()) {
      alert("Please fill out Sample / Location Name");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        locationName: newSample.name,
        district: newSample.location,
        waterSource: newSample.waterSource,
        collector: newSample.collector || currentUserName,
        collectionDate: newSample.date,
        pb: Number(newSample.pb) || 0,
        cd: Number(newSample.cd) || 0,
        cr: Number(newSample.cr) || 0,
        as: Number(newSample.as) || 0,
        hg: Number(newSample.hg) || 0,
        ni: Number(newSample.ni) || 0,
        cu: Number(newSample.cu) || 0,
        zn: Number(newSample.zn) || 0,
        fe: Number(newSample.fe) || 0,
      };

      const result = await sampleService.addSample(payload);
      setIsAddModalOpen(false);
      setSuccessMsg(`Sample ${result.sample?.sampleId || ""} saved successfully to MongoDB!`);
      setTimeout(() => setSuccessMsg(""), 4000);

      // Reset form & reload database list
      setNewSample({
        name: "",
        location: "Telangana",
        waterSource: "Urban Lake",
        collector: currentUserName,
        date: new Date().toISOString().split("T")[0],
        pb: 0.05,
        cd: 0.003,
        cr: 0.04,
        as: 0.01,
        hg: 0.002,
        ni: 0.05,
        cu: 0.1,
        zn: 0.2,
        fe: 0.3,
      });

      fetchSamplesFromDB();
      window.dispatchEvent(new Event("samplesUpdated"));
      window.dispatchEvent(new Event("gisDataRefresh"));
    } catch (err) {
      alert(err.message || "Error saving water sample to MongoDB");
    } finally {
      setLoading(false);
    }
  };

  // Handle Bulk File Upload Submit
  const handleFileUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      alert("Please select a CSV or Excel file to upload");
      return;
    }

    setUploading(true);
    setUploadResult(null);

    try {
      const result = await sampleService.uploadSamplesFile(selectedFile);
      setUploadResult(result);
      setSuccessMsg(result.message || "File imported successfully into MongoDB!");
      setTimeout(() => setSuccessMsg(""), 5000);
      fetchSamplesFromDB();
      window.dispatchEvent(new Event("samplesUpdated"));
      window.dispatchEvent(new Event("gisDataRefresh"));
    } catch (err) {
      setUploadResult({
        success: false,
        error: err.message || "Failed to process file upload",
      });
    } finally {
      setUploading(false);
    }
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSample) return;

    try {
      await sampleService.updateSample(selectedSample._id, selectedSample);
      setIsEditModalOpen(false);
      setSuccessMsg("Sample record updated in MongoDB");
      setTimeout(() => setSuccessMsg(""), 3000);
      fetchSamplesFromDB();
      window.dispatchEvent(new Event("samplesUpdated"));
      window.dispatchEvent(new Event("gisDataRefresh"));
    } catch (err) {
      alert(err.message || "Failed to update sample");
    }
  };

  // Handle Delete Action
  const handleDelete = async (sample) => {
    const idStr = sample.sampleId || sample.locationName;
    if (window.confirm(`Are you sure you want to delete sample "${idStr}" from MongoDB?`)) {
      try {
        await sampleService.deleteSample(sample._id);
        setSuccessMsg(`Sample ${idStr} removed from database`);
        setTimeout(() => setSuccessMsg(""), 3000);
        fetchSamplesFromDB();
        window.dispatchEvent(new Event("samplesUpdated"));
        window.dispatchEvent(new Event("gisDataRefresh"));
      } catch (err) {
        alert(err.message || "Failed to delete sample record");
      }
    }
  };

  const getRiskBadge = (level) => {
    switch (level) {
      case "High":
      case "Critical":
        return { bg: "#fee2e2", text: "#991b1b" };
      case "Medium":
      case "Moderate":
        return { bg: "#ffedd5", text: "#9a3412" };
      default:
        return { bg: "#dcfce7", text: "#166534" };
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
          marginBottom: "20px",
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
            <span>🧪</span> Water Sample Management
          </h1>
          <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
            Log, upload, and track real heavy metal water pollution laboratory samples.
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* CSV/Excel File Upload Button */}
          <button
            onClick={() => {
              setSelectedFile(null);
              setUploadResult(null);
              setIsUploadModalOpen(true);
            }}
            style={{
              padding: "10px 16px",
              borderRadius: "8px",
              border: "1px solid #0284c7",
              backgroundColor: "#f0f9ff",
              color: "#0284c7",
              fontSize: "14px",
              fontWeight: "700",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>📄</span> Bulk File Upload (CSV/Excel)
          </button>

          {/* Add Sample Button */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            style={{
              padding: "10px 18px",
              borderRadius: "8px",
              border: "none",
              backgroundColor: "#059669",
              color: "#ffffff",
              fontSize: "14px",
              fontWeight: "700",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 4px 12px rgba(5, 150, 105, 0.3)",
            }}
          >
            <span>➕</span> Add Water Sample
          </button>
        </div>
      </div>

      {/* Success Banner */}
      {successMsg && (
        <div
          style={{
            backgroundColor: "#f0fdf4",
            border: "1px solid #86efac",
            color: "#166534",
            padding: "12px 18px",
            borderRadius: "10px",
            marginBottom: "20px",
            fontWeight: "600",
            fontSize: "14px",
          }}
        >
          ✅ {successMsg}
        </div>
      )}

      {/* Error Banner */}
      {apiError && (
        <div
          style={{
            backgroundColor: "#fef2f2",
            border: "1px solid #fca5a5",
            color: "#991b1b",
            padding: "12px 18px",
            borderRadius: "10px",
            marginBottom: "20px",
            fontWeight: "600",
            fontSize: "14px",
          }}
        >
          ⚠️ {apiError}
        </div>
      )}

      {/* Search & Filter Controls Bar */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "14px",
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
        <div style={{ flex: "1 1 280px", position: "relative" }}>
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
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by Sample ID, Location, Water Source, or Collector..."
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

        {/* Filter dropdowns */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "12px" }}>
          {/* Filter by Water Source */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "13px", fontWeight: "600", color: "#475569" }}>Source:</span>
            <select
              value={waterSourceFilter}
              onChange={(e) => {
                setWaterSourceFilter(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                outline: "none",
                fontSize: "13px",
                fontWeight: "600",
                color: "#0f172a",
                backgroundColor: "#ffffff",
              }}
            >
              <option value="All">All Sources</option>
              <option value="Urban Lake">Urban Lake</option>
              <option value="Industrial Drain">Industrial Drain</option>
              <option value="Reservoir">Reservoir</option>
              <option value="Effluent Channel">Effluent Channel</option>
              <option value="Freshwater Lake">Freshwater Lake</option>
            </select>
          </div>

          {/* Filter by Risk Level */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "13px", fontWeight: "600", color: "#475569" }}>Risk:</span>
            <select
              value={riskFilter}
              onChange={(e) => {
                setRiskFilter(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                outline: "none",
                fontSize: "13px",
                fontWeight: "600",
                color: "#0f172a",
                backgroundColor: "#ffffff",
              }}
            >
              <option value="All">All Risks</option>
              <option value="High">🔴 High Risk</option>
              <option value="Medium">🟠 Medium Risk</option>
              <option value="Low">🟢 Low Risk</option>
            </select>
          </div>

          {/* Refresh Database Button */}
          <button
            onClick={fetchSamplesFromDB}
            style={{
              padding: "8px 12px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              backgroundColor: "#f8fafc",
              color: "#334155",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Samples Table */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
          overflowX: "auto",
        }}
      >
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
              <th style={{ padding: "12px 16px" }}>Sample ID</th>
              <th style={{ padding: "12px 16px" }}>Sample / Location Name</th>
              <th style={{ padding: "12px 16px" }}>District</th>
              <th style={{ padding: "12px 16px" }}>Water Source</th>
              <th style={{ padding: "12px 16px" }}>Date</th>
              <th style={{ padding: "12px 16px" }}>Collector</th>
              <th style={{ padding: "12px 16px" }}>Risk Level</th>
              <th style={{ padding: "12px 16px", textAlign: "center" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ padding: "32px", textAlign: "center", color: "#64748b" }}>
                  ⏳ Loading database records from MongoDB...
                </td>
              </tr>
            ) : samples.length > 0 ? (
              samples.map((sample) => {
                const riskStyle = getRiskBadge(sample.riskLevel || "Medium");
                const formattedDate = sample.collectionDate
                  ? new Date(sample.collectionDate).toISOString().split("T")[0]
                  : sample.date || "N/A";

                return (
                  <tr
                    key={sample._id || sample.sampleId}
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
                    <td style={{ padding: "14px 16px", fontWeight: "700", color: "#0284c7" }}>
                      {sample.sampleId || "SMP-000"}
                    </td>
                    <td style={{ padding: "14px 16px", fontWeight: "600", color: "#0f172a" }}>
                      {sample.locationName || sample.name}
                    </td>
                    <td style={{ padding: "14px 16px", color: "#475569" }}>
                      {sample.district || sample.location || "Telangana"}
                    </td>
                    <td style={{ padding: "14px 16px", color: "#475569" }}>
                      {sample.waterSource || "Urban Lake"}
                    </td>
                    <td style={{ padding: "14px 16px", color: "#64748b" }}>
                      {formattedDate}
                    </td>
                    <td style={{ padding: "14px 16px", color: "#475569" }}>
                      {sample.collector || "Researcher"}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span
                        style={{
                          backgroundColor: riskStyle.bg,
                          color: riskStyle.text,
                          padding: "4px 10px",
                          borderRadius: "12px",
                          fontWeight: "700",
                          fontSize: "11px",
                        }}
                      >
                        {sample.riskLevel || "Medium"}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "center" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                        }}
                      >
                        {/* Run Assessment Button */}
                        <button
                          onClick={async () => {
                            try {
                              setLoading(true);
                              const res = await assessmentService.generateAssessment(sample._id);
                              alert(
                                `⚡ Scientific Assessment Generated!\n\nSample ID: ${sample.sampleId || sample.locationName}\nHPI: ${res.hpi}\nMI: ${res.mi}\nPLI: ${res.pli}\nContamination Status: ${res.contaminationStatus}\nExceeded Metals: ${res.exceededMetals?.length || 0}\n\nView complete details under Assessments page.`
                              );
                              fetchSamplesFromDB();
                            } catch (err) {
                              alert(`Failed to generate assessment: ${err.message}`);
                            } finally {
                              setLoading(false);
                            }
                          }}
                          title="Generate Scientific Assessment"
                          style={{
                            padding: "5px 9px",
                            borderRadius: "6px",
                            border: "1px solid #3b82f6",
                            backgroundColor: "#eff6ff",
                            color: "#1d4ed8",
                            fontWeight: "700",
                            cursor: "pointer",
                          }}
                        >
                          ⚡
                        </button>

                        {/* View Button */}
                        <button
                          onClick={() => {
                            setSelectedSample(sample);
                            setIsViewModalOpen(true);
                          }}
                          title="View Details"
                          style={{
                            padding: "5px 9px",
                            borderRadius: "6px",
                            border: "1px solid #cbd5e1",
                            backgroundColor: "#ffffff",
                            cursor: "pointer",
                          }}
                        >
                          👁️
                        </button>

                        {/* Edit Button */}
                        <button
                          onClick={() => {
                            setSelectedSample(sample);
                            setIsEditModalOpen(true);
                          }}
                          title="Edit Sample"
                          style={{
                            padding: "5px 9px",
                            borderRadius: "6px",
                            border: "1px solid #cbd5e1",
                            backgroundColor: "#ffffff",
                            cursor: "pointer",
                          }}
                        >
                          ✏️
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDelete(sample)}
                          title="Delete Sample"
                          style={{
                            padding: "5px 9px",
                            borderRadius: "6px",
                            border: "1px solid #fca5a5",
                            backgroundColor: "#fef2f2",
                            color: "#ef4444",
                            cursor: "pointer",
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={8}
                  style={{
                    padding: "40px",
                    textAlign: "center",
                    color: "#94a3b8",
                    fontSize: "14px",
                  }}
                >
                  No water sample records found in MongoDB matching criteria. Click <strong>Add Water Sample</strong> or <strong>Bulk File Upload</strong> to insert records.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 20px",
              borderTop: "1px solid #e2e8f0",
              backgroundColor: "#f8fafc",
            }}
          >
            <span style={{ fontSize: "13px", color: "#64748b" }}>
              Showing {samples.length} of {totalSamples} MongoDB records (Page {currentPage} of {totalPages})
            </span>

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                style={{
                  padding: "6px 14px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  backgroundColor: currentPage === 1 ? "#f1f5f9" : "#ffffff",
                  cursor: currentPage === 1 ? "not-allowed" : "pointer",
                  fontSize: "13px",
                  fontWeight: "600",
                }}
              >
                Previous
              </button>

              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                style={{
                  padding: "6px 14px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  backgroundColor: currentPage >= totalPages ? "#f1f5f9" : "#ffffff",
                  cursor: currentPage >= totalPages ? "not-allowed" : "pointer",
                  fontSize: "13px",
                  fontWeight: "600",
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Manual Entry Add Sample Modal */}
      {isAddModalOpen && (
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
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            }}
          >
            <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", color: "#0f172a" }}>
              ➕ Manual Water Sample Entry (Store to MongoDB)
            </h3>

            <form onSubmit={handleAddSubmit}>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>
                  Sample / Location Name *
                </label>
                <input
                  type="text"
                  value={newSample.name}
                  onChange={(e) => setNewSample({ ...newSample, name: e.target.value })}
                  placeholder="e.g. Hussain Sagar North Intake #2"
                  style={{ width: "100%", padding: "9px", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>
                    District / Region
                  </label>
                  <input
                    type="text"
                    value={newSample.location}
                    onChange={(e) => setNewSample({ ...newSample, location: e.target.value })}
                    placeholder="e.g. Hyderabad"
                    style={{ width: "100%", padding: "9px", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>
                    Water Source Type
                  </label>
                  <select
                    value={newSample.waterSource}
                    onChange={(e) => setNewSample({ ...newSample, waterSource: e.target.value })}
                    style={{ width: "100%", padding: "9px", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                  >
                    <option value="Urban Lake">Urban Lake</option>
                    <option value="Industrial Drain">Industrial Drain</option>
                    <option value="Reservoir">Reservoir</option>
                    <option value="Effluent Channel">Effluent Channel</option>
                    <option value="Freshwater Lake">Freshwater Lake</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>
                    Collection Date
                  </label>
                  <input
                    type="date"
                    value={newSample.date}
                    onChange={(e) => setNewSample({ ...newSample, date: e.target.value })}
                    style={{ width: "100%", padding: "9px", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>
                    Collector Name
                  </label>
                  <input
                    type="text"
                    value={newSample.collector}
                    onChange={(e) => setNewSample({ ...newSample, collector: e.target.value })}
                    placeholder="e.g. Bhargavi"
                    style={{ width: "100%", padding: "9px", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              {/* Heavy Metal Concentrations (mg/L) */}
              <div style={{ backgroundColor: "#f8fafc", padding: "14px", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "20px" }}>
                <strong style={{ display: "block", fontSize: "13px", color: "#0f172a", marginBottom: "10px" }}>
                  🧪 Heavy Metal Parameters (mg/L):
                </strong>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
                  {[
                    { key: "pb", label: "Pb (Lead)" },
                    { key: "cd", label: "Cd (Cadmium)" },
                    { key: "cr", label: "Cr (Chromium)" },
                    { key: "as", label: "As (Arsenic)" },
                    { key: "hg", label: "Hg (Mercury)" },
                    { key: "ni", label: "Ni (Nickel)" },
                    { key: "cu", label: "Cu (Copper)" },
                    { key: "zn", label: "Zn (Zinc)" },
                    { key: "fe", label: "Fe (Iron)" },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#475569", marginBottom: "2px" }}>
                        {label}
                      </label>
                      <input
                        type="number"
                        step="0.001"
                        min="0"
                        value={newSample[key]}
                        onChange={(e) => setNewSample({ ...newSample, [key]: e.target.value })}
                        style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", boxSizing: "border-box" }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  style={{ padding: "9px 16px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "none" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{ padding: "9px 18px", borderRadius: "6px", border: "none", backgroundColor: "#059669", color: "white", fontWeight: "700" }}
                >
                  {loading ? "Saving to MongoDB..." : "Save Sample to MongoDB"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV/Excel Bulk File Upload Modal */}
      {isUploadModalOpen && (
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
              maxWidth: "520px",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            }}
          >
            <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", color: "#0f172a" }}>
              📄 Bulk Import Water Samples (CSV / Excel)
            </h3>
            <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 16px 0" }}>
              Upload a <strong>.csv</strong>, <strong>.xlsx</strong>, or <strong>.xls</strong> spreadsheet containing water sample data.
            </p>

            <form onSubmit={handleFileUploadSubmit}>
              <div
                style={{
                  border: "2px dashed #cbd5e1",
                  borderRadius: "10px",
                  padding: "24px",
                  textAlign: "center",
                  backgroundColor: "#f8fafc",
                  marginBottom: "16px",
                }}
              >
                <span style={{ fontSize: "36px", display: "block", marginBottom: "8px" }}>📁</span>
                <input
                  type="file"
                  accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                  style={{ fontSize: "13px" }}
                />
                {selectedFile && (
                  <div style={{ marginTop: "10px", fontSize: "12px", color: "#059669", fontWeight: "700" }}>
                    Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </div>
                )}
              </div>

              {/* Upload Result & Row Validation Error Feedback */}
              {uploadResult && (
                <div
                  style={{
                    padding: "12px",
                    borderRadius: "8px",
                    marginBottom: "16px",
                    fontSize: "13px",
                    backgroundColor: uploadResult.success ? "#f0fdf4" : "#fef2f2",
                    border: uploadResult.success ? "1px solid #86efac" : "1px solid #fca5a5",
                    color: uploadResult.success ? "#166534" : "#991b1b",
                  }}
                >
                  <div><strong>{uploadResult.message || uploadResult.error}</strong></div>

                  {uploadResult.invalidRows && uploadResult.invalidRows.length > 0 && (
                    <div style={{ marginTop: "8px", fontSize: "12px" }}>
                      ⚠️ <strong>Rejected Invalid Rows ({uploadResult.invalidRows.length}):</strong>
                      <ul style={{ margin: "4px 0 0 0", paddingLeft: "18px" }}>
                        {uploadResult.invalidRows.slice(0, 5).map((err, i) => (
                          <li key={i}>Row {err.row}: {err.reason}</li>
                        ))}
                        {uploadResult.invalidRows.length > 5 && (
                          <li>...and {uploadResult.invalidRows.length - 5} more rows</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  style={{ padding: "9px 16px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "none" }}
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={uploading || !selectedFile}
                  style={{
                    padding: "9px 18px",
                    borderRadius: "6px",
                    border: "none",
                    backgroundColor: uploading ? "#94a3b8" : "#0284c7",
                    color: "white",
                    fontWeight: "700",
                    cursor: uploading || !selectedFile ? "not-allowed" : "pointer",
                  }}
                >
                  {uploading ? "Importing to MongoDB..." : "Upload & Save to MongoDB"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Sample Details Modal */}
      {isViewModalOpen && selectedSample && (
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
              maxWidth: "480px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            }}
          >
            <h3 style={{ margin: "0 0 12px 0", fontSize: "18px", color: "#0f172a" }}>
              👁️ Water Sample Details ({selectedSample.sampleId || selectedSample._id})
            </h3>
            <p style={{ margin: "4px 0" }}><strong>Location Name:</strong> {selectedSample.locationName || selectedSample.name}</p>
            <p style={{ margin: "4px 0" }}><strong>District:</strong> {selectedSample.district || "Telangana"}</p>
            <p style={{ margin: "4px 0" }}><strong>Water Source:</strong> {selectedSample.waterSource}</p>
            <p style={{ margin: "4px 0" }}><strong>Collector / Researcher:</strong> {selectedSample.collector || "Researcher"}</p>
            <p style={{ margin: "4px 0" }}><strong>Risk Level:</strong> {selectedSample.riskLevel}</p>

            <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px solid #e2e8f0" }}>
              <strong>Heavy Metals Concentrations (mg/L):</strong>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginTop: "8px", fontSize: "12px" }}>
                <div><strong>Pb:</strong> {selectedSample.pb}</div>
                <div><strong>Cd:</strong> {selectedSample.cd}</div>
                <div><strong>Cr:</strong> {selectedSample.cr}</div>
                <div><strong>As:</strong> {selectedSample.as}</div>
                <div><strong>Hg:</strong> {selectedSample.hg}</div>
                <div><strong>Ni:</strong> {selectedSample.ni}</div>
                <div><strong>Cu:</strong> {selectedSample.cu}</div>
                <div><strong>Zn:</strong> {selectedSample.zn}</div>
                <div><strong>Fe:</strong> {selectedSample.fe}</div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px" }}>
              <button
                onClick={() => setIsViewModalOpen(false)}
                style={{ padding: "8px 18px", borderRadius: "6px", border: "none", backgroundColor: "#0f172a", color: "white", fontWeight: "600" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Sample Modal */}
      {isEditModalOpen && selectedSample && (
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
              maxWidth: "480px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            }}
          >
            <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", color: "#0f172a" }}>
              ✏️ Edit Water Sample ({selectedSample.sampleId})
            </h3>
            <form onSubmit={handleEditSubmit}>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600" }}>Location Name</label>
                <input
                  type="text"
                  value={selectedSample.locationName || selectedSample.name || ""}
                  onChange={(e) => setSelectedSample({ ...selectedSample, locationName: e.target.value })}
                  style={{ width: "100%", padding: "9px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                />
              </div>

              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600" }}>District</label>
                <input
                  type="text"
                  value={selectedSample.district || ""}
                  onChange={(e) => setSelectedSample({ ...selectedSample, district: e.target.value })}
                  style={{ width: "100%", padding: "9px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "none" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: "8px 18px", borderRadius: "6px", border: "none", backgroundColor: "#0284c7", color: "white", fontWeight: "700" }}
                >
                  Save Changes to MongoDB
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Samples;
