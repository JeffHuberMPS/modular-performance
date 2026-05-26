// MPS Stripe Configuration
// PUBLIC KEY: Get from Stripe Dashboard → Developers → API Keys → Publishable key
// Then replace STRIPE_PUBLIC_KEY_PLACEHOLDER below with the actual pk_test_... value

window.STRIPE_CONFIG = (function() {

  const IS_TEST_MODE = true;

  // ── Publishable keys (safe to expose — these are public) ────
  const KEYS = {
    test: 'pk_test_REPLACE_WITH_YOUR_PUBLISHABLE_KEY',  // TODO: add from Stripe Dashboard
    live: 'pk_live_REPLACE_WITH_YOUR_LIVE_KEY'
  };

  // ── Price IDs (from Stripe Dashboard → Products) ────────────
  // ── Real Stripe price IDs (test mode) ───────────────────────
  const PRICE_IDS = {
    test: {
      single_monthly:     'price_1TaiqfJr8jtgHpa2SJ8RntRZ',
      duo_monthly:        'price_1TaiuXJr8jtgHpa2mWoHzNVE',
      trio_monthly:       'price_1TaiwWJr8jtgHpa2HFVCbAsh',
      allaccess_monthly:  'price_1TaiyeJr8jtgHpa2m5vQyVZE',
      single_annual:      'price_1TailiJr8jtgHpa2FIJYkQAY',
      duo_annual:         'price_1TaiutJr8jtgHpa2gXVZ88jW',
      trio_annual:        'price_1TaiwmJr8jtgHpa2lvxDKbFN',
      allaccess_annual:   'price_1TaiywJr8jtgHpa25aUsmXnP'
    },
    live: {
      single_monthly:     'price_single_monthly_live',
      duo_monthly:        'price_duo_monthly_live',
      trio_monthly:       'price_trio_monthly_live',
      allaccess_monthly:  'price_allaccess_monthly_live',
      single_annual:      'price_single_annual_live',
      duo_annual:         'price_duo_annual_live',
      trio_annual:        'price_trio_annual_live',
      allaccess_annual:   'price_allaccess_annual_live'
    }
  };

  // ── Plan definitions ─────────────────────────────────────────
  const PLANS = {
    single: {
      name:          'MPS Single',
      apps:          1,
      monthly_price: 5.99,
      annual_price:  59,
      annual_saving: 12.88,
      monthly_id:    IS_TEST_MODE ? PRICE_IDS.test.single_monthly : PRICE_IDS.live.single_monthly,
      annual_id:     IS_TEST_MODE ? PRICE_IDS.test.single_annual  : PRICE_IDS.live.single_annual
    },
    duo: {
      name:          'MPS Duo',
      apps:          2,
      monthly_price: 9.99,
      annual_price:  99,
      annual_saving: 20.88,
      monthly_id:    IS_TEST_MODE ? PRICE_IDS.test.duo_monthly : PRICE_IDS.live.duo_monthly,
      annual_id:     IS_TEST_MODE ? PRICE_IDS.test.duo_annual  : PRICE_IDS.live.duo_annual
    },
    trio: {
      name:          'MPS Trio',
      apps:          3,
      monthly_price: 14.99,
      annual_price:  149,
      annual_saving: 30.88,
      monthly_id:    IS_TEST_MODE ? PRICE_IDS.test.trio_monthly : PRICE_IDS.live.trio_monthly,
      annual_id:     IS_TEST_MODE ? PRICE_IDS.test.trio_annual  : PRICE_IDS.live.trio_annual
    },
    allaccess: {
      name:          'MPS All-Access',
      apps:          5,
      monthly_price: 21.99,
      annual_price:  215,
      annual_saving: 48.88,
      monthly_id:    IS_TEST_MODE ? PRICE_IDS.test.allaccess_monthly : PRICE_IDS.live.allaccess_monthly,
      annual_id:     IS_TEST_MODE ? PRICE_IDS.test.allaccess_annual  : PRICE_IDS.live.allaccess_annual
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
