const Notification = require("../models/Notification");

/**
 * Fetch All Notifications from MongoDB
 * GET /api/notifications
 */
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find()
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({ isRead: false });

    res.status(200).json({
      success: true,
      count: notifications.length,
      unreadCount,
      notifications,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get Unread Notification Count
 * GET /api/notifications/unread-count
 */
const getUnreadCount = async (req, res) => {
  try {
    const unreadCount = await Notification.countDocuments({ isRead: false });
    res.status(200).json({
      success: true,
      unreadCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Create Notification via API
 * POST /api/notifications
 */
const createNotificationApi = async (req, res) => {
  try {
    const { userId = "system", title, message, type = "info" } = req.body;

    if (!title || !message) {
      return res.status(400).json({ success: false, message: "Title and message are required" });
    }

    const notification = await Notification.create({
      userId,
      title,
      message,
      type,
      isRead: false,
      createdAt: new Date(),
    });

    res.status(201).json({
      success: true,
      message: "Notification created",
      notification,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Mark Single Notification as Read
 * PUT /api/notifications/:id/read
 */
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    const unreadCount = await Notification.countDocuments({ isRead: false });

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
      notification,
      unreadCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Mark All Notifications as Read
 * PUT /api/notifications/mark-all-read
 */
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ isRead: false }, { isRead: true });
    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
      unreadCount: 0,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Delete Notification
 * DELETE /api/notifications/:id
 */
const deleteNotification = async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    const unreadCount = await Notification.countDocuments({ isRead: false });
    res.status(200).json({
      success: true,
      message: "Notification deleted",
      unreadCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  createNotificationApi,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
