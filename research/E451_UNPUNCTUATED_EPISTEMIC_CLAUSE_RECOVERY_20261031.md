# E451 | Unpunctuated epistemic-clause recall falsification (2026-10-31)

## Discriminating question

Does E435's conservative clause separation still discard observed claims when a separate modal forecast/opinion follows without a comma or semicolon?

## Pinned baseline and deterministic test

Base branch: `research/e435-mixed-epistemic-clause-recovery-20261031`, commit `9575800649f474446ffe1442dea8d2f6cdcfa9bb`, engine Git blob `3955161169446b219ccda8a12af878b6d4f8221a`.

The complete base engine source was executed in an isolated JavaScript V8 runtime. Fifteen explicitly designed regression examples included seven observed-then-modal assertions, a pure two-forecast case, two independent observed claims, and existing semicolon, calendar-May, forecast and coordination controls. Baseline exact expected (factual-candidate count, prediction-clause count) outcomes: **6/15**. Nine cases differed, including seven historical claims suppressed to zero by a later forecast.

## Narrow change

Only extend the existing `splitClaimClauses` with an additional split for unpunctuated coordinating/contrastive conjunctions followed by an explicit modal or opinion marker, with a limited optional subject. Do not infer truth, change source links into evidence, invent confidence, or alter external data access.

The same 15 predeclared cases on the modified complete engine source yielded **15/15** exact expected count pairs. The result is a **source-level synthetic regression**, not external precision/recall or generalization.

Committed regression coverage includes E451's 15 examples, missing-context isolation and nonverification invariants. Two historical E417 and E435 expectations were updated because their deliberately conservative false-negative cases are superseded. Four source-equivalent test bodies (`engine.test.mjs`, E417, E435, E451) executed successfully under a minimal assertion shim in isolated V8. The complete Node test runner, all npm tests and GitHub Actions were **not run**. Committed engine and regression test blobs were independently fetched from the new branch before executing those bodies.

## Claim state and limitations

- **REJECTED**: E435 correctly preserves independent historical claims in the tested unpunctuated modal-continuation families.
- **SUPPORTED IN EXACT-SOURCE LOCAL SYNTHETIC TESTS**: E451 recovers nine previously mismatched fixture outcomes without changing the six already matching outcomes.
- **NOT YET PROVEN**: improvement in independently annotated real social-feed precision, recall, calibration, multilingual behavior or user utility.
- The splitter is a bounded heuristic, not a parser. It can misinterpret ambiguous conjunctions, quoted statements, names such as 'Will', and indirect attribution. A factual candidate remains self-reported and unverified.

## Highest-value next experiment

Freeze a legally reusable, independently annotated factual-assertion/nonassertion social-feed corpus with negatives. Compare E435, E451, digit-only, always-positive and conservative sentence-only baselines under the same source text. Report paired false positives, recall, precision, attribution/quotation errors and a held-out domain split. Reject E451 if precision loss outweighs recovered observations.

No public deployment, user data collection, autonomous browser action, main merge, spending or outreach occurred.
