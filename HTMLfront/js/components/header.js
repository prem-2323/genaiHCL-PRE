/**
 * Header and System Status Bar Component
 */
import { api } from '../api.js';
import { icons } from '../utils.js';
import { toggleMobileDrawer } from './sidebar.js';
import { openModal } from './modal.js';
import { samplePresets } from '../utils.js';
import { showToast } from './toast.js';

let healthPollTimer = null;

export function renderHeader(systembarEl, headerEl) {
  // 1. Render Top System Status Ribbon
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

  // 2. Render Main Application Header
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

      <button class="btn btn-ghost btn-icon-only" id="global-refresh-btn" title="Refresh current view" aria-label="Refresh view">
        ${icons.refresh}
      </button>
    </div>
  `;

  // Bind Hamburger Toggle
  const mobileBtn = headerEl.querySelector('#mobile-drawer-toggle');
  if (mobileBtn) {
    mobileBtn.addEventListener('click', () => {
      toggleMobileDrawer();
    });
  }

  // Bind Quick Alert Lookup
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

  // Bind Ingest Alert Modal
  const ingestBtn = headerEl.querySelector('#header-ingest-btn');
  if (ingestBtn) {
    ingestBtn.addEventListener('click', () => {
      openIngestModal();
    });
  }

  // Bind Global Refresh
  const refreshBtn = headerEl.querySelector('#global-refresh-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('soc-refresh'));
    });
  }

  // Start polling backend health
  startHealthPolling();
}

/**
 * Poll /health endpoint for real-time status
 */
export async function updateHealthStatus() {
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
  } catch (err) {
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

/**
 * Update current breadcrumb text
 */
export function updateBreadcrumb(currentTitle, parent = null) {
  const breadcrumbsEl = document.getElementById('app-breadcrumbs');
  if (!breadcrumbsEl) return;

  if (parent) {
    breadcrumbsEl.innerHTML = `
      <a href="${parent.link}" class="breadcrumb-item">${parent.title}</a>
      <span class="breadcrumb-separator">/</span>
      <span class="breadcrumb-current">${currentTitle}</span>
    `;
  } else {
    breadcrumbsEl.innerHTML = `
      <span class="breadcrumb-item">SOC</span>
      <span class="breadcrumb-separator">/</span>
      <span class="breadcrumb-current">${currentTitle}</span>
    `;
  }
}

/**
 * Open Modal to Ingest Webhook Alert (POST /api/alerts)
 */
export function openIngestModal() {
  const presetOptions = samplePresets.map((p, idx) => `
    <option value="${idx}">${p.label} (${p.source})</option>
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
