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


## E399 — independent LIAR claim-candidate recall (30 October 2026)

**External empirical negative result:** On the pinned LIAR/PolitiFact test cohort (1,283 unique fact-checked short statements), frozen E374 Unglaze recognized 502 (39.13%, Wilson 95% 36.49–41.83%), while digit-only recognized 509 (39.67%, 37.03–42.38%). Paired both=469, Unglaze-only=33, digit-only=40, neither=741; exact two-sided paired-discordance p=0.4827885568. The seven-hit difference does not support superiority over digit-only. All-positive recall=100% by construction; precision is undefined because no nonclaim negatives exist.

**Provenance:** tfs4/liar_dataset test.tsv, source commit b6f55d759d525f7150637fcdbc2c517d049408b7, Git blob a53fa254e1aab00e9c4d2442248bd43ff103ad90. Frozen engine Git blob 383233ee0d3b51427a9f965283f7ea01dacd7bfc. Research-only source, no original statements committed. The CLI verifies the frozen engine Git blob before scoring. Direct source+engine evaluated in isolated JavaScript runtime; five synthetic audit tests passed locally on Node 22. Full local CLI on external TSV and GitHub Actions CI NOT RUN; no false claim of exact-head CI.

**Claim:** Independent fact-check-selected claim-candidate recall MEASURED; superiority over digit-only NOT SUPPORTED; factual-assertion precision/recall on independently annotated real social feeds, truth verification and user benefit NOT YET PROVEN. LIAR truthfulness labels are NOT factual-claim-presence labels. E335 negative check-worthiness result remains unchanged.

**Branch:** research/e399-independent-liar-recall-20261030, stacked on E374 draft PR #17. No main merge, public deployment, external API payment or private data.

**Next:** Obtain independently annotated social-feed factual/nonfactual text with negative examples and domain/time holdouts. Freeze baseline comparison, measure precision/recall and inspect errors without tuning on the test cohort.

### E400 | 2026-10-30 | Paired-discordance tail underflow
- **Reproduced negative integrity finding:** E399's exact conditional sign/McNemar tail implementation initialized at `2^-n`, underflowing to zero on 1,283 discordances. Synthetic 640/643 returned p=0 before correction, whereas an independent BigInt binomial oracle gives p≈0.955475096549396.
- **Correction:** Log-space binomial probability at the observed smaller discordance count, followed by backward ratio summation; invalid counts fail closed. Isolated Node 22 reproduction/validation: 3/3 tests passed. Repository regressions added; full suite/CI not run.
- **Original E399 unchanged:** 33 vs 40 discordances still yield p≈0.482788556844; 502/1283 vs 509/1283 claim-candidate recall does not support superiority over digit-only. Synthetic count fixtures are not new real-world observations.
- **Evidence:** `docs/E400_PAIRED_DISCORDANCE_STABILITY_20261030.md`, `research/e399_liar_recall_audit.mjs`, `tests/e399_liar_recall_audit.test.mjs`. Stacked draft, no merge or outreach.

### E401 | 2026-10-30 | Compensated paired-tail numerical accuracy
- **Synthetic negative:** E400's one-million-discordance 499020/500980 p-value differed from independent SciPy 1.17.0 reference by ~3.47e-10 due to cancellation during log-binomial accumulation. No observed significance reversal.
- **Correction:** compensated log and tail accumulation; isolated Node 22 mirror 5/5 checks passed, corrected error ~8.5e-13. Repository million-pair regression added. **Full repo tests, exact-head CI and pinned external TSV remain unverified**; commits `[skip ci]`.
- **E399 negative unchanged:** 502/1283 vs digit-only 509/1283; 33/40 paired p≈0.482788556844. No factual-claim precision, real-feed improvement or new data proven.
- **Evidence:** `docs/E401_COMPENSATED_PAIRED_TAIL_20261030.md`; stacked draft on E400 PR #19. No merge, deployment or outreach. Next: prospective synthetic numerical sweep and complete Node validation.

- **E401 follow-up cross-scale check (2026-10-30):** 12 frozen independent SciPy 1.17.0 references evaluated against the exact GitHub function body, 12/12 within tolerance (maximum absolute error 8.35e-13); 41-case Node mirror maximum error 8.47e-13. New repository regression's cross-scale test executed in an isolated V8 shim (1/1 pass; eight other tests skipped). Commits a9d6059 (test) and 5e2ecca (audit). **Full Node suite, pinned TSV and exact-head CI still unexecuted**; no new numerical failure found, no merge/outreach. See docs/E401_COMPENSATED_PAIRED_TAIL_20261030.md and draft PR #20.


## E417 — calendar May / modal may falsification (2026-10-30)

- Branch: `research/e417-calendar-may-modal-falsification-20261030`, stacked on E401 draft PR #20.
- Original E401 engine interpreted yearless retrospective `In May, revenue reached $1.2M.` and `May sales rose 20%.` as modal predictions, suppressing self-reported factual claim candidates. A blanket month replacement would instead suppress legitimate `may` forecasts.
- Correction: recognize prepositional calendar May, month/day and capitalized May + past-tense metric reports while retaining distinct modal uses. No verification or confidence invented.
- Exact fetched source + committed fixture evaluated in isolated V8: **15/15 deterministic cases passed**, with unchanged self-reported/not-checked labels and empty evidenceLinks. Node runner, full repository suite, external corpus and GitHub Actions **NOT RUN**; included Actions minutes were reported exhausted, so no paid CI is authorized.
- Claim: specific heuristic correction SUPPORTED IN ISOLATED SYNTHETIC FIXTURES; independent factual-claim precision/recall, temporal-language generalization, truth verification and user benefit NOT YET PROVEN.
- Next: independent, permitted social-feed positive/negative corpus, held-out temporal subtypes and digit-only comparison; retain E399's negative result. See `research/E417_CALENDAR_MAY_MODAL_FALSIFICATION_20261030.md`.
