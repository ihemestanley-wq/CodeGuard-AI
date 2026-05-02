/**
 * Code Mode - Backend/Frontend Code Generation & Analysis
 * Focuses on: code quality, best practices, security, performance
 */

const { analyzeCodeChanges } = require('../agent/analyzer');
const { calculateRiskScore } = require('../agent/riskEngine');
const logger = require('../observability/logger');

class CodeMode {
  constructor() {
    this.name = 'Code Mode';
    this.description = 'Backend/Frontend code generation and analysis';
    this.capabilities = [
      'Code quality analysis',
      'Security vulnerability detection',
      'Performance optimization',
      'Best practices validation',
      'Code generation suggestions',
      'Refactoring recommendations',
    ];
  }

  /**
   * Execute Code Mode analysis
   */
  async execute(input, options = {}) {
    logger.info('Code Mode: Starting code analysis');

    try {
      const { diffContent, codeChanges, parsedDiff } = input;

      // Perform deep code analysis
      const codeAnalysis = await analyzeCodeChanges(codeChanges);

      // Calculate risk score
      const riskAssessment = calculateRiskScore(codeAnalysis, parsedDiff, codeChanges);

      // Analyze code quality
      const qualityMetrics = this.analyzeCodeQuality(codeChanges);

      // Detect security vulnerabilities
      const securityAnalysis = this.analyzeSecurityDeep(codeChanges, codeAnalysis);

      // Analyze performance
      const performanceAnalysis = this.analyzePerformance(codeChanges);

      // Generate code suggestions
      const codeSuggestions = this.generateCodeSuggestions(codeChanges, codeAnalysis);

      // Validate best practices
      const bestPractices = this.validateBestPractices(codeChanges);

      return {
        success: true,
        mode: 'code',
        analysis: {
          risk: riskAssessment,
          quality: qualityMetrics,
          security: securityAnalysis,
          performance: performanceAnalysis,
          bestPractices,
        },
        suggestions: codeSuggestions,
        metadata: {
          timestamp: new Date().toISOString(),
          filesAnalyzed: parsedDiff?.length || 0,
          linesAnalyzed: this.countLines(codeChanges),
        },
      };
    } catch (error) {
      logger.error('Code Mode execution failed', { error: error.message });
      return {
        success: false,
        mode: 'code',
        error: error.message,
      };
    }
  }

  /**
   * Analyze code quality metrics
   */
  analyzeCodeQuality(codeChanges) {
    const metrics = {
      complexity: 0,
      duplication: 0,
      testCoverage: 0,
      documentation: 0,
      maintainability: 0,
    };

    let totalFiles = 0;
    const issues = [];

    codeChanges.forEach((change) => {
      totalFiles++;
      const content = change.content;
      const lines = content.split('\n');

      // Cyclomatic complexity (simplified)
      const complexity = this.calculateComplexity(content);
      metrics.complexity += complexity;

      if (complexity > 10) {
        issues.push({
          type: 'High Complexity',
          file: change.filename,
          severity: 'medium',
          message: `Cyclomatic complexity: ${complexity}`,
        });
      }

      // Code duplication detection
      const duplication = this.detectDuplication(content);
      metrics.duplication += duplication;

      // Documentation score
      const docScore = this.calculateDocumentationScore(content);
      metrics.documentation += docScore;

      // Check for test files
      if (change.filename.includes('test') || change.filename.includes('spec')) {
        metrics.testCoverage += 1;
      }
    });

    // Calculate averages
    if (totalFiles > 0) {
      metrics.complexity = Math.round(metrics.complexity / totalFiles);
      metrics.duplication = Math.round((metrics.duplication / totalFiles) * 100);
      metrics.documentation = Math.round((metrics.documentation / totalFiles) * 100);
      metrics.testCoverage = Math.round((metrics.testCoverage / totalFiles) * 100);
      metrics.maintainability = this.calculateMaintainabilityIndex(metrics);
    }

    return {
      metrics,
      issues,
      grade: this.getQualityGrade(metrics),
    };
  }

  /**
   * Deep security analysis
   */
  analyzeSecurityDeep(codeChanges, baseAnalysis) {
    const vulnerabilities = baseAnalysis.securityFindings || [];
    const additionalChecks = [];

    codeChanges.forEach((change) => {
      const content = change.content.toLowerCase();

      // Check for hardcoded secrets
      const secretPatterns = [
        { pattern: /api[_-]?key\s*=\s*['"][^'"]+['"]/gi, type: 'API Key' },
        { pattern: /password\s*=\s*['"][^'"]+['"]/gi, type: 'Password' },
        { pattern: /secret\s*=\s*['"][^'"]+['"]/gi, type: 'Secret' },
        { pattern: /token\s*=\s*['"][^'"]+['"]/gi, type: 'Token' },
      ];

      secretPatterns.forEach(({ pattern, type }) => {
        const matches = change.content.match(pattern);
        if (matches) {
          additionalChecks.push({
            type: 'Hardcoded Secret',
            severity: 'critical',
            file: change.filename,
            message: `Potential ${type} hardcoded in source`,
            recommendation: 'Use environment variables or secret management',
          });
        }
      });

      // Check for insecure dependencies
      if (change.filename.includes('package.json')) {
        const insecurePackages = ['request', 'node-uuid', 'growl'];
        insecurePackages.forEach((pkg) => {
          if (content.includes(pkg)) {
            additionalChecks.push({
              type: 'Insecure Dependency',
              severity: 'high',
              file: change.filename,
              message: `Package "${pkg}" has known vulnerabilities`,
              recommendation: 'Update to secure alternative',
            });
          }
        });
      }

      // Check for unsafe eval usage
      if (content.includes('eval(') || content.includes('function(')) {
        additionalChecks.push({
          type: 'Code Injection Risk',
          severity: 'high',
          file: change.filename,
          message: 'Potential code injection vulnerability',
          recommendation: 'Avoid eval() and dynamic code execution',
        });
      }
    });

    return {
      total: vulnerabilities.length + additionalChecks.length,
      critical: [...vulnerabilities, ...additionalChecks].filter((v) => v.severity === 'critical').length,
      high: [...vulnerabilities, ...additionalChecks].filter((v) => v.severity === 'high').length,
      medium: [...vulnerabilities, ...additionalChecks].filter((v) => v.severity === 'medium').length,
      findings: [...vulnerabilities, ...additionalChecks],
    };
  }

  /**
   * Analyze performance
   */
  analyzePerformance(codeChanges) {
    const issues = [];
    let score = 100;

    codeChanges.forEach((change) => {
      const content = change.content.toLowerCase();

      // Check for performance anti-patterns
      const antiPatterns = [
        { pattern: 'for.*for.*for', issue: 'Nested loops (O(n³))', impact: -15 },
        { pattern: 'while.*while', issue: 'Nested while loops', impact: -10 },
        { pattern: 'settimeout.*settimeout', issue: 'Multiple setTimeout calls', impact: -5 },
        { pattern: 'document.getelementbyid.*for', issue: 'DOM query in loop', impact: -10 },
        { pattern: 'json.parse.*for', issue: 'JSON parsing in loop', impact: -10 },
        { pattern: 'new.*for', issue: 'Object creation in loop', impact: -8 },
      ];

      antiPatterns.forEach(({ pattern, issue, impact }) => {
        const regex = new RegExp(pattern, 'gi');
        if (regex.test(content)) {
          issues.push({
            type: 'Performance',
            file: change.filename,
            issue,
            severity: impact < -10 ? 'high' : 'medium',
            impact,
          });
          score += impact;
        }
      });

      // Check for memory leaks
      if (content.includes('addeventlistener') && !content.includes('removeeventlistener')) {
        issues.push({
          type: 'Memory Leak',
          file: change.filename,
          issue: 'Event listener without cleanup',
          severity: 'medium',
          impact: -10,
        });
        score -= 10;
      }
    });

    return {
      score: Math.max(0, score),
      level: this.getPerformanceLevel(score),
      issues,
      recommendations: this.getPerformanceRecommendations(issues),
    };
  }

  /**
   * Generate code suggestions
   */
  generateCodeSuggestions(codeChanges, analysis) {
    const suggestions = [];

    codeChanges.forEach((change) => {
      const content = change.content;

      // Suggest async/await over callbacks
      if (content.includes('callback') && !content.includes('async')) {
        suggestions.push({
          type: 'Modernization',
          file: change.filename,
          suggestion: 'Consider using async/await instead of callbacks',
          priority: 'low',
        });
      }

      // Suggest const/let over var
      if (content.includes('var ')) {
        suggestions.push({
          type: 'Best Practice',
          file: change.filename,
          suggestion: 'Use const/let instead of var',
          priority: 'low',
        });
      }

      // Suggest error handling
      if (content.includes('try') && !content.includes('catch')) {
        suggestions.push({
          type: 'Error Handling',
          file: change.filename,
          suggestion: 'Add catch block for error handling',
          priority: 'medium',
        });
      }

      // Suggest input validation
      if (content.includes('req.body') && !content.includes('validate')) {
        suggestions.push({
          type: 'Security',
          file: change.filename,
          suggestion: 'Add input validation for request body',
          priority: 'high',
        });
      }
    });

    return suggestions;
  }

  /**
   * Validate best practices
   */
  validateBestPractices(codeChanges) {
    const violations = [];
    let score = 100;

    const practices = [
      { check: 'console.log', message: 'Remove console.log statements', impact: -2 },
      { check: 'debugger', message: 'Remove debugger statements', impact: -5 },
      { check: 'TODO', message: 'Address TODO comments', impact: -1 },
      { check: 'FIXME', message: 'Address FIXME comments', impact: -3 },
      { check: '== ', message: 'Use === instead of ==', impact: -2 },
      { check: '!= ', message: 'Use !== instead of !=', impact: -2 },
    ];

    codeChanges.forEach((change) => {
      const content = change.content;

      practices.forEach(({ check, message, impact }) => {
        if (content.includes(check)) {
          violations.push({
            file: change.filename,
            violation: message,
            severity: impact < -3 ? 'medium' : 'low',
          });
          score += impact;
        }
      });
    });

    return {
      score: Math.max(0, score),
      level: this.getBestPracticesLevel(score),
      violations,
    };
  }

  /**
   * Helper methods
   */
  calculateComplexity(content) {
    // Simplified cyclomatic complexity
    const keywords = ['if', 'else', 'for', 'while', 'case', 'catch', '&&', '||'];
    let complexity = 1;

    keywords.forEach((keyword) => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      const matches = content.match(regex);
      if (matches) {
        complexity += matches.length;
      }
    });

    return complexity;
  }

  detectDuplication(content) {
    // Simplified duplication detection
    const lines = content.split('\n').filter((l) => l.trim().length > 10);
    const uniqueLines = new Set(lines);
    return lines.length > 0 ? ((lines.length - uniqueLines.size) / lines.length) * 100 : 0;
  }

  calculateDocumentationScore(content) {
    const lines = content.split('\n');
    const commentLines = lines.filter((l) => l.trim().startsWith('//') || l.trim().startsWith('/*')).length;
    const codeLines = lines.filter((l) => l.trim() && !l.trim().startsWith('//')).length;
    return codeLines > 0 ? (commentLines / codeLines) * 100 : 0;
  }

  calculateMaintainabilityIndex(metrics) {
    // Simplified maintainability index
    const complexityScore = Math.max(0, 100 - metrics.complexity * 2);
    const duplicationScore = 100 - metrics.duplication;
    const documentationScore = metrics.documentation;
    return Math.round((complexityScore + duplicationScore + documentationScore) / 3);
  }

  countLines(codeChanges) {
    return codeChanges.reduce((total, change) => {
      return total + change.content.split('\n').length;
    }, 0);
  }

  getQualityGrade(metrics) {
    const avg = (metrics.complexity + metrics.maintainability + metrics.documentation) / 3;
    if (avg >= 90) return 'A';
    if (avg >= 80) return 'B';
    if (avg >= 70) return 'C';
    if (avg >= 60) return 'D';
    return 'F';
  }

  getPerformanceLevel(score) {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Poor';
  }

  getBestPracticesLevel(score) {
    if (score >= 95) return 'Excellent';
    if (score >= 85) return 'Good';
    if (score >= 70) return 'Fair';
    return 'Needs Improvement';
  }

  getPerformanceRecommendations(issues) {
    return issues.map((issue) => ({
      file: issue.file,
      recommendation: `Optimize ${issue.issue}`,
    }));
  }

  /**
   * Get mode information
   */
  getInfo() {
    return {
      name: this.name,
      description: this.description,
      capabilities: this.capabilities,
    };
  }
}

module.exports = CodeMode;

// Made with Bob
