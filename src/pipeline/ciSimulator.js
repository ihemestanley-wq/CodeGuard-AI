/**
 * CodeGuard AI - CI/CD Simulator
 * Simulates CI/CD pipeline integration and exit codes
 */

const logger = require('../observability/logger');
const { DECISIONS } = require('./decisionEngine');

// Exit codes for CI/CD integration
const EXIT_CODES = {
  SUCCESS: 0,
  BLOCKED: 1,
  APPROVAL_REQUIRED: 2,
  ERROR: 3,
};

// CI/CD platforms
const CI_PLATFORMS = {
  GITHUB_ACTIONS: 'github-actions',
  GITLAB_CI: 'gitlab-ci',
  JENKINS: 'jenkins',
  CIRCLECI: 'circleci',
  TRAVIS: 'travis',
  AZURE_DEVOPS: 'azure-devops',
};

/**
 * Detect CI/CD platform
 * @returns {string|null} Platform name or null
 */
function detectCIPlatform() {
  if (process.env.GITHUB_ACTIONS) {
    return CI_PLATFORMS.GITHUB_ACTIONS;
  }
  if (process.env.GITLAB_CI) {
    return CI_PLATFORMS.GITLAB_CI;
  }
  if (process.env.JENKINS_HOME) {
    return CI_PLATFORMS.JENKINS;
  }
  if (process.env.CIRCLECI) {
    return CI_PLATFORMS.CIRCLECI;
  }
  if (process.env.TRAVIS) {
    return CI_PLATFORMS.TRAVIS;
  }
  if (process.env.TF_BUILD) {
    return CI_PLATFORMS.AZURE_DEVOPS;
  }
  return null;
}

/**
 * Set GitHub Actions output
 * @param {string} name - Output name
 * @param {string} value - Output value
 */
function setGitHubOutput(name, value) {
  if (process.env.GITHUB_OUTPUT) {
    const fs = require('fs');
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${value}\n`);
  } else {
    console.log(`::set-output name=${name}::${value}`);
  }
}

/**
 * Create GitHub Actions annotation
 * @param {string} level - Annotation level (notice, warning, error)
 * @param {string} message - Annotation message
 * @param {Object} options - Additional options
 */
function createGitHubAnnotation(level, message, options = {}) {
  const { file, line, title } = options;
  let annotation = `::${level}`;

  if (file) annotation += ` file=${file}`;
  if (line) annotation += `,line=${line}`;
  if (title) annotation += `,title=${title}`;

  annotation += `::${message}`;
  console.log(annotation);
}

/**
 * Set GitHub Actions step summary
 * @param {string} summary - Markdown summary
 */
function setGitHubSummary(summary) {
  if (process.env.GITHUB_STEP_SUMMARY) {
    const fs = require('fs');
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
  }
}

/**
 * Generate GitHub Actions summary
 * @param {Object} decision - Deployment decision
 * @param {Object} riskAssessment - Risk assessment
 * @returns {string} Markdown summary
 */
function generateGitHubSummary(decision, riskAssessment) {
  const {
    decision: type, riskScore, riskLevel, confidence,
  } = decision;

  let emoji = '✅';
  if (type === DECISIONS.BLOCK) emoji = '🚫';
  else if (type === DECISIONS.REQUIRE_APPROVAL) emoji = '⏸️';

  let summary = `# ${emoji} CodeGuard AI Analysis\n\n`;

  summary += `## Decision: ${type}\n\n`;
  summary += '| Metric | Value |\n';
  summary += '|--------|-------|\n';
  summary += `| Risk Score | ${riskScore.toFixed(1)}/100 |\n`;
  summary += `| Risk Level | ${riskLevel} |\n`;

  if (confidence !== undefined) {
    summary += `| Confidence | ${confidence.toFixed(1)}% |\n`;
  }

  summary += '\n## Risk Breakdown\n\n';
  summary += '| Component | Score |\n';
  summary += '|-----------|-------|\n';
  summary += `| Security | ${riskAssessment.components.security.score.toFixed(1)} |\n`;
  summary += `| Complexity | ${riskAssessment.components.complexity.score.toFixed(1)} |\n`;
  summary += `| File Criticality | ${riskAssessment.components.fileCriticality.score.toFixed(1)} |\n`;
  summary += `| Change Magnitude | ${riskAssessment.components.changeMagnitude.score.toFixed(1)} |\n`;
  summary += `| Patterns | ${riskAssessment.components.patterns.score.toFixed(1)} |\n`;

  if (type === DECISIONS.BLOCK) {
    summary += '\n## ⚠️ Deployment Blocked\n\n';
    summary += `**Reason:** ${decision.reason}\n\n`;

    if (decision.blockingFindings && decision.blockingFindings.length > 0) {
      summary += '### Blocking Issues\n\n';
      decision.blockingFindings.forEach((finding, i) => {
        summary += `${i + 1}. **[${finding.severity.toUpperCase()}]** ${finding.type}\n`;
        summary += `   - File: \`${finding.file}:${finding.line}\`\n`;
        summary += `   - ${finding.message}\n\n`;
      });
    }
  } else if (type === DECISIONS.REQUIRE_APPROVAL) {
    summary += '\n## 👥 Approval Required\n\n';
    summary += `**Reason:** ${decision.reason}\n\n`;

    if (decision.requiredApprovers && decision.requiredApprovers.length > 0) {
      summary += '### Required Approvers\n\n';
      decision.requiredApprovers.forEach((approver) => {
        summary += `- ${approver}\n`;
      });
      summary += '\n';
    }

    if (decision.deploymentConditions && decision.deploymentConditions.length > 0) {
      summary += '### Deployment Conditions\n\n';
      decision.deploymentConditions.forEach((condition) => {
        summary += `- [ ] ${condition}\n`;
      });
    }
  } else {
    summary += '\n## ✅ Auto-Approved\n\n';
    summary += `**Reason:** ${decision.reason}\n\n`;

    if (decision.recommendations && decision.recommendations.length > 0) {
      summary += '### Recommendations\n\n';
      decision.recommendations.forEach((rec) => {
        summary += `- ${rec}\n`;
      });
    }
  }

  return summary;
}

/**
 * Create GitHub Actions annotations for findings
 * @param {Array<Object>} securityFindings - Security findings
 */
function createSecurityAnnotations(securityFindings) {
  securityFindings.forEach((finding) => {
    const level = finding.severity === 'critical' || finding.severity === 'high'
      ? 'error'
      : 'warning';

    createGitHubAnnotation(level, finding.message, {
      file: finding.file,
      line: finding.line,
      title: `Security: ${finding.type}`,
    });
  });
}

/**
 * Process GitHub Actions integration
 * @param {Object} decision - Deployment decision
 * @param {Object} riskAssessment - Risk assessment
 * @param {Object} analysisResults - Analysis results
 */
function processGitHubActions(decision, riskAssessment, analysisResults) {
  logger.info('Processing GitHub Actions integration');

  // Set outputs
  setGitHubOutput('decision', decision.decision);
  setGitHubOutput('risk_score', decision.riskScore.toFixed(1));
  setGitHubOutput('risk_level', decision.riskLevel);

  if (decision.confidence !== undefined) {
    setGitHubOutput('confidence', decision.confidence.toFixed(1));
  }

  // Create annotations for security findings
  if (analysisResults.securityFindings && analysisResults.securityFindings.length > 0) {
    createSecurityAnnotations(analysisResults.securityFindings);
  }

  // Set step summary
  const summary = generateGitHubSummary(decision, riskAssessment);
  setGitHubSummary(summary);

  // Create overall annotation
  if (decision.decision === DECISIONS.BLOCK) {
    createGitHubAnnotation('error', decision.reason, {
      title: '🚫 Deployment Blocked',
    });
  } else if (decision.decision === DECISIONS.REQUIRE_APPROVAL) {
    createGitHubAnnotation('warning', decision.reason, {
      title: '⏸️ Approval Required',
    });
  } else {
    createGitHubAnnotation('notice', decision.reason, {
      title: '✅ Auto-Approved',
    });
  }
}

/**
 * Process GitLab CI integration
 * @param {Object} decision - Deployment decision
 * @param {Object} riskAssessment - Risk assessment
 */
function processGitLabCI(decision, riskAssessment) {
  logger.info('Processing GitLab CI integration');

  // GitLab CI uses dotenv for outputs
  const fs = require('fs');
  const dotenv = `CODEGUARD_DECISION=${decision.decision}
CODEGUARD_RISK_SCORE=${decision.riskScore.toFixed(1)}
CODEGUARD_RISK_LEVEL=${decision.riskLevel}
CODEGUARD_CONFIDENCE=${decision.confidence?.toFixed(1) || 'N/A'}
`;

  if (process.env.CI_PROJECT_DIR) {
    fs.writeFileSync(`${process.env.CI_PROJECT_DIR}/codeguard.env`, dotenv);
  }
}

/**
 * Process Jenkins integration
 * @param {Object} decision - Deployment decision
 * @param {Object} riskAssessment - Risk assessment
 */
function processJenkins(decision, riskAssessment) {
  logger.info('Processing Jenkins integration');

  // Jenkins can read from properties file
  const fs = require('fs');
  const properties = `codeguard.decision=${decision.decision}
codeguard.riskScore=${decision.riskScore.toFixed(1)}
codeguard.riskLevel=${decision.riskLevel}
codeguard.confidence=${decision.confidence?.toFixed(1) || 'N/A'}
`;

  fs.writeFileSync('codeguard.properties', properties);
}

/**
 * Determine exit code based on decision
 * @param {Object} decision - Deployment decision
 * @returns {number} Exit code
 */
function determineExitCode(decision) {
  switch (decision.decision) {
    case DECISIONS.BLOCK:
      return EXIT_CODES.BLOCKED;
    case DECISIONS.REQUIRE_APPROVAL:
      return EXIT_CODES.APPROVAL_REQUIRED;
    case DECISIONS.AUTO_APPROVE:
      return EXIT_CODES.SUCCESS;
    default:
      return EXIT_CODES.ERROR;
  }
}

/**
 * Simulate CI/CD pipeline integration
 * @param {Object} decision - Deployment decision
 * @param {Object} riskAssessment - Risk assessment
 * @param {Object} analysisResults - Analysis results
 * @returns {Object} CI simulation result
 */
function simulateCIPipeline(decision, riskAssessment, analysisResults) {
  const startTime = Date.now();
  const platform = detectCIPlatform();

  logger.info('Simulating CI/CD pipeline integration', { platform });

  // Process platform-specific integration
  try {
    if (platform === CI_PLATFORMS.GITHUB_ACTIONS) {
      processGitHubActions(decision, riskAssessment, analysisResults);
    } else if (platform === CI_PLATFORMS.GITLAB_CI) {
      processGitLabCI(decision, riskAssessment);
    } else if (platform === CI_PLATFORMS.JENKINS) {
      processJenkins(decision, riskAssessment);
    } else {
      logger.info('No specific CI platform detected, using generic output');
    }
  } catch (error) {
    logger.error('Error processing CI integration', error);
  }

  const exitCode = determineExitCode(decision);
  const duration = Date.now() - startTime;

  const result = {
    platform: platform || 'unknown',
    exitCode,
    decision: decision.decision,
    riskScore: decision.riskScore,
    riskLevel: decision.riskLevel,
    duration,
    timestamp: new Date().toISOString(),
  };

  logger.info('CI pipeline simulation completed', result);

  return result;
}

/**
 * Exit process with appropriate code
 * @param {number} exitCode - Exit code
 * @param {string} message - Exit message
 */
function exitWithCode(exitCode, message) {
  if (exitCode === EXIT_CODES.SUCCESS) {
    console.log(`\n✅ ${message}`);
  } else if (exitCode === EXIT_CODES.APPROVAL_REQUIRED) {
    console.log(`\n⏸️  ${message}`);
  } else if (exitCode === EXIT_CODES.BLOCKED) {
    console.error(`\n🚫 ${message}`);
  } else {
    console.error(`\n❌ ${message}`);
  }

  logger.info('Exiting with code', { exitCode, message });
  process.exit(exitCode);
}

/**
 * Generate CI/CD configuration snippet
 * @param {string} platform - CI platform
 * @returns {string} Configuration snippet
 */
function generateCIConfig(platform) {
  const configs = {
    [CI_PLATFORMS.GITHUB_ACTIONS]: `
# .github/workflows/codeguard.yml
name: CodeGuard AI Analysis
on: [pull_request]

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install CodeGuard AI
        run: npm install
      
      - name: Generate diff
        run: git diff origin/main...HEAD > changes.diff
      
      - name: Run CodeGuard AI
        id: codeguard
        run: node src/index.js changes.diff
      
      - name: Check decision
        if: steps.codeguard.outputs.decision == 'BLOCK'
        run: exit 1
`,
    [CI_PLATFORMS.GITLAB_CI]: `
# .gitlab-ci.yml
codeguard:
  stage: test
  image: node:18
  script:
    - npm install
    - git diff origin/main...HEAD > changes.diff
    - node src/index.js changes.diff
  artifacts:
    reports:
      dotenv: codeguard.env
  rules:
    - if: '$CI_PIPELINE_SOURCE == "merge_request_event"'
`,
    [CI_PLATFORMS.JENKINS]: `
// Jenkinsfile
pipeline {
  agent any
  stages {
    stage('CodeGuard Analysis') {
      steps {
        sh 'npm install'
        sh 'git diff origin/main...HEAD > changes.diff'
        sh 'node src/index.js changes.diff'
        script {
          def props = readProperties file: 'codeguard.properties'
          if (props['codeguard.decision'] == 'BLOCK') {
            error('Deployment blocked by CodeGuard AI')
          }
        }
      }
    }
  }
}
`,
  };

  return configs[platform] || '# Platform-specific configuration not available';
}

module.exports = {
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
};

// Made with Bob
