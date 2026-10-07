const Notification = require("../models/Notification");

/**
 * Helper to create a Notification record in MongoDB
 */
const createNotification = async ({ userId = "system", title, message, type = "info" }) => {
  try {
    const notification = await Notification.create({
      userId,
      title,
      message,
      type,
      isRead: false,
      createdAt: new Date(),
    });
    return notification;
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
};

module.exports = {
  createNotification,
};
