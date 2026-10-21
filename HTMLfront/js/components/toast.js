/**
 * Toast Notification Component
 */
import { icons } from '../utils.js';

let container = null;

function ensureContainer() {
  if (!container) {
    container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      container.setAttribute('aria-live', 'polite');
      document.body.appendChild(container);
    }
  }
  return container;
}

/**
 * Display a toast notification
 * @param {string} message - Message text
 * @param {'success'|'error'|'info'} [type='info'] - Toast category
 * @param {number} [duration=3500] - Duration in ms
 */
export function showToast(message, type = 'info', duration = 3500) {
  const root = ensureContainer();
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'status');

  let iconSvg = icons.info;
  if (type === 'success') iconSvg = icons.check;
  if (type === 'error') iconSvg = icons.alertTriangle;

  toast.innerHTML = `
    ${iconSvg}
    <span>${message}</span>
  `;

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
