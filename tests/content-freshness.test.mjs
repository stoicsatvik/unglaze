import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

class Element {
  constructor(tag = "div") {
    this.tagName = tag;
    this.children = [];
    this.dataset = {};
    this.attributes = {};
    this.events = {};
    this.hidden = false;
    this.textContent = "";
    this.parentNode = null;
  }
  append(...nodes) {
    for (const node of nodes) {
      this.children.push(node);
      node.parentNode = this;
    }
  }
  replaceChildren(...nodes) {
    for (const child of this.children) child.parentNode = null;
    this.children = [];
    this.append(...nodes);
  }
  setAttribute(key, value) { this.attributes[key] = value; }
  addEventListener(event, callback) { this.events[event] = callback; }
  contains(target) { return this === target || this.children.some((child) => child.contains(target)); }
  remove() {
    if (!this.parentNode) return;
    this.parentNode.children = this.parentNode.children.filter((node) => node !== this);
    this.parentNode = null;
  }
}

const find = (root, cls) => {
  if (root.className === cls) return root;
  for (const child of root.children) {
    const match = find(child, cls);
    if (match) return match;
  }
  return null;
};

const post = new Element("article");
post.sourceText = "We reached 100 customers this month.";
post.sourceAuthor = "original author";
post.sourceLinks = [];
const analyzed = [];
let mutationCallback;
const sandbox = {
  document: {
    documentElement: new Element("html"),
    createElement: (tag) => new Element(tag),
    querySelectorAll: () => []
  },
  UnglazePlatform: {
    platform: "reddit",
    getPosts: () => [post],
    getText: (node) => node.sourceText,
    getLinks: (node) => node.sourceLinks,
    getAuthor: (node) => node.sourceAuthor
  },
  UnglazeCore: {
    analyze: ({ text }) => {
      analyzed.push(text);
      return { summary: text, factualClaims: [text], numbers: [], missingContext: [],
        promotionalLanguage: [], opinions: [], predictions: [] };
    }
  },
  chrome: {
    storage: { sync: { get: async () => ({}) }, onChanged: { addListener: () => {} } },
    runtime: { onMessage: { addListener: () => {} } }
  },
  MutationObserver: class {
    constructor(callback) { mutationCallback = callback; }
    observe() {}
  },
  setTimeout: (callback) => { callback(); return 1; },
  clearTimeout: () => {},
  URL
};
sandbox.globalThis = sandbox;
vm.runInNewContext(readFileSync(new URL("../src/content/content.js", import.meta.url), "utf8"), sandbox);
await new Promise((resolve) => setImmediate(resolve));

let root = find(post, "unglaze-root");
assert.ok(root, "first post should mount");
let button = find(root, "unglaze-button");
let card = find(root, "unglaze-card");
button.events.click();
assert.deepEqual(analyzed, ["We reached 100 customers this month."]);
assert.equal(card.dataset.ready, "1");

button.events.click();
button.events.click();
assert.equal(analyzed.length, 1, "unchanged post should reuse analysis");

post.sourceText = "We reached 200 customers this month.";
mutationCallback();
assert.equal(card.hidden, true, "recycled post must close stale analysis");
assert.equal(card.dataset.ready, undefined, "recycled post must invalidate analysis");
button.events.click();
assert.equal(analyzed.at(-1), "We reached 200 customers this month.");
assert.equal(analyzed.length, 2);

// A click must also detect a source change before the mutation debounce runs.
post.sourceText = "We reached 300 customers this month.";
button.events.click();
assert.equal(analyzed.at(-1), "We reached 300 customers this month.");
assert.equal(analyzed.length, 3);

// Same post text, different author: cached attribution must be invalidated.
post.sourceAuthor = "replacement author";
mutationCallback();
assert.equal(card.hidden, true, "author change must hide stale author attribution");
assert.equal(card.dataset.ready, undefined);
button.events.click();
assert.equal(find(card, "unglaze-author").textContent, "replacement author");
assert.equal(analyzed.length, 4);

// Same text and author, different evidence URL: cached linked sources must be invalidated.
post.sourceLinks = [{ href: "https://journal.example/new", text: "new source", external: true }];
mutationCallback();
assert.equal(card.hidden, true, "citation change must hide stale evidence links");
button.events.click();
assert.equal(find(card, "unglaze-link").href, "https://journal.example/new");
assert.equal(analyzed.length, 5);

// Click also detects metadata changes before the mutation observer debounce.
post.sourceLinks = [{ href: "https://journal.example/revised", text: "revised source", external: true }];
button.events.click();
assert.equal(find(card, "unglaze-link").href, "https://journal.example/revised");
assert.equal(analyzed.length, 6);

post.sourceText = "short";
mutationCallback();
assert.equal(find(post, "unglaze-root"), null, "recycled empty/short post must unmount");
assert.equal(post.dataset.unglazeMounted, undefined);

post.sourceText = "We reached 400 customers this month.";
mutationCallback();
root = find(post, "unglaze-root");
assert.ok(root, "new post content must remount");
button = find(root, "unglaze-button");
button.events.click();
assert.equal(analyzed.at(-1), "We reached 400 customers this month.");

// Host-side replacement can remove the control without clearing the marker.
root.remove();
mutationCallback();
assert.ok(find(post, "unglaze-root"), "missing control must remount");
assert.equal(post.dataset.unglazeMounted, "1");
assert.ok(!Object.values(post.dataset).some((value) => value.includes("customers")),
  "source text must not be copied into page-visible data attributes");

console.log("Unglaze recycled-feed freshness tests passed.");
