@echo off
setlocal enabledelayedexpansion

title SOC Copilot Launcher
echo ============================================================
echo           Starting Local SOC Incident-Response Copilot
echo ============================================================
echo.

cd /d "%~dp0"

:: 1. Check Virtual Environment
if not exist ".venv\Scripts\python.exe" (
    echo [ERROR] Python virtual environment not found in .venv!
    echo Please create it and install requirements:
    echo   python -m venv .venv
    echo   .venv\Scripts\pip install -r backend\requirements.txt
    pause
    exit /b 1
)

:: 2. Check Frontend node_modules
if not exist "frontend\node_modules" (
    echo [ERROR] Frontend dependencies not found in frontend\node_modules!
    echo Please install dependencies:
    echo   cd frontend ^&^& npm install
    pause
    exit /b 1
)

:: 3. Check and Start Ollama if not running
echo [1/3] Checking Ollama service...
curl -s http://127.0.0.1:11434/api/version >nul 2>&1
if %errorlevel% neq 0 (
    echo Starting Ollama server in background...
    start /B "" ollama serve >nul 2>&1
    ping -n 4 127.0.0.1 >nul
)
curl -s http://127.0.0.1:11434/api/version >nul 2>&1
if %errorlevel% equ 0 (
    echo   - Ollama is running and accessible.
) else (
    echo   - [WARN] Could not reach Ollama at 127.0.0.1:11434.
    echo            Make sure Ollama is installed and running: ollama serve
)

:: 4. Start Backend Server
echo [2/3] Starting Backend API (port 8000)...
start "SOC Copilot Backend" cmd /c "title SOC Copilot Backend && .venv\Scripts\python.exe -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000"

:: 5. Start Frontend Server
echo [3/3] Starting Frontend Vite Server (port 5173)...
start "SOC Copilot Frontend" cmd /c "title SOC Copilot Frontend && cd frontend && npm.cmd run dev"

:: 6. Wait for servers to spin up and launch browser
echo.
echo Waiting for servers to initialize...
ping -n 5 127.0.0.1 >nul

echo Opening application in default browser: http://localhost:5173
start http://localhost:5173

echo.
echo ============================================================
echo SOC Copilot is running!
echo   - Web UI:  http://localhost:5173
echo   - Backend: http://127.0.0.1:8000
echo   - Health:  http://127.0.0.1:8000/health
echo   - Model:   qwen2.5:3b (Ollama)
echo.
echo To stop the application, run stop.bat or close the opened console windows.
echo ============================================================
echo.
pause
