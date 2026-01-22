import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { userService } from '@/services/user.service';
import { followerService } from '@/services/follower.service';

export const fetchSuggestions = createAsyncThunk(
  'user/fetchSuggestions',
  async () => {
    return await userService.getSuggestions();
  }
);

export const followUser = createAsyncThunk(
  'user/followUser',
  async (userId) => {
    return await followerService.followUser(userId);
  }
);

export const unfollowUser = createAsyncThunk(
  'user/unfollowUser',
  async (userId) => {
    return await followerService.unfollowUser(userId);
  }
);

export const acceptFollowRequest = createAsyncThunk(
  'user/acceptFollowRequest',
  async (userId) => {
    return await followerService.acceptFollowRequest(userId);
  }
);

export const rejectFollowRequest = createAsyncThunk(
  'user/rejectFollowRequest',
  async (userId) => {
    return await followerService.rejectFollowRequest(userId);
  }
);

const initialState = {
  suggestions: [],
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSuggestions.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchSuggestions.fulfilled, (state, action) => {
        state.loading = false;
        state.suggestions = action.payload || [];
      })
      .addCase(fetchSuggestions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(followUser.fulfilled, (state, action) => {
        const userId = action.meta.arg;
        const followRequest = action.payload;
        
        if (followRequest?.status === 'PENDING') {
            // Update the status in suggestions instead of removing it
            const index = state.suggestions.findIndex(user => user._id === userId);
            if (index !== -1) {
                state.suggestions[index].followStatus = 'PENDING';
            }
        } else {
            // Remove from suggestions if accepted (public account)
            state.suggestions = state.suggestions.filter(user => user._id !== userId);
        }
      })
      .addCase(unfollowUser.fulfilled, (state, action) => {
        const userId = action.meta.arg;
        const index = state.suggestions.findIndex(user => user._id === userId);
        if (index !== -1) {
            state.suggestions[index].followStatus = null;
        }
      })
      .addCase(acceptFollowRequest.fulfilled, (state, action) => {
        const userId = action.meta.arg;
        const index = state.suggestions.findIndex(user => user._id === userId);
        if (index !== -1) {
            state.suggestions[index].followsMe = true;
        }
      });
  },
});

export default userSlice.reducer;
