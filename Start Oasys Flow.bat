@echo off
cd /d "%~dp0"
start "Oasys Flow Server" cmd /k python -m http.server 5173
timeout /t 2 /nobreak >nul
start "" http://localhost:5173
