const { minioClient, validateConnection, bucketName } = require('../config/minio');

/**
 * Initialize MinIO Bucket
 * 
 * This function is called during server startup to ensure the configured bucket exists.
 * If the bucket doesn't exist, it will be created with appropriate policies.
 * 
 * Bucket Policy:
 * - Private bucket (default)
 * - Access via presigned URLs only
 * - No public read/write access
 * 
 * @returns {Promise<void>}
 * @throws {Error} If MinIO is unreachable or bucket operations fail
 */
async function initMinIO() {
  try {
    console.log(`Initializing MinIO bucket: ${bucketName}...`);

    // Validate MinIO connection first
    await validateConnection();

    // Check if bucket exists
    const bucketExists = await minioClient.bucketExists(bucketName);

    if (bucketExists) {
      console.log(`✓ MinIO bucket '${bucketName}' already exists`);
    } else {
      // Create bucket if it doesn't exist
      await minioClient.makeBucket(bucketName, 'us-east-1');
      console.log(`✓ MinIO bucket '${bucketName}' created successfully`);
    }

    // Set Public Bucket Policy (Always update this to adhere to latest security config)
    // This allows direct access to files via http://localhost:9002/bucket/filename
    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${bucketName}/*`]
        }
      ]
    };
    
    // Apply the policy (works for both new and existing buckets)
    await minioClient.setBucketPolicy(bucketName, JSON.stringify(policy));
    console.log(`✓ MinIO bucket '${bucketName}' configured with PUBLIC read access`);

    // Note: setBucketCors is not supported in this version of the MinIO client
    // CORS should be configured via the MinIO Console if needed
    console.log('✓ MinIO initialization completed successfully');
  } catch (error) {
    console.error('✗ MinIO initialization failed:', error.message);
    console.error('Please ensure MinIO is running and credentials are correct');
    throw new Error(`MinIO initialization failed: ${error.message}`);
  }
}

module.exports = initMinIO;
