import React, { Component } from "react";
import PollutionMap from "../components/PollutionMap";

class GISErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("GIS Dashboard caught component crash error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            padding: "40px 24px",
            border: "1px solid #fee2e2",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
            textAlign: "center",
            marginTop: "20px",
            fontFamily: "'Poppins', sans-serif",
          }}
        >
          <div style={{ fontSize: "40px", marginBottom: "12px" }}>⚠️</div>
          <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#991b1b", margin: "0 0 8px 0" }}>
            GIS Map Dashboard Error
          </h2>
          <p style={{ fontSize: "14px", color: "#64748b", margin: "0 0 20px 0" }}>
            An unexpected error occurred while rendering the spatial map overlays.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            style={{
              padding: "10px 24px",
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
            Reload GIS Map
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * GISDashboard Page (src/pages/GISDashboard.jsx)
 * Interactive GIS Spatial Mapping & Hydrological Risk Distribution
 */
function GISDashboard() {
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
      {/* GIS Dashboard Professional Header Section */}
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
            fontFamily: "'Poppins', sans-serif",
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
          <span>🗺️</span> GIS Pollution Monitoring Dashboard
        </h1>
        <p
          style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: "14px",
            color: "#64748b",
            margin: 0,
          }}
        >
          Interactive spatial mapping, industrial contamination point sources, and hydrological risk distribution.
        </p>
      </div>

      <GISErrorBoundary>
        <PollutionMap />
      </GISErrorBoundary>
    </div>
  );
}

export default GISDashboard;