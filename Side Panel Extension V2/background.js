// Set up the side panel to be available on all sites
chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setOptions({
    enabled: true
  });
});

// Store the doc ID temporarily if side panel isn't ready
let pendingDocId = null;

// Listen for tab updates to notify the side panel
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab.url) {
      chrome.runtime.sendMessage({
        type: 'TAB_CHANGED',
        url: tab.url,
        title: tab.title
      }).catch(() => {
        // Side panel might not be open yet
      });
    }
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Listen for URL changes, not just when status is complete
  if (changeInfo.url && tab.url) {
    console.log('URL changed in tab:', tab.url);
    chrome.runtime.sendMessage({
      type: 'TAB_CHANGED',
      url: tab.url,
      title: tab.title
    }).catch(() => {
      // Side panel might not be open yet
    });
  } else if (changeInfo.status === 'complete' && tab.url) {
    chrome.runtime.sendMessage({
      type: 'TAB_CHANGED',
      url: tab.url,
      title: tab.title
    }).catch(() => {
      // Side panel might not be open yet
    });
  }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'DOC_ID_FOUND') {
    console.log('Background received doc ID:', message.docId);
    // Store it temporarily
    pendingDocId = {
      docId: message.docId,
      url: message.url
    };
    
    // Try to forward to side panel
    chrome.runtime.sendMessage({
      type: 'DOC_ID_EXTRACTED',
      docId: message.docId,
      url: message.url
    }).catch(() => {
      // Side panel not ready, will send when it connects
      console.log('Side panel not ready, storing doc ID for later');
    });
  } else if (message.type === 'DOC_ID_NOT_FOUND') {
    // Forward to side panel that no doc ID was found
    chrome.runtime.sendMessage({
      type: 'DOC_ID_NOT_FOUND',
      url: message.url
    }).catch(() => {});
  } else if (message.type === 'SIDE_PANEL_READY') {
    // Side panel is ready, send any pending doc ID
    if (pendingDocId && pendingDocId.url === message.url) {
      chrome.runtime.sendMessage({
        type: 'DOC_ID_EXTRACTED',
        docId: pendingDocId.docId,
        url: pendingDocId.url
      });
      pendingDocId = null;
    }
  }
});

// Handle the extension icon click to toggle the side panel
chrome.action.onClicked.addListener((tab) => {
  // 'tab' is the active tab where the icon was clicked.
  // For a global side panel (default_path set), open it for the current window.
  chrome.sidePanel.open({ windowId: tab.windowId });
});
