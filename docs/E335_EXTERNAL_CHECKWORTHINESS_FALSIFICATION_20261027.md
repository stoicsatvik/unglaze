# E335 | Independent check-worthiness falsification of Unglaze v0.1

Date: 2026-10-27. Claim state: **EXTERNAL-DOMAIN MEASURED; social-feed claim detection NOT YET PROVEN**.

## Discriminating question

Does the current frozen, keyword-based Unglaze `analyze().claims` candidate detector recover externally annotated check-worthy statements, or does a simpler digit-only rule perform at least as well?

This is **not** a fact-checking or factual-truth test. Check-worthiness is a related but different task: a check-worthy assertion may be omitted by a conservative factual-claim heuristic, while a factual sentence may not be worth checking. The results cannot be interpreted as Unglaze factual-claim precision/recall in deployment.

## Independent source and provenance

- Source: University of Texas at Arlington IDIR Lab, `utaresearch/claimbuster-spotter`, `data/two_class/test.json`.
- Pinned upstream commit: `332bba0819d79f8e42d0a70277597dfe97036873`.
- Pinned Git blob SHA-1: `ea50469f1304a9f9591e72cdd49a16a1315fb920`.
- 702 labeled debate statements: 351 positive (`label=1`), 351 negative (`label=0`).
- Upstream repository license: GPL-3.0. No original statement text is copied into this repository or its receipt.
- Background: Arslan et al., *A Benchmark Dataset of Check-worthy Factual Claims*, ICWSM 2020, DOI 10.1609/icwsm.v14i1.7346. This evaluation uses the upstream binary split rather than the full three-class ClaimBuster archive.
- The frozen source and engine were already publicly available before evaluation. No model selection, tuning, training, API call, or new user data.

## Frozen methods

Each sentence is evaluated independently as one post. Predict positive if `UnglazeCore.analyze({text}).claims.length > 0`. Compare with `/\\d/` (digit-only) and an always-positive classifier. No preprocessing beyond the existing engine. A fingerprint mismatch, changed row count/class balance, repeated sentence ID, invalid label, or empty text fails closed.

The benchmark is intentionally class-balanced. Thus reported precision is **not** real-world precision at social-feed prevalence. All-positive is a useful F1 reference here, not a deployable recommendation.

## Direct source/engine evaluation (2026-10-27)

| Frozen rule | TP | FN | FP | TN | Precision | Recall | F1 |
|---|---:|---:|---:|---:|---:|---:|---:|
| Unglaze v0.1 claims | 108 | 243 | 12 | 339 | 0.9000 | 0.3077 | 0.4586 |
| Digit-only | 113 | 238 | 8 | 343 | 0.9339 | 0.3219 | 0.4788 |
| Always-positive | 351 | 0 | 351 | 0 | 0.5000 | 1.0000 | 0.6667 |

**Negative finding:** The frozen Unglaze heuristic has lower F1 than both digit-only and always-positive on this independent check-worthiness corpus. It misses 243/351 labeled check-worthy statements. Its apparent high precision reflects a narrow positive prediction policy on a balanced political-debate set; it is not a calibrated probability.

**Interpretation:** This falsifies the proposition that the current keyword heuristic is a strong general-purpose check-worthiness detector on this external corpus. It does **not** falsify usefulness for social-feed numerical-claim extraction, which has a different target and distribution.

## Reproduction and boundaries

```bash
npm test
node --test tests/e335_external_claimworthiness.test.mjs
curl -fL "https://raw.githubusercontent.com/utaresearch/claimbuster-spotter/332bba0819d79f8e42d0a70277597dfe97036873/data/two_class/test.json" -o /tmp/e335-test.json
node research/e335_claimbuster_eval.mjs /tmp/e335-test.json research/results/e335_claimbuster_receipt.json
```

The external data are downloaded read-only in CI and never committed. The JSON receipt contains counts and failure **IDs only**, not original debate statements. If the external host is temporarily unavailable, the data run fails; the offline synthetic controls remain executable.

## Decision

Do not advertise factual-claim detection accuracy, factual verification, or high precision in real feeds. Keep current local-first privacy and transparent unverified status. Next decisive experiment: obtain a legally reusable, independently annotated **social-feed factual/nonfactual** sentence corpus, freeze a semantic baseline and measure precision, recall, false negatives and per-domain failure cases under the correct label definition. Avoid optimizing this heuristic to the ClaimBuster test set.
