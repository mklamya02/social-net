const Comment = require("../models/comment.model");
const Thread = require("../models/thread.model");
const Like = require("../models/like.model");
const Notification = require('../models/notification.model');
const { emitToUser, broadcast } = require('../socket');
const { populateNotification } = require('../utils/notificationHelper');
const responseHandler = require("../utils/responseHandler");
const { statusCodes } = require("../utils/statusCodes");
const { refreshPresignedUrl } = require('../utils/minioHelper');

const getComments = async (req, res) => {
  try {
    const { threadId } = req.params;
    const { page, limit } = req.pagination;
    const { cursor } = req.query;

    let query = { thread: threadId };
    if(req.user) console.log("getComments: User authenticated", req.user.id); // DEBUG LOG
    else console.log("getComments: User is GUEST"); // DEBUG LOG

    if (cursor) {
       query.createdAt = { $gt: new Date(cursor) };
    }

    let queryBuilder = Comment.find(query)
      .sort({ createdAt: 1 })
      .populate('author', '_id firstName lastName avatar avatarType')
      .lean();

    if (!cursor && page > 1) {
        const skip = (page - 1) * limit;
        queryBuilder = queryBuilder.skip(skip);
    }
    
    queryBuilder = queryBuilder.limit(limit);

    const comments = await queryBuilder;

    const commentsWithLikes = await Promise.all(
        comments.map(async (comment) => {
             const likeCount = await Like.countDocuments({ comment: comment._id });
             let isLiked = false;
             if(req.user) {
                 // DEBUG: Deep inspection
                 console.log(`[DEBUG] CheckLike: User=${req.user.id}, Comment=${comment._id}`);
                 const likeDoc = await Like.findOne({ user: req.user.id, comment: comment._id });
                 isLiked = !!likeDoc;
                 console.log(`[DEBUG] Found? ${isLiked}`);
             }
             if (comment.author && comment.author.avatar && Buffer.isBuffer(comment.author.avatar)) {
                 comment.author.avatar = `data:${comment.author.avatarType};base64,${comment.author.avatar.toString('base64')}`;
             } else if (comment.author?.avatar?.key) {
                 comment.author.avatar.url = await refreshPresignedUrl(comment.author.avatar.key);
             }
             return { ...comment, likeCount, isLiked };
        })
    );

    const nextCursor = commentsWithLikes.length > 0 ? commentsWithLikes[commentsWithLikes.length - 1].createdAt : null;
    const hasMore = commentsWithLikes.length === limit;

    const totalComments = await Comment.countDocuments({ thread: threadId });
    const totalPages = Math.ceil(totalComments / limit);

    return responseHandler.success(res, {
        comments: commentsWithLikes,
        pagination: {
          totalComments,
          totalPages,
          currentPage: page,
          pageSize: limit,
          nextCursor,
          hasMore
        }
    }, "Comments fetched", statusCodes.SUCCESS);

  } catch (error) {
    console.error("Get comments error:", error);
    return responseHandler.error(res, null, statusCodes.INTERNAL_SERVER_ERROR);
  }
};

const createComment = async (req, res) => {
  try {
    const { threadId } = req.params;
    const { content, parentCommentId } = req.body;
    const userId = req.user.id;

    const parentThread = await Thread.findById(threadId);
    if (!parentThread) return responseHandler.notFound(res, "Thread");

    const comment = await Comment.create({
      content,
      author: userId,
      thread: threadId,
      parentComment: parentCommentId || null,
      media: null
    });

    const populatedComment = await Comment.findById(comment._id)
      .populate('author', '_id firstName lastName avatar avatarType')
      .lean();

    if (populatedComment.author && populatedComment.author.avatar && Buffer.isBuffer(populatedComment.author.avatar)) {
        populatedComment.author.avatar = `data:${populatedComment.author.avatarType};base64,${populatedComment.author.avatar.toString('base64')}`;
    } else if (populatedComment.author?.avatar?.key) {
        populatedComment.author.avatar.url = await refreshPresignedUrl(populatedComment.author.avatar.key);
    }

    // Notification
    if (parentThread.author.toString() !== userId) {
        const notif = await Notification.create({
            type: 'COMMENT',
            receiver: parentThread.author,
            sender: userId,
            thread: threadId,
            comment: comment._id,
            isRead: false
        });
        const populatedNotif = await populateNotification(notif._id);
        emitToUser(parentThread.author, 'notification:new', populatedNotif || notif);
    }

    // Real-time updates
    const commentCount = await Comment.countDocuments({ thread: threadId });
    broadcast('post_updated', { postId: threadId, commentCount });
    broadcast('comment_new', { threadId: threadId, comment: populatedComment });

    return responseHandler.success(res, populatedComment, "Comment added", statusCodes.CREATED);
  } catch (error) {
    console.error("Create comment error:", error);
    return responseHandler.error(res, null, statusCodes.INTERNAL_SERVER_ERROR);
  }
};

const updateComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const { content } = req.body;
        const userId = req.user.id;

        const comment = await Comment.findById(commentId);
        if (!comment) return responseHandler.notFound(res, "Comment");

        if (comment.author.toString() !== userId) {
            return responseHandler.forbidden(res, "You can only edit your own comments");
        }

        comment.content = content;
        await comment.save();

        const populatedComment = await Comment.findById(comment._id)
          .populate('author', '_id firstName lastName avatar avatarType')
          .lean();

        if (populatedComment.author && populatedComment.author.avatar && Buffer.isBuffer(populatedComment.author.avatar)) {
            populatedComment.author.avatar = `data:${populatedComment.author.avatarType};base64,${populatedComment.author.avatar.toString('base64')}`;
        } else if (populatedComment.author?.avatar?.key) {
             populatedComment.author.avatar.url = await refreshPresignedUrl(populatedComment.author.avatar.key);
        }

        return responseHandler.success(res, populatedComment, "Comment updated", statusCodes.SUCCESS);
    } catch (error) {
        console.error("Update comment error:", error);
        return responseHandler.error(res, null, statusCodes.INTERNAL_SERVER_ERROR);
    }
};

const deleteComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const userId = req.user.id;

        const comment = await Comment.findById(commentId);
        if (!comment) return responseHandler.notFound(res, "Comment");

        if (comment.author.toString() !== userId) {
             return responseHandler.forbidden(res, "You can only delete your own comments");
        }
        
        // Delete this comment and any direct replies (simple cascade)
        await Comment.deleteMany({ parentComment: commentId });
        await Comment.deleteOne({ _id: commentId });
        await Like.deleteMany({ comment: commentId });

        // Update post stats
        const commentCount = await Comment.countDocuments({ thread: comment.thread });
        broadcast('post_updated', { postId: comment.thread, commentCount });

        return responseHandler.success(res, { commentId }, "Comment deleted", statusCodes.SUCCESS);
    } catch (error) {
        console.error("Delete comment error:", error);
        return responseHandler.error(res, null, statusCodes.INTERNAL_SERVER_ERROR);
    }
};

module.exports = {
  getComments,
  createComment,
  updateComment,
  deleteComment
};
