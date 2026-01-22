/**
 * auth.controller.js - The Gatekeeper's Logic
 * 
 * This file contains the actual functions (logic) for authentication.
 * It's where we talk to the Database AND send responses to the user.
 */

require("dotenv").config();
const jwt = require("jsonwebtoken");
const User = require('../models/user.model');
const responseHandler = require('../utils/responseHandler');
const { statusCodes } = require('../utils/statusCodes');
const { hashPassword, comparePassword } = require('../utils/hashPassword');
const generateTokens = require('../utils/generateToken');
const envVar = require('../config/EnvVariable');
const { uploadBufferToMinIO, generateUniqueFileName, refreshPresignedUrl } = require('../utils/minioHelper');

/**
 * REGISTER NEW USER
 */
const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, isPrivate } = req.body;

    // 1. Check if the user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return responseHandler.error(res, 'Email already exists', statusCodes.CONFLICT);
    }

    // 3. Hash the password (never store plain passwords!)
    const hashed = await hashPassword(password);

    const userData = {
      firstName,
      lastName,
      email: email.toLowerCase(),
      password: hashed,
      isPrivate: isPrivate || false
    };

    // 4. Handle File Uploads (Avatar & Banner) to MinIO
    if (req.files?.avatar) {
      const fileName = generateUniqueFileName(req.files.avatar[0].originalname);
      const { url, key } = await uploadBufferToMinIO(req.files.avatar[0].buffer, fileName, req.files.avatar[0].mimetype);
      userData.avatar = { url, key };
      userData.avatarType = req.files.avatar[0].mimetype;
    }
    if (req.files?.banner) {
      const fileName = generateUniqueFileName(req.files.banner[0].originalname);
      const { url, key } = await uploadBufferToMinIO(req.files.banner[0].buffer, fileName, req.files.banner[0].mimetype);
      userData.banner = { url, key };
      userData.bannerType = req.files.banner[0].mimetype;
    }

    // 5. Save to Database
    const user = new User(userData);
    await user.save();

    // 6. Generate JWT Tokens
    const { accessToken, refreshToken } = generateTokens(user);
    user.refreshToken = refreshToken; // Save refresh token to user for session management
    await user.save();

    // 7. Prepare response (Omit sensitive data like password)
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
      interests: user.interests,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    // 8. Set Refresh Token in a cookie (Secure and HTTPOnly!)
    // This is safer than LocalStorage because JS cannot read it.
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return responseHandler.success(res, { user: userResponse, accessToken }, 'User registered successfully', statusCodes.CREATED);

  } catch (error) {
    console.error('Registration error:', error);
    return responseHandler.error(res, 'Failed to register user', statusCodes.INTERNAL_SERVER_ERROR, error.message);
  }
};

/**
 * LOGIN EXISTING USER
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return responseHandler.error(res, 'User not found', statusCodes.NOT_FOUND);

    // 2. Verify password
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) return responseHandler.unauthorized(res, 'Invalid password');

    // 3. Generate new tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // 4. Update refresh token in DB
    user.refreshToken = refreshToken;
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
      interests: user.interests,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    // 5. Set Cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return responseHandler.success(res, { user: userResponse, accessToken }, 'Login successful', statusCodes.SUCCESS);

  } catch (error) {
    return responseHandler.error(res, 'Failed to login', statusCodes.INTERNAL_SERVER_ERROR, error.message);
  }
};

/**
 * REFRESH TOKEN (Keep the user logged in)
 */
const refreshToken = async (req, res) => {
  try {
    const token = req.cookies.refreshToken || req.body.refreshToken;
    if (!token) return responseHandler.unauthorized(res, 'No refresh token provided');

    // 1. Verify the token
    const payload = jwt.verify(token, envVar.REFRESH_TOKEN_SECRET);
    const user = await User.findById(payload.id);
    
    // 2. Make sure it matches what we have in DB
    if (!user || user.refreshToken !== token) return responseHandler.unauthorized(res, 'Invalid refresh token');

    // 3. Generate new pair of tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

    user.refreshToken = newRefreshToken;
    await user.save();

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return responseHandler.success(res, { accessToken }, 'Token refreshed successfully');

  } catch (error) {
    return responseHandler.unauthorized(res, 'Failed to refresh token');
  }
};

/**
 * LOGOUT
 */
const logout = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (token) {
      const payload = jwt.verify(token, envVar.REFRESH_TOKEN_SECRET);
      const user = await User.findById(payload.id);
      if (user) {
        user.refreshToken = null; // Invalidate current session in DB
        await user.save();
      }
    }

    res.clearCookie("refreshToken"); // Remove the cookie from the browser
    return responseHandler.success(res, null, 'Logged out successfully');
  } catch (error) {
    return responseHandler.error(res, 'Failed to logout', statusCodes.INTERNAL_SERVER_ERROR, error.message);
  }
};

/**
 * GET CURRENT AUTHENTICATED USER
 */
const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id; // User ID extracted from JWT by 'authenticate' middleware
    const user = await User.findById(userId).select('-password -refreshToken');
    
    if (!user) {
      return responseHandler.notFound(res, 'User');
    }

    // Refresh image URLs (MinIO links expire after a while for security)
    const { refreshPresignedUrl } = require('../utils/minioHelper');
    if (user.avatar?.key) {
      try {
        user.avatar.url = await refreshPresignedUrl(user.avatar.key);
      } catch (e) { console.error(e); }
    }
    if (user.banner?.key) {
      try {
        user.banner.url = await refreshPresignedUrl(user.banner.key);
      } catch (e) { console.error(e); }
    }

    const userResponse = {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      isPrivate: user.isPrivate,
      avatar: user.avatar?.url || null,
      banner: user.banner?.url || null,
      bio: user.bio,
      location: user.location,
      website: user.website,
      birthday: user.birthday,
      interests: user.interests,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    return responseHandler.success(res, userResponse, 'Current user fetched successfully', statusCodes.SUCCESS);
  } catch (error) {
    return responseHandler.error(res, 'Failed to fetch current user', statusCodes.INTERNAL_SERVER_ERROR, error.message);
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getCurrentUser
};
