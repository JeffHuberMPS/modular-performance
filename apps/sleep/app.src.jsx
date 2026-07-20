

/* ── CDN Globals ── */
const { useState, useEffect, useMemo } = React;

/* ── Gray/Gold theme (Free/Medium): purple → white, gold stays gold. __GRAY reads parent tier. ── */
const __GRAY = (()=>{ try { return !!(window.parent && window.parent !== window && window.parent.document.body.classList.contains('tier-mono')); } catch(e){ return false; } })();
const __CORE = (()=>{ try { return !!(window.parent && window.parent !== window && window.parent.document.body.classList.contains('tier-core')); } catch(e){ return false; } })();
// Premium = full history. Core/Elite see only the last 60 days of the log list (stats/charts unaffected).
const __PREMIUM = (()=>{ try { return !!(window.parent && window.parent !== window && window.parent.document.body.classList.contains('tier-premium')); } catch(e){ return false; } })();
const HISTORY_CAP_CUTOFF = (()=>{ const d=new Date(); d.setDate(d.getDate()-60); d.setHours(0,0,0,0); const m=String(d.getMonth()+1).padStart(2,'0'), day=String(d.getDate()).padStart(2,'0'); return d.getFullYear()+'-'+m+'-'+day; })();
const PURPLE = __GRAY ? '#f5f5f5' : '#9b6bc9';
const GOLD   = __GRAY ? '#C9A020' : '#C9A020';
const LBL    = __GRAY ? '#C9A020' : '#a684cc';   // labels: gold in gray, PURPLE in colorful
const BRDR   = __GRAY ? '150,150,150' : '155,107,201';   // card borders: neutral in gray, PURPLE in colorful
const BAR_TOP = __GRAY ? '#C9A020' : '#c9a3eb';   // bar gradient top: gold in gray, lilac in colorful
const BAR_BOT = __GRAY ? '#8a6a2a' : '#5a3088';   // bar gradient bottom: dark gold in gray, deep purple in colorful
const TOAST_TXT = __GRAY ? '#f5f5f5' : '#c9a8e8';   // save toast text: white in gray, lilac in colorful
const UP_CLR  = __GRAY ? '#C9A020' : '#6ac96b';   // trend good: gold in gray, green in colorful
const DOWN_CLR = __GRAY ? '#999999' : '#c96b6b';   // trend bad: grey in gray, red in colorful
/* Recharts removed — using pure SVG charts below */

/* Lucide React icons — with emoji fallbacks if CDN fails */
const _lc = window.LucideReact || window.lucide || {};
const Moon        = _lc.Moon        || (({size=16}) => <span style={{fontSize:(size*0.85)+'px'}}>🌙</span>);
const Sun         = _lc.Sun         || (({size=16}) => <span style={{fontSize:(size*0.85)+'px'}}>☀️</span>);
const Activity    = _lc.Activity    || (({size=16}) => <span style={{fontSize:(size*0.85)+'px'}}>📈</span>);
const Battery     = _lc.Battery     || (({size=16}) => <span style={{fontSize:(size*0.85)+'px'}}>🔋</span>);
const Flame       = _lc.Flame       || (({size=16}) => <span style={{fontSize:(size*0.85)+'px'}}>🔥</span>);
const Plus        = _lc.Plus        || (({size=16}) => <span>＋</span>);
const Trash2      = _lc.Trash2      || (({size=16}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>);
const TrendingUp  = _lc.TrendingUp  || (({size=12}) => <span>↑</span>);
const TrendingDown= _lc.TrendingDown|| (({size=12}) => <span>↓</span>);
const Minus       = _lc.Minus       || (({size=12}) => <span>−</span>);
const Zap         = _lc.Zap         || (({size=16}) => <span>⚡</span>);
const HeartPulse  = _lc.HeartPulse  || (({size=16}) => <span>💓</span>);
const Pencil      = _lc.Pencil      || (({size=16}) => <span>✏</span>);
const ChevronDown = _lc.ChevronDown || (({size=18,style:s}) => <span style={{...s,display:'inline-block'}}>▾</span>);

/* ── Inline SVG icons — guaranteed render, no CDN dependency ── */
const IconSun      = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/></svg>;
const IconMoon     = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>;
const IconZap      = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
const IconHeart    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M3.22 12H9.5l1.5-3 2 4.5 1.5-3h6.78"/></svg>;
const IconActivity = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
const IconBattery  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="6" width="18" height="12" rx="2"/><line x1="23" y1="13" x2="23" y2="11"/><line x1="5" y1="10" x2="5" y2="14"/><line x1="8" y1="10" x2="8" y2="14"/><line x1="11" y1="10" x2="11" y2="14"/></svg>;

/* ══════════════════════════════════════════════════
   STORAGE — localStorage primary, Firestore bonus sync
   ══════════════════════════════════════════════════ */
const LS_PREFIX = "rr_sleep:";
// Reusable delete-confirm modal (vanilla overlay): "Are you sure?" before any destructive delete.
function sleepConfirmDelete(message, onYes) {
  const ov = document.createElement('div');
  ov.style.cssText = 'position:fixed;inset:0;z-index:100000;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;padding:20px;font-family:Inter,system-ui,sans-serif;';
  ov.innerHTML = '<div style="background:#141414;border:1px solid #333;border-radius:14px;padding:22px;max-width:360px;width:100%;box-shadow:0 18px 50px rgba(0,0,0,0.6);">'
    + '<div style="font-size:15px;color:#f5f5f5;font-weight:600;line-height:1.45;margin-bottom:18px;">' + message + '</div>'
    + '<div style="display:flex;gap:10px;">'
    + '<button id="slp-cf-cancel" style="flex:1;padding:11px;border-radius:9px;border:1px solid #444;background:transparent;color:#bbb;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;">Cancel</button>'
    + '<button id="slp-cf-ok" style="flex:1;padding:11px;border-radius:9px;border:none;background:#ef4444;color:#fff;font-size:13px;font-weight:800;letter-spacing:.04em;cursor:pointer;font-family:inherit;">Delete</button>'
    + '</div></div>';
  document.body.appendChild(ov);
  const close = () => ov.remove();
  ov.querySelector('#slp-cf-cancel').addEventListener('click', close);
  ov.querySelector('#slp-cf-ok').addEventListener('click', () => { close(); onYes(); });
  ov.addEventListener('click', (e) => { if (e.target === ov) close(); });
}
const storage = {
  async get(key) {
    try {
      const v = localStorage.getItem(LS_PREFIX + key);
      return v;
    } catch (e) { return null; }
  },
  async set(key, value) {
    var wrote = false;
    try { localStorage.setItem(LS_PREFIX + key, value); wrote = true; } catch (e) {}
    try {
      if (wrote) { window.sleepScheduleBackup && window.sleepScheduleBackup(); }
      else { window.sleepCloudSet && window.sleepCloudSet(LS_PREFIX + key, value); }   // local blocked/full -> save straight to the cloud
    } catch (e) {}
    return true;   // saved to local and/or cloud — never show a false "could not persist"
  },
  async delete(key) {
    try { localStorage.removeItem(LS_PREFIX + key); } catch (e) {}
    // Single cloud path: the debounced sleep_backup mirror (see sleepScheduleBackup).
    try { window.sleepScheduleBackup && window.sleepScheduleBackup(); } catch (e) {}
  },
  async list() {
    const keys = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(LS_PREFIX)) {
          keys.push(k.slice(LS_PREFIX.length));
        }
      }
    } catch (e) {}
    return keys;
  },
};

/* ══════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════ */
function SleepTracker() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [celebration, setCelebration] = useState(null);   // pending milestone card
  const [activeTab, setActiveTab] = useState(__CORE ? "log" : "dashboard");
  const [form, setForm] = useState(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return {
      date: `${y}-${m}-${day}`,
      sleepTime: "",
      wakeTime: "04:00",
      energy: 7,
      sleepQuality: 7,
      soreness: 3,
      clarity: 7,
      restlessness: 3,
      restingHR: "",
      hrv: "",
      weight: "",
    };
  });

  /* Load on mount */
  useEffect(() => {
    (async () => {
      try {
        const keys = await storage.list();
        const loaded = [];
        for (const k of keys) {
          if (k === 'wearable_interest') continue; // settings key, NOT a dated sleep entry
          const value = await storage.get(k);
          if (value) {
            try {
              const parsed = JSON.parse(value);
              if (!parsed || !parsed.date) continue; // skip anything that isn't a dated entry (prevents a blank/crashed app)
              loaded.push({
                ...parsed,
                sleepQuality: parsed.sleepQuality ?? (10 - (parsed.restlessness ?? 3)),
                energy: parsed.energy ?? 5,
                clarity: parsed.clarity ?? 5,
                soreness: parsed.soreness ?? 5,
                restlessness: parsed.restlessness ?? 3,
              });
            } catch (e) {}
          }
        }
        loaded.sort((a, b) => (a.date || '').localeCompare(b.date || ''));

        // TEST DATA — opt in with ?seed=14 in the URL. Generates 14 days of
        // varied entries so the v4 weapons can be exercised without waiting
        // two weeks. Deterministic, so reloading gives the same numbers.
        // Only fills dates that have no real entry, so it can never
        // overwrite something you actually logged. Clear it with Reset
        // Trackers on the hub.
        const seedN = new URLSearchParams(location.search).get('seed');
        if (seedN && loaded.length < 40) {
          const n = Math.min(60, parseInt(seedN, 10) || 14);
          const have = new Set(loaded.map(e => e.date));
          const pad = v => String(v).padStart(2, '0');
          const made = [];
          for (let i = n - 1; i >= 0; i--) {
            const d = new Date(); d.setDate(d.getDate() - i);
            const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
            if (have.has(date)) continue;
            // A rough arc: rough first week, better second, with wobble.
            const arc = Math.round((n - 1 - i) / Math.max(1, n - 1) * 3);
            const w = [0, 1, -1, 2, 0, -1, 1][i % 7];
            const clamp = v => Math.max(1, Math.min(10, v));
            const bedM = 22 * 60 + 15 + ([0, 25, -20, 45, 10, -15, 30][i % 7]);
            const wakeM = 5 * 60 + 30 + ([0, 15, -10, 20, 5, -20, 10][i % 7]);
            const entry = {
              date,
              sleepTime: `${pad(Math.floor(bedM / 60) % 24)}:${pad(bedM % 60)}`,
              wakeTime:  `${pad(Math.floor(wakeM / 60) % 24)}:${pad(wakeM % 60)}`,
              sleepQuality: clamp(5 + arc + w),
              energy:       clamp(5 + arc + w),
              clarity:      clamp(6 + arc - w),
              soreness:     clamp(5 - arc + w),      // stored inverted
              restlessness: clamp(4 - arc - w),      // stored inverted
              restingHR: 58 + (i % 5),
              hrv: 55 + (i % 9),
              weight: 180
            };
            made.push(entry);
            try { await storage.set(date, JSON.stringify(entry)); } catch (err) {}
          }
          if (made.length) {
            loaded.push(...made);
            loaded.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
          }
        }

        setEntries(loaded);
      } catch (e) {
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const saveEntry = async () => {
    const entry = { ...form };
    const next = [...entries.filter((e) => e.date !== form.date), entry].sort((a, b) =>
      a.date.localeCompare(b.date)
    );
    setEntries(next);
    setShowForm(false);
    setSaveSuccess(true);
    // Milestone check belongs here, not in render: a render-path check
    // would re-fire every time the user scrolled past. spec Part 14.
    try {
      if (window.RecoveryReports) {
        const lvl = RecoveryReports.pendingCelebration(next.length, RecoveryEngineUser());
        if (lvl) setCelebration(lvl);
      }
    } catch (err) {}
    setSaveError(null);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => setSaveSuccess(false), 1500);
    const ok = await storage.set(form.date, JSON.stringify(entry));
    try { window.sleepBackupNow && window.sleepBackupNow(); } catch(e){}   // sync to cloud immediately on every save
    if (!ok) setSaveError("Could not persist entry");
  };

  const deleteEntry = async (date) => {
    sleepConfirmDelete('Delete this sleep entry? This can’t be undone.', async () => {
      setEntries(entries.filter((e) => e.date !== date));
      await storage.delete(date);
    });
  };

  const editEntry = (entry) => {
    setForm({
      date: entry.date,
      sleepTime: entry.sleepTime || "",
      wakeTime: entry.wakeTime || "",
      sleepQuality: entry.sleepQuality ?? (10 - (entry.restlessness ?? 3)),
      energy: entry.energy ?? 5,
      soreness: entry.soreness ?? 5,
      clarity: entry.clarity ?? 5,
      restlessness: entry.restlessness ?? 3,
      restingHR: entry.restingHR ?? "",
      hrv: entry.hrv ?? "",
      weight: entry.weight ?? "",
    });
    setShowForm(true);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const todayStr = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  // Single 12-hour time formatter — delegates to the module-level _fmt12.
  // (Callers always guard for empty values, so _fmt12's "—" fallback is never hit here.)
  const fmt12 = _fmt12;

  const fmt12Short = (t) => {
    if (!t) return "";
    const [h, m] = t.split(":").map(Number);
    const period = h >= 12 ? "p" : "a";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${String(m).padStart(2, "0")}${period}`;
  };

  const fmtDate = (d) => {
    if (!d) return "";
    const [y, m, day] = d.split("-");
    return `${m}/${day}/${y}`;
  };

  const fmtWeekday = (d) => {
    if (!d) return "";
    const [y, m, day] = d.split("-").map(Number);
    return ["SUN","MON","TUE","WED","THU","FRI","SAT"][new Date(y, m - 1, day).getDay()];
  };

  const toDate = (dateStr) => {
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(y, m - 1, d);
  };

  const startOfWeek = (dateStr) => {
    const d = toDate(dateStr);
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    return d;
  };

  const dateToStr = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const fmtWeekRange = (weekStart) => {
    const end = new Date(weekStart);
    end.setDate(end.getDate() + 6);
    const mn = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const s = `${mn[weekStart.getMonth()]} ${weekStart.getDate()}`;
    const e = weekStart.getMonth() === end.getMonth()
      ? `${end.getDate()}`
      : `${mn[end.getMonth()]} ${end.getDate()}`;
    return `${s} – ${e}`;
  };

  const fmtMonth = (dateStr) => {
    const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    const [y, m] = dateStr.split("-").map(Number);
    return `${monthNames[m - 1]} ${y}`;
  };

  const calcHours = (sleep, wake) => {
    if (!sleep || !wake) return 0;
    const [sh, sm] = sleep.split(":").map(Number);
    const [wh, wm] = wake.split(":").map(Number);
    let mins = wh * 60 + wm - (sh * 60 + sm);
    if (mins < 0) mins += 24 * 60;
    if (mins > 16 * 60) return 0;   // >16h is a data-entry slip — treat as invalid
    return +(mins / 60).toFixed(2);
  };

  // Recovery formula: sleep(25%) + energy(20%) + clarity(20%) + soreness_inv(15%) + restlessness_inv(20%)
  const calcRecovery = (hours, energy, soreness, clarity, restlessness) => {
    const sleepScore     = Math.min(hours / 7, 1) * 25;
    const energyScore    = (energy / 10) * 20;
    const clarityScore   = (clarity / 10) * 20;
    const soreScore      = ((10 - soreness) / 10) * 15;
    const restScore      = ((10 - restlessness) / 10) * 20;
    return Math.round(sleepScore + energyScore + clarityScore + soreScore + restScore);
  };

  // ── Recovery Engine v4.0 ────────────────────────────────────────────
  // The locked spec's scoring replaces the old weighted formula.
  // Field adaptation. No stored data is rewritten:
  //   energy       -> energy            direct
  //   clarity      -> mentalClarity     direct
  //   soreness     -> physicalRecovery  10 - x, already the display value
  //   restlessness -> calmness          10 - x, already the display value
  //   sleepQuality -> NEW. Historical entries have no source, so they fall
  //                   back to inverted restlessness: restless sleep is
  //                   poor-quality sleep. That is a proxy, not a
  //                   measurement. New entries capture it directly.
  // 10 - soreness can reach 0, outside the spec's 1-10 range, so every
  // adapted value is clamped.
  const _c10 = v => Math.max(1, Math.min(10, Math.round(v)));
  const v4Score = (e) => {
    if (!window.RecoveryScoring || !e.sleepTime || !e.wakeTime) return null;
    try {
      return RecoveryScoring.score({
        date: e.date,
        bedtime: e.sleepTime,
        wakeTime: e.wakeTime,
        sleepQuality:     _c10(e.sleepQuality ?? (10 - (e.restlessness ?? 3))),
        energy:           _c10(e.energy ?? 5),
        mentalClarity:    _c10(e.clarity ?? 5),
        physicalRecovery: _c10(10 - (e.soreness ?? 5)),
        calmness:         _c10(10 - (e.restlessness ?? 3))
      }, []);
    } catch (err) { return null; }
  };

  const enriched = useMemo(() =>
    entries.map((e) => {
      const hours    = calcHours(e.sleepTime, e.wakeTime);
      const hasSleep = !!e.sleepTime;
      const v4       = hasSleep ? v4Score(e) : null;
      return {
        ...e,
        hours:    hasSleep ? hours : null,
        // Engine score when available, old formula as a safety net so the
        // pillar keeps working if the engine script fails to load.
        recovery: hasSleep
          ? (v4 ? v4.recoveryScore
                : calcRecovery(hours, e.energy ?? 5, e.soreness ?? 5, e.clarity ?? 5, e.restlessness ?? 3))
          : null,
        // Everything the dashboard, plan and coaching stages need next.
        v4,
        recoveryGrade:  v4 ? v4.recoveryGrade  : null,
        recoveryStatus: v4 ? v4.recoveryStatus : null,
        dotCount:       v4 ? v4.dotCount       : null,
        dotHex:         v4 ? v4.dotHex         : null,
        pushMeter:      v4 ? v4.pushMeter      : null,
        pushMessage:    v4 ? v4.pushMessage    : null,
        sleepQuality:   _c10(e.sleepQuality ?? (10 - (e.restlessness ?? 3))),
      // Numeric axes for the Bedtime / Wake Time charts. Computed by the
      // engine so the midnight wrap is handled in exactly one place.
      bedAxis:  (hasSleep && window.RecoveryCharts) ? RecoveryCharts.bedtimeAxis(e.sleepTime) : null,
      wakeAxis: (e.wakeTime && window.RecoveryCharts) ? RecoveryCharts.wakeAxis(e.wakeTime) : null,
        // POSITIVE-DIRECTION VIEW: every slider now reads "10 = good". The stored fields stay
        // soreness/restlessness (low = good) so NO historical data is rewritten or lost — we only
        // flip them for display. physicalRecovery = 10 - soreness, calmness = 10 - restlessness.
        physicalRecovery: 10 - (e.soreness ?? 5),
        calmness:         10 - (e.restlessness ?? 3),
        label:    e.date.slice(5),
        weekday: (() => {
          const [yy, mm, dd] = e.date.split("-").map(Number);
          return ["SUN","MON","TUE","WED","THU","FRI","SAT"][new Date(yy, mm - 1, dd).getDay()];
        })(),
      };
    }),
    [entries]
  );

  // Engine-shaped rows. The coaching and reports modules expect the v4
  // schema (sleepQuality/mentalClarity/physicalRecovery/calmness plus the
  // derived score fields); the app stores the older field names. One
  // adapter here means neither module has to know about the old shape.
  const engineRows = useMemo(() => enriched
    .filter(e => e.v4)
    .map(e => ({
      ...e.v4,
      date: e.date,
      sleepQuality:     _c10(e.sleepQuality ?? (10 - (e.restlessness ?? 3))),
      energy:           _c10(e.energy ?? 5),
      mentalClarity:    _c10(e.clarity ?? 5),
      physicalRecovery: _c10(10 - (e.soreness ?? 5)),
      calmness:         _c10(10 - (e.restlessness ?? 3)),
      actionCompleted:  !!e.actionCompleted,
      updatedAt:        e.updatedAt || ""
    })), [enriched]);

  // Weapon 5 writes only the action fields onto an existing entry. It never
  // touches the sliders or times, so the score cannot shift as a side effect
  // of picking or ticking an action.
  const saveAction = async (date, patch) => {
    const target = entries.find(e => e.date === date);
    if (!target) return;
    const updated = { ...target, ...patch };
    setEntries(entries.map(e => (e.date === date ? updated : e)));
    try { await storage.set(date, JSON.stringify(updated)); } catch (err) {}
    try { window.sleepBackupNow && window.sleepBackupNow(); } catch (err) {}
  };

  const last30 = enriched.slice(-30);
  const last7  = enriched.slice(-7);

  const avg = (arr, key) => {
    const vals = arr.map((x) => x[key]).filter((v) => v !== undefined && v !== null && !isNaN(v));
    return vals.length ? +(vals.reduce((s, x) => s + x, 0) / vals.length).toFixed(1) : 0;
  };

  const stats = {
    hours:    avg(last7, "hours"),
    energy:   avg(last7, "energy"),
    clarity:  avg(last7, "clarity"),
    physicalRecovery: avg(last7, "physicalRecovery"),
    recovery: avg(last7, "recovery"),
  };

  /* ── Insights ── */
  const avgMinutes = (arr, key) => {
    const mins = arr.map((e) => e[key]).filter(Boolean).map((t) => {
      const [h, m] = t.split(":").map(Number);
      return key === "sleepTime" && h < 12 ? h * 60 + m + 24 * 60 : h * 60 + m;
    });
    if (!mins.length) return null;
    const av = mins.reduce((s, x) => s + x, 0) / mins.length;
    const totalMins = Math.round(av) % (24 * 60);
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  const bestDay = (() => {
    if (!last7.length) return null;
    const valid = last7.filter((e) => e.recovery != null);
    if (!valid.length) return null;
    return valid.reduce((best, e) => (e.recovery > best.recovery ? e : best), valid[0]);
  })();

  const worstDay = (() => {
    if (!last7.length) return null;
    const valid = last7.filter((e) => e.recovery != null);
    if (!valid.length) return null;
    return valid.reduce((worst, e) => (e.recovery < worst.recovery ? e : worst), valid[0]);
  })();

  const dayOfWeek = (dateStr) => {
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "long" });
  };

  const insights = (() => {
    const avgWake  = avgMinutes(last7, "wakeTime");
    const avgSleep = avgMinutes(last7, "sleepTime");
    return {
      avgWakeFormatted:  avgWake  ? fmt12(avgWake)  : null,
      avgSleepFormatted: avgSleep ? fmt12(avgSleep) : null,
      avgDuration:  stats.hours    > 0 ? `${stats.hours} hrs`    : null,
      avgEnergy:    stats.energy   > 0 ? `${stats.energy}/10`   : null,
      avgClarity:   stats.clarity  > 0 ? `${stats.clarity}/10`  : null,
      avgPhysRecovery: stats.physicalRecovery > 0 ? `${stats.physicalRecovery}/10` : null,
      bestDay,
      worstDay,
      entryCount: last7.length,
    };
  })();

  const trend = (key) => {
    if (last7.length < 4) return "flat";
    const half = Math.floor(last7.length / 2);
    const earlier = avg(last7.slice(0, half), key);
    const recent  = avg(last7.slice(half), key);
    const diff = recent - earlier;
    if (Math.abs(diff) < 0.3) return "flat";
    return diff > 0 ? "up" : "down";
  };

  const today = enriched.find((e) => e.date === todayStr());

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif", letterSpacing: "0.3em", color: PURPLE, fontSize: 12 }}>
          LOADING
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* Save success toast */}
        {saveSuccess && (
          <div style={{
            background: "rgba(150,150,150,0.15)", border: `1px solid ${PURPLE}`,
            color: TOAST_TXT, padding: "12px 16px", marginBottom: 16,
            fontFamily: "'Inter', system-ui, -apple-system, sans-serif", fontSize: 12,
            letterSpacing: "0.1em", textAlign: "center"
          }}>
            ENTRY SAVED · {entries.length} TOTAL
          </div>
        )}

        {/* ── Header / Brand Block ── */}
        <header style={styles.header}>

          {/* Big Hero Card — gold/sleep theme */}
          <div style={{
            background: '#000000',
            backgroundImage: 'radial-gradient(ellipse 60% 50% at 50% 45%, rgba(201,160,32,0.22) 0%, rgba(201,160,32,0.07) 45%, transparent 75%)',
            border: '3px solid transparent',
            borderRadius: '22px',
            padding: '38px 20px 28px',
            textAlign: 'center',
            marginBottom: '16px',
            position: 'relative',
            overflow: 'hidden',
            backgroundClip: 'padding-box',
            boxShadow: '0 0 0 1px rgba(0,0,0,1), 0 0 0 2px rgba(220,220,220,0.85), 0 0 0 3px rgba(120,120,120,0.6), 0 0 0 4px rgba(0,0,0,0.9), 0 0 28px rgba(201,160,32,0.28), 0 18px 42px rgba(0,0,0,0.95), inset 0 3px 0 rgba(255,255,255,0.22), inset 0 -3px 6px rgba(0,0,0,0.95)',
          }}>
            <div className="mps-logo-rsp" style={{
              fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
              fontWeight: 900, fontStyle: 'italic',
              letterSpacing: '4px', lineHeight: 1,
              background: 'linear-gradient(180deg, #ffffff 0%, #f5e6c0 12%, #e8c87a 28%, #C9A020 50%, #8a6a2a 72%, #4a3410 90%, #1e1408 100%)',
              WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 6px 20px rgba(201,160,32,0.55))',
            }}>MPS</div>
            <div style={{ width: '72%', height: '1px', background: 'linear-gradient(90deg, transparent 0%, rgba(150,150,150,0.3) 15%, rgba(190,190,190,0.85) 35%, rgba(220,220,220,1) 50%, rgba(190,190,190,0.85) 65%, rgba(150,150,150,0.3) 85%, transparent 100%)', margin: '14px auto 13px', boxShadow: '0 0 6px rgba(150,150,150,0.9), 0 0 18px rgba(150,150,150,0.4)' }} />
            <div style={{ fontSize: '11px', letterSpacing: '5px', color: '#b09878', fontWeight: 400, marginBottom: '13px', fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>MODULAR PERFORMANCE SYSTEMS</div>
            <div style={{ fontSize: '22px', letterSpacing: '5px', fontWeight: 400, fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
              <span style={{ color: GOLD, textShadow: '0 0 14px rgba(201,160,32,0.4)' }}>REST </span>
              <span style={{ color: PURPLE, textShadow: '0 0 14px rgba(150,150,150,0.6)' }}>&amp;</span>
              <span style={{ color: GOLD, textShadow: '0 0 14px rgba(201,160,32,0.4)' }}> RECOVERY</span>
            </div>
          </div>

          {/* Subtitle */}
          <div style={styles.subtitle}>
            {entries.length} {entries.length === 1 ? "entry" : "entries"} · tracking since{" "}
            {entries[0]?.date ? fmtDate(entries[0].date) : "today"}
          </div>

          {/* Persistent tab bar (matches the other trackers) */}
          <div style={{ display: "flex", borderBottom: "1px solid rgba(150,150,150,0.15)" }}>
            {[["dashboard","DASHBOARD"],["insights","INSIGHTS"],["log","LOG"]].map(([t,lbl]) => (
              <button key={t} onClick={() => setActiveTab(t)} style={{
                flex: 1, padding: "11px 4px", background: "none", border: "none",
                borderBottom: activeTab === t ? `2px solid ${PURPLE}` : "2px solid transparent",
                color: activeTab === t ? LBL : "#6b7280",
                fontFamily: "'Inter', system-ui, -apple-system, sans-serif", fontSize: 12, letterSpacing: "0.08em", fontWeight: 600, cursor: "pointer"
              }}>{lbl}</button>
            ))}
          </div>
          {/* Log-entry action */}
          <div style={{ marginTop: 14 }}>
            <button className="btn-primary" style={styles.btnPrimary} onClick={() => setShowForm(!showForm)}>
              <Plus size={16} /> {showForm ? "CLOSE" : "LOG ENTRY"}
            </button>
          </div>
        </header>

        {/* ── Entry Form ── */}
        {showForm && (
          <div style={styles.formCard}>
            <div style={styles.formGrid}>
              <Field label="Wake Time">
                <input type="time" value={form.wakeTime}
                  onChange={(e) => setForm({ ...form, wakeTime: e.target.value })}
                  style={styles.input} />
              </Field>
              <Field label="Date">
                <input type="date" value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  style={styles.input} />
              </Field>
              <Field label="Sleep Time">
                <input type="time" value={form.sleepTime}
                  onChange={(e) => setForm({ ...form, sleepTime: e.target.value })}
                  style={styles.input} />
              </Field>
              {/* Sleep Quality — the one genuinely new input in the v4 spec.
                  Old entries have no source for it and fall back to inverted
                  restlessness as a proxy. Capturing it directly makes the
                  score honest from here on. */}
              <Field label={`Sleep Quality · ${form.sleepQuality}/10`}>
                <input type="range" min="1" max="10" value={form.sleepQuality}
                  onChange={(e) => setForm({ ...form, sleepQuality: +e.target.value })}
                  style={{ ...styles.range, accentColor: PURPLE }} />
              </Field>
              <Field label={`Energy · ${form.energy}/10`}>
                <input type="range" min="1" max="10" value={form.energy}
                  onChange={(e) => setForm({ ...form, energy: +e.target.value })}
                  style={styles.range} />
              </Field>
              {/* 10 = fully recovered. Stored as soreness (inverted) so old entries stay valid. */}
              <Field label={`Physical Recovery · ${10 - form.soreness}/10`}>
                <input type="range" min="1" max="10" value={10 - form.soreness}
                  onChange={(e) => setForm({ ...form, soreness: 10 - +e.target.value })}
                  style={styles.range} />
              </Field>
              <Field label={`Mental Clarity · ${form.clarity}/10`}>
                <input type="range" min="1" max="10" value={form.clarity}
                  onChange={(e) => setForm({ ...form, clarity: +e.target.value })}
                  style={{ ...styles.range, accentColor: PURPLE }} />
              </Field>
              {/* 10 = slept calm and still. Stored as restlessness (inverted) for back-compat. */}
              <Field label={`Calmness · ${10 - form.restlessness}/10`}>
                <input type="range" min="1" max="10" value={10 - form.restlessness}
                  onChange={(e) => setForm({ ...form, restlessness: 10 - +e.target.value })}
                  style={{ ...styles.range, accentColor: PURPLE }} />
              </Field>
            </div>
            {/* BIOMETRICS (Resting HR + HRV) INTENTIONALLY REMOVED — they are not in the locked v3.0
                spec and hand-typing them every morning is friction with no payoff. Bring them back when
                real wearable sync lands. Existing restingHR/hrv values stay in storage untouched (the
                edit form still carries them through on save), so nothing is lost when they return. */}
            <div style={styles.formFoot}>
              <div style={styles.preview}>
                {form.sleepTime ? (
                  <>
                    Duration: <strong style={{ color: PURPLE }}>{calcHours(form.sleepTime, form.wakeTime)}h</strong>
                    {" · "}
                    Recovery: <strong style={{ color: GOLD }}>
                      {__CORE ? "🔒 Premium" : calcRecovery(calcHours(form.sleepTime, form.wakeTime), form.energy, form.soreness, form.clarity, form.restlessness) + "%"}
                    </strong>
                  </>
                ) : (
                  <span style={{ color: "#8a7d6b", fontStyle: "italic" }}>
                    Sleep time empty — add later to calculate recovery
                  </span>
                )}
              </div>
              <button className="btn-primary" style={styles.btnPrimary} onClick={saveEntry}>SAVE</button>
            </div>
            {saveError && (
              <div style={{ marginTop: 12, padding: 8, background: __GRAY ? "#1a1a1a" : "#2a1010", border: __GRAY ? "1px solid #444" : "1px solid #8b3a3a", color: __GRAY ? "#bbbbbb" : "#e8a0a0", fontSize: 11, fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
                {saveError}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════
            DASHBOARD TAB
            ══════════════════════════════════════════ */}
        {activeTab === "dashboard" && (
          <>
            {/* Today snapshot */}
            <section style={styles.todayCard}>
              <div style={styles.eyebrow}>TODAY · {fmtDate(todayStr())}</div>
              <div style={styles.todayGrid}>
                <TodayStat icon={<IconSun />}       label="Woke"     value={today?.wakeTime ? fmt12(today.wakeTime) : "—"} accent={PURPLE} />
                <TodayStat icon={<IconMoon />}      label="Slept"    value={today?.hours != null ? `${today.hours}h` : "—"} accent={PURPLE} />
                <TodayStat icon={<IconZap />}       label="Energy"   value={today ? `${today.energy}/10` : "—"}  accent={PURPLE} />
                <TodayStat icon={<IconHeart />}     label="Physical Recovery" value={today ? `${today.physicalRecovery}/10` : "—"} accent={PURPLE} />
                <TodayStat icon={<IconActivity />}  label="Clarity"  value={today ? `${today.clarity}/10` : "—"}  accent={PURPLE} />
                <TodayStat icon={<IconBattery />}   label="Recovery" value={__CORE ? "🔒" : (today?.recovery != null ? `${today.recovery}%` : "—")} accent={PURPLE} />
              </div>
              {!today && <div style={{...styles.empty, marginTop: 8}}>No entry yet — tap + LOG ENTRY to start.</div>}
            </section>

            {__CORE ? (
              <section style={{ padding: "8px 0 4px", textAlign: "center" }}>
                <div style={{ marginBottom: 10, color: "#C9A020" }}><svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#f5f5f5", letterSpacing: 1, marginBottom: 8 }}>TRENDS ARE AN ELITE FEATURE</div>
                <div style={{ fontSize: 13, color: "#9a9a9a", lineHeight: 1.6, marginBottom: 20, maxWidth: 300, marginLeft: "auto", marginRight: "auto" }}>Your nightly log is saved. Unlock charts and 7-day averages to see the patterns.</div>
                <a href="/billing.html" target="_top" style={{ display: "inline-block", padding: "12px 26px", background: "#C9A020", color: "#0a0a0a", fontWeight: 800, fontSize: 13, letterSpacing: 1, borderRadius: 10, textDecoration: "none" }}>↑ UNLOCK WITH ELITE</a>
              </section>
            ) : (<>
            {/* Today: engine score, dots, status, push meter */}
            <CelebrationOverlay level={celebration} rows={engineRows}
              onClose={() => {
                // markCelebrated is what guarantees a milestone fires once
                // and never again, even across devices and reloads.
                try { RecoveryReports.markCelebrated(RecoveryEngineUser(), celebration.id); } catch (err) {}
                setCelebration(null);
              }} />
            <TodayCard e={enriched[enriched.length - 1]} />
            {/* Why this score — coaching from the user's own numbers */}
            {/* Today's Plan — the weakest metric and one action for it */}
            <PlanCard e={enriched[enriched.length - 1]} onSave={saveAction} />
            {/* What today's numbers say — strongest, weakest, what moved */}
            <InsightsCard rows={engineRows} />
            <CoachCard rows={engineRows} />
            {/* 7-day stats */}
            <section style={styles.statsRow}>
              <StatBlock label="Avg Sleep"    value={`${stats.hours}h`}        sub="7-day" trend={trend("hours")}    good="up" />
              <StatBlock label="Avg Energy"   value={`${stats.energy}/10`}     sub="7-day" trend={trend("energy")}   good="up" />
              <StatBlock label="Avg Clarity"  value={`${stats.clarity}/10`}    sub="7-day" trend={trend("clarity")}  good="up" />
              <StatBlock label="Avg Physical Recovery" value={`${stats.physicalRecovery}/10`} sub="7-day" trend={trend("physicalRecovery")} good="up" />
              <StatBlock label="Avg Recovery" value={`${stats.recovery}%`}     sub="7-day" trend={trend("recovery")} good="up" />
            </section>

            {/* Progressive unlocks — weekly through lifetime */}
            {/* Long-run tracking — averages, streaks, next milestone */}
            <ProgressCard rows={engineRows} />
            <ReportsCard rows={engineRows} />

            {/* Charts */}
            <section style={styles.chartsGrid}>

              {/* Sleep Duration — pure SVG, always renders */}
              <ChartCard title="Sleep Duration" sub="hours per night"
                allRows={enriched} get={r => r.hours} fmt={v => `${v.toFixed(1)}h`}
                domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} refY={7} />

              <ChartCard title="Recovery Score" sub="%"
                allRows={enriched} get={r => r.recovery} fmt={v => `${Math.round(v)}%`}
                domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} refY={80} />

              {/* Bedtime uses the engine's 6pm-anchored axis, so 1am plots
                  LATER than 11pm instead of leaping to the far end. A plain
                  midnight axis turns a gradual drift later into a cliff. */}
              <ChartCard title="Bedtime" sub="when you went to bed" kind="clock"
                allRows={enriched} get={r => r.bedAxis}
                fmt={v => RecoveryCharts.bedFromAxis(v)}
                domain={[0, 720]} ticks={[0, 180, 360, 540, 720]} />

              <ChartCard title="Wake Time" sub="when you got up" kind="clock"
                allRows={enriched} get={r => r.wakeAxis}
                fmt={v => RecoveryCharts.fmtClock(v)}
                domain={[180, 600]} ticks={[180, 300, 420, 540]} />

              <ChartCard title="Energy" sub="1–10 scale"
                allRows={enriched} get={r => r.energy} fmt={v => `${v.toFixed(1)} / 10`}
                domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} />
            </section>
            {__PREMIUM && <DevicesCard />}
            </>)}
          </>
        )}

        {/* ══════════════════════════════════════════
            INSIGHTS TAB
            ══════════════════════════════════════════ */}
        {activeTab === "insights" && __CORE && (
          <section style={{ padding: "4px 0", textAlign: "center" }}>
            <div style={{ fontSize: 34, marginBottom: 10 }}><svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#f5f5f5", letterSpacing: 1, marginBottom: 8 }}>INSIGHTS ARE AN ELITE FEATURE</div>
            <div style={{ fontSize: 13, color: "#9a9a9a", lineHeight: 1.6, marginBottom: 20, maxWidth: 300, marginLeft: "auto", marginRight: "auto" }}>Unlock sleep trends, recovery scores, and weekly insights. Logging stays free — upgrade to see the patterns.</div>
            <a href="/billing.html" target="_top" style={{ display: "inline-block", padding: "12px 26px", background: "#C9A020", color: "#0a0a0a", fontWeight: 800, fontSize: 13, letterSpacing: 1, borderRadius: 10, textDecoration: "none" }}>↑ UNLOCK WITH ELITE</a>
          </section>
        )}
        {activeTab === "insights" && !__CORE && (
          <section style={{ padding: "4px 0" }}>
            <div style={styles.eyebrow}>WEEKLY INSIGHTS</div>
            <div style={{ fontSize: 26, fontWeight: 800, fontFamily: "'Inter', system-ui, -apple-system, sans-serif", color: "#f5f5f5", marginBottom: 20, letterSpacing: "-0.01em" }}>
              This Week
            </div>
            <InsightRow label="Average Wake Time"   value={insights.avgWakeFormatted  || "—"} accent={GOLD} />
            <InsightRow label="Average Bedtime"     value={insights.avgSleepFormatted || "—"} accent={PURPLE} />
            <InsightRow label="Average Duration"    value={insights.avgDuration       || "—"} accent={GOLD} />
            <InsightRow label="Average Energy"      value={insights.avgEnergy         || "—"} accent={GOLD} />
            <InsightRow label="Average Clarity"     value={insights.avgClarity        || "—"} accent={PURPLE} />
            <InsightRow label="Avg Physical Recovery" value={insights.avgPhysRecovery  || "—"} accent={GOLD} />
            <InsightRow label="Best Recovery Day"   value={insights.bestDay  ? `${dayOfWeek(insights.bestDay.date)} · ${insights.bestDay.recovery}%`  : "—"} accent={GOLD} />
            <InsightRow label="Lowest Recovery Day" value={insights.worstDay ? `${dayOfWeek(insights.worstDay.date)} · ${insights.worstDay.recovery}%` : "—"} accent={PURPLE} />
          </section>
        )}

        {/* ══════════════════════════════════════════
            LOG TAB
            ══════════════════════════════════════════ */}
        {activeTab === "log" && (
          <div>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontFamily: "'Inter', system-ui, -apple-system, sans-serif", letterSpacing: "0.18em", color: PURPLE, textTransform: "uppercase" }}>{__PREMIUM ? "Full Log" : "Recent Log"}</div>
              <div style={{ fontSize: 10, fontFamily: "'Inter', system-ui, -apple-system, sans-serif", color: LBL }}>{(__PREMIUM ? enriched : enriched.filter(e => e.date >= HISTORY_CAP_CUTOFF)).length} {(__PREMIUM ? enriched : enriched.filter(e => e.date >= HISTORY_CAP_CUTOFF)).length === 1 ? "entry" : "entries"}</div>
            </div>

            {(() => {
              /* 60-day history cap for Core/Elite (Premium sees everything). */
              const capEntries = __PREMIUM ? enriched : enriched.filter(e => e.date >= HISTORY_CAP_CUTOFF);
              const capHidden = enriched.length - capEntries.length;
              if (capEntries.length === 0) return (<div style={{textAlign:'center',padding:'34px 18px'}}><div style={{fontSize:30,marginBottom:8}}>🌙</div><div style={{fontSize:15,fontWeight:700,color:'#e8e4f0',marginBottom:4}}>{__PREMIUM ? "No sleep logged yet" : "No entries in the last 60 days"}</div><div style={{fontSize:13,color:'#8a7fa5',marginBottom:16}}>Track a night and your recovery shows up here.</div><button onClick={() => { const b=[...document.querySelectorAll('button')].find(x=>/log entry/i.test(x.textContent||'')); if(b)b.click(); }} style={{padding:'11px 20px',borderRadius:10,border:'1px solid #8b5cf6',background:'rgba(139,92,246,0.14)',color:'#a78bfa',fontWeight:700,fontSize:13,cursor:'pointer'}}>Log your first night →</button></div>);
              /* Group capped entries by month, newest first */
              const byMonth = {};
              [...capEntries].reverse().forEach(e => {
                const m = e.date.slice(0, 7);
                if (!byMonth[m]) byMonth[m] = [];
                byMonth[m].push(e);
              });
              const todayWs = dateToStr(startOfWeek(todayStr()));

              return (<React.Fragment>
              {capHidden > 0 && (
                <div style={{ textAlign: "center", padding: "14px 18px", marginBottom: 14, background: "rgba(201,160,32,0.08)", border: "1px solid rgba(201,160,32,0.35)", borderRadius: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#C9A020", letterSpacing: "0.04em" }}>Showing your last 60 days</div>
                  <div style={{ fontSize: 11, color: "#9a9a9a", marginTop: 4, lineHeight: 1.5 }}>Upgrade to <b style={{ color: "#C9A020" }}>Premium</b> to see your full sleep history.</div>
                  <a href="/billing.html" target="_top" style={{ display: "inline-block", marginTop: 8, padding: "7px 18px", background: "#C9A020", color: "#0a0a0a", fontWeight: 800, fontSize: 11, letterSpacing: "0.04em", borderRadius: 8, textDecoration: "none" }}>↑ Unlock full history</a>
                </div>
              )}
              {Object.entries(byMonth).map(([month, mes]) => (
                <div key={month} style={{ background: "rgba(18,18,20,0.85)", border: "1px solid rgba(150,150,150,0.15)", borderRadius: 12, marginBottom: 12, overflow: "hidden" }}>
                  {/* Month header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid rgba(150,150,150,0.08)" }}>
                    <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "'Inter', system-ui, -apple-system, sans-serif", color: "#f5f5f5" }}>
                      {fmtMonth(month + "-01")}
                    </div>
                    <div style={{ fontSize: 10, fontFamily: "'Inter', system-ui, -apple-system, sans-serif", color: LBL }}>
                      {mes.length} {mes.length === 1 ? "entry" : "entries"} ∨
                    </div>
                  </div>

                  {/* Week groups */}
                  {(() => {
                    const byWeek = {};
                    mes.forEach(e => {
                      const ws = dateToStr(startOfWeek(e.date));
                      if (!byWeek[ws]) byWeek[ws] = [];
                      byWeek[ws].push(e);
                    });
                    return Object.entries(byWeek).map(([ws, wes]) => {
                      const wsDate = toDate(ws);
                      const isCurrent = ws === todayWs;
                      return (
                        <div key={ws} style={{ padding: "10px 12px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                            <div style={{ fontSize: 9, fontFamily: "'Inter', system-ui, -apple-system, sans-serif", letterSpacing: "0.14em", color: LBL, textTransform: "uppercase" }}>
                              Week of {fmtWeekRange(wsDate)}
                            </div>
                            {isCurrent && (
                              <div style={{ fontSize: 9, fontFamily: "'Inter', system-ui, -apple-system, sans-serif", letterSpacing: "0.1em", color: PURPLE, background: "rgba(150,150,150,0.12)", border: "1px solid rgba(150,150,150,0.3)", borderRadius: 4, padding: "2px 8px" }}>
                                CURRENT
                              </div>
                            )}
                          </div>
                          {wes.map(e => (
                            <LogCard key={e.date} e={e}
                              onEdit={() => editEntry(e)}
                              onDelete={() => deleteEntry(e.date)}
                            />
                          ))}
                        </div>
                      );
                    });
                  })()}
                </div>
              ))}
              </React.Fragment>);
            })()}
          </div>
        )}

      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ══════════════════════════════════════════════════════════ */

/* Field — form label wrapper */
const Field = ({ label, children }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
    <label style={{ fontSize: 10, fontFamily: "'Inter', system-ui, -apple-system, sans-serif", letterSpacing: "0.12em", color: PURPLE, textTransform: "uppercase" }}>
      {label}
    </label>
    {children}
  </div>
);

/* DevicesCard — Premium "connect a wearable" UI. Integration-ready: the pairing
   options are present and the flow is glitch-free, but it does NOT fake a sync.
   Live providers (Oura/Fitbit/etc.) wire into a real OAuth backend in Phase 2;
   for now "Notify me" registers interest so the user can opt in seamlessly. */
const WEARABLES = [
  { id:"apple",  name:"Apple Health / Watch", note:"Needs the MPS iPhone app (in development)" },
  { id:"oura",   name:"Oura Ring",            note:"HRV · sleep · readiness" },
  { id:"fitbit", name:"Fitbit",               note:"Sleep · heart rate · steps" },
  { id:"garmin", name:"Garmin",               note:"Sleep · HRV · training" },
  { id:"whoop",  name:"Whoop",                note:"Recovery · strain · sleep" },
  { id:"galaxy", name:"Samsung Galaxy Watch", note:"Sleep · HRV · heart rate" },
];
const DevicesCard = () => {
  const [interest, setInterest] = useState({});
  useEffect(() => { try { const raw = localStorage.getItem("rr_sleep:wearable_interest"); if (raw) setInterest(JSON.parse(raw)); } catch (e) {} }, []);
  const toggle = (id) => {
    const next = { ...interest, [id]: !interest[id] };
    setInterest(next);
    try { localStorage.setItem("rr_sleep:wearable_interest", JSON.stringify(next)); } catch (e) {}
    try { if (window.storage && window.storage.set) window.storage.set("wearable_interest", JSON.stringify(next)); } catch (e) {}
    // Tell Jeff what people actually want: record the current selection in MailerLite (grouped by device).
    try {
      const u = (window.firebase && firebase.auth && firebase.auth().currentUser) || null;
      const email = u && u.email;
      if (email) {
        const devices = WEARABLES.filter(w => next[w.id]).map(w => w.name);
        fetch("/api/wearable-interest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email, device: (WEARABLES.find(w => w.id === id) || {}).name, devices: devices })
        }).catch(() => {});
      }
    } catch (e) {}
  };
  const FONT = "'Inter', system-ui, -apple-system, sans-serif";
  return (
    <section style={{ background: "rgba(18,18,20,0.85)", border: "1px solid rgba(150,150,150,0.15)", borderRadius: 14, padding: "16px 18px", marginTop: 14 }}>
      <div style={{ fontSize: 10, fontFamily: FONT, letterSpacing: "0.18em", color: LBL, textTransform: "uppercase", marginBottom: 8 }}>Devices &amp; Wearables</div>
      <div style={{ fontSize: 12, fontFamily: FONT, color: "#8a8f99", lineHeight: 1.5, marginBottom: 6 }}>Auto-fill your biometrics from a device. Live sync is in development — tap <b style={{ color: GOLD }}>Notify me</b> and we'll let you know the moment your device connects.</div>
      {WEARABLES.map((wv, i) => (
        <div key={wv.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 0", borderTop: i === 0 ? "none" : "1px solid rgba(150,150,150,0.12)" }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontFamily: FONT, color: "#f5f5f5", fontWeight: 600 }}>{wv.name}</div>
            <div style={{ fontSize: 11, fontFamily: FONT, color: "#6b7280", marginTop: 2 }}>{wv.note}</div>
          </div>
          <button onClick={() => toggle(wv.id)} style={{ flexShrink: 0, padding: "8px 14px", borderRadius: 8, fontFamily: FONT, fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", cursor: "pointer", whiteSpace: "nowrap", border: `1px solid ${interest[wv.id] ? GOLD : (__GRAY ? "rgba(255,255,255,0.22)" : "rgba(155,107,201,0.55)")}`, background: interest[wv.id] ? GOLD : "transparent", color: interest[wv.id] ? "#0a0a0a" : LBL }}>{interest[wv.id] ? "✓ Notify on" : "Notify me"}</button>
        </div>
      ))}
    </section>
  );
};

/* TodayStat — stat card in the Today snapshot grid */
const TodayStat = ({ icon, label, value, accent }) => (
  <div style={{
    background: "rgba(18,18,20, 0.85)",
    border: `1px solid rgba(${BRDR},0.22)`,
    borderLeft: `3px solid rgba(${BRDR},0.6)`,
    borderRadius: 10,
    padding: "14px 16px",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  }}>
    <div style={{
      display: "flex", alignItems: "center", gap: 6,
      fontSize: 12, fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      letterSpacing: "0.14em", color: LBL,
      textTransform: "uppercase",
    }}>
      <span style={{ color: PURPLE, display: "flex", alignItems: "center" }}>{icon}</span>
      {label}
    </div>
    <div style={{
      fontSize: 22, fontWeight: 700, lineHeight: 1,
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      color: value === "—" ? "#4a4a4a" : "#f5f5f5",
    }}>
      {value}
    </div>
  </div>
);

/* Module-level time formatter — mirrors fmt12 inside App */
function _fmt12(t) {
  if (!t) return "—";
  const [h, m] = t.split(":").map(Number);
  const p = h >= 12 ? "PM" : "AM";
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, "0")} ${p}`;
}

/* TodayCard — Recovery Engine v4.0 dashboard (spec Parts 6, 7, 10, 17).
   Answers "how recovered am I today, and how hard should I go", which the
   7-day averages below never did.
   Reads the newest entry's engine values and calculates NOTHING itself,
   so it can never disagree with the score shown elsewhere. */
const TodayCard = ({ e }) => {
  if (!e || !e.v4) return null;
  const hex  = e.dotHex || PURPLE;
  const dots = "●".repeat(e.dotCount) + "○".repeat(5 - e.dotCount);
  return (
    <section style={{ background: "rgba(18,18,20,0.85)", border: `1px solid rgba(${BRDR},0.13)`,
                      borderRadius: 12, padding: "20px 16px", marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                    fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase",
                    color: LBL, marginBottom: 14 }}>
        <span>Today</span><span>{e.weekday}</span>
      </div>

      <div style={{ fontSize: 64, fontWeight: 800, lineHeight: 0.9, letterSpacing: "-0.03em",
                    textAlign: "center", color: hex }}>
        {e.recovery}<span style={{ fontSize: 24, opacity: 0.5 }}>%</span>
      </div>

      {/* Five dots always, filled to the tier (spec Part 6) */}
      <div style={{ textAlign: "center", letterSpacing: 9, fontSize: 18,
                    color: hex, margin: "14px 0 10px" }}>{dots}</div>

      <div style={{ textAlign: "center", fontSize: 17, fontWeight: 800,
                    letterSpacing: "0.12em", color: hex }}>{e.recoveryStatus}</div>

      <div style={{ textAlign: "center", fontSize: 10, letterSpacing: "0.1em",
                    textTransform: "uppercase", color: LBL, marginTop: 5 }}>
        Grade {e.recoveryGrade} · slept {e.hours}h
      </div>

      {/* Push Meter — how hard to go today (spec Part 7) */}
      <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(150,150,150,0.12)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
          <span style={{ fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: LBL }}>
            Push Meter
          </span>
          <span style={{ fontSize: 22, fontWeight: 800, color: hex, whiteSpace: "nowrap" }}>
            {e.pushMeter}<span style={{ fontSize: 12, color: LBL }}> / 10</span>
          </span>
        </div>
        <div style={{ display: "flex", gap: 4, margin: "10px 0 9px" }}>
          {[0,1,2,3,4,5,6,7,8,9].map(i => (
            <i key={i} style={{ flex: 1, height: 6, borderRadius: 2,
                 background: i < e.pushMeter ? hex : "rgba(255,255,255,0.08)" }} />
          ))}
        </div>
        <div style={{ fontSize: 12, color: "#9a9a9a" }}>{e.pushMessage}</div>
      </div>
    </section>
  );
};

/* CelebrationOverlay — milestone card (spec Part 14).
   Gold sparkle burst, card pop-in, the user's own progress, one CTA.
   Fires from the SAVE path only, and markCelebrated means a milestone can
   never fire twice. Keyframes are scoped here because sleep.css is not
   linked into this page and index.html is generated. */
const CelebrationOverlay = ({ level, rows, onClose }) => {
  if (!level) return null;
  let data = null;
  try { data = RecoveryReports.celebrationData(level, rows || []); } catch (e) {}
  const sparks = Array.from({ length: 14 }, (_, i) => i);

  const Row = ({ label, value }) => (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 13,
                  padding: "9px 0", borderTop: "1px solid rgba(150,150,150,0.15)", textAlign: "left" }}>
      <span style={{ color: "#8a7fa5" }}>{label}</span>
      <b style={{ fontSize: 15, color: GOLD, fontWeight: 800, whiteSpace: "nowrap" }}>{value}</b>
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.82)",
                  display: "grid", placeItems: "center", padding: 20 }}
         onClick={onClose} role="dialog" aria-label={level.headline}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes mpsCelPop{from{opacity:0;transform:scale(.86) translateY(14px)}to{opacity:1;transform:none}}
        @keyframes mpsCelSpark{0%{opacity:0;transform:rotate(var(--a)) translateY(0) scale(.4)}
          35%{opacity:1}100%{opacity:0;transform:rotate(var(--a)) translateY(calc(var(--d)*-1)) scale(.9)}}
        @media(prefers-reduced-motion:reduce){.mps-cel-card{animation:none!important}.mps-cel-burst{display:none}}
      ` }} />
      <div className="mps-cel-card" onClick={(ev) => ev.stopPropagation()}
           style={{ position: "relative", background: "#111",
                    border: "1px solid rgba(201,160,32,0.4)", borderRadius: 16,
                    padding: "32px 26px 26px", maxWidth: 380, width: "100%",
                    textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.7)",
                    animation: "mpsCelPop .45s cubic-bezier(.2,.9,.3,1.3) both" }}>
        <div className="mps-cel-burst" style={{ position: "absolute", top: 34, left: "50%",
                                                width: 0, height: 0, pointerEvents: "none" }}>
          {sparks.map(i => (
            <i key={i} style={{ position: "absolute", width: 4, height: 4, borderRadius: "50%",
              background: GOLD, opacity: 0,
              "--a": `${i * (360 / 14)}deg`, "--d": `${40 + (i % 4) * 14}px`,
              animation: `mpsCelSpark 1.1s ease-out ${(i % 5) * 40}ms both` }} />
          ))}
        </div>

        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.16em",
                      textTransform: "uppercase", color: GOLD, marginBottom: 10 }}>
          {level.days} Days Complete
        </div>
        <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.01em", marginBottom: 9 }}>
          {level.headline}
        </div>
        <div style={{ fontSize: 14, color: "#9a9a9a", lineHeight: 1.5, marginBottom: 18 }}>
          {level.message}
        </div>

        {data && (
          <div>
            <Row label="Recovery Score" value={`${data.scoreFrom}% → ${data.scoreTo}%`} />
            <Row label="Average sleep"  value={`${data.sleepFrom} → ${data.sleepTo}`} />
            {data.mover && (
              <Row label="Biggest move"
                   value={`${data.mover.label} ${data.mover.delta >= 0 ? "+" : ""}${data.mover.delta}`} />
            )}
          </div>
        )}

        <div style={{ fontSize: 13, color: "#9a9a9a", margin: "18px 0 16px" }}>Keep building.</div>
        <button onClick={onClose}
          style={{ width: "100%", background: GOLD, color: "#0a0a0a", border: 0,
                   borderRadius: 10, padding: "13px 20px", fontWeight: 800, fontSize: 13,
                   letterSpacing: "0.06em", cursor: "pointer", minHeight: 46 }}>
          View {level.title}
        </button>
      </div>
    </div>
  );
};

/* PlanCard — Today's Plan and action selector (spec Parts 8, 9, 10).
   The weakest metric picks the category; the user picks the action.
   Changing the action clears a stale tick, so a checkmark can never carry
   over onto a different action. */
const PlanCard = ({ e, onSave }) => {
  if (!e || !e.v4 || !window.RecoveryActions) return null;
  const metric = e.v4.lowestMetric;
  const actions = RecoveryActions.forMetric(metric);
  if (!actions || !actions.length) return null;
  const chosen = e.selectedAction || "";
  const done = !!e.actionCompleted;
  const hex = e.dotHex || PURPLE;

  return (
    <section style={{ background: "rgba(255,255,255,0.02)", border: `1px solid rgba(${BRDR},0.13)`,
                      borderRadius: 10, padding: "14px 16px", marginBottom: 14 }}>
      <div style={{ fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase",
                    color: LBL, marginBottom: 6 }}>Today&rsquo;s Plan</div>
      <div style={{ fontSize: 14, lineHeight: 1.45, marginBottom: 12, color: "#f5f5f5" }}>
        {RecoveryActions.planMessage(metric)}
      </div>

      <select value={chosen}
        onChange={(ev) => onSave(e.date, { selectedAction: ev.target.value || null, actionCompleted: false })}
        style={{ width: "100%", background: "rgba(150,150,150,0.06)",
                 border: `1px solid rgba(${BRDR},0.2)`, borderRadius: 8, color: "#f5f5f5",
                 padding: "12px 14px", fontSize: 15, minHeight: 46,
                 fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
        <option value="">Choose an action</option>
        {actions.map(a => <option key={a} value={a}>{a}</option>)}
      </select>

      <label style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 14,
                      minHeight: 44, cursor: chosen ? "pointer" : "not-allowed",
                      opacity: chosen ? 1 : 0.5, userSelect: "none" }}>
        <input type="checkbox" checked={done} disabled={!chosen}
          onChange={(ev) => onSave(e.date, { actionCompleted: ev.target.checked })}
          style={{ position: "absolute", opacity: 0, width: 0, height: 0 }} />
        <span style={{ width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                       border: `2px solid ${done ? hex : "rgba(255,255,255,0.22)"}`,
                       background: done ? hex : "transparent",
                       display: "grid", placeItems: "center" }}>
          {done && <svg viewBox="0 0 24 24" style={{ width: 13, height: 13, fill: "none",
            stroke: "#0a0a0a", strokeWidth: 3.4, strokeLinecap: "round", strokeLinejoin: "round" }}>
            <path d="M4 12l5 5L20 6" /></svg>}
        </span>
        <span style={{ fontSize: 14, color: done ? "#f5f5f5" : "#9a9a9a" }}>
          {done ? "Done today. Good work." : chosen ? "Complete today's action" : "Pick an action first"}
        </span>
      </label>
    </section>
  );
};

/* Shared bits for the collapsible engine sections (spec Part 17:
   collapsed by default, one tap reveals one layer). */
const SectionShell = ({ title, hint, children, open }) => (
  <section style={{ background: "rgba(255,255,255,0.02)", border: `1px solid rgba(${BRDR},0.13)`,
                    borderRadius: 10, padding: "6px 16px 14px", marginBottom: 14 }}>
    <details open={!!open}>
      <summary style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                        gap: 12, cursor: "pointer", padding: "12px 0", listStyle: "none" }}>
        <span style={{ fontSize: 15, fontWeight: 800, color: "#f5f5f5" }}>{title}</span>
        <span style={{ fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: LBL }}>
          {hint}
        </span>
      </summary>
      {children}
    </details>
  </section>
);

const EngineTile = ({ label, value, wide }) => (
  <div style={{ background: "rgba(150,150,150,0.06)", border: `1px solid rgba(${BRDR},0.12)`,
                borderLeft: "3px solid rgba(150,150,150,0.55)", borderRadius: 8,
                padding: "8px 10px", gridColumn: wide ? "1 / -1" : "auto" }}>
    <div style={{ fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase",
                  color: LBL, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 15, fontWeight: 700, color: "#f5f5f5" }}>{value}</div>
  </div>
);

/* InsightsCard — spec Part 10, section 7.
   Strongest and weakest metric today, what moved most since yesterday,
   the current pattern, and the trend. Derived, never recalculated. */
const InsightsCard = ({ rows }) => {
  if (!rows || !rows.length || !window.RecoveryInsights) return null;
  let items = null;
  try { items = RecoveryInsights.build(rows[rows.length - 1], rows); }
  catch (e) { return null; }
  if (!items || !items.length) return null;
  return (
    <SectionShell title="Insights" hint={`${items.length} today`}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8, marginTop: 4 }}>
        {items.map(i => <EngineTile key={i.key} label={i.label} value={i.value} />)}
      </div>
    </SectionShell>
  );
};

/* ProgressCard — spec Part 10, section 9.
   Long-run tracking. Current streak is deliberately separate from longest
   streak: they answer different questions. */
const ProgressCard = ({ rows }) => {
  if (!rows || !rows.length || !window.RecoveryInsights) return null;
  let p = null;
  try { p = RecoveryInsights.progress(rows); } catch (e) { return null; }
  if (!p) return null;
  return (
    <SectionShell title="Progress" hint={`${p.daysTracked} ${p.daysTracked === 1 ? "day" : "days"}`}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 4 }}>
        <EngineTile label="Average"        value={`${p.average}%`} />
        <EngineTile label="Highest"        value={`${p.highest}%`} />
        <EngineTile label="Lowest"         value={`${p.lowest}%`} />
        <EngineTile label="Current streak" value={p.currentStreak} />
        <EngineTile label="Longest streak" value={p.longestStreak} />
        <EngineTile label="Consistency"    value={`${p.consistency}%`} />
        <EngineTile label="7-day average"  value={`${p.weeklyAverage}%`} />
        <EngineTile label="30-day average" value={`${p.monthlyAverage}%`} />
        <EngineTile label="Days tracked"   value={p.daysTracked} />
        <EngineTile wide label="Next milestone" value={
          p.nextMilestone
            ? `${p.nextMilestone.remaining} more ${p.nextMilestone.remaining === 1 ? "day" : "days"} to your ${p.nextMilestone.title}`
            : "Every milestone unlocked"} />
      </div>
    </SectionShell>
  );
};

/* CoachCard — Recovery Engine v4.0 coaching (spec Parts 11, 12).
   Explains WHY today's score is what it is, using the user's own numbers.
   62 templates with conditions and cooldowns live in the engine; this
   only renders the winner.
   commit:false — merely viewing the page must not burn a template's
   cooldown, or a refresh would churn through the library. */
const CoachCard = ({ rows }) => {
  if (!rows || !rows.length || !window.RecoveryCoaching) return null;
  let c = null;
  try { c = RecoveryCoaching.select(rows[rows.length - 1], rows, { commit: false }); }
  catch (e) { return null; }
  if (!c || !c.primary) return null;
  const hex = (rows[rows.length - 1].dotHex) || PURPLE;
  return (
    <section style={{ background: "rgba(255,255,255,0.02)", border: `1px solid rgba(${BRDR},0.13)`,
                      borderRadius: 10, padding: "14px 16px", marginBottom: 14 }}>
      <div style={{ fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase",
                    color: LBL, marginBottom: 10 }}>Why this score</div>
      <div style={{ fontSize: 14, lineHeight: 1.55, color: "#f5f5f5",
                    paddingLeft: 12, borderLeft: `3px solid ${hex}` }}>
        {c.primary.text}
      </div>
      {c.secondary && c.secondary.length > 0 && (
        <details style={{ marginTop: 12 }}>
          <summary style={{ fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase",
                            color: LBL, cursor: "pointer", padding: "8px 0" }}>
            More detail
          </summary>
          {c.secondary.map((s, i) => (
            <div key={i} style={{ fontSize: 13, lineHeight: 1.55, color: "#9a9a9a",
                                  padding: "10px 0 0 12px",
                                  borderLeft: "1px solid rgba(150,150,150,0.2)", marginTop: 8 }}>
              {s.text}
            </div>
          ))}
        </details>
      )}
    </section>
  );
};

/* ReportsCard — Recovery Engine v4.0 progressive unlocks (spec Part 14).
   Seven levels from 7 days to multi-year. Shows what is unlocked, opens
   the chosen report inline, and tracks progress toward the next one. */
const ReportsCard = ({ rows }) => {
  const [open, setOpen] = useState(null);
  if (!rows || !window.RecoveryReports) return null;
  const n = rows.length;
  const R8 = RecoveryReports;
  const unlocked = R8.unlocked(n);
  const next = R8.nextLevel(n);
  let rep = null;
  if (open) { try { rep = R8.build(open, rows); } catch (e) { rep = null; } }
  const hex = rep ? RecoveryScoring.tier(rep.summary.averageScore).hex : PURPLE;

  return (
    <section style={{ background: "rgba(255,255,255,0.02)", border: `1px solid rgba(${BRDR},0.13)`,
                      borderRadius: 10, padding: "14px 16px", marginBottom: 14 }}>
      <div style={{ fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase",
                    color: LBL, marginBottom: 10 }}>
        Reports · {n} {n === 1 ? "entry" : "entries"}
      </div>

      {unlocked.length === 0 && (
        <div style={{ fontSize: 13, color: "#9a9a9a" }}>
          Seven days unlocks your first report.
        </div>
      )}

      {unlocked.map(l => (
        <button key={l.id} onClick={() => setOpen(open === l.id ? null : l.id)}
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                   width: "100%", background: open === l.id ? "rgba(155,107,201,0.14)" : "rgba(150,150,150,0.06)",
                   border: `1px solid rgba(${BRDR},${open === l.id ? "0.4" : "0.12"})`,
                   borderRadius: 8, padding: "12px 14px", marginBottom: 8, cursor: "pointer" }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#f5f5f5" }}>{l.title}</span>
          <span style={{ fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: LBL }}>
            {l.days} days
          </span>
        </button>
      ))}

      {next && (
        <div style={{ marginTop: 10 }}>
          <div style={{ height: 5, borderRadius: 99, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: 99, background: PURPLE,
                          width: `${Math.min(100, Math.round(n / next.days * 100))}%` }} />
          </div>
          <div style={{ fontSize: 12, color: "#8a7fa5", marginTop: 8 }}>
            {next.days - n} more {next.days - n === 1 ? "day" : "days"} to unlock your {next.title}.
          </div>
        </div>
      )}

      {rep && (
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid rgba(150,150,150,0.12)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline",
                        gap: 12, marginBottom: 12 }}>
            <span style={{ fontSize: 15, fontWeight: 800 }}>{rep.title}</span>
            <span style={{ fontSize: 26, fontWeight: 800, color: hex }}>
              {rep.summary.averageScore}%
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
            {rep.sections.map((s, i) => (
              <div key={i} style={{ background: "rgba(150,150,150,0.06)",
                                    border: `1px solid rgba(${BRDR},0.12)`,
                                    borderLeft: "3px solid rgba(150,150,150,0.55)",
                                    borderRadius: 8, padding: "8px 10px" }}>
                <div style={{ fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase",
                              color: LBL, marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#f5f5f5" }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

/* StatBlock — 7-day summary stat */
const StatBlock = ({ label, value, sub, trend, good }) => {
  // `good` names which DIRECTION is desirable ("up" or "down"). Color the arrow
  // green when the trend moves the desired way, red when it moves against it.
  const goodDir = good === "down" ? "down" : "up";   // default: rising is good
  const arrow = trend === "up" ? "↑" : trend === "down" ? "↓" : "—";
  const isGood = trend === goodDir;
  const arrowColor = trend === "flat" ? "#5a5264" : (isGood ? UP_CLR : DOWN_CLR);
  return (
    <div style={{
      flex: "1 1 calc(50% - 6px)", minWidth: 120,
      background: "rgba(18,18,20,0.85)", border: `1px solid rgba(${BRDR},0.12)`,
      borderRadius: 10, padding: "14px 16px",
    }}>
      <div style={{ fontSize: 10, fontFamily: "'Inter', system-ui, -apple-system, sans-serif", letterSpacing: "0.12em", color: LBL, textTransform: "uppercase", marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Inter', system-ui, -apple-system, sans-serif", color: "#f5f5f5", lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: 10, color: LBL, fontFamily: "'Inter', system-ui, -apple-system, sans-serif", marginTop: 4 }}>
        — {sub} <span style={{ color: arrowColor }}>{arrow}</span>
      </div>
    </div>
  );
};

/* InsightRow */
const InsightRow = ({ label, value, accent }) => (
  <div style={{
    display: "flex", justifyContent: "space-between", alignItems: "center",
    background: "rgba(255,255,255,0.03)", border: `1px solid rgba(${BRDR},0.13)`,
    borderRadius: 10, padding: "15px 18px", marginBottom: 8,
  }}>
    <span style={{ fontSize: 13, fontFamily: "'Inter', system-ui, -apple-system, sans-serif", letterSpacing: "0.13em", color: LBL, textTransform: "uppercase" }}>
      {label}
    </span>
    <span style={{ fontSize: 19, fontWeight: 700, fontFamily: "'Inter', system-ui, -apple-system, sans-serif", color: accent || PURPLE }}>
      {value}
    </span>
  </div>
);

/* LogBlock — single stat cell inside a log entry card */
const LogBlock = ({ label, value, accent, col }) => (
  <div style={{
    background: "rgba(150,150,150,0.06)",
    border: `1px solid rgba(${BRDR},0.12)`,
    borderLeft: "3px solid rgba(150,150,150,0.55)",
    borderRadius: 8, padding: "8px 10px",
    ...(col ? { gridColumn: col } : null),   // pin to a column so it stacks under the block above it
  }}>
    <div style={{ fontSize: 9, fontFamily: "'Inter', system-ui, -apple-system, sans-serif", letterSpacing: "0.12em", color: LBL, textTransform: "uppercase", marginBottom: 4 }}>
      {label}
    </div>
    <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "'Inter', system-ui, -apple-system, sans-serif", color: accent || "#f5f5f5", lineHeight: 1 }}>
      {value}
    </div>
  </div>
);

/* LogCard — full entry card with 7 stat blocks */
const LogCard = ({ e, onEdit, onDelete }) => (
  <div style={{
    background: "rgba(255,255,255,0.02)", border: `1px solid rgba(${BRDR},0.13)`,
    borderRadius: 10, padding: "14px 16px", marginBottom: 16,
  }}>
    {/* Date header */}
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "'Inter', system-ui, -apple-system, sans-serif", color: PURPLE }}>
          {e.date.split("-").slice(1).concat(e.date.split("-").slice(0,1)).join("/").replace(/(\d+)\/(\d+)\/(\d+)/, (_, m, d, y) => `${m.padStart(2,"0")}/${d.padStart(2,"0")}/${y}`)}
        </span>
        <span style={{ fontSize: 10, fontFamily: "'Inter', system-ui, -apple-system, sans-serif", letterSpacing: "0.14em", color: GOLD }}>
          {e.weekday}
        </span>
      </div>
      <div style={{ display: "flex", gap: 5 }}>
        <button style={{ background: "transparent", border: "1px solid rgba(150,150,150,0.2)", borderRadius: 5, padding: "4px 6px", cursor: "pointer", color: LBL, display: "flex", alignItems: "center" }} onClick={onEdit}><Pencil size={12} /></button>
        <button style={{ background: "transparent", border: "1px solid rgba(150,150,150,0.2)", borderRadius: 5, padding: "4px 6px", cursor: "pointer", color: __GRAY ? "#999999" : "#8b3a3a", display: "flex", alignItems: "center" }} onClick={onDelete}><Trash2 size={12} /></button>
      </div>
    </div>
    {/* Row 1: Wake · Bedtime · Duration. The entry is DATED BY THE WAKE DAY (calcHours rolls a
        later sleepTime back a day), so waking is the only value that happened on the header date.
        Leading with it keeps the card consistent with its own date. "Bedtime" (not "Sleep") makes
        clear it is the night before, and stops it reading like hours-slept. */}
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12.48, marginBottom: 12.48 }}>
      <LogBlock label="Wake Time"      value={_fmt12(e.wakeTime)} />
      <LogBlock label="Bed Time"       value={_fmt12(e.sleepTime)} />
      <LogBlock label="Sleep Duration" value={e.hours != null && e.hours > 0 ? `${e.hours}h` : "—"} accent={PURPLE} />
    </div>
    {/* Recovery · Energy · Physical Recovery / Clarity · Calmness. All 1-10 values read 10 = good.
        Resting HR + HRV are not displayed (see the form note) until wearable sync lands. */}
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12.48 }}>
      <LogBlock label="Recovery" value={__CORE ? "🔒" : (e.recovery != null ? `${e.recovery}%` : "—")} accent={GOLD} />
      <LogBlock label="Energy"   value={e.energy   != null ? `${e.energy}/10`   : "—"} />
      <LogBlock label="Clarity"  value={e.clarity  != null ? `${e.clarity}/10`  : "—"} accent={PURPLE} />
      <LogBlock label="Physical Recovery" value={e.soreness != null ? `${e.physicalRecovery}/10` : "—"} />
      <LogBlock label="Calmness" value={e.restlessness != null ? `${e.calmness}/10` : "—"} />
    </div>
  </div>
);


/* ── Pure SVG chart components — no external library, always renders ── */
const SvgChart = (() => {
  const PAD = { top: 12, right: 10, bottom: 46, left: 48 };
  const W = 600, H = 440;
  const pw = W - PAD.left - PAD.right;
  const ph = H - PAD.top - PAD.bottom;
  const ys = (v, min, max) => PAD.top + ph - ((v - min) / (max - min)) * ph;
  const xs = (i, n) => PAD.left + (i + 0.5) * (pw / n);

  const YAxisLines = ({ ticks, domain, fmt }) => {
    const [min, max] = domain;
    return <>{ticks.map(t => {
      const y = ys(t, min, max);
      return <g key={t}>
        <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth={1}/>
        <text x={PAD.left - 8} y={y + 5} textAnchor="end" fill="#f5f5f5" fontSize={16} fontFamily="'Inter', system-ui, -apple-system, sans-serif">{fmt ? fmt(t) : t}</text>
      </g>;
    })}</>;
  };

  const XLabels = ({ data }) => {
    const step = Math.max(1, Math.ceil(data.length / 7));
    return <>{data.map((d, i) => i % step === 0
      ? <text key={i} x={xs(i, data.length)} y={H - 6} textAnchor="middle" fill="#8a8a8a" fontSize={15} fontFamily="'Inter', system-ui, -apple-system, sans-serif">{d.label}</text>
      : null
    )}</>;
  };

  const Bar = ({ data, dataKey, domain, ticks, refY, fmt }) => {
    const [min, max] = domain;
    const bw = Math.max(3, pw / data.length * 0.6);
    return (
      <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",height:440,display:"block"}}>
        <defs>
          <linearGradient id="svgBarGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={BAR_TOP}/><stop offset="100%" stopColor={BAR_BOT}/>
          </linearGradient>
        </defs>
        <YAxisLines ticks={ticks} domain={domain} fmt={fmt}/>
        {refY != null && <line x1={PAD.left} y1={ys(refY,min,max)} x2={W-PAD.right} y2={ys(refY,min,max)} stroke={PURPLE} strokeDasharray="3 5" opacity={0.4}/>}
        {data.map((d, i) => {
          const v = d[dataKey]; if (v == null) return null;
          const bh = ((v - min) / (max - min)) * ph;
          return <rect key={i} x={xs(i,data.length)-bw/2} y={ys(v,min,max)} width={bw} height={bh} fill="url(#svgBarGrad)" rx={1}/>;
        })}
        <XLabels data={data}/>
      </svg>
    );
  };

  // `fmt` MUST be declared here, exactly like Bar above. The body passes fmt={fmt} down to
  // YAxisLines, and without it in the props that is a bare undeclared identifier, which throws
  // ReferenceError and blanks the entire Recovery pillar instead of skipping the optional formatter.
  const Lines = ({ data, lines, domain, ticks, refY, fmt }) => {
    const [min, max] = domain;
    const n = data.length;
    return (
      <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",height:440,display:"block"}}>
        <YAxisLines ticks={ticks} domain={domain} fmt={fmt}/>
        {refY != null && <line x1={PAD.left} y1={ys(refY,min,max)} x2={W-PAD.right} y2={ys(refY,min,max)} stroke={GOLD} strokeDasharray="3 5" opacity={0.35}/>}
        {lines.map(({key, stroke}) => {
          const pts = data.reduce((acc, d, i) => {
            const v = d[key]; if (v == null) return acc;
            return acc + (acc ? " " : "") + `${xs(i,n)},${ys(v,min,max)}`;
          }, "");
          return pts ? <polyline key={key} points={pts} fill="none" stroke={stroke} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round"/> : null;
        })}
        <XLabels data={data}/>
      </svg>
    );
  };

  return { Bar, Lines };
})();

/* ChartCard */
/* Turns a series into the engine's stats block plus a plain-English read.
   Reuses RecoveryCharts.stats so the maths lives in exactly one place. */
const chartDrill = (rows, get, fmt, kind) => {
  if (!window.RecoveryCharts || !rows || !rows.length) return null;
  const points = rows
    .map(r => ({ value: get(r) }))
    .filter(p => p.value !== null && p.value !== undefined && isFinite(p.value));
  if (points.length < 2) return null;
  const st = RecoveryCharts.stats(points, { format: fmt });
  if (!st) return null;

  // One sentence the user can act on, rather than six bare numbers.
  let insight;
  if (kind === "clock") {
    insight = st.consistency >= 85
      ? "Very consistent. Your body knows when this is coming."
      : st.consistency >= 65
        ? `Fairly consistent, drifting between ${st.lowestLabel} and ${st.highestLabel}.`
        : "All over the place. A steadier time here is the cheapest win available.";
  } else {
    const dir = st.trend === "rising" ? "up" : st.trend === "falling" ? "down" : "flat";
    insight = dir === "flat"
      ? `Holding steady around ${st.averageLabel}.`
      : `Trending ${dir}. Best ${st.highestLabel}, worst ${st.lowestLabel}.`;
  }
  return { st, insight };
};

const ChartCard = ({ title, sub, allRows, get, fmt, domain, ticks, refY, kind }) => {
  const [view, setView] = useState("daily");

  const rows = allRows || [];
  const views = window.RecoveryCharts ? RecoveryCharts.availableViews(rows.length) : ["daily"];
  const active = views.indexOf(view) > -1 ? view : "daily";

  // Daily shows the recent window; weekly and monthly aggregate the whole
  // history, because a 4-week trend built from 30 days is barely a trend.
  const source = active === "daily" ? rows.slice(-30) : rows;
  const chartCfg = { value: get, format: fmt };
  const points = window.RecoveryCharts
    ? RecoveryCharts.aggregate(source, chartCfg, active)
    : [];

  const drill = chartDrill(points, p => p.value, fmt, kind);
  const unit = active === "daily" ? "last 30 nights"
             : active === "weekly" ? "weekly averages" : "monthly averages";

  return (
    <div style={{
      background: "rgba(18,18,20,0.85)", border: `1px solid rgba(${BRDR},0.12)`,
      borderRadius: 12, padding: "16px", marginBottom: 12,
    }}>
      <div style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif", fontSize: 12, letterSpacing: "0.14em",
        textTransform: "uppercase", color: "#f5f5f5", marginBottom: 3 }}>
        {title}
      </div>
      {sub && <div style={{ fontSize: 12, color: "#C9A020", fontFamily: "'Inter', system-ui, -apple-system, sans-serif", marginBottom: 10 }}>{sub} · {unit}</div>}

      {/* Daily / Weekly / Monthly (spec Part 13). Locked views stay visible
          but disabled, with the unlock rule as the tooltip, so the user can
          see what is coming rather than wondering where it went. */}
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {["daily", "weekly", "monthly"].map(nm => {
          const on = views.indexOf(nm) > -1;
          const sel = nm === active;
          return (
            <button key={nm} disabled={!on}
              title={on ? "" : RecoveryCharts.lockMessage(nm)}
              onClick={() => setView(nm)}
              style={{ background: sel ? PURPLE : "transparent",
                       border: `1px solid ${sel ? PURPLE : `rgba(${BRDR},0.2)`}`,
                       color: sel ? "#0a0a0a" : (on ? LBL : "#4a4255"),
                       borderRadius: 99, padding: "6px 13px", fontSize: 10, fontWeight: 700,
                       letterSpacing: "0.1em", textTransform: "uppercase",
                       cursor: on ? "pointer" : "not-allowed", minHeight: 32,
                       opacity: on ? 1 : 0.45 }}>
              {nm}
            </button>
          );
        })}
      </div>

      {points.length === 0 ? (
        <div style={{ fontSize: 13, color: "#8a7fa5", padding: "24px 0", textAlign: "center" }}>
          No data for this view yet.
        </div>
      ) : (
        <SvgChart.Bar data={points} dataKey="value" domain={domain}
          ticks={ticks} refY={refY} fmt={fmt} />
      )}

      {/* Drill-down (spec Part 13): chart -> statistics -> insight.
          Collapsed by default so the chart itself stays the hero. */}
      {drill && (
        <details style={{ marginTop: 12, borderTop: "1px solid rgba(150,150,150,0.12)" }}>
          <summary style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                            cursor: "pointer", padding: "12px 0 4px", listStyle: "none",
                            fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase",
                            color: LBL }}>
            <span>Statistics</span>
            <span style={{ color: "#8a7fa5" }}>avg {drill.st.averageLabel}</span>
          </summary>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 8 }}>
            <EngineTile label="Average"     value={drill.st.averageLabel} />
            <EngineTile label="Highest"     value={drill.st.highestLabel} />
            <EngineTile label="Lowest"      value={drill.st.lowestLabel} />
            <EngineTile label="Consistency" value={`${drill.st.consistency}%`} />
            <EngineTile label="Trend"       value={drill.st.trend} />
            <EngineTile label="Tracked"     value={`${drill.st.count} ${active === "daily" ? "days" : active === "weekly" ? "weeks" : "months"}`} />
          </div>
          <div style={{ fontSize: 13, color: "#9a9a9a", lineHeight: 1.5, marginTop: 10,
                        paddingLeft: 12, borderLeft: `3px solid ${PURPLE}` }}>
            {drill.insight}
          </div>
        </details>
      )}
    </div>
  );
};


/* ══════════════════════════════════════════════════════════
   STYLES
   ══════════════════════════════════════════════════════════ */
const styles = {
  page:        { minHeight: "100vh", background: "#0a0809", color: "#fff" },
  container:   { width: "100%", padding: "16px 24px 80px" },
  loading:     { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0809" },

  /* Header / brand block */
  header:      { marginBottom: 20 },
  subtitle:    { fontSize: 10, color: "#4a4255", fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    letterSpacing: "0.1em", marginBottom: 12, textAlign: "center" },
  btnPrimary:  { flex: 1, background: "rgba(201,160,32,0.12)", border: "1px solid rgba(201,160,32,0.4)",
    color: GOLD, borderRadius: 8, padding: "10px 16px", fontSize: 11, fontWeight: 700,
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif", letterSpacing: "0.1em", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 6 },

  /* Form */
  formCard:    { background: "rgba(18,18,20,0.95)", border: "1px solid rgba(201,160,32,0.2)",
    borderRadius: 12, padding: 16, marginBottom: 16 },
  formGrid:    { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 },
  input:       { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(150,150,150,0.25)",
    borderRadius: 6, padding: "8px 10px", color: "#e8d5b0", fontSize: 13,
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif", width: "100%", boxSizing: "border-box" },
  range:       { width: "100%", accentColor: GOLD },
  formFoot:    { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10,
    position: "sticky", bottom: 0, zIndex: 5, background: "rgba(18,18,20,0.97)",
    margin: "10px -16px -16px", padding: "12px 16px", borderTop: "1px solid rgba(201,160,32,0.18)",
    borderRadius: "0 0 12px 12px" },
  preview:     { fontSize: 11, color: LBL, fontFamily: "'Inter', system-ui, -apple-system, sans-serif", flex: 1 },

  /* Today snapshot */
  todayCard:   { background: "rgba(18,18,20,0.85)", border: "1px solid rgba(150,150,150,0.2)",
    borderRadius: 12, padding: "16px 16px 14px", marginBottom: 12 },
  eyebrow:     { fontSize: 18, fontWeight: 700, fontFamily: "'Inter', system-ui, -apple-system, sans-serif", letterSpacing: "0.14em",
    color: PURPLE, textTransform: "uppercase", marginBottom: 14 },
  todayGrid:   { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },

  /* 7-day stats row */
  statsRow:    { display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 12 },

  /* Charts grid */
  chartsGrid:  { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "0 12px" },

  /* Log tab */
  empty:       { fontSize: 11, color: "#4a4255", fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    textAlign: "center", padding: "24px 0", letterSpacing: "0.1em" },
};

/* ══════════════════════════════════════════════════════════
   MOUNT
   ══════════════════════════════════════════════════════════ */
const _root = ReactDOM.createRoot(document.getElementById('root'));
function tryMount() {
  if (window.storage) {
    _root.render(<SleepTracker />);
  } else {
    setTimeout(tryMount, 100);
  }
}
tryMount();

