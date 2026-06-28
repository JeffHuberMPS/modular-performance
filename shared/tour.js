/* ============================================================
   MPS Interactive App Tour
   Runs INSIDE a tracker app (same-origin iframe). The hub calls
   window.startMpsTour() right after the intro popup is dismissed.
   It darkens the screen, rings the exact element to tap, shows an
   instruction, and waits for the tap before moving to the next step.
   Steps are picked automatically from the app's URL (/apps/<name>/).

   A step targets an element by:
     sel  → CSS selector (querySelector)            [stable apps]
     txt  → element whose trimmed text === txt      [React apps, no ids]
            (txtTag narrows the tag, default 'button')
     center:true → no element; a centered message    [general note]
   click:true  → advance when the user taps that element
   click:false → show a "Next" button instead
   ============================================================ */
(function () {
  'use strict';

  var TOURS = {
    workout: [
      { sel: '.tab[data-tab="dashboard"]', text: "First, your <b>Dashboard</b>. Here's what a couple weeks of training looks like — watch it scroll.", click: true },
      { pan: true,                          text: "Volume, your streak, recent lifts, trends — your whole training at a glance. This is your data once you've logged a while.", },
      { sel: '.tab[data-tab="today"]',     text: "Now here's how you build that. <b>Today</b> is where you log the session you're doing right now. Tap it.", click: true },
      { sel: '#add-split-btn',             text: "Tap <b>+ Add Split</b>. A “split” is a muscle group / training day — like Push, Pull, or Legs.", click: true },
      { sel: '#split-picker-select',       text: "Pick which split you're training from this dropdown, then tap Next.", click: false },
      { sel: '#split-picker-confirm',      text: "Tap <b>Add</b> to create that split.", click: true },
      { sel: '.ex-dropdown',               text: "<b>This is how you add exercises.</b> Use this dropdown to drop an exercise into the split — pick one (or type a custom one). Add one, then tap Next.", click: false },
      { sel: '.sets-grid input[type="number"]', text: "For each set, type the <b>Weight</b> you lifted here.", click: false },
      { sel: '.sets-grid input[type="text"]',   text: "And type your <b>Reps</b> right next to it.", click: false },
      { txt: '+ Set', txtTag: 'button',    text: "Tap <b>+ Set</b> under an exercise to log another set. That's the core loop — add exercise, enter weight + reps, repeat.", click: false },
      { sel: '#add-skill-btn',             text: "<b>+ Add Skill</b> logs skill work — mobility, technique, drills. Same idea as splits.", click: false },
      { sel: '#cond-cat-row',              text: "<b>Conditioning</b> — log your cardio here: running, sprints, or a cardio machine.", click: false },
      { sel: '#end-workout',               text: "When you're finished, <b>End Workout &amp; Save</b> logs the entire session at once.", click: false },
      { sel: '.tab[data-tab="history"]',   text: "Now the rest, left to right. <b>History</b> — every past session, saved to look back on.", click: true },
      { sel: '.tab[data-tab="prs"]',       text: "<b>PRs</b> — every personal record, tracked automatically as you get stronger.", click: true },
      { sel: '.tab[data-tab="plan"]',      text: "And <b>Plan</b> — build or follow a full training program here. That's the whole app — go log a set.", click: true }
    ],
    habits: [
      { txt: 'Dashboard',                   text: "First, your <b>Dashboard</b> — every habit's streak and strength. Watch it scroll.", click: true },
      { pan: true,                          text: "Your discipline at a glance: streaks, momentum, how each block is trending. This is what a couple weeks of checking the box looks like." },
      { sel: 'button:has(path[d="M12 20h9"])', text: "<b>These are just starter habits, not yours yet.</b> Tap the <b>pencil</b> on any habit to rename it, change its icon, or delete it. Make them your own.", click: false },
      { txt: 'Track', sel: '.log-tab',     text: "Now the <b>Track</b> tab — your daily check-in. Tap it.", click: true },
      { center: true,                       text: "Tap each habit to check it off as you do it. Miss one and that day restarts — that's the whole point.", click: false },
      { txt: 'Save Entry',                  text: "Hit <b>Save Entry</b> to lock the day in.", click: true },
      { txt: 'Insights',                    text: "<b>Insights</b> — your patterns: best days, weak spots, what's slipping.", click: true },
      { txt: 'Compound',                    text: "And <b>Compound</b> — how small daily reps stack into real change over time. That's the app.", click: true }
    ],
    sleep: [
      { txt: 'Dashboard',                   text: "First, your <b>Dashboard</b> — recovery score, sleep hours and trends. Watch it scroll.", click: true },
      { pan: true,                          text: "Your recovery at a glance: how you've slept and how recovered you are. This is a couple weeks of check-ins." },
      { txt: 'Insights',                    text: "<b>Insights</b> tells you when to push hard and when rest IS the training. Tap it.", click: true },
      { txt: 'Log',                         text: "And <b>Log</b> is where you check in each day. Tap it.", click: true },
      { txt: 'Log Entry',                   text: "Tap <b>Log Entry</b> to open today's form.", click: true },
      { center: true,                       text: "Set your <b>sleep &amp; wake times</b>, rate your <b>energy</b> and soreness, then <b>Save</b>. Your recovery score is figured out for you. That's it." }
    ],
    expenses: [
      { sel: '.tab[data-tab="dashboard"]', text: "First, your <b>Dashboard</b> — exactly where every dollar went, by category. Watch it scroll.", click: true },
      { pan: true,                          text: "Spending by category, your daily burn, the trend — a couple weeks of expenses at a glance." },
      { sel: '.tab[data-tab="log"]',       text: "<b>Log</b> — every expense in one place. Tap it.", click: true },
      { center: true,                       text: "Add an expense and it lands here, auto-sorted. Everything you spend, tracked in one list." },
      { sel: '.tab[data-tab="budget"]',    text: "<b>Budget</b> — set your monthly cap and recurring bills.", click: true },
      { sel: '.tab[data-tab="rules"]',     text: "<b>Rules</b> — auto-categorize expenses so logging is effortless.", click: true },
      { sel: '.tab[data-tab="insights"]',  text: "And <b>Insights</b> — finds the leaks in your spending. That's the tracker.", click: true }
    ],
    journal: [
      { txt: 'Write',                       text: "This is <b>Write</b> — your daily entry. Faith, wins, lessons. (Journal has no dashboard — your data lives in History.)", click: true },
      { center: true,                       text: "Write your reflection — five minutes is all it takes — then tap <b>Save Entry</b>.", click: false },
      { txt: 'History',                     text: "<b>History</b> keeps every past entry. Tap it — watch it scroll.", click: true },
      { pan: true,                          text: "Every entry you've written, saved to look back on. This is a couple weeks of journaling." },
      { txt: 'Insights',                    text: "<b>Insights</b> surfaces themes and patterns across your entries.", click: true },
      { txt: 'Check-In',                    text: "And <b>Check-In</b> — your weekly &amp; monthly review. That's the journal.", click: true }
    ],
    nutrition: [
      { sel: '.meal-head .add',             text: "Tap <b>+ Add Food</b> to log what you ate — search the built-in food list.", click: true },
      { sel: '.donut-wrap',                 text: "This ring is your <b>daily score</b> — protein, carbs, calories &amp; water. Tap it for the full breakdown.", click: true },
      { sel: '#datePick',                   text: "Use the <b>date picker</b> to log or review any day.", click: false },
      { center: true,                       text: "That's it — hit your numbers each day and the score takes care of itself.", click: false }
    ]
  };

  function appKey() { var m = (location.pathname || '').match(/\/apps\/([^\/]+)/); return m ? m[1] : null; }

  var els = {}, steps = [], idx = 0, target = null, clickHook = null, centerMode = false, panning = false;

  function mk(css) { var e = document.createElement('div'); e.style.cssText = css; document.body.appendChild(e); return e; }
  function setBox(e, x, y, w, h) { e.style.left = x + 'px'; e.style.top = y + 'px'; e.style.width = Math.max(0, w) + 'px'; e.style.height = Math.max(0, h) + 'px'; }

  function resolve(step) {
    if (step.txt) {
      var tag = step.txtTag || 'button', want = step.txt.trim().toLowerCase();
      var nodes = document.querySelectorAll(tag);
      for (var i = 0; i < nodes.length; i++) {
        var t = (nodes[i].textContent || '').trim().toLowerCase();
        if (t === want && nodes[i].offsetParent !== null) return nodes[i];
      }
    }
    if (step.sel) { var e = document.querySelector(step.sel); if (e) return e; }
    return null;
  }

  function build() {
    var panel = 'position:fixed;z-index:2147483600;background:rgba(8,8,8,0.74);';
    els.top = mk(panel); els.bottom = mk(panel); els.left = mk(panel); els.right = mk(panel);
    [els.top, els.bottom, els.left, els.right].forEach(function (p) {
      p.addEventListener('click', function (ev) { ev.stopPropagation(); ev.preventDefault(); }, true);
    });
    els.ring = mk('position:fixed;z-index:2147483601;border:2px solid #ffffff;border-radius:10px;box-shadow:0 0 0 3px rgba(255,255,255,0.30),0 0 22px rgba(255,255,255,0.55);pointer-events:none;transition:left .25s ease,top .25s ease,width .25s ease,height .25s ease;');
    els.tip = mk('position:fixed;z-index:2147483602;width:300px;max-width:calc(100vw - 24px);background:linear-gradient(180deg,#1c1b17,#0e0e0e);border:1px solid rgba(201,160,32,0.45);border-radius:14px;padding:15px 16px 14px;box-shadow:0 16px 44px rgba(0,0,0,0.7);font-family:Inter,system-ui,-apple-system,sans-serif;color:#ededed;');
    els.tip.innerHTML =
        '<div id="mpst-count" style="font-family:\'Bebas Neue\',sans-serif;letter-spacing:.12em;font-size:.66rem;color:#C9A020;margin-bottom:5px;"></div>'
      + '<div id="mpst-text" style="font-size:.92rem;line-height:1.45;margin-bottom:12px;"></div>'
      + '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;">'
      +   '<button id="mpst-skip" style="background:none;border:none;color:#8a8a8a;font-size:.78rem;cursor:pointer;padding:4px 2px;">Skip tour</button>'
      +   '<button id="mpst-next" style="background:#C9A020;color:#0a0a0a;border:none;border-radius:9px;padding:8px 18px;font-weight:800;font-size:.82rem;letter-spacing:.04em;cursor:pointer;">Next</button>'
      + '</div>';
    els.tip.querySelector('#mpst-skip').addEventListener('click', end);
    els.tip.querySelector('#mpst-next').addEventListener('click', next);
  }

  function place() {
    if (!els.top || panning) return;
    var W = window.innerWidth, H = window.innerHeight;
    if (centerMode || !target) {
      setBox(els.top, 0, 0, W, H); setBox(els.bottom, 0, 0, 0, 0); setBox(els.left, 0, 0, 0, 0); setBox(els.right, 0, 0, 0, 0);
      els.ring.style.width = '0'; els.ring.style.height = '0';
      var tw = els.tip.offsetWidth || 300, th = els.tip.offsetHeight || 150;
      els.tip.style.left = Math.max(12, (W - tw) / 2) + 'px';
      els.tip.style.top = Math.max(12, (H - th) / 2) + 'px';
      return;
    }
    var r = target.getBoundingClientRect(), pad = 6;
    var x = r.left - pad, y = r.top - pad, w = r.width + pad * 2, h = r.height + pad * 2;
    setBox(els.top, 0, 0, W, y);
    setBox(els.bottom, 0, y + h, W, H - (y + h));
    setBox(els.left, 0, y, x, h);
    setBox(els.right, x + w, y, W - (x + w), h);
    setBox(els.ring, x, y, w, h);
    var tipH = els.tip.offsetHeight || 150;
    var below = (y + h + 12 + tipH) <= H;
    els.tip.style.top = (below ? (y + h + 12) : Math.max(12, y - 12 - tipH)) + 'px';
    els.tip.style.left = Math.min(Math.max(12, r.left), W - (els.tip.offsetWidth || 300) - 12) + 'px';
  }

  function clearHook() { if (clickHook) { document.removeEventListener('click', clickHook, true); clickHook = null; } }

  // A "pan" step: no spotlight — slowly auto-scroll the whole screen top→bottom so the user
  // watches their (sample) data scroll by, then advance. Moderate speed: readable, not slow.
  function panStep(i, step) {
    panning = true; centerMode = true; target = null;
    setBox(els.top, 0, 0, 0, 0); setBox(els.bottom, 0, 0, 0, 0); setBox(els.left, 0, 0, 0, 0); setBox(els.right, 0, 0, 0, 0);
    els.ring.style.width = '0'; els.ring.style.height = '0';
    els.tip.querySelector('#mpst-count').textContent = 'STEP ' + (i + 1) + ' OF ' + steps.length;
    els.tip.querySelector('#mpst-text').innerHTML = step.text;
    els.tip.querySelector('#mpst-next').style.display = 'none';
    var tw = els.tip.offsetWidth || 300, th = els.tip.offsetHeight || 120;
    els.tip.style.left = Math.max(12, (window.innerWidth - tw) / 2) + 'px';
    els.tip.style.top = (window.innerHeight - th - 18) + 'px';
    var se = document.scrollingElement || document.documentElement;
    try { se.scrollTop = 0; } catch (e) {}
    var max = Math.max(0, se.scrollHeight - se.clientHeight);
    var done = function () { panning = false; if (idx === i) next(); };
    if (max < 30) return setTimeout(done, 1900);
    var dur = Math.min(9000, Math.max(5000, max * 8)), t0 = null;
    function frame(ts) {
      if (idx !== i || !els.top) { panning = false; return; }
      if (t0 === null) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur);
      se.scrollTop = max * p;
      if (p < 1) requestAnimationFrame(frame); else setTimeout(done, 800);
    }
    requestAnimationFrame(frame);
  }

  function show(i) {
    idx = i;
    var step = steps[i];
    if (!step) return end();
    clearHook();
    if (step.pan) return panStep(i, step);
    panning = false;
    centerMode = !!step.center;
    target = centerMode ? null : resolve(step);
    if (!centerMode && !target) {   // element not ready (e.g. a tab just switched) — wait, then skip if still gone
      return setTimeout(function () { target = resolve(step); if (!target) return next(); show(i); }, 500);
    }
    if (target) { try { target.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (e) {} }
    els.tip.querySelector('#mpst-count').textContent = 'STEP ' + (i + 1) + ' OF ' + steps.length;
    els.tip.querySelector('#mpst-text').innerHTML = step.text;
    var nextBtn = els.tip.querySelector('#mpst-next');
    if (step.click && target) {
      nextBtn.style.display = 'none';
      clickHook = function (ev) {
        if (target && (ev.target === target || target.contains(ev.target))) { clearHook(); setTimeout(next, 380); }
      };
      document.addEventListener('click', clickHook, true);
    } else {
      nextBtn.style.display = '';
      nextBtn.textContent = (i === steps.length - 1) ? 'Done' : 'Next';
    }
    setTimeout(place, 90);
  }

  function next() { if (idx + 1 >= steps.length) return end(); show(idx + 1); }

  function end() {
    clearHook();
    window.removeEventListener('scroll', place, true);
    window.removeEventListener('resize', place);
    ['top', 'bottom', 'left', 'right', 'ring', 'tip'].forEach(function (k) { if (els[k] && els[k].parentNode) els[k].parentNode.removeChild(els[k]); });
    els = {}; target = null; panning = false;
    try { localStorage.setItem('mps_tour_' + (appKey() || 'app'), '1'); } catch (e) {}
    // tell the hub the tour is over so it can wipe the sample data + reset the app to empty
    try { if (window.parent && window.parent !== window) window.parent.postMessage({ type: 'mps-tour-done', app: appKey() }, '*'); } catch (e) {}
  }

  window.startMpsTour = function () {
    var key = appKey(), list = key && TOURS[key];
    if (!list || !list.length) return;
    if (els.top) return;   // already running
    steps = list; idx = 0;
    build();
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    show(0);
  };
})();
