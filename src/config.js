/**
 * config.js - Calibrated Configuration for Effort Dial
 *
 * Scoped and empirically calibrated in Phase 2:
 * - Effort Presets scale both parallel sampling (restarts) and sequential refinement (maxSteps).
 * - Task Difficulty sets the constraint problem hardness (N-Queens board size).
 * - Calibrated so Easy shows increasing success rate with diminishing returns,
 *   while Hard visibly resists LOW/MEDIUM and demonstrates that HIGH effort does not reach 100%.
 */

const CONFIG = {
  // Number of trials per batch run
  TRIALS: 30,

  // Default seed for reproducible live runs
  DEFAULT_SEED: 42,

  // Effort presets: compute budget = restarts * maxSteps
  EFFORT_PRESETS: {
    LOW: {
      id: 'LOW',
      name: 'LOW',
      restarts: 1,
      maxSteps: 20,
      description: '1 restart × 20 steps (quick single attempt)'
    },
    MEDIUM: {
      id: 'MEDIUM',
      name: 'MEDIUM',
      restarts: 3,
      maxSteps: 25,
      description: '3 restarts × 25 steps (moderate compute budget)'
    },
    HIGH: {
      id: 'HIGH',
      name: 'HIGH',
      restarts: 5,
      maxSteps: 40,
      description: '5 restarts × 40 steps (large compute budget)'
    }
  },

  // Task difficulty presets: N-Queens problem size
  DIFFICULTY_PRESETS: {
    EASY: {
      id: 'EASY',
      name: 'Easy',
      n: 8,
      description: '8-Queens constraint problem (solves readily, displays diminishing returns)'
    },
    HARD: {
      id: 'HARD',
      name: 'Hard',
      n: 24,
      description: '24-Queens constraint problem (resists LOW/MEDIUM, caps below 100% on HIGH)'
    }
  }
};

// Module export for Node.js test environment and browser window global
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}
if (typeof window !== 'undefined') {
  window.CONFIG = CONFIG;
}
