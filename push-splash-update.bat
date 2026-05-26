@echo off
echo =========================================
echo  MPS — Force Push Splash Update
echo =========================================

cd /d "%~dp0"

:: Remove ALL stale git locks
if exist ".git\index.lock" del /f ".git\index.lock"
if exist ".git\HEAD.lock"  del /f ".git\HEAD.lock"

:: Stage everything uncommitted
git add -A

:: Commit any remaining changes (skip if nothing to commit)
git commit -m "Splash screen update + cleanup" 2>nul

:: Force push — overrides remote with our correct local version
git push --force origin main

echo.
echo =========================================
echo  Done! Vercel redeploys in ~60s.
echo  Visit modular-performance.com to test.
echo =========================================
pause
