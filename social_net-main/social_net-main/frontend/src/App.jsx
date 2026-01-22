/**
 * App.jsx - The Main Application Component
 * 
 * This is the "Control Center" of the React app. It handles:
 * - Routing (which page to show based on URL)
 * - Authentication state restoration (when you refresh the page)
 * - Socket.io connection for real-time updates
 * - Theme management
 * - Protected routes (pages that require login)
 * - Onboarding flow (forcing new users to select interests)
 */

import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { SplashScreen } from '@/components/ui/SplashScreen'; // Import SplashScreen
import { motion, AnimatePresence } from 'framer-motion'; // Import framer-motion

// Layout and Pages
import { AppLayout } from '@/components/layout/AppLayout';
import Feed from '@/pages/Feed';
import { ProfilePage } from '@/pages/ProfilePage';
import { BookmarksPage } from '@/pages/BookmarksPage';
import { ArchivedPostsPage } from '@/pages/ArchivedPostsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { NotificationsPage } from '@/pages/NotificationsPage';
import SearchPage from '@/pages/SearchPage';
import { InterestsPage } from '@/pages/onboarding/InterestsPage';
import { RecommendedPage } from '@/pages/RecommendedPage';

// Redux
import { useSelector, useDispatch } from 'react-redux';
import { setAuth } from '@/store/slices/authSlice';
import { addNotification } from '@/store/slices/notificationsSlice';
import { updatePostStats } from '@/store/slices/postSlice';

// Services
import socketService from '@/services/socket';

// UI
import { Toaster } from 'react-hot-toast'; // For showing toast notifications

/**
 * ONBOARDING GUARD
 * 
 * This component ensures new users complete the onboarding process.
 * If a user just signed up and hasn't selected interests, they are
 * redirected to the interests page and can't access other pages.
 */
const OnboardingGuard = ({ children }) => {
  const { isAuthenticated, user, isJustSignedUp } = useSelector(state => state.auth);
  const location = useLocation();

  // If user just signed up and has no interests, force them to onboarding
  if (isAuthenticated && user && isJustSignedUp && (!user.interests || user.interests.length === 0)) {
    if (location.pathname !== '/onboarding/interests') {
      return <Navigate to="/onboarding/interests" replace />;
    }
  }

  // If user already has interests but tries to go back to onboarding, redirect home
  if (isAuthenticated && user && user.interests && user.interests.length > 0 && location.pathname === '/onboarding/interests') {
    return <Navigate to="/" replace />;
  }

  return children;
};

/**
 * PROTECTED ROUTE WRAPPER
 * 
 * This component protects routes that require authentication.
 * If user is not logged in, they are redirected to the home page.
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useSelector(state => state.auth);
  
  // If not authenticated, redirect to home (which shows login/signup)
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

/**
 * MAIN APP COMPONENT
 */
function App() {
  const dispatch = useDispatch();
  const [isRehydrating, setIsRehydrating] = useState(true); // Loading state while restoring auth
  const [showSplash, setShowSplash] = useState(true); // Show splash initially

  const { theme } = useSelector(state => state.ui);

  /**
   * THEME SYNCHRONIZATION
   * 
   * Whenever the theme changes in Redux, update the HTML root element
   * to apply the correct CSS classes (light or dark mode).
   */
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark'); // Remove both classes first
    root.classList.add(theme);               // Add the current theme
  }, [theme]);

  /**
   * AUTH STATE REHYDRATION
   * 
   * When the app loads, check if there's a token and user data in localStorage.
   * If yes, restore the authentication state so the user stays logged in
   * even after refreshing the page.
   */
  useEffect(() => {
    const rehydrate = async () => {
      // Get stored data from localStorage
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');

      if (token && userStr) {
        try {
          const user = JSON.parse(userStr); // Parse the JSON string to object
          
          // Restore auth state in Redux
          dispatch(setAuth({ user, token }));
          
          // Fetch fresh user data from the server to ensure it's up-to-date
          const { fetchMe } = await import('@/store/slices/authSlice');
          await dispatch(fetchMe());
        } catch (e) {
          console.error("Failed to rehydrate auth", e);
          // If anything fails, clear the corrupted data
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      
      setIsRehydrating(false); // Done loading logic
      // Keep splash visible for a minimum duration for smooth UX
      setTimeout(() => setShowSplash(false), 2000); 
    };

    rehydrate();
  }, [dispatch]);

  /**
   * SOCKET.IO CONNECTION
   * 
   * When the user is authenticated, establish a WebSocket connection
   * for real-time updates (notifications, post stats, etc.).
   */
  const { isAuthenticated, token, user } = useSelector(state => state.auth);

  useEffect(() => {
    if (isAuthenticated && token && user) {
      // Connect to Socket.io server with authentication token
      const socket = socketService.connect(token);
      
      // Register this user's socket connection with their user ID
      socket.emit('register', user._id || user.id);

      // Listen for new notifications
      socketService.on('notification:new', (notification) => {
        dispatch(addNotification(notification)); // Add to Redux store
      });

      // Listen for post updates (likes, comments, etc.)
      socketService.on('post_updated', (data) => {
        dispatch(updatePostStats(data)); // Update post stats in Redux
      });

      // Cleanup function: disconnect and remove listeners when component unmounts
      return () => {
        socketService.off('notification:new');
        socketService.off('post_updated');
        socketService.disconnect();
      };
    }
  }, [isAuthenticated, token, user, dispatch]);

  /**
   * LOADING STATE
   * 
   * While we're restoring authentication state, show nothing
   * to avoid flashing the wrong UI.
   */


  /**
   * RENDER THE APP
   */
  return (
    <>
      <AnimatePresence mode="wait">
        {showSplash ? (
           <SplashScreen key="splash" theme={theme} />
        ) : (
           <motion.div key="app" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
              {/* Main Layout: Navbar + Sidebars + Content */}
              <AppLayout>
                {/* Onboarding Guard: Ensures new users complete interests selection */}
                <OnboardingGuard>
                  {/* Route Configuration: Maps URLs to components */}
                  <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<Feed />} />
                    <Route path="/search" element={<SearchPage />} />
                    <Route path="/profile/:id" element={<ProfilePage />} />
                    
                    {/* Onboarding Route */}
                    <Route path="/onboarding/interests" element={<InterestsPage />} />
                    
                    {/* Protected Routes: Require authentication */}
                    <Route path="/recommended" element={<ProtectedRoute><RecommendedPage /></ProtectedRoute>} />
                    <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
                    <Route path="/bookmarks" element={<ProtectedRoute><BookmarksPage /></ProtectedRoute>} />
                    <Route path="/archived" element={<ProtectedRoute><ArchivedPostsPage /></ProtectedRoute>} />
                    <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
                    
                    {/* Catch-all: Redirect unknown routes to home */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </OnboardingGuard>
              </AppLayout>
              
              {/* Toast Notifications: Shows success/error messages */}
              <Toaster 
                position="bottom-center"
                toastOptions={{
                  className: 'font-bold rounded-2xl bg-card text-foreground border border-border/50 shadow-2xl backdrop-blur-xl',
                  duration: 4000, // Show for 4 seconds
                }}
              />
           </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default App;

