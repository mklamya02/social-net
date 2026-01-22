/**
 * optionalAuth.js - The Polite Guest Handler
 * 
 * Some pages (like looking at a public profile) can be seen by anyone.
 * But IF the user is logged in, we want to know so we can show 
 * "Follow" vs "Following" buttons correctly.
 * 
 * Unlike 'auth.js', this middleware NEVER blocks the request.
 */

const jwt = require("jsonwebtoken");
const envVar = require("../config/EnvVariable");

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  console.log("OptionalAuth: Header present?", !!authHeader); // DEBUG LOG
  
  // If no token, just move on as a Guest (req.user remains undefined)
  if (!authHeader) return next();

  const token = authHeader.split(" ")[1]; 
  if (!token) return next();

  try {
    const payload = jwt.verify(token, envVar.ACCESS_TOKEN_SECRET);
    req.user = payload; // Identifying the user to personalize the view
    next();
  } catch (err) {
    // CRITICAL FIX: If token is provided but expired/invalid, return 401.
    // This allows the Frontend Interceptor to catch it, REFRESH the token, and retry.
    // If we just called next(), the user would be treated as a guest, receiving 
    // incorrect "isLiked: false" states, leading to 409 Conflicts on action.
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

module.exports = optionalAuth;
