// MPS Firebase Configuration
// Firebase client credentials are public — safe to commit
const firebaseConfig = {
  apiKey:            "AIzaSyD4PeWraZijDdwOSWogkj7SQjWZSRvJQbY",
  authDomain:        "modular-performance.firebaseapp.com",
  projectId:         "modular-performance",
  storageBucket:     "modular-performance.firebasestorage.app",
  messagingSenderId: "596501615310",
  appId:             "1:596501615310:web:252c59a5039665ebe4769f",
  measurementId:     "G-ZT8QR8VMW6"
};

// Initialize Firebase only once (firebase.apps.length === 0 is the correct guard)
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Enable Firestore offline persistence (fail silently if already enabled)
firebase.firestore().enablePersistence({ synchronizeTabs: true }).catch(function(err) {
  if (err.code !== 'failed-precondition' && err.code !== 'unimplemented') {
    console.warn('[MPS] Persistence error:', err);
  }
});

// Set auth persistence to LOCAL (stay signed in across sessions)
firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(console.warn);

console.log('[MPS] Firebase initialized — project: modular-performance');
