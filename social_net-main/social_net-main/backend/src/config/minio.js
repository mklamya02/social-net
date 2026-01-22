const Minio = require('minio');
const envVar = require('./EnvVariable');

/**
 * MinIO Client Configuration
 *
 * Initializes the MinIO client using environment variables.
 * This client is used throughout the application for object storage operations.
 *
 * Configuration:
 * - endPoint: MinIO server hostname (without protocol)
 * - port: MinIO server port (default: 9000)
 * - useSSL: Enable HTTPS for production environments
 * - accessKey: MinIO access credentials
 * - secretKey: MinIO secret credentials
 */
const minioClient = new Minio.Client({
  endPoint: envVar.MINIO_ENDPOINT,
  port: envVar.MINIO_PORT,
  useSSL: envVar.MINIO_USE_SSL,
  accessKey: envVar.MINIO_ROOT_USER,
  secretKey: envVar.MINIO_ROOT_PASSWORD,
});

/**
 * Validates MinIO connection by attempting to list buckets with retry logic
 * This is called during server startup to handle delays in container readiness
 *
 * @param {number} retries - Number of retry attempts
 * @param {number} delay - Delay between retries in ms
 * @returns {Promise<boolean>} True if connection is successful
 */
async function validateConnection(retries = 5, delay = 2000) {
    console.log("MINIO_ENDPOINT =", envVar.MINIO_ENDPOINT);
    console.log("MINIO_PORT =", envVar.MINIO_PORT);
    console.log("MINIO_USE_SSL =", envVar.MINIO_USE_SSL);

  for (let i = 0; i < retries; i++) {
    try {
      await minioClient.listBuckets();
      console.log('✓ MinIO connection validated successfully');
      return true;
    } catch (error) {
      if (i === retries - 1) {
        console.error('✗ MinIO connection failed after maximum retries:', error.message);
        throw new Error(`MinIO connection validation failed: ${error.message}`);
      }
      console.warn(`⚠ MinIO not ready (attempt ${i + 1}/${retries}), retrying in ${delay / 1000}s...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

module.exports = {
  minioClient,
  validateConnection,
  bucketName: envVar.MINIO_BUCKET,
};
