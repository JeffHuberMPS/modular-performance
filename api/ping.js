// Zero-dependency diagnostic endpoint. No npm packages required.
// Tells us: do serverless functions run at all, and which env vars are present.
module.exports = (req, res) => {
  res.status(200).json({
    ok: true,
    node: process.version,
    hasStripeKey:   !!process.env.STRIPE_SECRET_KEY,
    stripeKeyPrefix: (process.env.STRIPE_SECRET_KEY || '').slice(0, 7),
    hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
    hasFirebase:    !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
    hasAppUrl:      !!process.env.APP_URL
  });
};
