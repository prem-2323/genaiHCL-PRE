/**
 * Settings Page Component
 * Copilot assistance preferences, local runtime inspection, and demo feed management
 */
import { api, getApiBase, setApiBase } from '../api.js';
import { escapeHtml, icons } from '../utils.js';
import { updateBreadcrumb, updateHealthStatus } from '../components/header.js';
import { showToast } from '../components/toast.js';

export function createSettingsPage() {
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

      <!-- 1. Copilot Assistance Settings -->
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

      <!-- 2. Simulated Alert Feed Management -->
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

      <!-- 3. Backend API Connection Configuration -->
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
    // Assistance Toggle
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
        showToast(
          state.rulesOnly ? 'Rules-only mode enabled' : 'Local AI copilot enabled',
          'info'
        );
      });
    }

    // Reload 30 Samples
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

    // API Base URL config
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
