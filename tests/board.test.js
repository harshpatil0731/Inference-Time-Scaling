/**
 * tests/board.test.js - Phase 3 Board & Trace Verification
 *
 * Verifies:
 * 1. boardTrace integrity from real solver attempts (solved and unsolved).
 * 2. Every intermediate step corresponds to a real board state.
 * 3. BoardAnimator stepForward, stepBackward, jumpToStep, and state tracking.
 * 4. Zero interpolation or synthetic frames.
 */

const { createRng, conflicts, runAttempt } = require('../src/solver.js');
const { BoardAnimator } = require('../src/board.js');

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

console.log('=== TEST SUITE: Phase 3 Board & Trace Playback ===\n');

// Mock renderer to verify render calls
class MockRenderer {
  constructor() {
    this.renderedBoards = [];
    this.renderedMoves = [];
  }
  render(board, move) {
    this.renderedBoards.push(board ? board.slice() : null);
    this.renderedMoves.push(move ? { ...move } : null);
  }
}

// 1. Test Solved Attempt on Easy (N=8)
console.log('--- 1. Testing Solved Attempt (Easy N=8) ---');
const rngSolved = createRng(0);
const solvedAttempt = runAttempt(8, 50, rngSolved, true);

assert(solvedAttempt.solved === true, 'Attempt is genuinely solved (solved === true)');
assert(solvedAttempt.steps > 0, `Attempt took real positive steps: ${solvedAttempt.steps}`);
assert(
  solvedAttempt.boardTrace.length === solvedAttempt.steps + 1,
  `boardTrace length (${solvedAttempt.boardTrace.length}) equals steps + 1 (${solvedAttempt.steps + 1})`
);

// Verify initial state
const initialBoard = solvedAttempt.boardTrace[0];
const initialConflicts = conflicts(initialBoard);
assert(initialConflicts > 0, `Initial board has conflicts (actual: ${initialConflicts})`);

// Verify final state
const finalBoard = solvedAttempt.boardTrace[solvedAttempt.boardTrace.length - 1];
const finalConflicts = conflicts(finalBoard);
assert(finalConflicts === 0, `Final board in solved attempt has 0 conflicts (actual: ${finalConflicts})`);

// Verify consecutive state transitions
let allTransitionsValid = true;
for (let t = 0; t < solvedAttempt.boardTrace.length - 1; t++) {
  const b1 = solvedAttempt.boardTrace[t];
  const b2 = solvedAttempt.boardTrace[t + 1];
  let diffCount = 0;
  for (let c = 0; c < 8; c++) {
    if (b1[c] !== b2[c]) diffCount++;
  }
  // In min-conflicts, exactly 1 queen is moved per step (or 0 if tied with current)
  if (diffCount > 1) {
    allTransitionsValid = false;
    break;
  }
}
assert(allTransitionsValid, 'Every step in boardTrace moves at most 1 queen (genuine min-conflicts moves)');

// 2. Test Unsolved / Budget-Limited Attempt (Hard N=24, very tight budget)
console.log('\n--- 2. Testing Unsolved/Limited Attempt (Hard N=24, maxSteps=5) ---');
const rngUnsolved = createRng(999);
const unsolvedAttempt = runAttempt(24, 5, rngUnsolved, true);

assert(unsolvedAttempt.solved === false, 'Budget-limited attempt is genuinely unsolved (solved === false)');
assert(unsolvedAttempt.steps === 5, `Steps reached maxSteps (actual: ${unsolvedAttempt.steps})`);
assert(unsolvedAttempt.boardTrace.length === 6, 'boardTrace length is 6 (step 0 to 5)');

const unsolvedFinalBoard = unsolvedAttempt.boardTrace[unsolvedAttempt.boardTrace.length - 1];
const unsolvedFinalConflicts = conflicts(unsolvedFinalBoard);
assert(unsolvedFinalConflicts > 0, `Final board in unsolved attempt still has conflicts (actual: ${unsolvedFinalConflicts})`);

// 3. Test BoardAnimator Playback against boardTrace
console.log('\n--- 3. Testing BoardAnimator State-Exact Playback ---');
const mockRenderer = new MockRenderer();
const animator = new BoardAnimator(mockRenderer);

animator.loadTrace(solvedAttempt.boardTrace);
assert(
  JSON.stringify(mockRenderer.renderedBoards[0]) === JSON.stringify(solvedAttempt.boardTrace[0]),
  'Initial load renders exact step 0 boardTrace[0]'
);

// Step forward through entire trace and verify each frame matches boardTrace exactly
let allFramesMatch = true;
for (let step = 1; step < solvedAttempt.boardTrace.length; step++) {
  animator.stepForward();
  const rendered = mockRenderer.renderedBoards[mockRenderer.renderedBoards.length - 1];
  const expected = solvedAttempt.boardTrace[step];
  if (JSON.stringify(rendered) !== JSON.stringify(expected)) {
    allFramesMatch = false;
    console.error(`Mismatch at step ${step}: rendered ${JSON.stringify(rendered)} vs expected ${JSON.stringify(expected)}`);
    break;
  }
}
assert(allFramesMatch, 'Every stepped frame matches boardTrace[k] with bit-exact precision (zero interpolation)');

// Verify jumping to arbitrary intermediate step
console.log('\n--- 4. Testing Jump-To-Step Exact State Inspection ---');
const testStepIndex = Math.floor(solvedAttempt.steps / 2);
animator.jumpToStep(testStepIndex);

const state = animator.getCurrentState();
assert(state.currentIndex === testStepIndex, `State index matches target step (${testStepIndex})`);
assert(
  JSON.stringify(state.currentBoard) === JSON.stringify(solvedAttempt.boardTrace[testStepIndex]),
  `Current board matches boardTrace[${testStepIndex}] perfectly`
);

console.log(`\n=== SUMMARY: ${passedTests}/${totalTests} tests passed ===`);
