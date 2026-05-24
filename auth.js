// MPS Auth Logic — used by auth.html
// Firebase is already initialized via firebase-config.js

window.MPS_AUTH = (function() {

  // ── Create or fetch user doc in Firestore ──────────────────
  async function handlePostSignIn(firebaseUser) {
    const db  = firebase.firestore();
    const uid = firebaseUser.uid;
    const ref = db.collection('users').doc(uid);

    try {
      const snap = await ref.get();

      // Developer email list — these accounts always get full access
      const DEVELOPER_EMAILS = ['jeffreyhuber86@gmail.com'];
      const isDev = DEVELOPER_EMAILS.includes((firebaseUser.email || '').toLowerCase());

      if (!snap.exists) {
        // New user — create document (developer accounts get role + billing_bypass)
        await ref.set({
          uid,
          email:              firebaseUser.email || '',
          name:               firebaseUser.displayName || 'Athlete',
          photo:              firebaseUser.photoURL || '',
          role:               isDev ? 'developer' : 'user',
          tier:               isDev ? 'all-access' : 'single',
          apps:               isDev ? ['workout','habits','sleep','expenses','journal'] : ['workout'],
          billing_bypass:     isDev,
          stripe_customer_id: null,
          created:            firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log('[MPS] New user document created', isDev ? '(DEVELOPER)' : '');
      } else {
        // Existing user — ensure developer accounts always have correct flags
        if (isDev) {
          const data = snap.data();
          if (data.role !== 'developer' || !data.billing_bypass) {
            await ref.update({
              role:           'developer',
              billing_bypass: true,
              tier:           'all-access',
              apps:           ['workout','habits','sleep','expenses','journal']
            });
            console.log('[MPS] Developer flags applied to existing account');
          }
        }
        console.log('[MPS] Existing user — welcome back');
      }

      // Redirect to hub
      window.location.replace('/hub.html');
    } catch (err) {
      console.error('[MPS] handlePostSignIn error:', err);
      // Still redirect — Firestore write can be retried later
      window.location.replace('/hub.html');
    }
  }

  // ── Google sign-in ─────────────────────────────────────────
  async function signInWithGoogle() {
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');
      const result = await firebase.auth().signInWithPopup(provider);
      await handlePostSignIn(result.user);
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
        console.error('[MPS] Google sign-in error:', err);
        throw err;
      }
    }
  }

  // ── Apple sign-in ──────────────────────────────────────────
  async function signInWithApple() {
    try {
      const provider = new firebase.auth.OAuthProvider('apple.com');
      provider.addScope('email');
      provider.addScope('name');
      const result = await firebase.auth().signInWithPopup(provider);
      await handlePostSignIn(result.user);
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
        console.error('[MPS] Apple sign-in error:', err);
        throw err;
      }
    }
  }

  // ── Phone sign-in ──────────────────────────────────────────
  let confirmationResult = null;

  function initRecaptcha(containerId) {
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
    }
    window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier(containerId, {
      size: 'invisible',
      callback: () => {}
    });
  }

  async function sendPhoneSMS(phoneNumber, containerId) {
    initRecaptcha(containerId);
    confirmationResult = await firebase.auth().signInWithPhoneNumber(
      phoneNumber,
      window.recaptchaVerifier
    );
    return confirmationResult;
  }

  async function verifyPhoneCode(code) {
    if (!confirmationResult) throw new Error('No confirmation result — send SMS first');
    const result = await confirmationResult.confirm(code);
    await handlePostSignIn(result.user);
  }

  // ── Sign out ───────────────────────────────────────────────
  async function signOut() {
    await firebase.auth().signOut();
    window.location.replace('/landing.html');
  }

  // ── Auth state listener ────────────────────────────────────
  function onAuthReady(callback) {
    return firebase.auth().onAuthStateChanged(callback);
  }

  return { signInWithGoogle, signInWithApple, sendPhoneSMS, verifyPhoneCode, signOut, onAuthReady };
})();
