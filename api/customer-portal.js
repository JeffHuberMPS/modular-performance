/* ============================================================
   MODULAR PERFORMANCE — CUSTOMER PORTAL
   Vercel Serverless Function: /api/customer-portal.js

   Opens the Stripe Customer Portal for subscription
   management and cancellation.
   ============================================================ */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://modular-performance.com');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' });

  const { customerId, returnUrl } = req.body;

  if (!customerId) {
    return res.status(400).json({ error: 'Missing customerId' });
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer:   customerId,
      return_url: returnUrl || `${process.env.APP_URL}/billing.html`
    });

    res.status(200).json({ url: session.url });

  } catch (err) {
    console.error('[Portal] Error:', err);
    res.status(500).json({ error: err.message });
  }
};
