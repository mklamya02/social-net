/**
 * pagination.js - The Page Organizer
 * 
 * Ensures 'page' and 'limit' query parameters are valid numbers.
 * Defaults to page 1 and 10 items per page if not specified.
 */

const responseHandler = require('../utils/responseHandler');

const pagination = (req, res, next) => {
  // Extract from URL (e.g., ?page=2&limit=5)
  let { page = 1, limit = 10 } = req.query;

  page = parseInt(page);
  limit = parseInt(limit);

  const errors = [];
  if (isNaN(page) || page < 1) errors.push('Page must be a positive integer');
  if (isNaN(limit) || limit < 1) errors.push('Limit must be a positive integer');

  if (errors.length > 0) return responseHandler.validationError(res, errors);

  // Attach the numbers to 'req.pagination' for the controllers to use
  req.pagination = { page, limit };
  next();
};

module.exports = pagination;
