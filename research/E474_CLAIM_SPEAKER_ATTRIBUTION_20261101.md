# E474 — Claim speaker attribution boundary (2026-11-01)

## Question and falsifiable risk

Does the extension imply that every extracted claim belongs to the feed-post author, even when the text is third-person or explicitly quotes another speaker? This matters because the product's central contract is to preserve provenance and uncertainty, not fabricate authorship.

## Frozen source and synthetic diagnostic

- Parent E451 engine Git blob: `387915c15124ceb5e87ef5d77da17ab006f5ac98`.
- E474 engine Git blob: `6f98d139db1e47ba998dcbbe195bd20ff7cf7279`.
- Four hand-authored direct first-person fixtures, four third-person fixtures, six explicitly quoted or attributed fixtures. These are **synthetic controls**, not externally annotated real social posts.
- Parent E451 returned `status: "self_reported"` for **14/14**, including all ten cases where the text did not justify assigning the claim to the post author.
- E474 returns `status: "unverified"` for **14/14** and conservative `speakerContext` cues: first-person wording 4, unspecified 4, quoted/attributed wording 6.
- Candidate claim counts are unchanged on all 14 fixtures. `verification: "not_checked"` is preserved; no confidence or evidence is invented.
- Two independent arithmetic regression examples remain unchanged. Fourteen attribution and two arithmetic controls passed in a source-exact isolated V8 execution. This is **not** native Node, browser DOM or GitHub Actions validation.

## Changes

1. Remove the unsupported blanket `self_reported` status for extracted candidates. Use `unverified` and an explicit lexical `speakerContext` cue.
2. Render the speaker uncertainty visibly in the local extension overlay. First-person wording does **not** authenticate authorship; attributed wording does **not** verify the named speaker.
3. Freeze 14 attribution fixtures and two excluded forecast/opinion controls in the inherited engine test suite. Preserve existing numerical, calendar and epistemic checks.

## Claims and limitations

- **REJECTED IN SYNTHETIC CONTROLS:** Every detected claim can safely be marked as self-reported by the post author.
- **SUPPORTED IN SOURCE-EXACT SYNTHETIC CHECKS:** The new metadata and display contract distinguish obvious lexical speaker cues while keeping all claims unverified.
- **NOT YET PROVEN:** Real social-feed speaker attribution accuracy, indirect quotation handling, pronoun/coreference resolution, author identity, factual truth, cross-platform benefit and user utility.
- **Potential regression:** Downstream consumers that hard-code `self_reported` may need a migration; inspect consumers before merge. Conservative `unspecified` is intentional.

## Next discriminating experiment

Freeze a legally usable, independently annotated real-feed positive/negative and quoted/direct corpus. Evaluate claim detection and speaker attribution with source-preserving splits, report false attribution and precision/recall against a no-attribution baseline, inspect error clusters, and reject the heuristic if its false-speaker rate is unacceptable.

No private feed scraping, external retrieval, publication, deployment, merge, outreach or spending occurred.

## Exact-head CI and inherited-suite migration

- Draft PR: https://github.com/stoicsatvik/unglaze/pull/24 (stacked on E451 #23).
- Initial pull-request Actions #41293565889 **FAILED** with 17/20 passing because three inherited tests expected the previous, now rejected `self_reported` status. E474's new synthetic attribution controls passed in that same run.
- Migrated only those three legacy status expectations, preserving all their forecast, modal and clause behavior assertions. No weakening of numeric or epistemic controls.
- Corrected exact-code-head Actions #41293661085 **SUCCESS**; the `npm test` step passed on commit `689d451a0eeed9f599a2e46e10d20c72a9e99ee4`.
- This verifies the inherited Node test suite, **not** real-feed speaker attribution or browser integration. A documentation-only follow-up commit requires its own exact-head CI check.
