# Foundry State

- Tier: A
- Claim state: NOT YET PROVEN
- Current branch: `foundry/evidence-provenance-boundary`
- Capability: linked HTTP(S) sources are normalized into provenance records that remain explicitly `unverified`; claims remain `self_reported` and are not automatically bound to links.
- Validation: deterministic regression tests added; exact-head CI pending.
- Blocker: no browser-runtime fixture corpus yet proves adapter robustness across live platform DOM variants.
- Highest-EV next action: add deterministic platform DOM fixtures and verify canonical feed-item normalization without network calls.

## Invariants

1. A link is not evidence merely because it exists.
2. Self-reported claims are never upgraded to verified by the local heuristic engine.
3. Non-HTTP(S) link payloads fail closed.
4. Default analysis remains local-first.
