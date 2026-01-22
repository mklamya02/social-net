/**
 * notificationHelper.js - The Alert Polisher
 * 
 * When someone likes your post, we need to show YOU their name,
 * their photo, and maybe the content they liked. 
 * This helper "populates" those details so the frontend has everything it needs.
 */

const Notification = require('../models/notification.model');
const Follow = require('../models/follower.model');

/**
 * Deep-fetches names, photos, and follows for an alert.
 */
const populateNotification = async (notificationId) => {
  try {
    // 1. Fetch the basic alert and grab 'sender' details (name/avatar)
    const notification = await Notification.findById(notificationId)
      .populate('sender', '_id firstName lastName avatar avatarType')
      .populate('thread', 'content')
      .lean();

    if (!notification) return null;

    // 2. Add "Social Context": Do you already follow the person who liked your post?
    const followBack = await Follow.findOne({
      follower: notification.receiver,
      following: notification.sender?._id
    });
    
    notification.isFollowingSender = followBack?.status === 'ACCEPTED';

    // 3. Format their profile picture (MinIO or Base64)
    if (notification.sender?.avatar?.key) {
        const { refreshPresignedUrl } = require('./minioHelper');
        notification.sender.avatar.url = await refreshPresignedUrl(notification.sender.avatar.key);
    }

    return notification;
  } catch (error) {
    return null;
  }
};

module.exports = { populateNotification };
