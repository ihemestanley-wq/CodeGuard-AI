/**
 * Unit Tests - Risk Engine
 */

const { calculateRiskScore } = require('../../src/agent/riskEngine');

describe('RiskEngine', () => {
  describe('calculateRiskScore', () => {
    test('should return low risk for safe changes', () => {
      const analysisResults = {
        securityFindings: [],
        complexityIssues: [],
        filesAnalyzed: 1,
        totalLines: 10,
      };
      const parsedDiff = [{ file: 'src/utils.js', additions: 5, deletions: 2 }];
      const codeChanges = [{ file: 'src/utils.js', code: 'const x = 1;', extension: '.js' }];

      const result = calculateRiskScore(analysisResults, parsedDiff, codeChanges);

      expect(result.score).toBeLessThan(30);
      expect(result.level).toBe('LOW');
    });

    test('should return high risk for security issues', () => {
      const analysisResults = {
        securityFindings: [
          { type: 'sql_injection', severity: 'critical' },
          { type: 'xss', severity: 'high' },
        ],
        complexityIssues: [],
        filesAnalyzed: 1,
        totalLines: 20,
      };
      const parsedDiff = [{ file: 'src/database.js', additions: 10, deletions: 5 }];
      const codeChanges = [{ file: 'src/database.js', code: 'SELECT * FROM users', extension: '.js' }];

      const result = calculateRiskScore(analysisResults, parsedDiff, codeChanges);

      expect(result.score).toBeGreaterThan(60);
      expect(result.level).toMatch(/HIGH|CRITICAL/);
    });

    test('should increase risk for critical files', () => {
      const analysisResults = {
        securityFindings: [],
        complexityIssues: [],
        filesAnalyzed: 1,
        totalLines: 10,
      };
      const parsedDiff = [{ file: 'src/auth.js', additions: 5, deletions: 2 }];
      const codeChanges = [{ file: 'src/auth.js', code: 'function login() {}', extension: '.js' }];

      const result = calculateRiskScore(analysisResults, parsedDiff, codeChanges);

      expect(result.criticalFiles).toContain('src/auth.js');
      expect(result.score).toBeGreaterThan(0);
    });

    test('should increase risk for high complexity', () => {
      const analysisResults = {
        securityFindings: [],
        complexityIssues: [
          { file: 'src/utils.js', complexity: 25, threshold: 10 },
        ],
        filesAnalyzed: 1,
        totalLines: 50,
      };
      const parsedDiff = [{ file: 'src/utils.js', additions: 30, deletions: 10 }];
      const codeChanges = [{ file: 'src/utils.js', code: 'if (a) { if (b) {} }', extension: '.js' }];

      const result = calculateRiskScore(analysisResults, parsedDiff, codeChanges);

      expect(result.score).toBeGreaterThan(30);
    });

    test('should return score between 0 and 100', () => {
      const analysisResults = {
        securityFindings: Array(10).fill({ type: 'test', severity: 'critical' }),
        complexityIssues: Array(10).fill({ complexity: 50 }),
        filesAnalyzed: 5,
        totalLines: 1000,
      };
      const parsedDiff = [{ file: 'src/test.js', additions: 500, deletions: 300 }];
      const codeChanges = [{ file: 'src/test.js', code: 'test', extension: '.js' }];

      const result = calculateRiskScore(analysisResults, parsedDiff, codeChanges);

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    test('should include risk level in result', () => {
      const analysisResults = {
        securityFindings: [],
        complexityIssues: [],
        filesAnalyzed: 1,
        totalLines: 5,
      };
      const parsedDiff = [{ file: 'src/test.js', additions: 2, deletions: 1 }];
      const codeChanges = [{ file: 'src/test.js', code: 'const x = 1;', extension: '.js' }];

      const result = calculateRiskScore(analysisResults, parsedDiff, codeChanges);

      expect(result).toHaveProperty('level');
      expect(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).toContain(result.level);
    });

    test('should handle empty analysis results', () => {
      const analysisResults = {
        securityFindings: [],
        complexityIssues: [],
        filesAnalyzed: 0,
        totalLines: 0,
      };
      const parsedDiff = [];
      const codeChanges = [];

      const result = calculateRiskScore(analysisResults, parsedDiff, codeChanges);

      expect(result.score).toBeDefined();
      expect(result.level).toBeDefined();
    });

    test('should detect authentication changes', () => {
      const analysisResults = {
        securityFindings: [],
        complexityIssues: [],
        filesAnalyzed: 1,
        totalLines: 10,
      };
      const parsedDiff = [{ file: 'src/auth.js', additions: 5, deletions: 2 }];
      const codeChanges = [{ file: 'src/auth.js', code: 'function authenticate() {}', extension: '.js' }];

      const result = calculateRiskScore(analysisResults, parsedDiff, codeChanges);

      expect(result.patterns).toBeDefined();
    });

    test('should weight critical severity higher', () => {
      const criticalResults = {
        securityFindings: [{ type: 'sql_injection', severity: 'critical' }],
        complexityIssues: [],
        filesAnalyzed: 1,
        totalLines: 10,
      };
      const lowResults = {
        securityFindings: [{ type: 'minor', severity: 'low' }],
        complexityIssues: [],
        filesAnalyzed: 1,
        totalLines: 10,
      };
      const parsedDiff = [{ file: 'src/test.js', additions: 5, deletions: 2 }];
      const codeChanges = [{ file: 'src/test.js', code: 'test', extension: '.js' }];

      const criticalScore = calculateRiskScore(criticalResults, parsedDiff, codeChanges);
      const lowScore = calculateRiskScore(lowResults, parsedDiff, codeChanges);

      expect(criticalScore.score).toBeGreaterThan(lowScore.score);
    });
  });
});

// Made with Bob
