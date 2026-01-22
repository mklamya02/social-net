import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { postService } from '@/services/post.service';

// Async thunks
export const fetchPosts = createAsyncThunk(
  'posts/fetchPosts',
  async ({ page = 1, limit = 5, mode = 'discover' } = {}) => {
    return await postService.getPosts(page, limit, mode);
  }
);

export const fetchRecommendedPosts = createAsyncThunk(
  'posts/fetchRecommendedPosts',
  async ({ page = 1, limit = 5, tags = null } = {}) => {
    return await postService.getRecommendedFeed(page, limit, tags);
  }
);

export const fetchTrending = createAsyncThunk(
  'posts/fetchTrending',
  async () => {
    return await postService.getTrending();
  }
);

export const createPost = createAsyncThunk(
  'posts/createPost',
  async (postData) => {
    return await postService.createPost(postData);
  }
);

export const likePost = createAsyncThunk(
  'posts/likePost',
  async (postId) => {
    return await postService.likePost(postId);
  }
);

export const unlikePost = createAsyncThunk(
  'posts/unlikePost',
  async (postId) => {
    return await postService.unlikePost(postId);
  }
);

export const addComment = createAsyncThunk(
  'posts/addComment',
  async ({ postId, content, parentCommentId }) => {
    const response = await postService.addComment(postId, content, parentCommentId);
    return { postId, comment: response };
  }
);

export const deletePost = createAsyncThunk(
  'posts/deletePost',
  async (postId) => {
    await postService.deletePost(postId);
    return postId;
  }
);

export const archivePost = createAsyncThunk(
  'posts/archivePost',
  async (postId) => {
    await postService.archivePost(postId);
    return postId;
  }
);

export const bookmarkPost = createAsyncThunk(
  'posts/bookmarkPost',
  async (postId) => {
    const response = await postService.bookmarkPost(postId);
    // response maps to { isBookmarked: boolean } from backend
    return { postId, isBookmarked: response.isBookmarked };
  }
);

export const fetchBookmarkedPosts = createAsyncThunk(
  'posts/fetchBookmarkedPosts',
  async ({ page = 1, limit = 5 } = {}) => {
    return await postService.getBookmarkedPosts(page, limit);
  }
);

const initialState = {
  posts: [],
  loading: false,
  error: null,
  hasMore: true,
  currentPage: 1,
  trends: [],
};

const postSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    clearPosts: (state) => {
      state.posts = [];
      state.currentPage = 1;
      state.hasMore = true;
    },
    clearError: (state) => {
      state.error = null;
    },
    updatePostStats: (state, action) => {
      const { postId, ...updates } = action.payload;
      state.posts.forEach(post => {
        if (post._id === postId) {
          Object.assign(post, updates);
        }
        if (post.repostOf && post.repostOf._id === postId) {
          Object.assign(post.repostOf, updates);
        }
      });
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch posts
      .addCase(fetchPosts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.loading = false;
        const data = action.payload;
        const isInitial = action.meta.arg?.page === 1 || !action.meta.arg?.page;
        
        const newThreads = data.threads || [];
        
        if (isInitial) {
          state.posts = newThreads;
        } else {
          // Append and filter duplicates
          const existingIds = new Set(state.posts.map(p => p._id));
          const uniqueNewThreads = newThreads.filter(p => !existingIds.has(p._id));
          state.posts = [...state.posts, ...uniqueNewThreads];
        }
        
        state.hasMore = data.pagination ? data.pagination.currentPage < data.pagination.totalPages : false;
        state.currentPage = data.pagination?.currentPage || 1;
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Create post
      .addCase(createPost.fulfilled, (state, action) => {
        // action.payload is the new formatted thread
        state.posts.unshift(action.payload);
      })
      // Like post
      .addCase(likePost.fulfilled, (state, action) => {
        const postId = action.meta.arg;
        state.posts.forEach(post => {
          // Update the post itself if it matches
          if (post._id === postId) {
            post.likeCount = (post.likeCount || 0) + 1;
            post.isLiked = true;
          }
          // Update nested repost if it matches
          if (post.repostOf && post.repostOf._id === postId) {
            post.repostOf.likeCount = (post.repostOf.likeCount || 0) + 1;
            post.repostOf.isLiked = true;
          }
        });
      })
      // Unlike post
      .addCase(unlikePost.fulfilled, (state, action) => {
        const postId = action.meta.arg;
        state.posts.forEach(post => {
          if (post._id === postId) {
            post.likeCount = Math.max((post.likeCount || 0) - 1, 0);
            post.isLiked = false;
          }
          if (post.repostOf && post.repostOf._id === postId) {
            post.repostOf.likeCount = Math.max((post.repostOf.likeCount || 0) - 1, 0);
            post.repostOf.isLiked = false;
          }
        });
      })
      // Add comment
      .addCase(addComment.fulfilled, (state, action) => {
        const { postId } = action.payload;
        state.posts.forEach(post => {
          if (post._id === postId) {
            post.commentCount = (post.commentCount || 0) + 1;
          }
          if (post.repostOf && post.repostOf._id === postId) {
            post.repostOf.commentCount = (post.repostOf.commentCount || 0) + 1;
          }
        });
      })
      // Delete post
      .addCase(deletePost.fulfilled, (state, action) => {
        state.posts = state.posts.filter(p => (p._id || p.id) !== action.payload);
      })
      // Archive post
      .addCase(archivePost.fulfilled, (state, action) => {
        state.posts = state.posts.filter(p => (p._id || p.id) !== action.payload);
      })
      // Bookmark post
      .addCase(bookmarkPost.fulfilled, (state, action) => {
        const { postId, isBookmarked } = action.payload;
        state.posts.forEach(post => {
          if (post._id === postId) {
            post.isBookmarked = isBookmarked;
          }
          if (post.repostOf && post.repostOf._id === postId) {
            post.repostOf.isBookmarked = isBookmarked;
          }
        });
      })
      // Fetch bookmarked posts
      .addCase(fetchBookmarkedPosts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBookmarkedPosts.fulfilled, (state, action) => {
        state.loading = false;
        const data = action.payload;
        const isInitial = action.meta.arg?.page === 1 || !action.meta.arg?.page;
        const newThreads = data.threads || [];

        if (isInitial) {
          state.posts = newThreads;
        } else {
          const existingIds = new Set(state.posts.map(p => p._id));
          const uniqueNewThreads = newThreads.filter(p => !existingIds.has(p._id));
          state.posts = [...state.posts, ...uniqueNewThreads];
        }

        state.hasMore = data.pagination ? data.pagination.currentPage < data.pagination.totalPages : false;
        state.currentPage = data.pagination?.currentPage || 1;
      })
      .addCase(fetchBookmarkedPosts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Fetch recommended posts
      .addCase(fetchRecommendedPosts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRecommendedPosts.fulfilled, (state, action) => {
        state.loading = false;
        const data = action.payload;
        const isInitial = action.meta.arg?.page === 1 || !action.meta.arg?.page;
        const newThreads = data.threads || [];

        if (isInitial) {
          state.posts = newThreads;
        } else {
          const existingIds = new Set(state.posts.map(p => p._id));
          const uniqueNewThreads = newThreads.filter(p => !existingIds.has(p._id));
          state.posts = [...state.posts, ...uniqueNewThreads];
        }

        state.hasMore = data.pagination ? data.pagination.currentPage < data.pagination.totalPages : false;
        state.currentPage = data.pagination?.currentPage || 1;
      })
      .addCase(fetchRecommendedPosts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Fetch trending posts
      .addCase(fetchTrending.fulfilled, (state, action) => {
        state.trends = action.payload || [];
      });
  },
});

export const { clearPosts, clearError, updatePostStats } = postSlice.actions;
export default postSlice.reducer;
