/**
 * threadFormatter.js - The Post Decorator
 * 
 * This is the MOST IMPORTANT helper in the backend. 
 * When a user asks for their Feed, we don't just send the raw database text.
 * We add "Decorations": 
 * - Did YOU like this post?
 * - Did YOU bookmark it?
 * - Do YOU follow the author?
 * - How many likes does it have?
 * 
 * It turns a simple "Text" into an interactive Social Media post.
 */

const Like = require("../models/like.model");
const Follow = require("../models/follower.model");
const Comment = require("../models/comment.model");
const Thread = require("../models/thread.model");

/**
 * The 'Magical' function that formats a single post.
 */
const formatThreadResponse = async (thread, userId) => {
    // 1. Safety Check: If the author no longer exists, hide the post.
    if (!thread.author) return null;

    // 2. Format Author's Profile Picture (Refresh expiring URLs)
    if (thread.author) {
        // Manual handle calculation for lean objects
        if (!thread.author.handle) {
            const base = `${thread.author.firstName || ''}${thread.author.lastName || ''}`.toLowerCase().replace(/[^a-z0-9]/g, '');
            const suffix = thread.author._id ? thread.author._id.toString().slice(-4) : '';
            thread.author.handle = `@${base}${suffix}`;
        }

        if (thread.author.avatar?.key) {
            const { refreshPresignedUrl } = require('./minioHelper');
            thread.author.avatar.url = await refreshPresignedUrl(thread.author.avatar.key);
        }
    }

    // 3. Format Post Media (Refresh expiring video/image links)
    if (thread.media?.key) {
        const { refreshPresignedUrl } = require('./minioHelper');
        thread.media.url = await refreshPresignedUrl(thread.media.key);
    }

    // 4. Calculate Stats (Live counts from the Database)
    const likeCount = await Like.countDocuments({ thread: thread._id });
    const repostCount = await Thread.countDocuments({ repostOf: thread._id });
    const commentCount = await Comment.countDocuments({ thread: thread._id });
    
    // 5. Check Personal Interactions (If the viewer is logged in)
    let isLiked = false;
    let isBookmarked = false;
    let isOwner = false;
    let isFollowingAuthor = false;

    if (userId) {
        const User = require("../models/user.model");
        const user = await User.findById(userId).select('bookmarks');
        
        isLiked = !!await Like.findOne({ user: userId, thread: thread._id });
        isBookmarked = user?.bookmarks?.some(b => b.toString() === thread._id.toString());
        isOwner = thread.author._id.toString() === userId.toString();
        
        if (!isOwner) {
            const follow = await Follow.findOne({ follower: userId, following: thread.author._id });
            isFollowingAuthor = follow?.status === 'ACCEPTED';
        }
    }

    // 6. Return the "Decorated" post object
    return { 
        ...thread, 
        likeCount, repostCount, commentCount, 
        isLiked, isBookmarked,
        permissions: {
            isOwner,
            isFollowing: isFollowingAuthor,
            canDelete: isOwner,
            canRepost: !isOwner // Usually you don't repost your own stuff
        }
    };
};

module.exports = { formatThreadResponse };
