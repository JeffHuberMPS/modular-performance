@echo off
echo ========================================
echo  MPS — Push to GitHub
echo ========================================
echo.

cd /d "C:\Users\Owner\Documents\Claude\Projects\Modular Performance\modular-performance"

echo Cleaning old git data...
rmdir /s /q ".git" 2>nul

echo Initializing repo...
git init
git branch -M main

echo Adding files...
git add -A

echo Committing...
git commit -m "Initial commit: MPS PWA suite — Sessions 1-9"

echo Setting remote...
git remote add origin https://github.com/JeffHuberMPS/modular-performance.git

echo.
echo ========================================
echo  Pushing to GitHub...
echo  A browser window may open for sign-in.
echo  Sign in to GitHub if prompted.
echo ========================================
echo.

git push -u origin main

echo.
echo ========================================
echo  DONE! Check above for result.
echo ========================================
pause
