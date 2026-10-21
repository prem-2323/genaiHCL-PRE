@echo off
title Stop SOC Copilot
echo ============================================================
echo           Stopping SOC Copilot Services
echo ============================================================
echo.

echo Stopping backend on port 8000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo Stopping frontend on port 5173...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo Services stopped.
ping -n 2 127.0.0.1 >nul
