import api from './api';

export const postService = {
  // Get all posts (feed) - Uses /thread which supports auth for personalized feed
  getPosts: async (page = 1, limit = 5, mode = 'discover') => {
    return await api.get(`/thread?page=${page}&limit=${limit}&mode=${mode}`);
  },

  // Get single post
  getPost: async (postId) => {
    return await api.get(`/thread/me/${postId}`);
  },

  // Create post
  createPost: async (postData) => {
    return await api.post('/thread', postData);
  },

  // Update post
  updatePost: async (postId, postData) => {
    return await api.patch(`/thread/me/${postId}`, postData);
  },

  // Archive post (delete)
  archivePost: async (postId) => {
    return await api.patch(`/thread/archive/${postId}`);
  },

  unarchivePost: async (postId) => {
      return await api.patch(`/thread/unarchive/${postId}`);
  },

  // Like post
  likePost: async (threadId) => {
    return await api.post(`/like/${threadId}/like`);
  },

  // Unlike post
  unlikePost: async (threadId) => {
    return await api.delete(`/like/${threadId}/unlike`);
  },

  // Get user's liked threads
  getLikedThreads: async (page = 1, limit = 5) => {
    return await api.get(`/like/likedthread?page=${page}&limit=${limit}`);
  },

  // Get recommended feed based on user interests
  getRecommendedFeed: async (page = 1, limit = 5, tags = null) => {
    let url = `/thread/recommended?page=${page}&limit=${limit}`;
    if (tags) {
        url += `&tags=${encodeURIComponent(tags)}`;
    }
    return await api.get(url);
  },

  // Get post comments
  getComments: async (postId, params = {}) => {
    return await api.get(`/thread/${postId}/comments`, { params });
  },

  // Add comment
  addComment: async (postId, content, parentCommentId = null) => {
    return await api.post(`/thread/${postId}/comments`, { content, parentCommentId });
  },

  // Bookmark post
  bookmarkPost: async (postId) => {
    return await api.post(`/thread/${postId}/bookmark`);
  },

  // Get bookmarked posts
  getBookmarkedPosts: async (page = 1, limit = 5) => {
    return await api.get(`/thread/user/bookmarks?page=${page}&limit=${limit}`);
  },

  // Get archived posts
  getArchivedPosts: async (page = 1, limit = 5) => {
    return await api.get(`/thread/archived?page=${page}&limit=${limit}`);
  },

  // Delete post permanently
  deletePost: async (postId) => {
    return await api.delete(`/thread/me/${postId}`);
  },

  // Update comment
  updateComment: async (commentId, content) => {
    return await api.patch(`/thread/comments/${commentId}`, { content });
  },

  // Delete comment
  deleteComment: async (commentId) => {
    return await api.delete(`/thread/comments/${commentId}`);
  },

  // Get trending hashtags
  getTrending: async () => {
    return await api.get('/thread/trending');
  },
};

