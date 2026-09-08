# EffortDial — Inference-Time Scaling Research Laboratory

**DataForge 2026 — Pathway Track | Selected Topic: Inference-Time Scaling**  
*An empirical AI research laboratory evaluating test-time compute allocation, diminishing marginal returns, and the Pareto-optimal compute frontier on combinatorial constraint satisfaction problems.*

[![Tests](https://img.shields.io/badge/tests-260%2F260%20passing-success.svg)](#8-results--empirical-verification)
[![Runtime](https://img.shields.io/badge/runtime-Vanilla%20ES6%2B%20%2F%20SVG-blue.svg)](#7-technical-architecture)
[![Computation](https://img.shields.io/badge/computation-100%25%20Genuine%20Browser%20Solver-orange.svg)](#4-how-effortdial-works)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

### Executive Summary (For Hackathon Judges)

Modern reasoning architectures (such as OpenAI o1/o3, DeepSeek-R1, and recurrent models like BDH-CQ) increasingly allocate computational effort during inference to improve solution quality. However, is more compute always worth the cost?

**EffortDial** is a fully interactive, browser-native research platform that demonstrates the universal laws of test-time scaling:
1. **Diminishing Marginal Returns**: Initial compute investments buy rapid accuracy surges, while subsequent investments yield progressively smaller gains at exponential cost.
2. **The Complexity Ceiling**: Increasing compute expands achievable performance ceilings but cannot guarantee 100% success on intrinsically NP-hard instances.
3. **The Pareto Sweet Spot**: Optimal compute allocation occurs early along the compute curve, capturing the vast majority of problem-solving capacity at a fraction of maximum cost.

Every metric, chart, and chessboard move in EffortDial is **100% computed live in your browser** using a real heuristic local search engine (min-conflicts on N-Queens). Zero mocked data, zero fake animations, and zero pre-baked results.

---

## 1. Problem: Does More Compute Always Mean Better Reasoning?

A central premise in recent AI literature is that allocating extra computational budget during inference can boost reasoning capability without scaling model parameters (Snell et al., 2024). 

However, this scaling trade-off is governed by an asymmetric law:
- **Early budget efficiency**: The easiest failure modes are resolved rapidly with modest exploration.
- **Late budget stagnation**: The remaining unsolved configurations are combinatorial dead-ends that require disproportionately massive search trees to resolve.
- **Economic trade-off**: In real-world AI deployment, compute cost and latency scale linearly or quadratically with search budget. Without understanding marginal efficiency, engineers risk burning 10× more compute for negligible (<2%) accuracy gains.

---

## 2. Motivation: Making Latent Inference-Time Scaling Tangible

Inference-time scaling occurs in two primary paradigms:
1. **Token-Based Scaling** (e.g., chain-of-thought, o1, s1): The model outputs visible reasoning tokens. This is easy to observe because tokens appear on screen.
2. **Latent Recurrent Scaling** (e.g., BDH-CQ): The model iterates over an internal recurrent working memory state without emitting visible text. This is virtually invisible to the user.

Most interactive demonstrations either rely on pre-rendered video animations or present uninterpretable neural black boxes. EffortDial solves this challenge by using **min-conflicts local search on N-Queens** as a transparent, fully auditable experimental laboratory:
- Every state transition, conflict score, and queen relocation is exposed frame-by-frame.
- The dual mechanisms of test-time scaling — **parallel sampling** (random restarts) and **sequential refinement** (heuristic repair steps) — are mapped directly to concrete, watchable quantities.
- The platform places published ARC benchmark numbers from BDH-CQ directly alongside live algorithmic search to illustrate the universal concavity law shared across distinct computational substrates.

---

## 3. The Solution: Real Algorithmic Heuristic Search as a Live Substrate

EffortDial bridges theoretical test-time compute theory with hands-on empirical experimentation through three core components:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          EFFORTDIAL CORE PLATFORM                           │
├──────────────────────────────┬──────────────────────────────┬───────────────┤
│    1. Live Experiment Lab    │    2. Substrate Animator     │ 3. Sweep Lab  │
│  - Real-time Effort Dials    │  - Frame-exact queen moves   │ - 5 Budgets   │
│  - Instant Batch Evaluations │  - Zero graphic interpolation│ - Pareto Curve│
│  - Dynamic Metrics Deck      │  - Step-by-step playback     │ - Marginals   │
└──────────────────────────────┴──────────────────────────────┴───────────────┘
```

### The Central Claim
> **Spending more inference-time compute — more independent attempts and more refinement steps per attempt — increases a search algorithm's success rate on a hard constraint problem, but with diminishing returns; this exact shape (accuracy up, cost up, gains shrinking) is the same trade-off BDH-CQ's own LOW/MEDIUM/HIGH effort levels show on ARC, even though BDH-CQ scales a different kind of computation (recurrent latent state, not restarts).**

### Strict Academic Boundary
EffortDial explicitly maintains clear scientific boundaries between discrete search and recurrent neural reasoning:
> *"This demo's compute (restarts × search steps on a constraint puzzle) is not BDH-CQ's compute (recurrent latent-state updates on a trained transformer). They are two different real mechanisms that produce the same general shape of trade-off."*

---

## 4. How EffortDial Works: Computational & Experimental Protocol

### Min-Conflicts Heuristic Search Algorithm
The solver models the classic N-Queens constraint satisfaction problem where $N$ queens are placed on an $N \times N$ grid, one per column.

The objective function $\text{conflicts}(B)$ measures total pairwise diagonal and horizontal attacks:
$$\text{conflicts}(B) = \sum_{i < j} [B[i] = B[j] \lor |B[i] - B[j]| = |i - j|]$$

At each search step:
1. A conflicting queen is selected at random.
2. The algorithm evaluates conflict counts across all rows in that queen's column.
3. The queen is relocated to the row minimizing total attacks (ties broken randomly).
4. If the board reaches $0$ conflicts, the puzzle is solved. If the step limit is reached without resolution, the attempt terminates and a new restart begins from a fresh randomized board.

### Calibrated Experimental Presets

| Effort | Restarts | Max steps per restart | Total Max Budget | Algorithmic Equivalent |
|---|---|---|---|---|
| LOW | 1 | 20 | 20 steps | Single quick greedy pass |
| MEDIUM | 3 | 25 | 75 steps | Balanced exploration (Sweet Spot) |
| HIGH | 5 | 40 | 200 steps | Exhaustive budget ceiling |

### Calibrated Problem Difficulties
- **Easy ($N=8$ Queens)**: Standard 8-Queens problem. Solves reliably, clearly demonstrating diminishing returns (LOW: $33.3\% \rightarrow$ MEDIUM: $90.0\% \rightarrow$ HIGH: $100.0\%$).
- **Hard ($N=24$ Queens)**: 24-Queens puzzle with a state space of $24^{24} \approx 1.33 \times 10^{33}$. Visibly resists LOW ($0.0\%$) and MEDIUM ($20.0\%$), and caps at **$80.0\%$** on HIGH, demonstrating that compute expansion raises performance ceilings but cannot guarantee perfection on hard instances.

### Deterministic Seed Protocol
All evaluations run across 30 independent trials using a seedable Linear Congruential Generator (LCG):
$$X_{n+1} = (1664525 \cdot X_n + 1013904223) \bmod 2^{32}$$
- Seeds are strictly indexed ($42 \dots 71$ for Easy, $542 \dots 571$ for Hard), guaranteeing 100% bit-exact reproducibility across all browsers and devices.

---

## 5. Interactive Features

### 1. The Live Experiment Console
- **Effort Dials**: Click between **LOW**, **MEDIUM** (Sweet Spot), and **HIGH** presets to trigger immediate batch re-computation.
- **Difficulty Selector**: Toggle between **Easy (8-Queens)** and **Hard (24-Queens)** to observe how problem scale impacts the scaling curve.
- **Primary Metrics Deck**: Live readouts of Success Rate (% and ratio), Compute Cost (average search steps actually executed), Runtime Latency (measured wall-clock milliseconds), and Compute Budget (restarts $\times$ max steps).
- **Comparative Performance Chart**: Live SVG chart displaying comparative success rates across all three effort tiers with active highlighting.

### 2. Live Attempt Substrate & Playback Controls
- **Authentic Trace Playback**: Renders genuine queen positions and conflict heatmaps directly from the solver's immutable execution log (`boardTrace`).
- **Interactive Controls**:
  - **Watch One Solve**: Executes a fresh solve attempt and animates the heuristic repair process.
  - **Play / Pause**: Toggles live animation.
  - **Step Forward & Step Backward**: Steps through individual queen relocation frames for fine-grained inspection.

### 3. Published Reference Evidence Panel
- Side-by-side comparative analysis contrasting published ARC benchmark data from the primary BDH-CQ technical report against the live solver:
  - **BDH-CQ (ARC pass@2)**: LOW ($21.0\%$) $\rightarrow$ MEDIUM ($27.0\%$) $\rightarrow$ HIGH ($29.5\%$).
  - **Live N-Queens (Easy)**: LOW ($33.3\%$) $\rightarrow$ MEDIUM ($90.0\%$) $\rightarrow$ HIGH ($100.0\%$).
- Formatted side-by-side bar charts with amber and tech-cyan gradients.
- Structural mechanism comparison table examining substrates, dials, reasoning states, and shared scaling properties.
- In-artifact classification label: **"Reported by developer, primary source — not reproduced here"**.

### 4. Interactive Concept Check
- Inline educational prompts reinforcing the distinction between discrete search and recurrent latent memory.

---

## 6. Scaling Analysis: Continuous Sweeps & The Pareto Frontier

While three discrete presets illustrate basic scaling, understanding optimal compute allocation requires analyzing continuous marginal efficiency.

EffortDial includes a dedicated **Advanced Scaling Experiment**:

### 1. Continuous 5-Level Compute Sweep
Clicking **Run Scaling Sweep** triggers an automated evaluation across 5 monotonically increasing budgets:
1. **Minimal**: $1 \times 10$ steps ($10$ max steps)
2. **LOW**: $1 \times 20$ steps ($20$ max steps)
3. **MEDIUM**: $3 \times 25$ steps ($75$ max steps) — *Recommended Sweet Spot*
4. **HIGH**: $5 \times 40$ steps ($200$ max steps)
5. **Extended**: $7 \times 50$ steps ($350$ max steps)

### 2. Cost vs. Success Rate Pareto Curve
An interactive SVG visualization plots algorithmic compute cost (actual search steps executed) against problem success rate:
- Renders the concave Pareto efficiency frontier.
- Visualizes shaded area under the curve and grid projections.
- Illuminates the optimal sweet spot with an amber halo.

### 3. Marginal Returns Analysis Table
Computes exact marginal efficiency between consecutive compute tiers:
$$\text{Marginal Efficiency} = \frac{\Delta \text{Success Rate}}{\Delta \text{Compute Cost}} = \frac{S_k - S_{k-1}}{C_k - C_{k-1}} \quad (\% \text{ accuracy gain per search step})$$

**Empirical Scaling Results on Easy ($N=8$):**

| Compute Level | Budget | Success Rate | Search Steps (Cost) | Latency | $\Delta$ Success | $\Delta$ Compute | Marginal Efficiency |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Minimal** | $1 \times 10$ | $20.0\%$ | $9.1$ | $1.0\text{ ms}$ | — | — | *(baseline)* |
| **LOW** | $1 \times 20$ | $33.3\%$ | $16.8$ | $1.5\text{ ms}$ | $+13.3\%$ | $+7.7$ | $\mathbf{1.727\% / \text{step}}$ |
| **MEDIUM (Optimal)** | $3 \times 25$ | $90.0\%$ | $54.6$ | $3.0\text{ ms}$ | $+56.7\%$ | $+37.8$ | $\mathbf{1.500\% / \text{step}}$ |
| **HIGH** | $5 \times 40$ | $100.0\%$ | $130.9$ | $2.5\text{ ms}$ | $+10.0\%$ | $+76.3$ | $\mathbf{0.131\% / \text{step}}$ |
| **Extended** | $7 \times 50$ | $100.0\%$ | $211.3$ | $3.0\text{ ms}$ | $+0.0\%$ | $+80.4$ | $\mathbf{0.000\% / \text{step}}$ |

### 4. Automated Insights Engine
- **Scaling Outcome**: Confirms overall accuracy gain across the tested budget window ($+80.0\%$ on Easy).
- **Diminishing Returns Analysis**: Confirms empirical contraction of marginal efficiency as budgets expand.
- **Recommended Level**: Recommends **MEDIUM** ($3 \times 25$), capturing $90.0\%$ accuracy at roughly one-third of the high-tier compute cost.

---

## 7. Technical Architecture

EffortDial is built with a zero-dependency, modular client-side architecture using vanilla ES6+ and SVG rendering:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          PRESENTATION LAYER                                 │
│  - index.html: Semantic HTML5 laboratory structure                          │
│  - style.css: Warm editorial typography, responsive layout, glassmorphism   │
└──────────────────────────────────────▲──────────────────────────────────────┘
                                       │
                         app.js (Main Orchestrator)
        ┌──────────────────────────────┼──────────────────────────────┐
        ▼                              ▼                              ▼
┌──────────────┐             ┌────────────────────┐         ┌────────────────────┐
│   chart.js   │             │      board.js      │         │     scaling.js     │
│  Comparative │             │  BoardRenderer &   │         │  Continuous Sweep, │
│  SVG Scaling │             │  BoardAnimator     │         │  Pareto SVG Curve, │
│  Bar Chart   │             │  (Trace Playback)  │         │  Marginal Analysis │
└──────────────┘             └────────────────────┘         └────────────────────┘
        │                              │                              │
        └──────────────────────────────┼──────────────────────────────┘
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         COMPUTATIONAL ENGINE                                │
│  solver.js: Min-conflicts local search, deterministic LCG PRNG, batch runner│
└──────────────────────────────────────▲──────────────────────────────────────┘
                                       │
        ┌──────────────────────────────┴──────────────────────────────┐
        ▼                                                             ▼
┌──────────────────────────────┐              ┌──────────────────────────────┐
│          config.js           │              │         evidence.js          │
│  Calibrated Effort Presets   │              │  BDH-CQ Published ARC Data   │
│  & Difficulty Configurations │              │  & Methodological Contrast   │
└──────────────────────────────┘              └──────────────────────────────┘
```

---

## 8. Results & Empirical Verification

EffortDial has been verified through a multi-tiered testing protocol consisting of **260 automated test assertions** and automated headless browser audits:

```
========================================================================================
                               VERIFICATION SCORECARD
========================================================================================
 Automated Unit & Integration Tests : 260 / 260 PASS (100.0%)
 Headless Browser E2E Feature Audit : 38 / 38 PASS (100.0%)
 Browser Runtime Exceptions         : 0
 Browser Console Errors             : 0
 Responsiveness Verified Viewports  : Desktop (1280px), Tablet (768px), Mobile (375px)
========================================================================================
```

### Test Suite Breakdown

| Test Suite | Focus Area | Assertions | Result |
| :--- | :--- | :---: | :---: |
| [`tests/solver.test.js`](tests/solver.test.js) | Algorithm correctness, LCG determinism, conflict calculation | 15 / 15 | ✅ PASS |
| [`tests/phase2.test.js`](tests/phase2.test.js) | Calibrated presets, runtime latency benchmarks, diminishing returns | 7 / 7 | ✅ PASS |
| [`tests/board.test.js`](tests/board.test.js) | Board trace logging, BoardAnimator zero-interpolation playback | 14 / 14 | ✅ PASS |
| [`tests/phase4.test.js`](tests/phase4.test.js) | UI orchestration, cold-open defaults, all 6 control combinations | 116 / 116 | ✅ PASS |
| [`tests/phase5.test.js`](tests/phase5.test.js) | BDH-CQ reference accuracy, strict boundary statement, citations | 15 / 15 | ✅ PASS |
| [`tests/phase6.test.js`](tests/phase6.test.js) | ARIA accessibility, disclosures, educational recap, central claim | 32 / 32 | ✅ PASS |
| [`tests/phase7.test.js`](tests/phase7.test.js) | 5-level scaling sweep, Pareto curve math, marginal efficiency | 61 / 61 | ✅ PASS |
| **TOTAL** | **Full Regression Suite Across All Phases** | **260 / 260** | **100.0% PASS** |

---

## 9. How to Run

EffortDial requires **zero installation**, zero external dependencies, and zero build compilation.

### Option 1: Direct File Launch (Fastest)
Simply double-click `index.html` or open it in any modern browser:
```bash
# Windows
start index.html

# macOS
open index.html

# Linux
xdg-open index.html
```

### Option 2: Local Static Server (Recommended)
```bash
# Using Node.js npx
npx serve .

# Using Python 3
python -m http.server 8000
```
Then navigate to `http://localhost:8000`.

### Running Automated Regression Tests
To execute all 260 unit and integration tests:
```bash
node tests/solver.test.js; node tests/phase2.test.js; node tests/board.test.js; node tests/phase4.test.js; node tests/phase5.test.js; node tests/phase6.test.js; node tests/phase7.test.js
```

---

## 10. Project Structure & Academic Provenance

```
effort-dial/
├── README.md                # Comprehensive research documentation (this file)
├── index.html               # Semantic HTML5 research interface
├── style.css                # Warm editorial styling & responsive rules
├── LICENSE                  # MIT Open Source License
├── src/
│   ├── config.js            # Calibrated effort presets & task difficulty definitions
│   ├── solver.js            # Min-conflicts solver, deterministic PRNG, batch runner
│   ├── chart.js             # Comparative SVG bar chart visualization
│   ├── board.js             # SVG chessboard renderer & BoardAnimator playback engine
│   ├── evidence.js          # Static BDH-CQ data, boundary disclosures, contrast table
│   ├── scaling.js           # Phase 7: 5-level sweep, Pareto SVG curve, marginal table
│   └── app.js               # Main application orchestrator & reactive event bindings
├── sources/
│   └── SOURCES.md           # Citations, licensing provenance, and AI assistance disclosure
└── tests/
    ├── solver.test.js       # Phase 1: Algorithm correctness & PRNG determinism (15 tests)
    ├── phase2.test.js       # Phase 2: Calibrated benchmark verification (7 tests)
    ├── board.test.js        # Phase 3: Board trace playback & animator tests (14 tests)
    ├── phase4.test.js       # Phase 4: Full application UI integration tests (116 tests)
    ├── phase5.test.js       # Phase 5: BDH-CQ evidence verification (15 tests)
    ├── phase6.test.js       # Phase 6: Accessibility, disclosures & recap tests (32 tests)
    └── phase7.test.js       # Phase 7: Advanced scaling sweep & marginal analysis (61 tests)
```

### Primary Academic Sources
1. **Snell, C., et al. (2024)**. *Scaling LLM Test-Time Compute Optimally Can Be More Effective Than Scaling Model Parameters.* [arXiv:2408.03314](https://arxiv.org/abs/2408.03314).
2. **Muennighoff, N., et al. (2025)**. *s1: Simple Test-Time Scaling.* [arXiv:2501.19393](https://arxiv.org/abs/2501.19393).
3. **Zhang, Q., et al. (2025)**. *A Survey on Test-Time Scaling in Large Language Models: What, How, Where, and How Well?* [arXiv:2503.24235](https://arxiv.org/abs/2503.24235).
4. **Engdahl, E., et al. (2026)**. *BDH-CQ: In-Context Learning with Recurrent Latent Reasoning.* [arXiv:2608.09888](https://arxiv.org/abs/2608.09888).
5. **Kosowski, A., et al. (2025)**. *The Dragon Hatchling: The Missing Link between the Transformer and Models of the Brain.* [arXiv:2509.26507](https://arxiv.org/abs/2509.26507).
6. **Minton, S., et al. (1992)**. *Minimizing Conflicts: A Heuristic Repair Method for Constraint Satisfaction and Scheduling Problems.* *Artificial Intelligence*, 58(1-3), 161–205.

### License & AI Assistance
- **License**: Released under the open-source [MIT License](LICENSE).
- **AI Assistance**: Development and QA auditing were assisted by Claude (via Antigravity). All mathematical formulas, solver logic, literature citations, and empirical claims were independently verified against primary academic sources. Detailed disclosures are recorded in [`sources/SOURCES.md`](sources/SOURCES.md).
