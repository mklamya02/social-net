/**
 * auth.route.js - The Entrance Gates
 * 
 * This file defines the URLs related to Authentication.
 * It's like a "Map" that says which URL goes to which logic in the controller.
 */

const express = require("express");
const router = express.Router();
const multer = require("multer"); 

// Multer is used to handle 'form-data' (when the user sends images)
const upload = multer({ storage: multer.memoryStorage() }); 

const authController = require("../controllers/auth.controller");
const userSchema = require("../validators/userSchema");
const validateMiddleware = require("../middlewares/validate");
const authenticate = require("../middlewares/auth");

/**
 * REGISTER
 * POST /api/auth/register
 * logic:
 * 1. Multer parses images (avatar/banner)
 * 2. validateMiddleware checks if email/password are valid
 * 3. authController.register saves the user to the database
 */
router.post("/register",   
  upload.fields([{ name: "avatar", maxCount: 1 },{ name: "banner", maxCount: 1 }]),
  validateMiddleware(userSchema.createUserSchema), 
  authController.register
);

/**
 * LOGIN
 * POST /api/auth/login
 */
router.post("/login", authController.login);

/**
 * REFRESH TOKEN
 * POST /api/auth/refresh-token
 * Used to get a new Access Token without logging out the user.
 */
router.post("/refresh-token", authController.refreshToken);

/**
 * LOGOUT
 * POST /api/auth/logout
 */
router.post("/logout", authController.logout);

/**
 * GET ME
 * GET /api/auth/me
 * 'authenticate' middleware runs first to make sure the user is logged in.
 */
router.get("/me", authenticate, authController.getCurrentUser);

module.exports = router;
