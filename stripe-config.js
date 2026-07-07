// MPS Stripe Configuration
// PUBLIC KEY: Get from Stripe Dashboard → Developers → API Keys → Publishable key
// Then replace STRIPE_PUBLIC_KEY_PLACEHOLDER below with the actual pk_test_... value
//
// MPS is one unified app with three tiers: Core (free), Elite, Premium.
// Tiers differ by features, limits, and theme — not by which trackers you can open.

window.STRIPE_CONFIG = (function() {

  const IS_TEST_MODE = false;

  // ── Publishable keys (safe to expose — these are public) ────
  const KEYS = {
    test: 'pk_test_51TaiYOJr8jtgHpa2adUHk5InaoBQ4ik29TPAWYtNRABP3LPwdV9AyzYoR4fOrrSTi6W1jnT34xdUv1dxcwR88Ryp00CN408axu',  // MPS test publishable key (public — safe in client code)
    live: 'pk_live_51TaiY8QswWRvVfC8HYlTeUy7XrlIcp9y3uWG6RvGFUWPPZH7lTp76E2xEhaxGRmmJ8LxXaTvoRpZ9Y1UAqlZW9gN00RtvKCBQL'
  };

  // ── Price IDs (from Stripe Dashboard → Products) ────────────
  // Reuses the existing test products until Stripe is rebuilt for the 3-tier model.
  const PRICE_IDS = {
    test: {
      elite_monthly:   'price_1TkspjJr8jtgHpa2rOuM2N3D',   // $5.99/mo
      premium_monthly: 'price_1TkssoJr8jtgHpa2vOUnv9Um',   // $14.99/mo
      elite_onetime:   'price_1TksrAJr8jtgHpa24nsz1lRM',   // $49 once
      premium_onetime: 'price_1TkstIJr8jtgHpa2N2LL5KSR'    // $99 once
    },
    live: {
      elite_monthly:   'price_1Tm1QDQswWRvVfC8EApuHW2N',   // $9.99/mo
      premium_monthly: 'price_1Tm1QDQswWRvVfC8ZN3f6u3G',   // $19.99/mo
      elite_onetime:   'price_1Tmu74QswWRvVfC8Ya0P6oX9',   // $299 once
      premium_onetime: 'price_1Tm1QEQswWRvVfC8WMFOLP3R'    // $499 once
    }
  };

  // ── Plan definitions (3 tiers) ───────────────────────────────
  const PLANS = {
    core: {
      name:          'MPS Core',
      tagline:       'All five trackers, free — with sensible daily limits.',
      monthly_price: 0,
      onetime_price: 0,
      monthly_id:    null,
      onetime_id:    null
    },
    elite: {
      name:          'MPS Elite',
      tagline:       'Everything unlimited — full history, stats & insights.',
      monthly_price: 9.99,
      onetime_price: 49,
      monthly_id:    IS_TEST_MODE ? PRICE_IDS.test.elite_monthly  : PRICE_IDS.live.elite_monthly,
      onetime_id:    IS_TEST_MODE ? PRICE_IDS.test.elite_onetime  : PRICE_IDS.live.elite_onetime
    },
    premium: {
      name:          'MPS Premium',
      tagline:       'Elite, plus the colorful theme, priority insights & every future release.',
      monthly_price: 19.99,
      onetime_price: 99,
      monthly_id:    IS_TEST_MODE ? PRICE_IDS.test.premium_monthly : PRICE_IDS.live.premium_monthly,
      onetime_id:    IS_TEST_MODE ? PRICE_IDS.test.premium_onetime : PRICE_IDS.live.premium_onetime
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
