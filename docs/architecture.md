# Unglaze architecture

## Goal

Unglaze is a browser-level signal layer, not a social network client and not a profile optimizer. Platform-specific code should only discover and normalize feed items. Analysis belongs in one shared engine.

```text
LinkedIn ─┐
X ────────┤
Reddit ───┼─> platform adapter -> canonical feed item -> analysis engine -> overlay
Facebook ─┤
Web ──────┘
```

## v0.1 components

### `src/platforms/adapters.js`

Finds posts and extracts text, author labels and links. Selectors are intentionally isolated because social platforms change their DOM constantly, apparently as a recreational activity.

### `src/core/engine.js`

Pure local heuristics. It currently separates concrete claims, numbers, opinion language, prediction language, common promotional phrases and obvious missing context. It never upgrades a self-reported claim to verified fact.

### `src/content/content.js`

Mounts the `Unglaze` control into detected feed items, observes infinite-scroll DOM mutations and renders the analysis card.

### `src/popup/*`

Controls per-platform enable state and view mode.

## Canonical model target

The next engine boundary should converge on this shape:

```json
{
  "platform": "linkedin",
  "author": {},
  "content": "...",
  "links": [],
  "media": [],
  "timestamp": null,
  "claims": [],
  "evidence": [],
  "opinions": [],
  "predictions": [],
  "missingContext": []
}
```

## Trust rules

1. Self-reported claims stay labelled as self-reported.
2. A linked source is not automatically evidence.
3. No fabricated confidence, provenance, metrics or verification.
4. Default analysis remains local-first.
5. Cross-platform verification must preserve source URLs and the exact claim being supported or contradicted.
6. Unglaze should compress uncertainty, not hide it.

## Roadmap

### Phase 1 — useful local overlay

- harden feed detection on LinkedIn, X, Reddit and Facebook
- add fixtures for real DOM variants
- improve claim classification without network calls
- support keyboard activation and accessibility
- add export/copy of structured analysis

### Phase 2 — evidence mode

- optional user-triggered retrieval for linked sources
- provenance records per claim
- distinguish first-party, second-party and independent sources
- contradiction detection
- dates and metric-definition comparison

### Phase 3 — cross-platform claim graph

```text
Person -> Claim -> Entity -> Evidence -> Source -> Contradiction -> Outcome
```

This is the durable product boundary. The extension is the interface; the claim/evidence graph is the compounding asset.

## Non-goals

- auto-posting or engagement farming
- profile-generation sludge
- black-box reputation scores for people
- silently scraping private/account-only data
- pretending LLM output is verification
