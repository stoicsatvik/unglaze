# Unglaze

Unglaze is a local-first browser overlay that turns noisy social feeds into structured information.

It sits over LinkedIn, X, Reddit, Facebook, and eventually generic web feeds, then separates:

- factual claims
- numbers and dates
- evidence links
- opinions and predictions
- promotional / performative language
- missing context and uncertainty

The first build is deliberately simple: a Manifest V3 extension with platform adapters feeding one shared analysis engine. No feed content is sent off-device in the default mode.

## Product principle

> Turn narratives into information.

## v0.1

- LinkedIn, X, Reddit and Facebook adapters
- one-click **Unglaze** action on detected feed items
- local heuristic claim extraction
- numbers / evidence / hype / missing-context views
- per-site enable / disable state
- DOM mutation observer for infinite feeds
- no account scraping, auto-posting, or fabricated verification

## Development

Load the repository as an unpacked extension from `chrome://extensions` after enabling Developer mode.

Run checks with:

```bash
npm test
```

See `docs/architecture.md` for the design and next build stages.
