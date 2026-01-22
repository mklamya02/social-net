/**
 * avatarUpload.js - Profile Photo Handler
 * 
 * Specifically configured for small profile pictures.
 * Uses Memory Storage (fast) because avatars are tiny.
 */

const multer = require("multer");
const path = require("path");

module.exports = multer({
  storage: multer.memoryStorage(), // Keeps file in RAM for quick processing
  limits: { fileSize: 5 * 1024 * 1024 }, // Max 5MB (supports higher quality banners and photos)
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    // Security: Only allow images
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Only images (jpeg, jpg, png, webp) are allowed!"));
  }
});
