import assert from "node:assert/strict";

await import("../src/core/engine.js");

const { analyze, stripGlaze, inferMissingContext, buildEvidenceRecords } = globalThis.UnglazeCore;

assert.equal(stripGlaze("Thrilled to announce we raised $1.2M in seed funding."), "we raised $1.2M in seed funding.");

const result = analyze({
  text: "Thrilled to announce that we grew 200%! We now have 10,000 users. I think this is the best product in the market.",
  links: ["https://example.com/report"]
});
assert.ok(result.promotionalLanguage.includes("thrilled to announce"));
assert.ok(result.numbers.some((item) => item.includes("200%")));
assert.ok(result.numbers.some((item) => item.includes("10,000")));
assert.ok(result.missingContext.includes("Percentage change is given without a clear baseline."));
assert.ok(result.missingContext.includes("User/customer metric is not clearly defined."));
assert.ok(result.evidenceLinks.includes("https://example.com/report"));
assert.equal(result.evidenceRecords[0].verification, "unverified");
assert.equal(result.evidenceRecords[0].host, "example.com");
assert.ok(result.claims.every((claim) => claim.status === "self_reported" && claim.evidence.length === 0));
assert.ok(result.opinions.length >= 1);

const records = buildEvidenceRecords(["javascript:alert(1)", "not a url", "https://Example.com/a", "https://example.com/a"]);
assert.deepEqual(records, [{ url: "https://example.com/a", host: "example.com", kind: "linked_source", verification: "unverified" }]);

const gaps = inferMissingContext("Revenue grew 50%.");
assert.ok(gaps.includes("Percentage change is given without a clear baseline."));
assert.ok(gaps.includes("Revenue is mentioned without an absolute amount."));

console.log("Unglaze engine tests passed.");
