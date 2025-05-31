// Wrap everything in an IIFE to avoid redeclaration errors
(function() {
  // Check if we've already injected this script
  if (window.__docIdExtractorInjected) {
    return;
  }
  window.__docIdExtractorInjected = true;

  console.log('Doc ID extractor content script loaded');

  // Keep track of whether we've already found and sent the doc ID
  let docIdFound = false;
  let lastFoundDocId = null;
  let currentUrl = window.location.href;
  let userRequestedScan = false; // Track if this is a user-requested scan

  // Function to find the Docid value - from multiple possible elements
  function extractDocId() {
    console.log('Starting Doc ID extraction...');
    
    // Debug: log all elements on page with attrkey attribute
    const allAttrKeyElements = document.querySelectorAll('[attrkey]');
    console.log('Found', allAttrKeyElements.length, 'elements with attrkey attribute');
    allAttrKeyElements.forEach(el => {
      console.log('Element with attrkey:', el.getAttribute('attrkey'), 'text:', el.textContent.trim());
    });
    
    // First, try the new element structure with attrkey="DocumentNumber"
    console.log('Looking for element with attrkey="DocumentNumber"...');
    // Use a more flexible selector that matches any element with attrkey="DocumentNumber"
    const docNumberElement = document.querySelector('[attrkey="DocumentNumber"]');
    if (docNumberElement) {
      console.log('Found DocumentNumber element:', docNumberElement);
      const value = (docNumberElement.textContent || '').trim();
      console.log('Raw text content:', docNumberElement.textContent);
      console.log('Trimmed value:', value);
      if (value && value.length > 0) {
        console.log('Found Doc ID via DocumentNumber element:', value);
        return value;
      } else {
        console.log('DocumentNumber element found but has no text content');
      }
    } else {
      console.log('No element found with attrkey="DocumentNumber"');
    }
    
    // Fallback: look for the specific element with id "rdvtxtMDdocid"
    console.log('Looking for specific element with id "rdvtxtMDdocid"...');
    const specificElement = document.getElementById('rdvtxtMDdocid');
    if (specificElement) {
      // Get value from the value attribute (for input elements) or textContent as fallback
      const value = (specificElement.value || specificElement.textContent || '').trim();
      if (value && value.length > 0) {
        // Check if the Docid starts with "PG"
        if (value.startsWith('PG')) {
          console.log('Found valid Doc ID via specific element rdvtxtMDdocid (starts with PG):', value);
          return value;
        } else {
          console.log('Found Doc ID but it does not start with "PG":', value);
          return null;
        }
      }
    }
    
    console.log('No valid Doc ID found in any known elements');
    return null;
  }

  // Function to extract and send doc ID
  function extractAndSendDocId(isUserRequested = false) {
    console.log('extractAndSendDocId called, userRequested:', isUserRequested);
    try {
      const docId = extractDocId();
      if (docId && docId !== lastFoundDocId) {
        lastFoundDocId = docId;
        docIdFound = true;
        console.log('Doc ID found:', docId);
        
        chrome.runtime.sendMessage({
          type: 'DOC_ID_FOUND',
          docId: docId,
          url: window.location.href
        }).then(() => {
          console.log('Doc ID sent successfully');
        }).catch(err => {
          console.log('Error sending doc ID:', err);
        });
      } else if (!docId && isUserRequested) {
        // Only send "not found" message if this was a user-requested scan
        console.log('No Doc ID found, sending not found message (user requested)');
        chrome.runtime.sendMessage({
          type: 'DOC_ID_NOT_FOUND',
          url: window.location.href
        }).catch(err => {
          console.log('Error sending not found message:', err);
        });
      } else if (!docId) {
        console.log('No Doc ID found during automatic polling (not sending message)');
      }
    } catch (error) {
      console.error('Error in extractAndSendDocId:', error);
      if (isUserRequested) {
        chrome.runtime.sendMessage({
          type: 'DOC_ID_NOT_FOUND',
          url: window.location.href
        }).catch(err => {
          console.log('Error sending error message:', err);
        });
      }
    }
  }

  // Function to reset state when URL changes (for SPAs)
  function handleUrlChange() {
    const newUrl = window.location.href;
    if (newUrl !== currentUrl) {
      console.log('URL changed from', currentUrl, 'to', newUrl);
      currentUrl = newUrl;
      lastFoundDocId = null;
      docIdFound = false;
      
      // Extract Doc ID after a short delay to allow content to load
      setTimeout(() => {
        extractAndSendDocId(false); // Not user requested
      }, 500);
    }
  }

  // Initial extraction when script loads
  console.log('Running initial Doc ID extraction');
  setTimeout(() => {
    extractAndSendDocId(false); // Not user requested
  }, 500);

  // Add continuous polling as a fallback for dynamic content
  let pollingInterval = setInterval(() => {
    // Only poll if we haven't found a Doc ID yet or if the URL has changed
    if (!docIdFound || window.location.href !== currentUrl) {
      console.log('Polling for Doc ID...');
      extractAndSendDocId(false); // Not user requested
    }
  }, 1000); // Poll every 1 second for faster detection

  // Listen for requests to extract doc ID
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Content script received message:', message);
    if (message.type === 'EXTRACT_DOC_ID') {
      console.log('Extracting Doc ID on request');
      extractAndSendDocId(true); // User requested
      sendResponse({ status: 'extraction_started' });
    }
    return true; // Keep message channel open for async response
  });

  // Watch for dynamic content changes - enhanced for SPAs
  const observer = new MutationObserver((mutations) => {
    let shouldReextract = false;
    
    // Check if any mutations are significant enough to warrant re-extraction
    for (let mutation of mutations) {
      // Check for added nodes that might contain the specific element
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        for (let node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check if added element is or contains the rdvtxtMDdocid element
            if (node.id === 'rdvtxtMDdocid' || 
                (node.querySelector && node.querySelector('#rdvtxtMDdocid'))) {
              shouldReextract = true;
              console.log('rdvtxtMDdocid element added, will re-extract Doc ID');
              break;
            }
            // Check if added element is or contains the DocumentNumber element
            if ((node.getAttribute && node.getAttribute('attrkey') === 'DocumentNumber') ||
                (node.querySelector && node.querySelector('[attrkey="DocumentNumber"]'))) {
              shouldReextract = true;
              console.log('DocumentNumber element added, will re-extract Doc ID');
              break;
            }
          }
        }
      }
      
      // Check for text content changes in the specific element
      if (mutation.type === 'childList' && mutation.target.id === 'rdvtxtMDdocid') {
        shouldReextract = true;
        console.log('rdvtxtMDdocid content changed, will re-extract Doc ID');
      }
      
      // Check for text content changes in DocumentNumber element
      if (mutation.type === 'childList' && mutation.target.getAttribute && 
          mutation.target.getAttribute('attrkey') === 'DocumentNumber') {
        shouldReextract = true;
        console.log('DocumentNumber content changed, will re-extract Doc ID');
      }
      
      // Also watch for characterData changes (text content updates)
      if (mutation.type === 'characterData' && mutation.target.parentElement && 
          mutation.target.parentElement.id === 'rdvtxtMDdocid') {
        shouldReextract = true;
        console.log('rdvtxtMDdocid text content changed, will re-extract Doc ID');
      }
    }
    
    if (shouldReextract) {
      // Reset docIdFound to allow re-detection
      docIdFound = false;
      // Shorter debounce for faster response to changes
      clearTimeout(observer.timeout);
      observer.timeout = setTimeout(() => {
        console.log('DOM changed significantly, re-extracting Doc ID');
        extractAndSendDocId(false); // Not user requested
      }, 100); // Reduced delay for faster response
    }
  });

  // Start observing the document for changes
  if (document.body) {
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: true // Watch for text content changes
    });
  }

  // Watch for URL changes (for SPAs)
  let urlCheckInterval = setInterval(handleUrlChange, 1000);

  // Also listen for popstate events (back/forward navigation)
  window.addEventListener('popstate', handleUrlChange);

  // Listen for pushstate/replacestate (programmatic navigation)
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;
  
  history.pushState = function() {
    originalPushState.apply(history, arguments);
    setTimeout(handleUrlChange, 100);
  };
  
  history.replaceState = function() {
    originalReplaceState.apply(history, arguments);
    setTimeout(handleUrlChange, 100);
  };

  // Watch for visibility changes (when overlays show/hide content)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      console.log('Page became visible, re-extracting Doc ID');
      setTimeout(() => {
        extractAndSendDocId(false); // Not user requested
      }, 300);
    }
  });

  // Watch for focus events (when user switches back to tab)
  window.addEventListener('focus', () => {
    console.log('Window gained focus, re-extracting Doc ID');
    setTimeout(() => {
      extractAndSendDocId(false); // Not user requested
    }, 300);
  });

  console.log('Doc ID extractor content script initialized - looking for DocumentNumber element and rdvtxtMDdocid element');
})();
