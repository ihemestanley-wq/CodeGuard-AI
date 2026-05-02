/**
 * Modes API Routes
 * Endpoints for multi-mode analysis
 */

const express = require('express');
const router = express.Router();
const { parseDiff, extractCodeChanges } = require('../../agent/diffParser');
const { validateAnalyzeRequest } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const { registry, switchMode, execute, listModes, getModeInfo } = require('../../modes');
const logger = require('../../observability/logger');

/**
 * GET /api/modes
 * List all available modes
 */
router.get('/modes', (req, res) => {
  const modes = listModes();
  res.json({
    success: true,
    modes,
    total: modes.length,
  });
});

/**
 * GET /api/modes/:modeName
 * Get information about a specific mode
 */
router.get('/modes/:modeName', (req, res) => {
  const { modeName } = req.params;
  const info = getModeInfo(modeName);
  
  if (!info) {
    return res.status(404).json({
      success: false,
      error: `Mode '${modeName}' not found`,
    });
  }

  res.json({
    success: true,
    mode: modeName,
    info,
  });
});

/**
 * POST /api/modes/analyze
 * Analyze using a specific mode
 */
router.post('/modes/analyze', validateAnalyzeRequest, asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const { diffContent, mode = 'code', workflow = 'comprehensive' } = req.body;

  logger.info('Received multi-mode analyze request', {
    mode,
    workflow,
    diffSize: diffContent.length,
    ip: req.ip,
  });

  try {
    // Parse the diff
    const parsedDiff = parseDiff(diffContent);

    if (parsedDiff.length === 0) {
      return res.json({
        success: true,
        mode,
        message: 'No changes detected in diff',
        filesAnalyzed: 0,
      });
    }

    // Extract code changes
    const codeChanges = extractCodeChanges(parsedDiff);

    // Prepare input for mode execution
    const input = {
      diffContent,
      parsedDiff,
      codeChanges,
    };

    // Switch to requested mode
    switchMode(mode);

    // Execute mode with workflow options
    const result = await execute(input, { workflow });

    // Calculate processing time
    const processingTime = Date.now() - startTime;

    logger.info('Multi-mode analysis completed', {
      mode,
      workflow,
      processingTime,
      success: result.success,
    });

    // Return result
    res.json({
      ...result,
      metadata: {
        ...result.metadata,
        processingTime,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Multi-mode analysis failed', {
      error: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      success: false,
      error: `Analysis failed: ${error.message}`,
    });
  }
}));

/**
 * POST /api/modes/orchestrate
 * Run orchestrated multi-mode analysis
 */
router.post('/modes/orchestrate', validateAnalyzeRequest, asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const { diffContent, workflow = 'comprehensive', modes = ['plan', 'code', 'advanced'] } = req.body;

  logger.info('Received orchestration request', {
    workflow,
    modes,
    diffSize: diffContent.length,
    ip: req.ip,
  });

  try {
    // Parse the diff
    const parsedDiff = parseDiff(diffContent);

    if (parsedDiff.length === 0) {
      return res.json({
        success: true,
        workflow,
        message: 'No changes detected in diff',
        filesAnalyzed: 0,
      });
    }

    // Extract code changes
    const codeChanges = extractCodeChanges(parsedDiff);

    // Prepare input
    const input = {
      diffContent,
      parsedDiff,
      codeChanges,
    };

    // Switch to orchestrator mode
    switchMode('orchestrator');

    // Execute orchestration
    const result = await execute(input, { workflow, modes });

    // Calculate processing time
    const processingTime = Date.now() - startTime;

    logger.info('Orchestration completed', {
      workflow,
      modes,
      processingTime,
      success: result.success,
    });

    // Return comprehensive result
    res.json({
      ...result,
      metadata: {
        ...result.metadata,
        processingTime,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Orchestration failed', {
      error: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      success: false,
      error: `Orchestration failed: ${error.message}`,
    });
  }
}));

module.exports = router;

// Made with Bob
