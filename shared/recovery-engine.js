/* ══════════════════════════════════════════════════════════
   MPS RECOVERY ENGINE  v4.0
   Framework-agnostic. No DOM, no React, no dependencies.
   Built against RECOVERY PILLAR MASTER HANDOFF v3.0 (locked spec).

   This is the calculation + intelligence layer for the Recovery
   pillar. apps/sleep/index.html (React) consumes it. Load with:
     <script src="/shared/recovery-engine.js"></script>

   Modules:
     RecoveryScoring       locked tables, score() full breakdown
     RecoveryActions       25-action library + rotation
     RecoveryCoaching      62 coaching templates + cooldowns
     RecoveryCharts        aggregation, view gating, stats, SVG geometry
     RecoveryReports       7 unlock levels + celebrations
     RecoveryInsights      today's insights + long-run progress

   VERIFIED: 356/356 assertions pass in the sandbox harness at
   Desktop\Jarvis\MPS_Builds\mps_recovery_sandbox.html

   REMOVED (were shipped, never called by this app):
     RecoveryData          the pillar uses its own storage layer
     RecoverySync          the pillar has its own Firestore sync; running
                           two sync systems would fight
     RecoveryLegacyBridge  field mapping is now inline in app.src.jsx
   All three remain in git history and in the sandbox harness if the
   decision is ever revisited.

   NAMESPACE: set RecoveryEngineConfig.namespace before first use to
   control localStorage keys and the Firestore collection.
     'recovery_sandbox' (default, safe)  ->  'recovery' (live)
   ══════════════════════════════════════════════════════════ */

(function(window){
'use strict';

var RecoveryEngineConfig = window.RecoveryEngineConfig || {
  namespace: 'recovery_sandbox',
  userId: null
};
// Resolves the signed-in uid, falling back to the configured value.
function __recUser(){
  try {
    if (window.firebase && firebase.auth && firebase.auth().currentUser)
      return firebase.auth().currentUser.uid;
  } catch(e){}
  return RecoveryEngineConfig.userId || 'local';
}
var USER = __recUser();
// Storage prefix. 'recovery' -> mps_recovery_*, 'recovery_sandbox' -> mps_recovery_sandbox_*
function __nsPrefix(){ return 'mps_' + RecoveryEngineConfig.namespace; }

/* ============================================================
   MPS RECOVERY — WEAPON 3: RECOVERY SCORING ENGINE
   Locked per handoff v3.0 Parts 2-8. Pure functions, no storage,
   no DOM. Same inputs always produce the same output.
   Consumed by Weapon 1 (storage) and Weapon 4 (dashboard).
   ============================================================ */

const RecoveryScoring = (function(){

  /* ---------- PART 1: input fields (locked) ---------- */
  const SLIDERS = ['sleepQuality','energy','mentalClarity','physicalRecovery','calmness'];

  const LABELS = {
    sleepQuality:'Sleep Quality', energy:'Energy', mentalClarity:'Mental Clarity',
    physicalRecovery:'Physical Recovery', calmness:'Calmness'
  };

  /* ---------- PART 2: sleep duration score table (locked) ---------- */
  // [minHoursInclusive, maxHoursExclusive, score]
  const DURATION_TABLE = [
    [0,1,30],[1,2,40],[2,3,50],[3,4,60],[4,5,70],[5,6,80],[6,7,90],
    [7,8,100],[8,9,90],[9,10,80],[10,11,70],[11,12,60],[12,13,50],[13,Infinity,40]
  ];

  /* ---------- PART 5: global grading scale (locked, all pillars) ---------- */
  const GRADES = [
    [97,'A+'],[94,'A'],[90,'A-'],[87,'B+'],[84,'B'],[80,'B-'],
    [77,'C+'],[74,'C'],[70,'C-'],[67,'D+'],[64,'D'],[60,'D-'],[0,'F']
  ];

  /* ---------- PART 6: status tiers, dots, color progression ---------- */
  // The tier THRESHOLDS, dot counts and status names are locked per spec.
  // The HEX VALUES are not: the originals claimed to be MPS design-system colours but only
  // purple and gold actually were. Blue (#4ab3f4) and green (#16a34a) were generic, and the
  // blue dominated the whole card because the score, dots, status and push meter all inherit
  // this hex. Remapped to the real MPS palette on Jeff's call:
  //   healthy end  = MPS purple -> MPS gold   (brand)
  //   warning end  = amber -> orange -> red   (universally read as "back off")
  // Green is gone entirely: it read as "good" while sitting in the 3rd tier, which was
  // actively misleading.
  // STATUS is a STATE word (how recovered you are), NOT a command — the Push Meter below already
  // gives the command, so the two never repeat. Renamed on Jeff's call: the old set mixed a
  // prestige word (READY) with alarm words (CAUTION/URGENT) and one tier even contradicted itself
  // (status CAUTION but level "Good Recovery"). New ladder is a clean state scale, high to low.
  // `level` is realigned to match so it can never contradict the status if it is ever shown.
  const TIERS = [
    {min:90,status:'PRIMED',   dots:5,color:'purple',hex:'#9b6bc9',level:'Peak Recovery'},
    {min:80,status:'STRONG',   dots:4,color:'gold',  hex:'#C9A020',level:'Strong Recovery'},
    {min:70,status:'FAIR',     dots:3,color:'amber', hex:'#d9a441',level:'Fair Recovery'},
    {min:60,status:'LOW',      dots:2,color:'orange',hex:'#d97706',level:'Low Recovery'},
    {min:50,status:'DRAINED',  dots:1,color:'deep',  hex:'#e05d2a',level:'Drained'},
    {min:0, status:'DEPLETED', dots:1,color:'red',   hex:'#dc2626',level:'Depleted'}
  ];

  /* ---------- PART 7: push meter (locked) ---------- */
  // Keyed by the STATUS word, so these keys must match the TIERS status names exactly.
  // `cmd` is the one-word COMMAND for the Push Meter — what to DO. Pairs with the tier's status
  // word (the state): READINESS says how you are, PUSH METER says what to do about it, no overlap.
  const PUSH_BASE = {
    PRIMED:  {push:10, cmd:'PUSH',    msg:'Excellent recovery. Push hard today.'},
    STRONG:  {push:8,  cmd:'TRAIN',   msg:'Good recovery. Train normally.'},
    FAIR:    {push:6,  cmd:'LIGHTEN', msg:'Reduce intensity. Avoid unnecessary fatigue.'},
    LOW:     {push:4,  cmd:'RECOVER', msg:'Reduce intensity. Focus on recovery.'},
    DRAINED: {push:3,  cmd:'REST',    msg:'Prioritize recovery today.'},
    DEPLETED:{push:2,  cmd:'RESET',   msg:'Today is for recovery. Do not push hard.'}
  };

  /* ---------- calculations ---------- */

  // Minutes slept, handles midnight crossing.
  function sleepMinutes(bedtime, wakeTime){
    const [bh,bm] = bedtime.split(':').map(Number);
    const [wh,wm] = wakeTime.split(':').map(Number);
    let mins = (wh*60+wm) - (bh*60+bm);
    if (mins <= 0) mins += 1440;
    return mins;
  }

  // Human-readable duration. 450 -> "7h 30m"
  function formatDuration(minutes){
    return `${Math.floor(minutes/60)}h ${String(minutes%60).padStart(2,'0')}m`;
  }

  // PART 2. Exact range match, no interpolation.
  function durationScore(minutes){
    const h = minutes/60;
    for (const [lo,hi,score] of DURATION_TABLE){
      if (h >= lo && h < hi) return score;
    }
    return 40;
  }

  // PART 3. Five sliders averaged equally, converted to 0-100.
  function sliderAverage(e){
    const sum = SLIDERS.reduce((t,k)=>t+e[k],0);
    return (sum/SLIDERS.length)*10;
  }

  // PART 4. Final score is the average of the two halves.
  function finalScore(durScore, sliderAvg){
    return Math.round((durScore + sliderAvg)/2);
  }

  // PART 5.
  function grade(score){
    for (const [min,g] of GRADES) if (score >= min) return g;
    return 'F';
  }

  // PART 6.
  function tier(score){
    for (const t of TIERS) if (score >= t.min) return t;
    return TIERS[TIERS.length-1];
  }

  // Five dots always. Filled = active.
  function dots(score){
    const n = tier(score).dots;
    return '●'.repeat(n) + '○'.repeat(5-n);
  }

  // PART 7. Base rating by status, then the four modifiers, clamped 1-10.
  function pushMeter(status, e){
    const base = PUSH_BASE[status];
    let p = base.push;
    if (e.physicalRecovery <= 3) p -= 2;
    if (e.energy <= 3) p -= 1;
    if (e.sleepQuality <= 3) p -= 1;
    if (e.physicalRecovery >= 8 && e.energy >= 8) p += 1;
    p = Math.max(1, Math.min(10, p));
    return {pushMeter:p, pushCommand:base.cmd, pushMessage:base.msg};
  }

  // PART 8 steps 1-3: lowest metric with 7-day lookback tie-break.
  function lowestMetric(entry, history){
    const min = Math.min(...SLIDERS.map(k=>entry[k]));
    let tied = SLIDERS.filter(k=>entry[k]===min);
    if (tied.length === 1) return tied[0];

    const recent = (history||[])
      .filter(r=>r.date < entry.date)
      .sort((a,b)=> a.date < b.date ? 1 : -1)
      .slice(0,7);

    if (recent.length){
      const avg = {};
      tied.forEach(k => avg[k] = recent.reduce((t,r)=>t+r[k],0)/recent.length);
      const lowestAvg = Math.min(...tied.map(k=>avg[k]));
      const stillTied = tied.filter(k => avg[k] === lowestAvg);
      if (stillTied.length === 1) return stillTied[0];
      tied = stillTied;
    }
    // Deterministic combined result. Never random.
    return tied.join('+');
  }

  // Readable name for a metric key, including a combined tie result.
  // Three-way ties read as "A, B and C", not "A and B and C".
  function metricLabel(key){
    const names = String(key).split('+').map(k => LABELS[k] || k);
    if (names.length <= 1) return names[0] || '';
    return names.slice(0,-1).join(', ') + ' and ' + names[names.length-1];
  }

  /* ---------- one call, full breakdown ---------- */
  // The single entry point Weapons 1 and 4 use. Returns every
  // derived value in one pass so nothing is computed twice.
  function score(input, history){
    const mins   = sleepMinutes(input.bedtime, input.wakeTime);
    const dScore = durationScore(mins);
    const sAvg   = sliderAverage(input);
    const total  = finalScore(dScore, sAvg);
    const t      = tier(total);
    const push   = pushMeter(t.status, input);

    return {
      sleepDuration: mins,
      sleepDurationLabel: formatDuration(mins),
      sleepDurationScore: dScore,
      sliderAverage: Math.round(sAvg),
      recoveryScore: total,
      recoveryGrade: grade(total),
      recoveryStatus: t.status,
      levelName: t.level,
      dotCount: t.dots,
      dotColor: t.color,
      dotHex: t.hex,
      dotString: dots(total),
      pushMeter: push.pushMeter,
      pushCommand: push.pushCommand,
      pushMessage: push.pushMessage,
      lowestMetric: lowestMetric(input, history)
    };
  }

  return {SLIDERS, LABELS, DURATION_TABLE, GRADES, TIERS, PUSH_BASE,
          sleepMinutes, formatDuration, durationScore, sliderAverage,
          finalScore, grade, tier, dots, pushMeter, lowestMetric,
          metricLabel, score};
})();


/* ============================================================

/* ============================================================
   MPS RECOVERY — WEAPON 5: TODAY'S PLAN & ACTION SELECTOR
   Locked per handoff v3.0 Parts 8, 9, 10 (items 3-5).
   The weakest metric picks the category. The user picks the action.
   Rotation and cooldowns are Weapon 6, not this weapon.
   ============================================================ */

const RecoveryActions = (function(){

  /* ---------- PART 9: the locked action library ---------- */
  // Five categories, five actions each. The handoff header says "24
  // total" but the list itself numbers 1-25, so 25 is what is built.
  const LIBRARY = {
    sleepQuality: [
      'Go to bed 30 minutes earlier',
      'Read before bed',
      'Reduce screens before bed',
      'Meditate before sleep',
      'Wind down earlier'
    ],
    energy: [
      'Take a recovery walk',
      'Light movement session',
      'Get outside for 10 minutes',
      'Meditate',
      'Take a short rest'
    ],
    mentalClarity: [
      'Read',
      'Journal',
      'Meditate',
      'Take a quiet walk',
      'Take a screen break'
    ],
    physicalRecovery: [
      'Recovery walk',
      'Stretch',
      'Foam roll',
      'Mobility work',
      'Rest'
    ],
    calmness: [
      'Journal',
      'Meditate',
      'Deep breathing (5 minutes)',
      'Quiet walk',
      'Relaxation routine'
    ]
  };

  // Wireframe icons, one per category.
  const ICONS = {
    sleepQuality:'<path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.5 6.5 0 0 0 9.8 9.8z"/>',
    energy:'<path d="M13 2 3 14h9l-1 8 10-12h-9z"/>',
    mentalClarity:'<path d="M12 5a3 3 0 0 0-5.9-.7A2.5 2.5 0 0 0 3 6.5a2.5 2.5 0 0 0 .6 1.6A3 3 0 0 0 4 13.5a3 3 0 0 0 2 2.8V18a3 3 0 0 0 6 0zM12 5a3 3 0 0 1 5.9-.7A2.5 2.5 0 0 1 21 6.5a2.5 2.5 0 0 1-.6 1.6A3 3 0 0 1 20 13.5a3 3 0 0 1-2 2.8V18a3 3 0 0 1-6 0z"/>',
    physicalRecovery:'<path d="M6.5 6.5 17.5 17.5M4 8l4-4 2 2-4 4zM14 18l4-4 2 2-4 4zM2 10l2-2M20 16l2-2"/>',
    calmness:'<circle cx="12" cy="12" r="9"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/>'
  };

  // A tie returns "a+b". Merge both categories, keep order, drop repeats.
  function forMetric(metricKey){
    const keys = String(metricKey).split('+');
    const out = [];
    keys.forEach(k => (LIBRARY[k] || []).forEach(a => {
      if (out.indexOf(a) === -1) out.push(a);
    }));
    return out;
  }

  function iconFor(metricKey){
    return ICONS[String(metricKey).split('+')[0]] || ICONS.energy;
  }

  // Part 8 step 2: a tie that survives the lookback gets a combined
  // message addressing both metrics, never a coin flip.
  function planMessage(metricKey){
    const label = RecoveryScoring.metricLabel(metricKey);
    return metricKey.indexOf('+') > -1
      ? `${label} are tied at your lowest today. Pick one action that helps both.`
      : `${label} is your lowest metric today.`;
  }

  return {LIBRARY, forMetric, iconFor, planMessage};
})();




/* ============================================================
   MPS RECOVERY — WEAPON 6: RECOMMENDATION & COACHING ENGINE
   Locked per handoff v3.0 Parts 11 and 12.
   Answers "why did I get this score" using the user's real numbers.
   Rules only. No randomness. Same data always picks the same message.
   ============================================================ */

const RecoveryCoaching = (function(){

  const CKEY = uid => `${__nsPrefix()}_coach_${uid}`;

  /* ---------- context: everything a condition can test ---------- */
  // Built once per evaluation from today's record plus history.
  function buildContext(rec, history){
    const prior = (history||[])
      .filter(r => r.date < rec.date)
      .sort((a,b)=> a.date < b.date ? 1 : -1);
    const prev = prior[0] || null;

    const ctx = {
      score: rec.recoveryScore,
      grade: rec.recoveryGrade,
      // "an A-" and "an F", but "a B-". Grammar, not decoration.
      gradeArticle: /^[AF]/.test(rec.recoveryGrade) ? 'an' : 'a',
      status: rec.recoveryStatus,
      durationScore: rec.sleepDurationScore,
      sliderScore: rec.sliderAverage,
      sleepMinutes: rec.sleepDuration,
      duration: RecoveryScoring.formatDuration(rec.sleepDuration),
      pushMeter: rec.pushMeter,
      daysTracked: (history||[]).length,
      lowestMetric: rec.lowestMetric,
      lowestLabel: RecoveryScoring.metricLabel(rec.lowestMetric),
      hasPrev: prev ? 1 : 0
    };

    RecoveryScoring.SLIDERS.forEach(k => {
      ctx[k] = rec[k];
      ctx[k+'Label'] = RecoveryScoring.LABELS[k];
      ctx[k+'Delta'] = prev ? rec[k] - prev[k] : 0;
    });

    ctx.lowestValue = Math.min(...RecoveryScoring.SLIDERS.map(k=>rec[k]));
    ctx.highestValue = Math.max(...RecoveryScoring.SLIDERS.map(k=>rec[k]));
    ctx.highestMetric = RecoveryScoring.SLIDERS
      .filter(k=>rec[k]===ctx.highestValue).join('+');
    ctx.highestLabel = RecoveryScoring.metricLabel(ctx.highestMetric);
    ctx.spread = ctx.highestValue - ctx.lowestValue;

    ctx.prevScore  = prev ? prev.recoveryScore : rec.recoveryScore;
    ctx.scoreDelta = prev ? rec.recoveryScore - prev.recoveryScore : 0;
    ctx.scoreDeltaAbs = Math.abs(ctx.scoreDelta);

    // 7-day average, used by the trend templates.
    const week = prior.slice(0,7);
    ctx.weekAvg = week.length
      ? Math.round(week.reduce((t,r)=>t+r.recoveryScore,0)/week.length)
      : rec.recoveryScore;
    ctx.vsWeek = rec.recoveryScore - ctx.weekAvg;
    return ctx;
  }

  /* ---------- PART 12: the coaching template library ---------- */
  // Conditions are {field}Min / {field}Max against the context above.
  // Higher priority wins ties. cooldownDays blocks recent repeats.
  const T = (id,category,priority,cooldownDays,messageTemplate,requiredConditions,
             eligibleStatuses,excludedConditions) =>
    ({id,category,priority,cooldownDays,messageTemplate,
      requiredConditions:requiredConditions||{},
      eligibleStatuses:eligibleStatuses||null,
      excludedConditions:excludedConditions||{}});

  const TEMPLATES = [

    /* --- overall score explanation (8) --- */
    T('os_elite',  'overall_score', 90, 2,
      'You scored {score}%, {gradeArticle} {grade}. Sleep duration and how you feel are both strong. This is what a fully recovered day looks like.',
      {scoreMin:90}),
    T('os_strong', 'overall_score', 80, 2,
      'You scored {score}%, {gradeArticle} {grade}. Solid recovery. Nothing is holding you back today.',
      {scoreMin:80, scoreMax:89}),
    T('os_good',   'overall_score', 75, 2,
      'You scored {score}%, {gradeArticle} {grade}. Recovery is decent but not complete. Keep the intensity honest today.',
      {scoreMin:70, scoreMax:79}),
    T('os_needs',  'overall_score', 78, 2,
      'You scored {score}%, {gradeArticle} {grade}. Your body is asking for a lighter day. Pushing hard now costs you tomorrow.',
      {scoreMin:60, scoreMax:69}),
    T('os_urgent', 'overall_score', 85, 1,
      'You scored {score}%, {gradeArticle} {grade}. This is a recovery day, not a training day. Treat it that way.',
      {scoreMin:50, scoreMax:59}),
    T('os_low',    'overall_score', 95, 1,
      'You scored {score}%, {gradeArticle} {grade}. Everything is pointing the same direction. Rest is the priority today.',
      {scoreMax:49}),
    T('os_jump',   'overall_score', 88, 3,
      'Your Recovery Score climbed {scoreDeltaAbs} points to {score}%. Whatever you did yesterday, repeat it.',
      {scoreDeltaMin:8}),
    T('os_drop',   'overall_score', 92, 3,
      'Your Recovery Score fell {scoreDeltaAbs} points to {score}%. One rough night is normal. Two in a row is a pattern.',
      {scoreDeltaMax:-8}),

    /* --- sleep duration feedback (8) --- */
    T('sd_perfect','sleep_duration', 82, 3,
      'You slept {duration}, right in the optimal window, earning a {durationScore}% Duration Score. That is the single biggest lever you control.',
      {durationScoreMin:100}),
    T('sd_close',  'sleep_duration', 70, 3,
      'You slept {duration} for a {durationScore}% Duration Score. Another 30 to 45 minutes would put you in the ideal 7 to 8 hour band.',
      {durationScoreMin:90, durationScoreMax:90}),
    T('sd_short',  'sleep_duration', 84, 2,
      'You slept {duration}. That is well short of the 7 to 8 hours your score is built around, and it capped today at {score}%.',
      {sleepMinutesMax:359}),
    T('sd_verylow','sleep_duration', 96, 1,
      'You slept {duration}. At this little sleep, nothing else in your routine can compensate. Getting to bed earlier tonight is the only thing that matters.',
      {sleepMinutesMax:239}),
    T('sd_over',   'sleep_duration', 74, 3,
      'You slept {duration}. Oversleeping scores lower than the 7 to 8 hour window, which is why your Duration Score is {durationScore}%. Long sleep often signals debt you are repaying.',
      {sleepMinutesMin:601}),
    T('sd_wayover','sleep_duration', 80, 2,
      'You slept {duration}. That much sleep usually means you were running a deficit. Aim for a consistent 7 to 8 hours rather than catching up in one night.',
      {sleepMinutesMin:781}),
    T('sd_carry',  'sleep_duration', 72, 3,
      'Your Duration Score was {durationScore}% but you still feel like a {sliderScore}%. Sleep length alone is not carrying you right now.',
      {durationScoreMin:90, sliderScoreMax:65}),
    T('sd_ok',     'sleep_duration', 55, 4,
      'You slept {duration} for a {durationScore}% Duration Score. Sleep length is not your limiting factor today.',
      {durationScoreMin:90}),

    /* --- sleep quality feedback (6) --- */
    T('sq_low',    'sleep_quality', 86, 2,
      'You rated Sleep Quality {sleepQuality}/10. Time in bed is not the same as rest. Broken sleep shows up as low readiness even when the hours look fine.',
      {sleepQualityMax:3}),
    T('sq_mid',    'sleep_quality', 62, 3,
      'Sleep Quality came in at {sleepQuality}/10. Middling nights are usually an environment problem: light, temperature, or a late screen.',
      {sleepQualityMin:4, sleepQualityMax:6}),
    T('sq_high',   'sleep_quality', 58, 4,
      'You rated Sleep Quality {sleepQuality}/10. Deep, unbroken sleep is doing a lot of quiet work for your recovery.',
      {sleepQualityMin:8}),
    T('sq_gap',    'sleep_quality', 76, 3,
      'You slept {duration} but only rated the quality {sleepQuality}/10. The hours were there. The rest was not.',
      {durationScoreMin:90, sleepQualityMax:5}),
    T('sq_drop',   'sleep_quality', 79, 3,
      'Sleep Quality dropped to {sleepQuality}/10 from your previous night. Look at what changed: timing, food, screens, or stress.',
      {sleepQualityDeltaMax:-3}),
    T('sq_rise',   'sleep_quality', 68, 4,
      'Sleep Quality improved to {sleepQuality}/10. That is the metric with the widest downstream effect. Protect whatever caused it.',
      {sleepQualityDeltaMin:3}),

    /* --- energy feedback (6) --- */
    T('en_low',    'energy', 88, 2,
      'Your Energy was {energy}/10. That limited today’s Recovery Score even where the rest of your inputs held up.',
      {energyMax:3}),
    T('en_mid',    'energy', 60, 3,
      'Energy sat at {energy}/10. Not empty, not sharp. Light movement usually lifts this more than rest does.',
      {energyMin:4, energyMax:6}),
    T('en_high',   'energy', 57, 4,
      'Energy came in at {energy}/10. Your body is telling you it has capacity today.',
      {energyMin:8}),
    T('en_drop',   'energy', 83, 3,
      'Energy fell to {energy}/10, down {scoreDeltaAbs} points on the day overall. A single low-energy day is noise. A run of them is a signal.',
      {energyDeltaMax:-3}),
    T('en_rise',   'energy', 66, 4,
      'Energy climbed to {energy}/10. Whatever you changed is working.',
      {energyDeltaMin:3}),
    T('en_despite','energy', 81, 3,
      'You slept {duration} and still rated Energy {energy}/10. When sleep is adequate but energy is not, look at food, hydration, and daylight before adding more rest.',
      {durationScoreMin:90, energyMax:4}),

    /* --- mental clarity feedback (5) --- */
    T('mc_low',    'mental_clarity', 85, 2,
      'Mental Clarity was {mentalClarity}/10. Fog like this is usually the first thing to show up when recovery slips and the last to come back.',
      {mentalClarityMax:3}),
    T('mc_mid',    'mental_clarity', 59, 3,
      'Mental Clarity came in at {mentalClarity}/10. A screen break or a quiet walk moves this faster than more caffeine.',
      {mentalClarityMin:4, mentalClarityMax:6}),
    T('mc_high',   'mental_clarity', 56, 4,
      'Mental Clarity was {mentalClarity}/10. Use the sharp hours for the work that actually needs you.',
      {mentalClarityMin:8}),
    T('mc_drop',   'mental_clarity', 77, 3,
      'Mental Clarity dropped to {mentalClarity}/10. Clarity tends to track sleep quality more closely than sleep length.',
      {mentalClarityDeltaMax:-3}),
    T('mc_lowest', 'mental_clarity', 73, 3,
      'Mental Clarity is your weakest metric today at {mentalClarity}/10. That is the one worth protecting first.',
      {mentalClarityMax:5}),

    /* --- physical recovery feedback (6) --- */
    T('pr_low',    'physical_recovery', 89, 2,
      'Physical Recovery was {physicalRecovery}/10. Your body has not finished repairing from what you already asked of it.',
      {physicalRecoveryMax:3}),
    T('pr_mid',    'physical_recovery', 61, 3,
      'Physical Recovery sat at {physicalRecovery}/10. Mobility work and blood flow beat complete rest at this level.',
      {physicalRecoveryMin:4, physicalRecoveryMax:6}),
    T('pr_high',   'physical_recovery', 57, 4,
      'Physical Recovery was {physicalRecovery}/10. Your body is ready for real work.',
      {physicalRecoveryMin:8}),
    T('pr_limit',  'physical_recovery', 87, 2,
      'You slept {duration} for a {durationScore}% Duration Score, but Physical Recovery at {physicalRecovery}/10 was the main reason your final score stayed at {score}%.',
      {durationScoreMin:90, physicalRecoveryMax:5}),
    T('pr_drop',   'physical_recovery', 80, 3,
      'Physical Recovery fell to {physicalRecovery}/10. Soreness that arrives late usually means the last hard session was harder than it felt.',
      {physicalRecoveryDeltaMax:-3}),
    T('pr_rise',   'physical_recovery', 67, 4,
      'Physical Recovery improved to {physicalRecovery}/10. The repair work is landing.',
      {physicalRecoveryDeltaMin:3}),

    /* --- calmness feedback (5) --- */
    T('ca_low',    'calmness', 86, 2,
      'Calmness was {calmness}/10. A stressed nervous system blocks recovery even when sleep looks good on paper.',
      {calmnessMax:3}),
    T('ca_mid',    'calmness', 58, 3,
      'Calmness came in at {calmness}/10. Five minutes of slow breathing shifts this more reliably than anything else on the list.',
      {calmnessMin:4, calmnessMax:6}),
    T('ca_high',   'calmness', 55, 4,
      'Calmness was {calmness}/10. A settled system is what lets the rest of the recovery actually happen.',
      {calmnessMin:8}),
    T('ca_drop',   'calmness', 78, 3,
      'Calmness dropped to {calmness}/10. Stress is the input most likely to drag the other four down with it.',
      {calmnessDeltaMax:-3}),
    T('ca_gap',    'calmness', 75, 3,
      'You slept {duration} but rated Calmness {calmness}/10. Rest without a settled mind does not fully count as recovery.',
      {durationScoreMin:90, calmnessMax:4}),

    /* --- positive improvements (6) --- */
    T('pos_score', 'positive_improvement', 84, 3,
      'Your Recovery Score rose {scoreDeltaAbs} points to {score}%. That is real movement, not noise.',
      {scoreDeltaMin:5}),
    T('pos_above', 'positive_improvement', 70, 4,
      'Today’s {score}% is above your 7-day average of {weekAvg}%. You are trending in the right direction.',
      {vsWeekMin:6, daysTrackedMin:3}),
    T('pos_all',   'positive_improvement', 86, 4,
      'Every metric came in at 7 or better and you slept {duration}. Days like this are worth studying, not just enjoying.',
      {lowestValueMin:7, durationScoreMin:90}),
    T('pos_best',  'positive_improvement', 72, 4,
      '{highestLabel} led the way at {highestValue}/10. Strength in one area tends to pull the others up over time.',
      {highestValueMin:8}),
    T('pos_even',  'positive_improvement', 64, 5,
      'Your five metrics are tightly clustered with only {spread} points between highest and lowest. Balanced recovery is more durable than one strong number.',
      {spreadMax:2, lowestValueMin:6}),
    T('pos_streak','positive_improvement', 68, 5,
      'You have logged {daysTracked} check-ins. Consistency is what turns this from a number into a pattern you can act on.',
      {daysTrackedMin:7}),

    /* --- declining trends (6) --- */
    T('dec_score', 'declining_trend', 90, 3,
      'Your Recovery Score dropped {scoreDeltaAbs} points to {score}%. Worth catching now, before it becomes a run of days.',
      {scoreDeltaMax:-5}),
    T('dec_below', 'declining_trend', 76, 4,
      'Today’s {score}% is below your 7-day average of {weekAvg}%. One day under is normal. Watch whether tomorrow follows.',
      {vsWeekMax:-6, daysTrackedMin:3}),
    T('dec_all',   'declining_trend', 94, 2,
      'Every metric came in at 4 or below. When everything drops together it is usually accumulated load, not one bad night.',
      {highestValueMax:4}),
    T('dec_sleep', 'declining_trend', 82, 3,
      'Short sleep at {duration} is now showing up in how you feel, not just in your Duration Score. This is where debt starts compounding.',
      {sleepMinutesMax:359, sliderScoreMax:60}),
    T('dec_lowest','declining_trend', 74, 3,
      '{lowestLabel} is your weakest metric at {lowestValue}/10. Fixing your weakest input moves the score more than improving your strongest.',
      {lowestValueMax:4}),
    T('dec_push',  'declining_trend', 79, 3,
      'Your Directive is down to {pushMeter}/10. Training through this window is how a light week turns into a lost month.',
      {pushMeterMax:3}),

    /* --- conflicting signals (6) --- */
    T('cf_sleepok','conflicting_signals', 83, 3,
      'Your sleep was ideal at {duration}, but your subjective ratings averaged {sliderScore}%. The hours were there. You did not feel restored by them.',
      {durationScoreMin:100, sliderScoreMax:69}),
    T('cf_feelok', 'conflicting_signals', 83, 3,
      'You rated yourself well at {sliderScore}%, but only slept {duration}. Feeling fine on short sleep is common and it does not mean the debt is not accruing.',
      {sliderScoreMin:80, durationScoreMax:70}),
    T('cf_split',  'conflicting_signals', 77, 3,
      'Your metrics are split {spread} points apart, {highestLabel} at {highestValue}/10 against {lowestLabel} at {lowestValue}/10. Mixed signals usually mean one specific thing is off, not general fatigue.',
      {spreadMin:5}),
    T('cf_body',   'conflicting_signals', 75, 3,
      'Your body feels better than your head does. Physical Recovery is {physicalRecovery}/10 while Mental Clarity is {mentalClarity}/10. That gap points at stress or sleep quality, not training load.',
      {physicalRecoveryMin:7, mentalClarityMax:4}),
    T('cf_mind',   'conflicting_signals', 75, 3,
      'Your head is clearer than your body. Mental Clarity is {mentalClarity}/10 while Physical Recovery is {physicalRecovery}/10. Move gently and let the tissue catch up.',
      {mentalClarityMin:7, physicalRecoveryMax:4}),
    T('cf_calm',   'conflicting_signals', 73, 3,
      'You are calm at {calmness}/10 but running on {energy}/10 energy. Settled and depleted at once usually means under-fuelling or under-sleeping, not stress.',
      {calmnessMin:7, energyMax:4})
  ];

  /* ---------- eligibility ---------- */
  // A condition key is a context field plus Min or Max.
  function meetsConditions(conds, ctx){
    return Object.keys(conds).every(key => {
      const isMin = key.endsWith('Min');
      const field = key.slice(0, -3);   // strip the Min/Max suffix
      const val = ctx[field];
      if (typeof val !== 'number') return false;
      return isMin ? val >= conds[key] : val <= conds[key];
    });
  }

  function isEligible(tpl, ctx){
    if (tpl.eligibleStatuses && tpl.eligibleStatuses.indexOf(ctx.status) === -1) return false;
    if (!meetsConditions(tpl.requiredConditions, ctx)) return false;
    if (Object.keys(tpl.excludedConditions).length &&
        meetsConditions(tpl.excludedConditions, ctx)) return false;
    // Delta-based templates need a previous day to compare against.
    const usesDelta = Object.keys(tpl.requiredConditions)
      .some(k => k.indexOf('Delta') > -1 || k.indexOf('vsWeek') > -1);
    if (usesDelta && !ctx.hasPrev) return false;
    return true;
  }

  /* ---------- rotation store ---------- */
  function loadSeen(userId){
    try { return JSON.parse(localStorage.getItem(CKEY(userId))) || {}; }
    catch(e){ return {}; }
  }
  function markShown(userId, ids, date){
    const seen = loadSeen(userId);
    ids.forEach(id => {
      const e = seen[id] || {timesShown:0};
      seen[id] = {lastShown:date, timesShown:e.timesShown + 1};
    });
    localStorage.setItem(CKEY(userId), JSON.stringify(seen));
  }
  function daysBetween(a, b){
    return Math.round((new Date(b) - new Date(a)) / 86400000);
  }
  function onCooldown(tpl, seen, date){
    const e = seen[tpl.id];
    if (!e || !e.lastShown) return false;
    return daysBetween(e.lastShown, date) < tpl.cooldownDays;
  }

  /* ---------- interpolation ---------- */
  function fill(template, ctx){
    return template.replace(/\{(\w+)\}/g, (m, key) =>
      ctx[key] !== undefined ? ctx[key] : m);
  }

  /* ---------- selection (Part 12) ---------- */
  // Rank by priority, then severity (a worse day outranks a mild one),
  // then id so the order never wobbles between runs.
  // Which context fields a template keys off, Min/Max suffix stripped.
  function conditionFields(tpl){
    return Object.keys(tpl.requiredConditions).map(k => k.slice(0,-3));
  }

  function rank(tpl, ctx){
    const severity = 100 - ctx.score;
    return tpl.priority * 1000 + severity;
  }

  function select(rec, history, opts){
    const userId = (opts && opts.userId) || USER;
    const commit = !(opts && opts.commit === false);
    const ctx  = buildContext(rec, history);
    const seen = loadSeen(userId);

    const eligible = TEMPLATES.filter(t => isEligible(t, ctx));
    if (!eligible.length) return {primary:null, secondary:[], context:ctx};

    const sortFn = (a,b) => (rank(b,ctx) - rank(a,ctx)) || (a.id < b.id ? -1 : 1);
    const fresh = eligible.filter(t => !onCooldown(t, seen, rec.date)).sort(sortFn);
    // Cooldowns yield rather than leave the user with nothing.
    const pool = fresh.length ? fresh : eligible.slice().sort(sortFn);

    const primary = pool[0];
    // A secondary insight has to add something. Different category is not
    // enough: two templates keyed off the same field say the same thing in
    // different words, so they must not test any field the primary tests.
    const primaryFields = conditionFields(primary);
    const secondary = pool.slice(1)
      .filter(t => t.category !== primary.category)
      .filter(t => !conditionFields(t).some(f => primaryFields.indexOf(f) > -1))
      .filter((t,i,arr) => arr.findIndex(x=>x.category===t.category) === i)
      .slice(0,2);

    const chosen = [primary].concat(secondary);
    if (commit) markShown(userId, chosen.map(t=>t.id), rec.date);

    return {
      primary:   {id:primary.id, category:primary.category, text:fill(primary.messageTemplate, ctx)},
      secondary: secondary.map(t => ({id:t.id, category:t.category,
                                      text:fill(t.messageTemplate, ctx)})),
      context: ctx,
      eligibleCount: eligible.length
    };
  }

  function clearSeen(userId){ localStorage.removeItem(CKEY(userId)); }

  return {TEMPLATES, buildContext, isEligible, select, fill, loadSeen,
          clearSeen, onCooldown, meetsConditions};
})();


/* ---------- Part 11: action rotation ---------- */
// Bolts onto Weapon 5's library. Picks a suggested action, avoiding
// what was suggested recently, while still honouring the category.
RecoveryActions.recommend = function(rec, userId){
  const AKEY = `${__nsPrefix()}_actions_${userId||USER}`;
  let seen = {};
  try { seen = JSON.parse(localStorage.getItem(AKEY)) || {}; } catch(e){}

  const options = RecoveryActions.forMetric(rec.lowestMetric);
  const days = a => {
    const e = seen[a];
    if (!e || !e.lastShown) return Infinity;
    return Math.round((new Date(rec.date) - new Date(e.lastShown)) / 86400000);
  };

  // Exact action rests 3 days unless the day is urgent enough to repeat.
  const urgent = rec.recoveryScore < 60;
  const cooldown = urgent ? 1 : 3;
  const fresh = options.filter(a => days(a) >= cooldown);
  // Deterministic fallback: the least recently suggested option.
  const pick = fresh.length ? fresh[0]
    : options.slice().sort((a,b)=> days(b) - days(a))[0];

  seen[pick] = {lastShown: rec.date, timesShown: ((seen[pick]||{}).timesShown||0)+1};
  localStorage.setItem(AKEY, JSON.stringify(seen));
  return pick;
};

RecoveryActions.clearRotation = function(userId){
  localStorage.removeItem(`${__nsPrefix()}_actions_${userId||USER}`);
};



/* ============================================================
   MPS RECOVERY — WEAPON 7: CHARTS & DRILL-DOWNS
   Locked per handoff v3.0 Parts 13, 14 (gating), 16, 17.
   Exactly 5 primary charts, 3 views each. Pure inline SVG, no
   library, matching the live app which dropped its chart CDN.
   ============================================================ */

const RecoveryCharts = (function(){

  const pad = n => String(n).padStart(2,'0');

  /* ---------- time helpers ---------- */
  // Bedtime crosses midnight, so a raw minutes-from-midnight axis puts
  // 11pm and 1am at opposite ends. Anchor the axis at 6pm instead:
  // 22:15 -> 255, 01:00 -> 420. Late nights read as "higher".
  // A missing or malformed time returns null so the caller can skip that
  // point. Throwing here would take a whole chart down over one bad entry,
  // and entries can legitimately be saved with no times at all.
  function parseClock(hhmm){
    if (typeof hhmm !== 'string') return null;
    const parts = hhmm.split(':');
    if (parts.length < 2) return null;
    const h = Number(parts[0]), m = Number(parts[1]);
    if (!isFinite(h) || !isFinite(m)) return null;
    return h*60 + m;
  }
  function bedtimeAxis(hhmm){
    const t = parseClock(hhmm);
    return t === null ? null : ((t - 18*60) + 1440) % 1440;
  }
  function wakeAxis(hhmm){
    return parseClock(hhmm);
  }
  function fmtClock(mins){
    if (!isFinite(mins)) return '--:--';
    const t = ((Math.round(mins) % 1440) + 1440) % 1440;
    let h = Math.floor(t/60); const m = t%60;
    const ap = h < 12 ? 'AM' : 'PM';
    h = h % 12; if (h === 0) h = 12;
    return `${h}:${pad(m)} ${ap}`;
  }
  function bedFromAxis(v){ return fmtClock(v + 18*60); }

  /* ---------- PART 13: the 5 primary charts (locked) ---------- */
  const CHARTS = [
    {key:'recoveryScore', title:'Recovery Score',
     value:r => r.recoveryScore, format:v => Math.round(v)+'%',
     domain:[0,100]},
    {key:'sleepDuration', title:'Sleep Duration',
     value:r => r.sleepDuration,
     format:v => RecoveryScoring.formatDuration(Math.round(v)),
     domain:null},
    {key:'bedtime', title:'Bedtime',
     value:r => bedtimeAxis(r.bedtime), format:bedFromAxis, domain:null},
    {key:'wakeTime', title:'Wake Time',
     value:r => wakeAxis(r.wakeTime), format:fmtClock, domain:null},
    {key:'energy', title:'Energy',
     value:r => r.energy, format:v => (Math.round(v*10)/10)+' / 10',
     domain:[0,10]}
  ];

  /* ---------- aggregation ---------- */
  // Monday-anchored week key, so weeks line up with the live app.
  function weekKey(iso){
    const [y,m,d] = iso.split('-').map(Number);
    const dt = new Date(y, m-1, d);
    const dow = (dt.getDay() + 6) % 7;          // Mon = 0
    dt.setDate(dt.getDate() - dow);
    return `${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())}`;
  }
  function monthKey(iso){ return iso.slice(0,7); }

  function aggregate(records, chart, view){
    const rows = (records||[]).slice().sort((a,b)=> a.date < b.date ? -1 : 1);
    if (!rows.length) return [];

    if (view === 'daily'){
      // Drop points the chart cannot compute (a missing time, say) rather
      // than plotting null and tearing a hole in the line.
      return rows.map(r => ({key:r.date, label:r.date.slice(5),
                             value:chart.value(r), count:1}))
                 .filter(p => p.value !== null && isFinite(p.value));
    }
    const keyFn = view === 'weekly' ? weekKey : monthKey;
    const buckets = new Map();
    rows.forEach(r => {
      const v = chart.value(r);
      if (v === null || !isFinite(v)) return;   // skip uncomputable points
      const k = keyFn(r.date);
      if (!buckets.has(k)) buckets.set(k, []);
      buckets.get(k).push(v);
    });
    return Array.from(buckets.entries()).map(([k,vals]) => ({
      key: k,
      label: view === 'weekly' ? k.slice(5) : k,
      value: vals.reduce((t,v)=>t+v,0)/vals.length,   // average, never a sum
      count: vals.length
    }));
  }

  /* ---------- PART 16: view gating ---------- */
  // Daily always. Weekly needs a week. Monthly needs a month.
  function availableViews(dayCount){
    const v = ['daily'];
    if (dayCount >= 7)  v.push('weekly');
    if (dayCount >= 30) v.push('monthly');
    return v;
  }
  function lockMessage(view){
    return view === 'weekly'
      ? 'Complete 7 days to unlock weekly trends.'
      : 'Complete 30 days to unlock monthly trends.';
  }

  /* ---------- stats (drill-down) ---------- */
  function stats(points, chart){
    if (!points.length) return null;
    const vals = points.map(p=>p.value);
    const avg  = vals.reduce((t,v)=>t+v,0)/vals.length;
    const max  = Math.max(...vals), min = Math.min(...vals);
    // Consistency: how tightly clustered, as a readable percentage.
    const sd = Math.sqrt(vals.reduce((t,v)=>t+(v-avg)*(v-avg),0)/vals.length);
    const spread = max - min;
    const consistency = spread === 0 ? 100
      : Math.max(0, Math.round(100 - (sd / (Math.abs(avg) || 1)) * 100));
    // Trend: last point against the first.
    const delta = vals[vals.length-1] - vals[0];
    return {
      average:avg, highest:max, lowest:min, range:spread,
      consistency, delta, count:points.length,
      averageLabel: chart.format(avg),
      highestLabel: chart.format(max),
      lowestLabel:  chart.format(min),
      trend: delta > 0 ? 'rising' : delta < 0 ? 'falling' : 'steady'
    };
  }

  /* ---------- SVG geometry ---------- */
  const W = 300, H = 92, PADX = 6, PADY = 10;

  function scaleY(points, chart){
    let lo, hi;
    if (chart.domain){ lo = chart.domain[0]; hi = chart.domain[1]; }
    else {
      const vals = points.map(p=>p.value);
      lo = Math.min(...vals); hi = Math.max(...vals);
      const padv = (hi - lo) * 0.18 || Math.max(1, Math.abs(hi) * 0.05);
      lo -= padv; hi += padv;
    }
    if (hi === lo) hi = lo + 1;
    return v => H - PADY - ((v - lo)/(hi - lo)) * (H - PADY*2);
  }

  function coords(points, chart){
    const y = scaleY(points, chart);
    const step = points.length > 1 ? (W - PADX*2)/(points.length - 1) : 0;
    return points.map((p,i) => ({
      x: points.length > 1 ? PADX + i*step : W/2,
      y: y(p.value), point:p
    }));
  }

  function linePath(pts){
    return pts.map((c,i) => (i ? 'L' : 'M') +
      c.x.toFixed(1) + ' ' + c.y.toFixed(1)).join(' ');
  }
  function areaPath(pts){
    if (!pts.length) return '';
    return linePath(pts) + ` L${pts[pts.length-1].x.toFixed(1)} ${H}` +
           ` L${pts[0].x.toFixed(1)} ${H} Z`;
  }

  return {CHARTS, aggregate, availableViews, lockMessage, stats,
          coords, linePath, areaPath, scaleY,
          bedtimeAxis, wakeAxis, fmtClock, bedFromAxis, weekKey, monthKey,
          W, H};
})();



/* ============================================================
   MPS RECOVERY — WEAPON 8: REPORTS & PROGRESSIVE UNLOCKS
   Locked per handoff v3.0 Part 14.
   Seven levels, each unlocking at a day threshold, each with a
   celebration that fires once and never again.
   ============================================================ */

const RecoveryReports = (function(){

  const RKEY = uid => `${__nsPrefix()}_reports_${uid}`;

  /* ---------- PART 14: the seven levels (locked) ---------- */
  const LEVELS = [
    {id:'weekly',    days:7,   title:'Weekly Report',      sparkles:1,
     headline:'Great Start!',
     message:'One week down. You have officially built your first recovery baseline.'},
    {id:'monthly',   days:30,  title:'Monthly Report',     sparkles:2,
     headline:'30 Days Complete',
     message:'You built your first month of recovery intelligence.'},
    {id:'vsmonth',   days:60,  title:'Month vs Month',     sparkles:3,
     headline:'Excellent Work!',
     message:'Two months complete. Now we can compare your progress.'},
    {id:'quarterly', days:90,  title:'Quarterly Report',   sparkles:4,
     headline:'90 Days Complete',
     message:'Patterns are no longer guesses. They are measurable.'},
    {id:'seasonal',  days:180, title:'Seasonal Report',    sparkles:5,
     headline:'Six Months Complete',
     message:'MPS can now identify seasonal recovery patterns.'},
    {id:'annual',    days:365, title:'Annual Report',      sparkles:6,
     headline:'One Full Year Complete',
     message:'You now have a complete picture of your recovery.'},
    {id:'lifetime',  days:730, title:'Lifetime Intelligence', sparkles:7,
     headline:'Remarkable',
     message:'Years of tracking have created a personalized recovery intelligence system.'}
  ];

  const SEASONS = ['Winter','Winter','Spring','Spring','Spring','Summer',
                   'Summer','Summer','Fall','Fall','Fall','Winter'];
  function seasonOf(iso){ return SEASONS[Number(iso.slice(5,7)) - 1]; }

  /* ---------- unlocking ---------- */
  function unlocked(dayCount){ return LEVELS.filter(l => dayCount >= l.days); }
  function locked(dayCount){   return LEVELS.filter(l => dayCount <  l.days); }
  function nextLevel(dayCount){ return locked(dayCount)[0] || null; }
  function highest(dayCount){
    const u = unlocked(dayCount);
    return u.length ? u[u.length-1] : null;
  }

  /* ---------- shared maths ---------- */
  const avg = a => a.length ? a.reduce((t,v)=>t+v,0)/a.length : 0;
  const r0  = n => Math.round(n);

  function summarise(rows){
    if (!rows.length) return null;
    const scores = rows.map(r=>r.recoveryScore);
    const out = {
      days: rows.length,
      averageScore: r0(avg(scores)),
      highestScore: Math.max(...scores),
      lowestScore:  Math.min(...scores),
      averageSleep: r0(avg(rows.map(r=>r.sleepDuration))),
      actionsCompleted: rows.filter(r=>r.actionCompleted).length
    };
    RecoveryScoring.SLIDERS.forEach(k => out[k] = Math.round(avg(rows.map(r=>r[k]))*10)/10);
    out.averageSleepLabel = RecoveryScoring.formatDuration(out.averageSleep);
    out.grade = RecoveryScoring.grade(out.averageScore);
    const best  = rows.reduce((a,b)=> b.recoveryScore > a.recoveryScore ? b : a);
    const worst = rows.reduce((a,b)=> b.recoveryScore < a.recoveryScore ? b : a);
    out.bestDay  = {date:best.date,  score:best.recoveryScore};
    out.worstDay = {date:worst.date, score:worst.recoveryScore};
    return out;
  }

  // Longest run of consecutive calendar days.
  function longestStreak(rows){
    const dates = rows.map(r=>r.date).sort();
    let best = 0, run = 0, prev = null;
    dates.forEach(d => {
      if (prev && Math.round((new Date(d) - new Date(prev))/86400000) === 1) run++;
      else run = 1;
      prev = d;
      if (run > best) best = run;
    });
    return best;
  }

  // Days logged against days elapsed across the tracked span.
  function consistency(rows){
    if (rows.length < 2) return 100;
    const dates = rows.map(r=>r.date).sort();
    const span = Math.round(
      (new Date(dates[dates.length-1]) - new Date(dates[0]))/86400000) + 1;
    return Math.min(100, Math.round(rows.length / span * 100));
  }

  function groupBy(rows, keyFn){
    const m = new Map();
    rows.forEach(r => {
      const k = keyFn(r);
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(r);
    });
    return m;
  }

  // Which metric moved most between two periods.
  function biggestMover(prevRows, currRows){
    if (!prevRows.length || !currRows.length) return null;
    let bestKey = null, bestDelta = 0;
    RecoveryScoring.SLIDERS.forEach(k => {
      const d = avg(currRows.map(r=>r[k])) - avg(prevRows.map(r=>r[k]));
      if (Math.abs(d) > Math.abs(bestDelta)){ bestDelta = d; bestKey = k; }
    });
    if (!bestKey) return null;
    return {metric:bestKey, label:RecoveryScoring.LABELS[bestKey],
            delta:Math.round(bestDelta*10)/10};
  }

  /* ---------- report building ---------- */
  // Each level layers onto the one below it, exactly as the spec stacks them.
  function build(levelId, allRows){
    const level = LEVELS.find(l => l.id === levelId);
    if (!level) return null;
    const rows = allRows.slice().sort((a,b)=> a.date < b.date ? -1 : 1);
    if (!rows.length) return null;

    const window = level.id === 'weekly'  ? rows.slice(-7)
                 : level.id === 'monthly' ? rows.slice(-30)
                 : rows;
    const rep = {
      level, title:level.title,
      summary: summarise(window),
      streak: longestStreak(rows),
      consistency: consistency(rows),
      sections: []
    };

    if (level.id === 'weekly'){
      rep.sections.push({label:'Daily trend',
        value:`${window.length} days, ${rep.summary.averageScore}% average`});
      rep.sections.push({label:'Best day',
        value:`${rep.summary.bestDay.date} at ${rep.summary.bestDay.score}%`});
      rep.sections.push({label:'Toughest day',
        value:`${rep.summary.worstDay.date} at ${rep.summary.worstDay.score}%`});
    }

    if (level.id === 'monthly'){
      const weeks = groupBy(window, r => RecoveryCharts.weekKey(r.date));
      rep.weeklyTrend = Array.from(weeks.entries())
        .map(([k,v]) => ({week:k, score:r0(avg(v.map(x=>x.recoveryScore)))}));
      rep.sections.push({label:'Monthly grade', value:rep.summary.grade});
      rep.sections.push({label:'Weeks covered', value:String(rep.weeklyTrend.length)});
      rep.sections.push({label:'Longest streak', value:`${rep.streak} days`});
      rep.sections.push({label:'Tracking consistency', value:`${rep.consistency}%`});
    }

    if (level.id === 'vsmonth'){
      const months = Array.from(groupBy(rows, r => r.date.slice(0,7)).entries())
        .sort((a,b)=> a[0] < b[0] ? -1 : 1);
      const curr = months[months.length-1], prev = months[months.length-2];
      if (prev){
        const a = summarise(prev[1]), b = summarise(curr[1]);
        rep.comparison = {
          previous:{key:prev[0], ...a}, current:{key:curr[0], ...b},
          scoreChange: b.averageScore - a.averageScore,
          sleepChange: b.averageSleep - a.averageSleep,
          mover: biggestMover(prev[1], curr[1])
        };
        rep.sections.push({label:`${prev[0]} average`, value:`${a.averageScore}%`});
        rep.sections.push({label:`${curr[0]} average`, value:`${b.averageScore}%`});
        rep.sections.push({label:'Change',
          value:`${rep.comparison.scoreChange >= 0 ? '+' : ''}${rep.comparison.scoreChange} points`});
        if (rep.comparison.mover) rep.sections.push({label:'Biggest mover',
          value:`${rep.comparison.mover.label} ${rep.comparison.mover.delta >= 0 ? '+' : ''}${rep.comparison.mover.delta}`});
      }
    }

    if (level.id === 'quarterly'){
      const months = Array.from(groupBy(rows, r => r.date.slice(0,7)).entries())
        .map(([k,v]) => ({key:k, score:r0(avg(v.map(x=>x.recoveryScore)))}))
        .sort((a,b)=> a.key < b.key ? -1 : 1);
      rep.months = months;
      const best = months.reduce((a,b)=> b.score > a.score ? b : a);
      const low  = months.reduce((a,b)=> b.score < a.score ? b : a);
      rep.sections.push({label:'3-month average', value:`${rep.summary.averageScore}%`});
      rep.sections.push({label:'Best month', value:`${best.key} at ${best.score}%`});
      rep.sections.push({label:'Lowest month', value:`${low.key} at ${low.score}%`});
      rep.sections.push({label:'Direction',
        value: months[months.length-1].score >= months[0].score ? 'Improving' : 'Slipping'});
    }

    if (level.id === 'seasonal'){
      const seasons = Array.from(groupBy(rows, r => seasonOf(r.date)).entries())
        .map(([k,v]) => ({season:k, score:r0(avg(v.map(x=>x.recoveryScore))), days:v.length}));
      rep.seasons = seasons;
      seasons.forEach(s => rep.sections.push(
        {label:s.season, value:`${s.score}% over ${s.days} days`}));
    }

    if (level.id === 'annual' || level.id === 'lifetime'){
      const months = Array.from(groupBy(rows, r => r.date.slice(0,7)).entries())
        .map(([k,v]) => ({key:k, score:r0(avg(v.map(x=>x.recoveryScore)))}))
        .sort((a,b)=> a.key < b.key ? -1 : 1);
      rep.months = months;
      const dist = {PRIMED:0, STRONG:0, FAIR:0, LOW:0, DRAINED:0, DEPLETED:0};
      rows.forEach(r => dist[r.recoveryStatus]++);
      rep.distribution = dist;
      rep.sections.push({label:'Annual grade', value:rep.summary.grade});
      rep.sections.push({label:'Yearly average', value:`${rep.summary.averageScore}%`});
      rep.sections.push({label:'Days tracked', value:String(rows.length)});
      rep.sections.push({label:'Longest streak', value:`${rep.streak} days`});
      rep.sections.push({label:'Actions completed', value:String(rep.summary.actionsCompleted)});

      if (level.id === 'lifetime'){
        const years = Array.from(groupBy(rows, r => r.date.slice(0,4)).entries())
          .map(([k,v]) => ({year:k, score:r0(avg(v.map(x=>x.recoveryScore))), days:v.length}))
          .sort((a,b)=> a.year < b.year ? -1 : 1);
        rep.years = years;
        const bestY = years.reduce((a,b)=> b.score > a.score ? b : a);
        const hardY = years.reduce((a,b)=> b.score < a.score ? b : a);
        rep.sections.push({label:'Best year', value:`${bestY.year} at ${bestY.score}%`});
        rep.sections.push({label:'Hardest year', value:`${hardY.year} at ${hardY.score}%`});
      }
    }
    return rep;
  }

  /* ---------- celebrations, fired once each ---------- */
  function loadCelebrated(userId){
    try { return JSON.parse(localStorage.getItem(RKEY(userId))) || []; }
    catch(e){ return []; }
  }
  function markCelebrated(userId, id){
    const seen = loadCelebrated(userId);
    if (seen.indexOf(id) === -1){
      seen.push(id);
      localStorage.setItem(RKEY(userId), JSON.stringify(seen));
    }
  }
  // The newest unlocked level that has not been celebrated yet.
  function pendingCelebration(dayCount, userId){
    const seen = loadCelebrated(userId || USER);
    const due  = unlocked(dayCount).filter(l => seen.indexOf(l.id) === -1);
    return due.length ? due[due.length-1] : null;
  }
  function clearCelebrated(userId){ localStorage.removeItem(RKEY(userId || USER)); }

  // Personalised line for the celebration card.
  function celebrationData(level, allRows){
    const rows = allRows.slice().sort((a,b)=> a.date < b.date ? -1 : 1);
    const half = Math.max(1, Math.floor(rows.length/2));
    const early = summarise(rows.slice(0, half));
    const late  = summarise(rows.slice(-half));
    if (!early || !late) return null;
    return {
      scoreFrom: early.averageScore, scoreTo: late.averageScore,
      sleepFrom: RecoveryScoring.formatDuration(early.averageSleep),
      sleepTo:   RecoveryScoring.formatDuration(late.averageSleep),
      mover: biggestMover(rows.slice(0, half), rows.slice(-half))
    };
  }

  return {LEVELS, unlocked, locked, nextLevel, highest, build, summarise,
          longestStreak, consistency, seasonOf, biggestMover,
          pendingCelebration, markCelebrated, loadCelebrated, clearCelebrated,
          celebrationData};
})();



/* ============================================================
   MPS RECOVERY — WEAPON 9: INSIGHTS & PROGRESS
   Locked per handoff v3.0 Part 10, sections 7 and 9.
   Insights explain today. Progress explains the long run.
   Both derive from stored records. Neither recalculates a score.
   ============================================================ */

const RecoveryInsights = (function(){

  const S = RecoveryScoring;
  const avg = a => a.length ? a.reduce((t,v)=>t+v,0)/a.length : 0;

  function prior(rows, date){
    return rows.filter(r => r.date < date).sort((a,b)=> a.date < b.date ? 1 : -1);
  }

  /* ---------- Part 10 section 7: insights ---------- */
  function build(rec, allRows){
    if (!rec) return null;
    const rows = (allRows||[]).slice().sort((a,b)=> a.date < b.date ? -1 : 1);
    const past = prior(rows, rec.date);
    const prev = past[0] || null;
    const out = [];

    // Highest and lowest metric today.
    const vals = S.SLIDERS.map(k => rec[k]);
    const hi = Math.max(...vals), lo = Math.min(...vals);
    out.push({key:'highest', label:'Strongest today',
      value:S.metricLabel(S.SLIDERS.filter(k=>rec[k]===hi).join('+')) + ` at ${hi}/10`});
    out.push({key:'lowest', label:'Weakest today',
      value:S.metricLabel(rec.lowestMetric) + ` at ${lo}/10`});

    // Biggest improvement and decline against the previous entry.
    if (prev){
      const deltas = S.SLIDERS.map(k => ({k, d: rec[k] - prev[k]}));
      const up   = deltas.reduce((a,b)=> b.d > a.d ? b : a);
      const down = deltas.reduce((a,b)=> b.d < a.d ? b : a);
      out.push({key:'improved', label:'Biggest improvement',
        value: up.d > 0 ? `${S.LABELS[up.k]} up ${up.d}` : 'Nothing improved today'});
      out.push({key:'declined', label:'Biggest decline',
        value: down.d < 0 ? `${S.LABELS[down.k]} down ${Math.abs(down.d)}`
                          : 'Nothing declined today'});
    }

    // Current pattern: how many recent days sit in the same tier.
    const recent = [rec].concat(past.slice(0,6));
    const sameStatus = recent.filter(r => r.recoveryStatus === rec.recoveryStatus).length;
    out.push({key:'pattern', label:'Current pattern',
      value: sameStatus > 1
        ? `${sameStatus} of your last ${recent.length} days are ${rec.recoveryStatus}`
        : `Today stands apart from your recent days`});

    // Recovery trend across the last 7 against the 7 before that.
    if (past.length >= 3){
      const last7  = [rec].concat(past.slice(0,6)).map(r=>r.recoveryScore);
      const prev7  = past.slice(6,13).map(r=>r.recoveryScore);
      const a = avg(last7), b = prev7.length ? avg(prev7) : avg(last7);
      const diff = Math.round(a - b);
      out.push({key:'trend', label:'Recovery trend',
        value: prev7.length === 0 ? `Averaging ${Math.round(a)}% so far`
             : diff > 2  ? `Rising, up ${diff} points on the previous stretch`
             : diff < -2 ? `Falling, down ${Math.abs(diff)} points on the previous stretch`
             : `Holding steady around ${Math.round(a)}%`});
    }
    return out;
  }

  /* ---------- Part 10 section 9: progress ---------- */
  // Consecutive days ending at the most recent entry.
  function currentStreak(rows){
    if (!rows.length) return 0;
    const dates = rows.map(r=>r.date).sort();
    let streak = 1;
    for (let i = dates.length - 1; i > 0; i--){
      const gap = Math.round(
        (new Date(dates[i]) - new Date(dates[i-1])) / 86400000);
      if (gap === 1) streak++; else break;
    }
    return streak;
  }

  function progress(allRows){
    const rows = (allRows||[]).slice().sort((a,b)=> a.date < b.date ? -1 : 1);
    if (!rows.length) return null;
    const scores = rows.map(r=>r.recoveryScore);
    const next = RecoveryReports.nextLevel(rows.length);

    return {
      average:  Math.round(avg(scores)),
      highest:  Math.max(...scores),
      lowest:   Math.min(...scores),
      currentStreak: currentStreak(rows),
      longestStreak: RecoveryReports.longestStreak(rows),
      consistency:   RecoveryReports.consistency(rows),
      weeklyAverage:  Math.round(avg(rows.slice(-7).map(r=>r.recoveryScore))),
      monthlyAverage: Math.round(avg(rows.slice(-30).map(r=>r.recoveryScore))),
      daysTracked: rows.length,
      actionsCompleted: rows.filter(r=>r.actionCompleted).length,
      nextMilestone: next
        ? {title:next.title, days:next.days, remaining:next.days - rows.length}
        : null
    };
  }

  return {build, progress, currentStreak};
})();



/* ══════════════════════════════════════════════════════════════════════════════
   MPS RECOVERY — PERSONAL BASELINES
   Judges every metric against YOUR OWN normal instead of a fixed table. Six hours
   may be genuinely fine for one person and terrible for another; a fixed "7 to 8
   is optimal" rule cannot tell the difference.

   ADDITIVE BY DESIGN: this does NOT change recoveryScore. The v3.0 scoring spec is
   locked, and rewriting it would silently restate every historical score. Baselines
   provide CONTEXT ("40m below your normal") that the UI and coaching read.

   Robust statistics on purpose:
     centre = MEDIAN, not mean. One catastrophic night should not move your normal.
     spread = MAD x 1.4826 (a median-based stand-in for standard deviation), which
              is likewise unmoved by outliers.
   Two guards matter, and they are where naive versions break:
     1. MIN_N   - under ~2 weeks there is no meaningful personal normal, so callers
                  keep using the fixed spec. Between MIN_N and FULL_N `weight` ramps
                  0->1 so numbers ease in instead of lurching overnight.
     2. FLOOR   - a very consistent person has a spread near zero, which divides by
                  zero and turns a 5-minute difference into a screaming signal.
   Deterministic: no Date.now, no Math.random. Same history in, same answer out.
   ══════════════════════════════════════════════════════════════════════════════ */
const RecoveryBaseline = (function(){
  const WINDOW = 30;    // how many recent entries define "normal"
  const MIN_N  = 14;    // below this: no personalisation at all
  const FULL_N = 30;    // at/above this: fully personal
  const METRICS = ['sleepDuration','recoveryScore','sleepQuality','energy','mentalClarity','physicalRecovery','calmness'];
  // Smallest believable spread per metric (minutes for duration, points elsewhere).
  const FLOOR = { sleepDuration:20, recoveryScore:4, sleepQuality:0.6, energy:0.6,
                  mentalClarity:0.6, physicalRecovery:0.6, calmness:0.6 };

  function median(a){
    if(!a || !a.length) return null;
    const s = a.slice().sort(function(x,y){ return x-y; }), m = s.length >> 1;
    return s.length % 2 ? s[m] : (s[m-1] + s[m]) / 2;
  }
  function mad(a, med){ if(!a || !a.length) return 0; return median(a.map(function(v){ return Math.abs(v-med); })) || 0; }
  function nums(rows, key){
    const o = [];
    for (let i=0;i<rows.length;i++){
      const raw = (rows[i] || {})[key];
      // Coercion traps: `+null` is 0 and `+true` is 1, so a MISSING metric would sneak in as a
      // real zero-minute night and drag the median down. Only genuine numbers count.
      if (typeof raw !== 'number' && typeof raw !== 'string') continue;
      if (typeof raw === 'string' && raw.trim() === '') continue;
      const v = +raw;
      if (isFinite(v)) o.push(v);
    }
    return o;
  }

  /* Build the baseline. `excludeDate` keeps the day being judged out of its own
     normal, otherwise every entry drags the baseline toward itself. */
  function compute(history, excludeDate){
    const rows = (history||[]).filter(function(r){ return r && r.date && r.date !== excludeDate; }).slice(-WINDOW);
    const out = { n: rows.length, ready: rows.length >= MIN_N, weight: 0, metrics: {} };
    out.weight = out.ready ? Math.max(0, Math.min(1, (rows.length - MIN_N) / Math.max(1, FULL_N - MIN_N))) : 0;
    METRICS.forEach(function(k){
      const vals = nums(rows, k);
      if (vals.length < MIN_N) { out.metrics[k] = null; return; }
      const med = median(vals);
      out.metrics[k] = { median: med, spread: Math.max(mad(vals, med) * 1.4826, FLOOR[k] || 0.5), n: vals.length };
    });
    return out;
  }

  /* Distance from your normal in spreads. Clamped so one freak night cannot
     produce an absurd multiplier downstream. */
  function z(value, base){
    if (!base || !isFinite(value) || !isFinite(base.spread) || base.spread <= 0) return null;
    return Math.max(-3, Math.min(3, (value - base.median) / base.spread));
  }

  /* 0-100 where 50 is exactly your normal. Useful when a caller wants a
     personalised figure alongside the locked absolute score. */
  function relScore(value, base){
    const zz = z(value, base);
    return zz === null ? null : Math.max(0, Math.min(100, Math.round(50 + zz * 16.6)));
  }

  function fmtDur(mins){
    const m = Math.round(Math.abs(mins)), h = Math.floor(m/60), r = m % 60;
    return h ? (h + 'h ' + (r < 10 ? '0' : '') + r + 'm') : (r + 'm');
  }

  /* Plain-English context line, e.g. "38m below your normal". */
  function describe(key, value, base){
    if (!base || !isFinite(value)) return null;
    const diff = value - base.median, zz = z(value, base), isDur = key === 'sleepDuration';
    const near = zz !== null && Math.abs(zz) < 0.5;
    const amount = isDur ? fmtDur(diff) : String(Math.round(Math.abs(diff) * 10) / 10);
    return {
      diff: diff, z: zz, near: near,
      normal: isDur ? fmtDur(base.median) : Math.round(base.median * 10) / 10,
      text: near ? 'right at your normal'
                 : (amount + ' ' + (diff >= 0 ? 'above' : 'below') + ' your normal')
    };
  }

  return { compute: compute, z: z, relScore: relScore, describe: describe,
           fmtDur: fmtDur, WINDOW: WINDOW, MIN_N: MIN_N, FULL_N: FULL_N, METRICS: METRICS };
})();

/* ── Exports. USER and helpers stay private to this closure. ── */
window.RecoveryEngineConfig = RecoveryEngineConfig;
window.RecoveryScoring      = RecoveryScoring;
window.RecoveryActions      = RecoveryActions;
window.RecoveryCoaching     = RecoveryCoaching;
window.RecoveryCharts       = RecoveryCharts;
window.RecoveryReports      = RecoveryReports;
window.RecoveryInsights     = RecoveryInsights;
window.RecoveryBaseline     = RecoveryBaseline;
window.RecoveryEngineUser   = function(){ return USER; };

})(window);
