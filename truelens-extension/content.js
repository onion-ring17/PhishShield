
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type !== "GET_SELECTION_DATA") return;

  const selectedText = window.getSelection()?.toString().trim() || "";
  const selection = window.getSelection();
  const urls = new Set();

  if (selection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);

    document.querySelectorAll("a[href]").forEach(anchor => {
      try {
        if (range.intersectsNode(anchor)) {
          urls.add(anchor.href);
        }
      } catch {
        // Ignore nodes that cannot be intersected.
      }
    });
  }

  sendResponse({
    text: selectedText,
    urls: [...urls]
  });

  return true;
});
