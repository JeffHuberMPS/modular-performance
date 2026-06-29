// MPS Sample / Demo Data — owner-only loader  (used by the dev panel in hub.html)
// ───────────────────────────────────────────────────────────────────────────
// Fills all 5 trackers with ~2 weeks of realistic data so the app can be SEEN
// working (and used for marketing screen-recordings), then wiped clean.
//
// Two stores must be written, because the trackers and the Home dashboard read
// from different places (the known "dual data source"):
//   1) localStorage           → makes each TRACKER screen render
//   2) Firestore subcollections (workout_history / sleep_logs / expense_logs /
//      journal_entries)        → makes the HOME dashboard + Discipline Score render
//   3) settings/<app>_backup   → so the demo survives a refresh / shows cross-device
//
// EVERY piece written is recorded in the manifest (localStorage 'mps_demo_v1')
// and every Firestore doc is tagged { _demo:true }. MPS_DEMO.clear() removes
// ONLY those — it can never delete real entries the owner logs later.
//
// Exposes: window.MPS_DEMO = { load(), clear(), isLoaded() }
// Requires (already loaded by hub.html): firebase compat SDK + firebase-config.js
window.MPS_DEMO = (function () {
  'use strict';

  const MANIFEST_KEY = 'mps_demo_v1';
  const DAYS = 21;                 // three weeks, ending today
  const SEED = 20260618;          // fixed → the demo is identical every load
  const SUBCOLLECTIONS = ['workout_history', 'sleep_logs', 'expense_logs', 'journal_entries'];
  const BACKUP_DOCS = {           // settings/<doc> : the localStorage keys it mirrors
    workout_backup:  ['mps_v3_state', 'mps_v3_history', 'mps_v3_prs'],
    habits_backup:   ['habits_v4', 'gym_v4', 'blocks_v4'],
    sleep_backup:    'rr_sleep:',          // prefix → all matching keys
    expenses_backup: 'mps_expense:',       // prefix
    journal_backup:  null                  // computed from uid prefix at runtime
  };

  // ── tiny utilities ────────────────────────────────────────────────────────
  function db()   { return firebase.firestore(); }
  function uid()  { const u = firebase.auth().currentUser; return u && u.uid; }
  function ymd(d) { const y=d.getFullYear(), m=String(d.getMonth()+1).padStart(2,'0'), day=String(d.getDate()).padStart(2,'0'); return y+'-'+m+'-'+day; }
  function dateNDaysAgo(n) { const d = new Date(); d.setHours(12,0,0,0); d.setDate(d.getDate()-n); return d; }
  function pad2(n){ return String(n).padStart(2,'0'); }
  function iso(dateStr, hh, mm){ return dateStr + 'T' + pad2(hh) + ':' + pad2(mm) + ':00.000Z'; }

  // deterministic PRNG (mulberry32) so the demo looks the same every time
  function makeRng(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const rng = makeRng(SEED);
  const pick   = (arr) => arr[Math.floor(rng() * arr.length)];
  const between = (lo, hi) => lo + Math.floor(rng() * (hi - lo + 1));   // inclusive int
  const chance = (p) => rng() < p;

  // The 14 calendar dates, oldest → newest (last = today)
  function buildDates() {
    const out = [];
    for (let i = DAYS - 1; i >= 0; i--) out.push(ymd(dateNDaysAgo(i)));
    return out;
  }

  // localStorage helpers that survive quota errors quietly
  function lsGet(k){ try { return localStorage.getItem(k); } catch(e){ return null; } }
  function lsSet(k,v){ try { localStorage.setItem(k, v); } catch(e){ console.warn('[demo] lsSet fail', k, e); } }
  function lsDel(k){ try { localStorage.removeItem(k); } catch(e){} }
  function jget(k, fallback){ const r = lsGet(k); if (r == null) return fallback; try { return JSON.parse(r); } catch(e){ return fallback; } }

  // ═══════════════════════════════════════════════════════════════════════
  //  GENERATORS  (each returns { local, docs }) — local = localStorage payload,
  //  docs = [{date, data}] for that app's Firestore subcollection
  // ═══════════════════════════════════════════════════════════════════════

  // ── WORKOUT ──────────────────────────────────────────────────────────────
  // 14-day plan; last day (today) is always a training day so the dashboard
  // shows a workout logged "today".
  const WORKOUT_PLAN = [
    'Push','Pull','Legs','Rest','Upper','Conditioning','Rest',
    'Push','Pull','Legs','Rest','Upper','Conditioning','Push'
  ];
  const LIFTS = {
    Push:  [['Bench Press',45,9],['Overhead Press',30,8],['Incline DB Press',25,10],['Triceps Pushdown',20,12]],
    Pull:  [['Deadlift',95,5],['Barbell Row',50,8],['Lat Pulldown',45,10],['Barbell Curl',15,12]],
    Legs:  [['Back Squat',75,8],['Romanian Deadlift',60,8],['Leg Press',120,10],['Calf Raise',40,15]],
    Upper: [['Bench Press',45,9],['Barbell Row',50,8],['Overhead Press',30,8],['Lat Pulldown',45,10]]
  };

  function genWorkout(dates) {
    const history = [];   // mps_v3_history array
    const prs = {};       // mps_v3_prs map
    const docs = [];      // workout_history subcollection
    dates.forEach((date, idx) => {
      const plan = WORKOUT_PLAN[idx % WORKOUT_PLAN.length];   // cycle the split plan across 3 weeks
      if (plan === 'Rest') return;
      const week = Math.floor(idx / 7);             // progressive overload over 3 weeks
      // Ebb & flow: not every day is heavier. Some are deload (lighter), some are PR days.
      const dayMul = chance(0.22) ? 0.82 : (chance(0.28) ? 1.13 : (0.95 + rng() * 0.12));
      const detail = [];
      let liftRounds = 0, skillRounds = 0, volume = 0, exerciseCount = 0, setCount = 0;
      const splits = [], skills = [];

      if (plan === 'Conditioning') {
        const rounds = between(4, 6);
        detail.push({ blockName:'Kickboxing', name:'Kickboxing', isSkill:true, targetSets:rounds, targetReps:3,
          sets: Array.from({length:rounds}, () => ({ weight:'', reps:'3', done:true })) });
        skills.push('Kickboxing'); skillRounds += rounds; exerciseCount += 1; setCount += rounds;
      } else {
        splits.push(plan);
        LIFTS[plan].forEach(([name, base, reps]) => {
          // weekly climb + per-day ebb/flow, snapped to 2.5 lb increments
          const w = Math.max(base * 0.7, Math.round(((base + week * 5) * dayMul) / 2.5) * 2.5);
          const sets = [];
          for (let s = 0; s < 3; s++) {
            const r = Math.max(4, reps - s - (chance(0.3) ? 1 : 0));   // reps taper on later sets
            sets.push({ weight: String(w), reps: String(r), done: true });
            volume += w * r; setCount += 1; liftRounds += 1;
          }
          detail.push({ blockName: plan, name, isSkill:false, targetSets:3, targetReps:reps, sets });
          exerciseCount += 1;
          // PR = heaviest single working weight for that lift
          if (!prs[name] || w > prs[name].weight) prs[name] = { weight: w, date };
        });
      }

      const splitName = splits.concat(skills).join(' + ');
      const rec = { date, splits, skills, splitName, exerciseCount, setCount,
        roundCount: setCount, liftRounds, skillRounds, circuitCount: detail.length,
        volume: Math.round(volume), detail };
      history.push(rec);
      docs.push({ date, data: Object.assign({ _demo: true }, rec) });
    });

    // Cardio conditioning sessions (runs + machine) sprinkled across the weeks so the dashboard
    // Conditioning widget isn't empty — the demo shows lifting + kickboxing + cardio.
    const conditioning = [];
    const MACHINES = ['treadmill', 'bike', 'rower'];
    dates.forEach((date) => {
      if (!chance(0.4)) return;                         // ~40% of days get a cardio session
      if (chance(0.55)) {                               // a run
        const miles = pick([2, 3, 3, 4, 5]);
        const pace = between(8, 10);                    // min/mile
        conditioning.push({ _demo: true, conditioning_date: date, conditioning_type: 'distance',
          conditioning_subtype: String(miles), conditioning_value: Math.round(miles * pace * 60) });
      } else {                                          // a cardio machine
        const mi = 2 + rng() * 6;
        conditioning.push({ _demo: true, conditioning_date: date, conditioning_type: 'machine',
          conditioning_subtype: pick(MACHINES), conditioning_distance: mi.toFixed(2),
          conditioning_value: between(20, 45) * 60 });
      }
    });
    return { local: { mps_v3_history: history, mps_v3_prs: prs, mps_v3_conditioning: conditioning }, docs };
  }

  // ── HABITS ───────────────────────────────────────────────────────────────
  const HABIT_IDS = ['h_wake','h_gymtr','h_breath','h_read','h_cold',
                     'h_mind','h_course','h_outr','h_chess','h_auto',
                     'h_journ','h_pray','h_bible','h_guit','h_sleep'];
  const HABIT_CORE = ['h_wake','h_breath','h_read','h_journ','h_pray','h_sleep']; // almost-daily anchors

  function genHabits(dates) {
    const habits_v4 = {};
    const gym_v4 = {};
    dates.forEach((date, idx) => {
      // ramp: earlier days less consistent, recent days strong; today best
      const isToday = idx === dates.length - 1;
      const baseConsistency = 0.45 + (idx / dates.length) * 0.45;   // ~0.45 → ~0.9
      const day = {};
      HABIT_IDS.forEach(id => {
        const anchor = HABIT_CORE.includes(id);
        const p = anchor ? Math.min(0.97, baseConsistency + 0.25) : baseConsistency;
        if (chance(p)) day[id] = true;
      });
      if (WORKOUT_PLAN[idx] !== 'Rest') { day['h_gymtr'] = true; gym_v4[date] = true; }
      if (isToday) {                                  // today: 14/15 for a strong-but-real score
        HABIT_IDS.forEach(id => { if (id !== 'h_chess') day[id] = true; });
        gym_v4[date] = true;
      }
      if (Object.keys(day).length) habits_v4[date] = day;
    });
    return { local: { habits_v4, gym_v4 }, docs: [] };   // habits dashboard reads localStorage only
  }

  // ── SLEEP / RECOVERY ─────────────────────────────────────────────────────
  function genSleep(dates) {
    const local = {};   // keyed rr_sleep:<date>
    const docs = [];
    const startWeight = 186;
    dates.forEach((date, idx) => {
      const sleepH = between(21, 22), sleepM = pick([0, 15, 30, 45]);
      const wakeH = 4, wakeM = pick([0, 10, 20, 30]);
      const energy = between(6, 9), soreness = between(2, 6), clarity = between(6, 9), restlessness = between(2, 5);
      const biometric = idx >= dates.length - 7;   // last week: Premium biometrics filled in
      const entry = {
        date,
        sleepTime: pad2(sleepH) + ':' + pad2(sleepM),
        wakeTime:  pad2(wakeH) + ':' + pad2(wakeM),
        energy, soreness, clarity, restlessness,
        restingHR: biometric ? String(between(52, 60)) : '',
        hrv:       biometric ? String(between(48, 72)) : '',
        weight:    biometric ? String((startWeight - idx * 0.3).toFixed(1)) : ''
      };
      local['rr_sleep:' + date] = entry;
      docs.push({ date, data: Object.assign({ _demo: true }, entry) });
    });
    return { local, docs };
  }

  // ── EXPENSES ─────────────────────────────────────────────────────────────
  const MERCHANTS = [
    ['Hy-Vee','Essentials',[35,120]], ['Casey\'s','Essentials',[30,65]],
    ['Amazon','Lifestyle',[12,90]], ['Chipotle','Lifestyle',[11,24]],
    ['Planet Fitness','Recurring',[10,10]], ['Spotify','Recurring',[12,12]],
    ['Netflix','Recurring',[16,16]], ['Vanguard','Investment',[100,300]],
    ['Starbucks','Lifestyle',[5,9]], ['Shell','Essentials',[28,55]]
  ];
  function genExpenses(dates) {
    const entries = [];                 // mps_expense:entries flat array (app view)
    const byDate = {};                  // grouped → expense_logs (dashboard view)
    let n = 0;
    dates.forEach((date, idx) => {
      const count = pick([0, 1, 1, 2, 2, 3]);   // some days no spend
      for (let i = 0; i < count; i++) {
        const [merchant, category, [lo, hi]] = pick(MERCHANTS);
        const amount = Math.round((lo + rng() * (hi - lo)) * 100) / 100;
        const e = { id: 'demo_' + (n++), date, item: 'Purchase', merchant, amount, category, source: 'Checking' };
        entries.push(e);
        (byDate[date] = byDate[date] || []).push({ amount: e.amount, merchant, category });
      }
      // bi-weekly paycheck (income) — app view only, NOT counted as spend on dashboard
      if (idx === 1 || idx === dates.length - 2) {
        entries.push({ id: 'demo_' + (n++), date, item: 'Paycheck', merchant: 'Employer', amount: 1850.00, category: 'Income', source: 'Direct Deposit' });
      }
    });
    const docs = Object.keys(byDate).map(date => ({ date, data: { _demo: true, date, transactions: byDate[date] } }));
    return { local: { 'mps_expense:entries': entries }, docs };
  }

  // ── JOURNAL ──────────────────────────────────────────────────────────────
  const J = {
    gratitude: ['Family','My health','Coffee','A quiet morning','Good training','Clarity','Time to build','My faith','Strong coffee','Cold mornings'],
    accomplish: ['Hit every set','Shipped a feature','Closed an outreach call','Read 20 pages','Cold shower done','Inbox to zero','Helped a friend','Meal prepped','Finished a course module','Logged everything'],
    becoming: ['I am becoming relentless','I am becoming disciplined','I am becoming the man I respect','I am becoming consistent'],
    learning: ['I am learning automation','I am learning patience','I am learning to lead','I am learning to slow down'],
    have: ['I have everything I need','I have the time','I have the discipline','I have momentum'],
    anticipation: ['Excited for tomorrow\'s session','Looking forward to the launch','Ready for the next call','Eager to push harder'],
    emotion: ['Focused','Grateful','Driven','Calm','Locked in','Tired but proud'],
    wasted: ['20 min scrolling','None today','15 min on my phone','A little YouTube','Nothing wasted']
  };
  const JOURNAL_SKIP = new Set([3, 10]);   // a couple of missed days (realistic)
  function genJournal(dates) {
    const map = {};   // journal_v1 object, keyed by date
    const docs = [];
    dates.forEach((date, idx) => {
      if (JOURNAL_SKIP.has(idx) && idx !== dates.length - 1) return;
      const plan = WORKOUT_PLAN[idx];
      const entry = {
        date,
        workout: plan === 'Rest' ? 'Rest day — mobility and a walk' : plan + ' day, felt strong',
        gratitude: [pick(J.gratitude), pick(J.gratitude), pick(J.gratitude)],
        accomplishment: [pick(J.accomplish), pick(J.accomplish), pick(J.accomplish)],
        affBecoming: pick(J.becoming),
        affLearning: pick(J.learning),
        affIHave: pick(J.have),
        anticipation: pick(J.anticipation),
        emotion: pick(J.emotion),
        wastedTime: pick(J.wasted),
        createdAt: iso(date, 21, 30),
        updatedAt: iso(date, 21, 45)
      };
      map[date] = entry;
      docs.push({ date, data: Object.assign({ _demo: true }, entry) });
    });
    return { map, docs };
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  BACKUP DOC SYNC  (mirror current localStorage → settings/<app>_backup)
  // ═══════════════════════════════════════════════════════════════════════
  function backupKeysFor(docName) {
    const spec = BACKUP_DOCS[docName];
    if (docName === 'journal_backup') return Object.keys(localStorage).filter(k => k.startsWith('mps_jnl_' + uid() + '_'));
    if (typeof spec === 'string') return Object.keys(localStorage).filter(k => k.startsWith(spec));
    return spec.filter(k => lsGet(k) != null);
  }
  async function syncBackupDoc(docName) {
    const keys = backupKeysFor(docName);
    const ref = db().collection('users').doc(uid()).collection('settings').doc(docName);
    if (!keys.length) { try { await ref.delete(); } catch(e){} return; }
    const data = {};
    keys.forEach(k => { const v = lsGet(k); if (v != null) data[k] = v; });
    await ref.set({ data, ts: Date.now(), v: 1 }, { merge: false });
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  LOAD
  // ═══════════════════════════════════════════════════════════════════════
  async function load() {
    if (!uid()) throw new Error('Sign in first — no user.');
    if (isLoaded()) { await clear(); }            // never stack two copies

    const dates = buildDates();
    const journalKey = 'mps_jnl_' + uid() + '_journal_v1';

    const w = genWorkout(dates);
    const h = genHabits(dates);
    const s = genSleep(dates);
    const e = genExpenses(dates);
    const j = genJournal(dates);

    // 1) localStorage — merge into anything already there (preserve real data)
    const histExisting = jget('mps_v3_history', []);
    lsSet('mps_v3_history', JSON.stringify(histExisting.concat(w.local.mps_v3_history)));
    const prsExisting = jget('mps_v3_prs', {});
    lsSet('mps_v3_prs', JSON.stringify(Object.assign({}, prsExisting, w.local.mps_v3_prs)));
    const condExisting = jget('mps_v3_conditioning', []);
    lsSet('mps_v3_conditioning', JSON.stringify(condExisting.concat(w.local.mps_v3_conditioning || [])));

    lsSet('habits_v4', JSON.stringify(Object.assign(jget('habits_v4', {}), h.local.habits_v4)));
    lsSet('gym_v4',    JSON.stringify(Object.assign(jget('gym_v4', {}),    h.local.gym_v4)));

    Object.keys(s.local).forEach(k => lsSet(k, JSON.stringify(s.local[k])));

    const expExisting = jget('mps_expense:entries', []);
    lsSet('mps_expense:entries', JSON.stringify(expExisting.concat(e.local['mps_expense:entries'])));

    lsSet(journalKey, JSON.stringify(Object.assign(jget(journalKey, {}), j.map)));

    // 2) Firestore subcollections (Home dashboard) — batched
    const u = uid();
    let batch = db().batch(), ops = 0;
    const flush = async () => { if (ops) { await batch.commit(); batch = db().batch(); ops = 0; } };
    const queue = async (coll, date, data) => {
      batch.set(db().collection('users').doc(u).collection(coll).doc(date), data, { merge: true });
      if (++ops >= 400) await flush();
    };
    for (const d of w.docs) await queue('workout_history', d.date, d.data);
    for (const d of s.docs) await queue('sleep_logs',      d.date, d.data);
    for (const d of e.docs) await queue('expense_logs',    d.date, d.data);
    for (const d of j.docs) await queue('journal_entries', d.date, d.data);
    await flush();

    // 3) backup docs so it survives refresh / shows cross-device
    for (const docName of Object.keys(BACKUP_DOCS)) { try { await syncBackupDoc(docName); } catch(err){ console.warn('[demo] backup', docName, err); } }

    // 4) manifest — the exact footprint, so clear() is surgical
    const manifest = {
      v: 1, uid: u, dates, journalKey,
      expenseIds: e.local['mps_expense:entries'].map(x => x.id),
      prKeys: Object.keys(w.local.mps_v3_prs),
      loadedAt: Date.now()
    };
    lsSet(MANIFEST_KEY, JSON.stringify(manifest));
    return { days: dates.length };
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  CLEAR  — removes ONLY demo data, by manifest; leaves real entries intact
  // ═══════════════════════════════════════════════════════════════════════
  async function clear() {
    const m = jget(MANIFEST_KEY, null);
    if (!m) return { cleared: false };
    const dateSet = new Set(m.dates || []);
    const u = uid() || m.uid;

    // 1) localStorage — surgical removal
    // workout history: drop demo dates
    lsSet('mps_v3_history', JSON.stringify(jget('mps_v3_history', []).filter(r => !dateSet.has(r.date))));
    // workout cardio conditioning: drop demo dates
    lsSet('mps_v3_conditioning', JSON.stringify(jget('mps_v3_conditioning', []).filter(c => !dateSet.has(c.conditioning_date))));
    // workout PRs: drop the keys we created whose date is a demo date
    const prs = jget('mps_v3_prs', {});
    (m.prKeys || []).forEach(k => { if (prs[k] && dateSet.has(prs[k].date)) delete prs[k]; });
    lsSet('mps_v3_prs', JSON.stringify(prs));
    // habits + gym: drop demo date keys
    const hv = jget('habits_v4', {}); (m.dates||[]).forEach(d => delete hv[d]); lsSet('habits_v4', JSON.stringify(hv));
    const gv = jget('gym_v4', {});    (m.dates||[]).forEach(d => delete gv[d]); lsSet('gym_v4', JSON.stringify(gv));
    // sleep: delete the per-day keys
    (m.dates || []).forEach(d => lsDel('rr_sleep:' + d));
    // expenses: drop the demo-id entries
    const idSet = new Set(m.expenseIds || []);
    lsSet('mps_expense:entries', JSON.stringify(jget('mps_expense:entries', []).filter(x => !idSet.has(x.id))));
    // journal: drop demo date keys
    const jk = m.journalKey || ('mps_jnl_' + u + '_journal_v1');
    const jmap = jget(jk, {}); (m.dates||[]).forEach(d => delete jmap[d]); lsSet(jk, JSON.stringify(jmap));

    // 2) Firestore subcollection docs — delete by demo date id, plus _demo backstop
    if (u) {
      let batch = db().batch(), ops = 0;
      const flush = async () => { if (ops) { await batch.commit(); batch = db().batch(); ops = 0; } };
      for (const coll of SUBCOLLECTIONS) {
        for (const d of (m.dates || [])) {
          batch.delete(db().collection('users').doc(u).collection(coll).doc(d));
          if (++ops >= 400) await flush();
        }
      }
      await flush();
      // backstop: any stray docs still tagged _demo
      for (const coll of SUBCOLLECTIONS) {
        try {
          const snap = await db().collection('users').doc(u).collection(coll).where('_demo', '==', true).get();
          let b = db().batch(), o = 0;
          for (const doc of snap.docs) { b.delete(doc.ref); if (++o >= 400) { await b.commit(); b = db().batch(); o = 0; } }
          if (o) await b.commit();
        } catch (err) { console.warn('[demo] clear backstop', coll, err); }
      }
      // 3) re-sync backup docs from the now-cleaned localStorage (or delete if empty)
      for (const docName of Object.keys(BACKUP_DOCS)) { try { await syncBackupDoc(docName); } catch(err){} }
    }

    lsDel(MANIFEST_KEY);
    return { cleared: true, days: (m.dates || []).length };
  }

  function isLoaded() { return !!jget(MANIFEST_KEY, null); }

  // ═══════════════════════════════════════════════════════════════════════
  //  WIPE TRACKERS  — clean slate for Workout/Habits/Recovery/Journal
  //  (local + cloud). DELIBERATELY KEEPS Expenses (mps_expense:* + its Sheet
  //  sync config) so the live Google-Sheet connection is never touched.
  // ═══════════════════════════════════════════════════════════════════════
  async function wipeTrackers() {
    const u = uid();
    // 1) localStorage — fixed tracker keys + the demo manifest. (Expenses keys untouched.)
    ['mps_v3_state', 'mps_v3_history', 'mps_v3_prs', 'habits_v4', 'gym_v4', 'blocks_v4', MANIFEST_KEY].forEach(lsDel);
    // sleep (rr_sleep:*) + journal (mps_jnl_<uid>_*) — prefix scan
    try {
      const del = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k) continue;
        if (k.indexOf('rr_sleep:') === 0) del.push(k);
        else if (u && k.indexOf('mps_jnl_' + u + '_') === 0) del.push(k);
      }
      del.forEach(lsDel);
    } catch (e) {}
    // 2) Firestore — tracker subcollections + backup docs (NOT expense_logs / expenses_backup).
    if (u) {
      const colls = ['workout_history', 'sleep_logs', 'journal_entries'];
      for (const coll of colls) {
        try {
          const snap = await db().collection('users').doc(u).collection(coll).get();
          let b = db().batch(), o = 0;
          for (const doc of snap.docs) { b.delete(doc.ref); if (++o >= 400) { await b.commit(); b = db().batch(); o = 0; } }
          if (o) await b.commit();
        } catch (err) { console.warn('[wipe]', coll, err); }
      }
      for (const docName of ['workout_backup', 'habits_backup', 'sleep_backup', 'journal_backup']) {
        try { await db().collection('users').doc(u).collection('settings').doc(docName).delete(); } catch (e) {}
      }
    }
    return { wiped: true };
  }

  return { load, clear, isLoaded, wipeTrackers };
})();
