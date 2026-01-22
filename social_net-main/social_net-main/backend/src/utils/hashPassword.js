/**
 * hashPassword.js - The Vault
 * 
 * We NEVER store user passwords in plain text. If our database was ever stolen,
 * hackers would see everyone's passwords. 
 * Instead, we use "Bcrypt" to turn 'password123' into a scrambled mess like '$2b$10...'.
 */

const bcrypt = require('bcrypt');

/**
 * Turns plain text into a secure hash.
 * This is done during Registration or Password Change.
 */
const hashPassword = async (plainPassword) => {
  const saltRounds = 10; // The "Salt" makes the hash even more unpredictable
  const hashed = await bcrypt.hash(plainPassword, saltRounds);
  return hashed;
};

/**
 * Compares a plain text password (from login form) with the hash (from database).
 * Bcrypt handles the complex math to see if they match.
 */
const comparePassword = async (plainPassword, hashedPassword) => {
  return bcrypt.compare(plainPassword, hashedPassword);
};

module.exports = { hashPassword, comparePassword };
