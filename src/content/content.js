(() => {
  const platform = globalThis.UnglazePlatform;
  const core = globalThis.UnglazeCore;
  if (!platform || !core) return;

  const DEFAULTS = {
    mode: "balanced",
    sites: {
      linkedin: true,
      x: true,
      reddit: true,
      facebook: true
    }
  };

  let settings = DEFAULTS;
  let scanTimer = null;

  const readSettings = async () => {
    const stored = await chrome.storage.sync.get(["mode", "sites"]);
    settings = {
      mode: stored.mode || DEFAULTS.mode,
      sites: { ...DEFAULTS.sites, ...(stored.sites || {}) }
    };
    return settings;
  };

  const isEnabled = () => settings.sites[platform.platform] !== false;

  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  const addList = (card, title, items, emptyText) => {
    const section = el("section", "unglaze-section");
    section.append(el("h4", "unglaze-section-title", title));

    if (!items?.length) {
      section.append(el("p", "unglaze-muted", emptyText || "None detected."));
      card.append(section);
      return;
    }

    const list = el("ul", "unglaze-list");
    items.slice(0, 8).forEach((item) => {
      const li = el("li", "unglaze-list-item", typeof item === "string" ? item : item.text);
      list.append(li);
    });
    section.append(list);
    card.append(section);
  };

  const addLinks = (card, links) => {
    const external = links.filter((link) => link.external).slice(0, 5);
    const section = el("section", "unglaze-section");
    section.append(el("h4", "unglaze-section-title", "Linked sources"));

    if (!external.length) {
      section.append(el("p", "unglaze-muted", "No external source linked in this feed item."));
      card.append(section);
      return;
    }

    const list = el("ul", "unglaze-list");
    external.forEach((link) => {
      const li = el("li", "unglaze-list-item");
      const anchor = el("a", "unglaze-link", link.text || new URL(link.href).hostname);
      anchor.href = link.href;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      li.append(anchor);
      list.append(li);
    });
    section.append(list);
    card.append(section);
  };

  const renderAnalysis = (card, result, meta) => {
    card.replaceChildren();

    const top = el("div", "unglaze-card-top");
    const titleWrap = el("div");
    titleWrap.append(el("strong", "unglaze-card-title", "Unglazed"));
    if (meta.author) titleWrap.append(el("span", "unglaze-author", meta.author));
    top.append(titleWrap);
    top.append(el("span", "unglaze-badge", platform.platform.toUpperCase()));
    card.append(top);

    const caveat = el(
      "p",
      "unglaze-caveat",
      "Local analysis. Claims remain self-reported unless a source independently verifies them."
    );
    card.append(caveat);

    if (settings.mode !== "numbers") {
      const summary = el("section", "unglaze-section");
      summary.append(el("h4", "unglaze-section-title", "Compressed signal"));
      summary.append(el("p", "unglaze-summary", result.summary || "No useful text detected."));
      card.append(summary);
    }

    if (settings.mode === "numbers") {
      addList(card, "Numbers", result.numbers, "No quantitative signal detected.");
      addList(card, "Missing context", result.missingContext, "No obvious numerical context gap detected.");
      return;
    }

    addList(card, "Concrete claims", result.factualClaims, "No concrete claim detected.");
    addLinks(card, meta.links);
    addList(card, "Missing context", result.missingContext, "No obvious context gap detected.");

    if (settings.mode === "balanced") {
      addList(
        card,
        "Promotional language removed",
        result.promotionalLanguage,
        "No common glaze phrases detected. Miracles do happen."
      );
      addList(card, "Opinions", result.opinions, "No obvious opinion statement detected.");
      addList(card, "Predictions", result.predictions, "No obvious prediction detected.");
    }
  };

  const mountPost = (post) => {
    if (post.dataset.unglazeMounted === "1") return;

    const text = platform.getText(post);
    if (!text || text.length < 12) return;

    post.dataset.unglazeMounted = "1";

    const root = el("div", "unglaze-root");
    const toolbar = el("div", "unglaze-toolbar");
    const button = el("button", "unglaze-button", "Unglaze");
    button.type = "button";
    button.setAttribute("aria-expanded", "false");

    const card = el("div", "unglaze-card");
    card.hidden = true;

    button.addEventListener("click", () => {
      const opening = card.hidden;
      card.hidden = !opening;
      button.setAttribute("aria-expanded", String(opening));

      if (opening && card.dataset.ready !== "1") {
        button.disabled = true;
        button.textContent = "Unglazing…";
        try {
          const currentText = platform.getText(post);
          const links = platform.getLinks(post);
          const result = core.analyze({ text: currentText, links });
          renderAnalysis(card, result, {
            author: platform.getAuthor(post),
            links
          });
          card.dataset.ready = "1";
        } catch (error) {
          card.replaceChildren(
            el("p", "unglaze-error", `Unglaze could not parse this item: ${error?.message || "unknown error"}`)
          );
        } finally {
          button.disabled = false;
          button.textContent = "Unglaze";
        }
      }
    });

    toolbar.append(button);
    root.append(toolbar, card);
    post.append(root);
  };

  const clearMounted = () => {
    document.querySelectorAll(".unglaze-root").forEach((node) => node.remove());
    document.querySelectorAll("[data-unglaze-mounted]").forEach((node) => {
      delete node.dataset.unglazeMounted;
    });
  };

  const scan = () => {
    if (!isEnabled()) return;
    platform.getPosts().forEach(mountPost);
  };

  const scheduleScan = () => {
    clearTimeout(scanTimer);
    scanTimer = setTimeout(scan, 180);
  };

  const refresh = async () => {
    await readSettings();
    clearMounted();
    if (isEnabled()) scan();
  };

  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type === "unglaze:refresh") refresh();
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "sync" && (changes.mode || changes.sites)) refresh();
  });

  const observer = new MutationObserver(scheduleScan);
  observer.observe(document.documentElement, { childList: true, subtree: true });

  readSettings().then(scan);
})();
