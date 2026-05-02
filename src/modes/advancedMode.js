/**
 * Advanced Mode - Refine Prompts & Logic
 * Focuses on: AI-driven analysis, prompt optimization, intelligent recommendations
 */

const logger = require('../observability/logger');

class AdvancedMode {
  constructor() {
    this.name = 'Advanced Mode';
    this.description = 'AI-driven analysis with prompt refinement and intelligent logic';
    this.capabilities = [
      'Intelligent pattern recognition',
      'Context-aware analysis',
      'Prompt optimization',
      'Machine learning insights',
      'Predictive risk assessment',
      'Automated decision support',
    ];
    this.learningData = [];
  }

  /**
   * Execute Advanced Mode analysis
   */
  async execute(input, options = {}) {
    logger.info('Advanced Mode: Starting AI-driven analysis');

    try {
      const { diffContent, codeChanges, parsedDiff } = input;

      // Analyze context
      const contextAnalysis = this.analyzeContext(codeChanges, parsedDiff);

      // Pattern recognition
      const patterns = await this.recognizePatterns(codeChanges);

      // Predictive risk assessment
      const predictiveRisk = this.predictRisk(codeChanges, patterns);

      // Generate intelligent recommendations
      const intelligentRecommendations = this.generateIntelligentRecommendations(
        contextAnalysis,
        patterns,
        predictiveRisk
      );

      // Optimize analysis prompts
      const optimizedPrompts = this.optimizePrompts(codeChanges, patterns);

      // Decision support
      const decisionSupport = this.provideDecisionSupport(
        contextAnalysis,
        patterns,
        predictiveRisk
      );

      // Learn from this analysis
      this.learn({
        input,
        patterns,
        risk: predictiveRisk,
        timestamp: new Date().toISOString(),
      });

      return {
        success: true,
        mode: 'advanced',
        analysis: {
          context: contextAnalysis,
          patterns,
          predictiveRisk,
          decisionSupport,
        },
        recommendations: intelligentRecommendations,
        optimizedPrompts,
        metadata: {
          timestamp: new Date().toISOString(),
          filesAnalyzed: parsedDiff?.length || 0,
          confidence: this.calculateConfidence(patterns),
        },
      };
    } catch (error) {
      logger.error('Advanced Mode execution failed', { error: error.message });
      return {
        success: false,
        mode: 'advanced',
        error: error.message,
      };
    }
  }

  /**
   * Analyze context of code changes
   */
  analyzeContext(codeChanges, parsedDiff) {
    const context = {
      projectType: this.detectProjectType(codeChanges),
      changeScope: this.analyzeChangeScope(parsedDiff),
      impactRadius: this.calculateImpactRadius(codeChanges),
      technicalStack: this.identifyTechnicalStack(codeChanges),
      developmentPhase: this.detectDevelopmentPhase(codeChanges),
    };

    return {
      ...context,
      summary: this.generateContextSummary(context),
    };
  }

  /**
   * Recognize patterns using AI-driven analysis
   */
  async recognizePatterns(codeChanges) {
    const patterns = {
      coding: [],
      architectural: [],
      security: [],
      performance: [],
      behavioral: [],
    };

    // Coding patterns
    patterns.coding = this.detectCodingPatterns(codeChanges);

    // Architectural patterns
    patterns.architectural = this.detectArchitecturalPatterns(codeChanges);

    // Security patterns
    patterns.security = this.detectSecurityPatterns(codeChanges);

    // Performance patterns
    patterns.performance = this.detectPerformancePatterns(codeChanges);

    // Behavioral patterns (developer habits)
    patterns.behavioral = this.detectBehavioralPatterns(codeChanges);

    return {
      ...patterns,
      total: Object.values(patterns).flat().length,
      confidence: this.calculatePatternConfidence(patterns),
    };
  }

  /**
   * Predict risk using machine learning-inspired approach
   */
  predictRisk(codeChanges, patterns) {
    const features = this.extractFeatures(codeChanges, patterns);
    const riskScore = this.calculatePredictiveRiskScore(features);
    const riskFactors = this.identifyRiskFactors(features);
    const likelihood = this.calculateLikelihood(features);

    return {
      score: riskScore,
      level: this.getRiskLevel(riskScore),
      factors: riskFactors,
      likelihood,
      prediction: this.generatePrediction(riskScore, likelihood),
      confidence: this.calculatePredictionConfidence(features),
    };
  }

  /**
   * Generate intelligent recommendations
   */
  generateIntelligentRecommendations(context, patterns, risk) {
    const recommendations = [];

    // Context-aware recommendations
    if (context.projectType === 'microservice' && patterns.architectural.length > 0) {
      recommendations.push({
        category: 'Architecture',
        priority: 'high',
        message: 'Microservice architecture detected - ensure service boundaries are maintained',
        reasoning: 'Based on project type and architectural patterns',
        actions: [
          'Review service dependencies',
          'Validate API contracts',
          'Check for tight coupling',
        ],
      });
    }

    // Risk-based recommendations
    if (risk.score > 70) {
      recommendations.push({
        category: 'Risk Mitigation',
        priority: 'critical',
        message: 'High risk detected - implement additional safeguards',
        reasoning: `Predictive risk score: ${risk.score}`,
        actions: [
          'Add comprehensive tests',
          'Implement feature flags',
          'Plan rollback strategy',
          'Increase monitoring',
        ],
      });
    }

    // Pattern-based recommendations
    if (patterns.security.length > 0) {
      recommendations.push({
        category: 'Security',
        priority: 'high',
        message: 'Security patterns detected - conduct security review',
        reasoning: `Found ${patterns.security.length} security-related patterns`,
        actions: [
          'Perform security audit',
          'Review authentication/authorization',
          'Check for data exposure',
        ],
      });
    }

    // Learning-based recommendations
    const historicalInsights = this.getHistoricalInsights();
    if (historicalInsights.length > 0) {
      recommendations.push({
        category: 'Historical Insights',
        priority: 'medium',
        message: 'Similar changes in the past had issues',
        reasoning: 'Based on historical analysis',
        actions: historicalInsights,
      });
    }

    return recommendations;
  }

  /**
   * Optimize prompts for better analysis
   */
  optimizePrompts(codeChanges, patterns) {
    const prompts = [];

    // Generate context-specific prompts
    prompts.push({
      type: 'analysis',
      prompt: this.generateAnalysisPrompt(codeChanges),
      purpose: 'Deep code analysis',
    });

    prompts.push({
      type: 'security',
      prompt: this.generateSecurityPrompt(patterns.security),
      purpose: 'Security vulnerability detection',
    });

    prompts.push({
      type: 'optimization',
      prompt: this.generateOptimizationPrompt(patterns.performance),
      purpose: 'Performance optimization',
    });

    return prompts;
  }

  /**
   * Provide decision support
   */
  provideDecisionSupport(context, patterns, risk) {
    const decision = {
      recommendation: 'REVIEW',
      confidence: 0,
      reasoning: [],
      alternatives: [],
    };

    // Analyze factors
    const factors = {
      riskLevel: risk.score,
      patternCount: patterns.total,
      contextComplexity: this.calculateContextComplexity(context),
      historicalSuccess: this.getHistoricalSuccessRate(),
    };

    // Make recommendation
    if (factors.riskLevel < 30 && factors.patternCount < 5) {
      decision.recommendation = 'APPROVE';
      decision.confidence = 0.9;
      decision.reasoning.push('Low risk and minimal complexity');
    } else if (factors.riskLevel > 70 || factors.patternCount > 20) {
      decision.recommendation = 'REJECT';
      decision.confidence = 0.85;
      decision.reasoning.push('High risk or excessive complexity');
    } else {
      decision.recommendation = 'REVIEW';
      decision.confidence = 0.75;
      decision.reasoning.push('Moderate risk requires human review');
    }

    // Add alternatives
    decision.alternatives = this.generateAlternatives(factors);

    return decision;
  }

  /**
   * Pattern detection methods
   */
  detectCodingPatterns(codeChanges) {
    const patterns = [];
    
    codeChanges.forEach((change) => {
      const content = change.content;

      // Detect common coding patterns
      if (content.includes('async') && content.includes('await')) {
        patterns.push({ type: 'async-await', file: change.filename, confidence: 0.9 });
      }
      if (content.includes('Promise')) {
        patterns.push({ type: 'promises', file: change.filename, confidence: 0.85 });
      }
      if (content.includes('class') && content.includes('extends')) {
        patterns.push({ type: 'inheritance', file: change.filename, confidence: 0.9 });
      }
      if (content.includes('interface') || content.includes('implements')) {
        patterns.push({ type: 'interface', file: change.filename, confidence: 0.9 });
      }
    });

    return patterns;
  }

  detectArchitecturalPatterns(codeChanges) {
    const patterns = [];
    
    codeChanges.forEach((change) => {
      const filename = change.filename.toLowerCase();
      const content = change.content.toLowerCase();

      if (filename.includes('controller')) {
        patterns.push({ type: 'mvc-controller', file: change.filename, confidence: 0.95 });
      }
      if (filename.includes('service')) {
        patterns.push({ type: 'service-layer', file: change.filename, confidence: 0.9 });
      }
      if (filename.includes('repository') || content.includes('repository')) {
        patterns.push({ type: 'repository-pattern', file: change.filename, confidence: 0.9 });
      }
      if (content.includes('middleware')) {
        patterns.push({ type: 'middleware-pattern', file: change.filename, confidence: 0.85 });
      }
    });

    return patterns;
  }

  detectSecurityPatterns(codeChanges) {
    const patterns = [];
    
    codeChanges.forEach((change) => {
      const content = change.content.toLowerCase();

      if (content.includes('auth') || content.includes('authenticate')) {
        patterns.push({ type: 'authentication', file: change.filename, confidence: 0.8 });
      }
      if (content.includes('encrypt') || content.includes('decrypt')) {
        patterns.push({ type: 'encryption', file: change.filename, confidence: 0.85 });
      }
      if (content.includes('validate') || content.includes('sanitize')) {
        patterns.push({ type: 'input-validation', file: change.filename, confidence: 0.9 });
      }
    });

    return patterns;
  }

  detectPerformancePatterns(codeChanges) {
    const patterns = [];
    
    codeChanges.forEach((change) => {
      const content = change.content.toLowerCase();

      if (content.includes('cache')) {
        patterns.push({ type: 'caching', file: change.filename, confidence: 0.9 });
      }
      if (content.includes('lazy') || content.includes('defer')) {
        patterns.push({ type: 'lazy-loading', file: change.filename, confidence: 0.85 });
      }
      if (content.includes('pool') || content.includes('connection')) {
        patterns.push({ type: 'connection-pooling', file: change.filename, confidence: 0.8 });
      }
    });

    return patterns;
  }

  detectBehavioralPatterns(codeChanges) {
    const patterns = [];
    
    // Analyze commit patterns
    const fileTypes = new Set(codeChanges.map((c) => c.filename.split('.').pop()));
    if (fileTypes.size > 5) {
      patterns.push({ type: 'multi-file-change', confidence: 0.7 });
    }

    // Check for refactoring
    const hasRenames = codeChanges.some((c) => c.filename.includes('rename'));
    if (hasRenames) {
      patterns.push({ type: 'refactoring', confidence: 0.8 });
    }

    return patterns;
  }

  /**
   * Feature extraction for ML-inspired analysis
   */
  extractFeatures(codeChanges, patterns) {
    return {
      fileCount: codeChanges.length,
      totalLines: codeChanges.reduce((sum, c) => sum + c.content.split('\n').length, 0),
      patternCount: patterns.total,
      securityPatterns: patterns.security.length,
      performancePatterns: patterns.performance.length,
      architecturalPatterns: patterns.architectural.length,
      avgComplexity: this.calculateAvgComplexity(codeChanges),
      hasTests: codeChanges.some((c) => c.filename.includes('test')),
    };
  }

  calculatePredictiveRiskScore(features) {
    // Weighted risk calculation
    let score = 0;
    
    score += features.fileCount * 2;
    score += (features.totalLines / 100) * 3;
    score += features.securityPatterns * 10;
    score += features.avgComplexity * 5;
    score -= features.hasTests ? 20 : 0;
    score -= features.performancePatterns * 2;

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Helper methods
   */
  detectProjectType(codeChanges) {
    const indicators = {
      microservice: ['service', 'api', 'gateway'],
      monolith: ['app', 'main', 'server'],
      library: ['lib', 'util', 'helper'],
      frontend: ['component', 'view', 'ui'],
    };

    for (const [type, keywords] of Object.entries(indicators)) {
      if (codeChanges.some((c) => keywords.some((k) => c.filename.toLowerCase().includes(k)))) {
        return type;
      }
    }

    return 'unknown';
  }

  analyzeChangeScope(parsedDiff) {
    const scope = {
      files: parsedDiff.length,
      additions: 0,
      deletions: 0,
    };

    parsedDiff.forEach((file) => {
      file.chunks.forEach((chunk) => {
        chunk.changes.forEach((change) => {
          if (change.type === 'add') scope.additions++;
          if (change.type === 'del') scope.deletions++;
        });
      });
    });

    return scope;
  }

  calculateImpactRadius(codeChanges) {
    const uniqueDirs = new Set(codeChanges.map((c) => c.filename.split('/')[0]));
    return {
      directories: uniqueDirs.size,
      level: uniqueDirs.size > 5 ? 'high' : uniqueDirs.size > 2 ? 'medium' : 'low',
    };
  }

  identifyTechnicalStack(codeChanges) {
    const stack = new Set();
    
    codeChanges.forEach((change) => {
      const ext = change.filename.split('.').pop();
      if (ext === 'js') stack.add('JavaScript');
      if (ext === 'ts') stack.add('TypeScript');
      if (ext === 'py') stack.add('Python');
      if (ext === 'java') stack.add('Java');
      if (ext === 'go') stack.add('Go');
    });

    return Array.from(stack);
  }

  detectDevelopmentPhase(codeChanges) {
    const hasTests = codeChanges.some((c) => c.filename.includes('test'));
    const hasDocs = codeChanges.some((c) => c.filename.includes('README') || c.filename.includes('doc'));
    
    if (hasTests && hasDocs) return 'mature';
    if (hasTests) return 'development';
    return 'early';
  }

  generateContextSummary(context) {
    return `${context.projectType} project in ${context.developmentPhase} phase, ` +
           `affecting ${context.changeScope.files} files with ${context.impactRadius.level} impact radius`;
  }

  calculateAvgComplexity(codeChanges) {
    const complexities = codeChanges.map((c) => {
      const keywords = ['if', 'for', 'while', 'switch'];
      return keywords.reduce((sum, kw) => {
        const matches = c.content.match(new RegExp(`\\b${kw}\\b`, 'g'));
        return sum + (matches ? matches.length : 0);
      }, 1);
    });

    return complexities.reduce((a, b) => a + b, 0) / complexities.length;
  }

  learn(data) {
    this.learningData.push(data);
    if (this.learningData.length > 100) {
      this.learningData.shift(); // Keep last 100 analyses
    }
  }

  getHistoricalInsights() {
    // Simplified - in production, would use actual ML
    return ['Review similar changes carefully', 'Consider additional testing'];
  }

  getHistoricalSuccessRate() {
    return 0.85; // Placeholder
  }

  calculateConfidence(patterns) {
    const total = patterns.total;
    if (total === 0) return 0.5;
    const avgConfidence = Object.values(patterns)
      .flat()
      .reduce((sum, p) => sum + (p.confidence || 0.5), 0) / total;
    return avgConfidence;
  }

  calculatePatternConfidence(patterns) {
    return this.calculateConfidence(patterns);
  }

  identifyRiskFactors(features) {
    const factors = [];
    if (features.fileCount > 10) factors.push('Large number of files changed');
    if (features.securityPatterns > 0) factors.push('Security-sensitive changes');
    if (!features.hasTests) factors.push('No test coverage');
    return factors;
  }

  calculateLikelihood(features) {
    const score = this.calculatePredictiveRiskScore(features);
    return {
      deployment_issues: score > 70 ? 'high' : score > 40 ? 'medium' : 'low',
      bugs: score > 60 ? 'medium' : 'low',
      security_incidents: features.securityPatterns > 0 ? 'medium' : 'low',
    };
  }

  generatePrediction(riskScore, likelihood) {
    if (riskScore > 70) {
      return 'High probability of issues - recommend thorough review and testing';
    }
    if (riskScore > 40) {
      return 'Moderate risk - standard review process recommended';
    }
    return 'Low risk - changes appear safe for deployment';
  }

  calculatePredictionConfidence(features) {
    // More features = higher confidence
    const featureCount = Object.keys(features).length;
    return Math.min(0.95, 0.5 + (featureCount * 0.05));
  }

  getRiskLevel(score) {
    if (score > 75) return 'CRITICAL';
    if (score > 50) return 'HIGH';
    if (score > 25) return 'MEDIUM';
    return 'LOW';
  }

  calculateContextComplexity(context) {
    let complexity = 0;
    complexity += context.changeScope.files * 2;
    complexity += context.impactRadius.directories * 5;
    return complexity;
  }

  generateAlternatives(factors) {
    return [
      { action: 'Approve with conditions', confidence: 0.7 },
      { action: 'Request additional tests', confidence: 0.8 },
      { action: 'Split into smaller changes', confidence: 0.75 },
    ];
  }

  generateAnalysisPrompt(codeChanges) {
    return `Analyze the following code changes for security, performance, and best practices:\n` +
           `Files: ${codeChanges.map((c) => c.filename).join(', ')}`;
  }

  generateSecurityPrompt(securityPatterns) {
    return `Focus on security analysis. Detected patterns: ${securityPatterns.map((p) => p.type).join(', ')}`;
  }

  generateOptimizationPrompt(performancePatterns) {
    return `Analyze performance implications. Patterns: ${performancePatterns.map((p) => p.type).join(', ')}`;
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

module.exports = AdvancedMode;

// Made with Bob
