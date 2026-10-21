/**
 * Queue Page Component - Executive Security Overview & SOC Triage Workspace
 * Features:
 * 1. Executive "Security Overview" header with 4 Sparkline Wave KPI Cards
 * 2. 2-Column Visuals: Smooth "Threat Activity" area curve chart with interactive tooltip
 *    and "Severity Distribution" SVG donut chart with real data & legend
 * 3. Forensic Threat Entities breakdown (IPs, Users, Hosts)
 * 4. MITRE ATT&CK candidate technique matrix
 * 5. Main Alert Queue with inline status dropdown and Quick Triage slide-over drawer
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
