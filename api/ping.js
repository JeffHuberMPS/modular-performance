// Zero-dependency diagnostic endpoint. No npm packages required at load.
module.exports = (req, res) => {
  let stripeLoad, fbLoad;
  try { require('stripe'); stripeLoad = 'OK'; }
  catch (e) { stripeLoad = 'FAIL: ' + e.message; }
  try { require('firebase-admin'); fbLoad = 'OK'; }
  catch (e) { fbLoad = 'FAIL: ' + e.message; }

  res.status(200).json({
    ok: true,
    node: process.version,
    stripeLoad,
    fbLoad,
    hasStripeKey:    !!process.env.STRIPE_SECRET_KEY,
    stripeKeyPrefix: (process.env.STRIPE_SECRET_KEY || '').slice(0, 7),
    hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
    hasFirebase:     !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
    hasAppUrl:       !!process.env.APP_URL
  });
};
