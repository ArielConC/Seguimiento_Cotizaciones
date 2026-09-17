@echo off
setlocal
cd /d "%~dp0"
set "NT_QUOTE_NO_BROWSER=1"
set "NT_QUOTE_HOST=0.0.0.0"

if not exist ".venv\Scripts\python.exe" (
  echo Run iniciar.bat once to install the application components.
  exit /b 1
)

call ".venv\Scripts\activate.bat"
python app.py
