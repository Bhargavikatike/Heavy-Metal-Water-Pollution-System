import React from "react";
import authService from "../../services/authService";

/**
 * Sidebar Component
 * Displays system navigation items based on user role:
 * Researcher: Dashboard, Water Samples, Assessments, GIS Map, Recommendations, Reports, Logout
 * Admin: Dashboard, Water Samples, Assessments, GIS Map, Recommendations, Reports, Admin Panel, Logout
 */
function Sidebar({ activeTab, onSelectTab, onLogout, isMobileOpen, onCloseMobile, currentUser }) {
  // Retrieve current authenticated user details from prop or authService
  const user = currentUser || authService.getCurrentUser() || { role: "Researcher" };
  const userRole = (user.role || "").toLowerCase();
  const isAdmin = userRole === "admin" || userRole === "administrator";

  const allMenuItems = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "samples", label: "Water Samples", icon: "🧪" },
    { id: "assessments", label: "Assessments", icon: "📋" },
    { id: "gis", label: "GIS Map", icon: "🗺️" },
    { id: "recommendations", label: "Recommendations", icon: "💡" },
    { id: "reports", label: "Reports", icon: "📄" },
    { id: "admin", label: "Admin Panel", icon: "🛡️", adminOnly: true },
  ];

  // Filter out Admin Panel completely for non-admin roles (e.g., Researcher)
  const menuItems = allMenuItems.filter((item) => !item.adminOnly || isAdmin);

  const sidebarStyle = {
    width: "240px",
    height: "calc(100vh - 64px)",
    backgroundColor: "#0f172a",
    color: "#cbd5e1",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: "20px 14px",
    boxSizing: "border-box",
    position: "fixed",
    top: "64px",
    left: 0,
    overflowY: "auto",
    zIndex: 800,
    transition: "transform 0.3s ease",
  };

  return (
    <>
      {/* Sidebar Navigation */}
      <aside style={sidebarStyle} className={`sidebar-container ${isMobileOpen ? "mobile-open" : ""}`}>
        <div>
          {/* System Brand Subtitle */}
          <div
            style={{
              padding: "8px 12px 20px 12px",
              borderBottom: "1px solid #1e293b",
              marginBottom: "16px",
            }}
          >
            <div style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px" }}>
              System Navigation
            </div>
          </div>

          {/* Navigation Links List */}
          <nav style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {menuItems.map((item) => {
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (onSelectTab) onSelectTab(item.id);
                    if (onCloseMobile) onCloseMobile();
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor: isActive ? "#059669" : "transparent",
                    color: isActive ? "#ffffff" : "#94a3b8",
                    fontSize: "14px",
                    fontWeight: isActive ? "700" : "500",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = "#1e293b";
                      e.currentTarget.style.color = "#f8fafc";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = "#94a3b8";
                    }
                  }}
                >
                  <span style={{ fontSize: "16px" }}>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

      </aside>
    </>
  );
}

export default Sidebar;
