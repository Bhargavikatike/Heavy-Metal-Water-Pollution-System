import React from "react";

/**
 * Pollution Risk Levels Map Legend Component.
 * Fixed inside the bottom-left corner of the GIS map container.
 */
function PollutionLegend() {
  const riskLevels = [
    { label: "High Risk (🔴 Source)", color: "#ef4444" },
    { label: "Medium Risk (🟠 Center)", color: "#f97316" },
    { label: "Low Risk (🟢 Outflow)", color: "#22c55e" },
  ];

  return (
    <div
      style={{
        position: "absolute",
        bottom: "16px",
        left: "16px",
        zIndex: 1000,
        backgroundColor: "rgba(255, 255, 255, 0.94)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        borderRadius: "12px",
        padding: "12px 16px",
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
        border: "1px solid rgba(226, 232, 240, 0.9)",
        minWidth: "170px",
        pointerEvents: "auto",
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      {/* Legend Title */}
      <div
        style={{
          fontSize: "12px",
          fontWeight: "700",
          color: "#0f172a",
          marginBottom: "10px",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          borderBottom: "1px solid #f1f5f9",
          paddingBottom: "4px",
        }}
      >
        Map Legend & Contamination
      </div>

      {/* Point Source Icons */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          marginBottom: "10px",
          paddingBottom: "8px",
          borderBottom: "1px dashed #e2e8f0",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", fontWeight: "600", color: "#334155" }}>
          <span>🏭</span>
          <span>Industrial Point Source</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", fontWeight: "600", color: "#334155" }}>
          <span>💧</span>
          <span>Water Sample Source</span>
        </div>
      </div>

      {/* Risk / Contamination Levels */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {riskLevels.map((item) => (
          <div
            key={item.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "12px",
              fontWeight: "600",
              color: "#334155",
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                backgroundColor: item.color,
                boxShadow: `0 0 6px ${item.color}aa`,
              }}
            />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PollutionLegend;
