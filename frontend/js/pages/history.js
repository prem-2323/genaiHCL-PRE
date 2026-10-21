/**
 * History & Audit Page Component
 * Connects to GET /api/history
 */
import { api } from '../api.js';
import { escapeHtml, formatDate, icons } from '../utils.js';
import { updateBreadcrumb } from '../components/header.js';

export function createHistoryPage() {
  let state = {
    data: null,
    error: '',
    page: 1,
    pageSize: 20
  };

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
          New alerts — seeded or ingested — start as <strong>New</strong>, so this page stays empty until you move an
          alert to <strong>In progress</strong> or <strong>Closed</strong>. Ingesting an alert adds it to the queue,
          not to this audit trail. <a href="#/alerts/1002">Open alert 1002</a> to try it.
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
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => fetchData(container));
    }

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

    // Status Changes Rows
    const changesRows = changes.map(ch => {
      const oldSlug = ch.old_status.toLowerCase().replace(/\s+/g, '-');
      const newSlug = ch.new_status.toLowerCase().replace(/\s+/g, '-');
      return `
        <tr>
          <td>
            <a href="#/alerts/${ch.alert_id}" class="id-link">ALR-${ch.alert_id}</a>
          </td>
          <td>
            <span class="badge badge-status ${oldSlug}">${ch.old_status}</span>
          </td>
          <td>
            <span class="badge badge-status ${newSlug}">${ch.new_status}</span>
          </td>
          <td style="white-space: nowrap;">${formatDate(ch.timestamp)}</td>
        </tr>
      `;
    }).join('');

    // Closed Alerts Rows
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
          <td>
            <span class="badge badge-${sevClass}">${alert.baseline.severity}</span>
          </td>
          <td>
            <span class="badge badge-status closed">Closed</span>
          </td>
          <td style="text-align: right;">
            <a href="#/alerts/${alert.id}" class="btn btn-sm btn-ghost">
              <span>View</span>
              ${icons.chevronRight}
            </a>
          </td>
        </tr>
      `;
    }).join('');

    contentEl.innerHTML = `
      <!-- Status History Section -->
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
                <tbody>
                  ${changesRows}
                </tbody>
              </table>
            </div>
          ` : `
            <div class="empty-state" style="padding: 28px 16px;">
              <p class="muted" style="margin-bottom: 12px;">No status changes yet. Open an alert and change its Incident Status to create the first audit entry.</p>
              <a href="#/alerts/1002" class="btn btn-sm btn-primary">Open alert 1002</a>
              <a href="#/" class="btn btn-sm btn-ghost">Go to Alert Queue</a>
            </div>
          `}
        </div>
      </section>

      <!-- Closed Alerts Section -->
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
                <tbody>
                  ${closedRows}
                </tbody>
              </table>
            </div>
          ` : `
            <div class="empty-state" style="padding: 28px 16px;">
              <p class="muted" style="margin-bottom: 12px;">No closed alerts yet. Set an alert's status to Closed to archive it here.</p>
              <a href="#/" class="btn btn-sm btn-primary">Go to Alert Queue</a>
            </div>
          `}
        </div>
      </section>

      <!-- Pager -->
      <div class="pager" style="border-radius: var(--radius-md); border: 1px solid var(--border-color); background: var(--bg-primary);">
        <span>Page <strong>${state.page}</strong> of <strong>${totalPages}</strong> · <strong>${maxTotal}</strong> records</span>
        <div class="pager-controls">
          <button class="btn btn-sm" id="hist-prev-btn" ${state.page <= 1 ? 'disabled' : ''}>
            ${icons.chevronLeft}
            <span>Previous</span>
          </button>
          <button class="btn btn-sm" id="hist-next-btn" ${state.page >= totalPages ? 'disabled' : ''}>
            <span>Next</span>
            ${icons.chevronRight}
          </button>
        </div>
      </div>
    `;

    // Row clicks
    contentEl.querySelectorAll('tbody tr').forEach(row => {
      row.addEventListener('click', (e) => {
        if (e.target.closest('a') || e.target.closest('button')) return;
        const id = row.getAttribute('data-id');
        if (id) window.location.hash = `#/alerts/${id}`;
      });
    });

    // Pager controls
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
