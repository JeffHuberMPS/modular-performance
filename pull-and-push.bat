@echo off
cd /d "C:\Users\Owner\Documents\Claude\Projects\Modular Performance\modular-performance"
set PAT_URL=https://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@github.com/JeffHuberMPS/modular-performance.git
echo === Pulling remote changes (rebase) ===
git pull --rebase %PAT_URL% main
echo === Pushing to GitHub ===
git push %PAT_URL% main
echo === Done (exit code: %ERRORLEVEL%) ===
pause
