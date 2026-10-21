/**
 * Alert Detail Page Component
 * Shows complete alert baseline evidence, AI/rules copilot explanation,
 * interactive checklist, scoped chat, analyst disposition, notes, and report export.
 */
import { api, reportText, downloadReport } from '../api.js';
import { escapeHtml, formatDate, copyToClipboard, icons } from '../utils.js';
import { updateBreadcrumb } from '../components/header.js';
import { showToast } from '../components/toast.js';
import { renderChat } from './chat.js';

export function createDetailPage(alertId) {
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
    const contentContainer = container.querySelector('#detail-content-container');
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

    // Group extracted IOCs by type
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

    const rulesOnly = localStorage.getItem('soc-rules-only') === 'true';

    contentEl.innerHTML = `
      <div class="detail-grid">
        <!-- LEFT COLUMN: Baseline & Evidence -->
        <div class="detail-left-col">
          <!-- 1. Original Raw Alert -->
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

          <!-- 2. Parsed Evidence & IOCs -->
          <section class="card">
            <div class="panel-heading">
              <h2>Parsed evidence & indicators</h2>
            </div>
            <div class="panel-body">
              ${evidenceRows ? `
                <dl class="evidence-dl">${evidenceRows}</dl>
              ` : '<p class="muted">No structured evidence fields parsed from payload.</p>'}

              <div class="ioc-section">
                <h3 style="margin-bottom: 12px; font-size: 14px;">Extracted IOCs</h3>
                ${iocSections || '<p class="muted">No indicators extracted from alert body.</p>'}
              </div>
            </div>
          </section>

          <!-- 3. Detection Baseline (Rules) -->
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

        <!-- RIGHT COLUMN: Copilot & Scoped Chat -->
        <div class="detail-right-col">
          <!-- Copilot Explanation Card -->
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

          <!-- Embedded Scoped Chat Container -->
          <div id="detail-chat-mount"></div>
        </div>
      </div>

      <!-- BOTTOM DISPOSITION & NOTES PANEL -->
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

    // Mount scoped chat component
    const chatMount = container.querySelector('#detail-chat-mount');
    if (chatMount) {
      chatInstance = renderChat(chatMount, state.id, state.messages);
    }
  }

  function bindContentEvents(container) {
    // Copy Raw Alert Log
    const copyRawBtn = container.querySelector('#copy-raw-alert-btn');
    if (copyRawBtn && state.alert) {
      copyRawBtn.addEventListener('click', async () => {
        await copyToClipboard(state.alert.raw_alert);
        showToast('Raw alert log copied to clipboard', 'success');
      });
    }

    // Mini IOC copy buttons
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

    // Explain Alert / Regenerate Button
    const explainBtn = container.querySelector('#btn-explain-alert');
    if (explainBtn) {
      explainBtn.addEventListener('click', () => {
        generateExplanation(container, !!state.explanation);
      });
    }

    // Status Change Dropdown
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

    // Notes editing & saving
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

    // Copy Markdown Report Button
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

    // Download Markdown Report Button
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
          <div>
            <strong>Fallback to deterministic rules:</strong> ${escapeHtml(res.fallback_reason)}
          </div>
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

    // Interactive checklist checkbox toggle
    resultBox.querySelectorAll('.checklist-item input[type="checkbox"]').forEach(cb => {
      cb.addEventListener('change', () => {
        const parent = cb.closest('.checklist-item');
        if (parent) {
          parent.classList.toggle('checked', cb.checked);
        }
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
