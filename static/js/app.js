document.addEventListener('DOMContentLoaded', function() {
  var lengthRange = document.getElementById('lengthRange');
  var lengthInput = document.getElementById('lengthInput');
  var lengthOptions = document.querySelectorAll('.length-option');
  var formatTabs = document.querySelectorAll('.format-tab');
  var modeInput = document.getElementById('modeInput');
  var summaryModeTabs = document.querySelectorAll('.summary-mode-tab');
  var summaryModeInput = document.getElementById('summaryModeInput');
  var userTextArea = document.getElementById('user_text');
  var inputStats = document.getElementById('inputStats');
  var summarizeForm = document.getElementById('summarizeForm');
  var loadingOverlay = document.getElementById('loadingOverlay');
  var copyBtn = document.getElementById('copyBtn');
  var themeToggle = document.getElementById('themeToggle');
  var themeIcon = document.getElementById('themeIcon');
  var fileUpload = document.getElementById('fileUpload');
  var fileNameEl = document.getElementById('fileName');
  var clearFileBtn = document.getElementById('clearFile');
  var fileNameDisplay = document.getElementById('fileNameDisplay');
  var urlInput = document.getElementById('url_input');
  var historySection = document.getElementById('historySection');
  var historyList = document.getElementById('historyList');
  var clearHistoryBtn = document.getElementById('clearHistory');
  var summaryOutput = document.querySelector('.summary-output');

  // Tabs
  document.querySelectorAll('.input-tab').forEach(function(tab) {
    tab.addEventListener('click', function() {
      document.querySelectorAll('.input-tab').forEach(function(t) { t.classList.remove('active'); });
      document.querySelectorAll('.input-panel').forEach(function(p) { p.classList.remove('active'); });
      this.classList.add('active');
      var tgt = document.getElementById(this.getAttribute('data-target'));
      if (tgt) tgt.classList.add('active');
    });
  });

  // Theme
  (function() {
    var saved = localStorage.getItem('summarizer-theme');
    var pref = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = saved || (pref ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
    if (themeIcon) themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    if (themeToggle) themeToggle.addEventListener('click', function() {
      var c = document.documentElement.getAttribute('data-theme');
      var n = c === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', n);
      localStorage.setItem('summarizer-theme', n);
      if (themeIcon) themeIcon.className = n === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    });
  })();

  // File
  if (fileUpload) fileUpload.addEventListener('change', function(e) {
    var f = e.target.files[0];
    if (f) { if (fileNameEl) fileNameEl.textContent = f.name; if (fileNameDisplay) fileNameDisplay.style.display = 'flex'; }
  });
  if (clearFileBtn) clearFileBtn.addEventListener('click', function() {
    if (fileUpload) fileUpload.value = '';
    if (fileNameEl) fileNameEl.textContent = '';
    if (fileNameDisplay) fileNameDisplay.style.display = 'none';
  });

  // Word count
  function wc(t) { return (!t || !t.trim()) ? 0 : t.trim().split(/\s+/).length; }
  function updateWC() {
    if (!userTextArea || !inputStats) return;
    var t = userTextArea.value.trim(), w = wc(t), c = t.length;
    inputStats.textContent = w + ' words \u00b7 ' + c + ' characters';
    inputStats.style.color = c > 48000 ? 'var(--danger)' : c > 40000 ? 'var(--warning)' : '';
  }

  // Controls
  if (lengthRange && lengthInput) lengthRange.addEventListener('input', function(e) { lengthInput.value = e.target.value; uLUI(e.target.value); });
  lengthOptions.forEach(function(o) { o.addEventListener('click', function() { var v = this.getAttribute('data-value'); if (lengthRange) lengthRange.value = v; if (lengthInput) lengthInput.value = v; uLUI(v); }); });
  function uLUI(v) { lengthOptions.forEach(function(o) { o.classList.toggle('active', o.getAttribute('data-value') === v); }); }
  formatTabs.forEach(function(t) { t.addEventListener('click', function() { formatTabs.forEach(function(x) { x.classList.remove('active'); }); this.classList.add('active'); if (modeInput) modeInput.value = this.getAttribute('data-mode'); }); });
  summaryModeTabs.forEach(function(t) { t.addEventListener('click', function() { summaryModeTabs.forEach(function(x) { x.classList.remove('active'); }); this.classList.add('active'); if (summaryModeInput) summaryModeInput.value = this.getAttribute('data-mode'); }); });

  // Submit
  if (summarizeForm) summarizeForm.addEventListener('submit', function(e) {
    var at = document.querySelector('.input-tab.active'), tgt = at ? at.getAttribute('data-target') : 'text-panel', ok = false;
    if (tgt === 'text-panel') ok = userTextArea && userTextArea.value.trim().length > 0;
    else if (tgt === 'file-panel') ok = fileUpload && fileUpload.files.length > 0;
    else if (tgt === 'url-panel') ok = urlInput && urlInput.value.trim().length > 0;
    if (!ok) { e.preventDefault(); notify('Please provide input to summarize!', 'error'); return; }
    if (loadingOverlay) loadingOverlay.classList.add('active');
  });

  // Copy
  function cp(text) {
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(function() { notify('Copied!', 'success'); }).catch(function() { cpFB(text); });
    else cpFB(text);
  }
  function cpFB(text) {
    var ta = document.createElement('textarea'); ta.value = text; ta.style.cssText = 'position:fixed;left:-9999px';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); notify('Copied!', 'success'); } catch(e) { notify('Copy failed', 'error'); }
    document.body.removeChild(ta);
  }
  if (copyBtn && summaryOutput) copyBtn.addEventListener('click', function() { var t = summaryOutput.textContent.trim(); t.length > 0 ? cp(t) : notify('Nothing to copy', 'warning'); });

  // Export
  function expForm(action, extra) {
    var t = summaryOutput ? summaryOutput.textContent.trim() : ''; if (!t) return;
    var f = document.createElement('form'); f.method = 'POST'; f.action = action;
    var i = document.createElement('input'); i.type = 'hidden'; i.name = 'summary_text'; i.value = t; f.appendChild(i);
    if (extra) { var m = document.createElement('input'); m.type = 'hidden'; m.name = extra.n; m.value = extra.v; f.appendChild(m); }
    document.body.appendChild(f); f.submit(); document.body.removeChild(f);
  }
  var eTxt = document.getElementById('exportTxt'); if (eTxt) eTxt.addEventListener('click', function() { expForm('/export/txt'); });
  var ePdf = document.getElementById('exportPdf'); if (ePdf) ePdf.addEventListener('click', function() { expForm('/export/pdf', {n:'mode',v:modeInput?modeInput.value:'paragraph'}); });

  // Translate
  document.querySelectorAll('.translate-option').forEach(function(item) {
    item.addEventListener('click', function(e) {
      e.preventDefault(); var lang = this.getAttribute('data-lang');
      var text = summaryOutput ? summaryOutput.textContent.trim() : '';
      if (!text) { notify('No summary to translate!', 'warning'); return; }
      if (loadingOverlay) loadingOverlay.classList.add('active');
      fetch('/translate', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({text:text,target_language:lang}) })
        .then(function(r) { return r.json(); })
        .then(function(d) { if (loadingOverlay) loadingOverlay.classList.remove('active'); if (d.success && d.text) { summaryOutput.textContent = d.text; notify('Translated to ' + lang + '!', 'success'); } else notify(d.error || 'Translation failed', 'error'); })
        .catch(function() { if (loadingOverlay) loadingOverlay.classList.remove('active'); notify('Translation failed', 'error'); });
    });
  });

  // Notification
  function notify(msg, type) {
    var ex = document.querySelector('.notification-toast'); if (ex) ex.remove();
    var t = document.createElement('div'); t.className = 'notification-toast alert-' + (type || 'success');
    var ic = {success:'fa-check-circle',error:'fa-exclamation-circle',info:'fa-info-circle',warning:'fa-exclamation-triangle'};
    t.innerHTML = '<i class="fas ' + (ic[type]||ic.success) + '"></i> ' + msg;
    document.body.appendChild(t);
    setTimeout(function() { t.style.opacity = '0'; t.style.transform = 'translateY(20px)'; t.style.transition = 'all 0.3s'; setTimeout(function() { t.remove(); }, 300); }, 3000);
  }

  // History
  function restoreSummary(text) {
    if (summaryOutput) {
      summaryOutput.textContent = text;
      window.scrollTo({top:summaryOutput.offsetTop-80,behavior:'smooth'});
      notify('Summary restored!','success');
    }
  }

  function loadH() {
    if (!historySection || !historyList) return;
    var h = JSON.parse(localStorage.getItem('summaryHistory') || '[]');
    if (!h.length) { historySection.style.display = 'none'; return; }
    historySection.style.display = 'block'; historyList.innerHTML = '';
    h.forEach(function(item, idx) {
      var d = document.createElement('div'); d.className = 'history-item';
      var dt = new Date(item.timestamp), fmt = dt.toLocaleDateString() + ' ' + dt.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
      d.innerHTML =
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">' +
          '<small style="color:var(--t3);font-family:JetBrains Mono,monospace;font-size:11px">' + fmt + '</small>' +
          '<div class="history-item-actions">' +
            '<button class="hist-btn use-btn" title="Restore this summary"><i class="fas fa-rotate-right"></i></button>' +
            '<button class="hist-btn copy-hbtn" title="Copy to clipboard"><i class="fas fa-copy"></i></button>' +
            '<button class="hist-btn del-btn hist-btn-danger" title="Delete from history"><i class="fas fa-trash-can"></i></button>' +
          '</div>' +
        '</div>' +
        '<div class="history-item-preview history-item-clickable" title="Click to restore this summary">' + esc(item.summary) + '</div>' +
        '<div style="margin-top:8px"><span class="stat-pill" style="font-size:10px;padding:3px 9px">' + item.summaryWords + ' words</span></div>';
      d.querySelector('.use-btn').addEventListener('click', function(e) { e.stopPropagation(); restoreSummary(item.summary); });
      d.querySelector('.history-item-clickable').addEventListener('click', function() { restoreSummary(item.summary); });
      d.querySelector('.copy-hbtn').addEventListener('click', function(e) { e.stopPropagation(); cp(item.summary); });
      d.querySelector('.del-btn').addEventListener('click', function(e) { e.stopPropagation(); var a = JSON.parse(localStorage.getItem('summaryHistory')||'[]'); a.splice(idx,1); localStorage.setItem('summaryHistory',JSON.stringify(a)); loadH(); notify('Deleted','info'); });
      historyList.appendChild(d);
    });
  }
  function saveH(item) {
    var h = JSON.parse(localStorage.getItem('summaryHistory') || '[]');
    if (h.some(function(x) { return x.summary.substring(0,100) === item.summary.substring(0,100); })) return;
    h.unshift(item); if (h.length > 10) h = h.slice(0,10);
    localStorage.setItem('summaryHistory', JSON.stringify(h)); loadH();
  }
  function esc(t) { var d = document.createElement('div'); d.textContent = t; return d.innerHTML; }
  if (summaryOutput && summaryOutput.textContent.trim().length > 50) {
    var iw = userTextArea ? wc(userTextArea.value) : 0, st = summaryOutput.textContent.trim();
    saveH({summary:st, inputWords:iw||(wc(st)*3), summaryWords:wc(st), timestamp:new Date().toISOString()});
  }
  if (clearHistoryBtn) clearHistoryBtn.addEventListener('click', function() { if (confirm('Clear all history?')) { localStorage.removeItem('summaryHistory'); loadH(); notify('Cleared','info'); }});

  // Init
  loadH();
  if (userTextArea) { userTextArea.addEventListener('input', updateWC); updateWC(); }
  if (lengthRange) uLUI(lengthRange.value);
});