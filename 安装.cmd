@echo off
setlocal DisableDelayedExpansion
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\portable.ps1" -Mode Install %*
set "HUB_EXIT=%errorlevel%"
echo.
if not "%HUB_EXIT%"=="0" echo Installation failed. Read the message above.
pause
exit /b %HUB_EXIT%
