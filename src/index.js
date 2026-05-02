#!/usr/bin/env node

/**
 * CodeGuard AI - CLI Entry Point
 * Command-line interface for analyzing git diffs and assessing deployment risks
 */

const fs = require('fs');
const path = require('path');
const { analyzePR } = require('./agent/analyzer');
const { calculateRiskScore } = require('./agent/riskEngine');
const { parseDiff, extractCodeChanges } = require('./agent/diffParser');
const { analyzeCodeChanges } = require('./agent/analyzer');

// Package version
const PACKAGE_VERSION = '1.0.0';

// Exit codes
const EXIT_CODES = {
  SUCCESS: 0, // Low/Medium risk - safe to deploy
  HIGH_RISK: 1, // High/Critical risk - block deployment
  ERROR: 2, // Error occurred (file not found, invalid input, etc.)
};

/**
 * Display usage information
 */
function showHelp() {
  console.log(`
CodeGuard AI - DevOps AI Agent for Git Diff Analysis
Version: ${PACKAGE_VERSION}

USAGE:
  node src/index.js <file.diff> [file2.diff ...]
  codeguard <file.diff> [file2.diff ...]

DESCRIPTION:
  Analyzes git diff files to assess deployment risks by detecting:
  - Security vulnerabilities (SQL injection, XSS, command injection, etc.)
  - Code complexity issues
  - Critical file changes (auth, payment, security)
  - Semantic patterns (database schema, API contracts)

OPTIONS:
  --help, -h       Show this help message
  --version, -v    Show version information

EXIT CODES:
  0    Success - Low/Medium risk detected (safe to deploy)
  1    High/Critical risk detected (deployment should be blocked)
  2    Error - File not found, invalid input, or analysis failure

EXAMPLES:
  # Analyze a single diff file
  node src/index.js examples/sample.diff

  # Analyze multiple diff files
  node src/index.js changes1.diff changes2.diff

  # Use in CI/CD pipeline
  node src/index.js pr-changes.diff || exit 1

  # Check exit code
  node src/index.js changes.diff
  echo "Exit code: $?"

DOCUMENTATION:
  For more information, visit: https://github.com/yourusername/codeguard-ai
`);
}

/**
 * Display version information
 */
function showVersion() {
  console.log(`CodeGuard AI v${PACKAGE_VERSION}`);
}

/**
 * Check if file exists and is readable
 * @param {string} filePath - Path to file
 * @returns {boolean} True if file exists and is readable
 */
function fileExists(filePath) {
  try {
    fs.accessSync(filePath, fs.constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Read diff file content
 * @param {string} filePath - Path to diff file
 * @returns {string|null} File content or null if error
 */
function readDiffFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return content;
  } catch (error) {
    console.error(`❌ Error reading file '${filePath}': ${error.message}`);
    return null;
  }
}

/**
 * Extract risk level from analysis report
 * @param {string} report - Analysis report
 * @returns {string} Risk level (CRITICAL, HIGH, MEDIUM, LOW)
 */
function extractRiskLevel(report) {
  // Try to extract risk level from report
  const riskMatch = report.match(/Risk Level:\s*(CRITICAL|HIGH|MEDIUM|LOW)/i);
  if (riskMatch) {
    return riskMatch[1].toUpperCase();
  }

  // Fallback: check for risk indicators in report
  if (report.includes('CRITICAL') || report.includes('🚨')) {
    return 'CRITICAL';
  }
  if (report.includes('HIGH') || report.includes('⚠️')) {
    return 'HIGH';
  }
  if (report.includes('MEDIUM') || report.includes('⚡')) {
    return 'MEDIUM';
  }

  return 'LOW';
}

/**
 * Determine exit code based on risk level
 * @param {string} riskLevel - Risk level (CRITICAL, HIGH, MEDIUM, LOW)
 * @returns {number} Exit code
 */
function getExitCode(riskLevel) {
  if (riskLevel === 'CRITICAL' || riskLevel === 'HIGH') {
    return EXIT_CODES.HIGH_RISK;
  }
  return EXIT_CODES.SUCCESS;
}

/**
 * Analyze a single diff file
 * @param {string} filePath - Path to diff file
 * @returns {Object} Analysis result with risk level and exit code
 */
function analyzeDiffFile(filePath) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📄 Analyzing: ${filePath}`);
  console.log('='.repeat(80));

  // Check if file exists
  if (!fileExists(filePath)) {
    console.error(`❌ Error: File not found: ${filePath}`);
    return { success: false, exitCode: EXIT_CODES.ERROR };
  }

  // Read file content
  const diffContent = readDiffFile(filePath);
  if (!diffContent) {
    return { success: false, exitCode: EXIT_CODES.ERROR };
  }

  // Validate diff content
  if (diffContent.trim().length === 0) {
    console.log('⚠️  Warning: File is empty');
    return { success: true, riskLevel: 'LOW', exitCode: EXIT_CODES.SUCCESS };
  }

  try {
    // Perform analysis
    const report = analyzePR(diffContent);

    // Display report
    console.log(report);

    // Extract risk level
    const riskLevel = extractRiskLevel(report);
    const exitCode = getExitCode(riskLevel);

    return { success: true, riskLevel, exitCode };
  } catch (error) {
    console.error(`❌ Analysis failed: ${error.message}`);
    if (process.env.DEBUG) {
      console.error(error.stack);
    }
    return { success: false, exitCode: EXIT_CODES.ERROR };
  }
}

/**
 * Main CLI function
 */
function main() {
  const args = process.argv.slice(2);

  // Handle no arguments
  if (args.length === 0) {
    console.error('❌ Error: No diff file specified\n');
    showHelp();
    process.exit(EXIT_CODES.ERROR);
  }

  // Handle --help flag
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(EXIT_CODES.SUCCESS);
  }

  // Handle --version flag
  if (args.includes('--version') || args.includes('-v')) {
    showVersion();
    process.exit(EXIT_CODES.SUCCESS);
  }

  // Filter out any flags and get file paths
  const filePaths = args.filter((arg) => !arg.startsWith('-'));

  if (filePaths.length === 0) {
    console.error('❌ Error: No diff file specified\n');
    showHelp();
    process.exit(EXIT_CODES.ERROR);
  }

  console.log(`\n🔍 CodeGuard AI - Analyzing ${filePaths.length} file(s)...\n`);

  let highestExitCode = EXIT_CODES.SUCCESS;
  const results = [];

  // Analyze each file
  for (const filePath of filePaths) {
    const result = analyzeDiffFile(filePath);
    results.push({ filePath, ...result });

    // Track highest exit code
    if (result.exitCode > highestExitCode) {
      highestExitCode = result.exitCode;
    }
  }

  // Display summary for multiple files
  if (filePaths.length > 1) {
    console.log(`\n${'='.repeat(80)}`);
    console.log('📊 ANALYSIS SUMMARY');
    console.log('='.repeat(80));

    for (const result of results) {
      const status = result.success
        ? `${result.riskLevel} (Exit: ${result.exitCode})`
        : `ERROR (Exit: ${result.exitCode})`;
      console.log(`  ${result.filePath}: ${status}`);
    }

    const successCount = results.filter((r) => r.success).length;
    const errorCount = results.filter((r) => !r.success).length;
    const highRiskCount = results.filter((r) => r.success && (r.riskLevel === 'HIGH' || r.riskLevel === 'CRITICAL')).length;

    console.log(`\n  Total: ${filePaths.length} | Success: ${successCount} | Errors: ${errorCount} | High Risk: ${highRiskCount}`);
    console.log('='.repeat(80));
  }

  // Display final exit code message
  console.log(`\n🏁 Final Exit Code: ${highestExitCode}`);

  if (highestExitCode === EXIT_CODES.SUCCESS) {
    console.log('✅ Analysis complete - Safe to deploy (Low/Medium risk)');
  } else if (highestExitCode === EXIT_CODES.HIGH_RISK) {
    console.log('⛔ High/Critical risk detected - Deployment should be blocked');
  } else {
    console.log('❌ Analysis failed - Please check errors above');
  }

  // Exit with appropriate code
  process.exit(highestExitCode);
}

// Run CLI if executed directly
if (require.main === module) {
  main();
}

// Export for testing
module.exports = {
  analyzeDiffFile,
  extractRiskLevel,
  getExitCode,
  fileExists,
  EXIT_CODES,
};

// Made with Bob
