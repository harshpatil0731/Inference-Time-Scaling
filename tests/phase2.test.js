/**
 * tests/phase2.test.js - Phase 2 Calibration Verification
 *
 * Runs all 6 combinations of Effort (LOW, MEDIUM, HIGH) x Difficulty (Easy, Hard)
 * using src/config.js and src/solver.js.
 */

const { createRng, runBatch } = require('../src/solver.js');
const CONFIG = require('../src/config.js');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`✅ PASS: ${message}`);
    passedTests++;
  }
}

console.log('=== TEST SUITE: Phase 2 Calibration (6 Combinations) ===\n');

const results = {};

for (const [diffKey, diffCfg] of Object.entries(CONFIG.DIFFICULTY_PRESETS)) {
  results[diffKey] = {};
  console.log(`Difficulty: ${diffCfg.name} (N=${diffCfg.n})`);

  for (const [effortKey, effortCfg] of Object.entries(CONFIG.EFFORT_PRESETS)) {
    const seed = CONFIG.DEFAULT_SEED + (diffKey === 'EASY' ? 0 : 500) +
                 (effortKey === 'LOW' ? 10 : effortKey === 'MEDIUM' ? 20 : 30);
    const rng = createRng(seed);

    const res = runBatch(diffCfg.n, effortCfg.restarts, effortCfg.maxSteps, CONFIG.TRIALS, rng);
    results[diffKey][effortKey] = res;

    console.log(`  [${effortKey.padEnd(6)}] Success: ${(res.successRate * 100).toFixed(1)}% (${res.solvedTrials}/${res.totalTrials}) | Avg Steps: ${res.avgSteps} | Wall Time: ${res.wallTimeMs}ms`);
  }
  console.log('');
}

// Verification checks:
console.log('--- Verification Checks ---');

const easy = results.EASY;
const hard = results.HARD;

// 1. Easy success rate is strictly increasing
assert(
  easy.LOW.successRate < easy.MEDIUM.successRate && easy.MEDIUM.successRate <= easy.HIGH.successRate,
  'Easy success rate increases with effort (LOW < MEDIUM <= HIGH)'
);

// 2. Easy exhibits diminishing returns
const easyGain1 = easy.MEDIUM.successRate - easy.LOW.successRate;
const easyGain2 = easy.HIGH.successRate - easy.MEDIUM.successRate;
assert(
  easyGain1 > easyGain2,
  `Easy demonstrates diminishing returns: Gain(L->M) = +${(easyGain1*100).toFixed(1)}% > Gain(M->H) = +${(easyGain2*100).toFixed(1)}%`
);

// 3. Hard is visibly more difficult than Easy
assert(
  hard.LOW.successRate < easy.LOW.successRate &&
  hard.MEDIUM.successRate < easy.MEDIUM.successRate &&
  hard.HIGH.successRate < easy.HIGH.successRate,
  'Hard is harder than Easy across all effort levels'
);

// 4. Hard does not reach 100% on HIGH effort
assert(
  hard.HIGH.successRate < 1.0,
  `Hard difficulty does NOT reach 100% on HIGH effort (actual: ${(hard.HIGH.successRate * 100).toFixed(1)}%)`
);

// 5. Monotonic step growth (cost increases with effort across all restarts)
assert(
  easy.LOW.avgSteps < easy.MEDIUM.avgSteps && easy.MEDIUM.avgSteps < easy.HIGH.avgSteps,
  `Easy algorithmic compute cost grows with effort: ${easy.LOW.avgSteps} -> ${easy.MEDIUM.avgSteps} -> ${easy.HIGH.avgSteps}`
);
assert(
  hard.LOW.avgSteps < hard.MEDIUM.avgSteps && hard.MEDIUM.avgSteps < hard.HIGH.avgSteps,
  `Hard algorithmic compute cost grows with effort: ${hard.LOW.avgSteps} -> ${hard.MEDIUM.avgSteps} -> ${hard.HIGH.avgSteps}`
);

// 6. Worst case wall-clock runtime is well under 1000ms
const maxWallTime = Math.max(
  easy.LOW.wallTimeMs, easy.MEDIUM.wallTimeMs, easy.HIGH.wallTimeMs,
  hard.LOW.wallTimeMs, hard.MEDIUM.wallTimeMs, hard.HIGH.wallTimeMs
);
assert(
  maxWallTime < 50,
  `Worst-case batch runtime is well under sub-second requirement (actual max: ${maxWallTime}ms)`
);

console.log(`\n=== SUMMARY: ${passedTests}/${totalTests} tests passed ===`);
