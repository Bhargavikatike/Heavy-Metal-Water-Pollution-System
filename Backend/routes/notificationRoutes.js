const express = require("express");
const router = express.Router();
const {
  getNotifications,
  getUnreadCount,
  createNotificationApi,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} = require("../controllers/notificationController");

router.get("/", getNotifications);
router.get("/unread-count", getUnreadCount);
router.post("/", createNotificationApi);
router.put("/mark-all-read", markAllAsRead);
router.put("/:id/read", markAsRead);
router.delete("/:id", deleteNotification);

module.exports = router;
