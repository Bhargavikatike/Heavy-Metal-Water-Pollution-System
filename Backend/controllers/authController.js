const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
// Researcher Registration
const registerResearcher = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      organization,
      district,
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "Email already registered",
      });
    }

    // Encrypt password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create researcher
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      organization,
      district,
      role: "researcher",
    });

    res.status(201).json({
      success: true,
      message: "Researcher registered successfully",
      user,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Get User Profile from MongoDB
const getUserProfile = async (req, res) => {
  try {
    const { email } = req.query;
    let user = null;

    if (email) {
      user = await User.findOne({ email });
    }

    if (!user) {
      // Return latest user or default fallback
      user = await User.findOne().sort({ createdAt: -1 });
    }

    if (!user) {
      // Create a default user in MongoDB if DB is empty
      user = await User.create({
        name: "Bhargavi",
        email: "bhargavi@example.com",
        phone: "+91 98765 43210",
        institution: "Water Pollution Research Center",
        organization: "Water Pollution Research Center",
        role: "Researcher",
        avatar: "BH",
        avatarUrl: "",
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        institution: user.institution || user.organization || "Water Pollution Research Center",
        organization: user.organization || user.institution || "Water Pollution Research Center",
        avatar: user.avatar || "",
        avatarUrl: user.avatarUrl || user.avatar || "",
        role: user.role || "Researcher",
      },
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user profile",
    });
  }
};

// Update User Profile in MongoDB
const updateUserProfile = async (req, res) => {
  try {
    const { name, email, originalEmail, phone, avatarUrl, avatar, institution, role } = req.body;

    const queryEmail = email || originalEmail || "bhargavi@example.com";
    let user = await User.findOne({ email: queryEmail });

    if (!user && originalEmail) {
      user = await User.findOne({ email: originalEmail });
    }

    if (!user) {
      user = await User.findOne().sort({ createdAt: -1 });
    }

    const updateFields = {
      name: name || user?.name || "Bhargavi",
      email: email || user?.email || "bhargavi@example.com",
      phone: phone !== undefined ? phone : user?.phone || "",
      avatarUrl: avatarUrl !== undefined ? avatarUrl : (user?.avatarUrl || ""),
      avatar: avatar !== undefined ? avatar : (user?.avatar || ""),
      institution: institution || user?.institution || "Water Pollution Research Center",
      organization: institution || user?.organization || "Water Pollution Research Center",
    };

    if (role) updateFields.role = role;

    if (user) {
      user = await User.findByIdAndUpdate(user._id, updateFields, { new: true });
    } else {
      user = await User.create(updateFields);
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully in MongoDB",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        institution: user.institution || user.organization || "Water Pollution Research Center",
        organization: user.organization || user.institution || "Water Pollution Research Center",
        avatar: user.avatar || "",
        avatarUrl: user.avatarUrl || "",
        role: user.role || "Researcher",
      },
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update profile in MongoDB",
      error: error.message,
    });
  }
};

// Researcher Login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check user
    let user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check password if set
    if (user.password) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: "Invalid credentials",
        });
      }
    }

    // Create token
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        name: user.name,
      },
      process.env.JWT_SECRET || "fallback_secret",
      {
        expiresIn: "7d",
      }
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        institution: user.institution || user.organization || "Water Pollution Research Center",
        organization: user.organization || user.institution || "Water Pollution Research Center",
        avatar: user.avatar || "",
        avatarUrl: user.avatarUrl || "",
        role: user.role || "Researcher",
      },
      role: user.role,
      name: user.name,
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

module.exports = {
  registerResearcher,
  loginUser,
  getUserProfile,
  updateUserProfile,
};