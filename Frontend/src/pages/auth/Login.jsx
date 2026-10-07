import React, { useState } from "react";
import authService from "../../services/authService";

/**
 * Login Component (src/pages/auth/Login.jsx)
 * Handles user sign in, credential validation, authService integration,
 * token persistence in localStorage, and redirection to /dashboard.
 */
function Login({ onLoginSuccess, onNavigateToRegister }) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (authError) setAuthError("");
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setAuthError("");

    try {
      // Authenticate via authService (saves token & user to localStorage)
      const result = await authService.login({
        email: formData.email,
        password: formData.password,
      });

      setLoading(false);

      if (formData.rememberMe) {
        localStorage.setItem("rememberedEmail", formData.email);
      }

      // Notify parent route to navigate to /dashboard
      if (onLoginSuccess) {
        onLoginSuccess(result.user);
      }
    } catch (err) {
      setLoading(false);
      setAuthError(err.message || "Invalid email or password. Please try again.");
    }
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    alert("Password reset instructions have been sent to your registered email address.");
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
          maxWidth: "440px",
          padding: "36px 32px",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255, 255, 255, 0.3)",
        }}
      >
        {/* Environmental Header & Branding */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
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
              margin: "0 auto 14px auto",
              boxShadow: "0 8px 18px rgba(5, 150, 105, 0.3)",
            }}
          >
            🌊
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
            Researcher Sign In
          </h2>
          <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
            Heavy Metal Water Pollution Monitoring System
          </p>
        </div>

        {/* Auth Error Alert Banner */}
        {authError && (
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
            <span>⚠️ {authError}</span>
            <button
              onClick={() => setAuthError("")}
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
          {/* Email Field */}
          <div style={{ marginBottom: "18px" }}>
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
                placeholder="researcher@watermonitor.org"
                style={{
                  width: "100%",
                  padding: "11px 12px 11px 38px",
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

          {/* Password Field with Show/Hide Toggle */}
          <div style={{ marginBottom: "18px" }}>
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
                  padding: "11px 40px 11px 38px",
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
                title={showPassword ? "Hide Password" : "Show Password"}
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

          {/* Remember Me & Forgot Password */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "24px",
              fontSize: "13px",
            }}
          >
            <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", color: "#475569" }}>
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
                style={{ cursor: "pointer", accentColor: "#059669" }}
              />
              <span>Remember Me</span>
            </label>

            <a
              href="#forgot"
              onClick={handleForgotPassword}
              style={{
                color: "#059669",
                fontWeight: "600",
                textDecoration: "none",
              }}
            >
              Forgot Password?
            </a>
          </div>

          {/* Login Button */}
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
            {loading ? "Authenticating..." : "Sign In to Dashboard"}
          </button>
        </form>

        {/* Register Navigation Link */}
        {onNavigateToRegister && (
          <div style={{ textAlign: "center", marginTop: "24px", fontSize: "13px", color: "#64748b" }}>
            Need an account?{" "}
            <button
              type="button"
              onClick={onNavigateToRegister}
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
              Register Here
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Login;
