/**
 * Unit Tests - Diff Parser
 */

const { parseDiff, extractCodeChanges } = require('../../src/agent/diffParser');
const fixtures = require('../fixtures/sample-diffs');

describe('DiffParser', () => {
  describe('parseDiff', () => {
    test('should parse a simple diff correctly', () => {
      const result = parseDiff(fixtures.simpleDiff);
      
      expect(result).toHaveLength(1);
      expect(result[0].file).toBe('src/app.js');
      expect(result[0].additions).toBeGreaterThan(0);
    });

    test('should parse multi-file diff correctly', () => {
      const result = parseDiff(fixtures.multiFileDiff);
      
      expect(result).toHaveLength(2);
      expect(result[0].file).toBe('src/auth.js');
      expect(result[1].file).toBe('src/config.js');
    });

    test('should handle empty diff', () => {
      const result = parseDiff(fixtures.emptyDiff);
      
      expect(result).toHaveLength(0);
    });

    test('should handle invalid diff gracefully', () => {
      const result = parseDiff(fixtures.invalidDiff);
      
      expect(Array.isArray(result)).toBe(true);
    });

    test('should extract file paths correctly', () => {
      const result = parseDiff(fixtures.securityIssueDiff);
      
      expect(result[0].file).toBe('src/database.js');
    });

    test('should count additions and deletions', () => {
      const result = parseDiff(fixtures.simpleDiff);
      
      expect(result[0]).toHaveProperty('additions');
      expect(result[0]).toHaveProperty('deletions');
      expect(typeof result[0].additions).toBe('number');
      expect(typeof result[0].deletions).toBe('number');
    });
  });

  describe('extractCodeChanges', () => {
    test('should extract code from parsed diff', () => {
      const parsed = parseDiff(fixtures.simpleDiff);
      const result = extractCodeChanges(parsed);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    test('should include file extension', () => {
      const parsed = parseDiff(fixtures.simpleDiff);
      const result = extractCodeChanges(parsed);
      
      expect(result[0]).toHaveProperty('extension');
      expect(result[0].extension).toBe('.js');
    });

    test('should extract code content', () => {
      const parsed = parseDiff(fixtures.simpleDiff);
      const result = extractCodeChanges(parsed);
      
      expect(result[0]).toHaveProperty('code');
      expect(typeof result[0].code).toBe('string');
      expect(result[0].code.length).toBeGreaterThan(0);
    });

    test('should handle multiple files', () => {
      const parsed = parseDiff(fixtures.multiFileDiff);
      const result = extractCodeChanges(parsed);
      
      expect(result.length).toBeGreaterThan(1);
    });

    test('should handle empty parsed diff', () => {
      const result = extractCodeChanges([]);
      
      expect(result).toHaveLength(0);
    });
  });
});

// Made with Bob
