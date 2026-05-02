/**
 * Request Validation Middleware
 * Validates incoming requests for the analyze endpoint
 */

const config = require('../config');

/**
 * Validate analyze request
 * Ensures required fields are present and within size limits
 */
function validateAnalyzeRequest(req, res, next) {
  try {
    const { diffContent } = req.body;

    // Check if diffContent is provided
    if (!diffContent) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: diffContent'
      });
    }

    // Check if diffContent is a string
    if (typeof diffContent !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'diffContent must be a string'
      });
    }

    // Check if diffContent is not empty
    if (diffContent.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'diffContent cannot be empty'
      });
    }

    // Check size limit (50MB)
    const sizeInBytes = Buffer.byteLength(diffContent, 'utf8');
    if (sizeInBytes > config.upload.maxDiffSize) {
      return res.status(413).json({
        success: false,
        error: `Diff content exceeds maximum size of ${config.upload.maxDiffSize / (1024 * 1024)}MB`
      });
    }

    // Validation passed
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'Invalid request format'
    });
  }
}

/**
 * Validate request body exists
 */
function validateRequestBody(req, res, next) {
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Request body is required'
    });
  }
  next();
}

module.exports = {
  validateAnalyzeRequest,
  validateRequestBody
};

// Made with Bob
