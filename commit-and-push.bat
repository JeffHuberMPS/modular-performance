@echo off
cd /d "C:\Users\Owner\Documents\Claude\Projects\Modular Performance\modular-performance"
echo === Staging changes ===
git add stripe-config.js api/webhook.js firestore.rules
git status
echo === Committing ===
git commit -m "Wire real Stripe price IDs, Firebase security rules, FIREBASE_SERVICE_ACCOUNT_JSON"
echo === Pushing to GitHub ===
git push origin main
echo === Done ===
pause
