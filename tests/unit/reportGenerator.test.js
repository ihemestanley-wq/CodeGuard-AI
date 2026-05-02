/**
 * Unit Tests - Report Generator
 */

const { generateReport } = require('../../src/agent/reportGenerator');

describe('ReportGenerator', () => {
  describe('generateReport', () => {
    test('should generate report for low risk', () => {
      const riskAssessment = {
        score: 15,
        level: 'LOW',
        criticalFiles: [],
        patterns: [],
      };
      const analysisResults = {
        securityFindings: [],
        complexityIssues: [],
        filesAnalyzed: 1,
        totalLines: 10,
      };

      const report = generateReport(riskAssessment, analysisResults);

      expect(report).toContain('LOW');
      expect(report).toContain('15');
      expect(typeof report).toBe('string');
    });

    test('should generate report for high risk', () => {
      const riskAssessment = {
        score: 85,
        level: 'CRITICAL',
        criticalFiles: ['src/auth.js'],
        patterns: ['Authentication Changes'],
      };
      const analysisResults = {
        securityFindings: [
          { type: 'sql_injection', severity: 'critical', message: 'SQL injection detected' },
        ],
        complexityIssues: [],
        filesAnalyzed: 1,
        totalLines: 20,
      };

      const report = generateReport(riskAssessment, analysisResults);

      expect(report).toContain('CRITICAL');
      expect(report).toContain('85');
      expect(report).toContain('auth.js');
    });

    test('should include security findings in report', () => {
      const riskAssessment = {
        score: 60,
        level: 'HIGH',
        criticalFiles: [],
        patterns: [],
      };
      const analysisResults = {
        securityFindings: [
          { type: 'xss', severity: 'high', message: 'XSS vulnerability', file: 'app.js' },
        ],
        complexityIssues: [],
        filesAnalyzed: 1,
        totalLines: 15,
      };

      const report = generateReport(riskAssessment, analysisResults);

      expect(report).toContain('XSS');
      expect(report).toContain('app.js');
    });

    test('should include complexity issues in report', () => {
      const riskAssessment = {
        score: 45,
        level: 'MEDIUM',
        criticalFiles: [],
        patterns: [],
      };
      const analysisResults = {
        securityFindings: [],
        complexityIssues: [
          { file: 'utils.js', complexity: 25, message: 'High complexity' },
        ],
        filesAnalyzed: 1,
        totalLines: 50,
      };

      const report = generateReport(riskAssessment, analysisResults);

      expect(report).toContain('complexity');
      expect(report).toContain('utils.js');
    });

    test('should include files analyzed count', () => {
      const riskAssessment = {
        score: 20,
        level: 'LOW',
        criticalFiles: [],
        patterns: [],
      };
      const analysisResults = {
        securityFindings: [],
        complexityIssues: [],
        filesAnalyzed: 5,
        totalLines: 100,
      };

      const report = generateReport(riskAssessment, analysisResults);

      expect(report).toContain('5');
    });

    test('should handle empty findings', () => {
      const riskAssessment = {
        score: 10,
        level: 'LOW',
        criticalFiles: [],
        patterns: [],
      };
      const analysisResults = {
        securityFindings: [],
        complexityIssues: [],
        filesAnalyzed: 1,
        totalLines: 5,
      };

      const report = generateReport(riskAssessment, analysisResults);

      expect(report).toBeDefined();
      expect(typeof report).toBe('string');
      expect(report.length).toBeGreaterThan(0);
    });

    test('should include deployment decision', () => {
      const riskAssessment = {
        score: 75,
        level: 'HIGH',
        criticalFiles: [],
        patterns: [],
      };
      const analysisResults = {
        securityFindings: [],
        complexityIssues: [],
        filesAnalyzed: 1,
        totalLines: 10,
      };

      const report = generateReport(riskAssessment, analysisResults);

      expect(report).toMatch(/APPROVE|BLOCK|REQUIRE/i);
    });

    test('should format report with proper structure', () => {
      const riskAssessment = {
        score: 50,
        level: 'MEDIUM',
        criticalFiles: ['src/config.js'],
        patterns: ['Configuration Changes'],
      };
      const analysisResults = {
        securityFindings: [
          { type: 'hardcoded_secret', severity: 'high', message: 'Secret detected' },
        ],
        complexityIssues: [],
        filesAnalyzed: 2,
        totalLines: 30,
      };

      const report = generateReport(riskAssessment, analysisResults);

      expect(report).toContain('Risk');
      expect(report).toContain('50');
      expect(report).toContain('MEDIUM');
    });
  });
});

// Made with Bob
