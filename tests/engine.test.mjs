import assert from "node:assert/strict";
await import("../src/core/engine.js");
const { analyze, stripGlaze, inferMissingContext } = globalThis.UnglazeCore;
assert.equal(stripGlaze("Thrilled to announce we raised $1.2M in seed funding."), "we raised $1.2M in seed funding.");
const result = analyze({ platform: "linkedin", author: { label: "Example" }, text: "Thrilled to announce that we grew 200%! We now have 10,000 users. I think this is the best product in the market.", links: ["https://example.com/report", "javascript:alert(1)"], media: [{ type: "image" }], timestamp: "2026-09-19T00:00:00Z" });
assert.equal(result.platform, "linkedin");
assert.deepEqual(result.author, { label: "Example" });
assert.ok(result.content.includes("10,000 users"));
assert.deepEqual(result.links, ["https://example.com/report"]);
assert.deepEqual(result.evidence, [{ url: "https://example.com/report", status: "linked_not_verified" }]);
assert.equal(result.timestamp, "2026-09-19T00:00:00Z");
assert.ok(result.promotionalLanguage.includes("thrilled to announce"));
assert.ok(result.numbers.some((item) => item.includes("200%")));
assert.ok(result.numbers.some((item) => item.includes("10,000")));
assert.ok(result.missingContext.includes("Percentage change is given without a clear baseline."));
assert.ok(result.missingContext.includes("User/customer metric is not clearly defined."));
assert.ok(result.evidenceLinks.includes("https://example.com/report"));
assert.ok(result.opinions.length >= 1);
assert.ok(result.claims.every((claim) => claim.status === "self_reported"));
assert.ok(result.evidence.every((item) => item.status !== "verified"));
const gaps = inferMissingContext("Revenue grew 50%.");
assert.ok(gaps.includes("Percentage change is given without a clear baseline."));
assert.ok(gaps.includes("Revenue is mentioned without an absolute amount."));
const empty = analyze();
assert.equal(empty.platform, "unknown");
assert.equal(empty.content, "");
assert.deepEqual(empty.evidence, []);
const crossClaimBaselineFixtures = [
  "Previous quarterly results are archived. Revenue grew 20%.",
  "Our baseline dataset has three tables. Signups increased 30%.",
  "Previous teams shipped a redesign. Retention grew 8%.",
  "Revenue grew 12%. Previously we sold furniture.",
  "Revenue rose 20%! Prior estimates were inaccurate.",
  "From 5 to 8 stores, we expanded. Revenue grew 50%.",
  "Revenue rose 25%. The prior quarter's baseline was $10M.",
  "Customers grew 7%. The word baseline is mentioned elsewhere."
];
for (const fixture of crossClaimBaselineFixtures) {
  assert.ok(
    inferMissingContext(fixture).includes("Percentage change is given without a clear baseline."),
    `Unrelated context must not suppress a percentage warning: ${fixture}`
  );
}
const sameClaimBaselineFixtures = [
  "Revenue grew 20% from $10M to $12M.",
  "Users grew 25% from 100 to 125.",
  "Revenue increased 50% compared to previous $2M.",
  "Revenue grew 30% over prior 1,000 units."
];
for (const fixture of sameClaimBaselineFixtures) {
  assert.ok(
    !inferMissingContext(fixture).includes("Percentage change is given without a clear baseline."),
    `Explicit same-sentence baseline should be retained: ${fixture}`
  );
}
console.log("Unglaze engine tests passed.");
