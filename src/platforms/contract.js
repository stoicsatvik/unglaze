(() => {
  const cleanText = (value, limit) => String(value ?? "").trim().slice(0, limit);

  const normalizeLinks = (links = []) => {
    const seen = new Set();
    const normalized = [];
    for (const link of links) {
      const raw = typeof link === "string" ? link : link?.href;
      if (!raw) continue;
      try {
        const url = new URL(raw);
        if (!/^https?:$/.test(url.protocol) || seen.has(url.href)) continue;
        seen.add(url.href);
        normalized.push({
          href: url.href,
          text: cleanText(typeof link === "string" ? "" : link?.text, 160),
          external: typeof link === "string" ? true : Boolean(link?.external)
        });
      } catch {
        // Fail closed on malformed or non-absolute URLs.
      }
    }
    return normalized.slice(0, 20);
  };

  const normalizeFeedItem = (item = {}) => ({
    platform: cleanText(item.platform || "unknown", 32) || "unknown",
    author: cleanText(item.author, 120),
    text: cleanText(item.text, 6000),
    links: normalizeLinks(item.links),
    media: Array.isArray(item.media) ? item.media.slice(0, 20) : [],
    timestamp: cleanText(item.timestamp, 80) || null
  });

  globalThis.UnglazeAdapterContract = { normalizeFeedItem, normalizeLinks };
})();
