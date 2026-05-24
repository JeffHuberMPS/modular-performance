@echo off
echo ========================================
echo  MPS — Full push with git identity fix
echo ========================================
echo.

cd /d "C:\Users\Owner\Documents\Claude\Projects\Modular Performance\modular-performance"

echo Step 1: Set global git identity...
git config --global user.email "jeffreyhuber86@gmail.com"
git config --global user.name "Jeff Huber"
echo Done.
echo.

echo Step 2: Reset and reinitialize git repo...
rmdir /s /q ".git" 2>nul
git init
git branch -M main
echo Done.
echo.

echo Step 3: Stage all files...
git add -A
echo Done.
echo.

echo Step 4: Commit...
git commit -m "MPS PWA suite — Sessions 1-9 + developer role fix"
echo.

echo Step 5: Set remote...
git remote add origin https://github.com/JeffHuberMPS/modular-performance.git
echo Done.
echo.

echo ========================================
echo  Pushing to GitHub...
echo  A browser window may open for sign-in.
echo  Sign in to GitHub if prompted.
echo ========================================
echo.

git push -f origin main

echo.
if %ERRORLEVEL% EQU 0 (
  echo SUCCESS! Vercel will auto-deploy in ~60 seconds.
) else (
  echo ERROR - see output above.
)

echo ========================================
pause
