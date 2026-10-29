/** E399: independent LIAR test-set claim-candidate recall audit.
 * LIAR truthfulness labels are NOT labels for factual-claim presence.
 * Original source statements are never redistributed in receipts.
 */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const SOURCE = Object.freeze({
  repository: 'tfs4/liar_dataset',
  commit: 'b6f55d759d525f7150637fcdbc2c517d049408b7',
  path: 'test.tsv',
  git_blob_sha1: 'a53fa254e1aab00e9c4d2442248bd43ff103ad90',
  expected_rows: 1283,
  source_license: 'Research use only; original sources retain copyright',
  annotation: 'Six-level PolitiFact truthfulness, NOT factual-assertion presence',
});
export const ENGINE_BLOB_SHA1 = '383233ee0d3b51427a9f965283f7ea01dacd7bfc';
const LABELS = new Set(['true','false','half-true','pants-fire','barely-true','mostly-true']);

export function gitBlobSha1(raw) {
  const bytes = Buffer.isBuffer(raw) ? raw : Buffer.from(raw);
  return createHash('sha1').update(Buffer.from('blob ' + bytes.length + '\0')).update(bytes).digest('hex');
}
export function verifyFrozenEngine(bytes) {
  assert.equal(gitBlobSha1(bytes), ENGINE_BLOB_SHA1, 'engine fingerprint changed');
}
export function parseTsv(raw, { pinned = false } = {}) {
  const bytes = Buffer.isBuffer(raw) ? raw : Buffer.from(raw);
  if (pinned) assert.equal(gitBlobSha1(bytes), SOURCE.git_blob_sha1, 'source fingerprint changed');
  const rows = bytes.toString('utf8').trimEnd().split(/\r?\n/).map((line, index) => {
    const cols = line.split('\t');
    assert.equal(cols.length, 14, 'unexpected TSV width at row ' + (index + 1));
    const [id, label, statement] = cols;
    assert.match(id, /^\d+\.json$/, 'invalid source row ID');
    assert.ok(LABELS.has(label), 'invalid source label');
    assert.ok(statement.trim(), 'empty statement');
    return { id, label, text: statement };
  });
  assert.equal(new Set(rows.map(r => r.id)).size, rows.length, 'duplicate source ID');
  if (pinned) assert.equal(rows.length, SOURCE.expected_rows, 'unexpected source row count');
  return rows;
}
export function wilson(k, n) {
  assert.ok(Number.isInteger(n) && n > 0 && Number.isInteger(k) && k >= 0 && k <= n);
  const z = 1.959963984540054;
  const p = k / n, den = 1 + z * z / n;
  const center = (p + z * z / (2 * n)) / den;
  const radius = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / den;
  return [center - radius, center + radius];
}
export function exactPairedSignP(aOnly, bOnly) {
  assert.ok(Number.isSafeInteger(aOnly) && aOnly >= 0 &&
    Number.isSafeInteger(bOnly) && bOnly >= 0,
    'discordance counts must be nonnegative safe integers');
  const n = aOnly + bOnly, k = Math.min(aOnly, bOnly);
  assert.ok(Number.isSafeInteger(n), 'total discordance count exceeds safe integer range');
  if (!n) return 1;
  // The conditional binomial test is exact; its numerical tail evaluation
  // must not begin with 2**(-n), which underflows for n >= 1075.
  // Start at P(X=k) in log space, then sum the smaller terms by recurrence.
  let logAtK = -n * Math.LN2;
  for (let i = 1; i <= k; i++) {
    logAtK += Math.log(n - i + 1) - Math.log(i);
  }
  let relativeTail = 1, relativeTerm = 1;
  for (let i = k; i > 0; i--) {
    relativeTerm *= i / (n - i + 1);
    relativeTail += relativeTerm;
  }
  return Math.min(1, 2 * Math.exp(logAtK) * relativeTail);
}
export function evaluate(rows, predict) {
  assert.ok(Array.isArray(rows) && rows.length, 'nonempty source required');
  assert.equal(typeof predict, 'function');
  let both = 0, engineOnly = 0, digitOnly = 0, neither = 0;
  const labels = {};
  for (const row of rows) {
    const u = Boolean(predict(row.text)), d = /\d/.test(row.text);
    if (u && d) both++;
    else if (u) engineOnly++;
    else if (d) digitOnly++;
    else neither++;
    const cell = labels[row.label] ??= { n: 0, unglaze_hits: 0, digit_hits: 0 };
    cell.n++;
    if (u) cell.unglaze_hits++;
    if (d) cell.digit_hits++;
  }
  const n = rows.length, u = both + engineOnly, d = both + digitOnly;
  return {
    schema: 'unglaze/e399/liar-independent-claim-recall/v1',
    source: SOURCE,
    engine_blob_sha1: ENGINE_BLOB_SHA1,
    rows: n,
    claim_candidate_recall: {
      unglaze: { hits: u, rate: u / n, wilson95: wilson(u, n) },
      digit_only: { hits: d, rate: d / n, wilson95: wilson(d, n) },
      always_positive: { hits: n, rate: 1 },
    },
    paired: { both, unglaze_only: engineOnly, digit_only: digitOnly, neither,
      exact_two_sided_discordance_p: exactPairedSignP(engineOnly, digitOnly) },
    by_truthfulness_label: labels,
    claim_state: 'INDEPENDENT EXTERNAL RECALL MEASURED; FACTUAL CLAIM PRECISION AND REAL FEED ACCURACY NOT YET PROVEN',
    limitations: [
      'All LIAR entries were selected for fact checking; no nonclaim negatives exist, so precision/F1/specificity cannot be measured.',
      'Truthfulness labels are not claim-presence labels; no statement truth or political allegation is inferred.',
      'PolitiFact political claims are not a representative social-feed sample; selection and domain shift apply.',
      'The 95% Wilson intervals describe conditional binomial sampling only, not dataset-selection bias.',
      'No model tuning, scraping, paid API, original statement redistribution, or user data.',
    ],
  };
}
async function main() {
  const [input, output] = process.argv.slice(2);
  if (!input || !output) throw new Error('usage: node research/e399_liar_recall_audit.mjs PINNED_TEST.tsv RECEIPT.json');
  const rows = parseTsv(await readFile(input), { pinned: true });
  verifyFrozenEngine(await readFile(new URL('../src/core/engine.js', import.meta.url)));
  await import('../src/core/engine.js');
  const analyze = globalThis.UnglazeCore?.analyze;
  assert.equal(typeof analyze, 'function', 'frozen engine unavailable');
  const report = evaluate(rows, text => analyze({ text }).claims.length > 0);
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ rows: report.rows, recall: report.claim_candidate_recall, paired: report.paired }, null, 2));
}
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch(error => { console.error(error); process.exitCode = 1; });
}
