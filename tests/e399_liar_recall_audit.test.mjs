import assert from 'node:assert/strict';
import { test } from 'node:test';
import { evaluate, parseTsv, gitBlobSha1, exactPairedSignP, wilson, verifyFrozenEngine } from '../research/e399_liar_recall_audit.mjs';

const row = (id, label, text) => id + '.json\t' + label + '\t' + text + '\t' + Array(11).fill('x').join('\t');
const fixture = [row(1,'true','There were 3 launches.'),row(2,'false','The committee approved it.'),
  row(3,'half-true','5% was predicted.'),row(4,'mostly-true','They built the bridge.')].join('\n')+'\n';

test('parse independent research source schema and reject malformed labels, widths, IDs', () => {
  const rows = parseTsv(Buffer.from(fixture));
  assert.equal(rows.length, 4);
  assert.throws(() => parseTsv(Buffer.from(fixture.replace('half-true','invalid'))));
  assert.throws(() => parseTsv(Buffer.from(fixture.replace('3.json','1.json'))));
  assert.throws(() => parseTsv(Buffer.from(fixture.replace('x\tx\tx','x\tx'))));
  assert.throws(() => parseTsv(Buffer.from(fixture), { pinned: true }), /fingerprint/);
});
test('paired recall and labels are deterministic, with no fabricated precision', () => {
  const rows = parseTsv(Buffer.from(fixture));
  const report = evaluate(rows, text => /3 launches|built the bridge/.test(text));
  assert.equal(report.paired.both, 1);
  assert.equal(report.paired.unglaze_only, 1);
  assert.equal(report.paired.digit_only, 1);
  assert.equal(report.paired.neither, 1);
  assert.equal(report.claim_candidate_recall.unglaze.rate, 0.5);
  assert.equal(report.claim_candidate_recall.digit_only.rate, 0.5);
  assert.ok(!('precision' in report.claim_candidate_recall.unglaze));
});
test('exact discordance and Wilson interval sanity', () => {
  assert.equal(exactPairedSignP(0, 0), 1);
  assert.equal(exactPairedSignP(0, 5), 0.0625);
  assert.equal(exactPairedSignP(1, 1), 1);
  const [lo, hi] = wilson(50, 100);
  assert.ok(lo < 0.5 && hi > 0.5);
});
test('blob hash binds bytes and does not redistribute source statements', () => {
  assert.equal(gitBlobSha1(Buffer.alloc(0)), 'e69de29bb2d1d6434b8b29ae775ad8c2e48c5391');
  assert.notEqual(gitBlobSha1(Buffer.from('x')), gitBlobSha1(Buffer.from('x\n')));
});

test('frozen engine fingerprint must be checked, not merely reported', () => {
  assert.throws(() => verifyFrozenEngine(Buffer.from('different engine')), /engine fingerprint/);
});

function exactBigIntTwoSidedP(aOnly, bOnly) {
  const n = aOnly + bOnly, k = Math.min(aOnly, bOnly);
  let combination = 1n, tail = 1n;
  for (let i = 1; i <= k; i++) {
    combination = combination * BigInt(n - i + 1) / BigInt(i);
    tail += combination;
  }
  const numerator = 2n * tail, denominator = 1n << BigInt(n);
  return Math.min(1, Number(numerator * 10n ** 15n / denominator) / 1e15);
}

test('E400: exact paired-discordance tail must not underflow on a 1283-row cohort', () => {
  // This independently uses integer binomial coefficients, not the
  // production floating-point recurrence.
  for (const [a, b] of [[640, 643], [641, 642], [600, 683]]) {
    const expected = exactBigIntTwoSidedP(a, b);
    const observed = exactPairedSignP(a, b);
    assert.ok(Math.abs(observed - expected) < 1e-10,
      'large-cohort p-value mismatch for ' + a + '/' + b + ': ' + observed);
  }
  assert.ok(exactPairedSignP(640, 643) > 0.95);
  assert.ok(exactPairedSignP(600, 683) > 0.02);
});

test('E400: original E399 result remains unchanged and invalid counts fail closed', () => {
  assert.ok(Math.abs(exactPairedSignP(33, 40) - 0.4827885568440212) < 1e-12);
  assert.throws(() => exactPairedSignP(-1, 3), /nonnegative/);
  assert.throws(() => exactPairedSignP(1.5, 3), /nonnegative/);
});
