/**
 * socket.js - WebSocket Service for Real-Time Communication
 * 
 * This file manages the Socket.io connection to the backend.
 * Think of it as the "Walkie-Talkie" that enables instant updates.
 * 
 * Use Cases:
 * - Real-time notifications (someone liked your post)
 * - Live post stats updates (like counts, comment counts)
 * - Instant messaging (if implemented)
 * - Online status indicators
 */

import { io } from 'socket.io-client';

// Get the Socket.io server URL from environment variables
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:8080';

/**
 * SOCKET SERVICE CLASS
 * 
 * This is a singleton class (only one instance exists).
 * It manages the WebSocket connection lifecycle.
 */
class SocketService {
  constructor() {
    this.socket = null; // Will hold the Socket.io connection
  }

  /**
   * CONNECT TO SOCKET SERVER
   * 
   * Establishes a WebSocket connection with authentication.
   * If already connected, returns the existing connection.
   * 
   * @param {string} token - JWT access token for authentication
   * @returns {Socket} The Socket.io connection instance
   */
  connect(token) {
    // If already connected, don't create a new connection
    if (this.socket?.connected) {
      return this.socket;
    }

    // Create a new Socket.io connection
    this.socket = io(SOCKET_URL, {
      auth: {
        token, // Send JWT token for authentication
      },
      autoConnect: false, // Don't connect automatically (we'll call .connect() manually)
      withCredentials: true, // Allow sending cookies
    });

    // Manually initiate the connection
    this.socket.connect();

    /**
     * CONNECTION EVENT HANDLERS
     */
    
    // When successfully connected
    this.socket.on('connect', () => {
      // Connection established! (Could log or show notification here)
    });

    // When disconnected
    this.socket.on('disconnect', () => {
      // Connection lost! (Could show reconnection UI here)
    });

    // When an error occurs
    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    return this.socket;
  }

  /**
   * DISCONNECT FROM SOCKET SERVER
   * 
   * Closes the WebSocket connection and cleans up.
   * Called when user logs out or app unmounts.
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect(); // Close the connection
      this.socket = null;       // Clear the reference
    }
  }

  /**
   * LISTEN FOR EVENTS
   * 
   * Register a callback function to run when a specific event is received.
   * 
   * @param {string} event - Event name (e.g., 'notification:new')
   * @param {function} callback - Function to call when event is received
   */
  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  /**
   * STOP LISTENING FOR EVENTS
   * 
   * Remove a previously registered event listener.
   * Important for cleanup to avoid memory leaks!
   * 
   * @param {string} event - Event name
   * @param {function} callback - The callback to remove (optional)
   */
  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  /**
   * SEND EVENT TO SERVER
   * 
   * Emit an event to the server with optional data.
   * 
   * @param {string} event - Event name (e.g., 'register')
   * @param {any} data - Data to send with the event
   */
  emit(event, data) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  /**
   * GET SOCKET INSTANCE
   * 
   * Returns the raw Socket.io instance for advanced usage.
   * 
   * @returns {Socket|null} The Socket.io instance
   */
  getSocket() {
    return this.socket;
  }
}

// Export a single instance (Singleton pattern)
// This ensures the entire app uses the same WebSocket connection
export default new SocketService();

