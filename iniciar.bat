@echo off
setlocal
cd /d "%~dp0"

if not exist ".venv\Scripts\python.exe" (
  echo Preparing the application for first use...
  python -m venv .venv
  if errorlevel 1 goto :error
  call ".venv\Scripts\activate.bat"
) else (
  call ".venv\Scripts\activate.bat"
)

python -c "import pdfplumber, pypdf, reportlab, openpyxl" >nul 2>&1
if errorlevel 1 (
  echo Updating application components...
  python -m pip install -r requirements.txt
  if errorlevel 1 goto :error
)

python app.py
goto :eof

:error
echo.
echo The application could not start. Make sure Python can access the Internet during the first installation.
pause
exit /b 1
