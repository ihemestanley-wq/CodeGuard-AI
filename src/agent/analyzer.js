/**
 * CodeGuard AI - Code Analyzer
 * Main "final boss" agent that orchestrates the entire analysis pipeline
 */

const acorn = require('acorn');
const logger = require('../observability/logger');
const { parseDiff, extractCodeChanges } = require('./diffParser');
const { calculateRiskScore } = require('./riskEngine');
const { generateReport } = require('./reportGenerator');

// Configuration constants
const CONFIG = {
  MAX_AST_DEPTH: 50,
  MAX_AST_NODES: 10000,
  ANALYSIS_TIMEOUT: 30000, // 30 seconds
  MAX_CODE_SIZE: 1024 * 1024, // 1MB per file
};

// Security patterns to detect
const SECURITY_PATTERNS = {
  // Dangerous functions
  dangerousFunctions: [
    'eval', 'Function', 'setTimeout', 'setInterval',
    'execSync', 'exec', 'spawn', 'system',
  ],
  
  // SQL injection patterns
  sqlPatterns: [
    /execute\s*\(\s*["'`].*\$\{/i,
    /query\s*\(\s*["'`].*\$\{/i,
    /SELECT.*FROM.*WHERE.*\$\{/i,
    /INSERT.*INTO.*VALUES.*\$\{/i,
    /UPDATE.*SET.*\$\{/i,
    /DELETE.*FROM.*WHERE.*\$\{/i,
  ],
  
  // Command injection patterns
  commandPatterns: [
    /exec\s*\(\s*["'`].*\$\{/i,
    /spawn\s*\(\s*["'`].*\$\{/i,
    /system\s*\(\s*["'`].*\$\{/i,
  ],
  
  // Hardcoded secrets patterns
  secretPatterns: [
    /password\s*=\s*["'][^"']+["']/i,
    /api[_-]?key\s*=\s*["'][^"']+["']/i,
    /secret\s*=\s*["'][^"']+["']/i,
    /token\s*=\s*["'][^"']+["']/i,
    /private[_-]?key\s*=\s*["'][^"']+["']/i,
    /aws[_-]?access[_-]?key/i,
  ],
  
  // Path traversal patterns
  pathTraversalPatterns: [
    /\.\.[\/\\]/,
    /readFile\s*\(\s*.*\$\{/i,
    /writeFile\s*\(\s*.*\$\{/i,
  ],
  
  // XSS patterns
  xssPatterns: [
    /innerHTML\s*=\s*.*\$\{/i,
    /outerHTML\s*=\s*.*\$\{/i,
    /document\.write\s*\(/i,
    /dangerouslySetInnerHTML/i,
  ],
};

// Complexity thresholds
const COMPLEXITY_THRESHOLDS = {
  cyclomatic: 10,
  cognitive: 15,
  nesting: 4,
};

/**
 * Check for circular references in object
 * @param {Object} obj - Object to check
 * @param {Set} seen - Set of seen objects
 * @returns {boolean} True if circular reference detected
 */
function hasCircularReference(obj, seen = new Set()) {
  if (obj === null || typeof obj !== 'object') {
    return false;
  }

  if (seen.has(obj)) {
    return true;
  }

  seen.add(obj);

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      if (hasCircularReference(obj[key], seen)) {
        return true;
      }
    }
  }

  seen.delete(obj);
  return false;
}

/**
 * Calculate AST depth
 * @param {Object} node - AST node
 * @param {number} currentDepth - Current depth
 * @returns {number} Maximum depth
 */
function calculateASTDepth(node, currentDepth = 0) {
  if (!node || typeof node !== 'object') {
    return currentDepth;
  }

  if (currentDepth > CONFIG.MAX_AST_DEPTH) {
    throw new Error(`AST depth exceeds maximum allowed depth of ${CONFIG.MAX_AST_DEPTH}`);
  }

  let maxDepth = currentDepth;

  for (const key in node) {
    if (key === 'loc' || key === 'range' || key === 'start' || key === 'end') {
      continue; // Skip location metadata
    }

    const value = node[key];
    
    if (Array.isArray(value)) {
      for (const item of value) {
        const depth = calculateASTDepth(item, currentDepth + 1);
        maxDepth = Math.max(maxDepth, depth);
      }
    } else if (value && typeof value === 'object' && value.type) {
      const depth = calculateASTDepth(value, currentDepth + 1);
      maxDepth = Math.max(maxDepth, depth);
    }
  }

  return maxDepth;
}

/**
 * Count AST nodes
 * @param {Object} node - AST node
 * @returns {number} Node count
 */
function countASTNodes(node) {
  if (!node || typeof node !== 'object') {
    return 0;
  }

  let count = 1;

  for (const key in node) {
    if (key === 'loc' || key === 'range' || key === 'start' || key === 'end') {
      continue;
    }

    const value = node[key];
    
    if (Array.isArray(value)) {
      for (const item of value) {
        count += countASTNodes(item);
      }
    } else if (value && typeof value === 'object' && value.type) {
      count += countASTNodes(value);
    }
  }

  return count;
}

/**
 * Parse code to AST with safety checks
 * @param {string} code - Source code
 * @param {string} filePath - File path for context
 * @returns {Object|null} AST or null if parsing fails
 */
function parseToAST(code, filePath) {
  try {
    // Validate code size
    if (code.length > CONFIG.MAX_CODE_SIZE) {
      logger.warn('Code size exceeds maximum', { 
        file: filePath, 
        size: code.length 
      });
      return null;
    }

    // Parse with timeout protection
    const startTime = Date.now();
    const ast = acorn.parse(code, {
      ecmaVersion: 2022,
      sourceType: 'module',
      locations: true,
      allowHashBang: true,
      allowAwaitOutsideFunction: true,
      allowImportExportEverywhere: true,
    });

    const parseTime = Date.now() - startTime;
    
    if (parseTime > 5000) {
      logger.warn('AST parsing took too long', { 
        file: filePath, 
        duration: parseTime 
      });
    }

    // Check for circular references
    if (hasCircularReference(ast)) {
      logger.error('Circular reference detected in AST', { file: filePath });
      return null;
    }

    // Validate AST depth
    const depth = calculateASTDepth(ast);
    if (depth > CONFIG.MAX_AST_DEPTH) {
      logger.warn('AST depth exceeds maximum', { 
        file: filePath, 
        depth 
      });
      return null;
    }

    // Validate node count
    const nodeCount = countASTNodes(ast);
    if (nodeCount > CONFIG.MAX_AST_NODES) {
      logger.warn('AST node count exceeds maximum', { 
        file: filePath, 
        nodeCount 
      });
      return null;
    }

    logger.debug('AST parsed successfully', { 
      file: filePath, 
      depth, 
      nodeCount,
      parseTime 
    });

    return ast;

  } catch (error) {
    logger.debug('Failed to parse code to AST', { 
      file: filePath, 
      error: error.message 
    });
    return null;
  }
}

/**
 * Detect security issues in code
 * @param {string} code - Source code
 * @param {string} filePath - File path
 * @returns {Array<Object>} Array of security findings
 */
function detectSecurityIssues(code, filePath) {
  const findings = [];
  const lines = code.split('\n');

  // Check for dangerous functions
  for (const func of SECURITY_PATTERNS.dangerousFunctions) {
    const regex = new RegExp(`\\b${func}\\s*\\(`, 'g');
    let match;
    
    while ((match = regex.exec(code)) !== null) {
      const lineNum = code.substring(0, match.index).split('\n').length;
      findings.push({
        type: 'dangerous_function',
        severity: 'high',
        message: `Use of dangerous function: ${func}`,
        file: filePath,
        line: lineNum,
        code: lines[lineNum - 1]?.trim(),
      });
    }
  }

  // Check for SQL injection
  for (const pattern of SECURITY_PATTERNS.sqlPatterns) {
    let match;
    
    while ((match = pattern.exec(code)) !== null) {
      const lineNum = code.substring(0, match.index).split('\n').length;
      findings.push({
        type: 'sql_injection',
        severity: 'critical',
        message: 'Potential SQL injection vulnerability',
        file: filePath,
        line: lineNum,
        code: lines[lineNum - 1]?.trim(),
      });
    }
  }

  // Check for command injection
  for (const pattern of SECURITY_PATTERNS.commandPatterns) {
    let match;
    
    while ((match = pattern.exec(code)) !== null) {
      const lineNum = code.substring(0, match.index).split('\n').length;
      findings.push({
        type: 'command_injection',
        severity: 'critical',
        message: 'Potential command injection vulnerability',
        file: filePath,
        line: lineNum,
        code: lines[lineNum - 1]?.trim(),
      });
    }
  }

  // Check for hardcoded secrets
  for (const pattern of SECURITY_PATTERNS.secretPatterns) {
    let match;
    
    while ((match = pattern.exec(code)) !== null) {
      const lineNum = code.substring(0, match.index).split('\n').length;
      findings.push({
        type: 'hardcoded_secret',
        severity: 'high',
        message: 'Potential hardcoded secret detected',
        file: filePath,
        line: lineNum,
        code: lines[lineNum - 1]?.trim().substring(0, 50) + '...',
      });
    }
  }

  // Check for path traversal
  for (const pattern of SECURITY_PATTERNS.pathTraversalPatterns) {
    let match;
    
    while ((match = pattern.exec(code)) !== null) {
      const lineNum = code.substring(0, match.index).split('\n').length;
      findings.push({
        type: 'path_traversal',
        severity: 'high',
        message: 'Potential path traversal vulnerability',
        file: filePath,
        line: lineNum,
        code: lines[lineNum - 1]?.trim(),
      });
    }
  }

  // Check for XSS
  for (const pattern of SECURITY_PATTERNS.xssPatterns) {
    let match;
    
    while ((match = pattern.exec(code)) !== null) {
      const lineNum = code.substring(0, match.index).split('\n').length;
      findings.push({
        type: 'xss',
        severity: 'high',
        message: 'Potential XSS vulnerability',
        file: filePath,
        line: lineNum,
        code: lines[lineNum - 1]?.trim(),
      });
    }
  }

  return findings;
}

/**
 * Calculate cyclomatic complexity
 * @param {Object} ast - AST node
 * @returns {number} Complexity score
 */
function calculateCyclomaticComplexity(ast) {
  let complexity = 1;

  function traverse(node) {
    if (!node || typeof node !== 'object') return;

    // Increment for decision points
    if (
      node.type === 'IfStatement' ||
      node.type === 'WhileStatement' ||
      node.type === 'ForStatement' ||
      node.type === 'ForInStatement' ||
      node.type === 'ForOfStatement' ||
      node.type === 'ConditionalExpression' ||
      node.type === 'SwitchCase' ||
      node.type === 'CatchClause' ||
      (node.type === 'LogicalExpression' && (node.operator === '&&' || node.operator === '||'))
    ) {
      complexity++;
    }

    // Traverse child nodes
    for (const key in node) {
      if (key === 'loc' || key === 'range' || key === 'start' || key === 'end') {
        continue;
      }

      const value = node[key];
      
      if (Array.isArray(value)) {
        value.forEach(traverse);
      } else if (value && typeof value === 'object' && value.type) {
        traverse(value);
      }
    }
  }

  traverse(ast);
  return complexity;
}

/**
 * Analyze code changes
 * @param {Array<Object>} codeChanges - Code changes from diff parser
 * @returns {Promise<Object>} Analysis results
 */
async function analyzeCodeChanges(codeChanges) {
  const startTime = Date.now();
  const results = {
    securityFindings: [],
    complexityIssues: [],
    filesAnalyzed: 0,
    totalLines: 0,
  };

  for (const change of codeChanges) {
    try {
      const { file, code, extension } = change;

      // Only analyze JavaScript/TypeScript files with AST
      const isJavaScript = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'].includes(extension);

      // Security analysis (all files)
      const securityFindings = detectSecurityIssues(code, file);
      results.securityFindings.push(...securityFindings);

      // AST-based analysis (JavaScript only)
      if (isJavaScript) {
        const ast = parseToAST(code, file);
        
        if (ast) {
          const complexity = calculateCyclomaticComplexity(ast);
          
          if (complexity > COMPLEXITY_THRESHOLDS.cyclomatic) {
            results.complexityIssues.push({
              file,
              type: 'high_complexity',
              complexity,
              threshold: COMPLEXITY_THRESHOLDS.cyclomatic,
              message: `Cyclomatic complexity (${complexity}) exceeds threshold (${COMPLEXITY_THRESHOLDS.cyclomatic})`,
            });
          }
        }
      }

      results.filesAnalyzed++;
      results.totalLines += code.split('\n').length;

      // Check timeout
      if (Date.now() - startTime > CONFIG.ANALYSIS_TIMEOUT) {
        logger.warn('Analysis timeout reached', { 
          filesAnalyzed: results.filesAnalyzed 
        });
        break;
      }

    } catch (error) {
      logger.error('Error analyzing code change', { 
        file: change.file, 
        error: error.message 
      });
    }
  }

  results.duration = Date.now() - startTime;

  logger.info('Code analysis completed', {
    filesAnalyzed: results.filesAnalyzed,
    securityFindings: results.securityFindings.length,
    complexityIssues: results.complexityIssues.length,
    duration: results.duration,
  });

  return results;
}

/**
 * Main PR analysis function - orchestrates the entire pipeline
 * @param {string} diffContent - Raw git diff content
 * @returns {string} Analysis report
 */
function analyzePR(diffContent) {
  try {
    logger.info('Starting PR analysis');
    
    // Step 1: Parse the diff
    const parsedDiff = parseDiff(diffContent);
    
    if (parsedDiff.length === 0) {
      return '✅ No changes detected in diff';
    }
    
    // Step 2: Extract code changes
    const codeChanges = extractCodeChanges(parsedDiff);
    
    // Step 3: Analyze code changes
    const analysisResults = analyzeCodeChanges(codeChanges);
    
    // Step 4: Calculate risk score
    const riskAssessment = calculateRiskScore(analysisResults, parsedDiff, codeChanges);
    
    // Step 5: Generate report
    const report = generateReport(riskAssessment, analysisResults);
    
    logger.info('PR analysis completed', {
      riskScore: riskAssessment.score,
      riskLevel: riskAssessment.level,
      filesAnalyzed: analysisResults.filesAnalyzed,
    });
    
    return report;
    
  } catch (error) {
    logger.error('PR analysis failed', error);
    return `❌ Analysis failed: ${error.message}`;
  }
}

module.exports = {
  analyzePR,
  analyzeCodeChanges,
  parseToAST,
  detectSecurityIssues,
  calculateCyclomaticComplexity,
  CONFIG,
  SECURITY_PATTERNS,
  COMPLEXITY_THRESHOLDS,
};

// Made with Bob
