/**
 * CodeGuard AI - Multi-Mode Architecture
 * Orchestrates different operational modes for comprehensive code analysis
 */

const PlanMode = require('./planMode');
const CodeMode = require('./codeMode');
const AdvancedMode = require('./advancedMode');
const OrchestratorMode = require('./orchestratorMode');
const logger = require('../observability/logger');

/**
 * Mode Registry
 * Central registry for all available modes
 */
class ModeRegistry {
  constructor() {
    this.modes = new Map();
    this.currentMode = null;
    this.modeHistory = [];
    
    // Register all modes
    this.registerMode('plan', new PlanMode());
    this.registerMode('code', new CodeMode());
    this.registerMode('advanced', new AdvancedMode());
    this.registerMode('orchestrator', new OrchestratorMode());
    
    logger.info('Mode Registry initialized', {
      availableModes: Array.from(this.modes.keys()),
    });
  }

  /**
   * Register a new mode
   */
  registerMode(name, modeInstance) {
    if (this.modes.has(name)) {
      logger.warn(`Mode ${name} already registered, overwriting`);
    }
    this.modes.set(name, modeInstance);
    logger.info(`Mode registered: ${name}`);
  }

  /**
   * Switch to a different mode
   */
  switchMode(modeName, context = {}) {
    if (!this.modes.has(modeName)) {
      throw new Error(`Mode ${modeName} not found. Available modes: ${Array.from(this.modes.keys()).join(', ')}`);
    }

    const previousMode = this.currentMode;
    this.currentMode = modeName;
    
    // Track mode history
    this.modeHistory.push({
      mode: modeName,
      timestamp: new Date().toISOString(),
      context,
    });

    logger.info('Mode switched', {
      from: previousMode,
      to: modeName,
      context,
    });

    return this.modes.get(modeName);
  }

  /**
   * Get current mode instance
   */
  getCurrentMode() {
    if (!this.currentMode) {
      return null;
    }
    return this.modes.get(this.currentMode);
  }

  /**
   * Execute current mode
   */
  async execute(input, options = {}) {
    const mode = this.getCurrentMode();
    if (!mode) {
      throw new Error('No mode selected. Use switchMode() first.');
    }

    logger.info('Executing mode', {
      mode: this.currentMode,
      inputSize: JSON.stringify(input).length,
    });

    const startTime = Date.now();
    const result = await mode.execute(input, options);
    const executionTime = Date.now() - startTime;

    logger.info('Mode execution completed', {
      mode: this.currentMode,
      executionTime,
      success: result.success,
    });

    return {
      ...result,
      metadata: {
        ...result.metadata,
        mode: this.currentMode,
        executionTime,
      },
    };
  }

  /**
   * Get mode information
   */
  getModeInfo(modeName) {
    const mode = this.modes.get(modeName);
    if (!mode) {
      return null;
    }
    return mode.getInfo();
  }

  /**
   * List all available modes
   */
  listModes() {
    return Array.from(this.modes.keys()).map((name) => ({
      name,
      info: this.getModeInfo(name),
    }));
  }

  /**
   * Get mode execution history
   */
  getHistory() {
    return this.modeHistory;
  }
}

// Export singleton instance
const registry = new ModeRegistry();

module.exports = {
  ModeRegistry,
  registry,
  switchMode: (name, context) => registry.switchMode(name, context),
  execute: (input, options) => registry.execute(input, options),
  getCurrentMode: () => registry.getCurrentMode(),
  listModes: () => registry.listModes(),
  getModeInfo: (name) => registry.getModeInfo(name),
  getHistory: () => registry.getHistory(),
};

// Made with Bob
