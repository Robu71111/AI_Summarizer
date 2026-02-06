// app.js - Professional AI Summarizer Logic

document.addEventListener('DOMContentLoaded', function() {
  // --- Elements ---
  const lengthRange = document.getElementById('lengthRange');
  const lengthInput = document.getElementById('lengthInput');
  const lengthOptions = document.querySelectorAll('.length-option');
  const formatTabs = document.querySelectorAll('.format-tab');
  const modeInput = document.getElementById('modeInput');
  const summaryModeTabs = document.querySelectorAll('.summary-mode-tab');
  const summaryModeInput = document.getElementById('summaryModeInput');
  const userTextArea = document.getElementById('user_text');
  const inputStats = document.getElementById('inputStats');
  const summarizeForm = document.getElementById('summarizeForm');
  const loadingOverlay = document.getElementById('loadingOverlay');
  const copyBtn = document.getElementById('copyBtn');
  const themeToggle = document.getElementById('themeToggle');
  const themeIcon = document.getElementById('themeIcon');
  const fileUpload = document.getElementById('fileUpload');
  const fileName = document.getElementById('fileName');
  const clearFileBtn = document.getElementById('clearFile');
  const fileNameDisplay = document.getElementById('fileNameDisplay');
  const urlInput = document.getElementById('url_input');
  const historySection = document.getElementById('historySection');
  const historyList = document.getElementById('historyList');
  const clearHistoryBtn = document.getElementById('clearHistory');
  const summaryOutputElement = document.querySelector('.summary-output');

  // --- 1. Entry Animations & UI Refinement ---
  
  // Fade in the summary output if it contains text (on page load)
  if (summaryOutputElement && summaryOutputElement.textContent.trim().length > 10) {
    summaryOutputElement.style.opacity = '0';
    summaryOutputElement.style.transform = 'translateY(10px)';
    summaryOutputElement.style.transition = 'all 0.6s ease-out';
    
    requestAnimationFrame(() => {
      summaryOutputElement.style.opacity = '1';
      summaryOutputElement.style.transform = 'translateY(0)';
    });
  }

  // --- 2. Dark/Light Mode Toggle ---
  const savedTheme = localStorage.getItem('theme');
  const initialTheme = savedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', initialTheme);
  updateThemeIcon(initialTheme);

  if (themeToggle) {
    themeToggle.addEventListener('click', function() {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      
      themeToggle.style.transform = 'scale(0.8) rotate(180deg)';
      
      setTimeout(() => {
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
        themeToggle.style.transform = '';
      }, 150);
    });
  }

  function updateThemeIcon(theme) {
    if (themeIcon) {
      themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
  }

  // --- 3. File & Word Count Logic ---
  if (fileUpload) {
    fileUpload.addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (file) {
        fileName.textContent = file.name;
        if (fileNameDisplay) fileNameDisplay.style.display = 'block';
        updateWordCount();
      }
    });
  }
  
  if (clearFileBtn) {
    clearFileBtn.addEventListener('click', function() {
      fileUpload.value = '';
      fileName.textContent = '';
      if (fileNameDisplay) fileNameDisplay.style.display = 'none';
      updateWordCount();
    });
  }

  function getWordCount(text) {
    return text.trim().length > 0 ? text.trim().split(/\s+/).length : 0;
  }

  function updateWordCount() {
    if (!userTextArea || !inputStats) return;
    const text = userTextArea.value.trim();
    const words = getWordCount(text);
    const chars = text.length;
    inputStats.textContent = `${words} words • ${chars} characters`;
    inputStats.style.color = chars > 48000 ? '#ef4444' : '';
  }

  if (userTextArea) userTextArea.addEventListener('input', updateWordCount);

  // --- 4. History Management ---
  loadHistory();

  // Save new results to history
  if (summaryOutputElement && summaryOutputElement.textContent.trim().length > 50) {
    const isNewResult = !summaryOutputElement.hasAttribute('data-from-history');
    if (isNewResult) {
      const inputWordCount = getWordCount(userTextArea.value);
      const summaryText = summaryOutputElement.textContent.trim();
      const summaryWordCount = getWordCount(summaryText);
      
      saveToHistory({
        summary: summaryText,
        inputWords: inputWordCount || (summaryWordCount * 3),
        summaryWords: summaryWordCount,
        timestamp: new Date().toISOString()
      });
    }
  }

  function saveToHistory(item) {
    let history = JSON.parse(localStorage.getItem('summaryHistory') || '[]');
    const isDuplicate = history.some(h => h.summary.substring(0, 100) === item.summary.substring(0, 100));
    if (isDuplicate) return;

    history.unshift(item);
    if (history.length > 10) history = history.slice(0, 10);
    localStorage.setItem('summaryHistory', JSON.stringify(history));
    loadHistory();
  }

  function loadHistory() {
    if (!historySection || !historyList) return;
    const history = JSON.parse(localStorage.getItem('summaryHistory') || '[]');
    if (history.length === 0) {
      historySection.style.display = 'none';
      return;
    }
    historySection.style.display = 'block';
    historyList.innerHTML = '';
    history.forEach((item, index) => {
      historyList.appendChild(createHistoryItem(item, index));
    });
  }

  function createHistoryItem(item, index) {
    const div = document.createElement('div');
    div.className = 'history-item card p-3 mb-3'; // Using card class for consistent UI
    const date = new Date(item.timestamp);
    const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    div.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-2">
        <small class="text-muted font-weight-bold">${formattedDate}</small>
        <div class="history-item-actions">
          <button class="btn btn-sm btn-link use-btn p-1" title="Restore"><i class="fas fa-redo text-primary"></i></button>
          <button class="btn btn-sm btn-link copy-btn p-1" title="Copy"><i class="fas fa-copy text-secondary"></i></button>
          <button class="btn btn-sm btn-link delete-btn p-1" title="Delete"><i class="fas fa-trash text-danger"></i></button>
        </div>
      </div>
      <div class="history-item-preview text-muted small text-truncate mb-2" style="max-width: 100%">${item.summary}</div>
      <div class="d-flex gap-3">
        <span class="badge badge-light" style="font-size: 0.7rem;">${item.summaryWords} words</span>
        <span class="badge badge-light" style="font-size: 0.7rem;">${Math.round((item.summaryWords / item.inputWords) * 100)}% reduced</span>
      </div>
    `;

    div.querySelector('.use-btn').addEventListener('click', () => {
      summaryOutputElement.textContent = item.summary;
      summaryOutputElement.setAttribute('data-from-history', 'true');
      window.scrollTo({top: summaryOutputElement.offsetTop - 150, behavior: 'smooth'});
      showNotification('Summary restored!', 'success');
    });

    div.querySelector('.copy-btn').addEventListener('click', () => copyToClipboard(item.summary));
    div.querySelector('.delete-btn').addEventListener('click', () => {
      let history = JSON.parse(localStorage.getItem('summaryHistory') || '[]');
      history.splice(index, 1);
      localStorage.setItem('summaryHistory', JSON.stringify(history));
      loadHistory();
      showNotification('Deleted', 'info');
    });

    return div;
  }

  // --- 5. Tabs & Sliders ---
  function updateLengthUI(value) {
    lengthOptions.forEach(opt => opt.classList.toggle('active', opt.getAttribute('data-value') === value));
  }

  if (lengthRange) {
    lengthRange.addEventListener('input', (e) => {
      lengthInput.value = e.target.value;
      updateLengthUI(e.target.value);
    });
  }

  formatTabs.forEach(tab => {
    tab.addEventListener('click', function() {
      formatTabs.forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      if (modeInput) modeInput.value = this.getAttribute('data-mode');
    });
  });

  summaryModeTabs.forEach(tab => {
    tab.addEventListener('click', function() {
      summaryModeTabs.forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      if (summaryModeInput) summaryModeInput.value = this.getAttribute('data-mode');
    });
  });

  // --- 6. Form Submission & Exports ---
  if (summarizeForm) {
    summarizeForm.addEventListener('submit', function(e) {
      const activeTab = document.querySelector('.input-tabs .nav-link.active');
      const activeTabId = activeTab ? activeTab.id : 'text-tab';
      let hasContent = false;

      if (activeTabId === 'text-tab') hasContent = userTextArea.value.trim().length > 0;
      else if (activeTabId === 'file-tab') hasContent = fileUpload && fileUpload.files.length > 0;
      else if (activeTabId === 'url-tab') hasContent = urlInput && urlInput.value.trim().length > 0;
      
      if (!hasContent) {
        e.preventDefault();
        showNotification('Input required!', 'error');
        return;
      }
      if (loadingOverlay) loadingOverlay.classList.add('active');
    });
  }

  // --- 7. Clipboard & Notifications ---
  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      showNotification('Copied to clipboard!', 'success');
    } catch (err) {
      showNotification('Copy failed', 'error');
    }
  }

  if (copyBtn) copyBtn.addEventListener('click', () => {
    if (summaryOutputElement) copyToClipboard(summaryOutputElement.textContent);
  });

  function showNotification(message, type = 'success') {
    const existing = document.querySelector('.notification-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `notification-toast alert-${type}`;
    toast.style.cssText = `
      position: fixed; bottom: 2rem; right: 2rem; z-index: 9999;
      padding: 1rem 1.5rem; border-radius: var(--radius-md);
      background: var(--bg-card); border: 1px solid var(--border-subtle);
      box-shadow: var(--shadow-lg); color: var(--text-main);
      animation: slideIn 0.4s cubic-bezier(0.18, 0.89, 0.32, 1.28);
    `;
    toast.innerHTML = `<i class="fas fa-info-circle mr-2" style="color:var(--primary)"></i> ${message}`;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(20px)';
      toast.style.transition = 'all 0.4s';
      setTimeout(() => toast.remove(), 400);
    }, 3000);
  }

  // Inject animation keyframes
  const sheet = document.createElement('style');
  sheet.innerHTML = `@keyframes slideIn { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`;
  document.head.appendChild(sheet);

  console.log('🚀 AI Summarizer: UI Enhanced');
});