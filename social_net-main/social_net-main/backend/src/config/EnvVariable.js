require("dotenv").config();
const envVar={
    PORT:process.env.PORT,
    MONGODB_URI:process.env.MONGODB_URI,
    ACCESS_TOKEN_SECRET:process.env.ACCESS_TOKEN_SECRET,
    REFRESH_TOKEN_SECRET:process.env.REFRESH_TOKEN_SECRET,
    // MinIO Configuration
    MINIO_ENDPOINT:process.env.MINIO_ENDPOINT,
    MINIO_PORT:parseInt(process.env.MINIO_PORT) || 9000,
    MINIO_ROOT_USER:process.env.MINIO_ROOT_USER,
    MINIO_ROOT_PASSWORD:process.env.MINIO_ROOT_PASSWORD,
    MINIO_BUCKET:process.env.MINIO_BUCKET,
    MINIO_URL:process.env.MINIO_URL,
    MINIO_USE_SSL:process.env.MINIO_USE_SSL === 'true',
    VITE_CLIENT_URL:process.env.VITE_CLIENT_URL || 'http://localhost:8080'
};
module.exports=envVar;