@echo off
cd /d "C:\Users\Owner\Documents\Claude\Projects\Modular Performance\modular-performance"
set PAT_URL=https://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@github.com/JeffHuberMPS/modular-performance.git
echo === Staging all changes ===
git add -A
echo === Committing remaining changes ===
git commit -m "Add checkout session API, update hub.html, add batch files" --allow-empty
echo === Force pushing to GitHub ===
git push --force %PAT_URL% main
echo === Done (exit code: %ERRORLEVEL%) ===
pause
