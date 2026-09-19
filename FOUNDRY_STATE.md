# Foundry state

Claim state: NOT YET PROVEN

Current branch: `foundry/canonical-analysis-contract`

## Durable boundary
Unglaze is a local-first signal layer. Platform adapters discover content; the shared engine returns one canonical record carrying platform, author, normalized content, links, media, timestamp, claims, evidence, opinions, predictions and missing context.

Trust invariants:
- extracted claims remain `self_reported` unless a later evidence stage proves otherwise;
- linked URLs are `linked_not_verified`, never silently promoted to evidence;
- default analysis performs no network retrieval;
- non-http(s) links are rejected from the evidence boundary.

## Validation
Pending exact-head CI for canonical contract tests.

## Highest-EV next action
After exact-head CI is green, add deterministic platform-adapter fixtures that prove LinkedIn/X/Reddit/Facebook normalize into this contract without platform-specific semantics leaking into the core engine.

## Not proven
Real-world DOM robustness, factual verification accuracy, contradiction detection, user usefulness, adoption and cross-platform claim-graph value.
