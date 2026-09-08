/**
 * tests/phase6.test.js - Phase 6 Polish, Accessibility & Submission Verification
 *
 * Verifies:
 * 1. HTML structure contains accessible ARIA attributes and labels.
 * 2. Exactly two educational recap prompts are present with correct conceptual answers.
 * 3. Transparent limitations section is present in index.html.
 * 4. sources/SOURCES.md and LICENSE files are present and properly formatted.
 * 5. README reflects calibrated presets and difficulty instances.
 * 6. Central claim verification across all 6 combinations.
 */

const fs = require('fs');
const path = require('path');
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

console.log('=== TEST SUITE: Phase 6 Polish, Accessibility & QA ===\n');

// 1. Accessibility & ARIA Attributes in index.html
console.log('--- 1. Testing Accessibility & ARIA in index.html ---');
const htmlContent = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

assert(htmlContent.includes('aria-label="Inference Effort Level"'), 'Effort control has aria-label');
assert(htmlContent.includes('aria-label="Task Difficulty"'), 'Difficulty control has aria-label');
assert(htmlContent.includes('aria-pressed="true"') && htmlContent.includes('aria-pressed="false"'), 'Segmented controls use aria-pressed');
assert(htmlContent.includes('aria-live="polite"'), 'Board status readout uses aria-live="polite"');
assert(htmlContent.includes('role="region"'), 'Major UI panels specify ARIA roles');

// 2. Recap Prompts Verification
console.log('\n--- 2. Testing Educational Recap Prompts ---');
assert(htmlContent.includes('recap-section'), 'Recap section is present in HTML');
assert(
  htmlContent.includes('After increasing inference effort, what changed: success rate, compute cost, or both?'),
  'Prompt 1 text matches required question verbatim'
);
assert(
  htmlContent.includes('How is BDH-CQ\'s effort mechanism different from this live N-Queens demo?'),
  'Prompt 2 text matches required question verbatim'
);
assert(
  htmlContent.includes('discrete search computation') && htmlContent.includes('recurrent latent-state computation'),
  'Prompt 2 explanation correctly contrasts discrete search vs recurrent latent state'
);

// 3. Methodological Disclosures & Limitations Notice
console.log('\n--- 3. Testing Limitations Notice ---');
assert(htmlContent.includes('limitations-box'), 'Limitations box is present in HTML');
assert(htmlContent.includes('Fixed Effort Presets'), 'States LOW, MEDIUM, HIGH are fixed presets');
assert(htmlContent.includes('30 independent trials'), 'States live experiment uses 30 trials');
assert(htmlContent.includes('Algorithmic Analogy, Not Reproduction'), 'States N-Queens is an algorithmic analogy, not BDH-CQ reproduction');

// 4. Sources and License Files Verification
console.log('\n--- 4. Testing SOURCES.md and LICENSE Integrity ---');
const sourcesPath = path.join(__dirname, '../sources/SOURCES.md');
assert(fs.existsSync(sourcesPath), 'sources/SOURCES.md exists');
const sourcesContent = fs.readFileSync(sourcesPath, 'utf8');
assert(sourcesContent.includes('arXiv:2608.09888'), 'SOURCES.md includes primary BDH-CQ arXiv ID');
assert(sourcesContent.includes('arXiv:2509.26507'), 'SOURCES.md includes Dragon Hatchling arXiv ID');
assert(sourcesContent.includes('arXiv:2408.03314'), 'SOURCES.md includes Snell et al. (2024)');
assert(sourcesContent.includes('arXiv:2501.19393'), 'SOURCES.md includes Muennighoff et al. (2025)');
assert(sourcesContent.includes('arXiv:2503.24235'), 'SOURCES.md includes Zhang et al. (2025)');
assert(sourcesContent.includes('Minton, S.'), 'SOURCES.md includes Minton et al. (1992)');
assert(sourcesContent.includes('AI Assistance Disclosure'), 'SOURCES.md includes AI Assistance Disclosure section');

const licensePath = path.join(__dirname, '../LICENSE');
assert(fs.existsSync(licensePath), 'LICENSE file exists');
const licenseContent = fs.readFileSync(licensePath, 'utf8');
assert(licenseContent.includes('MIT License'), 'LICENSE is valid MIT License');

// 5. README Alignment
console.log('\n--- 5. Testing README Presets and Instances Alignment ---');
const readmeContent = fs.readFileSync(path.join(__dirname, '../README.md'), 'utf8');
assert(readmeContent.includes('LOW | 1 | 20'), 'README contains calibrated LOW preset (1x20)');
assert(readmeContent.includes('MEDIUM | 3 | 25'), 'README contains calibrated MEDIUM preset (3x25)');
assert(readmeContent.includes('HIGH | 5 | 40'), 'README contains calibrated HIGH preset (5x40)');
assert(readmeContent.includes('Easy ($N=8$ Queens)'), 'README contains Easy N=8 instance');
assert(readmeContent.includes('Hard ($N=24$ Queens)'), 'README contains Hard N=24 instance');

// 6. Central Claim End-to-End Test
console.log('\n--- 6. End-to-End Central Claim Re-Verification ---');
const eLow = runBatch(8, 1, 20, 30, createRng(CONFIG.DEFAULT_SEED + 10));
const eMed = runBatch(8, 3, 25, 30, createRng(CONFIG.DEFAULT_SEED + 20));
const eHigh = runBatch(8, 5, 40, 30, createRng(CONFIG.DEFAULT_SEED + 30));

const hLow = runBatch(24, 1, 20, 30, createRng(CONFIG.DEFAULT_SEED + 510));
const hMed = runBatch(24, 3, 25, 30, createRng(CONFIG.DEFAULT_SEED + 520));
const hHigh = runBatch(24, 5, 40, 30, createRng(CONFIG.DEFAULT_SEED + 530));

const gain1 = eMed.successRate - eLow.successRate;
const gain2 = eHigh.successRate - eMed.successRate;

assert(gain1 > gain2, `Easy demonstrates diminishing returns: +${(gain1*100).toFixed(1)}% > +${(gain2*100).toFixed(1)}%`);
assert(hHigh.successRate < 1.0, `Hard HIGH does not reach 100% (actual: ${(hHigh.successRate*100).toFixed(1)}%)`);
assert(eLow.avgSteps < eMed.avgSteps && eMed.avgSteps < eHigh.avgSteps, 'Easy compute cost increases with effort');
assert(hLow.avgSteps < hMed.avgSteps && hMed.avgSteps < hHigh.avgSteps, 'Hard compute cost increases with effort');

console.log(`\n=== SUMMARY: ${passedTests}/${totalTests} tests passed ===`);
