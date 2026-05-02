/**
 * CodeGuard AI - Structured Logger
 * Provides centralized logging with different levels and structured output
 */

const winston = require('winston');
const path = require('path');

// Log levels
const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

// Custom format for structured logging
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...metadata }) => {
    let msg = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }
    
    return msg;
  })
);

// Create logger instance
const logger = winston.createLogger({
  levels: LOG_LEVELS,
  level: process.env.LOG_LEVEL || 'info',
  format: customFormat,
  transports: [
    // Console transport
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        customFormat
      ),
    }),
    // File transport for errors
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // File transport for all logs
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
  exitOnError: false,
});

/**
 * Log an info message
 * @param {string} message - Log message
 * @param {Object} metadata - Additional metadata
 */
function info(message, metadata = {}) {
  logger.info(message, metadata);
}

/**
 * Log a warning message
 * @param {string} message - Log message
 * @param {Object} metadata - Additional metadata
 */
function warn(message, metadata = {}) {
  logger.warn(message, metadata);
}

/**
 * Log an error message
 * @param {string} message - Log message
 * @param {Error|Object} error - Error object or metadata
 */
function error(message, error = {}) {
  if (error instanceof Error) {
    logger.error(message, {
      error: error.message,
      stack: error.stack,
    });
  } else {
    logger.error(message, error);
  }
}

/**
 * Log a debug message
 * @param {string} message - Log message
 * @param {Object} metadata - Additional metadata
 */
function debug(message, metadata = {}) {
  logger.debug(message, metadata);
}

/**
 * Create a child logger with additional context
 * @param {Object} context - Context to add to all logs
 * @returns {Object} Child logger
 */
function createChildLogger(context) {
  return {
    info: (message, metadata = {}) => info(message, { ...context, ...metadata }),
    warn: (message, metadata = {}) => warn(message, { ...context, ...metadata }),
    error: (message, error = {}) => {
      const errorData = error instanceof Error 
        ? { error: error.message, stack: error.stack }
        : error;
      logger.error(message, { ...context, ...errorData });
    },
    debug: (message, metadata = {}) => debug(message, { ...context, ...metadata }),
  };
}

/**
 * Log analysis start
 * @param {string} diffPath - Path to diff file
 */
function logAnalysisStart(diffPath) {
  info('Starting CodeGuard AI analysis', {
    diffPath,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Log analysis completion
 * @param {Object} results - Analysis results
 */
function logAnalysisComplete(results) {
  info('Analysis completed', {
    riskScore: results.riskScore,
    decision: results.decision,
    filesAnalyzed: results.filesAnalyzed,
    duration: results.duration,
  });
}

/**
 * Log security finding
 * @param {Object} finding - Security finding details
 */
function logSecurityFinding(finding) {
  warn('Security finding detected', {
    type: finding.type,
    severity: finding.severity,
    file: finding.file,
    line: finding.line,
  });
}

/**
 * Log performance metric
 * @param {string} operation - Operation name
 * @param {number} duration - Duration in milliseconds
 */
function logPerformance(operation, duration) {
  debug('Performance metric', {
    operation,
    duration: `${duration}ms`,
  });
}

module.exports = {
  info,
  warn,
  error,
  debug,
  createChildLogger,
  logAnalysisStart,
  logAnalysisComplete,
  logSecurityFinding,
  logPerformance,
  logger, // Export raw logger for advanced use cases
};

// Made with Bob
