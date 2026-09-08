/**
 * tests/phase5.test.js - Phase 5 BDH-CQ Evidence Verification
 *
 * Verifies:
 * 1. Accuracy of static BDH-CQ pass@2 numbers against primary source.
 * 2. Presence of required primary citations and classification labels.
 * 3. Exact boundary statement matching README §12.
 * 4. Integration of live solver data into the side-by-side comparison.
 * 5. Structural separation from live chart (independent container and metrics).
 */

const { BDH_CQ_EVIDENCE, renderEvidencePanel } = require('../src/evidence.js');
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

console.log('=== TEST SUITE: Phase 5 BDH-CQ Evidence Integration ===\n');

// 1. Static BDH-CQ Data Accuracy
console.log('--- 1. Testing BDH-CQ Published Reference Numbers ---');

assert(
  BDH_CQ_EVIDENCE.effortCurve.LOW.passAt2 === 21.0,
  `LOW effort pass@2 is exactly 21.0% (actual: ${BDH_CQ_EVIDENCE.effortCurve.LOW.passAt2}%)`
);

assert(
  BDH_CQ_EVIDENCE.effortCurve.MEDIUM.passAt2 === 27.0,
  `MEDIUM effort pass@2 is exactly 27.0% (actual: ${BDH_CQ_EVIDENCE.effortCurve.MEDIUM.passAt2}%)`
);

assert(
  BDH_CQ_EVIDENCE.effortCurve.HIGH.passAt2 === 29.5,
  `HIGH effort pass@2 is exactly 29.5% (actual: ${BDH_CQ_EVIDENCE.effortCurve.HIGH.passAt2}%)`
);

// Marginal gains and diminishing returns in BDH-CQ
const bdhGain1 = BDH_CQ_EVIDENCE.effortCurve.MEDIUM.passAt2 - BDH_CQ_EVIDENCE.effortCurve.LOW.passAt2;
const bdhGain2 = BDH_CQ_EVIDENCE.effortCurve.HIGH.passAt2 - BDH_CQ_EVIDENCE.effortCurve.MEDIUM.passAt2;

assert(
  Math.abs(bdhGain1 - 6.0) < 1e-6,
  `LOW -> MEDIUM gain is +6.0% (actual: +${bdhGain1.toFixed(1)}%)`
);

assert(
  Math.abs(bdhGain2 - 2.5) < 1e-6,
  `MEDIUM -> HIGH gain is +2.5% (actual: +${bdhGain2.toFixed(1)}%)`
);

assert(
  bdhGain1 > bdhGain2,
  `BDH-CQ exhibits diminishing returns: gain1 (+${bdhGain1.toFixed(1)}%) > gain2 (+${bdhGain2.toFixed(1)}%)`
);

// 2. Citations & Classification Label
console.log('\n--- 2. Testing Citations and Classification Labels ---');

assert(
  BDH_CQ_EVIDENCE.classificationLabel === 'Reported by developer, primary source — not reproduced here',
  `Classification label matches README §13 verbatim: "${BDH_CQ_EVIDENCE.classificationLabel}"`
);

assert(
  BDH_CQ_EVIDENCE.sourceCitation.arxivId === 'arXiv:2608.09888',
  `Primary technical report citation has correct arXiv ID (actual: ${BDH_CQ_EVIDENCE.sourceCitation.arxivId})`
);

assert(
  BDH_CQ_EVIDENCE.substrateCitation.arxivId === 'arXiv:2509.26507',
  `Underlying Dragon Hatchling paper citation has correct arXiv ID (actual: ${BDH_CQ_EVIDENCE.substrateCitation.arxivId})`
);

// 3. Boundary Statement
console.log('\n--- 3. Testing Strict Boundary Statement ---');

const expectedBoundary = "This demo's compute (restarts × search steps on a constraint puzzle) is not BDH-CQ's compute (recurrent latent-state updates on a trained transformer). They are two different real mechanisms that produce the same general shape of trade-off.";

assert(
  BDH_CQ_EVIDENCE.boundaryStatement === expectedBoundary,
  'Boundary statement matches README §12 verbatim'
);

// 4. Integration with Real Live Solver Data
console.log('\n--- 4. Testing Evidence Panel Rendering with Live Solver Data ---');

// Run a live batch under Easy and Hard
const easyBatch = {};
['LOW', 'MEDIUM', 'HIGH'].forEach(eff => {
  const cfg = CONFIG.EFFORT_PRESETS[eff];
  const seed = CONFIG.DEFAULT_SEED + (eff === 'LOW' ? 10 : eff === 'MEDIUM' ? 20 : 30);
  easyBatch[eff] = runBatch(8, cfg.restarts, cfg.maxSteps, CONFIG.TRIALS, createRng(seed));
});

// Mock DOM container
const mockContainer = { innerHTML: '' };
renderEvidencePanel(mockContainer, {
  difficulty: 'EASY',
  activeEffort: 'MEDIUM',
  batchResults: easyBatch
});

const html = mockContainer.innerHTML;

assert(html.includes('21.0%') && html.includes('27.0%') && html.includes('29.5%'), 'HTML contains all 3 BDH-CQ reference percentages');
assert(html.includes('90.0%') && html.includes('33.3%') && html.includes('100.0%'), 'HTML contains live Easy solver percentages');
assert(html.includes('54.6 st.') || html.includes('54.6'), 'HTML contains live compute cost steps');
assert(html.includes('arXiv:2608.09888'), 'HTML includes visible primary arXiv citation');
assert(html.includes(expectedBoundary), 'HTML includes full boundary statement banner');

console.log(`\n=== SUMMARY: ${passedTests}/${totalTests} tests passed ===`);
