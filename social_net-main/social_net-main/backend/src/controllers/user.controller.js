/**
 * user.controller.js - The User Registry
 * 
 * Handles Profile lookups, updates, and privacy settings.
 */

const User = require('../models/user.model');
const responseHandler = require('../utils/responseHandler');
const { statusCodes } = require('../utils/statusCodes');
const { hashPassword, comparePassword } = require('../utils/hashPassword'); 
const { uploadBufferToMinIO, generateUniqueFileName, refreshPresignedUrl, deleteFromMinIO } = require('../utils/minioHelper');

/**
 * CREATE USER (Legacy/Admin Utility)
 * Note: Actual registration usually happens in auth.controller.js
 * 
 * This function allows for the creation of a new user, primarily for administrative purposes
 * or legacy systems. It includes validation for existing email/username and handles
 * password hashing and optional avatar uploads.
 * 
 * @param {Object} req - The request object, containing user data in req.body and optional file in req.file.
 * @param {Object} res - The response object.
 * @returns {Promise<void>} - Sends a success or error response.
 */
const createUser = async (req, res) => {
  try {
    const { firstName, lastName, email, password, isPrivate } = req.body;

    // Check if a user with the given email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      return responseHandler.error(res, `Email already exists`, statusCodes.CONFLICT);
    }

    const hashedPassword = await hashPassword(password);

    const userData = {
      firstName,
      lastName,
      email: email.toLowerCase(),
      password: hashedPassword,
      isPrivate: isPrivate || false
    };

    // Handling avatar upload via Buffer
    if (req.file) {
      const fileName = generateUniqueFileName(req.file.originalname);
      const { url, key } = await uploadBufferToMinIO(req.file.buffer, fileName, req.file.mimetype);
      userData.avatar = { url, key };
      userData.avatarType = req.file.mimetype;
    }

    const user = new User(userData);
    await user.save();

    return responseHandler.success(res, user, 'User created successfully', statusCodes.CREATED);

  } catch (error) {
    return responseHandler.error(res, 'Failed to create user', statusCodes.INTERNAL_SERVER_ERROR);
  }
};
/**
 * UPDATE PROFILE
 * Updates Bio, Name, Privacy, Avatar, and Banner.
 */
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) return responseHandler.notFound(res, 'User');

    const { email, password, isPrivate, firstName, lastName, bio, location, website, birthday, showBirthday, avatar, banner } = req.body;

    if (email && email.toLowerCase() !== user.email) {
      if (await User.findOne({ email: email.toLowerCase() })) return responseHandler.error(res, 'Email exists', statusCodes.CONFLICT);
      user.email = email.toLowerCase();
    }

    // 2. Hash New Password if provided
    if (password) user.password = await hashPassword(password);

    // 3. Update Text Metadata
    if (isPrivate !== undefined) user.isPrivate = isPrivate === true || isPrivate === 'true';
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (bio !== undefined) user.bio = bio;
    if (location !== undefined) user.location = location;
    if (website !== undefined) user.website = website;
    if (birthday !== undefined) user.birthday = birthday;
    if (showBirthday !== undefined) user.showBirthday = showBirthday === true || showBirthday === 'true';

    // 4. Handle FILE UPLOADS (Avatar/Banner)
    // Priority: New File > String URL (Delete/Reset) > Keep Existing

    // --- BANNER ---
    if (req.files?.banner) {
      // 1. Upload new file
      const fileName = generateUniqueFileName(req.files.banner[0].originalname);
      const { url, key } = await uploadBufferToMinIO(req.files.banner[0].buffer, fileName, req.files.banner[0].mimetype);
      
      // 2. Delete old file if exists
      if (user.banner?.key) {
        try { await deleteFromMinIO(user.banner.key); } catch (e) { console.error('Failed to delet old banner', e); }
      }

      user.banner = { url, key };
      user.bannerType = req.files.banner[0].mimetype;
    } else if (banner && banner !== user.banner?.url) {
      // Handle Deletion/Reset (Frontend sent a string URL)
      if (user.banner?.key) {
        try { await deleteFromMinIO(user.banner.key); } catch (e) { console.error('Failed to delet old banner', e); }
      }
      user.banner = { url: banner, key: null };
      user.bannerType = null;
    }

    // --- AVATAR ---
    if (req.files?.avatar) {
      // 1. Upload new file
      const fileName = generateUniqueFileName(req.files.avatar[0].originalname);
      const { url, key } = await uploadBufferToMinIO(req.files.avatar[0].buffer, fileName, req.files.avatar[0].mimetype);

      // 2. Delete old file if exists
      if (user.avatar?.key) {
        try { await deleteFromMinIO(user.avatar.key); } catch (e) { console.error('Failed to delet old avatar', e); }
      }

      user.avatar = { url, key };
      user.avatarType = req.files.avatar[0].mimetype;
    } else if (avatar && avatar !== user.avatar?.url) {
      // Handle Deletion/Reset (Frontend sent a string URL)
      if (user.avatar?.key) {
        try { await deleteFromMinIO(user.avatar.key); } catch (e) { console.error('Failed to delet old avatar', e); }
      }
      user.avatar = { url: avatar, key: null };
      user.avatarType = null;
    }

    await user.save();

    // Refresh image URLs before sending response
    if (user.avatar?.key) {
      user.avatar.url = await refreshPresignedUrl(user.avatar.key);
    }
    if (user.banner?.key) {
      user.banner.url = await refreshPresignedUrl(user.banner.key);
    }

    const userResponse = {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      handle: user.handle,
      isPrivate: user.isPrivate,
      avatar: user.avatar?.url || null,
      banner: user.banner?.url || null,
      bio: user.bio,
      location: user.location,
      website: user.website,
      birthday: user.birthday,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    return responseHandler.success(res, userResponse, 'Profile updated successfully', statusCodes.UPDATED);

  } catch (error) {
    return responseHandler.error(res, 'Failed to update profile', statusCodes.INTERNAL_SERVER_ERROR);
  }
};

const saveInterests = async (req, res) => {
  try {
    const userId = req.user.id;
    const { interests } = req.body;

    if (!Array.isArray(interests) || interests.length === 0) {
      return responseHandler.error(res, 'Please select at least one interest', statusCodes.BAD_REQUEST);
    }

    const user = await User.findById(userId);
    if (!user) return responseHandler.notFound(res, 'User');

    // Remove duplicates and save
    user.interests = [...new Set(interests)];
    await user.save();

    // Refresh URLs for response consistency
    if (user.avatar?.key) user.avatar.url = await refreshPresignedUrl(user.avatar.key);
    if (user.banner?.key) user.banner.url = await refreshPresignedUrl(user.banner.key);

    const userResponse = {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      handle: user.handle,
      isPrivate: user.isPrivate,
      avatar: user.avatar?.url || null,
      banner: user.banner?.url || null,
      interests: user.interests,
      bio: user.bio,
      location: user.location,
      website: user.website,
      birthday: user.birthday,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    return responseHandler.success(res, userResponse, 'Interests saved successfully', statusCodes.SUCCESS);
  } catch (error) {
    console.error('Save interests error:', error);
    return responseHandler.error(res, 'Failed to save interests', statusCodes.INTERNAL_SERVER_ERROR);
  }
};

const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return responseHandler.notFound(res, 'User');
    }

    let isFollowing = false;
    let followStatus = null;
    let followsMe = false;

    // Check relationship if user is authenticated
    if (req.user) {
        const Follow = require('../models/follower.model');
        const follow = await Follow.findOne({ follower: req.user.id, following: userId });
        if (follow) {
          isFollowing = follow.status === 'ACCEPTED';
          followStatus = follow.status;
        }

        const followingMe = await Follow.findOne({ follower: userId, following: req.user.id, status: 'ACCEPTED' });
        followsMe = !!followingMe;
    }

    const isAuthorized = req.user && (req.user.id === userId || isFollowing);

    const { refreshPresignedUrl } = require('../utils/minioHelper');
    if (user.avatar?.key) {
        try {
            user.avatar.url = await refreshPresignedUrl(user.avatar.key);
        } catch (e) {
            console.error('Failed to refresh avatar URL:', e);
        }
    }
    if (user.banner?.key) {
        try {
            user.banner.url = await refreshPresignedUrl(user.banner.key);
        } catch (e) {
            console.error('Failed to refresh banner URL:', e);
        }
    }

    const userResponse = {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        handle: user.handle,
        isPrivate: user.isPrivate,
        email: user.email,
        isFollowing,
        followStatus,
        followersCount: user.followersCount,
        followingCount: user.followingCount,
        createdAt: user.createdAt,
        avatar: user.avatar?.url || null,
        banner: user.banner?.url || null,
        bio: user.bio,
        location: user.location,
        website: user.website,
        birthday: (user.showBirthday || (req.user && req.user.id === userId)) ? user.birthday : null,
        showBirthday: user.showBirthday,
        followsMe: followsMe,
    };

    if (user.isPrivate && !isAuthorized) {
        userResponse.isPrivateView = true;
    }

    return responseHandler.success(
      res,
      userResponse,
      'User fetched successfully',
      statusCodes.SUCCESS
    );
  } catch (error) {
    return responseHandler.error(res, null, statusCodes.INTERNAL_SERVER_ERROR);
  }
};
const getUserPosts = async (req, res) => {
  try {
    const userId = req.params.userId;
    const currentUserId = req.user?.id;
    const { page, limit } = req.pagination || { page: 1, limit: 10 };
    const skip = (page - 1) * limit;
    
    // Check privacy
    const targetUser = await User.findById(userId);
    if (!targetUser) return responseHandler.notFound(res, 'User');

    let isFollowing = false;
    if (currentUserId) {
        const Follow = require('../models/follower.model');
        const follow = await Follow.findOne({ follower: currentUserId, following: userId, status: 'ACCEPTED' });
        isFollowing = !!follow;
    }

    const isAuthorized = currentUserId && (currentUserId === userId || isFollowing);

    if (targetUser.isPrivate && !isAuthorized) {
        return responseHandler.success(res, {
            threads: [],
            pagination: { totalThreads: 0, totalPages: 0, currentPage: page, pageSize: limit }
        }, 'Profile is private', statusCodes.SUCCESS);
    }

    const Thread = require('../models/thread.model');
    
    const totalThreads = await Thread.countDocuments({ author: userId, isArchived: false });
    const posts = await Thread.find({ author: userId, isArchived: false })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', '_id firstName lastName avatar avatarType')
      .populate('parentThread', 'content author')
      .populate({
        path: 'repostOf',
        populate: { path: 'author', select: 'firstName lastName avatar avatarType' }
      })
      .lean();

    const { formatThreadResponse } = require('../utils/threadFormatter');
    const formattedPosts = await Promise.all(
        posts.map(post => formatThreadResponse(post, currentUserId))
    );

    const totalPages = Math.ceil(totalThreads / limit);

    return responseHandler.success(
      res,
      {
        threads: formattedPosts,
        pagination: { totalThreads, totalPages, currentPage: page, pageSize: limit }
      },
      'User posts fetched successfully',
      statusCodes.SUCCESS
    );
  } catch (error) {
    console.error('Get user posts error:', error);
    return responseHandler.error(res, 'Failed to fetch user posts', statusCodes.INTERNAL_SERVER_ERROR);
  }
};

const getSuggestions = async (req, res) => {
  try {
    const userId = req.user.id;
    const Follow = require('../models/follower.model');

    // Get list of users already followed (ACCEPTED)
    const following = await Follow.find({ 
        follower: userId,
        status: 'ACCEPTED'
    }).select('following');
    const followingIds = following.map(f => f.following);
    
    // Add current user to exclusion list
    followingIds.push(userId);

    // Find users not followed (ACCEPTED)
    const suggestions = await User.find({ _id: { $nin: followingIds } })
      .select('_id firstName lastName avatar avatarType')
      .limit(5)
      .lean();

    // Map through suggestions and check for PENDING status
    const formattedSuggestions = await Promise.all(suggestions.map(async (user) => {
      const follow = await Follow.findOne({ follower: userId, following: user._id });
      
      const { refreshPresignedUrl } = require('../utils/minioHelper');
      if (user.avatar?.key) {
        try {
            user.avatar.url = await refreshPresignedUrl(user.avatar.key);
        } catch (e) {
            console.error('Failed to refresh suggestion avatar URL:', e);
        }
      }
      // Check if suggested user follows the current user
      const followingMe = await Follow.findOne({ follower: user._id, following: userId, status: 'ACCEPTED' });

      const base = `${user.firstName || ''}${user.lastName || ''}`.toLowerCase().replace(/[^a-z0-9]/g, '');
      const suffix = user._id ? user._id.toString().slice(-4) : '';
      const handle = `@${base}${suffix}`;

      return {
          ...user,
          handle,
          avatar: user.avatar?.url || null,
          followStatus: follow?.status || null,
          followsMe: !!followingMe
      };
    }));

    return responseHandler.success(
      res,
      formattedSuggestions,
      'Suggestions fetched successfully',
      statusCodes.SUCCESS
    );

  } catch (error) {
    console.error('Get suggestions error:', error);
    return responseHandler.error(res, 'Failed to fetch suggestions', statusCodes.INTERNAL_SERVER_ERROR);
  }
};

const updatePrivacy = async (req, res) => {
  try {
    const userId = req.user.id;
    const { isPrivate } = req.body;

    if (typeof isPrivate !== 'boolean') {
      return responseHandler.error(res, 'isPrivate must be a boolean', statusCodes.BAD_REQUEST);
    }

    const user = await User.findByIdAndUpdate(userId, { isPrivate }, { new: true });
    if (!user) return responseHandler.notFound(res, 'User');

    return responseHandler.success(res, { isPrivate: user.isPrivate }, 'Privacy updated successfully', statusCodes.SUCCESS);
  } catch (error) {
    console.error('Update privacy error:', error);
    return responseHandler.error(res, null, statusCodes.INTERNAL_SERVER_ERROR);
  }
};

const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;

    // Delete associated data first or handle orphans
    // For now, let's just delete the user.
    const user = await User.findByIdAndDelete(userId);
    if (!user) return responseHandler.notFound(res, 'User');

    return responseHandler.success(res, null, 'Account deleted successfully', statusCodes.SUCCESS);
  } catch (error) {
    console.error('Delete account error:', error);
    return responseHandler.error(res, null, statusCodes.INTERNAL_SERVER_ERROR);
  }
};

const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // 1. Basic validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      return responseHandler.error(res, 'All fields are required', statusCodes.BAD_REQUEST);
    }

    if (newPassword !== confirmPassword) {
      return responseHandler.error(res, 'New passwords do not match', statusCodes.BAD_REQUEST);
    }

    // 2. Find user
    const user = await User.findById(userId);
    if (!user) return responseHandler.notFound(res, 'User');

    // 3. Verify current password
    const isMatch = await comparePassword(currentPassword, user.password);
    if (!isMatch) {
      return responseHandler.error(res, 'Incorrect current password', statusCodes.UNAUTHORIZED);
    }

    // 4. Hash and save new password
    user.password = await hashPassword(newPassword);
    await user.save();

    return responseHandler.success(res, null, 'Password changed successfully', statusCodes.SUCCESS);
  } catch (error) {
    console.error('Change password error:', error);
    return responseHandler.error(res, 'Failed to change password', statusCodes.INTERNAL_SERVER_ERROR);
  }
};

module.exports = {
  createUser,
  updateProfile,
  getUserById,
  getUserPosts,
  getSuggestions,
  updatePrivacy,
  deleteAccount,
  saveInterests,
  changePassword
};
