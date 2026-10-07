const API_BASE_URL = "http://localhost:5000/api";

export const notificationService = {
  /**
   * Fetch all notifications from MongoDB
   */
  async getNotifications() {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications`);
      if (!response.ok) {
        throw new Error("Failed to fetch notifications");
      }
      const result = await response.json();
      return {
        notifications: result.notifications || [],
        unreadCount: result.unreadCount || 0,
      };
    } catch (error) {
      console.error("notificationService.getNotifications error:", error);
      return { notifications: [], unreadCount: 0 };
    }
  },

  /**
   * Fetch count of unread notifications
   */
  async getUnreadCount() {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/unread-count`);
      if (!response.ok) return 0;
      const result = await response.json();
      return result.unreadCount || 0;
    } catch (error) {
      console.error("notificationService.getUnreadCount error:", error);
      return 0;
    }
  },

  /**
   * Create a notification record in MongoDB
   */
  async createNotification(notificationData) {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(notificationData),
      });
      if (!response.ok) throw new Error("Failed to create notification");
      return await response.json();
    } catch (error) {
      console.error("notificationService.createNotification error:", error);
    }
  },

  /**
   * Mark a single notification as read
   */
  async markAsRead(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
        method: "PUT",
      });
      if (!response.ok) throw new Error("Failed to mark notification as read");
      return await response.json();
    } catch (error) {
      console.error("notificationService.markAsRead error:", error);
    }
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead() {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/mark-all-read`, {
        method: "PUT",
      });
      if (!response.ok) throw new Error("Failed to mark all as read");
      return await response.json();
    } catch (error) {
      console.error("notificationService.markAllAsRead error:", error);
    }
  },

  /**
   * Delete a notification
   */
  async deleteNotification(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete notification");
      return await response.json();
    } catch (error) {
      console.error("notificationService.deleteNotification error:", error);
    }
  },
};

export default notificationService;
