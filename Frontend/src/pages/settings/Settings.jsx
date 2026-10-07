import React, { useState, useEffect } from "react";
import authService, { formatRole } from "../../services/authService";
import settingsService from "../../services/settingsService";
import notificationService from "../../services/notificationService";

/**
 * Settings Component (src/pages/settings/Settings.jsx)
 * Accessible from the avatar dropdown menu.
 * Sections:
 * 1. Notification Preferences
 * 2. Theme Preferences
 * 3. Change Password
 * 4. Account Information
 * Loads & stores settings in MongoDB automatically. Role-based access control enabled.
 */
function Settings({ currentUser }) {
  const user = currentUser || authService.getCurrentUser() || {};
  const userRole = formatRole(user.role);
  const isResearcher = userRole.toLowerCase().includes("researcher");
  const isAdmin = userRole.toLowerCase().includes("admin");

  // Active sub-tab state inside Settings page
  const [activeTab, setActiveTab] = useState("notifications");

  // Settings state loaded from MongoDB
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const [settings, setSettings] = useState({
    notifications: {
      emailAlerts: true,
      highPollutionAlerts: true,
      soundNotifications: true,
      weeklyDigest: false,
    },
    theme: {
      mode: "light",
      compactMode: false,
      mapStyle: "satellite",
    },
  });

  // Change Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordStatus, setPasswordStatus] = useState({ loading: false, error: "", success: "" });

  // Load user settings from MongoDB on component mount
  useEffect(() => {
    const fetchSettingsFromDb = async () => {
      try {
        setLoading(true);
        const dbSettings = await settingsService.getSettings(user.email);
        if (dbSettings) {
          setSettings({
            notifications: {
              emailAlerts: dbSettings.notifications?.emailAlerts ?? true,
              highPollutionAlerts: dbSettings.notifications?.highPollutionAlerts ?? true,
              soundNotifications: dbSettings.notifications?.soundNotifications ?? true,
              weeklyDigest: dbSettings.notifications?.weeklyDigest ?? false,
            },
            theme: {
              mode: dbSettings.theme?.mode || "light",
              compactMode: dbSettings.theme?.compactMode || false,
              mapStyle: dbSettings.theme?.mapStyle || "satellite",
            },
          });
        }
      } catch (err) {
        console.error("Error loading settings from MongoDB:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettingsFromDb();
  }, [user.email]);

  // Save settings to MongoDB automatically on toggle or form update
  const handleSaveSettings = async (updatedSettings) => {
    try {
      setSaving(true);
      setSaveMessage("");
      const res = await settingsService.updateSettings(updatedSettings || settings);
      setSaveMessage("✓ Settings saved to MongoDB database");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (err) {
      console.error("Error saving settings:", err);
      setSaveMessage("❌ Failed to save settings to database");
    } finally {
      setSaving(false);
    }
  };

  // Toggle notification preference handler
  const handleToggleNotification = (key) => {
    const updated = {
      ...settings,
      notifications: {
        ...settings.notifications,
        [key]: !settings.notifications[key],
      },
    };
    setSettings(updated);
    handleSaveSettings(updated);
  };

  // Theme change handler
  const handleThemeChange = (key, value) => {
    const updated = {
      ...settings,
      theme: {
        ...settings.theme,
        [key]: value,
      },
    };
    setSettings(updated);
    handleSaveSettings(updated);
  };

  // Handle password submit to backend MongoDB
  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordStatus({ loading: true, error: "", success: "" });

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordStatus({ loading: false, error: "New password and confirmation do not match.", success: "" });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordStatus({ loading: false, error: "New password must be at least 6 characters long.", success: "" });
      return;
    }

    try {
      const res = await settingsService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      if (res && res.success) {
        setPasswordStatus({ loading: false, error: "", success: "✓ Password updated successfully in database!" });
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });

        await notificationService.createNotification({
          title: "Password Changed",
          message: "Account security password updated successfully.",
          type: "info",
        });
      } else {
        setPasswordStatus({ loading: false, error: res?.message || "Failed to update password.", success: "" });
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || "Error changing password.";
      setPasswordStatus({ loading: false, error: errMsg, success: "" });
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
        <h3>⏳ Loading User Settings from MongoDB...</h3>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", paddingBottom: "40px" }}>
      {/* Settings Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
          borderBottom: "1px solid #e2e8f0",
          paddingBottom: "16px",
        }}
      >
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a", margin: "0 0 6px 0" }}>
            ⚙️ System & Account Settings
          </h1>
          <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
            Manage notification preferences, theme aesthetics, account security, and user profile details.
          </p>
        </div>

        {saveMessage && (
          <span
            style={{
              padding: "6px 14px",
              borderRadius: "20px",
              backgroundColor: saveMessage.includes("✓") ? "#ecfdf5" : "#fef2f2",
              color: saveMessage.includes("✓") ? "#047857" : "#b91c1c",
              fontSize: "13px",
              fontWeight: "700",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}
          >
            {saveMessage}
          </span>
        )}
      </div>

      {/* Role-Based Access Control Notice */}
      <div
        style={{
          backgroundColor: "#f0f9ff",
          border: "1px solid #bae6fd",
          borderRadius: "10px",
          padding: "12px 18px",
          marginBottom: "24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "18px" }}>🛡️</span>
          <div>
            <span style={{ fontSize: "13px", fontWeight: "700", color: "#0369a1" }}>
              Role-Based Access Control Active:
            </span>{" "}
            <span style={{ fontSize: "13px", color: "#0c4a6e" }}>
              You are logged in as <strong>{user.name}</strong> ({userRole}). Settings apply specifically to your user account.
            </span>
          </div>
        </div>
        <span
          style={{
            fontSize: "11px",
            fontWeight: "800",
            textTransform: "uppercase",
            backgroundColor: "#0284c7",
            color: "#ffffff",
            padding: "3px 10px",
            borderRadius: "12px",
          }}
        >
          {userRole}
        </span>
      </div>

      {/* Settings Navigation Tabs */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          borderBottom: "1px solid #e2e8f0",
          marginBottom: "28px",
          overflowX: "auto",
        }}
      >
        {[
          { id: "notifications", label: "🔔 Notification Preferences" },
          { id: "theme", label: "🎨 Theme Preferences" },
          { id: "password", label: "🔑 Change Password" },
          { id: "account", label: "👤 Account Information" },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "12px 20px",
                border: "none",
                borderBottom: isActive ? "3px solid #059669" : "3px solid transparent",
                backgroundColor: "transparent",
                color: isActive ? "#059669" : "#64748b",
                fontSize: "14px",
                fontWeight: isActive ? "800" : "600",
                cursor: "pointer",
                transition: "all 0.15s ease",
                whiteSpace: "nowrap",
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Notification Preferences */}
      {activeTab === "notifications" && (
        <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "28px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", marginTop: 0, marginBottom: "8px" }}>
            🔔 Notification Preferences
          </h2>
          <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "24px" }}>
            Choose how you receive real-time updates regarding heavy metal assessments, water sample additions, and report downloads.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {[
              {
                key: "emailAlerts",
                title: "Email Notifications",
                description: "Receive immediate email alerts when new assessments are generated or critical limits are breached.",
                icon: "📧",
              },
              {
                key: "highPollutionAlerts",
                title: "High Pollution Critical Warnings",
                description: "Trigger high-priority alerts in the navbar when HPI or Heavy Metal concentrations exceed WHO/BIS limits.",
                icon: "⚠️",
              },
              {
                key: "soundNotifications",
                title: "Sound Notifications",
                description: "Play an audible alert sound upon receiving live high-severity system notifications.",
                icon: "🔊",
              },
              {
                key: "weeklyDigest",
                title: "Weekly Summary Digest",
                description: "Receive a compiled weekly email summary of water quality statistics and assessment trends.",
                icon: "📅",
              },
            ].map((item) => (
              <div
                key={item.key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "16px",
                  borderRadius: "10px",
                  backgroundColor: "#f8fafc",
                  border: "1px solid #f1f5f9",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
                  <span style={{ fontSize: "24px" }}>{item.icon}</span>
                  <div>
                    <div style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a" }}>{item.title}</div>
                    <div style={{ fontSize: "13px", color: "#64748b", marginTop: "2px" }}>{item.description}</div>
                  </div>
                </div>

                <label style={{ position: "relative", display: "inline-block", width: "46px", height: "24px" }}>
                  <input
                    type="checkbox"
                    checked={settings.notifications[item.key]}
                    onChange={() => handleToggleNotification(item.key)}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span
                    style={{
                      position: "absolute",
                      cursor: "pointer",
                      inset: 0,
                      backgroundColor: settings.notifications[item.key] ? "#059669" : "#cbd5e1",
                      transition: "0.2s",
                      borderRadius: "24px",
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        content: '""',
                        height: "18px",
                        width: "18px",
                        left: settings.notifications[item.key] ? "24px" : "3px",
                        bottom: "3px",
                        backgroundColor: "white",
                        transition: "0.2s",
                        borderRadius: "50%",
                      }}
                    />
                  </span>
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Theme Preferences */}
      {activeTab === "theme" && (
        <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "28px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", marginTop: 0, marginBottom: "8px" }}>
            🎨 Theme & Display Preferences
          </h2>
          <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "24px" }}>
            Customize system visual appearance, interface density, and default GIS map style.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Appearance Mode */}
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "700", color: "#0f172a", marginBottom: "10px" }}>
                Interface Appearance Mode
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
                {[
                  { mode: "light", title: "☀️ Light Mode", desc: "Clean, high-contrast crisp view" },
                  { mode: "dark", title: "🌙 Dark Mode", desc: "Sleek dark interface for low light" },
                  { mode: "system", title: "💻 System Auto", desc: "Sync with OS theme settings" },
                ].map((item) => (
                  <button
                    key={item.mode}
                    onClick={() => handleThemeChange("mode", item.mode)}
                    style={{
                      padding: "16px",
                      borderRadius: "10px",
                      border: settings.theme.mode === item.mode ? "2px solid #059669" : "1px solid #e2e8f0",
                      backgroundColor: settings.theme.mode === item.mode ? "#ecfdf5" : "#ffffff",
                      textAlign: "left",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ fontSize: "15px", fontWeight: "800", color: "#0f172a" }}>{item.title}</div>
                    <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* GIS Map Style */}
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "700", color: "#0f172a", marginBottom: "10px" }}>
                Default GIS Pollution Map Layer
              </label>
              <select
                value={settings.theme.mapStyle}
                onChange={(e) => handleThemeChange("mapStyle", e.target.value)}
                style={{
                  width: "100%",
                  maxWidth: "400px",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "14px",
                  color: "#0f172a",
                }}
              >
                <option value="satellite">🛰️ High-Resolution Satellite Topography</option>
                <option value="street">🗺️ Standard Street Vector View</option>
                <option value="terrain">🏔️ Hydrological Terrain & Relief</option>
                <option value="dark">🌃 Dark GIS Analytics Contrast</option>
              </select>
            </div>

            {/* Compact Mode */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px",
                borderRadius: "10px",
                backgroundColor: "#f8fafc",
                border: "1px solid #f1f5f9",
              }}
            >
              <div>
                <div style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a" }}>Dense Data View (Compact Tables)</div>
                <div style={{ fontSize: "13px", color: "#64748b", marginTop: "2px" }}>
                  Reduce table padding to view more sample records per page.
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.theme.compactMode}
                onChange={(e) => handleThemeChange("compactMode", e.target.checked)}
                style={{ width: "20px", height: "20px", cursor: "pointer" }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Change Password */}
      {activeTab === "password" && (
        <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "28px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", marginTop: 0, marginBottom: "8px" }}>
            🔑 Security & Password Management
          </h2>
          <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "24px" }}>
            Update your account password to ensure secure access to water pollution records.
          </p>

          <form onSubmit={handleChangePasswordSubmit} style={{ maxWidth: "480px" }}>
            {passwordStatus.error && (
              <div
                style={{
                  padding: "12px 16px",
                  borderRadius: "8px",
                  backgroundColor: "#fef2f2",
                  color: "#991b1b",
                  fontSize: "13px",
                  fontWeight: "600",
                  marginBottom: "18px",
                  border: "1px solid #fecaca",
                }}
              >
                ⚠️ {passwordStatus.error}
              </div>
            )}

            {passwordStatus.success && (
              <div
                style={{
                  padding: "12px 16px",
                  borderRadius: "8px",
                  backgroundColor: "#ecfdf5",
                  color: "#065f46",
                  fontSize: "13px",
                  fontWeight: "700",
                  marginBottom: "18px",
                  border: "1px solid #a7f3d0",
                }}
              >
                {passwordStatus.success}
              </div>
            )}

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "700", marginBottom: "6px", color: "#334155" }}>
                Current Password *
              </label>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                required
                placeholder="••••••••"
                style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
              />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "700", marginBottom: "6px", color: "#334155" }}>
                New Password *
              </label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                required
                minLength={6}
                placeholder="••••••••"
                style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
              />
              <span style={{ fontSize: "11px", color: "#64748b", marginTop: "4px", display: "block" }}>
                Must be at least 6 characters long.
              </span>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "700", marginBottom: "6px", color: "#334155" }}>
                Confirm New Password *
              </label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                required
                placeholder="••••••••"
                style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
              />
            </div>

            <button
              type="submit"
              disabled={passwordStatus.loading}
              style={{
                padding: "10px 24px",
                borderRadius: "8px",
                border: "none",
                backgroundColor: "#059669",
                color: "#ffffff",
                fontWeight: "700",
                fontSize: "14px",
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(5, 150, 105, 0.3)",
              }}
            >
              {passwordStatus.loading ? "Updating Password..." : "Update Password in Database"}
            </button>
          </form>
        </div>
      )}

      {/* Tab 4: Account Information */}
      {activeTab === "account" && (
        <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "28px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", marginTop: 0, marginBottom: "8px" }}>
            👤 Account Details & System Privileges
          </h2>
          <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "24px" }}>
            Detailed account metadata stored in MongoDB.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px" }}>
            <div style={{ padding: "16px", borderRadius: "10px", backgroundColor: "#f8fafc", border: "1px solid #f1f5f9" }}>
              <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>Account Full Name</span>
              <div style={{ fontSize: "16px", fontWeight: "800", color: "#0f172a", marginTop: "4px" }}>{user.name}</div>
            </div>

            <div style={{ padding: "16px", borderRadius: "10px", backgroundColor: "#f8fafc", border: "1px solid #f1f5f9" }}>
              <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>Email Address</span>
              <div style={{ fontSize: "16px", fontWeight: "800", color: "#0f172a", marginTop: "4px" }}>{user.email}</div>
            </div>

            <div style={{ padding: "16px", borderRadius: "10px", backgroundColor: "#f8fafc", border: "1px solid #f1f5f9" }}>
              <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>Assigned Role</span>
              <div style={{ marginTop: "6px" }}>
                <span style={{ backgroundColor: "#dcfce7", color: "#15803d", padding: "4px 10px", borderRadius: "6px", fontSize: "13px", fontWeight: "800" }}>
                  {userRole}
                </span>
              </div>
            </div>

            <div style={{ padding: "16px", borderRadius: "10px", backgroundColor: "#f8fafc", border: "1px solid #f1f5f9" }}>
              <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>Institution / Agency</span>
              <div style={{ fontSize: "16px", fontWeight: "800", color: "#0f172a", marginTop: "4px" }}>
                {user.institution || user.organization || "Water Pollution Research Center"}
              </div>
            </div>

            <div style={{ padding: "16px", borderRadius: "10px", backgroundColor: "#f8fafc", border: "1px solid #f1f5f9" }}>
              <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>Phone Contact</span>
              <div style={{ fontSize: "16px", fontWeight: "800", color: "#0f172a", marginTop: "4px" }}>
                {user.phone || "+91 98765 43210"}
              </div>
            </div>

            <div style={{ padding: "16px", borderRadius: "10px", backgroundColor: "#f8fafc", border: "1px solid #f1f5f9" }}>
              <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>Database Account Status</span>
              <div style={{ fontSize: "15px", fontWeight: "800", color: "#059669", marginTop: "4px" }}>
                🟢 Active & Verified
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Settings;
