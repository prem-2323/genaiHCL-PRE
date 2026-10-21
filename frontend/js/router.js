/**
 * Lightweight Client-Side Hash Router
 * Pure Vanilla JavaScript (ES6+)
 */
import { createQueuePage } from './pages/queue.js';
import { createDetailPage } from './pages/detail.js';
import { createHistoryPage } from './pages/history.js';
import { createSettingsPage } from './pages/settings.js';
import { updateSidebarActiveRoute } from './components/sidebar.js';
import { icons } from './utils.js';

let currentPageInstance = null;
let appContentContainer = null;

export function initRouter(container) {
  appContentContainer = container;

  window.addEventListener('hashchange', handleRoute);
  handleRoute();
}

export function navigateTo(hashPath) {
  window.location.hash = hashPath;
}

function handleRoute() {
  const hash = window.location.hash || '#/';
  const path = hash.replace(/^#/, '') || '/';

  // Cleanup active component if unmount hook provided
  if (currentPageInstance && typeof currentPageInstance.unmount === 'function') {
    currentPageInstance.unmount(appContentContainer);
    currentPageInstance = null;
  }

  // Scroll to top
  window.scrollTo(0, 0);

  // Route: Alert Detail `#/alerts/:id`
  const alertDetailMatch = path.match(/^\/alerts\/(\d+|ALR-\d+)$/i);
  if (alertDetailMatch) {
    const rawId = alertDetailMatch[1].toUpperCase().replace(/^ALR-/, '');
    updateSidebarActiveRoute('detail');
    currentPageInstance = createDetailPage(rawId);
    currentPageInstance.mount(appContentContainer);
    return;
  }

  // Route: History & Audit `#/history`
  if (path === '/history') {
    updateSidebarActiveRoute('history');
    currentPageInstance = createHistoryPage();
    currentPageInstance.mount(appContentContainer);
    return;
  }

  // Route: Settings `#/settings`
  if (path === '/settings') {
    updateSidebarActiveRoute('settings');
    currentPageInstance = createSettingsPage();
    currentPageInstance.mount(appContentContainer);
    return;
  }

  // Route: Queue (Home) `#/` or `/`
  if (path === '/' || path === '') {
    updateSidebarActiveRoute('queue');
    currentPageInstance = createQueuePage();
    currentPageInstance.mount(appContentContainer);
    return;
  }

  // 404 Fallback
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
