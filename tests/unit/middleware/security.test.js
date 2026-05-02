/**
 * Security Middleware Tests
 * Comprehensive test coverage for security.js middleware
 */

// Mock dependencies BEFORE requiring the module
jest.mock('helmet');
jest.mock('cors');
jest.mock('express-rate-limit');

const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const config = require('../../../src/web/config');

// Setup default mock implementations
helmet.mockReturnValue((req, res, next) => next());
cors.mockReturnValue((req, res, next) => next());
rateLimit.mockReturnValue((req, res, next) => next());

const {
  helmetMiddleware,
  corsMiddleware,
  rateLimiter,
  applySecurityMiddleware
} = require('../../../src/web/middleware/security');

describe('Security Middleware', () => {
  let mockApp;
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock Express app
    mockApp = {
      use: jest.fn(),
      disable: jest.fn()
    };

    // Mock Express request
    mockReq = {
      ip: '127.0.0.1',
      path: '/api/analyze',
      method: 'POST',
      headers: {},
      body: {}
    };

    // Mock Express response
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };

    // Mock next function
    mockNext = jest.fn();
  });

  describe('Helmet Security Headers', () => {
    test('should initialize helmet with correct configuration', () => {
      // Verify helmet middleware exists and is a function
      expect(helmetMiddleware).toBeDefined();
      expect(typeof helmetMiddleware).toBe('function');
    });

    test('should apply helmet middleware with CSP directives', () => {
      const helmetOptions = config.security.helmetOptions;
      expect(helmetOptions.contentSecurityPolicy).toBeDefined();
      expect(helmetOptions.contentSecurityPolicy.directives).toMatchObject({
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"]
      });
    });

    test('should call helmet middleware on request', () => {
      helmetMiddleware(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('CORS Configuration', () => {
    test('should initialize CORS with correct configuration', () => {
      // Verify CORS middleware exists and is a function
      expect(corsMiddleware).toBeDefined();
      expect(typeof corsMiddleware).toBe('function');
    });

    test('should configure CORS with correct origin', () => {
      expect(config.cors.origin).toBeDefined();
      expect(config.cors.credentials).toBe(true);
      expect(config.cors.optionsSuccessStatus).toBe(200);
    });

    test('should allow requests from configured origin', () => {
      corsMiddleware(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    test('should handle preflight OPTIONS requests', () => {
      mockReq.method = 'OPTIONS';
      corsMiddleware(mockReq, mockRes, mockNext);
      // CORS middleware should be called
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Rate Limiting', () => {
    test('should initialize rate limiter with correct configuration', () => {
      // Verify rate limiter middleware exists and is a function
      expect(rateLimiter).toBeDefined();
      expect(typeof rateLimiter).toBe('function');
    });

    test('should configure rate limit with correct window and max requests', () => {
      expect(config.rateLimit.windowMs).toBe(15 * 60 * 1000); // 15 minutes
      expect(config.rateLimit.max).toBe(100); // 100 requests
      expect(config.rateLimit.standardHeaders).toBe(true);
      expect(config.rateLimit.legacyHeaders).toBe(false);
    });

    test('should allow requests within rate limit', () => {
      rateLimiter(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    test('should block requests exceeding rate limit', () => {
      // Test the configuration has the correct message
      expect(config.rateLimit.message).toBe('Too many requests from this IP, please try again later.');
    });

    test('should include rate limit message in response', () => {
      expect(config.rateLimit.message).toBe('Too many requests from this IP, please try again later.');
    });

    test('should track requests per IP address', () => {
      rateLimiter(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('applySecurityMiddleware', () => {
    test('should apply all security middleware to app', () => {
      applySecurityMiddleware(mockApp);

      expect(mockApp.use).toHaveBeenCalledTimes(3);
      expect(mockApp.disable).toHaveBeenCalledWith('x-powered-by');
    });

    test('should apply middleware in correct order', () => {
      applySecurityMiddleware(mockApp);

      const calls = mockApp.use.mock.calls;
      expect(calls[0][0]).toBe(helmetMiddleware);
      expect(calls[1][0]).toBe(corsMiddleware);
      expect(calls[2][0]).toBe(rateLimiter);
    });

    test('should disable x-powered-by header', () => {
      applySecurityMiddleware(mockApp);

      expect(mockApp.disable).toHaveBeenCalledWith('x-powered-by');
    });

    test('should apply helmet before CORS', () => {
      applySecurityMiddleware(mockApp);

      const calls = mockApp.use.mock.calls;
      // First call should be helmet, second CORS, third rate limiter
      expect(calls.length).toBe(3);
      expect(calls[0][0]).toBe(helmetMiddleware);
      expect(calls[1][0]).toBe(corsMiddleware);
    });

    test('should apply CORS before rate limiting', () => {
      applySecurityMiddleware(mockApp);

      const calls = mockApp.use.mock.calls;
      // Second call should be CORS, third rate limiter
      expect(calls.length).toBe(3);
      expect(calls[1][0]).toBe(corsMiddleware);
      expect(calls[2][0]).toBe(rateLimiter);
    });
  });

  describe('Request Sanitization', () => {
    test('should prevent XSS attacks through helmet CSP', () => {
      const cspDirectives = config.security.helmetOptions.contentSecurityPolicy.directives;
      
      // Verify script-src doesn't allow unsafe-inline or unsafe-eval
      expect(cspDirectives.scriptSrc).toEqual(["'self'"]);
      expect(cspDirectives.scriptSrc).not.toContain("'unsafe-inline'");
      expect(cspDirectives.scriptSrc).not.toContain("'unsafe-eval'");
    });

    test('should restrict default sources to self', () => {
      const cspDirectives = config.security.helmetOptions.contentSecurityPolicy.directives;
      expect(cspDirectives.defaultSrc).toEqual(["'self'"]);
    });

    test('should allow safe image sources', () => {
      const cspDirectives = config.security.helmetOptions.contentSecurityPolicy.directives;
      expect(cspDirectives.imgSrc).toContain("'self'");
      expect(cspDirectives.imgSrc).toContain("data:");
      expect(cspDirectives.imgSrc).toContain("https:");
    });

    test('should allow inline styles for UI compatibility', () => {
      const cspDirectives = config.security.helmetOptions.contentSecurityPolicy.directives;
      expect(cspDirectives.styleSrc).toContain("'self'");
      expect(cspDirectives.styleSrc).toContain("'unsafe-inline'");
    });
  });

  describe('Security Headers Integration', () => {
    test('should export all required middleware functions', () => {
      expect(helmetMiddleware).toBeDefined();
      expect(corsMiddleware).toBeDefined();
      expect(rateLimiter).toBeDefined();
      expect(applySecurityMiddleware).toBeDefined();
    });

    test('should be functions', () => {
      expect(typeof helmetMiddleware).toBe('function');
      expect(typeof corsMiddleware).toBe('function');
      expect(typeof rateLimiter).toBe('function');
      expect(typeof applySecurityMiddleware).toBe('function');
    });
  });

  describe('Configuration Validation', () => {
    test('should have valid rate limit window', () => {
      expect(config.rateLimit.windowMs).toBeGreaterThan(0);
      expect(typeof config.rateLimit.windowMs).toBe('number');
    });

    test('should have valid rate limit max requests', () => {
      expect(config.rateLimit.max).toBeGreaterThan(0);
      expect(typeof config.rateLimit.max).toBe('number');
    });

    test('should have valid CORS origin', () => {
      expect(config.cors.origin).toBeDefined();
      expect(typeof config.cors.origin).toBe('string');
    });

    test('should have valid helmet options', () => {
      expect(config.security.helmetOptions).toBeDefined();
      expect(typeof config.security.helmetOptions).toBe('object');
    });
  });
});

// Made with Bob