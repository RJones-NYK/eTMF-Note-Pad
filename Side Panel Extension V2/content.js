// Content script for detecting TMF artifacts on web pages

// Complete TMF artifact data - subset shown, replace with full data from data.js
const artifactData = [
  {
    "Zone #": 1,
    "Zone Name": "Trial Management",
    "Section #": 1.01,
    "Section Name": "Trial Oversight",
    "Artifact #": "01.01.01",
    "Artifact name": "Trial Master File Plan",
    "Definition / Purpose": "To describe how records for the trial will be managed and stored during and after the trial, including study-specific processes and documentation for archiving and destruction. To include TMF filing structure to be used. May include TMF content list, filing structure and chain of custody records. Artifact can include any evidence of plan execution including, but not limited to: plan, reports, checklists, etc.",
    "Dating Convention": "Version Date"
  },
  {
    "Zone #": 1,
    "Zone Name": "Trial Management",
    "Section #": 1.01,
    "Section Name": "Trial Oversight",
    "Artifact #": "01.01.13",
    "Artifact name": "Investigator Newsletter",
    "Definition / Purpose": "To inform investigative staff of common implementation issues and of the progress of the trial.",
    "Dating Convention": "Document Date"
  },
  {
    "Zone #": 1,
    "Zone Name": "Trial Management",
    "Section #": 1.05,
    "Section Name": "General",
    "Artifact #": "01.05.01",
    "Artifact name": "Relevant Communications",
    "Definition / Purpose": "Zone-specific agreements, significant discussions or relevant information, but not specifically listed in this Reference Model. Types of correspondence may include, but are not limited to: letters, memo, electronic communications and faxes. Correspondence referring to general topics and/or topics across multiple zones may be filed with this zone",
    "Dating Convention": "Correspondence Date"
  },
  {
    "Zone #": 5,
    "Zone Name": "Regulatory",
    "Section #": 5.02,
    "Section Name": "Investigator Information",
    "Artifact #": "05.02.08",
    "Artifact name": "Form FDA 1572",
    "Definition / Purpose": "Statement of Investigator form for US FDA submissions. This form contains information about the investigator's qualifications and the clinical trial agreement.",
    "Dating Convention": "Form Date"
  }
  // NOTE: Replace this array with the complete 250 artifacts from data.js
];

// Function to find matching artifact
function findMatchingArtifact(text) {
  if (!text) return null;
  
  const trimmedText = text.trim();
  
  // Try to match artifact based on different formats
  return artifactData.find(artifact => {
    const artifactNum = artifact["Artifact #"];
    const artifactName = artifact["Artifact name"];
    
    // Check for exact match with full format (e.g., "01.01.13 Investigator Newsletter")
    if (trimmedText === `${artifactNum} ${artifactName}`) return true;
    
    // Check for artifact number only (e.g., "01.01.13")
    if (trimmedText === artifactNum) return true;
    
    // Check for artifact name only (e.g., "Investigator Newsletter")
    if (trimmedText === artifactName) return true;
    
    // Check if text contains artifact number and name
    if (trimmedText.includes(artifactNum) && trimmedText.includes(artifactName)) return true;
    
    return false;
  });
}

// Main detection function
function detectArtifacts() {
  console.log('TMF Detector: Starting artifact detection...');
  
  // Find all span elements with data-attributename="artifact"
  const artifactElements = document.querySelectorAll('span[data-attributename="artifact"]');
  console.log(`TMF Detector: Found ${artifactElements.length} artifact elements`);
  
  let foundArtifact = false;
  
  artifactElements.forEach((element, index) => {
    const text = element.textContent || element.innerText;
    console.log(`TMF Detector: Checking element ${index + 1}: "${text}"`);
    
    if (text) {
      const matchingArtifact = findMatchingArtifact(text);
      
      if (matchingArtifact) {
        console.log(`TMF Detector: Found matching artifact: ${matchingArtifact["Artifact name"]}`);
        foundArtifact = true;
        
        // Highlight the element
        element.style.backgroundColor = '#ffeb3b';
        element.style.padding = '2px 4px';
        element.style.borderRadius = '3px';
        element.style.cursor = 'pointer';
        element.classList.add('tmf-artifact-highlight');
        
        // Store artifact data on element
        element.setAttribute('data-tmf-artifact', JSON.stringify(matchingArtifact));
        
        // Send to extension
        chrome.runtime.sendMessage({
          action: 'artifactDetected',
          artifact: {
            name: matchingArtifact["Artifact name"],
            number: matchingArtifact["Artifact #"],
            definition: matchingArtifact["Definition / Purpose"],
            datingConvention: matchingArtifact["Dating Convention"],
            zone: `${matchingArtifact["Zone #"]} - ${matchingArtifact["Zone Name"]}`,
            section: `${matchingArtifact["Section #"]} - ${matchingArtifact["Section Name"]}`,
            detectedText: text
          }
        });
      } else {
        console.log(`TMF Detector: No match found for: "${text}"`);
      }
    }
  });
  
  // If no artifacts found, clear the display
  if (!foundArtifact) {
    console.log('TMF Detector: No artifacts detected on page');
    chrome.runtime.sendMessage({
      action: 'artifactDetected',
      artifact: null
    });
  }
}

// Add click handler for highlighted artifacts
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('tmf-artifact-highlight')) {
    const artifactData = e.target.getAttribute('data-tmf-artifact');
    if (artifactData) {
      const artifact = JSON.parse(artifactData);
      chrome.runtime.sendMessage({
        action: 'artifactDetected',
        artifact: {
          name: artifact["Artifact name"],
          number: artifact["Artifact #"],
          definition: artifact["Definition / Purpose"],
          datingConvention: artifact["Dating Convention"],
          zone: `${artifact["Zone #"]} - ${artifact["Zone Name"]}`,
          section: `${artifact["Section #"]} - ${artifact["Section Name"]}`,
          detectedText: e.target.textContent
        }
      });
    }
  }
});

// Listen for messages from extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'detectArtifacts') {
    detectArtifacts();
    sendResponse({ status: 'detection complete' });
  }
  return true;
});

// Run detection when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(detectArtifacts, 500);
  });
} else {
  setTimeout(detectArtifacts, 500);
}

// Monitor DOM changes for dynamically loaded content
const observer = new MutationObserver((mutations) => {
  // Check if any new artifact elements were added
  let shouldRedetect = false;
  
  mutations.forEach(mutation => {
    mutation.addedNodes.forEach(node => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        if (node.matches && node.matches('span[data-attributename="artifact"]')) {
          shouldRedetect = true;
        } else if (node.querySelector && node.querySelector('span[data-attributename="artifact"]')) {
          shouldRedetect = true;
        }
      }
    });
  });
  
  if (shouldRedetect) {
    setTimeout(detectArtifacts, 100);
  }
});

// Start observing
observer.observe(document.body, {
  childList: true,
  subtree: true
});