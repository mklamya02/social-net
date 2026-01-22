/**
 * server.js - The Entry Point of the Application
 * 
 * Think of this file as the "Engine Starter." 
 * It gathers all the necessary components (Database, Storage, Web Socket, and the App itself)
 * and starts them up in the correct order.
 */

// 1. Load Environment Variables FIRST (before anything else)
const envVar = require("./config/EnvVariable"); 

// 2. Gather other components
const app = require("./app"); // The Express application logic
const connectDB = require("./config/Db"); // Database connection logic
const http = require("http"); // Node's built-in HTTP module to create the server
const { initSocket } = require("./socket"); // Real-time notification logic (Socket.io)
const initMinIO = require("./utils/initMinIO"); // File storage initialization logic

/**
 * The 'run' function handles the asynchronous startup process.
 * We use 'async/await' to ensure one step finishes before the next starts.
 */
async function run() {
  try {
    // STEP 1: Connect to MongoDB (The "Brain" where data is stored)
    await connectDB();

    // STEP 2: Initialize MinIO bucket (The "Vault" where images/files are stored)
    await initMinIO();

    // STEP 3: Create the HTTP server using our Express app
    // We do this manually instead of app.listen so we can attach Socket.io to it.
    const server = http.createServer(app);

    // STEP 4: Initialize Socket.io (The "Intercom" for real-time messages)
    initSocket(server);

    // STEP 5: Start listening for incoming requests
    server.listen(envVar.PORT, () => {
      console.log(`Server listening on port ${envVar.PORT}`);
    });

  } catch (e) {
    // If anything fails during startup, we log the error and stop the process.
    console.log(e);
    process.exit(1); // Exit with failure code
  }
}

// Kick off the engine!
run();
