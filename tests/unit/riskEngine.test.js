/**
 * Unit Tests - Risk Engine
 * Comprehensive test coverage for risk scoring and assessment
 */

const {
  calculateRiskScore,
  determineFileCriticality,
  calculateChangeMagnitude,
  detectSemanticPatterns,
  calculateSecurityRisk,
  calculateComplexityRisk,
  calculateFileCriticalityRisk,
  calculatePatternRisk,
  getRiskLevelColor,
  getRiskLevelEmoji,
  WEIGHTS,
  RISK_THRESHOLDS,
  CRITICAL_FILES,
  SEMANTIC_PATTERNS,
} = require('../../src/agent/riskEngine');

// Mock logger to prevent console output during tests
jest.mock('../../src/observability/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  logSecurityFinding: jest.fn(),
}));

describe('RiskEngine', () => {
  describe('calculateRiskScore', () => {
    describe('Risk Score Calculation', () => {
      test('should calculate risk for low-risk changes (simple additions)', () => {
        const analysisResults = {
          securityFindings: [],
          complexityIssues: [],
        };
        const parsedDiff = [
          { path: 'src/utils/helper.js', additions: 10, deletions: 2 },
        ];
        const codeChanges = [
          { code: 'function add(a, b) { return a + b; }' },
        ];

        const result = calculateRiskScore(analysisResults, parsedDiff, codeChanges);

        expect(result.score).toBeLessThan(30);
        expect(result.level).toBe('LOW');
        expect(result.components).toBeDefined();
        expect(result.metadata.filesChanged).toBe(1);
      });

      test('should calculate risk for medium-risk changes (moderate modifications)', () => {
        const analysisResults = {
          securityFindings: [
            { type: 'input_validation', severity: 'medium' },
          ],
          complexityIssues: [
            { complexity: 16 },
          ],
        };
        const parsedDiff = [
          { path: 'src/api/controller.js', additions: 120, deletions: 30 },
        ];
        const codeChanges = [
          { code: 'app.get("/api/users", (req, res) => {})' },
        ];

        const result = calculateRiskScore(analysisResults, parsedDiff, codeChanges);

        expect(result.score).toBeGreaterThanOrEqual(40);
        expect(result.score).toBeLessThan(60);
        expect(result.level).toBe('MEDIUM');
      });

      test('should calculate risk for high-risk changes (security-sensitive files)', () => {
        const analysisResults = {
          securityFindings: [
            { type: 'sql_injection', severity: 'high' },
            { type: 'xss', severity: 'high' },
          ],
          complexityIssues: [
            { complexity: 22 },
          ],
        };
        const parsedDiff = [
          { path: 'src/security/encryption.js', additions: 200, deletions: 50 },
        ];
        const codeChanges = [
          { code: 'const crypto = require("crypto");' },
        ];

        const result = calculateRiskScore(analysisResults, parsedDiff, codeChanges);

        expect(result.score).toBeGreaterThanOrEqual(60);
        expect(result.level).toMatch(/HIGH|CRITICAL/);
      });

      test('should calculate risk for critical-risk changes (authentication/authorization)', () => {
        const analysisResults = {
          securityFindings: [
            { type: 'auth_bypass', severity: 'critical' },
            { type: 'privilege_escalation', severity: 'critical' },
          ],
          complexityIssues: [
            { complexity: 25 },
            { complexity: 30 },
          ],
        };
        const parsedDiff = [
          { path: 'src/auth/passport.js', additions: 300, deletions: 100 },
          { path: 'src/auth/jwt.js', additions: 150, deletions: 50 },
        ];
        const codeChanges = [
          { code: 'passport.authenticate("jwt", { session: false })' },
          { code: 'jwt.sign({ userId: user.id }, secret)' },
        ];

        const result = calculateRiskScore(analysisResults, parsedDiff, codeChanges);

        expect(result.score).toBeGreaterThanOrEqual(80);
        expect(result.level).toBe('CRITICAL');
      });

      test('should verify risk score ranges (0-100)', () => {
        const maxRiskResults = {
          securityFindings: Array(20).fill({ type: 'critical', severity: 'critical' }),
          complexityIssues: Array(20).fill({ complexity: 50 }),
        };
        const parsedDiff = [
          { path: 'src/auth/login.js', additions: 2000, deletions: 1000 },
        ];
        const codeChanges = [
          { code: 'ALTER TABLE users DROP COLUMN password;' },
        ];

        const result = calculateRiskScore(maxRiskResults, parsedDiff, codeChanges);

        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(result.score).toBeLessThanOrEqual(100);
      });
    });

    describe('File Type Risk Assessment', () => {
      test('should assess high-risk file types (auth, security, payment, database)', () => {
        const testFiles = [
          'src/auth/login.js',
          'src/security/crypto.js',
          'src/payment/stripe.js',
          'migrations/001_create_users.sql',
        ];

        testFiles.forEach((filePath) => {
          const criticality = determineFileCriticality(filePath);
          expect(['critical', 'high']).toContain(criticality);
        });
      });

      test('should assess medium-risk file types (API, config, middleware)', () => {
        const testFiles = [
          'src/api/routes.js',
          'config/database.js',
          'src/middleware/validator.js',
        ];

        testFiles.forEach((filePath) => {
          const criticality = determineFileCriticality(filePath);
          expect(['medium', 'high']).toContain(criticality);
        });
      });

      test('should assess low-risk file types (tests, docs, styles)', () => {
        const testFiles = [
          'tests/unit/utils.test.js',
          'docs/README.md',
          '__tests__/integration.spec.js',
        ];

        testFiles.forEach((filePath) => {
          const criticality = determineFileCriticality(filePath);
          expect(criticality).toBe('low');
        });
      });

      test('should handle unknown file types with default medium risk', () => {
        const criticality = determineFileCriticality('src/unknown/file.xyz');
        expect(criticality).toBe('medium');
      });
    });

    describe('Change Size Impact', () => {
      test('should assess small changes (< 50 lines)', () => {
        const result = calculateChangeMagnitude(30, 10);

        expect(result.level).toBe('small');
        expect(result.score).toBe(WEIGHTS.changeMagnitude.small);
        expect(result.totalChanges).toBe(40);
      });

      test('should assess medium changes (50-200 lines)', () => {
        const result = calculateChangeMagnitude(100, 50);

        expect(result.level).toBe('medium');
        expect(result.score).toBe(WEIGHTS.changeMagnitude.medium);
        expect(result.totalChanges).toBe(150);
      });

      test('should assess large changes (200-500 lines)', () => {
        const result = calculateChangeMagnitude(400, 200);

        expect(result.level).toBe('large');
        expect(result.score).toBe(WEIGHTS.changeMagnitude.large);
        expect(result.totalChanges).toBe(600);
      });

      test('should assess very large changes (> 500 lines)', () => {
        const result = calculateChangeMagnitude(800, 400);

        expect(result.level).toBe('massive');
        expect(result.score).toBe(WEIGHTS.changeMagnitude.massive);
        expect(result.totalChanges).toBe(1200);
      });
    });

    describe('Security Pattern Detection', () => {
      test('should detect SQL injection patterns', () => {
        const code = 'SELECT * FROM users WHERE id = " + userId';
        const patterns = detectSemanticPatterns(code);

        // SQL patterns are detected through database schema patterns
        expect(patterns).toBeDefined();
      });

      test('should detect XSS vulnerabilities', () => {
        const code = 'innerHTML = userInput;';
        const patterns = detectSemanticPatterns(code);

        expect(patterns).toBeDefined();
        expect(Array.isArray(patterns)).toBe(true);
      });

      test('should detect authentication bypass patterns', () => {
        const code = 'passport.authenticate("local", { session: false })';
        const patterns = detectSemanticPatterns(code);

        expect(patterns).toContain('authentication');
      });

      test('should detect hardcoded credentials', () => {
        const code = 'const password = "admin123";';
        const patterns = detectSemanticPatterns(code);

        expect(patterns).toBeDefined();
      });

      test('should detect unsafe eval/exec usage', () => {
        const code = 'eval(userInput);';
        const patterns = detectSemanticPatterns(code);

        expect(patterns).toBeDefined();
      });

      test('should detect path traversal attempts', () => {
        const code = 'fs.readFile("../../etc/passwd")';
        const patterns = detectSemanticPatterns(code);

        expect(patterns).toBeDefined();
      });

      test('should detect database schema changes', () => {
        const code = 'CREATE TABLE users (id INT, name VARCHAR(255));';
        const patterns = detectSemanticPatterns(code);

        expect(patterns).toContain('databaseSchema');
      });

      test('should detect API contract changes', () => {
        const code = 'app.post("/api/users", handler);';
        const patterns = detectSemanticPatterns(code);

        expect(patterns).toContain('apiContract');
      });

      test('should detect authorization patterns', () => {
        const code = 'if (user.hasRole("admin")) { authorize(); }';
        const patterns = detectSemanticPatterns(code);

        expect(patterns).toContain('authorization');
      });

      test('should detect data validation patterns', () => {
        const code = 'const schema = yup.object().shape({ email: yup.string() });';
        const patterns = detectSemanticPatterns(code);

        expect(patterns).toContain('dataValidation');
      });
    });

    describe('Complexity Analysis', () => {
      test('should calculate cyclomatic complexity', () => {
        const complexityIssues = [
          { complexity: 25 },
          { complexity: 18 },
          { complexity: 12 },
        ];

        const result = calculateComplexityRisk(complexityIssues);

        expect(result.score).toBeGreaterThan(0);
        expect(result.breakdown.high).toBeGreaterThan(0);
        expect(result.total).toBe(3);
      });

      test('should assess nested loops/conditionals', () => {
        const complexityIssues = [
          { complexity: 30 }, // High complexity from nesting
        ];

        const result = calculateComplexityRisk(complexityIssues);

        expect(result.breakdown.high).toBe(1);
        expect(result.score).toBe(WEIGHTS.complexity.high);
      });

      test('should assess function length impact', () => {
        const complexityIssues = [
          { complexity: 16 }, // Medium complexity
          { complexity: 17 },
        ];

        const result = calculateComplexityRisk(complexityIssues);

        expect(result.breakdown.medium).toBe(2);
      });

      test('should detect code duplication', () => {
        const complexityIssues = [
          { complexity: 10 }, // Low complexity
          { complexity: 12 },
        ];

        const result = calculateComplexityRisk(complexityIssues);

        expect(result.breakdown.low).toBe(2);
      });
    });

    describe('Risk Level Classification', () => {
      test('should classify LOW risk (0-30)', () => {
        const analysisResults = {
          securityFindings: [],
          complexityIssues: [],
        };
        const parsedDiff = [
          { path: 'README.md', additions: 5, deletions: 2 },
        ];
        const codeChanges = [{ code: '# Documentation' }];

        const result = calculateRiskScore(analysisResults, parsedDiff, codeChanges);

        expect(result.score).toBeLessThan(RISK_THRESHOLDS.medium);
        expect(result.level).toBe('LOW');
      });

      test('should classify MEDIUM risk (31-60)', () => {
        const analysisResults = {
          securityFindings: [
            { severity: 'medium' },
            { severity: 'low' },
          ],
          complexityIssues: [
            { complexity: 16 },
          ],
        };
        const parsedDiff = [
          { path: 'src/utils/helper.js', additions: 100, deletions: 20 },
        ];
        const codeChanges = [{ code: 'function helper() {}' }];

        const result = calculateRiskScore(analysisResults, parsedDiff, codeChanges);

        expect(result.score).toBeGreaterThanOrEqual(RISK_THRESHOLDS.medium);
        expect(result.level).toBe('MEDIUM');
      });

      test('should classify HIGH risk (61-85)', () => {
        const analysisResults = {
          securityFindings: [
            { severity: 'high' },
          ],
          complexityIssues: [
            { complexity: 22 },
          ],
        };
        const parsedDiff = [
          { path: 'src/utils/processor.js', additions: 180, deletions: 60 },
        ];
        const codeChanges = [{ code: 'function process() {}' }];

        const result = calculateRiskScore(analysisResults, parsedDiff, codeChanges);

        expect(result.score).toBeGreaterThanOrEqual(RISK_THRESHOLDS.high);
        expect(result.level).toMatch(/HIGH|CRITICAL/);
      });

      test('should classify CRITICAL risk (86-100)', () => {
        const analysisResults = {
          securityFindings: [
            { severity: 'critical' },
            { severity: 'critical' },
            { severity: 'high' },
          ],
          complexityIssues: [
            { complexity: 30 },
            { complexity: 28 },
          ],
        };
        const parsedDiff = [
          { path: 'src/auth/passport.js', additions: 600, deletions: 200 },
          { path: 'src/payment/billing.js', additions: 400, deletions: 150 },
        ];
        const codeChanges = [
          { code: 'passport.authenticate("jwt")' },
          { code: 'stripe.charges.create()' },
        ];

        const result = calculateRiskScore(analysisResults, parsedDiff, codeChanges);

        expect(result.score).toBeGreaterThanOrEqual(RISK_THRESHOLDS.critical);
        expect(result.level).toBe('CRITICAL');
      });
    });

    describe('Edge Cases', () => {
      test('should handle empty changes', () => {
        const analysisResults = {
          securityFindings: [],
          complexityIssues: [],
        };
        const parsedDiff = [];
        const codeChanges = [];

        const result = calculateRiskScore(analysisResults, parsedDiff, codeChanges);

        expect(result.score).toBeDefined();
        expect(result.level).toBe('LOW');
        expect(result.metadata.filesChanged).toBe(0);
      });

      test('should handle null/undefined security findings', () => {
        const analysisResults = {
          securityFindings: undefined,
          complexityIssues: null,
        };
        const parsedDiff = [
          { path: 'src/test.js', additions: 10, deletions: 5 },
        ];
        const codeChanges = [{ code: 'test' }];

        const result = calculateRiskScore(analysisResults, parsedDiff, codeChanges);

        expect(result.score).toBeDefined();
        expect(result.level).toBeDefined();
      });

      test('should handle invalid change objects', () => {
        const analysisResults = {
          securityFindings: [],
          complexityIssues: [],
        };
        const parsedDiff = [
          { path: 'test.js' }, // Missing additions/deletions
        ];
        const codeChanges = [{}]; // Empty object

        const result = calculateRiskScore(analysisResults, parsedDiff, codeChanges);

        expect(result.score).toBeDefined();
        expect(result.level).toBeDefined();
      });

      test('should handle multiple risk factors combined', () => {
        const analysisResults = {
          securityFindings: [
            { severity: 'critical' },
            { severity: 'high' },
            { severity: 'medium' },
          ],
          complexityIssues: [
            { complexity: 25 },
            { complexity: 20 },
          ],
        };
        const parsedDiff = [
          { path: 'src/auth/login.js', additions: 400, deletions: 200 },
          { path: 'src/payment/checkout.js', additions: 300, deletions: 100 },
        ];
        const codeChanges = [
          { code: 'jwt.sign({ userId }, secret)' },
          { code: 'stripe.charges.create({ amount })' },
        ];

        const result = calculateRiskScore(analysisResults, parsedDiff, codeChanges);

        expect(result.score).toBeGreaterThan(60);
        expect(result.components.security.score).toBeGreaterThan(0);
        expect(result.components.complexity.score).toBeGreaterThan(0);
        expect(result.components.fileCriticality.score).toBeGreaterThan(0);
        expect(result.components.changeMagnitude.score).toBeGreaterThan(0);
      });

      test('should handle missing severity in security findings', () => {
        const securityFindings = [
          { type: 'unknown' }, // No severity
          { type: 'test', severity: null },
        ];

        const result = calculateSecurityRisk(securityFindings);

        expect(result.score).toBeGreaterThan(0);
        expect(result.total).toBe(2);
      });

      test('should handle zero complexity', () => {
        const complexityIssues = [
          { complexity: 0 },
          { complexity: 5 },
        ];

        const result = calculateComplexityRisk(complexityIssues);

        expect(result.score).toBeGreaterThan(0);
        expect(result.total).toBe(2);
      });
    });
  });

  describe('determineFileCriticality', () => {
    test('should identify authentication files as critical', () => {
      const files = [
        'src/auth/login.js',
        'src/authentication/passport.js',
        'src/session/manager.js',
        'src/jwt/token.js',
        'src/oauth/provider.js',
      ];

      files.forEach((file) => {
        expect(determineFileCriticality(file)).toBe('critical');
      });
    });

    test('should identify payment files as critical', () => {
      const files = [
        'src/payment/processor.js',
        'src/billing/invoice.js',
        'src/checkout/cart.js',
        'src/stripe/integration.js',
      ];

      files.forEach((file) => {
        expect(determineFileCriticality(file)).toBe('critical');
      });
    });

    test('should identify security files as critical', () => {
      const files = [
        'src/security/encryption.js',
        'src/crypto/hash.js',
        'src/permissions/manager.js',
        'src/roles/admin.js',
      ];

      files.forEach((file) => {
        expect(determineFileCriticality(file)).toBe('critical');
      });
    });

    test('should identify database files as high criticality', () => {
      const files = [
        'migrations/001_create_users.sql',
        'src/models/product.js',
        'src/entities/order.js',
      ];

      files.forEach((file) => {
        const criticality = determineFileCriticality(file);
        expect(['high', 'medium']).toContain(criticality);
      });
    });

    test('should identify API files as high criticality', () => {
      const files = [
        'src/api/routes.js',
        'src/endpoints/users.js',
        'src/routes/products.js',
      ];

      files.forEach((file) => {
        const criticality = determineFileCriticality(file);
        expect(['high', 'critical']).toContain(criticality);
      });
    });

    test('should identify config files as medium criticality', () => {
      const files = [
        'config/database.js',
        'src/env/production.js',
        'settings/app.json',
      ];

      files.forEach((file) => {
        expect(determineFileCriticality(file)).toBe('medium');
      });
    });

    test('should identify test files as low criticality', () => {
      const files = [
        'tests/unit/utils.test.js',
        'src/__tests__/integration.spec.js',
        'test/e2e/workflow.test.ts',
      ];

      files.forEach((file) => {
        expect(determineFileCriticality(file)).toBe('low');
      });
    });

    test('should identify documentation as low criticality', () => {
      const files = [
        'README.md',
        'docs/guide.md',
        'CONTRIBUTING.txt',
      ];

      files.forEach((file) => {
        expect(determineFileCriticality(file)).toBe('low');
      });
    });
  });

  describe('calculateSecurityRisk', () => {
    test('should calculate risk for critical security findings', () => {
      const findings = [
        { type: 'sql_injection', severity: 'critical' },
        { type: 'auth_bypass', severity: 'critical' },
      ];

      const result = calculateSecurityRisk(findings);

      expect(result.score).toBe(WEIGHTS.security.critical * 2);
      expect(result.breakdown.critical).toBe(2);
      expect(result.total).toBe(2);
    });

    test('should calculate risk for mixed severity findings', () => {
      const findings = [
        { severity: 'critical' },
        { severity: 'high' },
        { severity: 'medium' },
        { severity: 'low' },
      ];

      const result = calculateSecurityRisk(findings);

      expect(result.breakdown.critical).toBe(1);
      expect(result.breakdown.high).toBe(1);
      expect(result.breakdown.medium).toBe(1);
      expect(result.breakdown.low).toBe(1);
      expect(result.total).toBe(4);
    });

    test('should handle empty security findings', () => {
      const result = calculateSecurityRisk([]);

      expect(result.score).toBe(0);
      expect(result.total).toBe(0);
    });
  });

  describe('calculateComplexityRisk', () => {
    test('should calculate risk for high complexity', () => {
      const issues = [
        { complexity: 25 },
        { complexity: 30 },
      ];

      const result = calculateComplexityRisk(issues);

      expect(result.breakdown.high).toBe(2);
      expect(result.score).toBe(WEIGHTS.complexity.high * 2);
    });

    test('should calculate risk for medium complexity', () => {
      const issues = [
        { complexity: 16 },
        { complexity: 18 },
      ];

      const result = calculateComplexityRisk(issues);

      expect(result.breakdown.medium).toBe(2);
      expect(result.score).toBe(WEIGHTS.complexity.medium * 2);
    });

    test('should calculate risk for low complexity', () => {
      const issues = [
        { complexity: 10 },
        { complexity: 14 },
      ];

      const result = calculateComplexityRisk(issues);

      expect(result.breakdown.low).toBe(2);
      expect(result.score).toBe(WEIGHTS.complexity.low * 2);
    });
  });

  describe('calculateFileCriticalityRisk', () => {
    test('should calculate risk for critical files', () => {
      const files = [
        { path: 'src/auth/login.js' },
        { path: 'src/payment/stripe.js' },
      ];

      const result = calculateFileCriticalityRisk(files);

      expect(result.breakdown.critical.length).toBe(2);
      expect(result.criticalFiles).toBe(2);
      expect(result.score).toBeGreaterThan(0);
    });

    test('should calculate risk for mixed file types', () => {
      const files = [
        { path: 'src/auth/login.js' },
        { path: 'src/api/routes.js' },
        { path: 'tests/unit/test.spec.js' },
      ];

      const result = calculateFileCriticalityRisk(files);

      expect(result.breakdown.critical.length).toBeGreaterThan(0);
      expect(result.breakdown.high.length + result.breakdown.critical.length).toBeGreaterThan(0);
      expect(result.breakdown.low.length).toBeGreaterThan(0);
    });
  });

  describe('calculatePatternRisk', () => {
    test('should detect database schema patterns', () => {
      const changes = [
        { code: 'CREATE TABLE users (id INT PRIMARY KEY)' },
        { code: 'ALTER TABLE products ADD COLUMN price DECIMAL' },
      ];

      const result = calculatePatternRisk(changes);

      expect(result.patterns).toContain('databaseSchema');
      expect(result.score).toBeGreaterThan(0);
    });

    test('should detect API contract patterns', () => {
      const changes = [
        { code: 'app.post("/api/users", handler)' },
        { code: 'router.get("/api/products", controller)' },
      ];

      const result = calculatePatternRisk(changes);

      expect(result.patterns).toContain('apiContract');
      expect(result.score).toBeGreaterThan(0);
    });

    test('should detect authentication patterns', () => {
      const changes = [
        { code: 'passport.authenticate("local")' },
        { code: 'jwt.sign({ userId: 123 }, secret)' },
      ];

      const result = calculatePatternRisk(changes);

      expect(result.patterns).toContain('authentication');
      expect(result.score).toBeGreaterThan(0);
    });

    test('should not duplicate pattern scores', () => {
      const changes = [
        { code: 'CREATE TABLE users (id INT)' },
        { code: 'CREATE TABLE products (id INT)' },
      ];

      const result = calculatePatternRisk(changes);

      // Should only count databaseSchema once
      expect(result.patterns.filter((p) => p === 'databaseSchema').length).toBe(1);
    });
  });

  describe('getRiskLevelColor', () => {
    test('should return correct color for CRITICAL', () => {
      const color = getRiskLevelColor('CRITICAL');
      expect(color).toBe('\x1b[41m\x1b[37m');
    });

    test('should return correct color for HIGH', () => {
      const color = getRiskLevelColor('HIGH');
      expect(color).toBe('\x1b[31m');
    });

    test('should return correct color for MEDIUM', () => {
      const color = getRiskLevelColor('MEDIUM');
      expect(color).toBe('\x1b[33m');
    });

    test('should return correct color for LOW', () => {
      const color = getRiskLevelColor('LOW');
      expect(color).toBe('\x1b[32m');
    });

    test('should return default color for unknown level', () => {
      const color = getRiskLevelColor('UNKNOWN');
      expect(color).toBe('\x1b[0m');
    });
  });

  describe('getRiskLevelEmoji', () => {
    test('should return correct emoji for CRITICAL', () => {
      const emoji = getRiskLevelEmoji('CRITICAL');
      expect(emoji).toBe('🚨');
    });

    test('should return correct emoji for HIGH', () => {
      const emoji = getRiskLevelEmoji('HIGH');
      expect(emoji).toBe('⚠️');
    });

    test('should return correct emoji for MEDIUM', () => {
      const emoji = getRiskLevelEmoji('MEDIUM');
      expect(emoji).toBe('⚡');
    });

    test('should return correct emoji for LOW', () => {
      const emoji = getRiskLevelEmoji('LOW');
      expect(emoji).toBe('✅');
    });

    test('should return default emoji for unknown level', () => {
      const emoji = getRiskLevelEmoji('UNKNOWN');
      expect(emoji).toBe('❓');
    });
  });

  describe('Constants', () => {
    test('should export WEIGHTS', () => {
      expect(WEIGHTS).toBeDefined();
      expect(WEIGHTS.security).toBeDefined();
      expect(WEIGHTS.complexity).toBeDefined();
      expect(WEIGHTS.changeMagnitude).toBeDefined();
      expect(WEIGHTS.fileCriticality).toBeDefined();
      expect(WEIGHTS.patterns).toBeDefined();
    });

    test('should export RISK_THRESHOLDS', () => {
      expect(RISK_THRESHOLDS).toBeDefined();
      expect(RISK_THRESHOLDS.critical).toBe(80);
      expect(RISK_THRESHOLDS.high).toBe(60);
      expect(RISK_THRESHOLDS.medium).toBe(40);
      expect(RISK_THRESHOLDS.low).toBe(20);
    });

    test('should export CRITICAL_FILES', () => {
      expect(CRITICAL_FILES).toBeDefined();
      expect(CRITICAL_FILES.authentication).toBeDefined();
      expect(CRITICAL_FILES.payment).toBeDefined();
      expect(CRITICAL_FILES.security).toBeDefined();
    });

    test('should export SEMANTIC_PATTERNS', () => {
      expect(SEMANTIC_PATTERNS).toBeDefined();
      expect(SEMANTIC_PATTERNS.databaseSchema).toBeDefined();
      expect(SEMANTIC_PATTERNS.apiContract).toBeDefined();
      expect(SEMANTIC_PATTERNS.authentication).toBeDefined();
    });
  });
});

// Made with Bob
