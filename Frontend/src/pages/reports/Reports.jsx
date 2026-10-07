import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import assessmentService from "../../services/assessmentService";
import sampleService from "../../services/sampleService";
import reportService from "../../services/reportService";

/**
 * Environmental Reports Module (src/pages/reports/Reports.jsx)
 * Fully integrated with MongoDB database backend and PDF generator API.
 * Features:
 * 1. Report Dashboard Summary Cards (Total Reports, Assessments, High Risk, Water Bodies)
 * 2. Generate Environmental Report Modal & Trigger
 * 3. Report History Table (Name, Date, Location, Risk Level, Actions)
 * 4. Action Buttons (View Detailed Report Modal, Download PDF, Delete)
 * 5. Professional Government-Style Report Detail View with Executive Summary & Conclusion
 * 6. Date, Location & Risk-Level Filtering
 * 7. Real-Time Search (Location & Report Name)
 * 8. Summary Bar Chart (HPI by Location)
 * 9. Real Database Records & Event-Driven Auto Refresh
 */
function Reports() {
  const [assessments, setAssessments] = useState([]);
  const [waterBodiesCount, setWaterBodiesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [riskFilter, setRiskFilter] = useState("All");
  const [locationFilter, setLocationFilter] = useState("All");

  // Modal States
  const [selectedReport, setSelectedReport] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [samplesList, setSamplesList] = useState([]);
  const [selectedSampleId, setSelectedSampleId] = useState("");
  const [generating, setGenerating] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  // Load report data from MongoDB backend
  const loadReportData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [assessmentsData, samplesRes] = await Promise.all([
        assessmentService.getAssessments(),
        sampleService.getSamples({ limit: 100 }),
      ]);

      setAssessments(assessmentsData || []);
      setSamplesList(samplesRes.samples || []);
      setWaterBodiesCount(samplesRes.totalSamples || (samplesRes.samples ? samplesRes.samples.length : 0));
    } catch (err) {
      console.error("Error loading report data from backend:", err);
      setError("Failed to load environmental report data from database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();

    const handleAutoRefresh = () => {
      loadReportData();
    };

    window.addEventListener("samplesUpdated", handleAutoRefresh);
    window.addEventListener("assessmentUpdated", handleAutoRefresh);
    window.addEventListener("gisDataRefresh", handleAutoRefresh);

    return () => {
      window.removeEventListener("samplesUpdated", handleAutoRefresh);
      window.removeEventListener("assessmentUpdated", handleAutoRefresh);
      window.removeEventListener("gisDataRefresh", handleAutoRefresh);
    };
  }, []);

  // Handle Generate Report Modal Submit
  const handleGenerateReportSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSampleId) {
      alert("Please select a water sample location to generate an environmental report.");
      return;
    }

    try {
      setGenerating(true);
      const newAssessment = await assessmentService.generateAssessment(selectedSampleId);
      setIsGenerateModalOpen(false);
      await loadReportData();
      window.dispatchEvent(new Event("assessmentUpdated"));

      setSelectedReport(newAssessment);
      setIsViewModalOpen(true);
    } catch (err) {
      alert(`Error generating environmental report: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  // Handle PDF Download Action
  const handleDownloadPDF = async (report) => {
    const targetId = report._id || report.id;
    const reportCode = report.customSampleId || report.locationName || "Report";

    try {
      setDownloadingId(targetId);
      await reportService.downloadReport(targetId, `Environmental_Report_${reportCode}.pdf`);
    } catch (err) {
      alert(`⚠️ ${err.message || "PDF generation failed. Please try again."}`);
    } finally {
      setDownloadingId(null);
    }
  };

  // Handle Delete Report Action
  const handleDeleteReport = async (report) => {
    const reportCode = report.customSampleId || report.locationName;
    if (window.confirm(`Are you sure you want to delete report record "${reportCode}" from database?`)) {
      try {
        await assessmentService.deleteAssessment(report._id || report.id);
        await loadReportData();
        window.dispatchEvent(new Event("assessmentUpdated"));
      } catch (err) {
        alert(err.message || "Failed to delete report record");
      }
    }
  };

  // Helper for Risk Level Badge
  const getRiskBadge = (status = "", hpi = 0) => {
    if (status === "SEVERELY CONTAMINATED WATER" || status === "HIGHLY CONTAMINATED WATER" || hpi >= 100) {
      return { bg: "#fee2e2", text: "#991b1b", label: "🔴 High Risk" };
    } else if (status === "CONTAMINATED WATER" || hpi >= 60) {
      return { bg: "#ffedd5", text: "#9a3412", label: "🟠 Medium Risk" };
    } else {
      return { bg: "#dcfce7", text: "#166534", label: "🟢 Low Risk" };
    }
  };

  // Summary Metrics
  const totalReports = assessments.length;
  const totalAssessments = assessments.length;
  const highRiskCount = assessments.filter((a) =>
    a.overallStatus === "SEVERELY CONTAMINATED WATER" ||
    a.overallStatus === "HIGHLY CONTAMINATED WATER" ||
    Number(a.hpi) >= 100
  ).length;

  // Unique Location Names for Filter
  const uniqueLocations = Array.from(
    new Set(
      assessments
        .map((a) => a.locationName || (a.sampleId ? a.sampleId.locationName : ""))
        .filter(Boolean)
    )
  );

  // Filtered Reports Dataset
  const filteredReports = assessments.filter((rpt) => {
    const reportCode = rpt.customSampleId || rpt._id || "";
    const locName = rpt.locationName || (rpt.sampleId ? rpt.sampleId.locationName : "") || "";
    const status = rpt.overallStatus || "";

    const matchesSearch =
      reportCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      locName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      status.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesLocation =
      locationFilter === "All" || locName === locationFilter;

    const isHigh = status === "SEVERELY CONTAMINATED WATER" || status === "HIGHLY CONTAMINATED WATER" || Number(rpt.hpi) >= 100;
    const isMed = status === "CONTAMINATED WATER" || (Number(rpt.hpi) >= 60 && !isHigh);

    const matchesRisk =
      riskFilter === "All" ||
      (riskFilter === "High" && isHigh) ||
      (riskFilter === "Medium" && isMed) ||
      (riskFilter === "Low" && !isHigh && !isMed);

    return matchesSearch && matchesLocation && matchesRisk;
  });

  // Chart Data (Bar Chart Only)
  const chartData = filteredReports.map((rpt) => ({
    name: rpt.locationName || rpt.customSampleId || "Sample",
    HPI: Number(rpt.hpi) || 0,
    MI: Number(rpt.mi) || 0,
    PLI: Number(rpt.pli) || 0,
  }));

  return (
    <div
      style={{
        backgroundColor: "#f8fafc",
        minHeight: "100vh",
        padding: "24px",
        boxSizing: "border-box",
        fontFamily: "'Poppins', sans-serif",
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
          marginBottom: "24px",
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          padding: "20px 24px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "clamp(22px, 3.2vw, 32px)",
              fontWeight: 600,
              color: "#0f172a",
              margin: 0,
              letterSpacing: "-0.3px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              lineHeight: 1.2,
            }}
          >
            <span>📄</span> Environmental Reports Module
          </h1>
          <p style={{ fontSize: "14px", color: "#64748b", margin: "4px 0 0 0" }}>
            Official government & WHO compliance environmental monitoring reports, PDF exports, and historical trends.
          </p>
        </div>

        {/* Generate Report Button */}
        <button
          onClick={() => {
            setIsGenerateModalOpen(true);
            if (samplesList.length > 0 && !selectedSampleId) {
              setSelectedSampleId(samplesList[0]._id);
            }
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "12px 20px",
            backgroundColor: "#2563eb",
            color: "#ffffff",
            border: "none",
            borderRadius: "10px",
            fontWeight: "600",
            fontSize: "14px",
            cursor: "pointer",
            boxShadow: "0 4px 14px rgba(37, 99, 235, 0.3)",
            transition: "all 0.2s ease",
            fontFamily: "'Poppins', sans-serif",
          }}
        >
          <span>➕</span> Generate Environmental Report
        </button>
      </div>

      {/* 1. Report Dashboard Summary Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "20px",
          marginBottom: "24px",
        }}
      >
        {/* Card 1 */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            padding: "20px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontSize: "13px", fontWeight: "600", color: "#64748b", marginBottom: "4px" }}>
              Total Reports
            </div>
            <div style={{ fontSize: "26px", fontWeight: "700", color: "#0f172a" }}>
              {loading ? "--" : totalReports}
            </div>
          </div>
          <div style={{ width: "46px", height: "46px", borderRadius: "12px", backgroundColor: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px" }}>
            📄
          </div>
        </div>

        {/* Card 2 */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            padding: "20px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontSize: "13px", fontWeight: "600", color: "#64748b", marginBottom: "4px" }}>
              Assessments Generated
            </div>
            <div style={{ fontSize: "26px", fontWeight: "700", color: "#2563eb" }}>
              {loading ? "--" : totalAssessments}
            </div>
          </div>
          <div style={{ width: "46px", height: "46px", borderRadius: "12px", backgroundColor: "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px" }}>
            📊
          </div>
        </div>

        {/* Card 3 */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            padding: "20px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontSize: "13px", fontWeight: "600", color: "#64748b", marginBottom: "4px" }}>
              High Risk Locations
            </div>
            <div style={{ fontSize: "26px", fontWeight: "700", color: "#dc2626" }}>
              {loading ? "--" : highRiskCount}
            </div>
          </div>
          <div style={{ width: "46px", height: "46px", borderRadius: "12px", backgroundColor: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px" }}>
            ⚠️
          </div>
        </div>

        {/* Card 4 */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            padding: "20px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontSize: "13px", fontWeight: "600", color: "#64748b", marginBottom: "4px" }}>
              Water Bodies Monitored
            </div>
            <div style={{ fontSize: "26px", fontWeight: "700", color: "#059669" }}>
              {loading ? "--" : waterBodiesCount}
            </div>
          </div>
          <div style={{ width: "46px", height: "46px", borderRadius: "12px", backgroundColor: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px" }}>
            💧
          </div>
        </div>
      </div>

      {/* 8. Summary Bar Chart Section */}
      {chartData.length > 0 && (
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            padding: "24px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)",
            marginBottom: "24px",
          }}
        >
          <div style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <span>📈</span> Heavy Metal Pollution Index (HPI) Summary Chart
          </div>
          <div style={{ width: "100%", height: "260px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 15, right: 20, left: 0, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} interval={0} angle={-10} textAnchor="end" />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #cbd5e1",
                    borderRadius: "10px",
                    boxShadow: "0 4px 14px rgba(0,0,0,0.1)",
                    fontFamily: "'Poppins', sans-serif",
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: "10px" }} />
                <ReferenceLine y={100} stroke="#dc2626" strokeDasharray="4 4" label={{ value: "Critical Limit (100)", fill: "#dc2626", fontSize: 11, position: "top" }} />
                <Bar dataKey="HPI" fill="#2563eb" radius={[6, 6, 0, 0]} name="HPI Index" barSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Controls Bar (Search Box, Location & Risk Filters) */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          marginBottom: "24px",
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          padding: "16px 20px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)",
        }}
      >
        {/* Search Bar */}
        <div style={{ position: "relative", minWidth: "260px", flex: 1 }}>
          <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }}>
            🔍
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search report name or location..."
            style={{
              width: "100%",
              padding: "10px 14px 10px 40px",
              borderRadius: "10px",
              border: "1px solid #cbd5e1",
              fontSize: "14px",
              fontFamily: "'Poppins', sans-serif",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Location Dropdown Filter */}
        <select
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
          style={{
            padding: "10px 14px",
            borderRadius: "10px",
            border: "1px solid #cbd5e1",
            fontSize: "13px",
            fontFamily: "'Poppins', sans-serif",
            outline: "none",
            backgroundColor: "#ffffff",
            color: "#0f172a",
          }}
        >
          <option value="All">All Monitored Locations</option>
          {uniqueLocations.map((loc) => (
            <option key={loc} value={loc}>
              {loc}
            </option>
          ))}
        </select>

        {/* Risk Level Filter Tabs */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {["All", "High", "Medium", "Low"].map((level) => (
            <button
              key={level}
              onClick={() => setRiskFilter(level)}
              style={{
                padding: "8px 14px",
                borderRadius: "8px",
                border: "none",
                fontWeight: "600",
                fontSize: "12px",
                cursor: "pointer",
                fontFamily: "'Poppins', sans-serif",
                backgroundColor: riskFilter === level ? "#0f172a" : "#f1f5f9",
                color: riskFilter === level ? "#ffffff" : "#475569",
                transition: "all 0.2s ease",
              }}
            >
              {level === "All" ? "All Risk Levels" : level === "High" ? "🔴 High" : level === "Medium" ? "🟠 Medium" : "🟢 Low"}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Report History Table */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid #f1f5f9",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a", margin: 0 }}>
            Report History ({filteredReports.length})
          </h3>
        </div>

        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
            Loading report records from database...
          </div>
        ) : error ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#ef4444" }}>
            {error}
          </div>
        ) : filteredReports.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
            No report records match your search or filter options.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "13px",
                textAlign: "left",
              }}
            >
              <thead>
                <tr style={{ backgroundColor: "#f8fafc", color: "#475569", fontWeight: "600" }}>
                  <th style={{ padding: "14px 20px" }}>Report Name</th>
                  <th style={{ padding: "14px 20px" }}>Generated Date</th>
                  <th style={{ padding: "14px 20px" }}>Location</th>
                  <th style={{ padding: "14px 20px" }}>Risk Level</th>
                  <th style={{ padding: "14px 20px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((rpt, idx) => {
                  const reportId = rpt._id || rpt.id;
                  const customCode = rpt.customSampleId || `SMP-${reportId.substring(18)}`;
                  const locName = rpt.locationName || (rpt.sampleId ? rpt.sampleId.locationName : "Water Body");
                  const dateStr = rpt.generatedAt || rpt.createdAt ? new Date(rpt.generatedAt || rpt.createdAt).toLocaleString() : "Recently";
                  const badge = getRiskBadge(rpt.overallStatus, rpt.hpi);

                  return (
                    <tr
                      key={reportId || idx}
                      style={{
                        borderBottom: "1px solid #f1f5f9",
                        transition: "background-color 0.15s ease",
                      }}
                    >
                      {/* Report Name */}
                      <td style={{ padding: "14px 20px", fontWeight: "600", color: "#0f172a" }}>
                        📄 ENV-RPT-{customCode}
                      </td>

                      {/* Generated Date */}
                      <td style={{ padding: "14px 20px", color: "#64748b" }}>
                        {dateStr}
                      </td>

                      {/* Location */}
                      <td style={{ padding: "14px 20px", color: "#1e293b", fontWeight: "500" }}>
                        💧 {locName}
                      </td>

                      {/* Risk Level */}
                      <td style={{ padding: "14px 20px" }}>
                        <span
                          style={{
                            backgroundColor: badge.bg,
                            color: badge.text,
                            padding: "4px 10px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: "700",
                          }}
                        >
                          {badge.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: "14px 20px", textAlign: "right" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "8px" }}>
                          {/* View */}
                          <button
                            onClick={() => {
                              setSelectedReport(rpt);
                              setIsViewModalOpen(true);
                            }}
                            style={{
                              padding: "6px 12px",
                              backgroundColor: "#f1f5f9",
                              color: "#0f172a",
                              border: "none",
                              borderRadius: "6px",
                              fontSize: "12px",
                              fontWeight: "600",
                              cursor: "pointer",
                              fontFamily: "'Poppins', sans-serif",
                            }}
                          >
                            👁️ View
                          </button>

                          {/* Download PDF */}
                          <button
                            onClick={() => handleDownloadPDF(rpt)}
                            disabled={downloadingId === reportId}
                            style={{
                              padding: "6px 12px",
                              backgroundColor: "#2563eb",
                              color: "#ffffff",
                              border: "none",
                              borderRadius: "6px",
                              fontSize: "12px",
                              fontWeight: "600",
                              cursor: downloadingId === reportId ? "wait" : "pointer",
                              fontFamily: "'Poppins', sans-serif",
                            }}
                          >
                            {downloadingId === reportId ? "⏳ Exporting..." : "📥 PDF"}
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteReport(rpt)}
                            style={{
                              padding: "6px 12px",
                              backgroundColor: "#fef2f2",
                              color: "#dc2626",
                              border: "none",
                              borderRadius: "6px",
                              fontSize: "12px",
                              fontWeight: "600",
                              cursor: "pointer",
                              fontFamily: "'Poppins', sans-serif",
                            }}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Generate Report Modal Dialog */}
      {isGenerateModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 3000,
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              padding: "28px",
              maxWidth: "500px",
              width: "100%",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)",
              border: "1px solid #e2e8f0",
              fontFamily: "'Poppins', sans-serif",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#0f172a", margin: 0 }}>
                Generate Environmental Report
              </h3>
              <button
                onClick={() => setIsGenerateModalOpen(false)}
                style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "#64748b" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGenerateReportSubmit}>
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "8px" }}>
                  Select Monitored Water Sample Location:
                </label>
                <select
                  value={selectedSampleId}
                  onChange={(e) => setSelectedSampleId(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                    fontSize: "14px",
                    fontFamily: "'Poppins', sans-serif",
                    outline: "none",
                  }}
                >
                  {samplesList.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.sampleId || s._id} - {s.locationName} ({s.district})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button
                  type="button"
                  onClick={() => setIsGenerateModalOpen(false)}
                  style={{ padding: "10px 18px", borderRadius: "8px", border: "1px solid #cbd5e1", backgroundColor: "#ffffff", color: "#475569", fontWeight: "600", fontSize: "13px", cursor: "pointer", fontFamily: "'Poppins', sans-serif" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generating}
                  style={{ padding: "10px 20px", borderRadius: "8px", border: "none", backgroundColor: "#2563eb", color: "#ffffff", fontWeight: "600", fontSize: "13px", cursor: generating ? "wait" : "pointer", fontFamily: "'Poppins', sans-serif" }}
                >
                  {generating ? "Generating..." : "Generate & View Report"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detailed Report View Modal (Government Style Report Layout) */}
      {isViewModalOpen && selectedReport && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 3000,
            backgroundColor: "rgba(15, 23, 42, 0.7)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              padding: "32px",
              maxWidth: "800px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 25px 50px rgba(0, 0, 0, 0.25)",
              border: "1px solid #e2e8f0",
              fontFamily: "'Poppins', sans-serif",
            }}
          >
            {/* Modal Actions Bar */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", paddingBottom: "12px", borderBottom: "2px solid #0f172a" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "28px" }}>🌊</span>
                <div>
                  <div style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Heavy Metal Water Pollution System
                  </div>
                  <div style={{ fontSize: "12px", color: "#64748b" }}>
                    Official Environmental Assessment Report
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <button
                  onClick={() => handleDownloadPDF(selectedReport)}
                  style={{ padding: "8px 16px", backgroundColor: "#2563eb", color: "#ffffff", border: "none", borderRadius: "8px", fontWeight: "600", fontSize: "13px", cursor: "pointer", fontFamily: "'Poppins', sans-serif" }}
                >
                  📥 Export PDF
                </button>
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  style={{ background: "none", border: "none", fontSize: "22px", cursor: "pointer", color: "#64748b" }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Section 1: Executive Summary */}
            <div style={{ marginBottom: "20px" }}>
              <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a", textTransform: "uppercase", borderBottom: "1px solid #cbd5e1", paddingBottom: "4px", marginBottom: "8px" }}>
                Executive Summary
              </h4>
              <p style={{ fontSize: "13px", color: "#334155", lineHeight: "1.5", margin: 0 }}>
                This environmental compliance report evaluates hydrological heavy metal contamination at <strong>{selectedReport.locationName}</strong> based on World Health Organization (WHO) and Bureau of Indian Standards (BIS) drinking water criteria.
              </p>
            </div>

            {/* Section 2: Water Quality Assessment Metadata */}
            <div style={{ marginBottom: "20px", backgroundColor: "#f8fafc", padding: "14px 18px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
              <h4 style={{ fontSize: "13px", fontWeight: "700", color: "#0f172a", margin: "0 0 8px 0" }}>
                Water Sample Metadata
              </h4>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "12px", color: "#475569" }}>
                <div><strong>Report ID:</strong> ENV-RPT-{selectedReport.customSampleId || selectedReport._id}</div>
                <div><strong>Location:</strong> {selectedReport.locationName}</div>
                <div><strong>District:</strong> {selectedReport.sampleId?.district || "Telangana"}</div>
                <div><strong>Water Source:</strong> {selectedReport.waterSource || "Urban Lake"}</div>
                <div><strong>Collection Date:</strong> {selectedReport.collectionDate ? new Date(selectedReport.collectionDate).toLocaleDateString() : "Recent"}</div>
                <div><strong>Overall Status:</strong> <span style={{ fontWeight: "bold", color: "#dc2626" }}>{selectedReport.overallStatus}</span></div>
              </div>
            </div>

            {/* Section 3: Pollution Indices */}
            <div style={{ marginBottom: "20px" }}>
              <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a", textTransform: "uppercase", borderBottom: "1px solid #cbd5e1", paddingBottom: "4px", marginBottom: "12px" }}>
                Calculated Pollution Indices
              </h4>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", textAlign: "center" }}>
                <div style={{ backgroundColor: "#eff6ff", padding: "12px", borderRadius: "10px", border: "1px solid #bfdbfe" }}>
                  <div style={{ fontSize: "11px", color: "#1e40af", fontWeight: "600" }}>HPI (Pollution Index)</div>
                  <div style={{ fontSize: "20px", fontWeight: "800", color: "#1e3a8a", marginTop: "4px" }}>{selectedReport.hpi}</div>
                </div>
                <div style={{ backgroundColor: "#fff7ed", padding: "12px", borderRadius: "10px", border: "1px solid #fed7aa" }}>
                  <div style={{ fontSize: "11px", color: "#9a3412", fontWeight: "600" }}>MI (Metal Index)</div>
                  <div style={{ fontSize: "20px", fontWeight: "800", color: "#7c2d12", marginTop: "4px" }}>{selectedReport.mi}</div>
                </div>
                <div style={{ backgroundColor: "#f5f3ff", padding: "12px", borderRadius: "10px", border: "1px solid #ddd6fe" }}>
                  <div style={{ fontSize: "11px", color: "#5b21b6", fontWeight: "600" }}>PLI (Pollution Load)</div>
                  <div style={{ fontSize: "20px", fontWeight: "800", color: "#4c1d95", marginTop: "4px" }}>{selectedReport.pli}</div>
                </div>
              </div>
            </div>

            {/* Section 4: Recommendations */}
            <div style={{ marginBottom: "20px" }}>
              <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a", textTransform: "uppercase", borderBottom: "1px solid #cbd5e1", paddingBottom: "4px", marginBottom: "10px" }}>
                Remediation Recommendations
              </h4>
              <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "13px", color: "#334155", display: "flex", flexDirection: "column", gap: "6px" }}>
                {(selectedReport.recommendations || [
                  "Enforce mandatory industrial effluent pre-treatment.",
                  "Deploy Reverse Osmosis (RO) filtration membrane.",
                  "Schedule 7-day periodic heavy metal ICP-MS lab sampling.",
                ]).map((rec, idx) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
            </div>

            {/* Section 5: Conclusion & Sign-off */}
            <div style={{ backgroundColor: "#f1f5f9", padding: "14px 18px", borderRadius: "10px", fontSize: "12px", color: "#475569" }}>
              <strong>Conclusion:</strong> Water quality monitoring must be maintained in accordance with WHO guidelines. All industrial point sources in proximity to <strong>{selectedReport.locationName}</strong> require immediate environmental audit.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Reports;
