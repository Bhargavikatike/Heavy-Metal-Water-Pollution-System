import React, { useState, useEffect } from "react";
import authService, { formatRole } from "../services/authService";
import dashboardService from "../services/dashboardService";

/**
 * Dashboard Page Component (src/pages/Dashboard.jsx)
 * Connected directly to MongoDB backend APIs.
 * Fetches real sample counts, statistics, recent assessments, and top polluted locations.
 */
function Dashboard({ onNavigateToGIS, currentUser: propUser }) {
  const currentUser = propUser || authService.getCurrentUser() || {
    name: "User",
    role: "Researcher",
  };

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState({
    totalSamples: 0,
    totalAssessments: 0,
    highRiskLocations: 0,
    reportsGenerated: 0,
  });
  const [recentAssessments, setRecentAssessments] = useState([]);
  const [topPollutedLocations, setTopPollutedLocations] = useState([]);

  // Fetch real data from MongoDB backend API
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, recentRes, topRes] = await Promise.all([
        dashboardService.getDashboardStats().catch(() => ({})),
        dashboardService.getRecentAssessments().catch(() => []),
        dashboardService.getTopPollutedLocations().catch(() => []),
      ]);

      if (statsRes) {
        setStatsData({
          totalSamples: statsRes.totalSamples || 0,
          totalAssessments: statsRes.totalAssessments || 0,
          highRiskLocations: statsRes.highRiskLocations || 0,
          reportsGenerated: statsRes.reportsGenerated || 0,
        });
      }
      setRecentAssessments(recentRes || []);
      setTopPollutedLocations(topRes || []);
    } catch (error) {
      console.warn("Could not load database dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const statsList = [
    { title: "Total Samples", value: statsData.totalSamples, icon: "🧪", color: "#3b82f6", bgColor: "#eff6ff" },
    { title: "Total Assessments", value: statsData.totalAssessments, icon: "📋", color: "#8b5cf6", bgColor: "#f3e8ff" },
    { title: "High Risk Locations", value: statsData.highRiskLocations, icon: "⚠️", color: "#ef4444", bgColor: "#fef2f2" },
    { title: "Reports Generated", value: statsData.reportsGenerated, icon: "📄", color: "#10b981", bgColor: "#ecfdf5" },
  ];

  const getRiskBadgeColor = (risk) => {
    switch (risk) {
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
      {/* 1. Welcome Header Section */}
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
              fontFamily: "'Inter', sans-serif",
              fontSize: "clamp(20px, 2.4vw, 26px)",
              fontWeight: 700,
              color: "#0f172a",
              margin: "0 0 6px 0",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              letterSpacing: "0.5px",
              lineHeight: 1.3,
            }}
          >
            <span>🌊</span> Assess. Analyze. Protect Water Quality.
          </h1>
          <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
            Welcome back, <strong style={{ color: "#0f172a" }}>{currentUser.name}</strong> ({formatRole(currentUser.role)})
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={fetchDashboardData}
            style={{
              padding: "6px 12px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              backgroundColor: "#ffffff",
              fontSize: "12px",
              fontWeight: "600",
              color: "#475569",
              cursor: "pointer",
            }}
            title="Refresh database records"
          >
            🔄 Refresh
          </button>
          <div
            style={{
              backgroundColor: "#f1f5f9",
              padding: "8px 16px",
              borderRadius: "20px",
              fontSize: "13px",
              fontWeight: "600",
              color: "#334155",
            }}
          >
            📅 {currentDate}
          </div>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "24px",
        }}
      >
        <button
          onClick={() => (window.location.href = "/samples")}
          style={{
            padding: "10px 18px",
            borderRadius: "8px",
            border: "none",
            backgroundColor: "#059669",
            color: "#ffffff",
            fontSize: "14px",
            fontWeight: "600",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: "0 2px 8px rgba(5, 150, 105, 0.25)",
          }}
        >
          <span>➕</span> Add Water Sample
        </button>

        <button
          onClick={() => (window.location.href = "/assessments")}
          style={{
            padding: "10px 18px",
            borderRadius: "8px",
            border: "none",
            backgroundColor: "#4f46e5",
            color: "#ffffff",
            fontSize: "14px",
            fontWeight: "600",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: "0 2px 8px rgba(79, 70, 229, 0.25)",
          }}
        >
          <span>⚡</span> Generate Assessment
        </button>

        <button
          onClick={onNavigateToGIS || (() => (window.location.href = "/gis"))}
          style={{
            padding: "10px 18px",
            borderRadius: "8px",
            border: "none",
            backgroundColor: "#0284c7",
            color: "#ffffff",
            fontSize: "14px",
            fontWeight: "600",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: "0 2px 8px rgba(2, 132, 199, 0.25)",
          }}
        >
          <span>🗺️</span> Open Interactive GIS Map
        </button>
      </div>

      {/* Real Statistics Cards from MongoDB */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        {statsList.map((stat, idx) => (
          <div
            key={idx}
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              padding: "18px 20px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ fontSize: "13px", fontWeight: "600", color: "#64748b", marginBottom: "4px" }}>
                {stat.title}
              </div>
              <div style={{ fontSize: "26px", fontWeight: "800", color: "#0f172a" }}>
                {loading ? "..." : stat.value}
              </div>
            </div>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                backgroundColor: stat.bgColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "22px",
              }}
            >
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid: Recent Assessments & Top Polluted Locations from MongoDB */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
          gap: "20px",
        }}
      >
        {/* Recent Assessments Table */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            padding: "20px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            overflowX: "auto",
          }}
        >
          <div
            style={{
              fontSize: "16px",
              fontWeight: "700",
              color: "#0f172a",
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span>📝</span> Recent Database Assessments
            </span>
            <span style={{ fontSize: "12px", color: "#64748b" }}>Live MongoDB Stream</span>
          </div>

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
                <th style={{ padding: "10px 12px", borderRadius: "6px 0 0 6px" }}>Sample ID</th>
                <th style={{ padding: "10px 12px" }}>Location</th>
                <th style={{ padding: "10px 12px" }}>Risk Level</th>
                <th style={{ padding: "10px 12px" }}>HPI</th>
                <th style={{ padding: "10px 12px", borderRadius: "0 6px 6px 0" }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentAssessments.length > 0 ? (
                recentAssessments.map((row, i) => {
                  const badgeStyle = getRiskBadgeColor(row.risk);
                  return (
                    <tr
                      key={row.id || i}
                      style={{ borderBottom: "1px solid #f1f5f9" }}
                    >
                      <td style={{ padding: "12px", fontWeight: "700", color: "#0284c7" }}>
                        {row.id}
                      </td>
                      <td style={{ padding: "12px", fontWeight: "600", color: "#0f172a" }}>
                        {row.name}
                      </td>
                      <td style={{ padding: "12px" }}>
                        <span
                          style={{
                            backgroundColor: badgeStyle.bg,
                            color: badgeStyle.text,
                            padding: "3px 8px",
                            borderRadius: "4px",
                            fontWeight: "700",
                            fontSize: "11px",
                          }}
                        >
                          {row.risk}
                        </span>
                      </td>
                      <td style={{ padding: "12px", fontWeight: "700", color: "#334155" }}>
                        {row.hpi}
                      </td>
                      <td style={{ padding: "12px", color: "#64748b" }}>{row.date}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} style={{ padding: "24px", textAlign: "center", color: "#94a3b8" }}>
                    {loading ? "Loading database records..." : "No water sample records found in MongoDB."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Top Polluted Locations */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            padding: "20px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}
        >
          <div
            style={{
              fontSize: "16px",
              fontWeight: "700",
              color: "#0f172a",
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span>🔥</span> Top Polluted Locations (MongoDB)
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {topPollutedLocations.length > 0 ? (
              topPollutedLocations.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    padding: "12px 16px",
                    borderRadius: "8px",
                    backgroundColor: "#f8fafc",
                    border: "1px solid #f1f5f9",
                  }}
                >
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "8px",
                      backgroundColor: item.rank === 1 ? "#ef4444" : "#475569",
                      color: "#ffffff",
                      fontWeight: "800",
                      fontSize: "13px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {item.rank || idx + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: "700", fontSize: "14px", color: "#0f172a" }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                      {item.zone}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: "24px", textAlign: "center", color: "#94a3b8" }}>
                {loading ? "Loading top locations..." : "No location data available in MongoDB."}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
