"""Comprehensive End-to-End Test Suite for SOC Copilot Frontend & Backend."""
import json
import os
import sys
import time
import urllib.request
import urllib.error

API_BASE = 'http://localhost:8000'
FRONTEND_BASE = 'http://localhost:5173'

test_results = []


def record(name: str, passed: bool, detail: str = ""):
    status_str = "PASS" if passed else "FAIL"
    test_results.append((name, passed, detail))
    print(f"[{status_str}] {name} {detail and ('- ' + detail)}", flush=True)


def request(path: str, method: str = 'GET', data: dict = None, expected_status: int = 200):
    url = API_BASE + path
    headers = {'Origin': 'http://localhost:5173'}
    body = None
    if data is not None:
        headers['Content-Type'] = 'application/json'
        body = json.dumps(data).encode('utf-8')
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30) as res:
            res_body = res.read().decode('utf-8')
            content_type = res.headers.get('Content-Type', '')
            cors_origin = res.headers.get('Access-Control-Allow-Origin', '')
            parsed = json.loads(res_body) if 'application/json' in content_type else res_body
            return res.status, parsed, cors_origin
    except urllib.error.HTTPError as exc:
        res_body = exc.read().decode('utf-8')
        try:
            parsed = json.loads(res_body)
        except Exception:
            parsed = res_body
        return exc.code, parsed, exc.headers.get('Access-Control-Allow-Origin', '')


def main():
    print("============================================================")
    print("      Testing Full Stack (Frontend + Backend + LLM)")
    print("============================================================\n")

    # 1. Frontend Server Connectivity & CORS
    print("--- 1. Frontend Web Server ---")
    try:
        req = urllib.request.Request(FRONTEND_BASE)
        with urllib.request.urlopen(req, timeout=5) as res:
            content = res.read().decode('utf-8')
            record("Frontend Server Running (Port 5173)", res.status == 200, f"HTTP {res.status}")
            record("Frontend HTML Serves Application Shell", 'id="main-content"' in content, "Found #main-content")
    except Exception as exc:
        record("Frontend Server Running (Port 5173)", False, str(exc))

    # 2. Backend Health & Provider Configuration
    print("\n--- 2. Backend Health & Ollama Config ---")
    status, health, cors = request('/health')
    record("Backend /health Endpoint", status == 200, f"HTTP {status}")
    record("CORS Headers configured for http://localhost:5173", cors == 'http://localhost:5173', f"Access-Control-Allow-Origin: {cors}")
    record("LLM Provider set to 'ollama'", health.get('provider') == 'ollama', f"Provider: {health.get('provider')}")
    record("Model set to 'qwen2.5:3b'", health.get('model') == 'qwen2.5:3b', f"Model: {health.get('model')}")

    # 3. Metrics & Stats
    print("\n--- 3. Stats & Metrics (/api/stats) ---")
    status, stats, _ = request('/api/stats')
    record("Backend /api/stats Endpoint", status == 200 and 'open_count' in stats, f"Open Alerts: {stats.get('open_count')}")
    record("Incident Severity Distribution", 'by_severity' in stats, f"Severities: {stats.get('by_severity')}")

    # 4. Alerts Queue (List, Filter, Search)
    print("\n--- 4. Alert Queue & Search (/api/alerts) ---")
    status, page, _ = request('/api/alerts?page=1&page_size=5')
    record("Alerts List Pagination", status == 200 and len(page.get('items', [])) == 5, f"Loaded {len(page.get('items', []))} items")

    status, high_page, _ = request('/api/alerts?severity=HIGH')
    record("Filter Alerts by Severity=HIGH", status == 200 and all(a['baseline']['severity'] == 'HIGH' for a in high_page.get('items', [])), f"{len(high_page.get('items', []))} HIGH alerts")

    status, search_page, _ = request('/api/alerts?q=Brute')
    record("Search Alerts by Query 'q=Brute'", status == 200 and len(search_page.get('items', [])) > 0, f"Found {len(search_page.get('items', []))} matches")

    # 5. Alert Ingestion (POST /api/alerts)
    print("\n--- 5. Alert Ingestion (POST /api/alerts) ---")
    ingest_payload = {
        "title": "Simulated E2E Phishing Test Alert",
        "source": "Security Mail Gateway",
        "raw_alert": "Phishing detection: suspicious link in email from attacker@evil.example. URL: https://evil.example/login"
    }
    status, new_alert, _ = request('/api/alerts', method='POST', data=ingest_payload)
    new_aid = new_alert.get('id')
    record("Ingest New Alert via API", status == 201 and new_aid is not None, f"Created Alert ALR-{new_aid}")
    record("Automated Rule Analysis on Ingestion", new_alert.get('baseline', {}).get('incident_type') == 'Phishing', f"Classified as {new_alert.get('baseline', {}).get('incident_type')}")

    # 6. Alert Details, Notes & Status Management
    print("\n--- 6. Alert Detail & Notes (/api/alerts/{id}) ---")
    status, alert_detail, _ = request(f'/api/alerts/{new_aid}')
    record(f"Fetch Alert Detail ALR-{new_aid}", status == 200, f"Title: {alert_detail.get('title')}")

    # Update Notes
    status, notes_res, _ = request(f'/api/alerts/{new_aid}/notes', method='PUT', data={'text': 'E2E Test Note: Analyst reviewing email gateway headers.'})
    record("Update Alert Notes", status == 200 and 'Analyst reviewing' in notes_res.get('text', ''), "Notes saved successfully")

    # Update Status
    status, status_res, _ = request(f'/api/alerts/{new_aid}/status', method='PATCH', data={'status': 'In progress'})
    record("Update Alert Status to 'In progress'", status == 200 and status_res.get('status') == 'In progress', "Status updated")

    # 7. LLM Narrative Generation with Ollama qwen2.5:3b
    print("\n--- 7. Ollama qwen2.5:3b LLM Narrative (/api/alerts/{id}/explain) ---")
    t0 = time.monotonic()
    status, explain_res, _ = request(f'/api/alerts/{new_aid}/explain?regenerate=true', method='POST')
    elapsed = round(time.monotonic() - t0, 2)
    record("Generate AI Explanation (Ollama qwen2.5:3b)", status == 200, f"Generated in {elapsed}s")
    record("AI Engine is 'llm' and Provider is 'ollama'", explain_res.get('engine') == 'llm' and explain_res.get('provider') == 'ollama', f"Engine: {explain_res.get('engine')} / {explain_res.get('provider')}")
    record("Valid Narrative Schema (Summary, Why It Matters, Verify, Next Steps)",
           bool(explain_res.get('summary') and explain_res.get('why_it_matters') and len(explain_res.get('verify_first', [])) == 2 and len(explain_res.get('next_steps', [])) == 3),
           f"Next Steps count: {len(explain_res.get('next_steps', []))}")

    # 8. Interactive Chat with Ollama
    print("\n--- 8. Incident Chat Copilot (/api/alerts/{id}/chat) ---")
    chat_payload = {"question": "how do i solve this alert step by step", "rules_only": False}
    t0 = time.monotonic()
    status, chat_res, _ = request(f'/api/alerts/{new_aid}/chat', method='POST', data=chat_payload)
    elapsed = round(time.monotonic() - t0, 2)
    record("Scoped Chat with Ollama qwen2.5:3b", status == 200 and chat_res.get('engine') == 'llm', f"Answer received in {elapsed}s")
    record("Chat Generated Step-by-Step Action Plan", "1. " in chat_res.get('answer', '') and "2. " in chat_res.get('answer', ''), f"Plan formatted with numbered steps")

    # Verify chat history
    status, chat_history, _ = request(f'/api/alerts/{new_aid}/chat')
    record("Retrieve Alert Chat Conversation History", status == 200 and len(chat_history) >= 1, f"History contains {len(chat_history)} exchange(s)")

    # 9. Markdown Report Export
    print("\n--- 9. Incident Report Markdown Export ---")
    status, report_md, _ = request(f'/api/alerts/{new_aid}/report.md')
    record("Export Incident Report as Markdown", status == 200 and isinstance(report_md, str), f"Report size: {len(report_md)} bytes")
    record("Report Includes Provenance and Notes", "Engine: llm" in report_md and "E2E Test Note" in report_md, "Found AI Provenance and Analyst Notes in report")

    # 10. Audit History Log
    print("\n--- 10. Audit History Log (/api/history) ---")
    status, history_page, _ = request('/api/history?page=1&page_size=5')
    record("Audit History Logs Status Changes", status == 200 and len(history_page.get('changes', [])) > 0, f"History changes logged: {len(history_page.get('changes', []))}")

    # Summary
    print("\n============================================================")
    total = len(test_results)
    passed = sum(1 for _, p, _ in test_results)
    failed = total - passed
    print(f"Total Tests: {total} | Passed: {passed} | Failed: {failed}")
    print("============================================================")

    if failed > 0:
        sys.exit(1)


if __name__ == '__main__':
    main()
