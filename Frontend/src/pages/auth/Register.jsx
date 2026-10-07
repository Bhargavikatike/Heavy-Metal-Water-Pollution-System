import React, { useState } from "react";
import authService from "../../services/authService";

/**
 * Researcher Registration Component (src/pages/auth/Register.jsx)
 * Registers user credentials via authService, saves them in localStorage,
 * and navigates to login.
 */
function Register({ onRegisterSuccess, onNavigateToLogin }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    organization: "",
    role: "Researcher",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [apiError, setApiError] = useState("");

  const calculatePasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: "None", color: "#e2e8f0", width: "0%" };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 10) score += 1;
    if (/[A-Z]/.test(pass) && /[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    switch (score) {
      case 1:
        return { score: 1, label: "Weak", color: "#ef4444", width: "25%" };
      case 2:
        return { score: 2, label: "Fair", color: "#f97316", width: "50%" };
      case 3:
        return { score: 3, label: "Good", color: "#0284c7", width: "75%" };
      case 4:
        return { score: 4, label: "Strong", color: "#10b981", width: "100%" };
      default:
        return { score: 1, label: "Weak", color: "#ef4444", width: "25%" };
    }
  };

  const passwordStrength = calculatePasswordStrength(formData.password);

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
      newErrors.name = "Full Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.organization.trim()) {
      newErrors.organization = "Organization / Institution is required";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
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
      const result = await authService.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        organization: formData.organization,
      });

      setLoading(false);
      setSuccessMessage("Account created successfully! Redirecting to login...");

      setTimeout(() => {
        if (onRegisterSuccess) {
          onRegisterSuccess(result);
        } else if (onNavigateToLogin) {
          onNavigateToLogin();
        }
      }, 1200);
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
        padding: "24px 20px",
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
          maxWidth: "480px",
          padding: "36px 32px",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255, 255, 255, 0.3)",
        }}
      >
        {/* Environmental Header & Branding */}
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
            Researcher Registration
          </h2>
          <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
            Join the Heavy Metal Water Pollution Monitoring System
          </p>
        </div>

        {/* Success Alert Banner */}
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

        {/* API Error Alert Banner */}
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

        {/* Form Container */}
        <form onSubmit={handleSubmit}>
          {/* Full Name */}
          <div style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
              Full Name
            </label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "14px", color: "#94a3b8" }}>
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
            {errors.name && <span style={{ fontSize: "12px", color: "#ef4444", marginTop: "3px", display: "block" }}>{errors.name}</span>}
          </div>

          {/* Email Address */}
          <div style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
              Email Address
            </label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "14px", color: "#94a3b8" }}>
                ✉️
              </span>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="bhargavi@waterresearch.org"
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
            {errors.email && <span style={{ fontSize: "12px", color: "#ef4444", marginTop: "3px", display: "block" }}>{errors.email}</span>}
          </div>

          {/* Organization & Role Row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                Organization
              </label>
              <input
                type="text"
                name="organization"
                value={formData.organization}
                onChange={handleChange}
                placeholder="Water Research Inst."
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: errors.organization ? "2px solid #ef4444" : "1px solid #cbd5e1",
                  outline: "none",
                  fontSize: "14px",
                  color: "#0f172a",
                  boxSizing: "border-box",
                }}
              />
              {errors.organization && <span style={{ fontSize: "11px", color: "#ef4444", marginTop: "2px", display: "block" }}>{errors.organization}</span>}
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                System Role
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "10px 10px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  outline: "none",
                  fontSize: "13px",
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
          </div>

          {/* Password Field */}
          <div style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "14px", color: "#94a3b8" }}>
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
            {errors.password && <span style={{ fontSize: "12px", color: "#ef4444", marginTop: "3px", display: "block" }}>{errors.password}</span>}

            {/* Password Strength Indicator Bar */}
            {formData.password && (
              <div style={{ marginTop: "6px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "11px", fontWeight: "600", color: "#64748b", marginBottom: "2px" }}>
                  <span>Password Strength:</span>
                  <span style={{ color: passwordStrength.color }}>{passwordStrength.label}</span>
                </div>
                <div style={{ height: "4px", width: "100%", backgroundColor: "#e2e8f0", borderRadius: "2px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: passwordStrength.width, backgroundColor: passwordStrength.color, transition: "all 0.3s ease" }} />
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password Field */}
          <div style={{ marginBottom: "22px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
              Confirm Password
            </label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "14px", color: "#94a3b8" }}>
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
            {errors.confirmPassword && <span style={{ fontSize: "12px", color: "#ef4444", marginTop: "3px", display: "block" }}>{errors.confirmPassword}</span>}
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
              transition: "transform 0.15s ease",
            }}
          >
            {loading ? "Registering..." : "Complete Registration"}
          </button>
        </form>

        {/* Switch to Login */}
        {onNavigateToLogin && (
          <div style={{ textAlign: "center", marginTop: "22px", fontSize: "13px", color: "#64748b" }}>
            Already registered?{" "}
            <button
              type="button"
              onClick={onNavigateToLogin}
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
        )}
      </div>
    </div>
  );
}

export default Register;
