import React, { useState } from "react";
import authService from "../services/authService";

/**
 * Register Page Component
 * Features an environmental Blue/Green gradient theme, form validation,
 * role-based selection (Researcher/Admin), and JWT authentication integration.
 */
function Register({ onSwitchToLogin, onRegisterSuccess }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "Researcher",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (apiError) setApiError("");
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Full name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Confirm password is required";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setApiError("");
    setSuccessMessage("");

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      };

      const data = await authService.register(payload);
      setLoading(false);
      setSuccessMessage("Account created successfully! You can now log in.");

      setTimeout(() => {
        if (onRegisterSuccess) {
          onRegisterSuccess(data);
        } else if (onSwitchToLogin) {
          onSwitchToLogin();
        }
      }, 1500);
    } catch (err) {
      setLoading(false);
      setApiError(err.message || "Registration failed. Please try again.");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0f172a 0%, #064e3b 50%, #0f766e 100%)",
        padding: "20px",
        boxSizing: "border-box",
        fontFamily: "system-ui, -apple-system, Roboto, sans-serif",
      }}
    >
      <div
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.96)",
          borderRadius: "16px",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.25)",
          width: "100%",
          maxWidth: "460px",
          padding: "36px 32px",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255, 255, 255, 0.3)",
        }}
      >
        {/* Branding Header */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #059669, #0284c7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "28px",
              margin: "0 auto 12px auto",
              boxShadow: "0 8px 18px rgba(5, 150, 105, 0.3)",
            }}
          >
            🧪
          </div>
          <h2
            style={{
              fontSize: "24px",
              fontWeight: "800",
              color: "#0f172a",
              margin: "0 0 6px 0",
              letterSpacing: "-0.5px",
            }}
          >
            Create Researcher Account
          </h2>
          <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
            Join the Heavy Metal Water Pollution Monitoring System
          </p>
        </div>

        {/* Success Banner */}
        {successMessage && (
          <div
            style={{
              backgroundColor: "#f0fdf4",
              border: "1px solid #86efac",
              color: "#166534",
              borderRadius: "8px",
              padding: "10px 14px",
              fontSize: "13px",
              marginBottom: "20px",
              fontWeight: "600",
              textAlign: "center",
            }}
          >
            ✅ {successMessage}
          </div>
        )}

        {/* Server API Error Banner */}
        {apiError && (
          <div
            style={{
              backgroundColor: "#fef2f2",
              border: "1px solid #fca5a5",
              color: "#991b1b",
              borderRadius: "8px",
              padding: "10px 14px",
              fontSize: "13px",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span>⚠️ {apiError}</span>
            <button
              onClick={() => setApiError("")}
              style={{
                background: "none",
                border: "none",
                color: "#991b1b",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Register Form */}
        <form onSubmit={handleSubmit}>
          {/* Full Name Field */}
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: "600",
                color: "#334155",
                marginBottom: "6px",
              }}
            >
              Full Name
            </label>
            <div style={{ position: "relative" }}>
              <span
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: "14px",
                  color: "#94a3b8",
                }}
              >
                👤
              </span>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Bhargavi"
                style={{
                  width: "100%",
                  padding: "10px 12px 10px 38px",
                  borderRadius: "8px",
                  border: errors.name ? "2px solid #ef4444" : "1px solid #cbd5e1",
                  outline: "none",
                  fontSize: "14px",
                  color: "#0f172a",
                  boxSizing: "border-box",
                }}
              />
            </div>
            {errors.name && (
              <span style={{ fontSize: "12px", color: "#ef4444", marginTop: "4px", display: "block" }}>
                {errors.name}
              </span>
            )}
          </div>

          {/* Email Field */}
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: "600",
                color: "#334155",
                marginBottom: "6px",
              }}
            >
              Email Address
            </label>
            <div style={{ position: "relative" }}>
              <span
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: "14px",
                  color: "#94a3b8",
                }}
              >
                ✉️
              </span>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="bhargavi@research.org"
                style={{
                  width: "100%",
                  padding: "10px 12px 10px 38px",
                  borderRadius: "8px",
                  border: errors.email ? "2px solid #ef4444" : "1px solid #cbd5e1",
                  outline: "none",
                  fontSize: "14px",
                  color: "#0f172a",
                  boxSizing: "border-box",
                }}
              />
            </div>
            {errors.email && (
              <span style={{ fontSize: "12px", color: "#ef4444", marginTop: "4px", display: "block" }}>
                {errors.email}
              </span>
            )}
          </div>

          {/* Role Selection */}
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: "600",
                color: "#334155",
                marginBottom: "6px",
              }}
            >
              Role / Access Level
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                outline: "none",
                fontSize: "14px",
                color: "#0f172a",
                backgroundColor: "#ffffff",
                boxSizing: "border-box",
                cursor: "pointer",
              }}
            >
              <option value="Researcher">🔬 Researcher</option>
              <option value="Admin">🛡️ Administrator</option>
            </select>
          </div>

          {/* Password Field */}
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: "600",
                color: "#334155",
                marginBottom: "6px",
              }}
            >
              Password
            </label>
            <div style={{ position: "relative" }}>
              <span
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: "14px",
                  color: "#94a3b8",
                }}
              >
                🔒
              </span>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                style={{
                  width: "100%",
                  padding: "10px 40px 10px 38px",
                  borderRadius: "8px",
                  border: errors.password ? "2px solid #ef4444" : "1px solid #cbd5e1",
                  outline: "none",
                  fontSize: "14px",
                  color: "#0f172a",
                  boxSizing: "border-box",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "14px",
                  color: "#64748b",
                  padding: 0,
                }}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
            {errors.password && (
              <span style={{ fontSize: "12px", color: "#ef4444", marginTop: "4px", display: "block" }}>
                {errors.password}
              </span>
            )}
          </div>

          {/* Confirm Password Field */}
          <div style={{ marginBottom: "24px" }}>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: "600",
                color: "#334155",
                marginBottom: "6px",
              }}
            >
              Confirm Password
            </label>
            <div style={{ position: "relative" }}>
              <span
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: "14px",
                  color: "#94a3b8",
                }}
              >
                🔑
              </span>
              <input
                type={showPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                style={{
                  width: "100%",
                  padding: "10px 12px 10px 38px",
                  borderRadius: "8px",
                  border: errors.confirmPassword ? "2px solid #ef4444" : "1px solid #cbd5e1",
                  outline: "none",
                  fontSize: "14px",
                  color: "#0f172a",
                  boxSizing: "border-box",
                }}
              />
            </div>
            {errors.confirmPassword && (
              <span style={{ fontSize: "12px", color: "#ef4444", marginTop: "4px", display: "block" }}>
                {errors.confirmPassword}
              </span>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "8px",
              border: "none",
              background: loading
                ? "#94a3b8"
                : "linear-gradient(135deg, #059669 0%, #0d9488 100%)",
              color: "#ffffff",
              fontSize: "15px",
              fontWeight: "700",
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: "0 4px 14px rgba(5, 150, 105, 0.35)",
              transition: "transform 0.15s ease, opacity 0.15s ease",
            }}
          >
            {loading ? "Creating Account..." : "Complete Registration"}
          </button>
        </form>

        {/* Switch to Login */}
        <div style={{ textAlign: "center", marginTop: "24px", fontSize: "13px", color: "#64748b" }}>
          Already have an account?{" "}
          <button
            type="button"
            onClick={onSwitchToLogin}
            style={{
              background: "none",
              border: "none",
              color: "#059669",
              fontWeight: "700",
              cursor: "pointer",
              padding: 0,
              textDecoration: "underline",
            }}
          >
            Sign In Here
          </button>
        </div>
      </div>
    </div>
  );
}

export default Register;
