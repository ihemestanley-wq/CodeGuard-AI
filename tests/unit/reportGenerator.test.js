/**
 * Unit Tests - Report Generator
 * Comprehensive test coverage for report generation functionality
 */

const {
  generateReport,
  generateJSONReport,
  generateExecutiveSummary,
  generateSecurityFindings,
  generateComplexityAnalysis,
  generateFileCriticality,
  generateChangeMagnitude,
  generateSemanticPatterns,
  generateRecommendations,
  generateTestingRequirements,
  generateMonitoringRequirements,
  generateRollbackPlan,
  generateApprovalRequirements,
} = require('../../src/agent/reportGenerator');

// Mock logger to prevent console output during tests
jest.mock('../../src/observability/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

describe('ReportGenerator', () => {
  // Helper function to create mock risk assessment
  const createMockRiskAssessment = (overrides = {}) => ({
    score: 50,
    level: 'MEDIUM',
    components: {
      security: {
        score: 15,
        total: 2,
        breakdown: {
          critical: 0, high: 1, medium: 1, low: 0,
        },
      },
      complexity: {
        score: 10,
        total: 1,
        breakdown: { high: 1, medium: 0, low: 0 },
      },
      fileCriticality: {
        score: 12,
        criticalFiles: 1,
        breakdown: {
          critical: ['src/auth.js'],
          high: ['src/api.js'],
          medium: ['src/utils.js'],
          low: ['src/helpers.js'],
        },
      },
      changeMagnitude: {
        score: 8,
        level: 'medium',
        totalChanges: 250,
      },
      patterns: {
        score: 5,
        patterns: ['dataValidation'],
        count: 1,
      },
    },
    metadata: {
      filesChanged: 4,
      totalAdditions: 150,
      totalDeletions: 100,
      duration: 123,
    },
    ...overrides,
  });

  // Helper function to create mock analysis results
  const createMockAnalysisResults = (overrides = {}) => ({
    securityFindings: [],
    complexityIssues: [],
    filesAnalyzed: 4,
    totalLines: 250,
    ...overrides,
  });

  describe('generateReport', () => {
    test('should generate complete report for low risk', () => {
      const riskAssessment = createMockRiskAssessment({
        score: 15,
        level: 'LOW',
        components: {
          ...createMockRiskAssessment().components,
          security: {
            score: 0,
            total: 0,
            breakdown: {
              critical: 0, high: 0, medium: 0, low: 0,
            },
          },
        },
      });
      const analysisResults = createMockAnalysisResults();

      const report = generateReport(riskAssessment, analysisResults);

      expect(report).toContain('CODEGUARD AI ANALYSIS REPORT');
      expect(report).toContain('LOW');
      expect(report).toContain('15');
      expect(report).toContain('END OF REPORT');
      expect(typeof report).toBe('string');
      expect(report.length).toBeGreaterThan(100);
    });

    test('should generate complete report for critical risk', () => {
      const riskAssessment = createMockRiskAssessment({
        score: 95,
        level: 'CRITICAL',
        components: {
          ...createMockRiskAssessment().components,
          security: {
            score: 50,
            total: 3,
            breakdown: {
              critical: 2, high: 1, medium: 0, low: 0,
            },
          },
        },
      });
      const analysisResults = createMockAnalysisResults({
        securityFindings: [
          {
            type: 'sql_injection',
            severity: 'critical',
            message: 'SQL injection vulnerability',
            file: 'src/db.js',
            line: 42,
            code: 'query = "SELECT * FROM users WHERE id = " + userId',
          },
        ],
      });

      const report = generateReport(riskAssessment, analysisResults);

      expect(report).toContain('CRITICAL');
      expect(report).toContain('95');
      expect(report).toContain('sql_injection');
      expect(report).toContain('BLOCK deployment');
    });

    test('should handle null/undefined input gracefully', () => {
      const riskAssessment = createMockRiskAssessment();
      const analysisResults = createMockAnalysisResults({
        securityFindings: null,
        complexityIssues: undefined,
      });

      const report = generateReport(riskAssessment, analysisResults);

      expect(report).toBeDefined();
      expect(report).toContain('No security issues detected');
      expect(report).toContain('No complexity issues detected');
    });

    test('should handle empty analysis results', () => {
      const riskAssessment = createMockRiskAssessment({
        score: 10,
        level: 'LOW',
      });
      const analysisResults = createMockAnalysisResults({
        securityFindings: [],
        complexityIssues: [],
      });

      const report = generateReport(riskAssessment, analysisResults);

      expect(report).toBeDefined();
      expect(report).toContain('No security issues detected');
      expect(report).toContain('No complexity issues detected');
    });

    test('should include all report sections', () => {
      const riskAssessment = createMockRiskAssessment();
      const analysisResults = createMockAnalysisResults();

      const report = generateReport(riskAssessment, analysisResults);

      expect(report).toContain('EXECUTIVE SUMMARY');
      expect(report).toContain('SECURITY FINDINGS');
      expect(report).toContain('COMPLEXITY ANALYSIS');
      expect(report).toContain('FILE CRITICALITY ASSESSMENT');
      expect(report).toContain('CHANGE MAGNITUDE');
      expect(report).toContain('SEMANTIC PATTERNS');
      expect(report).toContain('DEPLOYMENT RECOMMENDATIONS');
      expect(report).toContain('TESTING REQUIREMENTS');
      expect(report).toContain('MONITORING REQUIREMENTS');
      expect(report).toContain('ROLLBACK PLAN');
      expect(report).toContain('APPROVAL REQUIREMENTS');
    });
  });

  describe('generateJSONReport', () => {
    test('should generate valid JSON report', () => {
      const riskAssessment = createMockRiskAssessment();
      const analysisResults = createMockAnalysisResults();

      const jsonReport = generateJSONReport(riskAssessment, analysisResults);

      expect(jsonReport).toBeDefined();
      expect(jsonReport).toHaveProperty('timestamp');
      expect(jsonReport).toHaveProperty('riskAssessment');
      expect(jsonReport).toHaveProperty('analysisResults');
      expect(jsonReport).toHaveProperty('version');
      expect(jsonReport.version).toBe('1.0.0');
    });

    test('should include timestamp in ISO format', () => {
      const riskAssessment = createMockRiskAssessment();
      const analysisResults = createMockAnalysisResults();

      const jsonReport = generateJSONReport(riskAssessment, analysisResults);

      expect(jsonReport.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    test('should preserve all risk assessment data', () => {
      const riskAssessment = createMockRiskAssessment();
      const analysisResults = createMockAnalysisResults();

      const jsonReport = generateJSONReport(riskAssessment, analysisResults);

      expect(jsonReport.riskAssessment).toEqual(riskAssessment);
      expect(jsonReport.analysisResults).toEqual(analysisResults);
    });

    test('should be serializable to JSON string', () => {
      const riskAssessment = createMockRiskAssessment();
      const analysisResults = createMockAnalysisResults();

      const jsonReport = generateJSONReport(riskAssessment, analysisResults);
      const jsonString = JSON.stringify(jsonReport);

      expect(() => JSON.parse(jsonString)).not.toThrow();
      expect(JSON.parse(jsonString)).toEqual(jsonReport);
    });
  });

  describe('generateExecutiveSummary', () => {
    test('should include risk level and score', () => {
      const riskAssessment = createMockRiskAssessment({ score: 75, level: 'HIGH' });

      const summary = generateExecutiveSummary(riskAssessment);

      expect(summary).toContain('HIGH');
      expect(summary).toContain('75');
    });

    test('should include file changes metadata', () => {
      const riskAssessment = createMockRiskAssessment({
        metadata: {
          filesChanged: 5, totalAdditions: 200, totalDeletions: 50, duration: 150,
        },
      });

      const summary = generateExecutiveSummary(riskAssessment);

      expect(summary).toContain('5');
      expect(summary).toContain('200');
      expect(summary).toContain('50');
      expect(summary).toContain('150ms');
    });

    test('should include risk breakdown for all components', () => {
      const riskAssessment = createMockRiskAssessment();

      const summary = generateExecutiveSummary(riskAssessment);

      expect(summary).toContain('Security Risk');
      expect(summary).toContain('Complexity Risk');
      expect(summary).toContain('File Criticality');
      expect(summary).toContain('Change Magnitude');
      expect(summary).toContain('Pattern Risk');
    });

    test('should display correct emoji for LOW risk', () => {
      const riskAssessment = createMockRiskAssessment({ level: 'LOW' });

      const summary = generateExecutiveSummary(riskAssessment);

      expect(summary).toContain('✅');
    });

    test('should display correct emoji for MEDIUM risk', () => {
      const riskAssessment = createMockRiskAssessment({ level: 'MEDIUM' });

      const summary = generateExecutiveSummary(riskAssessment);

      expect(summary).toContain('⚡');
    });

    test('should display correct emoji for HIGH risk', () => {
      const riskAssessment = createMockRiskAssessment({ level: 'HIGH' });

      const summary = generateExecutiveSummary(riskAssessment);

      expect(summary).toContain('⚠️');
    });

    test('should display correct emoji for CRITICAL risk', () => {
      const riskAssessment = createMockRiskAssessment({ level: 'CRITICAL' });

      const summary = generateExecutiveSummary(riskAssessment);

      expect(summary).toContain('🚨');
    });
  });

  describe('generateSecurityFindings', () => {
    test('should show no issues when findings are empty', () => {
      const findings = generateSecurityFindings([]);

      expect(findings).toContain('No security issues detected');
      expect(findings).toContain('✅');
    });

    test('should list all security findings with severity counts', () => {
      const securityFindings = [
        {
          type: 'sql_injection', severity: 'critical', message: 'SQL injection', file: 'db.js', line: 10,
        },
        {
          type: 'xss', severity: 'high', message: 'XSS vulnerability', file: 'view.js', line: 20,
        },
        {
          type: 'weak_crypto', severity: 'medium', message: 'Weak encryption', file: 'crypto.js', line: 30,
        },
        {
          type: 'info_leak', severity: 'low', message: 'Information leak', file: 'log.js', line: 40,
        },
      ];

      const findings = generateSecurityFindings(securityFindings);

      expect(findings).toContain('Total Issues: 4');
      expect(findings).toContain('Critical: 1');
      expect(findings).toContain('High: 1');
      expect(findings).toContain('Medium: 1');
      expect(findings).toContain('Low: 1');
    });

    test('should display critical and high severity issues in detail', () => {
      const securityFindings = [
        {
          type: 'sql_injection',
          severity: 'critical',
          message: 'SQL injection detected',
          file: 'src/db.js',
          line: 42,
          code: 'SELECT * FROM users',
        },
        {
          type: 'xss',
          severity: 'high',
          message: 'XSS vulnerability',
          file: 'src/view.js',
          line: 15,
        },
      ];

      const findings = generateSecurityFindings(securityFindings);

      expect(findings).toContain('CRITICAL & HIGH SEVERITY ISSUES');
      expect(findings).toContain('[CRITICAL] sql_injection');
      expect(findings).toContain('src/db.js:42');
      expect(findings).toContain('SQL injection detected');
      expect(findings).toContain('[HIGH] xss');
      expect(findings).toContain('src/view.js:15');
    });

    test('should handle findings without code field', () => {
      const securityFindings = [
        {
          type: 'xss', severity: 'high', message: 'XSS', file: 'app.js', line: 10,
        },
      ];

      const findings = generateSecurityFindings(securityFindings);

      expect(findings).toContain('Code: N/A');
    });

    test('should group findings by severity correctly', () => {
      const securityFindings = [
        {
          type: 'issue1', severity: 'critical', message: 'Critical issue', file: 'a.js', line: 1,
        },
        {
          type: 'issue2', severity: 'critical', message: 'Another critical', file: 'b.js', line: 2,
        },
        {
          type: 'issue3', severity: 'high', message: 'High issue', file: 'c.js', line: 3,
        },
      ];

      const findings = generateSecurityFindings(securityFindings);

      expect(findings).toContain('Critical: 2');
      expect(findings).toContain('High: 1');
    });
  });

  describe('generateComplexityAnalysis', () => {
    test('should show no issues when complexity issues are empty', () => {
      const analysis = generateComplexityAnalysis([]);

      expect(analysis).toContain('No complexity issues detected');
      expect(analysis).toContain('✅');
    });

    test('should list all complexity issues', () => {
      const complexityIssues = [
        {
          file: 'src/utils.js', complexity: 25, threshold: 20, message: 'Function too complex',
        },
        {
          file: 'src/parser.js', complexity: 30, threshold: 20, message: 'High cyclomatic complexity',
        },
      ];

      const analysis = generateComplexityAnalysis(complexityIssues);

      expect(analysis).toContain('High Complexity Functions: 2');
      expect(analysis).toContain('src/utils.js');
      expect(analysis).toContain('Complexity: 25');
      expect(analysis).toContain('threshold: 20');
      expect(analysis).toContain('src/parser.js');
      expect(analysis).toContain('Complexity: 30');
    });

    test('should include complexity messages', () => {
      const complexityIssues = [
        {
          file: 'app.js', complexity: 22, threshold: 20, message: 'Refactor recommended',
        },
      ];

      const analysis = generateComplexityAnalysis(complexityIssues);

      expect(analysis).toContain('Refactor recommended');
    });
  });

  describe('generateFileCriticality', () => {
    test('should list files by criticality level', () => {
      const fileCriticalityRisk = {
        breakdown: {
          critical: ['src/auth.js', 'src/payment.js'],
          high: ['src/api.js'],
          medium: ['src/utils.js'],
          low: ['src/helpers.js'],
        },
      };

      const section = generateFileCriticality(fileCriticalityRisk);

      expect(section).toContain('Critical Files: 2');
      expect(section).toContain('High Priority Files: 1');
      expect(section).toContain('Medium Priority Files: 1');
      expect(section).toContain('Low Priority Files: 1');
    });

    test('should display critical files with emoji', () => {
      const fileCriticalityRisk = {
        breakdown: {
          critical: ['src/auth.js'],
          high: [],
          medium: [],
          low: [],
        },
      };

      const section = generateFileCriticality(fileCriticalityRisk);

      expect(section).toContain('CRITICAL FILES:');
      expect(section).toContain('🚨 src/auth.js');
    });

    test('should display high priority files with emoji', () => {
      const fileCriticalityRisk = {
        breakdown: {
          critical: [],
          high: ['src/api.js'],
          medium: [],
          low: [],
        },
      };

      const section = generateFileCriticality(fileCriticalityRisk);

      expect(section).toContain('HIGH PRIORITY FILES:');
      expect(section).toContain('⚠️  src/api.js');
    });

    test('should handle empty file lists', () => {
      const fileCriticalityRisk = {
        breakdown: {
          critical: [],
          high: [],
          medium: [],
          low: [],
        },
      };

      const section = generateFileCriticality(fileCriticalityRisk);

      expect(section).toContain('Critical Files: 0');
      expect(section).not.toContain('CRITICAL FILES:');
    });
  });

  describe('generateChangeMagnitude', () => {
    test('should display massive change level', () => {
      const changeMagnitude = { level: 'massive', totalChanges: 1500 };

      const section = generateChangeMagnitude(changeMagnitude);

      expect(section).toContain('MASSIVE');
      expect(section).toContain('1500');
      expect(section).toContain('🔥');
      expect(section).toContain('requires thorough review');
    });

    test('should display large change level', () => {
      const changeMagnitude = { level: 'large', totalChanges: 750 };

      const section = generateChangeMagnitude(changeMagnitude);

      expect(section).toContain('LARGE');
      expect(section).toContain('750');
      expect(section).toContain('📊');
      expect(section).toContain('careful review recommended');
    });

    test('should display medium change level', () => {
      const changeMagnitude = { level: 'medium', totalChanges: 250 };

      const section = generateChangeMagnitude(changeMagnitude);

      expect(section).toContain('MEDIUM');
      expect(section).toContain('250');
      expect(section).toContain('📈');
      expect(section).toContain('standard review process');
    });

    test('should display small change level', () => {
      const changeMagnitude = { level: 'small', totalChanges: 50 };

      const section = generateChangeMagnitude(changeMagnitude);

      expect(section).toContain('SMALL');
      expect(section).toContain('50');
      expect(section).toContain('📝');
      expect(section).toContain('low risk');
    });
  });

  describe('generateSemanticPatterns', () => {
    test('should show no patterns when list is empty', () => {
      const patternRisk = { patterns: [], count: 0 };

      const section = generateSemanticPatterns(patternRisk);

      expect(section).toContain('No high-risk patterns detected');
      expect(section).toContain('✅');
    });

    test('should list detected patterns with descriptions', () => {
      const patternRisk = {
        patterns: ['databaseSchema', 'apiContract', 'authentication'],
        count: 3,
      };

      const section = generateSemanticPatterns(patternRisk);

      expect(section).toContain('Detected Patterns: 3');
      expect(section).toContain('🗄️  Database Schema Changes');
      expect(section).toContain('🔌 API Contract Changes');
      expect(section).toContain('🔐 Authentication Changes');
    });

    test('should handle all pattern types', () => {
      const patternRisk = {
        patterns: [
          'databaseSchema',
          'apiContract',
          'authentication',
          'authorization',
          'dataValidation',
          'errorHandling',
          'logging',
        ],
        count: 7,
      };

      const section = generateSemanticPatterns(patternRisk);

      expect(section).toContain('Database Schema Changes');
      expect(section).toContain('API Contract Changes');
      expect(section).toContain('Authentication Changes');
      expect(section).toContain('Authorization Changes');
      expect(section).toContain('Data Validation Changes');
      expect(section).toContain('Error Handling Changes');
      expect(section).toContain('Logging Changes');
    });
  });

  describe('generateRecommendations', () => {
    test('should include critical security recommendations', () => {
      const riskAssessment = createMockRiskAssessment({
        level: 'CRITICAL',
        components: {
          ...createMockRiskAssessment().components,
          security: {
            score: 50,
            total: 2,
            breakdown: {
              critical: 2, high: 0, medium: 0, low: 0,
            },
          },
        },
      });

      const recommendations = generateRecommendations(riskAssessment);

      expect(recommendations).toContain('Address all critical security vulnerabilities');
      expect(recommendations).toContain('BLOCK deployment');
    });

    test('should include high security recommendations', () => {
      const riskAssessment = createMockRiskAssessment({
        components: {
          ...createMockRiskAssessment().components,
          security: {
            score: 30,
            total: 1,
            breakdown: {
              critical: 0, high: 1, medium: 0, low: 0,
            },
          },
        },
      });

      const recommendations = generateRecommendations(riskAssessment);

      expect(recommendations).toContain('Review and fix high-severity security issues');
    });

    test('should include complexity recommendations', () => {
      const riskAssessment = createMockRiskAssessment({
        components: {
          ...createMockRiskAssessment().components,
          complexity: {
            score: 20,
            total: 2,
            breakdown: { high: 2, medium: 0, low: 0 },
          },
        },
      });

      const recommendations = generateRecommendations(riskAssessment);

      expect(recommendations).toContain('Refactor high-complexity functions');
    });

    test('should include file criticality recommendations', () => {
      const riskAssessment = createMockRiskAssessment({
        components: {
          ...createMockRiskAssessment().components,
          fileCriticality: {
            score: 20,
            criticalFiles: 2,
            breakdown: {
              critical: ['auth.js', 'payment.js'], high: [], medium: [], low: [],
            },
          },
        },
      });

      const recommendations = generateRecommendations(riskAssessment);

      expect(recommendations).toContain('Extra scrutiny required for changes to critical files');
      expect(recommendations).toContain('additional code review approvals');
    });

    test('should include change magnitude recommendations', () => {
      const riskAssessment = createMockRiskAssessment({
        components: {
          ...createMockRiskAssessment().components,
          changeMagnitude: { score: 25, level: 'massive', totalChanges: 1500 },
        },
      });

      const recommendations = generateRecommendations(riskAssessment);

      expect(recommendations).toContain('Break down large changes');
      expect(recommendations).toContain('comprehensive test coverage');
    });

    test('should include database schema recommendations', () => {
      const riskAssessment = createMockRiskAssessment({
        components: {
          ...createMockRiskAssessment().components,
          patterns: { score: 15, patterns: ['databaseSchema'], count: 1 },
        },
      });

      const recommendations = generateRecommendations(riskAssessment);

      expect(recommendations).toContain('database migration rollback plan');
      expect(recommendations).toContain('staging environment');
    });

    test('should include API contract recommendations', () => {
      const riskAssessment = createMockRiskAssessment({
        components: {
          ...createMockRiskAssessment().components,
          patterns: { score: 12, patterns: ['apiContract'], count: 1 },
        },
      });

      const recommendations = generateRecommendations(riskAssessment);

      expect(recommendations).toContain('Notify API consumers');
      expect(recommendations).toContain('Update API documentation');
    });

    test('should include authentication/authorization recommendations', () => {
      const riskAssessment = createMockRiskAssessment({
        components: {
          ...createMockRiskAssessment().components,
          patterns: { score: 20, patterns: ['authentication', 'authorization'], count: 2 },
        },
      });

      const recommendations = generateRecommendations(riskAssessment);

      expect(recommendations).toContain('security audit');
      expect(recommendations).toContain('penetration testing');
    });

    test('should provide LOW risk recommendations', () => {
      const riskAssessment = createMockRiskAssessment({
        level: 'LOW',
        score: 15,
      });

      const recommendations = generateRecommendations(riskAssessment);

      expect(recommendations).toContain('Low risk - safe to deploy');
      expect(recommendations).toContain('Standard monitoring sufficient');
    });

    test('should provide MEDIUM risk recommendations', () => {
      const riskAssessment = createMockRiskAssessment({
        level: 'MEDIUM',
        score: 45,
      });

      const recommendations = generateRecommendations(riskAssessment);

      expect(recommendations).toContain('standard deployment process');
      expect(recommendations).toContain('Monitor closely post-deployment');
    });

    test('should provide HIGH risk recommendations', () => {
      const riskAssessment = createMockRiskAssessment({
        level: 'HIGH',
        score: 70,
      });

      const recommendations = generateRecommendations(riskAssessment);

      expect(recommendations).toContain('delaying deployment');
      expect(recommendations).toContain('Increase monitoring');
    });
  });

  describe('generateTestingRequirements', () => {
    test('should include security testing requirements', () => {
      const riskAssessment = createMockRiskAssessment({
        components: {
          ...createMockRiskAssessment().components,
          security: {
            score: 30,
            total: 2,
            breakdown: {
              critical: 1, high: 1, medium: 0, low: 0,
            },
          },
        },
      });

      const requirements = generateTestingRequirements(riskAssessment);

      expect(requirements).toContain('Security testing');
      expect(requirements).toContain('Penetration testing');
    });

    test('should include complexity testing requirements', () => {
      const riskAssessment = createMockRiskAssessment({
        components: {
          ...createMockRiskAssessment().components,
          complexity: { score: 20, total: 2, breakdown: { high: 2, medium: 0, low: 0 } },
        },
      });

      const requirements = generateTestingRequirements(riskAssessment);

      expect(requirements).toContain('Unit tests for complex functions');
      expect(requirements).toContain('Integration tests');
    });

    test('should include database testing requirements', () => {
      const riskAssessment = createMockRiskAssessment({
        components: {
          ...createMockRiskAssessment().components,
          patterns: { score: 15, patterns: ['databaseSchema'], count: 1 },
        },
      });

      const requirements = generateTestingRequirements(riskAssessment);

      expect(requirements).toContain('Database migration testing');
      expect(requirements).toContain('Rollback procedure testing');
    });

    test('should include API testing requirements', () => {
      const riskAssessment = createMockRiskAssessment({
        components: {
          ...createMockRiskAssessment().components,
          patterns: { score: 12, patterns: ['apiContract'], count: 1 },
        },
      });

      const requirements = generateTestingRequirements(riskAssessment);

      expect(requirements).toContain('API contract testing');
      expect(requirements).toContain('Backward compatibility testing');
    });

    test('should include enhanced testing for CRITICAL risk', () => {
      const riskAssessment = createMockRiskAssessment({
        level: 'CRITICAL',
        score: 90,
      });

      const requirements = generateTestingRequirements(riskAssessment);

      expect(requirements).toContain('End-to-end testing required');
      expect(requirements).toContain('Performance testing');
      expect(requirements).toContain('Manual QA review required');
    });

    test('should always include baseline requirements', () => {
      const riskAssessment = createMockRiskAssessment({ level: 'LOW' });

      const requirements = generateTestingRequirements(riskAssessment);

      expect(requirements).toContain('All existing tests must pass');
      expect(requirements).toContain('Code coverage should not decrease');
    });
  });

  describe('generateMonitoringRequirements', () => {
    test('should include baseline monitoring requirements', () => {
      const riskAssessment = createMockRiskAssessment({ level: 'LOW' });

      const requirements = generateMonitoringRequirements(riskAssessment);

      expect(requirements).toContain('Monitor error rates');
      expect(requirements).toContain('Track response time metrics');
      expect(requirements).toContain('Monitor resource utilization');
    });

    test('should include security monitoring for security issues', () => {
      const riskAssessment = createMockRiskAssessment({
        components: {
          ...createMockRiskAssessment().components,
          security: {
            score: 30,
            total: 2,
            breakdown: {
              critical: 1, high: 1, medium: 0, low: 0,
            },
          },
        },
      });

      const requirements = generateMonitoringRequirements(riskAssessment);

      expect(requirements).toContain('Monitor security logs');
      expect(requirements).toContain('alerts for suspicious activity');
    });

    test('should include database monitoring for schema changes', () => {
      const riskAssessment = createMockRiskAssessment({
        components: {
          ...createMockRiskAssessment().components,
          patterns: { score: 15, patterns: ['databaseSchema'], count: 1 },
        },
      });

      const requirements = generateMonitoringRequirements(riskAssessment);

      expect(requirements).toContain('Monitor database performance');
      expect(requirements).toContain('Track query execution times');
    });

    test('should include API monitoring for contract changes', () => {
      const riskAssessment = createMockRiskAssessment({
        components: {
          ...createMockRiskAssessment().components,
          patterns: { score: 12, patterns: ['apiContract'], count: 1 },
        },
      });

      const requirements = generateMonitoringRequirements(riskAssessment);

      expect(requirements).toContain('Monitor API error rates');
      expect(requirements).toContain('Track API usage patterns');
    });

    test('should include enhanced monitoring for CRITICAL risk', () => {
      const riskAssessment = createMockRiskAssessment({
        level: 'CRITICAL',
        score: 90,
      });

      const requirements = generateMonitoringRequirements(riskAssessment);

      expect(requirements).toContain('Continuous monitoring for first 24 hours');
      expect(requirements).toContain('On-call engineer assigned');
      expect(requirements).toContain('Enhanced alerting enabled');
    });
  });

  describe('generateRollbackPlan', () => {
    test('should generate detailed rollback plan for CRITICAL risk', () => {
      const riskAssessment = createMockRiskAssessment({
        level: 'CRITICAL',
        score: 90,
      });

      const plan = generateRollbackPlan(riskAssessment);

      expect(plan).toContain('HIGH RISK DEPLOYMENT');
      expect(plan).toContain('ROLLBACK TRIGGERS');
      expect(plan).toContain('Error rate increases by >10%');
      expect(plan).toContain('ROLLBACK PROCEDURE');
      expect(plan).toContain('Revert to previous deployment');
    });

    test('should generate standard rollback plan for LOW risk', () => {
      const riskAssessment = createMockRiskAssessment({
        level: 'LOW',
        score: 15,
      });

      const plan = generateRollbackPlan(riskAssessment);

      expect(plan).toContain('Standard rollback procedures apply');
      expect(plan).toContain('Critical bugs detected');
    });

    test('should include database rollback for schema changes', () => {
      const riskAssessment = createMockRiskAssessment({
        components: {
          ...createMockRiskAssessment().components,
          patterns: { score: 15, patterns: ['databaseSchema'], count: 1 },
        },
      });

      const plan = generateRollbackPlan(riskAssessment);

      expect(plan).toContain('DATABASE ROLLBACK');
      expect(plan).toContain('rollback migration scripts');
      expect(plan).toContain('Backup database before deployment');
    });

    test('should include detailed triggers for HIGH risk', () => {
      const riskAssessment = createMockRiskAssessment({
        level: 'HIGH',
        score: 70,
      });

      const plan = generateRollbackPlan(riskAssessment);

      expect(plan).toContain('Security incidents detected');
      expect(plan).toContain('Critical functionality broken');
    });
  });

  describe('generateApprovalRequirements', () => {
    test('should require enhanced approval for CRITICAL risk', () => {
      const riskAssessment = createMockRiskAssessment({
        level: 'CRITICAL',
        score: 90,
      });

      const requirements = generateApprovalRequirements(riskAssessment);

      expect(requirements).toContain('CRITICAL RISK - Enhanced approval required');
      expect(requirements).toContain('Senior Engineer Review');
      expect(requirements).toContain('Security Team Review');
      expect(requirements).toContain('Architecture Team Review');
      expect(requirements).toContain('CTO/VP Engineering Sign-off');
    });

    test('should require additional approval for HIGH risk', () => {
      const riskAssessment = createMockRiskAssessment({
        level: 'HIGH',
        score: 70,
      });

      const requirements = generateApprovalRequirements(riskAssessment);

      expect(requirements).toContain('HIGH RISK - Additional approval required');
      expect(requirements).toContain('Senior Engineer Review');
      expect(requirements).toContain('Team Lead Approval');
    });

    test('should require standard approval for MEDIUM risk', () => {
      const riskAssessment = createMockRiskAssessment({
        level: 'MEDIUM',
        score: 45,
      });

      const requirements = generateApprovalRequirements(riskAssessment);

      expect(requirements).toContain('MEDIUM RISK - Standard approval required');
      expect(requirements).toContain('Peer Code Review (2 approvals)');
      expect(requirements).toContain('Team Lead Approval');
    });

    test('should require minimal approval for LOW risk', () => {
      const riskAssessment = createMockRiskAssessment({
        level: 'LOW',
        score: 15,
      });

      const requirements = generateApprovalRequirements(riskAssessment);

      expect(requirements).toContain('LOW RISK - Standard process');
      expect(requirements).toContain('Peer Code Review (1 approval)');
    });

    test('should include security review for security issues', () => {
      const riskAssessment = createMockRiskAssessment({
        level: 'HIGH',
        components: {
          ...createMockRiskAssessment().components,
          security: {
            score: 30,
            total: 2,
            breakdown: {
              critical: 1, high: 1, medium: 0, low: 0,
            },
          },
        },
      });

      const requirements = generateApprovalRequirements(riskAssessment);

      expect(requirements).toContain('Security Team Review');
    });

    test('should include database review for schema changes', () => {
      const riskAssessment = createMockRiskAssessment({
        level: 'HIGH',
        components: {
          ...createMockRiskAssessment().components,
          patterns: { score: 15, patterns: ['databaseSchema'], count: 1 },
        },
      });

      const requirements = generateApprovalRequirements(riskAssessment);

      expect(requirements).toContain('Database Team Review');
    });
  });

  describe('Edge Cases', () => {
    test('should handle very large reports', () => {
      const securityFindings = Array.from({ length: 50 }, (_, i) => ({
        type: `issue_${i}`,
        severity: i % 4 === 0 ? 'critical' : i % 3 === 0 ? 'high' : i % 2 === 0 ? 'medium' : 'low',
        message: `Security issue ${i}`,
        file: `file_${i}.js`,
        line: i * 10,
      }));

      const riskAssessment = createMockRiskAssessment({
        score: 85,
        level: 'CRITICAL',
      });
      const analysisResults = createMockAnalysisResults({ securityFindings });

      const report = generateReport(riskAssessment, analysisResults);

      expect(report).toBeDefined();
      expect(report.length).toBeGreaterThan(1000);
      expect(report).toContain('Total Issues: 50');
    });

    test('should handle special characters in content', () => {
      const securityFindings = [
        {
          type: 'xss',
          severity: 'high',
          message: 'XSS: <script>alert("test")</script>',
          file: 'src/view.js',
          line: 10,
          code: 'const html = "<div>" + userInput + "</div>";',
        },
      ];

      const riskAssessment = createMockRiskAssessment();
      const analysisResults = createMockAnalysisResults({ securityFindings });

      const report = generateReport(riskAssessment, analysisResults);

      expect(report).toContain('<script>');
      expect(report).toContain('alert("test")');
    });

    test('should handle missing optional fields in security findings', () => {
      const securityFindings = [
        {
          type: 'vulnerability',
          severity: 'high',
          message: 'Security issue',
          file: 'app.js',
          line: 5,
          // code field is missing
        },
      ];

      const riskAssessment = createMockRiskAssessment();
      const analysisResults = createMockAnalysisResults({ securityFindings });

      const report = generateReport(riskAssessment, analysisResults);

      expect(report).toContain('Code: N/A');
    });

    test('should handle multiple files with mixed risk levels', () => {
      const riskAssessment = createMockRiskAssessment({
        components: {
          ...createMockRiskAssessment().components,
          fileCriticality: {
            score: 30,
            criticalFiles: 3,
            breakdown: {
              critical: ['auth.js', 'payment.js', 'crypto.js'],
              high: ['api.js', 'routes.js'],
              medium: ['utils.js', 'helpers.js', 'validators.js'],
              low: ['tests.js', 'docs.js'],
            },
          },
        },
      });

      const analysisResults = createMockAnalysisResults();
      const report = generateReport(riskAssessment, analysisResults);

      expect(report).toContain('Critical Files: 3');
      expect(report).toContain('High Priority Files: 2');
      expect(report).toContain('Medium Priority Files: 3');
      expect(report).toContain('Low Priority Files: 2');
    });

    test('should handle all pattern types simultaneously', () => {
      const riskAssessment = createMockRiskAssessment({
        components: {
          ...createMockRiskAssessment().components,
          patterns: {
            score: 88,
            patterns: [
              'databaseSchema',
              'apiContract',
              'authentication',
              'authorization',
              'dataValidation',
              'errorHandling',
              'logging',
            ],
            count: 7,
          },
        },
      });

      const analysisResults = createMockAnalysisResults();
      const report = generateReport(riskAssessment, analysisResults);

      expect(report).toContain('Detected Patterns: 7');
      expect(report).toContain('Database Schema Changes');
      expect(report).toContain('API Contract Changes');
      expect(report).toContain('Authentication Changes');
    });

    test('should handle zero values in metadata', () => {
      const riskAssessment = createMockRiskAssessment({
        metadata: {
          filesChanged: 0,
          totalAdditions: 0,
          totalDeletions: 0,
          duration: 0,
        },
      });

      const analysisResults = createMockAnalysisResults();
      const report = generateReport(riskAssessment, analysisResults);

      expect(report).toContain('Files Changed: 0');
      expect(report).toContain('Lines Added: 0');
      expect(report).toContain('Lines Deleted: 0');
    });
  });
});

// Made with Bob
