# Sources, Provenance, and Disclosures Record

This document records the academic provenance, licensing terms, and disclosures for the **Effort Dial** project.

---

## 1. Primary Academic Sources

### Inference-Time & Test-Time Scaling Literature (2022–2026)

1. **Snell, C., Lee, J., Xu, K., & Kumar, A. (2024)**
   * *Title:* Scaling LLM Test-Time Compute Optimally Can Be More Effective Than Scaling Model Parameters.
   * *Citation:* arXiv:2408.03314 [cs.LG].
   * *Contribution to Project:* Theoretical framing that allocating compute during inference yields accuracy gains competitive with pre-training scale; establishes the compute-vs-accuracy trade-off principle.

2. **Muennighoff, N., Rush, A. M., et al. (2025)**
   * *Title:* s1: Simple Test-Time Scaling.
   * *Citation:* arXiv:2501.19393 [cs.CL].
   * *Contribution to Project:* Demonstrates a controllable test-time compute knob in token generation, contrasting with latent recurrent test-time scaling.

3. **Zhang, Q., et al. (2025)**
   * *Title:* A Survey on Test-Time Scaling in Large Language Models: What, How, Where, and How Well?
   * *Citation:* arXiv:2503.24235 [cs.AI].
   * *Contribution to Project:* Taxonomy distinguishing parallel sampling (restarts / best-of-$N$) from sequential refinement (iterative search steps), both of which are scaled by this artifact's Effort Dial.

### Primary BDH & BDH-CQ Literature

4. **Engdahl, et al. (2026)**
   * *Title:* BDH-CQ: In-Context Learning with Recurrent Latent Reasoning.
   * *Citation:* arXiv:2608.09888 [cs.AI].
   * *Numerical Source Used:* Table 1 (pass@2 accuracy on ARC benchmark across inference effort levels: LOW 21.0%, MEDIUM 27.0%, HIGH 29.5%).
   * *Usage Boundary:* Used strictly as published, precomputed reference data in the Evidence Panel. Not reproduced, re-implemented, or trained here.

5. **Kosowski, A., et al. (2025)**
   * *Title:* The Dragon Hatchling: The Missing Link between the Transformer and Models of the Brain.
   * *Citation:* arXiv:2509.26507 [cs.NE].
   * *Contribution to Project:* Architectural description of the recurrent associative state acting as synaptic working memory.

### Algorithmic Reference for Live Solver

6. **Minton, S., Johnston, M. D., Philips, A. B., & Laird, P. (1992)**
   * *Title:* Minimizing Conflicts: A Heuristic Repair Method for Constraint Satisfaction and Scheduling Problems.
   * *Citation:* *Artificial Intelligence*, 58(1-3), 161–205.
   * *Contribution to Project:* Classic min-conflicts heuristic repair algorithm for Constraint Satisfaction Problems (N-Queens).

---

## 2. Software Licensing & Code Provenance

* **Project Codebase (`src/solver.js`, `src/board.js`, `src/chart.js`, `src/config.js`, `src/evidence.js`, `src/app.js`, `index.html`, `style.css`):**
  * Original implementation created for the DataForge 2026 hackathon.
  * Licensed under the **MIT License** (see [`LICENSE`](../LICENSE)).
  * Zero external runtime JavaScript frameworks or styling dependencies (pure vanilla HTML5, CSS3, ES2020).

* **PRNG Implementation (`mulberry32` in `src/solver.js`):**
  * Standard public domain 32-bit generator by Tommy Ettinger.

* **BDH-CQ Data Attribution:**
  * Benchmark figures cited under educational fair-use principles from Engdahl et al. (2026). No proprietary weights, code, or datasets are redistributed.

---

## 3. AI Assistance Disclosure

<!-- [TEAM DISCLOSURE REQUIRED: The section below must be completed with the team's specific declaration prior to final hackathon submission] -->

* **AI Coding Tools Used:** Claude / Antigravity agentic assistant.
* **Scope of Assistance:**
  * Assisted in scaffolding vanilla JavaScript module structure, SVG rendering routines, test harness scaffolding, and drafting documentation.
* **Human Verification & Team Ownership:**
  * All algorithmic logic (`src/solver.js`), conflict formulas, empirical preset calibrations (`src/config.js`), and primary reference citations (`src/evidence.js`) were verified and audited by the registered team.
  * The team can trace, explain, and defend every line of code without external assistance.

---

## 4. Mentorship & External Help Disclosure

<!-- [TEAM DISCLOSURE REQUIRED: If mentorship or external institutional support was received, declare details below] -->
* **Mentorship Received:** None / Independent student submission *(team to adjust if applicable)*.
