/**
 * Analyze Route
 * API endpoint for analyzing PR diffs
 */

const express = require('express');

const router = express.Router();
const { analyzeCodeChanges } = require('../../agent/analyzer');
const { parseDiff, extractCodeChanges } = require('../../agent/diffParser');
const { calculateRiskScore } = require('../../agent/riskEngine');
const { validateAnalyzeRequest } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../../observability/logger');

/**
 * POST /api/analyze
 * Analyze a PR diff and return security analysis results
 */
router.post('/analyze', validateAnalyzeRequest, asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const { diffContent } = req.body;

  logger.info('Received analyze request', {
    diffSize: diffContent.length,
    ip: req.ip,
  });

  try {
    // Parse the diff
    const parsedDiff = parseDiff(diffContent);

    if (parsedDiff.length === 0) {
      return res.json({
        success: true,
        riskLevel: 'LOW',
        riskScore: 0,
        summary: 'No changes detected in diff',
        filesAnalyzed: 0,
        security: [],
        complexity: [],
        performance: [],
        metadata: {
          processingTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
          diffSize: diffContent.length,
        },
      });
    }

    // Extract code changes
    const codeChanges = extractCodeChanges(parsedDiff);

    // Analyze code changes
    const analysisResults = await analyzeCodeChanges(codeChanges);

    // Calculate risk score
    const riskAssessment = calculateRiskScore(analysisResults, parsedDiff, codeChanges);

    // Calculate processing time
    const processingTime = Date.now() - startTime;

    logger.info('Analysis completed successfully', {
      processingTime,
      riskLevel: riskAssessment.level,
      riskScore: riskAssessment.score,
    });

    // Return structured JSON response for frontend
    res.json({
      success: true,
      riskLevel: riskAssessment.level,
      riskScore: riskAssessment.score,
      summary: getRiskSummary(riskAssessment),
      filesAnalyzed: parsedDiff.length,
      security: analysisResults.securityFindings || [],
      complexity: analysisResults.complexityIssues || [],
      performance: analysisResults.performanceIssues || [],
      metadata: {
        processingTime,
        timestamp: new Date().toISOString(),
        diffSize: diffContent.length,
      },
    });
  } catch (error) {
    logger.error('Analysis failed', {
      error: error.message,
      stack: error.stack,
    });

    // Return error response
    res.status(500).json({
      success: false,
      error: `Analysis failed: ${error.message}`,
    });
  }
}));

/**
 * Get risk summary based on risk level
 */
function getRiskSummary(riskAssessment) {
  const { level, components } = riskAssessment;

  const summaries = {
    LOW: 'This PR looks good! No significant issues detected.',
    MEDIUM: 'This PR has some concerns that should be reviewed before merging.',
    HIGH: 'This PR has several issues that need attention before deployment.',
    CRITICAL: 'This PR has critical issues that must be addressed immediately.',
  };

  let summary = summaries[level] || 'Analysis complete.';

  // Add specific concerns
  const concerns = [];
  if (components.security.total > 0) {
    concerns.push(`${components.security.total} security issue${components.security.total > 1 ? 's' : ''}`);
  }
  if (components.complexity.total > 0) {
    concerns.push(`${components.complexity.total} complexity issue${components.complexity.total > 1 ? 's' : ''}`);
  }
  if (components.fileCriticality.criticalFiles > 0) {
    concerns.push(`${components.fileCriticality.criticalFiles} critical file${components.fileCriticality.criticalFiles > 1 ? 's' : ''} modified`);
  }

  if (concerns.length > 0) {
    summary += ` Found: ${concerns.join(', ')}.`;
  }

  return summary;
}

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: require('../../../package.json').version,
  });
});

module.exports = router;

// Made with Bob
