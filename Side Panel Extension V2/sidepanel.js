let currentUrl = '';
let currentDomain = '';

// Get current tab URL when side panel opens
async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) {
    currentUrl = tab.url;
    currentDomain = new URL(tab.url).hostname;
    document.getElementById('currentUrl').textContent = currentUrl;
    loadNotes();
  }
}

// Load notes for current URL
async function loadNotes() {
  console.log('Loading notes for URL:', currentUrl);
  const result = await chrome.storage.local.get([currentUrl]);
  const notes = result[currentUrl];
  
  if (notes && notes.content) {
    // Always show existing notes when revisiting a URL
    console.log('Found existing notes for this URL:', notes.content.substring(0, 50) + '...');
    document.getElementById('notesTextarea').value = notes.content;
  } else {
    console.log('No existing notes found for this URL');
    document.getElementById('notesTextarea').value = '';
  }
  
  // Don't automatically check for doc ID anymore
  // User will click the button when needed
}

// Request doc ID extraction from current tab
async function requestDocIdExtraction() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.id && tab.url && tab.url.startsWith('http')) {
      chrome.tabs.sendMessage(tab.id, { type: 'EXTRACT_DOC_ID' })
        .catch(() => {
          // Page might not have content script yet, that's ok
        });
    }
  } catch (error) {
    // Ignore errors
  }
}

// Save notes with auto-save functionality
let saveTimeout;
async function saveNotes(showIndicator = true) {
  const content = document.getElementById('notesTextarea').value;
  
  if (!currentUrl) return;
  
  // Save the note
  const noteData = {
    content: content,
    url: currentUrl,
    domain: currentDomain,
    timestamp: Date.now(),
    title: document.title || currentUrl
  };
  
  await chrome.storage.local.set({ [currentUrl]: noteData });
  
  // Update recent notes list
  await updateRecentNotes(currentUrl, noteData);
  
  if (showIndicator) {
    showSaveIndicator();
  }
}

// Update recent notes list
async function updateRecentNotes(url, noteData) {
  const result = await chrome.storage.local.get(['recentNotes', 'favoriteNotes']);
  let recentNotes = result.recentNotes || [];
  const favoriteNotes = result.favoriteNotes || [];
  
  // Check if this note was previously favorited
  const wasFavorited = favoriteNotes.includes(url);
  
  // Remove existing entry for this URL if present
  recentNotes = recentNotes.filter(note => note.url !== url);
  
  // Always add to beginning of list when a save is made
  recentNotes.unshift({
    url: url,
    domain: noteData.domain,
    content: noteData.content || '',
    timestamp: noteData.timestamp,
    title: noteData.title,
    isFavorited: wasFavorited
  });
  
  // Keep only last 50 entries (increased for better grouping)
  recentNotes = recentNotes.slice(0, 50);
  
  await chrome.storage.local.set({ recentNotes });
}

// Show save indicator
function showSaveIndicator() {
  const indicator = document.getElementById('saveIndicator');
  indicator.classList.add('show');
  setTimeout(() => {
    indicator.classList.remove('show');
  }, 2000);
}

// Download notes as text file
function downloadNotes() {
  const content = document.getElementById('notesTextarea').value;
  const filename = `notes_${currentDomain}_${new Date().toISOString().split('T')[0]}.txt`;
  
  const blob = new Blob([`URL: ${currentUrl}\nDate: ${new Date().toLocaleString()}\n\n${content}`], 
    { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Clear notes for current URL
async function clearNotes() {
  if (confirm('Are you sure you want to clear notes for this page?')) {
    document.getElementById('notesTextarea').value = '';
    await chrome.storage.local.remove([currentUrl]);
    
    // Also remove from recent notes
    const result = await chrome.storage.local.get(['recentNotes']);
    let recentNotes = result.recentNotes || [];
    recentNotes = recentNotes.filter(note => note.url !== currentUrl);
    await chrome.storage.local.set({ recentNotes });
  }
}

// Clear all recent notes
async function clearAllNotes() {
  if (confirm('Are you sure you want to clear ALL recent notes? This action cannot be undone.')) {
    // Clear the recent notes list
    await chrome.storage.local.set({ recentNotes: [] });
    
    // Refresh the recent notes display
    loadRecentNotes();
    
    // Show confirmation
    showSaveIndicator();
  }
}

// Load and display recent notes
async function loadRecentNotes() {
  const result = await chrome.storage.local.get(['recentNotes', 'favoriteNotes']);
  const recentNotes = result.recentNotes || [];
  const favoriteNotes = result.favoriteNotes || [];
  
  const container = document.getElementById('recentNotesList');
  
  if (recentNotes.length === 0) {
    container.innerHTML = '<div class="empty-state">No recent notes yet</div>';
    return;
  }
  
  // Update favorited status
  recentNotes.forEach(note => {
    note.isFavorited = favoriteNotes.includes(note.url);
  });
  
  // Group notes by age
  const now = Date.now();
  const groups = {
    favorites: [],
    today: [],
    yesterday: [],
    thisWeek: [],
    older: []
  };
  
  recentNotes.forEach(note => {
    const age = now - note.timestamp;
    const days = age / (1000 * 60 * 60 * 24);
    
    if (note.isFavorited) {
      groups.favorites.push(note);
    } else if (days < 1) {
      groups.today.push(note);
    } else if (days < 2) {
      groups.yesterday.push(note);
    } else if (days < 7) {
      groups.thisWeek.push(note);
    } else {
      groups.older.push(note);
    }
  });
  
  // Build HTML for grouped notes
  let html = '';
  
  const renderGroup = (title, notes) => {
    if (notes.length === 0) return '';
    
    return `
      <div class="recent-notes-group">
        <div class="recent-notes-group-title">${title}</div>
        ${notes.map(note => {
          const date = new Date(note.timestamp).toLocaleString();
          const preview = note.content.substring(0, 100) + (note.content.length > 100 ? '...' : '');
          
          return `
            <div class="recent-note-item ${note.isFavorited ? 'favorited' : ''}" data-url="${note.url}">
              <div class="recent-note-actions">
                <button class="note-action-btn favorite-btn ${note.isFavorited ? 'active' : ''}" 
                        data-url="${note.url}" title="Favorite">⭐</button>
                <button class="note-action-btn delete-btn" 
                        data-url="${note.url}" title="Delete">✕</button>
              </div>
              <div class="recent-note-url">${note.domain}</div>
              <div class="recent-note-preview">${preview}</div>
              <div class="recent-note-date">${date}</div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  };
  
  html += renderGroup('Favorites', groups.favorites);
  html += renderGroup('Today', groups.today);
  html += renderGroup('Yesterday', groups.yesterday);
  html += renderGroup('This Week', groups.thisWeek);
  html += renderGroup('Older', groups.older);
  
  container.innerHTML = html || '<div class="empty-state">No recent notes yet</div>';
}

// Tab switching
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    
    const tabName = tab.dataset.tab;
    if (tabName === 'notes') {
      document.getElementById('notesTab').style.display = 'flex';
      document.getElementById('recentTab').classList.remove('active');
    } else {
      document.getElementById('notesTab').style.display = 'none';
      document.getElementById('recentTab').classList.add('active');
      loadRecentNotes();
    }
  });
});

// Scan for Doc ID when button is clicked
async function scanForDocId() {
  console.log('Doc ID scan requested');
  
  // Show user feedback that scanning is starting
  const docIdBtn = document.getElementById('docIdBtn');
  const originalText = docIdBtn.textContent;
  docIdBtn.textContent = 'Scanning...';
  docIdBtn.disabled = true;
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    console.log('Current tab:', tab);
    
    if (!tab || !tab.id || !tab.url) {
      throw new Error('No active tab found');
    }
    
    if (!tab.url.startsWith('http')) {
      throw new Error('Cannot scan this type of page (must be http/https)');
    }
    
    // Always inject fresh content script to ensure latest code
    console.log('Injecting content script...');
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['script.js']
      });
      console.log('Content script injected successfully');
    } catch (injectionError) {
      console.log('Content script injection error (may already be injected):', injectionError);
      // Continue anyway, script might already be there
    }
    
    // Set up a timeout for the operation
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Scan timeout - no response from page')), 10000);
    });
    
    // Send message to content script
    console.log('Sending extract message to content script...');
    const messagePromise = chrome.tabs.sendMessage(tab.id, { type: 'EXTRACT_DOC_ID' });
    
    // Race between timeout and message response
    try {
      const response = await Promise.race([messagePromise, timeoutPromise]);
      console.log('Content script response:', response);
    } catch (messageError) {
      console.error('Error communicating with content script:', messageError);
      // Don't throw here - the content script might still find and send the doc ID via background script
    }
    
    // Wait a bit longer for the doc ID to be found and sent via background script
    await new Promise(resolve => setTimeout(resolve, 2000));
    
  } catch (error) {
    console.error('Error scanning for Doc ID:', error);
    
    let errorMessage = 'Error scanning page. ';
    if (error.message.includes('Cannot scan this type of page')) {
      errorMessage = 'Cannot scan this type of page. Please navigate to a webpage (http/https).';
    } else if (error.message.includes('No active tab')) {
      errorMessage = 'No active tab found. Please make sure you have a webpage open.';
    } else if (error.message.includes('timeout')) {
      errorMessage = 'Scan timed out. The page may be loading or the Doc ID may not be visible. Please try again.';
    } else {
      errorMessage += 'Please make sure the page is fully loaded and try again.';
    }
    
    alert(errorMessage);
  } finally {
    // Reset button state
    docIdBtn.textContent = originalText;
    docIdBtn.disabled = false;
  }
}

// Handle Pass button click
async function handlePassClick() {
  const textarea = document.getElementById('notesTextarea');
  const currentContent = textarea.value;
  const passText = "No issues detected";
  
  // Add the pass text to the textarea
  if (currentContent.trim()) {
    textarea.value = currentContent + '\n' + passText;
  } else {
    textarea.value = passText;
  }
  
  // Save the notes automatically
  await saveNotes(true);
}

// Handle Issue button click
async function handleIssueClick() {
  const textarea = document.getElementById('notesTextarea');
  const currentContent = textarea.value;
  const issueText = "Issue detected, a QI should be raised\nPlease describe the issue for later:\n";
  
  // Add the issue text to the textarea
  if (currentContent.trim()) {
    textarea.value = currentContent + '\n' + issueText;
  } else {
    textarea.value = issueText;
  }
  
  // Focus the textarea and position cursor at the end
  textarea.focus();
  textarea.setSelectionRange(textarea.value.length, textarea.value.length);
  
  // Save the notes automatically
  await saveNotes(true);
}

// Toggle URL visibility
function toggleUrl() {
  const urlToggle = document.getElementById('urlToggle');
  const currentUrl = document.getElementById('currentUrl');
  
  urlToggle.classList.toggle('expanded');
  currentUrl.classList.toggle('show');
  
  // Update button text
  urlToggle.textContent = urlToggle.classList.contains('expanded') ? 'Hide URL' : 'Show URL';
}

// Handle clicks in recent notes list
document.getElementById('recentNotesList').addEventListener('click', async (e) => {
  // Handle favorite button click
  if (e.target.classList.contains('favorite-btn')) {
    e.stopPropagation();
    const url = e.target.dataset.url;
    await toggleFavorite(url);
    await loadRecentNotes(); // Refresh the list
    return;
  }
  
  // Handle delete button click
  if (e.target.classList.contains('delete-btn')) {
    e.stopPropagation();
    const url = e.target.dataset.url;
    await deleteRecentNote(url);
    await loadRecentNotes(); // Refresh the list
    return;
  }
  
  // Handle note item click (navigate to URL)
  const noteItem = e.target.closest('.recent-note-item');
  if (noteItem && !e.target.closest('.recent-note-actions')) {
    const url = noteItem.dataset.url;
    chrome.tabs.create({ url });
  }
});

// Toggle favorite status
async function toggleFavorite(url) {
  const result = await chrome.storage.local.get(['favoriteNotes', 'recentNotes']);
  let favoriteNotes = result.favoriteNotes || [];
  let recentNotes = result.recentNotes || [];
  
  const index = favoriteNotes.indexOf(url);
  if (index > -1) {
    // Remove from favorites
    favoriteNotes.splice(index, 1);
  } else {
    // Add to favorites
    favoriteNotes.push(url);
  }
  
  // Update the isFavorited flag in recent notes
  recentNotes.forEach(note => {
    if (note.url === url) {
      note.isFavorited = index === -1;
    }
  });
  
  await chrome.storage.local.set({ favoriteNotes, recentNotes });
}

// Delete a recent note
async function deleteRecentNote(url) {
  if (!confirm('Are you sure you want to delete this note from recent history?')) {
    return;
  }
  
  const result = await chrome.storage.local.get(['recentNotes', 'favoriteNotes']);
  let recentNotes = result.recentNotes || [];
  let favoriteNotes = result.favoriteNotes || [];
  
  // Remove from recent notes
  recentNotes = recentNotes.filter(note => note.url !== url);
  
  // Also remove from favorites if it was favorited
  favoriteNotes = favoriteNotes.filter(favUrl => favUrl !== url);
  
  await chrome.storage.local.set({ recentNotes, favoriteNotes });
}

// Event listeners
document.getElementById('saveBtn').addEventListener('click', () => saveNotes());
document.getElementById('docIdBtn').addEventListener('click', scanForDocId);
document.getElementById('downloadBtn').addEventListener('click', downloadNotes);
document.getElementById('clearBtn').addEventListener('click', clearNotes);
document.getElementById('clearAllBtn').addEventListener('click', clearAllNotes);
document.getElementById('passBtn').addEventListener('click', handlePassClick);
document.getElementById('issueBtn').addEventListener('click', handleIssueClick);
document.getElementById('urlToggle').addEventListener('click', toggleUrl);

// Auto-save on input with debouncing
document.getElementById('notesTextarea').addEventListener('input', () => {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => saveNotes(false), 1000);
});

// Listen for tab changes and doc ID extractions
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Side panel received message:', message);
  
  if (message.type === 'TAB_CHANGED') {
    currentUrl = message.url;
    currentDomain = new URL(message.url).hostname;
    document.getElementById('currentUrl').textContent = currentUrl;
    loadNotes();
  } else if (message.type === 'DOC_ID_EXTRACTED' && message.url === currentUrl) {
    // Add the doc ID to the beginning of notes if not already present
    console.log('Doc ID extracted:', message.docId);
    handleDocIdExtraction(message.docId);
  } else if (message.type === 'DOC_ID_NOT_FOUND' && message.url === currentUrl) {
    // No doc ID found on the page
    console.log('Doc ID not found on page');
    alert('No valid Doc ID found on this page. Make sure the Doc ID element is visible on the page and try scrolling to reveal it.');
  }
});

// Handle extracted doc ID
async function handleDocIdExtraction(docId) {
  const textarea = document.getElementById('notesTextarea');
  const currentContent = textarea.value;
  const docIdPrefix = `Doc ID: ${docId}\n\n`;
  
  // Check if this doc ID is already at the start of the notes
  if (!currentContent.startsWith(docIdPrefix)) {
    // If there's existing content, preserve it
    if (currentContent.trim()) {
      // Check if there's a different doc ID at the start
      const existingDocIdMatch = currentContent.match(/^Doc ID: .+\n\n/);
      if (existingDocIdMatch) {
        // Replace the old doc ID with the new one
        textarea.value = currentContent.replace(existingDocIdMatch[0], docIdPrefix);
      } else {
        // Add doc ID to the beginning
        textarea.value = docIdPrefix + currentContent;
      }
    } else {
      // No existing content, just add the doc ID
      textarea.value = docIdPrefix;
    }
    
    // Save the updated notes immediately and disable auto-save temporarily
    clearTimeout(saveTimeout);
    await saveNotes(true);
    
    // Re-enable auto-save after a delay
    setTimeout(() => {
      saveTimeout = null;
    }, 1000);
    
    // Show success feedback
    showSaveIndicator();
  }
}

// Initialize - notify background that side panel is ready
async function initialize() {
  await getCurrentTab();
  
  // Notify background script that side panel is ready
  if (currentUrl) {
    chrome.runtime.sendMessage({
      type: 'SIDE_PANEL_READY',
      url: currentUrl
    }).catch(() => {});
  }
  
  // Set up more frequent check to ensure we stay in sync with the current tab
  setInterval(async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url && tab.url !== currentUrl) {
      console.log('URL changed detected via polling:', tab.url);
      currentUrl = tab.url;
      currentDomain = new URL(tab.url).hostname;
      document.getElementById('currentUrl').textContent = currentUrl;
      loadNotes();
    }
  }, 500); // Check every 500ms for faster detection
  
  // Also set up a more frequent check specifically for URL changes
  let lastCheckedUrl = currentUrl;
  setInterval(async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.url && tab.url !== lastCheckedUrl) {
        console.log('Fast URL change detected:', tab.url);
        lastCheckedUrl = tab.url;
        currentUrl = tab.url;
        currentDomain = new URL(tab.url).hostname;
        document.getElementById('currentUrl').textContent = currentUrl;
        loadNotes();
      }
    } catch (error) {
      // Ignore errors in polling
    }
  }, 250); // Check every 250ms for very fast detection
}

// Initialize
initialize();
