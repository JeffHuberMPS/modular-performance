@echo off
echo ========================================
echo  MPS — Push auth.js developer role fix
echo ========================================
echo.

cd /d "C:\Users\Owner\Documents\Claude\Projects\Modular Performance\modular-performance"

echo Configuring git identity...
git config user.email "jeffreyhuber86@gmail.com"
git config user.name "Jeff Huber"

echo Adding auth.js...
git add auth.js

echo Committing...
git commit -m "Auth: auto-assign developer role for jeffreyhuber86@gmail.com on sign-in"

echo.
echo ========================================
echo  Pushing to GitHub...
echo  Sign in if prompted.
echo ========================================
echo.

git push origin main

echo.
echo ========================================
echo  DONE! Check above for result.
echo  Vercel will auto-deploy in ~60 seconds.
echo ========================================
pause
