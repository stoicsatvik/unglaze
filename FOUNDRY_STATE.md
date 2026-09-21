# Foundry state

Claim state: SUPPORTED

Current branch: `foundry/canonical-analysis-contract`

## Durable boundary
Unglaze is a local-first signal layer. Platform adapters discover content; the shared engine returns one canonical record carrying platform, author, normalized content, links, media, timestamp, claims, evidence, opinions, predictions and missing context.

Trust invariants:
- extracted claims remain `self_reported` unless a later evidence stage proves otherwise;
- linked URLs are `linked_not_verified`, never silently promoted to evidence;
- default analysis performs no network retrieval;
- non-http(s) links are rejected from the evidence boundary.

## Validation
Validated implementation head: `a38b671c19403590f0555ccb3e20a55d6b8b7271`.
GitHub Actions CI run `35526005029` completed successfully; job `test` ran `npm test` successfully.

This supports the canonical analysis/provenance software contract only. It does not establish factual verification accuracy, real-world DOM robustness, user adoption, or cross-platform contradiction detection.

## Highest-EV next action
Add deterministic platform-adapter fixtures that prove LinkedIn/X/Reddit/Facebook normalize into this contract without platform-specific semantics leaking into the core engine.

## Not proven
Real-world DOM robustness, factual verification accuracy, contradiction detection, user usefulness, adoption and cross-platform claim-graph value.
