/* ============================================================
   MODULAR PERFORMANCE — BILLING.JS
   Handles Stripe Checkout upgrade flow and billing management.
   Loaded on billing.html and hub.html (for upgrade sheet).
   ============================================================ */

'use strict';

/* ── Start Stripe Checkout ───────────────────────────────────── */
/**
 * Opens Stripe Checkout for the selected plan.
 * @param {string} planId   - 'single' | 'duo' | 'trio' | 'all'
 * @param {string} interval - 'monthly' | 'onetime'
 */
async function startStripeCheckout(planId, interval = 'monthly') {
  const stripe = getStripe();
  if (!stripe) {
    showBillingError('Payment system unavailable. Try again later.');
    return;
  }

  const user = window.__MPS_USER || MPS_Auth.getUserDoc();
  if (!user) {
    window.location.href = '/auth.html';
    return;
  }

  // Pick price ID (test vs live)
  const prefix    = STRIPE_CONFIG.isTestMode ? 'test_' : '';
  const priceKey  = `${prefix}${planId}_${interval}`;
  const priceId   = STRIPE_CONFIG.prices[priceKey];

  if (!priceId || priceId.includes('REPLACE')) {
    showBillingError('Price not configured yet. Set up in stripe-config.js.');
    return;
  }

  setBillingLoading(true);

  try {
    // Create checkout session via backend (Vercel serverless function)
    // The /api/create-checkout-session endpoint is in /api/create-checkout-session.js
    const res = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        priceId,
        uid:               user.uid,
        email:             user.email,
        stripeCustomerId:  user.stripe_customer_id || null,
        successUrl:        STRIPE_CONFIG.successUrl,
        cancelUrl:         STRIPE_CONFIG.cancelUrl
      })
    });

    if (!res.ok) throw new Error(`Checkout session error: ${res.status}`);

    const { sessionId } = await res.json();

    // Redirect to Stripe Checkout
    const { error } = await stripe.redirectToCheckout({ sessionId });
    if (error) throw error;

  } catch (err) {
    setBillingLoading(false);
    console.error('[MPS Billing] Checkout error:', err);
    showBillingError('Could not start checkout. Please try again.');
  }
}

/* ── Open Stripe Customer Portal ─────────────────────────────── */
/**
 * Redirects user to the Stripe billing portal for
 * subscription management, cancellation, invoice history.
 */
async function openCustomerPortal() {
  const user = window.__MPS_USER || MPS_Auth.getUserDoc();
  if (!user || !user.stripe_customer_id) {
    showBillingError('No billing account found.');
    return;
  }

  setBillingLoading(true);

  try {
    const res = await fetch('/api/customer-portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId: user.stripe_customer_id,
        returnUrl:  `${window.location.origin}/billing.html`
      })
    });

    if (!res.ok) throw new Error(`Portal error: ${res.status}`);

    const { url } = await res.json();
    window.location.href = url;

  } catch (err) {
    setBillingLoading(false);
    console.error('[MPS Billing] Portal error:', err);
    showBillingError('Could not open billing portal. Please try again.');
  }
}

/* ── Billing UI Helpers ──────────────────────────────────────── */
function setBillingLoading(show) {
  const el = document.getElementById('billing-loading');
  if (el) el.style.display = show ? 'flex' : 'none';
}

function showBillingError(msg) {
  const el = document.getElementById('billing-error');
  if (el) {
    el.textContent = msg;
    el.style.display = 'block';
    setTimeout(() => (el.style.display = 'none'), 5000);
  } else {
    console.error('[MPS Billing]', msg);
  }
}

/* ── Handle Post-Checkout Redirect ───────────────────────────── */
// Called on hub.html load to check if user just upgraded
(function handleCheckoutReturn() {
  const params = new URLSearchParams(window.location.search);
  const status = params.get('upgrade');

  if (status === 'success') {
    // Clean URL
    window.history.replaceState({}, '', '/hub.html');
    // Refresh user data from Firestore (webhook should have updated it)
    refreshUserDoc().then(() => {
      showGlobalToast('🎉 Welcome to your new plan! App unlocked.');
    });
  } else if (status === 'cancelled') {
    window.history.replaceState({}, '', '/hub.html');
  } else if (status) {
    // Specific app upgrade was attempted
    window.history.replaceState({}, '', '/hub.html');
    // Open upgrade sheet for that app
    if (typeof openUpgradeSheet === 'function') {
      setTimeout(() => openUpgradeSheet(status), 500);
    }
  }
})();

/* ── Refresh User Doc After Payment ─────────────────────────── */
async function refreshUserDoc() {
  const fbUser = firebase.auth().currentUser;
  if (!fbUser) return;

  // Poll up to 5 times to let the webhook propagate
  for (let i = 0; i < 5; i++) {
    try {
      const doc = await firebase.firestore()
        .collection('users').doc(fbUser.uid).get();

      if (doc.exists) {
        window.__MPS_USER = doc.data();
        // Re-render tiles if on the hub
        if (typeof renderTiles === 'function') renderTiles();
        if (typeof renderUser  === 'function') renderUser();
        return;
      }
    } catch (err) {
      console.warn('[MPS Billing] Refresh attempt failed:', err);
    }
    await new Promise(r => setTimeout(r, 1500));
  }
}

/* ── Webhook Handler (serverless) ────────────────────────────── */
// This runs server-side in /api/webhook.js (Vercel serverless).
// The client-side code here is just a reference comment.
//
// Events handled by /api/webhook.js:
//   checkout.session.completed     → update user tier + apps in Firestore
//   customer.subscription.deleted  → lock apps, downgrade tier
//   customer.subscription.updated  → adjust tier if plan changed
//   invoice.payment_failed         → flag user, grace period 3 days
//
// See /api/webhook.js for the full implementation.

/* ── Export ──────────────────────────────────────────────────── */
window.MPS_Billing = {
  startStripeCheckout,
  openCustomerPortal,
  refreshUserDoc
};
