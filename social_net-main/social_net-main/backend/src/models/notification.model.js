/**
 * notification.model.js - Keeping Users Engaged
 * 
 * This model stores all the "alerts" a user receives.
 */

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // What happened?
  type: {
    type: String,
    enum: [
      'FOLLOW_REQUEST',   // Someone wants to follow your private account
      'FOLLOW_ACCEPTED',  // Someone approved your follow request
      'NEW_FOLLOWER',     // Someone followed your public account
      'LIKE',             // Someone liked your post/comment
      'COMMENT',          // Someone replied to you
      'NEW_THREAD'        // (Optional) Someone you follow posted
    ],
    required: true
  },
  // Who is receiving the alert?
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Who performed the action?
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // CONTEXT: Which post or comment is this about?
  thread: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Thread',
    default: null
  },
  comment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  },
  // Status of the alert
  isRead: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true // When did the alert happen?
});

// Index to quickly find a user's unread notifications
notificationSchema.index({ receiver: 1, isRead: 1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
