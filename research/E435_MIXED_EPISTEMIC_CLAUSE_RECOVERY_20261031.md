# E435 | Mixed-epistemic clause suppression in Unglaze

**Date:** 2026-10-31. **Scope:** local-first deterministic claim candidate classification, not external fact verification.

## Question and negative control

The E417 source classified whole grammatical sentences with `isOpinion` / `isPrediction` before extracting factual candidates. Yet the existing `splitClaimClauses` was only applied to missing-context analysis. This caused a prediction or opinion in one independent contrastive/semicolon clause to erase an observed self-reported claim in another.

Executed the **exact pre-change engine source** in an isolated JavaScript runtime. Four predeclared mixed-clause examples each returned **zero factual candidates** despite an explicit quantitative assertion in the first clause:
- "Revenue grew 40% last year, but I think costs will rise."
- "We shipped 300 units, while we might ship 500 next month."
- "We reached 1,000 users; I believe we will reach 2,000."
- "Revenue grew 40% from $10M to $14M, but costs may fall."

This is a source-level classifier false-negative, **not** a measurement of accuracy on independent social posts.

## Correction and exact-source validation

Apply the existing conservative clause splitter before opinion, prediction, factual-candidate and structured-claim classification. Preserve sentence-level summary and whole-post numeric extraction. Do not infer factual truth or evidence from the presence of links.

Executed the modified complete engine source in an isolated JavaScript runtime on **10 fixed examples: 10/10 passed**, including the four formerly suppressed factual clauses, existing May/modal distinctions, single forecast controls, a non-claim "sales and marketing" coordination, and two semicolon-separated facts. Every emitted candidate retained `self_reported` / `not_checked`, no confidence, and no fabricated evidence links.

Three repository regression tests were committed, including a percentage-baseline isolation assertion, but **the exact committed test file, full npm suite and exact-head GitHub Actions were not run** in this pass. Local execution used the same transformed source text passed to the GitHub update operation; the committed blob must be read back for provenance.

## Limitations and next falsification

This fix handles only clause boundaries already recognized by `splitClaimClauses`. Unpunctuated mixed clauses such as "We reached 12,000 users in May and may double next year" remain conservatively classified as a forecast, dropping the historical candidate. That false negative is preserved in a regression test rather than silently broadened with a risky language heuristic.

No external corpus precision/recall, human annotation, cross-platform field validation, or truth verification is established. Next: frozen independently annotated mixed-claim text set, paired recall/false-positive analysis against the unchanged E417 classifier, including unpunctuated coordination and quotation/attribution controls. Do not confuse self-report extraction with verification.

**Claim state:** mixed-clause suppression in the original engine REJECTED as correct behavior; narrow correction SUPPORTED by ten exact-source local cases; external generalization NOT YET PROVEN.

No public deployment, user data, network scraping, main merge, spending or autonomous outreach.
