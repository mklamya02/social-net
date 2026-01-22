/**
 * like.route.js - Engagement Routes
 */

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const { likeThread , unlikeThread , getUserLikedThreads } = require('../controllers/like.controller');
const pagination = require('../middlewares/pagination');

// LIKE (POST)
// Both use the same ID parameter, handling either Threads or Comments automatically
router.post('/:threadId/like', authMiddleware, likeThread);

// UNLIKE (DELETE)
router.delete('/:threadId/unlike', authMiddleware, unlikeThread);

// FETCH LIKES
// Shows the current user's liked posts on their profile
router.get('/likedthread', pagination, authMiddleware, getUserLikedThreads);

module.exports = router;
