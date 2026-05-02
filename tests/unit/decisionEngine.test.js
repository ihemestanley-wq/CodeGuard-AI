/**
 * CodeGuard AI - Decision Engine Tests
 * Comprehensive test coverage for deployment decision logic
 */

const {
  makeDeploymentDecision,
  formatDecision,
  checkSecurityBlock,
  checkCriticalFilesBlock,
  checkPatternBlock,
  determineRequiredApprovers,
  generateDeploymentConditions,
  calculateDeploymentConfidence,
  DECISIONS,
  THRESHOLDS,
  BLOCKING_SECURITY_TYPES,
} = require('../../src/pipeline/decisionEngine');

// Mock logger
jest.mock('../../src/observability/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

describe('Decision Engine', () => {
  describe('Constants', () => {
    test('should export DECISIONS constants', () => {
      expect(DECISIONS).toEqual({
        BLOCK: 'BLOCK',
        REQUIRE_APPROVAL: 'REQUIRE_APPROVAL',
        AUTO_APPROVE: 'AUTO_APPROVE',
      });
    });

    test('should export THRESHOLDS constants', () => {
      expect(THRESHOLDS).toEqual({
        BLOCK: 80,
        REQUIRE_APPROVAL: 40,
        AUTO_APPROVE: 40,
      });
    });

    test('should export BLOCKING_SECURITY_TYPES', () => {
      expect(BLOCKING_SECURITY_TYPES).toEqual([
        'sql_injection',
        'command_injection',
        'hardcoded_secret',
      ]);
    });
  });

  describe('checkSecurityBlock', () => {
    test('should block on critical security findings', () => {
      const findings = [
        {
          severity: 'critical',
          type: 'sql_injection',
          file: 'db.js',
          line: 10,
          message: 'SQL injection vulnerability',
        },
      ];

      const result = checkSecurityBlock(findings);

      expect(result.shouldBlock).toBe(true);
      expect(result.reason).toBe('Critical security vulnerabilities detected');
      expect(result.findings.length).toBeGreaterThanOrEqual(1);
    });

    test('should block on blocking security types', () => {
      const findings = [
        {
          severity: 'high',
          type: 'sql_injection',
          file: 'db.js',
          line: 10,
          message: 'SQL injection vulnerability',
        },
      ];

      const result = checkSecurityBlock(findings);

      expect(result.shouldBlock).toBe(true);
      expect(result.findings).toHaveLength(1);
    });

    test('should block on command injection', () => {
      const findings = [
        {
          severity: 'medium',
          type: 'command_injection',
          file: 'exec.js',
          line: 5,
          message: 'Command injection risk',
        },
      ];

      const result = checkSecurityBlock(findings);

      expect(result.shouldBlock).toBe(true);
    });

    test('should block on hardcoded secrets', () => {
      const findings = [
        {
          severity: 'high',
          type: 'hardcoded_secret',
          file: 'config.js',
          line: 3,
          message: 'Hardcoded API key detected',
        },
      ];

      const result = checkSecurityBlock(findings);

      expect(result.shouldBlock).toBe(true);
    });

    test('should not block on non-critical findings', () => {
      const findings = [
        {
          severity: 'low',
          type: 'xss',
          file: 'view.js',
          line: 20,
          message: 'Potential XSS',
        },
      ];

      const result = checkSecurityBlock(findings);

      expect(result.shouldBlock).toBe(false);
    });

    test('should handle empty findings array', () => {
      const result = checkSecurityBlock([]);

      expect(result.shouldBlock).toBe(false);
    });

    test('should combine critical and blocking findings', () => {
      const findings = [
        {
          severity: 'critical',
          type: 'xss',
          file: 'view.js',
          line: 1,
          message: 'Critical XSS',
        },
        {
          severity: 'high',
          type: 'sql_injection',
          file: 'db.js',
          line: 2,
          message: 'SQL injection',
        },
      ];

      const result = checkSecurityBlock(findings);

      expect(result.shouldBlock).toBe(true);
      expect(result.findings).toHaveLength(2);
    });
  });

  describe('checkCriticalFilesBlock', () => {
    test('should require approval for critical files with elevated risk', () => {
      const fileCriticalityRisk = {
        breakdown: {
          critical: ['auth.js', 'payment.js'],
          high: [],
          medium: [],
          low: [],
        },
      };

      const result = checkCriticalFilesBlock(fileCriticalityRisk, 50);

      expect(result.shouldBlock).toBe(false);
      expect(result.requiresApproval).toBe(true);
      expect(result.reason).toBe('Critical files modified with elevated risk');
      expect(result.files).toEqual(['auth.js', 'payment.js']);
    });

    test('should not require approval for critical files with low risk', () => {
      const fileCriticalityRisk = {
        breakdown: {
          critical: ['auth.js'],
          high: [],
          medium: [],
          low: [],
        },
      };

      const result = checkCriticalFilesBlock(fileCriticalityRisk, 30);

      expect(result.shouldBlock).toBe(false);
      expect(result.requiresApproval).toBe(false);
    });

    test('should not require approval when no critical files', () => {
      const fileCriticalityRisk = {
        breakdown: {
          critical: [],
          high: ['utils.js'],
          medium: [],
          low: [],
        },
      };

      const result = checkCriticalFilesBlock(fileCriticalityRisk, 60);

      expect(result.shouldBlock).toBe(false);
      expect(result.requiresApproval).toBe(false);
    });
  });

  describe('checkPatternBlock', () => {
    test('should require approval for database schema changes', () => {
      const patternRisk = {
        patterns: ['databaseSchema', 'apiContract'],
      };

      const result = checkPatternBlock(patternRisk, 50);

      expect(result.shouldBlock).toBe(false);
      expect(result.requiresApproval).toBe(true);
      expect(result.reason).toBe('Critical patterns detected requiring review');
      expect(result.patterns).toContain('databaseSchema');
    });

    test('should require approval for authentication changes', () => {
      const patternRisk = {
        patterns: ['authentication', 'logging'],
      };

      const result = checkPatternBlock(patternRisk, 45);

      expect(result.requiresApproval).toBe(true);
      expect(result.patterns).toContain('authentication');
    });

    test('should require approval for authorization changes', () => {
      const patternRisk = {
        patterns: ['authorization'],
      };

      const result = checkPatternBlock(patternRisk, 50);

      expect(result.requiresApproval).toBe(true);
      expect(result.patterns).toContain('authorization');
    });

    test('should not require approval for non-critical patterns', () => {
      const patternRisk = {
        patterns: ['logging', 'errorHandling'],
      };

      const result = checkPatternBlock(patternRisk, 50);

      expect(result.requiresApproval).toBe(false);
    });

    test('should not require approval for critical patterns with low risk', () => {
      const patternRisk = {
        patterns: ['databaseSchema'],
      };

      const result = checkPatternBlock(patternRisk, 30);

      expect(result.requiresApproval).toBe(false);
    });
  });

  describe('determineRequiredApprovers', () => {
    test('should require CTO for CRITICAL risk', () => {
      const riskAssessment = {
        level: 'CRITICAL',
        components: {
          security: { total: 5 },
          patterns: { patterns: [] },
        },
      };

      const approvers = determineRequiredApprovers(riskAssessment, {});

      expect(approvers).toContain('cto');
      expect(approvers).toContain('senior-engineer');
      expect(approvers).toContain('security-team');
      expect(approvers).toContain('architecture-team');
    });

    test('should require senior engineer for HIGH risk', () => {
      const riskAssessment = {
        level: 'HIGH',
        components: {
          security: { total: 2 },
          patterns: { patterns: [] },
        },
      };

      const approvers = determineRequiredApprovers(riskAssessment, {});

      expect(approvers).toContain('senior-engineer');
      expect(approvers).toContain('team-lead');
      expect(approvers).toContain('security-team');
      expect(approvers).not.toContain('cto');
    });

    test('should require database team for schema changes', () => {
      const riskAssessment = {
        level: 'HIGH',
        components: {
          security: { total: 0 },
          patterns: { patterns: ['databaseSchema'] },
        },
      };

      const approvers = determineRequiredApprovers(riskAssessment, {});

      expect(approvers).toContain('database-team');
    });

    test('should require team lead for MEDIUM risk', () => {
      const riskAssessment = {
        level: 'MEDIUM',
        components: {
          security: { total: 0 },
          patterns: { patterns: [] },
        },
      };

      const approvers = determineRequiredApprovers(riskAssessment, {});

      expect(approvers).toContain('team-lead');
      expect(approvers).toContain('peer-review');
      expect(approvers).not.toContain('senior-engineer');
    });

    test('should always require peer review', () => {
      const riskAssessment = {
        level: 'LOW',
        components: {
          security: { total: 0 },
          patterns: { patterns: [] },
        },
      };

      const approvers = determineRequiredApprovers(riskAssessment, {});

      expect(approvers).toContain('peer-review');
    });

    test('should remove duplicate approvers', () => {
      const riskAssessment = {
        level: 'HIGH',
        components: {
          security: { total: 3 },
          patterns: { patterns: ['databaseSchema'] },
        },
      };

      const approvers = determineRequiredApprovers(riskAssessment, {});

      const uniqueApprovers = [...new Set(approvers)];
      expect(approvers.length).toBe(uniqueApprovers.length);
    });
  });

  describe('generateDeploymentConditions', () => {
    test('should always require tests to pass', () => {
      const riskAssessment = {
        level: 'LOW',
        components: {
          security: { breakdown: { critical: 0, high: 0 } },
          complexity: { breakdown: { high: 0 } },
          patterns: { patterns: [] },
          changeMagnitude: { level: 'small' },
        },
      };

      const conditions = generateDeploymentConditions(riskAssessment, {});

      expect(conditions).toContain('All tests must pass');
    });

    test('should require security audit for CRITICAL risk', () => {
      const riskAssessment = {
        level: 'CRITICAL',
        components: {
          security: { breakdown: { critical: 0, high: 0 } },
          complexity: { breakdown: { high: 0 } },
          patterns: { patterns: [] },
          changeMagnitude: { level: 'small' },
        },
      };

      const conditions = generateDeploymentConditions(riskAssessment, {});

      expect(conditions).toContain('Security audit completed');
      expect(conditions).toContain('Manual QA testing completed');
      expect(conditions).toContain('Rollback plan documented');
      expect(conditions).toContain('Monitoring alerts configured');
    });

    test('should require critical security issues resolved', () => {
      const riskAssessment = {
        level: 'MEDIUM',
        components: {
          security: { breakdown: { critical: 2, high: 0 } },
          complexity: { breakdown: { high: 0 } },
          patterns: { patterns: [] },
          changeMagnitude: { level: 'small' },
        },
      };

      const conditions = generateDeploymentConditions(riskAssessment, {});

      expect(conditions).toContain('All critical security issues resolved');
    });

    test('should require high-severity security issues addressed', () => {
      const riskAssessment = {
        level: 'MEDIUM',
        components: {
          security: { breakdown: { critical: 0, high: 3 } },
          complexity: { breakdown: { high: 0 } },
          patterns: { patterns: [] },
          changeMagnitude: { level: 'small' },
        },
      };

      const conditions = generateDeploymentConditions(riskAssessment, {});

      expect(conditions).toContain('All high-severity security issues addressed');
    });

    test('should require database migration testing', () => {
      const riskAssessment = {
        level: 'MEDIUM',
        components: {
          security: { breakdown: { critical: 0, high: 0 } },
          complexity: { breakdown: { high: 0 } },
          patterns: { patterns: ['databaseSchema'] },
          changeMagnitude: { level: 'small' },
        },
      };

      const conditions = generateDeploymentConditions(riskAssessment, {});

      expect(conditions).toContain('Database migration tested in staging');
      expect(conditions).toContain('Rollback migration prepared');
    });

    test('should require API documentation for API changes', () => {
      const riskAssessment = {
        level: 'MEDIUM',
        components: {
          security: { breakdown: { critical: 0, high: 0 } },
          complexity: { breakdown: { high: 0 } },
          patterns: { patterns: ['apiContract'] },
          changeMagnitude: { level: 'small' },
        },
      };

      const conditions = generateDeploymentConditions(riskAssessment, {});

      expect(conditions).toContain('API documentation updated');
      expect(conditions).toContain('API consumers notified');
    });

    test('should require breaking down massive changes', () => {
      const riskAssessment = {
        level: 'MEDIUM',
        components: {
          security: { breakdown: { critical: 0, high: 0 } },
          complexity: { breakdown: { high: 0 } },
          patterns: { patterns: [] },
          changeMagnitude: { level: 'massive' },
        },
      };

      const conditions = generateDeploymentConditions(riskAssessment, {});

      expect(conditions).toContain('Changes broken down into smaller deployments');
    });
  });

  describe('calculateDeploymentConfidence', () => {
    test('should calculate confidence as inverse of risk score', () => {
      const riskAssessment = {
        score: 30,
        components: {
          security: { breakdown: { critical: 0, high: 0 } },
          complexity: { breakdown: { high: 0 } },
          changeMagnitude: { level: 'small' },
        },
      };

      const confidence = calculateDeploymentConfidence(riskAssessment, {});

      expect(confidence).toBe(70);
    });

    test('should reduce confidence for critical security issues', () => {
      const riskAssessment = {
        score: 50,
        components: {
          security: { breakdown: { critical: 2, high: 0 } },
          complexity: { breakdown: { high: 0 } },
          changeMagnitude: { level: 'small' },
        },
      };

      const confidence = calculateDeploymentConfidence(riskAssessment, {});

      expect(confidence).toBe(30); // 100 - 50 - 20
    });

    test('should reduce confidence for high security issues', () => {
      const riskAssessment = {
        score: 40,
        components: {
          security: { breakdown: { critical: 0, high: 3 } },
          complexity: { breakdown: { high: 0 } },
          changeMagnitude: { level: 'small' },
        },
      };

      const confidence = calculateDeploymentConfidence(riskAssessment, {});

      expect(confidence).toBe(50); // 100 - 40 - 10
    });

    test('should reduce confidence for high complexity', () => {
      const riskAssessment = {
        score: 30,
        components: {
          security: { breakdown: { critical: 0, high: 0 } },
          complexity: { breakdown: { high: 2 } },
          changeMagnitude: { level: 'small' },
        },
      };

      const confidence = calculateDeploymentConfidence(riskAssessment, {});

      expect(confidence).toBe(65); // 100 - 30 - 5
    });

    test('should reduce confidence for massive changes', () => {
      const riskAssessment = {
        score: 40,
        components: {
          security: { breakdown: { critical: 0, high: 0 } },
          complexity: { breakdown: { high: 0 } },
          changeMagnitude: { level: 'massive' },
        },
      };

      const confidence = calculateDeploymentConfidence(riskAssessment, {});

      expect(confidence).toBe(50); // 100 - 40 - 10
    });

    test('should reduce confidence for large changes', () => {
      const riskAssessment = {
        score: 35,
        components: {
          security: { breakdown: { critical: 0, high: 0 } },
          complexity: { breakdown: { high: 0 } },
          changeMagnitude: { level: 'large' },
        },
      };

      const confidence = calculateDeploymentConfidence(riskAssessment, {});

      expect(confidence).toBe(60); // 100 - 35 - 5
    });

    test('should not go below 0', () => {
      const riskAssessment = {
        score: 90,
        components: {
          security: { breakdown: { critical: 5, high: 5 } },
          complexity: { breakdown: { high: 5 } },
          changeMagnitude: { level: 'massive' },
        },
      };

      const confidence = calculateDeploymentConfidence(riskAssessment, {});

      expect(confidence).toBe(0);
    });

    test('should not exceed 100', () => {
      const riskAssessment = {
        score: 0,
        components: {
          security: { breakdown: { critical: 0, high: 0 } },
          complexity: { breakdown: { high: 0 } },
          changeMagnitude: { level: 'small' },
        },
      };

      const confidence = calculateDeploymentConfidence(riskAssessment, {});

      expect(confidence).toBe(100);
    });
  });

  describe('makeDeploymentDecision', () => {
    test('should block deployment for critical security findings', () => {
      const riskAssessment = {
        score: 50,
        level: 'MEDIUM',
        components: {
          security: { breakdown: { critical: 0, high: 0 } },
          complexity: { breakdown: { high: 0 } },
          patterns: { patterns: [] },
          changeMagnitude: { level: 'small' },
          fileCriticality: { breakdown: { critical: [] } },
        },
      };

      const analysisResults = {
        securityFindings: [
          {
            severity: 'critical',
            type: 'sql_injection',
            file: 'db.js',
            line: 10,
            message: 'SQL injection',
          },
        ],
      };

      const decision = makeDeploymentDecision(riskAssessment, analysisResults);

      expect(decision.decision).toBe(DECISIONS.BLOCK);
      expect(decision.reason).toBe('Critical security vulnerabilities detected');
      expect(decision.blockingFindings.length).toBeGreaterThanOrEqual(1);
      expect(decision.confidence).toBe(0);
    });

    test('should block deployment for high risk score', () => {
      const riskAssessment = {
        score: 85,
        level: 'CRITICAL',
        components: {
          security: { breakdown: { critical: 0, high: 0 } },
          complexity: { breakdown: { high: 0 } },
          patterns: { patterns: [] },
          changeMagnitude: { level: 'small' },
          fileCriticality: { breakdown: { critical: [] } },
        },
      };

      const analysisResults = {
        securityFindings: [],
      };

      const decision = makeDeploymentDecision(riskAssessment, analysisResults);

      expect(decision.decision).toBe(DECISIONS.BLOCK);
      expect(decision.reason).toContain('exceeds blocking threshold');
      expect(decision.requiredActions).toBeDefined();
      expect(decision.confidence).toBe(0);
    });

    test('should require approval for medium risk', () => {
      const riskAssessment = {
        score: 50,
        level: 'MEDIUM',
        components: {
          security: { breakdown: { critical: 0, high: 0 }, total: 0 },
          complexity: { breakdown: { high: 0 } },
          patterns: { patterns: [] },
          changeMagnitude: { level: 'small' },
          fileCriticality: { breakdown: { critical: [] } },
        },
      };

      const analysisResults = {
        securityFindings: [],
      };

      const decision = makeDeploymentDecision(riskAssessment, analysisResults);

      expect(decision.decision).toBe(DECISIONS.REQUIRE_APPROVAL);
      expect(decision.requiredApprovers).toBeDefined();
      expect(decision.deploymentConditions).toBeDefined();
      expect(decision.confidence).toBeGreaterThan(0);
    });

    test('should auto-approve low risk deployments', () => {
      const riskAssessment = {
        score: 25,
        level: 'LOW',
        components: {
          security: { breakdown: { critical: 0, high: 0 }, total: 0 },
          complexity: { breakdown: { high: 0 } },
          patterns: { patterns: [] },
          changeMagnitude: { level: 'small' },
          fileCriticality: { breakdown: { critical: [] } },
        },
      };

      const analysisResults = {
        securityFindings: [],
      };

      const decision = makeDeploymentDecision(riskAssessment, analysisResults);

      expect(decision.decision).toBe(DECISIONS.AUTO_APPROVE);
      expect(decision.reason).toContain('Low risk score');
      expect(decision.recommendations).toBeDefined();
      expect(decision.confidence).toBeGreaterThan(0);
    });

    test('should include timestamp and duration', () => {
      const riskAssessment = {
        score: 25,
        level: 'LOW',
        components: {
          security: { breakdown: { critical: 0, high: 0 }, total: 0 },
          complexity: { breakdown: { high: 0 } },
          patterns: { patterns: [] },
          changeMagnitude: { level: 'small' },
          fileCriticality: { breakdown: { critical: [] } },
        },
      };

      const analysisResults = {
        securityFindings: [],
      };

      const decision = makeDeploymentDecision(riskAssessment, analysisResults);

      expect(decision.timestamp).toBeDefined();
      expect(decision.duration).toBeGreaterThanOrEqual(0);
    });

    test('should handle null security findings', () => {
      const riskAssessment = {
        score: 25,
        level: 'LOW',
        components: {
          security: { breakdown: { critical: 0, high: 0 }, total: 0 },
          complexity: { breakdown: { high: 0 } },
          patterns: { patterns: [] },
          changeMagnitude: { level: 'small' },
          fileCriticality: { breakdown: { critical: [] } },
        },
      };

      const analysisResults = {};

      const decision = makeDeploymentDecision(riskAssessment, analysisResults);

      expect(decision.decision).toBe(DECISIONS.AUTO_APPROVE);
    });

    test('should require approval for critical files with elevated risk', () => {
      const riskAssessment = {
        score: 45,
        level: 'MEDIUM',
        components: {
          security: { breakdown: { critical: 0, high: 0 }, total: 0 },
          complexity: { breakdown: { high: 0 } },
          patterns: { patterns: [] },
          changeMagnitude: { level: 'small' },
          fileCriticality: {
            breakdown: { critical: ['auth.js', 'payment.js'] },
          },
        },
      };

      const analysisResults = {
        securityFindings: [],
      };

      const decision = makeDeploymentDecision(riskAssessment, analysisResults);

      expect(decision.decision).toBe(DECISIONS.REQUIRE_APPROVAL);
      expect(decision.criticalFiles).toContain('auth.js');
    });

    test('should require approval for critical patterns', () => {
      const riskAssessment = {
        score: 45,
        level: 'MEDIUM',
        components: {
          security: { breakdown: { critical: 0, high: 0 }, total: 0 },
          complexity: { breakdown: { high: 0 } },
          patterns: { patterns: ['databaseSchema'] },
          changeMagnitude: { level: 'small' },
          fileCriticality: { breakdown: { critical: [] } },
        },
      };

      const analysisResults = {
        securityFindings: [],
      };

      const decision = makeDeploymentDecision(riskAssessment, analysisResults);

      expect(decision.decision).toBe(DECISIONS.REQUIRE_APPROVAL);
      expect(decision.criticalPatterns).toContain('databaseSchema');
    });
  });

  describe('formatDecision', () => {
    test('should format BLOCK decision', () => {
      const decision = {
        decision: DECISIONS.BLOCK,
        reason: 'High risk detected',
        riskScore: 85,
        riskLevel: 'CRITICAL',
        confidence: 0,
        requiredActions: ['Fix security issues', 'Reduce complexity'],
      };

      const formatted = formatDecision(decision);

      expect(formatted).toContain('DEPLOYMENT BLOCKED');
      expect(formatted).toContain('High risk detected');
      expect(formatted).toContain('85.0/100');
      expect(formatted).toContain('CRITICAL');
      expect(formatted).toContain('Fix security issues');
    });

    test('should format REQUIRE_APPROVAL decision', () => {
      const decision = {
        decision: DECISIONS.REQUIRE_APPROVAL,
        reason: 'Manual review required',
        riskScore: 50,
        riskLevel: 'MEDIUM',
        confidence: 60,
        requiredApprovers: ['team-lead', 'senior-engineer'],
        deploymentConditions: ['All tests pass', 'Security audit done'],
        criticalFiles: ['auth.js'],
      };

      const formatted = formatDecision(decision);

      expect(formatted).toContain('MANUAL APPROVAL REQUIRED');
      expect(formatted).toContain('Manual review required');
      expect(formatted).toContain('50.0/100');
      expect(formatted).toContain('60.0%');
      expect(formatted).toContain('team-lead');
      expect(formatted).toContain('All tests pass');
      expect(formatted).toContain('auth.js');
    });

    test('should format AUTO_APPROVE decision', () => {
      const decision = {
        decision: DECISIONS.AUTO_APPROVE,
        reason: 'Low risk',
        riskScore: 25,
        riskLevel: 'LOW',
        confidence: 85,
        recommendations: ['Monitor deployment', 'Check logs'],
      };

      const formatted = formatDecision(decision);

      expect(formatted).toContain('AUTO-APPROVED');
      expect(formatted).toContain('Low risk');
      expect(formatted).toContain('25.0/100');
      expect(formatted).toContain('85.0%');
      expect(formatted).toContain('Monitor deployment');
    });

    test('should include blocking findings in BLOCK decision', () => {
      const decision = {
        decision: DECISIONS.BLOCK,
        reason: 'Security issues',
        riskScore: 90,
        riskLevel: 'CRITICAL',
        confidence: 0,
        blockingFindings: [
          {
            severity: 'critical',
            type: 'sql_injection',
            file: 'db.js',
            line: 10,
            message: 'SQL injection detected',
          },
        ],
      };

      const formatted = formatDecision(decision);

      expect(formatted).toContain('BLOCKING ISSUES');
      expect(formatted).toContain('sql_injection');
      expect(formatted).toContain('db.js:10');
    });
  });

  describe('Edge Cases', () => {
    test('should handle undefined components gracefully', () => {
      const riskAssessment = {
        score: 25,
        level: 'LOW',
        components: {
          security: { breakdown: { critical: 0, high: 0 }, total: 0 },
          complexity: { breakdown: { high: 0 } },
          patterns: { patterns: [] },
          changeMagnitude: { level: 'small' },
          fileCriticality: { breakdown: { critical: [] } },
        },
      };

      const analysisResults = {};

      expect(() => {
        makeDeploymentDecision(riskAssessment, analysisResults);
      }).not.toThrow();
    });

    test('should handle risk score at exact threshold', () => {
      const riskAssessment = {
        score: 80,
        level: 'HIGH',
        components: {
          security: { breakdown: { critical: 0, high: 0 }, total: 0 },
          complexity: { breakdown: { high: 0 } },
          patterns: { patterns: [] },
          changeMagnitude: { level: 'small' },
          fileCriticality: { breakdown: { critical: [] } },
        },
      };

      const analysisResults = {
        securityFindings: [],
      };

      const decision = makeDeploymentDecision(riskAssessment, analysisResults);

      expect(decision.decision).toBe(DECISIONS.BLOCK);
    });

    test('should handle risk score just below threshold', () => {
      const riskAssessment = {
        score: 79.9,
        level: 'HIGH',
        components: {
          security: { breakdown: { critical: 0, high: 0 }, total: 0 },
          complexity: { breakdown: { high: 0 } },
          patterns: { patterns: [] },
          changeMagnitude: { level: 'small' },
          fileCriticality: { breakdown: { critical: [] } },
        },
      };

      const analysisResults = {
        securityFindings: [],
      };

      const decision = makeDeploymentDecision(riskAssessment, analysisResults);

      expect(decision.decision).toBe(DECISIONS.REQUIRE_APPROVAL);
    });

    test('should handle empty arrays in components', () => {
      const riskAssessment = {
        score: 25,
        level: 'LOW',
        components: {
          security: { breakdown: { critical: 0, high: 0 }, total: 0 },
          complexity: { breakdown: { high: 0 } },
          patterns: { patterns: [] },
          changeMagnitude: { level: 'small' },
          fileCriticality: { breakdown: { critical: [] } },
        },
      };

      const analysisResults = {
        securityFindings: [],
      };

      const decision = makeDeploymentDecision(riskAssessment, analysisResults);

      expect(decision.decision).toBe(DECISIONS.AUTO_APPROVE);
    });
  });
});

// Made with Bob
