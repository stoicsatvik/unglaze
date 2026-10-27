import assert from "node:assert/strict";
import { test } from "node:test";
import { evaluate, gitBlobSha1, validateRows } from "../research/e335_claimbuster_eval.mjs";

const rows = [
  { sentence_id: 1, label: 1, text: "The company raised $10 million." },
  { sentence_id: 2, label: 1, text: "The committee approved the proposal." },
  { sentence_id: 3, label: 0, text: "I think this is amazing." },
  { sentence_id: 4, label: 0, text: "There were 500 employees." },
];

test("frozen synthetic sanity: count all four confusion cells", () => {
  const report = evaluate(rows);
  const m = report.metrics.frozen_unglaze;
  assert.deepEqual([m.TP, m.FN, m.FP, m.TN], [1, 1, 1, 1]);
  assert.equal(m.precision, 0.5);
  assert.equal(m.recall, 0.5);
  assert.equal(m.f1, 0.5);
  assert.deepEqual(report.labels, { "0": 2, "1": 2 });
});

test("negative label, repeated identity, and empty text fail closed", () => {
  for (const invalid of [
    [{ sentence_id: 1, label: 2, text: "claim" }],
    [rows[0], rows[0]],
    [{ sentence_id: 3, label: 0, text: " " }],
  ]) assert.throws(() => validateRows(invalid));
});

test("source fingerprint binds exact raw bytes, not parsed JSON", () => {
  assert.notEqual(gitBlobSha1(Buffer.from("{}")), gitBlobSha1(Buffer.from("{ }")));
  assert.equal(gitBlobSha1(Buffer.alloc(0)), "e69de29bb2d1d6434b8b29ae775ad8c2e48c5391");
});

test("no fabricated verification or deployment metrics", () => {
  const report = evaluate(rows);
  assert.ok(report.limitations.some(x => x.includes("NOT the same")));
  assert.ok(!("accuracy_on_social_feeds" in report));
  assert.ok(!("truth_verified" in report));
});
