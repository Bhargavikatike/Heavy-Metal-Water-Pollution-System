import React, { useState } from "react";
import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";

/**
 * MainLayout Component
 * Serves as the primary application wrapper for Heavy Metal Water Pollution System.
 * Connects Navbar, Sidebar, and Main Content viewport with responsive mobile drawer controls.
 */
function MainLayout({
  children,
  activeTab = "dashboard",
  onSelectTab,
  currentUser,
  onLogout,
}) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  const closeMobileSidebar = () => {
    setIsMobileSidebarOpen(false);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        backgroundColor: "#f8fafc",
        fontFamily: "system-ui, -apple-system, Roboto, sans-serif",
      }}
    >
      {/* Top Fixed Navbar */}
      <Navbar
        currentUser={currentUser}
        onLogout={onLogout}
        onToggleSidebar={toggleMobileSidebar}
        isMobileSidebarOpen={isMobileSidebarOpen}
      />

      {/* Main Body Viewport */}
      <div style={{ display: "flex", flex: 1, position: "relative" }}>
        {/* Fixed Desktop Sidebar / Responsive Drawer */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={onSelectTab}
          onLogout={onLogout}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={closeMobileSidebar}
          currentUser={currentUser}
        />

        {/* Backdrop overlay for mobile drawer */}
        {isMobileSidebarOpen && (
          <div
            onClick={closeMobileSidebar}
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(15, 23, 42, 0.5)",
              backdropFilter: "blur(2px)",
              zIndex: 950,
            }}
          />
        )}

        {/* Main Content Area - Only this scrolls when page content overflows */}
        <main
          className="main-content-viewport"
          style={{
            marginTop: "64px",
            marginLeft: "240px",
            width: "calc(100% - 240px)",
            padding: "24px",
            boxSizing: "border-box",
            minHeight: "calc(100vh - 64px)",
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

export default MainLayout;
