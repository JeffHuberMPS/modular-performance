@echo off
cd /d "C:\Users\Owner\Documents\Claude\Projects\Modular Performance\modular-performance"
echo === Pushing to GitHub with PAT ===
git push https://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@github.com/JeffHuberMPS/modular-performance.git main
echo === Done (exit code: %ERRORLEVEL%) ===
pause
