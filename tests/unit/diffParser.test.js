/**
 * Unit Tests - Diff Parser
 * Comprehensive test coverage for src/agent/diffParser.js
 */

const fs = require('fs').promises;
const path = require('path');
const {
  parseDiff,
  parseDiffFromFile,
  extractCodeChanges,
  isPathSafe,
  sanitizePath,
  isExtensionAllowed,
  CONFIG,
} = require('../../src/agent/diffParser');
const fixtures = require('../fixtures/sample-diffs');

// Mock logger to prevent console output during tests
jest.mock('../../src/observability/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

describe('DiffParser', () => {
  describe('Basic Diff Parsing', () => {
    describe('parseDiff', () => {
      test('should parse simple file addition', () => {
        const diff = `diff --git a/src/newfile.js b/src/newfile.js
new file mode 100644
index 0000000..1234567
--- /dev/null
+++ b/src/newfile.js
@@ -0,0 +1,3 @@
+const hello = 'world';
+console.log(hello);
+module.exports = hello;`;

        const result = parseDiff(diff);

        expect(result).toHaveLength(1);
        expect(result[0].path).toBe('src/newfile.js');
        expect(result[0].changeType).toBe('added');
        expect(result[0].additions).toBe(3);
        expect(result[0].deletions).toBe(0);
      });

      test('should parse file deletion', () => {
        const diff = `diff --git a/src/oldfile.js b/src/oldfile.js
deleted file mode 100644
index 1234567..0000000
--- a/src/oldfile.js
+++ /dev/null
@@ -1,3 +0,0 @@
-const old = 'code';
-console.log(old);
-module.exports = old;`;

        const result = parseDiff(diff);

        expect(result).toHaveLength(1);
        expect(result[0].changeType).toBe('deleted');
        expect(result[0].deletions).toBe(3);
        expect(result[0].additions).toBe(0);
      });

      test('should parse file modification', () => {
        const result = parseDiff(fixtures.simpleDiff);

        expect(result).toHaveLength(1);
        expect(result[0].path).toBe('src/app.js');
        expect(result[0].changeType).toBe('modified');
        expect(result[0].additions).toBeGreaterThan(0);
      });

      test('should parse renamed file', () => {
        const diff = `diff --git a/src/old.js b/src/new.js
similarity index 100%
rename from src/old.js
rename to src/new.js`;

        const result = parseDiff(diff);

        expect(result).toHaveLength(1);
        expect(result[0].changeType).toBe('renamed');
        expect(result[0].oldPath).toBe('src/old.js');
        expect(result[0].newPath).toBe('src/new.js');
      });

      test('should handle empty diff', () => {
        const result = parseDiff(fixtures.emptyDiff || ' ');

        expect(result).toHaveLength(0);
        expect(Array.isArray(result)).toBe(true);
      });

      test('should handle invalid diff format gracefully', () => {
        const result = parseDiff(fixtures.invalidDiff);

        expect(Array.isArray(result)).toBe(true);
        expect(result).toHaveLength(0);
      });
    });
  });

  describe('File Change Detection', () => {
    test('should extract added lines correctly', () => {
      const diff = `diff --git a/src/test.js b/src/test.js
index 1234567..abcdefg 100644
--- a/src/test.js
+++ b/src/test.js
@@ -1,2 +1,4 @@
 const a = 1;
+const b = 2;
+const c = 3;
 console.log(a);`;

      const result = parseDiff(diff);

      expect(result[0].additions).toBe(2);
      expect(result[0].hunks[0].changes.filter((c) => c.type === 'addition')).toHaveLength(2);
    });

    test('should extract deleted lines correctly', () => {
      const diff = `diff --git a/src/test.js b/src/test.js
index 1234567..abcdefg 100644
--- a/src/test.js
+++ b/src/test.js
@@ -1,5 +1,2 @@
 const a = 1;
-const b = 2;
-const c = 3;
-const d = 4;
 console.log(a);`;

      const result = parseDiff(diff);

      expect(result[0].deletions).toBe(3);
      expect(result[0].hunks[0].changes.filter((c) => c.type === 'deletion')).toHaveLength(3);
    });

    test('should extract modified lines correctly', () => {
      const result = parseDiff(fixtures.securityIssueDiff);

      expect(result[0].additions).toBe(1);
      expect(result[0].deletions).toBe(1);
      expect(result[0].hunks).toHaveLength(1);
    });

    test('should count total changes accurately', () => {
      const result = parseDiff(fixtures.multiFileDiff);

      const totalAdditions = result.reduce((sum, f) => sum + f.additions, 0);
      const totalDeletions = result.reduce((sum, f) => sum + f.deletions, 0);

      expect(totalAdditions).toBeGreaterThan(0);
      expect(totalDeletions).toBeGreaterThan(0);
      expect(typeof totalAdditions).toBe('number');
      expect(typeof totalDeletions).toBe('number');
    });

    test('should track line numbers correctly', () => {
      const diff = `diff --git a/src/test.js b/src/test.js
index 1234567..abcdefg 100644
--- a/src/test.js
+++ b/src/test.js
@@ -10,3 +10,4 @@
 const x = 1;
 const y = 2;
+const z = 3;
 console.log(x, y);`;

      const result = parseDiff(diff);
      const addition = result[0].hunks[0].changes.find((c) => c.type === 'addition');

      expect(addition.lineNumber).toBe(13);
    });
  });

  describe('Multiple File Changes', () => {
    test('should parse multi-file diff correctly', () => {
      const result = parseDiff(fixtures.multiFileDiff);

      expect(result).toHaveLength(2);
      expect(result[0].path).toBe('src/auth.js');
      expect(result[1].path).toBe('src/config.js');
    });

    test('should handle multiple hunks in single file', () => {
      const diff = `diff --git a/src/test.js b/src/test.js
index 1234567..abcdefg 100644
--- a/src/test.js
+++ b/src/test.js
@@ -1,3 +1,4 @@
+const a = 1;
 const b = 2;
 const c = 3;
 console.log(b);
@@ -10,3 +11,4 @@
 function test() {
   return true;
 }
+module.exports = test;`;

      const result = parseDiff(diff);

      expect(result).toHaveLength(1);
      expect(result[0].hunks).toHaveLength(2);
      expect(result[0].additions).toBe(2);
    });

    test('should maintain file metadata across multiple files', () => {
      const result = parseDiff(fixtures.multiFileDiff);

      result.forEach((file) => {
        expect(file).toHaveProperty('path');
        expect(file).toHaveProperty('changeType');
        expect(file).toHaveProperty('additions');
        expect(file).toHaveProperty('deletions');
        expect(file).toHaveProperty('extension');
      });
    });
  });

  describe('Edge Cases', () => {
    test('should handle binary file changes', () => {
      const diff = `diff --git a/image.png b/image.png
index 1234567..abcdefg 100644
Binary files a/image.png and b/image.png differ`;

      const result = parseDiff(diff);

      // Binary files should be skipped due to extension filtering
      expect(result).toHaveLength(0);
    });

    test('should handle large diffs within limits', () => {
      const largeDiff = `diff --git a/src/large.js b/src/large.js
index 1234567..abcdefg 100644
--- a/src/large.js
+++ b/src/large.js
@@ -1,10 +1,100 @@
${Array(90).fill('+const line = "test";').join('\n')}`;

      const result = parseDiff(largeDiff);

      expect(result).toHaveLength(1);
      expect(result[0].additions).toBe(90);
    });

    test('should reject diffs exceeding maximum size', () => {
      const hugeDiff = 'a'.repeat(CONFIG.MAX_DIFF_SIZE + 1);

      expect(() => parseDiff(hugeDiff)).toThrow(/exceeds maximum allowed size/);
    });

    test('should reject diffs with too many files', () => {
      const manyFiles = Array(CONFIG.MAX_FILES + 1)
        .fill(null)
        .map((_, i) => `diff --git a/file${i}.js b/file${i}.js
index 1234567..abcdefg 100644
--- a/file${i}.js
+++ b/file${i}.js
@@ -1 +1,2 @@
+const x = ${i};
 console.log(x);`)
        .join('\n');

      expect(() => parseDiff(manyFiles)).toThrow(/exceeds maximum allowed/);
    });

    test('should handle lines exceeding maximum length', () => {
      const longLine = 'a'.repeat(CONFIG.MAX_LINE_LENGTH + 1);
      const diff = `diff --git a/src/test.js b/src/test.js
index 1234567..abcdefg 100644
--- a/src/test.js
+++ b/src/test.js
@@ -1 +1,2 @@
+const x = "${longLine}";
 console.log(x);`;

      const result = parseDiff(diff);

      // Should parse but skip the overly long line
      expect(result).toHaveLength(1);
    });

    test('should handle permission changes', () => {
      const diff = `diff --git a/script.sh b/script.sh
old mode 100644
new mode 100755
index 1234567..abcdefg
--- a/script.sh
+++ b/script.sh
@@ -1 +1,2 @@
 #!/bin/bash
+echo "Hello"`;

      const result = parseDiff(diff);

      expect(result).toHaveLength(1);
      expect(result[0].path).toBe('script.sh');
    });

    test('should handle context lines correctly', () => {
      const diff = `diff --git a/src/test.js b/src/test.js
index 1234567..abcdefg 100644
--- a/src/test.js
+++ b/src/test.js
@@ -1,5 +1,5 @@
 const a = 1;
 const b = 2;
-const c = 3;
+const c = 4;
 const d = 5;
 console.log(a, b, c, d);`;

      const result = parseDiff(diff);
      const contextLines = result[0].hunks[0].changes.filter((c) => c.type === 'context');

      expect(contextLines.length).toBeGreaterThan(0);
      expect(contextLines[0]).toHaveProperty('oldLineNumber');
      expect(contextLines[0]).toHaveProperty('newLineNumber');
    });
  });

  describe('Error Handling', () => {
    test('should throw error for null input', () => {
      expect(() => parseDiff(null)).toThrow(/Invalid diff content/);
    });

    test('should throw error for undefined input', () => {
      expect(() => parseDiff(undefined)).toThrow(/Invalid diff content/);
    });

    test('should throw error for non-string input', () => {
      expect(() => parseDiff(123)).toThrow(/Invalid diff content/);
      expect(() => parseDiff({})).toThrow(/Invalid diff content/);
      expect(() => parseDiff([])).toThrow(/Invalid diff content/);
    });

    test('should handle malformed hunk headers', () => {
      const diff = `diff --git a/src/test.js b/src/test.js
index 1234567..abcdefg 100644
--- a/src/test.js
+++ b/src/test.js
@@ invalid hunk header @@
+const x = 1;`;

      const result = parseDiff(diff);

      // Should parse file but skip invalid hunk
      expect(result).toHaveLength(1);
      expect(result[0].hunks).toHaveLength(0);
    });

    test('should handle missing file paths', () => {
      const diff = `diff --git
index 1234567..abcdefg 100644
@@ -1 +1,2 @@
+const x = 1;`;

      const result = parseDiff(diff);

      // Should skip sections without valid file paths
      expect(result).toHaveLength(0);
    });

    test('should continue processing after encountering errors', () => {
      const diff = `diff --git a/src/valid.js b/src/valid.js
index 1234567..abcdefg 100644
--- a/src/valid.js
+++ b/src/valid.js
@@ -1 +1,2 @@
+const valid = true;
 console.log(valid);

diff --git
invalid section

diff --git a/src/another.js b/src/another.js
index 1234567..abcdefg 100644
--- a/src/another.js
+++ b/src/another.js
@@ -1 +1,2 @@
+const another = true;
 console.log(another);`;

      const result = parseDiff(diff);

      // Should parse valid sections despite invalid one
      expect(result.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Security - Path Validation', () => {
    describe('isPathSafe', () => {
      test('should accept safe relative paths', () => {
        expect(isPathSafe('src/app.js')).toBe(true);
        expect(isPathSafe('lib/utils/helper.js')).toBe(true);
        expect(isPathSafe('config.json')).toBe(true);
      });

      test('should reject path traversal attempts', () => {
        expect(isPathSafe('../../../etc/passwd')).toBe(false);
        expect(isPathSafe('..\\..\\windows\\system32')).toBe(false);
        expect(isPathSafe('src/../../../etc/passwd')).toBe(false);
      });

      test('should reject system directory paths', () => {
        expect(isPathSafe('/etc/passwd')).toBe(false);
        expect(isPathSafe('/proc/self/environ')).toBe(false);
        expect(isPathSafe('C:\\Windows\\System32\\config')).toBe(false);
      });

      test('should reject paths with null bytes', () => {
        expect(isPathSafe('file.js\0.txt')).toBe(false);
        expect(isPathSafe('src/app\0.js')).toBe(false);
      });

      test('should reject null/undefined paths', () => {
        expect(isPathSafe(null)).toBe(false);
        expect(isPathSafe(undefined)).toBe(false);
        expect(isPathSafe('')).toBe(false);
      });

      test('should reject non-string paths', () => {
        expect(isPathSafe(123)).toBe(false);
        expect(isPathSafe({})).toBe(false);
        expect(isPathSafe([])).toBe(false);
      });
    });

    describe('sanitizePath', () => {
      test('should remove leading/trailing whitespace', () => {
        expect(sanitizePath('  src/app.js  ')).toBe('src/app.js');
        expect(sanitizePath('\tsrc/app.js\n')).toBe('src/app.js');
      });

      test('should normalize path separators', () => {
        expect(sanitizePath('src\\app.js')).toBe('src/app.js');
        expect(sanitizePath('src\\utils\\helper.js')).toBe('src/utils/helper.js');
      });

      test('should remove null bytes', () => {
        expect(sanitizePath('file\0.js')).toBe('file.js');
        expect(sanitizePath('src/app\0.js')).toBe('src/app.js');
      });

      test('should remove leading slashes', () => {
        expect(sanitizePath('/src/app.js')).toBe('src/app.js');
        expect(sanitizePath('//src/app.js')).toBe('src/app.js');
      });

      test('should handle empty/null input', () => {
        expect(sanitizePath('')).toBe('');
        expect(sanitizePath(null)).toBe('');
        expect(sanitizePath(undefined)).toBe('');
      });
    });

    describe('isExtensionAllowed', () => {
      test('should allow common code file extensions', () => {
        expect(isExtensionAllowed('app.js')).toBe(true);
        expect(isExtensionAllowed('component.tsx')).toBe(true);
        expect(isExtensionAllowed('script.py')).toBe(true);
        expect(isExtensionAllowed('Main.java')).toBe(true);
      });

      test('should allow config file extensions', () => {
        expect(isExtensionAllowed('config.json')).toBe(true);
        expect(isExtensionAllowed('docker-compose.yml')).toBe(true);
        expect(isExtensionAllowed('settings.xml')).toBe(true);
      });

      test('should allow files without extension', () => {
        expect(isExtensionAllowed('Dockerfile')).toBe(true);
        expect(isExtensionAllowed('Makefile')).toBe(true);
      });

      test('should block binary file extensions', () => {
        expect(isExtensionAllowed('image.png')).toBe(false);
        expect(isExtensionAllowed('document.pdf')).toBe(false);
        expect(isExtensionAllowed('archive.zip')).toBe(false);
      });

      test('should be case-insensitive', () => {
        expect(isExtensionAllowed('App.JS')).toBe(true);
        expect(isExtensionAllowed('Component.TSX')).toBe(true);
      });
    });

    test('should filter out unsafe paths in parseDiff', () => {
      const diff = `diff --git a/../../../etc/passwd b/../../../etc/passwd
index 1234567..abcdefg 100644
--- a/../../../etc/passwd
+++ b/../../../etc/passwd
@@ -1 +1,2 @@
+root:x:0:0:root:/root:/bin/bash
 console.log('test');`;

      const result = parseDiff(diff);

      // Unsafe paths should be filtered out
      expect(result).toHaveLength(0);
    });

    test('should filter out disallowed extensions in parseDiff', () => {
      const diff = `diff --git a/image.png b/image.png
index 1234567..abcdefg 100644
--- a/image.png
+++ b/image.png
@@ -1 +1,2 @@
+binary content
 more binary`;

      const result = parseDiff(diff);

      // Binary files should be filtered out
      expect(result).toHaveLength(0);
    });
  });

  describe('extractCodeChanges', () => {
    test('should extract code from parsed diff', () => {
      const parsed = parseDiff(fixtures.simpleDiff);
      const result = extractCodeChanges(parsed);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    test('should include file metadata', () => {
      const parsed = parseDiff(fixtures.simpleDiff);
      const result = extractCodeChanges(parsed);

      expect(result[0]).toHaveProperty('file');
      expect(result[0]).toHaveProperty('extension');
      expect(result[0]).toHaveProperty('startLine');
      expect(result[0]).toHaveProperty('code');
      expect(result[0]).toHaveProperty('context');
    });

    test('should extract only additions', () => {
      const diff = `diff --git a/src/test.js b/src/test.js
index 1234567..abcdefg 100644
--- a/src/test.js
+++ b/src/test.js
@@ -1,3 +1,5 @@
 const a = 1;
+const b = 2;
+const c = 3;
-const old = 4;
 console.log(a);`;

      const parsed = parseDiff(diff);
      const result = extractCodeChanges(parsed);

      expect(result[0].code).toContain('const b = 2');
      expect(result[0].code).toContain('const c = 3');
      expect(result[0].code).not.toContain('const old = 4');
    });

    test('should skip deleted files', () => {
      const diff = `diff --git a/src/deleted.js b/src/deleted.js
deleted file mode 100644
index 1234567..0000000
--- a/src/deleted.js
+++ /dev/null
@@ -1,3 +0,0 @@
-const deleted = true;
-console.log(deleted);
-module.exports = deleted;`;

      const parsed = parseDiff(diff);
      const result = extractCodeChanges(parsed);

      expect(result).toHaveLength(0);
    });

    test('should handle multiple files', () => {
      const parsed = parseDiff(fixtures.multiFileDiff);
      const result = extractCodeChanges(parsed);

      expect(result.length).toBeGreaterThan(0);
      const files = [...new Set(result.map((r) => r.file))];
      expect(files.length).toBeGreaterThan(1);
    });

    test('should handle empty parsed diff', () => {
      const result = extractCodeChanges([]);

      expect(result).toHaveLength(0);
      expect(Array.isArray(result)).toBe(true);
    });

    test('should include context lines', () => {
      const diff = `diff --git a/src/test.js b/src/test.js
index 1234567..abcdefg 100644
--- a/src/test.js
+++ b/src/test.js
@@ -1,4 +1,5 @@
 const a = 1;
 const b = 2;
+const c = 3;
 const d = 4;
 console.log(a, b, d);`;

      const parsed = parseDiff(diff);
      const result = extractCodeChanges(parsed);

      expect(result[0].context).toBeTruthy();
      expect(result[0].context.length).toBeGreaterThan(0);
    });

    test('should handle multiple hunks per file', () => {
      const diff = `diff --git a/src/test.js b/src/test.js
index 1234567..abcdefg 100644
--- a/src/test.js
+++ b/src/test.js
@@ -1,2 +1,3 @@
 const a = 1;
+const b = 2;
 console.log(a);
@@ -10,2 +11,3 @@
 function test() {
+  return true;
 }`;

      const parsed = parseDiff(diff);
      const result = extractCodeChanges(parsed);

      expect(result.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('parseDiffFromFile', () => {
    const testDiffPath = path.join(__dirname, '../fixtures/test-diff.txt');

    beforeEach(async () => {
      // Create a test diff file
      await fs.writeFile(testDiffPath, fixtures.simpleDiff, 'utf8');
    });

    afterEach(async () => {
      // Clean up test file
      try {
        await fs.unlink(testDiffPath);
      } catch (error) {
        // Ignore if file doesn't exist
      }
    });

    test('should read and parse diff from file', async () => {
      const result = await parseDiffFromFile(testDiffPath);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    test('should reject unsafe file paths', async () => {
      await expect(parseDiffFromFile('../../../etc/passwd')).rejects.toThrow(/Unsafe diff file path/);
    });

    test('should reject files exceeding maximum size', async () => {
      const largePath = path.join(__dirname, '../fixtures/large-diff.txt');
      const largeContent = 'a'.repeat(CONFIG.MAX_DIFF_SIZE + 1);

      await fs.writeFile(largePath, largeContent, 'utf8');

      await expect(parseDiffFromFile(largePath)).rejects.toThrow(/exceeds maximum allowed/);

      await fs.unlink(largePath);
    });

    test('should handle non-existent files', async () => {
      await expect(parseDiffFromFile('non-existent-file.diff')).rejects.toThrow();
    });

    test('should handle file read errors', async () => {
      const invalidPath = path.join(__dirname, '../fixtures/invalid\0path.txt');

      await expect(parseDiffFromFile(invalidPath)).rejects.toThrow();
    });
  });

  describe('Configuration', () => {
    test('should export CONFIG object', () => {
      expect(CONFIG).toBeDefined();
      expect(typeof CONFIG).toBe('object');
    });

    test('should have size limits defined', () => {
      expect(CONFIG.MAX_FILE_SIZE).toBeDefined();
      expect(CONFIG.MAX_DIFF_SIZE).toBeDefined();
      expect(CONFIG.MAX_FILES).toBeDefined();
      expect(CONFIG.MAX_LINE_LENGTH).toBeDefined();
    });

    test('should have allowed extensions list', () => {
      expect(Array.isArray(CONFIG.ALLOWED_EXTENSIONS)).toBe(true);
      expect(CONFIG.ALLOWED_EXTENSIONS.length).toBeGreaterThan(0);
    });

    test('should have blocked paths list', () => {
      expect(Array.isArray(CONFIG.BLOCKED_PATHS)).toBe(true);
      expect(CONFIG.BLOCKED_PATHS.length).toBeGreaterThan(0);
    });
  });

  describe('Complex Scenarios', () => {
    test('should handle diff with complex nested changes', () => {
      const result = parseDiff(fixtures.complexityIssueDiff);

      expect(result).toHaveLength(1);
      expect(result[0].additions).toBeGreaterThan(10);
      expect(result[0].deletions).toBeGreaterThan(0);
    });

    test('should handle security issue diff', () => {
      const result = parseDiff(fixtures.securityIssueDiff);

      expect(result).toHaveLength(1);
      expect(result[0].path).toBe('src/database.js');

      const codeChanges = extractCodeChanges(result);
      expect(codeChanges[0].code).toContain('userId');
    });

    test('should parse diff with mixed change types', () => {
      const diff = `diff --git a/src/file1.js b/src/file1.js
new file mode 100644
index 0000000..1234567
--- /dev/null
+++ b/src/file1.js
@@ -0,0 +1,2 @@
+const new1 = true;
+module.exports = new1;

diff --git a/src/file2.js b/src/file2.js
deleted file mode 100644
index 1234567..0000000
--- a/src/file2.js
+++ /dev/null
@@ -1,2 +0,0 @@
-const old = true;
-module.exports = old;

diff --git a/src/file3.js b/src/file3.js
index 1234567..abcdefg 100644
--- a/src/file3.js
+++ b/src/file3.js
@@ -1,2 +1,3 @@
 const modified = true;
+const added = true;
 module.exports = modified;`;

      const result = parseDiff(diff);

      expect(result).toHaveLength(3);
      expect(result.find((f) => f.changeType === 'added')).toBeDefined();
      expect(result.find((f) => f.changeType === 'deleted')).toBeDefined();
      expect(result.find((f) => f.changeType === 'modified')).toBeDefined();
    });

    test('should handle diff with no newline at end of file', () => {
      const diff = `diff --git a/src/test.js b/src/test.js
index 1234567..abcdefg 100644
--- a/src/test.js
+++ b/src/test.js
@@ -1 +1,2 @@
 const a = 1;
+const b = 2;
\\ No newline at end of file`;

      const result = parseDiff(diff);

      expect(result).toHaveLength(1);
      expect(result[0].additions).toBeGreaterThan(0);
    });
  });
});

// Made with Bob
