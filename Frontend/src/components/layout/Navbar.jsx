import React, { useState, useEffect, useRef } from "react";
import authService, { formatRole } from "../../services/authService";
import notificationService from "../../services/notificationService";

/**
 * Navbar Component (src/components/layout/Navbar.jsx)
 * Features:
 * - Avatar Profile System (replaces initials circle with avatar image / default vector graphic)
 * - Primary User Account Menu dropdown:
 *   1. Edit Profile
 *   2. Settings
 *   3. Logout
 * - Interactive MongoDB Notification System with Unread Count Badge
 * - Edit Profile & Settings Modals
 */
function Navbar({ currentUser, onLogout, onToggleSidebar, isMobileSidebarOpen }) {
  // Retrieve authenticated user
  const initialUser = currentUser || authService.getCurrentUser() || {
    name: "Bhargavi",
    role: "Researcher",
    email: "bhargavi@example.com",
    avatarUrl: "",
  };

  const [userState, setUserState] = useState(initialUser);

  // Sync state if prop changes
  useEffect(() => {
    if (currentUser) {
      setUserState(currentUser);
    } else {
      setUserState(authService.getCurrentUser() || initialUser);
    }
  }, [currentUser]);

  const displayName = userState.name || "Bhargavi";
  const displayRole = formatRole(userState.role);
  const displayEmail = userState.email || `${displayName.toLowerCase().replace(/\s+/g, ".")}@system.org`;

  // Default avatar SVG graphic (neutral professional gray silhouette avatar)
  const defaultAvatarSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%2364748b"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 4c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm0 14c-2.03 0-4.43-.82-6.14-2.88C7.55 15.42 9.96 14.5 12 14.5s4.45.92 6.14 2.62C16.43 19.18 14.03 20 12 20z"/></svg>`;

  const avatarSrc = defaultAvatarSvg;

  // Notification States
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  // Account Profile Menu Dropdown State
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  // Modal Dialog States
  const [isMyProfileOpen, setIsMyProfileOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Edit Profile Form State
  const [editFormData, setEditFormData] = useState({
    name: displayName,
    role: displayRole,
    email: displayEmail,
    phone: userState.phone || "",
    avatarUrl: userState.avatarUrl || "",
    institution: userState.institution || userState.organization || "Water Pollution Research Center",
  });

  // Settings Toggles State
  const [settingsData, setSettingsData] = useState({
    autoSync: true,
    emailAlerts: true,
    soundNotifications: true,
    highPollutionAlerts: true,
  });

  const notifRef = useRef(null);
  const profileMenuRef = useRef(null);

  // Fetch User Profile from MongoDB on mount
  useEffect(() => {
    const loadDbProfile = async () => {
      try {
        const dbProfile = await authService.getUserProfile();
        if (dbProfile) {
          setUserState(dbProfile);
        }
      } catch (err) {
        console.error("Error loading profile from MongoDB:", err);
      }
    };
    loadDbProfile();
  }, []);

  // Open Edit Profile Modal after loading latest MongoDB values
  const handleOpenEditProfile = async () => {
    setIsProfileMenuOpen(false);
    try {
      const dbProfile = await authService.getUserProfile();
      const current = dbProfile || userState;
      setEditFormData({
        name: current.name || displayName,
        email: current.email || displayEmail,
        phone: current.phone || "",
        avatarUrl: current.avatarUrl || "",
        institution: current.institution || current.organization || "Water Pollution Research Center",
        role: current.role || displayRole,
      });
    } catch (err) {
      setEditFormData({
        name: displayName,
        email: displayEmail,
        phone: userState.phone || "",
        avatarUrl: userState.avatarUrl || "",
        institution: userState.institution || userState.organization || "Water Pollution Research Center",
        role: displayRole,
      });
    }
    setIsEditProfileOpen(true);
  };

  // Fetch Notifications from MongoDB
  const fetchNotifications = async () => {
    try {
      setLoadingNotifs(true);
      const res = await notificationService.getNotifications();
      setNotifications(res.notifications || []);
      setUnreadCount(res.unreadCount || 0);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoadingNotifs(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle Mark Single Read
  const handleMarkAsRead = async (id, isRead) => {
    if (isRead) return;
    try {
      const res = await notificationService.markAsRead(id);
      if (res && res.success) {
        setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
        setUnreadCount(res.unreadCount !== undefined ? res.unreadCount : Math.max(0, unreadCount - 1));
      }
    } catch (err) {
      console.error("Error marking read:", err);
    }
  };

  // Handle Mark All Read
  const handleMarkAllAsRead = async () => {
    try {
      const res = await notificationService.markAllAsRead();
      if (res && res.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error("Error marking all read:", err);
    }
  };

  // Handle Logout Action
  const handleLogoutAction = () => {
    setIsProfileMenuOpen(false);
    if (onLogout) {
      onLogout();
    } else {
      authService.logout();
      window.location.href = "/login";
    }
  };

  // Save updated profile to MongoDB and immediately refresh Navbar state
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const updatedUser = await authService.updateUserProfile({
        name: editFormData.name,
        email: editFormData.email,
        phone: editFormData.phone,
        avatarUrl: editFormData.avatarUrl,
        institution: editFormData.institution,
        role: editFormData.role,
      });

      // Immediately refresh local state so navbar updates instantly
      setUserState(updatedUser);
      setIsEditProfileOpen(false);

      await notificationService.createNotification({
        title: "Profile Updated",
        message: `Account profile updated in MongoDB for ${updatedUser.name}`,
        type: "success",
      });
      fetchNotifications();
    } catch (err) {
      console.error("Error updating profile:", err);
      alert("Failed to update profile. Please try again.");
    }
  };

  const getNotificationIcon = (title = "", type = "info") => {
    if (title.includes("Sample")) return "🧪";
    if (title.includes("Assessment")) return "🔬";
    if (title.includes("Pollution") || type === "danger") return "⚠️";
    if (title.includes("Report")) return "📄";
    if (title.includes("Profile")) return "👤";
    return "🔔";
  };

  const formatTimestamp = (dateStr) => {
    if (!dateStr) return "Just now";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      <header
        style={{
          height: "64px",
          backgroundColor: "#ffffff",
          borderBottom: "1px solid #e2e8f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 900,
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
          boxSizing: "border-box",
        }}
      >
        {/* Left Section: Application Brand Logo & Title */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, #059669, #0284c7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "19px",
              color: "#ffffff",
              boxShadow: "0 2px 8px rgba(5, 150, 105, 0.3)",
            }}
          >
            🌊
          </div>
          <span
            style={{
              fontFamily: "'Poppins', 'Montserrat', system-ui, -apple-system, sans-serif",
              fontSize: "17px",
              fontWeight: 600,
              color: "#0f172a",
              letterSpacing: "-0.01em",
            }}
          >
            Heavy Metal Water Pollution System
          </span>
        </div>

        {/* Right Section: Notification Bell & Avatar Profile System */}
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          {/* Notification Bell Button */}
          <div style={{ position: "relative" }} ref={notifRef}>
            <button
              onClick={() => {
                setIsNotifOpen(!isNotifOpen);
                setIsProfileMenuOpen(false);
              }}
              style={{
                position: "relative",
                background: isNotifOpen ? "#e2e8f0" : "#f1f5f9",
                border: "none",
                borderRadius: "50%",
                width: "40px",
                height: "40px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                fontSize: "18px",
                transition: "all 0.2s ease",
              }}
              title="Notifications"
            >
              🔔
              {unreadCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: "1px",
                    right: "1px",
                    backgroundColor: "#ef4444",
                    color: "#ffffff",
                    fontSize: "10px",
                    fontWeight: "800",
                    minWidth: "18px",
                    height: "18px",
                    borderRadius: "10px",
                    padding: "0 4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 2px 4px rgba(239, 68, 68, 0.4)",
                  }}
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown Panel */}
            {isNotifOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "52px",
                  right: 0,
                  width: "360px",
                  maxHeight: "460px",
                  backgroundColor: "#ffffff",
                  borderRadius: "14px",
                  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15)",
                  border: "1px solid #e2e8f0",
                  overflow: "hidden",
                  zIndex: 1000,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  style={{
                    padding: "14px 18px",
                    borderBottom: "1px solid #f1f5f9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    backgroundColor: "#f8fafc",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontWeight: "800", fontSize: "15px", color: "#0f172a" }}>
                      Notifications
                    </span>
                    {unreadCount > 0 && (
                      <span
                        style={{
                          backgroundColor: "#fee2e2",
                          color: "#991b1b",
                          fontSize: "11px",
                          fontWeight: "700",
                          padding: "2px 8px",
                          borderRadius: "10px",
                        }}
                      >
                        {unreadCount} new
                      </span>
                    )}
                  </div>

                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#2563eb",
                        fontSize: "12px",
                        fontWeight: "600",
                        cursor: "pointer",
                        padding: 0,
                      }}
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div style={{ overflowY: "auto", flex: 1, padding: "6px 0" }}>
                  {loadingNotifs && notifications.length === 0 ? (
                    <div style={{ padding: "24px", textAlign: "center", color: "#64748b", fontSize: "13px" }}>
                      ⏳ Loading notifications...
                    </div>
                  ) : notifications.length > 0 ? (
                    notifications.map((n) => (
                      <div
                        key={n._id}
                        onClick={() => handleMarkAsRead(n._id, n.isRead)}
                        style={{
                          padding: "12px 16px",
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "12px",
                          backgroundColor: n.isRead ? "#ffffff" : "#f0f9ff",
                          borderBottom: "1px solid #f1f5f9",
                          cursor: "pointer",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "18px",
                            padding: "6px",
                            borderRadius: "8px",
                            backgroundColor: "#ffffff",
                            border: "1px solid #e2e8f0",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {getNotificationIcon(n.title, n.type)}
                        </div>

                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "2px" }}>
                            <span style={{ fontSize: "13px", fontWeight: n.isRead ? "600" : "800", color: "#0f172a" }}>
                              {n.title}
                            </span>
                            <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                              {formatTimestamp(n.createdAt)}
                            </span>
                          </div>
                          <p style={{ fontSize: "12px", color: "#475569", margin: 0, lineHeight: "1.4" }}>
                            {n.message}
                          </p>
                        </div>

                        {!n.isRead && (
                          <div
                            style={{
                              width: "8px",
                              height: "8px",
                              borderRadius: "50%",
                              backgroundColor: "#2563eb",
                              marginTop: "6px",
                            }}
                          />
                        )}
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: "32px 16px", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>
                      🔔 No notifications yet.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Primary User Account Avatar Menu */}
          <div style={{ position: "relative" }} ref={profileMenuRef}>
            <button
              onClick={() => {
                setIsProfileMenuOpen(!isProfileMenuOpen);
                setIsNotifOpen(false);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                background: isProfileMenuOpen ? "#f1f5f9" : "transparent",
                border: "none",
                borderRadius: "24px",
                padding: "4px 10px 4px 4px",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {/* Neutral Professional Circular Avatar (Gmail/LinkedIn/GitHub/Microsoft Style) */}
              <div
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "50%",
                  overflow: "hidden",
                  border: "1px solid #cbd5e1",
                  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
                  backgroundColor: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <img
                  src={avatarSrc}
                  alt={displayName}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                  onError={(e) => {
                    e.currentTarget.src = defaultAvatarSvg;
                  }}
                />
              </div>

              {/* User Name & Subtle Role */}
              <div style={{ display: "flex", flexDirection: "column", textAlign: "left" }}>
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: "700",
                    color: "#0f172a",
                    lineHeight: "1.2",
                  }}
                >
                  {displayName}
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: "500",
                    color: "#64748b",
                    marginTop: "1px",
                  }}
                >
                  {displayRole}
                </span>
              </div>

              <span style={{ fontSize: "11px", color: "#64748b", marginLeft: "2px" }}>
                {isProfileMenuOpen ? "▲" : "▼"}
              </span>
            </button>

            {/* Account Dropdown Menu: My Profile, Edit Profile, Settings, Logout */}
            {isProfileMenuOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "50px",
                  right: 0,
                  width: "240px",
                  backgroundColor: "#ffffff",
                  borderRadius: "12px",
                  boxShadow: "0 10px 25px rgba(0, 0, 0, 0.12)",
                  border: "1px solid #e2e8f0",
                  overflow: "hidden",
                  zIndex: 1000,
                  padding: "6px 0",
                }}
              >
                <div style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9" }}>
                  <div style={{ fontSize: "14px", fontWeight: "800", color: "#0f172a" }}>
                    {displayName}
                  </div>
                  <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                    {displayEmail}
                  </div>
                </div>

                <div style={{ padding: "4px 0" }}>
                  {/* 1. My Profile */}
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      setIsMyProfileOpen(true);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      width: "100%",
                      padding: "10px 16px",
                      border: "none",
                      background: "none",
                      color: "#334155",
                      fontSize: "14px",
                      fontWeight: "600",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f8fafc")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <span>👤</span> My Profile
                  </button>

                  {/* 2. Edit Profile */}
                  <button
                    onClick={handleOpenEditProfile}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      width: "100%",
                      padding: "10px 16px",
                      border: "none",
                      background: "none",
                      color: "#334155",
                      fontSize: "14px",
                      fontWeight: "600",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f8fafc")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <span>✏️</span> Edit Profile
                  </button>

                  {/* 3. Settings */}
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      window.location.href = "/settings";
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      width: "100%",
                      padding: "10px 16px",
                      border: "none",
                      background: "none",
                      color: "#334155",
                      fontSize: "14px",
                      fontWeight: "600",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f8fafc")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <span>⚙️</span> Settings
                  </button>

                  <div style={{ borderTop: "1px solid #f1f5f9", margin: "4px 0" }} />

                  {/* 4. Logout with Modern Lucide React LogOut Icon */}
                  <button
                    onClick={handleLogoutAction}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      width: "100%",
                      padding: "10px 16px",
                      border: "none",
                      background: "none",
                      color: "#ef4444",
                      fontSize: "14px",
                      fontWeight: "700",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#fef2f2")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Edit Profile Modal */}
      {isEditProfileOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "14px",
              padding: "28px",
              width: "100%",
              maxWidth: "520px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>
                ✏️ Edit Account Profile
              </h3>
              <button
                onClick={() => setIsEditProfileOpen(false)}
                style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "#64748b" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProfile}>
              {/* 1. Full Name */}
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "700", marginBottom: "4px", color: "#334155" }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  required
                  placeholder="e.g. Dr. Bhargavi"
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", boxSizing: "border-box", fontSize: "14px" }}
                />
              </div>

              {/* 2. Email */}
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "700", marginBottom: "4px", color: "#334155" }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  required
                  placeholder="bhargavi@example.com"
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", boxSizing: "border-box", fontSize: "14px" }}
                />
              </div>

              {/* 3. Phone Number */}
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "700", marginBottom: "4px", color: "#334155" }}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", boxSizing: "border-box", fontSize: "14px" }}
                />
              </div>

              {/* 5. Institution */}
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "700", marginBottom: "4px", color: "#334155" }}>
                  Institution / Organization
                </label>
                <input
                  type="text"
                  value={editFormData.institution}
                  onChange={(e) => setEditFormData({ ...editFormData, institution: e.target.value })}
                  placeholder="Water Pollution Research Center"
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", boxSizing: "border-box", fontSize: "14px" }}
                />
              </div>

              {/* Role Select */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "700", marginBottom: "4px", color: "#334155" }}>
                  System Role
                </label>
                <select
                  value={editFormData.role}
                  onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", boxSizing: "border-box", fontSize: "14px" }}
                >
                  <option value="Researcher">Researcher</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", paddingTop: "8px", borderTop: "1px solid #f1f5f9" }}>
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  style={{ padding: "9px 18px", borderRadius: "8px", border: "1px solid #cbd5e1", backgroundColor: "#ffffff", color: "#475569", fontWeight: "600", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: "9px 20px", borderRadius: "8px", border: "none", backgroundColor: "#059669", color: "#ffffff", fontWeight: "700", cursor: "pointer", boxShadow: "0 2px 6px rgba(5, 150, 105, 0.3)" }}
                >
                  Save Profile to Database
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "14px",
              padding: "28px",
              width: "100%",
              maxWidth: "480px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            }}
          >
            <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", color: "#0f172a" }}>
              ⚙️ System & Account Settings
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "24px" }}>
              <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "14px", color: "#334155" }}>
                <span>⚡ Real-time MongoDB Auto-Sync</span>
                <input
                  type="checkbox"
                  checked={settingsData.autoSync}
                  onChange={(e) => setSettingsData({ ...settingsData, autoSync: e.target.checked })}
                />
              </label>

              <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "14px", color: "#334155" }}>
                <span>🔔 High Pollution Alert Notifications</span>
                <input
                  type="checkbox"
                  checked={settingsData.highPollutionAlerts}
                  onChange={(e) => setSettingsData({ ...settingsData, highPollutionAlerts: e.target.checked })}
                />
              </label>

              <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "14px", color: "#334155" }}>
                <span>✉️ Email Report Summary Notifications</span>
                <input
                  type="checkbox"
                  checked={settingsData.emailAlerts}
                  onChange={(e) => setSettingsData({ ...settingsData, emailAlerts: e.target.checked })}
                />
              </label>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => setIsSettingsOpen(false)}
                style={{ padding: "9px 20px", borderRadius: "8px", border: "none", backgroundColor: "#0f172a", color: "#ffffff", fontWeight: "700" }}
              >
                Close Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* My Profile View Modal */}
      {isMyProfileOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "14px",
              padding: "28px",
              width: "100%",
              maxWidth: "480px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>
                👤 User Profile Information
              </h3>
              <button
                onClick={() => setIsMyProfileOpen(false)}
                style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "#64748b" }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  overflow: "hidden",
                  border: "1.5px solid #cbd5e1",
                  backgroundColor: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <img src={defaultAvatarSvg} alt={displayName} style={{ width: "100%", height: "100%" }} />
              </div>

              <div>
                <div style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>{displayName}</div>
                <div style={{ fontSize: "13px", color: "#64748b" }}>{displayEmail}</div>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "#059669", backgroundColor: "#ecfdf5", padding: "2px 8px", borderRadius: "4px", marginTop: "4px", display: "inline-block" }}>
                  {displayRole}
                </span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
              <div style={{ padding: "10px 14px", borderRadius: "8px", backgroundColor: "#f8fafc", border: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "13px", color: "#64748b", fontWeight: "600" }}>Institution / Organization:</span>
                <span style={{ fontSize: "13px", color: "#0f172a", fontWeight: "700" }}>{userState.institution || userState.organization || "Water Pollution Research Center"}</span>
              </div>

              <div style={{ padding: "10px 14px", borderRadius: "8px", backgroundColor: "#f8fafc", border: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "13px", color: "#64748b", fontWeight: "600" }}>Phone Number:</span>
                <span style={{ fontSize: "13px", color: "#0f172a", fontWeight: "700" }}>{userState.phone || "+91 98765 43210"}</span>
              </div>

              <div style={{ padding: "10px 14px", borderRadius: "8px", backgroundColor: "#f8fafc", border: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "13px", color: "#64748b", fontWeight: "600" }}>Account Status:</span>
                <span style={{ fontSize: "13px", color: "#059669", fontWeight: "700" }}>🟢 Active & Verified</span>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button
                onClick={() => setIsMyProfileOpen(false)}
                style={{ padding: "9px 16px", borderRadius: "8px", border: "1px solid #cbd5e1", backgroundColor: "#ffffff", color: "#475569", fontWeight: "600", cursor: "pointer" }}
              >
                Close
              </button>
              <button
                onClick={() => {
                  setIsMyProfileOpen(false);
                  handleOpenEditProfile();
                }}
                style={{ padding: "9px 18px", borderRadius: "8px", border: "none", backgroundColor: "#059669", color: "#ffffff", fontWeight: "700", cursor: "pointer" }}
              >
                Edit Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Navbar;
