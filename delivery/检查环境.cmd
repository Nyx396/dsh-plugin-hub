@echo off
setlocal DisableDelayedExpansion
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\portable.ps1" -Mode Check %*
set "HUB_EXIT=%errorlevel%"
echo.
pause
exit /b %HUB_EXIT%
