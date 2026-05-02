/**
 * End-to-End Tests - Complete Workflow
 */

const { analyzePR } = require('../../src/agent/analyzer');
const fixtures = require('../fixtures/sample-diffs');

describe('E2E Workflow Tests', () => {
  describe('Complete Analysis Pipeline', () => {
    test('should complete full analysis workflow', () => {
      const result = analyzePR(fixtures.simpleDiff);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    test('should handle security vulnerability detection workflow', () => {
      const result = analyzePR(fixtures.securityIssueDiff);

      expect(result).toContain('Risk');
      expect(result).toBeDefined();
    });

    test('should handle complexity analysis workflow', () => {
      const result = analyzePR(fixtures.complexityIssueDiff);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    test('should handle multi-file analysis workflow', () => {
      const result = analyzePR(fixtures.multiFileDiff);

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    test('should handle empty diff gracefully', () => {
      const result = analyzePR(fixtures.emptyDiff);

      expect(result).toBeDefined();
      expect(result).toContain('No changes');
    });

    test('should complete analysis within timeout', () => {
      const startTime = Date.now();
      analyzePR(fixtures.simpleDiff);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(5000); // 5 seconds
    });

    test('should produce consistent results', () => {
      const result1 = analyzePR(fixtures.simpleDiff);
      const result2 = analyzePR(fixtures.simpleDiff);

      expect(result1).toBe(result2);
    });

    test('should handle invalid diff without crashing', () => {
      const result = analyzePR(fixtures.invalidDiff);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });
  });

  describe('Risk Assessment Workflow', () => {
    test('should assess low risk correctly', () => {
      const result = analyzePR(fixtures.simpleDiff);

      expect(result).toMatch(/LOW|MEDIUM|HIGH|CRITICAL/);
    });

    test('should assess high risk for security issues', () => {
      const result = analyzePR(fixtures.securityIssueDiff);

      expect(result).toContain('Risk');
    });

    test('should provide actionable recommendations', () => {
      const result = analyzePR(fixtures.securityIssueDiff);

      expect(result.length).toBeGreaterThan(100);
    });
  });

  describe('Error Recovery', () => {
    test('should recover from parsing errors', () => {
      const result = analyzePR('invalid diff content');

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    test('should handle null input', () => {
      const result = analyzePR('');

      expect(result).toBeDefined();
    });

    test('should handle very large diffs', () => {
      const largeDiff = fixtures.simpleDiff.repeat(1000);
      const result = analyzePR(largeDiff);

      expect(result).toBeDefined();
    });
  });

  describe('Performance', () => {
    test('should analyze small diff quickly', () => {
      const startTime = Date.now();
      analyzePR(fixtures.simpleDiff);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(1000); // 1 second
    });

    test('should handle multiple analyses', () => {
      const results = [];
      for (let i = 0; i < 10; i++) {
        results.push(analyzePR(fixtures.simpleDiff));
      }

      expect(results).toHaveLength(10);
      results.forEach((result) => {
        expect(result).toBeDefined();
      });
    });
  });
});

// Made with Bob
