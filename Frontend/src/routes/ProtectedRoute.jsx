import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import authService from "../services/authService";
import MainLayout from "../layouts/MainLayout";

/**
 * ProtectedRoute Component
 * Guards routes requiring authentication and role-based authorization.
 * Automatically wraps authenticated pages in MainLayout.
 */
function ProtectedRoute({ activeTab, onSelectTab, allowedRoles }) {
  // Check authentication status (Token check in localStorage or mock session)
  const isAuthenticated = authService.isAuthenticated();
  const currentUser = authService.getCurrentUser() || {
    name: "Bhargavi",
    role: "Researcher",
    avatar: "BK",
  };

  // Requested Debug Logs
  console.log("[ProtectedRoute] isAuthenticated():", isAuthenticated);
  console.log("[ProtectedRoute] currentUser:", currentUser);

  // 1. Redirect unauthenticated users to /login
  if (!isAuthenticated) {
    console.warn("[ProtectedRoute] Unauthenticated access attempt. Redirecting to /login");
    return <Navigate to="/login" replace />;
  }

  // 2. Role-based access control check
  const userRoleNormalized = (currentUser?.role || "").toLowerCase();
  const isRoleAllowed =
    !allowedRoles ||
    allowedRoles.length === 0 ||
    allowedRoles.some((role) => role.toLowerCase() === userRoleNormalized);

  if (!isRoleAllowed) {
    console.warn("[ProtectedRoute] Role unauthorized:", currentUser.role);
    return (
      <MainLayout
        activeTab={activeTab}
        onSelectTab={onSelectTab}
        currentUser={currentUser}
        onLogout={() => {
          authService.logout();
          window.location.href = "/login";
        }}
      >
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            padding: "40px",
            textAlign: "center",
            boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
            border: "1px solid #e2e8f0",
            maxWidth: "500px",
            margin: "40px auto",
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🛑</div>
          <h2 style={{ color: "#ef4444", fontSize: "22px", fontWeight: "800", margin: "0 0 8px 0" }}>
            Access Denied
          </h2>
          <p style={{ color: "#64748b", fontSize: "14px", margin: "0 0 20px 0" }}>
            Your account role (<strong>{currentUser.role}</strong>) does not have authorization to view this module.
          </p>
        </div>
      </MainLayout>
    );
  }

  // 3. Render protected content inside MainLayout
  return (
    <MainLayout
      activeTab={activeTab}
      onSelectTab={onSelectTab}
      currentUser={currentUser}
      onLogout={() => {
        authService.logout();
        window.location.href = "/login";
      }}
    >
      <Outlet />
    </MainLayout>
  );
}

export default ProtectedRoute;
