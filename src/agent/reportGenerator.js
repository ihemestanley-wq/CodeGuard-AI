/**
 * CodeGuard AI - Report Generator
 * Generates comprehensive deployment risk reports
 */

const logger = require('../observability/logger');
const { getRiskLevelColor, getRiskLevelEmoji } = require('./riskEngine');

/**
 * Format timestamp
 * @returns {string} Formatted timestamp
 */
function formatTimestamp() {
  return new Date().toISOString();
}

/**
 * Generate executive summary
 * @param {Object} riskAssessment - Risk assessment data
 * @returns {string} Executive summary section
 */
function generateExecutiveSummary(riskAssessment) {
  const { score, level, components, metadata } = riskAssessment;
  const emoji = getRiskLevelEmoji(level);
  
  return `
═══════════════════════════════════════════════════════════════════════════
                        CODEGUARD AI ANALYSIS REPORT
═══════════════════════════════════════════════════════════════════════════

1. EXECUTIVE SUMMARY
${emoji} Risk Level: ${level}
📊 Risk Score: ${score.toFixed(1)}/100
📁 Files Changed: ${metadata.filesChanged}
➕ Lines Added: ${metadata.totalAdditions}
➖ Lines Deleted: ${metadata.totalDeletions}
⏱️  Analysis Duration: ${metadata.duration}ms
📅 Generated: ${formatTimestamp()}

RISK BREAKDOWN:
  • Security Risk: ${components.security.score.toFixed(1)} points (${components.security.total} findings)
  • Complexity Risk: ${components.complexity.score.toFixed(1)} points (${components.complexity.total} issues)
  • File Criticality: ${components.fileCriticality.score.toFixed(1)} points (${components.fileCriticality.criticalFiles} critical files)
  • Change Magnitude: ${components.changeMagnitude.score.toFixed(1)} points (${components.changeMagnitude.level})
  • Pattern Risk: ${components.patterns.score.toFixed(1)} points (${components.patterns.count} patterns)
`;
}

/**
 * Generate security findings section
 * @param {Array<Object>} securityFindings - Security findings
 * @returns {string} Security findings section
 */
function generateSecurityFindings(securityFindings) {
  if (securityFindings.length === 0) {
    return `
2. SECURITY FINDINGS
✅ No security issues detected.
`;
  }

  const critical = securityFindings.filter(f => f.severity === 'critical');
  const high = securityFindings.filter(f => f.severity === 'high');
  const medium = securityFindings.filter(f => f.severity === 'medium');
  const low = securityFindings.filter(f => f.severity === 'low');

  let section = `
2. SECURITY FINDINGS
🚨 Total Issues: ${securityFindings.length}
   • Critical: ${critical.length}
   • High: ${high.length}
   • Medium: ${medium.length}
   • Low: ${low.length}

`;

  // List critical and high severity findings
  const importantFindings = [...critical, ...high];
  if (importantFindings.length > 0) {
    section += 'CRITICAL & HIGH SEVERITY ISSUES:\n';
    importantFindings.forEach((finding, index) => {
      section += `
  ${index + 1}. [${finding.severity.toUpperCase()}] ${finding.type}
     File: ${finding.file}:${finding.line}
     Message: ${finding.message}
     Code: ${finding.code || 'N/A'}
`;
    });
  }

  return section;
}

/**
 * Generate complexity analysis section
 * @param {Array<Object>} complexityIssues - Complexity issues
 * @returns {string} Complexity analysis section
 */
function generateComplexityAnalysis(complexityIssues) {
  if (complexityIssues.length === 0) {
    return `
3. COMPLEXITY ANALYSIS
✅ No complexity issues detected.
`;
  }

  let section = `
3. COMPLEXITY ANALYSIS
⚠️  High Complexity Functions: ${complexityIssues.length}

`;

  complexityIssues.forEach((issue, index) => {
    section += `
  ${index + 1}. ${issue.file}
     Complexity: ${issue.complexity} (threshold: ${issue.threshold})
     Message: ${issue.message}
`;
  });

  return section;
}

/**
 * Generate file criticality section
 * @param {Object} fileCriticalityRisk - File criticality data
 * @returns {string} File criticality section
 */
function generateFileCriticality(fileCriticalityRisk) {
  const { breakdown } = fileCriticalityRisk;
  
  let section = `
4. FILE CRITICALITY ASSESSMENT
📂 Critical Files: ${breakdown.critical.length}
📂 High Priority Files: ${breakdown.high.length}
📂 Medium Priority Files: ${breakdown.medium.length}
📂 Low Priority Files: ${breakdown.low.length}

`;

  if (breakdown.critical.length > 0) {
    section += 'CRITICAL FILES:\n';
    breakdown.critical.forEach(file => {
      section += `  🚨 ${file}\n`;
    });
    section += '\n';
  }

  if (breakdown.high.length > 0) {
    section += 'HIGH PRIORITY FILES:\n';
    breakdown.high.forEach(file => {
      section += `  ⚠️  ${file}\n`;
    });
    section += '\n';
  }

  return section;
}

/**
 * Generate change magnitude section
 * @param {Object} changeMagnitude - Change magnitude data
 * @returns {string} Change magnitude section
 */
function generateChangeMagnitude(changeMagnitude) {
  const { level, totalChanges } = changeMagnitude;
  
  let emoji = '📝';
  if (level === 'massive') emoji = '🔥';
  else if (level === 'large') emoji = '📊';
  else if (level === 'medium') emoji = '📈';
  
  return `
5. CHANGE MAGNITUDE
${emoji} Change Level: ${level.toUpperCase()}
📏 Total Lines Changed: ${totalChanges}

IMPACT ASSESSMENT:
${level === 'massive' ? '  ⚠️  MASSIVE changes detected - requires thorough review' : ''}
${level === 'large' ? '  ⚠️  LARGE changes detected - careful review recommended' : ''}
${level === 'medium' ? '  ℹ️  MEDIUM changes - standard review process' : ''}
${level === 'small' ? '  ✅ SMALL changes - low risk' : ''}
`;
}

/**
 * Generate semantic patterns section
 * @param {Object} patternRisk - Pattern risk data
 * @returns {string} Semantic patterns section
 */
function generateSemanticPatterns(patternRisk) {
  if (patternRisk.patterns.length === 0) {
    return `
6. SEMANTIC PATTERNS
✅ No high-risk patterns detected.
`;
  }

  let section = `
6. SEMANTIC PATTERNS
🔍 Detected Patterns: ${patternRisk.count}

`;

  const patternDescriptions = {
    databaseSchema: '🗄️  Database Schema Changes - Requires migration planning',
    apiContract: '🔌 API Contract Changes - May break client integrations',
    authentication: '🔐 Authentication Changes - Critical security impact',
    authorization: '🛡️  Authorization Changes - Access control modifications',
    dataValidation: '✓ Data Validation Changes - Input handling modifications',
    errorHandling: '⚠️  Error Handling Changes - Exception management updates',
    logging: '📝 Logging Changes - Observability modifications',
  };

  patternRisk.patterns.forEach(pattern => {
    section += `  ${patternDescriptions[pattern] || `• ${pattern}`}\n`;
  });

  return section;
}

/**
 * Generate deployment recommendations section
 * @param {Object} riskAssessment - Risk assessment data
 * @returns {string} Recommendations section
 */
function generateRecommendations(riskAssessment) {
  const { level, components } = riskAssessment;
  const recommendations = [];

  // Security recommendations
  if (components.security.breakdown.critical > 0) {
    recommendations.push('🚨 CRITICAL: Address all critical security vulnerabilities before deployment');
  }
  if (components.security.breakdown.high > 0) {
    recommendations.push('⚠️  HIGH: Review and fix high-severity security issues');
  }

  // Complexity recommendations
  if (components.complexity.breakdown.high > 0) {
    recommendations.push('📊 Refactor high-complexity functions to improve maintainability');
  }

  // File criticality recommendations
  if (components.fileCriticality.criticalFiles > 0) {
    recommendations.push('🔍 Extra scrutiny required for changes to critical files');
    recommendations.push('👥 Require additional code review approvals');
  }

  // Change magnitude recommendations
  if (components.changeMagnitude.level === 'massive' || components.changeMagnitude.level === 'large') {
    recommendations.push('📋 Break down large changes into smaller, reviewable chunks');
    recommendations.push('🧪 Ensure comprehensive test coverage for all changes');
  }

  // Pattern-specific recommendations
  if (components.patterns.patterns.includes('databaseSchema')) {
    recommendations.push('🗄️  Prepare database migration rollback plan');
    recommendations.push('📊 Test migrations in staging environment first');
  }
  if (components.patterns.patterns.includes('apiContract')) {
    recommendations.push('🔌 Notify API consumers of contract changes');
    recommendations.push('📝 Update API documentation');
  }
  if (components.patterns.patterns.includes('authentication') || components.patterns.patterns.includes('authorization')) {
    recommendations.push('🔐 Conduct security audit before deployment');
    recommendations.push('🧪 Perform penetration testing');
  }

  // General recommendations based on risk level
  if (level === 'CRITICAL') {
    recommendations.push('🛑 BLOCK deployment until critical issues are resolved');
    recommendations.push('👥 Require senior engineer approval');
  } else if (level === 'HIGH') {
    recommendations.push('⏸️  Consider delaying deployment for additional review');
    recommendations.push('📊 Increase monitoring during deployment');
  } else if (level === 'MEDIUM') {
    recommendations.push('✅ Proceed with standard deployment process');
    recommendations.push('👀 Monitor closely post-deployment');
  } else {
    recommendations.push('✅ Low risk - safe to deploy');
    recommendations.push('📊 Standard monitoring sufficient');
  }

  let section = `
7. DEPLOYMENT RECOMMENDATIONS

`;

  recommendations.forEach((rec, index) => {
    section += `  ${index + 1}. ${rec}\n`;
  });

  return section;
}

/**
 * Generate testing requirements section
 * @param {Object} riskAssessment - Risk assessment data
 * @returns {string} Testing requirements section
 */
function generateTestingRequirements(riskAssessment) {
  const { level, components } = riskAssessment;
  const requirements = [];

  if (components.security.total > 0) {
    requirements.push('🔒 Security testing for identified vulnerabilities');
    requirements.push('🧪 Penetration testing for authentication/authorization changes');
  }

  if (components.complexity.total > 0) {
    requirements.push('📊 Unit tests for complex functions');
    requirements.push('🔄 Integration tests for refactored code');
  }

  if (components.patterns.patterns.includes('databaseSchema')) {
    requirements.push('🗄️  Database migration testing');
    requirements.push('↩️  Rollback procedure testing');
  }

  if (components.patterns.patterns.includes('apiContract')) {
    requirements.push('🔌 API contract testing');
    requirements.push('🔄 Backward compatibility testing');
  }

  if (level === 'CRITICAL' || level === 'HIGH') {
    requirements.push('🎯 End-to-end testing required');
    requirements.push('📊 Performance testing recommended');
    requirements.push('🔍 Manual QA review required');
  }

  requirements.push('✅ All existing tests must pass');
  requirements.push('📈 Code coverage should not decrease');

  let section = `
8. TESTING REQUIREMENTS

`;

  requirements.forEach((req, index) => {
    section += `  ${index + 1}. ${req}\n`;
  });

  return section;
}

/**
 * Generate monitoring requirements section
 * @param {Object} riskAssessment - Risk assessment data
 * @returns {string} Monitoring requirements section
 */
function generateMonitoringRequirements(riskAssessment) {
  const { level, components } = riskAssessment;
  const requirements = [];

  requirements.push('📊 Monitor error rates post-deployment');
  requirements.push('⏱️  Track response time metrics');
  requirements.push('📈 Monitor resource utilization');

  if (components.security.total > 0) {
    requirements.push('🔒 Monitor security logs for anomalies');
    requirements.push('🚨 Set up alerts for suspicious activity');
  }

  if (components.patterns.patterns.includes('databaseSchema')) {
    requirements.push('🗄️  Monitor database performance');
    requirements.push('📊 Track query execution times');
  }

  if (components.patterns.patterns.includes('apiContract')) {
    requirements.push('🔌 Monitor API error rates');
    requirements.push('📉 Track API usage patterns');
  }

  if (level === 'CRITICAL' || level === 'HIGH') {
    requirements.push('👀 Continuous monitoring for first 24 hours');
    requirements.push('📱 On-call engineer assigned');
    requirements.push('🔔 Enhanced alerting enabled');
  }

  let section = `
9. MONITORING REQUIREMENTS

`;

  requirements.forEach((req, index) => {
    section += `  ${index + 1}. ${req}\n`;
  });

  return section;
}

/**
 * Generate rollback plan section
 * @param {Object} riskAssessment - Risk assessment data
 * @returns {string} Rollback plan section
 */
function generateRollbackPlan(riskAssessment) {
  const { level, components } = riskAssessment;
  
  let section = `
10. ROLLBACK PLAN

`;

  if (level === 'CRITICAL' || level === 'HIGH') {
    section += `⚠️  HIGH RISK DEPLOYMENT - Detailed rollback plan required

ROLLBACK TRIGGERS:
  • Error rate increases by >10%
  • Response time degrades by >20%
  • Security incidents detected
  • Critical functionality broken

ROLLBACK PROCEDURE:
  1. 🔄 Revert to previous deployment
  2. 🗄️  Rollback database migrations (if applicable)
  3. 🔌 Restore previous API version
  4. 📊 Verify system stability
  5. 📝 Document rollback reason
  6. 👥 Notify stakeholders

`;
  } else {
    section += `✅ Standard rollback procedures apply

ROLLBACK TRIGGERS:
  • Critical bugs detected
  • Performance degradation
  • User-reported issues

ROLLBACK PROCEDURE:
  1. 🔄 Revert to previous deployment
  2. 📊 Verify system stability
  3. 📝 Document rollback reason

`;
  }

  if (components.patterns.patterns.includes('databaseSchema')) {
    section += `DATABASE ROLLBACK:
  ⚠️  Database schema changes detected
  • Prepare rollback migration scripts
  • Test rollback in staging environment
  • Backup database before deployment
  • Document data migration steps

`;
  }

  return section;
}

/**
 * Generate approval requirements section
 * @param {Object} riskAssessment - Risk assessment data
 * @returns {string} Approval requirements section
 */
function generateApprovalRequirements(riskAssessment) {
  const { level, components } = riskAssessment;
  
  let section = `
11. APPROVAL REQUIREMENTS

`;

  if (level === 'CRITICAL') {
    section += `🚨 CRITICAL RISK - Enhanced approval required

REQUIRED APPROVALS:
  ✓ Senior Engineer Review
  ✓ Security Team Review
  ✓ Architecture Team Review
  ✓ Product Owner Approval
  ✓ CTO/VP Engineering Sign-off

ADDITIONAL REQUIREMENTS:
  • Security audit completed
  • All critical issues resolved
  • Comprehensive test coverage
  • Detailed deployment plan
  • Rollback plan documented
  • Stakeholder notification sent

`;
  } else if (level === 'HIGH') {
    section += `⚠️  HIGH RISK - Additional approval required

REQUIRED APPROVALS:
  ✓ Senior Engineer Review
  ✓ Team Lead Approval
  ${components.security.total > 0 ? '✓ Security Team Review\n  ' : ''}${components.patterns.patterns.includes('databaseSchema') ? '✓ Database Team Review\n  ' : ''}
ADDITIONAL REQUIREMENTS:
  • All high-severity issues addressed
  • Test coverage adequate
  • Deployment plan reviewed
  • Monitoring plan in place

`;
  } else if (level === 'MEDIUM') {
    section += `⚡ MEDIUM RISK - Standard approval required

REQUIRED APPROVALS:
  ✓ Peer Code Review (2 approvals)
  ✓ Team Lead Approval

ADDITIONAL REQUIREMENTS:
  • All tests passing
  • Code review comments addressed
  • Documentation updated

`;
  } else {
    section += `✅ LOW RISK - Standard process

REQUIRED APPROVALS:
  ✓ Peer Code Review (1 approval)

ADDITIONAL REQUIREMENTS:
  • All tests passing
  • Basic code review completed

`;
  }

  return section;
}

/**
 * Generate complete report
 * @param {Object} riskAssessment - Risk assessment data
 * @param {Object} analysisResults - Analysis results
 * @returns {string} Complete formatted report
 */
function generateReport(riskAssessment, analysisResults) {
  const startTime = Date.now();

  const report = 
    generateExecutiveSummary(riskAssessment) +
    generateSecurityFindings(analysisResults.securityFindings || []) +
    generateComplexityAnalysis(analysisResults.complexityIssues || []) +
    generateFileCriticality(riskAssessment.components.fileCriticality) +
    generateChangeMagnitude(riskAssessment.components.changeMagnitude) +
    generateSemanticPatterns(riskAssessment.components.patterns) +
    generateRecommendations(riskAssessment) +
    generateTestingRequirements(riskAssessment) +
    generateMonitoringRequirements(riskAssessment) +
    generateRollbackPlan(riskAssessment) +
    generateApprovalRequirements(riskAssessment) +
    `
═══════════════════════════════════════════════════════════════════════════
                          END OF REPORT
═══════════════════════════════════════════════════════════════════════════
`;

  const duration = Date.now() - startTime;
  logger.info('Report generated', { duration });

  return report;
}

/**
 * Generate JSON report
 * @param {Object} riskAssessment - Risk assessment data
 * @param {Object} analysisResults - Analysis results
 * @returns {Object} JSON report
 */
function generateJSONReport(riskAssessment, analysisResults) {
  return {
    timestamp: formatTimestamp(),
    riskAssessment,
    analysisResults,
    version: '1.0.0',
  };
}

module.exports = {
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
};

// Made with Bob
