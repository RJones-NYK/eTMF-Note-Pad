eTMF Note Pad Chrome Extension
A Chrome extension designed for clinical trial professionals to efficiently take notes and manage Trial Master File (TMF) documentation across web pages.
🎯 Overview
eTMF Note Pad provides a persistent side panel for note-taking with specialized features for clinical trial document management. The extension automatically detects document IDs and TMF artifacts, making it easier to track and annotate trial documentation.
✨ Features
📝 Note Taking

Per-URL Notes: Automatically saves notes for each webpage you visit
Three Note Categories:

Doc ID: Single-line field for document identifiers
Status: Multi-line field for detailed status notes
Self Evident Correction: Single-line field with increment/decrement controls


Auto-save: Notes are automatically saved as you type (1-second debounce)
Quick Actions:

"Pass" button - Sets standard "no issues" status
"Issue" button - Sets standard "issue detected" status



🔍 Document ID Detection

Automatic Extraction: Scans web pages for document IDs
Multiple Selectors:

Primary: [attrkey="DocumentNumber"] elements
Fallback: #rdvtxtMDdocid element


Validation: Ensures Doc IDs start with "PG" prefix
Manual Trigger: "Doc ID" button to manually scan current page
Dynamic Content: Monitors DOM changes for single-page applications

📋 TMF Artifact Recognition

Database: Includes 250+ TMF artifacts from clinical trial reference model
Auto-highlighting: Detects and highlights TMF artifacts on web pages
Comprehensive Coverage: 11 zones including Trial Management, Regulatory, Site Management, etc.

📚 Recent Notes Management

Age-based Grouping:

Favorites (⭐)
Today
Yesterday
This Week
Older


Favorites System: Star important notes to pin them at the top
Individual Actions: Delete or favorite individual notes
Storage Limit: Maintains up to 50 recent notes
Quick Navigation: Click notes to open URLs in new tabs

📊 Export & Management

CSV Export: Export all recent notes with timestamps
Bulk Operations: Clear all notes functionality
Download: Export individual page notes as text files
Persistent Storage: Uses Chrome's local storage API

🎨 User Experience

Dark/Light Theme: Toggle between themes
Responsive Design: Works across different screen sizes
Smooth Animations: Polished transitions and hover effects
Keyboard Accessibility: Proper focus states and navigation
Visual Feedback: Save indicators and loading states

🚀 Installation
Option 1: Chrome Web Store (Recommended)
[Add Chrome Web Store link when published]
Option 2: Developer Mode Installation

Download or clone this repository
Open Chrome and navigate to chrome://extensions/
Enable "Developer mode" in the top right
Click "Load unpacked" and select the extension folder
The extension icon will appear in your Chrome toolbar

📖 Usage
Getting Started

Click the extension icon in Chrome toolbar to open the side panel
Navigate to any webpage
The extension will automatically detect the current URL
Start taking notes in the three provided fields

Taking Notes

Doc ID: Use the "Doc ID" button to automatically extract document IDs from the page
Status: Use "Pass" or "Issue" buttons for quick status updates, or type custom notes
Correction: Enter correction details or use +/- buttons for numeric values
Notes auto-save as you type

Managing Recent Notes

Switch to the "Recent Notes" tab
Browse notes organized by time groups
Star (⭐) important notes to add to favorites
Delete (✕) individual notes as needed
Export all notes using the "Export .CSV" button

Theme Customization

Toggle between light and dark themes using the switch in the header
Theme preference is saved and persists across browser sessions

🏗️ Technical Architecture
File Structure
├── manifest.json          # Extension configuration
├── background.js          # Service worker for tab management
├── sidepanel.html         # Main UI layout
├── sidepanel.js           # Side panel functionality
├── script.js              # Content script for Doc ID extraction
├── content.js             # TMF artifact detection
├── data.js                # TMF artifact database
├── test.html              # Test page for Doc ID extraction
└── test-recents.html      # Test page for recent notes features
Key Technologies

Manifest V3: Latest Chrome extension standard
Chrome Storage API: Persistent local storage
Content Scripts: Page content analysis and injection
Side Panel API: Modern Chrome extension UI pattern
MutationObserver: Dynamic content monitoring

Permissions Required

storage: For saving notes and preferences
tabs: For URL detection and tab management
sidePanel: For the persistent side panel interface
scripting: For content script injection
<all_urls>: For universal webpage access

🔧 Development
Prerequisites

Chrome browser (version 114+)
Basic knowledge of JavaScript, HTML, CSS

Local Development

Clone the repository:
bashgit clone [repository-url]
cd etmf-note-pad

Load in Chrome:

Open chrome://extensions/
Enable Developer mode
Click "Load unpacked"
Select the project folder


Test the extension:

Open test.html to test Doc ID extraction
Open test-recents.html to test recent notes features
Navigate to various websites to test note-taking



Making Changes

Edit files and reload the extension in chrome://extensions/
Check browser console for debugging information
Use Chrome DevTools to inspect the side panel

📚 TMF Artifact Database
The extension includes a comprehensive database of TMF artifacts organized by:

11 Zones: Trial Management, Central Trial Documents, Investigational Product, Laboratory, Regulatory, Site Management, Monitoring, Data Management, Safety, Quality Assurance, Statistics
Multiple Sections: Each zone contains relevant sections
250+ Artifacts: Complete artifact definitions and dating conventions

Example Zones:

Trial Management - Plans, oversight, meetings
Regulatory - Approvals, submissions, ethics committees
Site Management - Site selection, monitoring, agreements
Safety - Adverse events, safety reports
Data Management - Database design, validation, locks

🤝 Contributing
We welcome contributions! Please:

Fork the repository
Create a feature branch (git checkout -b feature/amazing-feature)
Commit your changes (git commit -m 'Add amazing feature')
Push to the branch (git push origin feature/amazing-feature)
Open a Pull Request

Development Guidelines

Follow existing code style and conventions
Test thoroughly across different websites
Update documentation for new features
Ensure compatibility with Manifest V3 standards

📄 License
This project is licensed under the MIT License - see the LICENSE file for details.
🐛 Bug Reports & Feature Requests
Please use the GitHub Issues page to:

Report bugs with detailed reproduction steps
Request new features with clear use cases
Ask questions about usage or development

📞 Support
For support and questions:

Check the Issues page for existing solutions
Create a new issue with detailed information
Include browser version, extension version, and steps to reproduce

🙏 Acknowledgments

Built for clinical trial professionals working with TMF documentation
Inspired by the need for efficient trial document management
Uses TMF Reference Model standards for artifact classification


Made with ❤️ for the clinical research community
