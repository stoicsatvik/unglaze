# FOUNDRY_STATE

## Classification
Tier A — primary product stream.

## Current frontier
Unglaze has a local-first Manifest V3 overlay, platform adapters, shared heuristic analysis, popup controls, and deterministic engine tests. The durable product boundary is a claim/evidence graph with explicit provenance and uncertainty.

## Claim state
- Local heuristic extraction and overlay architecture: SUPPORTED by repository implementation/tests, subject to CI on each changed head.
- A post sentence emitted as a claim is self-reported and unverified unless an explicit evidence pipeline proves otherwise.
- Numeric confidence for heuristic claims: REJECTED. There is no calibrated dataset supporting probabilities such as 0.72 or 0.55.
- A linked URL automatically verifying a claim: REJECTED.
- Cross-platform factual verification, contradiction detection, calibration, and arbitrary DOM robustness: NOT YET PROVEN.

## Privacy / trust invariants
- Default feed analysis remains on-device.
- Do not scrape private/account-only data silently.
- Do not auto-post or engagement-farm.
- Preserve exact source URLs and claim text when evidence retrieval is later introduced.
- Never convert heuristic extraction into a factual-verification claim.

## Validation gate
Run `npm test`. Tests must enforce that local claims remain `self_reported`, `basis=post_text`, `verification=unverified`, contain no fabricated numeric confidence, and are not promoted merely because the post contains a link.

## Highest-EV next action
After exact-head CI passes, introduce a canonical feed-item/claim schema shared by adapters and the engine. Then add deterministic fixtures proving adapter normalization does not lose source URL, platform, author label, or original claim text. Do not add network retrieval until that provenance boundary is stable.
