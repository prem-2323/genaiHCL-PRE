/**
 * Scoped Alert Chat Component
 * Connects to POST /api/alerts/{id}/chat and GET /api/alerts/{id}/chat
 */
import { api } from '../api.js';
import { escapeHtml, icons } from '../utils.js';
import { showToast } from '../components/toast.js';

const suggestions = [
  "How do I resolve this alert step by step?",
  "Is this likely a false positive?",
  "What should I check next?",
  "Summarize for my manager"
];

export function renderChat(container, alertId, initialMessages = []) {
  let messages = [...initialMessages];
  let busy = false;
  let elapsedTimer = null;
  let elapsedSeconds = 0;

  container.innerHTML = `
    <div class="panel copilot-panel">
      <div class="panel-heading">
        <h2>${icons.sparkles} Ask about this alert</h2>
        <span class="muted" style="font-size: 11px;">Scoped triage assistant</span>
      </div>
      <div class="panel-body chat-container">
        <p class="muted" style="font-size: 13px;">
          This discussion is strictly scoped to this incident. Ask follow-up questions or choose a quick prompt chip.
        </p>

        <div class="chat-suggestions">
          ${suggestions.map(s => `
            <button class="chip-btn" data-suggestion="${escapeHtml(s)}">${escapeHtml(s)}</button>
          `).join('')}
        </div>

        <div class="chat-messages" id="chat-messages-box" aria-live="polite">
          <!-- messages rendered here -->
        </div>

        <div id="chat-error-box"></div>

        <div id="chat-loading-box" style="display: none; padding: 12px; background: #F8FAFC; border-radius: var(--radius-sm); border: 1px solid var(--border-color); font-size: 13px; color: var(--secondary-text);">
          <span class="spinner spinner-sm"></span>
          <span>Preparing scoped response · <strong id="chat-elapsed-count">0</strong>s…</span>
        </div>

        <form class="chat-input-form" id="chat-form">
          <div class="chat-input-row">
            <textarea
              id="chat-textarea"
              placeholder="Type your question about this alert… (Enter to send, Shift+Enter for new line)"
              rows="2"
              maxlength="1000"
            ></textarea>
            <button type="submit" class="btn btn-primary" id="chat-send-btn" style="align-self: flex-end;" title="Send question">
              ${icons.send}
              <span>Ask</span>
            </button>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--muted-text);">
            <span>Press Enter to send</span>
            <span id="chat-char-counter">0 / 1000</span>
          </div>
        </form>
      </div>
    </div>
  `;

  const messagesBox = container.querySelector('#chat-messages-box');
  const chatForm = container.querySelector('#chat-form');
  const textarea = container.querySelector('#chat-textarea');
  const sendBtn = container.querySelector('#chat-send-btn');
  const errorBox = container.querySelector('#chat-error-box');
  const loadingBox = container.querySelector('#chat-loading-box');
  const elapsedEl = container.querySelector('#chat-elapsed-count');
  const counterEl = container.querySelector('#chat-char-counter');

  function renderMessages() {
    if (!messagesBox) return;

    if (messages.length === 0) {
      messagesBox.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: var(--muted-text); font-size: 13px; text-align: center;">
          <p>No messages yet. Ask a question or click a suggestion above.</p>
        </div>
      `;
      return;
    }

    messagesBox.innerHTML = messages.map(m => {
      const isUser = m.role === 'user';
      const meta = m.metadata || {};
      const metaInfo = !isUser && meta.engine
        ? `${meta.engine} · ${meta.provider || 'local'} · ${meta.generation_ms ? (meta.generation_ms / 1000).toFixed(1) + 's' : ''}`
        : '';

      return `
        <article class="chat-bubble ${isUser ? 'user' : 'assistant'}">
          <strong>${isUser ? 'You' : 'Copilot'}</strong>
          <p style="white-space: pre-wrap;">${escapeHtml(m.content)}</p>
          ${metaInfo ? `<span class="message-meta">${metaInfo}</span>` : ''}
        </article>
      `;
    }).join('');

    // Scroll to bottom
    messagesBox.scrollTop = messagesBox.scrollHeight;
  }

  renderMessages();

  // Character counter
  if (textarea && counterEl) {
    textarea.addEventListener('input', () => {
      counterEl.textContent = `${textarea.value.length} / 1000`;
    });

    // Enter to submit, Shift+Enter for new line
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        chatForm.dispatchEvent(new Event('submit'));
      }
    });
  }

  // Suggestion chips
  container.querySelectorAll('.chip-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const q = btn.getAttribute('data-suggestion');
      if (q && !busy) {
        submitQuestion(q);
      }
    });
  });

  // Form submit
  if (chatForm) {
    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = textarea.value.trim();
      if (text.length >= 3 && !busy) {
        submitQuestion(text);
      }
    });
  }

  async function submitQuestion(questionText) {
    if (busy || questionText.length < 3) return;

    busy = true;
    if (sendBtn) sendBtn.disabled = true;
    if (errorBox) errorBox.innerHTML = '';
    if (loadingBox) loadingBox.style.display = 'block';

    elapsedSeconds = 0;
    if (elapsedTimer) clearInterval(elapsedTimer);
    elapsedTimer = setInterval(() => {
      elapsedSeconds++;
      if (elapsedEl) elapsedEl.textContent = String(elapsedSeconds);
    }, 1000);

    const rulesOnly = localStorage.getItem('soc-rules-only') === 'true';

    // Optimistically add user bubble to display immediately
    const tempUserMsg = {
      id: Date.now(),
      alert_id: alertId,
      role: 'user',
      content: questionText,
      timestamp: new Date().toISOString(),
      metadata: {}
    };
    messages.push(tempUserMsg);
    renderMessages();
    if (textarea) {
      textarea.value = '';
      if (counterEl) counterEl.textContent = '0 / 1000';
    }

    try {
      await api(`/api/alerts/${alertId}/chat`, {
        question: questionText,
        rules_only: rulesOnly
      }, 'POST');

      // Refresh complete stored message history from backend
      const history = await api(`/api/alerts/${alertId}/chat`, undefined, 'GET');
      messages = history;
      renderMessages();
    } catch (err) {
      if (errorBox) {
        errorBox.innerHTML = `
          <div class="alert-box alert-error" style="margin-top: 8px;">
            ${icons.alertTriangle}
            <span>${escapeHtml(err.message)}</span>
          </div>
        `;
      }
      showToast(err.message, 'error');
    } finally {
      busy = false;
      if (elapsedTimer) clearInterval(elapsedTimer);
      if (loadingBox) loadingBox.style.display = 'none';
      if (sendBtn) sendBtn.disabled = false;
    }
  }

  return {
    setMessages: (newMessages) => {
      messages = [...newMessages];
      renderMessages();
    }
  };
}
