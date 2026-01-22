/**
 * store/index.js - Redux Store Configuration
 * 
 * This is the "Central Database" of our frontend application.
 * Redux stores ALL the application state in one place, making it easy to:
 * - Share data between components
 * - Track state changes
 * - Debug application behavior
 * 
 * Think of it as a global JavaScript object that any component can read from or write to.
 */

import { configureStore } from '@reduxjs/toolkit'; // Redux Toolkit's store creator

// Import all the "slices" (different sections of our state)
import authReducer from './slices/authSlice';           // User authentication (login, logout, current user)
import uiReducer from './slices/uiSlice';               // UI state (modals, theme, sidebar)
import notificationsReducer from './slices/notificationsSlice'; // User notifications
import postReducer from './slices/postSlice';           // Posts/threads (feed, bookmarks, etc.)
import userReducer from './slices/userSlice';           // User profiles and suggestions
import searchReducer from './slices/searchSlice';       // Search results

/**
 * CREATE THE STORE
 * 
 * The store is like a filing cabinet with different drawers (slices):
 * - auth: Who is logged in? What's their info?
 * - ui: Is a modal open? What theme are we using?
 * - notifications: What notifications does the user have?
 * - posts: What posts are in the feed? What's bookmarked?
 * - user: What user profiles have we loaded?
 * - search: What are the current search results?
 */
export const store = configureStore({
  reducer: {
    auth: authReducer,                 // state.auth.user, state.auth.token, etc.
    ui: uiReducer,                     // state.ui.theme, state.ui.isModalOpen, etc.
    notifications: notificationsReducer, // state.notifications.items, state.notifications.unreadCount, etc.
    posts: postReducer,                // state.posts.feed, state.posts.bookmarks, etc.
    user: userReducer,                 // state.user.currentProfile, state.user.suggestions, etc.
    search: searchReducer,             // state.search.users, state.search.posts, etc.
  },
});

// Export the store so main.jsx can provide it to the app
export default store;

