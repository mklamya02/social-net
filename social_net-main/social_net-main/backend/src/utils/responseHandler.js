/**
 * responseHandler.js - The Unified Messenger
 * 
 * Instead of manually writing res.status(200).json(...) in every single controller,
 * we use this helper. It ensures every API response from our server 
 * has the EXACT SAME structure (success, message, data).
 */

const responseHandler = {
  // SUCCESS: Use this for 200 OK, 201 Created, etc.
  success: (res, data = null, message = null, statusCode = 200) => {
    const messages = {
      200: 'Success',
      201: 'Created successfully',
      202: 'Updated successfully',
      203: 'Deleted successfully'
    };

    return res.status(statusCode).json({
      success: true,
      message: message || messages[statusCode] || 'Operation successful',
      data: data
    });
  },

  // ERROR: Use this for 400 Bad Request, 500 Server Error, etc.
  error: (res, message = 'Something went wrong', statusCode = 500, errors = null) => {
    return res.status(statusCode).json({
      success: false,
      message: message,
      statusCode: statusCode, // Useful for the frontend to know the exact error type
      errors: errors
    });
  },

  // PRESETS: Shortcut functions for common errors
  validationError: (res, errors) => {
    return res.status(422).json({ success: false, message: 'Validation failed', errors });
  },

  notFound: (res, resource = 'Resource') => {
    return res.status(404).json({ success: false, message: `${resource} not found` });
  },

  unauthorized: (res, message = 'Unauthorized access') => {
    return res.status(401).json({ success: false, message });
  },

  forbidden: (res, message = 'Forbidden') => {
    return res.status(403).json({ success: false, message });
  }
};

module.exports = responseHandler;