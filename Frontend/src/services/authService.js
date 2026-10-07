import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/**
 * Helper utility to generate 2-letter avatar initials from any user name
 * e.g., "Bhargavi" -> "BH", "Bhargavi Sharma" -> "BS"
 */
/**
 * Helper utility to generate 2-letter avatar initials from any user name
 * e.g., "Bhargavi Katike" -> "BK", "Bhargavi" -> "BH"
 */
export const formatRole = (role) => {
  if (!role || typeof role !== "string") return "Researcher";
  const r = role.trim().toLowerCase();
  if (r === "admin" || r === "administrator") return "Admin";
  if (r === "researcher") return "Researcher";
  if (r.includes("officer")) return "Environmental Officer";
  return role.charAt(0).toUpperCase() + role.slice(1);
};

/**
 * Helper utility to generate 2-letter avatar initials from any user name
 * e.g., "Bhargavi Katike" -> "BK", "Bhargavi" -> "BH"
 */
export const getAvatarInitials = (name) => {
  if (!name || typeof name !== "string") return "U";
  const cleanName = name.replace(/^(Dr\.|Mr\.|Mrs\.|Ms\.|Prof\.)\s+/i, "").trim();
  const parts = cleanName.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) {
    return parts[0].length >= 2
      ? parts[0].substring(0, 2).toUpperCase()
      : parts[0].substring(0, 1).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/**
 * Authentication Service for JWT Login & Registration
 * Manages localStorage session persistence and registered users store dynamically.
 */
const authService = {
  /**
   * Get list of locally registered users from localStorage
   */
  getRegisteredUsers() {
    try {
      const usersStr = localStorage.getItem("registered_users");
      return usersStr ? JSON.parse(usersStr) : [];
    } catch (e) {
      return [];
    }
  },

  /**
   * User registration
   * @param {Object} userData - { name, email, password, role, organization }
   */
  async register(userData) {
    const cleanEmail = userData.email.trim().toLowerCase();
    const cleanName = userData.name.trim();
    const userRole = userData.role || "Researcher";
    const avatar = getAvatarInitials(cleanName);

    const newUser = {
      name: cleanName,
      email: cleanEmail,
      password: userData.password,
      role: userRole,
      organization: userData.organization || "Water Research Agency",
      avatar: avatar,
    };

    const registeredUsers = this.getRegisteredUsers();
    // Prevent duplicates by filtering out matching email
    const updatedUsers = registeredUsers.filter((u) => u.email !== cleanEmail);
    updatedUsers.push(newUser);
    localStorage.setItem("registered_users", JSON.stringify(updatedUsers));

    // Immediately persist user & token into current session
    const token = "jwt-registered-token-" + Date.now();
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(newUser));

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, userData);
      return response.data;
    } catch (error) {
      console.warn("Backend API unavailable, saved registered user locally:", error.message);
      return { success: true, message: "Registration successful", user: newUser };
    }
  },

  /**
   * User login with email and password
   * Validates credentials and stores token & user in localStorage
   * @param {Object} credentials - { email, password }
   */
  async login(credentials) {
    const cleanEmail = credentials.email.trim().toLowerCase();

    try {
      // Attempt backend login
      const response = await axios.post(`${API_BASE_URL}/auth/login`, credentials);
      if (response.data && response.data.token) {
        const token = response.data.token;
        const apiUser = response.data.user || {};
        let userName = apiUser.name || apiUser.fullName;

        // If backend returned no name or a roll number name, check registered_users or stored user
        if (!userName || /^\d+/.test(userName)) {
          const registeredUsers = this.getRegisteredUsers();
          const match = registeredUsers.find((u) => u.email === cleanEmail);
          userName = match?.name || this.getCurrentUser()?.name || "Bhargavi";
        }

        const userRole = formatRole(apiUser.role || "Researcher");
        const userObj = {
          name: userName,
          email: apiUser.email || cleanEmail,
          phone: apiUser.phone || "",
          avatarUrl: apiUser.avatarUrl || "",
          institution: apiUser.institution || apiUser.organization || "Water Pollution Research Center",
          organization: apiUser.organization || apiUser.institution || "Water Pollution Research Center",
          role: userRole,
          avatar: getAvatarInitials(userName),
        };

        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(userObj));
        return { token, user: userObj };
      }
    } catch (error) {
      console.warn(
        "Backend API unavailable or login failed. Falling back to mock authentication:",
        error.message
      );
    }

    // Mock Login Validation against locally registered users
    const registeredUsers = this.getRegisteredUsers();
    const foundUser = registeredUsers.find((u) => u.email === cleanEmail);

    if (foundUser) {
      if (foundUser.password && credentials.password && foundUser.password !== credentials.password) {
        throw new Error("Invalid password. Please check your credentials.");
      }

      const token = "jwt-mock-token-" + Date.now();
      const user = {
        name: foundUser.name,
        email: foundUser.email,
        phone: foundUser.phone || "",
        avatarUrl: foundUser.avatarUrl || "",
        institution: foundUser.institution || foundUser.organization || "Water Pollution Research Center",
        role: foundUser.role || "Researcher",
        organization: foundUser.organization || "Water Pollution Research Center",
        avatar: getAvatarInitials(foundUser.name),
      };

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      return { token, user };
    }

    // Dynamic fallback for any login credentials:
    const lastRegistered = registeredUsers.length > 0 ? registeredUsers[registeredUsers.length - 1] : null;
    const currentUser = this.getCurrentUser();

    let fallbackName = lastRegistered?.name || currentUser?.name;
    if (!fallbackName || /^\d+/.test(fallbackName)) {
      const rawName = cleanEmail.split("@")[0];
      if (/^\d+/.test(rawName) || /^[0-9A-Za-z]+\d+/.test(rawName)) {
        fallbackName = "Bhargavi";
      } else {
        fallbackName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
      }
    }

    const fallbackRole = lastRegistered?.role || currentUser?.role || "Researcher";
    const token = "jwt-mock-token-demo-" + Date.now();
    const user = {
      name: fallbackName,
      email: cleanEmail,
      phone: currentUser?.phone || "+91 98765 43210",
      avatarUrl: currentUser?.avatarUrl || "",
      institution: currentUser?.institution || "Water Pollution Research Center",
      role: fallbackRole,
      organization: "Water Research Agency",
      avatar: getAvatarInitials(fallbackName),
    };

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    return { token, user };
  },

  /**
   * Fetch current user profile from MongoDB backend
   */
  async getUserProfile(email) {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/profile`, {
        params: { email: email || this.getCurrentUser()?.email }
      });
      if (response.data && response.data.success && response.data.user) {
        const u = response.data.user;
        const userObj = {
          name: u.name,
          email: u.email,
          phone: u.phone || "",
          avatarUrl: u.avatarUrl || u.avatar || "",
          avatar: u.avatar || getAvatarInitials(u.name),
          institution: u.institution || u.organization || "Water Pollution Research Center",
          organization: u.organization || u.institution || "Water Pollution Research Center",
          role: formatRole(u.role),
        };
        localStorage.setItem("user", JSON.stringify(userObj));
        return userObj;
      }
    } catch (error) {
      console.warn("Could not fetch profile from MongoDB, using local profile:", error.message);
    }
    return this.getCurrentUser();
  },

  /**
   * Update user profile in MongoDB backend and update local session
   */
  async updateUserProfile(profileData) {
    const currentUser = this.getCurrentUser() || {};
    const originalEmail = currentUser.email;

    const payload = {
      name: profileData.name,
      email: profileData.email,
      originalEmail: originalEmail,
      phone: profileData.phone || "",
      avatarUrl: profileData.avatarUrl || "",
      avatar: profileData.avatarUrl || getAvatarInitials(profileData.name),
      institution: profileData.institution || "Water Pollution Research Center",
      organization: profileData.institution || "Water Pollution Research Center",
      role: formatRole(profileData.role || currentUser.role),
    };

    let updatedUser = { ...currentUser, ...payload };

    try {
      const response = await axios.put(`${API_BASE_URL}/auth/profile`, payload);
      if (response.data && response.data.success && response.data.user) {
        const u = response.data.user;
        updatedUser = {
          name: u.name,
          email: u.email,
          phone: u.phone || "",
          avatarUrl: u.avatarUrl || "",
          avatar: u.avatar || getAvatarInitials(u.name),
          institution: u.institution || u.organization || "Water Pollution Research Center",
          organization: u.organization || u.institution || "Water Pollution Research Center",
          role: formatRole(u.role),
        };
      }
    } catch (error) {
      console.warn("MongoDB API error during profile update, saving locally:", error.message);
    }

    // Persist locally
    localStorage.setItem("user", JSON.stringify(updatedUser));

    // Update registered_users list
    const registeredUsers = this.getRegisteredUsers();
    const updatedUsers = registeredUsers.map((u) => {
      if (u.email === originalEmail || u.email === profileData.email) {
        return { ...u, ...updatedUser };
      }
      return u;
    });
    localStorage.setItem("registered_users", JSON.stringify(updatedUsers));

    return updatedUser;
  },

  /**
   * Logout user and clear stored auth tokens
   */
  logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },

  /**
   * Get current authenticated user details from localStorage
   */
  getCurrentUser() {
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const u = JSON.parse(userStr);
        // If stored name is missing or a roll number, correct it using registered_users
        if (u && (!u.name || /^\d+/.test(u.name))) {
          const registeredUsers = this.getRegisteredUsers();
          const lastUser = registeredUsers.length > 0 ? registeredUsers[registeredUsers.length - 1] : null;
          u.name = lastUser?.name || "Bhargavi";
          u.role = lastUser?.role || u.role || "Researcher";
          u.avatar = getAvatarInitials(u.name);
          localStorage.setItem("user", JSON.stringify(u));
        }
        return u;
      }

      // If no stored user but registered_users exist, return the last registered user
      const registeredUsers = this.getRegisteredUsers();
      if (registeredUsers.length > 0) {
        const lastUser = registeredUsers[registeredUsers.length - 1];
        const userObj = {
          name: lastUser.name,
          email: lastUser.email,
          role: lastUser.role || "Researcher",
          organization: lastUser.organization || "Water Research Agency",
          avatar: getAvatarInitials(lastUser.name),
        };
        localStorage.setItem("user", JSON.stringify(userObj));
        return userObj;
      }
      return null;
    } catch (err) {
      return null;
    }
  },

  /**
   * Get stored JWT token
   */
  getToken() {
    return localStorage.getItem("token");
  },

  /**
   * Check if user is currently authenticated
   */
  isAuthenticated() {
    const token = localStorage.getItem("token");
    return !!token;
  },
};

export default authService;
