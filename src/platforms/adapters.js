(() => {
  const host = location.hostname.replace(/^www\./, "");

  const configs = {
    "linkedin.com": { id: "linkedin", postSelectors: ["div.feed-shared-update-v2", "[data-urn^='urn:li:activity']"], textSelectors: [".update-components-text", ".feed-shared-update-v2__description-wrapper", ".break-words"], authorSelectors: [".update-components-actor__name", ".feed-shared-actor__name"] },
    "x.com": { id: "x", postSelectors: ["article[data-testid='tweet']"], textSelectors: ["[data-testid='tweetText']"], authorSelectors: ["[data-testid='User-Name']"] },
    "twitter.com": { id: "x", postSelectors: ["article[data-testid='tweet']"], textSelectors: ["[data-testid='tweetText']"], authorSelectors: ["[data-testid='User-Name']"] },
    "reddit.com": { id: "reddit", postSelectors: ["shreddit-post", "[data-testid='post-container']", "article"], textSelectors: ["[slot='text-body']", "[data-post-click-location='text-body']", "[data-testid='post-content']"], authorSelectors: ["[slot='authorName']", "a[href*='/user/']"] },
    "facebook.com": { id: "facebook", postSelectors: ["[role='article']"], textSelectors: ["[data-ad-preview='message']", "[data-ad-comet-preview='message']"], authorSelectors: ["h2 a", "h3 a"] }
  };

  const config = configs[host] || null;
  const firstText = (root, selectors) => {
    for (const selector of selectors) {
      const node = root.querySelector(selector);
      const value = node?.innerText?.trim();
      if (value) return value;
    }
    return "";
  };
  const getPosts = () => {
    if (!config) return [];
    const posts = [], seen = new Set();
    for (const selector of config.postSelectors) document.querySelectorAll(selector).forEach((node) => { if (!seen.has(node)) { seen.add(node); posts.push(node); } });
    return posts;
  };
  const getText = (post) => {
    if (!config) return "";
    const selected = firstText(post, config.textSelectors);
    return selected || (post.innerText || "").trim().slice(0, 6000);
  };
  const getAuthor = (post) => config ? firstText(post, config.authorSelectors).split("\n")[0].slice(0, 120) : "";
  const getLinks = (post) => {
    const values = [], seen = new Set();
    post.querySelectorAll("a[href]").forEach((anchor) => {
      try {
        const url = new URL(anchor.href, location.href), href = url.href;
        if (!/^https?:$/.test(url.protocol) || seen.has(href)) return;
        seen.add(href);
        values.push({ href, text: (anchor.innerText || anchor.getAttribute("aria-label") || "").trim().slice(0, 160), external: url.hostname !== location.hostname });
      } catch {}
    });
    return values.slice(0, 20);
  };
  const getItem = (post) => {
    if (!config) return null;
    const normalize = globalThis.UnglazeAdapterContract?.normalizeFeedItem;
    if (typeof normalize !== "function") return null;
    return normalize({ platform: config.id, author: getAuthor(post), text: getText(post), links: getLinks(post) });
  };

  globalThis.UnglazePlatform = config ? { platform: config.id, getPosts, getText, getAuthor, getLinks, getItem } : null;
})();
