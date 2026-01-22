/**
 * Db.js - Database Connection Configuration
 * 
 * This file handles the handshake between your Node.js server and the MongoDB database.
 * We use Mongoose, which is an ODM (Object Data Modeling) library for MongoDB and Node.js.
 * Think of Mongoose as a "Translator" that lets us talk to MongoDB using JavaScript objects.
 */

const mongoose = require('mongoose');
const envVar = require("./EnvVariable");

const connectDB = async () => {
  try {
    // Attempt to connect to MongoDB using the URI from our environment variables
    const conn = await mongoose.connect(envVar.MONGODB_URI);
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Database: ${conn.connection.name}`);
    
    // Listen for connection errors after initial connection
    mongoose.connection.on('error', err => {
      console.error(`MongoDB connection error: ${err}`);
    });
    
    // Listen for disconnection events
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });
    
    /**
     * Graceful Shutdown
     * If you stop the server (Ctrl+C), this ensures the database connection is 
     * closed cleanly before the process exits.
     */
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    });
    
  } catch (error) {
    // If the initial connection fails, log why and stop the whole server
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1); // 1 = Exit with failure
  }
};

module.exports = connectDB;