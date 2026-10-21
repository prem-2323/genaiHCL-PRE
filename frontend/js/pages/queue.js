/**
 * Queue Page Component
 * Alert triage workspace with stats, filters, volume chart, and alert listing
 */
import { api } from '../api.js';
import { escapeHtml, formatDate, debounce, icons } from '../utils.js';
import { updateSidebarBadge } from '../components/sidebar.js';
import { updateBreadcrumb, openIngestModal } from '../components/header.js';
import { showToast } from '../components/toast.js';

export function createQueuePage() {
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
    lookup: ''
  };

  let abortCtrl = null;
  let elapsedTimer = null;
  let elapsedSeconds = 0;

  function render(container) {
    updateBreadcrumb('Alert queue');

    container.innerHTML = `
      <div class="page-heading">
        <div>
          <p class="eyebrow">Triage Workspace</p>
          <h1>Alert queue</h1>
          <p>Review the signal. Verify the evidence. Decide the response.</p>
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

      <div id="queue-error-container"></div>
      <div id="queue-stats-container"></div>

      <section class="card">
        <div class="panel-heading">
          <h2>${icons.list} All alerts</h2>
          <form id="queue-lookup-form" style="display: flex; gap: 8px; align-items: center;">
            <label for="queue-lookup-input" class="muted" style="font-size: 12px; font-weight: 600;">Go to #</label>
            <input type="text" id="queue-lookup-input" placeholder="e.g. 1002" style="width: 100px; height: 32px; padding: 4px 8px; font-size: 13px;" />
            <button class="btn btn-sm" type="submit">Open</button>
          </form>
        </div>

        <div class="filters-toolbar">
          <div class="filter-group filter-search-box">
            <input type="search" class="filter-input" id="filter-q" placeholder="Search ID, source, or alert text…" value="${escapeHtml(state.q)}" />
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

        <div id="queue-table-container">
          <div class="loading-container">
            <span class="spinner spinner-lg"></span>
            <p>Loading alerts…</p>
            <span class="elapsed" id="queue-elapsed">0s</span>
          </div>
        </div>

        <div id="queue-pager-container"></div>
      </section>
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

    // Global refresh listener
    const onGlobalRefresh = () => fetchData(container, true);
    window.addEventListener('soc-refresh', onGlobalRefresh);
    container._cleanup = () => {
      window.removeEventListener('soc-refresh', onGlobalRefresh);
      if (abortCtrl) abortCtrl.abort();
      if (elapsedTimer) clearInterval(elapsedTimer);
    };
  }

  async function fetchData(container, refreshStats = true) {
    if (abortCtrl) abortCtrl.abort();
    abortCtrl = new AbortController();

    // Start timer
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
      if (statsData) {
        state.stats = statsData;
        updateSidebarBadge(statsData.open_count);
        renderStats(container);
        updateTypeOptions(container);
      }

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

  function renderStats(container) {
    const statsContainer = container.querySelector('#queue-stats-container');
    if (!statsContainer || !state.stats) return;

    const s = state.stats;
    const maxDayCount = Math.max(...(s.over_time.map(x => x.count) || [1]), 1);

    const typePills = Object.entries(s.by_type || {}).map(([typeName, count]) => `
      <button class="type-pill ${state.type === typeName ? 'active' : ''}" data-type="${escapeHtml(typeName)}">
        <span>${escapeHtml(typeName)}</span>
        <b>${count}</b>
      </button>
    `).join('');

    const chartBars = (s.over_time || []).map(day => {
      const heightPercent = Math.max(8, Math.round((day.count / maxDayCount) * 100));
      const shortDate = day.time.slice(5);
      return `
        <div class="bar-col" title="${day.time}: ${day.count} alerts">
          <span class="bar-count">${day.count}</span>
          <div class="bar-fill" style="height: ${heightPercent}%;"></div>
          <span class="bar-label">${shortDate}</span>
        </div>
      `;
    }).join('');

    statsContainer.innerHTML = `
      <div class="stats-strip">
        <div class="stat-card">
          <span class="stat-label">Open Alerts</span>
          <span class="stat-value">${s.open_count}</span>
        </div>
        <div class="stat-card stat-critical">
          <span class="stat-label">Critical</span>
          <span class="stat-value">${s.by_severity.CRITICAL || 0}</span>
        </div>
        <div class="stat-card stat-high">
          <span class="stat-label">High</span>
          <span class="stat-value">${s.by_severity.HIGH || 0}</span>
        </div>
        <div class="stat-card stat-medium">
          <span class="stat-label">Medium</span>
          <span class="stat-value">${s.by_severity.MEDIUM || 0}</span>
        </div>
        <div class="stat-card stat-low">
          <span class="stat-label">Low</span>
          <span class="stat-value">${s.by_severity.LOW || 0}</span>
        </div>
      </div>

      <div class="overview-grid">
        <section class="card" style="margin-bottom: 0;">
          <div class="panel-heading">
            <h2>Detection mix</h2>
            <span class="muted" style="font-size: 11px;">Click to filter</span>
          </div>
          <div class="panel-body">
            <div class="type-counts-list">
              ${typePills || '<p class="muted">No types recorded.</p>'}
            </div>
          </div>
        </section>

        <section class="card" style="margin-bottom: 0;">
          <div class="panel-heading">
            <h2>Alert volume</h2>
            <span class="muted" style="font-size: 11px;">Per day · UTC</span>
          </div>
          <div class="panel-body">
            <div class="bar-chart-container" role="img" aria-label="Alert volume chart">
              ${chartBars || '<p class="muted">No volume data available.</p>'}
            </div>
          </div>
        </section>
      </div>
    `;

    // Click handler for type pills
    statsContainer.querySelectorAll('.type-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        const selectedType = btn.getAttribute('data-type');
        state.type = (state.type === selectedType) ? '' : selectedType;
        state.page = 1;
        const typeSelect = container.querySelector('#filter-type');
        if (typeSelect) typeSelect.value = state.type;
        fetchData(container, false);
      });
    });
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
      const sevClass = alert.baseline.severity.toLowerCase();
      const statusSlug = alert.status.toLowerCase().replace(/\s+/g, '-');
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
            <span class="badge badge-status ${statusSlug}">${alert.status}</span>
          </td>
          <td style="text-align: right;">
            <a href="#/alerts/${alert.id}" class="btn btn-sm btn-ghost" title="View incident analysis">
              <span>View</span>
              ${icons.chevronRight}
            </a>
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
              <th style="width: 180px;">Timestamp</th>
              <th>Source</th>
              <th>Incident Type</th>
              <th style="width: 110px;">Severity</th>
              <th style="width: 110px;">Status</th>
              <th style="width: 90px; text-align: right;">Action</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;

    // Make whole row clickable
    tableContainer.querySelectorAll('tbody tr').forEach(row => {
      row.addEventListener('click', (e) => {
        if (e.target.closest('a') || e.target.closest('button')) return;
        const id = row.getAttribute('data-id');
        if (id) window.location.hash = `#/alerts/${id}`;
      });
    });
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
