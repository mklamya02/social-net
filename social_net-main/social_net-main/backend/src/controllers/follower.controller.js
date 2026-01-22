/**
 * follower.controller.js - The Relationship Manager
 * 
 * This controller manages the complex logic of following users,
 * especially handling "Private" accounts that require manual approval.
 * It orchestrates interactions between Follow, User, and Notification models,
 * and integrates with real-time updates via WebSockets.
 */

const Follow = require('../models/follower.model');
const User = require('../models/user.model');
const Notification = require('../models/notification.model');
const responseHandler = require('../utils/responseHandler');
const { statusCodes } = require('../utils/statusCodes');
const { emitToUser, broadcast } = require('../socket');
const { populateNotification } = require('../utils/notificationHelper');
const { refreshPresignedUrl } = require('../utils/minioHelper');

/**
 * HELPER: Sync Stats via WebSockets
 * Updates follower/following counts for profiles in real-time across connected clients.
 * @param {string} userId - The ID of the user whose stats need to be broadcasted.
 */
const broadcastUserStats = async (userId) => {
    try {
        const user = await User.findById(userId).select('followersCount followingCount');
        if (user) {
            broadcast('user_updated', {
                userId: user._id.toString(),
                updates: { followersCount: user.followersCount, followingCount: user.followingCount }
            });
        }
    } catch (error) { console.error(error); }
};

/**
 * GET FOLLOWERS
 */
const getFollowers = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user?.id;

    const followers = await Follow.find({
      following: userId,
      status: 'ACCEPTED'
    })
    .populate('follower', '_id firstName lastName avatar avatarType bio')
    .sort({ createdAt: -1 })
    .lean();

    // Check if current user is following these followers
    let followingSet = new Set();
    if (currentUserId) {
        const following = await Follow.find({
            follower: currentUserId,
            status: 'ACCEPTED'
        }).select('following');
        followingSet = new Set(following.map(f => f.following.toString()));
    }

    const formattedFollowers = await Promise.all(followers.map(async f => {
        const user = f.follower;
        if (user && user.avatar && Buffer.isBuffer(user.avatar)) {
            user.avatar = `data:${user.avatarType};base64,${user.avatar.toString('base64')}`;
        } else if (user?.avatar?.key) {
            user.avatar.url = await refreshPresignedUrl(user.avatar.key);
        }
        return {
            ...user,
            isFollowing: followingSet.has(user._id.toString())
        };
    }));

    return responseHandler.success(res, formattedFollowers, "Followers fetched successfully", statusCodes.SUCCESS);
  } catch (error) {
    console.error("Get followers error:", error);
    return responseHandler.error(res, null, statusCodes.INTERNAL_SERVER_ERROR);
  }
};

/**
 * GET FOLLOWING
 */
const getFollowing = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user?.id;

    const followingList = await Follow.find({
      follower: userId,
      status: 'ACCEPTED'
    })
    .populate('following', '_id firstName lastName avatar avatarType bio')
    .sort({ createdAt: -1 })
    .lean();

    // Check if current user is following these users
    let followingSet = new Set();
    if (currentUserId) {
        const following = await Follow.find({
            follower: currentUserId,
            status: 'ACCEPTED'
        }).select('following');
        followingSet = new Set(following.map(f => f.following.toString()));
    }

    const formattedFollowing = await Promise.all(followingList.map(async f => {
        const user = f.following;
        if (user && user.avatar && Buffer.isBuffer(user.avatar)) {
            user.avatar = `data:${user.avatarType};base64,${user.avatar.toString('base64')}`;
        } else if (user?.avatar?.key) {
            user.avatar.url = await refreshPresignedUrl(user.avatar.key);
        }
        return {
            ...user,
            isFollowing: followingSet.has(user._id.toString())
        };
    }));

    return responseHandler.success(res, formattedFollowing, "Following fetched successfully", statusCodes.SUCCESS);
  } catch (error) {
    console.error("Get following error:", error);
    return responseHandler.error(res, null, statusCodes.INTERNAL_SERVER_ERROR);
  }
};

/**
 * SEND FOLLOW REQUEST
 * Handles both instant follows (public) and approval requests (private).
 */
const sendFollowRequest = async (req, res) => {
  try {
    const followerId = req.user.id;
    const { followingId } = req.body;

    if (followerId === followingId) return responseHandler.error(res, "Cannot follow self", statusCodes.BAD_REQUEST);

    const followingUser = await User.findById(followingId);
    if (!followingUser) return responseHandler.notFound(res, "User to follow");

    // Check if a relationship already exists (no double follows)
    const existingFollow = await Follow.findOne({ follower: followerId, following: followingId });
    if (existingFollow) return responseHandler.error(res, `Already ${existingFollow.status.toLowerCase()}`, statusCodes.CONFLICT);

    // LOGIC: If target is private, status is PENDING. Otherwise, ACCEPTED.
    const status = followingUser.isPrivate ? "PENDING" : "ACCEPTED";

    const followRequest = await Follow.create({ follower: followerId, following: followingId, status });

    /**
     * ATOMIC UPDATES
     * If accepted instantly, increment counts for both users.
     */
    if (status === "ACCEPTED") {
      await User.findByIdAndUpdate(followerId, { $inc: { followingCount: 1 } });
      await User.findByIdAndUpdate(followingId, { $inc: { followersCount: 1 } });
      broadcastUserStats(followerId);
      broadcastUserStats(followingId);
    }

    // NOTIFICATION
    const notification = await Notification.create({
        type: status === "PENDING" ? "FOLLOW_REQUEST" : "NEW_FOLLOWER",
        receiver: followingId,
        sender: followerId,
        isRead: false
    });

    const populatedNotif = await populateNotification(notification._id);
    emitToUser(followingId, "notification:new", populatedNotif || notification);

    return responseHandler.success(res, followRequest, "Followed successfully", statusCodes.CREATED);

  } catch (error) {
    return responseHandler.error(res, null, statusCodes.INTERNAL_SERVER_ERROR);
  }
};

/**
 * ACCEPT FOLLOW REQUEST
 */
const acceptFollowRequest = async (req, res) => {
  try {
    const followingId = req.user.id;
    const { followerId } = req.body;

    if (!followerId) {
      return responseHandler.error(
        res,
        "Follower ID is required",
        statusCodes.BAD_REQUEST
      );
    }

    // Use findOneAndUpdate for atomicity - prevents race condition if accept is clicked twice
    const followRequest = await Follow.findOneAndUpdate(
      {
        follower: followerId,
        following: followingId,
        status: "PENDING"
      },
      { status: "ACCEPTED" },
      { new: true }
    );

    if (!followRequest) {
      return responseHandler.notFound(res, "Follow request");
    }

    // Atomic increment counts
    await User.findByIdAndUpdate(followerId, { $inc: { followingCount: 1 } });
    await User.findByIdAndUpdate(followingId, { $inc: { followersCount: 1 } });

    // Real-time updates
    broadcastUserStats(followerId);
    broadcastUserStats(followingId);

    // Remove any previous follow requests/notifications before creating acceptance notif
    await Notification.deleteMany({
      sender: followerId,
      receiver: followingId,
      type: { $in: ["FOLLOW_REQUEST", "NEW_FOLLOWER"] }
    });

    const notification = await Notification.create({
      type: "FOLLOW_ACCEPTED",
      receiver: followerId,
      sender: followingId,
      thread: null,
      isRead: false
    });

    const populatedNotif = await populateNotification(notification._id);
    emitToUser(followerId, "notification:new", populatedNotif || notification);

    return responseHandler.success(
      res,
      followRequest,
      "Follow request accepted",
      statusCodes.UPDATED
    );

  } catch (error) {
    console.error("Accept follow request error:", error);
    return responseHandler.error(
      res,
      null,
      statusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

const rejectFollowRequest = async (req, res) => {
  try {
    const followingId = req.user.id;
    const { followerId } = req.body;

    const followRequest = await Follow.findOneAndDelete({
      follower: followerId,
      following: followingId,
      status: "PENDING"
    });

    // Delete associated notification
    await Notification.deleteMany({
      sender: followerId,
      receiver: followingId,
      type: { $in: ["FOLLOW_REQUEST", "NEW_FOLLOWER"] }
    });

    return responseHandler.success(
      res,
      null,
      "Follow request rejected",
      statusCodes.SUCCESS
    );
  } catch (error) {
    console.error("Reject follow request error:", error);
    return responseHandler.error(res, null, statusCodes.INTERNAL_SERVER_ERROR);
  }
};

const removeFollower = async (req, res) => {
    try {
        const userId = req.user.id;
        const { followerId } = req.params;

        const result = await Follow.findOneAndDelete({
            follower: followerId,
            following: userId,
            status: 'ACCEPTED'
        });

        if (!result) {
            return responseHandler.error(res, "Follower not found", statusCodes.NOT_FOUND);
        }

        // Atomic decrement
        await User.findByIdAndUpdate(userId, { $inc: { followersCount: -1 } });
        await User.findByIdAndUpdate(followerId, { $inc: { followingCount: -1 } });

        // Real-time updates
        broadcastUserStats(userId);
        broadcastUserStats(followerId);

        return responseHandler.success(res, null, "Follower removed", statusCodes.SUCCESS);
    } catch (error) {
        console.error("Remove follower error:", error);
        return responseHandler.error(res, null, statusCodes.INTERNAL_SERVER_ERROR);
    }
};

const unfollowUser = async (req, res) => {
  try {
    const followerId = req.user.id;
    const { userId } = req.params; // The user to unfollow

    const result = await Follow.findOneAndDelete({
      follower: followerId,
      following: userId
    });

    if (!result) {
      return responseHandler.error(res, "You are not following this user", statusCodes.BAD_REQUEST);
    }

    // Atomic decrement counts ONLY if the follow was accepted
    if (result.status === 'ACCEPTED') {
      await User.findByIdAndUpdate(followerId, { $inc: { followingCount: -1 } });
      await User.findByIdAndUpdate(userId, { $inc: { followersCount: -1 } });

      // Real-time updates
      broadcastUserStats(followerId);
      broadcastUserStats(userId);
    }

    // Clean up all follow-related notifications from this user to that user
    await Notification.deleteMany({
      sender: followerId,
      receiver: userId,
      type: { $in: ["FOLLOW_REQUEST", "NEW_FOLLOWER", "FOLLOW_ACCEPTED"] }
    });

    return responseHandler.success(res, null, "Unfollowed successfully", statusCodes.SUCCESS);
  } catch (error) {
    console.error("Unfollow error:", error);
    return responseHandler.error(res, null, statusCodes.INTERNAL_SERVER_ERROR);
  }
};

module.exports = {
  sendFollowRequest,
  acceptFollowRequest,
  rejectFollowRequest,
  unfollowUser,
  removeFollower,
  getFollowers,
  getFollowing
};
