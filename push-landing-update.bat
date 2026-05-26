@echo off
cd /d "%~dp0"
del /f ".git\index.lock" 2>nul
del /f ".git\HEAD.lock" 2>nul
git add -A
git commit -m "Premium branded app headers on landing page + splash screen polish"
git push --force origin main
pause
