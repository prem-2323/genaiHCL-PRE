/**
 * Main Application Coordinator
 * Boots shell, header, sidebar, and hash router
 */
import { renderSidebar } from './components/sidebar.js';
import { renderHeader } from './components/header.js';
import { initRouter } from './router.js';

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
