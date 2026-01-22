/**
 * validate.js - The Data Cleaner
 * 
 * Checks incoming data against a "Schema" (rules).
 * For example, it ensures a password is long enough before 
 * we even try to save it.
 */

const responseHandler = require('../utils/responseHandler');

const validate = (schema) => {
  return (req, res, next) => {
    // validate() comes from the Joi library
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,     // report all errors, not just the first one
      stripUnknown: true    // remove keys that aren't in the schema
    });

    if (error) {
      const errors = error.details.map(detail => detail.message);
      return responseHandler.validationError(res, errors);
    }

    // Replace the raw body with the "clean" one (stripped of extra fields)
    req.body = value;
    next();
  };
};

module.exports = validate;