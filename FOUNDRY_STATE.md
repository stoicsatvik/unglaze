# Unglaze — Unified Foundry State

## Mission and claim boundary

Local-first, heuristic social-feed claim extraction. The extension identifies possible claims and missing context; it does not verify facts, source reliability or truth. Any hard-coded numeric heuristic confidence is **NOT calibrated** and must not be presented as an empirical probability.

## E218 baseline (inherited draft PR #9)

A forecast containing numeric details could previously appear as a factual observation. Forecasts are now excluded from factualClaims/claims; explicit dated May references are not interpreted as modal predictions. Exact-head CI 40090190436 passed. Heuristic temporal classification is **SUPPORTED IN SOFTWARE FIXTURES**, not validated NLP accuracy.

## E237 — sentence-local missing-context evidence

**Falsified invariant:** Unrelated sentences could erase missing-context warnings. A sentence claiming `Revenue grew 40%.` was treated as having a percentage baseline because another sentence said `from 2 to 4 offices`. Other controls showed that a separate paying-customer metric, a separate dollar-denominated revenue figure, or a separate seed grant could suppress warnings on an unqualified claim.

**Correction:** Apply the existing five missing-context rules independently to each sentence, then deduplicate warnings for the post. This deliberately avoids treating unrelated statements as evidence for a claim. Same-sentence controls for explicit from/to baseline and monthly active user qualifiers remain valid.

**Evidence:** Test-only commit `d391d5205f0d9baa45b47323d0daec323ee0c644` failed CI 40138649942 as expected. An intermediate regex-escaping mistake at `ce3812bf845980eb186942fd1a6e9f5f6312c3da` also failed CI 40138668804 and was corrected. Implementation commit `9ed94f23fcef59bdfc2eaef1e11e2e45c5b23763` passed exact-head CI 40138681337 (`npm test`, including the new adversarial controls).

**Claim:** Cross-sentence evidence leakage corrected **SUPPORTED IN DETERMINISTIC FIXTURES**. The rules are heuristic, not a verified factual inference model. Cross-sentence evidence may sometimes be genuinely relevant; this conservative behavior can increase false warnings.

**Next:** Test quoted text, anaphora, adjacent sentences explicitly referring to the same metric, locale-specific numeric formats, and user-observed feed excerpts with permission. Do not scrape private feeds or introduce external requests by default.

**Branch:** `foundry/e237-context-isolation-20261025`; draft PR #10 stacked on #9. No main merge, external network access, user tracking, or deployment.


## E351 — coordinated-metric evidence isolation (28 October 2026)

**Falsification:** In a sentence without a comma, `Revenue grew 40% from $10M to $14M and costs fell 70% from $10M to $9M last year`, the earlier clause splitter treated both metrics as one claim. The first from/to and 40% values hid the second arithmetic contradiction. This is a concrete local consistency false negative, not a factual-verification result.

**Change:** Split an unpunctuated `and` only when it introduces an explicit new metric noun (revenue, costs, users, customers, profits, sales, expenses, funding, headcount) followed by a change verb. Existing punctuation splitting remains. Controls cover inconsistent second metric, consistent second metric, second percentage without baseline, and ordinary nonmetric coordination.

**Evidence:** Test-first commit `1eae3e1ec3744c0ee7a933f5185bef06ce271b74` produced a failing CI run [40627356238](https://github.com/stoicsatvik/unglaze/actions/runs/40627356238). Implementation commit `c4a0587893f8bcbac80917ff76739c53dd3f4259` passed [exact-head CI 40627379078](https://github.com/stoicsatvik/unglaze/actions/runs/40627379078) (npm test). Branch `foundry/e351-coordinated-metric-isolation-20261028`, draft PR #16 stacked on E335 #15.

**Claim:** Second-metric arithmetic and missing-baseline detection **SUPPORTED IN DETERMINISTIC FIXTURES**. General coordinated-language parsing, external truth verification, and real social-feed precision/recall remain **NOT YET PROVEN**. E335 independent ClaimBuster test remains a negative generalization result, unchanged by this fix.

**Next:** Freeze the heuristic, obtain an independently annotated social-feed corpus, and compare claim-level precision/recall against simpler baselines before any product claim or deployment.
