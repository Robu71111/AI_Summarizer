// app.js - Professional AI Summarizer Logic
// Enhanced Version with Full Functionality

document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 AI Summarizer: Initializing...');
  
  // =====================================
  // DOM ELEMENT REFERENCES
  // =====================================
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

  // =====================================
  // ENTRY ANIMATIONS
  // =====================================
  function initEntryAnimations() {
    // Fade in summary output if present
    if (summaryOutputElement && summaryOutputElement.textContent.trim().length > 10) {
      summaryOutputElement.style.opacity = '0';
      summaryOutputElement.style.transform = 'translateY(10px)';
      summaryOutputElement.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
      
      requestAnimationFrame(() => {
        setTimeout(() => {
          summaryOutputElement.style.opacity = '1';
          summaryOutputElement.style.transform = 'translateY(0)';
        }, 100);
      });
    }
  }

  // =====================================
  // THEME MANAGEMENT
  // =====================================
  function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    
    document.documentElement.setAttribute('data-theme', initialTheme);
    updateThemeIcon(initialTheme);

    if (themeToggle) {
      themeToggle.addEventListener('click', toggleTheme);
    }
  }

  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    // Animate toggle button
    themeToggle.style.transform = 'scale(0.85) rotate(180deg)';
    
    setTimeout(() => {
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      updateThemeIcon(newTheme);
      themeToggle.style.transform = '';
    }, 150);
  }

  function updateThemeIcon(theme) {
    if (themeIcon) {
      themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
  }

  // =====================================
  // FILE UPLOAD HANDLING
  // =====================================
  function initFileUpload() {
    if (fileUpload) {
      fileUpload.addEventListener('change', handleFileChange);
    }
    
    if (clearFileBtn) {
      clearFileBtn.addEventListener('click', handleClearFile);
    }
  }

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (file) {
      if (fileName) fileName.textContent = file.name;
      if (fileNameDisplay) {
        fileNameDisplay.style.display = 'flex';
        fileNameDisplay.classList.add('show');
      }
      updateWordCount();
    }
  }

  function handleClearFile() {
    if (fileUpload) fileUpload.value = '';
    if (fileName) fileName.textContent = '';
    if (fileNameDisplay) {
      fileNameDisplay.style.display = 'none';
      fileNameDisplay.classList.remove('show');
    }
    updateWordCount();
  }

  // =====================================
  // WORD COUNT & STATISTICS
  // =====================================
  function getWordCount(text) {
    if (!text || text.trim().length === 0) return 0;
    return text.trim().split(/\s+/).length;
  }

  function updateWordCount() {
    if (!userTextArea || !inputStats) return;
    
    const text = userTextArea.value.trim();
    const words = getWordCount(text);
    const chars = text.length;
    
    inputStats.textContent = `${words} words • ${chars} characters`;
    
    // Warn if text is too long (48000+ chars)
    if (chars > 48000) {
      inputStats.style.color = 'var(--danger)';
      inputStats.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${words} words • ${chars} characters (too long)`;
    } else if (chars > 40000) {
      inputStats.style.color = 'var(--warning)';
    } else {
      inputStats.style.color = '';
    }
  }

  // =====================================
  // HISTORY MANAGEMENT
  // =====================================
  function initHistory() {
    loadHistory();
    
    // Save new results to history (on page load)
    if (summaryOutputElement && summaryOutputElement.textContent.trim().length > 50) {
      const isNewResult = !summaryOutputElement.hasAttribute('data-from-history');
      if (isNewResult) {
        const inputWordCount = userTextArea ? getWordCount(userTextArea.value) : 0;
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
    
    // Clear history button
    if (clearHistoryBtn) {
      clearHistoryBtn.addEventListener('click', () => {
        if (confirm('Clear all history? This cannot be undone.')) {
          localStorage.removeItem('summaryHistory');
          loadHistory();
          showNotification('History cleared', 'info');
        }
      });
    }
  }

  function saveToHistory(item) {
    let history = JSON.parse(localStorage.getItem('summaryHistory') || '[]');
    
    // Check for duplicates
    const isDuplicate = history.some(h => 
      h.summary.substring(0, 100) === item.summary.substring(0, 100)
    );
    
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
    div.className = 'history-item card p-3 mb-3';
    
    const date = new Date(item.timestamp);
    const formattedDate = date.toLocaleDateString() + ' ' + 
      date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
    
    const reductionPercent = Math.round((item.summaryWords / item.inputWords) * 100);
    
    div.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-2">
        <small class="text-muted font-weight-bold">
          <i class="fas fa-clock"></i> ${formattedDate}
        </small>
        <div class="history-item-actions">
          <button class="btn btn-sm btn-link use-btn p-1" title="Restore this summary">
            <i class="fas fa-redo text-primary"></i>
          </button>
          <button class="btn btn-sm btn-link copy-btn p-1" title="Copy to clipboard">
            <i class="fas fa-copy text-secondary"></i>
          </button>
          <button class="btn btn-sm btn-link delete-btn p-1" title="Delete from history">
            <i class="fas fa-trash text-danger"></i>
          </button>
        </div>
      </div>
      <div class="history-item-preview text-muted small mb-2">${escapeHtml(item.summary)}</div>
      <div class="d-flex gap-3">
        <span class="badge badge-light">
          <i class="fas fa-file-alt"></i> ${item.summaryWords} words
        </span>
        <span class="badge badge-success">
          <i class="fas fa-compress-alt"></i> ${reductionPercent}% reduced
        </span>
      </div>
    `;

    // Event listeners for history item actions
    div.querySelector('.use-btn').addEventListener('click', () => {
      if (summaryOutputElement) {
        summaryOutputElement.textContent = item.summary;
        summaryOutputElement.setAttribute('data-from-history', 'true');
        window.scrollTo({
          top: summaryOutputElement.offsetTop - 150,
          behavior: 'smooth'
        });
        showNotification('Summary restored!', 'success');
      }
    });

    div.querySelector('.copy-btn').addEventListener('click', () => {
      copyToClipboard(item.summary);
    });

    div.querySelector('.delete-btn').addEventListener('click', () => {
      let history = JSON.parse(localStorage.getItem('summaryHistory') || '[]');
      history.splice(index, 1);
      localStorage.setItem('summaryHistory', JSON.stringify(history));
      loadHistory();
      showNotification('Deleted from history', 'info');
    });

    return div;
  }

  // =====================================
  // TABS & CONTROLS
  // =====================================
  function initControls() {
    // Length slider
    if (lengthRange && lengthInput) {
      lengthRange.addEventListener('input', (e) => {
        lengthInput.value = e.target.value;
        updateLengthUI(e.target.value);
      });
    }

    // Length option buttons
    lengthOptions.forEach(option => {
      option.addEventListener('click', function() {
        const value = this.getAttribute('data-value');
        if (lengthRange) lengthRange.value = value;
        if (lengthInput) lengthInput.value = value;
        updateLengthUI(value);
      });
    });

    // Format tabs
    formatTabs.forEach(tab => {
      tab.addEventListener('click', function() {
        formatTabs.forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        if (modeInput) {
          modeInput.value = this.getAttribute('data-mode');
        }
      });
    });

    // Summary mode tabs
    summaryModeTabs.forEach(tab => {
      tab.addEventListener('click', function() {
        summaryModeTabs.forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        if (summaryModeInput) {
          summaryModeInput.value = this.getAttribute('data-mode');
        }
      });
    });
  }

  function updateLengthUI(value) {
    lengthOptions.forEach(opt => {
      const optValue = opt.getAttribute('data-value');
      opt.classList.toggle('active', optValue === value);
    });
  }

  // =====================================
  // FORM SUBMISSION
  // =====================================
  function initFormSubmit() {
    if (summarizeForm) {
      summarizeForm.addEventListener('submit', handleFormSubmit);
    }
  }

  function handleFormSubmit(e) {
    const activeTab = document.querySelector('.input-tabs .nav-link.active');
    const activeTabId = activeTab ? activeTab.id : 'text-tab';
    let hasContent = false;

    // Check which tab is active and validate content
    if (activeTabId === 'text-tab') {
      hasContent = userTextArea && userTextArea.value.trim().length > 0;
    } else if (activeTabId === 'file-tab') {
      hasContent = fileUpload && fileUpload.files.length > 0;
    } else if (activeTabId === 'url-tab') {
      hasContent = urlInput && urlInput.value.trim().length > 0;
    }
    
    if (!hasContent) {
      e.preventDefault();
      showNotification('Please provide some input to summarize!', 'error');
      return;
    }
    
    // Show loading overlay
    if (loadingOverlay) {
      loadingOverlay.classList.add('active');
      loadingOverlay.innerHTML = `
        <div class="loading-spinner"></div>
        <div class="loading-text">
          <i class="fas fa-magic"></i> Summarizing your content...
        </div>
      `;
    }
  }

  // =====================================
  // CLIPBOARD & NOTIFICATIONS
  // =====================================
  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      showNotification('Copied to clipboard!', 'success');
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        showNotification('Copied to clipboard!', 'success');
      } catch (err2) {
        showNotification('Copy failed - please try manually', 'error');
      }
      document.body.removeChild(textArea);
    }
  }

  function showNotification(message, type = 'success') {
    // Remove any existing notification
    const existing = document.querySelector('.notification-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `notification-toast alert-${type}`;
    
    let icon = 'fa-check-circle';
    if (type === 'error') icon = 'fa-exclamation-circle';
    if (type === 'info') icon = 'fa-info-circle';
    if (type === 'warning') icon = 'fa-exclamation-triangle';
    
    toast.innerHTML = `
      <i class="fas ${icon}"></i>
      <span>${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(20px)';
      toast.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
      setTimeout(() => toast.remove(), 400);
    }, 3000);
  }

  // =====================================
  // COPY BUTTON
  // =====================================
  function initCopyButton() {
    if (copyBtn && summaryOutputElement) {
      copyBtn.addEventListener('click', () => {
        const text = summaryOutputElement.textContent.trim();
        if (text.length > 0) {
          copyToClipboard(text);
        } else {
          showNotification('Nothing to copy!', 'warning');
        }
      });
    }
  }

  // =====================================
  // UTILITY FUNCTIONS
  // =====================================
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // =====================================
  // INITIALIZE ALL FEATURES
  // =====================================
  function init() {
    initTheme();
    initEntryAnimations();
    initFileUpload();
    initControls();
    initFormSubmit();
    initCopyButton();
    initHistory();
    
    // Initialize word count
    if (userTextArea) {
      userTextArea.addEventListener('input', updateWordCount);
      updateWordCount();
    }
    
    console.log('✅ AI Summarizer: Ready!');
  }

  // Start the app
  init();
});