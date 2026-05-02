/**
 * CodeGuard AI - CI Simulator Tests
 * Comprehensive test coverage for CI/CD pipeline simulation
 */

const fs = require('fs');
const {
  simulateCIPipeline,
  detectCIPlatform,
  determineExitCode,
  exitWithCode,
  generateCIConfig,
  processGitHubActions,
  processGitLabCI,
  processJenkins,
  setGitHubOutput,
  createGitHubAnnotation,
  setGitHubSummary,
  generateGitHubSummary,
  EXIT_CODES,
  CI_PLATFORMS,
} = require('../../src/pipeline/ciSimulator');

const { DECISIONS } = require('../../src/pipeline/decisionEngine');

// Mock logger
jest.mock('../../src/observability/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

// Mock fs
jest.mock('fs', () => ({
  appendFileSync: jest.fn(),
  writeFileSync: jest.fn(),
}));

describe('CI Simulator', () => {
  let originalEnv;
  let consoleLogSpy;
  let consoleErrorSpy;
  let processExitSpy;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };

    // Clear all environment variables
    delete process.env.GITHUB_ACTIONS;
    delete process.env.GITLAB_CI;
    delete process.env.JENKINS_HOME;
    delete process.env.CIRCLECI;
    delete process.env.TRAVIS;
    delete process.env.TF_BUILD;
    delete process.env.GITHUB_OUTPUT;
    delete process.env.GITHUB_STEP_SUMMARY;
    delete process.env.CI_PROJECT_DIR;

    // Mock console methods
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    // Mock process.exit
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation();

    // Clear all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;

    // Restore console methods
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  describe('Constants', () => {
    test('should export EXIT_CODES constants', () => {
      expect(EXIT_CODES).toEqual({
        SUCCESS: 0,
        BLOCKED: 1,
        APPROVAL_REQUIRED: 2,
        ERROR: 3,
      });
    });

    test('should export CI_PLATFORMS constants', () => {
      expect(CI_PLATFORMS).toEqual({
        GITHUB_ACTIONS: 'github-actions',
        GITLAB_CI: 'gitlab-ci',
        JENKINS: 'jenkins',
        CIRCLECI: 'circleci',
        TRAVIS: 'travis',
        AZURE_DEVOPS: 'azure-devops',
      });
    });
  });

  describe('detectCIPlatform', () => {
    test('should detect GitHub Actions', () => {
      process.env.GITHUB_ACTIONS = 'true';
      expect(detectCIPlatform()).toBe(CI_PLATFORMS.GITHUB_ACTIONS);
    });

    test('should detect GitLab CI', () => {
      process.env.GITLAB_CI = 'true';
      expect(detectCIPlatform()).toBe(CI_PLATFORMS.GITLAB_CI);
    });

    test('should detect Jenkins', () => {
      process.env.JENKINS_HOME = '/var/jenkins';
      expect(detectCIPlatform()).toBe(CI_PLATFORMS.JENKINS);
    });

    test('should detect CircleCI', () => {
      process.env.CIRCLECI = 'true';
      expect(detectCIPlatform()).toBe(CI_PLATFORMS.CIRCLECI);
    });

    test('should detect Travis CI', () => {
      process.env.TRAVIS = 'true';
      expect(detectCIPlatform()).toBe(CI_PLATFORMS.TRAVIS);
    });

    test('should detect Azure DevOps', () => {
      process.env.TF_BUILD = 'true';
      expect(detectCIPlatform()).toBe(CI_PLATFORMS.AZURE_DEVOPS);
    });

    test('should return null when no CI platform detected', () => {
      expect(detectCIPlatform()).toBeNull();
    });

    test('should prioritize GitHub Actions over other platforms', () => {
      process.env.GITHUB_ACTIONS = 'true';
      process.env.GITLAB_CI = 'true';
      expect(detectCIPlatform()).toBe(CI_PLATFORMS.GITHUB_ACTIONS);
    });
  });

  describe('setGitHubOutput', () => {
    test('should write to GITHUB_OUTPUT file when available', () => {
      process.env.GITHUB_OUTPUT = '/tmp/github_output';

      setGitHubOutput('decision', 'BLOCK');

      expect(fs.appendFileSync).toHaveBeenCalledWith(
        '/tmp/github_output',
        'decision=BLOCK\n',
      );
    });

    test('should use legacy output format when GITHUB_OUTPUT not available', () => {
      setGitHubOutput('risk_score', '75.5');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '::set-output name=risk_score::75.5',
      );
    });

    test('should handle multiple outputs', () => {
      process.env.GITHUB_OUTPUT = '/tmp/github_output';

      setGitHubOutput('decision', 'REQUIRE_APPROVAL');
      setGitHubOutput('risk_score', '50.0');
      setGitHubOutput('risk_level', 'MEDIUM');

      expect(fs.appendFileSync).toHaveBeenCalledTimes(3);
    });
  });

  describe('createGitHubAnnotation', () => {
    test('should create basic annotation', () => {
      createGitHubAnnotation('error', 'Deployment blocked');

      expect(consoleLogSpy).toHaveBeenCalledWith('::error::Deployment blocked');
    });

    test('should create annotation with file', () => {
      createGitHubAnnotation('warning', 'Security issue', { file: 'auth.js' });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '::warning file=auth.js::Security issue',
      );
    });

    test('should create annotation with file and line', () => {
      createGitHubAnnotation('error', 'SQL injection', {
        file: 'db.js',
        line: 42,
      });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '::error file=db.js,line=42::SQL injection',
      );
    });

    test('should create annotation with title', () => {
      createGitHubAnnotation('notice', 'Auto-approved', {
        title: 'CodeGuard Decision',
      });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '::notice,title=CodeGuard Decision::Auto-approved',
      );
    });

    test('should create annotation with all options', () => {
      createGitHubAnnotation('error', 'Critical issue', {
        file: 'payment.js',
        line: 100,
        title: 'Security Alert',
      });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '::error file=payment.js,line=100,title=Security Alert::Critical issue',
      );
    });
  });

  describe('setGitHubSummary', () => {
    test('should write to GITHUB_STEP_SUMMARY file', () => {
      process.env.GITHUB_STEP_SUMMARY = '/tmp/github_summary';
      const summary = '# Test Summary\n\nAll tests passed!';

      setGitHubSummary(summary);

      expect(fs.appendFileSync).toHaveBeenCalledWith(
        '/tmp/github_summary',
        summary,
      );
    });

    test('should not write when GITHUB_STEP_SUMMARY not available', () => {
      setGitHubSummary('# Summary');

      expect(fs.appendFileSync).not.toHaveBeenCalled();
    });
  });

  describe('generateGitHubSummary', () => {
    test('should generate summary for BLOCK decision', () => {
      const decision = {
        decision: DECISIONS.BLOCK,
        reason: 'High risk detected',
        riskScore: 85,
        riskLevel: 'CRITICAL',
        blockingFindings: [
          {
            severity: 'critical',
            type: 'sql_injection',
            file: 'db.js',
            line: 10,
            message: 'SQL injection vulnerability',
          },
        ],
      };

      const riskAssessment = {
        components: {
          security: { score: 90 },
          complexity: { score: 70 },
          fileCriticality: { score: 60 },
          changeMagnitude: { score: 50 },
          patterns: { score: 40 },
        },
      };

      const summary = generateGitHubSummary(decision, riskAssessment);

      expect(summary).toContain('🚫 CodeGuard AI Analysis');
      expect(summary).toContain('Decision: BLOCK');
      expect(summary).toContain('85.0/100');
      expect(summary).toContain('CRITICAL');
      expect(summary).toContain('⚠️ Deployment Blocked');
      expect(summary).toContain('sql_injection');
      expect(summary).toContain('db.js:10');
    });

    test('should generate summary for REQUIRE_APPROVAL decision', () => {
      const decision = {
        decision: DECISIONS.REQUIRE_APPROVAL,
        reason: 'Manual review required',
        riskScore: 50,
        riskLevel: 'MEDIUM',
        confidence: 65,
        requiredApprovers: ['team-lead', 'senior-engineer'],
        deploymentConditions: ['All tests pass', 'Security audit done'],
      };

      const riskAssessment = {
        components: {
          security: { score: 45 },
          complexity: { score: 55 },
          fileCriticality: { score: 50 },
          changeMagnitude: { score: 40 },
          patterns: { score: 35 },
        },
      };

      const summary = generateGitHubSummary(decision, riskAssessment);

      expect(summary).toContain('⏸️ CodeGuard AI Analysis');
      expect(summary).toContain('Decision: REQUIRE_APPROVAL');
      expect(summary).toContain('50.0/100');
      expect(summary).toContain('65.0%');
      expect(summary).toContain('👥 Approval Required');
      expect(summary).toContain('team-lead');
      expect(summary).toContain('All tests pass');
    });

    test('should generate summary for AUTO_APPROVE decision', () => {
      const decision = {
        decision: DECISIONS.AUTO_APPROVE,
        reason: 'Low risk',
        riskScore: 25,
        riskLevel: 'LOW',
        confidence: 85,
        recommendations: ['Monitor deployment', 'Check logs'],
      };

      const riskAssessment = {
        components: {
          security: { score: 20 },
          complexity: { score: 30 },
          fileCriticality: { score: 25 },
          changeMagnitude: { score: 15 },
          patterns: { score: 10 },
        },
      };

      const summary = generateGitHubSummary(decision, riskAssessment);

      expect(summary).toContain('✅ CodeGuard AI Analysis');
      expect(summary).toContain('Decision: AUTO_APPROVE');
      expect(summary).toContain('25.0/100');
      expect(summary).toContain('85.0%');
      expect(summary).toContain('✅ Auto-Approved');
      expect(summary).toContain('Monitor deployment');
    });

    test('should include risk breakdown table', () => {
      const decision = {
        decision: DECISIONS.AUTO_APPROVE,
        reason: 'Low risk',
        riskScore: 25,
        riskLevel: 'LOW',
        confidence: 85,
        recommendations: [],
      };

      const riskAssessment = {
        components: {
          security: { score: 20 },
          complexity: { score: 30 },
          fileCriticality: { score: 25 },
          changeMagnitude: { score: 15 },
          patterns: { score: 10 },
        },
      };

      const summary = generateGitHubSummary(decision, riskAssessment);

      expect(summary).toContain('Risk Breakdown');
      expect(summary).toContain('Security | 20.0');
      expect(summary).toContain('Complexity | 30.0');
      expect(summary).toContain('File Criticality | 25.0');
    });
  });

  describe('processGitHubActions', () => {
    test('should set outputs and create annotations', () => {
      process.env.GITHUB_OUTPUT = '/tmp/github_output';
      process.env.GITHUB_STEP_SUMMARY = '/tmp/github_summary';

      const decision = {
        decision: DECISIONS.AUTO_APPROVE,
        reason: 'Low risk',
        riskScore: 25,
        riskLevel: 'LOW',
        confidence: 85,
      };

      const riskAssessment = {
        components: {
          security: { score: 20 },
          complexity: { score: 30 },
          fileCriticality: { score: 25 },
          changeMagnitude: { score: 15 },
          patterns: { score: 10 },
        },
      };

      const analysisResults = {
        securityFindings: [],
      };

      processGitHubActions(decision, riskAssessment, analysisResults);

      expect(fs.appendFileSync).toHaveBeenCalledWith(
        '/tmp/github_output',
        expect.stringContaining('decision=AUTO_APPROVE'),
      );
      expect(fs.appendFileSync).toHaveBeenCalledWith(
        '/tmp/github_summary',
        expect.stringContaining('CodeGuard AI Analysis'),
      );
    });

    test('should create security annotations', () => {
      const decision = {
        decision: DECISIONS.BLOCK,
        reason: 'Security issues',
        riskScore: 85,
        riskLevel: 'CRITICAL',
        confidence: 0,
      };

      const riskAssessment = {
        components: {
          security: { score: 90 },
          complexity: { score: 70 },
          fileCriticality: { score: 60 },
          changeMagnitude: { score: 50 },
          patterns: { score: 40 },
        },
      };

      const analysisResults = {
        securityFindings: [
          {
            severity: 'critical',
            type: 'sql_injection',
            file: 'db.js',
            line: 10,
            message: 'SQL injection detected',
          },
          {
            severity: 'high',
            type: 'xss',
            file: 'view.js',
            line: 20,
            message: 'XSS vulnerability',
          },
        ],
      };

      processGitHubActions(decision, riskAssessment, analysisResults);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('::error'),
      );
    });

    test('should handle missing confidence', () => {
      const decision = {
        decision: DECISIONS.BLOCK,
        reason: 'High risk',
        riskScore: 85,
        riskLevel: 'CRITICAL',
      };

      const riskAssessment = {
        components: {
          security: { score: 90 },
          complexity: { score: 70 },
          fileCriticality: { score: 60 },
          changeMagnitude: { score: 50 },
          patterns: { score: 40 },
        },
      };

      const analysisResults = {
        securityFindings: [],
      };

      expect(() => {
        processGitHubActions(decision, riskAssessment, analysisResults);
      }).not.toThrow();
    });
  });

  describe('processGitLabCI', () => {
    test('should write dotenv file', () => {
      process.env.CI_PROJECT_DIR = '/project';

      const decision = {
        decision: DECISIONS.AUTO_APPROVE,
        riskScore: 25,
        riskLevel: 'LOW',
        confidence: 85,
      };

      const riskAssessment = {
        components: {
          security: { score: 20 },
          complexity: { score: 30 },
          fileCriticality: { score: 25 },
          changeMagnitude: { score: 15 },
          patterns: { score: 10 },
        },
      };

      processGitLabCI(decision, riskAssessment);

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        '/project/codeguard.env',
        expect.stringContaining('CODEGUARD_DECISION=AUTO_APPROVE'),
      );
    });

    test('should handle missing CI_PROJECT_DIR', () => {
      const decision = {
        decision: DECISIONS.AUTO_APPROVE,
        riskScore: 25,
        riskLevel: 'LOW',
        confidence: 85,
      };

      const riskAssessment = {
        components: {
          security: { score: 20 },
          complexity: { score: 30 },
          fileCriticality: { score: 25 },
          changeMagnitude: { score: 15 },
          patterns: { score: 10 },
        },
      };

      expect(() => {
        processGitLabCI(decision, riskAssessment);
      }).not.toThrow();
    });

    test('should handle missing confidence', () => {
      process.env.CI_PROJECT_DIR = '/project';

      const decision = {
        decision: DECISIONS.BLOCK,
        riskScore: 85,
        riskLevel: 'CRITICAL',
      };

      const riskAssessment = {
        components: {
          security: { score: 90 },
          complexity: { score: 70 },
          fileCriticality: { score: 60 },
          changeMagnitude: { score: 50 },
          patterns: { score: 40 },
        },
      };

      processGitLabCI(decision, riskAssessment);

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        '/project/codeguard.env',
        expect.stringContaining('CODEGUARD_CONFIDENCE=N/A'),
      );
    });
  });

  describe('processJenkins', () => {
    test('should write properties file', () => {
      const decision = {
        decision: DECISIONS.REQUIRE_APPROVAL,
        riskScore: 50,
        riskLevel: 'MEDIUM',
        confidence: 65,
      };

      const riskAssessment = {
        components: {
          security: { score: 45 },
          complexity: { score: 55 },
          fileCriticality: { score: 50 },
          changeMagnitude: { score: 40 },
          patterns: { score: 35 },
        },
      };

      processJenkins(decision, riskAssessment);

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        'codeguard.properties',
        expect.stringContaining('codeguard.decision=REQUIRE_APPROVAL'),
      );
    });

    test('should handle missing confidence', () => {
      const decision = {
        decision: DECISIONS.BLOCK,
        riskScore: 85,
        riskLevel: 'CRITICAL',
      };

      const riskAssessment = {
        components: {
          security: { score: 90 },
          complexity: { score: 70 },
          fileCriticality: { score: 60 },
          changeMagnitude: { score: 50 },
          patterns: { score: 40 },
        },
      };

      processJenkins(decision, riskAssessment);

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        'codeguard.properties',
        expect.stringContaining('codeguard.confidence=N/A'),
      );
    });
  });

  describe('determineExitCode', () => {
    test('should return BLOCKED for BLOCK decision', () => {
      const decision = { decision: DECISIONS.BLOCK };
      expect(determineExitCode(decision)).toBe(EXIT_CODES.BLOCKED);
    });

    test('should return APPROVAL_REQUIRED for REQUIRE_APPROVAL decision', () => {
      const decision = { decision: DECISIONS.REQUIRE_APPROVAL };
      expect(determineExitCode(decision)).toBe(EXIT_CODES.APPROVAL_REQUIRED);
    });

    test('should return SUCCESS for AUTO_APPROVE decision', () => {
      const decision = { decision: DECISIONS.AUTO_APPROVE };
      expect(determineExitCode(decision)).toBe(EXIT_CODES.SUCCESS);
    });

    test('should return ERROR for unknown decision', () => {
      const decision = { decision: 'UNKNOWN' };
      expect(determineExitCode(decision)).toBe(EXIT_CODES.ERROR);
    });
  });

  describe('exitWithCode', () => {
    test('should exit with SUCCESS code', () => {
      exitWithCode(EXIT_CODES.SUCCESS, 'Deployment approved');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('✅'),
      );
      expect(processExitSpy).toHaveBeenCalledWith(EXIT_CODES.SUCCESS);
    });

    test('should exit with APPROVAL_REQUIRED code', () => {
      exitWithCode(EXIT_CODES.APPROVAL_REQUIRED, 'Approval needed');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('⏸️'),
      );
      expect(processExitSpy).toHaveBeenCalledWith(EXIT_CODES.APPROVAL_REQUIRED);
    });

    test('should exit with BLOCKED code', () => {
      exitWithCode(EXIT_CODES.BLOCKED, 'Deployment blocked');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('🚫'),
      );
      expect(processExitSpy).toHaveBeenCalledWith(EXIT_CODES.BLOCKED);
    });

    test('should exit with ERROR code', () => {
      exitWithCode(EXIT_CODES.ERROR, 'Analysis failed');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('❌'),
      );
      expect(processExitSpy).toHaveBeenCalledWith(EXIT_CODES.ERROR);
    });
  });

  describe('simulateCIPipeline', () => {
    test('should simulate GitHub Actions pipeline', () => {
      process.env.GITHUB_ACTIONS = 'true';
      process.env.GITHUB_OUTPUT = '/tmp/github_output';

      const decision = {
        decision: DECISIONS.AUTO_APPROVE,
        riskScore: 25,
        riskLevel: 'LOW',
        confidence: 85,
      };

      const riskAssessment = {
        components: {
          security: { score: 20 },
          complexity: { score: 30 },
          fileCriticality: { score: 25 },
          changeMagnitude: { score: 15 },
          patterns: { score: 10 },
        },
      };

      const analysisResults = {
        securityFindings: [],
      };

      const result = simulateCIPipeline(decision, riskAssessment, analysisResults);

      expect(result.platform).toBe(CI_PLATFORMS.GITHUB_ACTIONS);
      expect(result.exitCode).toBe(EXIT_CODES.SUCCESS);
      expect(result.decision).toBe(DECISIONS.AUTO_APPROVE);
      expect(result.riskScore).toBe(25);
      expect(result.riskLevel).toBe('LOW');
      expect(result.duration).toBeGreaterThanOrEqual(0);
      expect(result.timestamp).toBeDefined();
    });

    test('should simulate GitLab CI pipeline', () => {
      process.env.GITLAB_CI = 'true';
      process.env.CI_PROJECT_DIR = '/project';

      const decision = {
        decision: DECISIONS.REQUIRE_APPROVAL,
        riskScore: 50,
        riskLevel: 'MEDIUM',
        confidence: 65,
      };

      const riskAssessment = {
        components: {
          security: { score: 45 },
          complexity: { score: 55 },
          fileCriticality: { score: 50 },
          changeMagnitude: { score: 40 },
          patterns: { score: 35 },
        },
      };

      const analysisResults = {
        securityFindings: [],
      };

      const result = simulateCIPipeline(decision, riskAssessment, analysisResults);

      expect(result.platform).toBe(CI_PLATFORMS.GITLAB_CI);
      expect(result.exitCode).toBe(EXIT_CODES.APPROVAL_REQUIRED);
    });

    test('should simulate Jenkins pipeline', () => {
      process.env.JENKINS_HOME = '/var/jenkins';

      const decision = {
        decision: DECISIONS.BLOCK,
        riskScore: 85,
        riskLevel: 'CRITICAL',
        confidence: 0,
      };

      const riskAssessment = {
        components: {
          security: { score: 90 },
          complexity: { score: 70 },
          fileCriticality: { score: 60 },
          changeMagnitude: { score: 50 },
          patterns: { score: 40 },
        },
      };

      const analysisResults = {
        securityFindings: [],
      };

      const result = simulateCIPipeline(decision, riskAssessment, analysisResults);

      expect(result.platform).toBe(CI_PLATFORMS.JENKINS);
      expect(result.exitCode).toBe(EXIT_CODES.BLOCKED);
    });

    test('should handle unknown platform', () => {
      const decision = {
        decision: DECISIONS.AUTO_APPROVE,
        riskScore: 25,
        riskLevel: 'LOW',
        confidence: 85,
      };

      const riskAssessment = {
        components: {
          security: { score: 20 },
          complexity: { score: 30 },
          fileCriticality: { score: 25 },
          changeMagnitude: { score: 15 },
          patterns: { score: 10 },
        },
      };

      const analysisResults = {
        securityFindings: [],
      };

      const result = simulateCIPipeline(decision, riskAssessment, analysisResults);

      expect(result.platform).toBe('unknown');
      expect(result.exitCode).toBe(EXIT_CODES.SUCCESS);
    });

    test('should handle CI integration errors gracefully', () => {
      process.env.GITHUB_ACTIONS = 'true';
      fs.appendFileSync.mockImplementation(() => {
        throw new Error('File system error');
      });

      const decision = {
        decision: DECISIONS.AUTO_APPROVE,
        riskScore: 25,
        riskLevel: 'LOW',
        confidence: 85,
      };

      const riskAssessment = {
        components: {
          security: { score: 20 },
          complexity: { score: 30 },
          fileCriticality: { score: 25 },
          changeMagnitude: { score: 15 },
          patterns: { score: 10 },
        },
      };

      const analysisResults = {
        securityFindings: [],
      };

      expect(() => {
        simulateCIPipeline(decision, riskAssessment, analysisResults);
      }).not.toThrow();
    });

    test('should track execution duration', () => {
      const decision = {
        decision: DECISIONS.AUTO_APPROVE,
        riskScore: 25,
        riskLevel: 'LOW',
        confidence: 85,
      };

      const riskAssessment = {
        components: {
          security: { score: 20 },
          complexity: { score: 30 },
          fileCriticality: { score: 25 },
          changeMagnitude: { score: 15 },
          patterns: { score: 10 },
        },
      };

      const analysisResults = {
        securityFindings: [],
      };

      const result = simulateCIPipeline(decision, riskAssessment, analysisResults);

      expect(result.duration).toBeGreaterThanOrEqual(0);
      expect(typeof result.duration).toBe('number');
    });
  });

  describe('generateCIConfig', () => {
    test('should generate GitHub Actions config', () => {
      const config = generateCIConfig(CI_PLATFORMS.GITHUB_ACTIONS);

      expect(config).toContain('.github/workflows/codeguard.yml');
      expect(config).toContain('name: CodeGuard AI Analysis');
      expect(config).toContain('on: [pull_request]');
      expect(config).toContain('node src/index.js changes.diff');
    });

    test('should generate GitLab CI config', () => {
      const config = generateCIConfig(CI_PLATFORMS.GITLAB_CI);

      expect(config).toContain('.gitlab-ci.yml');
      expect(config).toContain('codeguard:');
      expect(config).toContain('stage: test');
      expect(config).toContain('dotenv: codeguard.env');
    });

    test('should generate Jenkins config', () => {
      const config = generateCIConfig(CI_PLATFORMS.JENKINS);

      expect(config).toContain('Jenkinsfile');
      expect(config).toContain('pipeline {');
      expect(config).toContain('CodeGuard Analysis');
      expect(config).toContain('readProperties file: \'codeguard.properties\'');
    });

    test('should return message for unsupported platform', () => {
      const config = generateCIConfig('unsupported-platform');

      expect(config).toContain('Platform-specific configuration not available');
    });

    test('should handle null platform', () => {
      const config = generateCIConfig(null);

      expect(config).toContain('Platform-specific configuration not available');
    });
  });

  describe('Integration Tests', () => {
    test('should complete full pipeline for successful deployment', () => {
      process.env.GITHUB_ACTIONS = 'true';

      const decision = {
        decision: DECISIONS.AUTO_APPROVE,
        riskScore: 25,
        riskLevel: 'LOW',
        confidence: 85,
      };

      const riskAssessment = {
        components: {
          security: { score: 20 },
          complexity: { score: 30 },
          fileCriticality: { score: 25 },
          changeMagnitude: { score: 15 },
          patterns: { score: 10 },
        },
      };

      const analysisResults = {
        securityFindings: [],
      };

      const result = simulateCIPipeline(decision, riskAssessment, analysisResults);

      expect(result.exitCode).toBe(EXIT_CODES.SUCCESS);
      expect(result.platform).toBe(CI_PLATFORMS.GITHUB_ACTIONS);
    });

    test('should complete full pipeline for blocked deployment', () => {
      process.env.GITLAB_CI = 'true';
      process.env.CI_PROJECT_DIR = '/project';

      const decision = {
        decision: DECISIONS.BLOCK,
        riskScore: 85,
        riskLevel: 'CRITICAL',
        confidence: 0,
      };

      const riskAssessment = {
        components: {
          security: { score: 90 },
          complexity: { score: 70 },
          fileCriticality: { score: 60 },
          changeMagnitude: { score: 50 },
          patterns: { score: 40 },
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

      const result = simulateCIPipeline(decision, riskAssessment, analysisResults);

      expect(result.exitCode).toBe(EXIT_CODES.BLOCKED);
      expect(result.platform).toBe(CI_PLATFORMS.GITLAB_CI);
    });

    test('should complete full pipeline for approval required', () => {
      process.env.JENKINS_HOME = '/var/jenkins';

      const decision = {
        decision: DECISIONS.REQUIRE_APPROVAL,
        riskScore: 50,
        riskLevel: 'MEDIUM',
        confidence: 65,
      };

      const riskAssessment = {
        components: {
          security: { score: 45 },
          complexity: { score: 55 },
          fileCriticality: { score: 50 },
          changeMagnitude: { score: 40 },
          patterns: { score: 35 },
        },
      };

      const analysisResults = {
        securityFindings: [],
      };

      const result = simulateCIPipeline(decision, riskAssessment, analysisResults);

      expect(result.exitCode).toBe(EXIT_CODES.APPROVAL_REQUIRED);
      expect(result.platform).toBe(CI_PLATFORMS.JENKINS);
    });
  });

  describe('Edge Cases', () => {
    test('should handle missing analysis results', () => {
      const decision = {
        decision: DECISIONS.AUTO_APPROVE,
        riskScore: 25,
        riskLevel: 'LOW',
        confidence: 85,
      };

      const riskAssessment = {
        components: {
          security: { score: 20 },
          complexity: { score: 30 },
          fileCriticality: { score: 25 },
          changeMagnitude: { score: 15 },
          patterns: { score: 10 },
        },
      };

      expect(() => {
        simulateCIPipeline(decision, riskAssessment, {});
      }).not.toThrow();
    });

    test('should handle empty security findings', () => {
      process.env.GITHUB_ACTIONS = 'true';

      const decision = {
        decision: DECISIONS.AUTO_APPROVE,
        riskScore: 25,
        riskLevel: 'LOW',
        confidence: 85,
      };

      const riskAssessment = {
        components: {
          security: { score: 20 },
          complexity: { score: 30 },
          fileCriticality: { score: 25 },
          changeMagnitude: { score: 15 },
          patterns: { score: 10 },
        },
      };

      const analysisResults = {
        securityFindings: [],
      };

      expect(() => {
        processGitHubActions(decision, riskAssessment, analysisResults);
      }).not.toThrow();
    });

    test('should handle undefined decision fields', () => {
      const decision = {
        decision: DECISIONS.AUTO_APPROVE,
        riskScore: 25,
        riskLevel: 'LOW',
      };

      const riskAssessment = {
        components: {
          security: { score: 20 },
          complexity: { score: 30 },
          fileCriticality: { score: 25 },
          changeMagnitude: { score: 15 },
          patterns: { score: 10 },
        },
      };

      const summary = generateGitHubSummary(decision, riskAssessment);

      expect(summary).toBeDefined();
      expect(summary).toContain('CodeGuard AI Analysis');
    });
  });
});

// Made with Bob
