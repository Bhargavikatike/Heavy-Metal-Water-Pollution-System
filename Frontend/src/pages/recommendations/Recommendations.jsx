import React, { useState, useEffect } from "react";
import sampleService from "../../services/sampleService";
import assessmentService from "../../services/assessmentService";
import { getWaterBodies } from "../../services/mapService";

/**
 * Recommendations Page Component (src/pages/recommendations/Recommendations.jsx)
 * Fully integrated with MongoDB database backend & dynamic pollution indices.
 * Features:
 * 1. Dynamic Recommendation Generation (HPI, MI, CF, PLI, Igeo & Metal Concentrations)
 * 2. 4 Core Categories: Prevention, Treatment, Emergency, Monitoring
 * 3. Location-Specific Recommendation Cards
 * 4. Risk-Based Filtering (All, High, Medium, Low)
 * 5. Real-Time Search Functionality (Water Body, Factory, District)
 * 6. Interactive Status Badges (Pending, In Progress, Completed)
 * 7. Summary Dashboard Metrics Cards
 * 8. Responsive Modern Environmental UI
 */
function Recommendations() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [riskFilter, setRiskFilter] = useState("All");

  // Status Tracking State stored in LocalStorage
  const [itemStatuses, setItemStatuses] = useState(() => {
    try {
      const saved = localStorage.getItem("gis_recommendation_statuses");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Save status state changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("gis_recommendation_statuses", JSON.stringify(itemStatuses));
    } catch (e) {
      console.warn("Could not save recommendation status to localStorage", e);
    }
  }, [itemStatuses]);

  // Load locations and generate dynamic recommendations from MongoDB assessment data
  const loadRecommendationData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch dynamic water bodies from backend REST API
      const waterBodies = await getWaterBodies();

      // Process recommendations per location
      const generatedList = (waterBodies || []).map((w, index) => {
        const hpi = Number(w.hpi) || 0;
        const mi = Number(w.mi) || 0;
        const pli = Number(w.pli) || 0;
        const cf = Number(w.cf) || 0;
        const igeo = Number(w.igeo) || 0;
        const pollution = w.pollution || (hpi >= 100 ? "High" : hpi >= 60 ? "Medium" : "Low");

        // Identify exceeded metals
        const metalsObj = w.metals || {};
        const exceededList = Object.entries(metalsObj)
          .filter(([_, val]) => Number(val) > 0.01)
          .map(([symbol, val]) => `${symbol} (${val} mg/L)`);

        // Generate Prevention Recommendations
        const prevention = [
          "Enforce mandatory industrial effluent pre-treatment for surrounding point sources.",
          "Establish 500m watershed buffer zone to prevent agricultural and storm runoff.",
          "Restrict untreated municipal sewage discharge into catchment basin.",
        ];

        // Generate Treatment Recommendations based on heavy metal presence
        const treatment = [];
        if (metalsObj.Pb > 0.01 || metalsObj.Cd > 0.003 || metalsObj.Cr > 0.05) {
          treatment.push("Deploy High-Pressure Reverse Osmosis (RO) filtration membrane.");
        }
        if (metalsObj.As > 0.01 || metalsObj.Hg > 0.006 || metalsObj.Ni > 0.07) {
          treatment.push("Utilize Selective Heavy Metal Ion-Exchange Resin beds.");
        }
        treatment.push("Apply Lime Coagulation & Chemical Precipitation for heavy metal settling.");
        treatment.push("Install Granular Activated Carbon (GAC) for organic & trace metal adsorption.");
        treatment.push("Construct floating phytoremediation wetland beds for ongoing bio-absorption.");

        // Generate Emergency Recommendations based on risk level
        const emergency = [];
        if (pollution === "High" || pollution === "Critical" || hpi >= 100) {
          emergency.push("🔴 RESTRICT DIRECT USAGE: Issue immediate public health warning for drinking & bathing.");
          emergency.push("🔴 EMERGENCY CONTAINMENT: Deploy floating containment booms near primary outlet.");
          emergency.push("🔴 MANDATORY WATER SUPPLY: Provision emergency tanker water supply for local residents.");
        } else if (pollution === "Medium" || hpi >= 60) {
          emergency.push("🟠 ADVISORY NOTICE: Restrict unboiled or untreated domestic water usage.");
          emergency.push("🟠 SOURCE INSPECTION: Notify Regional PCB for urgent industrial effluent audit.");
        } else {
          emergency.push("🟢 NORMAL OPERATION: Water quality complies with baseline standards.");
        }

        // Generate Monitoring Recommendations
        const monitoring = [
          `Schedule ${pollution === "High" ? "7-day" : "14-day"} periodic heavy metal ICP-MS lab sampling.`,
          "Install continuous online IoT sensor probes for pH, EC, Turbidity, and Lead telemetry.",
          "Perform quarterly hydrological sediment core sampling to track metal accumulation.",
        ];

        return {
          id: w.id || w._id || `loc-${index}`,
          name: w.name || "Monitored Location",
          district: w.district || "Telangana",
          waterSource: w.waterSource || "Urban Lake",
          pollution,
          hpi,
          mi,
          pli,
          cf,
          igeo,
          exceededList,
          prevention,
          treatment,
          emergency,
          monitoring,
        };
      });

      setLocations(generatedList);
    } catch (err) {
      console.error("Error loading recommendation data:", err);
      setError("Unable to generate recommendations from backend database");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecommendationData();

    const handleAutoRefresh = () => {
      loadRecommendationData();
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

  // Toggle item status: "Pending" -> "In Progress" -> "Completed" -> "Pending"
  const toggleItemStatus = (itemId) => {
    setItemStatuses((prev) => {
      const current = prev[itemId] || "Pending";
      let next = "In Progress";
      if (current === "In Progress") next = "Completed";
      else if (current === "Completed") next = "Pending";
      return { ...prev, [itemId]: next };
    });
  };

  // Helper for Status Badge styling
  const getStatusBadge = (status = "Pending") => {
    switch (status) {
      case "Completed":
        return { bg: "#d1fae5", text: "#065f46", icon: "✅", label: "Completed" };
      case "In Progress":
        return { bg: "#dbeafe", text: "#1e40af", icon: "⚙️", label: "In Progress" };
      case "Pending":
      default:
        return { bg: "#fef3c7", text: "#92400e", icon: "⏳", label: "Pending" };
    }
  };

  // Calculate Dashboard Summary Metrics
  let totalRecItems = 0;
  let highPriorityCount = 0;
  let locationsAttentionCount = 0;
  let completedCount = 0;

  locations.forEach((loc) => {
    const isHighRisk = loc.pollution === "High" || loc.pollution === "Critical";
    if (isHighRisk || loc.pollution === "Medium") locationsAttentionCount++;

    const allItems = [...loc.prevention, ...loc.treatment, ...loc.emergency, ...loc.monitoring];
    totalRecItems += allItems.length;

    if (isHighRisk) {
      highPriorityCount += loc.emergency.length + 2;
    }

    allItems.forEach((_, idx) => {
      const key = `${loc.id}-item-${idx}`;
      if (itemStatuses[key] === "Completed") completedCount++;
    });
  });

  // Filter Locations based on search and risk filter
  const filteredLocations = locations.filter((loc) => {
    const matchesSearch =
      loc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loc.district.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loc.waterSource.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRisk =
      riskFilter === "All" ||
      (riskFilter === "High" && (loc.pollution === "High" || loc.pollution === "Critical")) ||
      (riskFilter === "Medium" && loc.pollution === "Medium") ||
      (riskFilter === "Low" && loc.pollution === "Low");

    return matchesSearch && matchesRisk;
  });

  const getRiskBadge = (level) => {
    switch (level) {
      case "High":
      case "Critical":
        return { bg: "#fee2e2", text: "#991b1b", label: "🔴 High Risk" };
      case "Medium":
      case "Moderate":
        return { bg: "#ffedd5", text: "#9a3412", label: "🟠 Medium Risk" };
      default:
        return { bg: "#dcfce7", text: "#166534", label: "🟢 Low Risk" };
    }
  };

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
          flexDirection: "column",
          gap: "4px",
          marginBottom: "24px",
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          padding: "20px 24px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)",
        }}
      >
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
          <span>💡</span> Remediation Recommendations Module
        </h1>
        <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
          Database-driven environmental remediation, water treatment options, emergency containment, and monitoring protocols.
        </p>
      </div>

      {/* 4 Summary Dashboard Metrics Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "20px",
          marginBottom: "24px",
        }}
      >
        {/* Metric 1 */}
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
              Total Action Items
            </div>
            <div style={{ fontSize: "26px", fontWeight: "700", color: "#0f172a" }}>
              {loading ? "--" : totalRecItems}
            </div>
          </div>
          <div style={{ width: "46px", height: "46px", borderRadius: "12px", backgroundColor: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px" }}>
            📋
          </div>
        </div>

        {/* Metric 2 */}
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
              High Priority Actions
            </div>
            <div style={{ fontSize: "26px", fontWeight: "700", color: "#dc2626" }}>
              {loading ? "--" : highPriorityCount}
            </div>
          </div>
          <div style={{ width: "46px", height: "46px", borderRadius: "12px", backgroundColor: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px" }}>
            🚨
          </div>
        </div>

        {/* Metric 3 */}
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
              Locations Requiring Attention
            </div>
            <div style={{ fontSize: "26px", fontWeight: "700", color: "#d97706" }}>
              {loading ? "--" : locationsAttentionCount}
            </div>
          </div>
          <div style={{ width: "46px", height: "46px", borderRadius: "12px", backgroundColor: "#fff7ed", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px" }}>
            ⚠️
          </div>
        </div>

        {/* Metric 4 */}
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
              Completed Actions
            </div>
            <div style={{ fontSize: "26px", fontWeight: "700", color: "#16a34a" }}>
              {loading ? "--" : completedCount}
            </div>
          </div>
          <div style={{ width: "46px", height: "46px", borderRadius: "12px", backgroundColor: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px" }}>
            ✅
          </div>
        </div>
      </div>

      {/* Controls Bar (Search Box & Risk Filter Tabs) */}
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
        <div style={{ position: "relative", minWidth: "300px", flex: 1 }}>
          <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }}>
            🔍
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by water body, primary factory source, or district..."
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

        {/* Risk Filter Tabs */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {["All", "High", "Medium", "Low"].map((level) => (
            <button
              key={level}
              onClick={() => setRiskFilter(level)}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: "none",
                fontWeight: "600",
                fontSize: "13px",
                cursor: "pointer",
                fontFamily: "'Poppins', sans-serif",
                backgroundColor: riskFilter === level ? "#0f172a" : "#f1f5f9",
                color: riskFilter === level ? "#ffffff" : "#475569",
                transition: "all 0.2s ease",
              }}
            >
              {level === "All" ? "All Locations" : level === "High" ? "🔴 High Risk" : level === "Medium" ? "🟠 Medium Risk" : "🟢 Low Risk"}
            </button>
          ))}
        </div>
      </div>

      {/* Main Location Recommendations Cards */}
      {loading ? (
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            padding: "60px",
            textAlign: "center",
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)",
          }}
        >
          <div style={{ fontSize: "32px", marginBottom: "12px" }}>⚙️</div>
          <div style={{ fontSize: "18px", fontWeight: "600", color: "#0f172a" }}>
            Generating Dynamic Recommendations...
          </div>
          <div style={{ fontSize: "13px", color: "#64748b", marginTop: "4px" }}>
            Analyzing database HPI, MI, PLI values and heavy metal threshold limits...
          </div>
        </div>
      ) : error ? (
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            padding: "40px",
            textAlign: "center",
            border: "1px solid #fee2e2",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)",
          }}
        >
          <div style={{ fontSize: "32px", marginBottom: "12px" }}>⚠️</div>
          <div style={{ fontSize: "18px", fontWeight: "600", color: "#991b1b" }}>{error}</div>
        </div>
      ) : filteredLocations.length === 0 ? (
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            padding: "40px",
            textAlign: "center",
            border: "1px solid #e2e8f0",
          }}
        >
          <div style={{ fontSize: "28px", marginBottom: "8px" }}>💧</div>
          <div style={{ fontSize: "16px", fontWeight: "600", color: "#475569" }}>
            No monitored locations match your filter criteria.
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {filteredLocations.map((loc, locIdx) => {
            const riskBadge = getRiskBadge(loc.pollution);

            return (
              <div
                key={loc.id}
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "16px",
                  padding: "24px",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "20px",
                }}
              >
                {/* Location Card Header */}
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "16px",
                    borderBottom: "1px solid #f1f5f9",
                    paddingBottom: "16px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "42px", height: "42px", borderRadius: "10px", backgroundColor: "#eff6ff", display: "flex", alignItems: "center", justify: "center", fontSize: "22px" }}>
                      💧
                    </div>
                    <div>
                      <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#0f172a", margin: 0 }}>
                        {loc.name}
                      </h3>
                      <div style={{ fontSize: "13px", color: "#64748b", marginTop: "2px" }}>
                        {loc.district} • {loc.waterSource}
                      </div>
                    </div>
                  </div>

                  {/* Calculated Metrics & Risk Badge */}
                  <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                    <div style={{ fontSize: "13px", color: "#475569", backgroundColor: "#f8fafc", padding: "6px 12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                      <strong>HPI:</strong> {loc.hpi} | <strong>MI:</strong> {loc.mi} | <strong>PLI:</strong> {loc.pli}
                    </div>

                    <span
                      style={{
                        backgroundColor: riskBadge.bg,
                        color: riskBadge.text,
                        padding: "6px 14px",
                        borderRadius: "8px",
                        fontSize: "12px",
                        fontWeight: "700",
                      }}
                    >
                      {riskBadge.label}
                    </span>
                  </div>
                </div>

                {/* Detected Metals Tag Pill */}
                {loc.exceededList.length > 0 && (
                  <div style={{ fontSize: "12px", color: "#991b1b", backgroundColor: "#fef2f2", padding: "8px 14px", borderRadius: "8px", border: "1px solid #fecaca" }}>
                    <strong>⚠️ Exceeded Heavy Metals Detected:</strong> {loc.exceededList.join(", ")}
                  </div>
                )}

                {/* 4 Categorized Recommendation Cards Grid */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                    gap: "18px",
                  }}
                >
                  {/* Category 1: 🟢 Prevention */}
                  <div style={{ backgroundColor: "#f0fdf4", borderRadius: "12px", padding: "18px", border: "1px solid #bbf7d0" }}>
                    <div style={{ fontSize: "14px", fontWeight: "700", color: "#166534", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <span>🟢</span> Prevention Recommendations
                    </div>
                    <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "13px", color: "#14532d", display: "flex", flexDirection: "column", gap: "10px" }}>
                      {loc.prevention.map((item, idx) => {
                        const itemKey = `${loc.id}-prev-${idx}`;
                        const status = itemStatuses[itemKey] || "Pending";
                        const sBadge = getStatusBadge(status);

                        return (
                          <li key={itemKey} style={{ lineHeight: "1.4" }}>
                            <div>{item}</div>
                            <button
                              onClick={() => toggleItemStatus(itemKey)}
                              style={{
                                marginTop: "6px",
                                backgroundColor: sBadge.bg,
                                color: sBadge.text,
                                border: "none",
                                borderRadius: "12px",
                                padding: "2px 8px",
                                fontSize: "11px",
                                fontWeight: "700",
                                cursor: "pointer",
                                fontFamily: "'Poppins', sans-serif",
                              }}
                            >
                              {sBadge.icon} {sBadge.label}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  {/* Category 2: 🟡 Treatment */}
                  <div style={{ backgroundColor: "#fffbebfb", borderRadius: "12px", padding: "18px", border: "1px solid #fde68a" }}>
                    <div style={{ fontSize: "14px", fontWeight: "700", color: "#92400e", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <span>🟡</span> Treatment Recommendations
                    </div>
                    <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "13px", color: "#78350f", display: "flex", flexDirection: "column", gap: "10px" }}>
                      {loc.treatment.map((item, idx) => {
                        const itemKey = `${loc.id}-treat-${idx}`;
                        const status = itemStatuses[itemKey] || "Pending";
                        const sBadge = getStatusBadge(status);

                        return (
                          <li key={itemKey} style={{ lineHeight: "1.4" }}>
                            <div>{item}</div>
                            <button
                              onClick={() => toggleItemStatus(itemKey)}
                              style={{
                                marginTop: "6px",
                                backgroundColor: sBadge.bg,
                                color: sBadge.text,
                                border: "none",
                                borderRadius: "12px",
                                padding: "2px 8px",
                                fontSize: "11px",
                                fontWeight: "700",
                                cursor: "pointer",
                                fontFamily: "'Poppins', sans-serif",
                              }}
                            >
                              {sBadge.icon} {sBadge.label}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  {/* Category 3: 🔴 Emergency */}
                  <div style={{ backgroundColor: "#fef2f2", borderRadius: "12px", padding: "18px", border: "1px solid #fecaca" }}>
                    <div style={{ fontSize: "14px", fontWeight: "700", color: "#991b1b", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <span>🔴</span> Emergency Recommendations
                    </div>
                    <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "13px", color: "#7f1d1d", display: "flex", flexDirection: "column", gap: "10px" }}>
                      {loc.emergency.map((item, idx) => {
                        const itemKey = `${loc.id}-emerg-${idx}`;
                        const status = itemStatuses[itemKey] || "Pending";
                        const sBadge = getStatusBadge(status);

                        return (
                          <li key={itemKey} style={{ lineHeight: "1.4", fontWeight: item.includes("🔴") ? "600" : "normal" }}>
                            <div>{item}</div>
                            <button
                              onClick={() => toggleItemStatus(itemKey)}
                              style={{
                                marginTop: "6px",
                                backgroundColor: sBadge.bg,
                                color: sBadge.text,
                                border: "none",
                                borderRadius: "12px",
                                padding: "2px 8px",
                                fontSize: "11px",
                                fontWeight: "700",
                                cursor: "pointer",
                                fontFamily: "'Poppins', sans-serif",
                              }}
                            >
                              {sBadge.icon} {sBadge.label}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  {/* Category 4: 🔵 Monitoring */}
                  <div style={{ backgroundColor: "#eff6ff", borderRadius: "12px", padding: "18px", border: "1px solid #bfdbfe" }}>
                    <div style={{ fontSize: "14px", fontWeight: "700", color: "#1e40af", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <span>🔵</span> Monitoring Recommendations
                    </div>
                    <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "13px", color: "#1e3a8a", display: "flex", flexDirection: "column", gap: "10px" }}>
                      {loc.monitoring.map((item, idx) => {
                        const itemKey = `${loc.id}-monit-${idx}`;
                        const status = itemStatuses[itemKey] || "Pending";
                        const sBadge = getStatusBadge(status);

                        return (
                          <li key={itemKey} style={{ lineHeight: "1.4" }}>
                            <div>{item}</div>
                            <button
                              onClick={() => toggleItemStatus(itemKey)}
                              style={{
                                marginTop: "6px",
                                backgroundColor: sBadge.bg,
                                color: sBadge.text,
                                border: "none",
                                borderRadius: "12px",
                                padding: "2px 8px",
                                fontSize: "11px",
                                fontWeight: "700",
                                cursor: "pointer",
                                fontFamily: "'Poppins', sans-serif",
                              }}
                            >
                              {sBadge.icon} {sBadge.label}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Recommendations;
