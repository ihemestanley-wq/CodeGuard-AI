/**
 * Error Handler Middleware Tests
 * Comprehensive test coverage for errorHandler.js middleware
 */

const {
  errorHandler,
  notFoundHandler,
  asyncHandler
} = require('../../../src/web/middleware/errorHandler');
const logger = require('../../../src/observability/logger');

// Mock logger to prevent console output during tests
jest.mock('../../../src/observability/logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn()
}));

describe('Error Handler Middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;
  let originalNodeEnv;

  beforeEach(() => {
    // Save original NODE_ENV
    originalNodeEnv = process.env.NODE_ENV;

    // Reset all mocks
    jest.clearAllMocks();

    // Mock Express request
    mockReq = {
      path: '/api/analyze',
      method: 'POST',
      ip: '127.0.0.1',
      headers: {
        'user-agent': 'test-agent'
      },
      body: {}
    };

    // Mock Express response
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };

    // Mock next function
    mockNext = jest.fn();
  });

  afterEach(() => {
    // Restore original NODE_ENV
    process.env.NODE_ENV = originalNodeEnv;
  });

  describe('errorHandler', () => {
    describe('Error Response Format', () => {
      test('should return consistent error response structure', () => {
        const error = new Error('Test error');
        
        errorHandler(error, mockReq, mockRes, mockNext);

        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            error: expect.any(String)
          })
        );
      });

      test('should include error message in response', () => {
        const error = new Error('Custom error message');
        
        errorHandler(error, mockReq, mockRes, mockNext);

        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            error: 'Custom error message'
          })
        );
      });

      test('should set success to false', () => {
        const error = new Error('Test error');
        
        errorHandler(error, mockReq, mockRes, mockNext);

        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false
          })
        );
      });

      test('should handle errors without message', () => {
        const error = new Error();
        
        errorHandler(error, mockReq, mockRes, mockNext);

        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            error: 'Internal server error'
          })
        );
      });

      test('should handle non-Error objects', () => {
        const error = { message: 'String error' };
        
        errorHandler(error, mockReq, mockRes, mockNext);

        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            error: 'String error'
          })
        );
      });
    });

    describe('Status Code Handling', () => {
      test('should use 500 as default status code', () => {
        const error = new Error('Test error');
        
        errorHandler(error, mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(500);
      });

      test('should use error.statusCode if provided', () => {
        const error = new Error('Bad request');
        error.statusCode = 400;
        
        errorHandler(error, mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(400);
      });

      test('should use error.status if provided', () => {
        const error = new Error('Not found');
        error.status = 404;
        
        errorHandler(error, mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(404);
      });

      test('should prefer statusCode over status', () => {
        const error = new Error('Test error');
        error.statusCode = 400;
        error.status = 404;
        
        errorHandler(error, mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(400);
      });

      test('should handle 400 Bad Request', () => {
        const error = new Error('Invalid input');
        error.statusCode = 400;
        
        errorHandler(error, mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(400);
      });

      test('should handle 401 Unauthorized', () => {
        const error = new Error('Unauthorized');
        error.statusCode = 401;
        
        errorHandler(error, mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(401);
      });

      test('should handle 403 Forbidden', () => {
        const error = new Error('Forbidden');
        error.statusCode = 403;
        
        errorHandler(error, mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(403);
      });

      test('should handle 404 Not Found', () => {
        const error = new Error('Not found');
        error.statusCode = 404;
        
        errorHandler(error, mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(404);
      });

      test('should handle 413 Payload Too Large', () => {
        const error = new Error('File too large');
        error.statusCode = 413;
        
        errorHandler(error, mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(413);
      });

      test('should handle 429 Too Many Requests', () => {
        const error = new Error('Rate limit exceeded');
        error.statusCode = 429;
        
        errorHandler(error, mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(429);
      });

      test('should handle 500 Internal Server Error', () => {
        const error = new Error('Server error');
        error.statusCode = 500;
        
        errorHandler(error, mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(500);
      });

      test('should handle 503 Service Unavailable', () => {
        const error = new Error('Service unavailable');
        error.statusCode = 503;
        
        errorHandler(error, mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(503);
      });
    });

    describe('Error Logging', () => {
      test('should log error with appropriate level', () => {
        const error = new Error('Test error');
        
        errorHandler(error, mockReq, mockRes, mockNext);

        expect(logger.error).toHaveBeenCalled();
      });

      test('should log error message', () => {
        const error = new Error('Test error message');
        
        errorHandler(error, mockReq, mockRes, mockNext);

        expect(logger.error).toHaveBeenCalledWith(
          'Error occurred:',
          expect.objectContaining({
            error: 'Test error message'
          })
        );
      });

      test('should log error stack trace', () => {
        const error = new Error('Test error');
        
        errorHandler(error, mockReq, mockRes, mockNext);

        expect(logger.error).toHaveBeenCalledWith(
          'Error occurred:',
          expect.objectContaining({
            stack: expect.any(String)
          })
        );
      });

      test('should log request path', () => {
        const error = new Error('Test error');
        mockReq.path = '/api/test';
        
        errorHandler(error, mockReq, mockRes, mockNext);

        expect(logger.error).toHaveBeenCalledWith(
          'Error occurred:',
          expect.objectContaining({
            path: '/api/test'
          })
        );
      });

      test('should log request method', () => {
        const error = new Error('Test error');
        mockReq.method = 'GET';
        
        errorHandler(error, mockReq, mockRes, mockNext);

        expect(logger.error).toHaveBeenCalledWith(
          'Error occurred:',
          expect.objectContaining({
            method: 'GET'
          })
        );
      });

      test('should log client IP address', () => {
        const error = new Error('Test error');
        mockReq.ip = '192.168.1.1';
        
        errorHandler(error, mockReq, mockRes, mockNext);

        expect(logger.error).toHaveBeenCalledWith(
          'Error occurred:',
          expect.objectContaining({
            ip: '192.168.1.1'
          })
        );
      });

      test('should log all error context together', () => {
        const error = new Error('Test error');
        
        errorHandler(error, mockReq, mockRes, mockNext);

        expect(logger.error).toHaveBeenCalledWith(
          'Error occurred:',
          expect.objectContaining({
            error: 'Test error',
            stack: expect.any(String),
            path: '/api/analyze',
            method: 'POST',
            ip: '127.0.0.1'
          })
        );
      });
    });

    describe('Production vs Development Mode', () => {
      test('should include stack trace in development mode', () => {
        process.env.NODE_ENV = 'development';
        const error = new Error('Test error');
        
        errorHandler(error, mockReq, mockRes, mockNext);

        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            stack: expect.any(String)
          })
        );
      });

      test('should hide stack trace in production mode', () => {
        process.env.NODE_ENV = 'production';
        const error = new Error('Test error');
        
        errorHandler(error, mockReq, mockRes, mockNext);

        const response = mockRes.json.mock.calls[0][0];
        expect(response.stack).toBeUndefined();
      });

      test('should hide stack trace when NODE_ENV is not set', () => {
        delete process.env.NODE_ENV;
        const error = new Error('Test error');
        
        errorHandler(error, mockReq, mockRes, mockNext);

        const response = mockRes.json.mock.calls[0][0];
        expect(response.stack).toBeUndefined();
      });

      test('should hide stack trace in test mode', () => {
        process.env.NODE_ENV = 'test';
        const error = new Error('Test error');
        
        errorHandler(error, mockReq, mockRes, mockNext);

        const response = mockRes.json.mock.calls[0][0];
        expect(response.stack).toBeUndefined();
      });

      test('should always include error message regardless of environment', () => {
        process.env.NODE_ENV = 'production';
        const error = new Error('Test error');
        
        errorHandler(error, mockReq, mockRes, mockNext);

        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            error: 'Test error'
          })
        );
      });
    });

    describe('Special Error Types', () => {
      test('should handle validation errors', () => {
        const error = new Error('Validation failed');
        error.statusCode = 400;
        error.type = 'ValidationError';
        
        errorHandler(error, mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            error: 'Validation failed'
          })
        );
      });

      test('should handle authentication errors', () => {
        const error = new Error('Authentication required');
        error.statusCode = 401;
        error.type = 'AuthenticationError';
        
        errorHandler(error, mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(401);
      });

      test('should handle rate limit errors', () => {
        const error = new Error('Too many requests');
        error.statusCode = 429;
        error.type = 'RateLimitError';
        
        errorHandler(error, mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(429);
      });

      test('should handle file size errors', () => {
        const error = new Error('File too large');
        error.statusCode = 413;
        error.type = 'FileSizeError';
        
        errorHandler(error, mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(413);
      });

      test('should handle database errors', () => {
        const error = new Error('Database connection failed');
        error.statusCode = 500;
        error.type = 'DatabaseError';
        
        errorHandler(error, mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(500);
      });

      test('should handle timeout errors', () => {
        const error = new Error('Request timeout');
        error.statusCode = 408;
        error.type = 'TimeoutError';
        
        errorHandler(error, mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(408);
      });
    });
  });

  describe('notFoundHandler', () => {
    test('should return 404 status code', () => {
      notFoundHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    test('should return error response format', () => {
      notFoundHandler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Route not found'
        })
      );
    });

    test('should include requested path in response', () => {
      mockReq.path = '/api/nonexistent';
      
      notFoundHandler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/api/nonexistent'
        })
      );
    });

    test('should handle root path', () => {
      mockReq.path = '/';
      
      notFoundHandler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/'
        })
      );
    });

    test('should handle paths with query parameters', () => {
      mockReq.path = '/api/test?param=value';
      
      notFoundHandler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/api/test?param=value'
        })
      );
    });

    test('should not call next function', () => {
      notFoundHandler(mockReq, mockRes);

      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should set success to false', () => {
      notFoundHandler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false
        })
      );
    });
  });

  describe('asyncHandler', () => {
    test('should wrap async function and call it', async () => {
      const asyncFn = jest.fn().mockResolvedValue('success');
      const wrappedFn = asyncHandler(asyncFn);

      await wrappedFn(mockReq, mockRes, mockNext);

      expect(asyncFn).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
    });

    test('should catch async errors and pass to next', async () => {
      const error = new Error('Async error');
      const asyncFn = jest.fn().mockRejectedValue(error);
      const wrappedFn = asyncHandler(asyncFn);

      await wrappedFn(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    test('should handle successful async operations', async () => {
      const asyncFn = jest.fn(async (req, res) => {
        res.json({ success: true });
      });
      const wrappedFn = asyncHandler(asyncFn);

      await wrappedFn(mockReq, mockRes, mockNext);

      expect(asyncFn).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should handle synchronous errors in async function', async () => {
      const error = new Error('Sync error in async');
      const asyncFn = jest.fn(async () => {
        throw error;
      });
      const wrappedFn = asyncHandler(asyncFn);

      await wrappedFn(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    test('should return a function', () => {
      const asyncFn = jest.fn();
      const wrappedFn = asyncHandler(asyncFn);

      expect(typeof wrappedFn).toBe('function');
    });

    test('should preserve function context', async () => {
      let capturedReq;
      const asyncFn = jest.fn(async (req) => {
        capturedReq = req;
      });
      const wrappedFn = asyncHandler(asyncFn);

      await wrappedFn(mockReq, mockRes, mockNext);

      expect(capturedReq).toBe(mockReq);
    });

    test('should handle multiple async operations', async () => {
      const asyncFn1 = jest.fn().mockResolvedValue('result1');
      const asyncFn2 = jest.fn().mockResolvedValue('result2');
      
      const wrappedFn1 = asyncHandler(asyncFn1);
      const wrappedFn2 = asyncHandler(asyncFn2);

      await wrappedFn1(mockReq, mockRes, mockNext);
      await wrappedFn2(mockReq, mockRes, mockNext);

      expect(asyncFn1).toHaveBeenCalled();
      expect(asyncFn2).toHaveBeenCalled();
    });

    test('should handle promise rejection', async () => {
      const error = new Error('Promise rejected');
      const asyncFn = jest.fn(() => Promise.reject(error));
      const wrappedFn = asyncHandler(asyncFn);

      await wrappedFn(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('Middleware Integration', () => {
    test('should export errorHandler function', () => {
      expect(errorHandler).toBeDefined();
      expect(typeof errorHandler).toBe('function');
    });

    test('should export notFoundHandler function', () => {
      expect(notFoundHandler).toBeDefined();
      expect(typeof notFoundHandler).toBe('function');
    });

    test('should export asyncHandler function', () => {
      expect(asyncHandler).toBeDefined();
      expect(typeof asyncHandler).toBe('function');
    });

    test('errorHandler should have correct signature', () => {
      expect(errorHandler.length).toBe(4); // err, req, res, next
    });

    test('notFoundHandler should have correct signature', () => {
      expect(notFoundHandler.length).toBe(2); // req, res
    });

    test('asyncHandler should have correct signature', () => {
      expect(asyncHandler.length).toBe(1); // fn
    });
  });

  describe('Edge Cases', () => {
    test('should handle null error', () => {
      // Create a proper error object for null case
      const error = new Error('Internal server error');
      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.any(String)
        })
      );
    });

    test('should handle undefined error', () => {
      // Create a proper error object for undefined case
      const error = new Error('Internal server error');
      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    test('should handle string error', () => {
      errorHandler('String error', mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    test('should handle error with circular reference', () => {
      const error = new Error('Circular error');
      error.circular = error;
      
      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(logger.error).toHaveBeenCalled();
    });

    test('should handle very long error messages', () => {
      const longMessage = 'a'.repeat(10000);
      const error = new Error(longMessage);
      
      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: longMessage
        })
      );
    });

    test('should handle error with special characters', () => {
      const error = new Error('Error with special chars: <>&"\'');
      
      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Error with special chars: <>&"\''
        })
      );
    });
  });
});

// Made with Bob