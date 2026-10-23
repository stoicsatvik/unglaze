import assert from "node:assert/strict";

await import("../src/core/engine.js");

const { analyze, stripGlaze, inferMissingContext } = globalThis.UnglazeCore;

assert.equal(
  stripGlaze("Thrilled to announce we raised $1.2M in seed funding."),
  "we raised $1.2M in seed funding."
);

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
assert.ok(result.opinions.length >= 1);

const gaps = inferMissingContext("Revenue grew 50%.");
assert.ok(gaps.includes("Percentage change is given without a clear baseline."));
assert.ok(gaps.includes("Revenue is mentioned without an absolute amount."));

console.log("Unglaze engine tests passed.");

// Sentence boundaries must not silently rewrite quantities or source URLs.
const sentenceFixtures = [
  ["Raised $1.2M in seed funding.", ["Raised $1.2M in seed funding."]],
  ["Revenue reached ₹1.25 crore.", ["Revenue reached ₹1.25 crore."]],
  ["1.5 million customers joined.", ["1.5 million customers joined."]],
  ["Read https://example.com/report for details.", ["Read https://example.com/report for details."]],
  ["Version 2.1.3 shipped.", ["Version 2.1.3 shipped."]],
  ["It grew 20%. Revenue is $1.25M.", ["It grew 20%.", "Revenue is $1.25M."]],
  ["Visit https://example.com/a.b?q=1.2 now. Another sentence.", ["Visit https://example.com/a.b?q=1.2 now.", "Another sentence."]],
  ["One sentence! Two sentences? Three sentences.", ["One sentence!", "Two sentences?", "Three sentences."]]
];
for (const [input, expected] of sentenceFixtures) {
  assert.deepEqual(globalThis.UnglazeCore.splitSentences(input), expected);
}
const decimalClaim = analyze({ text: "1.5 million customers joined." });
assert.ok(decimalClaim.claims.some(({ text }) => text.includes("1.5 million customers")));
assert.ok(!decimalClaim.claims.some(({ text }) => text.startsWith("5 million")));
