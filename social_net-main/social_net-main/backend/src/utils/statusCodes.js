/**
 * statusCodes.js - The Standard Dictionary
 * 
 * Instead of remembering that '201' means Created and '404' means Not Found,
 * we use human-readable names. This makes the code much easier to read!
 */

const statusCodes = {
  SUCCESS: 200,
  CREATED: 201, // New thing made
  UPDATED: 202, // Thing changed
  DELETED: 203, // Thing gone
  
  BAD_REQUEST: 400,    // Client sent garbage
  UNAUTHORIZED: 401,   // No login token
  FORBIDDEN: 403,      // Logged in, but not allowed (e.g. deleting someone else's post)
  NOT_FOUND: 404,      // URL or resource doesn't exist
  CONFLICT: 409,       // Username already taken
  VALIDATION_ERROR: 422, // Data didn't meet Joi rules
  
  INTERNAL_SERVER_ERROR: 500 // Our code crashed
};

const statusMessages = {
  200: 'Success',
  201: 'Created successfully',
  401: 'Unauthorized - Please login',
  404: 'Resource not found',
  500: 'Internal server error'
};

module.exports = { statusCodes, statusMessages };