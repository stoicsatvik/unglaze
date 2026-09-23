import assert from "node:assert/strict";
await import("../src/platforms/contract.js");
const { normalizeFeedItem } = globalThis.UnglazeAdapterContract;

const fixtures = [
  ["linkedin", "Ada Founder", "Revenue grew 20%.", "https://example.com/report"],
  ["x", "@ada", "Revenue grew 20%.", "https://example.com/report"],
  ["reddit", "u/ada", "Revenue grew 20%.", "https://example.com/report"],
  ["facebook", "Ada Founder", "Revenue grew 20%.", "https://example.com/report"]
];

for (const [platform, author, text, href] of fixtures) {
  const item = normalizeFeedItem({
    platform,
    author: `  ${author}  `,
    text: `  ${text}  `,
    links: [
      { href, text: " Source ", external: true },
      { href, text: "duplicate", external: true },
      { href: "javascript:alert(1)", text: "unsafe", external: true }
    ]
  });
  assert.equal(item.platform, platform);
  assert.equal(item.author, author);
  assert.equal(item.text, text);
  assert.deepEqual(item.links, [{ href, text: "Source", external: true }]);
  assert.deepEqual(item.media, []);
  assert.equal(item.timestamp, null);
}

const bounded = normalizeFeedItem({ platform: "x", author: "a".repeat(200), text: "x".repeat(7000) });
assert.equal(bounded.author.length, 120);
assert.equal(bounded.text.length, 6000);
console.log("Unglaze platform contract tests passed.");
