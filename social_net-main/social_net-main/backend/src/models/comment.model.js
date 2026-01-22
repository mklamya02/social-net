/**
 * comment.model.js - The Conversations
 * 
 * This model handles comments on threads. 
 * Comments are slightly different from threads in this specific implementation.
 */

const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
      trim: true,
    },
    // The person who wrote the comment
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // The "Main Post" being commented on
    thread: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Thread",
      required: true,
    },
    // RECURSIVE RELATION: If this is a reply to another comment
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null
    },
    // Comments can also have media!
    media: {
      mediaType: {
        type: String,
        enum: ["image", "video"],
      },
      url: String,
      key: String,
      contentType: String,
    },
    // A cached count to avoid expensive database queries
    likesCount: {
        type: Number,
        default: 0
    }
  },
  {
    timestamps: true,
  }
);

// Indexes to speed up loading comments for a specific post
commentSchema.index({ thread: 1, createdAt: 1 });
commentSchema.index({ author: 1 });

module.exports = mongoose.model("Comment", commentSchema);
