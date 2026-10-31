import test from "node:test";
import assert from "node:assert/strict";

await import("../src/core/engine.js");

const fixtures = [
  ["Revenue grew 40% last year, but I think costs will rise.", 1, 1, 1],
  ["We shipped 300 units, while we might ship 500 next month.", 1, 1, 0],
  ["We reached 1,000 users; I believe we will reach 2,000.", 1, 1, 1],
  ["Revenue grew 40% from $10M to $14M, but costs may fall.", 1, 1, 0],
  ["We reached 12,000 users in May and may double next year.", 1, 1, 0],
  ["May sales rose 20% but may decline later.", 1, 1, 0],
  ["Sales and marketing teams launched a new website.", 1, 0, 0],
  ["We will reach 100,000 customers in 2027.", 0, 1, 0],
  ["May 2025 revenue reached $1.2M.", 1, 0, 0],
  ["Revenue grew 40% from $10M to $14M; costs fell 10% from $10M to $9M.", 2, 0, 0]
];

test("E435: independent clauses preserve factual candidates without promoting forecasts", () => {
  for (const [text, factual, predictions, opinions] of fixtures) {
    const a = globalThis.UnglazeCore.analyze({ text });
    assert.equal(a.claims.length, factual, text + " claim count");
    assert.equal(a.factualClaims.length, factual, text + " factual count");
    assert.equal(a.predictions.length, predictions, text + " forecast count");
    assert.equal(a.opinions.length, opinions, text + " opinion count");
    assert.deepEqual(a.evidenceLinks, [], text + " no invented verification");
    for (const claim of a.claims) {
      assert.equal(claim.status, "self_reported");
      assert.equal(claim.verification, "not_checked");
      assert.equal(Object.hasOwn(claim, "confidence"), false);
    }
  }
});

test("E435: clause extraction does not borrow another clause's percentage baseline", () => {
  const a = globalThis.UnglazeCore.analyze({
    text: "Revenue grew 40% from $10M to $14M, but costs fell 70% from $10M to $9M."
  });
  assert.equal(a.claims.length, 2);
  assert.ok(a.missingContext.includes("Percentage change conflicts with the stated from/to values."));
});

test("E451: formerly unsplit and-modal case preserves its factual clause", () => {
  const a = globalThis.UnglazeCore.analyze({
    text: "We reached 12,000 users in May and may double next year."
  });
  assert.equal(a.claims.length, 1);
  assert.equal(a.predictions.length, 1);
  assert.equal(a.claims[0].verification, "not_checked");
});
