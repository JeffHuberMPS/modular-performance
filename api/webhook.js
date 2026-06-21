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
      Add endpoint: https://modular-performance.com/api/webhook
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

/* ── Raw body for Stripe signature verification ──────────────────
   Stripe verifies the webhook against the EXACT raw request bytes. Vercel
   parses JSON bodies by default, which corrupts that check (→ 400 on every
   event), so we disable the parser (see module.exports.config at the bottom)
   and read the raw stream ourselves.
   ⚠️ VERIFY with a Stripe test webhook (Stripe CLI / Dashboard "Send test event")
      before going live — confirm it returns 200, not 400. */
async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  return Buffer.concat(chunks);
}

/* ── Tier → Apps mapping ─────────────────────────────────────── */
// MPS is now ONE unified app: every tier unlocks all five trackers.
// Tiers (Core / Elite / Premium) differ by features, limits, and theme — not by
// which trackers you can open.
const ALL_TRACKERS = ['workout', 'habits', 'sleep', 'expenses', 'journal'];
const TIER_APPS = {
  core:    ALL_TRACKERS,
  elite:   ALL_TRACKERS,
  premium: ALL_TRACKERS
};

/* ── Price ID → Tier mapping ─────────────────────────────────── */
// Maps the current test price IDs onto the 3-tier model. (Stripe products will be
// rebuilt for Core/Elite/Premium when Stripe is wired; keys default to 'core'.)
const PRICE_TIER_MAP = {
  // Monthly (test)
  'price_1TaiqfJr8jtgHpa2SJ8RntRZ': 'elite',
  'price_1TaiuXJr8jtgHpa2mWoHzNVE': 'elite',
  'price_1TaiwWJr8jtgHpa2HFVCbAsh': 'elite',
  'price_1TaiyeJr8jtgHpa2m5vQyVZE': 'premium',
  // Annual (test)
  'price_1TailiJr8jtgHpa2FIJYkQAY': 'elite',
  'price_1TaiutJr8jtgHpa2gXVZ88jW': 'elite',
  'price_1TaiwmJr8jtgHpa2lvxDKbFN': 'elite',
  'price_1TaiywJr8jtgHpa25aUsmXnP': 'premium',
};

function tierFromPriceId(priceId) {
  return PRICE_TIER_MAP[priceId] || 'core';
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
    // Verify the webhook came from Stripe — uses the RAW body, not req.body
    const rawBody = await readRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, secret);
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
        const uid     = session.metadata?.uid;

        if (!uid) {
          console.warn('[Webhook] No UID in checkout session metadata');
          break;
        }

        // tier from metadata is the source of truth (set when the session was created);
        // fall back to the price→tier map only if it's missing.
        let tier        = session.metadata?.tier || 'core';
        let trialEnd    = null;
        let trialActive = false;
        let lifetime    = false;

        if (session.mode === 'subscription' && session.subscription) {
          // Monthly plan
          const sub     = await stripe.subscriptions.retrieve(session.subscription);
          const priceId = sub.items.data[0]?.price?.id;
          if (!session.metadata?.tier) tier = tierFromPriceId(priceId);
          if (sub.trial_end) {
            trialEnd    = admin.firestore.Timestamp.fromMillis(sub.trial_end * 1000);
            trialActive = sub.trial_end > Math.floor(Date.now() / 1000);
          }
        } else if (session.mode === 'payment') {
          // One-time purchase → lifetime access, no recurring billing.
          lifetime = true;
          if (!session.metadata?.tier) {
            try {
              const items = await stripe.checkout.sessions.listLineItems(session.id, { limit: 1 });
              tier = tierFromPriceId(items.data[0]?.price?.id);
            } catch (e) { /* keep metadata/core */ }
          }
        }

        await db.collection('users').doc(uid).update({
          tier:               tier,
          apps:               TIER_APPS[tier] || ALL_TRACKERS,
          stripe_customer_id: session.customer,
          payment_failed:     false,
          lifetime:           lifetime,
          trial_end:          trialEnd,
          trial_active:       trialActive,
          trial_ending_soon:  false,
          updated_at:         admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`[Webhook] Upgraded user ${uid} to ${tier}${lifetime ? ' (lifetime)' : trialActive ? ' (trial)' : ''}`);
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

        // Lifetime (one-time) buyers keep their tier even if an old subscription is cancelled.
        if (snap.docs[0].data().lifetime === true) {
          console.log('[Webhook] Sub cancelled but user has lifetime access — keeping tier for:', customer);
          break;
        }

        const userRef = snap.docs[0].ref;
        await userRef.update({
          tier:       'core',          // cancelled → drops to the free Core tier (keeps the app)
          apps:       ALL_TRACKERS,
          updated_at: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log('[Webhook] Subscription cancelled for customer:', customer);
        break;
      }

      /* ── Subscription updated → adjust tier + clear trial ── */
      case 'customer.subscription.updated': {
        const sub      = event.data.object;
        const customer = sub.customer;
        const priceId  = sub.items.data[0]?.price?.id;
        const tier     = tierFromPriceId(priceId);

        // Detect trial-to-paid conversion: status changed from 'trialing' to 'active'
        const prevStatus = event.data.previous_attributes?.status;
        const nowStatus  = sub.status;
        const trialConverted = prevStatus === 'trialing' && nowStatus === 'active';

        const snap = await db.collection('users')
          .where('stripe_customer_id', '==', customer).limit(1).get();

        if (!snap.empty) {
          const updateData = {
            tier:       tier,
            apps:       TIER_APPS[tier] || ALL_TRACKERS,
            updated_at: admin.firestore.FieldValue.serverTimestamp()
          };

          // Clear trial flags when trial converts to paid
          if (trialConverted) {
            updateData.trial_active      = false;
            updateData.trial_ending_soon = false;
            console.log('[Webhook] Trial converted to paid for customer:', customer);
          }

          await snap.docs[0].ref.update(updateData);
          console.log('[Webhook] Updated tier to', tier, 'for customer:', customer);
        }
        break;
      }

      /* ── Trial ending soon (fires 3 days before trial ends) ─ */
      case 'customer.subscription.trial_will_end': {
        const sub      = event.data.object;
        const customer = sub.customer;

        const snap = await db.collection('users')
          .where('stripe_customer_id', '==', customer).limit(1).get();

        if (!snap.empty) {
          await snap.docs[0].ref.update({
            trial_ending_soon: true,
            updated_at:        admin.firestore.FieldValue.serverTimestamp()
          });
          console.log('[Webhook] Trial ending soon for customer:', customer);
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

// Tell Vercel NOT to parse the request body — Stripe signature verification
// needs the raw bytes (read via readRawBody above).
module.exports.config = { api: { bodyParser: false } };
