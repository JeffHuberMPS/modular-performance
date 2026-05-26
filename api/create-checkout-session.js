/* ============================================================
   MODULAR PERFORMANCE — CREATE CHECKOUT SESSION
   Vercel Serverless Function: /api/create-checkout-session.js

   Called by billing.js to start a Stripe Checkout session.
   Returns a session ID that the client uses to redirect.
   ============================================================ */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'https://modular-performance.com');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' });

  const { priceId, uid, email, stripeCustomerId, successUrl, cancelUrl } = req.body;

  if (!priceId || !uid) {
    return res.status(400).json({ error: 'Missing priceId or uid' });
  }

  try {
    const sessionParams = {
      mode:                 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url:          successUrl || `${process.env.APP_URL}/hub.html?upgrade=success`,
      cancel_url:           cancelUrl  || `${process.env.APP_URL}/hub.html?upgrade=cancelled`,
      metadata: { uid },
      subscription_data: {
        metadata: { uid },
        // 7-day free trial for all new subscriptions.
        // Only applies to first-time subscribers — Stripe skips the trial
        // if the customer already has or had a subscription.
        trial_period_days: 7
      },
      // Collect payment method upfront even during trial
      payment_method_collection: 'always'
    };

    // Attach existing Stripe customer if we have one.
    // If the customer has already used a trial, Stripe will not grant another.
    if (stripeCustomerId) {
      sessionParams.customer = stripeCustomerId;
    } else if (email) {
      sessionParams.customer_email = email;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    res.status(200).json({ sessionId: session.id });

  } catch (err) {
    console.error('[Checkout] Session creation error:', err);
    res.status(500).json({ error: err.message });
  }
};
