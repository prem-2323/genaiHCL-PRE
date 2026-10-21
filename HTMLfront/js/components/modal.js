/**
 * Accessible Modal Dialog Component
 */
import { icons } from '../utils.js';

let activeModal = null;
let keydownHandler = null;

/**
 * Open an accessible modal dialog
 * @param {object} options
 * @param {string} options.title - Header title
 * @param {string} options.contentHtml - HTML content for modal body
 * @param {string} [options.confirmText] - Label for primary button
 * @param {string} [options.cancelText='Cancel'] - Label for cancel button
 * @param {Function} [options.onConfirm] - Async or sync callback when confirmed
 * @param {Function} [options.onRender] - Callback after DOM inserted to bind events
 */
export function openModal({
  title,
  contentHtml,
  confirmText,
  cancelText = 'Cancel',
  onConfirm,
  onRender
}) {
  closeModal();

  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.id = 'active-modal-backdrop';
  backdrop.setAttribute('role', 'dialog');
  backdrop.setAttribute('aria-modal', 'true');
  backdrop.setAttribute('aria-labelledby', 'modal-title');

  backdrop.innerHTML = `
    <div class="modal-dialog">
      <div class="modal-header">
        <h3 id="modal-title">${title}</h3>
        <button class="modal-close-btn" aria-label="Close dialog" id="modal-close-x">
          ${icons.close}
        </button>
      </div>
      <div class="modal-body" id="modal-body-content">
        ${contentHtml}
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" id="modal-cancel-btn">${cancelText}</button>
        ${confirmText ? `<button class="btn btn-primary" id="modal-confirm-btn">${confirmText}</button>` : ''}
      </div>
    </div>
  `;

  document.body.appendChild(backdrop);
  document.body.style.overflow = 'hidden';

  // Trigger animation frame for transition
  requestAnimationFrame(() => {
    backdrop.classList.add('active');
  });

  const closeX = backdrop.querySelector('#modal-close-x');
  const cancelBtn = backdrop.querySelector('#modal-cancel-btn');
  const confirmBtn = backdrop.querySelector('#modal-confirm-btn');

  closeX.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);

  if (confirmBtn && onConfirm) {
    confirmBtn.addEventListener('click', async () => {
      confirmBtn.disabled = true;
      const originalText = confirmBtn.innerHTML;
      confirmBtn.innerHTML = `<span class="spinner spinner-sm"></span> Processing…`;
      try {
        const result = await onConfirm();
        if (result !== false) {
          closeModal();
        }
      } catch (err) {
        // error handling inside caller
      } finally {
        if (confirmBtn) {
          confirmBtn.disabled = false;
          confirmBtn.innerHTML = originalText;
        }
      }
    });
  }

  // Backdrop click closes dialog
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) {
      closeModal();
    }
  });

  // Escape key closes modal
  keydownHandler = (e) => {
    if (e.key === 'Escape') {
      closeModal();
    }
  };
  window.addEventListener('keydown', keydownHandler);

  activeModal = backdrop;

  if (typeof onRender === 'function') {
    onRender(backdrop);
  }

  // Focus the first focusable element
  const focusable = backdrop.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  if (focusable.length > 1) {
    setTimeout(() => focusable[1].focus(), 50);
  }
}

/**
 * Close active modal
 */
export function closeModal() {
  if (activeModal) {
    activeModal.classList.remove('active');
    setTimeout(() => {
      if (activeModal && activeModal.parentNode) {
        activeModal.parentNode.removeChild(activeModal);
      }
      activeModal = null;
    }, 150);
  }
  document.body.style.overflow = '';
  if (keydownHandler) {
    window.removeEventListener('keydown', keydownHandler);
    keydownHandler = null;
  }
}
