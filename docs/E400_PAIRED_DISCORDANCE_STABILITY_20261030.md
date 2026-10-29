# E400 — Paired-binomial numerical underflow correction (2026-10-30)

## Falsifiable defect
The E399 LIAR recall audit exported `exactPairedSignP(aOnly, bOnly)` for the exact conditional two-sided paired-discordance (McNemar/sign) test. The original implementation initialized the binomial tail with `Math.pow(0.5, n)`. For n >= 1075 discordant pairs this underflows to zero in binary64. For a hypothetical 1,283-row cohort with 640/643 discordances it returned p=0, falsely suggesting extreme significance, while an independent BigInt binomial-coefficient oracle yields p=0.9554750965493962. For 600/683 it also returned zero versus exact p=0.022025959905542. These are **synthetic count fixtures**, not new observations or claims about any politician.

## Correction
Compute log P(X=k) for k=min(aOnly,bOnly), then sum smaller binomial tail terms by stable backward ratios, avoiding an underflowed starting term. Validate that both counts and their sum are nonnegative safe integers. The test remains the *exact conditional binomial test*, evaluated to floating-point precision; values smaller than binary64 can still underflow, and this is not an arbitrary-precision p-value implementation.

## Validation and claim boundary
- Pre-fix large-cohort zero result reproduced in an isolated Node 22 harness.
- Post-fix isolated Node 22 harness: **3/3 tests passed**, comparing five synthetic count pairs against a separate BigInt integer-binomial oracle, including the E399 33/40 result and invalid-input rejection.
- New repository tests in `tests/e399_liar_recall_audit.test.mjs` use a separate BigInt oracle. The complete repository test suite, exact-head CI, and source-pinned external TSV CLI were **not run** on E400. Existing GitHub Actions usage warning reported 90% of included minutes.
- Original E399 measured paired counts **33/40** and p≈**0.482788556844021** are unchanged. Original 502/1,283 vs 509/1,283 claim-candidate recall remains negative for superiority over digit-only. No new LIAR observations or inference about truthfulness.
- No engine detection logic, real-feed data, deployment, outreach or merges changed.

## Next test
Run the full Node test suite and pinned CLI on a machine with authorized access to the source TSV; then acquire an independently labelled factual-assertion versus nonassertion holdout with genuine negatives before making precision or real-feed claims.
