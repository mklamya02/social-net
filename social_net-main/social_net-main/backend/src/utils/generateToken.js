/**
 * generateToken.js - The ID Badge Maker
 * 
 * Once a user logs in, we give them "Tokens" (JWTs). 
 * These act like digital ID badges they show to the server for every request.
 */

const jwt = require("jsonwebtoken");
const envVariable = require("../config/EnvVariable");

const generateTokens = (user) => {
  // 1. ACCESS TOKEN: Short-lived (15 mins). Used for everyday actions.
  const accessToken = jwt.sign(
    { id: user._id, email: user.email },
    envVariable.ACCESS_TOKEN_SECRET,
    { expiresIn: "15m" }
  );

  // 2. REFRESH TOKEN: Long-lived (7 days). Used to get a new Access Token 
  // when the old one expires, so the user doesn't have to login every 15 mins.
  const refreshToken = jwt.sign(
    { id: user._id },
    envVariable.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );

  return { accessToken, refreshToken };
};

module.exports = generateTokens;