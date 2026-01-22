import api from './api';

export const notificationService = {
  // Get all unread notifications
  getNotifications: async () => {
    return await api.get('/notification/unread');
  },

  getAllNotifications: async () => {
    return await api.get('/notification/all');
  },

  // Mark notification as read
  markAsRead: async (notificationId) => {
    return await api.put(`/notification/${notificationId}/read`);
  },

  // Mark all as read
  markAllAsRead: async () => {
    return await api.put('/notification/read-all');
  },

  // Delete all notifications
  deleteAllNotifications: async () => {
    return await api.delete('/notification/all');
  },
};
