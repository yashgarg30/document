# Start all services for MERN OCR prototype (Windows PowerShell)
# This script opens separate PowerShell windows for infra, backend, worker and frontend.
# Run this from the repository root with: .\start-all.ps1

$repo = Split-Path -Parent $MyInvocation.MyCommand.Definition

# Start infra (docker-compose)
Start-Process powershell -ArgumentList "-NoExit","-Command","cd `"$repo\infra`"; docker-compose up"

# Start backend
Start-Process powershell -ArgumentList "-NoExit","-Command","cd `"$repo\backend`"; npm install; node src/server.js"

# Start worker
Start-Process powershell -ArgumentList "-NoExit","-Command","cd `"$repo\backend`"; npm run worker || node src/ocr/worker.js"

# Start frontend
Start-Process powershell -ArgumentList "-NoExit","-Command","cd `"$repo\frontend`"; npm install; npm start"

Write-Output "Started infra, backend, worker and frontend in new windows. Monitor each window for logs."