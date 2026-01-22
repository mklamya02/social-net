const Joi = require('joi');

const userSchema = Joi.object({
  firstName: Joi.string()
    .required()
    .min(2)
    .max(30)
    .trim()
    .messages({
      'string.empty': 'First name is required',
      'string.min': 'First name must be at least 2 characters',
      'string.max': 'First name must be less than 30 characters',
      'any.required': 'First name is required'
    }),

  lastName: Joi.string()
    .required()
    .min(2)
    .max(30)
    .trim()
    .messages({
      'string.empty': 'Last name is required',
      'string.min': 'Last name must be at least 2 characters',
      'string.max': 'Last name must be less than 30 characters',
      'any.required': 'Last name is required'
    }),


  email: Joi.string()
    .required()
    .email()
    .lowercase()
    .trim()
    .messages({
      'string.empty': 'Email is required',
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),

  password: Joi.string()
    .required()
    .min(6)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .messages({
      'string.empty': 'Password is required',
      'string.min': 'Password must be at least 6 characters',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      'any.required': 'Password is required'
    }),

isPrivate: Joi.boolean()
    .default(false)
});

// Schema for user creation (register)
const createUserSchema = userSchema.keys({
  firstName: userSchema.extract('firstName'),
  lastName: userSchema.extract('lastName'),
  email: userSchema.extract('email'),
  password: userSchema.extract('password'),
  isPrivate: userSchema.extract('isPrivate')
});

// Schema for user update (no password required)
const updateUserSchema = Joi.object({

  email: Joi.string()
    .email()
    .lowercase()
    .trim(),

  isPrivate: Joi.boolean()
}).min(1); // At least one field must be provided

// Schema for login
const loginSchema = Joi.object({
  email: Joi.string()
    .required()
    .email()
    .lowercase()
    .trim()
    .messages({
      'string.empty': 'Email is required',
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),

  password: Joi.string()
    .required()
    .messages({
      'string.empty': 'Password is required',
      'any.required': 'Password is required'
    })
});

// Schema for password update
const changePasswordSchema = Joi.object({
  currentPassword: Joi.string()
    .required()
    .messages({
      'string.empty': 'Current password is required',
      'any.required': 'Current password is required'
    }),

  newPassword: Joi.string()
    .required()
    .min(6)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .invalid(Joi.ref('currentPassword'))
    .messages({
      'string.empty': 'New password is required',
      'string.min': 'New password must be at least 6 characters',
      'string.pattern.base': 'New password must contain at least one uppercase letter, one lowercase letter, and one number',
      'any.invalid': 'New password must be different from current password',
      'any.required': 'New password is required'
    }),

  confirmNewPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({
      'any.only': 'Passwords do not match',
      'any.required': 'Please confirm your new password'
    })
});

module.exports = {
  createUserSchema,
  updateUserSchema,
  loginSchema,
  changePasswordSchema
};