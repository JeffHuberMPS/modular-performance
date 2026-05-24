// MPS Firebase CRUD Helpers (Session 6)
// Requires: firebase-config.js loaded first
// Usage: import via <script src="/shared/firebase.js"></script>
//        then call MPS_DB.saveWorkoutDay(uid, '2026-05-24', {...})

window.MPS_DB = (function() {

  function db()   { return firebase.firestore(); }
  function auth() { return firebase.auth(); }

  // ── Generic CRUD ────────────────────────────────────────────

  async function saveDoc(collection, docId, data) {
    const uid = auth().currentUser?.uid;
    if (!uid) throw new Error('Not authenticated');
    await db().collection('users').doc(uid).collection(collection).doc(docId).set(data, { merge: true });
  }

  async function getDoc(collection, docId) {
    const uid = auth().currentUser?.uid;
    if (!uid) return null;
    const snap = await db().collection('users').doc(uid).collection(collection).doc(docId).get();
    return snap.exists ? snap.data() : null;
  }

  async function queryDocs(collection, filters) {
    const uid = auth().currentUser?.uid;
    if (!uid) return [];
    let ref = db().collection('users').doc(uid).collection(collection);
    if (filters) {
      filters.forEach(([field, op, val]) => { ref = ref.where(field, op, val); });
    }
    const snap = await ref.get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  async function deleteDoc(collection, docId) {
    const uid = auth().currentUser?.uid;
    if (!uid) throw new Error('Not authenticated');
    await db().collection('users').doc(uid).collection(collection).doc(docId).delete();
  }

  // ── Workout ─────────────────────────────────────────────────

  async function saveWorkoutDay(uid, dateStr, dayData) {
    await db().collection('users').doc(uid).collection('workout_history').doc(dateStr)
      .set(dayData, { merge: true });
  }

  async function getWorkoutHistory(uid, startDate, endDate) {
    let ref = db().collection('users').doc(uid).collection('workout_history');
    if (startDate) ref = ref.where('date', '>=', startDate);
    if (endDate)   ref = ref.where('date', '<=', endDate);
    const snap = await ref.orderBy('date', 'desc').get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  async function saveWorkoutPR(uid, exerciseName, prData) {
    await db().collection('users').doc(uid).collection('workout_prs')
      .doc(exerciseName).set(prData, { merge: true });
  }

  async function getWorkoutPRs(uid) {
    const snap = await db().collection('users').doc(uid).collection('workout_prs').get();
    const prs = {};
    snap.docs.forEach(d => { prs[d.id] = d.data(); });
    return prs;
  }

  // Realtime listener for today's workout
  function listenToWorkoutDay(uid, dateStr, callback) {
    return db().collection('users').doc(uid).collection('workout_history').doc(dateStr)
      .onSnapshot(snap => callback(snap.exists ? snap.data() : null));
  }

  // ── Habits ──────────────────────────────────────────────────

  async function saveHabitLog(uid, dateStr, habits) {
    await db().collection('users').doc(uid).collection('habit_logs').doc(dateStr)
      .set({ date: dateStr, habits }, { merge: true });
  }

  async function getHabitHistory(uid, days) {
    const snap = await db().collection('users').doc(uid).collection('habit_logs')
      .orderBy('date', 'desc').limit(days).get();
    return snap.docs.map(d => d.data());
  }

  // ── Sleep ───────────────────────────────────────────────────

  async function saveSleepLog(uid, dateStr, sleepData) {
    await db().collection('users').doc(uid).collection('sleep_logs').doc(dateStr)
      .set({ date: dateStr, ...sleepData }, { merge: true });
  }

  async function getSleepHistory(uid, days) {
    const snap = await db().collection('users').doc(uid).collection('sleep_logs')
      .orderBy('date', 'desc').limit(days).get();
    return snap.docs.map(d => d.data());
  }

  // ── Expenses ────────────────────────────────────────────────

  async function saveExpenseLog(uid, dateStr, transactions) {
    await db().collection('users').doc(uid).collection('expense_logs').doc(dateStr)
      .set({ date: dateStr, transactions }, { merge: true });
  }

  async function getExpenseHistory(uid, startDate, endDate) {
    let ref = db().collection('users').doc(uid).collection('expense_logs');
    if (startDate) ref = ref.where('date', '>=', startDate);
    if (endDate)   ref = ref.where('date', '<=', endDate);
    const snap = await ref.orderBy('date', 'desc').get();
    return snap.docs.map(d => d.data());
  }

  // ── Journal ─────────────────────────────────────────────────

  async function saveJournalEntry(uid, dateStr, entry) {
    await db().collection('users').doc(uid).collection('journal_entries').doc(dateStr)
      .set({ date: dateStr, ...entry }, { merge: true });
  }

  async function getJournalEntries(uid, limit) {
    const snap = await db().collection('users').doc(uid).collection('journal_entries')
      .orderBy('date', 'desc').limit(limit || 30).get();
    return snap.docs.map(d => d.data());
  }

  // ── User Profile ────────────────────────────────────────────

  async function getUserProfile(uid) {
    const snap = await db().collection('users').doc(uid).get();
    return snap.exists ? snap.data() : null;
  }

  async function updateUserProfile(uid, data) {
    await db().collection('users').doc(uid).set(data, { merge: true });
  }

  // ── localStorage → Firestore Migration ─────────────────────

  async function migrateLocalStorage(uid) {
    if (localStorage.getItem('mps_migrated')) return;

    const keys = Object.keys(localStorage).filter(k => k.startsWith('mps_v3_'));
    if (keys.length === 0) return;

    console.log('[MPS] Migrating', keys.length, 'localStorage entries to Firestore...');

    for (const key of keys) {
      try {
        const value = JSON.parse(localStorage.getItem(key));
        // Example key: mps_v3_workout_2026-05-24
        const parts = key.replace('mps_v3_', '').split('_');
        const type  = parts[0];
        const id    = parts.slice(1).join('_');

        if (type === 'workout' && id) {
          await saveWorkoutDay(uid, id, value);
        }
      } catch (e) {
        console.warn('[MPS] Migration error for key:', key, e);
      }
    }

    localStorage.setItem('mps_migrated', '1');
    console.log('[MPS] Migration complete');
  }

  return {
    saveDoc, getDoc, queryDocs, deleteDoc,
    saveWorkoutDay, getWorkoutHistory, saveWorkoutPR, getWorkoutPRs, listenToWorkoutDay,
    saveHabitLog, getHabitHistory,
    saveSleepLog, getSleepHistory,
    saveExpenseLog, getExpenseHistory,
    saveJournalEntry, getJournalEntries,
    getUserProfile, updateUserProfile,
    migrateLocalStorage
  };
})();
