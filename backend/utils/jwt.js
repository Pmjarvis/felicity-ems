const jwt = require('jsonwebtoken');

/**
 * Generate JWT token for user
 * @param {Object} user - User object
 * @returns {String} JWT token
 */
const generateToken = (user) => {
  const payload = {
    id: user._id,
    email: user.email,
    role: user.role
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

/**
 * Generate refresh token
 * @param {Object} user - User object
 * @returns {String} Refresh token
 */
const generateRefreshToken = (user) => {
  const payload = {
    id: user._id,
    type: 'refresh'
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

/**
 * Send token response
 * @param {Object} user - User object
 * @param {Number} statusCode - HTTP status code
 * @param {Object} res - Express response object
 * @param {String} message - Optional message
 */
const sendTokenResponse = (user, statusCode, res, message = 'Success') => {
  // Generate token
  const token = generateToken(user);
  
  // Remove password from user object
  const userObject = user.toObject();
  delete userObject.password;
  
  res.status(statusCode).json({
    success: true,
    message,
    token,
    user: userObject
  });
};

module.exports = {
  generateToken,
  generateRefreshToken,
  sendTokenResponse
};
