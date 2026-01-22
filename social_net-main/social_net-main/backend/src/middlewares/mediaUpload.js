/**
 * mediaUpload.js - The Large File Handler
 * 
 * Handles high-resolution images and videos (up to 200MB).
 * Uses Disk Storage because large files would crash the RAM 
 * if we used memory storage.
 */

const multer = require("multer");
const path = require("path");
const fs = require("fs");

// 1. Setup a temporary "uploads" folder on the hard drive
const uploadsDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// 2. Configure where and how to save the file temporarily
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // timestamp-randomID.extension
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

// 3. Security: Ensure only media is uploaded
const fileFilter = (req, file, cb) => {
  if (!file) return cb(new Error("No file received"));

  if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image and video files are allowed"));
  }
};

module.exports = multer({
  storage: storage,
  limits: {
    fileSize: 200 * 1024 * 1024, // 200MB limit for high-quality video
  },
  fileFilter: fileFilter,
});
