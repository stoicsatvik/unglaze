# E253 | Percentage-baseline arithmetic and metric-scope falsification

**Date:** 2026-10-25. Local heuristic only. Not external fact verification.

## Failure

E237 stopped *other sentences* from supplying context, but a misleading `from X to Y` in the *same sentence* still passed the percentage-baseline check.

- `Revenue grew 40% from 2 to 4 offices last year.` previously passed its baseline gate, even though the stated numbers describe offices rather than revenue.
- `Revenue grew 40% from $10M to $11M last year.` also passed, although the displayed values imply 10%, not 40%.
- A customer-growth claim could similarly borrow employee/office counts.

## Bounded correction

The heuristic now requires an explicit numeric from/to pair with compatible currency and magnitude units, a positive finite starting amount, and metric-compatible context. For a revenue percentage, it requires a currency marker or explicit scale (million/billion/crore/lakh/M/B). Office/employee counts cannot establish a revenue, user or customer baseline.

When a numeric pair is available, its computed change is compared against the displayed percentage, with a 0.75 percentage-point tolerance for rounding. Decline verbs are interpreted with negative direction. Mismatches receive a **new warning**: `Percentage change conflicts with the stated from/to values.`

This is an internal consistency check. It cannot establish whether any reported figure is true.

## Deterministic evidence

The new tests cover 11 cases: correct/inconsistent revenue growth, unrelated offices, correct/inconsistent user growth, correct/inconsistent revenue decline, zero-denominator growth, user claims with office/employee baselines, and compatible scaled amounts without currency.

- Test-only commit `8850a885820cf5338fff64ebc3ffd1ab2cdbbde4` deliberately failed [CI 40176825012](https://github.com/stoicsatvik/unglaze/actions/runs/40176825012).
- First correction `01f05aaef3462515e3a2655938132b44d6052257` passed [CI 40176854198](https://github.com/stoicsatvik/unglaze/actions/runs/40176854198).
- Additional metric-scope controls were then added and corrected on the same isolated branch; final-head CI must be checked separately.

## Limitations

- One from/to pair per sentence; no complete parsing of multi-metric narratives or anaphora.
- No guarantee of understanding the claim's true referent.
- Currency/magnitude heuristics are intentionally conservative and can produce false missing-baseline warnings.
- The 0.75-point rounding tolerance is a policy choice, not a calibrated empirical error model.
- No source retrieval, feed scraping, truth checking or cross-post identity inference.

**Claim:** demonstrated arithmetic/context suppression defects corrected in deterministic software fixtures, pending final-head CI. Real-feed precision/recall **NOT YET MEASURED**.

**Next:** evaluate a permissioned corpus of genuine feed excerpts, including ambiguous multi-metric statements, coreference, localized units and intentional misdirection. Preserve false positives and avoid silently upgrading self-reported claims to verified facts.
