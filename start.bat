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

:: 2. Check and Start Ollama if configured
echo [1/3] Checking Ollama service...
curl -s http://127.0.0.1:11434/api/version >nul 2>&1
if %errorlevel% neq 0 (
    echo Starting Ollama server in background...
    start /B "" ollama serve >nul 2>&1
    ping -n 3 127.0.0.1 >nul
)
curl -s http://127.0.0.1:11434/api/version >nul 2>&1
if %errorlevel% equ 0 (
    echo   - Ollama is running and accessible.
) else (
    echo   - [NOTE] Ollama not detected at 127.0.0.1:11434. Local rule fallback will be used if model is offline.
)

:: 3. Start Backend Server
echo [2/3] Starting Backend API (port 8000)...
start "SOC Copilot Backend" cmd /c "title SOC Copilot Backend && set PYTHONPATH=backend && .venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000"

:: 4. Start Static Frontend Server
echo [3/3] Starting Static Frontend Server (port 5173)...
start "SOC Copilot Frontend" cmd /c "title SOC Copilot Frontend && .venv\Scripts\python.exe -m http.server 5173 --directory HTMLfront"

:: 5. Wait for servers to spin up and launch browser
echo.
echo Waiting for servers to initialize...
ping -n 4 127.0.0.1 >nul

echo Opening application in default browser: http://localhost:5173
start http://localhost:5173

echo.
echo ============================================================
echo SOC Copilot is running!
echo   - Web UI:  http://localhost:5173
echo   - Backend: http://127.0.0.1:8000
echo   - Health:  http://127.0.0.1:8000/health
echo.
echo To stop the application, run stop.bat or close the opened console windows.
echo ============================================================
echo.
pause
