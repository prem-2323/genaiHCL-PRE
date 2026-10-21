/**
 * Sidebar Navigation Component
 */
import { icons } from '../utils.js';
import { openIngestModal } from './header.js';

export function renderSidebar(container) {
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

  // Desktop Collapse Toggle
  const toggleBtn = container.querySelector('#sidebar-collapse-toggle');
  const isCollapsed = localStorage.getItem('soc-sidebar-collapsed') === 'true';
  if (isCollapsed) {
    container.classList.add('collapsed');
    toggleBtn.innerHTML = icons.chevronRight;
  }

  toggleBtn.addEventListener('click', () => {
    const collapsed = container.classList.toggle('collapsed');
    localStorage.setItem('soc-sidebar-collapsed', String(collapsed));
    toggleBtn.innerHTML = collapsed ? icons.chevronRight : icons.chevronLeft;
  });

  // Mobile Drawer Backdrop Close
  const backdrop = document.getElementById('drawer-backdrop');
  if (backdrop) {
    backdrop.addEventListener('click', () => {
      closeMobileDrawer();
    });
  }

  // Close drawer when link clicked on mobile
  container.querySelectorAll('a.nav-item').forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 768) {
        closeMobileDrawer();
      }
    });
  });

  // Global ingest action in the sidebar
  container.addEventListener('click', (event) => {
    const ingestBtn = event.target.closest?.('#sidebar-ingest-btn');
    if (!ingestBtn) return;
    event.preventDefault();
    openIngestModal();
    if (window.innerWidth <= 768) {
      closeMobileDrawer();
    }
  });
}

export function updateSidebarActiveRoute(route) {
  const sidebar = document.querySelector('.sidebar');
  if (!sidebar) return;

  sidebar.querySelectorAll('.nav-item').forEach(link => {
    const linkRoute = link.getAttribute('data-route');
    if (
      (route === 'queue' && linkRoute === 'queue') ||
      (route === 'detail' && linkRoute === 'queue') || // detail is under queue
      (route === linkRoute)
    ) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

export function updateSidebarBadge(count) {
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

export function toggleMobileDrawer() {
  const sidebar = document.querySelector('.sidebar');
  const backdrop = document.getElementById('drawer-backdrop');
  if (sidebar && backdrop) {
    const isOpen = sidebar.classList.toggle('mobile-open');
    backdrop.classList.toggle('active', isOpen);
  }
}

export function closeMobileDrawer() {
  const sidebar = document.querySelector('.sidebar');
  const backdrop = document.getElementById('drawer-backdrop');
  if (sidebar && backdrop) {
    sidebar.classList.remove('mobile-open');
    backdrop.classList.remove('active');
  }
}
