/**
 * chart.js - SVG Chart Renderer for Inference-Time Scaling Comparison
 *
 * Renders a comparative bar chart across LOW, MEDIUM, and HIGH effort levels
 * for the currently active task difficulty.
 *
 * Features:
 * - 100% vanilla SVG, zero external dependencies.
 * - Displays real success rate (0-100%), compute cost (total search steps), and runtime (ms).
 * - Visualizes the diminishing returns curve with a trend curve.
 * - Highlights the currently selected effort level.
 */

(function(global) {
  'use strict';

  function createChartRenderer(container, width = 520, height = 300) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.style.display = 'block';
    svg.style.overflow = 'visible';

    container.innerHTML = '';
    container.appendChild(svg);

    /**
     * Renders or updates the chart.
     * @param {object} batchResults Map of { LOW: result, MEDIUM: result, HIGH: result }
     * @param {string} selectedEffort 'LOW' | 'MEDIUM' | 'HIGH'
     * @param {string} difficultyName 'Easy' | 'Hard'
     */
    function render(batchResults, selectedEffort = 'MEDIUM', difficultyName = 'Easy') {
      svg.innerHTML = '';

      const padding = { top: 40, right: 30, bottom: 65, left: 55 };
      const chartWidth = width - padding.left - padding.right;
      const chartHeight = height - padding.top - padding.bottom;

      // Background grid lines (0%, 25%, 50%, 75%, 100%)
      const yTicks = [0, 0.25, 0.5, 0.75, 1.0];
      for (const tick of yTicks) {
        const y = padding.top + chartHeight - tick * chartHeight;

        // Grid line
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', padding.left);
        line.setAttribute('y1', y);
        line.setAttribute('x2', padding.left + chartWidth);
        line.setAttribute('y2', y);
        line.setAttribute('stroke', '#334155');
        line.setAttribute('stroke-width', tick === 0 ? '1.5' : '1');
        line.setAttribute('stroke-dasharray', tick === 0 ? 'none' : '4,4');
        svg.appendChild(line);

        // Y-axis label
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', padding.left - 10);
        text.setAttribute('y', y + 4);
        text.setAttribute('text-anchor', 'end');
        text.setAttribute('fill', '#94a3b8');
        text.setAttribute('font-size', '11px');
        text.setAttribute('font-family', 'sans-serif');
        text.textContent = `${Math.round(tick * 100)}%`;
        svg.appendChild(text);
      }

      // Y-axis title
      const yTitle = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      yTitle.setAttribute('x', -(padding.top + chartHeight / 2));
      yTitle.setAttribute('y', 15);
      yTitle.setAttribute('transform', 'rotate(-90)');
      yTitle.setAttribute('text-anchor', 'middle');
      yTitle.setAttribute('fill', '#cbd5e1');
      yTitle.setAttribute('font-size', '11px');
      yTitle.setAttribute('font-family', 'sans-serif');
      yTitle.setAttribute('font-weight', '600');
      yTitle.textContent = 'Live Success Rate (%)';
      svg.appendChild(yTitle);

      const effortKeys = ['LOW', 'MEDIUM', 'HIGH'];
      const slotWidth = chartWidth / effortKeys.length;
      const barWidth = Math.min(64, slotWidth * 0.55);

      const points = [];

      effortKeys.forEach((key, index) => {
        const data = batchResults[key];
        if (!data) return;

        const rate = Math.max(0, Math.min(1, data.successRate));
        const barHeight = rate * chartHeight;
        const xSlotCenter = padding.left + index * slotWidth + slotWidth / 2;
        const barX = xSlotCenter - barWidth / 2;
        const barY = padding.top + chartHeight - barHeight;

        points.push({ x: xSlotCenter, y: barY });

        const isSelected = key === selectedEffort;

        // Bar container
        const barRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        barRect.setAttribute('x', barX);
        barRect.setAttribute('y', barY);
        barRect.setAttribute('width', barWidth);
        barRect.setAttribute('height', Math.max(2, barHeight));
        barRect.setAttribute('rx', '4');

        if (isSelected) {
          barRect.setAttribute('fill', 'url(#active-bar-grad)');
          barRect.setAttribute('stroke', '#60a5fa');
          barRect.setAttribute('stroke-width', '2');
          barRect.setAttribute('filter', 'drop-shadow(0 0 8px rgba(96, 165, 250, 0.45))');
        } else {
          barRect.setAttribute('fill', '#3b82f6');
          barRect.setAttribute('opacity', '0.65');
        }
        svg.appendChild(barRect);

        // Success rate percentage label above bar
        const rateLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        rateLabel.setAttribute('x', xSlotCenter);
        rateLabel.setAttribute('y', Math.max(padding.top - 6, barY - 8));
        rateLabel.setAttribute('text-anchor', 'middle');
        rateLabel.setAttribute('fill', isSelected ? '#93c5fd' : '#f8fafc');
        rateLabel.setAttribute('font-size', isSelected ? '13px' : '12px');
        rateLabel.setAttribute('font-family', 'sans-serif');
        rateLabel.setAttribute('font-weight', isSelected ? 'bold' : '600');
        rateLabel.textContent = `${(rate * 100).toFixed(1)}%`;
        svg.appendChild(rateLabel);

        // Active indicator badge above active bar
        if (isSelected) {
          const badgeBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          badgeBg.setAttribute('x', xSlotCenter - 26);
          badgeBg.setAttribute('y', Math.max(10, barY - 26));
          badgeBg.setAttribute('width', 52);
          badgeBg.setAttribute('height', 14);
          badgeBg.setAttribute('rx', 3);
          badgeBg.setAttribute('fill', '#1d4ed8');
          svg.appendChild(badgeBg);

          const badgeText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          badgeText.setAttribute('x', xSlotCenter);
          badgeText.setAttribute('y', Math.max(10, barY - 26) + 10);
          badgeText.setAttribute('text-anchor', 'middle');
          badgeText.setAttribute('fill', '#ffffff');
          badgeText.setAttribute('font-size', '9px');
          badgeText.setAttribute('font-family', 'sans-serif');
          badgeText.setAttribute('font-weight', 'bold');
          badgeText.textContent = 'ACTIVE';
          svg.appendChild(badgeText);
        }

        // X-axis effort title
        const xTitle = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        xTitle.setAttribute('x', xSlotCenter);
        xTitle.setAttribute('y', padding.top + chartHeight + 18);
        xTitle.setAttribute('text-anchor', 'middle');
        xTitle.setAttribute('fill', isSelected ? '#60a5fa' : '#f1f5f9');
        xTitle.setAttribute('font-size', '12px');
        xTitle.setAttribute('font-family', 'sans-serif');
        xTitle.setAttribute('font-weight', isSelected ? 'bold' : '500');
        xTitle.textContent = key;
        svg.appendChild(xTitle);

        // X-axis budget details (cost in steps)
        const costLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        costLabel.setAttribute('x', xSlotCenter);
        costLabel.setAttribute('y', padding.top + chartHeight + 33);
        costLabel.setAttribute('text-anchor', 'middle');
        costLabel.setAttribute('fill', '#94a3b8');
        costLabel.setAttribute('font-size', '10px');
        costLabel.setAttribute('font-family', 'sans-serif');
        costLabel.textContent = `${data.avgSteps.toFixed(1)} steps`;
        svg.appendChild(costLabel);

        // X-axis latency (ms)
        const timeLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        timeLabel.setAttribute('x', xSlotCenter);
        timeLabel.setAttribute('y', padding.top + chartHeight + 47);
        timeLabel.setAttribute('text-anchor', 'middle');
        timeLabel.setAttribute('fill', '#64748b');
        timeLabel.setAttribute('font-size', '9.5px');
        timeLabel.setAttribute('font-family', 'sans-serif');
        timeLabel.textContent = `${data.wallTimeMs.toFixed(1)}ms`;
        svg.appendChild(timeLabel);
      });

      // Connecting trend line illustrating the diminishing returns curve
      if (points.length === 3) {
        const pathData = `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y} L ${points[2].x} ${points[2].y}`;
        const trendPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        trendPath.setAttribute('d', pathData);
        trendPath.setAttribute('fill', 'none');
        trendPath.setAttribute('stroke', '#38bdf8');
        trendPath.setAttribute('stroke-width', '2');
        trendPath.setAttribute('stroke-dasharray', '5,4');
        trendPath.setAttribute('opacity', '0.75');
        svg.appendChild(trendPath);

        // Nodes on trend line
        for (const p of points) {
          const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          circle.setAttribute('cx', p.x);
          circle.setAttribute('cy', p.y);
          circle.setAttribute('r', '4');
          circle.setAttribute('fill', '#38bdf8');
          circle.setAttribute('stroke', '#0f172a');
          circle.setAttribute('stroke-width', '2');
          svg.appendChild(circle);
        }
      }

      // Add gradient definitions
      const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      const grad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
      grad.setAttribute('id', 'active-bar-grad');
      grad.setAttribute('x1', '0%');
      grad.setAttribute('y1', '0%');
      grad.setAttribute('x2', '0%');
      grad.setAttribute('y2', '100%');

      const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
      stop1.setAttribute('offset', '0%');
      stop1.setAttribute('stop-color', '#38bdf8');
      const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
      stop2.setAttribute('offset', '100%');
      stop2.setAttribute('stop-color', '#1d4ed8');

      grad.appendChild(stop1);
      grad.appendChild(stop2);
      defs.appendChild(grad);
      svg.prepend(defs);
    }

    return { render };
  }

  const ChartModule = { createChartRenderer };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChartModule;
  }
  if (typeof window !== 'undefined') {
    window.ChartModule = ChartModule;
  }
})(typeof window !== 'undefined' ? window : global);
