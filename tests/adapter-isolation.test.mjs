import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

let overlayRemoved = false;
const original = "This post contains 1.5 million customers.";
const post = {
  querySelector: () => null,
  cloneNode: (deep) => {
    assert.equal(deep, true);
    return {
      querySelectorAll: (selector) => {
        assert.equal(selector, ".unglaze-root");
        return [{ remove: () => { overlayRemoved = true; } }];
      },
      get innerText() {
        return overlayRemoved ? original : original + " Unglazed No external source linked.";
      },
      get textContent() { return this.innerText; }
    };
  },
  get innerText() { return original + " Unglazed No external source linked."; }
};
const sandbox = {
  location: { hostname: "reddit.com", href: "https://reddit.com/r/example" },
  document: { querySelectorAll: () => [post] },
  URL
};
sandbox.globalThis = sandbox;
vm.runInNewContext(readFileSync(new URL("../src/platforms/adapters.js", import.meta.url), "utf8"), sandbox);
assert.equal(sandbox.UnglazePlatform.getText(post), original);
assert.ok(overlayRemoved, "injected overlay must be removed from fallback clone");
assert.equal(sandbox.UnglazePlatform.getPosts().length, 1);
console.log("Unglaze fallback source-isolation tests passed.");
