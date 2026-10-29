# E401 | Large-cohort binomial-tail cancellation drift (2026-10-30)

## Falsifiable numerical-integrity finding

E400 corrected gross underflow, but ordinary floating-point accumulation of the log-binomial coefficient still loses low-order bits when it nearly cancels `-n*ln(2)`. On a **synthetic** one-million-discordance split (499,020 versus 500,980), E400 produced `0.0501127328795081` while an independent SciPy 1.17.0 `scipy.stats.binomtest(499020, 1000000, 0.5).pvalue` gave `0.05011273253278045`. Absolute error was approximately `3.47e-10`, exceeding a predeclared `1e-11` regression tolerance. This is numerical drift, **not** a demonstrated change in statistical significance or a new real-world dataset.

## Minimal correction

Use compensated (Kahan-style) summation for the log-binomial coefficient and the backward relative tail terms. Keep the same exact conditional two-sided binomial test, input validation, and original LIAR analysis. No detection-engine changes or changes to the frozen 502/1,283 vs 509/1,283 negative comparison.

## Validation and limits

- An isolated Node 22 mirror of the old and corrected functions reproduced the pre-fix deviation. Corrected output: `0.05011273253362764` (absolute error ~`8.5e-13` against SciPy).
- Isolated Node 22 mirror: **5/5** checks passed (four numerical fixtures plus an expected-red pre-fix assertion). These were **not** execution of the repository's exact test file.
- Added a repository regression for the million-pair reference, symmetry, and unchanged original 33/40 result. The full repository Node suite, pinned external TSV audit, and exact-head GitHub Actions **have not been run**. Branch commits deliberately use `[skip ci]` due to prior 90% Actions usage warning. Do not merge without validation.
- Numerical accuracy is still limited by binary64 and the O(k) algorithm. For sufficiently tiny p-values, floating-point underflow remains possible; this is not arbitrary precision.
- The million-pair case is an **artificial arithmetic stress test**, not one million observed political claims.

## Next gate

Run the complete Node suite, then assess a pre-frozen sweep of synthetic counts across n and imbalance against independent high-precision references, including timing and any near-decision-threshold differences. Preserve all negative results.


## Incremental independent cross-scale audit (same date)

After the initial E401 report, a frozen 12-fixture sweep was executed against the **actual function body fetched from the E401 GitHub branch**, extracted into isolated JavaScript execution with an assertion shim. Its blob was cced96986cb03de0cd9ba193f9156eca58c4bb47. Reference p-values were calculated independently with SciPy 1.17.0 scipy.stats.binomtest (two-sided, p=0.5). The fixtures span n=0, 73, 1,283, 10,000, 100,000 and 1,000,000, with balanced, near-threshold and strongly imbalanced cases.

- **12/12** matched the frozen references within the preselected 1e-11 absolute tolerance (or 1e-12 relative for the tiny n=73 tail). Largest absolute error in the isolated source execution: **8.35e-13**, on 499,020/500,980.
- A separate local Node 22 mirror swept **41 synthetic cases** with maximum absolute error **8.47e-13**. The small difference between JS runtimes (~1e-14 on the million-pair fixture) is below the regression tolerance and is not a new correctness failure.
- Added a 12-case, orientation-symmetry repository regression to tests/e399_liar_recall_audit.test.mjs. **That repository test file has not been executed as a whole**, and neither full CI nor the pinned TSV evaluation was run. This audit does not certify all input ranges, runtime performance, or real-world detector quality.
- **Negative result:** no additional numerical counterexample violating the chosen tolerance was found in these selected fixtures. This is not proof of global accuracy. No changes were made to the claim-detection engine, LIAR result, or statistical decision threshold.

Next: execute exact repository tests and evaluate larger pre-frozen count grids with independent arbitrary-precision references and runtime measurements before integration.
