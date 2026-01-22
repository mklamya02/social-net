/**
 * follower.model.js - The Follow Relationship
 * 
 * This model tracks who follows whom. 
 * Instead of storing followers inside the User object, we use a separate collection.
 * This is called a "Many-to-Many" relationship.
 */

const mongoose = require('mongoose');

const followSchema = new mongoose.Schema({
  // The person who clicks "Follow"
  follower: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // The person who IS being followed
  following: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // STATUS: Crucial for private accounts
  // PENDING = Request sent, waiting for approval
  // ACCEPTED = Following successful
  // REFUSED = Request rejected
  status: {
    type: String,
    enum: ['PENDING', 'ACCEPTED', 'REFUSED'],
    default: 'PENDING'
  }
}, {
  timestamps: true // Tracks when the follow happened
});

/**
 * IMPORTANT INDEX: This ensures that User A can only follow User B once.
 * The 'unique: true' prevents duplicate follow records.
 */
followSchema.index({ follower: 1, following: 1 }, { unique: true });

const Follow = mongoose.model('Follow', followSchema);

module.exports = Follow;
