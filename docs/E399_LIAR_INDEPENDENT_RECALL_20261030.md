# E399 — Independent LIAR claim-candidate recall audit (2026-10-30)

## Question

Does the unchanged Unglaze claims predicate recover independently collected, professionally fact-checked statements more often than a trivial digit-only rule? This measures recall among selected fact-checked statements, not factual truth, social-feed precision, misinformation detection, or political correctness.

This is independent of E335's ClaimBuster source and does not tune the engine. Frozen E374 engine Git blob: 383233ee0d3b51427a9f965283f7ea01dacd7bfc.

## Source and limitations

- William Yang Wang, *Liar, Liar Pants on Fire: A New Benchmark Dataset for Fake News Detection*, ACL 2017 (LIAR/PolitiFact).
- Read-only public mirror: tfs4/liar_dataset, commit b6f55d759d525f7150637fcdbc2c517d049408b7, test.tsv, Git blob SHA-1 a53fa254e1aab00e9c4d2442248bd43ff103ad90.
- 1,283 unique source IDs, 14 TSV columns per row, six truthfulness labels. Upstream permits research use only and retains original source copyright. No source statements are committed.
- The six labels measure **truthfulness assessments**, NOT whether a statement contains a factual claim. Every row was selected for fact checking, so there is no valid nonclaim negative class. **Precision, F1, specificity and truth-verification accuracy cannot be computed** for this task.

## Frozen protocol

Score each test statement as one input post. Compare frozen Unglaze claims predicate, digit-only and always-positive. Do not use speaker/political metadata, tune thresholds, retrieve additional examples, call a model, or infer truth. Report recall, Wilson 95% intervals, paired disagreements and exact two-sided conditional sign/McNemar p. Intervals do not correct dataset selection bias.

## Executed independent-source result

The pinned source text was read directly through the GitHub connector and evaluated against the frozen engine source in an isolated JavaScript runtime. The separate committed CLI and four synthetic unit tests were checked locally under Node 22; the CLI was **not run end-to-end on the full source TSV inside the local container**, where outbound access was unavailable. No GitHub Actions run was requested due to a previously reported free-minutes budget warning.

| Frozen rule | Hits / 1,283 | Recall | Wilson 95% |
|---|---:|---:|---:|
| Unglaze claims | **502** | **39.13%** | 36.49%–41.83% |
| Digit-only | **509** | **39.67%** | 37.03%–42.38% |
| Always-positive | 1,283 | 100% | uninformative |

Paired counts: both **469**, Unglaze-only **33**, digit-only **40**, neither **741**. Exact two-sided discordant-pair p = **0.4827885568**. The seven-hit difference does not support superiority over digit-only. Unglaze missed **781/1,283** independently fact-checked statements; digit-only missed 774. Always-positive recall is 100% by construction and says nothing about false positives.

## Claim states

- **MEASURED / SUPPORTED:** 502/1,283 candidate recall on this independent, older PolitiFact test cohort.
- **NOT SUPPORTED:** improved recall over digit-only on this cohort.
- **NOT YET PROVEN:** factual-assertion precision/recall on real social feeds, truth verification, calibration, user benefit, multilingual transfer or political-content generalization.
- E335 tested check-worthiness on a balanced debate corpus. E399 tests recall only on a preselected fact-checking cohort. Neither supplies independently annotated factual/nonfactual social-feed examples. Do not repurpose veracity labels as claim-presence labels.

This is a negative generalization result, not a recommendation to classify any person or party. No model tuning, scraping, paid API, private user data or deployment.

## Reproduce

1. Read the exact source at https://raw.githubusercontent.com/tfs4/liar_dataset/b6f55d759d525f7150637fcdbc2c517d049408b7/test.tsv to a temporary local file.
2. Run node --test tests/e399_liar_recall_audit.test.mjs.
3. Run node research/e399_liar_recall_audit.mjs /tmp/e399-liar-test.tsv /tmp/e399-liar-receipt.json.

The CLI fails closed on source Git blob mismatch, row count, malformed TSV width, duplicate IDs, invalid labels and empty statements. The JSON receipt contains aggregate counts only, no source statements.

## Next decisive experiment

Obtain a legally reusable, independently annotated **social-feed factual-assertion versus nonassertion** corpus with actual negative examples and a time/domain holdout. Freeze this heuristic and trivial baselines, report precision, recall and failure categories, and do not tune on the held-out set.
