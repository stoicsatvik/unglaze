# FOUNDRY_STATE

- Tier: A
- Claim state: NOT YET PROVEN
- Branch: `foundry/claim-provenance-boundary`
- Base: `fe0f970398d66e67aaf1b8208a975d1cd7659706`
- Capability: deterministic claim-to-linked-source provenance records that fail closed. Links are recorded as `linked_not_verified`; they never imply support or verification.
- Validation: tests added for duplicate/unsafe URL filtering, self-reported claim status, unverified state with and without links, and `supportsClaim: false`. Exact-head CI pending.
- Evidence boundary: no linked source is treated as evidence merely because the post contains it; no external retrieval or account-only scraping occurs.
- Highest-EV next action: validate exact-head CI, then add optional user-triggered source retrieval as a separate provenance-preserving boundary before contradiction detection.
