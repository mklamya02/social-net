/**
 * minioHelper.js - The Cloud Storage Assistant
 * 
 * This file handles all the hard work of sending images/videos to MinIO
 * and getting back secure URLs so the user can see them.
 */

const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { minioClient, bucketName } = require('../config/minio');
const envVar = require('../config/EnvVariable');

/**
 * Ensures every file has a totally unique name.
 * If two users upload 'me.jpg', they won't overwrite each other.
 */
function generateUniqueFileName(originalName) {
  const ext = path.extname(originalName);
  return `${uuidv4()}${ext}`; // Turns 'photo.jpg' into something like 'abc-123.jpg'
}

/**
 * UPLOAD TO CLOUD
 * Takes a file from the 'uploads' folder, moves it to MinIO, 
 * and deletes the temporary file.
 */
async function uploadToMinIO(filePath, fileName, contentType) {
  try {
    const metaData = { 'Content-Type': contentType };

    // 1. Send to MinIO
    await minioClient.fPutObject(bucketName, fileName, filePath, metaData);

    // 2. Generate a secure URL (valid for 24 hours)
    const presignedUrl = await generatePresignedUrl(fileName);

    // 3. Clean up the temporary file from our server (it's in the cloud now!)
    await fs.unlink(filePath);

    return { key: fileName, url: presignedUrl };
  } catch (error) {
    try { await fs.unlink(filePath); } catch (e) {}
    throw new Error(`MinIO upload failed: ${error.message}`);
  }
}

/**
 * SECURE ACCESS
 * Generates a "Presigned URL". This is a secret link that 
 * allows someone to see a private image for a limited time.
 */
async function generatePresignedUrl(objectKey, expirySeconds = 24 * 60 * 60) {
  // Use public URL directly
  // This bypasses the signature mismatch issues between Docker and localhost
  if (envVar.MINIO_URL) {
    return `${envVar.MINIO_URL}/${bucketName}/${objectKey}`;
  }
  
  // Fallback default
  return `http://localhost:9002/${bucketName}/${objectKey}`;
}

/**
 * DELETE FROM CLOUD
 */
async function deleteFromMinIO(objectKey) {
  try {
    await minioClient.removeObject(bucketName, objectKey);
  } catch (error) {
    throw new Error(`Failed to delete from MinIO: ${error.message}`);
  }
}

/**
 * REFRESH URL
 * Since URLs expire after 24h, we call this whenever we fetch a post
 * to give the user a fresh, working link.
 */
async function refreshPresignedUrl(objectKey) {
  return generatePresignedUrl(objectKey);
}
/**
 * UPLOAD BUFFER TO CLOUD
 * Directly sends a Buffer (from memory) to MinIO.
 * Useful for handling file uploads without saving them to disk first.
 */
async function uploadBufferToMinIO(buffer, fileName, contentType) {
  try {
    const metaData = { 'Content-Type': contentType };

    // 1. Send to MinIO
    await minioClient.putObject(bucketName, fileName, buffer, buffer.length, metaData);

    // 2. Generate a secure URL (valid for 24 hours)
    const presignedUrl = await generatePresignedUrl(fileName);

    return { key: fileName, url: presignedUrl };
  } catch (error) {
    throw new Error(`MinIO buffer upload failed: ${error.message}`);
  }
}

module.exports = {
  generateUniqueFileName,
  uploadToMinIO,
  uploadBufferToMinIO,
  generatePresignedUrl,
  deleteFromMinIO,
  refreshPresignedUrl,
};
