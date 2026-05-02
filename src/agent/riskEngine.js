/**
 * CodeGuard AI - Risk Engine
 * Calculates deployment risk scores based on analysis results
 */

const logger = require('../observability/logger');

// Risk scoring weights
const WEIGHTS = {
  // Security findings
  security: {
    critical: 50,
    high: 30,
    medium: 15,
    low: 5,
  },

  // Code complexity
  complexity: {
    high: 20,
    medium: 10,
    low: 5,
  },

  // Change magnitude
  changeMagnitude: {
    massive: 25, // >1000 lines
    large: 15, // 500-1000 lines
    medium: 8, // 100-500 lines
    small: 3, // <100 lines
  },

  // File criticality
  fileCriticality: {
    critical: 20, // auth, payment, security
    high: 12, // core business logic
    medium: 6, // utilities, helpers
    low: 2, // tests, docs
  },

  // Change patterns
  patterns: {
    databaseSchema: 15,
    apiContract: 12,
    authentication: 20,
    authorization: 18,
    dataValidation: 10,
    errorHandling: 8,
    logging: 5,
  },
};

// Risk thresholds
const RISK_THRESHOLDS = {
  critical: 80,
  high: 60,
  medium: 40,
  low: 20,
};

// Critical file patterns
const CRITICAL_FILES = {
  authentication: [
    /auth/i,
    /login/i,
    /session/i,
    /jwt/i,
    /oauth/i,
    /passport/i,
  ],
  payment: [
    /payment/i,
    /billing/i,
    /checkout/i,
    /stripe/i,
    /paypal/i,
  ],
  security: [
    /security/i,
    /crypto/i,
    /encrypt/i,
    /hash/i,
    /permission/i,
    /role/i,
  ],
  database: [
    /migration/i,
    /schema/i,
    /model/i,
    /entity/i,
  ],
  api: [
    /api/i,
    /endpoint/i,
    /route/i,
    /controller/i,
  ],
  config: [
    /config/i,
    /env/i,
    /settings/i,
  ],
};

// Semantic patterns for risk assessment
const SEMANTIC_PATTERNS = {
  databaseSchema: [
    /CREATE\s+TABLE/i,
    /ALTER\s+TABLE/i,
    /DROP\s+TABLE/i,
    /ADD\s+COLUMN/i,
    /DROP\s+COLUMN/i,
    /CREATE\s+INDEX/i,
  ],
  apiContract: [
    /app\.(get|post|put|delete|patch)\(/i,
    /router\.(get|post|put|delete|patch)\(/i,
    /@(Get|Post|Put|Delete|Patch)\(/i,
    /export\s+(interface|type)\s+\w+Request/i,
    /export\s+(interface|type)\s+\w+Response/i,
  ],
  authentication: [
    /passport\./i,
    /jwt\.sign/i,
    /bcrypt\./i,
    /authenticate/i,
    /verifyToken/i,
  ],
  authorization: [
    /authorize/i,
    /checkPermission/i,
    /hasRole/i,
    /canAccess/i,
    /isAdmin/i,
  ],
  dataValidation: [
    /validate/i,
    /sanitize/i,
    /schema\./i,
    /yup\./i,
    /joi\./i,
  ],
};

/**
 * Determine file criticality
 * @param {string} filePath - File path
 * @returns {string} Criticality level
 */
function determineFileCriticality(filePath) {
  const lowerPath = filePath.toLowerCase();

  // Check critical patterns
  for (const [category, patterns] of Object.entries(CRITICAL_FILES)) {
    for (const pattern of patterns) {
      if (pattern.test(lowerPath)) {
        if (category === 'authentication' || category === 'payment' || category === 'security') {
          return 'critical';
        }
        if (category === 'database' || category === 'api') {
          return 'high';
        }
        if (category === 'config') {
          return 'medium';
        }
      }
    }
  }

  // Check for test files
  if (/\.(test|spec)\.(js|ts|jsx|tsx)$/i.test(lowerPath) || /\/__tests__\//i.test(lowerPath)) {
    return 'low';
  }

  // Check for documentation
  if (/\.(md|txt|doc)$/i.test(lowerPath) || /\/docs?\//i.test(lowerPath)) {
    return 'low';
  }

  // Default to medium
  return 'medium';
}

/**
 * Calculate change magnitude score
 * @param {number} additions - Number of added lines
 * @param {number} deletions - Number of deleted lines
 * @returns {Object} Magnitude info
 */
function calculateChangeMagnitude(additions, deletions) {
  const totalChanges = additions + deletions;

  let level;
  let score;

  if (totalChanges > 1000) {
    level = 'massive';
    score = WEIGHTS.changeMagnitude.massive;
  } else if (totalChanges > 500) {
    level = 'large';
    score = WEIGHTS.changeMagnitude.large;
  } else if (totalChanges > 100) {
    level = 'medium';
    score = WEIGHTS.changeMagnitude.medium;
  } else {
    level = 'small';
    score = WEIGHTS.changeMagnitude.small;
  }

  return { level, score, totalChanges };
}

/**
 * Detect semantic patterns in code
 * @param {string} code - Source code
 * @returns {Array<string>} Detected patterns
 */
function detectSemanticPatterns(code) {
  const detected = [];

  for (const [pattern, regexes] of Object.entries(SEMANTIC_PATTERNS)) {
    for (const regex of regexes) {
      if (regex.test(code)) {
        detected.push(pattern);
        break; // Only count each pattern once
      }
    }
  }

  return detected;
}

/**
 * Calculate security risk score
 * @param {Array<Object>} securityFindings - Security findings
 * @returns {Object} Security risk info
 */
function calculateSecurityRisk(securityFindings) {
  let score = 0;
  const breakdown = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };

  for (const finding of securityFindings) {
    const severity = finding.severity || 'medium';
    const weight = WEIGHTS.security[severity] || WEIGHTS.security.medium;

    score += weight;
    breakdown[severity]++;

    // Log critical findings
    if (severity === 'critical') {
      logger.logSecurityFinding(finding);
    }
  }

  return {
    score,
    breakdown,
    total: securityFindings.length,
  };
}

/**
 * Calculate complexity risk score
 * @param {Array<Object>} complexityIssues - Complexity issues
 * @returns {Object} Complexity risk info
 */
function calculateComplexityRisk(complexityIssues) {
  let score = 0;
  const breakdown = {
    high: 0,
    medium: 0,
    low: 0,
  };

  for (const issue of complexityIssues) {
    const complexity = issue.complexity || 0;

    let level;
    let weight;

    if (complexity > 20) {
      level = 'high';
      weight = WEIGHTS.complexity.high;
    } else if (complexity > 15) {
      level = 'medium';
      weight = WEIGHTS.complexity.medium;
    } else {
      level = 'low';
      weight = WEIGHTS.complexity.low;
    }

    score += weight;
    breakdown[level]++;
  }

  return {
    score,
    breakdown,
    total: complexityIssues.length,
  };
}

/**
 * Calculate file criticality risk score
 * @param {Array<Object>} files - Changed files
 * @returns {Object} File criticality info
 */
function calculateFileCriticalityRisk(files) {
  let score = 0;
  const breakdown = {
    critical: [],
    high: [],
    medium: [],
    low: [],
  };

  for (const file of files) {
    const criticality = determineFileCriticality(file.path);
    const weight = WEIGHTS.fileCriticality[criticality];

    score += weight;
    breakdown[criticality].push(file.path);
  }

  return {
    score,
    breakdown,
    criticalFiles: breakdown.critical.length + breakdown.high.length,
  };
}

/**
 * Calculate semantic pattern risk score
 * @param {Array<Object>} codeChanges - Code changes
 * @returns {Object} Pattern risk info
 */
function calculatePatternRisk(codeChanges) {
  let score = 0;
  const detectedPatterns = new Set();

  for (const change of codeChanges) {
    const patterns = detectSemanticPatterns(change.code);

    for (const pattern of patterns) {
      detectedPatterns.add(pattern);
      score += WEIGHTS.patterns[pattern] || 0;
    }
  }

  return {
    score,
    patterns: Array.from(detectedPatterns),
    count: detectedPatterns.size,
  };
}

/**
 * Calculate overall risk score
 * @param {Object} analysisResults - Analysis results
 * @param {Array<Object>} parsedDiff - Parsed diff data
 * @param {Array<Object>} codeChanges - Code changes
 * @returns {Object} Risk assessment
 */
function calculateRiskScore(analysisResults, parsedDiff, codeChanges) {
  const startTime = Date.now();

  // Calculate individual risk components
  const securityRisk = calculateSecurityRisk(analysisResults.securityFindings || []);
  const complexityRisk = calculateComplexityRisk(analysisResults.complexityIssues || []);
  const fileCriticalityRisk = calculateFileCriticalityRisk(parsedDiff);

  // Calculate change magnitude
  const totalAdditions = parsedDiff.reduce((sum, f) => sum + f.additions, 0);
  const totalDeletions = parsedDiff.reduce((sum, f) => sum + f.deletions, 0);
  const changeMagnitude = calculateChangeMagnitude(totalAdditions, totalDeletions);

  // Calculate semantic pattern risk
  const patternRisk = calculatePatternRisk(codeChanges);

  // Calculate total risk score
  const totalScore = securityRisk.score
    + complexityRisk.score
    + fileCriticalityRisk.score
    + changeMagnitude.score
    + patternRisk.score;

  // Normalize to 0-100 scale
  const normalizedScore = Math.min(100, totalScore);

  // Determine risk level
  let riskLevel;
  if (normalizedScore >= RISK_THRESHOLDS.critical) {
    riskLevel = 'CRITICAL';
  } else if (normalizedScore >= RISK_THRESHOLDS.high) {
    riskLevel = 'HIGH';
  } else if (normalizedScore >= RISK_THRESHOLDS.medium) {
    riskLevel = 'MEDIUM';
  } else {
    riskLevel = 'LOW';
  }

  const duration = Date.now() - startTime;

  const riskAssessment = {
    score: normalizedScore,
    level: riskLevel,
    components: {
      security: securityRisk,
      complexity: complexityRisk,
      fileCriticality: fileCriticalityRisk,
      changeMagnitude,
      patterns: patternRisk,
    },
    metadata: {
      filesChanged: parsedDiff.length,
      totalAdditions,
      totalDeletions,
      duration,
    },
  };

  logger.info('Risk score calculated', {
    score: normalizedScore,
    level: riskLevel,
    duration,
  });

  return riskAssessment;
}

/**
 * Get risk level color for display
 * @param {string} level - Risk level
 * @returns {string} Color code
 */
function getRiskLevelColor(level) {
  const colors = {
    CRITICAL: '\x1b[41m\x1b[37m', // Red background, white text
    HIGH: '\x1b[31m', // Red text
    MEDIUM: '\x1b[33m', // Yellow text
    LOW: '\x1b[32m', // Green text
  };
  return colors[level] || '\x1b[0m';
}

/**
 * Get risk level emoji
 * @param {string} level - Risk level
 * @returns {string} Emoji
 */
function getRiskLevelEmoji(level) {
  const emojis = {
    CRITICAL: '🚨',
    HIGH: '⚠️',
    MEDIUM: '⚡',
    LOW: '✅',
  };
  return emojis[level] || '❓';
}

module.exports = {
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
};

// Made with Bob
