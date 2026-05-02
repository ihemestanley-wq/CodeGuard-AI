/**
 * CodeGuard AI - PR Comment Simulator
 * Client-side application logic
 */

// ===================================
// State Management
// ===================================
const state = {
  diffContent: '',
  analysisResults: null,
  isAnalyzing: false,
};

// ===================================
// DOM Elements
// ===================================
const elements = {
  // Input elements
  diffInput: document.getElementById('diffInput'),
  fileInput: document.getElementById('fileInput'),
  fileName: document.getElementById('fileName'),
  charCount: document.getElementById('charCount'),

  // Buttons
  analyzeBtn: document.getElementById('analyzeBtn'),
  clearBtn: document.getElementById('clearBtn'),
  loadSampleBtn: document.getElementById('loadSampleBtn'),
  copyResultsBtn: document.getElementById('copyResultsBtn'),
  newAnalysisBtn: document.getElementById('newAnalysisBtn'),

  // Sections
  inputSection: document.querySelector('.input-section'),
  loadingSection: document.getElementById('loadingSection'),
  resultsSection: document.getElementById('resultsSection'),
  errorMessage: document.getElementById('errorMessage'),
  errorText: document.getElementById('errorText'),

  // Results elements
  riskBadge: document.getElementById('riskBadge'),
  riskDescription: document.getElementById('riskDescription'),
  filesCount: document.getElementById('filesCount'),
  findingsCount: document.getElementById('findingsCount'),
  riskScore: document.getElementById('riskScore'),
  timestamp: document.getElementById('timestamp'),

  // Findings sections
  securitySection: document.getElementById('securitySection'),
  securityList: document.getElementById('securityList'),
  securityCount: document.getElementById('securityCount'),

  complexitySection: document.getElementById('complexitySection'),
  complexityList: document.getElementById('complexityList'),
  complexityCount: document.getElementById('complexityCount'),

  performanceSection: document.getElementById('performanceSection'),
  performanceList: document.getElementById('performanceList'),
  performanceCount: document.getElementById('performanceCount'),

  noIssuesMessage: document.getElementById('noIssuesMessage'),
};

// ===================================
// Event Listeners
// ===================================
function initEventListeners() {
  // Diff input change
  elements.diffInput.addEventListener('input', handleDiffInputChange);

  // File upload
  elements.fileInput.addEventListener('change', handleFileUpload);

  // Drag and drop
  const fileLabel = document.querySelector('.file-input-label');
  fileLabel.addEventListener('dragover', handleDragOver);
  fileLabel.addEventListener('dragleave', handleDragLeave);
  fileLabel.addEventListener('drop', handleFileDrop);

  // Buttons
  elements.analyzeBtn.addEventListener('click', handleAnalyze);
  elements.clearBtn.addEventListener('click', handleClear);
  elements.loadSampleBtn.addEventListener('click', handleLoadSample);
  elements.copyResultsBtn.addEventListener('click', handleCopyResults);
  elements.newAnalysisBtn.addEventListener('click', handleNewAnalysis);

  // Section toggles
  document.querySelectorAll('.section-toggle').forEach((toggle) => {
    toggle.addEventListener('click', handleSectionToggle);
  });
}

// ===================================
// Input Handlers
// ===================================
function handleDiffInputChange(e) {
  state.diffContent = e.target.value;
  updateCharCount();
  updateAnalyzeButton();
  hideError();
}

function updateCharCount() {
  const count = state.diffContent.length;
  elements.charCount.textContent = count.toLocaleString();
}

function updateAnalyzeButton() {
  const hasContent = state.diffContent.trim().length > 0;
  elements.analyzeBtn.disabled = !hasContent || state.isAnalyzing;
}

// ===================================
// File Upload Handlers
// ===================================
async function handleFileUpload(e) {
  const file = e.target.files[0];
  if (file) {
    await processFile(file);
  }
}

function handleDragOver(e) {
  e.preventDefault();
  e.currentTarget.style.borderColor = 'var(--color-info)';
  e.currentTarget.style.backgroundColor = 'var(--color-info-bg)';
}

function handleDragLeave(e) {
  e.currentTarget.style.borderColor = '';
  e.currentTarget.style.backgroundColor = '';
}

async function handleFileDrop(e) {
  e.preventDefault();
  e.currentTarget.style.borderColor = '';
  e.currentTarget.style.backgroundColor = '';

  const file = e.dataTransfer.files[0];
  if (file) {
    // Update file input
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    elements.fileInput.files = dataTransfer.files;

    await processFile(file);
  }
}

async function processFile(file) {
  // Validate file type
  const validExtensions = ['.diff', '.patch', '.txt'];
  const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

  if (!validExtensions.includes(fileExtension)) {
    showError(`Invalid file type. Please upload a ${validExtensions.join(', ')} file.`);
    return;
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    showError('File is too large. Maximum size is 5MB.');
    return;
  }

  try {
    const content = await readFileContent(file);
    elements.diffInput.value = content;
    state.diffContent = content;
    elements.fileName.textContent = file.name;
    updateCharCount();
    updateAnalyzeButton();
    hideError();
  } catch (error) {
    showError('Failed to read file. Please try again.');
    console.error('File read error:', error);
  }
}

function readFileContent(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(e);
    reader.readAsText(file);
  });
}

// ===================================
// Analysis Handler
// ===================================
async function handleAnalyze() {
  if (!state.diffContent.trim()) {
    showError('Please provide diff content to analyze.');
    return;
  }

  state.isAnalyzing = true;
  updateAnalyzeButton();
  hideError();
  showLoading();

  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        diffContent: state.diffContent,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Analysis failed');
    }

    state.analysisResults = data;
    displayResults(data);
  } catch (error) {
    hideLoading();
    showError(error.message || 'Failed to analyze PR. Please try again.');
    console.error('Analysis error:', error);
  } finally {
    state.isAnalyzing = false;
    updateAnalyzeButton();
  }
}

// ===================================
// Display Results
// ===================================
function displayResults(data) {
  hideLoading();

  // Show results section
  elements.resultsSection.style.display = 'block';
  elements.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Display risk assessment
  displayRiskAssessment(data);

  // Display findings
  displayFindings(data);

  // Update timestamp
  elements.timestamp.textContent = new Date().toLocaleString();
}

function displayRiskAssessment(data) {
  const { riskScore, riskLevel, summary } = data;

  // Update risk badge
  elements.riskBadge.textContent = riskLevel;
  elements.riskBadge.className = `risk-badge ${riskLevel.toLowerCase()}`;

  // Update risk description
  elements.riskDescription.textContent = summary || getRiskDescription(riskLevel);

  // Update stats
  elements.filesCount.textContent = data.filesAnalyzed || 0;
  elements.riskScore.textContent = riskScore;

  // Calculate total findings
  const totalFindings = (data.security?.length || 0)
        + (data.complexity?.length || 0)
        + (data.performance?.length || 0);
  elements.findingsCount.textContent = totalFindings;

  // Update risk summary background color
  const riskSummary = document.querySelector('.risk-summary');
  riskSummary.style.backgroundColor = getRiskBackgroundColor(riskLevel);
}

function getRiskDescription(riskLevel) {
  const descriptions = {
    LOW: 'This PR looks good! No significant issues detected.',
    MEDIUM: 'This PR has some concerns that should be reviewed.',
    HIGH: 'This PR has several issues that need attention before merging.',
    CRITICAL: 'This PR has critical issues that must be addressed immediately.',
  };
  return descriptions[riskLevel] || 'Analysis complete.';
}

function getRiskBackgroundColor(riskLevel) {
  const colors = {
    LOW: 'var(--color-risk-low-bg)',
    MEDIUM: 'var(--color-risk-medium-bg)',
    HIGH: 'var(--color-risk-high-bg)',
    CRITICAL: 'var(--color-risk-critical-bg)',
  };
  return colors[riskLevel] || 'var(--color-bg-secondary)';
}

function displayFindings(data) {
  const hasFindings = (data.security?.length > 0)
        || (data.complexity?.length > 0)
        || (data.performance?.length > 0);

  if (!hasFindings) {
    elements.noIssuesMessage.style.display = 'block';
    elements.securitySection.style.display = 'none';
    elements.complexitySection.style.display = 'none';
    elements.performanceSection.style.display = 'none';
    return;
  }

  elements.noIssuesMessage.style.display = 'none';

  // Display security findings
  if (data.security?.length > 0) {
    displayFindingSection(
      elements.securitySection,
      elements.securityList,
      elements.securityCount,
      data.security,
    );
  } else {
    elements.securitySection.style.display = 'none';
  }

  // Display complexity findings
  if (data.complexity?.length > 0) {
    displayFindingSection(
      elements.complexitySection,
      elements.complexityList,
      elements.complexityCount,
      data.complexity,
    );
  } else {
    elements.complexitySection.style.display = 'none';
  }

  // Display performance findings
  if (data.performance?.length > 0) {
    displayFindingSection(
      elements.performanceSection,
      elements.performanceList,
      elements.performanceCount,
      data.performance,
    );
  } else {
    elements.performanceSection.style.display = 'none';
  }
}

function displayFindingSection(section, list, countBadge, findings) {
  section.style.display = 'block';
  countBadge.textContent = findings.length;

  // Clear existing items
  list.innerHTML = '';

  // Add findings
  findings.forEach((finding) => {
    const li = document.createElement('li');
    li.className = 'finding-item';
    li.innerHTML = createFindingHTML(finding);
    list.appendChild(li);
  });
}

function createFindingHTML(finding) {
  const severity = finding.severity || 'medium';
  const message = finding.message || finding.issue || 'Issue detected';
  const file = finding.file || finding.location || 'Unknown file';
  const description = finding.description || finding.recommendation || '';

  return `
        <div class="finding-header">
            <span class="severity-badge ${severity.toLowerCase()}">${severity}</span>
            <span class="finding-message">${escapeHtml(message)}</span>
        </div>
        ${file ? `<div class="finding-file">${escapeHtml(file)}</div>` : ''}
        ${description ? `<div class="finding-description">${escapeHtml(description)}</div>` : ''}
    `;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ===================================
// Section Toggle Handler
// ===================================
function handleSectionToggle(e) {
  const section = e.currentTarget.closest('.findings-section');
  section.classList.toggle('expanded');
}

// ===================================
// Button Handlers
// ===================================
function handleClear() {
  elements.diffInput.value = '';
  elements.fileInput.value = '';
  elements.fileName.textContent = 'Choose file or drag here';
  state.diffContent = '';
  updateCharCount();
  updateAnalyzeButton();
  hideError();
}

async function handleLoadSample() {
  try {
    const response = await fetch('/examples/sample.diff');
    if (!response.ok) {
      throw new Error('Failed to load sample diff');
    }
    const content = await response.text();
    elements.diffInput.value = content;
    state.diffContent = content;
    updateCharCount();
    updateAnalyzeButton();
    hideError();

    // Scroll to textarea
    elements.diffInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } catch (error) {
    showError('Failed to load sample diff. Please try again.');
    console.error('Sample load error:', error);
  }
}

async function handleCopyResults() {
  if (!state.analysisResults) return;

  try {
    const resultsText = formatResultsAsText(state.analysisResults);
    await navigator.clipboard.writeText(resultsText);

    // Show feedback
    const originalText = elements.copyResultsBtn.innerHTML;
    elements.copyResultsBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8L6 11L13 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `;
    elements.copyResultsBtn.title = 'Copied!';

    setTimeout(() => {
      elements.copyResultsBtn.innerHTML = originalText;
      elements.copyResultsBtn.title = 'Copy results';
    }, 2000);
  } catch (error) {
    showError('Failed to copy results. Please try again.');
    console.error('Copy error:', error);
  }
}

function formatResultsAsText(data) {
  let text = '# CodeGuard AI Analysis\n\n';
  text += `**Risk Level:** ${data.riskLevel} (Score: ${data.riskScore})\n`;
  text += `**Files Analyzed:** ${data.filesAnalyzed || 0}\n`;
  text += `**Summary:** ${data.summary}\n\n`;

  if (data.security?.length > 0) {
    text += '## 🔒 Security Issues\n\n';
    data.security.forEach((finding, i) => {
      text += `${i + 1}. **[${finding.severity}]** ${finding.message || finding.issue}\n`;
      if (finding.file) text += `   - File: \`${finding.file}\`\n`;
      if (finding.description) text += `   - ${finding.description}\n`;
      text += '\n';
    });
  }

  if (data.complexity?.length > 0) {
    text += '## 🧩 Complexity Issues\n\n';
    data.complexity.forEach((finding, i) => {
      text += `${i + 1}. **[${finding.severity}]** ${finding.message || finding.issue}\n`;
      if (finding.file) text += `   - File: \`${finding.file}\`\n`;
      if (finding.description) text += `   - ${finding.description}\n`;
      text += '\n';
    });
  }

  if (data.performance?.length > 0) {
    text += '## ⚡ Performance Concerns\n\n';
    data.performance.forEach((finding, i) => {
      text += `${i + 1}. **[${finding.severity}]** ${finding.message || finding.issue}\n`;
      if (finding.file) text += `   - File: \`${finding.file}\`\n`;
      if (finding.description) text += `   - ${finding.description}\n`;
      text += '\n';
    });
  }

  text += `\n---\n*Generated by CodeGuard AI on ${new Date().toLocaleString()}*`;

  return text;
}

function handleNewAnalysis() {
  elements.resultsSection.style.display = 'none';
  elements.inputSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  handleClear();
}

// ===================================
// UI State Helpers
// ===================================
function showLoading() {
  elements.inputSection.style.display = 'none';
  elements.resultsSection.style.display = 'none';
  elements.loadingSection.style.display = 'block';
}

function hideLoading() {
  elements.loadingSection.style.display = 'none';
  elements.inputSection.style.display = 'block';
}

function showError(message) {
  elements.errorText.textContent = message;
  elements.errorMessage.style.display = 'flex';
  elements.errorMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function hideError() {
  elements.errorMessage.style.display = 'none';
}

// ===================================
// Initialization
// ===================================
function init() {
  initEventListeners();
  updateCharCount();
  updateAnalyzeButton();

  // Auto-expand first finding section if results are shown
  const firstSection = document.querySelector('.findings-section');
  if (firstSection) {
    firstSection.classList.add('expanded');
  }

  console.log('CodeGuard AI initialized');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Made with Bob
