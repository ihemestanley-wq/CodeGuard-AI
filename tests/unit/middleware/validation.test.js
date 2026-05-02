/**
 * Validation Middleware Tests
 * Comprehensive test coverage for validation.js middleware
 */

const {
  validateAnalyzeRequest,
  validateRequestBody,
} = require('../../../src/web/middleware/validation');
const config = require('../../../src/web/config');

describe('Validation Middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    // Mock Express request
    mockReq = {
      body: {},
      headers: {},
      ip: '127.0.0.1',
    };

    // Mock Express response
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    // Mock next function
    mockNext = jest.fn();
  });

  describe('validateAnalyzeRequest', () => {
    describe('Diff Content Validation', () => {
      test('should pass validation with valid diffContent', () => {
        mockReq.body = {
          diffContent: 'diff --git a/file.js b/file.js\n+added line',
        };

        validateAnalyzeRequest(mockReq, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalled();
        expect(mockRes.status).not.toHaveBeenCalled();
      });

      test('should reject request without diffContent field', () => {
        mockReq.body = {};

        validateAnalyzeRequest(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: false,
          error: 'Missing required field: diffContent',
        });
        expect(mockNext).not.toHaveBeenCalled();
      });

      test('should reject request with null diffContent', () => {
        mockReq.body = {
          diffContent: null,
        };

        validateAnalyzeRequest(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: false,
          error: 'Missing required field: diffContent',
        });
        expect(mockNext).not.toHaveBeenCalled();
      });

      test('should reject request with undefined diffContent', () => {
        mockReq.body = {
          diffContent: undefined,
        };

        validateAnalyzeRequest(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: false,
          error: 'Missing required field: diffContent',
        });
        expect(mockNext).not.toHaveBeenCalled();
      });
    });

    describe('Content Type Validation', () => {
      test('should reject non-string diffContent', () => {
        mockReq.body = {
          diffContent: 12345,
        };

        validateAnalyzeRequest(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: false,
          error: 'diffContent must be a string',
        });
        expect(mockNext).not.toHaveBeenCalled();
      });

      test('should reject object diffContent', () => {
        mockReq.body = {
          diffContent: { diff: 'content' },
        };

        validateAnalyzeRequest(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: false,
          error: 'diffContent must be a string',
        });
        expect(mockNext).not.toHaveBeenCalled();
      });

      test('should reject array diffContent', () => {
        mockReq.body = {
          diffContent: ['diff', 'content'],
        };

        validateAnalyzeRequest(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: false,
          error: 'diffContent must be a string',
        });
        expect(mockNext).not.toHaveBeenCalled();
      });

      test('should reject boolean diffContent', () => {
        mockReq.body = {
          diffContent: true,
        };

        validateAnalyzeRequest(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: false,
          error: 'diffContent must be a string',
        });
        expect(mockNext).not.toHaveBeenCalled();
      });
    });

    describe('Empty Content Validation', () => {
      test('should reject empty string diffContent', () => {
        mockReq.body = {
          diffContent: '',
        };

        validateAnalyzeRequest(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: false,
          error: 'Missing required field: diffContent',
        });
        expect(mockNext).not.toHaveBeenCalled();
      });

      test('should reject whitespace-only diffContent', () => {
        mockReq.body = {
          diffContent: '   \n\t  ',
        };

        validateAnalyzeRequest(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: false,
          error: 'diffContent cannot be empty',
        });
        expect(mockNext).not.toHaveBeenCalled();
      });

      test('should accept diffContent with leading/trailing whitespace but valid content', () => {
        mockReq.body = {
          diffContent: '  diff --git a/file.js  \n',
        };

        validateAnalyzeRequest(mockReq, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalled();
        expect(mockRes.status).not.toHaveBeenCalled();
      });
    });

    describe('Length Limits', () => {
      test('should accept diffContent within size limit', () => {
        const validContent = 'a'.repeat(1000); // 1KB
        mockReq.body = {
          diffContent: validContent,
        };

        validateAnalyzeRequest(mockReq, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalled();
        expect(mockRes.status).not.toHaveBeenCalled();
      });

      test('should accept diffContent at exact size limit', () => {
        const maxSize = config.upload.maxDiffSize;
        const validContent = 'a'.repeat(maxSize);
        mockReq.body = {
          diffContent: validContent,
        };

        validateAnalyzeRequest(mockReq, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalled();
        expect(mockRes.status).not.toHaveBeenCalled();
      });

      test('should reject diffContent exceeding size limit', () => {
        const maxSize = config.upload.maxDiffSize;
        const oversizedContent = 'a'.repeat(maxSize + 1);
        mockReq.body = {
          diffContent: oversizedContent,
        };

        validateAnalyzeRequest(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(413);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: false,
          error: `Diff content exceeds maximum size of ${maxSize / (1024 * 1024)}MB`,
        });
        expect(mockNext).not.toHaveBeenCalled();
      });

      test('should calculate size in bytes correctly for UTF-8', () => {
        // UTF-8 multi-byte characters
        const unicodeContent = '🔥'.repeat(1000); // Each emoji is 4 bytes
        mockReq.body = {
          diffContent: unicodeContent,
        };

        validateAnalyzeRequest(mockReq, mockRes, mockNext);

        const expectedSize = Buffer.byteLength(unicodeContent, 'utf8');
        expect(expectedSize).toBeGreaterThan(1000); // More than 1 byte per character

        if (expectedSize > config.upload.maxDiffSize) {
          expect(mockRes.status).toHaveBeenCalledWith(413);
        } else {
          expect(mockNext).toHaveBeenCalled();
        }
      });

      test('should handle large valid diff content', () => {
        const largeValidContent = `diff --git a/file.js\n${'+line\n'.repeat(10000)}`;
        mockReq.body = {
          diffContent: largeValidContent,
        };

        validateAnalyzeRequest(mockReq, mockRes, mockNext);

        const size = Buffer.byteLength(largeValidContent, 'utf8');
        if (size <= config.upload.maxDiffSize) {
          expect(mockNext).toHaveBeenCalled();
        } else {
          expect(mockRes.status).toHaveBeenCalledWith(413);
        }
      });
    });

    describe('Error Handling', () => {
      test('should handle malformed request body gracefully', () => {
        // Simulate a request that throws during validation
        mockReq.body = {
          get diffContent() {
            throw new Error('Property access error');
          },
        };

        validateAnalyzeRequest(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: false,
          error: 'Invalid request format',
        });
        expect(mockNext).not.toHaveBeenCalled();
      });

      test('should return appropriate error response format', () => {
        mockReq.body = {};

        validateAnalyzeRequest(mockReq, mockRes, mockNext);

        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            error: expect.any(String),
          }),
        );
      });

      test('should not expose internal error details', () => {
        mockReq.body = {
          get diffContent() {
            throw new Error('Internal database connection failed');
          },
        };

        validateAnalyzeRequest(mockReq, mockRes, mockNext);

        expect(mockRes.json).toHaveBeenCalledWith({
          success: false,
          error: 'Invalid request format',
        });
      });
    });

    describe('Valid Diff Formats', () => {
      test('should accept standard git diff format', () => {
        mockReq.body = {
          diffContent: `diff --git a/file.js b/file.js
index 1234567..abcdefg 100644
--- a/file.js
+++ b/file.js
@@ -1,3 +1,4 @@
 function test() {
+  console.log('new line');
   return true;
 }`,
        };

        validateAnalyzeRequest(mockReq, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalled();
        expect(mockRes.status).not.toHaveBeenCalled();
      });

      test('should accept unified diff format', () => {
        mockReq.body = {
          diffContent: `--- a/file.js
+++ b/file.js
@@ -1,3 +1,4 @@
 function test() {
+  console.log('new line');
   return true;
 }`,
        };

        validateAnalyzeRequest(mockReq, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalled();
        expect(mockRes.status).not.toHaveBeenCalled();
      });

      test('should accept diff with multiple files', () => {
        mockReq.body = {
          diffContent: `diff --git a/file1.js b/file1.js
+added line
diff --git a/file2.js b/file2.js
+another line`,
        };

        validateAnalyzeRequest(mockReq, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalled();
        expect(mockRes.status).not.toHaveBeenCalled();
      });
    });
  });

  describe('validateRequestBody', () => {
    test('should pass validation with non-empty request body', () => {
      mockReq.body = {
        diffContent: 'some content',
      };

      validateRequestBody(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    test('should reject request with empty body object', () => {
      mockReq.body = {};

      validateRequestBody(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Request body is required',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should reject request with null body', () => {
      mockReq.body = null;

      validateRequestBody(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Request body is required',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should reject request with undefined body', () => {
      mockReq.body = undefined;

      validateRequestBody(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Request body is required',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should accept body with multiple fields', () => {
      mockReq.body = {
        diffContent: 'content',
        metadata: { author: 'test' },
        options: { verbose: true },
      };

      validateRequestBody(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    test('should accept body with any valid field', () => {
      mockReq.body = {
        anyField: 'value',
      };

      validateRequestBody(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe('Middleware Integration', () => {
    test('should export validateAnalyzeRequest function', () => {
      expect(validateAnalyzeRequest).toBeDefined();
      expect(typeof validateAnalyzeRequest).toBe('function');
    });

    test('should export validateRequestBody function', () => {
      expect(validateRequestBody).toBeDefined();
      expect(typeof validateRequestBody).toBe('function');
    });

    test('should have correct function signatures', () => {
      expect(validateAnalyzeRequest.length).toBe(3); // req, res, next
      expect(validateRequestBody.length).toBe(3); // req, res, next
    });

    test('should chain middleware correctly', () => {
      mockReq.body = {
        diffContent: 'valid content',
      };

      // First middleware
      validateRequestBody(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(1);

      // Reset mock
      mockNext.mockClear();

      // Second middleware
      validateAnalyzeRequest(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    test('should stop chain on validation failure', () => {
      mockReq.body = {};

      validateRequestBody(mockReq, mockRes, mockNext);
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('Configuration Validation', () => {
    test('should use correct max diff size from config', () => {
      expect(config.upload.maxDiffSize).toBe(50 * 1024 * 1024); // 50MB
    });

    test('should have valid upload configuration', () => {
      expect(config.upload).toBeDefined();
      expect(config.upload.maxDiffSize).toBeGreaterThan(0);
      expect(typeof config.upload.maxDiffSize).toBe('number');
    });
  });

  describe('Edge Cases', () => {
    test('should handle very long single line', () => {
      const longLine = 'a'.repeat(10000);
      mockReq.body = {
        diffContent: longLine,
      };

      validateAnalyzeRequest(mockReq, mockRes, mockNext);

      const size = Buffer.byteLength(longLine, 'utf8');
      if (size <= config.upload.maxDiffSize) {
        expect(mockNext).toHaveBeenCalled();
      } else {
        expect(mockRes.status).toHaveBeenCalledWith(413);
      }
    });

    test('should handle special characters in diff', () => {
      mockReq.body = {
        diffContent: 'diff --git\n+line with special chars: @#$%^&*()',
      };

      validateAnalyzeRequest(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    test('should handle newline variations', () => {
      mockReq.body = {
        diffContent: 'diff\r\n+line1\n+line2\r\n+line3',
      };

      validateAnalyzeRequest(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    test('should handle tabs and spaces', () => {
      mockReq.body = {
        diffContent: 'diff\n\t+indented line\n    +spaced line',
      };

      validateAnalyzeRequest(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });
});

// Made with Bob
