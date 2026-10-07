import React from "react";

/**
 * Summary Statistics Cards for Heavy Metal Water Pollution Dashboard.
 * Displays:
 * 1. Total Factories count
 * 2. Total Water Bodies count
 * 3. High Risk Areas count (factories + water bodies with High pollution)
 * 4. Average HPI (Heavy Metal Pollution Index) from water bodies dataset
 */
function DashboardStats({ factories = [], waterBodies = [], loading = false }) {
  if (loading) {
    return (
      <div className="gis-stats-grid">
        {[1, 2, 3, 4].map((idx) => (
          <div
            key={idx}
            className="gis-card"
            style={{
              padding: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              opacity: 0.7,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "13px",
                  color: "#94a3b8",
                  marginBottom: "8px",
                  fontFamily: "'Poppins', sans-serif",
                }}
              >
                Loading pollution statistics...
              </div>
              <div style={{ fontSize: "20px", fontWeight: "600", color: "#cbd5e1" }}>
                --
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Card 1: Total Factories
  const totalFactories = factories.length;

  // Card 2: Total Water Bodies
  const totalWaterBodies = waterBodies.length;

  // Card 3: High Risk Areas (Factories + Water Bodies where pollution === "High" or "Critical")
  const highRiskFactories = factories.filter(
    (f) => f.pollution === "High" || f.pollution === "Critical"
  ).length;
  const highRiskWaterBodies = waterBodies.filter(
    (w) => w.pollution === "High" || w.pollution === "Critical"
  ).length;
  const highRiskAreas = highRiskFactories + highRiskWaterBodies;

  // Card 4: Average HPI from waterBodies dataset (formatted to 1 decimal place)
  const validHpiWaterBodies = waterBodies.filter(
    (w) => typeof w.hpi === "number" || !isNaN(Number(w.hpi))
  );
  const avgHpi =
    validHpiWaterBodies.length > 0
      ? (
          validHpiWaterBodies.reduce((sum, w) => sum + Number(w.hpi), 0) /
          validHpiWaterBodies.length
        ).toFixed(1)
      : "0.0";

  const stats = [
    {
      title: "Total Factories",
      value: totalFactories,
      icon: "🏭",
      bgColor: "#fef2f2",
    },
    {
      title: "Water Bodies",
      value: totalWaterBodies,
      icon: "💧",
      bgColor: "#eff6ff",
    },
    {
      title: "High Risk Areas",
      value: highRiskAreas,
      icon: "⚠️",
      bgColor: "#fff7ed",
    },
    {
      title: "Average HPI",
      value: avgHpi,
      icon: "📊",
      bgColor: "#f0fdf4",
    },
  ];

  return (
    <div className="gis-stats-grid">
      {stats.map((stat, idx) => (
        <div
          key={idx}
          className="gis-card"
          style={{
            padding: "18px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            cursor: "default",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "13px",
                fontWeight: "600",
                color: "#64748b",
                marginBottom: "6px",
                fontFamily: "'Poppins', sans-serif",
              }}
            >
              {stat.title}
            </div>
            <div
              style={{
                fontSize: "24px",
                fontWeight: "700",
                color: "#0f172a",
                fontFamily: "'Poppins', sans-serif",
              }}
            >
              {stat.value}
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
  );
}

export default DashboardStats;
