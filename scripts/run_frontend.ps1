$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath (Join-Path (Split-Path -Parent $PSScriptRoot) 'HTMLfront')
Write-Host "Starting static frontend HTTP server on port 5173..." -ForegroundColor Cyan
Write-Host "URL: http://localhost:5173" -ForegroundColor Green
& python.exe -m http.server 5173
exit $LASTEXITCODE
