/**
 * thread.route.js - The Content Routes
 * 
 * This file handles everything related to Posts (Threads).
 * Creating, Reading, Updating, Deleting, and Interacting.
 */

const express = require("express");
const router = express.Router();
const validate = require('../middlewares/validate');
const threadSchema = require("../validators/threadSchema");
const createThread = require("../controllers/thread.controller"); 
const commentController = require("../controllers/comment.controller");
const authMiddleware = require("../middlewares/auth");
const optionalAuth = require("../middlewares/optionalAuth");
const pagination = require("../middlewares/pagination");
const mediaUpload = require("../middlewares/mediaUpload");

/**
 * CREATE A POST
 * POST /api/thread/
 * Has 'mediaUpload' to handle images/videos before reaching the controller.
 */
router.post(
  "/",
  authMiddleware,         
  mediaUpload.single("media"), 
  validate(threadSchema),
  createThread.createThread
);

// FETCHING POSTS
router.get('/me', authMiddleware, pagination, createThread.getUserThreads);
router.get('/archived', authMiddleware, pagination, createThread.getArchivedThreads);
router.get('/bookmarks', authMiddleware, pagination, createThread.getBookmarkedThreads);
router.get('/recommended', authMiddleware, pagination, createThread.getRecommendedFeed);
router.get('/trending', optionalAuth, createThread.getTrending);
router.get('/me/:threadId', authMiddleware, createThread.getThreadById);

// MODIFYING POSTS
router.patch('/me/:threadId', authMiddleware, mediaUpload.single('media'), createThread.updateThread);
router.delete('/me/:threadId', authMiddleware, createThread.deleteThread);
router.patch('/archive/:threadId', authMiddleware, createThread.archiveThread);
router.patch('/unarchive/:threadId', authMiddleware, createThread.unarchiveThread);

/**
 * REPOSTS
 * Allows users to share other people's posts.
 */
router.post('/:threadId/repost', authMiddleware, createThread.repostThread);
router.delete('/:threadId/repost', authMiddleware, createThread.unrepostThread);

/**
 * COMMENTS
 * Comments on this platform are treated as children of a parent Thread.
 */
router.get('/:threadId/comments', optionalAuth, pagination, commentController.getComments);
router.post('/:threadId/comments', authMiddleware, commentController.createComment);
router.patch('/comments/:commentId', authMiddleware, commentController.updateComment);
router.delete('/comments/:commentId', authMiddleware, commentController.deleteComment);

/**
 * BOOKMARKS
 * Saving posts for later.
 */
router.post('/:threadId/bookmark', authMiddleware, createThread.bookmarkThread);
router.get('/user/bookmarks', authMiddleware, pagination, createThread.getBookmarkedThreads);

/**
 * THE FEED
 * GET /api/thread/
 * This is the "Timeline". It uses 'optionalAuth' because even 
 * logged-out users can see public posts.
 */
router.get('/', optionalAuth, pagination, createThread.getFeed); 
router.get('/public', pagination, createThread.getFeed); 

module.exports = router;
