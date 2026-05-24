# Modular Performance (MPS)

> Every system. One platform. Built for the ones who don't quit.

---

## What This Is

MPS is a PWA suite of 5 tracking apps — Workout, Habits, Sleep, Expenses, Journal — accessible from a single North Star Hub at **modularperformance.com**.

---

## File Structure

```
modular-performance/
  index.html              — Entry point (redirects to hub or auth)
  hub.html                — North Star Hub dashboard
  landing.html            — Marketing landing page (unauthenticated)
  auth.html               — Sign-in page
  billing.html            — Plan & billing management
  manifest.json           — PWA manifest
  service-worker.js       — Offline support + auto-update
  firebase-config.js      — Firebase init (fill in your credentials)
  stripe-config.js        — Stripe price IDs (fill in after Stripe setup)
  auth.js                 — Firebase auth helpers
  billing.js              — Stripe checkout & portal helpers
  vercel.json             — Vercel deploy config
  package.json            — Node deps for serverless functions

  /api/
    webhook.js                    — Stripe webhook handler
    create-checkout-session.js    — Stripe Checkout session creator
    customer-portal.js            — Stripe customer portal redirect

  /apps/
    /workout/   index.html + workout.js + workout.css
    /habits/    index.html + habits.js  + habits.css
    /sleep/     index.html + sleep.js   + sleep.css
    /expenses/  index.html + expenses.js + expenses.css
    /journal/   index.html + journal.js  + journal.css

  /shared/
    styles.css      — All CSS variables + utility classes
    firebase.js     — All Firestore CRUD helpers
    auth-guard.js   — Route protection for app pages
    components.js   — Shared UI components

  /assets/
    /icons/     App icons (192px, 512px, etc.)
    /fonts/     (optional local fonts)
```

---

## Deploy Checklist

### 1. Firebase Setup
- [ ] Create project at console.firebase.google.com
- [ ] Enable Auth: Google, Apple, Phone
- [ ] Create Firestore database (production mode)
- [ ] Copy web app config → paste into `firebase-config.js`
- [ ] Add `modularperformance.com` to Authorized Domains
- [ ] Generate service account key → save as `firebase-service-account.json` (do NOT commit)

### 2. Stripe Setup
- [ ] Create products in Stripe Dashboard (see `stripe-config.js` for all 8 price IDs)
- [ ] Copy price IDs → paste into `stripe-config.js`
- [ ] Enable Customer Portal in Stripe settings
- [ ] Note publishable key (test + live) → add to `stripe-config.js`

### 3. Vercel Deploy
- [ ] Push repo to GitHub
- [ ] Import repo in Vercel
- [ ] Set env vars in Vercel dashboard:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `FIREBASE_SERVICE_ACCOUNT_JSON` (paste the full JSON string)
  - `APP_URL` = `https://modularperformance.com`
- [ ] Deploy

### 4. Connect Domain
- [ ] In Vercel: Project → Domains → Add `modularperformance.com`
- [ ] In Squarespace Domains: DNS settings → add Vercel's A + CNAME records
- [ ] Wait 10-30 minutes for propagation

### 5. Stripe Webhooks
- [ ] Stripe Dashboard → Developers → Webhooks
- [ ] Add endpoint: `https://modularperformance.com/api/webhook`
- [ ] Events: `checkout.session.completed`, `customer.subscription.deleted`, `customer.subscription.updated`, `invoice.payment_failed`
- [ ] Copy signing secret → add to Vercel as `STRIPE_WEBHOOK_SECRET`

### 6. Verify
- [ ] Landing page loads at modularperformance.com
- [ ] Google sign-in works
- [ ] Hub loads with correct tiles
- [ ] Workout tab opens and logs save to Firestore
- [ ] Locked tile shows upgrade prompt
- [ ] Dev panel visible only on Jeff's account
- [ ] Install banner appears on second visit
- [ ] App installs to home screen (no Chrome UI)
- [ ] Stripe test checkout works (card 4242 4242 4242 4242)
- [ ] Webhook fires, Firestore tier updates correctly

---

## Dev Bypass

Jeff's account in Firestore:
```json
{
  "role": "developer",
  "billing_bypass": true
}
```
This unlocks all apps regardless of tier. The dev panel appears at bottom-left of hub.

---

## Brand Rules
- **NO orange anywhere** (amber #d97706 replaced by slate cyan #155e75 for Conditioning badge)
- **NO white backgrounds**
- **NO browser confirm() or prompt()** — div overlays only
- **NO rounded bars** on Chart.js charts
- Bebas Neue for all display headings
- Black + Yellow (#FFC107) for North Star Hub only
