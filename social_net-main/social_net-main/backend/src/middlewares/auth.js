/**
 * auth.js - The Security Guard
 * 
 * This middleware protects routes. If a request doesn't have a valid
 * Token (showing they are logged in), they are kicked out with a 401 error.
 */

const jwt = require("jsonwebtoken");
const responseHandler = require("../utils/responseHandler");
const envVar = require("../config/EnvVariable");

const authenticate = (req, res, next) => {
  // 1. Look for the "Authorization" header (usually "Bearer <TOKEN>")
  const authHeader = req.headers["authorization"];

  if (!authHeader) return responseHandler.unauthorized(res, "No token provided");

  const token = authHeader.split(" ")[1]; 
  if (!token) return responseHandler.unauthorized(res, "Invalid token format");

  try {
    // 2. Verify the token using our secret key
    const payload = jwt.verify(token, envVar.ACCESS_TOKEN_SECRET);
    
    // 3. Attach the user data to 'req.user' so controllers know WHO is making the request
    req.user = payload;
    
    // 4. Everything is fine, proceed to the next function (the controller)
    next();
  } catch (err) {
    return responseHandler.unauthorized(res, "Access token expired or invalid");
  }
};

module.exports = authenticate;
