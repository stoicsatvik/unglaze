# E417 | Calendar May versus modal may in local claim extraction

Date: 2026-10-30. Scope: local-first browser heuristic, **not** independent truth verification.

## Falsifiable defect
The frozen E401 engine removes `May` from forecast classification only when accompanied by a four-digit year. It therefore misclassifies dated retrospective reports without a year, including `In May, revenue reached $1.2M.`, `May sales rose 20%.`, and `On May 5, the company shipped 200 units.`, as predictions, omitting their self-reported factual claim candidates.

The same token `may` is legitimately modal in `Sales may rise 20% next year.` and must remain a prediction. Treating every `may` as a month would create the opposite error.

## Correction
Remove only explicitly calendar-shaped `May` tokens from the *prediction detector's temporary text*: preposition + month, month + day, dated month/year, and capitalized month + metric noun when the sentence contains a past-tense reporting verb. Preserve other modal `may` tokens, especially when both a calendar reference and forecast appear in one sentence. Original source text, numeric extraction and self-reported/unverified claim labels are unchanged.

## Test evidence
- Frozen 15-case synthetic suite: 8 calendar/retrospective controls and 7 modal/mixed controls.
- Executed the exact GitHub-fetched E417 engine blob `e1224f6dc9a46095525b7726916bbe2d02de0d5b` in an isolated V8 runtime, parsed the exact committed fixture file blob `34afd2a741139587aa983bbe121e594569dc6678`, and checked factualClaims, predictions, claims, verification status and absence of fabricated evidence: **15/15 passed**.
- Before the correction, yearless calendar examples were classified as predictions. Existing `May 2025` and modal controls retained their expected classifications after the correction.
- **Not run:** Node 22 `node --test`, the full repository suite, external LIAR/ClaimBuster audits, GitHub Actions, or a real social-feed cohort. GitHub Actions included minutes were reported exhausted (2,000/2,000) on 29 October; commits use `[skip ci]` to avoid requesting paid runner capacity. Do not claim CI success.

## Interpretation and limitations
**SUPPORTED IN ISOLATED SOFTWARE FIXTURES:** this particular month/modal classification correction. **NOT YET PROVEN:** recall/precision on independent social-feed texts, contextual temporal understanding, fact checking, verified source evidence or user benefit. The rule remains a heuristic: other months, non-English dates, grammatical ambiguity and mixed retrospective/future clauses may still be misclassified. A sentence containing both a past report and a future modal is conservatively assigned to predictions, rather than splitting the claims.

The E399 external LIAR result (502/1,283 heuristic detections versus digit-only 509/1,283) and E401 numerical stability findings are unchanged.

## Highest-EV next step
Freeze a small independently annotated, permissioned corpus with *both* factual and nonfactual social-feed items; compare precision/recall by temporal subtype against a digit-only baseline, with held-out sources and time periods. Do not optimize on the test cohort or silently promote linked URLs to evidence.

No main merge, deployment, outreach, spending, private-feed scraping or external commitments.
