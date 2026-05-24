// MPS Auth Guard — include at top of every protected app page
// Usage: <script src="/shared/auth-guard.js"></script>
//        Then call: MPS_GUARD.protect('workout');
// Requires: firebase-config.js loaded before this script.

window.MPS_GUARD = (function() {

  // Map of app slugs to display names
  const APP_NAMES = {
    workout:  'MPS Workout',
    habits:   'MPS Habits',
    sleep:    'MPS Sleep',
    expenses: 'MPS Expenses',
    journal:  'MPS Journal'
  };

  // ── Protect an app route ────────────────────────────────────
  // appSlug: 'workout' | 'habits' | 'sleep' | 'expenses' | 'journal'
  function protect(appSlug) {
    // Show loading screen while auth resolves
    _showLoader();

    firebase.auth().onAuthStateChanged(async function(user) {
      if (!user) {
        // Not signed in → auth page
        window.location.replace('/auth.html');
        return;
      }

      try {
        const db  = firebase.firestore();
        const uid = user.uid;
        const snap = await db.collection('users').doc(uid).get();
        const data = snap.exists ? snap.data() : {};

        // Developer bypass — all apps unlocked
        if (data.billing_bypass === true) {
          _hideLoader();
          return;
        }

        // Check if app is in user's app list
        const userApps = data.apps || [];
        if (!userApps.includes(appSlug)) {
          // App not unlocked → redirect to hub with upgrade prompt
          window.location.replace('/hub.html?upgrade=' + appSlug);
          return;
        }

        _hideLoader();
      } catch (err) {
        console.error('[MPS Guard] Error fetching user doc:', err);
        // On error, allow access (fail open — Firestore rules enforce security)
        _hideLoader();
      }
    });
  }

  // ── Get current user data ───────────────────────────────────
  async function getCurrentUser() {
    const user = firebase.auth().currentUser;
    if (!user) return null;

    try {
      const snap = await firebase.firestore().collection('users').doc(user.uid).get();
      return snap.exists ? { ...snap.data(), firebaseUser: user } : null;
    } catch (err) {
      console.error('[MPS Guard] getCurrentUser error:', err);
      return null;
    }
  }

  function _showLoader() {
    let el = document.getElementById('mps-guard-loader');
    if (!el) {
      el = document.createElement('div');
      el.id = 'mps-guard-loader';
      el.style.cssText = [
        'position:fixed','inset:0','background:#0a0a0a',
        'display:flex','align-items:center','justify-content:center',
        'z-index:9999','transition:opacity 0.3s ease'
      ].join(';');
      el.innerHTML = '<div style="width:32px;height:32px;border:2px solid rgba(255,255,255,0.1);border-top-color:#FFC107;border-radius:50%;animation:mps-spin 0.7s linear infinite"></div>';
      const style = document.createElement('style');
      style.textContent = '@keyframes mps-spin{to{transform:rotate(360deg)}}';
      document.head.appendChild(style);
      document.body.appendChild(el);
    }
    el.style.display = 'flex';
  }

  function _hideLoader() {
    const el = document.getElementById('mps-guard-loader');
    if (el) {
      el.style.opacity = '0';
      setTimeout(() => { el.style.display = 'none'; }, 300);
    }
  }

  return { protect, getCurrentUser };
})();
