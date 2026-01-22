/**
 * thread.model.js - The Thread (Post) Blueprint
 * 
 * A "Thread" is a post on the platform. It can be a standalone post, 
 * a repost, or a quote.
 */

const mongoose = require("mongoose");

const threadSchema = new mongoose.Schema(
  {
    // The text content of the post
    content: {
      type: String,
      required: false, // Optional because a post could be media-only (like Instagram)
      trim: true,
    },

    // Media attachments (images or videos)
    media: {
      mediaType: {
        type: String,
        enum: ["image", "video"], // Only allow these two types
      },
      data: Buffer,   // Legacy: used if images were stored directly in DB (Not recommended for scale)
      url: String,    // The URL where the file can be accessed (MinIO)
      key: String,    // The "filename" in storage, used to delete or update the file
      contentType: String, // e.g., 'image/png'
    },

    // RELATION: The User who created this post
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Links to the 'User' collection
      required: true,
    },

    // RELATION: If this post is a comment on another thread
    parentThread: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Thread",
      default: null,
    },

    // RELATION: If this is a direct Repost
    repostOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Thread",
      default: null,
    },

    // RELATION: If this is a Quote (Repost with a comment)
    quoteOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Thread",
      default: null,
    },

    // Metadata for searching and tagging
    hashtags: [{
      type: String,
      trim: true,
      lowercase: true
    }],
    mentions: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }],

    // Soft delete/archive
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // track when it was posted
  }
);

/**
 * INDEXES - The "Library Index Cards"
 * These make it fast for MongoDB to find things.
 */
threadSchema.index({ content: 'text', hashtags: 'text' }); // For text search
threadSchema.index({ author: 1, createdAt: -1 });         // For bringing up a user's profile feed
threadSchema.index({ repostOf: 1 });                      // To finding how many times a thread was reposted
threadSchema.index({ parentThread: 1 });                  // To finding the thread tree (conversation)

module.exports = mongoose.model("Thread", threadSchema);
