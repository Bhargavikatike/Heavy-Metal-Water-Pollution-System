import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import { getFactories, getWaterBodies, IS_DEMO_MODE } from "../services/mapService";
import {
  factoryIcon,
  waterIcon,
  highlightedFactoryIcon,
  highlightedWaterIcon,
} from "../assets/icons";
import DashboardStats from "./DashboardStats";
import PollutionLegend from "./PollutionLegend";
import PollutionHeatmap from "./PollutionHeatmap";
import PollutionAnalytics from "./PollutionAnalytics";
import ContaminationOverlays from "./ContaminationOverlays";

/**
 * Sub-component to handle map navigation and zooming smoothly.
 * Triggers Leaflet flyTo when a location is selected from search.
 */
function MapController({ selectedLocation }) {
  const map = useMap();

  useEffect(() => {
    if (selectedLocation && selectedLocation.lat && selectedLocation.lng) {
      map.flyTo([selectedLocation.lat, selectedLocation.lng], 15, {
        animate: true,
        duration: 1.5,
      });
    }
  }, [selectedLocation, map]);

  return null;
}

function PollutionMap() {
  // Data States loaded via mapService layer
  const [factories, setFactories] = useState([]);
  const [waterBodies, setWaterBodies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Layer Visibility States (All layers enabled by default)
  const [showFactories, setShowFactories] = useState(true);
  const [showWaterBodies, setShowWaterBodies] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true); // Default ON for heatmap
  const [showContamination, setShowContamination] = useState(true); // Default ON for directional zones

  // Search & Navigation States
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [highlightedKey, setHighlightedKey] = useState(null);

  const markerRefs = useRef({});
  const searchContainerRef = useRef(null);

  // Fetch data asynchronously from service layer (Backend REST API)
  const loadMapData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [factoriesData, waterBodiesData] = await Promise.all([
        getFactories(),
        getWaterBodies(),
      ]);

      setFactories(factoriesData || []);
      setWaterBodies(waterBodiesData || []);
    } catch (err) {
      console.error("Error fetching GIS map data:", err);
      setError("Unable to load GIS data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMapData();

    // Listen to custom window events for automatic GIS updates
    const handleAutoRefresh = () => {
      loadMapData();
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

  // Close search suggestions dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Return badge color based on pollution severity
  const getColor = (level) => {
    switch (level) {
      case "High":
      case "Critical":
        return "#ef4444";
      case "Medium":
      case "Moderate":
        return "#f97316";
      default:
        return "#22c55e";
    }
  };

  // Filter search suggestions in real time based on user input
  const filteredFactories = factories
    .filter((f) =>
      f.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
    )
    .map((f) => ({ ...f, locationType: "factory", iconLabel: "🏭" }));

  const filteredWaterBodies = waterBodies
    .filter((w) =>
      w.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
    )
    .map((w) => ({ ...w, locationType: "waterBody", iconLabel: "💧" }));

  const suggestions = [...filteredFactories, ...filteredWaterBodies];

  // Handle selecting a location from search dropdown
  const handleSelectLocation = (item) => {
    setSearchQuery(item.name);
    setShowSuggestions(false);

    // Auto-enable layer if hidden so marker becomes visible
    if (item.locationType === "factory" && !showFactories) {
      setShowFactories(true);
    } else if (item.locationType === "waterBody" && !showWaterBodies) {
      setShowWaterBodies(true);
    }

    setSelectedLocation(item);

    const key = `${item.locationType}-${item.id}`;
    setHighlightedKey(key);

    // Briefly highlight selected marker for 3 seconds
    setTimeout(() => {
      setHighlightedKey(null);
    }, 3000);

    // Open popup after map zoom transition completes
    setTimeout(() => {
      if (markerRefs.current[key]) {
        markerRefs.current[key].openPopup();
      }
    }, 500);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setShowSuggestions(false);
  };

  // Calculate dynamic marker counts based on layer visibility
  const visibleFactoriesCount = showFactories ? factories.length : 0;
  const visibleWaterBodiesCount = showWaterBodies ? waterBodies.length : 0;

  if (loading && waterBodies.length === 0) {
    return (
      <div style={{ position: "relative", fontFamily: "'Poppins', sans-serif" }}>
        <DashboardStats factories={[]} waterBodies={[]} loading={true} />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            height: "400px",
            fontSize: "16px",
            fontWeight: "600",
            color: "#475569",
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)",
          }}
        >
          <div style={{ fontSize: "32px", marginBottom: "12px" }}>🌊</div>
          <div style={{ fontSize: "18px", color: "#0f172a" }}>Loading map data...</div>
          <div style={{ fontSize: "13px", color: "#64748b", marginTop: "4px" }}>
            Fetching live GIS spatial points and water pollution statistics from database...
          </div>
        </div>
      </div>
    );
  }

  if (error && waterBodies.length === 0) {
    return (
      <div style={{ position: "relative", fontFamily: "'Poppins', sans-serif" }}>
        <DashboardStats factories={[]} waterBodies={[]} loading={false} />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            height: "400px",
            fontSize: "16px",
            fontWeight: "600",
            color: "#ef4444",
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            border: "1px solid #fee2e2",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)",
          }}
        >
          <div style={{ fontSize: "32px", marginBottom: "12px" }}>⚠️</div>
          <div style={{ fontSize: "18px", color: "#991b1b" }}>Unable to load GIS data</div>
          <p style={{ fontSize: "13px", color: "#b91c1c", marginTop: "4px" }}>
            Could not retrieve spatial points from the database API server.
          </p>
          <button
            onClick={loadMapData}
            style={{
              marginTop: "16px",
              padding: "10px 20px",
              backgroundColor: "#2563eb",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              fontWeight: "600",
              fontSize: "14px",
              cursor: "pointer",
              fontFamily: "'Poppins', sans-serif",
            }}
          >
            Retry Loading Map
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "relative", fontFamily: "'Poppins', sans-serif" }}>
      {/* 4 Summary Dashboard Statistics Cards */}
      <DashboardStats factories={factories} waterBodies={waterBodies} />

      {/* Top Controls Bar (Search Bar) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          marginBottom: "24px",
        }}
      >
        {/* Real-time Search Bar Container */}
        <div
          ref={searchContainerRef}
          style={{
            position: "relative",
            width: "100%",
            maxWidth: "480px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              backgroundColor: "#ffffff",
              border: "1px solid #cbd5e1",
              borderRadius: "12px",
              padding: "10px 16px",
              boxShadow: "0 4px 14px rgba(0, 0, 0, 0.04)",
              transition: "border-color 0.2s ease, box-shadow 0.2s ease",
            }}
          >
            <span style={{ marginRight: "10px", fontSize: "16px", color: "#64748b" }}>
              🔍
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Search factory or water body by name..."
              style={{
                width: "100%",
                border: "none",
                outline: "none",
                fontSize: "14px",
                fontFamily: "'Poppins', sans-serif",
                color: "#1e293b",
                backgroundColor: "transparent",
              }}
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                title="Clear search"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "14px",
                  color: "#94a3b8",
                  padding: "0 4px",
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Search Dropdown Suggestions */}
          {showSuggestions && searchQuery.trim().length > 0 && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 6px)",
                left: 0,
                right: 0,
                zIndex: 2000,
                backgroundColor: "#ffffff",
                borderRadius: "12px",
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15)",
                border: "1px solid #e2e8f0",
                maxHeight: "280px",
                overflowY: "auto",
                fontFamily: "'Poppins', sans-serif",
              }}
            >
              {suggestions.length > 0 ? (
                suggestions.map((item) => (
                  <div
                    key={`${item.locationType}-${item.id}`}
                    onClick={() => handleSelectLocation(item)}
                    style={{
                      padding: "12px 16px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
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
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontSize: "18px" }}>{item.iconLabel}</span>
                      <div>
                        <div style={{ fontWeight: "600", fontSize: "14px", color: "#0f172a" }}>
                          {item.name}
                        </div>
                        <div style={{ fontSize: "12px", color: "#64748b" }}>
                          {item.locationType === "factory"
                            ? item.industryType || "Factory"
                            : "Water Body"}
                        </div>
                      </div>
                    </div>

                    <span
                      style={{
                        color: "white",
                        backgroundColor: getColor(item.pollution),
                        padding: "3px 8px",
                        borderRadius: "6px",
                        fontSize: "11px",
                        fontWeight: "600",
                      }}
                    >
                      {item.pollution}
                    </span>
                  </div>
                ))
              ) : (
                <div
                  style={{
                    padding: "14px",
                    color: "#94a3b8",
                    fontSize: "13px",
                    textAlign: "center",
                  }}
                >
                  No matching factory or water body found
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Container Wrapper for Leaflet Map, Layer Control, and Legend Overlays */}
      <div className="gis-map-container">
        {/* Floating Layer Control Panel (Top-Right Overlay) */}
        <div
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            zIndex: 1000,
            backgroundColor: "#ffffff",
            borderRadius: "10px",
            padding: "12px 16px",
            boxShadow: "0 4px 14px rgba(0, 0, 0, 0.15)",
            border: "1px solid #e2e8f0",
            minWidth: "190px",
            fontSize: "13px",
            color: "#1e293b",
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            style={{
              fontWeight: "700",
              fontSize: "14px",
              marginBottom: "8px",
              paddingBottom: "6px",
              borderBottom: "1px solid #f1f5f9",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              color: "#0f172a",
            }}
          >
            <span>🗺️</span>
            <span>Map Layers</span>
          </div>

          {/* Toggle Factories Layer */}
          <label
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
              marginBottom: "8px",
              userSelect: "none",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <input
                type="checkbox"
                checked={showFactories}
                onChange={(e) => setShowFactories(e.target.checked)}
                style={{
                  cursor: "pointer",
                  accentColor: "#ef4444",
                  width: "15px",
                  height: "15px",
                }}
              />
              <span style={{ fontWeight: "500" }}>🏭 Factories</span>
            </span>
            <span
              style={{
                backgroundColor: showFactories ? "#fee2e2" : "#f1f5f9",
                color: showFactories ? "#991b1b" : "#94a3b8",
                fontWeight: "700",
                fontSize: "11px",
                padding: "2px 7px",
                borderRadius: "12px",
                transition: "all 0.2s ease",
              }}
            >
              Factories: {visibleFactoriesCount}
            </span>
          </label>

          {/* Toggle Water Bodies Layer */}
          <label
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
              marginBottom: "8px",
              userSelect: "none",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <input
                type="checkbox"
                checked={showWaterBodies}
                onChange={(e) => setShowWaterBodies(e.target.checked)}
                style={{
                  cursor: "pointer",
                  accentColor: "#3b82f6",
                  width: "15px",
                  height: "15px",
                }}
              />
              <span style={{ fontWeight: "500" }}>💧 Water Bodies</span>
            </span>
            <span
              style={{
                backgroundColor: showWaterBodies ? "#dbeafe" : "#f1f5f9",
                color: showWaterBodies ? "#1e40af" : "#94a3b8",
                fontWeight: "700",
                fontSize: "11px",
                padding: "2px 7px",
                borderRadius: "12px",
                transition: "all 0.2s ease",
              }}
            >
              Water Bodies: {visibleWaterBodiesCount}
            </span>
          </label>

          {/* Toggle Heatmap Layer */}
          <label
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
              marginBottom: "8px",
              paddingTop: "6px",
              borderTop: "1px dashed #e2e8f0",
              userSelect: "none",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <input
                type="checkbox"
                checked={showHeatmap}
                onChange={(e) => setShowHeatmap(e.target.checked)}
                style={{
                  cursor: "pointer",
                  accentColor: "#f59e0b",
                  width: "15px",
                  height: "15px",
                }}
              />
              <span style={{ fontWeight: "500" }}>🔥 Show Heatmap</span>
            </span>
            <span
              style={{
                backgroundColor: showHeatmap ? "#fef3c7" : "#f1f5f9",
                color: showHeatmap ? "#92400e" : "#94a3b8",
                fontWeight: "700",
                fontSize: "11px",
                padding: "2px 7px",
                borderRadius: "12px",
                transition: "all 0.2s ease",
              }}
            >
              {showHeatmap ? "ON" : "OFF"}
            </span>
          </label>

          {/* Toggle Directional Contamination Zones Layer */}
          <label
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
              userSelect: "none",
              paddingTop: "4px",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <input
                type="checkbox"
                checked={showContamination}
                onChange={(e) => setShowContamination(e.target.checked)}
                style={{
                  cursor: "pointer",
                  accentColor: "#10b981",
                  width: "15px",
                  height: "15px",
                }}
              />
              <span style={{ fontWeight: "500" }}>🎯 Risk Zones</span>
            </span>
            <span
              style={{
                backgroundColor: showContamination ? "#d1fae5" : "#f1f5f9",
                color: showContamination ? "#065f46" : "#94a3b8",
                fontWeight: "700",
                fontSize: "11px",
                padding: "2px 7px",
                borderRadius: "12px",
                transition: "all 0.2s ease",
              }}
            >
              {showContamination ? "ON" : "OFF"}
            </span>
          </label>
        </div>

        {/* Floating Glassmorphism Pollution Legend (Bottom-Left Overlay) */}
        <PollutionLegend />

        {/* Leaflet Map */}
        <MapContainer
          center={[17.385, 78.4867]}
          zoom={11}
          style={{
            height: "100%",
            width: "100%",
            borderRadius: "8px",
            overflow: "hidden",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
          }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapController selectedLocation={selectedLocation} />

          {/* Directional Contamination Spread Overlays (Red, Orange, Green) */}
          {showContamination && (
            <ContaminationOverlays
              waterBodies={waterBodies}
              factories={factories}
            />
          )}

          {/* Pollution Intensity Heatmap Layer */}
          {showHeatmap && <PollutionHeatmap waterBodies={waterBodies} />}

          {/* Factories Layer */}
          {showFactories &&
            factories.map((factory) => {
              const key = `factory-${factory.id}`;
              const isHighlighted = highlightedKey === key;

              return (
                <Marker
                  key={key}
                  ref={(el) => (markerRefs.current[key] = el)}
                  position={[factory.lat, factory.lng]}
                  icon={isHighlighted ? highlightedFactoryIcon : factoryIcon}
                >
                  <Popup>
                    <div style={{ minWidth: "180px" }}>
                      <h3 style={{ margin: "0 0 8px 0", fontSize: "16px" }}>
                        🏭 {factory.name}
                      </h3>

                      <p style={{ margin: "4px 0" }}>
                        <strong>Industry Type:</strong> {factory.industryType}
                      </p>

                      <p style={{ margin: "6px 0 10px 0" }}>
                        <strong>Pollution Level:</strong>
                        <span
                          style={{
                            color: "white",
                            backgroundColor: getColor(factory.pollution),
                            padding: "3px 8px",
                            borderRadius: "4px",
                            marginLeft: "6px",
                            fontSize: "12px",
                            fontWeight: "bold",
                          }}
                        >
                          {factory.pollution}
                        </span>
                      </p>

                      <div style={{ marginTop: "8px" }}>
                        <strong>Heavy Metals Released (mg/L):</strong>
                        <ul style={{ margin: "4px 0", paddingLeft: "20px" }}>
                          {Object.entries(factory.metals || {}).map(
                            ([metal, value]) => (
                              <li key={metal}>
                                <strong>{metal}:</strong> {value}
                              </li>
                            )
                          )}
                        </ul>
                      </div>

                      <div
                        style={{
                          marginTop: "10px",
                          paddingTop: "6px",
                          borderTop: "1px solid #ddd",
                          fontSize: "11px",
                          color: "#64748b",
                          fontStyle: "italic",
                          textAlign: "center",
                        }}
                      >
                        {factory?.isDatabaseRecord ? "Database Industrial Record" : "Monitored Point Source"}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

          {/* Water Bodies Layer */}
          {showWaterBodies &&
            waterBodies.map((water) => {
              const key = `waterBody-${water.id}`;
              const isHighlighted = highlightedKey === key;

              return (
                <Marker
                  key={key}
                  ref={(el) => (markerRefs.current[key] = el)}
                  position={[water.lat, water.lng]}
                  icon={isHighlighted ? highlightedWaterIcon : waterIcon}
                >
                  <Popup>
                    <div style={{ minWidth: "180px" }}>
                      <h3 style={{ margin: "0 0 8px 0", fontSize: "16px" }}>
                        💧 {water.name}
                      </h3>

                      <p style={{ margin: "6px 0 10px 0" }}>
                        <strong>Pollution Level:</strong>
                        <span
                          style={{
                            color: "white",
                            backgroundColor: getColor(water.pollution),
                            padding: "3px 8px",
                            borderRadius: "4px",
                            marginLeft: "6px",
                            fontSize: "12px",
                            fontWeight: "bold",
                          }}
                        >
                          {water.pollution}
                        </span>
                      </p>

                      <div style={{ marginTop: "8px" }}>
                        <strong>Heavy Metals Detected (mg/L):</strong>
                        <ul style={{ margin: "4px 0", paddingLeft: "20px" }}>
                          {Object.entries(water.metals || {}).map(
                            ([metal, value]) => (
                              <li key={metal}>
                                <strong>{metal}:</strong> {value}
                              </li>
                            )
                          )}
                        </ul>
                      </div>

                      <div
                        style={{
                          marginTop: "8px",
                          paddingTop: "8px",
                          borderTop: "1px dashed #ccc",
                        }}
                      >
                        <strong style={{ display: "block", marginBottom: "4px" }}>
                          Pollution Indices:
                        </strong>
                        <p style={{ margin: "2px 0" }}>
                          <strong>HPI:</strong> {water.hpi}
                        </p>
                        <p style={{ margin: "2px 0" }}>
                          <strong>MI:</strong> {water.mi}
                        </p>
                        <p style={{ margin: "2px 0" }}>
                          <strong>CF:</strong> {water.cf}
                        </p>
                        <p style={{ margin: "2px 0" }}>
                          <strong>PLI:</strong> {water.pli}
                        </p>
                        <p style={{ margin: "2px 0" }}>
                          <strong>Igeo:</strong> {water.igeo}
                        </p>
                      </div>

                      <div
                        style={{
                          marginTop: "10px",
                          paddingTop: "6px",
                          borderTop: "1px solid #ddd",
                          fontSize: "11px",
                          color: "#64748b",
                          fontStyle: "italic",
                          textAlign: "center",
                        }}
                      >
                        {water?.isDatabaseRecord ? "Database Water Sample Record" : "Monitored Hydrological Body"}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
        </MapContainer>
      </div>

      {/* Feature #8: Pollution Analytics Charts Section */}
      <PollutionAnalytics waterBodies={waterBodies} />
    </div>
  );
}

export default PollutionMap;