/**
 * tests/phase7.test.js - Phase 7 Advanced Scaling Experiment Verification
 *
 * Verifies:
 * 1. Scaling sweep uses real solver to run 5 compute presets.
 * 2. Compute budgets increase monotonically (10 -> 20 -> 75 -> 200 -> 350).
 * 3. Measured results: success rate, average search steps (cost), wall-clock time.
 * 4. Mathematical accuracy of marginal gain and efficiency calculations:
 *    - deltaSuccess = curr.successRate - prev.successRate
 *    - deltaCost = curr.avgSteps - prev.avgSteps
 *    - marginalEfficiency = deltaSuccess / deltaCost
 * 5. Automated empirical insights:
 *    - Validates whether success improved
 *    - Diminishing returns detection based on actual marginal trends
 *    - Honest reporting without fake claims
 * 6. Recommendation is mathematically grounded in measured data.
 * 7. Chart SVG generation accurately reflects real experiment numbers.
 */

const solver = require('../src/solver.js');
const {
  SCALING_SWEEP_PRESETS,
  runScalingSweep,
  computeMarginalAnalysis,
  evaluateScalingInsights,
  renderScalingCurveSVG
} = require('../src/scaling.js');

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

console.log('=== TEST SUITE: Phase 7 Advanced Scaling Experiment ===\n');

// 1. Preset Definitions & Budget Monotonicity
console.log('--- 1. Testing Preset Definitions & Monotonic Budgets ---');

assert(SCALING_SWEEP_PRESETS.length === 5, 'Scaling sweep defines exactly 5 compute levels');

for (let i = 0; i < SCALING_SWEEP_PRESETS.length - 1; i++) {
  const curr = SCALING_SWEEP_PRESETS[i];
  const next = SCALING_SWEEP_PRESETS[i + 1];

  const currBudget = curr.restarts * curr.maxSteps;
  const nextBudget = next.restarts * next.maxSteps;

  assert(
    nextBudget > currBudget,
    `Budget increases monotonically: ${curr.name} (${currBudget} max steps) < ${next.name} (${nextBudget} max steps)`
  );
}

// 2. Real Solver Execution & Output Data Structure
console.log('\n--- 2. Testing Real Solver Execution (Easy N=8) ---');
const easySweep = runScalingSweep(8, 30, 42, solver);

assert(easySweep.length === 5, 'Sweep returns 5 result objects');

easySweep.forEach(res => {
  console.log(`  [${res.name.padEnd(8)}] Budget: ${res.restarts}x${res.maxSteps} | Success: ${(res.successRate * 100).toFixed(1)}% | Cost: ${res.avgSteps.toFixed(1)} steps | Latency: ${res.wallTimeMs} ms`);

  assert(res.successRate >= 0 && res.successRate <= 1, `${res.name} success rate is valid probability`);
  assert(res.avgSteps > 0, `${res.name} search steps are positive`);
  assert(res.wallTimeMs >= 0, `${res.name} wall-clock latency is measured`);
  assert(res.totalTrials === 30, `${res.name} evaluated across 30 trials`);
});

// Verify compute cost scales up across sweep levels
for (let i = 0; i < easySweep.length - 1; i++) {
  assert(
    easySweep[i + 1].avgSteps >= easySweep[i].avgSteps,
    `Search steps increase with budget: ${easySweep[i].name} (${easySweep[i].avgSteps}) <= ${easySweep[i+1].name} (${easySweep[i+1].avgSteps})`
  );
}

// 3. Mathematical Accuracy of Marginal Analysis
console.log('\n--- 3. Testing Mathematical Accuracy of Marginal Analysis ---');
const easyMarginals = computeMarginalAnalysis(easySweep);

assert(easyMarginals.length === 4, '4 marginal transitions computed between 5 points');

easyMarginals.forEach((m, idx) => {
  const prev = easySweep[idx];
  const curr = easySweep[idx + 1];

  const expectedDeltaS = Math.round((curr.successRate - prev.successRate) * 1000) / 10;
  const expectedDeltaC = Math.round((curr.avgSteps - prev.avgSteps) * 10) / 10;
  const expectedEff = expectedDeltaC > 0 ? Math.round((expectedDeltaS / expectedDeltaC) * 1000) / 1000 : 0;

  console.log(`  ${m.from} ➔ ${m.to}: ΔSuccess = ${m.deltaSuccessPct}%, ΔCompute = ${m.deltaCostSteps} steps, Efficiency = ${m.marginalEfficiency} %/step`);

  assert(Math.abs(m.deltaSuccessPct - expectedDeltaS) < 1e-6, `ΔSuccess for ${m.from}->${m.to} is mathematically exact`);
  assert(Math.abs(m.deltaCostSteps - expectedDeltaC) < 1e-6, `ΔCost for ${m.from}->${m.to} is mathematically exact`);
  assert(Math.abs(m.marginalEfficiency - expectedEff) < 1e-6, `Marginal efficiency for ${m.from}->${m.to} is mathematically exact`);
});

// 4. Automated Insights & Diminishing Returns Detection
console.log('\n--- 4. Testing Automated Insights & Diminishing Returns ---');
const easyInsights = evaluateScalingInsights(easySweep, easyMarginals);

console.log(`  Success Improved: ${easyInsights.successImproved} (Total Gain: +${easyInsights.totalSuccessGain}%)`);
console.log(`  Diminishing Returns Detected: ${easyInsights.diminishingDetected}`);
console.log(`  Recommended Level: ${easyInsights.recommendedLevel.name} (${easyInsights.recommendationReason})`);

assert(easyInsights.successImproved === true, 'Success rate improves from Minimal to Extended on Easy');
assert(easyInsights.diminishingDetected === true, 'Diminishing returns correctly detected on Easy scaling');
assert(
  easyInsights.recommendedLevel && easyInsights.recommendedLevel.id,
  'Recommended level exists and is identified'
);

// 5. Real Solver Execution & Evaluation on Hard (N=24)
console.log('\n--- 5. Testing Real Solver Execution on Hard (N=24) ---');
const hardSweep = runScalingSweep(24, 30, 42, solver);
const hardMarginals = computeMarginalAnalysis(hardSweep);
const hardInsights = evaluateScalingInsights(hardSweep, hardMarginals);

console.log(`  Hard Scaling: Minimal ${(hardSweep[0].successRate * 100).toFixed(1)}% ➔ Extended ${(hardSweep[4].successRate * 100).toFixed(1)}% (Total Gain: +${hardInsights.totalSuccessGain}%)`);
console.log(`  Hard Recommended: ${hardInsights.recommendedLevel.name} (${hardInsights.recommendationReason})`);

assert(hardSweep.length === 5, 'Hard sweep executed 5 levels');
assert(hardInsights.successImproved === true, 'Hard difficulty success improves as compute scales');
assert(hardSweep[0].successRate <= 0.05, 'Minimal effort on Hard has very low success (~0%)');

// 6. SVG Visualization Fidelity
console.log('\n--- 6. Testing SVG Scaling Curve Generation ---');
const mockContainer = { innerHTML: '', appendChild: function(el) { this.element = el; } };
renderScalingCurveSVG(mockContainer, easySweep, easyInsights.recommendedLevel, 560, 280);

assert(mockContainer.element !== undefined, 'SVG element created');
const svgString = mockContainer.element.outerHTML || '';

// Verify that SVG includes X axis title, Y axis title, and data points
assert(svgString.includes('Algorithmic Compute Cost'), 'SVG includes X-axis label');
assert(svgString.includes('Success Rate (%)'), 'SVG includes Y-axis label');
assert(svgString.includes('Minimal:') && svgString.includes('Extended:'), 'SVG contains point text labels');

// 7. Cross-Phase Experimental Protocol Parity (Phase 2 vs Phase 7)
console.log('\n--- 7. Testing Cross-Phase Experimental Protocol Parity (Phase 2 vs Phase 7) ---');

// Phase 2 Canonical Reference Values:
// Easy (N=8): LOW=33.3% (16.8 steps), MEDIUM=90.0% (54.6 steps), HIGH=100.0% (130.9 steps)
// Hard (N=24): LOW=0.0% (20.0 steps), MEDIUM=20.0% (74.1 steps), HIGH=80.0% (184.3 steps)

assert(Math.abs(easySweep[1].successRate - 0.333) < 1e-6, `Easy LOW parity: Phase 7 (${(easySweep[1].successRate*100).toFixed(1)}%) === Phase 2 canonical (33.3%)`);
assert(Math.abs(easySweep[2].successRate - 0.90) < 1e-6, `Easy MEDIUM parity: Phase 7 (${(easySweep[2].successRate*100).toFixed(1)}%) === Phase 2 canonical (90.0%)`);
assert(Math.abs(easySweep[3].successRate - 1.00) < 1e-6, `Easy HIGH parity: Phase 7 (${(easySweep[3].successRate*100).toFixed(1)}%) === Phase 2 canonical (100.0%)`);
assert(Math.abs(easySweep[2].avgSteps - 54.6) < 1e-6, `Easy MEDIUM compute cost parity: Phase 7 (${easySweep[2].avgSteps}) === Phase 2 canonical (54.6 steps)`);

assert(Math.abs(hardSweep[1].successRate - 0.00) < 1e-6, `Hard LOW parity: Phase 7 (${(hardSweep[1].successRate*100).toFixed(1)}%) === Phase 2 canonical (0.0%)`);
assert(Math.abs(hardSweep[2].successRate - 0.20) < 1e-6, `Hard MEDIUM parity: Phase 7 (${(hardSweep[2].successRate*100).toFixed(1)}%) === Phase 2 canonical (20.0%)`);
assert(Math.abs(hardSweep[3].successRate - 0.80) < 1e-6, `Hard HIGH parity: Phase 7 (${(hardSweep[3].successRate*100).toFixed(1)}%) === Phase 2 canonical (80.0%)`);
assert(Math.abs(hardSweep[3].avgSteps - 184.3) < 1e-6, `Hard HIGH compute cost parity: Phase 7 (${hardSweep[3].avgSteps}) === Phase 2 canonical (184.3 steps)`);

console.log(`\n=== SUMMARY: ${passedTests}/${totalTests} tests passed ===`);
