import React, { useState, useEffect } from "react";
import standardsService from "../../services/standardsService";

/**
 * Standards Management Page Component (src/pages/standards/Standards.jsx)
 * 100% Database Driven - Fetches & manages reference scientific values directly from MongoDB.
 * Collections:
 * 1. Metal Standards (metal, symbol, permissibleLimit, idealValue, backgroundConcentration, unitWeight)
 * 2. Pollution Index Thresholds (HPI, MI, CF, PLI, Igeo classification ranges)
 */
function Standards() {
  const [activeTab, setActiveTab] = useState("metals"); // "metals" or "thresholds"

  // Data & Loading States
  const [metalStandards, setMetalStandards] = useState([]);
  const [indexThresholds, setIndexThresholds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Metal Standard Modal & Form State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedStandard, setSelectedStandard] = useState(null);

  const [formData, setFormData] = useState({
    metal: "",
    symbol: "",
    permissibleLimit: 0.01,
    idealValue: 0,
    backgroundConcentration: 0.002,
    unitWeight: 10,
  });

  // Fetch reference values from MongoDB
  const loadStandardsData = async () => {
    try {
      setLoading(true);
      setError("");
      const [metalsData, thresholdsData] = await Promise.all([
        standardsService.getMetalStandards(),
        standardsService.getIndexThresholds(),
      ]);
      setMetalStandards(metalsData);
      setIndexThresholds(thresholdsData);
    } catch (err) {
      console.error("Failed to load standards from MongoDB:", err);
      setError("Failed to fetch scientific standards from MongoDB database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStandardsData();
  }, []);

  // Handle Create Metal Standard Submit
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!formData.metal.trim() || !formData.symbol.trim()) {
      alert("Please fill out metal name and chemical symbol");
      return;
    }

    try {
      setLoading(true);
      await standardsService.createMetalStandard(formData);
      setIsAddModalOpen(false);
      setSuccessMsg(`Metal standard for ${formData.metal} added to MongoDB!`);
      setTimeout(() => setSuccessMsg(""), 4000);
      setFormData({
        metal: "",
        symbol: "",
        permissibleLimit: 0.01,
        idealValue: 0,
        backgroundConcentration: 0.002,
        unitWeight: 10,
      });
      loadStandardsData();
    } catch (err) {
      alert(err.message || "Failed to create metal standard");
    } finally {
      setLoading(false);
    }
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStandard) return;

    try {
      setLoading(true);
      await standardsService.updateMetalStandard(selectedStandard._id, selectedStandard);
      setIsEditModalOpen(false);
      setSuccessMsg(`Metal standard for ${selectedStandard.metal} updated in MongoDB!`);
      setTimeout(() => setSuccessMsg(""), 4000);
      loadStandardsData();
    } catch (err) {
      alert(err.message || "Failed to update metal standard");
    } finally {
      setLoading(false);
    }
  };

  // Handle Delete Standard
  const handleDelete = async (std) => {
    if (window.confirm(`Are you sure you want to delete ${std.metal} from MongoDB metal standards?`)) {
      try {
        await standardsService.deleteMetalStandard(std._id);
        setSuccessMsg(`Removed ${std.metal} standard record.`);
        setTimeout(() => setSuccessMsg(""), 3000);
        loadStandardsData();
      } catch (err) {
        alert(err.message || "Failed to delete standard");
      }
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
              fontSize: "22px",
              fontWeight: "800",
              color: "#0f172a",
              margin: "0 0 4px 0",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span>⚖️</span> Scientific Standards & Thresholds Management (MongoDB)
          </h1>
          <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
            Manage WHO/BIS permissible limits, background concentrations, unit weights, and index classification thresholds stored in MongoDB.
          </p>
        </div>

        {/* Action Buttons */}
        {activeTab === "metals" && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            style={{
              backgroundColor: "#2563eb",
              color: "#ffffff",
              padding: "10px 18px",
              borderRadius: "8px",
              fontWeight: "700",
              fontSize: "14px",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)",
            }}
          >
            <span>➕</span> Add Metal Standard
          </button>
        )}
      </div>

      {/* Success & Error Messages */}
      {successMsg && (
        <div style={{ padding: "12px 18px", backgroundColor: "#f0fdf4", border: "1px solid #86efac", color: "#166534", borderRadius: "8px", marginBottom: "20px", fontSize: "14px", fontWeight: "600" }}>
          ✅ {successMsg}
        </div>
      )}
      {error && (
        <div style={{ padding: "12px 18px", backgroundColor: "#fef2f2", border: "1px solid #fca5a5", color: "#991b1b", borderRadius: "8px", marginBottom: "20px", fontSize: "14px", fontWeight: "600" }}>
          ⚠️ {error}
        </div>
      )}

      {/* Navigation Tabs */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <button
          onClick={() => setActiveTab("metals")}
          style={{
            padding: "10px 20px",
            borderRadius: "8px",
            border: "none",
            backgroundColor: activeTab === "metals" ? "#0f172a" : "#ffffff",
            color: activeTab === "metals" ? "#ffffff" : "#475569",
            fontWeight: "700",
            fontSize: "14px",
            cursor: "pointer",
            boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
          }}
        >
          📊 Collection 1: Metal Standards ({metalStandards.length})
        </button>
        <button
          onClick={() => setActiveTab("thresholds")}
          style={{
            padding: "10px 20px",
            borderRadius: "8px",
            border: "none",
            backgroundColor: activeTab === "thresholds" ? "#0f172a" : "#ffffff",
            color: activeTab === "thresholds" ? "#ffffff" : "#475569",
            fontWeight: "700",
            fontSize: "14px",
            cursor: "pointer",
            boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
          }}
        >
          📈 Collection 2: Index Thresholds ({indexThresholds.length})
        </button>
      </div>

      {/* Collection 1: Metal Standards Table */}
      {activeTab === "metals" && (
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
            <div style={{ padding: "32px", textAlign: "center", color: "#64748b" }}>
              🔄 Fetching metal standards from MongoDB database...
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
                  <th style={{ padding: "14px 16px" }}>Metal Name</th>
                  <th style={{ padding: "14px 16px" }}>Symbol</th>
                  <th style={{ padding: "14px 16px" }}>WHO/BIS Limit (Si / MACi)</th>
                  <th style={{ padding: "14px 16px" }}>Ideal Value (Ii)</th>
                  <th style={{ padding: "14px 16px" }}>Background Conc. (Bi)</th>
                  <th style={{ padding: "14px 16px" }}>Unit Weight (Wi)</th>
                  <th style={{ padding: "14px 16px", textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {metalStandards.length > 0 ? (
                  metalStandards.map((std) => (
                    <tr key={std._id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "14px 16px", fontWeight: "700", color: "#0f172a" }}>
                        {std.metal}
                      </td>
                      <td style={{ padding: "14px 16px", fontWeight: "800", color: "#2563eb" }}>
                        {std.symbol}
                      </td>
                      <td style={{ padding: "14px 16px", fontWeight: "700", color: "#d97706" }}>
                        {std.permissibleLimit} mg/L
                      </td>
                      <td style={{ padding: "14px 16px", color: "#475569" }}>
                        {std.idealValue} mg/L
                      </td>
                      <td style={{ padding: "14px 16px", color: "#475569" }}>
                        {std.backgroundConcentration} mg/L
                      </td>
                      <td style={{ padding: "14px 16px", fontWeight: "700", color: "#059669" }}>
                        {std.unitWeight}
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "center" }}>
                        <div style={{ display: "flex", justifyContent: "center", gap: "8px" }}>
                          <button
                            onClick={() => {
                              setSelectedStandard(std);
                              setIsEditModalOpen(true);
                            }}
                            style={{
                              padding: "5px 10px",
                              borderRadius: "6px",
                              border: "1px solid #cbd5e1",
                              backgroundColor: "#ffffff",
                              cursor: "pointer",
                            }}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handleDelete(std)}
                            style={{
                              padding: "5px 10px",
                              borderRadius: "6px",
                              border: "1px solid #fca5a5",
                              backgroundColor: "#fef2f2",
                              color: "#ef4444",
                              cursor: "pointer",
                            }}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} style={{ padding: "32px", textAlign: "center", color: "#94a3b8" }}>
                      No metal standards found in MongoDB database.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Collection 2: Index Thresholds View */}
      {activeTab === "thresholds" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
          {indexThresholds.map((thresh) => (
            <div
              key={thresh._id}
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "12px",
                padding: "20px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                <h3 style={{ margin: 0, fontSize: "18px", color: "#0f172a" }}>
                  📌 {thresh.indexName} Thresholds
                </h3>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "#2563eb", backgroundColor: "#eff6ff", padding: "3px 8px", borderRadius: "6px" }}>
                  MongoDB Document
                </span>
              </div>

              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f8fafc", color: "#64748b" }}>
                    <th style={{ padding: "8px 10px", textAlign: "left" }}>Category Label</th>
                    <th style={{ padding: "8px 10px", textAlign: "left" }}>Min Value</th>
                    <th style={{ padding: "8px 10px", textAlign: "left" }}>Max Value</th>
                  </tr>
                </thead>
                <tbody>
                  {thresh.categories && thresh.categories.map((cat, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "8px 10px", fontWeight: "700", color: "#334155" }}>{cat.label}</td>
                      <td style={{ padding: "8px 10px", color: "#0f172a" }}>{cat.min}</td>
                      <td style={{ padding: "8px 10px", color: "#0f172a" }}>{cat.max === 9999 ? "∞" : cat.max}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {/* Add Metal Standard Modal */}
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
              maxWidth: "520px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            }}
          >
            <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", color: "#0f172a" }}>
              ➕ Create Metal Standard in MongoDB
            </h3>

            <form onSubmit={handleAddSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>Metal Name *</label>
                  <input
                    type="text"
                    value={formData.metal}
                    onChange={(e) => setFormData({ ...formData, metal: e.target.value })}
                    placeholder="e.g. Lead"
                    required
                    style={{ width: "100%", padding: "9px", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>Chemical Symbol *</label>
                  <input
                    type="text"
                    value={formData.symbol}
                    onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                    placeholder="e.g. Pb"
                    required
                    style={{ width: "100%", padding: "9px", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>Permissible Limit (mg/L)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.permissibleLimit}
                    onChange={(e) => setFormData({ ...formData, permissibleLimit: e.target.value })}
                    required
                    style={{ width: "100%", padding: "9px", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>Ideal Value (mg/L)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.idealValue}
                    onChange={(e) => setFormData({ ...formData, idealValue: e.target.value })}
                    style={{ width: "100%", padding: "9px", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>Background Conc. (mg/L)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.backgroundConcentration}
                    onChange={(e) => setFormData({ ...formData, backgroundConcentration: e.target.value })}
                    required
                    style={{ width: "100%", padding: "9px", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>Unit Weight (Wi)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.unitWeight}
                    onChange={(e) => setFormData({ ...formData, unitWeight: e.target.value })}
                    required
                    style={{ width: "100%", padding: "9px", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  style={{ padding: "9px 18px", borderRadius: "8px", border: "1px solid #cbd5e1", backgroundColor: "#ffffff", color: "#475569" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: "9px 18px", borderRadius: "8px", border: "none", backgroundColor: "#2563eb", color: "#ffffff", fontWeight: "700" }}
                >
                  Save Standard
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Metal Standard Modal */}
      {isEditModalOpen && selectedStandard && (
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
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            }}
          >
            <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", color: "#0f172a" }}>
              ✏️ Edit {selectedStandard.metal} Standard
            </h3>

            <form onSubmit={handleEditSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>Permissible Limit (mg/L)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={selectedStandard.permissibleLimit}
                    onChange={(e) => setSelectedStandard({ ...selectedStandard, permissibleLimit: Number(e.target.value) })}
                    required
                    style={{ width: "100%", padding: "9px", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>Ideal Value (mg/L)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={selectedStandard.idealValue}
                    onChange={(e) => setSelectedStandard({ ...selectedStandard, idealValue: Number(e.target.value) })}
                    style={{ width: "100%", padding: "9px", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>Background Conc. (mg/L)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={selectedStandard.backgroundConcentration}
                    onChange={(e) => setSelectedStandard({ ...selectedStandard, backgroundConcentration: Number(e.target.value) })}
                    required
                    style={{ width: "100%", padding: "9px", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>Unit Weight (Wi)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={selectedStandard.unitWeight}
                    onChange={(e) => setSelectedStandard({ ...selectedStandard, unitWeight: Number(e.target.value) })}
                    required
                    style={{ width: "100%", padding: "9px", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  style={{ padding: "9px 18px", borderRadius: "8px", border: "1px solid #cbd5e1", backgroundColor: "#ffffff", color: "#475569" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: "9px 18px", borderRadius: "8px", border: "none", backgroundColor: "#059669", color: "#ffffff", fontWeight: "700" }}
                >
                  Update Standard
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Standards;
