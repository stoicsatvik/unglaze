import test from "node:test";
import assert from "node:assert/strict";

await import("../src/core/engine.js");

const cases = [
  ["In May, revenue reached $1.2M.", 1, 0],
  ["During May, 12,000 users joined.", 1, 0],
  ["May revenue reached $1.2M.", 1, 0],
  ["May sales rose 20%.", 1, 0],
  ["On May 5, the company shipped 200 units.", 1, 0],
  ["We reached 12,000 users in May.", 1, 0],
  ["May 2025 revenue reached $1.2M.", 1, 0],
  ["May 12, 2026, we reached 50,000 users.", 1, 0],
  ["The company may reach $1.2M.", 0, 1],
  ["Sales may rise 20% next year.", 0, 1],
  ["Revenue may reach $1.2M.", 0, 1],
  ["In May, sales may rise 20%.", 0, 1],
  ["May sales rise next year?", 0, 1],
  ["May sales rose 20% but may decline later.", 0, 1],
  ["We reached 12,000 users in May and may double next year.", 0, 1]
];

test("E417: calendar May and modal may remain distinct without inventing verification", () => {
  for (const [text, factual, predictions] of cases) {
    const result = globalThis.UnglazeCore.analyze({ text });
    assert.equal(result.factualClaims.length, factual, text + ": factual");
    assert.equal(result.predictions.length, predictions, text + ": forecast");
    assert.equal(result.claims.length, factual, text + ": candidate claims");
    for (const claim of result.claims) {
      assert.equal(claim.status, "self_reported");
      assert.equal(claim.verification, "not_checked");
      assert.equal(Object.hasOwn(claim, "confidence"), false);
    }
    assert.deepEqual(result.evidenceLinks, [], text + ": no invented verification");
  }
});
