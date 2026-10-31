
const API_URL = "http://127.0.0.1:8000/analyze";

const messageInput = document.getElementById("messageInput");
const urlList = document.getElementById("urlList");
const urlCount = document.getElementById("urlCount");
const urlSection = document.getElementById("urlSection");
const analyseBtn = document.getElementById("analyseBtn");
const resultSection = document.getElementById("resultSection");
const errorMessage = document.getElementById("errorMessage");

let currentUrls = [];
let sourceUrls = [];          // links that came with the selection (e.g. right-clicked link)
const dismissedUrls = new Set();

// Finds links written inside the message text: full URLs, www. links and bare domains
// such as "netflix-billing-support-update.com", which scam messages often use.
const LINK_TLDS = [
  "com", "net", "org", "info", "biz", "co", "io", "in", "me", "us", "uk", "de", "fr",
  "ru", "cn", "app", "dev", "ai", "xyz", "top", "site", "online", "club", "shop",
  "store", "link", "click", "live", "life", "support", "help", "icu", "vip", "work",
  "tech", "cloud", "page", "pro", "tv", "ly", "cc", "tk", "ml", "ga", "cf", "gq",
  "bank", "finance", "email", "services", "world", "today", "digital"
].join("|");

const LINK_PATTERN = new RegExp(
  "(?:https?:\\/\\/|www\\.)[^\\s<>\"']+" +
  "|(?<![@\\w.\\/-])(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\\.)+(?:" + LINK_TLDS + ")" +
  "(?![\\w@-])(?::\\d+)?(?:\\/[^\\s<>\"']*)?",
  "gi"
);

function extractUrls(text) {
  const matches = text.match(LINK_PATTERN) || [];

  return matches
    .map(match => match.replace(/[.,;:!?)\]}]+$/, ""))
    .filter(Boolean);
}

// Rebuilds the links list from the selection's links plus links found in the text.
function refreshUrls() {
  const all = [...new Set([...sourceUrls, ...extractUrls(messageInput.value)])]
    .filter(url => !dismissedUrls.has(url));

  renderUrls(all);
}

function renderUrls(urls = []) {
  currentUrls = urls.map(item =>
    typeof item === "string" ? item : item.url
  ).filter(Boolean);

  urlList.replaceChildren();
  urlSection.classList.toggle("hidden", currentUrls.length === 0);

  if (!currentUrls.length) return;

  urlCount.textContent = String(currentUrls.length);

  currentUrls.forEach(url => {
    const item = document.createElement("div");
    item.className = "url-item";
    item.title = url;

    const host = document.createElement("span");
    host.className = "url-host";

    const rest = document.createElement("span");
    rest.className = "url-rest";

    try {
      const hasScheme = /^https?:\/\//i.test(url);
      const parsed = new URL(hasScheme ? url : `https://${url}`);
      host.textContent = parsed.hostname;
      rest.textContent =
        (parsed.pathname + parsed.search + parsed.hash).replace(/^\/$/, "");

      if (hasScheme && parsed.protocol === "http:") {
        item.classList.add("insecure");
        host.textContent += " (not secure)";
      }
    } catch {
      host.textContent = url;
    }

    const text = document.createElement("div");
    text.className = "url-text";
    text.append(host, rest);

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "url-remove";
    remove.textContent = "Remove";
    remove.setAttribute("aria-label", `Remove ${host.textContent}`);
    remove.addEventListener("click", () => {
      dismissedUrls.add(url);
      refreshUrls();
    });

    item.append(text, remove);
    urlList.appendChild(item);
  });
}

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.classList.remove("hidden");
}

function clearError() {
  errorMessage.textContent = "";
  errorMessage.classList.add("hidden");
}

function renderItems(container, items, className) {
  container.replaceChildren();

  if (!Array.isArray(items) || items.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "Nothing to show.";
    container.appendChild(empty);
    return;
  }

  items.forEach(item => {
    const element = document.createElement("div");
    element.className = className;

    const value = typeof item === "string"
      ? item
      : item.description || item.message || item.title || "Suspicious signal";

    element.textContent = value;
    container.appendChild(element);
  });
}

function displayResults(data) {
  const rawScore = Number(data.score);
  const score = Number.isFinite(rawScore)
    ? Math.max(0, Math.min(100, rawScore))
    : 0;

  const risk = String(data.risk_level || "unknown").toLowerCase();

  document.getElementById("riskScore").textContent = score;

  document.getElementById("riskSummary").textContent =
    data.summary ||
    data.explanation ||
    "Check complete. Review what we found below.";

  resultSection.dataset.risk =
    ["high", "medium", "low"].includes(risk) ? risk : "unknown";

  document.getElementById("riskLevelLabel").textContent =
    ["high", "medium", "low"].includes(risk)
      ? `${risk[0].toUpperCase()}${risk.slice(1)} risk`
      : "Result";

  document.getElementById("scoreFill").style.width = `${score}%`;

  const findings = data.evidence || data.findings || [];

  renderItems(
    document.getElementById("findingsList"),
    findings,
    "finding"
  );

  renderItems(
    document.getElementById("recommendationsList"),
    data.recommendations || [],
    "recommendation"
  );

  resultSection.classList.remove("hidden");
  resultSection.scrollIntoView({
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth",
    block: "start"
  });
}

async function analyseContent() {
  clearError();

  const message = messageInput.value.trim();

  if (!message && currentUrls.length === 0) {
    showError("Add a message or a link to check.");
    return;
  }

  analyseBtn.disabled = true;
  analyseBtn.querySelector("span:first-child").textContent =
    "Checking…";

  resultSection.classList.add("hidden");

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message,
        urls: currentUrls.map(url => ({ url }))
      })
    });

    if (!response.ok) {
      throw new Error(`Server returned HTTP ${response.status}`);
    }

    const data = await response.json();
    displayResults(data);

  } catch (error) {
    console.error("PhishShield error:", error);

    showError(
      "Can't reach the analysis server. Make sure the backend is running at 127.0.0.1:8000."
    );

  } finally {
    analyseBtn.disabled = false;
    analyseBtn.querySelector("span:first-child").textContent =
      "Check message";
  }
}

async function loadExtensionInput() {
  if (!globalThis.chrome?.storage?.session) return;

  try {
    const stored = await chrome.storage.session.get("phishshieldInput");
    const input = stored.phishshieldInput;

    if (!input) return;

    if (input.text) {
      messageInput.value = input.text;
    }

    if (input.linkUrl) {
      sourceUrls = [input.linkUrl];
    } else if (Array.isArray(input.urls)) {
      sourceUrls = input.urls.map(item =>
        typeof item === "string" ? item : item.url
      ).filter(Boolean);
    }

    dismissedUrls.clear();
    refreshUrls();

    await chrome.storage.session.remove("phishshieldInput");

  } catch (error) {
    console.error("Input loading error:", error);
  }
}

analyseBtn.addEventListener("click", analyseContent);
messageInput.addEventListener("input", refreshUrls);

loadExtensionInput();
