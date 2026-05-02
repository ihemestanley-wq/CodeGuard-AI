/**
 * Web Server Configuration
 * Centralized configuration for the Express server
 */

module.exports = {
  // Server configuration
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost',
    env: process.env.NODE_ENV || 'development'
  },

  // CORS configuration
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
    optionsSuccessStatus: 200
  },

  // Rate limiting configuration
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false
  },

  // File upload configuration
  upload: {
    maxFileSize: 50 * 1024 * 1024, // 50MB in bytes
    maxDiffSize: 50 * 1024 * 1024, // 50MB max diff size
    allowedMimeTypes: ['text/plain', 'application/octet-stream']
  },

  // Security configuration
  security: {
    helmetOptions: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"]
        }
      }
    }
  },

  // API configuration
  api: {
    prefix: '/api',
    version: 'v1'
  }
};

// Made with Bob
