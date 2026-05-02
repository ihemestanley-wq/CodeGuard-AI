/**
 * CodeGuard AI - TypeScript Type Definitions
 * @version 1.0.0
 */

declare module 'codeguard-ai' {
  // ============================================================================
  // Core Types
  // ============================================================================

  /**
   * Risk level classification
   */
  export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

  /**
   * Severity level for findings
   */
  export type Severity = 'low' | 'medium' | 'high' | 'critical';

  /**
   * Deployment decision
   */
  export type DeploymentDecision = 'APPROVE' | 'REQUIRE_APPROVAL' | 'BLOCK';

  /**
   * Finding type
   */
  export type FindingType =
    | 'sql_injection'
    | 'xss'
    | 'command_injection'
    | 'hardcoded_secret'
    | 'path_traversal'
    | 'dangerous_function'
    | 'high_complexity'
    | 'deep_nesting'
    | 'long_function'
    | 'inefficient_loop'
    | 'memory_leak'
    | 'blocking_operation';

  // ============================================================================
  // Analysis Types
  // ============================================================================

  /**
   * Security finding
   */
  export interface SecurityFinding {
    type: FindingType;
    severity: Severity;
    message: string;
    file: string;
    line?: number;
    code?: string;
    description?: string;
    recommendation?: string;
  }

  /**
   * Complexity issue
   */
  export interface ComplexityIssue {
    file: string;
    type: 'high_complexity' | 'deep_nesting' | 'long_function';
    complexity?: number;
    threshold?: number;
    message: string;
    description?: string;
    recommendation?: string;
  }

  /**
   * Performance concern
   */
  export interface PerformanceConcern {
    severity: Severity;
    message: string;
    file: string;
    line?: number;
    description?: string;
    recommendation?: string;
  }

  /**
   * Analysis results
   */
  export interface AnalysisResults {
    securityFindings: SecurityFinding[];
    complexityIssues: ComplexityIssue[];
    filesAnalyzed: number;
    totalLines: number;
    duration?: number;
  }

  /**
   * Risk assessment
   */
  export interface RiskAssessment {
    score: number;
    level: RiskLevel;
    criticalFiles: string[];
    patterns: string[];
    recommendation?: DeploymentDecision;
  }

  /**
   * Deployment guidance
   */
  export interface DeploymentGuidance {
    canDeploy: boolean;
    requiresReview: boolean;
    blockers: string[];
    suggestions: string[];
  }

  /**
   * Complete analysis response
   */
  export interface AnalysisResponse {
    riskScore: number;
    riskLevel: RiskLevel;
    summary: string;
    filesAnalyzed: number;
    totalFindings: number;
    security: SecurityFinding[];
    complexity: ComplexityIssue[];
    performance: PerformanceConcern[];
    criticalFiles: string[];
    patterns: string[];
    recommendation: DeploymentDecision;
    deploymentGuidance: DeploymentGuidance;
  }

  // ============================================================================
  // Diff Parser Types
  // ============================================================================

  /**
   * Parsed diff file
   */
  export interface ParsedDiff {
    file: string;
    additions: number;
    deletions: number;
    chunks: DiffChunk[];
  }

  /**
   * Diff chunk
   */
  export interface DiffChunk {
    oldStart: number;
    oldLines: number;
    newStart: number;
    newLines: number;
    lines: string[];
  }

  /**
   * Code change
   */
  export interface CodeChange {
    file: string;
    code: string;
    extension: string;
  }

  // ============================================================================
  // Configuration Types
  // ============================================================================

  /**
   * Analysis configuration
   */
  export interface AnalysisConfig {
    maxASTDepth?: number;
    maxASTNodes?: number;
    analysisTimeout?: number;
    maxCodeSize?: number;
  }

  /**
   * Security patterns configuration
   */
  export interface SecurityPatterns {
    dangerousFunctions?: string[];
    sqlPatterns?: RegExp[];
    commandPatterns?: RegExp[];
    secretPatterns?: RegExp[];
    pathTraversalPatterns?: RegExp[];
    xssPatterns?: RegExp[];
  }

  /**
   * Complexity thresholds
   */
  export interface ComplexityThresholds {
    cyclomatic?: number;
    cognitive?: number;
    nesting?: number;
  }

  // ============================================================================
  // API Types
  // ============================================================================

  /**
   * API analyze request
   */
  export interface AnalyzeRequest {
    diff: string;
  }

  /**
   * API health response
   */
  export interface HealthResponse {
    status: 'ok' | 'error';
    timestamp: string;
    uptime: number;
    version: string;
    environment?: string;
  }

  /**
   * API error response
   */
  export interface ErrorResponse {
    error: string;
    code: string;
    details?: Record<string, any>;
  }

  // ============================================================================
  // Main Functions
  // ============================================================================

  /**
   * Analyze a pull request diff
   * @param diffContent - Git diff content
   * @returns Analysis report string
   */
  export function analyzePR(diffContent: string): string;

  /**
   * Analyze code changes
   * @param codeChanges - Array of code changes
   * @returns Promise resolving to analysis results
   */
  export function analyzeCodeChanges(
    codeChanges: CodeChange[]
  ): Promise<AnalysisResults>;

  /**
   * Parse git diff
   * @param diffContent - Git diff content
   * @returns Array of parsed diffs
   */
  export function parseDiff(diffContent: string): ParsedDiff[];

  /**
   * Extract code changes from parsed diff
   * @param parsedDiff - Array of parsed diffs
   * @returns Array of code changes
   */
  export function extractCodeChanges(parsedDiff: ParsedDiff[]): CodeChange[];

  /**
   * Calculate risk score
   * @param analysisResults - Analysis results
   * @param parsedDiff - Parsed diff data
   * @param codeChanges - Code changes
   * @returns Risk assessment
   */
  export function calculateRiskScore(
    analysisResults: AnalysisResults,
    parsedDiff: ParsedDiff[],
    codeChanges: CodeChange[]
  ): RiskAssessment;

  /**
   * Generate analysis report
   * @param riskAssessment - Risk assessment
   * @param analysisResults - Analysis results
   * @returns Formatted report string
   */
  export function generateReport(
    riskAssessment: RiskAssessment,
    analysisResults: AnalysisResults
  ): string;

  /**
   * Detect security issues in code
   * @param code - Source code
   * @param filePath - File path
   * @returns Array of security findings
   */
  export function detectSecurityIssues(
    code: string,
    filePath: string
  ): SecurityFinding[];

  /**
   * Calculate cyclomatic complexity
   * @param ast - Abstract syntax tree
   * @returns Complexity score
   */
  export function calculateCyclomaticComplexity(ast: any): number;

  /**
   * Parse code to AST
   * @param code - Source code
   * @param filePath - File path for context
   * @returns AST or null if parsing fails
   */
  export function parseToAST(code: string, filePath: string): any | null;

  // ============================================================================
  // Constants
  // ============================================================================

  /**
   * Default configuration
   */
  export const CONFIG: AnalysisConfig;

  /**
   * Security patterns
   */
  export const SECURITY_PATTERNS: SecurityPatterns;

  /**
   * Complexity thresholds
   */
  export const COMPLEXITY_THRESHOLDS: ComplexityThresholds;
}

// ============================================================================
// Module Augmentation for Express
// ============================================================================

declare global {
  namespace Express {
    interface Request {
      startTime?: number;
    }
  }
}

export {};

// Made with Bob
