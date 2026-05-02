/**
 * Security Middleware
 * Implements rate limiting, helmet security headers, and CORS
 */

const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const config = require('../config');

/**
 * Configure Helmet for security headers
 */
const helmetMiddleware = helmet(config.security.helmetOptions);

/**
 * Configure CORS
 */
const corsMiddleware = cors(config.cors);

/**
 * Configure rate limiting
 */
const rateLimiter = rateLimit(config.rateLimit);

/**
 * Apply all security middleware to the app
 * @param {Express} app - Express application instance
 */
function applySecurityMiddleware(app) {
  // Apply Helmet for security headers
  app.use(helmetMiddleware);

  // Apply CORS
  app.use(corsMiddleware);

  // Apply rate limiting
  app.use(rateLimiter);

  // Disable X-Powered-By header
  app.disable('x-powered-by');
}

module.exports = {
  helmetMiddleware,
  corsMiddleware,
  rateLimiter,
  applySecurityMiddleware,
};

// Made with Bob
