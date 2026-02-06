// app.js - SaaS Pro Logic (Restored Exports & Translation)

document.addEventListener('DOMContentLoaded', function() {
    // Selectors
    const summarizeForm = document.getElementById('summarizeForm');
    const userTextArea = document.getElementById('user_text');
    const summaryOutput = document.querySelector('.summary-output');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const themeToggle = document.getElementById('themeToggle');

    // --- 1. DOWNLOAD RECOVERY (TXT & PDF) ---
    // This creates a hidden form to send data to your backend routes
    const setupExport = (btnId, endpoint) => {
        const btn = document.getElementById(btnId);
        if (!btn) return;

        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const content = summaryOutput.textContent.trim();
            
            if (!content || content.includes("Summary will appear here")) {
                showNotification("No content to export", "error");
                return;
            }

            const form = document.createElement('form');
            form.method = 'POST';
            form.action = endpoint;

            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = 'summary_text';
            input.value = content;

            // Include handwriting mode flag for PDF styling if needed
            if (endpoint.includes('pdf')) {
                const isHandwriting = summaryOutput.classList.contains('handwriting-font');
                const modeInput = document.createElement('input');
                modeInput.type = 'hidden';
                modeInput.name = 'mode';
                modeInput.value = isHandwriting ? 'handwriting' : 'standard';
                form.appendChild(modeInput);
            }

            form.appendChild(input);
            document.body.appendChild(form);
            form.submit();
            document.body.removeChild(form);
            showNotification("Downloading file...", "success");
        });
    };

    setupExport('exportTxt', '/export/txt');
    setupExport('exportPdf', '/export/pdf');

    // --- 2. TRANSLATION RECOVERY ---
    const translateOptions = document.querySelectorAll('.translate-option');
    translateOptions.forEach(option => {
        option.addEventListener('click', async function(e) {
            e.preventDefault();
            const lang = this.getAttribute('data-lang');
            const textToTranslate = summaryOutput.textContent.trim();

            if (!textToTranslate || textToTranslate.length < 5) {
                showNotification("Generate a summary first", "error");
                return;
            }

            // UI Loading State
            const originalContent = summaryOutput.innerHTML;
            summaryOutput.innerHTML = `
                <div class="text-center p-5">
                    <div class="spinner-border text-primary mb-3"></div>
                    <p class="text-muted">Translating to ${lang}...</p>
                </div>`;

            try {
                const response = await fetch('/translate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        text: textToTranslate,
                        target_language: lang
                    })
                });

                const data = await response.json();
                if (data.success) {
                    summaryOutput.innerHTML = data.text.replace(/\n/g, '<br>');
                    showNotification(`Translated to ${lang}`, "success");
                } else {
                    throw new Error(data.error);
                }
            } catch (err) {
                summaryOutput.innerHTML = originalContent;
                showNotification("Translation service unavailable", "error");
            }
        });
    });

    // --- 3. PROFESSIONAL TAB LOGIC ---
    const initTabs = (tabSelector, inputId) => {
        const tabs = document.querySelectorAll(tabSelector);
        const hiddenInput = document.getElementById(inputId);
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                if (hiddenInput) hiddenInput.value = tab.getAttribute('data-mode');
            });
        });
    };

    initTabs('.format-tab', 'modeInput');
    initTabs('.summary-mode-tab', 'summaryModeInput');

    // --- 4. THEME MANAGEMENT ---
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            const newTheme = isDark ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        });
    }

    // --- 5. UTILITIES ---
    function showNotification(msg, type = "success") {
        const toast = document.createElement('div');
        toast.className = `notification-toast ${type}`;
        toast.style.cssText = `
            position: fixed; bottom: 30px; right: 30px; 
            background: var(--bg-card); color: var(--text-main); 
            padding: 1rem 2rem; border-radius: 12px; 
            border-left: 5px solid ${type === 'error' ? 'var(--danger)' : 'var(--primary)'};
            box-shadow: 0 10px 30px rgba(0,0,0,0.2); z-index: 10000;
            animation: slideUp 0.3s ease;
        `;
        toast.innerText = msg;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 500);
        }, 3000);
    }

    // Copy to Clipboard
    const copyBtn = document.getElementById('copyBtn');
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            const text = summaryOutput.textContent;
            navigator.clipboard.writeText(text).then(() => {
                showNotification("Copied to clipboard!");
            });
        });
    }

    // Form Submission
    if (summarizeForm) {
        summarizeForm.addEventListener('submit', () => {
            if (userTextArea.value.trim().length > 0) {
                loadingOverlay.classList.add('active');
            }
        });
    }
});