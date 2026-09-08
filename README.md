# Effort Dial: Watching Inference-Time Scaling Happen

**DataForge 2026 — Pathway Track | Selected Topic: Inference-Time Scaling**

*Scoped intentionally for a one-day build: frontend-only, no training, no backend, one real live algorithm.*

---

## 1. Project Title

**Effort Dial: A Live Search Demonstration of Inference-Time Scaling, Compared Against BDH-CQ's Reported Effort Curve**

---

## 2. Central Claim

> **Spending more inference-time compute — more independent attempts and more refinement steps per attempt — increases a search algorithm's success rate on a hard constraint problem, but with diminishing returns; this exact shape (accuracy up, cost up, gains shrinking) is the same trade-off BDH-CQ's own LOW/MEDIUM/HIGH effort levels show on ARC, even though BDH-CQ scales a different kind of computation (recurrent latent state, not restarts).**

Falsifiable directly in the artifact: if the learner raises effort and success rate does not rise (or plateaus immediately, or cost doesn't rise), that specific case refutes the naive form of the claim — which is exactly what the "hard difficulty" setting is built to surface.

---

## 3. Problem and Motivation

Token-based test-time scaling is easy to show: you can watch a model generate more reasoning tokens and see accuracy climb (Snell et al., 2024; Muennighoff et al., 2025). Latent test-time scaling — the kind BDH-CQ does, where "more effort" means more recurrent computation on a hidden state rather than more visible text — is much harder to make felt, because there is nothing on screen to watch.

Rather than trying to fake that invisibility away with a trained neural network (which would take more than a day to build honestly, and risks becoming an unverifiable black box the team can't defend), this project uses a **real, classic, verifiable search algorithm** — min-conflicts local search on the N-Queens constraint problem — as a live, fully transparent substrate for the *general phenomenon* both mechanisms share: **more inference-time compute buys more accuracy, with diminishing returns.** The artifact is explicit throughout that this is an honest analogy to the shared phenomenon, not a reimplementation of BDH-CQ — and it places BDH-CQ's own reported numbers alongside it as separately labeled, primary-sourced evidence.

This keeps the whole project buildable in one day: no model to train, no dataset to curate, no hidden state to visualize — just one small, real, live algorithm whose behavior the learner can watch, poke at, and try to break.

---

## 4. Selected Pathway Topic

**Inference-Time Scaling** (Reasoning and Generalisation category): comparing how additional inference compute trades off against accuracy, cost, and latency, using BDH-CQ's low/medium/high-effort results as evidence that latent test-time compute improves performance without verbalized intermediate reasoning — set here against a live, algorithmic instance of the same general trade-off.

---

## 5. Target Audience

Final-year undergraduate / early graduate CS or AI students who know what "an algorithm" and "a success rate" are, and have at least heard the phrase "reasoning model" or "chain-of-thought," but have not necessarily read a test-time-scaling or latent-reasoning paper.

---

## 6. Prerequisites

- Basic idea of a constraint problem (e.g. "no two queens attack each other").
- Basic idea of randomness / retrying something until it works.
- No machine learning background required — this is explicitly not a neural network demo, and the README says so.

---

## 7. Learning Objectives

By the end, a learner should be able to:
1. State the central claim (§2) in their own words, including the diminishing-returns caveat.
2. Explain, concretely, what "spending more inference-time compute" means for our live demo (more restarts, more refinement steps) — a real, watchable quantity, not a metaphor.
3. Correctly state that BDH-CQ scales a *different* kind of computation (recurrent latent state, not restarts) but shows the *same shape* of trade-off, and point to where BDH-CQ's effort knob actually lives in its architecture.
4. Name at least one limitation of inference-time scaling (cost grows with effort; returns diminish; hard problems can still fail at any effort level).
5. Correctly classify every number in the artifact as either "live, computed in your browser right now" or "reported by BDH-CQ's developers, precomputed reference" — never confusing the two.

---

## 8. Interactive Learning Journey

**Step 0 — Cold open.** Page loads with a small chessboard already mid-solve: queens visibly repositioning as the min-conflicts algorithm runs at a default MEDIUM effort / Easy difficulty setting. No blank canvas, no "click run" required first.

**Step 1 — Turn the dial.** The learner moves the Effort control between LOW / MEDIUM / HIGH (matching BDH-CQ's own naming). Each change triggers a real batch of ~20–30 independent live solve attempts at that effort level, and a bar/line chart updates instantly: success rate, average steps used (cost), and measured wall-clock time (latency).

**Step 2 — Watch one attempt live.** A "Watch one solve" toggle animates a single attempt step by step on the board — the actual local-search moves, not a scripted animation — so the learner sees genuine computation happening, satisfying the track's "substrate, not animation" standard directly.

**Step 3 — Break the claim.** The learner switches Task Difficulty to Hard. At LOW/MEDIUM effort, success rate on Hard is visibly low or flat; even HIGH effort may not reach 100%. This is real algorithmic behavior, not staged — the learner is directly testing whether "more effort always helps" holds, and discovers the ceiling/ diminishing-returns caveat empirically.

**Step 4 — Compare to BDH-CQ.** A separate, clearly bordered Evidence panel shows BDH-CQ's own reported LOW/MEDIUM/HIGH pass@2 accuracy on ARC, sourced from the BDH-CQ technical report, positioned beside (never merged into) the live chart from Steps 1–3. The panel states plainly: same shape of trade-off, different underlying mechanism.

**Step 5 — Recap.** Two short inline prompts: "restate the claim in your own words" and "what's different about how BDH-CQ spends its extra effort, versus this demo?" — closing the loop on the learning objectives.

---

## 9. Interactive Controls

| Control | Concept variable it maps to | Effect |
|---|---|---|
| **Effort dial** (LOW / MEDIUM / HIGH) | Total search compute budget: number of independent restart attempts × refinement steps per attempt | Re-runs a live batch of solve attempts at the new budget; updates success-rate / cost / latency chart |
| **Task difficulty** (Easy / Hard) | Problem hardness (board size / queen count for the N-Queens instance) | Swaps the constraint problem being solved; Hard is chosen specifically to resist LOW/MEDIUM effort and stress-test HIGH |
| **"Watch one solve" toggle** | Whether a single live attempt is animated step by step on the board | Purely a visibility control — turns the *substrate* (real computation) visible without changing what's computed |

Exactly three controls, each mapped to one real variable — no decorative sliders, per the track's design standards.

---

## 10. Technical Architecture

```
┌─────────────────────────────────────────────────────────┐
│  index.html + style.css                                  │
│  - Board renderer (SVG/canvas)                            │
│  - Chart renderer (success rate / cost / latency)         │
│  - Effort dial, difficulty selector, watch-solve toggle   │
│  - Evidence panel (static, separately bordered)           │
└───────────────▲─────────────────────────────────────────┘
                │ effort level, difficulty, toggle state
┌───────────────┴─────────────────────────────────────────┐
│  solver.js — min-conflicts local search (vanilla JS)      │
│  - runAttempt(n, maxSteps) -> {solved, steps, boardTrace} │
│  - runBatch(effortConfig, difficulty, trials=20-30)        │
│    -> {successRate, avgSteps, wallTimeMs}                  │
└───────────────▲─────────────────────────────────────────┘
                │ static, read-only reference data
┌───────────────┴─────────────────────────────────────────┐
│  evidence.js — BDH-CQ LOW/MEDIUM/HIGH pass@2 numbers,      │
│  sourced from the BDH-CQ technical report, shipped as a    │
│  small hardcoded, labeled data object                      │
└─────────────────────────────────────────────────────────┘
```

Pure static frontend: HTML + CSS + vanilla JavaScript (or a minimal single-page framework if preferred, e.g. plain Vite with no server-side code). No Python, no training step, no backend, no build pipeline is strictly required — the whole thing can run by opening `index.html` directly or via any static file server. Deployable as-is to GitHub Pages/Netlify/Vercel static hosting.

---

## 11. Mathematical / Computational Model

**The live algorithm (min-conflicts local search on N-Queens).** Place N queens on an N×N board, one per column, at random rows. Define `conflicts(board)` as the number of pairs of queens attacking each other (same row or diagonal). At each step, pick the queen with the most conflicts, and move it to the row in its column that minimizes conflicts (ties broken randomly). Repeat up to `maxSteps` times; declare success if `conflicts(board) == 0`. Wrap this in `runAttempt`, and run it `restarts` times per effort level, each restart starting from a fresh random board — a real, textbook instance of local search with random restarts (Minton et al., 1992).

**Effort → compute budget mapping (fixed presets):**

| Effort | Restarts | Max steps per restart | Roughly mirrors |
|---|---|---|---|
| LOW | 1 | 20 | a single quick attempt |
| MEDIUM | 5 | 50 | a moderate compute budget |
| HIGH | 20 | 100 | a large compute budget |

These are the two classic, real mechanisms of test-time scaling that appear in the literature — **parallel sampling** (more independent restarts, the algorithmic analogue of best-of-n / self-consistency sampling in LLMs) and **sequential refinement** (more steps per attempt, the algorithmic analogue of iterative latent refinement). The artifact's Effort dial scales both together, and the README/UI names this explicitly so the learner sees both mechanisms named, not just one hidden inside a single number.

**What BDH-CQ actually does (primary-source description, not reproduced or re-implemented here).** BDH-CQ is built on the Dragon Hatchling (BDH) architecture — a post-Transformer sequence model using high-dimensional non-negative activations and a recurrent associative state acting as synaptic-style working memory (Kosowski et al., 2025). BDH-CQ adds in-context skill acquisition from demonstrations, trained across different latent-reasoning "effort" levels; at inference, the chosen effort level sets how many recurrent latent-computation steps the model performs before answering, with no additional parameter updates and no verbalized chain of thought (Engdahl et al., 2026). This is a **sequential refinement** mechanism in latent space — mechanically closer to our "steps per restart" dimension than our "restarts" dimension, and the artifact says so explicitly rather than implying full equivalence.

---

## 12. BDH-CQ Integration

Woven into Step 4 of the journey (§8), not bolted on at the end.

- **Which system, and why it's here:** BDH-CQ, the primary real-world evidence that latent (non-verbal) inference-time computation improves accuracy — exactly the general phenomenon this live demo makes tangible through a different, honest mechanism.
- **What's actually changing when BDH-CQ's effort increases:** the number of recurrent latent-computation steps performed per query at inference, not the model's trained parameters (Engdahl et al., 2026); BDH's underlying working memory is a recurrent associative/synaptic state rather than a growing token history (Kosowski et al., 2025).
- **Real reported result used, verbatim from the primary source:** BDH-CQ's pass@2 accuracy on ARC rises from **21% at LOW effort to 27% at MEDIUM to 29.5% at HIGH effort** (Engdahl et al., 2026) — an approximately monotonic, diminishing-returns curve, structurally the same shape as this artifact's own live success-rate curve, despite the different underlying mechanism.
- **Explicit relationship to BDH:** the effort-scheduling mechanism is BDH-CQ's contribution on top of BDH's recurrent-state substrate; base BDH is not described as having an inference-time effort dial itself.
- **Honest boundary statement, shown in the UI itself:** "This demo's compute (restarts × search steps on a constraint puzzle) is not BDH-CQ's compute (recurrent latent-state updates on a trained transformer). They are two different real mechanisms that produce the same general shape of trade-off."

---

## 13. Evidence Classification

| Claim / number shown | Source type | Label used in the artifact |
|---|---|---|
| BDH-CQ pass@2: LOW 21% → MEDIUM 27% → HIGH 29.5% on ARC | Reported by the architecture's own developers, from the primary BDH-CQ technical report | **"Reported by developer, primary source — not reproduced here"** |
| BDH's recurrent associative state as working memory | Architectural description, primary Dragon Hatchling paper | **"Architectural description, primary source"** |
| This demo's success rate / cost / latency at each effort × difficulty | Computed live, in the learner's own browser, right now | **"Live computation — you just ran this"** |
| General token-based test-time-scaling trend (Snell et al., 2024; Muennighoff et al., 2025) | Independent academic literature, not Pathway-affiliated | **"Independent literature, benchmark result"** |

---

## 14. Data and Research Sources

**Primary BDH / BDH-CQ sources**
- Kosowski, A. et al. *The Dragon Hatchling: The Missing Link between the Transformer and Models of the Brain.* arXiv:2509.26507 (2025).
- Engdahl et al. *BDH-CQ: In-Context Learning with Recurrent Latent Reasoning.* arXiv:2608.09888 (2026).
- Pathway, *"The Equations of Reasoning"* blog post (design-motivation context, not a numerical source).

**Recent primary papers on inference-time / test-time scaling (2022–2026), required by the submission rules**
1. Snell, C., Lee, J., Xu, K., & Kumar, A. *Scaling LLM Test-Time Compute Optimally Can Be More Effective Than Scaling Model Parameters.* arXiv:2408.03314 (2024). — establishes the general "spend inference compute, gain accuracy" trend this artifact makes tangible.
2. Muennighoff, N. et al. *s1: Simple Test-Time Scaling.* arXiv:2501.19393 (2025). — a minimal, controllable token-based effort knob, used in the README as the contrasting *token-based* mechanism against BDH-CQ's *latent* one.
3. Zhang, Q. et al. *A Survey on Test-Time Scaling in Large Language Models: What, How, Where, and How Well?* arXiv:2503.24235 (2025). — taxonomy used to correctly place both the parallel-sampling and sequential-refinement mechanisms this demo illustrates within the wider landscape.

**Algorithmic reference for the live demo (supplementary, not a test-time-scaling paper)**
- Minton, S., Johnston, M. D., Philips, A. B., & Laird, P. *Minimizing Conflicts: A Heuristic Repair Method for Constraint Satisfaction and Scheduling Problems.* Artificial Intelligence, 58(1-3), 1992. — the classic min-conflicts algorithm this demo implements, cited for provenance, not counted toward the three required inference-time-scaling papers above.

---

## 15. Live vs Precomputed vs Simulated Components

| Component | Status | Notes |
|---|---|---|
| Every min-conflicts solve attempt, at any effort/difficulty | **Live** | Runs in the learner's browser on click/change; sub-second even for HIGH effort × 20-30 trials |
| Success-rate / cost / latency chart | **Live**, built from the live runs above | Recomputed every time effort or difficulty changes |
| "Watch one solve" board animation | **Live**, driven by the real step-by-step trace of one actual attempt | Not scripted — if you pause it, you're pausing real intermediate algorithm state |
| BDH-CQ LOW/MEDIUM/HIGH pass@2 numbers in the Evidence panel | **Precomputed, clearly labeled** | Static reference data from the BDH-CQ technical report; never recomputed, never blended into the live chart's data series |

---

## 16. Limitations

- This is a search algorithm, not a language model or a trained neural system — it demonstrates the *general phenomenon* of inference-time scaling, not BDH-CQ's specific learned mechanism, and the artifact says this explicitly rather than implying equivalence.
- N-Queens under min-conflicts is a much simpler, better-understood problem than ARC-style demonstration-based reasoning; the *shape* of the trade-off transfers, not the specific numbers.
- No independent, third-party reproduction of BDH-CQ's ARC numbers is publicly available at time of writing; the Evidence panel states this.
- Effort presets (§11) are fixed, hand-chosen budgets, not tuned to numerically match BDH-CQ's curve — only the qualitative shape (rising, diminishing returns) is the intended comparison.
- Success rate is estimated from ~20–30 live trials per setting; it carries real statistical noise, which the artifact does not hide (small trial counts are stated on screen).

---

## 17. Failure Cases and Misconceptions

- **Misconception: "more effort always helps."** Directly testable and, on Hard difficulty at LOW effort, often false in a single run — the demo is built so the learner can find this themselves via Step 3 (§8).
- **Misconception: "this demo IS BDH-CQ."** It is not. The UI and README state, in the same panel as the BDH-CQ numbers, that this is an honest analogy for the shared phenomenon using a different, fully real, algorithmic mechanism.
- **Failure case: hard problems fail at every effort level.** On Hard difficulty, HIGH effort may still not reach 100% success — inference-time scaling raises the achievable ceiling, it doesn't guarantee success on arbitrarily hard instances, matching the fact that BDH-CQ's own HIGH-effort pass@2 (29.5%) is well below 100%.
- **Common confusion: which knob is which mechanism.** The README and in-UI copy explicitly label "restarts" as the parallel-sampling mechanism and "steps per restart" as the sequential-refinement mechanism, so the learner doesn't collapse two real, distinct ideas of "more compute" into one.

---

## 18. Installation and Usage

No Python, no model training, no backend, no build step required.

```bash
# Clone the repository
git clone <public-source-code-repository-url>
cd effort-dial

# Option A — just open it
open index.html          # or double-click the file

# Option B — serve it locally (recommended for consistent behavior across browsers)
npx serve .
# then open the printed local URL
```

The hosted public artifact URL (no sign-in) is provided separately in the submission package.

---

## 19. Project Structure

```
effort-dial/
├── README.md                # this file
├── concept_summary.pdf       # one-page concept summary (separate deliverable)
├── index.html                 # single entry point
├── style.css
├── src/
│   ├── solver.js              # min-conflicts algorithm, runAttempt / runBatch
│   ├── board.js                # board rendering + "watch one solve" animation
│   ├── chart.js                # success-rate / cost / latency chart rendering
│   ├── evidence.js             # static, labeled BDH-CQ reference data
│   └── app.js                  # wires controls to solver + chart + evidence panel
├── sources/
│   └── SOURCES.md              # citation + license record
└── LICENSE
```

---

## 20. Reproducibility

- `solver.js` uses a seedable pseudo-random generator; a fixed seed (exposed as an optional query parameter, e.g. `?seed=42`) reproduces an identical batch of runs exactly.
- Without a seed, results are genuinely randomized per session — the artifact states this on screen rather than implying false precision; success-rate numbers are reported as "N of 20-30 trials," not as if they were exact probabilities.
- The BDH-CQ evidence numbers are static and identical on every load, with their source (arXiv ID + table/figure reference) stored directly in `evidence.js`, so any reviewer can check them against the primary source.

---

## 21. AI Assistance Disclosure

- AI assistance (Claude, via Antigravity) was used to help scaffold the HTML/CSS/JS structure, the min-conflicts implementation, and this README's drafting.
- All technical claims about BDH, BDH-CQ, and inference-time scaling were verified by the team against the primary sources in §14 before inclusion.
- The min-conflicts algorithm, effort-preset design, and the honest-boundary framing between the live demo and BDH-CQ were reviewed and are understood by the registered team, who can trace and defend every line of `solver.js`.
- Full, file-level AI-assistance and license disclosure is maintained in `sources/SOURCES.md`.

*(Team: replace with your actual, specific disclosure before submission.)*

---

## 22. Credits and Licenses

- **Solver, board/chart UI, evidence panel:** original work by the team, MIT License (see `LICENSE`).
- **Min-conflicts algorithm:** classic technique, cited to Minton et al. (1992); this implementation is original code, not copied from any specific codebase.
- **BDH / BDH-CQ concepts and reported numbers:** used under fair-use/citation for educational purposes, attributed to Kosowski et al. (2025) and Engdahl et al. (2026); no BDH/BDH-CQ code, weights, or proprietary data are redistributed.
- **Mentorship disclosure:** *(team to fill in, if applicable.)*

---

## 23. Future Improvements (Optional)

- Add a second, real puzzle type (e.g., graph coloring) so the learner can check the claim generalizes beyond N-Queens.
- Add a slider that separates "restarts" and "steps per restart" independently (instead of the combined LOW/MEDIUM/HIGH preset) for advanced exploration of the two mechanisms.
- If an independent reproduction of BDH-CQ's ARC numbers becomes available, add it as a second, distinctly labeled series in the Evidence panel.
- Extend into the "Cost–Accuracy Pareto Frontier" topic by adding a cost-per-unit-accuracy calculator on top of the existing live chart data.
