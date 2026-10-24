# E218: Numeric forecast / observation classification falsification

Date: 2026-10-24. Scope: local, deterministic text heuristics only.

## Counterexample (pre-fix)

The string `Revenue will reach $10M next year.` was simultaneously emitted as a `prediction` and a `factualClaim`; the claim record inherited the same 0.72 heuristic confidence used for historical observations. `In May 2025 we reached 20,000 users.` was also labelled a prediction because the regex treated the month as the modal verb.

The test-only commit `275c4cf71e734670715480546a02982bb7e7c9ff` reproduced this failure in official Actions run 40090142070. This is a classification/epistemic defect, not evidence that any claim is true or false.

## Correction and controls

Forecast sentences are excluded from `factualClaims` and generic `claims`, while remaining visible in `predictions`. Calendar uses of May with explicit year are stripped before modal detection. Seven deterministic controls cover will/may/might/expect forecasts, past observations, month dates, and mixed historical/future sentences.

This branch intentionally stacks on the earlier sentence-integrity PR #7, which prevents decimal amounts and URLs being split mid-token. It does not include the separate DOM-recycling PR #8.

## Claim state and limitations

**SUPPORTED IN SOFTWARE TESTS** after successful exact-head CI; not a measured natural-language classifier accuracy improvement. The rules remain heuristic: quoted forecasts, negation, conditional statements, undated May, and semantic temporal references may still be misclassified. No linked source is verified and no personal data is sent off-device.

Next high-value experiment: independently labelled, consent-safe public text corpus with time/tense categories and precision/recall against a trivial keyword baseline, then analyze errors before changing heuristics.
