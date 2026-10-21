# Local SOC Incident-Response Copilot — Pure HTML, CSS & Vanilla JS Frontend

A clean, high-performance, zero-compilation frontend for the **Local SOC Incident-Response Copilot**. Built purely using vanilla **HTML5**, **CSS3**, and **JavaScript (ES6+)** without React, TypeScript, Vite, Next.js, Tailwind CSS, or any npm dependencies.

---

## 1. Design System & Aesthetics

Implemented in strict accordance with the **White + Orange + Black + Blue** design specification:

| Token | Hex Value | Application |
|---|---|---|
| **Primary Background** | `#FFFFFF` | Main cards, tables, panels, and modal containers |
| **Secondary Background** | `#F7F8FA` | Workspace background, table row stripes |
| **Dark Sidebar** | `#111827` | Sleek dark navigation sidebar & high-contrast top system ribbon |
| **Primary Orange** | `#F97316` | Primary action buttons (CTA), active nav indicator, high-severity accents |
| **Dark Orange Hover** | `#EA580C` | Hover state for primary buttons and interactive accents |
| **Accent Blue** | `#2563EB` | Scoped AI assistant highlights, information alerts, secondary chips |
| **Light Blue** | `#EFF6FF` | Background for AI prompt chips, new alert tags, info notices |
| **Primary Text** | `#111827` | High-contrast body text and headers |
| **Secondary Text** | `#64748B` | Labels, metadata, and subtitle descriptions |
| **Border Color** | `#E5E7EB` | Clean structural dividers and card outlines |
| **Success Color** | `#16A34A` | Low severity badge, online status dot, save indicators |
| **Error Color** | `#DC2626` | Critical severity badge, offline status dot, error alerts |

---

## 2. Project Directory Structure

```
HTMLfront/
├── assets/
│   └── logo.svg                 # Brand icon with shield and copilot check
├── css/
│   ├── variables.css            # Design tokens, color system, spacing, radii
│   ├── base.css                 # CSS reset, typography, forms, scrollbars
│   ├── layout.css               # App shell, responsive sidebar, systembar, header
│   ├── components.css           # Buttons, badges, tables, modals, toasts, switch
│   ├── pages.css                # Queue, Detail, History, and Chat styles
│   └── responsive.css           # 375px, 768px, 1024px, and 1440px media queries
├── js/
│   ├── app.js                   # Application bootstrap and initialization
│   ├── router.js                # Lightweight client-side hash router
│   ├── api.js                   # Centralized Fetch API client with error handling
│   ├── utils.js                 # HTML escaping, date formatting, SVG icons, samples
│   ├── components/
│   │   ├── sidebar.js           # Responsive sidebar with desktop collapse & mobile drawer
│   │   ├── header.js            # Live health polling, quick alert jump, webhook ingest modal
│   │   ├── modal.js             # Accessible modal dialog with focus and Escape key handling
│   │   └── toast.js             # Toast notification system
│   └── pages/
│       ├── queue.js             # Triage workspace: stats, mix, bar chart, filters, table
│       ├── detail.js            # Incident analysis: evidence, baseline, copilot, notes
│       ├── chat.js              # Scoped triage assistant with prompt chips & multiline input
│       ├── history.js           # Status change audit log and closed alerts archive
│       └── settings.js          # Local LLM toggle, runtime inspector, sample reloader
├── index.html                   # Semantic HTML5 entry page with accessible skip link
└── README.md                    # Setup, architecture, and API documentation
```

---

## 3. How to Run Locally

### Step 1: Start the Backend (Port 8000)
From the project root:
```powershell
.\scripts\run_backend.ps1
```
Or directly with Python and Uvicorn:
```powershell
$env:PYTHONPATH='backend'
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```
Check backend health at [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health).

### Step 2: Serve the Frontend (Port 5173)
Because the backend CORS configuration allows `http://localhost:5173`, serve the static `HTMLfront` directory on port 5173 using Python's built-in HTTP server:

```powershell
cd HTMLfront
python -m http.server 5173
```
Alternatively, using Node:
```powershell
npx -y serve -l 5173 HTMLfront
```

Open your browser and navigate to:
[http://localhost:5173](http://localhost:5173)

---

## 4. Routes & Features

| Route | View | Description |
|---|---|---|
| `#/` | **Alert Queue** | Real-time open count, severity breakdown cards, detection mix filter pills, volume per day chart, full-text search, severity/status/type filters, pagination, and webhook alert simulator. |
| `#/alerts/:id` | **Incident Detail** | Original untrusted alert log (with copy), parsed key-value evidence, extracted IOC chips (with instant copy), rule baseline with MITRE ATT&CK candidate mapping, Local AI explanation with live generation timer, interactive verification checklist, false-positive probability, and scoped follow-up chat. |
| `#/history` | **History & Audit** | Immutable status change log (`New` ➔ `In progress` ➔ `Closed`) and archive of closed alerts with pagination. |
| `#/settings` | **Local Settings** | Toggle switch between Local AI inference and deterministic Rules-only mode, inspect hardware runtime specs, reload 30 simulated alerts (`POST /api/seed`), and customize backend URL. |

---

## 5. Security & Reliability Highlights

1. **Strict XSS Prevention**: All user input, alert logs, and backend-provided text are passed through `escapeHtml()` before rendering to DOM.
2. **Safe Fetch Architecture**: AbortController signals automatically cancel pending network requests when navigating between pages, preventing memory leaks and race conditions.
3. **Graceful Fallbacks**: If the local LLM model is busy, times out, or produces unparseable JSON, the UI surfaces deterministic rule-based output clearly labeled with a warning banner.
4. **Scoped Chat Isolation**: Chat messages are strictly bound to the active incident ID with guardrails against hallucination and out-of-scope queries.
5. **Responsive Design**: Flawlessly adapts across mobile (375px), tablet (768px), and desktop (1024px, 1440px) with off-canvas drawer navigation.
