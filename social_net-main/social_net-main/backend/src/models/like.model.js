/**
 * like.model.js - Engagement Tracking
 * 
 * This is a "Polymorphic" like model. 
 * ONE collection can track likes for both Threads AND Comments.
 */

const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema(
  {
    // Who liked it?
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // What did they like? (Exactly ONE of these should be filled)
    thread: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Thread',
      required: false,
    },
    comment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * COMPOSITE UNIQUE INDEX
 * This ensures a user can only like a specific thread or comment once.
 */
likeSchema.index({ user: 1, thread: 1, comment: 1 }, { unique: true });

module.exports = mongoose.model('Like', likeSchema);
