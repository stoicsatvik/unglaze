const DEFAULTS = {
  mode: "balanced",
  sites: { linkedin: true, x: true, reddit: true, facebook: true }
};

const hostToPlatform = (hostname = "") => {
  const host = hostname.replace(/^www\./, "");
  if (host.endsWith("linkedin.com")) return "linkedin";
  if (host === "x.com" || host.endsWith("twitter.com")) return "x";
  if (host.endsWith("reddit.com")) return "reddit";
  if (host.endsWith("facebook.com")) return "facebook";
  return null;
};

const siteName = document.querySelector("#site-name");
const siteStatus = document.querySelector("#site-status");
const siteToggle = document.querySelector("#site-toggle");
const modeSelect = document.querySelector("#mode");

let tabId = null;
let platform = null;
let sites = { ...DEFAULTS.sites };

const notifyTab = () => {
  if (!tabId) return;
  chrome.tabs.sendMessage(tabId, { type: "unglaze:refresh" }).catch(() => {});
};

const init = async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  tabId = tab?.id || null;

  try {
    platform = hostToPlatform(new URL(tab?.url || "").hostname);
  } catch {
    platform = null;
  }

  const stored = await chrome.storage.sync.get(["mode", "sites"]);
  sites = { ...DEFAULTS.sites, ...(stored.sites || {}) };
  modeSelect.value = stored.mode || DEFAULTS.mode;

  if (!platform) {
    siteName.textContent = "Unsupported page";
    siteStatus.textContent = "LinkedIn, X, Reddit and Facebook are supported in v0.1.";
    siteToggle.disabled = true;
    return;
  }

  siteName.textContent = platform === "x" ? "X" : platform[0].toUpperCase() + platform.slice(1);
  siteToggle.checked = sites[platform] !== false;
  siteStatus.textContent = siteToggle.checked ? "Unglaze is active here." : "Unglaze is paused here.";
};

siteToggle.addEventListener("change", async () => {
  if (!platform) return;
  sites[platform] = siteToggle.checked;
  await chrome.storage.sync.set({ sites });
  siteStatus.textContent = siteToggle.checked ? "Unglaze is active here." : "Unglaze is paused here.";
  notifyTab();
});

modeSelect.addEventListener("change", async () => {
  await chrome.storage.sync.set({ mode: modeSelect.value });
  notifyTab();
});

init();
