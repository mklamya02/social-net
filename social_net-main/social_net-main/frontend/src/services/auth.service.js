/**
 * auth.service.js - Authentication API Service
 * 
 * This file contains all authentication-related API calls.
 * Think of it as the "Security Desk" that handles login, logout, and registration.
 * 
 * All functions here:
 * 1. Make API calls to the backend
 * 2. Store authentication tokens in localStorage
 * 3. Return the response data
 */

import api from './api';

export const authService = {
  /**
   * LOGIN
   * 
   * Authenticates a user with email and password.
   * On success, stores tokens and user data in localStorage.
   * 
   * @param {Object} credentials - { email, password }
   * @returns {Promise<Object>} Response with user data and tokens
   */
  login: async (credentials) => {
    // Send login request to backend
    const response = await api.post('/auth/login', credentials);
    
    // Response is already extracted by api.js interceptor
    // Check if we got an access token back
    if (response?.accessToken) {
      // Store the access token (used for API requests)
      localStorage.setItem('token', response.accessToken);
      
      // Store the refresh token if provided (used to get new access tokens)
      if (response.refreshToken) {
        localStorage.setItem('refreshToken', response.refreshToken);
      }
      
      // Store user data for quick access (avoid extra API calls)
      if (response.user) {
        localStorage.setItem('user', JSON.stringify(response.user));
      }
    }
    
    return response;
  },

  /**
   * REGISTER
   * 
   * Creates a new user account.
   * On success, automatically logs the user in by storing tokens.
   * 
   * @param {Object} userData - { firstName, lastName, email, password, etc. }
   * @returns {Promise<Object>} Response with user data and tokens
   */
  register: async (userData) => {
    // Send registration request to backend
    const response = await api.post('/auth/register', userData);
    
    // If registration successful, store auth data (auto-login)
    if (response?.accessToken) {
      localStorage.setItem('token', response.accessToken);
      
      if (response.refreshToken) {
        localStorage.setItem('refreshToken', response.refreshToken);
      }
      
      if (response.user) {
        localStorage.setItem('user', JSON.stringify(response.user));
      }
    }
    
    return response;
  },

  /**
   * LOGOUT
   * 
   * Logs out the current user.
   * Clears all authentication data from localStorage.
   * Even if the backend call fails, we still clear local data.
   * 
   * @returns {Promise<void>}
   */
  logout: async () => {
    try {
      // Notify backend to invalidate the session
      await api.post('/auth/logout');
    } finally {
      // ALWAYS clear local auth data, even if backend call fails
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  },

  /**
   * REFRESH TOKEN
   * 
   * Gets a new access token using the refresh token.
   * Called automatically by api.js when access token expires.
   * 
   * @returns {Promise<Object>} Response with new access token
   */
  refreshToken: async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    
    // Send refresh token to backend
    const response = await api.post('/auth/refresh-token', { refreshToken });
    
    // Store the new access token
    if (response?.accessToken) {
      localStorage.setItem('token', response.accessToken);
    }
    
    return response;
  },

  /**
   * GET CURRENT USER
   * 
   * Fetches the current user's data from the backend.
   * Useful for refreshing user data after profile updates.
   * 
   * @returns {Promise<Object>} Current user data
   */
  getCurrentUser: async () => {
    return await api.get('/auth/me');
  },
};

