// AI Summarizer — Professional SaaS Logic
document.addEventListener('DOMContentLoaded', function() {

  // ═══ DOM REFS ═══
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

  // ═══ CUSTOM INPUT TABS (replaces Bootstrap tabs) ═══
  const inputTabs = document.querySelectorAll('.input-tab');
  const inputPanels = document.querySelectorAll('.input-panel');

  inputTabs.forEach(tab => {
    tab.addEventListener('click', function() {
      inputTabs.forEach(t => t.classList.remove('active'));
      inputPanels.forEach(p => p.classList.remove('active'));
      this.classList.add('active');
      const target = document.getElementById(this.getAttribute('data-target'));
      if (target) target.classList.add('active');
    });
  });

  // ═══ THEME ═══
  function initTheme() {
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = saved || (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
    updateThemeIcon(theme);
    if (themeToggle) themeToggle.addEventListener('click', toggleTheme);
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    updateThemeIcon(next);
  }

  function updateThemeIcon(theme) {
    if (themeIcon) themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
  }

  // ═══ FILE UPLOAD ═══
  if (fileUpload) {
    fileUpload.addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (file) {
        if (fileName) fileName.textContent = file.name;
        if (fileNameDisplay) fileNameDisplay.style.display = 'flex';
      }
    });
  }
  if (clearFileBtn) {
    clearFileBtn.addEventListener('click', function() {
      if (fileUpload) fileUpload.value = '';
      if (fileName) fileName.textContent = '';
      if (fileNameDisplay) fileNameDisplay.style.display = 'none';
    });
  }

  // ═══ WORD COUNT ═══
  function getWordCount(text) {
    if (!text || text.trim().length === 0) return 0;
    return text.trim().split(/\s+/).length;
  }

  function updateWordCount() {
    if (!userTextArea || !inputStats) return;
    const text = userTextArea.value.trim();
    const words = getWordCount(text);
    const chars = text.length;
    inputStats.textContent = `${words} words · ${chars} characters`;
    if (chars > 48000) {
      inputStats.style.color = 'var(--danger)';
    } else if (chars > 40000) {
      inputStats.style.color = 'var(--warning)';
    } else {
      inputStats.style.color = '';
    }
  }

  // ═══ CONTROLS ═══
  if (lengthRange && lengthInput) {
    lengthRange.addEventListener('input', function(e) {
      lengthInput.value = e.target.value;
      updateLengthUI(e.target.value);
    });
  }
  lengthOptions.forEach(opt => {
    opt.addEventListener('click', function() {
      const val = this.getAttribute('data-value');
      if (lengthRange) lengthRange.value = val;
      if (lengthInput) lengthInput.value = val;
      updateLengthUI(val);
    });
  });

  function updateLengthUI(value) {
    lengthOptions.forEach(opt => {
      opt.classList.toggle('active', opt.getAttribute('data-value') === value);
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

  // ═══ FORM SUBMIT ═══
  if (summarizeForm) {
    summarizeForm.addEventListener('submit', function(e) {
      const activeTab = document.querySelector('.input-tab.active');
      const target = activeTab ? activeTab.getAttribute('data-target') : 'text-panel';
      let hasContent = false;

      if (target === 'text-panel') hasContent = userTextArea && userTextArea.value.trim().length > 0;
      else if (target === 'file-panel') hasContent = fileUpload && fileUpload.files.length > 0;
      else if (target === 'url-panel') hasContent = urlInput && urlInput.value.trim().length > 0;

      if (!hasContent) {
        e.preventDefault();
        showNotification('Please provide some input to summarize!', 'error');
        return;
      }

      if (loadingOverlay) loadingOverlay.classList.add('active');
    });
  }

  // ═══ COPY ═══
  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      showNotification('Copied to clipboard!', 'success');
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); showNotification('Copied!', 'success'); }
      catch { showNotification('Copy failed', 'error'); }
      document.body.removeChild(ta);
    }
  }

  if (copyBtn && summaryOutputElement) {
    copyBtn.addEventListener('click', function() {
      const text = summaryOutputElement.textContent.trim();
      if (text.length > 0) copyToClipboard(text);
      else showNotification('Nothing to copy!', 'warning');
    });
  }

  // ═══ EXPORT TXT ═══
  const exportTxt = document.getElementById('exportTxt');
  if (exportTxt && summaryOutputElement) {
    exportTxt.addEventListener('click', function() {
      const text = summaryOutputElement.textContent.trim();
      if (!text) return;
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = '/export/txt';
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = 'summary_text';
      input.value = text;
      form.appendChild(input);
      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);
    });
  }

  // ═══ EXPORT PDF ═══
  const exportPdf = document.getElementById('exportPdf');
  if (exportPdf && summaryOutputElement) {
    exportPdf.addEventListener('click', function() {
      const text = summaryOutputElement.textContent.trim();
      if (!text) return;
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = '/export/pdf';
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = 'summary_text';
      input.value = text;
      const modeField = document.createElement('input');
      modeField.type = 'hidden';
      modeField.name = 'mode';
      modeField.value = modeInput ? modeInput.value : 'paragraph';
      form.appendChild(input);
      form.appendChild(modeField);
      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);
    });
  }

  // ═══ TRANSLATE ═══
  document.querySelectorAll('.translate-option').forEach(function(item) {
    item.addEventListener('click', function(e) {
      e.preventDefault();
      const lang = this.getAttribute('data-lang');
      const text = summaryOutputElement ? summaryOutputElement.textContent.trim() : '';
      if (!text) { showNotification('No summary to translate!', 'warning'); return; }

      if (loadingOverlay) loadingOverlay.classList.add('active');

      fetch('/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text, target_language: lang })
      })
      .then(r => r.json())
      .then(data => {
        if (loadingOverlay) loadingOverlay.classList.remove('active');
        if (data.success && data.text) {
          summaryOutputElement.textContent = data.text;
          showNotification(`Translated to ${lang}!`, 'success');
        } else {
          showNotification(data.error || 'Translation failed', 'error');
        }
      })
      .catch(() => {
        if (loadingOverlay) loadingOverlay.classList.remove('active');
        showNotification('Translation failed', 'error');
      });
    });
  });

  // ═══ NOTIFICATION ═══
  function showNotification(message, type) {
    const existing = document.querySelector('.notification-toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = `notification-toast alert-${type || 'success'}`;
    const icons = { success:'fa-check-circle', error:'fa-exclamation-circle', info:'fa-info-circle', warning:'fa-exclamation-triangle' };
    toast.innerHTML = `<i class="fas ${icons[type] || icons.success}"></i> <span>${message}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(20px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // ═══ HISTORY ═══
  function loadHistory() {
    if (!historySection || !historyList) return;
    const history = JSON.parse(localStorage.getItem('summaryHistory') || '[]');
    if (history.length === 0) { historySection.style.display = 'none'; return; }
    historySection.style.display = 'block';
    historyList.innerHTML = '';
    history.forEach(function(item, index) {
      const div = document.createElement('div');
      div.className = 'history-item';
      const date = new Date(item.timestamp);
      const formatted = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
      div.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <small style="color:var(--t3);font-family:'JetBrains Mono',monospace;font-size:11px">${formatted}</small>
          <div class="history-item-actions">
            <button class="btn-export use-btn" style="padding:4px 8px;font-size:11px" title="Restore"><i class="fas fa-redo"></i></button>
            <button class="btn-export copy-btn" style="padding:4px 8px;font-size:11px" title="Copy"><i class="fas fa-copy"></i></button>
            <button class="btn-export delete-btn" style="padding:4px 8px;font-size:11px;color:var(--red);border-color:rgba(214,40,40,0.2)" title="Delete"><i class="fas fa-trash"></i></button>
          </div>
        </div>
        <div class="history-item-preview">${escapeHtml(item.summary)}</div>
        <div style="display:flex;gap:6px;margin-top:8px">
          <span class="stat-pill" style="font-size:10px;padding:3px 8px">${item.summaryWords} words</span>
        </div>
      `;
      div.querySelector('.use-btn').addEventListener('click', function() {
        if (summaryOutputElement) {
          summaryOutputElement.textContent = item.summary;
          window.scrollTo({top:summaryOutputElement.offsetTop - 100, behavior:'smooth'});
          showNotification('Summary restored!', 'success');
        }
      });
      div.querySelector('.copy-btn').addEventListener('click', function() { copyToClipboard(item.summary); });
      div.querySelector('.delete-btn').addEventListener('click', function() {
        let h = JSON.parse(localStorage.getItem('summaryHistory') || '[]');
        h.splice(index, 1);
        localStorage.setItem('summaryHistory', JSON.stringify(h));
        loadHistory();
        showNotification('Deleted', 'info');
      });
      historyList.appendChild(div);
    });
  }

  function saveToHistory(item) {
    let history = JSON.parse(localStorage.getItem('summaryHistory') || '[]');
    const isDup = history.some(h => h.summary.substring(0,100) === item.summary.substring(0,100));
    if (isDup) return;
    history.unshift(item);
    if (history.length > 10) history = history.slice(0,10);
    localStorage.setItem('summaryHistory', JSON.stringify(history));
    loadHistory();
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Save current result
  if (summaryOutputElement && summaryOutputElement.textContent.trim().length > 50) {
    const inputWords = userTextArea ? getWordCount(userTextArea.value) : 0;
    const summaryText = summaryOutputElement.textContent.trim();
    saveToHistory({
      summary: summaryText,
      inputWords: inputWords || (getWordCount(summaryText) * 3),
      summaryWords: getWordCount(summaryText),
      timestamp: new Date().toISOString()
    });
  }

  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener('click', function() {
      if (confirm('Clear all history?')) {
        localStorage.removeItem('summaryHistory');
        loadHistory();
        showNotification('History cleared', 'info');
      }
    });
  }

  // ═══ INIT ═══
  initTheme();
  loadHistory();
  if (userTextArea) {
    userTextArea.addEventListener('input', updateWordCount);
    updateWordCount();
  }
  // Set initial length UI
  if (lengthRange) updateLengthUI(lengthRange.value);
});
