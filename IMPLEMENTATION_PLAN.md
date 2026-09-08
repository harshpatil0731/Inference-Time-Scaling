# Implementation Plan — Effort Dial (One-Day, Frontend-Only Build)

**Purpose of this document:** a six-phase build plan for Antigravity to execute against `README.md`. Scoped for a single day, entirely frontend (HTML/CSS/vanilla JS), no backend, no Python, no training. Each phase ends in a working, checkable state before the next one starts — don't let the agent skip ahead on the strength of "it should work."

**How to use this with Antigravity:**
1. Upload `README.md` and this file together as context in every phase.
2. Run phases **in order**. Each phase's Exit Check is a hard gate — verify it yourself in the browser, not from the agent's summary.
3. Keep every phase's output runnable by just opening `index.html` (or `npx serve .`) — no phase should ever require a half-finished build step to preview.
4. Phase 1 is the phase you personally need to understand cold. Everything after it is UI wrapped around that one real computation.

**Rough time budget for a one-day build:** Phase 1 — 90–120 min · Phase 2 — 45–60 min · Phase 3 — 60–90 min · Phase 4 — 60–90 min · Phase 5 — 30–45 min · Phase 6 — 60–90 min. Leave the last hour of your day as slack, not as part of Phase 6.

---

## Phase 1 — Build and Verify the Real N-Queens Solver

**Goal:** `src/solver.js`, a correct, honest, standalone implementation of min-conflicts local search (README §11) — verified against ground truth before any UI touches it.

**Tasks:**
- Implement board representation: array of length N, `board[col] = row`, one queen per column (README §11).
- Implement `conflicts(board)`: count attacking pairs (same row or diagonal).
- Implement `runAttempt(n, maxSteps, rng)`: random initial board → repeatedly pick the most-conflicted queen, move it to the row in its column minimizing conflicts (ties broken randomly via `rng`) → stop at `conflicts == 0` (success) or `maxSteps` exhausted (failure) → return `{solved, steps, boardTrace}` where `boardTrace` is the full sequence of intermediate boards (needed later for Phase 3's animation — capture it now even though it's unused until then).
- Implement `runBatch(n, restarts, maxSteps, trials, rng)`: runs `trials` independent calls to `runAttempt`, returns `{successRate, avgSteps, wallTimeMs}` using `performance.now()` for real measured latency.
- Implement a seedable PRNG (`mulberry32` or similar, ~10 lines) so `rng` is deterministic when seeded — this is what makes README §20's reproducibility claim true. Expose it as `createRng(seed)`.
- Write a small `solver.test.html` (or a `<script>` block you run in-console) that:
  - Confirms `conflicts()` returns 0 for a known valid N-Queens solution and >0 for a known invalid board.
  - Runs `runBatch` at N=8 with a generous budget (e.g. 20 restarts × 200 steps) and confirms success rate is high (min-conflicts on N=8 should solve nearly every time) — if it isn't, the algorithm has a bug, not the puzzle.
  - Confirms two calls with the same seed produce bit-identical `boardTrace` output; two calls with different seeds diverge.

**Antigravity prompt shape:**
> "Implement src/solver.js exactly per README §11 and §20: min-conflicts N-Queens local search with a seedable PRNG, runAttempt returning a full boardTrace, and runBatch aggregating trials into successRate/avgSteps/wallTimeMs. Do not touch any UI file in this phase. After implementing, write and run the verification checks listed in the plan and report actual output, not expected output."

**Exit Check:**
- [ ] You can explain, without the code open, exactly what happens in one step of min-conflicts.
- [ ] `conflicts()` is verified correct on at least one known-good and one known-bad board.
- [ ] N=8 with a generous budget solves in the large majority of trials — if not, this is a bug to fix now, not a "difficulty setting" to design around later.
- [ ] Same-seed determinism is confirmed by an actual run, not assumed.
- [ ] No HTML/CSS file has been touched yet.

---

## Phase 2 — Add LOW/MEDIUM/HIGH Effort Experiments

**Goal:** wire the solver to the three fixed effort presets and the two difficulty settings from README §9/§11, and confirm the real numbers actually produce the diminishing-returns shape the claim depends on — before building any chart or board UI.

**Tasks:**
- Define the effort presets exactly as README §11's table: LOW = 1 restart × 20 steps, MEDIUM = 5 × 50, HIGH = 20 × 100.
- Choose the two N-Queens instances for Task Difficulty (README §9): pick an **Easy** N (e.g. N=8, known to solve readily even at LOW effort) and a **Hard** N (larger, e.g. N=20–30, or the same N with a tighter step budget) that visibly resists LOW/MEDIUM effort. Test both, adjust N or step budgets until the pattern is real and honest — don't hardcode a fake result.
- Run all 6 combinations (3 effort × 2 difficulty) through `runBatch` with ~20–30 trials each, log the actual `{successRate, avgSteps, wallTimeMs}` table to the console.
- Verify against the claim (README §2): Easy should show success rate rising LOW→MEDIUM→HIGH with shrinking increments; Hard should show a visibly lower curve, ideally not reaching 100% even at HIGH — this is what makes Step 3 of the learning journey (§8) honest rather than staged.
- **If Hard solves too easily at LOW effort, or Easy fails to show diminishing returns, adjust N or step budgets now.** This is a data-design decision, made from real measurements — not something to fix cosmetically in the UI later.
- Save the final chosen presets/instances into a small `src/config.js` so later phases don't hardcode magic numbers inline.

**Antigravity prompt shape:**
> "Using src/solver.js from Phase 1, write a temporary console script that runs all 3 effort levels × 2 difficulty settings (start with N=8 Easy and N=24 Hard, or propose alternatives) at 25 trials each, and print the successRate/avgSteps/wallTimeMs table. Do not build any UI yet. If the resulting pattern doesn't show diminishing returns on Easy and a visible ceiling on Hard, try alternative N values or step budgets and report the final table you settled on and why."

**Exit Check:**
- [ ] You have an actual printed table of real numbers for all 6 combinations, not a hoped-for one.
- [ ] Easy shows rising success rate with shrinking gains LOW→MEDIUM→HIGH.
- [ ] Hard shows a visibly lower curve than Easy, and ideally doesn't reach 100% even at HIGH effort.
- [ ] The final N values and step budgets are captured in `src/config.js`, not left as inline magic numbers.
- [ ] Total wall-clock time for the HIGH-effort batch (worst case) is still sub-second — if not, reduce trial count or step budget now, before it becomes a UI performance problem later.

---

## Phase 3 — Add the Live Chessboard Animation

**Goal:** `src/board.js` — the "watch one solve" visual substrate from README §8 Step 2 and §9, driven by a real `boardTrace` from Phase 1, not a scripted animation.

**Tasks:**
- Render an N×N board (SVG or `<canvas>`, either is fine — SVG is easier to style and debug) showing queen positions from a `board` array.
- Implement `animateTrace(boardTrace, stepDelayMs)`: steps through a captured `boardTrace` from Phase 1's `runAttempt`, redrawing the board at each step with a short delay (e.g. `setInterval` or `requestAnimationFrame` gated by elapsed time).
- Add a minimal control: a "Watch one solve" button that runs one fresh `runAttempt` at the currently selected effort/difficulty and animates its real trace.
- Add a visible indicator of which queen just moved (e.g. a brief highlight) so the "most-conflicted queen gets repaired" mechanic (README §11) is legible, not just a blur of positions.
- Confirm: pausing mid-animation and inspecting the board state matches an actual intermediate state from `boardTrace` — i.e., there's no interpolation or fakery between real steps.

**Antigravity prompt shape:**
> "Implement src/board.js to render an N-Queens board and step through a real boardTrace array (from src/solver.js's runAttempt) via animateTrace(). Wire a temporary 'Watch one solve' button in a bare-bones index.html to trigger it. Do not add effort/difficulty controls, charts, or the evidence panel in this phase — only the board and the animation."

**Exit Check:**
- [ ] The board visibly updates queen-by-queen during "Watch one solve," matching a real trace.
- [ ] You can pause and confirm the displayed board state is a genuine intermediate state, not an interpolated guess.
- [ ] Animation runs smoothly (no jank) for both Easy and Hard difficulty step counts.
- [ ] No chart or evidence panel code has been added yet — this phase is board-only.

---

## Phase 4 — Add Success / Cost / Runtime Visualization

**Goal:** `src/chart.js` plus the Effort dial and Task difficulty controls wired end-to-end, producing the live chart from README §8 Steps 1 and 3, and §9's control table.

**Tasks:**
- Build the Effort dial (LOW/MEDIUM/HIGH) and Task difficulty (Easy/Hard) controls (simple radio buttons or a segmented control — no need for anything fancier).
- On any control change, call `runBatch` (from Phase 1, using Phase 2's saved presets/config) live and update:
  - A success-rate bar or line chart across LOW/MEDIUM/HIGH for the current difficulty.
  - A displayed cost value (avg. steps used) and latency value (measured `wallTimeMs`) alongside the chart — not buried in a tooltip.
- On load (cold open, README §8 Step 0), default to MEDIUM effort / Easy difficulty with the batch already computed and chart already populated — no blank state before first interaction.
- Wire the Phase 3 board animation into the same screen: "Watch one solve" always animates a fresh attempt at the *currently selected* effort/difficulty, so the board and the chart are always showing the same setting.
- Confirm feedback speed: every control change should update the chart in well under a second (README's fast-feedback standard) — if HIGH effort × Hard difficulty is too slow, revisit Phase 2's trial count or step budget, don't just add a loading spinner to hide it.

**Antigravity prompt shape:**
> "Add the Effort dial and Task difficulty controls to index.html, wire them to src/solver.js's runBatch and src/chart.js to update a success-rate/cost/latency chart live on every change, using the presets from src/config.js. Ensure the board from Phase 3's 'Watch one solve' always reflects the currently selected effort/difficulty. Confirm and report actual update latency for the worst-case (HIGH effort, Hard difficulty) setting."

**Exit Check:**
- [ ] Page loads directly into a populated, non-blank chart + board (cold-open requirement).
- [ ] Changing Effort or Difficulty updates the chart, cost, and latency numbers live, in well under a second.
- [ ] "Watch one solve" always matches the currently selected controls, not a stale setting.
- [ ] You've personally reproduced the Hard-difficulty "doesn't always help" result from Phase 2 by using the actual controls, not just trusting the earlier console table.

---

## Phase 5 — Add BDH-CQ Evidence Panel

**Goal:** `src/evidence.js` and its rendered panel — the separately labeled, precomputed comparison from README §12–§13. Small in code size, high-stakes in accuracy: this is a scored, zero-tolerance-for-error rubric item.

**Tasks:**
- Manually transcribe (don't let the agent invent or "helpfully fill in" any number) the BDH-CQ LOW/MEDIUM/HIGH pass@2 values from the primary BDH-CQ technical report, each with its exact table/figure citation, into a static `evidence.js` data object — no computation, just labeled constants.
- Re-check every transcribed number against the primary source a second time, independently of your first read.
- Render the Evidence panel with a visually distinct border/background from the live chart (README §15) so it's unmistakably a separate data source, never merged into the same series.
- Add the explicit boundary statement from README §12 into the panel's copy, verbatim in spirit: this demo's compute is not BDH-CQ's compute; same shape of trade-off, different real mechanism.
- Add the source citation (arXiv ID + table/figure reference) visibly in the panel, not just in the README.

**Antigravity prompt shape:**
> "Create src/evidence.js containing only the BDH-CQ LOW/MEDIUM/HIGH pass@2 numbers as static, labeled data with their arXiv ID and table/figure citation — I will supply/verify the exact values, do not invent or estimate them. Render this as a visually separate Evidence panel next to (not merged with) the live chart, including the boundary statement from README §12."

**Exit Check:**
- [ ] Every number in `evidence.js` has been checked against the primary source twice, by you, not the agent.
- [ ] The panel is visually and structurally separate from the live chart — no shared axes or merged series.
- [ ] The "different mechanism, same shape" boundary statement is visible in the UI, not only in the README.
- [ ] The citation (arXiv ID + table/figure) is visible on screen, not just in source code comments.

---

## Phase 6 — Polish + Test + Submission Preparation

**Goal:** everything from README's "What to submit" list, present and correct, plus a final adversarial pass.

**Tasks:**
- **Design pass:** apply the track's design standards (one claim per screen focus, visible state, truth-beside-estimate layout, no hidden limits — state the fixed effort presets and trial counts on screen, not just in the README). Check mobile-width usability for the board, chart, and controls.
- **Recap step:** add the two short inline self-test prompts from README §8 Step 5 ("restate the claim," "what's different about BDH-CQ's effort mechanism").
- **Documentation finalization:** update README §10/§15/§19 if implementation diverged from plan; fill in `sources/SOURCES.md` with real, file-level AI-assistance and license disclosure (replace all placeholder text); fill in mentorship disclosure if applicable.
- **One-page concept summary:** draft the required 500–950 word PDF; confirm every sentence is defensible by at least one team member without notes; confirm it cites the same 3+ primary papers from README §14 beside the claims they support.
- **Adversarial QA pass:**
  - Fresh checkout / clean browser session: does `index.html` load and reach a working cold-open state with zero setup steps?
  - Have a teammate who didn't write Phase 1 explain the min-conflicts step out loud, using only the board animation and README §11 — if they can't, fix the explanation, not just the code.
  - Deliberately try to break the central claim using the actual controls (not console scripts) — confirm the Hard-difficulty ceiling behavior still holds in the finished UI.
  - Re-verify every BDH-CQ number in the Evidence panel against the primary source one final time.
  - Basic accessibility check: color contrast, keyboard-operable controls, alt text on the board/chart if applicable.
- **Deployment:** push to a static host (GitHub Pages / Netlify / Vercel), confirm the public URL loads cold in a private/incognito window with no sign-in.
- **Final packaging check against README's "What to submit" list:** public artifact URL, public source repo, blog/README as PDF if required by the portal, complete README, setup instructions, ≥3 recent primary papers cited beside claims, source/license record, AI-assistance disclosure — check every bullet against the actual submission folder, item by item.

**Antigravity prompt shape:**
> "Do not add new features in this phase. Apply the design-standards pass (mobile usability, visible state, stated limits) to the existing UI, add the Step 5 recap prompts from README §8, and finalize sources/SOURCES.md with the team's real AI-assistance and license disclosure. Then run the adversarial QA checklist from this plan's Phase 6 and report actual findings, including anything that fails."

**Exit Check:**
- [ ] Public URL works in a completely clean browser session, no sign-in.
- [ ] A teammate outside Phase 1 can explain the algorithm correctly using only the artifact + README.
- [ ] The Hard-difficulty "more effort doesn't guarantee success" behavior is reproducible through the real UI, not just in a console log.
- [ ] Every BDH-CQ number has been checked against the primary source at least twice total across the project.
- [ ] Every item in README's "What to submit" list has a corresponding, present file or link in the final package.

---

## Suggested Flow

```
Phase 1 (solver, verified) ──▶ Phase 2 (effort presets, verified numbers)
        │                                │
        ▼                                ▼
Phase 3 (board animation) ──▶ Phase 4 (controls + chart, live end-to-end)
                                          │
                                          ▼
                              Phase 5 (BDH-CQ evidence panel)
                                          │
                                          ▼
                              Phase 6 (polish, QA, submission)
```

Phases 1–2 are algorithm-and-data work and should be done with no UI open. Phase 3 can technically start as soon as Phase 1's `boardTrace` format is fixed, in parallel with Phase 2, if you have two people — but Phase 4 needs both Phase 2's verified presets and Phase 3's board component finished first.

## A Note on Using Antigravity Well

- Feed phases one at a time with their Exit Check as the acceptance bar — the judging rubric explicitly penalizes "animations passed off as real computation" and "code the team can't explain," and this plan's checks exist specifically to catch those failure modes before a judge does.
- After Phase 1 and Phase 5, ask Antigravity to explain back what it built and why, and check that explanation yourself — these are the two phases (the real algorithm, and the primary-sourced evidence) where correctness matters most and where an agent is most likely to quietly paper over a mismatch.
- If a phase's real numbers don't produce the intended pattern (Phase 2 especially), fix the puzzle instance or budget — never adjust the claim or fake the chart to fit a result you wanted going in.
