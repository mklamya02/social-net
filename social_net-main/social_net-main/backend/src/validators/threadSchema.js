const Joi = require('joi');
//regex pattern for mongodb object id
const objectIdPattern = /^[0-9a-fA-F]{24}$/;

const createThreadSchema = Joi.object({
  content: Joi.string()
    .trim()
    .min(1)
    .allow('') // Allow empty string when media is present
    .optional()
    .messages({
      'string.empty': 'Content cannot be empty',
    }),

  parentThread: Joi.string()
    .pattern(objectIdPattern)
    .optional()
    .messages({
      'string.pattern.base': 'Parent thread must be a valid MongoDB ObjectId',
    }),
}).unknown(true); // Allow unknown fields like 'media' from multer

module.exports = createThreadSchema;
