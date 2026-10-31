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

## Independent public holdout: LIAR test cohort

The public `tfs4/liar_dataset` `test.tsv` at immutable upstream commit `b6f55d759d525f7150637fcdbc2c517d049408b7` was read directly through the GitHub connector (1,283 rows, 14 columns, 1,283 unique source IDs). The previously documented source Git blob is `a53fa254e1aab00e9c4d2442248bd43ff103ad90`; this run did not independently recompute that blob hash. Statements were read from column 3; political metadata and veracity labels were not used as predictors. This is the same previously used E399 cohort, **not a newly acquired independent population**, but is independent of the synthetic E451 fixtures.

Both complete exact-source engines were executed in the same isolated JavaScript runtime without threshold tuning:

| Candidate rule | Hits / 1,283 | Recall on selected cohort |
|---|---:|---:|
| E435 base | 506 | 39.44% |
| E451 modified | 507 | 39.52% |
| Digit-only | 509 | 39.67% |

Paired E435/E451: 506 both, **1 E451-only**, 0 E435-only, 776 neither. Exact two-sided discordant-pair p = **1.0**. E451 versus digit-only: 473 both, 34 E451-only, 36 digit-only-only, 740 neither; exact p = **0.9049745265**. E451 Wilson 95% recall interval on this selected cohort: **36.88%–42.22%** (not adjusted for sampling/selection bias). All 1,283 outputs retained unverified/self-reported claim semantics; zero invented verification/confidence violations.

**Decisive negative-transfer interpretation:** The nine synthetic regression recoveries translate into **only one additional candidate** on this existing public fact-checked cohort. There is no measured advantage over digit-only, and this corpus has no nonclaim negatives, so precision, specificity and real-feed utility remain NOT YET PROVEN. Do not treat LIAR truthfulness labels as factual-assertion presence labels. The aggregate-only receipt is `research/results/e451_liar_holdout_20261031.json`. The E399 historical 502-hit result used an older frozen engine, so it is not the paired E435 baseline.

## Claim state and limitations

- **REJECTED**: E435 correctly preserves independent historical claims in the tested unpunctuated modal-continuation families.
- **SUPPORTED IN EXACT-SOURCE LOCAL SYNTHETIC TESTS**: E451 recovers nine previously mismatched fixture outcomes without changing the six already matching outcomes.
- **NOT YET PROVEN**: improvement in independently annotated real social-feed precision, recall, calibration, multilingual behavior or user utility.
- The splitter is a bounded heuristic, not a parser. It can misinterpret ambiguous conjunctions, quoted statements, names such as 'Will', and indirect attribution. A factual candidate remains self-reported and unverified.

## Highest-value next experiment

Freeze a legally reusable, independently annotated factual-assertion/nonassertion social-feed corpus with negatives. Compare E435, E451, digit-only, always-positive and conservative sentence-only baselines under the same source text. Report paired false positives, recall, precision, attribution/quotation errors and a held-out domain split. Reject E451 if precision loss outweighs recovered observations.

No public deployment, user data collection, autonomous browser action, main merge, spending or outreach occurred.
