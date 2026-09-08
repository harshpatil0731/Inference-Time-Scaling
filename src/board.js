/**
 * board.js - Real Solver Trace Playback and Chessboard Visualization
 *
 * Implements:
 * 1. SVG-based N-Queens board renderer (scalable to any N).
 * 2. BoardAnimator: plays back real boardTrace sequences from solver.js.
 * 3. Highlights the actively moved queen and tracks conflicts per step.
 * 4. Step-accurate state inspection: guarantees intermediate frames match
 *    the exact mathematical states in boardTrace without interpolation.
 */

(function(global) {
  'use strict';

  /**
   * Creates an SVG chessboard renderer inside a given DOM container.
   * @param {HTMLElement} container DOM element to render within
   * @param {number} [size=400] Pixel width/height of the board
   */
  function createBoardRenderer(container, size = 400) {
    let currentN = 8;

    // Create SVG element
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.style.display = 'block';
    svg.style.maxWidth = `${size}px`;
    svg.style.maxHeight = `${size}px`;
    svg.style.borderRadius = '8px';
    svg.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';

    // Group for grid squares
    const gridGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    gridGroup.setAttribute('id', 'board-grid');
    svg.appendChild(gridGroup);

    // Group for highlights
    const highlightGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    highlightGroup.setAttribute('id', 'board-highlights');
    svg.appendChild(highlightGroup);

    // Group for queens
    const queensGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    queensGroup.setAttribute('id', 'board-queens');
    svg.appendChild(queensGroup);

    container.innerHTML = '';
    container.appendChild(svg);

    /**
     * Renders a static board state.
     * @param {number[]} board Array of row indices per column
     * @param {object} [highlight] Optional { col, fromRow, toRow }
     */
    function render(board, highlight = null) {
      if (!board || board.length === 0) return;
      const n = board.length;
      const cellSize = size / n;

      // Re-draw grid if N changed or grid is empty
      if (currentN !== n || gridGroup.children.length === 0) {
        currentN = n;
        gridGroup.innerHTML = '';

        for (let col = 0; col < n; col++) {
          for (let row = 0; row < n; row++) {
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('x', col * cellSize);
            rect.setAttribute('y', row * cellSize);
            rect.setAttribute('width', cellSize);
            rect.setAttribute('height', cellSize);
            const isLight = (col + row) % 2 === 0;
            rect.setAttribute('fill', isLight ? '#eae6df' : '#7b8794');
            gridGroup.appendChild(rect);
          }
        }
      }

      // Draw move highlight
      highlightGroup.innerHTML = '';
      if (highlight && highlight.col !== undefined) {
        const hCol = highlight.col;
        const hRow = highlight.toRow !== undefined ? highlight.toRow : board[hCol];

        // Highlight the destination cell of the move
        const destRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        destRect.setAttribute('x', hCol * cellSize);
        destRect.setAttribute('y', hRow * cellSize);
        destRect.setAttribute('width', cellSize);
        destRect.setAttribute('height', cellSize);
        destRect.setAttribute('fill', 'rgba(255, 215, 0, 0.45)');
        destRect.setAttribute('stroke', '#ffd700');
        destRect.setAttribute('stroke-width', Math.max(2, cellSize * 0.08));
        highlightGroup.appendChild(destRect);

        // If fromRow is provided and different, draw origin indicator
        if (highlight.fromRow !== undefined && highlight.fromRow !== hRow) {
          const origRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          origRect.setAttribute('x', hCol * cellSize);
          origRect.setAttribute('y', highlight.fromRow * cellSize);
          origRect.setAttribute('width', cellSize);
          origRect.setAttribute('height', cellSize);
          origRect.setAttribute('fill', 'rgba(239, 68, 68, 0.25)');
          origRect.setAttribute('stroke', 'rgba(239, 68, 68, 0.6)');
          origRect.setAttribute('stroke-width', Math.max(1.5, cellSize * 0.05));
          origRect.setAttribute('stroke-dasharray', '3,3');
          highlightGroup.appendChild(origRect);
        }
      }

      // Draw queens
      queensGroup.innerHTML = '';
      const fontSize = cellSize * 0.72;

      for (let col = 0; col < n; col++) {
        const row = board[col];
        const cx = col * cellSize + cellSize / 2;
        const cy = row * cellSize + cellSize / 2 + fontSize * 0.33;

        const isMovedQueen = highlight && highlight.col === col;

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', cx);
        text.setAttribute('y', cy);
        text.setAttribute('font-size', fontSize);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-family', 'sans-serif');
        text.setAttribute('fill', isMovedQueen ? '#1e1b4b' : '#111827');
        text.setAttribute('style', 'user-select: none; pointer-events: none; font-weight: bold;');
        text.textContent = '♛';

        queensGroup.appendChild(text);
      }
    }

    return {
      render,
      getN: () => currentN
    };
  }

  /**
   * Animator that steps through a real boardTrace from solver.runAttempt.
   */
  class BoardAnimator {
    /**
     * @param {object} renderer Board renderer returned by createBoardRenderer
     */
    constructor(renderer) {
      this.renderer = renderer;
      this.boardTrace = [];
      this.currentIndex = 0;
      this.stepDelayMs = 120;
      this.timerId = null;
      this.isPlaying = false;
      this.onStepCallback = null;
      this.onCompleteCallback = null;
    }

    /**
     * Loads a real solver trace and prepares playback.
     * @param {number[][]} boardTrace Array of intermediate board states
     * @param {object} [options] { stepDelayMs, onStep, onComplete }
     */
    loadTrace(boardTrace, options = {}) {
      this.stop();
      this.boardTrace = boardTrace || [];
      this.currentIndex = 0;
      this.stepDelayMs = options.stepDelayMs || this.stepDelayMs;
      this.onStepCallback = options.onStep || null;
      this.onCompleteCallback = options.onComplete || null;

      if (this.boardTrace.length > 0) {
        this.renderer.render(this.boardTrace[0], null);
        if (this.onStepCallback) {
          this.onStepCallback(0, this.boardTrace[0], null);
        }
      }
    }

    /**
     * Finds which column moved between boardA and boardB.
     */
    _getMoveDetails(prevBoard, currBoard) {
      if (!prevBoard || !currBoard || prevBoard.length !== currBoard.length) {
        return null;
      }
      for (let col = 0; col < prevBoard.length; col++) {
        if (prevBoard[col] !== currBoard[col]) {
          return {
            col,
            fromRow: prevBoard[col],
            toRow: currBoard[col]
          };
        }
      }
      return null;
    }

    /**
     * Advances by one step in the trace.
     * @returns {boolean} True if more steps remain
     */
    stepForward() {
      if (this.currentIndex >= this.boardTrace.length - 1) {
        this.stop();
        if (this.onCompleteCallback) {
          const finalBoard = this.boardTrace[this.boardTrace.length - 1];
          this.onCompleteCallback(finalBoard);
        }
        return false;
      }

      const prevBoard = this.boardTrace[this.currentIndex];
      this.currentIndex++;
      const currBoard = this.boardTrace[this.currentIndex];
      const move = this._getMoveDetails(prevBoard, currBoard);

      this.renderer.render(currBoard, move);

      if (this.onStepCallback) {
        this.onStepCallback(this.currentIndex, currBoard, move);
      }

      if (this.currentIndex >= this.boardTrace.length - 1) {
        this.stop();
        if (this.onCompleteCallback) {
          this.onCompleteCallback(currBoard);
        }
        return false;
      }

      return true;
    }

    /**
     * Steps backward by one step in the trace.
     */
    stepBackward() {
      if (this.currentIndex <= 0) return;
      this.pause();
      this.currentIndex--;
      const currBoard = this.boardTrace[this.currentIndex];
      const prevBoard = this.currentIndex > 0 ? this.boardTrace[this.currentIndex - 1] : null;
      const move = this._getMoveDetails(prevBoard, currBoard);

      this.renderer.render(currBoard, move);
      if (this.onStepCallback) {
        this.onStepCallback(this.currentIndex, currBoard, move);
      }
    }

    /**
     * Jumps directly to an exact step in the trace.
     * @param {number} index Step index
     */
    jumpToStep(index) {
      if (index < 0 || index >= this.boardTrace.length) return;
      this.pause();
      this.currentIndex = index;
      const currBoard = this.boardTrace[this.currentIndex];
      const prevBoard = this.currentIndex > 0 ? this.boardTrace[this.currentIndex - 1] : null;
      const move = this._getMoveDetails(prevBoard, currBoard);

      this.renderer.render(currBoard, move);
      if (this.onStepCallback) {
        this.onStepCallback(this.currentIndex, currBoard, move);
      }
    }

    /**
     * Starts or resumes playback.
     */
    play() {
      if (this.isPlaying) return;
      if (this.currentIndex >= this.boardTrace.length - 1) {
        // Rewind to start if already at the end
        this.jumpToStep(0);
      }

      this.isPlaying = true;
      const scheduleNext = () => {
        if (!this.isPlaying) return;
        const hasMore = this.stepForward();
        if (hasMore && this.isPlaying) {
          this.timerId = setTimeout(scheduleNext, this.stepDelayMs);
        }
      };

      this.timerId = setTimeout(scheduleNext, this.stepDelayMs);
    }

    /**
     * Pauses playback at the current exact intermediate frame.
     */
    pause() {
      this.isPlaying = false;
      if (this.timerId) {
        clearTimeout(this.timerId);
        this.timerId = null;
      }
    }

    /**
     * Stops and resets timer.
     */
    stop() {
      this.pause();
    }

    /**
     * Sets playback speed in milliseconds per step.
     */
    setSpeed(delayMs) {
      this.stepDelayMs = Math.max(20, delayMs);
    }

    /**
     * Returns current state for verification and testing.
     */
    getCurrentState() {
      return {
        currentIndex: this.currentIndex,
        totalSteps: Math.max(0, this.boardTrace.length - 1),
        currentBoard: this.boardTrace[this.currentIndex] ? this.boardTrace[this.currentIndex].slice() : null,
        isPlaying: this.isPlaying
      };
    }
  }

  // Export
  const BoardModule = {
    createBoardRenderer,
    BoardAnimator
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = BoardModule;
  }
  if (typeof window !== 'undefined') {
    window.BoardModule = BoardModule;
  }
})(typeof window !== 'undefined' ? window : global);
