/* ============================================================
   MODULAR PERFORMANCE — STRIPE WEBHOOK HANDLER
   Vercel Serverless Function: /api/webhook.js

   Handles:
     checkout.session.completed     → unlock apps, update tier
     customer.subscription.deleted  → lock apps, downgrade tier
     customer.subscription.updated  → adjust tier
     invoice.payment_failed         → flag account, grace period

   Setup:
   1. Deploy to Vercel
   2. In Stripe Dashboard → Developers → Webhooks:
      Add endpoint: https://modularperformance.com/api/webhook
      Events: select all four above
   3. Copy the signing secret → add to Vercel env vars as STRIPE_WEBHOOK_SECRET
   ============================================================ */

const stripe   = require('stripe')(process.env.STRIPE_SECRET_KEY);
const admin    = require('firebase-admin');

/* ── Initialize Firebase Admin (only once per cold start) ───── */
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
    )
  });
}

const db = admin.firestore();

/* ── Tier → Apps mapping ─────────────────────────────────────── */
const TIER_APPS = {
  single: ['workout'],
  duo:    ['workout', 'habits'],
  trio:   ['workout', 'habits', 'sleep'],
  all:    ['workout', 'habits', 'sleep', 'expenses', 'journal']
};

/* ── Price ID → Tier mapping ─────────────────────────────────── */
// Populate these after creating products in Stripe Dashboard
const PRICE_TIER_MAP = {
  // Monthly
  'price_REPLACE_single_monthly': 'single',
  'price_REPLACE_duo_monthly':    'duo',
  'price_REPLACE_trio_monthly':   'trio',
  'price_REPLACE_all_monthly':    'all',
  // Annual
  'price_REPLACE_single_annual':  'single',
  'price_REPLACE_duo_annual':     'duo',
  'price_REPLACE_trio_annual':    'trio',
  'price_REPLACE_all_annual':     'all',
};

function tierFromPriceId(priceId) {
  return PRICE_TIER_MAP[priceId] || 'single';
}

/* ── Webhook Handler ─────────────────────────────────────────── */
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig     = req.headers['stripe-signature'];
  const secret  = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    // Verify the webhook came from Stripe
    event = stripe.webhooks.constructEvent(req.body, sig, secret);
  } catch (err) {
    console.error('[Webhook] Signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  console.log('[Webhook] Event received:', event.type);

  try {
    switch (event.type) {

      /* ── Successful checkout → unlock apps ──────────────── */
      case 'checkout.session.completed': {
        const session = event.data.object;
        const uid     = session.metadata.uid;

        if (!uid) {
          console.warn('[Webhook] No UID in checkout session metadata');
          break;
        }

        // Get the subscription to determine price/tier
        let tier = 'single';
        if (session.subscription) {
          const sub = await stripe.subscriptions.retrieve(session.subscription);
          const priceId = sub.items.data[0]?.price?.id;
          tier = tierFromPriceId(priceId);
        }

        await db.collection('users').doc(uid).update({
          tier:               tier,
          apps:               TIER_APPS[tier] || ['workout'],
          stripe_customer_id: session.customer,
          payment_failed:     false,
          updated_at:         admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`[Webhook] Upgraded user ${uid} to ${tier}`);
        break;
      }

      /* ── Subscription cancelled → lock apps ─────────────── */
      case 'customer.subscription.deleted': {
        const sub      = event.data.object;
        const customer = sub.customer;

        // Find user by stripe_customer_id
        const snap = await db.collection('users')
          .where('stripe_customer_id', '==', customer).limit(1).get();

        if (snap.empty) {
          console.warn('[Webhook] No user found for customer:', customer);
          break;
        }

        const userRef = snap.docs[0].ref;
        await userRef.update({
          tier:       'none',
          apps:       [],
          updated_at: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log('[Webhook] Subscription cancelled for customer:', customer);
        break;
      }

      /* ── Subscription updated → adjust tier ─────────────── */
      case 'customer.subscription.updated': {
        const sub      = event.data.object;
        const customer = sub.customer;
        const priceId  = sub.items.data[0]?.price?.id;
        const tier     = tierFromPriceId(priceId);

        const snap = await db.collection('users')
          .where('stripe_customer_id', '==', customer).limit(1).get();

        if (!snap.empty) {
          await snap.docs[0].ref.update({
            tier:       tier,
            apps:       TIER_APPS[tier] || ['workout'],
            updated_at: admin.firestore.FieldValue.serverTimestamp()
          });
          console.log('[Webhook] Updated tier to', tier, 'for customer:', customer);
        }
        break;
      }

      /* ── Payment failed → flag + grace period ────────────── */
      case 'invoice.payment_failed': {
        const invoice  = event.data.object;
        const customer = invoice.customer;

        const snap = await db.collection('users')
          .where('stripe_customer_id', '==', customer).limit(1).get();

        if (!snap.empty) {
          // Give 3-day grace period before locking
          const graceEnd = new Date();
          graceEnd.setDate(graceEnd.getDate() + 3);

          await snap.docs[0].ref.update({
            payment_failed:     true,
            payment_grace_ends: admin.firestore.Timestamp.fromDate(graceEnd),
            updated_at:         admin.firestore.FieldValue.serverTimestamp()
          });
          console.log('[Webhook] Payment failed, grace period set for customer:', customer);
        }
        break;
      }

      default:
        console.log('[Webhook] Unhandled event type:', event.type);
    }

    res.status(200).json({ received: true });

  } catch (err) {
    console.error('[Webhook] Handler error:', err);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
};
