/**
 * like.controller.js - Engagement Logic
 */

const Like = require('../models/like.model');
const Thread = require('../models/thread.model');
const Comment = require('../models/comment.model');
const responseHandler = require('../utils/responseHandler');
const { statusCodes } = require('../utils/statusCodes');
const Notification = require('../models/notification.model');
const { emitToUser, broadcast } = require('../socket');
const { populateNotification } = require('../utils/notificationHelper');


/**
 * HELPER: Update Like Count in Real-time
 * Uses WebSockets to tell the frontend exactly how many likes a post has
 * without the user having to refresh the page.
 */
const updateLikeCount = async (targetId, type) => {
    try {
        const count = await Like.countDocuments({ [type]: targetId });
        // 'broadcast' sends the message to EVERY connected user
        if (type === 'thread') {
            broadcast('post_updated', { postId: targetId, likeCount: count });
        } else {
            broadcast('comment_updated', { commentId: targetId, likeCount: count });
        }
    } catch (error) { console.error(error); }
};

/**
 * LIKE A THREAD OR COMMENT
 */
const likeThread = async (req, res) => {
  try {
    const userId = req.user.id; 
    const { threadId } = req.params; // This parameter acts as the ID for the target

    // 1. Identify what we are liking (A main Post or a Comment?)
    let targetType = 'thread';
    let target = await Thread.findOne({ _id: threadId, isArchived: false });
    
    if (!target) {
        target = await Comment.findById(threadId);
        if (target) {
            targetType = 'comment';
        } else {
            return responseHandler.notFound(res, "Thread or Comment");
        }
    }

    // 2. Prevent double-liking
    const likeQuery = { user: userId };
    if (targetType === 'thread') likeQuery.thread = threadId;
    else likeQuery.comment = threadId;

    const existingLike = await Like.findOne(likeQuery);
    if (existingLike) {
         console.log("CONFLICT LIKE FOUND:", existingLike);
         console.log("QUERY WAS:", likeQuery);
         return responseHandler.error(res, "You have already liked this", statusCodes.CONFLICT);
    }

    // 3. Create the Like document
    const like = new Like({
      user: userId,
      thread: targetType === 'thread' ? threadId : null,
      comment: targetType === 'comment' ? threadId : null
    });
    await like.save();

    // 4. NOTIFICATION: Alert the author
    if (target.author.toString() !== userId) {
        const notifQuery = {
          type: 'LIKE',
          receiver: target.author,
          sender: userId
        };
        if (targetType === 'thread') notifQuery.thread = threadId;
        else notifQuery.comment = threadId;

        // Either update an existing notification (if they unliked/reliked) or create new
        const existingNotif = await Notification.findOne(notifQuery);
        let notif;
        if (existingNotif) {
          existingNotif.isRead = false;
          existingNotif.updatedAt = new Date();
          notif = await existingNotif.save();
        } else {
          const notifData = { ...notifQuery, isRead: false };
          if (targetType === 'comment') notifData.thread = target.thread; 
          notif = await Notification.create(notifData);
        }

        const populatedNotif = await populateNotification(notif._id);
        emitToUser(target.author, 'notification:new', populatedNotif || notif);
    }

    // 5. Trigger real-time refresh (Fire and Forget)
    updateLikeCount(threadId, targetType);

    return responseHandler.success(res, like, "Liked successfully", statusCodes.CREATED);

  } catch (error) {
    if (error.code === 11000) return responseHandler.error(res, "Already liked", statusCodes.CONFLICT);
    return responseHandler.error(res, null, statusCodes.INTERNAL_SERVER_ERROR);
  }
};

/**
 * UNLIKE A THREAD OR COMMENT
 */
const unlikeThread = async (req, res) => {
  try {
    const userId = req.user.id;
    const { threadId } = req.params;

    // Delete the Like record
    const like = await Like.findOneAndDelete({
        user: userId,
        $or: [{ thread: threadId }, { comment: threadId }]
    });

    if (!like) {
      return responseHandler.notFound(res, "Like");
    }

    // Clean up notifications: remove the "User liked your post" alert
    await Notification.deleteMany({
      sender: userId,
      $or: [{ thread: threadId }, { comment: threadId }],
      type: 'LIKE'
    });

    // Real-time update: decrease the count instantly in the UI
    if (like.thread) updateLikeCount(like.thread, 'thread');
    else if (like.comment) updateLikeCount(like.comment, 'comment');

    return responseHandler.success(res, null, "Like removed successfully", statusCodes.DELETED);

  } catch (error) {
    return responseHandler.error(res, null, statusCodes.INTERNAL_SERVER_ERROR);
  }
};

/**
 * FETCH MY LIKED POSTS
 * Used for the "Likes" tab on the user's profile.
 */
const getUserLikedThreads = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page, limit } = req.pagination;
    const skip = (page - 1) * limit;

    // Find all 'Like' records by this user that point to a Thread
    const likes = await Like.find({ user: userId, thread: { $ne: null } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'thread',
        match: { isArchived: false }, 
        populate: { path: 'author', select: 'firstName lastName avatar avatarType' } 
      })
      .lean();

    // Map the likes back into a list of Thread objects
    const likedThreads = likes
      .filter(like => like.thread !== null)
      .map(like => ({
        ...like.thread,
        likedAt: like.createdAt 
      }));

    const totalLikes = await Like.countDocuments({ user: userId, thread: { $ne: null } });
    const totalPages = Math.ceil(totalLikes / limit);

    return responseHandler.success(res, {
        threads: likedThreads,
        pagination: { totalLikes, totalPages, currentPage: page, pageSize: limit }
    }, "Threads liked by you fetched successfully", statusCodes.SUCCESS);

  } catch (error) {
    return responseHandler.error(res, null, statusCodes.INTERNAL_SERVER_ERROR);
  }
};

module.exports = { unlikeThread, likeThread, getUserLikedThreads };
