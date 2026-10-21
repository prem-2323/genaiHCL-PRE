/**
 * Centralized API Client
 * Pure Vanilla JavaScript (ES6+) Fetch API
 */

// Safe base URL configuration
export function getApiBase() {
  return localStorage.getItem('soc-api-base') || 'http://localhost:8000';
}

export function setApiBase(url) {
  if (!url) {
    localStorage.removeItem('soc-api-base');
  } else {
    localStorage.setItem('soc-api-base', url.replace(/\/+$/, ''));
  }
}

/**
 * Core HTTP Request Function
 * @param {string} path - API endpoint path (e.g. '/api/alerts')
 * @param {object} [body] - Optional request body for POST/PUT/PATCH
 * @param {string} [method] - HTTP method (GET, POST, PUT, PATCH, DELETE)
 * @param {AbortSignal} [signal] - Optional cancellation signal
 * @returns {Promise<any>}
 */
export async function api(path, body = undefined, method = undefined, signal = undefined) {
  const baseUrl = getApiBase();
  const url = `${baseUrl}${path}`;
  
  const resolvedMethod = method || (body === undefined ? 'GET' : 'POST');
  const headers = {};

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  let response;
  try {
    response = await fetch(url, {
      method: resolvedMethod,
      headers: Object.keys(headers).length ? headers : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal
    });
  } catch (error) {
    if (error.name === 'AbortError') {
      throw error;
    }
    throw new Error(
      `Cannot connect to backend at ${baseUrl}. Ensure backend is running (port 8000) and retry.`
    );
  }

  if (!response.ok) {
    let errorDetail = '';
    try {
      const data = await response.json();
      if (typeof data.detail === 'string') {
        errorDetail = data.detail;
      } else if (Array.isArray(data.detail)) {
        errorDetail = data.detail.map(d => d.msg || JSON.stringify(d)).join(', ');
      }
    } catch (_) {
      // Non-JSON response
    }

    if (!errorDetail) {
      errorDetail = `Request failed with HTTP ${response.status} (${response.statusText || 'Error'}).`;
    }
    throw new Error(errorDetail);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return null;
  }

  return response.json();
}

/**
 * Fetch raw Markdown report text
 * @param {string|number} id - Alert ID
 * @param {boolean} rulesOnly - Rules-only mode flag
 * @returns {Promise<string>}
 */
export async function reportText(id, rulesOnly = false) {
  const baseUrl = getApiBase();
  const url = `${baseUrl}/api/alerts/${id}/report.md?rules_only=${rulesOnly}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Report export failed. Check backend connection and retry.');
  }
  return response.text();
}

/**
 * Trigger browser file download of Markdown report
 * @param {string|number} id - Alert ID
 * @param {boolean} rulesOnly - Rules-only mode flag
 */
export function downloadReport(id, rulesOnly = false) {
  const baseUrl = getApiBase();
  const url = `${baseUrl}/api/alerts/${id}/report.md?rules_only=${rulesOnly}`;
  
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `ALR-${id}.md`;
  anchor.target = '_blank';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}
