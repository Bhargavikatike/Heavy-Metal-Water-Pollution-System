import React, { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

/**
 * PollutionAnalytics Component (Pie Chart Only)
 * Displays a clean, interactive Pie Chart under the Pollution Analytics Dashboard
 * visualizing pollution distribution across all monitored locations.
 * Completely replaces all bar charts, line graphs, and ranking tables.
 */
function PollutionAnalytics({ waterBodies = [] }) {
  const [viewType, setViewType] = useState("risk"); // "risk" or "location"

  // 1. Risk Tier Data Distribution
  const highRiskCount = waterBodies.filter(
    (w) => w.pollution === "High" || w.pollution === "Critical" || Number(w.hpi) >= 100
  ).length;
  const mediumRiskCount = waterBodies.filter(
    (w) => (w.pollution === "Medium" || (Number(w.hpi) >= 60 && Number(w.hpi) < 100)) && w.pollution !== "High" && w.pollution !== "Critical"
  ).length;
  const lowRiskCount = Math.max(
    0,
    waterBodies.length - highRiskCount - mediumRiskCount
  );

  const riskData = [
    { name: "High Risk Pollution", value: highRiskCount, color: "#ef4444" },
    { name: "Medium Risk Pollution", value: mediumRiskCount, color: "#f97316" },
    { name: "Low Risk Pollution", value: lowRiskCount, color: "#10b981" },
  ].filter((item) => item.value > 0);

  // 2. Location HPI Share Distribution
  const locationColors = [
    "#ef4444", "#f97316", "#f59e0b", "#10b981", "#3b82f6",
    "#8b5cf6", "#ec4899", "#06b6d4", "#64748b", "#84cc16"
  ];

  const locationData = waterBodies.map((w, idx) => ({
    name: w.name || `Location ${idx + 1}`,
    value: Number(w.hpi) || 10,
    hpi: Number(w.hpi) || 0,
    mi: Number(w.mi) || 0,
    pli: Number(w.pli) || 0,
    pollution: w.pollution || "Low",
    color: locationColors[idx % locationColors.length],
  }));

  const activeData = viewType === "risk" ? riskData : locationData;

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (percent < 0.04) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={13}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div style={{ marginTop: "32px", padding: "0 4px", fontFamily: "'Poppins', sans-serif" }}>
      {/* Section Header */}
      <div
        style={{
          marginBottom: "24px",
          backgroundColor: "#ffffff",
          padding: "20px 24px",
          borderRadius: "16px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
        }}
      >
        <div>
          <h2
            style={{
              fontSize: "22px",
              fontWeight: "700",
              color: "#0f172a",
              margin: "0 0 6px 0",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <span>📊</span> Pollution Analytics Dashboard
          </h2>
          <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
            Proportional pie chart breakdown of pollution risk levels and indices across monitored locations.
          </p>
        </div>

        {/* View Toggle Tabs */}
        <div style={{ display: "flex", backgroundColor: "#f1f5f9", padding: "4px", borderRadius: "10px", gap: "4px" }}>
          <button
            onClick={() => setViewType("risk")}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              border: "none",
              backgroundColor: viewType === "risk" ? "#ffffff" : "transparent",
              color: viewType === "risk" ? "#0f172a" : "#64748b",
              fontWeight: "600",
              fontSize: "13px",
              cursor: "pointer",
              boxShadow: viewType === "risk" ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
              fontFamily: "'Poppins', sans-serif",
            }}
          >
            By Pollution Risk Level
          </button>
          <button
            onClick={() => setViewType("location")}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              border: "none",
              backgroundColor: viewType === "location" ? "#ffffff" : "transparent",
              color: viewType === "location" ? "#0f172a" : "#64748b",
              fontWeight: "600",
              fontSize: "13px",
              cursor: "pointer",
              boxShadow: viewType === "location" ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
              fontFamily: "'Poppins', sans-serif",
            }}
          >
            By Location HPI Contribution
          </button>
        </div>
      </div>

      {/* Main Pie Chart Card Container */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          padding: "28px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)",
          border: "1px solid #e2e8f0",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "32px",
          alignItems: "center",
        }}
      >
        {/* Pie Chart Visualization */}
        <div style={{ width: "100%", height: "360px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={activeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={140}
                innerRadius={55}
                dataKey="value"
                paddingAngle={4}
              >
                {activeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #cbd5e1",
                  borderRadius: "10px",
                  boxShadow: "0 4px 14px rgba(0,0,0,0.1)",
                  fontFamily: "'Poppins', sans-serif",
                }}
              />
              <Legend wrapperStyle={{ paddingTop: "20px" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Detailed Breakdown Legend Card Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a", margin: "0 0 4px 0" }}>
            {viewType === "risk" ? "Risk Classification Breakdown" : "Location Index Share"}
          </h3>
          <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 12px 0" }}>
            Total monitored locations: <strong>{waterBodies.length}</strong>
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "300px", overflowY: "auto", paddingRight: "4px" }}>
            {activeData.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  backgroundColor: "#f8fafc",
                  border: "1px solid #f1f5f9",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span
                    style={{
                      width: "12px",
                      height: "12px",
                      borderRadius: "50%",
                      backgroundColor: item.color,
                      display: "inline-block",
                    }}
                  />
                  <span style={{ fontSize: "14px", fontWeight: "600", color: "#0f172a" }}>
                    {item.name}
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  {item.hpi !== undefined && (
                    <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "500" }}>
                      HPI: <strong>{item.hpi}</strong>
                    </span>
                  )}
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: "700",
                      color: "#1e293b",
                      backgroundColor: "#e2e8f0",
                      padding: "3px 10px",
                      borderRadius: "12px",
                    }}
                  >
                    {item.value} {viewType === "risk" ? "locations" : "pts"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PollutionAnalytics;
