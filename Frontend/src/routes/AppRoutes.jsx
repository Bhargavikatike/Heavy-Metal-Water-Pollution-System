import React from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import Dashboard from "../pages/Dashboard";
import Samples from "../pages/samples/Samples";
import Assessments from "../pages/assessments/Assessments";
import GISDashboard from "../pages/GISDashboard";
import Standards from "../pages/standards/Standards";
import Settings from "../pages/settings/Settings";
import Recommendations from "../pages/recommendations/Recommendations";
import Reports from "../pages/reports/Reports";
import authService from "../services/authService";

/**
 * Reusable Module Placeholder Component for Protected Sub-Routes
 */
function ModulePlaceholder({ title, icon, description }) {
  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        borderRadius: "12px",
        padding: "32px",
        border: "1px solid #e2e8f0",
        boxShadow: "0 2px 10px rgba(0, 0, 0, 0.04)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
        <span style={{ fontSize: "32px" }}>{icon}</span>
        <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#0f172a", margin: 0 }}>
          {title} Module
        </h2>
      </div>
      <p style={{ fontSize: "14px", color: "#64748b", margin: "0 0 20px 0" }}>
        {description}
      </p>
      <div
        style={{
          padding: "16px",
          backgroundColor: "#f8fafc",
          borderRadius: "8px",
          border: "1px dashed #cbd5e1",
          color: "#475569",
          fontSize: "13px",
        }}
      >
        ℹ️ Module active and ready for REST API endpoint binding.
      </div>
    </div>
  );
}

/**
 * AppRoutes Component
 * Configures system routes:
 * - /login
 * - /register
 * - /dashboard
 * - /samples (Water Sample Management)
 * - /assessments (WHO Pollution Assessments)
 * - /standards (Standards & Thresholds Management)
 * - /gis
 * - /recommendations
 * - /reports
 * - /settings (System & Account Settings)
 * - /admin
 */
function AppRoutes() {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine active tab id based on location URL
  const getActiveTabFromPath = (path) => {
    switch (path) {
      case "/dashboard":
        return "dashboard";
      case "/samples":
        return "samples";
      case "/assessments":
        return "assessments";
      case "/standards":
        return "standards";
      case "/gis":
        return "gis";
      case "/recommendations":
        return "recommendations";
      case "/reports":
        return "reports";
      case "/settings":
        return "settings";
      case "/admin":
        return "admin";
      default:
        return "dashboard";
    }
  };

  const activeTab = getActiveTabFromPath(location.pathname);

  const handleSelectTab = (tabId) => {
    navigate(`/${tabId}`);
  };

  const handleLoginSuccess = () => {
    navigate("/dashboard");
  };

  return (
    <Routes>
      {/* Root Route Redirect */}
      <Route
        path="/"
        element={
          authService.isAuthenticated() ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Public Authentication Routes */}
      <Route
        path="/login"
        element={
          <Login
            onLoginSuccess={handleLoginSuccess}
            onNavigateToRegister={() => navigate("/register")}
          />
        }
      />
      <Route
        path="/register"
        element={
          <Register
            onRegisterSuccess={() => navigate("/login")}
            onNavigateToLogin={() => navigate("/login")}
          />
        }
      />

      {/* Protected Main Layout Routes */}
      <Route
        element={
          <ProtectedRoute
            activeTab={activeTab}
            onSelectTab={handleSelectTab}
          />
        }
      >
        <Route
          path="/dashboard"
          element={<Dashboard onNavigateToGIS={() => navigate("/gis")} />}
        />
        <Route path="/samples" element={<Samples />} />
        <Route path="/assessments" element={<Assessments />} />
        <Route path="/standards" element={<Standards />} />
        <Route path="/gis" element={<GISDashboard />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/recommendations" element={<Recommendations />} />
        <Route path="/reports" element={<Reports />} />
      </Route>

      {/* Admin Only Protected Routes */}
      <Route
        element={
          <ProtectedRoute
            activeTab={activeTab}
            onSelectTab={handleSelectTab}
            allowedRoles={["Admin", "Administrator"]}
          />
        }
      >
        <Route path="/admin" element={<Standards />} />
      </Route>

      {/* Fallback for Unknown Routes */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;
