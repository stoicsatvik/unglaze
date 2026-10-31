import test from "node:test";
import assert from "node:assert/strict";

await import("../src/core/engine.js");

const cases = [
  ["We reached 12,000 users in May and may double next year.", 1, 1],
  ["May sales rose 20% but may decline later.", 1, 1],
  ["We shipped 300 units and will ship 500 next month.", 1, 1],
  ["Revenue grew 40% from $10M to $14M and costs may rise.", 1, 1],
  ["Revenue grew 40% and we might lose 100 customers.", 1, 1],
  ["We have 100 paying customers and expect to reach 200.", 1, 1],
  ["We reached 100 users and I think growth will slow.", 1, 1],
  ["We may reach 100 users and might grow.", 0, 2],
  ["Sales and marketing teams launched a new website.", 1, 0],
  ["We reached 1,000 users; I believe we will reach 2,000.", 1, 1],
  ["Revenue grew 40% from $10M to $14M; costs fell 10% from $10M to $9M.", 2, 0],
  ["May 2025 revenue reached $1.2M.", 1, 0],
  ["We will reach 100,000 customers in 2027.", 0, 1],
  ["The service may reach 50,000 users.", 0, 1],
  ["We reached 100 users and May sales rose 20%.", 2, 0]
];

test("E451: independent modal clauses preserve candidate observations without verifying them", () => {
  for (const [text, factual, predicted] of cases) {
    const result = globalThis.UnglazeCore.analyze({ text, links: ["https://example.com/lead"] });
    assert.equal(result.claims.length, factual, text + " factual candidates");
    assert.equal(result.factualClaims.length, factual, text + " factual clauses");
    assert.equal(result.predictions.length, predicted, text + " predictions");
    assert.deepEqual(result.evidenceLinks, [], text + " no invented verification");
    assert.deepEqual(result.sourceLinks, ["https://example.com/lead"]);
    for (const claim of result.claims) {
      assert.equal(claim.status, "self_reported");
      assert.equal(claim.verification, "not_checked");
      assert.equal(Object.hasOwn(claim, "confidence"), false);
    }
  }
});

test("E451: independent forecast cannot lend arithmetic baseline to observed clause", () => {
  const result = globalThis.UnglazeCore.analyze({
    text: "Revenue grew 40% and costs may rise from $10M to $14M."
  });
  assert.equal(result.claims.length, 1);
  assert.equal(result.predictions.length, 1);
  assert.ok(result.missingContext.includes("Percentage change is given without a clear baseline."));
});
