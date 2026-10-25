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


// E218: a forecast with numerical details is still a forecast, not an observed fact.
// These deterministic controls must fail before the classifier correction.
const epistemicFixtures = [
  { text: "We will reach 100,000 customers in 2027.", factual: 0, predictions: 1, claims: 0 },
  { text: "We reached 100,000 customers in May 2025.", factual: 1, predictions: 0, claims: 1 },
  { text: "The service may reach 50,000 users.", factual: 0, predictions: 1, claims: 0 },
  { text: "May 2025 revenue reached $1.2M.", factual: 1, predictions: 0, claims: 1 },
  { text: "We expect revenue of $10M.", factual: 0, predictions: 1, claims: 0 },
  { text: "Revenue might hit $10M.", factual: 0, predictions: 1, claims: 0 },
  { text: "We reached $5M last year. We will reach $10M next year.", factual: 1, predictions: 1, claims: 1 }
];
for (const fixture of epistemicFixtures) {
  const analysis = analyze({ text: fixture.text });
  assert.equal(analysis.factualClaims.length, fixture.factual, fixture.text + ": factual");
  assert.equal(analysis.predictions.length, fixture.predictions, fixture.text + ": prediction");
  assert.equal(analysis.claims.length, fixture.claims, fixture.text + ": claims");
}

// E237: an unrelated sentence must not supply missing evidence for another claim.
// The previous whole-post detector lets unrelated baselines, units and qualifiers
// erase missing-context warnings. These fixtures are deliberately conservative.
const contextIsolationFixtures = [
  {
    text: "Revenue grew 40%. We moved from 2 to 4 offices.",
    expected: ["Percentage change is given without a clear baseline.", "Growth claim does not specify a time window."]
  },
  {
    text: "We reached 10,000 users. Another product has 300 paying customers.",
    expected: ["User/customer metric is not clearly defined."]
  },
  {
    text: "Revenue grew 50% last year. Another division reported $5M revenue.",
    expected: ["Revenue is mentioned without an absolute amount."]
  },
  {
    text: "We raised funding. A separate project secured a seed grant.",
    expected: ["Funding claim omits round structure or investor context."]
  }
];
for (const fixture of contextIsolationFixtures) {
  const gaps = inferMissingContext(fixture.text);
  for (const warning of fixture.expected) {
    assert.ok(gaps.includes(warning), fixture.text + " must retain: " + warning);
  }
  assert.deepEqual(analyze({ text: fixture.text }).missingContext, gaps);
}

// Legitimately scoped same-sentence context still satisfies the detector.
assert.ok(!inferMissingContext("Revenue grew 40% from $10M to $14M last year.").includes(
  "Percentage change is given without a clear baseline."
));
assert.ok(!inferMissingContext("20,000 monthly active users signed up.").includes(
  "User/customer metric is not clearly defined."
));


// E253: an explicit numeric baseline must agree with its stated percentage.
// The prior heuristic accepted any "from X to Y" text, including unrelated
// offices and arithmetically inconsistent revenue/user claims.
const percentArithmeticFixtures = [
  { text: "Revenue grew 40% from $10M to $14M last year.", mismatch: false, missing: false },
  { text: "Revenue grew 40% from $10M to $11M last year.", mismatch: true, missing: false },
  { text: "Revenue grew 40% from 2 to 4 offices last year.", mismatch: false, missing: true },
  { text: "Users grew 25% from 1,000 to 1,250 users this year.", mismatch: false, missing: false },
  { text: "Users grew 25% from 1,000 to 1,500 users this year.", mismatch: true, missing: false },
  { text: "Revenue fell 40% from $10M to $6M last year.", mismatch: false, missing: false },
  { text: "Revenue fell 40% from $10M to $14M last year.", mismatch: true, missing: false },
  { text: "Revenue grew 40% from $0 to $5M last year.", mismatch: false, missing: true }
];
for (const f of percentArithmeticFixtures) {
  const warnings = inferMissingContext(f.text);
  assert.equal(warnings.includes("Percentage change conflicts with the stated from/to values."), f.mismatch, f.text + ": arithmetic");
  assert.equal(warnings.includes("Percentage change is given without a clear baseline."), f.missing, f.text + ": baseline");
}

const crossMetricFixtures = [
  "Users grew 25% from 2 to 4 offices this year.",
  "Customers grew 25% from 100 to 125 employees this year."
];
for (const text of crossMetricFixtures) {
  assert.ok(inferMissingContext(text).includes(
    "Percentage change is given without a clear baseline."
  ), text + ": unrelated headcount/office unit cannot establish customer growth");
}
assert.ok(!inferMissingContext("Revenue grew 40% from 10 million to 14 million last year.").includes(
  "Percentage change is given without a clear baseline."
));
