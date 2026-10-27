/**
 * E335: frozen, external-domain check-worthiness falsification.
 *
 * This is NOT a factual-truth evaluator. Binary ClaimBuster labels indicate
 * check-worthiness, which is not equivalent to Unglaze's factualClaims output.
 * No source sentences are redistributed or committed.
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import "../src/core/engine.js";

export const SOURCE = Object.freeze({
  repository: "utaresearch/claimbuster-spotter",
  commit: "332bba0819d79f8e42d0a70277597dfe97036873",
  path: "data/two_class/test.json",
  git_blob_sha1: "ea50469f1304a9f9591e72cdd49a16a1315fb920",
  license: "GPL-3.0 (upstream repository); source dataset not redistributed",
  annotation: "binary check-worthiness labels, not factual truth",
});

export function gitBlobSha1(bytes) {
  const raw = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
  return createHash("sha1")
    .update(Buffer.from(`blob ${raw.length}\0`))
    .update(raw)
    .digest("hex");
}

export function validateRows(rows, { pinned = false } = {}) {
  assert.ok(Array.isArray(rows), "dataset must be a JSON array");
  const ids = new Set();
  const counts = { "0": 0, "1": 0 };
  for (const row of rows) {
    assert.ok(Number.isSafeInteger(row.sentence_id), "invalid sentence_id");
    assert.ok(!ids.has(row.sentence_id), "duplicate sentence_id");
    ids.add(row.sentence_id);
    assert.ok(row.label === 0 || row.label === 1, "invalid binary label");
    assert.ok(typeof row.text === "string" && row.text.trim(), "empty text");
    counts[row.label] += 1;
  }
  if (pinned) {
    assert.equal(rows.length, 702, "unexpected pinned source length");
    assert.equal(counts["0"], 351, "unexpected negative count");
    assert.equal(counts["1"], 351, "unexpected positive count");
  }
  return counts;
}

export function confusion(rows, predict) {
  let TP = 0, FN = 0, FP = 0, TN = 0;
  const false_negative_ids = [], false_positive_ids = [];
  for (const row of rows) {
    const positive = Boolean(predict(row.text));
    if (row.label === 1 && positive) TP += 1;
    else if (row.label === 1) {
      FN += 1;
      if (false_negative_ids.length < 12) false_negative_ids.push(row.sentence_id);
    } else if (positive) {
      FP += 1;
      if (false_positive_ids.length < 12) false_positive_ids.push(row.sentence_id);
    } else TN += 1;
  }
  const safe = (numerator, denominator) => denominator ? numerator / denominator : 0;
  const precision = safe(TP, TP + FP);
  const recall = safe(TP, TP + FN);
  const specificity = safe(TN, TN + FP);
  return {
    TP, FN, FP, TN, precision, recall, specificity,
    f1: safe(2 * precision * recall, precision + recall),
    balanced_accuracy: (recall + specificity) / 2,
    false_negative_ids, false_positive_ids,
  };
}

export function evaluate(rows) {
  const counts = validateRows(rows);
  const engine = globalThis.UnglazeCore;
  assert.ok(engine?.analyze, "Unglaze engine unavailable");
  return {
    schema: "unglaze/e335/claimbuster-external-checkworthiness/v1",
    source: SOURCE,
    rows: rows.length,
    labels: counts,
    metrics: {
      frozen_unglaze: confusion(rows, text => engine.analyze({ text }).claims.length > 0),
      digit_only: confusion(rows, text => /\d/.test(text)),
      all_positive: confusion(rows, () => true),
    },
    limitations: [
      "Check-worthiness is NOT the same label as factual assertion or truth.",
      "Balanced US presidential-debate corpus is not a social-feed prevalence sample.",
      "Precision here is conditional on 351/351 class balance, not deployment precision.",
      "Source data and evaluation protocol were publicly available before this run.",
      "No inference about political positions, individuals, truth or misinformation.",
      "No external model, API, private feed, user data, or calibration was used.",
    ],
  };
}

async function main() {
  const [input, output] = process.argv.slice(2);
  if (!input || !output) throw new Error("usage: node research/e335_claimbuster_eval.mjs DATASET.json RECEIPT.json");
  const raw = await readFile(input);
  const actualSha = gitBlobSha1(raw);
  assert.equal(actualSha, SOURCE.git_blob_sha1, "source blob fingerprint mismatch");
  const rows = JSON.parse(raw.toString("utf8"));
  validateRows(rows, { pinned: true });
  const result = { ...evaluate(rows), observed_git_blob_sha1: actualSha };
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, JSON.stringify(result, null, 2) + "\n");
  console.log(JSON.stringify({
    rows: result.rows, labels: result.labels,
    metrics: Object.fromEntries(Object.entries(result.metrics).map(([k, m]) => [
      k, { TP: m.TP, FN: m.FN, FP: m.FP, TN: m.TN,
           precision: m.precision, recall: m.recall, f1: m.f1 },
    ])),
  }, null, 2));
}
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch(error => { console.error(error); process.exitCode = 1; });
}
