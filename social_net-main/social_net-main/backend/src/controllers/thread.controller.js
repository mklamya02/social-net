/**
 * thread.controller.js - The Post Factory
 * 
 * This is the largest controller. It handles everything users see 
 * in their main feed.
 */

const Thread = require("../models/thread.model");
const Comment = require("../models/comment.model");
const User = require('../models/user.model');
const Like = require("../models/like.model");
const Follow = require('../models/follower.model'); 
const Notification = require('../models/notification.model'); 
const responseHandler = require('../utils/responseHandler');
const { statusCodes } = require('../utils/statusCodes');
const { emitToUser } = require('../socket');
const { populateNotification } = require('../utils/notificationHelper');
const { formatThreadResponse } = require("../utils/threadFormatter");

/**
 * CREATE A NEW THREAD
 */
const createThread = async (req, res) => {
  try {
    const { content, parentThread } = req.body;
    
    // Check if there is something to post (text OR media)
    const hasMedia = !!req.file;
    const hasContent = content && content.trim() !== "";

    if (!hasContent && !hasMedia) {
      return responseHandler.error(res, "Thread must contain either text or media", statusCodes.BAD_REQUEST);
    }

    // Extraction: Find hashtags (#cool) and mentions (@user) in the text
    const safeContent = content ? content : "";
    const hashtags = safeContent.match(/#[a-z0-9_]+/gi) || []; 
    const mentions = safeContent.match(/@[a-z0-9_]+/gi) || []; 

    // Find the IDs of the users mentioned
    const mentionedUserIds = [];
    if (mentions.length > 0) {
        const usernames = mentions.map(m => m.substring(1)); // Remove the '@'
        const users = await User.find({ username: { $in: usernames } }).select('_id');
        users.forEach(u => mentionedUserIds.push(u._id));
    }

    const threadData = {
      content: safeContent.trim(),
      author: req.user.id, 
      parentThread: parentThread || null,
      hashtags: hashtags.map(h => h.toLowerCase().substring(1)), // Save 'cool' instead of '#cool'
      mentions: mentionedUserIds
    };

    /**
     * MEDIA UPLOAD Logic
     * We don't save images in MongoDB (too slow/heavy).
     * We upload them to MinIO (Storage Server) and save the URL.
     */
    if (req.file) {
      try {
        const { uploadToMinIO, generateUniqueFileName } = require('../utils/minioHelper');
        const mediaType = req.file.mimetype.startsWith("video/") ? "video" : "image";
        const uniqueFileName = generateUniqueFileName(req.file.originalname);
        
        // Upload to storage
        const { key, url } = await uploadToMinIO(req.file.path, uniqueFileName, req.file.mimetype);
        
        // Save the reference data in the Database
        threadData.media = {
          mediaType: mediaType,
          url: url,
          key: key,
          contentType: req.file.mimetype,
        };
      } catch (uploadError) {
        console.error("Media upload error:", uploadError);
        return responseHandler.error(res, "Failed to upload media file", statusCodes.INTERNAL_SERVER_ERROR);
      }
    }

    // Save the thread record
    const thread = await Thread.create(threadData);

    // Prepare for response by 'populating' author data
    const populatedThread = await Thread.findById(thread._id)
      .populate('author', '_id firstName lastName avatar avatarType')
      .lean();

    // formatThreadResponse adds extra info like 'isLiked' and 'isBookmarked' for the current user
    const formattedThread = await formatThreadResponse(populatedThread, req.user.id);

    // NOTIFICATIONS: Alert users who were mentioned
    if (mentionedUserIds.length > 0) {
      mentionedUserIds.forEach(async (mentionedId) => {
          if (mentionedId.toString() !== req.user.id) {
             const notification = await Notification.create({
                type: 'NEW_THREAD', 
                receiver: mentionedId,
                sender: req.user.id,
                thread: thread._id,
                isRead: false
             });
             // Real-time notification via WebSockets
             emitToUser(mentionedId, 'notification:new', notification);
          }
      });
    }

    return responseHandler.success(res, formattedThread, "Thread created successfully", statusCodes.CREATED);

  } catch (error) {
    return responseHandler.error(res, error.message || "Failed to create thread", statusCodes.INTERNAL_SERVER_ERROR);
  }
};
/**
 * GET USER THREADS
 * Fetches all posts belonging to a specific user (the authenticated one).
 */
const getUserThreads = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page, limit } = req.pagination; // Pagination middleware logic
    const skip = (page - 1) * limit;

    const totalThreads = await Thread.countDocuments({ author: userId, isArchived: false });
    
    const threads = await Thread.find({ author: userId, isArchived: false })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', '_id firstName lastName avatar avatarType')
      .lean();

    // Format each thread to include 'liked by me' status
    const formattedThreads = (await Promise.all(
        threads.map(thread => formatThreadResponse(thread, userId))
    )).filter(thread => thread !== null);

    const totalPages = Math.ceil(totalThreads / limit);

    return responseHandler.success(res, {
      threads: formattedThreads,
      pagination: { totalThreads, totalPages, currentPage: page, pageSize: limit },
    }, 'User threads fetched successfully', statusCodes.SUCCESS);

  } catch (error) {
    return responseHandler.error(res, null, statusCodes.INTERNAL_SERVER_ERROR);
  }
};

/**
 * GET ARCHIVED THREADS
 * Similar to getUserThreads but for hidden/archived posts.
 */
const getArchivedThreads = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page, limit } = req.pagination;
    const skip = (page - 1) * limit;

    const totalThreads = await Thread.countDocuments({ author: userId, isArchived: true });
    
    const threads = await Thread.find({ author: userId, isArchived: true })
      .sort({ updatedAt: -1 }) 
      .skip(skip)
      .limit(limit)
      .populate('author', '_id firstName lastName avatar avatarType')
      .lean();

    const formattedThreads = (await Promise.all(
        threads.map(thread => formatThreadResponse(thread, userId))
    )).filter(thread => thread !== null);

    const totalPages = Math.ceil(totalThreads / limit);

    return responseHandler.success(res, {
      threads: formattedThreads,
      pagination: { totalThreads, totalPages, currentPage: page, pageSize: limit },
    }, 'Archived threads fetched successfully', statusCodes.SUCCESS);

  } catch (error) {
    return responseHandler.error(res, null, statusCodes.INTERNAL_SERVER_ERROR);
  }
};
const getThreadById = async (req, res) => {
  try {
    const userId = req.user.id;          
    const { threadId } = req.params;   
    const thread = await Thread.findOne({ _id: threadId, author: userId,isArchived: false })
      .populate('author', '_id firstName lastName avatar avatarType') 
      .populate('parentThread', 'content') 
      .lean();

    if (!thread) {
      return responseHandler.notFound(res, "Thread");
    }

    const formattedThread = await formatThreadResponse(thread, userId);
    
    return responseHandler.success(
      res,
      formattedThread,
      'Thread fetched successfully',
      statusCodes.SUCCESS
    );

  } catch (error) {
    console.error('Get thread by ID error:', error);
    return responseHandler.error(res, null, statusCodes.INTERNAL_SERVER_ERROR);
  }
};
const updateThread = async (req, res) => {
  try {
    const userId = req.user.id;
    const { threadId } = req.params;

    // Find the thread by ID and author
    // Find the thread by ID and author
    const thread = await Thread.findOne({ _id: threadId, author: userId });
    if (!thread) {
      return responseHandler.notFound(res, "Thread");
    }
    if (req.body.content !== undefined) {
      thread.content = req.body.content.trim();
    }
    
    // Handle media update
    if (req.file) {
      try {
        const { uploadToMinIO, generateUniqueFileName, deleteFromMinIO } = require('../utils/minioHelper');
        
        // Delete old media from MinIO if it exists
        if (thread.media && thread.media.key) {
          try {
            await deleteFromMinIO(thread.media.key);
            console.log(`Old media deleted from MinIO: ${thread.media.key}`);
          } catch (deleteError) {
            console.warn(`Failed to delete old media: ${deleteError.message}`);
            // Continue with upload even if deletion fails
          }
        }
        
        // Determine media type
        const mediaType = req.file.mimetype.startsWith("video/") ? "video" : "image";
        
        // Generate unique filename
        const uniqueFileName = generateUniqueFileName(req.file.originalname);
        
        
        // Upload to MinIO
        const { key, url } = await uploadToMinIO(
          req.file.path,
          uniqueFileName,
          req.file.mimetype
        );
        
        // Update media with MinIO data
        thread.media = {
          mediaType: mediaType,
          url: url,
          key: key,
          contentType: req.file.mimetype,
        };
        
        console.log(`Media updated successfully: ${key}`);
      } catch (uploadError) {
        console.error("MinIO upload error:", uploadError);
        
        // Clean up temporary file if it still exists
        const fs = require('fs').promises;
        try {
          await fs.unlink(req.file.path);
        } catch (unlinkError) {
          // Ignore cleanup errors
        }
        
        return responseHandler.error(
          res,
          "Failed to upload media file",
          statusCodes.INTERNAL_SERVER_ERROR
        );
      }
    } else if (req.body.media === null) {
      // Allow removing media
      if (thread.media && thread.media.key) {
        try {
          const { deleteFromMinIO } = require('../utils/minioHelper');
          await deleteFromMinIO(thread.media.key);
          console.log(`Media deleted from MinIO: ${thread.media.key}`);
        } catch (deleteError) {
          console.warn(`Failed to delete media: ${deleteError.message}`);
        }
      }
      thread.media = null;
    }

    await thread.save();

    // Populate author username for response
    const updatedThread = await Thread.findById(thread._id)
      .populate('author', '_id firstName lastName avatar avatarType')
      .lean();

    const formattedThread = await formatThreadResponse(updatedThread, userId);

    return responseHandler.success(
      res,
      formattedThread,
      'Thread updated successfully',
      statusCodes.UPDATED
    );

  } catch (error) {
    console.error('Update thread error:', error);
    return responseHandler.error(res, null, statusCodes.INTERNAL_SERVER_ERROR);
  }
};

const archiveThread = async (req, res) => {
  try {
    const userId = req.user.id;
    const { threadId } = req.params;

    const thread = await Thread.findOne({ _id: threadId, author: userId });
    if (!thread) {
      return responseHandler.notFound(res, "Thread");
    }

    thread.isArchived = true;
    await thread.save();

    return responseHandler.success(
      res,
      thread,
      "Thread archived successfully",
      statusCodes.UPDATED
    );

  } catch (error) {
    console.error("Archive thread error:", error);
    return responseHandler.error(res, null, statusCodes.INTERNAL_SERVER_ERROR);
  }
};

const unarchiveThread = async (req, res) => {
  try {
    const userId = req.user.id;
    const { threadId } = req.params;

    const thread = await Thread.findOne({ _id: threadId, author: userId });
    if (!thread) {
      return responseHandler.notFound(res, "Thread");
    }

    thread.isArchived = false;
    await thread.save();

    return responseHandler.success(
      res,
      thread,
      "Thread unarchived successfully",
      statusCodes.UPDATED
    );

  } catch (error) {
    console.error("Unarchive thread error:", error);
    return responseHandler.error(res, null, statusCodes.INTERNAL_SERVER_ERROR);
  }
};

/**
 * DELETE THREAD
 * Removes the post from Database and Storage.
 */
const deleteThread = async (req, res) => {
  try {
    const userId = req.user.id;
    const { threadId } = req.params;

    const thread = await Thread.findOne({ _id: threadId, author: userId });
    
    if (!thread) {
      return responseHandler.notFound(res, "Thread");
    }

    // 1. Clean up Storage (MinIO)
    if (thread.media && thread.media.key) {
      try {
        const { deleteFromMinIO } = require('../utils/minioHelper');
        await deleteFromMinIO(thread.media.key);
      } catch (deleteError) {
        console.warn(`⚠ Failed to delete media: ${deleteError.message}`);
      }
    }

    // 2. Delete the Thread record itself
    await Thread.deleteOne({ _id: threadId });

    // 3. CASCADE DELETE: Remove likes, comments, and notifications 
    // linked to this deleted thread so we don't have "dead" references.
    await Comment.deleteMany({ thread: threadId });
    await Like.deleteMany({ thread: threadId });
    await Notification.deleteMany({ thread: threadId });

    return responseHandler.success(res, { _id: threadId }, "Thread deleted successfully", statusCodes.SUCCESS);

  } catch (error) {
    return responseHandler.error(res, null, statusCodes.INTERNAL_SERVER_ERROR);
  }
};

/**
 * GET FEED (The Timeline)
 * This is the algorithm that decides what you see.
 */
const getFeed = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { mode } = req.query; // 'following' vs 'discover'
    const { page, limit } = req.pagination;
    const skip = (page - 1) * limit;

    // Base filter: Don't show archived posts, don't show comments as main posts
    let filter = { isArchived: false, parentThread: null  };

    if (mode === 'following' && userId) {
        // Mode: Following - Only show people I follow
        const following = await Follow.find({ follower: userId, status: 'ACCEPTED' }).select('following');
        const followingIds = following.map(f => f.following);
        filter.author = { $in: followingIds };
    } else {
        // Mode: Discovery - Show everyone's public posts
        if (userId) {
            // Logged-in user: show public posts + people I follow (including private ones if followed)
            const following = await Follow.find({ follower: userId, status: 'ACCEPTED' }).select('following');
            const followingIds = following.map(f => f.following);
            followingIds.push(userId); 

            // EXCLUDE private users UNLESS I follow them
            const privateUsers = await User.find({ isPrivate: true, _id: { $nin: followingIds } }).select('_id');
            filter.author = { $nin: privateUsers.map(u => u._id) };
        } else {
            // Not logged-in: Only show strictly public accounts
            const privateUsers = await User.find({ isPrivate: true }).select('_id');
            filter.author = { $nin: privateUsers.map(u => u._id) };
        }
    }

    const threads = await Thread.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', '_id firstName lastName avatar avatarType')
      .populate({
        path: 'repostOf',
        populate: { path: 'author', select: '_id firstName lastName avatar avatarType' }
      })
      .lean();

    const formattedThreads = (await Promise.all(
      threads.map(thread => formatThreadResponse(thread, userId))
    )).filter(thread => thread !== null); 

    const totalThreads = await Thread.countDocuments(filter);
    const totalPages = Math.ceil(totalThreads / limit);

    return responseHandler.success(res, {
        threads: formattedThreads,
        pagination: { totalThreads, totalPages, currentPage: page, pageSize: limit }
    }, "Feed fetched successfully", statusCodes.SUCCESS);

  } catch (error) {
    return responseHandler.error(res, null, statusCodes.INTERNAL_SERVER_ERROR);
  }
};

const repostThread = async (req, res) => {
    try {
        const userId = req.user.id;
        const { threadId } = req.params;

        const originalThread = await Thread.findById(threadId);
        if(!originalThread) return responseHandler.notFound(res, "Thread");

        const existingRepost = await Thread.findOne({ author: userId, repostOf: threadId });
        if(existingRepost) return responseHandler.error(res, "Already reposted", statusCodes.CONFLICT);

        const repost = await Thread.create({
            content: "Repost", // Placeholder or fetch
            author: userId,
            repostOf: threadId,
            media: null
        });

        // Notification
        // Notification: Consolidate repost notification
        if (originalThread.author.toString() !== userId) {
            const existingNotif = await Notification.findOne({
                type: 'NEW_THREAD', // Using NEW_THREAD as defined in current implementation
                receiver: originalThread.author,
                sender: userId,
                thread: repost._id
            });

            let notif;
            if (existingNotif) {
                existingNotif.isRead = false;
                existingNotif.updatedAt = new Date();
                notif = await existingNotif.save();
            } else {
                notif = await Notification.create({
                    type: 'NEW_THREAD',
                    receiver: originalThread.author,
                    sender: userId,
                    thread: repost._id,
                    isRead: false
                });
            }
            const populatedNotif = await populateNotification(notif._id);
            emitToUser(originalThread.author, 'notification:new', populatedNotif || notif);
        }

        const populatedRepost = await Thread.findById(repost._id)
          .populate('author', '_id firstName lastName avatar avatarType')
          .populate({
            path: 'repostOf',
            populate: { path: 'author', select: '_id firstName lastName avatar avatarType' }
          })
          .lean();

        const formattedRepost = await formatThreadResponse(populatedRepost, userId);

        return responseHandler.success(res, formattedRepost, "Reposted successfully", statusCodes.CREATED);
    } catch (error) {
        console.error("Repost error:", error);
        return responseHandler.error(res, null, statusCodes.INTERNAL_SERVER_ERROR);
    }
}

const unrepostThread = async (req, res) => {
    try {
        const userId = req.user.id;
        const { threadId } = req.params;

        // Find the repost document where author is me and repostOf is the target thread
        const repost = await Thread.findOneAndDelete({ author: userId, repostOf: threadId });
        
        if(!repost) return responseHandler.notFound(res, "Repost");

        // Clean up notification
        await Notification.deleteMany({
            sender: userId,
            thread: repost._id, // The repost itself
            type: 'NEW_THREAD'
        });

        // Also if the notification was linked to the original thread (some implementations might do that)
        await Notification.deleteMany({
            sender: userId,
            receiver: { $ne: userId },
            type: 'NEW_THREAD',
            $or: [{ thread: threadId }]
        });

        return responseHandler.success(res, null, "Unreposted successfully", statusCodes.SUCCESS);
    } catch (error) {
         console.error("Unrepost error:", error);
        return responseHandler.error(res, null, statusCodes.INTERNAL_SERVER_ERROR);
    }
}


const bookmarkThread = async (req, res) => {
  try {
    const { threadId } = req.params;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) return responseHandler.notFound(res, "User");

    const thread = await Thread.findById(threadId);
    if (!thread) return responseHandler.notFound(res, "Thread");

    const bookmarkIndex = user.bookmarks.indexOf(threadId);
    let isBookmarked = false;

    if (bookmarkIndex > -1) {
      // Unbookmark
      user.bookmarks.splice(bookmarkIndex, 1);
      isBookmarked = false;
    } else {
      // Bookmark
      user.bookmarks.push(threadId);
      isBookmarked = true;
    }

    await user.save();

    return responseHandler.success(res, { isBookmarked }, isBookmarked ? "Thread bookmarked" : "Thread unbookmarked", statusCodes.SUCCESS);
  } catch (error) {
    console.error("Bookmark error:", error);
    return responseHandler.error(res, null, statusCodes.INTERNAL_SERVER_ERROR);
  }
};

const getBookmarkedThreads = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page, limit } = req.pagination;
    const skip = (page - 1) * limit;

    const user = await User.findById(userId);
    
    // Total count of bookmarks
    const totalThreads = user.bookmarks.length;
    const totalPages = Math.ceil(totalThreads / limit);

    // Get recently bookmarked first
    const reversedBookmarks = [...user.bookmarks].reverse();
    const pagedBookmarkIds = reversedBookmarks.slice(skip, skip + limit);

    const threads = await Thread.find({ _id: { $in: pagedBookmarkIds } })
      .populate('author', '_id firstName lastName avatar avatarType')
      .populate({
        path: 'repostOf',
        populate: { path: 'author', select: '_id firstName lastName avatar avatarType' }
      })
      .lean();

    // Preserve order of pagedBookmarkIds
    const orderedThreads = pagedBookmarkIds.map(id => threads.find(t => t._id.toString() === id.toString())).filter(Boolean);

    // Add like/bookmark status
    const threadsWithStatus = (await Promise.all(
        orderedThreads.map(thread => formatThreadResponse(thread, userId))
    )).filter(thread => thread !== null);

    return responseHandler.success(res, {
        threads: threadsWithStatus,
        pagination: {
            totalThreads,
            totalPages,
            currentPage: page,
            pageSize: limit
        }
    }, "Bookmarked threads fetched", statusCodes.SUCCESS);

  } catch (error) {
    console.error("Get bookmarks error:", error);
    return responseHandler.error(res, null, statusCodes.INTERNAL_SERVER_ERROR);
  }
};

/**
 * GET RECOMMENDED FEED
 * Shows posts with hashtags matching the user's interests
 */
const getRecommendedFeed = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page, limit } = req.pagination;
    const skip = (page - 1) * limit;

    // Get user's interests or use filter query
    const { tags } = req.query;
    let interestTags = [];

    if (tags) {
       // If specific tags are requested, prioritize them
       interestTags = tags.split(',').map(tag => tag.trim());
    } else {
       // Otherwise fall back to user's saved interests
       const user = await User.findById(userId).select('interests');
       if (user && user.interests && user.interests.length > 0) {
           interestTags = user.interests;
       }
    }

    if (interestTags.length === 0) {
      return responseHandler.success(res, {
        threads: [],
        pagination: { totalThreads: 0, totalPages: 0, currentPage: page, pageSize: limit },
        message: 'No interests selected. Please select interests to see recommended posts.'
      }, "No interests found", statusCodes.SUCCESS);
    }

    // Filter: posts with hashtags matching user's interests or selected tags
    const filter = {
      isArchived: false,
      parentThread: null,
      hashtags: { $in: interestTags } 
    };

    // Exclude private users unless following
    const following = await Follow.find({ follower: userId, status: 'ACCEPTED' }).select('following');
    const followingIds = following.map(f => f.following);
    followingIds.push(userId);

    const privateUsers = await User.find({ isPrivate: true, _id: { $nin: followingIds } }).select('_id');
    filter.author = { $nin: privateUsers.map(u => u._id) };

    const threads = await Thread.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', '_id firstName lastName avatar avatarType')
      .populate({
        path: 'repostOf',
        populate: { path: 'author', select: '_id firstName lastName avatar avatarType' }
      })
      .lean();

    const formattedThreads = (await Promise.all(
      threads.map(thread => formatThreadResponse(thread, userId))
    )).filter(thread => thread !== null);

    const totalThreads = await Thread.countDocuments(filter);
    const totalPages = Math.ceil(totalThreads / limit);

    return responseHandler.success(res, {
      threads: formattedThreads,
      pagination: { totalThreads, totalPages, currentPage: page, pageSize: limit }
    }, "Recommended feed fetched successfully", statusCodes.SUCCESS);

  } catch (error) {
    return responseHandler.error(res, null, statusCodes.INTERNAL_SERVER_ERROR);
  }
};

/**
 * GET TRENDING HASHTAGS
 * Aggregates top hashtags from recent posts
 */
const getTrending = async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const trends = await Thread.aggregate([
      {
        $match: {
          isArchived: false,
          createdAt: { $gte: sevenDaysAgo },
          hashtags: { $exists: true, $not: { $size: 0 } }
        }
      },
      { $unwind: "$hashtags" },
      {
        $group: {
          _id: "$hashtags",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const formattedTrends = trends.map(t => ({
      id: t._id,
      topic: t._id.startsWith('#') ? t._id : `#${t._id}`,
      posts: `${t.count} posts`
    }));

    return responseHandler.success(res, formattedTrends, "Trending hashtags fetched successfully", statusCodes.SUCCESS);
  } catch (error) {
    console.error("Get trending error:", error);
    return responseHandler.error(res, null, statusCodes.INTERNAL_SERVER_ERROR);
  }
};

module.exports = {
  createThread,
  getUserThreads,
  getArchivedThreads,
  getThreadById,
  updateThread,
  archiveThread,
  unarchiveThread,
  deleteThread,
  getFeed,
  getRecommendedFeed,
  getTrending,
  repostThread,
  unrepostThread,
  bookmarkThread,
  getBookmarkedThreads
};
