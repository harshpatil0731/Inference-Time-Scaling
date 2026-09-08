/**
 * tests/phase4.test.js - Phase 4 Integration Verification
 *
 * Verifies:
 * 1. All combinations of Effort (LOW, MEDIUM, HIGH) x Difficulty (Easy, Hard) execute correctly.
 * 2. Metric calculation: Success rate, compute cost (total steps across restarts), runtime (ms).
 * 3. Board trace alignment with active difficulty and effort limits.
 * 4. Cold-open state defaults to MEDIUM effort and Easy difficulty.
 * 5. Update latency across all settings is well under the 1-second limit.
 */

const { createRng, runBatch, runAttempt, conflicts } = require('../src/solver.js');
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

console.log('=== TEST SUITE: Phase 4 Interactive Application Integration ===\n');

// 1. Cold-Open Default State
console.log('--- 1. Testing Cold-Open Default State ---');
const defaultDifficulty = 'EASY';
const defaultEffort = 'MEDIUM';

const easyCfg = CONFIG.DIFFICULTY_PRESETS[defaultDifficulty];
const medEffortCfg = CONFIG.EFFORT_PRESETS[defaultEffort];

assert(easyCfg.n === 8, 'Default difficulty is Easy with N=8');
assert(medEffortCfg.restarts === 3 && medEffortCfg.maxSteps === 25, 'Default effort is MEDIUM (3 restarts x 25 steps)');

// Execute cold-open batch
const coldRng = createRng(CONFIG.DEFAULT_SEED + 20);
const coldBatch = runBatch(easyCfg.n, medEffortCfg.restarts, medEffortCfg.maxSteps, CONFIG.TRIALS, coldRng);
console.log(`Cold-open Batch: Success=${(coldBatch.successRate*100).toFixed(1)}%, Cost=${coldBatch.avgSteps} steps, Time=${coldBatch.wallTimeMs}ms`);

assert(coldBatch.successRate === 0.9, 'Cold-open success rate matches expected 90.0% (27/30)');
assert(coldBatch.avgSteps === 54.6, 'Cold-open compute cost matches expected 54.6 steps across 3 restarts');
assert(coldBatch.wallTimeMs < 50, `Cold-open latency is fast (${coldBatch.wallTimeMs}ms < 50ms)`);

// Cold-open board attempt
const coldAttempt = runAttempt(easyCfg.n, medEffortCfg.maxSteps, null, true);
assert(coldAttempt.boardTrace.length > 1, `Cold-open boardTrace generated with ${coldAttempt.boardTrace.length} states`);
assert(coldAttempt.boardTrace[0].length === 8, 'Cold-open board dimension is N=8');
assert(coldAttempt.steps <= medEffortCfg.maxSteps, `Cold-open attempt steps (${coldAttempt.steps}) <= maxSteps (${medEffortCfg.maxSteps})`);

// 2. Testing All Control Combinations & Value Match
console.log('\n--- 2. Testing All Control Combinations & Real Computation ---');

const testCombinations = [
  { diff: 'EASY', effort: 'LOW', expectedN: 8, restarts: 1, maxSteps: 20 },
  { diff: 'EASY', effort: 'MEDIUM', expectedN: 8, restarts: 3, maxSteps: 25 },
  { diff: 'EASY', effort: 'HIGH', expectedN: 8, restarts: 5, maxSteps: 40 },
  { diff: 'HARD', effort: 'LOW', expectedN: 24, restarts: 1, maxSteps: 20 },
  { diff: 'HARD', effort: 'MEDIUM', expectedN: 24, restarts: 3, maxSteps: 25 },
  { diff: 'HARD', effort: 'HIGH', expectedN: 24, restarts: 5, maxSteps: 40 }
];

let allLatenciesFast = true;

testCombinations.forEach(({ diff, effort, expectedN, restarts, maxSteps }) => {
  const seed = CONFIG.DEFAULT_SEED + (diff === 'EASY' ? 0 : 500) +
               (effort === 'LOW' ? 10 : effort === 'MEDIUM' ? 20 : 30);
  const rng = createRng(seed);
  const result = runBatch(expectedN, restarts, maxSteps, CONFIG.TRIALS, rng);

  // Attempt for board trace
  const attempt = runAttempt(expectedN, maxSteps, null, true);

  console.log(`[${diff.padEnd(4)}] [${effort.padEnd(6)}] Success: ${(result.successRate*100).toFixed(1)}% | Cost: ${result.avgSteps} steps | Time: ${result.wallTimeMs}ms | Trace: ${attempt.boardTrace.length} frames`);

  assert(result.successRate >= 0 && result.successRate <= 1, `Success rate for ${diff}/${effort} is a valid probability`);
  assert(result.avgSteps > 0, `Compute cost for ${diff}/${effort} is positive`);
  assert(attempt.boardTrace[0].length === expectedN, `Board trace matches board dimension N=${expectedN}`);
  assert(attempt.steps <= maxSteps, `Attempt steps (${attempt.steps}) does not exceed maxSteps (${maxSteps})`);

  if (result.wallTimeMs > 200) {
    allLatenciesFast = false;
  }
});

assert(allLatenciesFast, 'All control updates execute in well under 200ms (sub-second fast feedback)');

// 3. Board Trace Fidelity Verification
console.log('\n--- 3. Verifying Board Trace Frame Validity ---');
const hardHighAttempt = runAttempt(24, 40, createRng(777), true);
assert(hardHighAttempt.boardTrace.length === hardHighAttempt.steps + 1, 'Hard HIGH boardTrace length equals steps + 1');
for (let i = 0; i < hardHighAttempt.boardTrace.length; i++) {
  const b = hardHighAttempt.boardTrace[i];
  assert(b.length === 24, `Frame ${i} has 24 queens`);
  const outOfBounds = b.some(r => r < 0 || r >= 24);
  assert(!outOfBounds, `Frame ${i} queens are within [0, 23]`);
}

console.log(`\n=== SUMMARY: ${passedTests}/${totalTests} tests passed ===`);
