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

  const { priceId, uid, email, tier, mode, stripeCustomerId, successUrl, cancelUrl } = req.body;

  if (!priceId || !uid) {
    return res.status(400).json({ error: 'Missing priceId or uid' });
  }

  // One-time ('payment') vs recurring ('subscription'). Default to subscription.
  const checkoutMode = mode === 'payment' ? 'payment' : 'subscription';

  try {
    const sessionParams = {
      mode:                 checkoutMode,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url:          successUrl || `${process.env.APP_URL}/hub.html?upgrade=success`,
      cancel_url:           cancelUrl  || `${process.env.APP_URL}/hub.html?upgrade=cancelled`,
      // tier rides in metadata so the webhook can set it directly (works for one-time AND subscription)
      metadata: { uid, tier: tier || '' }
    };

    if (checkoutMode === 'subscription') {
      // Monthly plan — 14-day free trial, no card required up front (matches the landing page).
      // Stripe skips the trial if the customer already has/had a subscription.
      sessionParams.subscription_data = {
        metadata: { uid, tier: tier || '' },
        trial_period_days: 14
      };
      sessionParams.payment_method_collection = 'if_required';
    }
    // One-time 'payment' mode: charge now, no trial, lifetime access — nothing extra needed.

    // Attach existing Stripe customer if we have one, else prefill email.
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
