
chrome.runtime.onInstalled.addListener(async () => {
  // Configure the extension's side panel.
  await chrome.sidePanel.setOptions({
    path: "sidepanel/sidepanel.html",
    enabled: true
  });

  // Create the right-click menu items.
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "phishshield-selection",
      title: "Inspect with PhishShield",
      contexts: ["selection"]
    });

    chrome.contextMenus.create({
      id: "phishshield-link",
      title: "Inspect link with PhishShield",
      contexts: ["link"]
    });
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab?.id) return;

  // Prepare the information first.
  const input = {
    text: info.selectionText || "",
    linkUrl: info.linkUrl || "",
    urls: info.linkUrl ? [info.linkUrl] : []
  };

  // IMPORTANT: Open the panel immediately during the click event.
  const openingPanel = chrome.sidePanel.open({
    tabId: tab.id
  });

  // Save the selected content after initiating the panel opening.
  chrome.storage.session.set({
    phishshieldInput: input
  }).catch(error => {
    console.error("PhishShield storage error:", error);
  });

  openingPanel.catch(error => {
    console.error("PhishShield side panel error:", error);
  });
});
