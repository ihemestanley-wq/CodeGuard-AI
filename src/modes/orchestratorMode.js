/**
 * Orchestrator Mode - Connect Flows
 * Coordinates multiple modes and creates comprehensive analysis workflows
 */

const logger = require('../observability/logger');

class OrchestratorMode {
  constructor() {
    this.name = 'Orchestrator Mode';
    this.description = 'Coordinates multiple analysis modes and creates comprehensive workflows';
    this.capabilities = [
      'Multi-mode coordination',
      'Workflow orchestration',
      'Result aggregation',
      'Priority-based execution',
      'Parallel processing',
      'Comprehensive reporting',
    ];
    this.workflows = new Map();
    this.executionHistory = [];
  }

  /**
   * Execute Orchestrator Mode
   */
  async execute(input, options = {}) {
    logger.info('Orchestrator Mode: Starting workflow orchestration');

    try {
      const { diffContent, codeChanges, parsedDiff } = input;
      const { workflow = 'comprehensive', modes = ['plan', 'code', 'advanced'] } = options;

      // Select workflow
      const selectedWorkflow = this.getWorkflow(workflow);

      // Execute workflow
      const results = await this.executeWorkflow(selectedWorkflow, input, modes);

      // Aggregate results
      const aggregatedResults = this.aggregateResults(results);

      // Generate comprehensive report
      const report = this.generateComprehensiveReport(aggregatedResults);

      // Track execution
      this.trackExecution({
        workflow,
        modes,
        results: aggregatedResults,
        timestamp: new Date().toISOString(),
      });

      return {
        success: true,
        mode: 'orchestrator',
        workflow: selectedWorkflow.name,
        results: aggregatedResults,
        report,
        metadata: {
          timestamp: new Date().toISOString(),
          filesAnalyzed: parsedDiff?.length || 0,
          modesExecuted: modes.length,
          executionTime: aggregatedResults.totalExecutionTime,
        },
      };
    } catch (error) {
      logger.error('Orchestrator Mode execution failed', { error: error.message });
      return {
        success: false,
        mode: 'orchestrator',
        error: error.message,
      };
    }
  }

  /**
   * Get predefined workflow
   */
  getWorkflow(workflowName) {
    const workflows = {
      comprehensive: {
        name: 'Comprehensive Analysis',
        description: 'Full analysis using all modes',
        modes: ['plan', 'code', 'advanced'],
        execution: 'sequential',
      },
      quick: {
        name: 'Quick Analysis',
        description: 'Fast analysis using code mode only',
        modes: ['code'],
        execution: 'sequential',
      },
      security: {
        name: 'Security-Focused',
        description: 'Deep security analysis',
        modes: ['code', 'advanced'],
        execution: 'parallel',
      },
      architecture: {
        name: 'Architecture Review',
        description: 'Focus on design and architecture',
        modes: ['plan', 'advanced'],
        execution: 'sequential',
      },
      production: {
        name: 'Production Readiness',
        description: 'Complete production deployment check',
        modes: ['plan', 'code', 'advanced'],
        execution: 'sequential',
      },
    };

    return workflows[workflowName] || workflows.comprehensive;
  }

  /**
   * Execute workflow
   */
  async executeWorkflow(workflow, input, modes) {
    logger.info(`Executing workflow: ${workflow.name}`, { modes });

    const results = {
      plan: null,
      code: null,
      advanced: null,
      executionOrder: [],
      totalExecutionTime: 0,
    };

    const startTime = Date.now();

    if (workflow.execution === 'parallel') {
      // Execute modes in parallel
      const promises = modes.map((mode) => this.executeMode(mode, input));
      const modeResults = await Promise.all(promises);
      
      modes.forEach((mode, index) => {
        results[mode] = modeResults[index];
        results.executionOrder.push(mode);
      });
    } else {
      // Execute modes sequentially
      for (const mode of modes) {
        const result = await this.executeMode(mode, input);
        results[mode] = result;
        results.executionOrder.push(mode);
        
        // Pass results to next mode for context
        input.previousResults = results;
      }
    }

    results.totalExecutionTime = Date.now() - startTime;

    return results;
  }

  /**
   * Execute individual mode
   */
  async executeMode(modeName, input) {
    logger.info(`Executing mode: ${modeName}`);

    try {
      // Import mode dynamically
      const ModeClass = require(`./${modeName}Mode`);
      const mode = new ModeClass();

      const startTime = Date.now();
      const result = await mode.execute(input);
      const executionTime = Date.now() - startTime;

      return {
        ...result,
        executionTime,
      };
    } catch (error) {
      logger.error(`Mode ${modeName} execution failed`, { error: error.message });
      return {
        success: false,
        mode: modeName,
        error: error.message,
      };
    }
  }

  /**
   * Aggregate results from multiple modes
   */
  aggregateResults(results) {
    const aggregated = {
      summary: this.createSummary(results),
      risks: this.aggregateRisks(results),
      recommendations: this.aggregateRecommendations(results),
      metrics: this.aggregateMetrics(results),
      insights: this.generateInsights(results),
      executionOrder: results.executionOrder,
      totalExecutionTime: results.totalExecutionTime,
    };

    return aggregated;
  }

  /**
   * Create summary from all modes
   */
  createSummary(results) {
    const summary = {
      overallRisk: 'UNKNOWN',
      confidence: 0,
      keyFindings: [],
      criticalIssues: 0,
      warnings: 0,
      recommendations: 0,
    };

    // Aggregate from Code Mode
    if (results.code?.success) {
      const codeRisk = results.code.analysis?.risk;
      if (codeRisk) {
        summary.overallRisk = codeRisk.level;
        summary.keyFindings.push(`Code analysis: ${codeRisk.level} risk`);
      }

      const security = results.code.analysis?.security;
      if (security) {
        summary.criticalIssues += security.critical || 0;
        summary.warnings += security.high || 0;
      }
    }

    // Aggregate from Plan Mode
    if (results.plan?.success) {
      const planAnalysis = results.plan.analysis;
      if (planAnalysis?.scalability?.score < 70) {
        summary.warnings++;
        summary.keyFindings.push('Scalability concerns detected');
      }
      if (planAnalysis?.technicalDebt?.total > 10) {
        summary.warnings++;
        summary.keyFindings.push(`${planAnalysis.technicalDebt.total} technical debt items`);
      }
    }

    // Aggregate from Advanced Mode
    if (results.advanced?.success) {
      const advancedAnalysis = results.advanced.analysis;
      if (advancedAnalysis?.predictiveRisk) {
        const predictiveRisk = advancedAnalysis.predictiveRisk;
        summary.keyFindings.push(`Predictive risk: ${predictiveRisk.level}`);
        summary.confidence = predictiveRisk.confidence || 0;
      }
    }

    // Count recommendations
    summary.recommendations = this.countRecommendations(results);

    return summary;
  }

  /**
   * Aggregate risks from all modes
   */
  aggregateRisks(results) {
    const risks = {
      overall: 'LOW',
      score: 0,
      breakdown: {
        security: { level: 'LOW', score: 0, issues: [] },
        performance: { level: 'LOW', score: 0, issues: [] },
        architecture: { level: 'LOW', score: 0, issues: [] },
        maintainability: { level: 'LOW', score: 0, issues: [] },
      },
      factors: [],
    };

    // Collect security risks
    if (results.code?.analysis?.security) {
      const sec = results.code.analysis.security;
      risks.breakdown.security.issues = sec.findings || [];
      risks.breakdown.security.score = (sec.critical * 25) + (sec.high * 15) + (sec.medium * 5);
      risks.breakdown.security.level = this.getRiskLevel(risks.breakdown.security.score);
    }

    // Collect performance risks
    if (results.code?.analysis?.performance) {
      const perf = results.code.analysis.performance;
      risks.breakdown.performance.score = 100 - perf.score;
      risks.breakdown.performance.issues = perf.issues || [];
      risks.breakdown.performance.level = this.getRiskLevel(risks.breakdown.performance.score);
    }

    // Collect architecture risks
    if (results.plan?.analysis?.scalability) {
      const scale = results.plan.analysis.scalability;
      risks.breakdown.architecture.score = 100 - scale.score;
      risks.breakdown.architecture.issues = scale.concerns || [];
      risks.breakdown.architecture.level = this.getRiskLevel(risks.breakdown.architecture.score);
    }

    // Collect maintainability risks
    if (results.plan?.analysis?.maintainability) {
      const maint = results.plan.analysis.maintainability;
      risks.breakdown.maintainability.score = 100 - maint.score;
      risks.breakdown.maintainability.issues = maint.factors || [];
      risks.breakdown.maintainability.level = this.getRiskLevel(risks.breakdown.maintainability.score);
    }

    // Calculate overall risk
    const scores = Object.values(risks.breakdown).map((r) => r.score);
    risks.score = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    risks.overall = this.getRiskLevel(risks.score);

    // Collect risk factors
    if (results.advanced?.analysis?.predictiveRisk) {
      risks.factors = results.advanced.analysis.predictiveRisk.factors || [];
    }

    return risks;
  }

  /**
   * Aggregate recommendations from all modes
   */
  aggregateRecommendations(results) {
    const recommendations = [];

    // Collect from all modes
    ['plan', 'code', 'advanced'].forEach((mode) => {
      if (results[mode]?.recommendations) {
        const modeRecs = Array.isArray(results[mode].recommendations)
          ? results[mode].recommendations
          : [results[mode].recommendations];
        
        modeRecs.forEach((rec) => {
          recommendations.push({
            ...rec,
            source: mode,
          });
        });
      }
    });

    // Sort by priority
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    recommendations.sort((a, b) => {
      return (priorityOrder[a.priority] || 99) - (priorityOrder[b.priority] || 99);
    });

    return {
      total: recommendations.length,
      byPriority: this.groupByPriority(recommendations),
      items: recommendations,
    };
  }

  /**
   * Aggregate metrics from all modes
   */
  aggregateMetrics(results) {
    const metrics = {
      codeQuality: null,
      architecture: null,
      security: null,
      performance: null,
      overall: 0,
    };

    // Code quality metrics
    if (results.code?.analysis?.quality) {
      metrics.codeQuality = results.code.analysis.quality.metrics;
    }

    // Architecture metrics
    if (results.plan?.analysis) {
      metrics.architecture = {
        patterns: results.plan.analysis.architecture?.detectedPatterns?.length || 0,
        scalability: results.plan.analysis.scalability?.score || 0,
        maintainability: results.plan.analysis.maintainability?.score || 0,
      };
    }

    // Security metrics
    if (results.code?.analysis?.security) {
      metrics.security = {
        vulnerabilities: results.code.analysis.security.total || 0,
        critical: results.code.analysis.security.critical || 0,
        high: results.code.analysis.security.high || 0,
      };
    }

    // Performance metrics
    if (results.code?.analysis?.performance) {
      metrics.performance = {
        score: results.code.analysis.performance.score || 0,
        issues: results.code.analysis.performance.issues?.length || 0,
      };
    }

    // Calculate overall score
    const scores = [];
    if (metrics.codeQuality?.maintainability) scores.push(metrics.codeQuality.maintainability);
    if (metrics.architecture?.scalability) scores.push(metrics.architecture.scalability);
    if (metrics.performance?.score) scores.push(metrics.performance.score);
    
    metrics.overall = scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;

    return metrics;
  }

  /**
   * Generate insights from aggregated results
   */
  generateInsights(results) {
    const insights = [];

    // Cross-mode insights
    if (results.plan?.success && results.code?.success) {
      const planRisk = results.plan.analysis?.scalability?.score || 100;
      const codeRisk = results.code.analysis?.risk?.score || 0;

      if (planRisk < 70 && codeRisk > 50) {
        insights.push({
          type: 'cross-mode',
          severity: 'high',
          message: 'Both architectural and code-level risks detected',
          recommendation: 'Consider comprehensive refactoring',
        });
      }
    }

    // Pattern-based insights
    if (results.advanced?.analysis?.patterns) {
      const patterns = results.advanced.analysis.patterns;
      if (patterns.security.length > 0 && patterns.performance.length === 0) {
        insights.push({
          type: 'pattern',
          severity: 'medium',
          message: 'Security patterns detected without performance optimization',
          recommendation: 'Balance security with performance considerations',
        });
      }
    }

    // Trend insights
    if (this.executionHistory.length > 5) {
      const recentRisks = this.executionHistory.slice(-5).map((h) => h.results?.summary?.overallRisk);
      const highRiskCount = recentRisks.filter((r) => r === 'HIGH' || r === 'CRITICAL').length;
      
      if (highRiskCount >= 3) {
        insights.push({
          type: 'trend',
          severity: 'high',
          message: 'Increasing risk trend detected in recent changes',
          recommendation: 'Review development practices and code review process',
        });
      }
    }

    return insights;
  }

  /**
   * Generate comprehensive report
   */
  generateComprehensiveReport(aggregated) {
    return {
      executive_summary: {
        overall_risk: aggregated.summary.overallRisk,
        confidence: aggregated.summary.confidence,
        critical_issues: aggregated.summary.criticalIssues,
        key_findings: aggregated.summary.keyFindings,
        recommendation: this.getExecutiveRecommendation(aggregated),
      },
      detailed_analysis: {
        risks: aggregated.risks,
        metrics: aggregated.metrics,
        insights: aggregated.insights,
      },
      action_items: {
        immediate: this.getImmediateActions(aggregated),
        short_term: this.getShortTermActions(aggregated),
        long_term: this.getLongTermActions(aggregated),
      },
      recommendations: aggregated.recommendations,
      metadata: {
        execution_order: aggregated.executionOrder,
        total_execution_time: aggregated.totalExecutionTime,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Helper methods
   */
  getRiskLevel(score) {
    if (score > 75) return 'CRITICAL';
    if (score > 50) return 'HIGH';
    if (score > 25) return 'MEDIUM';
    return 'LOW';
  }

  countRecommendations(results) {
    let count = 0;
    ['plan', 'code', 'advanced'].forEach((mode) => {
      if (results[mode]?.recommendations) {
        count += Array.isArray(results[mode].recommendations)
          ? results[mode].recommendations.length
          : 1;
      }
    });
    return count;
  }

  groupByPriority(recommendations) {
    return recommendations.reduce((acc, rec) => {
      const priority = rec.priority || 'medium';
      acc[priority] = acc[priority] || [];
      acc[priority].push(rec);
      return acc;
    }, {});
  }

  getExecutiveRecommendation(aggregated) {
    const risk = aggregated.summary.overallRisk;
    
    if (risk === 'CRITICAL' || risk === 'HIGH') {
      return 'DO NOT DEPLOY - Critical issues must be resolved';
    }
    if (risk === 'MEDIUM') {
      return 'REVIEW REQUIRED - Address concerns before deployment';
    }
    return 'APPROVED - Changes are safe for deployment';
  }

  getImmediateActions(aggregated) {
    return aggregated.recommendations.items
      .filter((r) => r.priority === 'critical' || r.priority === 'high')
      .slice(0, 5)
      .map((r) => r.message);
  }

  getShortTermActions(aggregated) {
    return aggregated.recommendations.items
      .filter((r) => r.priority === 'medium')
      .slice(0, 5)
      .map((r) => r.message);
  }

  getLongTermActions(aggregated) {
    return aggregated.recommendations.items
      .filter((r) => r.priority === 'low')
      .slice(0, 5)
      .map((r) => r.message);
  }

  trackExecution(execution) {
    this.executionHistory.push(execution);
    if (this.executionHistory.length > 50) {
      this.executionHistory.shift();
    }
  }

  /**
   * Get mode information
   */
  getInfo() {
    return {
      name: this.name,
      description: this.description,
      capabilities: this.capabilities,
      availableWorkflows: Array.from(this.workflows.keys()),
    };
  }
}

module.exports = OrchestratorMode;

// Made with Bob
