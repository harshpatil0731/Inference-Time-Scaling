/**
 * tests/solver.test.js - Phase 1 Verification Test Suite
 *
 * Tests:
 * 1. PRNG determinism and distribution.
 * 2. conflicts() correctness against known solutions and known collisions.
 * 3. runAttempt() behavior, step limit, solved state verification, and boardTrace capture.
 * 4. Determinism: identical seeds yield bit-identical boardTrace; different seeds diverge.
 * 5. runBatch() performance, success rate, step counting, and wallTimeMs measurement.
 * 6. Detailed walkthrough of a single min-conflicts step.
 */

const { createRng, conflicts, runAttempt, runBatch } = require('../src/solver.js');

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

console.log('=== TEST SUITE: N-Queens Min-Conflicts Solver (Phase 1) ===\n');

// 1. Conflict calculation on known boards
console.log('--- 1. Testing conflicts() on known boards ---');

// Known valid 8-Queens solution: [0, 4, 7, 5, 2, 6, 1, 3]
const valid8Queens = [0, 4, 7, 5, 2, 6, 1, 3];
assert(conflicts(valid8Queens) === 0, 'Known valid 8-Queens solution has 0 conflicts');

// Known valid 4-Queens solution: [1, 3, 0, 2]
const valid4Queens = [1, 3, 0, 2];
assert(conflicts(valid4Queens) === 0, 'Known valid 4-Queens solution [1, 3, 0, 2] has 0 conflicts');

// Known invalid board: all queens in row 0: [0, 0, 0, 0] -> 4*3/2 = 6 row conflicts
const allRowZero = [0, 0, 0, 0];
assert(conflicts(allRowZero) === 6, 'All queens in row 0 on N=4 has exactly 6 conflicts (pairs)');

// Known diagonal conflict: [0, 1, 2, 3] -> each pair on main diagonal -> 6 conflicts
const mainDiagonal = [0, 1, 2, 3];
assert(conflicts(mainDiagonal) === 6, 'All queens on main diagonal [0, 1, 2, 3] has 6 conflicts');

// Single pair conflict: [0, 2, 1, 3] with [1, 3, 0, 2] swapped
// [0, 2, 1, 3]:
// (0,0) and (1,2): diff row=2, diff col=1 (no)
// (0,0) and (2,1): diff row=1, diff col=2 (no)
// (0,0) and (3,3): diff row=3, diff col=3 (diagonal conflict! pair 0-3)
// (1,2) and (2,1): diff row=1, diff col=1 (diagonal conflict! pair 1-2)
// Total conflicts = 2
assert(conflicts([0, 2, 1, 3]) === 2, '[0, 2, 1, 3] has exactly 2 diagonal conflicts');

// 2. PRNG Seedability & Determinism
console.log('\n--- 2. Testing createRng() Seedability & Determinism ---');
const rngA1 = createRng(42);
const rngA2 = createRng(42);
const seq1 = [rngA1(), rngA1(), rngA1(), rngA1(), rngA1()];
const seq2 = [rngA2(), rngA2(), rngA2(), rngA2(), rngA2()];
assert(JSON.stringify(seq1) === JSON.stringify(seq2), 'Identical seeds produce identical float sequences');

const rngB = createRng(999);
const seqB = [rngB(), rngB(), rngB(), rngB(), rngB()];
assert(JSON.stringify(seq1) !== JSON.stringify(seqB), 'Different seeds produce divergent sequences');

// 3. runAttempt() and boardTrace determinism
console.log('\n--- 3. Testing runAttempt() and boardTrace Determinism ---');
const attemptSeed1 = runAttempt(8, 100, createRng(12345), true);
const attemptSeed2 = runAttempt(8, 100, createRng(12345), true);
assert(attemptSeed1.solved === attemptSeed2.solved, 'Same seed produces identical solved status');
assert(attemptSeed1.steps === attemptSeed2.steps, `Same seed produces identical step count (${attemptSeed1.steps})`);
assert(
  JSON.stringify(attemptSeed1.boardTrace) === JSON.stringify(attemptSeed2.boardTrace),
  'Same seed produces bit-identical boardTrace history'
);

const attemptSeedDiff = runAttempt(8, 100, createRng(54321), true);
assert(
  JSON.stringify(attemptSeed1.boardTrace) !== JSON.stringify(attemptSeedDiff.boardTrace),
  'Different seeds produce divergent boardTrace histories'
);

// Verify boardTrace structure and integrity
assert(attemptSeed1.boardTrace.length === attemptSeed1.steps + 1, 'boardTrace length equals steps + 1 (initial + each step)');
const finalBoard = attemptSeed1.boardTrace[attemptSeed1.boardTrace.length - 1];
if (attemptSeed1.solved) {
  assert(conflicts(finalBoard) === 0, 'Final board in solved attempt has 0 conflicts');
}

// 4. Verification that N=8 solves readily with generous budget
console.log('\n--- 4. Testing High Budget Solve Rate on N=8 ---');
const highBudgetBatch = runBatch(8, 20, 200, 30, createRng(100));
console.log(`High Budget (20 restarts x 200 steps, 30 trials): Success Rate = ${highBudgetBatch.successRate * 100}%, Avg Steps = ${highBudgetBatch.avgSteps}, Wall Time = ${highBudgetBatch.wallTimeMs}ms`);
assert(highBudgetBatch.successRate >= 0.95, `N=8 with generous budget solves in large majority of trials (actual: ${highBudgetBatch.successRate * 100}%)`);
assert(highBudgetBatch.wallTimeMs < 500, `High budget batch completes fast (actual: ${highBudgetBatch.wallTimeMs}ms)`);

// 5. Test runBatch on LOW budget
console.log('\n--- 5. Testing LOW Budget Batch on N=8 ---');
const lowBudgetBatch = runBatch(8, 1, 20, 30, createRng(200));
console.log(`LOW Budget (1 restart x 20 steps, 30 trials): Success Rate = ${lowBudgetBatch.successRate * 100}%, Avg Steps = ${lowBudgetBatch.avgSteps}, Wall Time = ${lowBudgetBatch.wallTimeMs}ms`);
assert(lowBudgetBatch.successRate > 0 && lowBudgetBatch.successRate < 1, `LOW budget produces non-zero but partial success rate (${lowBudgetBatch.successRate * 100}%)`);

// 6. Step-by-step Min-Conflicts Demonstration
console.log('\n--- 6. Detailed Walkthrough of One Min-Conflicts Step ---');

function demonstrateOneStep() {
  const n = 4;
  // Let's create an illustrative initial state:
  // Col 0: row 0, Col 1: row 0, Col 2: row 2, Col 3: row 1
  const board = [0, 0, 2, 1];
  console.log(`Initial Board: [${board.join(', ')}] (each index = column, value = row)`);
  console.log(`Initial Total Conflicts: ${conflicts(board)}`);

  // Count conflicts for each queen
  const queenConflicts = [];
  for (let c = 0; c < n; c++) {
    let conf = 0;
    const r1 = board[c];
    for (let j = 0; j < n; j++) {
      if (j === c) continue;
      const r2 = board[j];
      if (r1 === r2 || Math.abs(r1 - r2) === Math.abs(j - c)) {
        conf++;
      }
    }
    queenConflicts.push(conf);
    console.log(`  Queen at Col ${c} (Row ${r1}): conflicts with ${conf} other queens`);
  }

  const maxConf = Math.max(...queenConflicts);
  const mostConflicted = queenConflicts
    .map((conf, idx) => ({ idx, conf }))
    .filter(item => item.conf === maxConf)
    .map(item => item.idx);

  console.log(`Most conflicted queen(s): Column(s) [${mostConflicted.join(', ')}] with conflict count = ${maxConf}`);

  // Let's take the first most-conflicted queen for demonstration
  const chosenCol = mostConflicted[0];
  console.log(`Selected Queen to repair: Column ${chosenCol} (currently at Row ${board[chosenCol]})`);

  // Evaluate all rows for chosenCol
  console.log(`Evaluating conflicts for Column ${chosenCol} at each possible row:`);
  const rowEvaluations = [];
  for (let r = 0; r < n; r++) {
    let conf = 0;
    for (let j = 0; j < n; j++) {
      if (j === chosenCol) continue;
      const r2 = board[j];
      if (r === r2 || Math.abs(r - r2) === Math.abs(j - chosenCol)) {
        conf++;
      }
    }
    rowEvaluations.push(conf);
    console.log(`  Row ${r}: ${conf} conflict(s) with queens in other columns`);
  }

  const minRowConf = Math.min(...rowEvaluations);
  const bestRows = rowEvaluations
    .map((conf, idx) => ({ idx, conf }))
    .filter(item => item.conf === minRowConf)
    .map(item => item.idx);

  console.log(`Row(s) minimizing conflicts: Row(s) [${bestRows.join(', ')}] with conflict count = ${minRowConf}`);
  const chosenRow = bestRows[0];
  console.log(`Moving Queen at Col ${chosenCol} from Row ${board[chosenCol]} -> Row ${chosenRow}`);
  board[chosenCol] = chosenRow;

  console.log(`Updated Board: [${board.join(', ')}]`);
  console.log(`New Total Conflicts: ${conflicts(board)} (Reduced from original)`);
}

demonstrateOneStep();

console.log(`\n=== SUMMARY: ${passedTests}/${totalTests} tests passed ===`);
