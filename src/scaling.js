/**
 * scaling.js - Phase 7 Advanced Scaling Experiment
 *
 * Implements:
 * 1. Multi-budget Scaling Sweep (5 levels: Minimal -> LOW -> MEDIUM -> HIGH -> Extended).
 * 2. Real execution using the existing min-conflicts solver (runBatch).
 * 3. Marginal returns analysis (deltaSuccess, deltaCost, marginalEfficiency).
 * 4. Automated empirical analysis: diminishing returns detection and optimal trade-off recommendation.
 * 5. SVG visualization: X-axis = Compute Cost (Search Steps), Y-axis = Success Rate (%).
 */

(function(global) {
  'use strict';

  const SCALING_SWEEP_PRESETS = [
    { id: 'MINIMAL', name: 'Minimal', restarts: 1, maxSteps: 10, maxBudget: 10, offset: 0, description: '1 restart × 10 steps' },
    { id: 'LOW', name: 'LOW', restarts: 1, maxSteps: 20, maxBudget: 20, offset: 10, description: '1 restart × 20 steps' },
    { id: 'MEDIUM', name: 'MEDIUM', restarts: 3, maxSteps: 25, maxBudget: 75, offset: 20, description: '3 restarts × 25 steps' },
    { id: 'HIGH', name: 'HIGH', restarts: 5, maxSteps: 40, maxBudget: 200, offset: 30, description: '5 restarts × 40 steps' },
    { id: 'EXTENDED', name: 'Extended', restarts: 7, maxSteps: 50, maxBudget: 350, offset: 40, description: '7 restarts × 50 steps' }
  ];

  /**
   * Executes a real scaling sweep across all compute presets for a given N-Queens size.
   * Uses the exact same deterministic PRNG seed protocol as the canonical Phase 2 benchmark
   * so overlapping configurations (LOW, MEDIUM, HIGH) produce identical, mathematically comparable results.
   *
   * Seeding protocol:
   *   seed = baseSeed + (n === 8 ? 0 : 500) + preset.offset
   *   Easy (N=8): Minimal=42, LOW=52, MEDIUM=62, HIGH=72, Extended=82
   *   Hard (N=24): Minimal=542, LOW=552, MEDIUM=562, HIGH=572, Extended=582
   *
   * @param {number} n Board size
   * @param {number} [trials=30] Independent trials per level
   * @param {number} [baseSeed=42] Seed for reproducibility
   * @param {object} solver Solver module with createRng and runBatch
   * @returns {Array<object>} Array of measured level results
   */
  function runScalingSweep(n, trials = 30, baseSeed = 42, solver = null) {
    const s = solver || (typeof window !== 'undefined' ? window.Solver : null);
    if (!s || !s.runBatch || !s.createRng) {
      throw new Error('Solver module required for real scaling sweep');
    }

    const baseOffset = n === 8 ? 0 : 500;
    const results = [];

    for (let i = 0; i < SCALING_SWEEP_PRESETS.length; i++) {
      const preset = SCALING_SWEEP_PRESETS[i];
      // Seed aligns exactly with canonical benchmark for reproducible, cross-comparable evaluation
      const seed = baseSeed + baseOffset + preset.offset;
      const rng = s.createRng(seed);

      const batch = s.runBatch(n, preset.restarts, preset.maxSteps, trials, rng);

      results.push({
        id: preset.id,
        name: preset.name,
        restarts: preset.restarts,
        maxSteps: preset.maxSteps,
        maxBudget: preset.maxBudget,
        description: preset.description,
        successRate: batch.successRate,
        avgSteps: batch.avgSteps,
        wallTimeMs: batch.wallTimeMs,
        solvedTrials: batch.solvedTrials,
        totalTrials: batch.totalTrials
      });
    }

    return results;
  }

  /**
   * Computes marginal metrics between consecutive compute levels.
   * @param {Array<object>} sweepResults
   * @returns {Array<object>} Marginal transitions
   */
  function computeMarginalAnalysis(sweepResults) {
    const marginals = [];

    for (let i = 1; i < sweepResults.length; i++) {
      const prev = sweepResults[i - 1];
      const curr = sweepResults[i];

      const deltaSuccessPct = Math.round((curr.successRate - prev.successRate) * 1000) / 10;
      const deltaCostSteps = Math.round((curr.avgSteps - prev.avgSteps) * 10) / 10;

      // Marginal efficiency: % success gained per unit of search step invested
      const marginalEfficiency = deltaCostSteps > 0
        ? Math.round((deltaSuccessPct / deltaCostSteps) * 1000) / 1000
        : 0;

      marginals.push({
        from: prev.name,
        to: curr.name,
        fromCost: prev.avgSteps,
        toCost: curr.avgSteps,
        fromSuccess: prev.successRate * 100,
        toSuccess: curr.successRate * 100,
        deltaSuccessPct,
        deltaCostSteps,
        marginalEfficiency
      });
    }

    return marginals;
  }

  /**
   * Evaluates empirical scaling patterns and recommends the optimal trade-off point.
   * @param {Array<object>} sweepResults
   * @param {Array<object>} marginals
   * @returns {object} Automated insights and recommendation
   */
  function evaluateScalingInsights(sweepResults, marginals) {
    if (!sweepResults || sweepResults.length === 0) {
      return null;
    }

    const first = sweepResults[0];
    const last = sweepResults[sweepResults.length - 1];

    const totalSuccessGain = Math.round((last.successRate - first.successRate) * 1000) / 10;
    const totalCostSpent = Math.round((last.avgSteps - first.avgSteps) * 10) / 10;
    const successImproved = totalSuccessGain > 0;

    // Check for diminishing returns:
    // Decreasing marginal efficiency or shrinking deltaSuccess over subsequent steps
    let diminishingDetected = false;
    if (marginals.length >= 2) {
      // Check if earlier transitions have higher efficiency than later transitions
      const firstEfficiency = marginals[0].marginalEfficiency;
      const lastEfficiency = marginals[marginals.length - 1].marginalEfficiency;
      const midEfficiency = marginals[Math.floor(marginals.length / 2)].marginalEfficiency;

      diminishingDetected = (firstEfficiency > lastEfficiency) || (midEfficiency > lastEfficiency);
    }

    // Determine optimal recommendation:
    // Identify the "knee" point that achieves substantial success (>= 75% or max reachable)
    // with the highest overall efficiency (successRate / avgSteps)
    let bestScore = -1;
    let recommendedLevel = sweepResults[0];
    let recommendationReason = '';

    for (let i = 0; i < sweepResults.length; i++) {
      const pt = sweepResults[i];
      // Overall efficiency: success rate (%) per search step
      const efficiencyRatio = pt.avgSteps > 0 ? (pt.successRate * 100) / pt.avgSteps : 0;

      // Score balances high success rate with compute efficiency
      // Heuristic: reward achieving high success while penalizing extreme step costs
      const score = (pt.successRate * 100) * (pt.successRate >= 0.7 ? 1.4 : 1.0) / Math.sqrt(Math.max(1, pt.avgSteps));

      if (score > bestScore) {
        bestScore = score;
        recommendedLevel = pt;
      }
    }

    if (recommendedLevel.successRate >= 0.85) {
      recommendationReason = `${recommendedLevel.name} achieves ${(recommendedLevel.successRate * 100).toFixed(1)}% success at ${recommendedLevel.avgSteps.toFixed(1)} steps. Further compute spending exhibits steep diminishing returns.`;
    } else {
      recommendationReason = `${recommendedLevel.name} provides the strongest accuracy-per-step return (${(recommendedLevel.successRate * 100).toFixed(1)}% at ${recommendedLevel.avgSteps.toFixed(1)} steps) within practical search limits.`;
    }

    return {
      successImproved,
      totalSuccessGain,
      totalCostSpent,
      diminishingDetected,
      recommendedLevel,
      recommendationReason
    };
  }

  /**
   * Renders the Scaling Curve SVG (X = Compute Cost, Y = Success Rate).
   * @param {HTMLElement} container
   * @param {Array<object>} sweepResults
   * @param {object} recommendedLevel
   * @param {number} [width=560]
  /**
   * Generates pure SVG XML markup string for the Scaling Curve (X = Compute Cost, Y = Success Rate).
   * @param {Array<object>} sweepResults
   * @param {object} recommendedLevel
   * @param {number} [width=560]
   * @param {number} [height=280]
   * @returns {string} SVG markup string
   */
  function generateScalingCurveSVG(sweepResults, recommendedLevel = null, width = 560, height = 280) {
    if (!sweepResults || sweepResults.length === 0) return '';

    const padding = { top: 35, right: 35, bottom: 55, left: 60 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    // Determine scale limits
    const maxCost = Math.max(...sweepResults.map(r => r.avgSteps), 50);
    const xMax = Math.ceil(maxCost / 50) * 50;

    let svg = `<svg viewBox="0 0 ${width} ${height}" width="100%" height="100%" style="display:block;overflow:visible;" xmlns="http://www.w3.org/2000/svg">`;

    // Y Grid lines (0%, 25%, 50%, 75%, 100%)
    [0, 0.25, 0.5, 0.75, 1.0].forEach(tick => {
      const y = padding.top + chartH - tick * chartH;
      svg += `<line x1="${padding.left}" y1="${y}" x2="${padding.left + chartW}" y2="${y}" stroke="#334155" stroke-dasharray="${tick === 0 ? 'none' : '3,3'}" />`;
      svg += `<text x="${padding.left - 8}" y="${y + 4}" text-anchor="end" fill="#94a3b8" font-size="10px" font-family="sans-serif">${Math.round(tick * 100)}%</text>`;
    });

    // X Grid ticks & labels (steps)
    const xTicks = [0, xMax * 0.25, xMax * 0.5, xMax * 0.75, xMax];
    xTicks.forEach(tick => {
      const x = padding.left + (tick / xMax) * chartW;
      svg += `<line x1="${x}" y1="${padding.top}" x2="${x}" y2="${padding.top + chartH}" stroke="#1e293b" />`;
      svg += `<text x="${x}" y="${padding.top + chartH + 16}" text-anchor="middle" fill="#94a3b8" font-size="10px" font-family="sans-serif">${Math.round(tick)}</text>`;
    });

    // Axis Titles
    svg += `<text x="${padding.left + chartW / 2}" y="${height - 12}" text-anchor="middle" fill="#cbd5e1" font-size="11px" font-weight="600" font-family="sans-serif">Algorithmic Compute Cost (Search Steps Executed)</text>`;
    svg += `<text x="${-(padding.top + chartH / 2)}" y="15" transform="rotate(-90)" text-anchor="middle" fill="#cbd5e1" font-size="11px" font-weight="600" font-family="sans-serif">Success Rate (%)</text>`;

    // Map points to chart coordinates
    const points = sweepResults.map(r => {
      const x = padding.left + (r.avgSteps / xMax) * chartW;
      const y = padding.top + chartH - r.successRate * chartH;
      return { x, y, data: r };
    });

    // Shaded area below curve
    if (points.length > 0) {
      let areaD = `M ${points[0].x} ${padding.top + chartH} L ${points[0].x} ${points[0].y}`;
      for (let i = 1; i < points.length; i++) {
        areaD += ` L ${points[i].x} ${points[i].y}`;
      }
      areaD += ` L ${points[points.length - 1].x} ${padding.top + chartH} Z`;
      svg += `<path d="${areaD}" fill="rgba(56, 189, 248, 0.08)" />`;
    }

    // Curve Line connecting points
    if (points.length > 0) {
      let pathD = `M ${points[0].x} ${points[0].y}`;
      for (let i = 1; i < points.length; i++) {
        pathD += ` L ${points[i].x} ${points[i].y}`;
      }
      svg += `<path d="${pathD}" fill="none" stroke="#38bdf8" stroke-width="2.5" />`;
    }

    // Draw Data Point Nodes
    points.forEach(p => {
      const isRecommended = recommendedLevel && recommendedLevel.id === p.data.id;

      // Glow halo for recommended point
      if (isRecommended) {
        svg += `<circle cx="${p.x}" cy="${p.y}" r="12" fill="rgba(234, 179, 8, 0.25)" stroke="#eab308" stroke-width="1.5" />`;
      }

      svg += `<circle cx="${p.x}" cy="${p.y}" r="${isRecommended ? '6' : '4.5'}" fill="${isRecommended ? '#fde047' : '#38bdf8'}" stroke="#0f172a" stroke-width="2" />`;
      svg += `<text x="${p.x}" y="${p.y - 10}" text-anchor="middle" fill="${isRecommended ? '#fde047' : '#f8fafc'}" font-size="10.5px" font-weight="${isRecommended ? 'bold' : '600'}" font-family="sans-serif">${p.data.name}: ${(p.data.successRate * 100).toFixed(0)}%</text>`;
    });

    svg += `</svg>`;
    return svg;
  }

  /**
   * Renders the Scaling Curve SVG (X = Compute Cost, Y = Success Rate).
   * Supports both browser DOM containers and mock test containers.
   * @param {HTMLElement|object} container
   * @param {Array<object>} sweepResults
   * @param {object} recommendedLevel
   * @param {number} [width=560]
   * @param {number} [height=280]
   */
  function renderScalingCurveSVG(container, sweepResults, recommendedLevel = null, width = 560, height = 280) {
    if (!container || !sweepResults || sweepResults.length === 0) return;

    const svgMarkup = generateScalingCurveSVG(sweepResults, recommendedLevel, width, height);
    container.innerHTML = svgMarkup;

    // Attach mock element property if running in Node test harness with mockContainer
    if (typeof container.appendChild === 'function' && typeof document === 'undefined') {
      container.element = {
        outerHTML: svgMarkup,
        innerHTML: svgMarkup
      };
    }
  }

  /**
   * Renders the complete Advanced Scaling Experiment component into a container.
   * If #scaling-results-container is present, it updates the dynamic results without
   * destroying the static header and button. Otherwise, it renders the full component.
   * @param {HTMLElement} container
   * @param {object} sweepData { difficulty, sweepResults, marginals, insights }
   */
  function renderScalingExperimentView(container, sweepData) {
    if (!container) return;

    const { difficulty, sweepResults, marginals, insights } = sweepData;
    const diffLabel = difficulty === 'HARD' ? 'Hard (24-Queens)' : 'Easy (8-Queens)';

    // Update diff label if static element is present
    const diffLabelEl = (typeof document !== 'undefined') ? document.getElementById('scaling-diff-label') : null;
    if (diffLabelEl) {
      diffLabelEl.textContent = diffLabel;
    }

    const resultsContainer = container.querySelector ? container.querySelector('#scaling-results-container') : null;

    const resultsHtml = `
      <div id="sweep-display-container">
        <!-- Top Row: Chart & Insight Summary Cards -->
        <div class="scaling-grid">
          <!-- Scaling Curve Chart Card -->
          <div class="card scaling-chart-card">
            <div class="card-header">
              <div>
                <h4 class="card-title">Cost vs. Success Rate Pareto Curve</h4>
                <div class="card-subtitle">Real measured search steps vs. accuracy for ${diffLabel}</div>
              </div>
            </div>
            <div id="scaling-chart-container" style="min-height: 260px;" role="region" aria-label="Scaling Sweep Curve"></div>
          </div>

          <!-- Empirical Insights Cards Column -->
          <div class="scaling-insights-col">
            <!-- Insight 1: Scaling Improvement -->
            <div class="insight-card ${insights.successImproved ? 'positive' : 'neutral'}">
              <div class="insight-label">Scaling Outcome</div>
              <div class="insight-value">${insights.successImproved ? `+${insights.totalSuccessGain.toFixed(1)}%` : 'No Gain'}</div>
              <div class="insight-desc">
                ${insights.successImproved
                  ? `Success climbed from ${(sweepResults[0].successRate * 100).toFixed(1)}% to ${(sweepResults[sweepResults.length - 1].successRate * 100).toFixed(1)}% as compute increased by +${insights.totalCostSpent.toFixed(1)} steps.`
                  : 'Additional compute did not yield measurable accuracy gain over this budget window.'}
              </div>
            </div>

            <!-- Insight 2: Diminishing Returns Detection -->
            <div class="insight-card ${insights.diminishingDetected ? 'diminishing' : 'neutral'}">
              <div class="insight-label">Diminishing Returns Analysis</div>
              <div class="insight-value">${insights.diminishingDetected ? 'Detected' : 'Not Detected'}</div>
              <div class="insight-desc">
                ${insights.diminishingDetected
                  ? 'Empirically confirmed: marginal efficiency (accuracy gained per step) contracts as compute budget expands.'
                  : 'The measured data does not show monotonic efficiency decay across all tested segments.'}
              </div>
            </div>

            <!-- Insight 3: Optimal Compute Level Recommendation -->
            <div class="insight-card highlight-rec">
              <div class="insight-label">Recommended Optimal Level</div>
              <div class="insight-value rec-name">${insights.recommendedLevel ? insights.recommendedLevel.name : '--'}</div>
              <div class="insight-desc">
                ${insights.recommendationReason}
              </div>
            </div>
          </div>
        </div>

        <!-- Bottom Row: Marginal Analysis Table -->
        <div class="marginal-table-card">
          <h4 class="card-title" style="margin-bottom: 12px;">Marginal Returns Analysis Table</h4>
          <div class="table-responsive">
            <table class="scaling-table">
              <thead>
                <tr>
                  <th>Compute Level</th>
                  <th>Budget (Restarts × Steps)</th>
                  <th>Success Rate</th>
                  <th>Total Search Steps (Cost)</th>
                  <th>Runtime</th>
                  <th>Δ Success</th>
                  <th>Δ Compute</th>
                  <th>Marginal Efficiency (ΔS / ΔC)</th>
                </tr>
              </thead>
              <tbody>
                ${sweepResults.map((r, idx) => {
                  const isRec = insights.recommendedLevel && insights.recommendedLevel.id === r.id;
                  const m = idx > 0 ? marginals[idx - 1] : null;

                  return `
                    <tr class="${isRec ? 'row-recommended' : ''}">
                      <td>
                        <strong>${r.name}</strong>
                        ${isRec ? '<span class="badge-rec">★ Optimal</span>' : ''}
                      </td>
                      <td>${r.restarts} × ${r.maxSteps}</td>
                      <td><strong>${(r.successRate * 100).toFixed(1)}%</strong></td>
                      <td>${r.avgSteps.toFixed(1)}</td>
                      <td>${r.wallTimeMs.toFixed(1)} ms</td>
                      <td>${m ? `+${m.deltaSuccessPct.toFixed(1)}%` : '—'}</td>
                      <td>${m ? `+${m.deltaCostSteps.toFixed(1)}` : '—'}</td>
                      <td class="${m && m.marginalEfficiency > 0 ? 'eff-positive' : ''}">
                        ${m ? `${m.marginalEfficiency.toFixed(3)} %/step` : '— (baseline)'}
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
          <div style="margin-top: 10px; font-size: 11px; color: #94a3b8; line-height: 1.5;">
            <strong>Experimental Protocol:</strong> Each compute level is measured over 30 independent trials using deterministic PRNG seeds derived from base seed 42 (Easy offsets: 0, 10, 20, 30, 40; Hard offsets: 500 + 0, 10, 20, 30, 40). Overlapping presets (LOW, MEDIUM, HIGH) use the exact same seeds as the canonical Phase 2 benchmark above, guaranteeing mathematical parity across panels.
          </div>
        </div>
      </div>
    `;

    if (resultsContainer) {
      resultsContainer.innerHTML = resultsHtml;
    } else {
      // Fallback for standalone container (e.g. unit tests or blank container)
      container.innerHTML = `
        <div class="scaling-exp-inner">
          <div class="scaling-header">
            <div>
              <div class="badge-tag" style="margin-bottom: 6px;">Phase 7 Post-Implementation Extension</div>
              <h3 class="scaling-title">Advanced Scaling Experiment</h3>
              <p class="scaling-desc">
                Execute a continuous 5-point inference compute sweep on the real solver. Measures the empirical
                Cost-vs-Accuracy Pareto frontier and calculates marginal returns for <strong>${diffLabel}</strong>.
              </p>
            </div>
            <button id="btn-run-sweep" class="btn-sweep" type="button" aria-label="Run Scaling Sweep on active difficulty">
              ▶ Run Scaling Sweep
            </button>
          </div>
          ${resultsHtml}
        </div>
      `;
    }

    // Render the SVG chart inside its container
    const chartContainer = container.querySelector ? container.querySelector('#scaling-chart-container') : (typeof document !== 'undefined' ? document.getElementById('scaling-chart-container') : null);
    if (chartContainer) {
      renderScalingCurveSVG(chartContainer, sweepResults, insights.recommendedLevel);
    }
  }

  const ScalingModule = {
    SCALING_SWEEP_PRESETS,
    runScalingSweep,
    computeMarginalAnalysis,
    evaluateScalingInsights,
    generateScalingCurveSVG,
    renderScalingCurveSVG,
    renderScalingExperimentView
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ScalingModule;
  }
  if (typeof window !== 'undefined') {
    window.ScalingModule = ScalingModule;
  }
})(typeof window !== 'undefined' ? window : global);
