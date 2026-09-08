/**
 * app.js - Main Application Orchestrator (Phase 4)
 *
 * Connects:
 * - Calibrated presets from config.js
 * - Real N-Queens solver from solver.js
 * - SVG chart visualization from chart.js
 * - Live board animation from board.js
 *
 * Implements the cold-open state (MEDIUM effort, Easy difficulty)
 * and guarantees that every displayed metric comes from genuine computation.
 */

(function() {
  'use strict';

  // Extract dependencies
  const { createRng, runBatch, runAttempt, conflicts } = window.Solver;
  const CONFIG = window.CONFIG;
  const { createBoardRenderer, BoardAnimator } = window.BoardModule;
  const { createChartRenderer } = window.ChartModule;
  const { renderEvidencePanel } = window.EvidenceModule || {};

  // DOM Elements
  const chartContainer = document.getElementById('chart-container');
  const boardContainer = document.getElementById('board-container');
  const evidenceContainer = document.getElementById('evidence-container');

  const effortButtons = {
    LOW: document.getElementById('effort-low'),
    MEDIUM: document.getElementById('effort-med'),
    HIGH: document.getElementById('effort-high')
  };

  const diffButtons = {
    EASY: document.getElementById('diff-easy'),
    HARD: document.getElementById('diff-hard')
  };

  const metricSuccess = document.getElementById('metric-success');
  const metricCost = document.getElementById('metric-cost');
  const metricRuntime = document.getElementById('metric-runtime');
  const metricBudget = document.getElementById('metric-budget');

  const btnWatchSolve = document.getElementById('btn-watch-solve');
  const btnPlayPause = document.getElementById('btn-play-pause');
  const btnPrevStep = document.getElementById('btn-prev-step');
  const btnNextStep = document.getElementById('btn-next-step');
  const boardStatus = document.getElementById('board-status');
  const difficultyBadge = document.getElementById('difficulty-badge');

  // Application State
  let currentEffort = 'MEDIUM';
  let currentDifficulty = 'EASY';

  // Instantiate Renderers
  const boardRenderer = createBoardRenderer(boardContainer, 360);
  const boardAnimator = new BoardAnimator(boardRenderer);
  const chartRenderer = createChartRenderer(chartContainer, 500, 260);

  /**
   * Updates the UI active state of buttons.
   */
  function updateControlButtonsUI() {
    Object.keys(effortButtons).forEach(key => {
      if (effortButtons[key]) {
        effortButtons[key].classList.toggle('active', key === currentEffort);
      }
    });

    Object.keys(diffButtons).forEach(key => {
      if (diffButtons[key]) {
        diffButtons[key].classList.toggle('active', key === currentDifficulty);
      }
    });

    if (difficultyBadge) {
      const diffCfg = CONFIG.DIFFICULTY_PRESETS[currentDifficulty];
      difficultyBadge.textContent = `${diffCfg.name} (N=${diffCfg.n})`;
    }
  }

  /**
   * Runs live computation for all 3 effort levels under the active difficulty,
   * updates the comparative chart and the primary metric cards.
   */
  function runLiveExperiment() {
    const diffCfg = CONFIG.DIFFICULTY_PRESETS[currentDifficulty];
    const n = diffCfg.n;

    const batchResults = {};

    // Run all 3 effort levels to populate the comparative chart
    ['LOW', 'MEDIUM', 'HIGH'].forEach(effortKey => {
      const effortCfg = CONFIG.EFFORT_PRESETS[effortKey];
      // Deterministic seed for reproducible batch measurements
      const seed = CONFIG.DEFAULT_SEED + (currentDifficulty === 'EASY' ? 0 : 500) +
                   (effortKey === 'LOW' ? 10 : effortKey === 'MEDIUM' ? 20 : 30);
      const rng = createRng(seed);

      const result = runBatch(n, effortCfg.restarts, effortCfg.maxSteps, CONFIG.TRIALS, rng);
      batchResults[effortKey] = result;
    });

    // Update comparative chart
    chartRenderer.render(batchResults, currentEffort, diffCfg.name);

    // Update active metric cards
    const activeResult = batchResults[currentEffort];
    const activeEffortCfg = CONFIG.EFFORT_PRESETS[currentEffort];

    if (metricSuccess) {
      metricSuccess.textContent = `${(activeResult.successRate * 100).toFixed(1)}%`;
      const detail = document.getElementById('metric-success-detail');
      if (detail) detail.textContent = `${activeResult.solvedTrials} of ${activeResult.totalTrials} solved`;
    }

    if (metricCost) {
      metricCost.textContent = `${activeResult.avgSteps.toFixed(1)}`;
      const detail = document.getElementById('metric-cost-detail');
      if (detail) detail.textContent = `total steps across ${activeEffortCfg.restarts} restart${activeEffortCfg.restarts > 1 ? 's' : ''}`;
    }

    if (metricRuntime) {
      metricRuntime.textContent = `${activeResult.wallTimeMs.toFixed(1)} ms`;
      const detail = document.getElementById('metric-runtime-detail');
      if (detail) detail.textContent = `measured browser wall-clock`;
    }

    if (metricBudget) {
      metricBudget.textContent = `${activeEffortCfg.restarts} restart${activeEffortCfg.restarts > 1 ? 's' : ''} × ${activeEffortCfg.maxSteps} steps`;
      const detail = document.getElementById('metric-budget-detail');
      if (detail) detail.textContent = `max budget: ${activeEffortCfg.restarts * activeEffortCfg.maxSteps} search steps`;
    }

    // Update Evidence Panel with live context
    if (renderEvidencePanel && evidenceContainer) {
      renderEvidencePanel(evidenceContainer, {
        difficulty: currentDifficulty,
        activeEffort: currentEffort,
        batchResults
      });
    }
  }

  /**
   * Updates the board animation status text.
   */
  function updateBoardStatus(stepIndex, board, move) {
    if (!board) return;
    const currentConflicts = conflicts(board);
    const totalSteps = boardAnimator.boardTrace.length - 1;
    const isComplete = stepIndex >= totalSteps;
    const isSolved = currentConflicts === 0;

    let badge = '<span class="badge running">Searching</span>';
    if (isComplete) {
      badge = isSolved ? '<span class="badge solved">✓ Solved (0 Conflicts)</span>'
                       : '<span class="badge unsolved">✗ Budget Exhausted</span>';
    }

    let moveInfo = 'Initial Random Placement';
    if (move) {
      moveInfo = `Queen Col ${move.col}: Row ${move.fromRow} ➔ ${move.toRow}`;
    }

    if (boardStatus) {
      boardStatus.innerHTML = `
        <div class="status-headline">Step <strong>${stepIndex}</strong> of <strong>${totalSteps}</strong> | Conflicts: <strong>${currentConflicts}</strong> ${badge}</div>
        <div class="status-subline">${moveInfo}</div>
      `;
    }
  }

  /**
   * Generates a fresh genuine solver attempt for the active configuration
   * and replays its authentic boardTrace.
   */
  function launchBoardAnimation() {
    boardAnimator.stop();
    if (btnPlayPause) btnPlayPause.textContent = 'Pause';

    const diffCfg = CONFIG.DIFFICULTY_PRESETS[currentDifficulty];
    const effortCfg = CONFIG.EFFORT_PRESETS[currentEffort];

    // Genuine solver run producing authentic boardTrace
    const attempt = runAttempt(diffCfg.n, effortCfg.maxSteps, null, true);

    const stepDelay = diffCfg.n === 8 ? 140 : 80;

    boardAnimator.loadTrace(attempt.boardTrace, {
      stepDelayMs: stepDelay,
      onStep: (step, board, move) => {
        updateBoardStatus(step, board, move);
      },
      onComplete: (finalBoard) => {
        if (btnPlayPause) btnPlayPause.textContent = 'Replay';
      }
    });

    boardAnimator.play();
  }

  /**
   * Handles user changing effort level.
   */
  function setEffort(effortKey) {
    if (currentEffort === effortKey) return;
    currentEffort = effortKey;
    updateControlButtonsUI();
    runLiveExperiment();
    launchBoardAnimation();
  }

  /**
   * Handles user changing difficulty setting.
   */
  function setDifficulty(diffKey) {
    if (currentDifficulty === diffKey) return;
    currentDifficulty = diffKey;
    updateControlButtonsUI();
    runLiveExperiment();
    launchBoardAnimation();
  }

  // Bind Event Listeners
  Object.keys(effortButtons).forEach(key => {
    if (effortButtons[key]) {
      effortButtons[key].addEventListener('click', () => setEffort(key));
    }
  });

  Object.keys(diffButtons).forEach(key => {
    if (diffButtons[key]) {
      diffButtons[key].addEventListener('click', () => setDifficulty(key));
    }
  });

  if (btnWatchSolve) {
    btnWatchSolve.addEventListener('click', () => {
      launchBoardAnimation();
    });
  }

  if (btnPlayPause) {
    btnPlayPause.addEventListener('click', () => {
      if (boardAnimator.isPlaying) {
        boardAnimator.pause();
        btnPlayPause.textContent = 'Play';
      } else {
        if (boardAnimator.currentIndex >= boardAnimator.boardTrace.length - 1) {
          boardAnimator.jumpToStep(0);
        }
        boardAnimator.play();
        btnPlayPause.textContent = 'Pause';
      }
    });
  }

  if (btnPrevStep) {
    btnPrevStep.addEventListener('click', () => {
      boardAnimator.stepBackward();
      if (btnPlayPause) btnPlayPause.textContent = 'Play';
    });
  }

  if (btnNextStep) {
    btnNextStep.addEventListener('click', () => {
      boardAnimator.stepForward();
      if (btnPlayPause) btnPlayPause.textContent = boardAnimator.isPlaying ? 'Pause' : 'Play';
    });
  }

  // --- Cold Open (Step 0) ---
  // Default to MEDIUM effort, Easy difficulty
  updateControlButtonsUI();
  runLiveExperiment();
  launchBoardAnimation();

})();
