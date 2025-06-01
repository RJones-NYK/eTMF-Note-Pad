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