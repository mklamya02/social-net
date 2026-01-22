/**
 * user.model.js - The User Blueprint
 * 
 * This file defines what a "User" looks like in our database.
 * Think of it as a "Registration Form" definition.
 */

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // Basic Identity
  firstName: {
    type: String,
    required: true,
    trim: true, // Removes accidental spaces (" John " -> "John")
    minlength: 2,
    maxlength: 30
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: true,
    minlength: 6 // Security best practice
  },

  // Privacy & Profile
  isPrivate: {
    type: Boolean,
    default: false // If true, follow requests must be approved
  },
  bio: {
    type: String,
    trim: true,
    maxlength: 160,
    default: ''
  },
  location: {
    type: String,
    trim: true,
    maxlength: 30,
    default: ''
  },
  website: {
    type: String,
    trim: true,
    maxlength: 100,
    default: ''
  },
  birthday: {
    type: String,
    default: ''
  },
  showBirthday: {
    type: Boolean,
    default: true
  },
  interests: {
    type: [String],
    default: [],
    validate: {
      validator: function(v) {
        return Array.isArray(v) && new Set(v).size === v.length;
      },
      message: 'Interests must be unique strings'
    }
  },

  // Media (Avatar & Banner)
  avatar: {
    url: String, // Link to the image in MinIO
    key: String  // The unique ID of the file in MinIO (for deletion)
  },
  avatarType: {
    type: String,
    default: null
  },
  banner: {
    url: String,
    key: String
  },
  bannerType: {
    type: String,
    default: null
  },

  // Relations & Stats
  bookmarks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Thread' // Array of references to Threads the user saved
  }],
  followersCount: {
    type: Number,
    default: 0,
    min: 0
  },
  followingCount: {
    type: Number,
    default: 0,
    min: 0
  },

  // Authentication Security
  refreshToken: {
    type: String,
    default: null // Used for persistent login sessions
  }
}, {
  timestamps: true // Automatically adds 'createdAt' and 'updatedAt'
});

// SEARCH INDEX: Allows us to search for users by name or email efficiently
userSchema.index({ firstName: 'text', lastName: 'text', email: 'text' });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName || ''} ${this.lastName || ''}`.trim();
});

// Virtual for handle (e.g., @john_doe1234)
userSchema.virtual('handle').get(function() {
  const base = `${this.firstName || ''}${this.lastName || ''}`.toLowerCase().replace(/[^a-z0-9]/g, '');
  const suffix = this._id ? this._id.toString().slice(-4) : '';
  return `@${base}${suffix}`;
});

// Ensure virtuals are serialized
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

const User = mongoose.model('User', userSchema);
module.exports = User;
