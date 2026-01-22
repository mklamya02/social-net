const User = require('../models/user.model');
const Thread = require('../models/thread.model');
const responseHandler = require('../utils/responseHandler');
const { statusCodes } = require('../utils/statusCodes');

const search = async (req, res) => {
  try {
    const { q, type } = req.query; // type can be 'top', 'latest', 'people', 'media'
    
    if (!q || q.trim().length === 0) {
      return responseHandler.success(res, { users: [], threads: [] }, 'Empty query');
    }

    // Optional user extraction for personalizing results (likes, follows, etc)
    let userId = null;
    const authHeader = req.headers["authorization"];
    if (authHeader) {
        const token = authHeader.split(" ")[1];
        if (token) {
            try {
                const jwt = require("jsonwebtoken");
                const envVar = require("../config/EnvVariable");
                const payload = jwt.verify(token, envVar.ACCESS_TOKEN_SECRET);
                userId = payload.id;
            } catch (err) {
                // Ignore invalid token, proceed as guest
            }
        }
    }

    const searchQuery = q.trim();
    const regex = new RegExp(searchQuery, 'i');

    let users = [];
    let threads = [];

    // Search Users
    if (!type || type === 'people') {
      // 1. Text Search (for exact word matches)
      const textUsers = await User.find(
        { $text: { $search: searchQuery } },
        { score: { $meta: "textScore" } }
      )
      .sort({ score: { $meta: "textScore" } })
      .limit(10)
      .select('_id firstName lastName avatar avatarType isPrivate')
      .lean();

      // 2. Regex Search (for partial matches like "ab" -> "abdo")
      const regexUsers = await User.find({
        $or: [
          { firstName: { $regex: regex } },
          { lastName: { $regex: regex } },
          { email: { $regex: regex } }
        ],
        _id: { $nin: textUsers.map(u => u._id) }
      })
      .limit(10)
      .select('_id avatar avatarType isPrivate firstName lastName followersCount email')
      .lean();

      let combinedUsers = [...textUsers, ...regexUsers];

      // Map to combine firstName and lastName into a 'name' field if 'name' is not present or empty
      const formattedCombinedUsers = combinedUsers.map(u => {
        const user = { ...u };
        user.name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
        const base = (user.firstName || '' + user.lastName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const suffix = user._id ? user._id.toString().slice(-4) : '';
        user.handle = `@${base}${suffix}`;
        // Remove firstName and lastName if not explicitly requested by frontend
        // though keeping them for now is safer.
        return user;
      });

      users = formattedCombinedUsers.slice(0, 15);
    }

    // Search Threads
    if (!type || type === 'top' || type === 'latest' || type === 'media') {
       threads = await Thread.find(
        { $text: { $search: searchQuery }, isArchived: false },
        { score: { $meta: "textScore" } }
      )
      .sort({ score: { $meta: "textScore" }, createdAt: -1 })
      .limit(20)
      .populate('author', '_id firstName lastName avatar avatarType')
      .lean();
      
      if (threads.length < 5) {
          const regexThreads = await Thread.find({
             content: { $regex: regex },
             isArchived: false,
             _id: { $nin: threads.map(t => t._id) }
          })
          .limit(10)
          .populate('author', '_id firstName lastName avatar avatarType')
          .lean();
          threads = [...threads, ...regexThreads];
      }
    }

    // Format User avatars and add follow status
    const Follow = require('../models/follower.model');
    const formattedUsers = await Promise.all(users.map(async (user) => {
      // follow status check
      user.isFollowing = false;
      user.followStatus = null;
      if (userId) {
          const follow = await Follow.findOne({ follower: userId, following: user._id });
          if (follow) {
              user.isFollowing = follow.status === 'ACCEPTED';
              user.followStatus = follow.status;
          }

          // Check if searched user follows the current user
          const followingMe = await Follow.findOne({ follower: user._id, following: userId, status: 'ACCEPTED' });
          user.followsMe = !!followingMe;
      }

      if (user.avatar) {
        if (typeof user.avatar === 'object' && user.avatar.url) {
          if (user.avatar.key) {
            try {
              const { refreshPresignedUrl } = require('../utils/minioHelper');
              user.avatar = await refreshPresignedUrl(user.avatar.key);
            } catch (err) {
              user.avatar = user.avatar.url;
            }
          } else {
            user.avatar = user.avatar.url;
          }
        } else if (Buffer.isBuffer(user.avatar)) {
          user.avatar = `data:${user.avatarType};base64,${user.avatar.toString('base64')}`;
        } else if (user.avatar.type === 'Buffer') {
          user.avatar = `data:${user.avatarType};base64,${Buffer.from(user.avatar.data).toString('base64')}`;
        }
      }
      return user;
    }));

    // Format threads using the standard formatter
    const { formatThreadResponse } = require('../utils/threadFormatter');
    const formattedThreads = await Promise.all(threads.map(async (thread) => {
      return await formatThreadResponse(thread, userId);
    }));

    return responseHandler.success(
      res,
      { users: formattedUsers, threads: formattedThreads.filter(t => t !== null) },
      'Search results fetched successfully',
      statusCodes.SUCCESS
    );

  } catch (error) {
    return responseHandler.error(res, 'Search failed', statusCodes.INTERNAL_SERVER_ERROR);
  }
};

module.exports = {
  search
};
