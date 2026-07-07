

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
                energy: parsed.energy ?? 5,
                clarity: parsed.clarity ?? 5,
                soreness: parsed.soreness ?? 5,
                restlessness: parsed.restlessness ?? 3,
              });
            } catch (e) {}
          }
        }
        loaded.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
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

  const enriched = useMemo(() =>
    entries.map((e) => {
      const hours    = calcHours(e.sleepTime, e.wakeTime);
      const hasSleep = !!e.sleepTime;
      return {
        ...e,
        hours:    hasSleep ? hours : null,
        recovery: hasSleep ? calcRecovery(hours, e.energy ?? 5, e.soreness ?? 5, e.clarity ?? 5, e.restlessness ?? 3) : null,
        label:    e.date.slice(5),
        weekday: (() => {
          const [yy, mm, dd] = e.date.split("-").map(Number);
          return ["SUN","MON","TUE","WED","THU","FRI","SAT"][new Date(yy, mm - 1, dd).getDay()];
        })(),
      };
    }),
    [entries]
  );

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
    soreness: avg(last7, "soreness"),
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
      avgSoreness:  stats.soreness > 0 ? `${stats.soreness}/10` : null,
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
              <Field label="Date">
                <input type="date" value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  style={styles.input} />
              </Field>
              <Field label="Wake Time">
                <input type="time" value={form.wakeTime}
                  onChange={(e) => setForm({ ...form, wakeTime: e.target.value })}
                  style={styles.input} />
              </Field>
              <Field label="Sleep Time">
                <input type="time" value={form.sleepTime}
                  onChange={(e) => setForm({ ...form, sleepTime: e.target.value })}
                  style={styles.input} />
              </Field>
              <Field label={`Energy · ${form.energy}/10`}>
                <input type="range" min="1" max="10" value={form.energy}
                  onChange={(e) => setForm({ ...form, energy: +e.target.value })}
                  style={styles.range} />
              </Field>
              <Field label={`Soreness · ${form.soreness}/10`}>
                <input type="range" min="1" max="10" value={form.soreness}
                  onChange={(e) => setForm({ ...form, soreness: +e.target.value })}
                  style={styles.range} />
              </Field>
              <Field label={`Mental Clarity · ${form.clarity}/10`}>
                <input type="range" min="1" max="10" value={form.clarity}
                  onChange={(e) => setForm({ ...form, clarity: +e.target.value })}
                  style={{ ...styles.range, accentColor: PURPLE }} />
              </Field>
              <Field label={`Restlessness · ${form.restlessness}/10`}>
                <input type="range" min="1" max="10" value={form.restlessness}
                  onChange={(e) => setForm({ ...form, restlessness: +e.target.value })}
                  style={{ ...styles.range, accentColor: PURPLE }} />
              </Field>
            </div>
            {__PREMIUM ? (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 10, fontFamily: "'Inter', system-ui, -apple-system, sans-serif", letterSpacing: "0.14em", color: LBL, textTransform: "uppercase", marginBottom: 8 }}>Biometrics</div>
                <div style={styles.formGrid}>
                  <Field label="Resting HR (bpm)">
                    <input type="number" inputMode="numeric" value={form.restingHR}
                      onChange={(e) => setForm({ ...form, restingHR: e.target.value })}
                      placeholder="—" style={styles.input} />
                  </Field>
                  <Field label="HRV (ms)">
                    <input type="number" inputMode="numeric" value={form.hrv}
                      onChange={(e) => setForm({ ...form, hrv: e.target.value })}
                      placeholder="—" style={styles.input} />
                  </Field>
                  <Field label="Weight (lbs)">
                    <input type="number" inputMode="decimal" value={form.weight}
                      onChange={(e) => setForm({ ...form, weight: e.target.value })}
                      placeholder="—" style={styles.input} />
                  </Field>
                </div>
              </div>
            ) : (
              <div style={{ marginTop: 12, padding: "12px 14px", background: "rgba(201,160,32,0.08)", border: "1px solid rgba(201,160,32,0.35)", borderRadius: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#C9A020", letterSpacing: "0.04em", fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>Biometrics</div>
                <div style={{ fontSize: 11, color: "#9a9a9a", marginTop: 4, lineHeight: 1.5, fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>Log resting heart rate, HRV, and weight with <b style={{ color: "#C9A020" }}>Premium</b>.</div>
                <a href="/billing.html" target="_top" style={{ display: "inline-block", marginTop: 8, padding: "7px 18px", background: "#C9A020", color: "#0a0a0a", fontWeight: 800, fontSize: 11, letterSpacing: "0.04em", borderRadius: 8, textDecoration: "none", fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>↑ Unlock with Premium</a>
              </div>
            )}
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
                <TodayStat icon={<IconHeart />}     label="Soreness" value={today ? `${today.soreness}/10` : "—"} accent={PURPLE} />
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
            {/* 7-day stats */}
            <section style={styles.statsRow}>
              <StatBlock label="Avg Sleep"    value={`${stats.hours}h`}        sub="7-day" trend={trend("hours")}    good="up" />
              <StatBlock label="Avg Energy"   value={`${stats.energy}/10`}     sub="7-day" trend={trend("energy")}   good="up" />
              <StatBlock label="Avg Clarity"  value={`${stats.clarity}/10`}    sub="7-day" trend={trend("clarity")}  good="up" />
              <StatBlock label="Avg Soreness" value={`${stats.soreness}/10`}   sub="7-day" trend={trend("soreness")} good="down" />
              <StatBlock label="Avg Recovery" value={`${stats.recovery}%`}     sub="7-day" trend={trend("recovery")} good="up" />
            </section>

            {/* Charts */}
            <section style={styles.chartsGrid}>

              {/* Sleep Duration — pure SVG, always renders */}
              <ChartCard title="Sleep Duration" sub="hours per night · last 30">
                <SvgChart.Bar data={last30} dataKey="hours" domain={[0,10]} ticks={[0,2,4,6,8,10]} refY={7}/>
              </ChartCard>

              {/* Recovery Score — pure SVG, always renders */}
              <ChartCard title="Recovery Score" sub="% · last 30 nights">
                <SvgChart.Lines data={last30} lines={[{key:"recovery",stroke:GOLD}]} domain={[0,100]} ticks={[0,20,40,60,80,100]} refY={70}/>
              </ChartCard>

              {/* Energy vs Soreness — pure SVG, always renders */}
              <ChartCard title="Energy vs Soreness" sub="1–10 scale · last 30">
                <SvgChart.Lines data={last30} lines={[{key:"energy",stroke:GOLD},{key:"soreness",stroke:PURPLE}]} domain={[0,10]} ticks={[0,2,4,6,8,10]}/>
                <div style={{display:"flex",gap:16,marginTop:8,fontSize:12,fontFamily:"'Inter', system-ui, -apple-system, sans-serif"}}>
                  <span style={{color:"#9aa3b2"}}><span style={{color:GOLD}}>——</span> energy</span>
                  <span style={{color:"#9aa3b2"}}><span style={{color:PURPLE}}>——</span> soreness</span>
                </div>
              </ChartCard>

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
            <InsightRow label="Average Soreness"    value={insights.avgSoreness       || "—"} accent={GOLD} />
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
const LogBlock = ({ label, value, accent }) => (
  <div style={{
    background: "rgba(150,150,150,0.06)",
    border: `1px solid rgba(${BRDR},0.12)`,
    borderLeft: "3px solid rgba(150,150,150,0.55)",
    borderRadius: 8, padding: "8px 10px",
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
    {/* Row 1: Wake · Sleep · Duration */}
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12.48, marginBottom: 12.48 }}>
      <LogBlock label="Wake"     value={_fmt12(e.wakeTime)} />
      <LogBlock label="Sleep"    value={_fmt12(e.sleepTime)} />
      <LogBlock label="Duration" value={e.hours != null && e.hours > 0 ? `${e.hours}h` : "—"} accent={PURPLE} />
    </div>
    {/* Row 2: Recovery · Energy · Soreness · Clarity · Restlessness */}
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12.48 }}>
      <LogBlock label="Recovery" value={__CORE ? "🔒" : (e.recovery != null ? `${e.recovery}%` : "—")} accent={GOLD} />
      <LogBlock label="Energy"   value={e.energy   != null ? `${e.energy}/10`   : "—"} />
      <LogBlock label="Soreness" value={e.soreness != null ? `${e.soreness}/10` : "—"} />
      <LogBlock label="Clarity"  value={e.clarity  != null ? `${e.clarity}/10`  : "—"} accent={PURPLE} />
      <LogBlock label="Restless" value={e.restlessness != null ? `${e.restlessness}/10` : "—"} />
    </div>
    {(e.restingHR || e.hrv || e.weight) && (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12.48, marginTop: 12.48 }}>
        <LogBlock label="Resting HR" value={e.restingHR ? `${e.restingHR} bpm` : "—"} />
        <LogBlock label="HRV"        value={e.hrv ? `${e.hrv} ms` : "—"} accent={PURPLE} />
        <LogBlock label="Weight"     value={e.weight ? `${e.weight} lbs` : "—"} accent={GOLD} />
      </div>
    )}
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

  const YAxisLines = ({ ticks, domain }) => {
    const [min, max] = domain;
    return <>{ticks.map(t => {
      const y = ys(t, min, max);
      return <g key={t}>
        <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth={1}/>
        <text x={PAD.left - 8} y={y + 5} textAnchor="end" fill="#f5f5f5" fontSize={16} fontFamily="'Inter', system-ui, -apple-system, sans-serif">{t}</text>
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

  const Bar = ({ data, dataKey, domain, ticks, refY }) => {
    const [min, max] = domain;
    const bw = Math.max(3, pw / data.length * 0.6);
    return (
      <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",height:440,display:"block"}}>
        <defs>
          <linearGradient id="svgBarGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={BAR_TOP}/><stop offset="100%" stopColor={BAR_BOT}/>
          </linearGradient>
        </defs>
        <YAxisLines ticks={ticks} domain={domain}/>
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

  const Lines = ({ data, lines, domain, ticks, refY }) => {
    const [min, max] = domain;
    const n = data.length;
    return (
      <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",height:440,display:"block"}}>
        <YAxisLines ticks={ticks} domain={domain}/>
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
const ChartCard = ({ title, sub, children }) => (
  <div style={{
    background: "rgba(18,18,20,0.85)", border: `1px solid rgba(${BRDR},0.12)`,
    borderRadius: 12, padding: "16px", marginBottom: 12,
  }}>
    <div style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif", fontSize: 12, letterSpacing: "0.14em",
      textTransform: "uppercase", color: "#f5f5f5", marginBottom: 3 }}>
      {title}
    </div>
    {sub && <div style={{ fontSize: 12, color: "#C9A020", fontFamily: "'Inter', system-ui, -apple-system, sans-serif", marginBottom: 14 }}>{sub}</div>}
    {children}
  </div>
);

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

