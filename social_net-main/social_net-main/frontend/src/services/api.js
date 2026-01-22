/**
 * api.js - The HTTP Client Configuration
 *
 * This file creates and configures an Axios instance that all API calls use.
 * Think of it as the "Messenger" that carries requests to the backend.
 *
 * Key Features:
 * - Automatically adds authentication tokens to requests
 * - Handles token refresh when access token expires
 * - Extracts data from backend response format
 * - Manages authentication errors
 */

import axios from 'axios';

/**
 * CREATE AXIOS INSTANCE
 *
 * This is our customized HTTP client with default settings.
 */
console.log("VITE_API_BASE_URL =", import.meta.env.VITE_API_BASE_URL);
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api', // Backend API URL
  withCredentials: true, // CRITICAL: Allows sending/receiving cookies (for refresh token)
  headers: {
    // Let axios set Content-Type automatically based on the request body
    // (application/json for objects, multipart/form-data for FormData, etc.)
  },
});

/**
 * REQUEST INTERCEPTOR
 *
 * This runs BEFORE every request is sent.
 * It automatically attaches the authentication token to the request headers.
 */
api.interceptors.request.use(
  (config) => {
    // Get the access token from localStorage
    const token = localStorage.getItem('token');

    // If token exists, add it to the Authorization header
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config; // Send the modified request
  },
  (error) => {
    // If something goes wrong before sending the request
    return Promise.reject(error);
  }
);

/**
 * RESPONSE INTERCEPTOR
 *
 * This runs AFTER every response is received.
 * It handles:
 * 1. Data extraction (unwrapping the backend's response format)
 * 2. Token refresh when access token expires (401 errors)
 * 3. Automatic logout on authentication failure
 */
api.interceptors.response.use(
  (response) => {
    /**
     * DATA EXTRACTION
     *
     * Backend wraps data in this format: { success: true, data: {...} }
     * We extract just the 'data' part for cleaner usage in services.
     */
    if (response.data && response.data.data !== undefined) {
      return response.data.data; // Return just the actual data
    }
    return response.data; // Fallback if structure is different
  },
  async (error) => {
    const originalRequest = error.config;

    /**
     * HANDLE 401 UNAUTHORIZED (Token Expired)
     *
     * When the access token expires, the backend returns 401.
     * We try to refresh the token using the refresh token (stored in HttpOnly cookie).
     * If successful, we retry the original request with the new token.
     */
    if (
      error.response?.status === 401 &&           // Is it a 401 error?
      !originalRequest._retry &&                  // Haven't tried refreshing yet?
      !originalRequest.url.includes('/auth/login') && // Not a login request?
      !originalRequest.url.includes('/auth/register') // Not a register request?
    ) {
      originalRequest._retry = true; // Mark that we're retrying

      try {
        // Try to refresh the access token
        const response = await axios.post(
          '/api/auth/refresh-token',
          {}, // Body not needed (refresh token is in HttpOnly cookie)
          { withCredentials: true } // CRITICAL: Send cookies with this request
        );

        // Extract the new access token from the response
        const accessToken = response.data?.data?.accessToken || response.data?.accessToken;

        // Save the new token to localStorage
        localStorage.setItem('token', accessToken);

        // Retry the original request with the new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest); // Retry!

      } catch (refreshError) {
        /**
         * REFRESH FAILED - Logout User
         *
         * If refresh token is also invalid/expired, the user needs to log in again.
         * Clear all auth data and redirect to home page.
         */
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/'; // Redirect to home/login
        return Promise.reject(refreshError);
      }
    }

    // For all other errors, just pass them through
    return Promise.reject(error);
  }
);

// Export the configured axios instance
export default api;
