import api from './api';

export const userService = {
  // Get user profile
  getProfile: async (userId) => {
    return await api.get(`/user/${userId}`);
  },

  // Update user profile
  updateProfile: async (data, isFormData = false) => {
    const config = {};
    if (isFormData) {
      config.headers = { 'Content-Type': 'multipart/form-data' };
    }
    return await api.patch('/user/me', data, config);
  },

  // Get user posts
  getUserPosts: async (userId, page = 1, limit = 5) => {
    return await api.get(`/user/${userId}/posts?page=${page}&limit=${limit}`);
  },

  // Get suggestions
  getSuggestions: async () => {
    return await api.get('/user/suggestions');
  },
  // Update privacy
  updatePrivacy: async (isPrivate) => {
    return await api.put('/user/privacy', { isPrivate });
  },
  // Delete account
  deleteAccount: async () => {
    return await api.delete('/user/me');
  },
  // Save interests
  saveInterests: async (interests) => {
    return await api.post('/user/interests', { interests });
  },
  // Change password
  changePassword: async (currentPassword, newPassword, confirmPassword) => {
    return await api.patch('/user/change-password', { currentPassword, newPassword, confirmPassword });
  },
};
