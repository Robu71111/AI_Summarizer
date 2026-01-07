// app.js - Main application JavaScript with all new features

document.addEventListener('DOMContentLoaded', function() {
  // Elements
  const lengthRange = document.getElementById('lengthRange');
  const lengthInput = document.getElementById('lengthInput');
  const lengthOptions = document.querySelectorAll('.length-option');

  // Format tabs (Paragraph, Bullets, Key Points, Handwriting)
  const formatTabs = document.querySelectorAll('.format-tab');
  const modeInput = document.getElementById('modeInput');

  // Summary Mode tabs (Standard, Formal, Creative)
  const summaryModeTabs = document.querySelectorAll('.summary-mode-tab');
  const summaryModeInput = document.getElementById('summaryModeInput');

  const userTextArea = document.getElementById('user_text');
  const inputStats = document.getElementById('inputStats');
  const summarizeForm = document.getElementById('summarizeForm');
  const loadingOverlay = document.getElementById('loadingOverlay');
  const copyBtn = document.getElementById('copyBtn');
  const themeToggle = document.getElementById('themeToggle');
  const themeIcon = document.getElementById('themeIcon');
  
  // File upload elements
  const fileUpload = document.getElementById('fileUpload');
  const fileName = document.getElementById('fileName');
  const clearFileBtn = document.getElementById('clearFile');
  const fileNameDisplay = document.getElementById('fileNameDisplay');

  // URL Input
  const urlInput = document.getElementById('url_input');

  // Initialize tooltips
  $('[data-toggle="tooltip"]').tooltip();
  
  // Export buttons
  const exportTxt = document.getElementById('exportTxt');
  const exportPdf = document.getElementById('exportPdf');

  // Translation elements
  const translateOptions = document.querySelectorAll('.translate-option');
  
  // History elements
  const historySection = document.getElementById('historySection');
  const historyList = document.getElementById('historyList');
  const clearHistoryBtn = document.getElementById('clearHistory');

  // ==================== Dark/Light Mode Toggle ====================
  
  // Initialize theme from localStorage or system preference
  const savedTheme = localStorage.getItem('theme');
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
  
  document.documentElement.setAttribute('data-theme', initialTheme);
  updateThemeIcon(initialTheme);

  if (themeToggle) {
    themeToggle.addEventListener('click', function() {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      
      // Animation effect
      themeToggle.style.transform = 'scale(0.8) rotate(180deg)';
      
      setTimeout(() => {
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
        themeToggle.style.transform = ''; // Reset via CSS transition
      }, 150);
    });
  }

  function updateThemeIcon(theme) {
    if (themeIcon) {
      themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
  }

  // ==================== File Upload Handling ====================
  
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

  // ==================== Summary History Management ====================
  
  loadHistory();
  
  // Logic to save a newly generated summary to history
  const summaryOutputElement = document.querySelector('.summary-output');
  if (summaryOutputElement && summaryOutputElement.textContent.trim().length > 50) {
    // Check if this is a fresh result (not just loaded from history)
    const isNewResult = !summaryOutputElement.hasAttribute('data-from-history');
    
    if (isNewResult) {
        const inputWordCount = getWordCount(userTextArea.value);
        const summaryText = summaryOutputElement.textContent.trim();
        const summaryWordCount = getWordCount(summaryText);
        
        saveToHistory({
          summary: summaryText,
          inputWords: inputWordCount || (summaryWordCount * 3), // Fallback if input empty (e.g. file upload)
          summaryWords: summaryWordCount,
          timestamp: new Date().toISOString()
        });
    }
  }
  
  function getWordCount(text) {
    return text.trim().length > 0 ? text.trim().split(/\s+/).length : 0;
  }

  function saveToHistory(item) {
    let history = JSON.parse(localStorage.getItem('summaryHistory') || '[]');
    
    // Avoid duplicates
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
      const historyItem = createHistoryItem(item, index);
      historyList.appendChild(historyItem);
    });
  }
  
  function createHistoryItem(item, index) {
    const div = document.createElement('div');
    div.className = 'history-item';
    
    const date = new Date(item.timestamp);
    const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    div.innerHTML = `
      <div class="history-item-header">
        <span class="history-item-date">${formattedDate}</span>
        <div class="history-item-actions">
          <button class="history-action-btn use-btn" title="Restore to view">
            <i class="fas fa-redo"></i>
          </button>
          <button class="history-action-btn copy-btn" title="Copy text">
            <i class="fas fa-copy"></i>
          </button>
          <button class="history-action-btn delete-btn" title="Delete">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
      <div class="history-item-preview">${item.summary}</div>
      <div class="history-item-stats">
        <span class="history-stat">
          <i class="fas fa-file-word"></i> ${item.summaryWords} words
        </span>
        <span class="history-stat">
          <i class="fas fa-chart-line"></i> ${Math.round((item.summaryWords / item.inputWords) * 100)}% reduced
        </span>
      </div>
    `;
    
    // Use button: Restores summary to the output box
    div.querySelector('.use-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      const output = document.querySelector('.summary-output');
      if (output) {
        output.textContent = item.summary;
        output.setAttribute('data-from-history', 'true');
        window.scrollTo({top: output.offsetTop - 100, behavior: 'smooth'});
        showNotification('Summary restored!', 'success');
      }
    });
    
    // Copy button
    div.querySelector('.copy-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      copyToClipboard(item.summary);
    });
    
    // Delete button
    div.querySelector('.delete-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      deleteHistoryItem(index);
    });

    return div;
  }
  
  function deleteHistoryItem(index) {
    let history = JSON.parse(localStorage.getItem('summaryHistory') || '[]');
    history.splice(index, 1);
    localStorage.setItem('summaryHistory', JSON.stringify(history));
    loadHistory();
    showNotification('Item removed from history', 'success');
  }
  
  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener('click', function() {
      if (confirm('Clear all saved summaries?')) {
        localStorage.removeItem('summaryHistory');
        loadHistory();
        showNotification('History cleared', 'success');
      }
    });
  }

  // ==================== Length Slider & Mode Tabs ====================
  
  function updateLengthUI(value) {
    lengthOptions.forEach(option => {
      option.classList.toggle('active', option.getAttribute('data-value') === value);
    });
  }

  if (lengthRange) {
    lengthRange.addEventListener('input', (e) => {
      lengthInput.value = e.target.value;
      updateLengthUI(e.target.value);
    });
  }

  lengthOptions.forEach(option => {
    option.addEventListener('click', function() {
      const val = this.getAttribute('data-value');
      if (lengthRange) lengthRange.value = val;
      if (lengthInput) lengthInput.value = val;
      updateLengthUI(val);
    });
  });

  // Output Format Selection
  formatTabs.forEach(tab => {
    tab.addEventListener('click', function(e) {
      e.preventDefault();
      formatTabs.forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      if (modeInput) modeInput.value = this.getAttribute('data-mode');
    });
  });

  // Summary Mode Selection
  summaryModeTabs.forEach(tab => {
    tab.addEventListener('click', function(e) {
      e.preventDefault();
      summaryModeTabs.forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      if (summaryModeInput) summaryModeInput.value = this.getAttribute('data-mode');
    });
  });

  // ==================== Real-time Word Count ====================
  
  function updateWordCount() {
    const text = userTextArea.value.trim();
    const words = getWordCount(text);
    const chars = text.length;
    
    if (inputStats) {
      inputStats.textContent = `${words} words • ${chars} characters`;
      
      // Visual warnings for limit
      if (chars > 48000) {
        inputStats.style.color = 'var(--danger)';
        inputStats.style.fontWeight = 'bold';
      } else {
        inputStats.style.color = '';
        inputStats.style.fontWeight = '';
      }
    }
  }

  if (userTextArea) {
    userTextArea.addEventListener('input', updateWordCount);
  }

  // ==================== Translation Handling ====================

  if (translateOptions) {
    translateOptions.forEach(option => {
      option.addEventListener('click', async function(e) {
        e.preventDefault();
        const targetLang = this.getAttribute('data-lang');
        const outputElement = document.querySelector('.summary-output');

        if (!outputElement) return;

        // Get original text from data attribute if exists, otherwise use current text and save it
        let sourceText = outputElement.getAttribute('data-original-text');

        if (!sourceText) {
          const currentText = outputElement.textContent.trim();
          if (!currentText || outputElement.querySelector('.empty-state')) {
            showNotification('Generate a summary first!', 'error');
            return;
          }
          sourceText = currentText;
          outputElement.setAttribute('data-original-text', sourceText);
        }

        // Show loading state
        const originalContent = outputElement.innerHTML;
        outputElement.innerHTML = `
          <div class="text-center p-4">
            <div class="spinner-border text-primary" role="status"></div>
            <p class="mt-2 text-muted">Translating to ${targetLang}...</p>
          </div>
        `;

        try {
          const response = await fetch('/translate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              text: sourceText,
              target_language: targetLang
            })
          });

          const result = await response.json();

          if (result.success) {
            outputElement.innerHTML = result.text.replace(/\n/g, '<br>'); // Simple formatting preservation
            showNotification(`Translated to ${targetLang}`, 'success');
          } else {
            throw new Error(result.error || 'Translation failed');
          }
        } catch (error) {
          console.error('Translation error:', error);
          outputElement.innerHTML = originalContent;
          showNotification('Translation failed. Please try again.', 'error');
        }
      });
    });
  }

  // ==================== Export & Form Submission ====================
  
  if (summarizeForm) {
    summarizeForm.addEventListener('submit', function(e) {
      // Determine active tab
      const activeTabId = document.querySelector('.input-tabs .nav-link.active').id;

      let hasContent = false;

      if (activeTabId === 'text-tab') {
          hasContent = userTextArea.value.trim().length > 0;
          // Clear other inputs to avoid confusion
          if (fileUpload) fileUpload.value = '';
          if (urlInput) urlInput.value = '';
      } else if (activeTabId === 'file-tab') {
          hasContent = fileUpload && fileUpload.files.length > 0;
          if (userTextArea) userTextArea.value = '';
          if (urlInput) urlInput.value = '';
      } else if (activeTabId === 'url-tab') {
          hasContent = urlInput && urlInput.value.trim().length > 0;
          if (userTextArea) userTextArea.value = '';
          if (fileUpload) fileUpload.value = '';
      }
      
      if (!hasContent) {
        e.preventDefault();
        showNotification('Please provide text, upload a file, or enter a URL', 'error');
        return;
      }
      
      if (loadingOverlay) loadingOverlay.classList.add('active');
    });
  }

  const exportActions = [
    { el: exportTxt, action: '/export/txt' },
    { el: exportPdf, action: '/export/pdf' }
  ];

  exportActions.forEach(({ el, action }) => {
    if (el) {
      el.addEventListener('click', () => {
        const output = document.querySelector('.summary-output');
        if (!output || !output.textContent.trim()) {
            showNotification('Nothing to export yet!', 'error');
            return;
        }
        
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = action;

        const textInput = document.createElement('input');
        textInput.type = 'hidden';
        textInput.name = 'summary_text';
        textInput.value = output.textContent;
        form.appendChild(textInput);

        // Pass mode if handwriting to include font in PDF
        if (action.includes('pdf')) {
            const modeInput = document.createElement('input');
            modeInput.type = 'hidden';
            modeInput.name = 'mode';
            const isHandwriting = output.classList.contains('handwriting-font');
            modeInput.value = isHandwriting ? 'handwriting' : 'paragraph';
            form.appendChild(modeInput);
        }

        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
        showNotification('Downloading...', 'success');
      });
    }
  });

  // ==================== Clipboard Logic ====================
  
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const output = document.querySelector('.summary-output');
      if (output) {
        if (output.classList.contains('handwriting-font')) {
            // Attempt to copy HTML with font style for rich text editors
            const htmlContent = `<div style="font-family: 'Caveat', cursive; font-size: 24px;">${output.textContent.replace(/\n/g, '<br>')}</div>`;
            copyRichText(htmlContent, output.textContent);
        } else {
            copyToClipboard(output.textContent);
        }
      }
    });
  }
  
  async function copyRichText(html, text) {
      try {
          const blobHtml = new Blob([html], { type: 'text/html' });
          const blobText = new Blob([text], { type: 'text/plain' });
          const data = [new ClipboardItem({
              'text/html': blobHtml,
              'text/plain': blobText
          })];
          await navigator.clipboard.write(data);
          showCopySuccess();
      } catch (err) {
          console.error('Rich copy failed, falling back to text', err);
          copyToClipboard(text);
      }
  }

  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      showCopySuccess();
    } catch (err) {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      showCopySuccess();
    }
  }

  function showCopySuccess() {
    if (copyBtn) {
      const originalHTML = copyBtn.innerHTML;
      copyBtn.classList.add('copied');
      copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
      setTimeout(() => {
        copyBtn.classList.remove('copied');
        copyBtn.innerHTML = originalHTML;
      }, 2000);
    } else {
      showNotification('Copied to clipboard!', 'success');
    }
  }

  // ==================== UI Notifications & Shortcuts ====================
  
  function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'error' ? 'danger' : 'success'} notification-toast`;
    notification.innerHTML = `<i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'check-circle'}"></i> ${message}`;
    
    notification.style.cssText = `
      position: fixed; bottom: 20px; left: 20px; z-index: 10000;
      min-width: 250px; padding: 1rem; border-radius: 12px;
      box-shadow: var(--shadow-lg); background: var(--bg-primary);
      border-left: 5px solid ${type === 'error' ? 'var(--danger)' : 'var(--success)'};
      animation: slideInLeft 0.3s ease forwards;
    `;
    
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.style.animation = 'fadeOut 0.5s ease forwards';
      setTimeout(() => notification.remove(), 500);
    }, 3000);
  }

  // Animation styles for notifications
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideInLeft { from { transform: translateX(-100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
  `;
  document.head.appendChild(style);

  // Keyboard Shortcuts
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && document.activeElement === userTextArea) {
      summarizeForm.submit();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      userTextArea.focus();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
      e.preventDefault();
      if (themeToggle) themeToggle.click();
    }
  });

  console.log('🚀 AI Summarizer Active');
});