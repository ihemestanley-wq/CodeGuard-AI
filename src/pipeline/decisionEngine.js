/**
 * CodeGuard AI - Decision Engine
 * Makes deployment decisions based on risk assessment
 */

const logger = require('../observability/logger');

// Decision types
const DECISIONS = {
  BLOCK: 'BLOCK',
  REQUIRE_APPROVAL: 'REQUIRE_APPROVAL',
  AUTO_APPROVE: 'AUTO_APPROVE',
};

// Decision thresholds
const THRESHOLDS = {
  BLOCK: 80,           // Block if risk score >= 80
  REQUIRE_APPROVAL: 40, // Require approval if risk score >= 40
  AUTO_APPROVE: 40,    // Auto-approve if risk score < 40
};

// Critical security types that always block
const BLOCKING_SECURITY_TYPES = [
  'sql_injection',
  'command_injection',
  'hardcoded_secret',
];

/**
 * Check if deployment should be blocked due to security
 * @param {Array<Object>} securityFindings - Security findings
 * @returns {Object} Block decision info
 */
function checkSecurityBlock(securityFindings) {
  const criticalFindings = securityFindings.filter(
    f => f.severity === 'critical'
  );

  const blockingFindings = securityFindings.filter(
    f => BLOCKING_SECURITY_TYPES.includes(f.type)
  );

  if (criticalFindings.length > 0 || blockingFindings.length > 0) {
    return {
      shouldBlock: true,
      reason: 'Critical security vulnerabilities detected',
      findings: [...criticalFindings, ...blockingFindings],
    };
  }

  return { shouldBlock: false };
}

/**
 * Check if deployment should be blocked due to critical files
 * @param {Object} fileCriticalityRisk - File criticality data
 * @param {number} riskScore - Overall risk score
 * @returns {Object} Block decision info
 */
function checkCriticalFilesBlock(fileCriticalityRisk, riskScore) {
  const { breakdown } = fileCriticalityRisk;
  
  // Block if critical files are changed and risk is high
  if (breakdown.critical.length > 0 && riskScore >= THRESHOLDS.REQUIRE_APPROVAL) {
    return {
      shouldBlock: false, // Don't block, but require approval
      requiresApproval: true,
      reason: 'Critical files modified with elevated risk',
      files: breakdown.critical,
    };
  }

  return { shouldBlock: false, requiresApproval: false };
}

/**
 * Check if deployment should be blocked due to patterns
 * @param {Object} patternRisk - Pattern risk data
 * @param {number} riskScore - Overall risk score
 * @returns {Object} Block decision info
 */
function checkPatternBlock(patternRisk, riskScore) {
  const { patterns } = patternRisk;
  
  const criticalPatterns = [
    'databaseSchema',
    'authentication',
    'authorization',
  ];

  const hasCriticalPattern = patterns.some(p => criticalPatterns.includes(p));

  if (hasCriticalPattern && riskScore >= THRESHOLDS.REQUIRE_APPROVAL) {
    return {
      shouldBlock: false,
      requiresApproval: true,
      reason: 'Critical patterns detected requiring review',
      patterns: patterns.filter(p => criticalPatterns.includes(p)),
    };
  }

  return { shouldBlock: false, requiresApproval: false };
}

/**
 * Determine required approvers based on risk
 * @param {Object} riskAssessment - Risk assessment data
 * @param {Object} analysisResults - Analysis results
 * @returns {Array<string>} List of required approvers
 */
function determineRequiredApprovers(riskAssessment, analysisResults) {
  const { level, components } = riskAssessment;
  const approvers = [];

  // Always require peer review
  approvers.push('peer-review');

  if (level === 'CRITICAL') {
    approvers.push('senior-engineer');
    approvers.push('security-team');
    approvers.push('architecture-team');
    approvers.push('cto');
  } else if (level === 'HIGH') {
    approvers.push('senior-engineer');
    approvers.push('team-lead');
    
    if (components.security.total > 0) {
      approvers.push('security-team');
    }
    
    if (components.patterns.patterns.includes('databaseSchema')) {
      approvers.push('database-team');
    }
  } else if (level === 'MEDIUM') {
    approvers.push('team-lead');
  }

  return [...new Set(approvers)]; // Remove duplicates
}

/**
 * Generate deployment conditions
 * @param {Object} riskAssessment - Risk assessment data
 * @param {Object} analysisResults - Analysis results
 * @returns {Array<string>} List of conditions
 */
function generateDeploymentConditions(riskAssessment, analysisResults) {
  const { level, components } = riskAssessment;
  const conditions = [];

  // Always require tests to pass
  conditions.push('All tests must pass');

  if (level === 'CRITICAL' || level === 'HIGH') {
    conditions.push('Security audit completed');
    conditions.push('Manual QA testing completed');
    conditions.push('Rollback plan documented');
    conditions.push('Monitoring alerts configured');
  }

  if (components.security.breakdown.critical > 0) {
    conditions.push('All critical security issues resolved');
  }

  if (components.security.breakdown.high > 0) {
    conditions.push('All high-severity security issues addressed');
  }

  if (components.complexity.breakdown.high > 0) {
    conditions.push('High-complexity functions reviewed');
  }

  if (components.patterns.patterns.includes('databaseSchema')) {
    conditions.push('Database migration tested in staging');
    conditions.push('Rollback migration prepared');
  }

  if (components.patterns.patterns.includes('apiContract')) {
    conditions.push('API documentation updated');
    conditions.push('API consumers notified');
  }

  if (components.changeMagnitude.level === 'massive') {
    conditions.push('Changes broken down into smaller deployments');
  }

  return conditions;
}

/**
 * Calculate deployment confidence score
 * @param {Object} riskAssessment - Risk assessment data
 * @param {Object} analysisResults - Analysis results
 * @returns {number} Confidence score (0-100)
 */
function calculateDeploymentConfidence(riskAssessment, analysisResults) {
  const { score, components } = riskAssessment;
  
  // Start with inverse of risk score
  let confidence = 100 - score;

  // Adjust based on security findings
  if (components.security.breakdown.critical > 0) {
    confidence -= 20;
  }
  if (components.security.breakdown.high > 0) {
    confidence -= 10;
  }

  // Adjust based on complexity
  if (components.complexity.breakdown.high > 0) {
    confidence -= 5;
  }

  // Adjust based on change magnitude
  if (components.changeMagnitude.level === 'massive') {
    confidence -= 10;
  } else if (components.changeMagnitude.level === 'large') {
    confidence -= 5;
  }

  // Ensure confidence is within bounds
  return Math.max(0, Math.min(100, confidence));
}

/**
 * Make deployment decision
 * @param {Object} riskAssessment - Risk assessment data
 * @param {Object} analysisResults - Analysis results
 * @returns {Object} Deployment decision
 */
function makeDeploymentDecision(riskAssessment, analysisResults) {
  const startTime = Date.now();
  const { score, level, components } = riskAssessment;

  logger.info('Making deployment decision', {
    riskScore: score,
    riskLevel: level,
  });

  // Check for blocking conditions
  const securityBlock = checkSecurityBlock(analysisResults.securityFindings || []);
  if (securityBlock.shouldBlock) {
    const decision = {
      decision: DECISIONS.BLOCK,
      reason: securityBlock.reason,
      riskScore: score,
      riskLevel: level,
      blockingFindings: securityBlock.findings,
      confidence: 0,
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
    };

    logger.warn('Deployment blocked', {
      reason: decision.reason,
      findings: securityBlock.findings.length,
    });

    return decision;
  }

  // Check if risk score exceeds block threshold
  if (score >= THRESHOLDS.BLOCK) {
    const decision = {
      decision: DECISIONS.BLOCK,
      reason: `Risk score (${score.toFixed(1)}) exceeds blocking threshold (${THRESHOLDS.BLOCK})`,
      riskScore: score,
      riskLevel: level,
      requiredActions: [
        'Address critical security issues',
        'Reduce code complexity',
        'Break down large changes',
        'Obtain senior engineering approval',
      ],
      confidence: 0,
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
    };

    logger.warn('Deployment blocked due to high risk', {
      riskScore: score,
    });

    return decision;
  }

  // Check for approval requirements
  const criticalFilesCheck = checkCriticalFilesBlock(components.fileCriticality, score);
  const patternCheck = checkPatternBlock(components.patterns, score);

  const requiresApproval = 
    score >= THRESHOLDS.REQUIRE_APPROVAL ||
    criticalFilesCheck.requiresApproval ||
    patternCheck.requiresApproval;

  if (requiresApproval) {
    const approvers = determineRequiredApprovers(riskAssessment, analysisResults);
    const conditions = generateDeploymentConditions(riskAssessment, analysisResults);
    const confidence = calculateDeploymentConfidence(riskAssessment, analysisResults);

    const decision = {
      decision: DECISIONS.REQUIRE_APPROVAL,
      reason: `Risk score (${score.toFixed(1)}) requires manual approval`,
      riskScore: score,
      riskLevel: level,
      requiredApprovers: approvers,
      deploymentConditions: conditions,
      confidence,
      criticalFiles: criticalFilesCheck.files || [],
      criticalPatterns: patternCheck.patterns || [],
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
    };

    logger.info('Deployment requires approval', {
      riskScore: score,
      approvers: approvers.length,
      conditions: conditions.length,
    });

    return decision;
  }

  // Auto-approve low-risk deployments
  const confidence = calculateDeploymentConfidence(riskAssessment, analysisResults);
  const decision = {
    decision: DECISIONS.AUTO_APPROVE,
    reason: `Low risk score (${score.toFixed(1)}) - safe to deploy`,
    riskScore: score,
    riskLevel: level,
    confidence,
    recommendations: [
      'Monitor deployment closely',
      'Verify all tests pass',
      'Check logs for errors',
    ],
    timestamp: new Date().toISOString(),
    duration: Date.now() - startTime,
  };

  logger.info('Deployment auto-approved', {
    riskScore: score,
    confidence,
  });

  return decision;
}

/**
 * Format decision for display
 * @param {Object} decision - Deployment decision
 * @returns {string} Formatted decision
 */
function formatDecision(decision) {
  const { decision: type, reason, riskScore, riskLevel, confidence } = decision;

  let output = `
═══════════════════════════════════════════════════════════════════════════
                        DEPLOYMENT DECISION
═══════════════════════════════════════════════════════════════════════════

`;

  if (type === DECISIONS.BLOCK) {
    output += `🚫 DECISION: DEPLOYMENT BLOCKED

❌ Reason: ${reason}
📊 Risk Score: ${riskScore.toFixed(1)}/100
⚠️  Risk Level: ${riskLevel}

`;
    if (decision.blockingFindings) {
      output += `BLOCKING ISSUES:\n`;
      decision.blockingFindings.forEach((finding, i) => {
        output += `  ${i + 1}. [${finding.severity.toUpperCase()}] ${finding.type}\n`;
        output += `     ${finding.file}:${finding.line}\n`;
        output += `     ${finding.message}\n\n`;
      });
    }

    if (decision.requiredActions) {
      output += `REQUIRED ACTIONS:\n`;
      decision.requiredActions.forEach((action, i) => {
        output += `  ${i + 1}. ${action}\n`;
      });
    }

  } else if (type === DECISIONS.REQUIRE_APPROVAL) {
    output += `⏸️  DECISION: MANUAL APPROVAL REQUIRED

⚠️  Reason: ${reason}
📊 Risk Score: ${riskScore.toFixed(1)}/100
⚠️  Risk Level: ${riskLevel}
💯 Confidence: ${confidence.toFixed(1)}%

REQUIRED APPROVERS:
`;
    decision.requiredApprovers.forEach((approver, i) => {
      output += `  ${i + 1}. ${approver}\n`;
    });

    output += `\nDEPLOYMENT CONDITIONS:\n`;
    decision.deploymentConditions.forEach((condition, i) => {
      output += `  ${i + 1}. ${condition}\n`;
    });

    if (decision.criticalFiles && decision.criticalFiles.length > 0) {
      output += `\nCRITICAL FILES:\n`;
      decision.criticalFiles.forEach(file => {
        output += `  • ${file}\n`;
      });
    }

  } else {
    output += `✅ DECISION: AUTO-APPROVED

✓ Reason: ${reason}
📊 Risk Score: ${riskScore.toFixed(1)}/100
✅ Risk Level: ${riskLevel}
💯 Confidence: ${confidence.toFixed(1)}%

RECOMMENDATIONS:
`;
    decision.recommendations.forEach((rec, i) => {
      output += `  ${i + 1}. ${rec}\n`;
    });
  }

  output += `
═══════════════════════════════════════════════════════════════════════════
`;

  return output;
}

module.exports = {
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
};

// Made with Bob
