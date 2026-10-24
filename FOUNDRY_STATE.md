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
