/**
 * Plan Mode - Architecture & System Design
 * Analyzes code changes from an architectural perspective
 * Focuses on: design patterns, system architecture, scalability, maintainability
 */

const logger = require('../observability/logger');

class PlanMode {
  constructor() {
    this.name = 'Plan Mode';
    this.description = 'Architecture and system design analysis';
    this.capabilities = [
      'Design pattern detection',
      'Architecture assessment',
      'Scalability analysis',
      'Maintainability evaluation',
      'Technical debt identification',
      'Dependency analysis',
    ];
  }

  /**
   * Execute Plan Mode analysis
   */
  async execute(input, options = {}) {
    logger.info('Plan Mode: Starting architecture analysis');

    try {
      const { diffContent, codeChanges, parsedDiff } = input;

      // Analyze architecture patterns
      const architectureAnalysis = this.analyzeArchitecture(codeChanges);

      // Analyze design patterns
      const designPatterns = this.detectDesignPatterns(codeChanges);

      // Analyze scalability
      const scalabilityAssessment = this.assessScalability(codeChanges);

      // Analyze maintainability
      const maintainabilityScore = this.evaluateMaintainability(codeChanges);

      // Analyze technical debt
      const technicalDebt = this.identifyTechnicalDebt(codeChanges);

      // Analyze dependencies
      const dependencyAnalysis = this.analyzeDependencies(parsedDiff);

      // Generate recommendations
      const recommendations = this.generateRecommendations({
        architectureAnalysis,
        designPatterns,
        scalabilityAssessment,
        maintainabilityScore,
        technicalDebt,
        dependencyAnalysis,
      });

      return {
        success: true,
        mode: 'plan',
        analysis: {
          architecture: architectureAnalysis,
          designPatterns,
          scalability: scalabilityAssessment,
          maintainability: maintainabilityScore,
          technicalDebt,
          dependencies: dependencyAnalysis,
        },
        recommendations,
        metadata: {
          timestamp: new Date().toISOString(),
          filesAnalyzed: parsedDiff?.length || 0,
        },
      };
    } catch (error) {
      logger.error('Plan Mode execution failed', { error: error.message });
      return {
        success: false,
        mode: 'plan',
        error: error.message,
      };
    }
  }

  /**
   * Analyze architecture patterns
   */
  analyzeArchitecture(codeChanges) {
    const patterns = {
      mvc: false,
      microservices: false,
      layered: false,
      eventDriven: false,
      serverless: false,
    };

    const indicators = {
      mvc: ['controller', 'model', 'view', 'router'],
      microservices: ['service', 'api', 'gateway', 'docker', 'kubernetes'],
      layered: ['repository', 'service', 'controller', 'dto'],
      eventDriven: ['event', 'listener', 'subscriber', 'publisher', 'queue'],
      serverless: ['lambda', 'function', 'trigger', 'handler'],
    };

    codeChanges.forEach((change) => {
      const content = change.content.toLowerCase();
      const filename = change.filename.toLowerCase();

      Object.keys(indicators).forEach((pattern) => {
        indicators[pattern].forEach((indicator) => {
          if (content.includes(indicator) || filename.includes(indicator)) {
            patterns[pattern] = true;
          }
        });
      });
    });

    return {
      detectedPatterns: Object.keys(patterns).filter((p) => patterns[p]),
      confidence: this.calculateConfidence(patterns),
      details: patterns,
    };
  }

  /**
   * Detect design patterns
   */
  detectDesignPatterns(codeChanges) {
    const patterns = [];

    const patternIndicators = {
      Singleton: ['getInstance', 'instance', 'static instance'],
      Factory: ['create', 'factory', 'builder'],
      Observer: ['subscribe', 'observer', 'listener', 'emit'],
      Strategy: ['strategy', 'algorithm', 'policy'],
      Decorator: ['decorator', 'wrapper', 'enhance'],
      Adapter: ['adapter', 'wrapper', 'convert'],
      Repository: ['repository', 'findBy', 'save', 'delete'],
      Middleware: ['middleware', 'next', 'use'],
    };

    codeChanges.forEach((change) => {
      const content = change.content.toLowerCase();

      Object.entries(patternIndicators).forEach(([pattern, indicators]) => {
        const matches = indicators.filter((ind) => content.includes(ind));
        if (matches.length > 0) {
          patterns.push({
            pattern,
            file: change.filename,
            confidence: matches.length / indicators.length,
            indicators: matches,
          });
        }
      });
    });

    return patterns;
  }

  /**
   * Assess scalability
   */
  assessScalability(codeChanges) {
    const concerns = [];
    let score = 100;

    const scalabilityIssues = {
      'synchronous blocking': { severity: 'high', impact: -15 },
      'global state': { severity: 'high', impact: -20 },
      'hardcoded limits': { severity: 'medium', impact: -10 },
      'n+1 query': { severity: 'high', impact: -15 },
      'memory leak': { severity: 'critical', impact: -25 },
      'tight coupling': { severity: 'medium', impact: -10 },
    };

    codeChanges.forEach((change) => {
      const content = change.content.toLowerCase();

      Object.entries(scalabilityIssues).forEach(([issue, details]) => {
        if (content.includes(issue.replace(' ', ''))) {
          concerns.push({
            issue,
            file: change.filename,
            severity: details.severity,
            impact: details.impact,
          });
          score += details.impact;
        }
      });
    });

    return {
      score: Math.max(0, score),
      level: this.getScalabilityLevel(score),
      concerns,
      recommendations: this.getScalabilityRecommendations(concerns),
    };
  }

  /**
   * Evaluate maintainability
   */
  evaluateMaintainability(codeChanges) {
    let score = 100;
    const factors = [];

    codeChanges.forEach((change) => {
      const lines = change.content.split('\n');
      const codeLines = lines.filter((l) => l.trim() && !l.trim().startsWith('//')).length;

      // Check file size
      if (codeLines > 500) {
        score -= 10;
        factors.push({ factor: 'Large file', file: change.filename, impact: -10 });
      }

      // Check for comments
      const commentLines = lines.filter((l) => l.trim().startsWith('//')).length;
      const commentRatio = commentLines / codeLines;
      if (commentRatio < 0.1) {
        score -= 5;
        factors.push({ factor: 'Low comment ratio', file: change.filename, impact: -5 });
      }

      // Check for magic numbers
      const magicNumbers = change.content.match(/\b\d{2,}\b/g);
      if (magicNumbers && magicNumbers.length > 5) {
        score -= 5;
        factors.push({ factor: 'Magic numbers', file: change.filename, impact: -5 });
      }

      // Check for long functions
      const functionMatches = change.content.match(/function\s+\w+\s*\([^)]*\)\s*{/g);
      if (functionMatches && functionMatches.length > 0) {
        // Simplified check - in real implementation, would parse AST
        const avgFunctionSize = codeLines / functionMatches.length;
        if (avgFunctionSize > 50) {
          score -= 10;
          factors.push({ factor: 'Long functions', file: change.filename, impact: -10 });
        }
      }
    });

    return {
      score: Math.max(0, score),
      level: this.getMaintainabilityLevel(score),
      factors,
    };
  }

  /**
   * Identify technical debt
   */
  identifyTechnicalDebt(codeChanges) {
    const debt = [];

    const debtIndicators = {
      'TODO': 'low',
      'FIXME': 'medium',
      'HACK': 'high',
      'XXX': 'high',
      'deprecated': 'medium',
      'workaround': 'medium',
      'temporary': 'low',
    };

    codeChanges.forEach((change) => {
      const lines = change.content.split('\n');

      lines.forEach((line, index) => {
        Object.entries(debtIndicators).forEach(([indicator, severity]) => {
          if (line.toLowerCase().includes(indicator.toLowerCase())) {
            debt.push({
              type: indicator,
              severity,
              file: change.filename,
              line: index + 1,
              content: line.trim(),
            });
          }
        });
      });
    });

    return {
      total: debt.length,
      byType: this.groupBy(debt, 'type'),
      bySeverity: this.groupBy(debt, 'severity'),
      items: debt,
    };
  }

  /**
   * Analyze dependencies
   */
  analyzeDependencies(parsedDiff) {
    const dependencies = {
      added: [],
      removed: [],
      updated: [],
    };

    parsedDiff.forEach((file) => {
      if (file.filename.includes('package.json') || file.filename.includes('requirements.txt')) {
        file.chunks.forEach((chunk) => {
          chunk.changes.forEach((change) => {
            if (change.type === 'add' && change.content.includes('dependencies')) {
              dependencies.added.push(this.extractDependency(change.content));
            } else if (change.type === 'del' && change.content.includes('dependencies')) {
              dependencies.removed.push(this.extractDependency(change.content));
            }
          });
        });
      }
    });

    return {
      summary: {
        added: dependencies.added.length,
        removed: dependencies.removed.length,
        updated: dependencies.updated.length,
      },
      details: dependencies,
      risks: this.assessDependencyRisks(dependencies),
    };
  }

  /**
   * Generate recommendations
   */
  generateRecommendations(analysis) {
    const recommendations = [];

    // Architecture recommendations
    if (analysis.architectureAnalysis.detectedPatterns.length === 0) {
      recommendations.push({
        category: 'Architecture',
        priority: 'medium',
        message: 'Consider adopting a clear architectural pattern (MVC, Layered, etc.)',
      });
    }

    // Scalability recommendations
    if (analysis.scalability.score < 70) {
      recommendations.push({
        category: 'Scalability',
        priority: 'high',
        message: 'Address scalability concerns before deploying to production',
        details: analysis.scalability.recommendations,
      });
    }

    // Maintainability recommendations
    if (analysis.maintainability.score < 70) {
      recommendations.push({
        category: 'Maintainability',
        priority: 'medium',
        message: 'Improve code maintainability through refactoring',
      });
    }

    // Technical debt recommendations
    if (analysis.technicalDebt.total > 10) {
      recommendations.push({
        category: 'Technical Debt',
        priority: 'low',
        message: `Address ${analysis.technicalDebt.total} technical debt items`,
      });
    }

    return recommendations;
  }

  /**
   * Helper methods
   */
  calculateConfidence(patterns) {
    const detected = Object.values(patterns).filter(Boolean).length;
    const total = Object.keys(patterns).length;
    return detected / total;
  }

  getScalabilityLevel(score) {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Poor';
  }

  getMaintainabilityLevel(score) {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Poor';
  }

  getScalabilityRecommendations(concerns) {
    return concerns.map((c) => `Address ${c.issue} in ${c.file}`);
  }

  groupBy(array, key) {
    return array.reduce((result, item) => {
      const group = item[key];
      result[group] = result[group] || [];
      result[group].push(item);
      return result;
    }, {});
  }

  extractDependency(content) {
    const match = content.match(/"([^"]+)":\s*"([^"]+)"/);
    return match ? { name: match[1], version: match[2] } : null;
  }

  assessDependencyRisks(dependencies) {
    const risks = [];
    if (dependencies.added.length > 5) {
      risks.push('Large number of new dependencies added');
    }
    return risks;
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

module.exports = PlanMode;

// Made with Bob
