# E494 — Nominal "Will" versus forecast auxiliary (2026-11-02)

## Falsifiable question
Does a blanket case-insensitive /\\bwill\\b/ future-tense detector erase otherwise factual candidate claims when "Will" is a given name or "will" is a testament noun?

## Frozen comparison
Parent: E474 branch commit `2c4360f270c304e342a0d6f5ae0ef6459472414f`, engine blob `6f98d139db1e47ba998dcbbe195bd20ff7cf7279`.
Six hand-authored observed controls (four named-subject past predicates, two testament constructions) were all mislabeled as forecasts (0/6 observed candidates, 6/6 forecasts). Five modal-forecast controls and one calendar-May control were correctly classified by the parent.

E494 preserves the original claim text and introduces **only** a conservative preclassification substitution: capitalized `Will Surname` followed by a finite past-tense predicate, or a determiner + `will` followed by a form of `be/have`, is not treated as a future auxiliary. The internal substitution never alters output text.

## Measured source-exact checks
- Six observed controls: **6/6** recovered as one unverified candidate each, zero predictions.
- Five genuine future controls: **5/5** remain predictions and not factual claims.
- One calendar-May control: **1/1** remains a factual candidate, not a prediction.
- Existing `tests/engine.test.mjs` source-exact V8 harness: **224/224** assertions passed.
- E494 controls: **24/24** claim/prediction-count assertions passed.
- The committed engine and test file were fetched back by their GitHub blob SHAs and evaluated in V8. This is **not** native Node, DOM or cross-browser validation. Native CI must be checked separately.

## Claim states
- **REJECTED in frozen synthetic controls:** every occurrence of the token `will` denotes future intent.
- **SUPPORTED LOCALLY:** a bounded lexical disambiguator restores these six observed candidate claims without changing the six frozen modal/calendar controls.
- **NOT YET PROVEN:** empirical precision/recall on real social posts, person identity, pronoun/coreference resolution, verification of any extracted claim, multilingual behavior, or overall user utility.

## Known failure modes and next experiment
- Ambiguous constructions and unseen predicates can remain misclassified. The fix intentionally does not attempt unrestricted named-entity recognition.
- A first name or testament noun is not evidence that the sentence is true.
- Freeze a legitimately licensed, independently annotated corpus containing proper names, legal nouns, modal futures, quotes and direct statements. Compare no-disambiguation, bounded lexical and stronger NLP baselines on source-held-out examples; report false factual promotions as well as missed claims.
- Keep all candidate claims unverified and avoid assigning author identity from text alone.

No main merge, deployment, account access, private scraping, spending or outreach.
