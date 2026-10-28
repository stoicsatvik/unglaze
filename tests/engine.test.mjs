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
assert.ok(result.sourceLinks.includes("https://example.com/report"));
assert.deepEqual(result.evidenceLinks, []);
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


// E272: separate claims in one grammatical sentence must not borrow one another's
// baselines or hide an independently inconsistent percentage.
const clauseIsolationFixtures = [
  {
    text: "Revenue grew 40% from $10M to $14M, but costs fell 70% from $10M to $9M last year.",
    missing: false, mismatch: true
  },
  {
    text: "Revenue grew 40% from $10M to $14M; costs fell 10% from $10M to $9M last year.",
    missing: false, mismatch: false
  },
  {
    text: "Revenue grew 40%, while users rose from 100 to 140.",
    missing: true, mismatch: false
  },
  {
    text: "Revenue grew 40% from $10M to $14M, while users rose 70% from 100 to 140.",
    missing: false, mismatch: true
  },
  {
    text: "Revenue grew 40% from $10M to $14M, and costs fell 70% from $10M to $9M.",
    missing: false, mismatch: true
  }
];
for (const fixture of clauseIsolationFixtures) {
  const warnings = inferMissingContext(fixture.text);
  assert.equal(
    warnings.includes("Percentage change is given without a clear baseline."),
    fixture.missing, fixture.text + ": missing baseline"
  );
  assert.equal(
    warnings.includes("Percentage change conflicts with the stated from/to values."),
    fixture.mismatch, fixture.text + ": independent arithmetic"
  );
}


// E292: an outbound URL and a plausible-sounding numeric statement do not
// supply independent verification or a calibrated probability.
for (const url of [
  "https://example.com/company-press-release",
  "https://example.org/marketing",
  "https://example.net/research",
]) {
  const audit = analyze({ text: "We reached 25,000 customers.", links: [url] });
  assert.deepEqual(audit.sourceLinks, [url]);
  assert.deepEqual(audit.evidenceLinks, []);
  assert.equal(audit.claims.length, 1);
  assert.equal(audit.claims[0].status, "self_reported");
  assert.equal(audit.claims[0].verification, "not_checked");
  assert.equal(Object.hasOwn(audit.claims[0], "confidence"), false);
}
const withoutLinks = analyze({ text: "We launched in May 2026." });
assert.deepEqual(withoutLinks.sourceLinks, []);
assert.deepEqual(withoutLinks.evidenceLinks, []);
assert.ok(withoutLinks.claims.every(c => c.verification === "not_checked" && !Object.hasOwn(c, "confidence")));


// E309 negative controls: a sentence is not automatically an asserted
// factual claim merely because it survives opinion/forecast filtering.
// Synthetic examples isolate the structural bug; they are not an NLP corpus.
const e309Nulls = [
  "Thanks for reading.",
  "Hello everyone.",
  "Follow for more updates.",
  "Please subscribe to our newsletter.",
  "Welcome back. Enjoy your day."
];
for (const text of e309Nulls) {
  const audit = analyze({ text });
  assert.deepEqual(audit.factualClaims, [], text + ": factual null");
  assert.deepEqual(audit.claims, [], text + ": must not emit a claim");
}
const e309Positives = [
  "We reached 100 paying customers.",
  "Revenue reached ₹1.25 crore in 2025.",
  "The company launched in April 2026.",
  "We raised $1.2M in seed funding."
];
for (const text of e309Positives) {
  const audit = analyze({ text });
  assert.equal(audit.factualClaims.length, 1, text + ": factual positive");
  assert.equal(audit.claims.length, 1, text + ": claim preserved");
  assert.equal(audit.claims[0].verification, "not_checked");
  assert.equal(Object.hasOwn(audit.claims[0], "confidence"), false);
}
assert.equal(analyze({ text: "We will reach 100 customers." }).claims.length, 0);


// E351: unpunctuated coordination of distinct measured metrics must not
// let the first percentage/baseline silently validate a second one.
// The original parser split only punctuation-delimited clauses, so the
// first 40%/$10M->$14M masked a later 70%/$10M->$9M mismatch.
const e351CoordinatedMetrics = [
  {
    text: "Revenue grew 40% from $10M to $14M and costs fell 70% from $10M to $9M last year.",
    mismatch: true,
    missing: false
  },
  {
    text: "Revenue grew 40% from $10M to $14M and costs fell 10% from $10M to $9M last year.",
    mismatch: false,
    missing: false
  },
  {
    text: "Revenue grew 40% from $10M to $14M and users grew 70% this year.",
    mismatch: false,
    missing: true
  },
  {
    text: "Revenue grew 40% from $10M to $14M and we hired 10 people.",
    mismatch: false,
    missing: false
  }
];
for (const fixture of e351CoordinatedMetrics) {
  const warnings = inferMissingContext(fixture.text);
  assert.equal(warnings.includes("Percentage change conflicts with the stated from/to values."), fixture.mismatch, fixture.text + ": coordinated mismatch");
  assert.equal(warnings.includes("Percentage change is given without a clear baseline."), fixture.missing, fixture.text + ": coordinated missing");
}
