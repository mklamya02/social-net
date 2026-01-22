import api from './api';

export const followerService = {
  // Follow a user
  followUser: async (userId) => {
    return await api.post('/follower/follow', { followingId: userId });
  },

  // Unfollow a user
  unfollowUser: async (userId) => {
    return await api.delete(`/follower/${userId}`);
  },

  // Remove a follower (force them to unfollow me)
  removeFollower: async (followerId) => {
    return await api.delete(`/follower/${followerId}/remove`);
  },

  // Accept follow request
  acceptFollowRequest: async (userId) => {
    return await api.patch('/follower/accept', { followerId: userId });
  },

  // Reject follow request
  rejectFollowRequest: async (userId) => {
    return await api.patch('/follower/reject', { followerId: userId });
  },

  // Get followers (if backend implements this later)
  getFollowers: async (userId) => {
    return await api.get(`/follower/${userId}/followers`);
  },

  // Get following (if backend implements this later)
  getFollowing: async (userId) => {
    return await api.get(`/follower/${userId}/following`);
  },
};
