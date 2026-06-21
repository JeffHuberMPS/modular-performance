// MPS Stripe Configuration
// PUBLIC KEY: Get from Stripe Dashboard → Developers → API Keys → Publishable key
// Then replace STRIPE_PUBLIC_KEY_PLACEHOLDER below with the actual pk_test_... value
//
// MPS is one unified app with three tiers: Core (free), Elite, Premium.
// Tiers differ by features, limits, and theme — not by which trackers you can open.

window.STRIPE_CONFIG = (function() {

  const IS_TEST_MODE = true;

  // ── Publishable keys (safe to expose — these are public) ────
  const KEYS = {
    test: 'pk_test_51TaiYOJr8jtgHpa2adUHk5InaoBQ4ik29TPAWYtNRABP3LPwdV9AyzYoR4fOrrSTi6W1jnT34xdUv1dxcwR88Ryp00CN408axu',  // MPS test publishable key (public — safe in client code)
    live: 'pk_live_REPLACE_WITH_YOUR_LIVE_KEY'
  };

  // ── Price IDs (from Stripe Dashboard → Products) ────────────
  // Reuses the existing test products until Stripe is rebuilt for the 3-tier model.
  const PRICE_IDS = {
    test: {
      elite_monthly:   'price_1TaiqfJr8jtgHpa2SJ8RntRZ',
      premium_monthly: 'price_1TaiyeJr8jtgHpa2m5vQyVZE',
      elite_annual:    'price_1TailiJr8jtgHpa2FIJYkQAY',
      premium_annual:  'price_1TaiywJr8jtgHpa25aUsmXnP'
    },
    live: {
      elite_monthly:   'price_elite_monthly_live',
      premium_monthly: 'price_premium_monthly_live',
      elite_annual:    'price_elite_annual_live',
      premium_annual:  'price_premium_annual_live'
    }
  };

  // ── Plan definitions (3 tiers) ───────────────────────────────
  const PLANS = {
    core: {
      name:          'MPS Core',
      tagline:       'All five trackers, free — with sensible daily limits.',
      monthly_price: 0,
      annual_price:  0,
      monthly_id:    null,
      annual_id:     null
    },
    elite: {
      name:          'MPS Elite',
      tagline:       'Everything unlimited — full history, stats & insights.',
      monthly_price: 5.99,
      annual_price:  59,
      monthly_id:    IS_TEST_MODE ? PRICE_IDS.test.elite_monthly : PRICE_IDS.live.elite_monthly,
      annual_id:     IS_TEST_MODE ? PRICE_IDS.test.elite_annual  : PRICE_IDS.live.elite_annual
    },
    premium: {
      name:          'MPS Premium',
      tagline:       'Elite, plus the colorful theme, priority insights & every future release.',
      monthly_price: 14.99,
      annual_price:  149,
      monthly_id:    IS_TEST_MODE ? PRICE_IDS.test.premium_monthly : PRICE_IDS.live.premium_monthly,
      annual_id:     IS_TEST_MODE ? PRICE_IDS.test.premium_annual  : PRICE_IDS.live.premium_annual
    }
  };

  // ── Get Stripe instance ──────────────────────────────────────
  function getStripe() {
    const key = IS_TEST_MODE ? KEYS.test : KEYS.live;
    if (!key || key.includes('REPLACE')) {
      console.error('[MPS] Stripe publishable key not set — update stripe-config.js');
      return null;
    }
    if (!window._stripeInstance) {
      window._stripeInstance = Stripe(key);
    }
    return window._stripeInstance;
  }

  return {
    isTestMode: IS_TEST_MODE,
    publicKey:  IS_TEST_MODE ? KEYS.test : KEYS.live,
    plans:      PLANS,
    priceIds:   IS_TEST_MODE ? PRICE_IDS.test : PRICE_IDS.live,
    getStripe
  };
})();
