import test from "node:test";
import assert from "node:assert/strict";

await import("../src/core/engine.js");

const observed = [
  "Will Rowan sold 10 million units.",
  "Will Mercer joined the company in 2025.",
  "The will was signed in 2025.",
  "Her will was signed in 2025.",
  "Will Rowan said revenue reached $2M in 2025.",
  "Will Rowan has sold 200 units."
];

const forecast = [
  "The company will sell 10 million units.",
  "Will Rowan will launch a product in 2027.",
  "Will Rowan sell 10 million units?",
  "Will Revenue Grow to $10M?",
  "The CEO will join in 2027."
];

test("E494: lexical nominal Will must not erase observed candidate claims", () => {
  for (const text of observed) {
    const result = globalThis.UnglazeCore.analyze({ text });
    assert.equal(result.claims.length, 1, text);
    assert.equal(result.predictions.length, 0, text);
    assert.equal(result.claims[0].text, text, "preserve original wording");
    assert.equal(result.claims[0].status, "unverified");
    assert.equal(result.claims[0].verification, "not_checked");
  }
});

test("E494: actual modal Will and calendar May remain conservative", () => {
  for (const text of forecast) {
    const result = globalThis.UnglazeCore.analyze({ text });
    assert.equal(result.claims.length, 0, text);
    assert.equal(result.predictions.length, 1, text);
  }
  const date = globalThis.UnglazeCore.analyze({ text: "May 2025 revenue reached $1M." });
  assert.equal(date.claims.length, 1);
  assert.equal(date.predictions.length, 0);
});
