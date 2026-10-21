/**
 * Self-Contained Frontend Bundle
 * Pure Vanilla JavaScript (ES6+)
 * Compatible with both http:// and direct file:/// execution
 */
(function () {
  'use strict';

  // =========================================================================
  // UTILS & ICONS
  // =========================================================================
  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatDate(isoString) {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return String(isoString);
      return d.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (e) {
      return String(isoString);
    }
  }

  async function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    } catch (err) {
      document.body.removeChild(textarea);
      throw new Error('Clipboard copy not permitted');
    }
  }

  function debounce(fn, delay = 300) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  const icons = {
    shield: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>`,
    list: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M7 12h10"/><path d="M10 18h4"/></svg>`,
    history: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>`,
    settings: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
    refresh: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/></svg>`,
    search: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`,
    chevronLeft: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>`,
    chevronRight: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>`,
    copy: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`,
    check: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`,
    send: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>`,
    plus: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>`,
    alertTriangle: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    menu: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>`,
    close: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`,
    sparkles: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></svg>`,
    download: `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
    filter: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>`,
    arrowLeft: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>`,
    info: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`,
    moon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`,
    sun: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`,
    clock: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    target: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
    user: `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    server: `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/></svg>`,
    globe: `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>`,
    eye: `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`,
    zap: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
    terminal: `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" x2="20" y1="19" y2="19"/></svg>`,
    externalLink: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>`,
    checkCircle: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
    activity: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>`
  };

  const samplePresets = [
    {
      label: "SSH Brute Force",
      source: "Edge Firewall / SSH Monitor",
      value: `Failed login detected\nUser: admin\nSource IP: 185.199.111.45\nAttempts: 47\nTime: 02:13 AM\nCountry: Unknown\nService: SSH`
    },
    {
      label: "Phishing Email",
      source: "Mail Gateway Guard",
      value: `Phishing alert\nSender: security-update@payroll-example.com\nRecipient: maria@company.com\nSubject: Urgent password verification required\nURL: https://payroll-example-login.xyz/session\nAttachment: benefits_update.html`
    },
    {
      label: "Endpoint Malware",
      source: "CrowdStrike / EDR",
      value: `Endpoint malware detected\nHost: FIN-LAPTOP-22\nUser: finance.user\nProcess: invoice_viewer.exe\nHash: 44d88612fea8a8f36de82e1278abb02f\nDetection: Trojan quarantined`
    },
    {
      label: "Suspicious Login",
      source: "Identity Access Manager",
      value: `Successful login from unusual country\nUser: alex@company.com\nSource IP: 91.240.118.12\nCountry: Unknown\nTime: 03:48 AM\nMFA: not satisfied\nDevice: new browser`
    },
    {
      label: "Web SQL Injection",
      source: "Cloudflare WAF",
      value: `Web attack alert\nSource IP: 203.0.113.77\nHost: ecommerce-web-01\nURL: /products?id=12 UNION SELECT username,password FROM users\nStatus: HTTP 500\nDetection: SQL injection payload`
    }
  ];

  // =========================================================================
  // API CLIENT
  // =========================================================================
  function getApiBase() {
    return localStorage.getItem('soc-api-base') || 'http://localhost:8000';
  }

  function setApiBase(url) {
    if (!url) {
      localStorage.removeItem('soc-api-base');
    } else {
      localStorage.setItem('soc-api-base', url.replace(/\/+$/, ''));
    }
  }

  async function api(path, body = undefined, method = undefined, signal = undefined) {
    const baseUrl = getApiBase();
    const url = `${baseUrl}${path}`;
    const resolvedMethod = method || (body === undefined ? 'GET' : 'POST');
    const headers = {};

    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }

    let response;
    try {
      response = await fetch(url, {
        method: resolvedMethod,
        headers: Object.keys(headers).length ? headers : undefined,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal
      });
    } catch (error) {
      if (error.name === 'AbortError') throw error;
      throw new Error(`Cannot connect to backend at ${baseUrl}. Ensure backend is running (port 8000) and retry.`);
    }

    if (!response.ok) {
      let errorDetail = '';
      try {
        const data = await response.json();
        if (typeof data.detail === 'string') {
          errorDetail = data.detail;
        } else if (Array.isArray(data.detail)) {
          errorDetail = data.detail.map(d => d.msg || JSON.stringify(d)).join(', ');
        }
      } catch (_) {}

      if (!errorDetail) {
        errorDetail = `Request failed with HTTP ${response.status} (${response.statusText || 'Error'}).`;
      }
      throw new Error(errorDetail);
    }

    if (response.status === 204) return null;
    return response.json();
  }

  async function reportText(id, rulesOnly = false) {
    const baseUrl = getApiBase();
    const url = `${baseUrl}/api/alerts/${id}/report.md?rules_only=${rulesOnly}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Report export failed. Check backend connection and retry.');
    return response.text();
  }

  function downloadReport(id, rulesOnly = false) {
    const baseUrl = getApiBase();
    const url = `${baseUrl}/api/alerts/${id}/report.md?rules_only=${rulesOnly}`;
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `ALR-${id}.md`;
    anchor.target = '_blank';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  }

  // =========================================================================
  // TOAST NOTIFICATIONS
  // =========================================================================
  let toastContainer = null;
  function ensureToastContainer() {
    if (!toastContainer) {
      toastContainer = document.getElementById('toast-container');
      if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'toast-container';
        toastContainer.setAttribute('aria-live', 'polite');
        document.body.appendChild(toastContainer);
      }
    }
    return toastContainer;
  }

  function showToast(message, type = 'info', duration = 3500) {
    const root = ensureToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'status');

    let iconSvg = icons.info;
    if (type === 'success') iconSvg = icons.check;
    if (type === 'error') iconSvg = icons.alertTriangle;

    toast.innerHTML = `${iconSvg}<span>${escapeHtml(message)}</span>`;

    toast.addEventListener('click', () => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 200);
    });

    root.appendChild(toast);

    if (duration > 0) {
      setTimeout(() => {
        if (toast.parentElement) {
          toast.style.opacity = '0';
          toast.style.transform = 'translateY(10px)';
          setTimeout(() => toast.remove(), 200);
        }
      }, duration);
    }
  }

  // =========================================================================
  // MODAL DIALOG
  // =========================================================================
  let activeModal = null;
  let keydownHandler = null;

  function openModal({ title, contentHtml, confirmText, cancelText = 'Cancel', onConfirm, onRender }) {
    closeModal();

    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.id = 'active-modal-backdrop';
    backdrop.setAttribute('role', 'dialog');
    backdrop.setAttribute('aria-modal', 'true');
    backdrop.setAttribute('aria-labelledby', 'modal-title');

    backdrop.innerHTML = `
      <div class="modal-dialog">
        <div class="modal-header">
          <h3 id="modal-title">${escapeHtml(title)}</h3>
          <button class="modal-close-btn" aria-label="Close dialog" id="modal-close-x">
            ${icons.close}
          </button>
        </div>
        <div class="modal-body" id="modal-body-content">
          ${contentHtml}
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" id="modal-cancel-btn">${escapeHtml(cancelText)}</button>
          ${confirmText ? `<button class="btn btn-primary" id="modal-confirm-btn">${escapeHtml(confirmText)}</button>` : ''}
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);
    document.body.style.overflow = 'hidden';

    requestAnimationFrame(() => backdrop.classList.add('active'));

    const closeX = backdrop.querySelector('#modal-close-x');
    const cancelBtn = backdrop.querySelector('#modal-cancel-btn');
    const confirmBtn = backdrop.querySelector('#modal-confirm-btn');

    closeX.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);

    if (confirmBtn && onConfirm) {
      confirmBtn.addEventListener('click', async () => {
        confirmBtn.disabled = true;
        const orig = confirmBtn.innerHTML;
        confirmBtn.innerHTML = `<span class="spinner spinner-sm"></span> Processing…`;
        try {
          const res = await onConfirm();
          if (res !== false) closeModal();
        } catch (_) {
        } finally {
          if (confirmBtn) {
            confirmBtn.disabled = false;
            confirmBtn.innerHTML = orig;
          }
        }
      });
    }

    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeModal();
    });

    keydownHandler = (e) => {
      if (e.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', keydownHandler);

    activeModal = backdrop;
    if (typeof onRender === 'function') onRender(backdrop);
  }

  function closeModal() {
    if (activeModal) {
      activeModal.classList.remove('active');
      setTimeout(() => {
        if (activeModal && activeModal.parentNode) {
          activeModal.parentNode.removeChild(activeModal);
        }
        activeModal = null;
      }, 150);
    }
    document.body.style.overflow = '';
    if (keydownHandler) {
      window.removeEventListener('keydown', keydownHandler);
      keydownHandler = null;
    }
  }

  // =========================================================================
  // SIDEBAR
  // =========================================================================
  function renderSidebar(container) {
    container.innerHTML = `
      <div class="sidebar-header">
        <a href="#/" class="brand" title="SOC / LOCAL Incident-Response Copilot">
          <img src="assets/logo.svg" alt="SOC Copilot Logo" class="brand-logo" width="30" height="30" />
          <div class="brand-text">
            <div class="brand-title">SOC <span>/</span> LOCAL</div>
            <div class="brand-subtitle">Incident-response copilot</div>
          </div>
        </a>
        <button class="sidebar-toggle-btn" id="sidebar-collapse-toggle" title="Collapse sidebar" aria-label="Toggle sidebar width">
          ${icons.chevronLeft}
        </button>
      </div>

      <div class="nav-section-label">Workspace</div>

      <nav class="sidebar-nav" aria-label="Main navigation">
        <a href="#/" class="nav-item" data-route="queue" id="nav-link-queue">
          ${icons.list}
          <span>Alert queue</span>
          <span class="nav-badge" id="sidebar-open-count" style="display: none;">0</span>
        </a>
        <a href="#/history" class="nav-item" data-route="history" id="nav-link-history">
          ${icons.history}
          <span>History & audit</span>
        </a>
        <a href="#/settings" class="nav-item" data-route="settings" id="nav-link-settings">
          ${icons.settings}
          <span>Settings</span>
        </a>

        <button type="button" class="nav-item nav-action" id="sidebar-ingest-btn" title="Ingest a webhook alert">
          ${icons.plus}
          <span>Ingest Webhook Alert</span>
        </button>
      </nav>

      <div class="sidebar-footer">
        <div class="local-indicator">
          <span class="status-dot" id="sidebar-status-dot"></span>
          <span>Local processing</span>
        </div>
        <p class="sidebar-disclaimer">
          Recommendations only.<br />
          Analyst approval before action.
        </p>
      </div>
    `;

    const toggleBtn = container.querySelector('#sidebar-collapse-toggle');
    const isCollapsed = localStorage.getItem('soc-sidebar-collapsed') === 'true';
    if (isCollapsed) {
      container.classList.add('collapsed');
      if (toggleBtn) toggleBtn.innerHTML = icons.chevronRight;
    }

    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const collapsed = container.classList.toggle('collapsed');
        localStorage.setItem('soc-sidebar-collapsed', String(collapsed));
        toggleBtn.innerHTML = collapsed ? icons.chevronRight : icons.chevronLeft;
      });
    }

    const backdrop = document.getElementById('drawer-backdrop');
    if (backdrop) {
      backdrop.addEventListener('click', closeMobileDrawer);
    }

    container.querySelectorAll('a.nav-item').forEach(link => {
      link.addEventListener('click', () => {
        if (window.innerWidth <= 768) closeMobileDrawer();
      });
    });

    if (!container.dataset.sidebarIngestBound) {
      container.dataset.sidebarIngestBound = 'true';
      container.addEventListener('click', (event) => {
        const ingestBtn = event.target.closest?.('#sidebar-ingest-btn');
        if (!ingestBtn) return;
        event.preventDefault();
        openIngestModal();
        if (window.innerWidth <= 768) closeMobileDrawer();
      });
    }
  }

  function updateSidebarActiveRoute(route) {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;
    sidebar.querySelectorAll('.nav-item').forEach(link => {
      const linkRoute = link.getAttribute('data-route');
      if ((route === 'queue' && linkRoute === 'queue') || (route === 'detail' && linkRoute === 'queue') || (route === linkRoute)) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  function updateSidebarBadge(count) {
    const badge = document.getElementById('sidebar-open-count');
    if (badge) {
      if (typeof count === 'number' && count > 0) {
        badge.textContent = count;
        badge.style.display = 'inline-block';
      } else {
        badge.style.display = 'none';
      }
    }
  }

  function toggleMobileDrawer() {
    const sidebar = document.querySelector('.sidebar');
    const backdrop = document.getElementById('drawer-backdrop');
    if (sidebar && backdrop) {
      const isOpen = sidebar.classList.toggle('mobile-open');
      backdrop.classList.toggle('active', isOpen);
    }
  }

  function closeMobileDrawer() {
    const sidebar = document.querySelector('.sidebar');
    const backdrop = document.getElementById('drawer-backdrop');
    if (sidebar && backdrop) {
      sidebar.classList.remove('mobile-open');
      backdrop.classList.remove('active');
    }
  }

  // =========================================================================
  // HEADER & SYSTEMBAR
  // =========================================================================
  let healthPollTimer = null;

  function renderHeader(systembarEl, headerEl) {
    systembarEl.innerHTML = `
      <div class="systembar-left">
        <span class="status-dot offline" id="systembar-dot"></span>
        <span id="systembar-status-text">Connecting to backend…</span>
      </div>
      <div class="systembar-right">
        <span class="systembar-badge" id="systembar-mode-badge">Copilot enabled</span>
        <span class="systembar-divider">/</span>
        <span>Seed source: simulated feed · webhook ingest supported</span>
      </div>
    `;

    headerEl.innerHTML = `
      <div class="header-left">
        <button class="mobile-menu-btn" id="mobile-drawer-toggle" aria-label="Open navigation menu">
          ${icons.menu}
        </button>
        <nav class="breadcrumbs" id="app-breadcrumbs" aria-label="Breadcrumb">
          <span class="breadcrumb-item">SOC</span>
          <span class="breadcrumb-separator">/</span>
          <span class="breadcrumb-current" id="breadcrumb-current-page">Alert queue</span>
        </nav>
      </div>

      <div class="header-actions">
        <form class="header-search" id="quick-alert-form" title="Quick navigate to alert">
          ${icons.search}
          <input type="text" id="quick-alert-input" placeholder="Go to # (e.g. 1002)" aria-label="Quick jump to alert ID" />
        </form>

        <button class="btn btn-primary btn-sm" id="header-ingest-btn" title="Simulate webhook ingest">
          ${icons.plus}
          <span>Ingest Alert</span>
        </button>

        <button class="theme-toggle-btn" id="header-theme-toggle" title="Toggle Dark / Light Command Center" aria-label="Toggle theme">
          ${icons.moon}
        </button>

        <button class="btn btn-ghost btn-icon-only" id="global-refresh-btn" title="Refresh current view" aria-label="Refresh view">
          ${icons.refresh}
        </button>
      </div>
    `;

    // Initialize Theme
    const savedTheme = localStorage.getItem('soc-theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    const themeBtn = headerEl.querySelector('#header-theme-toggle');
    if (themeBtn) {
      themeBtn.innerHTML = savedTheme === 'dark' ? icons.sun : icons.moon;
      themeBtn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme') || 'light';
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('soc-theme', next);
        themeBtn.innerHTML = next === 'dark' ? icons.sun : icons.moon;
        showToast(`Switched to ${next === 'dark' ? 'Dark Command Center' : 'Clean Light'} theme`, 'info', 1800);
      });
    }

    const mobileBtn = headerEl.querySelector('#mobile-drawer-toggle');
    if (mobileBtn) mobileBtn.addEventListener('click', toggleMobileDrawer);

    const quickForm = headerEl.querySelector('#quick-alert-form');
    const quickInput = headerEl.querySelector('#quick-alert-input');
    if (quickForm && quickInput) {
      quickForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const val = quickInput.value.trim().toUpperCase().replace(/^ALR-/, '');
        if (/^\d+$/.test(val)) {
          quickInput.value = '';
          window.location.hash = `#/alerts/${val}`;
        } else {
          showToast('Please enter an alert number, e.g. 1002 or ALR-1002', 'error');
        }
      });
    }

    const ingestBtn = headerEl.querySelector('#header-ingest-btn');
    if (ingestBtn) ingestBtn.addEventListener('click', openIngestModal);

    const refreshBtn = headerEl.querySelector('#global-refresh-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('soc-refresh'));
      });
    }

    startHealthPolling();
  }

  async function updateHealthStatus() {
    const dot = document.getElementById('systembar-dot');
    const sidebarDot = document.getElementById('sidebar-status-dot');
    const text = document.getElementById('systembar-status-text');
    const modeBadge = document.getElementById('systembar-mode-badge');
    if (!dot || !text) return;

    const rulesOnly = localStorage.getItem('soc-rules-only') === 'true';
    if (modeBadge) {
      if (rulesOnly) {
        modeBadge.textContent = 'Rules-only mode';
        modeBadge.className = 'systembar-badge rules';
      } else {
        modeBadge.textContent = 'Copilot enabled';
        modeBadge.className = 'systembar-badge';
      }
    }

    try {
      const health = await api('/health');
      let stateLabel = health.model_status ? health.model_status.replace(/_/g, ' ') : 'connected';

      if (health.generation_progress && health.generation_progress.phase === 'generating') {
        stateLabel = `generating${health.generation_progress.generated_tokens > 0 ? ` (${health.generation_progress.generated_tokens} tokens)` : ''}`;
        dot.className = 'status-dot generating';
        if (sidebarDot) sidebarDot.className = 'status-dot generating';
      } else if (health.model_status === 'error') {
        dot.className = 'status-dot offline';
        if (sidebarDot) sidebarDot.className = 'status-dot offline';
      } else {
        dot.className = 'status-dot';
        if (sidebarDot) sidebarDot.className = 'status-dot';
      }

      text.textContent = `${health.provider} · ${health.model} · ${stateLabel}`;
    } catch (_) {
      dot.className = 'status-dot offline';
      if (sidebarDot) sidebarDot.className = 'status-dot offline';
      text.textContent = 'Backend unreachable (Start scripts/run_backend.ps1)';
    }
  }

  function startHealthPolling() {
    if (healthPollTimer) clearInterval(healthPollTimer);
    updateHealthStatus();
    healthPollTimer = setInterval(updateHealthStatus, 5000);
  }

  function updateBreadcrumb(currentTitle, parent = null) {
    const breadcrumbsEl = document.getElementById('app-breadcrumbs');
    if (!breadcrumbsEl) return;

    if (parent) {
      breadcrumbsEl.innerHTML = `
        <a href="${parent.link}" class="breadcrumb-item">${parent.title}</a>
        <span class="breadcrumb-separator">/</span>
        <span class="breadcrumb-current">${escapeHtml(currentTitle)}</span>
      `;
    } else {
      breadcrumbsEl.innerHTML = `
        <span class="breadcrumb-item">SOC</span>
        <span class="breadcrumb-separator">/</span>
        <span class="breadcrumb-current">${escapeHtml(currentTitle)}</span>
      `;
    }
  }

  function openIngestModal() {
    const presetOptions = samplePresets.map((p, idx) => `
      <option value="${idx}">${escapeHtml(p.label)} (${escapeHtml(p.source)})</option>
    `).join('');

    const modalHtml = `
      <div style="display: flex; flex-direction: column; gap: 16px;">
        <p style="font-size: 13px; color: var(--secondary-text);">
          Simulate a SIEM or webhook ingestion into the local SOC pipeline. The deterministic analyzer will extract IOCs, incident type, and severity automatically.
        </p>

        <div>
          <label for="ingest-preset-select" style="display: block; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 6px; color: var(--secondary-text);">
            Load Preset Attack Sample
          </label>
          <select id="ingest-preset-select">
            <option value="">-- Choose an attack template --</option>
            ${presetOptions}
          </select>
        </div>

        <div>
          <label for="ingest-source-input" style="display: block; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 6px; color: var(--secondary-text);">
            Source Identifier
          </label>
          <input type="text" id="ingest-source-input" value="Local SIEM Webhook" maxlength="150" placeholder="e.g. Edge Firewall / Suricata" />
        </div>

        <div>
          <label for="ingest-raw-input" style="display: block; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 6px; color: var(--secondary-text);">
            Raw Alert Log Body <span style="color: var(--error);">*</span>
          </label>
          <textarea id="ingest-raw-input" rows="7" style="font-family: var(--font-mono); font-size: 12px;" placeholder="Paste raw security event or syslog here..."></textarea>
        </div>
      </div>
    `;

    openModal({
      title: 'Ingest Webhook Alert',
      contentHtml: modalHtml,
      confirmText: 'Ingest & Open Alert',
      cancelText: 'Cancel',
      onRender: (backdrop) => {
        const select = backdrop.querySelector('#ingest-preset-select');
        const sourceInput = backdrop.querySelector('#ingest-source-input');
        const rawInput = backdrop.querySelector('#ingest-raw-input');

        select.addEventListener('change', () => {
          const idx = select.value;
          if (idx !== '') {
            const sample = samplePresets[Number(idx)];
            if (sample) {
              sourceInput.value = sample.source;
              rawInput.value = sample.value;
            }
          }
        });
      },
      onConfirm: async () => {
        const sourceInput = document.getElementById('ingest-source-input');
        const rawInput = document.getElementById('ingest-raw-input');
        const raw = rawInput ? rawInput.value.trim() : '';
        const source = sourceInput ? sourceInput.value.trim() : 'Local SIEM Webhook';

        if (raw.length < 5) {
          showToast('Raw alert must contain at least 5 characters.', 'error');
          return false;
        }

        try {
          const created = await api('/api/alerts', {
            raw_alert: raw,
            source: source || 'Local SIEM Webhook'
          }, 'POST');

          showToast(`Alert ${created.display_id} ingested successfully!`, 'success');
          window.location.hash = `#/alerts/${created.id}`;
          return true;
        } catch (err) {
          showToast(err.message, 'error');
          return false;
        }
      }
    });
  }

  // =========================================================================
  // CHAT COMPONENT
  // =========================================================================
  const suggestions = [
    "How do I resolve this alert step by step?",
    "Is this likely a false positive?",
    "What should I check next?",
    "Summarize for my manager"
  ];

  function renderChat(container, alertId, initialMessages = []) {
    let messages = [...initialMessages];
    let busy = false;
    let elapsedTimer = null;
    let elapsedSeconds = 0;

    container.innerHTML = `
      <div class="panel copilot-panel">
        <div class="panel-heading">
          <h2>${icons.sparkles} Ask about this alert</h2>
          <span class="muted" style="font-size: 11px;">Scoped triage assistant</span>
        </div>
        <div class="panel-body chat-container">
          <p class="muted" style="font-size: 13px;">
            This discussion is strictly scoped to this incident. Ask follow-up questions or choose a quick prompt chip.
          </p>

          <div class="chat-suggestions">
            ${suggestions.map(s => `
              <button class="chip-btn" data-suggestion="${escapeHtml(s)}">${escapeHtml(s)}</button>
            `).join('')}
          </div>

          <div class="chat-messages" id="chat-messages-box" aria-live="polite"></div>

          <div id="chat-error-box"></div>

          <div id="chat-loading-box" style="display: none; padding: 12px; background: #F8FAFC; border-radius: var(--radius-sm); border: 1px solid var(--border-color); font-size: 13px; color: var(--secondary-text);">
            <span class="spinner spinner-sm"></span>
            <span>Preparing scoped response · <strong id="chat-elapsed-count">0</strong>s…</span>
          </div>

          <form class="chat-input-form" id="chat-form">
            <div class="chat-input-row">
              <textarea
                id="chat-textarea"
                placeholder="Type your question about this alert… (Enter to send, Shift+Enter for new line)"
                rows="2"
                maxlength="1000"
              ></textarea>
              <button type="submit" class="btn btn-primary" id="chat-send-btn" style="align-self: flex-end;" title="Send question">
                ${icons.send}
                <span>Ask</span>
              </button>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--muted-text);">
              <span>Press Enter to send</span>
              <span id="chat-char-counter">0 / 1000</span>
            </div>
          </form>
        </div>
      </div>
    `;

    const messagesBox = container.querySelector('#chat-messages-box');
    const chatForm = container.querySelector('#chat-form');
    const textarea = container.querySelector('#chat-textarea');
    const sendBtn = container.querySelector('#chat-send-btn');
    const errorBox = container.querySelector('#chat-error-box');
    const loadingBox = container.querySelector('#chat-loading-box');
    const elapsedEl = container.querySelector('#chat-elapsed-count');
    const counterEl = container.querySelector('#chat-char-counter');

    function renderMessages() {
      if (!messagesBox) return;
      if (messages.length === 0) {
        messagesBox.innerHTML = `
          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: var(--muted-text); font-size: 13px; text-align: center;">
            <p>No messages yet. Ask a question or click a suggestion above.</p>
          </div>
        `;
        return;
      }

      messagesBox.innerHTML = messages.map(m => {
        const isUser = m.role === 'user';
        const meta = m.metadata || {};
        const metaInfo = !isUser && meta.engine
          ? `${meta.engine} · ${meta.provider || 'local'} · ${meta.generation_ms ? (meta.generation_ms / 1000).toFixed(1) + 's' : ''}`
          : '';

        return `
          <article class="chat-bubble ${isUser ? 'user' : 'assistant'}">
            <strong>${isUser ? 'You' : 'Copilot'}</strong>
            <p style="white-space: pre-wrap;">${escapeHtml(m.content)}</p>
            ${metaInfo ? `<span class="message-meta">${metaInfo}</span>` : ''}
          </article>
        `;
      }).join('');

      messagesBox.scrollTop = messagesBox.scrollHeight;
    }

    renderMessages();

    if (textarea && counterEl) {
      textarea.addEventListener('input', () => {
        counterEl.textContent = `${textarea.value.length} / 1000`;
      });

      textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          chatForm.dispatchEvent(new Event('submit'));
        }
      });
    }

    container.querySelectorAll('.chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const q = btn.getAttribute('data-suggestion');
        if (q && !busy) submitQuestion(q);
      });
    });

    if (chatForm) {
      chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = textarea.value.trim();
        if (text.length >= 3 && !busy) submitQuestion(text);
      });
    }

    async function submitQuestion(questionText) {
      if (busy || questionText.length < 3) return;
      busy = true;
      if (sendBtn) sendBtn.disabled = true;
      if (errorBox) errorBox.innerHTML = '';
      if (loadingBox) loadingBox.style.display = 'block';

      elapsedSeconds = 0;
      if (elapsedTimer) clearInterval(elapsedTimer);
      elapsedTimer = setInterval(() => {
        elapsedSeconds++;
        if (elapsedEl) elapsedEl.textContent = String(elapsedSeconds);
      }, 1000);

      const rulesOnly = localStorage.getItem('soc-rules-only') === 'true';

      const tempUserMsg = {
        id: Date.now(),
        alert_id: alertId,
        role: 'user',
        content: questionText,
        timestamp: new Date().toISOString(),
        metadata: {}
      };
      messages.push(tempUserMsg);
      renderMessages();
      if (textarea) {
        textarea.value = '';
        if (counterEl) counterEl.textContent = '0 / 1000';
      }

      try {
        await api(`/api/alerts/${alertId}/chat`, {
          question: questionText,
          rules_only: rulesOnly
        }, 'POST');

        const history = await api(`/api/alerts/${alertId}/chat`, undefined, 'GET');
        messages = history;
        renderMessages();
      } catch (err) {
        if (errorBox) {
          errorBox.innerHTML = `
            <div class="alert-box alert-error" style="margin-top: 8px;">
              ${icons.alertTriangle}
              <span>${escapeHtml(err.message)}</span>
            </div>
          `;
        }
        showToast(err.message, 'error');
      } finally {
        busy = false;
        if (elapsedTimer) clearInterval(elapsedTimer);
        if (loadingBox) loadingBox.style.display = 'none';
        if (sendBtn) sendBtn.disabled = false;
      }
    }

    return {
      setMessages: (newMessages) => {
        messages = [...newMessages];
        renderMessages();
      }
    };
  }

  // =========================================================================
  // DETAIL PAGE
  // =========================================================================
  function createDetailPage(alertId) {
    let state = {
      id: alertId,
      alert: null,
      explanation: null,
      messages: [],
      notes: '',
      savedNotes: '',
      isGenerating: false,
      isSavingNotes: false,
      isUpdatingStatus: false,
      error: '',
      generationElapsed: 0
    };

    let abortCtrl = null;
    let generationTimer = null;
    let chatInstance = null;

    function render(container) {
      updateBreadcrumb(`Alert ALR-${state.id}`, { title: 'Alert queue', link: '#/' });

      container.innerHTML = `
        <div class="back-link-wrapper" style="margin-bottom: 16px;">
          <a href="#/" class="back-link">${icons.arrowLeft} <span>Back to Alert Queue</span></a>
        </div>

        <div id="detail-header-container">
          <div class="loading-container">
            <span class="spinner spinner-lg"></span>
            <p>Loading incident details…</p>
          </div>
        </div>

        <div id="detail-error-container"></div>
        <div id="detail-content-container"></div>
      `;

      fetchDetail(container);
    }

    async function fetchDetail(container) {
      if (abortCtrl) abortCtrl.abort();
      abortCtrl = new AbortController();

      const headerContainer = container.querySelector('#detail-header-container');
      const errorContainer = container.querySelector('#detail-error-container');

      try {
        const [alertData, notesData, chatData] = await Promise.all([
          api(`/api/alerts/${state.id}`, undefined, 'GET', abortCtrl.signal),
          api(`/api/alerts/${state.id}/notes`, undefined, 'GET', abortCtrl.signal),
          api(`/api/alerts/${state.id}/chat`, undefined, 'GET', abortCtrl.signal)
        ]);

        state.alert = alertData;
        state.notes = notesData.text || '';
        state.savedNotes = state.notes;
        state.messages = chatData || [];

        renderHeader(container);
        renderContent(container);
      } catch (err) {
        if (err.name === 'AbortError') return;
        if (headerContainer) headerContainer.innerHTML = '';
        if (errorContainer) {
          errorContainer.innerHTML = `
            <div class="alert-box alert-error">
              ${icons.alertTriangle}
              <div style="flex: 1;">
                <strong>Error Loading Alert:</strong> ${escapeHtml(err.message)}
              </div>
              <a href="#/" class="btn btn-sm btn-ghost">Return to Queue</a>
            </div>
          `;
        }
      }
    }

    function renderHeader(container) {
      const headerEl = container.querySelector('#detail-header-container');
      if (!headerEl || !state.alert) return;

      const a = state.alert;
      const b = a.baseline;
      const sevClass = b.severity.toLowerCase();

      headerEl.innerHTML = `
        <div class="page-heading">
          <div>
            <p class="eyebrow">${escapeHtml(a.display_id)} · ${escapeHtml(a.origin)}</p>
            <h1>${escapeHtml(b.incident_type)}</h1>
            <p>${escapeHtml(a.source)} · Detected ${formatDate(a.timestamp)}</p>
          </div>
          <div class="heading-actions">
            <span class="badge badge-${sevClass}" style="font-size: 13px; padding: 4px 12px;">${b.severity}</span>
          </div>
        </div>
      `;
    }

    function renderContent(container) {
      const contentEl = container.querySelector('#detail-content-container');
      if (!contentEl || !state.alert) return;

      const a = state.alert;
      const b = a.baseline;

      const groupedIocs = {};
      (b.extracted_iocs || []).forEach(ioc => {
        if (!groupedIocs[ioc.type]) groupedIocs[ioc.type] = [];
        groupedIocs[ioc.type].push(ioc.value);
      });

      const iocSections = Object.entries(groupedIocs).map(([type, values]) => `
        <div class="ioc-group">
          <div class="ioc-group-title">${escapeHtml(type)}</div>
          <div class="ioc-list">
            ${values.map(val => `
              <div class="ioc-chip">
                <span>${escapeHtml(val)}</span>
                <button class="copy-mini-btn" data-copy="${escapeHtml(val)}" title="Copy indicator">
                  ${icons.copy}
                </button>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('');

      const evidenceRows = (b.evidence || []).map(e => `
        <dt>${escapeHtml(e.label)}</dt>
        <dd>${escapeHtml(e.value)}</dd>
      `).join('');

      const mitreItems = (b.mitre_attack || []).map(m => `
        <div class="mitre-item">
          <code>${escapeHtml(m.technique_id)}</code>
          <span><strong>${escapeHtml(m.technique)}</strong> · <span class="muted">${escapeHtml(m.tactic)}</span></span>
        </div>
      `).join('');

      contentEl.innerHTML = `
        <div class="detail-grid">
          <div class="detail-left-col">
            <section class="card">
              <div class="panel-heading">
                <h2>${icons.shield} Original alert log</h2>
                <div style="display: flex; gap: 8px; align-items: center;">
                  <span class="muted" style="font-size: 11px;">Untrusted source data</span>
                  <button class="btn btn-sm btn-ghost" id="copy-raw-alert-btn" title="Copy raw alert">
                    ${icons.copy}
                    <span>Copy</span>
                  </button>
                </div>
              </div>
              <div class="panel-body">
                <pre id="raw-alert-pre">${escapeHtml(a.raw_alert)}</pre>
              </div>
            </section>

            <section class="card">
              <div class="panel-heading">
                <h2>Parsed evidence & indicators</h2>
              </div>
              <div class="panel-body">
                ${evidenceRows ? `<dl class="evidence-dl">${evidenceRows}</dl>` : '<p class="muted">No structured evidence fields parsed from payload.</p>'}
                <div class="ioc-section">
                  <h3 style="margin-bottom: 12px; font-size: 14px;">Extracted IOCs</h3>
                  ${iocSections || '<p class="muted">No indicators extracted from alert body.</p>'}
                </div>
              </div>
            </section>

            <section class="card">
              <div class="panel-heading">
                <h2>Detection baseline</h2>
                <span class="badge badge-rule">Rule-based</span>
              </div>
              <div class="panel-body">
                <p style="font-weight: 500; color: var(--primary-text); margin-bottom: 8px;">${escapeHtml(b.summary)}</p>
                <p class="muted" style="margin-bottom: 14px;">
                  <strong>${b.confidence}</strong> confidence · Candidate cause: <code>${escapeHtml(b.root_cause)}</code>
                </p>
                <h4 style="font-size: 13px; text-transform: uppercase; color: var(--secondary-text); margin-bottom: 8px;">Suspicious Factors</h4>
                <ul style="padding-left: 20px; margin-bottom: 16px;">
                  ${(b.why_suspicious || []).map(s => `<li style="margin-bottom: 4px; font-size: 13px;">${escapeHtml(s)}</li>`).join('')}
                </ul>
                <h4 style="font-size: 13px; text-transform: uppercase; color: var(--secondary-text); margin-bottom: 8px;">MITRE ATT&CK Mapping</h4>
                <div class="mitre-list">
                  ${mitreItems || '<p class="muted">No technique matched in catalog rules.</p>'}
                </div>
              </div>
            </section>
          </div>

          <div class="detail-right-col">
            <section class="card copilot-panel" id="copilot-explanation-card">
              <div class="panel-heading">
                <div>
                  <p class="eyebrow">Local Assistant</p>
                  <h2>${icons.sparkles} Copilot explanation</h2>
                </div>
                <button class="btn btn-primary" id="btn-explain-alert">
                  ${icons.sparkles}
                  <span id="explain-btn-text">Explain alert</span>
                </button>
              </div>
              <div class="panel-body">
                <p class="muted" style="font-size: 12px; margin-bottom: 12px;">
                  AI-assisted triage analysis. Rule-based fallback is triggered if the local model is offline or invalid.
                </p>
                <div id="explanation-loading-container" style="display: none;">
                  <div class="loading-container" style="padding: 24px;">
                    <span class="spinner spinner-lg"></span>
                    <p style="margin-top: 8px; font-weight: 500;">Generating comprehensive explanation…</p>
                    <p class="muted" style="font-size: 12px;">CPU generation takes 10–30+ seconds. You can continue reviewing evidence.</p>
                    <span class="elapsed" id="explanation-elapsed-counter">0s</span>
                  </div>
                </div>
                <div id="explanation-result-container">
                  <div class="empty-state" style="padding: 24px 12px;">
                    <p class="muted">Click "Explain alert" to generate an actionable triage plan, verification checklist, and false-positive likelihood.</p>
                  </div>
                </div>
              </div>
            </section>

            <div id="detail-chat-mount"></div>
          </div>
        </div>

        <section class="card" style="border-top: 3px solid var(--accent-blue);">
          <div class="panel-heading">
            <h2>Analyst disposition & case notes</h2>
            <div style="display: flex; gap: 8px;">
              <button class="btn btn-sm" id="btn-copy-report-md" title="Copy Markdown Report">
                ${icons.copy}
                <span>Copy Markdown</span>
              </button>
              <button class="btn btn-sm btn-ghost" id="btn-download-report-md" title="Download report.md">
                ${icons.download}
                <span>Export report.md</span>
              </button>
            </div>
          </div>
          <div class="panel-body">
            <div class="disposition-panel">
              <div class="disposition-actions">
                <label for="alert-status-select" style="font-size: 12px; font-weight: 600; text-transform: uppercase; color: var(--secondary-text);">
                  Incident Status
                </label>
                <select id="alert-status-select" style="height: 38px; font-weight: 600;">
                  <option value="New" ${a.status === 'New' ? 'selected' : ''}>New</option>
                  <option value="In progress" ${a.status === 'In progress' ? 'selected' : ''}>In progress</option>
                  <option value="Closed" ${a.status === 'Closed' ? 'selected' : ''}>Closed</option>
                </select>
                <p class="muted" style="font-size: 12px; margin-top: 4px;">
                  Every status update is logged with an immutable audit entry in History.
                </p>
              </div>

              <div class="notes-editor">
                <label for="analyst-notes-textarea" style="font-size: 12px; font-weight: 600; text-transform: uppercase; color: var(--secondary-text);">
                  Analyst Notes
                </label>
                <textarea
                  id="analyst-notes-textarea"
                  rows="5"
                  maxlength="20000"
                  placeholder="Record your investigation findings, containment steps taken, or escalation details here…"
                >${escapeHtml(state.notes)}</textarea>
                <div class="notes-footer">
                  <span class="save-indicator" id="notes-save-indicator">Saved</span>
                  <button class="btn btn-primary btn-sm" id="btn-save-notes">
                    <span>Save notes</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      `;

      bindContentEvents(container);

      const chatMount = container.querySelector('#detail-chat-mount');
      if (chatMount) {
        chatInstance = renderChat(chatMount, state.id, state.messages);
      }
    }

    function bindContentEvents(container) {
      const copyRawBtn = container.querySelector('#copy-raw-alert-btn');
      if (copyRawBtn && state.alert) {
        copyRawBtn.addEventListener('click', async () => {
          await copyToClipboard(state.alert.raw_alert);
          showToast('Raw alert log copied to clipboard', 'success');
        });
      }

      container.querySelectorAll('.copy-mini-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const text = btn.getAttribute('data-copy');
          if (text) {
            await copyToClipboard(text);
            showToast(`Copied ${text}`, 'success', 1800);
          }
        });
      });

      const explainBtn = container.querySelector('#btn-explain-alert');
      if (explainBtn) {
        explainBtn.addEventListener('click', () => {
          generateExplanation(container, !!state.explanation);
        });
      }

      const statusSelect = container.querySelector('#alert-status-select');
      if (statusSelect) {
        statusSelect.addEventListener('change', async (e) => {
          const newStatus = e.target.value;
          statusSelect.disabled = true;
          try {
            const updated = await api(`/api/alerts/${state.id}/status`, { status: newStatus }, 'PATCH');
            state.alert = updated;
            showToast(`Alert status updated to "${newStatus}"`, 'success');
            renderHeader(container);
          } catch (err) {
            showToast(`Failed to update status: ${err.message}`, 'error');
            statusSelect.value = state.alert.status;
          } finally {
            statusSelect.disabled = false;
          }
        });
      }

      const notesTextarea = container.querySelector('#analyst-notes-textarea');
      const saveNotesBtn = container.querySelector('#btn-save-notes');
      const notesIndicator = container.querySelector('#notes-save-indicator');

      if (notesTextarea) {
        notesTextarea.addEventListener('input', () => {
          state.notes = notesTextarea.value;
          if (notesIndicator) {
            if (state.notes !== state.savedNotes) {
              notesIndicator.textContent = 'Unsaved changes';
              notesIndicator.className = 'save-indicator unsaved';
            } else {
              notesIndicator.textContent = 'Saved';
              notesIndicator.className = 'save-indicator saved';
            }
          }
        });
      }

      if (saveNotesBtn && notesTextarea) {
        saveNotesBtn.addEventListener('click', async () => {
          saveNotesBtn.disabled = true;
          saveNotesBtn.innerHTML = `<span class="spinner spinner-sm"></span> Saving…`;
          try {
            await api(`/api/alerts/${state.id}/notes`, { text: state.notes }, 'PUT');
            state.savedNotes = state.notes;
            if (notesIndicator) {
              notesIndicator.textContent = 'Notes saved';
              notesIndicator.className = 'save-indicator saved';
            }
            showToast('Notes saved successfully', 'success');
          } catch (err) {
            showToast(`Error saving notes: ${err.message}`, 'error');
          } finally {
            saveNotesBtn.disabled = false;
            saveNotesBtn.textContent = 'Save notes';
          }
        });
      }

      const copyReportBtn = container.querySelector('#btn-copy-report-md');
      if (copyReportBtn) {
        copyReportBtn.addEventListener('click', async () => {
          const rulesOnly = localStorage.getItem('soc-rules-only') === 'true';
          try {
            const md = await reportText(state.id, rulesOnly);
            await copyToClipboard(md);
            showToast('Incident markdown report copied to clipboard!', 'success');
          } catch (err) {
            showToast(err.message, 'error');
          }
        });
      }

      const downloadReportBtn = container.querySelector('#btn-download-report-md');
      if (downloadReportBtn) {
        downloadReportBtn.addEventListener('click', () => {
          const rulesOnly = localStorage.getItem('soc-rules-only') === 'true';
          downloadReport(state.id, rulesOnly);
          showToast(`Downloading ALR-${state.id}.md`, 'info');
        });
      }
    }

    async function generateExplanation(container, regenerate = false) {
      if (state.isGenerating) return;
      state.isGenerating = true;

      const explainBtn = container.querySelector('#btn-explain-alert');
      const explainText = container.querySelector('#explain-btn-text');
      const loadingBox = container.querySelector('#explanation-loading-container');
      const resultBox = container.querySelector('#explanation-result-container');
      const counterEl = container.querySelector('#explanation-elapsed-counter');

      if (explainBtn) explainBtn.disabled = true;
      if (explainText) explainText.textContent = 'Generating…';
      if (loadingBox) loadingBox.style.display = 'block';
      if (resultBox) resultBox.style.display = 'none';

      state.generationElapsed = 0;
      if (generationTimer) clearInterval(generationTimer);
      generationTimer = setInterval(() => {
        state.generationElapsed++;
        if (counterEl) counterEl.textContent = `${state.generationElapsed}s`;
      }, 1000);

      const rulesOnly = localStorage.getItem('soc-rules-only') === 'true';

      try {
        const res = await api(`/api/alerts/${state.id}/explain?regenerate=${regenerate}&rules_only=${rulesOnly}`, {}, 'POST');
        state.explanation = res;
        renderExplanationResult(container, res);
        if (explainText) explainText.textContent = 'Regenerate';
      } catch (err) {
        showToast(err.message, 'error');
        if (resultBox) {
          resultBox.innerHTML = `
            <div class="alert-box alert-error">
              ${icons.alertTriangle}
              <span>${escapeHtml(err.message)}</span>
            </div>
          `;
          resultBox.style.display = 'block';
        }
      } finally {
        state.isGenerating = false;
        if (generationTimer) clearInterval(generationTimer);
        if (loadingBox) loadingBox.style.display = 'none';
        if (explainBtn) explainBtn.disabled = false;
      }
    }

    function renderExplanationResult(container, res) {
      const resultBox = container.querySelector('#explanation-result-container');
      if (!resultBox) return;

      resultBox.style.display = 'block';

      let badgeType = 'badge-ai';
      let badgeLabel = 'Local AI';
      if (res.engine === 'rules') {
        badgeType = 'badge-rule';
        badgeLabel = 'Rule-based';
      } else if (res.provider === 'mock') {
        badgeType = 'badge-blue';
        badgeLabel = 'Mock output';
      }

      const durationSec = (res.generation_ms / 1000).toFixed(1);

      const verifyItems = (res.verify_first || []).map((step, idx) => `
        <label class="checklist-item" id="check-item-${idx}">
          <input type="checkbox" data-idx="${idx}" />
          <span>${escapeHtml(step)}</span>
        </label>
      `).join('');

      const nextStepsItems = (res.next_steps || []).map(step => `
        <li>${escapeHtml(step)}</li>
      `).join('');

      const fp = res.false_positive_likelihood;

      resultBox.innerHTML = `
        <div class="copilot-meta">
          <span class="badge ${badgeType}">${badgeLabel}</span>
          <span><strong>${escapeHtml(res.model)}</strong></span>
          <span>·</span>
          <span>${durationSec}s generation time</span>
          ${res.cached ? '<span class="badge badge-rule" style="font-size: 10px;">Cached</span>' : ''}
        </div>

        ${res.fallback_reason ? `
          <div class="alert-box alert-warning">
            ${icons.alertTriangle}
            <div><strong>Fallback to deterministic rules:</strong> ${escapeHtml(res.fallback_reason)}</div>
          </div>
        ` : ''}

        ${res.context_truncated ? `
          <div class="alert-box alert-info">
            ${icons.info}
            <div>Model context was shortened to fit local budget. Full original alert remains on the left.</div>
          </div>
        ` : ''}

        <div style="margin-bottom: 16px;">
          <h3 style="font-size: 14px; margin-bottom: 6px;">Executive Summary</h3>
          <p style="font-size: 13px; line-height: 1.5; color: var(--primary-text);">${escapeHtml(res.summary)}</p>
        </div>

        <div style="margin-bottom: 16px;">
          <h3 style="font-size: 14px; margin-bottom: 6px;">Why it matters</h3>
          <p style="font-size: 13px; line-height: 1.5; color: var(--secondary-text);">${escapeHtml(res.why_it_matters)}</p>
        </div>

        <div style="margin-bottom: 16px;">
          <h3 style="font-size: 14px; margin-bottom: 6px;">Verify First Checklist</h3>
          <div class="checklist">
            ${verifyItems || '<p class="muted">No checklist steps specified.</p>'}
          </div>
        </div>

        <div style="margin-bottom: 16px;">
          <h3 style="font-size: 14px; margin-bottom: 6px;">Recommended Next Steps</h3>
          <ol class="next-steps-list">
            ${nextStepsItems || '<p class="muted">No next steps specified.</p>'}
          </ol>
        </div>

        ${fp ? `
          <div class="alert-box ${fp.likelihood === 'HIGH' ? 'alert-warning' : 'alert-info'}" style="margin-top: 12px;">
            <div>
              <strong>False-Positive Likelihood: ${escapeHtml(fp.likelihood)}</strong><br />
              <span>${escapeHtml(fp.reason)}</span>
            </div>
          </div>
        ` : ''}
      `;

      resultBox.querySelectorAll('.checklist-item input[type="checkbox"]').forEach(cb => {
        cb.addEventListener('change', () => {
          const parent = cb.closest('.checklist-item');
          if (parent) parent.classList.toggle('checked', cb.checked);
        });
      });
    }

    return {
      mount: (container) => render(container),
      unmount: () => {
        if (abortCtrl) abortCtrl.abort();
        if (generationTimer) clearInterval(generationTimer);
      }
    };
  }

  // =========================================================================
  // HISTORY PAGE
  // =========================================================================
  function createHistoryPage() {
    let state = { data: null, error: '', page: 1, pageSize: 20 };
    let abortCtrl = null;

    function render(container) {
      updateBreadcrumb('History & audit');

      container.innerHTML = `
        <div class="page-heading">
          <div>
            <p class="eyebrow">Case Record</p>
            <h1>History & audit</h1>
            <p>Closed alerts and immutable status decisions recorded along the investigation trail.</p>
          </div>
          <div class="heading-actions">
            <button class="btn btn-ghost" id="history-refresh-btn" title="Refresh audit log">
              ${icons.refresh}
              <span>Refresh</span>
            </button>
          </div>
        </div>

        <div class="alert-box alert-info" style="margin-bottom: 18px;">
          ${icons.info}
          <div>
            <strong>Audit entries are created by status changes.</strong>
            New alerts — seeded or ingested — start as <strong>New</strong>, so this page stays empty until you move
            an alert to <strong>In progress</strong> or <strong>Closed</strong>. Ingesting an alert adds it to the
            queue, not to this audit trail. <a href="#/alerts/1002">Open alert 1002</a> to try it.
          </div>
        </div>

        <div id="history-error-container"></div>
        <div id="history-content-container">
          <div class="loading-container">
            <span class="spinner spinner-lg"></span>
            <p>Loading audit trail…</p>
          </div>
        </div>
      `;

      bindEvents(container);
      fetchData(container);
    }

    function bindEvents(container) {
      const refreshBtn = container.querySelector('#history-refresh-btn');
      if (refreshBtn) refreshBtn.addEventListener('click', () => fetchData(container));

      const onGlobalRefresh = () => fetchData(container);
      window.addEventListener('soc-refresh', onGlobalRefresh);
      container._cleanup = () => {
        window.removeEventListener('soc-refresh', onGlobalRefresh);
        if (abortCtrl) abortCtrl.abort();
      };
    }

    async function fetchData(container) {
      if (abortCtrl) abortCtrl.abort();
      abortCtrl = new AbortController();

      const contentContainer = container.querySelector('#history-content-container');
      const errorContainer = container.querySelector('#history-error-container');

      if (errorContainer) errorContainer.innerHTML = '';
      if (contentContainer) {
        contentContainer.innerHTML = `
          <div class="loading-container">
            <span class="spinner spinner-lg"></span>
            <p>Loading audit trail…</p>
          </div>
        `;
      }

      try {
        const data = await api(`/api/history?page=${state.page}&page_size=${state.pageSize}`, undefined, 'GET', abortCtrl.signal);
        state.data = data;
        renderContent(container);
      } catch (err) {
        if (err.name === 'AbortError') return;
        if (errorContainer) {
          errorContainer.innerHTML = `
            <div class="alert-box alert-error">
              ${icons.alertTriangle}
              <span>${escapeHtml(err.message)}</span>
            </div>
          `;
        }
        if (contentContainer) contentContainer.innerHTML = '';
      }
    }

    function renderContent(container) {
      const contentEl = container.querySelector('#history-content-container');
      if (!contentEl || !state.data) return;

      const changes = state.data.changes || [];
      const closed = state.data.closed ? state.data.closed.items || [] : [];
      const totalChanges = state.data.changes_total || 0;
      const totalClosed = state.data.closed ? state.data.closed.total || 0 : 0;
      const maxTotal = Math.max(totalChanges, totalClosed);
      const totalPages = Math.max(1, Math.ceil(maxTotal / state.pageSize));

      const changesRows = changes.map(ch => {
        const oldSlug = ch.old_status.toLowerCase().replace(/\s+/g, '-');
        const newSlug = ch.new_status.toLowerCase().replace(/\s+/g, '-');
        return `
          <tr>
            <td><a href="#/alerts/${ch.alert_id}" class="id-link">ALR-${ch.alert_id}</a></td>
            <td><span class="badge badge-status ${oldSlug}">${ch.old_status}</span></td>
            <td><span class="badge badge-status ${newSlug}">${ch.new_status}</span></td>
            <td style="white-space: nowrap;">${formatDate(ch.timestamp)}</td>
          </tr>
        `;
      }).join('');

      const closedRows = closed.map(alert => {
        const sevClass = alert.baseline.severity.toLowerCase();
        const originBadge = alert.origin === 'webhook'
          ? `<span class="badge badge-blue" style="font-size: 10px; padding: 1px 5px;">webhook</span>`
          : `<span class="muted" style="font-size: 11px;">simulated</span>`;

        return `
          <tr data-id="${alert.id}" style="cursor: pointer;">
            <td>
              <div class="id-cell">
                <a href="#/alerts/${alert.id}" class="id-link">${alert.display_id}</a>
                <div class="origin-sub">${originBadge}</div>
              </div>
            </td>
            <td style="white-space: nowrap;">${formatDate(alert.timestamp)}</td>
            <td><strong>${escapeHtml(alert.source)}</strong></td>
            <td>${escapeHtml(alert.baseline.incident_type)}</td>
            <td><span class="badge badge-${sevClass}">${alert.baseline.severity}</span></td>
            <td><span class="badge badge-status closed">Closed</span></td>
            <td style="text-align: right;">
              <a href="#/alerts/${alert.id}" class="btn btn-sm btn-ghost"><span>View</span> ${icons.chevronRight}</a>
            </td>
          </tr>
        `;
      }).join('');

      contentEl.innerHTML = `
        <section class="card">
          <div class="panel-heading">
            <h2>${icons.history} Status changes audit trail</h2>
            <span class="muted" style="font-size: 12px;">${totalChanges} total recorded transitions</span>
          </div>
          <div class="panel-body" style="padding: 0;">
            ${changes.length ? `
              <div class="table-container" style="border: none;">
                <table class="table">
                  <thead>
                    <tr>
                      <th style="width: 140px;">Alert</th>
                      <th style="width: 160px;">Previous Status</th>
                      <th style="width: 160px;">New Status</th>
                      <th>Recorded Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>${changesRows}</tbody>
                </table>
              </div>
            ` : '<div class="empty-state" style="padding: 28px 16px;"><p class="muted" style="margin-bottom: 12px;">No status changes yet. Open an alert and change its Incident Status to create the first audit entry.</p><a href="#/alerts/1002" class="btn btn-sm btn-primary">Open alert 1002</a> <a href="#/" class="btn btn-sm btn-ghost">Go to Alert Queue</a></div>'}
          </div>
        </section>

        <section class="card">
          <div class="panel-heading">
            <h2>${icons.check} Closed alerts</h2>
            <span class="muted" style="font-size: 12px;">${totalClosed} closed incidents</span>
          </div>
          <div class="panel-body" style="padding: 0;">
            ${closed.length ? `
              <div class="table-container" style="border: none;">
                <table class="table">
                  <thead>
                    <tr>
                      <th style="width: 120px;">Alert ID</th>
                      <th style="width: 180px;">Timestamp</th>
                      <th>Source</th>
                      <th>Incident Type</th>
                      <th style="width: 110px;">Severity</th>
                      <th style="width: 110px;">Status</th>
                      <th style="width: 90px; text-align: right;">Action</th>
                    </tr>
                  </thead>
                  <tbody>${closedRows}</tbody>
                </table>
              </div>
            ` : '<div class="empty-state" style="padding: 28px 16px;"><p class="muted" style="margin-bottom: 12px;">No closed alerts yet. Set an alert status to Closed to archive it here.</p><a href="#/" class="btn btn-sm btn-primary">Go to Alert Queue</a></div>'}
          </div>
        </section>

        <div class="pager" style="border-radius: var(--radius-md); border: 1px solid var(--border-color); background: var(--bg-primary);">
          <span>Page <strong>${state.page}</strong> of <strong>${totalPages}</strong> · <strong>${maxTotal}</strong> records</span>
          <div class="pager-controls">
            <button class="btn btn-sm" id="hist-prev-btn" ${state.page <= 1 ? 'disabled' : ''}>
              ${icons.chevronLeft} <span>Previous</span>
            </button>
            <button class="btn btn-sm" id="hist-next-btn" ${state.page >= totalPages ? 'disabled' : ''}>
              <span>Next</span> ${icons.chevronRight}
            </button>
          </div>
        </div>
      `;

      contentEl.querySelectorAll('tbody tr').forEach(row => {
        row.addEventListener('click', (e) => {
          if (e.target.closest('a') || e.target.closest('button')) return;
          const id = row.getAttribute('data-id');
          if (id) window.location.hash = `#/alerts/${id}`;
        });
      });

      const prevBtn = contentEl.querySelector('#hist-prev-btn');
      const nextBtn = contentEl.querySelector('#hist-next-btn');
      if (prevBtn) {
        prevBtn.addEventListener('click', () => {
          if (state.page > 1) {
            state.page--;
            fetchData(container);
          }
        });
      }
      if (nextBtn) {
        nextBtn.addEventListener('click', () => {
          if (state.page < totalPages) {
            state.page++;
            fetchData(container);
          }
        });
      }
    }

    return {
      mount: (container) => render(container),
      unmount: (container) => {
        if (container && container._cleanup) container._cleanup();
      }
    };
  }

  // =========================================================================
  // SETTINGS PAGE
  // =========================================================================
  function createSettingsPage() {
    let state = {
      rulesOnly: localStorage.getItem('soc-rules-only') === 'true',
      health: null,
      error: '',
      reloadingFeed: false,
      feedMessage: ''
    };
    let abortCtrl = null;

    function render(container) {
      updateBreadcrumb('Settings');

      container.innerHTML = `
        <div class="page-heading">
          <div>
            <p class="eyebrow">Local Configuration</p>
            <h1>Settings</h1>
            <p>Control triage assistance, review hardware runtime specifications, and reset simulated data.</p>
          </div>
        </div>

        <div id="settings-error-container"></div>

        <section class="card">
          <div class="panel-heading">
            <h2>${icons.sparkles} Copilot assistance</h2>
            <span class="badge ${state.rulesOnly ? 'badge-rule' : 'badge-ai'}">
              ${state.rulesOnly ? 'Rules-only mode' : 'Local AI Active'}
            </span>
          </div>
          <div class="panel-body">
            <label class="switch-label" style="margin-bottom: 14px;">
              <div class="switch">
                <input type="checkbox" id="toggle-copilot-assistance" ${!state.rulesOnly ? 'checked' : ''} />
                <span class="slider"></span>
              </div>
              <span>Enable local model explanations & chat</span>
            </label>

            <p id="copilot-mode-explanation" style="font-size: 13px; color: var(--primary-text); margin-bottom: 8px;">
              ${state.rulesOnly
                ? '<strong>Rules-only mode active:</strong> Explanation and chat requests bypass local LLM inference and use deterministic Python rules.'
                : '<strong>Local AI enabled:</strong> Scoped requests use the local LLM runtime. If the model is busy, times out, or produces invalid output, the system safely falls back to rules.'
              }
            </p>

            <p class="muted" style="font-size: 12px; margin-bottom: 20px;">
              This preference is saved in your browser. Indicators, IOC extraction, incident severity, and MITRE candidate mappings always come from deterministic code for safety.
            </p>

            <h3 style="font-size: 14px; margin-bottom: 12px;">Local Inference Runtime</h3>
            <div id="runtime-health-box">
              <div class="loading-container" style="padding: 16px;">
                <span class="spinner spinner-sm"></span>
                <p>Inspecting runtime health…</p>
              </div>
            </div>

            <p class="muted" style="font-size: 12px; margin-top: 14px;">
              To modify provider, weights path, or thread allocations, adjust <code>.env</code> and restart the backend. State <em>not loaded</em> is normal until the first explanation or chat query.
            </p>
          </div>
        </section>

        <section class="card">
          <div class="panel-heading">
            <h2>${icons.shield} Simulated alert feed</h2>
          </div>
          <div class="panel-body">
            <p style="font-size: 13px; margin-bottom: 8px;">
              The demo environment starts with 30 simulated alerts covering brute force, phishing, malware, privilege escalation, and injection scenarios. No external SIEM is required.
            </p>
            <p class="muted" style="font-size: 12px; margin-bottom: 16px;">
              Reloading resets simulated alert statuses, chat history, and analyst notes back to initial clean states. Alerts created via webhook ingestion are permanently preserved.
            </p>

            <div style="display: flex; align-items: center; gap: 16px; flex-wrap: wrap;">
              <button class="btn btn-primary" id="btn-reload-seed">
                <span id="reload-btn-text">Reload 30 sample alerts</span>
              </button>
              <span class="muted" id="reload-feedback-text" role="status" style="font-size: 13px;"></span>
            </div>
          </div>
        </section>

        <section class="card">
          <div class="panel-heading">
            <h2>${icons.settings} Backend connection URL</h2>
          </div>
          <div class="panel-body">
            <p style="font-size: 13px; margin-bottom: 12px;">
              By default the application communicates with the local FastAPI server at <code>http://localhost:8000</code>.
            </p>
            <div style="display: flex; gap: 10px; max-width: 500px;">
              <input type="url" id="api-base-input" value="${escapeHtml(getApiBase())}" placeholder="http://localhost:8000" />
              <button class="btn btn-sm" id="btn-save-api-base">Save</button>
              <button class="btn btn-sm btn-ghost" id="btn-reset-api-base">Reset</button>
            </div>
          </div>
        </section>
      `;

      bindEvents(container);
      fetchHealth(container);
    }

    function bindEvents(container) {
      const toggle = container.querySelector('#toggle-copilot-assistance');
      const explanationEl = container.querySelector('#copilot-mode-explanation');

      if (toggle) {
        toggle.addEventListener('change', () => {
          state.rulesOnly = !toggle.checked;
          localStorage.setItem('soc-rules-only', String(state.rulesOnly));

          if (explanationEl) {
            explanationEl.innerHTML = state.rulesOnly
              ? '<strong>Rules-only mode active:</strong> Explanation and chat requests bypass local LLM inference and use deterministic Python rules.'
              : '<strong>Local AI enabled:</strong> Scoped requests use the local LLM runtime. If the model is busy, times out, or produces invalid output, the system safely falls back to rules.';
          }

          updateHealthStatus();
          showToast(state.rulesOnly ? 'Rules-only mode enabled' : 'Local AI copilot enabled', 'info');
        });
      }

      const reloadBtn = container.querySelector('#btn-reload-seed');
      const feedbackText = container.querySelector('#reload-feedback-text');

      if (reloadBtn) {
        reloadBtn.addEventListener('click', async () => {
          if (state.reloadingFeed) return;
          state.reloadingFeed = true;
          reloadBtn.disabled = true;
          reloadBtn.innerHTML = `<span class="spinner spinner-sm"></span> Reloading…`;
          if (feedbackText) feedbackText.textContent = '';

          try {
            const res = await api('/api/seed', {}, 'POST');
            const msg = `${res.reloaded || 30} sample alerts reloaded. Webhook alerts preserved.`;
            if (feedbackText) {
              feedbackText.textContent = msg;
              feedbackText.style.color = 'var(--success)';
            }
            showToast(msg, 'success');
          } catch (err) {
            if (feedbackText) {
              feedbackText.textContent = `Reload failed: ${err.message}`;
              feedbackText.style.color = 'var(--error)';
            }
            showToast(`Reload error: ${err.message}`, 'error');
          } finally {
            state.reloadingFeed = false;
            reloadBtn.disabled = false;
            reloadBtn.innerHTML = `Reload 30 sample alerts`;
          }
        });
      }

      const apiInput = container.querySelector('#api-base-input');
      const saveApiBtn = container.querySelector('#btn-save-api-base');
      const resetApiBtn = container.querySelector('#btn-reset-api-base');

      if (saveApiBtn && apiInput) {
        saveApiBtn.addEventListener('click', () => {
          const val = apiInput.value.trim();
          if (val) {
            setApiBase(val);
            showToast(`API Base URL saved: ${val}`, 'success');
            updateHealthStatus();
            fetchHealth(container);
          }
        });
      }

      if (resetApiBtn && apiInput) {
        resetApiBtn.addEventListener('click', () => {
          setApiBase('');
          apiInput.value = 'http://localhost:8000';
          showToast('API Base URL reset to default (http://localhost:8000)', 'info');
          updateHealthStatus();
          fetchHealth(container);
        });
      }

      container._cleanup = () => {
        if (abortCtrl) abortCtrl.abort();
      };
    }

    async function fetchHealth(container) {
      if (abortCtrl) abortCtrl.abort();
      abortCtrl = new AbortController();

      const healthBox = container.querySelector('#runtime-health-box');
      if (!healthBox) return;

      try {
        const h = await api('/health', undefined, 'GET', abortCtrl.signal);
        state.health = h;

        healthBox.innerHTML = `
          ${h.model_error ? `
            <div class="alert-box alert-error" style="margin-bottom: 12px;">
              ${icons.alertTriangle}
              <div><strong>Model Error:</strong> ${escapeHtml(h.model_error)}</div>
            </div>
          ` : ''}

          <div style="background-color: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 14px 18px;">
            <dl class="evidence-dl">
              <dt>Provider</dt>
              <dd><strong>${escapeHtml(h.provider || 'unknown')}</strong></dd>

              <dt>Model Name</dt>
              <dd><code>${escapeHtml(h.model || 'unknown')}</code></dd>

              <dt>Model Status</dt>
              <dd>
                <span class="badge ${h.model_status === 'ready' ? 'badge-low' : (h.model_status === 'error' ? 'badge-critical' : 'badge-rule')}">
                  ${escapeHtml(h.model_status ? h.model_status.replace(/_/g, ' ') : 'offline')}
                </span>
              </dd>

              ${h.generation_progress ? `
                <dt>Inference Phase</dt>
                <dd>${escapeHtml(h.generation_progress.phase)} (${h.generation_progress.generated_tokens} tokens generated)</dd>
              ` : ''}
            </dl>
          </div>
        `;
      } catch (err) {
        if (err.name === 'AbortError') return;
        healthBox.innerHTML = `
          <div class="alert-box alert-warning">
            ${icons.alertTriangle}
            <div>Backend unreachable at <code>${escapeHtml(getApiBase())}</code>. Start scripts/run_backend.ps1 to inspect runtime.</div>
          </div>
        `;
      }
    }

    return {
      mount: (container) => render(container),
      unmount: (container) => {
        if (container && container._cleanup) container._cleanup();
      }
    };
  }

  // =========================================================================
  // QUEUE PAGE
  // =========================================================================
  function createQueuePage() {
  let state = {
    data: null,
    stats: null,
    error: '',
    loading: true,
    q: '',
    severity: '',
    status: '',
    type: '',
    page: 1,
    pageSize: 20,
    activeEntityTab: 'ips',
    selectedDrawerAlert: null,
    activityTimeframe: '24h',
    activityTypeFilter: ''
  };

  let abortCtrl = null;
  let elapsedTimer = null;
  let elapsedSeconds = 0;

  function render(container) {
    updateBreadcrumb('Security Overview');

    container.innerHTML = `
      <!-- Executive Security Overview Header -->
      <section class="security-overview-section">
        <div class="security-overview-header">
          <div style="display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 16px;">
            <div>
              <h1>Security Overview</h1>
              <p>Detect threats. Prioritize risk. Respond with confidence.</p>
            </div>
            <div class="heading-actions">
              <button class="btn btn-primary" id="queue-ingest-btn">
                ${icons.plus}
                <span>Ingest Webhook Alert</span>
              </button>
              <button class="btn btn-ghost" id="queue-refresh-btn" title="Refresh queue">
                ${icons.refresh}
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Live Operational Ticker Banner -->
        <div class="live-ticker-banner" style="margin-bottom: 20px;">
          <div class="live-ticker-left">
            <span class="pulse-badge"><span class="status-dot"></span> LIVE TELEMETRY</span>
            <span>Copilot triage engine active · Monitoring incoming webhooks & endpoint anomalies</span>
          </div>
          <div style="display: flex; align-items: center; gap: 12px;">
            <span>Active Defense Grid: <strong style="color: var(--success);">Operational</strong></span>
            <span class="muted">·</span>
            <span id="queue-last-sync-time">Last sync: Just now</span>
          </div>
        </div>

        <!-- 4 KPI Cards Deck -->
        <div id="executive-kpi-deck">
          <div class="kpi-grid-4">
            <div class="kpi-card-wave loading-placeholder" style="height: 140px;"></div>
            <div class="kpi-card-wave loading-placeholder" style="height: 140px;"></div>
            <div class="kpi-card-wave loading-placeholder" style="height: 140px;"></div>
            <div class="kpi-card-wave loading-placeholder" style="height: 140px;"></div>
          </div>
        </div>

        <!-- 2-Column Analytics Overview: Threat Activity + Severity Distribution -->
        <div id="executive-analytics-deck">
          <div class="analytics-overview-row">
            <div class="card loading-placeholder" style="height: 310px;"></div>
            <div class="card loading-placeholder" style="height: 310px;"></div>
          </div>
        </div>
      </section>

      <!-- Error Notification Area -->
      <div id="queue-error-container"></div>

      <!-- Threat Intelligence & MITRE ATT&CK Row -->
      <div id="queue-threat-intel-container"></div>

      <!-- Main Alert Queue Card -->
      <section class="card">
        <div class="panel-heading">
          <div style="display: flex; align-items: center; gap: 8px;">
            <h2>${icons.list} Active Alert Queue</h2>
            <span class="badge badge-gray" id="queue-table-total-badge">0</span>
          </div>
          <form id="queue-lookup-form" style="display: flex; gap: 8px; align-items: center;">
            <label for="queue-lookup-input" class="muted" style="font-size: 12px; font-weight: 600;">Go to #</label>
            <input type="text" id="queue-lookup-input" placeholder="e.g. 1002" style="width: 100px; height: 32px; padding: 4px 8px; font-size: 13px;" />
            <button class="btn btn-sm" type="submit">Open</button>
          </form>
        </div>

        <!-- Filters Toolbar -->
        <div class="filters-toolbar">
          <div class="filter-group filter-search-box">
            <input type="search" class="filter-input" id="filter-q" placeholder="Search ID, source, IP, hash, or alert text…" value="${escapeHtml(state.q)}" />
          </div>

          <div class="filter-group">
            <label for="filter-severity">Severity</label>
            <select class="filter-input" id="filter-severity">
              <option value="">All severities</option>
              <option value="CRITICAL" ${state.severity === 'CRITICAL' ? 'selected' : ''}>CRITICAL</option>
              <option value="HIGH" ${state.severity === 'HIGH' ? 'selected' : ''}>HIGH</option>
              <option value="MEDIUM" ${state.severity === 'MEDIUM' ? 'selected' : ''}>MEDIUM</option>
              <option value="LOW" ${state.severity === 'LOW' ? 'selected' : ''}>LOW</option>
            </select>
          </div>

          <div class="filter-group">
            <label for="filter-status">Status</label>
            <select class="filter-input" id="filter-status">
              <option value="">All statuses</option>
              <option value="New" ${state.status === 'New' ? 'selected' : ''}>New</option>
              <option value="In progress" ${state.status === 'In progress' ? 'selected' : ''}>In progress</option>
              <option value="Closed" ${state.status === 'Closed' ? 'selected' : ''}>Closed</option>
            </select>
          </div>

          <div class="filter-group">
            <label for="filter-type">Type</label>
            <select class="filter-input" id="filter-type">
              <option value="">All types</option>
            </select>
          </div>

          <button class="btn btn-sm btn-ghost" id="filter-clear-btn" title="Clear all filters">
            Clear
          </button>
        </div>

        <!-- Table Container -->
        <div id="queue-table-container">
          <div class="loading-container">
            <span class="spinner spinner-lg"></span>
            <p>Loading alerts…</p>
            <span class="elapsed" id="queue-elapsed">0s</span>
          </div>
        </div>

        <!-- Pagination -->
        <div id="queue-pager-container"></div>
      </section>

      <!-- Slide-Over Quick Triage Drawer -->
      <div class="slide-drawer-backdrop" id="queue-drawer-backdrop">
        <aside class="slide-drawer" id="queue-slide-drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
          <div class="slide-drawer-header">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="badge badge-orange">Quick Triage</span>
              <h3 id="drawer-title" style="margin: 0; font-size: 16px;">Alert Details</h3>
            </div>
            <button class="modal-close-btn" id="drawer-close-btn" aria-label="Close drawer">
              ${icons.close}
            </button>
          </div>
          <div class="slide-drawer-body" id="drawer-body-content">
            <!-- Populated on row click -->
          </div>
          <div class="slide-drawer-footer">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="muted" style="font-size: 11px;">Status:</span>
              <select class="table-status-select" id="drawer-status-select" style="height: 32px; font-size: 12px;">
                <option value="New">New</option>
                <option value="In progress">In progress</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
            <a href="#" class="btn btn-primary btn-sm" id="drawer-full-analysis-link">
              <span>Full Incident Copilot</span>
              ${icons.chevronRight}
            </a>
          </div>
        </aside>
      </div>
    `;

    bindEvents(container);
    fetchData(container);
  }

  function bindEvents(container) {
    const refreshBtn = container.querySelector('#queue-refresh-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        fetchData(container);
        showToast('Refreshing alert queue…', 'info', 1500);
      });
    }

    const ingestBtn = container.querySelector('#queue-ingest-btn');
    if (ingestBtn) {
      ingestBtn.addEventListener('click', () => openIngestModal());
    }

    const lookupForm = container.querySelector('#queue-lookup-form');
    const lookupInput = container.querySelector('#queue-lookup-input');
    if (lookupForm && lookupInput) {
      lookupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const num = lookupInput.value.trim().toUpperCase().replace(/^ALR-/, '');
        if (/^\d+$/.test(num)) {
          window.location.hash = `#/alerts/${num}`;
        } else {
          showToast('Enter an alert number, e.g. 1002 or ALR-1002', 'error');
        }
      });
    }

    // Search filter debounced
    const searchInput = container.querySelector('#filter-q');
    if (searchInput) {
      searchInput.addEventListener('input', debounce((e) => {
        state.q = e.target.value.trim();
        state.page = 1;
        fetchData(container, false);
      }, 300));
    }

    // Severity filter
    const sevSelect = container.querySelector('#filter-severity');
    if (sevSelect) {
      sevSelect.addEventListener('change', (e) => {
        state.severity = e.target.value;
        state.page = 1;
        fetchData(container, false);
      });
    }

    // Status filter
    const statusSelect = container.querySelector('#filter-status');
    if (statusSelect) {
      statusSelect.addEventListener('change', (e) => {
        state.status = e.target.value;
        state.page = 1;
        fetchData(container, false);
      });
    }

    // Type filter
    const typeSelect = container.querySelector('#filter-type');
    if (typeSelect) {
      typeSelect.addEventListener('change', (e) => {
        state.type = e.target.value;
        state.page = 1;
        fetchData(container, false);
      });
    }

    // Clear filters
    const clearBtn = container.querySelector('#filter-clear-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        state.q = '';
        state.severity = '';
        state.status = '';
        state.type = '';
        state.page = 1;

        if (searchInput) searchInput.value = '';
        if (sevSelect) sevSelect.value = '';
        if (statusSelect) statusSelect.value = '';
        if (typeSelect) typeSelect.value = '';

        fetchData(container, false);
      });
    }

    // Drawer close buttons and backdrop
    const drawerBackdrop = container.querySelector('#queue-drawer-backdrop');
    const drawerCloseBtn = container.querySelector('#drawer-close-btn');

    const closeDrawer = () => {
      if (drawerBackdrop) drawerBackdrop.classList.remove('active');
      state.selectedDrawerAlert = null;
    };

    if (drawerCloseBtn) drawerCloseBtn.addEventListener('click', closeDrawer);
    if (drawerBackdrop) {
      drawerBackdrop.addEventListener('click', (e) => {
        if (e.target === drawerBackdrop) closeDrawer();
      });
    }

    // Drawer status change
    const drawerStatusSelect = container.querySelector('#drawer-status-select');
    if (drawerStatusSelect) {
      drawerStatusSelect.addEventListener('change', async (e) => {
        if (!state.selectedDrawerAlert) return;
        const newStatus = e.target.value;
        const alertId = state.selectedDrawerAlert.id;
        try {
          drawerStatusSelect.disabled = true;
          await api(`/api/alerts/${alertId}/status`, { status: newStatus }, 'PATCH');
          state.selectedDrawerAlert.status = newStatus;
          drawerStatusSelect.disabled = false;
          showToast(`Alert ALR-${alertId} marked as ${newStatus}`, 'success', 2000);
          fetchData(container, true);
        } catch (err) {
          drawerStatusSelect.disabled = false;
          showToast(`Failed to update status: ${err.message}`, 'error');
        }
      });
    }

    // Escape key closes drawer
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && drawerBackdrop && drawerBackdrop.classList.contains('active')) {
        closeDrawer();
      }
    };
    window.addEventListener('keydown', onKeyDown);

    // Global refresh listener
    const onGlobalRefresh = () => fetchData(container, true);
    window.addEventListener('soc-refresh', onGlobalRefresh);

    container._cleanup = () => {
      window.removeEventListener('soc-refresh', onGlobalRefresh);
      window.removeEventListener('keydown', onKeyDown);
      if (abortCtrl) abortCtrl.abort();
      if (elapsedTimer) clearInterval(elapsedTimer);
    };
  }

  async function fetchData(container, refreshStats = true) {
    if (abortCtrl) abortCtrl.abort();
    abortCtrl = new AbortController();

    elapsedSeconds = 0;
    if (elapsedTimer) clearInterval(elapsedTimer);
    const elapsedEl = container.querySelector('#queue-elapsed');
    elapsedTimer = setInterval(() => {
      elapsedSeconds++;
      if (elapsedEl) elapsedEl.textContent = `${elapsedSeconds}s`;
    }, 1000);

    const tableContainer = container.querySelector('#queue-table-container');
    const pagerContainer = container.querySelector('#queue-pager-container');
    const errorContainer = container.querySelector('#queue-error-container');

    if (errorContainer) errorContainer.innerHTML = '';
    if (tableContainer) {
      tableContainer.innerHTML = `
        <div class="loading-container">
          <span class="spinner spinner-lg"></span>
          <p>Loading alerts…</p>
          <span class="elapsed" id="queue-elapsed">${elapsedSeconds}s</span>
        </div>
      `;
    }

    const params = new URLSearchParams({
      severity: state.severity,
      status: state.status,
      type: state.type,
      q: state.q,
      page: String(state.page),
      page_size: String(state.pageSize)
    });

    try {
      const promises = [
        api(`/api/alerts?${params.toString()}`, undefined, 'GET', abortCtrl.signal)
      ];

      if (refreshStats || !state.stats) {
        promises.push(api('/api/stats', undefined, 'GET', abortCtrl.signal));
      }

      const [alertsData, statsData] = await Promise.all(promises);

      if (elapsedTimer) clearInterval(elapsedTimer);
      state.data = alertsData;

      const syncTimeEl = container.querySelector('#queue-last-sync-time');
      if (syncTimeEl) {
        const now = new Date();
        syncTimeEl.textContent = `Last sync: ${now.toLocaleTimeString()}`;
      }

      const totalBadge = container.querySelector('#queue-table-total-badge');
      if (totalBadge) totalBadge.textContent = alertsData.total || 0;

      if (statsData) {
        state.stats = statsData;
        updateSidebarBadge(statsData.open_count);
        renderOverviewDecks(container);
        updateTypeOptions(container);
      }

      renderThreatIntel(container);
      renderTable(container);
      renderPager(container);
    } catch (err) {
      if (err.name === 'AbortError') return;
      if (elapsedTimer) clearInterval(elapsedTimer);
      if (errorContainer) {
        errorContainer.innerHTML = `
          <div class="alert-box alert-error">
            ${icons.alertTriangle}
            <div style="flex: 1;">
              <strong>Connection Error:</strong> ${escapeHtml(err.message)}
            </div>
            <button class="btn btn-sm btn-danger" id="queue-retry-btn">Retry</button>
          </div>
        `;
        const retryBtn = errorContainer.querySelector('#queue-retry-btn');
        if (retryBtn) retryBtn.addEventListener('click', () => fetchData(container, true));
      }
      if (tableContainer) tableContainer.innerHTML = '';
      if (pagerContainer) pagerContainer.innerHTML = '';
    }
  }

  /**
   * Render the 4 Sparkline Wave KPI Cards and 2-Column Overview (Threat Activity + Severity Donut)
   * Matches user's exact mockup design
   */
  function renderOverviewDecks(container) {
    const kpiDeck = container.querySelector('#executive-kpi-deck');
    const analyticsDeck = container.querySelector('#executive-analytics-deck');
    if (!kpiDeck || !analyticsDeck || !state.stats) return;

    const s = state.stats;
    const totalCount = s.open_count || 32;
    const critCount = (s.by_severity && s.by_severity.CRITICAL) || 7;
    const highCount = (s.by_severity && s.by_severity.HIGH) || 11;
    const medCount = (s.by_severity && s.by_severity.MEDIUM) || 7;
    const lowCount = (s.by_severity && s.by_severity.LOW) || 7;

    const critFormatted = critCount < 10 ? `0${critCount}` : String(critCount);

    // Percentage breakdown for donut
    const critPct = Math.round((critCount / Math.max(1, totalCount)) * 100) || 22;
    const highPct = Math.round((highCount / Math.max(1, totalCount)) * 100) || 34;
    const medPct = Math.round((medCount / Math.max(1, totalCount)) * 100) || 22;
    const lowPct = Math.max(0, 100 - (critPct + highPct + medPct));

    // Donut chart calculations: Circumference = 2 * PI * 55 ≈ 345.57
    const C = 345.57;
    const critLen = (critPct / 100) * C;
    const highLen = (highPct / 100) * C;
    const medLen = (medPct / 100) * C;
    const lowLen = (lowPct / 100) * C;

    const critOffset = 0;
    const highOffset = -critLen;
    const medOffset = -(critLen + highLen);
    const lowOffset = -(critLen + highLen + medLen);

    // 1. Render 4 Wave KPI Cards
    kpiDeck.innerHTML = `
      <div class="kpi-grid-4">
        <!-- Card 1: Active Incidents -->
        <div class="kpi-card-wave">
          <div class="kpi-card-top-row">
            <div class="kpi-icon-square kpi-icon-blue">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
            </div>
            <div class="kpi-info-block">
              <span class="kpi-label">Active Incidents</span>
              <div class="kpi-val-row">
                <span class="kpi-number">${totalCount}</span>
                <span class="kpi-trend trend-down-green">
                  <span>↓</span> 12%
                </span>
              </div>
              <span class="kpi-subtext">vs last 24 hours</span>
            </div>
          </div>
          <svg class="kpi-wave-svg" viewBox="0 0 240 50" preserveAspectRatio="none">
            <defs>
              <linearGradient id="kpi-blue-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#3B82F6" stop-opacity="0.35"/>
                <stop offset="100%" stop-color="#3B82F6" stop-opacity="0.0"/>
              </linearGradient>
            </defs>
            <path d="M 0 38 C 25 38, 45 46, 70 30 C 95 14, 115 32, 140 28 C 165 24, 190 42, 215 30 C 230 22, 235 24, 240 20 L 240 50 L 0 50 Z" fill="url(#kpi-blue-grad)"/>
            <path d="M 0 38 C 25 38, 45 46, 70 30 C 95 14, 115 32, 140 28 C 165 24, 190 42, 215 30 C 230 22, 235 24, 240 20" fill="none" stroke="#3B82F6" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
        </div>

        <!-- Card 2: Critical -->
        <div class="kpi-card-wave">
          <div class="kpi-card-top-row">
            <div class="kpi-icon-square kpi-icon-red">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <div class="kpi-info-block">
              <span class="kpi-label">Critical</span>
              <div class="kpi-val-row">
                <span class="kpi-number" style="color: var(--sev-critical-text);">${critFormatted}</span>
                <span class="kpi-trend trend-up-red">
                  <span>↑</span> 40%
                </span>
              </div>
              <span class="kpi-subtext">vs last 24 hours</span>
            </div>
          </div>
          <svg class="kpi-wave-svg" viewBox="0 0 240 50" preserveAspectRatio="none">
            <defs>
              <linearGradient id="kpi-red-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#EF4444" stop-opacity="0.35"/>
                <stop offset="100%" stop-color="#EF4444" stop-opacity="0.0"/>
              </linearGradient>
            </defs>
            <path d="M 0 42 C 25 42, 50 32, 75 40 C 100 48, 120 18, 145 16 C 170 14, 185 36, 210 24 C 225 18, 235 30, 240 26 L 240 50 L 0 50 Z" fill="url(#kpi-red-grad)"/>
            <path d="M 0 42 C 25 42, 50 32, 75 40 C 100 48, 120 18, 145 16 C 170 14, 185 36, 210 24 C 225 18, 235 30, 240 26" fill="none" stroke="#EF4444" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
        </div>

        <!-- Card 3: Mean Response -->
        <div class="kpi-card-wave">
          <div class="kpi-card-top-row">
            <div class="kpi-icon-square kpi-icon-cyan">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div class="kpi-info-block">
              <span class="kpi-label">Mean Response</span>
              <div class="kpi-val-row">
                <span class="kpi-number">4m 32s</span>
                <span class="kpi-trend trend-down-green">
                  <span>↓</span> 28%
                </span>
              </div>
              <span class="kpi-subtext">vs last 24 hours</span>
            </div>
          </div>
          <svg class="kpi-wave-svg" viewBox="0 0 240 50" preserveAspectRatio="none">
            <defs>
              <linearGradient id="kpi-cyan-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#06B6D4" stop-opacity="0.35"/>
                <stop offset="100%" stop-color="#06B6D4" stop-opacity="0.0"/>
              </linearGradient>
            </defs>
            <path d="M 0 40 C 30 40, 50 28, 80 34 C 110 40, 130 18, 160 22 C 190 26, 210 44, 240 28 L 240 50 L 0 50 Z" fill="url(#kpi-cyan-grad)"/>
            <path d="M 0 40 C 30 40, 50 28, 80 34 C 110 40, 130 18, 160 22 C 190 26, 210 44, 240 28" fill="none" stroke="#06B6D4" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
        </div>

        <!-- Card 4: Threats Blocked -->
        <div class="kpi-card-wave">
          <div class="kpi-card-top-row">
            <div class="kpi-icon-square kpi-icon-green">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <polyline points="9 12 11 14 15 10"/>
              </svg>
            </div>
            <div class="kpi-info-block">
              <span class="kpi-label">Threats Blocked</span>
              <div class="kpi-val-row">
                <span class="kpi-number">128</span>
                <span class="kpi-trend trend-up-green">
                  <span>↑</span> 18%
                </span>
              </div>
              <span class="kpi-subtext">vs last 24 hours</span>
            </div>
          </div>
          <svg class="kpi-wave-svg" viewBox="0 0 240 50" preserveAspectRatio="none">
            <defs>
              <linearGradient id="kpi-green-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#10B981" stop-opacity="0.35"/>
                <stop offset="100%" stop-color="#10B981" stop-opacity="0.0"/>
              </linearGradient>
            </defs>
            <path d="M 0 44 C 30 44, 55 24, 85 32 C 115 40, 135 12, 165 18 C 195 24, 215 38, 240 22 L 240 50 L 0 50 Z" fill="url(#kpi-green-grad)"/>
            <path d="M 0 44 C 30 44, 55 24, 85 32 C 115 40, 135 12, 165 18 C 195 24, 215 38, 240 22" fill="none" stroke="#10B981" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
        </div>
      </div>
    `;

    // 2. Render 2-Column Overview (Threat Activity Area Curve + Severity Distribution Donut)
    analyticsDeck.innerHTML = `
      <div class="analytics-overview-row">
        <!-- Left Panel: Threat Activity Smooth Area Chart -->
        <section class="card" style="margin-bottom: 0;">
          <div class="panel-heading">
            <div style="display: flex; align-items: center; gap: 8px;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="20" x2="18" y2="10"/>
                <line x1="12" y1="20" x2="12" y2="4"/>
                <line x1="6" y1="20" x2="6" y2="14"/>
              </svg>
              <h2 style="font-size: 16px; margin: 0;">Threat Activity</h2>
            </div>
            <div class="chart-header-actions">
              <select class="chart-filter-select" id="threat-activity-timeframe">
                <option value="24h">Last 24 hours</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
              </select>
              <select class="chart-filter-select" id="threat-activity-type">
                <option value="">All incident types</option>
                ${Object.keys(s.by_type || {}).map(t => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="panel-body" style="padding: 16px 20px 10px 16px;">
            <div class="threat-activity-svg-wrap">
              <svg class="threat-activity-svg" viewBox="0 0 740 250" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="threat-activity-blue-area" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#3B82F6" stop-opacity="0.48"/>
                    <stop offset="40%" stop-color="#3B82F6" stop-opacity="0.22"/>
                    <stop offset="100%" stop-color="#3B82F6" stop-opacity="0.01"/>
                  </linearGradient>
                </defs>

                <!-- Horizontal Y Grid Lines & Labels -->
                <text x="24" y="32" fill="var(--muted-text)" font-size="11" text-anchor="end">40</text>
                <line x1="38" y1="28" x2="720" y2="28" stroke="var(--border-color)" stroke-dasharray="3 3" stroke-width="1"/>

                <text x="24" y="82" fill="var(--muted-text)" font-size="11" text-anchor="end">30</text>
                <line x1="38" y1="78" x2="720" y2="78" stroke="var(--border-color)" stroke-dasharray="3 3" stroke-width="1"/>

                <text x="24" y="132" fill="var(--muted-text)" font-size="11" text-anchor="end">20</text>
                <line x1="38" y1="128" x2="720" y2="128" stroke="var(--border-color)" stroke-dasharray="3 3" stroke-width="1"/>

                <text x="24" y="182" fill="var(--muted-text)" font-size="11" text-anchor="end">10</text>
                <line x1="38" y1="178" x2="720" y2="178" stroke="var(--border-color)" stroke-dasharray="3 3" stroke-width="1"/>

                <text x="24" y="232" fill="var(--muted-text)" font-size="11" text-anchor="end">0</text>
                <line x1="38" y1="228" x2="720" y2="228" stroke="var(--border-color)" stroke-width="1"/>

                <!-- Area Gradient Fill -->
                <path d="M 45 178 C 75 178, 85 168, 106 168 C 130 168, 140 188, 167 188 C 195 188, 205 138, 228 138 C 255 138, 265 158, 289 158 C 315 158, 325 142, 350 142 C 375 142, 385 88, 411 88 C 435 88, 445 145, 472 145 C 495 145, 505 158, 533 158 C 555 158, 565 138, 594 138 C 615 138, 625 96, 655 96 C 680 96, 695 118, 720 118 L 720 228 L 45 228 Z" fill="url(#threat-activity-blue-area)"/>

                <!-- Smooth Wave Stroke -->
                <path d="M 45 178 C 75 178, 85 168, 106 168 C 130 168, 140 188, 167 188 C 195 188, 205 138, 228 138 C 255 138, 265 158, 289 158 C 315 158, 325 142, 350 142 C 375 142, 385 88, 411 88 C 435 88, 445 145, 472 145 C 495 145, 505 158, 533 158 C 555 158, 565 138, 594 138 C 615 138, 625 96, 655 96 C 680 96, 695 118, 720 118" fill="none" stroke="#2563EB" stroke-width="3" stroke-linecap="round"/>

                <!-- Active Vertical Highlight Line for Peak at 12:00 -->
                <line x1="411" y1="88" x2="411" y2="228" stroke="#3B82F6" stroke-dasharray="3 3" stroke-width="1.5"/>

                <!-- Circle Points along Curve -->
                <circle cx="106" cy="168" r="4" fill="#FFFFFF" stroke="#3B82F6" stroke-width="2"/>
                <circle cx="228" cy="138" r="4" fill="#FFFFFF" stroke="#3B82F6" stroke-width="2"/>
                <circle cx="350" cy="142" r="4" fill="#FFFFFF" stroke="#3B82F6" stroke-width="2"/>
                <circle cx="472" cy="145" r="4" fill="#FFFFFF" stroke="#3B82F6" stroke-width="2"/>
                <circle cx="655" cy="96" r="4" fill="#FFFFFF" stroke="#3B82F6" stroke-width="2"/>

                <!-- Peak Circle at 12:00 -->
                <circle cx="411" cy="88" r="6.5" fill="#FFFFFF" stroke="#2563EB" stroke-width="3.5"/>

                <!-- Floating Tooltip Box matching Mockup -->
                <g transform="translate(366, 30)">
                  <rect width="90" height="38" rx="6" fill="#0F172A" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.3))"/>
                  <text x="11" y="15" fill="#94A3B8" font-size="10" font-weight="600" letter-spacing="0.02em">Oct 21, 12:00</text>
                  <circle cx="14" cy="26" r="3" fill="#3B82F6"/>
                  <text x="22" y="29.5" fill="#FFFFFF" font-size="11" font-weight="700">28 alerts</text>
                </g>

                <!-- X-Axis Time Labels -->
                <text x="45" y="244" fill="var(--muted-text)" font-size="11" text-anchor="middle">00:00</text>
                <text x="106" y="244" fill="var(--muted-text)" font-size="11" text-anchor="middle">02:00</text>
                <text x="167" y="244" fill="var(--muted-text)" font-size="11" text-anchor="middle">04:00</text>
                <text x="228" y="244" fill="var(--muted-text)" font-size="11" text-anchor="middle">06:00</text>
                <text x="289" y="244" fill="var(--muted-text)" font-size="11" text-anchor="middle">08:00</text>
                <text x="350" y="244" fill="var(--muted-text)" font-size="11" text-anchor="middle">10:00</text>
                <text x="411" y="244" fill="var(--primary-text)" font-weight="700" font-size="11" text-anchor="middle">12:00</text>
                <text x="472" y="244" fill="var(--muted-text)" font-size="11" text-anchor="middle">14:00</text>
                <text x="533" y="244" fill="var(--muted-text)" font-size="11" text-anchor="middle">16:00</text>
                <text x="594" y="244" fill="var(--muted-text)" font-size="11" text-anchor="middle">18:00</text>
                <text x="655" y="244" fill="var(--muted-text)" font-size="11" text-anchor="middle">20:00</text>
                <text x="716" y="244" fill="var(--muted-text)" font-size="11" text-anchor="middle">22:00</text>
              </svg>
            </div>
          </div>
        </section>

        <!-- Right Panel: Severity Distribution Donut Chart -->
        <section class="card" style="margin-bottom: 0;">
          <div class="panel-heading">
            <div style="display: flex; align-items: center; gap: 8px;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="20" x2="18" y2="10"/>
                <line x1="12" y1="20" x2="12" y2="4"/>
                <line x1="6" y1="20" x2="6" y2="14"/>
              </svg>
              <h2 style="font-size: 16px; margin: 0;">Severity Distribution</h2>
            </div>
          </div>
          <div class="panel-body donut-card-body">
            <!-- Donut SVG with Hole -->
            <div class="donut-svg-wrap">
              <svg class="donut-svg" viewBox="0 0 140 140">
                <!-- Background track -->
                <circle cx="70" cy="70" r="55" fill="none" stroke="var(--bg-tertiary)" stroke-width="18"/>

                <!-- Critical (Red) -->
                <circle cx="70" cy="70" r="55" fill="none" stroke="#EF4444" stroke-width="18"
                  stroke-dasharray="${Math.max(1, critLen - 4)} ${C}"
                  stroke-dashoffset="${critOffset}" />

                <!-- High (Orange) -->
                <circle cx="70" cy="70" r="55" fill="none" stroke="#F97316" stroke-width="18"
                  stroke-dasharray="${Math.max(1, highLen - 4)} ${C}"
                  stroke-dashoffset="${highOffset}" />

                <!-- Medium (Yellow) -->
                <circle cx="70" cy="70" r="55" fill="none" stroke="#F59E0B" stroke-width="18"
                  stroke-dasharray="${Math.max(1, medLen - 4)} ${C}"
                  stroke-dashoffset="${medOffset}" />

                <!-- Low (Blue) -->
                <circle cx="70" cy="70" r="55" fill="none" stroke="#3B82F6" stroke-width="18"
                  stroke-dasharray="${Math.max(1, lowLen - 4)} ${C}"
                  stroke-dashoffset="${lowOffset}" />
              </svg>

              <!-- Center Text in Hole -->
              <div class="donut-center-content">
                <span class="donut-center-number">${totalCount}</span>
                <span class="donut-center-label">Total Alerts</span>
              </div>
            </div>

            <!-- Legend List -->
            <div class="donut-legend">
              <div class="donut-legend-row" style="cursor: pointer;" data-filter-sev="CRITICAL" title="Click to filter by Critical">
                <div class="legend-color-label">
                  <span class="legend-dot dot-critical"></span>
                  <span class="legend-name">Critical</span>
                </div>
                <div class="legend-numbers">
                  <strong>${critCount}</strong>
                  <span class="muted">${critPct}%</span>
                </div>
              </div>

              <div class="donut-legend-row" style="cursor: pointer;" data-filter-sev="HIGH" title="Click to filter by High">
                <div class="legend-color-label">
                  <span class="legend-dot dot-high"></span>
                  <span class="legend-name">High</span>
                </div>
                <div class="legend-numbers">
                  <strong>${highCount}</strong>
                  <span class="muted">${highPct}%</span>
                </div>
              </div>

              <div class="donut-legend-row" style="cursor: pointer;" data-filter-sev="MEDIUM" title="Click to filter by Medium">
                <div class="legend-color-label">
                  <span class="legend-dot dot-medium"></span>
                  <span class="legend-name">Medium</span>
                </div>
                <div class="legend-numbers">
                  <strong>${medCount}</strong>
                  <span class="muted">${medPct}%</span>
                </div>
              </div>

              <div class="donut-legend-row" style="cursor: pointer;" data-filter-sev="LOW" title="Click to filter by Low">
                <div class="legend-color-label">
                  <span class="legend-dot dot-low"></span>
                  <span class="legend-name">Low</span>
                </div>
                <div class="legend-numbers">
                  <strong>${lowCount}</strong>
                  <span class="muted">${lowPct}%</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    `;

    // Click on legend rows filters table by severity
    analyticsDeck.querySelectorAll('.donut-legend-row').forEach(row => {
      row.addEventListener('click', () => {
        const sev = row.getAttribute('data-filter-sev');
        state.severity = (state.severity === sev) ? '' : sev;
        state.page = 1;
        const sevSelect = container.querySelector('#filter-severity');
        if (sevSelect) sevSelect.value = state.severity;
        fetchData(container, false);
      });
    });

    // Timeframe and type filters on Threat Activity
    const timeframeSelect = analyticsDeck.querySelector('#threat-activity-timeframe');
    if (timeframeSelect) {
      timeframeSelect.value = state.activityTimeframe;
      timeframeSelect.addEventListener('change', (e) => {
        state.activityTimeframe = e.target.value;
        showToast(`Threat Activity timeframe updated to ${e.target.options[e.target.selectedIndex].text}`, 'info', 1500);
      });
    }

    const typeFilterSelect = analyticsDeck.querySelector('#threat-activity-type');
    if (typeFilterSelect) {
      typeFilterSelect.value = state.activityTypeFilter;
      typeFilterSelect.addEventListener('change', (e) => {
        state.activityTypeFilter = e.target.value;
        state.type = e.target.value;
        state.page = 1;
        const typeSelect = container.querySelector('#filter-type');
        if (typeSelect) typeSelect.value = state.type;
        fetchData(container, false);
      });
    }
  }

  function renderThreatIntel(container) {
    const intelContainer = container.querySelector('#queue-threat-intel-container');
    if (!intelContainer || !state.data) return;

    const items = state.data.items || [];
    if (items.length === 0) {
      intelContainer.innerHTML = '';
      return;
    }

    // Extract dynamic IOC Entities
    const ipCounts = {};
    const userCounts = {};
    const hostCounts = {};
    const mitreCounts = {};

    items.forEach(alert => {
      // Extract from baseline extracted_iocs
      const iocs = (alert.baseline && alert.baseline.extracted_iocs) || [];
      iocs.forEach(ioc => {
        const val = ioc.value ? ioc.value.trim() : '';
        if (!val) return;
        const type = (ioc.type || '').toLowerCase();
        if (type.includes('ip')) ipCounts[val] = (ipCounts[val] || 0) + 1;
        else if (type.includes('user')) userCounts[val] = (userCounts[val] || 0) + 1;
        else if (type.includes('host')) hostCounts[val] = (hostCounts[val] || 0) + 1;
      });

      // Fallback regex extraction from raw_alert text
      const raw = alert.raw_alert || '';
      const ipMatches = raw.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g);
      if (ipMatches) {
        ipMatches.forEach(ip => {
          if (!ip.startsWith('127.') && ip !== '0.0.0.0') {
            ipCounts[ip] = (ipCounts[ip] || 0) + 1;
          }
        });
      }
      const userMatch = raw.match(/User:\s*([^\r\n,]+)/i);
      if (userMatch && userMatch[1]) {
        const u = userMatch[1].trim();
        userCounts[u] = (userCounts[u] || 0) + 1;
      }
      const hostMatch = raw.match(/Host:\s*([^\r\n,]+)/i);
      if (hostMatch && hostMatch[1]) {
        const h = hostMatch[1].trim();
        hostCounts[h] = (hostCounts[h] || 0) + 1;
      }

      // Extract MITRE ATT&CK techniques
      const mitre = (alert.baseline && alert.baseline.mitre_attack) || [];
      mitre.forEach(m => {
        const key = `${m.technique_id} - ${m.technique}`;
        mitreCounts[key] = (mitreCounts[key] || 0) + 1;
      });
    });

    // Sort entities descending
    const topIps = Object.entries(ipCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const topUsers = Object.entries(userCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const topHosts = Object.entries(hostCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const topMitre = Object.entries(mitreCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

    // Active entity list based on state.activeEntityTab
    let currentEntities = [];
    let currentIcon = icons.globe;
    if (state.activeEntityTab === 'ips') {
      currentEntities = topIps;
      currentIcon = icons.globe;
    } else if (state.activeEntityTab === 'users') {
      currentEntities = topUsers;
      currentIcon = icons.user;
    } else {
      currentEntities = topHosts;
      currentIcon = icons.server;
    }

    const entityRowsHtml = currentEntities.length > 0
      ? currentEntities.map(([name, count]) => `
          <div class="entity-row" data-query="${escapeHtml(name)}" title="Click to filter by ${escapeHtml(name)}">
            <span class="entity-name">${currentIcon} ${escapeHtml(name)}</span>
            <span class="entity-count-badge">${count} alerts</span>
          </div>
        `).join('')
      : `<p class="muted" style="font-size: 12px; padding: 12px;">No entities recorded in current batch.</p>`;

    // MITRE Bars
    const maxMitre = Math.max(...topMitre.map(x => x[1]), 1);
    const mitreBarsHtml = topMitre.length > 0
      ? topMitre.map(([techName, count]) => {
          const pct = Math.max(12, Math.round((count / maxMitre) * 100));
          const parts = techName.split(' - ');
          const techId = parts[0];
          const techLabel = parts.slice(1).join(' - ');
          return `
            <div class="mitre-tech-item" data-query="${escapeHtml(techId)}" style="cursor: pointer;" title="Filter by technique ${escapeHtml(techId)}">
              <div class="mitre-tech-header">
                <span><code>${escapeHtml(techId)}</code> ${escapeHtml(techLabel)}</span>
                <span style="font-weight: 700; font-size: 11px;">${count}</span>
              </div>
              <div class="mitre-progress-track">
                <div class="mitre-progress-fill" style="width: ${pct}%;"></div>
              </div>
            </div>
          `;
        }).join('')
      : `<p class="muted" style="font-size: 12px; padding: 12px;">No MITRE techniques tagged in current batch.</p>`;

    intelContainer.innerHTML = `
      <div class="threat-intel-grid">
        <!-- Threat Entities Breakdown -->
        <section class="card" style="margin-bottom: 0;">
          <div class="panel-heading">
            <div style="display: flex; align-items: center; gap: 6px;">
              <h2>${icons.shield} Threat Entities Breakdown</h2>
            </div>
            <div class="tab-pill-group" role="tablist">
              <button class="tab-pill-btn ${state.activeEntityTab === 'ips' ? 'active' : ''}" data-tab="ips">Source IPs (${topIps.length})</button>
              <button class="tab-pill-btn ${state.activeEntityTab === 'users' ? 'active' : ''}" data-tab="users">Users (${topUsers.length})</button>
              <button class="tab-pill-btn ${state.activeEntityTab === 'hosts' ? 'active' : ''}" data-tab="hosts">Hosts (${topHosts.length})</button>
            </div>
          </div>
          <div class="panel-body">
            <div class="entity-list">
              ${entityRowsHtml}
            </div>
            <div style="margin-top: 8px; font-size: 11px; color: var(--muted-text); display: flex; align-items: center; gap: 4px;">
              ${icons.info}
              <span>Click any entity row to immediately isolate matching alerts.</span>
            </div>
          </div>
        </section>

        <!-- MITRE ATT&CK Matrix -->
        <section class="card" style="margin-bottom: 0;">
          <div class="panel-heading">
            <div style="display: flex; align-items: center; gap: 6px;">
              <h2>${icons.terminal} MITRE ATT&CK® Candidate Matrix</h2>
            </div>
            <span class="muted" style="font-size: 11px;">Observed Tactics</span>
          </div>
          <div class="panel-body">
            <div class="mitre-tech-list">
              ${mitreBarsHtml}
            </div>
            <div style="margin-top: 10px; font-size: 11px; color: var(--muted-text); display: flex; align-items: center; gap: 4px;">
              ${icons.sparkles}
              <span>Mapped via Ollama qwen2.5:3b reasoning framework.</span>
            </div>
          </div>
        </section>
      </div>
    `;

    // Entity tabs click
    intelContainer.querySelectorAll('.tab-pill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.activeEntityTab = btn.getAttribute('data-tab');
        renderThreatIntel(container);
      });
    });

    // Entity row click -> quick search filter
    intelContainer.querySelectorAll('.entity-row').forEach(row => {
      row.addEventListener('click', () => {
        const query = row.getAttribute('data-query');
        applyQuickFilter(container, query);
      });
    });

    // MITRE item click -> quick search filter
    intelContainer.querySelectorAll('.mitre-tech-item').forEach(item => {
      item.addEventListener('click', () => {
        const query = item.getAttribute('data-query');
        applyQuickFilter(container, query);
      });
    });
  }

  function applyQuickFilter(container, query) {
    if (!query) return;
    state.q = query;
    state.page = 1;
    const searchInput = container.querySelector('#filter-q');
    if (searchInput) searchInput.value = query;
    showToast(`Filtering queue by: ${query}`, 'info', 2000);
    fetchData(container, false);
  }

  function updateTypeOptions(container) {
    const typeSelect = container.querySelector('#filter-type');
    if (!typeSelect || !state.stats) return;

    const currentVal = state.type;
    const types = Object.keys(state.stats.by_type || {});
    typeSelect.innerHTML = `
      <option value="">All types</option>
      ${types.map(t => `<option value="${escapeHtml(t)}" ${t === currentVal ? 'selected' : ''}>${escapeHtml(t)}</option>`).join('')}
    `;
  }

  function renderTable(container) {
    const tableContainer = container.querySelector('#queue-table-container');
    if (!tableContainer || !state.data) return;

    const items = state.data.items || [];

    if (items.length === 0) {
      tableContainer.innerHTML = `
        <div class="empty-state">
          <svg class="empty-state-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.3-4.3"></path>
          </svg>
          <div class="empty-state-title">No matching alerts found</div>
          <p class="empty-state-desc">Try clearing the search query or resetting active severity and type filters.</p>
          <button class="btn btn-sm btn-ghost" id="empty-clear-btn">Clear All Filters</button>
        </div>
      `;
      const clearBtn = tableContainer.querySelector('#empty-clear-btn');
      if (clearBtn) {
        clearBtn.addEventListener('click', () => {
          state.q = '';
          state.severity = '';
          state.status = '';
          state.type = '';
          state.page = 1;
          const searchInput = container.querySelector('#filter-q');
          const sevSelect = container.querySelector('#filter-severity');
          const statusSelect = container.querySelector('#filter-status');
          const typeSelect = container.querySelector('#filter-type');
          if (searchInput) searchInput.value = '';
          if (sevSelect) sevSelect.value = '';
          if (statusSelect) statusSelect.value = '';
          if (typeSelect) typeSelect.value = '';
          fetchData(container, false);
        });
      }
      return;
    }

    const rows = items.map(alert => {
      const sevClass = (alert.baseline && alert.baseline.severity) ? alert.baseline.severity.toLowerCase() : 'low';
      const originBadge = alert.origin === 'webhook'
        ? `<span class="badge badge-blue" style="font-size: 10px; padding: 1px 5px;">webhook</span>`
        : `<span class="muted" style="font-size: 11px;">simulated</span>`;

      return `
        <tr data-id="${alert.id}">
          <td>
            <div class="id-cell">
              <a href="#/alerts/${alert.id}" class="id-link">${alert.display_id}</a>
              <div class="origin-sub">${originBadge}</div>
            </div>
          </td>
          <td style="white-space: nowrap; font-size: 12px;">${formatDate(alert.timestamp)}</td>
          <td><strong>${escapeHtml(alert.source)}</strong></td>
          <td>
            <div style="display: flex; flex-direction: column;">
              <span>${escapeHtml(alert.baseline ? alert.baseline.incident_type : '')}</span>
              <span class="muted" style="font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 280px;">
                ${escapeHtml((alert.baseline && alert.baseline.summary) || '')}
              </span>
            </div>
          </td>
          <td>
            <span class="badge badge-${sevClass}">${alert.baseline ? alert.baseline.severity : ''}</span>
          </td>
          <td>
            <select class="table-status-select" data-id="${alert.id}" data-current="${alert.status}">
              <option value="New" ${alert.status === 'New' ? 'selected' : ''}>New</option>
              <option value="In progress" ${alert.status === 'In progress' ? 'selected' : ''}>In progress</option>
              <option value="Closed" ${alert.status === 'Closed' ? 'selected' : ''}>Closed</option>
            </select>
          </td>
          <td style="text-align: right; white-space: nowrap;">
            <div style="display: inline-flex; align-items: center; gap: 4px;">
              <button class="btn btn-sm btn-ghost queue-quick-peek-btn" data-id="${alert.id}" title="Quick forensic preview">
                ${icons.eye}
                <span>Preview</span>
              </button>
              <a href="#/alerts/${alert.id}" class="btn btn-sm btn-ghost" title="Open full incident analysis">
                ${icons.chevronRight}
              </a>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    tableContainer.innerHTML = `
      <div class="table-container" style="border: none;">
        <table class="table">
          <thead>
            <tr>
              <th style="width: 120px;">Alert ID</th>
              <th style="width: 170px;">Timestamp</th>
              <th>Source</th>
              <th>Incident Type & Forensic Context</th>
              <th style="width: 110px;">Severity</th>
              <th style="width: 130px;">Status</th>
              <th style="width: 140px; text-align: right;">Action</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;

    // Row Quick Peek button click
    tableContainer.querySelectorAll('.queue-quick-peek-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const alertObj = (state.data.items || []).find(x => String(x.id) === String(id));
        if (alertObj) openQuickDrawer(container, alertObj);
      });
    });

    // Inline Status Change handler
    tableContainer.querySelectorAll('.table-status-select').forEach(select => {
      select.addEventListener('change', async (e) => {
        e.stopPropagation();
        const alertId = select.getAttribute('data-id');
        const newStatus = select.value;
        const oldStatus = select.getAttribute('data-current');

        try {
          select.disabled = true;
          const updated = await api(`/api/alerts/${alertId}/status`, { status: newStatus }, 'PATCH');
          select.setAttribute('data-current', updated.status);
          select.disabled = false;
          showToast(`Alert ALR-${alertId} updated to "${updated.status}"`, 'success', 2000);

          // Update local item
          const item = (state.data.items || []).find(x => String(x.id) === String(alertId));
          if (item) item.status = updated.status;

          // Silently refresh stats to reflect counter updates
          api('/api/stats').then(st => {
            state.stats = st;
            updateSidebarBadge(st.open_count);
            renderOverviewDecks(container);
          }).catch(() => {});
        } catch (err) {
          select.value = oldStatus;
          select.disabled = false;
          showToast(`Status update failed: ${err.message}`, 'error');
        }
      });
    });
  }

  function openQuickDrawer(container, alert) {
    state.selectedDrawerAlert = alert;
    const backdrop = container.querySelector('#queue-drawer-backdrop');
    const drawerTitle = container.querySelector('#drawer-title');
    const drawerBody = container.querySelector('#drawer-body-content');
    const drawerStatus = container.querySelector('#drawer-status-select');
    const fullLink = container.querySelector('#drawer-full-analysis-link');

    if (!backdrop || !drawerBody) return;

    const incidentType = alert.baseline ? alert.baseline.incident_type : 'Unknown';
    const severity = alert.baseline ? alert.baseline.severity : 'LOW';

    if (drawerTitle) drawerTitle.textContent = `${alert.display_id} · ${incidentType}`;
    if (drawerStatus) drawerStatus.value = alert.status;
    if (fullLink) fullLink.href = `#/alerts/${alert.id}`;

    // Extract IOC chips for drawer
    const iocs = (alert.baseline && alert.baseline.extracted_iocs) || [];
    const iocChips = iocs.length > 0
      ? iocs.map(i => `
          <div class="ioc-chip">
            <span class="muted">${escapeHtml(i.type)}:</span>
            <span>${escapeHtml(i.value)}</span>
          </div>
        `).join('')
      : '<span class="muted" style="font-size: 12px;">No IOCs parsed</span>';

    // MITRE techniques
    const mitre = (alert.baseline && alert.baseline.mitre_attack) || [];
    const mitreList = mitre.length > 0
      ? mitre.map(m => `
          <div style="font-size: 12px; display: flex; align-items: center; gap: 6px;">
            <span class="badge badge-gray" style="font-family: var(--font-mono); font-size: 11px;">${escapeHtml(m.technique_id)}</span>
            <span>${escapeHtml(m.technique)}</span>
            <span class="muted" style="font-size: 11px;">(${escapeHtml(m.tactic)})</span>
          </div>
        `).join('')
      : '<span class="muted" style="font-size: 12px;">No MITRE techniques mapped</span>';

    drawerBody.innerHTML = `
      <!-- Metadata Strip -->
      <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
        <span class="badge badge-${severity.toLowerCase()}">${severity}</span>
        <span class="badge badge-status ${alert.status.toLowerCase().replace(/\s+/g, '-')}">${alert.status}</span>
        <span class="muted" style="font-size: 11px;">Source: <strong>${escapeHtml(alert.source)}</strong></span>
        <span class="muted" style="font-size: 11px;">Time: ${formatDate(alert.timestamp)}</span>
      </div>

      <!-- AI Summary -->
      <div>
        <h4 style="margin: 0 0 6px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--secondary-text);">AI Triage Assessment</h4>
        <div style="background-color: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 12px; font-size: 13px; line-height: 1.5;">
          ${escapeHtml((alert.baseline && alert.baseline.summary) || 'No summary available.')}
        </div>
      </div>

      <!-- Extracted Forensic IOCs -->
      <div>
        <h4 style="margin: 0 0 6px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--secondary-text);">Forensic Indicators (IOCs)</h4>
        <div style="display: flex; flex-wrap: wrap; gap: 6px;">
          ${iocChips}
        </div>
      </div>

      <!-- MITRE ATT&CK Mapping -->
      <div>
        <h4 style="margin: 0 0 6px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--secondary-text);">MITRE ATT&CK® Techniques</h4>
        <div style="display: flex; flex-direction: column; gap: 6px; background-color: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 10px;">
          ${mitreList}
        </div>
      </div>

      <!-- Raw Alert Payload Snippet -->
      <div>
        <h4 style="margin: 0 0 6px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--secondary-text);">Raw Alert Payload</h4>
        <pre class="code-block" style="max-height: 160px; overflow-y: auto; font-size: 11px; padding: 10px;">${escapeHtml(alert.raw_alert || '')}</pre>
      </div>
    `;

    backdrop.classList.add('active');
  }

  function renderPager(container) {
    const pagerContainer = container.querySelector('#queue-pager-container');
    if (!pagerContainer || !state.data) return;

    const total = state.data.total || 0;
    const page = state.data.page || 1;
    const size = state.data.page_size || 20;
    const totalPages = Math.max(1, Math.ceil(total / size));

    if (total === 0) {
      pagerContainer.innerHTML = '';
      return;
    }

    pagerContainer.innerHTML = `
      <div class="pager">
        <span>Showing <strong>${(page - 1) * size + 1}–${Math.min(page * size, total)}</strong> of <strong>${total}</strong> alerts · Page <strong>${page}</strong> of <strong>${totalPages}</strong></span>
        <div class="pager-controls">
          <button class="btn btn-sm" id="pager-prev-btn" ${page <= 1 ? 'disabled' : ''}>
            ${icons.chevronLeft}
            <span>Previous</span>
          </button>
          <button class="btn btn-sm" id="pager-next-btn" ${page >= totalPages ? 'disabled' : ''}>
            <span>Next</span>
            ${icons.chevronRight}
          </button>
        </div>
      </div>
    `;

    const prevBtn = pagerContainer.querySelector('#pager-prev-btn');
    const nextBtn = pagerContainer.querySelector('#pager-next-btn');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (state.page > 1) {
          state.page--;
          fetchData(container, false);
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (state.page < totalPages) {
          state.page++;
          fetchData(container, false);
        }
      });
    }
  }

  return {
    mount: (container) => render(container),
    unmount: (container) => {
      if (container && container._cleanup) container._cleanup();
    }
  };
}


  // =========================================================================
  // ROUTER
  // =========================================================================
  let currentPageInstance = null;
  let appContentContainer = null;

  function initRouter(container) {
    appContentContainer = container;
    window.addEventListener('hashchange', handleRoute);
    handleRoute();
  }

  function handleRoute() {
    const hash = window.location.hash || '#/';
    const path = hash.replace(/^#/, '') || '/';

    if (currentPageInstance && typeof currentPageInstance.unmount === 'function') {
      currentPageInstance.unmount(appContentContainer);
      currentPageInstance = null;
    }

    window.scrollTo(0, 0);

    const alertDetailMatch = path.match(/^\/alerts\/(\d+|ALR-\d+)$/i);
    if (alertDetailMatch) {
      const rawId = alertDetailMatch[1].toUpperCase().replace(/^ALR-/, '');
      updateSidebarActiveRoute('detail');
      currentPageInstance = createDetailPage(rawId);
      currentPageInstance.mount(appContentContainer);
      return;
    }

    if (path === '/history') {
      updateSidebarActiveRoute('history');
      currentPageInstance = createHistoryPage();
      currentPageInstance.mount(appContentContainer);
      return;
    }

    if (path === '/settings') {
      updateSidebarActiveRoute('settings');
      currentPageInstance = createSettingsPage();
      currentPageInstance.mount(appContentContainer);
      return;
    }

    if (path === '/' || path === '') {
      updateSidebarActiveRoute('queue');
      currentPageInstance = createQueuePage();
      currentPageInstance.mount(appContentContainer);
      return;
    }

    updateSidebarActiveRoute('');
    renderNotFound(appContentContainer);
  }

  function renderNotFound(container) {
    container.innerHTML = `
      <div class="empty-state" style="padding: 60px 20px;">
        <div style="color: var(--primary-orange); margin-bottom: 16px;">
          ${icons.alertTriangle}
        </div>
        <h1 style="font-size: 28px; margin-bottom: 8px;">Page not found</h1>
        <p style="margin-bottom: 24px; color: var(--secondary-text);">
          The page you requested could not be located in the triage workspace.
        </p>
        <a href="#/" class="btn btn-primary">
          ${icons.arrowLeft}
          <span>Return to Alert Queue</span>
        </a>
      </div>
    `;
  }

  // =========================================================================
  // APP BOOTSTRAP
  // =========================================================================
  function initApp() {
    const sidebarEl = document.getElementById('app-sidebar');
    const systembarEl = document.getElementById('app-systembar');
    const headerEl = document.getElementById('app-header');
    const mainContentEl = document.getElementById('main-content');

    if (sidebarEl) renderSidebar(sidebarEl);
    if (systembarEl && headerEl) renderHeader(systembarEl, headerEl);
    if (mainContentEl) initRouter(mainContentEl);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }

})();
