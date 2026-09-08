/**
 * solver.js - Min-Conflicts Local Search for N-Queens
 *
 * Implements:
 * 1. Seedable PRNG (mulberry32)
 * 2. Board representation: array of length N, board[col] = row
 * 3. Exact conflict counting: conflicts(board)
 * 4. runAttempt(n, maxSteps, rng, recordTrace): single min-conflicts attempt
 * 5. runBatch(n, restarts, maxSteps, trials, rng): batch evaluation with wall-clock timing
 */

/**
 * Creates a deterministic 32-bit PRNG (mulberry32) if a seed is provided,
 * or wraps Math.random if seed is null/undefined.
 * @param {number|null|undefined} seed
 * @returns {() => number} Returns float in [0, 1)
 */
function createRng(seed) {
  if (seed === undefined || seed === null) {
    return function() {
      return Math.random();
    };
  }
  let s = (seed >>> 0) || 1;
  return function() {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Counts the total number of conflicting pairs of queens on the board.
 * Attacking lines: same row or same diagonal.
 * Board representation: board[col] = row for 0 <= col < n.
 *
 * @param {number[]} board
 * @returns {number} Total attacking pairs
 */
function conflicts(board) {
  const n = board.length;
  let count = 0;
  for (let i = 0; i < n; i++) {
    const r1 = board[i];
    for (let j = i + 1; j < n; j++) {
      const r2 = board[j];
      if (r1 === r2 || Math.abs(r1 - r2) === (j - i)) {
        count++;
      }
    }
  }
  return count;
}

/**
 * Runs a single attempt of min-conflicts local search.
 *
 * Algorithm (Minton et al., 1992):
 * 1. Initialize random board (one queen per column).
 * 2. If conflicts == 0, return solved.
 * 3. Repeat up to maxSteps:
 *    a. Find the queen(s) with the maximum number of conflicts.
 *    b. Pick one of the most-conflicted queens uniformly at random (via rng).
 *    c. For that queen's column, evaluate conflicts across all rows.
 *    d. Move the queen to a row that minimizes conflicts (ties broken randomly via rng).
 *    e. Record intermediate board state in boardTrace.
 *    f. If conflicts == 0, return solved.
 *
 * @param {number} n Board size (N x N, N queens)
 * @param {number} maxSteps Maximum refinement steps allowed
 * @param {() => number} [rng] Optional PRNG function returning [0, 1)
 * @param {boolean} [recordTrace=true] Whether to record intermediate board states
 * @returns {{ solved: boolean, steps: number, boardTrace: number[][] }}
 */
function runAttempt(n, maxSteps, rng, recordTrace = true) {
  if (!rng) rng = createRng();

  // 1. Random initial board: board[col] = row
  const board = new Array(n);
  for (let c = 0; c < n; c++) {
    board[c] = Math.floor(rng() * n);
  }

  // Frequency tracking arrays for O(1) conflict evaluation:
  // rowCount[r]: queens on row r
  // diag1Count[r - c + n - 1]: queens on main diagonal (row - col)
  // diag2Count[r + c]: queens on anti-diagonal (row + col)
  const rowCount = new Int32Array(n);
  const diag1Count = new Int32Array(2 * n - 1);
  const diag2Count = new Int32Array(2 * n - 1);

  for (let c = 0; c < n; c++) {
    const r = board[c];
    rowCount[r]++;
    diag1Count[r - c + n - 1]++;
    diag2Count[r + c]++;
  }

  // Helper to compute conflicts for a queen at (col, row)
  function getConflictsAt(col, row) {
    const isCurrent = (board[col] === row) ? 1 : 0;
    const sameRow = rowCount[row] - isCurrent;
    const sameDiag1 = diag1Count[row - col + n - 1] - isCurrent;
    const sameDiag2 = diag2Count[row + col] - isCurrent;
    return sameRow + sameDiag1 + sameDiag2;
  }

  const boardTrace = recordTrace ? [board.slice()] : [];

  // Check initial state
  let totalConflicts = conflicts(board);
  if (totalConflicts === 0) {
    return { solved: true, steps: 0, boardTrace };
  }

  for (let step = 1; step <= maxSteps; step++) {
    // a. Compute conflicts for each queen and find max conflict count
    let maxConf = -1;
    const queenConfs = new Int32Array(n);
    for (let c = 0; c < n; c++) {
      const conf = getConflictsAt(c, board[c]);
      queenConfs[c] = conf;
      if (conf > maxConf) {
        maxConf = conf;
      }
    }

    // If maxConf is 0, all queens have 0 conflicts -> solved!
    if (maxConf === 0) {
      return { solved: true, steps: step - 1, boardTrace };
    }

    // b. Collect candidate columns with max conflicts and pick one uniformly at random
    let candidateColsCount = 0;
    for (let c = 0; c < n; c++) {
      if (queenConfs[c] === maxConf) {
        candidateColsCount++;
      }
    }
    const candidateCols = new Int32Array(candidateColsCount);
    let idx = 0;
    for (let c = 0; c < n; c++) {
      if (queenConfs[c] === maxConf) {
        candidateCols[idx++] = c;
      }
    }
    const chosenCol = candidateCols[Math.floor(rng() * candidateColsCount)];
    const currentRow = board[chosenCol];

    // c. For chosenCol, evaluate conflicts across all rows
    let minRowConf = Infinity;
    const rowConfs = new Int32Array(n);
    for (let r = 0; r < n; r++) {
      const conf = getConflictsAt(chosenCol, r);
      rowConfs[r] = conf;
      if (conf < minRowConf) {
        minRowConf = conf;
      }
    }

    // d. Collect candidate rows with min conflicts and pick one uniformly at random
    let candidateRowsCount = 0;
    for (let r = 0; r < n; r++) {
      if (rowConfs[r] === minRowConf) {
        candidateRowsCount++;
      }
    }
    const candidateRows = new Int32Array(candidateRowsCount);
    let rIdx = 0;
    for (let r = 0; r < n; r++) {
      if (rowConfs[r] === minRowConf) {
        candidateRows[rIdx++] = r;
      }
    }
    const chosenRow = candidateRows[Math.floor(rng() * candidateRowsCount)];

    // Move the queen to chosenRow (even if chosenRow == currentRow, in case of ties)
    if (chosenRow !== currentRow) {
      rowCount[currentRow]--;
      diag1Count[currentRow - chosenCol + n - 1]--;
      diag2Count[currentRow + chosenCol]--;

      board[chosenCol] = chosenRow;

      rowCount[chosenRow]++;
      diag1Count[chosenRow - chosenCol + n - 1]++;
      diag2Count[chosenRow + chosenCol]++;
    }

    if (recordTrace) {
      boardTrace.push(board.slice());
    }

    // Check if solved
    totalConflicts = conflicts(board);
    if (totalConflicts === 0) {
      return { solved: true, steps: step, boardTrace };
    }
  }

  return { solved: false, steps: maxSteps, boardTrace };
}

/**
 * Runs a batch of independent trials.
 * Each trial is given a compute budget of up to `restarts` independent attempts,
 * with up to `maxSteps` per attempt.
 *
 * @param {number} n Board size
 * @param {number} restarts Number of independent restart attempts per trial
 * @param {number} maxSteps Maximum refinement steps per restart attempt
 * @param {number} trials Number of independent trials to run
 * @param {() => number} [rng] Seedable PRNG function
 * @returns {{ successRate: number, avgSteps: number, wallTimeMs: number, solvedTrials: number, totalTrials: number }}
 */
function runBatch(n, restarts, maxSteps, trials, rng) {
  if (!rng) rng = createRng();

  const getNow = () => {
    if (typeof performance !== 'undefined' && performance.now) {
      return performance.now();
    }
    return Date.now();
  };

  const startTime = getNow();
  let solvedTrials = 0;
  let totalSteps = 0;

  for (let t = 0; t < trials; t++) {
    let trialSolved = false;
    let trialSteps = 0;

    for (let r = 0; r < restarts; r++) {
      const attempt = runAttempt(n, maxSteps, rng, false);
      trialSteps += attempt.steps;
      if (attempt.solved) {
        trialSolved = true;
        break;
      }
    }

    if (trialSolved) {
      solvedTrials++;
    }
    totalSteps += trialSteps;
  }

  const endTime = getNow();
  const wallTimeMs = Math.round((endTime - startTime) * 100) / 100;
  const successRate = trials > 0 ? Math.round((solvedTrials / trials) * 1000) / 1000 : 0;
  const avgSteps = trials > 0 ? Math.round((totalSteps / trials) * 10) / 10 : 0;

  return {
    successRate,
    avgSteps,
    wallTimeMs,
    solvedTrials,
    totalTrials: trials
  };
}

// Module export for Node.js test environment and browser window global
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    createRng,
    conflicts,
    runAttempt,
    runBatch
  };
}
if (typeof window !== 'undefined') {
  window.Solver = {
    createRng,
    conflicts,
    runAttempt,
    runBatch
  };
}
